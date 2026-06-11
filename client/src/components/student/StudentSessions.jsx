import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSessions } from "../../redux/slices/sessionSlice";
import { fetchSubscription } from "../../redux/slices/billingSlice";
import { io } from "socket.io-client";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extracts a YouTube video ID from common URL formats:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/live/VIDEO_ID
 */
function extractYouTubeId(url = "") {
  if (!url) return null;
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/live\/([^?&#]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Chat Panel ─────────────────────────────────────────────────────────────

const ChatPanel = ({ sessionId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Connect to your Socket.IO server
    // Change the URL to match your backend (e.g. process.env.REACT_APP_SOCKET_URL)
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || window.location.origin,
      {
        withCredentials: true,
      },
    );
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      // Join the room for this specific session
      socket.emit("join_session_chat", { sessionId });
    });

    socket.on("disconnect", () => setConnected(false));

    // Listen for incoming chat messages
    socket.on("session_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Receive message history when joining
    socket.on("session_history", (history) => {
      setMessages(history);
    });

    return () => {
      socket.emit("leave_session_chat", { sessionId });
      socket.disconnect();
    };
  }, [sessionId]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !socketRef.current) return;

    socketRef.current.emit("session_message", {
      sessionId,
      text,
      sender: currentUser?.name || "You",
      senderId: currentUser?._id,
    });
    setInput("");
  }, [input, sessionId, currentUser]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 className="text-white font-semibold text-sm">Live Chat</h3>
        <span
          className={`flex items-center gap-1.5 text-xs ${
            connected ? "text-green-400" : "text-slate-500"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500 animate-pulse" : "bg-slate-600"
            }`}
          />
          {connected ? "Connected" : "Connecting…"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.length === 0 && (
          <p className="text-slate-500 text-xs text-center mt-6">
            No messages yet. Be the first to say something!
          </p>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.senderId === currentUser?._id;
          return (
            <div
              key={msg._id || i}
              className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
            >
              {!isOwn && (
                <span className="text-xs text-slate-500 mb-1 ml-1">
                  {msg.sender}
                </span>
              )}
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  isOwn
                    ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-200 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-xs text-slate-600 mt-1 mx-1">
                {msg.createdAt
                  ? formatTime(new Date(msg.createdAt))
                  : formatTime(new Date())}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Send a message…"
          maxLength={500}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !connected}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

// ─── Session Room (Live View) ────────────────────────────────────────────────

const SessionRoom = ({ session, currentUser, onLeave }) => {
  const videoId = extractYouTubeId(session.url);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onLeave}
            className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            title="Back to sessions"
          >
            {/* Back arrow */}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h2 className="text-white font-semibold text-lg leading-tight">
              {session.title}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              📅 {session.date} · 🕒 {session.time}
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            session.status === "live"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
          }`}
        >
          {session.status === "live" ? "🔴 LIVE" : session.status}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Video */}
        <div className="flex-1 flex flex-col min-w-0">
          {videoId ? (
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-black"
              style={{ paddingTop: "56.25%" /* 16:9 */ }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={session.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-400 mb-3">
                  Could not parse a YouTube URL from this session.
                </p>
                {session.url && (
                  <a
                    href={session.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 underline text-sm"
                  >
                    Open link manually
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="w-80 flex-shrink-0 flex flex-col">
          <ChatPanel sessionId={session._id} currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};

// ─── Session Card ────────────────────────────────────────────────────────────

const SessionCard = ({ session, onJoin, showToast }) => {
  const copyLink = async () => {
    if (!session.url) {
      showToast?.("No session URL available");
      return;
    }
    try {
      await navigator.clipboard.writeText(session.url);
      showToast?.("Session link copied");
    } catch {
      showToast?.("Failed to copy link");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-3 h-3 rounded-full ${
              session.status === "live"
                ? "bg-green-500 animate-pulse"
                : "bg-purple-500"
            }`}
          />
          <h3 className="text-lg font-semibold text-white">{session.title}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              session.status === "live"
                ? "bg-green-500/20 text-green-400"
                : "bg-purple-500/20 text-purple-400"
            }`}
          >
            {session.status}
          </span>
        </div>
        <p className="text-slate-400 text-sm">📅 {session.date}</p>
        <p className="text-slate-400 text-sm">🕒 {session.time}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onJoin(session)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium hover:opacity-90 transition"
        >
          Join Session
        </button>
        <button
          onClick={copyLink}
          className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const StudentSessions = ({ showToast, currentUser }) => {
  const dispatch = useDispatch();
  const { sessions, loading } = useSelector((state) => state.sessions);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    dispatch(fetchSessions());
    dispatch(fetchSubscription());
  }, [dispatch]);

  if (activeSession) {
    return (
      <div className="p-6">
        <SessionRoom
          session={activeSession}
          currentUser={currentUser}
          onLeave={() => setActiveSession(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Live Sessions</h1>
        <p className="text-slate-400 mt-1">
          Join upcoming and live instructor sessions.
        </p>
      </div>

      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
          Loading sessions…
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            No Sessions Available
          </h3>
          <p className="text-slate-400">
            Your instructors haven't scheduled any sessions yet.
          </p>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard
              key={session._id}
              session={session}
              onJoin={setActiveSession}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentSessions;
