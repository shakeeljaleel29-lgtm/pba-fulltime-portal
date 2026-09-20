# PBA Full-Time Portal — General Admin: Classroom Manager + Timetable Builder Overhaul
## AntiGravity Prompt — Comprehensive Feature Expansion

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Overhaul the General Administration page — specifically the Classroom Allocations
tab and the Visual Timetable Builder tab. Add full classroom management, session
scheduling, conflict detection, and an interactive timetable. Do not change any
other page or component.

════════════════════════════════════════════════════════════════
NEW DATA STRUCTURES (localStorage)
════════════════════════════════════════════════════════════════

pba_classrooms — array of classroom objects:
{
  id: 'cls-' + Date.now(),
  name: string,            // e.g. "Hall A", "Lab 01", "Room 3B"
  capacity: number,        // max students
  type: 'Hall'|'Lab'|'Room'|'Auditorium',
  branch: 'Kohuwala'|'Wattala'|'Panadura'|'All',
  facilities: string[],    // e.g. ["Projector","AC","Whiteboard"]
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
  isRecurring: true,       // weekly recurring by default
  sessionType: 'Class'|'Lab'|'Revision'|'Exam'|'Event',
  notes: string,
  color: string,           // batch colour for display
  createdAt: ISO string
}

Safe read helper (add once, use everywhere in this file):
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
  1. Classroom Manager    ← renamed from "Classroom Allocations"
  2. Visual Timetable Builder  ← heavily upgraded
  3. Today's Class Changes    (keep as-is)
  4. Year Plan Monthly Calendar (keep as-is)
  5. Announcements Board  (keep as-is)

════════════════════════════════════════════════════════════════
TAB 1 — CLASSROOM MANAGER
════════════════════════════════════════════════════════════════

SECTION A — Header row:
  Left: "Classroom Manager" heading + subtitle "Manage halls, labs, and rooms across all branches"
  Right: blue primary button "＋ Add Classroom"

SECTION B — Filter row (above table):
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
    Top row: classroom name (font Sora, 14px, bold) + type badge pill
      Hall → background #EBF4FF, color #2B6CB0
      Lab  → background #F0FFF4, color #276749
      Room → background #FEF3C7, color #B7860A
      Auditorium → background #FAF5FF, color #6B46C1

    Capacity line: person icon + "{capacity} seats"
    Branch badge: small pill, same style as sidebar branch badge
    Facilities: comma-separated, fontSize 11px, color #718096

    Status toggle: active/inactive pill (green/grey) that toggles on click

    Bottom action row (right-aligned):
      "Edit" button (ghost blue) | "Delete" button (ghost red)
      "View Schedule" link → scrolls to timetable tab filtered to this classroom

  Empty state (no classrooms yet):
    Building SVG icon + "No classrooms added yet" + "Add your first classroom" blue button

SECTION D — "Add / Edit Classroom" Modal:
  Fields:
  1. Classroom Name — text input, placeholder "e.g. Hall A, Lab 01, Room 3B"
  2. Type — select: Hall | Lab | Room | Auditorium
  3. Capacity — number input, placeholder "e.g. 40"
  4. Branch — select: Kohuwala | Wattala | Panadura | All Branches
  5. Facilities — multi-checkbox row:
       ☐ Projector  ☐ AC  ☐ Whiteboard  ☐ Smart Board  ☐ Computer  ☐ PA System
  6. Status — toggle: Active / Inactive (default Active)

  Save button: "Save Classroom" (blue primary)
  On save: push to pba_classrooms array in localStorage, re-render cards

SECTION E — Daily Allocations Sheet (below the cards):
  Section header row:
    Left: "Today's Allocations"
    Right: Date picker (defaults to today, type="date") + "Print PDF" gold button + "Share via WhatsApp" green button

  Derive rows from pba_timetable_sessions filtered to the selected day-of-week
  (convert selected date to day name for recurring sessions).

  Table columns: TIME SLOT | CLASSROOM | BATCH | SUBJECT SESSION | LECTURER | BRANCH | ACTIONS
  Actions per row: pencil icon (edit session) | trash icon (delete session)

  Conflict row styling: if two sessions share the same classroom + overlapping time,
  highlight both rows with background #FFF5F5, left border 3px solid #FC8181,
  and show a small red "⚠ Conflict" badge in the CLASSROOM cell.

  Empty state: calendar SVG + "No sessions scheduled for this day"
  Below table: small blue link "＋ Add a session for this day" → opens Add Session modal

