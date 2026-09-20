# PBA Full-Time Portal — Daily Allocation Sheet: Inline Classroom Assignment + WhatsApp Share
## AntiGravity Prompt

---

```
Enhance the Daily Allocation Sheet in GeneralAdminView.jsx.
The classroom for each session is decided the day before, so admin
needs to be able to open tomorrow's sheet, assign rooms inline, and
send the finalized table via WhatsApp.
Touch ONLY GeneralAdminView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
WORKFLOW BEING IMPLEMENTED
════════════════════════════════════════════════════════════════

1. Admin opens Daily Allocation Sheet, navigates to TOMORROW
2. For each session row, selects a classroom from an inline dropdown
3. That assignment saves to pba_classroom_overrides keyed by
   { sessionId, date: 'YYYY-MM-DD' }
4. Once all rooms are set, taps "Share via WhatsApp" → opens
   WhatsApp with the fully formatted allocation table as a message

════════════════════════════════════════════════════════════════
OVERVIEW OF CURRENT STATE TO PRESERVE
════════════════════════════════════════════════════════════════

The Daily Allocation Sheet already exists with:
  - Day picker dropdown (Monday–Sunday with "(Today)" label)
  - Table: TIME | CLASSROOM | BATCH | SUBJECT | LECTURER | ASSISTANT
  - "Share via WhatsApp" button (top-right)
  - Sessions sourced from pba_timetable filtered by day name

DO NOT rebuild. ADD to what exists:
  (1) Date navigation (Prev Day / Next Day / Today) so admin
      can jump to a specific date (not just a day name)
  (2) Inline classroom dropdown on each row
  (3) Per-date classroom overrides saved to pba_classroom_overrides
  (4) Enhanced WhatsApp message with all room assignments

════════════════════════════════════════════════════════════════
FIX 1 — DATE NAVIGATION: Replace day-name picker with date nav
════════════════════════════════════════════════════════════════

The current day picker shows day names (Monday, Tuesday…).
Replace it with a date offset navigator so admin can pick any
specific calendar date (important because room assignments are
per-date, not per-day-of-week).

STEP A — Replace the day-name state with a date offset:

  // REMOVE: const [allocDay, setAllocDay] = useState(...)
  // ADD:
  const [allocDateOffset, setAllocDateOffset] = useState(0);
  // 0 = today, 1 = tomorrow, -1 = yesterday, etc.

STEP B — Compute the target date from offset:

  const getAllocDate = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  };

  const allocDate = getAllocDate(allocDateOffset);

  // Day name for filtering pba_timetable (sessions store day names):
  const allocDayName = allocDate.toLocaleDateString('en-US',
    { weekday: 'long' }); // 'Monday', 'Tuesday', etc.

  // ISO date string for override keys:
  const allocDateStr = allocDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  // Human-readable label for the header:
  const allocDateLabel = (() => {
    if (allocDateOffset === 0) return `Today — ${
      allocDate.toLocaleDateString('en-US',
        { weekday: 'long', day: 'numeric', month: 'short' })}`;
    if (allocDateOffset === 1) return `Tomorrow — ${
      allocDate.toLocaleDateString('en-US',
        { weekday: 'long', day: 'numeric', month: 'short' })}`;
    if (allocDateOffset === -1) return `Yesterday — ${
      allocDate.toLocaleDateString('en-US',
        { weekday: 'long', day: 'numeric', month: 'short' })}`;
    return allocDate.toLocaleDateString('en-US',
      { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  })();

STEP C — Replace the day-name picker UI with date navigation buttons:

  <div style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '16px', flexWrap: 'wrap'
  }}>
    {/* Prev Day */}
    <button
      onClick={() => setAllocDateOffset(prev => prev - 1)}
      style={{
        padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
        background: 'white', border: '1px solid #E3E6EA',
        fontWeight: 600, fontSize: '13px', color: '#374151'
      }}>
      ← Prev
    </button>

    {/* Date label */}
    <div style={{
      fontWeight: 800, fontSize: '15px', color: '#111827',
      flex: 1, textAlign: 'center', minWidth: '200px'
    }}>
      📅 {allocDateLabel}
    </div>

    {/* Next Day */}
    <button
      onClick={() => setAllocDateOffset(prev => prev + 1)}
      style={{
        padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
        background: 'white', border: '1px solid #E3E6EA',
        fontWeight: 600, fontSize: '13px', color: '#374151'
      }}>
      Next →
    </button>

    {/* Today shortcut */}
    {allocDateOffset !== 0 && (
      <button
        onClick={() => setAllocDateOffset(0)}
        style={{
          padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
          background: '#EEF2FF', border: '1px solid #C7D2FE',
          fontWeight: 700, fontSize: '12px', color: '#4F46E5'
        }}>
        Today
      </button>
    )}

    {/* Tomorrow shortcut */}
    {allocDateOffset !== 1 && (
      <button
        onClick={() => setAllocDateOffset(1)}
        style={{
          padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
          background: '#F0FDF4', border: '1px solid #BBF7D0',
          fontWeight: 700, fontSize: '12px', color: '#166534'
        }}>
        Tomorrow
      </button>
    )}
  </div>

STEP D — Update the session filter to use allocDayName:

  const allocSessions = (() => {
    const timetable = safeLS('pba_timetable', []);
    return (timetable || [])
      .filter(s => s.day === allocDayName)
      .sort((a, b) => {
        const ta = (a.startTime || '00:00').replace(':', '');
        const tb = (b.startTime || '00:00').replace(':', '');
        return Number(ta) - Number(tb);
      });
  })();

════════════════════════════════════════════════════════════════
FIX 2 — CLASSROOM OVERRIDE: resolve and save per-date
════════════════════════════════════════════════════════════════

STEP A — Helper to read the classroom for a session on a specific date:

  const resolveAllocClassroom = (session, dateStr) => {
    const overrides = safeLS('pba_classroom_overrides', []);
    const override = (overrides || []).find(
      o => o.sessionId === session.id && o.date === dateStr
    );
    if (override) {
      return {
        classroomId: override.classroomId,
        classroomName: override.classroomName,
        isOverride: true
      };
    }
    return {
      classroomId: session.classroomId || '',
      classroomName: session.classroomName || '',
      isOverride: false
    };
  };

STEP B — Save classroom override for a specific session+date:

  const saveAllocClassroom = (session, dateStr, classroomId) => {
    const classroom = (classrooms || []).find(c => c.id === classroomId);
    const overrides = safeLS('pba_classroom_overrides', []);
    const cleaned = (overrides || []).filter(
      o => !(o.sessionId === session.id && o.date === dateStr)
    );
    const newOverride = classroomId
      ? [{
          sessionId: session.id,
          date: dateStr,
          classroomId: classroom?.id || classroomId,
          classroomName: classroom?.name || ''
        }]
      : [];
    saveLS('pba_classroom_overrides', [...cleaned, ...newOverride]);
  };

NOTE: pba_classroom_overrides uses { sessionId, date: 'YYYY-MM-DD' }
as the key. If a prior prompt used { sessionId, weekStart } as the key,
keep both formats in the resolver — check for 'date' first, then
fall back to 'weekStart' for backward compatibility:

  const resolveAllocClassroom = (session, dateStr) => {
    const overrides = safeLS('pba_classroom_overrides', []);
    // Exact date match (preferred):
    const dateOverride = (overrides || []).find(
      o => o.sessionId === session.id && o.date === dateStr
    );
    if (dateOverride) return {
      classroomId: dateOverride.classroomId,
      classroomName: dateOverride.classroomName,
      isOverride: true
    };
    // Default from session record:
    return {
      classroomId: session.classroomId || '',
      classroomName: session.classroomName || '',
      isOverride: false
    };
  };

════════════════════════════════════════════════════════════════
FIX 3 — TABLE: CLASSROOM column becomes an inline dropdown
════════════════════════════════════════════════════════════════

In the allocation table, replace the static CLASSROOM cell with
an inline dropdown that saves immediately on change:

  // In each session row's CLASSROOM cell:
  {(() => {
    const room = resolveAllocClassroom(s, allocDateStr);
    return (
      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
        <select
          value={room.classroomId || ''}
          onChange={e => {
            saveAllocClassroom(s, allocDateStr, e.target.value);
            // Trigger re-render — update a counter state:
            setAllocRefresh(n => n + 1);
          }}
          style={{
            padding: '6px 10px', borderRadius: '8px', fontSize: '13px',
            border: room.classroomId
              ? '1px solid #D1FAE5'
              : '2px dashed #FCD34D',
            background: room.classroomId ? '#F0FDF4' : '#FFFBEB',
            color: room.classroomId ? '#166534' : '#92400E',
            fontWeight: 600, cursor: 'pointer', minWidth: '130px'
          }}>
          <option value="">— Assign Room —</option>
          {(classrooms || []).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {room.isOverride && (
          <div style={{ fontSize: '9px', color: '#4F46E5',
            marginTop: '2px', fontWeight: 700 }}>
            ✓ Assigned for this date
          </div>
        )}
      </td>
    );
  })()}

Add this state for forcing re-renders when overrides change
(since overrides are in localStorage, not React state):

  const [allocRefresh, setAllocRefresh] = useState(0);
  // Use allocRefresh in the table key or a dependency to force refresh:
  // <table key={allocRefresh + allocDateStr}>

  Apply allocRefresh as the table's key:
  <table key={`${allocDateStr}-${allocRefresh}`} style={{ width: '100%', ... }}>

════════════════════════════════════════════════════════════════
FIX 4 — WHATSAPP SHARE: Formatted allocation table
════════════════════════════════════════════════════════════════

STEP A — Build the WhatsApp message:

  const buildWhatsAppMessage = () => {
    const timetable = safeLS('pba_timetable', []);
    const sessions = (timetable || [])
      .filter(s => s.day === allocDayName)
      .sort((a, b) => {
        const ta = (a.startTime || '00:00').replace(':', '');
        const tb = (b.startTime || '00:00').replace(':', '');
        return Number(ta) - Number(tb);
      });

    if (sessions.length === 0) {
      return `📋 *PBA Daily Allocation*\n${allocDateLabel}\n\nNo sessions scheduled.`;
    }

    // Count unassigned rooms
    const unassigned = sessions.filter(s => {
      const r = resolveAllocClassroom(s, allocDateStr);
      return !r.classroomId;
    }).length;

    let msg = `📋 *PBA Daily Allocation*\n`;
    msg += `📅 ${allocDateLabel}\n`;
    if (unassigned > 0) {
      msg += `⚠ ${unassigned} session(s) without classroom\n`;
    }
    msg += `\n`;

    sessions.forEach(s => {
      const room = resolveAllocClassroom(s, allocDateStr);
      const roomText = room.classroomName || '⚠ TBC';
      const assistants = (s.assistants || [])
        .filter(a => a.lecturerId)
        .map(a => a.lecturerName)
        .join(', ');

      msg += `🕐 *${s.startTime}–${s.endTime}*\n`;
      msg += `🏛 ${roomText}\n`;
      msg += `📚 ${s.subjectName || '—'} · ${s.batchName || '—'}\n`;
      msg += `👤 ${s.lecturerName || '—'}`;
      if (assistants) msg += ` (Asst: ${assistants})`;
      msg += `\n\n`;
    });

    msg += `_Sent from PBA Portal_`;
    return msg;
  };

STEP B — Wire the WhatsApp button:

  Find the existing "Share via WhatsApp" button and update its onClick:

  onClick={() => {
    const msg = buildWhatsAppMessage();
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }}

STEP C — Add a "completion" indicator above the table showing
how many rooms are assigned vs total:

  {(() => {
    const total = allocSessions.length;
    const assigned = allocSessions.filter(s => {
      const r = resolveAllocClassroom(s, allocDateStr);
      return !!r.classroomId;
    }).length;
    if (total === 0) return null;
    const allDone = assigned === total;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 16px', marginBottom: '12px', borderRadius: '10px',
        background: allDone ? '#F0FDF4' : '#FFFBEB',
        border: `1px solid ${allDone ? '#BBF7D0' : '#FDE68A'}`
      }}>
        <div style={{ flex: 1 }}>
          <span style={{
            fontWeight: 800, fontSize: '13px',
            color: allDone ? '#166534' : '#92400E'
          }}>
            {allDone ? '✅ All rooms assigned' : `⚠ ${total - assigned} of ${total} rooms not yet assigned`}
          </span>
        </div>
        {/* Mini progress bar */}
        <div style={{
          width: '120px', height: '6px', background: '#E5E7EB',
          borderRadius: '3px', overflow: 'hidden'
        }}>
          <div style={{
            width: `${total > 0 ? (assigned/total)*100 : 0}%`,
            height: '100%',
            background: allDone ? '#22C55E' : '#F59E0B',
            borderRadius: '3px', transition: 'width 0.3s'
          }} />
        </div>
      </div>
    );
  })()}

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL useState calls that read localStorage MUST use lazy initializer:
   useState(() => safeLS('key', []))
5. ALL array operations must guard against null:
   (array || []).filter(...), (array || []).map(...)
6. allocDateOffset (integer) is the reliable state for date navigation.
   0=today, 1=tomorrow, -1=yesterday. getDate() + offset handles month
   rollovers automatically since the Date constructor handles them.
7. pba_classroom_overrides stores per-date assignments:
   { sessionId, date: 'YYYY-MM-DD', classroomId, classroomName }
   This is separate from the session's default classroomId on the
   pba_timetable record.
8. The inline classroom dropdown saves IMMEDIATELY on change — no
   save button needed. Admin can see all rows, assign rooms one by one,
   then hit Share.
9. WhatsApp share uses wa.me/?text= which works on mobile and desktop.
   On mobile it opens the app directly. On desktop it opens wa.me.
10. allocRefresh is a counter state used to force table re-render
    after saving overrides (since overrides live in localStorage,
    not React state, a counter increments to trigger re-read).
11. If classrooms state is loaded elsewhere in the component as
    const [classrooms, setClassrooms] = useState(() => safeLS('pba_classrooms', []))
    use that existing state. Do not create a duplicate.
12. Run npm run build and confirm 0 errors
13. Then npm run deploy to push to GitHub and trigger Vercel deployment
14. List all files modified
```
