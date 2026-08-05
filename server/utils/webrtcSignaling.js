/**
 * WebRTC Signaling — Socket.IO (ESM)
 * Handles SDP offer/answer and ICE relay for 1:1 instructor↔student calls.
 * Registered in server.js:  registerWebRTCSignaling(io)
 */

// In-memory session map: sessionId → { participants: Map<socketId, {userId,role}> }
const activeSessions = new Map();
const MAX_PARTICIPANTS = 2; // strictly 1:1

export function registerWebRTCSignaling(io) {
  io.on("connection", (socket) => {

    // ── Join ────────────────────────────────────────────────────────────────
    socket.on("webrtc:join-session", ({ sessionId, userId, role }) => {
      if (!sessionId || !userId)
        return socket.emit("webrtc:error", { message: "sessionId and userId are required" });

      let session = activeSessions.get(sessionId);
      if (!session) {
        session = { participants: new Map(), createdAt: Date.now() };
        activeSessions.set(sessionId, session);
      }

      if (
        session.participants.size >= MAX_PARTICIPANTS &&
        !session.participants.has(socket.id)
      ) {
        return socket.emit("webrtc:error", { message: "Session is full" });
      }

      socket.data.webrtcSessionId = sessionId;
      socket.data.webrtcUserId    = userId;
      socket.data.webrtcRole      = role;

      session.participants.set(socket.id, { userId, role });
      socket.join(`webrtc:${sessionId}`);

      // Inform existing peer; tell joiner who's already present
      socket.to(`webrtc:${sessionId}`).emit("webrtc:peer-joined", { userId, role });

      const others = [...session.participants.entries()].filter(([id]) => id !== socket.id);
      if (others.length > 0) {
        socket.emit("webrtc:peer-already-present", {
          peer: { userId: others[0][1].userId, role: others[0][1].role },
        });
      }
    });

    // ── SDP offer ───────────────────────────────────────────────────────────
    socket.on("webrtc:offer", ({ sessionId, offer }) => {
      socket.to(`webrtc:${sessionId}`).emit("webrtc:offer", {
        offer,
        from: socket.data.webrtcUserId,
      });
    });

    // ── SDP answer ──────────────────────────────────────────────────────────
    socket.on("webrtc:answer", ({ sessionId, answer }) => {
      socket.to(`webrtc:${sessionId}`).emit("webrtc:answer", {
        answer,
        from: socket.data.webrtcUserId,
      });
    });

    // ── ICE candidates ───────────────────────────────────────────────────────
    socket.on("webrtc:ice-candidate", ({ sessionId, candidate }) => {
      socket.to(`webrtc:${sessionId}`).emit("webrtc:ice-candidate", {
        candidate,
        from: socket.data.webrtcUserId,
      });
    });

    // ── Media-state (mute/camera) ────────────────────────────────────────────
    socket.on("webrtc:media-state", ({ sessionId, audioEnabled, videoEnabled }) => {
      socket.to(`webrtc:${sessionId}`).emit("webrtc:media-state", {
        from: socket.data.webrtcUserId,
        audioEnabled,
        videoEnabled,
      });
    });

    // ── Call request relay ───────────────────────────────────────────────────
    // Used by the chat UI to request a video call before opening the call page.
    // Room: ichat:<conversationId> (reuses the existing instructor-chat namespace room)
    socket.on("webrtc:call-request", ({ conversationId, from, fromName, fromRole }) => {
      socket.to(`ichat:${conversationId}`).emit("webrtc:call-request", {
        conversationId,
        from,
        fromName,
        fromRole,
      });
    });

    // Instructor approves the call request and initiates it.
    // This tells the student the call is starting — they see a ringing screen.
    socket.on("webrtc:call-initiated", ({ conversationId, sessionId }) => {
      socket.to(`ichat:${conversationId}`).emit("webrtc:call-initiated", { sessionId });
    });

    socket.on("webrtc:call-decline", ({ conversationId }) => {
      socket.to(`ichat:${conversationId}`).emit("webrtc:call-decline", { conversationId });
    });

    // ── Leave / cleanup ──────────────────────────────────────────────────────
    const leaveSession = () => {
      const sessionId = socket.data.webrtcSessionId;
      const userId    = socket.data.webrtcUserId;
      if (!sessionId) return;

      const session = activeSessions.get(sessionId);
      if (session) {
        session.participants.delete(socket.id);
        socket.to(`webrtc:${sessionId}`).emit("webrtc:peer-left", { userId });
        if (session.participants.size === 0) activeSessions.delete(sessionId);
      }
      socket.leave(`webrtc:${sessionId}`);
    };

    socket.on("webrtc:leave-session", leaveSession);
    socket.on("disconnect", leaveSession);
  });
}
