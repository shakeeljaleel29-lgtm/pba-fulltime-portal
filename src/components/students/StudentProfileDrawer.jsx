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

export const StudentProfileDrawer = ({ student, initialTab = "overview", onClose }) => {
  const { data, linkStudentAccount, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedUserAccountId, setSelectedUserAccountId] = useState(data.userAccounts.find((u) => u.role === "Student")?.id || "");

  // Single Student Enroll in Batch Modal State
  const [showSingleEnrollModal, setShowSingleEnrollModal] = useState(false);
  const [enrollBatchId, setEnrollBatchId] = useState("");
  const [enrollStream, setEnrollStream] = useState("");
  const [enrollSelectedSubjects, setEnrollSelectedSubjects] = useState([]);

  if (!student) return null;

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

  const drawerTabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "subjects", label: "Subjects", icon: BookOpen },
    { id: "marks", label: "Marks & Grades", icon: FileCheck2 },
    { id: "discipline", label: "Discipline", count: studentDiscipline.length, icon: AlertTriangle },
    { id: "fees", label: "Fees Ledger", icon: CreditCard },
    { id: "documents", label: "Documents", count: studentDocs.length, icon: FolderOpen },
    { id: "report", label: "Report Card", icon: FileSpreadsheet, onClick: () => setShowReportCardModal(true) }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-lg" style={{ height: "90vh" }}>
        {/* Header */}
        <div className="modal-header" style={{ backgroundColor: "#1A3566", color: "#FFFFFF" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#FFFFFF" }}>
              {student.name} <span style={{ fontSize: "0.85rem", color: "#93C5FD" }}>({student.regNo})</span>
            </h3>
            <div style={{ fontSize: "0.78rem", color: "#CBD5E1" }}>
              {student.batch} • {student.branch} Branch
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {currentUser.role === "Admin" && (
              <button
                onClick={() => setShowLinkModal(true)}
                style={ghostBtnStyle}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                }}
              >
                <Link size={14} /> Link Student Account
              </button>
            )}
            <button
              onClick={handleCopyParentLink}
              style={ghostBtnStyle}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              }}
            >
              <Share2 size={14} /> {copiedLink ? "Link Copied!" : "Parent Link"}
            </button>
            <button
              onClick={onClose}
              style={ghostBtnStyle}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* Pill-group style tab bar */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            background: '#F4F5F7',
            borderRadius: '10px',
            flexWrap: 'wrap',
            margin: '0 0 20px 0'
          }}>
            {drawerTabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={tab.onClick || (() => setActiveTab(tab.id))}
                  style={{
                    padding: '7px 14px',
                    background: isActive ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#1A202C' : '#718096',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif"
                  }}
                >
                  {IconComp && (
                    <IconComp
                      size={13}
                      style={{ opacity: isActive ? 1 : 0.6 }}
                    />
                  )}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span style={{
                      background: isActive ? '#EBF4FF' : '#E2E8F0',
                      color: isActive ? '#2B6CB0' : '#718096',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '10px',
                      marginLeft: '2px'
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="card" style={{ marginBottom: 0 }}>
                <h4 style={{ fontSize: "0.95rem", marginBottom: "12px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px" }}>
                  Personal Information
                </h4>
                <div style={{ fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <strong style={{ color: "#64748B" }}>Branch:</strong> {student.branch}
                  </div>
                  <div>
                    <strong style={{ color: "#64748B" }}>Date of Birth:</strong> {student.dob}
                  </div>
                  <div>
                    <strong style={{ color: "#64748B" }}>Mobile Number:</strong> {student.phone}
                  </div>
                  <div>
                    <strong style={{ color: "#64748B" }}>Parent/Guardian Phone:</strong> {student.parentPhone}
                  </div>
                  <div>
                    <strong style={{ color: "#64748B" }}>Email:</strong> {student.email}
                  </div>
                  <div>
                    <strong style={{ color: "#64748B" }}>Enrolment Date:</strong> {student.enrolmentDate}
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 0 }}>
                <h4 style={{ fontSize: "0.95rem", marginBottom: "12px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px" }}>
                  Academic Status & Notes
                </h4>
                <div style={{ marginBottom: "12px" }}>
                  <span className="badge badge-success" style={{ fontSize: "0.85rem" }}>
                    Status: {student.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                  <strong>Admin Notes:</strong>
                  <p style={{ marginTop: "4px", fontStyle: "italic", background: "#F8FAFC", padding: "10px", borderRadius: "6px" }}>
                    {student.adminNotes || "No notes logged for this student."}
                  </p>
                </div>

                {/* Batches section */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#1A202C' }}>Enrolled Batches</strong>
                    <button
                      onClick={() => {
                        setEnrollBatchId("");
                        setEnrollStream("");
                        setEnrollSelectedSubjects([]);
                        setShowSingleEnrollModal(true);
                      }}
                      style={{
                        padding: '4px 10px',
                        background: '#2B6CB0',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ＋ Enroll in Batch
                    </button>
                  </div>

                  {(() => {
                    const studentEnrollments = safeLS('pba_batch_enrollments', [])
                      .filter(e => e.studentId === student.id && e.status === 'active');

                    if (studentEnrollments.length === 0) {
                      return <span style={{ fontSize: '12px', color: '#A0AEC0' }}>Not enrolled in any batch</span>;
                    }

                    const allBatches = safeLS('pba_batches', []);
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {studentEnrollments.map(enrollment => {
                          const batch = allBatches.find(b => b.id === enrollment.batchId);
                          return (
                            <span key={enrollment.id} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              background: batch?.color ? batch.color + '20' : '#EBF4FF',
                              color: '#2B6CB0',
                              border: '1px solid #BEE3F8',
                              borderRadius: '20px',
                              padding: '3px 10px',
                              fontSize: '11px', fontWeight: 600
                            }}>
                              {batch?.name || 'Unknown Batch'}
                              {enrollment.stream && (
                                <span style={{
                                  fontSize: '9px', fontWeight: 800,
                                  background: enrollment.stream === 'science' ? '#F0FFF4' : '#FFFBEB',
                                  color: enrollment.stream === 'science' ? '#276749' : '#B7860A',
                                  borderRadius: '8px', padding: '1px 5px'
                                }}>
                                  {enrollment.stream === 'science' ? 'SCI' : 'COM'}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === "attendance" && (
            <div>
              <div style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
                <div style={{ padding: "12px 20px", background: "#D1FAE5", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#059669" }}>96%</div>
                  <div style={{ fontSize: "0.75rem", color: "#047857" }}>Attendance Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* SUBJECTS */}
          {activeTab === "subjects" && (
            <div>
              <h4 style={{ fontSize: "0.95rem", marginBottom: "12px" }}>Enrolled Subjects</h4>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {student.subjects.map((sb, i) => (
                  <span key={i} className="badge badge-info" style={{ fontSize: "0.88rem", padding: "8px 14px" }}>
                    {sb}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* MARKS */}
          {activeTab === "marks" && (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Mid-Term Evaluation 2026</strong>
                    </td>
                    <td>Business Studies</td>
                    <td>88 / 100</td>
                    <td>88%</td>
                    <td>
                      <span className="badge badge-success">A</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* DISCIPLINE */}
          {activeTab === "discipline" && (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date Issued</th>
                    <th>Reason</th>
                    <th>Issued By</th>
                  </tr>
                </thead>
                <tbody>
                  {studentDiscipline.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <span className="badge badge-danger">{d.type}</span>
                      </td>
                      <td>{d.dateIssued}</td>
                      <td>{d.reason}</td>
                      <td>{d.issuedBy}</td>
                    </tr>
                  ))}
                  {studentDiscipline.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", color: "#059669" }}>
                        Clean record! No disciplinary actions logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* FEES */}
          {activeTab === "fees" && (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Due Date</th>
                    <th>Amount Due</th>
                    <th>Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentFees.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <strong>{f.description}</strong>
                      </td>
                      <td>{f.dueDate}</td>
                      <td>LKR {f.amountDue.toLocaleString()}</td>
                      <td>LKR {(f.amountPaid || 0).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${f.status === "Paid" ? "badge-success" : "badge-danger"}`}>{f.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
                    onClick={() => { setFromDate(''); setToDate(''); }}
                    style={{ padding: '5px 12px', background: '#FFFFFF', border: '1px solid #CBD5E0', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#4A5568', cursor: 'pointer' }}
                  >
                    All Time
                  </button>
                </div>

                <button
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
                  if (fromDate && new Date(ex.date) < new Date(fromDate)) return false;
                  if (toDate && new Date(ex.date) > new Date(toDate)) return false;
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
          {activeTab === "documents" && (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Document Title</th>
                    <th>Type</th>
                    <th>Upload Date</th>
                  </tr>
                </thead>
                <tbody>
                  {studentDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <strong>{doc.title}</strong>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{doc.type}</span>
                      </td>
                      <td>{doc.uploadDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close Drawer
          </button>
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
    </div>
  );
};
