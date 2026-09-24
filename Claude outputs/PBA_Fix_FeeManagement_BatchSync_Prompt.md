# PBA Full-Time Portal — Fix: Fee Management Batch/Student Not Syncing
## AntiGravity Prompt

---

```
Fee Management has two sync problems:

  BUG 1 — The Student Fee Ledger only shows students who already
           have a stored ledger entry. Students newly enrolled
           in a batch never appear — the ledger must AUTO-GENERATE
           entries for every enrolled student based on pba_batches
           + pba_fee_structures.

  BUG 2 — The BATCH column in the ledger table and the Filter by
           Batch dropdown read batch from the stale student object
           field. Must derive from pba_batches instead.

  BUG 3 — Active Fee Structures tile shows 0 even when structures
           exist — now stored in pba_fee_structures (not the old key).

Touch ONLY FeeManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE CORRECT DATA FLOW FOR STUDENT FEE LEDGERS
════════════════════════════════════════════════════════════════

The ledger must be DERIVED, not just read from storage:

  Step 1: Read pba_batches → find every student enrolled in each batch
  Step 2: Read pba_fee_structures → find the fee structure for each batch
  Step 3: For each (student, feeStructure) pair, check if a ledger
          entry already exists in pba_fee_ledger; if yes use it,
          if no AUTO-CREATE a pending entry
  Step 4: Display the merged result

════════════════════════════════════════════════════════════════
COMPLETE FIX — Replace the ledger derivation logic
════════════════════════════════════════════════════════════════

Inside the component (before the JSX return), replace however
the fee ledger is currently built with this pattern:

  // ── Raw data ──────────────────────────────────────────────
  const allBatches      = safeLS('pba_batches',        []) || [];
  const allStudents     = safeLS('pba_students',       []) || [];
  const feeStructures   = safeLS('pba_fee_structures', []) || [];
  const storedLedger    = safeLS('pba_fee_ledger',     []) || [];

  // ── Helper: get student details from pba_students by id ──
  const getStudentDetails = (studentIdStr) =>
    allStudents.find(s =>
      (s.id || s.regNo || s.studentId || '').toString() === studentIdStr
    ) || {};

  // ── Derive the full ledger ─────────────────────────────────
  // For every batch that has a fee structure, generate an entry
  // for every enrolled student. Use stored entry if it exists,
  // otherwise create a fresh UNPAID entry.

  const derivedLedger = [];

  allBatches.forEach(batch => {
    const feeStruct = feeStructures.find(fs => fs.batchId === batch.id);
    if (!feeStruct) return; // no fee structure for this batch — skip

    (batch.students || []).forEach(batchStudent => {
      const studentIdStr = (
        batchStudent.id || batchStudent.regNo || batchStudent.studentId || ''
      ).toString();
      if (!studentIdStr) return;

      const studentDetails = getStudentDetails(studentIdStr);
      const studentName =
        batchStudent.name ||
        studentDetails.name ||
        studentDetails.studentName ||
        studentIdStr;

      // Check if a ledger entry already exists for this student+batch
      const existing = storedLedger.find(e =>
        (e.studentId || '').toString() === studentIdStr &&
        e.batchId === batch.id
      );

      if (existing) {
        // Use stored entry but refresh name and batch name
        derivedLedger.push({
          ...existing,
          studentName,
          batchName: batch.name || existing.batchName,
        });
      } else {
        // Auto-generate a new UNPAID entry
        const today = new Date();
        const dueDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          10
        );
        const dueDateStr = `${dueDate.getFullYear()}-${
          String(dueDate.getMonth()+1).padStart(2,'0')}-10`;

        derivedLedger.push({
          id:          `${studentIdStr}_${batch.id}_${Date.now()}`,
          studentId:   studentIdStr,
          studentName,
          batchId:     batch.id,
          batchName:   batch.name || '',
          description: feeStruct.feeName || 'Monthly Fee',
          amount:      feeStruct.amount  || 0,
          amountPaid:  0,
          balance:     feeStruct.amount  || 0,
          dueDate:     dueDateStr,
          status:      'Unpaid',
          isOverdue:   false,
        });
      }
    });
  });

  // Sort: Overdue first, then Unpaid, then Paid
  const statusOrder = { 'Unpaid': 1, 'Paid': 2, 'Partial': 1 };
  derivedLedger.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2);
  });

Use derivedLedger (not storedLedger) for the table display.

════════════════════════════════════════════════════════════════
FIX — Filter by Batch dropdown
════════════════════════════════════════════════════════════════

The batch filter dropdown must be populated from pba_batches,
not from a hardcoded list or stale student fields:

  <option value=''>All Batches</option>
  {allBatches.map(b => (
    <option key={b.id} value={b.id}>{b.name}</option>
  ))}

Filter derivedLedger by selectedBatchId:

  const displayedLedger = selectedBatchId
    ? derivedLedger.filter(e => e.batchId === selectedBatchId)
    : derivedLedger;

════════════════════════════════════════════════════════════════
FIX — "Record Payment" saves back to pba_fee_ledger
════════════════════════════════════════════════════════════════

When the admin records a payment, save the updated entry to
pba_fee_ledger so it persists across refreshes:

  const recordPayment = (entryId, paidAmount) => {
    const amount = parseFloat(paidAmount) || 0;
    const entry  = derivedLedger.find(e => e.id === entryId);
    if (!entry) return;

    const newPaid    = (entry.amountPaid || 0) + amount;
    const newBalance = (entry.amount || 0) - newPaid;
    const newStatus  = newBalance <= 0 ? 'Paid'
                     : newPaid > 0     ? 'Partial'
                     :                   'Unpaid';

    const updatedEntry = {
      ...entry,
      amountPaid: newPaid,
      balance:    Math.max(0, newBalance),
      status:     newStatus,
      paidAt:     new Date().toISOString(),
    };

    // Upsert into pba_fee_ledger
    const current = safeLS('pba_fee_ledger', []) || [];
    const idx = current.findIndex(e => e.id === entryId);
    const updated = idx >= 0
      ? current.map(e => e.id === entryId ? updatedEntry : e)
      : [...current, updatedEntry];
    saveLS('pba_fee_ledger', updated);
    // trigger re-render
  };

════════════════════════════════════════════════════════════════
FIX — Summary tiles
════════════════════════════════════════════════════════════════

  // Total Outstanding = sum of all Unpaid/Partial balances
  const totalOutstanding = derivedLedger
    .filter(e => e.status !== 'Paid')
    .reduce((sum, e) => sum + (e.balance || 0), 0);

  // Total Collections = sum of all amountPaid across ledger
  const totalCollections = derivedLedger
    .reduce((sum, e) => sum + (e.amountPaid || 0), 0);

  // Active Fee Structures = count from pba_fee_structures
  const activeFeeStructures = feeStructures.length;

Display these in the three summary tiles instead of hardcoded
or stale values.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY FeeManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. derivedLedger is computed every render from pba_batches +
   pba_fee_structures + pba_fee_ledger — never store the
   derived ledger itself; only store confirmed payments in
   pba_fee_ledger
5. A student with NO fee structure on their batch does NOT
   appear in the ledger — only students in batches that have
   a fee structure get entries
6. Do NOT remove the existing "Print Receipt", "Record Payment",
   or "Send Reminder" buttons — only fix the data layer
7. The "Record Payment" modal (if one exists) must call
   recordPayment() on confirm and trigger a re-render
8. Run npm run build and confirm 0 errors
9. Then npm run deploy
10. List all files modified
```
