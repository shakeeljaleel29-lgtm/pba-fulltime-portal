# PBA Full-Time Portal — Form & Input Restyle
## AntiGravity Prompt — Phase 6C: All Form Elements + Communications Page

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Style every form element across the entire app. This is a global pass — apply to EVERY page that has inputs, selects, textareas, or form labels. Do not change any logic or data.

Add these constants at the top of every file you modify if not already present:

const theme = {
  accent: '#2B6CB0', accentLight: '#EBF4FF',
  gold: '#D4A017', goldLight: '#FEF3C7',
  textPrimary: '#1A202C', textSecondary: '#4A5568', textMuted: '#718096',
  cardBg: '#FFFFFF', cardBorder: '#E3E6EA', pageBg: '#F4F5F7',
  success: '#2F855A', danger: '#C53030',
};

════════════════════════════════════════════════════════════════
RULE 1 — ALL <input> ELEMENTS (text, email, tel, number, date, search)
════════════════════════════════════════════════════════════════

Find every <input ... /> in every file. Add or replace its style prop with:

style={{
  width: '100%',
  padding: '9px 13px',
  background: '#FFFFFF',
  border: '1.5px solid #E3E6EA',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#1A202C',
  outline: 'none',
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box'
}}

Also add these event handlers to every input for the focus ring effect:
  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}

Exception — search inputs in the header (smaller, already styled): skip those.

════════════════════════════════════════════════════════════════
RULE 2 — ALL <select> ELEMENTS
════════════════════════════════════════════════════════════════

Find every <select ...> in every file. Add or replace its style prop with:

style={{
  width: '100%',
  padding: '9px 36px 9px 13px',
  background: '#FFFFFF',
  border: '1.5px solid #E3E6EA',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#1A202C',
  outline: 'none',
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  cursor: 'pointer',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box'
}}

Add focus handlers:
  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}

Exception — the "All Branches" select in the header: skip, it is already styled.

════════════════════════════════════════════════════════════════
RULE 3 — ALL <textarea> ELEMENTS
════════════════════════════════════════════════════════════════

Find every <textarea ...> in every file. Add or replace its style prop with:

style={{
  width: '100%',
  padding: '10px 13px',
  background: '#FFFFFF',
  border: '1.5px solid #E3E6EA',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#1A202C',
  outline: 'none',
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  resize: 'vertical',
  minHeight: '120px',
  lineHeight: '1.6',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box'
}}

Add focus handlers (same as inputs above).

════════════════════════════════════════════════════════════════
RULE 4 — ALL FORM FIELD LABELS (text labels above inputs)
════════════════════════════════════════════════════════════════

Find every plain text label that sits directly above an input/select/textarea. These currently look like plain grey text (e.g. "Load Saved Template (Optional)", "Recipient Group", "Dispatch Channel", "Subject", "Message Content").

Wrap each label in a <label> tag if not already, and style it:

style={{
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: '#4A5568',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: '5px'
}}

════════════════════════════════════════════════════════════════
RULE 5 — ALL FORM FIELD GROUPS (label + input pairs)
════════════════════════════════════════════════════════════════

Each label+input/select/textarea pair should be wrapped in a div with:
style={{ marginBottom: '16px' }}

════════════════════════════════════════════════════════════════
RULE 6 — THE "DISPATCH MESSAGE" BUTTON AND ALL FULL-WIDTH FORM BUTTONS
════════════════════════════════════════════════════════════════

Any button that spans full width inside a form (e.g. "Dispatch Message", "Save", "Submit", "Register", "Add") gets the PRIMARY button style:

style={{
  width: '100%',
  padding: '11px',
  background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 2px 10px rgba(43,108,176,0.30)',
  transition: 'all 0.15s',
  marginTop: '8px',
  fontFamily: "'Inter', sans-serif"
}}

════════════════════════════════════════════════════════════════
SPECIFIC PAGE: COMMUNICATIONS (CommunicationsView.jsx or equivalent)
════════════════════════════════════════════════════════════════

Restyle the Communications page layout as follows:

1. TABS already styled — keep "Compose Message" | "Announcements (1)" | "Message Templates (3)" | "Communications History Log" as-is.

2. The main content area below the tabs should be a two-column layout:

<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
  alignItems: 'flex-start'
}}>
  {/* LEFT: Compose form */}
  {/* RIGHT: Live preview */}
