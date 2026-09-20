# PBA Full-Time Portal — Student Self-Service Portal Restyle
## AntiGravity Prompt — My Attendance, My Fees, My Results

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Restyle three tabs in the Student Self-Service Portal (student-facing view).
Do NOT change My Dashboard, My Timetable, or any admin-side page.
Do NOT change any data logic, localStorage reads, or state management.
Only the visual presentation changes.

Target file: StudentPortalView.jsx (or StudentSelfServiceView.jsx, or wherever
the student-facing tabs live). The three tabs to restyle:
  — My Attendance
  — My Fees
  — My Results

════════════════════════════════════════════════════════════════
DESIGN SYSTEM (match My Dashboard and My Timetable exactly)
════════════════════════════════════════════════════════════════

Page background:       #F4F5F7
Section card:          background #FFFFFF, border 1px solid #E3E6EA,
                       borderRadius 12px, boxShadow 0 1px 4px rgba(0,0,0,0.06),
                       padding 20px 24px, marginBottom 20px
Card heading:          fontSize 13px, fontWeight 700, color #1A202C,
                       fontFamily 'Sora', marginBottom 16px
Sub-label / column header: fontSize 10px, fontWeight 700, color #718096,
                       textTransform uppercase, letterSpacing 0.5px
Body text:             fontSize 13px, color #1A202C, fontFamily 'Inter'
Muted text:            fontSize 12px, color #A0AEC0

Stat widget (used in all three tabs):
  background: #FFFFFF, border 1px solid #E3E6EA, borderRadius 12px,
  padding: 16px 20px, display flex, flexDirection column, gap 4px
  — label:  fontSize 10px, fontWeight 700, color #A0AEC0, textTransform uppercase
  — value:  fontSize 22px, fontWeight 800, fontFamily 'Sora', color #1A202C
  — sub:    fontSize 11px, color #718096

Table wrapper (white card with inner scroll):
  background #FFFFFF, border 1px solid #E3E6EA, borderRadius 12px,
  boxShadow 0 1px 4px rgba(0,0,0,0.06), overflow hidden
Table:
  width 100%, borderCollapse collapse
Table header row:
  background #F8FAFC
  th: padding 10px 16px, fontSize 10px, fontWeight 700, color #718096,
      textTransform uppercase, letterSpacing 0.5px,
      borderBottom 1px solid #E3E6EA, textAlign left
Table body row:
  td: padding 12px 16px, fontSize 13px, color #1A202C,
      borderBottom 1px solid #F0F2F5
  hover: backgroundColor #F8FAFC (onMouseEnter / onMouseLeave)
  Last row: no borderBottom

Pill badge pattern (used for statuses):
  display inline-flex, alignItems center, gap 4px,
  padding 3px 10px, borderRadius 20px,
  fontSize 11px, fontWeight 700

  Present / Paid / Pass:
    background #F0FFF4, color #276749, border 1px solid #9AE6B4
  Late / Pending:
    background #FEF3C7, color #B7860A, border 1px solid #F6D860
  Absent / Overdue / Fail:
    background #FFF5F5, color #C53030, border 1px solid #FEB2B2
  Exam / Scheduled (neutral blue):
    background #EBF4FF, color #2B6CB0, border 1px solid #BEE3F8

Grade badge (for results):
  Same pill shape as above, but sized:
    fontSize 12px, fontWeight 800, padding 4px 12px, borderRadius 8px
  A → background #F0FFF4, color #276749, border 1px solid #9AE6B4
  B → background #EBF4FF, color #2B6CB0, border 1px solid #BEE3F8
  C → background #FEF3C7, color #B7860A, border 1px solid #F6D860
  D → background #FFF8F0, color #C05621, border 1px solid #FBD38D
  F → background #FFF5F5, color #C53030, border 1px solid #FEB2B2
  ABS → background #F7FAFC, color #718096, border 1px solid #E2E8F0

Page section header (above each main section):
  display flex, justifyContent space-between, alignItems center,
  marginBottom 16px
  — Title: fontSize 15px, fontWeight 700, color #1A202C, fontFamily 'Sora'
  — Action button (if present): standard blue primary button
    background #2B6CB0, color #FFFFFF, border none, borderRadius 8px,
    padding 9px 18px, fontSize 12px, fontWeight 700, cursor pointer

════════════════════════════════════════════════════════════════
TAB 1 — MY ATTENDANCE (restyle only, keep all existing data logic)
════════════════════════════════════════════════════════════════

