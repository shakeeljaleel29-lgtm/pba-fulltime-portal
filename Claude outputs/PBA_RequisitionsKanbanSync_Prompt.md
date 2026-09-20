# PBA Full-Time Portal — Requisitions ↔ Kanban Status Sync
## AntiGravity Prompt

---

```
Sync the Requisitions tab ACTION column with the Kanban print job status.
Touch ONLY BookManagementView.jsx and PrintJobKanban.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE PROBLEM
════════════════════════════════════════════════════════════════

When a textbook print job is marked "Completed" in the Kanban board,
the Requisitions tab still shows "● In Queue" in the ACTION column.
The two data sources are not cross-referenced.

Data lives in localStorage:
  pba_requisitions   — requisition records (status: 'pending' | 'approved')
  pba_print_jobs     — print job records   (status: 'queued' | 'in_progress' | 'ready' | 'completed')

Each print job was created from a requisition and should reference it via:
  printJob.requisitionId  (or printJob.requisition_id — use whatever field name currently exists)

════════════════════════════════════════════════════════════════
THE FIX — BookManagementView.jsx (Requisitions tab)
════════════════════════════════════════════════════════════════

In the Requisitions tab table, when rendering the ACTION column for each row:

Step 1 — Load pba_print_jobs at the top of the component:
  const [printJobs, setPrintJobs] = useState(() => safeLS('pba_print_jobs', []));

Step 2 — In the ACTION column renderer, find the matching print job:
  const matchingJob = (printJobs || []).find(
    job => job.requisitionId === req.id || job.requisition_id === req.id
  );

Step 3 — Render based on combined status:

  // Still pending approval — show Approve button
  if (req.status === 'pending') {
    return (
      <button style={{
        padding: '6px 14px', background: '#4F46E5', color: 'white',
        border: 'none', borderRadius: '6px', fontSize: '12px',
        fontWeight: 700, cursor: 'pointer'
      }}>
        ✓ Approve &amp; Print
      </button>
    );
  }

  // Approved — check print job status
  if (req.status === 'approved') {
    if (!matchingJob) {
      // Approved but no print job created yet
      return <span style={{ color: '#718096', fontSize: '11px' }}>● In Queue</span>;
    }
    if (matchingJob.status === 'completed') {
      return <span style={{ color: '#276749', fontSize: '11px', fontWeight: 600 }}>✓ Completed</span>;
    }
    if (matchingJob.status === 'ready') {
      return <span style={{ color: '#6B46C1', fontSize: '11px', fontWeight: 600 }}>📦 Ready to Distribute</span>;
    }
    if (matchingJob.status === 'in_progress') {
      return <span style={{ color: '#2B6CB0', fontSize: '11px', fontWeight: 600 }}>🖨 Printing...</span>;
    }
    // Default: queued
    return <span style={{ color: '#718096', fontSize: '11px' }}>● In Queue</span>;
  }

════════════════════════════════════════════════════════════════
THE FIX — PrintJobKanban.jsx (ensure requisitionId is saved)
════════════════════════════════════════════════════════════════

When a new print job is created from the Requisitions tab (Approve & Print):
Ensure the print job object includes the requisition's id:

  const newPrintJob = {
    id: Date.now().toString(),
    requisitionId: req.id,   // ← THIS LINK IS CRITICAL
    bookTitle: req.bookTitle,
    batchId: req.batchId,
    batchName: req.batchName,
    subjectId: req.subjectId,
    qty: req.qty,
    status: 'queued',
    createdOn: new Date().toISOString(),
    notes: req.notes || ''
  };

If the print job creation code is in BookManagementView.jsx (not PrintJobKanban.jsx),
apply the fix there instead — the key point is that requisitionId is stored.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY BookManagementView.jsx and PrintJobKanban.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. The STATUS column in Requisitions should ALWAYS reflect the real
   current state of the linked print job in real time
5. Run npm run build and confirm 0 errors
6. Then run npm run deploy to push to GitHub and trigger Vercel deployment
7. List all files modified
```
