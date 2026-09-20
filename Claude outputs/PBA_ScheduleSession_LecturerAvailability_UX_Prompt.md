# PBA Full-Time Portal — Schedule Session: Lecturer Availability UX + Grid Fix
## AntiGravity Prompt

---

```
Two fixes in GeneralAdminView.jsx and LecturerManagementView.jsx:
(1) Show lecturer availability window in the Session modal dropdown
(2) Fix Availability Grid showing "Free" for ALL days instead of only
    days where the lecturer has availability set
Touch ONLY GeneralAdminView.jsx and LecturerManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
FIX 1 — LECTURER DROPDOWN: Show availability window inline
════════════════════════════════════════════════════════════════
File: GeneralAdminView.jsx
Location: Schedule a Session modal AND Edit Session modal — LECTURER dropdown

CURRENT:
  <option key={l.id} value={l.id}>{l.name}</option>

REPLACE WITH a helper that builds the option label:

  const getLecturerLabel = (lecturer, selectedDay) => {
    const avail = (lecturer.availability || []);

    // If a day is already selected in the form, show availability for that day
    if (selectedDay) {
      const dayAvail = avail.filter(a => a.day === selectedDay);
      if (dayAvail.length > 0) {
        const windows = dayAvail.map(a => `${a.startTime}–${a.endTime}`).join(', ');
        return `${lecturer.name} · ${selectedDay.slice(0,3)} ${windows}`;
      } else {
        return `${lecturer.name} · (Not available ${selectedDay})`;
      }
    }

    // No day selected yet — show overall availability summary
    if (avail.length === 0) {
      return `${lecturer.name} · (No availability set)`;
    }

    // Compact summary: e.g. "Mon–Fri 08:00–18:00" or "Mon 09:30–14:00"
    const days = [...new Set(avail.map(a => a.day))];
    if (days.length === 1) {
      const d = avail[0];
      return `${lecturer.name} · ${d.day.slice(0,3)} ${d.startTime}–${d.endTime}`;
    }
    if (days.length >= 5) {
      // Mon-Fri or similar — show as range
      const times = avail[0];
      return `${lecturer.name} · Mon–Fri ${times.startTime}–${times.endTime}`;
    }
    // Multiple different days — list them compactly
    const summary = days.map(day => day.slice(0,3)).join('/');
    return `${lecturer.name} · ${summary}`;
  };

Use this in the LECTURER dropdown in both Schedule and Edit Session modals:

  <select
    value={sessionForm.lecturerId}
    onChange={...}
    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px',
      border: '1px solid #E3E6EA', fontSize: '13px' }}>
    <option value="">— Select Lecturer —</option>
    {(lecturers || []).map(l => (
      <option key={l.id} value={l.id}>
        {getLecturerLabel(l, sessionForm.day)}
      </option>
    ))}
  </select>

  // Pass sessionForm.day so the label updates when the Day dropdown changes.
  // When day is selected and the lecturer is unavailable that day,
  // the option text itself says "(Not available Monday)" — clear at a glance.

ALSO — add a small availability hint below the LECTURER dropdown
(only when a lecturer is selected):

  {sessionForm.lecturerId && (() => {
    const lect = (lecturers || []).find(l => l.id === sessionForm.lecturerId);
    if (!lect) return null;
    const dayAvail = (lect.availability || []).filter(a => a.day === sessionForm.day);
    if (dayAvail.length > 0) {
      return (
        <p style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
          ✓ Available {sessionForm.day}: {dayAvail.map(a => `${a.startTime}–${a.endTime}`).join(', ')}
        </p>
      );
    } else if (sessionForm.day) {
      return (
        <p style={{ fontSize: '11px', color: '#D97706', marginTop: '4px', fontWeight: 600 }}>
          ⚠ No availability set for {sessionForm.day} — session can still be saved
        </p>
      );
    }
    return null;
  })()}

════════════════════════════════════════════════════════════════
FIX 2 — SUBJECT DROPDOWN: Better warning when batch has no subjects
════════════════════════════════════════════════════════════════
File: GeneralAdminView.jsx
Location: Schedule a Session modal AND Edit Session modal — SUBJECT dropdown

When batchSubjects.length === 0 AND a batch is selected,
show a clearer, more actionable warning:

  {sessionForm.batchId && batchSubjects.length === 0 && (
    <div style={{
      marginTop: '6px',
      padding: '8px 12px',
      background: '#FFF7ED',
      border: '1px solid #FED7AA',
      borderRadius: '8px',
      fontSize: '11px',
      color: '#92400E',
      fontWeight: 600
    }}>
      ⚠ This batch has no subjects assigned yet.
      Go to <strong>General Admin → Batch Manager → Edit Batch → Assign Subjects</strong>
      before scheduling sessions. You cannot select a subject until subjects are assigned.
    </div>
  )}

════════════════════════════════════════════════════════════════
FIX 3 — AVAILABILITY GRID: Only show "Free" for days with availability set
════════════════════════════════════════════════════════════════
File: LecturerManagementView.jsx
Location: Weekly Lecturer Availability Grid — cell rendering

CURRENT BUG:
  Dr. Shak has availability set to Monday 09:30–14:00 only.
  But the grid shows "Free" for Monday, Tuesday, Wednesday, Thursday, Friday.
  It should show:
    Monday:           "Free 09:30–14:00"   (available, no session)
    Tuesday–Friday:   "—"                  (no availability set)

ROOT CAUSE: The cell renderer is not checking whether the lecturer actually
  has an availability entry for that specific day before showing "Free".

THE FIX — cell rendering logic (replace entire cell logic):

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  // Optionally add 'Saturday' if any lecturer has Saturday availability:
  const hasSaturday = (lecturers || []).some(l =>
    (l.availability || []).some(a => a.day === 'Saturday')
  );
  const gridDays = hasSaturday ? [...DAYS, 'Saturday'] : DAYS;

  // For each cell (lecturer × day):
  const renderCell = (lecturer, day) => {
    // 1. Get timetable sessions for this lecturer on this day
    const sessions = (timetable || []).filter(
      s => s.lecturerId === lecturer.id && s.day === day
    );

    // 2. Get availability entries for this lecturer on this day
    const avail = (lecturer.availability || []).filter(a => a.day === day);

    // 3. SESSIONS take priority — show session cards
    if (sessions.length > 0) {
      return (
        <div>
          {sessions.map(session => (
            <div key={session.id} style={{
              background: '#EEF2FF',
              border: '1px solid #C7D2FE',
              borderRadius: '8px',
              padding: '6px 8px',
              marginBottom: '4px',
              fontSize: '11px'
            }}>
              <div style={{ fontWeight: 700, color: '#4F46E5' }}>
                {session.subjectName || session.batchName || 'Session'}
              </div>
              <div style={{ color: '#6B7280' }}>{session.batchName || ''}</div>
              <div style={{ color: '#6B7280' }}>
                {session.startTime}–{session.endTime}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 4. AVAILABLE but no session — only if avail entry exists for THIS day
    if (avail.length > 0) {
      return (
        <div style={{ color: '#9CA3AF', fontSize: '11px', fontStyle: 'italic' }}>
          {avail.map((a, i) => (
            <div key={i}>Free {a.startTime}–{a.endTime}</div>
          ))}
        </div>
      );
    }

    // 5. NOT AVAILABLE on this day — show dash
    return <span style={{ color: '#E2E8F0', fontSize: '13px' }}>—</span>;
  };

  Apply renderCell(lecturer, day) for each cell in the grid table.

════════════════════════════════════════════════════════════════
FIX 4 — "(No Subject)" TIMETABLE CARDS: Better fallback display
════════════════════════════════════════════════════════════════
File: GeneralAdminView.jsx
Location: Visual Timetable Builder — session card rendering

When a session has no subjectName stored, display more context:

  // In the session card title:
  const cardTitle = session.subjectName && session.subjectName !== '(No Subject)'
    ? session.subjectName
    : session.subjectCode
      ? `${session.subjectCode}`
      : `[No Subject — ${session.batchName || 'Unknown Batch'}]`;

  // Show a subtle warning icon if no subject assigned:
  const hasNoSubject = !session.subjectName || session.subjectName === '(No Subject)';

  In the card JSX:
  <div style={{
    fontSize: '12px', fontWeight: 700,
    color: hasNoSubject ? '#D97706' : '#1A202C'
  }}>
    {hasNoSubject && '⚠ '}{cardTitle}
  </div>

  // Tooltip or sub-line under the batch name:
  {hasNoSubject && (
    <div style={{ fontSize: '10px', color: '#D97706', fontStyle: 'italic', marginTop: '2px' }}>
      Assign subjects in Batch Manager
    </div>
  )}

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx and LecturerManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL useState calls that read localStorage must use lazy initializer:
   useState(() => safeLS('key', []))
5. ALL array operations must guard against null:
   (array || []).filter(...), (array || []).map(...)
6. The getLecturerLabel() helper must be defined INSIDE the component
   so it has access to the component's state (sessionForm.day)
7. FIX 3 is the most critical — the Availability Grid "Free" for all
   days is caused by the cell renderer not checking if avail.length > 0
   for THAT SPECIFIC DAY before showing "Free"
8. Run npm run build and confirm 0 errors
9. Then npm run deploy to push to GitHub and trigger Vercel deployment
10. List all files modified
```
