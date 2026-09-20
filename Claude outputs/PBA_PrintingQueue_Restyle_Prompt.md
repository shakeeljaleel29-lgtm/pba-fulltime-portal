# PBA Full-Time Portal — Printing Queue Board Restyle
## AntiGravity Prompt — Phase 7A: Kanban Board + Book Catalogue Cards

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Restyle the Printing Queue Board (Kanban view) and the Book Catalogue tab. Do not change any logic, data, or functionality.

Add these constants at the top of the file if not already present:

const theme = {
  accent: '#2B6CB0', accentLight: '#EBF4FF',
  gold: '#D4A017', goldLight: '#FEF3C7',
  textPrimary: '#1A202C', textSecondary: '#4A5568', textMuted: '#718096',
  cardBg: '#FFFFFF', cardBorder: '#E3E6EA', pageBg: '#F4F5F7',
  success: '#2F855A', successLight: '#F0FFF4',
  danger: '#C53030',
};

════════════════════════════════════════════════════════════════
SECTION 1 — KANBAN BOARD LAYOUT (PrintJobKanban.jsx or equivalent)
════════════════════════════════════════════════════════════════

The three Kanban columns (Pending Received / In Progress / Completed) must display
side-by-side in a 3-column grid, not stacked vertically.

Replace the outer column container with:

<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '18px',
  alignItems: 'flex-start',
  marginTop: '20px'
}}>
  {/* Column 1: Pending */}
  {/* Column 2: In Progress */}
  {/* Column 3: Completed */}
</div>

════════════════════════════════════════════════════════════════
SECTION 2 — KANBAN COLUMN HEADERS
════════════════════════════════════════════════════════════════

Each column heading ("Pending Received (0)", "In Progress (1)", "Completed (1)")
must be wrapped in a styled column container and header row.

Column wrapper (apply to all three columns):
<div style={{
  background: '#F8F9FB',
  border: '1px solid #E3E6EA',
  borderRadius: '12px',
  overflow: 'hidden',
  minHeight: '200px'
}}>

