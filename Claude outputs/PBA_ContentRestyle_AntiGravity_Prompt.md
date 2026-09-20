# PBA Full-Time Portal — Content Area Restyle
## AntiGravity Prompt — Phase 6B: Cards, Tables, Buttons, Tabs

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
The sidebar and header are correctly styled. The content area components still look like plain unstyled text. This prompt restyles only the page content — cards, tables, buttons, tabs, badges — across every page. Do not touch the sidebar or header.

Use these constants in every file you modify (add them at the top of each component file if not already present):

const theme = {
  pageBg: '#F4F5F7', cardBg: '#FFFFFF', cardBorder: '#E3E6EA',
  accent: '#2B6CB0', accentLight: '#EBF4FF', accentDark: '#1A4A8A',
  gold: '#D4A017', goldLight: '#FEF3C7', goldDark: '#B7860A', goldBorder: '#F6D860',
  textPrimary: '#1A202C', textSecondary: '#4A5568', textMuted: '#718096',
  success: '#2F855A', successLight: '#F0FFF4', successBorder: '#9AE6B4',
  danger: '#C53030', dangerLight: '#FFF5F5', dangerBorder: '#FEB2B2',
  warning: '#92400E', warningLight: '#FFFBEB', warningBorder: '#FCD34D',
};
const t = { fontHeading: "'Sora','Inter',sans-serif", fontBody: "'Inter','Segoe UI',sans-serif" };

════════════════════════════════════════════════════════════════
PATTERN A — SECTION CARD WRAPPER
Apply this to EVERY major content block on every page
════════════════════════════════════════════════════════════════

Every group of related content (an exam entry, a list of books, a fee summary, a student record group) must be wrapped in a card:

<div style={{
  background: theme.cardBg,
  border: '1px solid ' + theme.cardBorder,
  borderRadius: '14px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  overflow: 'hidden',
  marginBottom: '16px'
}}>
  {/* Card header — title row */}
  <div style={{
    padding: '16px 22px',
    borderBottom: '1px solid #F4F5F7',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#FFFFFF'
  }}>
    <span style={{
      fontFamily: t.fontHeading,
      fontSize: '15px', fontWeight: 600,
      color: theme.textPrimary
    }}>Card Title Here</span>
    {/* Action buttons go here */}
  </div>
  {/* Card body */}
  <div style={{ padding: '20px 22px' }}>
    {/* Content here */}
  </div>
</div>

════════════════════════════════════════════════════════════════
PATTERN B — PAGE SECTION HEADER (above the cards)
════════════════════════════════════════════════════════════════

The page-level title and action button row that sits above the cards:

<div style={{
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: '20px'
}}>
  <div>
    <h2 style={{
      fontFamily: t.fontHeading,
      fontSize: '20px', fontWeight: 700,
      color: theme.textPrimary, margin: 0
    }}>Section Title</h2>
    <p style={{
      fontSize: '13px', color: theme.textMuted, marginTop: '3px'
    }}>Subtitle or description</p>
  </div>
  {/* Primary action button */}
</div>

════════════════════════════════════════════════════════════════
PATTERN C — PILL-GROUP TAB NAVIGATION
Apply to ALL tab groups on ALL pages
════════════════════════════════════════════════════════════════

Tab container:
<div style={{
  display: 'flex', gap: '4px',
  background: '#EEF0F4',
  padding: '4px', borderRadius: '10px',
  width: 'fit-content', marginBottom: '20px'
}}>

Each tab button — INACTIVE:
  style={{
    padding: '8px 18px', borderRadius: '7px',
    fontSize: '13px', fontWeight: 500,
    color: theme.textSecondary,
    border: 'none', background: 'transparent',
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.15s'
  }}

Each tab button — ACTIVE (currently selected):
  style={{
    padding: '8px 18px', borderRadius: '7px',
    fontSize: '13px', fontWeight: 600,
    color: theme.accent,
    border: 'none', background: '#FFFFFF',
    cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
    transition: 'all 0.15s'
  }}

Apply this tab pattern to:
- Examinations: "Scheduled Examinations (2)" | "Exam Calendar View"
- Book Catalogue: "Textbook Catalogue" | "Requisitions (1)" | "Printing Queue Board" | "Student Book Issues"
- Students: "Student Database" | "Digital Attendance Register"
- Any other page with tabs

════════════════════════════════════════════════════════════════
PATTERN D — BUTTON STYLES
Replace ALL plain bordered/grey buttons throughout the entire app
════════════════════════════════════════════════════════════════