</div>

3. LEFT COLUMN — wrap the compose form in a card:
<div style={{
  background: '#FFFFFF',
  border: '1px solid #E3E6EA',
  borderRadius: '14px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  overflow: 'hidden'
}}>
  {/* Card header */}
  <div style={{
    padding: '16px 22px',
    borderBottom: '1px solid #F4F5F7',
    display: 'flex', alignItems: 'center', gap: '10px'
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B6CB0" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: '15px', fontWeight: 600, color: '#1A202C' }}>
      Compose Communication Dispatch
    </span>
  </div>
  {/* Card body with form */}
  <div style={{ padding: '22px' }}>
    {/* Form fields go here — apply RULES 1–6 above */}
  </div>
</div>

4. RIGHT COLUMN — wrap the preview panel in a card:
<div style={{
  background: '#FFFFFF',
  border: '1px solid #E3E6EA',
  borderRadius: '14px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  overflow: 'hidden',
  position: 'sticky',
  top: '80px'
}}>
  {/* Card header */}
  <div style={{
    padding: '16px 22px',
    borderBottom: '1px solid #F4F5F7',
    background: '#F8FAFE',
    display: 'flex', alignItems: 'center', gap: '10px'
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B6CB0" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: '14px', fontWeight: 600, color: '#1A202C' }}>
      Parsed Message Live Preview
    </span>
  </div>
  {/* Preview body */}
  <div style={{ padding: '22px' }}>
    {/* Keep existing preview content — just ensure it has: */}
    {/* To/Channel line: fontSize 12px, color #4A5568, marginBottom 12px */}
    {/* Subject line: fontSize 15px, fontWeight 700, color #1A202C, marginBottom 12px */}
    {/* Body text: fontSize 13px, color #4A5568, lineHeight 1.7 */}
  </div>
</div>

5. The "To: All Students | Channel: WhatsApp" metadata line:
  <div style={{ fontSize: '12px', color: '#4A5568', marginBottom: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
    <span style={{ background: '#EBF4FF', color: '#2B6CB0', padding: '2px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '11px' }}>
      To: All Students (Specific Branch)
    </span>
    <span style={{ background: '#FEF3C7', color: '#B7860A', padding: '2px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '11px' }}>
      Channel: WhatsApp
    </span>
  </div>

════════════════════════════════════════════════════════════════
ALSO APPLY FORM RULES TO THESE PAGES (in priority order)
════════════════════════════════════════════════════════════════

Apply RULES 1–6 (input/select/textarea/label/button styling) to every form on:

1. Register New Student modal / form
2. Schedule New Exam modal / form
3. Add New Textbook modal / form
4. Add Lecturer modal / form
5. Record Payment modal / form (Fee Management)
6. General Admin settings page
7. Login page (if not already styled)
8. Any other modal or form in the app

For MODALS specifically, ensure the modal container itself is styled:
  Modal backdrop: position 'fixed', inset 0, background 'rgba(10,15,28,0.55)', backdropFilter 'blur(4px)', zIndex 1000, display 'flex', alignItems 'center', justifyContent 'center'
  Modal panel: background '#FFFFFF', borderRadius '16px', padding '28px', width '100%', maxWidth '500px', boxShadow '0 24px 64px rgba(0,0,0,0.20)', position 'relative'
  Modal title: fontFamily "'Sora',sans-serif", fontSize '18px', fontWeight 700, color '#1A202C', marginBottom '6px'
  Modal close button (×): position 'absolute', top '16px', right '16px', width '32px', height '32px', borderRadius '8px', background '#F4F5F7', border 'none', cursor 'pointer', fontSize '18px', color '#718096'
  Modal footer: display 'flex', justifyContent 'flex-end', gap '10px', marginTop '24px', paddingTop '18px', borderTop '1px solid #F4F5F7'

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Apply RULES 1–6 globally — search every .jsx file for <input, <select, <textarea and apply the styles. There should be no plain unstyled form elements anywhere after this.

2. Do NOT change the value, onChange, name, type, placeholder, or any other non-style prop on form elements.

3. Do NOT remove placeholder attributes. If a placeholder is missing, do not add one.

4. The goal: every form field should look like a refined SaaS product — clean white background, subtle border, blue focus ring, properly spaced labels above.

5. After changes, list which files were modified.
```
