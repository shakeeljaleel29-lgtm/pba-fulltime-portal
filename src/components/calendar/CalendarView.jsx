import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, X } from "lucide-react";
import { T } from "../../theme";

const safeLS = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(fallback)
      ? (Array.isArray(parsed) ? parsed : fallback)
      : (parsed ?? fallback);
  } catch {
    return fallback;
  }
};

const saveLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const EVENT_COLORS = {
  term_start:   { bg: '#D1FAE5', border: '#059669', text: '#065F46', dot: '#059669', label: 'Term Start'   },
  term_end:     { bg: '#DBEAFE', border: '#2563EB', text: '#1E40AF', dot: '#2563EB', label: 'Term End'     },
  holiday:      { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B', dot: '#DC2626', label: 'Holiday'      },
  exam_week:    { bg: '#FEF3C7', border: '#D97706', text: '#92400E', dot: '#D97706', label: 'Exam Week'    },
  exam:         { bg: '#FEF3C7', border: '#D97706', text: '#92400E', dot: '#D97706', label: 'Exam'         },
  leave:        { bg: '#FFE4E6', border: '#F43F5E', text: '#9F1239', dot: '#F43F5E', label: 'Leave'        },
  payment:      { bg: '#ECFDF5', border: '#10B981', text: '#065F46', dot: '#10B981', label: 'Payment Due'  },
  payment_due:  { bg: '#ECFDF5', border: '#10B981', text: '#065F46', dot: '#10B981', label: 'Payment Due'  },
  event:        { bg: '#EDE9FE', border: '#7C3AED', text: '#4C1D95', dot: '#7C3AED', label: 'Event'        },
  revision:     { bg: '#F0F9FF', border: '#0EA5E9', text: '#0C4A6E', dot: '#0EA5E9', label: 'Revision'     },
  class:        { bg: '#F0F9FF', border: '#0EA5E9', text: '#0C4A6E', dot: '#0EA5E9', label: 'Revision'     },
  default:      { bg: '#F1F5F9', border: '#94A3B8', text: '#475569', dot: '#94A3B8', label: 'Other'        }
};

const getEventColor = (type) => {
  const norm = String(type || '').toLowerCase().replace(/[\s-_]+/g, '_');
  return EVENT_COLORS[norm] || EVENT_COLORS[type] || EVENT_COLORS.default;
};

const getTodayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = String(dateStr).split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return new Date(y, m, d);
};

