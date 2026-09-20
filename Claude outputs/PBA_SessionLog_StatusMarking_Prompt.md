# PBA Full-Time Portal — Session Log: Timetable-Driven Status Marking
## AntiGravity Prompt

---

```
Fix the Session Log tab in LecturerManagementView.jsx so it reads
sessions directly from pba_timetable, shows each past session with
one-click status marking (Conducted / Missed / Substituted), and
auto-flags sessions where the lecturer has an approved leave.

Touch ONLY LecturerManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
HOW IT WORKS
════════════════════════════════════════════════════════════════

SOURCE OF TRUTH: pba_timetable
  Every scheduled class is already a record in pba_timetable with
  the lecturer, batch, subject, date, day, startTime, endTime.
  The Session Log reads from pba_timetable — it does NOT maintain
  a separate session log table.

STATUS FIELD on each pba_timetable record:
  'Scheduled'   ← default when session is first created
  'Conducted'   ← admin/lecturer marks it done
  'Missed'      ← lecturer did not show up
  'Substituted' ← another lecturer covered it
  'Cancelled'   ← class cancelled (holiday, etc.)

MARKING: When admin clicks a status button on a session row,
  update that session's status in pba_timetable and save back
  to localStorage via saveLS('pba_timetable', updatedList).

STATS: Computed from the FILTERED session list (same filters
  the table uses — lecturer, batch, subject, date range, status).

════════════════════════════════════════════════════════════════
STATE TO ADD / REPLACE IN THE COMPONENT
════════════════════════════════════════════════════════════════

  // Source data — read fresh on mount and after any status update
  const [timetable, setTimetable] = useState(
    () => safeLS('pba_timetable', [])
  );
  const [leaveRequests, setLeaveRequests] = useState(
    () => safeLS('pba_leave_requests', [])
  );

  useEffect(() => {
    setTimetable(safeLS('pba_timetable', []));
    setLeaveRequests(safeLS('pba_leave_requests', []));
  }, []);

  // Session Log filter state (keep existing filter state if already present;
  // otherwise initialise as below)
  const [logLecturerId, setLogLecturerId] = useState('');
  const [logBatchId, setLogBatchId] = useState('');
  const [logSubjectId, setLogSubjectId] = useState('');
  const [logStatus, setLogStatus] = useState('');       // '' = All Statuses
  const [logRange, setLogRange] = useState('month');    // 'week'|'month'|'year'|'custom'
  const [logCustomStart, setLogCustomStart] = useState('');
  const [logCustomEnd, setLogCustomEnd] = useState('');
  const [logIncludeUpcoming, setLogIncludeUpcoming] = useState(false);

  // Toast for status save confirmation
  const [statusToast, setStatusToast] = useState('');  // '' | 'Conducted' | 'Missed' etc.

════════════════════════════════════════════════════════════════
HELPER — DATE RANGE
════════════════════════════════════════════════════════════════

  const getLogDateRange = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let start, end;
    if (logRange === 'week') {
      const dow = today.getDay();
      start = new Date(today);
      start.setDate(start.getDate() - dow);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (logRange === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (logRange === 'year') {
      start = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (logRange === 'custom' && logCustomStart && logCustomEnd) {
      start = new Date(logCustomStart + 'T00:00:00');
      end = new Date(logCustomEnd + 'T23:59:59');
    } else {
      // Default: current month
      start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    return { start, end };
  };

════════════════════════════════════════════════════════════════
HELPER — APPROVED LEAVE ON A DATE
════════════════════════════════════════════════════════════════

  // Returns true if the lecturer has an approved leave that covers sessionDate
  const hasApprovedLeave = (lecturerId, sessionDate) => {
    if (!lecturerId || !sessionDate) return false;
    const sDate = new Date(sessionDate + 'T12:00:00');
    return (leaveRequests || []).some(lr => {
      if (lr.lecturerId !== lecturerId) return false;
      if (lr.status !== 'Approved') return false;
      const from = new Date((lr.fromDate || lr.startDate || '') + 'T00:00:00');
      const to   = new Date((lr.toDate   || lr.endDate   || lr.fromDate || lr.startDate || '') + 'T23:59:59');
      return sDate >= from && sDate <= to;
    });
  };

════════════════════════════════════════════════════════════════
FILTERED SESSION LIST (computed at render time — no useMemo needed)
════════════════════════════════════════════════════════════════

  const { start: rangeStart, end: rangeEnd } = getLogDateRange();
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const filteredSessions = (timetable || []).filter(s => {
    // Lecturer filter
    if (logLecturerId && s.lecturerId !== logLecturerId) return false;
    // Batch filter
    if (logBatchId && s.batchId !== logBatchId) return false;
    // Subject filter
    if (logSubjectId && s.subjectId !== logSubjectId) return false;
    // Status filter
    if (logStatus && (s.status || 'Scheduled') !== logStatus) return false;
    // Date range
    const sDate = new Date((s.date || '') + 'T12:00:00');
    if (sDate < rangeStart || sDate > rangeEnd) return false;
    // Exclude future sessions unless "Include upcoming" is checked
    if (!logIncludeUpcoming && sDate > today) return false;
    return true;
  }).sort((a, b) => {
    // Sort descending by date (most recent first)
    const dA = new Date((a.date || '') + 'T12:00:00');
    const dB = new Date((b.date || '') + 'T12:00:00');
    return dB - dA;
  });

  // Stat counts (computed from filteredSessions — ignore extra status filter for counts)
  const allInRange = (timetable || []).filter(s => {
    if (logLecturerId && s.lecturerId !== logLecturerId) return false;
    if (logBatchId && s.batchId !== logBatchId) return false;
    if (logSubjectId && s.subjectId !== logSubjectId) return false;
    const sDate = new Date((s.date || '') + 'T12:00:00');
    if (sDate < rangeStart || sDate > rangeEnd) return false;
    if (!logIncludeUpcoming && sDate > today) return false;
    return true;
  });

  const scheduledCount   = (allInRange || []).filter(s =>
    !s.status || s.status === 'Scheduled').length;
  const conductedCount   = (allInRange || []).filter(s => s.status === 'Conducted').length;
  const missedCount      = (allInRange || []).filter(s => s.status === 'Missed').length;
  const substitutedCount = (allInRange || []).filter(s => s.status === 'Substituted').length;
  const extraCount       = (allInRange || []).filter(s => s.isExtra).length;
  const totalDone        = conductedCount + substitutedCount;
  const totalMarkable    = conductedCount + missedCount + substitutedCount;
  const attendRate       = totalMarkable > 0
    ? Math.round((totalDone / totalMarkable) * 100) : 0;

════════════════════════════════════════════════════════════════
STATUS UPDATE HANDLER
════════════════════════════════════════════════════════════════

  const markSessionStatus = (sessionId, newStatus) => {
    const updated = (timetable || []).map(s =>
      s.id === sessionId ? { ...s, status: newStatus } : s
    );
    saveLS('pba_timetable', updated);
    setTimetable(updated);

    // Brief toast confirmation
    setStatusToast(newStatus);
    setTimeout(() => setStatusToast(''), 2500);
  };

════════════════════════════════════════════════════════════════
SESSION LOG TAB JSX — FULL REPLACEMENT
════════════════════════════════════════════════════════════════

Replace the entire Session Log tab content with the following.
Keep the existing tab navigation unchanged — only the CONTENT
of the Session Log tab is replaced.

─────────────────────────────────────────────
SECTION HEADER ROW
─────────────────────────────────────────────

  <div style={{ display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: '18px' }}>
    <div style={{ fontWeight: 800, fontSize: '18px', color: '#1A202C' }}>
      📋 Session Log & Attendance History
    </div>
    <button
      onClick={() => {
        // CSV download of filteredSessions
        const headers = ['Date','Day','Subject','Batch','Lecturer',
          'Start','End','Status','Extra','Leave Flag'];
        const rows = (filteredSessions || []).map(s => [
          s.date || '',
          s.day || '',
          s.subjectName || s.subjectCode || '—',
          s.batchName || '—',
          s.lecturerName || '—',
          s.startTime || '',
          s.endTime || '',
          s.status || 'Scheduled',
          s.isExtra ? 'Yes' : 'No',
          hasApprovedLeave(s.lecturerId, s.date) ? 'Leave Approved' : ''
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session_log_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }}
      style={{ padding: '8px 18px', borderRadius: '8px',
        background: '#D97706', border: 'none', color: 'white',
        fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
      ↓ Download CSV
    </button>
  </div>

─────────────────────────────────────────────
FILTER BAR
─────────────────────────────────────────────

  <div style={{ background: '#F8F9FB', border: '1px solid #E3E6EA',
    borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>

    {/* Row 1: Dropdowns */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px',
      alignItems: 'center', marginBottom: '12px' }}>

      {/* LECTURER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
          Lecturer:
        </label>
        <select
          value={logLecturerId}
          onChange={e => setLogLecturerId(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: '8px',
            border: '1px solid #E3E6EA', fontSize: '13px',
            background: 'white', minWidth: '160px' }}>
          <option value="">All Lecturers</option>
          {(lecturers || []).map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* BATCH */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
          Batch:
        </label>
        <select
          value={logBatchId}
          onChange={e => setLogBatchId(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: '8px',
            border: '1px solid #E3E6EA', fontSize: '13px',
            background: 'white', minWidth: '160px' }}>
          <option value="">All Batches</option>
          {(batches || []).map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* SUBJECT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
          Subject:
        </label>
        <select
          value={logSubjectId}
          onChange={e => setLogSubjectId(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: '8px',
            border: '1px solid #E3E6EA', fontSize: '13px',
            background: 'white', minWidth: '150px' }}>
          <option value="">All Subjects</option>
          {/* Derive unique subjects from timetable */}
          {[...new Map((timetable || [])
            .filter(s => !logLecturerId || s.lecturerId === logLecturerId)
            .filter(s => !logBatchId || s.batchId === logBatchId)
            .filter(s => s.subjectId)
            .map(s => [s.subjectId, s])
          ).values()].map(s => (
            <option key={s.subjectId} value={s.subjectId}>
              {s.subjectName || s.subjectCode || s.subjectId}
            </option>
          ))}
        </select>
      </div>

      {/* STATUS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
          Status:
        </label>
        <select
          value={logStatus}
          onChange={e => setLogStatus(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: '8px',
            border: '1px solid #E3E6EA', fontSize: '13px',
            background: 'white', minWidth: '140px' }}>
          <option value="">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Conducted">Conducted</option>
          <option value="Missed">Missed</option>
          <option value="Substituted">Substituted</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    {/* Row 2: Date range buttons */}
    <div style={{ display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {['week', 'month', 'year', 'custom'].map(range => (
          <button key={range}
            onClick={() => setLogRange(range)}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
              fontWeight: 700, cursor: 'pointer', border: 'none',
              background: logRange === range ? '#4F46E5' : '#E9ECF0',
              color: logRange === range ? 'white' : '#374151'
            }}>
            {range === 'week' ? 'This Week'
              : range === 'month' ? 'This Month'
              : range === 'year' ? 'This Year'
              : 'Custom Range'}
          </button>
        ))}

        {/* Clear filters */}
        <button
          onClick={() => {
            setLogLecturerId(''); setLogBatchId('');
            setLogSubjectId(''); setLogStatus('');
            setLogRange('month'); setLogCustomStart('');
            setLogCustomEnd(''); setLogIncludeUpcoming(false);
          }}
          style={{ padding: '6px 14px', borderRadius: '20px',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            border: '1px solid #FCA5A5', background: '#FFF5F5',
            color: '#DC2626' }}>
          × Clear Filters
        </button>
      </div>

      {/* Include upcoming toggle */}
      <label style={{ display: 'flex', alignItems: 'center',
        gap: '6px', cursor: 'pointer', fontSize: '12px',
        fontWeight: 600, color: '#374151' }}>
        <input type="checkbox"
          checked={logIncludeUpcoming}
          onChange={e => setLogIncludeUpcoming(e.target.checked)}
        />
        Include upcoming
      </label>
    </div>

    {/* Custom date range inputs */}
    {logRange === 'custom' && (
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center',
        marginTop: '10px' }}>
        <input type="date" value={logCustomStart}
          onChange={e => setLogCustomStart(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: '8px',
            border: '1px solid #E3E6EA', fontSize: '13px' }}
        />
        <span style={{ color: '#9CA3AF' }}>→</span>
        <input type="date" value={logCustomEnd}
          onChange={e => setLogCustomEnd(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: '8px',
            border: '1px solid #E3E6EA', fontSize: '13px' }}
        />
      </div>
    )}
  </div>

─────────────────────────────────────────────
STAT CARDS ROW (6 cards)
─────────────────────────────────────────────

  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap',
    marginBottom: '20px' }}>

    {/* Scheduled */}
    <div style={{ background: 'white', border: '1px solid #E3E6EA',
      borderRadius: '12px', padding: '16px 20px',
      textAlign: 'center', flex: '1 1 100px' }}>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#4F46E5' }}>
        {scheduledCount}
      </div>
      <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
        Scheduled
      </div>
    </div>

    {/* Conducted */}
    <div style={{ background: 'white', border: '1px solid #E3E6EA',
      borderRadius: '12px', padding: '16px 20px',
      textAlign: 'center', flex: '1 1 100px' }}>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#059669' }}>
        {conductedCount}
      </div>
      <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
        Conducted
      </div>
    </div>

    {/* Missed */}
    <div style={{ background: 'white', border: '1px solid #E3E6EA',
      borderRadius: '12px', padding: '16px 20px',
      textAlign: 'center', flex: '1 1 100px' }}>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#DC2626' }}>
        {missedCount}
      </div>
      <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
        Missed
      </div>
    </div>

    {/* Substituted */}
    <div style={{ background: 'white', border: '1px solid #E3E6EA',
      borderRadius: '12px', padding: '16px 20px',
      textAlign: 'center', flex: '1 1 100px' }}>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#7C3AED' }}>
        {substitutedCount}
      </div>
      <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
        Substituted
      </div>
    </div>

    {/* Attend Rate */}
    <div style={{ background: 'white', border: '1px solid #E3E6EA',
      borderRadius: '12px', padding: '16px 20px',
      textAlign: 'center', flex: '1 1 100px' }}>
      <div style={{ fontSize: '28px', fontWeight: 900,
        color: attendRate >= 80 ? '#059669'
          : attendRate >= 60 ? '#D97706' : '#DC2626' }}>
        {attendRate}%
      </div>
      <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
        Attend Rate
      </div>
    </div>

    {/* Extra Classes */}
    <div style={{
      background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      border: '1px solid #FDE68A', borderRadius: '12px',
      padding: '16px 20px', textAlign: 'center', flex: '1 1 100px'
    }}>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#D97706' }}>
        {extraCount}
      </div>
      <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
        ⚡ Extra Classes
      </div>
      <div style={{ fontSize: '10px', color: '#B45309', marginTop: '2px' }}>
        above weekly limit
      </div>
    </div>
  </div>

─────────────────────────────────────────────
SESSION TABLE
─────────────────────────────────────────────

  {filteredSessions.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '48px 24px',
      color: '#9CA3AF', fontSize: '14px', fontStyle: 'italic',
      border: '1px dashed #E3E6EA', borderRadius: '12px' }}>
      No session logs found for the selected filter and period.
      <div style={{ fontSize: '12px', marginTop: '8px', color: '#B0B7C3' }}>
        Sessions appear here once they are scheduled in the Timetable.
      </div>
    </div>
  ) : (
    <div style={{ border: '1px solid #E3E6EA', borderRadius: '12px',
      overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F8F9FB', borderBottom: '2px solid #E3E6EA' }}>
            {['DATE', 'DAY', 'SUBJECT', 'BATCH', 'LECTURER',
              'TIME', 'STATUS', 'MARK AS'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left',
                fontSize: '10px', fontWeight: 800, color: '#6B7280',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(filteredSessions || []).map((session, idx) => {
            const sessionDate = new Date((session.date || '') + 'T12:00:00');
            const isPast = sessionDate <= new Date();
            const leaveFlag = hasApprovedLeave(session.lecturerId, session.date);
            const currentStatus = session.status || 'Scheduled';

            // Row background based on status
            const rowBg = currentStatus === 'Conducted' ? '#F0FDF4'
              : currentStatus === 'Missed'      ? '#FFF5F5'
              : currentStatus === 'Substituted' ? '#F5F3FF'
              : currentStatus === 'Cancelled'   ? '#F9FAFB'
              : leaveFlag                        ? '#FFFBEB'
              : 'white';

            return (
              <tr key={session.id}
                style={{
                  borderBottom: '1px solid #F1F5F9',
                  background: idx % 2 === 0 ? rowBg
                    : rowBg === 'white' ? '#FAFAFA' : rowBg
                }}>

                {/* DATE */}
                <td style={{ padding: '10px 12px', fontSize: '13px',
                  fontWeight: 600, color: '#1A202C', whiteSpace: 'nowrap' }}>
                  {session.date || '—'}
                </td>

                {/* DAY */}
                <td style={{ padding: '10px 12px', fontSize: '12px',
                  color: '#6B7280', whiteSpace: 'nowrap' }}>
                  {session.day || '—'}
                </td>

                {/* SUBJECT */}
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700,
                    color: '#1A202C' }}>
                    {session.subjectName || session.subjectCode || '—'}
                  </div>
                  {session.isExtra && (
                    <span style={{
                      display: 'inline-block', marginTop: '3px',
                      padding: '2px 7px', borderRadius: '10px',
                      background: '#FEF3C7', border: '1px solid #F59E0B',
                      color: '#92400E', fontSize: '10px', fontWeight: 800
                    }}>
                      ⚡ EXTRA
                    </span>
                  )}
                </td>

                {/* BATCH */}
                <td style={{ padding: '10px 12px', fontSize: '12px',
                  color: '#374151' }}>
                  {session.batchName || '—'}
                </td>

                {/* LECTURER */}
                <td style={{ padding: '10px 12px', fontSize: '12px',
                  color: '#374151', whiteSpace: 'nowrap' }}>
                  {session.lecturerName || '—'}
                  {leaveFlag && (
                    <div style={{ fontSize: '10px', color: '#D97706',
                      fontWeight: 700, marginTop: '2px' }}>
                      ⚠ Leave Approved
                    </div>
                  )}
                </td>

                {/* TIME */}
                <td style={{ padding: '10px 12px', fontSize: '12px',
                  color: '#374151', whiteSpace: 'nowrap' }}>
                  {session.startTime && session.endTime
                    ? `${session.startTime}–${session.endTime}`
                    : '—'}
                </td>

                {/* STATUS chip */}
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    display: 'inline-block', padding: '4px 10px',
                    borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                    whiteSpace: 'nowrap',
                    background:
                      currentStatus === 'Conducted'   ? '#D1FAE5'
                      : currentStatus === 'Missed'    ? '#FEE2E2'
                      : currentStatus === 'Substituted' ? '#EDE9FE'
                      : currentStatus === 'Cancelled' ? '#F3F4F6'
                      : leaveFlag                     ? '#FEF3C7'
                      : '#EEF2FF',
                    color:
                      currentStatus === 'Conducted'   ? '#065F46'
                      : currentStatus === 'Missed'    ? '#991B1B'
                      : currentStatus === 'Substituted' ? '#5B21B6'
                      : currentStatus === 'Cancelled' ? '#6B7280'
                      : leaveFlag                     ? '#92400E'
                      : '#3730A3'
                  }}>
                    {currentStatus === 'Scheduled' && leaveFlag
                      ? '⚠ Pending'
                      : currentStatus === 'Conducted'   ? '✓ Conducted'
                      : currentStatus === 'Missed'      ? '✗ Missed'
                      : currentStatus === 'Substituted' ? '↔ Substituted'
                      : currentStatus === 'Cancelled'   ? '— Cancelled'
                      : '● Scheduled'}
                  </span>
                </td>

                {/* MARK AS buttons — only for past sessions */}
                <td style={{ padding: '10px 12px' }}>
                  {isPast ? (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => markSessionStatus(session.id, 'Conducted')}
                        style={{
                          padding: '4px 9px', borderRadius: '6px', fontSize: '11px',
                          fontWeight: 700, cursor: 'pointer', border: 'none',
                          background: currentStatus === 'Conducted'
                            ? '#059669' : '#D1FAE5',
                          color: currentStatus === 'Conducted' ? 'white' : '#065F46'
                        }}>
                        ✓
                      </button>
                      <button
                        onClick={() => markSessionStatus(session.id, 'Missed')}
                        style={{
                          padding: '4px 9px', borderRadius: '6px', fontSize: '11px',
                          fontWeight: 700, cursor: 'pointer', border: 'none',
                          background: currentStatus === 'Missed'
                            ? '#DC2626' : '#FEE2E2',
                          color: currentStatus === 'Missed' ? 'white' : '#991B1B'
                        }}>
                        ✗
                      </button>
                      <button
                        onClick={() => markSessionStatus(session.id, 'Substituted')}
                        style={{
                          padding: '4px 9px', borderRadius: '6px', fontSize: '11px',
                          fontWeight: 700, cursor: 'pointer', border: 'none',
                          background: currentStatus === 'Substituted'
                            ? '#7C3AED' : '#EDE9FE',
                          color: currentStatus === 'Substituted' ? 'white' : '#5B21B6'
                        }}>
                        ↔
      </button>
                      <button
                        onClick={() => markSessionStatus(session.id, 'Cancelled')}
                        style={{
                          padding: '4px 9px', borderRadius: '6px', fontSize: '11px',
                          fontWeight: 700, cursor: 'pointer', border: 'none',
                          background: currentStatus === 'Cancelled'
                            ? '#6B7280' : '#F3F4F6',
                          color: currentStatus === 'Cancelled' ? 'white' : '#374151'
                        }}>
                        —
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#9CA3AF',
                      fontStyle: 'italic' }}>upcoming</span>
                  )}
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}

─────────────────────────────────────────────
STATUS SAVE TOAST (render outside the tab panel, fixed position)
─────────────────────────────────────────────

  {statusToast && (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      borderRadius: '12px', padding: '14px 18px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      background:
        statusToast === 'Conducted'   ? '#D1FAE5'
        : statusToast === 'Missed'    ? '#FEE2E2'
        : statusToast === 'Substituted' ? '#EDE9FE'
        : '#F3F4F6',
      border: `1px solid ${
        statusToast === 'Conducted'   ? '#6EE7B7'
        : statusToast === 'Missed'    ? '#FCA5A5'
        : statusToast === 'Substituted' ? '#C4B5FD'
        : '#E5E7EB'}`
    }}>
      <div style={{ fontWeight: 800, fontSize: '13px',
        color:
          statusToast === 'Conducted'   ? '#065F46'
          : statusToast === 'Missed'    ? '#991B1B'
          : statusToast === 'Substituted' ? '#5B21B6'
          : '#374151' }}>
        {statusToast === 'Conducted'   ? '✓ Marked as Conducted'
          : statusToast === 'Missed'    ? '✗ Marked as Missed'
          : statusToast === 'Substituted' ? '↔ Marked as Substituted'
          : '— Marked as Cancelled'}
      </div>
      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px' }}>
        Saved to timetable
      </div>
    </div>
  )}

════════════════════════════════════════════════════════════════
MARK AS BUTTON LEGEND (render below the table)
════════════════════════════════════════════════════════════════

  <div style={{ marginTop: '12px', display: 'flex', gap: '16px',
    flexWrap: 'wrap', fontSize: '11px', color: '#6B7280' }}>
    <span><strong style={{ color: '#059669' }}>✓</strong> = Conducted</span>
    <span><strong style={{ color: '#DC2626' }}>✗</strong> = Missed</span>
    <span><strong style={{ color: '#7C3AED' }}>↔</strong> = Substituted</span>
    <span><strong style={{ color: '#6B7280' }}>—</strong> = Cancelled</span>
    <span style={{ color: '#D97706' }}>⚠ Leave Approved = lecturer had approved leave on this date</span>
    <span style={{ color: '#92400E' }}>⚡ EXTRA = session exceeded weekly class limit</span>
  </div>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1.  Touch ONLY LecturerManagementView.jsx
2.  Use only inline style={{}} — no Tailwind
3.  safeLS() for ALL localStorage reads; saveLS() for writes
4.  ALL useState calls that read localStorage MUST use lazy initializer:
    useState(() => safeLS('key', []))
5.  ALL array operations must guard against null:
    (array || []).filter(...), (array || []).map(...)
6.  The Session Log reads from pba_timetable — it does NOT have its
    own separate log table. Every scheduled session IS a log entry.
7.  markSessionStatus() updates the session's status field in
    pba_timetable and re-reads with setTimetable(updated).
    It does NOT write to any other key.
8.  Past sessions = session.date < today (allow marking).
    Future sessions = session.date >= today (show "upcoming", no buttons).
9.  "Include upcoming" checkbox includes future sessions in the table
    (they show "upcoming" in the Mark As column — no buttons).
10. hasApprovedLeave() checks pba_leave_requests for Approved leaves
    that overlap the session's date. Try both fromDate/toDate AND
    startDate/endDate field names for backward compat.
11. The ⚠ Leave Approved flag is DISPLAY ONLY — it does not auto-change
    the status. Admin still clicks a button to set Missed/Substituted.
12. Attend Rate = (Conducted + Substituted) / (Conducted + Missed + Substituted)
    Scheduled-only sessions that haven't been marked yet do NOT count
    toward the rate denominator — this keeps the rate accurate.
13. The EXTRA badge (⚡ EXTRA) reads session.isExtra from pba_timetable.
    It was set when the session was originally saved (by the extra-class
    detection in GeneralAdminView.jsx). This tab is display-only for it.
14. CSV download exports the current filteredSessions with all columns.
15. Row background: green tint = Conducted, red tint = Missed,
    purple tint = Substituted, amber tint = leave-flagged, grey = Cancelled.
16. The active Mark As button (matching current status) renders with a
    filled/solid background to show which status is currently set.
17. Run npm run build and confirm 0 errors
18. Then npm run deploy to push to GitHub and trigger Vercel deployment
19. List all files modified
```
