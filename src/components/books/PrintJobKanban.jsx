import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Printer, CheckCircle2, Clock } from "lucide-react";

import { T, theme, type as t } from "../../theme";

export const PrintJobKanban = () => {
  const { data, currentUser, markPrintJobReceived, markPrintJobCompleted, exportToCSV } = useApp();
  const [completeModalJob, setCompleteModalJob] = useState(null);
  const [actualQty, setActualQty] = useState("");
  const [notes, setNotes] = useState("");

  const pendingJobs = data.printJobs.filter((j) => j.status === "Pending");
  const inProgressJobs = data.printJobs.filter((j) => j.status === "In Progress");
  const completedJobs = data.printJobs.filter((j) => j.status === "Completed");

  const handleOpenComplete = (job) => {
    setCompleteModalJob(job);
    setActualQty(job.quantity);
    setNotes("");
  };

  const handleConfirmComplete = (e) => {
    e.preventDefault();
    if (!completeModalJob) return;
    markPrintJobCompleted(completeModalJob.id, actualQty, notes);
    setCompleteModalJob(null);
  };

  const handleExportCSV = () => {
    const headers = ["Book Title", "Subject", "Batch", "Quantity Requested", "Actual Qty Printed", "Status", "Requested By", "Date Approved", "Date Received", "Received By", "Date Completed", "Notes"];
    const rows = data.printJobs.map((j) => [
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="#2B6CB0" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            <line x1="12" y1="12" x2="12" y2="16"/>
            <line x1="10" y1="14" x2="14" y2="14"/>
          </svg>
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

      {/* KANBAN BOARD LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '18px',
        alignItems: 'flex-start',
        marginTop: '20px'
      }}>
        {/* COLUMN 1: PENDING RECEIVED */}
        <div style={{
          background: '#F8F9FB',
          border: '1px solid #E3E6EA',
          borderRadius: '12px',
          overflow: 'hidden',
          minHeight: '200px'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E3E6EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: "#B7860A" }} />
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                color: '#1A202C'
              }}>
                Pending Received
              </span>
            </div>
            <span style={{
              background: '#FEF3C7',
              color: '#B7860A',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              minWidth: '22px',
              textAlign: 'center'
            }}>
              {pendingJobs.length}
            </span>
          </div>

          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E3E6EA',
                  borderLeft: '3px solid #D4A017',
                  borderRadius: '8px',
                  padding: '14px 16px',
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="#718096" strokeWidth="2">
                    <rect x="6" y="2" width="12" height="20" rx="2"/>
                    <line x1="12" y1="6" x2="16" y2="6"/>
                    <line x1="12" y1="10" x2="16" y2="10"/>
                    <line x1="12" y1="14" x2="16" y2="14"/>
                  </svg>
                  Qty: <strong>{job.quantity} copies</strong>
                </div>

                <div style={{
                  fontSize: '11px',
                  color: '#718096',
                  marginBottom: '12px'
                }}>
                  Requested by {job.requestedBy}
                </div>

                <button
                  onClick={() => markPrintJobReceived(job.id, currentUser?.name || 'Admin')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(43,108,176,0.25)',
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="#FFFFFF" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Mark as Received
                </button>
              </div>
            ))}

            {pendingJobs.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '30px 16px',
                color: '#A0AEC0'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="#CBD5E0" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
                  <rect x="6" y="2" width="12" height="20" rx="2"/>
                  <line x1="9" y1="9" x2="15" y2="9"/>
                  <line x1="9" y1="13" x2="15" y2="13"/>
                </svg>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>No jobs in this column</div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: IN PROGRESS */}
        <div style={{
          background: '#F8F9FB',
          border: '1px solid #E3E6EA',
          borderRadius: '12px',
          overflow: 'hidden',
          minHeight: '200px'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E3E6EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={16} style={{ color: "#2B6CB0" }} />
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                color: '#1A202C'
              }}>
                In Progress
              </span>
            </div>
            <span style={{
              background: '#EBF4FF',
              color: '#2B6CB0',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              minWidth: '22px',
              textAlign: 'center'
            }}>
              {inProgressJobs.length}
            </span>
          </div>

          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {inProgressJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E3E6EA',
                  borderLeft: '3px solid #2B6CB0',
                  borderRadius: '8px',
                  padding: '14px 16px',
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="#718096" strokeWidth="2">
                    <rect x="6" y="2" width="12" height="20" rx="2"/>
                    <line x1="12" y1="6" x2="16" y2="6"/>
                    <line x1="12" y1="10" x2="16" y2="10"/>
                    <line x1="12" y1="14" x2="16" y2="14"/>
                  </svg>
                  Qty: <strong>{job.quantity} copies</strong>
                </div>

                <div style={{
                  fontSize: '11px',
                  color: '#718096',
                  marginBottom: '12px'
                }}>
                  {job.receivedBy ? `Received by ${job.receivedBy}` : `Requested by ${job.requestedBy}`}
                </div>

                <button
                  onClick={() => handleOpenComplete(job)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(43,108,176,0.25)',
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="#FFFFFF" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Mark as Completed
                </button>
              </div>
            ))}

            {inProgressJobs.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '30px 16px',
                color: '#A0AEC0'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="#CBD5E0" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
                  <rect x="6" y="2" width="12" height="20" rx="2"/>
                  <line x1="9" y1="9" x2="15" y2="9"/>
                  <line x1="9" y1="13" x2="15" y2="13"/>
                </svg>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>No jobs in this column</div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: COMPLETED */}
        <div style={{
          background: '#F8F9FB',
          border: '1px solid #E3E6EA',
          borderRadius: '12px',
          overflow: 'hidden',
          minHeight: '200px'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E3E6EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: "#2F855A" }} />
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                color: '#1A202C'
              }}>
                Completed
              </span>
            </div>
            <span style={{
              background: '#F0FFF4',
              color: '#2F855A',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              minWidth: '22px',
              textAlign: 'center'
            }}>
              {completedJobs.length}
            </span>
          </div>

          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {completedJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E3E6EA',
                  borderLeft: '3px solid #2F855A',
                  borderRadius: '8px',
                  padding: '14px 16px',
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="#718096" strokeWidth="2">
                    <rect x="6" y="2" width="12" height="20" rx="2"/>
                    <line x1="12" y1="6" x2="16" y2="6"/>
                    <line x1="12" y1="10" x2="16" y2="10"/>
                    <line x1="12" y1="14" x2="16" y2="14"/>
                  </svg>
                  Qty: <strong>{job.actualQtyPrinted || job.quantity} copies</strong>
                </div>

                <div style={{
                  fontSize: '11px',
                  color: '#718096',
                  marginBottom: '4px'
                }}>
                  {job.receivedBy ? `Received by ${job.receivedBy}` : `Requested by ${job.requestedBy}`}
                </div>

                <div style={{
                  fontSize: '11px',
                  color: '#2F855A',
                  fontWeight: 600,
                  marginBottom: '4px'
                }}>
                  ✓ Completed on {job.completedDate || job.completedAt || 'Recently'}
                </div>

                {job.notes && (
                  <div style={{
                    fontSize: '11px',
                    color: '#718096',
                    fontStyle: 'italic',
                    marginBottom: '4px'
                  }}>
                    Notes: "{job.notes}"
                  </div>
                )}
              </div>
            ))}

            {completedJobs.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '30px 16px',
                color: '#A0AEC0'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="#CBD5E0" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
                  <rect x="6" y="2" width="12" height="20" rx="2"/>
                  <line x1="9" y1="9" x2="15" y2="9"/>
                  <line x1="9" y1="13" x2="15" y2="13"/>
                </svg>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>No jobs in this column</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mark Completed Modal */}
      {completeModalJob && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "500px", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setCompleteModalJob(null)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Log Printing Completed</h3>
            <form onSubmit={handleConfirmComplete}>
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
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Printing Staff Notes / Stock Reserve</label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 5 extra copies held in reserve stock..."
                  style={{
                    width: "100%", padding: "10px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", resize: "vertical", minHeight: "100px", lineHeight: "1.6", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setCompleteModalJob(null)} style={{ background: "#FFFFFF", color: "#4A5568", border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2F855A, #276749)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(47,133,90,0.30)' }}>Confirm Completed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
