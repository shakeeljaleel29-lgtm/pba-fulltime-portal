# PBA Full-Time Portal — Prompt 4: Make-up Class Scheduling + Timetable Print/Export
## AntiGravity Prompt

---

```
Add two features to General Admin:
(1) Make-up class scheduling when a session is cancelled
(2) Print / Export view for the timetable
Touch only the General Admin page. Do NOT change any other page or component.

════════════════════════════════════════════════════════════════
FEATURE 1 — MAKE-UP CLASS SCHEDULING
════════════════════════════════════════════════════════════════

DATA CHANGE — pba_timetable_sessions: add field to support make-up sessions
  isMakeup: boolean     // true = this is a make-up for a cancelled session
  makeupForDate: string // 'YYYY-MM-DD' — the original date that was cancelled
  makeupForSessionId: string // id of the original recurring session

DATA CHANGE — pba_class_changes: add field
  makeupScheduled: boolean   // true if a make-up has been scheduled for this cancellation
  makeupSessionId: string | null  // id of the make-up session created

────────────────────────────────────────────────────────────────
TODAY'S CLASS CHANGES TAB — "Schedule Make-up" option
────────────────────────────────────────────────────────────────

When a session is marked as cancelled (status === 'cancelled' in pba_class_changes),
show a "📅 Schedule Make-up" button below the "✕ Cancelled" pill:

  <button style={{
    marginTop: '4px',
    padding: '5px 12px',
    background: 'transparent',
    border: '1.5px solid #BEE3F8',
    borderRadius: '7px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#2B6CB0',
    cursor: 'pointer'
  }}>
    📅 Schedule Make-up
  </button>

If a make-up is already scheduled (makeupScheduled === true):
  Replace with a blue info pill:
  <span style={{
    background: '#EBF4FF', border: '1px solid #BEE3F8',
    borderRadius: '20px', padding: '4px 12px',
    fontSize: '11px', fontWeight: 700, color: '#2B6CB0'
  }}>📅 Make-up: {makeupDate} {makeupTime}</span>

────────────────────────────────────────────────────────────────
SCHEDULE MAKE-UP MODAL
────────────────────────────────────────────────────────────────

Header: "Schedule Make-up Class"
Sub: "Replacing: {subjectName} · {batchName} · {originalDate}"

Fields:

  1. MAKE-UP DATE
     <input type="date" min={today} />
     Below: show a small availability check — when date is selected,
     display "Lecturer available: ✓ Yes / ✗ Not in declared availability"
     (check pba_users[lecturerId].availability for that day)

  2. START TIME / END TIME
     Two time inputs (pre-filled with original session's times)
     Below: live clash check — show any conflicts at that time:
       "⚠ {classroomName} is booked for {otherSubject} at this time"
       "⚠ {lecturerName} has another class at this time"
       (use timesOverlap helper against pba_timetable_sessions for that day)

  3. CLASSROOM
     <select> showing pba_classrooms
     Pre-filled with the original session's classroom
     If that classroom is clashing, highlight it red and auto-suggest the next available room:
     "Suggested: {alternateClassroom} (available at this time)"

  4. NOTES (optional)
     <textarea rows={2} placeholder="Reason for make-up / additional notes..." />

Footer: [Cancel] [Save Make-up Class] blue primary

On Save:
  a. Create a new entry in pba_timetable_sessions:
     {
       id: generateId(),
       batchId, subjectId, lecturerId, classroomId, day: dayOfWeek,
       startTime, endTime, branch,
       isMakeup: true,
       makeupForDate: originalDate,
       makeupForSessionId: originalSessionId,
       date: makeupDate  // specific date, not recurring
     }
  b. Update the pba_class_changes record:
     { ...existing, makeupScheduled: true, makeupSessionId: newId }
  c. Show green toast: "Make-up class scheduled for {makeupDate}"

In the Visual Timetable Builder grid:
  Make-up sessions render with a small "MAKE-UP" tag in the top-left corner:
  <span style={{
    fontSize: '8px', fontWeight: 800,
    background: '#EBF4FF', color: '#2B6CB0',
    borderRadius: '3px', padding: '1px 4px', letterSpacing: '0.3px'
  }}>MAKE-UP</span>

════════════════════════════════════════════════════════════════
FEATURE 2 — TIMETABLE PRINT / EXPORT VIEW
════════════════════════════════════════════════════════════════

In the Visual Timetable Builder tab toolbar (alongside the existing buttons),
add a "🖨 Print / Export" button:
  style: background #D4A017, color white, borderRadius 8px,
         padding '8px 16px', fontSize 13px, fontWeight 600

Clicking it opens a PRINT OPTIONS MODAL:

  Header: "Print / Export Timetable"

  OPTIONS:

  1. VIEW BY (pill selector):
       By Batch | By Lecturer | By Classroom
       Default: By Batch

  2. SELECT (dropdown, changes based on View By):
       By Batch:     batch dropdown (from pba_batches)
       By Lecturer:  lecturer dropdown (from pba_users where role=Lecturer)
       By Classroom: classroom dropdown (from pba_classrooms)
       Option: "All" at the top of each dropdown

  3. WEEK (date picker for the Monday of the week to print)
       Default: current week's Monday

  4. FORMAT:
       Pill selector: Print (PDF via browser) | Download CSV

  [Cancel] [Generate] blue primary

────────────────────────────────────────────────────────────────
PRINT VIEW LAYOUT (rendered in a new full-screen overlay div)
────────────────────────────────────────────────────────────────

When "Generate → Print" is clicked:
  Open a print-optimised view as a full-screen overlay (z-index 9999)
  with a [✕ Close] button and a [🖨 Print] button at the top (these hide on print)

  Header:
    Institute name (from pba_settings.instituteName or "PBA Full-Time Portal")
    "Weekly Timetable" — {viewByLabel}: {selectedName}
    Week: {Monday date} — {Friday/Sunday date}
    Printed: {today's date}

  GRID TABLE:
    Columns: TIME | MON | TUE | WED | THU | FRI | SAT | SUN
    (only show days that have sessions in this view)

    Rows: one per 30-minute slot from 07:00 to 21:00

    Each session occupies its time-span rows in the relevant day column:
      Cell content:
        Subject name (bold)
        Batch name OR Lecturer name OR Classroom (depending on view)
        Time range (small)
        Classroom name (if not "by classroom" view)

    Empty cells: light grey background #F9FAFB
    Session cells: white with colored left border matching batch color (or #2B6CB0 default)
    Holiday cells: hatched amber pattern

  PRINT CSS (@media print):
    Hide the Close and Print buttons
    Page: A4 landscape
    Font size: 10px
    No box shadows; borders to 1px solid #CBD5E0
    Page break handling: avoid breaking session cells

────────────────────────────────────────────────────────────────
CSV DOWNLOAD (when Format = Download CSV)
────────────────────────────────────────────────────────────────

Generate a CSV with columns:
  DAY, DATE, TIME, SUBJECT, BATCH, LECTURER, CLASSROOM, BRANCH
Filtered by the selected View By and item.
File name: "timetable-{viewBy}-{selectedName}-week-{mondayDate}.csv"
Trigger browser download.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any other page (Lecturers, Students, etc.)
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. timesOverlap() helper must be used for clash checking in the make-up modal
5. Make-up sessions are ONE-TIME (tied to a specific date), not recurring
6. @media print styles must be embedded in a <style> tag injected into the print overlay
7. Run npm run build and confirm 0 errors
8. List all files modified
```
