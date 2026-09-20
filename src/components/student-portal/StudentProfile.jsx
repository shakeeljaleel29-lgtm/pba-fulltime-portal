import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { User, Phone, Edit3 } from "lucide-react";

import { T, theme, type as t } from "../../theme";

export const StudentProfile = ({ student }) => {
  const { updateStudent } = useApp();

  const [showEditModal, setShowEditModal] = useState(false);
  const [newPhone, setNewPhone] = useState(student.phone || "");

  // Student Initials
  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSavePhone = (e) => {
    e.preventDefault();
    if (!newPhone.trim()) return;
    updateStudent(student.id, { phone: newPhone });
    setShowEditModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Profile Header Card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E3E6EA",
          borderRadius: "14px",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
        }}
      >
        {/* Photo Placeholder Circle */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2B6CB0, #1A4A8A)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Sora', sans-serif",
            fontSize: "26px",
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(43,108,176,0.30)"
          }}
        >
          {getInitials(student.name)}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "20px", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
              {student.name}
            </h2>
            <span style={{ background: '#F0FFF4', color: theme.success, border: '1px solid #9AE6B4', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
              {student.status || "Active"}
            </span>
          </div>
          <div style={{ color: theme.textMuted, fontSize: "13px", marginTop: "4px" }}>
            Reg No: <strong style={{ color: theme.accent }}>{student.regNo}</strong> • Branch: <strong>{student.branch || "Kohuwala"}</strong>
          </div>
          <div style={{ color: theme.textSecondary, fontSize: "13px", marginTop: "2px" }}>
            Programme: <strong>{student.batch}</strong>
          </div>
        </div>

        <button
          onClick={() => {
            setNewPhone(student.phone || "");
            setShowEditModal(true);
          }}
          style={{
            background: '#FFFFFF',
            color: theme.textSecondary,
            border: '1px solid #E3E6EA',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Edit3 size={14} /> Update Contact Number
        </button>
      </div>

      {/* Details Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Academic Profile Details */}
        <div style={{ background: theme.cardBg, border: '1px solid ' + theme.cardBorder, borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #F4F5F7', display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF' }}>
            <User size={18} style={{ color: theme.accent }} />
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: '15px', fontWeight: 600, color: theme.textPrimary }}>Academic Details</span>
          </div>

          <div style={{ padding: '20px 22px', display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F4F5F7", paddingBottom: "8px" }}>
              <span style={{ color: theme.textMuted, fontWeight: 500 }}>Student Registration No</span>
              <strong style={{ color: theme.textPrimary }}>{student.regNo}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F4F5F7", paddingBottom: "8px" }}>
              <span style={{ color: theme.textMuted, fontWeight: 500 }}>Enrolled Programme/Batch</span>
              <strong style={{ color: theme.textPrimary }}>{student.batch}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F4F5F7", paddingBottom: "8px" }}>
              <span style={{ color: theme.textMuted, fontWeight: 500 }}>Assigned Academy Branch</span>
              <strong style={{ color: theme.textPrimary }}>{student.branch}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F4F5F7", paddingBottom: "8px" }}>
              <span style={{ color: theme.textMuted, fontWeight: 500 }}>Enrolment Date</span>
              <strong style={{ color: theme.textPrimary }}>{student.enrolmentDate || "2024-01-08"}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: theme.textMuted, fontWeight: 500 }}>Date of Birth</span>
              <strong style={{ color: theme.textPrimary }}>{student.dob || "2006-04-12"}</strong>
            </div>
          </div>
        </div>

        {/* Parent & Contact Details */}
        <div style={{ background: theme.cardBg, border: '1px solid ' + theme.cardBorder, borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #F4F5F7', display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF' }}>
            <Phone size={18} style={{ color: theme.success }} />
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: '15px', fontWeight: 600, color: theme.textPrimary }}>Contact & Parent Information</span>
          </div>

          <div style={{ padding: '20px 22px', display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F4F5F7", paddingBottom: "8px" }}>
              <span style={{ color: theme.textMuted, fontWeight: 500 }}>Student Mobile Phone</span>
              <strong style={{ color: theme.accent }}>{student.phone || "+94 77 444 5566"}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F4F5F7", paddingBottom: "8px" }}>
              <span style={{ color: theme.textMuted, fontWeight: 500 }}>Student Email Address</span>
              <strong style={{ color: theme.textPrimary }}>{student.email || "kasun.j@gmail.com"}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F4F5F7", paddingBottom: "8px" }}>
              <span style={{ color: theme.textMuted, fontWeight: 500 }}>Parent / Guardian Phone</span>
              <strong style={{ color: theme.success }}>{student.parentPhone || "+94 71 222 3344"}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: theme.textMuted, fontWeight: 500 }}>Residential Address</span>
              <strong style={{ color: theme.textPrimary }}>{student.address || "No. 45, Galle Road, Colombo 03"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Update Phone Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.20)', position: 'relative' }}>
            <button
              onClick={() => setShowEditModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A202C', marginBottom: '16px' }}>
              Update Mobile Contact Number
            </h3>
            <form onSubmit={handleSavePhone}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                  New Mobile Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+94 77 000 0000"
                  style={{
                    width: '100%',
                    padding: '9px 13px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E3E6EA',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1A202C',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F4F5F7' }}>
                <button type="button" style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #E3E6EA', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(43,108,176,0.30)' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
