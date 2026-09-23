# PBA Full-Time Portal — Daily Classroom Allocation & WhatsApp Share
## AntiGravity Prompt

---

```
The timetable lets admins schedule recurring sessions, but there
is no way to assign or change the CLASSROOM for individual
occurrences of those sessions. The actual classroom for each
class is decided the afternoon before and then shared with all
lecturers via WhatsApp.

Add a "Daily Room Allocation" tab to the Visual Timetable
Builder section in General Admin. This tab lets the admin:
  1. Select a date (default: tomorrow)
  2. See every session scheduled for that day
  3. Assign or change the classroom per session for that day only
  4. Share the finalized schedule to WhatsApp in one tap

Touch ONLY the file containing the Visual Timetable Builder
(GeneralAdminView.jsx or TimetableView.jsx — whichever contains
"Schedule a Session").

Do NOT change any other file.

════════════════════════════════════════════════════════════════
DATA STORAGE
════════════════════════════════════════════════════════════════

Master sessions are in pba_sessions (or pba_timetable) — these
store the recurring schedule and their DEFAULT classroom.
Do NOT mutate these records for daily overrides.

Store daily classroom overrides separately:
  pba_room_overrides = [
    {
      sessionId: "session-uuid",
      date: "2026-09-24",        ← ISO date string YYYY-MM-DD
      classroomId: "room-uuid",
      classroomName: "Hall B"    ← denormalized for quick display
    }
  ]

When displaying sessions for a day, check pba_room_overrides
first. If a matching override exists (sessionId + date), use
that classroom. Otherwise use the session's default classroom.

════════════════════════════════════════════════════════════════
STEP 1 — Add "Daily Allocation" tab to the timetable section
════════════════════════════════════════════════════════════════

Find the tab bar inside the timetable section. It currently has
tabs like: Batch Manager, Subject Manager, Classroom Manager,
Visual Timetable Builder, etc.

ADD a new tab:
  Label: "📋 Daily Allocation"
  Key:   'dailyAllocation'

════════════════════════════════════════════════════════════════
STEP 2 — Build the Daily Allocation tab UI
════════════════════════════════════════════════════════════════

When the "Daily Allocation" tab is selected, render:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEADER ROW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  <div style={{ display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: '20px' }}>

    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
        Daily Classroom Allocation
      </h2>
      <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>
        Assign classrooms for each session, then share with lecturers via WhatsApp.
      </p>
    </div>

    {/* Date picker */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button onClick={() => setAllocationDate(offsetDate(allocationDate, -1))}
        style={{ padding: '6px 12px', border: '1px solid #D1D5DB',
                 borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>
        ‹
      </button>
      <input
        type="date"
        value={allocationDate}
        onChange={e => setAllocationDate(e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #D1D5DB',
                 borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                 color: '#111827', cursor: 'pointer' }}
      />
      <button onClick={() => setAllocationDate(offsetDate(allocationDate, +1))}
        style={{ padding: '6px 12px', border: '1px solid #D1D5DB',
                 borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '16px' }}>
        ›
      </button>
      <button onClick={() => setAllocationDate(tomorrowDateString())}
        style={{ padding: '7px 14px', border: '1px solid #D1D5DB',
                 borderRadius: '6px', background: '#F9FAFB', cursor: 'pointer',
                 fontSize: '12px', fontWeight: 600, color: '#374151' }}>
        Tomorrow
      </button>
    </div>
  </div>

ADD these helper functions near the top of the component:

  const tomorrowDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const offsetDate = (dateStr, days) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const getDayName = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
  };

ADD state:
  const [allocationDate, setAllocationDate] = useState(() => tomorrowDateString());

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION LIST for the selected date
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Get all sessions for the selected day of week:

  const getSessionsForDate = (dateStr) => {
    const dayName = getDayName(dateStr);    // e.g. "Thursday"
    const allSessions = safeLS('pba_sessions', []);
    const overrides   = safeLS('pba_room_overrides', []);
    const classrooms  = safeLS('pba_classrooms', []);
    const batches     = safeLS('pba_batches', []);
    const lecturers   = safeLS('pba_lecturers', []);

    return (allSessions || [])
      .filter(s => {
        if (s.day !== dayName) return false;
        // Respect start/end date if set
        if (s.startDate && dateStr < s.startDate) return false;
        if (s.endDate   && dateStr > s.endDate)   return false;
        return true;
      })
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
      .map(session => {
        const override = (overrides || []).find(
          o => o.sessionId === session.id && o.date === dateStr
        );
        const batch    = (batches || []).find(b => b.id === session.batchId);
        const lecturer = (lecturers || []).find(l => l.id === session.lecturerId);
        const defaultRoom = (classrooms || []).find(c => c.id === session.classroomId);
        return {
          ...session,
          batchName:     batch?.name    || session.batchName    || '—',
          lecturerName:  lecturer?.name || session.lecturerName || '—',
          currentRoomId:   override?.classroomId   || session.classroomId   || '',
          currentRoomName: override?.classroomName || defaultRoom?.name     || session.classroomName || '—',
          hasOverride: !!override
        };
      });
  };

Render sessions for the selected date:

  const sessionsForDay = getSessionsForDate(allocationDate);

  {sessionsForDay.length === 0
    ? (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
        <p style={{ fontSize: '14px', margin: 0 }}>
          No sessions scheduled for {getDayName(allocationDate)}.
        </p>
      </div>
    )
    : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sessionsForDay.map(session => (
          <div key={session.id} style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr 1fr 1fr 220px',
            alignItems: 'center',
            gap: '12px',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '14px 18px'
          }}>

            {/* Time */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                {session.startTime}
              </div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                to {session.endTime}
              </div>
            </div>

            {/* Batch + Subject */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                {session.batchName}
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                {session.subject || '—'}
              </div>
            </div>

            {/* Lecturer */}
            <div style={{ fontSize: '13px', color: '#374151' }}>
              {session.lecturerName}
            </div>

            {/* Current room (with override indicator) */}
            <div>
              <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                {session.currentRoomName}
              </div>
              {session.hasOverride && (
                <div style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 600 }}>
                  ✎ overridden for this day
                </div>
              )}
            </div>

            {/* Classroom selector */}
            <div>
              <select
                value={session.currentRoomId}
                onChange={e => handleRoomOverride(session.id, e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#fff',
                  cursor: 'pointer',
                  color: '#111827'
                }}
              >
                <option value="">— Select Room —</option>
                {(safeLS('pba_classrooms', []) || []).map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                    {room.capacity ? ` (Cap: ${room.capacity})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    )
  }

