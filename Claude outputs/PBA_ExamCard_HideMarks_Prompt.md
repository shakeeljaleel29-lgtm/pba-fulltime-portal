# PBA Full-Time Portal — Exam Schedule Cards: Remove Marks Display
## AntiGravity Prompt

---

```
Remove the "Marks: X/Y" line from exam paper cards in ExamManagementView.jsx.
Marks are entered at Mark Entry time, not shown on the schedule card.
Touch ONLY ExamManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE FIX — single change
════════════════════════════════════════════════════════════════

File: ExamManagementView.jsx
Location: the paper card JSX that renders each exam paper

Find and DELETE the line(s) that display marks on the card.
They will look like one of these patterns:

  Pattern A:
    <div>Marks: {paper.passMarks}/{paper.totalMarks}</div>

  Pattern B:
    Marks: {paper.passMarks}/{paper.totalMarks}

  Pattern C (with styling):
    <div style={{ ... }}>
      Marks: {paper.passMarks}/{paper.totalMarks}
    </div>

  Pattern D (separate lines for pass/total):
    <div>Total: {paper.totalMarks}</div>
    <div>Pass: {paper.passMarks}</div>

  Pattern E (with label):
    <span>Pass Marks: {paper.passMarks}</span>
    <span>Total Marks: {paper.totalMarks}</span>

DELETE whichever of these patterns exists in the paper card.
Do not delete anything else on the card (date, time, status badge,
edit/delete buttons, Assign Invigilators button).

Do NOT remove passMarks or totalMarks from the data model —
they are still needed for Mark Entry. Only remove the display
from the schedule card.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ExamManagementView.jsx
2. This is a display-only change — no data is deleted
3. passMarks and totalMarks remain stored in pba_exam_schedule
   for use in Mark Entry and Results tabs
4. Run npm run build and confirm 0 errors
5. Then npm run deploy to push to GitHub and trigger Vercel deployment
6. List all files modified
```
