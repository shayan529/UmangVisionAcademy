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
import { useTranslation } from 'react-i18next';

// ── Theme tokens ─────────────────────────────────────────────────────────────
const DARK = {
  bg: '#000000',
  bgSidebar: '#0a0a0a',
  bgTopbar: '#000000',
  bgInput: '#1a1a1a',
  bgInputBorder: '#2a2a2a',
  bgCard: '#111111',
  bgCardHover: '#1a1a1a',
  bgActive: '#1e1e1e',
  bgToggle: '#1a1a1a',
  bgUserBubble: '#1e1e1e',
  border: '#1f1f1f',
  borderActive: '#7c3aed',
  text: '#ffffff',
  textMuted: '#888888',
  textSubtle: '#444444',
  textCaption: '#333333',
  sendActive: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
  sendInactive: '#1a1a1a',
  sendInactiveColor: '#333333',
  scrollThumb: '#1f1f1f',
  modeActiveBg: '#7c3aed',
  modeActiveColor: '#fff',
  modeInactiveColor: '#666666',
  historyIcon: '#a78bfa',
  iconDefault: '#555555',
  iconHoverBg: '#1a1a1a',
  errorBg: '#1a0000',
  errorBorder: '#3a0000',
  errorText: '#f87171',
  dotColor: '#333333',
};

const LIGHT = {
  bg: '#ffffff',
  bgSidebar: '#f9f9f9',
  bgTopbar: '#ffffff',
  bgInput: '#f4f4f4',
  bgInputBorder: '#e0e0e0',
  bgCard: '#f4f4f4',
  bgCardHover: '#ebebeb',
  bgActive: '#ebebeb',
  bgToggle: '#efefef',
  bgUserBubble: '#efefef',
  border: '#e8e8e8',
  borderActive: '#7c3aed',
  text: '#111111',
  textMuted: '#555555',
  textSubtle: '#999999',
  textCaption: '#bbbbbb',
  sendActive: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
  sendInactive: '#e8e8e8',
  sendInactiveColor: '#aaaaaa',
  scrollThumb: '#dddddd',
  modeActiveBg: '#7c3aed',
  modeActiveColor: '#fff',
  modeInactiveColor: '#888888',
  historyIcon: '#7c3aed',
  iconDefault: '#999999',
  iconHoverBg: '#efefef',
  errorBg: '#fff0f0',
  errorBorder: '#ffc0c0',
  errorText: '#c0392b',
  dotColor: '#cccccc',
};

// ── Markdown-lite renderer ───────────────────────────────────────────────────
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

