import React, { useState } from "react"

const MY_COURSES = [
  {
    id: 1, title: "AI & Machine Learning", instructor: "Alex Kumar",
    category: "AI", thumb: "🤖", progress: 62, totalLessons: 96, completedLessons: 60,
    lastWatched: "Module 7 — Neural Networks", nextLesson: "Backpropagation Deep Dive",
    color: "#E1F5EE", status: "in-progress",
  },
  {
    id: 2, title: "Data Science with Python", instructor: "Lisa Wang",
    category: "AI", thumb: "📊", progress: 30, totalLessons: 80, completedLessons: 24,
    lastWatched: "Module 3 — Pandas Basics", nextLesson: "Data Cleaning Techniques",
    color: "#EEEDFE", status: "in-progress",
  },
  {
    id: 3, title: "UI/UX Design Masterclass", instructor: "Rae Johnson",
    category: "Design", thumb: "🎨", progress: 100, totalLessons: 60, completedLessons: 60,
    lastWatched: "Final Project", nextLesson: null,
    color: "#FBEAF0", status: "completed",
  },
]

const statusColors = {
  "in-progress": { bg: "#1c1003", text: "#fbbf24", label: "In Progress" },
  "completed":   { bg: "#052e16", text: "#4ade80", label: "Completed"   },
}

export default function MyCourses() {
  const [activeTab, setActiveTab] = useState("all")

  const filtered = MY_COURSES.filter(c =>
    activeTab === "all" ? true : c.status === activeTab
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>My Courses</h2>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{MY_COURSES.length} courses enrolled</p>
        </div>
        {/* Summary chips */}
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Enrolled",   value: MY_COURSES.length,                               color: "#a78bfa" },
            { label: "Completed",  value: MY_COURSES.filter(c => c.status === "completed").length, color: "#4ade80" },
            { label: "In progress",value: MY_COURSES.filter(c => c.status === "in-progress").length, color: "#fbbf24" },
          ].map(s => (
            <div key={s.label} style={{ background: "#1e293b", borderRadius: 10, padding: "6px 14px", textAlign: "center", border: "1px solid #334155" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#1e293b", padding: 4, borderRadius: 10, marginBottom: 20, width: "fit-content" }}>
        {["all", "in-progress", "completed"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: activeTab === tab ? "#7c3aed" : "transparent", color: activeTab === tab ? "#fff" : "#64748b", transition: "all 0.15s", textTransform: "capitalize" }}>
            {tab === "all" ? "All" : tab === "in-progress" ? "In Progress" : "Completed"}
          </button>
        ))}
      </div>

      {/* Course cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map(course => {
          const st = statusColors[course.status]
          return (
            <div key={course.id} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 18, padding: "20px 22px" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

                {/* Thumb */}
                <div style={{ width: 56, height: 56, borderRadius: 14, background: course.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                  {course.thumb}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{course.title}</h3>
                      <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{course.instructor}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.text }}>
                      {st.label}
                    </span>
                  </div>

                  {/* Progress */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{course.completedLessons}/{course.totalLessons} lessons</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: course.progress === 100 ? "#4ade80" : "#a78bfa" }}>{course.progress}%</span>
                    </div>
                    <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${course.progress}%`, background: course.progress === 100 ? "linear-gradient(90deg,#10b981,#4ade80)" : "linear-gradient(90deg,#7c3aed,#06b6d4)", borderRadius: 3, transition: "width 0.5s" }} />
                    </div>
                  </div>

                  {/* Last watched + actions */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      {course.lastWatched && (
                        <p style={{ fontSize: 11, color: "#64748b" }}>
                          Last: <span style={{ color: "#94a3b8" }}>{course.lastWatched}</span>
                        </p>
                      )}
                      {course.nextLesson && (
                        <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          Next: <span style={{ color: "#a78bfa" }}>{course.nextLesson}</span>
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {course.status !== "completed" && (
                        <button style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          Continue →
                        </button>
                      )}
                      {course.status === "completed" && (
                        <button style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: "#052e16", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          View Certificate 🏅
                        </button>
                      )}
                      <button style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
