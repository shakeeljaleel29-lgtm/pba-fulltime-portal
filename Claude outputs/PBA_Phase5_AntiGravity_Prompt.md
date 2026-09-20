# AntiGravity Prompt — PBA Full-Time Portal: Phase 5

This is Phase 5 of the PBA Full-Time Portal. All existing functionality from Phases 1–4 must remain unchanged. Add the following new features on top of what already exists. Use inline `style={{}}` JSX props for all new UI — do not rely on Tailwind CSS classes for layout-critical styles.

---

## Feature 1 — PDF Report Generation (Print-Ready Outputs)

Add a `generatePDF(content, title)` utility that opens a new browser window with a clean, print-styled HTML document and triggers `window.print()`. This avoids external PDF libraries.

### 1a — Fee Receipt PDF

In Fee Management, each fee payment record row must have a **Print Receipt** button (secondary style). When clicked, open a new window with this layout:

```
┌─────────────────────────────────────────┐
│  PBA PLATINUM BUSINESS ACADEMY          │
│  Official Fee Receipt                   │
├─────────────────────────────────────────┤
│  Receipt No: FEE-2024-0001              │
│  Date: 12 January 2025                  │
├─────────────────────────────────────────┤
│  Student Name:   Kasun Perera           │
│  Student ID:     STU-001                │
│  Branch:         Kohuwala               │
│  Programme:      AAT Foundation         │
├─────────────────────────────────────────┤
│  PAYMENT DETAILS                        │
│  Description      Amount    Status      │
│  Term 1 Fee    LKR 15,000   Paid        │
├─────────────────────────────────────────┤
│  TOTAL PAID:   LKR 15,000               │
├─────────────────────────────────────────┤
│  Received by:  ___________________      │
│  Signature:    ___________________      │
│                                         │
│  This is a computer-generated receipt.  │
└─────────────────────────────────────────┘
```

The new window HTML must use `@media print { body { margin: 0 } }` and auto-call `window.print()` on load. Use black-and-white styling only (no colour backgrounds in print output).

### 1b — Attendance Sheet PDF

In Lecturer Management → Attendance tab, add an **Export Attendance Sheet** button. When clicked, generate a print window with:
- Academy name and branch header
- Class name, date range, and lecturer name
- A table with columns: No. | Student Name | Student ID | [Date columns] | Total Present | Total Absent | %
- Each date column is 35px wide with P (present) / A (absent) cells
- Footer row showing overall class attendance percentage

### 1c — Class List PDF

In Student Management, add an **Export Class List** button (near the top filter area). Generate a print window showing:
- Header: PBA [Branch] — [Programme] — Class List — [Date]
- Table: No. | Student Name | Student ID | Contact No. | Parent Contact | Status
- Footer: Total Students: [N] | Active: [N] | Inactive: [N]

### 1d — Exam Results PDF

In Examinations, add a **Print Results** button per exam. Generate a print window showing:
- Exam name, subject, date, total marks
- Table: Rank | Student Name | Marks | Grade | Pass/Fail
- Footer: Class Average: [X] | Highest: [X] | Lowest: [X] | Pass Rate: [X]%

---

## Feature 2 — Analytics Dashboard (Charts using SVG)

Add a new sidebar item called **Analytics** between Dashboard and Lecturer Management. Use the same sidebar nav item style as existing items. Icon: 📈

The Analytics page has three sections, each in a white card (same card style as the rest of the system):

### 2a — Fee Collection Trend (Bar Chart)

A bar chart built with inline SVG showing monthly fee collection totals for the last 6 months. Each bar is a `<rect>` element. X-axis shows month names (Jul, Aug, Sep, Oct, Nov, Dec). Y-axis shows LKR amounts. Bars are `#2563EB`. Add a value label above each bar.

Layout:
```jsx
<svg width="100%" height="260" viewBox="0 0 600 260">
  {/* Y-axis gridlines */}
  {/* Bars */}
  {/* X-axis labels */}
  {/* Y-axis labels */}
</svg>
```

Read data from localStorage `pba_fees` — group payments by month and sum totals. If no data, show placeholder bars at 60%, 45%, 80%, 55%, 70%, 90% of max height.

