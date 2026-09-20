import React from "react";
import { useApp } from "../../context/AppContext";
import { Calendar, Clock, CheckCircle2, FileText } from "lucide-react";

export const StudentDashboard = ({ student, isMobile }) => {
  const isMobileState = isMobile !== undefined ? isMobile : (window.innerWidth < 768);
  const { data } = useApp();

  // Find next upcoming class for student's batch
  const studentClasses = (data.todayClasses || []).filter((c) => c.batch === student.batch);
  const nextClass = studentClasses[0];

  // Find next upcoming exam for student's batch
  const upcomingExams = (data.exams || []).filter((e) => e.batch === student.batch);
  const nextExam = upcomingExams[0];

  // Calculate student attendance %
  const attRate = 96; // 96%
  const circleColor = attRate >= 80 ? "#059669" : attRate >= 60 ? "#D97706" : "#DC2626";

  const getGradeBadge = (grade) => {
    let bg = "#DEF7EC";
    let color = "#03543F";
    if (grade === "B") {
      bg = "#EBF4FF";
      color = "#1E40AF";
    } else if (grade === "C") {
      bg = "#FEF3C7";
      color = "#92400E";
    } else if (grade === "F") {
      bg = "#FDE8E8";
      color = "#9B1C1C";
    }
    return (
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: "12px",
          background: bg,
          color: color,
          display: "inline-block"
        }}
      >
        {grade}
      </span>
    );
  };

  const cardStyle = {
    background: "#FFFFFF",
    border: "1px solid #E3E6EA",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    padding: "20px 24px"
  };

  const cardHeaderStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px"
  };

  const titleStyle = {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1A202C",
    fontFamily: "'Sora', sans-serif"
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          backgroundColor: "#1A3566",
          color: "#FFFFFF",
          borderRadius: "16px",
          padding: "24px 28px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.4rem", color: "#FFFFFF", marginBottom: "4px", margin: 0 }}>
            Good morning, {student.name}! 👋
          </h2>
          <div style={{ fontSize: "0.88rem", color: "#93C5FD", marginTop: "4px", fontFamily: "'Inter', sans-serif" }}>
            {student.batch} • {student.branch} Branch • Reg No: <strong>{student.regNo}</strong>
          </div>
        </div>
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.15)",
            color: "#FFFFFF",
            fontFamily: "'Inter', sans-serif"
          }}
        >
          Active Student
        </span>
      </div>

      {/* 2-Column Grid for the 4 Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobileState ? "1fr" : "1fr 1fr",
          gap: "16px"
        }}
      >
        {/* Card 1: Attendance Overview */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <CheckCircle2 size={16} style={{ color: "#2B6CB0" }} />
            <span style={titleStyle}>My Attendance Overview</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px", paddingTop: "4px" }}>
            <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
              <svg width="90" height="90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E3E6EA"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={circleColor}
                  strokeWidth="3.8"
                  strokeDasharray={`${attRate}, 100`}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  color: circleColor,
                  fontFamily: "'Sora', sans-serif"
                }}
              >
                {attRate}%
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#1A202C", margin: 0, fontFamily: "'Inter', sans-serif" }}>
                {attRate >= 80 ? "Excellent Attendance!" : attRate >= 60 ? "Satisfactory" : "Low Attendance Warning"}
              </h4>
              <p style={{ fontSize: "0.82rem", color: "#718096", marginTop: "4px", marginBottom: 0, fontFamily: "'Inter', sans-serif" }}>
                You have attended 29 out of 30 scheduled classes this term. Keep it up!
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Next Upcoming Class Session */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Clock size={16} style={{ color: "#2B6CB0" }} />
            <span style={titleStyle}>Next Upcoming Class Session</span>
          </div>

          {nextClass ? (
            <div style={{ padding: "12px 14px", background: "#F7FAFC", borderRadius: "8px", borderLeft: "4px solid #2B6CB0" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1A202C", fontFamily: "'Inter', sans-serif" }}>{nextClass.subject}</div>
              <div style={{ fontSize: "0.82rem", color: "#4A5568", marginTop: "4px", fontFamily: "'Inter', sans-serif" }}>
                Lecturer: <strong>{nextClass.lecturer}</strong> | Time: <strong>{nextClass.time}</strong>
              </div>
              <div style={{ fontSize: "0.8rem", color: "#718096", marginTop: "4px", fontFamily: "'Inter', sans-serif" }}>
                Classroom: <strong>{nextClass.classroom}</strong>
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 0", textAlign: "center", color: "#718096", fontSize: "0.85rem", fontFamily: "'Inter', sans-serif" }}>
              No more classes scheduled for today.
            </div>
          )}
        </div>

        {/* Card 3: Upcoming Exam Countdown */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Calendar size={16} style={{ color: "#2B6CB0" }} />
            <span style={titleStyle}>Upcoming Exam Countdown</span>
          </div>

          {nextExam ? (
            <div style={{ padding: "12px 14px", background: "#FEF2F2", borderRadius: "8px", border: "1px solid #FECACA" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <strong style={{ fontSize: "0.95rem", color: "#991B1B", fontFamily: "'Inter', sans-serif" }}>{nextExam.name}</strong>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "#FDE8E8",
                    color: "#9B1C1C",
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  Exam in 16 Days
                </span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "#7F1D1D", fontFamily: "'Inter', sans-serif" }}>
                Subject: {nextExam.subject} | Date: {nextExam.date} ({nextExam.time})
              </div>
              <div style={{ fontSize: "0.8rem", color: "#991B1B", marginTop: "4px", fontFamily: "'Inter', sans-serif" }}>
                Room: {nextExam.classroom} | Invigilator: {nextExam.invigilator}
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 0", textAlign: "center", color: "#718096", fontSize: "0.85rem", fontFamily: "'Inter', sans-serif" }}>
              No upcoming exams scheduled within 14 days.
            </div>
          )}
        </div>

        {/* Card 4: Latest Evaluation Summary */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <FileText size={16} style={{ color: "#2B6CB0" }} />
            <span style={titleStyle}>Latest Evaluation Summary</span>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '12px' }}>
            <table style={{ minWidth: "400px", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#718096",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      paddingBottom: "8px",
                      textAlign: "left",
                      borderBottom: "1px solid #E3E6EA",
                      fontFamily: "'Inter', sans-serif"
                    }}
                  >
                    Subject
                  </th>
                  <th
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#718096",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      paddingBottom: "8px",
                      textAlign: "left",
                      borderBottom: "1px solid #E3E6EA",
                      fontFamily: "'Inter', sans-serif"
                    }}
                  >
                    Marks
                  </th>
                  <th
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#718096",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      paddingBottom: "8px",
                      textAlign: "left",
                      borderBottom: "1px solid #E3E6EA",
                      fontFamily: "'Inter', sans-serif"
                    }}
                  >
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontSize: "13px", color: "#1A202C", padding: "8px 0", borderBottom: "1px solid #F0F2F5", fontFamily: "'Inter', sans-serif" }}>
                    Business Studies
                  </td>
                  <td style={{ fontSize: "13px", color: "#1A202C", padding: "8px 0", borderBottom: "1px solid #F0F2F5", fontFamily: "'Inter', sans-serif" }}>
                    88 / 100
                  </td>
                  <td style={{ fontSize: "13px", color: "#1A202C", padding: "8px 0", borderBottom: "1px solid #F0F2F5" }}>
                    {getGradeBadge("A")}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontSize: "13px", color: "#1A202C", padding: "8px 0", borderBottom: "1px solid #F0F2F5", fontFamily: "'Inter', sans-serif" }}>
                    Accounting
                  </td>
                  <td style={{ fontSize: "13px", color: "#1A202C", padding: "8px 0", borderBottom: "1px solid #F0F2F5", fontFamily: "'Inter', sans-serif" }}>
                    84 / 100
                  </td>
                  <td style={{ fontSize: "13px", color: "#1A202C", padding: "8px 0", borderBottom: "1px solid #F0F2F5" }}>
                    {getGradeBadge("A")}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontSize: "13px", color: "#1A202C", padding: "8px 0", borderBottom: "1px solid #F0F2F5", fontFamily: "'Inter', sans-serif" }}>
                    Economics
                  </td>
                  <td style={{ fontSize: "13px", color: "#1A202C", padding: "8px 0", borderBottom: "1px solid #F0F2F5", fontFamily: "'Inter', sans-serif" }}>
                    78 / 100
                  </td>
                  <td style={{ fontSize: "13px", color: "#1A202C", padding: "8px 0", borderBottom: "1px solid #F0F2F5" }}>
                    {getGradeBadge("B")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

