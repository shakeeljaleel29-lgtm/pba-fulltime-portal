# PBA Full-Time Portal — Mobile Responsive Layout
## AntiGravity Prompt

---

```
Make the PBA Full-Time Portal fully mobile-responsive.
Currently the sidebar and layout are fixed for desktop only.
Touch only the layout files and shared components listed below.
Do NOT change any page logic, localStorage, or feature code.

════════════════════════════════════════════════════════════════
BREAKPOINTS TO USE THROUGHOUT
════════════════════════════════════════════════════════════════

const isMobile = window.innerWidth < 768;
const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

Add this hook at the top of App.jsx and pass isMobile as a prop
where needed, OR use it inline per component:

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

════════════════════════════════════════════════════════════════
FIX 1 — SIDEBAR: Hamburger drawer on mobile
════════════════════════════════════════════════════════════════

On DESKTOP (≥ 768px): Sidebar stays fixed on the left, 240px wide.
No change to desktop behaviour.

On MOBILE (< 768px):
  - Sidebar is HIDDEN by default (translateX(-100%))
  - A hamburger button ☰ appears in the top-left of the header
  - Tapping ☰ slides the sidebar in from the left (translateX(0))
  - A dark overlay covers the rest of the screen; tapping it closes the sidebar
  - Sidebar closes automatically when a nav item is tapped

State in App.jsx (or Sidebar.jsx parent):
  const [sidebarOpen, setSidebarOpen] = useState(false);

Sidebar style on mobile:
  position: 'fixed',
  top: 0, left: 0, bottom: 0,
  width: '260px',
  transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
  transition: 'transform 0.25s ease',
  zIndex: 1000,
  // all existing sidebar styles remain

Overlay (render only when sidebarOpen && isMobile):
  <div
    onClick={() => setSidebarOpen(false)}
    style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.5)',
      zIndex: 999,
      backdropFilter: 'blur(2px)'
    }}
  />

════════════════════════════════════════════════════════════════
FIX 2 — TOP HEADER: Hamburger button + compact layout
════════════════════════════════════════════════════════════════

On mobile, add a hamburger button at the left of the header:
  <button
    onClick={() => setSidebarOpen(true)}
    style={{
      display: isMobile ? 'flex' : 'none',
      alignItems: 'center', justifyContent: 'center',
      width: '36px', height: '36px',
      background: 'none', border: 'none',
      cursor: 'pointer', color: '#1A202C',
      fontSize: '20px', marginRight: '8px'
    }}
  >☰</button>

On mobile, HIDE the search bar (it takes too much space):
  <div style={{ display: isMobile ? 'none' : 'flex', ... }}>
    {/* existing search bar */}
  </div>

On mobile, keep only: hamburger + page title + notification bell + avatar

════════════════════════════════════════════════════════════════
FIX 3 — MAIN CONTENT AREA: Remove fixed left offset on mobile
════════════════════════════════════════════════════════════════

In App.jsx, the main content wrapper currently has:
  marginLeft: '240px', marginTop: '60px'

Change to:
  marginLeft: isMobile ? '0' : '240px',
  marginTop: '60px',
  padding: isMobile ? '16px' : '28px 32px',
  minHeight: 'calc(100vh - 60px)',
  background: '#F0F4FF'

════════════════════════════════════════════════════════════════
FIX 4 — CARD GRIDS: Single column on mobile
════════════════════════════════════════════════════════════════

Any grid layout using display: 'grid' with multiple columns
(e.g. gridTemplateColumns: 'repeat(3, 1fr)' or 'repeat(4, 1fr)')
should become single column on mobile:

  gridTemplateColumns: isMobile
    ? '1fr'
    : 'repeat(auto-fill, minmax(220px, 1fr))',

Apply this to:
  - Dashboard KPI stat cards row
  - Batch cards grid
  - Classroom cards grid
  - Any other card grid in the portal

════════════════════════════════════════════════════════════════
FIX 5 — TABLES: Horizontal scroll wrapper
════════════════════════════════════════════════════════════════

Wrap every <table> element in a scroll container:

  <div style={{
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    borderRadius: '12px'
  }}>
    <table style={{ minWidth: '600px', width: '100%', ... }}>
      ...
    </table>
  </div>

This applies to ALL tables across ALL pages.
Do not change the table structure itself — just wrap it.

════════════════════════════════════════════════════════════════
FIX 6 — MODALS: Full width on mobile
════════════════════════════════════════════════════════════════

All modal inner containers currently have a fixed width (e.g. 560px, 600px).
Change to:

  width: isMobile ? '95vw' : '560px',  // (or whatever the original width is)
  maxWidth: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  margin: isMobile ? '20px auto' : 'auto',

Modal overlay should always be:
  position: 'fixed', inset: 0,
  display: 'flex',
  alignItems: isMobile ? 'flex-start' : 'center',
  justifyContent: 'center',
  padding: isMobile ? '20px 12px' : '0',
  overflowY: 'auto'

════════════════════════════════════════════════════════════════
FIX 7 — BUTTONS & TAP TARGETS
════════════════════════════════════════════════════════════════

All buttons must have a minimum height of 40px on mobile for
comfortable tapping. Add to all button styles:

  minHeight: isMobile ? '40px' : undefined,

Tab navigation pills / buttons should wrap on mobile:
  flexWrap: 'wrap',
  gap: '6px'

════════════════════════════════════════════════════════════════
FIX 8 — TIMETABLE GRID: Horizontal scroll on mobile
════════════════════════════════════════════════════════════════

The Visual Timetable Builder grid (day columns × time rows) is
the most complex layout. On mobile:

  Wrap the entire timetable grid in:
  <div style={{
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch'
  }}>
    <div style={{ minWidth: '700px' }}>
      {/* existing timetable grid */}
    </div>
  </div>

This allows the user to scroll horizontally to see all day columns.

════════════════════════════════════════════════════════════════
FIX 9 — LOGIN PAGE: Mobile layout
════════════════════════════════════════════════════════════════

The login page card should be full-width on mobile:

  width: isMobile ? '100%' : '420px',
  minHeight: isMobile ? '100vh' : 'auto',
  borderRadius: isMobile ? '0' : '20px',
  padding: isMobile ? '32px 24px' : '40px',

════════════════════════════════════════════════════════════════
FIX 10 — STAT ROWS: Stack vertically on mobile
════════════════════════════════════════════════════════════════

Any row of stats/pills displayed using display: 'flex' with
flexDirection: 'row' that might overflow on small screens:

  flexDirection: isMobile ? 'column' : 'row',
  flexWrap: 'wrap',

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any localStorage logic, feature code, or data
2. Use only inline style={{}} — no Tailwind
3. Use the isMobile hook (window.innerWidth < 768) throughout
4. The sidebar hamburger toggle state must be in App.jsx and
   passed as props to both Sidebar and TopHeader
5. On any nav item click (sidebar), setSidebarOpen(false) must fire
6. Run npm run build and confirm 0 errors
7. List all files modified
```
