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
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../config/api.js";
import { getAiLanguageName, getTtsLanguageCode } from "../../utils/aiLanguage.js";
import MobileChat from "../mobile/MobileChat";

// ── Theme tokens ─────────────────────────────────────────────────────────────
const DARK = {
  bg: "#000000",
  bgSidebar: "#0a0a0a",
  bgTopbar: "#000000",
  bgInput: "#1a1a1a",
  bgInputBorder: "#2a2a2a",
  bgCard: "#111111",
  bgCardHover: "#1a1a1a",
  bgActive: "#1e1e1e",
  bgToggle: "#1a1a1a",
  bgUserBubble: "#1e1e1e",
  border: "#1f1f1f",
  borderActive: "#7c3aed",
  text: "#ffffff",
  textMuted: "#888888",
  textSubtle: "#444444",
  textCaption: "#333333",
  sendActive: "linear-gradient(135deg,#7c3aed,#06b6d4)",
  sendInactive: "#1a1a1a",
  sendInactiveColor: "#333333",
  scrollThumb: "#1f1f1f",
  modeActiveBg: "#7c3aed",
  modeActiveColor: "#fff",
  modeInactiveColor: "#666666",
  historyIcon: "#a78bfa",
  iconDefault: "#555555",
  iconHoverBg: "#1a1a1a",
  errorBg: "#1a0000",
  errorBorder: "#3a0000",
  errorText: "#f87171",
  dotColor: "#333333",
};

const LIGHT = {
  bg: "#ffffff",
  bgSidebar: "#f9f9f9",
  bgTopbar: "#ffffff",
  bgInput: "#f4f4f4",
  bgInputBorder: "#e0e0e0",
  bgCard: "#f4f4f4",
  bgCardHover: "#ebebeb",
  bgActive: "#ebebeb",
  bgToggle: "#efefef",
  bgUserBubble: "#efefef",
  border: "#e8e8e8",
  borderActive: "#7c3aed",
  text: "#111111",
  textMuted: "#555555",
  textSubtle: "#999999",
  textCaption: "#bbbbbb",
  sendActive: "linear-gradient(135deg,#7c3aed,#06b6d4)",
  sendInactive: "#e8e8e8",
  sendInactiveColor: "#aaaaaa",
  scrollThumb: "#dddddd",
  modeActiveBg: "#7c3aed",
  modeActiveColor: "#fff",
  modeInactiveColor: "#888888",
  historyIcon: "#7c3aed",
  iconDefault: "#999999",
  iconHoverBg: "#efefef",
  errorBg: "#fff0f0",
  errorBorder: "#ffc0c0",
  errorText: "#c0392b",
  dotColor: "#cccccc",
};

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
const IconX = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Voice Orb ────────────────────────────────────────────────────────────────
const VoiceOrb = ({ state, onClick }) => (
  <div
    style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 180,
      height: 180,
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
    {state === "listening" &&
      [0, 0.4, 0.8].map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: `2px solid ${i === 2 ? "#a78bfa" : "#7c3aed"}`,
            animation: `ripple 1.4s ease-out ${d}s infinite`,
          }}
        />
      ))}
    <div
      style={{
        position: "absolute",
        width: 140,
        height: 140,
        borderRadius: "50%",
        background:
          state === "listening"
            ? "radial-gradient(circle,rgba(220,38,38,.3) 0%,transparent 70%)"
            : state === "thinking"
              ? "radial-gradient(circle,rgba(6,182,212,.3) 0%,transparent 70%)"
              : state === "speaking"
                ? "radial-gradient(circle,rgba(34,197,94,.3) 0%,transparent 70%)"
                : "radial-gradient(circle,rgba(124,58,237,.3) 0%,transparent 70%)",
        animation:
          state !== "idle"
            ? "orbGlow 1.5s ease-in-out infinite"
            : "orbPulse 3s ease-in-out infinite",
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: "50%",
        background:
          state === "listening"
            ? "radial-gradient(circle,rgba(220,38,38,.2) 0%,transparent 70%)"
            : state === "thinking"
              ? "radial-gradient(circle,rgba(6,182,212,.2) 0%,transparent 70%)"
              : state === "speaking"
                ? "radial-gradient(circle,rgba(34,197,94,.2) 0%,transparent 70%)"
                : "radial-gradient(circle,rgba(167,139,250,.2) 0%,transparent 70%)",
        animation:
          state !== "idle"
            ? "orbGlow 1.5s ease-in-out .2s infinite"
            : "orbPulse2 3s ease-in-out .5s infinite",
      }}
    />
    {state === "thinking" && (
      <div
        style={{
          position: "absolute",
          width: 106,
          height: 106,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderTop: "2px solid #06b6d4",
          borderRight: "2px solid #7c3aed",
          animation: "thinkSpin 1.2s linear infinite",
        }}
      />
    )}
    <button
      onClick={onClick}
      style={{
        width: 94,
        height: 94,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        position: "relative",
        zIndex: 2,
        background:
          state === "listening"
            ? "radial-gradient(circle at 35% 35%,#ef4444,#dc2626 60%,#991b1b)"
            : state === "thinking"
              ? "radial-gradient(circle at 35% 35%,#22d3ee,#0891b2 60%,#0e7490)"
              : state === "speaking"
                ? "radial-gradient(circle at 35% 35%,#4ade80,#16a34a 60%,#15803d)"
                : "radial-gradient(circle at 35% 35%,#a78bfa,#7c3aed 60%,#5b21b6)",
        boxShadow:
          state === "listening"
            ? "0 0 32px rgba(220,38,38,.5),inset 0 2px 4px rgba(255,255,255,.2)"
            : state === "thinking"
              ? "0 0 32px rgba(6,182,212,.5),inset 0 2px 4px rgba(255,255,255,.2)"
              : state === "speaking"
                ? "0 0 32px rgba(34,197,94,.5),inset 0 2px 4px rgba(255,255,255,.2)"
                : "0 0 32px rgba(124,58,237,.4),inset 0 2px 4px rgba(255,255,255,.15)",
        animation:
          state === "idle" ? "orbFloat 4s ease-in-out infinite" : "none",
        transition: "all .3s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 30,
      }}
    >
      {state === "listening"
        ? "⏹"
        : state === "thinking"
          ? "🧠"
          : state === "speaking"
            ? "🔊"
            : "🎙️"}
    </button>
  </div>
);

