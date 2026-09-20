import React from "react";
import { Printer, X } from "lucide-react";

export const ReportCardModal = ({ student, examResults = [], onClose }) => {
  if (!student) return null;

  // Default subject breakdown if no exam results logged yet
  const subjectsData =
    examResults.length > 0
      ? examResults
      : [
          { subject: "Business Studies", marks: 88, maxMarks: 100, percentage: 88, grade: "A" },
          { subject: "Accounting", marks: 84, maxMarks: 100, percentage: 84, grade: "A" },
          { subject: "Economics", marks: 78, maxMarks: 100, percentage: 78, grade: "B" }
        ];

  const totalMarks = subjectsData.reduce((sum, s) => sum + s.marks, 0);
  const totalMax = subjectsData.reduce((sum, s) => sum + s.maxMarks, 0);
  const overallPercent = Math.round((totalMarks / totalMax) * 100);
  const isPass = overallPercent >= 50;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-lg">
        <div className="modal-header no-print">
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Official Digital Report Card</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-sm btn-primary" onClick={handlePrint}>
              <Printer size={14} /> Print / Download PDF
            </button>
            <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: "32px", backgroundColor: "#FFFFFF" }}>
          {/* PBA Institutional Header */}
          <div
            style={{
              textAlign: "center",
              borderBottom: "3px double #1A3566",
              paddingBottom: "16px",
              marginBottom: "24px"
            }}
          >
            <div
              style={{
                fontFamily: "Sora, sans-serif",
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#1A3566",
                letterSpacing: "0.5px"
              }}
            >
              PLATINUM BUSINESS ACADEMY
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#2563EB", textTransform: "uppercase" }}>
              Full-Time Programme — Academic Report Card
            </div>
            <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "2px" }}>
              No. 124, Academy Boulevard, Colombo 03, Sri Lanka | Email: info@pba.edu.lk
            </div>
          </div>

          {/* Student Profile Info Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              padding: "16px",
              backgroundColor: "#F8FAFC",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              marginBottom: "24px"
            }}
          >
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Student Name:</div>
              <strong style={{ fontSize: "1rem", color: "#1E293B" }}>{student.name}</strong>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Registration Number:</div>
              <strong style={{ fontSize: "1rem", color: "#2563EB" }}>{student.regNo}</strong>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Batch Enrolled:</div>
              <div style={{ fontWeight: 600 }}>{student.batch}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Assessment Term:</div>
              <div style={{ fontWeight: 600 }}>Term 2 — Mid-Term Evaluation 2026</div>
            </div>
          </div>

          {/* Marks Breakdown Table */}
          <div className="table-container" style={{ marginBottom: "24px" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Enrolled Subject</th>
                  <th style={{ textAlign: "center" }}>Marks Obtained</th>
                  <th style={{ textAlign: "center" }}>Max Marks</th>
                  <th style={{ textAlign: "center" }}>Percentage</th>
                  <th style={{ textAlign: "center" }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {subjectsData.map((sb, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{sb.subject}</strong>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{sb.marks}</td>
                    <td style={{ textAlign: "center", color: "#64748B" }}>{sb.maxMarks}</td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{sb.percentage}%</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${sb.grade === "A" ? "badge-success" : sb.grade === "B" ? "badge-info" : "badge-warning"}`}>
                        {sb.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Overall Summary Box */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              backgroundColor: isPass ? "#D1FAE5" : "#FEF2F2",
              borderRadius: "10px",
              border: `1px solid ${isPass ? "#059669" : "#DC2626"}`,
              marginBottom: "32px"
            }}
          >
            <div>
              <div style={{ fontSize: "0.85rem", color: "#475569" }}>Overall Performance Summary:</div>
              <strong style={{ fontSize: "1.1rem", color: isPass ? "#065F46" : "#991B1B" }}>
                Total: {totalMarks} / {totalMax} ({overallPercent}%)
              </strong>
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: isPass ? "#059669" : "#DC2626" }}>
              FINAL RESULT: {isPass ? "PASS" : "FAIL"}
            </div>
          </div>

          {/* Signatures Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "20px" }}>
            <div style={{ textAlign: "center", width: "180px" }}>
              <div style={{ borderBottom: "1px solid #1E293B", marginBottom: "6px" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 600 }}>Programme Coordinator</div>
            </div>
            <div style={{ textAlign: "center", width: "180px" }}>
              <div style={{ borderBottom: "1px solid #1E293B", marginBottom: "6px" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 600 }}>Principal (Dr. K. Liyanage)</div>
            </div>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
};
