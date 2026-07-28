import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchSessions } from "../../redux/slices/sessionSlice";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../../config/api.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function format12Hour(timeStr) {
  if (!timeStr || timeStr === "TBD") return "TBD";
  const parts = timeStr.split(":");
  if (parts.length !== 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  const ampm = h >= 12 ? "PM" : "AM";
  let displayHour = h % 12;
  if (displayHour === 0) displayHour = 12;

  const hh = displayHour.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");
  return `${hh}:${mm} ${ampm}`;
}

// ─── Chat Panel (YouTube-style) ────────────────────────────────────────────

// Deterministic color per sender, so the same person always gets the same
// avatar/name color — mirrors how YouTube colors commenter names.
const AVATAR_COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500",
  "bg-teal-500", "bg-cyan-500", "bg-blue-500", "bg-indigo-500",
  "bg-purple-500", "bg-pink-500",
];
const NAME_COLORS = [
  "text-red-400", "text-orange-400", "text-amber-400", "text-emerald-400",
  "text-teal-400", "text-cyan-400", "text-blue-400", "text-indigo-400",
  "text-purple-400", "text-pink-400",
];

function hashString(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getSenderStyle(sender = "?") {
  const idx = hashString(sender) % AVATAR_COLORS.length;
  return {
    avatarColor: AVATAR_COLORS[idx],
    nameColor: NAME_COLORS[idx],
    initial: sender.trim().charAt(0).toUpperCase() || "?",
  };
}

const ChatPanel = ({ sessionId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const socketUrl = SOCKET_URL;

    let socket;
    try {
      socket = io(socketUrl, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ["polling", "websocket"],
      });
    } catch {
      setError("Unable to connect to chat server.");
      return;
    }

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError(null);
      socket.emit("join_session_chat", { sessionId });
    });

    socket.on("connect_error", (err) => {
      setConnected(false);
      setError("Chat server unreachable. Messages will not be sent.");
      console.warn("[Chat] connect_error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      if (reason === "io server disconnect") socket.connect();
    });

    socket.on("session_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("session_history", (history) => {
      if (Array.isArray(history)) setMessages(history);
    });

    return () => {
      socket.emit("leave_session_chat", { sessionId });
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !socketRef.current || !connected) return;

    const msgPayload = {
      sessionId,
      text,
      sender: currentUser?.name || currentUser?.email || "Student",
      senderId: currentUser?._id,
      createdAt: new Date().toISOString(),
    };

    socketRef.current.emit("session_message", msgPayload);
    setMessages((prev) => [
      ...prev,
      { ...msgPayload, _id: `local-${Date.now()}` },
    ]);
    setInput("");
  }, [input, sessionId, currentUser, connected]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[420px] lg:h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <h3 className="text-white font-semibold text-sm">Live Chat</h3>
        <span
          className={`flex items-center gap-1.5 text-xs ${connected ? "text-green-400" : "text-slate-500"}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-slate-600"}`}
          />
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {error && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Message list — YouTube style: avatar + name + message inline */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        {messages.length === 0 && (
          <p className="text-slate-500 text-xs text-center mt-8">
            No messages yet. Be the first to say something!
          </p>
        )}
        {messages.map((msg, i) => {
          const { avatarColor, nameColor, initial } = getSenderStyle(
            msg.sender
          );
          return (
            <div
              key={msg._id || i}
              className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition"
            >
              <div
                className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center flex-none mt-0.5`}
              >
                <span className="text-[10px] font-bold text-white">
                  {initial}
                </span>
              </div>
              <p className="min-w-0 flex-1 text-[13px] leading-snug break-words [overflow-wrap:anywhere]">
                <span className={`font-medium ${nameColor} mr-1.5`}>
                  {msg.sender}
                </span>
                <span className="text-slate-200">{msg.text}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Input — plain, no emoji/like/share/donation icons */}
      <div className="px-3 py-2.5 border-t border-slate-800/80 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            connected ? "Chat..." : "Type a message (connecting…)"
          }
          maxLength={500}
          className="flex-1 bg-slate-800/60 border border-slate-700 rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !connected}
          title={!connected ? "Waiting for chat connection…" : undefined}
          className="w-9 h-9 flex-none rounded-full bg-purple-600 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ─── YouTube IFrame API loader (singleton) ────────────────────────────────────
// The IFrame Player API script must only be injected once per page. Multiple
// SessionRoom mounts (e.g. switching sessions) reuse the same loader promise.
let ytApiPromise = null;
function loadYouTubeIframeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      resolve(window.YT);
    };
    if (!document.querySelector("script[data-yt-iframe-api]")) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.setAttribute("data-yt-iframe-api", "true");
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

function formatPlayerTime(seconds = 0) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Custom-Controlled YouTube Player ─────────────────────────────────────────
// Renders the YouTube embed with controls=0 and overlays a transparent
// click-catcher so the mouse never actually moves over the iframe. YouTube
// only shows its title bar, watermark, share icon, and "more videos" panel
// on hover/pause — if the iframe never receives those mouse events, none of
// that chrome ever renders. All playback is driven through our own buttons
// via the official postMessage-based Player API, so this is fully supported
// (not a hack relying on undocumented embed params).
//
const CustomYouTubePlayer = ({ videoId, title }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const rafRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const hideControlsTimeoutRef = useRef(null);

  // On touch devices there is no hover event, so controls (bottom bar,
  // fullscreen button) would otherwise never appear. This shows them on
  // tap and auto-hides them again after a few seconds while playing,
  // mirroring standard mobile video-player behavior.
  const revealControls = useCallback(() => {
    setHovering(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setHovering(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // Detects whether the loaded video is a live broadcast. The API's
  // getVideoData().isLive flag is the primary signal; as a fallback,
  // YouTube reports an effectively unbounded/huge duration for some live
  // streams before metadata settles, so treat very large or non-finite
  // durations as live too.
  const detectLive = (player) => {
    try {
      const data = player.getVideoData?.();
      if (data?.isLive) return true;
    } catch {
      // ignore — fall through to duration heuristic
    }
    const d = player.getDuration?.();
    return !Number.isFinite(d) || d === 0;
  };

  useEffect(() => {
    let destroyed = false;

    loadYouTubeIframeAPI().then((YT) => {
      if (destroyed || !containerRef.current) return;

      playerRef.current = new YT.Player(containerRef.current, {
        width: "100%",
        height: "100%",
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0, // we render our own controls entirely
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          playsinline: 1,
          fs: 0, // fullscreen handled by our own button via requestFullscreen
          disablekb: 1, // avoid focus-stealing keyboard shortcuts on the iframe
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            if (destroyed) return;
            setReady(true);
            setIsLive(detectLive(e.target));
            setDuration(e.target.getDuration());
            setVolume(e.target.getVolume());
            e.target.playVideo();
            // Optimistic: we just told it to play. Don't wait on the
            // async onStateChange event to confirm — on some browsers
            // that event is delayed or dropped entirely, which left the
            // video stuck behind our "paused" cover indefinitely even
            // though it was actually playing underneath.
            setPlaying(true);
          },
          onStateChange: (e) => {
            if (destroyed) return;
            // Treat BUFFERING as "playing" too — it fires right after we
            // call playVideo()/seekTo() and briefly precedes the actual
            // PLAYING state; treating it as paused would flash our cover
            // back on during every buffer/seek.
            const YTState = YT.PlayerState;
            const stillPlaying =
              e.data === YTState.PLAYING || e.data === YTState.BUFFERING;
            setPlaying(stillPlaying);
            if (e.data === YTState.PLAYING) {
              setIsLive(detectLive(e.target));
              setDuration(e.target.getDuration());
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Poll current time while playing (the API has no timeupdate event)
  useEffect(() => {
    const tick = () => {
      if (playerRef.current?.getCurrentTime && !seeking) {
        setCurrent(playerRef.current.getCurrentTime());
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [seeking]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pauseVideo();
      setPlaying(false);
    } else {
      p.playVideo();
      setPlaying(true);
    }
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume(v);
    if (v === 0) {
      setMuted(true);
      playerRef.current?.mute();
    } else if (muted) {
      setMuted(false);
      playerRef.current?.unMute();
    }
  };

  const handleSeek = (e) => {
    const v = Number(e.target.value);
    setCurrent(v);
  };

  const commitSeek = (e) => {
    const v = Number(e.target.value);
    playerRef.current?.seekTo(v, true);
    setSeeking(false);
  };

  const changeSpeed = (rate) => {
    if (playerRef.current?.setPlaybackRate) {
      playerRef.current.setPlaybackRate(rate);
      setPlaybackRate(rate);
    }
  };

  const seekOffset = (offset) => {
    const p = playerRef.current;
    if (!p || !p.getCurrentTime || !p.seekTo) return;
    const newTime = Math.max(0, Math.min(duration, p.getCurrentTime() + offset));
    p.seekTo(newTime, true);
    setCurrent(newTime);
  };

  const playerWrapperRef = useRef(null);

  const goFullscreen = () => {
    const el = playerWrapperRef.current;
    if (el) {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
      }
    }
  };

  return (
    <div
      ref={playerWrapperRef}
      className="relative w-full h-full bg-black"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onTouchStart={revealControls}
    >
      {/* The actual YouTube iframe gets mounted into this div by the Player API */}
      <div className="absolute inset-0 pointer-events-none">
        <div ref={containerRef} className="w-full h-full" title={title} />
      </div>

      {/* Click-catcher: sits above the iframe and intercepts every mouse
          event so hover/move/click never reaches YouTube's player chrome.
          A single click toggles play/pause, mirroring native behavior. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          revealControls();
          togglePlay();
        }}
        aria-label={playing ? "Pause" : "Play"}
        className="absolute inset-0 w-full h-full bg-transparent cursor-pointer z-10"
      />

      {/* While an actual LIVE broadcast is playing, YouTube keeps a
          persistent watermark/title strip pinned at the top and bottom —
          cover just those thin strips so the live picture itself stays
          visible instead of blacking out the whole frame. */}
      {playing && isLive && (
        <>
          <div className="absolute top-0 left-0 right-0 h-14 bg-black pointer-events-none z-20" />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-black pointer-events-none z-20" />
        </>
      )}

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-purple-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Top-right fullscreen button, shown on hover (or always on touch
          devices via the isLive/paused chrome-cover condition reused here
          for consistency) */}
      {ready && (
        <div
          className={`absolute top-3 right-3 z-30 transition-opacity duration-200 ${hovering ? "opacity-100" : "opacity-0"
            }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goFullscreen();
            }}
            aria-label="Fullscreen"
            title="Fullscreen"
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 hover:scale-110 transition cursor-pointer text-white border border-slate-700/50"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
          </button>
        </div>
      )}

      {/* Center play/pause & skip 10s controls, shown briefly on hover or while paused */}
      {ready && (!playing || hovering) && (
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity z-30 pointer-events-none"
        >
          <div
            className="flex items-center gap-4 sm:gap-6 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Backward 10s */}
            {!isLive && (
              <button
                onClick={() => seekOffset(-10)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 hover:scale-110 transition cursor-pointer text-white border border-slate-700/50"
                title="Backward 10 seconds"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-current">
                  <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
                </svg>
              </button>
            )}

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 hover:scale-110 transition cursor-pointer text-white border border-slate-700/50"
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-7 sm:h-7 fill-current">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-7 sm:h-7 fill-current">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Forward 10s */}
            {!isLive && (
              <button
                onClick={() => seekOffset(10)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 hover:scale-110 transition cursor-pointer text-white border border-slate-700/50"
                title="Forward 10 seconds"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-current">
                  <path d="M11.5 8c2.65 0 5.05.99 6.9 2.6L22 7v9h-9l3.62-3.62c-1.39-1.16-3.16-1.88-5.12-1.88-3.54 0-6.55 2.31-7.6 5.5l-2.37-.78C2.92 11.03 6.85 8 11.5 8z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Custom control bar */}
      {ready && (
        <div
          className={`absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-200 z-30 ${hovering ? "opacity-100" : "opacity-0"
            }`}
        >
          {!isLive && (
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={current}
              onMouseDown={() => setSeeking(true)}
              onChange={handleSeek}
              onMouseUp={commitSeek}
              onTouchStart={() => setSeeking(true)}
              onTouchEnd={commitSeek}
              className="w-full h-1.5 mb-3 rounded-full accent-purple-500 cursor-pointer"
              aria-label="Seek"
            />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              className="text-white hover:text-purple-300 transition flex-none"
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="text-white hover:text-purple-300 transition flex-none"
            >
              {muted || volume === 0 ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M16.5 12A4.5 4.5 0 0014 8v1.79l2.48 2.48c.01-.09.02-.18.02-.27zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03z" />
                </svg>
              )}
            </button>

            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="hidden sm:block w-20 h-1.5 rounded-full accent-purple-500 cursor-pointer flex-none"
              aria-label="Volume"
            />

            <span className="text-xs text-slate-300 font-medium tabular-nums flex-none">
              {isLive ? (
                <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </span>
              ) : (
                <>
                  {formatPlayerTime(current)} / {formatPlayerTime(duration)}
                </>
              )}
            </span>

            <span className="flex-1" />

            {!isLive && (
              <select
                value={playbackRate}
                onChange={(e) => changeSpeed(Number(e.target.value))}
                className="bg-slate-800 text-white text-xs rounded border border-slate-700 px-1.5 py-0.5 outline-none cursor-pointer focus:border-purple-500 transition flex-none mr-1"
                title="Playback Speed"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
              </select>
            )}

            <button
              onClick={goFullscreen}
              aria-label="Fullscreen"
              className="text-white hover:text-purple-300 transition flex-none"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Session Room ─────────────────────────────────────────────────────────────

const SessionRoom = ({ session, currentUser, onLeave }) => {
  const videoId = extractYouTubeId(session.url);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onLeave}
            className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            title="Back to sessions"
          >
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
              📅 {session.date} · 🕒 {format12Hour(session.time)}
            </p>
          </div>
        </div>
      </div>

      {/* Video + Chat — side by side like YouTube */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Video column */}
        <div className="flex-1 min-w-0 w-full">
          {videoId ? (
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-black shadow-lg shadow-black/40"
              style={{ paddingTop: "56.25%" }}
            >
              <div className="absolute inset-0">
                <CustomYouTubePlayer videoId={videoId} title={session.title} />
              </div>
            </div>
          ) : (
            <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center py-20">
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

        {/* Chat column */}
        <div className="w-full lg:w-[360px] lg:flex-none">
          <ChatPanel sessionId={session._id} currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};

// ─── Session Card ─────────────────────────────────────────────────────────────

// ─── Session Card (Cream/Parchment Premium) ───────────────────────────────

const getInstructorName = (session) =>
  session.instructor?.name ||
  session.instructorName ||
  session.instructor ||
  "Umang Vision Academy";

// Converts "16:32" (24h, e.g. from a <input type="time"> or stored value)
// into "4:32 PM". Falls back to the raw string if it can't parse it.
function formatTime12h(timeStr = "") {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h) || mStr === undefined) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}

const SessionCard = ({ session, onJoin, showToast }) => {
  const instructorName = getInstructorName(session);
  const instructorInitial = instructorName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className="relative bg-[#FBEFDD] border border-[#EADFC7]
                 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between
                 gap-4 shadow-[0_2px_10px_rgba(120,90,50,0.08)]
                 hover:shadow-[0_6px_20px_rgba(120,90,50,0.14)] transition-shadow duration-300
                 overflow-hidden"
    >
      {/* Peach accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#F4C9A0] to-[#E8A876]" />

      <div className="pl-2">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${session.status === "live"
              ? "bg-emerald-500 animate-pulse"
              : session.status === "ended"
                ? "bg-[#B9A98A]"
                : "bg-[#C9895C]"
              }`}
          />
          <h3 className="text-lg font-semibold text-[#3D2B1F]">{session.title}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${session.status === "live"
              ? "bg-emerald-100 text-emerald-700"
              : session.status === "ended"
                ? "bg-[#EADFC7] text-[#7A6A50]"
                : "bg-[#F6DDC0] text-[#8B5A2B]"
              }`}
          >
            {session.status}
          </span>
        </div>

        {/* Instructor & Class/Subject chips */}
        <div className="flex items-center gap-3 mb-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F4C9A0] to-[#E8A876] flex items-center justify-center flex-none shadow-sm">
              <span className="text-[10px] font-bold text-[#5A3A1F]">{instructorInitial}</span>
            </div>
            <p className="text-sm text-[#8B6F47]">
              <span className="text-[#000000]">Instructor:</span>{" "}
              <span className="font-medium text-[#5A4530]">{instructorName}</span>
            </p>
          </div>

          {session.class && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#EADFC7] text-[#5A3A1F] border border-[#D5C6A7]">
              🏷️ {session.class}
            </span>
          )}

          {session.subject && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#F6DDC0] text-[#8B5A2B] border border-[#E5C39E]">
              📚 {session.subject}
            </span>
          )}
        </div>

        <p className="text-[#000000] text-sm">📅 {session.date}</p>
        <p className="text-[#000000] text-sm">🕒 {formatTime12h(session.time)}</p>
      </div>

      <div className="flex gap-3 pl-2 md:pl-0">
        {session.status === "upcoming" ? (
          <button
            disabled
            className="px-4 py-2 rounded-xl bg-[#EFE3CC] text-[#B4A17E] font-medium
                       cursor-not-allowed border border-[#E0D3B4]"
          >
            Join Session
          </button>
        ) : (
          <button
            onClick={() => onJoin(session)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F4C9A0] to-[#E8A876]
                       text-[#5A3A1F] font-semibold shadow-sm hover:shadow-md hover:opacity-95
                       transition-all"
          >
            {session.status === "ended" ? "Replay Session" : "Join Session"}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

const SessionSkeleton = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded-full bg-slate-700" />
      <div className="h-5 w-48 bg-slate-700 rounded-lg" />
      <div className="h-5 w-16 bg-slate-700 rounded-full" />
    </div>
    <div className="h-4 w-32 bg-slate-700 rounded-lg" />
    <div className="h-4 w-24 bg-slate-700 rounded-lg" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentSessions = ({ showToast, currentUser: propCurrentUser }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.auth.user);
  const currentUser = propCurrentUser || reduxUser;

  // ✅ Correct selector — slice name is "sessions", state shape is { sessions: [], loading, error }
  const sessions = useSelector((state) => state.sessions.sessions);
  const loading = useSelector((state) => state.sessions.loading);
  const error = useSelector((state) => state.sessions.error);

  const [activeSession, setActiveSession] = useState(null);

  // ✅ Always fetch on mount — no conditional guard
  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch, currentUser?._id, currentUser?.selectedClass]);

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
        <h1 className="text-3xl font-bold text-white">{t("studentSessions.title")}</h1>
        <p className="text-slate-400 mt-1">
          {t("studentSessions.subtitle")}
        </p>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center mb-4">
          <p className="text-red-400 text-sm mb-3">
            Failed to load sessions: {error}
          </p>
          <button
            onClick={() => dispatch(fetchSessions())}
            className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SessionSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && sessions.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            No Sessions Available
          </h3>
          <p className="text-slate-400">
            Your instructors haven't scheduled any sessions yet.
          </p>
        </div>
      )}

      {/* Session list */}
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