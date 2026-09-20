# PBA Full-Time Portal — Parent Portal Crash Fix
## AntiGravity Prompt

---

```
Fix the crash that occurs when clicking "Parent Portal" in the sidebar.
Touch ONLY ParentPortalView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
ROOT CAUSE
════════════════════════════════════════════════════════════════

The crash is caused by one or more of these patterns in ParentPortalView.jsx:

PATTERN A — Non-lazy useState initializer (most common cause):
  WRONG:  const [data, setData] = useState(safeLS('key', []))
  RIGHT:  const [data, setData] = useState(() => safeLS('key', []))

  The arrow function () => is mandatory. Without it, safeLS() runs
  during render before React is ready, causing the crash.

PATTERN B — Direct JSON.parse without try/catch:
  WRONG:  JSON.parse(localStorage.getItem('key'))
  RIGHT:  safeLS('key', defaultValue)

PATTERN C — Array methods called on potentially null values:
  WRONG:  data.filter(...)
  RIGHT:  (data || []).filter(...)

════════════════════════════════════════════════════════════════
THE FIX — Apply to ALL useState calls in ParentPortalView.jsx
════════════════════════════════════════════════════════════════

1. Find every useState that reads from localStorage or safeLS:
   Replace each one so it uses the lazy initializer form:

   const [students, setStudents] = useState(() => safeLS('pba_students', []));
   const [batches, setBatches] = useState(() => safeLS('pba_batches', []));
   const [fees, setFees] = useState(() => safeLS('pba_fees', []));
   const [attendance, setAttendance] = useState(() => safeLS('pba_attendance', []));
   const [exams, setExams] = useState(() => safeLS('pba_exam_results', []));
   const [announcements, setAnnouncements] = useState(() => safeLS('pba_announcements', []));
   const [parentMessages, setParentMessages] = useState(() => safeLS('pba_parent_messages', []));

   (Apply to ALL keys found in the file — the list above is illustrative.
    Fix every single useState that calls safeLS or reads localStorage.)

2. Find every direct localStorage.getItem or JSON.parse call:
   Replace with safeLS(key, defaultValue).

3. Find every array operation on state values:
   Wrap with (variable || []) before chaining .filter / .map / .find:

   students.filter(...)       → (students || []).filter(...)
   batches.map(...)           → (batches || []).map(...)

════════════════════════════════════════════════════════════════
ALSO CHECK — useEffect data loading
════════════════════════════════════════════════════════════════

If data is loaded inside a useEffect rather than useState, ensure:

  useEffect(() => {
    try {
      const data = safeLS('pba_students', []);
      setStudents(data || []);
    } catch (e) {
      setStudents([]);
    }
  }, []);

Do NOT call safeLS outside of useState(() => ...) or useEffect.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ParentPortalView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. Do NOT change any UI, layout, or feature logic
5. Run npm run build and confirm 0 errors
6. Then run npm run deploy to push to GitHub and trigger Vercel deployment
7. List all files modified
```
