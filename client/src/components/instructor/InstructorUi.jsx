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
    padding: "10px 12px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    color: "#94a3b8",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "700px",
          maxWidth: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h2
          style={{
            color: "#f8fafc",
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          Create New Course
        </h2>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          {/* Subject → maps to title */}
          <div>
            <label style={labelStyle}>Subject *</label>
            <input
              type="text"
              placeholder="e.g. Mathematics"
              value={courseForm.subject || ""}
              onChange={(e) =>
                setCourseForm({ ...courseForm, subject: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          {/* Class → maps to category */}
          <div>
            <label style={labelStyle}>Class *</label>
            <select
              value={courseForm.className || ""}
              onChange={(e) =>
                setCourseForm({ ...courseForm, className: e.target.value })
              }
              style={inputStyle}
            >
              <option value="">Select Class</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={`Class ${i + 1}`}>
                  Class {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description → maps to summary */}
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>
            Description *{" "}
            <span style={{ color: "#64748b", fontWeight: 400 }}>
              (shown as course summary)
            </span>
          </label>
          <textarea
            rows={3}
            placeholder="Brief description of the subject"
            value={courseForm.description || ""}
            onChange={(e) =>
              setCourseForm({ ...courseForm, description: e.target.value })
            }
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* Content → maps to description (full course content) */}
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>
            Course Content{" "}
            <span style={{ color: "#64748b", fontWeight: 400 }}>
              (full details, chapters, etc.)
            </span>
          </label>
          <textarea
            rows={5}
            placeholder={`Chapter 1: Algebra\nChapter 2: Linear Equations\nChapter 3: Geometry`}
            value={courseForm.content || ""}
            onChange={(e) =>
              setCourseForm({ ...courseForm, content: e.target.value })
            }
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 16,
          }}
        >
          {/* Thumbnail URL */}
          <div>
            <label style={labelStyle}>Thumbnail URL</label>
            <input
              type="text"
              placeholder="https://ik.imagekit.io/..."
              value={courseForm.thumbnailUrl || ""}
              onChange={(e) =>
                setCourseForm({ ...courseForm, thumbnailUrl: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          {/* Demo Video URL (ImageKit) */}
          <div>
            <label style={labelStyle}>
              Demo Video URL{" "}
              <span style={{ color: "#64748b", fontWeight: 400 }}>
                (ImageKit)
              </span>
            </label>
            <input
              type="text"
              placeholder="https://ik.imagekit.io/.../demo.mp4"
              value={courseForm.demoVideoUrl || ""}
              onChange={(e) =>
                setCourseForm({ ...courseForm, demoVideoUrl: e.target.value })
              }
              style={inputStyle}
            />
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #475569",
              background: "transparent",
              color: "#cbd5e1",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#7c3aed",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Create Course
          </button>
        </div>
      </div>
    </div>
  );
};
