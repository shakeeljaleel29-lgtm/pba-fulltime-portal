import React from "react";
import { useApp } from "../../context/AppContext";
import { T } from "../../theme";

export const DashboardView = ({ isMobile }) => {
  const {
    data,
    setActiveTab,
    currentUser,
    filterByBranch,
    effectiveBranch,
    approveLeaveRequest,
    rejectLeaveRequest,
    approveBookRequisition
  } = useApp();

  const role = currentUser.role;

  // Filtered datasets by branch
  const filteredTodayClasses = filterByBranch(data.todayClasses || []);
  const filteredLeaves = filterByBranch(data.leaveRequests || []);
  const filteredRequisitions = filterByBranch(data.bookRequisitions || []);
  const filteredPrintJobs = filterByBranch(data.printJobs || []);
  const filteredFees = filterByBranch(data.studentFees || []);
  const filteredAnnouncements = filterByBranch(data.announcements || []);
  const filteredCommsLog = filterByBranch(data.communicationsLog || []);

  // Stat calculations
  const todayClassesCount = filteredTodayClasses.length;
  const pendingLeavesCount = filteredLeaves.filter((l) => l.status === "Pending").length;
  const pendingBookReqsCount = filteredRequisitions.filter((r) => r.status === "Pending").length;
  const activePrintJobsCount = filteredPrintJobs.filter((j) => j.status === "Pending" || j.status === "In Progress").length;
  const totalOutstandingFees = filteredFees
    .filter((f) => f.status !== "Paid")
    .reduce((sum, f) => sum + (f.amountDue - (f.amountPaid || 0)), 0);

  const tiles = [
    {
      id: "admin",
      label: "TODAY'S CLASSES",
      val: todayClassesCount,
      trend: "Scheduled",
      iconBg: "#EEF2FF",
      iconColor: "#4F46E5",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      id: "lecturers",
      label: "PENDING LEAVES",
      val: pendingLeavesCount,
      trend: pendingLeavesCount > 0 ? "Requires Action" : "Clean",
      iconBg: pendingLeavesCount > 0 ? "#FFFBEB" : "#ECFDF5",
      iconColor: pendingLeavesCount > 0 ? "#F59E0B" : "#10B981",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
    },
    {
      id: "books",
      label: "BOOK REQUISITIONS",
      val: pendingBookReqsCount,
      trend: pendingBookReqsCount > 0 ? "Pending" : "Up to date",
      iconBg: "#EFF6FF",
      iconColor: "#3B82F6",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      id: "students",
      label: "ATTENDANCE RATE",
      val: "94.2%",
      trend: "+2.4%",
      iconBg: "#ECFDF5",
      iconColor: "#10B981",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      )
    },
    {
      id: "fees",
      label: "OUTSTANDING FEES",
      val: `LKR ${totalOutstandingFees.toLocaleString()}`,
      trend: totalOutstandingFees > 0 ? "Due" : "Paid",
      iconBg: totalOutstandingFees > 0 ? "#FEF2F2" : "#ECFDF5",
      iconColor: totalOutstandingFees > 0 ? "#EF4444" : "#10B981",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header Section */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "4px"
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: '#0F172A',
            margin: '0 0 4px', letterSpacing: '-0.5px'
          }}>Dashboard Overview</h1>
          <p style={{
            fontSize: '13px', color: '#64748B', margin: 0, fontWeight: 400
          }}>Welcome back, {currentUser.name} • {effectiveBranch === "All" ? "All Branches" : `${effectiveBranch} Branch`}</p>
        </div>
        <button
          onClick={() => setActiveTab("communications")}
          style={{
            padding: '10px 20px',
            background: T.primaryGrad,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px', fontWeight: 700,
            cursor: 'pointer',
            boxShadow: T.primaryShadow,
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.15s ease',
            minHeight: isMobile ? '40px' : undefined
          }}
        >
          Compose Broadcast
        </button>
      </div>

      {/* Announcements Ticker */}
      {filteredAnnouncements.length > 0 && (
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "12px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 800, fontSize: "12px", color: "#92400E", textTransform: "uppercase" }}>
              ANNOUNCEMENT: {filteredAnnouncements[0].title} —{" "}
            </span>
            <span style={{ fontSize: "13px", color: "#0F172A" }}>
              {filteredAnnouncements[0].body}
            </span>
          </div>
        </div>
      )}

      {/* STAT / KPI CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)",
        gap: "16px"
      }}>
        {tiles.map((tile) => (
          <div
            key={tile.label}
            onClick={() => setActiveTab(tile.id)}
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(226,232,240,0.8)',
              borderRadius: '16px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
              padding: '20px 22px',
              display: 'flex', alignItems: 'center', gap: '14px',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,70,229,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.05)'}
          >
            <div style={{
              width: '46px', height: '46px', borderRadius: '12px',
              background: tile.iconBg,
              color: tile.iconColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', flexShrink: 0
            }}>{tile.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: tile.val.length > 10 ? '18px' : '24px', fontWeight: 800, color: '#0F172A',
                letterSpacing: '-0.5px', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{tile.val}</div>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: '#94A3B8',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px'
              }}>{tile.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Schedule Card */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(226,232,240,0.8)',
        borderRadius: '16px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
        padding: isMobile ? '16px' : '20px 24px'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9'
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Today's Class Schedule
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
              Timeline for {effectiveBranch === "All" ? "All Branches" : `${effectiveBranch} Branch`}
            </p>
          </div>
          <button
            onClick={() => setActiveTab("admin")}
            style={{
              padding: '8px 14px',
              background: '#FFFFFF',
              color: '#475569',
              border: '1.5px solid #E2E8F0',
              borderRadius: '10px',
              fontSize: '12px', fontWeight: 600,
              cursor: 'pointer',
              minHeight: isMobile ? '40px' : undefined
            }}
          >
            Full Timetable →
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredTodayClasses.map((cls) => (
            <div
              key={cls.id}
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: isMobile ? "8px" : "16px",
                padding: "14px 18px",
                borderRadius: "12px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0"
              }}
            >
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "4px" : "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", width: isMobile ? "auto" : "120px", color: "#475569" }}>
                  {cls.time}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#0F172A" }}>
                    {cls.subject} — <span style={{ color: "#4F46E5" }}>{cls.batch}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                    Lecturer: <strong>{cls.lecturer}</strong> | Room: <strong>{cls.classroom}</strong> | Branch: <strong>{cls.branch}</strong>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <span style={{
                background: cls.status === "Cancelled" ? '#FEF2F2' : cls.status === "Changed" ? '#FFFBEB' : '#ECFDF5',
                color: cls.status === "Cancelled" ? '#991B1B' : cls.status === "Changed" ? '#92400E' : '#065F46',
                border: `1px solid ${cls.status === "Cancelled" ? '#FECACA' : cls.status === "Changed" ? '#FDE68A' : '#A7F3D0'}`,
                borderRadius: '20px',
                padding: '3px 10px', fontSize: '11px', fontWeight: 700
              }}>
                {cls.status === "Normal" ? "Scheduled" : cls.status === "Changed" ? `Changed (${cls.statusNote})` : "Cancelled"}
              </span>
            </div>
          ))}

          {filteredTodayClasses.length === 0 && (
            <div style={{ padding: '36px 24px', textAlign: 'center' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: '#EEF2FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', margin: '0 auto 12px'
              }}>📅</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>No classes today</div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>No classes scheduled for {effectiveBranch} Branch today.</div>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-side Section Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: "20px"
      }}>
        {/* Pending Actions */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          padding: isMobile ? '16px' : '20px 24px'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Pending Actions
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto" }}>
            {filteredLeaves
              .filter((l) => l.status === "Pending")
              .map((lv) => (
                <div key={lv.id} style={{ padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: "10px", background: "#F8FAFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>Leave: {lv.lecturerName}</span>
                    <span style={{ background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A", borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>{lv.type}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "8px" }}>
                    Date: {lv.startDate} | {lv.subject}
                  </div>
                  {(role === "Admin" || role === "Branch Coordinator") && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => approveLeaveRequest(lv.id)}
                        style={{ padding: "5px 10px", background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", minHeight: isMobile ? '40px' : undefined }}
                      >
                        Approve & Cover
                      </button>
                      <button
                        onClick={() => rejectLeaveRequest(lv.id, "Rejected")}
                        style={{ padding: "5px 10px", background: "transparent", color: "#EF4444", border: "1px solid #FECACA", borderRadius: "8px", fontSize: "11px", fontWeight: 600, cursor: "pointer", minHeight: isMobile ? '40px' : undefined }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}

            {filteredRequisitions
              .filter((r) => r.status === "Pending")
              .map((req) => (
                <div key={req.id} style={{ padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: "10px", background: "#F8FAFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>Book Req: {req.bookTitle}</span>
                    <span style={{ background: "#EEF2FF", color: "#3730A3", border: "1px solid #C7D2FE", borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>Qty {req.quantity}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "8px" }}>
                    Needed By: {req.dateNeeded} | {req.branch}
                  </div>
                  {(role === "Admin" || role === "Branch Coordinator") && (
                    <button
                      onClick={() => approveBookRequisition(req.id)}
                      style={{ padding: "5px 10px", background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", minHeight: isMobile ? '40px' : undefined }}
                    >
                      Approve & Queue Printing
                    </button>
                  )}
                </div>
              ))}

            {filteredLeaves.filter((l) => l.status === "Pending").length === 0 &&
              filteredRequisitions.filter((r) => r.status === "Pending").length === 0 && (
                <div style={{ padding: "32px 18px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>
                  No pending action items.
                </div>
              )}
          </div>
        </div>

        {/* Communications Summary */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          padding: isMobile ? '16px' : '20px 24px'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Communications Summary
            </h3>
            <button
              onClick={() => setActiveTab("communications")}
              style={{
                padding: '6px 12px',
                background: '#F8FAFC',
                color: '#475569',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '12px', fontWeight: 600,
                cursor: 'pointer',
                minHeight: isMobile ? '40px' : undefined
              }}
            >
              Compose Broadcast
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ padding: "14px", border: "1px solid #E2E8F0", borderRadius: "10px", background: "#F8FAFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>Broadcast Messages Sent Today</div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>Across {effectiveBranch} Branch</div>
              </div>
              <span style={{
                background: '#ECFDF5', color: '#065F46',
                border: '1px solid #A7F3D0', borderRadius: '20px',
                padding: '3px 10px', fontSize: '11px', fontWeight: 700
              }}>
                {filteredCommsLog.length} Sent
              </span>
            </div>

            <div style={{ padding: "14px", border: "1px solid #E2E8F0", borderRadius: "10px", background: "#F8FAFC" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Broadcast Notice</div>
              {filteredCommsLog[0] ? (
                <div style={{ fontSize: "13px", color: "#0F172A", marginTop: "4px", fontWeight: 600 }}>
                  "{filteredCommsLog[0].subject}" ({filteredCommsLog[0].channel})
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>No recent broadcasts.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
