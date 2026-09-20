# PBA Full-Time Portal — Subject Manager: Wire Up All Buttons
## AntiGravity Prompt

---

```
The Subject Manager tab in GeneralAdminView.jsx renders correctly
(subject cards are showing with pencil and trash icons, and a
"+ Create Subject" button exists top-right) BUT NONE of the buttons
do anything when clicked — no modal opens.

This prompt adds the missing modal state + modal JSX + onClick
handlers to make all three actions work:
  (1) "+ Create Subject" button → opens create modal
  (2) Pencil icon on each card → opens edit modal pre-filled
  (3) Trash icon on each card → opens delete confirmation modal

Touch ONLY GeneralAdminView.jsx.
Do NOT change any other file.
Do NOT rebuild the Subject Manager UI — the cards already render.
Only ADD state, ADD modal JSX, and WIRE UP the onClick handlers.

════════════════════════════════════════════════════════════════
STEP 1 — ADD STATE (inside the GeneralAdminView component)
════════════════════════════════════════════════════════════════

Add these state variables at the top of the component,
alongside existing useState declarations:

  // Subject Manager modal state
  const [subjects, setSubjects] = useState(() => safeLS('pba_subjects', []));
  const [showSubjectModal, setShowSubjectModal]   = useState(false);
  const [editSubjectId, setEditSubjectId]         = useState(null);
  const [subjectForm, setSubjectForm] = useState({
    code: '', name: '', description: ''
  });
  const [showDeleteSubject, setShowDeleteSubject] = useState(false);
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState(null);

NOTE: If a `subjects` state variable already exists in the component
(even with a different initializer), do NOT add a duplicate —
just add the other four variables and update the existing subjects
state to use the lazy initializer:
  const [subjects, setSubjects] = useState(() => safeLS('pba_subjects', []));

════════════════════════════════════════════════════════════════
STEP 2 — ADD HELPER: getSubjectBatchCount
════════════════════════════════════════════════════════════════

Add this helper function inside the component:

  const getSubjectBatchCount = (subjectId) => {
    const batches = safeLS('pba_batches', []);
    return (batches || []).filter(b =>
      (b.subjects || []).some(bs => bs.subjectId === subjectId)
    ).length;
  };

════════════════════════════════════════════════════════════════
STEP 3 — WIRE UP the "+ Create Subject" button
════════════════════════════════════════════════════════════════

Find the existing "+ Create Subject" button in the Subject Manager
section. It currently looks like one of these:
  <button>+ Create Subject</button>
  <button onClick={...}>+ Create Subject</button>

REPLACE its onClick with:

  onClick={() => {
    setEditSubjectId(null);
    setSubjectForm({ code: '', name: '', description: '' });
    setShowSubjectModal(true);
  }}

If it has no onClick at all, ADD:
  onClick={() => {
    setEditSubjectId(null);
    setSubjectForm({ code: '', name: '', description: '' });
    setShowSubjectModal(true);
  }}

════════════════════════════════════════════════════════════════
STEP 4 — WIRE UP the pencil (✏️) icon on each subject card
════════════════════════════════════════════════════════════════

Each subject card renders a pencil icon button. It currently looks
like one of:
  <button>✏️</button>   or   <button>🖊</button>
  OR an <img> / emoji span used as a button

Find that element inside the subject card map/render and ADD/REPLACE
its onClick with:

  onClick={() => {
    setEditSubjectId(subject.id);
    setSubjectForm({
      code: subject.code || subject.subjectCode || '',
      name: subject.name || subject.subjectName || '',
      description: subject.description || ''
    });
    setShowSubjectModal(true);
  }}

Note: The subject object field names may be `subject.code` or
`subject.subjectCode`, and `subject.name` or `subject.subjectName`.
Use whichever matches how the cards currently read the subject data.

════════════════════════════════════════════════════════════════
STEP 5 — WIRE UP the trash (🗑️) icon on each subject card
════════════════════════════════════════════════════════════════

Find the trash icon button inside the same subject card render.
ADD/REPLACE its onClick with:

  onClick={() => {
    setDeleteSubjectTarget(subject);
    setShowDeleteSubject(true);
  }}

════════════════════════════════════════════════════════════════
STEP 6 — ADD the Create/Edit Subject modal JSX
════════════════════════════════════════════════════════════════

Add this modal to the component JSX — place it OUTSIDE the Subject
Manager tab content, near the bottom of the component's return
statement alongside any other existing modals:

  {showSubjectModal && (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 2000, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        width: '100%', maxWidth: '460px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', padding: '28px'
      }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '22px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800,
            color: '#1A202C' }}>
            {editSubjectId ? 'Edit Subject' : 'Create Subject'}
          </h3>
          <button
            onClick={() => setShowSubjectModal(false)}
            style={{
              background: '#F3F4F6', border: 'none', borderRadius: '8px',
              width: '34px', height: '34px', fontSize: '20px',
              cursor: 'pointer', color: '#6B7280'
            }}>
            ×
          </button>
        </div>

        {/* Subject Code */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '12px', fontWeight: 700, color: '#374151',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            display: 'block', marginBottom: '6px'
          }}>
            Subject Code *
          </label>
          <input
            type="text"
            value={subjectForm.code}
            onChange={e => setSubjectForm(prev => ({
              ...prev, code: e.target.value.toUpperCase().slice(0, 6)
            }))}
            placeholder="e.g. BIO"
            maxLength={6}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: '1px solid #E3E6EA', fontSize: '14px',
              fontWeight: 700, letterSpacing: '0.08em', boxSizing: 'border-box'
            }}
          />
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
            Short code shown on cards and timetable (max 6 chars)
          </div>
        </div>

        {/* Subject Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '12px', fontWeight: 700, color: '#374151',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            display: 'block', marginBottom: '6px'
          }}>
            Subject Name *
          </label>
          <input
            type="text"
            value={subjectForm.name}
            onChange={e => setSubjectForm(prev => ({
              ...prev, name: e.target.value
            }))}
            placeholder="e.g. Biology"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: '1px solid #E3E6EA', fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            fontSize: '12px', fontWeight: 700, color: '#374151',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            display: 'block', marginBottom: '6px'
          }}>
            Description <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
              (optional)
            </span>
          </label>
          <textarea
            value={subjectForm.description}
            onChange={e => setSubjectForm(prev => ({
              ...prev, description: e.target.value
            }))}
            placeholder="Brief description of the subject..."
            rows={2}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: '1px solid #E3E6EA', fontSize: '13px',
              resize: 'vertical', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Validation */}
        {(!subjectForm.code.trim() || !subjectForm.name.trim()) && (
          <p style={{
            fontSize: '12px', color: '#D97706', marginBottom: '12px',
            fontWeight: 600
          }}>
            ⚠ Subject Code and Name are required.
          </p>
        )}

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowSubjectModal(false)}
            style={{
              padding: '10px 20px', borderRadius: '8px',
              border: '1px solid #E3E6EA', background: 'white',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              color: '#374151'
            }}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (!subjectForm.code.trim() || !subjectForm.name.trim()) return;

              const existing = safeLS('pba_subjects', []);
              let updated;

              if (editSubjectId) {
                // EDIT: update the matching record
                updated = (existing || []).map(s =>
                  s.id === editSubjectId
                    ? {
                        ...s,
                        code: subjectForm.code.trim(),
                        subjectCode: subjectForm.code.trim(),
                        name: subjectForm.name.trim(),
                        subjectName: subjectForm.name.trim(),
                        description: subjectForm.description.trim()
                      }
                    : s
                );
              } else {
                // CREATE: push new record
                const newSubject = {
                  id: `sub_${Date.now()}`,
                  code: subjectForm.code.trim(),
                  subjectCode: subjectForm.code.trim(),
                  name: subjectForm.name.trim(),
                  subjectName: subjectForm.name.trim(),
                  description: subjectForm.description.trim(),
                  createdAt: new Date().toISOString()
                };
                updated = [...(existing || []), newSubject];
              }

              saveLS('pba_subjects', updated);
              setSubjects(updated);
              setShowSubjectModal(false);
              setEditSubjectId(null);
            }}
            disabled={!subjectForm.code.trim() || !subjectForm.name.trim()}
            style={{
              padding: '10px 24px', borderRadius: '8px',
              background: (!subjectForm.code.trim() || !subjectForm.name.trim())
                ? '#C7D2FE'
                : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              border: 'none', color: 'white',
              fontSize: '13px', fontWeight: 700,
              cursor: (!subjectForm.code.trim() || !subjectForm.name.trim())
                ? 'not-allowed' : 'pointer'
            }}>
            {editSubjectId ? 'Save Changes' : 'Create Subject'}
          </button>
        </div>

      </div>
    </div>
  )}

════════════════════════════════════════════════════════════════
STEP 7 — ADD the Delete Confirmation modal JSX
════════════════════════════════════════════════════════════════

Add this second modal immediately after the first one:

  {showDeleteSubject && deleteSubjectTarget && (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 2001, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        width: '100%', maxWidth: '400px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', padding: '28px'
      }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 800,
          color: '#1A202C' }}>
          Delete Subject?
        </h3>
        <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 8px' }}>
          You are about to delete{' '}
          <strong>
            {deleteSubjectTarget.name || deleteSubjectTarget.subjectName}
          </strong>{' '}
          ({deleteSubjectTarget.code || deleteSubjectTarget.subjectCode}).
        </p>

        {/* Warn if assigned to batches */}
        {getSubjectBatchCount(deleteSubjectTarget.id) > 0 && (
          <div style={{
            background: '#FFF7ED', border: '1px solid #FED7AA',
            borderRadius: '8px', padding: '10px 12px',
            fontSize: '12px', color: '#92400E', fontWeight: 600,
            marginBottom: '16px'
          }}>
            ⚠ This subject is assigned to{' '}
            {getSubjectBatchCount(deleteSubjectTarget.id)} batch
            {getSubjectBatchCount(deleteSubjectTarget.id) > 1 ? 'es' : ''}.
            Deleting it will remove it from the subject list but will NOT
            automatically remove it from those batches.
          </div>
        )}

        <p style={{
          fontSize: '12px', color: '#6B7280', margin: '0 0 20px'
        }}>
          This action cannot be undone.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              setShowDeleteSubject(false);
              setDeleteSubjectTarget(null);
            }}
            style={{
              padding: '10px 20px', borderRadius: '8px',
              border: '1px solid #E3E6EA', background: 'white',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              color: '#374151'
            }}>
            Cancel
          </button>
          <button
            onClick={() => {
              const existing = safeLS('pba_subjects', []);
              const updated = (existing || []).filter(
                s => s.id !== deleteSubjectTarget.id
              );
              saveLS('pba_subjects', updated);
              setSubjects(updated);
              setShowDeleteSubject(false);
              setDeleteSubjectTarget(null);
            }}
            style={{
              padding: '10px 22px', borderRadius: '8px',
              background: '#DC2626', border: 'none', color: 'white',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer'
            }}>
            Delete Subject
          </button>
        </div>
      </div>
    </div>
  )}

════════════════════════════════════════════════════════════════
STEP 8 — ENSURE subject cards read from state, not stale data
════════════════════════════════════════════════════════════════

Find where the Subject Manager renders its grid of subject cards.
It maps over some array — that array MUST be the `subjects` state
variable (set in STEP 1 above), not a direct safeLS() call.

If the map looks like:
  safeLS('pba_subjects', []).map(subject => ...)
  OR
  pba_subjects.map(subject => ...)

CHANGE IT TO:
  (subjects || []).map(subject => ...)

This ensures the cards re-render immediately when a subject is
created, edited, or deleted.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. Do NOT add duplicate state declarations — check first
5. The `subjects` state is the single source of truth for
   the subject card grid — always use (subjects || []).map()
6. The save handler writes BOTH `code` and `subjectCode`,
   and both `name` and `subjectName` to handle any variation
   in how other parts of the app read subject data
7. Run npm run build and confirm 0 errors
8. Then npm run deploy to push to GitHub and trigger Vercel deployment
9. List all files modified
```
