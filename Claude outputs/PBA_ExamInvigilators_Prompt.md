# PBA Full-Time Portal — Exam Invigilator Assignment
## AntiGravity Prompt

---

```
Add invigilator assignment to each exam paper card in ExamManagementView.jsx.
Invigilators are assigned AFTER the exam schedule is published, closer to
the exam date. They are typically lecturers (from pba_lecturers), and the
system should SUGGEST lecturers who have sessions on that exam day — but
the selection is fully flexible (any lecturer can be assigned).

Touch ONLY ExamManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
DATA MODEL: Add invigilators[] to pba_exam_schedule records
════════════════════════════════════════════════════════════════

Each pba_exam_schedule record already stores one paper.
ENHANCE each record to also store:

  {
    ...existing fields,
    invigilators: [
      { lecturerId: '...', lecturerName: '...', role: 'Chief' | 'Assistant' }
    ]
  }

Default: invigilators: []  (empty — not assigned yet)

Migration: existing records without invigilators field → treat as []
  (no migration code needed — just guard with || [])

════════════════════════════════════════════════════════════════
FIX 1 — PAPER CARD: Show invigilators + "Assign" button
════════════════════════════════════════════════════════════════

File: ExamManagementView.jsx
Location: paper card rendering (inside each subject's paper card)

The paper card CURRENTLY shows:
  Paper name | Status badge
  📅 date
  ⏰ time
  Marks: pass/total

ADD below the existing content, before the card closes:

  {/* Invigilator row */}
  <div style={{
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px dashed #E5E7EB'
  }}>
    {/* Show assigned invigilators */}
    {(paper.invigilators || []).length > 0 ? (
      <div>
        <div style={{
          fontSize: '10px', fontWeight: 700, color: '#6B7280',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          marginBottom: '4px'
        }}>
          Invigilators
        </div>
        {(paper.invigilators || []).map((inv, i) => (
          <div key={i} style={{
            fontSize: '11px', color: '#374151',
            display: 'flex', alignItems: 'center', gap: '4px',
            marginBottom: '2px'
          }}>
            <span style={{
              fontSize: '9px', fontWeight: 800,
              color: inv.role === 'Chief' ? '#4F46E5' : '#6B7280',
              background: inv.role === 'Chief' ? '#EEF2FF' : '#F3F4F6',
              padding: '1px 5px', borderRadius: '4px',
              textTransform: 'uppercase', flexShrink: 0
            }}>
              {inv.role === 'Chief' ? '★ Chief' : 'Asst'}
            </span>
            <span>{inv.lecturerName}</span>
          </div>
        ))}
        <button
          onClick={() => openInvigilatorModal(paper)}
          style={{
            marginTop: '5px', fontSize: '10px', color: '#4F46E5',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, fontWeight: 600, textDecoration: 'underline'
          }}>
          Edit Invigilators
        </button>
      </div>
    ) : (
      <button
        onClick={() => openInvigilatorModal(paper)}
        style={{
          width: '100%', padding: '5px 8px',
          border: '1px dashed #C7D2FE', borderRadius: '6px',
          background: '#F5F3FF', color: '#4F46E5',
          fontSize: '11px', fontWeight: 700, cursor: 'pointer'
        }}>
        👤 Assign Invigilators
      </button>
    )}
  </div>

════════════════════════════════════════════════════════════════
FIX 2 — STATE: Add invigilator modal state
════════════════════════════════════════════════════════════════

Add to component state:

  const [showInvigilatorModal, setShowInvigilatorModal] = useState(false);
  const [invigilatorPaper, setInvigilatorPaper] = useState(null);
    // the full pba_exam_schedule record being edited

  const [invigilatorList, setInvigilatorList] = useState([]);
    // working copy: [{ lecturerId, lecturerName, role }]

Also read lecturers state (if not already present):
  const [lecturers] = useState(() => safeLS('pba_lecturers', []));

════════════════════════════════════════════════════════════════
FIX 3 — HELPER: openInvigilatorModal
════════════════════════════════════════════════════════════════

Add inside component:

  const openInvigilatorModal = (paper) => {
    setInvigilatorPaper(paper);
    // Pre-fill working list from existing invigilators
    setInvigilatorList(
      (paper.invigilators || []).map(inv => ({ ...inv }))
    );
    setShowInvigilatorModal(true);
  };

════════════════════════════════════════════════════════════════
FIX 4 — HELPER: getSuggestedLecturers(paperDate)
════════════════════════════════════════════════════════════════

Smart suggestions: lecturers who have timetable sessions on the
same day of the week as the exam date.

  const getSuggestedLecturers = (paperDate) => {
    if (!paperDate) return [];

    // Get day name from exam date: e.g. 'Tuesday'
    const examDay = new Date(paperDate + 'T12:00:00')
      .toLocaleDateString('en-US', { weekday: 'long' });

    // Find lecturer IDs who have timetable sessions on that day
    const timetable = safeLS('pba_timetable', []);
    const suggestedIds = new Set(
      (timetable || [])
        .filter(s => s.day === examDay && s.lecturerId)
        .map(s => s.lecturerId)
    );

    // Return matching lecturers from pba_lecturers
    return (lecturers || []).filter(l => suggestedIds.has(l.id));
  };

════════════════════════════════════════════════════════════════
FIX 5 — HELPER: saveInvigilators
════════════════════════════════════════════════════════════════

  const saveInvigilators = () => {
    if (!invigilatorPaper) return;

    // Filter out rows with no lecturer selected
    const toSave = (invigilatorList || []).filter(inv => inv.lecturerId);

    // Update the specific record in pba_exam_schedule
    const schedule = safeLS('pba_exam_schedule', []);
    const updated = (schedule || []).map(r =>
      r.id === invigilatorPaper.id
        ? { ...r, invigilators: toSave }
        : r
    );
    saveLS('pba_exam_schedule', updated);
    setShowInvigilatorModal(false);
    setInvigilatorPaper(null);

    // Force re-render: refresh examSchedule state
    setExamSchedule(updated);
      // If your state variable is named differently, use that instead.
  };

════════════════════════════════════════════════════════════════
FIX 6 — INVIGILATOR MODAL JSX
════════════════════════════════════════════════════════════════

Render this modal at the bottom of the component JSX
(outside any other modal, at the root level):

  {showInvigilatorModal && invigilatorPaper && (() => {
    const suggested = getSuggestedLecturers(invigilatorPaper.date);
    const suggestedIds = new Set(suggested.map(l => l.id));
    const examDayName = invigilatorPaper.date
      ? new Date(invigilatorPaper.date + 'T12:00:00')
          .toLocaleDateString('en-US', { weekday: 'long' })
      : '';

    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 3000, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'white', borderRadius: '16px',
          width: '100%', maxWidth: '520px',
          maxHeight: '85vh', overflow: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
        }}>

          {/* Header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #F3F4F6'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800,
                  color: '#1A202C' }}>
                  👤 Assign Invigilators
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
                  {invigilatorPaper.subjectName} ·{' '}
                  {invigilatorPaper.paperName || ('Paper ' + invigilatorPaper.paperNumber)}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                  📅 {invigilatorPaper.date} · ⏰{' '}
                  {invigilatorPaper.startTime}–{invigilatorPaper.endTime}
                  {invigilatorPaper.venue ? ` · ${invigilatorPaper.venue}` : ''}
                </p>
              </div>
              <button
                onClick={() => setShowInvigilatorModal(false)}
                style={{
                  background: '#F3F4F6', border: 'none', borderRadius: '8px',
                  width: '32px', height: '32px', fontSize: '18px',
                  cursor: 'pointer', color: '#6B7280', flexShrink: 0
                }}>
                ×
              </button>
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>

            {/* Suggestion banner */}
            {suggested.length > 0 && (
              <div style={{
                background: '#FFFBEB', border: '1px solid #FDE68A',
                borderRadius: '10px', padding: '10px 14px',
                marginBottom: '16px', fontSize: '12px', color: '#92400E'
              }}>
                <strong>💡 Suggested for {examDayName}:</strong>{' '}
                {suggested.map(l => l.name).join(', ')}
                {' '}— these lecturers have classes scheduled on this day.
                <br/>
                <span style={{ fontSize: '11px', color: '#B45309' }}>
                  You are not restricted to this list.
                </span>
              </div>
            )}

            {/* Invigilator rows */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                fontSize: '12px', fontWeight: 700, color: '#374151',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                display: 'block', marginBottom: '8px'
              }}>
                Invigilators
              </label>

              {(invigilatorList || []).map((inv, idx) => (
                <div key={idx} style={{
                  display: 'flex', gap: '8px', marginBottom: '8px',
                  alignItems: 'center'
                }}>

                  {/* Role badge */}
                  <select
                    value={inv.role || 'Assistant'}
                    onChange={e => {
                      const updated = [...invigilatorList];
                      updated[idx] = { ...updated[idx], role: e.target.value };
                      setInvigilatorList(updated);
                    }}
                    style={{
                      padding: '7px 8px', borderRadius: '7px',
                      border: '1px solid #E3E6EA', fontSize: '12px',
                      background: 'white', flexShrink: 0, width: '110px'
                    }}>
                    <option value="Chief">★ Chief</option>
                    <option value="Assistant">Assistant</option>
                  </select>

                  {/* Lecturer select */}
                  <select
                    value={inv.lecturerId || ''}
                    onChange={e => {
                      const lect = (lecturers || []).find(l => l.id === e.target.value);
                      const updated = [...invigilatorList];
                      updated[idx] = {
                        ...updated[idx],
                        lecturerId: e.target.value,
                        lecturerName: lect?.name || ''
                      };
                      setInvigilatorList(updated);
                    }}
                    style={{
                      flex: 1, padding: '7px 10px', borderRadius: '7px',
                      border: '1px solid #E3E6EA', fontSize: '13px',
                      background: 'white'
                    }}>
                    <option value="">— Select Lecturer —</option>

                    {/* Suggested group */}
                    {suggested.length > 0 && (
                      <optgroup label={`💡 Have classes on ${examDayName}`}>
                        {suggested.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </optgroup>
                    )}

                    {/* All other lecturers */}
                    <optgroup label="All Lecturers">
                      {(lecturers || [])
                        .filter(l => !suggestedIds.has(l.id))
                        .map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </optgroup>
                  </select>

                  {/* Remove button */}
                  <button
                    onClick={() => {
                      setInvigilatorList(invigilatorList.filter((_, i) => i !== idx));
                    }}
                    style={{
                      background: '#FEF2F2', border: '1px solid #FCA5A5',
                      borderRadius: '7px', color: '#DC2626',
                      width: '30px', height: '30px', fontSize: '16px',
                      cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    ×
                  </button>
                </div>
              ))}

              {/* Add row button */}
              <button
                onClick={() => {
                  setInvigilatorList([
                    ...(invigilatorList || []),
                    {
                      lecturerId: '',
                      lecturerName: '',
                      role: invigilatorList.length === 0 ? 'Chief' : 'Assistant'
                    }
                  ]);
                }}
                style={{
                  width: '100%', padding: '8px', borderRadius: '8px',
                  border: '1px dashed #4F46E5', background: '#EEF2FF',
                  color: '#4F46E5', fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', marginTop: '4px'
                }}>
                + Add Invigilator
              </button>
            </div>

            {/* Quick-add suggested button */}
            {suggested.length > 0 && (invigilatorList || []).length === 0 && (
              <button
                onClick={() => {
                  const quickList = suggested.map((l, i) => ({
                    lecturerId: l.id,
                    lecturerName: l.name,
                    role: i === 0 ? 'Chief' : 'Assistant'
                  }));
                  setInvigilatorList(quickList);
                }}
                style={{
                  width: '100%', padding: '9px', borderRadius: '8px',
                  border: '1px solid #FDE68A', background: '#FFFBEB',
                  color: '#92400E', fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', marginBottom: '12px'
                }}>
                ⚡ Quick-add all {examDayName} lecturers as invigilators
              </button>
            )}

          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px', borderTop: '1px solid #F3F4F6',
            display: 'flex', gap: '10px', justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowInvigilatorModal(false)}
              style={{
                padding: '9px 20px', borderRadius: '8px',
                border: '1px solid #E3E6EA', background: 'white',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                color: '#374151'
              }}>
              Cancel
            </button>
            <button
              onClick={saveInvigilators}
              style={{
                padding: '9px 22px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                border: 'none', color: 'white',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}>
              Save Invigilators
            </button>
          </div>

        </div>
      </div>
    );
  })()}

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ExamManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL useState lazy: useState(() => safeLS('key', []))
5. ALL array ops guard null: (array || []).filter(...)
6. The first row added auto-defaults to role 'Chief'; subsequent
   rows default to 'Assistant' — users can change either.
7. The suggested lecturers list is ADVISORY only — any lecturer
   can be assigned regardless of their schedule.
8. Quick-add button only shows when the list is empty AND there
   are suggestions — it pre-fills all suggested lecturers with
   first one as Chief, rest as Assistants.
9. saveInvigilators() filters empty rows (no lecturerId) before
   writing, so clicking Save on an empty row is safe.
10. setExamSchedule(updated) in saveInvigilators — use whatever
    your component calls the state variable holding pba_exam_schedule
    to force the paper cards to re-render with updated invigilators.
11. The invigilators[] field on each pba_exam_schedule record is
    preserved when editing a session — the edit handler must carry
    through existing invigilators: when rebuilding records on edit,
    merge existing invigilators back in:
      const existingRec = existingSchedule.find(r =>
        r.examSessionId === editExamSessionId &&
        r.subjectId === row.subjectId &&
        r.paperNumber === paperNum
      );
      // In the new record:
      invigilators: existingRec?.invigilators || []
12. Run npm run build and confirm 0 errors
13. Then npm run deploy to push to GitHub and trigger Vercel deployment
14. List all files modified
```
