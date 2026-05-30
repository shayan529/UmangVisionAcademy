import React, { useState } from "react"

const courseData = [
  { icon: "💻", bg: "#EEEDFE", title: "Full Stack Web Development", students: 1240, earn: "$12,400", prog: 78, status: "published" },
  { icon: "🤖", bg: "#E1F5EE", title: "AI & Machine Learning", students: 840, earn: "$8,920", prog: 62, status: "published" },
  { icon: "🎨", bg: "#FBEAF0", title: "UI/UX Design Masterclass", students: 560, earn: "$5,640", prog: 91, status: "published" },
  { icon: "⚡", bg: "#FAEEDA", title: "Node.js Advanced Patterns", students: 320, earn: "$3,200", prog: 55, status: "draft" },
]

const studentData = [
  { init: "MJ", bg: "#EEEDFE", ic: "#534AB7", name: "Mia Johnson", course: "AI & Machine Learning", prog: 92 },
  { init: "LC", bg: "#E1F5EE", ic: "#0F6E56", name: "Leo Chen", course: "Full Stack Web Dev", prog: 88 },
  { init: "AP", bg: "#FBEAF0", ic: "#993556", name: "Ava Patel", course: "UI/UX Design", prog: 85 },
  { init: "RS", bg: "#FAEEDA", ic: "#854F0B", name: "Raj Singh", course: "Full Stack Web Dev", prog: 71 },
]

const initialSessions = [
  { title: "React Live Workshop", date: "Today", time: "6:00 PM", status: "live" },
  { title: "AI Career Mentorship", date: "Tomorrow", time: "8:30 PM", status: "upcoming" },
  { title: "Design Systems Q&A", date: "Friday", time: "5:00 PM", status: "upcoming" },
]

const initialNotifs = [
  { icon: "⭐", bg: "#EEEDFE", text: 'New 5-star review on "UI/UX Design Masterclass"', time: "5 min ago", read: false },
  { icon: "👤", bg: "#E1F5EE", text: "Raj Singh enrolled in Full Stack Web Dev", time: "22 min ago", read: false },
  { icon: "💬", bg: "#FAEEDA", text: "Mia Johnson posted a question in community", time: "1 hr ago", read: false },
  { icon: "📅", bg: "#EEEDFE", text: "Live session reminder: React Workshop in 2 hours", time: "2 hr ago", read: true },
  { icon: "🏅", bg: "#E1F5EE", text: "Leo Chen earned a certificate for Web Dev", time: "Yesterday", read: true },
]

const initialSettings = [
  { label: "Email notifications", desc: "Get notified of enrollments and reviews", on: true },
  { label: "Live session alerts", desc: "Reminder 1 hour before each session", on: true },
  { label: "Weekly digest", desc: "Summary of earnings and student progress", on: false },
  { label: "Auto-approve reviews", desc: "Publish reviews without moderation", on: false },
]

const aiReplies = [
  "Based on your course analytics, I recommend adding more hands-on projects to boost completion rates. Your top students prefer practical exercises.",
  "Looking at your engagement data, students tend to drop off at Module 6. Consider breaking it into smaller 5-minute segments.",
  "Your 'UI/UX Design Masterclass' has a 91% completion rate — the highest on your account. More visual courses like this could boost your overall metrics.",
  "I noticed your live sessions have 84% attendance. Sending reminder emails 2 hours before could push that above 90%.",
]

const navItems = [
  { id: "dashboard", label: "📊 Dashboard" },
  { id: "courses", label: "📚 My Courses" },
  { id: "students", label: "👥 Students" },
  { id: "sessions", label: "🎥 Live Sessions" },
  { id: "analytics", label: "📈 Analytics" },
  { id: "earnings", label: "💰 Earnings" },
  { id: "ai", label: "🤖 AI Assistant" },
  { id: "notifications", label: "🔔 Notifications" },
  { id: "settings", label: "⚙️ Settings" },
]

