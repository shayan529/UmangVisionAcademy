import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
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

// ─── Chat Panel ───────────────────────────────────────────────────────────────

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
        reconnectionAttempts: 5,
        timeout: 10000,
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
      sender: currentUser?.name || "You",
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full lg:h-[480px]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
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
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          ⚠️ {error}
        </div>
      )}

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        {messages.length === 0 && (
          <p className="text-slate-500 text-xs text-center mt-8">
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
                className={`max-w-[70%] px-3 py-2 rounded-xl text-sm leading-relaxed break-words ${
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
      </div>

      <div className="px-4 py-3 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            connected ? "Send a message…" : "Type a message (connecting…)"
          }
          maxLength={500}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !connected}
          title={!connected ? "Waiting for chat connection…" : undefined}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Send
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
          },
          onStateChange: (e) => {
            if (destroyed) return;
            setPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.PLAYING) {
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
    playing ? p.pauseVideo() : p.playVideo();
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
    >
      {/* The actual YouTube iframe gets mounted into this div by the Player API */}
      <div className="absolute inset-0 pointer-events-none">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Click-catcher: sits above the iframe and intercepts every mouse
          event so hover/move/click never reaches YouTube's player chrome.
          A single click toggles play/pause, mirroring native behavior. */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="absolute inset-0 w-full h-full bg-transparent cursor-pointer z-10"
      />

      {/* YouTube draws its own chrome (share/link icon bottom-left, YouTube
          wordmark bottom-right) over the video whenever it's paused, and
          for live broadcasts it also keeps the wordmark up while playing.
          A single static corner box can't catch all of this because the
          icons appear in different corners depending on state. Instead we
          cover the full width of the bottom strip whenever the native
          chrome would be visible (paused, or live), and rely on our own
          control bar / play-glyph rendered on top for the actual UI.
          pointer-events-none throughout so clicks still reach the
          click-catcher beneath. */}
      {(!playing || isLive) && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-black pointer-events-none z-20" />
      )}

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-purple-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Center play/pause & skip 10s controls, shown briefly on hover or while paused */}
      {ready && (!playing || hovering) && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity z-30"
        >
          <div
            className="flex items-center gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Backward 10s */}
            {!isLive && (
              <button
                onClick={() => seekOffset(-10)}
                className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 hover:scale-110 transition cursor-pointer text-white border border-slate-700/50"
                title="Backward 10 seconds"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
                </svg>
              </button>
            )}

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 hover:scale-110 transition cursor-pointer text-white border border-slate-700/50"
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Forward 10s */}
            {!isLive && (
              <button
                onClick={() => seekOffset(10)}
                className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 hover:scale-110 transition cursor-pointer text-white border border-slate-700/50"
                title="Forward 10 seconds"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
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
          className={`absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-200 z-30 ${
            hovering ? "opacity-100" : "opacity-0"
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
              className="w-20 h-1.5 rounded-full accent-purple-500 cursor-pointer flex-none"
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

const SessionCard = ({ session, onJoin, showToast }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-3 h-3 rounded-full ${
              session.status === "live"
                ? "bg-green-500 animate-pulse"
                : session.status === "ended"
                  ? "bg-slate-500"
                  : "bg-purple-500"
            }`}
          />
          <h3 className="text-lg font-semibold text-white">{session.title}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              session.status === "live"
                ? "bg-green-500/20 text-green-400"
                : session.status === "ended"
                  ? "bg-slate-500/20 text-slate-300"
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
          {session.status === "ended" ? "Replay Session" : "Join Session"}
        </button>
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

const StudentSessions = ({ showToast, currentUser }) => {
  const dispatch = useDispatch();

  // ✅ Correct selector — slice name is "sessions", state shape is { sessions: [], loading, error }
  const sessions = useSelector((state) => state.sessions.sessions);
  const loading = useSelector((state) => state.sessions.loading);
  const error = useSelector((state) => state.sessions.error);

  const [activeSession, setActiveSession] = useState(null);

  // ✅ Always fetch on mount — no conditional guard
  useEffect(() => {
    dispatch(fetchSessions());
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
