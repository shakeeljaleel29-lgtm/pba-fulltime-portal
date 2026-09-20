# PBA Full-Time Portal — Assign Subjects Bug Fix + Availability Grid Fix
## AntiGravity Prompt

---

```
Fix two broken features: (1) subject checkboxes in Edit Batch do nothing,
and (2) lecturer availability is not reflected in the Availability Grid.
Touch ONLY GeneralAdminView.jsx and LecturerManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
BUG 1 — ASSIGN SUBJECTS CHECKBOXES DON'T WORK
════════════════════════════════════════════════════════════════
File: GeneralAdminView.jsx
Tab: Batch Manager → Edit Batch → Step 2: Assign Subjects

CURRENT PROBLEM:
  - The left panel lists subjects (Biology, Chemistry, etc.)
  - Clicking a checkbox does nothing — subjects never appear in
    the right "Assigned Subjects" panel
  - The panel always shows "Assigned Subjects (0)"

ROOT CAUSE:
  The checkbox onChange handler is likely missing, broken, or not
  updating the component's assignedSubjects state correctly.

THE FIX:

Step 1 — State for assigned subjects in the Edit Batch modal:
  const [assignedSubjects, setAssignedSubjects] = useState(
    () => editingBatch?.subjects || []
  );
  // When opening the modal for an existing batch, pre-populate:
  // editingBatch.subjects should be an array of:
  //   { subjectId, subjectName, subjectCode, lecturerId, assistantId, recurrence }

Step 2 — Checkbox onChange handler:
  const toggleSubject = (subject) => {
    const already = assignedSubjects.find(s => s.subjectId === subject.id);
    if (already) {
      // Uncheck: remove from assigned list
      setAssignedSubjects(prev => prev.filter(s => s.subjectId !== subject.id));
    } else {
      // Check: add with empty defaults
      setAssignedSubjects(prev => [...prev, {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        lecturerId: '',
        assistantId: '',
        recurrence: 'weekly'
      }]);
    }
  };

Step 3 — Checkbox rendering (left panel):
  {(subjects || []).map(subject => {
    const isAssigned = assignedSubjects.some(s => s.subjectId === subject.id);
    return (
      <div key={subject.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer' }}
        onClick={() => toggleSubject(subject)}>
        <input
          type="checkbox"
          checked={isAssigned}
          onChange={() => toggleSubject(subject)}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '12px', fontWeight: 700, color: subject.color || '#4F46E5',
          background: subject.color ? subject.color + '20' : '#EEF2FF',
          padding: '2px 6px', borderRadius: '4px' }}>{subject.code}</span>
        <span style={{ fontSize: '13px', color: '#1A202C' }}>{subject.name}</span>
      </div>
    );
  })}

Step 4 — Right panel: Assigned Subjects table
  Show each assignedSubject with:
  - Subject name + code
  - LECTURER dropdown: populated from pba_lecturers filtered to
    lecturers who teach this subject
  - ASSISTANT dropdown: same list (optional)
  - RECURRENCE: dropdown ('weekly' | 'fortnightly' | 'custom')

  Example row:
  <tr key={s.subjectId}>
    <td>{s.subjectCode} — {s.subjectName}</td>
    <td>
      <select value={s.lecturerId}
        onChange={e => setAssignedSubjects(prev =>
          prev.map(x => x.subjectId === s.subjectId
            ? { ...x, lecturerId: e.target.value } : x)
        )}
        style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E3E6EA' }}>
        <option value="">— Select Lecturer —</option>
        {(lecturers || [])
          .filter(l => (l.subjects || []).includes(s.subjectId))
          .map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
    </td>
    <td>
      <select value={s.assistantId || ''}
        onChange={e => setAssignedSubjects(prev =>
          prev.map(x => x.subjectId === s.subjectId
            ? { ...x, assistantId: e.target.value } : x)
        )}
        style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E3E6EA' }}>
        <option value="">— None —</option>
        {(lecturers || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
    </td>
    <td>
      <select value={s.recurrence}
        onChange={e => setAssignedSubjects(prev =>
          prev.map(x => x.subjectId === s.subjectId
            ? { ...x, recurrence: e.target.value } : x)
        )}
        style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E3E6EA' }}>
        <option value="weekly">Weekly</option>
        <option value="fortnightly">Fortnightly</option>
        <option value="custom">Custom</option>
      </select>
    </td>
    <td>
      <button onClick={() => setAssignedSubjects(prev =>
          prev.filter(x => x.subjectId !== s.subjectId))}
        style={{ background: 'none', border: 'none', color: '#E53E3E', cursor: 'pointer', fontSize: '16px' }}>✕</button>
    </td>
  </tr>

Step 5 — Save: when the batch is saved, store subjects in the batch record:
  const updatedBatch = {
    ...editingBatch,
    subjects: assignedSubjects
  };
  const allBatches = (safeLS('pba_batches', [])).map(b =>
    b.id === updatedBatch.id ? updatedBatch : b
  );
  saveLS('pba_batches', allBatches);

════════════════════════════════════════════════════════════════
BUG 2 — LECTURER AVAILABILITY GRID SHOWS "FREE" FOR ALL SLOTS
════════════════════════════════════════════════════════════════
File: LecturerManagementView.jsx
Tab: Lecturers → Availability Grid

CURRENT PROBLEM:
  Dr. Shakeel has availability set to Mon 09:30–11:30 in his profile,
  but the Availability Grid shows "Free" for ALL his days including Monday.
  Scheduled availability is not being read or displayed.

ROOT CAUSE:
  The Availability Grid is not reading each lecturer's availability
  array from pba_lecturers. It is either showing static "Free" for
  all slots or not cross-referencing lecturer.availability at all.

THE FIX:

Each lecturer record in pba_lecturers should have:
  availability: [
    { day: 'Monday', startTime: '09:30', endTime: '11:30' },
    { day: 'Tuesday', startTime: '08:00', endTime: '18:00' },
    // etc.
  ]

Also load timetable sessions from pba_timetable (or pba_scheduled_classes):
  const timetable = safeLS('pba_timetable', []);

For the Availability Grid, render each cell as follows:
  - Check if the lecturer has an availability entry for that day
  - Check if there is a timetable session for that lecturer on that day

  const getLecturerCellInfo = (lecturer, day) => {
    const avail = (lecturer.availability || []).filter(a => a.day === day);
    const sessions = (timetable || []).filter(
      s => s.lecturerId === lecturer.id && s.day === day
    );
    return { avail, sessions };
  };

  Cell rendering:
  const { avail, sessions } = getLecturerCellInfo(lecturer, day);

  if (sessions.length > 0) {
    // Show each scheduled session (indigo/blue card — "Scheduled")
    return sessions.map(session => (
      <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE',
        borderRadius: '8px', padding: '6px 8px', marginBottom: '4px', fontSize: '11px' }}>
        <div style={{ fontWeight: 700, color: '#4F46E5' }}>{session.subjectName}</div>
        <div style={{ color: '#6B7280' }}>{session.batchName}</div>
        <div style={{ color: '#6B7280' }}>{session.startTime}–{session.endTime}</div>
      </div>
    ));
  }

  if (avail.length > 0) {
    // Available but no class scheduled (show as light grey "Free Slot")
    return (
      <div style={{ color: '#9CA3AF', fontSize: '11px', fontStyle: 'italic' }}>
        Free {avail[0].startTime}–{avail[0].endTime}
      </div>
    );
  }

  // No availability set for this day
  return <span style={{ color: '#CBD5E0', fontSize: '11px' }}>—</span>;

The DAYS columns should be: Monday Tuesday Wednesday Thursday Friday Saturday
(show Saturday only if any lecturer has Saturday availability)

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx and LecturerManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. Run npm run build and confirm 0 errors
5. Then run npm run deploy to push to GitHub and trigger Vercel deployment
6. List all files modified
```
