import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { FolderOpen, FileText, Plus, Printer } from "lucide-react";

import { T, theme, type as t } from "../../theme";

export const DocumentCentreView = () => {
  const { data, addDocument, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState("vault");

  // Template generator state
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState(data.students[0]?.id || "");
  const [customReason, setCustomReason] = useState("Repeated unexcused late arrivals.");
  const [customAmount, setCustomAmount] = useState("15,000");

  const [searchDoc, setSearchDoc] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [docForm, setDocForm] = useState({
    studentId: data.students[0]?.id || "",
    title: "",
    type: "Enrolment Form",
    notes: ""
  });

  const role = currentUser.role;

  const handleUploadDoc = (e) => {
    e.preventDefault();
    const st = data.students.find((s) => s.id === docForm.studentId);
    if (!st || !docForm.title) return;

    addDocument({
      studentId: st.id,
      studentName: st.name,
      title: docForm.title,
      type: docForm.type,
      notes: docForm.notes
    });

    setShowUploadModal(false);
  };

  const getGeneratedLetter = () => {
    const tmpl = data.letterTemplates[selectedTemplateIndex];
    const student = data.students.find((s) => s.id === selectedStudentId);
    if (!tmpl || !student) return "";

    let text = tmpl.content;
    text = text.replace(/\[STUDENT_NAME\]/g, student.name);
    text = text.replace(/\[BATCH\]/g, student.batch);
    text = text.replace(/\[DATE\]/g, new Date().toISOString().split("T")[0]);
    text = text.replace(/\[AMOUNT\]/g, customAmount);
    text = text.replace(/\[REASON\]/g, customReason);
    return text;
  };

  const filteredDocs = data.documents.filter(
    (d) =>
      d.studentName.toLowerCase().includes(searchDoc.toLowerCase()) ||
      d.title.toLowerCase().includes(searchDoc.toLowerCase()) ||
      d.type.toLowerCase().includes(searchDoc.toLowerCase())
  );

  return (
    <div>
      {/* PATTERN B — Page Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: t.fontHeading, fontSize: '20px', fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            Document Vault & Letter Generator
          </h2>
          <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
            Store student enrollment files and generate official academy letters.
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
          onClick={() => setActiveTab("vault")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "vault" ? 600 : 500,
            color: activeTab === "vault" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "vault" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "vault" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <FolderOpen size={16} /> Student Document Vault ({data.documents.length})
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
          <FileText size={16} /> Template Letter Generator
        </button>
      </div>

      {/* TAB 1: DOCUMENT VAULT */}
      {activeTab === "vault" && (
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
              <FolderOpen size={18} style={{ color: theme.accent }} /> Student Digital Document Vault
            </span>
            {role === "Admin" && (
              <button
                onClick={() => setShowUploadModal(true)}
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
                <Plus size={14} /> Upload Student Document
              </button>
            )}
          </div>

          <div style={{ padding: "16px 22px 0 22px" }}>
            <input
              type="text"
              placeholder="Search document title or student..."
              value={searchDoc}
              onChange={(e) => setSearchDoc(e.target.value)}
              style={{
                width: '280px',
                padding: '9px 13px',
                background: '#FFFFFF',
                border: '1.5px solid #E3E6EA',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#1A202C',
                outline: 'none',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxSizing: 'border-box'
              }}
              onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ padding: "16px 22px 22px 22px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA" }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Student Name</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Document Title</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Type</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Upload Date</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {doc.studentName}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {doc.title}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      <span style={{ background: theme.accentLight, color: theme.accentDark, border: '1px solid #BEE3F8', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                        {doc.type}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {doc.uploadDate}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {doc.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATE LETTERS */}
      {activeTab === "templates" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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
                <FileText size={18} style={{ color: theme.accent }} /> Letter Generator Controls
              </span>
            </div>

            <div style={{ padding: "20px 22px" }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Select Reusable Letter Template
                </label>
                <select
                  value={selectedTemplateIndex}
                  onChange={(e) => setSelectedTemplateIndex(parseInt(e.target.value))}
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
                  {data.letterTemplates.map((tmpl, i) => (
                    <option key={tmpl.id} value={i}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Select Target Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
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
                  {data.students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.batch})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Reason Tag Value [REASON]
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
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
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Amount Tag Value [AMOUNT]
                </label>
                <input
                  type="text"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
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
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          </div>

          {/* Letter Output Preview */}
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
                <Printer size={18} style={{ color: theme.success }} /> Generated Letter Output Preview
              </span>
              <button
                onClick={() => window.print()}
                style={{
                  background: 'linear-gradient(135deg, #D4A017, #B7860A)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(212,160,23,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={14} /> Print Letter PDF
              </button>
            </div>

            <div style={{ padding: "20px 22px" }}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: "24px",
                  borderRadius: "8px",
                  border: "1.5px solid #E3E6EA",
                  fontFamily: "Courier, monospace",
                  fontSize: "13px",
                  color: theme.textPrimary,
                  whiteSpace: "pre-wrap",
                  minHeight: "260px",
                  lineHeight: 1.6
                }}
              >
                {getGeneratedLetter()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 24px 64px rgba(0,0,0,0.20)', position: 'relative' }}>
            <button
              onClick={() => setShowUploadModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A202C', marginBottom: '16px' }}>
              Upload Student Document
            </h3>
            <form onSubmit={handleUploadDoc}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Select Student
                </label>
                <select
                  value={docForm.studentId}
                  onChange={(e) => setDocForm({ ...docForm, studentId: e.target.value })}
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
                  {data.students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.regNo})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
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
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Document Type
                </label>
                <select
                  value={docForm.type}
                  onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
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
                  <option value="Enrolment Form">Enrolment Form</option>
                  <option value="Consent Form">Consent Form</option>
                  <option value="Discipline Letter">Discipline Letter</option>
                  <option value="Medical Certificate">Medical Certificate</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Notes
                </label>
                <textarea
                  rows="2"
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
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
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F4F5F7' }}>
                <button type="button" style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #E3E6EA', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(43,108,176,0.30)' }}>
                  Save Document Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
