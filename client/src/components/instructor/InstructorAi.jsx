import React, { useState } from "react";
import { Card, SectionHeader, Btn } from "./InstructorUi";
import { aiReplies } from "./InstructorData";

const InstructorAI = ({ showToast }) => {
  const [chatLog, setChatLog] = useState([
    {
      role: "ai",
      text: "Hi! I'm your teaching assistant. Ask me to generate quizzes, analyse student engagement, suggest lesson improvements, or brainstorm course ideas.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [typing, setTyping] = useState(false);

  // ── Chat ──────────────────────────────────────────────────────────────────
  const sendChat = (msg) => {
    const text = msg || chatInput.trim();
    if (!text) return;
    setChatLog((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setChatLog((prev) => [
        ...prev,
        {
          role: "ai",
          text: aiReplies[Math.floor(Math.random() * aiReplies.length)],
        },
      ]);
    }, 1200);
  };

  return (
    <Card>
      <SectionHeader
        title="AI Teaching Assistant"
        action={
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 20,
              background: "#2e1065",
              color: "#a78bfa",
            }}
          >
            ✨ AI Powered
          </span>
        }
      />

      <div
        style={{
          minHeight: 140,
          maxHeight: 200,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {chatLog.map((m, i) => (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              fontSize: 13,
              lineHeight: 1.5,
              maxWidth: "80%",
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background:
                m.role === "user"
                  ? "linear-gradient(135deg,#7c3aed,#db2777)"
                  : "#1e293b",
              color: "#f1f5f9",
            }}
          >
            {m.text}
          </div>
        ))}
        {typing && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#1e293b",
              display: "flex",
              gap: 4,
              alignItems: "center",
              width: 60,
            }}
          >
            {[0, 0.2, 0.4].map((d, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#64748b",
                  animation: `pulse 1.2s ${d}s infinite`,
                }}
              />
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
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 10,
            color: "#f1f5f9",
            fontSize: 13,
            outline: "none",
          }}
        />
        <Btn variant="primary" onClick={() => sendChat()}>
          Send
        </Btn>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          "Improve my lowest-rated course",
          "What are students struggling with?",
          "Generate a quiz on React hooks",
        ].map((q) => (
          <button
            key={q}
            onClick={() => sendChat(q)}
            style={{
              fontSize: 11,
              padding: "5px 10px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Typing dots keyframe */}
      <style>{`@keyframes pulse{0%,80%,100%{opacity:.3}40%{opacity:1}}`}</style>
    </Card>
  );
};

export default InstructorAI;
