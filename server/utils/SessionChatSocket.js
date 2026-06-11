import mongoose from "mongoose";

// ─── Message Schema (optional — for persisting chat history) ────────────────
const sessionMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    sender: { type: String, required: true },
    senderId: { type: String },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true },
);

const SessionMessage =
  mongoose.models.SessionMessage ||
  mongoose.model("SessionMessage", sessionMessageSchema);

// ─── Socket.IO Handler ───────────────────────────────────────────────────────

function registerSessionChat(io) {
  // Namespace: /  (uses your default namespace)
  // All session chat events are prefixed with "session_"

  io.on("connection", (socket) => {
    // ── Join a session chat room ────────────────────────────────────────────
    socket.on("join_session_chat", async ({ sessionId }) => {
      if (!sessionId) return;

      const room = `session:${sessionId}`;
      socket.join(room);

      // Send last 50 messages to the newly joined student
      try {
        const history = await SessionMessage.find({ sessionId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        socket.emit("session_history", history.reverse());
      } catch (err) {
        console.error("[SessionChat] Failed to load history:", err.message);
        socket.emit("session_history", []);
      }
    });

    // ── Receive and broadcast a message ────────────────────────────────────
    socket.on(
      "session_message",
      async ({ sessionId, text, sender, senderId }) => {
        if (!sessionId || !text?.trim()) return;

        const room = `session:${sessionId}`;

        // Persist to DB
        let saved;
        try {
          saved = await SessionMessage.create({
            sessionId,
            sender: sender || "Anonymous",
            senderId,
            text: text.trim().slice(0, 500),
          });
        } catch (err) {
          console.error("[SessionChat] Failed to save message:", err.message);
          return;
        }

        // Broadcast to everyone in the room (including sender)
        io.to(room).emit("session_message", {
          _id: saved._id,
          sessionId: saved.sessionId,
          sender: saved.sender,
          senderId: saved.senderId,
          text: saved.text,
          createdAt: saved.createdAt,
        });
      },
    );

    // ── Leave a session chat room ───────────────────────────────────────────
    socket.on("leave_session_chat", ({ sessionId }) => {
      if (!sessionId) return;
      socket.leave(`session:${sessionId}`);
    });
  });
}

export { registerSessionChat, SessionMessage };
