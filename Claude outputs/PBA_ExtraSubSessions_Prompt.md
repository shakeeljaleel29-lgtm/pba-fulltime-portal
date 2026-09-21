# PBA Full-Time Portal — Extra Classes & Substitution Sessions
## AntiGravity Prompt

---

```
Add one-off Extra and Substitution sessions to GeneralAdminView.jsx.
These are separate from the recurring pba_timetable schedule.
Also update LecturerManagementView.jsx so the Session Log shows them.
Touch ONLY GeneralAdminView.jsx and LecturerManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
TWO SESSION TYPES BEING ADDED
════════════════════════════════════════════════════════════════

1. SUBSTITUTION (🔄 SUB)
   A lecturer is absent. Another lecturer covers their class.
   - Same scheduled time slot, different lecturer
   - Happens on weekdays (already in the timetable)
   - The original session still exists in pba_timetable
   - The sub session is a one-off record pointing to the original

2. EXTRA CLASS (⚡ EXTRA)
   An additional class on top of the regular schedule.
   - Can be on ANY day including Saturday and Sunday
   - No corresponding timetable session
   - May be held because: catching up on missed content, exam prep,
     or additional tuition

Both types are stored in pba_extra_sessions (new localStorage key).
They do NOT modify pba_timetable.

════════════════════════════════════════════════════════════════
DATA MODEL — pba_extra_sessions
════════════════════════════════════════════════════════════════

Each record:
  {
    id: 'extra_' + Date.now(),
    type: 'substitution' | 'extra',
    date: 'YYYY-MM-DD',          // specific calendar date
    startTime: '09:00',
    endTime: '11:00',
    batchId: '...',
    batchName: '...',
    subjectId: '...',
    subjectName: '...',
    lecturerId: '...',           // who is TEACHING the session
    lecturerName: '...',
    classroomId: '...',
    classroomName: '...',
    notes: '...',

    // For substitution only:
    absentLecturerId: '...',     // who is absent
    absentLecturerName: '...',
    originalSessionId: '...',    // pba_timetable session being covered
                                 // (optional — may not always be known)
  }

════════════════════════════════════════════════════════════════
FIX 1 — STATE
════════════════════════════════════════════════════════════════

Add to component top (alongside existing state):

  const [extraSessions, setExtraSessions] =
    useState(() => safeLS('pba_extra_sessions', []));

  const [showExtraModal, setShowExtraModal] = useState(false);

  const [extraForm, setExtraForm] = useState({
    type: 'extra',
    date: '',
    startTime: '',
    endTime: '',
    batchId: '',
    batchName: '',
    subjectId: '',
    subjectName: '',
    lecturerId: '',
    lecturerName: '',
    classroomId: '',
    classroomName: '',
    absentLecturerId: '',
    absentLecturerName: '',
    originalSessionId: '',
    notes: ''
  });

  const [editExtraId, setEditExtraId] = useState(null);
  // null = creating new; string = editing existing extra session id

════════════════════════════════════════════════════════════════
FIX 2 — "+ Extra / Sub Class" button
════════════════════════════════════════════════════════════════

In the Daily Allocation Sheet header (next to "Share via WhatsApp"),
add a button to create a new extra or sub session for the
currently displayed date:

  <button
    onClick={() => {
      setEditExtraId(null);
      setExtraForm({
        type: 'extra',
        date: allocDateStr,   // pre-fill with the sheet's current date
        startTime: '',
        endTime: '',
        batchId: '',
        batchName: '',
        subjectId: '',
        subjectName: '',
        lecturerId: '',
        lecturerName: '',
        classroomId: '',
        classroomName: '',
        absentLecturerId: '',
        absentLecturerName: '',
        originalSessionId: '',
        notes: ''
      });
      setShowExtraModal(true);
    }}
    style={{
      padding: '9px 16px', borderRadius: '10px', cursor: 'pointer',
      background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
      color: 'white', border: 'none', fontWeight: 700, fontSize: '13px',
      display: 'flex', alignItems: 'center', gap: '6px'
    }}>
    ⚡ Add Extra / Sub
  </button>

════════════════════════════════════════════════════════════════
FIX 3 — Extra / Sub Session Modal
════════════════════════════════════════════════════════════════

Add this modal JSX at the component root level (outside the table):

  {showExtraModal && (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 9995, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '18px', padding: '32px',
        width: '100%', maxWidth: '520px', maxHeight: '90vh',
        overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800,
          color: '#111827' }}>
          {editExtraId ? 'Edit Session' : 'Schedule Extra / Sub Class'}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#6B7280' }}>
          One-off session — does not affect the recurring timetable.
        </p>

        {/* TYPE selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700,
            color: '#374151', textTransform: 'uppercase',
            letterSpacing: '0.05em', display: 'block',
            marginBottom: '8px' }}>
            SESSION TYPE
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { value: 'extra', label: '⚡ Extra Class',
                desc: 'Additional class, any day' },
              { value: 'substitution', label: '🔄 Substitution',
                desc: 'Covering for absent lecturer' }
            ].map(opt => (
              <label key={opt.value} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                gap: '3px', padding: '12px', borderRadius: '10px',
                cursor: 'pointer',
                border: extraForm.type === opt.value
                  ? '2px solid #7C3AED' : '1px solid #E3E6EA',
                background: extraForm.type === opt.value
                  ? '#F5F3FF' : 'white'
              }}>
                <input type="radio" name="extraType" value={opt.value}
                  checked={extraForm.type === opt.value}
                  onChange={() => setExtraForm(p => ({
                    ...p, type: opt.value }))}
                  style={{ display: 'none' }} />
                <span style={{ fontWeight: 700, fontSize: '13px',
                  color: extraForm.type === opt.value
                    ? '#7C3AED' : '#374151' }}>
                  {opt.label}
                </span>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  {opt.desc}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* DATE */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700,
            color: '#374151', textTransform: 'uppercase',
            letterSpacing: '0.05em', display: 'block',
            marginBottom: '6px' }}>
            DATE {extraForm.type === 'extra' &&
              <span style={{ color: '#7C3AED', fontWeight: 400,
                textTransform: 'none', fontSize: '11px' }}>
                (weekends allowed)
              </span>}
          </label>
          <input
            type="date"
            value={extraForm.date}
            onChange={e => setExtraForm(p => ({ ...p, date: e.target.value }))}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: '1px solid #E3E6EA', fontSize: '14px',
              background: 'white', boxSizing: 'border-box'
            }} />
        </div>

        {/* TIME row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: 700,
              color: '#374151', textTransform: 'uppercase',
              letterSpacing: '0.05em', display: 'block',
              marginBottom: '6px' }}>
              START TIME
            </label>
            <input type="time" value={extraForm.startTime}
              onChange={e => setExtraForm(p =>
                ({ ...p, startTime: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px',
                borderRadius: '8px', border: '1px solid #E3E6EA',
                fontSize: '14px', background: 'white',
                boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: 700,
              color: '#374151', textTransform: 'uppercase',
              letterSpacing: '0.05em', display: 'block',
              marginBottom: '6px' }}>
              END TIME
            </label>
            <input type="time" value={extraForm.endTime}
              onChange={e => setExtraForm(p =>
                ({ ...p, endTime: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px',
                borderRadius: '8px', border: '1px solid #E3E6EA',
                fontSize: '14px', background: 'white',
                boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* BATCH */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700,
            color: '#374151', textTransform: 'uppercase',
            letterSpacing: '0.05em', display: 'block',
            marginBottom: '6px' }}>
            BATCH
          </label>
          <select
            value={extraForm.batchId}
            onChange={e => {
              const b = (safeLS('pba_batches', []) || [])
                .find(b => b.id === e.target.value);
              setExtraForm(p => ({
                ...p, batchId: e.target.value,
                batchName: b?.name || ''
              }));
            }}
            style={{ width: '100%', padding: '10px 12px',
              borderRadius: '8px', border: '1px solid #E3E6EA',
              fontSize: '14px', background: 'white' }}>
            <option value="">— Select Batch —</option>
            {(safeLS('pba_batches', []) || []).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* SUBJECT */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700,
            color: '#374151', textTransform: 'uppercase',
            letterSpacing: '0.05em', display: 'block',
            marginBottom: '6px' }}>
            SUBJECT
          </label>
          <select
            value={extraForm.subjectId}
            onChange={e => {
              const s = (safeLS('pba_subjects', []) || [])
                .find(s => s.id === e.target.value);
              setExtraForm(p => ({
                ...p, subjectId: e.target.value,
                subjectName: s?.name || s?.subjectName || ''
              }));
            }}
            style={{ width: '100%', padding: '10px 12px',
              borderRadius: '8px', border: '1px solid #E3E6EA',
              fontSize: '14px', background: 'white' }}>
            <option value="">— Select Subject —</option>
            {(safeLS('pba_subjects', []) || []).map(s => (
              <option key={s.id} value={s.id}>
                {s.name || s.subjectName}
              </option>
            ))}
          </select>
        </div>

        {/* TEACHING LECTURER */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700,
            color: '#374151', textTransform: 'uppercase',
            letterSpacing: '0.05em', display: 'block',
            marginBottom: '6px' }}>
            {extraForm.type === 'substitution'
              ? 'SUBSTITUTE LECTURER (teaching this session)'
              : 'LECTURER'}
          </label>
          <select
            value={extraForm.lecturerId}
            onChange={e => {
              const l = (lecturers || []).find(l => l.id === e.target.value);
              setExtraForm(p => ({
                ...p, lecturerId: e.target.value,
                lecturerName: l?.name || ''
              }));
            }}
            style={{ width: '100%', padding: '10px 12px',
              borderRadius: '8px', border: '1px solid #E3E6EA',
              fontSize: '14px', background: 'white' }}>
            <option value="">— Select Lecturer —</option>
            {(lecturers || []).map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* ABSENT LECTURER — only for substitution */}
        {extraForm.type === 'substitution' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700,
              color: '#DC2626', textTransform: 'uppercase',
              letterSpacing: '0.05em', display: 'block',
              marginBottom: '6px' }}>
              ABSENT LECTURER (being covered)
            </label>
            <select
              value={extraForm.absentLecturerId}
              onChange={e => {
                const l = (lecturers || []).find(l => l.id === e.target.value);
                setExtraForm(p => ({
                  ...p, absentLecturerId: e.target.value,
                  absentLecturerName: l?.name || ''
                }));
              }}
              style={{ width: '100%', padding: '10px 12px',
                borderRadius: '8px', border: '1px solid #FCA5A5',
                fontSize: '14px', background: '#FFF7F7' }}>
              <option value="">— Select Absent Lecturer —</option>
              {(lecturers || [])
                .filter(l => l.id !== extraForm.lecturerId)
                .map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
            </select>
          </div>
        )}

        {/* CLASSROOM */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700,
            color: '#374151', textTransform: 'uppercase',
            letterSpacing: '0.05em', display: 'block',
            marginBottom: '6px' }}>
            CLASSROOM
          </label>
          <select
            value={extraForm.classroomId}
            onChange={e => {
              const c = (classrooms || []).find(c => c.id === e.target.value);
              setExtraForm(p => ({
                ...p, classroomId: e.target.value,
                classroomName: c?.name || ''
              }));
            }}
            style={{ width: '100%', padding: '10px 12px',
              borderRadius: '8px', border: '1px solid #E3E6EA',
              fontSize: '14px', background: 'white' }}>
            <option value="">— Select Classroom —</option>
            {(classrooms || []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* NOTES */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700,
            color: '#374151', textTransform: 'uppercase',
            letterSpacing: '0.05em', display: 'block',
            marginBottom: '6px' }}>
            NOTES (optional)
          </label>
          <textarea
            value={extraForm.notes}
            onChange={e => setExtraForm(p =>
              ({ ...p, notes: e.target.value }))}
            placeholder={
              extraForm.type === 'substitution'
                ? 'e.g. Dr. Shak absent — stomach bug'
                : 'e.g. Exam revision — Paper 2 MCQs'
            }
            rows={2}
            style={{ width: '100%', padding: '10px 12px',
              borderRadius: '8px', border: '1px solid #E3E6EA',
              fontSize: '13px', resize: 'vertical',
              boxSizing: 'border-box' }} />
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              if (!extraForm.date || !extraForm.startTime ||
                  !extraForm.lecturerId) return;

              const existing = safeLS('pba_extra_sessions', []);
              let updated;

              if (editExtraId) {
                // Edit existing
                updated = (existing || []).map(s =>
                  s.id === editExtraId ? { ...s, ...extraForm } : s
                );
              } else {
                // Create new
                const newSession = {
                  ...extraForm,
                  id: 'extra_' + Date.now()
                };
                updated = [...(existing || []), newSession];
              }

              saveLS('pba_extra_sessions', updated);
              setExtraSessions(updated);

              // Sync to academic calendar
              const calEvents = safeLS('pba_calendar_events', []);
              const sessionId = editExtraId ||
                updated[updated.length - 1]?.id;
              const cleaned = (calEvents || []).filter(
                e => !(e.sourceType === 'extra_session' &&
                       e.sourceId === sessionId)
              );
              const badge = extraForm.type === 'substitution'
                ? '🔄 SUB' : '⚡ EXTRA';
              const calEvent = {
                id: `extra_session_${sessionId}`,
                title: `${badge} — ${extraForm.subjectName || 'Class'} · ${extraForm.batchName || ''}`,
                date: extraForm.date,
                type: extraForm.type === 'substitution'
                  ? 'Substitution' : 'Extra Class',
                notes: `${extraForm.startTime}–${extraForm.endTime} · ${extraForm.classroomName || 'TBC'} · ${extraForm.lecturerName}${extraForm.type === 'substitution' ? ` (sub for ${extraForm.absentLecturerName})` : ''}`,
                sourceId: sessionId,
                sourceType: 'extra_session'
              };
              saveLS('pba_calendar_events', [...cleaned, calEvent]);

              setShowExtraModal(false);
              setEditExtraId(null);
            }}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              color: 'white', border: 'none', fontWeight: 700,
              fontSize: '14px', cursor: 'pointer'
            }}>
            {editExtraId ? 'Update Session' : 'Schedule Session'}
          </button>
          <button
            onClick={() => {
              setShowExtraModal(false);
              setEditExtraId(null);
            }}
            style={{
              padding: '12px 20px', borderRadius: '10px',
              background: '#F3F4F6', border: '1px solid #E3E6EA',
              color: '#374151', fontWeight: 600, fontSize: '14px',
              cursor: 'pointer'
            }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

════════════════════════════════════════════════════════════════
FIX 4 — Daily Allocation Sheet: show extra/sub sessions
════════════════════════════════════════════════════════════════

In the allocSessions computation, also include extra_sessions
for the current date. Merge them with the regular timetable sessions:

  const allocExtraSessions = (() => {
    const extras = safeLS('pba_extra_sessions', []);
    return (extras || []).filter(s => s.date === allocDateStr);
  })();

  // Merge and sort:
  const allAllocSessions = [
    ...(allocSessions || []).map(s => ({ ...s, _isRecurring: true })),
    ...(allocExtraSessions || []).map(s => ({ ...s, _isRecurring: false }))
  ].sort((a, b) => {
    const ta = (a.startTime || '00:00').replace(':', '');
    const tb = (b.startTime || '00:00').replace(':', '');
    return Number(ta) - Number(tb);
  });

  // Use allAllocSessions in the table instead of allocSessions.

In each table row, add a TYPE badge in the TIME cell:

  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
    <div>{s.startTime}–{s.endTime}</div>
    {s.type === 'substitution' && (
      <span style={{
        display: 'inline-block', marginTop: '3px',
        padding: '2px 7px', borderRadius: '10px',
        background: '#FEF2F2', border: '1px solid #FCA5A5',
        color: '#DC2626', fontSize: '10px', fontWeight: 800
      }}>
        🔄 SUB
      </span>
    )}
    {s.type === 'extra' && (
      <span style={{
        display: 'inline-block', marginTop: '3px',
        padding: '2px 7px', borderRadius: '10px',
        background: '#F5F3FF', border: '1px solid #DDD6FE',
        color: '#7C3AED', fontSize: '10px', fontWeight: 800
      }}>
        ⚡ EXTRA
      </span>
    )}
    {/* Edit/Delete buttons for extra sessions */}
    {!s._isRecurring && (
      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
        <button
          onClick={() => {
            setEditExtraId(s.id);
            setExtraForm({
              type: s.type || 'extra',
              date: s.date || '',
              startTime: s.startTime || '',
              endTime: s.endTime || '',
              batchId: s.batchId || '',
              batchName: s.batchName || '',
              subjectId: s.subjectId || '',
              subjectName: s.subjectName || '',
              lecturerId: s.lecturerId || '',
              lecturerName: s.lecturerName || '',
              classroomId: s.classroomId || '',
              classroomName: s.classroomName || '',
              absentLecturerId: s.absentLecturerId || '',
              absentLecturerName: s.absentLecturerName || '',
              originalSessionId: s.originalSessionId || '',
              notes: s.notes || ''
            });
            setShowExtraModal(true);
          }}
          style={{
            padding: '2px 8px', fontSize: '10px', borderRadius: '5px',
            background: '#EEF2FF', border: '1px solid #C7D2FE',
            color: '#4F46E5', cursor: 'pointer', fontWeight: 700
          }}>
          Edit
        </button>
        <button
          onClick={() => {
            if (!window.confirm('Delete this session?')) return;
            const all = safeLS('pba_extra_sessions', []);
            const updated = (all || []).filter(x => x.id !== s.id);
            saveLS('pba_extra_sessions', updated);
            setExtraSessions(updated);
            // Remove from calendar
            const cal = safeLS('pba_calendar_events', []);
            saveLS('pba_calendar_events',
              (cal || []).filter(
                e => !(e.sourceType === 'extra_session' &&
                       e.sourceId === s.id)
              )
            );
            setAllocRefresh(n => n + 1);
          }}
          style={{
            padding: '2px 8px', fontSize: '10px', borderRadius: '5px',
            background: '#FEF2F2', border: '1px solid #FECACA',
            color: '#DC2626', cursor: 'pointer', fontWeight: 700
          }}>
          Delete
        </button>
      </div>
    )}
  </td>

For substitution rows, also show the absent lecturer in the LECTURER column:

  <td style={{ padding: '10px 12px' }}>
    <div style={{ fontWeight: 600 }}>{s.lecturerName || '—'}</div>
    {s.type === 'substitution' && s.absentLecturerName && (
      <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '2px' }}>
        sub for {s.absentLecturerName}
      </div>
    )}
    {/* Assistants from recurring sessions */}
    {s._isRecurring && (s.assistants || []).length > 0 && (
      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
        {(s.assistants || []).filter(a => a.lecturerName)
          .map(a => a.lecturerName).join(', ')}
      </div>
    )}
  </td>

════════════════════════════════════════════════════════════════
FIX 5 — LecturerManagementView.jsx: Session Log shows extra/sub
════════════════════════════════════════════════════════════════

File: LecturerManagementView.jsx
Location: wherever the Session Log reads sessions for a lecturer

Currently reads from pba_timetable. Also read pba_extra_sessions
and merge them into the session list for the selected lecturer:

  // When building filteredSessions for the selected lecturer:
  const extraForLecturer = (safeLS('pba_extra_sessions', []) || [])
    .filter(s => s.lecturerId === selectedLecturer?.id ||
                 s.absentLecturerId === selectedLecturer?.id);

  // Merge with existing timetable sessions for display.
  // For extras, the row shows SUB or EXTRA badge (the badge JSX
  // from the existing EXTRA badge — session.isExtra — already
  // handles this if you set isExtra: true on substitution sessions.
  // Instead, check session.type directly:

  {(session.type === 'substitution') && (
    <span style={{
      display: 'inline-block', marginLeft: '6px',
      padding: '2px 7px', borderRadius: '10px',
      background: '#FEF2F2', border: '1px solid #FCA5A5',
      color: '#DC2626', fontSize: '10px', fontWeight: 800,
      verticalAlign: 'middle'
    }}>
      🔄 SUB
    </span>
  )}
  {(session.type === 'extra') && (
    <span style={{
      display: 'inline-block', marginLeft: '6px',
      padding: '2px 7px', borderRadius: '10px',
      background: '#F5F3FF', border: '1px solid #DDD6FE',
      color: '#7C3AED', fontSize: '10px', fontWeight: 800,
      verticalAlign: 'middle'
    }}>
      ⚡ EXTRA
    </span>
  )}

  // Also update the Extra Classes stat card to count both:
  const extraCount = (filteredSessions || []).filter(
    s => s.isExtra || s.type === 'extra' || s.type === 'substitution'
  ).length;

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx and LecturerManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL useState calls that read localStorage MUST use lazy initializer:
   useState(() => safeLS('key', []))
5. ALL array operations must guard against null:
   (array || []).filter(...), (array || []).map(...)
6. pba_extra_sessions is a NEW localStorage key. Initialize with [].
7. Extra sessions CAN be on Saturday or Sunday — do NOT filter them
   out based on day of week.
8. The calendar sync in the save handler uses sourceType: 'extra_session'
   so deletes clean up correctly without touching other events.
9. allocRefresh state (integer counter) forces table re-render
   after delete. Add: const [allocRefresh, setAllocRefresh] = useState(0)
   if not already present from the classroom allocation prompt.
   Use it as the table's key: <table key={allocDateStr + allocRefresh}>
10. Run npm run build and confirm 0 errors
11. Then npm run deploy to push to GitHub and trigger Vercel deployment
12. List all files modified
```
