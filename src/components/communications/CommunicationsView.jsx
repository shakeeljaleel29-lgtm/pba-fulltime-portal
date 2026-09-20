import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { MessageSquare, Send, FileText, Search, Bell, CheckSquare, Square } from "lucide-react";

import { T, theme, type as t } from "../../theme";

export const CommunicationsView = ({ isMobile }) => {
  const isMobileState = isMobile !== undefined ? isMobile : (window.innerWidth < 768);
  const { data, sendMessage, addCommunicationTemplate, currentUser, filterByBranch, showToast } = useApp();
  const [activeTab, setActiveTab] = useState("compose");

  // Compose State
  const [recipientType, setRecipientType] = useState("All Students (Specific Branch)");
  const [channel, setChannel] = useState("WhatsApp");
  const [subject, setSubject] = useState("Important Academic Update");
  const [body, setBody] = useState("Dear [NAME],\n\nThis is an official notice regarding your morning full-time classes in [BATCH].");
  const [searchLog, setSearchLog] = useState("");

  // New Template Modal State
  const [showTmplModal, setShowTmplModal] = useState(false);
  const [tmplForm, setTmplForm] = useState({ name: "", subject: "", body: "" });

  // Bulk WhatsApp Announcement Modal State
  const [bulkAncModal, setBulkAncModal] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const role = currentUser.role;
  const activeStudents = filterByBranch(data.students || []).filter((s) => s.status === "Active" || !s.status);

  const handleOpenBulkModal = (anc) => {
    setBulkAncModal(anc);
    setSelectedStudentIds(activeStudents.map((s) => s.id));
  };

  const handleToggleSelectStudent = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === activeStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(activeStudents.map((s) => s.id));
    }
  };

  const handleDispatchBulkWhatsApp = () => {
    if (!bulkAncModal || selectedStudentIds.length === 0) return;

    let count = 0;
    activeStudents.forEach((st) => {
      if (selectedStudentIds.includes(st.id)) {
        const phone = (st.parentPhone || st.phone || "").replace(/\D/g, "");
        const targetPhone = phone.length >= 9 ? `94${phone.slice(-9)}` : "94770000000";
        const msgText = encodeURIComponent(`*PBA ANNOUNCEMENT: ${bulkAncModal.title}*\n\nDear Parent of ${st.name},\n\n${bulkAncModal.body}\n\n- Platinum Business Academy Administration`);
        window.open(`https://wa.me/${targetPhone}?text=${msgText}`, "_blank");
        count++;
      }
    });

    showToast(`Opening WhatsApp links for ${count} parent(s).`, "success");
    setBulkAncModal(null);
  };

  const handleSelectTemplate = (tmplId) => {
    const tmpl = data.communicationTemplates.find((t) => t.id === tmplId);
    if (tmpl) {
      setSubject(tmpl.subject);
      setBody(tmpl.body);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();

    const parsedBody = body
      .replace(/\[NAME\]/g, "Kasun Jayawardena")
      .replace(/\[BATCH\]/g, "Batch 2024-A")
      .replace(/\[DATE\]/g, new Date().toISOString().split("T")[0])
      .replace(/\[AMOUNT\]/g, "15,000");

    sendMessage({
      recipientGroup: recipientType,
      channel,
      subject,
      body: parsedBody,
      preview: parsedBody.substring(0, 80) + "..."
    });

    if (channel === "WhatsApp") {
      const waText = encodeURIComponent(`*PBA NOTICE*\n\nSubject: ${subject}\n\n${parsedBody}`);
      window.open(`https://wa.me/?text=${waText}`, "_blank");
    }

    setActiveTab("log");
  };

  const handleAddTemplate = (e) => {
    e.preventDefault();
    if (!tmplForm.name) return;
    addCommunicationTemplate(tmplForm);
    setShowTmplModal(false);
  };

  const filteredLogs = filterByBranch(data.communicationsLog).filter(
    (l) =>
      l.recipientGroup.toLowerCase().includes(searchLog.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchLog.toLowerCase()) ||
      l.channel.toLowerCase().includes(searchLog.toLowerCase())
  );

  return (
    <div>
      {/* PATTERN B — Page Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: t.fontHeading, fontSize: '20px', fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            Communications & Broadcast Centre
          </h2>
          <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
            Dispatch announcements, WhatsApp messages, and email notices to students & parents.
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
          onClick={() => setActiveTab("compose")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "compose" ? 600 : 500,
            color: activeTab === "compose" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "compose" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "compose" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Send size={16} /> Compose Message
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
            whiteSpace: "nowrap",
            boxShadow: activeTab === "announcements" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Bell size={16} /> Announcements ({data.announcements.length})
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "templates" ? 600 : 500,
            color: activeTab === "templates" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "templates" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "templates" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <FileText size={16} /> Message Templates ({data.communicationTemplates.length})
        </button>
        <button
          onClick={() => setActiveTab("log")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "log" ? 600 : 500,
            color: activeTab === "log" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "log" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "log" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <MessageSquare size={16} /> Communications History Log
        </button>
      </div>

      {/* TAB: ANNOUNCEMENTS */}
      {activeTab === "announcements" && (
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
              <Bell size={18} style={{ color: theme.accent }} /> Academy Bulletin Announcements
            </span>
          </div>

          <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {(data.announcements || []).map((anc) => (
              <div
                key={anc.id}
                style={{
                  border: "1px solid " + theme.cardBorder,
                  borderRadius: "12px",
                  padding: "18px",
                  background: "#FFFFFF"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    {anc.priority === "Urgent" ? (
                      <span style={{ background: theme.dangerLight, color: theme.danger, border: '1px solid ' + theme.dangerBorder, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                        Urgent Priority
                      </span>
                    ) : (
                      <span style={{ background: theme.accentLight, color: theme.accentDark, border: '1px solid #BEE3F8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                        Normal Priority
                      </span>
                    )}
                    <h4 style={{ fontFamily: t.fontHeading, fontSize: "16px", fontWeight: 700, color: theme.textPrimary, margin: "6px 0 2px 0" }}>
                      {anc.title}
                    </h4>
                    <div style={{ fontSize: "12px", color: theme.textMuted }}>
                      Posted on: {anc.datePosted || "Today"} | Branch: <strong style={{ color: theme.textPrimary }}>{anc.branch || "All"}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBulkModal(anc)}
                    style={{
                      background: '#25D366',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Send to Parents via WhatsApp
                  </button>
                </div>

                <p
                  style={{
                    fontSize: "13px",
                    color: theme.textSecondary,
                    margin: "12px 0 0 0",
                    whiteSpace: "pre-wrap",
                    background: theme.accentLight,
                    border: "1px solid #BEE3F8",
                    padding: "12px 14px",
                    borderRadius: "10px"
                  }}
                >
                  {anc.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: COMPOSE MESSAGE */}
      {activeTab === "compose" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "flex-start" }}>
          {/* LEFT: Compose form card */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E3E6EA",
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
                gap: "10px"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B6CB0" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "15px", fontWeight: 600, color: "#1A202C" }}>
                Compose Communication Dispatch
              </span>
            </div>

            <div style={{ padding: "22px" }}>
              <form onSubmit={handleSend}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>
                    Load Saved Template (Optional)
                  </label>
                  <select
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 36px 9px 13px",
                      background: "#FFFFFF",
                      border: "1.5px solid #E3E6EA",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#1A202C",
                      outline: "none",
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      appearance: "none",
                      WebkitAppearance: "none",
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      cursor: "pointer",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      boxSizing: "border-box"
                    }}
                    onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                  >
                    <option value="">-- Choose Template --</option>
                    {data.communicationTemplates.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>
                    Recipient Group
                  </label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 36px 9px 13px",
                      background: "#FFFFFF",
                      border: "1.5px solid #E3E6EA",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#1A202C",
                      outline: "none",
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      appearance: "none",
                      WebkitAppearance: "none",
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      cursor: "pointer",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      boxSizing: "border-box"
                    }}
                    onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                  >
                    <option value="All Students (All Branches)">All Students (All Branches)</option>
                    <option value="All Students (Specific Branch)">All Students (Current Branch)</option>
                    <option value="All Students in Batch 2024-A">All Students in Batch 2024-A</option>
                    <option value="Individual Student">Individual Student (Kasun Jayawardena)</option>
                    <option value="All Lecturers">All Lecturers (Current Branch)</option>
                    <option value="Individual Lecturer">Individual Lecturer (Mr. Gamini Silva)</option>
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>
                    Dispatch Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 36px 9px 13px",
                      background: "#FFFFFF",
                      border: "1.5px solid #E3E6EA",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#1A202C",
                      outline: "none",
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      appearance: "none",
                      WebkitAppearance: "none",
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      cursor: "pointer",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      boxSizing: "border-box"
                    }}
                    onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                  >
                    <option value="WhatsApp">WhatsApp (wa.me Share Link)</option>
                    <option value="Email">Email Notification</option>
                    <option value="SMS">SMS Notification Log</option>
                    <option value="In-App Notification">In-App Portal Notification</option>
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 13px",
                      background: "#FFFFFF",
                      border: "1.5px solid #E3E6EA",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#1A202C",
                      outline: "none",
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      boxSizing: "border-box"
                    }}
                    onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>
                    Message Content
                  </label>
                  <div style={{ fontSize: "11px", color: theme.textMuted, marginBottom: "6px" }}>
                    Available Tags: <code>[NAME]</code>, <code>[BATCH]</code>, <code>[DATE]</code>, <code>[AMOUNT]</code>
                  </div>
                  <textarea
                    rows="5"
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 13px",
                      background: "#FFFFFF",
                      border: "1.5px solid #E3E6EA",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#1A202C",
                      outline: "none",
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      resize: "vertical",
                      minHeight: "120px",
                      lineHeight: "1.6",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      boxSizing: "border-box"
                    }}
                    onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "11px",
                    background: "linear-gradient(135deg, #2B6CB0, #1A4A8A)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 2px 10px rgba(43,108,176,0.30)",
                    transition: "all 0.15s",
                    marginTop: "8px",
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  <Send size={16} /> Dispatch Message
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Live preview panel card */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E3E6EA",
              borderRadius: "14px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              overflow: "hidden",
              position: "sticky",
              top: "80px"
            }}
          >
            <div
              style={{
                padding: "16px 22px",
                borderBottom: "1px solid #F4F5F7",
                background: "#F8FAFE",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B6CB0" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "14px", fontWeight: 600, color: "#1A202C" }}>
                Parsed Message Live Preview
              </span>
            </div>

            <div style={{ padding: "22px" }}>
              <div style={{ fontSize: "12px", color: "#4A5568", marginBottom: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ background: "#EBF4FF", color: "#2B6CB0", padding: "2px 8px", borderRadius: "6px", fontWeight: 600, fontSize: "11px" }}>
                  To: {recipientType}
                </span>
                <span style={{ background: "#FEF3C7", color: "#B7860A", padding: "2px 8px", borderRadius: "6px", fontWeight: 600, fontSize: "11px" }}>
                  Channel: {channel}
                </span>
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#1A202C", marginBottom: "12px" }}>{subject}</div>
              <div style={{ fontSize: "13px", color: "#4A5568", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {body
                  .replace(/\[NAME\]/g, "Kasun Jayawardena")
                  .replace(/\[BATCH\]/g, "Batch 2024-A")
                  .replace(/\[DATE\]/g, new Date().toISOString().split("T")[0])
                  .replace(/\[AMOUNT\]/g, "15,000")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES */}
      {activeTab === "templates" && (
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
              <FileText size={18} style={{ color: theme.accent }} /> Reusable Communication Templates
            </span>
            {role === "Admin" && (
              <button
                onClick={() => setShowTmplModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(43,108,176,0.30)'
                }}
              >
                + Create Template
              </button>
            )}
          </div>

          <div style={{ padding: "20px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {data.communicationTemplates.map((tmpl) => (
              <div key={tmpl.id} style={{ border: "1px solid " + theme.cardBorder, borderRadius: "10px", padding: "16px", background: "#FFFFFF" }}>
                <h4 style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 700, color: theme.textPrimary, margin: "0 0 4px 0" }}>{tmpl.name}</h4>
                <div style={{ fontSize: "13px", color: theme.accent, fontWeight: 600, marginBottom: "8px" }}>{tmpl.subject}</div>
                <div style={{ fontSize: "12px", color: theme.textSecondary, whiteSpace: "pre-wrap", background: "#F8FAFC", padding: "10px", borderRadius: "8px", border: "1px solid #E3E6EA" }}>
                  {tmpl.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LOG */}
      {activeTab === "log" && (
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
              <MessageSquare size={18} style={{ color: theme.accent }} /> Sent Communications History Log
            </span>
            <input
              type="text"
              placeholder="Search log..."
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              style={{
                width: "220px",
                padding: "9px 13px",
                background: "#FFFFFF",
                border: "1.5px solid #E3E6EA",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#1A202C",
                outline: "none",
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxSizing: "border-box"
              }}
              onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
            <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA" }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Date Sent</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Sent By</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Recipient Group</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Channel</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Subject / Preview</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {log.date}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {log.sentBy}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {log.recipientGroup}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      <span style={{ background: theme.accentLight, color: theme.accentDark, border: '1px solid #BEE3F8', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                        {log.channel}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      <strong style={{ fontSize: "13px", color: theme.textPrimary }}>{log.subject}</strong>
                      <div style={{ fontSize: "12px", color: theme.textMuted }}>{log.preview}</div>
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      <span style={{ background: theme.successLight, color: theme.success, border: '1px solid ' + theme.successBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38A169', display: 'inline-block' }} />
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Template Modal */}
      {showTmplModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "500px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowTmplModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Create Communication Template</h3>
            <form onSubmit={handleAddTemplate}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Template Name</label>
                <input
                  type="text"
                  required
                  value={tmplForm.name}
                  onChange={(e) => setTmplForm({ ...tmplForm, name: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Subject Line</label>
                <input
                  type="text"
                  required
                  value={tmplForm.subject}
                  onChange={(e) => setTmplForm({ ...tmplForm, subject: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Template Body</label>
                <textarea
                  rows="4"
                  required
                  value={tmplForm.body}
                  onChange={(e) => setTmplForm({ ...tmplForm, body: e.target.value })}
                  style={{
                    width: "100%", padding: "10px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", resize: "vertical", minHeight: "120px", lineHeight: "1.6", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setShowTmplModal(false)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}>Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk WhatsApp Announcement Modal */}
      {bulkAncModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "540px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setBulkAncModal(null)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Send Announcement to Parents via WhatsApp</h3>
            <div>
              <div style={{ background: "#F8FAFC", border: "1px solid #E3E6EA", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                <strong style={{ fontSize: "14px", color: theme.textPrimary }}>{bulkAncModal.title}</strong>
                <p style={{ fontSize: "12px", color: theme.textSecondary, margin: "4px 0 0 0" }}>{bulkAncModal.body}</p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: theme.textPrimary }}>Select Recipients ({selectedStudentIds.length} selected)</span>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  style={{ background: "none", border: "none", color: theme.accent, cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                >
                  {selectedStudentIds.length === activeStudents.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px" }}>
                {activeStudents.map((st) => {
                  const isChecked = selectedStudentIds.includes(st.id);
                  return (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSelectStudent(st.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: isChecked ? theme.accentLight : "#FFF",
                        marginBottom: "4px"
                      }}
                    >
                      {isChecked ? <CheckSquare size={16} style={{ color: theme.accent }} /> : <Square size={16} style={{ color: theme.textMuted }} />}
                      <div style={{ fontSize: "13px" }}>
                        <strong style={{ color: theme.textPrimary }}>{st.name}</strong> <span style={{ color: theme.textMuted, fontSize: "12px" }}>({st.batch})</span>
                        <div style={{ fontSize: "11px", color: theme.textMuted }}>Parent Contact: {st.parentPhone || st.phone || "N/A"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: "16px", padding: "10px 12px", background: theme.warningLight, border: "1px solid " + theme.warningBorder, borderRadius: "8px", fontSize: "12px", color: theme.warning, fontStyle: "italic" }}>
                Note: Each link will open separately. Your browser may ask to allow pop-ups — please allow them.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
              <button type="button" onClick={() => setBulkAncModal(null)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button
                type="button"
                onClick={handleDispatchBulkWhatsApp}
                style={{ background: "#25D366", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                Open WhatsApp Links ({selectedStudentIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
