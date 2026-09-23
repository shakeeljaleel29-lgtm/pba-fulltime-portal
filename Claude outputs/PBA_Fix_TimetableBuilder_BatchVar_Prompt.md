# PBA Full-Time Portal — Fix: Timetable Builder "Can't find variable: batch"
## AntiGravity Prompt

---

```
The Visual Timetable Builder shows the try/catch fallback:
  "Timetable could not render — Can't find variable: batch"

This is a ReferenceError: the variable `batch` is used somewhere
in the timetable render but was never declared in that scope.
It was introduced by the recent All-Batches sub-column changes.

Touch ONLY VisualTimetableBuilder.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
ROOT CAUSE
════════════════════════════════════════════════════════════════

The new All-Batches rendering code contains a pattern like this:

  allBatches.sort(...).forEach((batch, i) => {
    batchColorMap[batch.id] = BATCH_COLORS[i % 10];
  });

  // ... later, inside the grid cell render:
  const color = batchColorMap[batch.id];   // ← ReferenceError!
  // `batch` is the forEach parameter — it is OUT OF SCOPE here

OR the sub-column render loop uses `batch` as a variable name
when the outer loop variable is actually named `batchId`:

  batchIds.forEach(batchId => {
    const color = batchColorMap[batch.id];  // should be batchId
  });

════════════════════════════════════════════════════════════════
THE FIX — audit every reference to `batch` and fix scope
════════════════════════════════════════════════════════════════

Search the entire VisualTimetableBuilder.jsx for every occurrence
of the identifier `batch` (standalone — not `allBatches`, not
`activeBatchId`, not `batchId`, not `batchIds`, not `batchColor`).

For each occurrence, apply the correct fix:

  CASE 1 — Inside batchColorMap initialization forEach:
    allBatches.forEach((batch, i) => {
      batchColorMap[batch.id] = ...    // ✓ CORRECT — batch is
    });                                //   the forEach parameter

  CASE 2 — Inside cell render, after groupByBatch():
    The loop variable is batchId (a string key), NOT batch (an object).
    To get the batch object: const batch = allBatches.find(b => b.id === batchId);

    WRONG:
      batchIds.forEach(batchId => {
        const color = batchColorMap[batch.id];   // batch is undefined here
      });

    RIGHT:
      batchIds.forEach(batchId => {
        const color = batchColorMap[batchId] || '#6366F1';
      });

  CASE 3 — Anywhere `batch.name` or `batch.color` is used inside
    the cell render without a local `batch` declaration:

    WRONG:
      <div>{batch.name}</div>

    RIGHT:
      const batchObj = allBatches.find(b => b.id === batchId) || {};
      <div>{batchObj.name || batchId}</div>

════════════════════════════════════════════════════════════════
COMPLETE SAFE PATTERN — sub-column cell render
════════════════════════════════════════════════════════════════

Replace the entire sub-column rendering section with this
safe, self-contained pattern:

  {/* --- All-Batches sub-column cell --- */}
  {activeBatchId === 'all' ? (() => {
    const cellSessions = getSessionsForCell(day, slot);
    const grouped = groupByBatch(cellSessions);
    const batchIds = Object.keys(grouped);

    if (batchIds.length === 0) return null;

    return (
      <div style={{ display: 'flex', gap: '2px', height: '100%' }}>
        {batchIds.map(batchId => {
          // ← declare batchObj locally so `batch` is never used out of scope
          const batchObj = (allBatches || []).find(b => b?.id === batchId) || {};
          const batchColor = batchColorMap?.[batchId] || '#6366F1';
          const batchSessions = grouped[batchId] || [];

          return (
            <div
              key={batchId}
              style={{
                flex: `0 0 ${Math.floor(100 / batchIds.length)}%`,
                background: batchColor + '20',
                borderLeft: `3px solid ${batchColor}`,
                borderRadius: '4px',
                padding: '4px',
                overflow: 'hidden',
                minWidth: 0
              }}
            >
              {/* Batch name tag */}
              <div style={{
                fontSize: '9px', fontWeight: 700,
                color: batchColor, marginBottom: '3px',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {batchObj.name || batchId}
              </div>

              {/* Sessions in this batch for this cell */}
              {batchSessions.map((sess, si) => {
                const isMismatch = getSessionMismatch(sess);
                return (
                  <div key={si} style={{ marginBottom: '2px' }}>
                    <div style={{
                      fontSize: '10px', fontWeight: 600, color: '#1F2937',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {sess?.subject || '—'}
                    </div>
                    <div style={{
                      fontSize: '9px', color: '#6B7280',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {sess?.lecturerName || ''}
                    </div>
                    {isMismatch && (
                      <span style={{
                        fontSize: '9px', background: '#FEF3C7',
                        color: '#92400E', border: '1px solid #FDE68A',
                        borderRadius: '3px', padding: '0 3px'
                      }}>⚠ Mismatch</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  })() : (
    /* --- Single-batch cell (unchanged) --- */
    <div>
      {/* existing single-batch cell render */}
    </div>
  )}

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY VisualTimetableBuilder.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. The fix is: NEVER use a bare `batch` variable unless it has
   been declared with const/let in the SAME block scope
5. In the batchColorMap, access by batchId (the string key):
   batchColorMap[batchId]  ← correct
   batchColorMap[batch.id] ← crash (batch is not in scope)
6. getSessionMismatch() already wraps in try/catch — call it
   safely: getSessionMismatch(sess) returns false on any error
7. Keep allBatches, batchColorMap, and BATCH_COLORS defined at
   the top of the component (not inside a forEach callback)
8. Run npm run build and confirm 0 errors
9. Then npm run deploy
10. List all files modified
```
