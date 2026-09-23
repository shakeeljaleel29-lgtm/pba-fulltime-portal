# PBA Full-Time Portal — Fix: Lecturer Subject Mismatch in Timetable Builder
## AntiGravity Prompt

---

```
A lecturer who is assigned to "Biology" in their profile can currently be
scheduled to teach "Chemistry" in the Visual Timetable Builder with no
warning or restriction. The system must validate that the selected lecturer
is qualified (listed as teaching that subject) before saving a session, and
highlight existing mismatches in the timetable grid.

Touch ONLY GeneralAdminView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
DATA — where lecturer subjects are stored
════════════════════════════════════════════════════════════════

Lecturers are stored in pba_lecturers (or pba_staff — use whichever
key the file already uses). Each lecturer object includes a subjects
field that lists the subjects they are qualified to teach:

  {
    id:       "lec-001",
    name:     "SHAK",
    subjects: ["Biology"],   // ← the qualifications list
    ...
  }

The subjects field may be stored as:
  • An array of strings:  ["Biology", "Chemistry"]
  • A comma-separated string: "Biology, Chemistry"

Normalize it to an array for comparison:

  const getLecturerSubjects = (lecturer) => {
    if (!lecturer) return [];
    const raw = lecturer.subjects || lecturer.subjectsTaught || [];
    if (Array.isArray(raw)) return raw.map(s => s.trim()).filter(Boolean);
    if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

════════════════════════════════════════════════════════════════
FIX 1 — Filter the lecturer dropdown when a subject is selected
════════════════════════════════════════════════════════════════

In the "Add / Edit Session" modal or form (wherever the admin picks
a lecturer for a session), when a subject has already been chosen,
filter the lecturer dropdown to show:

  A) Qualified lecturers — teach that subject (shown first, no badge)
  B) All other lecturers — shown below a divider, with a ⚠️ warning
     label so the admin can still pick them if absolutely necessary

Implementation:

  const allLecturers = (safeLS('pba_lecturers', []) || []);
  const sessionSubject = (formState.subject || '').trim().toLowerCase();

  const qualifiedLecturers = allLecturers.filter(lec =>
    getLecturerSubjects(lec).some(
      s => s.toLowerCase() === sessionSubject
    )
  );

  const unqualifiedLecturers = allLecturers.filter(lec =>
    !getLecturerSubjects(lec).some(
      s => s.toLowerCase() === sessionSubject
    )
  );

Render the dropdown with two option groups:

  <select
    value={formState.lecturerId || ''}
    onChange={e => setFormState(prev => ({
      ...prev,
      lecturerId: e.target.value || null
    }))}
    style={{
      width: '100%', padding: '10px 12px',
      border: `1px solid ${mismatchWarning ? '#FCA5A5' : '#D1D5DB'}`,
      borderRadius: '8px', fontSize: '14px',
      color: '#111827', background: '#fff'
    }}
  >
    <option value="">— Select Lecturer —</option>

    {qualifiedLecturers.length > 0 && (
      <optgroup label="✓ Qualified for this subject">
        {qualifiedLecturers.map(lec => (
          <option key={lec.id} value={lec.id}>
            {lec.name}
          </option>
        ))}
      </optgroup>
    )}

    {unqualifiedLecturers.length > 0 && (
      <optgroup label="⚠ Not listed for this subject">
        {unqualifiedLecturers.map(lec => (
          <option key={lec.id} value={lec.id}>
            {lec.name} (not assigned to {formState.subject})
          </option>
        ))}
      </optgroup>
    )}
  </select>

════════════════════════════════════════════════════════════════
FIX 2 — Warning banner inside the session form on mismatch
════════════════════════════════════════════════════════════════

Detect the mismatch in real time as the admin selects subject +
lecturer:

  const selectedLecturer = allLecturers.find(
    l => l.id === formState.lecturerId
  );

  const mismatchWarning = (() => {
    if (!selectedLecturer || !formState.subject) return false;
    const qualSubjects = getLecturerSubjects(selectedLecturer)
      .map(s => s.toLowerCase());
    return !qualSubjects.includes(
      (formState.subject || '').trim().toLowerCase()
    );
  })();

Show the warning immediately below the lecturer dropdown when mismatch
is true:

  {mismatchWarning && (
    <div style={{
      marginTop: '6px',
      padding: '8px 12px',
      background: '#FEF3C7',
      border: '1px solid #FDE68A',
      borderRadius: '8px',
      fontSize: '12px',
      color: '#92400E',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      <span style={{ fontSize: '14px' }}>⚠️</span>
      <span>
        <strong>{selectedLecturer.name}</strong> is not listed as a{' '}
        <strong>{formState.subject}</strong> lecturer. You can still
        save, but this may be an error.
      </span>
    </div>
  )}

════════════════════════════════════════════════════════════════
FIX 3 — Mismatch badge on existing sessions in the timetable grid
════════════════════════════════════════════════════════════════

For sessions already saved with a subject/lecturer mismatch, show
a small ⚠️ badge on the session card in the timetable grid so the
admin can spot and fix them.

Inside the session card render, add this mismatch check:

  const sessionLecturer = allLecturers.find(l => l.id === sess.lecturerId);
  const sessionMismatch = (() => {
    if (!sessionLecturer || !sess.subject) return false;
    const qualSubjects = getLecturerSubjects(sessionLecturer)
      .map(s => s.toLowerCase());
    return !qualSubjects.includes(
      (sess.subject || '').trim().toLowerCase()
    );
  })();

Then inside the card JSX, after the session title/subject line:

  {sessionMismatch && (
    <span
      title={`${sessionLecturer?.name} is not a ${sess.subject} lecturer`}
      style={{
        display: 'inline-block',
        fontSize: '10px',
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #FDE68A',
        borderRadius: '4px',
        padding: '1px 5px',
        marginTop: '3px',
        cursor: 'default'
      }}
    >
      ⚠ Subject mismatch
    </span>
  )}

════════════════════════════════════════════════════════════════
FIX 4 — Availability Grid: highlight mismatched sessions
════════════════════════════════════════════════════════════════

In the Weekly Lecturer Availability Grid, cells that show a session
where the lecturer teaches a subject outside their profile should have
a subtle amber left border instead of the normal blue:

  <div style={{
    ...existingCardStyle,
    borderLeft: sessionMismatch
      ? '3px solid #F59E0B'
      : existingCardStyle.borderLeft || '3px solid #6366F1',
    background: sessionMismatch ? '#FFFBEB' : existingCardStyle.background
  }}>
    {/* existing cell content */}
    {sessionMismatch && (
      <div style={{ fontSize: '10px', color: '#92400E', marginTop: '2px' }}>
        ⚠ Not in lecturer's subjects
      </div>
    )}
  </div>

════════════════════════════════════════════════════════════════
NO HARD BLOCK — soft validation only
════════════════════════════════════════════════════════════════

Do NOT prevent the admin from saving a mismatched session. The
institute may sometimes need a lecturer to cover a subject outside
their normal list. The validation is:
  • Soft warning (banner, badge) — always visible
  • Filtered dropdown (qualified shown first) — easier to pick right
  • No hard error, no disabled Save button

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. getLecturerSubjects() must handle both array and comma-string
   formats — never assume one format
5. Comparison is case-insensitive: "biology" === "Biology" ✓
6. The mismatch check is read-only — it never modifies stored data
7. If pba_lecturers is empty or the key doesn't exist, skip all
   mismatch logic silently (do not crash)
8. The ⚠ badge on session cards is purely visual — clicking it does
   nothing (the admin opens the session to edit it normally)
9. Run npm run build and confirm 0 errors
10. Then npm run deploy
11. List all files modified
```
