import React, { useState } from "react"

const initialNotifs = [
  { icon: "📚", bg: "#EEEDFE", text: 'New lesson added to "Full Stack Web Development"',       time: "5 min ago",  read: false },
  { icon: "🏆", bg: "#E1F5EE", text: "You ranked up to #6 on the Leaderboard!",                time: "18 min ago", read: false },
  { icon: "🤖", bg: "#FBEAF0", text: "Your AI Tutor session summary is ready to review",       time: "1 hr ago",   read: false },
  { icon: "💬", bg: "#FAEEDA", text: "Someone replied to your post in the React community",    time: "2 hr ago",   read: false },
  { icon: "✅", bg: "#E1F5EE", text: 'You completed "JavaScript Closures" — great work!',      time: "Yesterday",  read: true  },
  { icon: "📅", bg: "#EEEDFE", text: "Reminder: Live Q&A session starts in 1 hour",           time: "Yesterday",  read: true  },
  { icon: "🎓", bg: "#FBEAF0", text: 'Certificate issued for "UI/UX Design Fundamentals"',    time: "2 days ago", read: true  },
]

const StudentNotifications = () => {
  const [notifs, setNotifs] = useState(initialNotifs)

  const unread   = notifs.filter((n) => !n.read).length
  const markAll  = () => setNotifs(notifs.map((n) => ({ ...n, read: true })))
  const markOne  = (i) => setNotifs(notifs.map((n, idx) => idx === i ? { ...n, read: true } : n))
  const deleteOne = (i) => setNotifs(notifs.filter((_, idx) => idx !== i))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
            Notifications
            {unread > 0 && (
              <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#2e1065", color: "#a78bfa" }}>
                {unread} unread
              </span>
            )}
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {unread > 0 ? `You have ${unread} new notification${unread > 1 ? "s" : ""}` : "You're all caught up!"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAll}
            style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#cbd5e1", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, overflow: "hidden" }}>
        {notifs.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
            No notifications yet.
          </div>
        )}

        {notifs.map((n, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "16px 20px",
              borderBottom: i < notifs.length - 1 ? "1px solid #1e293b" : "none",
              opacity: n.read ? 0.55 : 1,
              transition: "opacity 0.2s",
              background: !n.read ? "rgba(124,58,237,0.04)" : "transparent",
            }}
          >
            {/* Unread indicator stripe */}
            <div style={{ width: 3, borderRadius: 4, alignSelf: "stretch", background: !n.read ? "#7c3aed" : "transparent", flexShrink: 0 }} />

            {/* Icon bubble */}
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: n.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
              {n.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "#f1f5f9", lineHeight: 1.5 }}>{n.text}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{n.time}</div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {/* Unread dot — click to mark read */}
              {!n.read && (
                <button
                  onClick={() => markOne(i)}
                  title="Mark as read"
                  style={{ width: 10, height: 10, borderRadius: "50%", background: "#7c3aed", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
                />
              )}
              {/* Delete button */}
              <button
                onClick={() => deleteOne(i)}
                title="Dismiss"
                style={{ background: "transparent", border: "none", color: "#475569", fontSize: 15, cursor: "pointer", padding: "2px 4px", lineHeight: 1, borderRadius: 6, transition: "color 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#475569"}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudentNotifications