# PBA Full-Time Portal — Student Database: Write-Side Sync Fix
## AntiGravity Prompt

---

```
The Student Database shows 0 results for batch-enrolled students.
Root cause: when students are enrolled via Batch Manager, they are
saved ONLY to pba_batches. The Student Database reads pba_students,
which is never updated.

Fix: whenever a student is enrolled into a batch (or imported),
write their profile to pba_students as well.

Touch ONLY GeneralAdminView.jsx.
Do NOT change StudentManagementView.jsx or any other file.

════════════════════════════════════════════════════════════════
UNDERSTAND THE DATA STORES
════════════════════════════════════════════════════════════════

pba_batches — source of truth for enrollment relationships:
  pba_batches = [
    {
      id: "batch-uuid",
      name: "Anuka",
      students: [
        { id: "s-uuid", regNo: "PBA-FT-2024-004",
          name: "Hiruni Mendis", mobilePhone: "...",
          parentPhone: "...", status: "active", enrolledAt: "..." }
      ]
    }
  ]

pba_students — source of truth for Student Database tab:
  pba_students = [
    { id: "s-uuid", regNo: "PBA-FT-2024-004",
      name: "Hiruni Mendis", mobilePhone: "...",
      parentPhone: "...", status: "active" }
  ]

GOAL: every student record that is saved to pba_batches must ALSO
be written (or updated) in pba_students. No batchId stored in
pba_students — a student may be in many batches.

════════════════════════════════════════════════════════════════
FIND THE ENROLLMENT SAVE HANDLER
════════════════════════════════════════════════════════════════

In GeneralAdminView.jsx, find the function that saves students
into a batch. It will look like ONE of:

  const handleEnrollStudents = () => { ... }
  const saveEnrollment = () => { ... }
  const handleSaveEnrolledStudents = () => { ... }
  const handleAddStudentToBatch = () => { ... }

Look for where pba_batches is written with saveLS. The pattern
will be something like:

  const updatedBatches = batches.map(b =>
    b.id === selectedBatch.id
      ? { ...b, students: [...(b.students || []), ...newStudents] }
      : b
  );
  saveLS('pba_batches', updatedBatches);

════════════════════════════════════════════════════════════════
EDIT — Add pba_students sync AFTER every pba_batches save
════════════════════════════════════════════════════════════════

IMMEDIATELY AFTER every saveLS('pba_batches', ...) call inside
the enrollment handler, INSERT this sync block:

  // ── Sync enrolled students to pba_students ──
  const _syncStudentsToProfiles = (studentsToSync) => {
    const existingProfiles = safeLS('pba_students', []);
    const profileMap = {};
    (existingProfiles || []).forEach(p => {
      const pid = p.id || p.regNo;
      if (pid) profileMap[pid] = p;
    });

    (studentsToSync || []).forEach(student => {
      const sid = student.id || student.studentId || student.regNo;
      if (!sid) return;
      const profile = {
        id:          sid,
        regNo:       student.regNo       || '',
        name:        student.name        || student.studentName || '',
        mobilePhone: student.mobilePhone || student.phone       || '',
        parentPhone: student.parentPhone || '',
        status:      student.status      || 'active'
        // NOTE: no batchId — student can belong to multiple batches
      };
      if (profileMap[sid]) {
        // Update existing — preserve fields not in enrollment record
        profileMap[sid] = { ...profileMap[sid], ...profile };
      } else {
        profileMap[sid] = profile;
      }
    });

    saveLS('pba_students', Object.values(profileMap));
  };

  // Call with the students that were just enrolled
  // (use the same variable you just saved to pba_batches)
  _syncStudentsToProfiles(newStudents);
  // ── End sync ──

IMPORTANT: replace `newStudents` above with WHATEVER variable
holds the students that were just enrolled into the batch.
Look at the code just above the saveLS('pba_batches', ...) line
to find the right variable name. It may be called:
  newStudents, enrolledStudents, selectedStudents,
  studentsToAdd, studentsToEnroll, batchStudents

Use the same variable name consistently.

════════════════════════════════════════════════════════════════
ALSO HANDLE: Withdraw / Remove student from batch
════════════════════════════════════════════════════════════════

When a student is WITHDRAWN from a batch, their pba_students
profile should be updated to status 'withdrawn' ONLY IF they
are not active in any other batch.

Find the withdraw handler (it will call saveLS('pba_batches', ...)).
AFTER that saveLS call, ADD:

  // ── Update status in pba_students after withdrawal ──
  const _updateWithdrawnStatus = (withdrawnStudentId) => {
    const allBatches = safeLS('pba_batches', []);
    // Check if student is still active in any other batch
    const stillActiveElsewhere = (allBatches || []).some(batch =>
      (batch.students || batch.enrolledStudents || []).some(s => {
        const sid = s.id || s.studentId || s.regNo;
        return sid === withdrawnStudentId && s.status !== 'withdrawn';
      })
    );

    if (!stillActiveElsewhere) {
      const profiles = safeLS('pba_students', []);
      const updated = (profiles || []).map(p => {
        const pid = p.id || p.regNo;
        return pid === withdrawnStudentId
          ? { ...p, status: 'withdrawn' }
          : p;
      });
      saveLS('pba_students', updated);
    }
  };

  // Call with the id of the student just withdrawn
  // (replace withdrawnId with the actual variable or value)
  _updateWithdrawnStatus(withdrawnId);
  // ── End withdraw sync ──

IMPORTANT: replace `withdrawnId` with whatever variable holds
the id of the student being withdrawn. It might be:
  student.id, s.id, selectedStudent.id, studentId

════════════════════════════════════════════════════════════════
ALSO HANDLE: Import Students (if import exists in this file)
════════════════════════════════════════════════════════════════

If GeneralAdminView.jsx has a CSV or bulk import for students
(look for Papa.parse, FileReader, or handleImport), find where
it saves imported students and ADD the same sync block:

  _syncStudentsToProfiles(importedStudents);
  // (use the variable holding the imported student array)

════════════════════════════════════════════════════════════════
BACKFILL — Run on component mount to sync existing data
════════════════════════════════════════════════════════════════

Add a ONE-TIME backfill useEffect so students already in
pba_batches (enrolled before this fix) appear in pba_students:

  // ── One-time backfill: sync all existing batch enrollments ──
  useEffect(() => {
    const allBatches = safeLS('pba_batches', []);
    const allStudents = [];
    (allBatches || []).forEach(batch => {
      const enrolled = batch.students
        || batch.enrolledStudents
        || batch.studentList
        || [];
      (enrolled || []).forEach(s => allStudents.push(s));
    });

    if (allStudents.length > 0) {
      const existingProfiles = safeLS('pba_students', []);
      const profileMap = {};
      (existingProfiles || []).forEach(p => {
        const pid = p.id || p.regNo;
        if (pid) profileMap[pid] = p;
      });

      allStudents.forEach(student => {
        const sid = student.id || student.studentId || student.regNo;
        if (!sid) return;
        if (!profileMap[sid]) {
          profileMap[sid] = {
            id:          sid,
            regNo:       student.regNo       || '',
            name:        student.name        || student.studentName || '',
            mobilePhone: student.mobilePhone || student.phone       || '',
            parentPhone: student.parentPhone || '',
            status:      student.status      || 'active'
          };
        }
      });

      saveLS('pba_students', Object.values(profileMap));
    }
  }, []);
  // ── End backfill ──

Place this useEffect INSIDE the GeneralAdminView component,
near the top with other useEffects. Make sure useEffect is
imported:
  import React, { useState, useEffect } from 'react';

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL array operations must guard against null:
   (array || []).filter(...), (array || []).map(...)
5. pba_students stores ONE record per student — no batchId field.
   Batch membership is stored in pba_batches and derived at read time.
6. The _syncStudentsToProfiles helper uses a map so if the same
   student is in two batches, they still appear ONCE in pba_students.
7. Do NOT clear or delete pba_students — only add/update.
8. The backfill useEffect runs every time GeneralAdminView mounts,
   but is cheap (no network calls, just localStorage reads/writes).
9. After this fix, the Student Database tab will automatically show
   all batch-enrolled students because pba_students is now populated.
10. Run npm run build and confirm 0 errors
11. Then npm run deploy to push to GitHub and trigger Vercel deployment
12. List all files modified
```
