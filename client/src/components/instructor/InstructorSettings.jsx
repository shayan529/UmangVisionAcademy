import React, { useState } from "react"
import { Card, SectionHeader, Btn } from "./InstructorUi"

const InstructorSettings = ({ settings, setSettings, showToast }) => {
  const [profile, setProfile] = useState({
    name:           "Sarah Chen",
    email:          "sarah@learnsphere.com",
    specialization: "Web Development, AI",
    payoutEmail:    "sarah.pay@gmail.com",
  })

  const toggle = (i) =>
    setSettings(settings.map((s, idx) => idx === i ? { ...s, on: !s.on } : s))

  return (
    <>
      {/* Profile card */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Profile" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Display name",   field: "name"           },
            { label: "Email",          field: "email"          },
            { label: "Specialization", field: "specialization" },
            { label: "Payout email",   field: "payoutEmail"    },
          ].map(({ label, field }) => (
            <div key={field}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>{label}</div>
              <input
                value={profile[field]}
                onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 13, outline: "none" }}
              />
            </div>
          ))}
        </div>
        <Btn variant="primary" onClick={() => showToast("Profile saved ✓")}>✓ Save Changes</Btn>
      </Card>

      {/* Notification preferences */}
      <Card>
        <SectionHeader title="Notification Preferences" />
        {settings.map((s, i) => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1e293b" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.desc}</div>
            </div>
            {/* Toggle */}
            <button
              onClick={() => toggle(i)}
              style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: s.on ? "#7c3aed" : "#334155", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
            >
              <div style={{ position: "absolute", top: 3, left: s.on ? "calc(100% - 19px)" : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </button>
          </div>
        ))}
      </Card>
    </>
  )
}

export default InstructorSettings