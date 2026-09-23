# PBA Full-Time Portal — Student Subject & Stream Assignment
## AntiGravity Prompt

---

```
When registering or importing a student, the admin must be able to
assign:
  • Stream   — e.g. Science, Commerce, Arts (the student's academic
               stream)
  • Subjects — the specific subjects the student is studying
               (multi-select, ideally filtered by stream)

These fields should be available in THREE places:
  1. Register New Student modal (in StudentManagementView.jsx)
  2. Import Students CSV flow (column mapping + auto-detect)
  3. General Admin → Student Manager / Batch Manager student view

All three write to the SAME key (pba_students), so any change
immediately reflects everywhere — Student Database and General Admin
must always read from the same source.

Touch ONLY StudentManagementView.jsx AND GeneralAdminView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
DATA — new fields on each student record
════════════════════════════════════════════════════════════════

Each student object in pba_students gains two new optional fields:

  {
    id:          "PBA-FT-2024-019",
    name:        "NNNNN",
    stream:      "Science",          // ← NEW — string, nullable
    subjects:    ["Biology","Maths"],// ← NEW — string[], nullable
    batchId:     "...",
    ...existing fields unchanged...
  }

Both fields default to null / [] when not set.
Existing student records without these fields continue to work.

════════════════════════════════════════════════════════════════
STREAM & SUBJECT OPTIONS — read from existing data
════════════════════════════════════════════════════════════════

Streams are stored in a new key pba_streams:

  pba_streams = [
    { id: "sci", name: "Science" },
    { id: "com", name: "Commerce" },
    { id: "arts", name: "Arts" }
  ]

Pre-populate pba_streams ONLY if the key does not yet exist:

  useEffect(() => {
    if (!safeLS('pba_streams', null)) {
      saveLS('pba_streams', [
        { id: crypto.randomUUID(), name: 'Science'  },
        { id: crypto.randomUUID(), name: 'Commerce' },
        { id: crypto.randomUUID(), name: 'Arts'     }
      ]);
    }
  }, []);

Subject options come from pba_subjects (already exists):

  const subjectOptions = (safeLS('pba_subjects', []) || [])
    .map(s => (typeof s === 'string' ? s : s.name))
    .filter(Boolean);

If pba_subjects is empty, fall back to a hardcoded default list:

  const DEFAULT_SUBJECTS = [
    'Biology','Physics','Chemistry','Mathematics',
    'Accounts','Business Studies','Economics',
    'English','General Paper','History'
  ];

  const subjectOptions = (() => {
    const fromStore = (safeLS('pba_subjects', []) || [])
      .map(s => (typeof s === 'string' ? s : s.name))
      .filter(Boolean);
    return fromStore.length ? fromStore : DEFAULT_SUBJECTS;
  })();

Stream options:

  const streamOptions = (safeLS('pba_streams', []) || [])
    .map(s => s.name).filter(Boolean);

════════════════════════════════════════════════════════════════
PLACE 1 — Register New Student modal
(in StudentManagementView.jsx or wherever this modal lives)
════════════════════════════════════════════════════════════════

Add two new fields to the student registration form, AFTER the
"Batch Enrolled" field and BEFORE "Mobile Number":

── A) Stream dropdown ──────────────────────────────────────────

  {/* Stream */}
  <div style={{ marginBottom: '16px' }}>
    <label style={{
      display: 'block', fontSize: '11px', fontWeight: 600,
      color: '#6B7280', letterSpacing: '0.05em', marginBottom: '6px'
    }}>
      STREAM
    </label>
    <select
      value={newStudentForm.stream || ''}
      onChange={e => setNewStudentForm(prev => ({
        ...prev,
        stream: e.target.value || null,
        subjects: []   // clear subjects when stream changes
      }))}
      style={{
        width: '100%', padding: '10px 12px',
        border: '1px solid #D1D5DB', borderRadius: '8px',
        fontSize: '14px', color: '#111827', background: '#fff'
      }}
    >
      <option value="">— Select Stream —</option>
      {streamOptions.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  </div>

── B) Subjects multi-select ────────────────────────────────────

  {/* Subjects */}
  <div style={{ marginBottom: '16px' }}>
    <label style={{
      display: 'block', fontSize: '11px', fontWeight: 600,
      color: '#6B7280', letterSpacing: '0.05em', marginBottom: '6px'
    }}>
      SUBJECTS
      <span style={{ fontWeight: 400, marginLeft: '6px', color: '#9CA3AF' }}>
        (select all that apply)
      </span>
    </label>
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '8px',
      padding: '10px 12px',
      border: '1px solid #D1D5DB', borderRadius: '8px',
      background: '#F9FAFB', minHeight: '44px'
    }}>
      {subjectOptions.map(subj => {
        const checked = (newStudentForm.subjects || []).includes(subj);
        return (
          <label key={subj} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '13px', color: checked ? '#1D4ED8' : '#374151',
            cursor: 'pointer',
            background: checked ? '#EFF6FF' : '#fff',
            border: `1px solid ${checked ? '#BFDBFE' : '#E5E7EB'}`,
            borderRadius: '6px', padding: '4px 10px',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                setNewStudentForm(prev => {
                  const current = prev.subjects || [];
                  return {
                    ...prev,
                    subjects: checked
                      ? current.filter(s => s !== subj)
                      : [...current, subj]
                  };
                });
              }}
              style={{ display: 'none' }}
            />
            {checked ? '✓ ' : ''}{subj}
          </label>
        );
      })}
    </div>
  </div>

── C) Save handler update ──────────────────────────────────────

In the save/submit handler for "Register Student", include the
new fields in the student object:

  const newStudent = {
    id:          generatedId,
    name:        newStudentForm.name       || '',
    stream:      newStudentForm.stream     || null,
    subjects:    newStudentForm.subjects   || [],
    batchId:     newStudentForm.batchId    || null,
    batchName:   newStudentForm.batchName  || null,
    // ... all other existing fields ...
  };

── D) Form reset ───────────────────────────────────────────────

When resetting the form after saving, include:

  stream:   null,
  subjects: [],

════════════════════════════════════════════════════════════════
PLACE 2 — Import Students (CSV) flow
════════════════════════════════════════════════════════════════

When the admin uploads a CSV of students, the import must detect
and map two new columns: "stream" and "subjects".

In handleStudentCSVUpload / the import handler:

AUTO-DETECT these column headers (case-insensitive):
  • stream  → matches: "stream", "academic stream", "course"
  • subjects→ matches: "subjects", "subject", "courses taken"

In the column-mapping step, add two new rows to the preview table:

  Stream   → [dropdown with CSV column options]
  Subjects → [dropdown with CSV column options]

When parsing each CSV row, after mapping:

  const streamVal   = row[streamColIndex]?.trim()   || null;
  const subjectsRaw = row[subjectsColIndex]?.trim() || '';

  // Subjects may be stored as comma-separated in one cell:
  // e.g. "Biology, Physics, Mathematics"
  const subjectsVal = subjectsRaw
    ? subjectsRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const studentObj = {
    ...existingFields,
    stream:   streamVal,
    subjects: subjectsVal
  };

If these columns are absent from the CSV, set stream: null and
subjects: [] — never fail the import because of missing columns.

════════════════════════════════════════════════════════════════
PLACE 3 — General Admin student view (inline edit)
════════════════════════════════════════════════════════════════

In GeneralAdminView.jsx, wherever individual student details are
shown (a student row expansion, a student profile card, or the
edit-student form), add stream and subjects as editable fields
using the same UI as Place 1 above.

When saving from General Admin, update pba_students directly:

  const _allStudents = safeLS('pba_students', []) || [];
  const _updated = _allStudents.map(s =>
    s.id === editingStudentId
      ? { ...s, stream: newStream, subjects: newSubjects }
      : s
  );
  saveLS('pba_students', _updated);
  // No separate store — pba_students is the single source of truth

════════════════════════════════════════════════════════════════
DISPLAY — Student Database table
════════════════════════════════════════════════════════════════

In the Student Database table, add a STREAM column between BATCH
and MOBILE PHONE, and show subjects as a compact chip list on the
student's profile/expand row:

  {/* STREAM column header */}
  <th style={{ ... }}>STREAM</th>

  {/* STREAM cell */}
  <td>
    {student.stream ? (
      <span style={{
        background: '#EFF6FF', color: '#1D4ED8',
        borderRadius: '6px', padding: '2px 8px',
        fontSize: '12px', fontWeight: 600
      }}>
        {student.stream}
      </span>
    ) : (
      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>
    )}
  </td>

In the expanded student row or profile modal, show subjects:

  {(student.subjects || []).length > 0 && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px',
                  marginTop: '6px' }}>
      {(student.subjects || []).map(subj => (
        <span key={subj} style={{
          background: '#F0FDF4', color: '#166534',
          border: '1px solid #BBF7D0',
          borderRadius: '6px', padding: '2px 8px', fontSize: '11px'
        }}>
          {subj}
        </span>
      ))}
    </div>
  )}

════════════════════════════════════════════════════════════════
SYNC — Single source of truth
════════════════════════════════════════════════════════════════

Both StudentManagementView.jsx and GeneralAdminView.jsx MUST:
  • Read students ONLY from pba_students
  • Write students ONLY to pba_students
  • Never maintain a separate local copy of the student list in
    component state without re-reading from pba_students

If either view uses a local useState copy of students, ensure it
is re-read from pba_students after EVERY save:

  const refreshStudents = () => {
    setStudents(safeLS('pba_students', []) || []);
  };

Call refreshStudents() immediately after every saveLS('pba_students',...)
call in BOTH files. This ensures a save in General Admin immediately
appears in the Student Database table and vice versa.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY StudentManagementView.jsx AND GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. pba_students is the SINGLE SOURCE OF TRUTH — never duplicate it
5. stream and subjects are OPTIONAL — never block registration if
   they are not filled in
6. Subjects stored as an array of strings: ["Biology","Physics"]
7. CSV import: subjects may arrive as a comma-separated string in
   one cell — split by comma, trim each, store as array
8. pba_streams seeded ONLY if the key does not yet exist
9. The STREAM column in the table is new — add it without breaking
   existing columns
10. Run npm run build and confirm 0 errors
11. Then npm run deploy
12. List all files modified
```
