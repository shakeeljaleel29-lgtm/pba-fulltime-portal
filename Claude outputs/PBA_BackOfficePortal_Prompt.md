# PBA Full-Time Portal — Back Office Staff Printing Portal
## AntiGravity Prompt

---

```
Build a Back Office Staff Portal for the Printing Queue system.

The flow is:
  Admin adds a print request (book title, quantity, batch, notes)
  → Back office staff log in and see all pending requests
  → Back office updates status: Queued → Printing → Ready to Distribute
  → Admin OR back office marks the job as Distributed (done)

Create ONE new file: BackOfficeView.jsx
Also touch: PrintingQueueView.jsx (enhance admin side)
Also touch: App.jsx (add /back-office route)

Do NOT change any other file.

════════════════════════════════════════════════════════════════
DATA — pba_print_jobs (single source of truth)
════════════════════════════════════════════════════════════════

Each print job is stored in pba_print_jobs as:

  {
    id:           "PJ-2026-001",          // auto-generated
    bookTitle:    "Mathematics Textbook", // required
    subject:      "Mathematics",          // optional
    batchId:      "batch-uuid",           // optional
    batchName:    "Cambridge O Level 2027",// optional
    quantity:     40,                     // required, number
    notes:        "Lecturer confirmed via email — urgent",
    requestedBy:  "Dr. K. Liyanage",     // admin name
    requestedAt:  "2026-09-24T10:00:00Z",
    status:       "queued",              // see STATUS VALUES below
    statusHistory: [
      {
        status:    "queued",
        updatedBy: "Admin",
        updatedAt: "2026-09-24T10:00:00Z",
        note:      ""
      }
    ],
    distributedAt:  null,
    distributedBy:  null
  }

STATUS VALUES (in order):
  "queued"      → job added by admin, waiting for back office
  "printing"    → back office has started printing
  "ready"       → printing complete, ready to hand out
  "distributed" → books handed out to students (terminal state)

STATUS BADGE COLOURS:
  queued:      bg #FEF3C7, text #92400E, border #FDE68A  (amber)
  printing:    bg #EFF6FF, text #1D4ED8, border #BFDBFE  (blue)
  ready:       bg #F0FDF4, text #166534, border #BBF7D0  (green)
  distributed: bg #F3F4F6, text #6B7280, border #E5E7EB  (grey)

════════════════════════════════════════════════════════════════
BACK OFFICE LOGIN — simple PIN system
════════════════════════════════════════════════════════════════

Back office staff log in with a 4-digit PIN stored in localStorage.

Default PIN on first load: "1234"

  if (!safeLS('pba_backoffice_pin', null)) {
    saveLS('pba_backoffice_pin', '1234');
  }

The login screen (shown when not authenticated):

  ┌─────────────────────────────────────┐
  │   🖨  Back Office Staff Portal       │
  │   PBA Full-Time Portal              │
  │                                     │
  │   Enter your staff PIN              │
  │   [  ●  ●  ●  ●  ]                 │
  │                                     │
  │   [1][2][3]                         │
  │   [4][5][6]                         │
  │   [7][8][9]                         │
  │      [0][⌫]                         │
  │                                     │
  │   [ Login ]                         │
  │                                     │
  │   Admin? → Back to Admin Portal     │
  └─────────────────────────────────────┘

Authentication state:
  const [boLoggedIn, setBoLoggedIn] = React.useState(
    () => sessionStorage.getItem('pba_bo_session') === 'true'
  );

On correct PIN:
  sessionStorage.setItem('pba_bo_session', 'true');
  setBoLoggedIn(true);

On logout:
  sessionStorage.removeItem('pba_bo_session');
  setBoLoggedIn(false);

Use sessionStorage (not localStorage) so login clears when the
browser tab closes — back office computers stay secure.

════════════════════════════════════════════════════════════════
BACK OFFICE DASHBOARD LAYOUT — BackOfficeView.jsx
════════════════════════════════════════════════════════════════

After login, show a full-width dashboard with four status columns
(Kanban-style):

  ┌──────────────────────────────────────────────────────────────┐
  │  🖨  Back Office — Print Job Dashboard          [Logout]     │
  │  Last updated: just now   [🔄 Refresh]                       │
  ├──────────────────────────────────────────────────────────────┤
  │  QUEUED (N)  │  PRINTING (N)  │  READY (N)  │  DONE (N)     │
  │  ──────────  │  ────────────  │  ─────────  │  ──────────   │
  │  [Job card]  │  [Job card]    │  [Job card] │  [Job card]   │
  │  [Job card]  │                │             │               │
  └──────────────────────────────────────────────────────────────┘

Each column is a flex column that scrolls independently.

Column header styling:
  queued:      background #FFFBEB, border-bottom 3px solid #F59E0B
  printing:    background #EFF6FF, border-bottom 3px solid #3B82F6
  ready:       background #F0FDF4, border-bottom 3px solid #22C55E
  distributed: background #F9FAFB, border-bottom 3px solid #9CA3AF

════════════════════════════════════════════════════════════════
JOB CARD — shown in each column
════════════════════════════════════════════════════════════════

  ┌───────────────────────────────┐
  │  📚 Mathematics Textbook      │
  │  40 copies                    │
  │                               │
  │  Batch: Cambridge O Level 2027│
  │  Requested by: Dr. K. Liyanage│
  │  24 Sep 2026, 10:00 AM        │
  │                               │
  │  Note: Lecturer confirmed via │
  │  email — urgent               │
  │                               │
  │  [▶ Start Printing]           │  ← shown only in QUEUED column
  │  [✓ Mark Ready]               │  ← shown only in PRINTING column
  │  [📦 Mark Distributed]        │  ← shown in READY column
  │  [View History]               │  ← always shown, toggles history
  └───────────────────────────────┘

Action buttons per status:
  queued   → "▶ Start Printing"  → moves to printing
  printing → "✓ Ready to Distribute" → moves to ready
  ready    → "📦 Mark as Distributed" → moves to distributed
  distributed → no action button (terminal)

When clicking an action button, show a small confirmation with
an optional note field:

  "Confirm: Mark as [new status]?"
  Note (optional): [________________]
  [Confirm]  [Cancel]

On confirm, update the job:
  const jobs = safeLS('pba_print_jobs', []) || [];
  const updated = jobs.map(j =>
    j.id === jobId ? {
      ...j,
      status: newStatus,
      statusHistory: [
        ...(j.statusHistory || []),
        {
          status:    newStatus,
          updatedBy: 'Back Office',
          updatedAt: new Date().toISOString(),
          note:      confirmNote
        }
      ],
      ...(newStatus === 'distributed' ? {
        distributedAt: new Date().toISOString(),
        distributedBy: 'Back Office'
      } : {})
    } : j
  );
  saveLS('pba_print_jobs', updated);
  setJobs(updated);

════════════════════════════════════════════════════════════════
STATUS HISTORY TOGGLE — per card
════════════════════════════════════════════════════════════════

Each card has a "View History" link that expands a timeline below
the card actions:

  ● Queued — Admin · 24 Sep 2026, 10:00 AM
  ● Printing — Back Office · 24 Sep 2026, 11:30 AM
    Note: "Starting after lunch"
  ● Ready — Back Office · 24 Sep 2026, 15:00 AM

Timeline dot colours match status badge colours.

════════════════════════════════════════════════════════════════
ADMIN SIDE — PrintingQueueView.jsx enhancements
════════════════════════════════════════════════════════════════

ENHANCEMENT A — Add Print Job form

Add a "+ New Print Request" button at the top of the Printing Queue
admin view. When clicked, open a modal with:

  Book Title *         [__________________________]
  Subject              [dropdown from pba_subjects]
  Batch                [dropdown from pba_batches ]
  Quantity *           [____] copies
  Notes / Instructions [__________________________]
                       [  multiline textarea       ]

  [Cancel]  [Add to Queue]

On save:
  const newJob = {
    id:          'PJ-' + new Date().getFullYear() + '-'
                 + String(Date.now()).slice(-4),
    bookTitle:   form.bookTitle,
    subject:     form.subject || '',
    batchId:     form.batchId || null,
    batchName:   form.batchName || '',
    quantity:    parseInt(form.quantity) || 1,
    notes:       form.notes || '',
    requestedBy: safeLS('pba_current_user', {})?.name || 'Admin',
    requestedAt: new Date().toISOString(),
    status:      'queued',
    statusHistory: [{
      status:    'queued',
      updatedBy: 'Admin',
      updatedAt: new Date().toISOString(),
      note:      ''
    }],
    distributedAt: null,
    distributedBy: null
  };
  const existing = safeLS('pba_print_jobs', []) || [];
  saveLS('pba_print_jobs', [...existing, newJob]);

ENHANCEMENT B — Admin job list with status badges

Display all print jobs in a table with columns:
  JOB ID | BOOK | BATCH | QTY | REQUESTED | STATUS | ACTIONS

Status badge uses the STATUS BADGE COLOURS defined above.

Actions per job (admin side):
  • "View Details" → expand history
  • "Mark Distributed" → available when status === 'ready'
    (admin can also close out completed jobs)
  • "Cancel / Delete" → removes job if status === 'queued' only

On admin "Mark Distributed":
  Same update logic as back office, but updatedBy: 'Admin'

ENHANCEMENT C — Sidebar badge count

The existing "Printing Queue" sidebar badge should show the count
of jobs that are NOT in 'distributed' status (i.e. active jobs):

  const activePrintJobs = (safeLS('pba_print_jobs', []) || [])
    .filter(j => j.status !== 'distributed').length;

ENHANCEMENT D — Back Office Portal link in admin

In the Printing Queue admin view, add a subtle link/button:

  <a href="/back-office" target="_blank" style={{
    fontSize: '12px', color: '#6B7280', textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center', gap: '4px'
  }}>
    🖨 Open Back Office Portal ↗
  </a>

════════════════════════════════════════════════════════════════
APP.JSX — add the /back-office route
════════════════════════════════════════════════════════════════

Add a new route for the back office portal:

  import BackOfficeView from './components/backoffice/BackOfficeView';

  // Inside your router:
  <Route path="/back-office" element={<BackOfficeView />} />

BackOfficeView.jsx lives at:
  src/components/backoffice/BackOfficeView.jsx

It is completely standalone — it has its own login screen, its own
header, and does NOT use the main app sidebar or navigation shell.
It is a separate full-page experience.

════════════════════════════════════════════════════════════════
BACK OFFICE HEADER (when logged in)
════════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────────┐
  │  🖨  PBA Back Office         [🔄 Refresh]    [Logout →]      │
  │  Print Job Dashboard · {N} active jobs                      │
  └──────────────────────────────────────────────────────────────┘

  background: linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)
  text: white
  padding: 16px 24px

════════════════════════════════════════════════════════════════
EMPTY STATE — when a column has no jobs
════════════════════════════════════════════════════════════════

  <div style={{
    textAlign: 'center', padding: '32px 16px',
    color: '#9CA3AF', fontSize: '13px'
  }}>
    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
      {column === 'queued' ? '📭' :
       column === 'printing' ? '🖨' :
       column === 'ready' ? '📦' : '✅'}
    </div>
    No jobs here
  </div>

════════════════════════════════════════════════════════════════
REAL-TIME POLLING — back office auto-refreshes every 30 seconds
════════════════════════════════════════════════════════════════

Since multiple people (admin + back office) may update jobs:

  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(safeLS('pba_print_jobs', []) || []);
    }, 30000);   // 30 seconds
    return () => clearInterval(interval);
  }, []);

Also refresh immediately on manual "🔄 Refresh" button click.

════════════════════════════════════════════════════════════════
PIN CHANGE — back office settings
════════════════════════════════════════════════════════════════

After login, show a subtle "Change PIN" link in the header footer.
Clicking it opens a small modal:

  Current PIN: [____]
  New PIN:     [____]
  Confirm PIN: [____]
  [Save PIN]

On save, validate current PIN matches, new PIN === confirm, then:
  saveLS('pba_backoffice_pin', newPin);

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Create: src/components/backoffice/BackOfficeView.jsx (NEW)
2. Modify: PrintingQueueView.jsx (admin enhancements)
3. Modify: App.jsx (add /back-office route)
4. Do NOT change any other file
5. Use only inline style={{}} — no Tailwind
6. safeLS() for ALL localStorage reads; saveLS() for writes
7. BackOfficeView is a STANDALONE page — no main app shell/sidebar
8. Session auth uses sessionStorage (clears on tab close)
9. pba_print_jobs is the SINGLE SOURCE OF TRUTH for both views
10. Admin can mark Distributed from their side too
11. Status history is append-only — never delete history entries
12. Back office PIN default is "1234" — seeded if key absent
13. The /back-office route should work even when not logged into
    the main admin portal — it has its own auth
14. Run npm run build and confirm 0 errors
15. Then npm run deploy
16. List all files modified
```
