# PBA Full-Time Portal — Fix Schedule Session Modal Position
## AntiGravity Prompt

---

```
The "Schedule a Session" modal in the Visual Timetable Builder
appears anchored to the bottom of the screen, forcing the user
to scroll down to interact with it. It should appear centered
on the screen over the timetable.

This is a CSS/style fix only.

Touch ONLY the file containing the Visual Timetable Builder /
Schedule a Session modal (likely TimetableView.jsx or
GeneralAdminView.jsx — whichever file contains
"Schedule a Session" in JSX).

Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE PROBLEM
════════════════════════════════════════════════════════════════

The modal overlay or the modal box itself is positioned at the
bottom of the document rather than centered on the viewport.
This happens when:

  (A) The modal container uses position: absolute instead of fixed
  (B) The centering style uses top: auto or align-items: flex-end
  (C) The modal is inside a scrollable container that offsets it

════════════════════════════════════════════════════════════════
THE FIX
════════════════════════════════════════════════════════════════

Find the modal OVERLAY for "Schedule a Session". It will look
like one of:

  <div style={{ position: 'fixed', ... }}>
  <div style={{ position: 'absolute', ... }}>
  <div className="modal-overlay ...">

REPLACE the overlay style with:

  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}

Find the modal BOX (the white card inside the overlay). It will
look like:

  <div style={{ background: '#fff', borderRadius: '...', ... }}>

REPLACE the modal box style with:

  style={{
    background: '#ffffff',
    borderRadius: '12px',
    padding: '28px 32px',
    width: '560px',
    maxWidth: '90vw',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    position: 'relative'
  }}

KEY RULES:
- The overlay MUST be position: fixed (not absolute) so it
  covers the full viewport regardless of scroll position
- The overlay MUST use display: flex with alignItems: center
  and justifyContent: center to center the modal box
- The modal box MUST NOT have position: fixed or absolute —
  it sits naturally inside the flex overlay
- zIndex: 9999 on the overlay ensures it appears above
  the timetable grid and other content

════════════════════════════════════════════════════════════════
ALSO CHECK: any other modals in this file
════════════════════════════════════════════════════════════════

While in this file, check ALL other modal overlays and apply
the same position: fixed + flexbox centering pattern if any
are missing it. The same overlay style should be consistent
across all modals in the timetable builder.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. This is a style-only fix — do not change any logic or state
2. Use only inline style={{}} — no Tailwind
3. Do NOT change the modal's content, inputs, or buttons
4. Run npm run build and confirm 0 errors
5. Then npm run deploy
6. List all files modified
```
