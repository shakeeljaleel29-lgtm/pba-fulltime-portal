import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ReportCardModal } from "./ReportCardModal";
import { calcGrade, gradeColor } from "../../utils/gradeUtils";
import {
  User,
  CalendarCheck,
  BookOpen,
  FileCheck2,
  AlertTriangle,
  CreditCard,
  FolderOpen,
  FileSpreadsheet,
  X,
  Share2,
  Link
} from "lucide-react";

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

const saveLS = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error("saveLS error:", err);
  }
};

const resolveBatchName = (batchRef) => {
  if (!batchRef) return null;
  const allBatches = safeLS('pba_batches', []);
  const foundByName = (allBatches || []).find(b => b.name && b.name.toLowerCase() === String(batchRef).toLowerCase());
  if (foundByName) return foundByName.name;
  const foundById = (allBatches || []).find(b => b.id === batchRef);
  if (foundById) return foundById.name;
  if (!String(batchRef).includes('-') || String(batchRef).length < 20) return String(batchRef);
  return null;
};

export const StudentProfileDrawer = ({ student, initialTab = "overview", onClose }) => {
  const { data, linkStudentAccount, currentUser, updateStudent } = useApp();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [adminNotes, setAdminNotes] = useState(student?.adminNotes || "");
  const [profileRefresh, setProfileRefresh] = useState(0);
  const [batchRefresh, setBatchRefresh] = useState(0);
  const [disciplineRefresh, setDisciplineRefresh] = useState(0);

  const [disciplineModal, setDisciplineModal] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState(null);
  const [disciplineForm, setDisciplineForm] = useState({
    date: '',
    type: 'Tardiness',
    description: '',
    severity: 'Warning',
  });

  const [streamValue, setStreamValue] = useState(
    student?.stream || student?.streamName || ''
  );

  useEffect(() => {
    setStreamValue(student?.stream || student?.streamName || '');
  }, [student?.id || student?.studentId || student?.regNo]);

  const studentIdStr = (
    student?.id || student?.regNo || student?.studentId || ''
  ).toString();

  const saveStream = (val) => {
    const all = safeLS('pba_students', []) || [];
    const updated = all.map(s => {
      const sId = (s.id || s.studentId || s.regNo || '').toString();
      if (sId !== studentIdStr) return s;
      return { ...s, stream: val, streamName: val };
    });
    saveLS('pba_students', updated);
    setStreamValue(val);
    if (student) {
      student.stream = val;
      student.streamName = val;
    }
    setBatchRefresh(r => r + 1); // force re-render
  };

  const enrolledBatches = React.useMemo(() => {
    return (safeLS('pba_batches', []) || []).filter(b =>
      (b.students || []).some(s =>
        (s.id || s.regNo || s.studentId || '').toString() === studentIdStr
      )
    );
  }, [studentIdStr, batchRefresh]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    setAdminNotes(student?.adminNotes || "");
  }, [student?.id, student?.adminNotes]);

  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedUserAccountId, setSelectedUserAccountId] = useState(data.userAccounts.find((u) => u.role === "Student")?.id || "");

  // Single Student Enroll in Batch Modal State
  const [showSingleEnrollModal, setShowSingleEnrollModal] = useState(false);
  const [enrollBatchId, setEnrollBatchId] = useState("");
  const [enrollStream, setEnrollStream] = useState("");
  const [enrollSelectedSubjects, setEnrollSelectedSubjects] = useState([]);

  const openDisciplineModal = (existing) => {
    if (existing) {
      setEditingDiscipline(existing);
      setDisciplineForm({
        date: existing.date || '',
        type: existing.type || 'Tardiness',
        description: existing.description || '',
        severity: existing.severity || 'Warning',
      });
    } else {
      setEditingDiscipline(null);
      // Default date = today
      const today = new Date();
      const todayStr = today.getFullYear() + '-'
        + String(today.getMonth() + 1).padStart(2, '0') + '-'
        + String(today.getDate()).padStart(2, '0');
      setDisciplineForm({
        date: todayStr,
        type: 'Tardiness',
        description: '',
        severity: 'Warning',
      });
    }
    setDisciplineModal(true);
  };

  const saveDisciplineRecord = () => {
    if (!disciplineForm.date || !disciplineForm.description.trim()) {
      alert('Please fill in Date and Description.');
      return;
    }
    const existing = safeLS('pba_discipline', []) || [];
    let updated;
    if (editingDiscipline) {
      updated = existing.map(r =>
        r.id === editingDiscipline.id
          ? { ...r, ...disciplineForm }
          : r
      );
    } else {
      updated = [...existing, {
        id: Date.now().toString(),
        studentId: studentIdStr,
        ...disciplineForm,
        addedBy: 'Admin',
        addedAt: new Date().toISOString(),
      }];
    }
    saveLS('pba_discipline', updated);
    setDisciplineRefresh(r => r + 1);
    setDisciplineModal(false);
  };

  const deleteDisciplineRecord = (id) => {
    if (!window.confirm('Delete this discipline record?')) return;
    const existing = safeLS('pba_discipline', []) || [];
    saveLS('pba_discipline', existing.filter(r => r.id !== id));
    setDisciplineRefresh(r => r + 1);
  };

  if (!student) return null;

  const handleSaveAdminNotes = () => {
    if (updateStudent && student?.id) {
      updateStudent(student.id, { adminNotes });
    } else {
      const list = safeLS('pba_students', []);
      const updated = (list || []).map(s => (s.id === student?.id || s.regNo === student?.regNo) ? { ...s, adminNotes } : s);
      saveLS('pba_students', updated);
    }
    if (student) {
      student.adminNotes = adminNotes;
    }
  };

  const handleUnenrollBatch = (batchNameOrId) => {
    if (!window.confirm(`Are you sure you want to remove ${student?.name || 'this student'} from ${batchNameOrId}?`)) return;
    try {
      const allBatches = safeLS('pba_batches', []);
      const updatedBatches = (allBatches || []).map(b => {
        if (b.id !== batchNameOrId && b.name !== batchNameOrId) return b;
        return {
          ...b,
          students: (b.students || []).filter(s =>
            (s.id || s.regNo || s.studentId || '').toString() !== studentIdStr
          )
        };
      });
      saveLS('pba_batches', updatedBatches);

      const allEnrollments = safeLS('pba_batch_enrollments', []);
      const updatedEnrollments = (allEnrollments || []).filter(e =>
        !(((e.studentId || e.regNo || '').toString() === studentIdStr) &&
          (e.batchName === batchNameOrId || e.batchId === batchNameOrId))
      );
      saveLS('pba_batch_enrollments', updatedEnrollments);

      // Check remaining batches for this student
      const remainingBatches = updatedBatches.filter(b =>
        (b.students || []).some(s =>
          s.toString() === studentIdStr ||
          (typeof s === 'object' &&
            (s.id || s.studentId || s.regNo || '').toString() === studentIdStr)
        )
      );

      // If no batches remain, clear stream on the student record
      if (remainingBatches.length === 0) {
        const allStudents = safeLS('pba_students', []) || [];
        saveLS('pba_students', allStudents.map(s => {
          const sId = (s.id || s.studentId || s.regNo || '').toString();
          if (sId !== studentIdStr) return s;
          return { ...s, stream: '', streamName: '' };
        }));
        setStreamValue(''); // update local state immediately
        if (student) {
          student.stream = '';
          student.streamName = '';
        }
      }

      if (student) {
        if (Array.isArray(student.batches)) {
          student.batches = student.batches.filter(b => b !== batchNameOrId);
        }
        if (student.batch === batchNameOrId) student.batch = '';
        if (student.batchName === batchNameOrId) student.batchName = '';
        if (student.batchId === batchNameOrId) student.batchId = '';
      }
      setBatchRefresh(r => r + 1);
      setProfileRefresh(prev => prev + 1);
    } catch (err) {
      console.error("Error unenrolling batch:", err);
    }
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'ST';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'ST';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Safe date formatter — avoids UTC midnight shift by splitting on '-'
  const formatDate = (raw, format = 'short') => {
    if (!raw) return 'N/A';
    try {
      const parts = String(raw).split('T')[0].split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (isNaN(d.getTime())) return String(raw);
        const day = String(d.getDate()).padStart(2, '0');
        const monthsShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const monthsLong  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        return format === 'long'
          ? `${day} ${monthsLong[d.getMonth()]} ${d.getFullYear()}`
          : `${day} ${monthsShort[d.getMonth()]} ${d.getFullYear()}`;
      }
      return String(raw);
    } catch (_) {
      return raw ? String(raw) : 'N/A';
    }
  };
  // Keep legacy alias so other tabs that call formatEnrollDate still work
  const formatEnrollDate = (dStr, format = 'short') => formatDate(dStr, format);


  // Safe DOB formatter — avoids UTC shift via split/3-arg constructor
  const getDobWithAge = (rawDob) => {
    if (!rawDob) return null;
    try {
      const parts = String(rawDob).split('T')[0].split('-');
      if (parts.length !== 3) return String(rawDob);
      const dob = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      if (isNaN(dob.getTime())) return String(rawDob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      if (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate())) age--;
      const day = String(dob.getDate()).padStart(2, '0');
      const monthsLong = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      return `${day} ${monthsLong[dob.getMonth()]} ${dob.getFullYear()} (Age: ${age})`;
    } catch (_) {
      return rawDob ? String(rawDob) : null;
    }
  };


  const studentFees = data.studentFees.filter((f) => f.studentId === student.id);
  const studentDiscipline = data.disciplineRecords.filter((d) => d.studentId === student.id);
  const studentDocs = data.documents.filter((d) => d.studentId === student.id);

  const parentShareLink = `${window.location.origin}/student-summary/${student.id}`;

  const handleCopyParentLink = () => {
    navigator.clipboard.writeText(parentShareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleConfirmLink = (e) => {
    e.preventDefault();
    if (!selectedUserAccountId) return;
    linkStudentAccount(student.id, selectedUserAccountId);
    setShowLinkModal(false);
  };

  const ghostBtnStyle = {
    padding: '7px 14px',
    background: 'transparent',
    border: '1.5px solid rgba(255,255,255,0.25)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.75)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: "'Inter', sans-serif"
  };

  const disciplineCount = React.useMemo(() => {
    return (safeLS('pba_discipline', []) || [])
      .filter(r => (r.studentId || '').toString() === studentIdStr)
      .length;
  }, [studentIdStr, disciplineRefresh]);

  const docsCount =
    (safeLS('pba_student_documents', []) || []).filter(d => (d.studentId || d.regNo || '').toString() === studentIdStr).length
    || (safeLS('pba_documents', []) || []).filter(d => (d.studentId || d.regNo || '').toString() === studentIdStr).length
    || studentDocs.length;

  const drawerTabs = [
    { id: "overview", label: "👤 Overview" },
    { id: "attendance", label: "📅 Attendance" },
    { id: "subjects", label: "📚 Subjects" },
    { id: "marks", label: "📝 Marks & Grades" },
    { id: "discipline", label: "⚠️ Discipline", count: disciplineCount },
    { id: "fees", label: "💳 Fees Ledger" },
    { id: "documents", label: "📁 Documents", count: docsCount },
    { id: "report", label: "📄 Report Card" }
  ];

  const isMobileState = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const isNarrowDrawer = isMobileState || (typeof window !== 'undefined' && window.innerWidth < 640);

  const rawStatus = (student?.status || 'Active').trim();
  const statusLower = rawStatus.toLowerCase();
  const heroStatusBg = statusLower === 'withdrawn' ? '#EF4444' : statusLower === 'completed' ? '#6B7280' : '#22C55E';
  const heroStatusText = statusLower === 'withdrawn' ? 'Withdrawn' : statusLower === 'completed' ? 'Completed' : 'Active';

  const acadPillBg = statusLower === 'withdrawn' ? '#FEE2E2' : statusLower === 'completed' ? '#F3F4F6' : '#D1FAE5';
  const acadPillColor = statusLower === 'withdrawn' ? '#991B1B' : statusLower === 'completed' ? '#374151' : '#065F46';

  const parseDate3Arg = (str) => {
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m - 1, d);
    }
    return null;
  };

  return (
    <>
      {/* BACKDROP (behind drawer, closes on click) */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1000
        }}
      />

      {/* PANEL (the drawer itself) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '560px',
          maxWidth: '95vw',
          height: '100vh',
          background: '#F9FAFB',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
          overflow: 'hidden'
        }}
      >
        {/* PART 2 — HEADER STRIP (compact, always visible at top) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
            padding: '16px 20px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}
        >
          {/* LEFT — Initials avatar */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: 'white',
              fontSize: 17,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {getInitials(student.name)}
          </div>

          {/* CENTRE (flex 1) */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {student.name}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {student.regNo || student.id || 'No Reg No'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {(enrolledBatches[0]?.name || resolveBatchName(student.batch || student.batchId || student.batchName) || student.batch || 'No batch')}
              {` · ${student?.branch || student?.branchName || 'Main'}`}
            </div>
          </div>

          {/* RIGHT — two items stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
            {/* Status pill */}
            <div
              style={{
                background: heroStatusBg,
                color: 'white',
                borderRadius: 20,
                padding: '3px 12px',
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 6
              }}
            >
              {heroStatusText}
            </div>

            {/* Row with Actions & Close button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {currentUser.role === "Admin" && (
                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  title="Link Student Account"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: 'white',
                    borderRadius: 8,
                    padding: '5px 8px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Link size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyParentLink}
                title={copiedLink ? "Link Copied!" : "Copy Parent Link"}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'white',
                  borderRadius: 8,
                  padding: '5px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Share2 size={13} />
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Close drawer"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'white',
                  borderRadius: 8,
                  padding: '5px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* PART 3 — TAB BAR (sticky, below header) */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'white',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            overflowX: 'auto',
            padding: '0 16px',
            flexShrink: 0
          }}
        >
          {drawerTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  color: isActive ? '#2563EB' : '#6B7280',
                  borderBottom: isActive ? '2px solid #2563EB' : '2px solid transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    style={{
                      background: isActive ? '#DBEAFE' : '#E5E7EB',
                      color: isActive ? '#1D4ED8' : '#4B5563',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 10
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* PART 4 — TAB CONTENT AREA (scrollable body) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px'
          }}
        >
          {/* OVERVIEW */}
          {activeTab === "overview" && (() => {
            // ── Enroll date fallback chain ──
            const rawEnrollDate =
              student?.enrollmentDate ||
              student?.enrolledDate ||
              student?.enrollDate ||
              student?.dateEnrolled ||
              student?.startDate ||
              student?.admissionDate ||
              student?.createdAt ||
              null;

            // ── Personal info variants ──
            const studentBranch =
              student?.branch || student?.branchName || student?.campus || '';

            const studentDOB =
              student?.dateOfBirth || student?.dob || student?.birthDate ||
              student?.birthdate || student?.birthday || null;

            const studentEmail =
              student?.email || student?.emailAddress ||
              student?.studentEmail || '';

            const studentPhone =
              student?.phone || student?.studentPhone ||
              student?.phoneNo || student?.mobile || student?.mobileNo || '';

            const parentPhone =
              student?.parentPhone || student?.guardianPhone ||
              student?.parentMobile || student?.motherPhone ||
              student?.fatherPhone || '';

            const dobDisplay = getDobWithAge(studentDOB);
            const enrolledDateFormatted = formatDate(rawEnrollDate, 'short');

            const personalFields = [
              { icon: '📍', label: 'Branch',         value: studentBranch || '' },
              { icon: '🎂', label: 'Date of Birth',  value: dobDisplay || '' },
              { icon: '📱', label: 'Student Phone',  value: studentPhone || '' },
              { icon: '📱', label: 'Parent Phone',   value: parentPhone || '' },
              { icon: '✉️', label: 'Email',          value: studentEmail || '' },
              { icon: '📅', label: 'Enrolled',       value: rawEnrollDate ? enrolledDateFormatted : '' }
            ].filter(f => f.value && String(f.value).trim() !== '');

            return (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* ── SECTION 2 — Personal Information card ── */}
                <div style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>👤</span>
                    <span>PERSONAL INFORMATION</span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isNarrowDrawer ? '1fr' : '1fr 1fr',
                    columnGap: '24px',
                    rowGap: '2px'
                  }}>
                    {personalFields.map((field) => (
                      <div
                        key={field.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '6px 0',
                          borderBottom: '1px solid #F9FAFB'
                        }}
                      >
                        <span style={{
                          fontSize: '13px',
                          width: '18px',
                          textAlign: 'center',
                          color: '#9CA3AF',
                          flexShrink: 0
                        }}>
                          {field.icon}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: '#6B7280',
                          fontWeight: 500,
                          width: '100px',
                          flexShrink: 0
                        }}>
                          {field.label}
                        </span>
                        <span style={{
                          fontSize: '13px',
                          color: '#111827',
                          fontWeight: 500,
                          wordBreak: 'break-word'
                        }}>
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── SECTION 3 — Academic Status + Enrolled Batches (side by side) ── */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isNarrowDrawer ? '1fr' : '1fr 1fr',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  {/* Academic Status card (left) */}
                  <div style={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '16px 20px'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>🎓</span>
                      <span>ACADEMIC STATUS</span>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                      <span style={{
                        background: acadPillBg,
                        color: acadPillColor,
                        borderRadius: '20px',
                        padding: '4px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'inline-block'
                      }}>
                        {heroStatusText}
                      </span>
                    </div>

                    {/* Stream row ABOVE Admin Notes */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{
                        display: 'block', fontSize: 11, fontWeight: 700,
                        color: '#6B7280', textTransform: 'uppercase',
                        letterSpacing: '0.5px', marginBottom: 6
                      }}>Stream</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select
                          value={streamValue}
                          onChange={e => setStreamValue(e.target.value)}
                          style={{
                            flex: 1, padding: '8px 10px',
                            border: '1px solid #D1D5DB', borderRadius: 8,
                            fontSize: 13, color: streamValue ? '#111827' : '#9CA3AF',
                            background: 'white'
                          }}
                        >
                          <option value="">— No stream assigned —</option>
                          <option value="Science">Science</option>
                          <option value="Biology Science">Biology Science</option>
                          <option value="Physical Science">Physical Science</option>
                          <option value="Arts">Arts</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Technology">Technology</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Other">Other</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => saveStream(streamValue)}
                          style={{
                            padding: '8px 14px',
                            background: '#2563EB', color: 'white',
                            border: 'none', borderRadius: 8,
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >Save</button>
                      </div>
                      {streamValue && (
                        <button
                          type="button"
                          onClick={() => saveStream('')}
                          style={{
                            marginTop: 4, background: 'none', border: 'none',
                            fontSize: 11, color: '#9CA3AF', cursor: 'pointer',
                            padding: 0, textDecoration: 'underline'
                          }}
                        >Clear stream</button>
                      )}
                    </div>

                    <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500, marginBottom: '4px' }}>
                      Admin Notes
                    </div>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      onBlur={handleSaveAdminNotes}
                      placeholder="Add confidential academic or administrative notes..."
                      style={{
                        width: '100%',
                        minHeight: '70px',
                        padding: '8px 10px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#111827',
                        resize: 'vertical',
                        background: '#F9FAFB',
                        boxSizing: 'border-box',
                        fontFamily: "'Inter', sans-serif"
                      }}
                    />
                  </div>

                  {/* Enrolled Batches card (right) */}
                  <div style={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '16px 20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #F3F4F6'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>📚</span>
                        <span>ENROLLED BATCHES</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEnrollBatchId("");
                          setEnrollStream("");
                          setEnrollSelectedSubjects([]);
                          setShowSingleEnrollModal(true);
                        }}
                        style={{
                          background: '#2563EB',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        + Enroll
                      </button>
                    </div>

                    {enrolledBatches.length === 0 ? (
                      <div style={{
                        fontSize: '12px',
                        color: '#9CA3AF',
                        textAlign: 'center',
                        padding: '12px 0'
                      }}>
                        No batches enrolled
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {enrolledBatches.map(b => (
                          <div
                            key={b.id || b.name}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              borderRadius: 20,
                              padding: '3px 10px',
                              fontSize: 11,
                              fontWeight: 500,
                              margin: '3px 3px 3px 0'
                            }}
                          >
                            <span>{b.name}</span>
                            <span
                              onClick={() => handleUnenrollBatch(b.id || b.name)}
                              style={{
                                cursor: 'pointer',
                                color: '#93C5FD',
                                fontWeight: 700,
                                fontSize: 13,
                                lineHeight: 1,
                                marginLeft: 2
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = '#93C5FD'; }}
                            >
                              ×
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── SECTION 4 — Quick Stats bar (compact 4-tile row) ── */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isNarrowDrawer ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: '8px'
                }}>
                  {/* Tile 1: Enrolled */}
                  <div style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>📅</div>
                    <div style={{
                      fontSize: '10px',
                      color: '#6B7280',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px'
                    }}>
                      ENROLLED
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                      {rawEnrollDate ? formatDate(rawEnrollDate, 'short') : 'N/A'}
                    </div>
                  </div>

                  {/* Tile 2: Batches */}
                  <div style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>📚</div>
                    <div style={{
                      fontSize: '10px',
                      color: '#6B7280',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px'
                    }}>
                      BATCHES
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                      {enrolledBatches.length}
                    </div>
                  </div>

                  {/* Tile 3: Documents */}
                  <div style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>📄</div>
                    <div style={{
                      fontSize: '10px',
                      color: '#6B7280',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px'
                    }}>
                      DOCUMENTS
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                      {(safeLS('pba_student_documents', []) || []).filter(d => (d.studentId || d.regNo || '').toString() === studentIdStr).length
                        || (safeLS('pba_documents', []) || []).filter(d => (d.studentId || d.regNo || '').toString() === studentIdStr).length
                        || studentDocs.length}
                    </div>
                  </div>

                  {/* Tile 4: Discipline */}
                  <div style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>⚠️</div>
                    <div style={{
                      fontSize: '10px',
                      color: '#6B7280',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px'
                    }}>
                      DISCIPLINE
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                      {disciplineCount}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ATTENDANCE */}
          {activeTab === "attendance" && (() => {
            const attendanceList = (safeLS('pba_attendance', []) || [])
              .filter(r => (r.studentId || r.regNo || '').toString() === studentIdStr);

            const sortedAttendance = [...attendanceList].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

            const totalSessions = sortedAttendance.length;
            const presentCount = sortedAttendance.filter(r => {
              const st = (r.status || '').toLowerCase();
              return st === 'present';
            }).length;
            const absentCount = sortedAttendance.filter(r => {
              const st = (r.status || '').toLowerCase();
              return st === 'absent';
            }).length;

            const rateVal = totalSessions > 0 ? ((presentCount / totalSessions) * 100).toFixed(0) : "0";
            const rateNum = Number(rateVal);
            const rateColor = rateNum >= 80 ? '#059669' : rateNum >= 60 ? '#D97706' : '#DC2626';

            const statTileStyle = {
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              padding: '12px',
              textAlign: 'center'
            };

            const getStatusChip = (status) => {
              const st = (status || '').toLowerCase();
              if (st === 'present') {
                return { bg: '#D1FAE5', color: '#065F46', text: 'Present' };
              }
              if (st === 'absent') {
                return { bg: '#FEE2E2', color: '#991B1B', text: 'Absent' };
              }
              return { bg: '#FEF3C7', color: '#92400E', text: status || 'Late' };
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 4 Stat Tiles */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8
                }}>
                  {/* Tile 1: TOTAL SESSIONS */}
                  <div style={statTileStyle}>
                    <div style={{ fontSize: 16, marginBottom: 2 }}>📅</div>
                    <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      TOTAL SESSIONS
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginTop: 2 }}>
                      {totalSessions}
                    </div>
                  </div>

                  {/* Tile 2: PRESENT */}
                  <div style={statTileStyle}>
                    <div style={{ fontSize: 16, marginBottom: 2 }}>✅</div>
                    <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      PRESENT
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#065F46', marginTop: 2 }}>
                      {presentCount}
                    </div>
                  </div>

                  {/* Tile 3: ABSENT */}
                  <div style={statTileStyle}>
                    <div style={{ fontSize: 16, marginBottom: 2 }}>❌</div>
                    <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      ABSENT
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#991B1B', marginTop: 2 }}>
                      {absentCount}
                    </div>
                  </div>

                  {/* Tile 4: RATE */}
                  <div style={statTileStyle}>
                    <div style={{ fontSize: 16, marginBottom: 2 }}>📊</div>
                    <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      RATE
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: rateColor, marginTop: 2 }}>
                      {rateVal}%
                    </div>
                  </div>
                </div>

                {/* Attendance Log Table Card */}
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 2fr 1fr',
                    padding: '10px 16px',
                    background: '#F9FAFB',
                    borderBottom: '1px solid #E5E7EB',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px'
                  }}>
                    <div>DATE</div>
                    <div>SESSION / SUBJECT</div>
                    <div style={{ textAlign: 'right' }}>STATUS</div>
                  </div>

                  {sortedAttendance.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: 13 }}>
                      No attendance records yet
                    </div>
                  ) : (
                    <div>
                      {sortedAttendance.map((r, idx) => {
                        const chip = getStatusChip(r.status);
                        return (
                          <div
                            key={r.id || idx}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.2fr 2fr 1fr',
                              alignItems: 'center',
                              padding: '10px 16px',
                              borderBottom: idx === sortedAttendance.length - 1 ? 'none' : '1px solid #F3F4F6',
                              fontSize: 13,
                              color: '#111827'
                            }}
                          >
                            <div style={{ fontWeight: 500, fontSize: 12 }}>{r.date || '—'}</div>
                            <div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.subjectName || r.subject || r.session || r.batchName || 'General Session'}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span
                                style={{
                                  background: chip.bg,
                                  color: chip.color,
                                  borderRadius: 20,
                                  padding: '2px 10px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  display: 'inline-block'
                                }}
                              >
                                {chip.text}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* SUBJECTS */}
          {activeTab === "subjects" && (() => {
            const subjectList = (() => {
              const set = new Set();
              if (Array.isArray(student.subjects)) {
                student.subjects.forEach(s => {
                  if (typeof s === 'string') set.add(s);
                  else if (s && (s.name || s.subjectName)) set.add(s.name || s.subjectName);
                });
              }
              if (Array.isArray(student.enrolledSubjects)) {
                student.enrolledSubjects.forEach(s => {
                  if (typeof s === 'string') set.add(s);
                  else if (s && (s.name || s.subjectName)) set.add(s.name || s.subjectName);
                });
              }
              enrolledBatches.forEach(b => {
                (b.batchSubjects || []).forEach(bs => {
                  if (bs.name || bs.subjectName) set.add(bs.name || bs.subjectName);
                });
              });
              return Array.from(set).filter(Boolean);
            })();

            const streamName = student?.stream || student?.streamName;

            return (
              <div style={{
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: 20
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: '1px solid #F3F4F6'
                }}>
                  📚 ENROLLED SUBJECTS
                </div>

                {subjectList.length === 0 ? (
                  <div style={{ color: '#9CA3AF', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
                    No subjects enrolled
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {subjectList.map((sb, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          border: '1px solid #BFDBFE',
                          borderRadius: 20,
                          padding: '5px 14px',
                          fontSize: 12,
                          fontWeight: 600,
                          margin: '4px 4px 4px 0'
                        }}
                      >
                        📖 {sb}
                      </span>
                    ))}
                  </div>
                )}

                {streamName && (
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 12, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                    Stream: <strong style={{ color: '#111827' }}>{streamName}</strong>
                  </div>
                )}
              </div>
            );
          })()}

          {/* MARKS & GRADES */}
          {activeTab === "marks" && (() => {
            const allStoredMarks = safeLS('pba_marks', []) || [];
            const allExams = data.exams || [];
            const list = [];

            allStoredMarks
              .filter(m => (m.studentId || '').toString() === studentIdStr || (student.regNo && m.studentId === student.regNo))
              .forEach(m => {
                const exam = allExams.find(e => e.id === m.examId) || {};
                const total = Number(m.totalMarks || exam.totalMarks || 100);
                const score = Number(m.marksObtained ?? m.rawScore ?? 0);
                const pct = m.percentage !== undefined ? Math.round(Number(m.percentage)) : Math.round((score / total) * 100);
                const gr = m.grade || calcGrade(score, total);
                list.push({
                  id: m.id || `${m.examId}-${studentIdStr}`,
                  examName: exam.name || m.examName || 'Assessment Exam',
                  subject: m.subject || exam.subject || 'General Subject',
                  marks: `${score} / ${total}`,
                  percentage: Math.min(100, Math.max(0, pct)),
                  grade: gr
                });
              });

            allExams.forEach(ex => {
              if (list.some(item => item.examName === ex.name)) return;
              const res = (ex.results || []).find(r => (r.studentId || '').toString() === studentIdStr || (student.regNo && r.studentId === student.regNo));
              if (res) {
                const total = Number(ex.totalMarks || 100);
                const score = Number(res.marks ?? 0);
                const pct = Math.round((score / total) * 100);
                const gr = res.grade || calcGrade(score, total);
                list.push({
                  id: `${ex.id}-${studentIdStr}`,
                  examName: ex.name,
                  subject: ex.subject || 'General Subject',
                  marks: `${score} / ${total}`,
                  percentage: Math.min(100, Math.max(0, pct)),
                  grade: gr
                });
              }
            });

            const getGradeChipStyle = (grade) => {
              const g = (grade || '').toUpperCase();
              if (g.startsWith('A')) return { background: '#D1FAE5', color: '#065F46' };
              if (g.startsWith('B')) return { background: '#DBEAFE', color: '#1D4ED8' };
              if (g.startsWith('C')) return { background: '#FEF3C7', color: '#92400E' };
              return { background: '#FEE2E2', color: '#991B1B' };
            };

            const getBarColor = (pct) => {
              if (pct >= 75) return '#22C55E';
              if (pct >= 50) return '#F59E0B';
              return '#EF4444';
            };

            return (
              <div style={{
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr',
                  background: '#F9FAFB',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  padding: '10px 16px',
                  borderBottom: '1px solid #E5E7EB'
                }}>
                  <div>EXAM</div>
                  <div>SUBJECT</div>
                  <div>MARKS</div>
                  <div>%</div>
                  <div style={{ textAlign: 'right' }}>GRADE</div>
                </div>

                {list.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: 13 }}>
                    No marks recorded yet
                  </div>
                ) : (
                  <div>
                    {list.map((item, idx) => {
                      const grStyle = getGradeChipStyle(item.grade);
                      const barColor = getBarColor(item.percentage);
                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr',
                            alignItems: 'center',
                            padding: '10px 16px',
                            borderBottom: idx === list.length - 1 ? 'none' : '1px solid #F3F4F6',
                            fontSize: 13,
                            color: '#111827'
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.examName}
                          </div>
                          <div style={{ fontSize: 12, color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.subject}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>
                            {item.marks}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{item.percentage}%</div>
                            <div style={{
                              height: 3,
                              borderRadius: 4,
                              marginTop: 3,
                              background: '#E5E7EB',
                              width: '80px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${item.percentage}%`,
                                height: '100%',
                                background: barColor,
                                borderRadius: 4
                              }} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              ...grStyle,
                              borderRadius: 20,
                              padding: '2px 10px',
                              fontSize: 11,
                              fontWeight: 700,
                              display: 'inline-block'
                            }}>
                              {item.grade}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* DISCIPLINE */}
          {activeTab === "discipline" && (() => {
            const disciplineRecords = (safeLS('pba_discipline', []) || [])
              .filter(r => (r.studentId || '').toString() === studentIdStr)
              .sort((a, b) => (b.date || '').localeCompare(a.date || '')); // newest first

            const formatDisciplineDate = (dateStr) => {
              if (!dateStr) return '—';
              try {
                const parts = String(dateStr).split('T')[0].split('-');
                if (parts.length === 3) {
                  const y = parseInt(parts[0], 10);
                  const m = parseInt(parts[1], 10) - 1;
                  const d = parseInt(parts[2], 10);
                  const dt = new Date(y, m, d);
                  if (!isNaN(dt.getTime())) {
                    const day = String(dt.getDate()).padStart(2, '0');
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    return `${day} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
                  }
                }
                return dateStr;
              } catch {
                return dateStr;
              }
            };

            const getSeverityStyle = (severity) => {
              const sev = (severity || '').trim();
              if (sev === 'Suspension') {
                return { bg: '#FEE2E2', text: '#991B1B' };
              }
              if (sev === 'Warning') {
                return { bg: '#FEF3C7', text: '#92400E' };
              }
              return { bg: '#F3F4F6', text: '#374151' };
            };

            return (
              <div>
                {/* SECTION A — Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 16
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#6B7280',
                    textTransform: 'uppercase', letterSpacing: '0.6px'
                  }}>
                    ⚠ Discipline Records
                  </div>
                  <button
                    onClick={() => openDisciplineModal(null)}
                    style={{
                      background: '#DC2626', color: 'white',
                      border: 'none', borderRadius: 8,
                      padding: '7px 14px', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Add Record
                  </button>
                </div>

                {/* SECTION B — Table Card */}
                <div style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1.4fr 2.4fr 1.2fr 1.2fr',
                    background: '#F9FAFB',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    padding: '10px 16px',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    <div>DATE</div>
                    <div>TYPE</div>
                    <div>DESCRIPTION</div>
                    <div>SEVERITY</div>
                    <div style={{ textAlign: 'right' }}>ACTIONS</div>
                  </div>

                  {disciplineRecords.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '32px',
                      color: '#9CA3AF', fontSize: 13
                    }}>
                      No discipline records for this student
                    </div>
                  ) : (
                    <div>
                      {disciplineRecords.map((record, idx) => {
                        const sevStyle = getSeverityStyle(record.severity);
                        return (
                          <div
                            key={record.id || idx}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.2fr 1.4fr 2.4fr 1.2fr 1.2fr',
                              alignItems: 'center',
                              padding: '12px 16px',
                              borderBottom: idx === disciplineRecords.length - 1 ? 'none' : '1px solid #F9FAFB',
                              fontSize: 13,
                              color: '#111827',
                              verticalAlign: 'top'
                            }}
                          >
                            <div style={{ fontSize: 13, color: '#374151' }}>
                              {formatDisciplineDate(record.date)}
                            </div>
                            <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                              {record.type || 'Other'}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: '#6B7280',
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={record.description}
                            >
                              {record.description || '—'}
                            </div>
                            <div>
                              <span style={{
                                background: sevStyle.bg,
                                color: sevStyle.text,
                                borderRadius: 20,
                                padding: '2px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                display: 'inline-block'
                              }}>
                                {record.severity || 'Note'}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                onClick={() => openDisciplineModal(record)}
                                style={{
                                  background: '#F3F4F6',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: 6,
                                  padding: '4px 8px',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  color: '#374151',
                                  marginRight: 4
                                }}
                              >
                                ✏ Edit
                              </button>
                              <button
                                onClick={() => deleteDisciplineRecord(record.id)}
                                style={{
                                  background: '#FEF2F2',
                                  border: '1px solid #FECACA',
                                  borderRadius: 6,
                                  padding: '4px 8px',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  color: '#DC2626'
                                }}
                              >
                                🗑 Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* FEES LEDGER */}
          {activeTab === "fees" && (() => {
            const storedLedger = (safeLS('pba_fee_ledger', []) || [])
              .filter(e => (e.studentId || e.regNo || '').toString() === studentIdStr || (student.regNo && (e.studentId || e.regNo) === student.regNo));

            const allFeeEntries = storedLedger.length > 0 ? storedLedger : studentFees.map(f => ({
              id: f.id,
              description: f.description,
              batchName: student.batch || 'Main Batch',
              dueDate: f.dueDate,
              amount: f.amountDue,
              amountPaid: f.amountPaid || 0,
              balance: Math.max(0, (f.amountDue || 0) - (f.amountPaid || 0)),
              status: f.status
            }));

            const getStatusChip = (st) => {
              const s = (st || '').toLowerCase();
              if (s === 'paid') return { bg: '#D1FAE5', color: '#065F46', text: 'Paid', bold: false };
              if (s === 'partial') return { bg: '#FEF3C7', color: '#92400E', text: 'Partial', bold: false };
              if (s === 'overdue') return { bg: '#FEE2E2', color: '#991B1B', text: 'Overdue', bold: true };
              return { bg: '#FEE2E2', color: '#991B1B', text: st || 'Unpaid', bold: false };
            };

            return (
              <div style={{
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr 1fr 1fr',
                  background: '#F9FAFB',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  padding: '10px 14px',
                  borderBottom: '1px solid #E5E7EB'
                }}>
                  <div>DESCRIPTION</div>
                  <div>BATCH</div>
                  <div>DUE DATE</div>
                  <div>AMOUNT</div>
                  <div>PAID</div>
                  <div>BALANCE</div>
                  <div style={{ textAlign: 'right' }}>STATUS</div>
                </div>

                {allFeeEntries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9CA3AF', fontSize: 13, lineHeight: 1.5 }}>
                    No fee ledger entries yet. Add a fee structure to this student's batch to generate entries.
                  </div>
                ) : (
                  <div>
                    {allFeeEntries.map((e, idx) => {
                      const chip = getStatusChip(e.status);
                      const amt = Number(e.amount || e.amountDue || 0);
                      const paid = Number(e.amountPaid || 0);
                      const bal = Number(e.balance ?? Math.max(0, amt - paid));
                      return (
                        <div
                          key={e.id || idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr 1fr 1fr',
                            alignItems: 'center',
                            padding: '10px 14px',
                            borderBottom: idx === allFeeEntries.length - 1 ? 'none' : '1px solid #F3F4F6',
                            fontSize: 12,
                            color: '#111827'
                          }}
                        >
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.description || e.feeStructureName || 'Fee Instalment'}
                          </div>
                          <div style={{ color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.batchName || e.batch || '—'}
                          </div>
                          <div style={{ color: '#6B7280' }}>
                            {e.dueDate || '—'}
                          </div>
                          <div style={{ fontWeight: 500 }}>
                            {amt.toLocaleString()}
                          </div>
                          <div style={{ color: '#059669', fontWeight: 500 }}>
                            {paid.toLocaleString()}
                          </div>
                          <div style={{ color: bal > 0 ? '#DC2626' : '#6B7280', fontWeight: 600 }}>
                            {bal.toLocaleString()}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              background: chip.bg,
                              color: chip.color,
                              borderRadius: 20,
                              padding: '2px 8px',
                              fontSize: 10,
                              fontWeight: chip.bold ? 700 : 600,
                              display: 'inline-block'
                            }}>
                              {chip.text}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* DOCUMENTS */}
          {activeTab === "documents" && (() => {
            const storedDocs = (safeLS('pba_student_documents', []) || []).filter(d => (d.studentId || d.regNo || '').toString() === studentIdStr);
            const fallbackDocs = (safeLS('pba_documents', []) || []).filter(d => (d.studentId || d.regNo || '').toString() === studentIdStr);
            const allDocs = storedDocs.length > 0 ? storedDocs : fallbackDocs.length > 0 ? fallbackDocs : studentDocs;

            return (
              <div style={{
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  background: '#F9FAFB',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  padding: '10px 16px',
                  borderBottom: '1px solid #E5E7EB'
                }}>
                  <div>DOCUMENT TITLE</div>
                  <div>TYPE</div>
                  <div style={{ textAlign: 'right' }}>UPLOAD DATE</div>
                </div>

                {allDocs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: 13 }}>
                    No documents uploaded
                  </div>
                ) : (
                  <div>
                    {allDocs.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr',
                          alignItems: 'center',
                          padding: '10px 16px',
                          borderBottom: idx === allDocs.length - 1 ? 'none' : '1px solid #F3F4F6',
                          fontSize: 13,
                          color: '#111827'
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 12 }}>
                          📄 {doc.title || doc.name || 'Document'}
                        </div>
                        <div>
                          <span style={{
                            background: '#F3F4F6',
                            color: '#4B5563',
                            borderRadius: 16,
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 500
                          }}>
                            {doc.type || 'General'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 12, color: '#6B7280' }}>
                          {doc.uploadDate || doc.date || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* REPORT CARD */}
          {activeTab === "report" && (
            <div className="report-card-print-container">
              {/* PRINT STYLE INJECTION */}
              <style>{`
                @media print {
                  body * { visibility: hidden !important; }
                  .report-card-print-container, .report-card-print-container * { visibility: visible !important; }
                  .report-card-print-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 20px !important; background: #FFFFFF !important; }
                  .no-print { display: none !important; }
                  .subject-card { page-break-inside: avoid !important; margin-bottom: 20px !important; }
                }
              `}</style>

              {/* REPORT CARD HEADER */}
              <div style={{
                background: 'linear-gradient(135deg, #1C1F26, #2B4A7A)',
                borderRadius: '12px', padding: '20px 24px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
                    Platinum Business Academy
                  </div>
                  <div style={{ fontSize: '12px', color: '#90CDF4', marginTop: '2px' }}>
                    Student Academic Report Card
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#E2E8F0' }}>Student: <strong style={{color:'#FFFFFF'}}>{student.name}</strong></div>
                  <div style={{ fontSize: '12px', color: '#E2E8F0' }}>Batch: {student.batch}</div>
                  <div style={{ fontSize: '12px', color: '#E2E8F0' }}>Branch: {student.branch}</div>
                  <div style={{ fontSize: '12px', color: '#CBD5E0' }}>Generated: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* CONTROLS ROW (DATE FILTERS & PRINT BUTTON) */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#F8F9FB', padding: '10px 16px', borderRadius: '8px', border: '1px solid #E3E6EA' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#4A5568' }}>Show exams from</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '12px' }}
                  />
                  <label style={{ fontSize: '12px', color: '#718096' }}>to</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '12px' }}
                  />
                  <button
                    type="button"
                    onClick={() => { setFromDate(''); setToDate(''); }}
                    style={{ padding: '5px 12px', background: '#FFFFFF', border: '1px solid #CBD5E0', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#4A5568', cursor: 'pointer' }}
                  >
                    All Time
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #D4A017, #B7860A)',
                    color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 2px 8px rgba(212,160,23,0.35)', fontFamily: "'Inter',sans-serif"
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Print Report Card
                </button>
              </div>

              {/* OVERALL SUMMARY CARD */}
              {(() => {
                const allStoredMarks = (() => {
                  try {
                    const saved = localStorage.getItem("pba_marks");
                    return saved ? JSON.parse(saved) : [];
                  } catch (e) { return []; }
                })();

                const allExams = data.exams || [];
                const filteredExams = allExams.filter((ex) => {
                  if (ex.batch !== "All" && ex.batch !== student.batch) return false;
                  if (fromDate && parseDate3Arg(ex.date) && parseDate3Arg(fromDate) && parseDate3Arg(ex.date) < parseDate3Arg(fromDate)) return false;
                  if (toDate && parseDate3Arg(ex.date) && parseDate3Arg(toDate) && parseDate3Arg(ex.date) > parseDate3Arg(toDate)) return false;
                  return true;
                });

                let totalMarksPctSum = 0;
                let validExamCount = 0;
                let totalExamsTaken = 0;

                filteredExams.forEach((ex) => {
                  const mObj = allStoredMarks.find((m) => m.examId === ex.id && m.studentId === student.id);
                  const legacy = (ex.results || []).find((r) => r.studentId === student.id);
                  const isAbs = mObj ? !!mObj.isAbsent : false;
                  const score = mObj ? mObj.marksObtained : (legacy ? legacy.marks : null);

                  if (score !== null && score !== undefined && !isAbs) {
                    const pct = (score / ex.totalMarks) * 100;
                    totalMarksPctSum += pct;
                    validExamCount++;
                    totalExamsTaken++;
                  }
                });

                const overallAvg = validExamCount > 0 ? Math.round(totalMarksPctSum / validExamCount) : 0;
                const overallGrade = calcGrade(overallAvg, 100);
                const gc = gradeColor(overallGrade);

                // Enrolled subjects list
                const enrolledSubjects = (data.subjects || []).filter((subj) => {
                  if (Array.isArray(student.subjects) && student.subjects.includes(subj.name)) return true;
                  const stSubjs = (data.studentSubjects || []).filter((ss) => ss.studentId === student.id);
                  if (stSubjs.some((ss) => ss.subjectId === subj.id)) return true;
                  return true; // Fallback to all institute subjects if no specific enrollment mapping
                });

                return (
                  <>
                    <div style={{
                      background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px',
                      padding: '18px 22px', marginBottom: '20px',
                      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px'
                    }}>
                      <div style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{ fontSize: '26px', fontWeight: 800, color: '#2B6CB0', fontFamily: "'Sora',sans-serif" }}>{overallAvg}%</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Overall Average</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{ fontSize: '26px', fontWeight: 800, color: gc.color, fontFamily: "'Sora',sans-serif" }}>{overallGrade}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Overall Grade</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{ fontSize: '26px', fontWeight: 800, color: '#2D3748', fontFamily: "'Sora',sans-serif" }}>{totalExamsTaken}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Total Exams Taken</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{ fontSize: '26px', fontWeight: 800, color: '#2F855A', fontFamily: "'Sora',sans-serif" }}>96%</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Attendance</div>
                      </div>
                    </div>

                    {/* PER-SUBJECT PERFORMANCE CARDS */}
                    {enrolledSubjects.map((subj) => {
                      const subjectColor = subj.color || '#2B6CB0';
                      const examsForSubject = filteredExams.filter((ex) => ex.subjectId === subj.id || ex.subject === subj.name);

                      let subjPctSum = 0;
                      let subjValidCount = 0;
                      let bestMarkPct = -1;
                      let bestMarkRaw = 0;
                      let bestTotalMarks = 100;
                      const scoreList = [];

                      examsForSubject.forEach((ex) => {
                        const mObj = allStoredMarks.find((m) => m.examId === ex.id && m.studentId === student.id);
                        const legacy = (ex.results || []).find((r) => r.studentId === student.id);
                        const isAbs = mObj ? !!mObj.isAbsent : false;
                        const score = mObj ? mObj.marksObtained : (legacy ? legacy.marks : null);

                        if (score !== null && score !== undefined && !isAbs) {
                          const pct = (score / ex.totalMarks) * 100;
                          subjPctSum += pct;
                          subjValidCount++;
                          scoreList.push(pct);
                          if (pct > bestMarkPct) {
                            bestMarkPct = pct;
                            bestMarkRaw = score;
                            bestTotalMarks = ex.totalMarks;
                          }
                        }
                      });

                      const subjectAvg = subjValidCount > 0 ? Math.round(subjPctSum / subjValidCount) : 0;
                      const subjectGrade = calcGrade(subjectAvg, 100);
                      const sgc = gradeColor(subjectGrade);

                      let trendText = "→ Stable";
                      let trendColor = "#718096";
                      if (scoreList.length >= 2) {
                        const latest = scoreList[scoreList.length - 1];
                        const prev = scoreList[scoreList.length - 2];
                        if (latest > prev) {
                          trendText = "↑ Improving";
                          trendColor = "#2F855A";
                        } else if (latest < prev) {
                          trendText = "↓ Declining";
                          trendColor = "#C53030";
                        }
                      }

                      return (
                        <div key={subj.id} className="subject-card" style={{
                          background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px',
                          overflow: 'hidden', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                        }}>
                          {/* Subject Card Header */}
                          <div style={{
                            padding: '12px 18px', borderBottom: '1px solid #F4F5F7',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: subjectColor + '10'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{
                                background: subjectColor + '20', color: subjectColor, fontSize: '11px', fontWeight: 800,
                                padding: '3px 10px', borderRadius: '20px', marginRight: '10px'
                              }}>
                                {subj.code}
                              </span>
                              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A202C' }}>
                                {subj.name}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '12px', color: '#718096', fontWeight: 600 }}>Subject Avg:</span>
                              <span style={{ fontSize: '18px', fontWeight: 800, color: subjectColor, fontFamily: "'Sora',sans-serif" }}>
                                {subjectAvg}%
                              </span>
                              <span style={{
                                background: sgc.bg, color: sgc.color, border: `1px solid ${sgc.border}`,
                                fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px'
                              }}>
                                {subjectGrade}
                              </span>
                            </div>
                          </div>

                          {/* Exam Table or Empty State */}
                          {examsForSubject.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#718096', fontSize: '13px' }}>
                              No results recorded yet for this subject.
                            </div>
                          ) : (
                            <div style={{ padding: '0' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ background: '#F8F9FB' }}>
                                    <th style={{ padding: '8px 18px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #E3E6EA' }}>Exam</th>
                                    <th style={{ padding: '8px 18px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #E3E6EA' }}>Type</th>
                                    <th style={{ padding: '8px 18px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #E3E6EA' }}>Date</th>
                                    <th style={{ padding: '8px 18px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #E3E6EA' }}>Marks</th>
                                    <th style={{ padding: '8px 18px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #E3E6EA' }}>Grade</th>
                                    <th style={{ padding: '8px 18px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #E3E6EA' }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {examsForSubject.map((exam, i) => {
                                    const mObj = allStoredMarks.find((m) => m.examId === exam.id && m.studentId === student.id);
                                    const legacy = (exam.results || []).find((r) => r.studentId === student.id);
                                    const isAbs = mObj ? !!mObj.isAbsent : false;
                                    const marksObtained = mObj ? mObj.marksObtained : (legacy ? legacy.marks : null);
                                    const eg = marksObtained !== null ? calcGrade(marksObtained, exam.totalMarks) : '—';
                                    const egc = gradeColor(eg);
                                    const passMark = exam.passMark || 50;

                                    return (
                                      <tr key={exam.id} style={{ borderBottom: '1px solid #F4F5F7', background: i % 2 === 0 ? '#FFFFFF' : '#FAFBFC' }}>
                                        <td style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 600, color: '#1A202C' }}>
                                          Exam #{exam.examNumber || (i + 1)}
                                        </td>
                                        <td style={{ padding: '10px 18px' }}>
                                          <span style={{ background: '#EBF4FF', color: '#2B6CB0', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
                                            {exam.type}
                                          </span>
                                        </td>
                                        <td style={{ padding: '10px 18px', fontSize: '12px', color: '#718096' }}>{exam.date}</td>
                                        <td style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 700, color: '#1A202C' }}>
                                          {isAbs ? '—' : `${marksObtained ?? '—'} / ${exam.totalMarks}`}
                                        </td>
                                        <td style={{ padding: '10px 18px' }}>
                                          <span style={{
                                            background: egc.bg, color: egc.color, border: `1px solid ${egc.border}`,
                                            fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px'
                                          }}>
                                            {eg}
                                          </span>
                                        </td>
                                        <td style={{ padding: '10px 18px' }}>
                                          {isAbs ? (
                                            <span style={{ background: '#F7FAFC', color: '#718096', border: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>Absent</span>
                                          ) : marksObtained !== null && marksObtained >= passMark ? (
                                            <span style={{ background: '#F0FFF4', color: '#2F855A', border: '1px solid #9AE6B4', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>Pass</span>
                                          ) : (
                                            <span style={{ background: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>Fail</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Subject Footer */}
                          {examsForSubject.length >= 2 && (
                            <div style={{ padding: '10px 18px', background: '#F8F9FB', borderTop: '1px solid #F4F5F7', fontSize: '12px', color: '#4A5568', display: 'flex', gap: '16px' }}>
                              <span>Best: <strong>{bestMarkRaw >= 0 ? `${bestMarkRaw}/${bestTotalMarks}` : '—'}</strong></span>
                              <span>Average: <strong>{subjectAvg}%</strong></span>
                              <span>Trend: <strong style={{ color: trendColor }}>{trendText}</strong></span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Link Account Modal */}
      {showLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(4px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 24px 64px rgba(0,0,0,0.20)', position: 'relative' }}>
            <button
              onClick={() => setShowLinkModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A202C', marginBottom: '16px' }}>
              Link Student Account Login
            </h3>
            <form onSubmit={handleConfirmLink}>
              <p style={{ fontSize: "13px", color: '#718096', marginBottom: "16px", lineHeight: 1.5 }}>
                Select a User Account with the Student role to connect to <strong>{student.name}</strong> ({student.regNo}).
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Select User Account
                </label>
                <select
                  value={selectedUserAccountId}
                  onChange={(e) => setSelectedUserAccountId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 36px 9px 13px',
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
                    backgroundPosition: 'right 12px center',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                >
                  {data.userAccounts
                    .filter((u) => u.role === "Student")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (username: {u.username})
                      </option>
                    ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F4F5F7' }}>
                <button type="button" style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #E3E6EA', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowLinkModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(43,108,176,0.30)' }}>
                  Link Student Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Card Modal Trigger */}
      {showReportCardModal && <ReportCardModal student={student} onClose={() => setShowReportCardModal(false)} />}

      {/* Enroll in Batch Modal for single student */}
      {showSingleEnrollModal && (() => {
        const studentEnrollments = safeLS('pba_batch_enrollments', []).filter(e => e.studentId === student.id && e.status === 'active');
        const availableBatches = safeLS('pba_batches', []).filter(b => !studentEnrollments.some(e => e.batchId === b.id));
        const selectedBatch = availableBatches.find(b => b.id === enrollBatchId);
        const batchSubjects = selectedBatch?.batchSubjects || [];
        const applicableSubjects = batchSubjects.filter(bs => {
          if (bs.isCompulsory || !bs.stream) return true;
          if (enrollStream) return bs.stream.toLowerCase() === enrollStream.toLowerCase();
          return true;
        });

        const handleSaveSingleEnroll = (e) => {
          e.preventDefault();
          if (!enrollBatchId) return;
          const newRecord = {
            id: 'enr-' + Date.now(),
            studentId: student.id,
            batchId: enrollBatchId,
            subjectIds: enrollSelectedSubjects,
            stream: enrollStream || null,
            enrolledAt: new Date().toISOString(),
            status: 'active'
          };
          const existing = safeLS('pba_batch_enrollments', []);
          saveLS('pba_batch_enrollments', [newRecord, ...existing]);

          // Also sync to pba_batches
          const allBatches = safeLS('pba_batches', []);
          const updatedBatches = (allBatches || []).map(b => {
            if (b.id !== enrollBatchId) return b;
            const alreadyIn = (b.students || []).some(
              s => (s.id || s.regNo) === student.id || (student.regNo && (s.id || s.regNo) === student.regNo)
            );
            if (alreadyIn) return b;
            return {
              ...b,
              students: [
                ...(b.students || []),
                {
                  id: student.id,
                  regNo: student.regNo || '',
                  name: student.name || '',
                  mobilePhone: student.mobilePhone || student.phone || '',
                  parentPhone: student.parentPhone || '',
                  status: 'active',
                  enrolledAt: new Date().toISOString()
                }
              ]
            };
          });
          saveLS('pba_batches', updatedBatches);
          setBatchRefresh(r => r + 1);

          setShowSingleEnrollModal(false);
        };

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "480px", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
              <button
                onClick={() => setShowSingleEnrollModal(false)}
                style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096" }}
              >
                ×
              </button>
              <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "16px", fontWeight: 700, color: "#1A202C", marginBottom: "4px" }}>
                Enroll in Batch
              </h3>
              <p style={{ fontSize: "12px", color: "#718096", marginBottom: "16px" }}>
                Student: <strong>{student.name}</strong> ({student.regNo})
              </p>

              <form onSubmit={handleSaveSingleEnroll}>
                {/* 1. Batch Dropdown */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", marginBottom: "4px" }}>
                    Select Batch
                  </label>
                  <select
                    required
                    value={enrollBatchId}
                    onChange={e => {
                      const bId = e.target.value;
                      setEnrollBatchId(bId);
                      const bObj = availableBatches.find(b => b.id === bId);
                      const bSubjs = bObj?.batchSubjects || [];
                      const compulsoryIds = bSubjs.filter(s => s.isCompulsory).map(s => s.id || s.subjectId);
                      setEnrollSelectedSubjects(compulsoryIds);
                    }}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #E3E6EA", fontSize: "13px" }}
                  >
                    <option value="">Select a batch...</option>
                    {availableBatches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Stream selector */}
                {enrollBatchId && (
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", marginBottom: "4px" }}>
                      Stream
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {[
                        { id: 'science', label: 'Science' },
                        { id: 'commerce', label: 'Commerce' },
                        { id: '', label: 'Unset' }
                      ].map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setEnrollStream(st.id)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "16px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: enrollStream === st.id ? "1.5px solid #2B6CB0" : "1px solid #E3E6EA",
                            background: enrollStream === st.id ? "#EBF4FF" : "#F7F8FA",
                            color: enrollStream === st.id ? "#2B6CB0" : "#718096"
                          }}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Subject checkboxes */}
                {enrollBatchId && (
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", marginBottom: "4px" }}>
                      Select Subjects
                    </label>
                    <div style={{ border: "1px solid #E3E6EA", borderRadius: "8px", maxHeight: "140px", overflowY: "auto", padding: "8px" }}>
                      {applicableSubjects.map(bs => {
                        const sId = bs.id || bs.subjectId;
                        const isChecked = enrollSelectedSubjects.includes(sId) || bs.isCompulsory;
                        return (
                          <label key={sId} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", cursor: bs.isCompulsory ? "default" : "pointer", fontSize: "12px" }}>
                            <input
                              type="checkbox"
                              disabled={bs.isCompulsory}
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) setEnrollSelectedSubjects([...enrollSelectedSubjects, sId]);
                                else setEnrollSelectedSubjects(enrollSelectedSubjects.filter(id => id !== sId));
                              }}
                            />
                            <span>{bs.subjectName || bs.name}</span>
                            {bs.isCompulsory && <span style={{ fontSize: "10px", color: "#718096", fontStyle: "italic" }}>(Compulsory)</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "12px", borderTop: "1px solid #F0F2F5" }}>
                  <button type="button" onClick={() => setShowSingleEnrollModal(false)} style={{ padding: "8px 14px", background: "#FFF", border: "1px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: "8px 18px", background: "linear-gradient(135deg, #2B6CB0, #1A4A8A)", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    Enroll
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
      {/* ── SECTION D: Discipline Add/Edit Modal ── */}
      {disciplineModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white', borderRadius: 16,
            padding: '28px 32px', width: 460,
            maxWidth: '92vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>

            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 24
            }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                {editingDiscipline ? 'Edit Record' : 'Add Discipline Record'}
              </h3>
              <button
                type="button"
                onClick={() => setDisciplineModal(false)}
                style={{
                  background: 'none', border: 'none',
                  fontSize: 22, cursor: 'pointer', color: '#6B7280'
                }}
              >×</button>
            </div>

            {/* Date */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: '#374151', marginBottom: 6
              }}>Date *</label>
              <input
                type="date"
                value={disciplineForm.date}
                onChange={e => setDisciplineForm(f => ({ ...f, date: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #D1D5DB', borderRadius: 8,
                  fontSize: 14, color: '#111827', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Type */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: '#374151', marginBottom: 6
              }}>Type *</label>
              <select
                value={disciplineForm.type}
                onChange={e => setDisciplineForm(f => ({ ...f, type: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #D1D5DB', borderRadius: 8,
                  fontSize: 14, color: '#111827', background: 'white', boxSizing: 'border-box'
                }}
              >
                <option>Tardiness</option>
                <option>Absence Without Leave</option>
                <option>Misconduct</option>
                <option>Disruptive Behaviour</option>
                <option>Academic Dishonesty</option>
                <option>Dress Code Violation</option>
                <option>Disrespect to Staff</option>
                <option>Property Damage</option>
                <option>Other</option>
              </select>
            </div>

            {/* Severity */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: '#374151', marginBottom: 8
              }}>Severity *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { v: 'Note',       bg: '#F3F4F6', border: '#E5E7EB', text: '#374151' },
                  { v: 'Warning',    bg: '#FEF3C7', border: '#FDE68A', text: '#92400E' },
                  { v: 'Suspension', bg: '#FEE2E2', border: '#FECACA', text: '#991B1B' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setDisciplineForm(f => ({ ...f, severity: opt.v }))}
                    style={{
                      flex: 1, padding: '8px 0',
                      background: disciplineForm.severity === opt.v ? opt.bg : 'white',
                      border: `2px solid ${disciplineForm.severity === opt.v ? opt.border : '#E5E7EB'}`,
                      borderRadius: 8,
                      fontSize: 13, fontWeight: 600,
                      color: disciplineForm.severity === opt.v ? opt.text : '#9CA3AF',
                      cursor: 'pointer'
                    }}
                  >{opt.v}</button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: '#374151', marginBottom: 6
              }}>Description *</label>
              <textarea
                rows={3}
                placeholder="Describe the incident..."
                value={disciplineForm.description}
                onChange={e => setDisciplineForm(f => ({ ...f, description: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #D1D5DB', borderRadius: 8,
                  fontSize: 14, color: '#111827',
                  resize: 'vertical', boxSizing: 'border-box',
                  background: '#F9FAFB'
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDisciplineModal(false)}
                style={{
                  padding: '10px 20px', background: '#F3F4F6',
                  border: '1px solid #E5E7EB', borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', color: '#374151'
                }}
              >Cancel</button>
              <button
                type="button"
                onClick={saveDisciplineRecord}
                style={{
                  padding: '10px 24px', background: '#DC2626',
                  border: 'none', borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', color: 'white'
                }}
              >
                {editingDiscipline ? 'Save Changes' : 'Add Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
