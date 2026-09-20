import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { T } from "../../theme";

export const LoginPage = ({ isMobile }) => {
  const { login } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const result = await login(username, password);
    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.error);
    }
  };

  const handleQuickFill = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg("");
    setLoading(true);
    const result = await login(u, p);
    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.error);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      minHeight: "100vh",
      overflowY: isMobile ? "auto" : "hidden",
      width: "100vw",
      background: "#F0F4FF"
    }}>
      {/* LEFT panel (brand) */}
      <div
        style={{
          width: isMobile ? "100%" : "45%",
          minWidth: isMobile ? "auto" : "360px",
          background: "linear-gradient(180deg, #0F172A 0%, #1A2744 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "36px 24px" : "60px 48px",
          boxSizing: "border-box"
        }}
      >
        <div style={{
          width: '48px', height: '48px',
          background: T.primaryGrad,
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', fontWeight: 800, color: '#FFFFFF',
          boxShadow: T.primaryShadow,
          marginBottom: '16px'
        }}>P</div>
        <div style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.5px", textAlign: "center" }}>
          PBA Full-Time Portal
        </div>
        <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "6px", fontWeight: 500, textAlign: "center" }}>
          Platinum Business Academy
        </div>

        <div style={{ width: "40px", height: "3px", background: T.primaryGrad, borderRadius: "2px", margin: "18px auto" }} />

        <div style={{ fontSize: "12px", color: "#64748B", maxWidth: "280px", textAlign: "center", lineHeight: 1.5 }}>
          Comprehensive management portal for students, timetables, examinations, fees, and broadcasts.
        </div>
      </div>

      {/* RIGHT panel (form) */}
      <div
        style={{
          flex: 1,
          background: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "32px 24px" : "60px 48px",
          boxSizing: "border-box"
        }}
      >
        <div style={{ width: "100%", maxWidth: isMobile ? "100%" : "400px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginBottom: "6px", letterSpacing: "-0.4px" }}>
            Sign In to PBA
          </h2>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "24px" }}>
            Enter your credentials to access your account.
          </p>

          {/* Error Message */}
          {errorMsg && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "10px",
                padding: "10px 14px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#991B1B",
                fontWeight: 600
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}>
              <label style={{
                display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748B',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'
              }}>
                Username
              </label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: "#0F172A",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748B',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: "#0F172A",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px', fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                transition: 'all 0.15s ease',
                minHeight: isMobile ? '44px' : undefined
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div style={{ marginTop: "28px", paddingTop: "18px", borderTop: "1px solid #E2E8F0" }}>
            <p style={{ fontSize: "10px", color: "#64748B", textAlign: "center", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>
              Quick Demo Login
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "Admin", username: "admin", password: "admin123" },
                { label: "Coordinator", username: "coordinator.kohuwala", password: "coord123" },
                { label: "Lecturer", username: "lecturer1", password: "lect123" },
                { label: "Student", username: "student001", password: "student123" }
              ].map(({ label, username: u, password: p }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleQuickFill(u, p)}
                  style={{
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    color: '#475569',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: isMobile ? '40px' : undefined
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
