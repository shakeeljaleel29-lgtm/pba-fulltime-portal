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

export const checkIfExtraClass = (newSession, batchList, timetableList) => {
  if (!newSession) return false;
  const batches = Array.isArray(batchList) && batchList.length > 0 ? batchList : safeLS('pba_batches', []);
  const timetable = Array.isArray(timetableList) && timetableList.length > 0 ? timetableList : safeLS('pba_timetable', []);

  const batch = (batches || []).find(b => b.id === newSession.batchId || b.name === newSession.batchName);
  const batchSubjects = batch?.subjects || batch?.batchSubjects || [];
  const batchSubject = (batchSubjects || []).find(
    bs => bs.subjectId === newSession.subjectId || bs.subjectName === newSession.subjectName || bs.subjectCode === newSession.subjectCode
  );
  const limit = batchSubject?.classesPerWeek;
  if (!limit) return false;

  const sessionDate = new Date(newSession.date || newSession.scheduledDate || newSession.timestamp || Date.now());
  const dayOfWeek = sessionDate.getDay(); // 0=Sun
  const weekStart = new Date(sessionDate);
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const thisWeekCount = (timetable || []).filter(s => {
    if (s.id && newSession.id && s.id === newSession.id) return false;
    if (newSession.lecturerId && s.lecturerId !== newSession.lecturerId) return false;
    if (newSession.subjectId && s.subjectId !== newSession.subjectId) return false;
    if (newSession.batchId && s.batchId !== newSession.batchId) return false;
    if (s.isExtra) return false;
    const sDate = new Date(s.date || s.scheduledDate || 0);
    return sDate >= weekStart && sDate <= weekEnd;
  }).length;

  return thisWeekCount >= limit;
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

export const getAdminCalendarEventColor = (type, fallbackColor) => {
  const norm = String(type || '').toLowerCase().replace(/[\s-_]+/g, ' ').trim();
  switch (norm) {
    case 'term start':
      return '#10B981';
    case 'term end':
      return '#3B82F6';
    case 'holiday':
      return '#EF4444';
    case 'exam week':
      return '#F59E0B';
    case 'exam':
      return '#EAB308';
    case 'leave':
      return '#F43F5E';
    case 'payment due':
    case 'payment':
      return '#059669';
    case 'event':
      return '#8B5CF6';
    case 'revision':
    case 'class':
      return '#06B6D4';
    default:
      return fallbackColor || '#6B7280';
  }
};

export const GeneralAdminView = ({ isMobile }) => {
  const isMobileState = isMobile !== undefined ? isMobile : (window.innerWidth < 768);
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

  // Subject Manager State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editSubjectId, setEditSubjectId]       = useState(null); // null = Create
  const [subjectForm, setSubjectForm] = useState({
    code: '', name: '', description: ''
  });
  const [showDeleteSubject, setShowDeleteSubject] = useState(false);
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState(null);
  const [assigningSubjectId, setAssigningSubjectId] = useState(null);

  // Sync state to LS
  useEffect(() => {
    saveLS("pba_subjects", subjects);
  }, [subjects]);

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
  const [enrollStep, setEnrollStep] = useState(1);
  const [studentConfigs, setStudentConfigs] = useState({});
  const [enrollSelectedStudentIds, setEnrollSelectedStudentIds] = useState([]);
  const [enrollStream, setEnrollStream] = useState(null);
  const [enrollSubjectIds, setEnrollSubjectIds] = useState([]);
  const [enrollSearchQuery, setEnrollSearchQuery] = useState("");

  // Monthly Calendar State
  // Bug 1 Fix: Default to current month and year
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  // Bug 2 Fix: Unified pba_calendar_events key with migration
  const [calendarEvents, setCalendarEvents] = useState(() => {
    const primary = safeLS("pba_calendar_events", []);
    if (primary && primary.length > 0) return primary;
    const legacy = safeLS("pba_academic_calendar", []);
    if (legacy && legacy.length > 0) {
      saveLS("pba_calendar_events", legacy);
      return legacy;
    }
    return [];
  });
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ date: "", title: "", type: "event", notes: "", color: "#8B5CF6" });
  const [editingEvent, setEditingEvent] = useState(null);

  // Today's Class Changes & Timetable & Attendance State
  const [todayDate, setTodayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timetable, setTimetable] = useState(() => {
    const t1 = safeLS("pba_timetable", []);
    const t2 = safeLS("pba_timetable_sessions", []);
    return (t1 && t1.length > 0) ? t1 : t2;
  });
  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const a1 = safeLS("pba_attendance", []);
    const a2 = safeLS("pba_session_attendance", []);
    return (a1 && a1.length > 0) ? a1 : a2;
  });
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceSession, setAttendanceSession] = useState(null);
  const [students, setStudents] = useState(() => safeLS("pba_students", []));
  const [attendanceMarks, setAttendanceMarks] = useState({});
  const [viewAttDetailsModal, setViewAttDetailsModal] = useState({ isOpen: false, session: null, records: [] });

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
    saveLS("pba_calendar_events", calendarEvents);
  }, [calendarEvents]);

  useEffect(() => {
    if (activeTab === "calendar") {
      const latest = safeLS("pba_calendar_events", []);
      setCalendarEvents(latest);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleStorageChange = () => {
      const updated = safeLS("pba_calendar_events", []);
      setCalendarEvents(updated);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    saveLS("pba_attendance", attendanceRecords);
    saveLS("pba_session_attendance", attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    saveLS("pba_batch_enrollments", batchEnrollments);
  }, [batchEnrollments]);

  useEffect(() => {
    saveLS("pba_session_attendance", sessionAttendance);
  }, [sessionAttendance]);

  useEffect(() => {
    saveLS("pba_class_changes", classChanges);
  }, [classChanges]);

  // ── One-time backfill: sync all existing batch enrollments to pba_students ──
  useEffect(() => {
    const allEnrollments = safeLS('pba_batch_enrollments', []);
    if (!allEnrollments || allEnrollments.length === 0) return;

    const existingProfiles = safeLS('pba_students', []);
    const profileMap = {};
    (existingProfiles || []).forEach(p => {
      const pid = p.id || p.regNo;
      if (pid) profileMap[pid] = p;
    });

    let changed = false;
    (allEnrollments || []).forEach(enr => {
      const sid = enr.studentId;
      if (!sid || profileMap[sid]) return; // already synced

      // Find student data from AppContext or existing pba_students
      const st =
        (data.students || []).find(s => s.id === sid) ||
        (students      || []).find(s => s.id === sid);
      if (!st) return;

      profileMap[sid] = {
        id:          sid,
        regNo:       st.regNo       || '',
        name:        st.name        || st.studentName || '',
        mobilePhone: st.mobilePhone || st.phone       || '',
        parentPhone: st.parentPhone || '',
        status:      st.status      || 'active'
      };
      changed = true;
    });

    if (changed) {
      const synced = Object.values(profileMap);
      saveLS('pba_students', synced);
      setStudents(synced);
    }
  }, []);
  // ── End backfill ──

  // ── FIX 3 Backfill: sync pba_students into pba_batches ──
  useEffect(() => {
    const _allStudents = safeLS('pba_students', []);
    const _allBatches  = safeLS('pba_batches',  []);

    if (!_allStudents?.length || !_allBatches?.length) return;

    let _changed = false;
    const _batchMap = {};
    (_allBatches || []).forEach(b => { _batchMap[b.id] = b; });

    (_allStudents || []).forEach(student => {
      const batchRef = student.batchId || student.batch
                    || student.batchEnrolled || student.batchName;
      if (!batchRef) return;

      // Try matching by ID first, then by name
      const targetBatch =
        _batchMap[batchRef] ||
        Object.values(_batchMap).find(b => b.name === batchRef);

      if (!targetBatch) return;

      const sid = student.id || student.regNo;
      if (!sid) return;

      const existingIds = new Set(
        (targetBatch.students || []).map(s => s.id || s.regNo)
      );
      if (existingIds.has(sid)) return;   // already there — skip

      // Student is missing from this batch — add them
      _batchMap[targetBatch.id] = {
        ...targetBatch,
        students: [
          ...(targetBatch.students || []),
          {
            id:          sid,
            regNo:       student.regNo       || '',
            name:        student.name        || student.studentName || '',
            mobilePhone: student.mobilePhone || student.phone || '',
            parentPhone: student.parentPhone || '',
            status:      student.status      || 'active',
            enrolledAt:  student.enrolledAt  || student.createdAt
                         || new Date().toISOString()
          }
        ]
      };
      _changed = true;
    });

    if (_changed) {
      const updatedBatches = Object.values(_batchMap);
      saveLS('pba_batches', updatedBatches);
      setBatches(updatedBatches);
    }
  }, []);
  // ── End pba_batches backfill ──

  // Tab 2: Classroom Manager State
  const [clsBranchFilter, setClsBranchFilter] = useState("All");
  const [clsTypeFilter, setClsTypeFilter] = useState("All");
  const [clsStatusFilter, setClsStatusFilter] = useState("All");
  const [clsSearch, setClsSearch] = useState("");

  // ── Classroom Manager state ──
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [editClassroomId, setEditClassroomId]       = useState(null);
  const [classroomForm, setClassroomForm] = useState({
    name: '', branch: '', capacity: 30,
    type: 'Classroom', amenities: [], status: 'Active'
  });
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateTarget, setDeactivateTarget]           = useState(null);



  useEffect(() => {
    setSubjects(safeLS('pba_subjects', []));
    setClassrooms(safeLS('pba_classrooms', []));
    const t1 = safeLS("pba_timetable", []);
    const t2 = safeLS("pba_timetable_sessions", []);
    setTimetable((Array.isArray(t1) && t1.length > 0) ? t1 : (Array.isArray(t2) ? t2 : []));
  }, [activeTab]);

  const getSubjectBatchCount = (subjectId) => {
    const batchList = safeLS('pba_batches', []);
    return (batchList || []).filter(b =>
      (b.subjects || b.batchSubjects || []).some(bs => bs.subjectId === subjectId)
    ).length;
  };

  // Daily Allocations Sheet & Week Offset State
  const [weekOffset, setWeekOffset] = useState(0);
  const [quickRoomSession, setQuickRoomSession] = useState(null);
  const [quickRoomId, setQuickRoomId] = useState('');
  const [quickRoomScope, setQuickRoomScope] = useState('week');

  const [allocDateOffset, setAllocDateOffset] = useState(0); // 0 = today, 1 = tomorrow, -1 = yesterday
  const [allocRefresh, setAllocRefresh] = useState(0);
  const [allocationDate, setAllocationDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedClassroomForSchedule, setSelectedClassroomForSchedule] = useState("All");

  const tomorrowDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const offsetDate = (dateStr, days) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const getDayName = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
  };

  const [dailyAllocationDate, setDailyAllocationDate] = useState(() => tomorrowDateString());
  const [, setRoomOverrideTick] = useState(0);

  const handleRoomOverride = (sessionId, newRoomId) => {
    const classroomsList = safeLS('pba_classrooms', classrooms || []);
    const room = (classroomsList || []).find(r => r.id === newRoomId);
    const existing = safeLS('pba_room_overrides', []);

    // Remove old override for this session+date, then add new one
    const filtered = (existing || []).filter(
      o => !(o.sessionId === sessionId && o.date === dailyAllocationDate)
    );
    if (newRoomId) {
      filtered.push({
        sessionId,
        date: dailyAllocationDate,
        classroomId: newRoomId,
        classroomName: room?.name || ''
      });
    }
    saveLS('pba_room_overrides', filtered);
    setRoomOverrideTick(n => n + 1);
  };

  const getSessionsForDate = (dateStr) => {
    const dayName = getDayName(dateStr); // e.g. "Thursday"
    const pbaSess = safeLS('pba_sessions', null);
    const allSessions = (Array.isArray(pbaSess) && pbaSess.length > 0)
      ? pbaSess
      : safeLS('pba_timetable_sessions', safeLS('pba_timetable', []));
    const overrides = safeLS('pba_room_overrides', []);
    const classroomsList = safeLS('pba_classrooms', classrooms || []);
    const batchesList = safeLS('pba_batches', batches || []);
    const lecturersList = safeLS('pba_lecturers', lecturers || []);

    return (allSessions || [])
      .filter(s => {
        if (s.recurrence === 'one_time') {
          return s.startDate === dateStr || s.date === dateStr;
        }
        if (s.day && s.day !== dayName && s.date !== dateStr) return false;
        // Respect start/end date if set
        if (s.startDate && dateStr < s.startDate) return false;
        if (s.endDate && dateStr > s.endDate) return false;
        return true;
      })
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
      .map(session => {
        const override = (overrides || []).find(
          o => o.sessionId === session.id && o.date === dateStr
        );
        const batch = (batchesList || []).find(b => b.id === session.batchId);
        const lecturer = (lecturersList || []).find(l => l.id === session.lecturerId);
        const defaultRoom = (classroomsList || []).find(c => c.id === session.classroomId);
        return {
          ...session,
          batchName: batch?.name || session.batchName || '—',
          lecturerName: lecturer?.name || session.lecturerName || '—',
          currentRoomId: override?.classroomId || session.classroomId || '',
          currentRoomName: override?.classroomName || defaultRoom?.name || session.classroomName || '—',
          hasOverride: !!override
        };
      });
  };

  const generateWhatsAppMessage = (sessionsList) => {
    const [y, m, d] = dailyAllocationDate.split('-').map(Number);
    const dateLabel = new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const lines = [
      `📅 *PBA Full-Time Portal — Class Schedule*`,
      `📆 *${dateLabel}*`,
      ``
    ];
    const targetSessions = sessionsList || getSessionsForDate(dailyAllocationDate);
    targetSessions.forEach(session => {
      lines.push(
        `🕐 *${session.startTime} – ${session.endTime}*` +
        ` | ${session.subject || 'Session'}` +
        ` | ${session.batchName}` +
        ` | ${session.lecturerName}` +
        ` | 🏫 ${session.currentRoomName}`
      );
    });
    lines.push(``);
    lines.push(`_Sent from PBA Full-Time Portal_`);
    return lines.join('\n');
  };

  const getAllocDate = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  };

  const allocDate = getAllocDate(allocDateOffset);
  const allocDayName = allocDate.toLocaleDateString('en-US', { weekday: 'long' });
  const allocDateStr = allocDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const allocDateLabel = (() => {
    if (allocDateOffset === 0) return `Today — ${allocDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}`;
    if (allocDateOffset === 1) return `Tomorrow — ${allocDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}`;
    if (allocDateOffset === -1) return `Yesterday — ${allocDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}`;
    return allocDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  })();

  const getWeekStart = (offset) => {
    const today = new Date();
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + (offset * 7));
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekStart = getWeekStart(weekOffset);
  const weekStartStr = weekStart.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const weekLabel = `Week of ${weekStart.getDate()} ${
    weekStart.toLocaleDateString('en-US', { month: 'short' })
  } ${weekStart.getFullYear()}`;

  const getDayDate = (dayIndex) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + dayIndex);
    return d.getDate() + ' ' +
      d.toLocaleDateString('en-US', { month: 'short' });
  };

  const resolveClassroom = (session, weekStartStr) => {
    const overrides = safeLS('pba_classroom_overrides', []);
    const override = (overrides || []).find(
      o => o.sessionId === session.id && (o.weekStart === weekStartStr || o.date === weekStartStr)
    );
    if (override) {
      return { classroomId: override.classroomId,
               classroomName: override.classroomName,
               isOverride: true };
    }
    return { classroomId: session.classroomId,
             classroomName: session.classroomName,
             isOverride: false };
  };

  const resolveAllocClassroom = (session, dateStr) => {
    const overrides = safeLS('pba_classroom_overrides', []);
    const dateOverride = (overrides || []).find(
      o => o.sessionId === session.id && o.date === dateStr
    );
    if (dateOverride) return {
      classroomId: dateOverride.classroomId,
      classroomName: dateOverride.classroomName,
      isOverride: true
    };
    const weekOverride = (overrides || []).find(
      o => o.sessionId === session.id && o.weekStart === dateStr
    );
    if (weekOverride) return {
      classroomId: weekOverride.classroomId,
      classroomName: weekOverride.classroomName,
      isOverride: true
    };
    return {
      classroomId: session.classroomId || '',
      classroomName: session.classroomName || '',
      isOverride: false
    };
  };

  const saveAllocClassroom = (session, dateStr, classroomId) => {
    const classroom = (classrooms || []).find(c => c.id === classroomId);
    const overrides = safeLS('pba_classroom_overrides', []);
    const cleaned = (overrides || []).filter(
      o => !(o.sessionId === session.id && (o.date === dateStr || o.weekStart === dateStr))
    );
    const newOverride = classroomId
      ? [{
          sessionId: session.id,
          date: dateStr,
          classroomId: classroom?.id || classroomId,
          classroomName: classroom?.name || ''
        }]
      : [];
    saveLS('pba_classroom_overrides', [...cleaned, ...newOverride]);
  };

  const buildWhatsAppMessage = () => {
    const timetable = safeLS('pba_timetable', []);
    const sessions = (timetable || [])
      .filter(s => s.day === allocDayName)
      .sort((a, b) => {
        const ta = (a.startTime || '00:00').replace(':', '');
        const tb = (b.startTime || '00:00').replace(':', '');
        return Number(ta) - Number(tb);
      });

    if (sessions.length === 0) {
      return `📋 *PBA Daily Allocation*\n${allocDateLabel}\n\nNo sessions scheduled.`;
    }

    const unassigned = sessions.filter(s => {
      const r = resolveAllocClassroom(s, allocDateStr);
      return !r.classroomId;
    }).length;

    let msg = `📋 *PBA Daily Allocation*\n`;
    msg += `📅 ${allocDateLabel}\n`;
    if (unassigned > 0) {
      msg += `⚠ ${unassigned} session(s) without classroom\n`;
    }
    msg += `\n`;

    sessions.forEach(s => {
      const room = resolveAllocClassroom(s, allocDateStr);
      const roomText = room.classroomName || '⚠ TBC';
      const assistants = (s.assistants || [])
        .filter(a => a.lecturerId)
        .map(a => a.lecturerName)
        .join(', ');

      msg += `🕐 *${s.startTime}–${s.endTime}*\n`;
      msg += `🏛 ${roomText}\n`;
      msg += `📚 ${s.subjectName || '—'} · ${s.batchName || '—'}\n`;
      msg += `👤 ${s.lecturerName || '—'}`;
      if (assistants) msg += ` (Asst: ${assistants})`;
      msg += `\n\n`;
    });

    msg += `_Sent from PBA Portal_`;
    return msg;
  };

  const allocSessions = (() => {
    const timetable = safeLS('pba_timetable', []);
    return (timetable || [])
      .filter(s => s.day === allocDayName)
      .sort((a, b) => {
        const ta = (a.startTime || '00:00').replace(':', '');
        const tb = (b.startTime || '00:00').replace(':', '');
        return Number(ta) - Number(tb);
      });
  })();

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
    const existingSubjs = b.batchSubjects || b.subjects || [];
    const formattedSubjs = existingSubjs.map((s) => {
      const primId = s.primaryLecturerId || s.mainLecturerId || s.lecturerId || "";
      const primName = s.primaryLecturerName || (allLecturers || []).find(l => l.id === primId)?.name || "";
      const assts = s.assistants || (s.assistantId ? [{ lecturerId: s.assistantId, lecturerName: (allLecturers || []).find(l => l.id === s.assistantId)?.name || "" }] : []);
      return {
        subjectId: s.subjectId || s.id,
        subjectName: s.subjectName || s.name || "",
        subjectCode: s.subjectCode || s.code || "",
        primaryLecturerId: primId,
        primaryLecturerName: primName,
        assistants: assts,
        classesPerWeek: Number(s.classesPerWeek || 2),
        mainLecturerId: primId,
        lecturerId: primId,
        assistantId: assts[0]?.lecturerId || "",
        defaultRecurrence: s.defaultRecurrence || s.recurrence || "weekly",
        recurrence: s.recurrence || s.defaultRecurrence || "weekly"
      };
    });
    setBatchForm({
      name: b.name || "",
      code: b.code || "",
      year: b.year || 2027,
      branch: b.branch || getBranches()[0] || "Kohuwala",
      curriculum: b.curriculum || getCurricula()[0] || "Cambridge",
      level: b.level || getLevels()[0] || "O Level",
      color: b.color || "#2B6CB0",
      isActive: b.isActive !== false,
      batchSubjects: formattedSubjs,
      subjects: formattedSubjs,
      noClashRules: b.noClashRules || []
    });
    setShowBatchModal(true);
  };

  const handleSaveBatch = () => {
    if (!batchForm.name.trim()) return;

    const assignedSubjects = (batchForm.batchSubjects || []).map((bs) => {
      const subObj = (subjects || []).find((s) => s.id === bs.subjectId);
      const primId = bs.primaryLecturerId || bs.mainLecturerId || bs.lecturerId || "";
      const primName = bs.primaryLecturerName || (allLecturers || []).find(l => l.id === primId)?.name || "";
      const assts = bs.assistants || (bs.assistantId ? [{ lecturerId: bs.assistantId, lecturerName: (allLecturers || []).find(l => l.id === bs.assistantId)?.name || "" }] : []);

      return {
        subjectId: bs.subjectId,
        subjectName: bs.subjectName || subObj?.name || bs.subjectId,
        subjectCode: bs.subjectCode || subObj?.code || "SUB",
        primaryLecturerId: primId,
        primaryLecturerName: primName,
        assistants: assts,
        classesPerWeek: Number(bs.classesPerWeek || 2),
        lecturerId: primId,
        mainLecturerId: primId,
        assistantId: assts[0]?.lecturerId || "",
        recurrence: bs.defaultRecurrence || bs.recurrence || "weekly",
        defaultRecurrence: bs.defaultRecurrence || bs.recurrence || "weekly"
      };
    });

    const updatedBatchForm = {
      ...batchForm,
      subjects: assignedSubjects,
      batchSubjects: assignedSubjects
    };

    let updated;
    if (editingBatchId) {
      updated = batches.map((b) => (b.id === editingBatchId ? { ...b, ...updatedBatchForm } : b));
    } else {
      const newBatch = {
        ...updatedBatchForm,
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

  const toggleBatchSubject = (subjectOrId) => {
    const subjId = typeof subjectOrId === "object" ? subjectOrId.id : subjectOrId;
    const subObj = (subjects || []).find((s) => s.id === subjId);
    const cur = batchForm.batchSubjects || [];
    const exists = cur.some((s) => s.subjectId === subjId);
    let updatedBS;

    if (exists) {
      updatedBS = cur.filter((s) => s.subjectId !== subjId);
    } else {
      updatedBS = [
        ...cur,
        {
          subjectId: subjId,
          subjectName: subObj?.name || "",
          subjectCode: subObj?.code || "",
          primaryLecturerId: "",
          primaryLecturerName: "",
          assistants: [],
          classesPerWeek: 2,
          mainLecturerId: "",
          lecturerId: "",
          assistantId: "",
          defaultRecurrence: "weekly",
          recurrence: "weekly",
          createdAt: new Date().toISOString()
        }
      ];
    }
    setBatchForm((prev) => ({ ...prev, batchSubjects: updatedBS, subjects: updatedBS }));
  };

  const toggleSubject = toggleBatchSubject;

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
          onClick={() => setActiveTab("subjects")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "subjects" ? 600 : 500,
            color: activeTab === "subjects" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "subjects" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            boxShadow: activeTab === "subjects" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <BookOpen size={16} /> Subject Manager
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
          onClick={() => setActiveTab("dailyAllocation")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "dailyAllocation" ? 600 : 500,
            color: activeTab === "dailyAllocation" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "dailyAllocation" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            boxShadow: activeTab === "dailyAllocation" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          📋 Daily Allocation
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
      {/* TAB: SUBJECT MANAGER                                                      */}
      {/* ========================================================================= */}
      {activeTab === "subjects" && (
  <div>
    {/* ── Subject Manager Header ── */}
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: '24px'
    }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800,
          color: '#1A202C' }}>
          Subject Manager
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
          Create subjects and assign them to batches with lecturer allocations.
        </p>
      </div>
      <button
        onClick={() => {
          setEditSubjectId(null);
          setSubjectForm({ code: '', name: '', description: '' });
          setShowSubjectModal(true);
        }}
        style={{
          padding: '10px 20px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          border: 'none', color: 'white',
          fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
        + Create Subject
      </button>
    </div>

    {/* ── Subject Cards Grid ── */}
    {(subjects || []).length === 0 ? (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        color: '#9CA3AF'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
        <div style={{ fontWeight: 700, fontSize: '15px',
          marginBottom: '6px', color: '#6B7280' }}>
          No subjects yet
        </div>
        <div style={{ fontSize: '13px' }}>
          Click "+ Create Subject" to add your first subject.
        </div>
      </div>
    ) : (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {(subjects || []).map(subject => {
          const batchCount = (() => {
            const batches = safeLS('pba_batches', []);
            return (batches || []).filter(b =>
              (b.subjects || []).some(bs =>
                bs.subjectId === subject.id
              )
            ).length;
          })();

          return (
            <div key={subject.id} style={{
              background: 'white', borderRadius: '14px',
              border: '1px solid #E8ECF0',
              padding: '18px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
              {/* Card top row */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: '10px'
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: 800,
                  color: '#4F46E5', background: '#EEF2FF',
                  padding: '3px 8px', borderRadius: '6px',
                  letterSpacing: '0.06em'
                }}>
                  {subject.code || subject.subjectCode || '—'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {/* Edit button */}
                  <button
                    onClick={() => {
                      setEditSubjectId(subject.id);
                      setSubjectForm({
                        code: subject.code || subject.subjectCode || '',
                        name: subject.name || subject.subjectName || '',
                        description: subject.description || ''
                      });
                      setShowSubjectModal(true);
                    }}
                    title="Edit subject"
                    style={{
                      background: '#F8FAFC', border: '1px solid #E3E6EA',
                      borderRadius: '7px', width: '30px', height: '30px',
                      cursor: 'pointer', fontSize: '14px',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    ✏️
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => {
                      setDeleteSubjectTarget(subject);
                      setShowDeleteSubject(true);
                    }}
                    title="Delete subject"
                    style={{
                      background: '#FEF2F2', border: '1px solid #FCA5A5',
                      borderRadius: '7px', width: '30px', height: '30px',
                      cursor: 'pointer', fontSize: '14px',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    🗑️
                  </button>
                </div>
              </div>

              {/* Subject name */}
              <div style={{
                fontSize: '16px', fontWeight: 800, color: '#1A202C',
                marginBottom: '10px'
              }}>
                {subject.name || subject.subjectName || '—'}
              </div>

              {/* Description */}
              {(subject.description) && (
                <div style={{
                  fontSize: '12px', color: '#6B7280',
                  marginBottom: '10px'
                }}>
                  {subject.description}
                </div>
              )}

              {/* Batch count */}
              <div style={{
                fontSize: '12px', fontWeight: 600,
                color: batchCount > 0 ? '#059669' : '#9CA3AF'
              }}>
                {batchCount > 0
                  ? `✓ Assigned to ${batchCount} batch${batchCount > 1 ? 'es' : ''}`
                  : '— Not assigned to any batch'}
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* ── Create / Edit Subject Modal ── */}
    {showSubjectModal && (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 2000,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'white', borderRadius: '16px',
          width: '100%', maxWidth: '460px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          padding: '28px'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '22px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800,
              color: '#1A202C' }}>
              {editSubjectId ? 'Edit Subject' : 'Create Subject'}
            </h3>
            <button
              onClick={() => setShowSubjectModal(false)}
              style={{
                background: '#F3F4F6', border: 'none', borderRadius: '8px',
                width: '34px', height: '34px', fontSize: '20px',
                cursor: 'pointer', color: '#6B7280'
              }}>
              ×
            </button>
          </div>

          {/* Code */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '12px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'block', marginBottom: '6px'
            }}>
              Subject Code *
            </label>
            <input
              type="text"
              value={subjectForm.code}
              onChange={e => setSubjectForm(p => ({
                ...p, code: e.target.value.toUpperCase().slice(0, 6)
              }))}
              placeholder="e.g. BIO"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid #E3E6EA', fontSize: '14px',
                fontWeight: 700, boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '12px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'block', marginBottom: '6px'
            }}>
              Subject Name *
            </label>
            <input
              type="text"
              value={subjectForm.name}
              onChange={e => setSubjectForm(p => ({
                ...p, name: e.target.value
              }))}
              placeholder="e.g. Biology"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid #E3E6EA', fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              fontSize: '12px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'block', marginBottom: '6px'
            }}>
              Description{' '}
              <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
                (optional)
              </span>
            </label>
            <textarea
              value={subjectForm.description}
              onChange={e => setSubjectForm(p => ({
                ...p, description: e.target.value
              }))}
              rows={2}
              placeholder="Brief description..."
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid #E3E6EA', fontSize: '13px',
                resize: 'vertical', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            display: 'flex', gap: '10px', justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowSubjectModal(false)}
              style={{
                padding: '10px 20px', borderRadius: '8px',
                border: '1px solid #E3E6EA', background: 'white',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}>
              Cancel
            </button>
            <button
              onClick={() => {
                if (!subjectForm.code.trim() || !subjectForm.name.trim()) return;
                const existing = safeLS('pba_subjects', []);
                let updated;
                if (editSubjectId) {
                  updated = (existing || []).map(s =>
                    s.id === editSubjectId
                      ? { ...s,
                          code: subjectForm.code.trim(),
                          subjectCode: subjectForm.code.trim(),
                          name: subjectForm.name.trim(),
                          subjectName: subjectForm.name.trim(),
                          description: subjectForm.description.trim() }
                      : s
                  );
                } else {
                  const newSub = {
                    id: `sub_${Date.now()}`,
                    code: subjectForm.code.trim(),
                    subjectCode: subjectForm.code.trim(),
                    name: subjectForm.name.trim(),
                    subjectName: subjectForm.name.trim(),
                    description: subjectForm.description.trim(),
                    createdAt: new Date().toISOString()
                  };
                  updated = [...(existing || []), newSub];
                }
                saveLS('pba_subjects', updated);
                setSubjects(updated);
                setShowSubjectModal(false);
                setEditSubjectId(null);
              }}
              style={{
                padding: '10px 24px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                border: 'none', color: 'white',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}>
              {editSubjectId ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Delete Confirmation Modal ── */}
    {showDeleteSubject && deleteSubjectTarget && (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 2001,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'white', borderRadius: '16px',
          width: '100%', maxWidth: '400px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          padding: '28px'
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 800 }}>
            Delete Subject?
          </h3>
          <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 16px' }}>
            You are about to delete{' '}
            <strong>
              {deleteSubjectTarget.name || deleteSubjectTarget.subjectName}
            </strong>{' '}
            ({deleteSubjectTarget.code || deleteSubjectTarget.subjectCode}).
            This cannot be undone.
          </p>
          <div style={{
            display: 'flex', gap: '10px', justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => {
                setShowDeleteSubject(false);
                setDeleteSubjectTarget(null);
              }}
              style={{
                padding: '10px 20px', borderRadius: '8px',
                border: '1px solid #E3E6EA', background: 'white',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}>
              Cancel
            </button>
            <button
              onClick={() => {
                const existing = safeLS('pba_subjects', []);
                const updated = (existing || []).filter(
                  s => s.id !== deleteSubjectTarget.id
                );
                saveLS('pba_subjects', updated);
                setSubjects(updated);
                setShowDeleteSubject(false);
                setDeleteSubjectTarget(null);
              }}
              style={{
                padding: '10px 22px', borderRadius: '8px',
                background: '#DC2626', border: 'none', color: 'white',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}

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

                    {/* ENROLLMENT COUNT */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12px", color: "#718096", whiteSpace: "nowrap" }}>
                        👤 {activeEnrollments.length} students enrolled
                      </span>
                      <div style={{ flex: 1, height: "6px", background: "#E3E6EA", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: activeEnrollments.length > 0 ? "100%" : "0%",
                            background: "#276749",
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
            <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
              <div style={{ background: "#FFFFFF", borderRadius: "12px", width: isMobileState ? "95vw" : "640px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
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

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
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
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Assign Subjects & Lecturer Allocation
                        </h4>
                        <input
                          type="text"
                          placeholder="Search subjects..."
                          value={subjSearch}
                          onChange={(e) => setSubjSearch(e.target.value)}
                          style={{ padding: '6px 12px', border: '1px solid #E3E6EA', borderRadius: '8px', fontSize: '12px', width: '200px' }}
                        />
                      </div>

                      {(subjects || []).length === 0 && (
                        <div style={{ padding: '16px', background: '#FEF3C7', borderRadius: '8px', border: '1px solid #FDE68A', marginBottom: '12px' }}>
                          <p style={{ fontSize: '12px', color: '#D97706', fontWeight: 600, margin: 0 }}>
                            ⚠ No subjects found. Create subjects first in Subject Manager tab.
                          </p>
                        </div>
                      )}

                      <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                        {(subjects || [])
                          .filter((sub) =>
                            (sub.name || "").toLowerCase().includes(subjSearch.toLowerCase()) ||
                            (sub.code || "").toLowerCase().includes(subjSearch.toLowerCase())
                          )
                          .map((sub) => {
                            const assigned = (batchForm.batchSubjects || []).find(bs => bs.subjectId === sub.id);
                            const isAssigned = !!assigned;
                            const isExpanded = assigningSubjectId === sub.id;

                            return (
                              <div
                                key={sub.id}
                                style={{
                                  border: `1px solid ${isAssigned ? '#C7D2FE' : '#E2E8F0'}`,
                                  borderRadius: '10px',
                                  marginBottom: '8px',
                                  background: isAssigned ? '#EEF2FF' : '#FAFAFA',
                                  overflow: 'hidden'
                                }}
                              >
                                {/* Row header: checkbox + subject info + expand */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 14px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    if (!isAssigned) {
                                      const newEntry = {
                                        subjectId: sub.id,
                                        subjectName: sub.name,
                                        subjectCode: sub.code || '',
                                        primaryLecturerId: '',
                                        primaryLecturerName: '',
                                        assistants: [],
                                        classesPerWeek: 2,
                                        mainLecturerId: '',
                                        lecturerId: '',
                                        assistantId: '',
                                        defaultRecurrence: 'weekly',
                                        recurrence: 'weekly',
                                        createdAt: new Date().toISOString()
                                      };
                                      const updatedBS = [...(batchForm.batchSubjects || []), newEntry];
                                      setBatchForm((prev) => ({ ...prev, batchSubjects: updatedBS, subjects: updatedBS }));
                                      setAssigningSubjectId(sub.id);
                                    } else {
                                      setAssigningSubjectId(isExpanded ? null : sub.id);
                                    }
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={() => {}}
                                    style={{ width: '16px', height: '16px', accentColor: '#4F46E5', cursor: 'pointer', flexShrink: 0 }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A202C' }}>
                                      {sub.code ? `${sub.code} — ` : ''}{sub.name}
                                    </span>
                                    {isAssigned && (assigned?.primaryLecturerName || assigned?.classesPerWeek) && (
                                      <span style={{ fontSize: '11px', color: '#4F46E5', marginLeft: '8px', fontWeight: 600 }}>
                                        · {assigned.primaryLecturerName || 'No Lecturer set'}
                                        {assigned.classesPerWeek ? ` · ${assigned.classesPerWeek}×/wk` : ''}
                                        {(assigned.assistants || []).length > 0 ? ` · ${assigned.assistants.length} asst.` : ''}
                                      </span>
                                    )}
                                  </div>
                                  {isAssigned && (
                                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                      {isExpanded ? '▲' : '▼'}
                                    </span>
                                  )}
                                  {isAssigned && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!window.confirm(`Remove ${sub.name} from this batch?`)) return;
                                        const updatedBS = (batchForm.batchSubjects || []).filter(bs => bs.subjectId !== sub.id);
                                        setBatchForm((prev) => ({ ...prev, batchSubjects: updatedBS, subjects: updatedBS }));
                                        if (assigningSubjectId === sub.id) setAssigningSubjectId(null);
                                      }}
                                      style={{
                                        background: '#FEF2F2',
                                        border: '1px solid #FCA5A5',
                                        borderRadius: '6px',
                                        color: '#DC2626',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '3px 8px',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                      }}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>

                                {/* Expanded details */}
                                {isAssigned && isExpanded && (
                                  <div style={{ borderTop: '1px solid #C7D2FE', padding: '14px', background: 'white' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                      {/* Primary Lecturer */}
                                      <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>
                                          Primary Lecturer
                                        </label>
                                        <select
                                          value={assigned.primaryLecturerId || assigned.mainLecturerId || assigned.lecturerId || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const lect = (allLecturers || []).find(l => l.id === val);
                                            const updatedBS = (batchForm.batchSubjects || []).map(bs =>
                                              bs.subjectId === sub.id
                                                ? {
                                                    ...bs,
                                                    primaryLecturerId: val,
                                                    primaryLecturerName: lect?.name || '',
                                                    mainLecturerId: val,
                                                    lecturerId: val
                                                  }
                                                : bs
                                            );
                                            setBatchForm(prev => ({ ...prev, batchSubjects: updatedBS, subjects: updatedBS }));
                                          }}
                                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E3E6EA', fontSize: '13px', background: 'white' }}
                                        >
                                          <option value="">— Select Lecturer —</option>
                                          {(allLecturers || []).map((l) => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Classes per Week */}
                                      <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>
                                          Classes per Week
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <input
                                            type="number"
                                            min={1}
                                            max={7}
                                            value={assigned.classesPerWeek || 2}
                                            onChange={(e) => {
                                              const val = Number(e.target.value);
                                              const updatedBS = (batchForm.batchSubjects || []).map(bs =>
                                                bs.subjectId === sub.id
                                                  ? { ...bs, classesPerWeek: val }
                                                  : bs
                                              );
                                              setBatchForm(prev => ({ ...prev, batchSubjects: updatedBS, subjects: updatedBS }));
                                            }}
                                            style={{ width: '70px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E3E6EA', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}
                                          />
                                          <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                            per week<br />
                                            <span style={{ fontSize: '10px', color: '#D97706' }}>
                                              Extra classes flagged above this
                                            </span>
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Assistants section */}
                                    <div style={{ marginTop: '14px' }}>
                                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                                        Assistant Lecturers
                                        <span style={{ fontSize: '10px', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px', color: '#9CA3AF' }}>
                                          (optional — can cover sessions for this subject)
                                        </span>
                                      </label>

                                      {(assigned.assistants || []).map((asst, aIdx) => (
                                        <div key={aIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                          <select
                                            value={asst.lecturerId || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              const lect = (allLecturers || []).find(l => l.id === val);
                                              const updatedBS = (batchForm.batchSubjects || []).map(bs => {
                                                if (bs.subjectId !== sub.id) return bs;
                                                const newAssistants = [...(bs.assistants || [])];
                                                newAssistants[aIdx] = {
                                                  lecturerId: val,
                                                  lecturerName: lect?.name || ''
                                                };
                                                return { ...bs, assistants: newAssistants, assistantId: newAssistants[0]?.lecturerId || '' };
                                              });
                                              setBatchForm(prev => ({ ...prev, batchSubjects: updatedBS, subjects: updatedBS }));
                                            }}
                                            style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #E3E6EA', fontSize: '13px', background: 'white' }}
                                          >
                                            <option value="">— Select Assistant —</option>
                                            {(allLecturers || [])
                                              .filter(l => l.id !== (assigned.primaryLecturerId || assigned.mainLecturerId || assigned.lecturerId))
                                              .map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                              ))}
                                          </select>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedBS = (batchForm.batchSubjects || []).map(bs => {
                                                if (bs.subjectId !== sub.id) return bs;
                                                const newAssistants = (bs.assistants || []).filter((_, i) => i !== aIdx);
                                                return { ...bs, assistants: newAssistants, assistantId: newAssistants[0]?.lecturerId || '' };
                                              });
                                              setBatchForm(prev => ({ ...prev, batchSubjects: updatedBS, subjects: updatedBS }));
                                            }}
                                            style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#DC2626', width: '28px', height: '28px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}

                                      {(assigned.assistants || []).length < 5 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedBS = (batchForm.batchSubjects || []).map(bs =>
                                              bs.subjectId === sub.id
                                                ? { ...bs, assistants: [...(bs.assistants || []), { lecturerId: '', lecturerName: '' }] }
                                                : bs
                                            );
                                            setBatchForm(prev => ({ ...prev, batchSubjects: updatedBS, subjects: updatedBS }));
                                          }}
                                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px dashed #4F46E5', background: '#EEF2FF', color: '#4F46E5', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
                                        >
                                          + Add Assistant
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                        <button
                          type="button"
                          onClick={() => setBatchWizardStep(1)}
                          style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setBatchWizardStep(3)}
                          style={{ background: "#2B6CB0", color: "#FFFFFF", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Next: Scheduling Rules →
                        </button>
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
                  setEditClassroomId(null);
                  setClassroomForm({
                    name: '', branch: '', capacity: 30,
                    type: 'Classroom', amenities: [], status: 'Active'
                  });
                  setShowClassroomModal(true);
                }}
                style={{
                  background: "#1D4ED8",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Plus size={15} /> + Add Classroom
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
          <div style={{ display: "grid", gridTemplateColumns: isMobileState ? "1fr" : "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {(filteredClassrooms || []).map((room) => {
              const isActive = room.status ? room.status === 'Active' : room.isActive !== false;
              const facilitiesList = room.amenities || room.facilities || [];
              return (
                <div
                  key={room.id}
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
                        {room.name ?? "—"}
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
                        {room.branch ?? "—"}
                      </span>
                      <span style={{ fontSize: "12px", color: "#718096" }}>
                        👤 {room.capacity ?? 0} seats
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
                        {room.type ?? "—"}
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
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid #F0F2F5",
                        paddingTop: "10px",
                        marginTop: "4px"
                      }}
                    >
                      <button
                        onClick={() => {
                          setEditClassroomId(room.id);
                          setClassroomForm({
                            name:      room.name      || '',
                            branch:    room.branch    || '',
                            capacity:  room.capacity  || 30,
                            type:      room.type      || 'Classroom',
                            amenities: room.amenities || room.facilities || [],
                            status:    room.status    || (room.isActive !== false ? 'Active' : 'Inactive')
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
                        onClick={() => {
                          setDeactivateTarget(room);
                          setShowDeactivateConfirm(true);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: isActive ? "#D97706" : "#059669",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        {isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Daily Allocation Sheet */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '18px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '16px', flexWrap: 'wrap', gap: '12px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800,
                  color: '#1A202C' }}>
                  Daily Allocation Sheet
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                  Classroom usage schedule for the selected date
                </p>
              </div>

              {/* Share via WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  const msg = buildWhatsAppMessage();
                  const encoded = encodeURIComponent(msg);
                  window.open(`https://wa.me/?text=${encoded}`, '_blank');
                }}
                style={{
                  padding: '8px 16px', borderRadius: '8px',
                  background: '#25D366', border: 'none', color: 'white',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                📤 Share via WhatsApp
              </button>
            </div>

            {/* Date Navigation */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '16px', flexWrap: 'wrap', background: '#F8FAFC',
              padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0'
            }}>
              {/* Prev Day */}
              <button
                type="button"
                onClick={() => setAllocDateOffset(prev => prev - 1)}
                style={{
                  padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                  background: 'white', border: '1px solid #E3E6EA',
                  fontWeight: 600, fontSize: '13px', color: '#374151'
                }}>
                ← Prev
              </button>

              {/* Date label */}
              <div style={{
                fontWeight: 800, fontSize: '15px', color: '#111827',
                flex: 1, textAlign: 'center', minWidth: '200px'
              }}>
                📅 {allocDateLabel}
              </div>

              {/* Next Day */}
              <button
                type="button"
                onClick={() => setAllocDateOffset(prev => prev + 1)}
                style={{
                  padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                  background: 'white', border: '1px solid #E3E6EA',
                  fontWeight: 600, fontSize: '13px', color: '#374151'
                }}>
                Next →
              </button>

              {/* Today shortcut */}
              {allocDateOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setAllocDateOffset(0)}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                    background: '#EEF2FF', border: '1px solid #C7D2FE',
                    fontWeight: 700, fontSize: '12px', color: '#4F46E5'
                  }}>
                  Today
                </button>
              )}

              {/* Tomorrow shortcut */}
              {allocDateOffset !== 1 && (
                <button
                  type="button"
                  onClick={() => setAllocDateOffset(1)}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                    background: '#F0FDF4', border: '1px solid #BBF7D0',
                    fontWeight: 700, fontSize: '12px', color: '#166534'
                  }}>
                  Tomorrow
                </button>
              )}
            </div>

            {/* Room Assignment Progress Banner */}
            {(() => {
              const total = allocSessions.length;
              const assigned = allocSessions.filter(s => {
                const r = resolveAllocClassroom(s, allocDateStr);
                return !!r.classroomId;
              }).length;
              if (total === 0) return null;
              const allDone = assigned === total;
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 16px', marginBottom: '12px', borderRadius: '10px',
                  background: allDone ? '#F0FDF4' : '#FFFBEB',
                  border: `1px solid ${allDone ? '#BBF7D0' : '#FDE68A'}`
                }}>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontWeight: 800, fontSize: '13px',
                      color: allDone ? '#166534' : '#92400E'
                    }}>
                      {allDone ? '✅ All rooms assigned' : `⚠ ${total - assigned} of ${total} rooms not yet assigned`}
                    </span>
                  </div>
                  {/* Mini progress bar */}
                  <div style={{
                    width: '120px', height: '6px', background: '#E5E7EB',
                    borderRadius: '3px', overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${total > 0 ? (assigned / total) * 100 : 0}%`,
                      height: '100%',
                      background: allDone ? '#22C55E' : '#F59E0B',
                      borderRadius: '3px', transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              );
            })()}

            {/* Allocation Table */}
            <div style={{ overflowX: 'auto' }}>
              <table key={`${allocDateStr}-${allocRefresh}`} style={{
                width: '100%', borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E3E6EA' }}>
                    {['TIME', 'CLASSROOM', 'BATCH', 'SUBJECT', 'LECTURER'].map(col => (
                      <th key={col} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontSize: '11px', fontWeight: 700, color: '#6B7280',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allocSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{
                        padding: '40px', textAlign: 'center',
                        color: '#9CA3AF', fontSize: '13px'
                      }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                          No sessions scheduled for {allocDateLabel}
                        </div>
                        <div style={{ fontSize: '12px' }}>
                          Sessions are added via the Visual Timetable Builder.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    allocSessions.map((s, i) => {
                      const room = resolveAllocClassroom(s, allocDateStr);
                      return (
                        <tr key={s.id || i} style={{
                          borderBottom: '1px solid #F3F4F6',
                          background: i % 2 === 0 ? 'white' : '#FAFAFA'
                        }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600,
                            color: '#1A202C', whiteSpace: 'nowrap' }}>
                            {s.startTime || '—'}{s.endTime ? `–${s.endTime}` : ''}
                          </td>
                          <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                            <select
                              value={room.classroomId || ''}
                              onChange={e => {
                                saveAllocClassroom(s, allocDateStr, e.target.value);
                                setAllocRefresh(n => n + 1);
                              }}
                              style={{
                                padding: '6px 10px', borderRadius: '8px', fontSize: '13px',
                                border: room.classroomId
                                  ? '1px solid #D1FAE5'
                                  : '2px dashed #FCD34D',
                                background: room.classroomId ? '#F0FDF4' : '#FFFBEB',
                                color: room.classroomId ? '#166534' : '#92400E',
                                fontWeight: 600, cursor: 'pointer', minWidth: '130px'
                              }}>
                              <option value="">— Assign Room —</option>
                              {(classrooms || []).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            {room.isOverride && (
                              <div style={{ fontSize: '9px', color: '#4F46E5',
                                marginTop: '2px', fontWeight: 700 }}>
                                ✓ Assigned for this date
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#374151' }}>
                            {s.batchName || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#374151' }}>
                            {s.subjectName || (
                              <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                                — No subject
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#374151' }}>
                            {s.lecturerName || '—'}
                            {(s.assistants || []).length > 0 && (
                              <div style={{ fontSize: '11px', color: '#6B7280',
                                marginTop: '2px' }}>
                                + {(s.assistants || []).map(a => a.lecturerName).join(', ')}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL TIMETABLE BUILDER */}
      {activeTab === "builder" && (
        <VisualTimetableBuilder initialClassroomId={selectedClassroomForSchedule} onOpenBatchManager={() => setActiveTab("batches")} />
      )}

      {/* TAB: DAILY ROOM ALLOCATION */}
      {activeTab === "dailyAllocation" && (() => {
        const sessionsForDay = getSessionsForDate(dailyAllocationDate);
        const classroomsList = safeLS('pba_classrooms', classrooms || []);

        return (
          <div style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", borderRadius: "12px", padding: "24px" }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Daily Classroom Allocation
                </h2>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>
                  Assign classrooms for each session, then share with lecturers via WhatsApp.
                </p>
              </div>

              {/* Date picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDailyAllocationDate(offsetDate(dailyAllocationDate, -1))}
                  style={{ padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '16px' }}
                >
                  ‹
                </button>
                <input
                  type="date"
                  value={dailyAllocationDate}
                  onChange={e => setDailyAllocationDate(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#111827', cursor: 'pointer' }}
                />
                <button
                  type="button"
                  onClick={() => setDailyAllocationDate(offsetDate(dailyAllocationDate, 1))}
                  style={{ padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '16px' }}
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => setDailyAllocationDate(tomorrowDateString())}
                  style={{ padding: '7px 14px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#F9FAFB', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#374151' }}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* Session list */}
            {sessionsForDay.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  No sessions scheduled for {getDayName(dailyAllocationDate)}.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sessionsForDay.map(session => (
                  <div key={session.id} style={{
                    display: 'grid',
                    gridTemplateColumns: isMobileState ? '1fr' : '100px 1fr 1fr 1fr 220px',
                    alignItems: 'center',
                    gap: '12px',
                    background: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '14px 18px'
                  }}>
                    {/* Time */}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                        {session.startTime}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        to {session.endTime}
                      </div>
                    </div>

                    {/* Batch + Subject */}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                        {session.batchName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {session.subject || '—'}
                      </div>
                    </div>

                    {/* Lecturer */}
                    <div style={{ fontSize: '13px', color: '#374151' }}>
                      {session.lecturerName}
                    </div>

                    {/* Current room (with override indicator) */}
                    <div>
                      <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                        {session.currentRoomName}
                      </div>
                      {session.hasOverride && (
                        <div style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 600 }}>
                          ✎ overridden for this day
                        </div>
                      )}
                    </div>

                    {/* Classroom selector */}
                    <div>
                      <select
                        value={session.currentRoomId}
                        onChange={e => handleRoomOverride(session.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '13px',
                          background: '#fff',
                          cursor: 'pointer',
                          color: '#111827'
                        }}
                      >
                        <option value="">— Select Room —</option>
                        {(classroomsList || []).map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                            {room.capacity ? ` (Cap: ${room.capacity})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom buttons: Copy to Clipboard and Share via WhatsApp */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generateWhatsAppMessage(sessionsForDay));
                  triggerToast('📋 Schedule copied to clipboard!');
                }}
                disabled={sessionsForDay.length === 0}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  background: '#ffffff',
                  cursor: sessionsForDay.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151'
                }}
              >
                📋 Copy Schedule
              </button>

              <button
                type="button"
                onClick={() => {
                  const msg = generateWhatsAppMessage(sessionsForDay);
                  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
                }}
                disabled={sessionsForDay.length === 0}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: sessionsForDay.length > 0 ? '#25D366' : '#D1D5DB',
                  cursor: sessionsForDay.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>💬</span>
                Share on WhatsApp
              </button>
            </div>
          </div>
        );
      })()}

      {/* TAB 4: TODAY'S CLASS CHANGES & ATTENDANCE */}
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

                    const timetableData = (() => {
                      const t1 = safeLS("pba_timetable", []);
                      const t2 = safeLS("pba_timetable_sessions", []);
                      return (t1 && t1.length > 0) ? t1 : (t2 && t2.length > 0) ? t2 : sessions;
                    })();

                    const runningSessions = (timetableData || []).filter((s) => {
                      if (s.recurrence === "weekly" || s.recurrence === "biweekly") return s.day === selDayName;
                      if (s.recurrence === "one_time") return s.startDate === allocationDate || s.date === allocationDate;
                      return s.day === selDayName || s.date === allocationDate;
                    });

                    const allAtt = (() => {
                      const a1 = safeLS("pba_attendance", []);
                      const a2 = safeLS("pba_session_attendance", []);
                      return [...(a1 || []), ...(a2 || [])];
                    })();

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
                      const changeRec = (classChanges || []).find((c) => c.sessionId === sess.id && c.date === allocationDate);
                      const isCancelled = changeRec?.type === "cancelled";

                      const hasAttendance = (allAtt || []).some(
                        (a) => (a.sessionId === sess.id) && a.date === allocationDate
                      );

                      const batchObj = (batches || []).find((b) => b.id === sess.batchId);
                      const subjObj = (subjects || []).find((s) => s.id === sess.subjectId);
                      const clsObj = (classrooms || []).find((c) => c.id === sess.classroomId);
                      const lecObj = (allLecturers || []).find((u) => u.id === sess.lecturerId);

                      const displaySubject = (sess.subjectName && sess.subjectName !== "(No Subject)")
                        ? sess.subjectName
                        : (subjObj?.name && subjObj.name !== "(No Subject)" ? subjObj.name : (sess.batchName || batchObj?.name || "No Subject"));

                      const isSubjectMissing = (!sess.subjectName || sess.subjectName === "(No Subject)") && !subjObj?.name;

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
                          <td style={{ padding: "12px 14px", fontWeight: 600, color: "#2B6CB0" }}>
                            <div>{displaySubject}</div>
                            {isSubjectMissing && (
                              <div style={{ fontSize: "10px", color: "#B7860A", marginTop: "2px" }}>
                                ⚠ Edit to assign subject
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px" }}>{sess.lecturerName || lecObj?.name || "Lecturer"}</td>
                          <td style={{ padding: "12px 14px" }}>{sess.classroomName || clsObj?.name || "Room"}</td>
                          <td style={{ padding: "12px 14px" }}>
                            {isCancelled ? (
                              <span style={{ background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: "12px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, color: "#C53030" }}>
                                ✕ Cancelled
                              </span>
                            ) : hasAttendance ? (
                              <span style={{ background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: "12px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, color: "#276749" }}>
                                ✓ Attendance Taken
                              </span>
                            ) : (
                              <span style={{ background: "#FFFBEB", border: "1px solid #F6D860", borderRadius: "12px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, color: "#B7860A" }}>
                                ⏳ Pending
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                              <button
                                onClick={() => {
                                  setAttendanceSession(sess);
                                  const studentsList = safeLS("pba_students", data?.students || []);
                                  const batchStudents = (studentsList || []).filter(
                                    (st) => st.batchId === sess.batchId || (batchEnrollments || []).some((e) => e.batchId === sess.batchId && e.studentId === st.id && e.status === "active")
                                  );
                                  const effectiveStudents = batchStudents.length > 0 ? batchStudents : (studentsList || []);

                                  const existingAtt = (allAtt || []).filter((a) => a.sessionId === sess.id && a.date === allocationDate);
                                  const initialMarks = {};
                                  effectiveStudents.forEach((st) => {
                                    const rec = existingAtt.find((r) => r.studentId === st.id);
                                    if (rec) {
                                      initialMarks[st.id] = rec.status || "present";
                                    } else {
                                      const groupRec = existingAtt.find((r) => r.records && Array.isArray(r.records));
                                      const stRec = groupRec?.records?.find((r) => r.studentId === st.id);
                                      initialMarks[st.id] = stRec?.status || "present";
                                    }
                                  });
                                  setAttendanceMarks(initialMarks);
                                  setShowAttendanceModal(true);
                                }}
                                style={{
                                  padding: "5px 12px",
                                  background: hasAttendance ? "#EEF2FF" : "#4F46E5",
                                  color: hasAttendance ? "#4F46E5" : "white",
                                  border: hasAttendance ? "1px solid #C7D2FE" : "none",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer"
                                }}
                              >
                                {hasAttendance ? "View Attendance" : "📋 Take Attendance"}
                              </button>

                              <button
                                onClick={() => {
                                  if (isCancelled) {
                                    const updated = (classChanges || []).filter((c) => !(c.sessionId === sess.id && c.date === allocationDate));
                                    setClassChanges(updated);
                                  } else {
                                    const newRec = {
                                      id: "change-" + Date.now(),
                                      sessionId: sess.id,
                                      date: allocationDate,
                                      type: "cancelled",
                                      markedAt: new Date().toISOString()
                                    };
                                    setClassChanges([...(classChanges || []), newRec]);
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

          {/* PART B — ATTENDANCE RECORDS SECTION */}
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
                      {(batches || []).map((b) => (
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
                      {(subjects || []).map((s) => (
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
                      {(allLecturers || []).map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TABLE */}
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
                  <table style={{ minWidth: "600px", width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
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
                        const rawRecords = (() => {
                          const pbaAtt = safeLS("pba_attendance", []);
                          const sessAtt = safeLS("pba_session_attendance", []);

                          const list = [];
                          (pbaAtt || []).forEach((r) => {
                            list.push({
                              sessionId: r.sessionId,
                              date: r.date,
                              batchId: r.batchId,
                              batchName: r.batchName,
                              subjectId: r.subjectId,
                              subjectName: r.subjectName,
                              lecturerId: r.lecturerId,
                              lecturerName: r.lecturerName,
                              startTime: r.startTime,
                              endTime: r.endTime,
                              studentId: r.studentId,
                              studentName: r.studentName,
                              status: r.status
                            });
                          });

                          (sessAtt || []).forEach((sRec) => {
                            (sRec.records || []).forEach((r) => {
                              const exists = list.some((x) => x.sessionId === sRec.sessionId && x.date === sRec.date && x.studentId === r.studentId);
                              if (!exists) {
                                const st = (data?.students || []).find((st) => st.id === r.studentId);
                                list.push({
                                  sessionId: sRec.sessionId,
                                  date: sRec.date,
                                  batchId: sRec.batchId,
                                  batchName: (batches || []).find((b) => b.id === sRec.batchId)?.name || "Batch",
                                  subjectId: sRec.subjectId,
                                  subjectName: (subjects || []).find((s) => s.id === sRec.subjectId)?.name || "Subject",
                                  lecturerId: sRec.lecturerId,
                                  lecturerName: (allLecturers || []).find((l) => l.id === sRec.lecturerId)?.name || "Lecturer",
                                  startTime: sRec.startTime || "08:00",
                                  endTime: sRec.endTime || "10:00",
                                  studentId: r.studentId,
                                  studentName: st?.name || r.studentId,
                                  status: r.status
                                });
                              }
                            });
                          });
                          return list;
                        })();

                        const filteredAtt = (rawRecords || []).filter((rec) => {
                          if (attFilterDate && rec.date !== attFilterDate) return false;
                          if (attFilterBatch !== "All" && rec.batchId !== attFilterBatch) return false;
                          if (attFilterSubject !== "All" && rec.subjectId !== attFilterSubject) return false;
                          if (attFilterLecturer !== "All" && rec.lecturerId !== attFilterLecturer) return false;
                          return true;
                        });

                        const grouped = {};
                        (filteredAtt || []).forEach((record) => {
                          const key = `${record.sessionId}_${record.date}`;
                          if (!grouped[key]) {
                            const sessObj = (sessions || []).find((s) => s.id === record.sessionId);
                            grouped[key] = {
                              sessionId: record.sessionId,
                              date: record.date,
                              batchId: record.batchId,
                              batchName: record.batchName || (batches || []).find((b) => b.id === record.batchId)?.name || "Batch",
                              subjectId: record.subjectId,
                              subjectName: record.subjectName || (subjects || []).find((s) => s.id === record.subjectId)?.name || "Subject",
                              lecturerId: record.lecturerId,
                              lecturerName: record.lecturerName || (allLecturers || []).find((l) => l.id === record.lecturerId)?.name || "Lecturer",
                              startTime: record.startTime || sessObj?.startTime || "08:00",
                              endTime: record.endTime || sessObj?.endTime || "10:00",
                              records: []
                            };
                          }
                          grouped[key].records.push(record);
                        });

                        const groupedList = Object.values(grouped);

                        if (groupedList.length === 0) {
                          return (
                            <tr>
                              <td colSpan="10" style={{ padding: "20px", textAlign: "center", color: "#A0AEC0" }}>
                                No attendance records found matching filters.
                              </td>
                            </tr>
                          );
                        }

                        return groupedList.map((group) => {
                          const presentCount = group.records.filter((r) => r.status === "present").length;
                          const absentCount = group.records.filter((r) => r.status === "absent").length;
                          const lateCount = group.records.filter((r) => r.status === "late").length;
                          const total = group.records.length;

                          const ratePct = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;
                          const rateColor = ratePct >= 80 ? "#276749" : ratePct >= 60 ? "#B7860A" : "#E53E3E";

                          return (
                            <tr key={`${group.sessionId}_${group.date}`} style={{ borderBottom: "1px solid #F0F2F5" }}>
                              <td style={{ padding: "10px", fontWeight: 600 }}>{group.date}</td>
                              <td style={{ padding: "10px" }}>{group.batchName}</td>
                              <td style={{ padding: "10px", fontWeight: 600, color: "#2B6CB0" }}>{group.subjectName}</td>
                              <td style={{ padding: "10px" }}>{group.lecturerName}</td>
                              <td style={{ padding: "10px" }}>{group.startTime}–{group.endTime}</td>
                              <td style={{ padding: "10px", textAlign: "center", color: "#276749", fontWeight: 700 }}>{presentCount}</td>
                              <td style={{ padding: "10px", textAlign: "center", color: "#E53E3E", fontWeight: 700 }}>{absentCount}</td>
                              <td style={{ padding: "10px", textAlign: "center", color: "#B7860A", fontWeight: 700 }}>{lateCount}</td>
                              <td style={{ padding: "10px", textAlign: "center" }}>
                                <span style={{ background: rateColor + "18", color: rateColor, padding: "3px 10px", borderRadius: "12px", fontWeight: 800, fontSize: "11px" }}>
                                  {ratePct}%
                                </span>
                              </td>
                              <td style={{ padding: "10px", textAlign: "right" }}>
                                <button
                                  onClick={() => setViewAttDetailsModal({ isOpen: true, session: group, records: group.records })}
                                  style={{
                                    padding: "4px 12px",
                                    background: "#EEF2FF",
                                    color: "#4F46E5",
                                    border: "1px solid #C7D2FE",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer"
                                  }}
                                >
                                  View Details
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: isMobileState ? "95vw" : "600px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: isMobileState ? "95vw" : "520px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: isMobileState ? "95vw" : "680px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3E6EA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                  Students — {enrolledPanelBatch.name}
                </h3>
                <div style={{ fontSize: "12px", color: "#718096", marginTop: "2px" }}>
                  {batchEnrollments.filter(e => e.batchId === enrolledPanelBatch.id && e.status === "active").length} enrolled
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
                  setEnrollStep(1);
                  setStudentConfigs({});
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

      {/* MODAL: ENROLL STUDENTS MODAL (Two-Step Enrollment) */}
      {showEnrollModal && enrolledPanelBatch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: isMobileState ? "95vw" : "580px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                {enrollStep === 1
                  ? `Enroll Students into ${enrolledPanelBatch.name}`
                  : `Set Stream & Subjects — ${enrolledPanelBatch.name}`
                }
              </h3>
              <button
                onClick={() => {
                  setEnrollStep(1);
                  setStudentConfigs({});
                  setShowEnrollModal(false);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* STEP 1: SELECT STUDENTS */}
            {enrollStep === 1 && (
              <>
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

                  <div style={{ maxHeight: "280px", overflowY: "auto", border: "1px solid #E3E6EA", borderRadius: "8px", padding: "6px" }}>
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

                {/* Footer Buttons Step 1 */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #E3E6EA", paddingTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollStep(1);
                      setStudentConfigs({});
                      setShowEnrollModal(false);
                    }}
                    style={{ padding: "8px 16px", background: "#FFF", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#4A5568", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={enrollSelectedStudentIds.length === 0}
                    onClick={() => {
                      const initialConfigs = { ...studentConfigs };
                      enrollSelectedStudentIds.forEach(sid => {
                        if (!initialConfigs[sid]) {
                          initialConfigs[sid] = { stream: '', subjects: [] };
                        }
                      });
                      setStudentConfigs(initialConfigs);
                      setEnrollStep(2);
                    }}
                    style={{
                      padding: "8px 20px",
                      background: enrollSelectedStudentIds.length === 0 ? "#A0AEC0" : "#2B6CB0",
                      color: "#FFF",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: enrollSelectedStudentIds.length === 0 ? "default" : "pointer"
                    }}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: SET STREAM & SUBJECTS PER STUDENT */}
            {enrollStep === 2 && (
              <>
                <div style={{ maxHeight: "55vh", overflowY: "auto", marginBottom: "16px", paddingRight: "4px" }}>
                  {(() => {
                    const batchSubjectNames = (enrolledPanelBatch.batchSubjects || []).map(bs => {
                      const subjObj = subjects.find(s => s.id === bs.subjectId);
                      return subjObj?.name || bs.name || bs.subjectId;
                    }).filter(Boolean);

                    const rawSubjects = safeLS('pba_subjects', subjects || []);
                    const allSubjectNames = (rawSubjects || []).map(s => s.name || s).filter(Boolean);
                    const availableSubjects = batchSubjectNames.length > 0
                      ? batchSubjectNames
                      : (allSubjectNames.length > 0 ? allSubjectNames : ['Biology', 'Chemistry', 'Physics']);

                    const selectedStudentsList = enrollSelectedStudentIds.map(stId => {
                      return (data.students || []).find(s => s.id === stId) ||
                        (students || []).find(s => s.id === stId) ||
                        { id: stId, name: stId, regNo: '' };
                    });

                    return selectedStudentsList.map(student => {
                      const sid = student.id || student.studentId || student.regNo;
                      const config = studentConfigs[sid] || { stream: '', subjects: [] };

                      return (
                        <div key={sid} style={{
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '16px',
                          marginBottom: '12px',
                          background: '#FAFAFA'
                        }}>
                          <div style={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: '#111827',
                            marginBottom: '10px'
                          }}>
                            {student.name || student.studentName}
                            <span style={{ color: '#6B7280', fontWeight: 400, marginLeft: '8px', fontSize: '12px' }}>
                              {student.regNo || sid}
                            </span>
                          </div>

                          {/* Stream selector */}
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280',
                                        letterSpacing: '0.05em', marginBottom: '6px' }}>
                            STREAM
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            {['Science', 'Commerce', 'None / Unset'].map(stream => (
                              <button
                                key={stream}
                                type="button"
                                onClick={() => setStudentConfigs(prev => ({
                                  ...prev,
                                  [sid]: { ...prev[sid], stream: stream === 'None / Unset' ? '' : stream.toLowerCase() }
                                }))}
                                style={{
                                  padding: '5px 14px',
                                  borderRadius: '6px',
                                  border: '1px solid',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  borderColor: config.stream === (stream === 'None / Unset' ? '' : stream.toLowerCase())
                                    ? '#2563EB' : '#D1D5DB',
                                  background: config.stream === (stream === 'None / Unset' ? '' : stream.toLowerCase())
                                    ? '#2563EB' : '#ffffff',
                                  color: config.stream === (stream === 'None / Unset' ? '' : stream.toLowerCase())
                                    ? '#ffffff' : '#374151',
                                  fontWeight: config.stream === (stream === 'None / Unset' ? '' : stream.toLowerCase())
                                    ? 600 : 400
                                }}
                              >
                                {stream}
                              </button>
                            ))}
                          </div>

                          {/* Subject checkboxes */}
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280',
                                        letterSpacing: '0.05em', marginBottom: '6px' }}>
                            SUBJECTS
                          </div>
                          <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px', background: '#FFFFFF', maxHeight: '140px', overflowY: 'auto' }}>
                            {(availableSubjects.length > 0 ? availableSubjects : ['Biology', 'Chemistry', 'Physics'])
                              .map(subj => (
                                <label key={subj} style={{
                                  display: 'flex', alignItems: 'center', gap: '8px',
                                  padding: '4px 0', cursor: 'pointer', fontSize: '13px', color: '#374151'
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={(config.subjects || []).includes(subj)}
                                    onChange={e => {
                                      const newSubjects = e.target.checked
                                        ? [...(config.subjects || []), subj]
                                        : (config.subjects || []).filter(s => s !== subj);
                                      setStudentConfigs(prev => ({
                                        ...prev,
                                        [sid]: { ...prev[sid], subjects: newSubjects }
                                      }));
                                    }}
                                  />
                                  {subj}
                                </label>
                              ))
                            }
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Footer Buttons Step 2 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E3E6EA", paddingTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => setEnrollStep(1)}
                    style={{ padding: "8px 16px", background: "#FFF", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#4A5568", fontWeight: 600, cursor: "pointer" }}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nowIso = new Date().toISOString();
                      const selectedStudentObjs = enrollSelectedStudentIds.map(stId => {
                        return (data.students || []).find(s => s.id === stId) ||
                          (students || []).find(s => s.id === stId) ||
                          { id: stId, name: stId, regNo: '' };
                      });

                      const newEnrollments = selectedStudentObjs.map(student => {
                        const sid = student.id || student.studentId || student.regNo;
                        const config = studentConfigs[sid] || { stream: '', subjects: [] };
                        return {
                          id:          sid,
                          regNo:       student.regNo || '',
                          name:        student.name  || student.studentName || '',
                          mobilePhone: student.mobilePhone || student.phone || '',
                          parentPhone: student.parentPhone || '',
                          status:      'active',
                          stream:      config.stream    || '',
                          subjects:    config.subjects  || [],
                          enrolledAt:  nowIso
                        };
                      });

                      // Save to pba_batches
                      const allBatches = safeLS('pba_batches', []);
                      const updatedBatches = (allBatches || []).map(b =>
                        b.id === enrolledPanelBatch.id
                          ? { ...b, students: [...(b.students || []), ...newEnrollments] }
                          : b
                      );
                      saveLS('pba_batches', updatedBatches);
                      setBatches(updatedBatches);
                      if (enrolledPanelBatch) {
                        setEnrolledPanelBatch(prev => ({
                          ...prev,
                          students: [...(prev.students || []), ...newEnrollments]
                        }));
                      }

                      // Also save to pba_batch_enrollments
                      const newBatchEnrRecords = selectedStudentObjs.map(student => {
                        const sid = student.id || student.studentId || student.regNo;
                        const config = studentConfigs[sid] || { stream: '', subjects: [] };
                        return {
                          id: "enr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
                          studentId: sid,
                          batchId: enrolledPanelBatch.id,
                          stream: config.stream || null,
                          subjectIds: config.subjects || [],
                          enrolledAt: nowIso,
                          status: "active"
                        };
                      });
                      const updatedEnrollments = [...batchEnrollments, ...newBatchEnrRecords];
                      setBatchEnrollments(updatedEnrollments);
                      saveLS('pba_batch_enrollments', updatedEnrollments);

                      // Sync profiles to pba_students (no stream/subjects — profile only)
                      const existingProfiles = safeLS('pba_students', []);
                      const profileMap = {};
                      (existingProfiles || []).forEach(p => {
                        const pid = p.id || p.regNo;
                        if (pid) profileMap[pid] = p;
                      });
                      newEnrollments.forEach(s => {
                        if (!profileMap[s.id]) {
                          profileMap[s.id] = {
                            id: s.id,
                            regNo: s.regNo || '',
                            name: s.name || '',
                            mobilePhone: s.mobilePhone || '',
                            parentPhone: s.parentPhone || '',
                            status: s.status || 'active'
                          };
                        }
                      });
                      saveLS('pba_students', Object.values(profileMap));

                      // Reset and close
                      setEnrollStep(1);
                      setStudentConfigs({});
                      setEnrollSelectedStudentIds([]);
                      setShowEnrollModal(false);
                      triggerToast(`✓ Enrolled ${enrollSelectedStudentIds.length} student(s) into ${enrolledPanelBatch.name}`);
                    }}
                    style={{ padding: "8px 20px", background: "#2B6CB0", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Enroll Selected ({enrollSelectedStudentIds.length})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: MONTHLY CALENDAR */}
      {activeTab === "calendar" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E3E6EA", borderRadius: "12px", padding: "20px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: t.fontHeading, fontSize: "18px", fontWeight: 700, color: "#1A202C" }}>Monthly Academic Calendar</h3>
              <p style={{ fontSize: "12px", color: "#718096", margin: "2px 0 0" }}>Track term dates, holidays, examination weeks, and major institute events.</p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #E3E6EA", background: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
                >
                  ← Prev
                </button>
                <span style={{ fontWeight: 700, fontSize: "15px", color: "#1A202C", minWidth: "140px", textAlign: "center" }}>
                  {calendarDate.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #E3E6EA", background: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
                >
                  Next →
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEventForm({ date: new Date().toISOString().slice(0, 10), title: "", type: "event", notes: "", color: getAdminCalendarEventColor("event") });
                  setEditingEvent(null);
                  setShowEventModal(true);
                }}
                style={{ padding: "8px 18px", background: "#4F46E5", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
              >
                + Add Event
              </button>
            </div>
          </div>

          {/* Legend Row */}
          <div style={{ display: "flex", gap: "14px", marginBottom: "16px", flexWrap: "wrap", padding: "10px 14px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #EDF2F7" }}>
            {[
              { type: "term_start", label: "Term Start", color: "#10B981" },
              { type: "term_end", label: "Term End", color: "#3B82F6" },
              { type: "holiday", label: "Holiday", color: "#EF4444" },
              { type: "exam_week", label: "Exam Week", color: "#F59E0B" },
              { type: "exam", label: "Exam", color: "#EAB308" },
              { type: "leave", label: "Leave", color: "#F43F5E" },
              { type: "payment", label: "Payment Due", color: "#059669" },
              { type: "event", label: "Event", color: "#8B5CF6" },
              { type: "revision", label: "Revision", color: "#06B6D4" }
            ].map(t => (
              <div key={t.type} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4A5568" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: t.color, display: "inline-block" }} />
                <span style={{ fontWeight: 600 }}>{t.label}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {(() => {
            const year = calendarDate.getFullYear();
            const month = calendarDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            const cells = [];
            for (let i = 0; i < firstDay; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(d);

            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} style={{ textAlign: "center", padding: "8px", fontSize: "11px", fontWeight: 700, color: "#718096", background: "#F7F8FC", borderRadius: "4px" }}>
                    {day}
                  </div>
                ))}
                {cells.map((day, idx) => {
                  if (!day) return <div key={idx} style={{ minHeight: "85px", background: "#FAFAFA", borderRadius: "6px", border: "1px solid #F0F0F0" }} />;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayEvents = (calendarEvents || []).filter(e => e.date === dateStr);
                  const isToday = dateStr === new Date().toISOString().slice(0, 10);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setEventForm({ date: dateStr, title: "", type: "event", notes: "", color: getAdminCalendarEventColor("event") });
                        setEditingEvent(null);
                        setShowEventModal(true);
                      }}
                      style={{
                        minHeight: "85px",
                        padding: "6px",
                        background: isToday ? "#EEF2FF" : "white",
                        border: isToday ? "2px solid #4F46E5" : "1px solid #E3E6EA",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "background 0.15s",
                        display: "flex",
                        flexDirection: "column"
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: isToday ? 700 : 500, color: isToday ? "#4F46E5" : "#1A202C", marginBottom: "4px" }}>
                        {day}
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                        {dayEvents.map(ev => {
                          const evColor = getAdminCalendarEventColor(ev.type, ev.color);
                          const evTitle = ev.title || ev.name || ev.label || '—';
                          const evDesc = ev.notes || ev.description || '';
                          return (
                            <div
                              key={ev.id}
                              onClick={e => {
                                e.stopPropagation();
                                setEventForm({
                                  ...ev,
                                  title: evTitle,
                                  type: ev.type || 'event',
                                  color: evColor,
                                  notes: evDesc
                                });
                                setEditingEvent(ev);
                                setShowEventModal(true);
                              }}
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "2px 5px",
                                background: evColor + "22",
                                color: evColor,
                                borderLeft: `3px solid ${evColor}`,
                                borderRadius: "3px",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                minWidth: 0,
                                width: "100%",
                                boxSizing: "border-box"
                              }}
                              title={`${evTitle}${evDesc ? " - " + evDesc : ""}`}
                            >
                              {evTitle}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
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

      {/* MODAL 1: ADD / EDIT ACADEMIC EVENT MODAL */}
      {showEventModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "480px", maxWidth: "95vw", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E3E6EA", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                {editingEvent ? "Edit Academic Event" : "Add Academic Event"}
              </h3>
              <button onClick={() => setShowEventModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const evTitle = (eventForm.title || '').trim();
                if (!evTitle) return;
                const evColor = getAdminCalendarEventColor(eventForm.type, eventForm.color);
                if (editingEvent) {
                  const updated = (calendarEvents || []).map(ev => ev.id === editingEvent.id ? { ...ev, ...eventForm, title: evTitle, color: evColor, id: editingEvent.id } : ev);
                  saveLS("pba_calendar_events", updated);
                  setCalendarEvents(updated);
                } else {
                  const newEv = { ...eventForm, title: evTitle, color: evColor, id: "cal-" + Date.now() };
                  const updated = [...(calendarEvents || []), newEv];
                  saveLS("pba_calendar_events", updated);
                  setCalendarEvents(updated);
                }
                setShowEventModal(false);
                triggerToast("✓ Academic event saved");
              }}
            >
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", marginBottom: "4px" }}>DATE *</label>
                <input
                  type="date"
                  required
                  value={eventForm.date}
                  onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", marginBottom: "4px" }}>TITLE *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examinations Start"
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", marginBottom: "4px" }}>EVENT TYPE *</label>
                <select
                  value={eventForm.type}
                  onChange={e => {
                    const val = e.target.value;
                    const c = getAdminCalendarEventColor(val);
                    setEventForm({ ...eventForm, type: val, color: c });
                  }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", background: "#FFF", boxSizing: "border-box" }}
                >
                  <option value="term_start">Term Start (Green)</option>
                  <option value="term_end">Term End (Blue)</option>
                  <option value="holiday">Holiday (Red)</option>
                  <option value="exam_week">Exam Week (Amber)</option>
                  <option value="exam">Exam (Yellow)</option>
                  <option value="leave">Leave (Rose)</option>
                  <option value="payment">Payment Due (Emerald)</option>
                  <option value="event">Event (Purple)</option>
                  <option value="revision">Revision (Cyan)</option>
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", marginBottom: "4px" }}>NOTES (OPTIONAL)</label>
                <textarea
                  rows="3"
                  placeholder="Additional details..."
                  value={eventForm.notes || ""}
                  onChange={e => setEventForm({ ...eventForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: editingEvent ? "space-between" : "flex-end", alignItems: "center", borderTop: "1px solid #E3E6EA", paddingTop: "14px" }}>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (calendarEvents || []).filter(ev => ev.id !== editingEvent.id);
                      saveLS("pba_calendar_events", updated);
                      setCalendarEvents(updated);
                      setShowEventModal(false);
                      triggerToast("✓ Academic event deleted");
                    }}
                    style={{ background: "none", border: "none", color: "#E53E3E", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: 0 }}
                  >
                    Delete Event
                  </button>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    style={{ padding: "8px 16px", background: "white", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "#4A5568", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "8px 20px", background: "#4F46E5", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Save Event
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAKE ATTENDANCE MODAL */}
      {showAttendanceModal && attendanceSession && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "600px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid #E3E6EA", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                  Attendance — {attendanceSession.subjectName || subjects.find(s=>s.id===attendanceSession.subjectId)?.name || 'Subject'} | {attendanceSession.batchName || batches.find(b=>b.id===attendanceSession.batchId)?.name || 'Batch'} | {allocationDate}
                </h3>
                <div style={{ fontSize: "12px", color: "#718096", marginTop: "4px" }}>
                  {attendanceSession.startTime}–{attendanceSession.endTime} · Lecturer: {attendanceSession.lecturerName || allLecturers.find(l=>l.id===attendanceSession.lecturerId)?.name || 'Lecturer'}
                </div>
              </div>
              <button onClick={() => setShowAttendanceModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}>
                <X size={18} />
              </button>
            </div>

            {(() => {
              const studentsList = safeLS("pba_students", data?.students || []);
              const batchStudents = (studentsList || []).filter(
                s => s.batchId === attendanceSession.batchId || (batchEnrollments || []).some(e => e.batchId === attendanceSession.batchId && e.studentId === s.id && e.status === "active")
              );
              const effectiveStudents = batchStudents.length > 0 ? batchStudents : (studentsList || []);

              const presentCount = effectiveStudents.filter(s => (attendanceMarks[s.id] || "present") === "present").length;
              const lateCount = effectiveStudents.filter(s => attendanceMarks[s.id] === "late").length;
              const absentCount = effectiveStudents.filter(s => attendanceMarks[s.id] === "absent").length;
              const total = effectiveStudents.length;
              const ratePct = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

              return (
                <div>
                  {/* Quick action buttons */}
                  <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {};
                        effectiveStudents.forEach(s => { updated[s.id] = "present"; });
                        setAttendanceMarks(updated);
                      }}
                      style={{ padding: "6px 14px", background: "#276749", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {};
                        effectiveStudents.forEach(s => { updated[s.id] = "absent"; });
                        setAttendanceMarks(updated);
                      }}
                      style={{ padding: "6px 14px", background: "#E53E3E", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Mark All Absent
                    </button>
                  </div>

                  {/* Live summary bar */}
                  <div style={{ background: "#F7F8FC", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600 }}>
                    <span style={{ color: "#276749" }}>Present: {presentCount}</span>
                    <span style={{ color: "#B7860A" }}>Late: {lateCount}</span>
                    <span style={{ color: "#E53E3E" }}>Absent: {absentCount}</span>
                    <span style={{ color: "#4F46E5" }}>Attendance Rate: {ratePct}%</span>
                  </div>

                  {/* Student Rows */}
                  <div style={{ maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    {effectiveStudents.map(student => {
                      const status = attendanceMarks[student.id] || "present";
                      return (
                        <div key={student.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F0F4FF" }}>
                          <span style={{ fontWeight: 500, fontSize: "13px", color: "#1A202C" }}>{student.name}</span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {["present", "late", "absent"].map(st => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setAttendanceMarks(prev => ({ ...prev, [student.id]: st }))}
                                style={{
                                  padding: "5px 12px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  border: "none",
                                  background: status === st
                                    ? st === "present" ? "#276749" : st === "late" ? "#B7860A" : "#E53E3E"
                                    : "#F0F4FF",
                                  color: status === st ? "white" : "#718096"
                                }}
                              >
                                {st === "present" ? "✓ Present" : st === "late" ? "⏰ Late" : "✗ Absent"}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #E3E6EA" }}>
                    <button
                      type="button"
                      onClick={() => setShowAttendanceModal(false)}
                      style={{ padding: "8px 16px", background: "white", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "#4A5568", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selDateObj = new Date(allocationDate + "T00:00:00");
                        const selDayName = selDateObj.toLocaleDateString("en-US", { weekday: "long" });

                        const newRecords = effectiveStudents.map(s => ({
                          id: Date.now().toString() + "_" + s.id,
                          sessionId: attendanceSession.id,
                          batchId: attendanceSession.batchId,
                          batchName: attendanceSession.batchName || batches.find(b=>b.id===attendanceSession.batchId)?.name || "",
                          subjectId: attendanceSession.subjectId,
                          subjectName: attendanceSession.subjectName || subjects.find(sub=>sub.id===attendanceSession.subjectId)?.name || "",
                          lecturerId: attendanceSession.lecturerId,
                          lecturerName: attendanceSession.lecturerName || allLecturers.find(l=>l.id===attendanceSession.lecturerId)?.name || "",
                          studentId: s.id,
                          studentName: s.name,
                          date: allocationDate,
                          day: selDayName,
                          startTime: attendanceSession.startTime,
                          endTime: attendanceSession.endTime,
                          status: attendanceMarks[s.id] || "present",
                          takenBy: safeLS("pba_logged_in_user", {})?.name || "Admin"
                        }));

                        const allAtt = safeLS("pba_attendance", []);
                        const filteredAtt = (allAtt || []).filter(a => !(a.sessionId === attendanceSession.id && a.date === allocationDate));
                        const updatedAtt = [...filteredAtt, ...newRecords];

                        saveLS("pba_attendance", updatedAtt);
                        saveLS("pba_session_attendance", updatedAtt);
                        setAttendanceRecords(updatedAtt);
                        setSessionAttendance(updatedAtt);
                        setShowAttendanceModal(false);
                        triggerToast("✓ Attendance saved successfully");
                      }}
                      style={{ padding: "8px 20px", background: "#4F46E5", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Save Attendance
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW ATTENDANCE DETAILS MODAL */}
      {viewAttDetailsModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "550px", maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E3E6EA", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1A202C" }}>
                Attendance Details — {viewAttDetailsModal.session?.subjectName} ({viewAttDetailsModal.session?.batchName})
              </h3>
              <button onClick={() => setViewAttDetailsModal({ isOpen: false, session: null, records: [] })} style={{ background: "none", border: "none", cursor: "pointer", color: "#A0AEC0" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: "12px", color: "#718096", marginBottom: "14px" }}>
              Date: {viewAttDetailsModal.session?.date} | Time: {viewAttDetailsModal.session?.startTime}–{viewAttDetailsModal.session?.endTime} | Lecturer: {viewAttDetailsModal.session?.lecturerName}
            </div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E3E6EA" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>STUDENT NAME</th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {viewAttDetailsModal.records.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F0F2F5" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 500 }}>{r.studentName}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700,
                        background: r.status === "present" ? "#F0FFF4" : r.status === "late" ? "#FFFBEB" : "#FFF5F5",
                        color: r.status === "present" ? "#276749" : r.status === "late" ? "#B7860A" : "#C53030"
                      }}>
                        {r.status === "present" ? "✓ Present" : r.status === "late" ? "⏰ Late" : "✗ Absent"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* ── CLASSROOM MANAGER MODAL (Fix 2) ── */}
      {showClassroomModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 2000, display: 'flex', alignItems: 'center',
          justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '14px', width: '500px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#0F172A,#1D4ED8)',
              padding: '18px 24px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'white' }}>
                {editClassroomId ? '✏️ Edit Classroom' : '+ Add Classroom'}
              </div>
              <button onClick={() => setShowClassroomModal(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
                  color: 'white', borderRadius: '6px', padding: '4px 12px',
                  cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column',
              gap: '16px' }}>

              {/* Room Name */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'block', marginBottom: '6px' }}>Room / Hall Name *</label>
                <input type="text"
                  value={classroomForm.name}
                  onChange={e => setClassroomForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Hall A, Lab 01, Room 3B"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', fontSize: '14px',
                    boxSizing: 'border-box' }} />
              </div>

              {/* Branch */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'block', marginBottom: '6px' }}>Branch / Location *</label>
                <input type="text"
                  value={classroomForm.branch}
                  onChange={e => setClassroomForm(p => ({ ...p, branch: e.target.value }))}
                  placeholder="e.g. Kohuwala, Wattala, Panadura"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', fontSize: '14px',
                    boxSizing: 'border-box' }} />
              </div>

              {/* Capacity + Type row */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: '6px' }}>Seating Capacity</label>
                  <input type="number" min={1} max={500}
                    value={classroomForm.capacity}
                    onChange={e => setClassroomForm(p => ({
                      ...p, capacity: Number(e.target.value) || 1
                    }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #E3E6EA', fontSize: '14px',
                      boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: '6px' }}>Room Type</label>
                  <select
                    value={classroomForm.type}
                    onChange={e => setClassroomForm(p => ({ ...p, type: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #E3E6EA', fontSize: '14px',
                      background: 'white', boxSizing: 'border-box' }}>
                    {['Classroom','Lecture Hall','Science Lab','Computer Lab','Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'block', marginBottom: '8px' }}>Amenities</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Projector','Whiteboard','AC','Lab Equipment',
                    'Smart Board','CCTV','WiFi'].map(amenity => {
                    const checked = (classroomForm.amenities || []).includes(amenity);
                    return (
                      <label key={amenity}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                          border: `1px solid ${checked ? '#4F46E5' : '#E3E6EA'}`,
                          background: checked ? '#EEF2FF' : 'white',
                          color: checked ? '#4F46E5' : '#374151',
                          fontSize: '12px', fontWeight: 600,
                          userSelect: 'none' }}>
                        <input type="checkbox" checked={checked}
                          onChange={() => {
                            setClassroomForm(p => ({
                              ...p,
                              amenities: checked
                                ? (p.amenities || []).filter(a => a !== amenity)
                                : [...(p.amenities || []), amenity]
                            }));
                          }}
                          style={{ display: 'none' }} />
                        {amenity}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status (edit only) */}
              {editClassroomId && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: '6px' }}>Status</label>
                  <select
                    value={classroomForm.status}
                    onChange={e => setClassroomForm(p => ({ ...p, status: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #E3E6EA', fontSize: '14px',
                      background: 'white' }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end',
                paddingTop: '8px' }}>
                <button onClick={() => setShowClassroomModal(false)}
                  style={{ padding: '10px 20px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', background: 'white',
                    color: '#374151', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  disabled={!classroomForm.name.trim() || !classroomForm.branch.trim()}
                  onClick={() => {
                    if (!classroomForm.name.trim() || !classroomForm.branch.trim()) return;
                    const existing = safeLS('pba_classrooms', []);
                    let updated;
                    if (editClassroomId) {
                      updated = (existing || []).map(r =>
                        r.id === editClassroomId
                          ? { ...r, ...classroomForm, name: classroomForm.name.trim(),
                              branch: classroomForm.branch.trim(),
                              facilities: classroomForm.amenities,
                              isActive: classroomForm.status === 'Active' }
                          : r
                      );
                    } else {
                      const newRoom = {
                        id: `room_${Date.now()}`,
                        ...classroomForm,
                        name:   classroomForm.name.trim(),
                        branch: classroomForm.branch.trim(),
                        facilities: classroomForm.amenities,
                        isActive: classroomForm.status === 'Active',
                        createdAt: new Date().toISOString()
                      };
                      updated = [...(existing || []), newRoom];
                    }
                    saveLS('pba_classrooms', updated);
                    setClassrooms(updated);
                    setShowClassroomModal(false);
                  }}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', border: 'none',
                    background: (classroomForm.name.trim() && classroomForm.branch.trim())
                      ? '#1D4ED8' : '#E5E7EB',
                    color: (classroomForm.name.trim() && classroomForm.branch.trim())
                      ? 'white' : '#9CA3AF',
                    fontSize: '13px', fontWeight: 700,
                    cursor: (classroomForm.name.trim() && classroomForm.branch.trim())
                      ? 'pointer' : 'not-allowed'
                  }}>
                  {editClassroomId ? 'Save Changes' : 'Add Classroom'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── DEACTIVATE CONFIRMATION MODAL (Fix 2) ── */}
      {showDeactivateConfirm && deactivateTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 2100, display: 'flex', alignItems: 'center',
          justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '14px', width: '380px',
            padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#1A202C',
              marginBottom: '8px' }}>
              {(deactivateTarget.status ? deactivateTarget.status === 'Active' : deactivateTarget.isActive !== false)
                ? `Deactivate ${deactivateTarget.name}?`
                : `Reactivate ${deactivateTarget.name}?`}
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
              {(deactivateTarget.status ? deactivateTarget.status === 'Active' : deactivateTarget.isActive !== false)
                ? 'This classroom will be hidden from session scheduling until reactivated.'
                : 'This classroom will become available for session scheduling again.'}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => {
                setShowDeactivateConfirm(false); setDeactivateTarget(null);
              }}
                style={{ padding: '10px 20px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', background: 'white',
                  color: '#374151', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={() => {
                  const existing = safeLS('pba_classrooms', []);
                  const updated = (existing || []).map(r => {
                    if (r.id === deactivateTarget.id) {
                      const currentIsActive = r.status ? r.status === 'Active' : r.isActive !== false;
                      const newStatus = currentIsActive ? 'Inactive' : 'Active';
                      return { ...r, status: newStatus, isActive: newStatus === 'Active' };
                    }
                    return r;
                  });
                  saveLS('pba_classrooms', updated);
                  setClassrooms(updated);
                  setShowDeactivateConfirm(false);
                  setDeactivateTarget(null);
                }}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none',
                  background: (deactivateTarget.status ? deactivateTarget.status === 'Active' : deactivateTarget.isActive !== false) ? '#D97706' : '#059669',
                  color: 'white', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer' }}>
                {(deactivateTarget.status ? deactivateTarget.status === 'Active' : deactivateTarget.isActive !== false) ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── QUICK CLASSROOM REASSIGN MODAL ── */}
      {quickRoomSession && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 9990, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px',
            width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800,
              color: '#111827' }}>
              Change Classroom
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#6B7280' }}>
              {quickRoomSession.session.subjectName ||
               quickRoomSession.session.batchName} ·{' '}
              {quickRoomSession.session.day}{' '}
              {quickRoomSession.session.startTime}–
              {quickRoomSession.session.endTime}
            </p>

            {/* Current room */}
            {quickRoomSession.currentRoom.classroomId && (
              <div style={{
                marginBottom: '16px', padding: '10px 12px',
                background: '#F9FAFB', borderRadius: '8px',
                fontSize: '12px', color: '#6B7280'
              }}>
                Current: <strong style={{ color: '#374151' }}>
                  {quickRoomSession.currentRoom.classroomName}
                </strong>
                {quickRoomSession.currentRoom.isOverride &&
                  ' (this week override)'}
              </div>
            )}

            {/* Classroom selector */}
            <label style={{ fontSize: '12px', fontWeight: 700,
              color: '#374151', textTransform: 'uppercase',
              letterSpacing: '0.05em', display: 'block',
              marginBottom: '6px' }}>
              NEW CLASSROOM
            </label>
            <select
              value={quickRoomId}
              onChange={e => setQuickRoomId(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid #E3E6EA', fontSize: '14px',
                background: 'white', marginBottom: '16px'
              }}>
              <option value="">— Select Classroom —</option>
              {(classrooms || []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Scope: this week only vs. update default */}
            <label style={{ fontSize: '12px', fontWeight: 700,
              color: '#374151', textTransform: 'uppercase',
              letterSpacing: '0.05em', display: 'block',
              marginBottom: '8px' }}>
              APPLY TO
            </label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                border: quickRoomScope === 'week'
                  ? '2px solid #4F46E5' : '1px solid #E3E6EA',
                background: quickRoomScope === 'week' ? '#EEF2FF' : 'white'
              }}>
                <input type="radio" name="scope" value="week"
                  checked={quickRoomScope === 'week'}
                  onChange={() => setQuickRoomScope('week')} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700,
                    color: '#374151' }}>This week only</div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                    {quickRoomSession.weekStartStr}
                  </div>
                </div>
              </label>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                border: quickRoomScope === 'default'
                  ? '2px solid #4F46E5' : '1px solid #E3E6EA',
                background: quickRoomScope === 'default' ? '#EEF2FF' : 'white'
              }}>
                <input type="radio" name="scope" value="default"
                  checked={quickRoomScope === 'default'}
                  onChange={() => setQuickRoomScope('default')} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700,
                    color: '#374151' }}>Update default</div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                    All future weeks
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  if (!quickRoomId) return;
                  const classroom = (classrooms || [])
                    .find(c => c.id === quickRoomId);
                  if (!classroom) return;

                  if (quickRoomScope === 'week') {
                    // Save a per-week override
                    const overrides = safeLS('pba_classroom_overrides', []);
                    const cleaned = (overrides || []).filter(
                      o => !(o.sessionId === quickRoomSession.session.id &&
                             o.weekStart === quickRoomSession.weekStartStr)
                    );
                    saveLS('pba_classroom_overrides', [
                      ...cleaned,
                      {
                        sessionId: quickRoomSession.session.id,
                        weekStart: quickRoomSession.weekStartStr,
                        classroomId: classroom.id,
                        classroomName: classroom.name
                      }
                    ]);
                  } else {
                    // Update the session's default classroom
                    const timetable = safeLS('pba_timetable', []);
                    const updated = (timetable || []).map(s =>
                      s.id === quickRoomSession.session.id
                        ? { ...s,
                            classroomId: classroom.id,
                            classroomName: classroom.name }
                        : s
                    );
                    saveLS('pba_timetable', updated);
                    if (typeof setTimetable === 'function') {
                      setTimetable(updated);
                    }
                  }

                  setQuickRoomSession(null);
                  setQuickRoomId('');
                  setQuickRoomScope('week');
                }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  background: '#4F46E5', color: 'white', border: 'none',
                  fontWeight: 700, fontSize: '14px', cursor: 'pointer'
                }}>
                Save
              </button>
              <button
                onClick={() => {
                  setQuickRoomSession(null);
                  setQuickRoomId('');
                  setQuickRoomScope('week');
                }}
                style={{
                  padding: '10px 16px', borderRadius: '8px',
                  background: '#F3F4F6', border: '1px solid #E3E6EA',
                  color: '#374151', fontWeight: 600, fontSize: '14px',
                  cursor: 'pointer'
                }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
