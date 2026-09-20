import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Users, Plus, KeyRound, Ban, CheckCircle2 } from "lucide-react";

import { getBranches, getUserRoles } from "./GeneralAdminView";

import { T, theme, type as t } from "../../theme";

export const UserManagementTab = () => {
  const { data, addUser, toggleUserStatus, resetUserPassword } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    role: "Branch Coordinator",
    branch: "Kohuwala",
    password: "pba123"
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!form.username || !form.name) return;
    addUser(form);
    setShowAddModal(false);
    setForm({ username: "", name: "", email: "", role: "Branch Coordinator", branch: "Kohuwala", password: "pba123" });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;
    resetUserPassword(resetModalUser.id, newPassword);
    setResetModalUser(null);
    setNewPassword("");
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

  const selectStyle = {
    width: '100%',
    padding: '9px 36px 9px 13px',
    background: '#FFFFFF',
    border: '1.5px solid #E3E6EA',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#1A202C',
    outline: 'none',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    cursor: 'pointer',
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
    <div style={{ background: theme.cardBg, border: '1px solid ' + theme.cardBorder, borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF' }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: '15px', fontWeight: 600, color: theme.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} style={{ color: theme.accent }} />
          <span>User Accounts & Credentials Management</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(43,108,176,0.30)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={14} /> Add New User Account
        </button>
      </div>

      <div style={{ padding: '16px 22px 22px 22px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8F9FA' }}>
              <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left' }}>Username</th>
              <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left' }}>Full Name</th>
              <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left' }}>Email</th>
              <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left' }}>Role</th>
              <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left' }}>Branch</th>
              <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left' }}>Status</th>
              <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid ' + theme.cardBorder, textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.userAccounts.map((usr) => (
              <tr key={usr.id} style={{ transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFE'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: theme.accent, borderBottom: '1px solid #F4F5F7' }}>
                  {usr.username}
                </td>
                <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textPrimary, borderBottom: '1px solid #F4F5F7' }}>{usr.name}</td>
                <td style={{ padding: '13px 16px', fontSize: '13px', color: theme.textSecondary, borderBottom: '1px solid #F4F5F7' }}>{usr.email}</td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                  <span style={{ background: theme.accentLight, color: theme.accent, border: '1px solid #BEE3F8', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                    {usr.role}
                  </span>
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                  <span style={{ background: '#EDF2F7', color: theme.textSecondary, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>{usr.branch}</span>
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                  <span style={{ background: usr.status === "Active" ? '#F0FFF4' : '#FFF5F5', color: usr.status === "Active" ? theme.success : theme.danger, border: '1px solid ' + (usr.status === "Active" ? '#9AE6B4' : '#FEB2B2'), padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    {usr.status}
                  </span>
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid #F4F5F7' }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      style={{ background: '#FFFFFF', color: theme.textSecondary, border: '1px solid #E3E6EA', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Reset Password"
                      onClick={() => {
                        setResetModalUser(usr);
                        setNewPassword("pba123");
                      }}
                    >
                      <KeyRound size={14} /> Reset Pass
                    </button>
                    <button
                      style={{ background: usr.status === "Active" ? '#FFF5F5' : '#F0FFF4', color: usr.status === "Active" ? theme.danger : theme.success, border: '1px solid ' + (usr.status === "Active" ? '#FEB2B2' : '#9AE6B4'), borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title={usr.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                      onClick={() => toggleUserStatus(usr.id)}
                    >
                      {usr.status === "Active" ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                      {usr.status === "Active" ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 24px 64px rgba(0,0,0,0.20)', position: 'relative' }}>
            <button
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A202C', marginBottom: '16px' }}>Create New User Account</h3>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  required
                  style={inputStyle}
                  {...focusHandler}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  required
                  style={inputStyle}
                  {...focusHandler}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  style={inputStyle}
                  {...focusHandler}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Role</label>
                <select style={selectStyle} {...focusHandler} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {getUserRoles().map(r => (
                    <option key={r.id} value={r.label}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Assigned Branch</label>
                <select style={selectStyle} {...focusHandler} value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                  {getBranches().map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  <option value="All">All Branches</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Initial Password</label>
                <input
                  type="password"
                  required
                  style={inputStyle}
                  {...focusHandler}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F4F5F7' }}>
                <button type="button" style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #E3E6EA', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(43,108,176,0.30)' }}>
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 24px 64px rgba(0,0,0,0.20)', position: 'relative' }}>
            <button
              onClick={() => setResetModalUser(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A202C', marginBottom: '16px' }}>Reset Password for {resetModalUser.username}</h3>
            <form onSubmit={handleResetPassword}>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F4F5F7' }}>
                <button type="button" style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #E3E6EA', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setResetModalUser(null)}>
                  Cancel
                </button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(43,108,176,0.30)' }}>
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
