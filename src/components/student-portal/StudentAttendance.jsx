import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { CalendarCheck, CheckCircle2, XCircle, Clock } from "lucide-react";

export const StudentAttendance = ({ student }) => {
  const { data } = useApp();

  // Student specific attendance records
  const studentAttendanceRecords = [
    { id: "att-1", date: "2026-09-18", subject: "Business Studies", status: "Present", markedBy: "Mr. Gamini Silva" },
    { id: "att-2", date: "2026-09-17", subject: "Accounting", status: "Present", markedBy: "Ms. Keshani Perera" },
    { id: "att-3", date: "2026-09-16", subject: "Economics", status: "Present", markedBy: "Dr. Ravindra Fernando" },
    { id: "att-4", date: "2026-09-15", subject: "Business Studies", status: "Present", markedBy: "Mr. Gamini Silva" },
    { id: "att-5", date: "2026-09-14", subject: "Accounting", status: "Absent", markedBy: "Ms. Keshani Perera" },
    { id: "att-6", date: "2026-09-11", subject: "Economics", status: "Present", markedBy: "Dr. Ravindra Fernando" },
    { id: "att-7", date: "2026-09-10", subject: "General English", status: "Present", markedBy: "Ms. Dilini Jayasinghe" }
  ];

  const totalClasses = studentAttendanceRecords.length;
  const presentCount = studentAttendanceRecords.filter((r) => r.status === "Present" || r.status === "Late").length;
  const absentCount = totalClasses - presentCount;
  const attendancePct = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

  const rateColor = attendancePct >= 90 ? "#276749" : attendancePct >= 75 ? "#B7860A" : "#C53030";
  const barColor = attendancePct >= 90 ? "#48BB78" : attendancePct >= 75 ? "#ECC94B" : "#FC8181";

  const getSubjectColor = (subjName) => {
    const found = (data?.subjects || []).find((s) => s.name === subjName || s.code === subjName);
    return found?.color || "#2B6CB0";
  };

  const getSubjectCode = (subjName) => {
    const found = (data?.subjects || []).find((s) => s.name === subjName || s.code === subjName);
    return found?.code || subjName?.substring(0, 3)?.toUpperCase() || "SUB";
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* SECTION A — Summary Stats Row (4 widgets in a grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {/* Widget 1: Total Classes */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Classes</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Sora', sans-serif", color: '#1A202C' }}>{totalClasses}</div>
          <div style={{ fontSize: '11px', color: '#718096' }}>Conducted to date</div>
        </div>

        {/* Widget 2: Present */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Present</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Sora', sans-serif", color: '#276749' }}>{presentCount}</div>
          <div style={{ fontSize: '11px', color: '#718096' }}>Attended sessions</div>
        </div>

        {/* Widget 3: Absent */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Absent</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Sora', sans-serif", color: '#C53030' }}>{absentCount}</div>
          <div style={{ fontSize: '11px', color: '#718096' }}>Missed sessions</div>
        </div>

        {/* Widget 4: Attendance Rate */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance Rate</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Sora', sans-serif", color: rateColor }}>{attendancePct}%</div>
          <div style={{ fontSize: '11px', color: '#718096' }}>Overall compliance</div>
        </div>
      </div>

      {/* SECTION B — Attendance Rate Progress Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A202C', fontFamily: "'Sora', sans-serif" }}>Attendance Rate</span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: rateColor, fontFamily: "'Sora', sans-serif" }}>{attendancePct}%</span>
        </div>
        <div style={{ height: '10px', borderRadius: '10px', background: '#E2E8F0', overflow: 'hidden' }}>
          <div style={{ width: `${attendancePct}%`, height: '100%', borderRadius: '10px', background: barColor, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* SECTION C — Attendance History Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #F4F5F7', display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF' }}>
          <CalendarCheck size={18} style={{ color: '#2B6CB0' }} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontSize: '15px', fontWeight: 700, color: '#1A202C' }}>My Attendance History</span>
        </div>

        {studentAttendanceRecords.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left', width: '36px' }}>#</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left' }}>Marked By</th>
                </tr>
              </thead>
              <tbody>
                {studentAttendanceRecords.map((r, idx) => {
                  const sColor = getSubjectColor(r.subject);
                  const sCode = getSubjectCode(r.subject);
                  const isLast = idx === studentAttendanceRecords.length - 1;

                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: isLast ? 'none' : '1px solid #F0F2F5', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#A0AEC0', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#1A202C' }}>{r.date}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1A202C' }}>
                        <span style={{
                          background: sColor + '20', color: sColor,
                          fontSize: '10px', fontWeight: 800, padding: '2px 7px',
                          borderRadius: '10px', marginRight: '8px'
                        }}>
                          {sCode}
                        </span>
                        {r.subject}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.status === "Present" && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#F0FFF4', color: '#276749', border: '1px solid #9AE6B4' }}>
                            <CheckCircle2 size={12} /> Present
                          </span>
                        )}
                        {r.status === "Late" && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#FEF3C7', color: '#B7860A', border: '1px solid #F6D860' }}>
                            <Clock size={12} /> Late
                          </span>
                        )}
                        {r.status === "Absent" && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2' }}>
                            <XCircle size={12} /> Absent
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#718096' }}>{r.markedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <svg width="40" height="40" fill="none" stroke="#CBD5E0" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p style={{ fontSize: '13px', color: '#A0AEC0', marginTop: '12px' }}>
              No attendance records yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
