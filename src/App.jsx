import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { LoginPage } from "./components/auth/LoginPage";
import { StudentPortalLayout } from "./components/student-portal/StudentPortalLayout";
import { ChangePasswordModal } from "./components/auth/ChangePasswordModal";

import { Sidebar } from "./components/layout/Sidebar";
import { TopHeader } from "./components/layout/TopHeader";

import { DashboardView } from "./components/dashboard/DashboardView";
import { AnalyticsView } from "./components/analytics/AnalyticsView";
import { CalendarView } from "./components/calendar/CalendarView";
import { LecturerManagementView } from "./components/lecturers/LecturerManagementView";
import { StudentManagementView } from "./components/students/StudentManagementView";
import { BookManagementView } from "./components/books/BookManagementView";
import { FeeManagementView } from "./components/fees/FeeManagementView";
import { ExamManagementView } from "./components/exams/ExamManagementView";
import { CommunicationsView } from "./components/communications/CommunicationsView";
import { ParentPortalView } from "./components/parents/ParentPortalView";
import { DocumentCentreView } from "./components/documents/DocumentCentreView";
import { GeneralAdminView } from "./components/admin/GeneralAdminView";

const MainContent = () => {
  const { activeTab, sessionUser, currentUser } = useApp();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // If unauthenticated, render Login Page
  if (!sessionUser) {
    return <LoginPage />;
  }

  // If Student role, render dedicated Student Self-Service Portal
  if (currentUser.role === "Student") {
    return <StudentPortalLayout />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF' }}>
      <Sidebar onOpenPasswordModal={() => setShowPasswordModal(true)} />
      <TopHeader onOpenPasswordModal={() => setShowPasswordModal(true)} />

      <main
        key={activeTab}
        className="page-enter"
        style={{
          marginLeft: '240px',
          marginTop: '60px',
          padding: '28px 32px',
          minHeight: 'calc(100vh - 60px)',
          background: '#F0F4FF',
          boxSizing: 'border-box'
        }}
      >
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "analytics" && <AnalyticsView />}
        {activeTab === "calendar" && <CalendarView />}
        {activeTab === "lecturers" && <LecturerManagementView />}
        {activeTab === "students" && <StudentManagementView />}
        {activeTab === "fees" && <FeeManagementView />}
        {activeTab === "exams" && <ExamManagementView />}
        {activeTab === "books" && <BookManagementView initialTab="catalogue" />}
        {activeTab === "printing" && <BookManagementView initialTab="printing" />}
        {activeTab === "communications" && <CommunicationsView />}
        {activeTab === "parents" && <ParentPortalView />}
        {activeTab === "documents" && <DocumentCentreView />}
        {activeTab === "admin" && <GeneralAdminView />}
      </main>

      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
