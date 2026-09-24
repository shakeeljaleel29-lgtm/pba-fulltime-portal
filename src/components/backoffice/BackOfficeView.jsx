import React, { useState, useEffect, useCallback } from "react";

const safeLS = (key, fallback = null) => {
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

export default function BackOfficeView() {
  // Ensure default PIN on first load
  useEffect(() => {
    if (!safeLS("pba_backoffice_pin", null)) {
      saveLS("pba_backoffice_pin", "1234");
    }
  }, []);

  // Authentication State via sessionStorage
  const [boLoggedIn, setBoLoggedIn] = useState(
    () => sessionStorage.getItem("pba_bo_session") === "true"
  );

  // Login PIN state
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Jobs state
  const [jobs, setJobs] = useState(() => {
    const stored = safeLS("pba_print_jobs", null);
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      saveLS("pba_print_jobs", SEED_PRINT_JOBS);
      return SEED_PRINT_JOBS;
    }
    return stored;
  });

  const [lastRefreshed, setLastRefreshed] = useState("just now");
  const [refreshSpin, setRefreshSpin] = useState(false);

  // Status Action Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    jobId: null,
    jobTitle: "",
    newStatus: "",
    note: ""
  });

  // Card history visibility state: { [jobId]: boolean }
  const [expandedHistory, setExpandedHistory] = useState({});

  // Change PIN Modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinForm, setPinForm] = useState({ current: "", newPin: "", confirm: "" });
  const [pinChangeMsg, setPinChangeMsg] = useState({ text: "", isError: false });

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshSpin(true);
    const latest = safeLS("pba_print_jobs", []) || [];
    setJobs(latest);
    const now = new Date();
    setLastRefreshed(
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );
    setTimeout(() => setRefreshSpin(false), 500);
  }, []);

  // Real-time polling every 30 seconds
  useEffect(() => {
    if (!boLoggedIn) return;
    const interval = setInterval(() => {
      const latest = safeLS("pba_print_jobs", []) || [];
      setJobs(latest);
    }, 30000);
    return () => clearInterval(interval);
  }, [boLoggedIn]);

  // Physical keyboard support for PIN screen
  useEffect(() => {
    if (boLoggedIn) return;
    const handleKeyDown = (e) => {
      if (e.key >= "0" && e.key <= "9") {
        if (pinInput.length < 4) {
          const next = pinInput + e.key;
          setPinInput(next);
          setPinError("");
          if (next.length === 4) {
            validatePin(next);
          }
        }
      } else if (e.key === "Backspace") {
        setPinInput((prev) => prev.slice(0, -1));
        setPinError("");
      } else if (e.key === "Enter") {
        if (pinInput.length === 4) {
          validatePin(pinInput);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [boLoggedIn, pinInput]);

  // Validate entered PIN
  const validatePin = (input) => {
    const targetPin = safeLS("pba_backoffice_pin", "1234") || "1234";
    if (input === targetPin) {
      sessionStorage.setItem("pba_bo_session", "true");
      setBoLoggedIn(true);
      setPinInput("");
      setPinError("");
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPinInput("");
    }
  };

  const handleKeypadPress = (val) => {
    if (val === "⌫") {
      setPinInput((prev) => prev.slice(0, -1));
      setPinError("");
      return;
    }
    if (pinInput.length < 4) {
      const next = pinInput + val;
      setPinInput(next);
      setPinError("");
      if (next.length === 4) {
        validatePin(next);
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("pba_bo_session");
    setBoLoggedIn(false);
    setPinInput("");
    setPinError("");
  };

  // Action Button Click -> Open Confirmation
  const promptJobAction = (job, newStatus) => {
    setConfirmModal({
      isOpen: true,
      jobId: job.id,
      jobTitle: job.bookTitle,
      newStatus,
      note: ""
    });
  };

  // Confirm Action & Update Job
  const executeJobUpdate = () => {
    const { jobId, newStatus, note } = confirmModal;
    if (!jobId || !newStatus) return;

    const currentJobs = safeLS("pba_print_jobs", []) || [];
    const updated = currentJobs.map((j) => {
      if (j.id !== jobId) return j;
      const historyEntry = {
        status: newStatus,
        updatedBy: "Back Office",
        updatedAt: new Date().toISOString(),
        note: note.trim()
      };
      return {
        ...j,
        status: newStatus,
        statusHistory: [...(j.statusHistory || []), historyEntry],
        ...(newStatus === "distributed"
          ? {
              distributedAt: new Date().toISOString(),
              distributedBy: "Back Office"
            }
          : {})
      };
    });

    saveLS("pba_print_jobs", updated);
    setJobs(updated);
    setConfirmModal({ isOpen: false, jobId: null, jobTitle: "", newStatus: "", note: "" });
  };

  // Toggle History on Card
  const toggleHistory = (jobId) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  // Save New PIN
  const handleSavePin = () => {
    const currentStored = safeLS("pba_backoffice_pin", "1234") || "1234";
    if (pinForm.current !== currentStored) {
      setPinChangeMsg({ text: "Current PIN is incorrect.", isError: true });
      return;
    }
    if (!/^\d{4}$/.test(pinForm.newPin)) {
      setPinChangeMsg({ text: "New PIN must be exactly 4 digits.", isError: true });
      return;
    }
    if (pinForm.newPin !== pinForm.confirm) {
      setPinChangeMsg({ text: "New PIN and Confirm PIN do not match.", isError: true });
      return;
    }

    saveLS("pba_backoffice_pin", pinForm.newPin);
    setPinChangeMsg({ text: "PIN successfully updated!", isError: false });
    setTimeout(() => {
      setShowPinModal(false);
      setPinForm({ current: "", newPin: "", confirm: "" });
      setPinChangeMsg({ text: "", isError: false });
    }, 1200);
  };

  // Formatting date helper
  const formatDate = (isoStr) => {
    if (!isoStr) return "";
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

  // Status badge styling helper
  const getBadgeStyle = (status) => {
    switch (status) {
      case "queued":
        return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A", dot: "#F59E0B", label: "Queued" };
      case "printing":
        return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", dot: "#3B82F6", label: "Printing" };
      case "ready":
        return { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0", dot: "#22C55E", label: "Ready to Distribute" };
      case "distributed":
      default:
        return { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", dot: "#9CA3AF", label: "Distributed" };
    }
  };

  // Active jobs count
  const activeCount = jobs.filter((j) => j.status !== "distributed").length;

  // ════════════════════════════════════════════════════════════════
  // 1. LOGIN SCREEN (When not authenticated)
  // ════════════════════════════════════════════════════════════════
  if (!boLoggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F2042 100%)",
          padding: "20px",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            padding: "36px 32px",
            width: "360px",
            maxWidth: "92vw",
            textAlign: "center",
            boxSizing: "border-box"
          }}
        >
          {/* Portal Brand */}
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 14px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              boxShadow: "0 8px 16px rgba(37, 99, 235, 0.25)"
            }}
          >
            🖨
          </div>

          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 700, color: "#0F172A" }}>
            Back Office Staff Portal
          </h2>
          <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "24px", fontWeight: 500 }}>
            PBA Full-Time Portal
          </div>

          <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "14px" }}>
            Enter your staff PIN
          </div>

          {/* 4 PIN Dots */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "14px",
              marginBottom: "20px"
            }}
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    border: `2px solid ${isFilled ? "#2563EB" : "#CBD5E1"}`,
                    background: isFilled ? "#2563EB" : "transparent",
                    transition: "all 0.15s ease",
                    transform: isFilled ? "scale(1.15)" : "scale(1)"
                  }}
                />
              );
            })}
          </div>

          {/* Error Message */}
          {pinError && (
            <div
              style={{
                fontSize: "12px",
                color: "#DC2626",
                fontWeight: 600,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "8px",
                padding: "8px 10px",
                marginBottom: "16px"
              }}
            >
              {pinError}
            </div>
          )}

          {/* Keypad Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginBottom: "20px"
            }}
          >
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((btn, i) => {
              if (btn === "") {
                return <div key={i} />;
              }
              const isBackspace = btn === "⌫";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleKeypadPress(btn)}
                  style={{
                    height: "50px",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    background: isBackspace ? "#F1F5F9" : "#F8FAFC",
                    fontSize: isBackspace ? "18px" : "19px",
                    fontWeight: 600,
                    color: isBackspace ? "#475569" : "#0F172A",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.12s ease",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#E2E8F0";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isBackspace ? "#F1F5F9" : "#F8FAFC";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {btn}
                </button>
              );
            })}
          </div>

          {/* Login Button */}
          <button
            type="button"
            onClick={() => validatePin(pinInput)}
            disabled={pinInput.length !== 4}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: pinInput.length === 4 ? "#2563EB" : "#94A3B8",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 600,
              cursor: pinInput.length === 4 ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
              boxShadow:
                pinInput.length === 4
                  ? "0 4px 12px rgba(37, 99, 235, 0.35)"
                  : "none"
            }}
          >
            Login
          </button>

          {/* Admin Link */}
          <div style={{ marginTop: "22px", borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
            <a
              href="/"
              style={{
                fontSize: "12px",
                color: "#64748B",
                textDecoration: "none",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1E293B")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              Admin? → Back to Admin Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // 2. DASHBOARD VIEW (When logged in)
  // ════════════════════════════════════════════════════════════════
  const columns = [
    {
      id: "queued",
      title: "QUEUED",
      headerBg: "#FFFBEB",
      headerBorder: "#F59E0B",
      accent: "#92400E",
      jobs: jobs.filter((j) => j.status === "queued")
    },
    {
      id: "printing",
      title: "PRINTING",
      headerBg: "#EFF6FF",
      headerBorder: "#3B82F6",
      accent: "#1D4ED8",
      jobs: jobs.filter((j) => j.status === "printing")
    },
    {
      id: "ready",
      title: "READY",
      headerBg: "#F0FDF4",
      headerBorder: "#22C55E",
      accent: "#166534",
      jobs: jobs.filter((j) => j.status === "ready")
    },
    {
      id: "distributed",
      title: "DONE",
      headerBg: "#F9FAFB",
      headerBorder: "#9CA3AF",
      accent: "#4B5563",
      jobs: jobs.filter((j) => j.status === "distributed")
    }
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F1F5F9",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#1E293B"
      }}
    >
      {/* ── Standalone Header ── */}
      <header
        style={{
          background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
          color: "#FFFFFF",
          padding: "16px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              backdropFilter: "blur(4px)"
            }}
          >
            🖨
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "19px", fontWeight: 700, letterSpacing: "-0.2px" }}>
              PBA Back Office
            </h1>
            <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "2px", fontWeight: 400 }}>
              Print Job Dashboard · <strong style={{ fontWeight: 600 }}>{activeCount} active jobs</strong>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "12px", opacity: 0.85, marginRight: "4px" }}>
            Last updated: <span style={{ fontWeight: 600 }}>{lastRefreshed}</span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#FFFFFF",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backdropFilter: "blur(4px)",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)")}
          >
            <span
              style={{
                display: "inline-block",
                transform: refreshSpin ? "rotate(360deg)" : "none",
                transition: "transform 0.5s ease"
              }}
            >
              🔄
            </span>
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowPinModal(true)}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#FFFFFF",
              borderRadius: "8px",
              padding: "7px 12px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            🔑 PIN
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: "#EF4444",
              border: "none",
              color: "#FFFFFF",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s ease",
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#DC2626")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#EF4444")}
          >
            Logout →
          </button>
        </div>
      </header>

      {/* ── Kanban Board Container ── */}
      <main
        style={{
          flex: 1,
          padding: "24px 28px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          alignItems: "start",
          boxSizing: "border-box"
        }}
      >
        {columns.map((col) => (
          <div
            key={col.id}
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 120px)",
              overflow: "hidden"
            }}
          >
            {/* Column Header */}
            <div
              style={{
                background: col.headerBg,
                borderBottom: `3px solid ${col.headerBorder}`,
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 700, color: col.accent, letterSpacing: "0.5px" }}>
                {col.title} ({col.jobs.length})
              </div>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: col.headerBorder,
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {col.jobs.length}
              </div>
            </div>

            {/* Column Body / Scrollable Cards */}
            <div
              style={{
                padding: "16px",
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                minHeight: "160px"
              }}
            >
              {col.jobs.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 16px",
                    color: "#9CA3AF",
                    fontSize: "13px"
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>
                    {col.id === "queued"
                      ? "📭"
                      : col.id === "printing"
                      ? "🖨"
                      : col.id === "ready"
                      ? "📦"
                      : "✅"}
                  </div>
                  No jobs here
                </div>
              ) : (
                col.jobs.map((job) => {
                  const isExpanded = !!expandedHistory[job.id];
                  return (
                    <div
                      key={job.id}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "12px",
                        padding: "16px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                        transition: "box-shadow 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px"
                      }}
                    >
                      {/* Card Header: Title & Copies */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>
                          📚 {job.bookTitle}
                        </div>
                        <span
                          style={{
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            border: "1px solid #DBEAFE",
                            borderRadius: "6px",
                            padding: "3px 8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            whiteSpace: "nowrap"
                          }}
                        >
                          {job.quantity} copies
                        </span>
                      </div>

                      {/* Job ID & Subject */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#64748B",
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: "4px",
                            padding: "2px 6px"
                          }}
                        >
                          {job.id}
                        </span>
                        {job.subject && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#475569",
                              background: "#F1F5F9",
                              borderRadius: "4px",
                              padding: "2px 6px"
                            }}
                          >
                            {job.subject}
                          </span>
                        )}
                      </div>

                      {/* Meta Details */}
                      <div style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>
                        <div>
                          <strong>Batch:</strong> {job.batchName || "Unassigned"}
                        </div>
                        <div>
                          <strong>Requested by:</strong> {job.requestedBy || "Admin"}
                        </div>
                        <div style={{ color: "#64748B", fontSize: "11px", marginTop: "2px" }}>
                          {formatDate(job.requestedAt)}
                        </div>
                      </div>

                      {/* Optional Note */}
                      {job.notes && (
                        <div
                          style={{
                            background: "#FFFBEB",
                            borderLeft: "3px solid #F59E0B",
                            padding: "6px 10px",
                            borderRadius: "0 6px 6px 0",
                            fontSize: "12px",
                            color: "#92400E",
                            lineHeight: 1.4
                          }}
                        >
                          <strong>Note:</strong> {job.notes}
                        </div>
                      )}

                      {/* Action Buttons Per Status */}
                      <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {job.status === "queued" && (
                          <button
                            type="button"
                            onClick={() => promptJobAction(job, "printing")}
                            style={{
                              background: "#2563EB",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "8px",
                              padding: "9px 14px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)"
                            }}
                          >
                            ▶ Start Printing
                          </button>
                        )}

                        {job.status === "printing" && (
                          <button
                            type="button"
                            onClick={() => promptJobAction(job, "ready")}
                            style={{
                              background: "#16A34A",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "8px",
                              padding: "9px 14px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)"
                            }}
                          >
                            ✓ Ready to Distribute
                          </button>
                        )}

                        {job.status === "ready" && (
                          <button
                            type="button"
                            onClick={() => promptJobAction(job, "distributed")}
                            style={{
                              background: "#4F46E5",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "8px",
                              padding: "9px 14px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)"
                            }}
                          >
                            📦 Mark as Distributed
                          </button>
                        )}

                        {/* History Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleHistory(job.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#64748B",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: "4px",
                            textAlign: "center",
                            textDecoration: "underline"
                          }}
                        >
                          {isExpanded ? "▲ Hide History" : "▼ View History"}
                        </button>
                      </div>

                      {/* Expanded History Timeline */}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: "6px",
                            paddingTop: "10px",
                            borderTop: "1px dashed #E2E8F0",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                          }}
                        >
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                            Status Timeline
                          </div>
                          {(job.statusHistory || []).map((entry, hIdx) => {
                            const isOverride = entry.updatedBy === "Admin (Override)";
                            const dotColor = isOverride ? "#DC2626" : getBadgeStyle(entry.status).dot;
                            return (
                              <div
                                key={hIdx}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                  fontSize: "12px",
                                  lineHeight: 1.4
                                }}
                              >
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: dotColor,
                                    marginTop: "5px",
                                    flexShrink: 0
                                  }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div>
                                    <strong style={{ color: "#0F172A", textTransform: "capitalize" }}>
                                      {entry.status}
                                    </strong>
                                    {" — "}
                                    <span style={{ color: "#475569" }}>{entry.updatedBy}</span>
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
                                    <span style={{ color: "#94A3B8", fontSize: "11px", marginLeft: "4px" }}>
                                      · {formatDate(entry.updatedAt)}
                                    </span>
                                  </div>
                                  {entry.note && (
                                    <div
                                      style={{
                                        color: "#64748B",
                                        fontSize: "11px",
                                        fontStyle: "italic",
                                        marginTop: "2px"
                                      }}
                                    >
                                      Note: "{entry.note}"
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          background: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          padding: "12px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#64748B"
        }}
      >
        <div>PBA Full-Time Portal &copy; {new Date().getFullYear()} — Back Office System</div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setShowPinModal(true)}
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              fontSize: "12px",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Change Staff PIN
          </button>
          <a href="/" style={{ color: "#64748B", textDecoration: "none" }}>
            Admin Portal ↗
          </a>
        </div>
      </footer>

      {/* ── Confirmation Modal for Status Updates ── */}
      {confirmModal.isOpen && (
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
              padding: "24px 28px",
              width: "420px",
              maxWidth: "92vw",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: 700, color: "#0F172A" }}>
              Confirm Status Change
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#475569" }}>
              Mark <strong>"{confirmModal.jobTitle}"</strong> as{" "}
              <strong style={{ textTransform: "capitalize", color: "#2563EB" }}>
                {confirmModal.newStatus}
              </strong>
              ?
            </p>

            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "6px"
                }}
              >
                Note (optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Starting first 20 copies or Handed to Mr. Perera"
                value={confirmModal.note}
                onChange={(e) =>
                  setConfirmModal((prev) => ({ ...prev, note: e.target.value }))
                }
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() =>
                  setConfirmModal({
                    isOpen: false,
                    jobId: null,
                    jobTitle: "",
                    newStatus: "",
                    note: ""
                  })
                }
                style={{
                  padding: "9px 16px",
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
                type="button"
                onClick={executeJobUpdate}
                style={{
                  padding: "9px 20px",
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
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change PIN Modal ── */}
      {showPinModal && (
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
              padding: "24px 28px",
              width: "380px",
              maxWidth: "92vw",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0F172A" }}>
                🔑 Change Staff PIN
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setPinChangeMsg({ text: "", isError: false });
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#94A3B8"
                }}
              >
                ×
              </button>
            </div>

            {pinChangeMsg.text && (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  marginBottom: "14px",
                  background: pinChangeMsg.isError ? "#FEF2F2" : "#F0FDF4",
                  color: pinChangeMsg.isError ? "#DC2626" : "#166534",
                  border: `1px solid ${pinChangeMsg.isError ? "#FECACA" : "#BBF7D0"}`
                }}
              >
                {pinChangeMsg.text}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Current PIN:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinForm.current}
                  onChange={(e) => setPinForm((p) => ({ ...p, current: e.target.value }))}
                  placeholder="4 digits"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    letterSpacing: "2px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  New PIN:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm((p) => ({ ...p, newPin: e.target.value }))}
                  placeholder="4 digits"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    letterSpacing: "2px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Confirm PIN:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinForm.confirm}
                  onChange={(e) => setPinForm((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="4 digits"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    letterSpacing: "2px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setPinChangeMsg({ text: "", isError: false });
                }}
                style={{
                  padding: "9px 16px",
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
                type="button"
                onClick={handleSavePin}
                style={{
                  padding: "9px 20px",
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
                Save PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
