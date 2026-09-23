# PBA Full-Time Portal — Add Batch Assignment to Lecturer Form
## AntiGravity Prompt

---

```
When creating or editing a lecturer profile, the admin should
be able to select which BATCHES the lecturer teaches. This links
the lecturer to specific batches alongside their subjects, and
that mapping should be used wherever lecturers are assigned to
sessions in the timetable.

Touch ONLY the file containing the lecturer create/edit form
(likely LecturersView.jsx or GeneralAdminView.jsx — whichever
has the "Add Lecturer" / "Edit Lecturer" form with "Subjects Taught"
and "Weekly Availability").

Do NOT change any other file.

════════════════════════════════════════════════════════════════
WHAT TO ADD
════════════════════════════════════════════════════════════════

Add a "BATCHES TAUGHT" multi-select section to the lecturer form,
positioned AFTER the "SUBJECTS TAUGHT" section and BEFORE
"ASSIGN ASSISTANT(S)".

The section should list all batches from pba_batches as checkboxes,
grouped with the batch name and branch label (same style as the
existing Subjects list).

════════════════════════════════════════════════════════════════
STEP 1 — Add batchIds field to lecturer form state
════════════════════════════════════════════════════════════════

Find the lecturer form state initializer. It will look like:

  const [lecturerForm, setLecturerForm] = useState({
    name: '',
    branch: '',
    employmentType: '',
    subjects: [],
    ...
  });

ADD batchIds to the initial state:

  batchIds: [],   // array of batch ids this lecturer teaches

Also update wherever the form is pre-populated for EDIT mode —
load the lecturer's existing batchIds:

  batchIds: existingLecturer.batchIds || [],

════════════════════════════════════════════════════════════════
STEP 2 — Add "BATCHES TAUGHT" section to the form JSX
════════════════════════════════════════════════════════════════

AFTER the "SUBJECTS TAUGHT" checkboxes section, INSERT:

  {/* ── BATCHES TAUGHT ── */}
  <div style={{ marginBottom: '20px' }}>
    <label style={{
      display: 'block',
      fontSize: '11px',
      fontWeight: 600,
      color: '#6B7280',
      letterSpacing: '0.05em',
      marginBottom: '8px'
    }}>
      BATCHES TAUGHT
    </label>
    <div style={{
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '10px',
      maxHeight: '180px',
      overflowY: 'auto'
    }}>
      {(safeLS('pba_batches', []) || []).length === 0
        ? <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
            No batches created yet.
          </p>
        : (safeLS('pba_batches', []) || []).map(batch => (
            <label key={batch.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 4px',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={(lecturerForm.batchIds || []).includes(batch.id)}
                  onChange={e => {
                    const updated = e.target.checked
                      ? [...(lecturerForm.batchIds || []), batch.id]
                      : (lecturerForm.batchIds || []).filter(id => id !== batch.id);
                    setLecturerForm(prev => ({ ...prev, batchIds: updated }));
                  }}
                />
                <span style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {batch.name}
                </span>
              </div>
              {batch.branch && (
                <span style={{
                  fontSize: '11px',
                  color: '#6B7280',
                  background: '#F3F4F6',
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  {batch.branch}
                </span>
              )}
            </label>
          ))
      }
    </div>
  </div>
  {/* ── End BATCHES TAUGHT ── */}

════════════════════════════════════════════════════════════════
STEP 3 — Save batchIds to the lecturer record
════════════════════════════════════════════════════════════════

Find the lecturer save handler. When the lecturer record is built
for saving to pba_lecturers (or whatever key is used), ensure
batchIds is included:

  const lecturerRecord = {
    ...existingFields,
    batchIds: lecturerForm.batchIds || [],
    // keep all other existing fields
  };

════════════════════════════════════════════════════════════════
STEP 4 — Use batchIds in session scheduling (if applicable)
════════════════════════════════════════════════════════════════

In the "Schedule a Session" modal, when the admin selects a BATCH,
filter the LECTURER dropdown to show only lecturers whose batchIds
include the selected batch:

Find the lecturer options in the Schedule Session modal. Replace:

  const lecturerOptions = safeLS('pba_lecturers', []);

With:

  const allLecturers = safeLS('pba_lecturers', []);
  const lecturerOptions = selectedBatchId
    ? (allLecturers || []).filter(l =>
        !(l.batchIds || []).length ||   // show if no batches set (unfiltered)
        (l.batchIds || []).includes(selectedBatchId)
      )
    : allLecturers;

This shows all unassigned lecturers AND lecturers who teach
that specific batch. If a lecturer has no batchIds set, they
appear for all batches (backward compatible).

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY the file containing the lecturer form and/or
   the session scheduling modal
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. batchIds is an array of batch IDs (UUIDs), not batch names
5. A lecturer with batchIds: [] (empty) is still valid —
   they can be scheduled for any batch
6. The "BATCHES TAUGHT" section reads pba_batches live at render
   time — no need to store batch names in the lecturer record
7. Run npm run build and confirm 0 errors
8. Then npm run deploy
9. List all files modified
```