// ── Icons ────────────────────────────────────────────────────────────────────
const IconMenu = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconEdit = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconHistory = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
  </svg>
);
const IconTrash = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const IconSun = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const IconMoon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// ── Voice Orb ────────────────────────────────────────────────────────────────
const VoiceOrb = ({ listening, streaming, onClick }) => {
  const state = listening ? 'listening' : streaming ? 'thinking' : 'idle';
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 200,
        height: 200,
      }}
    >
      <style>{`
        @keyframes orbPulse  { 0%,100%{transform:scale(1);opacity:.15} 50%{transform:scale(1.18);opacity:.28} }
        @keyframes orbPulse2 { 0%,100%{transform:scale(1);opacity:.09} 50%{transform:scale(1.32);opacity:.18} }
        @keyframes orbGlow   { 0%,100%{transform:scale(1);opacity:.22} 50%{transform:scale(1.12);opacity:.38} }
        @keyframes thinkSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes orbFloat  { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
        @keyframes ripple    { 0%{transform:scale(.9);opacity:.6} 100%{transform:scale(1.6);opacity:0} }
      `}</style>
      {listening &&
        [0, 0.4, 0.8].map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 160,
              height: 160,
              borderRadius: '50%',
              border: `2px solid ${i === 2 ? '#a78bfa' : '#7c3aed'}`,
              animation: `ripple 1.4s ease-out ${d}s infinite`,
            }}
          />
        ))}
      <div
        style={{
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: '50%',
          background:
            state === 'listening'
              ? 'radial-gradient(circle,rgba(220,38,38,.3) 0%,transparent 70%)'
              : state === 'thinking'
                ? 'radial-gradient(circle,rgba(6,182,212,.3) 0%,transparent 70%)'
                : 'radial-gradient(circle,rgba(124,58,237,.3) 0%,transparent 70%)',
          animation:
            state !== 'idle'
              ? 'orbGlow 1.5s ease-in-out infinite'
              : 'orbPulse 3s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: '50%',
          background:
            state === 'listening'
              ? 'radial-gradient(circle,rgba(220,38,38,.2) 0%,transparent 70%)'
              : state === 'thinking'
                ? 'radial-gradient(circle,rgba(6,182,212,.2) 0%,transparent 70%)'
                : 'radial-gradient(circle,rgba(167,139,250,.2) 0%,transparent 70%)',
          animation:
            state !== 'idle'
              ? 'orbGlow 1.5s ease-in-out .2s infinite'
              : 'orbPulse2 3s ease-in-out .5s infinite',
        }}
      />
      {state === 'thinking' && (
        <div
          style={{
            position: 'absolute',
            width: 124,
            height: 124,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTop: '2px solid #06b6d4',
            borderRight: '2px solid #7c3aed',
            animation: 'thinkSpin 1.2s linear infinite',
          }}
        />
      )}
      <button
        onClick={onClick}
        style={{
          width: 110,
          height: 110,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 2,
          background:
            state === 'listening'
              ? 'radial-gradient(circle at 35% 35%,#ef4444,#dc2626 60%,#991b1b)'
              : state === 'thinking'
                ? 'radial-gradient(circle at 35% 35%,#22d3ee,#0891b2 60%,#0e7490)'
                : 'radial-gradient(circle at 35% 35%,#a78bfa,#7c3aed 60%,#5b21b6)',
          boxShadow:
            state === 'listening'
              ? '0 0 40px rgba(220,38,38,.5),inset 0 2px 4px rgba(255,255,255,.2)'
              : state === 'thinking'
                ? '0 0 40px rgba(6,182,212,.5),inset 0 2px 4px rgba(255,255,255,.2)'
                : '0 0 40px rgba(124,58,237,.4),inset 0 2px 4px rgba(255,255,255,.15)',
          animation:
            state === 'idle' ? 'orbFloat 4s ease-in-out infinite' : 'none',
          transition: 'all .3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
        }}
      >
        {state === 'listening' ? '⏹' : state === 'thinking' ? '🧠' : '🎙️'}
      </button>
    </div>
  );
};

// ── Icon button helper ────────────────────────────────────────────────────────
const IconBtn = ({ onClick, title, children, color, t }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: 'none',
      border: 'none',
      color: color || t.iconDefault,
      cursor: 'pointer',
      padding: 7,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      transition: 'color .15s, background .15s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = t.text;
      e.currentTarget.style.background = t.iconHoverBg;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = color || t.iconDefault;
      e.currentTarget.style.background = 'none';
    }}
  >
    {children}
  </button>
);

