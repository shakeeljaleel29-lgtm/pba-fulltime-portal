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

// Legacy Theme Alias for backwards compatibility across older components
export const theme = {
  ...T,
  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textMuted:     '#94A3B8',
  accent:        '#4F46E5',
  accentLight:   '#EEF2FF',
  accentDark:    '#4338CA',
  gold:          '#F59E0B',
  goldLight:     '#FEF3C7',
  goldBorder:    '#FDE68A',
  goldDark:      '#D97706',
  sidebarHover:  'rgba(255,255,255,0.06)',
  sidebarActive: 'rgba(99,102,241,0.18)',
  cardBorder:    'rgba(226,232,240,0.8)',
  cardBg:        '#FFFFFF',
  pageBg:        '#F0F4FF',
  success:       '#10B981',
  successLight:  '#ECFDF5',
  warning:       '#F59E0B',
  warningLight:  '#FFFBEB',
  danger:        '#EF4444',
  dangerLight:   '#FEF2F2',
  info:          '#3B82F6',
  infoLight:     '#EFF6FF',
};

export const type = {
  fontHeading: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontBody:    "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  size: {
    xs:   '10px',
    sm:   '11px',
    base: '13px',
    md:   '14px',
    lg:   '16px',
    xl:   '18px',
    '2xl':'22px',
    '3xl':'28px',
  },
  weight: { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
  leading: { tight: 1.2, normal: 1.5, relaxed: 1.7 },
};
