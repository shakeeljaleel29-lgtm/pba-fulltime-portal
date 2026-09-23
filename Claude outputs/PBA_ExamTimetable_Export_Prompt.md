# PBA Full-Time Portal — Exam Timetable: Invigilator/Room Assignment + PDF Export
## AntiGravity Prompt

---

```
After exams are scheduled, the admin needs to:
  1. Assign an invigilator (lecturer) to each exam — can be done any
     time, including the week before
  2. Assign a classroom to each exam — can be done any time, including
     the day before
  3. Export the finalized timetable as a PDF to share via WhatsApp
     and email

These assignments must be INDEPENDENT of the exam creation step —
the exam can be saved without them, and invigilator + room can be
added or changed at any time before (or after) the exam.

Touch ONLY ExaminationsView.jsx (or whichever file manages exams).
Do NOT change any other file.

════════════════════════════════════════════════════════════════
DATA ARCHITECTURE
════════════════════════════════════════════════════════════════

Keep exam records in pba_exams (existing key). Each exam object
ALREADY has fields like: id, subject, date, startTime, endTime,
batchName/batchId, etc.

ADD two optional fields to each exam record:
  invigilatorId:   string | null   — lecturer ID (nullable)
  invigilatorName: string | null   — denormalized for quick display
  roomId:          string | null   — classroom ID (nullable)
  roomName:        string | null   — denormalized for quick display

These fields default to null when not yet assigned. The exam is
fully valid without them. They are patched in later via the UI.

Do NOT create a separate override table — patch directly onto the
exam record in pba_exams, since invigilator and room are permanent
attributes of this specific scheduled exam (not per-date overrides
like daily room allocation).

════════════════════════════════════════════════════════════════
STEP 1 — Inline editing: assign invigilator + room from exam list
════════════════════════════════════════════════════════════════

In the exam list/timetable view, each exam row already shows
subject, date, time, batch. ADD two more columns (or an expand
panel) for:

  • Invigilator  — a dropdown OR an "Assign" button that opens a
                   small inline picker
  • Room         — a dropdown OR an "Assign" button

The simplest approach: add two compact dropdowns directly in each
exam row. They save on change (no separate Save button needed).

For each exam row, add:

  {/* Invigilator dropdown */}
  <select
    value={exam.invigilatorId || ''}
    onChange={e => handlePatchExam(exam.id, {
      invigilatorId:   e.target.value,
      invigilatorName: (safeLS('pba_lecturers', []) || [])
                         .find(l => l.id === e.target.value)?.name || ''
    })}
    style={{
      padding: '6px 8px',
      border: '1px solid #D1D5DB',
      borderRadius: '6px',
      fontSize: '12px',
      color: exam.invigilatorId ? '#111827' : '#9CA3AF',
      background: '#fff',
      minWidth: '140px',
      cursor: 'pointer'
    }}
  >
    <option value="">— Invigilator —</option>
    {(safeLS('pba_lecturers', []) || []).map(l => (
      <option key={l.id} value={l.id}>{l.name}</option>
    ))}
  </select>

  {/* Room dropdown */}
  <select
    value={exam.roomId || ''}
    onChange={e => handlePatchExam(exam.id, {
      roomId:   e.target.value,
      roomName: (safeLS('pba_classrooms', []) || [])
                  .find(r => r.id === e.target.value)?.name || ''
    })}
    style={{
      padding: '6px 8px',
      border: '1px solid #D1D5DB',
      borderRadius: '6px',
      fontSize: '12px',
      color: exam.roomId ? '#111827' : '#9CA3AF',
      background: '#fff',
      minWidth: '120px',
      cursor: 'pointer'
    }}
  >
    <option value="">— Room —</option>
    {(safeLS('pba_classrooms', []) || []).map(r => (
      <option key={r.id} value={r.id}>
        {r.name}{r.capacity ? ` (${r.capacity})` : ''}
      </option>
    ))}
  </select>

ADD the handlePatchExam helper:

  const handlePatchExam = (examId, patch) => {
    const allExams = safeLS('pba_exams', []);
    const updated  = (allExams || []).map(e =>
      e.id === examId ? { ...e, ...patch } : e
    );
    saveLS('pba_exams', updated);
    // force re-render if needed: setForceUpdate(n => n + 1)
  };

════════════════════════════════════════════════════════════════
STEP 2 — Completion status indicator
════════════════════════════════════════════════════════════════

Each exam row should show a visual completeness indicator:

  const examStatus = (exam) => {
    if (exam.invigilatorId && exam.roomId)  return 'complete';
    if (exam.invigilatorId || exam.roomId)  return 'partial';
    return 'pending';
  };

Render a small badge:

  {examStatus(exam) === 'complete' && (
    <span style={{ background:'#D1FAE5', color:'#065F46',
                   borderRadius:'999px', padding:'2px 8px',
                   fontSize:'11px', fontWeight:600 }}>✓ Ready</span>
  )}
  {examStatus(exam) === 'partial' && (
    <span style={{ background:'#FEF3C7', color:'#92400E',
                   borderRadius:'999px', padding:'2px 8px',
                   fontSize:'11px', fontWeight:600 }}>⏳ Partial</span>
  )}
  {examStatus(exam) === 'pending' && (
    <span style={{ background:'#F3F4F6', color:'#6B7280',
                   borderRadius:'999px', padding:'2px 8px',
                   fontSize:'11px', fontWeight:600 }}>— Pending</span>
  )}

════════════════════════════════════════════════════════════════
STEP 3 — Export controls
════════════════════════════════════════════════════════════════

Add an export toolbar ABOVE the exam list. It has:
  • A date-range filter (optional — to export a specific exam period)
  • "📄 Export PDF" button
  • "📋 Copy for WhatsApp" button

  <div style={{ display:'flex', alignItems:'center', gap:'12px',
                justifyContent:'flex-end', marginBottom:'16px',
                flexWrap:'wrap' }}>

    {/* Optional: filter by date range */}
    <div style={{ display:'flex', alignItems:'center', gap:'8px',
                  fontSize:'13px', color:'#374151' }}>
      <span>From</span>
      <input type="date" value={exportFrom}
             onChange={e => setExportFrom(e.target.value)}
             style={{ padding:'6px 10px', border:'1px solid #D1D5DB',
                      borderRadius:'6px', fontSize:'13px' }} />
      <span>to</span>
      <input type="date" value={exportTo}
             onChange={e => setExportTo(e.target.value)}
             style={{ padding:'6px 10px', border:'1px solid #D1D5DB',
                      borderRadius:'6px', fontSize:'13px' }} />
    </div>

    {/* Copy for WhatsApp */}
    <button onClick={handleCopyWhatsApp}
      style={{ padding:'9px 18px', border:'1px solid #D1D5DB',
               borderRadius:'8px', background:'#fff',
               fontSize:'13px', fontWeight:600, color:'#374151',
               cursor:'pointer' }}>
      📋 Copy Schedule
    </button>

    {/* Export PDF */}
    <button onClick={handleExportPDF}
      style={{ padding:'9px 20px', border:'none', borderRadius:'8px',
               background:'#2563EB', color:'#fff',
               fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
      📄 Export PDF
    </button>
  </div>

ADD state:
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo,   setExportTo]   = useState('');

════════════════════════════════════════════════════════════════
STEP 4 — PDF generation (print-to-PDF via browser)
════════════════════════════════════════════════════════════════

Use the browser's native window.print() with a print-specific
hidden div. This requires NO external PDF library.

ADD a hidden printable div in the JSX (rendered but invisible
until printing):

  <div id="exam-timetable-print" style={{ display: 'none' }}>
    {/* populated by handleExportPDF */}
  </div>

ADD handleExportPDF:

  const handleExportPDF = () => {
    const allExams = safeLS('pba_exams', []) || [];
    const filtered = allExams
      .filter(e => {
        if (exportFrom && e.date < exportFrom) return false;
        if (exportTo   && e.date > exportTo)   return false;
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startTime||'').localeCompare(b.startTime||'');
      });

    // Group by date
    const byDate = {};
    filtered.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });

    const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Build HTML for print
    const rows = Object.entries(byDate).map(([date, exams]) => `
      <tr class="date-header">
        <td colspan="6">${formatDate(date)}</td>
      </tr>
      ${exams.map(e => `
        <tr>
          <td>${e.startTime || '—'} – ${e.endTime || '—'}</td>
          <td>${e.subject  || '—'}</td>
          <td>${e.batchName || e.batch || '—'}</td>
          <td>${e.invigilatorName || '<em style="color:#9CA3AF">TBC</em>'}</td>
          <td>${e.roomName || '<em style="color:#9CA3AF">TBC</em>'}</td>
        </tr>
      `).join('')}
    `).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>PBA Exam Timetable</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px;
                 margin: 24px; color: #111827; }
          h1   { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
          p.sub{ font-size: 12px; color: #6B7280; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th    { background: #1E3A8A; color: #fff; text-align: left;
                  padding: 8px 10px; font-size: 11px; font-weight: 700;
                  letter-spacing: 0.04em; }
          td    { padding: 7px 10px; border-bottom: 1px solid #E5E7EB;
                  vertical-align: top; }
          tr.date-header td {
            background: #EFF6FF; color: #1E40AF; font-weight: 700;
            font-size: 13px; padding: 10px 10px 6px; border-top: 2px solid #BFDBFE;
          }
          tr:hover td { background: #F9FAFB; }
          .tbc { color: #9CA3AF; font-style: italic; }
          .footer { margin-top: 28px; font-size: 11px; color: #9CA3AF;
                    border-top: 1px solid #E5E7EB; padding-top: 10px; }
          @media print {
            body { margin: 12mm; }
            .footer { position: fixed; bottom: 12mm; width: 100%; }
          }
        </style>
      </head>
      <body>
        <h1>PBA Full-Time Portal — Examination Timetable</h1>
        <p class="sub">Generated ${new Date().toLocaleDateString('en-GB', {
          weekday:'long', day:'numeric', month:'long', year:'numeric'
        })}${exportFrom || exportTo
          ? ` &nbsp;·&nbsp; Period: ${exportFrom||'—'} to ${exportTo||'—'}`
          : ''
        }</p>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Subject</th>
              <th>Batch</th>
              <th>Invigilator</th>
              <th>Room</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">PBA Full-Time Portal &nbsp;·&nbsp; Confidential</div>
      </body>
      </html>
    `;

    // Open a new window, write the HTML, trigger print dialog
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      // printWindow.close();  // optional — close after print
    }, 400);
  };

