# AntiGravity Prompt — PBA Full-Time Portal: Premium UI Overhaul

This is a complete visual redesign pass. Do not change any data, logic, routing, or functionality. Only replace styles and visual structure. The goal is a world-class admin dashboard that looks and feels like a premium SaaS product — comparable to Linear, Stripe Dashboard, or Vercel — not a generic AI-generated template.

Apply all styles using inline `style={{}}` JSX props. Do not rely on Tailwind utility classes for any layout or visual styles.

---

## Design System — Read This First

### Color Tokens

Define these as JavaScript constants at the top of the file (or in a shared `theme.ts`), then reference them throughout:

```javascript
const theme = {
  // Sidebar & primary brand
  sidebarBg: '#0A1628',           // Deep navy — richer than before
  sidebarBorder: '#1E3358',
  sidebarText: '#94A3B8',
  sidebarTextActive: '#F8FAFC',
  sidebarHover: 'rgba(255,255,255,0.05)',
  sidebarActive: 'rgba(59,130,246,0.15)',
  sidebarActiveBorder: '#3B82F6',

  // App shell
  pageBg: '#F1F5F9',              // Slightly cooler grey than before
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  cardShadow: '0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)',
  cardShadowHover: '0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',

  // Typography
  textPrimary: '#0F172A',         // Near-black
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#F8FAFC',

  // Accent — single consistent blue
  accent: '#2563EB',
  accentLight: '#EFF6FF',
  accentBorder: '#BFDBFE',

  // Semantic colours
  success: '#059669',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  info: '#0284C7',
  infoBg: '#F0F9FF',
  infoBorder: '#BAE6FD',

  // Header
  headerBg: 'rgba(255,255,255,0.92)',
  headerBorder: '#E2E8F0',

  // Spacing scale (in px)
  // 4, 8, 12, 16, 20, 24, 32, 40, 48

  // Border radius
  radiusSm: '6px',
  radiusMd: '10px',
  radiusLg: '14px',
  radiusXl: '18px',
  radiusFull: '9999px',
};
```

### Typography Scale

```javascript
const type = {
  displayLg: { fontSize: '28px', fontWeight: 700, fontFamily: 'Sora, sans-serif', letterSpacing: '-0.02em', lineHeight: 1.2 },
  displaySm: { fontSize: '22px', fontWeight: 700, fontFamily: 'Sora, sans-serif', letterSpacing: '-0.015em', lineHeight: 1.3 },
  heading: { fontSize: '17px', fontWeight: 600, fontFamily: 'Sora, sans-serif', letterSpacing: '-0.01em' },
  subheading: { fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#94A3B8' },
  body: { fontSize: '14px', fontWeight: 400, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 },
  bodySm: { fontSize: '13px', fontWeight: 400, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 },
  bodyXs: { fontSize: '12px', fontWeight: 400, fontFamily: 'Inter, sans-serif' },
  label: { fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif' },
  labelSm: { fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif' },
  mono: { fontSize: '13px', fontFamily: 'ui-monospace, "JetBrains Mono", monospace' },
};
```

### Transitions

Add `transition: 'all 0.15s ease'` to every interactive element (buttons, nav items, cards with hover, inputs on focus, badges). This single rule elevates the feel from static to polished.

---

## 1 — Global Styles (globals.css)

Replace the entire globals.css content with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@600;700&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #F1F5F9;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  color: #0F172A;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  height: 100%;
}

::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 999px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}

input, textarea, select, button {
  font-family: inherit;
}

/* Sidebar scrollbar */
.sidebar-nav::-webkit-scrollbar {
  width: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
}

/* Smooth page transitions */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-enter {
  animation: fadeIn 0.2s ease forwards;
}

/* Toast animation */
@keyframes slideIn {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Table row hover */
tr.hoverable:hover td {
  background: #F8FAFC;
}

/* Focus ring */
input:focus, textarea:focus, select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  border-color: #2563EB !important;
}

