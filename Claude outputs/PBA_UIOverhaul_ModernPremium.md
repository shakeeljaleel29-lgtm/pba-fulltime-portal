# PBA Full-Time Portal — Modern Premium UI Overhaul
## AntiGravity Prompt — Full Design System Upgrade

---

```
Complete visual overhaul of the PBA Full-Time Portal to a Modern Premium design system.
This replaces ALL existing inline style values across the entire app.
Target feel: Linear / Vercel / Notion — polished, sharp, professional.

════════════════════════════════════════════════════════════════
STEP 1 — FONT: Replace Sora + Inter with Plus Jakarta Sans
════════════════════════════════════════════════════════════════

In index.html (or wherever Google Fonts is loaded), replace existing font links with:

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

In the global CSS (index.css or App.css), set:

  * {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    box-sizing: border-box;
  }

  body {
    background: #F0F4FF;
    margin: 0;
    padding: 0;
    color: #0F172A;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

════════════════════════════════════════════════════════════════
STEP 2 — DESIGN TOKENS (add to a shared file: src/theme.js)
════════════════════════════════════════════════════════════════

Create src/theme.js and export:

  export const T = {
    // Colours
    navy:        '#0F172A',
    navyMid:     '#1E293B',
    navyLight:   '#334155',
    slate:       '#475569',
    slateLight:  '#64748B',
    muted:       '#94A3B8',
    border:      '#E2E8F0',
    borderLight: '#F1F5F9',
    pageBg:      '#F0F4FF',
    white:       '#FFFFFF',

    // Primary — Indigo
    primary:     '#4F46E5',
    primaryHov:  '#4338CA',
    primaryLight:'#EEF2FF',
    primaryGrad: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    primaryShadow:'0 4px 14px rgba(79,70,229,0.35)',

    // Accent — Amber
    accent:      '#F59E0B',
    accentLight: '#FEF3C7',
    accentText:  '#92400E',

    // Status
    success:     '#10B981',
    successLight:'#ECFDF5',
    successText: '#065F46',
    danger:      '#EF4444',
    dangerLight: '#FEF2F2',
    dangerText:  '#991B1B',
    warning:     '#F59E0B',
    warningLight:'#FFFBEB',
    warningText: '#92400E',
    info:        '#3B82F6',
    infoLight:   '#EFF6FF',
    infoText:    '#1E40AF',

    // Sidebar
    sidebarBg:   'linear-gradient(180deg, #0F172A 0%, #1A2744 100%)',
    sidebarActiveGlow: 'rgba(99,102,241,0.18)',
    sidebarActiveBorder: '#6366F1',
    sidebarText:  '#94A3B8',
    sidebarTextActive: '#F8FAFC',

    // Card
    cardBg:      '#FFFFFF',
    cardBorder:  'rgba(226,232,240,0.8)',
    cardRadius:  '16px',
    cardShadow:  '0 2px 16px rgba(0,0,0,0.06)',
    cardShadowHov:'0 8px 32px rgba(79,70,229,0.1)',
    cardPad:     '20px 24px',

    // Typography
    fontXs:  '10px',
    fontSm:  '11px',
    fontBase:'13px',
    fontMd:  '14px',
    fontLg:  '16px',
    fontXl:  '18px',
    font2xl: '22px',
    font3xl: '28px',
  };

════════════════════════════════════════════════════════════════
STEP 3 — SIDEBAR (full replacement)
════════════════════════════════════════════════════════════════

Replace ALL sidebar inline styles with:

SIDEBAR CONTAINER:
  <aside style={{
    width: '240px',
    minHeight: '100vh',
    background: T.sidebarBg,
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0, top: 0, bottom: 0,
    zIndex: 100,
    boxShadow: '4px 0 24px rgba(0,0,0,0.15)'
  }}>

LOGO / BRAND AREA (top of sidebar):
  <div style={{
    padding: '24px 20px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '36px', height: '36px',
        background: T.primaryGrad,
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: 800, color: '#FFFFFF',
        boxShadow: T.primaryShadow
      }}>P</div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC',
          letterSpacing: '-0.3px' }}>PBA</div>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748B',
          textTransform: 'uppercase', letterSpacing: '0.6px' }}>Full-Time Portal</div>
      </div>
    </div>
    {/* Branch badge */}
    <div style={{
      marginTop: '12px',
      background: 'rgba(99,102,241,0.15)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: '8px',
      padding: '6px 10px',
      fontSize: '11px', fontWeight: 700, color: '#A5B4FC',
      display: 'inline-block'
    }}>All Branches</div>
  </div>

SECTION LABELS:
  <div style={{
    fontSize: '10px', fontWeight: 700, color: '#334155',
    textTransform: 'uppercase', letterSpacing: '0.8px',
    padding: '20px 20px 6px'
  }}>MAIN</div>

NAV ITEMS (inactive):
  <a style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 16px', margin: '1px 8px',
    borderRadius: '10px', cursor: 'pointer',
    color: '#94A3B8', fontSize: '13px', fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    background: 'transparent'
  }}>

NAV ITEMS (active):
  <a style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 16px', margin: '1px 8px',
    borderRadius: '10px', cursor: 'pointer',
    color: '#F8FAFC', fontSize: '13px', fontWeight: 700,
    textDecoration: 'none',
    background: 'rgba(99,102,241,0.18)',
    borderLeft: '3px solid #6366F1',
    paddingLeft: '13px'
  }}>

NAV ITEM ICON BOX (for items that have notification badges):
  <span style={{
    marginLeft: 'auto',
    background: '#EF4444',
    color: '#FFFFFF',
    fontSize: '10px', fontWeight: 800,
    borderRadius: '10px', padding: '1px 6px',
    minWidth: '18px', textAlign: 'center'
  }}>{count}</span>

USER AREA (bottom of sidebar):
  <div style={{
    marginTop: 'auto',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: '10px'
  }}>
    <div style={{
      width: '34px', height: '34px', borderRadius: '50%',
      background: T.primaryGrad,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
      flexShrink: 0
    }}>{userInitials}</div>
    <div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC',
        maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' }}>{userName}</div>
      <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 500 }}>{userRole}</div>
    </div>
  </div>

════════════════════════════════════════════════════════════════
STEP 4 — TOP HEADER BAR
════════════════════════════════════════════════════════════════

  <header style={{
    position: 'fixed', top: 0, left: '240px', right: 0,
    height: '60px',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(226,232,240,0.8)',
    boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
    display: 'flex', alignItems: 'center',
    padding: '0 28px',
    gap: '16px',
    zIndex: 99
  }}>

  Page title in header:
    <h1 style={{
      fontSize: '17px', fontWeight: 800, color: '#0F172A',
      margin: 0, letterSpacing: '-0.4px'
    }}>{pageTitle}</h1>

  Search input:
    <div style={{
      flex: 1, maxWidth: '360px',
      position: 'relative', marginLeft: 'auto'
    }}>
      <span style={{
        position: 'absolute', left: '12px', top: '50%',
        transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '14px'
      }}>🔍</span>
      <input style={{
        width: '100%', padding: '8px 12px 8px 34px',
        background: '#F8FAFC', border: '1px solid #E2E8F0',
        borderRadius: '10px', fontSize: '13px', color: '#0F172A',
        outline: 'none', boxSizing: 'border-box'
      }} placeholder="Search..." />
    </div>

  Branch dropdown (header):
    <select style={{
      padding: '8px 12px', background: '#F8FAFC',
      border: '1px solid #E2E8F0', borderRadius: '10px',
      fontSize: '13px', fontWeight: 600, color: '#0F172A',
      cursor: 'pointer', outline: 'none'
    }}>

  Notification bell:
    <div style={{ position: 'relative', cursor: 'pointer' }}>
      <span style={{ fontSize: '20px' }}>🔔</span>
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: '-4px', right: '-4px',
          background: '#EF4444', color: '#FFFFFF',
          fontSize: '9px', fontWeight: 800,
          borderRadius: '10px', padding: '1px 5px',
          minWidth: '16px', textAlign: 'center'
        }}>{unreadCount}</span>
      )}
    </div>

  User avatar (header):
    <div style={{
      width: '34px', height: '34px', borderRadius: '50%',
      background: T.primaryGrad,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
      cursor: 'pointer', flexShrink: 0,
      boxShadow: '0 2px 8px rgba(79,70,229,0.3)'
    }}>{userInitials}</div>

════════════════════════════════════════════════════════════════
STEP 5 — PAGE CONTENT AREA
════════════════════════════════════════════════════════════════

  Main content wrapper:
    <main style={{
      marginLeft: '240px',
      marginTop: '60px',
      padding: '28px 32px',
      minHeight: 'calc(100vh - 60px)',
      background: '#F0F4FF'
    }}>

  Page header section (top of each page):
    <div style={{ marginBottom: '28px' }}>
      <h1 style={{
        fontSize: '22px', fontWeight: 800, color: '#0F172A',
        margin: '0 0 4px', letterSpacing: '-0.5px'
      }}>{pageTitle}</h1>
      <p style={{
        fontSize: '13px', color: '#64748B', margin: 0, fontWeight: 400
      }}>{pageSubtitle}</p>
    </div>

════════════════════════════════════════════════════════════════
STEP 6 — CARDS
════════════════════════════════════════════════════════════════

STANDARD CARD:
  <div style={{
    background: '#FFFFFF',
    border: '1px solid rgba(226,232,240,0.8)',
    borderRadius: '16px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
    padding: '20px 24px',
    transition: 'box-shadow 0.2s ease'
  }}>

CARD with hover (interactive cards):
  Add onMouseEnter/onMouseLeave to change boxShadow:
  hover → '0 8px 32px rgba(79,70,229,0.1)'
  normal → '0 2px 16px rgba(0,0,0,0.05)'

CARD HEADER (inside card):
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '16px',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9'
  }}>
    <h3 style={{
      fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0
    }}>{cardTitle}</h3>
  </div>

STAT / KPI CARD:
  <div style={{
    background: '#FFFFFF',
    border: '1px solid rgba(226,232,240,0.8)',
    borderRadius: '16px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
    padding: '20px 22px',
    display: 'flex', alignItems: 'flex-start', gap: '14px'
  }}>
    {/* Coloured icon box */}
    <div style={{
      width: '46px', height: '46px', borderRadius: '12px',
      background: iconBgColor,  // e.g. '#EEF2FF' for indigo, '#ECFDF5' for green
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '20px', flexShrink: 0
    }}>{icon}</div>
    <div>
      <div style={{
        fontSize: '26px', fontWeight: 800, color: '#0F172A',
        letterSpacing: '-0.5px', lineHeight: 1.1
      }}>{value}</div>
      <div style={{
        fontSize: '11px', fontWeight: 600, color: '#94A3B8',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px'
      }}>{label}</div>
      {trend && (
        <div style={{
          fontSize: '11px', fontWeight: 600, marginTop: '4px',
          color: trend > 0 ? '#10B981' : '#EF4444'
        }}>
          {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  </div>

════════════════════════════════════════════════════════════════
STEP 7 — BUTTONS
════════════════════════════════════════════════════════════════

PRIMARY BUTTON (gradient indigo):
  <button style={{
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px', fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap'
  }}>

GHOST BUTTON (secondary):
  <button style={{
    padding: '9px 18px',
    background: '#FFFFFF',
    color: '#475569',
    border: '1.5px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap'
  }}>

DANGER BUTTON (red ghost):
  <button style={{
    padding: '9px 18px',
    background: 'transparent',
    color: '#EF4444',
    border: '1.5px solid #FECACA',
    borderRadius: '10px',
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    whiteSpace: 'nowrap'
  }}>

AMBER / GOLD BUTTON (export, print):
  <button style={{
    padding: '9px 18px',
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px', fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    whiteSpace: 'nowrap'
  }}>

SMALL ICON BUTTON (edit, delete, view in table rows):
  <button style={{
    padding: '6px 12px',
    background: '#F8FAFC',
    color: '#475569',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '12px', fontWeight: 600,
    cursor: 'pointer'
  }}>

════════════════════════════════════════════════════════════════
STEP 8 — TAB NAVIGATION
════════════════════════════════════════════════════════════════

Tab container:
  <div style={{
    display: 'flex',
    gap: '2px',
    borderBottom: '1px solid #E2E8F0',
    marginBottom: '24px',
    overflowX: 'auto'
  }}>

Inactive tab:
  <button style={{
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#64748B',
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'all 0.15s ease'
  }}>

Active tab:
  <button style={{
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid #4F46E5',
    color: '#4F46E5',
    fontSize: '13px', fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex', alignItems: 'center', gap: '6px'
  }}>

════════════════════════════════════════════════════════════════
STEP 9 — TABLES
════════════════════════════════════════════════════════════════

Table wrapper:
  <div style={{
    background: '#FFFFFF',
    border: '1px solid rgba(226,232,240,0.8)',
    borderRadius: '16px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
    overflow: 'hidden'
  }}>

Table element:
  <table style={{
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  }}>

Table header row:
  <thead>
    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
      <th style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '10px', fontWeight: 700, color: '#64748B',
        textTransform: 'uppercase', letterSpacing: '0.6px',
        whiteSpace: 'nowrap'
      }}>COLUMN HEADER</th>
    </tr>
  </thead>

Table body rows:
  <tr style={{
    borderBottom: '1px solid #F1F5F9',
    transition: 'background 0.1s ease'
  }}
  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFF'}
  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <td style={{ padding: '12px 16px', color: '#1E293B' }}>value</td>
  </tr>

════════════════════════════════════════════════════════════════
STEP 10 — FORM INPUTS
════════════════════════════════════════════════════════════════

Field label:
  <label style={{
    display: 'block',
    fontSize: '10px', fontWeight: 700, color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    marginBottom: '6px'
  }}>LABEL</label>

Text input / select:
  <input style={{
    width: '100%',
    padding: '10px 14px',
    background: '#F8FAFC',
    border: '1.5px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '13px', color: '#0F172A',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box'
  }}
  onFocus={e => e.target.style.borderColor = '#6366F1'}
  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
  />

Textarea:
  <textarea style={{
    width: '100%',
    padding: '10px 14px',
    background: '#F8FAFC',
    border: '1.5px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '13px', color: '#0F172A',
    outline: 'none', resize: 'vertical',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: 'border-box'
  }} />

Modal container:
  <div style={{
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px'
  }}>
    <div style={{
      background: '#FFFFFF',
      borderRadius: '20px',
      boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      width: '100%', maxWidth: '520px',
      maxHeight: '90vh', overflowY: 'auto'
    }}>
      {/* Modal header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <h2 style={{
          fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0
        }}>{modalTitle}</h2>
        <button style={{
          background: '#F1F5F9', border: 'none',
          borderRadius: '8px', width: '28px', height: '28px',
          cursor: 'pointer', fontSize: '16px', color: '#64748B',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>×</button>
      </div>
      {/* Modal body */}
      <div style={{ padding: '20px 24px' }}>
        {/* form fields */}
      </div>
      {/* Modal footer */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid #F1F5F9',
        display: 'flex', justifyContent: 'flex-end', gap: '10px'
      }}>
        {/* Cancel and Save buttons */}
      </div>
    </div>
  </div>

════════════════════════════════════════════════════════════════
STEP 11 — PILLS / BADGES
════════════════════════════════════════════════════════════════

STATUS PILLS (use these consistently for ALL status indicators):

  Active / Success:
    background: '#ECFDF5', color: '#065F46',
    border: '1px solid #A7F3D0', borderRadius: '20px',
    padding: '3px 10px', fontSize: '11px', fontWeight: 700

  Inactive / Cancelled:
    background: '#FEF2F2', color: '#991B1B',
    border: '1px solid #FECACA', borderRadius: '20px',
    padding: '3px 10px', fontSize: '11px', fontWeight: 700

  Pending / Warning:
    background: '#FFFBEB', color: '#92400E',
    border: '1px solid #FDE68A', borderRadius: '20px',
    padding: '3px 10px', fontSize: '11px', fontWeight: 700

  Info / Upcoming:
    background: '#EFF6FF', color: '#1E40AF',
    border: '1px solid #BFDBFE', borderRadius: '20px',
    padding: '3px 10px', fontSize: '11px', fontWeight: 700

  Purple / Indigo:
    background: '#EEF2FF', color: '#3730A3',
    border: '1px solid #C7D2FE', borderRadius: '20px',
    padding: '3px 10px', fontSize: '11px', fontWeight: 700

STREAM BADGES (subject stream indicators):
  compulsory / CORE → bg: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA'
  science / SCI     → bg: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0'
  commerce / COM    → bg: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A'
  elective / ELC    → bg: '#EEF2FF', color: '#3730A3', border: '1px solid #C7D2FE'

  All stream badges:
    borderRadius: '6px', padding: '2px 7px',
    fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '0.4px'

BRANCH PILL:
  background: '#EFF6FF', color: '#1E40AF',
  border: '1px solid #BFDBFE', borderRadius: '20px',
  padding: '3px 10px', fontSize: '11px', fontWeight: 600

════════════════════════════════════════════════════════════════
STEP 12 — TOAST NOTIFICATIONS
════════════════════════════════════════════════════════════════

Success toast:
  <div style={{
    position: 'fixed', bottom: '24px', right: '24px',
    background: '#0F172A',
    color: '#F8FAFC',
    padding: '14px 20px',
    borderRadius: '12px',
    fontSize: '13px', fontWeight: 600,
    boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
    display: 'flex', alignItems: 'center', gap: '10px',
    zIndex: 9999, maxWidth: '360px',
    animation: 'slideUp 0.2s ease'
  }}>
    <span style={{
      width: '24px', height: '24px', borderRadius: '6px',
      background: '#10B981',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '13px', flexShrink: 0
    }}>✓</span>
    {message}
  </div>

Add keyframe in CSS:
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

════════════════════════════════════════════════════════════════
STEP 13 — EMPTY STATES
════════════════════════════════════════════════════════════════

When a table or list has no data:
  <div style={{
    padding: '48px 24px',
    textAlign: 'center'
  }}>
    <div style={{
      width: '56px', height: '56px', borderRadius: '16px',
      background: '#EEF2FF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '24px', margin: '0 auto 16px'
    }}>📋</div>
    <div style={{
      fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '6px'
    }}>No {itemLabel} yet</div>
    <div style={{
      fontSize: '13px', color: '#94A3B8', marginBottom: '20px'
    }}>Get started by adding your first {itemLabel.toLowerCase()}.</div>
    {/* Optional: primary action button */}
  </div>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Apply these styles ACROSS THE ENTIRE APP — every page, every tab,
   every modal, every table, every button. This is a full design system
   replacement, not a partial update.
2. Plus Jakarta Sans must be loaded in index.html — check it is present
   before touching any component.
3. ALL old style values referencing Sora font, #2B6CB0 blue, #1C1F26 sidebar,
   #F4F5F7 page background, or #D4A017 gold must be replaced with the
   new token values above.
4. Use only inline style={{}} — no Tailwind.
5. safeLS() for all localStorage reads — do NOT change any data logic.
6. Do NOT change any state management, data structures, or business logic.
   ONLY visual styles change.
7. Run npm run build and confirm 0 errors.
8. List all files modified.
```
