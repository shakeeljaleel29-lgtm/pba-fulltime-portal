# PBA Full-Time Portal — Classroom Manager Crash Fix
## AntiGravity Prompt — Surgical Fix

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
The Classroom Manager tab crashes the entire app with "Application Recovery Notice"
when clicked. Fix the runtime error without changing any other tab or page.

════════════════════════════════════════════════════════════════
STEP 1 — FIND THE CRASH AND FIX IT
════════════════════════════════════════════════════════════════

The crash is caused by one or more of these in the Classroom Manager component:

  (a) Reading localStorage without safeLS() — raw JSON.parse() at top level throws
      if the key is missing or malformed
  (b) Calling .map(), .filter(), or .find() on a value that may be undefined/null
  (c) Accessing a property on undefined (e.g. classroom.facilities.map(...))
  (d) A useState initializer that calls safeLS() outside a function, causing
      it to run before the component mounts

Fix ALL of these in the Classroom Manager component:

1. Every localStorage read MUST use safeLS():
     const safeLS = (key, fallback = []) => {
       try {
         const raw = localStorage.getItem(key);
         if (!raw) return fallback;
         const parsed = JSON.parse(raw);
         return Array.isArray(fallback)
           ? (Array.isArray(parsed) ? parsed : fallback)
           : (parsed ?? fallback);
       } catch { return fallback; }
     };

2. The classrooms state MUST be initialised safely:
     const [classrooms, setClassrooms] = useState(() => safeLS('pba_classrooms', []));
   NOT:
     const [classrooms, setClassrooms] = useState(safeLS('pba_classrooms'));
   (lazy initializer with arrow function is required)

3. Every array operation must be guarded:
     (classrooms || []).map(...)
     (classrooms || []).filter(...)
     (classrooms || []).find(...)

4. Classroom object fields must be accessed safely:
     classroom.facilities?.join(', ') ?? '—'
     classroom.branch ?? '—'
     classroom.capacity ?? 0

════════════════════════════════════════════════════════════════
STEP 2 — SEED INITIAL DATA IF EMPTY
════════════════════════════════════════════════════════════════

If safeLS('pba_classrooms') returns [] (empty), seed with these defaults
so the tab has something to display immediately:

  const defaultClassrooms = [
    {
      id: 'cls-001',
      name: 'Hall A',
      branch: 'Kohuwala',
      capacity: 40,
      type: 'Lecture Hall',
      facilities: ['Projector', 'AC', 'Whiteboard'],
      isActive: true
    },
    {
      id: 'cls-002',
      name: 'Hall B',
      branch: 'Wattala',
      capacity: 35,
      type: 'Lecture Hall',
      facilities: ['Projector', 'AC', 'Whiteboard'],
      isActive: true
    },
    {
      id: 'cls-003',
      name: 'Lab 01',
      branch: 'Kohuwala',
      capacity: 30,
      type: 'Science Lab',
      facilities: ['Lab Equipment', 'Projector', 'AC'],
      isActive: true
    },
    {
      id: 'cls-004',
      name: 'Room 3B',
      branch: 'Panadura',
      capacity: 25,
      type: 'Classroom',
      facilities: ['Whiteboard', 'AC'],
      isActive: true
    }
  ];

  // In a useEffect on first load:
  useEffect(() => {
    const existing = safeLS('pba_classrooms', []);
    if (existing.length === 0) {
      localStorage.setItem('pba_classrooms', JSON.stringify(defaultClassrooms));
      setClassrooms(defaultClassrooms);
    }
  }, []);

════════════════════════════════════════════════════════════════
STEP 3 — CLASSROOM MANAGER UI (if it was broken, rebuild it cleanly)
════════════════════════════════════════════════════════════════

The Classroom Manager tab should show:

HEADER ROW:
  Left: "Classroom Manager" (Sora 18px bold) + small subtitle
        "Manage teaching spaces across all branches"
  Right: "＋ Add Classroom" (blue primary button)

FILTER ROW (below header):
  Branch filter dropdown: All Branches | Kohuwala | Wattala | Panadura
  Type filter dropdown:   All Types | Lecture Hall | Classroom | Science Lab | Computer Lab
  Search input: placeholder "Search classrooms..."

CLASSROOM CARDS GRID (CSS grid, 3 columns, gap 16px):
  Each card (white card style: background #FFF, border 1px solid #E3E6EA,
  borderRadius 12px, padding 16px, boxShadow 0 1px 4px rgba(0,0,0,0.06)):

    Top row:
      Left: classroom name (16px bold #1A202C)
      Right: active/inactive pill
        Active:   background #F0FFF4, color #276749, text "Active"
        Inactive: background #F7F7F7, color #A0AEC0, text "Inactive"

    Second row:
      Branch pill (background #EBF4FF, color #2B6CB0, borderRadius 20px,
                   padding 2px 10px, fontSize 11px, fontWeight 600)
      Space
      Capacity: "👤 {capacity} seats" (fontSize 12px, color #718096)

    Third row: Type badge
      (background #F7F8FA, color #4A5568, borderRadius 6px,
       padding 3px 8px, fontSize 11px)

    Facilities row (if facilities.length > 0):
      Small grey chips for each facility
      (background #F0F2F5, color #718096, borderRadius 10px,
       padding 2px 8px, fontSize 10px, fontWeight 600)

    Footer row:
      "Edit" button (ghost blue) | "Deactivate"/"Activate" toggle (ghost grey)

ADD / EDIT CLASSROOM MODAL:
  Fields:
    1. Classroom Name — text input, required
    2. Branch — select: Kohuwala | Wattala | Panadura
    3. Capacity — number input (min 1, max 500)
    4. Type — select: Lecture Hall | Classroom | Science Lab | Computer Lab | Other
    5. Facilities — multi-checkbox:
         ☐ Projector  ☐ Whiteboard  ☐ AC  ☐ Lab Equipment
         ☐ Computer   ☐ Smart Board ☐ CCTV
    6. Status — toggle: Active / Inactive

  Save → write to pba_classrooms in localStorage
  Footer: Cancel | Save Classroom (blue primary)
  Edit mode: show "Delete Classroom" (red ghost, left-aligned)

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT change any other tab or page
2. Use only inline style={{}} — no Tailwind
3. ALL localStorage reads must use safeLS() — no raw JSON.parse
4. useState initializers must use lazy form: useState(() => safeLS(...))
5. Wrap every .map(), .filter(), .find() with (array || []) guard
6. Run npm run build and confirm 0 errors
7. List all files modified
```