### 2b — Attendance Rate by Branch (Horizontal Bar Chart)

Three horizontal bars (one per branch: Kohuwala, Wattala, Panadura). Each bar shows attendance % for the current month. Bars are `#059669`. Show the percentage label at the end of each bar.

Layout: `<svg width="100%" height="180">` with three rows, each 50px tall.

Read from localStorage `pba_attendance`. If no data, show Kohuwala: 92%, Wattala: 88%, Panadura: 95%.

### 2c — Student Enrolment by Programme (Donut / Pie Chart)

A donut chart built with SVG `<circle>` stroke-dasharray technique. Show up to 5 programmes. Use these colours: `#2563EB`, `#059669`, `#D97706`, `#7C3AED`, `#DC2626`.

To the right of the donut, show a legend: coloured square + programme name + count.

Read from localStorage `pba_students`. If no data, show placeholder: AAT Foundation 12, AAT Advanced 8, BIT 5, HND 6, Diploma 4.

### 2d — Summary Stat Row

Above the three charts, show four summary stats in a single row (same stat tile style as dashboard):
- **Total Revenue (This Month)** — sum of this month's fee payments — blue accent
- **Outstanding Fees** — sum of unpaid balances — red (#DC2626) if > 0
- **Avg Attendance** — average across all branches — green if ≥ 85%
- **Total Enrolled** — active student count — default dark

---

## Feature 3 — WhatsApp & Email Quick-Actions

### 3a — Parent Contact Buttons

In Student Management → student detail view (or the student row's action column), add two icon buttons next to each student:

**WhatsApp button** (green):
```jsx
<button
  onClick={() => {
    const phone = student.parentPhone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Dear Parent, this is a message from PBA regarding ${student.fullName}.`);
    window.open(`https://wa.me/94${phone.slice(-9)}?text=${msg}`, '_blank');
  }}
  style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', cursor: 'pointer' }}
  title="WhatsApp Parent"
>
  💬 WA
