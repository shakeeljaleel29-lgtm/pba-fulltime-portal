# PBA Full-Time Portal — Fix: Calendar Day Alignment Wrong (UTC Off-by-One)
## AntiGravity Prompt

---

```
The calendar grid shows all dates shifted one column to the left.
September 1, 2026 is a Tuesday but appears in the Monday column.
This is a UTC timezone bug — fixing it is a one-line change in most
implementations.

Touch ONLY CalendarView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
ROOT CAUSE
════════════════════════════════════════════════════════════════

When JavaScript parses an ISO date string like "2026-09-01", it
treats it as UTC midnight. In Sri Lanka (UTC+5:30), UTC midnight
is 5:30 AM the NEXT day local time — so the date object actually
represents August 31 locally, not September 1.

This causes .getDay() to return the wrong weekday for the first
of the month, shifting the entire grid.

WRONG (UTC-parsed, causes offset):
  new Date(`${year}-${String(month+1).padStart(2,'0')}-01`).getDay()
  new Date(`${year}-${month+1}-01`).getDay()
  new Date(`${year}/${month+1}/01`).getDay()

Any variant that passes a string to the Date constructor suffers
from this.

════════════════════════════════════════════════════════════════
THE FIX — use the local-time Date constructor everywhere
════════════════════════════════════════════════════════════════

Replace ALL date constructions used for calculating the grid
(first-day-of-month weekday, day-in-month checks, "today"
highlighting) with the three-argument local-time constructor:

  new Date(year, month, day)

This constructor uses LOCAL time — no timezone shift.

════════════════════════════════════════════════════════════════
SPECIFIC LINES TO CHANGE
════════════════════════════════════════════════════════════════

1. First day of month (used to calculate starting column):

  BEFORE:
    const firstDay = new Date(`${year}-${month + 1}-01`).getDay();
    // or any string-based variant

  AFTER:
    const firstDay = new Date(year, month, 1).getDay();

2. Number of days in month:

  BEFORE:
    const daysInMonth = new Date(`${year}-${month + 2}-01`) - ...
    // or any string-based variant

  AFTER:
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // new Date(year, month+1, 0) = last day of current month

3. "Today" check inside cell rendering:

  BEFORE:
    const today = new Date();
    const isToday = day === today.getDate() &&
                    month === today.getMonth() &&
                    year === today.getFullYear();

  This is already correct (no string parsing). Leave it as-is.

4. Any date used for event matching — if events are stored with
   "YYYY-MM-DD" string dates, compare them as strings:

  CORRECT (string-to-string comparison, no Date parsing needed):
    event.date === `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`

  Do NOT parse event.date into a Date object for comparison —
  keep it as a string equality check to avoid the timezone issue.

5. If the calendar builds an array of Date objects for each cell,
   replace:
    new Date(`${year}-${m}-${d}`)
   with:
    new Date(year, month, dayNumber)

════════════════════════════════════════════════════════════════
SUMMARY OF THE RULE
════════════════════════════════════════════════════════════════

  ✅ new Date(year, month, day)         — local time, correct
  ✅ new Date()                          — local time, correct
  ❌ new Date("YYYY-MM-DD")             — UTC, wrong in UTC+X
  ❌ new Date("YYYY-MM-DDT00:00:00Z")   — UTC, wrong in UTC+X
  ❌ new Date(`${year}-${month}-${day}`)— UTC, wrong in UTC+X

Apply this rule to EVERY date calculation in CalendarView.jsx
that is used for grid layout or "today" detection.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY CalendarView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. Event date strings stored as "YYYY-MM-DD" are fine — compare
   them as strings, never parse them back into Date objects
5. After fix: September 1, 2026 should appear in the TUE column
6. Run npm run build and confirm 0 errors
7. Then npm run deploy
8. List all files modified
```
