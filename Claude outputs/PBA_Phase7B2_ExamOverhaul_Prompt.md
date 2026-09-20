# PBA Full-Time Portal — Phase 7B-2: Examination Module Overhaul
## AntiGravity Prompt — Run AFTER Phase 7B-1

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Rebuild the Examinations page to support multiple exams per subject over time, with proper mark entry (including absent marking), CSV/Excel marks import, and cumulative subject performance. Run this AFTER the Phase 7B-1 data foundation prompt. Do not change any other pages.

Assume pba_subjects, pba_batch_subjects, pba_marks (with the new structure), and the calcGrade / gradeColor helpers from Phase 7B-1 are now available.

════════════════════════════════════════════════════════════════
SECTION 1 — PAGE TABS (replace existing tabs)
════════════════════════════════════════════════════════════════

The Examinations page should now have these pill-group tabs:
  1. "Exam Schedule" — list of all scheduled/upcoming exams
  2. "Mark Entry" — enter/import marks for a specific exam
  3. "Results & Rankings" — view results for a selected exam
  4. "Subject Performance" — cumulative report per subject across all exams

Use the standard pill-group tab style:
Container: display flex, gap 4px, background #EEF0F4, padding 4px, borderRadius 10px, width fit-content, marginBottom 20px
Active tab: background #FFFFFF, boxShadow 0 1px 4px rgba(0,0,0,0.10), color #2B6CB0, fontWeight 600
Inactive tab: background transparent, color #4A5568, fontWeight 500

════════════════════════════════════════════════════════════════
SECTION 2 — EXAM SCHEDULE TAB
════════════════════════════════════════════════════════════════

FILTER ROW at top:
<div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
  <select> /* Subject filter — options from pba_subjects */ </select>
  <select> /* Batch filter */ </select>
  <select> /* Type filter: All Types / Term Test / Mock Exam / Assignment / Final */ </select>
  <select> /* Status: All / Upcoming / Completed / Draft / Published */ </select>
