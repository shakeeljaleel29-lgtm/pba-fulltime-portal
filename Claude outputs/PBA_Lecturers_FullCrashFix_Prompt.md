# PBA Full-Time Portal — Lecturers Tab Full Crash Fix
## AntiGravity Prompt — Comprehensive Safe-Read Overhaul

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
The Lecturers tab is still crashing with "Application Recovery Notice" on every visit.
Fix ALL unsafe localStorage reads in the Lecturers component. Do not change any other
page, component, or data structure.

════════════════════════════════════════════════════════════════
ROOT CAUSE — APPLIES TO ALL localStorage READS IN THIS FILE
════════════════════════════════════════════════════════════════

Any localStorage read that appears in:
  • A useState() initialiser
  • Top-level component code (outside any function or effect)
  • A useEffect with a missing dependency or no guard

…can throw and crash React's render cycle, triggering the error boundary.

This includes ALL of these keys that the Lecturers component may read:
  pba_users, pba_subjects, pba_batch_subjects, pba_student_subjects,
  pba_attendance, pba_exams, pba_marks, pba_fees, pba_book_issues

════════════════════════════════════════════════════════════════
STEP 1 — ADD A SINGLE SAFE-READ HELPER AT THE TOP OF THE FILE
════════════════════════════════════════════════════════════════

Add this helper function once, near the top of LecturerManagementView.jsx
(or whatever file contains the Lecturers tab component), BEFORE the component:

  const safeLS = (key, fallback = []) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined || raw === '') return fallback;
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback;
      if (typeof fallback === 'object') return (parsed && typeof parsed === 'object') ? parsed : fallback;
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  };

════════════════════════════════════════════════════════════════
STEP 2 — REPLACE EVERY UNSAFE useState INITIALISER IN THE FILE
════════════════════════════════════════════════════════════════

Scan the ENTIRE file for any pattern like:

  useState(JSON.parse(localStorage.getItem('pba_anything')) || [])
  useState(JSON.parse(localStorage.getItem('pba_anything')) ?? [])
  useState(JSON.parse(localStorage.getItem('pba_anything')))

Replace EVERY one with:

  useState([])

Then move the actual data load into a useEffect that runs once on mount:

  useEffect(() => {
    setLecturers(safeLS('pba_users', []).filter(u => u.role === 'Lecturer'));
    setBatchSubjects(safeLS('pba_batch_subjects', []));
    // add any other keys the component reads here
  }, []);

NOTE: Do this for EVERY localStorage key the component reads, not just pba_subjects.

════════════════════════════════════════════════════════════════
STEP 3 — REPLACE EVERY UNSAFE TOP-LEVEL READ IN THE FILE
════════════════════════════════════════════════════════════════

Scan for any line OUTSIDE a function or useEffect that directly reads
localStorage, such as:

  const allUsers = JSON.parse(localStorage.getItem('pba_users')) || [];
  const subjects = JSON.parse(localStorage.getItem('pba_subjects')) || [];

Replace every such line with a safeLS call, or move it inside a function.

════════════════════════════════════════════════════════════════
STEP 4 — FIX THE ADD MODAL SUBJECTS LOAD
════════════════════════════════════════════════════════════════

Wherever the "Add New Lecturer" modal loads pba_subjects, ensure it is
loaded ONLY when the modal opens, not at mount:

  const [availableSubjects, setAvailableSubjects] = useState([]);

  const handleOpenAddModal = () => {
    setAvailableSubjects(safeLS('pba_subjects', []));
    setShowAddModal(true);
    // reset all other form fields here
  };

In the modal JSX, guard the subjects checklist:

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
          {s.name || 'Unknown Subject'}
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
STEP 5 — GUARD ALL DATA DERIVATIONS
════════════════════════════════════════════════════════════════

Any place the component maps, filters, or reduces data derived from
localStorage must be guarded. For example, replace:

  lecturers.map(...)         → (lecturers || []).map(...)
  batchSubjects.filter(...)  → (batchSubjects || []).filter(...)
  subjects.find(...)         → (subjects || []).find(...)

Or ensure the state variable is always initialised to [] (not null/undefined)
so .map() and .filter() always work.

════════════════════════════════════════════════════════════════
STEP 6 — ALSO GUARD ANY SAVE FUNCTIONS
════════════════════════════════════════════════════════════════

When saving a new lecturer, use safeLS to read the current list first:

  const handleSaveLecturer = () => {
    const existing = safeLS('pba_users', []);
    const newLecturer = {
      id: 'lec-' + Date.now(),
      name: newLecturerName,
      branch: newLecturerBranch,
      employmentType: newLecturerEmploymentType,
      subjectIds: selectedSubjectIds,
      subjects: availableSubjects
        .filter(s => selectedSubjectIds.includes(s.id))
        .map(s => s.name),
      qualification: newLecturerQualification,
      phone: newLecturerPhone,
      email: newLecturerEmail,
      notes: newLecturerNotes,
      role: 'Lecturer',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    const updated = [...existing, newLecturer];
    localStorage.setItem('pba_users', JSON.stringify(updated));
    setLecturers(updated.filter(u => u.role === 'Lecturer'));
    setShowAddModal(false);
  };

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. ⚠️  DO NOT click "Reset Session & Restart App" — it wipes all
   localStorage data (all students, subjects, fees, attendance, etc.).
   Instead, just refresh the browser tab (Cmd+R / F5) each time you
   test a fix.

2. The goal: the Lecturers tab must load and show the table even if
   pba_subjects, pba_batch_subjects, or any other key is empty/missing.

3. Fix EVERY localStorage read in the file — not just pba_subjects.
   The crash could be caused by any of them.

4. After the fix, run npm run build and confirm 0 errors.

5. List all files modified.
```
