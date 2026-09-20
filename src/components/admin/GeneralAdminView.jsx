import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { VisualTimetableBuilder } from "../timetable/VisualTimetableBuilder";
import { UserManagementTab } from "./UserManagementTab";
import { DataManagementTab } from "./DataManagementTab";
import { SubjectRegistryTab } from "./SubjectRegistryTab";
import {
  CalendarCheck,
  Grid,
  Calendar,
  Megaphone,
  Printer,
  Share2,
  Plus,
  Users,
  CheckCircle2,
  Database,
  BookOpen,
  Building,
  Edit,
  Trash2,
  AlertTriangle,
  Layers,
  ChevronRight,
  ChevronDown,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Check,
  X
} from "lucide-react";

import { T, theme, type as t } from "../../theme";

export const safeLS = (key, fallback = []) => {
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

export const saveLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export const DEFAULT_SETTINGS = {
  instituteName: "PBA",
  instituteSubtitle: "Full-Time Portal",
  tagline: "Empowering Academic Excellence",
  logoUrl: "",
  primaryColor: "#2B6CB0",
  accentColor: "#D4A017",
  successColor: "#276749",

  branches: [
    { id: "br-1", name: "Kohuwala", isActive: true },
    { id: "br-2", name: "Wattala", isActive: true },
    { id: "br-3", name: "Panadura", isActive: true }
  ],

  streams: [
    { id: "compulsory", label: "Compulsory", shortLabel: "CORE", bgColor: "#FFF5F5", textColor: "#C53030", description: "All students attend — blocks all other classes" },
    { id: "science", label: "Science", shortLabel: "SCI", bgColor: "#F0FFF4", textColor: "#276749", description: "Science-stream students only; can run alongside Commerce" },
    { id: "commerce", label: "Commerce", shortLabel: "COM", bgColor: "#FFFBEB", textColor: "#B7860A", description: "Commerce-stream students only; can run alongside Science" },
    { id: "elective", label: "Elective", shortLabel: "ELC", bgColor: "#FAF5FF", textColor: "#6B46C1", description: "Treated as compulsory — all remaining students attend" }
  ],

  sessionTypes: [
    { id: "Class", label: "Class", color: "#2B6CB0" },
    { id: "Lab", label: "Lab", color: "#276749" },
    { id: "Revision", label: "Revision", color: "#B7860A" },
    { id: "Exam", label: "Exam", color: "#C53030" },
    { id: "Event", label: "Event", color: "#6B46C1" }
  ],

  classroomTypes: [
    { id: "Hall", label: "Hall", bgColor: "#EBF4FF", textColor: "#2B6CB0" },
    { id: "Lab", label: "Lab", bgColor: "#F0FFF4", textColor: "#276749" },
    { id: "Room", label: "Room", bgColor: "#FEF3C7", textColor: "#B7860A" },
    { id: "Auditorium", label: "Auditorium", bgColor: "#FAF5FF", textColor: "#6B46C1" }
  ],

  facilities: [
    "Projector", "AC", "Whiteboard", "Smart Board", "Computer", "PA System"
  ],

  curricula: [
    "Cambridge", "Edexcel", "National", "Other"
  ],

  academicLevels: [
    "O Level", "A Level", "IGCSE", "AS Level", "Foundation", "Other"
  ],

  timetable: {
    startTime: "07:00",
    endTime: "21:00",
    slotMinutes: 30,
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    defaultSessionDuration: 120
  },

  academicYear: {
    current: 2026,
    termDates: [
      { term: "Term 1", start: "2026-01-06", end: "2026-04-10" },
      { term: "Term 2", start: "2026-04-27", end: "2026-07-31" },
      { term: "Term 3", start: "2026-08-17", end: "2026-11-27" }
    ]
  },

  eventTypes: [
    { id: "Exam", label: "Exam", bgColor: "#FFF5F5", textColor: "#C53030" },
    { id: "Holiday", label: "Holiday", bgColor: "#F0FFF4", textColor: "#276749" },
    { id: "Event", label: "Event", bgColor: "#EBF4FF", textColor: "#2B6CB0" },
    { id: "Meeting", label: "Meeting", bgColor: "#FAF5FF", textColor: "#6B46C1" },
    { id: "Other", label: "Other", bgColor: "#FEF3C7", textColor: "#B7860A" }
  ],

  userRoles: [
    { id: "admin", label: "Administrator" },
    { id: "principal", label: "Principal" },
    { id: "lecturer", label: "Lecturer" },
    { id: "assistant", label: "Assistant" },
    { id: "student", label: "Student" },
    { id: "parent", label: "Parent" },
    { id: "staff", label: "Staff" }
  ]
};

// Global exported helpers reading from localStorage with fallback
export const getSettings = () => {
  const loaded = safeLS("pba_settings", DEFAULT_SETTINGS);
  if (!loaded || Object.keys(loaded).length === 0) {
    saveLS("pba_settings", DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return loaded;
};

export const getBranches = () => {
  const s = getSettings();
  const list = s.branches || DEFAULT_SETTINGS.branches;
  return list.filter((b) => b.isActive !== false).map((b) => b.name);
};

export const getStreams = () => getSettings().streams || DEFAULT_SETTINGS.streams;
export const getSessionTypes = () => getSettings().sessionTypes || DEFAULT_SETTINGS.sessionTypes;
export const getClassroomTypes = () => getSettings().classroomTypes || DEFAULT_SETTINGS.classroomTypes;
export const getFacilities = () => getSettings().facilities || DEFAULT_SETTINGS.facilities;
export const getCurricula = () => getSettings().curricula || DEFAULT_SETTINGS.curricula;
export const getLevels = () => getSettings().academicLevels || DEFAULT_SETTINGS.academicLevels;
export const getTimetableConfig = () => ({ ...DEFAULT_SETTINGS.timetable, ...(getSettings().timetable || {}) });
export const getEventTypes = () => getSettings().eventTypes || DEFAULT_SETTINGS.eventTypes;
export const getUserRoles = () => getSettings().userRoles || DEFAULT_SETTINGS.userRoles;

const toMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const timesOverlap = (aStart, aEnd, bStart, bEnd) => {
  return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd);
};

const DEFAULT_CLASSROOMS = [
  {
    id: 'cls-001',
    name: 'Hall A',
    branch: 'Kohuwala',
    capacity: 40,
    type: 'Lecture Hall',
    facilities: ['Projector', 'AC', 'Whiteboard'],
    isActive: true
  },
  {
    id: 'cls-002',
    name: 'Hall B',
    branch: 'Wattala',
    capacity: 35,
    type: 'Lecture Hall',
    facilities: ['Projector', 'AC', 'Whiteboard'],
    isActive: true
  },
  {
    id: 'cls-003',
    name: 'Lab 01',
    branch: 'Kohuwala',
    capacity: 30,
    type: 'Science Lab',
    facilities: ['Lab Equipment', 'Projector', 'AC'],
    isActive: true
  },
  {
    id: 'cls-004',
    name: 'Room 3B',
    branch: 'Panadura',
    capacity: 25,
    type: 'Classroom',
    facilities: ['Whiteboard', 'AC'],
    isActive: true
  }
];

const DEFAULT_BATCHES = [
  {
    id: "batch-1",
    name: "Cambridge O Level 2027",
    code: "COL-27",
    year: 2027,
    branch: "Kohuwala",
    curriculum: "Cambridge",
    level: "O Level",
    color: "#2B6CB0",
    isActive: true,
    createdAt: new Date().toISOString(),
    batchSubjects: [],
    noClashRules: []
  }
];

const COLOR_PALETTE = ["#2B6CB0", "#276749", "#B7860A", "#6B46C1", "#C53030", "#2C7A7B"];

export const GeneralAdminView = () => {
  const { data, addAnnouncement, currentUser, filterByBranch } = useApp();
  const [activeTab, setActiveTab] = useState("batches");

  // Portal Settings State
  const [settings, setSettings] = useState(() => getSettings());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("✓ Settings saved");

  const triggerToast = (msg = "✓ Settings saved") => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleSaveAllSettings = () => {
    setSettings(settings);
    saveLS("pba_settings", settings);
    triggerToast("✓ Settings saved");
  };

  const [openSections, setOpenSections] = useState({
    branding: true,
    branches: true,
    streams: true,
    sessionTypes: true,
    classrooms: true,
    curriculum: true,
    timetable: true,
    academicYear: true,
    eventTypes: true,
    userRoles: true
  });

  const toggleSection = (sec) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // State for new tag additions in settings
  const [newFacilityInput, setNewFacilityInput] = useState("");
  const [newCurriculumInput, setNewCurriculumInput] = useState("");
  const [newLevelInput, setNewLevelInput] = useState("");

  // Subjects & Batches state
  const [subjects, setSubjects] = useState(() => safeLS("pba_subjects", []));
  const [batches, setBatches] = useState(() => safeLS("pba_batches", DEFAULT_BATCHES));
  const [classrooms, setClassrooms] = useState(() => {
    const existing = safeLS("pba_classrooms", []);
    return (Array.isArray(existing) && existing.length > 0) ? existing : DEFAULT_CLASSROOMS;
  });
  const [sessions, setSessions] = useState(() => safeLS("pba_timetable_sessions", []));
  const pbaUsers = safeLS("pba_users", []);

  // Sync state to LS
  useEffect(() => {
    saveLS("pba_batches", batches);
  }, [batches]);

  useEffect(() => {
    saveLS("pba_classrooms", classrooms);
  }, [classrooms]);

  useEffect(() => {
    const existing = safeLS("pba_classrooms", []);
    if (!existing || !Array.isArray(existing) || existing.length === 0) {
      saveLS("pba_classrooms", DEFAULT_CLASSROOMS);
      setClassrooms(DEFAULT_CLASSROOMS);
    }
  }, []);

  // Tab 1: Batch Manager State
  const [batchBranchFilter, setBatchBranchFilter] = useState("All");
  const [batchCurriculumFilter, setBatchCurriculumFilter] = useState("All");
  const [batchStatusFilter, setBatchStatusFilter] = useState("All");

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchWizardStep, setBatchWizardStep] = useState(1);
  const [editingBatchId, setEditingBatchId] = useState(null);

  const [batchForm, setBatchForm] = useState({
    name: "",
    code: "",
    year: 2027,
    branch: getBranches()[0] || "Kohuwala",
    curriculum: getCurricula()[0] || "Cambridge",
    level: getLevels()[0] || "O Level",
    capacity: 40,
    color: COLOR_PALETTE[0],
    isActive: true,
    batchSubjects: [],
    noClashRules: []
  });

  const [subjSearch, setSubjSearch] = useState("");
  const [newRuleForm, setNewRuleForm] = useState({ subjectAId: "", subjectBId: "", reason: "" });

  // Enrollment State (pba_batch_enrollments)
  const [batchEnrollments, setBatchEnrollments] = useState(() => safeLS("pba_batch_enrollments", []));
  const [enrolledPanelBatch, setEnrolledPanelBatch] = useState(null);
  const [enrolledTab, setEnrolledTab] = useState("active");
  const [enrolledSearch, setEnrolledSearch] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollSelectedStudentIds, setEnrollSelectedStudentIds] = useState([]);
  const [enrollStream, setEnrollStream] = useState(null);
  const [enrollSubjectIds, setEnrollSubjectIds] = useState([]);
  const [enrollSearchQuery, setEnrollSearchQuery] = useState("");

  // Session Attendance State (pba_session_attendance)
  const [sessionAttendance, setSessionAttendance] = useState(() => safeLS("pba_session_attendance", []));
  const [attModal, setAttModal] = useState({ isOpen: false, isReadOnly: false, session: null, date: "", records: {} });

  // Class Changes State (pba_class_changes)
  const [classChanges, setClassChanges] = useState(() => safeLS("pba_class_changes", []));

  // Admin Attendance View Filter State
  const [attRecordsOpen, setAttRecordsOpen] = useState(true);
  const [attFilterDate, setAttFilterDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [attFilterBatch, setAttFilterBatch] = useState("All");
  const [attFilterSubject, setAttFilterSubject] = useState("All");
  const [attFilterLecturer, setAttFilterLecturer] = useState("All");

  // Make-Up Scheduling Modal State
  const [makeUpModal, setMakeUpModal] = useState({ isOpen: false, session: null, date: "", classChange: null });
  const [makeUpForm, setMakeUpForm] = useState({ date: "", startTime: "08:00", endTime: "10:00", classroomId: "", notes: "" });

  // Sync states to LS
  useEffect(() => {
    saveLS("pba_batch_enrollments", batchEnrollments);
  }, [batchEnrollments]);

  useEffect(() => {
    saveLS("pba_session_attendance", sessionAttendance);
  }, [sessionAttendance]);

  useEffect(() => {
    saveLS("pba_class_changes", classChanges);
  }, [classChanges]);

  // Tab 2: Classroom Manager State
  const [clsBranchFilter, setClsBranchFilter] = useState("All");
  const [clsTypeFilter, setClsTypeFilter] = useState("All");
  const [clsStatusFilter, setClsStatusFilter] = useState("All");
  const [clsSearch, setClsSearch] = useState("");

  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [classroomForm, setClassroomForm] = useState({
    name: "",
    type: getClassroomTypes()[0]?.id || "Hall",
    capacity: 40,
    branch: getBranches()[0] || "Kohuwala",
    facilities: ["Projector", "AC", "Whiteboard"],
    isActive: true
  });

  // Daily Allocations Sheet State
  const [allocationDate, setAllocationDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedClassroomForSchedule, setSelectedClassroomForSchedule] = useState("All");

  const role = currentUser.role;
  const allLecturers = Array.from(
    new Map(
      [...pbaUsers, ...(data?.lecturers || [])]
        .filter((u) => u.role === "Lecturer" || u.role === "Assistant" || u.subjectsTaught)
        .map((u) => [u.id, u])
    ).values()
  );

  // --- BATCH MANAGER HANDLERS ---
  const handleOpenCreateBatchModal = () => {
    setEditingBatchId(null);
    setBatchWizardStep(1);
    const nextColor = COLOR_PALETTE[batches.length % COLOR_PALETTE.length];
    setBatchForm({
      name: "",
      code: "",
      year: 2027,
      branch: getBranches()[0] || "Kohuwala",
      curriculum: getCurricula()[0] || "Cambridge",
      level: getLevels()[0] || "O Level",
      capacity: 40,
      color: nextColor,
      isActive: true,
      batchSubjects: [],
      noClashRules: []
    });
    setShowBatchModal(true);
  };

  const handleOpenEditBatchModal = (b) => {
    setEditingBatchId(b.id);
    setBatchWizardStep(1);
    setBatchForm({
      name: b.name || "",
      code: b.code || "",
      year: b.year || 2027,
      branch: b.branch || getBranches()[0] || "Kohuwala",
      curriculum: b.curriculum || getCurricula()[0] || "Cambridge",
      level: b.level || getLevels()[0] || "O Level",
      capacity: b.capacity || 40,
      color: b.color || "#2B6CB0",
      isActive: b.isActive !== false,
      batchSubjects: b.batchSubjects || [],
      noClashRules: b.noClashRules || []
    });
    setShowBatchModal(true);
  };

  const handleSaveBatch = () => {
    if (!batchForm.name.trim()) return;

    let updated;
    if (editingBatchId) {
      updated = batches.map((b) => (b.id === editingBatchId ? { ...b, ...batchForm } : b));
    } else {
      const newBatch = {
        ...batchForm,
        id: "batch-" + Date.now(),
        createdAt: new Date().toISOString()
      };
      updated = [...batches, newBatch];
    }

    setBatches(updated);
    saveLS("pba_batches", updated);
    setShowBatchModal(false);
  };

  const handleDeleteBatch = (id) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      const updated = batches.filter((b) => b.id !== id);
      setBatches(updated);
      saveLS("pba_batches", updated);
    }
  };

  const toggleBatchSubject = (subjId) => {
    const cur = batchForm.batchSubjects || [];
    const exists = cur.some((s) => s.subjectId === subjId);
    if (exists) {
      setBatchForm({ ...batchForm, batchSubjects: cur.filter((s) => s.subjectId !== subjId) });
    } else {
      setBatchForm({
        ...batchForm,
        batchSubjects: [
          ...cur,
          { subjectId: subjId, streamOverride: null, mainLecturerId: null, assistantId: null, defaultRecurrence: "weekly", notes: "" }
        ]
      });
    }
  };

  const handleAddCustomRule = () => {
    if (!newRuleForm.subjectAId || !newRuleForm.subjectBId) return;
    if (newRuleForm.subjectAId === newRuleForm.subjectBId) return;

    const newRule = {
      id: "rule-" + Date.now(),
      subjectAId: newRuleForm.subjectAId,
      subjectBId: newRuleForm.subjectBId,
      reason: newRuleForm.reason || "Same students take both"
    };

    setBatchForm({
      ...batchForm,
      noClashRules: [...(batchForm.noClashRules || []), newRule]
    });
    setNewRuleForm({ subjectAId: "", subjectBId: "", reason: "" });
  };

  const handleRemoveCustomRule = (ruleId) => {
    setBatchForm({
      ...batchForm,
      noClashRules: (batchForm.noClashRules || []).filter((r) => r.id !== ruleId)
    });
  };

  // Filtered Batches
  const filteredBatches = batches.filter((b) => {
    if (batchBranchFilter !== "All" && b.branch !== batchBranchFilter && b.branch !== "All") return false;
    if (batchCurriculumFilter !== "All" && b.curriculum !== batchCurriculumFilter) return false;
    if (batchStatusFilter === "Active" && b.isActive === false) return false;
    if (batchStatusFilter === "Inactive" && b.isActive !== false) return false;
    return true;
  });

  // --- CLASSROOM MANAGER HANDLERS ---
  const handleToggleClassroomStatus = (cls) => {
    const updated = (classrooms || []).map((c) =>
      c.id === cls.id ? { ...c, isActive: c.isActive === false ? true : false } : c
    );
    setClassrooms(updated);
  };

  const filteredClassrooms = (classrooms || []).filter((cls) => {
    if (!cls) return false;
    if (clsBranchFilter !== "All" && cls.branch !== clsBranchFilter && cls.branch !== "All") return false;
    if (clsTypeFilter !== "All" && cls.type !== clsTypeFilter) return false;
    if (clsStatusFilter === "Active" && cls.isActive === false) return false;
    if (clsStatusFilter === "Inactive" && cls.isActive !== false) return false;
    if (clsSearch && clsSearch.trim()) {
      const q = clsSearch.toLowerCase();
      const nameMatch = (cls.name || "").toLowerCase().includes(q);
      const typeMatch = (cls.type || "").toLowerCase().includes(q);
      const branchMatch = (cls.branch || "").toLowerCase().includes(q);
      if (!nameMatch && !typeMatch && !branchMatch) return false;
    }
    return true;
  });

  const handleSaveClassroom = (e) => {
    e.preventDefault();
    if (!classroomForm.name || !classroomForm.name.trim()) return;

    if (editingClassroom) {
      setClassrooms(
        (classrooms || []).map((c) => (c.id === editingClassroom.id ? { ...c, ...classroomForm } : c))
      );
    } else {
      const newCls = {
        ...classroomForm,
        id: "cls-" + Date.now(),
        createdAt: new Date().toISOString()
      };
      setClassrooms([...(classrooms || []), newCls]);
    }
    setShowClassroomModal(false);
  };

  const handleDeleteClassroom = (id) => {
    if (window.confirm("Are you sure you want to delete this classroom?")) {
      setClassrooms((classrooms || []).filter((c) => c.id !== id));
      setShowClassroomModal(false);
    }
  };

  // Daily Allocations
  const selectedDateObj = new Date(allocationDate + "T00:00:00");
  const selectedDayName = selectedDateObj.toLocaleDateString("en-US", { weekday: "long" });
  const allTimetableSessions = safeLS("pba_timetable_sessions", []);
  const todaySessions = (allTimetableSessions || []).filter((s) => s && s.day === selectedDayName);

  const checkDailyConflicts = (sessionList) => {
    return (sessionList || []).map((sess) => {
      if (!sess) return {};
      const isConflicting = (sessionList || []).some(
        (other) =>
          other &&
          other.id !== sess.id &&
          (other.classroomId === sess.classroomId || (other.classroomName && other.classroomName === sess.classroomName)) &&
          timesOverlap(other.startTime, other.endTime, sess.startTime, sess.endTime)
      );
      return { ...sess, isConflicting };
    });
  };

  const processedTodaySessions = checkDailyConflicts(todaySessions);

  const handleShareAllocationSheetWhatsApp = () => {
    const text = `*Daily Classroom Allocations (${selectedDayName})*\n\n` +
      (processedTodaySessions || []).map(s =>
        `• *${s.startTime || ''}–${s.endTime || ''}*: ${s.classroomName || s.classroom || 'Classroom'} — ${s.batchName || s.batch || 'Batch'} (${s.subjectName || s.subject || 'Subject'}) - Lecturer: ${s.lecturerName || s.lecturer || 'TBA'}`
      ).join('\n');
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Settings export/import/reset
  const handleExportSettings = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "settings_backup.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const handleImportSettings = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (window.confirm("This will overwrite your current settings. Continue?")) {
          setSettings(parsed);
          saveLS("pba_settings", parsed);
          triggerToast("✓ Settings imported successfully");
        }
      } catch (err) {
        alert("Invalid settings JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetSettings = () => {
    if (window.confirm("Reset ALL settings to defaults? This cannot be undone.")) {
      setSettings(DEFAULT_SETTINGS);
      saveLS("pba_settings", DEFAULT_SETTINGS);
      triggerToast("✓ Settings reset to defaults");
    }
  };

  return (
    <div style={{ position: "relative", paddingBottom: activeTab === "settings" ? "80px" : "0" }}>
      {/* PAGE HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontFamily: t.fontHeading, fontSize: "20px", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            General Administration & Operations
          </h2>
          <p style={{ fontSize: "13px", color: theme.textMuted, marginTop: "3px" }}>
            Batch management, classroom allocations, master timetable builder, and system portal settings.
          </p>
        </div>
      </div>

      {/* MAIN TAB NAVIGATION */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#EEF0F4",
          padding: "4px",
          borderRadius: "10px",
          width: "fit-content",
          marginBottom: "20px",
          flexWrap: "wrap"
        }}
      >
        <button
          onClick={() => setActiveTab("batches")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "batches" ? 600 : 500,
            color: activeTab === "batches" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "batches" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            boxShadow: activeTab === "batches" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Layers size={16} /> Batch Manager
        </button>

        <button
          onClick={() => setActiveTab("allocation")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "allocation" ? 600 : 500,
            color: activeTab === "allocation" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "allocation" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            boxShadow: activeTab === "allocation" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Building size={16} /> Classroom Manager
        </button>

        <button
          onClick={() => setActiveTab("builder")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "builder" ? 600 : 500,
            color: activeTab === "builder" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "builder" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            boxShadow: activeTab === "builder" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <CalendarCheck size={16} /> Visual Timetable Builder
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "schedule" ? 600 : 500,
            color: activeTab === "schedule" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "schedule" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            boxShadow: activeTab === "schedule" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <CalendarCheck size={16} /> Today's Class Changes
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "calendar" ? 600 : 500,
            color: activeTab === "calendar" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "calendar" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            boxShadow: activeTab === "calendar" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Calendar size={16} /> Monthly Calendar
        </button>

        <button
          onClick={() => setActiveTab("announcements")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "announcements" ? 600 : 500,
            color: activeTab === "announcements" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "announcements" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            boxShadow: activeTab === "announcements" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Megaphone size={16} /> Announcements
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "settings" ? 600 : 500,
            color: activeTab === "settings" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "settings" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "settings" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Settings size={16} /> Portal Settings
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BATCH MANAGER                                                      */}
      {/* ========================================================================= */}
      {activeTab === "batches" && (
        <div>
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontFamily: t.fontHeading, fontSize: "18px", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                Batch Manager
              </h3>
              <p style={{ fontSize: "12px", color: theme.textMuted, margin: "2px 0 0" }}>
                Create and configure academic batches with subject assignments and scheduling rules.
              </p>
            </div>
            <button
              onClick={handleOpenCreateBatchModal}
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
              <Plus size={15} /> Create Batch
            </button>
          </div>

          {/* FILTERS */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <select
              value={batchBranchFilter}
              onChange={(e) => setBatchBranchFilter(e.target.value)}
              style={{ padding: "7px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px" }}
            >
              <option value="All">All Branches</option>
              {getBranches().map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={batchCurriculumFilter}
              onChange={(e) => setBatchCurriculumFilter(e.target.value)}
              style={{ padding: "7px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px" }}
            >
              <option value="All">All Curriculums</option>
              {getCurricula().map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={batchStatusFilter}
              onChange={(e) => setBatchStatusFilter(e.target.value)}
              style={{ padding: "7px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px" }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* BATCH CARDS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
            {filteredBatches.map((batch) => {
              const subCount = (batch.batchSubjects || []).length;
              const ruleCount = (batch.noClashRules || []).length;
              const schedCount = new Set(sessions.filter((s) => s.batchId === batch.id).map((s) => s.subjectId)).size;

              const activeEnrollments = batchEnrollments.filter((e) => e.batchId === batch.id && e.status === "active");
              const capacity = batch.capacity || 40;
              const pct = Math.min((activeEnrollments.length / capacity) * 100, 100);
              const barColor =
                activeEnrollments.length >= capacity
                  ? "#C53030"
                  : activeEnrollments.length >= capacity * 0.8
                  ? "#B7860A"
                  : "#276749";

              let lvlBg = "#EBF4FF";
              let lvlColor = "#2B6CB0";
              if (batch.level === "A Level") { lvlBg = "#FAF5FF"; lvlColor = "#6B46C1"; }
              else if (batch.level === "IGCSE") { lvlBg = "#F0FFF4"; lvlColor = "#276749"; }
              else if (batch.level === "Other") { lvlBg = "#FEF3C7"; lvlColor = "#B7860A"; }

              return (
                <div
                  key={batch.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E3E6EA",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                  }}
                >
                  <div style={{ height: "4px", background: batch.color || "#2B6CB0" }} />

                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <h4 style={{ margin: 0, fontFamily: t.fontHeading, fontSize: "14px", fontWeight: 700, color: "#1A202C" }}>
                        {batch.name}
                      </h4>
                      <span style={{ fontSize: "10px", fontWeight: 700, background: lvlBg, color: lvlColor, borderRadius: "10px", padding: "2px 8px" }}>
                        {batch.level || "O Level"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "10px", fontWeight: 600, background: "#F0F2F5", color: "#4A5568", padding: "2px 6px", borderRadius: "4px" }}>
                        {batch.code}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 600, background: "#F0F2F5", color: "#4A5568", padding: "2px 6px", borderRadius: "4px" }}>
                        {batch.year}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 600, background: "#F0F2F5", color: "#4A5568", padding: "2px 6px", borderRadius: "4px" }}>
                        {batch.branch}
                      </span>
                    </div>

                    <div style={{ fontSize: "11px", color: "#718096", marginBottom: "8px" }}>
                      Curriculum: {batch.curriculum}
                    </div>

                    {/* ENROLLMENT COUNT & PROGRESS BAR */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12px", color: "#718096", whiteSpace: "nowrap" }}>
                        👤 {activeEnrollments.length} / {capacity} students
                      </span>
                      <div style={{ flex: 1, height: "6px", background: "#E3E6EA", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: barColor,
                            borderRadius: "3px",
                            transition: "width 0.3s ease"
                          }}
                        />
                      </div>
                    </div>

                    {/* SUBJECT PILLS */}
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {(batch.batchSubjects || []).slice(0, 4).map((bs) => {
                        const subObj = subjects.find((s) => s.id === bs.subjectId);
                        const sCode = subObj?.code || subObj?.name?.substring(0, 4) || bs.subjectId;
                        return (
                          <span key={bs.subjectId} style={{ fontSize: "10px", background: "#EBF4FF", color: "#2B6CB0", padding: "2px 6px", borderRadius: "10px", fontWeight: 600 }}>
                            {sCode}
                          </span>
                        );
                      })}
                      {subCount > 4 && (
                        <span style={{ fontSize: "10px", background: "#F0F2F5", color: "#718096", padding: "2px 6px", borderRadius: "10px" }}>
                          +{subCount - 4} more
                        </span>
                      )}
                    </div>

                    {/* STATS */}
                    <div style={{ borderTop: "1px dashed #F0F2F5", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#718096" }}>
                      <span>{subCount} Subjects</span>
                      <span>{schedCount}/{subCount} Scheduled</span>
                      <span>{ruleCount} Rules</span>
                    </div>
                  </div>

                  {/* CARD FOOTER */}
                  <div style={{ borderTop: "1px solid #F0F2F5", padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFBFC" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <button
                        onClick={() => setActiveTab("builder")}
                        style={{ background: "none", border: "none", color: "#2B6CB0", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Build Timetable →
                      </button>
                      <button
                        onClick={() => {
                          setEnrolledPanelBatch(batch);
                          setEnrolledTab("active");
                          setEnrolledSearch("");
                        }}
                        style={{ background: "none", border: "none", color: "#2B6CB0", fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0 }}
                      >
                        👥 View Students
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleOpenEditBatchModal(batch)} style={{ background: "none", border: "none", cursor: "pointer", color: "#718096" }}>
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDeleteBatch(batch.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C53030" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3-STEP WIZARD MODAL */}
          {showBatchModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "640px", maxHeight: "82vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
                {/* MODAL HEADER */}
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3E6EA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                    {editingBatchId ? "Edit Batch" : "Create New Batch"}
                  </h3>
                  <button onClick={() => setShowBatchModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}>
                    <X size={18} />
                  </button>
                </div>

                {/* STEP INDICATOR */}
                <div style={{ display: "flex", borderBottom: "1px solid #F0F2F5", background: "#FAFBFC" }}>
                  {[
                    { step: 1, label: "① Batch Details" },
                    { step: 2, label: "② Assign Subjects" },
                    { step: 3, label: "③ Scheduling Rules" }
                  ].map((s) => (
                    <button
                      key={s.step}
                      onClick={() => setBatchWizardStep(s.step)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        fontSize: "12px",
                        fontWeight: batchWizardStep === s.step ? 700 : 500,
                        color: batchWizardStep === s.step ? "#2B6CB0" : "#718096",
                        border: "none",
                        borderBottom: batchWizardStep === s.step ? "2px solid #2B6CB0" : "none",
                        background: "transparent",
                        cursor: "pointer"
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding: "20px 24px" }}>
                  {/* STEP 1: BATCH DETAILS */}
                  {batchWizardStep === 1 && (
                    <div>
                      <div style={{ marginBottom: "14px" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Batch Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Cambridge O Level 2027"
                          value={batchForm.name}
                          onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Short Code</label>
                          <input
                            type="text"
                            placeholder="e.g. COL-27"
                            value={batchForm.code}
                            onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Academic Year</label>
                          <input
                            type="number"
                            value={batchForm.year}
                            onChange={(e) => setBatchForm({ ...batchForm, year: Number(e.target.value) })}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Branch</label>
                          <select
                            value={batchForm.branch}
                            onChange={(e) => setBatchForm({ ...batchForm, branch: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                          >
                            {getBranches().map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                            <option value="All">All Branches</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Curriculum</label>
                          <select
                            value={batchForm.curriculum}
                            onChange={(e) => setBatchForm({ ...batchForm, curriculum: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                          >
                            {getCurricula().map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Level</label>
                          <select
                            value={batchForm.level}
                            onChange={(e) => setBatchForm({ ...batchForm, level: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                          >
                            {getLevels().map((l) => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>CLASS CAPACITY</label>
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={batchForm.capacity || 40}
                            onChange={(e) => setBatchForm({ ...batchForm, capacity: parseInt(e.target.value) || 40 })}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "13px" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>Batch Color</label>
                          <input
                            type="color"
                            value={batchForm.color}
                            onChange={(e) => setBatchForm({ ...batchForm, color: e.target.value })}
                            style={{ width: "100%", height: "36px", border: "1px solid #E3E6EA", borderRadius: "7px", cursor: "pointer", padding: "2px" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                        <button
                          type="button"
                          onClick={() => setBatchWizardStep(2)}
                          style={{ background: "#2B6CB0", color: "#FFFFFF", border: "none", borderRadius: "7px", padding: "8px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Next: Assign Subjects →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: ASSIGN SUBJECTS */}
                  {batchWizardStep === 2 && (
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ width: "240px", borderRight: "1px solid #F0F2F5", paddingRight: "12px" }}>
                        <input
                          type="text"
                          placeholder="Search subjects..."
                          value={subjSearch}
                          onChange={(e) => setSubjSearch(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px", marginBottom: "8px" }}
                        />
                        <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                          {subjects
                            .filter((s) => (s.name || "").toLowerCase().includes(subjSearch.toLowerCase()))
                            .map((s) => {
                              const isChecked = (batchForm.batchSubjects || []).some((bs) => bs.subjectId === s.id);
                              return (
                                <label key={s.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 0", cursor: "pointer", fontSize: "12px" }}>
                                  <input type="checkbox" checked={isChecked} onChange={() => toggleSubject(s.id)} />
                                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#718096" }}>{s.code || "SUB"}</span>
                                  {s.name}
                                </label>
                              );
                            })}
                        </div>
                      </div>

                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700 }}>Assigned Subjects ({(batchForm.batchSubjects || []).length})</h4>
                        <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ background: "#F8FAFC" }}>
                                <th style={{ padding: "6px", textAlign: "left" }}>SUBJECT</th>
                                <th style={{ padding: "6px", textAlign: "left" }}>LECTURER</th>
                                <th style={{ padding: "6px", textAlign: "left" }}>ASSISTANT</th>
                                <th style={{ padding: "6px", textAlign: "left" }}>RECURRENCE</th>
                                <th style={{ padding: "6px", textAlign: "center" }}>✕</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(batchForm.batchSubjects || []).map((bs) => {
                                const subObj = subjects.find((s) => s.id === bs.subjectId);
                                return (
                                  <tr key={bs.subjectId} style={{ borderBottom: "1px solid #F0F2F5" }}>
                                    <td style={{ padding: "6px" }}>
                                      <strong style={{ display: "block" }}>{subObj?.name || bs.subjectId}</strong>
                                      <span style={{ fontSize: "9px", color: "#718096" }}>{subObj?.stream || "elective"}</span>
                                    </td>
                                    <td style={{ padding: "6px" }}>
                                      <select
                                        value={bs.mainLecturerId || ""}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const updatedBS = batchForm.batchSubjects.map((s) =>
                                            s.subjectId === bs.subjectId ? { ...s, mainLecturerId: val } : s
                                          );
                                          setBatchForm({ ...batchForm, batchSubjects: updatedBS });
                                        }}
                                        style={{ width: "100%", fontSize: "11px", padding: "2px 4px" }}
                                      >
                                        <option value="">— Unassigned —</option>
                                        {allLecturers.map((l) => (
                                          <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td style={{ padding: "6px" }}>
                                      <select
                                        value={bs.assistantId || ""}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const updatedBS = batchForm.batchSubjects.map((s) =>
                                            s.subjectId === bs.subjectId ? { ...s, assistantId: val } : s
                                          );
                                          setBatchForm({ ...batchForm, batchSubjects: updatedBS });
                                        }}
                                        style={{ width: "100%", fontSize: "11px", padding: "2px 4px" }}
                                      >
                                        <option value="">— None —</option>
                                        {allLecturers.map((l) => (
                                          <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td style={{ padding: "6px" }}>
                                      <select
                                        value={bs.defaultRecurrence || "weekly"}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const updatedBS = batchForm.batchSubjects.map((s) =>
                                            s.subjectId === bs.subjectId ? { ...s, defaultRecurrence: val } : s
                                          );
                                          setBatchForm({ ...batchForm, batchSubjects: updatedBS });
                                        }}
                                        style={{ width: "100%", fontSize: "11px", padding: "2px 4px", borderRadius: "6px", border: "1px solid #E3E6EA" }}
                                      >
                                        <option value="weekly">↻ Weekly</option>
                                        <option value="biweekly">↻ Bi-weekly</option>
                                        <option value="once">⊙ One-time</option>
                                      </select>
                                    </td>
                                    <td style={{ padding: "6px", textAlign: "center" }}>
                                      <button onClick={() => toggleBatchSubject(bs.subjectId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C53030" }}>✕</button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                          <button
                            type="button"
                            onClick={() => setBatchWizardStep(1)}
                            style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", padding: "6px 14px", borderRadius: "6px", fontSize: "12px" }}
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setBatchWizardStep(3)}
                            style={{ background: "#2B6CB0", color: "#FFFFFF", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}
                          >
                            Next: Scheduling Rules →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: SCHEDULING RULES */}
                  {batchWizardStep === 3 && (
                    <div>
                      <div style={{ background: "#F8FAFC", border: "1px solid #E3E6EA", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                        <strong style={{ fontSize: "12px", display: "block", marginBottom: "6px", color: "#2B6CB0" }}>
                          Automatic Rules (Stream-Based):
                        </strong>
                        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "11px", color: "#4A5568" }}>
                          <li>Compulsory subjects block all other classes for this batch.</li>
                          <li>Science + Science simultaneously is NOT allowed.</li>
                          <li>Commerce + Commerce simultaneously is NOT allowed.</li>
                          <li>Science + Commerce simultaneously IS ALLOWED (split stream).</li>
                        </ul>
                      </div>

                      <div style={{ marginBottom: "16px" }}>
                        <strong style={{ fontSize: "12px", display: "block", marginBottom: "8px" }}>Custom No-Clash Rules for this Batch</strong>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                          <select
                            value={newRuleForm.subjectAId}
                            onChange={(e) => setNewRuleForm({ ...newRuleForm, subjectAId: e.target.value })}
                            style={{ flex: 1, fontSize: "11px", padding: "4px" }}
                          >
                            <option value="">Select Subject A</option>
                            {(batchForm.batchSubjects || []).map((bs) => (
                              <option key={bs.subjectId} value={bs.subjectId}>
                                {subjects.find((s) => s.id === bs.subjectId)?.name || bs.subjectId}
                              </option>
                            ))}
                          </select>
                          <span style={{ fontSize: "11px", alignSelf: "center" }}>cannot clash with</span>
                          <select
                            value={newRuleForm.subjectBId}
                            onChange={(e) => setNewRuleForm({ ...newRuleForm, subjectBId: e.target.value })}
                            style={{ flex: 1, fontSize: "11px", padding: "4px" }}
                          >
                            <option value="">Select Subject B</option>
                            {(batchForm.batchSubjects || []).map((bs) => (
                              <option key={bs.subjectId} value={bs.subjectId}>
                                {subjects.find((s) => s.id === bs.subjectId)?.name || bs.subjectId}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddCustomRule}
                            style={{ background: "#2B6CB0", color: "#FFF", border: "none", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", fontWeight: 700 }}
                          >
                            ＋ Add Rule
                          </button>
                        </div>

                        {(batchForm.noClashRules || []).map((rule) => {
                          const subA = subjects.find((s) => s.id === rule.subjectAId)?.name || rule.subjectAId;
                          const subB = subjects.find((s) => s.id === rule.subjectBId)?.name || rule.subjectBId;
                          return (
                            <div key={rule.id} style={{ display: "flex", justifyContent: "space-between", background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: "6px", padding: "6px 10px", marginBottom: "6px", fontSize: "11px", color: "#C53030" }}>
                              <span><strong>{subA}</strong> ↔ <strong>{subB}</strong> ({rule.reason})</span>
                              <button onClick={() => handleRemoveCustomRule(rule.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C53030", fontWeight: 700 }}>✕</button>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                        <button
                          type="button"
                          onClick={() => setBatchWizardStep(2)}
                          style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", padding: "6px 14px", borderRadius: "6px", fontSize: "12px" }}
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveBatch}
                          style={{ background: "linear-gradient(135deg, #2B6CB0, #1A4A8A)", color: "#FFFFFF", border: "none", padding: "8px 20px", borderRadius: "7px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Save Batch
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLASSROOM MANAGER                                                  */}
      {/* ========================================================================= */}
      {activeTab === "allocation" && (
        <div>
          {/* HEADER ROW */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontFamily: t.fontHeading, fontSize: "18px", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                Classroom Manager
              </h3>
              <p style={{ fontSize: "12px", color: theme.textMuted, margin: "2px 0 0" }}>
                Manage teaching spaces across all branches
              </p>
            </div>
            {role === "Admin" && (
              <button
                onClick={() => {
                  setEditingClassroom(null);
                  setClassroomForm({
                    name: "",
                    type: "Lecture Hall",
                    capacity: 40,
                    branch: getBranches()[0] || "Kohuwala",
                    facilities: ["Projector", "AC", "Whiteboard"],
                    isActive: true
                  });
                  setShowClassroomModal(true);
                }}
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
                <Plus size={15} /> Add Classroom
              </button>
            )}
          </div>

          {/* FILTER ROW */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={clsBranchFilter}
              onChange={(e) => setClsBranchFilter(e.target.value)}
              style={{ padding: "7px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", background: "#FFF" }}
            >
              <option value="All">All Branches</option>
              {getBranches().map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={clsTypeFilter}
              onChange={(e) => setClsTypeFilter(e.target.value)}
              style={{ padding: "7px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", background: "#FFF" }}
            >
              <option value="All">All Types</option>
              <option value="Lecture Hall">Lecture Hall</option>
              <option value="Classroom">Classroom</option>
              <option value="Science Lab">Science Lab</option>
              <option value="Computer Lab">Computer Lab</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={clsStatusFilter}
              onChange={(e) => setClsStatusFilter(e.target.value)}
              style={{ padding: "7px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", background: "#FFF" }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <input
              type="text"
              placeholder="Search classrooms..."
              value={clsSearch}
              onChange={(e) => setClsSearch(e.target.value)}
              style={{
                padding: "7px 12px",
                border: "1px solid #E3E6EA",
                borderRadius: "8px",
                fontSize: "13px",
                minWidth: "200px",
                background: "#FFF",
                outline: "none"
              }}
            />
          </div>

          {/* CLASSROOM CARDS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {(filteredClassrooms || []).map((cls) => {
              const isActive = cls.isActive !== false;
              const facilitiesList = cls.facilities || [];
              return (
                <div
                  key={cls.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E3E6EA",
                    borderRadius: "12px",
                    padding: "16px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "12px"
                  }}
                >
                  <div>
                    {/* Top row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                        {cls.name ?? "—"}
                      </h4>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          borderRadius: "10px",
                          padding: "2px 8px",
                          background: isActive ? "#F0FFF4" : "#F7F7F7",
                          color: isActive ? "#276749" : "#A0AEC0"
                        }}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Second row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span
                        style={{
                          background: "#EBF4FF",
                          color: "#2B6CB0",
                          borderRadius: "20px",
                          padding: "2px 10px",
                          fontSize: "11px",
                          fontWeight: 600
                        }}
                      >
                        {cls.branch ?? "—"}
                      </span>
                      <span style={{ fontSize: "12px", color: "#718096" }}>
                        👤 {cls.capacity ?? 0} seats
                      </span>
                    </div>

                    {/* Third row */}
                    <div style={{ marginBottom: "8px" }}>
                      <span
                        style={{
                          background: "#F7F8FA",
                          color: "#4A5568",
                          borderRadius: "6px",
                          padding: "3px 8px",
                          fontSize: "11px"
                        }}
                      >
                        {cls.type ?? "—"}
                      </span>
                    </div>

                    {/* Facilities row */}
                    {facilitiesList.length > 0 && (
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                        {facilitiesList.map((f) => (
                          <span
                            key={f}
                            style={{
                              background: "#F0F2F5",
                              color: "#718096",
                              borderRadius: "10px",
                              padding: "2px 8px",
                              fontSize: "10px",
                              fontWeight: 600
                            }}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer row */}
                  {role === "Admin" && (
                    <div
                      style={{
                        display: "flex",
                        justify: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid #F0F2F5",
                        paddingTop: "10px",
                        marginTop: "4px"
                      }}
                    >
                      <button
                        onClick={() => {
                          setEditingClassroom(cls);
                          setClassroomForm({
                            name: cls.name ?? "",
                            type: cls.type ?? "Lecture Hall",
                            capacity: cls.capacity ?? 30,
                            branch: cls.branch ?? (getBranches()[0] || "Kohuwala"),
                            facilities: cls.facilities ?? [],
                            isActive: cls.isActive !== false
                          });
                          setShowClassroomModal(true);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#2B6CB0",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggleClassroomStatus(cls)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#718096",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Daily Allocation Sheet */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1A202C" }}>
                Daily Allocation Sheet ({selectedDayName})
              </h4>
              <button
                onClick={handleShareAllocationSheetWhatsApp}
                style={{
                  background: "#25D366",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Share via WhatsApp
              </button>
            </div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E3E6EA" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>TIME</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>CLASSROOM</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>BATCH</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>SUBJECT</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>LECTURER</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>ASSISTANT</th>
                </tr>
              </thead>
              <tbody>
                {(processedTodaySessions || []).map((s) => {
                  const asst = s.assistantId ? (allLecturers || []).find((u) => u.id === s.assistantId) : null;
                  return (
                    <tr key={s.id || Math.random()} style={{ borderBottom: "1px solid #F0F2F5" }}>
                      <td style={{ padding: "8px", fontWeight: 600 }}>{s.startTime}–{s.endTime}</td>
                      <td style={{ padding: "8px" }}>{s.classroomName || s.classroom || "—"}</td>
                      <td style={{ padding: "8px" }}>{s.batchName || s.batch || "—"}</td>
                      <td style={{ padding: "8px" }}>{s.subjectName || s.subject || "—"}</td>
                      <td style={{ padding: "8px" }}>{s.lecturerName || s.lecturer || "—"}</td>
                      <td style={{ padding: "8px", color: asst ? "#B7860A" : "#A0AEC0", fontWeight: asst ? 600 : 400 }}>{asst ? asst.name : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ADD / EDIT CLASSROOM MODAL */}
          {showClassroomModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "520px", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                  {editingClassroom ? "Edit Classroom" : "Add Classroom"}
                </h3>
                <form onSubmit={handleSaveClassroom}>
                  {/* 1. Classroom Name */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                      Classroom Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={classroomForm.name}
                      onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box", outline: "none" }}
                    />
                  </div>

                  {/* 2. Branch & 3. Capacity */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                        Branch
                      </label>
                      <select
                        value={classroomForm.branch}
                        onChange={(e) => setClassroomForm({ ...classroomForm, branch: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", background: "#FFF", boxSizing: "border-box" }}
                      >
                        {getBranches().map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                        Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={classroomForm.capacity}
                        onChange={(e) => setClassroomForm({ ...classroomForm, capacity: parseInt(e.target.value) || 1 })}
                        style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box", outline: "none" }}
                      />
                    </div>
                  </div>

                  {/* 4. Type */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                      Classroom Type
                    </label>
                    <select
                      value={classroomForm.type}
                      onChange={(e) => setClassroomForm({ ...classroomForm, type: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", background: "#FFF", boxSizing: "border-box" }}
                    >
                      <option value="Lecture Hall">Lecture Hall</option>
                      <option value="Classroom">Classroom</option>
                      <option value="Science Lab">Science Lab</option>
                      <option value="Computer Lab">Computer Lab</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* 5. Facilities multi-checkbox */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                      Facilities
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {[
                        "Projector",
                        "Whiteboard",
                        "AC",
                        "Lab Equipment",
                        "Computer",
                        "Smart Board",
                        "CCTV"
                      ].map((fac) => {
                        const isChecked = (classroomForm.facilities || []).includes(fac);
                        return (
                          <label key={fac} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#2D3748", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const current = classroomForm.facilities || [];
                                const updated = isChecked
                                  ? current.filter((f) => f !== fac)
                                  : [...current, fac];
                                setClassroomForm({ ...classroomForm, facilities: updated });
                              }}
                            />
                            {fac}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 6. Status toggle */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#2D3748", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={classroomForm.isActive !== false}
                        onChange={(e) => setClassroomForm({ ...classroomForm, isActive: e.target.checked })}
                      />
                      Active Classroom
                    </label>
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", justifyContent: editingClassroom ? "space-between" : "flex-end", alignItems: "center", borderTop: "1px solid #E3E6EA", paddingTop: "14px" }}>
                    {editingClassroom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteClassroom(editingClassroom.id)}
                        style={{ background: "none", border: "none", color: "#C53030", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: 0 }}
                      >
                        Delete Classroom
                      </button>
                    )}
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setShowClassroomModal(false)}
                        style={{ background: "#FFF", border: "1px solid #E3E6EA", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", color: "#4A5568", fontWeight: 600, cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{ background: "#2B6CB0", color: "#FFF", border: "none", padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Save Classroom
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VISUAL TIMETABLE BUILDER */}
      {activeTab === "builder" && (
        <VisualTimetableBuilder initialClassroomId={selectedClassroomForSchedule} onOpenBatchManager={() => setActiveTab("batches")} />
      )}

      {/* TAB 4: TODAY'S CLASS CHANGES */}
      {activeTab === "schedule" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* SESSION LIST CARD */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: t.fontHeading, fontSize: "18px", fontWeight: 700, color: "#1A202C" }}>Today's Class Status & Changes</h3>
                <p style={{ fontSize: "12px", color: "#718096", margin: "2px 0 0" }}>View scheduled classes, mark session attendance, handle cancellations, and schedule make-up classes.</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#4A5568" }}>Select Date:</label>
                <input
                  type="date"
                  value={allocationDate}
                  onChange={(e) => setAllocationDate(e.target.value)}
                  style={{ padding: "6px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", background: "#FFF" }}
                />
              </div>
            </div>

            {/* SESSIONS TABLE */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E3E6EA" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>TIME</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>BATCH</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>SUBJECT</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>LECTURER</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>CLASSROOM</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>STATUS</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const selDateObj = new Date(allocationDate + "T00:00:00");
                    const selDayName = selDateObj.toLocaleDateString("en-US", { weekday: "long" });

                    const runningSessions = sessions.filter((s) => {
                      if (s.date) return s.date === allocationDate;
                      return s.day === selDayName;
                    });

                    if (runningSessions.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" style={{ padding: "30px", textAlign: "center", color: "#A0AEC0" }}>
                            No sessions scheduled for {selDayName} ({allocationDate}).
                          </td>
                        </tr>
                      );
                    }

                    return runningSessions.map((sess) => {
                      const changeRec = classChanges.find((c) => c.sessionId === sess.id && c.date === allocationDate);
                      const isCancelled = changeRec?.type === "cancelled";
                      const isChanged = changeRec?.type === "changed";

                      const attRec = sessionAttendance.find((a) => a.sessionId === sess.id && a.date === allocationDate);
                      const isAttMarked = !!attRec;

                      const batchObj = batches.find((b) => b.id === sess.batchId);
                      const subjObj = subjects.find((s) => s.id === sess.subjectId);
                      const clsObj = classrooms.find((c) => c.id === sess.classroomId);
                      const lecObj = allLecturers.find((u) => u.id === sess.lecturerId);

                      return (
                        <tr key={sess.id} style={{ borderBottom: "1px solid #F0F2F5", background: isCancelled ? "#FFF5F5" : "transparent" }}>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1A202C" }}>
                            {sess.startTime}–{sess.endTime}
                            {sess.isMakeup && (
                              <span style={{ fontSize: "9px", fontWeight: 800, background: "#EBF4FF", color: "#2B6CB0", borderRadius: "3px", padding: "1px 4px", marginLeft: "6px" }}>
                                MAKE-UP
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: 600 }}>{sess.batchName || batchObj?.name || "Batch"}</td>
                          <td style={{ padding: "12px 14px", fontWeight: 600, color: "#2B6CB0" }}>{sess.subjectName || subjObj?.name || "Subject"}</td>
                          <td style={{ padding: "12px 14px" }}>{sess.lecturerName || lecObj?.name || "Lecturer"}</td>
                          <td style={{ padding: "12px 14px" }}>{sess.classroomName || clsObj?.name || "Room"}</td>
                          <td style={{ padding: "12px 14px" }}>
                            {isCancelled ? (
                              <span style={{ background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: "12px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, color: "#C53030" }}>
                                ✕ Cancelled
                              </span>
                            ) : isChanged ? (
                              <span style={{ background: "#FFFBEB", border: "1px solid #F6D860", borderRadius: "12px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, color: "#B7860A" }}>
                                ⇄ Changed
                              </span>
                            ) : (
                              <span style={{ background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: "12px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, color: "#276749" }}>
                                ✓ Normal
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                              {/* Attendance Button / Pill */}
                              {isAttMarked ? (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                  <span
                                    style={{
                                      background: "#F0FFF4",
                                      border: "1px solid #9AE6B4",
                                      borderRadius: "20px",
                                      padding: "4px 12px",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: "#276749"
                                    }}
                                  >
                                    ✓ Attendance Marked
                                  </span>
                                  <button
                                    onClick={() => {
                                      const recsObj = {};
                                      (attRec.records || []).forEach((r) => { recsObj[r.studentId] = r.status; });
                                      setAttModal({ isOpen: true, isReadOnly: false, session: sess, date: allocationDate, records: recsObj });
                                    }}
                                    style={{ border: "none", background: "transparent", color: "#718096", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}
                                  >
                                    Edit
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAttModal({ isOpen: true, isReadOnly: false, session: sess, date: allocationDate, records: {} });
                                  }}
                                  style={{
                                    padding: "7px 14px",
                                    background: "transparent",
                                    border: "1.5px solid #68D391",
                                    borderRadius: "7px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "#276749",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  ✓ Mark Attendance
                                </button>
                              )}

                              {/* Toggle Cancelled/Changed Button */}
                              <button
                                onClick={() => {
                                  if (isCancelled) {
                                    const updated = classChanges.filter((c) => !(c.sessionId === sess.id && c.date === allocationDate));
                                    setClassChanges(updated);
                                  } else {
                                    const newRec = {
                                      id: "change-" + Date.now(),
                                      sessionId: sess.id,
                                      date: allocationDate,
                                      type: "cancelled",
                                      markedAt: new Date().toISOString()
                                    };
                                    setClassChanges([...classChanges, newRec]);
                                  }
                                }}
                                style={{
                                  padding: "6px 12px",
                                  background: "#F7F8FA",
                                  border: "1px solid #E3E6EA",
                                  borderRadius: "7px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: isCancelled ? "#276749" : "#C53030",
                                  cursor: "pointer"
                                }}
                              >
                                {isCancelled ? "Restore Class" : "Mark Cancelled"}
                              </button>

                              {/* Schedule Make-up button / info pill */}
                              {isCancelled && (
                                changeRec?.makeupScheduled ? (
                                  <span
                                    style={{
                                      background: "#EBF4FF",
                                      border: "1px solid #BEE3F8",
                                      borderRadius: "20px",
                                      padding: "4px 12px",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: "#2B6CB0"
                                    }}
                                  >
                                    📅 Make-up Scheduled
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setMakeUpModal({ isOpen: true, session: sess, date: allocationDate, classChange: changeRec });
                                      setMakeUpForm({
                                        date: allocationDate,
                                        startTime: sess.startTime || "08:00",
                                        endTime: sess.endTime || "10:00",
                                        classroomId: sess.classroomId || classrooms[0]?.id || "",
                                        notes: ""
                                      });
                                    }}
                                    style={{
                                      padding: "5px 12px",
                                      background: "transparent",
                                      border: "1.5px solid #BEE3F8",
                                      borderRadius: "7px",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color: "#2B6CB0",
                                      cursor: "pointer"
                                    }}
                                  >
                                    📅 Schedule Make-up
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* PART B — ADMIN ATTENDANCE VIEW SECTION */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", borderRadius: "12px", padding: "20px" }}>
            <div
              onClick={() => setAttRecordsOpen(!attRecordsOpen)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            >
              <h3 style={{ margin: 0, fontFamily: t.fontHeading, fontSize: "16px", fontWeight: 700, color: "#1A202C", display: "flex", alignItems: "center", gap: "8px" }}>
                📋 Attendance Records
              </h3>
              <span style={{ fontSize: "14px", color: "#718096" }}>{attRecordsOpen ? "▲" : "▼"}</span>
            </div>

            {attRecordsOpen && (
              <div style={{ marginTop: "16px" }}>
                {/* FILTER BAR */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "3px" }}>DATE</label>
                    <input
                      type="date"
                      value={attFilterDate}
                      onChange={(e) => setAttFilterDate(e.target.value)}
                      style={{ padding: "6px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "12px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "3px" }}>BATCH</label>
                    <select
                      value={attFilterBatch}
                      onChange={(e) => setAttFilterBatch(e.target.value)}
                      style={{ padding: "6px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "12px", background: "#FFF" }}
                    >
                      <option value="All">All Batches</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "3px" }}>SUBJECT</label>
                    <select
                      value={attFilterSubject}
                      onChange={(e) => setAttFilterSubject(e.target.value)}
                      style={{ padding: "6px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "12px", background: "#FFF" }}
                    >
                      <option value="All">All Subjects</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "3px" }}>LECTURER</label>
                    <select
                      value={attFilterLecturer}
                      onChange={(e) => setAttFilterLecturer(e.target.value)}
                      style={{ padding: "6px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "12px", background: "#FFF" }}
                    >
                      <option value="All">All Lecturers</option>
                      {allLecturers.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TABLE */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E3E6EA" }}>
                        <th style={{ padding: "10px", textAlign: "left" }}>DATE</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>BATCH</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>SUBJECT</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>LECTURER</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>TIME</th>
                        <th style={{ padding: "10px", textAlign: "center" }}>PRESENT</th>
                        <th style={{ padding: "10px", textAlign: "center" }}>ABSENT</th>
                        <th style={{ padding: "10px", textAlign: "center" }}>LATE</th>
                        <th style={{ padding: "10px", textAlign: "center" }}>RATE</th>
                        <th style={{ padding: "10px", textAlign: "right" }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredAtt = sessionAttendance.filter((rec) => {
                          if (attFilterDate && rec.date !== attFilterDate) return false;
                          if (attFilterBatch !== "All" && rec.batchId !== attFilterBatch) return false;
                          if (attFilterSubject !== "All" && rec.subjectId !== attFilterSubject) return false;
                          if (attFilterLecturer !== "All" && rec.lecturerId !== attFilterLecturer) return false;
                          return true;
                        });

                        if (filteredAtt.length === 0) {
                          return (
                            <tr>
                              <td colSpan="10" style={{ padding: "20px", textAlign: "center", color: "#A0AEC0" }}>
                                No attendance records found matching filters.
                              </td>
                            </tr>
                          );
                        }

                        return filteredAtt.map((rec) => {
                          const sessObj = sessions.find((s) => s.id === rec.sessionId);
                          const batchObj = batches.find((b) => b.id === rec.batchId);
                          const subjObj = subjects.find((s) => s.id === rec.subjectId);
                          const lecObj = allLecturers.find((u) => u.id === rec.lecturerId);

                          const recsList = rec.records || [];
                          const presentCount = recsList.filter((r) => r.status === "present").length;
                          const absentCount = recsList.filter((r) => r.status === "absent").length;
                          const lateCount = recsList.filter((r) => r.status === "late").length;
                          const totalEnrolled = recsList.length || 1;

                          const ratePct = Math.round(((presentCount + lateCount) / totalEnrolled) * 100);
                          const rateColor = ratePct >= 80 ? "#276749" : ratePct >= 60 ? "#B7860A" : "#C53030";

                          return (
                            <tr key={rec.id} style={{ borderBottom: "1px solid #F0F2F5" }}>
                              <td style={{ padding: "10px", fontWeight: 600 }}>{rec.date}</td>
                              <td style={{ padding: "10px" }}>{batchObj?.name || "Batch"}</td>
                              <td style={{ padding: "10px", fontWeight: 600, color: "#2B6CB0" }}>{subjObj?.name || "Subject"}</td>
                              <td style={{ padding: "10px" }}>{lecObj?.name || "Lecturer"}</td>
                              <td style={{ padding: "10px" }}>{sessObj ? `${sessObj.startTime}–${sessObj.endTime}` : "—"}</td>
                              <td style={{ padding: "10px", textAlign: "center", color: "#276749", fontWeight: 700 }}>{presentCount}</td>
                              <td style={{ padding: "10px", textAlign: "center", color: "#C53030", fontWeight: 700 }}>{absentCount}</td>
                              <td style={{ padding: "10px", textAlign: "center", color: "#B7860A", fontWeight: 700 }}>{lateCount}</td>
                              <td style={{ padding: "10px", textAlign: "center", fontWeight: 800, color: rateColor }}>{ratePct}%</td>
                              <td style={{ padding: "10px", textAlign: "right" }}>
                                <button
                                  onClick={() => {
                                    const recsObj = {};
                                    recsList.forEach((r) => { recsObj[r.studentId] = r.status; });
                                    setAttModal({ isOpen: true, isReadOnly: true, session: sessObj || { batchId: rec.batchId, subjectId: rec.subjectId, lecturerId: rec.lecturerId }, date: rec.date, records: recsObj });
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    background: "#EBF4FF",
                                    color: "#2B6CB0",
                                    border: "1px solid #BEE3F8",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    cursor: "pointer"
                                  }}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ATTENDANCE MODAL (MARK / VIEW) */}
      {attModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            {/* Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3E6EA", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                  {attModal.isReadOnly ? "View Attendance — " : "Mark Attendance — "}
                  {attModal.session?.subjectName || subjects.find(s => s.id === attModal.session?.subjectId)?.name || "Subject"} · {batches.find(b => b.id === attModal.session?.batchId)?.name || "Batch"}
                </h3>
                <div style={{ fontSize: "12px", color: "#718096", marginTop: "4px" }}>
                  {attModal.date} · {attModal.session?.startTime}–{attModal.session?.endTime} · {classrooms.find(c => c.id === attModal.session?.classroomId)?.name || "Classroom"}
                </div>
              </div>
              <button onClick={() => setAttModal({ isOpen: false, isReadOnly: false, session: null, date: "", records: {} })} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}>
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            {(() => {
              const activeBatchEnrollments = batchEnrollments.filter(e => e.batchId === attModal.session?.batchId && e.status === "active");
              const enrolledStudentIds = new Set(activeBatchEnrollments.map(e => e.studentId));

              let studentList = (data.students || []).filter(st => enrolledStudentIds.has(st.id));
              if (studentList.length === 0) {
                studentList = data.students || [];
              }

              return (
                <div>
                  {/* Quick-action row */}
                  {!attModal.isReadOnly && (
                    <div style={{ padding: "12px 24px", background: "#FAFBFC", borderBottom: "1px solid #F0F2F5", display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...attModal.records };
                          studentList.forEach(st => { updated[st.id] = "present"; });
                          setAttModal({ ...attModal, records: updated });
                        }}
                        style={{ padding: "5px 12px", background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: "6px", fontSize: "11px", fontWeight: 700, color: "#276749", cursor: "pointer" }}
                      >
                        ✓ Mark All Present
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...attModal.records };
                          studentList.forEach(st => { updated[st.id] = "absent"; });
                          setAttModal({ ...attModal, records: updated });
                        }}
                        style={{ padding: "5px 12px", background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: "6px", fontSize: "11px", fontWeight: 700, color: "#C53030", cursor: "pointer" }}
                      >
                        ✗ Mark All Absent
                      </button>
                    </div>
                  )}

                  {/* Student List */}
                  <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                    {studentList.map(st => {
                      const status = attModal.records[st.id] || "present";

                      return (
                        <div
                          key={st.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justify: "space-between",
                            gap: "12px",
                            padding: "10px 24px",
                            borderBottom: "1px solid #F0F2F5",
                            background: status === "absent" ? "#FFF5F5" : "transparent"
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>{st.name}</div>
                            <div style={{ fontSize: "11px", color: "#A0AEC0" }}>{st.regNo || st.id}</div>
                          </div>

                          {/* Status pill selector */}
                          <div style={{ display: "flex", gap: "6px" }}>
                            {[
                              { id: "present", label: "Present", activeBg: "#F0FFF4", activeColor: "#276749", activeBorder: "1.5px solid #9AE6B4" },
                              { id: "late", label: "Late", activeBg: "#FFFBEB", activeColor: "#B7860A", activeBorder: "1.5px solid #F6D860" },
                              { id: "excused", label: "Excused", activeBg: "#EBF4FF", activeColor: "#2B6CB0", activeBorder: "1.5px solid #BEE3F8" },
                              { id: "absent", label: "Absent", activeBg: "#FFF5F5", activeColor: "#C53030", activeBorder: "1.5px solid #FEB2B2" }
                            ].map(opt => {
                              const isActive = status === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={attModal.isReadOnly}
                                  onClick={() => {
                                    setAttModal({
                                      ...attModal,
                                      records: { ...attModal.records, [st.id]: opt.id }
                                    });
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: "16px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    cursor: attModal.isReadOnly ? "default" : "pointer",
                                    background: isActive ? opt.activeBg : "#F7F8FA",
                                    color: isActive ? opt.activeColor : "#A0AEC0",
                                    border: isActive ? opt.activeBorder : "1px solid #E3E6EA"
                                  }}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Row */}
                  <div style={{ padding: "14px 24px", borderTop: "1px solid #E3E6EA", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFBFC" }}>
                    {(() => {
                      const counts = { present: 0, absent: 0, late: 0, excused: 0 };
                      studentList.forEach(st => {
                        const stStatus = attModal.records[st.id] || "present";
                        counts[stStatus] = (counts[stStatus] || 0) + 1;
                      });

                      return (
                        <div style={{ fontSize: "12px", color: "#4A5568", fontWeight: 600 }}>
                          Present: {counts.present} | Absent: {counts.absent} | Late: {counts.late} | Excused: {counts.excused}
                        </div>
                      );
                    })()}

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setAttModal({ isOpen: false, isReadOnly: false, session: null, date: "", records: {} })}
                        style={{ padding: "8px 16px", background: "#FFF", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#4A5568", fontWeight: 600, cursor: "pointer" }}
                      >
                        {attModal.isReadOnly ? "Close" : "Cancel"}
                      </button>

                      {!attModal.isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            const recsArray = studentList.map(st => ({
                              studentId: st.id,
                              status: attModal.records[st.id] || "present"
                            }));

                            const newAttRecord = {
                              id: "att-" + Date.now(),
                              sessionId: attModal.session.id,
                              date: attModal.date,
                              batchId: attModal.session.batchId,
                              subjectId: attModal.session.subjectId,
                              lecturerId: attModal.session.lecturerId,
                              markedBy: currentUser?.name || currentUser?.id || "admin",
                              markedAt: new Date().toISOString(),
                              isMakeup: attModal.session.isMakeup || false,
                              records: recsArray
                            };

                            const updated = sessionAttendance.filter(a => !(a.sessionId === attModal.session.id && a.date === attModal.date));
                            updated.push(newAttRecord);
                            setSessionAttendance(updated);
                            saveLS("pba_session_attendance", updated);

                            setAttModal({ isOpen: false, isReadOnly: false, session: null, date: "", records: {} });
                            triggerToast(`✓ Attendance saved for ${attModal.session.subjectName || "Subject"} — ${attModal.date}`);
                          }}
                          style={{ padding: "8px 20px", background: "#2B6CB0", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Save Attendance
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE MAKE-UP CLASS MODAL */}
      {makeUpModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "520px", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>Schedule Make-up Class</h3>
                <div style={{ fontSize: "12px", color: "#718096", marginTop: "4px" }}>
                  Replacing: {makeUpModal.session?.subjectName} · {makeUpModal.session?.batchName} · {makeUpModal.date}
                </div>
              </div>
              <button onClick={() => setMakeUpModal({ isOpen: false, session: null, date: "", classChange: null })} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!makeUpForm.date || !makeUpForm.classroomId) return;

                const makeUpSess = {
                  id: "sess-makeup-" + Date.now(),
                  batchId: makeUpModal.session.batchId,
                  batchName: makeUpModal.session.batchName,
                  subjectId: makeUpModal.session.subjectId,
                  subjectName: makeUpModal.session.subjectName,
                  lecturerId: makeUpModal.session.lecturerId,
                  lecturerName: makeUpModal.session.lecturerName,
                  classroomId: makeUpForm.classroomId,
                  classroomName: classrooms.find(c => c.id === makeUpForm.classroomId)?.name || "Room",
                  day: new Date(makeUpForm.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" }),
                  startTime: makeUpForm.startTime,
                  endTime: makeUpForm.endTime,
                  branch: makeUpModal.session.branch || getBranches()[0] || "Kohuwala",
                  isMakeup: true,
                  makeupForDate: makeUpModal.date,
                  makeupForSessionId: makeUpModal.session.id,
                  date: makeUpForm.date,
                  color: makeUpModal.session.color || "#2B6CB0",
                  notes: makeUpForm.notes || ""
                };

                const updatedSessions = [...sessions, makeUpSess];
                setSessions(updatedSessions);
                saveLS("pba_timetable_sessions", updatedSessions);

                const updatedChanges = classChanges.map(c => {
                  if (c.sessionId === makeUpModal.session.id && c.date === makeUpModal.date) {
                    return { ...c, makeupScheduled: true, makeupSessionId: makeUpSess.id };
                  }
                  return c;
                });
                setClassChanges(updatedChanges);
                saveLS("pba_class_changes", updatedChanges);

                setMakeUpModal({ isOpen: false, session: null, date: "", classChange: null });
                triggerToast(`✓ Make-up class scheduled for ${makeUpForm.date}`);
              }}
            >
              {/* 1. MAKE-UP DATE */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", marginBottom: "4px" }}>
                  Make-up Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={makeUpForm.date}
                  onChange={(e) => setMakeUpForm({ ...makeUpForm, date: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                />
                {makeUpForm.date && (() => {
                  const dayStr = new Date(makeUpForm.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });
                  const lecObj = allLecturers.find(u => u.id === makeUpModal.session?.lecturerId);
                  const availList = lecObj?.availability || [];
                  const dayAvail = availList.find(a => a.day === dayStr);
                  const isAvail = dayAvail ? dayAvail.isAvailable : true;

                  return (
                    <div style={{ fontSize: "11px", marginTop: "4px", color: isAvail ? "#276749" : "#C53030", fontWeight: 600 }}>
                      Lecturer available ({dayStr}): {isAvail ? "✓ Yes" : "✗ Not in declared availability"}
                    </div>
                  );
                })()}
              </div>

              {/* 2. TIMES */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", marginBottom: "4px" }}>Start Time</label>
                  <input
                    type="time"
                    value={makeUpForm.startTime}
                    onChange={(e) => setMakeUpForm({ ...makeUpForm, startTime: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", marginBottom: "4px" }}>End Time</label>
                  <input
                    type="time"
                    value={makeUpForm.endTime}
                    onChange={(e) => setMakeUpForm({ ...makeUpForm, endTime: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* CLASH CHECK */}
              {makeUpForm.date && (() => {
                const dayStr = new Date(makeUpForm.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });
                const daySessions = sessions.filter(s => s.day === dayStr || s.date === makeUpForm.date);
                const roomClash = daySessions.find(s => s.classroomId === makeUpForm.classroomId && timesOverlap(s.startTime, s.endTime, makeUpForm.startTime, makeUpForm.endTime));
                const lecClash = daySessions.find(s => s.lecturerId === makeUpModal.session?.lecturerId && timesOverlap(s.startTime, s.endTime, makeUpForm.startTime, makeUpForm.endTime));

                if (!roomClash && !lecClash) return null;

                const suggestedRoom = classrooms.find(c => c.id !== makeUpForm.classroomId && !daySessions.some(s => s.classroomId === c.id && timesOverlap(s.startTime, s.endTime, makeUpForm.startTime, makeUpForm.endTime)));

                return (
                  <div style={{ background: "#FFFBEB", border: "1px solid #F6D860", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#B7860A" }}>
                    {roomClash && <div>⚠ Classroom is booked for {roomClash.subjectName || "another class"} at this time.</div>}
                    {lecClash && <div>⚠ Lecturer has another class ({lecClash.subjectName}) at this time.</div>}
                    {suggestedRoom && (
                      <div style={{ fontWeight: 700, marginTop: "4px", color: "#2B6CB0" }}>
                        Suggested: {suggestedRoom.name} (available at this time)
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 3. CLASSROOM */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", marginBottom: "4px" }}>Classroom *</label>
                <select
                  value={makeUpForm.classroomId}
                  onChange={(e) => setMakeUpForm({ ...makeUpForm, classroomId: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", background: "#FFF", boxSizing: "border-box" }}
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.branch})</option>
                  ))}
                </select>
              </div>

              {/* 4. NOTES */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", marginBottom: "4px" }}>Notes (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Reason for make-up / additional notes..."
                  value={makeUpForm.notes}
                  onChange={(e) => setMakeUpForm({ ...makeUpForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "12px", boxSizing: "border-box" }}
                />
              </div>

              {/* FOOTER */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #E3E6EA", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setMakeUpModal({ isOpen: false, session: null, date: "", classChange: null })}
                  style={{ padding: "8px 16px", background: "#FFF", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#4A5568", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", background: "#2B6CB0", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                >
                  Save Make-up Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENROLLED STUDENTS PANEL */}
      {enrolledPanelBatch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "680px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3E6EA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                  Students — {enrolledPanelBatch.name}
                </h3>
                <div style={{ fontSize: "12px", color: "#718096", marginTop: "2px" }}>
                  {batchEnrollments.filter(e => e.batchId === enrolledPanelBatch.id && e.status === "active").length} / {enrolledPanelBatch.capacity || 40} enrolled
                </div>
              </div>
              <button onClick={() => setEnrolledPanelBatch(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}>
                <X size={18} />
              </button>
            </div>

            {/* Tabs & Search */}
            <div style={{ padding: "14px 24px", borderBottom: "1px solid #F0F2F5", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", background: "#F0F2F5", padding: "3px", borderRadius: "8px" }}>
                {["active", "withdrawn", "completed"].map(t => {
                  const count = batchEnrollments.filter(e => e.batchId === enrolledPanelBatch.id && e.status === t).length;
                  return (
                    <button
                      key={t}
                      onClick={() => setEnrolledTab(t)}
                      style={{
                        padding: "5px 14px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: enrolledTab === t ? 700 : 500,
                        background: enrolledTab === t ? "#FFFFFF" : "transparent",
                        color: enrolledTab === t ? "#2B6CB0" : "#718096",
                        cursor: "pointer",
                        textTransform: "capitalize"
                      }}
                    >
                      {t} ({count})
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                placeholder="Search by name or ID..."
                value={enrolledSearch}
                onChange={(e) => setEnrolledSearch(e.target.value)}
                style={{ padding: "6px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "12px", outline: "none" }}
              />
            </div>

            {/* Student List */}
            <div style={{ flex: 1, overflowY: "auto", maxHeight: "380px" }}>
              {(() => {
                const list = batchEnrollments.filter(e => e.batchId === enrolledPanelBatch.id && e.status === enrolledTab);

                const filtered = list.filter(e => {
                  const st = (data.students || []).find(s => s.id === e.studentId);
                  if (!st) return false;
                  if (enrolledSearch) {
                    const q = enrolledSearch.toLowerCase();
                    return st.name.toLowerCase().includes(q) || (st.regNo || "").toLowerCase().includes(q);
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: "30px", textAlign: "center", color: "#A0AEC0", fontSize: "13px" }}>
                      No {enrolledTab} students found in this batch.
                    </div>
                  );
                }

                return filtered.map(enr => {
                  const st = (data.students || []).find(s => s.id === enr.studentId);
                  if (!st) return null;

                  const initials = st.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

                  return (
                    <div
                      key={enr.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justify: "space-between",
                        padding: "10px 24px",
                        borderBottom: "1px solid #F0F2F5"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#EBF4FF", color: "#2B6CB0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px" }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>{st.name}</div>
                          <div style={{ fontSize: "11px", color: "#A0AEC0" }}>{st.regNo || st.id}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {enr.stream ? (
                          <span style={{ fontSize: "10px", fontWeight: 800, background: enr.stream === "science" ? "#F0FFF4" : "#FFFBEB", color: enr.stream === "science" ? "#276749" : "#B7860A", borderRadius: "10px", padding: "2px 8px" }}>
                            {enr.stream === "science" ? "SCI" : "COM"}
                          </span>
                        ) : (
                          <span style={{ fontSize: "10px", color: "#A0AEC0" }}>—</span>
                        )}

                        <span style={{ fontSize: "11px", color: "#A0AEC0" }}>
                          {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : ""}
                        </span>

                        {enrolledTab === "active" && (
                          <button
                            onClick={() => {
                              const updated = batchEnrollments.map(item => item.id === enr.id ? { ...item, status: "withdrawn" } : item);
                              setBatchEnrollments(updated);
                              saveLS("pba_batch_enrollments", updated);
                            }}
                            style={{ background: "none", border: "1px solid #FEB2B2", color: "#C53030", borderRadius: "6px", padding: "3px 8px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                          >
                            ✕ Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid #E3E6EA", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFBFC" }}>
              <button
                onClick={() => {
                  const headers = ["Student ID", "Reg No", "Full Name", "Stream", "Status", "Enrolled Date"];
                  const rows = batchEnrollments
                    .filter(e => e.batchId === enrolledPanelBatch.id)
                    .map(e => {
                      const st = (data.students || []).find(s => s.id === e.studentId);
                      return [e.studentId, st?.regNo || "", st?.name || "", e.stream || "", e.status, e.enrolledAt];
                    });
                  const csvStr = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                  const link = document.createElement("a");
                  link.setAttribute("href", encodeURI(csvStr));
                  link.setAttribute("download", `enrolled-students-${enrolledPanelBatch.code || enrolledPanelBatch.id}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
                style={{ padding: "7px 14px", background: "#D4A017", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                Download List (CSV)
              </button>

              <button
                onClick={() => {
                  setEnrollSelectedStudentIds([]);
                  setEnrollStream(null);
                  setEnrollSubjectIds([]);
                  setEnrollSearchQuery("");
                  setShowEnrollModal(true);
                }}
                style={{ padding: "8px 18px", background: "#2B6CB0", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                ＋ Enroll Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL STUDENTS MODAL */}
      {showEnrollModal && enrolledPanelBatch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "580px", maxHeight: "85vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                Enroll Students into {enrolledPanelBatch.name}
              </h3>
              <button onClick={() => setShowEnrollModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}>
                <X size={18} />
              </button>
            </div>

            {/* 1. Student Picker */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", marginBottom: "6px" }}>
                Select Students
              </label>
              <input
                type="text"
                placeholder="Search students by name or ID..."
                value={enrollSearchQuery}
                onChange={(e) => setEnrollSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "7px", fontSize: "12px", marginBottom: "8px", boxSizing: "border-box" }}
              />

              <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid #E3E6EA", borderRadius: "8px", padding: "6px" }}>
                {(() => {
                  const activeEnrolledIds = new Set(batchEnrollments.filter(e => e.batchId === enrolledPanelBatch.id && e.status === "active").map(e => e.studentId));
                  const unEnrolledList = (data.students || []).filter(s => !activeEnrolledIds.has(s.id) && (s.name.toLowerCase().includes(enrollSearchQuery.toLowerCase()) || (s.regNo || "").toLowerCase().includes(enrollSearchQuery.toLowerCase())));

                  if (unEnrolledList.length === 0) {
                    return <div style={{ padding: "10px", fontSize: "12px", color: "#A0AEC0", textAlign: "center" }}>No available students found</div>;
                  }

                  return unEnrolledList.map(st => {
                    const isChecked = enrollSelectedStudentIds.includes(st.id);
                    return (
                      <label key={st.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", cursor: "pointer", borderBottom: "1px solid #F0F2F5" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setEnrollSelectedStudentIds(enrollSelectedStudentIds.filter(id => id !== st.id));
                              } else {
                                setEnrollSelectedStudentIds([...enrollSelectedStudentIds, st.id]);
                              }
                            }}
                          />
                          {st.name} <span style={{ fontSize: "11px", color: "#A0AEC0" }}>({st.regNo || st.id})</span>
                        </div>
                        <span style={{ fontSize: "10px", background: "#F0F2F5", color: "#718096", borderRadius: "4px", padding: "2px 6px" }}>{st.branch || "Branch"}</span>
                      </label>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 2. Stream Assignment */}
            {enrollSelectedStudentIds.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", marginBottom: "6px" }}>
                  Stream for selected students
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { id: "science", label: "Science" },
                    { id: "commerce", label: "Commerce" },
                    { id: null, label: "None / Unset" }
                  ].map(st => (
                    <button
                      key={String(st.id)}
                      type="button"
                      onClick={() => setEnrollStream(st.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: enrollStream === st.id ? "#2B6CB0" : "#F7F8FA",
                        color: enrollStream === st.id ? "#FFF" : "#4A5568",
                        border: enrollStream === st.id ? "none" : "1px solid #E3E6EA"
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Subject Selection */}
            {enrollSelectedStudentIds.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", marginBottom: "6px" }}>
                  Select subjects this student will take
                </label>
                <div style={{ border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px", maxHeight: "140px", overflowY: "auto" }}>
                  {(enrolledPanelBatch.batchSubjects || []).map(bs => {
                    const subjObj = subjects.find(s => s.id === bs.subjectId);
                    const subjStream = bs.streamOverride || subjObj?.stream || "compulsory";
                    const isCompulsory = subjStream === "compulsory";
                    const isChecked = isCompulsory || enrollSubjectIds.includes(bs.subjectId);

                    return (
                      <label key={bs.subjectId} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "12px", cursor: isCompulsory ? "default" : "pointer" }}>
                        <input
                          type="checkbox"
                          disabled={isCompulsory}
                          checked={isChecked}
                          onChange={() => {
                            if (!isCompulsory) {
                              if (isChecked) {
                                setEnrollSubjectIds(enrollSubjectIds.filter(id => id !== bs.subjectId));
                              } else {
                                setEnrollSubjectIds([...enrollSubjectIds, bs.subjectId]);
                              }
                            }
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>{subjObj?.name || bs.subjectId}</span>
                        {isCompulsory && <span style={{ fontSize: "9px", background: "#FFF5F5", color: "#C53030", borderRadius: "4px", padding: "1px 4px" }}>CORE</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #E3E6EA", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                style={{ padding: "8px 16px", background: "#FFF", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#4A5568", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={enrollSelectedStudentIds.length === 0}
                onClick={() => {
                  const nowIso = new Date().toISOString();
                  const newEnrollments = enrollSelectedStudentIds.map(stId => ({
                    id: "enr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
                    studentId: stId,
                    batchId: enrolledPanelBatch.id,
                    subjectIds: enrollSubjectIds,
                    stream: enrollStream,
                    enrolledAt: nowIso,
                    status: "active"
                  }));

                  const updated = [...batchEnrollments, ...newEnrollments];
                  setBatchEnrollments(updated);
                  saveLS("pba_batch_enrollments", updated);

                  setShowEnrollModal(false);
                  triggerToast(`✓ Enrolled ${enrollSelectedStudentIds.length} student(s) into ${enrolledPanelBatch.name}`);
                }}
                style={{ padding: "8px 20px", background: enrollSelectedStudentIds.length === 0 ? "#A0AEC0" : "#2B6CB0", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: enrollSelectedStudentIds.length === 0 ? "default" : "pointer" }}
              >
                Enroll Selected ({enrollSelectedStudentIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MONTHLY CALENDAR */}
      {activeTab === "calendar" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", borderRadius: "12px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 10px", fontFamily: t.fontHeading, fontSize: "18px", fontWeight: 700 }}>Monthly Academic Calendar</h3>
          <p style={{ fontSize: "12px", color: "#718096" }}>Track term dates, holidays, examination weeks, and major institute events.</p>
        </div>
      )}

      {/* TAB 6: ANNOUNCEMENTS BOARD */}
      {activeTab === "announcements" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", borderRadius: "12px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 10px", fontFamily: t.fontHeading, fontSize: "18px", fontWeight: 700 }}>Announcements Board</h3>
          <p style={{ fontSize: "12px", color: "#718096" }}>Post broadcasts and administrative notices to lecturers, students, and staff.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PORTAL SETTINGS                                                    */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontFamily: t.fontHeading, fontSize: "18px", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                Portal Settings & Configurations
              </h3>
              <p style={{ fontSize: "12px", color: theme.textMuted, margin: "2px 0 0" }}>
                System-wide control over institute parameters, branches, streams, session types, and options.
              </p>
            </div>
            <button
              onClick={handleSaveAllSettings}
              style={{ background: "linear-gradient(135deg, #2B6CB0, #1A4A8A)", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(43,108,176,0.3)" }}
            >
              Save All Settings
            </button>
          </div>

          {/* 1. INSTITUTE BRANDING ACCORDION */}
          <div style={{ marginBottom: "12px" }}>
            <div onClick={() => toggleSection("branding")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#F7F8FA", border: "1px solid #E3E6EA", borderRadius: openSections.branding ? "10px 10px 0 0" : "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>1. Institute Branding</span>
              <span>{openSections.branding ? "▲" : "▼"}</span>
            </div>
            {openSections.branding && (
              <div style={{ border: "1px solid #E3E6EA", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px", background: "#FFFFFF" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "4px" }}>Institute Name</label>
                    <input type="text" value={settings.instituteName || ""} onChange={(e) => setSettings({ ...settings, instituteName: e.target.value })} style={{ width: "100%", padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "4px" }}>Subtitle</label>
                    <input type="text" value={settings.instituteSubtitle || ""} onChange={(e) => setSettings({ ...settings, instituteSubtitle: e.target.value })} style={{ width: "100%", padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "4px" }}>Tagline</label>
                    <input type="text" value={settings.tagline || ""} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} style={{ width: "100%", padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "4px" }}>Logo URL / Image Data</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input type="text" placeholder="https://... or data:image/..." value={settings.logoUrl || ""} onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })} style={{ flex: 1, padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "13px" }} />
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: settings.primaryColor || "#2B6CB0", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" }}>
                      {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", borderRadius: "50%" }} /> : (settings.instituteName || "PBA").substring(0, 2)}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "4px" }}>Primary Color</label>
                    <input type="color" value={settings.primaryColor || "#2B6CB0"} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} style={{ width: "100%", height: "34px", border: "1px solid #E3E6EA", borderRadius: "6px", cursor: "pointer", padding: "2px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "4px" }}>Accent / Gold Color</label>
                    <input type="color" value={settings.accentColor || "#D4A017"} onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })} style={{ width: "100%", height: "34px", border: "1px solid #E3E6EA", borderRadius: "6px", cursor: "pointer", padding: "2px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "4px" }}>Success Color</label>
                    <input type="color" value={settings.successColor || "#276749"} onChange={(e) => setSettings({ ...settings, successColor: e.target.value })} style={{ width: "100%", height: "34px", border: "1px solid #E3E6EA", borderRadius: "6px", cursor: "pointer", padding: "2px" }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handleSaveAllSettings} style={{ background: "none", border: "none", color: "#2B6CB0", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Save changes</button>
                </div>
              </div>
            )}
          </div>

          {/* 2. BRANCH MANAGEMENT ACCORDION */}
          <div style={{ marginBottom: "12px" }}>
            <div onClick={() => toggleSection("branches")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#F7F8FA", border: "1px solid #E3E6EA", borderRadius: openSections.branches ? "10px 10px 0 0" : "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>2. Branch Management</span>
              <span>{openSections.branches ? "▲" : "▼"}</span>
            </div>
            {openSections.branches && (
              <div style={{ border: "1px solid #E3E6EA", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px", background: "#FFFFFF" }}>
                <p style={{ fontSize: "12px", color: "#718096", margin: "0 0 12px" }}>Branches appear in all branch dropdowns across the portal.</p>
                {(settings.branches || []).map((b, idx) => (
                  <div key={b.id || idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #F0F2F5" }}>
                    <span style={{ color: "#A0AEC0", cursor: "grab" }}>≡</span>
                    <input type="text" value={b.name} onChange={(e) => { const updated = settings.branches.map((item, i) => i === idx ? { ...item, name: e.target.value } : item); setSettings({ ...settings, branches: updated }); }} style={{ flex: 1, padding: "6px 10px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "13px" }} />
                    <button type="button" onClick={() => { const updated = settings.branches.map((item, i) => i === idx ? { ...item, isActive: !item.isActive } : item); setSettings({ ...settings, branches: updated }); }} style={{ padding: "4px 10px", borderRadius: "12px", border: "none", fontSize: "11px", fontWeight: 700, background: b.isActive !== false ? "#F0FFF4" : "#EDF2F7", color: b.isActive !== false ? "#276749" : "#718096", cursor: "pointer" }}>
                      {b.isActive !== false ? "Active" : "Inactive"}
                    </button>
                    <button type="button" onClick={() => { const updated = settings.branches.filter((_, i) => i !== idx); setSettings({ ...settings, branches: updated }); }} style={{ background: "none", border: "none", color: "#C53030", cursor: "pointer", fontWeight: 700 }}>✕</button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, branches: [...(settings.branches || []), { id: "br-" + Date.now(), name: "New Branch", isActive: true }] })}
                  style={{ background: "none", border: "none", color: "#2B6CB0", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginTop: "10px" }}
                >
                  ＋ Add Branch
                </button>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handleSaveAllSettings} style={{ background: "none", border: "none", color: "#2B6CB0", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Save changes</button>
                </div>
              </div>
            )}
          </div>

          {/* 3. SUBJECT STREAMS ACCORDION */}
          <div style={{ marginBottom: "12px" }}>
            <div onClick={() => toggleSection("streams")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#F7F8FA", border: "1px solid #E3E6EA", borderRadius: openSections.streams ? "10px 10px 0 0" : "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>3. Subject Streams</span>
              <span>{openSections.streams ? "▲" : "▼"}</span>
            </div>
            {openSections.streams && (
              <div style={{ border: "1px solid #E3E6EA", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px", background: "#FFFFFF" }}>
                {(settings.streams || []).map((s, idx) => (
                  <div key={s.id || idx} style={{ borderBottom: "1px solid #F0F2F5", paddingBottom: "10px", marginBottom: "10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 120px 80px", gap: "10px", alignItems: "center", marginBottom: "6px" }}>
                      <input type="text" value={s.label} onChange={(e) => { const updated = settings.streams.map((item, i) => i === idx ? { ...item, label: e.target.value } : item); setSettings({ ...settings, streams: updated }); }} style={{ padding: "6px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                      <input type="text" value={s.shortLabel} onChange={(e) => { const updated = settings.streams.map((item, i) => i === idx ? { ...item, shortLabel: e.target.value } : item); setSettings({ ...settings, streams: updated }); }} style={{ padding: "6px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                      <input type="color" value={s.bgColor || "#FFF5F5"} onChange={(e) => { const updated = settings.streams.map((item, i) => i === idx ? { ...item, bgColor: e.target.value } : item); setSettings({ ...settings, streams: updated }); }} style={{ width: "100%", height: "30px", padding: "2px", border: "1px solid #E3E6EA", borderRadius: "6px" }} />
                      <input type="color" value={s.textColor || "#C53030"} onChange={(e) => { const updated = settings.streams.map((item, i) => i === idx ? { ...item, textColor: e.target.value } : item); setSettings({ ...settings, streams: updated }); }} style={{ width: "100%", height: "30px", padding: "2px", border: "1px solid #E3E6EA", borderRadius: "6px" }} />
                      <span style={{ background: s.bgColor, color: s.textColor, borderRadius: "10px", padding: "2px 8px", fontSize: "10px", fontWeight: 800, textAlign: "center" }}>{s.shortLabel}</span>
                    </div>
                    <input type="text" value={s.description || ""} onChange={(e) => { const updated = settings.streams.map((item, i) => i === idx ? { ...item, description: e.target.value } : item); setSettings({ ...settings, streams: updated }); }} style={{ width: "100%", padding: "4px 8px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "11px", color: "#718096" }} />
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handleSaveAllSettings} style={{ background: "none", border: "none", color: "#2B6CB0", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Save changes</button>
                </div>
              </div>
            )}
          </div>

          {/* 4. SESSION TYPES ACCORDION */}
          <div style={{ marginBottom: "12px" }}>
            <div onClick={() => toggleSection("sessionTypes")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#F7F8FA", border: "1px solid #E3E6EA", borderRadius: openSections.sessionTypes ? "10px 10px 0 0" : "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>4. Session Types</span>
              <span>{openSections.sessionTypes ? "▲" : "▼"}</span>
            </div>
            {openSections.sessionTypes && (
              <div style={{ border: "1px solid #E3E6EA", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px", background: "#FFFFFF" }}>
                {(settings.sessionTypes || []).map((st, idx) => (
                  <div key={st.id || idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", borderBottom: "1px solid #F0F2F5" }}>
                    <input type="text" value={st.label} onChange={(e) => { const updated = settings.sessionTypes.map((item, i) => i === idx ? { ...item, label: e.target.value } : item); setSettings({ ...settings, sessionTypes: updated }); }} style={{ flex: 1, padding: "6px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                    <input type="color" value={st.color || "#2B6CB0"} onChange={(e) => { const updated = settings.sessionTypes.map((item, i) => i === idx ? { ...item, color: e.target.value } : item); setSettings({ ...settings, sessionTypes: updated }); }} style={{ width: "40px", height: "30px", padding: "2px", border: "1px solid #E3E6EA", borderRadius: "6px" }} />
                    <button type="button" onClick={() => { const updated = settings.sessionTypes.filter((_, i) => i !== idx); setSettings({ ...settings, sessionTypes: updated }); }} style={{ background: "none", border: "none", color: "#C53030", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => setSettings({ ...settings, sessionTypes: [...(settings.sessionTypes || []), { id: "type-" + Date.now(), label: "New Type", color: "#2B6CB0" }] })} style={{ background: "none", border: "none", color: "#2B6CB0", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginTop: "10px" }}>＋ Add Session Type</button>
              </div>
            )}
          </div>

          {/* 5. CLASSROOM TYPES & FACILITIES */}
          <div style={{ marginBottom: "12px" }}>
            <div onClick={() => toggleSection("classrooms")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#F7F8FA", border: "1px solid #E3E6EA", borderRadius: openSections.classrooms ? "10px 10px 0 0" : "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>5. Classroom Types & Facilities</span>
              <span>{openSections.classrooms ? "▲" : "▼"}</span>
            </div>
            {openSections.classrooms && (
              <div style={{ border: "1px solid #E3E6EA", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px", background: "#FFFFFF", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <strong style={{ fontSize: "12px", display: "block", marginBottom: "8px" }}>Classroom Types</strong>
                  {(settings.classroomTypes || []).map((ct, idx) => (
                    <div key={ct.id || idx} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <input type="text" value={ct.label} onChange={(e) => { const updated = settings.classroomTypes.map((item, i) => i === idx ? { ...item, label: e.target.value } : item); setSettings({ ...settings, classroomTypes: updated }); }} style={{ flex: 1, padding: "5px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                      <button type="button" onClick={() => { const updated = settings.classroomTypes.filter((_, i) => i !== idx); setSettings({ ...settings, classroomTypes: updated }); }} style={{ background: "none", border: "none", color: "#C53030", cursor: "pointer" }}>✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setSettings({ ...settings, classroomTypes: [...(settings.classroomTypes || []), { id: "Room-" + Date.now(), label: "New Type", bgColor: "#EBF4FF", textColor: "#2B6CB0" }] })} style={{ background: "none", border: "none", color: "#2B6CB0", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>＋ Add Type</button>
                </div>

                <div>
                  <strong style={{ fontSize: "12px", display: "block", marginBottom: "8px" }}>Facility Options</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                    {(settings.facilities || []).map((f) => (
                      <span key={f} style={{ background: "#F0F2F5", borderRadius: "20px", padding: "4px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                        {f}
                        <span onClick={() => { const updated = settings.facilities.filter((item) => item !== f); setSettings({ ...settings, facilities: updated }); }} style={{ cursor: "pointer", fontWeight: 700 }}>×</span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input type="text" placeholder="New facility..." value={newFacilityInput} onChange={(e) => setNewFacilityInput(e.target.value)} style={{ flex: 1, padding: "5px 8px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                    <button type="button" onClick={() => { if (!newFacilityInput.trim()) return; setSettings({ ...settings, facilities: [...(settings.facilities || []), newFacilityInput.trim()] }); setNewFacilityInput(""); }} style={{ background: "#2B6CB0", color: "#FFF", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "12px" }}>Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. CURRICULUM & ACADEMIC LEVELS */}
          <div style={{ marginBottom: "12px" }}>
            <div onClick={() => toggleSection("curriculum")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#F7F8FA", border: "1px solid #E3E6EA", borderRadius: openSections.curriculum ? "10px 10px 0 0" : "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>6. Curriculum & Academic Levels</span>
              <span>{openSections.curriculum ? "▲" : "▼"}</span>
            </div>
            {openSections.curriculum && (
              <div style={{ border: "1px solid #E3E6EA", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px", background: "#FFFFFF", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <strong style={{ fontSize: "12px", display: "block", marginBottom: "8px" }}>Curricula</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                    {(settings.curricula || []).map((c) => (
                      <span key={c} style={{ background: "#EBF4FF", color: "#2B6CB0", borderRadius: "20px", padding: "4px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                        {c}
                        <span onClick={() => { const updated = settings.curricula.filter((item) => item !== c); setSettings({ ...settings, curricula: updated }); }} style={{ cursor: "pointer", fontWeight: 700 }}>×</span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input type="text" placeholder="New curriculum..." value={newCurriculumInput} onChange={(e) => setNewCurriculumInput(e.target.value)} style={{ flex: 1, padding: "5px 8px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                    <button type="button" onClick={() => { if (!newCurriculumInput.trim()) return; setSettings({ ...settings, curricula: [...(settings.curricula || []), newCurriculumInput.trim()] }); setNewCurriculumInput(""); }} style={{ background: "#2B6CB0", color: "#FFF", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "12px" }}>Add</button>
                  </div>
                </div>

                <div>
                  <strong style={{ fontSize: "12px", display: "block", marginBottom: "8px" }}>Academic Levels</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                    {(settings.academicLevels || []).map((l) => (
                      <span key={l} style={{ background: "#FAF5FF", color: "#6B46C1", borderRadius: "20px", padding: "4px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                        {l}
                        <span onClick={() => { const updated = settings.academicLevels.filter((item) => item !== l); setSettings({ ...settings, academicLevels: updated }); }} style={{ cursor: "pointer", fontWeight: 700 }}>×</span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input type="text" placeholder="New level..." value={newLevelInput} onChange={(e) => setNewLevelInput(e.target.value)} style={{ flex: 1, padding: "5px 8px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                    <button type="button" onClick={() => { if (!newLevelInput.trim()) return; setSettings({ ...settings, academicLevels: [...(settings.academicLevels || []), newLevelInput.trim()] }); setNewLevelInput(""); }} style={{ background: "#2B6CB0", color: "#FFF", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "12px" }}>Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 7. TIMETABLE CONFIGURATION */}
          <div style={{ marginBottom: "12px" }}>
            <div onClick={() => toggleSection("timetable")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#F7F8FA", border: "1px solid #E3E6EA", borderRadius: openSections.timetable ? "10px 10px 0 0" : "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>7. Timetable Configuration</span>
              <span>{openSections.timetable ? "▲" : "▼"}</span>
            </div>
            {openSections.timetable && (
              <div style={{ border: "1px solid #E3E6EA", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px", background: "#FFFFFF" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "4px" }}>Start Time</label>
                    <input type="time" value={settings.timetable?.startTime || "07:00"} onChange={(e) => setSettings({ ...settings, timetable: { ...settings.timetable, startTime: e.target.value } })} style={{ width: "100%", padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "4px" }}>End Time</label>
                    <input type="time" value={settings.timetable?.endTime || "21:00"} onChange={(e) => setSettings({ ...settings, timetable: { ...settings.timetable, endTime: e.target.value } })} style={{ width: "100%", padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "4px" }}>Slot Interval</label>
                    <select value={settings.timetable?.slotMinutes || 30} onChange={(e) => setSettings({ ...settings, timetable: { ...settings.timetable, slotMinutes: Number(e.target.value) } })} style={{ width: "100%", padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "13px" }}>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "6px" }}>Working Days</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
                      const curDays = settings.timetable?.workingDays || [];
                      const isIncluded = curDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => {
                            const updated = isIncluded ? curDays.filter((d) => d !== day) : [...curDays, day];
                            setSettings({ ...settings, timetable: { ...settings.timetable, workingDays: updated } });
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: isIncluded ? "#2B6CB0" : "#EDF2F7",
                            color: isIncluded ? "#FFFFFF" : "#718096",
                            cursor: "pointer"
                          }}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handleSaveAllSettings} style={{ background: "none", border: "none", color: "#2B6CB0", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Save changes</button>
                </div>
              </div>
            )}
          </div>

          {/* 8. ACADEMIC YEAR & TERMS */}
          <div style={{ marginBottom: "12px" }}>
            <div onClick={() => toggleSection("academicYear")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#F7F8FA", border: "1px solid #E3E6EA", borderRadius: openSections.academicYear ? "10px 10px 0 0" : "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>8. Academic Year & Terms</span>
              <span>{openSections.academicYear ? "▲" : "▼"}</span>
            </div>
            {openSections.academicYear && (
              <div style={{ border: "1px solid #E3E6EA", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px", background: "#FFFFFF" }}>
                <div style={{ marginBottom: "14px", width: "200px" }}>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", marginBottom: "4px" }}>Current Academic Year</label>
                  <input type="number" value={settings.academicYear?.current || 2026} onChange={(e) => setSettings({ ...settings, academicYear: { ...settings.academicYear, current: Number(e.target.value) } })} style={{ width: "100%", padding: "7px 10px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "13px" }} />
                </div>

                {(settings.academicYear?.termDates || []).map((t, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 40px", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                    <input type="text" value={t.term} onChange={(e) => { const updated = settings.academicYear.termDates.map((item, i) => i === idx ? { ...item, term: e.target.value } : item); setSettings({ ...settings, academicYear: { ...settings.academicYear, termDates: updated } }); }} style={{ padding: "6px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                    <input type="date" value={t.start} onChange={(e) => { const updated = settings.academicYear.termDates.map((item, i) => i === idx ? { ...item, start: e.target.value } : item); setSettings({ ...settings, academicYear: { ...settings.academicYear, termDates: updated } }); }} style={{ padding: "6px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                    <input type="date" value={t.end} onChange={(e) => { const updated = settings.academicYear.termDates.map((item, i) => i === idx ? { ...item, end: e.target.value } : item); setSettings({ ...settings, academicYear: { ...settings.academicYear, termDates: updated } }); }} style={{ padding: "6px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                    <button type="button" onClick={() => { const updated = settings.academicYear.termDates.filter((_, i) => i !== idx); setSettings({ ...settings, academicYear: { ...settings.academicYear, termDates: updated } }); }} style={{ background: "none", border: "none", color: "#C53030", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => setSettings({ ...settings, academicYear: { ...settings.academicYear, termDates: [...(settings.academicYear?.termDates || []), { term: `Term ${(settings.academicYear?.termDates || []).length + 1}`, start: "2026-09-01", end: "2026-12-15" }] } })} style={{ background: "none", border: "none", color: "#2B6CB0", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginTop: "8px" }}>＋ Add Term</button>
              </div>
            )}
          </div>

          {/* 9. YEAR PLAN EVENT TYPES */}
          <div style={{ marginBottom: "12px" }}>
            <div onClick={() => toggleSection("eventTypes")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#F7F8FA", border: "1px solid #E3E6EA", borderRadius: openSections.eventTypes ? "10px 10px 0 0" : "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>9. Year Plan Event Types</span>
              <span>{openSections.eventTypes ? "▲" : "▼"}</span>
            </div>
            {openSections.eventTypes && (
              <div style={{ border: "1px solid #E3E6EA", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px", background: "#FFFFFF" }}>
                {(settings.eventTypes || []).map((et, idx) => (
                  <div key={et.id || idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", borderBottom: "1px solid #F0F2F5" }}>
                    <input type="text" value={et.label} onChange={(e) => { const updated = settings.eventTypes.map((item, i) => i === idx ? { ...item, label: e.target.value } : item); setSettings({ ...settings, eventTypes: updated }); }} style={{ flex: 1, padding: "6px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                    <input type="color" value={et.bgColor || "#EBF4FF"} onChange={(e) => { const updated = settings.eventTypes.map((item, i) => i === idx ? { ...item, bgColor: e.target.value } : item); setSettings({ ...settings, eventTypes: updated }); }} style={{ width: "36px", height: "30px", padding: "2px", border: "1px solid #E3E6EA", borderRadius: "6px" }} />
                    <button type="button" onClick={() => { const updated = settings.eventTypes.filter((_, i) => i !== idx); setSettings({ ...settings, eventTypes: updated }); }} style={{ background: "none", border: "none", color: "#C53030", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 10. USER ROLES */}
          <div style={{ marginBottom: "24px" }}>
            <div onClick={() => toggleSection("userRoles")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#F7F8FA", border: "1px solid #E3E6EA", borderRadius: openSections.userRoles ? "10px 10px 0 0" : "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>10. User Roles</span>
              <span>{openSections.userRoles ? "▲" : "▼"}</span>
            </div>
            {openSections.userRoles && (
              <div style={{ border: "1px solid #E3E6EA", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px", background: "#FFFFFF" }}>
                {(settings.userRoles || []).map((ur, idx) => (
                  <div key={ur.id || idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", borderBottom: "1px solid #F0F2F5" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#718096", background: "#EDF2F7", padding: "4px 8px", borderRadius: "4px", width: "80px" }}>{ur.id}</span>
                    <input type="text" value={ur.label} onChange={(e) => { const updated = settings.userRoles.map((item, i) => i === idx ? { ...item, label: e.target.value } : item); setSettings({ ...settings, userRoles: updated }); }} style={{ flex: 1, padding: "6px", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BOTTOM RESET & EXPORT ACTIONS */}
          <div style={{ borderTop: "2px dashed #E3E6EA", paddingTop: "20px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "30px" }}>
            <button onClick={handleExportSettings} style={{ background: "#FFFFFF", border: "1px solid #2B6CB0", color: "#2B6CB0", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={14} /> Export Settings
            </button>
            <label style={{ background: "#FFFFFF", border: "1px solid #2B6CB0", color: "#2B6CB0", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <Upload size={14} /> Import Settings
              <input type="file" accept=".json" onChange={handleImportSettings} style={{ display: "none" }} />
            </label>
            <button onClick={handleResetSettings} style={{ background: "#FFF5F5", border: "1px solid #FEB2B2", color: "#C53030", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
              <RotateCcw size={14} /> Reset to Defaults
            </button>
          </div>

          {/* STICKY SAVE ALL BAR */}
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#FFFFFF", borderTop: "1px solid #E3E6EA", padding: "14px 24px", display: "flex", justifyContent: "flex-end", gap: "12px", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)", zIndex: 900 }}>
            <button onClick={handleSaveAllSettings} style={{ background: "linear-gradient(135deg, #2B6CB0, #1A4A8A)", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(43,108,176,0.3)" }}>
              Save All Settings
            </button>
          </div>

          {/* TOAST NOTIFICATION */}
          {showToast && (
            <div style={{ position: "fixed", bottom: "24px", right: "24px", background: "#276749", color: "#FFFFFF", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: "8px", zIndex: 9999 }}>
              <Check size={16} /> {toastMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