Column header bar (the colored top strip — different accent per column):
<div style={{
  padding: '12px 16px',
  borderBottom: '1px solid #E3E6EA',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#FFFFFF'
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    {/* Icon + Column title */}
    <span style={{
      fontFamily: "'Sora', sans-serif",
      fontSize: '13px',
      fontWeight: 700,
      color: '#1A202C'
    }}>
      Column Title
    </span>
  </div>
  {/* Count badge */}
  <span style={{
    background: COLUMN_COLOR_LIGHT,
    color: COLUMN_COLOR,
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '20px',
    minWidth: '22px',
    textAlign: 'center'
  }}>
    {count}
  </span>
</div>

Use these colors per column:
  Pending Received → COLUMN_COLOR: '#B7860A', COLUMN_COLOR_LIGHT: '#FEF3C7'
  In Progress      → COLUMN_COLOR: '#2B6CB0', COLUMN_COLOR_LIGHT: '#EBF4FF'
  Completed        → COLUMN_COLOR: '#2F855A', COLUMN_COLOR_LIGHT: '#F0FFF4'

Column body (cards go here):
<div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
  {/* job cards */}
</div>

════════════════════════════════════════════════════════════════
SECTION 3 — JOB CARDS (individual print job entries)
════════════════════════════════════════════════════════════════

Each print job card (currently plain text blocks) must be replaced with a
white card with a colored left border accent:

<div style={{
  background: '#FFFFFF',
  border: '1px solid #E3E6EA',
  borderLeft: '3px solid ACCENT_COLOR',
  borderRadius: '8px',
  padding: '14px 16px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
}}>

  {/* Row 1: Book title */}
  <div style={{
    fontFamily: "'Sora', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: '#1A202C',
    marginBottom: '6px',
    lineHeight: '1.3'
  }}>
    {job.bookTitle}
  </div>

  {/* Row 2: Batch chip */}
  <div style={{ marginBottom: '8px' }}>
    <span style={{
      background: '#EBF4FF',
      color: '#2B6CB0',
      fontSize: '11px',
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: '6px'
    }}>
      {job.batch}
    </span>
  </div>

  {/* Row 3: Qty and received-by info */}
  <div style={{
    fontSize: '12px',
    color: '#4A5568',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
         stroke="#718096" strokeWidth="2">
      <rect x="6" y="2" width="12" height="20" rx="2"/>
      <line x1="12" y1="6" x2="16" y2="6"/>
      <line x1="12" y1="10" x2="16" y2="10"/>
      <line x1="12" y1="14" x2="16" y2="14"/>
    </svg>
    Qty: <strong>{job.qty} copies</strong>
  </div>

  {/* Row 4: Staff who received / handled */}
  <div style={{
    fontSize: '11px',
    color: '#718096',
    marginBottom: '12px'
  }}>
    {job.receivedBy or job.staffName}
  </div>

  {/* For Completed cards: show completion date and notes in green */}
  {/* completedAt → */}
  <div style={{
    fontSize: '11px',
    color: '#2F855A',
    fontWeight: 600,
    marginBottom: '4px'
  }}>
    ✓ Completed on {job.completedAt}
  </div>
  {/* notes → */}
  {job.notes && (
    <div style={{
      fontSize: '11px',
      color: '#718096',
      fontStyle: 'italic',
      marginBottom: '10px'
    }}>
      Notes: "{job.notes}"
    </div>
  )}

  {/* Action button — only on Pending and In Progress cards */}
  {/* "Mark as Completed" button → style it as primary blue */}
  <button style={{
    width: '100%',
    padding: '8px',
    background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 2px 8px rgba(43,108,176,0.25)',
    fontFamily: "'Inter', sans-serif"
  }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
         stroke="#FFFFFF" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    Mark as Completed
  </button>

</div>

Use ACCENT_COLOR per column:
  Pending cards  → '#D4A017'  (golden)
  In Progress    → '#2B6CB0'  (blue)
  Completed      → '#2F855A'  (green)

════════════════════════════════════════════════════════════════
SECTION 4 — EMPTY STATE ("No pending jobs in queue")
════════════════════════════════════════════════════════════════

When a column has no jobs, replace the plain text with a styled empty state:

<div style={{
  textAlign: 'center',
  padding: '30px 16px',
  color: '#A0AEC0'
}}>
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
       stroke="#CBD5E0" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
    <rect x="6" y="2" width="12" height="20" rx="2"/>
    <line x1="9" y1="9" x2="15" y2="9"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
  </svg>
  <div style={{ fontSize: '12px', fontWeight: 500 }}>No jobs in this column</div>
</div>

════════════════════════════════════════════════════════════════
SECTION 5 — "EXPORT PRINTING REPORT (CSV)" BUTTON
════════════════════════════════════════════════════════════════

The Export button top-right is currently an unstyled plain button.
Replace its style with the secondary ghost button style:

style={{
  padding: '9px 16px',
  background: '#FFFFFF',
  border: '1.5px solid #E3E6EA',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#4A5568',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  fontFamily: "'Inter', sans-serif"
}}

Add a download SVG icon before the text:
<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
     stroke="#4A5568" strokeWidth="2">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="7 10 12 15 17 10"/>
  <line x1="12" y1="15" x2="12" y2="3"/>
</svg>

════════════════════════════════════════════════════════════════
SECTION 6 — PAGE-LEVEL HEADER AREA
════════════════════════════════════════════════════════════════

The "Kanban Printing Queue" heading and the Export button should sit in a
flex row with space-between:

<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '4px'
}}>
  <h2 style={{
    fontFamily: "'Sora', sans-serif",
    fontSize: '17px',
    fontWeight: 700,
    color: '#1A202C',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="#2B6CB0" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
    Kanban Printing Queue
  </h2>
  {/* Export button goes here */}
</div>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any onClick handlers, state variables, or data logic.
2. Keep the existing tab structure (Textbook Catalogue | Requisitions | Printing Queue Board | Student Book Issues) — do not restyle the tabs unless they look unstyled.
3. The 3-column grid must render all three columns side-by-side on a standard desktop viewport.
4. After changes, list which files were modified.
```
