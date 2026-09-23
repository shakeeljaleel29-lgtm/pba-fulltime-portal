# PBA Full-Time Portal — Per-Student Stream & Subject Selection on Enrollment
## AntiGravity Prompt

---

```
When enrolling MULTIPLE students into a batch, the current modal
sets one stream and one subject list for ALL selected students
at once. The admin needs to set stream and subjects per student
individually.

Change the enrollment flow to a two-step process:
  Step 1 — Select students to enroll (existing checkbox list)
  Step 2 — For each selected student, set their stream and subjects

Touch ONLY GeneralAdminView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
CURRENT BEHAVIOUR
════════════════════════════════════════════════════════════════

The "Enroll Students into [BatchName]" modal has:
  - A checkbox list to select students
  - A single "STREAM FOR SELECTED STUDENTS" toggle (Science / Commerce / None)
  - A single "SELECT SUBJECTS" checklist
  - "Enroll Selected (N)" button

All selected students get the same stream and subjects.

════════════════════════════════════════════════════════════════
NEW BEHAVIOUR — Two-Step Enrollment
════════════════════════════════════════════════════════════════

STEP 1 (unchanged):
  Title: "Enroll Students into [BatchName]"
  Body: checkbox list of available students + search box
  Button: "Next →" (was "Enroll Selected (N)") — enabled when ≥ 1 selected

STEP 2 (new):
  Title: "Set Stream & Subjects — [BatchName]"
  Body: one card per selected student, each card showing:

    ┌─────────────────────────────────────────────────────┐
    │ ● Hiruni Mendis  PBA-FT-2024-004                    │
    │                                                     │
    │ STREAM:  [Science]  [Commerce]  [None/Unset]        │
    │                                                     │
    │ SUBJECTS:  ☑ Biology  ☐ Chemistry  ☐ Physics        │
    └─────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────┐
    │ ● Anuki Samarasinghe  PBA-FT-2024-002               │
    │                                                     │
    │ STREAM:  [Science]  [Commerce]  [None/Unset]        │
    │                                                     │
    │ SUBJECTS:  ☐ Biology  ☑ Chemistry  ☑ Physics        │
    └─────────────────────────────────────────────────────┘

  Buttons: "← Back" and "Enroll Selected (N)"

════════════════════════════════════════════════════════════════
IMPLEMENTATION
════════════════════════════════════════════════════════════════

ADD a state variable for the current step:

  const [enrollStep, setEnrollStep] = useState(1);
  // 1 = select students, 2 = set stream/subjects per student

ADD a state variable for per-student config:

  const [studentConfigs, setStudentConfigs] = useState({});
  // { studentId: { stream: 'science'|'commerce'|'', subjects: ['Biology', ...] } }

When the admin clicks "Next →" (from step 1 to step 2):

  // Build initial config for each selected student
  const initialConfigs = {};
  selectedStudentsForEnroll.forEach(s => {
    const sid = s.id || s.studentId || s.regNo;
    initialConfigs[sid] = { stream: '', subjects: [] };
  });
  setStudentConfigs(initialConfigs);
  setEnrollStep(2);

RENDER step 2 as a scrollable list of student cards:

  {selectedStudentsForEnroll.map(student => {
    const sid = student.id || student.studentId || student.regNo;
    const config = studentConfigs[sid] || { stream: '', subjects: [] };
    const availableSubjects = safeLS('pba_subjects', [])
      .map(s => s.name || s)
      .filter(Boolean);
    return (
      <div key={sid} style={{
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontWeight: 600,
          fontSize: '14px',
          color: '#111827',
          marginBottom: '10px'
        }}>
          {student.name || student.studentName}
          <span style={{ color: '#6B7280', fontWeight: 400, marginLeft: '8px', fontSize: '12px' }}>
            {student.regNo}
          </span>
        </div>

        {/* Stream selector */}
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280',
                      letterSpacing: '0.05em', marginBottom: '6px' }}>
          STREAM
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {['Science', 'Commerce', 'None / Unset'].map(stream => (
            <button
              key={stream}
              onClick={() => setStudentConfigs(prev => ({
                ...prev,
                [sid]: { ...prev[sid], stream: stream === 'None / Unset' ? '' : stream.toLowerCase() }
              }))}
              style={{
                padding: '5px 14px',
                borderRadius: '6px',
                border: '1px solid',
                fontSize: '13px',
                cursor: 'pointer',
                borderColor: config.stream === (stream === 'None / Unset' ? '' : stream.toLowerCase())
                  ? '#2563EB' : '#D1D5DB',
                background: config.stream === (stream === 'None / Unset' ? '' : stream.toLowerCase())
                  ? '#2563EB' : '#ffffff',
                color: config.stream === (stream === 'None / Unset' ? '' : stream.toLowerCase())
                  ? '#ffffff' : '#374151',
                fontWeight: config.stream === (stream === 'None / Unset' ? '' : stream.toLowerCase())
                  ? 600 : 400
              }}
            >
              {stream}
            </button>
          ))}
        </div>

        {/* Subject checkboxes */}
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280',
                      letterSpacing: '0.05em', marginBottom: '6px' }}>
          SUBJECTS
        </div>
        <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px' }}>
          {(availableSubjects.length > 0 ? availableSubjects : ['Biology', 'Chemistry', 'Physics'])
            .map(subj => (
              <label key={subj} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '4px 0', cursor: 'pointer', fontSize: '13px', color: '#374151'
              }}>
                <input
                  type="checkbox"
                  checked={(config.subjects || []).includes(subj)}
                  onChange={e => {
                    const newSubjects = e.target.checked
                      ? [...(config.subjects || []), subj]
                      : (config.subjects || []).filter(s => s !== subj);
                    setStudentConfigs(prev => ({
                      ...prev,
                      [sid]: { ...prev[sid], subjects: newSubjects }
                    }));
                  }}
                />
                {subj}
              </label>
            ))
          }
        </div>
      </div>
    );
  })}

WHEN "Enroll Selected (N)" is clicked in step 2, save each
student into the batch WITH their individual stream and subjects:

  const newEnrollments = selectedStudentsForEnroll.map(student => {
    const sid = student.id || student.studentId || student.regNo;
    const config = studentConfigs[sid] || { stream: '', subjects: [] };
    return {
      id:          sid,
      regNo:       student.regNo || '',
      name:        student.name  || student.studentName || '',
      mobilePhone: student.mobilePhone || student.phone || '',
      parentPhone: student.parentPhone || '',
      status:      'active',
      stream:      config.stream    || '',
      subjects:    config.subjects  || [],
      enrolledAt:  new Date().toISOString()
    };
  });

  // Save to pba_batches
  const updatedBatches = (safeLS('pba_batches', []) || []).map(b =>
    b.id === selectedBatch.id
      ? { ...b, students: [...(b.students || []), ...newEnrollments] }
      : b
  );
  saveLS('pba_batches', updatedBatches);

  // Sync profiles to pba_students (no stream/subjects — profile only)
  const existingProfiles = safeLS('pba_students', []);
  const profileMap = {};
  (existingProfiles || []).forEach(p => { if (p.id) profileMap[p.id] = p; });
  newEnrollments.forEach(s => {
    if (!profileMap[s.id]) {
      profileMap[s.id] = {
        id: s.id, regNo: s.regNo, name: s.name,
        mobilePhone: s.mobilePhone, parentPhone: s.parentPhone, status: s.status
      };
    }
  });
  saveLS('pba_students', Object.values(profileMap));

  // Reset and close
  setEnrollStep(1);
  setStudentConfigs({});
  setSelectedStudentsForEnroll([]);
  setShowEnrollModal(false);

Also reset enrollStep to 1 whenever the modal is opened or closed.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. The "← Back" button in step 2 sets enrollStep(1) only —
   it does NOT clear the student selection
5. Step 1 button text changes from "Enroll Selected (N)" to "Next →"
   when N ≥ 1 student is selected
6. If only ONE student is selected, step 2 still shows (one card)
   for consistency — no skip logic
7. Run npm run build and confirm 0 errors
8. Then npm run deploy
9. List all files modified
```