SECTION A — Summary Stats Row (4 widgets in a grid):
  display grid, gridTemplateColumns repeat(4, 1fr), gap 14px, marginBottom 20px

  Widget 1: Total Classes  (existing totalClasses count)
  Widget 2: Present        (existing presentCount) — value in color #276749
  Widget 3: Absent         (existing absentCount) — value in color #C53030
  Widget 4: Attendance Rate (percentage, 1 decimal) — value color:
              ≥90% → #276749, 75–89% → #B7860A, <75% → #C53030

SECTION B — Attendance Rate Progress Bar (inside a white card):
  Label row: "Attendance Rate" left · percentage right (same color as stat)
  Bar track: height 10px, borderRadius 10px, background #E2E8F0
  Bar fill:  borderRadius 10px, height 100%, transition width 0.4s ease
             ≥90% → #48BB78, 75–89% → #ECC94B, <75% → #FC8181

SECTION C — Attendance History Table (white card wrapper):
  Header row: "#" | DATE | SUBJECT | STATUS | MARKED BY

  Columns:
    # — row index, color #A0AEC0, width 36px
    Date — formatted "Mon, 15 Sep 2025", fontWeight 600
    Subject — subject name; show subject color chip pill (same style as admin
               subject registry: background s.color+'20', color s.color,
               fontSize 10px, fontWeight 800, padding 1px 7px, borderRadius 10px)
               beside the name if color data is available; otherwise plain text
    Status — pill badge: Present (green) | Late (amber) | Absent (red)
    Marked By — muted text, color #718096

  Keep existing sort/filter state if any. If the table has a search or filter
  control above it, restyle it to:
    input: padding 9px 12px, border 1.5px solid #E3E6EA, borderRadius 8px,
           fontSize 13px, width 220px, fontFamily 'Inter'
    onFocus: borderColor #2B6CB0, boxShadow 0 0 0 3px rgba(43,108,176,0.12)

  Empty state (no records):
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <svg width="40" height="40" fill="none" stroke="#CBD5E0" strokeWidth="1.5"
           viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0
                 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2
                 0 012 2"/>
      </svg>
      <p style={{ fontSize:'13px', color:'#A0AEC0', marginTop:'12px' }}>
        No attendance records yet
      </p>
    </div>

════════════════════════════════════════════════════════════════
TAB 2 — MY FEES (restyle only, keep all existing data logic)
════════════════════════════════════════════════════════════════

SECTION A — Fee Account Summary (4 stat widgets):
  display grid, gridTemplateColumns repeat(4, 1fr), gap 14px, marginBottom 20px

  Widget 1: Total Programme Fee  — value color #1A202C
  Widget 2: Amount Paid          — value color #276749
             sub: "✓ Fully settled" (if outstanding = 0) OR
                  "Last payment [date]" (if available)
  Widget 3: Outstanding Balance  — value color: >0 → #C53030, 0 → #276749
             sub: "Overdue" (if past due date and >0) OR "Clear" (if 0)
  Widget 4: Next Payment Due     — value: date string OR "—" if none
             sub: amount due, color #2B6CB0

