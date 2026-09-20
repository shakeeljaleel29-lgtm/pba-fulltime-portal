# PBA Full-Time Portal — Phase 7B-3: Student Report Card
## AntiGravity Prompt — Run AFTER Phase 7B-1 and 7B-2

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Add a comprehensive Report Card to the Student Profile / Student Management page. This pulls from pba_marks and pba_subjects (added in Phase 7B-1 and 7B-2). Do not change the Examinations page or any other page.

════════════════════════════════════════════════════════════════
SECTION 1 — ADD "REPORT CARD" TAB TO STUDENT PROFILE
════════════════════════════════════════════════════════════════

In the student profile view (StudentProfile.jsx, StudentProfileDrawer.jsx, or equivalent),
add a new tab called "Report Card" to the existing student profile tabs.

The Report Card tab content:

A. REPORT CARD HEADER (printed header — shown on screen and in print):
<div style={{
  background: 'linear-gradient(135deg, #1C1F26, #2B4A7A)',
  borderRadius: '12px', padding: '20px 24px', marginBottom: '20px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
}}>
  LEFT:
    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
      Platinum Business Academy
    </div>
    <div style={{ fontSize: '12px', color: '#90CDF4', marginTop: '2px' }}>
      Student Academic Report Card
    </div>

  RIGHT:
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '12px', color: '#E2E8F0' }}>Student: <strong style={{color:'#FFFFFF'}}>{student.name}</strong></div>
      <div style={{ fontSize: '12px', color: '#E2E8F0' }}>Batch: {student.batch}</div>
      <div style={{ fontSize: '12px', color: '#E2E8F0' }}>Branch: {student.branch}</div>
      <div style={{ fontSize: '12px', color: '#CBD5E0' }}>Generated: {new Date().toLocaleDateString()}</div>
    </div>
</div>

B. TERM / DATE RANGE FILTER (above the report):
<div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
  <label style={{ /* standard label style */ }}>Show exams from</label>
  <input type="date" style={{ /* standard input style */ }} value={fromDate} onChange={...} />
  <label>to</label>
  <input type="date" style={{ /* standard input style */ }} value={toDate} onChange={...} />
  <button onClick={resetDates} style={{ /* ghost button, small */ }}>All Time</button>
</div>

C. PER-SUBJECT PERFORMANCE CARDS:
For each subject the student is enrolled in (from pba_student_subjects or batch subjects),
display one subject card:

