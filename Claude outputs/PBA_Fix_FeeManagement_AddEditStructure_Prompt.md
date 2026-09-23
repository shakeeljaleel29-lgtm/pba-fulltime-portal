# PBA Full-Time Portal — Fix: Batch Fee Structures Cannot Be Added / Edited
## AntiGravity Prompt

---

```
The Batch Fee Structures tab in Fee Management shows existing
fee structures in a read-only table but has no way to add a
new fee structure, edit an existing one, or delete one.

Touch ONLY FeeManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
WHAT TO ADD
════════════════════════════════════════════════════════════════

1. "Add Fee Structure" button in the Batch Fee Structures card
   header (top-right) — opens a modal form
2. Edit (✏) and Delete (🗑) action buttons on every table row
3. A modal form for creating AND editing a fee structure
4. All data saved to localStorage key pba_fee_structures via saveLS()

════════════════════════════════════════════════════════════════
DATA SHAPE — pba_fee_structures (array of objects)
════════════════════════════════════════════════════════════════

Each fee structure object:
  {
    id:         string,   // crypto.randomUUID() or Date.now().toString()
    batchId:    string,   // id of batch from pba_batches
    batchName:  string,   // denormalized for display — derived from pba_batches
    feeName:    string,   // e.g. "Monthly Programme Fee"
    amount:     number,   // in LKR
    frequency:  string,   // "Monthly" | "Per Term" | "Annual" | "One-time"
    mandatory:  boolean   // true = Mandatory, false = Optional
  }

On save, always re-derive batchName from pba_batches:
  const batch = (safeLS('pba_batches', []) || [])
    .find(b => b.id === formData.batchId);
  const batchName = batch?.name || formData.batchId;

════════════════════════════════════════════════════════════════
SECTION A — "Add Fee Structure" button
════════════════════════════════════════════════════════════════

In the Batch Fee Structures card heading row, add a button
at the far right:

  <button
    onClick={() => openFeeStructureModal(null)}
    style={{
      background: '#2563EB', color: 'white',
      border: 'none', borderRadius: '8px',
      padding: '8px 16px', fontSize: '13px', fontWeight: 600,
      cursor: 'pointer', display: 'flex',
      alignItems: 'center', gap: '6px'
    }}
  >
    + Add Fee Structure
  </button>

════════════════════════════════════════════════════════════════
SECTION B — Edit & Delete buttons on each table row
════════════════════════════════════════════════════════════════

Add an ACTIONS column (last column) to the Batch Fee Structures
table. Each row gets:

  <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
    <button
      onClick={() => openFeeStructureModal(feeStructure)}
      style={{
        background: '#F3F4F6', border: '1px solid #E5E7EB',
        borderRadius: '6px', padding: '5px 10px',
        fontSize: '12px', cursor: 'pointer', color: '#374151'
      }}
    >✏ Edit</button>
    <button
      onClick={() => deleteFeeStructure(feeStructure.id)}
      style={{
        background: '#FEF2F2', border: '1px solid #FECACA',
        borderRadius: '6px', padding: '5px 10px',
        fontSize: '12px', cursor: 'pointer', color: '#DC2626'
      }}
    >🗑 Delete</button>
  </td>

════════════════════════════════════════════════════════════════
SECTION C — Modal form (create + edit)
════════════════════════════════════════════════════════════════

State needed:
  const [feeStructureModal, setFeeStructureModal] = useState(false);
  const [editingFeeStructure, setEditingFeeStructure] = useState(null);
  const [feeStructureForm, setFeeStructureForm] = useState({
    batchId: '', feeName: '', amount: '', frequency: 'Monthly',
    mandatory: true
  });

Open helper:
  const openFeeStructureModal = (existing) => {
    if (existing) {
      setEditingFeeStructure(existing);
      setFeeStructureForm({
        batchId:   existing.batchId   || '',
        feeName:   existing.feeName   || '',
        amount:    existing.amount    || '',
        frequency: existing.frequency || 'Monthly',
        mandatory: existing.mandatory !== false
      });
    } else {
      setEditingFeeStructure(null);
      setFeeStructureForm({
        batchId: '', feeName: '', amount: '',
        frequency: 'Monthly', mandatory: true
      });
    }
    setFeeStructureModal(true);
  };

Save handler:
  const saveFeeStructure = () => {
    if (!feeStructureForm.batchId || !feeStructureForm.feeName
        || !feeStructureForm.amount) {
      alert('Please fill in Batch, Fee Name, and Amount.');
      return;
    }
    const allBatches = safeLS('pba_batches', []) || [];
    const batch = allBatches.find(b => b.id === feeStructureForm.batchId);
    const batchName = batch?.name || feeStructureForm.batchId;

    const existing = safeLS('pba_fee_structures', []) || [];
    let updated;
    if (editingFeeStructure) {
      updated = existing.map(fs =>
        fs.id === editingFeeStructure.id
          ? { ...fs, ...feeStructureForm,
              batchName,
              amount: parseFloat(feeStructureForm.amount) || 0 }
          : fs
      );
    } else {
      updated = [...existing, {
        id:        Date.now().toString(),
        ...feeStructureForm,
        batchName,
        amount:    parseFloat(feeStructureForm.amount) || 0
      }];
    }
    saveLS('pba_fee_structures', updated);
    setFeeStructureModal(false);
  };

Delete handler:
  const deleteFeeStructure = (id) => {
    if (!window.confirm('Delete this fee structure?')) return;
    const existing = safeLS('pba_fee_structures', []) || [];
    saveLS('pba_fee_structures', existing.filter(fs => fs.id !== id));
  };

Modal JSX — render as an overlay when feeStructureModal is true:

  {feeStructureModal && (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '28px 32px', width: '480px',
        maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '24px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
            {editingFeeStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
          </h3>
          <button
            onClick={() => setFeeStructureModal(false)}
            style={{
              background: 'none', border: 'none', fontSize: '20px',
              cursor: 'pointer', color: '#6B7280'
            }}
          >×</button>
        </div>

        {/* Batch selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px',
            fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Batch *
          </label>
          <select
            value={feeStructureForm.batchId}
            onChange={e => setFeeStructureForm(f => ({ ...f, batchId: e.target.value }))}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1px solid #D1D5DB', borderRadius: '8px',
              fontSize: '14px', color: '#111827', background: 'white'
            }}
          >
            <option value=''>— Select batch —</option>
            {(safeLS('pba_batches', []) || []).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Fee Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px',
            fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Fee Name *
          </label>
          <input
            type='text'
            placeholder='e.g. Monthly Programme Fee'
            value={feeStructureForm.feeName}
            onChange={e => setFeeStructureForm(f => ({ ...f, feeName: e.target.value }))}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1px solid #D1D5DB', borderRadius: '8px',
              fontSize: '14px', color: '#111827', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px',
            fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Amount (LKR) *
          </label>
          <input
            type='number'
            placeholder='e.g. 15000'
            value={feeStructureForm.amount}
            onChange={e => setFeeStructureForm(f => ({ ...f, amount: e.target.value }))}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1px solid #D1D5DB', borderRadius: '8px',
              fontSize: '14px', color: '#111827', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Frequency */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px',
            fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Frequency
          </label>
          <select
            value={feeStructureForm.frequency}
            onChange={e => setFeeStructureForm(f => ({ ...f, frequency: e.target.value }))}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1px solid #D1D5DB', borderRadius: '8px',
              fontSize: '14px', color: '#111827', background: 'white'
            }}
          >
            <option>Monthly</option>
            <option>Per Term</option>
            <option>Annual</option>
            <option>One-time</option>
          </select>
        </div>

        {/* Mandatory toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '24px'
        }}>
          <input
            type='checkbox'
            id='fsMandatory'
            checked={feeStructureForm.mandatory}
            onChange={e => setFeeStructureForm(f =>
              ({ ...f, mandatory: e.target.checked }))}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor='fsMandatory' style={{
            fontSize: '14px', fontWeight: 500, color: '#374151',
            cursor: 'pointer'
          }}>
            Mandatory fee
          </label>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setFeeStructureModal(false)}
            style={{
              padding: '10px 20px', background: '#F3F4F6',
              border: '1px solid #E5E7EB', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              color: '#374151'
            }}
          >Cancel</button>
          <button
            onClick={saveFeeStructure}
            style={{
              padding: '10px 24px', background: '#2563EB',
              border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              color: 'white'
            }}
          >
            {editingFeeStructure ? 'Save Changes' : 'Add Fee Structure'}
          </button>
        </div>
      </div>
    </div>
  )}

════════════════════════════════════════════════════════════════
SECTION D — Read fee structures from pba_fee_structures
════════════════════════════════════════════════════════════════

The Batch Fee Structures table must read from pba_fee_structures,
not from a hardcoded array:

  const feeStructures = safeLS('pba_fee_structures', []) || [];

Map feeStructures in the table body instead of any hardcoded data.
If feeStructures is empty, show an empty state row:

  <tr>
    <td colSpan={6} style={{
      textAlign: 'center', padding: '32px',
      color: '#9CA3AF', fontSize: '14px'
    }}>
      No fee structures yet. Click "+ Add Fee Structure" to create one.
    </td>
  </tr>

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY FeeManagementView.jsx
2. Use only inline style={{}} — no Tailwind
3. safeLS() for ALL localStorage reads; saveLS() for writes
4. The "Active Fee Structures" summary tile at the top should
   count (safeLS('pba_fee_structures', []) || []).length
5. Do NOT break the Student Fee Ledgers & Payments tab —
   only the Batch Fee Structures tab is being changed here
6. The batch dropdown in the modal must pull live from pba_batches
   so newly created batches appear immediately
7. Run npm run build and confirm 0 errors
8. Then npm run deploy
9. List all files modified
```
