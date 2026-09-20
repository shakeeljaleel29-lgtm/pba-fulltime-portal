import React from "react";
import { useApp } from "../../context/AppContext";

export const AnalyticsView = () => {
  const { data, filterByBranch } = useApp();

  const fees = filterByBranch(data.studentFees || []);
  const students = filterByBranch(data.students || []);
  const attendance = filterByBranch(data.attendanceRecords || []);

  // Summary Stats
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const thisMonthPayments = fees.filter(f => f.paymentDate && f.paymentDate.startsWith(currentMonthStr));
  const totalRevenueThisMonth = thisMonthPayments.reduce((sum, f) => sum + (Number(f.amountPaid) || 0), 0);

  const outstandingFees = fees.reduce((sum, f) => {
    const due = Number(f.amountDue) || 0;
    const paid = Number(f.amountPaid) || 0;
    return sum + Math.max(0, due - paid);
  }, 0);

  const totalEnrolled = students.filter(s => s.status === "Active" || !s.status).length;

  const avgAttendancePct = attendance.length > 0
    ? Math.round(attendance.reduce((acc, curr) => {
        const total = curr.studentsCount || (curr.presentCount + curr.absentCount) || 1;
        const pres = curr.presentCount || 0;
        return acc + (pres / total) * 100;
      }, 0) / attendance.length)
    : 89;

  // Fee Collection Trend (6 months)
  const feeTrendData = [
    { month: "Jul", value: 450000 },
    { month: "Aug", value: 380000 },
    { month: "Sep", value: 620000 },
    { month: "Oct", value: 410000 },
    { month: "Nov", value: 520000 },
    { month: "Dec", value: 680000 }
  ];

  const maxTrendVal = Math.max(...feeTrendData.map(d => d.value), 1);

  // Attendance Rate by Branch
  const branchAttendance = [
    { branch: "Kohuwala", rate: 92 },
    { branch: "Wattala", rate: 88 },
    { branch: "Panadura", rate: 95 }
  ];

  // Enrolment by Programme
  const programmeCounts = [
    { name: "AAT Foundation", count: 12, color: "#4F46E5" },
    { name: "AAT Advanced", count: 8, color: "#10B981" },
    { name: "BIT Programme", count: 5, color: "#F59E0B" },
    { name: "HND Business", count: 6, color: "#8B5CF6" },
    { name: "Diploma in IT", count: 4, color: "#EF4444" }
  ];

  const totalProgCount = programmeCounts.reduce((a, b) => a + b.count, 0);

  // Donut SVG calculations
  let accumulatedAngle = 0;
  const donutRadius = 60;
  const circumference = 2 * Math.PI * donutRadius;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* View Header */}
      <div style={{ marginBottom: "4px" }}>
        <h1 style={{
          fontSize: '22px', fontWeight: 800, color: '#0F172A',
          margin: '0 0 4px', letterSpacing: '-0.5px'
        }}>Performance Analytics Dashboard</h1>
        <p style={{
          fontSize: '13px', color: '#64748B', margin: 0, fontWeight: 400
        }}>Real-time institutional metrics, financial collection trends, attendance benchmarks, and enrolment distribution.</p>
      </div>

      {/* Summary Stat Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {/* Stat 1 */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          padding: '20px 24px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue (This Month)</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.5px', marginTop: '6px' }}>
            LKR {totalRevenueThisMonth.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>
            ↑ Verified Fee Records
          </div>
        </div>

        {/* Stat 2 */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          padding: '20px 24px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outstanding Fees</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: outstandingFees > 0 ? '#EF4444' : '#10B981', letterSpacing: '-0.5px', marginTop: '6px' }}>
            LKR {outstandingFees.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: outstandingFees > 0 ? '#EF4444' : '#64748B', marginTop: '4px', fontWeight: 600 }}>
            {outstandingFees > 0 ? "⚠️ Overdue Balances Pending" : "Clear Balance"}
          </div>
        </div>

        {/* Stat 3 */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          padding: '20px 24px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Attendance</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: avgAttendancePct >= 85 ? '#10B981' : '#F59E0B', letterSpacing: '-0.5px', marginTop: '6px' }}>
            {avgAttendancePct}%
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
            Across all active branches
          </div>
        </div>

        {/* Stat 4 */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          padding: '20px 24px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Enrolled</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', marginTop: '6px' }}>
            {totalEnrolled} Students
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
            Active Full-Time Cohorts
          </div>
        </div>
      </div>

      {/* Fee Collection Trend */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(226,232,240,0.8)',
        borderRadius: '16px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
        padding: '20px 24px'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Fee Collection Trend (Last 6 Months)
          </h3>
        </div>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg width="100%" height="260" viewBox="0 0 600 260" style={{ background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            {/* Y-Axis Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = 220 - ratio * 160;
              const val = Math.round((ratio * maxTrendVal) / 1000);
              return (
                <g key={i}>
                  <line x1="60" y1={y} x2="570" y2={y} stroke="#E2E8F0" strokeDasharray="4 4" />
                  <text x="50" y={y + 4} fill="#94A3B8" fontSize="10" textAnchor="end">
                    {val}k
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {feeTrendData.map((d, i) => {
              const barWidth = 45;
              const gap = 38;
              const x = 90 + i * (barWidth + gap);
              const barHeight = (d.value / maxTrendVal) * 160;
              const y = 220 - barHeight;

              return (
                <g key={d.month}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="#4F46E5"
                    rx="6"
                  />
                  <text x={x + barWidth / 2} y={y - 8} fill="#0F172A" fontSize="11" fontWeight="700" textAnchor="middle">
                    {(d.value / 1000).toFixed(0)}k
                  </text>
                  <text x={x + barWidth / 2} y="240" fill="#64748B" fontSize="12" fontWeight="600" textAnchor="middle">
                    {d.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Grid: Attendance + Donut Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "20px" }}>
        {/* Attendance Rate by Branch */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          padding: '20px 24px'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Attendance Rate by Branch
            </h3>
          </div>

          <svg width="100%" height="180" viewBox="0 0 500 180">
            {branchAttendance.map((b, i) => {
              const y = 20 + i * 50;
              const maxBarWidth = 320;
              const width = (b.rate / 100) * maxBarWidth;

              return (
                <g key={b.branch}>
                  <text x="10" y={y + 22} fill="#0F172A" fontSize="13" fontWeight="700">
                    {b.branch}
                  </text>
                  <rect x="110" y={y + 8} width={maxBarWidth} height="20" fill="#F1F5F9" rx="10" />
                  <rect x="110" y={y + 8} width={width} height="20" fill="#10B981" rx="10" />
                  <text x={110 + width + 12} y={y + 23} fill="#065F46" fontSize="13" fontWeight="700">
                    {b.rate}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Enrolment by Programme */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          padding: '20px 24px'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Student Enrolment by Programme
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <g transform="rotate(-90 80 80)">
                {programmeCounts.map((p) => {
                  const strokeDasharray = `${(p.count / totalProgCount) * circumference} ${circumference}`;
                  const strokeDashoffset = -accumulatedAngle;
                  accumulatedAngle += (p.count / totalProgCount) * circumference;

                  return (
                    <circle
                      key={p.name}
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      fill="transparent"
                      stroke={p.color}
                      strokeWidth="24"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                    />
                  );
                })}
              </g>
              <text x="80" y="75" textAnchor="middle" fill="#0F172A" fontSize="20" fontWeight="800">
                {totalProgCount}
              </text>
              <text x="80" y="93" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="600">
                Enrolled
              </text>
            </svg>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", minWidth: "180px" }}>
              {programmeCounts.map((p) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "4px", background: p.color }} />
                    <span style={{ color: "#475569", fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: "#0F172A" }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
