import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { DigitalAttendance } from "./DigitalAttendance";
import { StudentProfileDrawer } from "./StudentProfileDrawer";
export { StudentProfileDrawer } from "./StudentProfileDrawer";
import { ParentSummaryView } from "./ParentSummaryView";
import {
  GraduationCap,
  CalendarCheck,
  Plus,
  Filter,
  Eye,
  Share2,
  Download,
  Printer,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { printClassListPDF } from "../../utils/pdfGenerator";
import { downloadStudentCsvTemplate, parseImportFile } from "../../utils/csvImportUtils";

import { T, theme, type as t } from "../../theme";

const safeLS = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
};

const DEFAULT_SUBJECTS = [
  'Biology', 'Physics', 'Chemistry', 'Mathematics',
  'Accounts', 'Business Studies', 'Economics',
  'English', 'General Paper', 'History'
];

const syncStudentsToBatches = () => {
  const _allStudents = safeLS('pba_students', []) || [];
  const _allBatches  = safeLS('pba_batches',  []) || [];
  if (!_allStudents.length || !_allBatches.length) return 0;

  // Build lookup maps for fast access
  const _batchById   = {};
  const _batchByName = {};
  _allBatches.forEach(b => {
    if (b.id)   _batchById[b.id]             = b;
    if (b.name) _batchByName[b.name.trim().toLowerCase()] = b;
  });

  let _added = 0;

  _allStudents.forEach(student => {
    // Try every possible field name the batch reference might be stored in
    const batchRef =
      student.batchId        ||
      student.batch          ||
      student.batchEnrolled  ||
      student.batchName      ||
      student.class          ||
      student.group          ||
      null;

    if (!batchRef) return;

    // Find the batch by ID first, then by name (case-insensitive)
    const targetBatch =
      _batchById[batchRef] ||
      _batchByName[(batchRef + '').trim().toLowerCase()] ||
      null;

    if (!targetBatch) return;

    const sid = student.id || student.regNo || student.studentId;
    if (!sid) return;

    const existingIds = new Set(
      (targetBatch.students || []).map(s =>
        (s.id || s.regNo || s.studentId || '').toString()
      )
    );

    if (existingIds.has(sid.toString())) return;  // already there

    // Add to the batch
    _batchById[targetBatch.id] = {
      ...targetBatch,
      students: [
        ...(targetBatch.students || []),
        {
          id:          sid,
          regNo:       student.regNo       || student.id || '',
          name:        student.name        || student.studentName || '',
          mobilePhone: student.mobilePhone || student.phone || '',
          parentPhone: student.parentPhone || '',
          status:      (student.status || 'active').toString().trim().toLowerCase(),
          stream:      student.stream      || null,
          subjects:    student.subjects    || [],
          enrolledAt:  student.enrolledAt  || student.createdAt
                       || new Date().toISOString()
        }
      ]
    };
    // Keep _batchByName in sync too (same object reference)
    if (targetBatch.name) {
      _batchByName[targetBatch.name.trim().toLowerCase()] =
        _batchById[targetBatch.id];
    }
    _added++;
  });

  if (_added > 0) {
    saveLS('pba_batches', Object.values(_batchById));
    const _currentEnr = safeLS('pba_batch_enrollments', []) || [];
    const _enrKeySet = new Set(_currentEnr.map(e => `${e.batchId}_${e.studentId}`));
    const _newEnrs = [];
    Object.values(_batchById).forEach(b => {
      (b.students || []).forEach(st => {
        const key = `${b.id}_${st.id}`;
        if (!_enrKeySet.has(key)) {
          _newEnrs.push({
            id: "enr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            studentId: st.id,
            batchId: b.id,
            stream: st.stream || null,
            subjectIds: st.subjects || [],
            enrolledAt: st.enrolledAt || new Date().toISOString(),
            status: "active"
          });
          _enrKeySet.add(key);
        }
      });
    });
    if (_newEnrs.length > 0) {
      saveLS('pba_batch_enrollments', [..._currentEnr, ..._newEnrs]);
    }
  }
  return _added;
};

