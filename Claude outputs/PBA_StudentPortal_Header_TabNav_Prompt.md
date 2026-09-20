# PBA Full-Time Portal — Student Portal Header & Tab Navigation Restyle
## AntiGravity Prompt — Surgical Fix

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Restyle the Student Self-Service Portal header and tab navigation bar.
Do NOT change any tab content, data logic, or other pages.

Target file: wherever the student portal shell/layout lives
(StudentPortalView.jsx, StudentSelfServiceView.jsx, or equivalent —
the component that renders the top nav bar with tabs: My Dashboard,
My Timetable, My Attendance, My Fees, My Results, My Profile).

════════════════════════════════════════════════════════════════
FIX 1 — TOP HEADER BAR (dark charcoal bar with student info)
════════════════════════════════════════════════════════════════

Keep the existing dark header bar but apply these exact styles:

Outer container:
<div style={{
  background: 'linear-gradient(90deg, #1C1F26 0%, #2D3748 100%)',
  padding: '10px 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
}}>

Left: PBA logo/title area (keep existing text, just style):
  <div>
    <span style={{
      fontSize: '14px', fontWeight: 800, color: '#FFFFFF',
      fontFamily: "'Sora', sans-serif", letterSpacing: '0.5px'
    }}>PBA</span>
    <span style={{
      fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)',
      fontFamily: "'Inter', sans-serif", marginLeft: '10px'
    }}>Student Portal</span>
    <div style={{
      fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.45)',
      textTransform: 'uppercase', letterSpacing: '0.8px',
      fontFamily: "'Inter', sans-serif"
    }}>Student Self-Service System</div>
  </div>

Right: student info + buttons:
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

    Student name + ID chip:
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif"
      }}>{studentName}</div>
      <div style={{
        fontSize: '11px', color: 'rgba(255,255,255,0.55)',
        fontFamily: "'Inter', sans-serif"
      }}>{studentId} · {branch}</div>
    </div>

    Password button (ghost):
    <button style={{
      padding: '6px 12px',
      background: 'transparent',
      border: '1.5px solid rgba(255,255,255,0.25)',
      borderRadius: '7px',
      fontSize: '11px', fontWeight: 600,
      color: 'rgba(255,255,255,0.75)',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '5px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      Password
    </button>

    Sign Out button (ghost):
    <button style={{
      padding: '6px 12px',
      background: 'transparent',
      border: '1.5px solid rgba(255,255,255,0.25)',
      borderRadius: '7px',
      fontSize: '11px', fontWeight: 600,
      color: 'rgba(255,255,255,0.75)',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '5px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Sign Out
    </button>

  </div>

════════════════════════════════════════════════════════════════
FIX 2 — TAB NAVIGATION BAR (currently plain text underline style)
════════════════════════════════════════════════════════════════

Replace the current tab bar with a pill-group style navigation.

Outer wrapper (white bar with bottom border):
<div style={{
  background: '#FFFFFF',
  borderBottom: '1px solid #E3E6EA',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center'
}}>

Inner pill container:
<div style={{
  display: 'flex',
  gap: '2px',
  padding: '8px 0'
}}>

Each tab button:
<button
  onClick={() => setActiveTab(tab.id)}
  style={{
    padding: '8px 16px',
    background: activeTab === tab.id ? '#EBF4FF' : 'transparent',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: activeTab === tab.id ? 700 : 500,
    color: activeTab === tab.id ? '#2B6CB0' : '#718096',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    transition: 'all 0.15s',
    borderBottom: activeTab === tab.id
      ? '2px solid #2B6CB0'
      : '2px solid transparent',
    borderRadius: '0',
    paddingBottom: '10px'
  }}
  onMouseEnter={e => {
    if (activeTab !== tab.id) {
      e.currentTarget.style.color = '#2D3748';
      e.currentTarget.style.background = '#F7FAFC';
    }
  }}
  onMouseLeave={e => {
    if (activeTab !== tab.id) {
      e.currentTarget.style.color = '#718096';
      e.currentTarget.style.background = 'transparent';
    }
  }}
>
  {/* Keep existing icon SVGs per tab, sized 14×14, stroke currentColor */}
  {tab.label}
</button>

Tab definitions (keep existing icons, just ensure labels are):
  id: 'dashboard'    label: 'My Dashboard'   icon: grid/dashboard SVG
  id: 'timetable'    label: 'My Timetable'   icon: calendar SVG
  id: 'attendance'   label: 'My Attendance'  icon: check-circle SVG
  id: 'fees'         label: 'My Fees'        icon: credit-card SVG
  id: 'results'      label: 'My Results'     icon: award/chart SVG
  id: 'profile'      label: 'My Profile'     icon: user SVG

════════════════════════════════════════════════════════════════
FIX 3 — DASHBOARD CONTENT CARDS (no card wrappers currently)
════════════════════════════════════════════════════════════════

In the My Dashboard tab, wrap each section in a proper card:

Card style (apply to: Attendance Overview, Next Upcoming Class Session,
Upcoming Exam Countdown, Latest Evaluation Summary):

<div style={{
  background: '#FFFFFF',
  border: '1px solid #E3E6EA',
  borderRadius: '12px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  padding: '20px 24px'
}}>

Card section heading (each card title):
<div style={{
  display: 'flex', alignItems: 'center', gap: '8px',
  marginBottom: '16px'
}}>
  {/* keep existing icon SVG, stroke #2B6CB0, size 16×16 */}
  <span style={{
    fontSize: '13px', fontWeight: 700, color: '#1A202C',
    fontFamily: "'Sora', sans-serif"
  }}>{sectionTitle}</span>
</div>

Layout: 2-column grid for the 4 cards:
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  padding: '0 24px 24px'
}}>

"Latest Evaluation Summary" table inside its card:
  table: width 100%, borderCollapse collapse
  th: fontSize 10px, fontWeight 700, color #718096, textTransform uppercase,
      letterSpacing 0.5px, paddingBottom 8px, textAlign left,
      borderBottom 1px solid #E3E6EA
  td: fontSize 13px, color #1A202C, padding 8px 0,
      borderBottom 1px solid #F0F2F5
  Grade cell: show grade badge pill inline (A→green, B→blue, C→amber, F→red)
    badge: fontSize 11px, fontWeight 700, padding 2px 8px, borderRadius 12px

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any tab content (My Attendance, My Fees, My Results,
   My Timetable, My Profile) — only the shell/navigation and dashboard cards.
2. Do NOT change any data logic or localStorage reads.
3. Use only inline style={{}} props — no Tailwind.
4. Run npm run build and confirm 0 errors.
5. List all files modified.
```
