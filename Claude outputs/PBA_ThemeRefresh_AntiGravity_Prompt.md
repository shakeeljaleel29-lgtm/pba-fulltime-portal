# PBA Full-Time Portal — Theme Refresh & Notification Fix
## AntiGravity Prompt — Phase 6: Charcoal · Blue · Golden Yellow

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
You are upgrading the PBA Full-Time Portal with two critical changes:

1. FIX the notification panel — it must be hidden by default and only appear as a dropdown
2. REPLACE the entire color scheme with a Charcoal · Steel Blue · Golden Yellow palette

Do not rebuild any feature logic. Only change visual styles and the notification panel state. Apply changes across ALL components.

════════════════════════════════════════════════════════════════
SECTION 1 — NEW COLOR TOKEN SYSTEM (replace the old `theme` object everywhere it appears)
════════════════════════════════════════════════════════════════

Find every file that contains the old `theme` constant and replace it with this exact object:

const theme = {
  // Backgrounds
  pageBg:        '#F4F5F7',      // cool light grey page
  sidebarBg:     '#1C1F26',      // deep charcoal (not navy)
  sidebarHover:  '#2A2F3A',      // charcoal hover
  sidebarActive: '#2A2F3A',      // charcoal active row
  cardBg:        '#FFFFFF',
  cardBorder:    '#E3E6EA',

  // Accent — Steel Blue
  accent:        '#2B6CB0',      // primary blue
  accentLight:   '#EBF4FF',      // blue tint background
  accentDark:    '#1A4A8A',      // blue pressed/hover

  // Golden Yellow — premium highlight
  gold:          '#D4A017',      // rich golden yellow (text, icons)
  goldLight:     '#FEF3C7',      // golden tint background
  goldBorder:    '#F6D860',      // golden border
  goldDark:      '#B7860A',      // golden hover

  // Sidebar text
  sidebarText:   '#A8B0C0',      // muted sidebar text
  sidebarTextActive: '#FFFFFF',  // active sidebar text

  // Typography
  textPrimary:   '#1A202C',
  textSecondary: '#4A5568',
  textMuted:     '#718096',

  // Semantic
  success:       '#2F855A',
  successLight:  '#F0FFF4',
  warning:       '#C05621',
  warningLight:  '#FFFAF0',
  danger:        '#C53030',
  dangerLight:   '#FFF5F5',
  info:          '#2B6CB0',
  infoLight:     '#EBF4FF',
};

════════════════════════════════════════════════════════════════
SECTION 2 — TYPOGRAPHY TOKENS (replace existing `type` object if present)
════════════════════════════════════════════════════════════════

const type = {
  fontHeading: "'Sora', 'Inter', sans-serif",
  fontBody:    "'Inter', 'Segoe UI', sans-serif",
  size: {
    xs:   '11px',
    sm:   '13px',
    base: '14px',
    md:   '15px',
    lg:   '18px',
    xl:   '22px',
    '2xl':'28px',
    '3xl':'36px',
  },
  weight: { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
  leading: { tight: 1.2, normal: 1.5, relaxed: 1.7 },
};

════════════════════════════════════════════════════════════════
SECTION 3 — GLOBALS CSS (replace the entire globals.css / index.css)
════════════════════════════════════════════════════════════════

@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --page-bg:      #F4F5F7;
  --card-bg:      #FFFFFF;
  --accent:       #2B6CB0;
  --gold:         #D4A017;
  --gold-light:   #FEF3C7;
  --sidebar-bg:   #1C1F26;
  --text-primary: #1A202C;
  --text-muted:   #718096;
  --radius:       10px;
  --shadow-sm:    0 1px 3px rgba(0,0,0,0.08);
  --shadow-md:    0 4px 16px rgba(0,0,0,0.10);
  --shadow-lg:    0 8px 32px rgba(0,0,0,0.14);
}

html, body, #root {
  height: 100%;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  font-size: 14px;
  background: var(--page-bg);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 { font-family: 'Sora', 'Inter', sans-serif; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #A0AEC0; }

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeSlideIn 0.22s ease both; }