/* Responsive sidebar */
@media (max-width: 768px) {
  .sidebar {
    position: fixed !important;
    left: -260px !important;
    transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
    z-index: 100 !important;
  }
  .sidebar.open {
    left: 0 !important;
  }
  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(2px);
    z-index: 99;
  }
  .sidebar-overlay.visible {
    display: block;
  }
}
```

---

## 2 — App Shell / Root Layout

```jsx
<div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#F1F5F9' }}>
  <Sidebar />
  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
    <Header />
    <main
      className="page-enter"
      style={{ flex: 1, overflowY: 'auto', padding: '24px', scrollBehavior: 'smooth' }}
    >
      {/* page content */}
    </main>
  </div>
</div>
```

Apply `className="page-enter"` to the `<main>` element every time the view changes — this creates a subtle fade-in between pages.

---

## 3 — Sidebar (Complete Rewrite)

The sidebar is 256px wide. It has three distinct visual zones.

```jsx
<div
  className="sidebar sidebar-nav"
  style={{
    width: '256px',
    minWidth: '256px',
    height: '100vh',
    background: '#0A1628',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    borderRight: '1px solid #1E3358',
    position: 'relative',
    zIndex: 20
  }}
>

  {/* Zone 1 — Logo / Brand */}
  <div style={{
    padding: '20px 20px 16px',
    borderBottom: '1px solid #1E3358',
    background: 'linear-gradient(135deg, #0F2044 0%, #0A1628 100%)',
    flexShrink: 0
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Logo mark */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
      }}>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: 700, fontFamily: 'Sora, sans-serif' }}>P</span>
      </div>
      <div>
        <div style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: 700, fontFamily: 'Sora, sans-serif', letterSpacing: '-0.01em' }}>PBA Portal</div>
        <div style={{ color: '#475569', fontSize: '11px', fontWeight: 500, fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>Full-Time Division</div>
      </div>
    </div>

    {/* Branch badge */}
    <div style={{
      marginTop: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(59,130,246,0.12)',
      border: '1px solid rgba(59,130,246,0.25)',
      borderRadius: '6px',
      padding: '4px 10px'
    }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 4px rgba(59,130,246,0.8)' }} />
      <span style={{ color: '#93C5FD', fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Kohuwala</span>
    </div>
  </div>

  {/* Zone 2 — Navigation */}
  <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>

    {/* Section label */}
    <div style={{ padding: '8px 10px 4px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', color: '#334155', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>
      Main
    </div>

    {/* Nav item — ACTIVE state */}
    <button style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 10px',
      borderRadius: '8px',
      color: '#F8FAFC',
      background: 'rgba(59,130,246,0.12)',
      border: 'none',
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      position: 'relative',
      transition: 'all 0.15s ease'
    }}>
      {/* Active left indicator */}
      <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '18px', background: '#3B82F6', borderRadius: '0 3px 3px 0' }} />
      {/* Icon */}
      <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      </div>
      <span style={{ color: '#F8FAFC' }}>Dashboard</span>
    </button>

    {/* Nav item — DEFAULT state (use this for all inactive items) */}
    {/* 
    <button style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
      borderRadius: '8px', color: '#94A3B8', background: 'transparent', border: 'none',
      width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '14px',
      fontFamily: 'Inter, sans-serif', fontWeight: 500, transition: 'all 0.15s ease'
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#CBD5E1'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
    >
    */}

    {/* Section label — Admin */}
    <div style={{ padding: '12px 10px 4px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', color: '#334155', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
      Administration
    </div>

  </nav>

  {/* Zone 3 — User profile footer */}
  <div style={{
    padding: '12px 10px',
    borderTop: '1px solid #1E3358',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    borderRadius: '8px',
    margin: '0 10px 10px',
    transition: 'all 0.15s ease'
  }}
  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: '13px', fontWeight: 700, fontFamily: 'Sora, sans-serif',
      boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
    }}>
      A
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: '#F1F5F9', fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>System Admin</div>
      <div style={{ color: '#475569', fontSize: '11px', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>admin@pba.lk</div>
    </div>
    {/* Logout icon */}
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  </div>

</div>
```

### Sidebar SVG Icons

Replace all emoji icons in the sidebar with these inline SVG icons. Use `stroke="currentColor"` and set color on the parent. Stroke width 1.75, size 16×16:

| Section | Icon SVG path |
|---|---|
| Dashboard | `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>` |
| Analytics | `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>` |
| Calendar | `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>` |
| Lecturers | `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` |
| Students | `<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>` |
| Fees | `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>` |
| Exams | `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>` |
| Books | `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>` |
| Printing | `<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>` |
| Communications | `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>` |
| Parent Portal | `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>` |
| Documents | `<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>` |
| General Admin | `<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 17.34l-1.41 1.41M19.07 19.07l-1.41-1.41M5.34 6.66l-1.41-1.41M22 12h-2M4 12H2M19.07 4.93A10 10 0 1 0 4.93 19.07"/>` |

Wrap each icon in:
```jsx
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
  {/* path here */}
</svg>
```

Set `color: '#64748B'` on inactive items, `color: '#3B82F6'` on the active item.

---

## 4 — Header (Complete Rewrite)

```jsx
<header style={{
  position: 'sticky',
  top: 0,
  height: '58px',
  minHeight: '58px',
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid #E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  zIndex: 10,
  flexShrink: 0
}}>

  {/* Left: page title + breadcrumb */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    {/* Mobile menu button — only shows on small screens */}
    <button className="mobile-menu-btn" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <h1 style={{ fontSize: '17px', fontWeight: 600, fontFamily: 'Sora, sans-serif', color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
      {currentPageTitle}
    </h1>
  </div>

  {/* Right: search + actions */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

    {/* Search */}
    <div style={{ position: 'relative' }}>
      <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="text"
        placeholder="Search…"
        style={{
          width: '220px',
          height: '34px',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '0 12px 0 34px',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          background: '#F8FAFC',
          color: '#0F172A',
          transition: 'all 0.15s ease'
        }}
        onFocus={e => { e.target.style.background = '#FFF'; e.target.style.width = '280px'; }}
        onBlur={e => { e.target.style.background = '#F8FAFC'; e.target.style.width = '220px'; }}
      />
    </div>

    {/* Divider */}
    <div style={{ width: '1px', height: '20px', background: '#E2E8F0' }} />

    {/* Notification button */}
    <button style={{
      position: 'relative',
      width: '34px', height: '34px',
      borderRadius: '8px',
      background: 'transparent',
      border: '1px solid transparent',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s ease'
    }}
    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      {/* Badge */}
      <span style={{
        position: 'absolute', top: '4px', right: '4px',
        width: '8px', height: '8px',
        background: '#DC2626', borderRadius: '50%',
        border: '1.5px solid white'
      }} />
    </button>

    {/* User chip */}
    <button style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      height: '34px',
      padding: '0 10px 0 6px',
      borderRadius: '8px',
      background: 'transparent',
      border: '1px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    }}
    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
    >
      <div style={{
        width: '26px', height: '26px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: '11px', fontWeight: 700, fontFamily: 'Sora, sans-serif',
        flexShrink: 0
      }}>A</div>
      <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#0F172A' }}>Admin</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

  </div>
</header>
```

---

## 5 — Dashboard Stat Tiles (Premium Redesign)

Replace the 5 stat tiles with this design. Each tile has a coloured icon background, a value, a label, and a subtle trend indicator:

```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '14px',
  marginBottom: '24px'
}}>

  {/* Example tile — replicate for all 5 */}
  <div style={{
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '18px 20px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    cursor: 'default',
    transition: 'all 0.15s ease',
    position: 'relative',
    overflow: 'hidden'
  }}
  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    {/* Subtle top-left accent line */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #3B82F6 0%, transparent 100%)' }} />

    {/* Icon + value row */}
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
      {/* Icon box */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '9px',
        background: '#EFF6FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      {/* Trend indicator */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '2px',
        fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
        color: '#059669', background: '#ECFDF5',
        borderRadius: '5px', padding: '2px 7px'
      }}>
        ↑ 12%
      </span>
    </div>

    {/* Value */}
    <div style={{ fontSize: '30px', fontWeight: 700, fontFamily: 'Sora, sans-serif', color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>
      8
    </div>

    {/* Label */}
    <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#475569' }}>
      Today's Classes
    </div>

  </div>

</div>
```

### 5 tiles — specs:

| Tile | Icon SVG | Icon bg | Icon stroke | Accent top colour | Trend |
|---|---|---|---|---|---|
| Today's Classes | calendar | `#EFF6FF` | `#2563EB` | `#3B82F6` | neutral grey |
| Pending Leaves | `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>` | `#FFFBEB` | `#D97706` | `#F59E0B` | orange if >0 |
| Book Requisitions | book icon | `#F0FDF4` | `#059669` | `#10B981` | green |
| Print Jobs Active | printer icon | `#F5F3FF` | `#7C3AED` | `#8B5CF6` | purple |
| Attendance Rate | `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>` | `#ECFDF5` | `#059669` | `#10B981` | green if ≥85% |

---

## 6 — Section Cards (White Cards)

Replace all content section wrappers with this card style:

```jsx
<div style={{
  background: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  overflow: 'hidden',
  marginBottom: '20px'
}}>
  {/* Card header */}
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #F1F5F9'
  }}>
    <div>
      <h2 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'Sora, sans-serif', color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
        Section Title
      </h2>
      {/* Optional subtitle */}
      <p style={{ fontSize: '13px', color: '#64748B', fontFamily: 'Inter, sans-serif', margin: '2px 0 0' }}>
        42 records
      </p>
    </div>
    {/* Action buttons go here */}
    <div style={{ display: 'flex', gap: '8px' }} />
  </div>

  {/* Card body */}
  <div style={{ padding: '0' }}>  {/* Tables go edge-to-edge; forms use padding: '20px' */}
    {/* content */}
  </div>
</div>
```

---

## 7 — Tables (Premium Style)

```jsx
<table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif' }}>
  <thead>
    <tr>
      <th style={{
        padding: '10px 20px',
        textAlign: 'left',
        fontSize: '11px',
        fontWeight: 600,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        whiteSpace: 'nowrap'
      }}>
        Column Name
      </th>
    </tr>
  </thead>
  <tbody>
    <tr
      className="hoverable"
      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s ease' }}
    >
      <td style={{ padding: '13px 20px', fontSize: '14px', color: '#0F172A', verticalAlign: 'middle' }}>
        Cell content
      </td>
    </tr>
  </tbody>
</table>
```

- First column of each data table should show the primary identifier (name/ID) in `fontWeight: 500, color: '#0F172A'`
- Secondary data columns use `color: '#475569'`
- Muted/metadata columns (dates, IDs) use `color: '#94A3B8', fontSize: '13px'`
- The last column (actions) should be right-aligned: `textAlign: 'right'`

---

## 8 — Buttons (Refined System)

All buttons get `transition: 'all 0.15s ease'` and an active press state via `onMouseDown` / `onMouseUp`.

**Primary button:**
```jsx
<button
  style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '7px 14px',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(37,99,235,0.3)',
    transition: 'all 0.15s ease'
  }}
  onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
  onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
>
  <svg width="14" height="14">…</svg>  {/* optional icon */}
  Add Lecturer
</button>
```

**Secondary button:**
```jsx
<button style={{
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: '#FFFFFF', color: '#374151',
  border: '1px solid #D1D5DB', borderRadius: '8px',
  padding: '7px 14px', fontSize: '13px',
  fontFamily: 'Inter, sans-serif', fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.15s ease'
}}
onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#9CA3AF'; }}
onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
>
  Export CSV
</button>
```

**Ghost/icon button (for row actions like Edit, View):**
```jsx
<button style={{
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '30px', height: '30px',
  background: 'transparent', border: '1px solid transparent',
  borderRadius: '7px', cursor: 'pointer',
  color: '#64748B', transition: 'all 0.15s ease'
}}
onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
>
  <svg width="15" height="15">…</svg>
</button>
```

**Danger button:**
```jsx
<button style={{
  background: '#FFFFFF', color: '#DC2626',
  border: '1px solid #FECACA', borderRadius: '8px',
  padding: '7px 14px', fontSize: '13px',
  fontFamily: 'Inter, sans-serif', fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.15s ease'
}}
onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#FECACA'; }}
>
  Delete
</button>
```

---

## 9 — Status Badges (Refined Pills)

Remove all text-only badges and replace with these. Each badge has an SVG dot and text:

```jsx
// Active / Present / Paid / Approved
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  background: '#ECFDF5', color: '#059669',
  borderRadius: '5px', padding: '2px 8px',
  fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
  border: '1px solid #A7F3D0'
}}>
  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
  Active
</span>

// Pending / Warning / Partial
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  background: '#FFFBEB', color: '#D97706',
  borderRadius: '5px', padding: '2px 8px',
  fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
  border: '1px solid #FDE68A'
}}>
  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
  Pending
</span>

// Danger / Absent / Overdue / Rejected
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  background: '#FEF2F2', color: '#DC2626',
  borderRadius: '5px', padding: '2px 8px',
  fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
  border: '1px solid #FECACA'
}}>
  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
  Absent
</span>

// Info / In Progress / Processing
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  background: '#F0F9FF', color: '#0284C7',
  borderRadius: '5px', padding: '2px 8px',
  fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
  border: '1px solid #BAE6FD'
}}>
  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0EA5E9', flexShrink: 0 }} />
  In Progress
</span>

// Neutral / Inactive / Scheduled
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  background: '#F8FAFC', color: '#475569',
  borderRadius: '5px', padding: '2px 8px',
  fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
  border: '1px solid #E2E8F0'
}}>
  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
  Inactive
</span>
```

---

## 10 — Form Inputs (Polished)

All form inputs, selects, and textareas:

```jsx
// Text input
<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
  <label style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#374151' }}>
    Full Name
  </label>
  <input
    type="text"
    placeholder="Enter full name"
    style={{
      height: '36px',
      border: '1px solid #D1D5DB',
      borderRadius: '8px',
      padding: '0 12px',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      color: '#0F172A',
      background: '#FFFFFF',
      transition: 'all 0.15s ease',
      outline: 'none'
    }}
    onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
    onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
  />
</div>

// Select dropdown
<select style={{
  height: '36px', border: '1px solid #D1D5DB', borderRadius: '8px',
  padding: '0 32px 0 12px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
  color: '#0F172A', background: '#FFFFFF url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748B\' stroke-width=\'2\' stroke-linecap=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E") no-repeat right 10px center',
  appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none', transition: 'all 0.15s ease'
}} />
```

Form sections use a 2-column grid on desktop:

```jsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
  {/* form fields */}
</div>
```

---

## 11 — Modal (Refined)

```jsx
{/* Backdrop */}
<div style={{
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.3)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px'
}}>

  {/* Modal panel */}
  <div style={{
    background: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)',
    width: '100%', maxWidth: '520px',
    maxHeight: '90vh', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    animation: 'fadeIn 0.15s ease'
  }}>

    {/* Modal header */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px 16px',
      borderBottom: '1px solid #F1F5F9'
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Sora, sans-serif', color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
        Modal Title
      </h3>
      {/* Close button */}
      <button style={{
        width: '28px', height: '28px', borderRadius: '7px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#64748B', transition: 'all 0.15s ease'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    {/* Modal body */}
    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
      {/* form / content */}
    </div>

    {/* Modal footer */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px',
      padding: '16px 24px',
      borderTop: '1px solid #F1F5F9',
      background: '#FAFAFA'
    }}>
      <button /* secondary */>Cancel</button>
      <button /* primary */>Save</button>
    </div>

  </div>
</div>
```

---

## 12 — Tab Navigation (Inside Sections)

For pages with tabs (Fee Management, Student Management, etc.):

```jsx
<div style={{
  display: 'flex',
  gap: '2px',
  padding: '4px',
  background: '#F1F5F9',
  borderRadius: '10px',
  width: 'fit-content',
  marginBottom: '20px'
}}>
  {/* Active tab */}
  <button style={{
    padding: '6px 14px', borderRadius: '7px',
    background: '#FFFFFF', color: '#0F172A',
    border: 'none', cursor: 'pointer',
    fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all 0.15s ease'
  }}>
    Overview
  </button>
  {/* Inactive tab */}
  <button style={{
    padding: '6px 14px', borderRadius: '7px',
    background: 'transparent', color: '#64748B',
    border: 'none', cursor: 'pointer',
    fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
    transition: 'all 0.15s ease'
  }}
  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    History
  </button>
</div>
```

---

## 13 — Empty States

When a table or section has no data, replace the bare "No data" text with:

```jsx
<div style={{
  padding: '60px 24px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  textAlign: 'center'
}}>
  <div style={{
    width: '48px', height: '48px', borderRadius: '12px',
    background: '#F1F5F9',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Use the section's icon here */}
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  </div>
  <div>
    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px', fontFamily: 'Sora, sans-serif' }}>No students yet</p>
    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, fontFamily: 'Inter, sans-serif' }}>Add your first student to get started.</p>
  </div>
  <button /* primary */>Add Student</button>
</div>
```

---

## 14 — Login Page (Premium Redesign)

The login page is the first impression. Replace it entirely with:

```jsx
<div style={{
  minHeight: '100vh',
  display: 'flex',
  background: '#0A1628'
}}>

  {/* Left panel — brand */}
  <div style={{
    width: '45%',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '48px',
    background: 'linear-gradient(135deg, #0A1628 0%, #0F2044 60%, #1a3a70 100%)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Background decoration */}
    <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(59,130,246,0.06)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(59,130,246,0.04)', pointerEvents: 'none' }} />

    {/* Logo */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(59,130,246,0.35)'
      }}>
        <span style={{ color: 'white', fontSize: '18px', fontWeight: 700, fontFamily: 'Sora, sans-serif' }}>P</span>
      </div>
      <div>
        <div style={{ color: '#F8FAFC', fontSize: '16px', fontWeight: 700, fontFamily: 'Sora, sans-serif', letterSpacing: '-0.01em' }}>Platinum Business Academy</div>
        <div style={{ color: '#475569', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>Administration Portal</div>
      </div>
    </div>

    {/* Centre tagline */}
    <div style={{ position: 'relative', zIndex: 1 }}>
      <h1 style={{ fontSize: '36px', fontWeight: 700, fontFamily: 'Sora, sans-serif', color: '#F8FAFC', margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
        Manage your academy<br/>with confidence.
      </h1>
      <p style={{ fontSize: '15px', color: '#64748B', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>
        Everything your team needs — students, attendance, fees, printing, and communications — in one place.
      </p>
    </div>

    {/* Bottom stat row */}
    <div style={{ display: 'flex', gap: '32px', position: 'relative', zIndex: 1 }}>
      {[['3', 'Branches'], ['500+', 'Students'], ['50+', 'Staff']].map(([val, label]) => (
        <div key={label}>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Sora, sans-serif', color: '#F8FAFC', letterSpacing: '-0.02em' }}>{val}</div>
          <div style={{ fontSize: '12px', color: '#475569', fontFamily: 'Inter, sans-serif' }}>{label}</div>
        </div>
      ))}
    </div>

  </div>

  {/* Right panel — login form */}
  <div style={{
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#F1F5F9',
    padding: '48px'
  }}>
    <div style={{ width: '100%', maxWidth: '380px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Sora, sans-serif', color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
        Welcome back
      </h2>
      <p style={{ fontSize: '14px', color: '#64748B', fontFamily: 'Inter, sans-serif', margin: '0 0 32px' }}>
        Sign in to your account to continue.
      </p>

      {/* Error message (if any) */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px',
          padding: '10px 14px', marginBottom: '20px'
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: '13px', color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>{error}</span>
        </div>
      )}

      {/* Username */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: 'Inter, sans-serif', marginBottom: '6px' }}>Username</label>
        <input type="text" placeholder="Enter your username"
          style={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: '9px', padding: '0 14px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#0F172A', background: '#FFFFFF', outline: 'none', transition: 'all 0.15s ease', boxSizing: 'border-box' }} />
      </div>

      {/* Password */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: 'Inter, sans-serif', marginBottom: '6px' }}>Password</label>
        <input type="password" placeholder="Enter your password"
          style={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: '9px', padding: '0 14px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#0F172A', background: '#FFFFFF', outline: 'none', transition: 'all 0.15s ease', boxSizing: 'border-box' }} />
      </div>

      {/* Sign in button */}
      <button style={{
        width: '100%', height: '42px',
        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        color: '#FFFFFF', border: 'none', borderRadius: '9px',
        fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 600,
        cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.45)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.35)'}
      >
        Sign In
      </button>

      {/* Quick demo logins */}
      <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
        <p style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'Inter, sans-serif', textAlign: 'center', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Quick Demo Login
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Admin', username: 'admin', password: 'admin123' },
            { label: 'Coordinator', username: 'coordinator.kohuwala', password: 'coord123' },
            { label: 'Lecturer', username: 'lecturer1', password: 'lect123' },
            { label: 'Student', username: 'student001', password: 'student123' },
          ].map(({ label, username, password }) => (
            <button key={label}
              onClick={async () => { setUsername(username); setPassword(password); await handleLogin(username, password); }}
              style={{
                padding: '7px 12px', background: '#FFFFFF', border: '1px solid #E2E8F0',
                borderRadius: '8px', fontSize: '12px', fontFamily: 'Inter, sans-serif',
                fontWeight: 500, color: '#374151', cursor: 'pointer', transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

    </div>
  </div>

</div>
```

---

## Summary of What Changes

After applying this prompt, the portal should look and feel like a premium SaaS product:

- **Sidebar**: Deep navy with gradient logo area, proper SVG icons (not emoji), coloured active-item indicator, role badge, and a user footer with name and email
- **Header**: Frosted glass blur effect, expanding search bar, icon-only notification button with a small dot badge, clean user chip
- **Stat tiles**: Lift-on-hover with a coloured top accent line, coloured icon box, and trend indicator badges
- **Cards**: Tighter header with title + subtitle, edge-to-edge tables, no internal padding waste
- **Tables**: Cleaner row density, header with small-caps label style, proper text hierarchy per column
- **Buttons**: Gradient primary, subtle secondary, ghost icon buttons for row actions — all with hover, press, and transition states
- **Status badges**: Bordered pill with coloured dot — not just background colour
- **Forms**: Focus ring with blue glow, custom select arrow
- **Modals**: Blurred backdrop, rounded-corner panel, soft footer background, clean close button
- **Tabs**: Pill-group style (not underline tabs)
- **Empty states**: Illustrated empty state with icon, heading, body, and a CTA
- **Login page**: Split layout — dark brand panel on left, clean form on right
- **Micro-interactions**: Every interactive element transitions on hover and presses on click

Do not change any data, logic, localStorage keys, routing, or functional behaviour. Only replace styles.
