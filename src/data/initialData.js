export const initialData = {
  currentUser: {
    id: "usr-admin",
    username: "admin",
    name: "Dr. K. Liyanage",
    role: "Admin", // 'Admin', 'Branch Coordinator', 'Lecturer', 'Printing Staff', 'Student'
    email: "principal@pba.edu.lk",
    branch: "All",
    status: "Active"
  },

  selectedBranch: "All", // 'All', 'Kohuwala', 'Wattala', 'Panadura'

  userAccounts: [
    {
      id: "usr-admin",
      username: "admin",
      name: "Dr. K. Liyanage (Principal)",
      email: "principal@pba.edu.lk",
      role: "Admin",
      branch: "All",
      status: "Active",
      passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9" // admin123
    },
    {
      id: "usr-coord-kohuwala",
      username: "coordinator.kohuwala",
      name: "Malik De Silva (Kohuwala Coord)",
      email: "kohuwala@pba.edu.lk",
      role: "Branch Coordinator",
      branch: "Kohuwala",
      status: "Active",
      passwordHash: "7b0032e185012fa28d54c86eb293b2a2491a9fa264264639908cf820ec71fa79" // coord123
    },
    {
      id: "usr-lecturer1",
      username: "lecturer1",
      name: "Mr. Gamini Silva",
      email: "gamini.silva@pba.edu.lk",
      role: "Lecturer",
      branch: "Kohuwala",
      status: "Active",
      passwordHash: "c554904d9c026046e751240e8b2c89fec5026df1f463920958a04944d156ebc6" // lect123
    },
    {
      id: "usr-printing",
      username: "printing",
      name: "Saman Perera (Printing Staff)",
      email: "printing@pba.edu.lk",
      role: "Printing Staff",
      branch: "All",
      status: "Active",
      passwordHash: "35d259c636f0e4b85c184088019e99c80a256a5961e6c38221b37801be0d53dd" // print123
    },
    {
      id: "usr-student001",
      username: "student001",
      name: "Kasun Jayawardena",
      email: "kasun.j@gmail.com",
      role: "Student",
      branch: "Kohuwala",
      linkedStudentId: "std-001",
      status: "Active",
      passwordHash: "3cb33a1e2f7902998a44577f154bfeb83c3e80f90760406cf65a127a718ccfd4" // student123
    }
  ],

  branches: [
    { id: "br-1", name: "Kohuwala", address: "106, S D S Jayasinghe Mw, Kohuwala", phone: "+94 11 281 9900" },
    { id: "br-2", name: "Wattala", address: "735, New Negombo Rd, Wattala", phone: "+94 11 293 8800" },
    { id: "br-3", name: "Panadura", address: "238, Galle Rd, Walana Rd, Panadura", phone: "+94 38 223 7700" }
  ],

  lecturers: [
    {
      id: "lec-101",
      name: "Mr. Gamini Silva",
      subjects: ["Business Studies", "Entrepreneurship"],
      phone: "+94 77 123 4567",
      email: "gamini.silva@pba.edu.lk",
      dateJoined: "2022-01-15",
      branch: "Kohuwala",
      status: "Active",
      availability: {
        Monday: ["08:00–10:00", "10:30–12:30"],
        Tuesday: ["08:00–10:00"],
        Wednesday: ["10:30–12:30"],
        Thursday: ["08:00–10:00"],
        Friday: ["08:00–10:00"]
      }
    },
    {
      id: "lec-102",
      name: "Ms. Keshani Perera",
      subjects: ["Accounting", "Business Statistics"],
      phone: "+94 71 987 6543",
      email: "keshani.p@pba.edu.lk",
      dateJoined: "2021-06-01",
      branch: "Kohuwala",
      status: "Active",
      availability: {
        Monday: ["10:30–12:30"],
        Tuesday: ["08:00–10:00", "10:30–12:30"],
        Wednesday: ["08:00–10:00"],
        Thursday: ["10:30–12:30"],
        Friday: ["10:30–12:30"]
      }
    },
    {
      id: "lec-103",
      name: "Dr. Ravindra Fernando",
      subjects: ["Economics"],
      phone: "+94 76 555 1212",
      email: "ravindra.f@pba.edu.lk",
      dateJoined: "2020-09-10",
      branch: "Wattala",
      status: "Active",
      availability: {
        Monday: ["08:00–10:00"],
        Tuesday: ["10:30–12:30"],
        Wednesday: ["08:00–10:00"],
        Thursday: ["08:00–10:00"],
        Friday: ["08:00–10:00"]
      }
    },
    {
      id: "lec-104",
      name: "Ms. Dilini Jayasinghe",
      subjects: ["English Literature", "General English"],
      phone: "+94 70 333 4455",
      email: "dilini.j@pba.edu.lk",
      dateJoined: "2023-02-20",
      branch: "Panadura",
      status: "Active",
      availability: {
        Monday: ["13:00–15:00"],
        Tuesday: ["10:30–12:30"],
        Wednesday: ["13:00–15:00"],
        Thursday: ["10:30–12:30"],
        Friday: ["13:00–15:00"]
      }
    }
  ],

  batches: [
    { id: "batch-2024A", name: "Batch 2024-A (A/L Commerce)", branch: "Kohuwala", totalStudents: 32 },
    { id: "batch-2024B", name: "Batch 2024-B (A/L Arts)", branch: "Wattala", totalStudents: 28 },
    { id: "batch-2025A", name: "Batch 2025-A (Foundation)", branch: "Panadura", totalStudents: 25 }
  ],

  students: [
    {
      id: "std-001",
      regNo: "PBA-FT-2024-001",
      name: "Kasun Jayawardena",
      dob: "2006-04-12",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      subjects: ["Business Studies", "Accounting", "Economics"],
      phone: "+94 77 444 5566",
      parentPhone: "+94 71 222 3344",
      email: "kasun.j@gmail.com",
      address: "No. 45, Galle Road, Colombo 03",
      enrolmentDate: "2024-01-08",
      status: "Active",
      adminNotes: "Student has shown excellent leadership qualities in case studies."
    },
    {
      id: "std-002",
      regNo: "PBA-FT-2024-002",
      name: "Anuki Samarasinghe",
      dob: "2006-08-25",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      subjects: ["Business Studies", "Accounting", "Economics"],
      phone: "+94 76 111 2233",
      parentPhone: "+94 77 888 9900",
      email: "anuki.s@gmail.com",
      address: "No. 12, Kandy Road, Kiribathgoda",
      enrolmentDate: "2024-01-08",
      status: "Active",
      adminNotes: "Top scorer in Accounting midterm."
    },
    {
      id: "std-003",
      regNo: "PBA-FT-2024-003",
      name: "Dineth Ranasinghe",
      dob: "2006-02-14",
      batch: "Batch 2024-B (A/L Arts)",
      branch: "Wattala",
      subjects: ["Economics", "English Literature", "General English"],
      phone: "+94 70 888 7766",
      parentPhone: "+94 71 555 4433",
      email: "dineth.r@gmail.com",
      address: "No. 88, Highlevel Road, Nugegoda",
      enrolmentDate: "2024-01-10",
      status: "Active",
      adminNotes: "Regular participant in debate club."
    },
    {
      id: "std-004",
      regNo: "PBA-FT-2024-004",
      name: "Hiruni Mendis",
      dob: "2005-11-30",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      subjects: ["Business Studies", "Accounting", "Economics"],
      phone: "+94 72 333 2211",
      parentPhone: "+94 77 666 5544",
      email: "hiruni.mendis@gmail.com",
      address: "No. 104, Negombo Road, Wattala",
      enrolmentDate: "2024-01-12",
      status: "Active",
      adminNotes: "Requires extra support in Microeconomics formulas."
    },
    {
      id: "std-005",
      regNo: "PBA-FT-2024-005",
      name: "Shenaya Fernando",
      dob: "2007-01-19",
      batch: "Batch 2025-A (Foundation)",
      branch: "Panadura",
      subjects: ["Business Studies", "General English"],
      phone: "+94 75 999 0011",
      parentPhone: "+94 71 444 3322",
      email: "shenaya.f@gmail.com",
      address: "No. 15, Station Road, Dehiwala",
      enrolmentDate: "2025-01-05",
      status: "Active",
      adminNotes: ""
    }
  ],

  books: [
    { id: "bk-101", title: "PBA A/L Business Studies Guide Vol 1", subject: "Business Studies", version: "2024 Ed.", stock: 45, branch: "Kohuwala" },
    { id: "bk-102", title: "PBA Financial Accounting Theory & Practice", subject: "Accounting", version: "2024 Ed.", stock: 30, branch: "Kohuwala" },
    { id: "bk-103", title: "PBA Micro & Macro Economics Comprehensive Workbook", subject: "Economics", version: "2023 Rev 2", stock: 18, branch: "Wattala" },
    { id: "bk-104", title: "PBA English Literature Anthology", subject: "English Literature", version: "2024 Ed.", stock: 25, branch: "Panadura" }
  ],

  bookRequisitions: [
    {
      id: "req-201",
      bookTitle: "PBA A/L Business Studies Guide Vol 1",
      subject: "Business Studies",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      quantity: 35,
      dateNeeded: "2026-10-10",
      requestedBy: "Mr. Gamini Silva",
      dateSubmitted: "2026-09-15",
      isUrgent: false,
      status: "Approved"
    },
    {
      id: "req-202",
      bookTitle: "PBA Micro & Macro Economics Comprehensive Workbook",
      subject: "Economics",
      batch: "Batch 2024-B (A/L Arts)",
      branch: "Wattala",
      quantity: 30,
      dateNeeded: "2026-09-25",
      requestedBy: "Dr. Ravindra Fernando",
      dateSubmitted: "2026-09-18",
      isUrgent: true,
      status: "Pending"
    }
  ],

  printJobs: [
    {
      id: "pj-301",
      reqId: "req-201",
      bookTitle: "PBA A/L Business Studies Guide Vol 1",
      subject: "Business Studies",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      quantity: 35,
      requestedBy: "Mr. Gamini Silva",
      dateApproved: "2026-09-16",
      status: "In Progress",
      receivedDate: "2026-09-17 09:30 AM",
      receivedBy: "Saman Perera (Printing Staff)",
      completedDate: null,
      actualQtyPrinted: null,
      notes: "Paper stock verified. Printing cover pages."
    },
    {
      id: "pj-302",
      reqId: "req-200",
      bookTitle: "PBA Financial Accounting Theory & Practice",
      subject: "Accounting",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      quantity: 32,
      requestedBy: "Ms. Keshani Perera",
      dateApproved: "2026-09-10",
      status: "Completed",
      receivedDate: "2026-09-11 08:45 AM",
      receivedBy: "Saman Perera (Printing Staff)",
      completedDate: "2026-09-13 04:00 PM",
      actualQtyPrinted: 35,
      notes: "3 extra reserve copies printed."
    }
  ],

  leaveRequests: [
    {
      id: "lv-501",
      lecturerId: "lec-101",
      lecturerName: "Mr. Gamini Silva",
      subject: "Business Studies",
      branch: "Kohuwala",
      startDate: "2026-09-22",
      endDate: "2026-09-22",
      type: "Personal",
      reason: "Attending university seminar on entrepreneurship education.",
      dateSubmitted: "2026-09-18",
      status: "Pending",
      adminComment: "",
      coverLecturerAssigned: null
    },
    {
      id: "lv-502",
      lecturerId: "lec-102",
      lecturerName: "Ms. Keshani Perera",
      subject: "Accounting",
      branch: "Kohuwala",
      startDate: "2026-09-15",
      endDate: "2026-09-15",
      type: "Medical",
      reason: "Fever and doctor rest advice.",
      dateSubmitted: "2026-09-14",
      status: "Approved",
      adminComment: "Get well soon. Cover arranged.",
      coverLecturerAssigned: "Mr. Gamini Silva"
    }
  ],

  todayClasses: [
    {
      id: "cls-01",
      time: "08:00 – 10:00 AM",
      subject: "Business Studies",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      lecturer: "Mr. Gamini Silva",
      classroom: "Hall A (Capacity 40)",
      status: "Normal"
    },
    {
      id: "cls-02",
      time: "08:00 – 10:00 AM",
      subject: "Economics",
      batch: "Batch 2024-B (A/L Arts)",
      branch: "Wattala",
      lecturer: "Dr. Ravindra Fernando",
      classroom: "Hall B (Capacity 35)",
      status: "Normal"
    },
    {
      id: "cls-03",
      time: "10:30 – 12:30 PM",
      subject: "Accounting",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      lecturer: "Ms. Keshani Perera",
      classroom: "Lab 01 (Capacity 30)",
      status: "Changed",
      statusNote: "Moved to Lab 02"
    }
  ],

  syllabusTracker: [
    {
      batch: "Batch 2024-A (A/L Commerce)",
      subject: "Business Studies",
      branch: "Kohuwala",
      lecturer: "Mr. Gamini Silva",
      topics: [
        { name: "Unit 1: Business Foundations & Environment", completed: true, date: "2024-02-10" },
        { name: "Unit 2: Management Principles & Functions", completed: true, date: "2024-04-18" },
        { name: "Unit 3: Marketing Management & Strategy", completed: true, date: "2024-07-22" },
        { name: "Unit 4: Operations & Supply Chain", completed: false, date: null },
        { name: "Unit 5: Human Resource Management", completed: false, date: null }
      ]
    },
    {
      batch: "Batch 2024-A (A/L Commerce)",
      subject: "Accounting",
      branch: "Kohuwala",
      lecturer: "Ms. Keshani Perera",
      topics: [
        { name: "Unit 1: Financial Accounting Framework", completed: true, date: "2024-02-15" },
        { name: "Unit 2: Company Accounts & Adjustments", completed: true, date: "2024-05-20" },
        { name: "Unit 3: Cash Flow Statements", completed: true, date: "2024-08-12" },
        { name: "Unit 4: Cost & Management Accounting", completed: false, date: null }
      ]
    }
  ],

  attendanceRecords: [
    {
      id: "att-801",
      date: "2026-09-18",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      subject: "Business Studies",
      lecturer: "Mr. Gamini Silva",
      studentsCount: 32,
      presentCount: 29,
      lateCount: 2,
      absentCount: 1,
      records: [
        { studentId: "std-001", name: "Kasun Jayawardena", status: "Present" },
        { studentId: "std-002", name: "Anuki Samarasinghe", status: "Present" },
        { studentId: "std-004", name: "Hiruni Mendis", status: "Late" }
      ]
    }
  ],

  feeStructures: [
    { id: "fs-01", batch: "Batch 2024-A (A/L Commerce)", branch: "Kohuwala", name: "Monthly Programme Fee", amount: 15000, frequency: "Monthly", mandatory: true },
    { id: "fs-02", batch: "Batch 2024-B (A/L Arts)", branch: "Wattala", name: "Monthly Programme Fee", amount: 14000, frequency: "Monthly", mandatory: true },
    { id: "fs-03", batch: "Batch 2025-A (Foundation)", branch: "Panadura", name: "Term Registration Fee", amount: 25000, frequency: "Per Term", mandatory: true }
  ],

  studentFees: [
    {
      id: "fee-1001",
      studentId: "std-001",
      studentName: "Kasun Jayawardena",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      description: "September 2026 Monthly Fee",
      amountDue: 15000,
      dueDate: "2026-09-10",
      amountPaid: 15000,
      paymentDate: "2026-09-08",
      paymentMethod: "Bank Transfer",
      receiptNo: "REC-90812",
      status: "Paid"
    },
    {
      id: "fee-1002",
      studentId: "std-002",
      studentName: "Anuki Samarasinghe",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      description: "September 2026 Monthly Fee",
      amountDue: 15000,
      dueDate: "2026-09-10",
      amountPaid: 15000,
      paymentDate: "2026-09-10",
      paymentMethod: "Cash",
      receiptNo: "REC-90815",
      status: "Paid"
    },
    {
      id: "fee-1003",
      studentId: "std-004",
      studentName: "Hiruni Mendis",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      description: "August 2026 Monthly Fee",
      amountDue: 15000,
      dueDate: "2026-08-10",
      amountPaid: 0,
      paymentDate: null,
      paymentMethod: null,
      receiptNo: null,
      status: "Unpaid"
    }
  ],

  exams: [
    {
      id: "ex-901",
      name: "Mid-Term Examination 2026",
      type: "Term Test",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      subject: "Business Studies",
      date: "2026-10-05",
      time: "08:30 – 11:30 AM",
      duration: 180,
      classroom: "Exam Hall 1",
      invigilator: "Ms. Keshani Perera",
      maxMarks: 100,
      results: [
        { studentId: "std-001", studentName: "Kasun Jayawardena", regNo: "PBA-FT-2024-001", marks: 88, maxMarks: 100, percentage: 88, grade: "A", rank: 1 },
        { studentId: "std-002", studentName: "Anuki Samarasinghe", regNo: "PBA-FT-2024-002", marks: 84, maxMarks: 100, percentage: 84, grade: "A", rank: 2 },
        { studentId: "std-004", studentName: "Hiruni Mendis", regNo: "PBA-FT-2024-004", marks: 68, maxMarks: 100, percentage: 68, grade: "B", rank: 3 }
      ]
    },
    {
      id: "ex-902",
      name: "Accounting Mock Test 1",
      type: "Mock Exam",
      batch: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      subject: "Accounting",
      date: "2026-10-12",
      time: "08:30 – 11:30 AM",
      duration: 180,
      classroom: "Lab 01",
      invigilator: "Mr. Gamini Silva",
      maxMarks: 100,
      results: []
    }
  ],

  yearPlanEvents: [
    { id: "ev-01", title: "A/L Mid-Term Examinations", date: "2026-10-05", branch: "All", type: "Exam", description: "All A/L Batches internal term tests." },
    { id: "ev-02", title: "National Public Holiday (Vap Poya)", date: "2026-10-25", branch: "All", type: "Holiday", description: "Academy closed." },
    { id: "ev-03", title: "Kohuwala Parent Consultation Day", date: "2026-10-30", branch: "Kohuwala", type: "Event", description: "Progress review." }
  ],

  announcements: [
    {
      id: "anc-01",
      title: "Library Book Requisition Deadline for Term 3",
      body: "All lecturers must submit textbook print requisitions at least 2 weeks before distribution.",
      priority: "Urgent",
      targetAudience: "All Staff",
      branch: "All",
      datePosted: "2026-09-18"
    }
  ],

  notifications: [
    {
      id: "notif-01",
      userId: "usr-admin",
      message: "Urgent Book Requisition submitted by Dr. Ravindra Fernando (Date needed < 14 days).",
      type: "warning",
      timestamp: "2 hours ago",
      read: false
    }
  ],

  disciplineRecords: [
    {
      id: "disc-101",
      studentId: "std-004",
      studentName: "Hiruni Mendis",
      branch: "Kohuwala",
      type: "Warning Letter",
      dateIssued: "2026-08-20",
      reason: "Repeated unexcused late arrivals for 08:00 AM class sessions.",
      issuedBy: "Dr. K. Liyanage (Principal)",
      documentAttached: true
    }
  ],

  documents: [
    {
      id: "doc-01",
      studentId: "std-001",
      studentName: "Kasun Jayawardena",
      branch: "Kohuwala",
      title: "Enrolment Form & School Leaving Cert",
      type: "Enrolment Form",
      uploadDate: "2024-01-08",
      notes: "Verified original documents."
    }
  ],

  communicationTemplates: [
    {
      id: "cm-tmpl-01",
      name: "Monthly Fee Reminder",
      subject: "PBA Fee Payment Reminder - [BATCH]",
      body: "Dear Parent of [NAME],\n\nThis is a friendly reminder that the monthly tuition fee of LKR [AMOUNT] for [BATCH] is due by [DATE].\n\nThank you,\nPlatinum Business Academy Administration"
    },
    {
      id: "cm-tmpl-02",
      name: "Exam Reminder Notice",
      subject: "Upcoming Exam Notice - [BATCH]",
      body: "Dear Student [NAME],\n\nYour upcoming examination for [BATCH] is scheduled on [DATE]. Please arrive at least 15 minutes prior to start time.\n\nRegards,\nAcademic Administration"
    },
    {
      id: "cm-tmpl-03",
      name: "Attendance Warning Notice",
      subject: "Important: Low Attendance Warning for [NAME]",
      body: "Dear Parent of [NAME],\n\nWe regret to inform you that your child's attendance rate in [BATCH] has dropped below the required 75% threshold as of [DATE]. Please contact the academy coordinator immediately."
    }
  ],

  communicationsLog: [
    {
      id: "cml-01",
      date: "2026-09-18",
      sentBy: "Dr. K. Liyanage",
      channel: "WhatsApp",
      recipientGroup: "All Parents in Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      subject: "Mid-Term Exam Evaluation Timetable",
      preview: "Dear Parents, Mid-term evaluation timetable for Kohuwala branch has been published.",
      status: "Sent"
    }
  ],

  letterTemplates: [
    {
      id: "tmpl-01",
      name: "Warning Letter (Attendance / Conduct)",
      content: "DEAR PARENT / GUARDIAN OF [STUDENT_NAME],\n\nTHIS LETTER SERVES AS AN OFFICIAL WARNING REGARDING [STUDENT_NAME] ENROLLED IN [BATCH] AT PLATINUM BUSINESS ACADEMY.\n\nREASON: [REASON]\nDATE: [DATE]\n\nPLEASE CONTACT THE ACADEMY OFFICE AT YOUR EARLIEST CONVENIENCE.\n\nREGARDS,\nDR. K. LIYANAGE (PRINCIPAL)"
    }
  ],

  calendarEvents: [
    { id: "cal-01", title: "A/L Mid-Term Exam", date: "2026-10-05", type: "exam", branch: "Kohuwala", notes: "Commerce & Arts term tests" },
    { id: "cal-02", title: "Public Holiday - Vap Poya", date: "2026-10-25", type: "holiday", branch: "All", notes: "Academy closed" },
    { id: "cal-03", title: "Monthly Fee Due Date", date: "2026-10-10", type: "payment_due", branch: "All", notes: "October tuition fees due" },
    { id: "cal-04", title: "Special Revision Class", date: "2026-09-28", type: "class", branch: "Kohuwala", notes: "Accounting revision session" },
    { id: "cal-05", title: "Lecturer Leave - Mr. Gamini", date: "2026-09-22", type: "leave", branch: "Kohuwala", notes: "Seminar attendance" }
  ],

  subjects: [
    { id: "subj-001", code: "BIO", name: "Biology", stream: "Science", color: "#2F855A", createdAt: "2026-09-01T00:00:00.000Z" },
    { id: "subj-002", code: "CHEM", name: "Chemistry", stream: "Science", color: "#2B6CB0", createdAt: "2026-09-01T00:00:00.000Z" },
    { id: "subj-003", code: "PHY", name: "Physics", stream: "Science", color: "#6B46C1", createdAt: "2026-09-01T00:00:00.000Z" },
    { id: "subj-004", code: "MATH", name: "Mathematics", stream: "Maths", color: "#C53030", createdAt: "2026-09-01T00:00:00.000Z" },
    { id: "subj-005", code: "ACC", name: "Accounting", stream: "Commerce", color: "#D4A017", createdAt: "2026-09-01T00:00:00.000Z" },
    { id: "subj-006", code: "BUS", name: "Business Studies", stream: "Commerce", color: "#D4A017", createdAt: "2026-09-01T00:00:00.000Z" },
    { id: "subj-007", code: "ECON", name: "Economics", stream: "Commerce", color: "#B7791F", createdAt: "2026-09-01T00:00:00.000Z" },
    { id: "subj-008", code: "ICT", name: "ICT", stream: "Technology", color: "#2B6CB0", createdAt: "2026-09-01T00:00:00.000Z" }
  ],

  batchSubjects: [
    {
      id: "bs-001",
      batchId: "batch-001",
      batchName: "Batch 2024-A (A/L Commerce)",
      branch: "Kohuwala",
      createdAt: "2026-09-01T00:00:00.000Z",
      subjectAssignments: [
        {
          subjectId: "subj-005",
          subjectName: "Accounting",
          subjectCode: "ACC",
          mainLecturerId: "lec-102",
          mainLecturerName: "Ms. Keshani Perera",
          assistantLecturerId: "usr-lecturer1",
          assistantLecturerName: "Mr. Gamini Silva",
          hasAssistant: true,
          classesPerWeek: 2,
          classSchedule: [
            { slotId: "cs-101", classNumber: 1, dayOfWeek: "Monday", startTime: "08:00", endTime: "10:00", venue: "Hall A", taughtBy: "main" },
            { slotId: "cs-102", classNumber: 2, dayOfWeek: "Thursday", startTime: "10:30", endTime: "12:30", venue: "Hall B", taughtBy: "assistant" }
          ]
        },
        {
          subjectId: "subj-006",
          subjectName: "Business Studies",
          subjectCode: "BUS",
          mainLecturerId: "usr-lecturer1",
          mainLecturerName: "Mr. Gamini Silva",
          assistantLecturerId: null,
          assistantLecturerName: null,
          hasAssistant: false,
          classesPerWeek: 1,
          classSchedule: [
            { slotId: "cs-103", classNumber: 1, dayOfWeek: "Tuesday", startTime: "08:00", endTime: "10:00", venue: "Hall A", taughtBy: "main" }
          ]
        },
        {
          subjectId: "subj-007",
          subjectName: "Economics",
          subjectCode: "ECON",
          mainLecturerId: "lec-103",
          mainLecturerName: "Mr. Nimal Fernando",
          assistantLecturerId: null,
          assistantLecturerName: null,
          hasAssistant: false,
          classesPerWeek: 1,
          classSchedule: [
            { slotId: "cs-104", classNumber: 1, dayOfWeek: "Wednesday", startTime: "10:30", endTime: "12:30", venue: "Hall C", taughtBy: "main" }
          ]
        }
      ]
    }
  ],

  studentSubjects: [
    {
      id: "ss-001",
      studentId: "std-001",
      subjectId: "subj-005",
      batchId: "batch-001",
      enrolledAt: "2026-09-01T00:00:00.000Z",
      active: true
    }
  ]
};