ADD the handleRoomOverride function:

  const handleRoomOverride = (sessionId, newRoomId) => {
    const classrooms = safeLS('pba_classrooms', []);
    const room = (classrooms || []).find(r => r.id === newRoomId);
    const existing = safeLS('pba_room_overrides', []);

    // Remove old override for this session+date, then add new one
    const filtered = (existing || []).filter(
      o => !(o.sessionId === sessionId && o.date === allocationDate)
    );
    if (newRoomId) {
      filtered.push({
        sessionId,
        date: allocationDate,
        classroomId:   newRoomId,
        classroomName: room?.name || ''
      });
    }
    saveLS('pba_room_overrides', filtered);
    // Trigger re-render
    setAllocationDate(prev => prev); // force re-derive sessionsForDay
  };

  // Better: use a state that tracks overrides for re-render
  // Add: const [, forceUpdate] = useState(0);
  // In handleRoomOverride after saveLS: forceUpdate(n => n + 1);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHATSAPP SHARE BUTTON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

At the BOTTOM of the session list (or top-right of the tab),
add a WhatsApp share button:

  const generateWhatsAppMessage = () => {
    const dateLabel = new Date(allocationDate).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const lines = [
      `📅 *PBA Full-Time Portal — Class Schedule*`,
      `📆 *${dateLabel}*`,
      ``
    ];
    sessionsForDay.forEach(session => {
      lines.push(
        `🕐 *${session.startTime} – ${session.endTime}*` +
        ` | ${session.subject || 'Session'}` +
        ` | ${session.batchName}` +
        ` | ${session.lecturerName}` +
        ` | 🏫 ${session.currentRoomName}`
      );
    });
    lines.push(``);
    lines.push(`_Sent from PBA Full-Time Portal_`);
    return lines.join('\n');
  };

  <div style={{ display: 'flex', justifyContent: 'flex-end',
                gap: '10px', marginTop: '20px' }}>

    {/* Copy to clipboard */}
    <button
      onClick={() => navigator.clipboard.writeText(generateWhatsAppMessage())}
      style={{
        padding: '10px 20px',
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        background: '#ffffff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        color: '#374151'
      }}
    >
      📋 Copy Schedule
    </button>

    {/* Share via WhatsApp */}
    <button
      onClick={() => {
        const msg = generateWhatsAppMessage();
        window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
      }}
      disabled={sessionsForDay.length === 0}
      style={{
        padding: '10px 24px',
        border: 'none',
        borderRadius: '8px',
        background: sessionsForDay.length > 0 ? '#25D366' : '#D1D5DB',
        cursor: sessionsForDay.length > 0 ? 'pointer' : 'not-allowed',
        fontSize: '14px',
        fontWeight: 700,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span style={{ fontSize: '18px' }}>💬</span>
      Share on WhatsApp
    </button>
  </div>

The WhatsApp message will look like:

  📅 *PBA Full-Time Portal — Class Schedule*
  📆 *Thursday, 24 September 2026*

  🕐 *07:00 – 09:00* | Biology | al 23 | Dr. K. Liyanage | 🏫 Hall A
  🕐 *09:00 – 11:00* | Chemistry | Cambridge OL 2027 | Dr. Perera | 🏫 Hall B
  🕐 *14:00 – 16:00* | Physics | Cambridge OL 2027 | Dr. Fernando | 🏫 Lab 1

  _Sent from PBA Full-Time Portal_

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY the timetable file (GeneralAdminView.jsx or similar)
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. pba_room_overrides stores ONLY overrides — not all sessions.
   If no override exists for a session+date, the default
   classroom from the session record is shown.
5. Overrides do NOT change pba_sessions — the master timetable
   is untouched. Only pba_room_overrides is written.
6. The "Tomorrow" button always jumps to tomorrow's date.
7. The WhatsApp button uses window.open() — it opens WhatsApp
   Web or the WhatsApp app with the message pre-filled.
8. The "Copy Schedule" button copies plain text to clipboard
   for pasting into any other app.
9. Sessions are sorted by startTime ascending.
10. Run npm run build and confirm 0 errors
11. Then npm run deploy
12. List all files modified
```
