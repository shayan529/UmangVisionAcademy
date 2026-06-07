import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
} from '../../redux/slices/aiTutorSlice.js';

const QUICK_PROMPTS = [
  "Explain Newton's laws simply",
  'Help me with quadratic equations',
  'What is photosynthesis?',
  'Explain the water cycle',
  'What are the types of triangles?',
  'How does the human digestive system work?',
];

// ── Markdown-lite renderer (bold + line breaks only) ─────────────────────────
const RenderText = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part.split('\n').map((line, j, arr) => (
            <React.Fragment key={`${i}-${j}`}>
              {line}
              {j < arr.length - 1 && <br />}
            </React.Fragment>
          ))
        )
      )}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function AITutor() {
  const dispatch = useDispatch();
  const { messages, input, streaming, error, mode } = useSelector(
    (state) => state.aiTutor
  );
  const [listening, setListening] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null); // AbortController for cancelling stream
  const didMountRef = useRef(false);

  // Auto-scroll on new message after initial mount
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [messages, streaming]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      const msg = (text || input).trim();
      if (!msg || streaming) return;

      dispatch(setInput(''));
      dispatch(setError(null));

      const userMsg = { role: 'user', content: msg };
      dispatch(addUserMessage(userMsg));
      dispatch(addAiPlaceholder());
      dispatch(setStreaming(true));

      // Build history for context (exclude the empty AI placeholder we just added)
      const history = [...messages, userMsg];

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const baseUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

        const response = await fetch(`${baseUrl}/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
          credentials: 'include',
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'AI service unavailable.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // keep incomplete line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') break;

            try {
              const { text, error: streamErr } = JSON.parse(payload);
              if (streamErr) throw new Error(streamErr);
              if (text) {
                dispatch(appendAiText(text));
              }
            } catch (e) {
              if (e.name !== 'SyntaxError') throw e;
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        dispatch(
          setError('AI is currently not available. Please try again later.')
        );
        dispatch(removeStreamingPlaceholders());
      } finally {
        dispatch(markStreamingDone());
        dispatch(setStreaming(false));
        abortRef.current = null;
        inputRef.current?.focus();
      }
    },
    [input, messages, streaming]
  );

  const cancelStream = () => {
    abortRef.current?.abort();
    dispatch(setStreaming(false));
  };

  // ── Voice input ───────────────────────────────────────────────────────────
  const toggleListen = () => {
    if (
      !('webkitSpeechRecognition' in window) &&
      !('SpeechRecognition' in window)
    ) {
      dispatch(
        setError('Voice input is not supported in your browser. Try Chrome.')
      );
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-IN'; // supports Hindi too
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      dispatch(setError('Voice input failed. Please try again.'));
    };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      sendMessage(transcript);
    };

    if (listening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 500,
      }}
    >
      <style>{`
        @keyframes pulse  { 0%,80%,100%{opacity:.3} 40%{opacity:1} }
        @keyframes ping   { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.5);opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .ai-msg   { animation: fadeUp 0.25s ease both; }
        .ai-input:focus { border-color:#7c3aed !important; }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>
            AI Tutor
          </h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 3 }}>
            Powered by GPT · Always available
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: '#1e293b',
            padding: 4,
            borderRadius: 10,
          }}
        >
          {[
            { key: 'chat', label: '💬 Chat' },
            { key: 'voice', label: '🎙️ Voice' },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => dispatch(setMode(m.key))}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: mode === m.key ? '#7c3aed' : 'transparent',
                color: mode === m.key ? '#fff' : '#64748b',
                transition: 'all 0.15s',
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
            background: '#2d0a0a',
            border: '1px solid #7f1d1d',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#f87171',
            fontSize: 13,
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={() => dispatch(setError(null))}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {mode === 'chat' ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Quick prompts */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
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
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#94a3b8',
                  cursor: streaming ? 'not-allowed' : 'pointer',
                  opacity: streaming ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!streaming) {
                    e.currentTarget.style.borderColor = '#7c3aed';
                    e.currentTarget.style.color = '#a78bfa';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.color = '#94a3b8';
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
              overflowY: 'auto',
              background: '#0f172a',
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className="ai-msg"
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 8,
                }}
              >
                {m.role === 'ai' && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    🤖
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius:
                      m.role === 'user'
                        ? '14px 14px 2px 14px'
                        : '14px 14px 14px 2px',
                    background:
                      m.role === 'user'
                        ? 'linear-gradient(135deg,#7c3aed,#db2777)'
                        : '#1e293b',
                    color: '#f1f5f9',
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  {m.content ? <RenderText text={m.content} /> : null}
                  {/* Cursor while streaming */}
                  {m.streaming && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 2,
                        height: 14,
                        background: '#a78bfa',
                        marginLeft: 2,
                        animation: 'pulse 0.8s infinite',
                        verticalAlign: 'middle',
                      }}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator — only before first token arrives */}
            {streaming && messages[messages.length - 1]?.content === '' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                  }}
                >
                  🤖
                </div>
                <div
                  style={{
                    background: '#1e293b',
                    borderRadius: '14px 14px 14px 2px',
                    padding: '10px 16px',
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                  }}
                >
                  {[0, 0.2, 0.4].map((d, j) => (
                    <div
                      key={j}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#64748b',
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={inputRef}
              className="ai-input"
              value={input}
              onChange={(e) => dispatch(setInput(e.target.value))}
              onKeyDown={(e) =>
                e.key === 'Enter' && !e.shiftKey && sendMessage()
              }
              placeholder="Ask anything about your courses… (English or Hindi)"
              disabled={streaming}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 12,
                color: '#f1f5f9',
                fontSize: 13,
                outline: 'none',
                transition: 'border-color 0.15s',
                opacity: streaming ? 0.8 : 1,
              }}
            />
            {/* Voice button */}
            <button
              onClick={toggleListen}
              disabled={streaming}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: '1px solid #334155',
                background: listening
                  ? 'linear-gradient(135deg,#dc2626,#f97316)'
                  : '#1e293b',
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              🎙️
            </button>
            {/* Send / Stop */}
            {streaming ? (
              <button
                onClick={cancelStream}
                style={{
                  padding: '12px 18px',
                  background: '#1e293b',
                  border: '1px solid #7c3aed',
                  borderRadius: 12,
                  color: '#a78bfa',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
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
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !input.trim() ? 'not-allowed' : 'pointer',
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          <p style={{ fontSize: 14, color: '#64748b' }}>
            {listening
              ? 'Listening… speak your question'
              : 'Press the button and ask your question out loud'}
          </p>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {listening && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    border: '2px solid #7c3aed',
                    opacity: 0.4,
                    animation: 'ping 1s infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    border: '2px solid #7c3aed',
                    opacity: 0.6,
                    animation: 'ping 1s 0.2s infinite',
                  }}
                />
              </>
            )}
            <button
              onClick={toggleListen}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: 'none',
                background: listening
                  ? 'linear-gradient(135deg,#dc2626,#f97316)'
                  : 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                color: '#fff',
                fontSize: 30,
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(124,58,237,0.5)',
                transition: 'all 0.2s',
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {listening ? '⏹' : '🎙️'}
            </button>
          </div>

          <p
            style={{
              fontSize: 13,
              color: listening ? '#a78bfa' : '#64748b',
              fontWeight: listening ? 600 : 400,
            }}
          >
            {listening ? 'AI is listening…' : 'Tap to start speaking'}
          </p>

          {/* Last exchange */}
          {messages.length > 1 && (
            <div
              style={{
                width: '100%',
                maxWidth: 500,
                background: '#0f172a',
                borderRadius: 14,
                padding: 14,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  marginBottom: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                }}
              >
                LAST EXCHANGE
              </p>
              {messages.slice(-2).map((m, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    color: m.role === 'ai' ? '#94a3b8' : '#f1f5f9',
                    padding: '6px 0',
                    borderBottom: i === 0 ? '1px solid #1e293b' : 'none',
                  }}
                >
                  <span
                    style={{
                      color: m.role === 'ai' ? '#a78bfa' : '#22d3ee',
                      fontWeight: 600,
                      marginRight: 6,
                    }}
                  >
                    {m.role === 'ai' ? 'AI:' : 'You:'}
                  </span>
                  {m.content}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
