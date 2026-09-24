import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { CreditCard, DollarSign, Download, Printer, Send } from "lucide-react";
import { printFeeReceiptPDF } from "../../utils/pdfGenerator";

import { T, theme, type as t } from "../../theme";

const safeLS = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === '') return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback;
    if (typeof fallback === 'object') return (parsed && typeof parsed === 'object') ? parsed : fallback;
    return parsed ?? fallback;
  } catch { return fallback; }
};

const saveLS = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); }
  catch (err) { console.error('saveLS error:', err); }
};

const formatOrdinal = (day) => {
  const d = parseInt(day) || 10;
  const s = ["th", "st", "nd", "rd"];
  const v = d % 100;
  return d + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const FeeManagementView = ({ isMobile }) => {
  const isMobileState = isMobile !== undefined ? isMobile : (window.innerWidth < 768);
  const { data, recordFeePayment, exportToCSV, showToast } = useApp();
  const [activeTab, setActiveTab] = useState("outstanding");

  // Payment Modal
  const [paymentModalFee, setPaymentModalFee] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    method: "Bank Transfer",
    receiptNo: `REC-${Math.floor(10000 + Math.random() * 90000)}`
  });

  // Reminder Modal State
  const [reminderModalFee, setReminderModalFee] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [ledgerRefresh, setLedgerRefresh] = useState(0);
  // ── Fee Structure CRUD ──────────────────────────────────────
  const [feeStructureModal, setFeeStructureModal] = useState(false);
  const [editingFeeStructure, setEditingFeeStructure] = useState(null);
  const [feeStructureForm, setFeeStructureForm] = useState({
    batchId:         '',
    feeName:         '',
    amount:          '',
    frequency:       'Monthly',
    mandatory:       true,
    dueDay:          10,
    gracePeriod:     5,
    lateFee:         0,
    effectiveFrom:   new Date().toISOString().slice(0, 7), // "YYYY-MM"
    allowInstalment: false,
    notes:           '',
  });
  const [fsRefresh, setFsRefresh] = useState(0);

  const openFeeStructureModal = (existing) => {
    if (existing) {
      setEditingFeeStructure(existing);
      setFeeStructureForm({
        batchId:         existing.batchId         || '',
        feeName:         existing.feeName         || existing.name || '',
        amount:          existing.amount          ?? '',
        frequency:       existing.frequency       || 'Monthly',
        mandatory:       existing.mandatory       !== false,
        dueDay:          existing.dueDay          ?? 10,
        gracePeriod:     existing.gracePeriod     ?? 5,
        lateFee:         existing.lateFee         ?? 0,
        effectiveFrom:   existing.effectiveFrom   || new Date().toISOString().slice(0, 7),
        allowInstalment: existing.allowInstalment ?? false,
        notes:           existing.notes           || '',
      });
    } else {
      setEditingFeeStructure(null);
      setFeeStructureForm({
        batchId:         '',
        feeName:         '',
        amount:          '',
        frequency:       'Monthly',
        mandatory:       true,
        dueDay:          10,
        gracePeriod:     5,
        lateFee:         0,
        effectiveFrom:   new Date().toISOString().slice(0, 7),
        allowInstalment: false,
        notes:           '',
      });
    }
    setFeeStructureModal(true);
  };

  const saveFeeStructure = () => {
    if (!feeStructureForm.batchId || !feeStructureForm.feeName || !feeStructureForm.amount) {
      alert('Please fill in Batch, Fee Name, and Amount.');
      return;
    }
    const allBatches = safeLS('pba_batches', []) || [];
    const batch = allBatches.find(b => b.id === feeStructureForm.batchId);
    const batchName = batch?.name || feeStructureForm.batchId;
    const existing = safeLS('pba_fee_structures', []) || [];
    const structPayload = {
      ...feeStructureForm,
      batchName,
      amount:          parseFloat(feeStructureForm.amount) || 0,
      dueDay:          parseInt(feeStructureForm.dueDay) || 10,
      gracePeriod:     feeStructureForm.gracePeriod === '' ? 5 : (parseInt(feeStructureForm.gracePeriod) ?? 5),
      lateFee:         parseFloat(feeStructureForm.lateFee) || 0,
      effectiveFrom:   feeStructureForm.effectiveFrom || new Date().toISOString().slice(0, 7),
      allowInstalment: !!feeStructureForm.allowInstalment,
      notes:           feeStructureForm.notes || '',
    };
    let updated;
    if (editingFeeStructure) {
      updated = existing.map(fs =>
        fs.id === editingFeeStructure.id
          ? { ...fs, ...structPayload }
          : fs
      );
    } else {
      updated = [...existing, {
        id: Date.now().toString(),
        ...structPayload,
      }];
    }
    saveLS('pba_fee_structures', updated);
    setFeeStructureModal(false);
    setFsRefresh(r => r + 1);
  };

  const deleteFeeStructure = (id) => {
    if (!window.confirm('Delete this fee structure?')) return;
    const existing = safeLS('pba_fee_structures', []) || [];
    saveLS('pba_fee_structures', existing.filter(fs => fs.id !== id));
    setFsRefresh(r => r + 1);
  };
  // ────────────────────────────────────────────────────────────


  // ── DERIVED LEDGER ─────────────────────────────────────────────────
  const allBatches    = safeLS('pba_batches',        []) || [];
  const allStudents   = safeLS('pba_students',       []) || [];
  const feeStructures = safeLS('pba_fee_structures', []) || [];
  const storedLedger  = safeLS('pba_fee_ledger',     []) || [];

  const getStudentDetails = (idStr) =>
    allStudents.find(s =>
      (s.id || s.regNo || s.studentId || '').toString() === idStr
    ) || {};

  const derivedLedger = [];
  allBatches.forEach(batch => {
    const feeStruct = feeStructures.find(fs => fs.batchId === batch.id);
    if (!feeStruct) return;
    (batch.students || []).forEach(batchStudent => {
      const studentIdStr = (
        batchStudent.id || batchStudent.regNo || batchStudent.studentId || ''
      ).toString();
      if (!studentIdStr) return;
      const studentDetails = getStudentDetails(studentIdStr);
      const studentName =
        batchStudent.name ||
        studentDetails.name ||
        studentDetails.studentName ||
        studentIdStr;
      const existing = storedLedger.find(e =>
        (e.studentId || '').toString() === studentIdStr &&
        e.batchId === batch.id
      );

      const today = new Date();
      const dueDay = feeStruct.dueDay || 10;
      const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
      // If that day has already passed this month, due date is next month
      if (dueDate < today) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      const dueDateStr = `${dueDate.getFullYear()}-${
        String(dueDate.getMonth() + 1).padStart(2, '0')}-${
        String(dueDay).padStart(2, '0')}`;

      const gracePeriod = feeStruct.gracePeriod ?? 5;
      const overdueDate = new Date(dueDate);
      overdueDate.setDate(overdueDate.getDate() + gracePeriod);

      if (existing) {
        let isOverdue = existing.isOverdue;
        if (existing.dueDate) {
          const d = new Date(existing.dueDate);
          const entryOverdueDate = new Date(d);
          entryOverdueDate.setDate(entryOverdueDate.getDate() + gracePeriod);
          isOverdue = existing.status !== 'Paid' && today > entryOverdueDate;
        } else {
          isOverdue = existing.status !== 'Paid' && today > overdueDate;
        }
        derivedLedger.push({
          ...existing,
          isOverdue,
          studentName,
          batchName: batch.name || existing.batchName,
          allowInstalment: feeStruct.allowInstalment ?? existing.allowInstalment ?? false,
          dueDay,
          gracePeriod,
          lateFee: feeStruct.lateFee || 0,
        });
      } else {
        const isOverdue = today > overdueDate;
        derivedLedger.push({
          id:          `${studentIdStr}_${batch.id}`,
          studentId:   studentIdStr,
          studentName,
          batchId:     batch.id,
          batchName:   batch.name || '',
          description: feeStruct.feeName || 'Monthly Fee',
          amountDue:   feeStruct.amount  || 0,
          amount:      feeStruct.amount  || 0,
          amountPaid:  0,
          balance:     feeStruct.amount  || 0,
          dueDate:     dueDateStr,
          status:      'Unpaid',
          isOverdue,
          allowInstalment: feeStruct.allowInstalment ?? false,
          dueDay,
          gracePeriod,
          lateFee:     feeStruct.lateFee || 0,
        });
      }
    });
  });
  const statusOrder = { Unpaid: 1, Partial: 1, Paid: 2 };
  derivedLedger.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2);
  });

  const displayedLedger = selectedBatchId
    ? derivedLedger.filter(e => e.batchId === selectedBatchId)
    : derivedLedger;

  const totalOutstanding = derivedLedger
    .filter(e => e.status !== 'Paid')
    .reduce((sum, e) => sum + (e.balance || e.amountDue || 0), 0);

  const totalCollections = derivedLedger
    .reduce((sum, e) => sum + (e.amountPaid || 0), 0);

  const activeFeeStructures = feeStructures.length;
  // ────────────────────────────────────────────────────────────

  // Record a payment and persist to pba_fee_ledger
  const recordPayment = (entryId, paidAmount) => {
    const amount = parseFloat(paidAmount) || 0;
    const entry  = derivedLedger.find(e => e.id === entryId);
    if (!entry) return;
    const newPaid    = (entry.amountPaid || 0) + amount;
    const total      = entry.amount || entry.amountDue || 0;
    const newBalance = Math.max(0, total - newPaid);
    const newStatus  = newBalance <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
    const updatedEntry = { ...entry, amountPaid: newPaid, balance: newBalance, status: newStatus, paidAt: new Date().toISOString() };
    const current = safeLS('pba_fee_ledger', []) || [];
    const idx = current.findIndex(e => e.id === entryId);
    const updated = idx >= 0
      ? current.map(e => e.id === entryId ? updatedEntry : e)
      : [...current, updatedEntry];
    saveLS('pba_fee_ledger', updated);
    setLedgerRefresh(r => r + 1);
  };

  const handleOpenPayment = (fee) => {
    setPaymentModalFee(fee);
    setPayForm({
      amount: (fee.amountDue || fee.amount || 0) - (fee.amountPaid || 0),
      date: new Date().toISOString().split("T")[0],
      method: "Bank Transfer",
      receiptNo: `REC-${Math.floor(10000 + Math.random() * 90000)}`
    });
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!paymentModalFee || !payForm.amount) return;
    const balance = paymentModalFee.balance ?? ((paymentModalFee.amountDue || paymentModalFee.amount || 0) - (paymentModalFee.amountPaid || 0));
    const amountVal = parseFloat(payForm.amount) || 0;
    if (paymentModalFee.allowInstalment === false && amountVal < balance) {
      alert(`Full payment of LKR ${balance.toLocaleString()} is required for this fee structure.`);
      return;
    }
    if (amountVal > balance) {
      alert(`Payment amount cannot exceed the outstanding balance of LKR ${balance.toLocaleString()}.`);
      return;
    }
    recordPayment(paymentModalFee.id, payForm.amount);
    setPaymentModalFee(null);
  };

  const handleExportCSV = () => {
    const headers = ["Student Name", "Batch", "Fee Description", "Due Date", "Amount Due (LKR)", "Amount Paid (LKR)", "Balance (LKR)", "Status"];
    const rows = displayedLedger.map((f) => [
      f.studentName,
      f.batchName || f.batch || '',
      f.description,
      f.dueDate,
      f.amountDue || f.amount || 0,
      f.amountPaid || 0,
      f.balance ?? ((f.amountDue || f.amount || 0) - (f.amountPaid || 0)),
      f.status,
    ]);
    exportToCSV("PBA_Fee_Collection_Report", headers, rows);
  };

  const getReminderMsg = (fee) => {
    const studentObj = (allStudents).find((s) => s.id === fee.studentId || s.name === fee.studentName) || {};
    const parentName = studentObj.parentPhone ? "Parent / Guardian" : "Parent";
    const balance = fee.balance ?? ((fee.amountDue || fee.amount || 0) - (fee.amountPaid || 0));
    return `Dear ${parentName},\n\nThis is a reminder from Platinum Business Academy.\n\nStudent: ${fee.studentName}\nBatch: ${fee.batchName || ''}\nOutstanding Amount: LKR ${balance.toLocaleString()}\nDue Date: ${fee.dueDate}\n\nPlease contact us to arrange payment.\n\nPBA Admin`;
  };

  const handleSendWhatsAppReminder = (fee) => {
    const studentObj = (allStudents).find((s) => s.id === fee.studentId || s.name === fee.studentName) || {};
    const phone = (studentObj.parentPhone || studentObj.phone || "").replace(/\D/g, "");
    const msgText = encodeURIComponent(getReminderMsg(fee));
    const targetPhone = phone.length >= 9 ? `94${phone.slice(-9)}` : "94770000000";
    window.open(`https://wa.me/${targetPhone}?text=${msgText}`, "_blank");
  };

  const handleCopyReminderText = (fee) => {
    const text = getReminderMsg(fee);
    navigator.clipboard.writeText(text);
    showToast("Fee reminder message copied to clipboard!", "success");
  };

  return (
    <div>
      {/* PATTERN B — Page Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: t.fontHeading, fontSize: '20px', fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            Fee Management & Financial Ledger
          </h2>
          <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
            Track student fee ledgers, process receipt payments, and dispatch WhatsApp payment reminders.
          </p>
        </div>
      </div>

      {/* Stat Tiles Row — Card Wrapper */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <div
          style={{
            background: theme.cardBg,
            border: "1px solid " + theme.cardBorder,
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            padding: "20px 22px"
          }}
        >
          <div style={{ fontSize: "12px", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>
            Total Outstanding Fees
          </div>
          <div style={{ fontFamily: t.fontHeading, fontSize: "28px", fontWeight: 800, color: theme.danger, marginTop: "4px" }}>
            LKR {totalOutstanding.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "2px" }}>Across active enrolled students</div>
        </div>

        <div
          style={{
            background: theme.cardBg,
            border: "1px solid " + theme.cardBorder,
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            padding: "20px 22px"
          }}
        >
          <div style={{ fontSize: "12px", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>
            Total Fee Collections
          </div>
          <div style={{ fontFamily: t.fontHeading, fontSize: "28px", fontWeight: 800, color: theme.gold, marginTop: "4px" }}>
            LKR {totalCollections.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "2px" }}>Collected this billing cycle</div>
        </div>

        <div
          style={{
            background: theme.cardBg,
            border: "1px solid " + theme.cardBorder,
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            padding: "20px 22px"
          }}
        >
          <div style={{ fontSize: "12px", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>
            Active Fee Structures
          </div>
          <div style={{ fontFamily: t.fontHeading, fontSize: "28px", fontWeight: 800, color: theme.accent, marginTop: "4px" }}>
            {activeFeeStructures}
          </div>
          <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "2px" }}>Batch fee schedules</div>
        </div>
      </div>

      {/* PATTERN C — Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#EEF0F4",
          padding: "4px",
          borderRadius: "10px",
          width: "fit-content",
          marginBottom: "20px"
        }}
      >
        <button
          onClick={() => setActiveTab("outstanding")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "outstanding" ? 600 : 500,
            color: activeTab === "outstanding" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "outstanding" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "outstanding" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <CreditCard size={16} /> Student Fee Ledgers & Payments
        </button>
        <button
          onClick={() => setActiveTab("structures")}
          style={{
            padding: "8px 18px",
            borderRadius: "7px",
            fontSize: "13px",
            fontWeight: activeTab === "structures" ? 600 : 500,
            color: activeTab === "structures" ? theme.accent : theme.textSecondary,
            border: "none",
            background: activeTab === "structures" ? "#FFFFFF" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: activeTab === "structures" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <DollarSign size={16} /> Batch Fee Structures
        </button>
      </div>

      {/* TAB 1: LEDGER & PAYMENTS */}
      {activeTab === "outstanding" && (
        <div
          style={{
            background: theme.cardBg,
            border: "1px solid " + theme.cardBorder,
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            overflow: "hidden"
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid #F4F5F7",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#FFFFFF"
            }}
          >
            <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
              <CreditCard size={18} style={{ color: theme.accent }} /> Student Fee Ledgers
            </span>
            <button
              onClick={handleExportCSV}
              style={{
                background: '#FFFFFF',
                color: theme.accent,
                border: '1.5px solid #BEE3F8',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Download size={14} /> Export Fee Report (CSV)
            </button>
          </div>

          {/* Filter Row */}
          <div style={{ padding: "16px 22px 0 22px", display: "flex", gap: "12px", alignItems: "center" }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Filter by Batch:</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              style={{
                width: "220px",
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
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxSizing: 'border-box'
              }}
              onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
            >
              <option value=''>All Batches</option>
              {allBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Table — PATTERN E */}
          <div style={{ padding: isMobileState ? "12px" : "16px 22px 22px 22px", overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
            <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA" }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Student Name</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Batch</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Description</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Due Date</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Amount Due</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Amount Paid</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Balance</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedLedger.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: '14px' }}>
                      No ledger entries. Enroll students in batches that have fee structures to auto-generate entries.
                    </td>
                  </tr>
                ) : displayedLedger.map((fee) => {
                  const balance = fee.balance ?? ((fee.amountDue || fee.amount || 0) - (fee.amountPaid || 0));
                  const amountDue = fee.amountDue || fee.amount || 0;
                  const isOverdue30Days = fee.status !== 'Paid' && new Date(fee.dueDate) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                  const studentObj = allStudents.find((s) => s.id === fee.studentId || s.name === fee.studentName) || {};

                  return (
                    <tr
                      key={fee.id}
                      style={{
                        background: isOverdue30Days ? theme.dangerLight : "transparent",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={(e) => {
                        if (!isOverdue30Days) e.currentTarget.style.background = "#F8FAFE";
                      }}
                      onMouseLeave={(e) => {
                        if (!isOverdue30Days) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                        {fee.studentName}
                        {isOverdue30Days && (
                          <span style={{ background: theme.dangerLight, color: theme.danger, border: '1px solid ' + theme.dangerBorder, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, marginLeft: '6px' }}>
                            &gt;30 Days Overdue
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                {fee.batchName || fee.batch || '—'}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                        {fee.description}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                        {fee.dueDate}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                        LKR {amountDue.toLocaleString()}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: theme.success, borderBottom: '1px solid #F4F5F7' }}>
                        LKR {(fee.amountPaid || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: balance > 0 ? theme.danger : theme.success, borderBottom: '1px solid #F4F5F7' }}>
                        LKR {balance.toLocaleString()}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                        {fee.status === "Paid" ? (
                          <span style={{ background: theme.successLight, color: theme.success, border: '1px solid ' + theme.successBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38A169', display: 'inline-block' }} />
                            Paid
                          </span>
                        ) : (
                          <span style={{ background: theme.dangerLight, color: theme.danger, border: '1px solid ' + theme.dangerBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E53E3E', display: 'inline-block' }} />
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {fee.status !== "Paid" ? (
                            <>
                              <button
                                onClick={() => handleOpenPayment(fee)}
                                style={{
                                  background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '7px 14px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(43,108,176,0.30)'
                                }}
                              >
                                Record Payment
                              </button>
                              <button
                                onClick={() => setReminderModalFee(fee)}
                                style={{
                                  background: '#FFFBEB',
                                  color: '#92400E',
                                  border: '1px solid #FCD34D',
                                  borderRadius: '8px',
                                  padding: '7px 14px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Send WhatsApp Fee Reminder"
                              >
                                <Send size={12} /> Send Reminder
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => printFeeReceiptPDF(fee, studentObj)}
                              style={{
                                background: 'linear-gradient(135deg, #D4A017, #B7860A)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '7px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(212,160,23,0.28)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Print Fee Receipt PDF"
                            >
                              <Printer size={12} /> Print Receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FEE STRUCTURES */}
      {activeTab === "structures" && (
        <div
          style={{
            background: theme.cardBg,
            border: "1px solid " + theme.cardBorder,
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid #F4F5F7",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#FFFFFF"
            }}
          >
            <span style={{ fontFamily: t.fontHeading, fontSize: "15px", fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
              <DollarSign size={18} style={{ color: theme.accent }} /> Batch Fee Structures
            </span>
            <button
              onClick={() => openFeeStructureModal(null)}
              style={{
                background: '#2563EB', color: 'white',
                border: 'none', borderRadius: '8px',
                padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              + Add Fee Structure
            </button>
          </div>

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
            <table style={{ minWidth: "850px", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA" }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Batch</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Fee Name</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Amount (LKR)</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Frequency</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Due Day</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Grace</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Late Fee</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Mandatory</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeStructures.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: '14px' }}>
                      No fee structures yet. Click "+ Add Fee Structure" to create one.
                    </td>
                  </tr>
                ) : feeStructures.map((fs) => (
                  <tr
                    key={fs.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {fs.batchName || fs.batch}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {fs.feeName || fs.name}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      LKR {(fs.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {fs.frequency}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {formatOrdinal(fs.dueDay || 10)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {(fs.gracePeriod !== undefined && fs.gracePeriod !== null ? fs.gracePeriod : 5) > 0
                        ? `${fs.gracePeriod !== undefined && fs.gracePeriod !== null ? fs.gracePeriod : 5} days`
                        : 'None'}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {fs.lateFee ? `LKR ${Number(fs.lateFee).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      {fs.mandatory !== false ? (
                        <span style={{ background: theme.successLight, color: theme.success, border: '1px solid ' + theme.successBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>Mandatory</span>
                      ) : (
                        <span style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>Optional</span>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openFeeStructureModal(fs)}
                          style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', color: '#374151' }}
                        >✏ Edit</button>
                        <button
                          onClick={() => deleteFeeStructure(fs.id)}
                          style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', color: '#DC2626' }}
                        >🗑 Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fee Structure Create/Edit Modal */}
      {feeStructureModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px 12px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px 32px', width: '520px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                {editingFeeStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
              </h3>
              <button onClick={() => setFeeStructureModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280' }}>×</button>
            </div>

            {/* Batch */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Batch *</label>
              <select
                value={feeStructureForm.batchId}
                onChange={e => setFeeStructureForm(f => ({ ...f, batchId: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', color: '#111827', background: 'white', boxSizing: 'border-box' }}
              >
                <option value=''>— Select batch —</option>
                {(safeLS('pba_batches', []) || []).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Fee Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Fee Name *</label>
              <input
                type='text'
                placeholder='e.g. Monthly Programme Fee'
                value={feeStructureForm.feeName}
                onChange={e => setFeeStructureForm(f => ({ ...f, feeName: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', color: '#111827', boxSizing: 'border-box' }}
              />
            </div>

            {/* Amount & Frequency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Amount (LKR) *</label>
                <input
                  type='number'
                  placeholder='e.g. 15000'
                  value={feeStructureForm.amount}
                  onChange={e => setFeeStructureForm(f => ({ ...f, amount: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', color: '#111827', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Frequency</label>
                <select
                  value={feeStructureForm.frequency}
                  onChange={e => setFeeStructureForm(f => ({ ...f, frequency: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', color: '#111827', background: 'white', boxSizing: 'border-box' }}
                >
                  <option>Monthly</option>
                  <option>Per Term</option>
                  <option>Annual</option>
                  <option>One-time</option>
                </select>
              </div>
            </div>

            {/* FIELD 1: Due Day of Month & FIELD 2: Grace Period */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Due Day of Month</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  placeholder="e.g. 10"
                  value={feeStructureForm.dueDay}
                  onChange={e => setFeeStructureForm(f =>
                    ({ ...f, dueDay: parseInt(e.target.value) || 10 }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', color: '#111827', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                  Fee is due on this day each month (e.g. 10 = 10th of every month)
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Grace Period (days)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  placeholder="e.g. 5"
                  value={feeStructureForm.gracePeriod}
                  onChange={e => setFeeStructureForm(f =>
                    ({ ...f, gracePeriod: parseInt(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', color: '#111827', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                  Days after due date before marked as Overdue (0 = immediate)
                </div>
              </div>
            </div>

            {/* FIELD 3: Late Fee & FIELD 4: Effective From */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Late Fee (LKR, 0 = none)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={feeStructureForm.lateFee}
                  onChange={e => setFeeStructureForm(f =>
                    ({ ...f, lateFee: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', color: '#111827', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                  Added to the balance once the grace period expires
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Effective From</label>
                <input
                  type="month"
                  value={feeStructureForm.effectiveFrom}
                  onChange={e => setFeeStructureForm(f =>
                    ({ ...f, effectiveFrom: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', color: '#111827', boxSizing: 'border-box', background: 'white' }}
                />
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                  Month from which this fee amount applies
                </div>
              </div>
            </div>

            {/* FIELD 5: Allow Instalment & Mandatory */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type='checkbox'
                  id='fsMandatory'
                  checked={feeStructureForm.mandatory}
                  onChange={e => setFeeStructureForm(f => ({ ...f, mandatory: e.target.checked }))}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor='fsMandatory' style={{ fontSize: '14px', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>Mandatory fee</label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="fsInstalment"
                  checked={feeStructureForm.allowInstalment}
                  onChange={e => setFeeStructureForm(f =>
                    ({ ...f, allowInstalment: e.target.checked }))}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="fsInstalment" style={{ fontSize: '14px', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
                  Allow partial/instalment payments
                </label>
              </div>
            </div>

            {/* FIELD 6: Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Notes (optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Includes lab fee and study materials"
                value={feeStructureForm.notes}
                onChange={e => setFeeStructureForm(f =>
                  ({ ...f, notes: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', color: '#111827', boxSizing: 'border-box', resize: 'vertical', minHeight: '60px', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setFeeStructureModal(false)}
                style={{ padding: '10px 20px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}
              >Cancel</button>
              <button
                onClick={saveFeeStructure}
                style={{ padding: '10px 24px', background: '#2563EB', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: 'white' }}
              >{editingFeeStructure ? 'Save Changes' : 'Add Fee Structure'}</button>
            </div>
          </div>
        </div>
      )}
        {/* Record Payment Modal */}
      {paymentModalFee && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: isMobileState ? 'flex-start' : 'center', justifyContent: 'center', padding: isMobileState ? '20px 12px' : '0', overflowY: 'auto' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: isMobileState ? '16px' : '28px', width: isMobileState ? '95vw' : '500px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', margin: isMobileState ? '20px auto' : 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.20)', position: 'relative' }}>
            <button
              onClick={() => setPaymentModalFee(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A202C', marginBottom: '16px' }}>
              Record Fee Payment
            </h3>
            <form onSubmit={handleSavePayment}>
              <div style={{ background: "#F8FAFC", padding: "12px 16px", borderRadius: "8px", border: "1px solid #E3E6EA", fontSize: "13px", color: theme.textSecondary, marginBottom: '16px' }}>
                <div>Student: <strong style={{ color: theme.textPrimary }}>{paymentModalFee.studentName}</strong></div>
                <div>Description: {paymentModalFee.description}</div>
                <div>Outstanding Balance: <strong style={{ color: theme.danger }}>LKR {(paymentModalFee.amountDue - (paymentModalFee.amountPaid || 0)).toLocaleString()}</strong></div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Amount Received (LKR)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentModalFee.balance ?? ((paymentModalFee.amountDue || paymentModalFee.amount || 0) - (paymentModalFee.amountPaid || 0))}
                  readOnly={paymentModalFee.allowInstalment === false}
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 13px',
                    background: paymentModalFee.allowInstalment === false ? '#F9FAFB' : '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1A202C',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box',
                    cursor: paymentModalFee.allowInstalment === false ? 'not-allowed' : 'text'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                />
                {paymentModalFee.allowInstalment === false && (
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                    Full payment required for this fee structure (instalments disabled)
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Payment Method
                </label>
                <select
                  value={payForm.method}
                  onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
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
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Receipt Number
                </label>
                <input
                  type="text"
                  required
                  value={payForm.receiptNo}
                  onChange={(e) => setPayForm({ ...payForm, receiptNo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 13px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1A202C',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={payForm.date}
                  onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 13px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1A202C',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F4F5F7' }}>
                <button type="button" onClick={() => setPaymentModalFee(null)} style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #E3E6EA', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2F855A, #276749)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(47,133,90,0.30)' }}>
                  Save Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Fee Reminder Modal */}
      {reminderModalFee && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: isMobileState ? 'flex-start' : 'center', justifyContent: 'center', padding: isMobileState ? '20px 12px' : '0', overflowY: 'auto' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: isMobileState ? '16px' : '28px', width: isMobileState ? '95vw' : '500px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', margin: isMobileState ? '20px auto' : 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.20)', position: 'relative' }}>
            <button
              onClick={() => setReminderModalFee(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A202C', marginBottom: '12px' }}>
              Send Fee Reminder via WhatsApp
            </h3>
            <p style={{ fontSize: "13px", color: theme.textMuted, marginBottom: "12px" }}>
              Pre-filled payment reminder message for parent:
            </p>
            <pre
              style={{
                background: "#F8FAFC",
                border: "1.5px solid #E3E6EA",
                borderRadius: "8px",
                padding: "14px",
                fontSize: "12px",
                fontFamily: "'Inter', monospace",
                whiteSpace: "pre-wrap",
                color: theme.textPrimary,
                lineHeight: 1.6
              }}
            >
              {getReminderMsg(reminderModalFee)}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F4F5F7' }}>
              <button type="button" onClick={() => setReminderModalFee(null)} style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #E3E6EA', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              <button type="button" onClick={() => handleCopyReminderText(reminderModalFee)} style={{ background: '#EBF4FF', color: '#2B6CB0', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Copy Message</button>
              <button
                type="button"
                onClick={() => {
                  handleSendWhatsAppReminder(reminderModalFee);
                  setReminderModalFee(null);
                }}
                style={{ background: '#25D366', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,211,102,0.30)' }}
              >
                Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
