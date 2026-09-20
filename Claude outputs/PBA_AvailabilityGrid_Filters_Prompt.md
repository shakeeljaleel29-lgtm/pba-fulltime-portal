# PBA Full-Time Portal — Availability Grid Filter Row
## AntiGravity Prompt — Surgical Fix (Lecturers → Availability Grid tab)

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Add filter controls to the Weekly Lecturer Availability Grid. Do not change any other tab or page. Do not change the grid layout, slot styling, or legend.

════════════════════════════════════════════════════════════════
CHANGE — ADD FILTER ROW ABOVE THE AVAILABILITY GRID TABLE
════════════════════════════════════════════════════════════════

In the Availability Grid tab (LecturerManagementView.jsx or equivalent),
add the following state variables at the top of the component (or inside the
tab's render block):

  const [filterLecturer, setFilterLecturer] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterBatch, setFilterBatch] = useState('');

Add this filter row ABOVE the grid table (below the "Weekly Lecturer Availability Grid" heading row):

<div style={{
  display: 'flex',
  gap: '10px',
  marginBottom: '16px',
  flexWrap: 'wrap',
  alignItems: 'center'
}}>

  {/* Lecturer filter */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{
      fontSize: '10px', fontWeight: 700, color: '#718096',
      textTransform: 'uppercase', letterSpacing: '0.5px'
    }}>Lecturer</label>
    <select
      value={filterLecturer}
      onChange={e => setFilterLecturer(e.target.value)}
      style={{
        padding: '7px 32px 7px 11px',
        background: '#FFFFFF',
        border: '1.5px solid #E3E6EA',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#1A202C',
        outline: 'none',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        cursor: 'pointer',
        minWidth: '160px'
      }}
      onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
    >
      <option value="">All Lecturers</option>
      {/* Derive unique lecturers from the grid data */}
      {uniqueLecturers.map(l => (
        <option key={l.id} value={l.id}>{l.name}</option>
      ))}
    </select>
  </div>

  {/* Subject filter */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{
      fontSize: '10px', fontWeight: 700, color: '#718096',
      textTransform: 'uppercase', letterSpacing: '0.5px'
    }}>Subject</label>
    <select
      value={filterSubject}
      onChange={e => setFilterSubject(e.target.value)}
      style={{ /* same select style as above */ minWidth: '160px' }}
      onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
    >
      <option value="">All Subjects</option>
      {/* Derive unique subject names from the grid data */}
      {uniqueSubjects.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  </div>

  {/* Batch filter */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{
      fontSize: '10px', fontWeight: 700, color: '#718096',
      textTransform: 'uppercase', letterSpacing: '0.5px'
    }}>Batch</label>
    <select
      value={filterBatch}
      onChange={e => setFilterBatch(e.target.value)}
      style={{ /* same select style as above */ minWidth: '160px' }}
      onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
    >
      <option value="">All Batches</option>
      {/* Derive unique batch names from the grid data */}
      {uniqueBatches.map(b => (
        <option key={b} value={b}>{b}</option>
      ))}
    </select>
  </div>

  {/* Clear filters button — only shown when any filter is active */}
  {(filterLecturer || filterSubject || filterBatch) && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '10px', color: 'transparent' }}>Clear</label>
      <button
        onClick={() => { setFilterLecturer(''); setFilterSubject(''); setFilterBatch(''); }}
        style={{
          padding: '7px 14px',
          background: '#FFFFFF',
          border: '1.5px solid #E3E6EA',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#718096',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Clear
      </button>
    </div>
  )}

</div>

════════════════════════════════════════════════════════════════
FILTER LOGIC — HOW TO FILTER THE GRID ROWS
════════════════════════════════════════════════════════════════

The grid currently shows one row per lecturer. Apply filtering as follows:

1. Derive the unique values for each dropdown from the raw grid data
   (all lecturers, all subjects, all batches currently in the schedule).

2. Filter the rows (lecturer rows) shown in the grid:

   const filteredGridRows = gridRows.filter(row => {
     // Lecturer filter: match by lecturer id or name
     if (filterLecturer && row.lecturerId !== filterLecturer) return false;

     // Subject + Batch filter: a lecturer row passes if they have AT LEAST
     // ONE slot matching the active subject/batch filters
     const hasMatchingSlot = row.slots.some(slot => {
       const subjectMatch = !filterSubject || slot.subjectName === filterSubject;
       const batchMatch = !filterBatch || slot.batchName === filterBatch;
       return subjectMatch && batchMatch;
     });
     if (!hasMatchingSlot) return false;

     return true;
   });

3. Within each visible lecturer row, also filter the SLOTS shown per day:
   Only render slots where:
     - slot.subjectName matches filterSubject (if set)
     - slot.batchName matches filterBatch (if set)
   (The lecturer filter applies at the row level, not slot level.)

4. If filterSubject or filterBatch is active and a day cell has no matching
   slots after filtering, show the cell as a grey "Free Slot" placeholder
   (same as the existing empty slot style).

5. If no rows match the combined filters, show:
   <div style={{
     textAlign: 'center', padding: '40px 20px', color: '#A0AEC0'
   }}>
     <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="#CBD5E0" strokeWidth="1.5" style={{ marginBottom: '10px' }}>
       <circle cx="11" cy="11" r="8"/>
       <line x1="21" y1="21" x2="16.65" y2="16.65"/>
     </svg>
     <div style={{ fontSize: '13px', fontWeight: 600 }}>No schedules match the selected filters</div>
     <div style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting or clearing the filters</div>
   </div>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any other tab (Profiles, Leave Requests, Syllabus Tracker).
2. Do NOT change the grid slot styling, column layout, or legend.
3. The filter dropdowns use the standard portal select style (white bg, 1.5px
   border #E3E6EA, 8px radius, SVG arrow, blue focus ring).
4. When all three filters are empty ("All Lecturers / All Subjects / All Batches"),
   the grid renders exactly as it does today — no rows hidden.
5. List which files were modified.
```
