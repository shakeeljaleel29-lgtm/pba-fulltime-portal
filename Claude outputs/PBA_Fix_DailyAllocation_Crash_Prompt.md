# PBA Full-Time Portal — Fix: Daily Allocation Tab Crash
## AntiGravity Prompt

---

```
Clicking the "Daily Allocation" tab causes an "Application Recovery
Notice" crash. This is a runtime error — almost certainly an
unguarded array operation (calling .map() or .filter() on a value
that is null or undefined) on data read from localStorage.

Touch ONLY GeneralAdminView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
ROOT CAUSE PATTERN
════════════════════════════════════════════════════════════════

The Daily Allocation tab reads from one or more localStorage keys
(pba_sessions, pba_room_overrides, pba_batches, pba_students, etc.)
and immediately calls array methods on the result. When the key does
not yet exist, safeLS() returns null or undefined, and then:

  safeLS('pba_sessions', []).filter(...)   // crashes if null

The second argument to safeLS() is a DEFAULT, but the function may
still return null if the key exists in localStorage with a null value.
Always use the double-guard pattern:

  (safeLS('pba_sessions', []) || []).filter(...)
                                ^^^^
                           the critical guard

════════════════════════════════════════════════════════════════
THE FIX — apply to EVERY read in the Daily Allocation tab
════════════════════════════════════════════════════════════════

Find ALL localStorage reads used in the Daily Allocation tab
component/render logic. Replace every one with the double-guard:

  BEFORE:
    safeLS('pba_sessions', []).something
    safeLS('pba_room_overrides', []).something
    safeLS('pba_batches', []).something
    safeLS('pba_students', []).something
    safeLS('pba_timetable', []).something

  AFTER (add || [] after every safeLS call that returns an array):
    (safeLS('pba_sessions', []) || []).something
    (safeLS('pba_room_overrides', []) || []).something
    (safeLS('pba_batches', []) || []).something
    (safeLS('pba_students', []) || []).something
    (safeLS('pba_timetable', []) || []).something

Also apply the guard for object reads that are later accessed with
dot notation:

  BEFORE:
    const cfg = safeLS('pba_daily_config', {});
    cfg.someField   // crashes if cfg is null

  AFTER:
    const cfg = safeLS('pba_daily_config', {}) || {};
    cfg.someField

════════════════════════════════════════════════════════════════
ADD A TOP-LEVEL ERROR BOUNDARY around the Daily Allocation render
════════════════════════════════════════════════════════════════

Wrap the entire Daily Allocation tab JSX in a try/catch render guard.
Since this is a functional component and try/catch cannot wrap JSX
directly in JSX position, add a state guard at the top of the
Daily Allocation rendering section:

  // At the top of the Daily Allocation tab render block:
  let dailyAllocationContent = null;
  try {
    dailyAllocationContent = (
      <div>
        {/* ... existing Daily Allocation JSX ... */}
      </div>
    );
  } catch (err) {
    dailyAllocationContent = (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        color: '#EF4444',
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: '12px',
        margin: '24px'
      }}>
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚠️</div>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
          Could not load Daily Allocation
        </div>
        <div style={{ fontSize: '13px', color: '#6B7280' }}>
          {err?.message || 'Unknown error'}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '12px', padding: '8px 16px',
            background: '#EF4444', color: '#fff',
            border: 'none', borderRadius: '8px',
            fontSize: '13px', cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Then in the JSX return, render dailyAllocationContent instead
  // of the raw Daily Allocation JSX.

════════════════════════════════════════════════════════════════
COMMON CRASH LOCATIONS — check each of these
════════════════════════════════════════════════════════════════

1. Date construction from slot strings:

   CRASH:
     const date = new Date(`${year}-${month}-${day}`);
     date.toLocaleDateString(...)   // wrong date in UTC+5:30

   FIX: use local-time constructor wherever a Date is built from
   year/month/day parts:
     const date = new Date(year, month - 1, day);

2. Accessing .students on a batch object from localStorage:

   CRASH:
     const enrolled = selectedBatch.students.length;  // if students is undefined

   FIX:
     const enrolled = (selectedBatch?.students || []).length;

3. Calling .find() or .filter() on sessions without a guard:

   CRASH:
     const todaySessions = sessions.filter(s => s.date === today);

   FIX:
     const todaySessions = (sessions || []).filter(s => s.date === today);

4. Room override lookup:

   CRASH:
     const override = roomOverrides.find(o => o.sessionId === id);
     const roomName = override.roomName;  // if no override found

   FIX:
     const override = (roomOverrides || []).find(o => o.sessionId === id);
     const roomName = override?.roomName || defaultRoom;

5. Date-based slot generation — if the tab builds time slots for
   the current day by iterating a date range:

   CRASH:
     for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
       // infinite or wrong range if dates parsed from UTC strings
     }

   FIX: always build date ranges with the 3-arg constructor:
     const startDate = new Date(year, month - 1, day);
     const endDate   = new Date(year, month - 1, day);

════════════════════════════════════════════════════════════════
DEFENSIVE INITIALISATION — add to the component's useEffect
════════════════════════════════════════════════════════════════

Add a useEffect that seeds any keys the Daily Allocation tab reads,
so they are never null when the tab mounts:

  useEffect(() => {
    // Ensure all keys Daily Allocation reads have at least an empty array
    if (!safeLS('pba_sessions', null))       saveLS('pba_sessions', []);
    if (!safeLS('pba_room_overrides', null)) saveLS('pba_room_overrides', []);
    // Add any other keys the Daily Allocation tab reads
  }, []);

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. The double-guard (safeLS('key', []) || []) is mandatory on
   EVERY array read — even where it seems impossible to be null
5. Add the try/catch render guard around the Daily Allocation JSX
   so any future crash shows a user-friendly error instead of
   crashing the whole app
6. Do NOT remove or disable any existing Daily Allocation features —
   fix the crash, keep all functionality
7. Run npm run build and confirm 0 errors
8. Then npm run deploy
9. List all files modified
```
