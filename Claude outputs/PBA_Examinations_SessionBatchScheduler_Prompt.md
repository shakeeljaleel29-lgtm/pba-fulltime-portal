# PBA Full-Time Portal — Examinations: Session+Batch Scheduler with Multi-Paper Support
## AntiGravity Prompt

---

```
Rebuild the "Schedule New Examination" modal in ExamManagementView.jsx
with the correct flow AND multi-paper support per subject.

Touch ONLY ExamManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE CORRECT EXAM SCHEDULING FLOW
════════════════════════════════════════════════════════════════

WRONG (current modal):
  SELECT SUBJECT → EXAM NAME → TYPE → BATCH → DATE → TIME → MARKS

CORRECT (what we need):
  Step 1: Name the exam session    e.g. "First Term Exam 2026"
  Step 2: Select batch             e.g. "Cambridge O Level 2027"
  Step 3: Set exam period          e.g. 2026-09-01 → 2026-09-14
  Step 4: Select which subjects    checkboxes from batch.subjects[]
  Step 5: Per subject — add papers e.g. Biology → Paper 1 (MCQ) + Paper 2 (Essay)
                                        Chemistry → Paper 1 only
  SAVE → writes one pba_exam_schedule record per paper

════════════════════════════════════════════════════════════════
DATA MODEL
════════════════════════════════════════════════════════════════

pba_exam_schedule record (one per paper):
  {
    id:               'examrec_1234567890_0',
    examSessionId:    'examSession_1234567890',   ← groups all records for this session
    examSessionName:  'First Term Exam 2026',
    examType:         'Internal' | 'External' | 'Mock' | 'Trial',
    batchId:          'batch_xyz',
    batchName:        'Cambridge O Level 2027',
    sessionStartDate: '2026-09-01',
    sessionEndDate:   '2026-09-14',
    subjectId:        'sub_bio',
    subjectCode:      'BIO',
    subjectName:      'Biology',
    paperNumber:      1,                           ← 1, 2, 3, ...
    paperName:        'Paper 1 (MCQ)',             ← user-entered label
    date:             '2026-09-03',
    startTime:        '09:00',
    endTime:          '10:30',
    totalMarks:       40,
    passMarks:        20,
    venue:            'Hall A',
    notes:            '',
    status:           'Scheduled',                 ← 'Scheduled' | 'Completed' | 'Cancelled'
    createdAt:        '2026-09-01T10:00:00.000Z'
  }

localStorage key: 'pba_exam_schedule'  (array of above records)

════════════════════════════════════════════════════════════════
FORM STATE (inside component)
════════════════════════════════════════════════════════════════

Add these to the component:

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

  const [showScheduleModal, setShowScheduleModal] = useState(false);

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

  const [batches, setBatches] = useState(() => safeLS('pba_batches', []));

  const [examSchedule, setExamSchedule] = useState(
    () => safeLS('pba_exam_schedule', [])
  );

  useEffect(() => {
    setExamSchedule(safeLS('pba_exam_schedule', []));
  }, []);

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

════════════════════════════════════════════════════════════════
MODAL OPEN HANDLER
════════════════════════════════════════════════════════════════

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

════════════════════════════════════════════════════════════════
SAVE HANDLER
════════════════════════════════════════════════════════════════

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

════════════════════════════════════════════════════════════════
MODAL JSX — "Schedule New Examination"
════════════════════════════════════════════════════════════════

Render as a large modal overlay:
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000
  Inner box: width: '860px', maxHeight: '90vh', overflowY: 'auto',
             margin: 'auto', marginTop: '40px', borderRadius: '14px',
             background: 'white'

─────────────────────────────────────────────
MODAL HEADER
─────────────────────────────────────────────

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

─────────────────────────────────────────────
STEP 1: EXAM SESSION NAME + TYPE  (inside padding div: padding: '0 24px', marginTop: '20px')
─────────────────────────────────────────────

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

─────────────────────────────────────────────
STEP 2: SELECT BATCH
─────────────────────────────────────────────

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

─────────────────────────────────────────────
STEP 3: EXAM PERIOD (DATE RANGE)
─────────────────────────────────────────────

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

─────────────────────────────────────────────
STEP 4: SELECT SUBJECTS (pill checkboxes) — only shown when batchId selected
─────────────────────────────────────────────

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

─────────────────────────────────────────────
STEP 5: PER-SUBJECT PAPER SCHEDULING — only shown when subjects selected
─────────────────────────────────────────────

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

─────────────────────────────────────────────
MODAL FOOTER
─────────────────────────────────────────────

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

════════════════════════════════════════════════════════════════
SESSION LIST — grouping by examSessionId + nested paper display
════════════════════════════════════════════════════════════════

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
      if (!map[r.subjectId]) {
        map[r.subjectId] = {
          subjectId: r.subjectId,
          subjectCode: r.subjectCode || '',
          subjectName: r.subjectName || '',
          papers: []
        };
      }
      map[r.subjectId].papers.push(r);
    });
    Object.values(map).forEach(sub => {
      sub.papers.sort((a, b) => (a.paperNumber || 0) - (b.paperNumber || 0));
    });
    return Object.values(map);
  };

SESSION CARD for each group:

  {(sessionGroups || []).map(group => {
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
            <div key={sub.subjectId} style={{ marginBottom: '14px' }}>
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
              onClick={() => { /* TODO: open results entry for examSessionId */ }}
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

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1.  Touch ONLY ExamManagementView.jsx
2.  Use only inline style={{}} — no Tailwind
3.  safeLS() for ALL localStorage reads; saveLS() for writes
4.  ALL useState calls that read localStorage MUST use lazy initializer:
    useState(() => safeLS('key', []))
5.  ALL array operations must guard against null:
    (array || []).filter(...), (array || []).map(...)
6.  The scheduling flow is ALWAYS:
    Name session → Select batch → Set period → Pick subjects → Add papers
    NEVER subject-first
7.  Each paper in papers[] saves as a SEPARATE pba_exam_schedule record.
    They all share the same examSessionId for grouping.
8.  paperName is user-editable (e.g. "Paper 1 (MCQ)", "Paper 2 (Essay)")
9.  paperNumber is auto-derived: pIdx + 1 (1-based index within subject)
10. At least date + startTime + endTime are required to save a paper.
    Papers missing these are silently skipped.
11. emptyPaper and emptySubjectRow must be defined as functions (not
    constants) so they produce fresh objects on each call.
12. The useEffect syncing selectedSubjectIds → subjectRows MUST preserve
    existing paper data for subjects that remain checked.
13. On modal OPEN (openScheduleModal), always reset to fresh empty state.
14. Session list groups by examSessionId; within each group, subjects are
    grouped by subjectId; papers are sorted by paperNumber within subject.
15. Backward compat: old records without examSessionId are keyed by
    examSessionName + batchId. Old records without paperName fall back
    to "Paper {paperNumber || 1}".
16. Run npm run build and confirm 0 errors
17. Then npm run deploy to push to GitHub and trigger Vercel deployment
18. List all files modified
```
