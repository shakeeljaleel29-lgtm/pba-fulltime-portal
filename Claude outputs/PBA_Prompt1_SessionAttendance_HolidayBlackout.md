# PBA Full-Time Portal — Prompt 1: Session Attendance + Holiday Blackout
## AntiGravity Prompt

---

```
Add session-linked attendance marking and holiday blackout to the timetable.
Touch only: General Admin page (Today's Class Changes tab + Visual Timetable Builder tab).
Do NOT change any other page or component.

════════════════════════════════════════════════════════════════
DATA STRUCTURE — pba_session_attendance (new localStorage key)
════════════════════════════════════════════════════════════════

Each attendance record is one session's roll call:

  {
    id: string,                    // unique id
    sessionId: string,             // links to pba_timetable_sessions[].id
    date: string,                  // 'YYYY-MM-DD' — actual date the class ran
    batchId: string,
    subjectId: string,
    lecturerId: string,
    markedBy: string,              // userId who marked attendance
    markedAt: string,              // ISO timestamp
    isMakeup: boolean,             // true if this was a make-up session
    records: [
      {
        studentId: string,
        status: 'present' | 'absent' | 'late' | 'excused'
      }
    ]
  }

Read: safeLS('pba_session_attendance', [])
Write: saveLS('pba_session_attendance', updatedArray)

════════════════════════════════════════════════════════════════
PART A — TODAY'S CLASS CHANGES TAB: Mark Attendance
════════════════════════════════════════════════════════════════

In each session row in Today's Class Changes, add a "✓ Mark Attendance" button
ALONGSIDE the existing "Mark Cancelled / Changed" button:

  <button style={{
    padding: '7px 14px',
    background: 'transparent',
    border: '1.5px solid #68D391',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#276749',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    whiteSpace: 'nowrap'
  }}>
    ✓ Mark Attendance
  </button>

If attendance has already been marked for this session+date:
  Replace the button with a green pill:
  <span style={{
    background: '#F0FFF4',
    border: '1px solid #9AE6B4',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#276749'
  }}>✓ Attendance Marked</span>
  + small "Edit" link in grey to re-open the modal

────────────────────────────────────────────────────────────────
ATTENDANCE MODAL
────────────────────────────────────────────────────────────────

Header: "Mark Attendance — {subjectName} · {batchName}"
Sub: "{dayName}, {date} · {startTime}–{endTime} · {classroomName}"

Quick-action row (top of student list):
  [✓ Mark All Present]  [✗ Mark All Absent]   — ghost buttons

Student list — pull from pba_batch_enrollments filtered by batchId:
  If pba_batch_enrollments is empty, fall back to pba_students (all students).

  For each student, one row:
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 16px', borderBottom: '1px solid #F0F2F5',
    background: status === 'absent' ? '#FFF5F5' : 'transparent'
  }}>
    Student name (13px bold #1A202C)
    Student ID / roll number (11px #A0AEC0)

    Status pill selector — 4 options side by side:
    Present | Late | Excused | Absent
    Active pill style:
      present  → bg #F0FFF4, color #276749, border 1.5px solid #9AE6B4
      late     → bg #FFFBEB, color #B7860A, border 1.5px solid #F6D860
      excused  → bg #EBF4FF, color #2B6CB0, border 1.5px solid #BEE3F8
      absent   → bg #FFF5F5, color #C53030, border 1.5px solid #FEB2B2
    Inactive pill → bg #F7F8FA, color #A0AEC0, border 1px solid #E3E6EA
  </div>

Footer row:
  Left: attendance summary → "Present: X | Absent: Y | Late: Z | Excused: W"
  Right: [Cancel] [Save Attendance] (blue primary)

On Save:
  Write to pba_session_attendance (add or update record for this sessionId + date).
  Show green toast: "Attendance saved for {subjectName} — {date}"

════════════════════════════════════════════════════════════════
PART B — ADMIN ATTENDANCE VIEW (new section in Today's Class Changes)
════════════════════════════════════════════════════════════════

Below the existing session list in Today's Class Changes, add a collapsible section:
"📋 Attendance Records" (toggle open/closed with a chevron)

Filter bar:
  Date picker (default: today) | Batch dropdown | Subject dropdown | Lecturer dropdown

Table: DATE | BATCH | SUBJECT | LECTURER | TIME | PRESENT | ABSENT | LATE | RATE | Actions

  RATE = (present + late) / total enrolled × 100, displayed as "87%" in colour:
    ≥ 80% → green (#276749)
    60–79% → amber (#B7860A)
    < 60%  → red (#C53030)

  Actions column: "View" (opens read-only version of the attendance modal)

════════════════════════════════════════════════════════════════
PART C — VISUAL TIMETABLE BUILDER: Holiday Blackout
════════════════════════════════════════════════════════════════

In the Visual Timetable Builder grid, read pba_year_plan events where type === 'Holiday'.

When rendering the day columns (Mon–Sun headers):
  If the current displayed week contains a holiday date:
    Grey out that day's entire column:
      background: repeating-linear-gradient(
        45deg, #F9FAFB, #F9FAFB 4px, #F0F2F5 4px, #F0F2F5 8px
      )
    Show a banner at the top of the column:
      <div style={{
        background: '#FFF3CD',
        border: '1px solid #F6D860',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '10px',
        fontWeight: 700,
        color: '#B7860A',
        textAlign: 'center',
        marginBottom: '4px'
      }}>
        🏖 {holidayName}
      </div>

Sessions that exist on a holiday date get a small amber warning badge:
  <span style={{ fontSize:'9px', background:'#FFFBEB', color:'#B7860A',
    borderRadius:'4px', padding:'1px 4px', marginLeft:'4px' }}>Holiday</span>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change Lecturers, Students, or any other page
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. pba_batch_enrollments may not exist yet — always fall back to pba_students
5. The attendance modal must work for BOTH admin and lecturer roles
6. Run npm run build and confirm 0 errors
7. List all files modified
```
