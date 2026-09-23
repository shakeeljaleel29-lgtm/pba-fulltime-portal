# PBA Full-Time Portal — Fix: Parent Portal Batch Not Updating
## AntiGravity Prompt

---

```
The Parent Portal shows the wrong batch (or no batch) for students
because it reads the batch name directly from the student object
(e.g. student.batchName or student.batch), which is often stale
or empty. The same bug was fixed in the student drawer and hero
banner — apply the identical fix here.

The single source of truth for batch membership is pba_batches.

Touch ONLY ParentPortalView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
ROOT CAUSE
════════════════════════════════════════════════════════════════

Somewhere in ParentPortalView.jsx, the student's batch is
displayed using a field directly on the student object:

  student.batchName || student.batch || student.batchId
    || 'No batch assigned'

This field is NOT kept in sync when batches are created or
students are enrolled via the Batches tab. The batch data lives
in pba_batches, where each batch has a students array.

════════════════════════════════════════════════════════════════
THE FIX — derive batch name from pba_batches for every student
════════════════════════════════════════════════════════════════

Wherever the Parent Portal renders a student's batch, replace
the stale field read with a live lookup from pba_batches.

STEP 1 — Build a helper function once (at the top of the
component, before any return statement):

  // Returns the first enrolled batch name for a student,
  // looking up pba_batches as the single source of truth.
  const getStudentBatchName = (student) => {
    if (!student) return 'No batch assigned';
    const studentIdStr = (
      student.id || student.regNo || student.studentId || ''
    ).toString();
    const batches = (safeLS('pba_batches', []) || []);
    const enrolled = batches.filter(b =>
      (b.students || []).some(s =>
        (s.id || s.regNo || s.studentId || '').toString() === studentIdStr
      )
    );
    return enrolled[0]?.name
      || student.batchName
      || student.batch
      || student.batchId
      || 'No batch assigned';
  };

STEP 2 — Replace every place in the JSX where the batch is
displayed with a call to this helper.

  WRONG (old):
    {student.batchName || student.batch || 'No batch assigned'}

  RIGHT (new):
    {getStudentBatchName(student)}

This applies to:
  • The student card / list row batch label
  • The parent-view modal / detail panel batch field
  • Any summary header or subtitle that shows the batch
  • The batch chip or pill if one is rendered

STEP 3 — If the Parent Portal shows a list of students and
each row displays a batch, map getStudentBatchName over each
student in the list — do not call safeLS inside a .map(); the
helper already handles it safely.

════════════════════════════════════════════════════════════════
ALSO FIX — branch label (same stale-field problem)
════════════════════════════════════════════════════════════════

Wherever the branch is displayed, read all variants:

  const getStudentBranch = (student) =>
    student?.branch || student?.branchName || student?.campus || '';

Replace:
  {student.branch || student.branchName || ''}
With:
  {getStudentBranch(student)}

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ParentPortalView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. The helper getStudentBatchName must be defined INSIDE the
   component function (not outside), so it has access to safeLS
5. Do NOT change layout, styling, or any other functionality —
   only replace the stale batch/branch field reads
6. The fallback chain in getStudentBatchName means:
   - First: look up pba_batches (live, always correct)
   - Then: fall back to student object fields (stale but better
     than nothing)
   - Last: 'No batch assigned'
7. Run npm run build and confirm 0 errors
8. Then npm run deploy
9. List all files modified
```
