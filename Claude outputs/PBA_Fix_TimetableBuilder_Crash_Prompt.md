# PBA Full-Time Portal — Fix: Timetable Builder Runtime Crash After All-Batches + Mismatch Changes
## AntiGravity Prompt

---

```
The Visual Timetable Builder now shows "Application Recovery Notice —
runtime state error" on load. This crash was introduced by the recent
All-Batches overlap and Lecturer Subject Mismatch changes. The build
compiles with 0 errors but crashes at runtime.

Touch ONLY VisualTimetableBuilder.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
ROOT CAUSE — Three categories of runtime crash
════════════════════════════════════════════════════════════════

CRASH 1 — Circular / missing import
  The recent edit added an import of getLecturerSubjects or BATCH_COLORS
  from GeneralAdminView.jsx into VisualTimetableBuilder.jsx.
  This creates a circular dependency and crashes at module load time.

  FIX: Remove the import entirely. Define both helpers LOCALLY inside
  VisualTimetableBuilder.jsx — they are simple pure functions, no need
  to import from another component.

CRASH 2 — Unguarded localStorage reads in new batch/mismatch code
  New code added calls like:
    safeLS('pba_lecturers', []).find(...)
    safeLS('pba_batches', []).forEach(...)
  When safeLS returns null (key exists but stored as null), these crash.

  FIX: apply the double-guard to every new safeLS call:
    (safeLS('pba_lecturers', []) || [])
    (safeLS('pba_batches',   []) || [])

CRASH 3 — Unguarded property access on results of .find()
  New mismatch code does:
    const lec = allLecturers.find(l => l.id === sess.lecturerId);
    const subjects = lec.subjects;   // crashes if lec is undefined
  And batchColorMap access:
    const color = batchColorMap[sess.batchId];
    // used as background: color — crashes if batchColorMap is undefined

  FIX: use optional chaining everywhere:
    const lec = allLecturers.find(l => l.id === sess.lecturerId);
    const subjects = getLecturerSubjects(lec);   // handles undefined
    const color = batchColorMap?.[sess?.batchId] || '#6366F1';

════════════════════════════════════════════════════════════════
FIX A — Define helpers locally (remove any cross-component import)
════════════════════════════════════════════════════════════════

At the top of VisualTimetableBuilder.jsx (before the component function,
after any existing React import), add these two definitions:

  // ── Local colour palette for "All Batches" mode ──────────────────
  const BATCH_COLORS = [
    '#6366F1', '#F59E0B', '#10B981', '#EF4444', '#3B82F6',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16'
  ];

  // ── Normalize lecturer subjects (array or comma-string) ───────────
  const getLecturerSubjects = (lecturer) => {
    if (!lecturer) return [];
    const raw = lecturer.subjects || lecturer.subjectsTaught || [];
    if (Array.isArray(raw)) return raw.map(s => s.trim()).filter(Boolean);
    if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

Remove any import of these from '../admin/GeneralAdminView' or any
other file. These must ONLY be defined locally here.

════════════════════════════════════════════════════════════════
FIX B — Guard every new localStorage read with || []
════════════════════════════════════════════════════════════════

Find every safeLS call that was added as part of the recent changes and
add the || [] / || {} guard:

  // Lecturers
  const allLecturers = (safeLS('pba_lecturers', []) || []);

  // Batches for color map
  const allBatches = (safeLS('pba_batches', []) || []);

  // Sessions
  const allSessions = (safeLS('pba_timetable', [])
                    || safeLS('pba_sessions',  [])
                    || []);

Apply this pattern to EVERY safeLS call inside the component — not just
the new ones. The double-guard is mandatory throughout.

════════════════════════════════════════════════════════════════
FIX C — Guard the batchColorMap initialization
════════════════════════════════════════════════════════════════

The color map must be built safely even if allBatches is empty:

  const batchColorMap = {};
  try {
    const sorted = [...allBatches].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    );
    sorted.forEach((b, i) => {
      if (b?.id) batchColorMap[b.id] = BATCH_COLORS[i % BATCH_COLORS.length];
    });
  } catch (_) {
    // leave batchColorMap empty — cells will use fallback color
  }

Always access batchColorMap with a fallback:
  const batchColor = batchColorMap?.[sess?.batchId] || '#6366F1';

════════════════════════════════════════════════════════════════
FIX D — Guard all mismatch detection with optional chaining
════════════════════════════════════════════════════════════════

Replace any unguarded mismatch checks with safe versions:

  const getSessionMismatch = (sess) => {
    try {
      if (!sess?.lecturerId || !sess?.subject) return false;
      const lec = allLecturers.find(l => l?.id === sess.lecturerId);
      if (!lec) return false;
      const qualSubjects = getLecturerSubjects(lec).map(s => s.toLowerCase());
      return !qualSubjects.includes((sess.subject || '').trim().toLowerCase());
    } catch (_) {
      return false;
    }
  };

Use getSessionMismatch(sess) wherever the mismatch badge/border is
rendered — never inline the logic where it could crash during render.

════════════════════════════════════════════════════════════════
FIX E — Guard the sub-column grouping logic
════════════════════════════════════════════════════════════════

The "group sessions by batchId for side-by-side columns" logic must
be wrapped in a try/catch so a bad session object doesn't crash the
whole timetable grid render:

  const getSessionsForCell = (day, timeSlot) => {
    try {
      return (allSessions || []).filter(sess =>
        sess?.day === day && sess?.timeSlot === timeSlot
      );
    } catch (_) {
      return [];
    }
  };

  const groupByBatch = (sessions) => {
    try {
      const map = {};
      (sessions || []).forEach(sess => {
        const bid = sess?.batchId || 'unknown';
        if (!map[bid]) map[bid] = [];
        map[bid].push(sess);
      });
      return map;
    } catch (_) {
      return {};
    }
  };

════════════════════════════════════════════════════════════════
FIX F — Add top-level error boundary around the timetable render
════════════════════════════════════════════════════════════════

Wrap the timetable grid JSX (the outermost div of the visual grid,
not the entire component) in a try/catch render guard:

  let timetableContent;
  try {
    timetableContent = (
      <div>
        {/* ... existing timetable grid JSX ... */}
      </div>
    );
  } catch (err) {
    timetableContent = (
      <div style={{
        padding: '32px', textAlign: 'center',
        background: '#FEF2F2', border: '1px solid #FECACA',
        borderRadius: '12px', margin: '16px',
        color: '#EF4444'
      }}>
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚠️</div>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
          Timetable could not render
        </div>
        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
          {err?.message || 'Unknown error'}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px', background: '#EF4444', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

Then render {timetableContent} in the JSX return instead of the raw grid.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY VisualTimetableBuilder.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. BATCH_COLORS and getLecturerSubjects MUST be defined locally —
   never imported from GeneralAdminView.jsx or any other component
5. Every safeLS call must have the || [] / || {} double-guard
6. Every .find() result must be accessed with optional chaining (?.)
   before accessing any property
7. The try/catch in getSessionMismatch means it NEVER throws —
   on any error it returns false (no mismatch shown, no crash)
8. The try/catch in FIX F means the page never goes blank —
   on render error, a styled fallback is shown instead of crashing
9. Do NOT remove any existing timetable features — fix crashes only
10. Run npm run build and confirm 0 errors
11. Then npm run deploy
12. List all files modified
```
