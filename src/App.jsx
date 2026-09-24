import React, { useState, useEffect } from "react";
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
import { PrintingQueueView } from "./components/books/PrintingQueueView";
import BackOfficeView from "./components/backoffice/BackOfficeView";
import { FeeManagementView } from "./components/fees/FeeManagementView";
import { ExamManagementView } from "./components/exams/ExamManagementView";
import { CommunicationsView } from "./components/communications/CommunicationsView";
import { ParentPortalView } from "./components/parents/ParentPortalView";
import { DocumentCentreView } from "./components/documents/DocumentCentreView";
import { GeneralAdminView } from "./components/admin/GeneralAdminView";

const MainContent = () => {
  const { activeTab, sessionUser, currentUser } = useApp();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const onLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  const isBackOffice =
    currentPath === '/back-office' ||
    currentPath.startsWith('/back-office') ||
    window.location.hash === '#/back-office';

  // If navigating to /back-office, render BackOfficeView directly (standalone portal)
  if (isBackOffice) {
    return <BackOfficeView />;
  }

  // If unauthenticated, render Login Page
  if (!sessionUser) {
    return <LoginPage isMobile={isMobile} />;
  }

  // If Student role, render dedicated Student Self-Service Portal
  if (currentUser.role === "Student") {
    return <StudentPortalLayout isMobile={isMobile} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF' }}>
      <Sidebar
        onOpenPasswordModal={() => setShowPasswordModal(true)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
      />
      <TopHeader
        onOpenPasswordModal={() => setShowPasswordModal(true)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
      />

      <main
        key={activeTab}
        className="page-enter"
        style={{
          marginLeft: isMobile ? '0' : '240px',
          marginTop: '60px',
          padding: isMobile ? '16px' : '28px 32px',
          minHeight: 'calc(100vh - 60px)',
          background: '#F0F4FF',
          boxSizing: 'border-box'
        }}
      >
        {activeTab === "dashboard" && <DashboardView isMobile={isMobile} />}
        {activeTab === "analytics" && <AnalyticsView isMobile={isMobile} />}
        {activeTab === "calendar" && <CalendarView isMobile={isMobile} />}
        {activeTab === "lecturers" && <LecturerManagementView isMobile={isMobile} />}
        {activeTab === "students" && <StudentManagementView isMobile={isMobile} />}
        {activeTab === "fees" && <FeeManagementView isMobile={isMobile} />}
        {activeTab === "exams" && <ExamManagementView isMobile={isMobile} />}
        {activeTab === "books" && <BookManagementView initialTab="catalogue" isMobile={isMobile} />}
        {activeTab === "printing" && <PrintingQueueView isMobile={isMobile} />}
        {activeTab === "communications" && <CommunicationsView isMobile={isMobile} />}
        {activeTab === "parents" && <ParentPortalView isMobile={isMobile} />}
        {activeTab === "documents" && <DocumentCentreView isMobile={isMobile} />}
        {activeTab === "admin" && <GeneralAdminView isMobile={isMobile} />}
      </main>

      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} isMobile={isMobile} />
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