@keyframes pulseGold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212,160,23,0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(212,160,23,0); }
}

════════════════════════════════════════════════════════════════
SECTION 4 — SIDEBAR (full restyle with charcoal + golden active state)
════════════════════════════════════════════════════════════════

Replace the sidebar inline styles with these exact values:

Outer sidebar container:
  width: 240px, minWidth: 240px, height: '100vh',
  background: theme.sidebarBg,           // #1C1F26 charcoal
  borderRight: '1px solid #2A2F3A',
  display: 'flex', flexDirection: 'column',
  position: 'sticky', top: 0,
  boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
  zIndex: 100

Logo / brand zone at top of sidebar:
  padding: '24px 20px 20px',
  borderBottom: '1px solid #2A2F3A'

Logo text (PBA):
  fontFamily: type.fontHeading,
  fontSize: '22px', fontWeight: 800,
  color: theme.gold,                      // GOLDEN YELLOW for logo text
  letterSpacing: '-0.5px'

Logo sub-text ("Full-Time Portal"):
  fontSize: '11px', color: theme.sidebarText,
  fontWeight: 500, letterSpacing: '0.5px',
  textTransform: 'uppercase', marginTop: '2px'

Nav items — DEFAULT state:
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '9px 16px', margin: '1px 8px',
  borderRadius: '8px', cursor: 'pointer',
  color: theme.sidebarText,               // #A8B0C0
  fontSize: type.size.sm,
  fontWeight: type.weight.medium,
  transition: 'all 0.15s ease',
  userSelect: 'none'

Nav items — ACTIVE state (add these on top of default):
  background: 'linear-gradient(135deg, #2B6CB0 0%, #1A4A8A 100%)',  // blue gradient
  color: '#FFFFFF',
  fontWeight: type.weight.semibold,
  boxShadow: '0 2px 8px rgba(43,108,176,0.35)'

Nav items — HOVER state (not active):
  background: theme.sidebarHover,
  color: '#FFFFFF'

Section label (MAIN / ADMINISTRATION):
  padding: '16px 20px 6px',
  fontSize: '10px', fontWeight: 700,
  color: '#4A5568',
  letterSpacing: '1.2px', textTransform: 'uppercase'

User footer zone (bottom of sidebar):
  marginTop: 'auto',
  borderTop: '1px solid #2A2F3A',
  padding: '16px 20px',
  display: 'flex', alignItems: 'center', gap: '12px'

User avatar circle in footer:
  width: 34px, height: 34px,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #D4A017, #B7860A)',  // golden gradient
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#FFFFFF', fontSize: '13px', fontWeight: 700

User name in footer:
  fontSize: type.size.sm, fontWeight: type.weight.semibold,
  color: '#FFFFFF'

User role in footer:
  fontSize: type.size.xs, color: theme.sidebarText

════════════════════════════════════════════════════════════════
SECTION 5 — HEADER (frosted glass, keep structure, update colors)
════════════════════════════════════════════════════════════════

Header container:
  height: 60px,
  background: 'rgba(244,245,247,0.88)',
  backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
  borderBottom: '1px solid rgba(227,230,234,0.9)',
  padding: '0 28px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  position: 'sticky', top: 0, zIndex: 200,
  boxShadow: '0 1px 12px rgba(0,0,0,0.06)'

Page title in header:
  fontFamily: type.fontHeading,
  fontSize: type.size.lg, fontWeight: type.weight.bold,
  color: theme.textPrimary

Search bar:
  background: '#FFFFFF',
  border: '1px solid #E3E6EA',
  borderRadius: '8px',
  padding: '7px 14px',
  fontSize: type.size.sm,
  color: theme.textPrimary,
  outline: 'none',
  width: '220px',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'

Search bar focus (add onFocus/onBlur handlers):
  border: '1px solid #2B6CB0',
  boxShadow: '0 0 0 3px rgba(43,108,176,0.12)'

════════════════════════════════════════════════════════════════
SECTION 6 — CRITICAL NOTIFICATION PANEL FIX
════════════════════════════════════════════════════════════════

