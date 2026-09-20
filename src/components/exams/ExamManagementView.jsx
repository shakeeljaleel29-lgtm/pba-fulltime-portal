import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  FileCheck2,
  Calendar,
  Award,
  Plus,
  Download,
  Printer,
  Upload,
  Pencil,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ChevronRight
} from "lucide-react";
import { calcGrade, gradeColor } from "../../utils/gradeUtils";
import { printExamResultsPDF } from "../../utils/pdfGenerator";

import { T, theme, type as t } from "../../theme";

const safeLS = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Failed to read ${key} from localStorage:`, e);
    return fallback;
  }
};

const saveLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write ${key} to localStorage:`, e);
  }
};

export const ExamManagementView = ({ isMobile }) => {
  const isMobileState = isMobile !== undefined ? isMobile : (window.innerWidth < 768);
  const { data, setData, addExam, updateExamMarks, currentUser, filterByBranch, effectiveBranch, showToast, exportToCSV } = useApp();

  // Page Tabs: 'schedule' | 'mark-entry' | 'results' | 'performance'
  const [activeTab, setActiveTab] = useState("schedule");

  // Selection states across tabs
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedBatchName, setSelectedBatchName] = useState("");

  // Filters for Schedule Tab
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterBatch, setFilterBatch] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Filters for Results & Rankings Tab
  const [filterBatchId, setFilterBatchId] = useState("");
  const [filterExamName, setFilterExamName] = useState("");
  const [rankViewMode, setRankViewMode] = useState("marksheet");
  const [rankSubjectId, setRankSubjectId] = useState("");

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  // Import Modal & Preview
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState([]);

  // Local state initialized with lazy initializers from localStorage
  const [batches, setBatches] = useState(() => safeLS('pba_batches', []));
  const [subjects, setSubjects] = useState(() => safeLS('pba_subjects', []));
  const [examSchedule, setExamSchedule] = useState(() => safeLS('pba_exam_schedule', []));

  // Refresh on mount so newly created batches appear immediately
  useEffect(() => {
    setBatches(safeLS('pba_batches', []));
    setSubjects(safeLS('pba_subjects', []));
    setExamSchedule(safeLS('pba_exam_schedule', []));
  }, []);

  const emptyPaper = () => ({
    paperName: '',
    date: '',
    startTime: '',
    endTime: '',
    totalMarks: 100,
    passMarks: 40,
    venue: '',
    notes: ''
  });

  const emptySubjectRow = () => ({
    subjectId: '',
    subjectCode: '',
    subjectName: '',
    papers: [emptyPaper()]
  });

  const [scheduleForm, setScheduleForm] = useState({
    examSessionName: '',
    examType: 'Internal',
    batchId: '',
    batchName: '',
    sessionStartDate: '',
    sessionEndDate: '',
    subjectRows: []
  });

  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  // Derived: batch subjects for selected batch
  const batchSubjectOptions = (() => {
    if (!scheduleForm.batchId) return [];
    const batch = (batches || []).find(b => b.id === scheduleForm.batchId);
    return (batch?.subjects || []);
  })();

  // Sync subjectRows when selectedSubjectIds or batchId changes
  // Preserves existing paper data for subjects that remain checked
  useEffect(() => {
    setScheduleForm(prev => {
      const existingMap = {};
      (prev.subjectRows || []).forEach(row => {
        existingMap[row.subjectId] = row;
      });
      const currentBatch = (batches || []).find(b => b.id === prev.batchId);
      const batchSubs = (currentBatch?.subjects || []);
      const newRows = (selectedSubjectIds || []).map(subId => {
        if (existingMap[subId]) return existingMap[subId];
        const sub = batchSubs.find(s => s.subjectId === subId);
        return {
          subjectId: subId,
          subjectCode: sub?.subjectCode || '',
          subjectName: sub?.subjectName || '',
          papers: [emptyPaper()]
        };
      });
      return { ...prev, subjectRows: newRows };
    });
  }, [selectedSubjectIds, scheduleForm.batchId]);

  // Open Schedule Exam session modal
  const openScheduleModal = () => {
    setBatches(safeLS('pba_batches', []));
    setScheduleForm({
      examSessionName: '',
      examType: 'Internal',
      batchId: '',
      batchName: '',
      sessionStartDate: '',
      sessionEndDate: '',
      subjectRows: []
    });
    setSelectedSubjectIds([]);
    setShowScheduleModal(true);
  };

  const handleOpenAddExam = () => {
    openScheduleModal();
  };

  // Local Mark Entry State: { [studentId]: { marksObtained: number|null, isAbsent: boolean, remarks: string } }
  const [markEntryState, setMarkEntryState] = useState({});

  const students = data.students || [];

  // Load / initialize pba_marks from localStorage if present
  const [allMarks, setAllMarks] = useState(() => {
    return safeLS("pba_marks", []);
  });

  // Keep localStorage synced for pba_marks
  useEffect(() => {
    saveLS("pba_marks", allMarks);
  }, [allMarks]);

  // Combined list of exams: pba_exam_schedule + data.exams fallback
  const combinedExams = (() => {
    const fromLS = (examSchedule && examSchedule.length > 0) ? examSchedule : safeLS('pba_exam_schedule', []);
    if (fromLS && fromLS.length > 0) {
      const existingIds = new Set(fromLS.map(e => e.id));
      const extra = (data.exams || []).filter(e => !existingIds.has(e.id));
      return [...fromLS, ...extra];
    }
    return data.exams || [];
  })();

  // Default selection initialization
  useEffect(() => {
    if (combinedExams && combinedExams.length > 0 && !selectedExamId) {
      setSelectedExamId(combinedExams[0].id);
    }
    const allSubjs = (subjects && subjects.length > 0) ? subjects : (data.subjects || []);
    if (allSubjs.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(allSubjs[0].id);
    }
    if (students.length > 0 && !selectedBatchName) {
      setSelectedBatchName(students[0].batch || "Batch 2024-A (A/L Commerce)");
    }
  }, [combinedExams, subjects, students]);

  // When selectedExamId changes in Mark Entry tab, populate markEntryState from allMarks or legacy exam.results
  useEffect(() => {
    if (!selectedExamId) return;
    const targetExam = combinedExams.find((e) => e.id === selectedExamId);
    if (!targetExam) return;

    const targetBatch = targetExam.batchName || targetExam.batch || "All";
    const targetBatchObj = (batches || []).find(b => b.id === targetExam.batchId || b.name === targetBatch);
    const batchStudents = students.filter((s) => s.batch === targetBatch || (targetBatchObj && (s.batchId === targetBatchObj.id || s.batch === targetBatchObj.name)) || targetBatch === "All");
    const existingExamMarks = allMarks.filter((m) => m.examId === targetExam.id);

    const initial = {};
    batchStudents.forEach((st) => {
      const foundMark = existingExamMarks.find((m) => m.studentId === st.id);
      if (foundMark) {
        initial[st.id] = {
          marksObtained: foundMark.marksObtained,
          isAbsent: !!foundMark.isAbsent,
          remarks: foundMark.remarks || ""
        };
      } else {
        // Fallback to legacy exam.results if present
        const legacy = (targetExam.results || []).find((r) => r.studentId === st.id);
        if (legacy) {
          initial[st.id] = {
            marksObtained: legacy.marks,
            isAbsent: false,
            remarks: ""
          };
        } else {
          initial[st.id] = {
            marksObtained: null,
            isAbsent: false,
            remarks: ""
          };
        }
      }
    });

    setMarkEntryState(initial);
  }, [selectedExamId, allMarks, combinedExams, students, batches]);

  // Save new exam session
  const handleSaveExamSession = () => {
    if (!scheduleForm.examSessionName.trim()) {
      alert('Please enter an exam session name.'); return;
    }
    if (!scheduleForm.batchId) {
      alert('Please select a batch.'); return;
    }
    if (!scheduleForm.sessionStartDate || !scheduleForm.sessionEndDate) {
      alert('Please set the exam period start and end dates.'); return;
    }
    if ((scheduleForm.subjectRows || []).length === 0) {
      alert('Please select at least one subject.'); return;
    }

    const examSessionId = `examSession_${Date.now()}`;
    const now = new Date().toISOString();
    const newRecords = [];

    (scheduleForm.subjectRows || []).forEach(row => {
      (row.papers || []).forEach((paper, pIdx) => {
        if (!paper.date || !paper.startTime || !paper.endTime) return;
        newRecords.push({
          id: `examrec_${Date.now()}_${newRecords.length}`,
          examSessionId,
          examSessionName: scheduleForm.examSessionName.trim(),
          examType: scheduleForm.examType || 'Internal',
          batchId: scheduleForm.batchId,
          batchName: scheduleForm.batchName || '',
          sessionStartDate: scheduleForm.sessionStartDate,
          sessionEndDate: scheduleForm.sessionEndDate,
          subjectId: row.subjectId,
          subjectCode: row.subjectCode || '',
          subjectName: row.subjectName || '',
          paperNumber: pIdx + 1,
          paperName: paper.paperName.trim() || `Paper ${pIdx + 1}`,
          date: paper.date,
          startTime: paper.startTime,
          endTime: paper.endTime,
          totalMarks: Number(paper.totalMarks) || 100,
          passMarks: Number(paper.passMarks) || 40,
          venue: paper.venue || '',
          notes: paper.notes || '',
          status: 'Scheduled',
          createdAt: now
        });
      });
    });

    if (newRecords.length === 0) {
      alert('Please fill in at least one paper with a date and time.'); return;
    }

    const existing = safeLS('pba_exam_schedule', []);
    saveLS('pba_exam_schedule', [...(existing || []), ...newRecords]);
    setExamSchedule(safeLS('pba_exam_schedule', []));
    setShowScheduleModal(false);
  };

  // Publish exam results
  const handlePublishResults = (exam) => {
    const updatedExams = (data.exams || []).map((ex) =>
      ex.id === exam.id ? { ...ex, status: "published", publishedAt: new Date().toISOString() } : ex
    );
    setData((prev) => ({ ...prev, exams: updatedExams }));
    showToast(`Exam "${exam.name}" results published!`, "success");
  };

  // Save Mark Entry to pba_marks & update legacy exam.results for compatibility
  const handleSaveMarkEntry = () => {
    const targetExam = data.exams.find((e) => e.id === selectedExamId);
    if (!targetExam) return;

    const batchStudents = students.filter((s) => s.batch === targetExam.batch || targetExam.batch === "All");
    const updatedMarks = [...allMarks.filter((m) => m.examId !== targetExam.id)];

    const calculatedResults = [];

    batchStudents.forEach((st) => {
      const entry = markEntryState[st.id] || { marksObtained: null, isAbsent: false, remarks: "" };
      const isAbs = !!entry.isAbsent;
      const mVal = isAbs ? null : (entry.marksObtained !== null && entry.marksObtained !== "" ? Number(entry.marksObtained) : null);
      const grade = isAbs ? "ABS" : calcGrade(mVal, targetExam.totalMarks || 100);

      const markRecord = {
        id: `mk-${targetExam.id}-${st.id}`,
        examId: targetExam.id,
        studentId: st.id,
        subjectId: targetExam.subjectId || "",
        batchId: targetExam.batch || "",
        marksObtained: mVal,
        isAbsent: isAbs,
        grade,
        remarks: entry.remarks || "",
        enteredBy: currentUser?.name || "Admin",
        enteredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updatedMarks.push(markRecord);

      if (!isAbs && mVal !== null) {
        const pct = Math.round((mVal / (targetExam.totalMarks || 100)) * 100);
        calculatedResults.push({
          studentId: st.id,
          studentName: st.name,
          regNo: st.regNo,
          marks: mVal,
          maxMarks: targetExam.totalMarks || 100,
          percentage: pct,
          grade
        });
      }
    });

    // Calculate ranks for legacy compatibility
    calculatedResults.sort((a, b) => b.marks - a.marks);
    calculatedResults.forEach((item, index) => {
      item.rank = index + 1;
    });

    setAllMarks(updatedMarks);

    // Update data.exams in state with calculated results
    const nextExams = (data.exams || []).map((ex) =>
      ex.id === targetExam.id ? { ...ex, results: calculatedResults } : ex
    );
    setData((prev) => ({ ...prev, exams: nextExams }));

    showToast(`Marks saved for ${targetExam.name}!`, "success");
  };

  // Update single student mark state
  const handleUpdateStudentMark = (studentId, value) => {
    setMarkEntryState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksObtained: value === "" ? null : Number(value),
        isAbsent: false
      }
    }));
  };

  // Toggle student absent status
  const handleToggleAbsent = (studentId, checked) => {
    setMarkEntryState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isAbsent: checked,
        marksObtained: checked ? null : prev[studentId]?.marksObtained
      }
    }));
  };

  // CSV Template Generator for selected Exam
  const handleDownloadTemplate = () => {
    const targetExam = data.exams.find((e) => e.id === selectedExamId);
    if (!targetExam) return;
    const batchStudents = students.filter((s) => s.batch === targetExam.batch || targetExam.batch === "All");

    const headers = ["Student ID", "Student Name", `Marks (out of ${targetExam.totalMarks || 100})`, "Absent (yes/no)"];
    const rows = batchStudents.map((st) => [st.regNo || st.id, st.name, "", "no"]);
    exportToCSV(`${targetExam.name}_Mark_Entry_Template`, headers, rows);
  };

  // Handle CSV/XLSX File Select for Import
  const handleFileImportChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetExam = data.exams.find((ex) => ex.id === selectedExamId);
    if (!targetExam) return;

    const batchStudents = students.filter((s) => s.batch === targetExam.batch || targetExam.batch === "All");

    try {
      let rawRows = [];
      if (file.name.endsWith(".csv") || file.type.includes("csv") || file.type.includes("text")) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const header = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
            const obj = {};
            header.forEach((h, idx) => {
              obj[h] = cols[idx] || "";
            });
            rawRows.push(obj);
          }
        }
      } else {
        // XLSX SheetJS lazy load
        let XLSX = window.XLSX;
        if (!XLSX) {
          try {
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
              script.onload = () => resolve();
              script.onerror = reject;
              document.head.appendChild(script);
            });
            XLSX = window.XLSX;
          } catch (_) {}
        }
        if (XLSX) {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: "array" });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          rawRows = XLSX.utils.sheet_to_json(firstSheet);
        }
      }

      // Map raw rows to matched student preview
      const preview = rawRows.map((r, idx) => {
        const idKey = Object.keys(r).find((k) => k.includes("id") || k.includes("reg"));
        const nameKey = Object.keys(r).find((k) => k.includes("name") || k.includes("student"));
        const markKey = Object.keys(r).find((k) => k.includes("mark") || k.includes("score"));
        const absKey = Object.keys(r).find((k) => k.includes("absent"));

        const idVal = idKey ? String(r[idKey]).trim() : "";
        const nameVal = nameKey ? String(r[nameKey]).trim() : "";
        const markVal = markKey && r[markKey] !== "" ? Number(r[markKey]) : null;
        const absVal = absKey ? String(r[absKey]).toLowerCase().includes("y") : false;

        const matchedStudent = batchStudents.find(
          (s) =>
            (idVal && (s.regNo === idVal || s.id === idVal)) ||
            (nameVal && s.name.toLowerCase().trim() === nameVal.toLowerCase())
        );

        const isValidMark = absVal || (markVal !== null && !isNaN(markVal) && markVal >= 0 && markVal <= (targetExam.totalMarks || 100));

        return {
          rowNum: idx + 1,
          rawId: idVal,
          rawName: nameVal,
          rawMark: markVal,
          isAbsent: absVal,
          matchedStudent,
          isValidMark
        };
      });

      setImportRows(preview);
      setShowImportModal(true);
    } catch (err) {
      console.error("Import error:", err);
      showToast("Failed to parse import file.", "error");
    }
  };

  // Confirm Import preview rows into markEntryState
  const handleConfirmImport = () => {
    const newEntryState = { ...markEntryState };
    importRows.forEach((row) => {
      if (row.matchedStudent && row.isValidMark) {
        newEntryState[row.matchedStudent.id] = {
          marksObtained: row.isAbsent ? null : row.rawMark,
          isAbsent: row.isAbsent,
          remarks: "Imported from CSV"
        };
      }
    });
    setMarkEntryState(newEntryState);
    setShowImportModal(false);
    showToast("Imported marks updated in editor. Click 'Save All Marks' to commit.", "success");
  };

  // Group pba_exam_schedule by examSessionId
  const sessionGroupMap = {};
  (examSchedule || []).forEach(record => {
    const key = record.examSessionId
      || `${record.examSessionName || 'unknown'}_${record.batchId || 'noBatch'}`;
    if (!sessionGroupMap[key]) {
      sessionGroupMap[key] = {
        examSessionId: key,
        examSessionName: record.examSessionName || '—',
        examType: record.examType || '',
        batchId: record.batchId,
        batchName: record.batchName || '',
        sessionStartDate: record.sessionStartDate || record.date || '',
        sessionEndDate: record.sessionEndDate || record.date || '',
        records: []
      };
    }
    sessionGroupMap[key].records.push(record);
  });
  const sessionGroups = Object.values(sessionGroupMap).reverse();

  // Group records within a session by subjectId
  const getSubjectMap = (records) => {
    const map = {};
    (records || []).forEach(r => {
      const subKey = r.subjectId || r.subjectCode || r.subjectName || 'unknown_sub';
      if (!map[subKey]) {
        map[subKey] = {
          subjectId: r.subjectId || subKey,
          subjectCode: r.subjectCode || '',
          subjectName: r.subjectName || '',
          papers: []
        };
      }
      map[subKey].papers.push(r);
    });
    Object.values(map).forEach(sub => {
      sub.papers.sort((a, b) => (a.paperNumber || 0) - (b.paperNumber || 0));
    });
    return Object.values(map);
  };

  const filteredSessionGroups = (sessionGroups || []).filter(group => {
    if (filterType !== 'All' && group.examType !== filterType) return false;
    if (filterBatch !== 'All') {
      const matchesBatch = group.batchId === filterBatch || group.batchName === filterBatch;
      if (!matchesBatch) return false;
    }
    if (filterSubject !== 'All') {
      const hasSubject = (group.records || []).some(r => r.subjectId === filterSubject || r.subjectCode === filterSubject || r.subjectName === filterSubject);
      if (!hasSubject) return false;
    }
    return true;
  });

  const handleEnterResults = (group) => {
    const firstSubj = group.subjects?.[0];
    if (firstSubj) {
      setSelectedExamId(firstSubj.id);
    }
    if (group.batchName) {
      setSelectedBatchName(group.batchName);
    }
    setActiveTab("mark-entry");
  };

  // Selected Exam for Mark Entry & Results Tabs
  const currentSelectedExam = (data.exams || []).find((e) => e.id === selectedExamId) || data.exams[0];
  const currentBatchStudents = currentSelectedExam
    ? students.filter((s) => s.batch === currentSelectedExam.batch || currentSelectedExam.batch === "All")
    : [];

  // Helper to get subject IDs for a batch subject entry using subjectAssignments
  const getBatchSubjectIds = (batchSubject) => {
    if (!batchSubject) return [];
    if (batchSubject.subjectAssignments && Array.isArray(batchSubject.subjectAssignments)) {
      return batchSubject.subjectAssignments.map((a) => a.subjectId);
    }
    if (batchSubject.subjectIds && Array.isArray(batchSubject.subjectIds)) {
      return batchSubject.subjectIds;
    }
    return [];
  };

  // Subject assignment for permission checks & batch subject filtering (supports both Main & Assistant Lecturers)
  const currentBatchSubjEntry = (data.batchSubjects || []).find(
    (bs) => bs.batchName === currentSelectedExam?.batch || bs.batch === currentSelectedExam?.batch
  );
  const currentBatchSubjectIds = getBatchSubjectIds(currentBatchSubjEntry);

  const currentAssignment = currentBatchSubjEntry?.subjectAssignments?.find(
    (sa) => sa.subjectId === currentSelectedExam?.subjectId || sa.subjectName === currentSelectedExam?.subject || sa.subjectCode === currentSelectedExam?.subjectCode
  );

  const canEnterMarks = Boolean(
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Branch Coordinator' ||
    (currentAssignment && (
      currentAssignment.mainLecturerId === currentUser?.id ||
      currentAssignment.mainLecturerName === currentUser?.name ||
      currentAssignment.assistantLecturerId === currentUser?.id ||
      currentAssignment.assistantLecturerName === currentUser?.name
    )) ||
    (!currentAssignment && (currentUser?.role === 'Lecturer' || currentUser?.role === 'Admin'))
  );

  // Mark Entry Progress count
  const enteredMarksCount = currentBatchStudents.filter((st) => {
    const entry = markEntryState[st.id];
    return entry && (entry.isAbsent || (entry.marksObtained !== null && entry.marksObtained !== ""));
  }).length;

  // Results & Rankings calculations for selected exam
  const currentExamMarks = allMarks.filter((m) => m.examId === currentSelectedExam?.id);
  const totalMaxMarks = currentSelectedExam?.totalMarks || 100;
  const passThreshold = currentSelectedExam?.passMark || 50;

  const resultsList = currentBatchStudents.map((st) => {
    const markRec = currentExamMarks.find((m) => m.studentId === st.id);
    const entryState = markEntryState[st.id];
    const isAbs = markRec ? markRec.isAbsent : (entryState ? entryState.isAbsent : false);
    const marksObt = markRec ? markRec.marksObtained : (entryState ? entryState.marksObtained : null);
    const grade = isAbs ? "ABS" : calcGrade(marksObt, totalMaxMarks);
    const isPassed = !isAbs && marksObt !== null && marksObt >= passThreshold;

    return {
      studentId: st.id,
      regNo: st.regNo,
      name: st.name,
      marks: marksObt,
      isAbsent: isAbs,
      grade,
      isPassed
    };
  });

  // Sort results for ranking
  const rankedResults = [...resultsList].sort((a, b) => {
    if (a.isAbsent && !b.isAbsent) return 1;
    if (!a.isAbsent && b.isAbsent) return -1;
    return (b.marks || 0) - (a.marks || 0);
  });

  // Assign ranks
  let currentRank = 1;
  rankedResults.forEach((r, idx) => {
    if (r.isAbsent) {
      r.rank = "-";
    } else {
      if (idx > 0 && rankedResults[idx - 1].marks === r.marks) {
        r.rank = rankedResults[idx - 1].rank;
      } else {
        r.rank = currentRank;
      }
      currentRank++;
    }
  });

  // Stats tiles values
  const validScoredMarks = resultsList.filter((r) => !r.isAbsent && r.marks !== null).map((r) => r.marks);
  const classAvg = validScoredMarks.length > 0 ? (validScoredMarks.reduce((a, b) => a + b, 0) / validScoredMarks.length).toFixed(1) : "-";
  const highestMarkObj = resultsList.reduce((max, r) => (!r.isAbsent && r.marks !== null && r.marks > (max?.marks || -1) ? r : max), null);
  const passCount = resultsList.filter((r) => r.isPassed).length;
  const passPct = currentBatchStudents.length > 0 ? Math.round((passCount / currentBatchStudents.length) * 100) : 0;
  const absentCount = resultsList.filter((r) => r.isAbsent).length;

  // Grade Distribution Counts
  const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0, ABS: 0 };
  resultsList.forEach((r) => {
    if (gradeCounts[r.grade] !== undefined) gradeCounts[r.grade]++;
  });

  // Section 5: Subject Performance Calculations
  const activePerfSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const perfExams = (data.exams || [])
    .filter(
      (e) =>
        (e.subjectId === selectedSubjectId || e.subject === activePerfSubject?.name) &&
        (!selectedBatchName || e.batch === selectedBatchName)
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const perfBatchStudents = students.filter((s) => !selectedBatchName || s.batch === selectedBatchName);

  // Per exam average in progression chart
  const examProgressionData = perfExams.map((ex, idx) => {
    const exMarks = allMarks.filter((m) => m.examId === ex.id && !m.isAbsent && m.marksObtained !== null);
    const avg = exMarks.length > 0 ? Number((exMarks.reduce((acc, curr) => acc + curr.marksObtained, 0) / exMarks.length).toFixed(1)) : 0;
    const prevAvg = idx > 0 ? perfExams[idx - 1]._calculatedAvg || 0 : null;
    ex._calculatedAvg = avg;

    let trend = "stable";
    if (prevAvg !== null) {
      if (avg > prevAvg) trend = "up";
      else if (avg < prevAvg) trend = "down";
    }

    return {
      exam: ex,
      avg,
      trend
    };
  });

  return (
    <div>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: t.fontHeading, fontSize: '20px', fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            Examinations & Results Hub
          </h2>
          <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
            Schedule term tests, manage mark sheets, and generate official class ranking reports.
          </p>
        </div>
        {(currentUser.role === "Admin" || currentUser.role === "Lecturer") && (
          <button
            onClick={handleOpenAddExam}
            style={{
              background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(43,108,176,0.30)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            <Plus size={16} /> Schedule New Exam
          </button>
        )}
      </div>

      {/* SECTION 1 — PILL GROUP TABS */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#EEF0F4",
          padding: "4px",
          borderRadius: "10px",
          width: "fit-content",
          marginBottom: "20px",
          flexWrap: "wrap"
        }}
      >
        <button
          onClick={() => setActiveTab("schedule")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "schedule" ? 600 : 500,
            color: activeTab === "schedule" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "schedule" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "schedule" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Calendar size={16} /> Exam Schedule
        </button>

        <button
          onClick={() => setActiveTab("mark-entry")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "mark-entry" ? 600 : 500,
            color: activeTab === "mark-entry" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "mark-entry" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "mark-entry" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <FileCheck2 size={16} /> Mark Entry
        </button>

        <button
          onClick={() => setActiveTab("results")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "results" ? 600 : 500,
            color: activeTab === "results" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "results" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "results" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Award size={16} /> Results & Rankings
        </button>

        <button
          onClick={() => setActiveTab("performance")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "performance" ? 600 : 500,
            color: activeTab === "performance" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "performance" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "performance" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <TrendingUp size={16} /> Subject Performance
        </button>
      </div>

      {/* SECTION 2 — EXAM SCHEDULE TAB */}
      {activeTab === "schedule" && (
        <div>
          {/* FILTER ROW */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{
                padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer"
              }}
            >
              <option value="All">All Subjects</option>
              {((subjects && subjects.length > 0 ? subjects : data.subjects) || []).map((s) => (<option key={s.id} value={s.id}>{s.code ? `${s.code} — ` : ''}{s.name}</option>))}
            </select>

            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              style={{
                padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer"
              }}
            >
              <option value="All">All Batches</option>
              {(batches || []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer"
              }}
            >
              <option value="All">All Types</option>
              <option value="Term Test">Term Test</option>
              <option value="Mock Exam">Mock Exam</option>
              <option value="Trial Exam">Trial Exam</option>
              <option value="Assessment">Assessment</option>
              <option value="Past Paper">Past Paper Practice</option>
              <option value="Final Exam">Final Exam</option>
            </select>
          </div>

          {/* SESSION GROUPS */}
          {(filteredSessionGroups || []).map(group => {
            const subjectMap = getSubjectMap(group.records);
            const totalPapers = (group.records || []).length;
            const donePapers = (group.records || []).filter(r => r.status === 'Completed').length;

            return (
              <div key={group.examSessionId} style={{
                border: '1px solid #E3E6EA', borderRadius: '14px',
                marginBottom: '18px', overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'white' }}>
                      {group.examSessionName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '3px' }}>
                      {group.batchName}
                      {group.examType ? ` · ${group.examType}` : ''}
                      {group.sessionStartDate ? ` · ${group.sessionStartDate} → ${group.sessionEndDate}` : ''}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)', borderRadius: '20px',
                    padding: '4px 12px', fontSize: '11px', color: 'white', fontWeight: 700
                  }}>
                    {donePapers}/{totalPapers} papers done
                  </div>
                </div>

                {/* Subjects + papers */}
                <div style={{ padding: '16px 20px' }}>
                  {(subjectMap || []).map(sub => (
                    <div key={sub.subjectId || sub.subjectCode} style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#374151',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#EEF2FF', color: '#4F46E5',
                          borderRadius: '6px', padding: '2px 8px', fontSize: '11px' }}>
                          {sub.subjectCode}
                        </span>
                        {sub.subjectName}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '8px' }}>
                        {(sub.papers || []).map(paper => (
                          <div key={paper.id} style={{
                            border: paper.status === 'Completed'
                              ? '1px solid #A7F3D0' : '1px solid #E3E6EA',
                            background: paper.status === 'Completed' ? '#F0FDF4' : '#FAFAFA',
                            borderRadius: '10px', padding: '10px 14px', minWidth: '185px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1A202C' }}>
                                {paper.paperName || `Paper ${paper.paperNumber || 1}`}
                              </span>
                              {paper.status === 'Completed'
                                ? <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>✓ Done</span>
                                : <span style={{ fontSize: '10px', color: '#D97706', fontWeight: 700 }}>⏳ Pending</span>
                              }
                            </div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>📅 {paper.date}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>
                              🕐 {paper.startTime}–{paper.endTime}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>
                              Marks: {paper.passMarks}/{paper.totalMarks}
                              {paper.venue ? ` · ${paper.venue}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        const firstPaper = group.records?.[0];
                        if (firstPaper) setSelectedExamId(firstPaper.id);
                        if (group.batchName) setSelectedBatchName(group.batchName);
                        setActiveTab("mark-entry");
                      }}
                      style={{ padding: '8px 18px', borderRadius: '8px',
                        border: '1px solid #4F46E5', background: '#EEF2FF',
                        color: '#4F46E5', fontSize: '13px', fontWeight: 700,
                        cursor: 'pointer' }}>
                      Enter Results →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredSessionGroups.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 20px', color: '#9CA3AF'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                No exam sessions scheduled yet
              </div>
              <div style={{ fontSize: '13px' }}>
                Click "Schedule New Exam" to create your first exam session.
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3 — MARK ENTRY TAB */}
      {activeTab === "mark-entry" && (
        <div>
          {/* TOP SELECTOR ROW */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
              Select Examination Session for Mark Entry
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 36px 10px 13px',
                background: '#FFFFFF',
                border: '1.5px solid #E3E6EA',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1A202C',
                outline: 'none',
                fontFamily: "'Inter', sans-serif",
                appearance: 'none',
                WebkitAppearance: 'none',
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                cursor: 'pointer'
              }}
            >
              {(data.exams || []).map((ex) => {
                const subjCode = ex.subjectCode || ex.subject?.substring(0, 3).toUpperCase() || "GEN";
                return (
                  <option key={ex.id} value={ex.id}>
                    {subjCode} — {ex.name} ({ex.batch}) — {ex.date}
                  </option>
                );
              })}
            </select>
          </div>

          {currentSelectedExam && (
            <>
              {/* MARK ENTRY PROGRESS BAR */}
              <div style={{ marginBottom: '16px', background: '#FFFFFF', padding: '14px 18px', border: '1px solid #E3E6EA', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#4A5568', fontWeight: 600 }}>
                    Mark Entry Progress
                  </span>
                  <span style={{ fontSize: '12px', color: enteredMarksCount === currentBatchStudents.length ? '#2F855A' : '#2B6CB0', fontWeight: 700 }}>
                    {enteredMarksCount} / {currentBatchStudents.length} students completed
                  </span>
                </div>
                <div style={{ background: '#E3E6EA', borderRadius: '20px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    background: enteredMarksCount === currentBatchStudents.length ? '#2F855A' : '#2B6CB0',
                    width: `${currentBatchStudents.length > 0 ? (enteredMarksCount / currentBatchStudents.length) * 100 : 0}%`,
                    borderRadius: '20px', height: '8px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* PERMISSION NOTICE BANNER IF NOT PERMITTED */}
              {!canEnterMarks && (
                <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#C53030', fontSize: '13px', fontWeight: 600 }}>
                  ⚠️ Access Restricted: Only the assigned Main Lecturer ({currentAssignment?.mainLecturerName || 'Unassigned'}), Assistant Lecturer ({currentAssignment?.assistantLecturerName || 'None'}), or Admin can enter or edit marks for this examination.
                </div>
              )}

              {/* IMPORT MARKS BUTTON ROW */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <label style={{
                  padding: '8px 16px',
                  background: '#FFFFFF',
                  border: '1.5px solid #E3E6EA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: canEnterMarks ? '#4A5568' : '#A0AEC0',
                  cursor: canEnterMarks ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  opacity: canEnterMarks ? 1 : 0.6
                }}>
                  <Upload size={14} style={{ color: canEnterMarks ? '#2B6CB0' : '#A0AEC0' }} /> Import from CSV / Excel
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    disabled={!canEnterMarks}
                    onChange={handleFileImportChange}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  onClick={handleDownloadTemplate}
                  style={{
                    padding: '8px 16px',
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
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <Download size={14} style={{ color: '#2F855A' }} /> Download CSV Template
                </button>
              </div>

              {/* MARK ENTRY TABLE */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F8F9FA' }}>
                        <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'left', width: '50px' }}>#</th>
                        <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'left' }}>Student Name</th>
                        <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'left' }}>Student ID</th>
                        <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'left', width: '160px' }}>Marks Obtained</th>
                        <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'center', width: '100px' }}>Absent</th>
                        <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'center', width: '80px' }}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBatchStudents.map((st, idx) => {
                        const entry = markEntryState[st.id] || { marksObtained: null, isAbsent: false };
                        const isAbs = !!entry.isAbsent;
                        const markVal = entry.marksObtained;
                        const grade = isAbs ? "ABS" : calcGrade(markVal, currentSelectedExam.totalMarks || 100);
                        const gStyle = gradeColor(grade);

                        return (
                          <tr key={st.id} style={{ borderBottom: '1px solid #F4F5F7', background: isAbs ? '#FAFAFA' : '#FFFFFF' }}>
                            <td style={{ padding: '12px 16px', fontSize: '12px', color: '#718096', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#1A202C' }}>{st.name}</td>
                            <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: '#2B6CB0', fontWeight: 600 }}>{st.regNo}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max={currentSelectedExam.totalMarks || 100}
                                  disabled={isAbs || !canEnterMarks}
                                  value={isAbs ? "" : (markVal ?? "")}
                                  onChange={(e) => handleUpdateStudentMark(st.id, e.target.value)}
                                  placeholder="0 - 100"
                                  style={{
                                    width: '100px',
                                    padding: '7px 10px',
                                    background: (isAbs || !canEnterMarks) ? '#EDF2F7' : '#FFFFFF',
                                    border: '1.5px solid #E3E6EA',
                                    borderRadius: '7px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#1A202C',
                                    textAlign: 'right',
                                    outline: 'none'
                                  }}
                                />
                                <span style={{ fontSize: '11px', color: '#718096' }}>/ {currentSelectedExam.totalMarks || 100}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: canEnterMarks ? 'pointer' : 'not-allowed' }}>
                                <input
                                  type="checkbox"
                                  checked={isAbs}
                                  disabled={!canEnterMarks}
                                  onChange={(e) => handleToggleAbsent(st.id, e.target.checked)}
                                  style={{ width: '16px', height: '16px', accentColor: '#C53030' }}
                                />
                                <span style={{ fontSize: '12px', color: isAbs ? '#C53030' : '#718096', fontWeight: isAbs ? 700 : 500 }}>Absent</span>
                              </label>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <span style={{
                                background: gStyle.bg,
                                color: gStyle.color,
                                border: `1px solid ${gStyle.border}`,
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700
                              }}>
                                {grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {currentBatchStudents.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#A0AEC0', fontSize: '13px' }}>
                            No active students found in batch "{currentSelectedExam.batch}".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SAVE MARKS BUTTON */}
              <button
                onClick={handleSaveMarkEntry}
                disabled={!canEnterMarks}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: canEnterMarks ? 'linear-gradient(135deg, #2B6CB0, #1A4A8A)' : '#CBD5E0',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: canEnterMarks ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: canEnterMarks ? '0 2px 10px rgba(43,108,176,0.30)' : 'none',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                <CheckCircle2 size={18} /> Save All Marks to Registry
              </button>
            </>
          )}
        </div>
      )}

      {/* SECTION 4 — RESULTS & RANKINGS TAB */}
      {activeTab === "results" && (() => {
        const examScheduleData = safeLS('pba_exam_schedule', data.exams || []);
        const examResultsData = safeLS('pba_exam_results', allMarks || []);

        const displayScoreHelper = (r) => {
          if (!r) return '—';
          if (r.absent || r.isAbsent) return 'ABS';
          const val = r.score !== undefined ? r.score : (r.marksObtained !== undefined ? r.marksObtained : r.marks);
          if (val === null || val === undefined || val === '') return '—';
          return val;
        };

        const displayGradeHelper = (r) => {
          if (!r) return '—';
          if (r.absent || r.isAbsent) return 'ABS';
          if (r.grade) return r.grade;
          return '—';
        };

        const gradeColorHelper = (g) => {
          if (!g || g === '—') return { bg: '#F1F5F9', border: '#CBD5E1', color: '#64748B' };
          if (g === 'ABS')     return { bg: '#F3F4F6', border: '#D1D5DB', color: '#6B7280' };
          if (g === 'A')       return { bg: '#D1FAE5', border: '#A7F3D0', color: '#059669' };
          if (g === 'B')       return { bg: '#DBEAFE', border: '#BFDBFE', color: '#1D4ED8' };
          if (g === 'C')       return { bg: '#FEF3C7', border: '#FDE68A', color: '#D97706' };
          if (g === 'D')       return { bg: '#FFEDD5', border: '#FED7AA', color: '#EA580C' };
          return { bg: '#FEE2E2', border: '#FCA5A5', color: '#DC2626' }; // F
        };

        // Available Exam Names for selected batch
        const examNamesForBatch = filterBatchId
          ? [...new Set(
              (examScheduleData || [])
                .filter(e => e.batchId === filterBatchId || e.batch === filterBatchId || e.batchId === (batches.find(b => b.id === filterBatchId)?.name))
                .map(e => e.examName || e.name)
            )].filter(Boolean).sort()
          : [...new Set((examScheduleData || []).map(e => e.examName || e.name))].filter(Boolean).sort();

        // Filtered exam sessions
        const filteredSessions = (examScheduleData || []).filter(e => {
          if (filterBatchId) {
            const batchObj = batches.find(b => b.id === filterBatchId);
            const matchesBatch = e.batchId === filterBatchId || e.batch === filterBatchId || (batchObj && e.batch === batchObj.name);
            if (!matchesBatch) return false;
          }
          if (filterExamName && (e.examName || e.name) !== filterExamName) return false;
          return true;
        });

        // Derive subject columns
        const subjectColumns = [];
        const seenSubjects = new Set();
        (filteredSessions || []).forEach(sess => {
          const sId = sess.subjectId || sess.subject;
          if (sId && !seenSubjects.has(sId)) {
            seenSubjects.add(sId);
            const subObj = (subjects || []).find(s => s.id === sId || s.name === sId || s.code === sId);
            subjectColumns.push({
              subjectId: sId,
              subjectName: subObj?.name || sess.subjectName || sess.subject || sId,
              subjectCode: subObj?.code || sess.subjectCode || (subObj?.name || sess.subjectName || String(sId)).substring(0, 4).toUpperCase(),
              maxScore: Number(sess.maxScore || sess.totalMarks || 100)
            });
          }
        });

        // Fallback subject columns if none derived from sessions
        if (subjectColumns.length === 0 && (subjects || []).length > 0) {
          subjects.slice(0, 5).forEach(subObj => {
            subjectColumns.push({
              subjectId: subObj.id,
              subjectName: subObj.name,
              subjectCode: subObj.code || subObj.name.substring(0, 4).toUpperCase(),
              maxScore: 100
            });
          });
        }

        // Filtered Students
        const selectedBatchObj = (batches || []).find(b => b.id === filterBatchId);
        const filteredStudents = (students || []).filter(s => {
          if (!filterBatchId) return true;
          return s.batchId === filterBatchId || s.batch === filterBatchId || (selectedBatchObj && s.batch === selectedBatchObj.name);
        }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        // Results lookup: lookup[studentId][subjectId]
        const resultsLookup = {};
        (examResultsData || []).forEach(r => {
          if (filterBatchId) {
            const matchesBatch = r.batchId === filterBatchId || r.batch === filterBatchId || (selectedBatchObj && r.batch === selectedBatchObj.name);
            if (!matchesBatch) return;
          }
          if (filterExamName && (r.examName || r.name) !== filterExamName) return;

          const stId = r.studentId;
          const sbId = r.subjectId || r.subjectName || r.subject;
          if (!stId) return;
          if (!resultsLookup[stId]) resultsLookup[stId] = {};
          resultsLookup[stId][sbId] = r;
        });

        // Compute Student Totals
        const studentTotals = filteredStudents.map(student => {
          let totalScore = 0;
          let totalMax = 0;
          subjectColumns.forEach(col => {
            const r = (resultsLookup[student.id] || {})[col.subjectId] || (resultsLookup[student.id] || {})[col.subjectName];
            const isAbs = r?.absent || r?.isAbsent;
            const scoreVal = r?.score !== undefined ? r.score : (r?.marksObtained !== undefined ? r.marksObtained : r?.marks);
            if (r && !isAbs && scoreVal !== null && scoreVal !== undefined && scoreVal !== '') {
              totalScore += Number(scoreVal);
            }
            totalMax += Number(col.maxScore);
          });
          const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
          return { student, totalScore, totalMax, pct };
        });

        const rankedTotals = [...studentTotals].sort((a, b) => b.totalScore - a.totalScore);
        const rankMap = {};
        rankedTotals.forEach((item, i) => {
          rankMap[item.student.id] = i + 1;
        });

        return (
          <div>
            {/* STEP 1 — TOP FILTER BAR */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '12px',
              alignItems: 'center', padding: '16px',
              background: '#F8FAFC', borderRadius: '12px',
              border: '1px solid #E2E8F0', marginBottom: '16px'
            }}>
              {/* BATCH FILTER */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Batch:</span>
                <select
                  value={filterBatchId}
                  onChange={e => { setFilterBatchId(e.target.value); setFilterExamName(''); setRankSubjectId(''); }}
                  style={{ fontSize: '13px', padding: '7px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#1A202C', background: 'white', cursor: 'pointer' }}
                >
                  <option value="">All Batches</option>
                  {(batches || []).map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.shortCode || b.code || 'BATCH'})</option>
                  ))}
                </select>
              </div>

              {/* EXAM NAME FILTER */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Exam:</span>
                <select
                  value={filterExamName}
                  onChange={e => { setFilterExamName(e.target.value); setRankSubjectId(''); }}
                  style={{ fontSize: '13px', padding: '7px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#1A202C', background: 'white', cursor: 'pointer' }}
                >
                  <option value="">All Exams</option>
                  {examNamesForBatch.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* VIEW MODE TOGGLE */}
              <div style={{
                display: 'flex', gap: '4px', marginLeft: 'auto',
                background: '#EEF2FF', borderRadius: '10px', padding: '4px'
              }}>
                {[
                  { key: 'marksheet', label: '📋 Mark Sheet' },
                  { key: 'overall',   label: '🏆 Overall Ranking' },
                  { key: 'subject',   label: '📚 By Subject' }
                ].map(mode => (
                  <button
                    key={mode.key}
                    onClick={() => { setRankViewMode(mode.key); setRankSubjectId(''); }}
                    style={{
                      padding: '6px 14px', borderRadius: '7px',
                      fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      border: 'none',
                      background: rankViewMode === mode.key ? '#4F46E5' : 'transparent',
                      color: rankViewMode === mode.key ? 'white' : '#4F46E5',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* VIEW A — BATCH MARK SHEET */}
            {rankViewMode === 'marksheet' && (
              <div>
                {filteredStudents.length > 0 && subjectColumns.length > 0 ? (
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
                            <th style={{ padding: '10px 12px', color: 'white', textAlign: 'left', fontWeight: 700, width: '45px' }}>#</th>
                            <th style={{ padding: '10px 12px', color: 'white', textAlign: 'left', fontWeight: 700, minWidth: '160px' }}>STUDENT</th>
                            {subjectColumns.map(col => (
                              <th key={col.subjectId} style={{ padding: '10px 8px', color: 'white', textAlign: 'center', fontWeight: 700, minWidth: '85px' }}>
                                <div>{col.subjectCode || col.subjectName}</div>
                                <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>/{col.maxScore}</div>
                              </th>
                            ))}
                            <th style={{ padding: '10px 12px', color: 'white', textAlign: 'center', fontWeight: 700, minWidth: '90px', background: 'rgba(255,255,255,0.15)' }}>TOTAL</th>
                            <th style={{ padding: '10px 12px', color: 'white', textAlign: 'center', fontWeight: 700, minWidth: '65px', background: 'rgba(255,255,255,0.15)' }}>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankedTotals.map((item, idx) => {
                            const rank = rankMap[item.student.id];
                            const rowBg = idx % 2 === 0 ? 'white' : '#FAFBFF';
                            return (
                              <tr key={item.student.id} style={{ background: rowBg, borderBottom: '1px solid #F0F0F0' }}>
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800 }}>
                                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ fontWeight: 700, color: '#1A202C', fontSize: '13px' }}>{item.student.name}</div>
                                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>{item.student.regNo || item.student.studentCode || item.student.id}</div>
                                </td>
                                {subjectColumns.map(col => {
                                  const r = (resultsLookup[item.student.id] || {})[col.subjectId] || (resultsLookup[item.student.id] || {})[col.subjectName];
                                  const score = displayScoreHelper(r);
                                  const grade = displayGradeHelper(r);
                                  const gStyle = gradeColorHelper(grade);
                                  return (
                                    <td key={col.subjectId} style={{ padding: '8px', textAlign: 'center' }}>
                                      <div style={{ fontWeight: 700, fontSize: '13px', color: r?.absent || r?.isAbsent ? '#6B7280' : '#1A202C' }}>
                                        {score}
                                      </div>
                                      <div style={{
                                        fontSize: '10px', fontWeight: 700,
                                        color: gStyle.color, background: gStyle.bg, border: `1px solid ${gStyle.border}`,
                                        borderRadius: '4px', padding: '1px 5px', display: 'inline-block', marginTop: '2px'
                                      }}>
                                        {grade}
                                      </div>
                                    </td>
                                  );
                                })}
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#4F46E5', background: '#EEF2FF' }}>
                                  {item.totalScore} / {item.totalMax}
                                </td>
                                <td style={{
                                  padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontSize: '13px',
                                  color: item.pct >= 75 ? '#059669' : item.pct >= 50 ? '#D97706' : '#DC2626',
                                  background: '#EEF2FF'
                                }}>
                                  {item.pct}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#94A3B8' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>
                      Select a Batch and Exam above to view the mark sheet
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW B — OVERALL BATCH RANKING */}
            {rankViewMode === 'overall' && (
              <div>
                {/* STAT CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: '#EEF2FF', borderRadius: '10px', padding: '14px 16px', border: '1px solid #C7D2FE' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#4F46E5' }}>{filteredStudents.length}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#4338CA', textTransform: 'uppercase' }}>STUDENTS RANKED</div>
                  </div>
                  <div style={{ background: '#ECFDF5', borderRadius: '10px', padding: '14px 16px', border: '1px solid #A7F3D0' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669' }}>
                      {rankedTotals[0] ? `${rankedTotals[0].totalScore} / ${rankedTotals[0].totalMax}` : '—'}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#065F46', textTransform: 'uppercase' }}>HIGHEST AGGREGATE</div>
                  </div>
                  <div style={{ background: '#FEF3C7', borderRadius: '10px', padding: '14px 16px', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#D97706' }}>
                      {rankedTotals.length > 0 ? Math.round(rankedTotals.reduce((acc, curr) => acc + curr.pct, 0) / rankedTotals.length) : 0}%
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>CLASS AVERAGE</div>
                  </div>
                  <div style={{ background: '#F3E8FF', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E9D5FF' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#7C3AED' }}>{subjectColumns.length}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B21A8', textTransform: 'uppercase' }}>SUBJECTS INCLUDED</div>
                  </div>
                </div>

                {/* OVERALL RANKING TABLE */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', width: '80px' }}>RANK</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B' }}>STUDENT NAME</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textAlign: 'center' }}>TOTAL MARKS</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textAlign: 'center' }}>PERCENTAGE</th>
                          <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textAlign: 'center' }}>GRADE BAND</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankedTotals.map((item, idx) => {
                          const rank = idx + 1;
                          const band = item.pct >= 80 ? 'A' : item.pct >= 65 ? 'B' : item.pct >= 50 ? 'C' : item.pct >= 40 ? 'D' : 'F';
                          const gStyle = gradeColorHelper(band);
                          return (
                            <tr key={item.student.id} style={{ borderBottom: '1px solid #F1F5F9', background: rank === 1 ? '#FEF3C720' : 'white' }}>
                              <td style={{ padding: '12px 16px' }}>
                                {rank === 1 ? <span style={{ background: '#FEF3C7', color: '#D97706', padding: '3px 10px', borderRadius: '20px', fontWeight: 800, fontSize: '11px' }}>🥇 #1</span>
                                 : rank === 2 ? <span style={{ background: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: '20px', fontWeight: 800, fontSize: '11px' }}>🥈 #2</span>
                                 : rank === 3 ? <span style={{ background: '#FFEDD5', color: '#EA580C', padding: '3px 10px', borderRadius: '20px', fontWeight: 800, fontSize: '11px' }}>🥉 #3</span>
                                 : <strong style={{ color: '#64748B' }}>#{rank}</strong>}
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1A202C' }}>
                                {item.student.name} <small style={{ color: '#94A3B8', fontFamily: 'monospace' }}>({item.student.regNo || item.student.id})</small>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#4F46E5' }}>
                                {item.totalScore} / {item.totalMax}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: item.pct >= 75 ? '#059669' : item.pct >= 50 ? '#D97706' : '#DC2626' }}>
                                {item.pct}%
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span style={{
                                  background: gStyle.bg, color: gStyle.color, border: `1px solid ${gStyle.border}`,
                                  padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700
                                }}>
                                  Grade {band}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW C — BY SUBJECT */}
            {rankViewMode === 'subject' && (() => {
              const activeSubId = rankSubjectId || (subjectColumns[0]?.subjectId || '');
              const activeSubjectCol = subjectColumns.find(col => col.subjectId === activeSubId) || subjectColumns[0];

              // Subject results list
              const subjectResults = (filteredStudents || []).map(st => {
                const r = (resultsLookup[st.id] || {})[activeSubId] || (resultsLookup[st.id] || {})[activeSubjectCol?.subjectName];
                const score = r?.score !== undefined ? r.score : (r?.marksObtained !== undefined ? r.marksObtained : r?.marks);
                const isAbs = r?.absent || r?.isAbsent;
                const grade = displayGradeHelper(r);
                const maxScore = activeSubjectCol?.maxScore || 100;
                const isPassed = !isAbs && score !== null && score !== undefined && Number(score) >= 50;

                return {
                  student: st,
                  score: isAbs ? null : (score !== null && score !== undefined ? Number(score) : null),
                  isAbsent: isAbs,
                  grade,
                  isPassed,
                  maxScore
                };
              }).sort((a, b) => {
                if (a.isAbsent && !b.isAbsent) return 1;
                if (!a.isAbsent && b.isAbsent) return -1;
                return (b.score || 0) - (a.score || 0);
              });

              const validScores = subjectResults.filter(r => !r.isAbsent && r.score !== null).map(r => r.score);
              const subjAvg = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : '—';
              const highestSubjMark = validScores.length > 0 ? Math.max(...validScores) : '—';
              const passSubjCount = subjectResults.filter(r => r.isPassed).length;
              const passSubjRate = subjectResults.length > 0 ? Math.round((passSubjCount / subjectResults.length) * 100) : 0;
              const absentSubjCount = subjectResults.filter(r => r.isAbsent).length;

              return (
                <div>
                  {/* SUBJECT STRIP */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {subjectColumns.map(col => (
                      <button
                        key={col.subjectId}
                        onClick={() => setRankSubjectId(col.subjectId)}
                        style={{
                          padding: '8px 16px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          border: activeSubId === col.subjectId ? 'none' : '1px solid #E2E8F0',
                          background: activeSubId === col.subjectId ? '#4F46E5' : 'white',
                          color: activeSubId === col.subjectId ? 'white' : '#64748B',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {col.subjectCode} — {col.subjectName}
                      </button>
                    ))}
                  </div>

                  {/* SUBJECT STATS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: '#EBF4FF', borderRadius: '10px', padding: '14px 16px', border: '1px solid #BEE3F8' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#2B6CB0' }}>{subjAvg}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase' }}>CLASS AVERAGE</div>
                    </div>
                    <div style={{ background: '#F0FFF4', borderRadius: '10px', padding: '14px 16px', border: '1px solid #9AE6B4' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#2F855A' }}>{highestSubjMark}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase' }}>HIGHEST MARK</div>
                    </div>
                    <div style={{ background: '#FEF3C7', borderRadius: '10px', padding: '14px 16px', border: '1px solid #FDE68A' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#D97706' }}>{passSubjRate}%</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase' }}>PASS RATE</div>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#64748B' }}>{absentSubjCount}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase' }}>ABSENT</div>
                    </div>
                  </div>

                  {/* SUBJECT RANKING TABLE */}
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                            <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', width: '80px' }}>RANK</th>
                            <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B' }}>STUDENT NAME</th>
                            <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textAlign: 'center' }}>MARKS / TOTAL</th>
                            <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textAlign: 'center' }}>GRADE</th>
                            <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textAlign: 'center' }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjectResults.map((r, idx) => {
                            const rank = r.isAbsent ? '-' : idx + 1;
                            const gStyle = gradeColorHelper(r.grade);
                            return (
                              <tr key={r.student.id} style={{ borderBottom: '1px solid #F1F5F9', background: rank === 1 ? '#FEF3C720' : 'white' }}>
                                <td style={{ padding: '12px 16px' }}>
                                  {rank === 1 ? <span style={{ background: '#FEF3C7', color: '#D97706', padding: '3px 10px', borderRadius: '20px', fontWeight: 800, fontSize: '11px' }}>🥇 #1</span>
                                   : rank === 2 ? <span style={{ background: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: '20px', fontWeight: 800, fontSize: '11px' }}>🥈 #2</span>
                                   : rank === 3 ? <span style={{ background: '#FFEDD5', color: '#EA580C', padding: '3px 10px', borderRadius: '20px', fontWeight: 800, fontSize: '11px' }}>🥉 #3</span>
                                   : <strong style={{ color: '#64748B' }}>{rank !== '-' ? `#${rank}` : '-'}</strong>}
                                </td>
                                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1A202C' }}>
                                  {r.student.name} <small style={{ color: '#94A3B8', fontFamily: 'monospace' }}>({r.student.regNo || r.student.id})</small>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#1A202C' }}>
                                  {r.isAbsent ? 'ABS' : (r.score !== null ? `${r.score} / ${r.maxScore}` : '—')}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                  <span style={{
                                    background: gStyle.bg, color: gStyle.color, border: `1px solid ${gStyle.border}`,
                                    padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700
                                  }}>
                                    {r.grade}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                  {r.isAbsent ? (
                                    <span style={{ background: '#F7FAFC', color: '#718096', border: '1px solid #E2E8F0', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>ABSENT</span>
                                  ) : r.isPassed ? (
                                    <span style={{ background: '#F0FFF4', color: '#2F855A', border: '1px solid #9AE6B4', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>PASS</span>
                                  ) : (
                                    <span style={{ background: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>FAIL</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* SECTION 5 — SUBJECT PERFORMANCE TAB */}
      {activeTab === "performance" && (
        <div>
          {/* TOP FILTERS */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                Select Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                style={{
                  padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer"
                }}
              >
                {subjects.map((s) => (<option key={s.id} value={s.id}>{s.code} — {s.name}</option>))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                Select Batch
              </label>
              <select
                value={selectedBatchName}
                onChange={(e) => setSelectedBatchName(e.target.value)}
                style={{
                  padding: "9px 36px 9px 13px", background: "#FFFFFF", border: "1.5px solid #E3E6EA", borderRadius: "8px", fontSize: "13px", color: "#1A202C", outline: "none", fontFamily: "'Inter', sans-serif", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", cursor: "pointer"
                }}
              >
                {Array.from(new Set(students.map((s) => s.batch).filter(Boolean))).map((bName) => (
                  <option key={bName} value={bName}>{bName}</option>
                ))}
              </select>
            </div>

            <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '9px 16px',
                  background: 'linear-gradient(135deg, #D4A017, #B7860A)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(212,160,23,0.30)'
                }}
              >
                <Printer size={16} /> Print Cumulative Report
              </button>
            </div>
          </div>

          {/* EXAM PROGRESSION CHART */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '20px 22px', marginBottom: '20px' }}>
            <h4 style={{ fontFamily: "'Sora',sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A202C', marginBottom: '16px' }}>
              Class Average Progression ({activePerfSubject?.name || "Subject"})
            </h4>

            {examProgressionData.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', height: '180px', paddingBottom: '20px', borderBottom: '1px solid #E3E6EA' }}>
                {examProgressionData.map((d, i) => {
                  const maxMarks = d.exam.totalMarks || 100;
                  const barHeightPct = (d.avg / maxMarks) * 100;

                  return (
                    <div key={d.exam.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#2B6CB0', marginBottom: '6px' }}>
                        {d.avg}
                      </div>

                      <div
                        style={{
                          width: '100%',
                          maxWidth: '48px',
                          height: `${barHeightPct}%`,
                          background: 'linear-gradient(180deg, #2B6CB0, #1A4A8A)',
                          borderRadius: '6px 6px 0 0',
                          position: 'relative',
                          transition: 'height 0.3s ease'
                        }}
                      >
                        {/* Trend dot */}
                        {d.trend === "up" && (
                          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#2F855A', color: '#FFF', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            ↑
                          </span>
                        )}
                        {d.trend === "down" && (
                          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#C53030', color: '#FFF', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            ↓
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#1A202C', marginTop: '8px', textAlign: 'center' }}>
                        Exam #{d.exam.examNumber || (i + 1)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#718096', textAlign: 'center' }}>
                        {d.exam.date}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '20px', fontSize: '13px' }}>
                No completed or scheduled exams logged for this subject yet.
              </div>
            )}
          </div>

          {/* STUDENT CUMULATIVE TABLE */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F4F5F7', background: '#F8FAFE' }}>
              <h4 style={{ fontFamily: "'Sora',sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A202C', margin: 0 }}>
                Student Cumulative Performance Matrix
              </h4>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA' }}>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'left', minWidth: '180px' }}>Student Name</th>

                    {/* Dynamic Exam Columns */}
                    {perfExams.map((ex, idx) => (
                      <th key={ex.id} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'center', minWidth: '90px' }}>
                        Exam #{ex.examNumber || (idx + 1)}
                      </th>
                    ))}

                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'center' }}>Avg</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'center' }}>Best Grade</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #E3E6EA', textAlign: 'center' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {perfBatchStudents.map((st) => {
                    const studentExamsMarks = perfExams.map((ex) => {
                      const mRec = allMarks.find((m) => m.examId === ex.id && m.studentId === st.id);
                      if (mRec) {
                        return { marks: mRec.marksObtained, isAbsent: mRec.isAbsent, max: ex.totalMarks || 100 };
                      }
                      // Fallback to legacy
                      const legacy = (ex.results || []).find((r) => r.studentId === st.id);
                      if (legacy) {
                        return { marks: legacy.marks, isAbsent: false, max: ex.totalMarks || 100 };
                      }
                      return { marks: null, isAbsent: false, max: ex.totalMarks || 100 };
                    });

                    const validScores = studentExamsMarks.filter((sm) => !sm.isAbsent && sm.marks !== null);
                    const avgScore = validScores.length > 0 ? (validScores.reduce((acc, curr) => acc + curr.marks, 0) / validScores.length).toFixed(1) : "-";

                    // Determine best grade
                    let bestGrade = "ABS";
                    if (validScores.length > 0) {
                      const maxPct = Math.max(...validScores.map((sm) => (sm.marks / sm.max) * 100));
                      if (maxPct >= 75) bestGrade = "A";
                      else if (maxPct >= 65) bestGrade = "B";
                      else if (maxPct >= 55) bestGrade = "C";
                      else if (maxPct >= 40) bestGrade = "D";
                      else bestGrade = "F";
                    }

                    // Trend calculation: Compare latest valid exam mark against average
                    let trendIcon = <Minus size={14} style={{ color: '#718096' }} />;
                    if (validScores.length > 0 && avgScore !== "-") {
                      const lastValidScore = validScores[validScores.length - 1].marks;
                      if (lastValidScore > Number(avgScore)) {
                        trendIcon = <span style={{ color: '#2F855A', fontWeight: 800, fontSize: '14px' }}>↑</span>;
                      } else if (lastValidScore < Number(avgScore)) {
                        trendIcon = <span style={{ color: '#C53030', fontWeight: 800, fontSize: '14px' }}>↓</span>;
                      } else {
                        trendIcon = <span style={{ color: '#718096', fontWeight: 800, fontSize: '14px' }}>→</span>;
                      }
                    }

                    const bestGStyle = gradeColor(bestGrade);

                    return (
                      <tr key={st.id} style={{ borderBottom: '1px solid #F4F5F7' }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#1A202C' }}>
                          {st.name} <small style={{ color: '#2B6CB0', fontFamily: 'monospace' }}>({st.regNo})</small>
                        </td>

                        {/* Per-exam cell */}
                        {studentExamsMarks.map((sm, idx) => {
                          const g = sm.isAbsent ? "ABS" : calcGrade(sm.marks, sm.max);
                          const gStyle = gradeColor(g);

                          return (
                            <td key={idx} style={{ padding: '12px 14px', textAlign: 'center' }}>
                              {sm.isAbsent ? (
                                <span style={{ background: '#F7FAFC', color: '#718096', border: '1px solid #E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                  ABS
                                </span>
                              ) : sm.marks !== null ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1A202C' }}>{sm.marks}</span>
                                  <span style={{ background: gStyle.bg, color: gStyle.color, border: `1px solid ${gStyle.border}`, padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                                    {g}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#A0AEC0' }}>-</span>
                              )}
                            </td>
                          );
                        })}

                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#1A202C' }}>
                          {avgScore}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            background: bestGStyle.bg,
                            color: bestGStyle.color,
                            border: `1px solid ${bestGStyle.border}`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {bestGrade}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {trendIcon}
                        </td>
                      </tr>
                    );
                  })}

                  {perfBatchStudents.length === 0 && (
                    <tr>
                      <td colSpan={perfExams.length + 4} style={{ padding: '30px', textAlign: 'center', color: '#A0AEC0', fontSize: '13px' }}>
                        No students found for cumulative performance matrix.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE EXAM MODAL */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            width: '860px', maxHeight: '90vh', overflowY: 'auto',
            margin: 'auto', marginTop: '40px', borderRadius: '14px',
            background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>

            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              padding: '20px 24px', borderRadius: '14px 14px 0 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0, zIndex: 10
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>
                  📋 Schedule New Examination
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
                  Name session → select batch → set period → pick subjects → schedule papers
                </div>
              </div>
              <button onClick={() => setShowScheduleModal(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
                  color: 'white', borderRadius: '8px', padding: '6px 14px',
                  cursor: 'pointer', fontSize: '18px', fontWeight: 700 }}>×</button>
            </div>

            <div style={{ padding: '0 24px', marginTop: '20px' }}>
              {/* STEP 1 — Name the Exam Session */}
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#4F46E5',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Step 1 — Name the Exam Session
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: '6px' }}>EXAM SESSION NAME *</label>
                  <input type="text"
                    placeholder="e.g. First Term Exam 2026"
                    value={scheduleForm.examSessionName}
                    onChange={e => setScheduleForm(prev => ({
                      ...prev, examSessionName: e.target.value
                    }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #E3E6EA', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: '6px' }}>TYPE</label>
                  <select
                    value={scheduleForm.examType}
                    onChange={e => setScheduleForm(prev => ({ ...prev, examType: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #E3E6EA', fontSize: '14px', background: 'white' }}>
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                    <option value="Mock">Mock</option>
                    <option value="Trial">Trial</option>
                  </select>
                </div>
              </div>

              {/* STEP 2 — Select Batch */}
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#4F46E5',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px',
                marginTop: '18px' }}>
                Step 2 — Select Batch
              </div>
              <select
                value={scheduleForm.batchId}
                onChange={e => {
                  const b = (batches || []).find(b => b.id === e.target.value);
                  setScheduleForm(prev => ({
                    ...prev, batchId: e.target.value, batchName: b?.name || ''
                  }));
                  setSelectedSubjectIds([]);
                }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '14px',
                  background: 'white', color: '#1A202C' }}>
                <option value="">— Select Batch —</option>
                {(batches || []).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {(batches || []).length === 0 && (
                <p style={{ fontSize: '11px', color: '#D97706', marginTop: '6px', fontWeight: 600 }}>
                  ⚠ No batches found. Create batches first in General Admin → Batch Manager.
                </p>
              )}

              {/* STEP 3 — Exam Period */}
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#4F46E5',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px',
                marginTop: '18px' }}>
                Step 3 — Exam Period
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px',
                alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151',
                    display: 'block', marginBottom: '6px' }}>START DATE *</label>
                  <input type="date"
                    value={scheduleForm.sessionStartDate}
                    onChange={e => setScheduleForm(prev => ({
                      ...prev, sessionStartDate: e.target.value
                    }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #E3E6EA', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ color: '#9CA3AF', fontSize: '20px', textAlign: 'center',
                  paddingTop: '22px' }}>→</div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151',
                    display: 'block', marginBottom: '6px' }}>END DATE *</label>
                  <input type="date"
                    value={scheduleForm.sessionEndDate}
                    onChange={e => setScheduleForm(prev => ({
                      ...prev, sessionEndDate: e.target.value
                    }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #E3E6EA', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* STEP 4 — Select Subjects */}
              {scheduleForm.batchId && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#4F46E5',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px',
                    marginTop: '18px' }}>
                    Step 4 — Select Subjects
                  </div>
                  {batchSubjectOptions.length === 0 ? (
                    <div style={{ padding: '12px', background: '#FFF7ED',
                      border: '1px solid #FED7AA', borderRadius: '8px',
                      fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
                      ⚠ This batch has no subjects assigned. Go to
                      General Admin → Batch Manager → Edit Batch → Assign Subjects first.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(batchSubjectOptions || []).map(sub => {
                        const checked = (selectedSubjectIds || []).includes(sub.subjectId);
                        return (
                          <label key={sub.subjectId} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '20px', cursor: 'pointer',
                            border: checked ? '2px solid #4F46E5' : '2px solid #E3E6EA',
                            background: checked ? '#EEF2FF' : 'white',
                            fontSize: '13px', fontWeight: checked ? 700 : 500,
                            color: checked ? '#4F46E5' : '#374151',
                            userSelect: 'none'
                          }}>
                            <input type="checkbox"
                              checked={checked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedSubjectIds(prev => [...(prev || []), sub.subjectId]);
                                } else {
                                  setSelectedSubjectIds(prev =>
                                    (prev || []).filter(id => id !== sub.subjectId)
                                  );
                                }
                              }}
                              style={{ display: 'none' }}
                            />
                            {checked ? '✓ ' : ''}{sub.subjectCode} — {sub.subjectName}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* STEP 5 — Per-Subject Paper Scheduling */}
              {(scheduleForm.subjectRows || []).length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#4F46E5',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px',
                    marginTop: '22px' }}>
                    Step 5 — Schedule Papers per Subject
                  </div>

                  {(scheduleForm.subjectRows || []).map((row, rowIdx) => (
                    <div key={row.subjectId} style={{
                      border: '1px solid #E3E6EA', borderRadius: '12px',
                      marginBottom: '16px', overflow: 'hidden'
                    }}>

                      {/* Subject header */}
                      <div style={{
                        background: 'linear-gradient(135deg, #F0F4FF 0%, #E8F0FF 100%)',
                        padding: '12px 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid #E3E6EA'
                      }}>
                        <div style={{ fontWeight: 800, color: '#1A202C', fontSize: '14px' }}>
                          📚 {row.subjectCode} — {row.subjectName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>
                          {(row.papers || []).length} paper{(row.papers || []).length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div style={{ padding: '12px 16px' }}>
                        {(row.papers || []).map((paper, pIdx) => (
                          <div key={pIdx} style={{
                            background: pIdx % 2 === 0 ? '#FAFAFA' : 'white',
                            border: '1px solid #F1F5F9', borderRadius: '10px',
                            padding: '14px', marginBottom: '10px'
                          }}>

                            {/* Paper name row + remove button */}
                            <div style={{ display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  background: '#4F46E5', color: 'white', borderRadius: '50%',
                                  width: '22px', height: '22px', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  fontSize: '11px', fontWeight: 800, flexShrink: 0
                                }}>{pIdx + 1}</span>
                                <input type="text"
                                  placeholder={`Paper ${pIdx + 1} label (e.g. Paper 1 (MCQ))`}
                                  value={paper.paperName}
                                  onChange={e => {
                                    const updatedRows = (scheduleForm.subjectRows || []).map((r, ri) => {
                                      if (ri !== rowIdx) return r;
                                      const updatedPapers = (r.papers || []).map((p, pi) =>
                                        pi === pIdx ? { ...p, paperName: e.target.value } : p
                                      );
                                      return { ...r, papers: updatedPapers };
                                    });
                                    setScheduleForm(prev => ({ ...prev, subjectRows: updatedRows }));
                                  }}
                                  style={{ padding: '6px 10px', borderRadius: '6px',
                                    border: '1px solid #E3E6EA', fontSize: '13px',
                                    fontWeight: 600, width: '260px' }}
                                />
                              </div>
                              {(row.papers || []).length > 1 && (
                                <button
                                  onClick={() => {
                                    const updatedRows = (scheduleForm.subjectRows || []).map((r, ri) => {
                                      if (ri !== rowIdx) return r;
                                      return {
                                        ...r,
                                        papers: (r.papers || []).filter((_, pi) => pi !== pIdx)
                                      };
                                    });
                                    setScheduleForm(prev => ({ ...prev, subjectRows: updatedRows }));
                                  }}
                                  style={{ background: '#FEF2F2', border: '1px solid #FCA5A5',
                                    borderRadius: '6px', color: '#DC2626',
                                    padding: '4px 10px', fontSize: '12px',
                                    cursor: 'pointer', fontWeight: 600 }}>
                                  Remove
                                </button>
                              )}
                            </div>

                            {/* Paper fields: DATE | START | END | TOTAL MKS | PASS MKS | VENUE */}
                            <div style={{ display: 'grid',
                              gridTemplateColumns: '160px 100px 100px 90px 90px 1fr',
                              gap: '10px', alignItems: 'end' }}>

                              <div>
                                <label style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280',
                                  textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                  DATE *</label>
                                <input type="date" value={paper.date}
                                  onChange={e => {
                                    const updatedRows = (scheduleForm.subjectRows || []).map((r, ri) => {
                                      if (ri !== rowIdx) return r;
                                      return { ...r, papers: (r.papers || []).map((p, pi) =>
                                        pi === pIdx ? { ...p, date: e.target.value } : p) };
                                    });
                                    setScheduleForm(prev => ({ ...prev, subjectRows: updatedRows }));
                                  }}
                                  style={{ width: '100%', padding: '7px 8px', borderRadius: '6px',
                                    border: '1px solid #E3E6EA', fontSize: '12px',
                                    boxSizing: 'border-box' }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280',
                                  textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                  START *</label>
                                <input type="time" value={paper.startTime}
                                  onChange={e => {
                                    const updatedRows = (scheduleForm.subjectRows || []).map((r, ri) => {
                                      if (ri !== rowIdx) return r;
                                      return { ...r, papers: (r.papers || []).map((p, pi) =>
                                        pi === pIdx ? { ...p, startTime: e.target.value } : p) };
                                    });
                                    setScheduleForm(prev => ({ ...prev, subjectRows: updatedRows }));
                                  }}
                                  style={{ width: '100%', padding: '7px 8px', borderRadius: '6px',
                                    border: '1px solid #E3E6EA', fontSize: '12px',
                                    boxSizing: 'border-box' }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280',
                                  textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                  END *</label>
                                <input type="time" value={paper.endTime}
                                  onChange={e => {
                                    const updatedRows = (scheduleForm.subjectRows || []).map((r, ri) => {
                                      if (ri !== rowIdx) return r;
                                      return { ...r, papers: (r.papers || []).map((p, pi) =>
                                        pi === pIdx ? { ...p, endTime: e.target.value } : p) };
                                    });
                                    setScheduleForm(prev => ({ ...prev, subjectRows: updatedRows }));
                                  }}
                                  style={{ width: '100%', padding: '7px 8px', borderRadius: '6px',
                                    border: '1px solid #E3E6EA', fontSize: '12px',
                                    boxSizing: 'border-box' }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280',
                                  textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                  TOTAL</label>
                                <input type="number" min={1} value={paper.totalMarks}
                                  onChange={e => {
                                    const updatedRows = (scheduleForm.subjectRows || []).map((r, ri) => {
                                      if (ri !== rowIdx) return r;
                                      return { ...r, papers: (r.papers || []).map((p, pi) =>
                                        pi === pIdx ? { ...p, totalMarks: Number(e.target.value) } : p) };
                                    });
                                    setScheduleForm(prev => ({ ...prev, subjectRows: updatedRows }));
                                  }}
                                  style={{ width: '100%', padding: '7px 8px', borderRadius: '6px',
                                    border: '1px solid #E3E6EA', fontSize: '12px',
                                    boxSizing: 'border-box', textAlign: 'center', fontWeight: 700 }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280',
                                  textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                  PASS</label>
                                <input type="number" min={1} value={paper.passMarks}
                                  onChange={e => {
                                    const updatedRows = (scheduleForm.subjectRows || []).map((r, ri) => {
                                      if (ri !== rowIdx) return r;
                                      return { ...r, papers: (r.papers || []).map((p, pi) =>
                                        pi === pIdx ? { ...p, passMarks: Number(e.target.value) } : p) };
                                    });
                                    setScheduleForm(prev => ({ ...prev, subjectRows: updatedRows }));
                                  }}
                                  style={{ width: '100%', padding: '7px 8px', borderRadius: '6px',
                                    border: '1px solid #E3E6EA', fontSize: '12px',
                                    boxSizing: 'border-box', textAlign: 'center', fontWeight: 700 }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280',
                                  textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                  VENUE</label>
                                <input type="text" placeholder="e.g. Hall A" value={paper.venue}
                                  onChange={e => {
                                    const updatedRows = (scheduleForm.subjectRows || []).map((r, ri) => {
                                      if (ri !== rowIdx) return r;
                                      return { ...r, papers: (r.papers || []).map((p, pi) =>
                                        pi === pIdx ? { ...p, venue: e.target.value } : p) };
                                    });
                                    setScheduleForm(prev => ({ ...prev, subjectRows: updatedRows }));
                                  }}
                                  style={{ width: '100%', padding: '7px 8px', borderRadius: '6px',
                                    border: '1px solid #E3E6EA', fontSize: '12px',
                                    boxSizing: 'border-box' }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Add Paper button */}
                        <button
                          onClick={() => {
                            const updatedRows = (scheduleForm.subjectRows || []).map((r, ri) => {
                              if (ri !== rowIdx) return r;
                              return { ...r, papers: [...(r.papers || []), emptyPaper()] };
                            });
                            setScheduleForm(prev => ({ ...prev, subjectRows: updatedRows }));
                          }}
                          style={{ width: '100%', padding: '9px', borderRadius: '8px',
                            border: '2px dashed #C7D2FE', background: '#F5F7FF',
                            color: '#4F46E5', fontSize: '12px', fontWeight: 700,
                            cursor: 'pointer', marginTop: '4px' }}>
                          + Add Paper for {row.subjectCode}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px 20px',
              display: 'flex', justifyContent: 'flex-end', gap: '10px',
              borderTop: '1px solid #F1F5F9', marginTop: '20px',
              background: '#FAFBFF', position: 'sticky', bottom: 0 }}>
              <button onClick={() => setShowScheduleModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', background: 'white',
                  color: '#374151', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSaveExamSession}
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  color: 'white', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(79,70,229,0.35)' }}>
                📋 Save Exam Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV / EXCEL IMPORT PREVIEW MODAL */}
      {showImportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "16px" : "28px", width: isMobileState ? "95vw" : "680px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", margin: isMobileState ? "20px auto" : "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative" }}>
            <button
              onClick={() => setShowImportModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", marginBottom: "8px" }}>
              Import Marks Preview
            </h3>
            <p style={{ fontSize: "12px", color: "#718096", marginBottom: "16px" }}>
              Review parsed rows from your uploaded file before committing to mark entry sheet.
            </p>

            <div style={{ maxHeight: "360px", overflowY: "auto", overflowX: "auto", WebkitOverflowScrolling: "touch", border: "1px solid #E3E6EA", borderRadius: "12px", marginBottom: "20px" }}>
              <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8F9FA" }}>
                    <th style={{ padding: "8px 12px", fontSize: "11px", color: "#718096", textAlign: "left" }}>Row</th>
                    <th style={{ padding: "8px 12px", fontSize: "11px", color: "#718096", textAlign: "left" }}>File Data</th>
                    <th style={{ padding: "8px 12px", fontSize: "11px", color: "#718096", textAlign: "left" }}>Matched Student</th>
                    <th style={{ padding: "8px 12px", fontSize: "11px", color: "#718096", textAlign: "center" }}>Marks</th>
                    <th style={{ padding: "8px 12px", fontSize: "11px", color: "#718096", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((row) => {
                    const isMatched = !!row.matchedStudent;
                    const isValid = row.isValidMark;

                    return (
                      <tr
                        key={row.rowNum}
                        style={{
                          background: !isMatched ? "#FEF3C720" : !isValid ? "#FFF5F5" : "transparent",
                          borderBottom: "1px solid #F4F5F7"
                        }}
                      >
                        <td style={{ padding: "8px 12px", fontSize: "12px", color: "#718096" }}>#{row.rowNum}</td>
                        <td style={{ padding: "8px 12px", fontSize: "12px", color: "#1A202C" }}>
                          {row.rawName || row.rawId || "Unknown"}
                        </td>
                        <td style={{ padding: "8px 12px", fontSize: "12px" }}>
                          {isMatched ? (
                            <span style={{ color: "#2F855A", fontWeight: 700 }}>
                              ✓ {row.matchedStudent.name} ({row.matchedStudent.regNo})
                            </span>
                          ) : (
                            <span style={{ color: "#B7860A", fontWeight: 600 }}>
                              ⚠️ Student Not Found
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "8px 12px", fontSize: "12px", textAlign: "center", fontWeight: 700 }}>
                          {row.isAbsent ? <span style={{ color: "#718096" }}>ABS</span> : row.rawMark ?? "-"}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          {!isMatched ? (
                            <span style={{ background: "#FEF3C7", color: "#B7860A", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                              Skipped
                            </span>
                          ) : !isValid ? (
                            <span style={{ background: "#FFF5F5", color: "#C53030", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                              Invalid Mark
                            </span>
                          ) : (
                            <span style={{ background: "#F0FFF4", color: "#2F855A", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                              Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
              <button type="button" onClick={() => setShowImportModal(false)} style={{ background: "#FFFFFF", color: "#4A5568", border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button
                type="button"
                onClick={handleConfirmImport}
                style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