const sectionTitles = {
  dashboard: "Dashboard",
  courses: "My Courses",
  students: "Student Insights",
  sessions: "Live Sessions",
  analytics: "Analytics",
  earnings: "Earnings",
  ai: "AI Assistant",
  notifications: "Notifications",
  settings: "Settings",
}

// ─── Reusable UI primitives ───────────────────────────────────────────────────

const StatCard = ({ label, value, color = "#534AB7", delta }) => (
  <div style={{ background: "#1e293b", borderRadius: 16, padding: "18px 20px", border: "1px solid #334155" }}>
    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    {delta && <div style={{ fontSize: 11, color: "#10b981", marginTop: 4 }}>{delta}</div>}
  </div>
)

const ProgressBar = ({ value, color = "#7c3aed" }) => (
  <div style={{ height: 6, background: "#334155", borderRadius: 3, overflow: "hidden", marginTop: 6 }}>
    <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
  </div>
)

const Btn = ({ children, onClick, variant = "ghost", style = {} }) => {
  const base = { padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s", ...style }
  const variants = {
    primary: { background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "#fff" },
    ghost: { background: "#1e293b", color: "#cbd5e1", border: "1px solid #334155" },
    danger: { background: "#450a0a", color: "#f87171", border: "1px solid #7f1d1d" },
    success: { background: "#052e16", color: "#4ade80", border: "1px solid #14532d" },
  }
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick}>{children}</button>
}

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, padding: 20, ...style }}>
    {children}
  </div>
)

const SectionHeader = ({ title, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{title}</h3>
    {action}
  </div>
)

const Toast = ({ msg }) =>
  msg ? (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: "#7c3aed", color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>
      {msg}
    </div>
  ) : null

const AddCourseModal = ({ visible, onClose, courseForm, setCourseForm, onAdd }) =>
  visible ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,8,23,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 9998 }}>
      <div style={{ width: 420, maxWidth: "100%", background: "#020817", borderRadius: 24, border: "1px solid #334155", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", padding: 28, color: "#f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Add New Course</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Create a new course for your library.</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", color: "#94a3b8", fontSize: 18, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
          {[
            { label: "Course title", key: "title", type: "text", placeholder: "e.g. React for beginners" },
            { label: "Students", key: "students", type: "number", placeholder: "e.g. 120" },
            { label: "Earnings", key: "earn", type: "text", placeholder: "e.g. $1,200" },
            { label: "Completion %", key: "prog", type: "number", placeholder: "e.g. 85" },
          ].map(({ label, key, type, placeholder }) => (
            <label key={key} style={{ display: "grid", gap: 6, fontSize: 12, color: "#cbd5e1" }}>
              <span>{label}</span>
              <input
                type={type}
                placeholder={placeholder}
                value={courseForm[key]}
                onChange={(e) => setCourseForm({ ...courseForm, [key]: e.target.value })}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: 13, outline: "none" }}
              />
            </label>
          ))}
          <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#cbd5e1" }}>
            <span>Status</span>
            <select value={courseForm.status} onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: 13, outline: "none" }}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="ghost" style={{ fontSize: 13, padding: "10px 16px" }} onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" style={{ fontSize: 13, padding: "10px 16px" }} onClick={onAdd}>Add course</Btn>
        </div>
      </div>
    </div>
  ) : null

// ─── Section components ───────────────────────────────────────────────────────

