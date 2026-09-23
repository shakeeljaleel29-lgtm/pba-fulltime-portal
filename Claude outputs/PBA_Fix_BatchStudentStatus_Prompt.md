# PBA Full-Time Portal — Fix: Batch Shows "1 Enrolled" but Active(0) + Empty Enroll Modal
## AntiGravity Prompt

---

```
The Batch Manager card shows "1 student enrolled" but clicking
"View Students" shows Active (0) / Withdrawn (0) / Completed (0).
The Enroll Students modal also shows "No available students found."

This is caused by TWO separate bugs:

  BUG 1 — Status case mismatch:
    The student is stored in batch.students with status: "Active"
    (capital A) but the View Students modal filters for
    s.status === 'active' (lowercase) → 0 matches.

  BUG 2 — Enroll modal over-filtering:
    The enroll modal excludes students already in ANY batch, so if
    all students are enrolled somewhere they all get filtered out.
    Should only exclude students already in THIS specific batch.

Touch ONLY GeneralAdminView.jsx AND StudentManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
FIX 1 — Status comparison: make it case-insensitive everywhere
════════════════════════════════════════════════════════════════

Wherever the code filters batch.students by status, change ALL
status comparisons to case-insensitive:

  BEFORE:
    const activeStudents = batch.students.filter(
      s => s.status === 'active'
    );
    const withdrawnStudents = batch.students.filter(
      s => s.status === 'withdrawn'
    );
    const completedStudents = batch.students.filter(
      s => s.status === 'completed'
    );

  AFTER:
    const normalize = s => (s || '').toLowerCase();

    const activeStudents = (batch.students || []).filter(
      s => normalize(s.status) === 'active'
    );
    const withdrawnStudents = (batch.students || []).filter(
      s => normalize(s.status) === 'withdrawn'
    );
    const completedStudents = (batch.students || []).filter(
      s => normalize(s.status) === 'completed'
    );

Apply this to EVERY place in the file that switches on a student's
status string — including the tab badge counts (Active (N)) and the
table/list display.

Also fix the "enrolled count" display on the batch card: it must use
the same case-insensitive active filter, OR count all students
regardless of status. Do NOT count differently in two places.

════════════════════════════════════════════════════════════════
FIX 1B — Normalize status on write
════════════════════════════════════════════════════════════════

In syncStudentsToBatches() and in the manual Enroll handler, when
writing a student object into batch.students, normalize the status
to lowercase so future comparisons are consistent:

  status: (student.status || 'active').toLowerCase(),
                                        ^^^^^^^^^^^^

This prevents the mismatch from recurring.

════════════════════════════════════════════════════════════════
FIX 2 — Enroll modal: filter only by THIS batch, not all batches
════════════════════════════════════════════════════════════════

In the Enroll Students modal, the available students list must only
exclude students already enrolled in THIS batch (the one being
enrolled into). It must NOT exclude students enrolled in other batches
— students can be enrolled in multiple batches.

Find the available-students filter in the Enroll modal and replace it:

  BEFORE (too aggressive — excludes students in any batch):
    const allEnrolledIds = new Set();
    (safeLS('pba_batches', []) || []).forEach(b =>
      (b.students || []).forEach(s => {
        allEnrolledIds.add((s.id || s.regNo || '').toString());
      })
    );
    const availableStudents = (safeLS('pba_students', []) || [])
      .filter(s => !allEnrolledIds.has(...));

  AFTER (only exclude students in THIS batch):
    const thisBatch = (safeLS('pba_batches', []) || [])
      .find(b => b.id === selectedBatch?.id || b.id === enrollingBatchId);

    const enrolledInThisBatch = new Set(
      ((thisBatch?.students) || []).map(s =>
        (s.id || s.regNo || s.studentId || '').toString()
      )
    );

    const availableStudents = (safeLS('pba_students', []) || [])
      .filter(s => {
        const sid = (s.id || s.regNo || s.studentId || '').toString();
        return sid && !enrolledInThisBatch.has(sid);
      });

Use whatever variable name the code already uses for "the batch being
enrolled into" (selectedBatch, enrollingBatch, currentBatch, etc.).

════════════════════════════════════════════════════════════════
FIX 3 — Refresh batch list after any enroll/unenroll action
════════════════════════════════════════════════════════════════

After every save to pba_batches (enroll, unenroll, status change),
re-read from localStorage so the batch card count updates immediately:

  const refreshBatches = () => {
    setBatches(safeLS('pba_batches', []) || []);
  };

Call refreshBatches() after every saveLS('pba_batches', ...) call in
GeneralAdminView.jsx.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx AND StudentManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. The ONLY filter for the Enroll modal is "not in THIS batch"
   Students can be in multiple batches — do NOT exclude them globally
5. Status comparison MUST be case-insensitive everywhere:
   normalize(s.status) === 'active' not s.status === 'active'
6. Status written to pba_batches.students MUST be lowercase 'active'
7. The batch card "N enrolled" count and the Active (N) tab count
   must use the same logic — never count differently in two places
8. Run npm run build and confirm 0 errors
9. Then npm run deploy
10. List all files modified
```
