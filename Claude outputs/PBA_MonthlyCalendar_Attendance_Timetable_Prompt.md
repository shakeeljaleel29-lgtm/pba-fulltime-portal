# PBA Full-Time Portal — Monthly Calendar + Attendance + Timetable Fixes
## AntiGravity Prompt

---

```
Fix three broken areas in General Admin.
Touch ONLY GeneralAdminView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
ANALYSIS OF CURRENT FLAWS
════════════════════════════════════════════════════════════════

FLAW 1: Monthly Calendar tab is COMPLETELY EMPTY
  - Only shows the title heading — no calendar grid whatsoever
  - No way to add or view academic events

FLAW 2: Today's Class Changes — disconnected from pba_timetable
  - Session list shows "No sessions scheduled" even when timetable
    has sessions for that day (e.g. Monday has Cambridge O Level session)
  - No "Take Attendance" button on session rows
  - Attendance Records section reads no data from pba_attendance

FLAW 3: Timetable session cards show "(No Subject)"
  - Saved sessions where subject was blank now display "(No Subject)"
  - Cards need graceful fallback + option to re-edit

════════════════════════════════════════════════════════════════
FIX 1 — MONTHLY ACADEMIC CALENDAR (full implementation)
════════════════════════════════════════════════════════════════

localStorage key: pba_academic_calendar
Record shape:
  { id, date, title, type, notes, color }
  type: 'term_start' | 'term_end' | 'holiday' | 'exam_week' | 'event'

TYPE → LABEL + COLOR:
  term_start  → "Term Start"  #276749 (green)
  term_end    → "Term End"    #2B6CB0 (blue)
  holiday     → "Holiday"     #E53E3E (red)
  exam_week   → "Exam Week"   #B7860A (amber)
  event       → "Event"       #6B46C1 (purple)

STATE:
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [calendarEvents, setCalendarEvents] = useState(() => safeLS('pba_academic_calendar', []));
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ date: '', title: '', type: 'event', notes: '', color: '#6B46C1' });
  const [editingEvent, setEditingEvent] = useState(null);

CALENDAR GRID LAYOUT:
  Show the current month as a 7-column (Sun–Sat) grid.
  Navigation: ← Prev Month | Month Year | Next Month →

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth(); // 0-indexed
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build grid cells: leading empty cells + day cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  Render as rows of 7:
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
      <div style={{ textAlign: 'center', padding: '8px', fontSize: '11px',
        fontWeight: 700, color: '#718096', background: '#F7F8FC' }}>{day}</div>
    ))}
    {cells.map((day, idx) => {
      if (!day) return <div key={idx} style={{ minHeight: '80px', background: '#FAFAFA' }} />;
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const dayEvents = calendarEvents.filter(e => e.date === dateStr);
      const isToday = dateStr === new Date().toISOString().slice(0,10);
      return (
        <div key={idx}
          onClick={() => { setEventForm({ date: dateStr, title: '', type: 'event', notes: '', color: '#6B46C1' }); setEditingEvent(null); setShowEventModal(true); }}
          style={{
            minHeight: '80px', padding: '6px',
            background: isToday ? '#EEF2FF' : 'white',
            border: isToday ? '2px solid #4F46E5' : '1px solid #E3E6EA',
            borderRadius: '6px', cursor: 'pointer',
            transition: 'background 0.15s'
          }}>
          <div style={{ fontSize: '13px', fontWeight: isToday ? 700 : 500,
            color: isToday ? '#4F46E5' : '#1A202C', marginBottom: '4px' }}>{day}</div>
          {dayEvents.map(ev => (
            <div key={ev.id}
              onClick={e => { e.stopPropagation(); setEventForm(ev); setEditingEvent(ev); setShowEventModal(true); }}
              style={{
                fontSize: '10px', fontWeight: 600, padding: '2px 5px',
                background: ev.color + '22', color: ev.color,
                borderLeft: `3px solid ${ev.color}`, borderRadius: '3px',
                marginBottom: '2px', cursor: 'pointer',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>{ev.title}</div>
          ))}
        </div>
      );
    })}
  </div>

HEADER ROW (above grid):
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button onClick={() => setCalendarDate(new Date(year, month-1, 1))}
        style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #E3E6EA',
          background: 'white', cursor: 'pointer', fontSize: '13px' }}>← Prev</button>
      <span style={{ fontWeight: 700, fontSize: '16px', color: '#1A202C', alignSelf: 'center' }}>
        {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </span>
      <button onClick={() => setCalendarDate(new Date(year, month+1, 1))}
        style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #E3E6EA',
          background: 'white', cursor: 'pointer', fontSize: '13px' }}>Next →</button>
    </div>
    <button onClick={() => { setEventForm({ date: new Date().toISOString().slice(0,10), title: '', type: 'event', notes: '', color: '#6B46C1' }); setEditingEvent(null); setShowEventModal(true); }}
      style={{ padding: '8px 18px', background: '#4F46E5', color: 'white',
        border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
      + Add Event
    </button>
  </div>

LEGEND ROW (below header, above grid):
  Show color pills for each event type:
  [🟢 Term Start] [🔵 Term End] [🔴 Holiday] [🟡 Exam Week] [🟣 Event]

ADD / EDIT EVENT MODAL:
  Fields:
    - DATE (date input, pre-filled from clicked cell)
    - TITLE (text input, required)
    - TYPE (select: term_start | term_end | holiday | exam_week | event)
      → auto-sets color when type changes:
        term_start → #276749, term_end → #2B6CB0, holiday → #E53E3E,
        exam_week → #B7860A, event → #6B46C1
    - NOTES (optional textarea)
  Buttons: [Delete] (if editing existing) | [Cancel] | [Save Event]

  On Save:
    if (editingEvent) {
      const updated = calendarEvents.map(e => e.id === editingEvent.id ? { ...eventForm, id: editingEvent.id } : e);
      saveLS('pba_academic_calendar', updated);
      setCalendarEvents(updated);
    } else {
      const newEvent = { ...eventForm, id: Date.now().toString() };
      const updated = [...calendarEvents, newEvent];
      saveLS('pba_academic_calendar', updated);
      setCalendarEvents(updated);
    }

════════════════════════════════════════════════════════════════
FIX 2 — TODAY'S CLASS CHANGES: Connect to pba_timetable
════════════════════════════════════════════════════════════════

STATE:
  const [todayDate, setTodayDate] = useState(() => new Date().toISOString().slice(0,10));
  const [timetable, setTimetable] = useState(() => safeLS('pba_timetable', []));
  const [attendanceRecords, setAttendanceRecords] = useState(() => safeLS('pba_attendance', []));
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceSession, setAttendanceSession] = useState(null);
  const [students, setStudents] = useState(() => safeLS('pba_students', []));

GET TODAY'S DAY NAME:
  const dayName = new Date(todayDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  // e.g. "Monday", "Tuesday", etc.

FILTER TIMETABLE FOR SELECTED DATE:
  const todaySessions = (timetable || []).filter(s => {
    if (s.recurrence === 'weekly') return s.day === dayName;
    if (s.recurrence === 'biweekly') return s.day === dayName; // simplified
    if (s.recurrence === 'one_time') return s.startDate === todayDate;
    return s.day === dayName; // default
  });

SESSION TABLE COLUMNS:
  TIME | BATCH | SUBJECT | LECTURER | CLASSROOM | STATUS | ACTIONS

  STATUS for each session (check pba_attendance for that session + date):
    const hasAttendance = (attendanceRecords || []).some(
      a => a.sessionId === session.id && a.date === todayDate
    );
    status = hasAttendance ? '✓ Attendance Taken' : 'Pending'

  STATUS rendering:
    hasAttendance:
      <span style={{ color: '#276749', fontWeight: 600, fontSize: '12px' }}>✓ Taken</span>
    not taken:
      <span style={{ color: '#B7860A', fontWeight: 600, fontSize: '12px' }}>⏳ Pending</span>

  ACTIONS column:
    <button
      onClick={() => { setAttendanceSession(session); setShowAttendanceModal(true); }}
      style={{ padding: '5px 12px', background: hasAttendance ? '#EEF2FF' : '#4F46E5',
        color: hasAttendance ? '#4F46E5' : 'white', border: hasAttendance ? '1px solid #C7D2FE' : 'none',
        borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
      {hasAttendance ? 'View Attendance' : '📋 Take Attendance'}
    </button>

TAKE ATTENDANCE MODAL:
  Title: "Attendance — {session.subjectName} | {session.batchName} | {todayDate}"

  Load students for that batch:
    const batchStudents = (students || []).filter(s => s.batchId === attendanceSession?.batchId);

  Load existing attendance for this session+date (to pre-fill if re-opening):
    const existingRecords = (attendanceRecords || []).filter(
      a => a.sessionId === attendanceSession?.id && a.date === todayDate
    );

  STATE inside modal:
    const [marks, setMarks] = useState(() => {
      const map = {};
      batchStudents.forEach(s => {
        const existing = existingRecords.find(r => r.studentId === s.id);
        map[s.id] = existing?.status || 'present';
      });
      return map;
    });

  Student rows: NAME | [Present] [Late] [Absent] toggle buttons

  Each row:
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0F4FF' }}>
      <span style={{ fontWeight: 500, fontSize: '13px' }}>{student.name}</span>
      <div style={{ display: 'flex', gap: '6px' }}>
        {['present', 'late', 'absent'].map(status => (
          <button key={status}
            onClick={() => setMarks(prev => ({ ...prev, [student.id]: status }))}
            style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
              fontWeight: 600, cursor: 'pointer', border: 'none',
              background: marks[student.id] === status
                ? status === 'present' ? '#276749' : status === 'late' ? '#B7860A' : '#E53E3E'
                : '#F0F4FF',
              color: marks[student.id] === status ? 'white' : '#718096'
            }}>
            {status === 'present' ? '✓ Present' : status === 'late' ? '⏰ Late' : '✗ Absent'}
          </button>
        ))}
      </div>
    </div>

  QUICK ACTIONS row: [Mark All Present] [Mark All Absent]

  Summary bar (updates live):
    Present: X | Late: X | Absent: X | Rate: {(present+late)/total*100}%

  On Save:
    Remove any existing records for this session+date, then add new ones:
    const newRecords = batchStudents.map(s => ({
      id: Date.now().toString() + s.id,
      sessionId: attendanceSession.id,
      batchId: attendanceSession.batchId,
      batchName: attendanceSession.batchName,
      subjectId: attendanceSession.subjectId,
      subjectName: attendanceSession.subjectName,
      lecturerId: attendanceSession.lecturerId,
      lecturerName: attendanceSession.lecturerName,
      studentId: s.id,
      studentName: s.name,
      date: todayDate,
      day: dayName,
      startTime: attendanceSession.startTime,
      endTime: attendanceSession.endTime,
      status: marks[s.id] || 'present',
      takenBy: safeLS('pba_logged_in_user', {})?.name || 'Admin'
    }));
    const filtered = (attendanceRecords || []).filter(
      a => !(a.sessionId === attendanceSession.id && a.date === todayDate)
    );
    const updated = [...filtered, ...newRecords];
    saveLS('pba_attendance', updated);
    setAttendanceRecords(updated);
    setShowAttendanceModal(false);

════════════════════════════════════════════════════════════════
FIX 3 — ATTENDANCE RECORDS SECTION: Connect to pba_attendance
════════════════════════════════════════════════════════════════

The Attendance Records section below Today's Class Status should:
  1. Load filter values from real data:
     - BATCH dropdown: pba_batches (not hardcoded)
     - SUBJECT dropdown: pba_subjects
     - LECTURER dropdown: pba_lecturers
  2. Filter pba_attendance by selected Date + Batch + Subject + Lecturer
  3. Show each record grouped by session (one row per session, not per student)

  Group attendance by { sessionId, date }:
    const grouped = {};
    (filteredAttendance || []).forEach(record => {
      const key = `${record.sessionId}_${record.date}`;
      if (!grouped[key]) {
        grouped[key] = {
          sessionId: record.sessionId, date: record.date,
          batchName: record.batchName, subjectName: record.subjectName,
          lecturerName: record.lecturerName, startTime: record.startTime,
          endTime: record.endTime, records: []
        };
      }
      grouped[key].records.push(record);
    });

  TABLE COLUMNS: DATE | BATCH | SUBJECT | LECTURER | TIME | PRESENT | ABSENT | LATE | RATE | ACTIONS

  For each grouped session:
    const present = group.records.filter(r => r.status === 'present').length;
    const late    = group.records.filter(r => r.status === 'late').length;
    const absent  = group.records.filter(r => r.status === 'absent').length;
    const total   = group.records.length;
    const rate    = total > 0 ? Math.round((present + late) / total * 100) : 0;

  RATE cell: show as colored badge:
    rate >= 80: green #276749
    rate >= 60: amber #B7860A
    rate < 60:  red #E53E3E

  ACTIONS: [View Details] button — opens a modal showing per-student status

════════════════════════════════════════════════════════════════
FIX 4 — TIMETABLE CARDS: Handle "(No Subject)" gracefully
════════════════════════════════════════════════════════════════

In the Visual Timetable Builder grid, when a session card has no
subjectName (was saved with blank subject), render it gracefully:

  <div style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5' }}>
    {session.subjectName || session.batchName || 'No Subject'}
  </div>

  If subjectName is empty, add a small amber warning indicator:
  {!session.subjectName && (
    <div style={{ fontSize: '10px', color: '#B7860A', marginTop: '2px' }}>
      ⚠ Edit to assign subject
    </div>
  )}

  Also: ensure clicking a card opens the Edit Session modal
  pre-filled with ALL that session's data so it can be corrected.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL useState that reads localStorage: useState(() => safeLS('key', []))
5. ALL array operations: (array || []).filter(...)
6. The Monthly Calendar and Attendance Modal must both be 100% functional
7. Run npm run build and confirm 0 errors
8. Then run npm run deploy to push to GitHub and trigger Vercel deployment
9. List all files modified
```
