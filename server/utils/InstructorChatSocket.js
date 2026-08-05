/**
 * InstructorChatSocket.js
 * Socket.IO handler for real-time instructor ↔ student direct messaging.
 *
 * Room naming: `ichat:<conversationId>`
 *
 * Events (client → server):
 *   ic:join      { conversationId }
 *   ic:leave     { conversationId }
 *   ic:message   { conversationId, text, media: [{url,filename,mimeType,size}] }
 *   ic:typing    { conversationId, isTyping }
 *   ic:read      { conversationId }
 *
 * Events (server → client):
 *   ic:history   { messages: [...], conversation: {...} }
 *   ic:message   { message, conversationId }
 *   ic:typing    { userId, name, isTyping, conversationId }
 *   ic:read      { conversationId, readerId }
 *   ic:error     { message }
 */

import Conversation from "../models/instructorChat.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const { Types } = mongoose;

// ── Helpers ───────────────────────────────────────────────────────────────────

const room = (convId) => `ichat:${convId}`;

/** Verify the socket's user (attached by the auth middleware below) is a
 *  participant of the conversation — prevents cross-thread snooping. */
async function assertParticipant(userId, conversationId) {
  if (!Types.ObjectId.isValid(conversationId)) return null;
  const conv = await Conversation.findById(conversationId)
    .select("student instructor archived")
    .lean();
  if (!conv) return null;
  const uid = userId.toString();
  if (
    conv.student.toString() !== uid &&
    conv.instructor.toString() !== uid
  )
    return null;
  return conv;
}

