# PBA Full-Time Portal — Exam Hub: Fix "Schedule New Exam" Button Visibility
## AntiGravity Prompt

---

```
The "+ Schedule New Exam" button appears on ALL tabs in the
Examinations & Results Hub (Mark Entry, Results & Rankings,
Subject Performance) when it should ONLY appear on the
Exam Schedule tab.

Touch ONLY ExamManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE FIX — Wrap the button in a tab condition
════════════════════════════════════════════════════════════════

Find the "+ Schedule New Exam" button. It is currently rendered
in the page header / top bar OUTSIDE of any tab conditional:

  <button ...>+ Schedule New Exam</button>
  OR
  <button ...>📅 Schedule New Exam</button>

WRAP it so it only shows when the Exam Schedule tab is active:

  {(activeTab === 'schedule' || activeTab === 'examSchedule'
    || activeTab === 'exam-schedule' || activeTab === 'Exam Schedule') && (
    <button
      onClick={...existing onClick...}
      style={{...existing style...}}>
      + Schedule New Exam
    </button>
  )}

The exact condition depends on what value your activeTab state
uses for the Exam Schedule tab. Check how the tab buttons set
the activeTab value and match it here:

  Common patterns:
    onClick={() => setActiveTab('schedule')}
    onClick={() => setActiveTab('examSchedule')}
    onClick={() => setActiveTab('Exam Schedule')}

Use whichever value your Exam Schedule tab button already sets.

Keep the button's existing onClick, style, and text EXACTLY
as they are — only ADD the conditional wrapper.

════════════════════════════════════════════════════════════════
ALSO CHECK — any other tab-specific buttons/elements
════════════════════════════════════════════════════════════════

While fixing this, check if any other action buttons in the
Examinations hub header are also showing on wrong tabs.
If so, apply the same tab-conditional wrapping to each one.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ExamManagementView.jsx
2. Do NOT move the button — only wrap it in a conditional
3. Do NOT change the button's onClick, style, or text
4. Run npm run build and confirm 0 errors
5. Then npm run deploy to push to GitHub and trigger Vercel
6. List all files modified
```
