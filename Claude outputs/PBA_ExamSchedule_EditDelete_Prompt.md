# PBA Full-Time Portal — Exam Schedule: Edit & Delete Sessions
## AntiGravity Prompt

---

```
Add Edit and Delete capability to the Exam Schedule tab in
ExamManagementView.jsx.

The Exam Schedule tab ALREADY EXISTS showing session cards
(purple header with session name + batch + date range + papers done badge)
with paper cards nested under each subject section.

DO NOT rebuild the schedule. ADD the following:
  (1) "✏️ Edit Session" button on each session card header
      → reopens the Schedule New Exam modal pre-filled with all existing data
      → saving REPLACES the old records for that examSessionId
  (2) "🗑️ Delete Session" button on each session card header
      → confirmation modal → deletes ALL pba_exam_schedule records
        for that examSessionId AND all pba_exam_results for it
  (3) "✏️" icon button on each paper card
      → opens a compact Edit Paper modal for that one paper's details
        (date, startTime, endTime, totalMarks, passMarks, venue)
  (4) "×" delete button on each paper card
      → confirmation → deletes that single paper record from pba_exam_schedule

Touch ONLY ExamManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
STATE TO ADD
════════════════════════════════════════════════════════════════

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

════════════════════════════════════════════════════════════════
FIX 1 — SESSION CARD HEADER: Add Edit + Delete buttons
════════════════════════════════════════════════════════════════

FIND the session card header JSX (the purple/indigo gradient div
that shows the session name and batch name) and ADD two buttons
in the top-right area, alongside or near the "papers done" badge:

  {/* Edit + Delete buttons — top-right of session header */}
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

    {/* Papers done badge — keep existing */}
    <span style={{ /* existing badge styles */ }}>
      {/* existing papers done count */}
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

        // Set the exam modal form state
        // (these state variables come from your existing new-exam modal)
        setExamSession(prev => ({
          ...prev,
          name:       first.examSessionName || '',
          batchId:    first.batchId         || '',
          batchName:  first.batchName       || '',
          examType:   first.examType        || 'Internal',
          startDate:  first.periodStart     || '',
          endDate:    first.periodEnd       || ''
        }));
        setSelectedSubjectIds(Object.keys(subjectMap));
        setSubjectRows(loadedSubjectRows);
        setEditExamSessionId(group.examSessionId);
        setShowExamModal(true); // or whatever state opens the modal
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

════════════════════════════════════════════════════════════════
FIX 2 — EXISTING SAVE HANDLER: Support Edit mode (REPLACE records)
════════════════════════════════════════════════════════════════

FIND handleSaveExamSession() (or whatever function saves the
new exam modal). It currently pushes new records into pba_exam_schedule.

ADD edit-mode logic at the START of the save function:

  const handleSaveExamSession = () => {
    // ... existing validation ...

    // Determine the examSessionId
    const sessionId = editExamSessionId
      ? editExamSessionId                          // EDIT: reuse existing ID
      : `examSession_${Date.now()}`;               // CREATE: new ID

    // Build records (same as before, but using sessionId above)
    const newRecords = [];
    (subjectRows || []).forEach(sub => {
      (sub.papers || []).forEach(paper => {
        newRecords.push({
          id:              `esr_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
          examSessionId:   sessionId,
          examSessionName: examSession.name.trim(),
          batchId:         examSession.batchId,
          batchName:       examSession.batchName,
          examType:        examSession.examType,
          periodStart:     examSession.startDate,
          periodEnd:       examSession.endDate,
          subjectId:       sub.subjectId,
          subjectCode:     sub.subjectCode || '',
          subjectName:     sub.subjectName || '',
          paperNumber:     paper.paperNumber,
          paperName:       paper.paperName  || `Paper ${paper.paperNumber}`,
          date:            paper.date        || '',
          startTime:       paper.startTime   || '',
          endTime:         paper.endTime     || '',
          totalMarks:      Number(paper.totalMarks) || 100,
          passMarks:       Number(paper.passMarks)  || 40,
          venue:           paper.venue       || '',
          status:          'Pending',
          createdAt:       new Date().toISOString()
        });
      });
    });

    const existing = safeLS('pba_exam_schedule', []);

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
    setExamSchedule(updated);

    // Reset modal state
    setEditExamSessionId(null);
    setShowExamModal(false);
    // ... rest of existing reset logic ...
  };

