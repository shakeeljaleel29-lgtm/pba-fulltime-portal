# PBA Full-Time Portal — Batch Subject Assignment: Classes/Week + Multi-Assistant + Extra Class Detection
## AntiGravity Prompt

---

```
Enhance the existing Assign Subjects tab in the Edit Batch modal
(GeneralAdminView.jsx) and add extra class detection to the session
scheduler. Also add EXTRA badge to the Session Log in
LecturerManagementView.jsx.

The Edit Batch → Assign Subjects tab ALREADY EXISTS with:
  Left panel:  subject checkboxes (BIO, CHEM, PHY, etc.)
  Right panel: Assigned Subjects table — SUBJECT | LECTURER | ASSISTANT

DO NOT rebuild this from scratch. ADD the following to what exists:
  (1) "CLASSES/WEEK" column to the Assigned Subjects table
  (2) Multi-assistant support (ASSISTANT column → add/remove multiple)
  (3) Extra class auto-detection when saving sessions
  (4) EXTRA badge in Session Log + extra-class stat card

Touch ONLY GeneralAdminView.jsx and LecturerManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
DATA MODEL ENHANCEMENT — batch.subjects[] entries
════════════════════════════════════════════════════════════════

The existing batch.subjects[] entry currently stores:
  { subjectId, subjectName, subjectCode,
    primaryLecturerId, primaryLecturerName,
    assistantId, assistantName   ← currently ONE assistant only
  }

ENHANCE each entry to store:
  {
    subjectId, subjectName, subjectCode,
    primaryLecturerId, primaryLecturerName,
    assistants: [                     ← CHANGE: array (was single field)
      { lecturerId: '...', lecturerName: '...' },
      ...
    ],
    classesPerWeek: 2                 ← NEW field
  }

Migration: when reading existing entries, if assistantId exists
but assistants[] does not, convert on read:
  assistants = assistantId
    ? [{ lecturerId: assistantId, lecturerName: assistantName || '' }]
    : []

════════════════════════════════════════════════════════════════
FIX 1 — ASSIGNED SUBJECTS TABLE: Add CLASSES/WEEK column
════════════════════════════════════════════════════════════════

File: GeneralAdminView.jsx
Location: Edit Batch modal → Assign Subjects tab → right panel table

CURRENT table header:
  SUBJECT | LECTURER | ASSISTANT

CHANGE TO:
  SUBJECT | LECTURER | ASSISTANT(S) | CLASSES/WEEK

For the CLASSES/WEEK column cell, add a compact number input:

  <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <input
        type="number"
        min={1}
        max={7}
        value={batchSubject.classesPerWeek || 2}
        onChange={e => {
          // Update this subject's classesPerWeek in editBatch.subjects
          const updatedSubjects = (editBatch.subjects || []).map(bs =>
            bs.subjectId === batchSubject.subjectId
              ? { ...bs, classesPerWeek: Number(e.target.value) }
              : bs
          );
          setEditBatch(prev => ({ ...prev, subjects: updatedSubjects }));
        }}
        style={{
          width: '50px', padding: '6px 8px', borderRadius: '6px',
          border: '1px solid #E3E6EA', fontSize: '13px',
          fontWeight: 700, textAlign: 'center'
        }}
      />
      <span style={{ fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
        / wk
      </span>
    </div>
    <div style={{ fontSize: '10px', color: '#D97706', marginTop: '3px',
      whiteSpace: 'nowrap' }}>
      Extra flagged above this
    </div>
  </td>

════════════════════════════════════════════════════════════════
FIX 2 — ASSISTANT COLUMN: Support multiple assistants
════════════════════════════════════════════════════════════════

File: GeneralAdminView.jsx
Location: same table — ASSISTANT column cell

REPLACE the current single "— None —" assistant dropdown with
a multi-assistant UI:

  <td style={{ padding: '8px 10px', verticalAlign: 'top', minWidth: '160px' }}>

    {/* Existing assistants list */}
    {(batchSubject.assistants || []).map((asst, aIdx) => (
      <div key={aIdx} style={{
        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px'
      }}>
        <select
          value={asst.lecturerId || ''}
          onChange={e => {
            const lect = (lecturers || []).find(l => l.id === e.target.value);
            const updatedSubjects = (editBatch.subjects || []).map(bs => {
              if (bs.subjectId !== batchSubject.subjectId) return bs;
              const newAssistants = [...(bs.assistants || [])];
              newAssistants[aIdx] = {
                lecturerId: e.target.value,
                lecturerName: lect?.name || ''
              };
              return { ...bs, assistants: newAssistants };
            });
            setEditBatch(prev => ({ ...prev, subjects: updatedSubjects }));
          }}
          style={{
            flex: 1, padding: '5px 8px', borderRadius: '6px',
            border: '1px solid #E3E6EA', fontSize: '12px', background: 'white'
          }}>
          <option value="">— Select —</option>
          {(lecturers || [])
            .filter(l => l.id !== batchSubject.primaryLecturerId)
            .map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
        </select>
        <button
          onClick={() => {
            const updatedSubjects = (editBatch.subjects || []).map(bs => {
              if (bs.subjectId !== batchSubject.subjectId) return bs;
              return {
                ...bs,
                assistants: (bs.assistants || []).filter((_, i) => i !== aIdx)
              };
            });
            setEditBatch(prev => ({ ...prev, subjects: updatedSubjects }));
          }}
          style={{
            background: '#FEF2F2', border: '1px solid #FCA5A5',
            borderRadius: '5px', color: '#DC2626',
            width: '24px', height: '24px', fontSize: '14px',
            cursor: 'pointer', flexShrink: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
          ×
        </button>
      </div>
    ))}

    {/* Add assistant button — up to 4 assistants */}
    {(batchSubject.assistants || []).length < 4 && (
      <button
        onClick={() => {
          const updatedSubjects = (editBatch.subjects || []).map(bs =>
            bs.subjectId === batchSubject.subjectId
              ? { ...bs,
                  assistants: [...(bs.assistants || []),
                    { lecturerId: '', lecturerName: '' }] }
              : bs
          );
          setEditBatch(prev => ({ ...prev, subjects: updatedSubjects }));
        }}
        style={{
          padding: '4px 10px', borderRadius: '6px',
          border: '1px dashed #4F46E5', background: '#EEF2FF',
          color: '#4F46E5', fontSize: '11px', fontWeight: 700,
          cursor: 'pointer', width: '100%', marginTop: '2px'
        }}>
        + Add Assistant
      </button>
    )}

    {(batchSubject.assistants || []).length === 0 && (
      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>— None —</span>
    )}

  </td>

════════════════════════════════════════════════════════════════
FIX 3 — SESSION SAVE: Auto-detect and flag extra classes
════════════════════════════════════════════════════════════════

File: GeneralAdminView.jsx
Location: wherever sessions are saved to pba_timetable
(Schedule Session modal save handler OR Visual Timetable Builder)

ADD this helper function INSIDE the component
(so it has access to state):

  const checkIfExtraClass = (session) => {
    // Get the batch-subject assignment for this session
    const batchList = safeLS('pba_batches', []);
    const batch = (batchList || []).find(b => b.id === session.batchId);
    const batchSubject = (batch?.subjects || []).find(
      bs => bs.subjectId === session.subjectId
    );
    const weekLimit = batchSubject?.classesPerWeek;
    if (!weekLimit) return false; // no limit set — never extra

    // Get the week window containing this session's date
    const sessionDate = session.date
      ? new Date(session.date + 'T12:00:00')
      : new Date();
    const dayOfWeek = sessionDate.getDay();
    const weekStart = new Date(sessionDate);
    weekStart.setDate(weekStart.getDate() - dayOfWeek); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Count NON-EXTRA sessions this week for this lecturer+subject+batch
    const existingTimetable = safeLS('pba_timetable', []);
    const thisWeekCount = (existingTimetable || []).filter(s => {
      if (s.id === session.id) return false; // exclude self (edit case)
      if (s.isExtra) return false;           // extras don't count toward limit
      if (s.lecturerId !== session.lecturerId) return false;
      if (s.subjectId  !== session.subjectId)  return false;
      if (s.batchId    !== session.batchId)    return false;
      const sDate = new Date((s.date || '') + 'T12:00:00');
      return sDate >= weekStart && sDate <= weekEnd;
    }).length;

    return thisWeekCount >= weekLimit;
  };

WHEN SAVING A SESSION (find the save handler and insert):

  // Before writing to pba_timetable:
  const isExtra = checkIfExtraClass(newSession);
  const weekLimit = (() => {
    const batchList = safeLS('pba_batches', []);
    const batch = (batchList || []).find(b => b.id === newSession.batchId);
    return (batch?.subjects || []).find(
      bs => bs.subjectId === newSession.subjectId
    )?.classesPerWeek;
  })();

  const sessionToSave = {
    ...newSession,
    isExtra: isExtra,
    extraNote: isExtra
      ? `Extra class — weekly limit is ${weekLimit || '?'} for this subject`
      : ''
  };

  // Non-blocking toast warning when extra (do NOT use window.alert):
  if (isExtra) {
    // Use a brief toast state, e.g.:
    // setExtraClassToast(true);
    // setTimeout(() => setExtraClassToast(false), 5000);
    // Render toast at bottom-right:
    //   "⚡ Extra class saved — {subjectName} exceeds {weekLimit}×/week limit"
    // with amber background (#FEF3C7), amber border (#F59E0B)
  }

TOAST JSX (render outside the modal, fixed position):

  {extraClassToast && (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      background: '#FEF3C7', border: '1px solid #F59E0B',
      borderRadius: '12px', padding: '14px 18px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      maxWidth: '320px'
    }}>
      <div style={{ fontWeight: 800, color: '#92400E', fontSize: '13px' }}>
        ⚡ Extra Class Saved
      </div>
      <div style={{ color: '#B45309', fontSize: '12px', marginTop: '4px' }}>
        This session exceeds the {weekLimit}×/week limit for this subject.
        It has been flagged as an extra class.
      </div>
    </div>
  )}

Add to component state:
  const [extraClassToast, setExtraClassToast] = useState(false);

════════════════════════════════════════════════════════════════
FIX 4 — LecturerManagementView.jsx
        Session Log: EXTRA badge + Extra Classes stat card
════════════════════════════════════════════════════════════════

File: LecturerManagementView.jsx
Location: Session Log tab

STEP A — In each session row, after the STATUS cell, add:

  {session.isExtra && (
    <span style={{
      display: 'inline-block', marginLeft: '6px',
      padding: '2px 7px', borderRadius: '10px',
      background: '#FEF3C7', border: '1px solid #F59E0B',
      color: '#92400E', fontSize: '10px', fontWeight: 800,
      verticalAlign: 'middle'
    }}>
      ⚡ EXTRA
    </span>
  )}

STEP B — Add a 6th stat card for Extra Classes.
  Find the stat cards row (Scheduled / Conducted / Missed / Substituted
  / Attend Rate) and ADD after the last card:

  const extraCount = (filteredSessions || []).filter(s => s.isExtra).length;

  {/* Extra Classes stat card */}
  <div style={{
    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    border: '1px solid #FDE68A', borderRadius: '12px',
    padding: '16px 20px', textAlign: 'center', flex: '1 1 120px'
  }}>
    <div style={{ fontSize: '28px', fontWeight: 900, color: '#D97706' }}>
      {extraCount}
    </div>
    <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
      ⚡ Extra Classes
    </div>
    <div style={{ fontSize: '10px', color: '#B45309', marginTop: '2px' }}>
      above weekly limit
    </div>
  </div>

════════════════════════════════════════════════════════════════
MIGRATION — convert old single-assistant field to assistants[]
════════════════════════════════════════════════════════════════

When reading pba_batches and rendering the Assign Subjects table,
normalize each batch.subjects[] entry on read:

  const normalizeBatchSubject = (bs) => ({
    ...bs,
    assistants: bs.assistants
      ? bs.assistants  // already array — use as-is
      : bs.assistantId
        ? [{ lecturerId: bs.assistantId,
             lecturerName: bs.assistantName || '' }]
        : [],
    classesPerWeek: bs.classesPerWeek || 2
  });

  // Apply when loading editBatch in the Edit Batch modal open handler:
  const normalized = {
    ...batchToEdit,
    subjects: (batchToEdit.subjects || []).map(normalizeBatchSubject)
  };
  setEditBatch(normalized);

Also apply normalizeBatchSubject in the checkIfExtraClass helper
when reading batch.subjects.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY GeneralAdminView.jsx and LecturerManagementView.jsx
2. The Assign Subjects UI already exists — DO NOT rebuild it.
   Only ADD the CLASSES/WEEK column and enhance ASSISTANT column.
3. Use only inline style={{}} — no Tailwind
4. safeLS() for ALL localStorage reads; saveLS() for writes
5. ALL useState lazy: useState(() => safeLS('key', []))
6. ALL array ops guard null: (array || []).filter(...)
7. classesPerWeek is stored on batch.subjects[n].classesPerWeek
   It controls how many non-extra sessions per week for
   that lecturer+subject+batch combination.
8. Extra class check runs at SESSION SAVE TIME only.
   It does NOT retroactively change past sessions.
9. The EXTRA badge in the session log is purely display-only —
   it reads session.isExtra from pba_timetable.
10. assistants[] replaces the old single assistantId/assistantName
    fields. The migration normalizer handles backward compatibility.
11. Run npm run build and confirm 0 errors
12. Then npm run deploy to push to GitHub and trigger Vercel deployment
13. List all files modified
```
