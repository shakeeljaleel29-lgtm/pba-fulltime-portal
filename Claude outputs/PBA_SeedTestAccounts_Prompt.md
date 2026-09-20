# PBA Full-Time Portal — Seed Test User Accounts
## AntiGravity Prompt — Pre-Launch Testing Setup

---

```
Seed the PBA portal with a complete set of test user accounts covering every role,
so the application can be fully tested before going live.
Do NOT change any existing data or overwrite existing pba_users entries.
Only ADD the test accounts if they don't already exist.

════════════════════════════════════════════════════════════════
TEST ACCOUNTS TO SEED INTO pba_users
════════════════════════════════════════════════════════════════

On app load, run this migration ONCE (check for a flag in localStorage):

  const TEST_SEEDED_KEY = 'pba_test_accounts_seeded_v1';
  if (!localStorage.getItem(TEST_SEEDED_KEY)) {
    seedTestAccounts();
    localStorage.setItem(TEST_SEEDED_KEY, 'true');
  }

  function seedTestAccounts() {
    const existing = safeLS('pba_users', []);

    const testUsers = [
      // ── ADMIN / PRINCIPAL ──────────────────────────────────────
      {
        id: 'test-admin-001',
        name: 'Dr. K. Liyanage',
        email: 'principal@pba.lk',
        username: 'principal',
        password: 'Test@1234',
        role: 'Admin',
        branch: 'All Branches',
        phone: '+94 77 000 0001',
        isActive: true,
        isTestAccount: true
      },
      // ── BRANCH MANAGER ─────────────────────────────────────────
      {
        id: 'test-manager-001',
        name: 'Ms. R. Fernando',
        email: 'manager.koh@pba.lk',
        username: 'manager.koh',
        password: 'Test@1234',
        role: 'Manager',
        branch: 'Kohuwala',
        phone: '+94 77 000 0002',
        isActive: true,
        isTestAccount: true
      },
      // ── LECTURERS ──────────────────────────────────────────────
      {
        id: 'test-lec-001',
        name: 'Mr. A. Perera',
        email: 'lec.maths@pba.lk',
        username: 'lec.perera',
        password: 'Test@1234',
        role: 'Lecturer',
        branch: 'Kohuwala',
        subjectsTaught: [],
        assistantIds: [],
        availability: [
          { day: 'Monday',    isAvailable: true, from: '08:00', to: '18:00' },
          { day: 'Tuesday',   isAvailable: true, from: '08:00', to: '18:00' },
          { day: 'Wednesday', isAvailable: true, from: '08:00', to: '18:00' },
          { day: 'Thursday',  isAvailable: true, from: '08:00', to: '18:00' },
          { day: 'Friday',    isAvailable: true, from: '08:00', to: '18:00' },
          { day: 'Saturday',  isAvailable: true, from: '08:00', to: '14:00' },
          { day: 'Sunday',    isAvailable: false, from: '', to: '' }
        ],
        phone: '+94 77 000 0003',
        qualification: 'BSc Mathematics (Hons)',
        isActive: true,
        isTestAccount: true
      },
      {
        id: 'test-lec-002',
        name: 'Ms. S. Jayawardena',
        email: 'lec.bio@pba.lk',
        username: 'lec.jayawardena',
        password: 'Test@1234',
        role: 'Lecturer',
        branch: 'Wattala',
        subjectsTaught: [],
        assistantIds: ['test-asst-001'],
        availability: [
          { day: 'Monday',    isAvailable: true, from: '09:00', to: '17:00' },
          { day: 'Tuesday',   isAvailable: false, from: '', to: '' },
          { day: 'Wednesday', isAvailable: true, from: '09:00', to: '17:00' },
          { day: 'Thursday',  isAvailable: true, from: '09:00', to: '17:00' },
          { day: 'Friday',    isAvailable: true, from: '09:00', to: '17:00' },
          { day: 'Saturday',  isAvailable: true, from: '09:00', to: '13:00' },
          { day: 'Sunday',    isAvailable: false, from: '', to: '' }
        ],
        phone: '+94 77 000 0004',
        qualification: 'MBBS, MSc Biology',
        isActive: true,
        isTestAccount: true
      },
      {
        id: 'test-lec-003',
        name: 'Mr. T. Bandara',
        email: 'lec.accounts@pba.lk',
        username: 'lec.bandara',
        password: 'Test@1234',
        role: 'Lecturer',
        branch: 'Panadura',
        subjectsTaught: [],
        assistantIds: [],
        availability: [
          { day: 'Monday',    isAvailable: true, from: '10:00', to: '19:00' },
          { day: 'Tuesday',   isAvailable: true, from: '10:00', to: '19:00' },
          { day: 'Wednesday', isAvailable: false, from: '', to: '' },
          { day: 'Thursday',  isAvailable: true, from: '10:00', to: '19:00' },
          { day: 'Friday',    isAvailable: true, from: '10:00', to: '19:00' },
          { day: 'Saturday',  isAvailable: true, from: '10:00', to: '15:00' },
          { day: 'Sunday',    isAvailable: false, from: '', to: '' }
        ],
        phone: '+94 77 000 0005',
        qualification: 'BCom Accounting (Hons)',
        isActive: true,
        isTestAccount: true
      },
      // ── ASSISTANTS ─────────────────────────────────────────────
      {
        id: 'test-asst-001',
        name: 'Ms. N. Silva',
        email: 'asst.silva@pba.lk',
        username: 'asst.silva',
        password: 'Test@1234',
        role: 'Assistant',
        branch: 'Wattala',
        phone: '+94 77 000 0006',
        isActive: true,
        isTestAccount: true
      },
      {
        id: 'test-asst-002',
        name: 'Mr. D. Wijesinghe',
        email: 'asst.wijesinghe@pba.lk',
        username: 'asst.wijesinghe',
        password: 'Test@1234',
        role: 'Assistant',
        branch: 'Kohuwala',
        phone: '+94 77 000 0007',
        isActive: true,
        isTestAccount: true
      },
      // ── STUDENTS ───────────────────────────────────────────────
      {
        id: 'test-stu-001',
        name: 'Ashan Gunawardena',
        email: 'student1@pba.lk',
        username: 'stu.ashan',
        password: 'Test@1234',
        role: 'Student',
        branch: 'Kohuwala',
        studentId: 'STU-2027-001',
        phone: '+94 77 000 0010',
        parentName: 'Mr. R. Gunawardena',
        parentPhone: '+94 77 000 0011',
        isActive: true,
        isTestAccount: true
      },
      {
        id: 'test-stu-002',
        name: 'Nimasha Perera',
        email: 'student2@pba.lk',
        username: 'stu.nimasha',
        password: 'Test@1234',
        role: 'Student',
        branch: 'Wattala',
        studentId: 'STU-2027-002',
        phone: '+94 77 000 0012',
        parentName: 'Mrs. K. Perera',
        parentPhone: '+94 77 000 0013',
        isActive: true,
        isTestAccount: true
      },
      {
        id: 'test-stu-003',
        name: 'Kavindu Dissanayake',
        email: 'student3@pba.lk',
        username: 'stu.kavindu',
        password: 'Test@1234',
        role: 'Student',
        branch: 'Panadura',
        studentId: 'STU-2027-003',
        phone: '+94 77 000 0014',
        parentName: 'Mr. L. Dissanayake',
        parentPhone: '+94 77 000 0015',
        isActive: true,
        isTestAccount: true
      }
    ];

    // Only add accounts that don't already exist (match by id)
    const existingIds = existing.map(u => u.id);
    const toAdd = testUsers.filter(u => !existingIds.includes(u.id));
    if (toAdd.length > 0) {
      saveLS('pba_users', [...existing, ...toAdd]);
    }
  }

════════════════════════════════════════════════════════════════
TEST MODE BANNER
════════════════════════════════════════════════════════════════

Add a dismissible TEST MODE banner at the very top of the app
(above the main layout, below nothing — it sits above the sidebar and header):

  const [testBannerDismissed, setTestBannerDismissed] = useState(false);
  const hasTestAccounts = safeLS('pba_users', []).some(u => u.isTestAccount);

  {hasTestAccounts && !testBannerDismissed && (
    <div style={{
      background: '#FFFBEB',
      borderBottom: '2px solid #F6D860',
      padding: '8px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '12px',
      fontWeight: 600,
      color: '#B7860A',
      zIndex: 9999
    }}>
      <span>
        🧪 TEST MODE — Test accounts are active. All data is stored locally.
        Username: <code style={{ background: '#FEF3C7', padding: '1px 6px',
          borderRadius: '4px' }}>principal</code> &nbsp;
        Password: <code style={{ background: '#FEF3C7', padding: '1px 6px',
          borderRadius: '4px' }}>Test@1234</code>
        &nbsp;&nbsp;(same password for all test accounts)
      </span>
      <button
        onClick={() => setTestBannerDismissed(true)}
        style={{
          background: 'none', border: 'none',
          color: '#B7860A', cursor: 'pointer',
          fontSize: '16px', fontWeight: 700, padding: '0 4px'
        }}
      >×</button>
    </div>
  )}

════════════════════════════════════════════════════════════════
USER MANAGEMENT PAGE — mark test accounts clearly
════════════════════════════════════════════════════════════════

In the User Management tab, any user where isTestAccount === true
should show a small amber "TEST" badge next to their name:

  {user.isTestAccount && (
    <span style={{
      fontSize: '9px', fontWeight: 800, padding: '2px 6px',
      background: '#FFFBEB', color: '#B7860A',
      border: '1px solid #F6D860', borderRadius: '8px',
      marginLeft: '6px', letterSpacing: '0.3px'
    }}>TEST</span>
  )}

Add a "🗑 Remove All Test Accounts" button in User Management
(red ghost, only visible if any isTestAccount === true users exist):

  <button
    onClick={() => {
      const cleaned = safeLS('pba_users', []).filter(u => !u.isTestAccount);
      saveLS('pba_users', cleaned);
      localStorage.removeItem('pba_test_accounts_seeded_v1');
    }}
    style={{
      padding: '7px 14px', background: 'transparent',
      border: '1.5px solid #FC8181', borderRadius: '7px',
      fontSize: '12px', fontWeight: 600, color: '#C53030', cursor: 'pointer'
    }}
  >
    🗑 Remove All Test Accounts
  </button>

Clicking this removes all test users AND resets the seed flag,
so they will be re-seeded on next reload if needed.

════════════════════════════════════════════════════════════════
TEST ACCOUNT CREDENTIALS SUMMARY
════════════════════════════════════════════════════════════════

All test accounts use password: Test@1234

  ROLE          USERNAME              NAME
  ──────────────────────────────────────────────────
  Admin         principal             Dr. K. Liyanage
  Manager       manager.koh           Ms. R. Fernando
  Lecturer      lec.perera            Mr. A. Perera
  Lecturer      lec.jayawardena       Ms. S. Jayawardena
  Lecturer      lec.bandara           Mr. T. Bandara
  Assistant     asst.silva            Ms. N. Silva
  Assistant     asst.wijesinghe       Mr. D. Wijesinghe
  Student       stu.ashan             Ashan Gunawardena
  Student       stu.nimasha           Nimasha Perera
  Student       stu.kavindu           Kavindu Dissanayake

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Do NOT delete or overwrite any existing pba_users entries
2. Only add test accounts if their id does not already exist
3. Use only inline style={{}} — no Tailwind
4. safeLS() for all localStorage reads; saveLS() for writes
5. The "Remove All Test Accounts" button must remove ONLY isTestAccount===true users
6. Run npm run build and confirm 0 errors
7. List all files modified
```