// ── Icon button helper ────────────────────────────────────────────────────────
const IconBtn = ({ onClick, title, children, color, t }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: "none",
      border: "none",
      color: color || t.iconDefault,
      cursor: "pointer",
      padding: 7,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      transition: "color .15s, background .15s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = t.text;
      e.currentTarget.style.background = t.iconHoverBg;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = color || t.iconDefault;
      e.currentTarget.style.background = "none";
    }}
  >
    {children}
  </button>
);

// ── Helpers ──────────────────────────────────────────────────────────────────
const dateLabel = (d) => {
  const diff = Math.floor((new Date() - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "Previous 7 Days";
  if (diff < 30) return "Previous 30 Days";
  return "Older";
};
const timeStr = (d) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// FIX #3: was a module-level counter (`s1`, `s2`, ...) that reset to `s1`
// on every page refresh, causing unrelated conversations across sessions
// to collide on the same conversationId in MongoDB. crypto.randomUUID()
// guarantees a globally unique id per conversation.
const newId = () => crypto.randomUUID();

const GROUP_ORDER = [
  "Today",
  "Yesterday",
  "Previous 7 Days",
  "Previous 30 Days",
  "Older",
];

// FIX #1: persistence layer — AITutor.jsx previously had none at all,
// so sessions/messages were wiped on every refresh.
const CHAT_STORAGE_KEY = "student-ai-chat-state-v1";

const readPersistedChatState = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writePersistedChatState = (state) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures so the UI still works.
  }
};

