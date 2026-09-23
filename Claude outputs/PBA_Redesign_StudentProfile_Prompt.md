# PBA Full-Time Portal — Redesign: Student Profile Overview Tab
## AntiGravity Prompt

---

```
The Student Profile drawer's Overview tab is cluttered and unclear.
Redesign it into a clean, well-organised card-based layout with a
proper visual hierarchy, clear section headings, and icons for every
field. Information must be easy to scan at a glance.

Touch ONLY StudentManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
CURRENT PROBLEMS TO FIX
════════════════════════════════════════════════════════════════

  1. Personal info and academic status are dumped into two flat
     columns with no visual grouping — nothing stands out
  2. "Enrolled Batches" is squeezed below Academic Status with
     no breathing room
  3. No student avatar / initials circle
  4. Status badge is plain text — not visually prominent
  5. No quick-stats row showing key numbers at a glance
  6. Label text is too faint and field values have no hierarchy

════════════════════════════════════════════════════════════════
NEW LAYOUT — Overview tab (full redesign)
════════════════════════════════════════════════════════════════

Replace the current Overview tab content with the following
four-section layout:

────────────────────────────────────────────────────────────────
SECTION 1 — Student Hero Banner
────────────────────────────────────────────────────────────────

A horizontal banner at the top of the overview tab:

  ┌──────────────────────────────────────────────────────────┐
  │  ┌────┐                                                  │
  │  │ KJ │  Kasun Jayawardena                   ● Active   │
  │  └────┘  PBA-FT-2024-001                                 │
  │           Batch 2024-A (A/L Commerce) · Kohuwala         │
  └──────────────────────────────────────────────────────────┘

Styles:
  background: linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)
  padding: 20px 24px
  borderRadius: 12px
  color: white
  display: flex, alignItems: center, gap: 16px
  marginBottom: 20px

Avatar circle (initials, first letter of first + last name):
  width: 56px, height: 56px, borderRadius: '50%'
  background: 'rgba(255,255,255,0.2)'
  border: '2px solid rgba(255,255,255,0.4)'
  display: flex, alignItems: center, justifyContent: center
  fontSize: 20px, fontWeight: 700, color: white

Name text:
  fontSize: 20px, fontWeight: 700, color: white, marginBottom: 2px

Sub-line (reg no):
  fontSize: 13px, color: 'rgba(255,255,255,0.75)', marginBottom: 4px

Batch + branch chip (pill):
  background: 'rgba(255,255,255,0.15)'
  border: '1px solid rgba(255,255,255,0.25)'
  borderRadius: 20px, padding: '3px 10px'
  fontSize: 12px, color: white, display: inline-block

Status badge (top-right of banner, pushed with marginLeft: auto):
  Active:    background #22C55E, color white
  Withdrawn: background #EF4444, color white
  Completed: background #6B7280, color white
  borderRadius: 20px, padding: '4px 14px'
  fontSize: 12px, fontWeight: 600

────────────────────────────────────────────────────────────────
SECTION 2 — Quick Stats Row (4 tiles)
────────────────────────────────────────────────────────────────

A row of 4 compact stat tiles immediately below the banner:

  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ 📅 Enrolled  │ │ 🎓 Batches   │ │ 📄 Documents │ │ ⚠ Discipline │
  │ 08 Jan 2024  │ │      1       │ │      1       │ │      0       │
  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

Tile container:
  display: grid, gridTemplateColumns: 'repeat(4, 1fr)', gap: 12px
  marginBottom: 20px

Each tile:
  background: #F9FAFB
  border: '1px solid #E5E7EB'
  borderRadius: 10px
  padding: '14px 16px'
  textAlign: center

Tile icon:
  fontSize: 18px, marginBottom: 4px

Tile label:
  fontSize: 11px, color: #6B7280, fontWeight: 500, marginBottom: 2px
  textTransform: uppercase, letterSpacing: '0.5px'

Tile value:
  fontSize: 16px, fontWeight: 700, color: #111827

Data:
  • Enrolled: format student.enrollmentDate as "DD MMM YYYY"
    or "N/A" if absent
  • Batches:  count of student's enrolled batches (from pba_batches
    where student appears) — derive this count live:
      const batchCount = (safeLS('pba_batches', []) || [])
        .filter(b => (b.students || [])
          .some(s => (s.id || s.regNo || s.studentId || '').toString()
            === (student.id || student.regNo || '').toString())
        ).length;
  • Documents: the Documents tab badge count (already computed)
  • Discipline: the Discipline tab badge count (already computed)

────────────────────────────────────────────────────────────────
SECTION 3 — Personal Information card
────────────────────────────────────────────────────────────────

A white card with a section heading and a 2-column icon-labelled grid:

  ┌──────────────────────────────────────────────────────────┐
  │  👤 Personal Information                                  │
  │  ─────────────────────────────────────────────────────   │
  │  📍 Branch         Kohuwala Branch                       │
  │  🎂 Date of Birth  12 April 2006  (Age: 20)              │
  │  📱 Student Phone  +94 77 444 5566                       │
  │  📱 Parent Phone   +94 71 222 3344                       │
  │  ✉  Email          kasun.j@gmail.com                     │
  │  📅 Enrolled       08 January 2024                       │
  └──────────────────────────────────────────────────────────┘

Card styles:
  background: white
  border: '1px solid #E5E7EB'
  borderRadius: 12px
  padding: '20px 24px'
  marginBottom: 16px

Section heading:
  fontSize: 13px, fontWeight: 700, color: #374151
  textTransform: uppercase, letterSpacing: '0.5px'
  marginBottom: 16px, display: flex, alignItems: center, gap: 8px
  paddingBottom: 10px, borderBottom: '1px solid #F3F4F6'

Field row (each field):
  display: flex, alignItems: flex-start, gap: 12px
  padding: '8px 0'
  borderBottom: '1px solid #F9FAFB'  (omit on last row)

Field icon:
  fontSize: 14px, width: 20px, textAlign: center,
  color: #6B7280, flexShrink: 0, marginTop: 1px

Field label:
  width: 130px, flexShrink: 0
  fontSize: 12px, color: #6B7280, fontWeight: 500

Field value:
  fontSize: 13px, color: #111827, fontWeight: 500
  wordBreak: break-word

Fields to show (skip any that are empty / null):
  📍  Branch          student.branch
  🎂  Date of Birth   formatted date + "(Age: N)" computed from DOB
  📱  Student Phone   student.phone || student.studentPhone
  📱  Parent Phone    student.parentPhone || student.guardianPhone
  ✉   Email           student.email
  📅  Enrolled        student.enrollmentDate formatted

Age computation (always use local date, never UTC):
  const dob = new Date(student.dateOfBirth || student.dob);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear()
    - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);

────────────────────────────────────────────────────────────────
SECTION 4 — Academic Status + Enrolled Batches (side by side)
────────────────────────────────────────────────────────────────

Two cards in a 2-column grid below the personal info card:

  ┌──────────────────────────────┐  ┌──────────────────────────────┐
  │  🎓 Academic Status           │  │  📚 Enrolled Batches  [+]    │
  │  ─────────────────────────   │  │  ─────────────────────────   │
  │  ● ACTIVE                    │  │  Cambridge O Level 2027  ×   │
  │                               │  │                              │
  │  📝 Admin Notes               │  │  (empty state if none)       │
  │  ┌─────────────────────────┐  │  └──────────────────────────────┘
  │  │ Student has shown...    │  │
  │  └─────────────────────────┘  │
  └──────────────────────────────┘

Grid container:
  display: grid, gridTemplateColumns: '1fr 1fr', gap: 16px

Academic Status card (left):
  background: white, border: '1px solid #E5E7EB'
  borderRadius: 12px, padding: '20px 24px'

Status pill (large, centered):
  display: inline-block, padding: '6px 18px'
  borderRadius: 20px, fontSize: 13px, fontWeight: 700
  Active:    background #D1FAE5, color #065F46
  Withdrawn: background #FEE2E2, color #991B1B
  Completed: background #F3F4F6, color #374151
  marginBottom: 16px

Admin Notes label:
  fontSize: 12px, color: #6B7280, fontWeight: 500, marginBottom: 6px

Admin Notes textarea:
  width: '100%', minHeight: 80px
  padding: '10px 12px'
  border: '1px solid #E5E7EB', borderRadius: 8px
  fontSize: 13px, color: #111827, resize: 'vertical'
  background: #F9FAFB
  (keep existing onChange + onBlur save logic unchanged)

Enrolled Batches card (right):
  background: white, border: '1px solid #E5E7EB'
  borderRadius: 12px, padding: '20px 24px'

"+ Enroll in Batch" button (in card heading row, pushed right):
  background: #2563EB, color: white
  border: none, borderRadius: 8px
  padding: '5px 12px', fontSize: 12px, fontWeight: 600
  cursor: pointer

Each batch chip:
  display: inline-flex, alignItems: center, gap: 6px
  background: #EFF6FF, color: #1D4ED8
  border: '1px solid #BFDBFE'
  borderRadius: 20px, padding: '4px 12px'
  fontSize: 12px, fontWeight: 500, margin: '4px 4px 4px 0'

Empty state (no batches):
  fontSize: 13px, color: #9CA3AF
  textAlign: center, padding: '20px 0'
  "No batches enrolled yet"

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY StudentManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. Replace ONLY the Overview tab content — do NOT touch
   Attendance, Subjects, Marks & Grades, Discipline, Fees Ledger,
   Documents, or Report Card tabs
5. Keep all existing functionality (Admin Notes save on blur,
   "+ Enroll in Batch" modal trigger, batch chip display) — only
   the visual layout and styling changes
6. The hero banner gradient must always show (even if batch/branch
   data is missing — fall back to "No batch assigned")
7. Compute initials from student name: first letter of first word
   + first letter of last word, uppercase
8. Skip any personal info field that is null, undefined, or empty
   string — do not show blank rows
9. The 2-column grid for Section 4 must collapse to 1 column on
   narrow drawers (if drawer width < 500px use flex-direction column)
10. Run npm run build and confirm 0 errors
11. Then npm run deploy
12. List all files modified
```