THIS IS THE MOST IMPORTANT FIX. The notification panel is currently always visible as a banner on every page. Fix it completely:

STEP 1 — Find the state that controls notification visibility. It will look like one of these:
  const [showNotifications, setShowNotifications] = useState(true)
  const [showNotifications, setShowNotifications] = useState(1)
  const [notifOpen, setNotifOpen] = useState(true)
  or any variable name that evaluates to truthy on first render

CHANGE IT TO:
  const [showNotifications, setShowNotifications] = useState(false)

STEP 2 — Remove any useEffect that auto-opens the notification panel. Delete any code like:
  useEffect(() => { setShowNotifications(true); }, [])
  useEffect(() => { setNotifOpen(true); }, [])

STEP 3 — The notification panel must render as a FLOATING DROPDOWN, not a banner. Replace whatever wrapper the notification panel sits in with this structure:

  {/* Bell icon button in header */}
  <div style={{ position: 'relative' }}>
    <button
      onClick={() => setShowNotifications(prev => !prev)}
      style={{
        position: 'relative', background: 'none', border: 'none',
        cursor: 'pointer', padding: '6px', borderRadius: '8px',
        color: theme.textSecondary,
        transition: 'background 0.15s'
      }}
    >
      {/* Bell SVG icon */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      {/* Red badge dot */}
      <span style={{
        position: 'absolute', top: '4px', right: '4px',
        width: '8px', height: '8px', borderRadius: '50%',
        background: '#E53E3E',
        border: '2px solid white'
      }} />
    </button>

    {/* Dropdown panel — only renders when showNotifications is true */}
    {showNotifications && (
      <div style={{
        position: 'absolute', top: '44px', right: 0,
        width: '340px',
        background: '#FFFFFF',
        border: '1px solid #E3E6EA',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        zIndex: 500,
        overflow: 'hidden',
        animation: 'fadeSlideIn 0.18s ease both'
      }}>
        {/* Panel header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #E3E6EA',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{
            fontFamily: type.fontHeading,
            fontSize: type.size.base, fontWeight: type.weight.semibold,
            color: theme.textPrimary
          }}>Notifications</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button style={{
              fontSize: type.size.xs, color: theme.accent,
              background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: type.weight.medium
            }}>Mark all read</button>
            <button
              onClick={() => setShowNotifications(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: theme.textMuted, fontSize: '18px', lineHeight: 1,
                padding: '0 2px'
              }}
            >×</button>
          </div>
        </div>

        {/* Notification items list */}
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {/* Map over your notifications array here — keep the existing data */}
          {notifications.map((notif, i) => (
            <div key={i} style={{
              padding: '12px 18px',
              borderBottom: i < notifications.length - 1 ? '1px solid #F4F5F7' : 'none',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              background: notif.read ? '#FFFFFF' : theme.goldLight,
              cursor: 'pointer',
              transition: 'background 0.12s'
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: notif.read ? '#CBD5E0' : theme.gold,
                marginTop: '5px', flexShrink: 0
              }} />
              <div>
                <div style={{
                  fontSize: type.size.sm, fontWeight: type.weight.medium,
                  color: theme.textPrimary, lineHeight: 1.4
                }}>{notif.message || notif.text || notif.title}</div>
                <div style={{
                  fontSize: type.size.xs, color: theme.textMuted, marginTop: '3px'
                }}>{notif.time || notif.date || ''}</div>
              </div>
            </div>
          ))}
          {(!notifications || notifications.length === 0) && (
            <div style={{
              padding: '32px 18px', textAlign: 'center',
              color: theme.textMuted, fontSize: type.size.sm
            }}>No notifications</div>
          )}
        </div>
      </div>
    )}
  </div>

STEP 4 — Add a click-outside handler to close the panel when clicking elsewhere:
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e) => {
      if (!e.target.closest('[data-notif-panel]')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  Add data-notif-panel attribute to the outer <div style={{position:'relative'}}> that wraps the bell:
    <div style={{ position: 'relative' }} data-notif-panel>

════════════════════════════════════════════════════════════════
SECTION 7 — STAT TILES (dashboard KPI cards)
════════════════════════════════════════════════════════════════

Each stat tile card:
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '20px 22px',
  border: '1px solid #E3E6EA',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  cursor: 'default'

On hover (onMouseEnter/onMouseLeave):
  transform: 'translateY(-2px)',
  boxShadow: '0 6px 20px rgba(0,0,0,0.10)'

Stat tile icon box — GOLDEN for primary metrics (Total Students, Revenue):
  width: 46px, height: 46px, borderRadius: '10px',
  background: theme.goldLight,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
  Icon color: theme.gold

Stat tile icon box — BLUE for secondary metrics (Attendance, Active Courses):
  background: theme.accentLight
  Icon color: theme.accent

Stat value number:
  fontSize: type.size['2xl'], fontWeight: type.weight.extrabold,
  color: theme.textPrimary, fontFamily: type.fontHeading,
  letterSpacing: '-0.5px'

Stat label:
  fontSize: type.size.sm, color: theme.textSecondary,
  fontWeight: type.weight.medium, marginTop: '4px'

Trend badge (positive):
  background: '#F0FFF4', color: '#276749',
  padding: '2px 8px', borderRadius: '20px',
  fontSize: type.size.xs, fontWeight: type.weight.semibold

Trend badge (negative):
  background: '#FFF5F5', color: '#9B2C2C'

════════════════════════════════════════════════════════════════
SECTION 8 — SECTION CARDS (white content panels)
════════════════════════════════════════════════════════════════

Every section card wrapper:
  background: theme.cardBg,
  borderRadius: '14px',
  border: '1px solid #E3E6EA',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  overflow: 'hidden',
  marginBottom: '20px'

Card header bar (title + action buttons row):
  padding: '18px 22px',
  borderBottom: '1px solid #F4F5F7',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: '#FFFFFF'

Card header title:
  fontFamily: type.fontHeading,
  fontSize: type.size.md, fontWeight: type.weight.semibold,
  color: theme.textPrimary

Card body (content area inside card):
  padding: '20px 22px'

════════════════════════════════════════════════════════════════
SECTION 9 — TABLES
════════════════════════════════════════════════════════════════

Table element:
  width: '100%', borderCollapse: 'collapse'

Table header row (thead tr):
  background: '#F8F9FA'

Table header cells (th):
  padding: '10px 16px',
  fontSize: type.size.xs, fontWeight: type.weight.semibold,
  color: theme.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.8px',
  borderBottom: '2px solid #E3E6EA',
  whiteSpace: 'nowrap', textAlign: 'left'

Table data cells (td):
  padding: '13px 16px',
  fontSize: type.size.sm, color: theme.textPrimary,
  borderBottom: '1px solid #F4F5F7',
  verticalAlign: 'middle'

Table row hover:
  background: '#F8FAFE'   // very light blue tint on hover

════════════════════════════════════════════════════════════════
SECTION 10 — BUTTONS
════════════════════════════════════════════════════════════════

PRIMARY button (main CTA — blue):
  background: 'linear-gradient(135deg, #2B6CB0 0%, #1A4A8A 100%)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  padding: '9px 18px',
  fontSize: type.size.sm, fontWeight: type.weight.semibold,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(43,108,176,0.30)',
  transition: 'all 0.15s ease'
Hover: opacity 0.88, transform translateY(-1px)

GOLDEN button (for premium actions like "Print Receipt", "Export"):
  background: 'linear-gradient(135deg, #D4A017 0%, #B7860A 100%)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  padding: '9px 18px',
  fontSize: type.size.sm, fontWeight: type.weight.semibold,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(212,160,23,0.30)',
  transition: 'all 0.15s ease'

SECONDARY button (ghost/outline):
  background: '#FFFFFF',
  color: theme.accent,
  border: '1.5px solid #BEE3F8',
  borderRadius: '8px',
  padding: '8px 18px',
  fontSize: type.size.sm, fontWeight: type.weight.semibold,
  cursor: 'pointer',
  transition: 'all 0.15s ease'
Hover: background #EBF4FF

DANGER button:
  background: 'linear-gradient(135deg, #C53030, #9B2C2C)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  padding: '9px 18px',
  fontSize: type.size.sm, fontWeight: type.weight.semibold,
  cursor: 'pointer'

Small icon button (square icon-only):
  width: 32px, height: 32px,
  borderRadius: '7px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid #E3E6EA',
  background: '#FFFFFF', cursor: 'pointer',
  transition: 'all 0.15s'
Hover: background #F4F5F7

════════════════════════════════════════════════════════════════
SECTION 11 — STATUS BADGES
════════════════════════════════════════════════════════════════

All status badges pattern — colored dot + text in pill:

Active / Paid / Present:
  background: '#F0FFF4', color: '#276749',
  border: '1px solid #9AE6B4',
  padding: '3px 10px', borderRadius: '20px',
  fontSize: type.size.xs, fontWeight: type.weight.semibold,
  display: 'inline-flex', alignItems: 'center', gap: '5px'
  Dot: 6px circle, background #38A169

Inactive / Unpaid / Absent:
  background: '#FFF5F5', color: '#9B2C2C',
  border: '1px solid #FEB2B2'
  Dot: background #E53E3E

Pending / Warning:
  background: '#FFFBEB', color: '#92400E',
  border: '1px solid #FCD34D'
  Dot: background #D97706

GOLDEN badge — for top students, VIP status, featured items:
  background: theme.goldLight,
  color: theme.goldDark,
  border: '1px solid #F6D860',
  padding: '3px 10px', borderRadius: '20px',
  fontSize: type.size.xs, fontWeight: type.weight.semibold

Stock badges in Book Catalogue:
  High stock (>30): green pill
  Medium stock (10–30): golden yellow pill (background: theme.goldLight, color: theme.goldDark, border: '1px solid #F6D860')
  Low stock (<10): red pill

════════════════════════════════════════════════════════════════
SECTION 12 — TAB NAVIGATION (pill group style)
════════════════════════════════════════════════════════════════

Tab group container:
  display: 'flex', gap: '4px',
  background: '#EEF0F4',
  padding: '4px',
  borderRadius: '10px',
  width: 'fit-content'

Individual tab — INACTIVE:
  padding: '7px 16px', borderRadius: '7px',
  fontSize: type.size.sm, fontWeight: type.weight.medium,
  color: theme.textSecondary,
  cursor: 'pointer', border: 'none',
  background: 'transparent',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap'

Individual tab — ACTIVE:
  background: '#FFFFFF',
  color: theme.accent,                     // blue active text
  fontWeight: type.weight.semibold,
  boxShadow: '0 1px 4px rgba(0,0,0,0.10)'

════════════════════════════════════════════════════════════════
SECTION 13 — FORMS & INPUTS
════════════════════════════════════════════════════════════════

All input / select / textarea:
  width: '100%',
  padding: '9px 13px',
  background: '#FFFFFF',
  border: '1.5px solid #E3E6EA',
  borderRadius: '8px',
  fontSize: type.size.sm,
  color: theme.textPrimary,
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: type.fontBody

onFocus styles (use onFocus/onBlur state handlers):
  borderColor: theme.accent,
  boxShadow: '0 0 0 3px rgba(43,108,176,0.12)'

Label above input:
  fontSize: type.size.xs,
  fontWeight: type.weight.semibold,
  color: theme.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: '5px',
  display: 'block'

Form section group:
  marginBottom: '18px'

════════════════════════════════════════════════════════════════
SECTION 14 — MODAL DIALOGS
════════════════════════════════════════════════════════════════

Modal backdrop:
  position: 'fixed', inset: 0,
  background: 'rgba(10,15,28,0.55)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  animation: 'fadeSlideIn 0.18s ease both'

Modal panel:
  background: '#FFFFFF',
  borderRadius: '16px',
  padding: '28px',
  width: '100%', maxWidth: '520px',
  boxShadow: '0 24px 64px rgba(0,0,0,0.20)',
  position: 'relative',
  animation: 'fadeSlideIn 0.20s ease both'

Modal title:
  fontFamily: type.fontHeading,
  fontSize: type.size.xl, fontWeight: type.weight.bold,
  color: theme.textPrimary, marginBottom: '6px'

Modal subtitle:
  fontSize: type.size.sm, color: theme.textSecondary, marginBottom: '22px'

Modal close button (top-right):
  position: 'absolute', top: '18px', right: '18px',
  width: '32px', height: '32px', borderRadius: '8px',
  background: '#F4F5F7', border: 'none',
  cursor: 'pointer', fontSize: '18px', color: theme.textMuted,
  display: 'flex', alignItems: 'center', justifyContent: 'center'

Modal footer (button row):
  display: 'flex', justifyContent: 'flex-end', gap: '10px',
  marginTop: '24px', paddingTop: '18px',
  borderTop: '1px solid #F4F5F7'

════════════════════════════════════════════════════════════════
SECTION 15 — SPECIAL GOLDEN YELLOW HIGHLIGHTS
════════════════════════════════════════════════════════════════

Apply golden yellow to these specific elements to give the portal its premium, distinguished character:

1. SIDEBAR LOGO — PBA text: color: theme.gold (#D4A017)

2. USER AVATAR in sidebar footer: golden gradient background

3. TOP STUDENT / #1 RANK in Examinations:
   Row background: theme.goldLight (#FEF3C7)
   Rank badge: background theme.gold, color white, borderRadius 6px, padding '2px 8px'

4. FEE TOTALS — "Total Collected" figure:
   color: theme.gold, fontWeight 800

5. EXPORT / PRINT RECEIPT buttons: use the GOLDEN button style from Section 10

6. "PREMIUM" or "FEATURED" badges anywhere: golden badge style from Section 11

7. ACTIVE nav item left border accent — add:
   boxShadow: 'inset 3px 0 0 #D4A017, 0 2px 8px rgba(43,108,176,0.35)'
   (golden left stripe + blue glow on active sidebar item)

8. DASHBOARD WELCOME banner (if present):
   background: 'linear-gradient(135deg, #1C1F26 0%, #2A3548 100%)',
   color white heading, golden yellow subtext

9. CALENDAR today's date circle:
   background: theme.gold, color white

10. NOTIFICATION dot badge on bell: keep red (#E53E3E) for urgency

════════════════════════════════════════════════════════════════
SECTION 16 — PAGE LAYOUT SHELL
════════════════════════════════════════════════════════════════

Root app shell (outermost div):
  display: 'flex', height: '100vh', overflow: 'hidden',
  background: theme.pageBg,
  fontFamily: type.fontBody

Main content area (right of sidebar):
  flex: 1, display: 'flex', flexDirection: 'column',
  overflow: 'hidden', minWidth: 0

Scrollable page body (below sticky header):
  flex: 1, overflowY: 'auto',
  padding: '24px 28px',
  background: theme.pageBg

Page section title (H2 level within a page):
  fontFamily: type.fontHeading,
  fontSize: type.size.xl, fontWeight: type.weight.bold,
  color: theme.textPrimary, marginBottom: '6px'

Page subtitle / description:
  fontSize: type.size.sm, color: theme.textSecondary, marginBottom: '24px'

Breadcrumb (if present):
  fontSize: type.size.xs, color: theme.textMuted,
  display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '20px'

════════════════════════════════════════════════════════════════
SECTION 17 — EMPTY STATES
════════════════════════════════════════════════════════════════

Empty state container:
  padding: '56px 24px', textAlign: 'center',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px'

Empty state icon circle:
  width: 64px, height: 64px, borderRadius: '50%',
  background: theme.goldLight,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
  Icon: 28px, color: theme.gold

Empty state heading:
  fontFamily: type.fontHeading,
  fontSize: type.size.lg, fontWeight: type.weight.semibold,
  color: theme.textPrimary

Empty state sub-text:
  fontSize: type.size.sm, color: theme.textSecondary,
  maxWidth: '300px', lineHeight: 1.6

Empty state CTA button: use PRIMARY button style

════════════════════════════════════════════════════════════════
SECTION 18 — TOAST / ALERT NOTIFICATIONS
════════════════════════════════════════════════════════════════

Toast container (fixed, bottom-right):
  position: 'fixed', bottom: '24px', right: '24px',
  zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px'

Individual toast:
  background: '#1C1F26',
  color: '#FFFFFF',
  borderRadius: '10px',
  padding: '13px 18px',
  minWidth: '280px', maxWidth: '360px',
  display: 'flex', alignItems: 'center', gap: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.20)',
  animation: 'fadeSlideIn 0.2s ease both',
  borderLeft: '4px solid #D4A017'    // golden left stripe on all toasts

Toast success variant: borderLeft '4px solid #38A169'
Toast error variant: borderLeft '4px solid #E53E3E'
Toast warning variant: borderLeft '4px solid #D4A017'   // golden

════════════════════════════════════════════════════════════════
SECTION 19 — LOGIN PAGE
════════════════════════════════════════════════════════════════

Login page root (full screen, split panel):
  display: 'flex', height: '100vh', overflow: 'hidden'

LEFT panel (brand):
  width: '45%', minWidth: '360px',
  background: 'linear-gradient(160deg, #1C1F26 0%, #0D1117 60%, #1A2744 100%)',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  padding: '60px 48px'

LEFT panel — PBA logo text:
  fontFamily: type.fontHeading,
  fontSize: '48px', fontWeight: 800,
  color: theme.gold, letterSpacing: '-1px'

LEFT panel — subtitle:
  fontSize: type.size.lg, color: 'rgba(255,255,255,0.7)',
  marginTop: '8px', fontWeight: 500

LEFT panel — tagline:
  fontSize: type.size.sm, color: 'rgba(255,255,255,0.45)',
  marginTop: '16px', maxWidth: '280px', textAlign: 'center', lineHeight: 1.7

LEFT panel — decorative golden divider line:
  width: '48px', height: '3px',
  background: 'linear-gradient(90deg, #D4A017, #F6D860)',
  borderRadius: '2px', margin: '20px auto'

RIGHT panel (form):
  flex: 1,
  background: '#FFFFFF',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '60px 48px'

Form container (centered card):
  width: '100%', maxWidth: '400px'

Form heading:
  fontFamily: type.fontHeading,
  fontSize: type.size['2xl'], fontWeight: type.weight.bold,
  color: theme.textPrimary, marginBottom: '8px'

Form subheading:
  fontSize: type.size.sm, color: theme.textSecondary, marginBottom: '32px'

Submit button (full width, golden-accented):
  width: '100%',
  background: 'linear-gradient(135deg, #2B6CB0 0%, #1A4A8A 100%)',
  color: '#FFFFFF', border: 'none',
  borderRadius: '10px', padding: '13px',
  fontSize: type.size.md, fontWeight: type.weight.bold,
  cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(43,108,176,0.35)',
  transition: 'all 0.15s ease',
  letterSpacing: '0.3px'

════════════════════════════════════════════════════════════════
FINAL INSTRUCTIONS
════════════════════════════════════════════════════════════════

1. Apply ALL sections above. Do not skip any section.

2. The MOST CRITICAL change is Section 6 — the notification panel MUST default to hidden (useState(false)) and only appear as a floating dropdown when the bell icon is clicked. Remove all existing code that makes it display as a persistent banner.

3. Replace the `theme` constant in every component file that imports or defines it.

4. The golden yellow (#D4A017) should feel premium and deliberate — used for the logo, avatar gradients, top-rank highlights, key number emphasis, and the left-border accent on active nav items. It should not be overused.

5. The charcoal sidebar (#1C1F26) replaces the previous deep navy sidebar.

6. The overall page background remains a cool light grey (#F4F5F7) — not white, not navy — giving the portal an airy, modern feel.

7. Keep ALL existing functionality, data, logic, and routing exactly as-is. This is a visual-only pass.

8. After applying changes, confirm which files were modified.
```
