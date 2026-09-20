# PBA Full-Time Portal — Timetable Week Navigation Fix + Flexible Classroom Allocation
## AntiGravity Prompt

---

```
Two fixes in GeneralAdminView.jsx only.
(1) Fix Prev Week / Next Week buttons — clicking does nothing right now.
(2) Classroom allocation: flexible per-week assignment with quick-reassign.
    The session schedule (batch/subject/lecturer/day/time) is FIXED for the
    academic year. Classroom is FLEXIBLE — it can change week to week.
Touch ONLY GeneralAdminView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
ARCHITECTURE — understand before touching anything
════════════════════════════════════════════════════════════════

pba_timetable sessions = the RECURRING WEEKLY SCHEDULE for the year:
  { id, day: 'Monday', startTime, endTime,
    batchId, batchName, subjectId, subjectName,
    lecturerId, lecturerName, assistants[],
    classroomId, classroomName  ← DEFAULT classroom (can change) }

Because sessions repeat every week, the timetable grid ALWAYS shows
the same sessions regardless of which week is displayed.
What changes week-to-week is only:
  (a) The calendar dates shown under each day column header
  (b) Per-week classroom overrides (see FIX 2)

Classroom overrides are stored separately in pba_classroom_overrides:
  { sessionId: '...', weekStart: 'YYYY-MM-DD',
    classroomId: '...', classroomName: '...' }

When displaying a session for a specific week, first check overrides,
then fall back to the session's default classroomId.

════════════════════════════════════════════════════════════════
FIX 1 — PREV/NEXT WEEK: Use weekOffset integer state
════════════════════════════════════════════════════════════════

ROOT CAUSE: The weekStart state is likely a Date object.
Mutating a Date object does not trigger a React re-render,
so clicking Prev/Next Week calls setDate() on the same object
reference and nothing updates.

FIX — replace any Date-object week state with a plain integer offset:

STEP A — Add or replace week state at component top:

  const [weekOffset, setWeekOffset] = useState(0);
  // 0 = current week, -1 = last week, +1 = next week

STEP B — Compute weekStart from offset inside render:

  const getWeekStart = (offset) => {
    const today = new Date();
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + (offset * 7));
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekStart = getWeekStart(weekOffset);

  // Canonical weekStart string for override lookups:
  const weekStartStr = weekStart.toISOString().slice(0, 10); // 'YYYY-MM-DD'

STEP C — Week label and per-day dates:

  const weekLabel = `Week of ${weekStart.getDate()} ${
    weekStart.toLocaleDateString('en-US', { month: 'short' })
  } ${weekStart.getFullYear()}`;

  const getDayDate = (dayIndex) => {
    // dayIndex: 0=Monday, 1=Tuesday, ...
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + dayIndex);
    return d.getDate() + ' ' +
      d.toLocaleDateString('en-US', { month: 'short' });
  };

STEP D — Wire buttons:

  // Prev Week:
  onClick={() => setWeekOffset(prev => prev - 1)}

  // Next Week:
  onClick={() => setWeekOffset(prev => prev + 1)}

  // Today (add if not already there):
  onClick={() => setWeekOffset(0)}

STEP E — Update day column headers to show calendar date:

  <th>
    <div style={{ fontWeight: 700, fontSize: '13px' }}>Monday</div>
    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
      {getDayDate(0)}
    </div>
  </th>
  // getDayDate(1) for Tuesday, (2) Wednesday, (3) Thursday, (4) Friday

════════════════════════════════════════════════════════════════
FIX 2 — FLEXIBLE CLASSROOM ALLOCATION
════════════════════════════════════════════════════════════════

Classrooms can change week to week.
The session stores a DEFAULT classroom. Admin can override it for
any specific week without affecting other weeks.

────────────────────────────────────────────────────────────────
2A — Helper: resolve classroom for a session in a given week
────────────────────────────────────────────────────────────────

Add this helper inside the component:

  const resolveClassroom = (session, weekStartStr) => {
    const overrides = safeLS('pba_classroom_overrides', []);
    const override = (overrides || []).find(
      o => o.sessionId === session.id && o.weekStart === weekStartStr
    );
    if (override) {
      return { classroomId: override.classroomId,
               classroomName: override.classroomName,
               isOverride: true };
    }
    return { classroomId: session.classroomId,
             classroomName: session.classroomName,
             isOverride: false };
  };

────────────────────────────────────────────────────────────────
2B — Session card: show classroom with override badge + reassign button
────────────────────────────────────────────────────────────────

In the timetable grid session card, replace or augment the
classroom display with:

  {/* Classroom display in session card */}
  {(() => {
    const room = resolveClassroom(session, weekStartStr);
    return (
      <div style={{ marginTop: '3px' }}>
        {room.classroomId ? (
          <div style={{ fontSize: '10px', color: '#6B7280',
            display: 'flex', alignItems: 'center', gap: '3px',
            flexWrap: 'wrap' }}>
            <span>🏛</span>
            <span>{room.classroomName || room.classroomId}</span>
            {room.isOverride && (
              <span style={{
                padding: '1px 5px', borderRadius: '6px',
                background: '#EEF2FF', border: '1px solid #C7D2FE',
                color: '#4F46E5', fontSize: '9px', fontWeight: 700
              }}>THIS WEEK</span>
            )}
          </div>
        ) : (
          <div style={{
            display: 'inline-block',
            padding: '1px 6px', borderRadius: '8px',
            background: '#FEF9C3', border: '1px solid #FDE047',
            color: '#854D0E', fontSize: '9px', fontWeight: 700
          }}>
            No room set
          </div>
        )}
        {/* Quick-reassign button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setQuickRoomSession({
              session,
              currentRoom: room,
              weekStartStr
            });
          }}
          style={{
            marginTop: '3px', padding: '2px 7px', fontSize: '9px',
            fontWeight: 700, borderRadius: '5px', cursor: 'pointer',
            background: 'transparent',
            border: '1px dashed #D1D5DB',
            color: '#6B7280', width: '100%', textAlign: 'center'
          }}>
          {room.classroomId ? '↕ Change Room' : '+ Assign Room'}
        </button>
      </div>
    );
  })()}

────────────────────────────────────────────────────────────────
2C — Quick-Reassign modal state and JSX
────────────────────────────────────────────────────────────────

Add state at component top:
  const [quickRoomSession, setQuickRoomSession] = useState(null);
  // { session, currentRoom, weekStartStr } or null

  const [quickRoomId, setQuickRoomId] = useState('');
  const [quickRoomScope, setQuickRoomScope] = useState('week');
  // 'week' = just this week | 'default' = update session default

Add this modal JSX (outside the timetable grid, at root level of
the section or just before the closing tag of the outer container):

  {quickRoomSession && (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 9990, display: 'flex', alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '28px',
        width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800,
          color: '#111827' }}>
          Change Classroom
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#6B7280' }}>
          {quickRoomSession.session.subjectName ||
           quickRoomSession.session.batchName} ·{' '}
          {quickRoomSession.session.day}{' '}
          {quickRoomSession.session.startTime}–
          {quickRoomSession.session.endTime}
        </p>

        {/* Current room */}
        {quickRoomSession.currentRoom.classroomId && (
          <div style={{
            marginBottom: '16px', padding: '10px 12px',
            background: '#F9FAFB', borderRadius: '8px',
            fontSize: '12px', color: '#6B7280'
          }}>
            Current: <strong style={{ color: '#374151' }}>
              {quickRoomSession.currentRoom.classroomName}
            </strong>
            {quickRoomSession.currentRoom.isOverride &&
              ' (this week override)'}
          </div>
        )}

        {/* Classroom selector */}
        <label style={{ fontSize: '12px', fontWeight: 700,
          color: '#374151', textTransform: 'uppercase',
          letterSpacing: '0.05em', display: 'block',
          marginBottom: '6px' }}>
          NEW CLASSROOM
        </label>
        <select
          value={quickRoomId}
          onChange={e => setQuickRoomId(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: '8px',
            border: '1px solid #E3E6EA', fontSize: '14px',
            background: 'white', marginBottom: '16px'
          }}>
          <option value="">— Select Classroom —</option>
          {(classrooms || []).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Scope: this week only vs. update default */}
        <label style={{ fontSize: '12px', fontWeight: 700,
          color: '#374151', textTransform: 'uppercase',
          letterSpacing: '0.05em', display: 'block',
          marginBottom: '8px' }}>
          APPLY TO
        </label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <label style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
            border: quickRoomScope === 'week'
              ? '2px solid #4F46E5' : '1px solid #E3E6EA',
            background: quickRoomScope === 'week' ? '#EEF2FF' : 'white'
          }}>
            <input type="radio" name="scope" value="week"
              checked={quickRoomScope === 'week'}
              onChange={() => setQuickRoomScope('week')} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700,
                color: '#374151' }}>This week only</div>
              <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                {quickRoomSession.weekStartStr}
              </div>
            </div>
          </label>
          <label style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
            border: quickRoomScope === 'default'
              ? '2px solid #4F46E5' : '1px solid #E3E6EA',
            background: quickRoomScope === 'default' ? '#EEF2FF' : 'white'
          }}>
            <input type="radio" name="scope" value="default"
              checked={quickRoomScope === 'default'}
              onChange={() => setQuickRoomScope('default')} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700,
                color: '#374151' }}>Update default</div>
              <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                All future weeks
              </div>
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              if (!quickRoomId) return;
              const classroom = (classrooms || [])
                .find(c => c.id === quickRoomId);
              if (!classroom) return;

              if (quickRoomScope === 'week') {
                // Save a per-week override
                const overrides = safeLS('pba_classroom_overrides', []);
                const cleaned = (overrides || []).filter(
                  o => !(o.sessionId === quickRoomSession.session.id &&
                         o.weekStart === quickRoomSession.weekStartStr)
                );
                saveLS('pba_classroom_overrides', [
                  ...cleaned,
                  {
                    sessionId: quickRoomSession.session.id,
                    weekStart: quickRoomSession.weekStartStr,
                    classroomId: classroom.id,
                    classroomName: classroom.name
                  }
                ]);
              } else {
                // Update the session's default classroom
                const timetable = safeLS('pba_timetable', []);
                const updated = (timetable || []).map(s =>
                  s.id === quickRoomSession.session.id
                    ? { ...s,
                        classroomId: classroom.id,
                        classroomName: classroom.name }
                    : s
                );
                saveLS('pba_timetable', updated);
                // Update timetable local state so grid re-renders:
                // (use whatever state setter manages the timetable sessions)
                if (typeof setTimetable === 'function') {
                  setTimetable(updated);
                }
              }

              setQuickRoomSession(null);
              setQuickRoomId('');
              setQuickRoomScope('week');
            }}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              background: '#4F46E5', color: 'white', border: 'none',
              fontWeight: 700, fontSize: '14px', cursor: 'pointer'
            }}>
            Save
          </button>
          <button
            onClick={() => {
              setQuickRoomSession(null);
              setQuickRoomId('');
              setQuickRoomScope('week');
            }}
            style={{
              padding: '10px 16px', borderRadius: '8px',
              background: '#F3F4F6', border: '1px solid #E3E6EA',
              color: '#374151', fontWeight: 600, fontSize: '14px',
              cursor: 'pointer'
            }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

────────────────────────────────────────────────────────────────
2D — Daily Allocation Sheet: also use resolveClassroom
────────────────────────────────────────────────────────────────

The Daily Allocation Sheet reads from pba_timetable filtered by day.
When displaying the CLASSROOM column for each session, call
resolveClassroom(session, weekStartStr) instead of using
session.classroomId directly. This ensures the sheet reflects
any per-week classroom overrides.

  // In the allocation table CLASSROOM cell:
  const room = resolveClassroom(s, weekStartStr);
  <td>
    {room.classroomId ? (
      <span>
        {room.classroomName || room.classroomId}
        {room.isOverride && (
          <span style={{
            marginLeft: '6px', padding: '1px 5px',
            borderRadius: '6px', background: '#EEF2FF',
            color: '#4F46E5', fontSize: '9px', fontWeight: 700
          }}>override</span>
        )}
      </span>
    ) : (
      <span style={{ color: '#F59E0B', fontStyle: 'italic',
        fontSize: '12px' }}>— Not set —</span>
    )}
  </td>

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
6. weekOffset (integer) is the ONLY reliable React state for week nav.
   Never store a Date object in useState for navigation.
7. The timetable sessions are RECURRING — same sessions every week.
   Week navigation changes only the date labels and which override
   is active, NOT which sessions are shown.
8. Classroom is FLEXIBLE — not required. Sessions can exist without one.
   The "No room set" badge is informational only, never blocking.
9. pba_classroom_overrides is a new localStorage key introduced here.
   It stores per-week room changes without touching the session default.
10. If the component uses a local state variable for timetable sessions
    (e.g. const [sessions, setSessions] = useState(...)), use that
    setter when updating defaults. If sessions are always read fresh
    from safeLS in the render, no setter is needed — the save alone
    triggers re-render via the existing pattern.
11. Run npm run build and confirm 0 errors
12. Then npm run deploy to push to GitHub and trigger Vercel deployment
13. List all files modified
```
