/**
 * useWebRTC — 1:1 call lifecycle hook.
 *
 * Usage:
 *   const {
 *     localVideoRef, remoteVideoRef, connectionState,
 *     toggleAudio, toggleVideo, endCall, audioEnabled, videoEnabled,
 *   } = useWebRTC({ sessionId, userId, onCallEnded });
 *
 * TURN credentials and socket URL are derived from the project's existing
 * API_BASE_URL and SOCKET_URL constants so no extra env vars are needed.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { io }                                        from "socket.io-client";
import { API_BASE_URL, SOCKET_URL }                  from "../config/api.js";

export function useWebRTC({ sessionId, userId, onCallEnded }) {
  const pcRef               = useRef(null);
  const socketRef           = useRef(null);
  const localStreamRef      = useRef(null);
  const localVideoRef       = useRef(null);
  const remoteVideoRef      = useRef(null);
  const pendingCandidates   = useRef([]);
  const isInitiator         = useRef(false);

  const [connectionState, setConnectionState] = useState("idle");
  const [audioEnabled,    setAudioEnabled]    = useState(true);
  const [videoEnabled,    setVideoEnabled]    = useState(true);
  const [remotePeer,      setRemotePeer]      = useState(null);
  const [error,           setError]           = useState(null);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    if (socketRef.current) {
      socketRef.current.emit("webrtc:leave-session", { sessionId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [sessionId]);

  const endCall = useCallback(() => {
    cleanup();
    setConnectionState("ended");
    onCallEnded?.();
  }, [cleanup, onCallEnded]);

  // ── Media toggles ──────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setAudioEnabled(track.enabled);
    socketRef.current?.emit("webrtc:media-state", {
      sessionId, audioEnabled: track.enabled, videoEnabled,
    });
  }, [sessionId, videoEnabled]);

  const toggleVideo = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoEnabled(track.enabled);
    socketRef.current?.emit("webrtc:media-state", {
      sessionId, audioEnabled, videoEnabled: track.enabled,
    });
  }, [sessionId, audioEnabled]);

  // ── Main setup effect ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !userId) return;
    let cancelled = false;

    async function flushCandidates(pc) {
      const queued = pendingCandidates.current.splice(0);
      for (const c of queued) {
        try { await pc.addIceCandidate(c); }
        catch (e) { console.warn("[WebRTC] queued ICE candidate failed:", e); }
      }
    }

    async function setup() {
      try {
        setConnectionState("connecting");
        setError(null);

        // 1. Fetch TURN credentials from the project's own backend
        const token = localStorage.getItem("authToken");
        const credRes = await fetch(
          `${API_BASE_URL}/webrtc/session/${sessionId}/credentials`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        // If credentials endpoint fails (e.g. TURN not configured) still
        // proceed with STUN-only — best-effort for LAN/same-network calls.
        const { iceServers = [{ urls: "stun:stun.l.google.com:19302" }], role = "student" } =
          credRes.ok ? await credRes.json() : {};

        if (cancelled) return;

        // 2. Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // 3. RTCPeerConnection
        const pc = new RTCPeerConnection({ iceServers });
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (e) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        };

        pc.onconnectionstatechange = () => {
          if (cancelled) return;
          const s = pc.connectionState;
          if (s === "connected")                         setConnectionState("connected");
          else if (s === "disconnected")                 setConnectionState("reconnecting");
          else if (s === "failed" || s === "closed")     setConnectionState("failed");
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socketRef.current?.emit("webrtc:ice-candidate", { sessionId, candidate: e.candidate });
          }
        };

        // 4. Signaling socket — reuse the project's SOCKET_URL
        const socket = io(SOCKET_URL, {
          auth: { token },
          transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.emit("webrtc:join-session", { sessionId, userId, role });

        socket.on("webrtc:peer-already-present", async ({ peer }) => {
          setRemotePeer(peer);
          isInitiator.current = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:offer", { sessionId, offer });
        });

        socket.on("webrtc:peer-joined", ({ userId: pid, role: pr }) => {
          setRemotePeer({ userId: pid, role: pr });
        });

        socket.on("webrtc:offer", async ({ offer }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await flushCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc:answer", { sessionId, answer });
        });

        socket.on("webrtc:answer", async ({ answer }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushCandidates(pc);
        });

        socket.on("webrtc:ice-candidate", async ({ candidate }) => {
          if (!pc.remoteDescription) {
            pendingCandidates.current.push(candidate);
            return;
          }
          try { await pc.addIceCandidate(candidate); }
          catch (e) { console.warn("[WebRTC] ICE candidate failed:", e); }
        });

        socket.on("webrtc:peer-left", () => {
          setRemotePeer(null);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });

        socket.on("webrtc:error", ({ message }) => {
          setError(message);
          setConnectionState("failed");
        });

      } catch (err) {
        console.error("[WebRTC] setup failed:", err);
        if (!cancelled) {
          setError(err.message || "Failed to start call");
          setConnectionState("failed");
        }
      }
    }

    setup();
    return () => { cancelled = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userId]);

  return {
    localVideoRef, remoteVideoRef,
    connectionState, audioEnabled, videoEnabled,
    remotePeer, error,
    toggleAudio, toggleVideo, endCall,
  };
}
