# PBA Full-Time Portal — Fix Calendar: Wrong Default Month + Sync Between Views
## AntiGravity Prompt

---

```
Two bugs to fix in the Academic Calendar:

  Bug 1 — Calendar opens on OCTOBER instead of SEPTEMBER (current month).
  Bug 2 — Events added in the main Calendar page (sidebar → Calendar) do
           NOT appear in General Admin → Monthly Calendar tab, and vice
           versa. They are reading/writing different localStorage keys.

════════════════════════════════════════════════════════════════
AFFECTED FILES
════════════════════════════════════════════════════════════════

There are TWO calendar implementations:
  A) The main Calendar page (accessible from the sidebar)
     — file: CalendarView.jsx (or AcademicCalendarView.jsx or Calendar.jsx)
  B) The Monthly Calendar tab inside General Admin
     — file: GeneralAdminView.jsx

You must touch BOTH files.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
BUG 1 FIX — Wrong default month
════════════════════════════════════════════════════════════════

In BOTH files (CalendarView.jsx AND GeneralAdminView.jsx), find the
useState initializer for the current displayed month/year. It will
look like ONE of:

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 2)
  const [currentDate, setCurrentDate]   = useState(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })
  const [viewMonth, setViewMonth]        = useState(someOffByOneExpression)

OR it may be derived from a date that's being shifted by +1 day/month
somewhere in the initialization chain.

FIX: Make the default month be the CURRENT month and CURRENT year.

  const [currentYear,  setCurrentYear]  = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  // month is 0-indexed: 0=Jan, 1=Feb, ..., 8=Sep, 11=Dec

If the calendar uses a single Date object instead:
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    d.setDate(1);          // first of current month
    d.setHours(0,0,0,0);
    return d;
  });

KEY: Do NOT use new Date() + any offset. Today is September 2026, so
the calendar must open on September 2026 by default.

════════════════════════════════════════════════════════════════
BUG 2 FIX — Unify the localStorage key for calendar events
════════════════════════════════════════════════════════════════

The two calendar views are using DIFFERENT keys. You need to find what
each one uses and make them BOTH use the same key.

STEP A — Find the key used by the MAIN Calendar page (CalendarView.jsx):

  Search for: safeLS('pba_   inside CalendarView.jsx
  The events will be stored under a key like:
    'pba_calendar_events'
    'pba_events'
    'pba_academic_events'
    'pba_cal_events'
  Note down the EXACT key used. Call it KEY_A.

STEP B — Find the key used by the General Admin Monthly Calendar
  (GeneralAdminView.jsx → Monthly Calendar tab):

  Search for: safeLS('pba_   inside GeneralAdminView.jsx in the
  section that renders the Monthly Calendar tab.
  The events will be stored under a key like:
    'pba_academic_calendar'
    'pba_monthly_events'
    'pba_timetable_events'
    'pba_calendar'
  Note down the EXACT key used. Call it KEY_B.

STEP C — If KEY_A ≠ KEY_B, update BOTH files to use ONE unified key.

  Choose KEY_A (the main Calendar's key) as the canonical key.

  In GeneralAdminView.jsx: replace EVERY occurrence of
    safeLS('KEY_B', ...)    →   safeLS('KEY_A', ...)
    saveLS('KEY_B', ...)    →   saveLS('KEY_A', ...)

  This makes both views read and write the same data.

STEP D — Verify the event shape is compatible.

  The main Calendar saves events that look like:
    { id, title, date, type, description, ... }

  The General Admin calendar should display the same fields.
  If the General Admin tab renders fields that don't exist in the
  main Calendar's event schema, add safe fallbacks:
    event.title || event.name || event.label || '—'
    event.type  || event.category || 'event'

════════════════════════════════════════════════════════════════
STEP E — Fix "pts" truncation (visible in General Admin calendar)
════════════════════════════════════════════════════════════════

In the General Admin Monthly Calendar grid cells, each event chip
is probably rendered in a very narrow space and the text is cut off.

Find the event chip style inside the calendar grid cell. It will look
something like:

  <div style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', ... }}>

Make sure:
  - Each chip has overflow: 'hidden' and textOverflow: 'ellipsis'
    so long names truncate gracefully rather than wrapping
  - The chip has a minimum readable width

If the "pts" text is actually a partial event title (e.g. "pts" from
"points" or an event whose title starts with something else), it will
be resolved automatically once the unified key fix (Step C) is applied
and the correct events load in.

════════════════════════════════════════════════════════════════
ALSO: Ensure both legend/category systems match
════════════════════════════════════════════════════════════════

The main Calendar legend shows:
  Term Start · Term End · Holiday · Exam Week · Exam · Leave ·
  Payment Due · Event · Revision

The General Admin Monthly Calendar legend shows only:
  Term Start · Term End · Holiday · Exam Week · Event

UPDATE the General Admin Monthly Calendar legend to match the full
set used by the main Calendar, so all event types display correctly
with their colors.

Add to the General Admin calendar legend (same dot-color format):
  Exam      — color: '#F59E0B' (amber/yellow)
  Leave     — color: '#EF4444' (red)
  Payment Due — color: '#10B981' (green)
  Revision  — color: '#06B6D4' (cyan)

And ensure the calendar grid cell coloring/dot color logic handles
all these types (case-insensitive match on event.type):
  'term start'    → green (#10B981)
  'term end'      → blue (#3B82F6)
  'holiday'       → red (#EF4444)
  'exam week'     → amber (#F59E0B)
  'exam'          → yellow (#EAB308)
  'leave'         → rose (#F43F5E)
  'payment due'   → emerald (#059669)
  'event'         → purple (#8B5CF6)
  'revision'      → cyan (#06B6D4)
  default         → gray (#6B7280)

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY CalendarView.jsx (or whichever file holds the main
   Calendar page) AND GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. The canonical storage key is whatever the MAIN Calendar page uses
5. After the fix, adding an event in the main Calendar MUST appear
   in General Admin → Monthly Calendar, and vice versa
6. Default month MUST be the current month (today is Sep 2026)
7. Run npm run build and confirm 0 errors
8. Then npm run deploy
9. List all files modified
```
