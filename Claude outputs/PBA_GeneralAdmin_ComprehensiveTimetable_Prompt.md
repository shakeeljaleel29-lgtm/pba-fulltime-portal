# PBA Full-Time Portal — General Admin: Comprehensive Classroom Manager + Timetable Builder
## AntiGravity Prompt — Combined Overhaul

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Overhaul the General Administration page — specifically the Classroom Allocations
tab (rename to "Classroom Manager") and the Visual Timetable Builder tab.
Add full classroom management, batch-centric timetable construction with hard
clash prevention, session locking, conflict detection, and an interactive grid.
Do not change any other page or component.

════════════════════════════════════════════════════════════════
NEW DATA STRUCTURES (localStorage)
════════════════════════════════════════════════════════════════

pba_classrooms — array of classroom objects:
{
  id: 'cls-' + Date.now(),
  name: string,            // e.g. "Hall A", "Lab 01", "Room 3B"
  capacity: number,
  type: 'Hall'|'Lab'|'Room'|'Auditorium',
  branch: 'Kohuwala'|'Wattala'|'Panadura'|'All',
  facilities: string[],   // ["Projector","AC","Whiteboard",...]
  isActive: boolean,
  createdAt: ISO string
}

pba_timetable_sessions — array of scheduled session objects:
{
  id: 'sess-' + Date.now(),
  day: 'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday',
  startTime: '08:00',     // 24h format string
  endTime: '10:00',
  batchId: string,         // links to pba_batch_subjects
  subjectId: string,       // links to pba_subjects
  classroomId: string,     // links to pba_classrooms
  lecturerId: string,      // links to pba_users (role Lecturer)
  branch: string,
  isRecurring: true,
  sessionType: 'Class'|'Lab'|'Revision'|'Exam'|'Event',
  notes: string,
  color: string,           // batch colour for display
  isLocked: boolean,       // locked sessions cannot be edited without unlocking first
  createdAt: ISO string
}

Safe read helper (add once at top of the file, use everywhere):
  const safeLS = (key, fallback = []) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) : (parsed ?? fallback);
    } catch { return fallback; }
  };

════════════════════════════════════════════════════════════════
TAB LAYOUT — GENERAL ADMIN PAGE
════════════════════════════════════════════════════════════════

Keep existing tabs. Update the first two:
  1. Classroom Manager           ← renamed from "Classroom Allocations"
  2. Visual Timetable Builder    ← full overhaul with batch-centric builder
  3. Today's Class Changes       (keep as-is)
  4. Year Plan Monthly Calendar  (keep as-is)
  5. Announcements Board         (keep as-is)

════════════════════════════════════════════════════════════════
TAB 1 — CLASSROOM MANAGER
════════════════════════════════════════════════════════════════

