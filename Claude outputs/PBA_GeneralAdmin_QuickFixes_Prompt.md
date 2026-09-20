# PBA Full-Time Portal — General Admin: 3 Quick Fixes
## AntiGravity Prompt — Surgical Fix (run AFTER the master timetable prompt)

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Three targeted fixes in the General Administration page.
Do not change any other page or component.

════════════════════════════════════════════════════════════════
FIX 1 — SUBJECT STREAM LABELS: standardise to 4 values
════════════════════════════════════════════════════════════════

The Subject Registry currently shows non-standard stream values like
"Maths" and "Technology". Standardise ALL stream labels across the entire app
to exactly these four values:

  compulsory  → display label "Compulsory"
  science     → display label "Science"
  commerce    → display label "Commerce"
  elective    → display label "Elective"

STEP 1 — Fix the Subject Registry table stream column:
  Replace any display of "Maths", "Core", "Technology", "General", "Other"
  or any non-standard value with the correct display label from the map above.
  Map by the stored stream value:
    if stream === 'compulsory' → show "Compulsory"  (red pill #FFF5F5 / #C53030)
    if stream === 'science'    → show "Science"      (green pill #F0FFF4 / #276749)
    if stream === 'commerce'   → show "Commerce"     (amber pill #FFFBEB / #B7860A)
    else                       → show "Elective"     (purple pill #FAF5FF / #6B46C1)

STEP 2 — Fix the Add / Edit Subject modal — Stream Category dropdown:
  The <select> or dropdown must have EXACTLY these options, no others:
    <option value="compulsory">Compulsory (Maths, English — all students attend)</option>
    <option value="science">Science (Bio, Chem, Physics)</option>
    <option value="commerce">Commerce (Accounting, Business Studies, Economics)</option>
    <option value="elective">Elective / Other</option>

STEP 3 — On first load, migrate any subjects with non-standard stream values:
  const streamMigrationMap = {
    'maths': 'compulsory', 'math': 'compulsory', 'core': 'compulsory',
    'english': 'compulsory', 'general': 'elective',
    'technology': 'elective', 'tech': 'elective', 'ict': 'elective',
    'arts': 'elective', 'other': 'elective'
  };
  For each subject in pba_subjects:
    if (!['compulsory','science','commerce','elective'].includes(subject.stream)) {
      subject.stream = streamMigrationMap[subject.stream?.toLowerCase()] || 'elective';
    }
  Save updated array back to pba_subjects.

Also auto-assign stream by subject name for subjects with no stream or wrong stream:
  Name contains (case-insensitive): 'math', 'english', 'language'
    → stream = 'compulsory'
  Name contains: 'bio', 'chem', 'physics', 'science'
    → stream = 'science'
  Name contains: 'account', 'business', 'economics', 'commerce'
    → stream = 'commerce'
  Everything else (including ICT, Art, History, etc.)
    → stream = 'elective'
  Save back to pba_subjects.

════════════════════════════════════════════════════════════════
FIX 2 — YEAR PLAN MONTHLY CALENDAR: replace table with visual calendar
════════════════════════════════════════════════════════════════

The Year Plan Monthly Calendar tab currently shows a plain data table.
Replace it with a proper visual monthly calendar while keeping the event
data from pba_year_plan (or whatever localStorage key stores these events).

LAYOUT:
  Header row:
    Left: "Year Plan — {currentYear}" (Sora 18px bold)
    Right: "← Prev Month" (ghost) | "Month Year" label | "Next Month →" (ghost) +
           "＋ Add Event" (blue primary)

  Month navigation: clicking prev/next changes which month is displayed.
  Start on the current month by default.

  CALENDAR GRID:
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    border: '1px solid #E3E6EA',
    borderRadius: '12px',
    overflow: 'hidden'
  }}>

  Day-of-week header row (7 cells):
    Sun | Mon | Tue | Wed | Thu | Fri | Sat
    style: background #F7F8FA, padding 8px, textAlign center,
           fontSize 11px, fontWeight 700, color #718096, textTransform uppercase

  Calendar day cells:
  <div style={{
    minHeight: '90px',
    padding: '6px',
    borderRight: '1px solid #F0F2F5',
    borderBottom: '1px solid #F0F2F5',
    background: isToday ? '#EBF4FF' : '#FFFFFF',
    position: 'relative'
  }}>
    Day number (top-left, fontSize 12px, fontWeight isToday ? 700 : 400,
               color: isToday ? '#2B6CB0' : '#1A202C')
    If today: small blue dot below the number

    Events on this date (from pba_year_plan filtered by date):
    <div style={{
      marginTop: '4px',
      background: eventTypeColour.bg,
      color: eventTypeColour.text,
      borderRadius: '4px',
      padding: '2px 5px',
      fontSize: '10px',
      fontWeight: 600,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      cursor: 'pointer'
    }}>
      {event.title}
    </div>
    (if more than 2 events on same day, show first 2 and "+N more" link)

    Clicking an event chip → opens Edit Event modal pre-filled
    Clicking an empty cell → opens Add Event modal with date pre-filled

  Event type colours:
    Exam     → bg #FFF5F5, text #C53030
    Holiday  → bg #F0FFF4, text #276749
    Event    → bg #EBF4FF, text #2B6CB0
    Meeting  → bg #FAF5FF, text #6B46C1
    Other    → bg #FEF3C7, text #B7860A

  Days from previous/next month (padding days to fill the 7-column grid):
    background: #F9FAFB, day number color: #CBD5E0

  ADD / EDIT EVENT MODAL:
  Fields:
    1. Event Title — text input
    2. Date — input type="date"
    3. Branch — select: All | Kohuwala | Wattala | Panadura
    4. Type — pill selector: Exam | Holiday | Event | Meeting | Other
    5. Description — textarea, rows 2

  Footer: Cancel | Save Event (blue primary)
  Edit mode: also show "Delete Event" (red ghost, left-aligned)

  BELOW THE CALENDAR — Event List for the current month (condensed):
  Small section: "Events this month" with a compact table showing
  DATE | TITLE | TYPE | BRANCH | DESCRIPTION
  (same data as the calendar above, just in list form for easy scanning)
  Include the "Print PDF" gold button on the right of this section header.

════════════════════════════════════════════════════════════════
FIX 3 — TODAY'S CLASS CHANGES: restyle "Mark Cancelled / Changed" button
════════════════════════════════════════════════════════════════

The current "Mark Cancelled / Changed" button is a solid dark-red/maroon block
which is too heavy for the portal design. Replace with a softer style:

  BEFORE MARKING — "Mark Cancelled / Changed" button:
  <button style={{
    padding: '7px 14px',
    background: 'transparent',
    border: '1.5px solid #FC8181',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#C53030',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    whiteSpace: 'nowrap'
  }}>
    ✕ Mark Cancelled / Changed
  </button>

  AFTER MARKING (when the session has been marked as cancelled):
  Replace the button with a red status pill:
  <span style={{
    background: '#FFF5F5',
    border: '1px solid #FEB2B2',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#C53030'
  }}>✕ Cancelled</span>

  And show a small "↩ Undo" link in grey next to it to reverse the cancellation.

  Session row styling when cancelled:
    background: #FFF5F5
    left border: 3px solid #FC8181
    Session title text: textDecoration 'line-through', color #A0AEC0

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any other tab (Classroom Manager, Visual Timetable Builder,
   Batch Manager, Announcements Board, Subject Registry, User Management, Data Management)
2. Do NOT change any data logic other than the stream migration in Fix 1
3. Use only inline style={{}} — no Tailwind
4. safeLS() must be used for all localStorage reads
5. Run npm run build and confirm 0 errors
6. List all files modified
```
