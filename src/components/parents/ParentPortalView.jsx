import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Share2, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { ParentSummaryView } from "../students/ParentSummaryView";

import { theme, type as t } from "../../theme";

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

export const ParentPortalView = ({ isMobile }) => {
  const isMobileState = isMobile !== undefined ? isMobile : (typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const { data } = useApp();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("links");

  // Bulk Message state
  const [msgTarget, setMsgTarget] = useState("Batch 2024-A (A/L Commerce)");
  const [msgSubject, setMsgSubject] = useState("Term 2 Progress & Exam Notice");
  const [msgBody, setMsgBody] = useState("Dear Parent, Mid-term evaluation report cards for Batch 2024-A have been published.");
  const [msgChannel, setMsgChannel] = useState("WhatsApp");
  const [logs, setLogs] = useState(() => safeLS("pba_parent_broadcast_logs", [
    {
      id: 1,
      date: "2026-09-18",
      target: "Batch 2024-A (A/L Commerce)",
      subject: "Class schedule update",
      channel: "WhatsApp",
      body: "Please note Accounting class for tomorrow starts at 08:30 AM."
    }
  ]));

  useEffect(() => {
    saveLS("pba_parent_broadcast_logs", logs);
  }, [logs]);

  const handleSendBulk = (e) => {
    e.preventDefault();
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      target: msgTarget,
      subject: msgSubject,
      channel: msgChannel,
      body: msgBody
    };
    const updated = [newLog, ...(logs || [])];
    setLogs(updated);
    saveLS("pba_parent_broadcast_logs", updated);

    if (msgChannel === "WhatsApp") {
      const text = encodeURIComponent(`*PLATINUM BUSINESS ACADEMY NOTICE*\n\nSubject: ${msgSubject}\n\n${msgBody}`);
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
  };

  const studentsList = data?.students || [];
  const batchesList = data?.batches || [];

  // Returns the live enrolled batch name for a student from pba_batches
  const getStudentBatchName = (st) => {
    if (!st) return 'No batch assigned';
    const studentIdStr = (st.id || st.regNo || st.studentId || '').toString();
    const batches = safeLS('pba_batches', []) || [];
    const enrolled = batches.filter(b =>
      (b.students || []).some(s =>
        (s.id || s.regNo || s.studentId || '').toString() === studentIdStr
      )
    );
    return enrolled[0]?.name
      || st.batchName
      || st.batch
      || st.batchId
      || 'No batch assigned';
  };

  // Returns the branch from all possible field variants
  const getStudentBranch = (st) =>
    st?.branch || st?.branchName || st?.campus || '';

  return (
    <div>
      {selectedStudent && <ParentSummaryView student={selectedStudent} onClose={() => setSelectedStudent(null)} />}

      {/* PATTERN B — Page Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: t.fontHeading, fontSize: '20px', fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            Parent Communication Portal
          </h2>
          <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
            Generate public parent summary links and broadcast notices to guardians.
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
          marginBottom: "20px",
          flexWrap: isMobileState ? "wrap" : "nowrap"
        }}
      >
        <button
          onClick={() => setActiveTab("links")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "links" ? 600 : 500,
            color: activeTab === "links" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "links" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "links" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Share2 size={16} /> Shareable Parent Portal Links
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "bulk" ? 600 : 500,
            color: activeTab === "bulk" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "bulk" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "bulk" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <MessageSquare size={16} /> Bulk Parent Communication Broadcast
        </button>
      </div>

      {/* TAB 1: PARENT LINKS */}
      {activeTab === "links" && (
        <div
          style={{
            background: theme.cardBg,
            border: "1px solid " + theme.cardBorder,
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            overflow: "hidden"
          }}
        >
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #F4F5F7" }}>
            <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
              <Share2 size={18} style={{ color: theme.accent }} /> Parent Summary Portal Links
            </span>
          </div>

          <div style={{ padding: "16px 22px 0 22px" }}>
            <p style={{ fontSize: "13px", color: theme.textMuted, margin: 0 }}>
              Parents can access a clean, read-only summary of their child's attendance, latest marks, and academy notices via a unique shareable URL without password login.
            </p>
          </div>

          <div style={{ padding: isMobileState ? "12px" : "16px 22px 22px 22px", overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
            <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA" }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Registration No</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Student Name</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Batch</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Parent Contact</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map((st) => (
                  <tr
                    key={st.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: theme.accent, borderBottom: '1px solid #F4F5F7' }}>
                      {st.regNo}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {st.name}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {getStudentBatchName(st)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {st.parentPhone}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      <button
                        onClick={() => setSelectedStudent(st)}
                        style={{
                          background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Share2 size={12} /> Open Parent View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BULK COMMUNICATION */}
      {activeTab === "bulk" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobileState ? "1fr" : "1fr 1fr", gap: "20px" }}>
          <div
            style={{
              background: theme.cardBg,
              border: "1px solid " + theme.cardBorder,
              borderRadius: "14px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              overflow: "hidden"
            }}
          >
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #F4F5F7" }}>
              <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
                <Send size={18} style={{ color: theme.accent }} /> Broadcast Parent Message
              </span>
            </div>

            <form onSubmit={handleSendBulk} style={{ padding: "20px 22px" }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Recipients
                </label>
                <select
                  value={msgTarget}
                  onChange={(e) => setMsgTarget(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 13px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1A202C',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  {batchesList.map((b) => (
                    <option key={b.id} value={b.name}>
                      All Parents in {b.name}
                    </option>
                  ))}
                  <option value="All Active Students">All Active Students & Parents</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Dispatch Channel
                </label>
                <select
                  value={msgChannel}
                  onChange={(e) => setMsgChannel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 13px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1A202C',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="WhatsApp">WhatsApp (wa.me Share Link)</option>
                  <option value="Email">Email Notification</option>
                  <option value="SMS">SMS Notification Log</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Message Subject
                </label>
                <input
                  type="text"
                  required
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 13px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1A202C',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Message Content
                </label>
                <textarea
                  rows="4"
                  required
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 13px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1A202C',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    resize: 'vertical',
                    minHeight: '120px',
                    lineHeight: '1.6',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '11px',
                  background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 10px rgba(43,108,176,0.30)',
                  marginTop: '8px',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                <Send size={16} /> Broadcast Message
              </button>
            </form>
          </div>

          <div
            style={{
              background: theme.cardBg,
              border: "1px solid " + theme.cardBorder,
              borderRadius: "14px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              overflow: "hidden"
            }}
          >
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #F4F5F7" }}>
              <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={18} style={{ color: theme.success }} /> Sent Communication Log
              </span>
            </div>

            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {(logs || []).map((l) => (
                <div key={l.id} style={{ padding: "14px", border: "1px solid " + theme.cardBorder, borderRadius: "10px", background: "#F8FAFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "13px", color: theme.textPrimary }}>{l.subject}</strong>
                    <span style={{ background: theme.accentLight, color: theme.accentDark, border: '1px solid #BEE3F8', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                      {l.channel}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "4px" }}>
                    To: {l.target} | Sent on {l.date}
                  </div>
                  <div style={{ fontSize: "12px", color: theme.textSecondary, fontStyle: "italic" }}>"{l.body}"</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