// ── useIsMobile hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AITutor() {
  const dispatch = useDispatch();
  const { messages, input, streaming, error, mode } = useSelector(
    (s) => s.aiTutor,
  );
  const { t: translate, i18n } = useTranslation();
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileChat />;
  }

  const [dark, setDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-US");
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const t = dark ? DARK : LIGHT;

  const activeIdRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const recRef = useRef(null);
  const didMount = useRef(false);
  const voiceActiveRef = useRef(false);
  const silenceTimeoutRef = useRef(null);
  const hasResultRef = useRef(false);
  const lastAiTextRef = useRef("");
  const recLangRef = useRef("en-US");

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    dispatch(setStreaming(false));
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    voiceActiveRef.current = false;
    clearSilenceTimer();
    recRef.current?.stop();
    setListening(false);
  }, [dispatch, clearSilenceTimer]);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimeoutRef.current = setTimeout(() => {
      cancelStream();
    }, 60000);
  }, [clearSilenceTimer, cancelStream]);

  useEffect(() => {
    recLangRef.current = voiceLang;
  }, [voiceLang]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, streaming]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!activeIdRef.current || messages.length === 0) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeIdRef.current ? { ...s, messages: [...messages] } : s,
      ),
    );
  }, [messages]);

  // On mount:
  // 1. Restore sessions/activeId/messages/input/mode from localStorage
  // 2. Fetch the latest sessions list from MongoDB and update the state/cache
  useEffect(() => {
    const persisted = readPersistedChatState();

    let initialSessions = [];
    let initialActiveId = null;

    if (persisted?.sessions?.length) {
      initialActiveId = persisted.activeId || persisted.sessions[0].id;
      initialSessions = persisted.sessions;
      setSessions(persisted.sessions);
      setActiveId(initialActiveId);
      activeIdRef.current = initialActiveId;

      if (Array.isArray(persisted.messages)) {
        dispatch({ type: "aiTutor/setMessages", payload: persisted.messages });
      } else if (initialActiveId) {
        const restoredSession = persisted.sessions.find(
          (s) => s.id === restoredActiveId,
        );
        dispatch({
          type: "aiTutor/setMessages",
          payload: restoredSession?.messages || [],
        });
      }

      if (persisted.input !== undefined) {
        dispatch(setInput(persisted.input));
      }
      if (persisted.mode) {
        dispatch(setMode(persisted.mode));
      }
      return;
    }

    const id = newId(),
      created = new Date();
    setSessions([
      {
        id,
        title: "New conversation",
        time: timeStr(created),
        dateLabel: dateLabel(created),
        messages: [],
      },
    ]);
    setActiveId(id);
    activeIdRef.current = id;
  }, [dispatch]);

  // FIX #1: persist sessions/activeId/messages/input/mode on every change.
  useEffect(() => {
    writePersistedChatState({
      sessions,
      activeId: activeIdRef.current,
      messages,
      input,
      mode,
    });
  }, [sessions, activeId, messages, input, mode]);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [activeId, isMobile]);

  useEffect(() => {
    if (mode !== "voice") {
      voiceActiveRef.current = false;
      clearSilenceTimer();
      recRef.current?.stop();
      window.speechSynthesis?.cancel();
      setListening(false);
      setSpeaking(false);
    }
  }, [mode, clearSilenceTimer]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
    };
  }, [clearSilenceTimer]);

  // Close sidebar on outside tap (mobile overlay)
  const handleOverlayClick = useCallback(() => {
    if (isMobile && sidebarOpen) setSidebarOpen(false);
  }, [isMobile, sidebarOpen]);

  const startNewChat = useCallback(() => {
    if (messages.length > 0 && activeIdRef.current)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeIdRef.current ? { ...s, messages: [...messages] } : s,
        ),
      );
    const id = newId(),
      created = new Date();
    setSessions((prev) => [
      {
        id,
        title: "New conversation",
        time: timeStr(created),
        dateLabel: dateLabel(created),
        messages: [],
      },
      ...prev,
    ]);
    setActiveId(id);
    activeIdRef.current = id;
    dispatch({ type: "aiTutor/clearMessages" });
    dispatch(setError(null));
    dispatch(setInput(""));
    if (isMobile) setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
  }, [messages, dispatch, isMobile]);

  // FIX #2: now fetches full history from the backend (matching MobileChat.jsx)
  // instead of only reading from local session state, and normalizes
  // role: "assistant" -> role: "ai" so assistant messages actually render
  // (the JSX only ever checks for m.role === "ai" / m.role === "user").
  const loadSession = useCallback(
    async (id) => {
      if (id === activeIdRef.current) return;
      if (messages.length > 0 && activeIdRef.current)
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeIdRef.current
              ? { ...s, messages: [...messages] }
              : s,
          ),
        );
      const session = sessions.find((s) => s.id === id);
      if (!session) return;
      setActiveId(id);
      activeIdRef.current = id;
      dispatch(setError(null));

      try {
        const baseUrl = API_BASE_URL;
        const res = await fetch(
          `${baseUrl}/ai/history/${encodeURIComponent(id)}`,
          {
            credentials: "include",
          },
        );
        if (!res.ok) throw new Error("Failed to load history");
        const data = await res.json();
        const historyMessages = (data.messages || []).map(
          ({ role, content }) => ({
            // Normalize backend role ("user" | "assistant") to the
            // frontend's role convention ("user" | "ai").
            role: role === "assistant" ? "ai" : role,
            content,
          }),
        );
        setSessions((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, messages: historyMessages } : s,
          ),
        );
        dispatch({ type: "aiTutor/setMessages", payload: historyMessages });
      } catch {
        dispatch({ type: "aiTutor/setMessages", payload: session.messages });
      }

      if (isMobile) setSidebarOpen(false);
    },
    [messages, sessions, dispatch, isMobile],
  );

  // FIX #4: previously only removed the session from local React state /
  // localStorage — never told the backend, so the conversation's messages
  // stayed in MongoDB forever and could reappear (e.g. via loadSession or
  // a future history sync). Now fires a DELETE to /ai/history/:id too.
  const deleteSession = useCallback(
    (id) => {
      // Optimistic UI removal first so the sidebar feels instant.
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === activeIdRef.current) {
        dispatch({ type: "aiTutor/clearMessages" });
        setActiveId(null);
        activeIdRef.current = null;
      }

      const baseUrl = API_BASE_URL;
      fetch(`${baseUrl}/ai/history/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      }).catch((err) => {
        console.error("Failed to delete conversation from server:", err);
      });
    },
    [dispatch],
  );

  const sendMessage = useCallback(
    async (text, persist = true) => {
      const msg = (text || input).trim();
      if (!msg || streaming) return "";

      if (persist) {
        if (!activeIdRef.current) {
          const id = newId(),
            created = new Date();
          const title = msg.length > 42 ? msg.slice(0, 42) + "…" : msg;
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
                : s.title === "New conversation"
                  ? {
                      ...s,
                      title: msg.length > 42 ? msg.slice(0, 42) + "…" : msg,
                    }
                  : s,
            ),
          );
        }
      }

      dispatch(setInput(""));
      dispatch(setError(null));
      const userMsg = { role: "user", content: msg };
      const history = [...messages, userMsg];
      let conversationId = activeIdRef.current;

      if (persist && !conversationId) {
        const id = newId();
        const created = new Date();
        const title = msg.length > 42 ? msg.slice(0, 42) + "…" : msg;
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
        conversationId = id;
      }

      if (persist) {
        dispatch(addUserMessage(userMsg));
        dispatch(addAiPlaceholder());
      }
      dispatch(setStreaming(true));

      lastAiTextRef.current = "";
      let fullText = "";
      try {
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const baseUrl = API_BASE_URL;
        const requestedLanguage =
          mode === "voice"
            ? getAiLanguageName(voiceLang)
            : getAiLanguageName(i18n.language);
        const res = await fetch(`${baseUrl}/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            language: requestedLanguage,
            userRole: "student",
            ...(conversationId ? { conversationId } : {}),
          }),
          signal: ctrl.signal,
          credentials: "include",
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.message || "AI service unavailable.");
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const p = line.slice(6).trim();
            if (p === "[DONE]") break;
            try {
              const { text: chunk, error: se } = JSON.parse(p);
              if (se) throw new Error(se);
              if (chunk) {
                if (persist) dispatch(appendAiText(chunk));
                fullText += chunk;
              }
            } catch (e) {
              if (e.name !== "SyntaxError") throw e;
            }
          }
        }
      } catch (err) {
        if (err.name === "AbortError") return "";
        dispatch(
          setError("AI is currently not available. Please try again later."),
        );
        if (persist) dispatch(removeStreamingPlaceholders());
        return "";
      } finally {
        if (persist) dispatch(markStreamingDone());
        dispatch(setStreaming(false));
        abortRef.current = null;
        inputRef.current?.focus({ preventScroll: true });
      }
      lastAiTextRef.current = fullText;
      return fullText;
    },
    [input, messages, streaming, mode, voiceLang, dispatch, i18n.language],
  );



  const speak = useCallback(
    (text) =>
      new Promise((resolve) => {
        if (!("speechSynthesis" in window) || !text) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const targetLang = getTtsLanguageCode(text, i18n.language);
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = targetLang;
        utter.rate = targetLang.startsWith("en") ? 1 : 0.95;
        const pickVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          if (!voices.length) return null;
          const langPrefix = targetLang.split("-")[0];
          return (
            voices.find((v) => v.lang === targetLang) ||
            voices.find((v) =>
              v.lang?.toLowerCase().startsWith(langPrefix),
            ) ||
            null
          );
        };
        const speakNow = () => {
          const voice = pickVoice();
          if (voice) utter.voice = voice;
          utter.onstart = () => setSpeaking(true);
          const finish = () => {
            setSpeaking(false);
            resolve();
          };
          utter.onend = finish;
          utter.onerror = finish;
          window.speechSynthesis.speak(utter);
        };
        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.onvoiceschanged = null;
            speakNow();
          };
        } else {
          speakNow();
        }
      }),
    [dispatch],
  );

  const startRecognition = useCallback(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      dispatch(setError("Voice input not supported. Try Chrome."));
      voiceActiveRef.current = false;
      clearSilenceTimer();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = recLangRef.current;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => {
      setListening(true);
      dispatch(setError(null));
      hasResultRef.current = false;
    };
    rec.onend = () => {
      setListening(false);
      if (voiceActiveRef.current && !hasResultRef.current) {
        startRecognition();
      }
    };
    rec.onerror = (e) => {
      setListening(false);
      const map = {
        "not-allowed": "Microphone access denied.",
        "no-speech": null,
        network: "Network error.",
        "audio-capture": "No microphone found.",
        aborted: null,
      };
      const m = map[e.error];
      if (m !== null && m !== undefined) dispatch(setError(m ?? `Voice error: ${e.error}`));
      if (e.error === "not-allowed" || e.error === "audio-capture") {
        voiceActiveRef.current = false;
        clearSilenceTimer();
      }
    };
    rec.onresult = async (e) => {
      hasResultRef.current = true;
      setListening(false);
      clearSilenceTimer();
      const transcript = e.results[0][0].transcript;
      const aiText = await sendMessage(transcript, false);
      if (!voiceActiveRef.current) return;
      if (aiText) await speak(aiText);
      if (voiceActiveRef.current) {
        resetSilenceTimer();
        startRecognition();
      }
    };
    rec.start();
  }, [dispatch, sendMessage, speak, resetSilenceTimer, clearSilenceTimer]);

  const toggleListen = () => {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      voiceActiveRef.current = false;
      clearSilenceTimer();
      return;
    }
    if (listening || voiceActiveRef.current) {
      voiceActiveRef.current = false;
      clearSilenceTimer();
      recRef.current?.stop();
      setListening(false);
      return;
    }
    voiceActiveRef.current = true;
    resetSilenceTimer();
    startRecognition();
  };

  const orbState = speaking
    ? "speaking"
    : streaming
      ? "thinking"
      : listening
        ? "listening"
        : "idle";
  const grouped = sessions.reduce((acc, s) => {
    if (!acc[s.dateLabel]) acc[s.dateLabel] = [];
    acc[s.dateLabel].push(s);
    return acc;
  }, {});
  const hasMessages = messages.length > 0;

  // ── Topbar height for offset calculations ────────────────────────────────
  // Parent nav is 70px. On mobile we use dvh for better viewport handling.
  const containerHeight = "calc(var(--vh, 1dvh) * 100 - 70px)";

  return (
    <div
      style={{
        display: "flex",
        height: containerHeight,
        maxHeight: containerHeight,
        minHeight: 0,
        overflow: "hidden",
        background: t.bg,
        position: "relative", // for mobile overlay
        transition: "background .2s, color .2s",
      }}
    >
      <style>{`
        @keyframes pulse  { 0%,80%,100%{opacity:.3} 40%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .ai-msg { animation: fadeUp .18s ease both; }
        .ai-input-el { font-family: inherit; }
        .ai-input-el::placeholder { color: ${dark ? "#444" : "#aaa"}; }
        .grad-border:focus-within { box-shadow: 0 0 0 2px rgba(124,58,237,.35), 0 0 20px rgba(124,58,237,.15) !important; }
        .sess-row:hover { background: ${t.bgCardHover} !important; }
        .sess-row:hover .del-btn { opacity: 1 !important; }
        .prompt-card:hover { border-color: #7c3aed !important; color: ${t.text} !important; background: ${t.bgCardHover} !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 4px; }
        @supports (height: 100dvh) { :root { --vh: 1dvh; } }
      `}</style>

      {/* ── Mobile sidebar overlay backdrop ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={handleOverlayClick}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        style={{
          // On mobile: absolute overlay. On desktop: inline panel.
          position: isMobile ? "absolute" : "relative",
          top: isMobile ? 0 : undefined,
          left: isMobile ? 0 : undefined,
          bottom: isMobile ? 0 : undefined,
          zIndex: isMobile ? 20 : undefined,
          width: sidebarOpen ? (isMobile ? "min(280px, 85vw)" : 260) : 0,
          minWidth: sidebarOpen ? (isMobile ? "min(280px, 85vw)" : 260) : 0,
          overflow: "hidden",
          transition: "width .22s ease, min-width .22s ease",
          background: t.bgSidebar,
          borderRight: sidebarOpen ? `1px solid ${t.border}` : "none",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div
          style={{
            width: isMobile ? "min(280px, 85vw)" : 260,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            opacity: sidebarOpen ? 1 : 0,
            transition: "opacity .18s ease",
          }}
        >
          {/* Sidebar top */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 10px 10px",
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
            <div style={{ display: "flex", gap: 2 }}>
              <IconBtn onClick={startNewChat} title="New chat" t={t}>
                <IconEdit />
              </IconBtn>
              {isMobile && (
                <IconBtn
                  onClick={() => setSidebarOpen(false)}
                  title="Close"
                  t={t}
                >
                  <IconX />
                </IconBtn>
              )}
            </div>
          </div>

          {/* Sessions list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 0 16px" }}>
            {sessions.length === 0 ? (
              <div
                style={{
                  padding: "36px 16px",
                  color: t.textSubtle,
                  fontSize: 12,
                  textAlign: "center",
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
                      padding: "12px 14px 4px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: t.textSubtle,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
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
                        position: "relative",
                        padding: "9px 14px",
                        margin: "1px 6px",
                        borderRadius: 8,
                        cursor: "pointer",
                        background:
                          activeId === s.id ? t.bgActive : "transparent",
                        borderLeft: `2px solid ${activeId === s.id ? t.borderActive : "transparent"}`,
                        transition: "background .12s",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: activeId === s.id ? t.text : t.textMuted,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
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
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: t.textSubtle,
                          cursor: "pointer",
                          padding: 3,
                          borderRadius: 4,
                          opacity: 0,
                          transition: "opacity .12s, color .12s",
                          display: "flex",
                          alignItems: "center",
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
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minWidth: 0,
          overflow: "hidden",
          background: t.bg,
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 4 : 6,
            padding: isMobile ? "8px 10px" : "10px 16px",
            borderBottom: `1px solid ${t.border}`,
            flexShrink: 0,
            background: t.bgTopbar,
          }}
        >
          {/* Left: hamburger + pencil */}
          {!sidebarOpen && (
            <div
              style={{ display: "flex", gap: 2, marginRight: isMobile ? 0 : 4 }}
            >
              <IconBtn
                onClick={() => setSidebarOpen(true)}
                title="Open history"
                t={t}
              >
                <IconMenu />
              </IconBtn>
              {!isMobile && (
                <IconBtn onClick={startNewChat} title="New chat" t={t}>
                  <IconEdit />
                </IconBtn>
              )}
            </div>
          )}

          {/* Title */}
          <span
            style={{
              fontSize: isMobile ? 14 : 15,
              fontWeight: 700,
              color: t.text,
              flex: 1,
              userSelect: "none",
            }}
          >
            AI Tutor
          </span>

          {/* Right controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 2 : 6,
            }}
          >
            {!isMobile && (
              <IconBtn
                onClick={() => setSidebarOpen((v) => !v)}
                title="Toggle history"
                color={sidebarOpen ? t.historyIcon : t.iconDefault}
                t={t}
              >
                <IconHistory />
              </IconBtn>
            )}

            <IconBtn
              onClick={() => setDark((v) => !v)}
              title={dark ? "Light mode" : "Dark mode"}
              t={t}
            >
              {dark ? <IconSun /> : <IconMoon />}
            </IconBtn>

            {/* Chat / Voice toggle */}
            <div
              style={{
                display: "flex",
                gap: 2,
                background: t.bgToggle,
                padding: isMobile ? 2 : 3,
                borderRadius: 10,
                marginLeft: 2,
              }}
            >
              {[
                { key: "chat", label: isMobile ? "💬" : "💬 Chat" },
                { key: "voice", label: isMobile ? "🎙️" : "🎙️ Voice" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => dispatch(setMode(m.key))}
                  style={{
                    padding: isMobile ? "5px 10px" : "5px 16px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: isMobile ? 14 : 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: mode === m.key ? t.modeActiveBg : "transparent",
                    color:
                      mode === m.key ? t.modeActiveColor : t.modeInactiveColor,
                    transition: "all .15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* New chat on mobile — in topbar */}
            {isMobile && (
              <IconBtn onClick={startNewChat} title="New chat" t={t}>
                <IconEdit />
              </IconBtn>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              background: t.errorBg,
              borderBottom: `1px solid ${t.errorBorder}`,
              padding: isMobile ? "8px 12px" : "10px 20px",
              color: t.errorText,
              fontSize: isMobile ? 12 : 13,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ flex: 1, marginRight: 8 }}>⚠️ {error}</span>
            <button
              onClick={() => dispatch(setError(null))}
              style={{
                background: "none",
                border: "none",
                color: t.errorText,
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Chat mode ── */}
        {mode === "chat" ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Messages scroll area — only this div scrolls */}
            <div
              ref={scrollContainerRef}
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                // KEY FIX: no padding-top when empty; only add when there are messages
                padding: hasMessages
                  ? isMobile
                    ? "16px 0 8px"
                    : "24px 0 8px"
                  : "0",
                // Prevent the container from growing past its flex allocation
                minHeight: 0,
              }}
            >
              <div
                style={{
                  maxWidth: isMobile ? "100%" : 720,
                  margin: "0 auto",
                  padding: isMobile ? "0 12px" : "0 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  // Only take up space needed — don't push down
                  minHeight: hasMessages ? undefined : "100%",
                  justifyContent: hasMessages ? "flex-start" : "center",
                }}
              >
                {/* Empty state — centered, compact */}
                {!hasMessages && !streaming && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: isMobile ? "20px 8px" : "32px 0",
                    }}
                  >
                    <div
                      style={{ fontSize: isMobile ? 28 : 34, marginBottom: 8 }}
                    >
                      🤖
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 17 : 21,
                        fontWeight: 700,
                        color: t.text,
                        marginBottom: 6,
                      }}
                    >
                      {translate("aiTutor.emptyTitle")}
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 13 : 14,
                        color: t.textMuted,
                        marginBottom: isMobile ? 4 : 28,
                      }}
                    >
                      {translate("aiTutor.emptySubtitle")}
                    </div>
                  </div>
                )}

                {/* Message bubbles */}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className="ai-msg"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: m.role === "user" ? "flex-end" : "flex-start",
                      marginBottom: isMobile ? 8 : 10,
                    }}
                  >
                    {m.role === "ai" && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: isMobile ? 8 : 12,
                          maxWidth: "92%",
                        }}
                      >
                        <div
                          style={{
                            width: isMobile ? 26 : 30,
                            height: isMobile ? 26 : 30,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg,#7c3aed,#06b6d4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: isMobile ? 12 : 14,
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          🤖
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? 13 : 14,
                            color: t.text,
                            lineHeight: 1.8,
                            paddingTop: 2,
                          }}
                        >
                          {m.streaming && !m.content ? (
                            <div
                              style={{ display: "flex", gap: 5, paddingTop: 5 }}
                            >
                              {[0, 0.2, 0.4].map((d, j) => (
                                <div
                                  key={j}
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
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
                                    display: "inline-block",
                                    width: 2,
                                    height: 14,
                                    background: "#a78bfa",
                                    marginLeft: 2,
                                    animation: "pulse .8s infinite",
                                    verticalAlign: "middle",
                                  }}
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {m.role === "user" && (
                      <div
                        style={{
                          // On mobile, allow wider bubbles
                          maxWidth: isMobile ? "85%" : "72%",
                          padding: isMobile ? "9px 13px" : "10px 16px",
                          borderRadius: "18px 18px 4px 18px",
                          background: t.bgUserBubble,
                          color: t.text,
                          fontSize: isMobile ? 13 : 14,
                          lineHeight: 1.65,
                          border: `1px solid ${t.border}`,
                        }}
                      >
                        <RenderText text={m.content} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Input bar — fixed at bottom, never scrolls */}
            <div
              style={{
                padding: isMobile ? "8px 12px 10px" : "10px 20px 14px",
                background: t.bg,
                flexShrink: 0,
                // Safe area on mobile (notch/home bar)
                paddingBottom: isMobile
                  ? "max(10px, env(safe-area-inset-bottom, 10px))"
                  : 14,
              }}
            >
              <div
                style={{ maxWidth: isMobile ? "100%" : 720, margin: "0 auto" }}
              >
                <div
                  className="grad-border"
                  style={{
                    position: "relative",
                    borderRadius: 15,
                    padding: 1.5,
                    background:
                      "linear-gradient(135deg, #7c3aed, #06b6d4, #a78bfa)",
                    boxShadow: dark
                      ? "0 0 14px rgba(124,58,237,.15)"
                      : "0 0 14px rgba(124,58,237,.18)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      borderRadius: 13,
                      background: t.bgInput,
                      overflow: "hidden",
                    }}
                  >
                    <textarea
                      ref={inputRef}
                      className="ai-input-el"
                      value={input}
                      onChange={(e) => {
                        dispatch(setInput(e.target.value));
                        e.target.style.height = "auto";
                        e.target.style.height =
                          Math.min(
                            e.target.scrollHeight,
                            isMobile ? 120 : 160,
                          ) + "px";
                      }}
                      onKeyDown={(e) => {
                        // On mobile, Enter creates newline; on desktop Enter sends
                        if (e.key === "Enter" && !e.shiftKey && !isMobile) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Message AI Tutor…"
                      disabled={streaming}
                      rows={1}
                      style={{
                        width: "100%",
                        padding: isMobile
                          ? "11px 48px 11px 13px"
                          : "13px 52px 13px 16px",
                        background: "transparent",
                        border: "none",
                        color: t.text,
                        fontSize: isMobile ? 15 : 14, // 15px on mobile avoids iOS zoom
                        outline: "none",
                        resize: "none",
                        lineHeight: 1.55,
                        transition: "none",
                        boxSizing: "border-box",
                        overflowY: "hidden",
                        display: "block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      right: 9,
                      bottom: 9,
                      zIndex: 2,
                    }}
                  >
                    {streaming ? (
                      <button
                        onClick={cancelStream}
                        style={{
                          width: isMobile ? 32 : 34,
                          height: isMobile ? 32 : 34,
                          borderRadius: 9,
                          background: "#7c3aed",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                        }}
                      >
                        ⏹
                      </button>
                    ) : (
                      <button
                        onClick={() => sendMessage()}
                        disabled={!String(input || "").trim()}
                        style={{
                          width: isMobile ? 32 : 34,
                          height: isMobile ? 32 : 34,
                          borderRadius: 9,
                          background: String(input || "").trim()
                            ? t.sendActive
                            : t.sendInactive,
                          border: "none",
                          color: String(input || "").trim()
                            ? "#fff"
                            : t.sendInactiveColor,
                          cursor: String(input || "").trim()
                            ? "pointer"
                            : "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 17,
                          transition: "all .15s",
                        }}
                      >
                        ↑
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {!isMobile && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    color: t.textCaption,
                    marginTop: 7,
                  }}
                >
                  AI Tutor can make mistakes. Verify important information.
                </div>
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
              gap: isMobile ? 18 : 28,
              padding: isMobile ? "0 16px 24px" : "0 20px 32px",
              background: t.bg,
              overflowY: "auto",
              // Safe area on mobile
              paddingBottom: isMobile
                ? "max(24px, env(safe-area-inset-bottom, 24px))"
                : 32,
            }}
          >
            <div
              style={{
                fontSize: isMobile ? 12 : 14,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "color .3s",
                minHeight: 18,
                color:
                  orbState === "listening"
                    ? "#f87171"
                    : orbState === "thinking"
                      ? "#22d3ee"
                      : orbState === "speaking"
                        ? "#4ade80"
                        : "#a78bfa",
              }}
            >
              {orbState === "listening"
                ? "● Listening…"
                : orbState === "thinking"
                  ? "◌ Thinking…"
                  : orbState === "speaking"
                    ? "🔊 Speaking…"
                    : "Tap to speak"}
            </div>

            <VoiceOrb state={orbState} onClick={toggleListen} />

            {/* Language toggle */}
            <div
              style={{
                display: "flex",
                gap: 2,
                background: t.bgToggle,
                padding: 3,
                borderRadius: 10,
              }}
            >
              {[
                { key: "en-US", label: "English" },
                { key: "hi-IN", label: "हिन्दी" },
              ].map((l) => (
                <button
                  key={l.key}
                  onClick={() => setVoiceLang(l.key)}
                  disabled={listening || streaming || speaking}
                  style={{
                    padding: isMobile ? "5px 12px" : "5px 14px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: isMobile ? 13 : 12,
                    fontWeight: 600,
                    cursor:
                      listening || streaming || speaking
                        ? "not-allowed"
                        : "pointer",
                    background:
                      voiceLang === l.key ? t.modeActiveBg : "transparent",
                    color:
                      voiceLang === l.key
                        ? t.modeActiveColor
                        : t.modeInactiveColor,
                    transition: "all .15s",
                    opacity: listening || streaming || speaking ? 0.6 : 1,
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <p
              style={{
                fontSize: isMobile ? 13 : 13,
                color: t.textMuted,
                textAlign: "center",
                maxWidth: 260,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {orbState === "listening"
                ? "Speak clearly — tap the orb to cancel"
                : orbState === "thinking"
                  ? "Processing your question…"
                  : orbState === "speaking"
                    ? "Tap the orb to interrupt"
                    : "Pick a language below, then ask anything out loud"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
