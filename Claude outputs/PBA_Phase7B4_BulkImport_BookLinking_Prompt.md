# PBA Full-Time Portal — Phase 7B-4: Bulk Import + Textbook-Subject Linking
## AntiGravity Prompt — Run AFTER Phase 7B-1

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Add three features: (1) bulk student import via CSV, (2) bulk lecturer import via CSV, (3) textbook-to-subject-to-batch linking with individual student book issue tracking. Do NOT change Examinations or Report Card pages.

Assume SheetJS is available: import XLSX from 'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js'
Load it lazily (only when user triggers an import action).

════════════════════════════════════════════════════════════════
PART 1 — BULK STUDENT IMPORT (StudentManagementView.jsx or equivalent)
════════════════════════════════════════════════════════════════

Add an "Import Students" button next to the existing "Register New Student" button.
Style as ghost button:
  padding '9px 16px', background '#FFFFFF', border '1.5px solid #E3E6EA', borderRadius '8px',
  fontSize '13px', fontWeight 600, color '#4A5568', cursor 'pointer',
  display 'flex', alignItems 'center', gap '7px', fontFamily "'Inter',sans-serif"

Icon: upload SVG (arrow pointing up from a box)

When clicked, open a "Bulk Import Students" modal:

MODAL STEP 1 — Upload & Preview:
  Title: "Bulk Import Students"
  Subtitle: "Upload a CSV or Excel file with student records"

  TEMPLATE DOWNLOAD BUTTON (secondary, small):
  onClick generates and downloads a CSV with these exact headers:
    Full Name, Date of Birth (YYYY-MM-DD), Gender (Male/Female/Other),
    NIC / Passport, Phone, Parent/Guardian Phone, Email,
    Branch (Kohuwala/Wattala/Panadura), Batch Name,
    Subjects (semicolon-separated e.g. Biology;Chemistry;Physics),
    Notes

  FILE INPUT:
  <label style={{ display: 'block', border: '2px dashed #CBD5E0', borderRadius: '10px',
    padding: '28px', textAlign: 'center', cursor: 'pointer', background: '#F8F9FB',
    transition: 'border-color 0.15s' }}>
    <svg>/* upload cloud icon, 32px, #718096 */</svg>
    <div style={{ fontSize: '13px', color: '#4A5568', marginTop: '10px', fontWeight: 600 }}>
      Click to upload CSV or Excel file
    </div>
    <div style={{ fontSize: '11px', color: '#A0AEC0', marginTop: '4px' }}>
      Supported: .csv, .xlsx, .xls
    </div>
    <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleFileUpload} />
  </label>

  After file is selected, parse it (CSV with split or SheetJS for Excel) and show:

  PREVIEW TABLE:
  Shows first 10 rows with columns: Name | DOB | Branch | Batch | Subjects | Status
  Status column:
    - Green "Ready" badge if all required fields present and valid
    - Amber "Warning" badge with tooltip if optional fields missing
    - Red "Error" badge if Name or Branch is missing

  Summary line above table:
  "{total} records found — {ready} ready to import, {errors} with errors"

  MODAL FOOTER:
    "Cancel" ghost button
    "Import {ready} Students" primary blue button (disabled if errors > 0)
    Or: "Import anyway (skip errors)" amber button if some errors exist

MODAL STEP 2 — Confirmation:
  After import, show:
  "✓ {count} students imported successfully"
  "✗ {errorCount} rows skipped (download error log)"
  "Close" button

IMPORT LOGIC:
For each valid row:
  1. Check if student with same NIC or (Name + DOB) already exists in pba_students → skip with "duplicate" error
  2. If not duplicate, create new student object with:
     { id: 'stu-' + Date.now() + Math.random(), name, dob, gender, nic, phone, parentPhone, email,
       branch, batch: batchName, enrolledAt: new Date().toISOString(), status: 'Active',
       registeredBy: currentUser.name, importedVia: 'csv' }
  3. Push to pba_students
  4. For each subject in the Subjects column: create entry in pba_student_subjects

════════════════════════════════════════════════════════════════
PART 2 — BULK LECTURER IMPORT (LecturerManagementView.jsx or equivalent)
════════════════════════════════════════════════════════════════

Add an "Import Lecturers" button next to "Add Lecturer". Same ghost button style as above.

Template CSV headers:
  Full Name, Phone, Email, Branch (Kohuwala/Wattala/Panadura/All),
  Subjects They Teach (semicolon-separated), Qualification, Notes, Employment Type (Full-time/Part-time/Visiting)

Same modal flow as student import:
  Step 1: Upload + Preview
  Step 2: Confirmation

Import logic creates lecturer objects in pba_users or the lecturer data store (wherever lecturers are currently stored):
  { id: 'lec-' + Date.now(), name, phone, email, branch, subjects (array), qualification,
    employmentType, role: 'Lecturer', importedVia: 'csv', createdAt: ISO date }

Duplicate check: same name + phone already exists → skip.

