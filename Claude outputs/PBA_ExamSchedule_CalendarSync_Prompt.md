# PBA Full-Time Portal — Exam Schedule: Remove Marks from Scheduling + Calendar Sync
## AntiGravity Prompt

---

```
Two fixes in ExamManagementView.jsx:
(1) Remove TOTAL and PASS fields from the exam paper scheduling form
    — marks are set during Mark Entry, not at scheduling time
(2) Sync exam sessions to the Academic Calendar (pba_calendar_events)
    — create/edit/delete exam sessions must update the calendar

ALSO: establish a standing rule from this point forward —
  Any feature that creates, edits, or deletes data MUST write to ALL
  relevant storage keys, not just its own. Cross-linking is mandatory.

Touch ONLY ExamManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
FIX 1 — REMOVE TOTAL / PASS from paper scheduling form
════════════════════════════════════════════════════════════════

File: ExamManagementView.jsx
Location: "Schedule New Exam" modal → paper row fields

CURRENT paper row has: Paper Label | DATE | START | END | TOTAL | PASS | VENUE
CHANGE TO:            Paper Label | DATE | START | END | VENUE

Remove the TOTAL (totalMarks) and PASS (passMarks) number inputs from
the paper row UI entirely. Do NOT remove them from the data model —
just stop showing them in the scheduling form.

When saving a paper record to pba_exam_schedule, set defaults:
  totalMarks: row.totalMarks || 100
  passMarks:  row.passMarks  || 40

This means:
- New papers default to 100/40 if not set
- Existing papers (edited) keep their stored value
- Users who need custom marks can set them via Edit Paper modal
  (the ✏️ icon on the paper card — already implemented)

The paper card display (Marks: 40/100) should STILL show these values
from the stored record — no change to the display side.

════════════════════════════════════════════════════════════════
FIX 2 — CALENDAR SYNC: Write exam events to pba_calendar_events
════════════════════════════════════════════════════════════════

File: ExamManagementView.jsx
Location: exam session save handler, edit handler, delete handler

The Academic Calendar reads from localStorage key: pba_calendar_events
Each event record shape (match what CalendarView.jsx already stores):

  {
    id: string,           // unique — use 'exam_paper_${examSessionId}_${subjectId}_${paperNumber}'
    title: string,        // e.g. "first term — Biology Paper 1"
    date: 'YYYY-MM-DD',   // the paper's exam date
    endDate: null,        // single-day event
    type: 'Exam',         // matches the calendar legend colour
    notes: string,        // e.g. "BIO · 10:00–12:00 · Hall A"
    sourceId: string,     // examSessionId — used to find+delete on edit/delete
    sourceType: 'exam_session'  // marks it as auto-created (not user-added)
  }

────────────────────────────────────────────────────────────────
HELPER: buildCalendarEvents(examSessionId, sessionName, papers)
────────────────────────────────────────────────────────────────

Add this helper inside the component:

  const buildCalendarEvents = (examSessionId, sessionName, papers) => {
    // papers = array of pba_exam_schedule records for this session
    return (papers || []).map(paper => ({
      id: `exam_paper_${examSessionId}_${paper.subjectId}_${paper.paperNumber}`,
      title: `${sessionName} — ${paper.subjectName} ${paper.paperName || ('Paper ' + paper.paperNumber)}`,
      date: paper.date || '',
      endDate: null,
      type: 'Exam',
      notes: `${paper.subjectCode || ''} · ${paper.startTime || ''}–${paper.endTime || ''}${paper.venue ? ' · ' + paper.venue : ''}`.trim(),
      sourceId: examSessionId,
      sourceType: 'exam_session'
    })).filter(e => e.date); // only include papers that have a date
  };

────────────────────────────────────────────────────────────────
HELPER: syncExamToCalendar(examSessionId, sessionName, newPapers)
────────────────────────────────────────────────────────────────

  const syncExamToCalendar = (examSessionId, sessionName, newPapers) => {
    // 1. Remove any existing auto-created events for this examSessionId
    const existing = safeLS('pba_calendar_events', []);
    const cleaned = (existing || []).filter(
      e => !(e.sourceType === 'exam_session' && e.sourceId === examSessionId)
    );

    // 2. Build new events from the updated papers
    const newEvents = buildCalendarEvents(examSessionId, sessionName, newPapers);

    // 3. Write back
    saveLS('pba_calendar_events', [...cleaned, ...newEvents]);
  };

────────────────────────────────────────────────────────────────
HELPER: deleteExamFromCalendar(examSessionId)
────────────────────────────────────────────────────────────────

  const deleteExamFromCalendar = (examSessionId) => {
    const existing = safeLS('pba_calendar_events', []);
    const cleaned = (existing || []).filter(
      e => !(e.sourceType === 'exam_session' && e.sourceId === examSessionId)
    );
    saveLS('pba_calendar_events', cleaned);
  };

────────────────────────────────────────────────────────────────
WHERE TO CALL THESE HELPERS
────────────────────────────────────────────────────────────────

A. ON SAVE (create OR edit exam session):
   After writing to pba_exam_schedule, call:

     syncExamToCalendar(
       sessionId,           // the examSessionId used for this save
       examForm.sessionName || examForm.name || 'Exam',
       savedPapers          // the array of records just written to pba_exam_schedule
     );

   "savedPapers" is the array of objects you already build before
   writing to pba_exam_schedule. Pass the same array here.

B. ON DELETE SESSION (delete all papers for an examSessionId):
   After removing from pba_exam_schedule, call:

     deleteExamFromCalendar(examSessionId);

C. ON DELETE PAPER (delete a single paper card):
   After removing the one record from pba_exam_schedule:
   Re-read remaining papers for that examSessionId and sync:

     const remaining = safeLS('pba_exam_schedule', []).filter(
       r => r.examSessionId === examSessionId
     );
     const sessionName = remaining[0]?.examSessionName
       || safeLS('pba_exam_schedule', []).find(r => r.examSessionId === examSessionId)?.examSessionName
       || 'Exam';
     syncExamToCalendar(examSessionId, sessionName, remaining);
     // This removes the deleted paper's calendar event and keeps the rest

D. ON EDIT PAPER (save single-paper edit via Edit Paper modal):
   After updating the pba_exam_schedule record, re-sync the whole session:

     const allForSession = safeLS('pba_exam_schedule', []).filter(
       r => r.examSessionId === editPaperRecord.examSessionId
     );
     syncExamToCalendar(
       editPaperRecord.examSessionId,
       allForSession[0]?.examSessionName || 'Exam',
       allForSession
     );

════════════════════════════════════════════════════════════════
FIX 3 — EXAM SCHEDULE: store examSessionName on each paper record
════════════════════════════════════════════════════════════════

To make calendar sync reliable, each pba_exam_schedule record MUST
store the session name so it can be retrieved later without state.

When building the records to save, ensure each includes:
  examSessionName: examForm.sessionName || examForm.name || ''

(If this field already exists in the save logic, skip this fix.)

════════════════════════════════════════════════════════════════
STANDING RULE — CROSS-LINKING (apply to ALL future saves)
════════════════════════════════════════════════════════════════

From this point on, every save/edit/delete handler MUST update ALL
relevant storage keys in one atomic sequence:

  EXAM SESSION save   → pba_exam_schedule + pba_calendar_events
  EXAM SESSION delete → pba_exam_schedule + pba_exam_results + pba_calendar_events
  SESSION (timetable) save → pba_timetable (already exists)
  LECTURER leave      → pba_lecturers + pba_calendar_events (if leave date set)

Do NOT write to pba_calendar_events from CalendarView.jsx for
auto-created events — only ExamManagementView.jsx writes
sourceType:'exam_session' events. CalendarView.jsx manages
user-created events independently.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ExamManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL useState lazy: useState(() => safeLS('key', []))
5. ALL array ops guard null: (array || []).filter(...)
6. The calendar key is pba_calendar_events — this MUST match
   what CalendarView.jsx reads. If your CalendarView uses a
   different key, use that same key here.
7. syncExamToCalendar uses filter+concat — it never wipes user-
   created calendar events (type !== 'exam_session').
8. Paper records that have no date set are skipped from calendar
   sync (the .filter(e => e.date) guard).
9. TOTAL and PASS inputs are removed from the scheduling form UI
   only — the fields remain in the data model and are still shown
   on paper cards and available in Mark Entry.
10. The Edit Paper modal (already built) is the correct place for
    users to change totalMarks/passMarks if needed.
11. Run npm run build and confirm 0 errors
12. Then npm run deploy to push to GitHub and trigger Vercel deployment
13. List all files modified
```