const DashboardSection = ({ showToast, courses }) => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
      <StatCard label="Total Courses" value={courses.length.toString()} color="#a78bfa" delta="+2 this month" />
      <StatCard label="Total Students" value="4,200" color="#34d399" delta="+340 this month" />
      <StatCard label="Total Earnings" value="$26,400" color="#fbbf24" delta="+18% this month" />
      <StatCard label="Instructor Rating" value="4.9 ★" color="#4ade80" delta="Top 2% on platform" />
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card>
        <SectionHeader title="Active Courses" action={<Btn variant="ghost" style={{ fontSize: 12, padding: "5px 10px" }}>View all</Btn>} />
        {courses.slice(0, 3).map((c) => (
          <div key={c.title} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: c.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{c.students} students · {c.earn}</div>
                <ProgressBar value={c.prog} />
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{c.prog}% avg completion</div>
              </div>
            </div>
          </div>
        ))}
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <SectionHeader title="Upcoming Sessions" action={<Btn variant="ghost" style={{ fontSize: 12, padding: "5px 10px" }}>Manage</Btn>} />
          {initialSessions.map((s) => (
            <div key={s.title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.status === "live" ? "#10b981" : "#7c3aed", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{s.title}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{s.date} — {s.time}</div>
              </div>
              <Btn variant={s.status === "live" ? "success" : "ghost"} style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => showToast(s.status === "live" ? "Joining session..." : "Session link copied")}>
                {s.status === "live" ? "Join" : "Link"}
              </Btn>
            </div>
          ))}
        </Card>

        <Card>
          <SectionHeader title="This Month" />
          {[["Course sales", "$5,800"], ["Live sessions", "$1,900"], ["Mentorship 1:1", "$500"], ["Subscriptions", "$220"]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1e293b", fontSize: 13 }}>
              <span style={{ color: "#94a3b8" }}>{l}</span><span style={{ fontWeight: 600, color: "#f1f5f9" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 15, fontWeight: 700 }}>
            <span style={{ color: "#f1f5f9" }}>Total</span><span style={{ color: "#a78bfa" }}>$8,420</span>
          </div>
        </Card>
      </div>
    </div>
  </>
)

const CoursesSection = ({ showToast, courses, onNewCourse }) => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
      <StatCard label="Published" value="18" color="#a78bfa" />
      <StatCard label="Draft" value="6" color="#fbbf24" />
      <StatCard label="Archived" value="2" color="#64748b" />
    </div>
    <Card>
      <SectionHeader title="All Courses" action={<Btn variant="primary" style={{ fontSize: 12 }} onClick={onNewCourse}>+ New Course</Btn>} />
      {courses.map((c) => (
        <div key={c.title} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid #1e293b" }}>
          <div style={{ width: 42, height: 42, background: c.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{c.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{c.title}</div>
            <div style={{ fontSize: 12, color: "#64748b", margin: "3px 0" }}>{c.students} students · {c.earn} earned</div>
            <ProgressBar value={c.prog} />
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{c.prog}% avg completion</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: c.status === "published" ? "#052e16" : "#1c1003", color: c.status === "published" ? "#4ade80" : "#fbbf24" }}>
              {c.status}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn variant="ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => showToast(`Editing: ${c.title}`)}>Edit</Btn>
              <Btn variant="ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => showToast("Opening analytics...")}>Stats</Btn>
            </div>
          </div>
        </div>
      ))}
    </Card>
  </>
)

const StudentsSection = () => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
      <StatCard label="Total Enrolled" value="4,200" color="#a78bfa" />
      <StatCard label="Active This Week" value="1,600" color="#34d399" />
      <StatCard label="Completed a Course" value="890" color="#4ade80" />
      <StatCard label="Avg Completion" value="77%" color="#fbbf24" />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card>
        <SectionHeader title="Top Learners" />
        {studentData.map((s) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: s.bg, color: s.ic, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.init}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{s.name}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{s.course}</div>
            </div>
            <div style={{ textAlign: "right", minWidth: 60 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>{s.prog}%</div>
              <ProgressBar value={s.prog} />
            </div>
          </div>
        ))}
      </Card>
      <Card>
        <SectionHeader title="Recent Activity" />
        {[
          { init: "MJ", bg: "#EEEDFE", ic: "#534AB7", name: "Mia Johnson", action: "Completed module 8 · AI & ML", tag: "done", tc: "#4ade80", tb: "#052e16" },
          { init: "LC", bg: "#E1F5EE", ic: "#0F6E56", name: "Leo Chen", action: "Submitted assignment · Web Dev", tag: "graded", tc: "#a78bfa", tb: "#2e1065" },
          { init: "AP", bg: "#FAEEDA", ic: "#854F0B", name: "Ava Patel", action: "Posted in community · Design", tag: "reply", tc: "#fbbf24", tb: "#1c1003" },
          { init: "RS", bg: "#FBEAF0", ic: "#993556", name: "Raj Singh", action: "Enrolled · Full Stack Web Dev", tag: "new", tc: "#34d399", tb: "#022c22" },
        ].map((s) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: s.bg, color: s.ic, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s.init}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{s.name}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{s.action}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: s.tb, color: s.tc }}>{s.tag}</span>
          </div>
        ))}
      </Card>
    </div>
  </>
)