// ── Socket auth middleware ────────────────────────────────────────────────────
// Reads the Bearer token / cookie attached by the existing HTTP auth flow and
// stamps socket.data.user so we know who is connected.
async function attachUser(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");
    const user = await User.findById(decoded.id || decoded._id)
      .select("_id name role avatarUrl")
      .lean();
    if (user) socket.data.user = user;
    next();
  } catch {
    next(); // Invalid token — connect unauthenticated, ic:join will reject
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

function registerInstructorChat(io) {
  // Scoped namespace keeps instructor chat events separate from session chat
  const ns = io.of("/ichat");

  ns.use(attachUser);

  ns.on("connection", (socket) => {
    const me = socket.data.user; // may be undefined for unauthenticated

    // ── ic:join ──────────────────────────────────────────────────────────────
    socket.on("ic:join", async ({ conversationId } = {}) => {
      if (!me) return socket.emit("ic:error", { message: "Not authenticated" });
      if (!conversationId)
        return socket.emit("ic:error", { message: "conversationId required" });

      const conv = await assertParticipant(me._id, conversationId);
      if (!conv)
        return socket.emit("ic:error", { message: "Not a participant" });

      socket.join(room(conversationId));

      // Mark messages as read and reset unread counter for this user
      try {
        const isStudent = conv.student.toString() === me._id.toString();
        const unreadField = isStudent ? "studentUnread" : "instructorUnread";
        const senderRole = isStudent ? "instructor" : "student";

        await Conversation.updateOne(
          { _id: conversationId },
          {
            $set: { [unreadField]: 0 },
            $addToSet: {
              "messages.$[msg].readBy": me._id,
            },
          },
          {
            arrayFilters: [
              {
                "msg.senderRole": senderRole,
                "msg.readBy": { $ne: me._id },
                "msg.deleted": false,
              },
            ],
          },
        );

        // Notify the other participant that messages were read
        socket.to(room(conversationId)).emit("ic:read", {
          conversationId,
          readerId: me._id.toString(),
        });
      } catch (e) {
        console.error("[InstructorChat] read-on-join failed:", e.message);
      }

      // Send last 80 messages as history
      try {
        const full = await Conversation.findById(conversationId)
          .populate("student",    "_id name avatarUrl")
          .populate("instructor", "_id name avatarUrl")
          .populate("course",     "_id title")
          .populate("messages.sender", "_id name avatarUrl")
          .lean();

        if (!full) return;

        const messages = full.messages
          .filter((m) => !m.deleted)
          .slice(-80);

        socket.emit("ic:history", {
          messages,
          conversation: {
            _id:        full._id,
            student:    full.student,
            instructor: full.instructor,
            course:     full.course,
            subject:    full.subject,
          },
        });
      } catch (e) {
        console.error("[InstructorChat] history fetch failed:", e.message);
        socket.emit("ic:history", { messages: [], conversation: null });
      }
    });

    // ── ic:message ───────────────────────────────────────────────────────────
    socket.on(
      "ic:message",
      async ({ conversationId, text = "", media = [] } = {}) => {
        if (!me)
          return socket.emit("ic:error", { message: "Not authenticated" });
        if (!conversationId)
          return socket.emit("ic:error", { message: "conversationId required" });
        if (!text?.trim() && (!Array.isArray(media) || media.length === 0))
          return socket.emit("ic:error", { message: "Message cannot be empty" });

        const conv = await assertParticipant(me._id, conversationId);
        if (!conv)
          return socket.emit("ic:error", { message: "Not a participant" });

        const isStudent = conv.student.toString() === me._id.toString();
        const senderRole = isStudent ? "student" : "instructor";

        // Sanitise media list
        const safeMedia = (Array.isArray(media) ? media : [])
          .filter((m) => m?.url)
          .slice(0, 5)
          .map((m) => ({
            url:      String(m.url).slice(0, 2000),
            filename: String(m.filename || "").slice(0, 255),
            mimeType: String(m.mimeType || "application/octet-stream").slice(0, 100),
            size:     Number(m.size) || 0,
          }));

        const newMsg = {
          sender:     me._id,
          senderRole,
          text:       text.trim().slice(0, 2000),
          media:      safeMedia,
          readBy:     [me._id],
          deleted:    false,
          createdAt:  new Date(),
          updatedAt:  new Date(),
        };

        // Increment unread counter for the OTHER participant
        const otherUnread = isStudent ? "instructorUnread" : "studentUnread";

        let saved;
        try {
          saved = await Conversation.findByIdAndUpdate(
            conversationId,
            {
              $push:    { messages: newMsg },
              $inc:     { [otherUnread]: 1 },
              $set: {
                "lastMessage.text":       text.trim().slice(0, 120),
                "lastMessage.at":         new Date(),
                "lastMessage.senderRole": senderRole,
                updatedAt:                new Date(),
              },
            },
            { new: true, select: "messages" },
          );
        } catch (e) {
          console.error("[InstructorChat] save failed:", e.message);
          return socket.emit("ic:error", { message: "Failed to save message" });
        }

        // Return the saved message (with _id) from the array tail
        const savedMsg = saved.messages[saved.messages.length - 1];

        // Populate sender inline (no extra query needed — we already know me)
        const payload = {
          conversationId,
          message: {
            ...savedMsg.toObject(),
            sender: {
              _id:       me._id,
              name:      me.name,
              avatarUrl: me.avatarUrl,
            },
          },
        };

        // Send to everyone ELSE in the room (sender gets it back via REST optimistic update)
        socket.to(room(conversationId)).emit("ic:message", payload);

        // Echo back to sender so both sides share the same persisted _id
        socket.emit("ic:message", payload);
      },
    );

    // ── ic:typing ────────────────────────────────────────────────────────────
    socket.on("ic:typing", async ({ conversationId, isTyping = false } = {}) => {
      if (!me || !conversationId) return;
      socket.to(room(conversationId)).emit("ic:typing", {
        conversationId,
        userId: me._id.toString(),
        name:   me.name,
        isTyping,
      });
    });

    // ── ic:read ──────────────────────────────────────────────────────────────
    socket.on("ic:read", async ({ conversationId } = {}) => {
      if (!me || !conversationId) return;
      const conv = await assertParticipant(me._id, conversationId);
      if (!conv) return;

      const isStudent = conv.student.toString() === me._id.toString();
      const unreadField = isStudent ? "studentUnread" : "instructorUnread";
      const senderRole  = isStudent ? "instructor" : "student";

      await Conversation.updateOne(
        { _id: conversationId },
        {
          $set: { [unreadField]: 0 },
          $addToSet: { "messages.$[msg].readBy": me._id },
        },
        {
          arrayFilters: [
            {
              "msg.senderRole": senderRole,
              "msg.readBy":     { $ne: me._id },
              "msg.deleted":    false,
            },
          ],
        },
      ).catch((e) =>
        console.error("[InstructorChat] ic:read update failed:", e.message),
      );

      socket.to(room(conversationId)).emit("ic:read", {
        conversationId,
        readerId: me._id.toString(),
      });
    });

    // ── ic:leave ─────────────────────────────────────────────────────────────
    socket.on("ic:leave", ({ conversationId } = {}) => {
      if (conversationId) socket.leave(room(conversationId));
    });
  });
}

export { registerInstructorChat };