════════════════════════════════════════════════════════════════
PART 3 — TEXTBOOK-SUBJECT-BATCH LINKING (BookManagementView.jsx or equivalent)
════════════════════════════════════════════════════════════════

──────────────────────────────────────────────────────────────
3A. NEW localStorage KEY: pba_book_issues
──────────────────────────────────────────────────────────────
Array of individual book issue records:
{
  id: 'bi-' + Date.now(),
  bookId: string,          // references pba_books / textbook catalogue
  bookTitle: string,
  studentId: string,
  studentName: string,
  batchId: string,
  batchName: string,
  subjectId: string,       // which subject this book is for
  issuedAt: ISO date,
  dueDate: ISO date or null,
  returnedAt: ISO date or null,
  condition: 'Good' | 'Fair' | 'Damaged',
  issuedBy: string,        // staff name
  notes: string
}

──────────────────────────────────────────────────────────────
3B. MODIFY TEXTBOOK CATALOGUE (Add New Textbook modal)
──────────────────────────────────────────────────────────────
In the Add/Edit Textbook modal, add these new fields below the existing ones:

  SUBJECT ASSOCIATION:
  Label: "Associated Subject"
  <select> options from pba_subjects — "Select subject..." + each subject name </select>
  Stores as: book.subjectId and book.subjectCode

  APPLICABLE BATCHES:
  Label: "Applicable Batches"
  Multi-select checklist (checkboxes) showing all batch names from pba_batch_subjects
  Stores as: book.applicableBatches = [batchId, ...]

In the Textbook Catalogue table, add two new columns:
  - "Subject" column: show subject chip (colored by subject.color, shows subject.code)
  - "Batches" column: show batch chips (small blue chips for each applicable batch)

──────────────────────────────────────────────────────────────
3C. STUDENT BOOK ISSUES TAB (already exists — enhance it)
──────────────────────────────────────────────────────────────
The "Student Book Issues" tab currently exists but is likely basic.
Replace or enhance it:

FILTER ROW:
  - Branch filter
  - Batch filter
  - Subject filter (from pba_subjects)
  - Status filter: All / Currently Issued / Returned / Overdue

ISSUE BOOK BUTTON: "+ Issue Book to Student" (blue primary, top right)

ISSUE BOOK MODAL:
Fields:
  - Student selector (searchable dropdown — search by name or ID from pba_students)
  - Book selector (dropdown from pba_books, filtered by subject if student's subjects known)
  - Subject auto-filled from book.subjectId (but editable)
  - Issue Date (date input, default today)
  - Due Date (date input)
  - Condition at issue: Good / Fair / Damaged (select)
  - Notes (textarea)
On save → push to pba_book_issues

ISSUES TABLE:
Columns: Student | Book Title | Subject | Batch | Issued On | Due Date | Status | Actions

Status badge:
  - "Issued" (blue) if returnedAt is null and dueDate is in the future
  - "Overdue" (red) if returnedAt is null and dueDate has passed
  - "Returned" (green) if returnedAt is set

Actions:
  - "Mark Returned" button → sets returnedAt to today, opens condition-at-return selector
  - View icon → shows full issue details

SUMMARY TILES at top of tab (4 tiles):
  1. Total Books Issued (currently out): count where returnedAt is null
  2. Overdue: count where returnedAt is null and dueDate passed
  3. Returned This Month: count
  4. Students with Books: distinct student count

──────────────────────────────────────────────────────────────
3D. LOW STOCK ALERTS (Textbook Catalogue tab)
──────────────────────────────────────────────────────────────
In the Textbook Catalogue table, if a book's stock count is ≤ 10:
  Show a "Low Stock" amber badge next to the stock number:
  <span style={{ background: '#FEF3C7', color: '#B7860A', border: '1px solid #F6D860',
    fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' }}>
    Low Stock
  </span>

If stock is 0:
  Show "Out of Stock" red badge instead:
  <span style={{ background: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2',
    fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' }}>
    Out of Stock
  </span>

Also add a summary alert banner at the top of the Textbook Catalogue tab if ANY book has stock ≤ 10:
<div style={{ background: '#FEF3C7', border: '1px solid #F6D860', borderRadius: '8px',
  padding: '10px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
  <svg>/* warning triangle, 16px, #D4A017 */</svg>
  <span style={{ fontSize: '13px', color: '#92600A', fontWeight: 600 }}>
    {lowStockCount} book{lowStockCount !== 1 ? 's are' : ' is'} running low on stock.
    Consider creating a print requisition.
  </span>
</div>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. SheetJS must be loaded lazily — only import it when the user triggers a CSV/Excel import.
2. All new data writes use the same localStorage pattern (JSON.parse / JSON.stringify with try/catch).
3. The "Import Students" and "Import Lecturers" modals must show a clear preview before committing — never write to localStorage until the user clicks Confirm.
4. Do NOT change Examinations, Report Card, or General Admin Subject Registry pages.
5. List all files modified.
```
