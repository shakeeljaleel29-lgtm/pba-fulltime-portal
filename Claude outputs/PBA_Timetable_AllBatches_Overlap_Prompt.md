# PBA Full-Time Portal — Visual Timetable Builder: All Batches Overlap View
## AntiGravity Prompt

---

```
When the Visual Timetable Builder is set to "All Batches" view, sessions
from different batches that share the same day and time slot currently
overlap or show garbled text, making it impossible to read.

Fix this so that when multiple batches have sessions at the same time,
they are displayed side-by-side in clearly separated sub-columns within
that cell, each batch in its own distinct color, with a color legend
above the grid.

Touch ONLY GeneralAdminView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
WHAT THE CURRENT "ALL BATCHES" VIEW DOES WRONG
════════════════════════════════════════════════════════════════

Currently, when two batches share the same time slot on the same day:
  • Both sessions are rendered into the same cell
  • Text from each overlaps the other → garbled display
  • One session may be hidden behind the other entirely
  • There is no visual distinction between which session belongs
    to which batch

════════════════════════════════════════════════════════════════
THE FIX — Side-by-side sub-column rendering
════════════════════════════════════════════════════════════════

Each day×time cell in "All Batches" mode must:

  1. Collect ALL sessions for that day + time slot across all batches
  2. Group them by batch
  3. Render each batch's session as a narrow sub-column inside the cell
  4. Each sub-column gets the batch's assigned color (see COLOR SYSTEM)
  5. Sub-columns sit side-by-side with a 2px gap between them
  6. Each sub-column shows: batch name (top, bold, truncated) +
     subject + teacher (if any) + room (if any)

════════════════════════════════════════════════════════════════
COLOR SYSTEM — assign one color per batch deterministically
════════════════════════════════════════════════════════════════

Define a palette of 10 distinct colors. Assign colors to batches by
index (batch index in the sorted batch list mod 10):

  const BATCH_COLORS = [
    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' }, // blue
    { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' }, // orange
    { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' }, // green
    { bg: '#FDF4FF', border: '#E9D5FF', text: '#7E22CE' }, // purple
    { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' }, // amber
    { bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C' }, // rose
    { bg: '#F0FDFA', border: '#99F6E4', text: '#0F766E' }, // teal
    { bg: '#F8FAFC', border: '#CBD5E1', text: '#334155' }, // slate
    { bg: '#FFF5F5', border: '#FEB2B2', text: '#C53030' }, // red
    { bg: '#FAFAF9', border: '#D6D3D1', text: '#44403C' }, // stone
  ];

Build a batch→color lookup once when the component loads:

  const allBatches = (safeLS('pba_batches', []) || [])
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const batchColorMap = {};
  allBatches.forEach((b, i) => {
    batchColorMap[b.id] = BATCH_COLORS[i % BATCH_COLORS.length];
  });

════════════════════════════════════════════════════════════════
COLOR LEGEND — shown above the timetable grid in All Batches mode
════════════════════════════════════════════════════════════════

When the selected batch filter is "All Batches" (or equivalent),
render a legend row directly above the timetable grid:

  {isAllBatchesMode && (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '8px',
      marginBottom: '12px', padding: '10px 12px',
      background: '#F9FAFB', border: '1px solid #E5E7EB',
      borderRadius: '10px'
    }}>
      {allBatches.map(b => {
        const col = batchColorMap[b.id];
        return (
          <span key={b.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px',
            background: col.bg,
            border: `1px solid ${col.border}`,
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: col.text
          }}>
            <span style={{
              width: '8px', height: '8px',
              borderRadius: '50%',
              background: col.text,
              display: 'inline-block'
            }} />
            {b.name}
          </span>
        );
      })}
    </div>
  )}

════════════════════════════════════════════════════════════════
CELL RENDERING — the core change
════════════════════════════════════════════════════════════════

When building the timetable grid, for each day×slot cell:

STEP 1 — Collect sessions for this cell:

  // sessions for ALL batches on this day at this time:
  const cellSessions = allSessions.filter(s =>
    s.dayOfWeek === dayIndex &&
    s.startTime === slot.startTime   // or however time slots are keyed
  );

  // Group by batchId:
  const byBatch = {};
  cellSessions.forEach(s => {
    const bid = s.batchId || 'unknown';
    if (!byBatch[bid]) byBatch[bid] = [];
    byBatch[bid].push(s);
  });

  const batchIds = Object.keys(byBatch);

STEP 2 — Render sub-columns:

  <td style={{
    verticalAlign: 'top',
    padding: batchIds.length > 1 ? '4px' : '8px',
    minHeight: '60px'
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: '3px',
      height: '100%',
      minHeight: '56px'
    }}>
      {batchIds.length === 0 && (
        <span style={{ color: '#D1D5DB', fontSize: '12px' }}>—</span>
      )}
      {batchIds.map(bid => {
        const bSessions = byBatch[bid];
        const batchObj  = allBatches.find(b => b.id === bid);
        const col       = batchColorMap[bid] || BATCH_COLORS[0];
        const widthPct  = `${Math.floor(100 / batchIds.length)}%`;

        return (
          <div key={bid} style={{
            flex: `0 0 ${widthPct}`,
            background: col.bg,
            border: `1px solid ${col.border}`,
            borderRadius: '6px',
            padding: '4px 6px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: 0
          }}>
            {/* Batch name tag */}
            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              color: col.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              borderBottom: `1px solid ${col.border}`,
              paddingBottom: '2px',
              marginBottom: '2px'
            }}>
              {batchObj?.name || bid}
            </div>

            {/* Sessions in this batch for this slot */}
            {bSessions.map((sess, si) => (
              <div key={si}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: col.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {sess.subject || sess.subjectName || '(no subject)'}
                </div>
                {sess.teacherName && (
                  <div style={{
                    fontSize: '10px',
                    color: col.text,
                    opacity: 0.75,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {sess.teacherName}
                  </div>
                )}
                {(sess.room || sess.roomName || sess.classroom) && (
                  <div style={{
                    fontSize: '10px',
                    color: col.text,
                    opacity: 0.65,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    📍 {sess.room || sess.roomName || sess.classroom}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  </td>

════════════════════════════════════════════════════════════════
HEADER ROW — show overlap count badge on column headers
════════════════════════════════════════════════════════════════

For each day column header, if any slot in that day has >1 batch
session, show a small overlap indicator:

  // Count the max simultaneous sessions for this day:
  const maxOverlap = Math.max(
    ...timeSlots.map(slot =>
      allSessions.filter(s =>
        s.dayOfWeek === dayIndex && s.startTime === slot.startTime
      ).length
    ),
    1
  );

  <th style={{ ... }}>
    {dayName}
    {maxOverlap > 1 && (
      <span style={{
        marginLeft: '6px',
        fontSize: '9px',
        background: '#FEF3C7',
        color: '#92400E',
        borderRadius: '10px',
        padding: '1px 5px',
        fontWeight: 700,
        verticalAlign: 'middle'
      }}>
        {maxOverlap} batches
      </span>
    )}
  </th>

════════════════════════════════════════════════════════════════
SINGLE-BATCH VIEW — no change needed
════════════════════════════════════════════════════════════════

When the user has a specific single batch selected (not "All Batches"),
keep the existing single-session cell rendering exactly as it is.
Only apply the sub-column logic when isAllBatchesMode is true.

════════════════════════════════════════════════════════════════
DATA ACCESS
════════════════════════════════════════════════════════════════

Sessions come from pba_sessions (the recurring schedule store):

  const allSessions = (safeLS('pba_sessions', []) || []);

Each session object is expected to have at minimum:
  { batchId, dayOfWeek, startTime, endTime, subject/subjectName,
    teacherName (optional), room/roomName/classroom (optional) }

If session objects use different field names in the existing code,
use whatever field names already exist — DO NOT rename fields.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. The sub-column layout applies ONLY in All Batches mode
5. Single-batch mode: leave existing rendering untouched
6. Color palette is deterministic — same batch always gets the same
   color (based on sorted batch index)
7. Sub-columns divide the cell width equally: 2 batches → 50% each,
   3 batches → 33% each, etc.
8. Text in sub-columns should be truncated (overflow: hidden,
   textOverflow: ellipsis) — never cause the cell to overflow
9. The color legend appears above the grid, updates when batch list
   changes — read pba_batches fresh on every render
10. Run npm run build and confirm 0 errors
11. Then npm run deploy
12. List all files modified
```
