# PBA Full-Time Portal — Exam Subject Clash Prevention
## AntiGravity Prompt

---

```
When scheduling exams, certain subject pairs must not be timetabled
at the same time, because students who study multiple subjects in the
same stream would face simultaneous exams.

Rules:
  - Science subjects (Biology, Physics, Chemistry, Maths) must NOT
    clash with each other — a student can take any combination of these.
  - Commerce subjects (Accounts, Business Studies, Economics) must NOT
    clash with each other.
  - Science ↔ Commerce CAN happen simultaneously (different streams,
    different students).
  - Admin must be able to CONFIGURE these rules — add or remove
    forbidden subject pairs — because the exact list can change.

Add:
  (A) A "Clash Rules" configuration section in the Examinations view
  (B) Real-time clash detection when scheduling/editing an exam

Touch ONLY the file containing the Examinations view
(ExaminationsView.jsx or similar).
Do NOT change any other file.

════════════════════════════════════════════════════════════════
DATA STORAGE
════════════════════════════════════════════════════════════════

Store forbidden subject pairs in a new key:

  pba_clash_rules = [
    { id: "uuid-1", subjectA: "Biology",   subjectB: "Physics"   },
    { id: "uuid-2", subjectA: "Biology",   subjectB: "Chemistry" },
    { id: "uuid-3", subjectA: "Physics",   subjectB: "Chemistry" },
    { id: "uuid-4", subjectA: "Biology",   subjectB: "Maths"     },
    { id: "uuid-5", subjectA: "Accounts",  subjectB: "Business Studies" },
    { id: "uuid-6", subjectA: "Accounts",  subjectB: "Economics" },
    { id: "uuid-7", subjectA: "Business Studies", subjectB: "Economics" }
  ]

Pre-populate pba_clash_rules with these 7 defaults on first load
(only if the key does not already exist in localStorage).

A clash is BIDIRECTIONAL: { A, B } blocks both A-vs-B and B-vs-A.

════════════════════════════════════════════════════════════════
PART A — Clash Rules configuration panel
════════════════════════════════════════════════════════════════

Add a collapsible section titled "⚠️ Subject Clash Rules" at the TOP
of the Examinations view, above the exam list/schedule.

Collapsed by default; a chevron toggles it open.

When open, render:

  ┌─────────────────────────────────────────────────────────────┐
  │ ⚠️ Subject Clash Rules                                   ▲  │
  │ These subject pairs will never be scheduled at the same     │
  │ time. Students taking subjects in the same stream may       │
  │ take both.                                                  │
  │                                                             │
  │  🔴 Biology         ↔  Physics            [Remove]         │
  │  🔴 Biology         ↔  Chemistry          [Remove]         │
  │  🔴 Physics         ↔  Chemistry          [Remove]         │
  │  🔴 Biology         ↔  Maths              [Remove]         │
  │  🔴 Accounts        ↔  Business Studies   [Remove]         │
  │  🔴 Accounts        ↔  Economics          [Remove]         │
  │  🔴 Business Studies↔  Economics          [Remove]         │
  │                                                             │
  │  [Subject A ▾]   cannot clash with   [Subject B ▾]  [+ Add]│
  └─────────────────────────────────────────────────────────────┘

STATE needed:

  const [clashRulesOpen, setClashRulesOpen] = useState(false);
  const [newClashA, setNewClashA] = useState('');
  const [newClashB, setNewClashB] = useState('');

INITIALISE defaults on mount (add to existing useEffect or new one):

  useEffect(() => {
    const existing = safeLS('pba_clash_rules', null);
    if (existing === null || existing === undefined) {
      // First time — seed defaults
      const defaults = [
        { id: crypto.randomUUID(), subjectA: 'Biology',        subjectB: 'Physics'         },
        { id: crypto.randomUUID(), subjectA: 'Biology',        subjectB: 'Chemistry'       },
        { id: crypto.randomUUID(), subjectA: 'Physics',        subjectB: 'Chemistry'       },
        { id: crypto.randomUUID(), subjectA: 'Biology',        subjectB: 'Maths'           },
        { id: crypto.randomUUID(), subjectA: 'Accounts',       subjectB: 'Business Studies'},
        { id: crypto.randomUUID(), subjectA: 'Accounts',       subjectB: 'Economics'       },
        { id: crypto.randomUUID(), subjectA: 'Business Studies', subjectB: 'Economics'     }
      ];
      saveLS('pba_clash_rules', defaults);
    }
  }, []);

ADD RULE handler:

  const handleAddClashRule = () => {
    if (!newClashA || !newClashB || newClashA === newClashB) return;
    const existing = safeLS('pba_clash_rules', []);
    // Check not already defined (either direction)
    const alreadyExists = (existing || []).some(r =>
      (r.subjectA === newClashA && r.subjectB === newClashB) ||
      (r.subjectA === newClashB && r.subjectB === newClashA)
    );
    if (alreadyExists) return;
    const updated = [...(existing || []), {
      id: crypto.randomUUID(), subjectA: newClashA, subjectB: newClashB
    }];
    saveLS('pba_clash_rules', updated);
    setNewClashA('');
    setNewClashB('');
  };

REMOVE RULE handler:

  const handleRemoveClashRule = (ruleId) => {
    const updated = (safeLS('pba_clash_rules', []) || [])
      .filter(r => r.id !== ruleId);
    saveLS('pba_clash_rules', updated);
  };

Subject dropdowns for adding rules should read from pba_subjects:

  const subjectOptions = (safeLS('pba_subjects', []) || [])
    .map(s => s.name || s)
    .filter(Boolean);

RENDER the section:

  <div style={{
    border: '1px solid #FDE68A',
    borderRadius: '10px',
    marginBottom: '24px',
    overflow: 'hidden'
  }}>
    {/* Header — always visible */}
    <div
      onClick={() => setClashRulesOpen(p => !p)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: '#FFFBEB',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <div>
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#92400E' }}>
          ⚠️ Subject Clash Rules
        </span>
        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#B45309' }}>
          {(safeLS('pba_clash_rules', []) || []).length} rule
          {(safeLS('pba_clash_rules', []) || []).length !== 1 ? 's' : ''} active
        </span>
      </div>
      <span style={{ fontSize: '18px', color: '#B45309' }}>
        {clashRulesOpen ? '▲' : '▼'}
      </span>
    </div>

    {/* Body — shown when open */}
    {clashRulesOpen && (
      <div style={{ padding: '16px 18px', background: '#ffffff' }}>
        <p style={{ fontSize: '13px', color: '#6B7280', marginTop: 0, marginBottom: '14px' }}>
          Subjects paired here will never be scheduled at the same time.
          Science–Commerce pairings are intentionally absent (they can overlap).
        </p>

        {/* Existing rules */}
        <div style={{ marginBottom: '14px' }}>
          {(safeLS('pba_clash_rules', []) || []).map(rule => (
            <div key={rule.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px',
              border: '1px solid #FEE2E2',
              borderRadius: '8px',
              marginBottom: '6px',
              background: '#FFF5F5'
            }}>
              <span style={{ fontSize: '13px', color: '#374151' }}>
                <span style={{ color: '#EF4444', marginRight: '6px' }}>🔴</span>
                <strong>{rule.subjectA}</strong>
                <span style={{ margin: '0 8px', color: '#9CA3AF' }}>cannot clash with</span>
                <strong>{rule.subjectB}</strong>
              </span>
              <button
                onClick={() => handleRemoveClashRule(rule.id)}
                style={{
                  padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                  border: '1px solid #FCA5A5', borderRadius: '6px',
                  background: '#FEF2F2', color: '#DC2626', cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
          {(safeLS('pba_clash_rules', []) || []).length === 0 && (
            <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center',
                        padding: '12px 0' }}>
              No clash rules defined. All subjects can be scheduled simultaneously.
            </p>
          )}
        </div>

        {/* Add new rule */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center',
                      flexWrap: 'wrap' }}>
          <select
            value={newClashA}
            onChange={e => setNewClashA(e.target.value)}
            style={{ padding: '8px 10px', border: '1px solid #D1D5DB',
                     borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}
          >
            <option value="">Subject A</option>
            {subjectOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>
            cannot clash with
          </span>
          <select
            value={newClashB}
            onChange={e => setNewClashB(e.target.value)}
            style={{ padding: '8px 10px', border: '1px solid #D1D5DB',
                     borderRadius: '8px', fontSize: '13px', minWidth: '160px' }}
          >
            <option value="">Subject B</option>
            {subjectOptions.filter(s => s !== newClashA).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={handleAddClashRule}
            disabled={!newClashA || !newClashB || newClashA === newClashB}
            style={{
              padding: '8px 18px', fontSize: '13px', fontWeight: 700,
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              background: (!newClashA || !newClashB || newClashA === newClashB)
                ? '#D1D5DB' : '#2563EB',
              color: '#ffffff'
            }}
          >
            + Add Rule
          </button>
        </div>
      </div>
    )}
  </div>

════════════════════════════════════════════════════════════════
PART B — Clash detection when scheduling / editing an exam
════════════════════════════════════════════════════════════════

ADD this helper function inside the component:

  const detectClashes = (subject, date, startTime, endTime, excludeExamId = null) => {
    // Returns array of clashing exam objects
    const rules = safeLS('pba_clash_rules', []);
    const allExams = safeLS('pba_exams', []);   // or whatever key stores exams

    // Find subjects that the given subject clashes with
    const forbiddenPartners = (rules || [])
      .filter(r => r.subjectA === subject || r.subjectB === subject)
      .map(r => r.subjectA === subject ? r.subjectB : r.subjectA);

    if (forbiddenPartners.length === 0) return [];

    // Find exams on the same date with a forbidden subject that overlap in time
    return (allExams || []).filter(exam => {
      if (exam.id === excludeExamId) return false;      // skip self (edit mode)
      if (exam.date !== date) return false;             // different date — no clash
      if (!forbiddenPartners.includes(exam.subject)) return false; // not forbidden

      // Check time overlap
      // Overlap if: startA < endB AND endA > startB
      const aStart = startTime || '00:00';
      const aEnd   = endTime   || '23:59';
      const bStart = exam.startTime || '00:00';
      const bEnd   = exam.endTime   || '23:59';
      return aStart < bEnd && aEnd > bStart;
    });
  };

In the exam CREATE/EDIT modal or form, call detectClashes whenever
subject, date, startTime, or endTime changes:

  // Inside the modal state or derived value:
  const clashWarnings = detectClashes(
    examForm.subject,
    examForm.date,
    examForm.startTime,
    examForm.endTime,
    examForm.id || null   // null for new exams
  );

RENDER a warning banner inside the modal when clashWarnings.length > 0:

  {clashWarnings.length > 0 && (
    <div style={{
      background: '#FEF3C7',
      border: '1px solid #F59E0B',
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '16px'
    }}>
      <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400E',
                    marginBottom: '6px' }}>
        ⚠️ Subject Clash Detected
      </div>
      {clashWarnings.map((clash, i) => (
        <div key={i} style={{ fontSize: '13px', color: '#78350F', marginBottom: '2px' }}>
          • <strong>{examForm.subject}</strong> clashes with{' '}
          <strong>{clash.subject}</strong>
          {clash.batchName ? ` (${clash.batchName})` : ''}{' '}
          at {clash.startTime}–{clash.endTime}
        </div>
      ))}
      <div style={{ fontSize: '12px', color: '#B45309', marginTop: '8px' }}>
        Students taking both subjects will face simultaneous exams.
        Adjust the date or time to resolve.
      </div>
    </div>
  )}

IMPORTANT: Do NOT block saving — show the warning but still allow
the admin to save if they choose to override. The warning is advisory,
not a hard block.

════════════════════════════════════════════════════════════════
ALSO: Show clash indicators on the exam schedule/list view
════════════════════════════════════════════════════════════════

When rendering the exam list or timetable, compute clashes for ALL
exams and mark any affected rows with a ⚠️ badge:

  const computeAllClashes = () => {
    const allExams = safeLS('pba_exams', []) || [];
    const rules    = safeLS('pba_clash_rules', []) || [];
    const clashedIds = new Set();

    allExams.forEach((exam, i) => {
      const partners = rules
        .filter(r => r.subjectA === exam.subject || r.subjectB === exam.subject)
        .map(r => r.subjectA === exam.subject ? r.subjectB : r.subjectA);

      allExams.forEach((other, j) => {
        if (i === j) return;
        if (other.date !== exam.date) return;
        if (!partners.includes(other.subject)) return;
        const aStart = exam.startTime  || '00:00';
        const aEnd   = exam.endTime    || '23:59';
        const bStart = other.startTime || '00:00';
        const bEnd   = other.endTime   || '23:59';
        if (aStart < bEnd && aEnd > bStart) {
          clashedIds.add(exam.id);
          clashedIds.add(other.id);
        }
      });
    });
    return clashedIds;
  };

  const clashedExamIds = computeAllClashes();

In each exam row, if clashedExamIds.has(exam.id), add a badge:

  {clashedExamIds.has(exam.id) && (
    <span style={{
      background: '#FEF3C7', color: '#92400E',
      border: '1px solid #F59E0B',
      borderRadius: '999px',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 700,
      marginLeft: '8px'
    }}>
      ⚠️ Clash
    </span>
  )}

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY the Examinations view file (ExaminationsView.jsx
   or wherever exams are scheduled)
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. Clash rules are BIDIRECTIONAL — A vs B = B vs A
5. Clash detection is by date + time overlap + forbidden subject pair
6. Saving is NOT blocked — warning is advisory only
7. Default rules seed ONLY if pba_clash_rules does not yet exist
8. The "Subject A" dropdown reads from pba_subjects for future-proofing
9. Run npm run build and confirm 0 errors
10. Then npm run deploy
11. List all files modified
```
