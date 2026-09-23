# PBA Full-Time Portal — Fix "Unknown Batch" in Student Profile
## AntiGravity Prompt

---

```
Student profile drawer shows "Unknown Batch" chip in the
"Enrolled Batches" section instead of the real batch name.

This is a one-line fix in StudentManagementView.jsx (or wherever
the student profile/drawer is rendered).

Touch ONLY the file that renders the student profile drawer.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE PROBLEM
════════════════════════════════════════════════════════════════

When a student is registered via "Register New Student", the form
stores a batch reference. But the profile drawer resolves it
incorrectly and shows "Unknown Batch" instead of the batch name.

The student record may look like:
  { id: "...", batchId: "batch-uuid", batchName: undefined, ... }
OR
  { id: "...", batch: "batch-uuid", batchName: undefined, ... }

The drawer tries to display the batch name but uses the wrong
field (the raw ID) when the name is missing.

════════════════════════════════════════════════════════════════
THE FIX
════════════════════════════════════════════════════════════════

Find where the "Enrolled Batches" section renders in the student
profile drawer. It will look like ONE of:

  <span>{student.batchName || 'Unknown Batch'}</span>
  <span>{s.batch || 'Unknown Batch'}</span>
  {enrolledBatches.map(b => <span key={b}>{b || 'Unknown Batch'}</span>)}

STEP 1 — Resolve the batch name from pba_batches when it's missing.

Wherever the enrolled batch chips are rendered, wrap with a
helper that resolves the name:

  const resolveBatchName = (batchRef) => {
    if (!batchRef) return null;
    // If it's already a name (not a UUID), return it directly
    if (!batchRef.includes('-') || batchRef.length < 20) return batchRef;
    // Otherwise it's an ID — look it up in pba_batches
    const allBatches = safeLS('pba_batches', []);
    const found = (allBatches || []).find(b => b.id === batchRef);
    return found ? found.name : null;
  };

STEP 2 — In the Enrolled Batches render section, use the helper.

CASE A — If the student has a batches[] array (from buildStudentList):

  const batchLabels = (student.batches || [])
    .map(b => resolveBatchName(b) || b)
    .filter(Boolean);

  Render:
  {batchLabels.length > 0
    ? batchLabels.map((name, i) => (
        <span key={i} style={{
          display: 'inline-block',
          background: '#EFF6FF',
          color: '#1D4ED8',
          borderRadius: '999px',
          padding: '2px 12px',
          fontSize: '13px',
          fontWeight: 500,
          marginRight: '6px',
          marginBottom: '4px'
        }}>{name}</span>
      ))
    : <span style={{ color: '#9CA3AF', fontSize: '13px' }}>No batch assigned</span>
  }

CASE B — If the student has a single batchId or batch field:

  const batchLabel = resolveBatchName(student.batchId || student.batch)
    || student.batchName
    || null;

  Render:
  {batchLabel
    ? <span style={{...chip styles...}}>{batchLabel}</span>
    : <span style={{ color: '#9CA3AF', fontSize: '13px' }}>No batch assigned</span>
  }

STEP 3 — Remove all "Unknown Batch" fallback strings.

Search the file for the literal string "Unknown Batch" and
replace every occurrence with either:
  null   (if inside a conditional that already handles missing)
  <span style={{ color: '#9CA3AF' }}>No batch assigned</span>

════════════════════════════════════════════════════════════════
ALSO: When student is registered via Register New Student
════════════════════════════════════════════════════════════════

Find the "Register New Student" save handler. After it saves
the student to pba_students, add this to also write the student
into the selected batch's enrollment list in pba_batches:

  // ── Enroll new student into selected batch ──
  const selectedBatchId = newStudentForm.batchId
    || newStudentForm.batch
    || newStudentForm.batchEnrolled;
  // (use whatever field name the form uses for the batch dropdown)

  if (selectedBatchId) {
    const allBatches = safeLS('pba_batches', []);
    const updatedBatches = (allBatches || []).map(batch => {
      if (batch.id !== selectedBatchId) return batch;
      const alreadyIn = (batch.students || []).some(
        s => (s.id || s.regNo) === newStudentId
      );
      if (alreadyIn) return batch;
      return {
        ...batch,
        students: [
          ...(batch.students || []),
          {
            id:          newStudentId,
            regNo:       savedStudent.regNo || '',
            name:        savedStudent.name  || '',
            mobilePhone: savedStudent.mobilePhone || '',
            parentPhone: savedStudent.parentPhone || '',
            status:      'active',
            enrolledAt:  new Date().toISOString()
          }
        ]
      };
    });
    saveLS('pba_batches', updatedBatches);
  }
  // ── End enroll ──

Replace newStudentId and savedStudent with the actual variable
names used in the save handler.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY the file containing the student profile drawer
   (StudentManagementView.jsx or similar)
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. The resolveBatchName helper handles both batch names and IDs
5. Never display "Unknown Batch" — show the real name or "No batch assigned"
6. Run npm run build and confirm 0 errors
7. Then npm run deploy
8. List all files modified
```
