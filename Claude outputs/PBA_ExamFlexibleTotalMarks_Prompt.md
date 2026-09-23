# PBA Full-Time Portal — Flexible Paper Total Marks (Raw Score → Percentage)
## AntiGravity Prompt

---

```
Exam papers are not always out of 100. A Biology paper might be out
of 80, a Chemistry paper out of 60. The admin needs to:
  1. Set the total marks for each paper when scheduling it (default 100)
  2. Enter the student's RAW score (e.g. 67 out of 80)
  3. Have the software compute and display the PERCENTAGE automatically
     as: (rawScore / paperTotal) × 100

The column header in the mark sheet should show the actual total
(e.g. "BIO /80") and the % column should show the correctly
calculated percentage, not a raw/100 assumption.

Touch ONLY ExaminationsView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
DATA CHANGE — Add totalMarks to each exam record
════════════════════════════════════════════════════════════════

In pba_exams, each exam record gets a new field:
  totalMarks: number   — default 100 if not set

When reading any exam record, always use:
  const paperTotal = exam.totalMarks || 100;

This ensures backward compatibility — existing exams without
totalMarks behave as if they were out of 100.

════════════════════════════════════════════════════════════════
STEP 1 — Exam Schedule tab: add "Total Marks" field to exam form
════════════════════════════════════════════════════════════════

In the exam creation / edit form (in the Exam Schedule tab), find
the form fields. ADD a "Total Marks" input AFTER the time fields
and BEFORE any notes/description field:

  {/* Total Marks */}
  <div style={{ marginBottom: '16px' }}>
    <label style={{
      display: 'block', fontSize: '11px', fontWeight: 600,
      color: '#6B7280', letterSpacing: '0.05em', marginBottom: '6px'
    }}>
      TOTAL MARKS FOR THIS PAPER
    </label>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <input
        type="number"
        min="1"
        max="1000"
        value={examForm.totalMarks ?? 100}
        onChange={e => setExamForm(prev => ({
          ...prev,
          totalMarks: parseInt(e.target.value, 10) || 100
        }))}
        style={{
          width: '100px',
          padding: '8px 12px',
          border: '1px solid #D1D5DB',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#111827'
        }}
      />
      <span style={{ fontSize: '13px', color: '#6B7280' }}>
        marks  (default: 100 — change if this paper is out of 80, 60, etc.)
      </span>
    </div>
  </div>

Ensure totalMarks is saved in the exam record:
  In the save handler, include: totalMarks: examForm.totalMarks || 100

When loading an exam for editing:
  totalMarks: existingExam.totalMarks || 100

════════════════════════════════════════════════════════════════
STEP 2 — Mark Entry tab: correct denominator display + validation
════════════════════════════════════════════════════════════════

In the Mark Entry tab, the column header currently shows:
  BIO /100

CHANGE it to read the actual totalMarks from the exam record:

  const paperTotal = (selectedExam?.totalMarks) || 100;

In the column header, render:
  {subject} /{paperTotal}

For example: "BIO /80"

In the mark input field, update the max attribute:
  <input
    type="number"
    min="0"
    max={paperTotal}
    ...
  />

If the user types a value greater than paperTotal, show a validation
warning inline:

  {enteredMark > paperTotal && (
    <span style={{ color: '#DC2626', fontSize: '11px' }}>
      Max {paperTotal}
    </span>
  )}

Also update any +/- increment buttons to cap at paperTotal:
  // Increment: Math.min(current + 1, paperTotal)
  // Decrement: Math.max(current - 1, 0)

The raw score is stored AS-IS in pba_marks (or wherever marks live):
  { studentId, examId, rawScore: 67 }   // stored as the actual raw mark

Do NOT store the percentage — always compute it at display time.

════════════════════════════════════════════════════════════════
STEP 3 — Results & Rankings: correct percentage calculation
════════════════════════════════════════════════════════════════

Wherever results, percentages, or totals are computed, use:

  const computePercentage = (rawScore, paperTotal) => {
    if (rawScore === null || rawScore === undefined) return null;
    const total = paperTotal || 100;
    return Math.round((rawScore / total) * 100 * 10) / 10;
    // rounds to 1 decimal place: e.g. 83.8%
  };

In the mark sheet column header, show the raw total:
  Subject column header: "BIO /80" (actual paper total)

In each student cell, show BOTH:
  Raw score: 67
  Percentage: 83.8%

Render the cell like:

  <div>
    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
      {rawScore !== null && rawScore !== undefined ? rawScore : '—'}
    </div>
    {rawScore !== null && rawScore !== undefined && (
      <div style={{ fontSize: '11px', color: '#6B7280' }}>
        {computePercentage(rawScore, paperTotal)}%
      </div>
    )}
  </div>

In the TOTAL column, show:
  Sum of raw scores / Sum of paper totals × 100

  const computeOverallPercent = (studentMarks, examsInView) => {
    let totalRaw   = 0;
    let totalPaper = 0;
    examsInView.forEach(exam => {
      const mark = studentMarks[exam.id];
      if (mark !== null && mark !== undefined) {
        totalRaw   += mark;
        totalPaper += (exam.totalMarks || 100);
      }
    });
    if (totalPaper === 0) return null;
    return Math.round((totalRaw / totalPaper) * 100 * 10) / 10;
  };

In the TOTAL column cell, render:
  {totalRaw} / {totalPaper}   — e.g. "147 / 180"
  {overallPercent}%            — e.g. "81.7%"

  <div>
    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1D4ED8' }}>
      {totalRaw} / {totalPaper}
    </div>
    <div style={{ fontSize: '12px', color: '#6B7280' }}>
      {overallPercent !== null ? `${overallPercent}%` : '—'}
    </div>
  </div>

In the % column, show overallPercent with a colour:
  ≥ 75%  → green  (#065F46 on #D1FAE5)
  50–74% → amber  (#92400E on #FEF3C7)
  < 50%  → red    (#991B1B on #FEE2E2)

  const percentColor = (pct) => {
    if (pct === null) return { color: '#9CA3AF', bg: 'transparent' };
    if (pct >= 75)  return { color: '#065F46', bg: '#D1FAE5' };
    if (pct >= 50)  return { color: '#92400E', bg: '#FEF3C7' };
    return           { color: '#991B1B', bg: '#FEE2E2' };
  };

  const { color, bg } = percentColor(overallPercent);
  <span style={{
    background: bg, color, borderRadius: '6px',
    padding: '3px 8px', fontWeight: 700, fontSize: '13px'
  }}>
    {overallPercent !== null ? `${overallPercent}%` : '—'}
  </span>

════════════════════════════════════════════════════════════════
STEP 4 — Subject Performance tab: correct per-subject stats
════════════════════════════════════════════════════════════════

Any average, highest, lowest, or pass-rate calculation must use
the paper's totalMarks as the denominator:

  // Average percentage for a subject:
  const avgPercent = marks.reduce((sum, m) =>
    sum + (m.rawScore / (m.paperTotal || 100) * 100), 0
  ) / marks.length;

  // Pass rate (≥50% of the paper total):
  const passCount = marks.filter(m =>
    (m.rawScore / (m.paperTotal || 100)) >= 0.5
  ).length;

════════════════════════════════════════════════════════════════
BACKWARD COMPATIBILITY
════════════════════════════════════════════════════════════════

Existing mark records do not have paperTotal stored. For all
existing records, treat paperTotal = 100 (which means a raw score
of 75 was already out of 100 and stays 75%).

Only NEW marks entered after this update will benefit from the
correct totalMarks stored on the exam.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ExaminationsView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. totalMarks defaults to 100 everywhere if not set — never divide by 0
5. Raw scores are stored as-is; percentage is always computed at
   display time — never store the computed percentage
6. The TOTAL column shows "sum of raws / sum of paper totals"
   so mixed-total papers (Bio /80, Chemistry /60) combine correctly
7. Mark input max is capped at the paper's totalMarks
8. Run npm run build and confirm 0 errors
9. Then npm run deploy
10. List all files modified
```
