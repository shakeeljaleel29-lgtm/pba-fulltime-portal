import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Pencil, Trash2, Plus, Check, Layers, User, UserCheck } from "lucide-react";
import { getBranches } from "./GeneralAdminView";

const PRESET_COLORS = [
  "#2F855A", // Green
  "#2B6CB0", // Blue
  "#6B46C1", // Purple
  "#C53030", // Red
  "#D4A017", // Gold
  "#B7791F", // Amber
  "#319795", // Teal
  "#DD6B20"  // Orange
];

export const SubjectRegistryTab = ({ isMobile }) => {
  const isMobileState = isMobile !== undefined ? isMobile : (window.innerWidth < 768);
  const { data, addSubject, updateSubject, assignBatchLecturers, currentUser, showToast } = useApp();

  // Subject Modal State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjForm, setSubjForm] = useState({
    code: "",
    name: "",
    stream: "Science",
    color: "#2F855A"
  });

  // Batch Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingBatchAssign, setEditingBatchAssign] = useState(null);

  // Assignment modal state structure: { batchId, batchName, branch, assignments: { [subjId]: { selected: bool, mainLecturerId, mainLecturerName, assistantLecturerId, assistantLecturerName, hasAssistant } } }
  const [assignForm, setAssignForm] = useState({
    batchId: "batch-001",
    batchName: "Batch 2024-A (A/L Commerce)",
    branch: "Kohuwala",
    assignments: {}
  });

  const subjects = data.subjects || [];
  const batchSubjects = data.batchSubjects || [];

  // Available Lecturers list from data.lecturers + userAccounts (role: Lecturer)
  const lecturerList = Array.from(
    new Map(
      [
        ...(data.lecturers || []).map((l) => [l.id, { id: l.id, name: l.name }]),
        ...(data.userAccounts || [])
          .filter((u) => u.role === "Lecturer")
          .map((u) => [u.id, { id: u.id, name: u.name }])
      ]
    ).values()
  );

  // Available batches list from students & existing batchSubjects
  const availableBatches = Array.from(
    new Set([
      "Batch 2024-A (A/L Commerce)",
      "Batch 2024-B (A/L Commerce)",
      "Batch 2025-A (A/L Commerce)",
      "Batch 2024-Sci-Kohuwala",
      "Batch 2024-Sci-Wattala",
      "Batch 2024-Sci-Panadura",
      ...(data.students || []).map((s) => s.batch).filter(Boolean),
      ...batchSubjects.map((b) => b.batchName).filter(Boolean)
    ])
  );

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjForm({ code: "", name: "", stream: "Science", color: "#2F855A" });
    setShowSubjectModal(true);
  };

  const handleOpenEditSubject = (subj) => {
    setEditingSubject(subj);
    setSubjForm({
      code: subj.code,
      name: subj.name,
      stream: subj.stream || "Science",
      color: subj.color || "#2B6CB0"
    });
    setShowSubjectModal(true);
  };

  const handleSaveSubject = (e) => {
    e.preventDefault();
    if (!subjForm.code || !subjForm.name) return;

    if (editingSubject) {
      updateSubject(editingSubject.id, subjForm);
    } else {
      addSubject(subjForm);
    }
    setShowSubjectModal(false);
  };

  const handleDeleteSubject = (subj) => {
    if (window.confirm(`Are you sure you want to delete "${subj.code} - ${subj.name}"?`)) {
      deleteSubject(subj.id);
    }
  };

  const handleOpenAssignModal = (batchAssignObj = null) => {
    const initialAssignments = {};

    subjects.forEach((s) => {
      initialAssignments[s.id] = {
        selected: false,
        mainLecturerId: "",
        mainLecturerName: "",
        assistantLecturerId: "",
        assistantLecturerName: "",
        hasAssistant: false
      };
    });

    if (batchAssignObj) {
      setEditingBatchAssign(batchAssignObj);
      (batchAssignObj.subjectAssignments || []).forEach((sa) => {
        if (initialAssignments[sa.subjectId]) {
          initialAssignments[sa.subjectId] = {
            selected: true,
            mainLecturerId: sa.mainLecturerId || "",
            mainLecturerName: sa.mainLecturerName || "",
            assistantLecturerId: sa.assistantLecturerId || "",
            assistantLecturerName: sa.assistantLecturerName || "",
            hasAssistant: !!sa.hasAssistant
          };
        }
      });

      setAssignForm({
        batchId: batchAssignObj.batchId,
        batchName: batchAssignObj.batchName,
        branch: batchAssignObj.branch || "Kohuwala",
        assignments: initialAssignments
      });
    } else {
      setEditingBatchAssign(null);
      const defaultBatch = availableBatches[0] || "Batch 2024-A (A/L Commerce)";
      setAssignForm({
        batchId: "batch-" + Date.now(),
        batchName: defaultBatch,
        branch: effectiveBranch === "All" ? "Kohuwala" : effectiveBranch,
        assignments: initialAssignments
      });
    }
    setShowAssignModal(true);
  };

  const handleToggleSubjectSelection = (subjId, checked) => {
    setAssignForm((prev) => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [subjId]: {
          ...(prev.assignments[subjId] || {}),
          selected: checked
        }
      }
    }));
  };

  const handleMainLecturerChange = (subjId, lecId) => {
    const lecObj = lecturerList.find((l) => l.id === lecId);
    setAssignForm((prev) => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [subjId]: {
          ...(prev.assignments[subjId] || {}),
          mainLecturerId: lecId,
          mainLecturerName: lecObj ? lecObj.name : ""
        }
      }
    }));
  };

  const handleHasAssistantToggle = (subjId, checked) => {
    setAssignForm((prev) => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [subjId]: {
          ...(prev.assignments[subjId] || {}),
          hasAssistant: checked,
          assistantLecturerId: checked ? prev.assignments[subjId]?.assistantLecturerId : "",
          assistantLecturerName: checked ? prev.assignments[subjId]?.assistantLecturerName : ""
        }
      }
    }));
  };

  const handleAssistantLecturerChange = (subjId, lecId) => {
    const lecObj = lecturerList.find((l) => l.id === lecId);
    setAssignForm((prev) => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [subjId]: {
          ...(prev.assignments[subjId] || {}),
          assistantLecturerId: lecId,
          assistantLecturerName: lecObj ? lecObj.name : ""
        }
      }
    }));
  };

  const handleSaveBatchAssignment = (e) => {
    e.preventDefault();
    if (!assignForm.batchName) return;

    const formattedAssignments = [];
    Object.entries(assignForm.assignments).forEach(([subjId, sa]) => {
      if (sa.selected) {
        const sObj = subjects.find((s) => s.id === subjId) || { name: "Subject", code: "SUBJ" };
        formattedAssignments.push({
          subjectId: subjId,
          subjectName: sObj.name,
          subjectCode: sObj.code,
          mainLecturerId: sa.mainLecturerId || null,
          mainLecturerName: sa.mainLecturerName || null,
          assistantLecturerId: sa.hasAssistant ? (sa.assistantLecturerId || null) : null,
          assistantLecturerName: sa.hasAssistant ? (sa.assistantLecturerName || null) : null,
          hasAssistant: !!sa.hasAssistant,
          classesPerWeek: sa.hasAssistant ? 2 : 1,
          classSchedule: []
        });
      }
    });

    assignBatchSubjects(
      assignForm.batchId,
      assignForm.batchName,
      formattedAssignments,
      assignForm.branch
    );
    setShowAssignModal(false);
  };

  return (
    <div>
      {/* 1. HEADER ROW */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A202C', margin: 0 }}>
            Subject Registry
          </h3>
          <p style={{ fontSize: '12px', color: '#718096', margin: '2px 0 0' }}>
            Manage subjects offered across all batches and streams
          </p>
        </div>
        <button
          onClick={handleOpenAddSubject}
          style={{
            padding: '9px 16px',
            background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontFamily: "'Inter',sans-serif",
            boxShadow: '0 2px 8px rgba(43,108,176,0.25)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Subject
        </button>
      </div>

      {/* 2. SUBJECTS TABLE */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E3E6EA",
          borderRadius: "14px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          overflow: "hidden",
          marginBottom: "32px"
        }}
      >
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
          <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8F9FA" }}>
                <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'left', whiteSpace: 'nowrap' }}>Code</th>
                <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'left', whiteSpace: 'nowrap' }}>Subject Name</th>
                <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'left', whiteSpace: 'nowrap' }}>Stream</th>
                <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'left', whiteSpace: 'nowrap' }}>Color Tag</th>
                <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subj) => (
                <tr
                  key={subj.id}
                  style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                    <span style={{
                      background: (subj.color || "#2B6CB0") + '20',
                      color: subj.color || "#2B6CB0",
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${subj.color || "#2B6CB0"}40`
                    }}>
                      {subj.code}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#1A202C', borderBottom: '1px solid #F4F5F7' }}>
                    {subj.name}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                    <span style={{
                      background: "#EDF2F7",
                      color: "#4A5568",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "6px"
                    }}>
                      {subj.stream}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: subj.color || "#2B6CB0",
                        display: "inline-block",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                      }} />
                      <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#718096" }}>
                        {subj.color}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7', textAlign: 'right' }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                      <button
                        onClick={() => handleOpenEditSubject(subj)}
                        title="Edit Subject"
                        style={{
                          background: "#EBF4FF",
                          color: "#2B6CB0",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subj)}
                        title="Delete Subject"
                        style={{
                          background: "#FFF5F5",
                          color: "#C53030",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#A0AEC0", fontSize: "13px" }}>
                    No subjects registered yet. Click "Add Subject" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. BATCH-SUBJECT ASSIGNMENT SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '15px', fontWeight: 700, color: '#1A202C', margin: 0 }}>
            Batch → Subject Assignments
          </h3>
          <p style={{ fontSize: '12px', color: '#718096', margin: '2px 0 0' }}>
            Configure main & assistant lecturers per subject for each batch
          </p>
        </div>
        <button
          onClick={() => handleOpenAssignModal(null)}
          style={{
            padding: '8px 14px',
            background: '#FFFFFF',
            border: '1.5px solid #E3E6EA',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#2B6CB0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            fontFamily: "'Inter',sans-serif"
          }}
        >
          <Layers size={14} /> Assign Subjects to Batch
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {batchSubjects.map((bs) => {
          const assignments = bs.subjectAssignments || [];

          return (
            <div
              key={bs.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E3E6EA',
                borderRadius: '12px',
                padding: '18px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontFamily: "'Sora',sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A202C' }}>
                    {bs.batchName}
                  </span>
                  <span style={{
                    background: '#EBF4FF',
                    color: '#2B6CB0',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {bs.branch || "Kohuwala"}
                  </span>
                </div>

                {/* Structured Subject Rows */}
                <div style={{ marginBottom: '14px' }}>
                  {assignments.map((sa) => {
                    const subjObj = subjects.find((s) => s.id === sa.subjectId) || { color: '#2B6CB0', code: sa.subjectCode, name: sa.subjectName };
                    const subjectColor = subjObj.color || '#2B6CB0';

                    return (
                      <div
                        key={sa.subjectId}
                        style={{
                          background: '#F8F9FB',
                          border: '1px solid #E3E6EA',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          marginBottom: '8px'
                        }}
                      >
                        {/* Subject identity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{
                            background: subjectColor + '20',
                            color: subjectColor,
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '20px'
                          }}>
                            {sa.subjectCode || subjObj.code}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A202C' }}>
                            {sa.subjectName || subjObj.name}
                          </span>
                          {sa.hasAssistant && (
                            <span style={{
                              background: '#EBF4FF',
                              color: '#2B6CB0',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '4px'
                            }}>
                              2 classes/week
                            </span>
                          )}
                        </div>

                        {/* Lecturer assignment row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {/* Main Lecturer */}
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                              Main Lecturer
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: '#EBF4FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2B6CB0" strokeWidth="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                              </div>
                              <span style={{ fontSize: '12px', color: '#1A202C', fontWeight: 600 }}>
                                {sa.mainLecturerName || 'Not assigned'}
                              </span>
                            </div>
                          </div>

                          {/* Assistant Lecturer */}
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                              Assistant Lecturer
                            </div>
                            {sa.hasAssistant ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: '#FEF3C7',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                  </svg>
                                </div>
                                <span style={{ fontSize: '12px', color: '#1A202C', fontWeight: 600 }}>
                                  {sa.assistantLecturerName || 'Not assigned'}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#A0AEC0', fontStyle: 'italic' }}>
                                No assistant
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {assignments.length === 0 && (
                    <span style={{ fontSize: '12px', color: '#A0AEC0', fontStyle: 'italic' }}>
                      No subject assignments configured yet
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #F4F5F7' }}>
                <button
                  onClick={() => handleOpenAssignModal(bs)}
                  style={{
                    background: '#FFFFFF',
                    color: '#4A5568',
                    border: '1px solid #E3E6EA',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Pencil size={12} /> Edit Assignments
                </button>
              </div>
            </div>
          );
        })}

        {batchSubjects.length === 0 && (
          <div style={{ gridColumn: '1 / -1', background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#A0AEC0', fontSize: '13px' }}>
            No batch subject assignments configured yet. Click "Assign Subjects to Batch" above.
          </div>
        )}
      </div>

      {/* 3. ADD / EDIT SUBJECT MODAL */}
      {showSubjectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "480px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowSubjectModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>
              {editingSubject ? "Edit Subject" : "Add New Subject"}
            </h3>

            <form onSubmit={handleSaveSubject}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>
                  Subject Code (Short Abbreviation)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIO, CHEM, ACC"
                  value={subjForm.code}
                  onChange={(e) => setSubjForm({ ...subjForm, code: e.target.value.toUpperCase() })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', sans-serif"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>
                  Full Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biology, Accounting, ICT"
                  value={subjForm.name}
                  onChange={(e) => setSubjForm({ ...subjForm, name: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', sans-serif"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>
                  Stream Category
                </label>
                <select
                  value={subjForm.stream}
                  onChange={(e) => setSubjForm({ ...subjForm, stream: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer"
                  }}
                >
                  <option value="Science">Science</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Maths">Maths</option>
                  <option value="Technology">Technology</option>
                  <option value="Arts">Arts</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
                  Display Color Tag
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {PRESET_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setSubjForm({ ...subjForm, color: hex })}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: hex,
                        border: subjForm.color === hex ? "2.5px solid #1A202C" : "1.5px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.15)"
                      }}
                    >
                      {subjForm.color === hex && <Check size={14} style={{ color: "#FFF" }} />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={subjForm.color}
                    onChange={(e) => setSubjForm({ ...subjForm, color: e.target.value })}
                    style={{ width: "32px", height: "32px", border: "none", background: "none", cursor: "pointer" }}
                    title="Custom Color"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setShowSubjectModal(false)} style={{ background: "#FFFFFF", color: "#4A5568", border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}>
                  {editingSubject ? "Save Changes" : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUBJECT ASSIGNMENT MODAL (MAIN & ASSISTANT LECTURERS) */}
      {showAssignModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "560px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowAssignModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>
              {editingBatchAssign ? "Edit Batch Subject & Lecturer Assignments" : "Assign Subjects & Lecturers to Batch"}
            </h3>

            <form onSubmit={handleSaveBatchAssignment}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>
                  Select Batch / Group
                </label>
                <select
                  value={assignForm.batchName}
                  onChange={(e) => setAssignForm({ ...assignForm, batchName: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer"
                  }}
                >
                  {availableBatches.map((bName) => (
                    <option key={bName} value={bName}>{bName}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>
                  Branch Location
                </label>
                <select
                  value={assignForm.branch}
                  onChange={(e) => setAssignForm({ ...assignForm, branch: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer"
                  }}
                >
                  {getBranches().map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* SUBJECT ASSIGNMENTS LIST */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
                  Configure Subjects & Lecturers
                </label>
                <div style={{ maxHeight: "300px", overflowY: "auto", border: "1.5px solid #E3E6EA", borderRadius: "8px", padding: "12px" }}>
                  {subjects.map((subj) => {
                    const sa = assignForm.assignments[subj.id] || { selected: false, mainLecturerId: "", hasAssistant: false, assistantLecturerId: "" };

                    return (
                      <div key={subj.id} style={{ marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid #F4F5F7" }}>
                        {/* Subject Header & Checkbox */}
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "8px" }}>
                          <input
                            type="checkbox"
                            checked={sa.selected}
                            onChange={(e) => handleToggleSubjectSelection(subj.id, e.target.checked)}
                            style={{ width: "16px", height: "16px", accentColor: "#2B6CB0" }}
                          />
                          <span style={{
                            background: (subj.color || "#2B6CB0") + "20",
                            color: subj.color || "#2B6CB0",
                            fontSize: "11px",
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: "4px"
                          }}>
                            {subj.code}
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A202C" }}>
                            {subj.name}
                          </span>
                        </label>

                        {/* Lecturer Selection when subject is checked */}
                        {sa.selected && (
                          <div style={{ paddingLeft: "26px", marginTop: "8px" }}>
                            {/* Main Lecturer Selector */}
                            <div style={{ marginBottom: "8px" }}>
                              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>
                                Main Lecturer
                              </label>
                              <select
                                value={sa.mainLecturerId}
                                onChange={(e) => handleMainLecturerChange(subj.id, e.target.value)}
                                style={{
                                  width: "100%", padding: "7px 30px 7px 10px", background: "#FFFFFF", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px", color: "#1A202C", outline: "none", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", cursor: "pointer"
                                }}
                              >
                                <option value="">Select main lecturer...</option>
                                {lecturerList.map((l) => (
                                  <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Has Assistant Toggle */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: '8px 0' }}>
                              <input
                                type="checkbox"
                                checked={sa.hasAssistant}
                                onChange={(e) => handleHasAssistantToggle(subj.id, e.target.checked)}
                                style={{ width: '14px', height: '14px', accentColor: '#2B6CB0' }}
                              />
                              <span style={{ fontSize: '12px', color: '#1A202C', fontWeight: 600 }}>
                                This subject has an assistant lecturer (2 classes per week)
                              </span>
                            </label>

                            {/* Assistant Lecturer Selector */}
                            {sa.hasAssistant && (
                              <div style={{ marginTop: "6px" }}>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#718096", textTransform: "uppercase", marginBottom: "4px" }}>
                                  Assistant Lecturer
                                </label>
                                <select
                                  value={sa.assistantLecturerId}
                                  onChange={(e) => handleAssistantLecturerChange(subj.id, e.target.value)}
                                  style={{
                                    width: "100%", padding: "7px 30px 7px 10px", background: "#FFFFFF", border: "1px solid #E3E6EA", borderRadius: "6px", fontSize: "12px", color: "#1A202C", outline: "none", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", cursor: "pointer"
                                  }}
                                >
                                  <option value="">Select assistant lecturer...</option>
                                  {lecturerList
                                    .filter((l) => l.id !== sa.mainLecturerId)
                                    .map((l) => (
                                      <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '11px', color: '#718096', margin: '4px 0 0' }}>
                                  Main lecturer teaches Class 1 each week; assistant teaches Class 2.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setShowAssignModal(false)} style={{ background: "#FFFFFF", color: "#4A5568", border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}>Save Assignments</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
