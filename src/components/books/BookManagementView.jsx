import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { PrintJobKanban } from "./PrintJobKanban";
import { BookOpen, FileCheck, Printer, Users, Plus, AlertTriangle, Eye, Check } from "lucide-react";

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

export const BookManagementView = ({ initialTab = "catalogue", isMobile }) => {
  const isMobileState = isMobile !== undefined ? isMobile : (window.innerWidth < 768);
  const { data, setData, currentUser, submitBookRequisition, approveBookRequisition, exportToCSV } = useApp();

  const getInitialTab = () => {
    if (initialTab === "printing" || initialTab === "printingQueue") return "printing";
    if (initialTab === "catalogue" || initialTab === "textbookCatalogue") return "catalogue";
    return currentUser.role === "Printing Staff" ? "printing" : "catalogue";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
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
    issuedOn: new Date().toISOString().split("T")[0],
    notes: "",
    status: "pending_distribution"
  });

  // Persistent bookIssues state (synced with pba_book_issues in localStorage)
  const [bookIssues, setBookIssues] = useState(() => {
    const raw = safeLS("pba_book_issues", []);
    if (raw.length > 0) {
      // Normalize existing issues to remove returned/overdue workflow
      return raw.map((i) => ({
        id: i.id || "bi-" + Date.now(),
        studentId: i.studentId || "stu-1",
        studentName: i.studentName || "Student",
        bookId: i.bookId || "bk-1",
        bookTitle: i.bookTitle || "Textbook",
        subjectId: i.subjectId || "sub-1",
        subjectCode: i.subjectCode || "BS",
        batchId: i.batchId || i.batchName || "Batch",
        batchName: i.batchName || i.batchId || "Batch",
        issuedOn: i.issuedOn || i.issuedAt || new Date().toISOString().split("T")[0],
        issuedBy: i.issuedBy || "Admin",
        notes: i.notes || "",
        status: i.status === "pending_distribution" ? "pending_distribution" : "issued"
      }));
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
        issuedOn: "2026-09-10",
        issuedBy: "Admin",
        notes: "Initial textbook issue",
        status: "issued"
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
        issuedOn: "2026-09-12",
        issuedBy: "Admin",
        notes: "Batch handout",
        status: "pending_distribution"
      }
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    saveLS("pba_book_issues", bookIssues);
  }, [bookIssues]);

  // Sync with storage window event so ready stage from PrintJobKanban updates immediately
  useEffect(() => {
    const handleStorageChange = () => {
      const updated = safeLS("pba_book_issues", []);
      if (updated.length > 0) {
        setBookIssues(updated.map(i => ({
          ...i,
          status: i.status === "pending_distribution" ? "pending_distribution" : "issued"
        })));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Sync when activeTab changes to issues
  useEffect(() => {
    if (activeTab === "issues") {
      const updated = safeLS("pba_book_issues", []);
      if (updated.length > 0) {
        setBookIssues(updated.map(i => ({
          ...i,
          status: i.status === "pending_distribution" ? "pending_distribution" : "issued"
        })));
      }
    }
  }, [activeTab]);

  // Issue tab filters
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
    const std = data.students.find((s) => s.id === issueForm.studentId) || data.students[0];
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
      issuedOn: issueForm.issuedOn || new Date().toISOString().split("T")[0],
      issuedBy: currentUser?.name || "Admin",
      notes: issueForm.notes || "",
      status: issueForm.status || "pending_distribution"
    };

    const updated = [newIssue, ...bookIssues];
    setBookIssues(updated);
    saveLS("pba_book_issues", updated);
    setShowIssueModal(false);
  };

  const handleMarkIssued = (issueId) => {
    const today = new Date().toISOString().split("T")[0];
    const updated = bookIssues.map((bi) =>
      bi.id === issueId ? { ...bi, status: "issued", issuedOn: bi.issuedOn || today } : bi
    );
    setBookIssues(updated);
    saveLS("pba_book_issues", updated);
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
          marginBottom: "20px",
          flexWrap: isMobileState ? "wrap" : "nowrap"
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

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
            <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
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

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
            <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
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
                {data.bookRequisitions.map((req) => {
                  // Find matching print job status if approved
                  const matchingJob = (data.printJobs || []).find(
                    (j) => j.bookTitle === req.bookTitle && j.batch === req.batch
                  );
                  const isJobCompleted = matchingJob && (matchingJob.status === "completed" || matchingJob.status === "Completed");

                  return (
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
                                background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Approve & Print
                            </button>
                          ) : isJobCompleted ? (
                            <span style={{ color: '#276749', fontSize: '11px', fontWeight: 600 }}>✓ Completed</span>
                          ) : (
                            <span style={{ color: '#718096', fontSize: '11px', fontWeight: 600 }}>● In Queue</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRINTING QUEUE KANBAN */}
      {activeTab === "printing" && <PrintJobKanban isMobile={isMobileState} />}

      {/* TAB 4: STUDENT BOOK ISSUES */}
      {activeTab === "issues" && (() => {
        const totalIssued = bookIssues.filter((bi) => bi.status === "issued").length;
        const pendingDistribution = bookIssues.filter((bi) => bi.status === "pending_distribution").length;

        const currentMonth = new Date().toISOString().slice(0, 7);
        const issuedThisMonth = bookIssues.filter((bi) => bi.status === "issued" && bi.issuedOn && bi.issuedOn.startsWith(currentMonth)).length;

        const distinctStudentsCount = new Set(bookIssues.map((bi) => bi.studentId)).size;

        const filteredIssues = bookIssues.filter((bi) => {
          if (issueFilterBatch !== "All" && bi.batchName !== issueFilterBatch && bi.batchId !== issueFilterBatch) return false;
          if (issueFilterSubject !== "All" && bi.subjectId !== issueFilterSubject) return false;
          if (issueFilterStatus === "Pending" || issueFilterStatus === "pending_distribution") {
            if (bi.status !== "pending_distribution") return false;
          }
          if (issueFilterStatus === "Issued" || issueFilterStatus === "issued") {
            if (bi.status !== "issued") return false;
          }
          return true;
        });

        return (
          <div>
            {/* 4 SUMMARY TILES (FIX 2) */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobileState ? '1fr' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#4F46E5', fontFamily: "'Sora',sans-serif" }}>{totalIssued}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Total Books Issued</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: pendingDistribution > 0 ? '#C53030' : '#B7860A', fontFamily: "'Sora',sans-serif" }}>{pendingDistribution}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Pending Distribution</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#276749', fontFamily: "'Sora',sans-serif" }}>{issuedThisMonth}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Issued This Month</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#2B6CB0', fontFamily: "'Sora',sans-serif" }}>{distinctStudentsCount}</div>
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

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    <option value="pending_distribution">Pending Distribution</option>
                    <option value="issued">Issued</option>
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

              {/* STUDENT BOOK DISTRIBUTION LOG TABLE (FIX 1) */}
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
                <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F8F9FA" }}>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Student</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Book Title</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Subject</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Batch</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Issued On</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Issued By</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((iss) => {
                      const isPending = iss.status === "pending_distribution";
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
                            {iss.issuedOn || "—"}
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                            {iss.issuedBy || "Staff"}
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                            {isPending ? (
                              <span style={{ background: '#FEF3C7', color: '#B7860A', border: '1px solid #F6D860', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                                ⏳ Pending
                              </span>
                            ) : (
                              <span style={{ background: '#F0FFF4', color: '#276749', border: '1px solid #9AE6B4', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                                ✓ Issued
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                            {isPending ? (
                              <button
                                onClick={() => handleMarkIssued(iss.id)}
                                style={{
                                  padding: '5px 12px', background: '#4F46E5', color: 'white',
                                  border: 'none', borderRadius: '6px', fontSize: '11px',
                                  fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                <Check size={12} /> Mark Issued
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedIssueDetail(iss)}
                                style={{
                                  padding: '5px 12px', background: 'transparent', color: '#718096',
                                  border: '1px solid #E3E6EA', borderRadius: '6px', fontSize: '11px',
                                  fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                <Eye size={12} /> View
                              </button>
                            )}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "500px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
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
                    width: "100%", padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", cursor: "pointer", boxSizing: "border-box"
                  }}
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
                    width: "100%", padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", cursor: "pointer", boxSizing: "border-box"
                  }}
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
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", boxSizing: "border-box"
                  }}
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
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", boxSizing: "border-box"
                  }}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "520px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
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
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", boxSizing: "border-box"
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

      {/* Issue Book Modal (FIX 3 - Removed Due Date) */}
      {showIssueModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "520px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
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

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Issued On</label>
                <input
                  type="date"
                  value={issueForm.issuedOn}
                  onChange={(e) => setIssueForm({ ...issueForm, issuedOn: e.target.value })}
                  style={{ width: "100%", padding: "9px 13px", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px" }}
                />
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

      {/* Selected Issue Detail Modal */}
      {selectedIssueDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "480px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setSelectedIssueDetail(null)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Book Issue Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#2D3748' }}>
              <div><strong>Student:</strong> {selectedIssueDetail.studentName}</div>
              <div><strong>Book Title:</strong> {selectedIssueDetail.bookTitle}</div>
              <div><strong>Batch:</strong> {selectedIssueDetail.batchName}</div>
              <div><strong>Issued On:</strong> {selectedIssueDetail.issuedOn || "—"}</div>
              <div><strong>Issued By:</strong> {selectedIssueDetail.issuedBy || "Staff"}</div>
              <div>
                <strong>Status: </strong>
                {selectedIssueDetail.status === "pending_distribution" ? (
                  <span style={{ background: '#FEF3C7', color: '#B7860A', border: '1px solid #F6D860', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>⏳ Pending</span>
                ) : (
                  <span style={{ background: '#F0FFF4', color: '#276749', border: '1px solid #9AE6B4', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>✓ Issued</span>
                )}
              </div>
              {selectedIssueDetail.notes && (
                <div><strong>Notes:</strong> {selectedIssueDetail.notes}</div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #F4F5F7" }}>
              <button onClick={() => setSelectedIssueDetail(null)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
