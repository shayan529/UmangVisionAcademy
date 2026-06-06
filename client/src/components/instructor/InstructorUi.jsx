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
export const Btn = ({ children, onClick, variant = "ghost", style = {} }) => {
  const base = {
    padding: "8px 16px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
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
    <button style={{ ...base, ...variants[variant] }} onClick={onClick}>
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
export const Toast = ({ msg }) =>
  msg ? (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "#7c3aed",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        zIndex: 9999,
        boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
      }}
    >
      {msg}
    </div>
  ) : null;
