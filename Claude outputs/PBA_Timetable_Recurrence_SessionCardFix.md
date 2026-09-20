# PBA Full-Time Portal — Timetable: Session Recurrence + Session Card Fix
## AntiGravity Prompt — Surgical Fix

---

```
Two fixes to the Visual Timetable Builder in General Admin.
Do NOT change any other page or component.

════════════════════════════════════════════════════════════════
FIX 1 — SESSION CARD: Subject name not resolving (shows "Subject")
════════════════════════════════════════════════════════════════

The session card currently displays the literal text "Subject" instead of
the actual subject name. Fix the name resolution in the session card render:

  // At the top of the timetable component (or in a helper):
  const subjects   = safeLS('pba_subjects', []);
  const batches    = safeLS('pba_batches', []);
  const users      = safeLS('pba_users', []);
  const classrooms = safeLS('pba_classrooms', []);

  // Inside the session card render:
  const subject   = subjects.find(s => s.id === session.subjectId);
  const batch     = batches.find(b => b.id === session.batchId);
  const lecturer  = users.find(u => u.id === session.lecturerId);
  const classroom = classrooms.find(c => c.id === session.classroomId);

  const subjectName   = subject?.name   || '(No Subject)';
  const batchName     = batch?.name     || '(No Batch)';
  const lecturerName  = lecturer?.name  || '—';
  const classroomName = classroom?.name || '—';

SESSION CARD layout (replace the broken render with this):

  <div style={{
    position: 'absolute',
    left: '4px', right: '4px',
    top: topPx, height: heightPx,
    background: '#FFFFFF',
    border: '1.5px solid #BEE3F8',
    borderLeft: `4px solid ${batch?.color || '#2B6CB0'}`,
    borderRadius: '6px',
    padding: '5px 7px',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  }}>

    {/* Stream badge + recurrence badge */}
    <div style={{ display: 'flex', gap: '4px', marginBottom: '3px', flexWrap: 'wrap' }}>
      {subject?.stream && (
        <span style={{
          fontSize: '9px', fontWeight: 800, padding: '1px 5px',
          borderRadius: '8px',
          background: subject.stream === 'compulsory' ? '#FFF5F5'
                    : subject.stream === 'science'    ? '#F0FFF4'
                    : subject.stream === 'commerce'   ? '#FFFBEB'
                    : '#FAF5FF',
          color: subject.stream === 'compulsory' ? '#C53030'
               : subject.stream === 'science'    ? '#276749'
               : subject.stream === 'commerce'   ? '#B7860A'
               : '#6B46C1',
          textTransform: 'uppercase'
        }}>
          {subject.stream === 'compulsory' ? 'CORE'
           : subject.stream === 'science'  ? 'SCI'
           : subject.stream === 'commerce' ? 'COM' : 'ELC'}
        </span>
      )}
      {session.recurrence === 'weekly' && (
        <span style={{
          fontSize: '9px', fontWeight: 700, padding: '1px 5px',
          borderRadius: '8px', background: '#EBF4FF', color: '#2B6CB0'
        }}>↻ Weekly</span>
      )}
      {session.recurrence === 'biweekly' && (
        <span style={{
          fontSize: '9px', fontWeight: 700, padding: '1px 5px',
          borderRadius: '8px', background: '#FAF5FF', color: '#6B46C1'
        }}>↻ Bi-weekly</span>
      )}
      {session.isMakeup && (
        <span style={{
          fontSize: '8px', fontWeight: 800, padding: '1px 4px',
          borderRadius: '3px', background: '#FFFBEB', color: '#B7860A'
        }}>MAKE-UP</span>
      )}
      {session.isLocked && (
        <span style={{ fontSize: '10px' }}>🔒</span>
      )}
    </div>

    {/* Subject name — MUST use resolved name, not literal "Subject" */}
    <div style={{
      fontSize: '12px', fontWeight: 700, color: '#1A202C',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
    }}>
      {subjectName}
    </div>

    {/* Batch name */}
    <div style={{
      fontSize: '10px', color: '#4A5568', marginTop: '1px',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
    }}>
      {batchName}
    </div>

    {/* Time */}
    <div style={{ fontSize: '10px', color: '#2B6CB0', marginTop: '2px', fontWeight: 600 }}>
      {session.startTime}–{session.endTime}
    </div>

    {/* Classroom · Lecturer (only if card is tall enough — height > 80px) */}
    {heightPx > 80 && (
      <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {classroomName} · {lecturerName}
      </div>
    )}
    {heightPx > 80 && session.assistantId && (
      <div style={{ fontSize: '10px', color: '#B7860A', marginTop: '1px' }}>
        Asst: {users.find(u => u.id === session.assistantId)?.name || '—'}
      </div>
    )}
  </div>

════════════════════════════════════════════════════════════════
FIX 2 — SESSION RECURRENCE: Add repeat options to sessions
════════════════════════════════════════════════════════════════

DATA CHANGE — pba_timetable_sessions: add recurrence fields

  recurrence: 'weekly' | 'biweekly' | 'once'
  // Default: 'weekly' — most class sessions repeat every week
  // 'once'     — one-time session (a specific date, e.g. a make-up or special class)
  // 'biweekly' — every two weeks

  recurrenceStartDate: string | null   // 'YYYY-MM-DD' — when recurrence begins
                                       // null = from the start of the timetable
  recurrenceEndDate: string | null     // 'YYYY-MM-DD' — when recurrence ends
                                       // null = runs indefinitely

  For 'once' sessions, also require:
  specificDate: string   // 'YYYY-MM-DD' — the exact date of this one-time session

────────────────────────────────────────────────────────────────
ADD / EDIT SESSION MODAL — new RECURRENCE section
────────────────────────────────────────────────────────────────

Add a RECURRENCE section to the modal, between the TIME fields and the CLASSROOM field:

  Label: RECURRENCE
  Three option buttons side by side:

  [↻ Weekly]   [↻ Bi-weekly]   [⊙ One-time]

  Active button style:
    background: '#EBF4FF', border: '1.5px solid #2B6CB0',
    color: '#2B6CB0', borderRadius: '8px', padding: '7px 14px',
    fontSize: '12px', fontWeight: 700, cursor: 'pointer'

  Inactive button style:
    background: '#F7F8FA', border: '1px solid #E3E6EA',
    color: '#718096', borderRadius: '8px', padding: '7px 14px',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer'

  Default selected: Weekly

  CONDITIONAL FIELDS (shown below the recurrence buttons):

  If Weekly or Bi-weekly selected:
    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
      <div style={{ flex: 1 }}>
        <label>START DATE (optional)</label>
        <input type="date" value={recurrenceStartDate} ... />
        <div style={{ fontSize: '10px', color: '#A0AEC0', marginTop: '3px' }}>
          Leave blank to start from the beginning of term
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <label>END DATE (optional)</label>
        <input type="date" value={recurrenceEndDate} ... />
        <div style={{ fontSize: '10px', color: '#A0AEC0', marginTop: '3px' }}>
          Leave blank to run until end of academic year
        </div>
      </div>
    </div>

  If One-time selected:
    <div style={{ marginTop: '10px' }}>
      <label>CLASS DATE *</label>
      <input type="date" value={specificDate} required ... />
      <div style={{ fontSize: '10px', color: '#A0AEC0', marginTop: '3px' }}>
        This session will only appear on this specific date
      </div>
    </div>

────────────────────────────────────────────────────────────────
TIMETABLE GRID: How to render sessions by recurrence
────────────────────────────────────────────────────────────────

The timetable grid shows a week (Mon–Sat or Mon–Sun).
The grid needs to know the current week being displayed.

For each session in pba_timetable_sessions, determine whether it
should appear in the currently displayed week:

  const shouldShowSession = (session, weekStartDate) => {
    const weekDates = getDatesForWeek(weekStartDate); // array of 7 date strings
    const sessionDayIndex = ['monday','tuesday','wednesday','thursday',
                             'friday','saturday','sunday']
                            .indexOf(session.day?.toLowerCase());
    const sessionDate = weekDates[sessionDayIndex];

    if (session.recurrence === 'once') {
      // Only show on the specific date
      return session.specificDate === sessionDate;
    }

    if (session.recurrence === 'weekly') {
      // Show every week, within optional start/end bounds
      if (session.recurrenceStartDate && sessionDate < session.recurrenceStartDate) return false;
      if (session.recurrenceEndDate   && sessionDate > session.recurrenceEndDate)   return false;
      return true;
    }

    if (session.recurrence === 'biweekly') {
      // Show every other week — calculate parity from recurrenceStartDate
      if (session.recurrenceStartDate && sessionDate < session.recurrenceStartDate) return false;
      if (session.recurrenceEndDate   && sessionDate > session.recurrenceEndDate)   return false;
      const startRef = session.recurrenceStartDate || '2025-01-01';
      const weeksDiff = Math.floor(
        (new Date(sessionDate) - new Date(startRef)) / (7 * 24 * 60 * 60 * 1000)
      );
      return weeksDiff % 2 === 0;
    }

    return true; // default: always show
  };

  Helper:
  const getDatesForWeek = (mondayDate) => {
    const dates = [];
    const start = new Date(mondayDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

If the timetable does not currently track which week is displayed:
  Add a weekStartDate state:
    const getMonday = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return d.toISOString().split('T')[0];
    };
    const [weekStartDate, setWeekStartDate] = useState(() => getMonday(new Date()));

  Add week navigation buttons to the toolbar:
    [← Prev Week]  "Week of {mondayFormatted}"  [Next Week →]
    Ghost button style; label in Sora 13px bold

────────────────────────────────────────────────────────────────
MIGRATION: existing sessions without recurrence field
────────────────────────────────────────────────────────────────

On first load, for any session in pba_timetable_sessions where
recurrence is undefined or null:
  session.recurrence = 'weekly';   // assume all existing sessions are weekly
  session.recurrenceStartDate = null;
  session.recurrenceEndDate = null;

Save the migrated array back to pba_timetable_sessions.

════════════════════════════════════════════════════════════════
FIX 3 — BATCH MANAGER: Set default recurrence per batch subject
════════════════════════════════════════════════════════════════

In Step 2 of the Create/Edit Batch wizard (Assign Subjects),
each assigned subject row in the right panel should include a
RECURRENCE column alongside LECTURER and ASSISTANT:

  Update the batchSubjects array item structure:
    { subjectId, lecturerId, assistantId, defaultRecurrence: 'weekly' | 'biweekly' | 'once' }
  Default: 'weekly'

  In the assigned subject row, add a small recurrence selector after the assistant dropdown:

  <select
    value={bs.defaultRecurrence || 'weekly'}
    onChange={e => setBatchSubjects(prev => prev.map(x =>
      x.subjectId === bs.subjectId
        ? { ...x, defaultRecurrence: e.target.value }
        : x
    ))}
    style={{
      padding: '5px 8px', borderRadius: '6px',
      border: '1px solid #E3E6EA', fontSize: '11px', color: '#1A202C'
    }}
  >
    <option value="weekly">↻ Weekly</option>
    <option value="biweekly">↻ Bi-weekly</option>
    <option value="once">⊙ One-time</option>
  </select>

This defaultRecurrence is stored on the batch's batchSubjects array.

PROPAGATION — when creating a session in the Visual Timetable Builder:
  When the admin selects a batch and subject in the Add Session modal,
  auto-populate the recurrence field from that batch subject's defaultRecurrence:

    const batchSubjectEntry = selectedBatch?.batchSubjects
      ?.find(bs => bs.subjectId === selectedSubjectId);
    if (batchSubjectEntry?.defaultRecurrence) {
      setRecurrence(batchSubjectEntry.defaultRecurrence);
    }

  The admin can still override this per-session in the Add Session modal.
  The batch-level setting is just a smart default, not a lock.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any other page or component
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. Default recurrence for NEW sessions = 'weekly' (or from batch subject default)
5. The session card MUST show the resolved subject name — never the literal string "Subject"
6. One-time sessions must only render on their specificDate, not on other weeks
7. Bi-weekly sessions must correctly skip alternate weeks using weeksDiff % 2
8. The batch subject defaultRecurrence is a default, not a hard lock — admin can override per session
9. Run npm run build and confirm 0 errors
10. List all files modified
```