PRIMARY button (blue — main actions: Schedule New Exam, Register New Student, Add New Textbook, Save, Submit):
  style={{
    background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
    color: '#FFFFFF', border: 'none',
    borderRadius: '8px', padding: '9px 18px',
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(43,108,176,0.30)',
    display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'all 0.15s'
  }}

GOLDEN button (premium actions: Print Results PDF, Export CSV, Print Receipt, Export):
  style={{
    background: 'linear-gradient(135deg, #D4A017, #B7860A)',
    color: '#FFFFFF', border: 'none',
    borderRadius: '8px', padding: '9px 18px',
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(212,160,23,0.28)',
    display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'all 0.15s'
  }}

SECONDARY button (ghost — Edit Marks, Enter Marks, View, Parent Link, Profile, Cancel):
  style={{
    background: '#FFFFFF',
    color: theme.accent,
    border: '1.5px solid #BEE3F8',
    borderRadius: '8px', padding: '8px 16px',
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  }}

DANGER button (Delete, Remove):
  style={{
    background: 'linear-gradient(135deg, #C53030, #9B2C2C)',
    color: '#FFFFFF', border: 'none',
    borderRadius: '8px', padding: '8px 16px',
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer'
  }}

WHATSAPP button (WA):
  style={{
    background: '#25D366',
    color: '#FFFFFF', border: 'none',
    borderRadius: '8px', padding: '7px 12px',
    fontSize: '12px', fontWeight: 600,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '4px'
  }}

SMALL icon-only button (square, e.g. filter, export icons):
  style={{
    width: '34px', height: '34px', borderRadius: '8px',
    background: '#FFFFFF', border: '1px solid ' + theme.cardBorder,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: theme.textSecondary,
    transition: 'all 0.15s'
  }}

════════════════════════════════════════════════════════════════
PATTERN E — TABLE STYLING
Apply to ALL tables across ALL pages
════════════════════════════════════════════════════════════════

Table element:
  style={{ width: '100%', borderCollapse: 'collapse' }}

Table header row (thead > tr):
  style={{ background: '#F8F9FA' }}

Table header cells (th):
  style={{
    padding: '10px 16px',
    fontSize: '11px', fontWeight: 700,
    color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.8px',
    borderBottom: '2px solid ' + theme.cardBorder,
    textAlign: 'left', whiteSpace: 'nowrap'
  }}

Table data cells (td):
  style={{
    padding: '13px 16px',
    fontSize: '13px', color: theme.textPrimary,
    borderBottom: '1px solid #F4F5F7',
    verticalAlign: 'middle'
  }}

Add onMouseEnter/onMouseLeave to each tr in tbody:
  onMouseEnter: e => e.currentTarget.style.background = '#F8FAFE'
  onMouseLeave: e => e.currentTarget.style.background = 'transparent'

════════════════════════════════════════════════════════════════
PATTERN F — STATUS & STOCK BADGES
Replace ALL plain "Active", "Paid", "45 Copies" text with styled pills
════════════════════════════════════════════════════════════════

