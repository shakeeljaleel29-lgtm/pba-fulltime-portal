import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";

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

const DEFAULT_SUBJECTS = [
  "Biology", "Physics", "Chemistry", "Mathematics",
  "Accounts", "Business Studies", "Economics",
  "English", "General Paper", "History"
];

const SEED_PRINT_JOBS = [
  {
    id: "PJ-2026-001",
    bookTitle: "Mathematics Textbook",
    subject: "Mathematics",
    batchId: "batch-1",
    batchName: "Cambridge O Level 2027",
    quantity: 40,
    notes: "Lecturer confirmed via email — urgent",
    requestedBy: "Dr. K. Liyanage",
    requestedAt: "2026-09-24T10:00:00Z",
    status: "queued",
    statusHistory: [
      {
        status: "queued",
        updatedBy: "Admin",
        updatedAt: "2026-09-24T10:00:00Z",
        note: ""
      }
    ],
    distributedAt: null,
    distributedBy: null
  }
];

export const PrintingQueueView = ({ isMobile }) => {
  const { currentUser } = useApp();

  // Print jobs state
  const [jobs, setJobs] = useState(() => {
    const stored = safeLS("pba_print_jobs", null);
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      saveLS("pba_print_jobs", SEED_PRINT_JOBS);
      return SEED_PRINT_JOBS;
    }
    return stored;
  });

  // Filter & search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // New Request Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({
    bookTitle: "",
    subject: "",
    batchId: "",
    batchName: "",
    quantity: 40,
    notes: ""
  });

  // View Details / History Modal state
  const [detailsModalJob, setDetailsModalJob] = useState(null);

  // Admin Override Modal state
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideJob, setOverrideJob] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideNote, setOverrideNote] = useState("");

  // Subjects & Batches for dropdowns
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);

  useEffect(() => {
    // Load subjects
    const rawSubs = safeLS("pba_subjects", []);
    let subs = [];
    if (Array.isArray(rawSubs) && rawSubs.length > 0) {
      subs = rawSubs.map((s) => (typeof s === "string" ? s : s.name || s.id)).filter(Boolean);
    }
    if (subs.length === 0) subs = DEFAULT_SUBJECTS;
    setAvailableSubjects(Array.from(new Set(subs)));

    // Load batches
    const rawBatches = safeLS("pba_batches", []);
    setAvailableBatches(Array.isArray(rawBatches) ? rawBatches : []);
  }, [showAddModal]);

  // Sync jobs from LS periodically (or when focused)
  useEffect(() => {
    const handleFocus = () => {
      const latest = safeLS("pba_print_jobs", []) || [];
      setJobs(latest);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Format date display
  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }) + ", " + d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  // Status badge styling config
  const getStatusBadge = (status) => {
    switch (status) {
      case "queued":
        return {
          bg: "#FEF3C7",
          text: "#92400E",
          border: "#FDE68A",
          dot: "#F59E0B",
          label: "Queued"
        };
      case "printing":
        return {
          bg: "#EFF6FF",
          text: "#1D4ED8",
          border: "#BFDBFE",
          dot: "#3B82F6",
          label: "Printing"
        };
      case "ready":
        return {
          bg: "#F0FDF4",
          text: "#166534",
          border: "#BBF7D0",
          dot: "#22C55E",
          label: "Ready to Distribute"
        };
      case "distributed":
      default:
        return {
          bg: "#F3F4F6",
          text: "#6B7280",
          border: "#E5E7EB",
          dot: "#9CA3AF",
          label: "Distributed"
        };
    }
  };

  // ENHANCEMENT A: Add New Print Job
  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!newForm.bookTitle.trim()) {
      alert("Please enter a book title.");
      return;
    }
    const qty = parseInt(newForm.quantity, 10);
    if (!qty || qty < 1) {
      alert("Please enter a valid quantity of at least 1.");
      return;
    }

    const adminUser = safeLS("pba_current_user", null);
    const requesterName = adminUser?.name || currentUser?.name || "Admin";

    const newJob = {
      id: "PJ-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-4),
      bookTitle: newForm.bookTitle.trim(),
      subject: newForm.subject || "",
      batchId: newForm.batchId || null,
      batchName: newForm.batchName || "",
      quantity: qty,
      notes: newForm.notes.trim() || "",
      requestedBy: requesterName,
      requestedAt: new Date().toISOString(),
      status: "queued",
      statusHistory: [
        {
          status: "queued",
          updatedBy: "Admin",
          updatedAt: new Date().toISOString(),
          note: ""
        }
      ],
      distributedAt: null,
      distributedBy: null
    };

    const existing = safeLS("pba_print_jobs", []) || [];
    const updated = [newJob, ...existing];
    saveLS("pba_print_jobs", updated);
    setJobs(updated);

    setShowAddModal(false);
    setNewForm({
      bookTitle: "",
      subject: "",
      batchId: "",
      batchName: "",
      quantity: 40,
      notes: ""
    });
  };

  // ENHANCEMENT B: Admin Mark Distributed
  const handleMarkDistributed = (jobId) => {
    if (!window.confirm("Mark this print job as Distributed to students?")) return;

    const allJobs = safeLS("pba_print_jobs", []) || [];
    const updated = allJobs.map((j) => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        status: "distributed",
        statusHistory: [
          ...(j.statusHistory || []),
          {
            status: "distributed",
            updatedBy: "Admin",
            updatedAt: new Date().toISOString(),
            note: "Marked distributed by Admin"
          }
        ],
        distributedAt: new Date().toISOString(),
        distributedBy: "Admin"
      };
    });

    saveLS("pba_print_jobs", updated);
    setJobs(updated);
  };

  // SECTION D: Universal Delete Job at ANY status
  const deleteJob = (jobId) => {
    const job = (safeLS("pba_print_jobs", []) || []).find((j) => j.id === jobId);
    if (!job) return;

    const confirmMsg =
      job.status === "distributed"
        ? `Delete completed job "${job.bookTitle}"? This cannot be undone.`
        : `Delete print job "${job.bookTitle}" (${job.status})? This cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    const allJobs = safeLS("pba_print_jobs", []) || [];
    const updated = allJobs.filter((j) => j.id !== jobId);
    saveLS("pba_print_jobs", updated);
    setJobs(updated);
  };

  // SECTION B & C: Admin Override Handler
  const openAdminOverride = (job) => {
    setOverrideJob(job);
    setOverrideStatus(job.status);
    setOverrideNote("");
    setOverrideModal(true);
  };

  const applyAdminOverride = () => {
    if (!overrideNote.trim()) {
      alert("Please enter a reason for the override.");
      return;
    }
    if (overrideStatus === overrideJob.status) {
      alert("Status is unchanged — select a different status to override.");
      return;
    }

    const allJobs = safeLS("pba_print_jobs", []) || [];
    const updated = allJobs.map((j) => {
      if (j.id !== overrideJob.id) return j;
      return {
        ...j,
        status: overrideStatus,
        statusHistory: [
          ...(j.statusHistory || []),
          {
            status: overrideStatus,
            updatedBy: "Admin (Override)",
            updatedAt: new Date().toISOString(),
            note: overrideNote.trim()
          }
        ],
        ...(overrideStatus === "distributed"
          ? {
              distributedAt: new Date().toISOString(),
              distributedBy: "Admin (Override)"
            }
          : {}),
        // If reverting FROM distributed, clear distributedAt/By
        ...(overrideJob.status === "distributed" && overrideStatus !== "distributed"
          ? {
              distributedAt: null,
              distributedBy: null
            }
          : {})
      };
    });

    saveLS("pba_print_jobs", updated);
    setJobs(updated);
    setOverrideModal(false);
    setOverrideJob(null);
    setOverrideNote("");
  };

  // Filtered jobs list
  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (job.bookTitle || "").toLowerCase().includes(q);
      const matchBatch = (job.batchName || "").toLowerCase().includes(q);
      const matchId = (job.id || "").toLowerCase().includes(q);
      const matchSubject = (job.subject || "").toLowerCase().includes(q);
      const matchRequester = (job.requestedBy || "").toLowerCase().includes(q);
      return matchTitle || matchBatch || matchId || matchSubject || matchRequester;
    }
    return true;
  });

  // Metric counts
  const activeCount = jobs.filter((j) => j.status !== "distributed").length;
  const queuedCount = jobs.filter((j) => j.status === "queued").length;
  const printingCount = jobs.filter((j) => j.status === "printing").length;
  const readyCount = jobs.filter((j) => j.status === "ready").length;
  const distributedCount = jobs.filter((j) => j.status === "distributed").length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* ── Page Header & Top Actions ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: "16px",
          background: "#FFFFFF",
          padding: "24px 28px",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#0F172A" }}>
              Printing Queue Management
            </h1>
            <span
              style={{
                background: "#EFF6FF",
                color: "#1D4ED8",
                border: "1px solid #BFDBFE",
                borderRadius: "20px",
                padding: "2px 10px",
                fontSize: "12px",
                fontWeight: 700
              }}
            >
              {activeCount} Active
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748B" }}>
            Monitor printing requests, oversee back office progress, and manage student distribution.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* ENHANCEMENT D: Back Office Portal link */}
          <a
            href="/back-office"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "13px",
              color: "#475569",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#F8FAFC",
              border: "1px solid #CBD5E1",
              padding: "9px 14px",
              borderRadius: "8px",
              fontWeight: 600,
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#E2E8F0";
              e.currentTarget.style.color = "#0F172A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F8FAFC";
              e.currentTarget.style.color = "#475569";
            }}
          >
            🖨 Open Back Office Portal ↗
          </a>

          {/* ENHANCEMENT A: + New Print Request button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
              transition: "background 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1D4ED8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#2563EB")}
          >
            + New Print Request
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)",
          gap: "14px"
        }}
      >
        {[
          { label: "Active Jobs", count: activeCount, bg: "#FFFFFF", border: "#E2E8F0", text: "#0F172A" },
          { label: "Queued", count: queuedCount, bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" },
          { label: "Printing", count: printingCount, bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
          { label: "Ready to Distribute", count: readyCount, bg: "#F0FDF4", border: "#BBF7D0", text: "#166534" },
          { label: "Distributed", count: distributedCount, bg: "#F9FAFB", border: "#E5E7EB", text: "#4B5563" }
        ].map((card, idx) => (
          <div
            key={idx}
            style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
              borderRadius: "12px",
              padding: "16px 18px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 600, color: card.text, opacity: 0.85 }}>
              {card.label}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: card.text, marginTop: "6px" }}>
              {card.count}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div
        style={{
          background: "#FFFFFF",
          padding: "16px 20px",
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: `All (${jobs.length})` },
            { id: "queued", label: `Queued (${queuedCount})` },
            { id: "printing", label: `Printing (${printingCount})` },
            { id: "ready", label: `Ready (${readyCount})` },
            { id: "distributed", label: `Distributed (${distributedCount})` }
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: isSelected ? "1px solid #2563EB" : "1px solid #E2E8F0",
                  background: isSelected ? "#EFF6FF" : "#FFFFFF",
                  color: isSelected ? "#1D4ED8" : "#475569",
                  fontSize: "13px",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.12s ease"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ minWidth: "240px" }}>
          <input
            type="text"
            placeholder="Search by title, batch, ID, requester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              fontSize: "13px",
              boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      {/* ── ENHANCEMENT B: Admin Jobs Table ── */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569" }}>
                <th style={{ padding: "12px 18px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase" }}>
                  Job ID
                </th>
                <th style={{ padding: "12px 18px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase" }}>
                  Book
                </th>
                <th style={{ padding: "12px 18px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase" }}>
                  Batch
                </th>
                <th style={{ padding: "12px 18px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase" }}>
                  Qty
                </th>
                <th style={{ padding: "12px 18px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase" }}>
                  Requested
                </th>
                <th style={{ padding: "12px 18px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase" }}>
                  Status
                </th>
                <th style={{ padding: "12px 18px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 18px", textAlign: "center", color: "#94A3B8" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                    No print jobs matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const badge = getStatusBadge(job.status);
                  return (
                    <tr
                      key={job.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background 0.12s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Job ID */}
                      <td style={{ padding: "14px 18px", fontWeight: 600, color: "#1E293B", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            background: "#F1F5F9",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            border: "1px solid #E2E8F0"
                          }}
                        >
                          {job.id}
                        </span>
                      </td>

                      {/* Book */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>
                          📚 {job.bookTitle}
                        </div>
                        {job.subject && (
                          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                            {job.subject}
                          </div>
                        )}
                        {job.notes && (
                          <div style={{ fontSize: "11px", color: "#92400E", marginTop: "2px", fontStyle: "italic" }}>
                            Note: {job.notes}
                          </div>
                        )}
                      </td>

                      {/* Batch */}
                      <td style={{ padding: "14px 18px", color: "#334155" }}>
                        {job.batchName ? (
                          <span style={{ fontWeight: 500 }}>{job.batchName}</span>
                        ) : (
                          <span style={{ color: "#94A3B8" }}>—</span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            border: "1px solid #DBEAFE",
                            borderRadius: "6px",
                            padding: "3px 8px",
                            fontSize: "12px",
                            fontWeight: 700
                          }}
                        >
                          {job.quantity} copies
                        </span>
                      </td>

                      {/* Requested */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 500, color: "#334155" }}>
                          {job.requestedBy || "Admin"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                          {formatDate(job.requestedAt)}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                            borderRadius: "16px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: badge.dot
                            }}
                          />
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          {/* View Details / History */}
                          <button
                            type="button"
                            onClick={() => setDetailsModalJob(job)}
                            style={{
                              background: "#F8FAFC",
                              border: "1px solid #CBD5E1",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              fontSize: "12px",
                              cursor: "pointer",
                              color: "#475569",
                              fontWeight: 600
                            }}
                          >
                            Details
                          </button>

                          {/* Admin Mark Distributed (Available when status === 'ready') */}
                          {job.status === "ready" && (
                            <button
                              type="button"
                              onClick={() => handleMarkDistributed(job.id)}
                              style={{
                                background: "#DCFCE7",
                                border: "1px solid #86EFAC",
                                borderRadius: "6px",
                                padding: "5px 10px",
                                fontSize: "12px",
                                cursor: "pointer",
                                color: "#166534",
                                fontWeight: 700
                              }}
                            >
                              📦 Distribute
                            </button>
                          )}

                          {/* SECTION A: Admin Override Button (Always visible on EVERY row) */}
                          <button
                            type="button"
                            onClick={() => openAdminOverride(job)}
                            style={{
                              background: "#FEF3C7",
                              border: "1px solid #FDE68A",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              fontSize: "12px",
                              cursor: "pointer",
                              color: "#92400E",
                              fontWeight: 600
                            }}
                          >
                            ⚙ Override
                          </button>

                          {/* SECTION D: Delete Button (Always visible on EVERY row) */}
                          <button
                            type="button"
                            onClick={() => deleteJob(job.id)}
                            style={{
                              background: "#FEF2F2",
                              border: "1px solid #FECACA",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              fontSize: "12px",
                              cursor: "pointer",
                              color: "#DC2626",
                              fontWeight: 600
                            }}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ENHANCEMENT A: Add Print Request Modal ── */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "28px 32px",
              width: "480px",
              maxWidth: "92vw",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px"
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                  + New Print Request
                </h3>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                  Queue a new printing order for back office staff
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#94A3B8"
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateJob}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                {/* Book Title */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "6px"
                    }}
                  >
                    Book Title <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics Textbook or Chemistry Unit 3"
                    value={newForm.bookTitle}
                    onChange={(e) => setNewForm((prev) => ({ ...prev, bookTitle: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #CBD5E1",
                      borderRadius: "8px",
                      fontSize: "13px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* Subject & Quantity Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "6px"
                      }}
                    >
                      Subject
                    </label>
                    <select
                      value={newForm.subject}
                      onChange={(e) => setNewForm((prev) => ({ ...prev, subject: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        background: "#FFFFFF",
                        boxSizing: "border-box"
                      }}
                    >
                      <option value="">Select subject (optional)</option>
                      {availableSubjects.map((sub, i) => (
                        <option key={i} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "6px"
                      }}
                    >
                      Quantity <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newForm.quantity}
                      onChange={(e) => setNewForm((prev) => ({ ...prev, quantity: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                {/* Batch */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "6px"
                    }}
                  >
                    Target Batch
                  </label>
                  <select
                    value={newForm.batchId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const selBatch = availableBatches.find((b) => (b.id || "").toString() === selId);
                      setNewForm((prev) => ({
                        ...prev,
                        batchId: selId,
                        batchName: selBatch ? selBatch.name || selBatch.batchName || "" : ""
                      }));
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #CBD5E1",
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: "#FFFFFF",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="">Select batch (optional)</option>
                    {availableBatches.map((b, i) => (
                      <option key={b.id || i} value={b.id || ""}>
                        {b.name || b.batchName || `Batch ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes / Instructions */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "6px"
                    }}
                  >
                    Notes / Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Lecturer confirmed via email — urgent for Monday lecture"
                    value={newForm.notes}
                    onChange={(e) => setNewForm((prev) => ({ ...prev, notes: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #CBD5E1",
                      borderRadius: "8px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      resize: "vertical"
                    }}
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "10px 18px",
                    background: "#F1F5F9",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    background: "#2563EB",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
                  }}
                >
                  Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SECTION B: Admin Override Modal ── */}
      {overrideModal && overrideJob && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "28px 32px",
              width: "460px",
              maxWidth: "92vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px"
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#DC2626",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    marginBottom: "4px"
                  }}
                >
                  ⚙ Admin Override
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#111827"
                  }}
                >
                  {overrideJob.bookTitle}
                </h3>
                <div style={{ fontSize: "12px", color: "#6B7280", marginTop: 2 }}>
                  {overrideJob.id} · {overrideJob.quantity} copies
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#6B7280"
                }}
              >
                ×
              </button>
            </div>

            {/* Current status display */}
            <div
              style={{
                background: "#F9FAFB",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#374151"
              }}
            >
              Current status: <strong>{overrideJob.status.toUpperCase()}</strong>
            </div>

            {/* Warning banner */}
            <div
              style={{
                background: "#FEF3C7",
                border: "1px solid #FDE68A",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "12px",
                color: "#92400E",
                marginBottom: "20px"
              }}
            >
              ⚠ Admin override bypasses the normal workflow. This action is logged to the job history.
            </div>

            {/* Set Status — all 4 options, always available */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "8px"
                }}
              >
                Set status to:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { value: "queued", label: "📋 Queued", bg: "#FFFBEB", border: "#F59E0B", text: "#92400E" },
                  { value: "printing", label: "🖨 Printing", bg: "#EFF6FF", border: "#3B82F6", text: "#1D4ED8" },
                  { value: "ready", label: "✅ Ready", bg: "#F0FDF4", border: "#22C55E", text: "#166534" },
                  { value: "distributed", label: "📦 Distributed", bg: "#F3F4F6", border: "#9CA3AF", text: "#374151" }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOverrideStatus(opt.value)}
                    style={{
                      padding: "10px 12px",
                      background: overrideStatus === opt.value ? opt.bg : "white",
                      border: `2px solid ${overrideStatus === opt.value ? opt.border : "#E5E7EB"}`,
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: overrideStatus === opt.value ? opt.text : "#6B7280",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s"
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Override reason (required) */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px"
                }}
              >
                Reason for override <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Back office marked wrong status — correcting to ready"
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#111827",
                  resize: "vertical",
                  boxSizing: "border-box",
                  background: "#F9FAFB"
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setOverrideModal(false)}
                style={{
                  padding: "10px 20px",
                  background: "#F3F4F6",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#374151"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyAdminOverride}
                disabled={!overrideNote.trim() || overrideStatus === overrideJob.status}
                style={{
                  padding: "10px 24px",
                  background:
                    !overrideNote.trim() || overrideStatus === overrideJob.status ? "#E5E7EB" : "#DC2626",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor:
                    !overrideNote.trim() || overrideStatus === overrideJob.status ? "not-allowed" : "pointer",
                  color:
                    !overrideNote.trim() || overrideStatus === overrideJob.status ? "#9CA3AF" : "white"
                }}
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Details & History Modal ── */}
      {detailsModalJob && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "28px 32px",
              width: "520px",
              maxWidth: "92vw",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px"
              }}
            >
              <div>
                <span
                  style={{
                    background: "#F1F5F9",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569"
                  }}
                >
                  {detailsModalJob.id}
                </span>
                <h3 style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                  📚 {detailsModalJob.bookTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalJob(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#94A3B8"
                }}
              >
                ×
              </button>
            </div>

            {/* Quick stats grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                background: "#F8FAFC",
                padding: "14px 16px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "13px"
              }}
            >
              <div>
                <span style={{ color: "#64748B" }}>Subject:</span>{" "}
                <strong>{detailsModalJob.subject || "—"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B" }}>Quantity:</span>{" "}
                <strong>{detailsModalJob.quantity} copies</strong>
              </div>
              <div>
                <span style={{ color: "#64748B" }}>Batch:</span>{" "}
                <strong>{detailsModalJob.batchName || "—"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B" }}>Status:</span>{" "}
                <strong style={{ textTransform: "capitalize" }}>{detailsModalJob.status}</strong>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#64748B" }}>Requested by:</span>{" "}
                <strong>{detailsModalJob.requestedBy}</strong> on {formatDate(detailsModalJob.requestedAt)}
              </div>
              {detailsModalJob.distributedAt && (
                <div style={{ gridColumn: "1 / -1", color: "#166534" }}>
                  <span>Distributed by:</span> <strong>{detailsModalJob.distributedBy}</strong> on{" "}
                  {formatDate(detailsModalJob.distributedAt)}
                </div>
              )}
            </div>

            {detailsModalJob.notes && (
              <div
                style={{
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#92400E",
                  marginBottom: "20px"
                }}
              >
                <strong>Notes / Instructions:</strong> {detailsModalJob.notes}
              </div>
            )}

            {/* SECTION E: Status History Timeline */}
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0F172A",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                Status History Timeline
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingLeft: "4px" }}>
                {(detailsModalJob.statusHistory || []).map((entry, hIdx) => {
                  const isOverride = entry.updatedBy === "Admin (Override)";
                  const badge = getStatusBadge(entry.status);
                  const dotColor = isOverride ? "#DC2626" : badge.dot;

                  return (
                    <div key={hIdx} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: dotColor,
                          marginTop: "4px",
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, fontSize: "13px" }}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                          <strong style={{ textTransform: "capitalize", color: "#0F172A" }}>
                            {entry.status}
                          </strong>
                          <span style={{ color: "#64748B" }}>— {entry.updatedBy}</span>

                          {/* SECTION E: ADMIN OVERRIDE BADGE */}
                          {isOverride && (
                            <span
                              style={{
                                background: "#FEE2E2",
                                color: "#DC2626",
                                border: "1px solid #FECACA",
                                borderRadius: "4px",
                                padding: "1px 6px",
                                fontSize: "10px",
                                fontWeight: 700,
                                marginLeft: "6px"
                              }}
                            >
                              ADMIN OVERRIDE
                            </span>
                          )}

                          <span style={{ color: "#94A3B8", fontSize: "12px", marginLeft: "4px" }}>
                            · {formatDate(entry.updatedAt)}
                          </span>
                        </div>

                        {entry.note && (
                          <div
                            style={{
                              marginTop: "4px",
                              color: "#475569",
                              fontSize: "12px",
                              fontStyle: "italic",
                              background: "#F8FAFC",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              border: "1px solid #E2E8F0"
                            }}
                          >
                            "{entry.note}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDetailsModalJob(null)}
                style={{
                  padding: "9px 20px",
                  background: "#F1F5F9",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