════════════════════════════════════════════════════════════════
TAB 2 — VISUAL TIMETABLE BUILDER (full overhaul)
════════════════════════════════════════════════════════════════

SECTION A — Toolbar (above grid):
  Left group:
    Day range toggle: "Full Week" | "Mon–Wed" | "Thu–Sat" (pill toggle)
    Branch filter select
    Batch filter select (multi-select or dropdown with "All Batches")
    Classroom filter select ("All Classrooms" + list from pba_classrooms)

  Right group:
    "＋ Add Session" blue primary button
    "Print PDF" gold button
    "Share via WhatsApp" green button

SECTION B — Batch colour legend (below toolbar, above grid):
  One pill per batch in pba_batch_subjects:
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: batch.color + '20', color: batch.color,
      border: '1px solid ' + batch.color + '60',
      borderRadius: '20px', padding: '3px 10px',
      fontSize: '11px', fontWeight: 700, marginRight: '6px'
    }}>
      ● {batch.name}
    </span>
  Also show classroom legend: small coloured dot per classroom (use a consistent
  palette: first classroom #2B6CB0, second #276749, third #B7860A, etc.)

SECTION C — Weekly Grid:
  Layout: CSS grid, first column = time labels, remaining columns = day columns

  Time column:
    Rows every 30 minutes from 07:00 to 20:00
    Each row height: 48px (so 1 hour = 96px)
    Label: fontSize 11px, color #A0AEC0, textAlign right, paddingRight 8px
    Grid line: borderBottom 1px solid #F0F2F5 (dashed at half-hours, solid at hours)

  Day columns (Mon–Fri, or Mon–Sat):
    Column header: day name, bold, textAlign center, borderBottom 2px solid #E3E6EA
    Today's column: header background #EBF4FF, text #2B6CB0

  Session blocks (rendered absolutely or as grid spans):
    Position each block by startTime/endTime relative to 07:00:
      top = (startMinutes - 420) / 30 * 48 + 'px'   // 420 = 07:00 in minutes
      height = durationMinutes / 30 * 48 + 'px'

    Session card style:
    <div style={{
      position: 'absolute',
      left: '4px', right: '4px',
      borderRadius: '8px',
      padding: '6px 8px',
      background: session.color + '20' || '#EBF4FF',
      borderLeft: '3px solid ' + (session.color || '#2B6CB0'),
      cursor: 'pointer',
      overflow: 'hidden'
    }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1A202C' }}>
        {subjectName}
      </div>
      <div style={{ fontSize: '10px', color: '#718096' }}>
        {batchName}
      </div>
      <div style={{ fontSize: '10px', color: '#718096' }}>
        {classroomName} · {lecturerName}
      </div>
      <div style={{ fontSize: '10px', color: session.color || '#2B6CB0' }}>
        {startTime} – {endTime}
      </div>
    </div>

    Conflict overlay: if two sessions have the same classroomId and overlapping times
    on the same day, draw a red hatched overlay and add ⚠ icon:
      background: repeating-linear-gradient(
        45deg, rgba(252,129,129,0.15), rgba(252,129,129,0.15) 4px,
        transparent 4px, transparent 8px
      )
      border: 2px solid #FC8181

    Click on session card → opens Edit Session modal (pre-filled)
    Click on empty grid cell → opens Add Session modal with day+time pre-filled

SECTION D — "Add / Edit Session" Modal:
  Title: "Schedule a Session" / "Edit Session"

  Fields:
  1. DAY — select: Monday | Tuesday | Wednesday | Thursday | Friday | Saturday
     (if user clicked a grid cell, pre-fill with that day)

  2. TIME — two time pickers side by side:
     Start Time [08:00] — End Time [10:00]
     Both: input type="time", step="1800" (30-min increments)

     Below: auto-calculated duration label "2 hours"

  3. BATCH — select from pba_batch_subjects batch names
     On change: reload the SUBJECT and LECTURER dropdowns below

  4. SUBJECT — select subjects linked to the selected batch
     (from pba_batch_subjects where batchId matches)
     On change: auto-populate LECTURER from subjectAssignments.mainLecturerId

  5. LECTURER — select (pre-populated from subject-batch assignment, but editable)
     Shows all users with role Lecturer from pba_users
     Pre-fill from the batch-subject's mainLecturerId

  6. CLASSROOM — select from active pba_classrooms for the relevant branch
     Below the select: show an availability hint:
       ✓ "Hall A is free at this time" (green) if no conflict
       ⚠ "Hall A is already booked 08:00–10:00 Mon" (amber) if conflict

  7. SESSION TYPE — pill selector: Class | Lab | Revision | Exam | Event
     Each pill uses a distinct colour when selected

  8. BRANCH — auto-filled from batch, but editable select

  9. NOTES — textarea, optional, rows 2

  CONFLICT WARNING BANNER (shows if any conflict detected):
  <div style={{
    background: '#FFF5F5', border: '1px solid #FEB2B2',
    borderRadius: '8px', padding: '10px 14px', marginBottom: '14px',
    fontSize: '12px', color: '#C53030', display: 'flex', gap: '8px'
  }}>
    ⚠ {conflictDescription}
  </div>
  Conflicts to detect:
    a) Classroom already booked (same classroomId, same day, overlapping time)
    b) Lecturer already assigned elsewhere (same lecturerId, same day, overlapping time)
  Show both if applicable. Allow saving despite conflict (warn, don't block).

  Action buttons:
    Cancel (ghost) | Save Session (blue primary)
  On save: push to pba_timetable_sessions, close modal, re-render grid

  Edit mode: also show "Delete Session" red ghost button (left-aligned)

════════════════════════════════════════════════════════════════
SECTION E — QUICK STATS ROW (above the timetable grid)
════════════════════════════════════════════════════════════════

Four stat widgets in a row (white cards, standard style):
  1. Total Sessions This Week — count of pba_timetable_sessions
  2. Active Classrooms — count of pba_classrooms where isActive = true
  3. Classrooms in Use Today — count with sessions on today's day name
  4. Conflicts Detected — count of sessions where same classroom+time overlap (red if >0)

════════════════════════════════════════════════════════════════
STYLING (match portal design system)
════════════════════════════════════════════════════════════════

All new modals: white card, borderRadius 12px, boxShadow 0 20px 60px rgba(0,0,0,0.15)
                max-width 560px, centered with dark overlay
Modal header: borderBottom 1px solid #E3E6EA, padding 20px 24px
Modal body: padding 20px 24px, maxHeight 70vh, overflowY auto
Modal footer: borderTop 1px solid #E3E6EA, padding 16px 24px, display flex,
              justifyContent flex-end, gap 10px

All form labels: fontSize 10px, fontWeight 700, color #718096,
                 textTransform uppercase, letterSpacing 0.5px, marginBottom 4px
All inputs/selects: standard portal style (see other modals)
Focus ring: 0 0 0 3px rgba(43,108,176,0.12), borderColor #2B6CB0

Seed pba_classrooms with these defaults if empty on first load:
  [
    { id:'cls-1', name:'Hall A', capacity:40, type:'Hall', branch:'Kohuwala', facilities:['Projector','AC','Whiteboard'], isActive:true },
    { id:'cls-2', name:'Hall B', capacity:35, type:'Hall', branch:'Wattala',  facilities:['Projector','AC'], isActive:true },
    { id:'cls-3', name:'Lab 01', capacity:30, type:'Lab',  branch:'Kohuwala', facilities:['Computer','AC','Whiteboard'], isActive:true },
    { id:'cls-4', name:'Room 3B', capacity:25, type:'Room', branch:'Panadura', facilities:['Whiteboard'], isActive:true }
  ]

Migrate existing hardcoded sessions (Business Studies Mon 08:00, Economics Tue 08:00,
Accounting Mon 10:30) into pba_timetable_sessions if not already there, linking to
matching classroom ids from pba_classrooms.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any other page (Students, Examinations, Lecturers, etc.)
2. Use only inline style={{}} props — no Tailwind
3. All localStorage reads must use safeLS() — never raw JSON.parse at top level
4. Run npm run build and confirm 0 errors
5. List all files modified
```
