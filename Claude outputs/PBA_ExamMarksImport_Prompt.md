# PBA Full-Time Portal — Import Exam Marks from Lecturer's Spreadsheet
## AntiGravity Prompt

---

```
After an exam is completed, the lecturer submits their mark sheet as
a spreadsheet (CSV or Excel-exported CSV). The admin uploads this file
into the portal under the selected exam. The system maps the lecturer's
rows to enrolled students, stores the raw scores, and then calculates
percentages, rankings, and report cards automatically.

Raw marks are NOT entered manually during exam creation. They arrive
ONLY at this import step, which can happen any time after the exam.

Touch ONLY ExaminationsView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
MARK IMPORT FLOW (high-level)
════════════════════════════════════════════════════════════════

  1. Admin opens Examinations → Mark Entry tab
  2. Selects the Batch and Exam from the dropdowns
  3. Clicks "📥 Import Marks (CSV)"
  4. Uploads the lecturer's CSV file
  5. System shows a PREVIEW: each row mapped to a student,
     with a column selector if needed
  6. Admin confirms → marks are saved to pba_marks
  7. Results & Rankings and report cards become live immediately

════════════════════════════════════════════════════════════════
DATA STORAGE
════════════════════════════════════════════════════════════════

Store all marks in a single key:

  pba_marks = [
    {
      id:          "uuid",
      examId:      "exam-uuid",
      studentId:   "student-uuid",
      studentRegNo:"PBA-FT-2024-001",
      rawScore:    67,               ← actual score on the paper
      paperTotal:  80,               ← copied from exam.totalMarks at import time
      percentage:  83.75,            ← computed: rawScore/paperTotal × 100
      importedAt:  "2026-09-24T..."
    }
  ]

Note: percentage IS stored here (unlike pure display-time computation)
because report cards and exports need it without re-joining to the
exam record. Still recomputed if paperTotal changes.

To find a mark: find by examId + studentId.
To update: overwrite that record (re-import replaces existing marks).

════════════════════════════════════════════════════════════════
STEP 1 — Add "Import Marks" button to Mark Entry tab
════════════════════════════════════════════════════════════════

In the Mark Entry tab, ABOVE or alongside the mark sheet grid,
add an import button. Render it when an exam is selected:

  {selectedExamId && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px',
                  marginBottom: '16px' }}>

      <button
        onClick={() => document.getElementById('marks-csv-input').click()}
        style={{
          padding: '9px 20px',
          border: '1px solid #2563EB',
          borderRadius: '8px',
          background: '#EFF6FF',
          color: '#1D4ED8',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        📥 Import Marks (CSV)
      </button>

      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
        Upload the lecturer's mark sheet. Columns: student name or
        reg no, then raw score.
      </span>

      {/* Hidden file input */}
      <input
        id="marks-csv-input"
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={e => handleMarksCSVUpload(e.target.files[0])}
      />
    </div>
  )}

════════════════════════════════════════════════════════════════
STEP 2 — Parse the CSV and show a preview modal
════════════════════════════════════════════════════════════════

ADD state:

  const [importPreview, setImportPreview]   = useState(null);
  // null = no preview open
  // { rows: [...], colNames: [...], nameCol: 0, scoreCol: 1,
  //   mappedRows: [...] }

ADD handleMarksCSVUpload:

  const handleMarksCSVUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        alert('CSV appears empty or has only a header row.');
        return;
      }

      // Detect delimiter: comma or tab
      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const headers   = lines[0].split(delimiter).map(h => h.trim());
      const dataRows  = lines.slice(1).map(l =>
        l.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''))
      );

      // Auto-detect columns: look for "name"/"reg" and "score"/"mark"
      let nameColGuess  = headers.findIndex(h =>
        /name|student|reg/i.test(h));
      let scoreColGuess = headers.findIndex(h =>
        /score|mark|result|total/i.test(h));
      if (nameColGuess  < 0) nameColGuess  = 0;
      if (scoreColGuess < 0) scoreColGuess = headers.length > 1 ? 1 : 0;

      setImportPreview({
        rows:      dataRows,
        colNames:  headers,
        nameCol:   nameColGuess,
        scoreCol:  scoreColGuess,
        mappedRows: []   // filled in step 3
      });
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    document.getElementById('marks-csv-input').value = '';
  };

════════════════════════════════════════════════════════════════
STEP 3 — Map CSV rows to enrolled students
════════════════════════════════════════════════════════════════

When importPreview is set (or when nameCol/scoreCol changes),
compute the mapping. Add a derived value or useEffect:

  const computeMapping = (preview) => {
    if (!preview) return [];
    const { rows, nameCol, scoreCol } = preview;

    // Get enrolled students for the selected batch
    const batches  = safeLS('pba_batches', []);
    const batch    = (batches || []).find(b => b.id === selectedBatchId);
    const enrolled = batch?.students || [];

    return rows.map(row => {
      const rawIdentifier = row[nameCol] || '';
      const rawScore      = parseFloat(row[scoreCol]);

      // Try matching by reg no first, then by name (case-insensitive)
      const matched = (enrolled || []).find(s =>
        (s.regNo && s.regNo.toLowerCase() === rawIdentifier.toLowerCase()) ||
        (s.name  && s.name.toLowerCase()  === rawIdentifier.toLowerCase())
      );

      return {
        csvValue:    rawIdentifier,
        rawScore:    isNaN(rawScore) ? null : rawScore,
        student:     matched || null,
        studentId:   matched?.id    || null,
        studentName: matched?.name  || null,
        status: matched
          ? (isNaN(rawScore) ? 'no-score' : 'matched')
          : 'unmatched'
      };
    });
  };

════════════════════════════════════════════════════════════════
STEP 4 — Render the import preview modal
════════════════════════════════════════════════════════════════

When importPreview is not null, render a centered modal overlay:

  {importPreview && (() => {
    const mappedRows = computeMapping(importPreview);
    const matched    = mappedRows.filter(r => r.status === 'matched');
    const unmatched  = mappedRows.filter(r => r.status === 'unmatched');
    const selectedExam = (safeLS('pba_exams', []) || [])
                           .find(e => e.id === selectedExamId);
    const paperTotal   = selectedExam?.totalMarks || 100;

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          background: '#fff', borderRadius: '12px',
          padding: '28px 32px', width: '640px',
          maxWidth: '92vw', maxHeight: '85vh',
          overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}>

          {/* Header */}
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827',
                       marginTop: 0, marginBottom: '4px' }}>
            Import Marks — {selectedExam?.subject || 'Exam'}
          </h2>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
            Paper total: <strong>/{paperTotal}</strong> &nbsp;·&nbsp;
            {matched.length} matched &nbsp;·&nbsp;
            {unmatched.length > 0 && (
              <span style={{ color: '#DC2626' }}>
                {unmatched.length} unmatched
              </span>
            )}
          </p>

          {/* Column selectors */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px',
                        flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600,
                               color: '#6B7280', display: 'block',
                               marginBottom: '4px' }}>
                STUDENT COLUMN
              </label>
              <select
                value={importPreview.nameCol}
                onChange={e => setImportPreview(p => ({
                  ...p, nameCol: parseInt(e.target.value)
                }))}
                style={{ padding: '6px 10px', border: '1px solid #D1D5DB',
                         borderRadius: '6px', fontSize: '13px' }}
              >
                {importPreview.colNames.map((c, i) => (
                  <option key={i} value={i}>{c || `Column ${i+1}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600,
                               color: '#6B7280', display: 'block',
                               marginBottom: '4px' }}>
                SCORE COLUMN
              </label>
              <select
                value={importPreview.scoreCol}
                onChange={e => setImportPreview(p => ({
                  ...p, scoreCol: parseInt(e.target.value)
                }))}
                style={{ padding: '6px 10px', border: '1px solid #D1D5DB',
                         borderRadius: '6px', fontSize: '13px' }}
              >
                {importPreview.colNames.map((c, i) => (
                  <option key={i} value={i}>{c || `Column ${i+1}`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview rows */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px',
                        overflow: 'hidden', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse',
                             fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left',
                                fontWeight: 600, color: '#374151',
                                borderBottom: '1px solid #E5E7EB' }}>
                    CSV Value
                  </th>
                  <th style={{ padding: '8px 12px', textAlign: 'left',
                                fontWeight: 600, color: '#374151',
                                borderBottom: '1px solid #E5E7EB' }}>
                    Matched Student
                  </th>
                  <th style={{ padding: '8px 12px', textAlign: 'center',
                                fontWeight: 600, color: '#374151',
                                borderBottom: '1px solid #E5E7EB' }}>
                    Raw Score
                  </th>
                  <th style={{ padding: '8px 12px', textAlign: 'center',
                                fontWeight: 600, color: '#374151',
                                borderBottom: '1px solid #E5E7EB' }}>
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {mappedRows.map((row, i) => (
                  <tr key={i} style={{
                    background: row.status === 'unmatched'
                      ? '#FEF2F2' : '#ffffff',
                    borderBottom: '1px solid #F3F4F6'
                  }}>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>
                      {row.csvValue || '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {row.status === 'matched'
                        ? <span style={{ color: '#065F46', fontWeight: 600 }}>
                            ✓ {row.studentName}
                          </span>
                        : <span style={{ color: '#DC2626', fontSize: '12px' }}>
                            ✗ No match
                          </span>
                      }
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center',
                                  fontWeight: 600, color: '#111827' }}>
                      {row.rawScore !== null ? row.rawScore : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center',
                                  color: '#6B7280', fontSize: '12px' }}>
                      {row.rawScore !== null
                        ? `${Math.round(row.rawScore / paperTotal * 1000) / 10}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {unmatched.length > 0 && (
            <p style={{ fontSize: '12px', color: '#B45309',
                         background: '#FEF3C7', borderRadius: '6px',
                         padding: '8px 12px', marginBottom: '16px' }}>
              ⚠️ {unmatched.length} row(s) could not be matched to enrolled
              students. They will be skipped. Check that names or reg numbers
              in the CSV match those in the system.
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => setImportPreview(null)}
              style={{ padding: '9px 20px', border: '1px solid #D1D5DB',
                        borderRadius: '8px', background: '#fff',
                        fontSize: '13px', fontWeight: 600,
                        color: '#374151', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirmImport(mappedRows, paperTotal)}
              disabled={matched.length === 0}
              style={{
                padding: '9px 24px', border: 'none', borderRadius: '8px',
                background: matched.length > 0 ? '#2563EB' : '#D1D5DB',
                color: '#fff', fontSize: '13px', fontWeight: 700,
                cursor: matched.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              ✓ Import {matched.length} Mark{matched.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    );
  })()}

════════════════════════════════════════════════════════════════
STEP 5 — Confirm import: save marks to pba_marks
════════════════════════════════════════════════════════════════

ADD handleConfirmImport:

  const handleConfirmImport = (mappedRows, paperTotal) => {
    const existing = safeLS('pba_marks', []) || [];

    // Remove any old marks for this examId (re-import replaces them)
    const withoutOld = existing.filter(m => m.examId !== selectedExamId);

    const newMarks = mappedRows
      .filter(r => r.status === 'matched' && r.rawScore !== null)
      .map(r => ({
        id:           crypto.randomUUID(),
        examId:       selectedExamId,
        studentId:    r.studentId,
        studentRegNo: '',   // fill from student record if available
        rawScore:     r.rawScore,
        paperTotal:   paperTotal,
        percentage:   Math.round(r.rawScore / paperTotal * 1000) / 10,
        importedAt:   new Date().toISOString()
      }));

    saveLS('pba_marks', [...withoutOld, ...newMarks]);
    setImportPreview(null);
    // Trigger re-render so mark sheet updates immediately
  };

════════════════════════════════════════════════════════════════
STEP 6 — After import: mark sheet shows imported values
════════════════════════════════════════════════════════════════

After import, the mark sheet grid should display the imported raw
scores and computed percentages. In the mark sheet, for each
student cell:

  const markRecord = (safeLS('pba_marks', []) || []).find(m =>
    m.examId === selectedExamId && m.studentId === student.id
  );
  const rawScore   = markRecord?.rawScore   ?? null;
  const percentage = markRecord?.percentage ?? null;

Render in the cell:
  - If imported: show rawScore in bold, percentage below in smaller text
  - If not yet imported: show "—" with a muted style

Also show a summary above the mark sheet after import:
  "✓ Marks imported for {n} students on {date}. Results and
   report cards are now available."

════════════════════════════════════════════════════════════════
EXPECTED CSV FORMAT (from lecturer)
════════════════════════════════════════════════════════════════

The system accepts any CSV where one column identifies the student
(by name OR reg number) and another column has their score.
Column headers are auto-detected. Examples that all work:

  Name,Score
  Kasun Jayawardena,67
  Hiruni Mendis,72

  Reg No,Biology Mark,Notes
  PBA-FT-2024-001,67,Good
  PBA-FT-2024-004,72,

  Student,Result
  Kasun Jayawardena,67
  Hiruni Mendis,72

If the auto-detected columns are wrong, the admin can correct them
using the "Student Column" and "Score Column" dropdowns in the preview.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ExaminationsView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. Re-importing an exam's marks REPLACES previous marks for that exam
5. Unmatched rows are skipped — never silently create phantom students
6. percentage is stored in pba_marks for fast access in report cards
7. paperTotal is copied onto each mark record at import time so the
   correct denominator is preserved even if the exam is later edited
8. The import modal must be position: fixed with zIndex: 9999
9. Run npm run build and confirm 0 errors
10. Then npm run deploy
11. List all files modified
```
