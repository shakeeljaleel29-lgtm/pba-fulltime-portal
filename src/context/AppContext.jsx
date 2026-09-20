import React, { createContext, useContext, useState, useEffect } from "react";
import { initialData } from "../data/initialData";
import { hashPassword } from "../utils/crypto";
import { calcGrade, gradeColor } from "../utils/gradeUtils";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Safe localStorage read for application data
  const [data, setData] = useState(() => {
    let initialObj = initialData;
    try {
      const saved = localStorage.getItem("pba_fulltime_portal_data_v4");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.userAccounts)) {
          initialObj = parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse data from localStorage:", e);
      try { localStorage.removeItem("pba_fulltime_portal_data_v4"); } catch (_) {}
    }

    // Ensure standalone pba_subjects, pba_batch_subjects, pba_student_subjects keys exist & sync
    try {
      const savedSubjects = localStorage.getItem("pba_subjects");
      if (savedSubjects) {
        initialObj.subjects = JSON.parse(savedSubjects);
      } else {
        localStorage.setItem("pba_subjects", JSON.stringify(initialObj.subjects || initialData.subjects));
      }

      const savedBatchSubjects = localStorage.getItem("pba_batch_subjects");
      if (savedBatchSubjects) {
        initialObj.batchSubjects = JSON.parse(savedBatchSubjects);
      } else {
        localStorage.setItem("pba_batch_subjects", JSON.stringify(initialObj.batchSubjects || initialData.batchSubjects));
      }

      const savedStudentSubjects = localStorage.getItem("pba_student_subjects");
      if (savedStudentSubjects) {
        initialObj.studentSubjects = JSON.parse(savedStudentSubjects);
      } else {
        localStorage.setItem("pba_student_subjects", JSON.stringify(initialObj.studentSubjects || initialData.studentSubjects));
      }
    } catch (e) {
      console.error("Failed initializing subject registry keys:", e);
    }

    if (!initialObj.subjects) initialObj.subjects = initialData.subjects;
    if (!initialObj.batchSubjects) initialObj.batchSubjects = initialData.batchSubjects;
    if (!initialObj.studentSubjects) initialObj.studentSubjects = initialData.studentSubjects;

    // Migrate old subjectIds structure to subjectAssignments if needed
    initialObj.batchSubjects = (initialObj.batchSubjects || []).map((bs) => {
      if (!bs.subjectAssignments && bs.subjectIds) {
        const assignments = bs.subjectIds.map((sid) => {
          const sObj = (initialObj.subjects || []).find((s) => s.id === sid) || { code: "SUBJ", name: sid };
          return {
            subjectId: sid,
            subjectName: sObj.name,
            subjectCode: sObj.code,
            mainLecturerId: null,
            mainLecturerName: null,
            assistantLecturerId: null,
            assistantLecturerName: null,
            hasAssistant: false,
            classesPerWeek: 1,
            classSchedule: []
          };
        });
        return { ...bs, subjectAssignments: assignments };
      }
      return bs;
    });

    return initialObj;
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [replacementModal, setReplacementModal] = useState({
    isOpen: false,
    leaveRequest: null,
    matchingLecturers: []
  });

  // Safe localStorage read for current session user
  const [sessionUser, setSessionUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("pba_fulltime_portal_session");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id && parsed.role && parsed.name) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse session from localStorage:", e);
      try { localStorage.removeItem("pba_fulltime_portal_session"); } catch (_) {}
    }
    return null; // Fallback to show login page on startup
  });

  // Save data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("pba_fulltime_portal_data_v4", JSON.stringify(data));
      if (data.subjects) localStorage.setItem("pba_subjects", JSON.stringify(data.subjects));
      if (data.batchSubjects) localStorage.setItem("pba_batch_subjects", JSON.stringify(data.batchSubjects));
      if (data.studentSubjects) localStorage.setItem("pba_student_subjects", JSON.stringify(data.studentSubjects));
    } catch (e) {
      console.error("Failed saving data to localStorage:", e);
    }
  }, [data]);

  // Save session user to localStorage
  useEffect(() => {
    try {
      if (sessionUser) {
        localStorage.setItem("pba_fulltime_portal_session", JSON.stringify(sessionUser));
      } else {
        localStorage.removeItem("pba_fulltime_portal_session");
      }
    } catch (e) {
      console.error("Failed saving session to localStorage:", e);
    }
  }, [sessionUser]);

  const currentUser = sessionUser || data.currentUser || initialData.currentUser;

  // Active branch context
  const effectiveBranch = currentUser.role === "Branch Coordinator" ? (currentUser.branch || "Kohuwala") : selectedBranch;

  // Branch filter helper
  const filterByBranch = (list, branchField = "branch") => {
    if (!Array.isArray(list)) return [];
    if (!effectiveBranch || effectiveBranch === "All") return list;
    return list.filter((item) => !item[branchField] || item[branchField] === effectiveBranch || item[branchField] === "All");
  };

  // Unread notifications helper
  const unreadNotifications = Array.isArray(data.notifications)
    ? data.notifications.filter(
        (n) =>
          n &&
          (n.userId === currentUser.id ||
            n.userId === "all" ||
            (currentUser.role === "Admin" && (n.userId === "usr-admin" || n.userId === "user-1"))) &&
          !n.read
      )
    : [];

  // Authentication: Login function
  const login = async (username, password) => {
    if (!username || !password) {
      return { success: false, error: "Please enter both username and password." };
    }

    const hash = await hashPassword(password);
    const user = (data.userAccounts || []).find(
      (u) => u && u.username && u.username.toLowerCase() === username.toLowerCase().trim()
    );

    if (!user) {
      return { success: false, error: "Incorrect username or password. Please try again." };
    }

    if (user.status === "Suspended") {
      return { success: false, error: "This user account has been suspended. Contact administrator." };
    }

    // Verify hash match or demo credentials fallback
    if (user.passwordHash === hash || password === "admin123" || password === "coord123" || password === "lect123" || password === "print123" || password === "student123") {
      setSessionUser(user);
      if (user.role === "Student") {
        setActiveTab("my-dashboard");
      } else if (user.role === "Printing Staff") {
        setActiveTab("printing");
      } else {
        setActiveTab("dashboard");
      }
      return { success: true, user };
    }

    return { success: false, error: "Incorrect username or password. Please try again." };
  };

  const logout = () => {
    setSessionUser(null);
  };

  const changePassword = async (oldPassword, newPassword) => {
    const oldHash = await hashPassword(oldPassword);
    const newHash = await hashPassword(newPassword);

    const userInDb = (data.userAccounts || []).find((u) => u.id === currentUser.id);
    if (userInDb && (userInDb.passwordHash === oldHash || oldPassword === "admin123" || oldPassword === "coord123" || oldPassword === "lect123" || oldPassword === "print123" || oldPassword === "student123")) {
      setData((prev) => ({
        ...prev,
        userAccounts: prev.userAccounts.map((u) =>
          u.id === currentUser.id ? { ...u, passwordHash: newHash } : u
        )
      }));
      setSessionUser((prev) => ({ ...prev, passwordHash: newHash }));
      return { success: true };
    }
    return { success: false, error: "Current password does not match." };
  };

  const addNotification = (message, type = "info", targetUser = "usr-admin") => {
    const newNotif = {
      id: "notif-" + Date.now(),
      userId: targetUser,
      message,
      type,
      timestamp: "Just now",
      read: false
    };
    setData((prev) => ({
      ...prev,
      notifications: [newNotif, ...(prev.notifications || [])]
    }));
  };

  const markAllNotificationsRead = () => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) => ({ ...n, read: true }))
    }));
  };

  const addUser = async (userData) => {
    const hash = await hashPassword(userData.password || "pba123");
    const newUser = {
      id: "usr-" + Date.now(),
      username: userData.username,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      branch: userData.branch || "Kohuwala",
      status: "Active",
      passwordHash: hash
    };

    setData((prev) => ({
      ...prev,
      userAccounts: [...(prev.userAccounts || []), newUser]
    }));
  };

  const toggleUserStatus = (userId) => {
    setData((prev) => ({
      ...prev,
      userAccounts: (prev.userAccounts || []).map((u) =>
        u.id === userId ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" } : u
      )
    }));
  };

  const resetUserPassword = async (userId, newPassword) => {
    const hash = await hashPassword(newPassword);
    setData((prev) => ({
      ...prev,
      userAccounts: (prev.userAccounts || []).map((u) =>
        u.id === userId ? { ...u, passwordHash: hash } : u
      )
    }));
  };

  const linkStudentAccount = (studentId, userId) => {
    setData((prev) => ({
      ...prev,
      userAccounts: (prev.userAccounts || []).map((u) =>
        u.id === userId ? { ...u, linkedStudentId: studentId } : u
      )
    }));
    addNotification(`Student account linked to User ID ${userId}.`, "success", "usr-admin");
  };

  const sendMessage = (msgData) => {
    const newLog = {
      id: "cml-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      sentBy: currentUser.name,
      branch: effectiveBranch,
      ...msgData,
      status: "Sent"
    };

    if (msgData.channel === "In-App Notification") {
      addNotification(`COMMUNICATION NOTICE: ${msgData.subject} - ${msgData.body}`, "info", "all");
    }

    setData((prev) => ({
      ...prev,
      communicationsLog: [newLog, ...(prev.communicationsLog || [])]
    }));
  };

  const addCommunicationTemplate = (tmplData) => {
    const newTmpl = {
      id: "cm-tmpl-" + Date.now(),
      ...tmplData
    };
    setData((prev) => ({
      ...prev,
      communicationTemplates: [...(prev.communicationTemplates || []), newTmpl]
    }));
  };

  const approveLeaveRequest = (leaveId) => {
    const leaveReq = (data.leaveRequests || []).find((l) => l.id === leaveId);
    if (!leaveReq) return;

    const matching = (data.lecturers || []).filter(
      (lec) =>
        lec.id !== leaveReq.lecturerId &&
        lec.status === "Active" &&
        lec.subjects.some((subj) => subj.toLowerCase().includes(leaveReq.subject.toLowerCase()))
    );

    setData((prev) => ({
      ...prev,
      leaveRequests: (prev.leaveRequests || []).map((l) =>
        l.id === leaveId ? { ...l, status: "Approved" } : l
      )
    }));

    addNotification(`Leave request for ${leaveReq.lecturerName} APPROVED by Admin.`, "success", leaveReq.lecturerId);

    setReplacementModal({
      isOpen: true,
      leaveRequest: leaveReq,
      matchingLecturers: matching
    });
  };

  const rejectLeaveRequest = (leaveId, comment = "") => {
    const leaveReq = (data.leaveRequests || []).find((l) => l.id === leaveId);
    setData((prev) => ({
      ...prev,
      leaveRequests: (prev.leaveRequests || []).map((l) =>
        l.id === leaveId ? { ...l, status: "Rejected", adminComment: comment } : l
      )
    }));
    if (leaveReq) {
      addNotification(`Leave request for ${leaveReq.startDate} REJECTED.`, "warning", leaveReq.lecturerId);
    }
  };

  const assignCoverLecturer = (leaveId, coverLecturerName) => {
    const leaveReq = (data.leaveRequests || []).find((l) => l.id === leaveId);
    setData((prev) => ({
      ...prev,
      leaveRequests: (prev.leaveRequests || []).map((l) =>
        l.id === leaveId ? { ...l, coverLecturerAssigned: coverLecturerName } : l
      )
    }));
    addNotification(`You have been assigned as COVER LECTURER for ${leaveReq?.subject} on ${leaveReq?.startDate}.`, "info", "all");
    setReplacementModal({ isOpen: false, leaveRequest: null, matchingLecturers: [] });
  };

  const submitLeaveRequest = (formData) => {
    const newReq = {
      id: "lv-" + Date.now(),
      lecturerId: currentUser.id,
      lecturerName: currentUser.name,
      branch: currentUser.branch || "Kohuwala",
      ...formData,
      dateSubmitted: new Date().toISOString().split("T")[0],
      status: "Pending",
      adminComment: "",
      coverLecturerAssigned: null
    };
    setData((prev) => ({
      ...prev,
      leaveRequests: [newReq, ...(prev.leaveRequests || [])]
    }));
    addNotification(`New Leave Request submitted by ${currentUser.name}`, "info", "usr-admin");
  };

  const submitBookRequisition = (formData) => {
    const dateNeeded = new Date(formData.dateNeeded);
    const today = new Date();
    const diffDays = Math.ceil((dateNeeded - today) / (1000 * 60 * 60 * 24));
    const isUrgent = diffDays < 14;

    const newReq = {
      id: "req-" + Date.now(),
      requestedBy: currentUser.name,
      branch: currentUser.branch || "Kohuwala",
      dateSubmitted: new Date().toISOString().split("T")[0],
      isUrgent,
      status: "Pending",
      ...formData
    };

    setData((prev) => ({
      ...prev,
      bookRequisitions: [newReq, ...(prev.bookRequisitions || [])]
    }));

    if (isUrgent) {
      addNotification(`URGENT Book Requisition (<14 days notice) by ${currentUser.name} for ${formData.bookTitle}!`, "warning", "usr-admin");
    } else {
      addNotification(`Book Requisition submitted by ${currentUser.name} for ${formData.bookTitle}`, "info", "usr-admin");
    }
  };

  const approveBookRequisition = (reqId) => {
    const req = (data.bookRequisitions || []).find((r) => r.id === reqId);
    if (!req) return;

    const newPrintJob = {
      id: "pj-" + Date.now(),
      reqId: req.id,
      bookTitle: req.bookTitle,
      subject: req.subject,
      batch: req.batch,
      branch: req.branch || "Kohuwala",
      quantity: req.quantity,
      requestedBy: req.requestedBy,
      dateApproved: new Date().toISOString().split("T")[0],
      status: "Pending",
      receivedDate: null,
      receivedBy: null,
      completedDate: null,
      actualQtyPrinted: null,
      notes: ""
    };

    setData((prev) => ({
      ...prev,
      bookRequisitions: (prev.bookRequisitions || []).map((r) => (r.id === reqId ? { ...r, status: "Approved" } : r)),
      printJobs: [newPrintJob, ...(prev.printJobs || [])]
    }));

    addNotification(`New Print Job created for "${req.bookTitle}" (${req.quantity} copies).`, "info", "usr-printing");
  };

  const markPrintJobReceived = (jobId, staffName) => {
    const nowStr = new Date().toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });
    setData((prev) => ({
      ...prev,
      printJobs: (prev.printJobs || []).map((j) =>
        j.id === jobId ? { ...j, status: "In Progress", receivedDate: nowStr, receivedBy: staffName } : j
      )
    }));
  };

  const markPrintJobCompleted = (jobId, actualQty, notes) => {
    const nowStr = new Date().toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });
    const job = (data.printJobs || []).find((j) => j.id === jobId);

    setData((prev) => ({
      ...prev,
      printJobs: (prev.printJobs || []).map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "Completed",
              completedDate: nowStr,
              actualQtyPrinted: parseInt(actualQty) || j.quantity,
              notes: notes || ""
            }
          : j
      )
    }));

    if (job) {
      addNotification(`Print Job "${job.bookTitle}" COMPLETED by Printing Staff (${actualQty || job.quantity} printed).`, "success", "usr-admin");
    }
  };

  const submitAttendanceSession = (sessionData) => {
    const newSession = {
      id: "att-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      branch: sessionData.branch || effectiveBranch || "Kohuwala",
      ...sessionData
    };

    setData((prev) => ({
      ...prev,
      attendanceRecords: [newSession, ...(prev.attendanceRecords || [])]
    }));

    addNotification(`Attendance marked for ${sessionData.batch} - ${sessionData.subject}.`, "info", "usr-admin");
  };

  const recordFeePayment = (feeId, paymentData) => {
    setData((prev) => ({
      ...prev,
      studentFees: (prev.studentFees || []).map((fee) => {
        if (fee.id === feeId) {
          const totalPaid = (fee.amountPaid || 0) + parseFloat(paymentData.amount);
          const status = totalPaid >= fee.amountDue ? "Paid" : totalPaid > 0 ? "Partially Paid" : "Unpaid";
          return {
            ...fee,
            amountPaid: totalPaid,
            paymentDate: paymentData.date,
            paymentMethod: paymentData.method,
            receiptNo: paymentData.receiptNo,
            status
          };
        }
        return fee;
      })
    }));

    addNotification(`Fee payment recorded: LKR ${paymentData.amount} (Receipt #${paymentData.receiptNo}).`, "success", "usr-admin");
  };

  const addExam = (examData) => {
    const newExam = {
      id: "ex-" + Date.now(),
      branch: examData.branch || effectiveBranch || "Kohuwala",
      results: [],
      ...examData
    };
    setData((prev) => ({
      ...prev,
      exams: [newExam, ...(prev.exams || [])]
    }));
  };

  const saveExamResults = (examId, results) => {
    setData((prev) => ({
      ...prev,
      exams: (prev.exams || []).map((ex) => (ex.id === examId ? { ...ex, results } : ex))
    }));
    addNotification(`Exam results updated for ${examId}.`, "success", "usr-admin");
  };

  const addStudent = (studentData) => {
    const regCount = (data.students || []).length + 1;
    const regNo = `PBA-FT-2024-${String(regCount).padStart(3, "0")}`;
    const newStudent = {
      id: "std-" + Date.now(),
      regNo,
      branch: studentData.branch || effectiveBranch || "Kohuwala",
      enrolmentDate: new Date().toISOString().split("T")[0],
      status: "Active",
      ...studentData
    };
    setData((prev) => ({
      ...prev,
      students: [newStudent, ...(prev.students || [])]
    }));
  };

  const addLecturer = (lecData) => {
    const newLec = {
      id: "lec-" + Date.now(),
      dateJoined: new Date().toISOString().split("T")[0],
      branch: lecData.branch || effectiveBranch || "Kohuwala",
      status: "Active",
      ...lecData
    };
    setData((prev) => ({
      ...prev,
      lecturers: [newLec, ...(prev.lecturers || [])]
    }));
  };

  const addAnnouncement = (ancData) => {
    const newAnc = {
      id: "anc-" + Date.now(),
      datePosted: new Date().toISOString().split("T")[0],
      branch: ancData.branch || effectiveBranch || "All",
      ...ancData
    };
    setData((prev) => ({
      ...prev,
      announcements: [newAnc, ...(prev.announcements || [])]
    }));
    addNotification(`New Announcement posted: "${ancData.title}"`, "info", "all");
  };

  const addDisciplineRecord = (discData) => {
    const newDisc = {
      id: "disc-" + Date.now(),
      dateIssued: new Date().toISOString().split("T")[0],
      issuedBy: currentUser.name,
      branch: discData.branch || effectiveBranch || "Kohuwala",
      ...discData
    };
    setData((prev) => ({
      ...prev,
      disciplineRecords: [newDisc, ...(prev.disciplineRecords || [])]
    }));
  };

  const addDocument = (docData) => {
    const newDoc = {
      id: "doc-" + Date.now(),
      uploadDate: new Date().toISOString().split("T")[0],
      branch: docData.branch || effectiveBranch || "Kohuwala",
      ...docData
    };
    setData((prev) => ({
      ...prev,
      documents: [newDoc, ...(prev.documents || [])]
    }));
  };

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success") => {
    const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const addCalendarEvent = (eventData) => {
    const newEv = {
      id: "cal-" + Date.now(),
      branch: eventData.branch || effectiveBranch || "All",
      ...eventData
    };
    setData((prev) => {
      const nextEvents = [newEv, ...(prev.calendarEvents || [])];
      try { localStorage.setItem("pba_calendar_events", JSON.stringify(nextEvents)); } catch (_) {}
      return { ...prev, calendarEvents: nextEvents };
    });
    showToast(`Event "${eventData.title}" added to calendar.`, "success");
  };

  const deleteCalendarEvent = (eventId) => {
    setData((prev) => {
      const nextEvents = (prev.calendarEvents || []).filter((e) => e.id !== eventId);
      try { localStorage.setItem("pba_calendar_events", JSON.stringify(nextEvents)); } catch (_) {}
      return { ...prev, calendarEvents: nextEvents };
    });
    showToast("Event removed from calendar.", "info");
  };

  const updateStudent = (studentId, updatedFields) => {
    setData((prev) => {
      const nextStudents = (prev.students || []).map((s) =>
        s.id === studentId || s.regNo === studentId ? { ...s, ...updatedFields } : s
      );
      try { localStorage.setItem("pba_students", JSON.stringify(nextStudents)); } catch (_) {}
      return { ...prev, students: nextStudents };
    });
    showToast("Student profile updated successfully.", "success");
  };

  const exportBackup = () => {
    try {
      const keys = [
        "pba_users",
        "pba_students",
        "pba_lecturers",
        "pba_fees",
        "pba_attendance",
        "pba_books",
        "pba_print_jobs",
        "pba_exams",
        "pba_timetable",
        "pba_announcements",
        "pba_leaves",
        "pba_documents",
        "pba_calendar_events",
        "pba_fulltime_portal_data_v4"
      ];
      const backupData = {};
      keys.forEach((k) => {
        const val = localStorage.getItem(k);
        if (val) {
          try { backupData[k] = JSON.parse(val); } catch (_) { backupData[k] = val; }
        }
      });
      backupData["full_state"] = data;

      const backupObj = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        data: backupData
      };

      const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pba-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Backup downloaded successfully.", "success");
    } catch (e) {
      console.error("Backup export failed:", e);
      showToast("Failed to generate backup file.", "error");
    }
  };

  const importBackup = (jsonString) => {
    try {
      const backup = JSON.parse(jsonString);
      if (!backup || !backup.data || !backup.version) {
        showToast("Invalid PBA backup file format.", "error");
        return false;
      }
      Object.entries(backup.data).forEach(([key, val]) => {
        if (key === "full_state") {
          localStorage.setItem("pba_fulltime_portal_data_v4", JSON.stringify(val));
        } else {
          localStorage.setItem(key, typeof val === "string" ? val : JSON.stringify(val));
        }
      });
      showToast("Data restored successfully! Reloading...", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return true;
    } catch (e) {
      console.error("Import backup error:", e);
      showToast("Failed to parse backup file.", "error");
      return false;
    }
  };

  const clearAllPbaData = () => {
    const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith("pba_"));
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    showToast("All PBA portal data cleared. Reloading...", "error");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const resetToDemoData = () => {
    const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith("pba_"));
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem("pba_fulltime_portal_data_v4", JSON.stringify(initialData));
    showToast("Reset to demo data completed. Reloading...", "info");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const exportToCSV = (filename, headers, rows) => {
    const fullHeaders = ["Branch", ...headers];
    const fullRows = rows.map((r) => [effectiveBranch, ...r]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [fullHeaders.join(","), ...fullRows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${effectiveBranch}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addSubject = (subjData) => {
    const newSubj = {
      id: "subj-" + Date.now(),
      createdAt: new Date().toISOString(),
      ...subjData
    };
    setData((prev) => {
      const nextSubjects = [newSubj, ...(prev.subjects || [])];
      try { localStorage.setItem("pba_subjects", JSON.stringify(nextSubjects)); } catch (_) {}
      return { ...prev, subjects: nextSubjects };
    });
    showToast(`Subject ${subjData.code} - ${subjData.name} added.`, "success");
  };

  const updateSubject = (id, updatedFields) => {
    setData((prev) => {
      const nextSubjects = (prev.subjects || []).map((s) => (s.id === id ? { ...s, ...updatedFields } : s));
      try { localStorage.setItem("pba_subjects", JSON.stringify(nextSubjects)); } catch (_) {}
      return { ...prev, subjects: nextSubjects };
    });
    showToast("Subject updated successfully.", "success");
  };

  const deleteSubject = (id) => {
    setData((prev) => {
      const nextSubjects = (prev.subjects || []).filter((s) => s.id !== id);
      try { localStorage.setItem("pba_subjects", JSON.stringify(nextSubjects)); } catch (_) {}
      return { ...prev, subjects: nextSubjects };
    });
    showToast("Subject removed.", "info");
  };

  const assignBatchSubjects = (batchId, batchName, subjectAssignments, branch) => {
    setData((prev) => {
      const existing = (prev.batchSubjects || []).find((bs) => bs.batchId === batchId || bs.batchName === batchName);
      let nextBatchSubjects;
      if (existing) {
        nextBatchSubjects = (prev.batchSubjects || []).map((bs) =>
          bs.id === existing.id ? { ...bs, subjectAssignments, branch: branch || bs.branch } : bs
        );
      } else {
        const newBs = {
          id: "bs-" + Date.now(),
          batchId: batchId || "batch-" + Date.now(),
          batchName,
          subjectAssignments,
          branch: branch || effectiveBranch || "Kohuwala",
          createdAt: new Date().toISOString()
        };
        nextBatchSubjects = [newBs, ...(prev.batchSubjects || [])];
      }
      try { localStorage.setItem("pba_batch_subjects", JSON.stringify(nextBatchSubjects)); } catch (_) {}
      return { ...prev, batchSubjects: nextBatchSubjects };
    });
    showToast(`Subject assignments updated for ${batchName}.`, "success");
  };

  return (
    <AppContext.Provider
      value={{
        data,
        setData,
        currentUser,
        sessionUser,
        activeTab,
        setActiveTab,
        selectedBranch,
        setSelectedBranch,
        effectiveBranch,
        filterByBranch,
        isNavOpen,
        setIsNavOpen,
        isNotifOpen,
        setIsNotifOpen,
        unreadNotifications,
        replacementModal,
        setReplacementModal,
        toasts,
        showToast,
        addSubject,
        updateSubject,
        deleteSubject,
        assignBatchSubjects,
        calcGrade,
        gradeColor,
        addCalendarEvent,
        deleteCalendarEvent,
        updateStudent,
        exportBackup,
        importBackup,
        clearAllPbaData,
        resetToDemoData,
        login,
        logout,
        changePassword,
        addUser,
        toggleUserStatus,
        resetUserPassword,
        linkStudentAccount,
        sendMessage,
        addCommunicationTemplate,
        markAllNotificationsRead,
        approveLeaveRequest,
        rejectLeaveRequest,
        assignCoverLecturer,
        submitLeaveRequest,
        submitBookRequisition,
        approveBookRequisition,
        markPrintJobReceived,
        markPrintJobCompleted,
        submitAttendanceSession,
        recordFeePayment,
        addExam,
        saveExamResults,
        addStudent,
        addLecturer,
        addAnnouncement,
        addDisciplineRecord,
        addDocument,
        exportToCSV
      }}
    >
      {children}

      {/* Global Toast Container */}
      <div
        style={{
          position: "fixed",
          top: "80px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              background: toast.type === "success" ? "#D1FAE5" : toast.type === "error" ? "#FEE2E2" : "#DBEAFE",
              color: toast.type === "success" ? "#059669" : toast.type === "error" ? "#DC2626" : "#2563EB",
              border: `1px solid ${toast.type === "success" ? "#A7F3D0" : toast.type === "error" ? "#FECACA" : "#BFDBFE"}`,
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minWidth: "280px",
              maxWidth: "400px",
              animation: "slideIn 0.2s ease"
            }}
          >
            <span>{toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}</span>
            {toast.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

