# PBA Full-Time Portal — Examinations: Batch Mark Sheet + Full Rankings Overhaul
## AntiGravity Prompt

---

```
Overhaul the Results & Rankings tab in ExamManagementView.jsx to support:
(1) Batch-wide mark sheet (all subjects for all students in one grid)
(2) Subject-wise rankings per batch
(3) Overall batch ranking (aggregate score across all subjects)
(4) Fix "null / 100" showing instead of real marks or "—"
Touch ONLY ExamManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
UNDERSTANDING THE DATA MODEL
════════════════════════════════════════════════════════════════

pba_exam_schedule — Each record is ONE exam session for ONE subject:
  {
    id, examName,        // e.g. "Mock Test 1", "Term 1 Exam"
    batchId, batchName, batchShortCode,
    subjectId, subjectName, subjectCode,
    date, maxScore,      // e.g. 100
    venue, duration, status
  }

pba_exam_results — Marks entered for each student per exam session:
  {
    id,
    examSessionId,       // links to pba_exam_schedule.id
    examName,
    studentId, studentName, studentCode,
    batchId, batchName,
    subjectId, subjectName, subjectCode,
    score,               // number or null if absent
    maxScore,
    grade,               // 'A', 'B', 'C', 'D', 'F', 'ABS'
    absent,              // boolean — true if student was absent
    date
  }

KEY INSIGHT:
  "Mock Test 1" for "Batch 2024-A" has MULTIPLE exam sessions:
    - ACC session (Accounting)    → results for all students
    - BIO session (Biology)       → results for all students
    - CHE session (Chemistry)     → results for all students
  
  Grouping by examName + batchId gives the FULL PICTURE per exam event.

════════════════════════════════════════════════════════════════
DATA LOADS AT TOP OF COMPONENT
════════════════════════════════════════════════════════════════

const [examSchedule, setExamSchedule] = useState(() => safeLS('pba_exam_schedule', []));
const [examResults,  setExamResults]  = useState(() => safeLS('pba_exam_results',  []));
const [students,     setStudents]     = useState(() => safeLS('pba_students',      []));
const [batches,      setBatches]      = useState(() => safeLS('pba_batches',       []));
const [subjects,     setSubjects]     = useState(() => safeLS('pba_subjects',      []));

════════════════════════════════════════════════════════════════
FIX 1 — "null / 100" DISPLAY BUG
════════════════════════════════════════════════════════════════

When rendering marks, NEVER show "null". Use this helper:

  const displayScore = (result) => {
    if (!result)          return '—';
    if (result.absent)    return 'ABS';
    if (result.score === null || result.score === undefined) return '—';
    return result.score;
  };

  const displayGrade = (result) => {
    if (!result)       return '—';
    if (result.absent) return 'ABS';
    if (result.grade)  return result.grade;
    return '—';
  };

════════════════════════════════════════════════════════════════
RESULTS & RANKINGS TAB — NEW LAYOUT
════════════════════════════════════════════════════════════════

Replace the current "SELECT EXAMINATION SESSION" single-dropdown approach
with a two-step selector + view mode toggle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — TOP FILTER BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

State for the filter bar:
  const [filterBatchId,   setFilterBatchId]   = useState('');
  const [filterExamName,  setFilterExamName]  = useState('');
  const [rankViewMode,    setRankViewMode]    = useState('marksheet');
  // rankViewMode: 'marksheet' | 'overall' | 'subject'
  const [filterSubjectId, setFilterSubjectId] = useState('');

Derive available exam names for the selected batch:
  const examNamesForBatch = filterBatchId
    ? [...new Set(
        (examSchedule || [])
          .filter(e => e.batchId === filterBatchId)
          .map(e => e.examName)
      )].sort()
    : [...new Set((examSchedule || []).map(e => e.examName))].sort();

Render the filter bar:
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px',
    alignItems: 'center', padding: '16px',
    background: '#F8FAFC', borderRadius: '12px',
    border: '1px solid #E2E8F0', marginBottom: '16px' }}>

    {/* BATCH */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Batch:</span>
      <select value={filterBatchId}
        onChange={e => { setFilterBatchId(e.target.value); setFilterExamName(''); setFilterSubjectId(''); }}
        style={{ fontSize: '13px', padding: '7px 12px', borderRadius: '8px',
          border: '1px solid #E2E8F0', color: '#1A202C', background: 'white', cursor: 'pointer' }}>
        <option value="">All Batches</option>
        {(batches || []).map(b => (
          <option key={b.id} value={b.id}>{b.name} ({b.shortCode})</option>
        ))}
      </select>
    </div>

    {/* EXAM NAME (e.g. Mock Test 1, Term Exam) */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Exam:</span>
      <select value={filterExamName}
        onChange={e => { setFilterExamName(e.target.value); setFilterSubjectId(''); }}
        style={{ fontSize: '13px', padding: '7px 12px', borderRadius: '8px',
          border: '1px solid #E2E8F0', color: '#1A202C', background: 'white', cursor: 'pointer' }}>
        <option value="">All Exams</option>
        {examNamesForBatch.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>

    {/* VIEW MODE TOGGLE */}
    <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto',
      background: '#EEF2FF', borderRadius: '10px', padding: '4px' }}>
      {[
        { key: 'marksheet', label: '📋 Mark Sheet' },
        { key: 'overall',   label: '🏆 Overall Ranking' },
        { key: 'subject',   label: '📚 By Subject' }
      ].map(mode => (
        <button key={mode.key}
          onClick={() => { setRankViewMode(mode.key); setFilterSubjectId(''); }}
          style={{
            padding: '6px 14px', borderRadius: '7px',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            border: 'none',
            background: rankViewMode === mode.key ? '#4F46E5' : 'transparent',
            color: rankViewMode === mode.key ? 'white' : '#4F46E5',
            transition: 'all 0.15s ease'
          }}>
          {mode.label}
        </button>
      ))}
    </div>
  </div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIEW A — BATCH MARK SHEET (rankViewMode === 'marksheet')
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is the main new feature. Rows = students, Columns = subjects.

Derive data:
  // Get all exam sessions matching the filter
  const filteredSessions = (examSchedule || []).filter(e => {
    if (filterBatchId  && e.batchId  !== filterBatchId)  return false;
    if (filterExamName && e.examName !== filterExamName) return false;
    return true;
  });

  // All subject columns across these sessions (deduplicated)
  const subjectColumns = [];
  const seenSubjects = new Set();
  (filteredSessions || []).forEach(sess => {
    if (!seenSubjects.has(sess.subjectId)) {
      seenSubjects.add(sess.subjectId);
      subjectColumns.push({ subjectId: sess.subjectId, subjectName: sess.subjectName, subjectCode: sess.subjectCode, maxScore: sess.maxScore || 100 });
    }
  });

  // All students in the filtered batches
  const batchIds = filterBatchId
    ? [filterBatchId]
    : [...new Set(filteredSessions.map(e => e.batchId))];

  const filteredStudents = (students || [])
    .filter(s => batchIds.includes(s.batchId))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Build lookup: results[studentId][subjectId] = result record
  const resultsLookup = {};
  (examResults || []).forEach(r => {
    if (filterBatchId  && r.batchId  !== filterBatchId)  return;
    if (filterExamName && r.examName !== filterExamName) return;
    if (!resultsLookup[r.studentId]) resultsLookup[r.studentId] = {};
    resultsLookup[r.studentId][r.subjectId] = r;
  });

  // Compute totals and rank
  const studentTotals = filteredStudents.map(student => {
    let totalScore = 0;
    let totalMax   = 0;
    let allEntered = true;
    subjectColumns.forEach(col => {
      const r = (resultsLookup[student.id] || {})[col.subjectId];
      if (r && !r.absent && r.score !== null && r.score !== undefined) {
        totalScore += Number(r.score);
        totalMax   += Number(col.maxScore);
      } else if (!r || (r.score === null && !r.absent)) {
        allEntered = false;
        totalMax   += Number(col.maxScore);
      } else if (r.absent) {
        totalMax   += Number(col.maxScore);
      }
    });
    const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    return { student, totalScore, totalMax, pct, allEntered };
  });

  // Sort by totalScore desc, assign rank
  const ranked = [...studentTotals].sort((a, b) => b.totalScore - a.totalScore);
  const rankMap = {};
  ranked.forEach((item, i) => { rankMap[item.student.id] = i + 1; });

  // Grade color helper
  const gradeColor = (grade) => {
    if (!grade || grade === '—') return '#94A3B8';
    if (grade === 'ABS')         return '#6B7280';
    if (grade === 'A')           return '#059669';
    if (grade === 'B')           return '#0EA5E9';
    if (grade === 'C')           return '#D97706';
    if (grade === 'D')           return '#EA580C';
    return '#DC2626'; // F
  };

Render the Mark Sheet table:
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
      <thead>
        <tr style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
          <th style={{ padding: '10px 12px', color: 'white', textAlign: 'left',
            fontWeight: 700, borderRadius: '8px 0 0 0', minWidth: '40px' }}>
            #
          </th>
          <th style={{ padding: '10px 12px', color: 'white', textAlign: 'left',
            fontWeight: 700, minWidth: '160px' }}>
            STUDENT
          </th>
          {(subjectColumns || []).map(col => (
            <th key={col.subjectId}
              style={{ padding: '10px 8px', color: 'white', textAlign: 'center',
                fontWeight: 700, minWidth: '80px' }}>
              <div>{col.subjectCode || col.subjectName}</div>
              <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>
                /{col.maxScore}
              </div>
            </th>
          ))}
          <th style={{ padding: '10px 12px', color: 'white', textAlign: 'center',
            fontWeight: 700, minWidth: '80px', background: 'rgba(255,255,255,0.15)' }}>
            TOTAL
          </th>
          <th style={{ padding: '10px 12px', color: 'white', textAlign: 'center',
            fontWeight: 700, minWidth: '60px', borderRadius: '0 8px 0 0',
            background: 'rgba(255,255,255,0.15)' }}>
            %
          </th>
        </tr>
      </thead>
      <tbody>
        {(studentTotals.sort((a,b) => b.totalScore - a.totalScore) || []).map((item, i) => {
          const rank = rankMap[item.student.id];
          const rowBg = i % 2 === 0 ? 'white' : '#FAFBFF';
          return (
            <tr key={item.student.id}
              style={{ background: rowBg, borderBottom: '1px solid #F0F0F0' }}>
              {/* Rank */}
              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800 }}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
              </td>
              {/* Student */}
              <td style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 700, color: '#1A202C', fontSize: '13px' }}>
                  {item.student.name}
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                  {item.student.studentCode || item.student.id}
                </div>
              </td>
              {/* One cell per subject */}
              {(subjectColumns || []).map(col => {
                const r = (resultsLookup[item.student.id] || {})[col.subjectId];
                const score = displayScore(r);
                const grade = displayGrade(r);
                return (
                  <td key={col.subjectId}
                    style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px',
                      color: r?.absent ? '#6B7280' : '#1A202C' }}>
                      {score}
                    </div>
                    <div style={{
                      fontSize: '10px', fontWeight: 700,
                      color: 'white',
                      background: gradeColor(grade),
                      borderRadius: '4px', padding: '1px 5px',
                      display: 'inline-block', marginTop: '2px'
                    }}>
                      {grade}
                    </div>
                  </td>
                );
              })}
              {/* Total */}
              <td style={{ padding: '10px 12px', textAlign: 'center',
                fontWeight: 800, fontSize: '14px', color: '#4F46E5',
                background: '#EEF2FF' }}>
                {item.totalScore} / {item.totalMax}
              </td>
              {/* % */}
              <td style={{ padding: '10px 12px', textAlign: 'center',
                fontWeight: 800, fontSize: '14px',
                color: item.pct >= 75 ? '#059669' : item.pct >= 50 ? '#D97706' : '#DC2626',
                background: '#EEF2FF' }}>
                {item.pct}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>

  If subjectColumns is empty OR filteredStudents is empty, show:
  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
    <div style={{ fontSize: '15px', fontWeight: 600 }}>
      Select a Batch and Exam above to view the mark sheet
    </div>
  </div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIEW B — OVERALL BATCH RANKING (rankViewMode === 'overall')
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reuse the same studentTotals / rankMap derived above.
Show a clean podium-style ranking table.

Summary stat cards at the top:
  STUDENTS RANKED: filteredStudents.length
  HIGHEST AGGREGATE: max(studentTotals.totalScore) / max(studentTotals.totalMax)
  CLASS AVERAGE: avg(studentTotals.pct)%
  SUBJECTS: subjectColumns.length

Render ranking table (same as existing Results & Rankings table but with aggregate):
  RANK | STUDENT NAME (+ ID) | TOTAL MARKS | % | GRADE BAND

  Grade band computed from %:
    ≥ 80% → 'A' (green)
    ≥ 65% → 'B' (blue)
    ≥ 50% → 'C' (amber)
    ≥ 40% → 'D' (orange)
    < 40%  → 'F' (red)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIEW C — BY SUBJECT (rankViewMode === 'subject')
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Show a subject tab strip, then the per-subject ranking.

Subject tab strip (from subjectColumns derived above):
  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
    {(subjectColumns || []).map(col => (
      <button key={col.subjectId}
        onClick={() => setFilterSubjectId(col.subjectId)}
        style={{
          padding: '8px 16px', borderRadius: '20px',
          fontSize: '12px', fontWeight: 700, cursor: 'pointer',
          border: filterSubjectId === col.subjectId ? 'none' : '1px solid #E2E8F0',
          background: filterSubjectId === col.subjectId ? '#4F46E5' : 'white',
          color: filterSubjectId === col.subjectId ? 'white' : '#64748B',
          transition: 'all 0.15s ease'
        }}>
        {col.subjectCode} — {col.subjectName}
      </button>
    ))}
  </div>

When a subject tab is selected, show the per-subject ranking:
  // Filter results to this subject
  const subjectResults = (examResults || []).filter(r => {
    if (filterBatchId  && r.batchId  !== filterBatchId)  return false;
    if (filterExamName && r.examName !== filterExamName) return false;
    if (filterSubjectId && r.subjectId !== filterSubjectId) return false;
    return true;
  });

  // Sort by score desc (nulls and ABS go to bottom)
  const subjectRanked = [...subjectResults]
    .sort((a, b) => {
      if (a.absent && !b.absent) return 1;
      if (!a.absent && b.absent) return -1;
      return (b.score || 0) - (a.score || 0);
    });

  Stat cards for this subject:
    CLASS AVERAGE: avg of non-absent scores
    HIGHEST MARK: max score
    PASS RATE: count(score >= passMark) / count(non-absent) × 100%
    ABSENT: count(absent)

  Ranking table:
    RANK | STUDENT NAME | MARKS / TOTAL | GRADE | STATUS

  Keep existing Grade Distribution bar chart below the table.

  If no subject tab is selected yet, show prompt:
    "Select a subject above to view subject-wise rankings"

════════════════════════════════════════════════════════════════
ALSO FIX — Mark Entry tab: "null / 100" grade assignment
════════════════════════════════════════════════════════════════

When saving marks from the Mark Entry tab, only assign grade if
the student is NOT absent AND score is a valid number:

  const computeGrade = (score, maxScore, absent) => {
    if (absent) return 'ABS';
    if (score === null || score === undefined || score === '') return null;
    const pct = (score / maxScore) * 100;
    if (pct >= 80) return 'A';
    if (pct >= 65) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  };

When saving to pba_exam_results:
  score: absent ? null : (enteredScore !== '' ? Number(enteredScore) : null),
  grade: computeGrade(enteredScore, maxScore, absent)

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY ExamManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. ALL useState calls that read localStorage must use lazy initializer:
   useState(() => safeLS('key', []))
5. ALL array operations must guard against null:
   (array || []).filter(...), (array || []).map(...)
6. The three view modes (marksheet / overall / subject) are tabs
   within the Results & Rankings tab — do NOT add new top-level tabs
7. The Mark Sheet works for ANY exam type — Mock Tests, Term Exams,
   Class Tests — whatever examName was used when scheduling
8. Run npm run build and confirm 0 errors
9. Then run npm run deploy to push to GitHub and trigger Vercel deployment
10. List all files modified
```
