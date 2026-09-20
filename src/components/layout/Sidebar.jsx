import React from "react";
import { useApp } from "../../context/AppContext";
import { T } from "../../theme";

export const Sidebar = ({ onOpenPasswordModal, sidebarOpen, setSidebarOpen, isMobile }) => {
  const { data, activeTab, setActiveTab, currentUser, logout, filterByBranch, effectiveBranch } = useApp();

  const pendingLeaves = filterByBranch(data.leaveRequests || []).filter((l) => l.status === "Pending").length;
  const pendingReqs = filterByBranch(data.bookRequisitions || []).filter((r) => r.status === "Pending").length;
  const activePrintJobs = filterByBranch(data.printJobs || []).filter((j) => j.status === "Pending" || j.status === "In Progress").length;

  const role = currentUser.role;

  const getSvgIcon = (id, isActive) => {
    const strokeColor = isActive ? "#F8FAFC" : "#94A3B8";
    const props = {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: strokeColor,
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    };

    switch (id) {
      case "dashboard":
        return (
          <svg {...props}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        );
      case "analytics":
        return (
          <svg {...props}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        );
      case "calendar":
        return (
          <svg {...props}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case "lecturers":
        return (
          <svg {...props}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "students":
        return (
          <svg {...props}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        );
      case "fees":
        return (
          <svg {...props}>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case "exams":
        return (
          <svg {...props}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case "books":
        return (
          <svg {...props}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case "printing":
        return (
          <svg {...props}>
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
        );
      case "communications":
        return (
          <svg {...props}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case "parents":
        return (
          <svg {...props}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case "documents":
        return (
          <svg {...props}>
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        );
      case "admin":
        return (
          <svg {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93l-1.41 1.41M5.34 17.34l-1.41 1.41M19.07 19.07l-1.41-1.41M5.34 6.66l-1.41-1.41M22 12h-2M4 12H2M19.07 4.93A10 10 0 1 0 4.93 19.07" />
          </svg>
        );
      default:
        return (
          <svg {...props}>
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  const mainNavItems = [
    { id: "dashboard", label: "Dashboard", roles: ["Admin", "Branch Coordinator", "Lecturer", "Printing Staff"] },
    { id: "analytics", label: "Analytics", roles: ["Admin", "Branch Coordinator", "Lecturer"] },
    { id: "calendar", label: "Calendar", roles: ["Admin", "Branch Coordinator", "Lecturer"] }
  ];

  const adminNavItems = [
    { id: "lecturers", label: "Lecturers", badge: pendingLeaves, roles: ["Admin", "Branch Coordinator", "Lecturer"] },
    { id: "students", label: "Students", roles: ["Admin", "Branch Coordinator", "Lecturer"] },
    { id: "fees", label: "Fee Management", roles: ["Admin", "Branch Coordinator"] },
    { id: "exams", label: "Examinations", roles: ["Admin", "Branch Coordinator", "Lecturer"] },
    { id: "books", label: "Book Catalogue", badge: pendingReqs, roles: ["Admin", "Branch Coordinator", "Lecturer"] },
    { id: "printing", label: "Printing Queue", badge: activePrintJobs, roles: ["Admin", "Branch Coordinator", "Printing Staff"] },
    { id: "communications", label: "Communications", roles: ["Admin", "Branch Coordinator"] },
    { id: "parents", label: "Parent Portal", roles: ["Admin", "Branch Coordinator"] },
    { id: "documents", label: "Documents", roles: ["Admin", "Branch Coordinator", "Lecturer"] },
    { id: "admin", label: "General Admin", roles: ["Admin", "Branch Coordinator", "Lecturer"] }
  ];

  const filteredMain = mainNavItems.filter((i) => i.roles.includes(role));
  const filteredAdmin = adminNavItems.filter((i) => i.roles.includes(role));

  const branchLabel = effectiveBranch === "All" ? "All Branches" : `${effectiveBranch} Branch`;
  const userInitials = currentUser?.name ? currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "PBA";

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Dark Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,23,42,0.5)',
            zIndex: 999,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      <aside
        style={{
          width: isMobile ? '260px' : '240px',
          minHeight: '100vh',
          background: T.sidebarBg,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          zIndex: 1000,
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          overflowY: 'auto',
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          transition: isMobile ? 'transform 0.25s ease' : 'none'
        }}
      >
        {/* LOGO / BRAND AREA */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: T.primaryGrad,
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 800, color: '#FFFFFF',
              boxShadow: T.primaryShadow
            }}>P</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC',
                letterSpacing: '-0.3px' }}>PBA</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748B',
                textTransform: 'uppercase', letterSpacing: '0.6px' }}>Full-Time Portal</div>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
              >×</button>
            )}
          </div>
          {/* Branch badge */}
          <div style={{
            marginTop: '12px',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '11px', fontWeight: 700, color: '#A5B4FC',
            display: 'inline-block'
          }}>{branchLabel}</div>
        </div>

        {/* NAV SECTIONS */}
        <nav style={{ flex: 1, padding: '8px 0 16px', display: 'flex', flexDirection: 'column' }}>
          {filteredMain.length > 0 && (
            <>
              <div style={{
                fontSize: '10px', fontWeight: 700, color: '#334155',
                textTransform: 'uppercase', letterSpacing: '0.8px',
                padding: '20px 20px 6px'
              }}>MAIN</div>

              {filteredMain.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: isActive ? '9px 16px 9px 13px' : '9px 16px',
                      margin: '1px 8px',
                      borderRadius: '10px', cursor: 'pointer',
                      color: isActive ? '#F8FAFC' : '#94A3B8',
                      fontSize: '13px', fontWeight: isActive ? 700 : 500,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      background: isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? '3px solid #6366F1' : 'none',
                      width: 'calc(100% - 16px)',
                      textAlign: 'left',
                      minHeight: isMobile ? '40px' : undefined
                    }}
                  >
                    <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getSvgIcon(item.id, isActive)}
                    </div>
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {filteredAdmin.length > 0 && (
            <>
              <div style={{
                fontSize: '10px', fontWeight: 700, color: '#334155',
                textTransform: 'uppercase', letterSpacing: '0.8px',
                padding: '20px 20px 6px'
              }}>ADMINISTRATION</div>

              {filteredAdmin.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: isActive ? '9px 16px 9px 13px' : '9px 16px',
                      margin: '1px 8px',
                      borderRadius: '10px', cursor: 'pointer',
                      color: isActive ? '#F8FAFC' : '#94A3B8',
                      fontSize: '13px', fontWeight: isActive ? 700 : 500,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      background: isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? '3px solid #6366F1' : 'none',
                      width: 'calc(100% - 16px)',
                      textAlign: 'left',
                      minHeight: isMobile ? '40px' : undefined
                    }}
                  >
                    <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getSvgIcon(item.id, isActive)}
                    </div>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: '10px', fontWeight: 800,
                        borderRadius: '10px', padding: '1px 6px',
                        minWidth: '18px', textAlign: 'center'
                      }}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </nav>

        {/* USER AREA (bottom of sidebar) */}
        <div
          onClick={() => {
            onOpenPasswordModal();
            if (isMobile && setSidebarOpen) setSidebarOpen(false);
          }}
          style={{
            marginTop: 'auto',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '10px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: T.primaryGrad,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
            flexShrink: 0
          }}>{userInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12px', fontWeight: 700, color: '#F8FAFC',
              maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>{currentUser?.name || 'User'}</div>
            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 500 }}>{role}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              logout();
            }}
            title="Sign Out"
            style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", color: '#64748B' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
};
