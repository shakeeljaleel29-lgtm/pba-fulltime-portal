# PBA Full-Time Portal — Prompt 2: Lecturer Session Log
## AntiGravity Prompt

---

```
Add a "Session Log" tab to the Lecturers page.
Do NOT change any other page or component.

════════════════════════════════════════════════════════════════
WHERE TO ADD IT
════════════════════════════════════════════════════════════════

In the Lecturers page, add a new tab "📋 Session Log" alongside the existing tabs
(Profiles, Availability Grid, Leave Requests, Syllabus Tracker).

════════════════════════════════════════════════════════════════
DATA SOURCES
════════════════════════════════════════════════════════════════

  pba_timetable_sessions  — all scheduled sessions (recurring timetable)
  pba_class_changes       — sessions marked cancelled/changed (from Today's Class Changes)
                            structure: { sessionId, date, type: 'cancelled'|'changed',
                                         substituteId?, notes?, markedAt }
  pba_session_attendance  — attendance records keyed to sessionId + date
  pba_users               — to resolve lecturer/substitute names
  pba_subjects            — to resolve subject names
  pba_batches             — to resolve batch names
  pba_classrooms          — to resolve classroom names

════════════════════════════════════════════════════════════════
FILTER BAR (top of Session Log tab)
════════════════════════════════════════════════════════════════

Row 1:
  Lecturer dropdown — "All Lecturers" + each pba_users where role === 'Lecturer'
  Period quick-select pills:
    This Week | This Month | This Year | Custom Range
    (active pill: bg #2B6CB0, color white; inactive: bg #F0F2F5, color #4A5568)

Row 2 (visible only when "Custom Range" is selected):
  From: <input type="date"> | To: <input type="date"> | [Apply] button

════════════════════════════════════════════════════════════════
STATS ROW (below filter bar)
════════════════════════════════════════════════════════════════

Five stat cards in a horizontal row:

  1. SCHEDULED    — total sessions in the period for the selected lecturer
                    (each recurring session counts once per week it falls in the range)
  2. CONDUCTED    — sessions that were NOT cancelled in pba_class_changes
  3. MISSED       — sessions the lecturer cancelled (type === 'cancelled' in pba_class_changes,
                     no substituteId)
  4. SUBSTITUTED  — sessions cancelled BUT a substituteId was assigned
  5. ATTEND RATE  — (Conducted / Scheduled) × 100, shown as "87%" in colour:
                      ≥ 80% green #276749
                      60–79% amber #B7860A
                      < 60%  red #C53030

Stat card style:
  <div style={{
    flex: 1, background: '#FFFFFF',
    border: '1px solid #E3E6EA',
    borderRadius: '10px', padding: '14px 16px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '22px', fontWeight: 800, color: '#1A202C' }}>{value}</div>
    <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0',
      textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{label}</div>
  </div>

════════════════════════════════════════════════════════════════
SESSION LOG TABLE
════════════════════════════════════════════════════════════════

Columns:
  DATE | DAY | BATCH | SUBJECT | TIME | CLASSROOM | STATUS | ATTENDANCE

DATE     — 'DD MMM YYYY' format
DAY      — 'Monday', 'Tuesday', etc.
BATCH    — batch name from pba_batches
SUBJECT  — subject name from pba_subjects
TIME     — '{startTime} – {endTime}'
CLASSROOM — classroom name from pba_classrooms
STATUS   — pill (see below)
ATTENDANCE — "X / Y" (present / enrolled) or "—" if not marked

STATUS PILLS:
  Conducted   → bg #F0FFF4, color #276749, text "✓ Conducted"
  Cancelled   → bg #FFF5F5, color #C53030, text "✕ Cancelled"
  Substituted → bg #FFFBEB, color #B7860A, text "⇄ Substituted by {substituteName}"
  Upcoming    → bg #EBF4FF, color #2B6CB0, text "◷ Upcoming"

HOW TO GENERATE THE ROWS:

  1. Take pba_timetable_sessions where lecturerId matches selected lecturer (or all).
  2. For each session, expand it across every week in the selected date range
     (each session's `day` field maps to actual calendar dates in the range).
  3. For each (session, date) pair:
       - Check pba_class_changes for a record with sessionId + date
         → if found and type === 'cancelled' with substituteId: status = 'Substituted'
         → if found and type === 'cancelled' without substituteId: status = 'Cancelled'
         → if found and type === 'changed': status = 'Conducted' (class ran, just changed)
       - If date is in the future: status = 'Upcoming'
       - Otherwise: status = 'Conducted'
       - Check pba_session_attendance for sessionId + date to get attendance count.
  4. Sort rows by date descending (most recent first).
  5. Filter Upcoming rows out of the table by default; show toggle: "☐ Include upcoming"

PAGINATION: show 30 rows per page with Prev / Next controls.

════════════════════════════════════════════════════════════════
EXPORT BUTTON
════════════════════════════════════════════════════════════════

Top-right of the Session Log tab: "⬇ Download CSV" button
  (gold / amber style: background #D4A017, color white, borderRadius 8px)

When clicked: generate a CSV of all rows in the current filter (no pagination limit)
  with columns: Date, Day, Lecturer, Batch, Subject, Time, Classroom, Status, Attendance
  and trigger a browser download named:
  "session-log-{lecturerName}-{periodLabel}.csv"

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any other tab (Profiles, Availability Grid, Leave Requests, Syllabus Tracker)
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads
4. If pba_class_changes does not exist yet, default to [] — all sessions show as Conducted
5. If pba_session_attendance does not exist yet, attendance column shows "—"
6. Run npm run build and confirm 0 errors
7. List all files modified
```