<div style={{
  background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px',
  overflow: 'hidden', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
}}>
  {/* Subject card header */}
  <div style={{
    padding: '12px 18px', borderBottom: '1px solid #F4F5F7',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: subjectColor + '10'
  }}>
    LEFT:
      <span style={{ background: subjectColor + '20', color: subjectColor, fontSize: '11px', fontWeight: 800,
        padding: '3px 10px', borderRadius: '20px', marginRight: '10px' }}>{subject.code}</span>
      <span style={{ fontFamily: "'Sora',sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A202C' }}>
        {subject.name}
      </span>
    RIGHT:
      Subject average across all exams:
      <span style={{ fontSize: '18px', fontWeight: 800, color: subjectColor, fontFamily: "'Sora',sans-serif" }}>
        {subjectAvg}%
      </span>
      Grade badge for subject average: calcGrade(subjectAvgRaw, 100)

  {/* Exam results table within the subject card */}
  <div style={{ padding: '0' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#F8F9FB' }}>
          <th style={{ padding: '8px 18px', textAlign: 'left', fontSize: '10px', fontWeight: 700,
            color: '#718096', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #E3E6EA' }}>
            Exam
          </th>
          <th style={{ /* same */ }}>Type</th>
          <th style={{ /* same */ }}>Date</th>
          <th style={{ /* same */ }}>Marks</th>
          <th style={{ /* same */ }}>Grade</th>
          <th style={{ /* same */ }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {examsForSubject.map((exam, i) => {
          const mark = marksForStudentInExam(studentId, exam.id);
          return (
            <tr key={exam.id} style={{ borderBottom: '1px solid #F4F5F7',
              background: i % 2 === 0 ? '#FFFFFF' : '#FAFBFC' }}>
              <td style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 600, color: '#1A202C' }}>
                Exam #{exam.examNumber}
              </td>
              <td style={{ padding: '10px 18px' }}>
                <span style={{ background: '#EBF4FF', color: '#2B6CB0', fontSize: '11px', fontWeight: 600,
                  padding: '2px 8px', borderRadius: '6px' }}>{exam.type}</span>
              </td>
              <td style={{ padding: '10px 18px', fontSize: '12px', color: '#718096' }}>{exam.date}</td>
              <td style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 700, color: '#1A202C' }}>
                {mark?.isAbsent ? '—' : `${mark?.marksObtained ?? '—'} / ${exam.totalMarks}`}
              </td>
              <td style={{ padding: '10px 18px' }}>
                {/* Grade badge using gradeColor(calcGrade(mark?.marksObtained, exam.totalMarks)) */}
                <span style={{
                  background: gc.bg, color: gc.color, border: `1px solid ${gc.border}`,
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px'
                }}>
                  {calcGrade(mark?.marksObtained, exam.totalMarks)}
                </span>
              </td>
              <td style={{ padding: '10px 18px' }}>
                {mark?.isAbsent
                  ? <span style={{ background: '#F7FAFC', color: '#718096', border: '1px solid #E2E8F0',
                      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>Absent</span>
                  : mark?.marksObtained >= exam.passMark
                    ? <span style={{ background: '#F0FFF4', color: '#2F855A', border: '1px solid #9AE6B4',
                        fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>Pass</span>
                    : <span style={{ background: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2',
                        fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>Fail</span>
                }
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>

  {/* Subject footer: trend indicator */}
  {examsForSubject.length >= 2 && (
    <div style={{ padding: '10px 18px', background: '#F8F9FB', borderTop: '1px solid #F4F5F7',
      fontSize: '12px', color: '#4A5568', display: 'flex', gap: '16px' }}>
      <span>Best: <strong>{bestMark}/{exam.totalMarks}</strong></span>
      <span>Average: <strong>{subjectAvg}%</strong></span>
      <span>Trend: {trending up ? '↑ Improving' in green : trending down ? '↓ Declining' in red : '→ Stable' in grey}</span>
    </div>
  )}
</div>

D. OVERALL SUMMARY CARD (at the top, after the header, before subject cards):
<div style={{
  background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px',
  padding: '18px 22px', marginBottom: '20px',
  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px'
}}>
  Tile 1: Overall Average (across all subjects, all exams) — large number in blue
  Tile 2: Overall Grade — A/B/C/D/F badge, large
  Tile 3: Total Exams Taken — number
  Tile 4: Attendance (from pba_attendance if available) — percentage

Each tile:
  <div style={{ textAlign: 'center', padding: '8px' }}>
    <div style={{ fontSize: '26px', fontWeight: 800, color: tileColor, fontFamily: "'Sora',sans-serif" }}>{value}</div>
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#718096', textTransform: 'uppercase',
      letterSpacing: '0.5px', marginTop: '4px' }}>{label}</div>
  </div>

E. PRINT REPORT CARD BUTTON:
<button onClick={handlePrint} style={{
  padding: '10px 20px',
  background: 'linear-gradient(135deg, #D4A017, #B7860A)',
  color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px',
  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
  boxShadow: '0 2px 8px rgba(212,160,23,0.35)', fontFamily: "'Inter',sans-serif"
}}>
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
  Print Report Card
</button>

handlePrint implementation:
  window.print() — the report card layout must be print-friendly.
  Add a <style> block for @media print: hide the sidebar, header, tab bar, and all buttons except the report card content; set font sizes appropriately; add page-break-inside: avoid on subject cards.

════════════════════════════════════════════════════════════════
SECTION 2 — REPORT CARD FROM STUDENT DATABASE TABLE
════════════════════════════════════════════════════════════════

In the Student Database table (list of all students), add a "Report Card" action
button/icon to each student row — clicking it navigates to or opens that student's
profile with the Report Card tab pre-selected.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Data for the report card comes from: pba_marks (marks), pba_exams (exam metadata), pba_subjects (subject info), pba_student_subjects or pba_batch_subjects (enrollment).
2. If a student has no marks for a subject yet, show that subject card with an "No results recorded yet" empty state.
3. Do NOT change Examinations page, General Admin, or any other page.
4. List all files modified.
```
