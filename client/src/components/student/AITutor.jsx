import React, { useState, useRef, useEffect } from "react";

const QUICK_PROMPTS = [
  "Explain neural networks simply",
  "What is gradient descent?",
  "Help me understand async/await",
  "What are React hooks?",
  "Difference between SQL and NoSQL",
];

const AI_REPLIES = [
  "Great question! Let me break that down for you. This concept is foundational — once you understand it, everything else clicks into place.",
  "Think of it this way: imagine you're teaching a child to recognise cats. You show them thousands of pictures. That's essentially what a neural network does — it learns patterns from examples.",
  "Here's a simple analogy: gradient descent is like being blindfolded on a hilly landscape and trying to find the lowest point by always stepping downhill.",
  "Async/await is JavaScript's way of handling operations that take time (like fetching data) without freezing the entire page. It makes your code read top-to-bottom, like a story.",
  "SQL databases store data in structured tables (like Excel). NoSQL databases are more flexible — they can store documents, key-value pairs, or graphs depending on your use case.",
];

export default function AITutor() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi! I'm your AI Tutor. Ask me anything about your courses, concepts you're stuck on, or topics you want to explore. I'm here to help 🎓",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [mode, setMode] = useState("chat"); // "chat" | "voice"
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);

  // Auto scroll to latest message
  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  // }, [messages, typing])

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setTyping(true);
    // Simulate AI reply after delay
    setTimeout(() => {
      setTyping(false);
      const reply = AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)];
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    }, 1400);
  };

  const toggleListen = () => {
    setListening((l) => !l);
    if (!listening) {
      // Simulate voice input after 2 seconds
      setTimeout(() => {
        setListening(false);
        sendMessage("Explain gradient descent with an example");
      }, 2000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>
            AI Tutor
          </h2>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            Powered by AI · Always available
          </p>
        </div>
        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "#1e293b",
            padding: 4,
            borderRadius: 10,
          }}
        >
          {["chat", "voice"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: mode === m ? "#7c3aed" : "transparent",
                color: mode === m ? "#fff" : "#64748b",
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {m === "chat" ? "💬 Chat" : "🎙️ Voice"}
            </button>
          ))}
        </div>
      </div>

      {mode === "chat" ? (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Quick prompts */}
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                style={{
                  fontSize: 11,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "1px solid #334155",
                  background: "#1e293b",
                  color: "#94a3b8",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#7c3aed";
                  e.currentTarget.style.color = "#a78bfa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#334155";
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat window */}
          <div
            style={{
              flex: 1,
              minHeight: 320,
              maxHeight: 420,
              overflowY: "auto",
              background: "#0f172a",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {m.role === "ai" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      marginRight: 8,
                      flexShrink: 0,
                      alignSelf: "flex-end",
                    }}
                  >
                    🤖
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius:
                      m.role === "user"
                        ? "14px 14px 2px 14px"
                        : "14px 14px 14px 2px",
                    background:
                      m.role === "user"
                        ? "linear-gradient(135deg,#7c3aed,#db2777)"
                        : "#1e293b",
                    color: "#f1f5f9",
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                  }}
                >
                  🤖
                </div>
                <div
                  style={{
                    background: "#1e293b",
                    borderRadius: "14px 14px 14px 2px",
                    padding: "10px 16px",
                    display: "flex",
                    gap: 4,
                    alignItems: "center",
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
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything about your courses..."
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 12,
                color: "#f1f5f9",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={() => sendMessage()}
              style={{
                padding: "12px 20px",
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        /* Voice mode */
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
              {listening
                ? "Listening... speak your question"
                : "Press the button and ask your question out loud"}
            </p>
          </div>

          {/* Pulse ring */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {listening && (
              <>
                <div
                  style={{
                    position: "absolute",
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    border: "2px solid #7c3aed",
                    opacity: 0.4,
                    animation: "ping 1s infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    border: "2px solid #7c3aed",
                    opacity: 0.6,
                    animation: "ping 1s 0.2s infinite",
                  }}
                />
              </>
            )}
            <button
              onClick={toggleListen}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: "none",
                background: listening
                  ? "linear-gradient(135deg,#dc2626,#f97316)"
                  : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                color: "#fff",
                fontSize: 30,
                cursor: "pointer",
                boxShadow: "0 8px 32px rgba(124,58,237,0.5)",
                transition: "all 0.2s",
                position: "relative",
                zIndex: 1,
              }}
            >
              {listening ? "⏹" : "🎙️"}
            </button>
          </div>

          <p
            style={{
              fontSize: 13,
              color: listening ? "#a78bfa" : "#64748b",
              fontWeight: listening ? 600 : 400,
            }}
          >
            {listening ? "AI is listening..." : "Tap to start speaking"}
          </p>

          {/* Previous voice messages */}
          {messages.length > 1 && (
            <div
              style={{
                width: "100%",
                maxWidth: 500,
                background: "#0f172a",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <p style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
                LAST EXCHANGE
              </p>
              {messages.slice(-2).map((m, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    color: m.role === "ai" ? "#94a3b8" : "#f1f5f9",
                    padding: "6px 0",
                    borderBottom: i === 0 ? "1px solid #1e293b" : "none",
                  }}
                >
                  <span
                    style={{
                      color: m.role === "ai" ? "#a78bfa" : "#22d3ee",
                      fontWeight: 600,
                      marginRight: 6,
                    }}
                  >
                    {m.role === "ai" ? "AI:" : "You:"}
                  </span>
                  {m.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes pulse{0%,80%,100%{opacity:.3}40%{opacity:1}} @keyframes ping{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.5);opacity:0}}`}</style>
    </div>
  );
}