const SessionsSection = ({ sessions, setSessions, showToast }) => {
  const [form, setForm] = useState({ title: "", date: "", time: "" })

  const schedule = () => {
    if (!form.title.trim()) { showToast("Enter a session title"); return }
    setSessions([...sessions, { ...form, date: form.date || "TBD", time: form.time || "TBD", status: "upcoming" }])
    setForm({ title: "", date: "", time: "" })
    showToast("Session scheduled!")
  }

  const remove = (i) => {
    setSessions(sessions.filter((_, idx) => idx !== i))
    showToast("Session removed")
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Schedule New Session" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[
            { label: "Title", field: "title", type: "text", placeholder: "Session title" },
            { label: "Date", field: "date", type: "date", placeholder: "" },
            { label: "Time", field: "time", type: "time", placeholder: "" },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>{label}</div>
              <input
                type={type}
                placeholder={placeholder}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 13, outline: "none" }}
              />
            </div>
          ))}
        </div>
        <Btn variant="primary" onClick={schedule}>📅 Schedule Session</Btn>
      </Card>

      <Card>
        <SectionHeader title="All Sessions" />
        {sessions.length === 0 && <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No sessions scheduled yet.</div>}
        {sessions.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #1e293b" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.status === "live" ? "#10b981" : "#7c3aed", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{s.date}{s.time ? ` — ${s.time}` : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {s.status === "live"
                ? <Btn variant="success" style={{ fontSize: 12 }} onClick={() => showToast("Joining session...")}>Join Live</Btn>
                : <Btn variant="ghost" style={{ fontSize: 12 }} onClick={() => showToast("Session link copied")}>Copy Link</Btn>}
              <Btn variant="danger" style={{ fontSize: 12, padding: "8px 10px" }} onClick={() => remove(i)}>🗑</Btn>
            </div>
          </div>
        ))}
      </Card>
    </>
  )
}

