import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { StudentDashboard } from "./StudentDashboard";
import { StudentTimetable } from "./StudentTimetable";
import { StudentGrades } from "./StudentGrades";
import { StudentAttendance } from "./StudentAttendance";
import { StudentFees } from "./StudentFees";
import { StudentProfile } from "./StudentProfile";
import { ChangePasswordModal } from "../auth/ChangePasswordModal";
import {
  LayoutDashboard,
  CalendarCheck,
  GraduationCap,
  Calendar,
  CreditCard,
  User,
  LogOut,
  KeyRound
} from "lucide-react";
import { T } from "../../theme";

export const StudentPortalLayout = () => {
  const { currentUser, data, logout } = useApp();
  const [activeSubTab, setActiveSubTab] = useState("my-dashboard");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Link to student record in database
  const linkedStudent =
    data.students.find((s) => s.id === currentUser.linkedStudentId) ||
    data.students[0] || {
      name: currentUser.name,
      regNo: "PBA-FT-2024-001",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala"
    };

  const tabs = [
    { id: "my-dashboard", label: "My Dashboard", icon: LayoutDashboard },
    { id: "my-timetable", label: "My Timetable", icon: CalendarCheck },
    { id: "my-attendance", label: "My Attendance", icon: Calendar },
    { id: "my-fees", label: "My Fees", icon: CreditCard },
    { id: "my-results", label: "My Results", icon: GraduationCap },
    { id: "my-profile", label: "My Profile", icon: User },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F0F4FF", display: "flex", flexDirection: "column" }}>
      {/* TOP HEADER BAR */}
      <header
        style={{
          background: T.sidebarBg,
          padding: '12px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
        }}
      >
        {/* Left: PBA logo/title area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: T.primaryGrad,
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 800, color: '#FFFFFF',
            boxShadow: T.primaryShadow
          }}>P</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.3px' }}>
              PBA Student Portal
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Student Self-Service System
            </div>
          </div>
        </div>

        {/* Right: student info + buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>{linkedStudent.name}</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>{linkedStudent.regNo} · {linkedStudent.branch}</div>
          </div>

          <button
            onClick={() => setShowPasswordModal(true)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              fontSize: '12px', fontWeight: 600,
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <KeyRound size={13} />
            Password
          </button>

          <button
            onClick={logout}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              fontSize: '12px', fontWeight: 600,
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </header>

      {/* TAB NAVIGATION BAR */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '2px',
            overflowX: 'auto'
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  padding: '12px 18px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #4F46E5' : '2px solid transparent',
                  color: isActive ? '#4F46E5' : '#64748B',
                  fontSize: '13px', fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} style={{ color: 'currentColor' }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content View */}
      <main style={{ flex: 1, padding: "28px 32px", backgroundColor: "#F0F4FF" }}>
        {activeSubTab === "my-dashboard" && <StudentDashboard student={linkedStudent} />}
        {activeSubTab === "my-timetable" && <StudentTimetable student={linkedStudent} />}
        {activeSubTab === "my-attendance" && <StudentAttendance student={linkedStudent} />}
        {activeSubTab === "my-fees" && <StudentFees student={linkedStudent} />}
        {activeSubTab === "my-results" && <StudentGrades student={linkedStudent} />}
        {activeSubTab === "my-profile" && <StudentProfile student={linkedStudent} />}
      </main>

      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
};