export const StudentManagementView = ({ isMobile }) => {
  const isMobileState = isMobile !== undefined ? isMobile : (window.innerWidth < 768);
  const { data, setData, addStudent, currentUser, exportToCSV, effectiveBranch } = useApp();
  const [activeTab, setActiveTab] = useState("database");

  // Batches state — for filter dropdown
  const [batches, setBatches] = useState(() => safeLS('pba_batches', []));
  // Increment to force re-read of pba_batches after drawer batch changes
  const [refreshKey, setRefreshKey] = useState(0);

  // Seed pba_streams if key does not exist
  useEffect(() => {
    if (!safeLS('pba_streams', null)) {
      saveLS('pba_streams', [
        { id: 'sci', name: 'Science' },
        { id: 'com', name: 'Commerce' },
        { id: 'arts', name: 'Arts' }
      ]);
    }
  }, []);

  const subjectOptions = (() => {
    const fromStore = (safeLS('pba_subjects', []) || [])
      .map(s => (typeof s === 'string' ? s : s.name))
      .filter(Boolean);
    return fromStore.length ? fromStore : DEFAULT_SUBJECTS;
  })();

  const streamOptions = (() => {
    const fromStore = (safeLS('pba_streams', []) || [])
      .map(s => (typeof s === 'string' ? s : s.name))
      .filter(Boolean);
    return fromStore.length ? fromStore : ['Science', 'Commerce', 'Arts'];
  })();

  // ── STUDENT LIST: pull from pba_students and pba_batches ──
  const buildStudentList = () => {
    const rawBatches  = safeLS('pba_batches',  []);
    const rawStudents = safeLS('pba_students', []);
    const batches = Array.isArray(rawBatches)  ? rawBatches  : [];
    const direct  = Array.isArray(rawStudents) ? rawStudents : [];

    // Map keyed by student id or regNo
    const map = {};

    // Helper: get a student's key
    const getKey = s =>
      s.id || s.studentId || s.regNo || null;

    // Helper: get enrolled array from a batch (handles all known field names)
    const getEnrolled = batch =>
      Array.isArray(batch.students)          ? batch.students
      : Array.isArray(batch.enrolledStudents) ? batch.enrolledStudents
      : Array.isArray(batch.studentList)      ? batch.studentList
      : [];

    // Pass 1 — from pba_students
    direct.forEach(s => {
      const key = getKey(s);
      if (!key) return;
      map[key] = {
        id:          key,
        regNo:       s.regNo       || '',
        name:        s.name        || s.studentName || '',
        stream:      s.stream      || null,
        subjects:    Array.isArray(s.subjects) ? s.subjects : (typeof s.subjects === 'string' ? s.subjects.split(',').map(x => x.trim()).filter(Boolean) : []),
        mobilePhone: s.mobilePhone || s.phone       || '',
        phone:       s.mobilePhone || s.phone       || '',
        parentPhone: s.parentPhone || '',
        email:       s.email       || '',
        status:      (s.status || 'active').toString().trim().toLowerCase(),
        batches:     [],
        batchIds:    []
      };
    });

    // Pass 2 — from pba_batches enrollment
    batches.forEach(batch => {
      const enrolled = getEnrolled(batch);
      enrolled.forEach(s => {
        const key = getKey(s);
        if (!key) return;
        if (!map[key]) {
          map[key] = {
            id:          key,
            regNo:       s.regNo       || '',
            name:        s.name        || s.studentName || '',
            stream:      s.stream      || null,
            subjects:    Array.isArray(s.subjects) ? s.subjects : (typeof s.subjects === 'string' ? s.subjects.split(',').map(x => x.trim()).filter(Boolean) : []),
            mobilePhone: s.mobilePhone || s.phone       || '',
            phone:       s.mobilePhone || s.phone       || '',
            parentPhone: s.parentPhone || '',
            email:       s.email       || '',
            status:      (s.status || 'active').toString().trim().toLowerCase(),
            batches:     [],
            batchIds:    []
          };
        } else {
          if (!map[key].stream && s.stream) map[key].stream = s.stream;
          if ((!map[key].subjects || map[key].subjects.length === 0) && s.subjects) {
            map[key].subjects = Array.isArray(s.subjects) ? s.subjects : [s.subjects];
          }
        }
        const bName = batch.name || '';
        if (bName && !map[key].batches.includes(bName)) {
          map[key].batches.push(bName);
          map[key].batchIds.push(batch.id || '');
        }
      });
    });

    // Pass 3 — AppContext students not yet in either store
    (data.students || []).forEach(s => {
      const key = getKey(s);
      if (!key || map[key]) return;
      map[key] = {
        ...s,
        stream:      s.stream || null,
        subjects:    Array.isArray(s.subjects) ? s.subjects : [],
        mobilePhone: s.phone || s.mobilePhone || '',
        phone:       s.phone || s.mobilePhone || '',
        batches:     [],
        batchIds:    []
      };
    });

    return Object.values(map);
  };

  const [students, setStudents] = useState(() => buildStudentList());

  // ── FIX: Backfill on mount ──
  useEffect(() => {
    syncStudentsToBatches();
    setBatches(safeLS('pba_batches', []));
    setStudents(buildStudentList());
  }, []);
  // ── End student list ──

  // Filters
  const [filterBatch, setFilterBatch] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Drawers & Modals
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState(null);
  const [drawerInitialTab, setDrawerInitialTab] = useState("overview");
  const [selectedStudentForParentView, setSelectedStudentForParentView] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Bulk Student Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importRows, setImportRows] = useState([]);
  const [importLog, setImportLog] = useState({ successCount: 0, errorCount: 0, errors: [] });
  const [isParsing, setIsParsing] = useState(false);
  const [importForm, setImportForm] = useState({ batchId: "", batchName: "" });

  const [studentForm, setStudentForm] = useState({
    name: "",
    dob: "",
    batchId: "",
    batchName: "",
    batch: "",
    stream: null,
    subjects: [],
    phone: "",
    parentPhone: "",
    email: "",
    address: ""
  });

  const role = currentUser.role;

  const resolveBatchName = (batchRefOrStudent) => {
    if (!batchRefOrStudent) return '—';
    if (typeof batchRefOrStudent === 'object') {
      const s = batchRefOrStudent;
      if (Array.isArray(s.batches) && s.batches.length > 0) {
        return s.batches.map(b => resolveBatchName(b)).filter(x => x && x !== '—').join(', ') || '—';
      }
      if (s.batchName) return s.batchName;
      if (s.batch && (!String(s.batch).includes('-') || String(s.batch).length < 20)) return s.batch;
      const ref = s.batchId || s.batch;
      if (ref) {
        const allBatches = safeLS('pba_batches', batches || []);
        const b = (allBatches || []).find((x) => x.id === ref || x.name === ref);
        return b?.name || (String(ref).includes('-') && String(ref).length >= 20 ? '—' : ref);
      }
      return '—';
    }
    const ref = String(batchRefOrStudent);
    const allBatches = safeLS('pba_batches', batches || []);
    const found = (allBatches || []).find(b => b.id === ref || b.name === ref);
    if (found) return found.name;
    if (!ref.includes('-') || ref.length < 20) return ref;
    return '—';
  };

  const resolveBatchFromCSV = (csvBatchValue, currentBatches = batches, fallbackForm = importForm) => {
    if (csvBatchValue) {
      const cleanVal = csvBatchValue.toString().toLowerCase().trim();
      const match = (currentBatches || []).find((b) =>
        (b.name || "").toLowerCase().trim() === cleanVal ||
        (b.id || "").toLowerCase().trim() === cleanVal ||
        (b.code || "").toLowerCase().trim() === cleanVal
      );
      if (match) return { batchId: match.id, batchName: match.name };
    }
    const fallbackMatch = (currentBatches || []).find((b) => b.id === fallbackForm.batchId || b.name === fallbackForm.batchName);
    if (fallbackMatch) return { batchId: fallbackMatch.id, batchName: fallbackMatch.name };
    const defaultB = (currentBatches || [])[0];
    return {
      batchId: fallbackForm.batchId || defaultB?.id || "",
      batchName: csvBatchValue || fallbackForm.batchName || defaultB?.name || ""
    };
  };

  const openRegisterModal = () => {
    const currentBatches = safeLS('pba_batches', []);
    setBatches(currentBatches);
    const defaultBatch = currentBatches[0];
    setStudentForm({
      name: "",
      dob: "",
      batchId: defaultBatch?.id || "",
      batchName: defaultBatch?.name || "",
      batch: defaultBatch?.name || "",
      stream: null,
      subjects: [],
      phone: "",
      parentPhone: "",
      email: "",
      address: ""
    });
    setShowAddStudentModal(true);
  };

  const openImportModal = () => {
    const currentBatches = safeLS('pba_batches', []);
    setBatches(currentBatches);
    setImportStep(1);
    setImportRows([]);
    setImportForm({ batchId: "", batchName: "" });
    setShowImportModal(true);
  };

  // Batch match — case-insensitive, checks batches array OR legacy fields
  const batchMatch = (s) => {
    if (!filterBatch || filterBatch === '' || filterBatch === 'All') return true;
    const q = filterBatch.toLowerCase();
    if ((s.batches || []).some(bn => (bn || '').toLowerCase() === q)) return true;
    if ((s.batchName || '').toLowerCase() === q) return true;
    if ((s.batchId   || '').toLowerCase() === q) return true;
    if ((s.batch     || '').toLowerCase() === q) return true;
    return false;
  };

  const filteredStudents = (students || []).filter((st) => {
    if (!batchMatch(st)) return false;
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (!(st.name  || '').toLowerCase().includes(q) &&
          !(st.regNo || '').toLowerCase().includes(q) &&
          !(st.mobilePhone || st.phone || '').includes(q)) return false;
    }
    if (filterStatus && filterStatus !== 'All') {
      if ((st.status || '').toLowerCase() !== filterStatus.toLowerCase()) return false;
    }
    return true;
  });

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!studentForm.name) return;

    const currentBatches = safeLS('pba_batches', []);
    const selectedBatch = (currentBatches.length > 0 ? currentBatches : (batches || [])).find(
      (b) => b.id === studentForm.batchId || b.name === studentForm.batchName || b.name === studentForm.batch
    );

    const finalBatchId = studentForm.batchId || selectedBatch?.id || "";
    const finalBatchName = selectedBatch?.name || studentForm.batchName || studentForm.batch || "";

    const newStudentId = `student_${Date.now()}`;
    const regCount = (data.students || []).length + (students || []).length + 1;
    const regNo = studentForm.regNo || `PBA-FT-2024-${String(regCount).padStart(3, "0")}`;

    const savedStudent = {
      ...studentForm,
      id: newStudentId,
      regNo,
      branch: studentForm.branch || effectiveBranch || "Kohuwala",
      enrolmentDate: new Date().toISOString().split("T")[0],
      status: "active",
      batchId: finalBatchId,
      batchName: finalBatchName,
      batch: finalBatchName,
      batches: finalBatchName ? [finalBatchName] : [],
      batchIds: finalBatchId ? [finalBatchId] : [],
      stream: studentForm.stream || null,
      subjects: Array.isArray(studentForm.subjects) ? studentForm.subjects : []
    };

    addStudent(savedStudent);

    // Save student profile to pba_students (Single source of truth)
    const existingProfiles = safeLS('pba_students', []);
    const newStudentProfile = {
      id:          newStudentId,
      regNo:       savedStudent.regNo || '',
      name:        savedStudent.name  || '',
      stream:      studentForm.stream || null,
      subjects:    Array.isArray(studentForm.subjects) ? studentForm.subjects : [],
      mobilePhone: savedStudent.phone || savedStudent.mobilePhone || '',
      phone:       savedStudent.phone || savedStudent.mobilePhone || '',
      parentPhone: savedStudent.parentPhone || '',
      email:       savedStudent.email || '',
      status:      (savedStudent.status || 'active').toString().trim().toLowerCase(),
      batchId:     finalBatchId || '',
      batch:       finalBatchName || '',
      batchName:   finalBatchName || '',
      batchEnrolled: finalBatchName || '',
      enrolledAt:  new Date().toISOString()
    };
    saveLS('pba_students', [
      newStudentProfile,
      ...(existingProfiles || [])
    ]);

    // PART C: Sync to batches immediately
    syncStudentsToBatches();
    setBatches(safeLS('pba_batches', []));
    setStudents(buildStudentList());
    setShowAddStudentModal(false);
    setStudentForm({
      name: "",
      dob: "",
      batchId: "",
      batchName: "",
      batch: "",
      stream: null,
      subjects: [],
      phone: "",
      parentPhone: "",
      email: "",
      address: ""
    });
  };

  const handleExportCSV = () => {
    const headers = ["Reg No", "Full Name", "Batch", "Stream", "Status", "Mobile Phone", "Parent Phone", "Email", "Enrolment Date"];
    const rows = filteredStudents.map((s) => [s.regNo, s.name, resolveBatchName(s), s.stream || '', s.status, s.phone, s.parentPhone, s.email, s.enrolmentDate]);
    exportToCSV("PBA_Student_Database", headers, rows);
  };

  const handleStudentFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsParsing(true);
    try {
      const currentBatches = safeLS('pba_batches', []);
      setBatches(currentBatches);
      const parsed = await parseImportFile(file);
      const processed = parsed.map((row, index) => {
        const name = row["Full Name"] || row["FullName"] || row["name"] || row["Name"] || "";
        const branch = row["Branch (Kohuwala/Wattala/Panadura)"] || row["Branch"] || row["branch"] || "Kohuwala";
        const dob = row["Date of Birth (YYYY-MM-DD)"] || row["Date of Birth"] || row["dob"] || row["DOB"] || "";
        const gender = row["Gender (Male/Female/Other)"] || row["Gender"] || row["gender"] || "Other";
        const nic = row["NIC / Passport"] || row["NIC"] || row["nic"] || "";
        const phone = row["Phone"] || row["phone"] || row["Mobile"] || "";
        const parentPhone = row["Parent/Guardian Phone"] || row["Parent Phone"] || row["parentPhone"] || row["Parent Mobile"] || "";
        const email = row["Email"] || row["email"] || "";
        const rawBatch = row["Batch Name"] || row["Batch"] || row["batch"] || row["batchName"] || "";

        // AUTO-DETECT stream: "stream", "academic stream", "course"
        const stream = row["Stream"] || row["stream"] || row["Academic Stream"] || row["academic stream"] || row["Course"] || row["course"] || null;

        // AUTO-DETECT subjects: "subjects", "subject", "courses taken" (split by comma or semicolon)
        const rawSubj = row["Subjects (semicolon-separated e.g. Biology;Chemistry;Physics)"] || row["Subjects"] || row["subjects"] || row["subject"] || row["Subject"] || row["Courses Taken"] || row["courses taken"] || "";

        const subjectsArr = rawSubj
          ? (rawSubj.includes(';') ? rawSubj.split(';') : rawSubj.split(',')).map(s => s.trim()).filter(Boolean)
          : [];

        const csvBatch = resolveBatchFromCSV(rawBatch, currentBatches, importForm);
        const notes = row["Notes"] || row["notes"] || "";

        const missingRequired = !name.trim();
        const missingOptional = !dob || !phone || !email;

        let status = "ready";
        let statusMsg = "Ready";
        if (missingRequired) {
          status = "error";
          statusMsg = "Error: Name required";
        } else if (missingOptional) {
          status = "warning";
          statusMsg = "Warning: Optional fields missing";
        }

        return {
          rowNum: index + 1,
          name,
          dob,
          gender,
          nic,
          phone,
          parentPhone,
          email,
          branch,
          batchId: csvBatch.batchId,
          batchName: csvBatch.batchName || (currentBatches[0]?.name || "Default Batch"),
          stream: stream ? stream.trim() : null,
          subjectsArr,
          subjectsStr: subjectsArr.join(', '),
          notes,
          status,
          statusMsg
        };
      });
      setImportRows(processed);
    } catch (err) {
      alert("Failed to parse file: " + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmStudentImport = (skipErrors = false) => {
    const validRows = importRows.filter((r) => r.status !== "error" || skipErrors);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    const existingStudents = data.students || [];
    const newStudents = [...existingStudents];
    const newStudentSubjects = [...(data.studentSubjects || [])];
    const importedStudentsList = [];

    validRows.forEach((r) => {
      if (r.status === "error" && !skipErrors) {
        errorCount++;
        errors.push(`Row ${r.rowNum}: Skipped due to missing required fields`);
        return;
      }

      const isDup = existingStudents.some(
        (s) => (r.nic && s.nic === r.nic) || (s.name.toLowerCase() === r.name.toLowerCase() && s.dob === r.dob)
      );

      if (isDup) {
        errorCount++;
        errors.push(`Row ${r.rowNum} (${r.name}): Duplicate student record exists`);
        return;
      }

      const subjectsArr = (r.subjectsArr && r.subjectsArr.length > 0)
        ? r.subjectsArr
        : (r.subjectsStr ? r.subjectsStr.split(',').map((s) => s.trim()).filter(Boolean) : []);

      const newId = "stu-" + Date.now() + Math.random().toString(36).substr(2, 4);
      const regNo = "PBA-2026-" + (newStudents.length + 101);

      const newStu = {
        id: newId,
        regNo,
        name: r.name,
        stream: r.stream || null,
        subjects: subjectsArr,
        dob: r.dob || "2006-01-01",
        gender: r.gender || "Other",
        nic: r.nic || "",
        phone: r.phone || "0770000000",
        mobilePhone: r.phone || "0770000000",
        parentPhone: r.parentPhone || "0710000000",
        email: r.email || `${r.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        branch: r.branch || "Kohuwala",
        batchId: r.batchId || "",
        batch: r.batchName || "",
        batchName: r.batchName || "",
        batchEnrolled: r.batchName || "",
        enrolledAt: new Date().toISOString().split("T")[0],
        status: "active",
        registeredBy: currentUser.name || "Admin",
        importedVia: "csv"
      };

      newStudents.push(newStu);
      importedStudentsList.push(newStu);

      subjectsArr.forEach((subjName) => {
        const sObj = (data.subjects || []).find((s) => s.name.toLowerCase() === subjName.toLowerCase());
        if (sObj) {
          newStudentSubjects.push({
            id: "ss-" + Date.now() + Math.random().toString(36).substr(2, 4),
            studentId: newId,
            subjectId: sObj.id
          });
        }
      });

      successCount++;
    });

    setData((prev) => ({
      ...prev,
      students: newStudents,
      studentSubjects: newStudentSubjects
    }));

    // ── Save imported students into pba_students (Single source of truth) ──
    const existingProfiles = safeLS('pba_students', []);
    const updatedProfiles = [...importedStudentsList, ...(existingProfiles || [])];
    saveLS('pba_students', updatedProfiles);

    // PART D: Sync imported students into pba_batches
    syncStudentsToBatches();
    setBatches(safeLS('pba_batches', []));
    setStudents(buildStudentList());

    setImportLog({ successCount, errorCount, errors });
    setImportStep(2);
  };

  return (
    <div>
      {/* Drawer & Public View overlays */}
      {selectedStudentForDrawer && (
        <StudentProfileDrawer
          student={selectedStudentForDrawer}
          initialTab={drawerInitialTab}
          onClose={() => {
            setSelectedStudentForDrawer(null);
            setDrawerInitialTab("overview");
            // Rebuild student list so the table batch column reflects any
            // enroll / remove actions done inside the drawer
            const freshBatches = safeLS('pba_batches', []);
            setBatches(freshBatches);
            setStudents(buildStudentList());
            setRefreshKey(k => k + 1);
          }}
        />
      )}
      {selectedStudentForParentView && (
        <ParentSummaryView student={selectedStudentForParentView} onClose={() => setSelectedStudentForParentView(null)} />
      )}

      {/* PATTERN B — Page Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: t.fontHeading, fontSize: '20px', fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            Student Database & Digital Attendance
          </h2>
          <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
            Comprehensive full-time student records, guardian contacts, and daily attendance logs.
          </p>
        </div>
        {role === "Admin" && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={openImportModal}
              style={{
                padding: '9px 16px',
                background: '#FFFFFF',
                border: '1.5px solid #E3E6EA',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#4A5568',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontFamily: "'Inter',sans-serif",
                transition: 'all 0.15s'
              }}
            >
              <Upload size={16} /> Import Students
            </button>
            <button
              onClick={openRegisterModal}
              style={{
                background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(43,108,176,0.30)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Plus size={16} /> Register New Student
            </button>
          </div>
        )}
      </div>

      {/* PATTERN C — Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#EEF0F4",
          padding: "4px",
          borderRadius: "10px",
          width: "fit-content",
          marginBottom: "20px"
        }}
      >
        <button
          onClick={() => setActiveTab("database")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "database" ? 600 : 500,
            color: activeTab === "database" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "database" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "database" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <GraduationCap size={16} /> Student Database ({students.length})
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "attendance" ? 600 : 500,
            color: activeTab === "attendance" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "attendance" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "attendance" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <CalendarCheck size={16} /> Digital Attendance Register
        </button>
      </div>

      {/* TAB 1: STUDENT DATABASE */}
      {activeTab === "database" && (
        <div
          style={{
            background: theme.cardBg,
            border: "1px solid " + theme.cardBorder,
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            overflow: "hidden"
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid #F4F5F7",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#FFFFFF",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
              <GraduationCap size={18} style={{ color: theme.accent }} /> Full-Time Student Database
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() =>
                  printClassListPDF(
                    effectiveBranch || "Kohuwala",
                    filterBatch === "All" ? "All Programmes" : filterBatch,
                    filteredStudents
                  )
                }
                style={{
                  background: 'linear-gradient(135deg, #D4A017, #B7860A)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(212,160,23,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Printer size={14} /> Export Class List (PDF)
              </button>
              <button
                onClick={handleExportCSV}
                style={{
                  background: '#FFFFFF',
                  color: theme.accent,
                  border: '1.5px solid #BEE3F8',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ padding: "16px 22px 0 22px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search name, reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "240px",
                padding: "9px 13px",
                background: "#FFFFFF",
                border: "1.5px solid #E3E6EA",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#1A202C",
                outline: "none",
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxSizing: "border-box"
              }}
              onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={14} style={{ color: theme.textMuted }} />
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                style={{
                  width: "200px",
                  padding: "9px 36px 9px 13px",
                  background: "#FFFFFF",
                  border: "1.5px solid #E3E6EA",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#1A202C",
                  outline: "none",
                  fontFamily: "'Inter', 'Segoe UI', sans-serif",
                  appearance: "none",
                  WebkitAppearance: "none",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  cursor: "pointer",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  boxSizing: "border-box"
                }}
                onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
              >
                <option value="All">All Batches</option>
                {(batches || []).map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: "140px",
                padding: "9px 36px 9px 13px",
                background: "#FFFFFF",
                border: "1.5px solid #E3E6EA",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#1A202C",
                outline: "none",
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                appearance: "none",
                WebkitAppearance: "none",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                cursor: "pointer",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxSizing: "border-box"
              }}
              onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Withdrawn">Withdrawn</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Table — PATTERN E */}
          <div style={{ padding: isMobileState ? "12px" : "16px 22px 22px 22px", overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
            <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA" }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Reg No</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Student Name</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Batch</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>STREAM</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Mobile Phone</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Parent Phone</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => (
                  <tr
                    key={st.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: theme.accent, borderBottom: '1px solid #F4F5F7' }}>
                      {st.regNo}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      <div>{st.name}</div>
                      {(st.subjects || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                          {(st.subjects || []).map(subj => (
                            <span key={subj} style={{
                              background: '#F0FDF4', color: '#166534',
                              border: '1px solid #BBF7D0',
                              borderRadius: '6px', padding: '2px 8px', fontSize: '11px'
                            }}>
                              {subj}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {(st.batches || []).length > 0
                        ? (st.batches || []).join(', ')
                        : <span style={{ color: '#9CA3AF' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      {st.stream ? (
                        <span style={{
                          background: '#EFF6FF', color: '#1D4ED8',
                          borderRadius: '6px', padding: '2px 8px',
                          fontSize: '12px', fontWeight: 600
                        }}>
                          {st.stream}
                        </span>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {st.mobilePhone || st.phone || ''}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {st.parentPhone}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      {(st.status || '').toLowerCase() === "active" ? (
                        <span style={{ background: theme.successLight, color: theme.success, border: '1px solid ' + theme.successBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38A169', display: 'inline-block' }} />
                          Active
                        </span>
                      ) : (
                        <span style={{ background: theme.dangerLight, color: theme.danger, border: '1px solid ' + theme.dangerBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', textTransform: 'capitalize' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E53E3E', display: 'inline-block' }} />
                          {st.status}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button
                          onClick={() => {
                            const phone = (st.parentPhone || st.phone || "").replace(/\D/g, "");
                            const msg = encodeURIComponent(`Dear Parent, this is a message from PBA regarding ${st.name}.`);
                            window.open(`https://wa.me/94${phone.slice(-9)}?text=${msg}`, "_blank");
                          }}
                          style={{
                            background: '#25D366',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '7px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="WhatsApp Parent"
                        >
                          WA
                        </button>
                        <button
                          onClick={() => {
                            window.location.href = `mailto:${st.email || ""}?subject=Regarding ${st.name} - PBA&body=Dear Parent,`;
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title="Email Parent"
                        >
                          Email
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudentForDrawer(st);
                            setDrawerInitialTab("overview");
                          }}
                          style={{
                            background: '#FFFFFF',
                            color: theme.accent,
                            border: '1.5px solid #BEE3F8',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="View Detailed Profile"
                        >
                          <Eye size={12} /> Profile
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudentForDrawer(st);
                            setDrawerInitialTab("report");
                          }}
                          style={{
                            background: '#EBF4FF',
                            color: '#2B6CB0',
                            border: '1.5px solid #CBD5E0',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="View Report Card"
                        >
                          <FileSpreadsheet size={12} /> Report Card
                        </button>
                        <button
                          onClick={() => setSelectedStudentForParentView(st)}
                          style={{
                            background: '#FFFFFF',
                            color: theme.accent,
                            border: '1.5px solid #BEE3F8',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="View Parent Summary Portal"
                        >
                          <Share2 size={12} /> Parent Link
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL ATTENDANCE REGISTER */}
      {activeTab === "attendance" && <DigitalAttendance isMobile={isMobileState} />}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "500px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowAddStudentModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "16px" }}>Register New Student</h3>
            <form onSubmit={handleAddStudent}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Date of Birth</label>
                <input
                  type="date"
                  value={studentForm.dob}
                  onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                  BATCH ENROLLED
                </label>
                <select
                  value={studentForm.batchId || ''}
                  onChange={(e) => {
                    const selectedBatch = (batches || []).find((b) => b.id === e.target.value);
                    setStudentForm((prev) => ({
                      ...prev,
                      batchId: e.target.value,
                      batchName: selectedBatch?.name || '',
                      batch: selectedBatch?.name || ''
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E3E6EA',
                    fontSize: '14px',
                    background: 'white',
                    color: '#1A202C',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">— Select Batch —</option>
                  {(batches || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                {(batches || []).length === 0 && (
                  <p style={{ fontSize: '11px', color: '#D97706', marginTop: '6px', fontWeight: 600 }}>
                    ⚠ No batches found. Create batches first in General Admin → Batch Manager.
                  </p>
                )}
              </div>

              {/* Stream */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: 600,
                  color: '#6B7280', letterSpacing: '0.05em', marginBottom: '6px'
                }}>
                  STREAM
                </label>
                <select
                  value={studentForm.stream || ''}
                  onChange={e => setStudentForm(prev => ({
                    ...prev,
                    stream: e.target.value || null,
                    subjects: []   // clear subjects when stream changes
                  }))}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1px solid #D1D5DB', borderRadius: '8px',
                    fontSize: '14px', color: '#111827', background: '#fff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">— Select Stream —</option>
                  {streamOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Subjects */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: 600,
                  color: '#6B7280', letterSpacing: '0.05em', marginBottom: '6px'
                }}>
                  SUBJECTS
                  <span style={{ fontWeight: 400, marginLeft: '6px', color: '#9CA3AF' }}>
                    (select all that apply)
                  </span>
                </label>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '8px',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB', borderRadius: '8px',
                  background: '#F9FAFB', minHeight: '44px',
                  boxSizing: 'border-box'
                }}>
                  {subjectOptions.map(subj => {
                    const checked = (studentForm.subjects || []).includes(subj);
                    return (
                      <label key={subj} style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '13px', color: checked ? '#1D4ED8' : '#374151',
                        cursor: 'pointer',
                        background: checked ? '#EFF6FF' : '#fff',
                        border: `1px solid ${checked ? '#BFDBFE' : '#E5E7EB'}`,
                        borderRadius: '6px', padding: '4px 10px',
                        userSelect: 'none'
                      }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setStudentForm(prev => {
                              const current = prev.subjects || [];
                              return {
                                ...prev,
                                subjects: checked
                                  ? current.filter(s => s !== subj)
                                  : [...current, subj]
                              };
                            });
                          }}
                          style={{ display: 'none' }}
                        />
                        {checked ? '✓ ' : ''}{subj}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Mobile Number</label>
                <input
                  type="text"
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Parent/Guardian Mobile Number</label>
                <input
                  type="text"
                  value={studentForm.parentPhone}
                  onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" }}>Email Address</label>
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', 'Segoe UI', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2B6CB0"; e.target.style.boxShadow = "0 0 0 3px rgba(43,108,176,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E6EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
                <button type="button" onClick={() => setShowAddStudentModal(false)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}>Register Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Students Modal */}
      {showImportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "800px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowImportModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>

            {importStep === 1 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", margin: 0 }}>Bulk Import Students</h3>
                    <p style={{ fontSize: "12px", color: "#718096", margin: "2px 0 0 0" }}>Upload a CSV or Excel file with student records</p>
                  </div>
                  <button
                    onClick={downloadStudentCsvTemplate}
                    style={{ padding: '6px 12px', background: '#EBF4FF', border: '1px solid #BEE3F8', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#2B6CB0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Download size={13} /> Download Template CSV
                  </button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '5px' }}>
                    Batch to Assign (Optional fallback if CSV row has no batch)
                  </label>
                  <select
                    value={importForm.batchId || ''}
                    onChange={(e) => {
                      const b = (batches || []).find((b) => b.id === e.target.value);
                      setImportForm((prev) => ({
                        ...prev,
                        batchId: e.target.value,
                        batchName: b?.name || ''
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E3E6EA',
                      fontSize: '14px',
                      background: 'white',
                      color: '#1A202C'
                    }}
                  >
                    <option value="">— Assign Batch to All Imported Students —</option>
                    {(batches || []).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Upload Drop Zone */}
                <label style={{ display: 'block', border: '2px dashed #CBD5E0', borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#F8F9FB', marginBottom: '20px', transition: 'border-color 0.15s' }}>
                  <Upload size={32} style={{ color: '#718096', margin: '0 auto 8px auto', display: 'block' }} />
                  <div style={{ fontSize: '13px', color: '#4A5568', fontWeight: 600 }}>
                    {isParsing ? "Parsing file..." : "Click to upload CSV or Excel file"}
                  </div>
                  <div style={{ fontSize: '11px', color: '#A0AEC0', marginTop: '4px' }}>
                    Supported: .csv, .xlsx, .xls
                  </div>
                  <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleStudentFileUpload} />
                </label>

                {/* Preview Table */}
                {importRows.length > 0 && (() => {
                  const readyCount = importRows.filter(r => r.status !== "error").length;
                  const errorCount = importRows.filter(r => r.status === "error").length;

                  return (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D3748', marginBottom: '10px' }}>
                        {importRows.length} records found — <span style={{ color: '#2F855A' }}>{readyCount} ready to import</span>, <span style={{ color: '#C53030' }}>{errorCount} with errors</span>
                      </div>

                      <div style={{ border: '1px solid #E3E6EA', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxHeight: '250px', overflowY: 'auto', marginBottom: '20px' }}>
                        <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ background: '#F8F9FB', borderBottom: '1px solid #E3E6EA' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Row</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Name</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>DOB</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Branch</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Batch</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Stream</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Subjects</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#718096' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importRows.slice(0, 10).map((r) => (
                              <tr key={r.rowNum} style={{ borderBottom: '1px solid #F4F5F7' }}>
                                <td style={{ padding: '8px 12px', color: '#718096' }}>#{r.rowNum}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1A202C' }}>{r.name || "—"}</td>
                                <td style={{ padding: '8px 12px', color: '#4A5568' }}>{r.dob || "—"}</td>
                                <td style={{ padding: '8px 12px', color: '#4A5568' }}>{r.branch}</td>
                                <td style={{ padding: '8px 12px', color: '#4A5568' }}>{r.batchName}</td>
                                <td style={{ padding: '8px 12px', color: '#4A5568' }}>{r.stream || "—"}</td>
                                <td style={{ padding: '8px 12px', color: '#718096' }}>{r.subjectsStr || "Default"}</td>
                                <td style={{ padding: '8px 12px' }}>
                                  {r.status === "ready" && (
                                    <span style={{ background: '#F0FFF4', color: '#2F855A', border: '1px solid #9AE6B4', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>Ready</span>
                                  )}
                                  {r.status === "warning" && (
                                    <span style={{ background: '#FEF3C7', color: '#B7860A', border: '1px solid #F6D860', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }} title={r.statusMsg}>Warning</span>
                                  )}
                                  {r.status === "error" && (
                                    <span style={{ background: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }} title={r.statusMsg}>Error</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setShowImportModal(false)} style={{ background: "#FFFFFF", color: theme.textSecondary, border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>

                        {errorCount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleConfirmStudentImport(true)}
                            style={{ background: '#D69E2E', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Import anyway (skip errors)
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={readyCount === 0 || (errorCount > 0 && readyCount === 0)}
                          onClick={() => handleConfirmStudentImport(false)}
                          style={{
                            background: readyCount > 0 && errorCount === 0 ? 'linear-gradient(135deg, #2B6CB0, #1A4A8A)' : '#CBD5E0',
                            color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700,
                            cursor: readyCount > 0 ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Import {readyCount} Students
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {importStep === 2 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={48} style={{ color: '#2F855A', margin: '0 auto 12px auto' }} />
                <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '20px', fontWeight: 700, color: '#1A202C', marginBottom: '8px' }}>Import Completed</h3>
                <p style={{ fontSize: '14px', color: '#2F855A', fontWeight: 600, marginBottom: '4px' }}>
                  ✓ {importLog.successCount} students imported successfully
                </p>
                {importLog.errorCount > 0 && (
                  <p style={{ fontSize: '13px', color: '#C53030', marginBottom: '16px' }}>
                    ✗ {importLog.errorCount} rows skipped
                  </p>
                )}
                <button
                  onClick={() => setShowImportModal(false)}
                  style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 24px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '16px' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
