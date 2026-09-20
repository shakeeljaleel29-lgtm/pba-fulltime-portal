# PBA Full-Time Portal — Phase 7B-1b: Lecturer + Assistant Model
## AntiGravity Prompt — Addendum to Phase 7B-1 (apply immediately after 7B-1)

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
This is an addendum to the Phase 7B-1 data foundation. It updates the batch-subject structure to support a main lecturer and an optional assistant lecturer per subject per batch. Some subjects have both (assistant teaches a second class per week); others only have the main lecturer. Do not change Examinations, Student, or Fee pages.

════════════════════════════════════════════════════════════════
PART 1 — UPDATE pba_batch_subjects STRUCTURE
════════════════════════════════════════════════════════════════

Each entry in pba_batch_subjects must now support per-subject lecturer assignments
(not just a list of subjectIds). Replace the simple subjectIds array with a
subjectAssignments array of objects:

Old structure (remove):
  subjectIds: ['subj-001', 'subj-002']

New structure (replace with):
  subjectAssignments: [
    {
      subjectId: 'subj-001',
      subjectName: 'Biology',
      subjectCode: 'BIO',
      mainLecturerId: string or null,       // references pba_users (Lecturer role)
      mainLecturerName: string or null,
      assistantLecturerId: string or null,  // null if no assistant
      assistantLecturerName: string or null,
      hasAssistant: boolean,                // true if assistantLecturerId is set
      classesPerWeek: number,               // 1 if no assistant, 2 if assistant present
      classSchedule: [
        // one entry per weekly class slot for this subject
        {
          slotId: string,
          classNumber: 1 | 2,              // 1 = main lecturer's class, 2 = assistant's class
          dayOfWeek: string,               // 'Monday' | 'Tuesday' | etc.
          startTime: string,               // '09:00'
          endTime: string,                 // '11:00'
          venue: string,                   // classroom/hall
          taughtBy: 'main' | 'assistant'
        }
      ]
    }
  ]

Migration: if pba_batch_subjects already has entries with the old subjectIds array,
convert each subjectId into a subjectAssignment object with null lecturer fields and
hasAssistant: false.

════════════════════════════════════════════════════════════════
PART 2 — UPDATE SUBJECT REGISTRY UI (General Admin → Subject Registry tab)
════════════════════════════════════════════════════════════════

In the "Batch → Subject Assignments" section of the Subject Registry tab,
update the "Assign Subjects to Batch" modal and the assignment cards:

ASSIGNMENT CARD (one per batch entry — currently shows batch + subject chips):
Replace each subject chip with an expandable subject row that shows:

<div style={{
  background: '#F8F9FB', border: '1px solid #E3E6EA', borderRadius: '8px',
  padding: '10px 14px', marginBottom: '6px'
}}>
  {/* Subject identity */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
    <span style={{ background: subjectColor + '20', color: subjectColor,
      fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>
      {subject.code}
    </span>
    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A202C' }}>{subject.name}</span>
    {assignment.hasAssistant && (
      <span style={{ background: '#EBF4FF', color: '#2B6CB0', fontSize: '10px',
        fontWeight: 700, padding: '2px 7px', borderRadius: '4px' }}>
        2 classes/week
      </span>
    )}
  </div>

  {/* Lecturer assignment row */}
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

    {/* Main Lecturer */}
    <div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#718096',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
        Main Lecturer
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%',
          background: '#EBF4FF', display: 'flex', alignItems: 'center',
          justifyContent: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="#2B6CB0" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <span style={{ fontSize: '13px', color: '#1A202C', fontWeight: 600 }}>
          {assignment.mainLecturerName || 'Not assigned'}
        </span>
      </div>
    </div>

    {/* Assistant Lecturer */}
    <div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#718096',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
        Assistant Lecturer
      </div>
      {assignment.hasAssistant ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%',
            background: '#FEF3C7', display: 'flex', alignItems: 'center',
            justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="#D4A017" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span style={{ fontSize: '13px', color: '#1A202C', fontWeight: 600 }}>
            {assignment.assistantLecturerName}
          </span>
        </div>
      ) : (
        <span style={{ fontSize: '12px', color: '#A0AEC0', fontStyle: 'italic' }}>
          No assistant
        </span>
      )}
    </div>
  </div>
</div>

EDIT SUBJECT ASSIGNMENT MODAL:
When the user clicks Edit on a batch assignment card, open a modal with:

For each subject in the batch, show a section:

  Subject header (code chip + name)

  MAIN LECTURER field:
  <select value={assignment.mainLecturerId} onChange={...}>
    <option value="">Select main lecturer...</option>
    {lecturers.map(l => <option value={l.id}>{l.name}</option>)}
  </select>

  HAS ASSISTANT toggle:
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
    margin: '10px 0' }}>
    <input type="checkbox"
      checked={assignment.hasAssistant}
      onChange={e => {
        setHasAssistant(e.target.checked);
        if (!e.target.checked) {
          setAssistantId(null);
          setAssistantName(null);
        }
      }}
    />
    <span style={{ fontSize: '13px', color: '#1A202C', fontWeight: 600 }}>
      This subject has an assistant lecturer (2 classes per week)
    </span>
  </label>

  ASSISTANT LECTURER field (only shown if hasAssistant is true):
  <select value={assignment.assistantLecturerId} onChange={...}
    style={{ /* same select style */ }}>
    <option value="">Select assistant lecturer...</option>
    {lecturers
      .filter(l => l.id !== assignment.mainLecturerId)  // can't be same as main
      .map(l => <option value={l.id}>{l.name}</option>)}
  </select>

  Note below assistant selector (only when hasAssistant is true):
  <p style={{ fontSize: '11px', color: '#718096', margin: '4px 0 0' }}>
    Main lecturer teaches Class 1 each week; assistant teaches Class 2.
  </p>

  Horizontal divider between subjects in the modal.

