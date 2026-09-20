# PBA Full-Time Portal — Comprehensive Cross-Module Interlinking Audit
## AntiGravity Prompt

---

```
Audit and fix ALL cross-module data linkages across the entire portal.
Many features exist in isolation — they do not read or share data from
related modules. This prompt wires them all together correctly.

════════════════════════════════════════════════════════════════
THE MASTER DATA MODEL (localStorage keys and their relationships)
════════════════════════════════════════════════════════════════

pba_batches          — Batches (e.g. Cambridge O Level 2027)
                       Each batch has: subjects[] → linked to pba_subjects
                       Each batch has: studentIds[] → linked to pba_students

pba_subjects         — Subject definitions (Biology, Chemistry, etc.)

pba_students         — Students; each has batchId → pba_batches

pba_lecturers        — Lecturers; each has subjects[] (subjectIds),
                       availability[] ({ day, startTime, endTime })

pba_timetable        — Scheduled classes; each has:
                       batchId, subjectId, lecturerId, classroomId,
                       day, startTime, endTime, recurrence

pba_attendance       — Attendance records; each has:
                       sessionId (from pba_timetable), studentId,
                       date, status ('present'|'late'|'absent')

pba_fees             — Fee records; each has:
                       studentId, batchId, amount, dueDate,
                       paidOn, status ('paid'|'partial'|'overdue'|'pending')

pba_exam_results     — Exam results; each has:
                       studentId, subjectId, batchId, examName,
                       score, maxScore, grade, date

pba_requisitions     — Textbook print requests; each has:
                       bookTitle, batchId, subjectId, qty, status,
                       approvedBy, approvedOn

pba_print_jobs       — Kanban print jobs; each has:
                       requisitionId, bookTitle, batchId, qty,
                       status ('queued'|'in_progress'|'ready'|'completed'),
                       completedOn

pba_book_issues      — Book distribution log; each has:
                       studentId, bookTitle, subjectId, batchId,
                       issuedOn, issuedBy,
                       status ('pending_distribution'|'issued')

pba_announcements    — Announcements; each has:
                       title, body, targetBatchIds[], targetAll,
                       createdOn, createdBy

pba_classrooms       — Classrooms; each has:
                       name, capacity, branch, facilities[]

pba_parent_messages  — Parent ↔ admin messages; each has:
                       parentName, studentId, batchId, message,
                       date, status ('unread'|'read')

════════════════════════════════════════════════════════════════
LINKAGE 1 — BATCH MANAGER ↔ STUDENTS
════════════════════════════════════════════════════════════════

File: GeneralAdminView.jsx

When displaying a batch card, show:
  - Student count: pba_students.filter(s => s.batchId === batch.id).length
  - Subjects assigned: batch.subjects.length

When clicking a batch, the "View Students" action should open a
filtered student list showing only students in that batch.

When a student is added via Student Management:
  - Their batchId should be selectable from pba_batches
  - The student appears in that batch's student count immediately

════════════════════════════════════════════════════════════════
LINKAGE 2 — BATCH SUBJECTS ↔ LECTURER MANAGEMENT
════════════════════════════════════════════════════════════════

File: LecturerManagementView.jsx, GeneralAdminView.jsx

In Lecturer Profiles, "SUBJECTS TAUGHT" column should read from:
  pba_batches → batch.subjects → find subjects where subject.lecturerId === lecturer.id

This means a lecturer's subjects column auto-updates when they are
assigned to a subject in any batch — no manual entry needed.

In the Add/Edit Lecturer modal, subject assignment should cross-reference
pba_subjects (the master subject list) and allow multi-select:
  lecturer.subjects = [subjectId1, subjectId2, ...]

════════════════════════════════════════════════════════════════
LINKAGE 3 — TIMETABLE ↔ LECTURER AVAILABILITY
════════════════════════════════════════════════════════════════

File: LecturerManagementView.jsx (Availability Grid tab)

The Availability Grid must:
  1. Load pba_lecturers → each lecturer's availability[] array
  2. Load pba_timetable → sessions per lecturer per day
  3. For each cell (lecturer × day):
     - If timetable has a session: show session card (subject, batch, time)
     - Else if lecturer has availability for that day: show "Free HH:MM–HH:MM"
     - Else: show "—" (not available)

When adding a timetable session (Scheduling / Timetable Builder):
  - Lecturer dropdown should only show lecturers who are AVAILABLE
    on the selected day and time slot (cross-reference lecturer.availability)
  - If a lecturer is already scheduled at that time: show them as greyed out

════════════════════════════════════════════════════════════════
LINKAGE 4 — TIMETABLE ↔ ATTENDANCE
════════════════════════════════════════════════════════════════

File: DigitalAttendance.jsx

When taking attendance:
  - Session selector should load from pba_timetable for today's day
  - Once a session is selected, the student list auto-loads from
    pba_students.filter(s => s.batchId === session.batchId)
  - No manual student entry — the batch drives the list

Attendance records are stored in pba_attendance with:
  { id, sessionId, batchId, studentId, date, status }

In Student profiles (StudentProfile.jsx), the Attendance tab should:
  pba_attendance.filter(a => a.studentId === student.id)
  → group by subject (via sessionId → pba_timetable → subjectId)
  → calculate attendance % per subject

════════════════════════════════════════════════════════════════
LINKAGE 5 — FEE MANAGEMENT ↔ STUDENTS ↔ BATCHES
════════════════════════════════════════════════════════════════

File: FeeManagementView.jsx

Fee records must have studentId and batchId.
When viewing fees, filtering by batch should show:
  pba_fees.filter(f => f.batchId === selectedBatchId)
  → with student names resolved via pba_students.find(s => s.id === f.studentId)

In Student profiles, the Fees tab should show:
  pba_fees.filter(f => f.studentId === student.id)
  → sorted by dueDate
  → with total outstanding amount

Dashboard KPI "Outstanding Fees" should read:
  pba_fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + f.amount, 0)

════════════════════════════════════════════════════════════════
LINKAGE 6 — EXAMINATIONS ↔ STUDENTS ↔ SUBJECTS
════════════════════════════════════════════════════════════════

File: ExamManagementView.jsx

Exam results must reference:
  { studentId, subjectId, batchId, examName, score, maxScore, grade, date }

When entering results, the subject dropdown loads from:
  batch.subjects (the subjects assigned to that batch)
  — not a static hardcoded list

Student list for result entry loads from:
  pba_students.filter(s => s.batchId === selectedBatchId)

In Student profiles, the Exams tab should show:
  pba_exam_results.filter(r => r.studentId === student.id)
  → with subject names resolved via pba_subjects

Analytics: subject performance chart uses:
  pba_exam_results grouped by subjectId → average score per subject

════════════════════════════════════════════════════════════════
LINKAGE 7 — PRINTING QUEUE ↔ REQUISITIONS ↔ BOOK ISSUES
════════════════════════════════════════════════════════════════

Files: BookManagementView.jsx, PrintJobKanban.jsx

Already partially specified in previous prompt. Confirming full chain:

Step A — Requisition approved:
  pba_requisitions record: status → 'approved'
  → New pba_print_jobs record created with requisitionId + status: 'queued'

Step B — Print job progresses through Kanban:
  'queued' → 'in_progress' → 'ready' → 'completed'

Step C — Job moves to 'ready' (Ready to Distribute):
  Auto-create pba_book_issues records for ALL students in the batch:
    pba_students.filter(s => s.batchId === printJob.batchId).forEach(student => {
      create { studentId: student.id, bookTitle, batchId, subjectId,
               status: 'pending_distribution', issuedOn: null, issuedBy: null }
    });

Step D — Requisitions tab ACTION column reads live from pba_print_jobs:
  'queued'/'in_progress' → ● In Queue
  'ready' → 📦 Ready to Distribute
  'completed' → ✓ Completed (green)

Step E — Student Book Issues tab:
  Shows pba_book_issues; staff clicks "✓ Mark Issued" to update
  individual student records to status: 'issued' with issuedOn: today

════════════════════════════════════════════════════════════════
LINKAGE 8 — COMMUNICATIONS ↔ BATCHES ↔ STUDENTS
════════════════════════════════════════════════════════════════

File: CommunicationsView.jsx

When composing an announcement:
  - "Target Audience" dropdown should list ALL pba_batches (not hardcoded)
  - "Send to All" option sends to all students regardless of batch

pba_announcements record:
  { id, title, body, targetBatchIds: [], targetAll: false, createdOn, createdBy }

On the Dashboard, "Recent Announcements" widget reads from pba_announcements
sorted by createdOn desc, limit 3.

In Parent Portal, announcements shown are filtered:
  pba_announcements.filter(a =>
    a.targetAll || a.targetBatchIds.includes(student.batchId)
  )

════════════════════════════════════════════════════════════════
LINKAGE 9 — PARENT PORTAL ↔ STUDENT DATA
════════════════════════════════════════════════════════════════

File: ParentPortalView.jsx

Parent logs in → selects or is linked to their child (studentId).
All data shown is filtered by that studentId:

  Student info:    pba_students.find(s => s.id === studentId)
  Batch:           pba_batches.find(b => b.id === student.batchId)
  Attendance:      pba_attendance.filter(a => a.studentId === studentId)
  Fees:            pba_fees.filter(f => f.studentId === studentId)
  Exam results:    pba_exam_results.filter(r => r.studentId === studentId)
  Announcements:   pba_announcements filtered by student's batchId
  Book issues:     pba_book_issues.filter(b => b.studentId === studentId)

Attendance % per subject displayed as:
  (present + late) / total sessions × 100

Outstanding fees:
  pba_fees.filter(f => f.studentId === studentId && f.status !== 'paid')
  .reduce((sum, f) => sum + f.amount, 0)

════════════════════════════════════════════════════════════════
LINKAGE 10 — DASHBOARD KPIs ↔ LIVE DATA
════════════════════════════════════════════════════════════════

File: DashboardView.jsx

All KPI stat cards must read LIVE from localStorage, not hardcoded values:

  Total Students:    pba_students.length
  Total Batches:     pba_batches.length
  Total Lecturers:   pba_lecturers.length
  Active Students:   pba_students.filter(s => s.status === 'active').length
  Outstanding Fees:  pba_fees.filter(f => f.status !== 'paid').reduce(sum + amount, 0)
  Upcoming Exams:    pba_exam_results where date >= today (count)
  Books Pending:     pba_book_issues.filter(b => b.status === 'pending_distribution').length
  Attendance Today:  pba_attendance.filter(a => a.date === today).length

Upcoming Classes widget:
  pba_timetable.filter(t => t.day === todayDayName)
  → show next 3 classes with batch name, subject, time, classroom

Recent Activity feed reads from:
  latest records across pba_students, pba_fees, pba_attendance, pba_announcements
  sorted by createdOn/date desc, limit 5 entries

════════════════════════════════════════════════════════════════
LINKAGE 11 — STUDENT PROFILE ↔ ALL MODULES
════════════════════════════════════════════════════════════════

File: StudentProfile.jsx

A student profile opened from Student Management should show
all of the following tabs populated from live data:

  Overview tab:
    - Batch name: pba_batches.find(b => b.id === student.batchId)?.name
    - Subjects enrolled: batch.subjects (from above)

  Attendance tab:
    - Sessions attended, late, absent per subject
    - Overall % attendance

  Fees tab:
    - All fee records for this student
    - Total paid, total outstanding

  Exams tab:
    - All exam results for this student, grouped by subject
    - Average grade per subject

  Books tab:
    - pba_book_issues for this student
    - Shows book title, subject, issued date, status

════════════════════════════════════════════════════════════════
IMPLEMENTATION APPROACH
════════════════════════════════════════════════════════════════

For each linkage above, the fix is typically one of:

TYPE A — "Read and resolve" (most common):
  When rendering a record, resolve related names inline:
    const student = pba_students.find(s => s.id === record.studentId);
    const batch = pba_batches.find(b => b.id === record.batchId);
    display: student?.name, batch?.name

TYPE B — "Filter by foreign key":
  Show only records relevant to current context:
    pba_attendance.filter(a => a.studentId === selectedStudentId)

TYPE C — "Auto-populate dropdown from real data":
  Replace hardcoded options with dynamic ones:
    pba_batches.map(b => <option value={b.id}>{b.name}</option>)
    pba_subjects.map(s => <option value={s.id}>{s.name}</option>)
    pba_lecturers.map(l => <option value={l.id}>{l.name}</option>)

TYPE D — "Trigger cascade on action":
  When one action completes, auto-update related data:
    e.g. Print job → 'ready' → create pba_book_issues records

════════════════════════════════════════════════════════════════
FILES TO MODIFY
════════════════════════════════════════════════════════════════

  DashboardView.jsx         — LINKAGE 10 (live KPIs)
  LecturerManagementView.jsx — LINKAGE 2, 3 (subjects taught, availability grid)
  StudentManagementView.jsx  — LINKAGE 1 (batch filter)
  FeeManagementView.jsx      — LINKAGE 5 (student/batch cross-ref)
  ExamManagementView.jsx     — LINKAGE 6 (student/subject cross-ref)
  BookManagementView.jsx     — LINKAGE 7 (requisition/print/issue chain)
  PrintJobKanban.jsx         — LINKAGE 7 (job → book issues)
  CommunicationsView.jsx     — LINKAGE 8 (batch targeting)
  ParentPortalView.jsx       — LINKAGE 9 (all student data)
  StudentProfile.jsx         — LINKAGE 11 (all tabs)
  DigitalAttendance.jsx      — LINKAGE 4 (timetable-driven sessions)
  GeneralAdminView.jsx       — LINKAGE 1 (batch → student count)

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Use only inline style={{}} — no Tailwind
2. safeLS() for ALL localStorage reads; saveLS() for writes
3. ALL useState calls that read localStorage must use lazy initializer:
   useState(() => safeLS('key', []))
4. ALL array operations must guard against null:
   (array || []).filter(...), (array || []).map(...)
5. Do NOT change any UI layout or design — only fix data wiring
6. Run npm run build and confirm 0 errors
7. Then run npm run deploy to push to GitHub and trigger Vercel deployment
8. List all files modified
```
