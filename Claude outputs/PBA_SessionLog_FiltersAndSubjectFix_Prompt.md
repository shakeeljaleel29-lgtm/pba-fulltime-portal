# PBA Full-Time Portal — Session Log: Fix "Unknown Subject" + Add Filters
## AntiGravity Prompt

---

```
Fix the Session Log tab in LecturerManagementView.jsx:
(1) SUBJECT column shows "Unknown Subject" — resolve the real name
(2) Add Batch, Subject, and Status filter dropdowns
Touch ONLY LecturerManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE PROBLEMS (from screenshots)
════════════════════════════════════════════════════════════════

PROBLEM 1 — "Unknown Subject" in every row
  The SESSION LOG table SUBJECT column shows "Unknown Subject" in blue
  for all sessions. The session record in pba_timetable stores a
  subjectId but the subject name is not being resolved at render time.

PROBLEM 2 — Missing filters
  The filter bar only has:
    Lecturer: [All Lecturers ▼]    This Week | This Month | This Year | Custom Range
  
  Missing filters that are needed:
    - BATCH filter (to show sessions for one batch only)
    - SUBJECT filter (to show sessions for one subject only)
    - STATUS filter (Conducted / Missed / Substituted / All)

════════════════════════════════════════════════════════════════
FIX 1 — RESOLVE "Unknown Subject"
════════════════════════════════════════════════════════════════

At the top of the component (with other data loads):
  const [subjects, setSubjects]   = useState(() => safeLS('pba_subjects', []));
  const [batches, setBatches]     = useState(() => safeLS('pba_batches', []));
  const [timetable, setTimetable] = useState(() => safeLS('pba_timetable', []));

When rendering each session row in the Session Log table,
resolve the subject name with this helper (in order of preference):

  const resolveSubjectName = (session) => {
    // Priority 1: already stored on the session
    if (session.subjectName && session.subjectName !== 'Unknown Subject') {
      return session.subjectName;
    }
    // Priority 2: look up by subjectId in pba_subjects
    if (session.subjectId) {
      const sub = (subjects || []).find(s => s.id === session.subjectId);
      if (sub?.name) return sub.name;
    }
    // Priority 3: look up via the batch's assigned subjects
    if (session.subjectId && session.batchId) {
      const batch = (batches || []).find(b => b.id === session.batchId);
      const bSub  = (batch?.subjects || []).find(bs => bs.subjectId === session.subjectId);
      if (bSub?.subjectName) return bSub.subjectName;
    }
    // Fallback
    return session.batchName || '—';
  };

In the table row:
  <td style={{ color: '#4F46E5', fontWeight: 600, fontSize: '13px' }}>
    {resolveSubjectName(session)}
  </td>

════════════════════════════════════════════════════════════════
FIX 2 — ADD FILTERS (Batch, Subject, Status)
════════════════════════════════════════════════════════════════

Step A — New filter state variables (add near the existing filter state):

  const [filterBatchId,  setFilterBatchId]  = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  // Existing: filterLecturerId, dateRange

Step B — Derive subject options based on selected batch:
  // If a batch is selected, only show its subjects; otherwise show all
  const subjectOptions = filterBatchId
    ? (() => {
        const batch = (batches || []).find(b => b.id === filterBatchId);
        return (batch?.subjects || []).map(bs => ({
          id: bs.subjectId, name: bs.subjectName
        }));
      })()
    : (subjects || []).map(s => ({ id: s.id, name: s.name }));

  // When batch filter changes, reset subject filter
  // (handle with useEffect or inline in the onChange handler)

Step C — Filter bar layout (replace / extend the existing filter bar):

  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    alignItems: 'center',
    padding: '14px 16px',
    background: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    marginBottom: '16px'
  }}>

    {/* LECTURER filter (existing — keep as-is) */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>
        Lecturer:
      </span>
      <select
        value={filterLecturerId}
        onChange={e => setFilterLecturerId(e.target.value)}
        style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px',
          border: '1px solid #E2E8F0', color: '#1A202C', cursor: 'pointer',
          background: 'white' }}>
        <option value="">All Lecturers</option>
        {(lecturers || []).map(l => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
    </div>

    {/* BATCH filter (NEW) */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>
        Batch:
      </span>
      <select
        value={filterBatchId}
        onChange={e => {
          setFilterBatchId(e.target.value);
          setFilterSubjectId(''); // reset subject when batch changes
        }}
        style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px',
          border: '1px solid #E2E8F0', color: '#1A202C', cursor: 'pointer',
          background: 'white' }}>
        <option value="">All Batches</option>
        {(batches || []).map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>

    {/* SUBJECT filter (NEW, cascades from BATCH) */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>
        Subject:
      </span>
      <select
        value={filterSubjectId}
        onChange={e => setFilterSubjectId(e.target.value)}
        disabled={subjectOptions.length === 0}
        style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px',
          border: '1px solid #E2E8F0', color: '#1A202C', cursor: 'pointer',
          background: 'white',
          opacity: subjectOptions.length === 0 ? 0.5 : 1 }}>
        <option value="">All Subjects</option>
        {subjectOptions.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>

    {/* STATUS filter (NEW) */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>
        Status:
      </span>
      <select
        value={filterStatus}
        onChange={e => setFilterStatus(e.target.value)}
        style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px',
          border: '1px solid #E2E8F0', color: '#1A202C', cursor: 'pointer',
          background: 'white' }}>
        <option value="">All Statuses</option>
        <option value="conducted">✓ Conducted</option>
        <option value="missed">✗ Missed</option>
        <option value="substituted">⇄ Substituted</option>
      </select>
    </div>

    {/* DATE RANGE pills (existing — keep as-is) */}
    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
      {['This Week', 'This Month', 'This Year', 'Custom Range'].map(range => (
        <button
          key={range}
          onClick={() => setDateRange(range)}
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: dateRange === range ? 'none' : '1px solid #E2E8F0',
            background: dateRange === range ? '#4F46E5' : 'white',
            color: dateRange === range ? 'white' : '#64748B',
            transition: 'all 0.15s ease'
          }}>
          {range}
        </button>
      ))}
    </div>

    {/* CLEAR FILTERS button — only show when any filter is active */}
    {(filterLecturerId || filterBatchId || filterSubjectId || filterStatus) && (
      <button
        onClick={() => {
          setFilterLecturerId('');
          setFilterBatchId('');
          setFilterSubjectId('');
          setFilterStatus('');
        }}
        style={{
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          border: '1px solid #FCA5A5',
          background: '#FFF5F5',
          color: '#DC2626'
        }}>
        ✕ Clear Filters
      </button>
    )}
  </div>

Step D — Apply filters to the session list:

  Find the array of sessions being displayed (likely derived from pba_timetable
  or a session log array). Apply the new filters on top of the existing
  lecturer + date range filters:

  const filteredSessions = (allSessions || []).filter(session => {
    // Existing filters
    if (filterLecturerId && session.lecturerId !== filterLecturerId) return false;
    // Date range filter (keep existing logic)

    // NEW filters
    if (filterBatchId   && session.batchId   !== filterBatchId)   return false;
    if (filterSubjectId && session.subjectId !== filterSubjectId) return false;
    if (filterStatus) {
      const sessionStatus = (session.status || '').toLowerCase();
      if (!sessionStatus.includes(filterStatus)) return false;
    }
    return true;
  });

  // Use filteredSessions for the table AND for the stats cards
  // (Scheduled, Conducted, Missed, Substituted, Attend Rate)

Step E — Update stats cards to reflect filtered results:
  The 5 stat cards (Scheduled / Conducted / Missed / Substituted / Attend Rate)
  must recompute from filteredSessions, not from allSessions:

  const scheduledCount   = filteredSessions.length;
  const conductedCount   = filteredSessions.filter(s =>
    (s.status || '').toLowerCase().includes('conducted')).length;
  const missedCount      = filteredSessions.filter(s =>
    (s.status || '').toLowerCase().includes('missed')).length;
  const substitutedCount = filteredSessions.filter(s =>
    (s.status || '').toLowerCase().includes('substituted')).length;
  const attendRate = scheduledCount > 0
    ? Math.round((conductedCount / scheduledCount) * 100)
    : 0;

════════════════════════════════════════════════════════════════
ALSO FIX — Batch name display in BATCH column
════════════════════════════════════════════════════════════════

The BATCH column currently shows "Cambridge O Level 2027" (the stored
batchName). If batchName is blank, resolve it:

  const resolveBatchName = (session) => {
    if (session.batchName) return session.batchName;
    if (session.batchId) {
      const batch = (batches || []).find(b => b.id === session.batchId);
      return batch?.name || '—';
    }
    return '—';
  };

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY LecturerManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL useState calls that read localStorage must use lazy initializer:
   useState(() => safeLS('key', []))
5. ALL array operations must guard against null:
   (array || []).filter(...), (array || []).map(...)
6. Do NOT change any other tab (Profiles, Leave Requests,
   Availability Grid, Syllabus Progress Tracker)
7. Run npm run build and confirm 0 errors
8. Then run npm run deploy to push to GitHub and trigger Vercel deployment
9. List all files modified
```
