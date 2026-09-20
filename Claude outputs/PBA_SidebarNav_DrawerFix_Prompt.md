# PBA Full-Time Portal — Sidebar Nav Fix + Student Drawer Restyle
## AntiGravity Prompt — Surgical Fix

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Three fixes in one prompt. Do not change any other page or component.

════════════════════════════════════════════════════════════════
FIX 1 — SIDEBAR NAV: "Printing Queue" should open the Printing Queue Board tab
════════════════════════════════════════════════════════════════

Currently both "Book Catalogue" and "Printing Queue" sidebar items open the same
Textbook Catalogue & Printing Backlog page on the Textbook Catalogue tab.

Fix: when the user navigates via the "Printing Queue" sidebar link, the shared
Textbook/PrintingQueue page must open with the "Printing Queue Board" tab
pre-selected instead of the default "Textbook Catalogue" tab.

Implementation (choose whichever matches the current routing):

Option A — if using React Router with state:
  In the sidebar, change the "Printing Queue" NavLink / Link to:
    <Link to="/printing-queue" state={{ initialTab: 'printingQueue' }}>

  In the page component (BookCatalogueView.jsx or PrintingQueueView.jsx or equivalent),
  read the navigation state:
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(
      location.state?.initialTab ?? 'textbookCatalogue'
    );

Option B — if both sidebar items share the same route but differ by a query param:
  "Book Catalogue" link → /book-catalogue
  "Printing Queue" link → /book-catalogue?tab=printingQueue

  In the page component:
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(
      searchParams.get('tab') ?? 'textbookCatalogue'
    );

Option C — if using a single shared view with a prop:
  Pass initialTab="printingQueue" to the component when rendered from the
  "Printing Queue" nav entry.

Use whichever option fits the existing routing pattern. The goal:
  - Clicking "Book Catalogue" in the sidebar → page opens on Textbook Catalogue tab ✓
  - Clicking "Printing Queue" in the sidebar → page opens on Printing Queue Board tab ✓
  - The tab bar still works normally after landing (user can switch tabs freely)
  - No other pages or routes change

════════════════════════════════════════════════════════════════
FIX 2 — STUDENT PROFILE DRAWER: Restyle the tab navigation
════════════════════════════════════════════════════════════════

In the student profile drawer (StudentProfileDrawer.jsx or equivalent), the tab
row (Overview | Attendance | Subjects | Marks & Grades | Discipline | Fees Ledger |
Documents | Report Card) currently renders as plain text links with no clear
active/inactive visual distinction.

Replace the tab row with a pill-group style tab bar:

CONTAINER:
<div style={{
  display: 'flex',
  gap: '4px',
  padding: '4px',
  background: '#F4F5F7',
  borderRadius: '10px',
  flexWrap: 'wrap',
  margin: '0 0 20px 0'
}}>

EACH TAB BUTTON:
<button
  key={tab.id}
  onClick={() => setActiveTab(tab.id)}
  style={{
    padding: '7px 14px',
    background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
    border: 'none',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: activeTab === tab.id ? 700 : 500,
    color: activeTab === tab.id ? '#1A202C' : '#718096',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: activeTab === tab.id
      ? '0 1px 4px rgba(0,0,0,0.10)'
      : 'none',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif"
  }}
>
  {tab.icon && (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2"
         style={{ opacity: activeTab === tab.id ? 1 : 0.6 }}>
      {/* keep existing icon paths per tab */}
    </svg>
  )}
  {tab.label}
  {/* count badge if present (e.g. "Discipline (0)") */}
  {tab.count !== undefined && (
    <span style={{
      background: activeTab === tab.id ? '#EBF4FF' : '#E2E8F0',
      color: activeTab === tab.id ? '#2B6CB0' : '#718096',
      fontSize: '10px', fontWeight: 700,
      padding: '1px 5px', borderRadius: '10px',
      marginLeft: '2px'
    }}>{tab.count}</span>
  )}
</button>

The tabs and their icons (use the same icons already in the component):
  - Overview (person/user icon)
  - Attendance (calendar icon)
  - Subjects (book icon)
  - Marks & Grades (document/chart icon)
  - Discipline — show count badge with the existing count value
  - Fees Ledger (dollar/currency icon)
  - Documents — show count badge with existing count value
  - Report Card (printer/file icon)

Do NOT change what each tab renders — only the tab button styling changes.

════════════════════════════════════════════════════════════════
FIX 3 — STUDENT PROFILE DRAWER: Restyle header buttons
════════════════════════════════════════════════════════════════

In the drawer header (dark charcoal/navy gradient background), restyle:

"Close Drawer" button:
<button
  onClick={onClose}
  style={{
    padding: '7px 14px',
    background: 'transparent',
    border: '1.5px solid rgba(255,255,255,0.25)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.75)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: "'Inter', sans-serif"
  }}
  onMouseEnter={e => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
  }}
>
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
  Close
</button>

"Link Student Account" and "Parent Link" buttons in the header — apply the same
ghost style (transparent bg, white border at 25% opacity, white text at 75% opacity).
Keep their existing onClick handlers and icons.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any other page, component, or data structure.
2. Do NOT change what each drawer tab renders — only the tab button appearance.
3. Do NOT reset any active tab state — only the visual style changes.
4. List all files modified.
```