const AnalyticsSection = () => {
  const bars = [12, 28, 19, 34, 22, 40, 36]
  const metrics = [
    { label: "Course completion", val: 78, color: "#7c3aed" },
    { label: "Quiz performance", val: 91, color: "#10b981" },
    { label: "Video completion", val: 85, color: "#f59e0b" },
    { label: "Community posts", val: 42, color: "#ef4444" },
    { label: "Live attendance", val: 84, color: "#db2777" },
  ]
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Avg Completion" value="77%" color="#a78bfa" />
        <StatCard label="Quiz Pass Rate" value="91%" color="#34d399" />
        <StatCard label="Live Attendance" value="84%" color="#fbbf24" />
        <StatCard label="Review Score" value="4.9 ★" color="#4ade80" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionHeader title="Engagement Metrics" />
          {metrics.map((m) => (
            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", width: 130, flexShrink: 0 }}>{m.label}</div>
              <div style={{ flex: 1, height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${m.val}%`, background: m.color, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: m.color, width: 36, textAlign: "right" }}>{m.val}%</div>
            </div>
          ))}
        </Card>
        <Card>
          <SectionHeader title="Enrollment Trend (7 days)" />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, marginBottom: 16 }}>
            {bars.map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${(v / 40) * 100}%`, background: "linear-gradient(to top,#7c3aed,#a78bfa)", borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
            ))}
          </div>
          <div style={{ background: "#1e293b", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Top performing course</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>UI/UX Design Masterclass</div>
            <div style={{ fontSize: 12, color: "#64748b", margin: "3px 0 8px" }}>91% completion · 4.9★ rating</div>
            <ProgressBar value={91} color="#10b981" />
          </div>
        </Card>
      </div>
    </>
  )
}

const EarningsSection = ({ showToast }) => {
  const monthlyBars = [5200, 6100, 5800, 7100, 7800, 8420]
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="This Month" value="$8,420" color="#a78bfa" delta="+18% vs last" />
        <StatCard label="Last Month" value="$7,140" color="#f1f5f9" />
        <StatCard label="All-Time Earnings" value="$26,400" color="#fbbf24" />
        <StatCard label="Pending Payout" value="$2,860" color="#34d399" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionHeader title="Revenue Breakdown" />
          {[["Course enrollments", "$5,800"], ["Live sessions", "$1,900"], ["Mentorship 1:1", "$500"], ["Subscriptions", "$220"]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #1e293b", fontSize: 13 }}>
              <span style={{ color: "#94a3b8" }}>{l}</span>
              <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: 16, fontWeight: 700 }}>
            <span style={{ color: "#f1f5f9" }}>Total</span>
            <span style={{ color: "#a78bfa" }}>$8,420</span>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e293b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}><span>Platform fee (20%)</span><span style={{ color: "#f87171" }}>-$1,684</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}><span style={{ color: "#94a3b8" }}>Net payout</span><span style={{ color: "#4ade80" }}>$6,736</span></div>
          </div>
          <Btn variant="primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} onClick={() => showToast("Payout of $2,860 initiated ✓")}>
            💸 Withdraw $2,860
          </Btn>
        </Card>
        <Card>
          <SectionHeader title="Monthly Earnings (6 mo)" />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, marginBottom: 8 }}>
            {monthlyBars.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                  <div style={{ width: "100%", height: `${(v / 8420) * 100}%`, background: i === 5 ? "linear-gradient(to top,#7c3aed,#a78bfa)" : "#1e293b", borderRadius: "4px 4px 0 0", border: "1px solid #334155", transition: "height 0.4s" }} />
                </div>
                <div style={{ fontSize: 10, color: "#64748b" }}>{labels[i]}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>Highlighted bar = current month</div>
          <div style={{ marginTop: 16, background: "#1e293b", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Month-over-month growth</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#4ade80", margin: "4px 0 2px" }}>+18%</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>$1,280 more than last month</div>
          </div>
        </Card>
      </div>
    </>
  )
}

const AISection = ({ showToast }) => {
  const [aiTab, setAiTab] = useState("chat")
  const [chatLog, setChatLog] = useState([{ role: "ai", text: "Hi! I'm your teaching assistant. Ask me to generate quizzes, analyse student engagement, suggest lesson improvements, or brainstorm course ideas." }])
  const [chatInput, setChatInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [quizForm, setQuizForm] = useState({ topic: "", difficulty: "Intermediate" })
  const [quiz, setQuiz] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)

  const sendChat = (msg) => {
    const text = msg || chatInput.trim()
    if (!text) return
    setChatLog((prev) => [...prev, { role: "user", text }])
    setChatInput("")
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setChatLog((prev) => [...prev, { role: "ai", text: aiReplies[Math.floor(Math.random() * aiReplies.length)] }])
    }, 1200)
  }

  const generateQuiz = () => {
    if (!quizForm.topic.trim()) { showToast("Enter a topic"); return }
    setQuizLoading(true)
    setQuiz(null)
    setTimeout(() => {
      setQuizLoading(false)
      setQuiz([
        { q: `What is the primary use case of ${quizForm.topic}?`, opts: ["Styling web pages", "Adding dynamic behavior", "Structuring HTML", "Server configuration"], ans: 1 },
        { q: `Which concept is fundamental to ${quizForm.topic}?`, opts: ["Inheritance", "Closures", "Flexbox", "SQL joins"], ans: 1 },
        { q: `How do you handle async operations in ${quizForm.topic}?`, opts: ["CSS transitions", "Promises / async-await", "HTML attributes", "SQL transactions"], ans: 1 },
      ])
    }, 1200)
  }

  const insightItems = [
    { icon: "⚠️", title: "Drop-off risk detected", desc: "23 students in \"AI & ML\" haven't logged in for 7+ days.", action: "Send nudge email", ac: () => showToast("Re-engagement email sent to 23 students") },
    { icon: "📉", title: "High struggle point", desc: "Module 6 \"Async/Await\" has a 44% replay rate. Consider an extra explainer video.", action: "Flag for review", ac: () => showToast("Flagged for content review") },
    { icon: "🔍", title: "Top search query", desc: "Students search \"TypeScript + React\" most — you don't have this course yet.", action: "Save course idea", ac: () => showToast("Course idea saved to drafts") },
  ]

  const tabs = [{ id: "chat", label: "Chat" }, { id: "quiz", label: "Quiz Generator" }, { id: "insights", label: "Student Insights" }]

  return (
    <Card>
      <SectionHeader title="AI Teaching Assistant" action={<span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#2e1065", color: "#a78bfa" }}>✨ AI Powered</span>} />
      <div style={{ display: "flex", gap: 4, background: "#1e293b", padding: 4, borderRadius: 12, marginBottom: 16 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setAiTab(t.id)} style={{ flex: 1, padding: "7px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: aiTab === t.id ? "#0f172a" : "transparent", color: aiTab === t.id ? "#a78bfa" : "#64748b", transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {aiTab === "chat" && (
        <>
          <div style={{ minHeight: 140, maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {chatLog.map((m, i) => (
              <div key={i} style={{ padding: "10px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.5, maxWidth: "80%", alignSelf: m.role === "user" ? "flex-end" : "flex-start", background: m.role === "user" ? "linear-gradient(135deg,#7c3aed,#db2777)" : "#1e293b", color: "#f1f5f9" }}>
                {m.text}
              </div>
            ))}
            {typing && (
              <div style={{ padding: "10px 14px", borderRadius: 12, background: "#1e293b", display: "flex", gap: 4, alignItems: "center", width: 60 }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#64748b", animation: `pulse 1.2s ${d}s infinite` }} />
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="e.g. What topics are students struggling with?" style={{ flex: 1, padding: "10px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 13, outline: "none" }} />
            <Btn variant="primary" onClick={() => sendChat()}>Send</Btn>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Improve my lowest-rated course", "What are students struggling with?", "Generate a quiz on React hooks"].map((q) => (
              <button key={q} onClick={() => sendChat(q)} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", cursor: "pointer" }}>{q}</button>
            ))}
          </div>
        </>
      )}

      {aiTab === "quiz" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {[{ label: "Topic", field: "topic", type: "text", placeholder: "e.g. JavaScript closures" }].map(({ label, field, type, placeholder }) => (
              <div key={field}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>{label}</div>
                <input type={type} placeholder={placeholder} value={quizForm[field]} onChange={(e) => setQuizForm({ ...quizForm, [field]: e.target.value })} style={{ width: "100%", padding: "9px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 13, outline: "none" }} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>Difficulty</div>
              <select value={quizForm.difficulty} onChange={(e) => setQuizForm({ ...quizForm, difficulty: e.target.value })} style={{ width: "100%", padding: "9px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 13, outline: "none" }}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
          </div>
          <Btn variant="primary" onClick={generateQuiz}>✨ Generate Quiz</Btn>
          {quizLoading && <div style={{ fontSize: 13, color: "#64748b", marginTop: 12 }}>Generating quiz...</div>}
          {quiz && (
            <div style={{ marginTop: 16 }}>
              {quiz.map((q, i) => (
                <div key={i} style={{ background: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 10 }}>Q{i + 1}. {q.q}</div>
                  {q.opts.map((o, j) => (
                    <div key={j} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, marginBottom: 4, background: j === q.ans ? "#052e16" : "#0f172a", color: j === q.ans ? "#4ade80" : "#94a3b8", border: `1px solid ${j === q.ans ? "#14532d" : "#1e293b"}` }}>
                      {o}{j === q.ans ? " ✓" : ""}
                    </div>
                  ))}
                </div>
              ))}
              <Btn variant="success" onClick={() => showToast("Quiz added to course")}>✓ Add to Course</Btn>
            </div>
          )}
        </>
      )}

      {aiTab === "insights" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {insightItems.map((item) => (
            <div key={item.title} style={{ background: "#1e293b", borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>{item.icon} {item.title}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>{item.desc}</div>
              <Btn variant="primary" style={{ fontSize: 12 }} onClick={item.ac}>{item.action}</Btn>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

const NotificationsSection = ({ notifs, setNotifs }) => {
  const unread = notifs.filter((n) => !n.read).length

  const markAll = () => setNotifs(notifs.map((n) => ({ ...n, read: true })))
  const markOne = (i) => setNotifs(notifs.map((n, idx) => idx === i ? { ...n, read: true } : n))

  return (
    <Card>
      <SectionHeader
        title={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        action={unread > 0 ? <Btn variant="ghost" style={{ fontSize: 12 }} onClick={markAll}>Mark all read</Btn> : null}
      />
      {notifs.map((n, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid #1e293b", opacity: n.read ? 0.6 : 1 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: n.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{n.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#f1f5f9" }}>{n.text}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{n.time}</div>
          </div>
          {!n.read && (
            <button onClick={() => markOne(i)} style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", border: "none", cursor: "pointer", marginTop: 6, flexShrink: 0, padding: 0 }} title="Mark read" />
          )}
        </div>
      ))}
    </Card>
  )
}

const SettingsSection = ({ settings, setSettings, showToast }) => {
  const [profile, setProfile] = useState({ name: "Sarah Chen", email: "sarah@learnsphere.com", specialization: "Web Development, AI", payoutEmail: "sarah.pay@gmail.com" })

  const toggle = (i) => setSettings(settings.map((s, idx) => idx === i ? { ...s, on: !s.on } : s))

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Profile" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Display name", field: "name" },
            { label: "Email", field: "email" },
            { label: "Specialization", field: "specialization" },
            { label: "Payout email", field: "payoutEmail" },
          ].map(({ label, field }) => (
            <div key={field}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>{label}</div>
              <input value={profile[field]} onChange={(e) => setProfile({ ...profile, [field]: e.target.value })} style={{ width: "100%", padding: "9px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 13, outline: "none" }} />
            </div>
          ))}
        </div>
        <Btn variant="primary" onClick={() => showToast("Profile saved ✓")}>✓ Save Changes</Btn>
      </Card>

      <Card>
        <SectionHeader title="Notification Preferences" />
        {settings.map((s, i) => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1e293b" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.desc}</div>
            </div>
            <button onClick={() => toggle(i)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: s.on ? "#7c3aed" : "#334155", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 3, left: s.on ? "calc(100% - 19px)" : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </button>
          </div>
        ))}
      </Card>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InstructorDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sessions, setSessions] = useState(initialSessions)
  const [notifs, setNotifs] = useState(initialNotifs)
  const [settings, setSettings] = useState(initialSettings)
  const [toast, setToast] = useState("")
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [customCourses, setCustomCourses] = useState([])
  const [courseForm, setCourseForm] = useState({ title: "", students: "", earn: "", prog: "", status: "published" })
  const allCourses = [...courseData, ...customCourses]

  const openNewCourseModal = () => setShowCourseModal(true)
  const closeNewCourseModal = () => {
    setShowCourseModal(false)
    setCourseForm({ title: "", students: "", earn: "", prog: "", status: "published" })
  }

  const addNewCourse = () => {
    if (!courseForm.title.trim()) { showToast("Enter a course title"); return }
    const newCourse = {
      icon: "📚",
      bg: "#E1F5EE",
      title: courseForm.title,
      students: Number(courseForm.students) || 0,
      earn: courseForm.earn || "$0",
      prog: Math.min(100, Math.max(0, Number(courseForm.prog) || 0)),
      status: courseForm.status,
    }
    setCustomCourses([newCourse, ...customCourses])
    closeNewCourseModal()
    showToast("New course added")
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2500)
  }

  const unread = notifs.filter((n) => !n.read).length

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":    return <DashboardSection showToast={showToast} courses={allCourses} />
      case "courses":      return <CoursesSection showToast={showToast} courses={allCourses} onNewCourse={openNewCourseModal} />
      case "students":     return <StudentsSection />
      case "sessions":     return <SessionsSection sessions={sessions} setSessions={setSessions} showToast={showToast} />
      case "analytics":    return <AnalyticsSection />
      case "earnings":     return <EarningsSection showToast={showToast} />
      case "ai":           return <AISection showToast={showToast} />
      case "notifications":return <NotificationsSection notifs={notifs} setNotifs={setNotifs} />
      case "settings":     return <SettingsSection settings={settings} setSettings={setSettings} showToast={showToast} />
      default:             return null
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#020817", color: "#f1f5f9", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: 230, background: "#0b1120", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", padding: "24px 12px", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#a78bfa", padding: "0 10px", marginBottom: 28 }}>
          Learn<span style={{ color: "#f1f5f9" }}>Sphere</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", background: "#1e293b", borderRadius: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>SC</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Sarah Chen</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Top Instructor</div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveSection(id)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, border: "none", textAlign: "left", fontSize: 13, fontWeight: 500, cursor: "pointer", background: activeSection === id ? "#2e1065" : "transparent", color: activeSection === id ? "#a78bfa" : "#64748b", marginBottom: 2, transition: "all 0.15s" }}>
              {label}
              {id === "notifications" && unread > 0 && (
                <span style={{ background: "#7c3aed", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>{unread}</span>
              )}
            </button>
          ))}
        </nav>

        <button onClick={() => showToast("Logged out")} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #7f1d1d", background: "#1c0505", color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 12 }}>
          🚪 Log out
        </button>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", background: "#0b1120", borderBottom: "1px solid #1e293b", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{sectionTitles[activeSection]}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" style={{ fontSize: 12 }} onClick={() => showToast("Report exported")}>📥 Export</Btn>
            {["dashboard", "courses"].includes(activeSection) && (
              <Btn variant="primary" style={{ fontSize: 12 }} onClick={openNewCourseModal}>+ New Course</Btn>
            )}
            {activeSection === "sessions" && (
              <Btn variant="primary" style={{ fontSize: 12 }} onClick={() => setActiveSection("sessions")}>📅 Schedule</Btn>
            )}
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {renderSection()}
        </div>
      </div>

      <AddCourseModal
        visible={showCourseModal}
        onClose={closeNewCourseModal}
        courseForm={courseForm}
        setCourseForm={setCourseForm}
        onAdd={addNewCourse}
      />

      {/* Pulse animation for typing dots */}
      <style>{`@keyframes pulse{0%,80%,100%{opacity:.3}40%{opacity:1}}`}</style>

      <Toast msg={toast} />
    </div>
  )
}