ALSO: when the modal is CLOSED (cancel button / × button), reset editExamSessionId:

  onClick={() => {
    setShowExamModal(false);
    setEditExamSessionId(null);
    // ... rest of existing close logic ...
  }}

ALSO: update the modal title/save button text based on mode:

  <div style={{ fontWeight: 800, fontSize: '17px', color: 'white' }}>
    {editExamSessionId ? '✏️ Edit Exam Session' : '+ Schedule New Exam'}
  </div>

  // Save button:
  {editExamSessionId ? 'Save Changes' : 'Schedule Exam Session'}

════════════════════════════════════════════════════════════════
FIX 3 — DELETE SESSION CONFIRMATION MODAL
════════════════════════════════════════════════════════════════

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

════════════════════════════════════════════════════════════════
FIX 4 — PAPER CARD: Add Edit + Delete buttons
════════════════════════════════════════════════════════════════

FIND the paper card JSX (the white card showing "paper 1 · Pending ·
📅 date · 🕐 time · Marks: X/Y") and ADD small icon buttons:

  <div style={{ position: 'relative' }}>

    {/* Existing paper card content */}
    <div style={{ /* existing card styles */ }}>
      {/* ...existing content... */}
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
  </div>

════════════════════════════════════════════════════════════════
FIX 5 — EDIT PAPER MODAL (single paper details)
════════════════════════════════════════════════════════════════

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
          <button onClick={() => setShowEditPaper(false)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', borderRadius: '6px', padding: '4px 12px',
              cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>

        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column',
          gap: '14px' }}>

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
            <button onClick={() => setShowEditPaper(false)}
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
                setExamSchedule(updated);
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

════════════════════════════════════════════════════════════════
FIX 6 — DELETE SINGLE PAPER CONFIRMATION MODAL
════════════════════════════════════════════════════════════════

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
              // Delete the paper schedule record
              const schedExisting = safeLS('pba_exam_schedule', []);
              saveLS('pba_exam_schedule',
                (schedExisting || []).filter(r => r.id !== deletePaperTarget.id));
              // Delete matching result records
              const resExisting = safeLS('pba_exam_results', []);
              saveLS('pba_exam_results',
                (resExisting || []).filter(r =>
                  !(r.examSessionId === deletePaperTarget.examSessionId &&
                    r.subjectId     === deletePaperTarget.subjectId &&
                    Number(r.paperNumber) === Number(deletePaperTarget.paperNumber))
                )
              );
              setExamSchedule(safeLS('pba_exam_schedule', []));
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

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1.  Touch ONLY ExamManagementView.jsx
2.  Use only inline style={{}} — no Tailwind
3.  safeLS() for ALL localStorage reads; saveLS() for writes
4.  ALL array ops must guard null: (array || []).filter(...)
5.  Edit Session uses the SAME modal as Schedule New Exam.
    The modal title and save button text change based on editExamSessionId.
    When editing, the save handler REPLACES all records for that examSessionId
    (removes old, inserts new) using the SAME examSessionId so pba_exam_results
    records that reference it by examSessionId remain linked.
6.  Edit Paper modal edits ONE paper record by its record `id` (r.id).
    It does NOT touch pba_exam_results — only the schedule record changes.
7.  Delete Session removes ALL pba_exam_schedule records with that
    examSessionId AND ALL pba_exam_results with that examSessionId.
8.  Delete Paper removes ONE pba_exam_schedule record by id AND the
    matching pba_exam_results records (same examSessionId + subjectId + paperNumber).
9.  The edit/delete icons on paper cards are small and unobtrusive —
    positioned in the top-right corner of the paper card only.
10. If subjectRows and selectedSubjectIds are controlled by useState in
    the modal, ensure they are properly set when opening in Edit mode
    (see the onClick handler in FIX 1).
11. Run npm run build and confirm 0 errors
12. Then npm run deploy to push to GitHub and trigger Vercel deployment
13. List all files modified
```
