# PBA Full-Time Portal — Exam: Configurable Total Marks + Raw Mark & % in Mark Entry
## AntiGravity Prompt

---

```
Three fixes in ExamManagementView.jsx only.
(1) Remove "Marks: X/Y" from exam paper SCHEDULE CARDS (display only)
(2) Add totalMarks and passMarks fields to the paper scheduling form
    (papers can be out of different totals — e.g. Paper 1 = 40, Paper 2 = 60)
(3) Mark Entry table: show RAW MARKS input column + auto-calculated % column
Touch ONLY ExamManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
FIX 1 — SCHEDULE CARDS: Remove marks line from card display
════════════════════════════════════════════════════════════════

In the exam paper card JSX, find and DELETE the line that shows
marks (passMarks / totalMarks). It will look like one of:

  <div>Marks: {paper.passMarks}/{paper.totalMarks}</div>
  Marks: {paper.passMarks}/{paper.totalMarks}
  <span>Total: {paper.totalMarks}</span>
  <span>Pass: {paper.passMarks}</span>

DELETE it. The card should only show: paper name, date, time,
status badge, edit/delete buttons, Assign Invigilators button.

The data (totalMarks, passMarks) stays in pba_exam_schedule — only
the card display line is removed.

════════════════════════════════════════════════════════════════
FIX 2 — PAPER SCHEDULING FORM: Total Marks + Pass Mark fields
════════════════════════════════════════════════════════════════

When scheduling or editing a paper, admin must be able to set:
  - Total Marks (what the paper is marked out of — e.g. 40, 60, 80, 100)
  - Pass Mark (minimum to pass — e.g. 20 for a 40-mark paper)

These are stored on the paper record but NOT shown on the schedule card.

STEP A — In the Add Paper / Edit Paper form, ADD these two fields
after the time fields and before any save button:

  {/* Total Marks + Pass Mark row */}
  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>

    {/* Total Marks */}
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: '12px', fontWeight: 700,
        color: '#374151', textTransform: 'uppercase',
        letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
        TOTAL MARKS
      </label>
      <input
        type="number"
        min={1}
        max={999}
        value={paperForm.totalMarks ?? 100}
        onChange={e => setPaperForm(p => ({
          ...p, totalMarks: Number(e.target.value) || 100
        }))}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: '8px',
          border: '1px solid #E3E6EA', fontSize: '14px',
          background: 'white', boxSizing: 'border-box',
          fontWeight: 600, textAlign: 'center'
        }} />
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '3px' }}>
        e.g. 40, 60, 80, 100
      </div>
    </div>

    {/* Pass Mark */}
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: '12px', fontWeight: 700,
        color: '#374151', textTransform: 'uppercase',
        letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
        PASS MARK
      </label>
      <input
        type="number"
        min={0}
        max={paperForm.totalMarks ?? 100}
        value={paperForm.passMarks ?? Math.round((paperForm.totalMarks ?? 100) * 0.4)}
        onChange={e => setPaperForm(p => ({
          ...p, passMarks: Number(e.target.value) || 0
        }))}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: '8px',
          border: '1px solid #E3E6EA', fontSize: '14px',
          background: 'white', boxSizing: 'border-box',
          fontWeight: 600, textAlign: 'center'
        }} />
      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '3px' }}>
        minimum to pass
      </div>
    </div>

  </div>

STEP B — Default values when opening the Add Paper form:
  totalMarks: 100,
  passMarks: 40

STEP C — When saving a paper, include these fields:
  const paperRecord = {
    ...paperForm,
    totalMarks: paperForm.totalMarks || 100,
    passMarks: paperForm.passMarks ?? 40
  };

STEP D — The PAPER dropdown in Mark Entry already shows
"paper 1 (/100)". Update it to show the correct totalMarks:

  <option key={paper.paperNumber} value={paper.paperNumber}>
    {paper.paperName} (/{paper.totalMarks || 100})
  </option>

════════════════════════════════════════════════════════════════
FIX 3 — MARK ENTRY TABLE: Raw marks input + auto % column
════════════════════════════════════════════════════════════════

The mark entry table currently has columns:
  # | STUDENT NAME | STUDENT ID | MARKS OBTAINED (out of 100) | % | ABSENT | GRADE

ENHANCE as follows:

STEP A — Update the column header to show the paper's actual total:

  <th style={{ ... }}>
    MARKS OBTAINED
    <div style={{ fontSize: '11px', fontWeight: 400, color: '#9CA3AF',
      marginTop: '2px' }}>
      out of {selectedPaper?.totalMarks || 100}
    </div>
  </th>

  // selectedPaper = the paper object for the currently selected
  // paper number in the Mark Entry dropdowns

STEP B — The MARKS OBTAINED cell: raw mark input (number, 0 to totalMarks)

  Keep the existing input but update its max and placeholder:

  <input
    type="number"
    min={0}
    max={selectedPaper?.totalMarks || 100}
    placeholder={`0–${selectedPaper?.totalMarks || 100}`}
    value={mark.marksObtained ?? ''}
    onChange={e => {
      const raw = e.target.value === '' ? '' : Number(e.target.value);
      // Update this student's marksObtained in markSheet state
      updateMark(student.id, { marksObtained: raw });
    }}
    style={{
      width: '80px', padding: '8px 10px', borderRadius: '8px',
      border: '1px solid #E3E6EA', fontSize: '14px',
      fontWeight: 600, textAlign: 'center'
    }}
  />

STEP C — The % cell: auto-calculated, displayed read-only

  The % column must show the calculated percentage. Replace the
  existing % cell with:

  {(() => {
    const total = selectedPaper?.totalMarks || 100;
    const raw = mark.marksObtained;
    if (raw === '' || raw === null || raw === undefined) {
      return <span style={{ color: '#9CA3AF' }}>—</span>;
    }
    const pct = ((Number(raw) / total) * 100).toFixed(1);
    return (
      <span style={{
        fontWeight: 700,
        color: Number(pct) >= (selectedPaper?.passMarks / total * 100 || 40)
          ? '#059669' : '#DC2626'
      }}>
        {pct}%
      </span>
    );
  })()}

  // Color: green if ≥ pass threshold %, red if below

STEP D — The data saved to pba_mark_registry per student entry:

  {
    studentId, studentName,
    marksObtained: raw,          // the actual raw mark entered
    totalMarks: selectedPaper?.totalMarks || 100,
    percentage: ((raw / total) * 100).toFixed(1),
    passMarks: selectedPaper?.passMarks || 40,
    grade: computeGrade(raw, total, selectedPaper),
    absent: mark.absent || false
  }

STEP E — Grade computation helper: base grade on % not raw mark,
  since papers have different totals:

  const computeGrade = (raw, total, paper) => {
    if (!raw && raw !== 0) return '—';
    const pct = (Number(raw) / (total || 100)) * 100;
    if (pct >= 90) return 'A*';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= (((paper?.passMarks || 40) / (total || 100)) * 100)) return 'D';
    return 'U';  // Ungraded — below pass mark
  };

════════════════════════════════════════════════════════════════
FIX 4 — PAPER INFO BAR: Show correct totalMarks + inline edit
════════════════════════════════════════════════════════════════

The info bar currently shows:
  📅 2026-09-23 · 🕐 10:00–12:00 · Max marks: 100 · Pass mark: 40

Update it to read from the actual paper record, and add a small
"Edit" link to allow changing totalMarks/passMarks without going
back to the schedule:

  <div style={{
    padding: '12px 16px', background: '#F9FAFB',
    border: '1px solid #E3E6EA', borderRadius: '10px',
    marginBottom: '16px', display: 'flex', alignItems: 'center',
    gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: '#374151'
  }}>
    <span>📅 {selectedPaper?.date}</span>
    <span>🕐 {selectedPaper?.startTime}–{selectedPaper?.endTime}</span>
    <span style={{ fontWeight: 700 }}>
      Max marks: {selectedPaper?.totalMarks || 100}
    </span>
    <span>Pass mark: {selectedPaper?.passMarks || 40}</span>

    {/* Inline edit for totalMarks */}
    <button
      onClick={() => setShowMarkConfigModal(true)}
      style={{
        marginLeft: 'auto', padding: '4px 12px', borderRadius: '6px',
        background: '#EEF2FF', border: '1px solid #C7D2FE',
        color: '#4F46E5', fontSize: '11px', fontWeight: 700,
        cursor: 'pointer'
      }}>
      ✏ Edit Marks Config
    </button>
  </div>

Add state:
  const [showMarkConfigModal, setShowMarkConfigModal] = useState(false);
  const [markConfigForm, setMarkConfigForm] = useState({
    totalMarks: 100, passMarks: 40
  });

Mark Config Modal JSX (render at component root):

  {showMarkConfigModal && selectedPaper && (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 9995, display: 'flex', alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '28px',
        width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 800 }}>
          Paper Marks Configuration
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700,
            color: '#374151', textTransform: 'uppercase',
            letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
            TOTAL MARKS
          </label>
          <input type="number" min={1} max={999}
            value={markConfigForm.totalMarks}
            onChange={e => setMarkConfigForm(p => ({
              ...p, totalMarks: Number(e.target.value) || 100
            }))}
            style={{ width: '100%', padding: '10px 12px',
              borderRadius: '8px', border: '1px solid #E3E6EA',
              fontSize: '14px', boxSizing: 'border-box',
              fontWeight: 600, textAlign: 'center' }} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700,
            color: '#374151', textTransform: 'uppercase',
            letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
            PASS MARK
          </label>
          <input type="number" min={0} max={markConfigForm.totalMarks}
            value={markConfigForm.passMarks}
            onChange={e => setMarkConfigForm(p => ({
              ...p, passMarks: Number(e.target.value) || 0
            }))}
            style={{ width: '100%', padding: '10px 12px',
              borderRadius: '8px', border: '1px solid #E3E6EA',
              fontSize: '14px', boxSizing: 'border-box',
              fontWeight: 600, textAlign: 'center' }} />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              // Update this paper's totalMarks and passMarks in
              // pba_exam_schedule
              const sessions = safeLS('pba_exam_schedule', []);
              const updated = (sessions || []).map(sess => {
                if (sess.id !== selectedSession?.id) return sess;
                return {
                  ...sess,
                  papers: (sess.papers || []).map(p =>
                    p.paperNumber === selectedPaper.paperNumber
                      ? { ...p,
                          totalMarks: markConfigForm.totalMarks,
                          passMarks: markConfigForm.passMarks }
                      : p
                  )
                };
              });
              saveLS('pba_exam_schedule', updated);
              // Update local state so the info bar reflects immediately
              // (use whatever state variable holds exam sessions)
              setShowMarkConfigModal(false);
            }}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              background: '#4F46E5', color: 'white', border: 'none',
              fontWeight: 700, fontSize: '14px', cursor: 'pointer'
            }}>
            Save
          </button>
          <button
            onClick={() => setShowMarkConfigModal(false)}
            style={{
              padding: '10px 16px', borderRadius: '8px',
              background: '#F3F4F6', border: '1px solid #E3E6EA',
              color: '#374151', fontWeight: 600, cursor: 'pointer'
            }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

  // Open the modal pre-filled with the current paper's values:
  // When the "Edit Marks Config" button is clicked:
  onClick={() => {
    setMarkConfigForm({
      totalMarks: selectedPaper?.totalMarks || 100,
      passMarks: selectedPaper?.passMarks || 40
    });
    setShowMarkConfigModal(true);
  }}

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ExamManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL useState calls that read localStorage MUST use lazy initializer:
   useState(() => safeLS('key', []))
5. ALL array operations must guard against null:
   (array || []).filter(...), (array || []).map(...)
6. totalMarks and passMarks are stored PER PAPER in pba_exam_schedule
   under each session's papers[] array. They are NOT shown on the
   schedule card (FIX 1 removes that display).
7. The % in mark entry is ALWAYS calculated from raw/totalMarks.
   It is never stored as a separate input — only as a derived display.
8. The grade is computed from % not raw so it works correctly even
   when different papers have different totals.
9. selectedPaper refers to the paper object currently selected
   in the PAPER dropdown of Mark Entry. It is derived from the
   selected examination session + subject + paper number.
10. selectedSession refers to the full exam session record from
    pba_exam_schedule containing the selected paper.
11. Run npm run build and confirm 0 errors
12. Then npm run deploy to push to GitHub and trigger Vercel deployment
13. List all files modified
```