export const CalendarView = () => {
  const { data, addCalendarEvent, deleteCalendarEvent, filterByBranch } = useApp();

  // Bug 1 Fix: Default to current month and current year
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

  // Bug 2 Fix: Sync with unified pba_calendar_events
  const [calendarEvents, setCalendarEvents] = useState(() => {
    const fromLS = safeLS('pba_calendar_events', null);
    if (Array.isArray(fromLS) && fromLS.length > 0) return fromLS;
    if (Array.isArray(data?.calendarEvents) && data.calendarEvents.length > 0) {
      saveLS('pba_calendar_events', data.calendarEvents);
      return data.calendarEvents;
    }
    return [];
  });

  useEffect(() => {
    const syncFromLS = () => {
      const fromLS = safeLS('pba_calendar_events', data?.calendarEvents || []);
      setCalendarEvents(fromLS);
    };
    syncFromLS();
    window.addEventListener('storage', syncFromLS);
    return () => window.removeEventListener('storage', syncFromLS);
  }, [data?.calendarEvents]);

  // New Event Form State
  const [formData, setFormData] = useState({
    title: "",
    date: getTodayStr(),
    type: "exam",
    branch: "All",
    notes: ""
  });

  const eventsList = filterByBranch(calendarEvents || [], "branch");

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

  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
  const firstDayOfMonth = firstDay;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const todayStr = getTodayStr();

  // Helper to get events for a date string YYYY-MM-DD
  const getEventsForDay = (dayNum) => {
    const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return (eventsList || []).filter((e) => e.date === dStr);
  };

  // Handle Add Form submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    const newEv = {
      id: "cal-" + Date.now(),
      branch: formData.branch || "All",
      ...formData
    };
    const current = safeLS('pba_calendar_events', calendarEvents || []);
    const updated = [newEv, ...(current || [])];
    saveLS('pba_calendar_events', updated);
    setCalendarEvents(updated);
    if (addCalendarEvent) {
      addCalendarEvent(formData);
    }
    setShowAddModal(false);
    setFormData({
      title: "",
      date: getTodayStr(),
      type: "exam",
      branch: "All",
      notes: ""
    });
  };

  // Handle Delete Event
  const handleDeleteEvent = (eventId) => {
    const current = safeLS('pba_calendar_events', calendarEvents || []);
    const updated = (current || []).filter(e => e.id !== eventId);
    saveLS('pba_calendar_events', updated);
    setCalendarEvents(updated);
    if (deleteCalendarEvent) {
      deleteCalendarEvent(eventId);
    }
    if (selectedDayEvents) {
      setSelectedDayEvents(prev => prev ? {
        ...prev,
        events: (prev.events || []).filter(e => e.id !== eventId)
      } : null);
    }
  };

  // Upcoming 30 days events list
  const upcomingEvents = [...(eventsList || [])]
    .filter((e) => {
      if (!e.date) return false;
      const eDate = parseLocalDate(e.date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((eDate - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    })
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: "20px" }}>
        {/* Left: Calendar Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          padding: '20px 24px'
        }}>
          {/* FIX 6 — Month Navigation Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            borderRadius: '12px',
            color: 'white'
          }}>
            <button
              onClick={prevMonth}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                width: '32px', height: '32px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700
              }}
            >
              ‹
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {monthNames[month]} {year}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                {(eventsList || []).filter(ev => ev.date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length} events this month
              </div>
            </div>

            <button
              onClick={nextMonth}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                width: '32px', height: '32px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700
              }}
            >
              ›
            </button>
          </div>

          {/* FIX 1 — Legend Bar above the calendar grid */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '10px',
            padding: '8px 0', marginBottom: '12px'
          }}>
            {Object.entries(EVENT_COLORS)
              .filter(([key]) => key !== 'default')
              .map(([key, c]) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', color: c.text, fontWeight: 600
                }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: c.dot, display: 'inline-block', flexShrink: 0
                  }} />
                  {c.label}
                </div>
              ))
            }
          </div>

          {/* FIX 2 — Days of Week Header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "8px" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <div
                key={d}
                style={{
                  padding: "8px 0",
                  textAlign: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: (i === 0 || i === 6) ? "#DC2626" : "#64748B",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase"
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* FIX 3 — Calendar Days Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} style={{ background: "#FAFAFA", borderRadius: "10px", minHeight: "85px", border: "1px solid #F1F5F9", opacity: 0.4 }} />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const today = new Date();
              const isToday = dayNum === today.getDate() &&
                              month === today.getMonth() &&
                              year === today.getFullYear();
              const dayEvs = getEventsForDay(dayNum);
              const cellDate = new Date(year, month, dayNum);
              const isWeekend = [0, 6].includes(cellDate.getDay());

              const primaryColor = dayEvs.length === 1 ? getEventColor(dayEvs[0].type) : null;

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    if (dayEvs.length > 0) {
                      setSelectedDayEvents({ dateStr, events: dayEvs });
                    } else {
                      setFormData({
                        title: "",
                        date: dateStr,
                        type: "exam",
                        branch: "All",
                        notes: ""
                      });
                      setShowAddModal(true);
                    }
                  }}
                  style={{
                    minHeight: "85px",
                    padding: "6px",
                    border: isToday
                      ? "2px solid #4F46E5"
                      : `1px solid ${primaryColor ? primaryColor.border + '60' : '#E2E8F0'}`,
                    borderRadius: "10px",
                    background: isToday
                      ? "#EEF2FF"
                      : dayEvs.length === 1
                        ? primaryColor.bg
                        : dayEvs.length > 1
                          ? "#F5F3FF"
                          : isWeekend
                            ? "#FFF5F5"
                            : "white",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    position: "relative",
                    boxShadow: dayEvs.length > 0 ? "0 1px 3px rgba(0,0,0,0.06)" : "none"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = dayEvs.length > 0 ? "0 1px 3px rgba(0,0,0,0.06)" : "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{
                    fontSize: "13px",
                    fontWeight: isToday ? 800 : 600,
                    color: isToday ? "#4F46E5" : isWeekend ? "#DC2626" : "#1A202C",
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <span style={isToday ? {
                      background: "#4F46E5",
                      color: "white",
                      width: "22px", height: "22px",
                      borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 800
                    } : {}}>
                      {dayNum}
                    </span>
                    <span style={{ fontSize: "14px", color: "#CBD5E0", lineHeight: 1 }}>+</span>
                  </div>

                  {/* Events inside day cell */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {dayEvs.slice(0, 2).map((ev) => {
                      const c = getEventColor(ev.type);
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayEvents({ dateStr, events: dayEvs });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: c.bg,
                            border: `1px solid ${c.border}40`,
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{
                            width: '6px', height: '6px',
                            borderRadius: '50%',
                            background: c.dot,
                            flexShrink: 0
                          }} />
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: c.text,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                          }}>
                            {ev.title || ev.name || ev.label || '—'}
                          </span>
                        </div>
                      );
                    })}

                    {dayEvs.length > 2 && (
                      <div style={{
                        fontSize: '10px',
                        color: '#7C3AED',
                        fontWeight: 700,
                        padding: '1px 5px',
                        background: '#EDE9FE',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginTop: '2px'
                      }}>
                        +{dayEvs.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FIX 4 — Right: Upcoming Events Sidebar Panel */}
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
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const evDate = parseLocalDate(ev.date);
                evDate.setHours(0, 0, 0, 0);
                const daysUntil = Math.ceil((evDate - today) / 86400000);
                const c = getEventColor(ev.type);

                return (
                  <div
                    key={ev.id}
                    style={{
                      borderLeft: `4px solid ${c.border}`,
                      background: c.bg,
                      borderRadius: '0 10px 10px 0',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.10)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                    onClick={() => setSelectedDayEvents({ dateStr: ev.date, events: [ev] })}
                  >
                    {/* Type chip + days countdown */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700,
                        color: c.text,
                        background: 'white',
                        padding: '2px 6px',
                        borderRadius: '20px',
                        border: `1px solid ${c.border}60`
                      }}>
                        {c.label.toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: daysUntil === 0 ? '#DC2626' : daysUntil <= 3 ? '#D97706' : '#64748B'
                      }}>
                        {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                      </span>
                    </div>

                    {/* Event title */}
                    <div style={{ fontSize: '13px', fontWeight: 700, color: c.text, marginBottom: '3px' }}>
                      {ev.title || ev.name || ev.label || '—'}
                    </div>

                    {/* Date */}
                    <div style={{ fontSize: '11px', color: c.text + 'CC' }}>
                      {parseLocalDate(ev.date).toLocaleDateString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>

                    {/* Notes if present */}
                    {(ev.notes || ev.description) && (
                      <div style={{
                        fontSize: '11px', color: c.text + 'AA',
                        marginTop: '4px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {ev.notes || ev.description}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* FIX 5 — Add Event Modal redesign */}
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
                      <option value="term_start">Term Start</option>
                      <option value="term_end">Term End</option>
                      <option value="holiday">Holiday</option>
                      <option value="exam_week">Exam Week</option>
                      <option value="exam">Exam</option>
                      <option value="leave">Staff Leave</option>
                      <option value="payment">Payment Due</option>
                      <option value="event">Event</option>
                      <option value="revision">Revision</option>
                    </select>

                    {/* Live color preview strip */}
                    {formData.type && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: getEventColor(formData.type).bg,
                        borderRadius: '8px',
                        border: `1px solid ${getEventColor(formData.type).border}60`,
                        marginTop: '6px'
                      }}>
                        <span style={{
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: getEventColor(formData.type).dot
                        }} />
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: getEventColor(formData.type).text
                        }}>
                          {getEventColor(formData.type).label}
                        </span>
                      </div>
                    )}
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
                const c = getEventColor(ev.type);
                return (
                  <div key={ev.id} style={{ border: `1px solid ${c.border}40`, borderRadius: "12px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: c.bg }}>
                    <div>
                      <span style={{ background: "white", color: c.text, border: `1px solid ${c.border}60`, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>
                        {c.label}
                      </span>
                      <div style={{ fontWeight: 700, color: c.text, marginTop: "6px", fontSize: '14px' }}>{ev.title || ev.name || ev.label || '—'}</div>
                      {(ev.notes || ev.description) && <div style={{ fontSize: "12px", color: c.text + 'CC', marginTop: "4px" }}>{ev.notes || ev.description}</div>}
                    </div>

                    <button
                      onClick={() => {
                        handleDeleteEvent(ev.id);
                      }}
                      style={{
                        padding: '6px 12px', background: 'white', color: '#EF4444',
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
