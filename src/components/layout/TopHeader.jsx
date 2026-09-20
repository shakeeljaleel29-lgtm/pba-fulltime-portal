import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { T } from "../../theme";

export const TopHeader = ({ onOpenPasswordModal }) => {
  const {
    data,
    activeTab,
    setActiveTab,
    currentUser,
    selectedBranch,
    setSelectedBranch,
    unreadNotifications,
    setIsNavOpen,
    markAllNotificationsRead,
    logout
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!showNotifications) return;
    const closeOnOutsideClick = (e) => {
      if (!e.target.closest('[data-notif-root]')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [showNotifications]);

  const titleMap = {
    dashboard: "Dashboard Overview",
    analytics: "Analytics & Reports",
    calendar: "Academic Calendar",
    lecturers: "Lecturer Management & Leave System",
    students: "Student Database & Attendance",
    fees: "Fee Management & Ledger",
    books: "Textbook Requisitions & Catalogue",
    printing: "Printing Queue & Back Office Workflow",
    exams: "Examinations & Term Test Marks",
    communications: "Communications & Message Broadcasts",
    parents: "Parent Communication Portal",
    documents: "Document Vault & Template Letters",
    admin: "General Administration & Schedules"
  };

  const currentPageTitle = titleMap[activeTab] || "Portal";
  const unreadCount = unreadNotifications ? unreadNotifications.length : 0;
  const userInitials = currentUser?.name ? currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "PBA";

  const userNotifs = (data?.notifications || []).filter(
    (n) => n && (n.userId === currentUser.id || n.userId === "all" || (currentUser.role === "Admin" && (n.userId === "usr-admin" || n.userId === "user-1")))
  );

  const getSearchResults = () => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();

    const students = (data.students || []).filter(
      (s) => s.name.toLowerCase().includes(q) || s.regNo.toLowerCase().includes(q) || s.batch.toLowerCase().includes(q)
    );
    const lecturers = (data.lecturers || []).filter(
      (l) => l.name.toLowerCase().includes(q) || (l.subjects || []).some((sb) => sb.toLowerCase().includes(q))
    );
    const books = (data.books || []).filter((b) => b.title.toLowerCase().includes(q) || (b.subject && b.subject.toLowerCase().includes(q)));

    return { students, lecturers, books };
  };

  const results = getSearchResults();

  return (
    <header style={{
      position: 'fixed', top: 0, left: '240px', right: 0,
      height: '60px',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(226,232,240,0.8)',
      boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center',
      padding: '0 28px',
      gap: '16px',
      zIndex: 99
    }}>
      {/* Page Title */}
      <h1 style={{
        fontSize: '17px', fontWeight: 800, color: '#0F172A',
        margin: 0, letterSpacing: '-0.4px'
      }}>{currentPageTitle}</h1>

      {/* Search Bar */}
      <div style={{
        flex: 1, maxWidth: '360px',
        position: 'relative', marginLeft: 'auto'
      }}>
        <span style={{
          position: 'absolute', left: '12px', top: '50%',
          transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '14px'
        }}>🔍</span>
        <input
          style={{
            width: '100%', padding: '8px 12px 8px 34px',
            background: '#F8FAFC', border: '1px solid #E2E8F0',
            borderRadius: '10px', fontSize: '13px', color: '#0F172A',
            outline: 'none', boxSizing: 'border-box'
          }}
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {results && (
          <div style={{
            position: "absolute", top: "44px", left: 0, right: 0,
            background: "#FFFFFF", borderRadius: "12px",
            border: "1px solid #E2E8F0", boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            padding: "8px 0", zIndex: 300, maxHeight: "300px", overflowY: "auto"
          }}>
            {results.students.length > 0 && (
              <div>
                <div style={{ padding: "6px 14px", fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  Students ({results.students.length})
                </div>
                {results.students.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => { setActiveTab("students"); setSearchQuery(""); }}
                    style={{ padding: "8px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: "13px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>{st.name} ({st.regNo})</span>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>{st.branch}</span>
                  </div>
                ))}
              </div>
            )}

            {results.lecturers.length > 0 && (
              <div>
                <div style={{ padding: "6px 14px", fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  Lecturers ({results.lecturers.length})
                </div>
                {results.lecturers.map((lc) => (
                  <div
                    key={lc.id}
                    onClick={() => { setActiveTab("lecturers"); setSearchQuery(""); }}
                    style={{ padding: "8px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: "13px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>{lc.name}</span>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>{lc.branch}</span>
                  </div>
                ))}
              </div>
            )}

            {results.books.length > 0 && (
              <div>
                <div style={{ padding: "6px 14px", fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  Books ({results.books.length})
                </div>
                {results.books.map((bk) => (
                  <div
                    key={bk.id}
                    onClick={() => { setActiveTab("books"); setSearchQuery(""); }}
                    style={{ padding: "8px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: "13px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>{bk.title}</span>
                    <span style={{ fontSize: "11px", color: "#4F46E5" }}>Stock: {bk.stock}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Branch Dropdown */}
      {currentUser.role !== "Branch Coordinator" && (
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          style={{
            padding: '8px 12px', background: '#F8FAFC',
            border: '1px solid #E2E8F0', borderRadius: '10px',
            fontSize: '13px', fontWeight: 600, color: '#0F172A',
            cursor: 'pointer', outline: 'none'
          }}
        >
          <option value="All">All Branches</option>
          <option value="Kohuwala">Kohuwala</option>
          <option value="Wattala">Wattala</option>
          <option value="Panadura">Panadura</option>
        </select>
      )}

      {/* Notification Bell */}
      <div style={{ position: 'relative', cursor: 'pointer' }} data-notif-root onClick={() => setShowNotifications(!showNotifications)}>
        <span style={{ fontSize: '20px' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#EF4444', color: '#FFFFFF',
            fontSize: '9px', fontWeight: 800,
            borderRadius: '10px', padding: '1px 5px',
            minWidth: '16px', textAlign: 'center'
          }}>{unreadCount}</span>
        )}

        {/* Notifications Panel */}
        {showNotifications && (
          <div style={{
            position: "absolute", top: "36px", right: 0, width: "320px",
            background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.15)", zIndex: 500, overflow: "hidden"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: "14px 18px", borderBottom: "1px solid #F1F5F9",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A" }}>Notifications</span>
              <button
                onClick={markAllNotificationsRead}
                style={{ fontSize: "11px", fontWeight: 700, color: "#4F46E5", background: "none", border: "none", cursor: "pointer" }}
              >
                Mark all read
              </button>
            </div>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {userNotifs.map((n, i) => (
                <div key={n.id || i} style={{
                  padding: "12px 16px", borderBottom: "1px solid #F1F5F9",
                  background: n.read ? "#FFFFFF" : "#EEF2FF"
                }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>{n.message || n.title || n.text}</div>
                  <div style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>{n.timestamp || n.time || ""}</div>
                </div>
              ))}
              {userNotifs.length === 0 && (
                <div style={{ padding: "24px", textAlign: "center", color: "#94A3B8", fontSize: "12px" }}>No notifications</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      <div
        onClick={onOpenPasswordModal}
        style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: T.primaryGrad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
          cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(79,70,229,0.3)'
        }}
        title="Account Settings"
      >{userInitials}</div>
    </header>
  );
};
