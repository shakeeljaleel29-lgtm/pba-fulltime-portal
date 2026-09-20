import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";

import { T, theme, type as t } from "../../theme";

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { changePassword } = useApp();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 5) {
      setErrorMsg("New password must be at least 5 characters long.");
      return;
    }

    const res = await changePassword(oldPassword, newPassword);
    if (res.success) {
      setSuccessMsg("Password updated successfully!");
      setErrorMsg("");
      setTimeout(() => {
        onClose();
        setSuccessMsg("");
      }, 1500);
    } else {
      setErrorMsg(res.error || "Failed to update password.");
    }
  };

  const inputStyle = {
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
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#4A5568',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '5px'
  };

  const focusHandler = {
    onFocus: e => { e.target.style.borderColor = '#2B6CB0'; e.target.style.boxShadow = '0 0 0 3px rgba(43,108,176,0.12)'; },
    onBlur: e => { e.target.style.borderColor = '#E3E6EA'; e.target.style.boxShadow = 'none'; }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 24px 64px rgba(0,0,0,0.20)', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ×
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: '16px' }}>
          <Lock size={20} style={{ color: theme.accent }} />
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '18px', fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            My Account — Change Password
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            {errorMsg && (
              <div style={{ backgroundColor: "#FFF5F5", border: "1px solid #FEB2B2", color: theme.danger, padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ backgroundColor: "#F0FFF4", border: "1px solid #9AE6B4", color: theme.success, padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} />
                {successMsg}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Current Password</label>
              <input
                type="password"
                required
                style={inputStyle}
                {...focusHandler}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                required
                style={inputStyle}
                {...focusHandler}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                required
                style={inputStyle}
                {...focusHandler}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F4F5F7' }}>
            <button type="button" style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #E3E6EA', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(43,108,176,0.30)' }}>
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
