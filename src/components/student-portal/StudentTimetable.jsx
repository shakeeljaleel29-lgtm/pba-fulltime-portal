import React from "react";
import { useApp } from "../../context/AppContext";
import { CalendarCheck, Clock } from "lucide-react";

export const StudentTimetable = ({ student }) => {
  const { data } = useApp();

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

  // Colors for subjects/programmes
  const subjectColors = {
    "Business Studies": "#2563EB",
    "Accounting": "#059669",
    "Economics": "#D97706",
    "English Literature": "#7C3AED",
    "General English": "#0284C7"
  };

  // Pre-populated timetable grid data for student
  const timetableSchedule = {
    "Mon-08:00": { subject: "Accounting", room: "Lab 01", color: subjectColors["Accounting"] },
    "Mon-10:00": { subject: "Business Studies", room: "Hall A", color: subjectColors["Business Studies"] },
    "Tue-09:00": { subject: "Economics", room: "Hall B", color: subjectColors["Economics"] },
    "Wed-08:00": { subject: "Accounting", room: "Lab 01", color: subjectColors["Accounting"] },
    "Wed-10:00": { subject: "Business Studies", room: "Hall A", color: subjectColors["Business Studies"] },
    "Thu-09:00": { subject: "Economics", room: "Hall B", color: subjectColors["Economics"] },
    "Fri-08:00": { subject: "General English", room: "Hall C", color: subjectColors["General English"] },
    "Fri-13:00": { subject: "Revision Class", room: "Hall A", color: "#DC2626" }
  };

  const hasData = Object.keys(timetableSchedule).length > 0;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <CalendarCheck size={20} style={{ color: "#2563EB" }} />
          <span>My Class Timetable — {student.batch || "Enrolled Cohort"}</span>
        </div>
      </div>

      {!hasData ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontStyle: "italic" }}>
          Your timetable will appear here once it has been published by your coordinator.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="custom-table" style={{ borderCollapse: "collapse", width: "100%", textAlign: "center" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th style={{ width: "80px", textAlign: "center" }}>Time</th>
                {days.map((day) => (
                  <th key={day} style={{ textAlign: "center" }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time}>
                  <td style={{ fontWeight: 700, color: "#64748B", fontSize: "12px", background: "#FAFAFA" }}>{time}</td>
                  {days.map((day) => {
                    const key = `${day}-${time}`;
                    const slot = timetableSchedule[key];

                    return (
                      <td key={day} style={{ height: "54px", padding: "4px", verticalAlign: "middle" }}>
                        {slot ? (
                          <div
                            style={{
                              background: slot.color,
                              color: "#FFFFFF",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 600,
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }}
                          >
                            <div>{slot.subject}</div>
                            <div style={{ fontSize: "10px", opacity: 0.9 }}>{slot.room}</div>
                          </div>
                        ) : (
                          <div style={{ height: "100%", borderRadius: "4px", background: "#F1F5F9", border: "1px stroke #E2E8F0" }} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
