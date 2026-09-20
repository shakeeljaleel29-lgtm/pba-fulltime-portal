# PBA Full-Time Portal — Daily Allocation Sheet: Fix Empty State + Day Picker
## AntiGravity Prompt

---

```
The Daily Allocation Sheet in GeneralAdminView.jsx (Classroom Manager tab)
is showing empty rows. Two issues to fix:

(1) The sheet only shows TODAY's day — if today is Sunday and all
    sessions are Mon-Fri, it will always be blank. Add a day picker
    so admin can view any day of the week.

(2) The session filter may be too strict. Sessions in pba_timetable
    may not have classroomId yet. Show ALL sessions for the day,
    even those without a classroom assigned.

(3) Add a proper empty state message instead of blank rows.

Touch ONLY GeneralAdminView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
FIX 1 — ADD a day picker above the allocation table
════════════════════════════════════════════════════════════════

Add state for the selected day (defaults to today):

  const todayDayName = new Date().toLocaleDateString('en-US', {
    weekday: 'long'
  }); // e.g. 'Sunday'

  const [allocDay, setAllocDay] = useState(todayDayName);

Replace the static "Daily Allocation Sheet (Sunday)" heading with:

  <div style={{
    display: 'flex', alignItems: 'center', gap: '16px',
    marginBottom: '16px', flexWrap: 'wrap'
  }}>
    <div>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800,
        color: '#1A202C' }}>
        Daily Allocation Sheet
      </h3>
      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
        Classroom usage schedule for the selected day
      </p>
    </div>

    {/* Day picker */}
    <select
      value={allocDay}
      onChange={e => setAllocDay(e.target.value)}
      style={{
        padding: '8px 14px', borderRadius: '8px',
        border: '1px solid #E3E6EA', fontSize: '13px',
        fontWeight: 700, background: 'white', color: '#1A202C',
        cursor: 'pointer'
      }}>
      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
        .map(d => (
          <option key={d} value={d}>
            {d}{d === todayDayName ? ' (Today)' : ''}
          </option>
        ))}
    </select>

    {/* WhatsApp share button — keep existing if already present */}
    <button
      onClick={() => {
        const rows = allocSessions.map(s =>
          `${s.startTime || ''}–${s.endTime || ''} | ${s.classroomName || '— Not set —'} | ${s.batchName || ''} | ${s.subjectName || ''} | ${s.lecturerName || ''}`
        ).join('\n');
        const text = `📋 Daily Allocation Sheet — ${allocDay}\n\n` +
          (rows || 'No sessions scheduled.') +
          `\n\nPBA Full-Time Portal`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }}
      style={{
        padding: '8px 16px', borderRadius: '8px',
        background: '#25D366', border: 'none', color: 'white',
        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
        marginLeft: 'auto'
      }}>
      📤 Share via WhatsApp
    </button>
  </div>

════════════════════════════════════════════════════════════════
FIX 2 — FIX the session filter for allocSessions
════════════════════════════════════════════════════════════════

Replace whatever filter currently computes the allocation rows.
Use `allocDay` (the picker state) instead of a hardcoded today value.
Do NOT require classroomId — show all sessions for the day:

  const allocSessions = (() => {
    const timetable = safeLS('pba_timetable', []);
    return (timetable || [])
      .filter(s => s.day === allocDay)
      .sort((a, b) => {
        // Sort by startTime ascending
        const ta = (a.startTime || '00:00').replace(':', '');
        const tb = (b.startTime || '00:00').replace(':', '');
        return Number(ta) - Number(tb);
      });
  })();

Place this INSIDE the component (not at module level) so it
re-computes whenever allocDay state changes.

════════════════════════════════════════════════════════════════
FIX 3 — RENDER the table with proper empty state
════════════════════════════════════════════════════════════════

Replace the allocation table render with:

  <div style={{ overflowX: 'auto' }}>
    <table style={{
      width: '100%', borderCollapse: 'collapse',
      fontSize: '13px'
    }}>
      <thead>
        <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E3E6EA' }}>
          {['TIME', 'CLASSROOM', 'BATCH', 'SUBJECT', 'LECTURER'].map(col => (
            <th key={col} style={{
              padding: '10px 14px', textAlign: 'left',
              fontSize: '11px', fontWeight: 700, color: '#6B7280',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {allocSessions.length === 0 ? (
          <tr>
            <td colSpan={5} style={{
              padding: '40px', textAlign: 'center',
              color: '#9CA3AF', fontSize: '13px'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                No sessions scheduled for {allocDay}
              </div>
              <div style={{ fontSize: '12px' }}>
                Sessions are added via the Visual Timetable Builder.
              </div>
            </td>
          </tr>
        ) : (
          allocSessions.map((s, i) => (
            <tr key={s.id || i} style={{
              borderBottom: '1px solid #F3F4F6',
              background: i % 2 === 0 ? 'white' : '#FAFAFA'
            }}>
              <td style={{ padding: '10px 14px', fontWeight: 600,
                color: '#1A202C', whiteSpace: 'nowrap' }}>
                {s.startTime || '—'}{s.endTime ? `–${s.endTime}` : ''}
              </td>
              <td style={{ padding: '10px 14px', color: '#374151' }}>
                {s.classroomName || (
                  <span style={{ color: '#D97706', fontSize: '11px',
                    fontStyle: 'italic' }}>
                    — Not set
                  </span>
                )}
              </td>
              <td style={{ padding: '10px 14px', color: '#374151' }}>
                {s.batchName || '—'}
              </td>
              <td style={{ padding: '10px 14px', color: '#374151' }}>
                {s.subjectName || (
                  <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                    — No subject
                  </span>
                )}
              </td>
              <td style={{ padding: '10px 14px', color: '#374151' }}>
                {s.lecturerName || '—'}
                {(s.assistants || []).length > 0 && (
                  <div style={{ fontSize: '11px', color: '#6B7280',
                    marginTop: '2px' }}>
                    + {(s.assistants || []).map(a => a.lecturerName).join(', ')}
                  </div>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads
4. allocSessions must be computed INSIDE the component so it
   reacts to allocDay state changes
5. The day picker defaults to today (todayDayName) so the
   behaviour on load is identical to before — just now the
   admin can change it
6. Sessions WITHOUT a classroomId still appear — the CLASSROOM
   column shows "— Not set" in amber so admin knows to assign one
7. Run npm run build and confirm 0 errors
8. Then npm run deploy to push to GitHub and trigger Vercel
9. List all files modified
```
