import React, { useState } from "react";
import { Card, SectionHeader, Btn } from "./InstructorUi";

const InstructorSettings = ({ settings, setSettings, showToast }) => {
  const [profile, setProfile] = useState({
    name: "Sarah Chen",
    email: "sarah@learnsphere.com",
    specialization: "Web Development, AI",
    payoutEmail: "sarah.pay@gmail.com",
  });
  const [showPass, setShowPass] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");

  const labelStyle = {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 600,
    marginBottom: 5,
    display: "block",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#f1f5f9",
    fontSize: 13,
    outline: "none",
  };

  const toggle = (i) =>
    setSettings(
      settings.map((s, idx) => (idx === i ? { ...s, on: !s.on } : s)),
    );

  const saveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const changePassword = () => {
    if (!pwForm.current) return setPwMsg("Enter your current password");
    if (pwForm.next.length < 6)
      return setPwMsg("New password must be at least 6 characters");
    if (pwForm.next !== pwForm.confirm)
      return setPwMsg("Passwords do not match");
    setPwMsg("Password changed successfully ✓");
    setPwForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwMsg(""), 3000);
  };

  return (
    <>
      {/* Profile card */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Profile" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            { label: "Display name", field: "name" },
            { label: "Email", field: "email" },
            { label: "Bio", field: "Bio" },
          ].map(({ label, field }) => (
            <div key={field}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>
                {label}
              </div>
              <input
                value={profile[field]}
                onChange={(e) =>
                  setProfile({ ...profile, [field]: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 10,
                  color: "#f1f5f9",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>
        <Btn variant="primary" onClick={() => showToast("Profile saved ✓")}>
          ✓ Save Changes
        </Btn>
      </Card>

      {/* Notification preferences */}
      <Card>
        <SectionHeader title="Notification Preferences" />
        {settings.map((s, i) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid #1e293b",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>
                {s.label}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {s.desc}
              </div>
            </div>
            {/* Toggle */}
            <button
              onClick={() => toggle(i)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: s.on ? "#7c3aed" : "#334155",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: s.on ? "calc(100% - 19px)" : 3,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
        ))}
      </Card>

      <Card title="Change Password" style={{ marginTop: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div>
            <label style={labelStyle}>Current password</label>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) =>
                setPwForm({ ...pwForm, current: e.target.value })
              }
              style={inputStyle}
              placeholder="••••••"
            />
          </div>
          <div>
            <label style={labelStyle}>New password</label>
            <input
              type="password"
              value={pwForm.next}
              onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
              style={inputStyle}
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm new password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) =>
                setPwForm({ ...pwForm, confirm: e.target.value })
              }
              style={inputStyle}
              placeholder="Repeat password"
            />
          </div>
        </div>
        {pwMsg && (
          <div
            style={{
              fontSize: 12,
              color: pwMsg.includes("✓") ? "#4ade80" : "#f87171",
              marginBottom: 10,
            }}
          >
            {pwMsg}
          </div>
        )}
        <button
          onClick={changePassword}
          style={{
            padding: "9px 20px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 10,
            color: "#f1f5f9",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Update Password
        </button>
      </Card>
    </>
  );
};

export default InstructorSettings;
