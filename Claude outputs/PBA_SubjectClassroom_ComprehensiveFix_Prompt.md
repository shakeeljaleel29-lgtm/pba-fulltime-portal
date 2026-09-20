# PBA Full-Time Portal — Subject Manager & Classroom Manager: Comprehensive Fix
## AntiGravity Prompt

---

```
Fix all broken interactions in the Subject Manager and Classroom Manager
tabs of GeneralAdminView.jsx:

  (1) "Create Subject" button opens a working modal → saves to pba_subjects
  (2) Edit (pencil) button on each subject card → opens pre-filled Edit modal
  (3) Delete (trash) button on each subject card → confirmation → removes from pba_subjects
  (4) "Add Classroom" button opens a working modal → saves to pba_classrooms
  (5) Edit/Deactivate links on classroom cards → work correctly
  (6) Session modal gets a CLASSROOM dropdown → saves classroomId to pba_timetable
  (7) Daily Allocation Sheet → renders from pba_timetable (today's sessions)
  (8) "Share via WhatsApp" on Allocation Sheet → formats and opens wa.me link
  (9) Subject cards show correct "Assigned to N batches" count from pba_batches

Touch ONLY GeneralAdminView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
DATA MODELS
════════════════════════════════════════════════════════════════

pba_subjects (array):
  {
    id:          'sub_1234',
    subjectCode: 'BIO',          ← short code, uppercase (max 6 chars)
    subjectName: 'Biology',
    description: '',             ← optional
    createdAt:   '2026-...'
  }

pba_classrooms (array) — already used by Classroom Manager:
  {
    id:         'room_1234',
    name:       'Hall A',
    branch:     'Kohuwala',
    capacity:   40,
    type:       'Lecture Hall',  ← Lecture Hall | Classroom | Science Lab | Computer Lab | Other
    amenities:  ['Projector','AC','Whiteboard'],
    status:     'Active',        ← Active | Inactive
    createdAt:  '2026-...'
  }

pba_timetable sessions — ALREADY EXIST. Add two new fields when saving:
  classroomId:   'room_1234'    ← NEW (was missing)
  classroomName: 'Hall A'       ← NEW (was missing)

════════════════════════════════════════════════════════════════
STATE TO ADD (add alongside existing state in the component)
════════════════════════════════════════════════════════════════

  // ── Subject Manager state ──
  const [subjects, setSubjects] = useState(
    () => safeLS('pba_subjects', [])
  );
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editSubjectId, setEditSubjectId]       = useState(null); // null = Create
  const [subjectForm, setSubjectForm] = useState({
    subjectCode: '', subjectName: '', description: ''
  });
  const [showDeleteSubject, setShowDeleteSubject] = useState(false);
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState(null);

  // ── Classroom Manager state ──
  const [classrooms, setClassrooms] = useState(
    () => safeLS('pba_classrooms', [])
  );
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [editClassroomId, setEditClassroomId]       = useState(null);
  const [classroomForm, setClassroomForm] = useState({
    name: '', branch: '', capacity: 30,
    type: 'Classroom', amenities: [], status: 'Active'
  });
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateTarget, setDeactivateTarget]           = useState(null);

  // ── Allocation Sheet ──
  // timetable state likely already exists; if not, add:
  const [timetable, setTimetable] = useState(
    () => safeLS('pba_timetable', [])
  );

════════════════════════════════════════════════════════════════
FIX 1 — SUBJECT MANAGER: Create Subject modal
════════════════════════════════════════════════════════════════

FIND the "+ Create Subject" button and wire its onClick:

  <button
    onClick={() => {
      setEditSubjectId(null);
      setSubjectForm({ subjectCode: '', subjectName: '', description: '' });
      setShowSubjectModal(true);
    }}
    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none',
      background: '#4F46E5', color: 'white', fontSize: '14px',
      fontWeight: 700, cursor: 'pointer' }}>
    + Create Subject
  </button>

FIND the edit (pencil ✏️) button on each subject card and wire it:

  onClick={() => {
    setEditSubjectId(subject.id);
    setSubjectForm({
      subjectCode: subject.subjectCode || '',
      subjectName: subject.subjectName || '',
      description: subject.description || ''
    });
    setShowSubjectModal(true);
  }}

FIND the delete (trash 🗑️) button on each subject card and wire it:

  onClick={() => {
    setDeleteSubjectTarget(subject);
    setShowDeleteSubject(true);
  }}

ADD the "Assigned to N batches" count to each subject card.
  Derive it at render time:

  const getSubjectBatchCount = (subjectId) => {
    const batches = safeLS('pba_batches', []);
    return (batches || []).filter(b =>
      (b.subjects || []).some(bs => bs.subjectId === subjectId)
    ).length;
  };

  // In the subject card text (replace or update existing):
  const batchCount = getSubjectBatchCount(subject.id);
  <div style={{ fontSize: '12px', color: batchCount > 0 ? '#059669' : '#9CA3AF',
    marginTop: '6px' }}>
    {batchCount > 0
      ? `✓ Assigned to ${batchCount} batch${batchCount > 1 ? 'es' : ''}`
      : '— Not assigned to any batch'}
  </div>

════════════════════════════════════════════════════════════════
FIX 1B — SUBJECT MANAGER MODAL JSX
════════════════════════════════════════════════════════════════

Add this modal to the component JSX (render it outside the tab panels):

  {showSubjectModal && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 2000, display: 'flex', alignItems: 'center',
      justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '14px', width: '460px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1E1B4B,#4F46E5)',
          padding: '18px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: '16px', color: 'white' }}>
            {editSubjectId ? '✏️ Edit Subject' : '+ Create Subject'}
          </div>
          <button onClick={() => setShowSubjectModal(false)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', borderRadius: '6px', padding: '4px 12px',
              cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>

        <div style={{ padding: '24px' }}>

          {/* Subject Code */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'block', marginBottom: '6px' }}>
              Subject Code *
            </label>
            <input
              type="text"
              maxLength={6}
              value={subjectForm.subjectCode}
              onChange={e => setSubjectForm(prev => ({
                ...prev, subjectCode: e.target.value.toUpperCase()
              }))}
              placeholder="e.g. BIO, CHEM, MATH"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid #E3E6EA', fontSize: '14px', fontWeight: 700,
                color: '#4F46E5', boxSizing: 'border-box', letterSpacing: '0.05em' }}
            />
          </div>

          {/* Subject Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'block', marginBottom: '6px' }}>
              Subject Name *
            </label>
            <input
              type="text"
              value={subjectForm.subjectName}
              onChange={e => setSubjectForm(prev => ({
                ...prev, subjectName: e.target.value
              }))}
              placeholder="e.g. Biology, Chemistry, Mathematics"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid #E3E6EA', fontSize: '14px',
                boxSizing: 'border-box' }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'block', marginBottom: '6px' }}>
              Description (optional)
            </label>
            <textarea
              value={subjectForm.description}
              onChange={e => setSubjectForm(prev => ({
                ...prev, description: e.target.value
              }))}
              placeholder="Brief description of this subject..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid #E3E6EA', fontSize: '13px',
                resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowSubjectModal(false)}
              style={{ padding: '10px 20px', borderRadius: '8px',
                border: '1px solid #E3E6EA', background: 'white',
                color: '#374151', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              disabled={!subjectForm.subjectCode.trim() || !subjectForm.subjectName.trim()}
              onClick={() => {
                const code = subjectForm.subjectCode.trim();
                const name = subjectForm.subjectName.trim();
                if (!code || !name) return;
                const existing = safeLS('pba_subjects', []);
                let updated;
                if (editSubjectId) {
                  updated = (existing || []).map(s =>
                    s.id === editSubjectId
                      ? { ...s, subjectCode: code, subjectName: name,
                          description: subjectForm.description.trim() }
                      : s
                  );
                } else {
                  const newSub = {
                    id: `sub_${Date.now()}`,
                    subjectCode: code,
                    subjectName: name,
                    description: subjectForm.description.trim(),
                    createdAt: new Date().toISOString()
                  };
                  updated = [...(existing || []), newSub];
                }
                saveLS('pba_subjects', updated);
                setSubjects(updated);
                setShowSubjectModal(false);
              }}
              style={{
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: (subjectForm.subjectCode.trim() && subjectForm.subjectName.trim())
                  ? '#4F46E5' : '#E5E7EB',
                color: (subjectForm.subjectCode.trim() && subjectForm.subjectName.trim())
                  ? 'white' : '#9CA3AF',
                fontSize: '13px', fontWeight: 700,
                cursor: (subjectForm.subjectCode.trim() && subjectForm.subjectName.trim())
                  ? 'pointer' : 'not-allowed'
              }}>
              {editSubjectId ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )}

════════════════════════════════════════════════════════════════
FIX 1C — SUBJECT DELETE CONFIRMATION MODAL
════════════════════════════════════════════════════════════════

  {showDeleteSubject && deleteSubjectTarget && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 2100, display: 'flex', alignItems: 'center',
      justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '14px', width: '400px',
        padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
        <div style={{ fontWeight: 800, fontSize: '17px', color: '#1A202C',
          marginBottom: '8px' }}>
          Delete {deleteSubjectTarget.subjectName}?
        </div>
        {(() => {
          const count = getSubjectBatchCount(deleteSubjectTarget.id);
          return count > 0 ? (
            <div style={{ padding: '10px 14px', background: '#FEF3C7',
              border: '1px solid #F59E0B', borderRadius: '8px',
              fontSize: '12px', color: '#92400E', fontWeight: 600,
              marginBottom: '16px' }}>
              ⚠ This subject is assigned to {count} batch{count > 1 ? 'es' : ''}.
              Deleting it will not remove batch assignments automatically.
              Remove it from batches first in Batch Manager → Edit Batch → Assign Subjects.
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
              This cannot be undone. The subject will be removed from the subject list.
            </div>
          );
        })()}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => { setShowDeleteSubject(false); setDeleteSubjectTarget(null); }}
            style={{ padding: '10px 24px', borderRadius: '8px',
              border: '1px solid #E3E6EA', background: 'white',
              color: '#374151', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer' }}>
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
            style={{ padding: '10px 24px', borderRadius: '8px', border: 'none',
              background: '#DC2626', color: 'white',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )}

════════════════════════════════════════════════════════════════
FIX 2 — CLASSROOM MANAGER: Add/Edit Classroom modal
════════════════════════════════════════════════════════════════

The branch options must match the existing branches your institute uses.
Use a free-text input for branch (or populate from pba_batches branches).

FIND the "+ Add Classroom" button and wire it:

  onClick={() => {
    setEditClassroomId(null);
    setClassroomForm({
      name: '', branch: '', capacity: 30,
      type: 'Classroom', amenities: [], status: 'Active'
    });
    setShowClassroomModal(true);
  }}

FIND the "Edit" link on each classroom card:

  onClick={() => {
    setEditClassroomId(room.id);
    setClassroomForm({
      name:      room.name      || '',
      branch:    room.branch    || '',
      capacity:  room.capacity  || 30,
      type:      room.type      || 'Classroom',
      amenities: room.amenities || [],
      status:    room.status    || 'Active'
    });
    setShowClassroomModal(true);
  }}

FIND the "Deactivate" link on each classroom card:

  onClick={() => {
    setDeactivateTarget(room);
    setShowDeactivateConfirm(true);
  }}

ADD the Classroom modal JSX:

  {showClassroomModal && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 2000, display: 'flex', alignItems: 'center',
      justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '14px', width: '500px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0F172A,#1D4ED8)',
          padding: '18px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: '16px', color: 'white' }}>
            {editClassroomId ? '✏️ Edit Classroom' : '+ Add Classroom'}
          </div>
          <button onClick={() => setShowClassroomModal(false)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', borderRadius: '6px', padding: '4px 12px',
              cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column',
          gap: '16px' }}>

          {/* Room Name */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'block', marginBottom: '6px' }}>Room / Hall Name *</label>
            <input type="text"
              value={classroomForm.name}
              onChange={e => setClassroomForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Hall A, Lab 01, Room 3B"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid #E3E6EA', fontSize: '14px',
                boxSizing: 'border-box' }} />
          </div>

          {/* Branch */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'block', marginBottom: '6px' }}>Branch / Location *</label>
            <input type="text"
              value={classroomForm.branch}
              onChange={e => setClassroomForm(p => ({ ...p, branch: e.target.value }))}
              placeholder="e.g. Kohuwala, Wattala, Panadura"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid #E3E6EA', fontSize: '14px',
                boxSizing: 'border-box' }} />
          </div>

          {/* Capacity + Type row */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                display: 'block', marginBottom: '6px' }}>Seating Capacity</label>
              <input type="number" min={1} max={500}
                value={classroomForm.capacity}
                onChange={e => setClassroomForm(p => ({
                  ...p, capacity: Number(e.target.value) || 1
                }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '14px',
                  boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                display: 'block', marginBottom: '6px' }}>Room Type</label>
              <select
                value={classroomForm.type}
                onChange={e => setClassroomForm(p => ({ ...p, type: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '14px',
                  background: 'white', boxSizing: 'border-box' }}>
                {['Classroom','Lecture Hall','Science Lab','Computer Lab','Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'block', marginBottom: '8px' }}>Amenities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Projector','Whiteboard','AC','Lab Equipment',
                'Smart Board','CCTV','WiFi'].map(amenity => {
                const checked = (classroomForm.amenities || []).includes(amenity);
                return (
                  <label key={amenity}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                      border: `1px solid ${checked ? '#4F46E5' : '#E3E6EA'}`,
                      background: checked ? '#EEF2FF' : 'white',
                      color: checked ? '#4F46E5' : '#374151',
                      fontSize: '12px', fontWeight: 600,
                      userSelect: 'none' }}>
                    <input type="checkbox" checked={checked}
                      onChange={() => {
                        setClassroomForm(p => ({
                          ...p,
                          amenities: checked
                            ? (p.amenities || []).filter(a => a !== amenity)
                            : [...(p.amenities || []), amenity]
                        }));
                      }}
                      style={{ display: 'none' }} />
                    {amenity}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status (edit only) */}
          {editClassroomId && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                display: 'block', marginBottom: '6px' }}>Status</label>
              <select
                value={classroomForm.status}
                onChange={e => setClassroomForm(p => ({ ...p, status: e.target.value }))}
                style={{ padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #E3E6EA', fontSize: '14px',
                  background: 'white' }}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end',
            paddingTop: '8px' }}>
            <button onClick={() => setShowClassroomModal(false)}
              style={{ padding: '10px 20px', borderRadius: '8px',
                border: '1px solid #E3E6EA', background: 'white',
                color: '#374151', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              disabled={!classroomForm.name.trim() || !classroomForm.branch.trim()}
              onClick={() => {
                if (!classroomForm.name.trim() || !classroomForm.branch.trim()) return;
                const existing = safeLS('pba_classrooms', []);
                let updated;
                if (editClassroomId) {
                  updated = (existing || []).map(r =>
                    r.id === editClassroomId
                      ? { ...r, ...classroomForm, name: classroomForm.name.trim(),
                          branch: classroomForm.branch.trim() }
                      : r
                  );
                } else {
                  const newRoom = {
                    id: `room_${Date.now()}`,
                    ...classroomForm,
                    name:   classroomForm.name.trim(),
                    branch: classroomForm.branch.trim(),
                    createdAt: new Date().toISOString()
                  };
                  updated = [...(existing || []), newRoom];
                }
                saveLS('pba_classrooms', updated);
                setClassrooms(updated);
                setShowClassroomModal(false);
              }}
              style={{
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: (classroomForm.name.trim() && classroomForm.branch.trim())
                  ? '#1D4ED8' : '#E5E7EB',
                color: (classroomForm.name.trim() && classroomForm.branch.trim())
                  ? 'white' : '#9CA3AF',
                fontSize: '13px', fontWeight: 700,
                cursor: (classroomForm.name.trim() && classroomForm.branch.trim())
                  ? 'pointer' : 'not-allowed'
              }}>
              {editClassroomId ? 'Save Changes' : 'Add Classroom'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )}

  {/* Deactivate confirmation */}
  {showDeactivateConfirm && deactivateTarget && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 2100, display: 'flex', alignItems: 'center',
      justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '14px', width: '380px',
        padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚠️</div>
        <div style={{ fontWeight: 800, fontSize: '16px', color: '#1A202C',
          marginBottom: '8px' }}>
          {deactivateTarget.status === 'Active'
            ? `Deactivate ${deactivateTarget.name}?`
            : `Reactivate ${deactivateTarget.name}?`}
        </div>
        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
          {deactivateTarget.status === 'Active'
            ? 'This classroom will be hidden from session scheduling until reactivated.'
            : 'This classroom will become available for session scheduling again.'}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => {
            setShowDeactivateConfirm(false); setDeactivateTarget(null);
          }}
            style={{ padding: '10px 20px', borderRadius: '8px',
              border: '1px solid #E3E6EA', background: 'white',
              color: '#374151', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => {
              const existing = safeLS('pba_classrooms', []);
              const updated = (existing || []).map(r =>
                r.id === deactivateTarget.id
                  ? { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' }
                  : r
              );
              saveLS('pba_classrooms', updated);
              setClassrooms(updated);
              setShowDeactivateConfirm(false);
              setDeactivateTarget(null);
            }}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: deactivateTarget.status === 'Active' ? '#D97706' : '#059669',
              color: 'white', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer' }}>
            {deactivateTarget.status === 'Active' ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </div>
    </div>
  )}

════════════════════════════════════════════════════════════════
FIX 3 — SCHEDULE SESSION MODAL: Add Classroom dropdown
════════════════════════════════════════════════════════════════

File: GeneralAdminView.jsx
Location: Schedule a Session modal AND Edit Session modal

FIND the sessionForm state and add two new fields:
  classroomId:   ''
  classroomName: ''

In the session form reset (when opening a new session modal), include:
  classroomId: '', classroomName: ''

ADD this field block to the session modal form (after the TIME fields
and before the save button, or in a logical position in the form):

  {/* CLASSROOM (optional) */}
  <div>
    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151',
      textTransform: 'uppercase', letterSpacing: '0.05em',
      display: 'block', marginBottom: '6px' }}>
      Classroom / Room (optional)
    </label>
    <select
      value={sessionForm.classroomId || ''}
      onChange={e => {
        const room = (classrooms || []).find(r => r.id === e.target.value);
        setSessionForm(prev => ({
          ...prev,
          classroomId:   e.target.value,
          classroomName: room?.name || ''
        }));
      }}
      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px',
        border: '1px solid #E3E6EA', fontSize: '13px', background: 'white' }}>
      <option value="">— No classroom assigned —</option>
      {(classrooms || [])
        .filter(r => r.status === 'Active')
        .map(r => (
          <option key={r.id} value={r.id}>
            {r.name} — {r.branch} ({r.capacity} seats)
          </option>
        ))}
    </select>
  </div>

WHEN SAVING the session, include classroomId + classroomName in the
session object written to pba_timetable:

  const sessionToSave = {
    ...newSession,
    classroomId:   sessionForm.classroomId   || '',
    classroomName: sessionForm.classroomName || ''
    // ... all your other existing fields
  };

════════════════════════════════════════════════════════════════
FIX 4 — DAILY ALLOCATION SHEET: Render from pba_timetable
════════════════════════════════════════════════════════════════

File: GeneralAdminView.jsx
Location: Classroom Manager tab → Daily Allocation Sheet section

The "Daily Allocation Sheet (Sunday/Monday/...)" heading and table
ALREADY EXISTS in the UI. Fix the table body to render real data.

ADD this derivation INSIDE the Classroom Manager tab render
(before the JSX return):

  // Get today's day name for the allocation sheet
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  // e.g. 'Monday', 'Tuesday', ... 'Sunday'

  // Pull today's sessions from pba_timetable
  const todayAllocations = (timetable || [])
    .filter(s => s.day === todayDayName)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

UPDATE the section heading to show the actual day:

  <div style={{ fontWeight: 700, fontSize: '15px', color: '#1A202C' }}>
    Daily Allocation Sheet ({todayDayName})
  </div>

UPDATE the table body to render todayAllocations:

  <tbody>
    {(todayAllocations || []).length === 0 ? (
      <tr>
        <td colSpan={6} style={{ padding: '32px', textAlign: 'center',
          color: '#9CA3AF', fontSize: '13px' }}>
          No sessions scheduled for {todayDayName}.
          Sessions appear here once scheduled in the Visual Timetable Builder.
        </td>
      </tr>
    ) : (
      (todayAllocations || []).map((session, idx) => (
        <tr key={session.id || idx}
          style={{ borderBottom: '1px solid #F1F5F9',
            background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
          <td style={{ padding: '10px 16px', fontSize: '13px',
            fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
            {session.startTime || '—'}
            {session.endTime ? `–${session.endTime}` : ''}
          </td>
          <td style={{ padding: '10px 16px', fontSize: '13px',
            color: '#1A202C' }}>
            {session.classroomName
              ? <span style={{ display: 'inline-flex', alignItems: 'center',
                  gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px',
                    borderRadius: '50%', background: '#4F46E5',
                    flexShrink: 0 }} />
                  {session.classroomName}
                </span>
              : <span style={{ color: '#D1D5DB' }}>— Not set —</span>}
          </td>
          <td style={{ padding: '10px 16px', fontSize: '13px',
            color: '#374151' }}>
            {session.batchName || '—'}
          </td>
          <td style={{ padding: '10px 16px', fontSize: '13px',
            color: '#374151' }}>
            {session.subjectCode
              ? <span>
                  <span style={{ fontWeight: 700, color: '#4F46E5',
                    marginRight: '6px' }}>{session.subjectCode}</span>
                  {session.subjectName || ''}
                </span>
              : (session.subjectName || '—')}
          </td>
          <td style={{ padding: '10px 16px', fontSize: '13px',
            color: '#374151' }}>
            {session.lecturerName || '—'}
          </td>
          <td style={{ padding: '10px 16px', fontSize: '13px',
            color: '#6B7280' }}>
            {/* Multi-assistant support: show first assistant name */}
            {(session.assistants && (session.assistants || []).length > 0)
              ? (session.assistants || []).map(a => a.lecturerName).filter(Boolean).join(', ')
              : (session.assistantName || '—')}
          </td>
        </tr>
      ))
    )}
  </tbody>

════════════════════════════════════════════════════════════════
FIX 5 — "SHARE VIA WHATSAPP" BUTTON: Wire the allocation sheet
════════════════════════════════════════════════════════════════

FIND the "Share via WhatsApp" button on the Daily Allocation Sheet
and wire its onClick:

  onClick={() => {
    if ((todayAllocations || []).length === 0) {
      alert('No sessions scheduled for today to share.');
      return;
    }
    const lines = [
      `*📋 Daily Allocation Sheet — ${todayDayName}*`,
      `_PBA Full-Time Portal_`,
      '',
      ...(todayAllocations || []).map(s =>
        `🕐 *${s.startTime || '—'}${s.endTime ? '–'+s.endTime : ''}*` +
        `\n📍 ${s.classroomName || 'No room'}` +
        `\n📚 ${s.subjectName || '—'} (${s.batchName || '—'})` +
        `\n👤 ${s.lecturerName || '—'}` +
        (s.assistantName || (s.assistants && s.assistants.length > 0)
          ? `\n🤝 ${(s.assistants||[]).map(a=>a.lecturerName).filter(Boolean).join(', ') || s.assistantName}`
          : '')
      )
    ];
    const text = lines.join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }}

════════════════════════════════════════════════════════════════
FIX 6 — SUBJECT MANAGER CARDS: Use pba_subjects as source
════════════════════════════════════════════════════════════════

The Subject Manager tab currently renders subject cards. Ensure
it uses the `subjects` state (from pba_subjects) as its data source:

  // At the top of the Subject Manager tab render:
  // (refresh from localStorage when tab becomes visible)
  // Add a useEffect for the tab:

  useEffect(() => {
    setSubjects(safeLS('pba_subjects', []));
    setClassrooms(safeLS('pba_classrooms', []));
    setTimetable(safeLS('pba_timetable', []));
  }, []); // runs on mount; add [activeTab] if you have an activeTab state

  // The subject cards map:
  {(subjects || []).length === 0 ? (
    <div style={{ gridColumn: '1 / -1', textAlign: 'center',
      padding: '60px', color: '#9CA3AF' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
      <div style={{ fontWeight: 700, fontSize: '15px', color: '#374151',
        marginBottom: '6px' }}>No subjects yet</div>
      <div style={{ fontSize: '13px' }}>
        Click "+ Create Subject" to add your first subject.
        Then assign subjects to batches in Batch Manager → Edit Batch → Assign Subjects.
      </div>
    </div>
  ) : (
    (subjects || []).map(subject => (
      <div key={subject.id} style={{
        background: 'white', borderRadius: '12px',
        border: '1px solid #E3E6EA', padding: '18px 20px',
        position: 'relative'
      }}>
        {/* Code badge */}
        <span style={{ display: 'inline-block', padding: '2px 10px',
          borderRadius: '6px', background: '#EEF2FF',
          color: '#4F46E5', fontSize: '11px', fontWeight: 800,
          letterSpacing: '0.07em', marginBottom: '8px' }}>
          {subject.subjectCode}
        </span>

        {/* Edit + Delete buttons — top right */}
        <div style={{ position: 'absolute', top: '14px', right: '14px',
          display: 'flex', gap: '6px' }}>
          <button
            onClick={() => {
              setEditSubjectId(subject.id);
              setSubjectForm({
                subjectCode:  subject.subjectCode  || '',
                subjectName:  subject.subjectName  || '',
                description:  subject.description  || ''
              });
              setShowSubjectModal(true);
            }}
            title="Edit subject"
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '16px', padding: '2px 4px' }}>✏️</button>
          <button
            onClick={() => {
              setDeleteSubjectTarget(subject);
              setShowDeleteSubject(true);
            }}
            title="Delete subject"
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '16px', padding: '2px 4px' }}>🗑️</button>
        </div>

        {/* Subject name */}
        <div style={{ fontWeight: 800, fontSize: '16px', color: '#1A202C',
          marginBottom: '6px' }}>
          {subject.subjectName}
        </div>

        {/* Batch assignment count */}
        {(() => {
          const count = getSubjectBatchCount(subject.id);
          return (
            <div style={{ fontSize: '12px',
              color: count > 0 ? '#059669' : '#9CA3AF', fontWeight: 600 }}>
              {count > 0
                ? `✓ Assigned to ${count} batch${count !== 1 ? 'es' : ''}`
                : '— Not assigned to any batch'}
            </div>
          );
        })()}
      </div>
    ))
  )}

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1.  Touch ONLY GeneralAdminView.jsx
2.  Use only inline style={{}} — no Tailwind
3.  safeLS() for ALL localStorage reads; saveLS() for writes
4.  ALL useState calls reading localStorage MUST use lazy initializer:
    useState(() => safeLS('key', []))
5.  ALL array ops must guard null: (array || []).filter(...)
6.  pba_subjects is the storage key for the subject list.
    pba_classrooms is the storage key for classrooms.
    These may already exist in the component — do NOT add duplicate state.
    Check for existing state names and reuse them if they already exist.
7.  The "Assigned to N batches" count is DERIVED at render time from
    pba_batches — it is NOT stored on the subject record itself.
8.  The Daily Allocation Sheet filters pba_timetable by s.day === todayDayName
    (e.g. 'Monday'). Sessions without classroomId will still appear — the
    CLASSROOM column shows "— Not set —" for those.
9.  The classroom dropdown in the session modal only shows rooms with
    status === 'Active'. Inactive rooms are hidden.
10. Adding classroomId to the session save does NOT change past sessions.
    Only new sessions saved after this fix will have classroomId.
11. The WhatsApp share opens wa.me in a new tab — it does NOT send directly.
    The user's WhatsApp app opens with the pre-filled text.
12. Do NOT remove or modify any existing working functionality in these tabs.
    Only ADD the modal and wire up the buttons.
13. Run npm run build and confirm 0 errors
14. Then npm run deploy to push to GitHub and trigger Vercel deployment
15. List all files modified
```
