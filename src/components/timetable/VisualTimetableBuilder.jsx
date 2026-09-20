import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  getBranches,
  getStreams,
  getSessionTypes,
  getClassroomTypes,
  getTimetableConfig
} from "../admin/GeneralAdminView";
import {
  CalendarCheck,
  Plus,
  AlertTriangle,
  Printer,
  Share2,
  Lock,
  Unlock,
  Trash2,
  CheckCircle2,
  Building,
  Clock,
  Grid,
  Users,
  AlertCircle,
  HelpCircle,
  X
} from "lucide-react";

// Safe localStorage utility
const safeLS = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(fallback)
      ? (Array.isArray(parsed) ? parsed : fallback)
      : (parsed ?? fallback);
  } catch {
    return fallback;
  }
};

const saveLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const toMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const timesOverlap = (aS, aE, bS, bE) =>
  toMin(aS) < toMin(bE) && toMin(bS) < toMin(aE);

const generateTimeSlots = (start = "07:00", end = "21:00", interval = 30) => {
  const startM = toMin(start);
  const endM = toMin(end);
  const slots = [];
  for (let m = startM; m <= endM; m += interval) {
    const hh = Math.floor(m / 60).toString().padStart(2, "0");
    const mm = (m % 60).toString().padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots.length > 0
    ? slots
    : ["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];
};

// Effective stream for a subject in the context of a batch
const getEffectiveStream = (subjectId, batchId, batches, subjects) => {
  const batch = (batches || []).find((b) => b.id === batchId);
  const bsub = (batch?.batchSubjects || []).find((s) => s.subjectId === subjectId);
  if (bsub?.streamOverride) return bsub.streamOverride;
  const subject = (subjects || []).find((s) => s.id === subjectId);
  return subject?.stream || "elective";
};

// Returns true if two same-batch sessions CLASH (hard block)
const isSameBatchClash = (sessA, sessB, batches, subjects) => {
  if (sessA.batchId !== sessB.batchId) return false;
  if (!timesOverlap(sessA.startTime, sessA.endTime, sessB.startTime, sessB.endTime)) return false;

  const streamA = getEffectiveStream(sessA.subjectId, sessA.batchId, batches, subjects);
  const streamB = getEffectiveStream(sessB.subjectId, sessB.batchId, batches, subjects);

  // Compulsory clashes with everything
  if (streamA === "compulsory" || streamB === "compulsory") return true;
  // Same non-compulsory stream clashes
  if (streamA === streamB) return true;
  // Science + Commerce = ALLOWED (split stream)
  if (
    (streamA === "science" && streamB === "commerce") ||
    (streamA === "commerce" && streamB === "science")
  ) {
    return false;
  }
  // Elective clashes with everything
  return true;
};

// Returns true if a custom no-clash rule forbids the pair
const violatesCustomRule = (sessA, sessB, batches) => {
  const batch = (batches || []).find((b) => b.id === sessA.batchId);
  if (!batch || sessA.batchId !== sessB.batchId) return false;
  return (batch.noClashRules || []).some(
    (r) =>
      (r.subjectAId === sessA.subjectId && r.subjectBId === sessB.subjectId) ||
      (r.subjectAId === sessB.subjectId && r.subjectBId === sessA.subjectId)
  );
};

// Returns true if lecturer is available for a given day + time
const isLecturerAvailable = (lecturerId, day, startTime, endTime, users) => {
  const lecturer = (users || []).find((u) => u.id === lecturerId);
  if (!lecturer?.availability || !Array.isArray(lecturer.availability)) return true;
  const avail = lecturer.availability.find((a) => a.day === day);
  if (!avail || !avail.isAvailable) return false;
  return toMin(startTime) >= toMin(avail.from) && toMin(endTime) <= toMin(avail.to);
};

// Master clash detector
const detectClashes = (sessions, newSess, excludeId, batches, subjects, users) => {
  const others = (sessions || []).filter(
    (s) => s.id !== excludeId && s.day === newSess.day
  );

  const sameBatchStreamClash =
    others.find((s) => isSameBatchClash(s, newSess, batches, subjects)) || null;

  const customRuleViolation =
    others.find(
      (s) =>
        s.batchId === newSess.batchId &&
        timesOverlap(s.startTime, s.endTime, newSess.startTime, newSess.endTime) &&
        violatesCustomRule(s, newSess, batches)
    ) || null;

  const lecturerClash = newSess.lecturerId
    ? others.find(
        (s) =>
          s.lecturerId === newSess.lecturerId &&
          timesOverlap(s.startTime, s.endTime, newSess.startTime, newSess.endTime)
      ) || null
    : null;

  const assistantClash = newSess.assistantId
    ? others.find(
        (s) =>
          s.assistantId === newSess.assistantId &&
          timesOverlap(s.startTime, s.endTime, newSess.startTime, newSess.endTime)
      ) || null
    : null;

  const classroomClash = newSess.classroomId
    ? others.find(
        (s) =>
          s.classroomId === newSess.classroomId &&
          timesOverlap(s.startTime, s.endTime, newSess.startTime, newSess.endTime)
      ) || null
    : null;

  const lecturerUnavailable =
    newSess.lecturerId && newSess.day && newSess.startTime
      ? !isLecturerAvailable(newSess.lecturerId, newSess.day, newSess.startTime, newSess.endTime, users)
      : false;

  const hardBlock = sameBatchStreamClash || customRuleViolation;

  return {
    hardBlock,
    sameBatchStreamClash,
    customRuleViolation,
    lecturerClash,
    assistantClash,
    classroomClash,
    lecturerUnavailable
  };
};

const DEFAULT_CLASSROOMS = [
  { id: "cls-1", name: "Hall A", capacity: 40, type: "Hall", branch: "Kohuwala", facilities: ["Projector", "AC", "Whiteboard"], isActive: true, createdAt: new Date().toISOString() },
  { id: "cls-2", name: "Hall B", capacity: 35, type: "Hall", branch: "Wattala", facilities: ["Projector", "AC"], isActive: true, createdAt: new Date().toISOString() },
  { id: "cls-3", name: "Lab 01", capacity: 30, type: "Lab", branch: "Kohuwala", facilities: ["Computer", "AC", "Whiteboard"], isActive: true, createdAt: new Date().toISOString() },
  { id: "cls-4", name: "Room 3B", capacity: 25, type: "Room", branch: "Panadura", facilities: ["Whiteboard"], isActive: true, createdAt: new Date().toISOString() }
];

const DEFAULT_SESSIONS = [
  {
    id: "sess-1",
    day: "Monday",
    startTime: "08:00",
    endTime: "10:00",
    batchId: "batch-1",
    subjectId: "subj-1",
    classroomId: "cls-1",
    lecturerId: "lec-101",
    assistantId: null,
    branch: "Kohuwala",
    isRecurring: true,
    sessionType: "Class",
    notes: "Weekly lecture",
    color: "#2B6CB0",
    isLocked: false,
    createdAt: new Date().toISOString()
  }
];

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
};

const getDatesForWeek = (mondayDate) => {
  const dates = [];
  const start = new Date(mondayDate + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

const shouldShowSession = (session, weekStartDate) => {
  const weekDates = getDatesForWeek(weekStartDate);
  const daysArr = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const sessionDayIndex = daysArr.indexOf(session.day?.toLowerCase());
  if (sessionDayIndex === -1) return true;
  const sessionDate = weekDates[sessionDayIndex];

  if (session.recurrence === "once") {
    return session.specificDate === sessionDate;
  }

  if (session.recurrence === "weekly") {
    if (session.recurrenceStartDate && sessionDate < session.recurrenceStartDate) return false;
    if (session.recurrenceEndDate && sessionDate > session.recurrenceEndDate) return false;
    return true;
  }

  if (session.recurrence === "biweekly") {
    if (session.recurrenceStartDate && sessionDate < session.recurrenceStartDate) return false;
    if (session.recurrenceEndDate && sessionDate > session.recurrenceEndDate) return false;
    const startRef = session.recurrenceStartDate || "2025-01-01";
    const weeksDiff = Math.floor(
      (new Date(sessionDate + "T00:00:00") - new Date(startRef + "T00:00:00")) / (7 * 24 * 60 * 60 * 1000)
    );
    return weeksDiff % 2 === 0;
  }

  return true;
};

export const VisualTimetableBuilder = ({ initialClassroomId = "All", onOpenBatchManager = null }) => {
  const { data } = useApp();

  const [weekStartDate, setWeekStartDate] = useState(() => getMonday(new Date()));

  const [sessions, setSessions] = useState(() => {
    let loaded = safeLS("pba_timetable_sessions", []);
    if (!loaded || loaded.length === 0) loaded = DEFAULT_SESSIONS;

    let needsSave = false;
    const migrated = loaded.map((s) => {
      if (!s.recurrence) {
        needsSave = true;
        return {
          ...s,
          recurrence: "weekly",
          recurrenceStartDate: s.recurrenceStartDate || null,
          recurrenceEndDate: s.recurrenceEndDate || null,
          specificDate: s.specificDate || null
        };
      }
      return s;
    });

    if (needsSave) {
      saveLS("pba_timetable_sessions", migrated);
    }
    return migrated;
  });

  const [batches, setBatches] = useState(() => safeLS("pba_batches", []));
  const [subjects, setSubjects] = useState(() => safeLS("pba_subjects", []));
  const [classrooms, setClassrooms] = useState(() => {
    const loaded = safeLS("pba_classrooms", []);
    if (loaded && loaded.length > 0) return loaded;
    return DEFAULT_CLASSROOMS;
  });
  const [pbaUsers, setPbaUsers] = useState(() => safeLS("pba_users", []));

  useEffect(() => {
    const interval = setInterval(() => {
      setBatches(safeLS("pba_batches", []));
      setSubjects(safeLS("pba_subjects", []));
      setClassrooms(safeLS("pba_classrooms", DEFAULT_CLASSROOMS));
      setPbaUsers(safeLS("pba_users", []));

      const raw = safeLS("pba_timetable_sessions", DEFAULT_SESSIONS);
      const migrated = (raw || []).map((s) => ({
        ...s,
        recurrence: s.recurrence || "weekly",
        recurrenceStartDate: s.recurrenceStartDate || null,
        recurrenceEndDate: s.recurrenceEndDate || null,
        specificDate: s.specificDate || null
      }));
      setSessions(migrated);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Timetable settings
  const ttConfig = getTimetableConfig();
  const timeSlots = generateTimeSlots(ttConfig.startTime, ttConfig.endTime, ttConfig.slotMinutes || 30);
  const daysFull = ttConfig.workingDays && ttConfig.workingDays.length > 0 ? ttConfig.workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const daysMonWed = daysFull.slice(0, 3);
  const daysThuSat = daysFull.slice(3);

  // Toolbar state
  const [activeBatchId, setActiveBatchId] = useState("all");
  const [dayRange, setDayRange] = useState("Full Week");
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterClassroom, setFilterClassroom] = useState(initialClassroomId);

  // Popovers & Modals
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [slotTooltip, setSlotTooltip] = useState(null);

  const [sessionForm, setSessionForm] = useState({
    batchId: "",
    subjectId: "",
    lecturerId: "",
    assistantId: "",
    day: daysFull[0] || "Monday",
    startTime: ttConfig.startTime || "08:00",
    endTime: "10:00",
    classroomId: "",
    sessionType: getSessionTypes()[0]?.id || "Class",
    branch: getBranches()[0] || "Kohuwala",
    notes: "",
    isLocked: false,
    recurrence: "weekly",
    recurrenceStartDate: "",
    recurrenceEndDate: "",
    specificDate: ""
  });

  // Calculate day columns
  const activeDays =
    dayRange === "Mon–Wed"
      ? daysMonWed
      : dayRange === "Thu–Sat"
      ? daysThuSat
      : daysFull;

  // Combine users
  const allLecturers = Array.from(
    new Map(
      [...pbaUsers, ...(data?.lecturers || [])]
        .filter((u) => u.role === "Lecturer" || u.role === "Assistant" || u.subjectsTaught)
        .map((u) => [u.id, u])
    ).values()
  );

  // Year Plan state for Holiday Blackout
  const [yearPlanEvents, setYearPlanEvents] = useState(() => safeLS("pba_year_plan", []));

  // Print / Export Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPrintOverlay, setShowPrintOverlay] = useState(false);
  const [printForm, setPrintForm] = useState({
    viewBy: "batch",
    selectedId: "all",
    mondayDate: (() => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff)).toISOString().split("T")[0];
    })(),
    format: "print"
  });

  const getDayDateStr = (dayName, mondayStr = weekStartDate) => {
    const daysMap = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };
    const offset = daysMap[dayName] ?? 0;
    const base = new Date(mondayStr + "T00:00:00");
    base.setDate(base.getDate() + offset);
    return base.toISOString().split("T")[0];
  };

  const getHolidayForDay = (dayName, mondayStr = weekStartDate) => {
    const dateStr = getDayDateStr(dayName, mondayStr);
    return yearPlanEvents.find((e) => {
      if (e.type !== "Holiday") return false;
      if (e.date && e.date === dateStr) return true;
      if (e.startDate && e.endDate) {
        return dateStr >= e.startDate && dateStr <= e.endDate;
      }
      return false;
    });
  };

  // CSV Generator for Timetable
  const handleGenerateTimetableCSV = () => {
    const headers = ["DAY", "DATE", "TIME", "SUBJECT", "BATCH", "LECTURER", "CLASSROOM", "BRANCH"];
    const rows = [];

    activeDays.forEach(day => {
      const dateStr = getDayDateStr(day, printForm.mondayDate);
      const daySessions = sessions.filter(s => {
        if (s.day !== day) return false;
        if (printForm.viewBy === "batch" && printForm.selectedId !== "all" && s.batchId !== printForm.selectedId) return false;
        if (printForm.viewBy === "lecturer" && printForm.selectedId !== "all" && s.lecturerId !== printForm.selectedId) return false;
        if (printForm.viewBy === "classroom" && printForm.selectedId !== "all" && s.classroomId !== printForm.selectedId) return false;
        return true;
      });

      daySessions.forEach(s => {
        rows.push([
          day,
          dateStr,
          `${s.startTime} - ${s.endTime}`,
          `"${s.subjectName || ""}"`,
          `"${s.batchName || ""}"`,
          `"${s.lecturerName || ""}"`,
          `"${s.classroomName || ""}"`,
          `"${s.branch || ""}"`
        ]);
      });
    });

    const selectedItemName = printForm.selectedId === "all" ? "All" : (
      printForm.viewBy === "batch" ? batches.find(b => b.id === printForm.selectedId)?.name :
      printForm.viewBy === "lecturer" ? allLecturers.find(l => l.id === printForm.selectedId)?.name :
      classrooms.find(c => c.id === printForm.selectedId)?.name
    ) || "Selected";

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timetable-${printForm.viewBy}-${selectedItemName.replace(/\s+/g, "_")}-week-${printForm.mondayDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Save session handler
  const handleSaveSession = (e) => {
    e.preventDefault();
    const batch = batches.find((b) => b.id === sessionForm.batchId);
    const subj = subjects.find((s) => s.id === sessionForm.subjectId);
    const cls = classrooms.find((c) => c.id === sessionForm.classroomId);
    const lec = allLecturers.find((u) => u.id === sessionForm.lecturerId);

    const newSessObj = {
      id: editingSession ? editingSession.id : "sess-" + Date.now(),
      day: sessionForm.day,
      startTime: sessionForm.startTime,
      endTime: sessionForm.endTime,
      batchId: sessionForm.batchId,
      batchName: batch?.name || "Batch",
      subjectId: sessionForm.subjectId,
      subjectName: subj?.name || "Subject",
      classroomId: sessionForm.classroomId,
      classroomName: cls?.name || "Room",
      lecturerId: sessionForm.lecturerId,
      lecturerName: lec?.name || "Lecturer",
      assistantId: sessionForm.assistantId || null,
      branch: sessionForm.branch || batch?.branch || getBranches()[0] || "Kohuwala",
      isRecurring: sessionForm.recurrence !== "once",
      recurrence: sessionForm.recurrence || "weekly",
      recurrenceStartDate: sessionForm.recurrenceStartDate || null,
      recurrenceEndDate: sessionForm.recurrenceEndDate || null,
      specificDate: sessionForm.specificDate || null,
      sessionType: sessionForm.sessionType || "Class",
      notes: sessionForm.notes || "",
      color: batch?.color || "#2B6CB0",
      isLocked: sessionForm.isLocked || false,
      createdAt: editingSession ? editingSession.createdAt : new Date().toISOString()
    };

    const clashResult = detectClashes(
      sessions,
      newSessObj,
      editingSession ? editingSession.id : null,
      batches,
      subjects,
      allLecturers
    );

    if (clashResult.hardBlock) {
      return;
    }

    let updated;
    if (editingSession) {
      updated = sessions.map((s) => (s.id === editingSession.id ? newSessObj : s));
    } else {
      updated = [...sessions, newSessObj];
    }

    setSessions(updated);
    saveLS("pba_timetable_sessions", updated);
    setShowModal(false);
  };

  const handleDeleteSession = (id) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveLS("pba_timetable_sessions", updated);
    setShowModal(false);
  };

  const handleOpenAddModal = (day = daysFull[0] || "Monday", startTime = ttConfig.startTime || "08:00") => {
    const defaultBatch = activeBatchId !== "all" ? batches.find((b) => b.id === activeBatchId) : batches[0];
    const defaultBatchId = defaultBatch?.id || "";
    const defaultSubj = defaultBatch?.batchSubjects?.[0];
    const defaultSubjId = defaultSubj?.subjectId || subjects[0]?.id || "";
    const defaultLecId = defaultSubj?.mainLecturerId || "";
    const defaultAsstId = defaultSubj?.assistantId || "";
    const defaultRec = defaultSubj?.defaultRecurrence || "weekly";

    const endH = (parseInt(startTime.split(":")[0]) + 2).toString().padStart(2, "0");
    const endTime = `${endH}:00`;

    setEditingSession(null);
    setSessionForm({
      batchId: defaultBatchId,
      subjectId: defaultSubjId,
      lecturerId: defaultLecId,
      assistantId: defaultAsstId,
      day: day,
      startTime: startTime,
      endTime: endTime,
      classroomId: classrooms[0]?.id || "",
      sessionType: getSessionTypes()[0]?.id || "Class",
      branch: defaultBatch?.branch || getBranches()[0] || "Kohuwala",
      notes: "",
      isLocked: false,
      recurrence: defaultRec,
      recurrenceStartDate: "",
      recurrenceEndDate: "",
      specificDate: getDayDateStr(day, weekStartDate)
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (sess) => {
    if (sess.isLocked) {
      setSlotTooltip({ text: `🔒 ${sess.subjectName || "Session"} is locked. Unlock to edit.` });
      setTimeout(() => setSlotTooltip(null), 3000);
      return;
    }
    setEditingSession(sess);
    setSessionForm({
      batchId: sess.batchId || "",
      subjectId: sess.subjectId || "",
      lecturerId: sess.lecturerId || "",
      assistantId: sess.assistantId || "",
      day: sess.day || daysFull[0] || "Monday",
      startTime: sess.startTime || "08:00",
      endTime: sess.endTime || "10:00",
      classroomId: sess.classroomId || "",
      sessionType: sess.sessionType || getSessionTypes()[0]?.id || "Class",
      branch: sess.branch || getBranches()[0] || "Kohuwala",
      notes: sess.notes || "",
      isLocked: sess.isLocked || false,
      recurrence: sess.recurrence || "weekly",
      recurrenceStartDate: sess.recurrenceStartDate || "",
      recurrenceEndDate: sess.recurrenceEndDate || "",
      specificDate: sess.specificDate || getDayDateStr(sess.day || "Monday", weekStartDate)
    });
    setShowModal(true);
  };

  const filteredSessions = sessions.filter((s) => {
    const branchMatch = filterBranch === "All" || s.branch === filterBranch;
    const roomMatch = filterClassroom === "All" || s.classroomId === filterClassroom;
    const recurrenceMatch = shouldShowSession(s, weekStartDate);
    return branchMatch && roomMatch && recurrenceMatch;
  });

  const currentClashes = detectClashes(
    sessions,
    {
      ...sessionForm,
      batchId: sessionForm.batchId,
      subjectId: sessionForm.subjectId,
      lecturerId: sessionForm.lecturerId,
      assistantId: sessionForm.assistantId,
      classroomId: sessionForm.classroomId,
      day: sessionForm.day,
      startTime: sessionForm.startTime,
      endTime: sessionForm.endTime
    },
    editingSession ? editingSession.id : null,
    batches,
    subjects,
    allLecturers
  );

  const selectedBatch = batches.find((b) => b.id === activeBatchId);

  return (
    <div style={{ position: "relative" }}>
      {/* TOOLBAR */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E3E6EA",
          borderRadius: "12px",
          padding: "12px 18px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Week Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                const d = new Date(weekStartDate + 'T00:00:00');
                d.setDate(d.getDate() - 7);
                setWeekStartDate(getMonday(d));
              }}
              style={{
                padding: '5px 10px',
                background: '#FFFFFF',
                border: '1px solid #E3E6EA',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#4A5568',
                cursor: 'pointer'
              }}
            >
              ← Prev Week
            </button>

            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>
              Week of {new Date(weekStartDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>

            <button
              type="button"
              onClick={() => {
                const d = new Date(weekStartDate + 'T00:00:00');
                d.setDate(d.getDate() + 7);
                setWeekStartDate(getMonday(d));
              }}
              style={{
                padding: '5px 10px',
                background: '#FFFFFF',
                border: '1px solid #E3E6EA',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#4A5568',
                cursor: 'pointer'
              }}
            >
              Next Week →
            </button>
          </div>

          <select
            value={activeBatchId}
            onChange={(e) => setActiveBatchId(e.target.value)}
            style={{
              padding: "7px 12px",
              border: "1.5px solid #2B6CB0",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#2B6CB0",
              background: "#EBF4FF",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                Building: {b.name} ({b.code})
              </option>
            ))}
          </select>

          <div style={{ display: "flex", background: "#F0F2F5", padding: "3px", borderRadius: "8px" }}>
            {["Full Week", "Mon–Wed", "Thu–Sat"].map((r) => (
              <button
                key={r}
                onClick={() => setDayRange(r)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: dayRange === r ? 600 : 500,
                  background: dayRange === r ? "#FFFFFF" : "transparent",
                  color: dayRange === r ? "#1A202C" : "#718096",
                  cursor: "pointer",
                  boxShadow: dayRange === r ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "12px" }}
          >
            <option value="All">All Branches</option>
            {getBranches().map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "12px" }}
          >
            <option value="All">All Classrooms</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.branch})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Print / Export Button */}
          <button
            onClick={() => setShowPrintModal(true)}
            style={{
              background: "#D4A017",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Printer size={15} /> 🖨 Print / Export
          </button>
          <button
            onClick={() => setShowRulesPanel(!showRulesPanel)}
            title="Scheduling Rules Panel"
            style={{
              background: "#F0F2F5",
              border: "1px solid #E3E6EA",
              borderRadius: "8px",
              padding: "7px 11px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#4A5568",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <HelpCircle size={15} /> Rules
          </button>
          <button
            onClick={() => handleOpenAddModal()}
            style={{
              background: "linear-gradient(135deg, #2B6CB0, #1A4A8A)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Plus size={15} /> Add Session
          </button>
        </div>
      </div>

      {/* RULES PANEL POPOVER */}
      {showRulesPanel && (
        <div
          style={{
            position: "absolute",
            top: "60px",
            right: "18px",
            width: "340px",
            background: "#FFFFFF",
            border: "1px solid #E3E6EA",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            padding: "16px",
            zIndex: 100
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1A202C" }}>Scheduling Rules</h4>
            <button onClick={() => setShowRulesPanel(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}>
              <X size={16} />
            </button>
          </div>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #F0F2F5" }}>
                <td style={{ padding: "5px 0", color: "#C53030", fontWeight: 700 }}>⛔ HARD</td>
                <td style={{ padding: "5px 0", color: "#4A5568" }}>CORE subject running → no other class for batch</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #F0F2F5" }}>
                <td style={{ padding: "5px 0", color: "#C53030", fontWeight: 700 }}>⛔ HARD</td>
                <td style={{ padding: "5px 0", color: "#4A5568" }}>Two SCIENCE or COMMERCE classes simultaneously</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #F0F2F5" }}>
                <td style={{ padding: "5px 0", color: "#C53030", fontWeight: 700 }}>⛔ HARD</td>
                <td style={{ padding: "5px 0", color: "#4A5568" }}>Custom no-clash rule violation per batch</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #F0F2F5" }}>
                <td style={{ padding: "5px 0", color: "#276749", fontWeight: 700 }}>✓ VALID</td>
                <td style={{ padding: "5px 0", color: "#4A5568" }}>SCIENCE + COMMERCE simultaneously (split stream)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #F0F2F5" }}>
                <td style={{ padding: "5px 0", color: "#B7860A", fontWeight: 700 }}>⚠ WARN</td>
                <td style={{ padding: "5px 0", color: "#4A5568" }}>Same lecturer double-booked at same time</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #F0F2F5" }}>
                <td style={{ padding: "5px 0", color: "#B7860A", fontWeight: 700 }}>⚠ WARN</td>
                <td style={{ padding: "5px 0", color: "#4A5568" }}>Lecturer teaching outside availability window</td>
              </tr>
            </tbody>
          </table>
          {onOpenBatchManager && (
            <button
              onClick={() => {
                setShowRulesPanel(false);
                onOpenBatchManager();
              }}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "6px",
                background: "#EBF4FF",
                color: "#2B6CB0",
                border: "1px solid #BEE3F8",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Manage Rules in Batch Manager →
            </button>
          )}
        </div>
      )}

      {/* BATCH BUILD PROGRESS BAR */}
      {selectedBatch && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E3E6EA",
            borderRadius: "10px",
            padding: "12px 18px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: selectedBatch.color || "#2B6CB0" }} />
            <strong style={{ fontSize: "14px", color: "#1A202C" }}>{selectedBatch.name}</strong>
          </div>
          {(() => {
            const batchSubs = selectedBatch.batchSubjects || [];
            const schedSubIds = new Set(
              sessions.filter((s) => s.batchId === selectedBatch.id).map((s) => s.subjectId)
            );
            const schedCount = batchSubs.filter((bs) => schedSubIds.has(bs.subjectId)).length;
            const pct = Math.round((schedCount / (batchSubs.length || 1)) * 100);

            return (
              <>
                <div style={{ fontSize: "12px", color: "#718096" }}>
                  Scheduled: <strong>{schedCount}</strong> / {batchSubs.length} Subjects
                </div>
                <div style={{ flex: 1, minWidth: "100px", background: "#EDF2F7", borderRadius: "10px", height: "8px", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, background: selectedBatch.color || "#2B6CB0", height: "100%", transition: "width 0.3s" }} />
                </div>
                {pct === 100 && (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#276749", background: "#F0FFF4", padding: "2px 8px", borderRadius: "12px", border: "1px solid #9AE6B4" }}>
                    ✓ Timetable Complete
                  </span>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* TOOLTIP NOTIFICATION */}
      {slotTooltip && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#2D3748",
            color: "#FFFFFF",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 1000
          }}
        >
          {slotTooltip.text}
        </div>
      )}

      {/* WEEKLY GRID */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E3E6EA",
          borderRadius: "12px",
          overflowX: "auto",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
        }}
      >
        <div style={{ minWidth: activeDays.length * 160 + 80 + "px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `80px repeat(${activeDays.length}, 1fr)`,
              borderBottom: "2px solid #E3E6EA",
              background: "#F8FAFC"
            }}
          >
            <div style={{ padding: "12px", fontSize: "11px", fontWeight: 700, color: "#718096", textAlign: "center" }}>TIME</div>
            {activeDays.map((day) => {
              const holiday = getHolidayForDay(day);
              return (
                <div
                  key={day}
                  style={{
                    padding: "10px 8px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1A202C",
                    textAlign: "center",
                    borderLeft: "1px solid #E3E6EA"
                  }}
                >
                  {holiday && (
                    <div
                      style={{
                        background: "#FFF3CD",
                        border: "1px solid #F6D860",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#B7860A",
                        textAlign: "center",
                        marginBottom: "4px"
                      }}
                    >
                      🏖 {holiday.title || holiday.name || "Holiday"}
                    </div>
                  )}
                  {day}
                </div>
              );
            })}
          </div>

          <div style={{ position: "relative" }}>
            {timeSlots.slice(0, -1).map((time, slotIdx) => {
              const nextTime = timeSlots[slotIdx + 1];
              return (
                <div
                  key={time}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `80px repeat(${activeDays.length}, 1fr)`,
                    height: "48px",
                    borderBottom: time.endsWith(":00") ? "1px solid #E3E6EA" : "1px dashed #F0F2F5"
                  }}
                >
                  <div style={{ padding: "4px 8px", fontSize: "10px", color: "#A0AEC0", textAlign: "right" }}>
                    {time.endsWith(":00") ? time : ""}
                  </div>

                  {activeDays.map((day) => {
                    const holiday = getHolidayForDay(day);
                    const isCellTakenByActiveBatch =
                      activeBatchId !== "all" &&
                      filteredSessions.some(
                        (s) => s.batchId === activeBatchId && s.day === day && timesOverlap(s.startTime, s.endTime, time, nextTime)
                      );

                    let cellBg =
                      activeBatchId !== "all"
                        ? isCellTakenByActiveBatch
                          ? (selectedBatch?.color || "#2B6CB0") + "18"
                          : "#F7F8FA"
                        : "transparent";

                    if (holiday) {
                      cellBg = "repeating-linear-gradient(45deg, #F9FAFB, #F9FAFB 4px, #F0F2F5 4px, #F0F2F5 8px)";
                    }

                    return (
                      <div
                        key={day}
                        onClick={() => {
                          if (isCellTakenByActiveBatch) {
                            setSlotTooltip({ text: `⛔ ${selectedBatch?.name || "Batch"} already has a class at this time` });
                            setTimeout(() => setSlotTooltip(null), 3000);
                          } else {
                            handleOpenAddModal(day, time);
                          }
                        }}
                        style={{
                          borderLeft: "1px solid #F0F2F5",
                          background: cellBg,
                          cursor: "pointer",
                          transition: "background 0.1s"
                        }}
                        onMouseEnter={(e) => {
                          if (!isCellTakenByActiveBatch && !holiday) e.currentTarget.style.background = "#EBF4FF";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = cellBg;
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}

            {activeDays.map((day, dayIdx) => {
              const daySessions = filteredSessions.filter((s) => s.day === day);
              const holiday = getHolidayForDay(day);

              return daySessions.map((sess) => {
                const startMin = toMin(sess.startTime);
                const endMin = toMin(sess.endTime);
                const gridStartMin = toMin(timeSlots[0]);
                const topPx = ((startMin - gridStartMin) / (ttConfig.slotMinutes || 30)) * 48;
                const heightPx = Math.max(36, ((endMin - startMin) / (ttConfig.slotMinutes || 30)) * 48 - 4);
                const colWidthPct = 100 / activeDays.length;
                const leftOffsetPct = (dayIdx / activeDays.length) * 100;

                const sameSlotSess = daySessions.filter(
                  (s) => s.id !== sess.id && s.batchId === sess.batchId && timesOverlap(s.startTime, s.endTime, sess.startTime, sess.endTime)
                );

                const streamA = getEffectiveStream(sess.subjectId, sess.batchId, batches, subjects);
                const isSplitStream =
                  sameSlotSess.length > 0 &&
                  sameSlotSess.every((other) => {
                    const streamB = getEffectiveStream(other.subjectId, other.batchId, batches, subjects);
                    return (
                      (streamA === "science" && streamB === "commerce") ||
                      (streamA === "commerce" && streamB === "science")
                    );
                  });

                let widthStyle = `calc(${colWidthPct}% - 6px)`;
                let leftStyle = `calc(80px + ${leftOffsetPct}% + 3px)`;

                if (isSplitStream) {
                  const sortedPair = [sess, sameSlotSess[0]].sort((a, b) => a.id.localeCompare(b.id));
                  const isFirst = sortedPair[0].id === sess.id;
                  widthStyle = `calc(${colWidthPct / 2}% - 4px)`;
                  leftStyle = isFirst
                    ? `calc(80px + ${leftOffsetPct}% + 2px)`
                    : `calc(80px + ${leftOffsetPct + colWidthPct / 2}% + 2px)`;
                }

                const isDimmed = activeBatchId !== "all" && sess.batchId !== activeBatchId;

                const subject   = subjects.find(s => s.id === sess.subjectId);
                const batch     = batches.find(b => b.id === sess.batchId);
                const lecturer  = allLecturers.find(u => u.id === sess.lecturerId);
                const classroom = classrooms.find(c => c.id === sess.classroomId);

                const subjectName   = subject?.name   || '(No Subject)';
                const batchName     = batch?.name     || '(No Batch)';
                const lecturerName  = lecturer?.name  || '—';
                const classroomName = classroom?.name || '—';

                return (
                  <div
                    key={sess.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(sess);
                    }}
                    style={{
                      position: 'absolute',
                      left: leftStyle,
                      top: `${topPx + 2}px`,
                      width: widthStyle,
                      height: `${heightPx}px`,
                      background: '#FFFFFF',
                      border: '1.5px solid #BEE3F8',
                      borderLeft: `4px solid ${batch?.color || sess.color || '#2B6CB0'}`,
                      borderRadius: '6px',
                      padding: '5px 7px',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      cursor: sess.isLocked ? 'default' : 'pointer',
                      opacity: isDimmed ? 0.35 : 1,
                      zIndex: 10,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                    }}
                  >
                    {/* Stream badge + recurrence badge */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      {subject?.stream && (
                        <span style={{
                          fontSize: '9px', fontWeight: 800, padding: '1px 5px',
                          borderRadius: '8px',
                          background: subject.stream === 'compulsory' ? '#FFF5F5'
                                    : subject.stream === 'science'    ? '#F0FFF4'
                                    : subject.stream === 'commerce'   ? '#FFFBEB'
                                    : '#FAF5FF',
                          color: subject.stream === 'compulsory' ? '#C53030'
                               : subject.stream === 'science'    ? '#276749'
                               : subject.stream === 'commerce'   ? '#B7860A'
                               : '#6B46C1',
                          textTransform: 'uppercase'
                        }}>
                          {subject.stream === 'compulsory' ? 'CORE'
                           : subject.stream === 'science'  ? 'SCI'
                           : subject.stream === 'commerce' ? 'COM' : 'ELC'}
                        </span>
                      )}
                      {sess.recurrence === 'weekly' && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700, padding: '1px 5px',
                          borderRadius: '8px', background: '#EBF4FF', color: '#2B6CB0'
                        }}>↻ Weekly</span>
                      )}
                      {sess.recurrence === 'biweekly' && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700, padding: '1px 5px',
                          borderRadius: '8px', background: '#FAF5FF', color: '#6B46C1'
                        }}>↻ Bi-weekly</span>
                      )}
                      {sess.isMakeup && (
                        <span style={{
                          fontSize: '8px', fontWeight: 800, padding: '1px 4px',
                          borderRadius: '3px', background: '#FFFBEB', color: '#B7860A'
                        }}>MAKE-UP</span>
                      )}
                      {sess.isLocked && (
                        <span style={{ fontSize: '10px' }}>🔒</span>
                      )}
                    </div>

                    {/* Subject name — MUST use resolved name, not literal "Subject" */}
                    <div style={{
                      fontSize: '12px', fontWeight: 700, color: '#1A202C',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {subjectName}
                    </div>

                    {/* Batch name */}
                    <div style={{
                      fontSize: '10px', color: '#4A5568', marginTop: '1px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {batchName}
                    </div>

                    {/* Time */}
                    <div style={{ fontSize: '10px', color: '#2B6CB0', marginTop: '2px', fontWeight: 600 }}>
                      {sess.startTime}–{sess.endTime}
                    </div>

                    {/* Classroom · Lecturer (only if card is tall enough — height > 80px) */}
                    {heightPx > 80 && (
                      <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {classroomName} · {lecturerName}
                      </div>
                    )}
                    {heightPx > 80 && sess.assistantId && (
                      <div style={{ fontSize: '10px', color: '#B7860A', marginTop: '1px' }}>
                        Asst: {allLecturers.find(u => u.id === sess.assistantId)?.name || '—'}
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>

      {/* ADD / EDIT SESSION MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "580px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3E6EA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                {editingSession ? "Edit Session" : "Schedule a Session"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSession} style={{ padding: "20px 24px" }}>
              {currentClashes.hardBlock && (
                <div style={{ background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <AlertTriangle size={18} color="#C53030" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div style={{ fontSize: "12px", color: "#C53030", fontWeight: 600 }}>
                    ⛔ Cannot save: Hard clash detected for this batch at the selected time.
                  </div>
                </div>
              )}

              {!currentClashes.hardBlock &&
                (currentClashes.lecturerClash || currentClashes.assistantClash || currentClashes.classroomClash || currentClashes.lecturerUnavailable) && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "12px", color: "#92400E" }}>
                    <strong style={{ display: "block", marginBottom: "4px" }}>⚠ Scheduling Warnings (Allowed to save):</strong>
                    {currentClashes.lecturerClash && <div>• Lecturer is double-booked in another session at this time.</div>}
                    {currentClashes.assistantClash && <div>• Assistant is assigned elsewhere at this time.</div>}
                    {currentClashes.classroomClash && <div>• Classroom is booked for another session at this time.</div>}
                    {currentClashes.lecturerUnavailable && <div>• Lecturer is marked unavailable on this day/time.</div>}
                  </div>
                )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Batch</label>
                  <select
                    value={sessionForm.batchId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      const targetBatch = batches.find((b) => b.id === bId);
                      const sub = targetBatch?.batchSubjects?.[0];
                      setSessionForm({
                        ...sessionForm,
                        batchId: bId,
                        subjectId: sub?.subjectId || "",
                        lecturerId: sub?.mainLecturerId || "",
                        assistantId: sub?.assistantId || "",
                        branch: targetBatch?.branch || sessionForm.branch
                      });
                    }}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Subject</label>
                  <select
                    value={sessionForm.subjectId}
                    onChange={(e) => {
                      const sId = e.target.value;
                      const batch = batches.find((b) => b.id === sessionForm.batchId);
                      const bsub = batch?.batchSubjects?.find((s) => s.subjectId === sId);
                      setSessionForm({
                        ...sessionForm,
                        subjectId: sId,
                        lecturerId: bsub?.mainLecturerId || sessionForm.lecturerId,
                        assistantId: bsub?.assistantId || sessionForm.assistantId
                      });
                    }}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                  >
                    {(selectedBatch?.batchSubjects || []).map((bs) => {
                      const subObj = subjects.find((s) => s.id === bs.subjectId);
                      return (
                        <option key={bs.subjectId} value={bs.subjectId}>
                          {subObj?.name || bs.subjectId} ({subObj?.stream || "elective"})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Lecturer</label>
                  <select
                    value={sessionForm.lecturerId}
                    onChange={(e) => setSessionForm({ ...sessionForm, lecturerId: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                  >
                    <option value="">— Select Lecturer —</option>
                    {allLecturers.map((u) => {
                      const isAvail = isLecturerAvailable(u.id, sessionForm.day, sessionForm.startTime, sessionForm.endTime, allLecturers);
                      return (
                        <option key={u.id} value={u.id}>
                          {u.name} {u.branch ? `(${u.branch})` : ""} {!isAvail ? "• (Unavailable)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Assistant (Optional)</label>
                  <select
                    value={sessionForm.assistantId}
                    onChange={(e) => setSessionForm({ ...sessionForm, assistantId: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                  >
                    <option value="">— No Assistant —</option>
                    {allLecturers
                      .filter((u) => u.id !== sessionForm.lecturerId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role || "Assistant"})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Day</label>
                  <select
                    value={sessionForm.day}
                    onChange={(e) => setSessionForm({ ...sessionForm, day: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                  >
                    {daysFull.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Start Time</label>
                  <select
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                  >
                    {timeSlots.slice(0, -1).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>End Time</label>
                  <select
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                  >
                    {timeSlots.slice(1).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RECURRENCE SECTION */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "6px" }}>
                  Recurrence
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { id: "weekly", label: "↻ Weekly" },
                    { id: "biweekly", label: "↻ Bi-weekly" },
                    { id: "once", label: "⊙ One-time" }
                  ].map((r) => {
                    const isActive = (sessionForm.recurrence || "weekly") === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSessionForm({ ...sessionForm, recurrence: r.id })}
                        style={{
                          background: isActive ? "#EBF4FF" : "#F7F8FA",
                          border: isActive ? "1.5px solid #2B6CB0" : "1px solid #E3E6EA",
                          color: isActive ? "#2B6CB0" : "#718096",
                          borderRadius: "8px",
                          padding: "7px 14px",
                          fontSize: "12px",
                          fontWeight: isActive ? 700 : 600,
                          cursor: "pointer"
                        }}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>

                {/* CONDITIONAL FIELDS */}
                {((sessionForm.recurrence || "weekly") === "weekly" || sessionForm.recurrence === "biweekly") && (
                  <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>
                        START DATE (optional)
                      </label>
                      <input
                        type="date"
                        value={sessionForm.recurrenceStartDate || ""}
                        onChange={(e) => setSessionForm({ ...sessionForm, recurrenceStartDate: e.target.value })}
                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "12px", boxSizing: "border-box" }}
                      />
                      <div style={{ fontSize: "10px", color: "#A0AEC0", marginTop: "3px" }}>
                        Leave blank to start from the beginning of term
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>
                        END DATE (optional)
                      </label>
                      <input
                        type="date"
                        value={sessionForm.recurrenceEndDate || ""}
                        onChange={(e) => setSessionForm({ ...sessionForm, recurrenceEndDate: e.target.value })}
                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "12px", boxSizing: "border-box" }}
                      />
                      <div style={{ fontSize: "10px", color: "#A0AEC0", marginTop: "3px" }}>
                        Leave blank to run until end of academic year
                      </div>
                    </div>
                  </div>
                )}

                {sessionForm.recurrence === "once" && (
                  <div style={{ marginTop: "10px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>
                      CLASS DATE *
                    </label>
                    <input
                      type="date"
                      required
                      value={sessionForm.specificDate || ""}
                      onChange={(e) => {
                        const dateVal = e.target.value;
                        let dayName = sessionForm.day;
                        if (dateVal) {
                          const d = new Date(dateVal + "T00:00:00");
                          const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                          dayName = daysMap[d.getDay()] || sessionForm.day;
                        }
                        setSessionForm({ ...sessionForm, specificDate: dateVal, day: dayName });
                      }}
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "12px", boxSizing: "border-box" }}
                    />
                    <div style={{ fontSize: "10px", color: "#A0AEC0", marginTop: "3px" }}>
                      This session will only appear on this specific date
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Classroom</label>
                  <select
                    value={sessionForm.classroomId}
                    onChange={(e) => setSessionForm({ ...sessionForm, classroomId: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type}, Cap: {c.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Session Type</label>
                  <select
                    value={sessionForm.sessionType}
                    onChange={(e) => setSessionForm({ ...sessionForm, sessionType: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                  >
                    {getSessionTypes().map((st) => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#4A5568", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={sessionForm.isLocked}
                    onChange={(e) => setSessionForm({ ...sessionForm, isLocked: e.target.checked })}
                    style={{ accentColor: "#2B6CB0" }}
                  />
                  🔒 Lock session (prevents accidental edits on the grid)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E3E6EA", paddingTop: "14px" }}>
                {editingSession ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(editingSession.id)}
                    style={{ background: "#FFF5F5", color: "#C53030", border: "1px solid #FEB2B2", borderRadius: "7px", padding: "7px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Delete Session
                  </button>
                ) : (
                  <div />
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ background: "#FFFFFF", color: "#4A5568", border: "1px solid #E3E6EA", borderRadius: "7px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={currentClashes.hardBlock}
                    style={{
                      background: currentClashes.hardBlock ? "#A0AEC0" : "linear-gradient(135deg, #2B6CB0, #1A4A8A)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "7px",
                      padding: "7px 16px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: currentClashes.hardBlock ? "not-allowed" : "pointer"
                    }}
                  >
                    Save Session
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT OPTIONS MODAL */}
      {showPrintModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>Print / Export Timetable</h3>
              <button onClick={() => setShowPrintModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}>
                <X size={18} />
              </button>
            </div>

            {/* 1. VIEW BY */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "6px" }}>View By</label>
              <div style={{ display: "flex", background: "#F0F2F5", padding: "3px", borderRadius: "8px" }}>
                {[
                  { id: "batch", label: "By Batch" },
                  { id: "lecturer", label: "By Lecturer" },
                  { id: "classroom", label: "By Classroom" }
                ].map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setPrintForm({ ...printForm, viewBy: v.id, selectedId: "all" })}
                    style={{
                      flex: 1,
                      padding: "6px",
                      borderRadius: "6px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: printForm.viewBy === v.id ? 700 : 500,
                      background: printForm.viewBy === v.id ? "#FFFFFF" : "transparent",
                      color: printForm.viewBy === v.id ? "#2B6CB0" : "#718096",
                      cursor: "pointer"
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. SELECT ITEM */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>
                Select {printForm.viewBy === "batch" ? "Batch" : printForm.viewBy === "lecturer" ? "Lecturer" : "Classroom"}
              </label>
              <select
                value={printForm.selectedId}
                onChange={(e) => setPrintForm({ ...printForm, selectedId: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px", background: "#FFF" }}
              >
                <option value="all">All {printForm.viewBy === "batch" ? "Batches" : printForm.viewBy === "lecturer" ? "Lecturers" : "Classrooms"}</option>
                {printForm.viewBy === "batch" && batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                {printForm.viewBy === "lecturer" && allLecturers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                {printForm.viewBy === "classroom" && classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* 3. WEEK MONDAY DATE */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Week (Monday Date)</label>
              <input
                type="date"
                value={printForm.mondayDate}
                onChange={(e) => setPrintForm({ ...printForm, mondayDate: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
              />
            </div>

            {/* 4. FORMAT */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "6px" }}>Format</label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  { id: "print", label: "Print (PDF via browser)" },
                  { id: "csv", label: "Download CSV" }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPrintForm({ ...printForm, format: f.id })}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: printForm.format === f.id ? 700 : 500,
                      background: printForm.format === f.id ? "#EBF4FF" : "#F7F8FA",
                      color: printForm.format === f.id ? "#2B6CB0" : "#4A5568",
                      border: printForm.format === f.id ? "1.5px solid #93C5FD" : "1px solid #E3E6EA",
                      cursor: "pointer"
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #E3E6EA", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                style={{ padding: "8px 16px", background: "#FFF", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#4A5568", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPrintModal(false);
                  if (printForm.format === "csv") {
                    handleGenerateTimetableCSV();
                  } else {
                    setShowPrintOverlay(true);
                  }
                }}
                style={{ padding: "8px 20px", background: "#2B6CB0", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PRINT OVERLAY */}
      {showPrintOverlay && (
        <div style={{ position: "fixed", inset: 0, background: "#FFFFFF", zIndex: 9999, overflowY: "auto", padding: "20px" }}>
          <style>{`
            @media print {
              .no-print { display: none !important; }
              body { background: #fff !important; }
              @page { size: A4 landscape; margin: 10mm; }
            }
          `}</style>

          {/* Action Bar */}
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #E3E6EA" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>Timetable Print View</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => window.print()}
                style={{ padding: "8px 18px", background: "#D4A017", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                🖨 Print Timetable
              </button>
              <button
                onClick={() => setShowPrintOverlay(false)}
                style={{ padding: "8px 16px", background: "#F0F2F5", color: "#4A5568", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Printable Header */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800, color: "#1A202C" }}>
              {safeLS("pba_settings", {})?.instituteName || "PBA"} — Full-Time Timetable
            </h2>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#2B6CB0" }}>
              Weekly Timetable — By {printForm.viewBy.toUpperCase()}: {
                printForm.selectedId === "all" ? "All" : (
                  printForm.viewBy === "batch" ? batches.find(b => b.id === printForm.selectedId)?.name :
                  printForm.viewBy === "lecturer" ? allLecturers.find(l => l.id === printForm.selectedId)?.name :
                  classrooms.find(c => c.id === printForm.selectedId)?.name
                )
              }
            </div>
            <div style={{ fontSize: "11px", color: "#718096", marginTop: "4px" }}>
              Week of: {printForm.mondayDate} | Printed: {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Printable Grid Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr style={{ background: "#F0F2F5", border: "1px solid #CBD5E0" }}>
                <th style={{ padding: "8px", border: "1px solid #CBD5E0", width: "70px", textAlign: "center" }}>TIME</th>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                  <th key={d} style={{ padding: "8px", border: "1px solid #CBD5E0", textAlign: "center" }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {generateTimeSlots("07:00", "21:00", 30).slice(0, -1).map((time, idx, arr) => {
                const nextT = arr[idx + 1] || "21:00";
                return (
                  <tr key={time} style={{ height: "30px" }}>
                    <td style={{ padding: "4px", border: "1px solid #CBD5E0", textAlign: "center", fontWeight: 600, background: "#F8FAFC" }}>
                      {time}
                    </td>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                      const daySessList = sessions.filter(s => {
                        if (s.day !== day) return false;
                        if (!timesOverlap(s.startTime, s.endTime, time, nextT)) return false;
                        if (printForm.viewBy === "batch" && printForm.selectedId !== "all" && s.batchId !== printForm.selectedId) return false;
                        if (printForm.viewBy === "lecturer" && printForm.selectedId !== "all" && s.lecturerId !== printForm.selectedId) return false;
                        if (printForm.viewBy === "classroom" && printForm.selectedId !== "all" && s.classroomId !== printForm.selectedId) return false;
                        return true;
                      });

                      const holiday = getHolidayForDay(day, printForm.mondayDate);

                      return (
                        <td
                          key={day}
                          style={{
                            padding: "4px",
                            border: "1px solid #CBD5E0",
                            background: holiday ? "#FFFBEB" : daySessList.length > 0 ? "#FFFFFF" : "#F9FAFB",
                            verticalAlign: "top"
                          }}
                        >
                          {daySessList.map(s => (
                            <div key={s.id} style={{ borderLeft: `3px solid ${s.color || "#2B6CB0"}`, paddingLeft: "4px", marginBottom: "4px" }}>
                              <strong style={{ color: "#1A202C", display: "block" }}>{s.subjectName}</strong>
                              <span style={{ color: "#4A5568", display: "block" }}>{s.batchName}</span>
                              <span style={{ color: "#718096", display: "block" }}>{s.classroomName} · {s.lecturerName}</span>
                              <span style={{ color: "#2B6CB0", fontWeight: 700 }}>{s.startTime}–{s.endTime}</span>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
