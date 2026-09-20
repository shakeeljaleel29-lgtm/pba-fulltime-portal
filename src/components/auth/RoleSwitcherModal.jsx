import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { UserCheck, ShieldCheck, BookOpenCheck, Printer } from "lucide-react";

import { T, theme, type as t } from "../../theme";

export const RoleSwitcherModal = ({ isOpen, onClose }) => {
  const { currentUser, switchRole } = useApp();
  const [selectedRole, setSelectedRole] = useState(currentUser.role);
  const [demoName, setDemoName] = useState(currentUser.name);

  if (!isOpen) return null;

  const handleSelectRole = (role, defaultName) => {
    setSelectedRole(role);
    setDemoName(defaultName);
  };

  const handleConfirm = () => {
    switchRole(selectedRole, demoName);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '540px', boxShadow: '0 24px 64px rgba(0,0,0,0.20)', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ×
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: '14px' }}>
          <UserCheck size={20} style={{ color: theme.accent }} />
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '18px', fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            Select User Role & Demo Profile
          </h3>
        </div>

        <div>
          <p style={{ fontSize: "13px", color: theme.textMuted, marginBottom: "18px", lineHeight: 1.5 }}>
            Switch roles to test different permission levels across the PBA Full-Time Programme administration portal:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
            {/* Admin */}
            <div
              onClick={() => handleSelectRole("Admin", "Dr. K. Liyanage (Principal)")}
              style={{
                border: selectedRole === "Admin" ? "2px solid #2B6CB0" : "1.5px solid #E3E6EA",
                backgroundColor: selectedRole === "Admin" ? "#EBF4FF" : "#FFFFFF",
                borderRadius: "10px",
                padding: "16px 12px",
                cursor: "pointer",
                textAlign: "center",
                transition: 'all 0.15s'
              }}
            >
              <ShieldCheck size={28} style={{ color: theme.accent, margin: "0 auto 8px" }} />
              <div style={{ fontWeight: 700, fontSize: "13px", color: theme.textPrimary }}>Admin</div>
              <div style={{ fontSize: "11px", color: theme.textMuted, marginTop: '2px' }}>Principal / Coordinator</div>
            </div>

            {/* Lecturer */}
            <div
              onClick={() => handleSelectRole("Lecturer", "Mr. Gamini Silva")}
              style={{
                border: selectedRole === "Lecturer" ? "2px solid #D4A017" : "1.5px solid #E3E6EA",
                backgroundColor: selectedRole === "Lecturer" ? "#FEF3C7" : "#FFFFFF",
                borderRadius: "10px",
                padding: "16px 12px",
                cursor: "pointer",
                textAlign: "center",
                transition: 'all 0.15s'
              }}
            >
              <BookOpenCheck size={28} style={{ color: theme.gold, margin: "0 auto 8px" }} />
              <div style={{ fontWeight: 700, fontSize: "13px", color: theme.textPrimary }}>Lecturer</div>
              <div style={{ fontSize: "11px", color: theme.textMuted, marginTop: '2px' }}>Schedule & Marks</div>
            </div>

            {/* Printing Staff */}
            <div
              onClick={() => handleSelectRole("Printing Staff", "Saman Perera (Printing)")}
              style={{
                border: selectedRole === "Printing Staff" ? "2px solid #2F855A" : "1.5px solid #E3E6EA",
                backgroundColor: selectedRole === "Printing Staff" ? "#F0FFF4" : "#FFFFFF",
                borderRadius: "10px",
                padding: "16px 12px",
                cursor: "pointer",
                textAlign: "center",
                transition: 'all 0.15s'
              }}
            >
              <Printer size={28} style={{ color: theme.success, margin: "0 auto 8px" }} />
              <div style={{ fontWeight: 700, fontSize: "13px", color: theme.textPrimary }}>Printing Staff</div>
              <div style={{ fontSize: "11px", color: theme.textMuted, marginTop: '2px' }}>Printing Queue Only</div>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
              Active User Display Name
            </label>
            <input
              type="text"
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
              placeholder="Enter name..."
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
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F4F5F7' }}>
          <button type="button" style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #E3E6EA', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={onClose}>
            Cancel
          </button>
          <button type="button" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(43,108,176,0.30)' }} onClick={handleConfirm}>
            Switch Session
          </button>
        </div>
      </div>
    </div>
  );
};
