import React, { useState } from "react"

const CERTIFICATES = [
  {
    id: "CERT-A4F2E1",
    course: "UI/UX Design Masterclass",
    instructor: "Rae Johnson",
    issuedDate: "15 May 2026",
    score: 94,
    category: "Design",
    color: ["#4c1d95", "#7c3aed"],
  },
]

const IN_PROGRESS = [
  { title: "AI & Machine Learning",    progress: 62, needed: 100, thumb: "🤖" },
  { title: "Data Science with Python", progress: 30, needed: 100, thumb: "📊" },
]

export default function Certificates() {
  const [copied, setCopied] = useState("")

  const copyId = (id) => {
    navigator.clipboard.writeText(id).catch(() => {})
    setCopied(id)
    setTimeout(() => setCopied(""), 2000)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>Certificates</h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          {CERTIFICATES.length} certificate earned · {IN_PROGRESS.length} in progress
        </p>
      </div>

      {/* Earned */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>
          🏅 Earned Certificates
        </h3>

        {CERTIFICATES.map(cert => (
          <div key={cert.id} style={{ background: `linear-gradient(135deg, ${cert.color[0]}, ${cert.color[1]})`, borderRadius: 20, padding: "28px 28px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
            {/* decorative circles */}
            <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", right: 40, bottom: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", marginBottom: 6 }}>CERTIFICATE OF COMPLETION</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>LearnSphere · {cert.issuedDate}</div>
                </div>
                <div style={{ fontSize: 36 }}>🏅</div>
              </div>

              {/* Course name */}
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{cert.course}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Instructor: {cert.instructor}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
                Score: <span style={{ color: "#fde68a", fontWeight: 700 }}>{cert.score}%</span>
              </div>

              {/* Credential ID */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "monospace" }}>
                  {cert.id}
                </div>
                <button onClick={() => copyId(cert.id)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "5px 10px", color: "#fff", fontSize: 11, cursor: "pointer" }}>
                  {copied === cert.id ? "Copied ✓" : "Copy ID"}
                </button>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={{ padding: "8px 16px", background: "#fff", color: "#4c1d95", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  ⬇ Download PDF
                </button>
                <button style={{ padding: "8px 16px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  LinkedIn Share
                </button>
                <button style={{ padding: "8px 16px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  🔗 Copy Link
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* In progress */}
      <div>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          ⏳ In Progress — Complete to earn
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {IN_PROGRESS.map(course => (
            <div key={course.title} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28, width: 44, height: 44, background: "#1e293b", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {course.thumb}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>{course.title}</div>
                <div style={{ height: 5, background: "#1e293b", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ height: "100%", width: `${course.progress}%`, background: "linear-gradient(90deg,#7c3aed,#06b6d4)", borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{course.progress}% complete — finish to unlock certificate</div>
              </div>
              <button style={{ padding: "7px 14px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                Continue →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
