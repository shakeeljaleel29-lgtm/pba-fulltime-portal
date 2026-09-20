import React from "react";
import { useApp } from "../../context/AppContext";
import { CreditCard, Printer, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { printFeeReceiptPDF } from "../../utils/pdfGenerator";

export const StudentFees = ({ student }) => {
  const { data } = useApp();

  // Find fee records for student
  const studentFees = (data.studentFees || []).filter(
    (f) => f.studentId === student.id || f.studentName === student.name
  );

  const totalFee = studentFees.reduce((sum, f) => sum + (Number(f.amountDue || f.amountPaid) || 0), 45000);
  const amountPaid = studentFees.reduce((sum, f) => sum + (Number(f.amountPaid) || 0), 30000);
  const outstanding = Math.max(0, totalFee - amountPaid);
  const nextDueDate = "15 Oct 2026";

  const paymentsList = studentFees.length > 0 ? studentFees : [
    { id: "pf-1", paymentDate: "2026-09-08", description: "Term 1 Programme Fee", amountPaid: 15000, status: "Paid", receiptNo: "REC-90812", method: "Bank Transfer" },
    { id: "pf-2", paymentDate: "2026-08-05", description: "Enrolment & Book Fee", amountPaid: 15000, status: "Paid", receiptNo: "REC-80501", method: "Cash" },
    { id: "pf-3", paymentDate: null, description: "Term 2 Programme Fee", amountDue: 15000, amountPaid: 0, dueDate: "2026-10-15", status: "Unpaid", receiptNo: null, method: "Online Pending" }
  ];

  const upcomingPayments = paymentsList.filter(p => p.status !== "Paid");

  const handleDownloadStatement = () => {
    printFeeReceiptPDF({
      receiptNo: `STATEMENT-${student.regNo}`,
      paymentDate: new Date().toISOString().split("T")[0],
      amountPaid: amountPaid,
      studentName: student.name,
      studentId: student.regNo,
      branch: student.branch,
      batch: student.batch,
      description: "Full Academic Fee Statement",
      status: "Statement Issued",
      paymentMethod: "Bank/Cash History"
    }, student);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Page Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1A202C', fontFamily: "'Sora', sans-serif", margin: 0 }}>
          My Fee Account & Payment History
        </h2>
        <button
          onClick={handleDownloadStatement}
          style={{
            background: '#2B6CB0', color: '#FFFFFF', border: 'none', borderRadius: '8px',
            padding: '9px 18px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Inter', sans-serif"
          }}
        >
          <Printer size={14} /> Download Fee Statement (PDF)
        </button>
      </div>

      {/* SECTION A — Fee Account Summary (4 stat widgets) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {/* Widget 1: Total Programme Fee */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Programme Fee</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Sora', sans-serif", color: '#1A202C' }}>
            LKR {totalFee.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#718096' }}>Total Course Fee</div>
        </div>

        {/* Widget 2: Amount Paid */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Paid</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Sora', sans-serif", color: '#276749' }}>
            LKR {amountPaid.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#718096' }}>
            {outstanding === 0 ? "✓ Fully settled" : "Settled to date"}
          </div>
        </div>

        {/* Widget 3: Outstanding Balance */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outstanding Balance</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Sora', sans-serif", color: outstanding > 0 ? '#C53030' : '#276749' }}>
            LKR {outstanding.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#718096' }}>
            {outstanding > 0 ? "Pending payment" : "Clear"}
          </div>
        </div>

        {/* Widget 4: Next Payment Due */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Payment Due</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Sora', sans-serif", color: '#2B6CB0' }}>
            {nextDueDate}
          </div>
          <div style={{ fontSize: '11px', color: '#718096' }}>
            {outstanding > 0 ? `LKR ${outstanding.toLocaleString()} Due` : "No pending due"}
          </div>
        </div>
      </div>

      {/* SECTION B — Payment History Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #F4F5F7', display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF' }}>
          <CreditCard size={18} style={{ color: '#2B6CB0' }} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontSize: '15px', fontWeight: 700, color: '#1A202C' }}>Payment History & Receipts</span>
        </div>

        {paymentsList.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left', width: '36px' }}>#</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left' }}>Method / Receipt</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentsList.map((f, idx) => {
                  const isLast = idx === paymentsList.length - 1;
                  const amt = Number(f.amountPaid || f.amountDue || 0);

                  return (
                    <tr
                      key={f.id || idx}
                      style={{ borderBottom: isLast ? 'none' : '1px solid #F0F2F5', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#A0AEC0', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#1A202C' }}>
                        {f.paymentDate || f.dueDate || "Pending"}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1A202C' }}>{f.description}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#1A202C', textAlign: 'right' }}>
                        LKR {amt.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#718096' }}>
                        {f.receiptNo ? `Receipt: ${f.receiptNo}` : (f.method || "—")}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {f.status === "Paid" && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#F0FFF4', color: '#276749', border: '1px solid #9AE6B4' }}>
                            <CheckCircle2 size={12} /> Paid
                          </span>
                        )}
                        {(f.status === "Unpaid" || f.status === "Pending") && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#FEF3C7', color: '#B7860A', border: '1px solid #F6D860' }}>
                            <Clock size={12} /> Pending
                          </span>
                        )}
                        {f.status === "Overdue" && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2' }}>
                            <AlertCircle size={12} /> Overdue
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <svg width="40" height="40" fill="none" stroke="#CBD5E0" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontSize: '13px', color: '#A0AEC0', marginTop: '12px' }}>
              No payment records yet
            </p>
          </div>
        )}
      </div>

      {/* SECTION C — Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1A202C', fontFamily: "'Sora', sans-serif", marginBottom: '16px' }}>
            Upcoming Payments
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {upcomingPayments.map((p, idx) => {
              const isLast = idx === upcomingPayments.length - 1;
              const isOverdue = p.status === "Overdue";
              const amt = Number(p.amountDue || p.amountPaid || 0);

              return (
                <div
                  key={p.id || idx}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid #F0F2F5'
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#718096', fontWeight: 600 }}>
                    Due: {p.dueDate || "Upcoming"}
                  </div>
                  <div style={{ fontSize: '13px', color: '#1A202C', fontWeight: 600 }}>
                    {p.description}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: isOverdue ? '#C53030' : '#2B6CB0', fontFamily: "'Sora', sans-serif" }}>
                    LKR {amt.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
