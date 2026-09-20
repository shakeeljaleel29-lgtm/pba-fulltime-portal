import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Database, Download, Upload, Trash2, RefreshCw, ShieldAlert } from "lucide-react";

import { T, theme, type as t } from "../../theme";

export const DataManagementTab = () => {
  const { exportBackup, importBackup, clearAllPbaData, resetToDemoData, showToast } = useApp();

  const [pendingBackupFile, setPendingBackupFile] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setPendingBackupFile(content);
      setShowRestoreModal(true);
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  const handleConfirmRestore = () => {
    if (pendingBackupFile) {
      importBackup(pendingBackupFile);
      setShowRestoreModal(false);
      setPendingBackupFile(null);
    }
  };

  const handleConfirmClear = () => {
    if (deleteConfirmText === "DELETE") {
      clearAllPbaData();
      setShowClearModal(false);
    } else {
      showToast("You must type DELETE in uppercase to confirm.", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 4a & 4b: Backup & Restore Card */}
      <div style={{ background: theme.cardBg, border: '1px solid ' + theme.cardBorder, borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Database size={20} style={{ color: theme.accent }} />
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '16px', fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            Data Backup & Restoration Suite
          </h3>
        </div>

        <p style={{ fontSize: "13px", color: theme.textSecondary, marginBottom: "20px" }}>
          Export a full system JSON backup containing all students, fee ledgers, exam records, schedules, and user accounts, or restore from a previous backup file.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Export Box */}
          <div style={{ border: "1px solid #E3E6EA", borderRadius: "10px", padding: "20px", background: "#F8FAFC" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: theme.textPrimary, margin: "0 0 8px 0" }}>
              📥 Export Full System Backup
            </h4>
            <p style={{ fontSize: "12px", color: theme.textMuted, margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Download a complete offline copy of all PBA Portal localStorage databases in JSON format.
            </p>
            <button
              onClick={exportBackup}
              style={{
                background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(43,108,176,0.30)'
              }}
            >
              <Download size={16} /> Download Full Backup (.json)
            </button>
          </div>

          {/* Import / Restore Box */}
          <div style={{ border: "1px solid #E3E6EA", borderRadius: "10px", padding: "20px", background: "#F8FAFC" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: theme.textPrimary, margin: "0 0 8px 0" }}>
              📤 Restore System from Backup
            </h4>
            <p style={{ fontSize: "12px", color: theme.textMuted, margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Select a valid PBA JSON backup file to overwrite current data and restore full portal state.
            </p>
            <label
              style={{
                background: '#FFFFFF',
                color: theme.textSecondary,
                border: '1px solid #E3E6EA',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Upload size={16} /> Restore from Backup File
              <input type="file" accept=".json" onChange={handleFileSelect} style={{ display: "none" }} />
            </label>
          </div>
        </div>
      </div>

      {/* 4c: Danger Zone */}
      <div
        style={{
          background: "#FFFFFF",
          border: "2px solid #FEB2B2",
          borderRadius: "14px",
          padding: "24px",
          boxShadow: "0 2px 10px rgba(197,48,48,0.06)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <ShieldAlert size={22} style={{ color: theme.danger }} />
          <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: "17px", fontWeight: 700, color: theme.danger, margin: 0 }}>
            Danger Zone
          </h3>
        </div>

        <p style={{ fontSize: "13px", color: theme.textSecondary, marginBottom: "20px" }}>
          High-impact administrative actions. Proceed with caution — clearing or resetting data cannot be undone without a valid backup file.
        </p>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setShowClearModal(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #C53030, #9B2C2C)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(197,48,48,0.30)'
            }}
          >
            <Trash2 size={16} /> Clear All System Data
          </button>

          <button
            onClick={resetToDemoData}
            style={{
              background: '#FFFFFF',
              color: theme.textSecondary,
              border: '1px solid #E3E6EA',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} /> Reset to Initial Demo Data
          </button>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 24px 64px rgba(0,0,0,0.20)', position: 'relative' }}>
            <button
              onClick={() => setShowRestoreModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A202C', marginBottom: '14px' }}>
              Confirm System Restoration
            </h3>
            <p style={{ fontSize: "13px", color: theme.textSecondary, margin: 0, lineHeight: 1.6 }}>
              This will overwrite all current system data with the records from the uploaded backup file. Are you sure you want to proceed?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F4F5F7' }}>
              <button type="button" style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #E3E6EA', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowRestoreModal(false)}>
                Cancel
              </button>
              <button type="button" style={{ background: 'linear-gradient(135deg, #2B6CB0, #1A4A8A)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(43,108,176,0.30)' }} onClick={handleConfirmRestore}>
                Yes, Restore Data Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal requiring DELETE */}
      {showClearModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.20)', position: 'relative' }}>
            <button
              onClick={() => setShowClearModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: '#F4F5F7', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: '18px', fontWeight: 700, color: theme.danger, marginBottom: '14px' }}>
              Permanent Data Erasure
            </h3>
            <p style={{ fontSize: "13px", color: theme.danger, marginBottom: "16px", lineHeight: 1.6 }}>
              Warning: This action will purge all PBA students, attendance, fee ledgers, exam ranks, and user accounts from browser storage.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>
                Type <span style={{ color: theme.danger, fontFamily: 'monospace' }}>DELETE</span> to confirm:
              </label>
              <input
                type="text"
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 13px',
                  background: '#FFFFFF',
                  border: '1.5px solid #FEB2B2',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#1A202C',
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  boxSizing: 'border-box'
                }}
                onFocus={e => { e.target.style.borderColor = '#C53030'; e.target.style.boxShadow = '0 0 0 3px rgba(197,48,48,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#FEB2B2'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F4F5F7' }}>
              <button type="button" style={{ background: '#FFFFFF', color: '#4A5568', border: '1px solid #E3E6EA', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowClearModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "DELETE"}
                onClick={handleConfirmClear}
                style={{
                  background: 'linear-gradient(135deg, #C53030, #9B2C2C)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: deleteConfirmText === "DELETE" ? 'pointer' : 'not-allowed',
                  opacity: deleteConfirmText === "DELETE" ? 1 : 0.5,
                  boxShadow: deleteConfirmText === "DELETE" ? '0 2px 10px rgba(197,48,48,0.30)' : 'none'
                }}
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
