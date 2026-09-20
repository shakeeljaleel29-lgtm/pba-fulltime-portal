# PBA Full-Time Portal — Examinations: Batch-Wise Session Scheduler
## AntiGravity Prompt

---

```
Redesign the exam scheduling flow in ExamManagementView.jsx so that
exams are organised as EXAM SESSIONS (e.g. "First Term Exam 2026")
spanning a date range, with subjects scheduled individually per batch
across multiple days within that session.
Touch ONLY ExamManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE PROBLEM (from screenshots + user description)
════════════════════════════════════════════════════════════════

CURRENT FLOW (wrong):
  Schedule New Examination modal asks:
    SELECT SUBJECT  ← chosen first, out of context
    EXAM NAME/TITLE
    EXAM TYPE
    TARGET BATCH  ← shows stale "Batch 2024-A" not real batches
    DATE / TIME / MARKS / VENUE
  → saves one pba_exam_schedule record per click

WHAT IS ACTUALLY NEEDED:
  Real-world exam sessions run like this:
    "First Term Exam 2026" — runs 1–14 September 2026
      Cambridge O Level Full Time:
        Biology    → Tue 1 Sep, 09:00–11:00
        Chemistry  → Wed 2 Sep, 09:00–11:00
        Physics    → Thu 3 Sep, 09:00–11:00
      A Level Full Time:
        Biology    → Mon 1 Sep, 14:00–16:00
        ...

  So the flow is:
    1. Name the EXAM SESSION (e.g. "First Term Exam 2026")
    2. Pick EXAM TYPE and DATE RANGE for the session
    3. Pick ONE BATCH from pba_batches
    4. Add subjects from THAT batch one by one, each with:
       date, time, total marks, pass mark, venue
    5. Save — creates one pba_exam_schedule record per subject row

════════════════════════════════════════════════════════════════
DATA MODEL — pba_exam_schedule records
════════════════════════════════════════════════════════════════

Each record in pba_exam_schedule represents ONE subject
within an exam session for ONE batch:

  {
    id:              "examSched_1234567890_0",
    examSessionId:   "examSession_1234567890",  // groups all subjects of this session+batch
    examSessionName: "First Term Exam 2026",
    examType:        "Term Test",               // Term Test | Mock Exam | Assessment | Trial Exam
    batchId:         "batch_abc",
    batchName:       "Cambridge O Level 2027",
    sessionStartDate: "2026-09-01",             // session window start
    sessionEndDate:   "2026-09-14",             // session window end
    subjectId:       "sub_bio",
    subjectName:     "Biology",
    subjectCode:     "BIO",
    date:            "2026-09-02",              // specific exam day for THIS subject
    startTime:       "09:00",
    endTime:         "11:00",
    totalMarks:      100,
    passMarks:       50,
    venue:           "Hall A",
    notes:           "",
    createdAt:       "2026-09-21T..."
  }

All records for one "First Term Exam 2026 — Cambridge O Level 2027"
share the same examSessionId.
This keeps backward compatibility: mark entry and results still
query pba_exam_schedule by batchId and examSessionName as before.

════════════════════════════════════════════════════════════════
FIX 1 — BATCHES: Read from pba_batches, lazy init, refresh on open
════════════════════════════════════════════════════════════════

At the top of the component:

  const [batches,  setBatches]  = useState(() => safeLS('pba_batches', []));
  const [subjects, setSubjects] = useState(() => safeLS('pba_subjects', []));
  const [examSchedule, setExamSchedule] = useState(() => safeLS('pba_exam_schedule', []));

  // Refresh on mount so newly created batches appear immediately
  useEffect(() => {
    setBatches(safeLS('pba_batches', []));
    setSubjects(safeLS('pba_subjects', []));
    setExamSchedule(safeLS('pba_exam_schedule', []));
  }, []);

════════════════════════════════════════════════════════════════
FIX 2 — SCHEDULE EXAM MODAL: Redesigned two-section flow
════════════════════════════════════════════════════════════════

Replace the existing single-subject modal with this structure.

── STATE ────────────────────────────────────────────────────────

  const emptySubjectRow = () => ({
    subjectId: '', subjectCode: '', subjectName: '',
    date: '', startTime: '09:00', endTime: '11:00',
    totalMarks: 100, passMarks: 50, venue: '', notes: ''
  });

  const [scheduleForm, setScheduleForm] = useState({
    examSessionName: '',
    examType: 'Term Test',
    batchId: '',
    batchName: '',
    sessionStartDate: '',
    sessionEndDate: '',
    subjectRows: [emptySubjectRow()]
  });

  // Subjects available for the selected batch
  const batchSubjectOptions = (() => {
    if (!scheduleForm.batchId) return [];
    const batch = (batches || []).find(b => b.id === scheduleForm.batchId);
    return (batch?.subjects || []).map(bs => ({
      id: bs.subjectId || bs.id,
      name: bs.subjectName || bs.name,
      code: bs.subjectCode || bs.code || ''
    }));
  })();

── OPEN / CLOSE ──────────────────────────────────────────────

  const openScheduleModal = () => {
    setBatches(safeLS('pba_batches', []));    // always refresh
    setSubjects(safeLS('pba_subjects', []));
    setScheduleForm({
      examSessionName: '', examType: 'Term Test',
      batchId: '', batchName: '',
      sessionStartDate: '', sessionEndDate: '',
      subjectRows: [emptySubjectRow()]
    });
    setShowScheduleModal(true);
  };

── MODAL JSX ─────────────────────────────────────────────────

  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px'
  }}>
    <div style={{
      background: 'white', borderRadius: '16px', width: '100%',
      maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
    }}>

      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        borderRadius: '16px 16px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>
            Schedule Exam Session
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '4px 0 0' }}>
            Create a session for one batch — add each subject with its date & time
          </p>
        </div>
        <button onClick={() => setShowScheduleModal(false)}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
            width: '32px', height: '32px', borderRadius: '8px', fontSize: '18px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ×
        </button>
      </div>

      <div style={{ padding: '24px' }}>

        {/* ── SECTION A: Session Details ── */}
        <div style={{
          background: '#F8FAFC', borderRadius: '12px', padding: '16px',
          border: '1px solid #E2E8F0', marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#374151',
            textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>
            Session Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

            {/* Exam Session Name */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280',
                textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block',
                marginBottom: '5px' }}>Exam Session Name *</label>
              <input
                type="text"
                placeholder="e.g. First Term Exam 2026, Mock Exam 1..."
                value={scheduleForm.examSessionName}
                onChange={e => setScheduleForm(p => ({ ...p, examSessionName: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Exam Type */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280',
                textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block',
                marginBottom: '5px' }}>Exam Type *</label>
              <select
                value={scheduleForm.examType}
                onChange={e => setScheduleForm(p => ({ ...p, examType: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '14px', background: 'white' }}>
                <option value="Term Test">Term Test</option>
                <option value="Mock Exam">Mock Exam</option>
                <option value="Trial Exam">Trial Exam</option>
                <option value="Assessment">Assessment</option>
                <option value="Past Paper">Past Paper Practice</option>
                <option value="Final Exam">Final Exam</option>
              </select>
            </div>

            {/* Target Batch — reads from pba_batches */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280',
                textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block',
                marginBottom: '5px' }}>Target Batch *</label>
              <select
                value={scheduleForm.batchId}
                onChange={e => {
                  const b = (batches || []).find(b => b.id === e.target.value);
                  setScheduleForm(p => ({
                    ...p,
                    batchId: e.target.value,
                    batchName: b?.name || '',
                    subjectRows: [emptySubjectRow()]  // reset subjects when batch changes
                  }));
                }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '14px', background: 'white' }}>
                <option value="">— Select Batch —</option>
                {(batches || []).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {(batches || []).length === 0 && (
                <p style={{ fontSize: '11px', color: '#D97706', marginTop: '4px', fontWeight: 600 }}>
                  ⚠ No batches found. Create batches in General Admin → Batch Manager first.
                </p>
              )}
            </div>

            {/* Session Start Date */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280',
                textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block',
                marginBottom: '5px' }}>Session Window Start</label>
              <input
                type="date"
                value={scheduleForm.sessionStartDate}
                onChange={e => setScheduleForm(p => ({ ...p, sessionStartDate: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Session End Date */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280',
                textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block',
                marginBottom: '5px' }}>Session Window End</label>
              <input
                type="date"
                value={scheduleForm.sessionEndDate}
                onChange={e => setScheduleForm(p => ({ ...p, sessionEndDate: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

          </div>
        </div>

        {/* ── SECTION B: Subject Schedule Rows ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Subjects — Day & Time Schedule
            </h3>
            {scheduleForm.batchId && batchSubjectOptions.length === 0 && (
              <p style={{ fontSize: '11px', color: '#D97706', fontWeight: 600, margin: 0 }}>
                ⚠ Assign subjects to this batch first in Batch Manager
              </p>
            )}
          </div>

          {/* Column headers */}
          {scheduleForm.batchId && batchSubjectOptions.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 0.8fr 0.8fr 0.7fr 0.7fr 1fr 32px',
              gap: '8px', padding: '6px 8px',
              fontSize: '10px', fontWeight: 700, color: '#9CA3AF',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <div>Subject</div>
              <div>Date</div>
              <div>Start</div>
              <div>End</div>
              <div>Total</div>
              <div>Pass</div>
              <div>Venue</div>
              <div></div>
            </div>
          )}

          {/* Subject rows */}
          {(scheduleForm.subjectRows || []).map((row, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 0.8fr 0.8fr 0.7fr 0.7fr 1fr 32px',
              gap: '8px', marginBottom: '8px', alignItems: 'center'
            }}>

              {/* Subject dropdown — from batch.subjects */}
              <select
                value={row.subjectId}
                disabled={!scheduleForm.batchId}
                onChange={e => {
                  const sub = batchSubjectOptions.find(s => s.id === e.target.value);
                  const updated = [...scheduleForm.subjectRows];
                  updated[idx] = {
                    ...updated[idx],
                    subjectId: e.target.value,
                    subjectName: sub?.name || '',
                    subjectCode: sub?.code || ''
                  };
                  setScheduleForm(p => ({ ...p, subjectRows: updated }));
                }}
                style={{ padding: '8px 10px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '12px', background: 'white',
                  opacity: !scheduleForm.batchId ? 0.5 : 1 }}>
                <option value="">— Subject —</option>
                {batchSubjectOptions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code ? `${s.code} — ${s.name}` : s.name}
                  </option>
                ))}
              </select>

              {/* Date */}
              <input
                type="date"
                value={row.date}
                min={scheduleForm.sessionStartDate || ''}
                max={scheduleForm.sessionEndDate || ''}
                onChange={e => {
                  const updated = [...scheduleForm.subjectRows];
                  updated[idx] = { ...updated[idx], date: e.target.value };
                  setScheduleForm(p => ({ ...p, subjectRows: updated }));
                }}
                style={{ padding: '8px 6px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '12px', width: '100%',
                  boxSizing: 'border-box' }}
              />

              {/* Start Time */}
              <input
                type="time"
                value={row.startTime}
                onChange={e => {
                  const updated = [...scheduleForm.subjectRows];
                  updated[idx] = { ...updated[idx], startTime: e.target.value };
                  setScheduleForm(p => ({ ...p, subjectRows: updated }));
                }}
                style={{ padding: '8px 6px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '12px', width: '100%',
                  boxSizing: 'border-box' }}
              />

              {/* End Time */}
              <input
                type="time"
                value={row.endTime}
                onChange={e => {
                  const updated = [...scheduleForm.subjectRows];
                  updated[idx] = { ...updated[idx], endTime: e.target.value };
                  setScheduleForm(p => ({ ...p, subjectRows: updated }));
                }}
                style={{ padding: '8px 6px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '12px', width: '100%',
                  boxSizing: 'border-box' }}
              />

              {/* Total Marks */}
              <input
                type="number"
                value={row.totalMarks}
                min={1}
                onChange={e => {
                  const updated = [...scheduleForm.subjectRows];
                  updated[idx] = { ...updated[idx], totalMarks: Number(e.target.value) };
                  setScheduleForm(p => ({ ...p, subjectRows: updated }));
                }}
                style={{ padding: '8px 6px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '12px', width: '100%',
                  boxSizing: 'border-box', textAlign: 'center' }}
              />

              {/* Pass Marks */}
              <input
                type="number"
                value={row.passMarks}
                min={0}
                onChange={e => {
                  const updated = [...scheduleForm.subjectRows];
                  updated[idx] = { ...updated[idx], passMarks: Number(e.target.value) };
                  setScheduleForm(p => ({ ...p, subjectRows: updated }));
                }}
                style={{ padding: '8px 6px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '12px', width: '100%',
                  boxSizing: 'border-box', textAlign: 'center' }}
              />

              {/* Venue */}
              <input
                type="text"
                placeholder="Hall A"
                value={row.venue}
                onChange={e => {
                  const updated = [...scheduleForm.subjectRows];
                  updated[idx] = { ...updated[idx], venue: e.target.value };
                  setScheduleForm(p => ({ ...p, subjectRows: updated }));
                }}
                style={{ padding: '8px 6px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '12px', width: '100%',
                  boxSizing: 'border-box' }}
              />

              {/* Remove row button */}
              <button
                onClick={() => {
                  if (scheduleForm.subjectRows.length === 1) return;
                  const updated = scheduleForm.subjectRows.filter((_, i) => i !== idx);
                  setScheduleForm(p => ({ ...p, subjectRows: updated }));
                }}
                disabled={scheduleForm.subjectRows.length === 1}
                style={{
                  background: scheduleForm.subjectRows.length === 1 ? '#F1F5F9' : '#FEF2F2',
                  border: `1px solid ${scheduleForm.subjectRows.length === 1 ? '#E2E8F0' : '#FCA5A5'}`,
                  borderRadius: '6px',
                  color: scheduleForm.subjectRows.length === 1 ? '#CBD5E0' : '#DC2626',
                  width: '32px', height: '32px',
                  fontSize: '16px', cursor: scheduleForm.subjectRows.length === 1 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                ×
              </button>
            </div>
          ))}

          {/* Add Subject row button */}
          {scheduleForm.batchId && batchSubjectOptions.length > 0 && (
            <button
              onClick={() => setScheduleForm(p => ({
                ...p,
                subjectRows: [...p.subjectRows, emptySubjectRow()]
              }))}
              style={{
                marginTop: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px dashed #4F46E5',
                background: '#EEF2FF',
                color: '#4F46E5',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%'
              }}>
              + Add Another Subject
            </button>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px',
          marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
          <button
            onClick={() => setShowScheduleModal(false)}
            style={{ padding: '10px 20px', borderRadius: '8px',
              border: '1px solid #E2E8F0', background: 'white', color: '#374151',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSaveExamSession}
            style={{ padding: '10px 24px', borderRadius: '8px',
              border: 'none',
              background: (scheduleForm.examSessionName && scheduleForm.batchId &&
                scheduleForm.subjectRows.some(r => r.subjectId && r.date))
                ? '#4F46E5' : '#A5B4FC',
              color: 'white', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer' }}>
            Schedule Exam Session
          </button>
        </div>

      </div>
    </div>
  </div>

════════════════════════════════════════════════════════════════
FIX 3 — SAVE HANDLER: Creates one pba_exam_schedule record per subject
════════════════════════════════════════════════════════════════

  const handleSaveExamSession = () => {
    const { examSessionName, examType, batchId, batchName,
            sessionStartDate, sessionEndDate, subjectRows } = scheduleForm;

    // Validate
    if (!examSessionName.trim()) {
      alert('Please enter an Exam Session Name.'); return;
    }
    if (!batchId) {
      alert('Please select a Target Batch.'); return;
    }
    const validRows = (subjectRows || []).filter(r => r.subjectId && r.date);
    if (validRows.length === 0) {
      alert('Please add at least one subject with a date.'); return;
    }

    const examSessionId = `examSession_${Date.now()}`;
    const now = new Date().toISOString();

    const newRecords = validRows.map((row, idx) => ({
      id:              `examSched_${Date.now()}_${idx}`,
      examSessionId,
      examSessionName: examSessionName.trim(),
      examType,
      batchId,
      batchName,
      sessionStartDate,
      sessionEndDate,
      subjectId:       row.subjectId,
      subjectName:     row.subjectName,
      subjectCode:     row.subjectCode || '',
      date:            row.date,
      startTime:       row.startTime,
      endTime:         row.endTime,
      totalMarks:      row.totalMarks || 100,
      passMarks:       row.passMarks  || 50,
      venue:           row.venue || '',
      notes:           row.notes || '',
      status:          'scheduled',
      createdAt:       now
    }));

    const existing = safeLS('pba_exam_schedule', []);
    const updated = [...existing, ...newRecords];
    saveLS('pba_exam_schedule', updated);
    setExamSchedule(updated);
    setShowScheduleModal(false);
  };

════════════════════════════════════════════════════════════════
FIX 4 — EXAM SCHEDULE LIST VIEW: Group by session + batch
════════════════════════════════════════════════════════════════

In the Exam Schedule tab, display sessions grouped by
examSessionId (or examSessionName + batchId) so it looks like:

  ┌──────────────────────────────────────────────────────────┐
  │ 📋 First Term Exam 2026                  Term Test       │
  │ Cambridge O Level 2027  ·  1–14 Sep 2026   3 subjects   │
  │                                                          │
  │  Biology     Tue 1 Sep  09:00–11:00  Hall A  100 / 50   │
  │  Chemistry   Wed 2 Sep  09:00–11:00  Hall A  100 / 50   │
  │  Physics     Thu 3 Sep  14:00–16:00  Hall B  100 / 50   │
  │                                [Enter Results]           │
  └──────────────────────────────────────────────────────────┘

Build the grouped data structure:

  // Group pba_exam_schedule records by examSessionId
  const sessionGroups = (() => {
    const groups = {};
    (examSchedule || []).forEach(record => {
      const key = record.examSessionId || `${record.examSessionName}_${record.batchId}`;
      if (!groups[key]) {
        groups[key] = {
          examSessionId:   record.examSessionId || key,
          examSessionName: record.examSessionName || record.examName || '—',
          examType:        record.examType || '',
          batchId:         record.batchId,
          batchName:       record.batchName || '—',
          sessionStartDate: record.sessionStartDate || '',
          sessionEndDate:   record.sessionEndDate || '',
          subjects: []
        };
      }
      groups[key].subjects.push(record);
    });
    // Sort subjects by date within each group
    Object.values(groups).forEach(g => {
      g.subjects.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    });
    return Object.values(groups).sort((a, b) =>
      (b.subjects[0]?.createdAt || '').localeCompare(a.subjects[0]?.createdAt || '')
    );
  })();

Render each group as a card:

  {sessionGroups.map(group => (
    <div key={group.examSessionId} style={{
      background: 'white', borderRadius: '12px',
      border: '1px solid #E2E8F0', marginBottom: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      {/* Card header */}
      <div style={{
        padding: '14px 18px',
        background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#1A202C', marginBottom: '4px' }}>
            📋 {group.examSessionName}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>🎓 {group.batchName}</span>
            {(group.sessionStartDate && group.sessionEndDate) && (
              <span>📅 {new Date(group.sessionStartDate + 'T12:00:00').toLocaleDateString('en-GB',
                { day: 'numeric', month: 'short' })} –
                {new Date(group.sessionEndDate + 'T12:00:00').toLocaleDateString('en-GB',
                { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            <span>📚 {group.subjects.length} subject{group.subjects.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <span style={{
            padding: '4px 10px', borderRadius: '20px',
            background: '#4F46E5', color: 'white',
            fontSize: '11px', fontWeight: 700
          }}>
            {group.examType}
          </span>
          <button
            onClick={() => handleEnterResults(group)}
            style={{
              padding: '6px 14px', borderRadius: '8px',
              border: 'none', background: '#059669',
              color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
            }}>
            Enter Results
          </button>
        </div>
      </div>

      {/* Subject rows */}
      <div style={{ padding: '4px 0' }}>
        {group.subjects.map((subj, i) => (
          <div key={subj.id} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 0.8fr',
            gap: '8px',
            padding: '10px 18px',
            borderBottom: i < group.subjects.length - 1 ? '1px solid #F1F5F9' : 'none',
            alignItems: 'center'
          }}>
            <div style={{ fontWeight: 700, color: '#1A202C', fontSize: '13px' }}>
              {subj.subjectCode ? `${subj.subjectCode} — ` : ''}{subj.subjectName}
            </div>
            <div style={{ fontSize: '12px', color: '#4B5563' }}>
              {subj.date
                ? new Date(subj.date + 'T12:00:00').toLocaleDateString('en-GB',
                    { weekday: 'short', day: 'numeric', month: 'short' })
                : '—'}
            </div>
            <div style={{ fontSize: '12px', color: '#4B5563' }}>
              {subj.startTime || '—'} – {subj.endTime || '—'}
            </div>
            <div style={{ fontSize: '12px', color: '#4B5563' }}>
              {subj.venue || '—'}
            </div>
            <div style={{ fontSize: '12px', color: '#4B5563' }}>
              {subj.totalMarks} / {subj.passMarks} pass
            </div>
            <div>
              <span style={{
                padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700,
                background: (subj.status || '') === 'results_entered' ? '#D1FAE5' : '#FEF3C7',
                color: (subj.status || '') === 'results_entered' ? '#065F46' : '#92400E'
              }}>
                {(subj.status || '') === 'results_entered' ? '✓ Done' : '⏳ Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}

  {sessionGroups.length === 0 && (
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

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ExamManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL useState calls that read localStorage MUST use lazy initializer:
   useState(() => safeLS('key', []))
5. ALL array operations must guard against null:
   (array || []).filter(...)
6. The batch dropdown MUST read from 'pba_batches' — the same key
   Batch Manager uses — with a useEffect refresh on mount
7. batchSubjectOptions MUST come from batch.subjects[] (the subjects
   assigned to that specific batch), not from pba_subjects directly
8. Each subject row saved to pba_exam_schedule gets its own id but
   shares the same examSessionId — this lets mark entry and results
   still work by querying on examSessionId + subjectId
9. Existing records in pba_exam_schedule that do NOT have an
   examSessionId should still render — group them by
   (examSessionName || examName) + batchId as the fallback key
10. Run npm run build and confirm 0 errors
11. Then npm run deploy to push to GitHub and trigger Vercel deployment
12. List all files modified
```
