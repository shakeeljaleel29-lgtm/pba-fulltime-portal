# PBA Full-Time Portal — Fix: Calendar Grid Multi-Source Merge & Legend Deduplication
## AntiGravity Prompt

---

```
The Academic Calendar has four bugs that share one root cause — the
calendar grid only reads from pba_calendar_events, while the Upcoming
Events sidebar also reads from pba_exams and fee stores. This means
exams and fee due dates appear in the sidebar but NOT as coloured dots
on the grid. The legend also shows duplicate entries because event type
strings are not deduplicated before rendering.

Touch ONLY CalendarView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
BUG SUMMARY
════════════════════════════════════════════════════════════════

  1. Exam dates from pba_exams are missing from the calendar grid
  2. Fee due dates are missing from the calendar grid
  3. Legend shows "Payment Due" × 2 and "Revision" × 2 (duplicates)
  4. "N events this month" count only counts pba_calendar_events,
     ignoring exams and fee events

════════════════════════════════════════════════════════════════
THE FIX — merge all sources into one unified event list
════════════════════════════════════════════════════════════════

Build a single merged event array that the calendar grid, the legend,
the event count, and the Upcoming Events sidebar ALL read from.
Do NOT read each source separately in different parts of the component.

Define this merge helper once, near the top of the component:

  const buildAllCalendarEvents = () => {
    // SOURCE 1: manually created calendar events
    const manualEvents = (safeLS('pba_calendar_events', []) || []);

    // SOURCE 2: exams from pba_exams → map to calendar event shape
    const examEvents = (safeLS('pba_exams', []) || []).map(exam => ({
      id:    'exam-' + (exam.id || Math.random()),
      title: exam.name || exam.title || 'Exam',
      date:  exam.date || exam.examDate || null,
      type:  'exam',
      // Preserve useful display fields:
      subject:  exam.subject || exam.subjectName || '',
      batchName: exam.batchName || exam.batch || '',
      time:     exam.startTime
                  ? `${exam.startTime}${exam.endTime ? '–' + exam.endTime : ''}`
                  : '',
      room:     exam.roomName || exam.room || '',
      _source:  'pba_exams'
    })).filter(e => e.date);   // skip exams with no date

    // SOURCE 3: fee due dates from pba_fees or pba_fee_schedule
    const feeEvents = [
      ...(safeLS('pba_fees', []) || []),
      ...(safeLS('pba_fee_schedule', []) || [])
    ]
    .filter(f => f.dueDate || f.date)
    .map(f => ({
      id:    'fee-' + (f.id || Math.random()),
      title: f.title || f.description || f.feeName || 'Fee Due',
      date:  f.dueDate || f.date,
      type:  'payment_due',
      _source: 'pba_fees'
    }));

    // Merge, deduplicate by id
    const seen = new Set();
    return [...manualEvents, ...examEvents, ...feeEvents].filter(e => {
      if (!e.date) return false;
      const key = e.id || (e.title + '|' + e.date);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

Call this once per render (or inside a useMemo/useState refresh):

  const allEvents = buildAllCalendarEvents();

════════════════════════════════════════════════════════════════
USE allEvents EVERYWHERE — replace all separate reads
════════════════════════════════════════════════════════════════

Replace ALL places in the component that read from a single store
with reads from allEvents:

  BEFORE:
    const events = safeLS('pba_calendar_events', []) || [];

  AFTER:
    // use allEvents (already built above)

Specifically update:

  A) Calendar grid cell rendering — find events for a given date:

    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayEvents = allEvents.filter(e => e.date === dateStr);

  B) "N events this month" counter in the header:

    const monthStr = `${year}-${String(month+1).padStart(2,'0')}`;
    const monthCount = allEvents.filter(e =>
      (e.date || '').startsWith(monthStr)
    ).length;

  C) Upcoming Events sidebar — already uses a wider source if it
     reads pba_exams separately; replace its source too so it reads
     from allEvents (consistent, already merged):

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const upcomingEvents = allEvents
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);   // show next 10

════════════════════════════════════════════════════════════════
FIX LEGEND DUPLICATES — deduplicate by display label
════════════════════════════════════════════════════════════════

The legend is built from a list of event types. Currently it has
duplicate entries because:
  • Two different type strings map to the same display name
  • The legend array is not deduplicated

Replace the legend data with a deduplicated, hardcoded-first list
that also captures any extra types from the live data:

  // Canonical type → display config:
  const EVENT_TYPE_CONFIG = {
    'term_start':   { label: 'Term Start',   color: '#22C55E' },
    'term_end':     { label: 'Term End',      color: '#3B82F6' },
    'holiday':      { label: 'Holiday',       color: '#EF4444' },
    'exam_week':    { label: 'Exam Week',     color: '#F97316' },
    'exam':         { label: 'Exam',          color: '#EAB308' },
    'leave':        { label: 'Leave',         color: '#EC4899' },
    'payment_due':  { label: 'Payment Due',   color: '#F59E0B' },
    'event':        { label: 'Event',         color: '#8B5CF6' },
    'revision':     { label: 'Revision',      color: '#06B6D4' },
    // Add any other canonical types used in pba_calendar_events:
    'fee_due':      { label: 'Payment Due',   color: '#F59E0B' }, // alias
    'Payment Due':  { label: 'Payment Due',   color: '#F59E0B' }, // alias
    'Revision':     { label: 'Revision',      color: '#06B6D4' }, // alias
  };

  // Build legend entries, dedup by DISPLAY LABEL (not by type key):
  const legendEntries = (() => {
    const seenLabels = new Set();
    const entries = [];

    // 1. Add canonical types in display order:
    const orderedKeys = [
      'term_start','term_end','holiday','exam_week',
      'exam','leave','payment_due','event','revision'
    ];
    orderedKeys.forEach(key => {
      const cfg = EVENT_TYPE_CONFIG[key];
      if (cfg && !seenLabels.has(cfg.label)) {
        seenLabels.add(cfg.label);
        entries.push({ label: cfg.label, color: cfg.color });
      }
    });

    // 2. Add any extra types found in live events that aren't covered:
    allEvents.forEach(e => {
      const type  = (e.type || e.eventType || '').toLowerCase().trim();
      const cfg   = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG[e.type];
      const label = cfg?.label || e.type || type;
      const color = cfg?.color || '#6B7280';
      if (label && !seenLabels.has(label)) {
        seenLabels.add(label);
        entries.push({ label, color });
      }
    });

    return entries;
  })();

Render the legend from legendEntries — guaranteed no duplicates:

  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px',
                marginBottom: '16px', fontSize: '12px' }}>
    {legendEntries.map(entry => (
      <span key={entry.label}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: entry.color, display: 'inline-block',
          flexShrink: 0
        }} />
        {entry.label}
      </span>
    ))}
  </div>

════════════════════════════════════════════════════════════════
EVENT TYPE NORMALISATION — map aliases to canonical types
════════════════════════════════════════════════════════════════

When getting a dot color or legend label for any event, always
normalise the type first:

  const normaliseType = (raw) => {
    const t = (raw || '').toLowerCase().trim().replace(/[\s_-]+/g, '_');
    const aliases = {
      'fee_due':      'payment_due',
      'payment due':  'payment_due',
      'paymentdue':   'payment_due',
      'revision class':'revision',
      'exam week':    'exam_week',
      'examweek':     'exam_week',
      'term start':   'term_start',
      'term end':     'term_end',
    };
    return aliases[t] || t;
  };

  const getEventColor = (event) => {
    const type = normaliseType(event.type || event.eventType || '');
    return (EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG[event.type] || {})
      .color || '#6B7280';
  };

Use getEventColor(event) everywhere a dot or badge colour is needed.

════════════════════════════════════════════════════════════════
REFRESH TRIGGER — keep allEvents in sync after adds/edits
════════════════════════════════════════════════════════════════

If the component holds allEvents in state, add a refresh counter:

  const [calRefresh, setCalRefresh] = React.useState(0);
  const allEvents = React.useMemo(
    () => buildAllCalendarEvents(),
    [calRefresh]   // re-runs when calRefresh increments
  );

After any save to pba_calendar_events, pba_exams, or pba_fees,
call setCalRefresh(n => n + 1) to force the grid to re-read.

════════════════════════════════════════════════════════════════
UPCOMING EVENTS SIDEBAR — exam detail display
════════════════════════════════════════════════════════════════

For events sourced from pba_exams (_source === 'pba_exams'), show
the subject, time and room on the sidebar card:

  {e._source === 'pba_exams' && (e.subject || e.time || e.room) && (
    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
      {[e.subject, e.time, e.room].filter(Boolean).join(' · ')}
    </div>
  )}

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY CalendarView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. allEvents is the SINGLE merged list — never read a store
   separately in two different parts of the component
5. The legend MUST be deduplicated by display label — two type
   strings that map to the same label get ONE legend entry
6. Date comparison is always string equality "YYYY-MM-DD" —
   never parse dates back into Date objects (UTC bug)
7. Exam events without a date field are silently skipped
8. Fee events without a dueDate or date field are silently skipped
9. The "N events this month" count now includes exam + fee events
10. After fix: navigating to October should show exam dots on Oct 1
    (Biology 1 + Chemistry 1) and Oct 5 (A/L Mid-Term)
11. Run npm run build and confirm 0 errors
12. Then npm run deploy
13. List all files modified
```
