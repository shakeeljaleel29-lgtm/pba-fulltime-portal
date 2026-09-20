# PBA Full-Time Portal — Prompt 3: Student-to-Batch Enrollment
## AntiGravity Prompt

---

```
Add student-to-batch enrollment: students are assigned to batches,
batches show enrollment counts. Touch only the Students page and
the Batch Manager tab in General Admin. Do NOT change any other component.

════════════════════════════════════════════════════════════════
DATA STRUCTURE — pba_batch_enrollments (new localStorage key)
════════════════════════════════════════════════════════════════

  [
    {
      id: string,
      studentId: string,
      batchId: string,
      subjectIds: string[],       // which subjects in this batch this student takes
      stream: 'science' | 'commerce' | null,  // student's stream in this batch
      enrolledAt: string,         // ISO date string
      status: 'active' | 'withdrawn' | 'completed'
    }
  ]

Read:  safeLS('pba_batch_enrollments', [])
Write: saveLS('pba_batch_enrollments', updatedArray)

════════════════════════════════════════════════════════════════
PART A — BATCH MANAGER (General Admin): Show enrollment count
════════════════════════════════════════════════════════════════

On each batch card, add an enrollment count line below the existing details:

  const enrollments = safeLS('pba_batch_enrollments', [])
    .filter(e => e.batchId === batch.id && e.status === 'active');
  const capacity = batch.capacity || 40; // default 40 if not set

  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
    <span style={{ fontSize: '12px', color: '#718096' }}>
      👤 {enrollments.length} / {capacity} students
    </span>

    {/* Progress bar */}
    <div style={{
      flex: 1, height: '6px', background: '#E3E6EA', borderRadius: '3px', overflow: 'hidden'
    }}>
      <div style={{
        height: '100%',
        width: `${Math.min((enrollments.length / capacity) * 100, 100)}%`,
        background: enrollments.length >= capacity ? '#C53030'
                  : enrollments.length >= capacity * 0.8 ? '#B7860A'
                  : '#276749',
        borderRadius: '3px',
        transition: 'width 0.3s ease'
      }} />
    </div>
  </div>

Add a "👥 View Students" button on each batch card (ghost blue):
  Clicking it opens the ENROLLED STUDENTS PANEL (see below).

Also add a "capacity" field to the batch creation/edit modal:
  Label: CLASS CAPACITY
  Input: type="number", min=1, max=200, default=40
  Hint: "Maximum students allowed in this batch"

────────────────────────────────────────────────────────────────
ENROLLED STUDENTS PANEL (slide-in drawer or modal)
────────────────────────────────────────────────────────────────

Header: "Students — {batchName}" with enrollment count

Tabs: Active ({count}) | Withdrawn ({count}) | Completed ({count})

Search input: "Search by name or ID..."

Student list for the active tab:
  For each enrollment, find the student in pba_students:
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 16px', borderBottom: '1px solid #F0F2F5'
  }}>
    Student avatar circle (initials, 32px, bg #EBF4FF, color #2B6CB0)
    Name (13px bold) + Student ID (11px grey)
    Stream pill (SCI green | COM amber | — grey)
    Enrolled date (11px grey, right-aligned)
    "✕ Withdraw" (small red ghost button, right)
  </div>

Footer buttons:
  [＋ Enroll Students] (blue primary) — opens student picker modal
  [Download List] (gold) — CSV download

────────────────────────────────────────────────────────────────
ENROLL STUDENTS MODAL
────────────────────────────────────────────────────────────────

Search input to find students from pba_students NOT already enrolled in this batch.

Scrollable checkbox list (same pattern as subject checkbox fix):
  Each row: ☐ Student Name | Student ID | Branch pill

Stream assignment (shown after at least one student is checked):
  "Stream for selected students:"
  Pill selector: Science | Commerce | (leave unset)

Subject selection (shown after stream is set):
  Shows subjects from batch.batchSubjects filtered by the selected stream
  + compulsory subjects (always shown, pre-checked, non-removable)
  "Select subjects this student will take:"
  Checkbox list of applicable subjects

[Cancel] [Enroll Selected ({n})] — blue primary
On save: create pba_batch_enrollment records for each selected student.

════════════════════════════════════════════════════════════════
PART B — STUDENTS PAGE: Show enrolled batches on student profile
════════════════════════════════════════════════════════════════

On each student profile card (or in the student detail view/modal),
add a "Batches" section below the existing info:

  const studentEnrollments = safeLS('pba_batch_enrollments', [])
    .filter(e => e.studentId === student.id && e.status === 'active');

  If studentEnrollments.length === 0:
    <span style={{ fontSize: '12px', color: '#A0AEC0' }}>Not enrolled in any batch</span>

  Otherwise, show chips for each batch:
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
    {studentEnrollments.map(enrollment => {
      const batch = safeLS('pba_batches', []).find(b => b.id === enrollment.batchId);
      return (
        <span key={enrollment.id} style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          background: batch?.color ? batch.color + '20' : '#EBF4FF',
          color: '#2B6CB0',
          border: '1px solid #BEE3F8',
          borderRadius: '20px',
          padding: '3px 10px',
          fontSize: '11px', fontWeight: 600
        }}>
          {batch?.name || 'Unknown Batch'}
          {enrollment.stream && (
            <span style={{
              fontSize: '9px', fontWeight: 800,
              background: enrollment.stream === 'science' ? '#F0FFF4' : '#FFFBEB',
              color: enrollment.stream === 'science' ? '#276749' : '#B7860A',
              borderRadius: '8px', padding: '1px 5px'
            }}>
              {enrollment.stream === 'science' ? 'SCI' : 'COM'}
            </span>
          )}
        </span>
      );
    })}
  </div>

Also add an "＋ Enroll in Batch" button on the student profile
(opens a simplified enroll modal for THAT specific student):
  Batch dropdown (batches not already enrolled in)
  Stream selector
  Subject checkboxes
  [Cancel] [Enroll] blue primary

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change Lecturers, General Admin timetable, or any other page
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. pba_batches may not have a capacity field yet — default to 40 if missing
5. Withdrawing a student sets status = 'withdrawn', does NOT delete the record
6. Run npm run build and confirm 0 errors
7. List all files modified
```
