import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Printer, CheckCircle2, Clock, Package } from "lucide-react";

const safeLS = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) ?? fallback;
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

export const PrintJobKanban = ({ isMobile }) => {
  const isMobileState = isMobile !== undefined ? isMobile : (window.innerWidth < 768);
  const { data, setData, currentUser, exportToCSV } = useApp();
  const [completeModalJob, setCompleteModalJob] = useState(null);
  const [actualQty, setActualQty] = useState("");
  const [notes, setNotes] = useState("");
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 4 Stages
  const queuedJobs = (data.printJobs || []).filter((j) => j.status === "queued" || j.status === "Pending");
  const inProgressJobs = (data.printJobs || []).filter((j) => j.status === "in_progress" || j.status === "In Progress");
  const readyJobs = (data.printJobs || []).filter((j) => j.status === "ready" || j.status === "Ready" || j.status === "Ready to Distribute");
  const completedJobs = (data.printJobs || []).filter((j) => j.status === "completed" || j.status === "Completed");

  // Move queued -> in_progress
  const handleMarkInProgress = (jobId) => {
    const staffName = currentUser?.name || "Printing Staff";
    const nowStr = new Date().toISOString().split("T")[0];
    setData((prev) => ({
      ...prev,
      printJobs: (prev.printJobs || []).map((j) =>
        j.id === jobId ? { ...j, status: "in_progress", receivedDate: nowStr, receivedBy: staffName } : j
      )
    }));
  };

  // Move in_progress -> ready (Open modal to enter actual qty/notes and create draft book issues)
  const handleOpenReadyModal = (job) => {
    setCompleteModalJob(job);
    setActualQty(job.quantity);
    setNotes("");
  };

  const handleConfirmReadyToDistribute = (e) => {
    e.preventDefault();
    if (!completeModalJob) return;
    const nowStr = new Date().toISOString().split("T")[0];
    const printedQty = parseInt(actualQty) || completeModalJob.quantity;

    // Update job status to 'ready'
    setData((prev) => ({
      ...prev,
      printJobs: (prev.printJobs || []).map((j) =>
        j.id === completeModalJob.id
          ? {
              ...j,
              status: "ready",
              readyDate: nowStr,
              actualQtyPrinted: printedQty,
              notes: notes || ""
            }
          : j
      )
    }));

    // FIX 6: Auto-create draft book issue records in pba_book_issues for target batch
    const targetBatchName = completeModalJob.batch;
    const bookTitle = completeModalJob.bookTitle;
    const matchingStudents = (data.students || []).filter(
      (s) => s.batch === targetBatchName || s.batchId === targetBatchName
    );

    const existingIssues = safeLS("pba_book_issues", []);
    let newCreatedCount = 0;
    const newIssueRecords = [];

    matchingStudents.forEach((std) => {
      // Check if already issued or pending for this book
      const alreadyHas = existingIssues.some(
        (i) => i.studentId === std.id && i.bookTitle === bookTitle
      );
      if (!alreadyHas) {
        newCreatedCount++;
        newIssueRecords.push({
          id: "bi-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          studentId: std.id,
          studentName: std.name,
          bookId: completeModalJob.bookId || "bk-1",
          bookTitle: bookTitle,
          subjectId: completeModalJob.subjectId || "sub-1",
          subjectCode: completeModalJob.subjectCode || "BS",
          batchId: std.batch,
          batchName: std.batch,
          issuedOn: nowStr,
          issuedBy: currentUser?.name || "Printing Staff",
          notes: "Auto-generated from print job " + completeModalJob.id,
          status: "pending_distribution"
        });
      }
    });

    if (newIssueRecords.length > 0) {
      const updatedIssues = [...newIssueRecords, ...existingIssues];
      saveLS("pba_book_issues", updatedIssues);
      window.dispatchEvent(new Event("storage"));
    }

    showToast(`📦 ${newCreatedCount > 0 ? newCreatedCount : printedQty} book issue record(s) created for ${targetBatchName}`);
    setCompleteModalJob(null);
  };

  // Move ready -> completed (Mark as Distributed)
  const handleMarkDistributed = (jobId) => {
    const nowStr = new Date().toISOString().split("T")[0];
    setData((prev) => ({
      ...prev,
      printJobs: (prev.printJobs || []).map((j) =>
        j.id === jobId ? { ...j, status: "completed", completedDate: nowStr } : j
      )
    }));
  };

  const handleExportCSV = () => {
    const headers = ["Book Title", "Subject", "Batch", "Quantity Requested", "Actual Qty Printed", "Status", "Requested By", "Date Approved", "Date Received", "Received By", "Date Completed", "Notes"];
    const rows = (data.printJobs || []).map((j) => [
      j.bookTitle,
      j.subject,
      j.batch,
      j.quantity,
      j.actualQtyPrinted || j.quantity,
      j.status,
      j.requestedBy,
      j.dateApproved,
      j.receivedDate || "-",
      j.receivedBy || "-",
      j.completedDate || "-",
      j.notes || "-"
    ]);
    exportToCSV("PBA_Printing_Queue_Report", headers, rows);
  };

  return (
    <div>
      {/* Toast Banner */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 2000,
          background: '#4F46E5',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* PAGE-LEVEL HEADER AREA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '4px'
      }}>
        <h2 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: '17px',
          fontWeight: 700,
          color: '#1A202C',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Printer size={18} style={{ color: "#2B6CB0" }} />
          Kanban Printing Queue
        </h2>
        <button
          onClick={handleExportCSV}
          style={{
            padding: '9px 16px',
            background: '#FFFFFF',
            border: '1.5px solid #E3E6EA',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#4A5568',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="#4A5568" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Printing Report (CSV)
        </button>
      </div>

      {/* KANBAN BOARD LAYOUT — 4 COLUMNS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobileState ? '1fr' : 'repeat(4, 1fr)',
        gap: '14px',
        alignItems: 'flex-start',
        marginTop: '20px'
      }}>
        {/* COLUMN 1: 📋 Queued for Print */}
        <div style={{
          background: '#F8F9FB',
          border: '1px solid #E3E6EA',
          borderRadius: '12px',
          overflow: 'hidden',
          minHeight: '220px'
        }}>
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid #E3E6EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} style={{ color: "#B7860A" }} />
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                color: '#1A202C'
              }}>
                📋 Queued for Print
              </span>
            </div>
            <span style={{
              background: '#FEF3C7',
              color: '#B7860A',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {queuedJobs.length}
            </span>
          </div>

          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {queuedJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E3E6EA',
                  borderLeft: '3px solid #D4A017',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1A202C',
                  marginBottom: '6px',
                  lineHeight: '1.3'
                }}>
                  {job.bookTitle}
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <span style={{
                    background: '#EBF4FF',
                    color: '#2B6CB0',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {job.batch}
                  </span>
                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#4A5568',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  Qty: <strong>{job.quantity} copies</strong>
                </div>

                <div style={{
                  fontSize: '11px',
                  color: '#718096',
                  marginBottom: '10px'
                }}>
                  Requested by {job.requestedBy}
                </div>

                <button
                  onClick={() => handleMarkInProgress(job.id)}
                  style={{
                    width: '100%',
                    padding: '7px',
                    background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 6px rgba(43,108,176,0.20)',
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  <Printer size={12} />
                  Mark In Progress
                </button>
              </div>
            ))}

            {queuedJobs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: '#A0AEC0' }}>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>No queued jobs</div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: 🖨 In Progress */}
        <div style={{
          background: '#F8F9FB',
          border: '1px solid #E3E6EA',
          borderRadius: '12px',
          overflow: 'hidden',
          minHeight: '220px'
        }}>
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid #E3E6EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={16} style={{ color: "#2B6CB0" }} />
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                color: '#1A202C'
              }}>
                🖨 In Progress
              </span>
            </div>
            <span style={{
              background: '#EBF4FF',
              color: '#2B6CB0',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {inProgressJobs.length}
            </span>
          </div>

          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {inProgressJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E3E6EA',
                  borderLeft: '3px solid #2B6CB0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1A202C',
                  marginBottom: '6px',
                  lineHeight: '1.3'
                }}>
                  {job.bookTitle}
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <span style={{
                    background: '#EBF4FF',
                    color: '#2B6CB0',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {job.batch}
                  </span>
                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#4A5568',
                  marginBottom: '4px'
                }}>
                  Qty: <strong>{job.quantity} copies</strong>
                </div>

                <div style={{
                  fontSize: '11px',
                  color: '#718096',
                  marginBottom: '10px'
                }}>
                  {job.receivedBy ? `Received by ${job.receivedBy}` : `Requested by ${job.requestedBy}`}
                </div>

                <button
                  onClick={() => handleOpenReadyModal(job)}
                  style={{
                    width: '100%',
                    padding: '7px',
                    background: 'linear-gradient(135deg, #6B46C1, #553C9A)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 6px rgba(107,70,193,0.25)',
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  <Package size={12} />
                  Mark Ready to Distribute
                </button>
              </div>
            ))}

            {inProgressJobs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: '#A0AEC0' }}>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>No jobs in progress</div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: 📦 Ready to Distribute */}
        <div style={{
          background: '#F8F9FB',
          border: '1px solid #E3E6EA',
          borderRadius: '12px',
          overflow: 'hidden',
          minHeight: '220px'
        }}>
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid #E3E6EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={16} style={{ color: "#6B46C1" }} />
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                color: '#1A202C'
              }}>
                📦 Ready to Distribute
              </span>
            </div>
            <span style={{
              background: '#FAF5FF',
              color: '#6B46C1',
              border: '1px solid #E9D8FD',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {readyJobs.length}
            </span>
          </div>

          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {readyJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E3E6EA',
                  borderLeft: '3px solid #6B46C1',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1A202C',
                  marginBottom: '6px',
                  lineHeight: '1.3'
                }}>
                  {job.bookTitle}
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <span style={{
                    background: '#EBF4FF',
                    color: '#2B6CB0',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {job.batch}
                  </span>
                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#4A5568',
                  marginBottom: '4px'
                }}>
                  Printed: <strong>{job.actualQtyPrinted || job.quantity} copies</strong>
                </div>

                <div style={{
                  fontSize: '11px',
                  color: '#718096',
                  marginBottom: '10px'
                }}>
                  Awaiting student rollout
                </div>

                <button
                  onClick={() => handleMarkDistributed(job.id)}
                  style={{
                    width: '100%',
                    padding: '7px',
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  📦 Mark as Distributed
                </button>
              </div>
            ))}

            {readyJobs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: '#A0AEC0' }}>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>No books ready for rollout</div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 4: ✅ Completed */}
        <div style={{
          background: '#F8F9FB',
          border: '1px solid #E3E6EA',
          borderRadius: '12px',
          overflow: 'hidden',
          minHeight: '220px'
        }}>
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid #E3E6EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} style={{ color: "#2F855A" }} />
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                color: '#1A202C'
              }}>
                ✅ Completed
              </span>
            </div>
            <span style={{
              background: '#F0FFF4',
              color: '#2F855A',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {completedJobs.length}
            </span>
          </div>

          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {completedJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E3E6EA',
                  borderLeft: '3px solid #2F855A',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1A202C',
                  marginBottom: '6px',
                  lineHeight: '1.3'
                }}>
                  {job.bookTitle}
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <span style={{
                    background: '#EBF4FF',
                    color: '#2B6CB0',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {job.batch}
                  </span>
                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#4A5568',
                  marginBottom: '4px'
                }}>
                  Qty: <strong>{job.actualQtyPrinted || job.quantity} copies</strong>
                </div>

                <div style={{
                  fontSize: '11px',
                  color: '#2F855A',
                  fontWeight: 600,
                  marginBottom: '4px'
                }}>
                  ✓ Distributed on {job.completedDate || job.completedAt || 'Recently'}
                </div>

                {job.notes && (
                  <div style={{
                    fontSize: '11px',
                    color: '#718096',
                    fontStyle: 'italic',
                    marginTop: '4px'
                  }}>
                    Notes: "{job.notes}"
                  </div>
                )}
              </div>
            ))}

            {completedJobs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: '#A0AEC0' }}>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>No completed jobs</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mark Ready to Distribute Modal */}
      {completeModalJob && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "500px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setCompleteModalJob(null)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Log Print Run & Ready for Rollout</h3>
            <form onSubmit={handleConfirmReadyToDistribute}>
              <div style={{ marginBottom: "16px" }}>
                <strong style={{ fontSize: "14px", color: "#1A202C" }}>{completeModalJob.bookTitle}</strong> — <span style={{ fontSize: "13px", color: "#4A5568" }}>{completeModalJob.batch}</span>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Actual Quantity Printed</label>
                <input
                  type="number"
                  required
                  value={actualQty}
                  onChange={(e) => setActualQty(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#6B46C1"; e.target.style.boxShadow = "0 0 0 3px rgba(107,70,193,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Printing Staff Notes / Stock Reserve</label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Printed 35 copies, ready for batch rollout..."
                  style={{
                    width: "100%", padding: "10px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", resize: "vertical", minHeight: "80px", lineHeight: "1.6", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#6B46C1"; e.target.style.boxShadow = "0 0 0 3px rgba(107,70,193,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ background: '#FAF5FF', border: '1px solid #E9D8FD', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#553C9A', marginBottom: '16px' }}>
                ℹ️ Marking as Ready will automatically generate student book distribution logs for all students in <strong>{completeModalJob.batch}</strong>.
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setCompleteModalJob(null)} style={{ background: "#FFFFFF", color: "#4A5568", border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #6B46C1, #553C9A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(107,70,193,0.30)' }}>Confirm & Generate Student Issues</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
