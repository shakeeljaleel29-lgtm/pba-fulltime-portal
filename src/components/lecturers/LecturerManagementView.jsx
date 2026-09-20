import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ReplacementModal } from "./ReplacementModal";
import {
  Users,
  CalendarCheck,
  Grid,
  TrendingUp,
  Plus,
  PlusCircle,
  Upload,
  Download,
  CheckCircle,
  XCircle
} from "lucide-react";
import { downloadLecturerCsvTemplate, parseImportFile } from "../../utils/csvImportUtils";
import { getBranches } from "../admin/GeneralAdminView";

import { T, theme, type as t } from "../../theme";

class LecturerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[Lecturers] Caught error:', error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          margin: '40px auto', maxWidth: '600px',
          background: '#FFFFFF', border: '1.5px solid #FEB2B2',
          borderRadius: '12px', padding: '28px 32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '12px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="#C53030" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{
              fontSize: '14px', fontWeight: 700, color: '#C53030',
              fontFamily: "'Inter', sans-serif"
            }}>
              Lecturers tab encountered an error
            </span>
          </div>
          <div style={{
            background: '#FFF5F5', borderRadius: '8px',
            padding: '12px 16px', marginBottom: '16px'
          }}>
            <p style={{
              fontSize: '12px', fontFamily: 'monospace',
              color: '#742A2A', margin: 0, wordBreak: 'break-all'
            }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: '#2B6CB0', color: '#FFFFFF', border: 'none',
              borderRadius: '8px', padding: '9px 18px',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const safeLS = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === '') return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback;
    if (typeof fallback === 'object') return (parsed && typeof parsed === 'object') ? parsed : fallback;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const LecturerManagementViewInner = ({ isMobile }) => {
  const isMobileState = isMobile !== undefined ? isMobile : (window.innerWidth < 768);
  const { data, setData, currentUser, approveLeaveRequest, rejectLeaveRequest, submitLeaveRequest, addLecturer } = useApp();
  const [activeTab, setActiveTab] = useState("profiles");

  // Form states
  const [showAddLecModal, setShowAddLecModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedSyllabusIndex, setSelectedSyllabusIndex] = useState(0);
  const [selectedLecturer, setSelectedLecturer] = useState(null);

  // Bulk Lecturer Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importRows, setImportRows] = useState([]);
  const [importLog, setImportLog] = useState({ successCount: 0, errorCount: 0, errors: [] });
  const [isParsing, setIsParsing] = useState(false);

  // Availability Grid Filter States
  const [filterLecturer, setFilterLecturer] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  // Session Log State
  const [logLecturerFilter, setLogLecturerFilter] = useState("All");
  const [logPeriod, setLogPeriod] = useState("This Month");
  const [logCustomFrom, setLogCustomFrom] = useState("");
  const [logCustomTo, setLogCustomTo] = useState("");
  const [logIncludeUpcoming, setLogIncludeUpcoming] = useState(false);
  const [logPage, setLogPage] = useState(1);

  const DEFAULT_AVAILABILITY = [
    { day: 'Monday', isAvailable: true, from: '08:00', to: '18:00' },
    { day: 'Tuesday', isAvailable: true, from: '08:00', to: '18:00' },
    { day: 'Wednesday', isAvailable: true, from: '08:00', to: '18:00' },
    { day: 'Thursday', isAvailable: true, from: '08:00', to: '18:00' },
    { day: 'Friday', isAvailable: true, from: '08:00', to: '18:00' },
    { day: 'Saturday', isAvailable: false, from: '08:00', to: '13:00' },
  ];

  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
  const [assistantSearch, setAssistantSearch] = useState('');
  const [selectedAssistantIds, setSelectedAssistantIds] = useState([]);
  const [currentEditingLecturerId, setCurrentEditingLecturerId] = useState(null);

  const formatAvailabilitySummary = (availList) => {
    if (!Array.isArray(availList) || availList.length === 0) {
      return 'Avail: Mon–Fri · 08:00–18:00';
    }
    const activeDays = availList.filter((a) => a.isAvailable);
    if (activeDays.length === 0) return 'Avail: None';

    const isMonFri =
      activeDays.length === 5 && activeDays.every((a) => a.day !== 'Saturday' && a.day !== 'Sunday');
    const firstTime = activeDays[0] ? `${activeDays[0].from}–${activeDays[0].to}` : '08:00–18:00';

    if (isMonFri) {
      return `Avail: Mon–Fri · ${firstTime}`;
    }
    const isMonSat = activeDays.length === 6;
    if (isMonSat) {
      const sat = activeDays.find((a) => a.day === 'Saturday');
      if (sat) {
        return `Avail: Mon–Sat (Sat until ${sat.to})`;
      }
      return `Avail: Mon–Sat · ${firstTime}`;
    }
    const shortDays = activeDays.map((a) => a.day.substring(0, 3)).join(', ');
    return `Avail: ${shortDays} · ${firstTime}`;
  };

  const allUsersFromLS = safeLS('pba_users', []);
  const allLecsFromData = Array.isArray(data?.lecturers) ? data.lecturers : [];
  const combinedUsers = [...allUsersFromLS, ...allLecsFromData];
  const uniqueUserCandidates = Array.from(
    new Map(combinedUsers.map((u) => [u.id, u])).values()
  );

  const assistantCandidates = uniqueUserCandidates.filter(u =>
    (u.role === 'Assistant' || u.role === 'Lecturer' || u.employmentType) &&
    u.id !== currentEditingLecturerId
  );

  const [lecForm, setLecForm] = useState({
    name: "",
    branch: "",
    employmentType: "",
    subjectIds: [],
    subjects: [],
    qualification: "",
    phone: "",
    email: "",
    notes: ""
  });

  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    type: "Personal",
    reason: "",
    subject: "Business Studies"
  });

  const [topicForm, setTopicForm] = useState({
    topicName: "",
    dateCompleted: new Date().toISOString().split("T")[0]
  });

  const role = currentUser.role;

  const pendingLeaveCount = ((data && data.leaveRequests) || []).filter(
    (l) => l && l.status === "Pending"
  ).length;

  const [availableSubjects, setAvailableSubjects] = useState([]);

  const handleOpenAddModal = () => {
    const loaded = safeLS('pba_subjects', []);
    const fromData = Array.isArray(data?.subjects) && data.subjects.length > 0 ? data.subjects : [];
    const subjectsToUse = loaded.length > 0 ? loaded : fromData;
    setAvailableSubjects(Array.isArray(subjectsToUse) ? subjectsToUse : []);
    setCurrentEditingLecturerId(null);
    setSelectedAssistantIds([]);
    setAvailability(DEFAULT_AVAILABILITY);
    setAssistantSearch('');
    setShowAddLecModal(true);
    setLecForm({
      name: "",
      branch: "",
      employmentType: "",
      subjectIds: [],
      subjects: [],
      qualification: "",
      phone: "",
      email: "",
      notes: ""
    });
  };

  const handleOpenEditModal = (lecturer) => {
    const loaded = safeLS('pba_subjects', []);
    const fromData = Array.isArray(data?.subjects) && data.subjects.length > 0 ? data.subjects : [];
    const subjectsToUse = loaded.length > 0 ? loaded : fromData;
    setAvailableSubjects(Array.isArray(subjectsToUse) ? subjectsToUse : []);
    setCurrentEditingLecturerId(lecturer.id);
    setSelectedAssistantIds(lecturer.assistantIds || []);
    setAvailability(lecturer.availability && lecturer.availability.length > 0 ? lecturer.availability : DEFAULT_AVAILABILITY);
    setAssistantSearch('');
    setShowAddLecModal(true);
    setLecForm({
      name: lecturer.name || "",
      branch: lecturer.branch || "",
      employmentType: lecturer.employmentType || "",
      subjectIds: lecturer.subjectIds || [],
      subjects: lecturer.subjects || [],
      qualification: lecturer.qualification || "",
      phone: lecturer.phone || "",
      email: lecturer.email || "",
      notes: lecturer.notes || ""
    });
  };

  const toggleSubject = (subjId) => {
    const curIds = lecForm.subjectIds || [];
    const curNames = lecForm.subjects || [];
    const targetSubj = (availableSubjects || []).find((s) => s && s.id === subjId);

    if (curIds.includes(subjId)) {
      setLecForm({
        ...lecForm,
        subjectIds: curIds.filter((id) => id !== subjId),
        subjects: curNames.filter((n) => n !== targetSubj?.name)
      });
    } else {
      setLecForm({
        ...lecForm,
        subjectIds: [...curIds, subjId],
        subjects: targetSubj?.name ? [...curNames, targetSubj.name] : curNames
      });
    }
  };

  const handleAddLecturer = (e) => {
    e.preventDefault();
    if (!lecForm.name) return;

    const targetId = currentEditingLecturerId || ('lec-' + Date.now());
    const newLec = {
      id: targetId,
      name: lecForm.name,
      branch: lecForm.branch || "Kohuwala",
      employmentType: lecForm.employmentType || "Full-time",
      subjectIds: lecForm.subjectIds || [],
      subjects: lecForm.subjects || [],
      qualification: lecForm.qualification || "",
      phone: lecForm.phone || "",
      email: lecForm.email || "",
      notes: lecForm.notes || "",
      assistantIds: selectedAssistantIds || [],
      availability: availability || DEFAULT_AVAILABILITY,
      role: 'Lecturer',
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    setData((prev) => {
      const existing = prev.lecturers || [];
      const updated = existing.some((l) => l.id === targetId)
        ? existing.map((l) => (l.id === targetId ? { ...l, ...newLec } : l))
        : [newLec, ...existing];
      return { ...prev, lecturers: updated };
    });

    try {
      const existingUsers = safeLS("pba_users", []);
      const updatedUsers = existingUsers.some((u) => u.id === targetId)
        ? existingUsers.map((u) => (u.id === targetId ? { ...u, ...newLec } : u))
        : [newLec, ...existingUsers];
      localStorage.setItem("pba_users", JSON.stringify(updatedUsers));
    } catch (err) {
      console.error("Error writing to pba_users:", err);
    }

    setLecForm({
      name: "",
      branch: "",
      employmentType: "",
      subjectIds: [],
      subjects: [],
      qualification: "",
      phone: "",
      email: "",
      notes: ""
    });
    setSelectedAssistantIds([]);
    setCurrentEditingLecturerId(null);
    setShowAddLecModal(false);
  };

  const handleSubmitLeave = (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.reason) return;
    submitLeaveRequest(leaveForm);
    setShowLeaveModal(false);
  };

  const handleLogTopic = (e) => {
    e.preventDefault();
    if (!topicForm.topicName) return;

    setData((prev) => {
      const updatedSyllabus = [...prev.syllabusTracker];
      const target = updatedSyllabus[selectedSyllabusIndex];
      if (target) {
        target.topics.push({
          name: topicForm.topicName,
          completed: true,
          date: topicForm.dateCompleted
        });
      }
      return { ...prev, syllabusTracker: updatedSyllabus };
    });

    setTopicForm({ topicName: "", dateCompleted: new Date().toISOString().split("T")[0] });
    setShowTopicModal(false);
  };

  const handleLecturerFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsParsing(true);
    try {
      const parsed = await parseImportFile(file);
      const processed = parsed.map((row, index) => {
        const name = row["Full Name"] || row["FullName"] || row["name"] || "";
        const phone = row["Phone"] || row["phone"] || "";
        const email = row["Email"] || row["email"] || "";
        const branch = row["Branch (Kohuwala/Wattala/Panadura/All)"] || row["Branch"] || row["branch"] || "Kohuwala";
        const subjectsStr = row["Subjects They Teach (semicolon-separated)"] || row["Subjects"] || row["subjects"] || "";
        const qualification = row["Qualification"] || row["qualification"] || "";
        const notes = row["Notes"] || row["notes"] || "";
        const employmentType = row["Employment Type (Full-time/Part-time/Visiting)"] || row["Employment Type"] || row["employmentType"] || "Full-time";

        const missingRequired = !name.trim() || !phone.trim();
        const missingOptional = !email;

        let status = "ready";
        let statusMsg = "Ready";
        if (missingRequired) {
          status = "error";
          statusMsg = "Error: Name & Phone required";
        } else if (missingOptional) {
          status = "warning";
          statusMsg = "Warning: Optional email missing";
        }

        return {
          rowNum: index + 1,
          name,
          phone,
          email,
          branch,
          subjectsStr,
          qualification,
          notes,
          employmentType,
          status,
          statusMsg
        };
      });
      setImportRows(processed);
    } catch (err) {
      alert("Failed to parse file: " + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmLecturerImport = (skipErrors = false) => {
    const validRows = importRows.filter((r) => r.status !== "error" || skipErrors);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    const existingLecturers = data.lecturers || [];
    const newLecturers = [...existingLecturers];

    validRows.forEach((r) => {
      if (r.status === "error" && !skipErrors) {
        errorCount++;
        errors.push(`Row ${r.rowNum}: Skipped due to missing required fields`);
        return;
      }

      const isDup = existingLecturers.some(
        (l) => l.name.toLowerCase() === r.name.toLowerCase() && l.phone === r.phone
      );

      if (isDup) {
        errorCount++;
        errors.push(`Row ${r.rowNum} (${r.name}): Duplicate lecturer record exists`);
        return;
      }

      const subjectsArr = r.subjectsStr
        ? r.subjectsStr.split(";").map((s) => s.trim()).filter(Boolean)
        : ["Business Studies"];

      const newLec = {
        id: "lec-" + Date.now() + Math.random().toString(36).substr(2, 4),
        name: r.name,
        phone: r.phone,
        email: r.email || `${r.name.toLowerCase().replace(/\s+/g, ".")}@pba.edu.lk`,
        branch: r.branch || "Kohuwala",
        subjects: subjectsArr,
        qualification: r.qualification || "Lecturer",
        notes: r.notes || "",
        employmentType: r.employmentType || "Full-time",
        role: "Lecturer",
        status: "Active",
        importedVia: "csv",
        joinedDate: new Date().toISOString().split("T")[0]
      };

      newLecturers.push(newLec);
      successCount++;
    });

    setData((prev) => ({
      ...prev,
      lecturers: newLecturers
    }));

    setImportLog({ successCount, errorCount, errors });
    setImportStep(2);
  };

  return (
    <div>
      <ReplacementModal />

      {/* PATTERN B — Page Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: t.fontHeading, fontSize: '20px', fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            Academic Faculty & Lecturer Management
          </h2>
          <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
            Lecturer profiles, leave requests, weekly timetabled availability, and syllabus progress.
          </p>
        </div>
      </div>

      {/* PATTERN C — Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#EEF0F4",
          padding: "4px",
          borderRadius: "10px",
          width: "fit-content",
          marginBottom: "20px"
        }}
      >
        <button
          onClick={() => setActiveTab("profiles")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "profiles" ? 600 : 500,
            color: activeTab === "profiles" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "profiles" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "profiles" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Users size={16} /> Profiles
        </button>
        <button
          onClick={() => setActiveTab("leave")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "leave" ? 600 : 500,
            color: activeTab === "leave" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "leave" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "leave" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <CalendarCheck size={16} /> Leave Requests
          {pendingLeaveCount > 0 && (
            <span style={{ background: '#E53E3E', color: '#FFF', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px', marginLeft: '4px' }}>
              {pendingLeaveCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("availability")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "availability" ? 600 : 500,
            color: activeTab === "availability" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "availability" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "availability" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Grid size={16} /> Availability Grid
        </button>
        <button
          onClick={() => setActiveTab("progress")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "progress" ? 600 : 500,
            color: activeTab === "progress" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "progress" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "progress" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <TrendingUp size={16} /> Syllabus Progress Tracker
        </button>
        <button
          onClick={() => setActiveTab("sessionLog")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "sessionLog" ? 600 : 500,
            color: activeTab === "sessionLog" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "sessionLog" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "sessionLog" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          📋 Session Log
        </button>
      </div>

      {/* TAB 1: PROFILES */}
      {activeTab === "profiles" && (
        <div
          style={{
            background: theme.cardBg,
            border: "1px solid " + theme.cardBorder,
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid #F4F5F7",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#FFFFFF"
            }}
          >
            <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={18} style={{ color: theme.accent }} /> Academic Lecturer Profiles
            </span>
            {role === "Admin" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    setImportStep(1);
                    setImportRows([]);
                    setShowImportModal(true);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#4A5568',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "'Inter',sans-serif"
                  }}
                >
                  <Upload size={14} /> Import Lecturers
                </button>
                <button
                  onClick={handleOpenAddModal}
                  style={{
                    background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(43,108,176,0.30)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={14} /> Add Lecturer
                </button>
              </div>
            )}
          </div>

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
            <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA" }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Lecturer Name</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Subjects Taught</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Mobile Number</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Email</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Date Joined</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.lecturers || []).map((lec) => (
                  <tr
                    key={lec.id}
                    onClick={() => setSelectedLecturer(lec)}
                    style={{ transition: "background 0.15s", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {lec.name}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.accent, fontWeight: 500, borderBottom: '1px solid #F4F5F7' }}>
                      <div>{lec.subjects.join(", ")}</div>
                      {Array.isArray(lec.assistantIds) && lec.assistantIds.length > 0 && (
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Assistants:
                          </span>
                          {lec.assistantIds.map(id => {
                            const a = safeLS('pba_users').find(u => u.id === id) || (data.lecturers || []).find(u => u.id === id);
                            if (!a) return null;
                            return (
                              <span key={id} style={{
                                fontSize: '11px', fontWeight: 600,
                                background: '#FFFBEB', color: '#B7860A',
                                border: '1px solid #F6D860', borderRadius: '20px',
                                padding: '2px 8px'
                              }}>{a.name}</span>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px', fontWeight: 500 }}>
                        {formatAvailabilitySummary(lec.availability)}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {lec.phone}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {lec.email}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {lec.dateJoined}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      {lec.status === "Active" ? (
                        <span style={{ background: theme.successLight, color: theme.success, border: '1px solid ' + theme.successBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38A169', display: 'inline-block' }} />
                          Active
                        </span>
                      ) : (
                        <span style={{ background: theme.warningLight, color: theme.warning, border: '1px solid ' + theme.warningBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                          {lec.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LECTURER DETAIL & TEACHING ASSIGNMENTS MODAL */}
      {selectedLecturer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "700px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setSelectedLecturer(null)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #2B6CB0, #1A4A8A)", color: "#FFF", fontSize: "20px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selectedLecturer.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontFamily: t.fontHeading, fontSize: "18px", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                    {selectedLecturer.name}
                  </h3>
                  <p style={{ fontSize: "13px", color: theme.textMuted, margin: "2px 0 0" }}>
                    {selectedLecturer.email} • {selectedLecturer.phone}
                  </p>
                  {Array.isArray(selectedLecturer.assistantIds) && selectedLecturer.assistantIds.length > 0 && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Assistants:
                      </span>
                      {selectedLecturer.assistantIds.map(id => {
                        const a = safeLS('pba_users').find(u => u.id === id) || (data.lecturers || []).find(u => u.id === id);
                        if (!a) return null;
                        return (
                          <span key={id} style={{
                            fontSize: '11px', fontWeight: 600,
                            background: '#FFFBEB', color: '#B7860A',
                            border: '1px solid #F6D860', borderRadius: '20px',
                            padding: '2px 8px'
                          }}>{a.name}</span>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px', fontWeight: 500 }}>
                    {formatAvailabilitySummary(selectedLecturer.availability)}
                  </div>
                </div>
              </div>

              {role === "Admin" && (
                <button
                  onClick={() => {
                    const lToEdit = selectedLecturer;
                    setSelectedLecturer(null);
                    handleOpenEditModal(lToEdit);
                  }}
                  style={{
                    background: "transparent",
                    border: "1.5px solid #2B6CB0",
                    color: "#2B6CB0",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div style={{ marginTop: "20px" }}>
              <h4 style={{ fontFamily: t.fontHeading, fontSize: "14px", fontWeight: 700, color: theme.textPrimary, marginBottom: "12px", borderBottom: "1px solid #E3E6EA", paddingBottom: "8px" }}>
                Teaching Assignments
              </h4>

              {(() => {
                const assignmentsList = [];
                (data.batchSubjects || []).forEach((bs) => {
                  (bs.subjectAssignments || []).forEach((sa) => {
                    const isMain = sa.mainLecturerId === selectedLecturer.id || sa.mainLecturerName === selectedLecturer.name;
                    const isAsst = sa.assistantLecturerId === selectedLecturer.id || sa.assistantLecturerName === selectedLecturer.name;

                    if (isMain || isAsst) {
                      assignmentsList.push({
                        subject: sa.subjectName || sa.subjectCode,
                        batch: bs.batchName || bs.batch,
                        branch: bs.branch || "Kohuwala",
                        role: isMain ? "Main Lecturer" : "Assistant",
                        hasAssistant: sa.hasAssistant,
                        classesPerWeek: sa.classesPerWeek || (sa.hasAssistant ? 2 : 1),
                        detailText: isAsst
                          ? "2 classes/week (teaches Class 2)"
                          : sa.hasAssistant
                          ? "2 classes/week (teaches Class 1)"
                          : "1 class/week"
                      });
                    }
                  });
                });

                if (assignmentsList.length === 0) {
                  return (
                    <div style={{ padding: "16px", background: "#F8F9FA", borderRadius: "8px", fontSize: "13px", color: theme.textMuted, fontStyle: "italic", textAlign: "center" }}>
                      No batch subject assignments found for this lecturer.
                    </div>
                  );
                }

                return (
                  <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
                    <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#F8F9FA" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: theme.textMuted, textTransform: "uppercase" }}>Subject</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: theme.textMuted, textTransform: "uppercase" }}>Batch</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: theme.textMuted, textTransform: "uppercase" }}>Branch</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: theme.textMuted, textTransform: "uppercase" }}>Role</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: theme.textMuted, textTransform: "uppercase" }}>Classes/Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentsList.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #F4F5F7" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: theme.textPrimary }}>{item.subject}</td>
                          <td style={{ padding: "10px 12px", color: theme.textSecondary }}>{item.batch}</td>
                          <td style={{ padding: "10px 12px", color: theme.textSecondary }}>{item.branch}</td>
                          <td style={{ padding: "10px 12px" }}>
                            {item.role === "Main Lecturer" ? (
                              <span style={{ background: "#EBF4FF", color: "#2B6CB0", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px" }}>
                                Main Lecturer
                              </span>
                            ) : (
                              <span style={{ background: "#FEF3C7", color: "#B7860A", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px" }}>
                                Assistant
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: theme.textSecondary }}>
                            {item.detailText}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #F4F5F7" }}>
                <button
                  onClick={() => setSelectedLecturer(null)}
                  style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE REQUESTS */}
      {activeTab === "leave" && (
        <div
          style={{
            background: theme.cardBg,
            border: "1px solid " + theme.cardBorder,
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid #F4F5F7",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#FFFFFF"
            }}
          >
            <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
              <CalendarCheck size={18} style={{ color: theme.accent }} /> Leave Request Management
            </span>
            {(role === "Lecturer" || role === "Admin") && (
              <button
                onClick={() => setShowLeaveModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(43,108,176,0.30)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={14} /> Submit Leave Request
              </button>
            )}
          </div>

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
            <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA" }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Lecturer</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Dates</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Type</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Reason</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Cover Assigned</th>
                  {role === "Admin" && <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(data.leaveRequests || []).map((l) => (
                  <tr
                    key={l.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {l.lecturerName}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {l.startDate} {l.endDate && l.endDate !== l.startDate ? ` to ${l.endDate}` : ""}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      <span style={{ background: theme.accentLight, color: theme.accentDark, border: '1px solid #BEE3F8', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                        {l.type}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {l.reason}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      {l.status === "Approved" ? (
                        <span style={{ background: theme.successLight, color: theme.success, border: '1px solid ' + theme.successBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38A169', display: 'inline-block' }} />
                          Approved
                        </span>
                      ) : l.status === "Rejected" ? (
                        <span style={{ background: theme.dangerLight, color: theme.danger, border: '1px solid ' + theme.dangerBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E53E3E', display: 'inline-block' }} />
                          Rejected
                        </span>
                      ) : (
                        <span style={{ background: theme.warningLight, color: theme.warning, border: '1px solid ' + theme.warningBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {l.coverLecturerAssigned ? <strong style={{ color: theme.textPrimary }}>{l.coverLecturerAssigned}</strong> : <span style={{ color: theme.textMuted }}>None</span>}
                    </td>
                    {role === "Admin" && (
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                        {l.status === "Pending" ? (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => approveLeaveRequest(l.id)}
                              style={{
                                background: 'linear-gradient(135deg, #2F855A, #276749)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectLeaveRequest(l.id, "Rejected by Admin")}
                              style={{
                                background: 'linear-gradient(135deg, #C53030, #9B2C2C)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: theme.textMuted }}>Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WEEKLY AVAILABILITY GRID */}
      {activeTab === "availability" && (() => {
        // Build raw grid rows for all lecturers
        const gridRows = (data.lecturers || []).map((lec) => {
          const allSlots = [];
          const slotsByDay = {};

          ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].forEach((day) => {
            const daySlots = [];

            (data.batchSubjects || []).forEach((bs) => {
              (bs.subjectAssignments || []).forEach((sa) => {
                const isMain = sa.mainLecturerId === lec.id || sa.mainLecturerName === lec.name;
                const isAsst = sa.assistantLecturerId === lec.id || sa.assistantLecturerName === lec.name;

                if (isMain || isAsst) {
                  const matchingSchedule = (sa.classSchedule || []).filter(
                    (cs) => cs.dayOfWeek === day && (isMain ? (cs.taughtBy === "main" || cs.classNumber === 1) : (cs.taughtBy === "assistant" || cs.classNumber === 2))
                  );

                  if (matchingSchedule.length > 0) {
                    matchingSchedule.forEach((cs) => {
                      daySlots.push({
                        role: isMain ? "main" : "assistant",
                        subjectCode: sa.subjectCode || sa.subjectName,
                        subjectName: sa.subjectName || sa.subjectCode,
                        batchName: bs.batchName || bs.batch,
                        classNumber: cs.classNumber,
                        startTime: cs.startTime,
                        endTime: cs.endTime,
                        time: (cs.startTime && cs.endTime) ? `${cs.startTime} – ${cs.endTime}` : cs.time
                      });
                    });
                  }
                }
              });
            });

            if (daySlots.length === 0 && lec.availability && lec.availability[day]) {
              const rawSlots = lec.availability[day];
              rawSlots.forEach((s) => {
                const isAssistantAnywhere = (data.batchSubjects || []).some((bs) =>
                  (bs.subjectAssignments || []).some((sa) => sa.assistantLecturerId === lec.id || sa.assistantLecturerName === lec.name)
                );
                daySlots.push({
                  role: isAssistantAnywhere ? "assistant" : "main",
                  subjectCode: lec.subjects?.[0] || "SUBJ",
                  subjectName: lec.subjects?.[0] || "SUBJ",
                  batchName: "Batch 2024-A",
                  classNumber: isAssistantAnywhere ? 2 : 1,
                  time: s
                });
              });
            }

            slotsByDay[day] = daySlots;
            allSlots.push(...daySlots);
          });

          return {
            lecturerId: lec.id,
            lecturerName: lec.name,
            subjects: lec.subjects || [],
            slotsByDay,
            allSlots
          };
        });

        // Unique filter options
        const uniqueLecturers = (data.lecturers || []).map((l) => ({ id: l.id, name: l.name }));
        const uniqueSubjects = Array.from(
          new Set([
            ...gridRows.flatMap((r) => r.allSlots.map((s) => s.subjectName)),
            ...(data.subjects || []).map((s) => s.name)
          ])
        ).filter(Boolean);
        const uniqueBatches = Array.from(
          new Set([
            ...gridRows.flatMap((r) => r.allSlots.map((s) => s.batchName)),
            ...(data.batchSubjects || []).map((b) => b.batchName || b.batch)
          ])
        ).filter(Boolean);

        // Filter grid rows
        const filteredGridRows = gridRows.filter((row) => {
          if (filterLecturer && row.lecturerId !== filterLecturer && row.lecturerName !== filterLecturer) {
            return false;
          }

          if (filterSubject || filterBatch) {
            const hasMatchingSlot = row.allSlots.some((slot) => {
              const subjectMatch = !filterSubject || slot.subjectName === filterSubject || slot.subjectCode === filterSubject;
              const batchMatch = !filterBatch || slot.batchName === filterBatch;
              return subjectMatch && batchMatch;
            });
            if (!hasMatchingSlot) return false;
          }

          return true;
        });

        return (
          <div
            style={{
              background: theme.cardBg,
              border: "1px solid " + theme.cardBorder,
              borderRadius: "14px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              overflow: "hidden"
            }}
          >
            {/* CARD HEADER */}
            <div
              style={{
                padding: "16px 22px",
                borderBottom: "1px solid #F4F5F7",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#FFFFFF"
              }}
            >
              <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
                <Grid size={18} style={{ color: theme.accent }} /> Weekly Lecturer Availability Grid
              </span>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "12px", color: theme.textSecondary }}>
                <span style={{ display: "inline-block", width: "12px", height: "12px", backgroundColor: theme.accent, borderRadius: "3px" }} />
                <span>Scheduled</span>
                <span style={{ display: "inline-block", width: "12px", height: "12px", backgroundColor: "#E3E6EA", borderRadius: "3px" }} />
                <span>Free Slot</span>
              </div>
            </div>

            {/* FILTER ROW ABOVE GRID TABLE */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                padding: '16px 22px 12px 22px',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: '#FFFFFF',
                borderBottom: '1px solid #F4F5F7'
              }}
            >
              {/* Lecturer filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lecturer</label>
                <select
                  value={filterLecturer}
                  onChange={(e) => setFilterLecturer(e.target.value)}
                  style={{
                    padding: '7px 32px 7px 11px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1A202C',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    cursor: 'pointer',
                    minWidth: '160px'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="">All Lecturers</option>
                  {uniqueLecturers.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Subject filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject</label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  style={{
                    padding: '7px 32px 7px 11px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1A202C',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    cursor: 'pointer',
                    minWidth: '160px'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="">All Subjects</option>
                  {uniqueSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Batch filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batch</label>
                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  style={{
                    padding: '7px 32px 7px 11px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1A202C',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    cursor: 'pointer',
                    minWidth: '160px'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="">All Batches</option>
                  {uniqueBatches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Clear filters button */}
              {(filterLecturer || filterSubject || filterBatch) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', color: 'transparent' }}>Clear</label>
                  <button
                    onClick={() => { setFilterLecturer(''); setFilterSubject(''); setFilterBatch(''); }}
                    style={{
                      padding: '7px 14px',
                      background: '#FFFFFF',
                      border: '1.5px solid #E3E6EA',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#718096',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontFamily: "'Inter', sans-serif"
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* TABLE GRID OR EMPTY STATE */}
            {filteredGridRows.length > 0 ? (
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
                <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
                  <thead>
                    <tr style={{ background: "#F8F9FA" }}>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Lecturer Name</th>
                      <th>Monday</th>
                      <th>Tuesday</th>
                      <th>Wednesday</th>
                      <th>Thursday</th>
                      <th>Friday</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGridRows.map((row) => (
                      <tr
                        key={row.lecturerId}
                        style={{ transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: '13px 16px', textAlign: 'left', borderBottom: '1px solid #F4F5F7' }}>
                          <strong style={{ fontSize: "13px", color: theme.textPrimary }}>{row.lecturerName}</strong>
                          <div style={{ fontSize: "11px", color: theme.accent, fontWeight: 500 }}>{row.subjects?.[0]}</div>
                        </td>
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                          const rawDaySlots = row.slotsByDay[day] || [];
                          const daySlots = rawDaySlots.filter((slot) => {
                            const subjectMatch = !filterSubject || slot.subjectName === filterSubject || slot.subjectCode === filterSubject;
                            const batchMatch = !filterBatch || slot.batchName === filterBatch;
                            return subjectMatch && batchMatch;
                          });

                          return (
                            <td key={day} style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7', verticalAlign: 'top' }}>
                              {daySlots.length > 0 ? (
                                daySlots.map((s, idx) => {
                                  const isMain = s.role === "main";
                                  const displayTime = (s.startTime && s.endTime)
                                    ? `${s.startTime} – ${s.endTime}`
                                    : (typeof s.time === "string" && s.time.trim() ? s.time : null);

                                  if (isMain) {
                                    return (
                                      <div
                                        key={idx}
                                        style={{
                                          background: '#EBF4FF',
                                          border: '1.5px solid #BEE3F8',
                                          color: '#2B6CB0',
                                          padding: '5px 8px',
                                          borderRadius: '6px',
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          marginBottom: '4px',
                                          textAlign: 'left',
                                          whiteSpace: 'pre-line'
                                        }}
                                      >
                                        <div>{s.subjectCode} — Class 1</div>
                                        <div style={{ fontSize: '10px', opacity: 0.85 }}>{s.batchName}</div>
                                        {displayTime && (
                                          <div
                                            style={{
                                              fontSize: '10px',
                                              color: '#2B6CB0',
                                              opacity: 0.8,
                                              marginTop: '2px',
                                              fontWeight: 500
                                            }}
                                          >
                                            {displayTime}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } else {
                                    let mainLecturerName = s.mainLecturerName;
                                    if (!mainLecturerName) {
                                      const pbaUsers = safeLS('pba_users', []);
                                      const allLecs = [...pbaUsers, ...(data.lecturers || [])];
                                      const mainLec = allLecs.find(u => Array.isArray(u.assistantIds) && u.assistantIds.includes(row.lecturerId));
                                      if (mainLec) {
                                        mainLecturerName = mainLec.name;
                                      }
                                    }
                                    return (
                                      <div
                                        key={idx}
                                        style={{
                                          background: '#FEF3C7',
                                          border: '1.5px solid #F6D860',
                                          color: '#B7860A',
                                          padding: '5px 8px',
                                          borderRadius: '6px',
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          marginBottom: '4px',
                                          textAlign: 'left',
                                          whiteSpace: 'pre-line'
                                        }}
                                      >
                                        <div>{s.subjectCode} — Class 2 (Asst)</div>
                                        <div style={{ fontSize: '10px', opacity: 0.85 }}>{s.batchName}</div>
                                        {displayTime && (
                                          <div
                                            style={{
                                              fontSize: '10px',
                                              color: '#B7860A',
                                              opacity: 0.8,
                                              marginTop: '2px',
                                              fontWeight: 500
                                            }}
                                          >
                                            {displayTime}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                })
                              ) : (
                                <span style={{ color: theme.textMuted, fontSize: "12px" }}>Free</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#A0AEC0' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="1.5" style={{ marginBottom: '10px', display: 'block', margin: '0 auto 10px' }}>
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>No schedules match the selected filters</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting or clearing the filters</div>
              </div>
            )}

            {/* LEGEND */}
            <div style={{ display: 'flex', gap: '16px', padding: '12px 22px', background: '#F8F9FA', borderTop: '1px solid #E3E6EA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '3px',
                  background: '#EBF4FF',
                  border: '1.5px solid #BEE3F8',
                  flexShrink: 0
                }} />
                <span style={{ fontSize: '12px', color: '#2B6CB0', fontWeight: 600 }}>
                  Main Lecturer (Class 1)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '3px',
                  background: '#FFFBEB',
                  border: '1.5px solid #F6D860',
                  flexShrink: 0
                }} />
                <span style={{ fontSize: '12px', color: '#B7860A', fontWeight: 600 }}>
                  Assistant (Class 2)
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 4: SYLLABUS PROGRESS TRACKER */}
      {activeTab === "progress" && (
        <div
          style={{
            background: theme.cardBg,
            border: "1px solid " + theme.cardBorder,
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid #F4F5F7",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#FFFFFF"
            }}
          >
            <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={18} style={{ color: theme.accent }} /> Syllabus Progress Tracker by Batch & Subject
            </span>
            <button
              onClick={() => setShowTopicModal(true)}
              style={{
                background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(43,108,176,0.30)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <PlusCircle size={14} /> Log Completed Topic
            </button>
          </div>

          <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {(data.syllabusTracker || []).map((item, idx) => {
              const completedCount = item.topics.filter((t) => t.completed).length;
              const percent = Math.round((completedCount / item.topics.length) * 100) || 0;

              const isAssistantRole = item.role === "Assistant" || item.isAssistant || (data.batchSubjects || []).some((bs) =>
                (bs.subjectAssignments || []).some((sa) =>
                  (sa.subjectName === item.subject || sa.subjectCode === item.subject) &&
                  (sa.assistantLecturerName === item.lecturer || sa.assistantLecturerId === item.lecturerId)
                )
              );

              const rowTitle = isAssistantRole
                ? `${item.subject} — ${item.batch} (Assistant)`
                : `${item.subject} — ${item.batch}`;

              return (
                <div key={idx} style={{ padding: "16px", border: "1px solid " + theme.cardBorder, borderRadius: "10px", backgroundColor: "#F8FAFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <strong style={{ fontSize: "14px", color: theme.textPrimary }}>
                        {rowTitle}
                      </strong>
                      <span style={{ fontSize: "12px", color: theme.textMuted, marginLeft: "10px" }}>Lecturer: {item.lecturer}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: theme.accent }}>{percent}% Completed</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: "10px", background: "#E3E6EA", borderRadius: "6px", overflow: "hidden", marginBottom: "14px" }}>
                    <div style={{ width: `${percent}%`, height: "100%", background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', transition: "width 0.4s ease" }} />
                  </div>

                  {/* Topic Checklist */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {item.topics.map((tp, tIdx) => (
                      <div
                        key={tIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          backgroundColor: tp.completed ? theme.successLight : "#FFFFFF",
                          border: "1px solid " + (tp.completed ? theme.successBorder : theme.cardBorder)
                        }}
                      >
                        <span style={{ fontSize: "13px", color: theme.textPrimary, fontWeight: tp.completed ? 600 : 400 }}>{tp.name}</span>
                        {tp.completed ? (
                          <span style={{ fontSize: "11px", color: theme.success, fontWeight: 700 }}>Completed on {tp.date}</span>
                        ) : (
                          <span style={{ fontSize: "11px", color: theme.textMuted }}>Pending</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SESSION LOG */}
      {activeTab === "sessionLog" && (() => {
        const sessions = safeLS('pba_timetable_sessions', []);
        const classChanges = safeLS('pba_class_changes', []);
        const attendanceList = safeLS('pba_session_attendance', []);
        const users = safeLS('pba_users', []);
        const subjects = safeLS('pba_subjects', []);
        const batches = safeLS('pba_batches', []);
        const classrooms = safeLS('pba_classrooms', []);
        const students = safeLS('pba_students', []);
        const enrollments = safeLS('pba_batch_enrollments', []);

        const lecturerList = users.filter(u => u.role === 'Lecturer' || data?.lecturers?.some(l => l.id === u.id));
        const todayStr = new Date().toISOString().split('T')[0];

        // Determine date bounds
        let startDate = new Date();
        let endDate = new Date();
        const now = new Date();

        if (logPeriod === "This Week") {
          const day = now.getDay();
          const distToMon = day === 0 ? -6 : 1 - day;
          startDate = new Date(now);
          startDate.setDate(now.getDate() + distToMon);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
        } else if (logPeriod === "This Month") {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (logPeriod === "This Year") {
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
        } else if (logPeriod === "Custom Range") {
          if (logCustomFrom) startDate = new Date(logCustomFrom);
          if (logCustomTo) endDate = new Date(logCustomTo);
        }

        // Generate rows
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const allLogRows = [];

        // Iterate dates
        const curr = new Date(startDate);
        while (curr <= endDate) {
          const dStr = curr.toISOString().split('T')[0];
          const dayName = dayNames[curr.getDay()];

          sessions.forEach(sess => {
            if (logLecturerFilter !== "All" && sess.lecturerId !== logLecturerFilter) return;

            let matches = false;
            if (sess.isMakeup && sess.date) {
              if (sess.date === dStr) matches = true;
            } else if (sess.day === dayName) {
              matches = true;
            }

            if (!matches) return;

            // Resolve entities
            const lectObj = users.find(u => u.id === sess.lecturerId) || (data?.lecturers || []).find(l => l.id === sess.lecturerId);
            const subjObj = subjects.find(s => s.id === sess.subjectId || s.code === sess.subjectId);
            const batchObj = batches.find(b => b.id === sess.batchId);
            const roomObj = classrooms.find(r => r.id === sess.classroomId);

            // Check class changes
            const change = classChanges.find(c => c.sessionId === sess.id && c.date === dStr);
            let status = 'Conducted';
            let statusText = '✓ Conducted';
            let statusStyle = { background: '#F0FFF4', color: '#276749' };

            if (change && change.type === 'cancelled') {
              if (change.substituteId) {
                const subUser = users.find(u => u.id === change.substituteId);
                status = 'Substituted';
                statusText = `⇄ Substituted by ${subUser?.name || 'Substitute'}`;
                statusStyle = { background: '#FFFBEB', color: '#B7860A' };
              } else {
                status = 'Cancelled';
                statusText = '✕ Cancelled';
                statusStyle = { background: '#FFF5F5', color: '#C53030' };
              }
            } else if (dStr > todayStr) {
              status = 'Upcoming';
              statusText = '◷ Upcoming';
              statusStyle = { background: '#EBF4FF', color: '#2B6CB0' };
            }

            // Attendance
            const attRec = attendanceList.find(a => a.sessionId === sess.id && a.date === dStr);
            let attendanceStr = '—';
            if (attRec && Array.isArray(attRec.records)) {
              const presentCount = attRec.records.filter(r => r.status === 'present' || r.status === 'late').length;
              let activeEnrolled = enrollments.filter(e => e.batchId === sess.batchId && e.status === 'active').length;
              if (activeEnrolled === 0) activeEnrolled = attRec.records.length || students.length || 0;
              attendanceStr = `${presentCount} / ${activeEnrolled}`;
            }

            // Date formatted: DD MMM YYYY
            const dateObj = new Date(dStr + 'T00:00:00');
            const dateDisplay = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            allLogRows.push({
              id: `${sess.id}_${dStr}`,
              rawDate: dStr,
              dateDisplay,
              dayName,
              lecturerName: lectObj?.name || 'Unknown Lecturer',
              batchName: batchObj?.name || 'Unknown Batch',
              subjectName: subjObj?.name || 'Unknown Subject',
              timeDisplay: `${sess.startTime || ''} – ${sess.endTime || ''}`,
              classroomName: roomObj?.name || sess.classroomId || '—',
              status,
              statusText,
              statusStyle,
              attendanceStr
            });
          });

          curr.setDate(curr.getDate() + 1);
        }

        // Stats calculation over ALL generated rows for selected lecturer/period
        const totalScheduled = allLogRows.length;
        const totalConducted = allLogRows.filter(r => r.status === 'Conducted').length;
        const totalMissed = allLogRows.filter(r => r.status === 'Cancelled').length;
        const totalSubstituted = allLogRows.filter(r => r.status === 'Substituted').length;
        const attendRate = totalScheduled > 0 ? Math.round((totalConducted / totalScheduled) * 100) : 0;
        const attendRateColor = attendRate >= 80 ? '#276749' : attendRate >= 60 ? '#B7860A' : '#C53030';

        // Filter out upcoming if not toggled
        const displayRows = allLogRows
          .filter(r => logIncludeUpcoming || r.status !== 'Upcoming')
          .sort((a, b) => b.rawDate.localeCompare(a.rawDate));

        // Pagination
        const pageSize = 30;
        const totalPages = Math.ceil(displayRows.length / pageSize) || 1;
        const paginatedRows = displayRows.slice((logPage - 1) * pageSize, logPage * pageSize);

        // CSV export handler
        const handleExportCSV = () => {
          const headers = ['Date', 'Day', 'Lecturer', 'Batch', 'Subject', 'Time', 'Classroom', 'Status', 'Attendance'];
          const csvLines = [headers.join(',')];

          displayRows.forEach(r => {
            const rowStr = [
              `"${r.dateDisplay}"`,
              `"${r.dayName}"`,
              `"${r.lecturerName}"`,
              `"${r.batchName}"`,
              `"${r.subjectName}"`,
              `"${r.timeDisplay}"`,
              `"${r.classroomName}"`,
              `"${r.statusText}"`,
              `"${r.attendanceStr}"`
            ].join(',');
            csvLines.push(rowStr);
          });

          const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const lectName = logLecturerFilter === 'All' ? 'AllLecturers' : (users.find(u => u.id === logLecturerFilter)?.name || 'Lecturer').replace(/\s+/g, '_');
          link.setAttribute('href', url);
          link.setAttribute('download', `session-log-${lectName}-${logPeriod.replace(/\s+/g, '_')}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <div style={{ background: theme.cardBg, border: "1px solid " + theme.cardBorder, borderRadius: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #F4F5F7", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF" }}>
              <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
                📋 Session Log & Attendance History
              </span>
              <button
                onClick={handleExportCSV}
                style={{
                  background: '#D4A017', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                ⬇ Download CSV
              </button>
            </div>

            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* FILTER BAR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E3E6EA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {/* Lecturer dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#4A5568' }}>Lecturer:</label>
                    <select
                      value={logLecturerFilter}
                      onChange={e => { setLogLecturerFilter(e.target.value); setLogPage(1); }}
                      style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #E3E6EA', fontSize: '13px', outline: 'none' }}
                    >
                      <option value="All">All Lecturers</option>
                      {lecturerList.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Period quick-select pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {['This Week', 'This Month', 'This Year', 'Custom Range'].map(p => (
                      <button
                        key={p}
                        onClick={() => { setLogPeriod(p); setLogPage(1); }}
                        style={{
                          padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                          background: logPeriod === p ? '#2B6CB0' : '#F0F2F5',
                          color: logPeriod === p ? '#FFFFFF' : '#4A5568'
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Range row */}
                {logPeriod === 'Custom Range' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: '1px solid #E3E6EA' }}>
                    <label style={{ fontSize: '12px', color: '#4A5568' }}>From:</label>
                    <input type="date" value={logCustomFrom} onChange={e => setLogCustomFrom(e.target.value)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '12px' }} />
                    <label style={{ fontSize: '12px', color: '#4A5568' }}>To:</label>
                    <input type="date" value={logCustomTo} onChange={e => setLogCustomTo(e.target.value)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '12px' }} />
                    <button onClick={() => setLogPage(1)} style={{ padding: '5px 14px', background: '#2B6CB0', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* STATS ROW */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '10px', padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#1A202C' }}>{totalScheduled}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>SCHEDULED</div>
                </div>
                <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '10px', padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#276749' }}>{totalConducted}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>CONDUCTED</div>
                </div>
                <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '10px', padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#C53030' }}>{totalMissed}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>MISSED</div>
                </div>
                <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '10px', padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#B7860A' }}>{totalSubstituted}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>SUBSTITUTED</div>
                </div>
                <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '10px', padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: attendRateColor }}>{attendRate}%</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>ATTEND RATE</div>
                </div>
              </div>

              {/* TOGGLE FOR UPCOMING */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4A5568', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={logIncludeUpcoming}
                    onChange={e => { setLogIncludeUpcoming(e.target.checked); setLogPage(1); }}
                  />
                  Include upcoming
                </label>
              </div>

              {/* SESSION LOG TABLE */}
              {paginatedRows.length > 0 ? (
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #E3E6EA', borderRadius: '12px' }}>
                  <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E3E6EA' }}>
                        <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#718096' }}>DATE</th>
                        <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#718096' }}>DAY</th>
                        <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#718096' }}>BATCH</th>
                        <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#718096' }}>SUBJECT</th>
                        <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#718096' }}>TIME</th>
                        <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#718096' }}>CLASSROOM</th>
                        <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#718096' }}>STATUS</th>
                        <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#718096' }}>ATTENDANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F0F2F5' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1A202C' }}>{r.dateDisplay}</td>
                          <td style={{ padding: '10px 14px', color: '#4A5568' }}>{r.dayName}</td>
                          <td style={{ padding: '10px 14px', color: '#4A5568' }}>{r.batchName}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2B6CB0' }}>{r.subjectName}</td>
                          <td style={{ padding: '10px 14px', color: '#4A5568' }}>{r.timeDisplay}</td>
                          <td style={{ padding: '10px 14px', color: '#4A5568' }}>{r.classroomName}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                              background: r.statusStyle.background, color: r.statusStyle.color
                            }}>
                              {r.statusText}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: r.attendanceStr === '—' ? '#A0AEC0' : '#276749' }}>
                            {r.attendanceStr}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0', fontStyle: 'italic', background: '#F8FAFC', borderRadius: '10px' }}>
                  No session logs found for the selected filter and period.
                </div>
              )}

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#718096' }}>
                    Page {logPage} of {totalPages} ({displayRows.length} sessions)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      disabled={logPage === 1}
                      onClick={() => setLogPage(p => Math.max(1, p - 1))}
                      style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E3E6EA', background: '#FFF', fontSize: '12px', cursor: logPage === 1 ? 'not-allowed' : 'pointer', opacity: logPage === 1 ? 0.5 : 1 }}
                    >
                      Prev
                    </button>
                    <button
                      disabled={logPage === totalPages}
                      onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                      style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E3E6EA', background: '#FFF', fontSize: '12px', cursor: logPage === totalPages ? 'not-allowed' : 'pointer', opacity: logPage === totalPages ? 0.5 : 1 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Add Lecturer Modal */}
      {showAddLecModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "520px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowAddLecModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Add New Lecturer Profile</h3>
            <form onSubmit={handleAddLecturer}>
              {/* 1. FULL NAME */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Amal Perera"
                  value={lecForm.name}
                  onChange={(e) => setLecForm({ ...lecForm, name: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", background: "#FFFFFF", fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* 2. BRANCH & 3. EMPLOYMENT TYPE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Branch</label>
                  <select
                    required
                    value={lecForm.branch}
                    onChange={(e) => setLecForm({ ...lecForm, branch: e.target.value })}
                    style={{
                      width: "100%", padding: "9px 36px 9px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", background: "#FFFFFF", fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer"
                    }}
                    onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                  >
                    <option value="">Select branch...</option>
                    {getBranches().map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="All">All Branches</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Employment Type</label>
                  <select
                    required
                    value={lecForm.employmentType}
                    onChange={(e) => setLecForm({ ...lecForm, employmentType: e.target.value })}
                    style={{
                      width: "100%", padding: "9px 36px 9px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", background: "#FFFFFF", fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer"
                    }}
                    onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                  >
                    <option value="">Select type...</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Visiting">Visiting</option>
                  </select>
                </div>
              </div>

              {/* 4. SUBJECTS TAUGHT */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Subjects Taught</label>
                {availableSubjects.length > 0 ? (
                  <div style={{
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    padding: '8px 12px',
                    background: '#FAFBFC'
                  }}>
                    {availableSubjects.map((s) => (
                      <label key={s.id} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '5px 0', cursor: 'pointer',
                        fontSize: '13px', color: '#1A202C'
                      }}>
                        <input
                          type="checkbox"
                          checked={(lecForm.subjectIds || []).includes(s.id)}
                          onChange={() => toggleSubject(s.id)}
                          style={{ accentColor: '#2B6CB0' }}
                        />
                        <span style={{
                          background: ((s && s.color) || '#718096') + '20',
                          color: (s && s.color) || '#718096',
                          fontSize: '10px', fontWeight: 800,
                          padding: '1px 6px', borderRadius: '10px', marginRight: '4px'
                        }}>{(s && s.code) || '—'}</span>
                        {s && s.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    padding: '12px',
                    background: '#FAFBFC',
                    fontSize: '12px',
                    color: '#A0AEC0',
                    fontStyle: 'italic'
                  }}>
                    No subjects found. Add subjects in General Admin → Subject Registry first.
                  </div>
                )}
              </div>

              {/* ASSIGN ASSISTANT(S) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '10px', fontWeight: 700, color: '#718096',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  display: 'block', marginBottom: '8px'
                }}>
                  Assign Assistant(s)
                </label>

                {/* Search / filter input */}
                <input
                  type="text"
                  placeholder="Search assistants..."
                  value={assistantSearch}
                  onChange={e => setAssistantSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px',
                    border: '1px solid #E3E6EA', borderRadius: '7px',
                    fontSize: '12px', marginBottom: '8px', boxSizing: 'border-box'
                  }}
                />

                {/* Scrollable checkbox list */}
                <div style={{
                  border: '1px solid #E3E6EA', borderRadius: '8px',
                  maxHeight: '140px', overflowY: 'auto', padding: '6px 0'
                }}>
                  {assistantCandidates
                    .filter(u =>
                      (u.name || '').toLowerCase().includes((assistantSearch || '').toLowerCase())
                    )
                    .map(u => (
                      <label key={u.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '7px 12px', cursor: 'pointer',
                        background: selectedAssistantIds.includes(u.id) ? '#EBF4FF' : 'transparent'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedAssistantIds.includes(u.id)}
                          onChange={() => {
                            setSelectedAssistantIds(prev =>
                              prev.includes(u.id)
                                ? prev.filter(id => id !== u.id)
                                : [...prev, u.id]
                            );
                          }}
                        />
                        <span style={{ fontSize: '13px', color: '#1A202C' }}>{u.name}</span>
                        {u.branch && (
                          <span style={{
                            fontSize: '10px', fontWeight: 600, color: '#718096',
                            background: '#F0F2F5', borderRadius: '10px',
                            padding: '2px 7px', marginLeft: 'auto'
                          }}>{u.branch}</span>
                        )}
                      </label>
                    ))
                  }
                  {assistantCandidates.length === 0 && (
                    <div style={{ padding: '10px 12px', fontSize: '12px', color: '#A0AEC0' }}>
                      No assistant accounts found
                    </div>
                  )}
                </div>

                {/* Selected chips */}
                {selectedAssistantIds.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {selectedAssistantIds.map(id => {
                      const u = assistantCandidates.find(a => a.id === id);
                      if (!u) return null;
                      return (
                        <span key={id} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: '#EBF4FF', color: '#2B6CB0',
                          border: '1px solid #BEE3F8', borderRadius: '20px',
                          padding: '3px 10px', fontSize: '11px', fontWeight: 600
                        }}>
                          {u.name}
                          <span
                            onClick={() => setSelectedAssistantIds(prev => prev.filter(x => x !== id))}
                            style={{ cursor: 'pointer', fontWeight: 700, marginLeft: '2px' }}
                          >×</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* WEEKLY AVAILABILITY */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '10px', fontWeight: 700, color: '#718096',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  display: 'block', marginBottom: '8px'
                }}>
                  Weekly Availability
                </label>
                <div style={{ border: '1px solid #E3E6EA', borderRadius: '8px', padding: '8px 12px', background: '#FAFBFC' }}>
                  {availability.map((item, idx) => {
                    const toMinVal = (t) => { const [h, m] = (t || '00:00').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
                    const diffHrs = Math.max(0, (toMinVal(item.to) - toMinVal(item.from)) / 60);
                    const hrsText = `${diffHrs} hrs`;
                    let badgeBg = '#FFF5F5';
                    let badgeColor = '#C53030';
                    if (diffHrs >= 6) { badgeBg = '#F0FFF4'; badgeColor = '#276749'; }
                    else if (diffHrs >= 3) { badgeBg = '#FFFBEB'; badgeColor = '#B7860A'; }

                    return (
                      <div
                        key={item.day}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0',
                          borderBottom: idx < availability.length - 1 ? '1px solid #F0F2F5' : 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.isAvailable}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setAvailability(prev => prev.map(a => a.day === item.day ? { ...a, isAvailable: checked } : a));
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2B6CB0' }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: item.isAvailable ? '#1A202C' : '#A0AEC0', width: '90px' }}>
                          {item.day}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: item.isAvailable ? 1 : 0.4, pointerEvents: item.isAvailable ? 'auto' : 'none' }}>
                          <input
                            type="time"
                            value={item.from}
                            disabled={!item.isAvailable}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAvailability(prev => prev.map(a => a.day === item.day ? { ...a, from: val } : a));
                            }}
                            style={{ padding: '3px 6px', border: '1px solid #E3E6EA', borderRadius: '6px', fontSize: '12px' }}
                          />
                          <span style={{ fontSize: '11px', color: '#718096' }}>to</span>
                          <input
                            type="time"
                            value={item.to}
                            disabled={!item.isAvailable}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAvailability(prev => prev.map(a => a.day === item.day ? { ...a, to: val } : a));
                            }}
                            style={{ padding: '3px 6px', border: '1px solid #E3E6EA', borderRadius: '6px', fontSize: '12px' }}
                          />
                          {item.isAvailable && (
                            <span style={{
                              fontSize: '10px', fontWeight: 700, background: badgeBg, color: badgeColor,
                              borderRadius: '10px', padding: '2px 7px', marginLeft: '4px'
                            }}>
                              {hrsText}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const toMinVal = (t) => { const [h, m] = (t || '00:00').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
                  const availDays = availability.filter(a => a.isAvailable).length;
                  const totalHrs = availability.reduce((acc, a) => {
                    if (!a.isAvailable) return acc;
                    return acc + Math.max(0, (toMinVal(a.to) - toMinVal(a.from)) / 60);
                  }, 0);
                  return (
                    <div style={{ fontSize: '11px', color: '#718096', marginTop: '6px', fontWeight: 500 }}>
                      Available {availDays}/6 days · {totalHrs} hrs/week
                    </div>
                  );
                })()}
              </div>

              {/* 5. QUALIFICATION */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. BSc Accounting, CIMA"
                  value={lecForm.qualification}
                  onChange={(e) => setLecForm({ ...lecForm, qualification: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", background: "#FFFFFF", fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* 6. MOBILE NUMBER */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Mobile Number</label>
                <input
                  type="text"
                  value={lecForm.phone}
                  onChange={(e) => setLecForm({ ...lecForm, phone: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", background: "#FFFFFF", fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* 7. EMAIL ADDRESS */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Email Address</label>
                <input
                  type="email"
                  value={lecForm.email}
                  onChange={(e) => setLecForm({ ...lecForm, email: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", background: "#FFFFFF", fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* 8. NOTES */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes..."
                  value={lecForm.notes}
                  onChange={(e) => setLecForm({ ...lecForm, notes: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 12px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", background: "#FFFFFF", fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setShowAddLecModal(false)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}>Save Lecturer Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Leave Modal */}
      {showLeaveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "500px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowLeaveModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Submit Lecturer Leave Request</h3>
            <form onSubmit={handleSubmitLeave}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Subject Affected</label>
                <input
                  type="text"
                  required
                  value={leaveForm.subject}
                  onChange={(e) => setLeaveForm({ ...leaveForm, subject: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Leave Date</label>
                <input
                  type="date"
                  required
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Leave Type</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                >
                  <option value="Personal">Personal</option>
                  <option value="Medical">Medical</option>
                  <option value="Official">Official</option>
                </select>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Reason for Leave</label>
                <textarea
                  rows="3"
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  style={{
                    width: "100%", padding: "10px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", resize: "vertical", minHeight: "100px", lineHeight: "1.6", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setShowLeaveModal(false)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Topic Modal */}
      {showTopicModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "500px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowTopicModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Log Completed Syllabus Topic</h3>
            <form onSubmit={handleLogTopic}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Select Batch & Subject</label>
                <select
                  value={selectedSyllabusIndex}
                  onChange={(e) => setSelectedSyllabusIndex(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                >
                  {(data.syllabusTracker || []).map((st, i) => (<option key={i} value={i}>{st.batch} — {st.subject}</option>))}
                </select>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Topic / Unit Name</label>
                <input
                  type="text"
                  required
                  value={topicForm.topicName}
                  onChange={(e) => setTopicForm({ ...topicForm, topicName: e.target.value })}
                  placeholder="e.g. Unit 4: Cash Flow Analysis"
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Date Completed</label>
                <input
                  type="date"
                  value={topicForm.dateCompleted}
                  onChange={(e) => setTopicForm({ ...topicForm, dateCompleted: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setShowTopicModal(false)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}>Log Topic</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Lecturers Modal */}
      {showImportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "800px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowImportModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>

            {importStep === 1 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", margin: 0 }}>Bulk Import Lecturers</h3>
                    <p style={{ fontSize: "12px", color: "#718096", margin: "2px 0 0 0" }}>Upload a CSV or Excel file with lecturer profiles</p>
                  </div>
                  <button
                    onClick={downloadLecturerCsvTemplate}
                    style={{ padding: '6px 12px', background: '#EBF4FF', border: '1px solid #BEE3F8', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#2B6CB0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Download size={13} /> Download Template CSV
                  </button>
                </div>

                <label style={{ display: 'block', border: '2px dashed #CBD5E0', borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#F8F9FB', marginBottom: '20px', transition: 'border-color 0.15s' }}>
                  <Upload size={32} style={{ color: '#718096', margin: '0 auto 8px auto', display: 'block' }} />
                  <div style={{ fontSize: '13px', color: '#4A5568', fontWeight: 600 }}>
                    {isParsing ? "Parsing file..." : "Click to upload CSV or Excel file"}
                  </div>
                  <div style={{ fontSize: '11px', color: '#A0AEC0', marginTop: '4px' }}>
                    Supported: .csv, .xlsx, .xls
                  </div>
                  <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleLecturerFileUpload} />
                </label>

                {importRows.length > 0 && (() => {
                  const readyCount = importRows.filter(r => r.status !== "error").length;
                  const errorCount = importRows.filter(r => r.status === "error").length;

                  return (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D3748', marginBottom: '10px' }}>
                        {importRows.length} records found — <span style={{ color: '#2F855A' }}>{readyCount} ready to import</span>, <span style={{ color: '#C53030' }}>{errorCount} with errors</span>
                      </div>

                      <div style={{ border: '1px solid #E3E6EA', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxHeight: '250px', overflowY: 'auto', marginBottom: '20px' }}>
                        <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ background: '#F8F9FB', borderBottom: '1px solid #E3E6EA' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Row</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Name</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Phone</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Branch</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Subjects</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importRows.slice(0, 10).map((r) => (
                              <tr key={r.rowNum} style={{ borderBottom: '1px solid #F4F5F7' }}>
                                <td style={{ padding: '8px 12px', color: '#718096' }}>#{r.rowNum}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1A202C' }}>{r.name || "—"}</td>
                                <td style={{ padding: '8px 12px', color: '#4A5568' }}>{r.phone || "—"}</td>
                                <td style={{ padding: '8px 12px', color: '#4A5568' }}>{r.branch}</td>
                                <td style={{ padding: '8px 12px', color: '#718096' }}>{r.subjectsStr || "Default"}</td>
                                <td style={{ padding: '8px 12px' }}>
                                  {r.status === "ready" && (
                                    <span style={{ background: '#F0FFF4', color: '#2F855A', border: '1px solid #9AE6B4', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>Ready</span>
                                  )}
                                  {r.status === "warning" && (
                                    <span style={{ background: '#FEF3C7', color: '#B7860A', border: '1px solid #F6D860', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }} title={r.statusMsg}>Warning</span>
                                  )}
                                  {r.status === "error" && (
                                    <span style={{ background: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }} title={r.statusMsg}>Error</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setShowImportModal(false)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>

                        {errorCount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleConfirmLecturerImport(true)}
                            style={{ background: '#D69E2E', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Import anyway (skip errors)
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={readyCount === 0 || (errorCount > 0 && readyCount === 0)}
                          onClick={() => handleConfirmLecturerImport(false)}
                          style={{
                            background: readyCount > 0 && errorCount === 0 ? 'linear-gradient(135deg, #2B6CB0, #1A4A8A)' : '#CBD5E0',
                            color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700,
                            cursor: readyCount > 0 ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Import {readyCount} Lecturers
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {importStep === 2 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={48} style={{ color: '#2F855A', margin: '0 auto 12px auto' }} />
                <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '20px', fontWeight: 700, color: '#1A202C', marginBottom: '8px' }}>Import Completed</h3>
                <p style={{ fontSize: '14px', color: '#2F855A', fontWeight: 600, marginBottom: '4px' }}>
                  ✓ {importLog.successCount} lecturers imported successfully
                </p>
                {importLog.errorCount > 0 && (
                  <p style={{ fontSize: '13px', color: '#C53030', marginBottom: '16px' }}>
                    ✗ {importLog.errorCount} rows skipped
                  </p>
                )}
                <button
                  onClick={() => setShowImportModal(false)}
                  style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 24px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '16px' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const LecturerManagementView = (props) => {
  return (
    <LecturerErrorBoundary>
      <LecturerManagementViewInner {...props} />
    </LecturerErrorBoundary>
  );
};
