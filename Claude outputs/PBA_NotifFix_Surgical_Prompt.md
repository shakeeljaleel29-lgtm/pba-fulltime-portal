# PBA Full-Time Portal — Surgical Fix Prompt
## Notification Panel Kill + Tab Styling Fix

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
There are two specific things to fix. Do not change anything else.

════════════════════════════════════════════════════════════════
FIX 1 — KILL THE PERSISTENT NOTIFICATION PANEL (critical)
════════════════════════════════════════════════════════════════

The notification panel is rendering as a visible banner/block on EVERY page whenever any sidebar item is clicked. This is the highest priority fix.

STEP A — Search every file in the project for ANY of these patterns and fix them all:

Pattern 1: useState with truthy default
  useState(true)           → change to useState(false)
  useState(1)              → change to useState(false)
  useState("open")         → change to useState(false)
  useState("show")         → change to useState(false)

  BUT ONLY for state variables whose name contains any of:
    notif, notification, notify, bell, alert, panel, drawer, popup, overlay
  Example: const [showNotifications, setShowNotifications] = useState(true)
  becomes: const [showNotifications, setShowNotifications] = useState(false)

Pattern 2: useEffect auto-opener — DELETE the entire useEffect block if it:
  - sets a notification/panel/bell state to true/1/"open"/"show"
  - has an empty dependency array []
  Example to delete entirely:
    useEffect(() => {
      setShowNotifications(true);
    }, []);

Pattern 3: JSX conditional that ALWAYS renders notification content
  Look for: {showNotifications && <NotificationPanel ... />}
  OR:       {notifOpen && <div ...>...</div>}
  OR:       a <NotificationPanel /> or similar component rendered WITHOUT any conditional
  If found without a conditional, wrap it: {showNotifications && <NotificationPanel ... />}

Pattern 4: notification-related variable initialised outside useState
  const showNotifications = true;   → const [showNotifications, setShowNotifications] = useState(false);
  let notifOpen = true;             → convert to useState(false)

STEP B — After changing all state defaults to false, make sure the bell icon button TOGGLES the state:
  The bell button must have: onClick={() => setShowNotifications(prev => !prev)}
  If the bell button has no onClick, add it.
  If the bell button calls a different function, make sure that function toggles the notification state.

STEP C — Wrap the notification panel/dropdown in a click-outside-to-close handler.
Add this useEffect inside the component that owns showNotifications state:

  useEffect(() => {
    if (!showNotifications) return;
    const closeOnOutsideClick = (e) => {
      if (!e.target.closest('[data-notif-root]')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [showNotifications]);

And add data-notif-root to the outermost wrapper div that contains both the bell button AND the notification panel dropdown:
  <div style={{ position: 'relative' }} data-notif-root>

STEP D — The notification panel must use position: 'absolute' so it floats over the page.
Make sure the notification panel/dropdown has these styles:
  position: 'absolute'
  top: '48px'
  right: 0
  zIndex: 500
  width: '320px' (or similar fixed width)
  background: '#FFFFFF'
  borderRadius: '12px'
  boxShadow: '0 8px 32px rgba(0,0,0,0.14)'
  border: '1px solid #E3E6EA'

If the notification panel currently uses position: 'relative', position: 'static', or has no position set, change it to position: 'absolute' with the values above.

STEP E — The notification panel must NOT be rendered inside the main page content area.
It must be a child of the header component, positioned absolutely relative to the bell button container. If it is currently rendered as a sibling to the page content (e.g., between the header and the main content), move it inside the header, inside the div that wraps the bell icon button.

════════════════════════════════════════════════════════════════
FIX 2 — STUDENT DATABASE TAB STYLING (pill-group tabs)
════════════════════════════════════════════════════════════════

The "Student Database (5)" and "Digital Attendance Register" tabs currently render as flat bordered buttons with emoji icons. Replace their styling with the pill-group tab style.

Find the tab container for the Students page (StudentDatabase.jsx or StudentsView.jsx or similar). It will have two tabs for "Student Database" and "Digital Attendance Register".

Replace the CONTAINER that wraps both tabs with this style:
  style={{
    display: 'flex',
    gap: '4px',
    background: '#EEF0F4',
    padding: '4px',
    borderRadius: '10px',
    width: 'fit-content',
    marginBottom: '20px'
  }}

Replace each individual TAB BUTTON with these two style states:

INACTIVE tab:
  style={{
    padding: '8px 18px',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#4A5568',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }}

ACTIVE tab (the currently selected one):
  style={{
    padding: '8px 18px',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#2B6CB0',
    cursor: 'pointer',
    border: 'none',
    background: '#FFFFFF',
    boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }}

Keep the existing SVG icons inside the tab buttons. Remove any emoji icons (🎓, 📋 etc.) and replace them with the existing SVG icons if present, or remove them entirely if they don't have SVGs.

Apply the same pill-group tab style to ALL other tab groups in the app — Book Catalogue tabs, Printing Queue tabs, and any other page that uses tabs — if they are not already using this style.

════════════════════════════════════════════════════════════════
FINAL CHECK
════════════════════════════════════════════════════════════════

After making both fixes:
1. The notification panel must NOT be visible when the page first loads or when navigating between pages
2. The notification panel must ONLY appear when the bell icon in the header is clicked
3. Clicking anywhere outside the notification panel must close it
4. The Student Database tabs must use the pill-group style (grey container, white active pill)
5. Do not change any other functionality, data, or routing

List which files were modified.
```
