import React from "react";

// ─── StatCard ─────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, color, delta }) => (
  <div
    style={{
      background: "#0b1120",
      border: "1px solid #1e293b",
      borderRadius: 14,
      padding: "18px 20px",
    }}
  >
    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
      {label}
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
    {/* Only render delta line if the prop is provided */}
    {delta && (
      <div style={{ fontSize: 11, color: "#34d399", marginTop: 4 }}>
        {delta}
      </div>
    )}
  </div>
);

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, color = "#7c3aed" }) => (
  <div
    style={{
      height: 6,
      background: "#334155",
      borderRadius: 3,
      overflow: "hidden",
      marginTop: 6,
    }}
  >
    <div
      style={{
        height: "100%",
        width: `${value}%`,
        background: color,
        borderRadius: 3,
        transition: "width 0.5s",
      }}
    />
  </div>
);

// ─── Btn ─────────────────────────────────────────────────────────────────────
export const Btn = ({ children, onClick, variant = "ghost", style = {}, disabled = false }) => {
  const base = {
    padding: "8px 16px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.15s",
    ...style,
  };
  const variants = {
    primary: {
      background: "linear-gradient(135deg,#7c3aed,#db2777)",
      color: "#fff",
    },
    ghost: {
      background: "#1e293b",
      color: "#cbd5e1",
      border: "1px solid #334155",
    },
    danger: {
      background: "#450a0a",
      color: "#f87171",
      border: "1px solid #7f1d1d",
    },
    success: {
      background: "#052e16",
      color: "#4ade80",
      border: "1px solid #14532d",
    },
  };
  return (
    <button
      style={{ ...base, ...variants[variant] }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: 20,
      padding: 20,
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── SectionHeader ────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    }}
  >
    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{title}</h3>
    {action}
  </div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
export const Toast = ({ msg }) => {
  if (!msg) return null;
  const isObject = typeof msg === "object" && msg !== null;
  const text = isObject ? msg.text || msg.msg : msg;
  const type = isObject ? msg.type : "info";

  let bg = "linear-gradient(135deg, #4f46e5, #7c3aed)";
  let shadow = "0 8px 32px rgba(79, 70, 229, 0.4)";

  if (type === "success") {
    bg = "linear-gradient(135deg, #059669, #10b981)";
    shadow = "0 8px 32px rgba(16, 185, 129, 0.4)";
  } else if (type === "error") {
    bg = "linear-gradient(135deg, #dc2626, #f43f5e)";
    shadow = "0 8px 32px rgba(220, 38, 38, 0.4)";
  }

  return (
    <>
      <style>{`
        .instr-toast-box {
          position: fixed;
          bottom: 24px;
          right: 24px;
          max-width: calc(100vw - 32px);
          z-index: 99999;
          word-break: break-word;
        }
        @media (max-width: 768px) {
          .instr-toast-box {
            bottom: 76px !important;
            right: 16px !important;
            left: 16px !important;
            margin: 0 auto;
            width: fit-content;
          }
        }
      `}</style>
      <div
        className="instr-toast-box"
        style={{
          background: bg,
          color: "#fff",
          padding: "12px 20px",
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: shadow,
          display: "flex",
          alignItems: "center",
          gap: 8,
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
    </>
  );
};
