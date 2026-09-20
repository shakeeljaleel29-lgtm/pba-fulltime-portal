import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { PrintJobKanban } from "./PrintJobKanban";
import { BookOpen, FileCheck, Printer, Users, Plus, AlertTriangle } from "lucide-react";

import { T, theme, type as t } from "../../theme";

export const BookManagementView = ({ initialTab }) => {
  const { data, setData, currentUser, submitBookRequisition, approveBookRequisition } = useApp();

  const getInitialTab = () => {
    if (initialTab === "printing" || initialTab === "printingQueue") return "printing";
    if (initialTab === "catalogue" || initialTab === "textbookCatalogue") return "catalogue";
    return currentUser.role === "Printing Staff" ? "printing" : "catalogue";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  React.useEffect(() => {
    if (initialTab === "printing" || initialTab === "printingQueue") {
      setActiveTab("printing");
    } else if (initialTab === "catalogue" || initialTab === "textbookCatalogue") {
      setActiveTab("catalogue");
    }
  }, [initialTab]);

  // Form states
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedIssueDetail, setSelectedIssueDetail] = useState(null);

  const [bookForm, setBookForm] = useState({
    title: "",
    subjectId: data.subjects[0]?.id || "",
    subject: data.subjects[0]?.name || "Business Studies",
    subjectCode: data.subjects[0]?.code || "BS",
    version: "2024 Ed.",
    stock: 20,
    applicableBatches: []
  });

  const [reqForm, setReqForm] = useState({
    bookTitle: data.books[0]?.title || "",
    subject: "Business Studies",
    batch: "Batch 2024-A (A/L Commerce)",
    quantity: 30,
    dateNeeded: ""
  });

  const [issueForm, setIssueForm] = useState({
    studentId: data.students[0]?.id || "",
    bookId: data.books[0]?.id || "",
    subjectId: data.subjects[0]?.id || "",
    issuedAt: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    condition: "Good",
    notes: ""
  });

  // Persistent bookIssues state (synced with pba_book_issues in localStorage)
  const [bookIssues, setBookIssues] = useState(() => {
    try {
      const saved = localStorage.getItem("pba_book_issues");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse pba_book_issues:", e);
    }
    return [
      {
        id: "bi-1",
        bookId: data.books[0]?.id || "bk-1",
        bookTitle: data.books[0]?.title || "PBA A/L Business Studies Guide Vol 1",
        studentId: data.students[0]?.id || "stu-1",
        studentName: data.students[0]?.name || "Kasun Jayawardena",
        batchId: "b-1",
        batchName: "Batch 2024-A (A/L Commerce)",
        subjectId: "sub-1",
        subjectCode: "BS",
        issuedAt: "2026-09-10",
        dueDate: "2026-10-10",
        returnedAt: null,
        condition: "Good",
        issuedBy: "Admin",
        notes: "Initial textbook issue"
      },
      {
        id: "bi-2",
        bookId: data.books[1]?.id || "bk-2",
        bookTitle: data.books[1]?.title || "PBA Financial Accounting Theory & Practice",
        studentId: data.students[1]?.id || "stu-2",
        studentName: data.students[1]?.name || "Anuki Samarasinghe",
        batchId: "b-1",
        batchName: "Batch 2024-A (A/L Commerce)",
        subjectId: "sub-2",
        subjectCode: "ACC",
        issuedAt: "2026-08-01",
        dueDate: "2026-09-01",
        returnedAt: "2026-08-30",
        condition: "Good",
        issuedBy: "Admin",
        notes: "Returned on time"
      }
    ];
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("pba_book_issues", JSON.stringify(bookIssues));
    } catch (e) {
      console.error("Failed saving pba_book_issues:", e);
    }
  }, [bookIssues]);

  // Issue tab filters
  const [issueFilterBranch, setIssueFilterBranch] = useState("All");
  const [issueFilterBatch, setIssueFilterBatch] = useState("All");
  const [issueFilterSubject, setIssueFilterSubject] = useState("All");
  const [issueFilterStatus, setIssueFilterStatus] = useState("All");

  const role = currentUser.role;
  const pendingReqCount = data.bookRequisitions.filter((r) => r.status === "Pending").length;
  const lowStockBooks = data.books.filter((b) => Number(b.stock) <= 10);

  const isReqLess2Weeks = () => {
    if (!reqForm.dateNeeded) return false;
    const needed = new Date(reqForm.dateNeeded);
    const today = new Date();
    const diff = Math.ceil((needed - today) / (1000 * 60 * 60 * 24));
    return diff < 14;
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    if (!bookForm.title) return;
    const subjObj = data.subjects.find((s) => s.id === bookForm.subjectId) || { code: "BS", name: bookForm.subject };
    const newBk = {
      id: "bk-" + Date.now(),
      title: bookForm.title,
      subject: subjObj.name,
      subjectId: subjObj.id,
      subjectCode: subjObj.code,
      version: bookForm.version || "2024 Ed.",
      stock: Number(bookForm.stock) || 20,
      applicableBatches: bookForm.applicableBatches || []
    };
    setData((prev) => ({ ...prev, books: [...prev.books, newBk] }));
    setShowAddBookModal(false);
  };

  const handleSubmitReq = (e) => {
    e.preventDefault();
    if (!reqForm.dateNeeded) return;
    submitBookRequisition(reqForm);
    setShowReqModal(false);
  };

  const handleIssueBook = (e) => {
    e.preventDefault();
    const std = data.students.find((s) => s.id === issueForm.studentId);
    const bk = data.books.find((b) => b.id === issueForm.bookId) || data.books[0];
    const subj = data.subjects.find((s) => s.id === (issueForm.subjectId || bk?.subjectId)) || data.subjects[0];
    if (!std || !bk) return;

    const newIssue = {
      id: "bi-" + Date.now(),
      bookId: bk.id,
      bookTitle: bk.title,
      studentId: std.id,
      studentName: std.name,
      batchId: std.batch,
      batchName: std.batch,
      subjectId: subj?.id || "sub-1",
      subjectCode: subj?.code || "BS",
      issuedAt: issueForm.issuedAt,
      dueDate: issueForm.dueDate || null,
      returnedAt: null,
      condition: issueForm.condition || "Good",
      issuedBy: currentUser.name || "Admin",
      notes: issueForm.notes || ""
    };

    setBookIssues([newIssue, ...bookIssues]);
    setShowIssueModal(false);
  };

  const handleMarkReturned = (issueId) => {
    const today = new Date().toISOString().split("T")[0];
    const cond = window.prompt("Condition at return (Good / Fair / Damaged):", "Good");
    setBookIssues((prev) =>
      prev.map((bi) => (bi.id === issueId ? { ...bi, returnedAt: today, condition: cond || bi.condition } : bi))
    );
  };

  return (
    <div>
      {/* PATTERN B — Page Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: t.fontHeading, fontSize: '20px', fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            Textbook Catalogue & Printing Backlog
          </h2>
          <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
            Manage in-house publication stocks, printing requisitions, and student distribution logs.
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
        {role !== "Printing Staff" && (
          <>
            <button
              onClick={() => setActiveTab("catalogue")}
              style={{
                padding: "8px 18px",
                borderRadius: "7px",
                fontSize: "13px",
                fontWeight: activeTab === "catalogue" ? 600 : 500,
                color: activeTab === "catalogue" ? theme.accent : theme.textSecondary,
                border: "none",
                background: activeTab === "catalogue" ? "#FFFFFF" : "transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: activeTab === "catalogue" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <BookOpen size={16} /> Textbook Catalogue
            </button>
            <button
              onClick={() => setActiveTab("requisitions")}
              style={{
                padding: "8px 18px",
                borderRadius: "7px",
                fontSize: "13px",
                fontWeight: activeTab === "requisitions" ? 600 : 500,
                color: activeTab === "requisitions" ? theme.accent : theme.textSecondary,
                border: "none",
                background: activeTab === "requisitions" ? "#FFFFFF" : "transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: activeTab === "requisitions" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <FileCheck size={16} /> Requisitions
              {pendingReqCount > 0 && (
                <span
                  style={{
                    background: '#E53E3E',
                    color: '#FFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    marginLeft: '4px'
                  }}
                >
                  {pendingReqCount}
                </span>
              )}
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab("printing")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "printing" ? 600 : 500,
            color: activeTab === "printing" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "printing" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "printing" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Printer size={16} /> Printing Queue Board
        </button>
        {role !== "Printing Staff" && (
          <button
            onClick={() => setActiveTab("issues")}
            style={{
              padding: "8px 18px",
              borderRadius: "7px",
              fontSize: "13px",
              fontWeight: activeTab === "issues" ? 600 : 500,
              color: activeTab === "issues" ? theme.accent : theme.textSecondary,
              border: "none",
              background: activeTab === "issues" ? "#FFFFFF" : "transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: activeTab === "issues" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Users size={16} /> Student Book Issues
          </button>
        )}
      </div>

      {/* TAB 1: TEXTBOOK CATALOGUE */}
      {activeTab === "catalogue" && (
        <div
          style={{
            background: theme.cardBg,
            border: "1px solid " + theme.cardBorder,
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            overflow: "hidden"
          }}
        >
          {/* Low Stock Alert Banner */}
          {lowStockBooks.length > 0 && (
            <div style={{ background: '#FEF3C7', borderBottom: '1px solid #F6D860', padding: '12px 22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} style={{ color: '#D4A017' }} />
              <span style={{ fontSize: '13px', color: '#92600A', fontWeight: 600 }}>
                {lowStockBooks.length} textbook{lowStockBooks.length !== 1 ? 's are' : ' is'} running low on stock (≤ 10 copies). Consider creating a print requisition.
              </span>
            </div>
          )}

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
              <BookOpen size={18} style={{ color: theme.accent }} /> In-House Textbook Catalogue
            </span>
            {role === "Admin" && (
              <button
                onClick={() => setShowAddBookModal(true)}
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
                <Plus size={14} /> Add New Textbook
              </button>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA" }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Book Title</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Subject</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Applicable Batches</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Edition / Version</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Stock Available</th>
                </tr>
              </thead>
              <tbody>
                {data.books.map((bk) => {
                  const subjObj = data.subjects.find((s) => s.id === bk.subjectId || s.name === bk.subject);
                  const subjColor = subjObj?.color || '#2B6CB0';
                  const subjCode = bk.subjectCode || subjObj?.code || 'BS';
                  const stockNum = Number(bk.stock);

                  return (
                    <tr
                      key={bk.id}
                      style={{ transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                        {bk.title}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                        <span style={{
                          background: subjColor + '20', color: subjColor, border: `1px solid ${subjColor}40`,
                          padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px'
                        }}>
                          {subjCode} • {bk.subject}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {Array.isArray(bk.applicableBatches) && bk.applicableBatches.length > 0 ? (
                            bk.applicableBatches.map((bName, idx) => (
                              <span key={idx} style={{ background: '#EBF4FF', color: '#2B6CB0', border: '1px solid #BEE3F8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                                {bName}
                              </span>
                            ))
                          ) : (
                            <span style={{ background: '#F7FAFC', color: '#718096', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                              All Batches
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                        {bk.version}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                        {stockNum > 10 ? (
                          <span style={{ background: theme.successLight, color: theme.success, border: '1px solid ' + theme.successBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                            {stockNum} Copies
                          </span>
                        ) : stockNum > 0 ? (
                          <span style={{ background: theme.goldLight, color: theme.goldDark, border: '1px solid ' + theme.goldBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            {stockNum} Copies
                            <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#B7860A', border: '1px solid #F6D860', padding: '1px 5px', borderRadius: '4px', marginLeft: '4px' }}>Low Stock</span>
                          </span>
                        ) : (
                          <span style={{ background: theme.dangerLight, color: theme.danger, border: '1px solid ' + theme.dangerBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            0 Copies
                            <span style={{ fontSize: '10px', background: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2', padding: '1px 5px', borderRadius: '4px', marginLeft: '4px' }}>Out of Stock</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REQUISITIONS */}
      {activeTab === "requisitions" && (
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
              <FileCheck size={18} style={{ color: theme.accent }} /> Textbook Requisition Approvals
            </span>
            {(role === "Admin" || role === "Branch Coordinator" || role === "Lecturer") && (
              <button
                onClick={() => setShowReqModal(true)}
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
                <Plus size={14} /> Submit New Requisition
              </button>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA" }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Book Title</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Subject</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Batch</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Qty</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Date Needed</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Requested By</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Status</th>
                  {role === "Admin" && (
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.bookRequisitions.map((req) => (
                  <tr
                    key={req.id}
                    style={{
                      background: req.isUrgent && req.status === "Pending" ? theme.dangerLight : "transparent",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      if (!(req.isUrgent && req.status === "Pending")) e.currentTarget.style.background = "#F8FAFE";
                    }}
                    onMouseLeave={(e) => {
                      if (!(req.isUrgent && req.status === "Pending")) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {req.bookTitle}
                      {req.isUrgent && (
                        <span style={{ background: theme.dangerLight, color: theme.danger, border: '1px solid ' + theme.dangerBorder, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, marginLeft: '6px' }}>
                          Urgent (&lt;14 days)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.accent, fontWeight: 500, borderBottom: '1px solid #F4F5F7' }}>
                      {req.subject}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {req.batch}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {req.quantity}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {req.dateNeeded}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {req.requestedBy}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      {req.status === "Approved" ? (
                        <span style={{ background: theme.successLight, color: theme.success, border: '1px solid ' + theme.successBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38A169', display: 'inline-block' }} />
                          Approved
                        </span>
                      ) : (
                        <span style={{ background: theme.warningLight, color: theme.warning, border: '1px solid ' + theme.warningBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                          Pending
                        </span>
                      )}
                    </td>
                    {role === "Admin" && (
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                        {req.status === "Pending" ? (
                          <button
                            onClick={() => approveBookRequisition(req.id)}
                            style={{
                              background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Approve & Print
                          </button>
                        ) : (
                          <span style={{ fontSize: "12px", color: theme.success, fontWeight: 600 }}>In Queue</span>
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

      {/* TAB 3: PRINTING QUEUE KANBAN */}
      {activeTab === "printing" && <PrintJobKanban />}

      {/* TAB 4: STUDENT BOOK ISSUES */}
      {activeTab === "issues" && (() => {
        const currentlyIssuedCount = bookIssues.filter((bi) => !bi.returnedAt).length;
        const nowStr = new Date().toISOString().split("T")[0];
        const overdueCount = bookIssues.filter((bi) => !bi.returnedAt && bi.dueDate && bi.dueDate < nowStr).length;

        const currentMonth = new Date().toISOString().slice(0, 7);
        const returnedThisMonthCount = bookIssues.filter((bi) => bi.returnedAt && bi.returnedAt.startsWith(currentMonth)).length;

        const distinctStudentsCount = new Set(bookIssues.filter((bi) => !bi.returnedAt).map((bi) => bi.studentId)).size;

        const filteredIssues = bookIssues.filter((bi) => {
          if (issueFilterBatch !== "All" && bi.batchName !== issueFilterBatch) return false;
          if (issueFilterSubject !== "All" && bi.subjectId !== issueFilterSubject) return false;
          if (issueFilterStatus === "Issued" && (bi.returnedAt || (bi.dueDate && bi.dueDate < nowStr))) return false;
          if (issueFilterStatus === "Overdue" && (bi.returnedAt || !bi.dueDate || bi.dueDate >= nowStr)) return false;
          if (issueFilterStatus === "Returned" && !bi.returnedAt) return false;
          return true;
        });

        return (
          <div>
            {/* 4 SUMMARY TILES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#2B6CB0', fontFamily: "'Sora',sans-serif" }}>{currentlyIssuedCount}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Total Books Issued</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#C53030', fontFamily: "'Sora',sans-serif" }}>{overdueCount}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Overdue Books</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#2F855A', fontFamily: "'Sora',sans-serif" }}>{returnedThisMonthCount}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Returned This Month</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#2D3748', fontFamily: "'Sora',sans-serif" }}>{distinctStudentsCount}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Students with Books</div>
              </div>
            </div>

            {/* DISTRIBUTION TABLE CONTAINER */}
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
                  background: "#FFFFFF",
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Users size={18} style={{ color: theme.accent }} /> Student Book Distribution Log
                </span>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    value={issueFilterBatch}
                    onChange={(e) => setIssueFilterBatch(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '12px' }}
                  >
                    <option value="All">All Batches</option>
                    {data.batches.map((b) => (<option key={b.id} value={b.name}>{b.name}</option>))}
                  </select>

                  <select
                    value={issueFilterSubject}
                    onChange={(e) => setIssueFilterSubject(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '12px' }}
                  >
                    <option value="All">All Subjects</option>
                    {data.subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>

                  <select
                    value={issueFilterStatus}
                    onChange={(e) => setIssueFilterStatus(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '12px' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Issued">Currently Issued</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Returned">Returned</option>
                  </select>

                  {role === "Admin" && (
                    <button
                      onClick={() => setShowIssueModal(true)}
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
                      <Plus size={14} /> + Issue Book to Student
                    </button>
                  )}
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F8F9FA" }}>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Student</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Book Title</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Subject</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Batch</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Issued On</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Due Date</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((iss) => {
                      const isReturned = !!iss.returnedAt;
                      const isOverdue = !isReturned && iss.dueDate && iss.dueDate < nowStr;

                      const subjObj = data.subjects.find((s) => s.id === iss.subjectId);
                      const subjCode = iss.subjectCode || subjObj?.code || 'BS';

                      return (
                        <tr
                          key={iss.id}
                          style={{ transition: "background 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                            {iss.studentName}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                            {iss.bookTitle}
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                            <span style={{ background: '#EBF4FF', color: '#2B6CB0', border: '1px solid #BEE3F8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                              {subjCode}
                            </span>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                            {iss.batchName}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                            {iss.issuedAt}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                            {iss.dueDate || "—"}
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                            {isReturned ? (
                              <span style={{ background: theme.successLight, color: theme.success, border: '1px solid ' + theme.successBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                                Returned ({iss.returnedAt})
                              </span>
                            ) : isOverdue ? (
                              <span style={{ background: theme.dangerLight, color: theme.danger, border: '1px solid ' + theme.dangerBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                                Overdue
                              </span>
                            ) : (
                              <span style={{ background: '#EBF4FF', color: '#2B6CB0', border: '1px solid #BEE3F8', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                                Issued
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {!isReturned && (
                                <button
                                  onClick={() => handleMarkReturned(iss.id)}
                                  style={{ background: '#2F855A', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  Mark Returned
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedIssueDetail(iss)}
                                style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #CBD5E0', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
            {/* Submit Requisition Modal */}
      {showReqModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "500px", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowReqModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Submit Book Requisition</h3>
            <form onSubmit={handleSubmitReq}>
              {isReqLess2Weeks() && (
                <div style={{ backgroundColor: theme.dangerLight, border: "1px solid " + theme.dangerBorder, borderRadius: "8px", padding: "12px", display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
                  <AlertTriangle size={20} style={{ color: theme.danger }} />
                  <div style={{ fontSize: "12px", color: theme.danger, fontWeight: 600 }}>
                    Warning: This request is less than 2 weeks before the date needed. Admin approval is required.
                  </div>
                </div>
              )}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Select Book</label>
                <select
                  value={reqForm.bookTitle}
                  onChange={(e) => setReqForm({ ...reqForm, bookTitle: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                >
                  {data.books.map((b) => (<option key={b.id} value={b.title}>{b.title} ({b.subject})</option>))}
                </select>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Target Batch</label>
                <select
                  value={reqForm.batch}
                  onChange={(e) => setReqForm({ ...reqForm, batch: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                >
                  {data.batches.map((bt) => (<option key={bt.id} value={bt.name}>{bt.name}</option>))}
                </select>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Quantity Needed</label>
                <input
                  type="number"
                  required
                  value={reqForm.quantity}
                  onChange={(e) => setReqForm({ ...reqForm, quantity: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Date Needed By</label>
                <input
                  type="date"
                  required
                  value={reqForm.dateNeeded}
                  onChange={(e) => setReqForm({ ...reqForm, dateNeeded: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setShowReqModal(false)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}>Submit Requisition</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", maxHeight: '90vh', overflowY: 'auto', boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowAddBookModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Add New In-House Textbook</h3>
            <form onSubmit={handleAddBook}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Book Title</label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Associated Subject</label>
                <select
                  value={bookForm.subjectId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    const sb = data.subjects.find((s) => s.id === sid);
                    setBookForm({
                      ...bookForm,
                      subjectId: sid,
                      subject: sb ? sb.name : "",
                      subjectCode: sb ? sb.code : ""
                    });
                  }}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none"
                  }}
                >
                  <option value="">Select subject...</option>
                  {(data.subjects || []).map((sb) => (
                    <option key={sb.id} value={sb.id}>{sb.code} — {sb.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Applicable Batches</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', background: '#F8F9FB', padding: '12px', borderRadius: '8px', border: '1px solid #E3E6EA' }}>
                  {(data.batches || []).map((bt) => {
                    const isChecked = (bookForm.applicableBatches || []).includes(bt.name);
                    return (
                      <label key={bt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1A202C', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = bookForm.applicableBatches || [];
                            if (e.target.checked) {
                              setBookForm({ ...bookForm, applicableBatches: [...cur, bt.name] });
                            } else {
                              setBookForm({ ...bookForm, applicableBatches: cur.filter((b) => b !== bt.name) });
                            }
                          }}
                        />
                        {bt.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Initial Stock Count</label>
                <input
                  type="number"
                  value={bookForm.stock}
                  onChange={(e) => setBookForm({ ...bookForm, stock: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setShowAddBookModal(false)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}>Save Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", maxHeight: '90vh', overflowY: 'auto', boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowIssueModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Log Student Book Issue</h3>
            <form onSubmit={handleIssueBook}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Select Student</label>
                <select
                  value={issueForm.studentId}
                  onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none"
                  }}
                >
                  {data.students.map((st) => (<option key={st.id} value={st.id}>{st.name} ({st.regNo}) — {st.batch}</option>))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Select Textbook</label>
                <select
                  value={issueForm.bookId}
                  onChange={(e) => {
                    const bid = e.target.value;
                    const bk = data.books.find((b) => b.id === bid);
                    setIssueForm({
                      ...issueForm,
                      bookId: bid,
                      bookTitle: bk ? bk.title : issueForm.bookTitle,
                      subjectId: bk?.subjectId || issueForm.subjectId
                    });
                  }}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none"
                  }}
                >
                  {data.books.map((b) => (<option key={b.id} value={b.id}>{b.title} ({b.subject})</option>))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Subject</label>
                <select
                  value={issueForm.subjectId}
                  onChange={(e) => setIssueForm({ ...issueForm, subjectId: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none"
                  }}
                >
                  {(data.subjects || []).map((sb) => (<option key={sb.id} value={sb.id}>{sb.code} — {sb.name}</option>))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Issue Date</label>
                  <input
                    type="date"
                    value={issueForm.issuedAt}
                    onChange={(e) => setIssueForm({ ...issueForm, issuedAt: e.target.value })}
                    style={{ width: "100%", padding: "9px 13px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Due Date</label>
                  <input
                    type="date"
                    value={issueForm.dueDate}
                    onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                    style={{ width: "100%", padding: "9px 13px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Condition at Issue</label>
                <select
                  value={issueForm.condition || "Good"}
                  onChange={(e) => setIssueForm({ ...issueForm, condition: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none"
                  }}
                >
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Notes</label>
                <textarea
                  rows="2"
                  value={issueForm.notes || ""}
                  onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  style={{ width: "100%", padding: "9px 13px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setShowIssueModal(false)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}>Issue Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