// ── Helpers ──────────────────────────────────────────────────────────────────
const dateLabel = (d) => {
  const diff = Math.floor((new Date() - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return 'Previous 7 Days';
  if (diff < 30) return 'Previous 30 Days';
  return 'Older';
};
const timeStr = (d) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let _sid = 1;
const newId = () => `s${_sid++}`;
const GROUP_ORDER = [
  'Today',
  'Yesterday',
  'Previous 7 Days',
  'Previous 30 Days',
  'Older',
];

// ── Main component ────────────────────────────────────────────────────────────
export default function AITutor() {
  const dispatch = useDispatch();
  const { messages, input, streaming, error, mode } = useSelector(
    (s) => s.aiTutor
  );
  const { t: translate } = useTranslation();

  const [dark, setDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const t = dark ? DARK : LIGHT;

  const activeIdRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const recRef = useRef(null);
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, streaming]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!activeIdRef.current || messages.length === 0) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeIdRef.current ? { ...s, messages: [...messages] } : s
      )
    );
  }, [messages]);
  // Auto-start a session on first mount
  useEffect(() => {
    const id = newId();
    const created = new Date();
    setSessions([
      {
        id,
        title: 'New conversation',
        time: timeStr(created),
        dateLabel: dateLabel(created),
        messages: [],
      },
    ]);
    setActiveId(id);
    activeIdRef.current = id;
  }, []); // runs once on mount

  const startNewChat = useCallback(() => {
    if (messages.length > 0 && activeIdRef.current)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeIdRef.current ? { ...s, messages: [...messages] } : s
        )
      );
    const id = newId(),
      created = new Date();
    setSessions((prev) => [
      {
        id,
        title: 'New conversation',
        time: timeStr(created),
        dateLabel: dateLabel(created),
        messages: [],
      },
      ...prev,
    ]);
    setActiveId(id);
    activeIdRef.current = id;
    dispatch({ type: 'aiTutor/clearMessages' });
    dispatch(setError(null));
    dispatch(setInput(''));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [messages, dispatch]);

  const loadSession = useCallback(
    (id) => {
      if (id === activeIdRef.current) return;
      if (messages.length > 0 && activeIdRef.current)
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeIdRef.current ? { ...s, messages: [...messages] } : s
          )
        );
      const session = sessions.find((s) => s.id === id);
      if (!session) return;
      setActiveId(id);
      activeIdRef.current = id;
      dispatch({ type: 'aiTutor/setMessages', payload: session.messages });
      dispatch(setError(null));
    },
    [messages, sessions, dispatch]
  );

  const deleteSession = useCallback(
    (id) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === activeIdRef.current) {
        dispatch({ type: 'aiTutor/clearMessages' });
        setActiveId(null);
        activeIdRef.current = null;
      }
    },
    [dispatch]
  );

  const sendMessage = useCallback(
    async (text) => {
      const msg = (text || input).trim();
      if (!msg || streaming) return;
      if (!activeIdRef.current) {
        const id = newId(),
          created = new Date();
        const title = msg.length > 42 ? msg.slice(0, 42) + '…' : msg;
        setSessions((prev) => [
          {
            id,
            title,
            time: timeStr(created),
            dateLabel: dateLabel(created),
            messages: [],
          },
          ...prev,
        ]);
        setActiveId(id);
        activeIdRef.current = id;
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s.id !== activeIdRef.current
              ? s
              : s.title === 'New conversation'
                ? {
                    ...s,
                    title: msg.length > 42 ? msg.slice(0, 42) + '…' : msg,
                  }
                : s
          )
        );
      }
      dispatch(setInput(''));
      dispatch(setError(null));
      const userMsg = { role: 'user', content: msg };
      dispatch(addUserMessage(userMsg));
      dispatch(addAiPlaceholder());
      dispatch(setStreaming(true));
      const history = [...messages, userMsg];
      try {
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const baseUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${baseUrl}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: ctrl.signal,
          credentials: 'include',
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.message || 'AI service unavailable.');
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const p = line.slice(6).trim();
            if (p === '[DONE]') break;
            try {
              const { text: chunk, error: se } = JSON.parse(p);
              if (se) throw new Error(se);
              if (chunk) dispatch(appendAiText(chunk));
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
    [input, messages, streaming, dispatch]
  );

  const cancelStream = () => {
    abortRef.current?.abort();
    dispatch(setStreaming(false));
  };

  const toggleListen = () => {
    if (
      !('webkitSpeechRecognition' in window) &&
      !('SpeechRecognition' in window)
    ) {
      dispatch(setError('Voice input not supported. Try Chrome.'));
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => {
      setListening(true);
      dispatch(setError(null));
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      setListening(false);
      const map = {
        'not-allowed':
          'Microphone access denied. Allow mic in browser settings.',
        'no-speech': 'No speech detected.',
        network: 'Network error — voice needs internet.',
        'audio-capture': 'No microphone found.',
        aborted: null,
      };
      const m = map[e.error];
      if (m !== null) dispatch(setError(m ?? `Voice error: ${e.error}`));
    };
    rec.onresult = (e) => {
      setListening(false);
      sendMessage(e.results[0][0].transcript);
    };
    rec.start();
  };

  const orbState = streaming ? 'thinking' : listening ? 'listening' : 'idle';

  const grouped = sessions.reduce((acc, s) => {
    if (!acc[s.dateLabel]) acc[s.dateLabel] = [];
    acc[s.dateLabel].push(s);
    return acc;
  }, {});

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 70px)',
        maxHeight: 'calc(100vh - 70px)',
        minHeight: 0,
        overflow: 'hidden',
        background: t.bg,
        transition: 'background .2s, color .2s',
      }}
    >
      <style>{`
        @keyframes pulse  { 0%,80%,100%{opacity:.3} 40%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .ai-msg { animation: fadeUp .18s ease both; }
        .ai-input-el { font-family: inherit; }
        .ai-input-el::placeholder { color: ${dark ? '#444' : '#aaa'}; }
        .grad-border:focus-within { box-shadow: 0 0 0 2px rgba(124,58,237,.35), 0 0 24px rgba(124,58,237,.18) !important; }
        .sess-row:hover { background: ${t.bgCardHover} !important; }
        .sess-row:hover .del-btn { opacity: 1 !important; }
        .prompt-card:hover { border-color: #7c3aed !important; color: ${t.text} !important; background: ${t.bgCardHover} !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 4px; }
      `}</style>

      {/* ── Sidebar ── */}
      <div
        style={{
          width: sidebarOpen ? 260 : 0,
          minWidth: sidebarOpen ? 260 : 0,
          overflow: 'hidden',
          transition: 'width .22s ease, min-width .22s ease',
          background: t.bgSidebar,
          borderRight: sidebarOpen ? `1px solid ${t.border}` : 'none',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <div
          style={{
            width: 260,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            opacity: sidebarOpen ? 1 : 0,
            transition: 'opacity .18s ease',
          }}
        >
          {/* Sidebar top */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '13px 10px 10px',
              flexShrink: 0,
            }}
          >
            <IconBtn
              onClick={() => setSidebarOpen(false)}
              title="Close sidebar"
              t={t}
            >
              <IconMenu />
            </IconBtn>
            <IconBtn onClick={startNewChat} title="New chat" t={t}>
              <IconEdit />
            </IconBtn>
          </div>

          {/* Sessions */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 16px' }}>
            {sessions.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  color: t.textSubtle,
                  fontSize: 12,
                  textAlign: 'center',
                  lineHeight: 1.9,
                }}
              >
                No conversations yet.
                <br />
                Start chatting to see history here.
              </div>
            ) : (
              GROUP_ORDER.filter((g) => grouped[g]).map((group) => (
                <div key={group}>
                  <div
                    style={{
                      padding: '12px 14px 4px',
                      fontSize: 10,
                      fontWeight: 700,
                      color: t.textSubtle,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {group}
                  </div>
                  {grouped[group].map((s) => (
                    <div
                      key={s.id}
                      className="sess-row"
                      onClick={() => loadSession(s.id)}
                      style={{
                        position: 'relative',
                        padding: '9px 14px',
                        margin: '1px 6px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background:
                          activeId === s.id ? t.bgActive : 'transparent',
                        borderLeft: `2px solid ${activeId === s.id ? t.borderActive : 'transparent'}`,
                        transition: 'background .12s',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: activeId === s.id ? t.text : t.textMuted,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          paddingRight: 22,
                          lineHeight: 1.4,
                        }}
                      >
                        {s.title}
                      </div>
                      <button
                        className="del-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(s.id);
                        }}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: t.textSubtle,
                          cursor: 'pointer',
                          padding: 3,
                          borderRadius: 4,
                          opacity: 0,
                          transition: 'opacity .12s, color .12s',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = t.errorText)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = t.textSubtle)
                        }
                      >
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Main panel ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minWidth: 0,
          overflow: 'hidden',
          background: t.bg,
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            borderBottom: `1px solid ${t.border}`,
            flexShrink: 0,
            background: t.bgTopbar,
          }}
        >
          {/* Left: hamburger + pencil (only when sidebar closed) */}
          {!sidebarOpen && (
            <div style={{ display: 'flex', gap: 2, marginRight: 4 }}>
              <IconBtn
                onClick={() => setSidebarOpen(true)}
                title="Open history"
                t={t}
              >
                <IconMenu />
              </IconBtn>
              <IconBtn onClick={startNewChat} title="New chat" t={t}>
                <IconEdit />
              </IconBtn>
            </div>
          )}

          {/* Title */}
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: t.text,
              flex: 1,
              userSelect: 'none',
            }}
          >
            AI Tutor
          </span>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* History toggle */}
            <IconBtn
              onClick={() => setSidebarOpen((v) => !v)}
              title="Toggle history"
              color={sidebarOpen ? t.historyIcon : t.iconDefault}
              t={t}
            >
              <IconHistory />
            </IconBtn>

            {/* Sun / Moon */}
            <IconBtn
              onClick={() => setDark((v) => !v)}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              t={t}
            >
              {dark ? <IconSun /> : <IconMoon />}
            </IconBtn>

            {/* Chat / Voice toggle */}
            <div
              style={{
                display: 'flex',
                gap: 2,
                background: t.bgToggle,
                padding: 3,
                borderRadius: 10,
                marginLeft: 2,
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
                    padding: '5px 16px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: mode === m.key ? t.modeActiveBg : 'transparent',
                    color:
                      mode === m.key ? t.modeActiveColor : t.modeInactiveColor,
                    transition: 'all .15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              background: t.errorBg,
              borderBottom: `1px solid ${t.errorBorder}`,
              padding: '10px 20px',
              color: t.errorText,
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <span>⚠️ {error}</span>
            <button
              onClick={() => dispatch(setError(null))}
              style={{
                background: 'none',
                border: 'none',
                color: t.errorText,
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Chat mode ── */}
        {mode === 'chat' ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 0 8px' }}>
              <div
                style={{
                  maxWidth: 720,
                  margin: '0 auto',
                  padding: '0 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {/* Empty state */}
                {messages.length === 0 && !streaming && (
                  <div style={{ textAlign: 'center', paddingTop: 56 }}>
                    <div style={{ fontSize: 34, marginBottom: 10 }}>🤖</div>
                    <div
                      style={{
                        fontSize: 21,
                        fontWeight: 700,
                        color: t.text,
                        marginBottom: 8,
                      }}
                    >
                      {translate('aiTutor.emptyTitle')}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: t.textMuted,
                        marginBottom: 32,
                      }}
                    >
                      {translate('aiTutor.emptySubtitle')}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                        maxWidth: 520,
                        margin: '0 auto',
                      }}
                    >
                      {translate('aiTutor.quickPrompts', {
                        returnObjects: true,
                      }).map((p) => (
                        <button
                          key={p}
                          className="prompt-card"
                          onClick={() => sendMessage(p)}
                          disabled={streaming}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 12,
                            border: `1px solid ${t.border}`,
                            background: t.bgCard,
                            color: t.textMuted,
                            cursor: 'pointer',
                            fontSize: 12,
                            textAlign: 'left',
                            lineHeight: 1.5,
                            transition: 'all .15s',
                            fontFamily: 'inherit',
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className="ai-msg"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: 10,
                    }}
                  >
                    {m.role === 'ai' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          maxWidth: '88%',
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background:
                              'linear-gradient(135deg,#7c3aed,#06b6d4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          🤖
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: t.text,
                            lineHeight: 1.8,
                            paddingTop: 4,
                          }}
                        >
                          {/* Show dots inside the bubble when streaming and content is empty */}
                          {m.streaming && !m.content ? (
                            <div
                              style={{ display: 'flex', gap: 5, paddingTop: 5 }}
                            >
                              {[0, 0.2, 0.4].map((d, j) => (
                                <div
                                  key={j}
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: t.dotColor,
                                    animation: `pulse 1.2s ${d}s infinite`,
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <>
                              {m.content ? (
                                <RenderText text={m.content} />
                              ) : null}
                              {m.streaming && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: 2,
                                    height: 15,
                                    background: '#a78bfa',
                                    marginLeft: 2,
                                    animation: 'pulse .8s infinite',
                                    verticalAlign: 'middle',
                                  }}
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {m.role === 'user' && (
                      <div
                        style={{
                          maxWidth: '72%',
                          padding: '10px 16px',
                          borderRadius: '18px 18px 4px 18px',
                          background: t.bgUserBubble,
                          color: t.text,
                          fontSize: 14,
                          lineHeight: 1.65,
                          border: `1px solid ${t.border}`,
                        }}
                      >
                        <RenderText text={m.content} />
                      </div>
                    )}
                  </div>
                ))}

                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input bar */}
            <div
              style={{
                padding: '10px 20px 14px',
                background: t.bg,
                flexShrink: 0,
              }}
            >
              <div style={{ maxWidth: 720, margin: '0 auto' }}>
                {/* Gradient border wrapper */}
                <div
                  className="grad-border"
                  style={{
                    position: 'relative',
                    borderRadius: 15,
                    padding: 1.5,
                    background:
                      'linear-gradient(135deg, #7c3aed, #06b6d4, #a78bfa)',
                    boxShadow: dark
                      ? '0 0 18px rgba(124,58,237,.18)'
                      : '0 0 18px rgba(124,58,237,.22)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: 13,
                      background: t.bgInput,
                      overflow: 'hidden',
                    }}
                  >
                    <textarea
                      ref={inputRef}
                      className="ai-input-el"
                      value={input}
                      onChange={(e) => {
                        dispatch(setInput(e.target.value));
                        e.target.style.height = 'auto';
                        e.target.style.height =
                          Math.min(e.target.scrollHeight, 160) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Message AI Tutor…"
                      disabled={streaming}
                      rows={1}
                      style={{
                        width: '100%',
                        padding: '13px 52px 13px 16px',
                        background: 'transparent',
                        border: 'none',
                        color: t.text,
                        fontSize: 14,
                        outline: 'none',
                        resize: 'none',
                        lineHeight: 1.55,
                        transition: 'none',
                        boxSizing: 'border-box',
                        overflowY: 'hidden',
                        display: 'block',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      right: 9,
                      bottom: 9,
                      zIndex: 2,
                    }}
                  >
                    {streaming ? (
                      <button
                        onClick={cancelStream}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: '#7c3aed',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                        }}
                      >
                        ⏹
                      </button>
                    ) : (
                      <button
                        onClick={() => sendMessage()}
                        disabled={!String(input || '').trim()}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: String(input || '').trim()
                            ? t.sendActive
                            : t.sendInactive,
                          border: 'none',
                          color: String(input || '').trim()
                            ? '#fff'
                            : t.sendInactiveColor,
                          cursor: String(input || '').trim()
                            ? 'pointer'
                            : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 17,
                          transition: 'all .15s',
                        }}
                      >
                        ↑
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  color: t.textCaption,
                  marginTop: 7,
                }}
              >
                AI Tutor can make mistakes. Verify important information.
              </div>
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
              gap: 28,
              padding: '0 20px 32px',
              background: t.bg,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color:
                  orbState === 'listening'
                    ? '#f87171'
                    : orbState === 'thinking'
                      ? '#22d3ee'
                      : '#a78bfa',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'color .3s',
                minHeight: 20,
              }}
            >
              {orbState === 'listening'
                ? '● Listening…'
                : orbState === 'thinking'
                  ? '◌ Thinking…'
                  : 'Tap to speak'}
            </div>
            <VoiceOrb
              listening={listening}
              streaming={streaming}
              onClick={streaming ? cancelStream : toggleListen}
            />
            <p
              style={{
                fontSize: 13,
                color: t.textMuted,
                textAlign: 'center',
                maxWidth: 280,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {orbState === 'listening'
                ? 'Speak clearly — tap the orb to cancel'
                : orbState === 'thinking'
                  ? 'Processing your question…'
                  : 'Ask anything out loud. Supports English & Hindi.'}
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div
                style={{
                  fontSize: 11,
                  color: t.textSubtle,
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: `1px solid ${t.border}`,
                  background: t.bgCard,
                }}
              >
                Space
              </div>
              <span style={{ fontSize: 12, color: t.textSubtle }}>
                to start / stop
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
