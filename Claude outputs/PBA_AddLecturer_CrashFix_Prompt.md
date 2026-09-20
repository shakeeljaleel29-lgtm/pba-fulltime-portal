# PBA Full-Time Portal — Add Lecturer Modal Crash Fix
## AntiGravity Prompt — Emergency Fix

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
The "Add New Lecturer Profile" modal is crashing the app with a runtime state error
when the Lecturers tab is opened. Fix the crash without changing any other component.

════════════════════════════════════════════════════════════════
ROOT CAUSE
════════════════════════════════════════════════════════════════

The subjects checklist added in the last edit is likely crashing because:
1. pba_subjects is null in localStorage (not yet seeded)
2. JSON.parse fails silently and returns null, then .map() is called on null
3. Or the subjects state variable is initialised before the component mounts

════════════════════════════════════════════════════════════════
FIX — LecturerManagementView.jsx (or wherever the modal lives)
════════════════════════════════════════════════════════════════

Wherever pba_subjects is read from localStorage for the subject checklist,
replace it with a safe read:

  const getSubjects = () => {
    try {
      const raw = localStorage.getItem('pba_subjects');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

Use this function to initialise the subjects list used in the modal:

  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Load subjects when modal opens, not at component mount
  const handleOpenAddModal = () => {
    setAvailableSubjects(getSubjects());
    setShowAddModal(true);
    // reset form fields
    setNewLecturerName('');
    setNewLecturerBranch('');
    setNewLecturerEmploymentType('');
    setSelectedSubjectIds([]);
    setNewLecturerQualification('');
    setNewLecturerPhone('');
    setNewLecturerEmail('');
    setNewLecturerNotes('');
  };

IMPORTANT — do NOT read localStorage at the top level of the component or in a
useState initialiser. Always read it inside a function or useEffect that is
called only when the modal opens, so a parse failure cannot crash the whole page.

In the modal JSX, render the checklist defensively:

  {availableSubjects.length > 0 ? (
    <div style={{
      border: '1.5px solid #E3E6EA', borderRadius: '8px',
      maxHeight: '150px', overflowY: 'auto',
      padding: '8px 12px', background: '#FAFBFC'
    }}>
      {availableSubjects.map(s => (
        <label key={s.id} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '5px 0', cursor: 'pointer',
          fontSize: '13px', color: '#1A202C'
        }}>
          <input
            type="checkbox"
            checked={selectedSubjectIds.includes(s.id)}
            onChange={() => {
              setSelectedSubjectIds(prev =>
                prev.includes(s.id)
                  ? prev.filter(id => id !== s.id)
                  : [...prev, s.id]
              );
            }}
            style={{ accentColor: '#2B6CB0' }}
          />
          <span style={{
            background: (s.color || '#718096') + '20',
            color: s.color || '#718096',
            fontSize: '10px', fontWeight: 800,
            padding: '1px 6px', borderRadius: '10px', marginRight: '4px'
          }}>{s.code || '—'}</span>
          {s.name}
        </label>
      ))}
    </div>
  ) : (
    <div style={{
      border: '1.5px solid #E3E6EA', borderRadius: '8px',
      padding: '12px', background: '#FAFBFC',
      fontSize: '12px', color: '#A0AEC0', fontStyle: 'italic'
    }}>
      No subjects found. Add subjects in General Admin → Subject Registry first.
    </div>
  )}

════════════════════════════════════════════════════════════════
ALSO CHECK — top-level useState initialisers
════════════════════════════════════════════════════════════════

Scan LecturerManagementView.jsx for any line like:

  const [subjects, setSubjects] = useState(
    JSON.parse(localStorage.getItem('pba_subjects')) || []
  );

This pattern crashes if JSON.parse throws. Replace every such line with:

  const [subjects, setSubjects] = useState([]);

And load the data inside a useEffect or event handler instead.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT reset localStorage or change any other component.
2. The fix must allow the Lecturers page to load and display the lecturer
   table even if pba_subjects is empty or missing.
3. After the fix, run npm run build and confirm 0 errors.
4. List all files modified.
```