SECTION B — Payment History Table (white card wrapper):
  Section header row: "Payment History" title (left) · no action button needed

  Header row: # | DATE | DESCRIPTION | AMOUNT | METHOD | STATUS

  Columns:
    # — row index, color #A0AEC0, width 36px
    Date — formatted date, fontWeight 600
    Description — e.g. "Monthly Instalment 3 / 12", fontSize 13px
    Amount — "LKR 12,500" format, fontWeight 700, color #1A202C,
              textAlign right
    Method — cash / bank transfer / online — muted text #718096,
              fontSize 12px
    Status — pill badge:
              Paid → green pill
              Pending → amber pill
              Overdue → red pill

  Empty state (same style as Attendance):
    Calendar icon (SVG stroke #CBD5E0) + "No payment records yet"

SECTION C — Upcoming Payments (show only if any scheduled / pending rows exist):
  White card with section title "Upcoming Payments"
  Simple list: each row shows date (left) + description (center) + amount (right)
  Amount in #C53030 if overdue, #2B6CB0 if upcoming
  Divider: borderBottom 1px solid #F0F2F5 between rows
  If none: hide the entire section (do not render it at all)

════════════════════════════════════════════════════════════════
TAB 3 — MY RESULTS (restyle only, keep all existing data logic)
════════════════════════════════════════════════════════════════

SECTION A — Overall Academic Performance Banner (already partially styled):
  Ensure it is a white card with the following shape:
  <div style={{
    background: 'linear-gradient(135deg, #1C2A3A 0%, #2B6CB0 100%)',
    borderRadius: '12px',
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    color: '#FFFFFF'
  }}>
    Left side:
      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
          Overall GPA
        </p>
        <p style={{ fontSize: '36px', fontWeight: 800, fontFamily: "'Sora', sans-serif",
                    color: '#FFFFFF', lineHeight: 1 }}>
          {gpa}
        </p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
          {gradeLabel}  ·  {subjectCount} subjects
        </p>
      </div>
    Right side: keep existing trophy/academic icon SVG (or similar), stroke #FFFFFF at 40% opacity

  (If there is already a similar banner, just apply these exact styles to it.)

SECTION B — "Print Transcript" button:
  Restyle as golden primary button:
    background #D4A017, color #1A202C, border none, borderRadius 8px,
    padding 9px 18px, fontSize 12px, fontWeight 700, cursor pointer,
    display flex, alignItems center, gap 6px, fontFamily 'Inter'
  Printer SVG icon (16×16, stroke currentColor, strokeWidth 2)
  Position: top-right of the Results section header row

SECTION C — Exam Results Table (white card wrapper):
  Section header: "My Exam Results & Academic Transcript"

  Header row: EXAM / PAPER | DATE | MAX MARKS | MARKS OBTAINED | GRADE | RESULT

  Columns:
    Exam / Paper — exam name + subject code chip
      Subject chip: background s.color+'20', color s.color,
                    fontSize 10px, fontWeight 800, padding 1px 7px, borderRadius 10px
      If no color available: background #EBF4FF, color #2B6CB0
    Date — formatted date, color #718096, fontSize 12px
    Max Marks — e.g. "100", textAlign right, color #718096
    Marks Obtained — e.g. "78", textAlign right, fontWeight 700, color #1A202C
                     If ABS (absent): "ABS" in color #A0AEC0
    Grade — grade badge (A/B/C/D/F/ABS as per grade badge spec above)
    Result — "Pass" (green pill) | "Fail" (red pill) | "Absent" (grey pill)
             Use same pill badge pattern

  Row group: when multiple exams belong to the same subject, group them visually —
    show the subject name as a light grey sub-header row above each group:
      background #F8FAFC, fontSize 11px, fontWeight 700, color #718096,
      textTransform uppercase, padding 8px 16px, letterSpacing 0.5px

  Empty state (no results yet):
    Trophy SVG icon (stroke #CBD5E0) + "No exam results recorded yet"

SECTION D — Subject Summary Chips Row (below the table, if marks data exists):
  A horizontal scroll row of summary cards, one per subject:
  <div style={{ display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'4px',
                marginTop:'16px' }}>
    {subjects.map(s => (
      <div style={{
        minWidth: '140px',
        background: '#FFFFFF',
        border: '1px solid #E3E6EA',
        borderRadius: '10px',
        padding: '12px 14px',
        flexShrink: 0
      }}>
        <div style={{ background: (s.color||'#2B6CB0')+'20',
                      color: s.color||'#2B6CB0',
                      fontSize: '10px', fontWeight: 800,
                      padding: '1px 7px', borderRadius: '10px',
                      display: 'inline-block', marginBottom: '6px' }}>
          {s.code || s.name}
        </div>
        <div style={{ fontSize:'20px', fontWeight:800, fontFamily:"'Sora'",
                      color:'#1A202C' }}>{s.average}%</div>
        <div style={{ fontSize:'11px', color:'#718096', marginTop:'2px' }}>
          Avg across {s.examCount} exam{s.examCount!==1?'s':''}
        </div>
      </div>
    ))}
  </div>
  (If subject average data is not already computed, derive it from the existing
  marks state — do not add new localStorage reads.)

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change My Dashboard or My Timetable — they are already well-styled.
2. Do NOT change any admin-side page.
3. Do NOT change data reading logic, localStorage keys, or state variables —
   only JSX and style props change.
4. Keep all existing onClick handlers, sort logic, filter logic intact.
5. Use only inline style={{}} props — no Tailwind classes.
6. After the fix, run npm run build and confirm 0 errors.
7. List all files modified.
```
