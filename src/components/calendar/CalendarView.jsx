import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, X } from "lucide-react";
import { T } from "../../theme";

export const CalendarView = () => {
  const { data, addCalendarEvent, deleteCalendarEvent, filterByBranch } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

  // New Event Form State
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    type: "exam",
    branch: "All",
    notes: ""
  });

  const eventsList = filterByBranch(data.calendarEvents || [], "branch");

  // Type badge styling helper
  const getTypeBadge = (type) => {
    switch (type) {
      case "exam":
        return { color: "#991B1B", bg: "#FEF2F2", label: "Exam" };
      case "holiday":
        return { color: "#92400E", bg: "#FFFBEB", label: "Holiday" };
      case "class":
        return { color: "#3730A3", bg: "#EEF2FF", label: "Class" };
      case "payment_due":
        return { color: "#065F46", bg: "#ECFDF5", label: "Payment Due" };
      case "leave":
        return { color: "#475569", bg: "#F1F5F9", label: "Leave" };
      default:
        return { color: "#475569", bg: "#F1F5F9", label: "Other" };
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar Days calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const todayStr = new Date().toISOString().split("T")[0];

  // Helper to get events for a date string YYYY-MM-DD
  const getEventsForDay = (dayNum) => {
    const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return eventsList.filter((e) => e.date === dStr);
  };

  // Handle Add Form submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    addCalendarEvent(formData);
    setShowAddModal(false);
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      type: "exam",
      branch: "All",
      notes: ""
    });
  };

  // Upcoming 30 days events list
  const upcomingEvents = [...eventsList]
    .filter((e) => {
      const eDate = new Date(e.date);
      const now = new Date();
      const diffDays = (eDate - now) / (1000 * 60 * 60 * 24);
      return diffDays >= -1 && diffDays <= 30;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: 800, color: '#0F172A',
            margin: '0 0 4px', letterSpacing: '-0.5px'
          }}>Academic Calendar</h1>
          <p style={{
            fontSize: '13px', color: '#64748B', margin: 0, fontWeight: 400
          }}>Schedule and track institutional exams, holidays, fee deadlines, revision classes, and staff leaves.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px', fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: "20px" }}>
        {/* Left: Calendar Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          padding: '20px 24px'
        }}>
          {/* Calendar Header Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              {monthNames[month]} {year}
            </h2>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={prevMonth}
                style={{
                  padding: '6px 12px', background: '#F8FAFC', color: '#475569',
                  border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextMonth}
                style={{
                  padding: '6px 12px', background: '#F8FAFC', color: '#475569',
                  border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "8px" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                style={{
                  background: "#F8FAFC",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#64748B",
                  textAlign: "center",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px"
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} style={{ background: "#F8FAFC", borderRadius: "10px", minHeight: "85px", border: "1px solid #F1F5F9" }} />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;
              const dayEvs = getEventsForDay(dayNum);

              return (
                <div
                  key={dayNum}
                  onClick={() => dayEvs.length > 0 && setSelectedDayEvents({ dateStr, events: dayEvs })}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "10px",
                    border: isToday ? "2px solid #4F46E5" : "1px solid #E2E8F0",
                    minHeight: "85px",
                    padding: "8px",
                    cursor: dayEvs.length > 0 ? "pointer" : "default",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: isToday ? 800 : 600, color: isToday ? "#4F46E5" : "#0F172A" }}>
                      {dayNum}
                    </span>
                    {isToday && (
                      <span style={{ fontSize: "9px", background: "#EEF2FF", color: "#4F46E5", padding: "1px 5px", borderRadius: "10px", fontWeight: 800 }}>
                        TODAY
                      </span>
                    )}
                  </div>

                  {/* Events inside day cell */}
                  <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    {dayEvs.slice(0, 2).map((ev) => {
                      const badge = getTypeBadge(ev.type);
                      return (
                        <div
                          key={ev.id}
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "6px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          ● {ev.title}
                        </div>
                      );
                    })}

                    {dayEvs.length > 2 && (
                      <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>
                        +{dayEvs.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Upcoming Events Sidebar Panel */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          padding: '20px 24px',
          height: "fit-content"
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", margin: "0 0 16px 0" }}>
            Upcoming Events
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {upcomingEvents.length === 0 ? (
              <div style={{ fontSize: "13px", color: "#94A3B8", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                No upcoming events for the next 30 days.
              </div>
            ) : (
              upcomingEvents.map((ev) => {
                const badge = getTypeBadge(ev.type);
                return (
                  <div
                    key={ev.id}
                    style={{
                      borderLeft: `3px solid ${badge.color}`,
                      background: "#F8FAFC",
                      padding: "10px 12px",
                      borderRadius: "0 8px 8px 0",
                      fontSize: "13px"
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: "4px" }}>{ev.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#64748B" }}>
                      <span>📅 {ev.date}</span>
                      <span style={{ background: badge.bg, color: badge.color, padding: "2px 6px", borderRadius: "10px", fontWeight: 700, fontSize: "10px" }}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            width: '100%', maxWidth: '520px',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Add New Event
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: '#F1F5F9', border: 'none',
                  borderRadius: '8px', width: '28px', height: '28px',
                  cursor: 'pointer', fontSize: '16px', color: '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >×</button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748B',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'
                  }}>Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A/L Accounting Mock Test"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', background: '#F8FAFC',
                      border: '1.5px solid #E2E8F0', borderRadius: '10px',
                      fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{
                      display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748B',
                      textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'
                    }}>Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px', background: '#F8FAFC',
                        border: '1.5px solid #E2E8F0', borderRadius: '10px',
                        fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748B',
                      textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'
                    }}>Event Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px', background: '#F8FAFC',
                        border: '1.5px solid #E2E8F0', borderRadius: '10px',
                        fontSize: '13px', color: '#0F172A', outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
                      }}
                    >
                      <option value="exam">Exam</option>
                      <option value="holiday">Holiday</option>
                      <option value="class">Class</option>
                      <option value="payment_due">Payment Due</option>
                      <option value="leave">Staff Leave</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748B',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'
                  }}>Branch</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', background: '#F8FAFC',
                      border: '1.5px solid #E2E8F0', borderRadius: '10px',
                      fontSize: '13px', color: '#0F172A', outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
                    }}
                  >
                    <option value="All">All Branches</option>
                    <option value="Kohuwala">Kohuwala</option>
                    <option value="Wattala">Wattala</option>
                    <option value="Panadura">Panadura</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748B',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'
                  }}>Notes (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Additional details..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', background: '#F8FAFC',
                      border: '1.5px solid #E2E8F0', borderRadius: '10px',
                      fontSize: '13px', color: '#0F172A', outline: 'none', resize: 'vertical',
                      fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #F1F5F9',
                display: 'flex', justifyContent: 'flex-end', gap: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '9px 18px', background: '#FFFFFF', color: '#475569',
                    border: '1.5px solid #E2E8F0', borderRadius: '10px',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    color: '#FFFFFF', border: 'none', borderRadius: '10px',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(79,70,229,0.35)'
                  }}
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Popover / Modal */}
      {selectedDayEvents && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            width: '100%', maxWidth: '440px'
          }}>
            <div style={{
              padding: '20px 24px 16px', borderBottom: '1px solid #F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Events on {selectedDayEvents.dateStr}
              </h2>
              <button
                onClick={() => setSelectedDayEvents(null)}
                style={{
                  background: '#F1F5F9', border: 'none', borderRadius: '8px',
                  width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px',
                  color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >×</button>
            </div>

            <div style={{ padding: '20px 24px', display: "flex", flexDirection: "column", gap: "12px" }}>
              {selectedDayEvents.events.map((ev) => {
                const badge = getTypeBadge(ev.type);
                return (
                  <div key={ev.id} style={{ border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: '#F8FAFC' }}>
                    <div>
                      <span style={{ background: badge.bg, color: badge.color, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>
                        {badge.label}
                      </span>
                      <div style={{ fontWeight: 700, color: "#0F172A", marginTop: "6px", fontSize: '14px' }}>{ev.title}</div>
                      {ev.notes && <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{ev.notes}</div>}
                    </div>

                    <button
                      onClick={() => {
                        deleteCalendarEvent(ev.id);
                        setSelectedDayEvents(null);
                      }}
                      style={{
                        padding: '6px 12px', background: 'transparent', color: '#EF4444',
                        border: '1.5px solid #FECACA', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                      }}
                      title="Delete Event"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
