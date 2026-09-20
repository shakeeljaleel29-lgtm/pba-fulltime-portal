import React from "react";
import { GraduationCap, Calendar, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

export const ParentSummaryView = ({ student, onClose }) => {
  if (!student) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#F0F4FB",
        zIndex: 200,
        overflowY: "auto",
        padding: "20px 16px"
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          overflow: "hidden",
          border: "1px solid #E2E8F0"
        }}
      >
        {/* PBA Header */}
        <div style={{ backgroundColor: "#1A3566", color: "#FFFFFF", padding: "24px 20px", textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "#2563EB",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              fontWeight: 800,
              fontSize: "1.3rem"
            }}
          >
            PBA
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "4px" }}>
            PLATINUM BUSINESS ACADEMY
          </h2>
          <div style={{ fontSize: "0.82rem", color: "#93C5FD", fontWeight: 600 }}>
            Parent Information & Academic Summary Portal
          </div>
        </div>

        {/* Student Bio Strip */}
        <div style={{ padding: "20px", backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1E293B" }}>{student.name}</h3>
              <div style={{ fontSize: "0.82rem", color: "#2563EB", fontWeight: 600 }}>Reg No: {student.regNo}</div>
              <div style={{ fontSize: "0.82rem", color: "#64748B" }}>Enrolled in {student.batch}</div>
            </div>
            {onClose && (
              <button className="btn btn-sm btn-secondary" onClick={onClose}>
                Back to Admin
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: "20px" }}>
          {/* Attendance Progress Card */}
          <div className="card" style={{ padding: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Calendar size={18} style={{ color: "#059669" }} />
              <strong style={{ fontSize: "0.95rem" }}>Monthly Attendance Rate</strong>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#059669" }}>96%</span>
              <span className="badge badge-success">Good Attendance</span>
            </div>

            <div style={{ height: "10px", background: "#E2E8F0", borderRadius: "5px", overflow: "hidden", marginBottom: "8px" }}>
              <div style={{ width: "96%", height: "100%", background: "#059669" }} />
            </div>
            <div style={{ fontSize: "0.78rem", color: "#64748B" }}>Present: 29 Sessions | Late: 2 Sessions | Absent: 1 Session</div>
          </div>

          {/* Latest Report Card Summary */}
          <div className="card" style={{ padding: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <GraduationCap size={18} style={{ color: "#2563EB" }} />
              <strong style={{ fontSize: "0.95rem" }}>Latest Term Test Evaluation</strong>
            </div>

            <div className="table-container" style={{ marginBottom: "8px" }}>
              <table className="custom-table" style={{ fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Business Studies</td>
                    <td>88 / 100</td>
                    <td>
                      <span className="badge badge-success">A</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Accounting</td>
                    <td>84 / 100</td>
                    <td>
                      <span className="badge badge-success">A</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Economics</td>
                    <td>78 / 100</td>
                    <td>
                      <span className="badge badge-info">B</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.85rem", fontWeight: 700, color: "#059669" }}>
              Overall Evaluation: PASS (83.3%)
            </div>
          </div>

          {/* Active Notices & Admin Message */}
          <div className="card" style={{ padding: "16px", backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <ShieldAlert size={18} style={{ color: "#D97706" }} />
              <strong style={{ fontSize: "0.9rem", color: "#92400E" }}>Message from Administration</strong>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#78350F" }}>
              {student.adminNotes || "Dear Parent, your child is making great academic progress in full-time morning classes."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px", textAlign: "center", fontSize: "0.75rem", color: "#94A3B8", borderTop: "1px solid #E2E8F0" }}>
          Platinum Business Academy Full-Time Programme Administration System
        </div>
      </div>
    </div>
  );
};
