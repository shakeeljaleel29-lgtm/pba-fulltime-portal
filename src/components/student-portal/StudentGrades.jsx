import React from "react";
import { useApp } from "../../context/AppContext";
import { GraduationCap, Award, Printer, CheckCircle2, XCircle } from "lucide-react";
import { printExamResultsPDF } from "../../utils/pdfGenerator";

export const StudentGrades = ({ student }) => {
  const { data } = useApp();

  // Find all exam results for student across exams
  const studentResults = [];
  (data.exams || []).forEach((ex) => {
    const res = (ex.results || []).find(
      (r) => r.studentId === student.id || r.regNo === student.regNo || r.studentName === student.name
    );
    if (res) {
      studentResults.push({
        exam: ex.name,
        subject: ex.subject,
        date: ex.date,
        marks: res.marks,
        maxMarks: res.maxMarks || ex.maxMarks || 100,
        grade: res.grade || (res.marks >= 75 ? "A" : res.marks >= 65 ? "B" : res.marks >= 50 ? "C" : "F"),
        passFail: res.marks >= 50 ? "PASS" : "FAIL"
      });
    }
  });

  // Fallback placeholder results if none logged yet
  const resultsList = studentResults.length > 0 ? studentResults : [
    { exam: "Mid-Term Examination 2026", subject: "Business Studies", date: "2026-10-05", marks: 88, maxMarks: 100, grade: "A", passFail: "PASS" },
    { exam: "Mid-Term Examination 2026", subject: "Accounting", date: "2026-10-06", marks: 84, maxMarks: 100, grade: "A", passFail: "PASS" },
    { exam: "Mid-Term Examination 2026", subject: "Economics", date: "2026-10-07", marks: 78, maxMarks: 100, grade: "B", passFail: "PASS" }
  ];

  const totalMarks = resultsList.reduce((sum, r) => sum + Number(r.marks), 0);
  const totalMax = resultsList.reduce((sum, r) => sum + Number(r.maxMarks), 0);
  const overallAvg = totalMax > 0 ? Math.round((totalMarks / totalMax) * 100) : 83;
  const overallGPA = (overallAvg / 25).toFixed(2); // GPA out of 4.0

  const gradeLabel = overallAvg >= 75 ? "First Class Honors" : overallAvg >= 65 ? "Upper Second Class" : overallAvg >= 50 ? "Pass" : "Fail";

  // Derive per-subject averages
  const subjectMap = {};
  resultsList.forEach(r => {
    if (!subjectMap[r.subject]) {
      subjectMap[r.subject] = { total: 0, count: 0, max: 0 };
    }
    subjectMap[r.subject].total += Number(r.marks || 0);
    subjectMap[r.subject].max += Number(r.maxMarks || 100);
    subjectMap[r.subject].count += 1;
  });

  const subjectSummaries = Object.keys(subjectMap).map(sName => {
    const info = subjectMap[sName];
    const avg = info.max > 0 ? Math.round((info.total / info.max) * 100) : 0;
    const foundSubj = (data?.subjects || []).find(s => s.name === sName || s.code === sName);
    return {
      name: sName,
      code: foundSubj?.code || sName.substring(0, 3).toUpperCase(),
      color: foundSubj?.color || "#2B6CB0",
      average: avg,
      examCount: info.count
    };
  });

  const getGradeBadge = (grade) => {
    switch (grade) {
      case "A":
        return { bg: "#F0FFF4", color: "#276749", border: "1px solid #9AE6B4" };
      case "B":
        return { bg: "#EBF4FF", color: "#2B6CB0", border: "1px solid #BEE3F8" };
      case "C":
        return { bg: "#FEF3C7", color: "#B7860A", border: "1px solid #F6D860" };
      case "D":
        return { bg: "#FFF8F0", color: "#C05621", border: "1px solid #FBD38D" };
      case "F":
        return { bg: "#FFF5F5", color: "#C53030", border: "1px solid #FEB2B2" };
      default:
        return { bg: "#F7FAFC", color: "#718096", border: "1px solid #E2E8F0" };
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* SECTION A — Overall Academic Performance Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1C2A3A 0%, #2B6CB0 100%)',
        borderRadius: '12px',
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        color: '#FFFFFF',
        boxShadow: '0 4px 12px rgba(43,108,176,0.25)'
      }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', margin: 0 }}>
            Overall Cumulative GPA
          </p>
          <p style={{ fontSize: '36px', fontWeight: 800, fontFamily: "'Sora', sans-serif", color: '#FFFFFF', lineHeight: 1, margin: '4px 0 6px 0' }}>
            {overallGPA} <span style={{ fontSize: '16px', fontWeight: 500, opacity: 0.8 }}>/ 4.0</span>
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            {gradeLabel} · {subjectSummaries.length} subject{subjectSummaries.length !== 1 ? 's' : ''} · Overall Average: <strong>{overallAvg}%</strong>
          </p>
        </div>
        <Award size={48} style={{ color: '#FFFFFF', opacity: 0.35 }} />
      </div>

      {/* SECTION B — Header Row & Print Transcript Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GraduationCap size={20} style={{ color: '#2B6CB0' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A202C', fontFamily: "'Sora', sans-serif", margin: 0 }}>
            My Exam Results & Academic Transcript
          </h3>
        </div>
        <button
          onClick={() =>
            printExamResultsPDF(
              { name: `${student.name} Academic Transcript`, subject: "All Subjects", date: new Date().toISOString().split("T")[0], maxMarks: 100 },
              resultsList.map((r) => ({ studentName: student.name, marks: r.marks, maxMarks: r.maxMarks, grade: r.grade, rank: 1 }))
            )
          }
          style={{
            background: '#D4A017', color: '#1A202C', border: 'none', borderRadius: '8px',
            padding: '9px 18px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Inter', sans-serif",
            boxShadow: '0 2px 6px rgba(212,160,23,0.30)'
          }}
        >
          <Printer size={14} /> Print Transcript
        </button>
      </div>

      {/* SECTION C — Exam Results Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E3E6EA', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '20px' }}>
        {resultsList.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left' }}>Exam / Paper</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'right' }}>Max Marks</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'right' }}>Marks Obtained</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'center' }}>Grade</th>
                  <th style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E3E6EA', textAlign: 'left' }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {resultsList.map((r, idx) => {
                  const isLast = idx === resultsList.length - 1;
                  const gStyle = getGradeBadge(r.grade);
                  const foundSubj = (data?.subjects || []).find(s => s.name === r.subject || s.code === r.subject);
                  const sColor = foundSubj?.color || "#2B6CB0";
                  const sCode = foundSubj?.code || r.subject?.substring(0, 3)?.toUpperCase() || "SUB";

                  return (
                    <tr
                      key={idx}
                      style={{ borderBottom: isLast ? 'none' : '1px solid #F0F2F5', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1A202C' }}>
                        <div style={{ fontWeight: 600, color: '#1A202C', marginBottom: '2px' }}>{r.exam}</div>
                        <span style={{
                          background: sColor + '20', color: sColor,
                          fontSize: '10px', fontWeight: 800, padding: '1px 6px',
                          borderRadius: '10px', display: 'inline-block'
                        }}>
                          {sCode} — {r.subject}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#718096' }}>{r.date}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#718096', textAlign: 'right' }}>{r.maxMarks}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#1A202C', textAlign: 'right' }}>
                        {r.marks === "ABS" ? <span style={{ color: '#A0AEC0' }}>ABS</span> : r.marks}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '12px', fontWeight: 800, padding: '4px 12px', borderRadius: '8px',
                          background: gStyle.bg, color: gStyle.color, border: gStyle.border
                        }}>
                          {r.grade}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.passFail === "PASS" ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#F0FFF4', color: '#276749', border: '1px solid #9AE6B4' }}>
                            <CheckCircle2 size={12} /> Pass
                          </span>
                        ) : r.passFail === "FAIL" ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2' }}>
                            <XCircle size={12} /> Fail
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#F7FAFC', color: '#718096', border: '1px solid #E2E8F0' }}>
                            Absent
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
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-7.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            <p style={{ fontSize: '13px', color: '#A0AEC0', marginTop: '12px' }}>
              No exam results recorded yet
            </p>
          </div>
        )}
      </div>

      {/* SECTION D — Subject Summary Chips Row */}
      {subjectSummaries.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Subject Performance Overview
          </div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {subjectSummaries.map((s, idx) => (
              <div key={idx} style={{
                minWidth: '150px',
                background: '#FFFFFF',
                border: '1px solid #E3E6EA',
                borderRadius: '10px',
                padding: '12px 14px',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  background: (s.color || '#2B6CB0') + '20',
                  color: s.color || '#2B6CB0',
                  fontSize: '10px', fontWeight: 800,
                  padding: '1px 7px', borderRadius: '10px',
                  display: 'inline-block', marginBottom: '6px'
                }}>
                  {s.code || s.name}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Sora', sans-serif", color: '#1A202C' }}>
                  {s.average}%
                </div>
                <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                  Avg across {s.examCount} exam{s.examCount !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
