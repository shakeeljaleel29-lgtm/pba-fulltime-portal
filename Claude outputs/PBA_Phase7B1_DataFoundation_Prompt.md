# PBA Full-Time Portal — Phase 7B-1: Data Foundation & Subject Registry
## AntiGravity Prompt — Run this FIRST before 7B-2, 7B-3, or 7B-4

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Add a Subject Registry system to the PBA Portal. This is a data foundation prompt — it adds new localStorage data structures and a new Subject Registry UI in General Admin. Do NOT change the Examinations page yet. Do not break any existing functionality.

════════════════════════════════════════════════════════════════
PART 1 — NEW localStorage KEYS
════════════════════════════════════════════════════════════════

Add these new localStorage keys with seed data if they don't already exist.
Use the same read/write pattern as existing keys (JSON.parse / JSON.stringify).

──────────────────────────────────────────────────────────────
KEY: pba_subjects
──────────────────────────────────────────────────────────────
Array of subject objects. Initialize with:

[
  { id: 'subj-001', code: 'BIO', name: 'Biology', stream: 'Science', color: '#2F855A' },
  { id: 'subj-002', code: 'CHEM', name: 'Chemistry', stream: 'Science', color: '#2B6CB0' },
  { id: 'subj-003', code: 'PHY', name: 'Physics', stream: 'Science', color: '#6B46C1' },
  { id: 'subj-004', code: 'MATH', name: 'Mathematics', stream: 'Maths', color: '#C53030' },
  { id: 'subj-005', code: 'ACC', name: 'Accounting', stream: 'Commerce', color: '#D4A017' },
  { id: 'subj-006', code: 'BUS', name: 'Business Studies', stream: 'Commerce', color: '#D4A017' },
  { id: 'subj-007', code: 'ECON', name: 'Economics', stream: 'Commerce', color: '#B7791F' },
  { id: 'subj-008', code: 'ICT', name: 'ICT', stream: 'Technology', color: '#2B6CB0' }
]

Each subject object has:
  id: string (unique, prefix 'subj-')
  code: string (short abbreviation)
  name: string (full subject name)
  stream: string ('Science' | 'Commerce' | 'Arts' | 'Maths' | 'Technology' | 'Other')
  color: string (hex, for display chips)
  createdAt: ISO date string

──────────────────────────────────────────────────────────────
KEY: pba_batch_subjects
──────────────────────────────────────────────────────────────
Array mapping batches to their subjects:

[
  {
    id: 'bs-001',
    batchId: 'batch-001',       // references existing batch/student group
    batchName: 'Batch 2024-A (A/L Commerce)',
    subjectIds: ['subj-005', 'subj-006', 'subj-007'],
    branch: 'Kohuwala',
    createdAt: ISO date
  }
]

──────────────────────────────────────────────────────────────
KEY: pba_student_subjects
──────────────────────────────────────────────────────────────
Array for individual student subject enrollment (overrides batch defaults):

[
  {
    id: 'ss-001',
    studentId: string,         // references pba_students
    subjectId: string,         // references pba_subjects
    batchId: string,
    enrolledAt: ISO date,
    active: true
  }
]

──────────────────────────────────────────────────────────────
MODIFY: pba_exams (add new fields to existing exam objects)
──────────────────────────────────────────────────────────────
When creating new exams (do NOT change existing records), include these extra fields:
  subjectId: string           // which subject this exam is for
  subjectCode: string         // e.g. 'BIO'
  examNumber: number          // sequential: 1, 2, 3 ... within subject+batch
  totalMarks: number          // max marks (e.g. 100)
  passMark: number            // pass threshold (e.g. 50)
  status: 'draft' | 'published'  // default 'draft'
  publishedAt: ISO date or null

──────────────────────────────────────────────────────────────
MODIFY: pba_marks (restructure for per-student per-exam)
──────────────────────────────────────────────────────────────
Each marks entry should have:
  id: string
  examId: string              // references pba_exams
  studentId: string           // references pba_students
  subjectId: string
  batchId: string
  marksObtained: number | null   // null = absent
  isAbsent: boolean           // true if student was absent
  grade: string               // auto-calculated: A/B/C/D/F
  remarks: string             // optional lecturer comment
  enteredBy: string           // lecturer/admin who entered
  enteredAt: ISO date
  updatedAt: ISO date

