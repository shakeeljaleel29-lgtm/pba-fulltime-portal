# PBA Full-Time Portal — Fix: Student Profile Missing Fields (Enrolled Date + Personal Info)
## AntiGravity Prompt

---

```
The Student Profile Overview tab redesign looks good but has two
data gaps:
  1. ENROLLED stat tile shows "N/A" instead of the enrollment date
  2. Personal Information card only shows phones — Branch, DOB,
     and Email are missing

Touch ONLY StudentManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
FIX 1 — Enrollment date "N/A": read ALL possible field names
════════════════════════════════════════════════════════════════

Student records in pba_students may store the enrollment date under
any of these field names (different students may use different keys
depending on when they were added):

  student.enrollmentDate
  student.enrolledDate
  student.enrollDate
  student.dateEnrolled
  student.startDate
  student.admissionDate
  student.createdAt      ← fallback: when the record was created

Read them all with a fallback chain:

  const rawEnrollDate =
    student.enrollmentDate  ||
    student.enrolledDate    ||
    student.enrollDate      ||
    student.dateEnrolled    ||
    student.startDate       ||
    student.admissionDate   ||
    student.createdAt       ||
    null;

Then format it for display:

  const formatDate = (raw) => {
    if (!raw) return 'N/A';
    try {
      // Handle both ISO strings and YYYY-MM-DD strings safely
      const parts = String(raw).split('T')[0].split('-');
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        );
        return d.toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric'
        }); // → "08 Jan 2024"
      }
      return raw;
    } catch (_) {
      return raw || 'N/A';
    }
  };

  // In the ENROLLED stat tile:
  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
    {formatDate(rawEnrollDate)}
  </div>

════════════════════════════════════════════════════════════════
FIX 2 — Personal Information: read ALL possible field names
════════════════════════════════════════════════════════════════

Student records use inconsistent field names for branch, DOB, and
email. Read every possible variant before giving up:

  const studentBranch =
    student.branch || student.branchName || student.campus || '';

  const studentDOB =
    student.dateOfBirth || student.dob || student.birthDate ||
    student.birthdate   || student.birthday || null;

  const studentEmail =
    student.email || student.emailAddress ||
    student.studentEmail || '';

  const studentPhone =
    student.phone     || student.studentPhone ||
    student.phoneNo   || student.mobile || student.mobileNo || '';

  const parentPhone =
    student.parentPhone   || student.guardianPhone ||
    student.parentMobile  || student.motherPhone ||
    student.fatherPhone   || '';

Add Branch, DOB (with age), and Email as rows in the Personal
Information card. Each row is only rendered when the value is
non-empty — skip blank rows entirely:

  // Branch row
  {studentBranch && (
    <div style={fieldRowStyle}>
      <span style={iconStyle}>📍</span>
      <span style={labelStyle}>Branch</span>
      <span style={valueStyle}>{studentBranch}</span>
    </div>
  )}

  // Date of Birth row (with age)
  {studentDOB && (() => {
    const parts = String(studentDOB).split('T')[0].split('-');
    if (parts.length < 3) return null;
    const dob = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear()
      - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    const formatted = dob.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    return (
      <div style={fieldRowStyle}>
        <span style={iconStyle}>🎂</span>
        <span style={labelStyle}>Date of Birth</span>
        <span style={valueStyle}>{formatted} (Age {age})</span>
      </div>
    );
  })()}

  // Email row
  {studentEmail && (
    <div style={fieldRowStyle}>
      <span style={iconStyle}>✉️</span>
      <span style={labelStyle}>Email</span>
      <span style={valueStyle}>{studentEmail}</span>
    </div>
  )}

  // Student Phone row
  {studentPhone && (
    <div style={fieldRowStyle}>
      <span style={iconStyle}>📱</span>
      <span style={labelStyle}>Student Phone</span>
      <span style={valueStyle}>{studentPhone}</span>
    </div>
  )}

  // Parent Phone row
  {parentPhone && (
    <div style={fieldRowStyle}>
      <span style={iconStyle}>📱</span>
      <span style={labelStyle}>Parent Phone</span>
      <span style={valueStyle}>{parentPhone}</span>
    </div>
  )}

  // Enrollment Date row
  {rawEnrollDate && (
    <div style={fieldRowStyle}>
      <span style={iconStyle}>📅</span>
      <span style={labelStyle}>Enrolled</span>
      <span style={valueStyle}>{formatDate(rawEnrollDate)}</span>
    </div>
  )}

Display order (top to bottom):
  Branch → Date of Birth → Student Phone → Parent Phone →
  Email → Enrolled

════════════════════════════════════════════════════════════════
FIX 3 — Hero banner batch chip: read enrolled batches
════════════════════════════════════════════════════════════════

The outer drawer header shows "No batch assigned" even when the
student is enrolled in a batch. The hero banner chip should show
the student's first enrolled batch name. Derive it from pba_batches:

  const studentId = (student.id || student.regNo || student.studentId || '').toString();
  const enrolledBatches = (safeLS('pba_batches', []) || [])
    .filter(b => (b.students || [])
      .some(s => (s.id || s.regNo || s.studentId || '').toString() === studentId)
    );
  const primaryBatch = enrolledBatches[0];
  const batchChipText = primaryBatch
    ? `${primaryBatch.name}${studentBranch ? ' · ' + studentBranch : ''}`
    : (studentBranch || 'No batch assigned');

Use batchChipText in the hero banner chip instead of hardcoding
any batch field from the student object directly.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY StudentManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. NEVER parse a date string with new Date("YYYY-MM-DD") directly
   — always split on "-" and use the 3-argument constructor
   new Date(year, month-1, day) to avoid UTC midnight shifts
5. Skip any personal info row where the value is falsy
   (null, undefined, empty string) — do not render blank rows
6. The ENROLLED tile falls back to "N/A" only when ALL field
   name variants return falsy — never crash on a missing field
7. Keep all other redesign elements unchanged (hero banner gradient,
   stat tiles, card layout, Academic Status, Enrolled Batches)
8. Run npm run build and confirm 0 errors
9. Then npm run deploy
10. List all files modified
```
