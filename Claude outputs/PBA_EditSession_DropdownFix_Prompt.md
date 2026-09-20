# PBA Full-Time Portal — Edit Session: Subject & Lecturer Dropdowns Fix
## AntiGravity Prompt

---

```
Fix the Edit Session modal so that Subject and Lecturer dropdowns
populate correctly based on the selected Batch.
Touch ONLY GeneralAdminView.jsx (the file containing the timetable
session scheduler / Visual Timetable Builder).
Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE PROBLEM
════════════════════════════════════════════════════════════════

In the Edit Session modal (General Admin → Visual Timetable Builder):

  BATCH:    "Cambridge O Level 2027 (COL-27)"  ← populated ✓
  SUBJECT:  [blank dropdown]                   ← NOT populated ✗
  LECTURER: "— Select Lecturer —"              ← NOT filtered ✗

The SUBJECT dropdown is empty because it is not reading from
the selected batch's assigned subjects.

The LECTURER dropdown shows no options because it is not filtering
lecturers by the selected subject.

════════════════════════════════════════════════════════════════
ROOT CAUSE
════════════════════════════════════════════════════════════════

The dropdown is likely using a static list or reading from a
wrong data source. The correct data chain is:

  pba_batches → find selected batch → batch.subjects[]
  → each subject: { subjectId, subjectName, lecturerId, assistantId }
  → Subject dropdown lists batch.subjects
  → Lecturer dropdown filters pba_lecturers by the selected subject

════════════════════════════════════════════════════════════════
THE FIX — Full cascade logic for Edit Session modal
════════════════════════════════════════════════════════════════

STEP 1 — Load data at the top of the component (lazy initializers):

  const [batches, setBatches] = useState(() => safeLS('pba_batches', []));
  const [lecturers, setLecturers] = useState(() => safeLS('pba_lecturers', []));
  const [subjects, setSubjects] = useState(() => safeLS('pba_subjects', []));

STEP 2 — Session form state (for the Edit Session modal):

  const [sessionForm, setSessionForm] = useState({
    batchId: '',
    subjectId: '',
    lecturerId: '',
    assistantId: '',
    day: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
    recurrence: 'weekly',
    startDate: '',
    endDate: '',
    classroomId: '',
    sessionType: 'Class',
    locked: false
  });

  When opening an existing session for editing, pre-fill all fields
  from the existing session record.

STEP 3 — Derived lists that cascade from selections:

  // Subjects available for the selected batch
  const selectedBatch = (batches || []).find(b => b.id === sessionForm.batchId);
  const batchSubjects = selectedBatch?.subjects || [];
  // batchSubjects is an array of:
  //   { subjectId, subjectName, subjectCode, lecturerId, assistantId }

  // Lecturers available for the selected subject
  // First try: use the lecturerId already assigned to this subject in the batch
  // Second: filter pba_lecturers whose subjects[] includes the selected subjectId
  const availableLecturers = (lecturers || []).filter(l =>
    (l.subjects || []).includes(sessionForm.subjectId) ||
    batchSubjects.find(bs =>
      bs.subjectId === sessionForm.subjectId && bs.lecturerId === l.id
    )
  );
  // Fallback: if no filtered lecturers found, show ALL lecturers
  const lecturerOptions = availableLecturers.length > 0
    ? availableLecturers
    : (lecturers || []);

STEP 4 — Auto-fill Lecturer when Subject is selected:

  When sessionForm.subjectId changes:
    const assignedSubject = batchSubjects.find(
      bs => bs.subjectId === sessionForm.subjectId
    );
    if (assignedSubject?.lecturerId) {
      setSessionForm(prev => ({
        ...prev,
        lecturerId: assignedSubject.lecturerId,
        assistantId: assignedSubject.assistantId || ''
      }));
    } else {
      setSessionForm(prev => ({ ...prev, lecturerId: '', assistantId: '' }));
    }

  Implement this as a useEffect:
    useEffect(() => {
      if (!sessionForm.subjectId) return;
      const assignedSubject = batchSubjects.find(
        bs => bs.subjectId === sessionForm.subjectId
      );
      if (assignedSubject?.lecturerId) {
        setSessionForm(prev => ({
          ...prev,
          lecturerId: assignedSubject.lecturerId,
          assistantId: assignedSubject.assistantId || ''
        }));
      }
    }, [sessionForm.subjectId]);

  When sessionForm.batchId changes, reset subject and lecturer:
    useEffect(() => {
      setSessionForm(prev => ({
        ...prev,
        subjectId: '',
        lecturerId: '',
        assistantId: ''
      }));
    }, [sessionForm.batchId]);

STEP 5 — BATCH dropdown:

  <select
    value={sessionForm.batchId}
    onChange={e => setSessionForm(prev => ({ ...prev, batchId: e.target.value }))}
    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px',
      border: '1px solid #E3E6EA', fontSize: '13px' }}>
    <option value="">— Select Batch —</option>
    {(batches || []).map(b => (
      <option key={b.id} value={b.id}>{b.name} ({b.shortCode})</option>
    ))}
  </select>

STEP 6 — SUBJECT dropdown (cascades from BATCH):

  <select
    value={sessionForm.subjectId}
    onChange={e => setSessionForm(prev => ({ ...prev, subjectId: e.target.value }))}
    disabled={!sessionForm.batchId}
    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px',
      border: '1px solid #E3E6EA', fontSize: '13px',
      opacity: !sessionForm.batchId ? 0.5 : 1 }}>
    <option value="">— Select Subject —</option>
    {(batchSubjects || []).map(bs => (
      <option key={bs.subjectId} value={bs.subjectId}>
        {bs.subjectName} ({bs.subjectCode})
      </option>
    ))}
  </select>

  If batchSubjects is empty (batch has no assigned subjects yet),
  show a helper message instead:
  {sessionForm.batchId && batchSubjects.length === 0 && (
    <p style={{ fontSize: '11px', color: '#E53E3E', marginTop: '4px' }}>
      ⚠ No subjects assigned to this batch yet.
      Go to Batch Manager → Edit Batch → Assign Subjects first.
    </p>
  )}

STEP 7 — LECTURER dropdown (cascades from SUBJECT):

  <select
    value={sessionForm.lecturerId}
    onChange={e => setSessionForm(prev => ({ ...prev, lecturerId: e.target.value }))}
    disabled={!sessionForm.subjectId}
    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px',
      border: '1px solid #E3E6EA', fontSize: '13px',
      opacity: !sessionForm.subjectId ? 0.5 : 1 }}>
    <option value="">— Select Lecturer —</option>
    {(lecturerOptions || []).map(l => (
      <option key={l.id} value={l.id}>{l.name}</option>
    ))}
  </select>

STEP 8 — ASSISTANT dropdown (optional, same list as lecturers):

  <select
    value={sessionForm.assistantId || ''}
    onChange={e => setSessionForm(prev => ({ ...prev, assistantId: e.target.value }))}
    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px',
      border: '1px solid #E3E6EA', fontSize: '13px' }}>
    <option value="">— No Assistant —</option>
    {(lecturers || []).map(l => (
      <option key={l.id} value={l.id}>{l.name}</option>
    ))}
  </select>

════════════════════════════════════════════════════════════════
ALSO FIX — Save Session should store full resolved names
════════════════════════════════════════════════════════════════

When saving the session to pba_timetable, resolve names at save time
so the timetable grid can display them without re-joining:

  const batch = batches.find(b => b.id === sessionForm.batchId);
  const subject = batchSubjects.find(bs => bs.subjectId === sessionForm.subjectId);
  const lecturer = lecturers.find(l => l.id === sessionForm.lecturerId);
  const assistant = lecturers.find(l => l.id === sessionForm.assistantId);
  const classroom = classrooms.find(c => c.id === sessionForm.classroomId);

  const sessionToSave = {
    id: editingSession?.id || Date.now().toString(),
    batchId: sessionForm.batchId,
    batchName: batch?.name || '',
    batchShortCode: batch?.shortCode || '',
    subjectId: sessionForm.subjectId,
    subjectName: subject?.subjectName || '',
    subjectCode: subject?.subjectCode || '',
    lecturerId: sessionForm.lecturerId,
    lecturerName: lecturer?.name || '',
    assistantId: sessionForm.assistantId || '',
    assistantName: assistant?.name || '',
    day: sessionForm.day,
    startTime: sessionForm.startTime,
    endTime: sessionForm.endTime,
    recurrence: sessionForm.recurrence,
    startDate: sessionForm.startDate || '',
    endDate: sessionForm.endDate || '',
    classroomId: sessionForm.classroomId,
    classroomName: classroom?.name || '',
    sessionType: sessionForm.sessionType,
    locked: sessionForm.locked || false,
    createdOn: editingSession?.createdOn || new Date().toISOString()
  };

  const existing = safeLS('pba_timetable', []);
  const updated = editingSession
    ? existing.map(s => s.id === sessionToSave.id ? sessionToSave : s)
    : [...existing, sessionToSave];
  saveLS('pba_timetable', updated);

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL useState calls that read localStorage must use lazy initializer:
   useState(() => safeLS('key', []))
5. The cascade order is strict: Batch → Subject → Lecturer
   Changing Batch resets Subject and Lecturer.
   Changing Subject resets Lecturer (but auto-fills if the batch
   already has a lecturer assigned to that subject).
6. Run npm run build and confirm 0 errors
7. Then run npm run deploy to push to GitHub and trigger Vercel deployment
8. List all files modified
```