════════════════════════════════════════════════════════════════
STEP 5 — WhatsApp / clipboard text format
════════════════════════════════════════════════════════════════

ADD handleCopyWhatsApp:

  const handleCopyWhatsApp = () => {
    const allExams = safeLS('pba_exams', []) || [];
    const filtered = allExams
      .filter(e => {
        if (exportFrom && e.date < exportFrom) return false;
        if (exportTo   && e.date > exportTo)   return false;
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startTime||'').localeCompare(b.startTime||'');
      });

    const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', {
      weekday:'long', day:'numeric', month:'long', year:'numeric'
    });

    let currentDate = '';
    const lines = [
      `📚 *PBA Full-Time Portal — Examination Timetable*`,
      ``
    ];

    filtered.forEach(e => {
      if (e.date !== currentDate) {
        currentDate = e.date;
        lines.push(`📅 *${formatDate(e.date)}*`);
      }
      const invig = e.invigilatorName || 'TBC';
      const room  = e.roomName        || 'TBC';
      lines.push(
        `🕐 *${e.startTime||'?'}–${e.endTime||'?'}*` +
        ` | ${e.subject||'—'}` +
        ` | ${e.batchName || e.batch || '—'}` +
        ` | 👤 ${invig}` +
        ` | 🏫 ${room}`
      );
    });

    lines.push(``);
    lines.push(`_Sent from PBA Full-Time Portal_`);

    const msg = lines.join('\n');
    navigator.clipboard.writeText(msg)
      .then(() => alert('Schedule copied! Paste into WhatsApp or email.'))
      .catch(() => {
        // Fallback: open WhatsApp with the text
        window.open(
          'https://wa.me/?text=' + encodeURIComponent(msg), '_blank'
        );
      });
  };

The WhatsApp message will look like:

  📚 *PBA Full-Time Portal — Examination Timetable*

  📅 *Monday, 5 October 2026*
  🕐 *09:00–11:00* | Biology | Cambridge OL 2027 | 👤 Dr. Liyanage | 🏫 Hall A
  🕐 *09:00–11:00* | Accounts | Cambridge OL 2027 | 👤 Mr. Perera | 🏫 Hall B

  📅 *Tuesday, 6 October 2026*
  🕐 *09:00–11:00* | Chemistry | Cambridge OL 2027 | 👤 TBC | 🏫 TBC

  _Sent from PBA Full-Time Portal_

Note: TBC fields appear when invigilator/room not yet assigned —
the export works at any level of completion.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ExaminationsView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. Invigilator and room are OPTIONAL fields — exams save without them
5. handlePatchExam patches in-place — does NOT lose other exam fields
6. PDF uses window.open + window.print() — no external library needed
7. "TBC" appears in PDF and WhatsApp message when field not yet set
8. Date-range filter is optional — if both fields are empty, ALL exams
   are exported
9. Run npm run build and confirm 0 errors
10. Then npm run deploy
11. List all files modified
```
