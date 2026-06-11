import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addUserMessage,
  addAiPlaceholder,
  appendAiText,
  removeStreamingPlaceholders,
  markStreamingDone,
  setInput,
  setStreaming,
  setError,
  setMode,
} from "../../redux/slices/aiTutorSlice.js";

const QUICK_PROMPTS = [
  "Explain Newton's laws simply",
  "Help me with quadratic equations",
  "What is photosynthesis?",
  "Explain the water cycle",
  "What are the types of triangles?",
  "How does the human digestive system work?",
];

// ── Markdown-lite renderer ───────────────────────────────────────────────────
const RenderText = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part.split("\n").map((line, j, arr) => (
            <React.Fragment key={`${i}-${j}`}>
              {line}
              {j < arr.length - 1 && <br />}
            </React.Fragment>
          ))
        ),
      )}
    </span>
  );
};

// ── Orb component ────────────────────────────────────────────────────────────
const VoiceOrb = ({ listening, streaming, onClick }) => {
  const state = listening ? "listening" : streaming ? "thinking" : "idle";

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 200,
        height: 200,
      }}
    >
      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.18); opacity: 0.28; }
        }
        @keyframes orbPulse2 {
          0%, 100% { transform: scale(1); opacity: 0.09; }
          50% { transform: scale(1.32); opacity: 0.18; }
        }
        @keyframes orbPulse3 {
          0%, 100% { transform: scale(1); opacity: 0.05; }
          50% { transform: scale(1.48); opacity: 0.10; }
        }
        @keyframes orbGlow {
          0%, 100% { transform: scale(1); opacity: 0.22; }
          50% { transform: scale(1.12); opacity: 0.38; }
        }
        @keyframes thinkSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes ripple {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      {/* Ripple rings when listening */}
      {listening && (
        <>
          <div
            style={{
              position: "absolute",
              width: 160,
              height: 160,
              borderRadius: "50%",
              border: "2px solid #7c3aed",
              animation: "ripple 1.4s ease-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 160,
              height: 160,
              borderRadius: "50%",
              border: "2px solid #7c3aed",
              animation: "ripple 1.4s ease-out 0.4s infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 160,
              height: 160,
              borderRadius: "50%",
              border: "2px solid #a78bfa",
              animation: "ripple 1.4s ease-out 0.8s infinite",
            }}
          />
        </>
      )}

      {/* Outer glow layers */}
      <div
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: "50%",
          background:
            state === "listening"
              ? "radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)"
              : state === "thinking"
                ? "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
          animation:
            state !== "idle"
              ? "orbGlow 1.5s ease-in-out infinite"
              : "orbPulse 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 140,
          height: 140,
          borderRadius: "50%",
          background:
            state === "listening"
              ? "radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 70%)"
              : state === "thinking"
                ? "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)",
          animation:
            state !== "idle"
              ? "orbGlow 1.5s ease-in-out 0.2s infinite"
              : "orbPulse2 3s ease-in-out 0.5s infinite",
        }}
      />

      {/* Thinking spinner ring */}
      {state === "thinking" && (
        <div
          style={{
            position: "absolute",
            width: 124,
            height: 124,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTop: "2px solid #06b6d4",
            borderRight: "2px solid #7c3aed",
            animation: "thinkSpin 1.2s linear infinite",
          }}
        />
      )}

      {/* Main orb button */}
      <button
        onClick={onClick}
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          position: "relative",
          zIndex: 2,
          background:
            state === "listening"
              ? "radial-gradient(circle at 35% 35%, #ef4444, #dc2626 60%, #991b1b)"
              : state === "thinking"
                ? "radial-gradient(circle at 35% 35%, #22d3ee, #0891b2 60%, #0e7490)"
                : "radial-gradient(circle at 35% 35%, #a78bfa, #7c3aed 60%, #5b21b6)",
          boxShadow:
            state === "listening"
              ? "0 0 40px rgba(220,38,38,0.6), 0 0 80px rgba(220,38,38,0.3), inset 0 2px 4px rgba(255,255,255,0.2)"
              : state === "thinking"
                ? "0 0 40px rgba(6,182,212,0.6), 0 0 80px rgba(6,182,212,0.3), inset 0 2px 4px rgba(255,255,255,0.2)"
                : "0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.25), inset 0 2px 4px rgba(255,255,255,0.15)",
          animation:
            state === "idle" ? "orbFloat 4s ease-in-out infinite" : "none",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
        }}
      >
        {state === "listening" ? "⏹" : state === "thinking" ? "🧠" : "🎙️"}
      </button>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function AITutor() {
  const dispatch = useDispatch();
  const { messages, input, streaming, error, mode } = useSelector(
    (state) => state.aiTutor,
  );
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle"); // idle | listening | thinking | done

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const didMountRef = useRef(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [messages, streaming]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      const msg = (text || input).trim();
      if (!msg || streaming) return;

      dispatch(setInput(""));
      dispatch(setError(null));

      const userMsg = { role: "user", content: msg };
      dispatch(addUserMessage(userMsg));
      dispatch(addAiPlaceholder());
      dispatch(setStreaming(true));
      if (voiceStatus === "listening") setVoiceStatus("thinking");

      const history = [...messages, userMsg];

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const baseUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";

        const response = await fetch(`${baseUrl}/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
          credentials: "include",
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || "AI service unavailable.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;

            try {
              const { text: chunk, error: streamErr } = JSON.parse(payload);
              if (streamErr) throw new Error(streamErr);
              if (chunk) dispatch(appendAiText(chunk));
            } catch (e) {
              if (e.name !== "SyntaxError") throw e;
            }
          }
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        dispatch(
          setError("AI is currently not available. Please try again later."),
        );
        dispatch(removeStreamingPlaceholders());
      } finally {
        dispatch(markStreamingDone());
        dispatch(setStreaming(false));
        setVoiceStatus("idle");
        abortRef.current = null;
        inputRef.current?.focus();
      }
    },
    [input, messages, streaming, voiceStatus],
  );

  const cancelStream = () => {
    abortRef.current?.abort();
    dispatch(setStreaming(false));
    setVoiceStatus("idle");
  };

  // ── Voice input ───────────────────────────────────────────────────────────
  const toggleListen = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      dispatch(
        setError("Voice input is not supported in your browser. Try Chrome."),
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setVoiceStatus("idle");
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setVoiceStatus("listening");
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.onerror = () => {
      setListening(false);
      setVoiceStatus("idle");
      dispatch(setError("Voice input failed. Please try again."));
    };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setListening(false);
      setVoiceStatus("thinking");
      sendMessage(transcript);
    };

    recognition.start();
  };

  const orbState = streaming ? "thinking" : listening ? "listening" : "idle";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 500,
      }}
    >
      <style>{`
        @keyframes pulse  { 0%,80%,100%{opacity:.3} 40%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .ai-msg   { animation: fadeUp 0.25s ease both; }
        .ai-input:focus { border-color:#7c3aed !important; }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9" }}>
            AI Tutor
          </h2>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 3 }}>
            Powered by GPT · Always available
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "#1e293b",
            padding: 4,
            borderRadius: 10,
          }}
        >
          {[
            { key: "chat", label: "💬 Chat" },
            { key: "voice", label: "🎙️ Voice" },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => dispatch(setMode(m.key))}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: mode === m.key ? "#7c3aed" : "transparent",
                color: mode === m.key ? "#fff" : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            background: "#2d0a0a",
            border: "1px solid #7f1d1d",
            borderRadius: 10,
            padding: "10px 14px",
            color: "#f87171",
            fontSize: 13,
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={() => dispatch(setError(null))}
            style={{
              background: "none",
              border: "none",
              color: "#f87171",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {mode === "chat" ? (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Quick prompts */}
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={streaming}
                style={{
                  fontSize: 11,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "1px solid #334155",
                  background: "#1e293b",
                  color: "#94a3b8",
                  cursor: streaming ? "not-allowed" : "pointer",
                  opacity: streaming ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!streaming) {
                    e.currentTarget.style.borderColor = "#7c3aed";
                    e.currentTarget.style.color = "#a78bfa";
                  }
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
              minHeight: 300,
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
                className="ai-msg"
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                  gap: 8,
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
                      flexShrink: 0,
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
                    lineHeight: 1.7,
                  }}
                >
                  {m.content ? <RenderText text={m.content} /> : null}
                  {m.streaming && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 14,
                        background: "#a78bfa",
                        marginLeft: 2,
                        animation: "pulse 0.8s infinite",
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                </div>
              </div>
            ))}

            {streaming && messages[messages.length - 1]?.content === "" && (
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
                  {[0, 0.2, 0.4].map((d, j) => (
                    <div
                      key={j}
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

          {/* Input row */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              ref={inputRef}
              className="ai-input"
              value={input}
              onChange={(e) => dispatch(setInput(e.target.value))}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
              placeholder="Ask anything about your courses… (English or Hindi)"
              disabled={streaming}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 12,
                color: "#f1f5f9",
                fontSize: 13,
                outline: "none",
                transition: "border-color 0.15s",
                opacity: streaming ? 0.8 : 1,
              }}
            />
            <button
              onClick={toggleListen}
              disabled={streaming}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: "1px solid #334155",
                background: listening
                  ? "linear-gradient(135deg,#dc2626,#f97316)"
                  : "#1e293b",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🎙️
            </button>
            {streaming ? (
              <button
                onClick={cancelStream}
                style={{
                  padding: "12px 18px",
                  background: "#1e293b",
                  border: "1px solid #7c3aed",
                  borderRadius: 12,
                  color: "#a78bfa",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ⏹ Stop
              </button>
            ) : (
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                style={{
                  padding: "12px 20px",
                  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !input.trim() ? "not-allowed" : "pointer",
                  opacity: !input.trim() ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                Send
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── Voice mode ── */
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            paddingBottom: 32,
          }}
        >
          {/* Status label */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color:
                orbState === "listening"
                  ? "#f87171"
                  : orbState === "thinking"
                    ? "#22d3ee"
                    : "#a78bfa",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              transition: "color 0.3s",
              minHeight: 20,
            }}
          >
            {orbState === "listening"
              ? "● Listening…"
              : orbState === "thinking"
                ? "◌ Thinking…"
                : "Tap to speak"}
          </div>

          {/* Orb */}
          <VoiceOrb
            listening={listening}
            streaming={streaming}
            onClick={streaming ? cancelStream : toggleListen}
          />

          {/* Hint */}
          <p
            style={{
              fontSize: 13,
              color: "#475569",
              textAlign: "center",
              maxWidth: 280,
              lineHeight: 1.6,
            }}
          >
            {orbState === "listening"
              ? "Speak clearly — tap the orb to cancel"
              : orbState === "thinking"
                ? "Processing your question…"
                : "Ask anything out loud. Supports English & Hindi."}
          </p>

          {/* Keyboard shortcut hint */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                fontSize: 11,
                color: "#334155",
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid #1e293b",
                background: "#0f172a",
              }}
            >
              Space
            </div>
            <span style={{ fontSize: 12, color: "#475569" }}>
              to start / stop
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