Grade calculation helper (use this function wherever grades are shown):
  const calcGrade = (marks, total) => {
    if (marks === null) return 'ABS';
    const pct = (marks / total) * 100;
    if (pct >= 75) return 'A';
    if (pct >= 65) return 'B';
    if (pct >= 55) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  };

Grade color helper:
  const gradeColor = (g) => ({
    'A': { bg: '#F0FFF4', color: '#2F855A', border: '#9AE6B4' },
    'B': { bg: '#EBF4FF', color: '#2B6CB0', border: '#90CDF4' },
    'C': { bg: '#FEF3C7', color: '#B7860A', border: '#F6D860' },
    'D': { bg: '#FFF5F5', color: '#C53030', border: '#FEB2B2' },
    'F': { bg: '#FFF5F5', color: '#C53030', border: '#FEB2B2' },
    'ABS': { bg: '#F7FAFC', color: '#718096', border: '#E2E8F0' },
  }[g] || { bg: '#F7FAFC', color: '#718096', border: '#E2E8F0' });

════════════════════════════════════════════════════════════════
PART 2 — SUBJECT REGISTRY UI (inside General Admin page)
════════════════════════════════════════════════════════════════

In the General Admin page (GeneralAdminView.jsx or equivalent), add a new
tab called "Subject Registry" to the existing tab group.

The Subject Registry tab contains:

1. HEADER ROW:
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
  <div>
    <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A202C', margin: 0 }}>
      Subject Registry
    </h3>
    <p style={{ fontSize: '12px', color: '#718096', margin: '2px 0 0' }}>
      Manage subjects offered across all batches and streams
    </p>
  </div>
  <button onClick={() => setShowAddSubject(true)} style={{
    padding: '9px 16px', background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
    color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px',
    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
    fontFamily: "'Inter',sans-serif", boxShadow: '0 2px 8px rgba(43,108,176,0.25)'
  }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    Add Subject
  </button>
</div>

2. SUBJECTS TABLE:
Display pba_subjects as a styled table (same table style as the rest of the portal):

Columns: Code | Subject Name | Stream | Color | Actions (Edit / Delete)

Each row shows:
- Code chip: styled as <span style={{ background: subject.color + '20', color: subject.color, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>{subject.code}</span>
- Subject name in bold 13px #1A202C
- Stream as a small grey chip
- Edit button (pencil icon, ghost style) and Delete button (trash icon, red ghost)

3. ADD / EDIT SUBJECT MODAL:
Triggered by "Add Subject" button or Edit icon.

Fields:
  - Subject Code (input, e.g. "BIO")
  - Subject Name (input, e.g. "Biology")
  - Stream (select: Science / Commerce / Arts / Maths / Technology / Other)
  - Color (select or color input — offer 8 preset hex colors as clickable swatches)

On Save: push new object to pba_subjects with generated id ('subj-' + Date.now()) and createdAt.
On Edit: update the matching object in pba_subjects by id.
On Delete: remove from pba_subjects (with confirmation).

4. BATCH-SUBJECT ASSIGNMENT SECTION (below the subjects table):

Heading: "Batch → Subject Assignments"
Subheading: "Configure which subjects each batch studies"

Display pba_batch_subjects as a simple list of cards, one per batch entry:
Each card shows:
  - Batch name (bold)
  - Branch chip
  - Subject chips (one per assigned subject, colored by subject.color)
  - Edit button to modify the subject list for that batch

"Assign Subjects to Batch" button → modal with:
  - Batch selector (dropdown of existing batches/groups from pba_students or existing batch list)
  - Multi-select checklist of all subjects from pba_subjects
  - Branch auto-filled from batch
  - Save → upsert into pba_batch_subjects

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change the Examinations page, Student pages, or Book Catalogue yet.
2. All new localStorage writes must use the same try/catch pattern as existing data writes.
3. The calcGrade and gradeColor helpers should be defined in a shared location or repeated in each file that needs them.
4. List which files were modified.
```
