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

// ─── AddCourseModal ───────────────────────────────────────────────────────────
export const AddCourseModal = ({
  visible,
  onClose,
  courseForm,
  setCourseForm,
  onAdd,
}) => {
  if (!visible) return null;

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#f1f5f9",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 5,
    display: "block",
  };

  const textFields = [
    {
      label: "Course Title *",
      field: "title",
      type: "text",
      placeholder: "e.g. React for Beginners",
    },
    {
      label: "Summary *",
      field: "summary",
      type: "text",
      placeholder: "Short description of the course",
    },
    {
      label: "Category",
      field: "category",
      type: "text",
      placeholder: "e.g. Web Development",
    },
    {
      label: "Price ($)",
      field: "price",
      type: "number",
      placeholder: "0 for free",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(2,8,23,0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          background: "#0b1120",
          border: "1px solid #1e293b",
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 480,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
            Add New Course
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Text fields */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginBottom: 14,
          }}
        >
          {textFields.map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label style={labelStyle}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={courseForm[field]}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, [field]: e.target.value })
                }
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {/* Level + Status selects */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <div>
            <label style={labelStyle}>Level</label>
            <select
              value={courseForm.level}
              onChange={(e) =>
                setCourseForm({ ...courseForm, level: e.target.value })
              }
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={courseForm.status}
              onChange={(e) =>
                setCourseForm({ ...courseForm, status: e.target.value })
              }
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={onAdd}>
            Create Course
          </Btn>
        </div>
      </div>
    </div>
  );
};
