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
  const [selectedBatchId, setSelectedBatchId] = useState("");

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

  // Edit Session — reuses the existing new-exam modal in edit mode
  const [editExamSessionId, setEditExamSessionId] = useState(null);
  // null = Create mode, 'examSession_xxx' = Edit mode

  // Delete Session confirmation
  const [showDeleteSession, setShowDeleteSession]   = useState(false);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState(null);
  // { examSessionId, examSessionName }

  // Edit Paper modal (single paper)
  const [showEditPaper, setShowEditPaper]   = useState(false);
  const [editPaperRecord, setEditPaperRecord] = useState(null);
  // The full pba_exam_schedule record for this paper
  const [editPaperForm, setEditPaperForm] = useState({
    date: '', startTime: '', endTime: '',
    totalMarks: 100, passMarks: 40, venue: '', paperName: ''
  });

  // Delete single paper confirmation
  const [showDeletePaper, setShowDeletePaper]   = useState(false);
  const [deletePaperTarget, setDeletePaperTarget] = useState(null);
  // The full pba_exam_schedule record

  // Invigilator modal state
  const [showInvigilatorModal, setShowInvigilatorModal] = useState(false);
  const [invigilatorPaper, setInvigilatorPaper] = useState(null);
  const [invigilatorList, setInvigilatorList] = useState([]);
  const [lecturers, setLecturers] = useState(() => safeLS('pba_lecturers', []));

  // Import Modal & Preview
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState([]);

  // Local state initialized with lazy initializers from localStorage
  const [batches, setBatches] = useState(() => safeLS('pba_batches', []));
  const [subjects, setSubjects] = useState(() => safeLS('pba_subjects', []));
  const [examSchedule, setExamSchedule] = useState(() => safeLS('pba_exam_schedule', []));

  // Subject Clash Rules State
  const [clashRulesOpen, setClashRulesOpen] = useState(false);
  const [newClashA, setNewClashA] = useState('');
  const [newClashB, setNewClashB] = useState('');
  const [clashRules, setClashRules] = useState(() => safeLS('pba_clash_rules', []));

  // Classrooms State
  const [classrooms, setClassrooms] = useState(() => safeLS('pba_classrooms', []));

  // Timetable Export State
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo,   setExportTo]   = useState('');

  // Refresh on mount so newly created batches appear immediately
  useEffect(() => {
    setBatches(safeLS('pba_batches', []));
    setSubjects(safeLS('pba_subjects', []));
    setExamSchedule(safeLS('pba_exam_schedule', []));
    setLecturers(safeLS('pba_lecturers', []));
    setClassrooms(safeLS('pba_classrooms', []));

    // Seed clash rules defaults if not existing
    const existingRules = safeLS('pba_clash_rules', null);
    if (existingRules === null || existingRules === undefined) {
      const defaults = [
        { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'uuid-1'), subjectA: 'Biology',        subjectB: 'Physics'         },
        { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'uuid-2'), subjectA: 'Biology',        subjectB: 'Chemistry'       },
        { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'uuid-3'), subjectA: 'Physics',        subjectB: 'Chemistry'       },
        { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'uuid-4'), subjectA: 'Biology',        subjectB: 'Maths'           },
        { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'uuid-5'), subjectA: 'Accounts',       subjectB: 'Business Studies'},
        { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'uuid-6'), subjectA: 'Accounts',       subjectB: 'Economics'       },
        { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'uuid-7'), subjectA: 'Business Studies', subjectB: 'Economics'     }
      ];
      saveLS('pba_clash_rules', defaults);
      setClashRules(defaults);
    } else {
      setClashRules(existingRules);
    }

    // Bidirectional sync between pba_exams and pba_exam_schedule
    const sched = safeLS('pba_exam_schedule', []);
    const exams = safeLS('pba_exams', []);
    if ((!exams || exams.length === 0) && sched && sched.length > 0) {
      saveLS('pba_exams', sched);
    } else if ((!sched || sched.length === 0) && exams && exams.length > 0) {
      saveLS('pba_exam_schedule', exams);
      setExamSchedule(exams);
    }
  }, []);

  const handleAddClashRule = () => {
    if (!newClashA || !newClashB || newClashA === newClashB) return;
    const existing = safeLS('pba_clash_rules', []);
    const alreadyExists = (existing || []).some(r =>
      (r.subjectA === newClashA && r.subjectB === newClashB) ||
      (r.subjectA === newClashB && r.subjectB === newClashA)
    );
    if (alreadyExists) return;
    const updated = [...(existing || []), {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'clash_' + Date.now()),
      subjectA: newClashA,
      subjectB: newClashB
    }];
    saveLS('pba_clash_rules', updated);
    setClashRules(updated);
    setNewClashA('');
    setNewClashB('');
  };

  const handleRemoveClashRule = (ruleId) => {
    const updated = (safeLS('pba_clash_rules', []) || [])
      .filter(r => r.id !== ruleId);
    saveLS('pba_clash_rules', updated);
    setClashRules(updated);
  };

  const subjectOptions = (() => {
    const defaultList = ['Biology', 'Physics', 'Chemistry', 'Maths', 'Accounts', 'Business Studies', 'Economics'];
    const lsList = (safeLS('pba_subjects', []) || []).map(s => s.name || s).filter(Boolean);
    return [...new Set([...defaultList, ...lsList])].sort();
  })();

  const detectClashes = (subject, date, startTime, endTime, excludeExamId = null) => {
    if (!subject || !date) return [];
    const rules = safeLS('pba_clash_rules', []) || clashRules || [];
    const allExams = (examSchedule && examSchedule.length > 0)
      ? examSchedule
      : (safeLS('pba_exam_schedule', []) || safeLS('pba_exams', []) || []);

    const forbiddenPartners = (rules || [])
      .filter(r => r.subjectA === subject || r.subjectB === subject)
      .map(r => r.subjectA === subject ? r.subjectB : r.subjectA);

    if (forbiddenPartners.length === 0) return [];

    return (allExams || []).filter(exam => {
      if (excludeExamId && exam.id === excludeExamId) return false;
      if (exam.date !== date) return false;
      const examSubj = exam.subject || exam.subjectName;
      if (!forbiddenPartners.includes(examSubj)) return false;

      const aStart = startTime || '00:00';
      const aEnd   = endTime   || '23:59';
      const bStart = exam.startTime || '00:00';
      const bEnd   = exam.endTime   || '23:59';
      return aStart < bEnd && aEnd > bStart;
    });
  };

  const computeAllClashes = () => {
    const allExams = (examSchedule && examSchedule.length > 0)
      ? examSchedule
      : (safeLS('pba_exam_schedule', []) || safeLS('pba_exams', []) || []);
    const rules = safeLS('pba_clash_rules', []) || clashRules || [];
    const clashedIds = new Set();

    allExams.forEach((exam, i) => {
      const examSubj = exam.subject || exam.subjectName;
      if (!examSubj || !exam.date) return;
      const partners = rules
        .filter(r => r.subjectA === examSubj || r.subjectB === examSubj)
        .map(r => r.subjectA === examSubj ? r.subjectB : r.subjectA);

      if (partners.length === 0) return;

      allExams.forEach((other, j) => {
        if (i === j) return;
        if (other.date !== exam.date) return;
        const otherSubj = other.subject || other.subjectName;
        if (!partners.includes(otherSubj)) return;
        const aStart = exam.startTime  || '00:00';
        const aEnd   = exam.endTime    || '23:59';
        const bStart = other.startTime || '00:00';
        const bEnd   = other.endTime   || '23:59';
        if (aStart < bEnd && aEnd > bStart) {
          clashedIds.add(exam.id);
          clashedIds.add(other.id);
        }
      });
    });
    return clashedIds;
  };

  const clashedExamIds = computeAllClashes();

  const handlePatchExam = (examId, patch) => {
    const allSched = safeLS('pba_exam_schedule', []);
    const updatedSched = (allSched || []).map(e =>
      e.id === examId ? { ...e, ...patch } : e
    );
    saveLS('pba_exam_schedule', updatedSched);
    setExamSchedule(updatedSched);

    const allExams = safeLS('pba_exams', []);
    const updatedExams = (allExams || []).map(e =>
      e.id === examId ? { ...e, ...patch } : e
    );
    saveLS('pba_exams', updatedExams.length > 0 ? updatedExams : updatedSched);
  };

  const examStatus = (exam) => {
    if (exam.invigilatorId && (exam.roomId || exam.venue))  return 'complete';
    if (exam.invigilatorId || exam.roomId || exam.venue)  return 'partial';
    return 'pending';
  };

  const handleExportPDF = () => {
    const allExams = (safeLS('pba_exam_schedule', []) || []).length > 0
      ? safeLS('pba_exam_schedule', [])
      : (safeLS('pba_exams', []) || []);
    const filtered = allExams
      .filter(e => {
        if (exportFrom && e.date < exportFrom) return false;
        if (exportTo   && e.date > exportTo)   return false;
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        return (a.startTime || '').localeCompare(b.startTime || '');
      });

    const byDate = {};
    filtered.forEach(e => {
      const d = e.date || 'TBD';
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(e);
    });

    const formatDate = (d) => {
      if (!d || d === 'TBD') return 'Date TBD';
      try {
        return new Date(d).toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
      } catch {
        return d;
      }
    };

    const rows = Object.entries(byDate).map(([date, exams]) => `
      <tr class="date-header">
        <td colspan="5">${formatDate(date)}</td>
      </tr>
      ${exams.map(e => `
        <tr>
          <td>${e.startTime || '—'} – ${e.endTime || '—'}</td>
          <td>${e.subject || e.subjectName || '—'}</td>
          <td>${e.batchName || e.batch || '—'}</td>
          <td>${e.invigilatorName || '<em style="color:#9CA3AF">TBC</em>'}</td>
          <td>${e.roomName || e.venue || '<em style="color:#9CA3AF">TBC</em>'}</td>
        </tr>
      `).join('')}
    `).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>PBA Exam Timetable</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px;
                 margin: 24px; color: #111827; }
          h1   { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
          p.sub{ font-size: 12px; color: #6B7280; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th    { background: #1E3A8A; color: #fff; text-align: left;
                  padding: 8px 10px; font-size: 11px; font-weight: 700;
                  letter-spacing: 0.04em; }
          td    { padding: 7px 10px; border-bottom: 1px solid #E5E7EB;
                  vertical-align: top; }
          tr.date-header td {
            background: #EFF6FF; color: #1E40AF; font-weight: 700;
            font-size: 13px; padding: 10px 10px 6px; border-top: 2px solid #BFDBFE;
          }
          tr:hover td { background: #F9FAFB; }
          .tbc { color: #9CA3AF; font-style: italic; }
          .footer { margin-top: 28px; font-size: 11px; color: #9CA3AF;
                    border-top: 1px solid #E5E7EB; padding-top: 10px; }
          @media print {
            body { margin: 12mm; }
            .footer { position: fixed; bottom: 12mm; width: 100%; }
          }
        </style>
      </head>
      <body>
        <h1>PBA Full-Time Portal — Examination Timetable</h1>
        <p class="sub">Generated ${new Date().toLocaleDateString('en-GB', {
          weekday:'long', day:'numeric', month:'long', year:'numeric'
        })}${exportFrom || exportTo
          ? ` &nbsp;·&nbsp; Period: ${exportFrom||'—'} to ${exportTo||'—'}`
          : ''
        }</p>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Subject</th>
              <th>Batch</th>
              <th>Invigilator</th>
              <th>Room</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">PBA Full-Time Portal &nbsp;·&nbsp; Confidential</div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }
  };

  const handleCopyWhatsApp = () => {
    const allExams = (safeLS('pba_exam_schedule', []) || []).length > 0
      ? safeLS('pba_exam_schedule', [])
      : (safeLS('pba_exams', []) || []);
    const filtered = allExams
      .filter(e => {
        if (exportFrom && e.date < exportFrom) return false;
        if (exportTo   && e.date > exportTo)   return false;
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        return (a.startTime || '').localeCompare(b.startTime || '');
      });

    const formatDate = (d) => {
      if (!d) return 'TBD';
      try {
        return new Date(d).toLocaleDateString('en-GB', {
          weekday:'long', day:'numeric', month:'long', year:'numeric'
        });
      } catch {
        return d;
      }
    };

    let currentDate = '';
    const lines = [
      `📚 *PBA Full-Time Portal — Examination Timetable*`,
      ``
    ];

    filtered.forEach(e => {
      if (e.date !== currentDate) {
        currentDate = e.date;
        lines.push(`📅 *${formatDate(e.date)}*`);
      }
      const invig = e.invigilatorName || 'TBC';
      const room  = e.roomName || e.venue || 'TBC';
      lines.push(
        `🕐 *${e.startTime||'?'}–${e.endTime||'?'}*` +
        ` | ${e.subject || e.subjectName || '—'}` +
        ` | ${e.batchName || e.batch || '—'}` +
        ` | 👤 ${invig}` +
        ` | 🏫 ${room}`
      );
    });

    lines.push(``);
    lines.push(`_Sent from PBA Full-Time Portal_`);

    const msg = lines.join('\n');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(msg)
        .then(() => alert('Schedule copied! Paste into WhatsApp or email.'))
        .catch(() => {
          window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
        });
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
    }
  };

  const computePercentage = (rawScore, paperTotal) => {
    if (rawScore === null || rawScore === undefined || rawScore === '') return null;
    const total = Number(paperTotal) || 100;
    return Math.round((Number(rawScore) / total) * 100 * 10) / 10;
  };

  const computeOverallPercent = (studentMarks, examsInView) => {
    let totalRaw   = 0;
    let totalPaper = 0;
    (examsInView || []).forEach(exam => {
      const mark = studentMarks[exam.id];
      if (mark !== null && mark !== undefined && mark !== '') {
        totalRaw   += Number(mark);
        totalPaper += (Number(exam.totalMarks) || 100);
      }
    });
    if (totalPaper === 0) return null;
    return Math.round((totalRaw / totalPaper) * 100 * 10) / 10;
  };

  const percentColor = (pct) => {
    if (pct === null || pct === undefined) return { color: '#9CA3AF', bg: 'transparent' };
    if (pct >= 75)  return { color: '#065F46', bg: '#D1FAE5' };
    if (pct >= 50)  return { color: '#92400E', bg: '#FEF3C7' };
    return           { color: '#991B1B', bg: '#FEE2E2' };
  };

  // Exam results
  const [examResults, setExamResults] = useState(
    () => safeLS('pba_exam_results', [])
  );
  useEffect(() => {
    setExamResults(safeLS('pba_exam_results', []));
  }, []);

  // Mark Entry selectors
  const [markExamSessionId, setMarkExamSessionId] = useState('');
  const [markSubjectId, setMarkSubjectId] = useState('');
  const [markPaperNumber, setMarkPaperNumber] = useState('');

  // Import modal state
  const [importPreview, setImportPreview] = useState(null);
  // null = no preview open
  // { rows: [...], colNames: [...], nameCol: 0, scoreCol: 1, mappedRows: [...] }
  const [lastImportSummary, setLastImportSummary] = useState(null);
  const [showMarkImport, setShowMarkImport] = useState(false);
  const [markImportRows, setMarkImportRows] = useState([]);
  const [markImportError, setMarkImportError] = useState('');
  const [markToast, setMarkToast] = useState(false);

  const calcGrade = (pct) => {
    if (pct === null || pct === undefined) return 'ABS';
    if (pct >= 90) return 'A*';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    if (pct >= 40) return 'E';
    return 'U';
  };

  const gradeColor = (grade) => {
    if (!grade || grade === 'ABS') return '#9CA3AF';
    if (grade === 'A*' || grade === 'A') return '#059669';
    if (grade === 'B' || grade === 'C') return '#2563EB';
    if (grade === 'D' || grade === 'E') return '#D97706';
    return '#DC2626';
  };

  // Build mark sheet rows: students from batch.students / pba_students + pba_marks / saved results
  const buildMarkSheet = (examSessionId, batchId, subjectId, paperNumber) => {
    const batches = safeLS('pba_batches', []) || [];
    const batch = batches.find(b => b.id === batchId || (selectedBatchName && b.name === selectedBatchName));
    const allStudents = safeLS('pba_students', []) || [];
    const fromStudentDb = allStudents.filter(s => s.batchId === batchId || (batch && s.batch === batch.name));
    const studentMap = new Map();
    (batch?.students || []).forEach(s => { if (s) studentMap.set(s.id || s.regNo || s.name, s); });
    fromStudentDb.forEach(s => { if (s) studentMap.set(s.id || s.regNo || s.name, s); });
    const students = studentMap.size > 0
      ? Array.from(studentMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      : fromStudentDb.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const paperRec = (examSchedule || []).find(r =>
      r.examSessionId === examSessionId &&
      r.subjectId === subjectId &&
      Number(r.paperNumber) === Number(paperNumber)
    );
    const totalMks = paperRec?.totalMarks || 100;
    const passMks  = paperRec?.passMarks  || 40;
    const currentExamId = paperRec?.id || selectedExamId;

    const allMarksList = safeLS('pba_marks', []) || [];
    const resultsList  = safeLS('pba_exam_results', []) || [];

    return (students || []).map(student => {
      // Look up mark in pba_marks first
      const markRecord = (allMarksList || []).find(m =>
        m.examId === currentExamId && m.studentId === student.id
      );

      const saved = (resultsList || []).find(r =>
        ((r.examSessionId === examSessionId &&
          r.subjectId === subjectId &&
          Number(r.paperNumber) === Number(paperNumber)) ||
         (r.examId && r.examId === currentExamId)) &&
        r.studentId === student.id
      );

      const rawMarks = markRecord?.rawScore ?? saved?.rawMarks ?? null;
      const absent   = saved?.absent ?? false;
      const pct = markRecord?.percentage ?? (
        (!absent && rawMarks !== null && rawMarks !== '')
          ? Math.round((parseFloat(rawMarks) / totalMks) * 1000) / 10
          : null
      );

      return {
        studentId:   student.id,
        studentName: student.name || '—',
        studentRegNo: student.regNo || student.studentRegNo || student.id || '',
        rawMarks,
        percentage: pct,
        grade:      absent ? 'ABS' : calcGrade(pct),
        isPassed:   !absent && rawMarks !== null && parseFloat(rawMarks) >= passMks,
        absent,
        totalMarks: totalMks,
        passMarks:  passMks,
        isImported: markRecord !== undefined && markRecord !== null
      };
    });
  };

  // Upsert a mark cell
  const saveMarkCell = (examSessionId, subjectId, paperNum,
                        studentId, field, value) => {
    const paperRec = (examSchedule || []).find(r =>
      r.examSessionId === examSessionId &&
      r.subjectId === subjectId &&
      Number(r.paperNumber) === Number(paperNum)
    );
    const totalMks = paperRec?.totalMarks || 100;
    const passMks  = paperRec?.passMarks  || 40;
    const now = new Date().toISOString();
    const existing = safeLS('pba_exam_results', []);
    const idx = (existing || []).findIndex(r =>
      r.examSessionId === examSessionId &&
      r.subjectId === subjectId &&
      Number(r.paperNumber) === Number(paperNum) &&
      r.studentId === studentId
    );
    let base = idx >= 0
      ? { ...(existing[idx]) }
      : {
          id: `result_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
          examSessionId,
          examSessionName: paperRec?.examSessionName || '',
          batchId:    paperRec?.batchId    || '',
          batchName:  paperRec?.batchName  || '',
          subjectId,
          subjectCode: paperRec?.subjectCode || '',
          subjectName: paperRec?.subjectName || '',
          paperNumber: Number(paperNum),
          paperName:   paperRec?.paperName || `Paper ${paperNum}`,
          totalMarks:  totalMks,
          passMarks:   passMks,
          studentId,
          studentName: '',
          rawMarks:    null,
          percentage:  null,
          grade:       '—',
          isPassed:    false,
          absent:      false,
          enteredAt:   now
        };
    base[field] = value;
    base.updatedAt = now;
    if (base.absent) {
      base.rawMarks = null; base.percentage = null;
      base.grade = 'ABS'; base.isPassed = false;
    } else if (base.rawMarks !== null && base.rawMarks !== '') {
      const n = parseFloat(base.rawMarks);
      base.percentage = Math.round((n / totalMks) * 1000) / 10;
      base.grade = calcGrade(base.percentage);
      base.isPassed = n >= passMks;
    }
    const updated = idx >= 0
      ? (existing || []).map((r, i) => i === idx ? base : r)
      : [...(existing || []), base];
    saveLS('pba_exam_results', updated);
    setExamResults(updated);
  };

  // CSV Import handlers for Lecturer Mark Sheets
  const handleMarksCSVUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (!text) return;
      const lines = text.split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        alert('CSV appears empty or has only a header row.');
        return;
      }

      // Detect delimiter: comma or tab
      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const headers   = lines[0].split(delimiter).map(h => h.trim());
      const dataRows  = lines.slice(1).map(l =>
        l.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''))
      );

      // Auto-detect columns: look for "name"/"reg" and "score"/"mark"
      let nameColGuess  = headers.findIndex(h =>
        /name|student|reg/i.test(h));
      let scoreColGuess = headers.findIndex(h =>
        /score|mark|result|total/i.test(h));
      if (nameColGuess  < 0) nameColGuess  = 0;
      if (scoreColGuess < 0) scoreColGuess = headers.length > 1 ? 1 : 0;

      setImportPreview({
        rows:      dataRows,
        colNames:  headers,
        nameCol:   nameColGuess,
        scoreCol:  scoreColGuess,
        mappedRows: []   // filled in step 3
      });
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    const inputEl = document.getElementById('marks-csv-input');
    if (inputEl) inputEl.value = '';
  };

  const computeMapping = (preview) => {
    if (!preview) return [];
    const { rows, nameCol, scoreCol } = preview;

    // Get enrolled students for the selected batch
    const batches  = safeLS('pba_batches', []);
    const examRec  = (safeLS('pba_exams', []) || []).find(e => e.id === selectedExamId) ||
                     (examSchedule || []).find(r => r.id === selectedExamId);
    const effectiveBatchId = selectedBatchId || examRec?.batchId || '';
    const batch    = (batches || []).find(b => b.id === effectiveBatchId || (selectedBatchName && b.name === selectedBatchName));

    const allStudents = safeLS('pba_students', []) || [];
    const fromStudentDb = allStudents.filter(s => s.batchId === effectiveBatchId || (batch && s.batch === batch.name));
    const studentMap = new Map();
    (batch?.students || []).forEach(s => {
      if (s) studentMap.set(s.id || s.regNo || s.name, s);
    });
    fromStudentDb.forEach(s => {
      if (s) studentMap.set(s.id || s.regNo || s.name, s);
    });
    const enrolled = studentMap.size > 0 ? Array.from(studentMap.values()) : (batch?.students || []);

    return rows.map(row => {
      const rawIdentifier = (row[nameCol] || '').trim();
      const rawScore      = parseFloat(row[scoreCol]);

      // Try matching by reg no first, then by name (case-insensitive)
      const matched = (enrolled || []).find(s =>
        (s.regNo && s.regNo.toLowerCase().trim() === rawIdentifier.toLowerCase()) ||
        (s.studentRegNo && s.studentRegNo.toLowerCase().trim() === rawIdentifier.toLowerCase()) ||
        (s.name  && s.name.toLowerCase().trim()  === rawIdentifier.toLowerCase()) ||
        (s.studentName && s.studentName.toLowerCase().trim() === rawIdentifier.toLowerCase())
      );

      return {
        csvValue:    rawIdentifier,
        rawScore:    isNaN(rawScore) ? null : rawScore,
        student:     matched || null,
        studentId:   matched?.id    || null,
        studentName: matched?.name  || matched?.studentName || null,
        studentRegNo: matched?.regNo || matched?.studentRegNo || '',
        status: matched
          ? (isNaN(rawScore) ? 'no-score' : 'matched')
          : 'unmatched'
      };
    });
  };

  const handleConfirmImport = (mappedRows, paperTotal) => {
    const existing = safeLS('pba_marks', []) || [];

    // Remove any old marks for this examId (re-import replaces them)
    const withoutOld = existing.filter(m => m.examId !== selectedExamId);

    const nowIso = new Date().toISOString();
    const newMarks = mappedRows
      .filter(r => r.status === 'matched' && r.rawScore !== null)
      .map(r => ({
        id:           (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `mk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        examId:       selectedExamId,
        studentId:    r.studentId,
        studentRegNo: r.studentRegNo || r.student?.regNo || r.student?.studentRegNo || '',
        rawScore:     r.rawScore,
        paperTotal:   paperTotal,
        percentage:   Math.round(r.rawScore / paperTotal * 1000) / 10,
        importedAt:   nowIso
      }));

    const updatedMarks = [...withoutOld, ...newMarks];
    saveLS('pba_marks', updatedMarks);
    setAllMarks(updatedMarks);

    // Sync pba_exam_results for legacy compatibility and Results & Rankings
    const targetExam = (safeLS('pba_exams', []) || []).find(e => e.id === selectedExamId) ||
                       (examSchedule || []).find(r => r.id === selectedExamId);
    const existingResults = safeLS('pba_exam_results', []) || [];
    let updatedResults = [...existingResults];

    newMarks.forEach(nm => {
      const matchedRow = mappedRows.find(r => r.studentId === nm.studentId);
      const studentName = matchedRow?.studentName || '';
      const pct = nm.percentage;
      const passMks = targetExam?.passMarks || 40;
      const resRecord = {
        id: `result_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        examId:          selectedExamId,
        examSessionId:   targetExam?.examSessionId || markExamSessionId || '',
        examSessionName: targetExam?.examSessionName || '',
        batchId:         targetExam?.batchId || selectedBatchId || '',
        batchName:       targetExam?.batchName || '',
        subjectId:       targetExam?.subjectId || markSubjectId || '',
        subjectCode:     targetExam?.subjectCode || '',
        subjectName:     targetExam?.subjectName || '',
        paperNumber:     Number(targetExam?.paperNumber || markPaperNumber || 1),
        paperName:       targetExam?.paperName || `Paper ${targetExam?.paperNumber || markPaperNumber || 1}`,
        totalMarks:      paperTotal,
        passMarks:       passMks,
        studentId:       nm.studentId,
        studentName:     studentName,
        rawMarks:        nm.rawScore,
        percentage:      pct,
        grade:           calcGrade(pct),
        isPassed:        nm.rawScore >= passMks,
        absent:          false,
        enteredAt:       nowIso,
        updatedAt:       nowIso
      };

      const resIdx = updatedResults.findIndex(r =>
        ((r.examSessionId && resRecord.examSessionId && r.examSessionId === resRecord.examSessionId &&
          r.subjectId === resRecord.subjectId &&
          Number(r.paperNumber) === Number(resRecord.paperNumber)) ||
         (r.examId && r.examId === selectedExamId)) &&
        r.studentId === resRecord.studentId
      );

      if (resIdx >= 0) {
        updatedResults[resIdx] = { ...updatedResults[resIdx], ...resRecord };
      } else {
        updatedResults.push(resRecord);
      }
    });

    saveLS('pba_exam_results', updatedResults);
    setExamResults(updatedResults);

    setLastImportSummary({
      count: newMarks.length,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    });
    setImportPreview(null);
  };

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
    setEditExamSessionId(null);
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

  // Calendar Sync Helpers
  const buildCalendarEvents = (examSessionId, sessionName, papers) => {
    return (papers || []).map(paper => ({
      id: `exam_paper_${examSessionId}_${paper.subjectId}_${paper.paperNumber}`,
      title: `${sessionName} — ${paper.subjectName} ${paper.paperName || ('Paper ' + paper.paperNumber)}`,
      date: paper.date || '',
      endDate: null,
      type: 'Exam',
      notes: `${paper.subjectCode || ''} · ${paper.startTime || ''}–${paper.endTime || ''}${paper.venue ? ' · ' + paper.venue : ''}`.trim(),
      sourceId: examSessionId,
      sourceType: 'exam_session'
    })).filter(e => e.date);
  };

  const syncExamToCalendar = (examSessionId, sessionName, newPapers) => {
    const existing = safeLS('pba_calendar_events', []);
    const cleaned = (existing || []).filter(
      e => !(e.sourceType === 'exam_session' && e.sourceId === examSessionId)
    );
    const newEvents = buildCalendarEvents(examSessionId, sessionName, newPapers);
    saveLS('pba_calendar_events', [...cleaned, ...newEvents]);
  };

  const deleteExamFromCalendar = (examSessionId) => {
    const existing = safeLS('pba_calendar_events', []);
    const cleaned = (existing || []).filter(
      e => !(e.sourceType === 'exam_session' && e.sourceId === examSessionId)
    );
    saveLS('pba_calendar_events', cleaned);
  };

  // Invigilator Modal Helpers
  const openInvigilatorModal = (paper) => {
    setInvigilatorPaper(paper);
    setInvigilatorList((paper.invigilators || []).map(inv => ({ ...inv })));
    setShowInvigilatorModal(true);
  };

  const getSuggestedLecturers = (paperDate) => {
    if (!paperDate) return [];
    const examDay = new Date(paperDate + 'T12:00:00')
      .toLocaleDateString('en-US', { weekday: 'long' });
    const timetable = safeLS('pba_timetable', []);
    const suggestedIds = new Set(
      (timetable || [])
        .filter(s => s.day === examDay && s.lecturerId)
        .map(s => s.lecturerId)
    );
    return (lecturers || []).filter(l => suggestedIds.has(l.id));
  };

  const saveInvigilators = () => {
    if (!invigilatorPaper) return;
    const toSave = (invigilatorList || []).filter(inv => inv.lecturerId);
    const schedule = safeLS('pba_exam_schedule', []);
    const updated = (schedule || []).map(r =>
      r.id === invigilatorPaper.id
        ? { ...r, invigilators: toSave }
        : r
    );
    saveLS('pba_exam_schedule', updated);
    setExamSchedule(updated);

    const allForSession = (updated || []).filter(
      r => r.examSessionId === invigilatorPaper.examSessionId
    );
    syncExamToCalendar(
      invigilatorPaper.examSessionId,
      allForSession[0]?.examSessionName || invigilatorPaper.examSessionName || 'Exam',
      allForSession
    );

    setShowInvigilatorModal(false);
    setInvigilatorPaper(null);
  };

  // Save new or edit exam session
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

    const sessionId = editExamSessionId
      ? editExamSessionId
      : `examSession_${Date.now()}`;
    const now = new Date().toISOString();
    const existing = safeLS('pba_exam_schedule', []);
    const newRecords = [];

    (scheduleForm.subjectRows || []).forEach(row => {
      (row.papers || []).forEach((paper, pIdx) => {
        if (!paper.date || !paper.startTime || !paper.endTime) return;
        const paperNum = paper.paperNumber || (pIdx + 1);
        const existingRec = editExamSessionId
          ? (existing || []).find(r =>
              r.examSessionId === editExamSessionId &&
              r.subjectId === row.subjectId &&
              Number(r.paperNumber) === Number(paperNum)
            )
          : null;

        newRecords.push({
          id: existingRec?.id || `examrec_${Date.now()}_${newRecords.length}_${Math.random().toString(36).slice(2, 6)}`,
          examSessionId: sessionId,
          examSessionName: scheduleForm.examSessionName.trim(),
          examType: scheduleForm.examType || 'Internal',
          batchId: scheduleForm.batchId,
          batchName: scheduleForm.batchName || '',
          sessionStartDate: scheduleForm.sessionStartDate,
          sessionEndDate: scheduleForm.sessionEndDate,
          periodStart: scheduleForm.sessionStartDate,
          periodEnd: scheduleForm.sessionEndDate,
          subjectId: row.subjectId,
          subjectCode: row.subjectCode || '',
          subjectName: row.subjectName || '',
          subject: row.subjectName || '',
          paperNumber: paperNum,
          paperName: (paper.paperName || '').trim() || `Paper ${paperNum}`,
          date: paper.date,
          startTime: paper.startTime,
          endTime: paper.endTime,
          totalMarks: Number(paper.totalMarks) || 100,
          passMarks: Number(paper.passMarks) || 40,
          venue: paper.venue || '',
          invigilatorId: existingRec?.invigilatorId || paper.invigilatorId || null,
          invigilatorName: existingRec?.invigilatorName || paper.invigilatorName || null,
          roomId: existingRec?.roomId || paper.roomId || null,
          roomName: existingRec?.roomName || paper.roomName || null,
          invigilators: existingRec?.invigilators || paper.invigilators || [],
          notes: paper.notes || '',
          status: 'Pending',
          createdAt: existingRec?.createdAt || now
        });
      });
    });

    if (newRecords.length === 0) {
      alert('Please fill in at least one paper with a date and time.'); return;
    }

    let updated;
    if (editExamSessionId) {
      // EDIT MODE: remove old records for this session, add new ones
      const withoutOld = (existing || []).filter(
        r => r.examSessionId !== editExamSessionId
      );
      updated = [...withoutOld, ...newRecords];
    } else {
      // CREATE MODE: just append
      updated = [...(existing || []), ...newRecords];
    }

    saveLS('pba_exam_schedule', updated);
    saveLS('pba_exams', updated);
    setExamSchedule(updated);

    // Sync to Calendar (pba_calendar_events)
    syncExamToCalendar(
      sessionId,
      scheduleForm.examSessionName.trim() || 'Exam',
      newRecords
    );

    setEditExamSessionId(null);
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

  // Confirm Import preview rows into markEntryState (legacy)
  const handleConfirmLegacyImport = () => {
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
        {activeTab === "schedule" && (currentUser.role === "Admin" || currentUser.role === "Lecturer") && (
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
          {/* CLASH RULES CONFIGURATION PANEL */}
          <div style={{
            border: '1px solid #FDE68A',
            borderRadius: '10px',
            marginBottom: '24px',
            overflow: 'hidden'
          }}>
            {/* Header — always visible */}
            <div
              onClick={() => setClashRulesOpen(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#FFFBEB',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#92400E' }}>
                  ⚠️ Subject Clash Rules
                </span>
                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#B45309' }}>
                  {(safeLS('pba_clash_rules', []) || []).length} rule
                  {(safeLS('pba_clash_rules', []) || []).length !== 1 ? 's' : ''} active
                </span>
              </div>
              <span style={{ fontSize: '18px', color: '#B45309' }}>
                {clashRulesOpen ? '▲' : '▼'}
              </span>
            </div>

            {/* Body — shown when open */}
            {clashRulesOpen && (
              <div style={{ padding: '16px 18px', background: '#ffffff' }}>
                <p style={{ fontSize: '13px', color: '#6B7280', marginTop: 0, marginBottom: '14px' }}>
                  Subjects paired here will never be scheduled at the same time.
                  Science–Commerce pairings are intentionally absent (they can overlap).
                </p>

                {/* Existing rules */}
                <div style={{ marginBottom: '14px' }}>
                  {(safeLS('pba_clash_rules', []) || []).map(rule => (
                    <div key={rule.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px',
                      border: '1px solid #FEE2E2',
                      borderRadius: '8px',
                      marginBottom: '6px',
                      background: '#FFF5F5'
                    }}>
                      <span style={{ fontSize: '13px', color: '#374151' }}>
                        <span style={{ color: '#EF4444', marginRight: '6px' }}>🔴</span>
                        <strong>{rule.subjectA}</strong>
                        <span style={{ margin: '0 8px', color: '#9CA3AF' }}>cannot clash with</span>
                        <strong>{rule.subjectB}</strong>
                      </span>
                      <button
                        onClick={() => handleRemoveClashRule(rule.id)}
                        style={{
                          padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                          border: '1px solid #FCA5A5', borderRadius: '6px',
                          background: '#FEF2F2', color: '#DC2626', cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(safeLS('pba_clash_rules', []) || []).length === 0 && (
                    <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center',
                                padding: '12px 0' }}>
                      No clash rules defined. All subjects can be scheduled simultaneously.
                    </p>
                  )}
                </div>

                {/* Add new rule */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center',
                              flexWrap: 'wrap' }}>
                  <select
                    value={newClashA}
                    onChange={e => setNewClashA(e.target.value)}
                    style={{ padding: '8px 10px', border: '1px solid #D1D5DB',
                             borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}
                  >
                    <option value="">Subject A</option>
                    {subjectOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>
                    cannot clash with
                  </span>
                  <select
                    value={newClashB}
                    onChange={e => setNewClashB(e.target.value)}
                    style={{ padding: '8px 10px', border: '1px solid #D1D5DB',
                             borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}
                  >
                    <option value="">Subject B</option>
                    {subjectOptions.filter(s => s !== newClashA).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddClashRule}
                    disabled={!newClashA || !newClashB || newClashA === newClashB}
                    style={{
                      padding: '8px 18px', fontSize: '13px', fontWeight: 700,
                      border: 'none', borderRadius: '8px', cursor: 'pointer',
                      background: (!newClashA || !newClashB || newClashA === newClashB)
                        ? '#D1D5DB' : '#2563EB',
                      color: '#ffffff'
                    }}
                  >
                    + Add Rule
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* EXPORT CONTROLS TOOLBAR */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px',
                        justifyContent:'flex-end', marginBottom:'16px',
                        flexWrap:'wrap' }}>

            {/* Optional: filter by date range */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px',
                          fontSize:'13px', color:'#374151' }}>
              <span>From</span>
              <input type="date" value={exportFrom}
                     onChange={e => setExportFrom(e.target.value)}
                     style={{ padding:'6px 10px', border:'1px solid #D1D5DB',
                              borderRadius:'6px', fontSize:'13px' }} />
              <span>to</span>
              <input type="date" value={exportTo}
                     onChange={e => setExportTo(e.target.value)}
                     style={{ padding:'6px 10px', border:'1px solid #D1D5DB',
                              borderRadius:'6px', fontSize:'13px' }} />
            </div>

            {/* Copy for WhatsApp */}
            <button onClick={handleCopyWhatsApp}
              style={{ padding:'9px 18px', border:'1px solid #D1D5DB',
                       borderRadius:'8px', background:'#fff',
                       fontSize:'13px', fontWeight:600, color:'#374151',
                       cursor:'pointer' }}>
              📋 Copy Schedule
            </button>

            {/* Export PDF */}
            <button onClick={handleExportPDF}
              style={{ padding:'9px 20px', border:'none', borderRadius:'8px',
                       background:'#2563EB', color:'#fff',
                       fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
              📄 Export PDF
            </button>
          </div>

          <div id="exam-timetable-print" style={{ display: 'none' }} />

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
                  {/* Edit + Delete buttons — top-right of session header */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

                    {/* Papers done badge — keep existing */}
                    <span style={{
                      background: 'rgba(255,255,255,0.2)', borderRadius: '20px',
                      padding: '4px 12px', fontSize: '11px', color: 'white', fontWeight: 700
                    }}>
                      {donePapers}/{totalPapers} papers done
                    </span>

                    {/* Edit Session button */}
                    <button
                      onClick={() => {
                        // Load this session's records into the new-exam modal form
                        const sessionRecs = (examSchedule || []).filter(
                          r => r.examSessionId === group.examSessionId
                        );
                        if (sessionRecs.length === 0) return;
                        const first = sessionRecs[0];

                        // Rebuild the subjectRows structure the modal uses
                        const subjectMap = {};
                        (sessionRecs || []).forEach(r => {
                          if (!subjectMap[r.subjectId]) {
                            subjectMap[r.subjectId] = {
                              subjectId:   r.subjectId,
                              subjectCode: r.subjectCode || '',
                              subjectName: r.subjectName || '',
                              papers: []
                            };
                          }
                          subjectMap[r.subjectId].papers.push({
                            paperNumber: r.paperNumber,
                            paperName:   r.paperName   || '',
                            date:        r.date        || '',
                            startTime:   r.startTime   || '',
                            endTime:     r.endTime     || '',
                            totalMarks:  r.totalMarks  || 100,
                            passMarks:   r.passMarks   || 40,
                            venue:       r.venue       || ''
                          });
                        });
                        const loadedSubjectRows = Object.values(subjectMap).map(sub => ({
                          ...sub,
                          papers: (sub.papers || []).sort((a,b) =>
                            (a.paperNumber||0) - (b.paperNumber||0))
                        }));

                        setBatches(safeLS('pba_batches', []));
                        setScheduleForm({
                          examSessionName:  first.examSessionName || '',
                          batchId:          first.batchId         || '',
                          batchName:        first.batchName       || '',
                          examType:         first.examType        || 'Internal',
                          sessionStartDate: first.sessionStartDate || first.periodStart || '',
                          sessionEndDate:   first.sessionEndDate   || first.periodEnd   || '',
                          subjectRows:      loadedSubjectRows
                        });
                        setSelectedSubjectIds(Object.keys(subjectMap));
                        setEditExamSessionId(group.examSessionId);
                        setShowScheduleModal(true);
                      }}
                      style={{ padding: '5px 12px', borderRadius: '7px',
                        border: '1px solid rgba(255,255,255,0.4)',
                        background: 'rgba(255,255,255,0.15)',
                        color: 'white', fontSize: '12px', fontWeight: 700,
                        cursor: 'pointer' }}>
                      ✏️ Edit
                    </button>

                    {/* Delete Session button */}
                    <button
                      onClick={() => {
                        setDeleteSessionTarget({
                          examSessionId:   group.examSessionId,
                          examSessionName: group.examSessionName
                        });
                        setShowDeleteSession(true);
                      }}
                      style={{ padding: '5px 12px', borderRadius: '7px',
                        border: '1px solid rgba(255,100,100,0.5)',
                        background: 'rgba(220,38,38,0.2)',
                        color: '#FCA5A5', fontSize: '12px', fontWeight: 700,
                        cursor: 'pointer' }}>
                      🗑️ Delete
                    </button>

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
                            borderRadius: '10px', padding: '10px 14px', minWidth: '185px',
                            position: 'relative'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between', marginBottom: '6px', paddingRight: '55px', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1A202C' }}>
                                {paper.paperName || `Paper ${paper.paperNumber || 1}`}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {examStatus(paper) === 'complete' && (
                                  <span style={{ background:'#D1FAE5', color:'#065F46',
                                                 borderRadius:'999px', padding:'2px 8px',
                                                 fontSize:'11px', fontWeight:600 }}>✓ Ready</span>
                                )}
                                {examStatus(paper) === 'partial' && (
                                  <span style={{ background:'#FEF3C7', color:'#92400E',
                                                 borderRadius:'999px', padding:'2px 8px',
                                                 fontSize:'11px', fontWeight:600 }}>⏳ Partial</span>
                                )}
                                {examStatus(paper) === 'pending' && (
                                  <span style={{ background:'#F3F4F6', color:'#6B7280',
                                                 borderRadius:'999px', padding:'2px 8px',
                                                 fontSize:'11px', fontWeight:600 }}>— Pending</span>
                                )}
                                {clashedExamIds.has(paper.id) && (
                                  <span style={{
                                    background: '#FEF3C7', color: '#92400E',
                                    border: '1px solid #F59E0B',
                                    borderRadius: '999px',
                                    padding: '2px 8px',
                                    fontSize: '11px',
                                    fontWeight: 700
                                  }}>
                                    ⚠️ Clash
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Edit + Delete icons — top-right corner of paper card */}
                            <div style={{ position: 'absolute', top: '8px', right: '8px',
                              display: 'flex', gap: '4px' }}>

                              {/* Edit paper */}
                              <button
                                onClick={() => {
                                  setEditPaperRecord(paper); // the full schedule record
                                  setEditPaperForm({
                                    paperName:  paper.paperName  || '',
                                    date:       paper.date       || '',
                                    startTime:  paper.startTime  || '',
                                    endTime:    paper.endTime    || '',
                                    totalMarks: paper.totalMarks || 100,
                                    passMarks:  paper.passMarks  || 40,
                                    venue:      paper.venue      || ''
                                  });
                                  setShowEditPaper(true);
                                }}
                                title="Edit paper"
                                style={{ width: '24px', height: '24px', borderRadius: '5px',
                                  border: '1px solid #E3E6EA', background: 'white',
                                  cursor: 'pointer', fontSize: '12px', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center' }}>
                                ✏️
                              </button>

                              {/* Delete paper */}
                              <button
                                onClick={() => {
                                  setDeletePaperTarget(paper);
                                  setShowDeletePaper(true);
                                }}
                                title="Delete paper"
                                style={{ width: '24px', height: '24px', borderRadius: '5px',
                                  border: '1px solid #FCA5A5', background: '#FEF2F2',
                                  cursor: 'pointer', fontSize: '12px', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  color: '#DC2626' }}>
                                ×
                              </button>

                            </div>

                            <div style={{ fontSize: '11px', color: '#6B7280' }}>📅 {paper.date}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>
                              🕐 {paper.startTime}–{paper.endTime}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>
                              🎯 Total Marks: <strong>{paper.totalMarks || 100}</strong> (Pass: {paper.passMarks || 40})
                            </div>
                            {paper.venue ? (
                              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                📍 {paper.venue}
                              </div>
                            ) : null}

                            {/* Inline Invigilator & Room Assignment */}
                            <div style={{
                              marginTop: '8px',
                              paddingTop: '8px',
                              borderTop: '1px dashed #E5E7EB',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}>
                              <select
                                value={paper.invigilatorId || ''}
                                onChange={e => handlePatchExam(paper.id, {
                                  invigilatorId:   e.target.value,
                                  invigilatorName: (safeLS('pba_lecturers', []) || lecturers || [])
                                                     .find(l => l.id === e.target.value)?.name || ''
                                })}
                                style={{
                                  padding: '6px 8px',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  color: paper.invigilatorId ? '#111827' : '#9CA3AF',
                                  background: '#fff',
                                  width: '100%',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="">— Invigilator —</option>
                                {(safeLS('pba_lecturers', []) || lecturers || []).map(l => (
                                  <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                              </select>

                              <select
                                value={paper.roomId || ''}
                                onChange={e => {
                                  const rm = (safeLS('pba_classrooms', []) || classrooms || [])
                                              .find(r => r.id === e.target.value);
                                  handlePatchExam(paper.id, {
                                    roomId:   e.target.value,
                                    roomName: rm?.name || '',
                                    venue:    rm?.name || paper.venue || ''
                                  });
                                }}
                                style={{
                                  padding: '6px 8px',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  color: paper.roomId ? '#111827' : '#9CA3AF',
                                  background: '#fff',
                                  width: '100%',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="">— Room —</option>
                                {(safeLS('pba_classrooms', []) || classrooms || []).map(r => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}{r.capacity ? ` (${r.capacity})` : ''}
                                  </option>
                                ))}
                              </select>
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
      {activeTab === "mark-entry" && (() => {
        // Group pba_exam_schedule records by examSessionId
        const examSessionGroups = (() => {
          const map = {};
          (examSchedule || []).forEach(r => {
            if (!r.examSessionId) return;
            if (!map[r.examSessionId]) {
              map[r.examSessionId] = {
                examSessionId:   r.examSessionId,
                examSessionName: r.examSessionName || r.examSessionId,
                batchId:         r.batchId,
                batchName:       r.batchName || ''
              };
            }
          });
          return Object.values(map);
        })();

        // Subjects for the selected exam session
        const markSubjects = (() => {
          if (!markExamSessionId) return [];
          const map = {};
          (examSchedule || [])
            .filter(r => r.examSessionId === markExamSessionId)
            .forEach(r => {
              if (!map[r.subjectId]) {
                map[r.subjectId] = {
                  subjectId:   r.subjectId,
                  subjectCode: r.subjectCode || '',
                  subjectName: r.subjectName || r.subjectId
                };
              }
            });
          return Object.values(map);
        })();

        // Papers for the selected subject
        const markPapers = (() => {
          if (!markExamSessionId || !markSubjectId) return [];
          return (examSchedule || [])
            .filter(r =>
              r.examSessionId === markExamSessionId &&
              r.subjectId === markSubjectId
            )
            .sort((a, b) => (a.paperNumber || 0) - (b.paperNumber || 0));
        })();

        // Active paper record (for totalMarks, passMarks, date, etc.)
        const activePaperRec = (!markExamSessionId || !markSubjectId || !markPaperNumber)
          ? null
          : (examSchedule || []).find(r =>
              r.examSessionId === markExamSessionId &&
              r.subjectId === markSubjectId &&
              Number(r.paperNumber) === Number(markPaperNumber)
            );

        // Active batch (comes from the exam session group)
        const activeSessionGroup = (examSessionGroups || []).find(
          g => g.examSessionId === markExamSessionId
        );

        // Build the mark sheet (only when all three are selected)
        const markSheet = (markExamSessionId && markSubjectId && markPaperNumber && activePaperRec)
          ? buildMarkSheet(
              markExamSessionId,
              activeSessionGroup?.batchId || '',
              markSubjectId,
              Number(markPaperNumber)
            )
          : [];

        return (
          <div>
            {/* SELECTOR ROW */}
            <div style={{
              display: 'flex', gap: '12px', flexWrap: 'wrap',
              marginBottom: '18px', alignItems: 'flex-end'
            }}>
              {/* Batch selector */}
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'block', marginBottom: '6px' }}>
                  Batch
                </label>
                <select
                  value={selectedBatchId}
                  onChange={e => {
                    const bId = e.target.value;
                    setSelectedBatchId(bId);
                    const bObj = (batches || []).find(b => b.id === bId);
                    if (bObj) setSelectedBatchName(bObj.name);
                    setMarkExamSessionId('');
                    setMarkSubjectId('');
                    setMarkPaperNumber('');
                    setSelectedExamId('');
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', fontSize: '13px',
                    background: 'white', color: '#1A202C' }}>
                  <option value="">— All / Select Batch —</option>
                  {(batches || safeLS('pba_batches', []) || []).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name || b.batchName || b.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Session selector */}
              <div style={{ flex: '1 1 240px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'block', marginBottom: '6px' }}>
                  Examination Session
                </label>
                <select
                  value={markExamSessionId}
                  onChange={e => {
                    const sId = e.target.value;
                    setMarkExamSessionId(sId);
                    setMarkSubjectId('');
                    setMarkPaperNumber('');
                    setSelectedExamId('');
                    const grp = (examSessionGroups || []).find(g => g.examSessionId === sId);
                    if (grp?.batchId && !selectedBatchId) {
                      setSelectedBatchId(grp.batchId);
                      if (grp.batchName) setSelectedBatchName(grp.batchName);
                    }
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', fontSize: '13px',
                    background: 'white', color: '#1A202C' }}>
                  <option value="">— Select Session —</option>
                  {(examSessionGroups || [])
                    .filter(g => !selectedBatchId || g.batchId === selectedBatchId)
                    .map(g => (
                    <option key={g.examSessionId} value={g.examSessionId}>
                      {g.examSessionName}{g.batchName ? ` — ${g.batchName}` : ''}
                    </option>
                  ))}
                </select>
                {(examSessionGroups || []).length === 0 && (
                  <p style={{ fontSize: '11px', color: '#D97706', marginTop: '5px', fontWeight: 600 }}>
                    ⚠ No exam sessions found. Schedule exams first in the Exam Schedule tab.
                  </p>
                )}
              </div>

              {/* Subject selector */}
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'block', marginBottom: '6px' }}>
                  Subject
                </label>
                <select
                  value={markSubjectId}
                  onChange={e => {
                    setMarkSubjectId(e.target.value);
                    setMarkPaperNumber('');
                    setSelectedExamId('');
                  }}
                  disabled={!markExamSessionId}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', fontSize: '13px',
                    background: !markExamSessionId ? '#F9FAFB' : 'white',
                    color: '#1A202C' }}>
                  <option value="">— Select Subject —</option>
                  {(markSubjects || []).map(s => (
                    <option key={s.subjectId} value={s.subjectId}>
                      {s.subjectCode ? `${s.subjectCode} — ` : ''}{s.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paper selector */}
              <div style={{ flex: '1 1 160px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'block', marginBottom: '6px' }}>
                  Paper / Exam
                </label>
                <select
                  value={markPaperNumber}
                  onChange={e => {
                    const pNum = e.target.value;
                    setMarkPaperNumber(pNum);
                    const targetRec = (examSchedule || []).find(r =>
                      r.examSessionId === markExamSessionId &&
                      r.subjectId === markSubjectId &&
                      Number(r.paperNumber) === Number(pNum)
                    );
                    if (targetRec) {
                      setSelectedExamId(targetRec.id);
                      if (targetRec.batchId) setSelectedBatchId(targetRec.batchId);
                      if (targetRec.batchName) setSelectedBatchName(targetRec.batchName);
                    } else {
                      setSelectedExamId('');
                    }
                  }}
                  disabled={!markSubjectId}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', fontSize: '13px',
                    background: !markSubjectId ? '#F9FAFB' : 'white',
                    color: '#1A202C' }}>
                  <option value="">— Select Paper —</option>
                  {(markPapers || []).map(p => (
                    <option key={p.paperNumber} value={p.paperNumber}>
                      {p.paperName || `Paper ${p.paperNumber}`}
                      {p.totalMarks ? ` (/${p.totalMarks})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Paper meta — show date/time/venue when paper is selected */}
            {activePaperRec && (
              <div style={{ marginBottom: '14px', padding: '10px 14px',
                background: '#F0F4FF', border: '1px solid #C7D2FE',
                borderRadius: '8px', fontSize: '12px', color: '#374151' }}>
                📅 <strong>{activePaperRec.date || '—'}</strong>
                &nbsp;·&nbsp;
                🕐 {activePaperRec.startTime || '—'}–{activePaperRec.endTime || '—'}
                &nbsp;·&nbsp;
                Max marks: <strong>{activePaperRec.totalMarks || '—'}</strong>
                &nbsp;·&nbsp;
                Pass mark: <strong>{activePaperRec.passMarks || '—'}</strong>
                {activePaperRec.venue
                  ? <>&nbsp;·&nbsp;📍 {activePaperRec.venue}</>
                  : null}
              </div>
            )}

            {/* Progress bar — only show when all three selectors are set */}
            {markExamSessionId && markSubjectId && markPaperNumber && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  fontSize: '12px', color: '#374151', fontWeight: 600,
                  marginBottom: '6px' }}>
                  <span>Mark Entry Progress</span>
                  <span>
                    {(markSheet || []).filter(r => r.rawMarks !== null || r.absent).length}
                    /{(markSheet || []).length} students completed
                  </span>
                </div>
                <div style={{ height: '8px', background: '#E5E7EB', borderRadius: '4px',
                  overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '4px',
                    background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                    width: (markSheet || []).length > 0
                      ? `${Math.round(
                          (markSheet || []).filter(r => r.rawMarks !== null || r.absent).length
                          / (markSheet || []).length * 100
                        )}%`
                      : '0%',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            )}

            {/* Action buttons row (Import + Download Template) */}
            {selectedExamId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px',
                            marginBottom: '16px', flexWrap: 'wrap' }}>

                <button
                  onClick={() => {
                    const inputEl = document.getElementById('marks-csv-input');
                    if (inputEl) inputEl.click();
                  }}
                  style={{
                    padding: '9px 20px',
                    border: '1px solid #2563EB',
                    borderRadius: '8px',
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  📥 Import Marks (CSV)
                </button>

                <button
                  onClick={() => {
                    if (!activePaperRec || !activeSessionGroup?.batchId) return;
                    const batches = safeLS('pba_batches', []) || [];
                    const batch = batches.find(b => b.id === activeSessionGroup.batchId);
                    const fromStudentDb = (safeLS('pba_students', []) || []).filter(s => s.batchId === activeSessionGroup.batchId || (batch && s.batch === batch.name));
                    const sMap = new Map();
                    (batch?.students || []).forEach(s => { if (s) sMap.set(s.id || s.regNo || s.name, s); });
                    fromStudentDb.forEach(s => { if (s) sMap.set(s.id || s.regNo || s.name, s); });
                    const students = Array.from(sMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    const paperLabel = activePaperRec?.paperName || `Paper_${markPaperNumber}`;
                    const header = 'Student Name,Reg No,Raw Marks';
                    const rows   = (students || []).map(s => `"${s.name || ''}","${s.regNo || s.studentRegNo || ''}",`);
                    const csv    = [header, ...rows].join('\n');
                    const blob   = new Blob([csv], { type: 'text/csv' });
                    const url    = URL.createObjectURL(blob);
                    const a      = document.createElement('a');
                    a.href = url; a.download = `marks_template_${paperLabel}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                  }}
                  style={{ padding: '8px 16px', borderRadius: '8px',
                    border: '1px solid #059669',
                    background: '#ECFDF5',
                    color: '#059669',
                    fontSize: '13px', fontWeight: 700,
                    cursor: 'pointer' }}>
                  ↓ Download CSV Template
                </button>

                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                  Upload the lecturer's mark sheet. Columns: student name or
                  reg no, then raw score.
                </span>

                {/* Hidden file input */}
                <input
                  id="marks-csv-input"
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={e => handleMarksCSVUpload(e.target.files?.[0])}
                />
              </div>
            )}

            {/* Summary banner after import */}
            {selectedExamId && (() => {
              const currentExamMarks = (allMarks || safeLS('pba_marks', []) || []).filter(m => m.examId === selectedExamId);
              if (lastImportSummary || currentExamMarks.length > 0) {
                const count = lastImportSummary?.count || currentExamMarks.length;
                const latestDate = lastImportSummary?.date || (currentExamMarks[0]?.importedAt
                  ? new Date(currentExamMarks[0].importedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
                return (
                  <div style={{
                    padding: '10px 16px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '8px',
                    color: '#065F46',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '15px' }}>✓</span>
                    <span>
                      Marks imported for {count} student{count !== 1 ? 's' : ''} on {latestDate}. Results and report cards are now available.
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            {/* STUDENT MARK TABLE */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA' }}>
                      <th style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid #E3E6EA', textAlign: 'left', width: '50px' }}>#</th>
                      <th style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid #E3E6EA', textAlign: 'left' }}>STUDENT NAME</th>
                      <th style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid #E3E6EA', textAlign: 'left' }}>STUDENT ID</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid #E3E6EA', width: '160px' }}>
                        {(activePaperRec?.subjectCode || activePaperRec?.subjectName || 'MARKS')} /{activePaperRec?.totalMarks || 100}
                        <div style={{ fontSize: '9px', color: '#6B7280', fontWeight: 500, textTransform: 'none', marginTop: '2px' }}>
                          Max: {activePaperRec?.totalMarks || 100}
                        </div>
                      </th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid #E3E6EA', width: '80px' }}>%</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid #E3E6EA', width: '90px' }}>ABSENT</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid #E3E6EA', width: '80px' }}>GRADE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(markExamSessionId && markSubjectId && markPaperNumber)
                      ? (markSheet || []).length > 0
                        ? (markSheet || []).map((row, idx) => (
                            <tr key={row.studentId}
                              style={{
                                borderBottom: '1px solid #F1F5F9',
                                background: row.absent     ? '#FFFBEB'
                                  : row.isPassed           ? '#F0FDF4'
                                  : row.rawMarks !== null  ? '#FFF5F5'
                                  : idx % 2 === 0         ? 'white' : '#FAFAFA'
                              }}>
                              {/* # */}
                              <td style={{ padding: '8px 14px', fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>{idx + 1}</td>
                              {/* NAME */}
                              <td style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: '#1A202C' }}>{row.studentName}</td>
                              {/* ID / REG NO */}
                              <td style={{ padding: '8px 14px', fontSize: '12px', color: '#6B7280' }}>{row.studentRegNo || '—'}</td>
                              {/* MARKS cell */}
                              <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                {row.rawMarks !== null && row.rawMarks !== undefined ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                                      {row.rawMarks}
                                      <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400, marginLeft: '3px' }}>
                                        /{activePaperRec?.totalMarks || row.totalMarks || 100}
                                      </span>
                                    </span>
                                    {row.percentage !== null && row.percentage !== undefined && (
                                      <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', fontWeight: 600 }}>
                                        {row.percentage}%
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: '#9CA3AF', fontSize: '14px', fontWeight: 500 }}>—</span>
                                )}
                              </td>
                              {/* PERCENTAGE */}
                              <td style={{ padding: '8px 14px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: row.absent ? '#9CA3AF' : row.percentage !== null ? '#059669' : '#D1D5DB' }}>
                                {row.absent ? 'ABS' : row.percentage !== null && row.percentage !== undefined ? `${row.percentage}%` : '—'}
                              </td>
                              {/* ABSENT */}
                              <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                <input type="checkbox"
                                  checked={row.absent || false}
                                  onChange={e => {
                                    saveMarkCell(
                                      markExamSessionId, markSubjectId,
                                      Number(markPaperNumber), row.studentId, 'absent', e.target.checked
                                    );
                                  }}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#D97706' }}
                                />
                              </td>
                              {/* GRADE */}
                              <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block', padding: '3px 10px',
                                  borderRadius: '12px', fontSize: '12px', fontWeight: 800,
                                  background:
                                    row.grade === 'A*' || row.grade === 'A' ? '#D1FAE5'
                                    : row.grade === 'B' || row.grade === 'C' ? '#DBEAFE'
                                    : row.grade === 'D' || row.grade === 'E' ? '#FEF3C7'
                                    : row.grade === 'ABS' ? '#F3F4F6'
                                    : '#FEE2E2',
                                  color: gradeColor(row.grade)
                                }}>
                                  {row.grade || '—'}
                                </span>
                              </td>
                            </tr>
                          ))
                        : (
                          <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                            No students enrolled in this batch yet.
                          </td></tr>
                        )
                      : (
                        <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                          Select a session, subject, and paper above to load the mark sheet.
                        </td></tr>
                      )
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* SAVE ALL MARKS BUTTON */}
            <button
              onClick={() => {
                setMarkToast(true);
                setTimeout(() => setMarkToast(false), 2500);
              }}
              disabled={!markPaperNumber || (markSheet || []).length === 0}
              style={{
                width: '100%',
                padding: '12px',
                background: (!markPaperNumber || (markSheet || []).length === 0)
                  ? '#CBD5E0'
                  : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: (!markPaperNumber || (markSheet || []).length === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              ✓ Save All Marks to Registry
            </button>

            {/* Save Confirmation Toast */}
            {markToast && (
              <div style={{
                position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                background: '#D1FAE5', border: '1px solid #6EE7B7',
                borderRadius: '12px', padding: '14px 18px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', color: '#065F46'
              }}>
                <div style={{ fontWeight: 800, fontSize: '13px' }}>✓ Marks saved to registry</div>
                <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>All cell updates are auto-saved to pba_exam_results</div>
              </div>
            )}

            {/* IMPORT PREVIEW MODAL */}
            {importPreview && (() => {
              const mappedRows = computeMapping(importPreview);
              const matched    = mappedRows.filter(r => r.status === 'matched');
              const unmatched  = mappedRows.filter(r => r.status === 'unmatched');
              const allExamsList = safeLS('pba_exams', []) || [];
              const selectedExam = (allExamsList || []).find(e => e.id === selectedExamId) || activePaperRec;
              const paperTotal   = selectedExam?.totalMarks || 100;
              const examTitle    = selectedExam?.subject || selectedExam?.subjectName || selectedExam?.paperName || 'Exam';

              return (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 9999
                }}>
                  <div style={{
                    background: '#fff', borderRadius: '12px',
                    padding: '28px 32px', width: '640px',
                    maxWidth: '92vw', maxHeight: '85vh',
                    overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                  }}>

                    {/* Header */}
                    <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827',
                                 marginTop: 0, marginBottom: '4px' }}>
                      Import Marks — {examTitle}
                    </h2>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                      Paper total: <strong>/{paperTotal}</strong> &nbsp;·&nbsp;
                      {matched.length} matched &nbsp;·&nbsp;
                      {unmatched.length > 0 && (
                        <span style={{ color: '#DC2626' }}>
                          {unmatched.length} unmatched
                        </span>
                      )}
                    </p>

                    {/* Column selectors */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px',
                                  flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600,
                                         color: '#6B7280', display: 'block',
                                         marginBottom: '4px' }}>
                          STUDENT COLUMN
                        </label>
                        <select
                          value={importPreview.nameCol}
                          onChange={e => setImportPreview(p => ({
                            ...p, nameCol: parseInt(e.target.value)
                          }))}
                          style={{ padding: '6px 10px', border: '1px solid #D1D5DB',
                                   borderRadius: '6px', fontSize: '13px' }}
                        >
                          {importPreview.colNames.map((c, i) => (
                            <option key={i} value={i}>{c || `Column ${i+1}`}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600,
                                         color: '#6B7280', display: 'block',
                                         marginBottom: '4px' }}>
                          SCORE COLUMN
                        </label>
                        <select
                          value={importPreview.scoreCol}
                          onChange={e => setImportPreview(p => ({
                            ...p, scoreCol: parseInt(e.target.value)
                          }))}
                          style={{ padding: '6px 10px', border: '1px solid #D1D5DB',
                                   borderRadius: '6px', fontSize: '13px' }}
                        >
                          {importPreview.colNames.map((c, i) => (
                            <option key={i} value={i}>{c || `Column ${i+1}`}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Preview rows */}
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px',
                                  overflow: 'hidden', marginBottom: '20px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse',
                                       fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#F9FAFB' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left',
                                          fontWeight: 600, color: '#374151',
                                          borderBottom: '1px solid #E5E7EB' }}>
                              CSV Value
                            </th>
                            <th style={{ padding: '8px 12px', textAlign: 'left',
                                          fontWeight: 600, color: '#374151',
                                          borderBottom: '1px solid #E5E7EB' }}>
                              Matched Student
                            </th>
                            <th style={{ padding: '8px 12px', textAlign: 'center',
                                          fontWeight: 600, color: '#374151',
                                          borderBottom: '1px solid #E5E7EB' }}>
                              Raw Score
                            </th>
                            <th style={{ padding: '8px 12px', textAlign: 'center',
                                          fontWeight: 600, color: '#374151',
                                          borderBottom: '1px solid #E5E7EB' }}>
                              %
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {mappedRows.map((row, i) => (
                            <tr key={i} style={{
                              background: row.status === 'unmatched'
                                ? '#FEF2F2' : '#ffffff',
                              borderBottom: '1px solid #F3F4F6'
                            }}>
                              <td style={{ padding: '8px 12px', color: '#374151' }}>
                                {row.csvValue || '—'}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                {row.status === 'matched'
                                  ? <span style={{ color: '#065F46', fontWeight: 600 }}>
                                      ✓ {row.studentName}
                                    </span>
                                  : <span style={{ color: '#DC2626', fontSize: '12px' }}>
                                      ✗ No match
                                    </span>
                                }
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center',
                                            fontWeight: 600, color: '#111827' }}>
                                {row.rawScore !== null ? row.rawScore : '—'}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center',
                                            color: '#6B7280', fontSize: '12px' }}>
                                {row.rawScore !== null
                                  ? `${Math.round(row.rawScore / paperTotal * 1000) / 10}%`
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {unmatched.length > 0 && (
                      <p style={{ fontSize: '12px', color: '#B45309',
                                   background: '#FEF3C7', borderRadius: '6px',
                                   padding: '8px 12px', marginBottom: '16px' }}>
                        ⚠️ {unmatched.length} row(s) could not be matched to enrolled
                        students. They will be skipped. Check that names or reg numbers
                        in the CSV match those in the system.
                      </p>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        onClick={() => setImportPreview(null)}
                        style={{ padding: '9px 20px', border: '1px solid #D1D5DB',
                                  borderRadius: '8px', background: '#fff',
                                  fontSize: '13px', fontWeight: 600,
                                  color: '#374151', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmImport(mappedRows, paperTotal)}
                        disabled={matched.length === 0}
                        style={{
                          padding: '9px 24px', border: 'none', borderRadius: '8px',
                          background: matched.length > 0 ? '#2563EB' : '#D1D5DB',
                          color: '#fff', fontSize: '13px', fontWeight: 700,
                          cursor: matched.length > 0 ? 'pointer' : 'not-allowed'
                        }}
                      >
                        ✓ Import {matched.length} Mark{matched.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

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
            const scoreVal = r?.rawMarks !== undefined && r?.rawMarks !== null
              ? r.rawMarks
              : (r?.score !== undefined ? r.score : (r?.marksObtained !== undefined ? r.marksObtained : r?.marks));
            if (r && !isAbs && scoreVal !== null && scoreVal !== undefined && scoreVal !== '') {
              totalScore += Number(scoreVal);
            }
            totalMax += Number(r?.totalMarks || col.maxScore || 100);
          });
          const overallPercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100 * 10) / 10 : null;
          return { student, totalScore, totalMax, overallPercent, pct: overallPercent !== null ? Math.round(overallPercent) : 0 };
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
                  {editExamSessionId ? '✏️ Edit Exam Session' : '+ Schedule New Exam'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
                  Name session → select batch → set period → pick subjects → schedule papers
                </div>
              </div>
              <button onClick={() => { setShowScheduleModal(false); setEditExamSessionId(null); }}
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

                            {/* Clash detection banner */}
                            {(() => {
                              const clashWarnings = detectClashes(
                                row.subjectName || row.subjectCode,
                                paper.date,
                                paper.startTime,
                                paper.endTime,
                                paper.id || null
                              );
                              if (clashWarnings.length === 0) return null;
                              return (
                                <div style={{
                                  background: '#FEF3C7',
                                  border: '1px solid #F59E0B',
                                  borderRadius: '8px',
                                  padding: '12px 16px',
                                  marginBottom: '12px'
                                }}>
                                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400E',
                                                marginBottom: '6px' }}>
                                    ⚠️ Subject Clash Detected
                                  </div>
                                  {clashWarnings.map((clash, i) => (
                                    <div key={i} style={{ fontSize: '13px', color: '#78350F', marginBottom: '2px' }}>
                                      • <strong>{row.subjectName || row.subjectCode}</strong> clashes with{' '}
                                      <strong>{clash.subject || clash.subjectName}</strong>
                                      {clash.batchName ? ` (${clash.batchName})` : ''}{' '}
                                      at {clash.startTime}–{clash.endTime}
                                    </div>
                                  ))}
                                  <div style={{ fontSize: '12px', color: '#B45309', marginTop: '8px' }}>
                                    Students taking both subjects will face simultaneous exams.
                                    Adjust the date or time to resolve.
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Total Marks */}
                            <div style={{ marginBottom: '16px' }}>
                              <label style={{
                                display: 'block', fontSize: '11px', fontWeight: 600,
                                color: '#6B7280', letterSpacing: '0.05em', marginBottom: '6px'
                              }}>
                                TOTAL MARKS FOR THIS PAPER
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                  type="number"
                                  min="1"
                                  max="1000"
                                  value={paper.totalMarks ?? 100}
                                  onChange={e => {
                                    const updatedRows = (scheduleForm.subjectRows || []).map((r, ri) => {
                                      if (ri !== rowIdx) return r;
                                      return { ...r, papers: (r.papers || []).map((p, pi) =>
                                        pi === pIdx ? { ...p, totalMarks: parseInt(e.target.value, 10) || 100 } : p) };
                                    });
                                    setScheduleForm(prev => ({ ...prev, subjectRows: updatedRows }));
                                  }}
                                  style={{
                                    width: '100px',
                                    padding: '8px 12px',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#111827'
                                  }}
                                />
                                <span style={{ fontSize: '13px', color: '#6B7280' }}>
                                  marks  (default: 100 — change if this paper is out of 80, 60, etc.)
                                </span>
                              </div>
                            </div>

                            {/* Paper fields: DATE | START | END | VENUE */}
                            <div style={{ display: 'grid',
                              gridTemplateColumns: '160px 100px 100px 1fr',
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
              <button onClick={() => { setShowScheduleModal(false); setEditExamSessionId(null); }}
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
                {editExamSessionId ? 'Save Changes' : 'Schedule Exam Session'}
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
                onClick={handleConfirmLegacyImport}
                style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,108,176,0.30)' }}
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SESSION CONFIRMATION MODAL */}
      {showDeleteSession && deleteSessionTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 3000, display: 'flex', alignItems: 'center',
          justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '14px', width: '420px',
            padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <div style={{ fontWeight: 800, fontSize: '17px', color: '#1A202C',
              marginBottom: '8px' }}>
              Delete "{deleteSessionTarget.examSessionName}"?
            </div>
            <div style={{ padding: '12px 14px', background: '#FEF2F2',
              border: '1px solid #FCA5A5', borderRadius: '8px',
              fontSize: '12px', color: '#DC2626', fontWeight: 600,
              marginBottom: '20px', textAlign: 'left' }}>
              ⚠ This will permanently delete:<br/>
              • All paper schedules for this exam session<br/>
              • All mark entries (results) for this exam session<br/>
              This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowDeleteSession(false);
                  setDeleteSessionTarget(null);
                }}
                style={{ padding: '10px 24px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', background: 'white',
                  color: '#374151', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = deleteSessionTarget.examSessionId;
                  // Delete schedule records
                  const schedExisting = safeLS('pba_exam_schedule', []);
                  saveLS('pba_exam_schedule',
                    (schedExisting || []).filter(r => r.examSessionId !== id));
                  // Delete results records
                  const resExisting = safeLS('pba_exam_results', []);
                  saveLS('pba_exam_results',
                    (resExisting || []).filter(r => r.examSessionId !== id));
                  // Delete calendar events
                  deleteExamFromCalendar(id);
                  // Refresh state
                  setExamSchedule(safeLS('pba_exam_schedule', []));
                  setExamResults(safeLS('pba_exam_results', []));
                  setShowDeleteSession(false);
                  setDeleteSessionTarget(null);
                }}
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none',
                  background: '#DC2626', color: 'white',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PAPER MODAL */}
      {showEditPaper && editPaperRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 3000, display: 'flex', alignItems: 'center',
          justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '14px', width: '460px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#1E1B4B,#4F46E5)',
              padding: '16px 22px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'white' }}>
                  ✏️ Edit Paper
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)',
                  marginTop: '2px' }}>
                  {editPaperRecord.subjectName} —{' '}
                  {editPaperRecord.paperName || `Paper ${editPaperRecord.paperNumber}`}
                  &nbsp;·&nbsp;{editPaperRecord.examSessionName}
                </div>
              </div>
              <button onClick={() => { setShowEditPaper(false); setEditPaperRecord(null); }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
                  color: 'white', borderRadius: '6px', padding: '4px 12px',
                  cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>

            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column',
              gap: '14px' }}>

              {/* Real-time Clash Detection Warning */}
              {(() => {
                const clashWarnings = detectClashes(
                  editPaperRecord.subjectName || editPaperRecord.subject,
                  editPaperForm.date,
                  editPaperForm.startTime,
                  editPaperForm.endTime,
                  editPaperRecord.id
                );
                if (clashWarnings.length === 0) return null;
                return (
                  <div style={{
                    background: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400E',
                                  marginBottom: '6px' }}>
                      ⚠️ Subject Clash Detected
                    </div>
                    {clashWarnings.map((clash, i) => (
                      <div key={i} style={{ fontSize: '13px', color: '#78350F', marginBottom: '2px' }}>
                        • <strong>{editPaperRecord.subjectName || editPaperRecord.subject}</strong> clashes with{' '}
                        <strong>{clash.subject || clash.subjectName}</strong>
                        {clash.batchName ? ` (${clash.batchName})` : ''}{' '}
                        at {clash.startTime}–{clash.endTime}
                      </div>
                    ))}
                    <div style={{ fontSize: '12px', color: '#B45309', marginTop: '8px' }}>
                      Students taking both subjects will face simultaneous exams.
                      Adjust the date or time to resolve.
                    </div>
                  </div>
                );
              })()}

              {/* Paper Name */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'block', marginBottom: '5px' }}>Paper Name / Label</label>
                <input type="text"
                  value={editPaperForm.paperName}
                  onChange={e => setEditPaperForm(p => ({ ...p, paperName: e.target.value }))}
                  placeholder="e.g. Paper 1 (MCQ), Unit 2, Paper 4"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', fontSize: '13px',
                    boxSizing: 'border-box' }} />
              </div>

              {/* Date */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'block', marginBottom: '5px' }}>Exam Date</label>
                <input type="date"
                  value={editPaperForm.date}
                  onChange={e => setEditPaperForm(p => ({ ...p, date: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', fontSize: '13px',
                    boxSizing: 'border-box' }} />
              </div>

              {/* Time row */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: '5px' }}>Start Time</label>
                  <input type="time"
                    value={editPaperForm.startTime}
                    onChange={e => setEditPaperForm(p => ({ ...p, startTime: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #E3E6EA', fontSize: '13px',
                      boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: '5px' }}>End Time</label>
                  <input type="time"
                    value={editPaperForm.endTime}
                    onChange={e => setEditPaperForm(p => ({ ...p, endTime: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #E3E6EA', fontSize: '13px',
                      boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Marks row */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: '5px' }}>Total Marks</label>
                  <input type="number" min={1}
                    value={editPaperForm.totalMarks}
                    onChange={e => setEditPaperForm(p => ({
                      ...p, totalMarks: Number(e.target.value) || 1
                    }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #E3E6EA', fontSize: '13px',
                      boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: '5px' }}>Pass Mark</label>
                  <input type="number" min={0}
                    value={editPaperForm.passMarks}
                    onChange={e => setEditPaperForm(p => ({
                      ...p, passMarks: Number(e.target.value) || 0
                    }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #E3E6EA', fontSize: '13px',
                      boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'block', marginBottom: '5px' }}>Venue (optional)</label>
                <input type="text"
                  value={editPaperForm.venue}
                  onChange={e => setEditPaperForm(p => ({ ...p, venue: e.target.value }))}
                  placeholder="e.g. Hall A, Room 3B"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', fontSize: '13px',
                    boxSizing: 'border-box' }} />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end',
                paddingTop: '6px' }}>
                <button onClick={() => { setShowEditPaper(false); setEditPaperRecord(null); }}
                  style={{ padding: '9px 20px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', background: 'white',
                    color: '#374151', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={() => {
                    const existing = safeLS('pba_exam_schedule', []);
                    const updated = (existing || []).map(r => {
                      if (r.id !== editPaperRecord.id) return r;
                      return {
                        ...r,
                        paperName:  editPaperForm.paperName.trim() || r.paperName,
                        date:       editPaperForm.date,
                        startTime:  editPaperForm.startTime,
                        endTime:    editPaperForm.endTime,
                        totalMarks: Number(editPaperForm.totalMarks) || r.totalMarks,
                        passMarks:  Number(editPaperForm.passMarks)  || r.passMarks,
                        venue:      editPaperForm.venue.trim()
                      };
                    });
                    saveLS('pba_exam_schedule', updated);
                    saveLS('pba_exams', updated);
                    setExamSchedule(updated);

                    // Sync updated session to Calendar
                    const allForSession = (updated || []).filter(
                      r => r.examSessionId === editPaperRecord.examSessionId
                    );
                    syncExamToCalendar(
                      editPaperRecord.examSessionId,
                      allForSession[0]?.examSessionName || editPaperRecord.examSessionName || 'Exam',
                      allForSession
                    );

                    setShowEditPaper(false);
                    setEditPaperRecord(null);
                  }}
                  style={{ padding: '9px 24px', borderRadius: '8px', border: 'none',
                    background: '#4F46E5', color: 'white',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  Save Changes
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DELETE SINGLE PAPER CONFIRMATION MODAL */}
      {showDeletePaper && deletePaperTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 3000, display: 'flex', alignItems: 'center',
          justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '14px', width: '380px',
            padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🗑️</div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#1A202C',
              marginBottom: '6px' }}>
              Delete{' '}
              {deletePaperTarget.paperName || `Paper ${deletePaperTarget.paperNumber}`}?
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '14px' }}>
              {deletePaperTarget.subjectName} · {deletePaperTarget.examSessionName}
            </div>
            <div style={{ padding: '10px 12px', background: '#FEF3C7',
              border: '1px solid #F59E0B', borderRadius: '8px',
              fontSize: '12px', color: '#92400E', fontWeight: 600,
              marginBottom: '18px' }}>
              ⚠ Any mark entries for this paper will also be deleted.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowDeletePaper(false); setDeletePaperTarget(null);
                }}
                style={{ padding: '9px 20px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', background: 'white',
                  color: '#374151', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={() => {
                  const targetId = deletePaperTarget.id;
                  const examSessionId = deletePaperTarget.examSessionId;
                  // Delete the paper schedule record
                  const schedExisting = safeLS('pba_exam_schedule', []);
                  const remainingAll = (schedExisting || []).filter(r => r.id !== targetId);
                  saveLS('pba_exam_schedule', remainingAll);
                  // Delete matching result records
                  const resExisting = safeLS('pba_exam_results', []);
                  saveLS('pba_exam_results',
                    (resExisting || []).filter(r =>
                      !(r.examSessionId === deletePaperTarget.examSessionId &&
                        r.subjectId     === deletePaperTarget.subjectId &&
                        Number(r.paperNumber) === Number(deletePaperTarget.paperNumber))
                    )
                  );
                  // Sync remaining papers of this session to calendar
                  const remainingForSession = remainingAll.filter(r => r.examSessionId === examSessionId);
                  const sessionName = deletePaperTarget.examSessionName
                    || remainingForSession[0]?.examSessionName
                    || 'Exam';
                  syncExamToCalendar(examSessionId, sessionName, remainingForSession);

                  setExamSchedule(remainingAll);
                  setExamResults(safeLS('pba_exam_results', []));
                  setShowDeletePaper(false);
                  setDeletePaperTarget(null);
                }}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none',
                  background: '#DC2626', color: 'white',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Delete Paper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVIGILATOR ASSIGNMENT MODAL */}
      {showInvigilatorModal && invigilatorPaper && (() => {
        const suggested = getSuggestedLecturers(invigilatorPaper.date);
        const suggestedIds = new Set(suggested.map(l => l.id));
        const examDayName = invigilatorPaper.date
          ? new Date(invigilatorPaper.date + 'T12:00:00')
              .toLocaleDateString('en-US', { weekday: 'long' })
          : '';

        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 3000, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '20px'
          }}>
            <div style={{
              background: 'white', borderRadius: '16px',
              width: '100%', maxWidth: '520px',
              maxHeight: '85vh', overflow: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
            }}>

              {/* Header */}
              <div style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid #F3F4F6'
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800,
                      color: '#1A202C' }}>
                      👤 Assign Invigilators
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
                      {invigilatorPaper.subjectName} ·{' '}
                      {invigilatorPaper.paperName || ('Paper ' + invigilatorPaper.paperNumber)}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                      📅 {invigilatorPaper.date} · ⏰{' '}
                      {invigilatorPaper.startTime}–{invigilatorPaper.endTime}
                      {invigilatorPaper.venue ? ` · ${invigilatorPaper.venue}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInvigilatorModal(false)}
                    style={{
                      background: '#F3F4F6', border: 'none', borderRadius: '8px',
                      width: '32px', height: '32px', fontSize: '18px',
                      cursor: 'pointer', color: '#6B7280', flexShrink: 0
                    }}>
                    ×
                  </button>
                </div>
              </div>

              <div style={{ padding: '20px 24px' }}>

                {/* Suggestion banner */}
                {suggested.length > 0 && (
                  <div style={{
                    background: '#FFFBEB', border: '1px solid #FDE68A',
                    borderRadius: '10px', padding: '10px 14px',
                    marginBottom: '16px', fontSize: '12px', color: '#92400E'
                  }}>
                    <strong>💡 Suggested for {examDayName}:</strong>{' '}
                    {suggested.map(l => l.name).join(', ')}
                    {' '}— these lecturers have classes scheduled on this day.
                    <br/>
                    <span style={{ fontSize: '11px', color: '#B45309' }}>
                      You are not restricted to this list.
                    </span>
                  </div>
                )}

                {/* Invigilator rows */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px', fontWeight: 700, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: '8px'
                  }}>
                    Invigilators
                  </label>

                  {(invigilatorList || []).map((inv, idx) => (
                    <div key={idx} style={{
                      display: 'flex', gap: '8px', marginBottom: '8px',
                      alignItems: 'center'
                    }}>

                      {/* Role badge */}
                      <select
                        value={inv.role || 'Assistant'}
                        onChange={e => {
                          const updated = [...invigilatorList];
                          updated[idx] = { ...updated[idx], role: e.target.value };
                          setInvigilatorList(updated);
                        }}
                        style={{
                          padding: '7px 8px', borderRadius: '7px',
                          border: '1px solid #E3E6EA', fontSize: '12px',
                          background: 'white', flexShrink: 0, width: '110px'
                        }}>
                        <option value="Chief">★ Chief</option>
                        <option value="Assistant">Assistant</option>
                      </select>

                      {/* Lecturer select */}
                      <select
                        value={inv.lecturerId || ''}
                        onChange={e => {
                          const lect = (lecturers || []).find(l => l.id === e.target.value);
                          const updated = [...invigilatorList];
                          updated[idx] = {
                            ...updated[idx],
                            lecturerId: e.target.value,
                            lecturerName: lect?.name || ''
                          };
                          setInvigilatorList(updated);
                        }}
                        style={{
                          flex: 1, padding: '7px 10px', borderRadius: '7px',
                          border: '1px solid #E3E6EA', fontSize: '13px',
                          background: 'white'
                        }}>
                        <option value="">— Select Lecturer —</option>

                        {/* Suggested group */}
                        {suggested.length > 0 && (
                          <optgroup label={`💡 Have classes on ${examDayName}`}>
                            {suggested.map(l => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </optgroup>
                        )}

                        {/* All other lecturers */}
                        <optgroup label="All Lecturers">
                          {(lecturers || [])
                            .filter(l => !suggestedIds.has(l.id))
                            .map(l => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </optgroup>
                      </select>

                      {/* Remove button */}
                      <button
                        onClick={() => {
                          setInvigilatorList(invigilatorList.filter((_, i) => i !== idx));
                        }}
                        style={{
                          background: '#FEF2F2', border: '1px solid #FCA5A5',
                          borderRadius: '7px', color: '#DC2626',
                          width: '30px', height: '30px', fontSize: '16px',
                          cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Add row button */}
                  <button
                    onClick={() => {
                      setInvigilatorList([
                        ...(invigilatorList || []),
                        {
                          lecturerId: '',
                          lecturerName: '',
                          role: invigilatorList.length === 0 ? 'Chief' : 'Assistant'
                        }
                      ]);
                    }}
                    style={{
                      width: '100%', padding: '8px', borderRadius: '8px',
                      border: '1px dashed #4F46E5', background: '#EEF2FF',
                      color: '#4F46E5', fontSize: '12px', fontWeight: 700,
                      cursor: 'pointer', marginTop: '4px'
                    }}>
                    + Add Invigilator
                  </button>
                </div>

                {/* Quick-add suggested button */}
                {suggested.length > 0 && (invigilatorList || []).length === 0 && (
                  <button
                    onClick={() => {
                      const quickList = suggested.map((l, i) => ({
                        lecturerId: l.id,
                        lecturerName: l.name,
                        role: i === 0 ? 'Chief' : 'Assistant'
                      }));
                      setInvigilatorList(quickList);
                    }}
                    style={{
                      width: '100%', padding: '9px', borderRadius: '8px',
                      border: '1px solid #FDE68A', background: '#FFFBEB',
                      color: '#92400E', fontSize: '12px', fontWeight: 700,
                      cursor: 'pointer', marginBottom: '12px'
                    }}>
                    ⚡ Quick-add all {examDayName} lecturers as invigilators
                  </button>
                )}

              </div>

              {/* Footer */}
              <div style={{
                padding: '14px 24px', borderTop: '1px solid #F3F4F6',
                display: 'flex', gap: '10px', justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowInvigilatorModal(false)}
                  style={{
                    padding: '9px 20px', borderRadius: '8px',
                    border: '1px solid #E3E6EA', background: 'white',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    color: '#374151'
                  }}>
                  Cancel
                </button>
                <button
                  onClick={saveInvigilators}
                  style={{
                    padding: '9px 22px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    border: 'none', color: 'white',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                  }}>
                  Save Invigilators
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
