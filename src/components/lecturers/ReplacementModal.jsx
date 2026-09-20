import React from "react";
import { useApp } from "../../context/AppContext";
import { UserCheck, AlertTriangle, X } from "lucide-react";

export const ReplacementModal = ({ isMobile }) => {
  const { replacementModal, setReplacementModal, assignCoverLecturer } = useApp();
  const { isOpen, leaveRequest, matchingLecturers } = replacementModal;
  const isMobileState = isMobile !== undefined ? isMobile : (window.innerWidth < 768);

  if (!isOpen || !leaveRequest) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,28,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: isMobileState ? "flex-start" : "center", justifyContent: "center", padding: isMobileState ? "20px 12px" : "0", overflowY: "auto" }}>
      <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: isMobileState ? "20px" : "28px", width: isMobileState ? "95vw" : "520px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.20)", position: "relative", margin: isMobileState ? "20px auto" : "auto" }}>
        <button
          onClick={() => setReplacementModal({ isOpen: false })}
          style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px", background: "#F4F5F7", border: "none", cursor: "pointer", fontSize: "18px", color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ×
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <AlertTriangle size={20} style={{ color: "#D97706" }} />
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A202C", margin: 0 }}>
            Replacement Needed — Cover Assignment
          </h3>
        </div>

        <div>
          <p style={{ fontSize: "13px", color: "#4A5568", marginBottom: "16px", lineHeight: "1.5" }}>
            Leave request for <strong>{leaveRequest.lecturerName}</strong> ({leaveRequest.subject}) on{" "}
            <strong>{leaveRequest.startDate}</strong> has been approved. Below are available replacement lecturers who teach the same/related subject and have free slots:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {matchingLecturers.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "#C53030", backgroundColor: "#FFF5F5", borderRadius: "8px", border: "1px solid #FEB2B2", fontSize: "13px" }}>
                No matching replacement lecturers available for this slot. Please reassign manually.
              </div>
            ) : (
              matchingLecturers.map((lec) => (
                <div
                  key={lec.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    border: "1px solid #E3E6EA",
                    borderRadius: "8px",
                    background: "#FFFFFF"
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "13px", color: "#1A202C" }}>{lec.name}</strong>
                    <div style={{ fontSize: "12px", color: "#718096" }}>
                      Subjects: {lec.subjects.join(", ")} | Phone: {lec.phone}
                    </div>
                  </div>
                  <button
                    style={{ background: 'linear-gradient(135deg, #2F855A, #276749)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => assignCoverLecturer(leaveRequest.id, lec.name)}
                  >
                    <UserCheck size={14} /> Assign as Cover
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #F4F5F7" }}>
          <button style={{ background: "#FFFFFF", color: "#4A5568", border: "1px solid #E3E6EA", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }} onClick={() => setReplacementModal({ isOpen: false })}>
            Skip Cover Assignment
          </button>
        </div>
      </div>
    </div>
  );
};