</div>
Apply the standard select style (white bg, 1.5px border #E3E6EA, 8px radius, blue focus ring, SVG arrow).

EXAM CARDS display the filtered list of exams from pba_exams.
Group exams by subject. For each subject group:

Subject group header:
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', marginTop: '20px' }}>
  <span style={{ background: subjectColor + '20', color: subjectColor, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
    {subject.code}
  </span>
  <span style={{ fontFamily: "'Sora',sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A202C' }}>
    {subject.name}
  </span>
  <span style={{ fontSize: '11px', color: '#718096' }}>
    {examsInSubject.length} exam{examsInSubject.length !== 1 ? 's' : ''}
  </span>
</div>

Each exam card within the group:
<div style={{
  background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '10px',
  padding: '14px 18px', marginBottom: '8px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
}}>
  LEFT: Exam number badge + name + date + batch
  RIGHT: Status badge + action buttons

  Exam number badge:
  <span style={{ background: '#EBF4FF', color: '#2B6CB0', fontSize: '11px', fontWeight: 800,
    padding: '4px 10px', borderRadius: '20px', marginRight: '10px' }}>
    #{exam.examNumber}
  </span>

  Exam name: fontSize 14px, fontWeight 700, color #1A202C
  Date + batch: fontSize 12px, color #718096
  Total marks: fontSize 12px, color #4A5568 — "/ {exam.totalMarks} marks"
  Pass mark: fontSize 11px, color #718096 — "Pass: {exam.passMark}"

  Status badge:
    draft → background #F7FAFC, color #718096, border 1px solid #E2E8F0 — "DRAFT"
    published → background #F0FFF4, color #2F855A, border 1px solid #9AE6B4 — "PUBLISHED"

  Action buttons (right side, flex row gap 8px):
    - "Enter Marks" → blue primary small button (only if draft)
    - "View Results" → ghost button
    - "Publish Results" → green button (only if draft and marks are entered)
    - Edit icon button (pencil)

"+ Schedule New Exam" button (top right of page):
When clicked, open the Schedule Exam modal. The modal now includes:
  - Subject selector (dropdown from pba_subjects)
  - Exam Number (auto-calculated: how many exams already exist for this subject+batch + 1)
  - Exam Type (Term Test / Mock Exam / Assignment / Final Exam / Other)
  - Batch selector
  - Date + Time
  - Total Marks (number input, default 100)
  - Pass Mark (number input, default 50)
  - Venue / Notes

════════════════════════════════════════════════════════════════
SECTION 3 — MARK ENTRY TAB
════════════════════════════════════════════════════════════════

TOP SELECTOR ROW:
  - Exam selector: "Select exam to enter marks" dropdown, grouped by subject
  - Shows: "{subject.code} — {examName} ({batch}) — {date}"
  - Once selected, show a mark entry table below

MARK ENTRY PROGRESS BAR (shows how complete the entry is):
const entered = marks.filter(m => m.marksObtained !== null || m.isAbsent).length;
const total = studentsInBatch.length;

<div style={{ marginBottom: '16px' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
    <span style={{ fontSize: '12px', color: '#4A5568', fontWeight: 600 }}>
      Mark Entry Progress
    </span>
    <span style={{ fontSize: '12px', color: entered === total ? '#2F855A' : '#2B6CB0', fontWeight: 700 }}>
      {entered} / {total} students
    </span>
  </div>
  <div style={{ background: '#E3E6EA', borderRadius: '20px', height: '6px' }}>
    <div style={{
      background: entered === total ? '#2F855A' : '#2B6CB0',
      width: `${(entered/total)*100}%`,
      borderRadius: '20px', height: '6px',
      transition: 'width 0.3s'
    }} />
  </div>
</div>

IMPORT MARKS BUTTON ROW (top of mark entry table):
<div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
  <button onClick={handleImportCSV} style={{ /* ghost button */ }}>
    <svg>/* upload icon */</svg> Import from CSV / Excel
  </button>
  <button onClick={handleDownloadTemplate} style={{ /* ghost button */ }}>
    <svg>/* download icon */</svg> Download Template
  </button>
</div>

IMPORT FROM CSV / EXCEL FLOW:
When "Import from CSV / Excel" is clicked:
1. Show a file input that accepts .csv and .xlsx files
2. Parse the file client-side:
   - For CSV: use a simple split by comma/newline parser
   - For XLSX: use the SheetJS library (import via CDN: https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js)
     Load it with: const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js')
3. Expected columns (case-insensitive): Student Name | Student ID | Marks | Absent (optional, "yes"/"no")
4. Show a PREVIEW TABLE before saving:
   - Each row: student matched / not matched indicator + marks value + absent flag
   - Rows where student wasn't found in pba_students highlighted in amber
   - Validation: marks must be number between 0 and totalMarks; flag invalid rows in red
5. "Confirm Import" button saves validated rows to pba_marks
6. "Cancel" discards

DOWNLOAD TEMPLATE:
Generate and download a CSV file with headers:
Student ID, Student Name, Marks (out of {exam.totalMarks}), Absent (yes/no)
Pre-fill with all students in the selected batch.

MARK ENTRY TABLE:
Display all students in the batch. Columns:
  #  |  Student Name  |  Student ID  |  Marks Obtained  |  Absent  |  Grade

Each row:
  - Student name (bold 13px)
  - Student ID (small muted)
  - Marks input: <input type="number" min="0" max={exam.totalMarks} style={/* standard input style */}
      value={marks[studentId]?.marksObtained ?? ''}
      onChange={e => updateMark(studentId, parseFloat(e.target.value))}
      disabled={marks[studentId]?.isAbsent}
    />
  - Absent checkbox:
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
      <input type="checkbox"
        checked={marks[studentId]?.isAbsent || false}
        onChange={e => setAbsent(studentId, e.target.checked)}
      />
      <span style={{ fontSize: '12px', color: '#718096' }}>Absent</span>
    </label>
    When absent is checked: clear marksObtained, grey out the marks input
  - Grade badge: auto-calculated from calcGrade(marks, exam.totalMarks), styled with gradeColor(grade)

SAVE MARKS BUTTON (bottom, full width, blue primary):
"Save All Marks" — saves current mark entry state to pba_marks localStorage

════════════════════════════════════════════════════════════════
SECTION 4 — RESULTS & RANKINGS TAB
════════════════════════════════════════════════════════════════

EXAM SELECTOR at top (same as Mark Entry tab selector)

STATS TILES ROW (4 tiles, once an exam is selected):
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>

  Tile 1 — Class Average:
  background #EBF4FF, value = avg marks, label "Class Average", subtext "out of {totalMarks}"

  Tile 2 — Highest Mark:
  background #F0FFF4 (green), value = highest, label "Highest Mark", subtext studentName

  Tile 3 — Pass Rate:
  background #EBF4FF, value = "{passCount}/{total}", label "Pass Rate", subtext "{pct}%"

  Tile 4 — Absent:
  background #F7FAFC, value = absentCount, label "Absent", subtext "students"

Each tile:
  <div style={{ background: tileBg, borderRadius: '10px', padding: '14px 18px', border: '1px solid #E3E6EA' }}>
    <div style={{ fontSize: '22px', fontWeight: 800, color: tileColor, fontFamily: "'Sora',sans-serif" }}>{value}</div>
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>{subtext}</div>
  </div>

RESULTS TABLE:
Columns: Rank | Student Name | Marks / Total | Grade | Status

Rank 1 gets golden badge: <span style={{ background: '#FEF3C7', color: '#D4A017', border: '1px solid #F6D860', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '20px' }}>🏆 #1</span>
Ranks 2–3: silver/bronze tones
Others: plain number

Grade: styled badge using gradeColor(grade)
Status badge: Pass (green) / Fail (red) / Absent (grey)

"Print Results" golden button and "Export CSV" ghost button — top right

GRADE DISTRIBUTION BAR (below table):
Show count of A, B, C, D, F, ABS as a horizontal segmented bar with legend

════════════════════════════════════════════════════════════════
SECTION 5 — SUBJECT PERFORMANCE TAB
════════════════════════════════════════════════════════════════

This tab shows the CUMULATIVE performance across ALL exams for a subject.

TOP FILTERS:
  - Subject selector (from pba_subjects)
  - Batch selector

Once selected, show:

EXAM PROGRESSION CHART (simple inline HTML/CSS bar chart):
For each exam in sequence (Exam 1, 2, 3...):
  - Show class average as a bar
  - Label with exam type and date
  - Color bars blue; if average improved from previous → green dot indicator; if dropped → red dot

STUDENT CUMULATIVE TABLE:
Columns: Student Name | Exam 1 | Exam 2 | Exam 3 | ... (dynamic) | Avg | Best Grade | Trend

For each student:
  - Each exam cell: show marks + grade badge (small)
  - If absent: show "ABS" grey badge
  - Average: calculated across all non-absent exams (show in bold)
  - Trend: ↑ (green) if last exam > average, ↓ (red) if below, → (grey) if stable

The table columns expand dynamically based on how many exams exist for the selected subject+batch.

"Print Cumulative Report" button (golden, top right)

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. All mark data reads/writes go through pba_marks localStorage key.
2. calcGrade and gradeColor must be defined at the top of this file.
3. The SheetJS import for XLSX parsing should be loaded lazily (only when the user clicks Import).
4. Do NOT change any other page or component.
5. List which files were modified.
```
