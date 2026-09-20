# PBA Full-Time Portal — Examinations: Mark Entry — Surgical Enhancement
## AntiGravity Prompt

---

```
Enhance the EXISTING Mark Entry tab in ExamManagementView.jsx
so it supports the new exam schedule hierarchy:
  Session → Subject → Paper → Student → Raw Marks + Percentage

The Mark Entry tab ALREADY EXISTS with:
  - Session dropdown at top
  - Progress bar
  - Import from CSV/Excel + Download CSV Template buttons
  - Student table: # | STUDENT NAME | STUDENT ID | MARKS OBTAINED (/100) | ABSENT | GRADE
  - "Save All Marks to Registry" footer button

DO NOT rebuild this from scratch.
ADD the following to what already exists:
  (1) Subject selector — new dropdown after the session dropdown
  (2) Paper selector  — new dropdown after the subject dropdown
  (3) Dynamic /X denominator — replace hardcoded /100 with paper's totalMarks
  (4) PERCENTAGE column — auto-calculated, read-only, between MARKS OBTAINED and GRADE
  (5) Updated Save logic — save to pba_exam_results with full hierarchy fields
  (6) Updated Import/Download logic — scoped per paper, not just per session
  (7) Updated session dropdown — populated from pba_exam_schedule grouped by examSessionId

Touch ONLY ExamManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
HOW MARKS ARE STORED
════════════════════════════════════════════════════════════════

localStorage key: 'pba_exam_results'
One record per student per paper:

  {
    id:              'result_abc123',
    examSessionId:   'examSession_1234',
    examSessionName: 'First Term Exam 2026',
    batchId:         'batch_xyz',
    batchName:       'Cambridge O Level 2027',
    subjectId:       'sub_bio',
    subjectCode:     'BIO',
    subjectName:     'Biology',
    paperNumber:     1,
    paperName:       'Paper 1 (MCQ)',
    totalMarks:      40,          ← from pba_exam_schedule record
    passMarks:       20,          ← from pba_exam_schedule record
    studentId:       'student_abc',
    studentName:     'Ameer Ismail',
    rawMarks:        32,          ← entered by admin (can be decimal: 32.5)
    percentage:      80.0,        ← auto-calculated: (rawMarks/totalMarks)*100
    grade:           'A',         ← derived from percentage
    isPassed:        true,        ← rawMarks >= passMarks
    absent:          false,
    enteredAt:       '2026-09-10T10:00:00.000Z',
    updatedAt:       '2026-09-10T10:05:00.000Z'
  }

Grade scale (Cambridge/Edexcel):
  >= 90% → A*   >= 80% → A   >= 70% → B   >= 60% → C
  >= 50% → D    >= 40% → E   < 40%  → U   absent → ABS

════════════════════════════════════════════════════════════════
STATE TO ADD (Mark Entry tab additions)
════════════════════════════════════════════════════════════════

Add these state variables alongside the existing Mark Entry state:

  // The exam schedule records (source for session/subject/paper dropdowns)
  const [examSchedule, setExamSchedule] = useState(
    () => safeLS('pba_exam_schedule', [])
  );
  useEffect(() => {
    setExamSchedule(safeLS('pba_exam_schedule', []));
  }, []);

  // Exam results
  const [examResults, setExamResults] = useState(
    () => safeLS('pba_exam_results', [])
  );

  // Mark Entry selectors — ADD these alongside whatever existing
  // selectedSession / markEntrySession state already exists
  const [markExamSessionId, setMarkExamSessionId]   = useState('');
  const [markSubjectId, setMarkSubjectId]           = useState('');
  const [markPaperNumber, setMarkPaperNumber]       = useState('');

  // Import modal state
  const [showMarkImport, setShowMarkImport]         = useState(false);
  const [markImportRows, setMarkImportRows]         = useState([]);
  const [markImportError, setMarkImportError]       = useState('');

NOTE: If the existing Mark Entry tab already has a selectedSession
state (e.g. markSession, selectedExamSession, etc.), keep it but
ALSO add the three new selectors above (markExamSessionId,
markSubjectId, markPaperNumber). The existing session selector
logic will be replaced by the updated one below.

════════════════════════════════════════════════════════════════
HELPERS — add inside the component
════════════════════════════════════════════════════════════════

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

  // Build mark sheet rows: students from pba_students + saved results
  const buildMarkSheet = (examSessionId, batchId, subjectId, paperNumber) => {
    const students = (safeLS('pba_students', []) || [])
      .filter(s => s.batchId === batchId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const paperRec = (examSchedule || []).find(r =>
      r.examSessionId === examSessionId &&
      r.subjectId === subjectId &&
      Number(r.paperNumber) === Number(paperNumber)
    );
    const totalMks = paperRec?.totalMarks || 100;
    const passMks  = paperRec?.passMarks  || 40;
    return (students || []).map(student => {
      const saved = (safeLS('pba_exam_results', []) || []).find(r =>
        r.examSessionId === examSessionId &&
        r.subjectId === subjectId &&
        Number(r.paperNumber) === Number(paperNumber) &&
        r.studentId === student.id
      );
      const rawMarks = saved?.rawMarks ?? null;
      const absent   = saved?.absent ?? false;
      const pct = (!absent && rawMarks !== null && rawMarks !== '')
        ? Math.round((parseFloat(rawMarks) / totalMks) * 1000) / 10
        : null;
      return {
        studentId:   student.id,
        studentName: student.name || '—',
        studentRegNo: student.regNo || student.id || '',
        rawMarks,
        percentage: pct,
        grade:      absent ? 'ABS' : calcGrade(pct),
        isPassed:   !absent && rawMarks !== null && parseFloat(rawMarks) >= passMks,
        absent,
        totalMarks: totalMks,
        passMarks:  passMks
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

════════════════════════════════════════════════════════════════
MARK ENTRY TAB — WHAT TO CHANGE IN THE EXISTING JSX
════════════════════════════════════════════════════════════════

Find the existing Mark Entry tab JSX panel. It currently has a
single session dropdown at the top. Replace that entire selector
section (everything above the progress bar) with this:

  ─── STEP 1: Derive grouped options for the session dropdown ───

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

  ─── STEP 2: Selector row JSX (replaces the old session dropdown) ───

  {/* SELECTOR ROW */}
  <div style={{
    display: 'flex', gap: '12px', flexWrap: 'wrap',
    marginBottom: '18px', alignItems: 'flex-end'
  }}>

    {/* Exam Session selector */}
    <div style={{ flex: '1 1 260px' }}>
      <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        display: 'block', marginBottom: '6px' }}>
        Examination Session
      </label>
      <select
        value={markExamSessionId}
        onChange={e => {
          setMarkExamSessionId(e.target.value);
          setMarkSubjectId('');
          setMarkPaperNumber('');
        }}
        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
          border: '1px solid #E3E6EA', fontSize: '13px',
          background: 'white', color: '#1A202C' }}>
        <option value="">— Select Session —</option>
        {(examSessionGroups || []).map(g => (
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
        }}
        disabled={!markExamSessionId}
        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
          border: '1px solid #E3E6EA', fontSize: '13px',
          background: !markExamSessionId ? '#F9FAFB' : 'white',
          color: '#1A202C' }}>
        <option value="">— Select Subject —</option>
        {(markSubjects || []).map(s => (
          <option key={s.subjectId} value={s.subjectId}>
            {s.subjectCode} — {s.subjectName}
          </option>
        ))}
      </select>
    </div>

    {/* Paper selector */}
    <div style={{ flex: '1 1 160px' }}>
      <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        display: 'block', marginBottom: '6px' }}>
        Paper
      </label>
      <select
        value={markPaperNumber}
        onChange={e => setMarkPaperNumber(e.target.value)}
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

  ─── STEP 3: Progress bar ───

  Update the progress bar to use markSheet instead of the old data:

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

  ─── STEP 4: Action buttons row (Import + Download Template) ───

  Keep the same button visuals. Update their onClick to scope
  per markExamSessionId + markSubjectId + markPaperNumber:

  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px',
    flexWrap: 'wrap' }}>

    <button
      disabled={!markPaperNumber}
      onClick={() => {
        if (!markPaperNumber) return;
        setMarkImportRows([]);
        setMarkImportError('');
        setShowMarkImport(true);
      }}
      style={{ padding: '8px 16px', borderRadius: '8px',
        border: `1px solid ${markPaperNumber ? '#4F46E5' : '#E3E6EA'}`,
        background: markPaperNumber ? '#EEF2FF' : '#F9FAFB',
        color: markPaperNumber ? '#4F46E5' : '#9CA3AF',
        fontSize: '13px', fontWeight: 700,
        cursor: markPaperNumber ? 'pointer' : 'not-allowed' }}>
      ↑ Import from CSV / Excel
    </button>

    <button
      disabled={!markPaperNumber}
      onClick={() => {
        if (!markPaperNumber || !activeSessionGroup?.batchId) return;
        const students = (safeLS('pba_students', []) || [])
          .filter(s => s.batchId === activeSessionGroup.batchId)
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        const paperLabel = activePaperRec?.paperName || `Paper_${markPaperNumber}`;
        const header = 'Student Name,Student ID,Raw Marks,Absent';
        const rows   = (students || []).map(s => `${s.name || ''},${s.id || ''},,`);
        const csv    = [header, ...rows].join('\n');
        const blob   = new Blob([csv], { type: 'text/csv' });
        const url    = URL.createObjectURL(blob);
        const a      = document.createElement('a');
        a.href = url; a.download = `marks_template_${paperLabel}.csv`;
        a.click(); URL.revokeObjectURL(url);
      }}
      style={{ padding: '8px 16px', borderRadius: '8px',
        border: `1px solid ${markPaperNumber ? '#059669' : '#E3E6EA'}`,
        background: markPaperNumber ? '#ECFDF5' : '#F9FAFB',
        color: markPaperNumber ? '#059669' : '#9CA3AF',
        fontSize: '13px', fontWeight: 700,
        cursor: markPaperNumber ? 'pointer' : 'not-allowed' }}>
      ↓ Download CSV Template
    </button>

  </div>

  ─── STEP 5: Student table — ADD PERCENTAGE column ───

  EXISTING table header:
    # | STUDENT NAME | STUDENT ID | MARKS OBTAINED | ABSENT | GRADE

  CHANGE TO:
    # | STUDENT NAME | STUDENT ID | MARKS OBTAINED | % | ABSENT | GRADE

  The MARKS OBTAINED column header sub-line should show the
  dynamic out-of value:

  <th style={{ padding: '10px 14px', textAlign: 'center',
    fontSize: '10px', fontWeight: 800, color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: '0.07em' }}>
    MARKS OBTAINED
    <div style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: 500,
      textTransform: 'none', marginTop: '2px' }}>
      out of {activePaperRec?.totalMarks || '—'}
    </div>
  </th>

  <th style={{ padding: '10px 14px', textAlign: 'center',
    fontSize: '10px', fontWeight: 800, color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    width: '80px' }}>%</th>

  In each table row, add the PERCENTAGE cell between
  MARKS OBTAINED and ABSENT:

  {/* PERCENTAGE — read-only, auto-calculated */}
  <td style={{ padding: '8px 14px', textAlign: 'center',
    fontSize: '13px', fontWeight: 700,
    color: row.absent ? '#9CA3AF'
      : row.percentage !== null
        ? (row.percentage >= (activePaperRec?.passMarks
            ? (activePaperRec.passMarks / (activePaperRec.totalMarks||100))*100
            : 40)
            ? '#059669' : '#DC2626')
        : '#D1D5DB' }}>
    {row.absent ? 'ABS'
      : row.percentage !== null
        ? `${row.percentage}%`
        : '—'}
  </td>

  The input for MARKS OBTAINED must use the dynamic max value:
  (in the existing input element, change hardcoded 100):

    max={activePaperRec?.totalMarks || 100}
    step={0.5}
    onChange={e => {
      const val = e.target.value === '' ? null : parseFloat(e.target.value);
      saveMarkCell(
        markExamSessionId, markSubjectId,
        Number(markPaperNumber), row.studentId, 'rawMarks', val
      );
    }}

  The ABSENT checkbox onChange:

    onChange={e => {
      saveMarkCell(
        markExamSessionId, markSubjectId,
        Number(markPaperNumber), row.studentId, 'absent', e.target.checked
      );
    }}

  Grade badge — keep existing badge visual, but derive from row.grade
  (which is already calculated in buildMarkSheet):

    color: gradeColor(row.grade)
    text:  row.grade || '—'

  ─── STEP 6: Table body — use markSheet, not old data ───

  Replace the existing table rows map with:

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
              <td style={{ padding: '8px 14px', fontSize: '12px',
                color: '#9CA3AF', fontWeight: 600 }}>{idx + 1}</td>
              {/* NAME */}
              <td style={{ padding: '8px 14px', fontSize: '13px',
                fontWeight: 600, color: '#1A202C' }}>{row.studentName}</td>
              {/* ID / REG NO */}
              <td style={{ padding: '8px 14px', fontSize: '12px',
                color: '#6B7280' }}>{row.studentRegNo || '—'}</td>
              {/* MARKS input */}
              <td style={{ padding: '6px 14px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    min={0}
                    max={activePaperRec?.totalMarks || 100}
                    step={0.5}
                    disabled={row.absent}
                    value={row.rawMarks !== null && row.rawMarks !== undefined
                      ? row.rawMarks : ''}
                    placeholder="—"
                    onChange={e => {
                      const val = e.target.value === ''
                        ? null : parseFloat(e.target.value);
                      saveMarkCell(
                        markExamSessionId, markSubjectId,
                        Number(markPaperNumber), row.studentId, 'rawMarks', val
                      );
                    }}
                    style={{ width: '72px', padding: '6px 8px',
                      borderRadius: '6px', textAlign: 'center',
                      border: '1px solid #E3E6EA', fontSize: '14px',
                      fontWeight: 700,
                      background: row.absent ? '#F9FAFB' : 'white',
                      color: row.absent ? '#9CA3AF' : '#1A202C' }}
                  />
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    /{activePaperRec?.totalMarks || '?'}
                  </span>
                </div>
              </td>
              {/* PERCENTAGE */}
              <td style={{ padding: '8px 14px', textAlign: 'center',
                fontSize: '13px', fontWeight: 700,
                color: row.absent ? '#9CA3AF'
                  : row.percentage !== null
                    ? (row.percentage >= 40 ? '#059669' : '#DC2626')
                    : '#D1D5DB' }}>
                {row.absent ? 'ABS'
                  : row.percentage !== null ? `${row.percentage}%` : '—'}
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
                  style={{ width: '16px', height: '16px',
                    cursor: 'pointer', accentColor: '#D97706' }}
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
          <tr><td colSpan={7}
            style={{ padding: '40px', textAlign: 'center',
              color: '#9CA3AF', fontSize: '13px' }}>
            No students enrolled in this batch yet.
          </td></tr>
        )
      : (
        <tr><td colSpan={7}
          style={{ padding: '40px', textAlign: 'center',
            color: '#9CA3AF', fontSize: '13px' }}>
          Select a session, subject, and paper above to load the mark sheet.
        </td></tr>
      )
    }

  ─── STEP 7: "Save All Marks to Registry" button ───

  saveMarkCell() already saves each cell change individually to
  localStorage in real time. The Save All button is therefore a
  no-op for data persistence — but keep it for UX reassurance.

  Update its onClick to just show a success indicator:

    onClick={() => {
      // Marks are already auto-saved per cell via saveMarkCell().
      // This button just confirms to the user.
      // If there is a toast/success state, trigger it here:
      // setSaveToast(true); setTimeout(()=>setSaveToast(false), 2500);
      alert('✓ Marks saved to registry.');
      // Replace alert with a toast if your component has one
    }}
    disabled={!markPaperNumber || (markSheet || []).length === 0}

════════════════════════════════════════════════════════════════
BULK IMPORT MODAL — CSV / Excel
════════════════════════════════════════════════════════════════

Add this modal to the Mark Entry tab section. Render it
conditionally: {showMarkImport && ...}

  {showMarkImport && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 3000, display: 'flex', alignItems: 'center',
      justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '14px',
        width: '620px', maxHeight: '82vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
          padding: '18px 24px', borderRadius: '14px 14px 0 0',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: 'white' }}>
            ↑ Bulk Import Marks —{' '}
            {activePaperRec?.paperName || `Paper ${markPaperNumber}`}
          </div>
          <button onClick={() => setShowMarkImport(false)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', borderRadius: '6px', padding: '4px 12px',
              cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Format instructions */}
          <div style={{ background: '#F0F4FF', border: '1px solid #C7D2FE',
            borderRadius: '10px', padding: '14px 16px', marginBottom: '16px',
            fontSize: '12px', color: '#374151', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 800, marginBottom: '6px' }}>
              📋 Required columns:
            </div>
            <div style={{ fontFamily: 'monospace', background: 'white',
              padding: '8px 10px', borderRadius: '6px',
              border: '1px solid #E3E6EA', fontSize: '11px' }}>
              Student Name | Raw Marks | Absent (optional)
            </div>
            <div style={{ marginTop: '8px', color: '#6B7280' }}>
              • CSV (.csv) or Excel (.xlsx / .xls) accepted<br/>
              • "Student Name" must match the enrolled student's name (case-insensitive)<br/>
              • "Raw Marks" is a number out of <strong>{activePaperRec?.totalMarks || '?'}</strong><br/>
              • "Absent" column: write <strong>yes</strong> or <strong>1</strong> to mark absent<br/>
              • Percentage and grade are auto-calculated — do not include them<br/>
              • PDF import is not supported — save as CSV or Excel
            </div>
          </div>

          {/* File upload */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151',
              display: 'block', marginBottom: '8px' }}>
              Upload File
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                setMarkImportError(''); setMarkImportRows([]);
                const ext = file.name.split('.').pop().toLowerCase();

                if (ext === 'csv') {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const lines = ev.target.result.split('\n').filter(l => l.trim());
                      if (lines.length < 2) {
                        setMarkImportError('File appears empty.'); return; }
                      const hdrs = lines[0].split(',').map(h =>
                        h.trim().toLowerCase().replace(/[^a-z0-9]/g,''));
                      const nameIdx   = hdrs.findIndex(h =>
                        h.includes('name') || h.includes('student'));
                      const marksIdx  = hdrs.findIndex(h =>
                        h.includes('raw') || h.includes('marks') || h.includes('score'));
                      const absentIdx = hdrs.findIndex(h => h.includes('absent'));
                      if (nameIdx < 0 || marksIdx < 0) {
                        setMarkImportError(
                          'Cannot find "Student Name" and "Raw Marks" columns.'); return; }
                      const parsed = lines.slice(1).map(line => {
                        const cols  = line.split(',');
                        const name  = (cols[nameIdx] || '').trim();
                        const raw   = (cols[marksIdx] || '').trim();
                        const absV  = absentIdx >= 0
                          ? (cols[absentIdx]||'').trim().toLowerCase() : '';
                        const absent = absV==='yes'||absV==='1'||absV==='true'||absV==='absent';
                        if (!name) return null;
                        return { name, rawMarks: raw==='' ? null : parseFloat(raw), absent };
                      }).filter(Boolean);
                      setMarkImportRows(parsed);
                    } catch { setMarkImportError('Failed to parse CSV.'); }
                  };
                  reader.readAsText(file);

                } else {
                  // Excel via SheetJS
                  const script = document.createElement('script');
                  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                  script.onload = () => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const wb   = window.XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
                        const json = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
                        const parsed = (json || []).map(row => {
                          const nameK = Object.keys(row).find(k =>
                            k.toLowerCase().includes('name')||k.toLowerCase().includes('student'));
                          const markK = Object.keys(row).find(k =>
                            k.toLowerCase().includes('raw')||k.toLowerCase().includes('marks'));
                          const absnK = Object.keys(row).find(k =>
                            k.toLowerCase().includes('absent'));
                          const name   = nameK ? String(row[nameK]||'').trim() : '';
                          const rawStr = markK ? String(row[markK]||'').trim() : '';
                          const absV   = absnK ? String(row[absnK]||'').trim().toLowerCase() : '';
                          const absent = absV==='yes'||absV==='1'||absV==='true'||absV==='absent';
                          if (!name) return null;
                          return { name, rawMarks: rawStr==='' ? null : parseFloat(rawStr), absent };
                        }).filter(Boolean);
                        setMarkImportRows(parsed);
                      } catch { setMarkImportError('Failed to parse Excel. Try saving as CSV.'); }
                    };
                    reader.readAsArrayBuffer(file);
                  };
                  script.onerror = () =>
                    setMarkImportError('Excel parser failed to load. Please save as .csv and retry.');
                  document.head.appendChild(script);
                }
              }}
              style={{ display: 'block', width: '100%', padding: '10px',
                border: '2px dashed #C7D2FE', borderRadius: '8px',
                background: '#F5F7FF', cursor: 'pointer',
                fontSize: '13px', color: '#4F46E5' }}
            />
          </div>

          {/* Error */}
          {markImportError && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2',
              border: '1px solid #FCA5A5', borderRadius: '8px',
              fontSize: '12px', color: '#DC2626', fontWeight: 600,
              marginBottom: '12px' }}>
              ⚠ {markImportError}
            </div>
          )}

          {/* Preview table */}
          {(markImportRows || []).length > 0 && (() => {
            const totalMks = activePaperRec?.totalMarks || 100;
            return (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700,
                  color: '#374151', marginBottom: '8px' }}>
                  Preview — {markImportRows.length} rows found
                </div>
                <div style={{ maxHeight: '220px', overflowY: 'auto',
                  border: '1px solid #E3E6EA', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse',
                    fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#F8F9FB',
                        borderBottom: '1px solid #E3E6EA' }}>
                        {['Student Name',`Raw Marks (/${totalMks})`,
                          '%','Grade','Absent'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left',
                            fontWeight: 700, color: '#6B7280', fontSize: '10px',
                            textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(markImportRows || []).map((row, i) => {
                        const pct = (!row.absent && row.rawMarks !== null)
                          ? Math.round((row.rawMarks/totalMks)*1000)/10 : null;
                        const grade = row.absent ? 'ABS' : calcGrade(pct);
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9',
                            background: i%2===0 ? 'white' : '#FAFAFA' }}>
                            <td style={{ padding: '7px 12px' }}>{row.name}</td>
                            <td style={{ padding: '7px 12px', textAlign: 'center',
                              fontWeight: 700 }}>
                              {row.absent ? '—' : (row.rawMarks ?? '—')}
                            </td>
                            <td style={{ padding: '7px 12px', textAlign: 'center',
                              fontWeight: 700,
                              color: pct!==null?(pct>=40?'#059669':'#DC2626'):'#9CA3AF' }}>
                              {row.absent?'ABS':pct!==null?`${pct}%`:'—'}
                            </td>
                            <td style={{ padding: '7px 12px', textAlign: 'center',
                              fontWeight: 800, color: gradeColor(grade) }}>{grade}</td>
                            <td style={{ padding: '7px 12px', textAlign: 'center',
                              color: row.absent ? '#D97706' : '#D1D5DB' }}>
                              {row.absent ? 'Yes' : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px',
          display: 'flex', justifyContent: 'flex-end', gap: '10px',
          borderTop: '1px solid #F1F5F9' }}>
          <button onClick={() => setShowMarkImport(false)}
            style={{ padding: '9px 20px', borderRadius: '8px',
              border: '1px solid #E3E6EA', background: 'white',
              color: '#374151', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            disabled={(markImportRows || []).length === 0}
            onClick={() => {
              if ((markImportRows || []).length === 0) return;
              const batchId  = activeSessionGroup?.batchId || '';
              const students = (safeLS('pba_students', []) || [])
                .filter(s => s.batchId === batchId);
              const totalMks = activePaperRec?.totalMarks || 100;
              const passMks  = activePaperRec?.passMarks  || 40;
              const now = new Date().toISOString();
              const existing = safeLS('pba_exam_results', []);
              let updated = [...(existing || [])];
              (markImportRows || []).forEach(row => {
                const student = (students || []).find(s =>
                  (s.name||'').toLowerCase().trim() ===
                  (row.name||'').toLowerCase().trim()
                );
                if (!student) return;
                const rawNum = row.absent ? null
                  : row.rawMarks !== null ? parseFloat(row.rawMarks) : null;
                const pct = (!row.absent && rawNum !== null)
                  ? Math.round((rawNum/totalMks)*1000)/10 : null;
                const record = {
                  id: `result_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                  examSessionId:   markExamSessionId,
                  examSessionName: activeSessionGroup?.examSessionName || '',
                  batchId,
                  batchName:   activeSessionGroup?.batchName || '',
                  subjectId:   markSubjectId,
                  subjectCode: activePaperRec?.subjectCode || '',
                  subjectName: activePaperRec?.subjectName || '',
                  paperNumber: Number(markPaperNumber),
                  paperName:   activePaperRec?.paperName || `Paper ${markPaperNumber}`,
                  totalMarks:  totalMks,
                  passMarks:   passMks,
                  studentId:   student.id,
                  studentName: student.name || row.name,
                  rawMarks:    rawNum,
                  percentage:  pct,
                  grade:       row.absent ? 'ABS' : calcGrade(pct),
                  isPassed:    !row.absent && rawNum !== null && rawNum >= passMks,
                  absent:      row.absent || false,
                  enteredAt:   now, updatedAt: now
                };
                const idx = updated.findIndex(r =>
                  r.examSessionId === record.examSessionId &&
                  r.subjectId === record.subjectId &&
                  Number(r.paperNumber) === Number(record.paperNumber) &&
                  r.studentId === record.studentId
                );
                if (idx >= 0) updated[idx] = record;
                else updated.push(record);
              });
              saveLS('pba_exam_results', updated);
              setExamResults(updated);
              setShowMarkImport(false);
              setMarkImportRows([]);
            }}
            style={{ padding: '9px 20px', borderRadius: '8px', border: 'none',
              background: (markImportRows||[]).length>0 ? '#4F46E5' : '#E5E7EB',
              color: (markImportRows||[]).length>0 ? 'white' : '#9CA3AF',
              fontSize: '13px', fontWeight: 700,
              cursor: (markImportRows||[]).length>0 ? 'pointer' : 'not-allowed' }}>
            ✓ Import {(markImportRows || []).length} Students
          </button>
        </div>
      </div>
    </div>
  )}

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1.  Touch ONLY ExamManagementView.jsx
2.  DO NOT rebuild the Mark Entry tab — only ADD the subject/paper
    selectors and PERCENTAGE column, and UPDATE the data source
    from the new pba_exam_schedule / pba_exam_results structure
