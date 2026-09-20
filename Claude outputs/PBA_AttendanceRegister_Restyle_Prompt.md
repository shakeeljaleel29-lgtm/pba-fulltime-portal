# PBA Full-Time Portal — Digital Attendance Register Restyle
## AntiGravity Prompt — Surgical Restyle (Students → Digital Attendance Register tab)

---

Paste the entire block below into AntiGravity as a single prompt.

---

```
Restyle the Digital Attendance Register tab inside the Students page. Do not change any logic, state, data, or the Student Database tab. Do not change any other page.

Add these constants at the top of the file if not already present:

const theme = {
  accent: '#2B6CB0', accentLight: '#EBF4FF',
  gold: '#D4A017', goldLight: '#FEF3C7',
  textPrimary: '#1A202C', textSecondary: '#4A5568', textMuted: '#718096',
  cardBg: '#FFFFFF', cardBorder: '#E3E6EA', pageBg: '#F4F5F7',
  success: '#2F855A', successLight: '#F0FFF4',
  danger: '#C53030', dangerLight: '#FFF5F5',
};

════════════════════════════════════════════════════════════════
SECTION 1 — PAGE SECTION HEADER
════════════════════════════════════════════════════════════════

The "Digital Attendance Register" heading and "Export Attendance Sheet (PDF)" button
currently sit as plain text and an unstyled button. Replace with:

<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '18px'
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="#2B6CB0" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <polyline points="9 16 11 18 15 14"/>
    </svg>
    <div>
      <h3 style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: '16px',
        fontWeight: 700,
        color: '#1A202C',
        margin: 0
      }}>Digital Attendance Register</h3>
      <p style={{ fontSize: '12px', color: '#718096', margin: '1px 0 0' }}>
        Mark attendance per subject session and batch
      </p>
    </div>
  </div>

  {/* Export button */}
  <button onClick={handleExportPDF} style={{
    padding: '9px 16px',
    background: 'linear-gradient(135deg, #D4A017, #B7860A)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    boxShadow: '0 2px 8px rgba(212,160,23,0.30)',
    fontFamily: "'Inter', sans-serif"
  }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="#FFFFFF" strokeWidth="2">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
    Export Attendance Sheet (PDF)
  </button>
</div>

════════════════════════════════════════════════════════════════
SECTION 2 — FILTER ROW (SELECT BATCH + SELECT SUBJECT SESSION)
════════════════════════════════════════════════════════════════

The two dropdowns ("SELECT BATCH" and "SELECT SUBJECT SESSION") are currently
plain unstyled browser selects. Replace their container and selects with:

<div style={{
  background: '#FFFFFF',
  border: '1px solid #E3E6EA',
  borderRadius: '12px',
  padding: '18px 20px',
  marginBottom: '16px',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
}}>

  {/* Batch selector */}
  <div>
    <label style={{
      display: 'block',
      fontSize: '11px',
      fontWeight: 700,
      color: '#4A5568',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      marginBottom: '6px'
    }}>Select Batch</label>
    <select
      value={selectedBatch}
      onChange={e => setSelectedBatch(e.target.value)}
      style={{
        width: '100%',
        padding: '9px 36px 9px 13px',
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
        backgroundPosition: 'right 12px center',
        cursor: 'pointer',
        boxSizing: 'border-box'
      }}
      onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
    >
      {/* keep existing options */}
    </select>
  </div>

  {/* Subject session selector */}
  <div>
    <label style={{
      display: 'block',
      fontSize: '11px',
      fontWeight: 700,
      color: '#4A5568',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      marginBottom: '6px'
    }}>Select Subject Session</label>
    <select
      value={selectedSubject}
      onChange={e => setSelectedSubject(e.target.value)}
      style={{ /* same style as batch select above */ width: '100%', padding: '9px 36px 9px 13px',
        background: '#FFFFFF', border: '1.5px solid #E3E6EA', borderRadius: '8px',
        fontSize: '13px', color: '#1A202C', outline: 'none',
        fontFamily: "'Inter', 'Segoe UI', sans-serif", appearance: 'none', WebkitAppearance: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
        cursor: 'pointer', boxSizing: 'border-box' }}
      onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
    >
      {/* keep existing options */}
    </select>
  </div>

</div>

════════════════════════════════════════════════════════════════
SECTION 3 — ATTENDANCE TABLE (Reg No / Student Name / Mark Status)
════════════════════════════════════════════════════════════════

Wrap the attendance table in a white card:

<div style={{
  background: '#FFFFFF',
  border: '1px solid #E3E6EA',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  marginBottom: '16px'
}}>
  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
    <thead>
      <tr style={{ background: '#F8F9FB', borderBottom: '1px solid #E3E6EA' }}>
        <th style={{
          padding: '11px 18px',
          textAlign: 'left',
          fontSize: '10px',
          fontWeight: 700,
          color: '#718096',
          textTransform: 'uppercase',
          letterSpacing: '0.6px'
        }}>Reg No</th>
        <th style={{ /* same */ padding: '11px 18px', textAlign: 'left', fontSize: '10px',
          fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.6px'
        }}>Student Name</th>
        <th style={{ /* same */ padding: '11px 18px', textAlign: 'left', fontSize: '10px',
          fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.6px'
        }}>Attendance Status</th>
      </tr>
    </thead>
    <tbody>
      {students.map((student, i) => (
        <tr key={student.id} style={{
          borderBottom: '1px solid #F4F5F7',
          background: i % 2 === 0 ? '#FFFFFF' : '#FAFBFC',
          transition: 'background 0.1s'
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#F0F4FF'}
          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#FFFFFF' : '#FAFBFC'}
        >
          <td style={{ padding: '12px 18px', fontSize: '12px', color: '#718096', fontWeight: 600 }}>
            {student.regNo}
          </td>
          <td style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 700, color: '#1A202C' }}>
            {student.name}
          </td>
          <td style={{ padding: '10px 18px' }}>
            {/* Replace radio buttons with styled pill toggle group */}
            <div style={{ display: 'flex', gap: '6px' }}>

              {/* Present button */}
              <button
                onClick={() => setAttendance(student.id, 'Present')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1.5px solid',
                  transition: 'all 0.12s',
                  fontFamily: "'Inter', sans-serif",
                  ...(attendance[student.id] === 'Present'
                    ? { background: '#F0FFF4', color: '#2F855A', borderColor: '#9AE6B4' }
                    : { background: '#FFFFFF', color: '#A0AEC0', borderColor: '#E2E8F0' })
                }}
              >
                ✓ Present
              </button>

              {/* Late button */}
              <button
                onClick={() => setAttendance(student.id, 'Late')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1.5px solid',
                  transition: 'all 0.12s',
                  fontFamily: "'Inter', sans-serif",
                  ...(attendance[student.id] === 'Late'
                    ? { background: '#FEF3C7', color: '#B7860A', borderColor: '#F6D860' }
                    : { background: '#FFFFFF', color: '#A0AEC0', borderColor: '#E2E8F0' })
                }}
              >
                ⏱ Late
              </button>

              {/* Absent button */}
              <button
                onClick={() => setAttendance(student.id, 'Absent')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1.5px solid',
                  transition: 'all 0.12s',
                  fontFamily: "'Inter', sans-serif",
                  ...(attendance[student.id] === 'Absent'
                    ? { background: '#FFF5F5', color: '#C53030', borderColor: '#FEB2B2' }
                    : { background: '#FFFFFF', color: '#A0AEC0', borderColor: '#E2E8F0' })
                }}
              >
                ✕ Absent
              </button>

            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

════════════════════════════════════════════════════════════════
SECTION 4 — "SUBMIT & LOCK ATTENDANCE" BUTTON
════════════════════════════════════════════════════════════════

The button is currently plain and aligned to the right. Replace with:

<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
  <button onClick={handleSubmit} style={{
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 10px rgba(43,108,176,0.30)',
    fontFamily: "'Inter', sans-serif"
  }}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke="#FFFFFF" strokeWidth="2.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
    Submit & Lock Attendance
  </button>
</div>

════════════════════════════════════════════════════════════════
SECTION 5 — ATTENDANCE HISTORY LOG
════════════════════════════════════════════════════════════════

The "Attendance History Log" section (heading, search, and table below) is
currently plain text and an unstyled table. Restyle as follows:

SECTION HEADER:
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="#2B6CB0" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A202C' }}>
      Attendance History Log
    </span>
  </div>
</div>

SEARCH INPUT (keep existing value/onChange):
<div style={{ position: 'relative', marginBottom: '14px' }}>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2"
       style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
  <input
    type="text"
    placeholder="Search history..."
    value={searchHistory}
    onChange={e => setSearchHistory(e.target.value)}
    style={{
      width: '100%',
      padding: '9px 13px 9px 36px',
      background: '#FFFFFF',
      border: '1.5px solid #E3E6EA',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#1A202C',
      outline: 'none',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      boxSizing: 'border-box'
    }}
    onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
    onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
  />
</div>

HISTORY TABLE — wrap in white card:
<div style={{
  background: '#FFFFFF',
  border: '1px solid #E3E6EA',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
}}>
  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
    <thead>
      <tr style={{ background: '#F8F9FB', borderBottom: '1px solid #E3E6EA' }}>
        {['Date', 'Batch', 'Subject', 'Lecturer', 'Present', 'Late', 'Absent', 'Rate (%)'].map(col => (
          <th key={col} style={{
            padding: '10px 16px',
            textAlign: 'left',
            fontSize: '10px',
            fontWeight: 700,
            color: '#718096',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            whiteSpace: 'nowrap'
          }}>{col}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {historyRows.map((row, i) => (
        <tr key={i} style={{
          borderBottom: '1px solid #F4F5F7',
          background: i % 2 === 0 ? '#FFFFFF' : '#FAFBFC'
        }}>
          <td style={{ padding: '11px 16px', fontSize: '12px', color: '#4A5568', fontWeight: 600 }}>
            {row.date}
          </td>
          <td style={{ padding: '11px 16px' }}>
            <span style={{ background: '#EBF4FF', color: '#2B6CB0', fontSize: '11px',
              fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
              {row.batch}
            </span>
          </td>
          <td style={{ padding: '11px 16px', fontSize: '13px', color: '#1A202C', fontWeight: 600 }}>
            {row.subject}
          </td>
          <td style={{ padding: '11px 16px', fontSize: '12px', color: '#4A5568' }}>
            {row.lecturer}
          </td>
          <td style={{ padding: '11px 16px' }}>
            <span style={{ background: '#F0FFF4', color: '#2F855A', fontSize: '12px',
              fontWeight: 700 }}>{row.present}</span>
          </td>
          <td style={{ padding: '11px 16px' }}>
            <span style={{ background: '#FEF3C7', color: '#B7860A', fontSize: '12px',
              fontWeight: 700 }}>{row.late}</span>
          </td>
          <td style={{ padding: '11px 16px' }}>
            <span style={{ background: '#FFF5F5', color: '#C53030', fontSize: '12px',
              fontWeight: 700 }}>{row.absent}</span>
          </td>
          <td style={{ padding: '11px 16px' }}>
            {/* Rate badge — green if ≥90%, amber if 75–89%, red if <75% */}
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: parseFloat(row.rate) >= 90 ? '#2F855A'
                   : parseFloat(row.rate) >= 75 ? '#B7860A'
                   : '#C53030'
            }}>
              {row.rate}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. The Present/Late/Absent toggle buttons replace the radio button inputs entirely.
   The onClick handlers must call the same setter function the radio buttons called —
   do NOT create new state; just change the UI element from <input type="radio"> to
   styled <button> with the same onClick logic.
2. Do NOT change the Student Database tab, any modal, or any other page.
3. Keep all existing state (selectedBatch, selectedSubject, attendance map, history).
4. List which files were modified.
```
