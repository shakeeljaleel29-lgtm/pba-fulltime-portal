# PBA Full-Time Portal — Lecturers Tab: filterLecturer Fix
## AntiGravity Prompt — Missing State Variables

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
The Lecturers tab is crashing with: "filterLecturer is not defined"

The Availability Grid section uses filterLecturer, filterSubject, and filterBatch
in its JSX but these state variables were never declared.

Fix: In LecturerManagementView.jsx, add the following three lines inside the
component function, alongside the other useState declarations, BEFORE the return:

  const [filterLecturer, setFilterLecturer] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterBatch, setFilterBatch] = useState('');

Also check for any other variables referenced in the JSX that are not defined,
and declare them with safe defaults (useState('') for strings, useState([]) for
arrays, useState(0) for numbers, useState(false) for booleans).

Do not change anything else. Run npm run build and confirm 0 errors. List files modified.
```
