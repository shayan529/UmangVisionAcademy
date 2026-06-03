import React, { useState } from "react"
import { Card, SectionHeader, Btn } from "./InstructorUi"
import { aiReplies } from "./InstructorData"

const insightItems = [
  {
    icon: "⚠️",
    title: "Drop-off risk detected",
    desc: '23 students in "AI & ML" haven\'t logged in for 7+ days.',
    action: "Send nudge email",
    toastMsg: "Re-engagement email sent to 23 students",
  },
  {
    icon: "📉",
    title: "High struggle point",
    desc: 'Module 6 "Async/Await" has a 44% replay rate. Consider an extra explainer video.',
    action: "Flag for review",
    toastMsg: "Flagged for content review",
  },
  {
    icon: "🔍",
    title: "Top search query",
    desc: 'Students search "TypeScript + React" most — you don\'t have this course yet.',
    action: "Save course idea",
    toastMsg: "Course idea saved to drafts",
  },
]

const TABS = [
  { id: "chat",     label: "Chat"             },
  { id: "quiz",     label: "Quiz Generator"   },
  { id: "insights", label: "Student Insights" },
]

const InstructorAI = ({ showToast }) => {
  const [activeTab, setActiveTab]   = useState("chat")
  const [chatLog, setChatLog]       = useState([{ role: "ai", text: "Hi! I'm your teaching assistant. Ask me to generate quizzes, analyse student engagement, suggest lesson improvements, or brainstorm course ideas." }])
  const [chatInput, setChatInput]   = useState("")
  const [typing, setTyping]         = useState(false)
  const [quizForm, setQuizForm]     = useState({ topic: "", difficulty: "Intermediate" })
  const [quiz, setQuiz]             = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)

  // ── Chat ──────────────────────────────────────────────────────────────────
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

  // ── Quiz generator ────────────────────────────────────────────────────────
  const generateQuiz = () => {
    if (!quizForm.topic.trim()) { showToast("Enter a topic"); return }
    setQuizLoading(true)
    setQuiz(null)
    setTimeout(() => {
      setQuizLoading(false)
      setQuiz([
        { q: `What is the primary use case of ${quizForm.topic}?`,         opts: ["Styling web pages", "Adding dynamic behavior", "Structuring HTML", "Server configuration"], ans: 1 },
        { q: `Which concept is fundamental to ${quizForm.topic}?`,         opts: ["Inheritance", "Closures", "Flexbox", "SQL joins"],                                           ans: 1 },
        { q: `How do you handle async operations in ${quizForm.topic}?`,   opts: ["CSS transitions", "Promises / async-await", "HTML attributes", "SQL transactions"],         ans: 1 },
      ])
    }, 1200)
  }

  return (
    <Card>
      <SectionHeader
        title="AI Teaching Assistant"
        action={<span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#2e1065", color: "#a78bfa" }}>✨ AI Powered</span>}
      />

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, background: "#1e293b", padding: 4, borderRadius: 12, marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, padding: "7px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: activeTab === t.id ? "#0f172a" : "transparent", color: activeTab === t.id ? "#a78bfa" : "#64748b", transition: "all 0.15s" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Chat tab ─────────────────────────────────────────────────────── */}
      {activeTab === "chat" && (
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
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="e.g. What topics are students struggling with?"
              style={{ flex: 1, padding: "10px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 13, outline: "none" }}
            />
            <Btn variant="primary" onClick={() => sendChat()}>Send</Btn>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Improve my lowest-rated course", "What are students struggling with?", "Generate a quiz on React hooks"].map((q) => (
              <button key={q} onClick={() => sendChat(q)} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", cursor: "pointer" }}>
                {q}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Quiz generator tab ────────────────────────────────────────────── */}
      {activeTab === "quiz" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>Topic</div>
              <input
                type="text"
                placeholder="e.g. JavaScript closures"
                value={quizForm.topic}
                onChange={(e) => setQuizForm({ ...quizForm, topic: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 13, outline: "none" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>Difficulty</div>
              <select
                value={quizForm.difficulty}
                onChange={(e) => setQuizForm({ ...quizForm, difficulty: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 13, outline: "none" }}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
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

      {/* ── Insights tab ──────────────────────────────────────────────────── */}
      {activeTab === "insights" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {insightItems.map((item) => (
            <div key={item.title} style={{ background: "#1e293b", borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>{item.icon} {item.title}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>{item.desc}</div>
              <Btn variant="primary" style={{ fontSize: 12 }} onClick={() => showToast(item.toastMsg)}>{item.action}</Btn>
            </div>
          ))}
        </div>
      )}

      {/* Typing dots keyframe */}
      <style>{`@keyframes pulse{0%,80%,100%{opacity:.3}40%{opacity:1}}`}</style>
    </Card>
  )
}

export default InstructorAI