import React, { useState } from "react"

export default function Settings() {
  const [profile, setProfile] = useState({
    name: "Shayan",
    email: "shayan@gmail.com",
    bio: "Passionate learner exploring AI and Web Development.",
    avatar: "S",
  })

  const [notifications, setNotifications] = useState({
    liveClass:    true,
    newCourse:    true,
    community:    false,
    weeklyDigest: true,
    marketing:    false,
  })

  const [saved, setSaved] = useState(false)
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" })
  const [pwMsg,  setPwMsg]  = useState("")

  const saveProfile = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const changePassword = () => {
    if (!pwForm.current)               return setPwMsg("Enter your current password")
    if (pwForm.next.length < 6)        return setPwMsg("New password must be at least 6 characters")
    if (pwForm.next !== pwForm.confirm) return setPwMsg("Passwords do not match")
    setPwMsg("Password changed successfully ✓")
    setPwForm({ current: "", next: "", confirm: "" })
    setTimeout(() => setPwMsg(""), 3000)
  }

  const toggleNotif = (key) =>
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "#1e293b", border: "1px solid #334155",
    borderRadius: 10, color: "#f1f5f9", fontSize: 13, outline: "none",
  }

  const labelStyle = { fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 5, display: "block" }

  const SectionCard = ({ title, children }) => (
    <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 18, padding: "22px 24px", marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 18 }}>{title}</h3>
      {children}
    </div>
  )

  const Toggle = ({ checked, onChange }) => (
    <button type="button" onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: checked ? "#7c3aed" : "#334155", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: checked ? "calc(100% - 19px)" : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>Settings</h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <SectionCard title="Profile">
        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {profile.avatar}
          </div>
          <div>
            <button style={{ padding: "6px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 12, cursor: "pointer", marginRight: 8 }}>
              Upload photo
            </button>
            <button style={{ padding: "6px 14px", background: "transparent", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
              Remove
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email address</label>
            <input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Bio</label>
          <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <button onClick={saveProfile} style={{ padding: "9px 20px", background: saved ? "#052e16" : "linear-gradient(135deg,#7c3aed,#06b6d4)", border: "none", borderRadius: 10, color: saved ? "#4ade80" : "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
          {saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </SectionCard>

      {/* Password */}
      <SectionCard title="Change Password">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Current password</label>
            <input type="password" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} style={inputStyle} placeholder="••••••" />
          </div>
          <div>
            <label style={labelStyle}>New password</label>
            <input type="password" value={pwForm.next} onChange={e => setPwForm({ ...pwForm, next: e.target.value })} style={inputStyle} placeholder="Min 6 characters" />
          </div>
          <div>
            <label style={labelStyle}>Confirm new password</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} style={inputStyle} placeholder="Repeat password" />
          </div>
        </div>
        {pwMsg && (
          <div style={{ fontSize: 12, color: pwMsg.includes("✓") ? "#4ade80" : "#f87171", marginBottom: 10 }}>{pwMsg}</div>
        )}
        <button onClick={changePassword} style={{ padding: "9px 20px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Update Password
        </button>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notification Preferences">
        {[
          { key: "liveClass",    label: "Live class reminders",   desc: "Get reminded 1 hour before a live session starts"     },
          { key: "newCourse",    label: "New course alerts",      desc: "When an instructor you follow publishes a new course"  },
          { key: "community",    label: "Community replies",      desc: "When someone replies to your post"                    },
          { key: "weeklyDigest", label: "Weekly progress digest", desc: "Summary of your learning activity each week"          },
          { key: "marketing",    label: "Promotional emails",     desc: "Deals, offers and platform announcements"             },
        ].map(item => (
          <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1e293b" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{item.desc}</div>
            </div>
            <Toggle checked={notifications[item.key]} onChange={() => toggleNotif(item.key)} />
          </div>
        ))}
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger Zone">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f87171" }}>Delete account</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>This will permanently delete all your data. This cannot be undone.</div>
          </div>
          <button style={{ padding: "8px 16px", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Delete Account
          </button>
        </div>
      </SectionCard>
    </div>
  )
}