SECTION A — Header row:
  Left: "Classroom Manager" heading (Sora 18px bold) +
        subtitle "Manage halls, labs, and rooms across all branches" (Inter 12px #718096)
  Right: blue primary button "＋ Add Classroom"

SECTION B — Filter row (above grid):
  Three selects inline (gap 10px):
    Branch filter: All Branches | Kohuwala | Wattala | Panadura
    Type filter:   All Types | Hall | Lab | Room | Auditorium
    Status:        All | Active | Inactive

SECTION C — Classroom Cards Grid:
  display: grid, gridTemplateColumns: repeat(auto-fill, minmax(280px, 1fr)), gap: 14px

  Each classroom card:
  <div style={{
    background: '#FFFFFF', border: '1px solid #E3E6EA',
    borderRadius: '12px', padding: '18px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  }}>
    Top row: classroom name (Sora 14px bold) + type badge pill:
      Hall       → background #EBF4FF, color #2B6CB0
      Lab        → background #F0FFF4, color #276749
      Room       → background #FEF3C7, color #B7860A
      Auditorium → background #FAF5FF, color #6B46C1

    Capacity line: person icon + "{capacity} seats"
    Branch badge: small pill, same style as sidebar branch badge
    Facilities: comma-separated, fontSize 11px, color #718096

    Status toggle pill: Active (green #C6F6D5 / #276749) | Inactive (grey)
      — clicking toggles isActive and saves to localStorage

    Bottom action row (right-aligned):
      "Edit" (ghost blue) | "Delete" (ghost red) | "View Schedule" link
      "View Schedule" → switches to Timetable Builder tab filtered to this classroom

  Empty state: building SVG + "No classrooms added yet" + "＋ Add Classroom" button

SECTION D — Add / Edit Classroom Modal:
  Fields:
  1. Classroom Name  — text, placeholder "e.g. Hall A, Lab 01, Room 3B"
  2. Type            — select: Hall | Lab | Room | Auditorium
  3. Capacity        — number, placeholder "e.g. 40"
  4. Branch          — select: Kohuwala | Wattala | Panadura | All Branches
  5. Facilities      — multi-checkbox row:
       ☐ Projector  ☐ AC  ☐ Whiteboard  ☐ Smart Board  ☐ Computer  ☐ PA System
  6. Status          — toggle: Active / Inactive (default Active)

  Footer: Cancel (ghost) | Save Classroom (blue primary)
  On save: push/update pba_classrooms, re-render grid.

SECTION E — Daily Allocations Sheet (below the cards):
  Header row:
    Left: "Today's Allocations" (Sora 14px bold)
    Right: date picker (type="date", defaults to today) +
           "Print PDF" (gold) + "Share via WhatsApp" (green)

  Derive rows from pba_timetable_sessions matching the selected date's day-of-week.
  Table columns: TIME SLOT | CLASSROOM | BATCH | SUBJECT SESSION | LECTURER | BRANCH | ACTIONS
  Actions per row: pencil icon (edit session) | trash icon (delete session)

  Conflict row styling: same classroom + overlapping time on same day →
    row background #FFF5F5, left border 3px solid #FC8181,
    small red "⚠ Conflict" badge in CLASSROOM cell.

  Empty state: calendar SVG + "No sessions scheduled for this day"
  Below table: "＋ Add a session for this day" blue link → opens Add Session modal

════════════════════════════════════════════════════════════════
TAB 2 — VISUAL TIMETABLE BUILDER (FULL OVERHAUL)
════════════════════════════════════════════════════════════════

OVERVIEW — BATCH-CENTRIC BUILD WORKFLOW:
  The administrator builds the timetable batch by batch.
  When a batch is selected, the grid highlights that batch's sessions prominently
  and dims all other batches. Slots already occupied by the selected batch are
  visually blocked so the admin can never accidentally schedule two subjects
  from the same batch at the same time (hard block).

  Three levels of clash:
    HARD BLOCK  — same batch, same day, overlapping time → CANNOT save, modal shows error
    SOFT WARN   — same lecturer, different batch, overlapping time → CAN save, warning shown
    SOFT WARN   — same classroom, different batch, overlapping time → CAN save, warning shown

────────────────────────────────────────────────────────────────
SECTION A — Toolbar (above grid)
────────────────────────────────────────────────────────────────

Left group:
  "BUILD MODE" label + Active Batch selector (pill dropdown):
    "All Batches" (default view) | one option per batch in pba_batch_subjects
    When a batch is selected: toolbar shows the batch pill in that batch's colour.
    Label: "Building: {batchName}" with a coloured left border.

  Day range toggle: "Full Week" | "Mon–Wed" | "Thu–Sat" (pill toggle)
  Branch filter select
  Classroom filter select ("All Classrooms" + list from pba_classrooms)

Right group:
  "＋ Add Session" blue primary button (opens modal with active batch pre-selected)
  "Print Timetable" gold button (see SECTION F)
  "Share via WhatsApp" green button

────────────────────────────────────────────────────────────────
SECTION B — Progress Bar (shows when a batch is selected in Build Mode)
────────────────────────────────────────────────────────────────

Below the toolbar, when activeBatch ≠ 'All':
<div style={{
  background: '#FFFFFF', border: '1px solid #E3E6EA',
  borderRadius: '10px', padding: '12px 18px',
  display: 'flex', alignItems: 'center', gap: '16px',
  marginBottom: '12px'
}}>
  Batch name pill (in batch colour) +
  "Subjects Scheduled: {scheduledCount} / {totalSubjectsInBatch}" +
  Progress bar:
    <div style={{ flex:1, background:'#F0F2F5', borderRadius:'6px', height:'8px' }}>
      <div style={{ width: pct+'%', background: batchColor, borderRadius:'6px', height:'8px' }}/>
    </div>
  If scheduledCount === totalSubjectsInBatch:
    Show green "✓ Timetable Complete" badge

  Also show chip row listing subjects NOT yet scheduled for this batch (grey pills),
  so the admin knows what still needs a time slot.

────────────────────────────────────────────────────────────────
SECTION C — Batch Colour Legend + Stats Row
────────────────────────────────────────────────────────────────

Left: one pill per batch (same as before):
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: batch.color + '20', color: batch.color,
    border: '1px solid ' + batch.color + '60',
    borderRadius: '20px', padding: '3px 10px',
    fontSize: '11px', fontWeight: 700, marginRight: '6px'
  }}>● {batch.name}</span>

Right: four stat chips (white cards, compact):
  1. Total Sessions This Week  — count of pba_timetable_sessions
  2. Active Classrooms         — count of pba_classrooms where isActive = true
  3. In Use Today              — sessions on today's day name
  4. Conflicts                 — count of classroom/lecturer overlaps (red chip if >0)

────────────────────────────────────────────────────────────────
SECTION D — Weekly Grid
────────────────────────────────────────────────────────────────

Layout: CSS grid, first column = time labels, remaining columns = day columns.
Time rows every 30 minutes from 07:00 to 20:00.
Each row height: 48px (1 hour = 96px).
Time label: fontSize 11px, color #A0AEC0, textAlign right, paddingRight 8px.
Hour lines: borderBottom 1px solid #E3E6EA.
Half-hour lines: borderBottom 1px dashed #F0F2F5.

Day column headers:
  Day name, bold, textAlign center, borderBottom 2px solid #E3E6EA.
  Today's column: header background #EBF4FF, text #2B6CB0.

BATCH-FOCUS SHADING (when activeBatch ≠ 'All'):
  Time cells occupied by the active batch's sessions:
    background: batch.color + '18' (very light tint — the session card sits on top)
  Time cells occupied by OTHER batches' sessions:
    background: #F7F8FA (dimmed)
  These tinted cell backgrounds tell the admin at a glance:
    "This slot is already taken by THIS batch" (can't add here)
    vs "This slot is used by another batch" (can add here, but get lecturer/room conflict check)

CLICK ON EMPTY CELL:
  If activeBatch is selected and that slot is already used by the active batch:
    Show a brief tooltip: "⛔ {activeBatchName} already has a class at this time"
    Do NOT open the modal.
  Otherwise: open Add Session modal with day + startTime pre-filled.

SESSION BLOCKS (rendered absolutely within each day column):
  Position each block:
    top    = (startMinutes - 420) / 30 * 48 + 'px'   // 420 = 07:00
    height = durationMinutes / 30 * 48 + 'px'

  Session card:
  <div style={{
    position: 'absolute', left: '4px', right: '4px',
    borderRadius: '8px', padding: '6px 8px',
    background: session.color + '20' || '#EBF4FF',
    borderLeft: '3px solid ' + (session.color || '#2B6CB0'),
    cursor: 'pointer', overflow: 'hidden',
    opacity: (activeBatch !== 'All' && session.batchId !== activeBatch) ? 0.35 : 1
  }}>
    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1A202C' }}>
      {subjectName}
    </div>
    <div style={{ fontSize: '10px', color: '#718096' }}>{batchName}</div>
    <div style={{ fontSize: '10px', color: '#718096' }}>
      {classroomName} · {lecturerName}
    </div>
    <div style={{ fontSize: '10px', color: session.color || '#2B6CB0' }}>
      {startTime} – {endTime}
    </div>
    {session.isLocked && (
      <div style={{ position:'absolute', top:'5px', right:'6px', fontSize:'10px' }}>🔒</div>
    )}
  </div>

  CONFLICT OVERLAY (classroom or lecturer double-booking):
    background: repeating-linear-gradient(
      45deg, rgba(252,129,129,0.15), rgba(252,129,129,0.15) 4px,
      transparent 4px, transparent 8px
    )
    border: 2px solid #FC8181
    Show ⚠ icon top-right corner of the card.

  Click on session card:
    If session.isLocked → show tooltip "🔒 Session is locked. Click the lock icon to unlock."
    Otherwise → open Edit Session modal pre-filled.

────────────────────────────────────────────────────────────────
SECTION E — Add / Edit Session Modal
────────────────────────────────────────────────────────────────

Title: "Schedule a Session" (add) / "Edit Session" (edit)

HARD BLOCK BANNER — shown at top if same-batch time clash exists:
<div style={{
  background: '#FFF5F5', border: '2px solid #FC8181',
  borderRadius: '8px', padding: '12px 14px', marginBottom: '14px',
  fontSize: '13px', color: '#C53030', fontWeight: 700,
  display: 'flex', alignItems: 'center', gap: '10px'
}}>
  ⛔ CLASH: {batchName} already has "{conflictingSubjectName}" scheduled
  on {day} {conflictStartTime}–{conflictEndTime}. Choose a different time slot.
</div>
When a hard block is present: the "Save Session" button is DISABLED (greyed out).

SOFT WARNING BANNER — shown if lecturer or classroom conflict (but no same-batch clash):
<div style={{
  background: '#FFFBEB', border: '1px solid #F6D860',
  borderRadius: '8px', padding: '10px 14px', marginBottom: '14px',
  fontSize: '12px', color: '#B7860A', display: 'flex', gap: '8px'
}}>
  ⚠ {warningText}
</div>
(Save button stays enabled — warn, don't block.)

Fields:

1. BATCH — select from pba_batch_subjects
   If activeBatch is set in the builder, pre-select it (but allow changing).
   On change: reload SUBJECT and LECTURER dropdowns.

2. SUBJECT — select subjects linked to selected batch.
   On change: auto-populate LECTURER from subjectAssignments.mainLecturerId.

3. LECTURER — select from pba_users with role Lecturer.
   Pre-filled from batch-subject assignment. Shows "(Busy at this time)" suffix
   in red next to any lecturer already assigned elsewhere during the chosen slot.

4. DAY — select: Monday–Saturday.
   If user clicked a grid cell, pre-fill.

5. TIME — two side-by-side time pickers (step=1800):
   Start Time [08:00]  End Time [10:00]
   Below: auto-calculated "Duration: 2 hrs"

   REAL-TIME CLASH CHECK: as soon as day + startTime + endTime + batchId are all
   set, immediately check for clashes and show/hide the banners above.

6. CLASSROOM — select from active pba_classrooms for the relevant branch.
   Below the select: availability hint:
     ✓ green "Hall A is free on {day} at this time"
     ⚠ amber "Hall A is already booked {startTime}–{endTime} {day} ({batchName})"

7. SESSION TYPE — pill selector: Class | Lab | Revision | Exam | Event
   Each pill: grey unselected, coloured when selected
     Class → blue  |  Lab → green  |  Revision → amber  |  Exam → red  |  Event → purple

8. BRANCH — auto-filled from batch, editable.

9. NOTES — textarea, rows 2, optional.

10. LOCK SESSION — checkbox: "🔒 Lock this session after saving (prevents accidental edits)"
    Default: unchecked. When checked, saved session gets isLocked: true.

Modal Footer:
  Left (edit mode only): "Delete Session" (red ghost) | "🔒 Lock / 🔓 Unlock" toggle button
  Right: Cancel (ghost) | Save Session (blue primary — disabled if hard clash)

On save:
  If same-batch time clash detected → do not save, keep modal open with hard block banner.
  Otherwise → push/update pba_timetable_sessions, close modal, re-render grid.

────────────────────────────────────────────────────────────────
SECTION F — PRINT / EXPORT (per-batch timetable)
────────────────────────────────────────────────────────────────

"Print Timetable" gold button opens a print-optimised view:
  If activeBatch is selected: print only that batch's sessions as a clean weekly grid.
  If "All Batches": print the full timetable.
  Print header: "PBA Full-Time Portal — Weekly Timetable" + batch name + generated date.
  Use window.print() with a print-specific CSS block injected:
    @media print { body { font-size: 11px; } .no-print { display: none; } }

────────────────────────────────────────────────────────────────
CLASH DETECTION LOGIC (reusable function)
────────────────────────────────────────────────────────────────

Add helper function (use throughout the file):

  const timesOverlap = (aStart, aEnd, bStart, bEnd) => {
    const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
    return toMin(aStart) < toMin(bEnd) && toMin(bEnd) > toMin(aStart)
      ? true
      : toMin(aStart) < toMin(bEnd) && toMin(aStart) < toMin(bEnd)
      ? false : false;
    // Correct version:
    // return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd);
  };

  Actually implement it as:
  const timesOverlap = (aStart, aEnd, bStart, bEnd) => {
    const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
    return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd);
  };

  detectClashes(sessions, newSession, excludeId = null):
    const others = sessions.filter(s => s.id !== excludeId && s.day === newSession.day);
    const sameBatchClash = others.find(s =>
      s.batchId === newSession.batchId &&
      timesOverlap(s.startTime, s.endTime, newSession.startTime, newSession.endTime)
    );
    const lecturerClash = others.find(s =>
      s.lecturerId === newSession.lecturerId && newSession.lecturerId &&
      timesOverlap(s.startTime, s.endTime, newSession.startTime, newSession.endTime)
    );
    const classroomClash = others.find(s =>
      s.classroomId === newSession.classroomId && newSession.classroomId &&
      timesOverlap(s.startTime, s.endTime, newSession.startTime, newSession.endTime)
    );
    return { sameBatchClash, lecturerClash, classroomClash };

════════════════════════════════════════════════════════════════
SEED DATA
════════════════════════════════════════════════════════════════

Seed pba_classrooms if empty on first load:
  [
    { id:'cls-1', name:'Hall A',   capacity:40, type:'Hall', branch:'Kohuwala', facilities:['Projector','AC','Whiteboard'], isActive:true, createdAt: new Date().toISOString() },
    { id:'cls-2', name:'Hall B',   capacity:35, type:'Hall', branch:'Wattala',  facilities:['Projector','AC'],              isActive:true, createdAt: new Date().toISOString() },
    { id:'cls-3', name:'Lab 01',   capacity:30, type:'Lab',  branch:'Kohuwala', facilities:['Computer','AC','Whiteboard'],  isActive:true, createdAt: new Date().toISOString() },
    { id:'cls-4', name:'Room 3B',  capacity:25, type:'Room', branch:'Panadura', facilities:['Whiteboard'],                  isActive:true, createdAt: new Date().toISOString() }
  ]

Migrate existing hardcoded sessions (Business Studies Mon 08:00, Economics Tue 08:00,
Accounting Mon 10:30) into pba_timetable_sessions if not already there, linking to
matching classroom ids. Set isLocked: false, isRecurring: true.

════════════════════════════════════════════════════════════════
STYLING RULES
════════════════════════════════════════════════════════════════

All new modals: white card, borderRadius 12px, boxShadow 0 20px 60px rgba(0,0,0,0.15)
                maxWidth 580px, centered with dark overlay (background rgba(0,0,0,0.45))
Modal header: borderBottom 1px solid #E3E6EA, padding 20px 24px
  Left: title (Sora 15px 700) | Right: ✕ close button
Modal body: padding 20px 24px, maxHeight 72vh, overflowY auto
Modal footer: borderTop 1px solid #E3E6EA, padding 16px 24px, display flex,
              justifyContent space-between, gap 10px

Form labels: fontSize 10px, fontWeight 700, color #718096,
             textTransform uppercase, letterSpacing 0.5px, marginBottom 4px
Inputs/selects: width 100%, padding 8px 10px, border 1px solid #E3E6EA,
                borderRadius 7px, fontSize 13px, outline none
Focus: border-color #2B6CB0, boxShadow 0 0 0 3px rgba(43,108,176,0.12)

Primary button:  background #2B6CB0, color #FFFFFF, padding 8px 18px, borderRadius 7px, fontWeight 600
Ghost blue:      background transparent, border 1.5px solid #2B6CB0, color #2B6CB0
Ghost red:       background transparent, border 1.5px solid #E53E3E, color #E53E3E
Gold button:     background #D4A017, color #FFFFFF, padding 8px 18px, borderRadius 7px, fontWeight 600
Green button:    background #276749, color #FFFFFF, padding 8px 18px, borderRadius 7px, fontWeight 600
Disabled button: opacity 0.45, cursor not-allowed, pointerEvents none

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any other page (Students, Examinations, Lecturers, etc.)
2. Use only inline style={{}} props — no Tailwind
3. All localStorage reads must use safeLS() — never raw JSON.parse at top level
4. timesOverlap() must be correct: aStart < bEnd && bStart < aEnd
5. Same-batch clash = HARD BLOCK (disabled save button, red banner)
   Lecturer / classroom clash = SOFT WARN (yellow banner, save still allowed)
6. isLocked sessions show 🔒 icon on card; clicking opens modal with "Unlock to Edit" prompt
7. Run npm run build and confirm 0 errors
8. List all files modified
```