3.  Use only inline style={{}} — no Tailwind
4.  safeLS() for ALL localStorage reads; saveLS() for writes
5.  ALL useState calls that read localStorage MUST use lazy initializer:
    useState(() => safeLS('key', []))
6.  ALL array ops must guard null: (array || []).filter(...)
7.  The session dropdown now shows exam sessions from pba_exam_schedule
    (grouped by examSessionId) — NOT from pba_timetable
8.  Selecting a session reveals a subject dropdown; selecting a
    subject reveals a paper dropdown. Changing session resets both.
9.  The /X denominator in MARKS OBTAINED uses activePaperRec.totalMarks.
    If no paper is selected yet, show /— to avoid confusion.
10. PERCENTAGE is always auto-calculated: (rawMarks/totalMarks)*100
    rounded to 1 decimal. NEVER editable by the user.
11. saveMarkCell() upserts one record to pba_exam_results every time
    a marks input or absent checkbox changes — no buffering needed.
12. The "Save All Marks to Registry" footer button is already handled
    by auto-save. Keep the button but make its onClick show a
    confirmation (toast or brief message) instead of doing a bulk save.
    Replace window.alert() with a component-level toast state if possible.
13. Bulk import: CSV and Excel (.xlsx) are supported.
    PDF is NOT supported — show a note to users.
14. Import preview shows auto-calculated % and grade before confirming.
    Rows whose student name does not match any enrolled student are skipped.
15. Students come from pba_students filtered by the batch of the
    selected exam session (activeSessionGroup.batchId).
16. Run npm run build and confirm 0 errors
17. Then npm run deploy to push to GitHub and trigger Vercel deployment
18. List all files modified
```
