import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { CreditCard, DollarSign, Download, Printer, Send } from "lucide-react";
import { printFeeReceiptPDF } from "../../utils/pdfGenerator";

import { T, theme, type as t } from "../../theme";

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
  const [filterBatch, setFilterBatch] = useState("All");

  const totalOutstanding = data.studentFees
    .filter((f) => f.status !== "Paid")
    .reduce((sum, f) => sum + (f.amountDue - (f.amountPaid || 0)), 0);

  const filteredFees = data.studentFees.filter((f) => filterBatch === "All" || f.batch === filterBatch);

  const handleOpenPayment = (fee) => {
    setPaymentModalFee(fee);
    setPayForm({
      amount: fee.amountDue - (fee.amountPaid || 0),
      date: new Date().toISOString().split("T")[0],
      method: "Bank Transfer",
      receiptNo: `REC-${Math.floor(10000 + Math.random() * 90000)}`
    });
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!paymentModalFee || !payForm.amount) return;
    recordFeePayment(paymentModalFee.id, payForm);
    setPaymentModalFee(null);
  };

  const handleExportCSV = () => {
    const headers = ["Student Name", "Batch", "Fee Description", "Due Date", "Amount Due (LKR)", "Amount Paid (LKR)", "Balance (LKR)", "Status", "Receipt No"];
    const rows = filteredFees.map((f) => [
      f.studentName,
      f.batch,
      f.description,
      f.dueDate,
      f.amountDue,
      f.amountPaid || 0,
      f.amountDue - (f.amountPaid || 0),
      f.status,
      f.receiptNo || "-"
    ]);
    exportToCSV("PBA_Fee_Collection_Report", headers, rows);
  };

  const getReminderMsg = (fee) => {
    const studentObj = (data.students || []).find((s) => s.id === fee.studentId || s.name === fee.studentName) || {};
    const parentName = studentObj.parentPhone ? "Parent / Guardian" : "Parent";
    const balance = fee.amountDue - (fee.amountPaid || 0);

    return `Dear ${parentName},\n\nThis is a reminder from Platinum Business Academy.\n\nStudent: ${fee.studentName}\nOutstanding Amount: LKR ${balance.toLocaleString()}\nDue Date: ${fee.dueDate}\n\nPlease contact us to arrange payment.\n\nPBA Admin`;
  };

  const handleSendWhatsAppReminder = (fee) => {
    const studentObj = (data.students || []).find((s) => s.id === fee.studentId || s.name === fee.studentName) || {};
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
            LKR 30,000
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
            3
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
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
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
              <option value="All">All Batches</option>
              {data.batches.map((b) => (
                <option key={b.id} value={b.name}>
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
                {filteredFees.map((fee) => {
                  const balance = fee.amountDue - (fee.amountPaid || 0);
                  const isOverdue30Days = fee.status === "Unpaid" && new Date(fee.dueDate) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                  const studentObj = (data.students || []).find((s) => s.id === fee.studentId || s.name === fee.studentName) || {};

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
                        {fee.batch}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                        {fee.description}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                        {fee.dueDate}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                        LKR {fee.amountDue.toLocaleString()}
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
          </div>

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "12px" }}>
            <table style={{ minWidth: "600px", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F9FA" }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Batch</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Fee Name</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Amount (LKR)</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Frequency</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left', whiteSpace: 'nowrap' }}>Mandatory</th>
                </tr>
              </thead>
              <tbody>
                {data.feeStructures.map((fs) => (
                  <tr
                    key={fs.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {fs.batch}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      {fs.name}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>
                      LKR {fs.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>
                      {fs.frequency}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                      <span style={{ background: theme.successLight, color: theme.success, border: '1px solid ' + theme.successBorder, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                        Mandatory
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
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
