import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            width: "100vw",
            backgroundColor: "#1A3566",
            color: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "Inter, sans-serif"
          }}
        >
          <div
            style={{
              maxWidth: "500px",
              backgroundColor: "#FFFFFF",
              color: "#1E293B",
              padding: "32px",
              borderRadius: "16px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              textAlign: "center"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontWeight: 800,
                fontSize: "1.4rem"
              }}
            >
              ⚠️
            </div>
            <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.25rem", marginBottom: "8px" }}>
              Application Recovery Notice
            </h2>
            <p style={{ fontSize: "0.88rem", color: "#64748B", marginBottom: "20px" }}>
              The application encountered a runtime state error. Clicking below will reset local session storage and restart cleanly.
            </p>

            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.9rem"
              }}
            >
              Reset Session & Restart App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
