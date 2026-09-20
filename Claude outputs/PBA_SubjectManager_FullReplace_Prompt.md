# PBA Full-Time Portal — Subject Manager: Complete Section Replacement
## AntiGravity Prompt

---

```
The Subject Manager buttons (Create Subject, pencil edit, trash delete)
do not work. Previous fixes failed because AntiGravity partially applied
them. This prompt REPLACES the entire Subject Manager tab content and
all its supporting state/handlers in one atomic operation.

Touch ONLY GeneralAdminView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
STEP 1 — ADD these state declarations at the TOP of the
          GeneralAdminView component, with existing useState calls
════════════════════════════════════════════════════════════════

Find the block of useState declarations at the top of the component.
ADD these lines there (skip any that already exist with the same name):

  const [subjects, setSubjects]                   = useState(() => safeLS('pba_subjects', []));
  const [showSubjectModal, setShowSubjectModal]   = useState(false);
  const [editSubjectId, setEditSubjectId]         = useState(null);
  const [subjectForm, setSubjectForm]             = useState({ code: '', name: '', description: '' });
  const [showDeleteSubject, setShowDeleteSubject] = useState(false);
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState(null);

════════════════════════════════════════════════════════════════
STEP 2 — FIND the Subject Manager tab content section
          and REPLACE it with the JSX below
════════════════════════════════════════════════════════════════

FIND: The JSX block that renders when the Subject Manager tab is
active. It currently contains a heading "Subject Manager", a
"+ Create Subject" button, and a grid of subject cards.

It will look something like:
  <div> ... Subject Manager ... + Create Subject ... subject cards ... </div>

REPLACE that entire block with:

  <div>
    {/* ── Subject Manager Header ── */}
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: '24px'
    }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800,
          color: '#1A202C' }}>
          Subject Manager
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
          Create subjects and assign them to batches with lecturer allocations.
        </p>
      </div>
      <button
        onClick={() => {
          setEditSubjectId(null);
          setSubjectForm({ code: '', name: '', description: '' });
          setShowSubjectModal(true);
        }}
        style={{
          padding: '10px 20px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          border: 'none', color: 'white',
          fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
        + Create Subject
      </button>
    </div>

    {/* ── Subject Cards Grid ── */}
    {(subjects || []).length === 0 ? (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        color: '#9CA3AF'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
        <div style={{ fontWeight: 700, fontSize: '15px',
          marginBottom: '6px', color: '#6B7280' }}>
          No subjects yet
        </div>
        <div style={{ fontSize: '13px' }}>
          Click "+ Create Subject" to add your first subject.
        </div>
      </div>
    ) : (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {(subjects || []).map(subject => {
          const batchCount = (() => {
            const batches = safeLS('pba_batches', []);
            return (batches || []).filter(b =>
              (b.subjects || []).some(bs =>
                bs.subjectId === subject.id
              )
            ).length;
          })();

          return (
            <div key={subject.id} style={{
              background: 'white', borderRadius: '14px',
              border: '1px solid #E8ECF0',
              padding: '18px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
              {/* Card top row */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: '10px'
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: 800,
                  color: '#4F46E5', background: '#EEF2FF',
                  padding: '3px 8px', borderRadius: '6px',
                  letterSpacing: '0.06em'
                }}>
                  {subject.code || subject.subjectCode || '—'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {/* Edit button */}
                  <button
                    onClick={() => {
                      setEditSubjectId(subject.id);
                      setSubjectForm({
                        code: subject.code || subject.subjectCode || '',
                        name: subject.name || subject.subjectName || '',
                        description: subject.description || ''
                      });
                      setShowSubjectModal(true);
                    }}
                    title="Edit subject"
                    style={{
                      background: '#F8FAFC', border: '1px solid #E3E6EA',
                      borderRadius: '7px', width: '30px', height: '30px',
                      cursor: 'pointer', fontSize: '14px',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    ✏️
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => {
                      setDeleteSubjectTarget(subject);
                      setShowDeleteSubject(true);
                    }}
                    title="Delete subject"
                    style={{
                      background: '#FEF2F2', border: '1px solid #FCA5A5',
                      borderRadius: '7px', width: '30px', height: '30px',
                      cursor: 'pointer', fontSize: '14px',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    🗑️
                  </button>
                </div>
              </div>

              {/* Subject name */}
              <div style={{
                fontSize: '16px', fontWeight: 800, color: '#1A202C',
                marginBottom: '10px'
              }}>
                {subject.name || subject.subjectName || '—'}
              </div>

              {/* Description */}
              {(subject.description) && (
                <div style={{
                  fontSize: '12px', color: '#6B7280',
                  marginBottom: '10px'
                }}>
                  {subject.description}
                </div>
              )}

              {/* Batch count */}
              <div style={{
                fontSize: '12px', fontWeight: 600,
                color: batchCount > 0 ? '#059669' : '#9CA3AF'
              }}>
                {batchCount > 0
                  ? `✓ Assigned to ${batchCount} batch${batchCount > 1 ? 'es' : ''}`
                  : '— Not assigned to any batch'}
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* ── Create / Edit Subject Modal ── */}
    {showSubjectModal && (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 2000,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'white', borderRadius: '16px',
          width: '100%', maxWidth: '460px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          padding: '28px'
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

          {/* Code */}
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
              onChange={e => setSubjectForm(p => ({
                ...p, code: e.target.value.toUpperCase().slice(0, 6)
              }))}
              placeholder="e.g. BIO"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid #E3E6EA', fontSize: '14px',
                fontWeight: 700, boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Name */}
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
              onChange={e => setSubjectForm(p => ({
                ...p, name: e.target.value
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
              Description{' '}
              <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
                (optional)
              </span>
            </label>
            <textarea
              value={subjectForm.description}
              onChange={e => setSubjectForm(p => ({
                ...p, description: e.target.value
              }))}
              rows={2}
              placeholder="Brief description..."
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid #E3E6EA', fontSize: '13px',
                resize: 'vertical', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            display: 'flex', gap: '10px', justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowSubjectModal(false)}
              style={{
                padding: '10px 20px', borderRadius: '8px',
                border: '1px solid #E3E6EA', background: 'white',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}>
              Cancel
            </button>
            <button
              onClick={() => {
                if (!subjectForm.code.trim() || !subjectForm.name.trim()) return;
                const existing = safeLS('pba_subjects', []);
                let updated;
                if (editSubjectId) {
                  updated = (existing || []).map(s =>
                    s.id === editSubjectId
                      ? { ...s,
                          code: subjectForm.code.trim(),
                          subjectCode: subjectForm.code.trim(),
                          name: subjectForm.name.trim(),
                          subjectName: subjectForm.name.trim(),
                          description: subjectForm.description.trim() }
                      : s
                  );
                } else {
                  const newSub = {
                    id: `sub_${Date.now()}`,
                    code: subjectForm.code.trim(),
                    subjectCode: subjectForm.code.trim(),
                    name: subjectForm.name.trim(),
                    subjectName: subjectForm.name.trim(),
                    description: subjectForm.description.trim(),
                    createdAt: new Date().toISOString()
                  };
                  updated = [...(existing || []), newSub];
                }
                saveLS('pba_subjects', updated);
                setSubjects(updated);
                setShowSubjectModal(false);
                setEditSubjectId(null);
              }}
              style={{
                padding: '10px 24px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                border: 'none', color: 'white',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}>
              {editSubjectId ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Delete Confirmation Modal ── */}
    {showDeleteSubject && deleteSubjectTarget && (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 2001,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'white', borderRadius: '16px',
          width: '100%', maxWidth: '400px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          padding: '28px'
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 800 }}>
            Delete Subject?
          </h3>
          <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 16px' }}>
            You are about to delete{' '}
            <strong>
              {deleteSubjectTarget.name || deleteSubjectTarget.subjectName}
            </strong>{' '}
            ({deleteSubjectTarget.code || deleteSubjectTarget.subjectCode}).
            This cannot be undone.
          </p>
          <div style={{
            display: 'flex', gap: '10px', justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => {
                setShowDeleteSubject(false);
                setDeleteSubjectTarget(null);
              }}
              style={{
                padding: '10px 20px', borderRadius: '8px',
                border: '1px solid #E3E6EA', background: 'white',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer'
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
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
  </div>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx
2. The Subject Manager section replacement in STEP 2 includes
   the modals INLINE inside the tab content div — do NOT move
   the modals outside or the state references will break
3. Use only inline style={{}} — no Tailwind
4. safeLS() for ALL localStorage reads; saveLS() for writes
5. Run npm run build and confirm 0 errors
6. Then npm run deploy to push to GitHub and trigger Vercel
7. List all files modified
```
