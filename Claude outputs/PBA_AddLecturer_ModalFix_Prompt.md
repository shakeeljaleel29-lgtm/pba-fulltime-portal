# PBA Full-Time Portal — Add Lecturer Modal Fix
## AntiGravity Prompt — Surgical Fix (Lecturers page only)

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Update the "Add New Lecturer Profile" modal in the Lecturers page. Do not change
any other page, tab, or data structure.

════════════════════════════════════════════════════════════════
WHAT TO CHANGE — ADD NEW LECTURER MODAL
════════════════════════════════════════════════════════════════

The current modal has only: Full Name, Subjects Taught (free text), Mobile, Email.

Replace / expand to the following fields in this order:

1. FULL NAME (keep as-is)
   <input type="text" placeholder="e.g. Dr. Amal Perera" />

2. BRANCH
   <select>
     <option value="">Select branch...</option>
     <option value="Kohuwala">Kohuwala</option>
     <option value="Wattala">Wattala</option>
     <option value="Panadura">Panadura</option>
     <option value="All">All Branches</option>
   </select>

3. EMPLOYMENT TYPE
   <select>
     <option value="">Select type...</option>
     <option value="Full-time">Full-time</option>
     <option value="Part-time">Part-time</option>
     <option value="Visiting">Visiting</option>
   </select>

4. SUBJECTS TAUGHT
   Replace the free-text input with a multi-select checklist derived from pba_subjects.
   Read pba_subjects from localStorage and render a scrollable checkbox list:

   <div style={{
     border: '1.5px solid #E3E6EA',
     borderRadius: '8px',
     maxHeight: '150px',
     overflowY: 'auto',
     padding: '8px 12px',
     background: '#FAFBFC'
   }}>
     {subjects.map(s => (
       <label key={s.id} style={{
         display: 'flex', alignItems: 'center', gap: '8px',
         padding: '5px 0', cursor: 'pointer',
         fontSize: '13px', color: '#1A202C'
       }}>
         <input
           type="checkbox"
           checked={selectedSubjectIds.includes(s.id)}
           onChange={() => toggleSubject(s.id)}
           style={{ accentColor: '#2B6CB0' }}
         />
         <span style={{
           background: s.color + '20', color: s.color,
           fontSize: '10px', fontWeight: 800,
           padding: '1px 6px', borderRadius: '10px', marginRight: '4px'
         }}>{s.code}</span>
         {s.name}
       </label>
     ))}
     {subjects.length === 0 && (
       <div style={{ fontSize: '12px', color: '#A0AEC0', padding: '4px 0' }}>
         No subjects found. Add subjects in General Admin → Subject Registry.
       </div>
     )}
   </div>

   Store as: lecturer.subjectIds = [array of selected subject ids]
             lecturer.subjects = [array of subject names, for display]

5. QUALIFICATION
   <input type="text" placeholder="e.g. BSc Accounting, CIMA" />

6. MOBILE NUMBER (keep as-is)

7. EMAIL ADDRESS (keep as-is)

8. NOTES (new, optional)
   <textarea rows={2} placeholder="Optional notes..." style={{ resize: 'vertical' }} />

════════════════════════════════════════════════════════════════
SAVE LOGIC UPDATE
════════════════════════════════════════════════════════════════

When saving the new lecturer, store this shape in pba_users (or wherever lecturers
are currently stored):

{
  id: 'lec-' + Date.now(),
  name,
  branch,
  employmentType,          // 'Full-time' | 'Part-time' | 'Visiting'
  subjectIds,              // array of pba_subjects ids
  subjects,                // array of subject names (for display)
  qualification,
  phone,
  email,
  notes,
  role: 'Lecturer',
  status: 'Active',
  createdAt: new Date().toISOString()
}

════════════════════════════════════════════════════════════════
FIELD STYLING (standard portal modal style)
════════════════════════════════════════════════════════════════

All labels:
  fontSize: '10px', fontWeight: 700, color: '#718096',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px'

All text inputs and selects:
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #E3E6EA', borderRadius: '8px',
  fontSize: '13px', color: '#1A202C', background: '#FFFFFF',
  fontFamily: "'Inter', sans-serif", outline: 'none',
  boxSizing: 'border-box'
  onFocus: borderColor '#2B6CB0', boxShadow '0 0 0 3px rgba(43,108,176,0.12)'
  onBlur: borderColor '#E3E6EA', boxShadow 'none'

Selects also get: appearance 'none', SVG dropdown arrow (same as portal standard)

Two-column layout for Branch + Employment Type side by side:
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px'

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Batch assignment is NOT done in this modal — it is handled through
   General Admin → Subject Registry → Batch Assignment (assign main/assistant
   lecturer per subject per batch). Do not add batch fields here.
2. Do NOT change the Lecturers table, tabs, or any other component.
3. List all files modified.
```
