# PBA Full-Time Portal — Lecturers Tab: Isolate Crash with Local Error Boundary
## AntiGravity Prompt — Diagnose + Contain the Crash

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
The Lecturers tab is crashing the whole app. Instead of guessing the root cause,
wrap the Lecturers component in its own local error boundary so the crash is
contained and the actual error message is visible. Do not change any other page.

════════════════════════════════════════════════════════════════
STEP 1 — ADD A LOCAL ERROR BOUNDARY CLASS IN THE SAME FILE
════════════════════════════════════════════════════════════════

At the TOP of LecturerManagementView.jsx (or wherever the Lecturers component
lives), BEFORE the main component, add this class:

  import React from 'react';

  class LecturerErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    componentDidCatch(error, info) {
      console.error('[Lecturers] Caught error:', error.message, info.componentStack);
    }
    render() {
      if (this.state.hasError) {
        return (
          <div style={{
            margin: '40px auto', maxWidth: '600px',
            background: '#FFFFFF', border: '1.5px solid #FEB2B2',
            borderRadius: '12px', padding: '28px 32px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '12px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="#C53030" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{
                fontSize: '14px', fontWeight: 700, color: '#C53030',
                fontFamily: "'Inter', sans-serif"
              }}>
                Lecturers tab encountered an error
              </span>
            </div>
            <div style={{
              background: '#FFF5F5', borderRadius: '8px',
              padding: '12px 16px', marginBottom: '16px'
            }}>
              <p style={{
                fontSize: '12px', fontFamily: 'monospace',
                color: '#742A2A', margin: 0, wordBreak: 'break-all'
              }}>
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                background: '#2B6CB0', color: '#FFFFFF', border: 'none',
                borderRadius: '8px', padding: '9px 18px',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              Try Again
            </button>
          </div>
        );
      }
      return this.props.children;
    }
  }

════════════════════════════════════════════════════════════════
STEP 2 — WRAP THE LECTURERS COMPONENT EXPORT WITH THE BOUNDARY
════════════════════════════════════════════════════════════════

Find where LecturerManagementView (or the Lecturers tab component) is exported
or rendered, and wrap its JSX output like this:

  // Option A — wrap inside the component's return:
  return (
    <LecturerErrorBoundary>
      {/* ... all existing JSX ... */}
    </LecturerErrorBoundary>
  );

  // Option B — wrap at the export:
  export default function LecturerManagementView(props) {
    return (
      <LecturerErrorBoundary>
        <LecturerManagementViewInner {...props} />
      </LecturerErrorBoundary>
    );
  }

Use whichever option is cleaner given the existing file structure.

════════════════════════════════════════════════════════════════
STEP 3 — ALSO ADD SAFE localStorage READ HELPER
════════════════════════════════════════════════════════════════

In the same file, add this helper before the component (if it doesn't exist):

  const safeLS = (key, fallback = []) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  };

Replace every JSON.parse(localStorage.getItem(...)) call in the file with
safeLS('key', []) or safeLS('key', {}) as appropriate.

════════════════════════════════════════════════════════════════
WHAT THIS ACHIEVES
════════════════════════════════════════════════════════════════

After this change:
- If the Lecturers tab still has a bug, it will show a RED ERROR CARD inside
  the Lecturers section — NOT the full-page "Application Recovery Notice"
- The error card will show the EXACT error message (e.g. "Cannot read
  properties of null (reading 'map')" or "JSON.parse: unexpected character")
- The rest of the app stays working — other tabs are unaffected
- The "Try Again" button lets you retry without refreshing the page

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. ⚠️  Do NOT click "Reset Session & Restart App" — it wipes localStorage.
   Just refresh the tab (Cmd+R / F5) to test.
2. After this fix is applied, navigate to the Lecturers tab and share a
   screenshot of the red error card — the error message will tell us exactly
   what line to fix next.
3. List all files modified.
```
