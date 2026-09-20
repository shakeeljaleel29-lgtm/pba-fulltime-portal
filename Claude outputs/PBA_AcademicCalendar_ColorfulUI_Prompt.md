# PBA Full-Time Portal — Academic Calendar: Colorful & Intuitive Redesign
## AntiGravity Prompt

---

```
Make the Academic Calendar (CalendarView.jsx) richly color-coded and
visually intuitive. Touch ONLY CalendarView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE PROBLEM
════════════════════════════════════════════════════════════════

The calendar grid currently shows event dots as small grey bullets.
Event types are not visually differentiated. The grid feels like a
basic wireframe — no color coding, no cell tinting, no legend.

The Upcoming Events sidebar shows colored type chips, but the calendar
cells themselves do not match those colors. There is no visual connection
between the list and the grid.

════════════════════════════════════════════════════════════════
EVENT TYPE COLOR SYSTEM
════════════════════════════════════════════════════════════════

Define a central color map at the TOP of the component:

const EVENT_COLORS = {
  term_start:   { bg: '#D1FAE5', border: '#059669', text: '#065F46', dot: '#059669', label: 'Term Start'   },
  term_end:     { bg: '#DBEAFE', border: '#2563EB', text: '#1E40AF', dot: '#2563EB', label: 'Term End'     },
  holiday:      { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B', dot: '#DC2626', label: 'Holiday'      },
  exam_week:    { bg: '#FEF3C7', border: '#D97706', text: '#92400E', dot: '#D97706', label: 'Exam Week'    },
  exam:         { bg: '#FEF3C7', border: '#D97706', text: '#92400E', dot: '#D97706', label: 'Exam'         },
  leave:        { bg: '#FFE4E6', border: '#F43F5E', text: '#9F1239', dot: '#F43F5E', label: 'Leave'        },
  payment:      { bg: '#ECFDF5', border: '#10B981', text: '#065F46', dot: '#10B981', label: 'Payment Due'  },
  event:        { bg: '#EDE9FE', border: '#7C3AED', text: '#4C1D95', dot: '#7C3AED', label: 'Event'        },
  revision:     { bg: '#F0F9FF', border: '#0EA5E9', text: '#0C4A6E', dot: '#0EA5E9', label: 'Revision'     },
  default:      { bg: '#F1F5F9', border: '#94A3B8', text: '#475569', dot: '#94A3B8', label: 'Other'        }
};

// Helper to get colors for any event
const getEventColor = (type) => EVENT_COLORS[type] || EVENT_COLORS.default;

════════════════════════════════════════════════════════════════
FIX 1 — LEGEND BAR above the calendar grid
════════════════════════════════════════════════════════════════

Render a horizontal legend row between the month navigation
and the day-header row:

<div style={{
  display: 'flex', flexWrap: 'wrap', gap: '8px',
  padding: '12px 0', marginBottom: '8px'
}}>
  {Object.entries(EVENT_COLORS)
    .filter(([key]) => key !== 'default')
    .map(([key, c]) => (
      <div key={key} style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        fontSize: '11px', color: c.text, fontWeight: 600
      }}>
        <span style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: c.dot, display: 'inline-block', flexShrink: 0
        }} />
        {c.label}
      </div>
    ))
  }
</div>

════════════════════════════════════════════════════════════════
FIX 2 — DAY HEADER ROW
════════════════════════════════════════════════════════════════

The day header (Mon Tue Wed Thu Fri Sat Sun) should differentiate weekends:

['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
  <div key={d} style={{
    padding: '8px 0',
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: 700,
    color: (i === 0 || i === 6) ? '#DC2626' : '#64748B',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  }}>
    {d}
  </div>
))

════════════════════════════════════════════════════════════════
FIX 3 — CALENDAR CELL REDESIGN
════════════════════════════════════════════════════════════════

For each day cell in the calendar grid:

Step A — Get all events for this date:
  const cellEvents = (calendarEvents || []).filter(ev => ev.date === dateStr);
  // dateStr format: 'YYYY-MM-DD'

Step B — Determine cell background:
  If 1 event:   use getEventColor(cellEvents[0].type).bg (light tint)
  If 2+ events: use '#F8F7FF' (light lavender — mixed events)
  If weekend:   use '#FFF7F7' (light pink-red tint) when no events
  If no events: use 'white'

Step C — Cell container:
  const isToday = dateStr === todayStr;
  const isCurrentMonth = cellDate.getMonth() === currentMonth;
  const isWeekend = [0, 6].includes(cellDate.getDay());
  const primaryColor = cellEvents.length === 1
    ? getEventColor(cellEvents[0].type)
    : null;

  <div
    onClick={() => handleCellClick(dateStr)}
    style={{
      minHeight: '80px',
      padding: '6px',
      border: isToday
        ? '2px solid #4F46E5'
        : `1px solid ${primaryColor ? primaryColor.border + '60' : '#E2E8F0'}`,
      borderRadius: '10px',
      background: isToday
        ? '#EEF2FF'
        : !isCurrentMonth
          ? '#FAFAFA'
          : cellEvents.length === 1
            ? primaryColor.bg
            : cellEvents.length > 1
              ? '#F5F3FF'
              : isWeekend
                ? '#FFF5F5'
                : 'white',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      position: 'relative',
      opacity: isCurrentMonth ? 1 : 0.4,
      boxShadow: cellEvents.length > 0 ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
      e.currentTarget.style.transform = 'translateY(-1px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = cellEvents.length > 0 ? '0 1px 3px rgba(0,0,0,0.06)' : 'none';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >

Step D — Date number inside the cell:
  <div style={{
    fontSize: '13px',
    fontWeight: isToday ? 800 : 600,
    color: isToday ? '#4F46E5' : isWeekend ? '#DC2626' : '#1A202C',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }}>
    <span style={isToday ? {
      background: '#4F46E5',
      color: 'white',
      width: '22px', height: '22px',
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '11px', fontWeight: 800
    } : {}}>
      {dayOfMonth}
    </span>
    {/* "+" add button — shows on hover, always visible on mobile */}
    <span style={{ fontSize: '14px', color: '#CBD5E0', lineHeight: 1 }}>+</span>
  </div>

Step E — Event labels inside cell (show up to 2, then "+N more"):
  {cellEvents.slice(0, 2).map(ev => {
    const c = getEventColor(ev.type);
    return (
      <div
        key={ev.id}
        onClick={e => { e.stopPropagation(); handleEventClick(ev); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '2px',
          padding: '2px 5px',
          borderRadius: '4px',
          background: c.bg,
          border: `1px solid ${c.border}40`,
          cursor: 'pointer'
        }}
      >
        <span style={{
          width: '6px', height: '6px',
          borderRadius: '50%',
          background: c.dot,
          flexShrink: 0
        }} />
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          color: c.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%'
        }}>
          {ev.title}
        </span>
      </div>
    );
  })}

  {cellEvents.length > 2 && (
    <div style={{
      fontSize: '10px',
      color: '#7C3AED',
      fontWeight: 700,
      padding: '1px 5px',
      background: '#EDE9FE',
      borderRadius: '4px',
      display: 'inline-block',
      marginTop: '2px'
    }}>
      +{cellEvents.length - 2} more
    </div>
  )}

════════════════════════════════════════════════════════════════
FIX 4 — UPCOMING EVENTS SIDEBAR redesign
════════════════════════════════════════════════════════════════

For each event in the Upcoming Events panel (next 30 days, sorted by date):

  const today = new Date();
  const daysUntil = Math.ceil((new Date(ev.date) - today) / 86400000);
  const c = getEventColor(ev.type);

  <div key={ev.id} style={{
    borderLeft: `4px solid ${c.border}`,
    background: c.bg,
    borderRadius: '0 10px 10px 0',
    padding: '10px 12px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.10)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    onClick={() => handleEventClick(ev)}
  >
    {/* Type chip + days countdown */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
      <span style={{
        fontSize: '10px', fontWeight: 700,
        color: c.text,
        background: 'white',
        padding: '2px 6px',
        borderRadius: '20px',
        border: `1px solid ${c.border}60`
      }}>
        {c.label.toUpperCase()}
      </span>
      <span style={{
        fontSize: '10px',
        fontWeight: 700,
        color: daysUntil === 0 ? '#DC2626' : daysUntil <= 3 ? '#D97706' : '#64748B'
      }}>
        {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
      </span>
    </div>

    {/* Event title */}
    <div style={{ fontSize: '13px', fontWeight: 700, color: c.text, marginBottom: '3px' }}>
      {ev.title}
    </div>

    {/* Date */}
    <div style={{ fontSize: '11px', color: c.text + 'CC' }}>
      {new Date(ev.date + 'T12:00:00').toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      })}
    </div>

    {/* Notes if present */}
    {ev.notes && (
      <div style={{
        fontSize: '11px', color: c.text + 'AA',
        marginTop: '4px',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {ev.notes}
      </div>
    )}
  </div>

════════════════════════════════════════════════════════════════
FIX 5 — ADD / EDIT EVENT MODAL redesign
════════════════════════════════════════════════════════════════

The Add/Edit modal should show a color preview strip for the selected type.

After the TYPE <select> dropdown, add a live color preview:
  {sessionForm.type && (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: getEventColor(sessionForm.type).bg,
      borderRadius: '8px',
      border: `1px solid ${getEventColor(sessionForm.type).border}60`,
      marginTop: '6px'
    }}>
      <span style={{
        width: '12px', height: '12px', borderRadius: '50%',
        background: getEventColor(sessionForm.type).dot
      }} />
      <span style={{
        fontSize: '12px',
        fontWeight: 600,
        color: getEventColor(sessionForm.type).text
      }}>
        {getEventColor(sessionForm.type).label}
      </span>
    </div>
  )}

════════════════════════════════════════════════════════════════
FIX 6 — MONTH NAVIGATION HEADER
════════════════════════════════════════════════════════════════

Make the month/year header and nav buttons more prominent:

<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
  padding: '12px 16px',
  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
  borderRadius: '12px',
  color: 'white'
}}>
  <button
    onClick={prevMonth}
    style={{
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      width: '32px', height: '32px',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700
    }}
  >
    ‹
  </button>

  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
      {monthName} {year}
    </div>
    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
      {calendarEvents.filter(ev => ev.date?.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length} events this month
    </div>
  </div>

  <button
    onClick={nextMonth}
    style={{
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      width: '32px', height: '32px',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700
    }}
  >
    ›
  </button>
</div>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY CalendarView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. The EVENT_COLORS map is the single source of truth for all colors —
   reference it everywhere (cells, dots, sidebar, modal preview)
5. Existing event data in pba_academic_calendar is unchanged — only
   the rendering logic and visual presentation changes
6. ALL array operations must guard against null:
   (calendarEvents || []).filter(...)
7. Hover effects use onMouseEnter / onMouseLeave on the element's style
   (no CSS classes, no :hover pseudo-selectors)
8. Run npm run build and confirm 0 errors
9. Then run npm run deploy to push to GitHub and trigger Vercel deployment
10. List all files modified
```