</button>
```

**Email button** (blue):
```jsx
<button
  onClick={() => {
    window.location.href = `mailto:${student.parentEmail}?subject=Regarding ${student.fullName} - PBA&body=Dear Parent,`;
  }}
  style={{ background: '#2563EB', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', cursor: 'pointer' }}
  title="Email Parent"
>
  ✉️ Email
</button>
```

### 3b — Fee Reminder Quick-Send

In Fee Management, for each student with outstanding fees, add a **Send Reminder** button. When clicked, open a modal with a pre-filled WhatsApp message:

```
Dear [Parent Name],

This is a reminder from Platinum Business Academy.

Student: [Student Name]
Outstanding Amount: LKR [Amount]
Due Date: [Due Date]

Please contact us to arrange payment.

PBA Admin
```

The modal has two buttons: **Send via WhatsApp** (opens `wa.me` link) and **Copy Message** (copies to clipboard with `navigator.clipboard.writeText(...)`).

### 3c — Bulk Announcement Send

In Communications → Announcements, add a **Send to Parents via WhatsApp** button on each announcement. When clicked, show a modal listing all active students with checkboxes. The admin can select which students' parents to notify, then clicking **Open WhatsApp Links** opens each parent's WhatsApp in a new tab (one per selected student, with the announcement text pre-filled).

Add a note inside the modal: *"Note: Each link will open separately. Your browser may ask to allow pop-ups — please allow them."*

---

## Feature 4 — Data Backup & Restore

Add a new section inside **General Administration** called **Data Management**. It appears as a new tab alongside existing General Admin tabs.

### 4a — Export Backup

A button **Download Full Backup** that:
1. Reads all PBA localStorage keys: `pba_users`, `pba_students`, `pba_lecturers`, `pba_fees`, `pba_attendance`, `pba_books`, `pba_print_jobs`, `pba_exams`, `pba_timetable`, `pba_announcements`, `pba_leaves`, `pba_documents`
2. Builds a JSON object: `{ exportedAt: new Date().toISOString(), version: '1.0', data: { ...allKeys } }`
3. Creates a Blob and triggers download:

```javascript
const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `pba-backup-${new Date().toISOString().slice(0,10)}.json`;
a.click();
URL.revokeObjectURL(url);
```

Show a success toast: *"Backup downloaded successfully."*

### 4b — Import / Restore Backup

A file input (`<input type="file" accept=".json">`) with a label **Restore from Backup**. When a file is selected:
1. Read it with `FileReader.readAsText()`
2. Parse the JSON
3. Validate it has `data` and `version` fields
4. Show a confirmation modal: *"This will overwrite all current data. Are you sure?"*
5. On confirm: iterate `backup.data` keys and set each into localStorage
6. Reload the page with `window.location.reload()`

Show an error toast if the file is not valid PBA backup JSON.

### 4c — Clear Data (Danger Zone)

A red-bordered section at the bottom of the Data Management tab labelled **Danger Zone**. Inside:

- **Clear All Data** button (danger/red style) — shows a confirmation modal requiring the admin to type `DELETE` into an input before the button activates. On confirm: clear all `pba_*` localStorage keys (do NOT use `localStorage.clear()` — only remove PBA keys by iterating `Object.keys(localStorage).filter(k => k.startsWith('pba_'))`), then reload.

- **Reset to Demo Data** button (secondary style) — clears all PBA keys and re-runs `seedDemoUsers()` and seeds placeholder data, then reloads. Useful for resetting to a clean demo state.

---

## Feature 5 — Enhanced Student Self-Service Portal

The student portal (visible when logged in as a student) must have these tabs:

### 5a — My Timetable

Show the student's weekly class schedule in a visual timetable grid:

```
         Mon    Tue    Wed    Thu    Fri    Sat
08:00  [       ]
09:00  [Acct1  ][     ][ICT  ]
10:00  [       ][Math ]
...
```

Build the grid with a CSS grid or HTML table. Each class cell is a coloured block (use the programme colour). Pull data from `pba_timetable` in localStorage, filtered to the student's enrolled classes.

If no timetable data exists, show a placeholder: *"Your timetable will appear here once it has been published by your coordinator."*

### 5b — My Attendance

Show a table of the student's attendance record:

| Date | Subject | Status | Marked By |
|------|---------|--------|-----------|
| 12 Jan 2025 | Accounting | Present ✅ | Mr. Perera |
| 13 Jan 2025 | ICT | Absent ❌ | Ms. Silva |

Below the table, show:
- **Total Classes**: [N]
- **Present**: [N] ([X]%)
- **Absent**: [N]
- A horizontal progress bar showing the attendance percentage. Green if ≥ 80%, orange if 60–79%, red if < 60%.

### 5c — My Fees

Show the student's fee summary:

```
┌────────────────────────────────────────┐
│  Total Fee:        LKR 45,000          │
│  Amount Paid:      LKR 30,000   ✅     │
│  Outstanding:      LKR 15,000   ⚠️     │
│  Next Due Date:    15 Feb 2025         │
└────────────────────────────────────────┘
```

Below: a table listing each payment: Date | Description | Amount | Status.

A button **Download Fee Statement** generates a print PDF (same pattern as Feature 1a) showing the student's full payment history.

### 5d — My Results

A table of exam results for the logged-in student:

| Exam | Subject | Date | Marks | Grade | Pass/Fail |
|------|---------|------|-------|-------|-----------|

Below the table: **Overall GPA / Average**: [X] (calculated from all exam marks).

### 5e — My Profile

Show the student's profile details in a read-only card:

- Full Name, Student ID, Programme, Branch, Enrolled Date
- Parent/Guardian name and contact
- A photo placeholder (circle with student initials, same style as the user chip in the header)

Add an **Update Contact Number** button that opens a small modal where the student can update their own phone number (writes back to `pba_students` in localStorage).

---

## Feature 6 — Academic Calendar

Add a new sidebar item **Calendar** after Analytics. Icon: 📅

The calendar page shows a full monthly calendar view:

### 6a — Calendar Grid

Build a month-view calendar with a grid of 7 columns (Sun–Sat) and 5–6 rows. Each day cell is a white card (`border-radius: 8px; border: 1px solid #E2E8F0; min-height: 80px; padding: 4px 8px`).

Header row: Sun | Mon | Tue | Wed | Thu | Fri | Sat (grey background, uppercase, small font).

Show month and year above the grid (`Sora` font, 20px, bold). Left/right arrow buttons to navigate months.

Today's date cell has a blue border (`border: 2px solid #2563EB`).

### 6b — Events on Calendar

Read events from localStorage `pba_calendar_events`. Each event has: `{ id, title, date, type, branch }`.

Event types and colours:
- `exam` — red (#DC2626) dot + label
- `holiday` — orange (#D97706) dot + label
- `class` — blue (#2563EB) dot + label
- `payment_due` — green (#059669) dot + label
- `leave` — grey (#64748B) dot + label

Show event dots and truncated titles inside each day cell. If more than 2 events on a day, show "+N more" in grey.

### 6c — Add Event Modal

An **Add Event** button (primary blue style) in the top-right of the calendar page. When clicked, open a modal with:
- Title (text input)
- Date (date picker: `<input type="date">`)
- Type (dropdown: Exam / Holiday / Class / Payment Due / Other)
- Branch (dropdown: All Branches / Kohuwala / Wattala / Panadura)
- Notes (textarea, optional)
- Save button — adds to `pba_calendar_events` in localStorage and closes modal

### 6d — Event Detail Popover

When clicking on a day cell that has events, show a small popover listing all events for that day with their type badge and title. Each event has a ✕ delete button (removes from localStorage immediately).

### 6e — Upcoming Events Sidebar Panel

To the right of the calendar (at 280px width on desktop), show a vertical list of upcoming events for the next 30 days:

```
┌──────────────────────────────┐
│  Upcoming Events             │
├──────────────────────────────┤
│  📅 15 Jan — AAT Exam        │
│       Kohuwala  [exam]       │
│  📅 20 Jan — Payment Due     │
│       All Branches [payment] │
│  📅 25 Jan — Public Holiday  │
│       [holiday]              │
└──────────────────────────────┘
```

Each item uses the event type colour for its badge.

---

## Navigation Updates

Add two new sidebar items in this order (after Dashboard, before Lecturer Management):
1. **Analytics** — icon 📈
2. **Calendar** — icon 📅

Both items use the same nav item style as existing sidebar items (see UI Fix prompt for exact styles).

---

## Toast Notification System

Add a global toast notification component that can be triggered from anywhere in the app. Toasts appear in the top-right corner of the screen, stacked vertically.

```jsx
// Toast container (always rendered at root level)
<div style={{
  position: 'fixed',
  top: '80px',
  right: '24px',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}}>
  {toasts.map(toast => (
    <div key={toast.id} style={{
      background: toast.type === 'success' ? '#D1FAE5' : toast.type === 'error' ? '#FEE2E2' : '#DBEAFE',
      color: toast.type === 'success' ? '#059669' : toast.type === 'error' ? '#DC2626' : '#2563EB',
      border: `1px solid ${toast.type === 'success' ? '#A7F3D0' : toast.type === 'error' ? '#FECACA' : '#BFDBFE'}`,
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '280px',
      maxWidth: '400px',
      animation: 'slideIn 0.2s ease'
    }}>
      <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
      {toast.message}
    </div>
  ))}
</div>
```

Toasts auto-dismiss after 3 seconds. Use a `useToast()` hook or a global `showToast(message, type)` function accessible from all components.

Add `@keyframes slideIn { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: translateX(0) } }` to globals.css.

---

## Summary

After Phase 5, the PBA portal will have:
- PDF/print receipts for fees, attendance, class lists, and exam results
- An Analytics page with bar charts, donut chart, and monthly stats
- One-click WhatsApp and email buttons to contact parents from Student Management
- A Data Management tab in General Admin for full backup/restore/reset
- A complete student self-service portal (timetable, attendance, fees, results, profile)
- A full Academic Calendar with event management
- A global toast notification system
- Two new sidebar items (Analytics and Calendar)

Do not change anything from Phases 1–4 except to add the two new sidebar nav items. All new UI must use inline `style={{}}` JSX props consistent with the existing system styling (navy: `#1A3566`, blue: `#2563EB`, background: `#F0F4FB`, white cards with `border: 1px solid #E2E8F0` and `border-radius: 12px`).
