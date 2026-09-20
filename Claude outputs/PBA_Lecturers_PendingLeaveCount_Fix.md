# PBA Full-Time Portal — Lecturers Tab: pendingLeaveCount Fix
## AntiGravity Prompt — One-Line Fix

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
The Lecturers tab is crashing with: "pendingLeaveCount is not defined"

Fix: In LecturerManagementView.jsx, the variable pendingLeaveCount is used in
the JSX but was never declared. Add the following line inside the component,
alongside the other state/variable declarations, BEFORE the return statement:

  const pendingLeaveCount = (leaveRequests || []).filter(
    l => l.status === 'Pending'
  ).length;

Where leaveRequests is the array of leave request objects used elsewhere in
the component. If that variable has a different name (e.g. leaves, leaveData,
allLeaves), use that name instead — just match whatever the component already
calls the leave data array.

If leaveRequests does not yet exist as a state variable in the component, also add:

  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pba_leave_requests');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLeaveRequests(parsed);
      }
    } catch {}
  }, []);

Do not change anything else. Run npm run build and confirm 0 errors. List files modified.
```