On Save: update the pba_batch_subjects entry with mainLecturerId, mainLecturerName,
assistantLecturerId, assistantLecturerName, hasAssistant, and classesPerWeek.

════════════════════════════════════════════════════════════════
PART 3 — UPDATE LECTURERS PAGE (availability grid + syllabus tracker)
════════════════════════════════════════════════════════════════

In the Lecturers page (LecturerManagementView.jsx or equivalent):

A. LECTURER DETAIL / PROFILE CARD:
When viewing a lecturer's detail (clicking a lecturer in the table), add a
"Teaching Assignments" section showing which subjects + batches they're assigned to,
and in what role:

Read from pba_batch_subjects — search all subjectAssignments where
mainLecturerId === lecturer.id OR assistantLecturerId === lecturer.id.

Display as a table:
Columns: Subject | Batch | Branch | Role | Classes/Week

Role column:
  Main Lecturer → <span style={{ background: '#EBF4FF', color: '#2B6CB0', fontSize: '11px',
    fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>Main Lecturer</span>
  Assistant → <span style={{ background: '#FEF3C7', color: '#B7860A', fontSize: '11px',
    fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>Assistant</span>

Classes/Week column: "1 class/week" or "2 classes/week" (the batch total, not this lecturer's)
For the assistant specifically add: "(teaches Class 2)"
For the main lecturer on a 2-class subject: "(teaches Class 1)"

B. AVAILABILITY GRID:
The weekly availability grid should differentiate class slots by role:

For time slots where this lecturer is the MAIN lecturer:
  background: '#EBF4FF', border: '1.5px solid #90CDF4', color: '#2B6CB0'
  Show: "{subject.code} — Class 1\n{batch}"

For time slots where this lecturer is the ASSISTANT:
  background: '#FEF3C7', border: '1.5px solid #F6D860', color: '#B7860A'
  Show: "{subject.code} — Class 2 (Asst)\n{batch}"

Add a legend below the grid:
<div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <div style={{ width: '12px', height: '12px', borderRadius: '3px',
      background: '#EBF4FF', border: '1.5px solid #90CDF4' }} />
    <span style={{ fontSize: '11px', color: '#4A5568' }}>Main Lecturer (Class 1)</span>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <div style={{ width: '12px', height: '12px', borderRadius: '3px',
      background: '#FEF3C7', border: '1.5px solid #F6D860' }} />
    <span style={{ fontSize: '11px', color: '#4A5568' }}>Assistant (Class 2)</span>
  </div>
</div>

C. SYLLABUS TRACKER:
The syllabus progress tracker (if it shows progress by subject per lecturer)
should now show two rows per subject if the lecturer teaches it in two different
roles across different batches (e.g., main for Batch A, assistant for Batch B):

Each row label:
  Main role → "{subject.name} — {batchName}"
  Assistant role → "{subject.name} — {batchName} (Assistant)"

════════════════════════════════════════════════════════════════
PART 4 — EXAM ENTRY PERMISSIONS (minor update)
════════════════════════════════════════════════════════════════

When the Mark Entry tab (from Phase 7B-2) checks who is allowed to enter marks
for an exam, both the main lecturer AND the assistant for that subject+batch
should be permitted to enter marks (not just the main lecturer).

The check should be:
  const canEnterMarks = (
    currentUser.role === 'Admin' ||
    currentUser.role === 'Branch Coordinator' ||
    assignment.mainLecturerId === currentUser.id ||
    assignment.assistantLecturerId === currentUser.id
  );

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. An assistant is always optional — if hasAssistant is false, assistantLecturerId and
   assistantLecturerName remain null. Never show an empty assistant slot as an error.
2. The main and assistant lecturer cannot be the same person — enforce this in the
   dropdown (filter out the selected main lecturer from the assistant options).
3. A lecturer can be main on some subjects and assistant on others (even simultaneously).
4. Do not change Examinations, Student, Fee Management, or Book Catalogue pages.
5. List all files modified.
```