Active / Present / Paid — GREEN pill:
  <span style={{
    background: theme.successLight, color: theme.success,
    border: '1px solid ' + theme.successBorder,
    padding: '3px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', gap: '5px'
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38A169', display: 'inline-block' }} />
    Active
  </span>

Inactive / Absent / Unpaid — RED pill:
  Same structure with: background dangerLight, color danger, border dangerBorder, dot #E53E3E

Pending / Warning — AMBER pill:
  background warningLight, color warning, border warningBorder, dot #D97706

STOCK COUNT badges in Book Catalogue:
  High stock (>30 copies):
    <span style={{ background: theme.successLight, color: theme.success, border: '1px solid ' + theme.successBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>45 Copies</span>
  
  Medium stock (10–30 copies):
    <span style={{ background: theme.goldLight, color: theme.goldDark, border: '1px solid ' + theme.goldBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>18 Copies</span>
  
  Low stock (<10 copies):
    <span style={{ background: theme.dangerLight, color: theme.danger, border: '1px solid ' + theme.dangerBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>4 Copies</span>

GRADE badges in Examinations:
  A / A+:
    <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>A</span>
  B:
    <span style={{ background: theme.accentLight, color: theme.accentDark, border: '1px solid #BEE3F8', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>B</span>
  C:
    <span style={{ background: theme.warningLight, color: theme.warning, border: '1px solid ' + theme.warningBorder, padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>C</span>

════════════════════════════════════════════════════════════════
PATTERN G — NOTIFICATION BADGES ON SIDEBAR ITEMS
════════════════════════════════════════════════════════════════

The red number badges on Lecturers (1), Book Catalogue (1), Printing Queue (1) nav items:
  <span style={{
    background: '#E53E3E',
    color: '#FFFFFF',
    fontSize: '10px', fontWeight: 700,
    padding: '1px 6px', borderRadius: '10px',
    marginLeft: 'auto',
    minWidth: '18px', textAlign: 'center',
    lineHeight: '16px'
  }}>1</span>

════════════════════════════════════════════════════════════════
SPECIFIC COMPONENT: EXAMINATIONS PAGE
════════════════════════════════════════════════════════════════

Apply these changes to ExaminationsView.jsx (or equivalent):

1. Tabs container → use PATTERN C above for "Scheduled Examinations (2)" | "Exam Calendar View"

2. "+ Schedule New Exam" button → PRIMARY blue button style from PATTERN D

3. Each exam entry card (Mid-Term Examination 2026, Accounting Mock Test 1, etc.) → wrap in PATTERN A card with:
   Card header: exam title (bold, 16px, textPrimary) + exam type badge on right

   Exam type badge:
     "Term Test": background #EBF4FF, color #2B6CB0, border '1px solid #BEE3F8'
     "Mock Exam": background #FFFBEB, color #92400E, border '1px solid #FCD34D'
     style: padding '3px 10px', borderRadius '6px', fontSize '11px', fontWeight 700

   Below header in card body:
     Meta row (Batch · Subject · Date · Time · Room · Invigilator) as small chips:
       Each piece of metadata: fontSize '12px', color textSecondary
       Separator dots between them: color textMuted
     
   "Class Rankings & Results Summary" heading inside the card body:
     fontSize '13px', fontWeight 700, color theme.accent, marginBottom '12px'
     textTransform 'uppercase', letterSpacing '0.6px'

4. Rankings table → use PATTERN E table styling, PLUS:
   #1 row: background theme.goldLight, and the rank cell shows a trophy icon or "🏆 #1" in gold
   The trophy rank badge:
     <span style={{ background: theme.gold, color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>🏆 #1</span>
   #2 and #3 rows: normal table row styling

5. Action buttons per exam card:
   "Print Results (PDF)" → GOLDEN button
   "Export CSV" → SECONDARY button
   "Edit Marks" → SECONDARY button
   "Enter Marks" → PRIMARY blue button

6. "No results logged yet for this examination session." empty state → center-aligned, color textMuted, fontStyle italic

════════════════════════════════════════════════════════════════
SPECIFIC COMPONENT: BOOK CATALOGUE PAGE
════════════════════════════════════════════════════════════════

Apply these changes to BookCatalogueView.jsx (or equivalent):

1. Tabs → PATTERN C for "Textbook Catalogue" | "Requisitions (1)" | "Printing Queue Board" | "Student Book Issues"
   Note: "Requisitions (1)" tab should show the count in a small red badge:
     <span style={{ background: '#E53E3E', color: '#FFF', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px', marginLeft: '4px' }}>1</span>

2. "+ Add New Textbook" button → PRIMARY blue button

3. Wrap the entire textbook table in PATTERN A card:
   Card header: "In-House Textbook Catalogue" (with book SVG icon) + "+ Add New Textbook" button

4. Textbook table → PATTERN E with columns: Book Title | Subject | Edition/Version | Stock Available
   "Stock Available" column → replace plain "45 Copies" text with STOCK COUNT badges from PATTERN F

5. Book title cells: fontWeight 600, color textPrimary
   Subject cells: color accent (blue), fontWeight 500
   Edition cells: color textSecondary

════════════════════════════════════════════════════════════════
SPECIFIC COMPONENT: STUDENT DATABASE PAGE
════════════════════════════════════════════════════════════════

Apply these changes to StudentDatabase.jsx (or equivalent):

1. Tabs → PATTERN C for "Student Database (5)" | "Digital Attendance Register"

2. Toolbar row (Export PDF, Export CSV, Register New Student, search, filters) → wrap in card header style:
   Export PDF → GOLDEN button
   Export CSV → SECONDARY button
   Register New Student → PRIMARY blue button
   Search input → styled input: background white, border '1px solid #E3E6EA', borderRadius '8px', padding '8px 12px', fontSize '13px'
   Dropdowns (All Batches, All Statuses) → same input style

3. Student table → PATTERN E table with:
   "Reg No" column: color accent, fontWeight 600, fontFamily monospace, fontSize '12px'
   "Status" column: Active/Inactive badges from PATTERN F
   Action buttons per row:
     WA → WHATSAPP button (green)
     Email → PRIMARY blue button (small: padding '6px 12px', fontSize '12px')
     Profile → SECONDARY button (small)
     Parent Link → SECONDARY button (small)

════════════════════════════════════════════════════════════════
SPECIFIC COMPONENT: FEE MANAGEMENT PAGE
════════════════════════════════════════════════════════════════

1. Wrap fee summary stats (Total Collected, Outstanding, etc.) in a stat tile row:
   Each stat tile: PATTERN A card (no header bar, just body), with:
   - Label: fontSize 12px, color textMuted, textTransform uppercase, letterSpacing 0.6px
   - Value: fontSize 28px, fontWeight 800, fontFamily Sora
     Total Collected value: color theme.gold (golden)
     Outstanding value: color theme.danger (red)
     Total Students: color theme.accent (blue)

2. Fee table → PATTERN E
   "Amount" cells for paid: color theme.success, fontWeight 700
   "Amount" cells for unpaid: color theme.danger, fontWeight 700
   "Print Receipt" buttons → GOLDEN button
   "Record Payment" buttons → PRIMARY blue button
   "Send Reminder" buttons → style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FCD34D', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}

════════════════════════════════════════════════════════════════
SPECIFIC COMPONENT: LECTURERS PAGE
════════════════════════════════════════════════════════════════

1. "+ Add Lecturer" button → PRIMARY blue button
2. Each lecturer card or table row → PATTERN A or PATTERN E
3. Status badges → PATTERN F (Active green, On Leave amber)
4. Action buttons → Edit: SECONDARY, Remove/Delete: DANGER

════════════════════════════════════════════════════════════════
SPECIFIC COMPONENT: COMMUNICATIONS PAGE
════════════════════════════════════════════════════════════════

1. Message compose area → wrap in PATTERN A card
2. "Send" button → PRIMARY blue
3. Message history → inside another PATTERN A card
4. Sent message bubbles: background theme.accentLight, border '1px solid #BEE3F8', borderRadius '12px 12px 4px 12px', padding '10px 14px'

════════════════════════════════════════════════════════════════
SPECIFIC COMPONENT: PRINTING QUEUE PAGE
════════════════════════════════════════════════════════════════

1. Queue board → PATTERN A card with column headers
2. Status badges: Pending → amber, In Progress → blue, Completed → green (all PATTERN F style)
3. Buttons: "Mark Complete" → PRIMARY, "Cancel" → DANGER

════════════════════════════════════════════════════════════════
SPECIFIC COMPONENT: DOCUMENTS PAGE
════════════════════════════════════════════════════════════════

1. Document items → PATTERN A card grid (2 or 3 columns)
2. Each doc card: icon + name + type badge + "Download" button
3. "Download" → SECONDARY button; "Upload New" → PRIMARY

════════════════════════════════════════════════════════════════
GLOBAL RULES FOR ALL PAGES
════════════════════════════════════════════════════════════════

1. Any raw <h3> or <h4> heading inside page content:
   fontFamily t.fontHeading, fontWeight 700, color theme.textPrimary

2. Any muted label or metadata text:
   fontSize '12px', color theme.textMuted

3. Any blue hyperlink-style text (currently "Class Rankings & Results Summary" in green):
   color theme.accent, fontWeight 600, textDecoration 'none'

4. Any separator line between sections:
   borderTop '1px solid #F4F5F7', margin '16px 0'

5. Empty state messages ("No results logged yet..."):
   textAlign 'center', color theme.textMuted, fontStyle 'italic',
   padding '32px 0'

6. Remove ALL instances of plain unstyled <button> elements that have no style prop — give them at minimum the SECONDARY button style.

7. Search/filter inputs that are currently unstyled or use default browser appearance:
   Give them: background '#FFFFFF', border '1px solid #E3E6EA', borderRadius '8px', padding '8px 12px', fontSize '13px', color theme.textPrimary, outline 'none'

════════════════════════════════════════════════════════════════
FINAL INSTRUCTIONS
════════════════════════════════════════════════════════════════

1. Apply PATTERN A (card wrapper), PATTERN D (buttons), PATTERN E (tables), and PATTERN F (badges) to EVERY page in the app — not just the examples listed above. Every page should feel consistent.

2. Do NOT change the sidebar, header, page layout shell, or any routing/data logic.

3. After applying, confirm which component files were modified.

4. Priority order if you cannot do all at once:
   First: Examinations, Book Catalogue, Students (most visible in screenshots)
   Second: Fee Management, Lecturers
   Third: Communications, Printing Queue, Documents, Parent Portal
```
