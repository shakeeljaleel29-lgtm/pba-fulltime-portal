# PBA Full-Time Portal — Student Database: Nuclear Fix
## AntiGravity Prompt

---

```
The Student Database shows 0 results when filtering by batch, even
though students are enrolled in that batch via Batch Manager.

This prompt makes THREE precise surgical edits to StudentManagementView.jsx.
Follow the steps in exact order. Do not interpret or adapt — execute literally.

Touch ONLY StudentManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
UNDERSTAND THE DATA STRUCTURE FIRST
════════════════════════════════════════════════════════════════

Open the file and find where pba_batches is read anywhere in the
component. The batch records look like this in localStorage:

  pba_batches = [
    {
      id: "...",
      name: "anuka",       ← batch name (may be any case)
      students: [...],     ← OR enrolledStudents: [...] OR studentList: [...]
      ...
    }
  ]

Each student inside the batch looks like one of:
  { id: "...", studentId: "...", regNo: "PBA-FT-2024-004",
    name: "Hiruni Mendis", studentName: "Hiruni Mendis", ... }

The FIELD NAMES inside batch.students[] are not guaranteed — use
defensive fallbacks for every field.

════════════════════════════════════════════════════════════════
EDIT 1 — Add buildStudentList() function to the component
════════════════════════════════════════════════════════════════

FIND the line that opens the component function. It will look like:

  const StudentManagementView = () => {
  or:
  function StudentManagementView() {
  or:
  const StudentManagementView = ({ ... }) => {

IMMEDIATELY AFTER the opening brace of that function (before any
existing code inside the function), INSERT this entire block:

  // ══ buildStudentList: merge pba_students + pba_batches ══
  const buildStudentList = () => {
    const rawBatches  = safeLS('pba_batches',  []);
    const rawStudents = safeLS('pba_students', []);
    const batches  = Array.isArray(rawBatches)  ? rawBatches  : [];
    const direct   = Array.isArray(rawStudents) ? rawStudents : [];

    // Map keyed by student id or regNo
    const map = {};

    // Helper: get a student's key
    const getKey = s =>
      s.id || s.studentId || s.regNo || null;

    // Helper: get enrolled array from a batch
    const getEnrolled = batch =>
      Array.isArray(batch.students)         ? batch.students
      : Array.isArray(batch.enrolledStudents) ? batch.enrolledStudents
      : Array.isArray(batch.studentList)      ? batch.studentList
      : [];

    // Pass 1 — from pba_students
    direct.forEach(s => {
      const key = getKey(s);
      if (!key) return;
      map[key] = {
        id:          key,
        regNo:       s.regNo       || '',
        name:        s.name        || s.studentName || '',
        mobilePhone: s.mobilePhone || s.phone       || '',
        parentPhone: s.parentPhone || '',
        status:      s.status      || 'active',
        batches:  [],
        batchIds: []
      };
    });

    // Pass 2 — from pba_batches enrollment
    batches.forEach(batch => {
      const enrolled = getEnrolled(batch);
      enrolled.forEach(s => {
        const key = getKey(s);
        if (!key) return;
        if (!map[key]) {
          map[key] = {
            id:          key,
            regNo:       s.regNo       || '',
            name:        s.name        || s.studentName || '',
            mobilePhone: s.mobilePhone || s.phone       || '',
            parentPhone: s.parentPhone || '',
            status:      s.status      || 'active',
            batches:  [],
            batchIds: []
          };
        }
        const bName = batch.name || '';
        if (bName && !map[key].batches.includes(bName)) {
          map[key].batches.push(bName);
          map[key].batchIds.push(batch.id || '');
        }
      });
    });

    return Object.values(map);
  };
  // ══ end buildStudentList ══

════════════════════════════════════════════════════════════════
EDIT 2 — Replace the students useState with buildStudentList
════════════════════════════════════════════════════════════════

FIND the line that initializes the students list. It will be ONE of:

  const [students, setStudents] = useState(() => safeLS('pba_students', []));
  const [students, setStudents] = useState(safeLS('pba_students', []));
  const [students, setStudents] = useState([]);

REPLACE THAT ENTIRE LINE with:

  const [students, setStudents] = useState(() => buildStudentList());

Then find ANY useEffect that refreshes students (it may load from
pba_students). REPLACE its body with:

  setStudents(buildStudentList());

If no such useEffect exists, ADD one after the useState line:

  useEffect(() => {
    setStudents(buildStudentList());
  }, []);

Make sure useEffect is imported. The React import line must be:
  import React, { useState, useEffect } from 'react';
  (add useEffect if it is not already there)

════════════════════════════════════════════════════════════════
EDIT 3 — Fix the batch filter to match by name (case-insensitive)
════════════════════════════════════════════════════════════════

FIND the code that filters students by selected batch. It will look
like one of:

  Pattern A (filter function):
    .filter(s => s.batchId === batchFilter || ...)
    .filter(s => s.batchName === batchFilter)
    .filter(s => s.batch === batchFilter)

  Pattern B (ternary / if block):
    if (batchFilter) { ... }
    batchFilter ? students.filter(...) : students

REPLACE the batch-matching condition with this:

  // Batch match — case-insensitive, checks batches array OR legacy batchName fields
  const batchMatch = (s) => {
    if (!batchFilter || batchFilter === '' || batchFilter === 'all') return true;
    const q = batchFilter.toLowerCase();
    // Check batches[] array (from buildStudentList)
    if ((s.batches || []).some(bn => (bn || '').toLowerCase() === q)) return true;
    // Check legacy single-batch fields
    if ((s.batchName  || '').toLowerCase() === q) return true;
    if ((s.batchId    || '').toLowerCase() === q) return true;
    if ((s.batch      || '').toLowerCase() === q) return true;
    return false;
  };

Then use batchMatch(s) in the filter:

  const filteredStudents = (students || []).filter(s => {
    if (!batchMatch(s)) return false;
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (!(s.name  || '').toLowerCase().includes(q) &&
          !(s.regNo || '').toLowerCase().includes(q)) return false;
    }
    if (statusFilter && statusFilter !== 'all' && statusFilter !== '') {
      if (s.status !== statusFilter) return false;
    }
    return true;
  });

════════════════════════════════════════════════════════════════
EDIT 4 — Fix the BATCH column in the table
════════════════════════════════════════════════════════════════

FIND the table cell that renders the BATCH column for each student.
It will look like one of:

  <td>{s.batchName}</td>
  <td>{s.batch}</td>
  <td>{student.batchName || '—'}</td>

REPLACE with:

  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>
    {(s.batches || []).length > 0
      ? (s.batches || []).join(', ')
      : (s.batchName || s.batch || <span style={{ color: '#9CA3AF' }}>—</span>)
    }
  </td>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY StudentManagementView.jsx
2. buildStudentList() must be declared INSIDE the component function,
   BEFORE any useState that calls it.
3. It reads BOTH pba_students AND pba_batches and merges them.
   If a student is in pba_batches but not pba_students, they still appear.
4. The batch filter is case-insensitive — "anuka" matches "Anuka" or "ANUKA".
5. If pba_batches stores the enrolled array under a key other than
   'students' (e.g. 'enrolledStudents', 'studentList'), the getEnrolled()
   helper handles all three automatically.
6. Do NOT delete or clear pba_students data.
7. Run npm run build and confirm 0 errors
8. Then npm run deploy
9. List all files modified
```
