import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useWebRTC } from "../../hooks/useWebRTC";

/**
 * Full-screen 1:1 video call component.
 *
 * <VideoCall
 *   sessionId="abc123"
 *   userId={currentUser._id}
 *   onCallEnded={() => navigate(-1)}
 * />
 */
export default function VideoCall({ sessionId, userId, onCallEnded }) {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const activeSessionId = sessionId || routeSessionId;
  const activeUserId = userId || user?._id;
  const handleCallEnded =
    onCallEnded ||
    (() =>
      navigate(
        user?.role === "instructor"
          ? "/instructor-dashboard"
          : "/student-dashboard",
      ));
  const {
    localVideoRef, remoteVideoRef,
    connectionState, audioEnabled, videoEnabled,
    remotePeer, error,
    toggleAudio, toggleVideo, endCall,
  } = useWebRTC({
    sessionId: activeSessionId,
    userId: activeUserId,
    onCallEnded: handleCallEnded,
  });

  return (
    <div className="relative flex flex-col h-screen bg-gray-900 overflow-hidden">

      {/* ── Status bar ── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <StatusBadge state={connectionState} />
        {remotePeer && (
          <span className="text-sm text-gray-200 bg-black/40 px-3 py-1 rounded-full capitalize">
            {remotePeer.role === "instructor" ? "📋 Instructor" : "🎓 Student"}
          </span>
        )}
      </div>

      {/* ── Remote video (full frame) ── */}
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-black"
        />

        {/* Waiting state */}
        {!remotePeer && connectionState === "connecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Waiting for the other participant…</p>
          </div>
        )}

        {/* Failed state */}
        {connectionState === "failed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-200">
            <p className="text-base font-semibold">
              {error ? `Call failed: ${error}` : "Connection failed"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition"
            >
              Retry
            </button>
            <button
              onClick={endCall}
              className="text-gray-400 hover:text-white text-xs underline"
            >
              Leave call
            </button>
          </div>
        )}

        {/* ── Local video PiP ── */}
        <div className="absolute bottom-24 right-4 w-36 h-24 sm:w-52 sm:h-36 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!videoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-400 text-xs">
              Camera off
            </div>
          )}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center justify-center gap-4 py-5 bg-gray-950/90 backdrop-blur-sm">
        <CtrlBtn onClick={toggleAudio} active={audioEnabled} label={audioEnabled ? "Mute" : "Unmute"}>
          {audioEnabled ? "🎤" : "🔇"}
        </CtrlBtn>

        <CtrlBtn onClick={toggleVideo} active={videoEnabled} label={videoEnabled ? "Stop video" : "Start video"}>
          {videoEnabled ? "📹" : "🚫"}
        </CtrlBtn>

        <button
          onClick={endCall}
          className="px-7 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition shadow-lg shadow-red-600/30"
        >
          End call
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CtrlBtn({ onClick, active, label, children }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-colors shadow-md ${
        active ? "bg-slate-700 hover:bg-slate-600" : "bg-red-600 hover:bg-red-500"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ state }) {
  const map = {
    idle:         { text: "Starting…",          dot: "bg-gray-400" },
    connecting:   { text: "Connecting…",        dot: "bg-yellow-400 animate-pulse" },
    connected:    { text: "Live",               dot: "bg-green-500 animate-pulse" },
    reconnecting: { text: "Reconnecting…",      dot: "bg-yellow-400 animate-pulse" },
    failed:       { text: "Connection failed",  dot: "bg-red-500" },
    ended:        { text: "Call ended",         dot: "bg-gray-400" },
  };
  const { text, dot } = map[state] || { text: state, dot: "bg-gray-400" };
  return (
    <span className="flex items-center gap-2 text-xs text-white bg-black/50 px-3 py-1.5 rounded-full">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {text}
    </span>
  );
}
