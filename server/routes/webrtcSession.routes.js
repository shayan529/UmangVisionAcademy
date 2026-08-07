/**
 * REST endpoint: mints short-lived TURN credentials.
 * Mounted at: /api/webrtc
 *
 * GET /api/webrtc/session/:sessionId/credentials
 *   → { iceServers, role }
 *
 * GET /api/webrtc/call-token/:conversationId
 *   → { sessionId }   — generates/returns a unique call session ID for a
 *     given instructor-chat conversation so both sides join the same room.
 */

import express from "express";
import crypto  from "crypto";
import { protect } from "../middleware/auth.middleware.js";
import Session from "../models/session.model.js";
import InstructorCallRequest from "../models/instructorCallRequest.model.js";

const router = express.Router();
router.use(protect);

const TURN_SECRET = process.env.TURN_STATIC_AUTH_SECRET;
const TURN_HOST   = process.env.TURN_HOST || "turn.yourdomain.com";
const CRED_TTL    = 3600; // 1 hour

function mintTurnCredentials(userId) {
  const expires     = Math.floor(Date.now() / 1000) + CRED_TTL;
  const turnUser    = `${expires}:${userId}`;
  const hmac        = crypto.createHmac("sha1", TURN_SECRET || "dev-secret");
  hmac.update(turnUser);
  const credential  = hmac.digest("base64");
  return { username: turnUser, credential };
}

function buildIceServers(creds) {
  const servers = [{ urls: `stun:${TURN_HOST}:3478` }];
  if (TURN_SECRET) {
    servers.push({
      urls:       [`turn:${TURN_HOST}:3478`, `turns:${TURN_HOST}:5349`],
      username:   creds.username,
      credential: creds.credential,
    });
  }
  return servers;
}

const buildInstructorCallSessionId = (conversationId) =>
  crypto
    .createHash("sha256")
    .update(String(conversationId))
    .digest("hex")
    .slice(0, 24);

// ── GET /api/webrtc/session/:sessionId/credentials ───────────────────────────
// Used when joining a scheduled live session (Session model).
router.get("/session/:sessionId/credentials", async (req, res) => {
  try {
    const uid = req.user._id.toString();

    // Ask-Instructor calls use a deterministic hash of the conversation ID,
    // rather than an entry in the scheduled Session collection.
    const approvedCalls = await InstructorCallRequest.find({
      status: "approved",
      $or: [{ student: req.user._id }, { instructor: req.user._id }],
    })
      .select("conversation student instructor")
      .lean();
    const instructorCall = approvedCalls.find(
      (call) =>
        buildInstructorCallSessionId(call.conversation) === req.params.sessionId,
    );

    if (instructorCall) {
      const role =
        instructorCall.instructor.toString() === uid ? "instructor" : "student";
      const creds = mintTurnCredentials(uid);
      return res.json({ iceServers: buildIceServers(creds), role });
    }

    const session = await Session.findById(req.params.sessionId)
      .select("instructor date time")
      .lean();

    if (!session)
      return res.status(404).json({ message: "Session not found" });

    const instructorId = session.instructor?.toString();

    // For 1:1 calls we allow the instructor or any enrolled student.
    // Student access is trust-based here — the call link is shared only via
    // the chat, which is already auth-gated.
    const isInstructor = instructorId === uid;
    const role         = isInstructor ? "instructor" : "student";

    const creds = mintTurnCredentials(uid);
    res.json({ iceServers: buildIceServers(creds), role });
  } catch (err) {
    console.error("[webrtc] credentials error:", err);
    res.status(500).json({ message: "Could not generate call credentials" });
  }
});

// ── GET /api/webrtc/call-token/:conversationId ───────────────────────────────
// Generates a stable call-session ID for a given chat conversation so that
// the student's "Request video call" and the instructor's "Join call" both
// navigate to the same WebRTC room.
// Session ID = deterministic hash of conversationId so it's idempotent.
router.get("/call-token/:conversationId", (req, res) => {
  const { conversationId } = req.params;
  const uid = req.user._id.toString();
  // Stable, collision-resistant session identifier
  const sessionId = crypto
    .createHash("sha256")
    .update(`${conversationId}`)
    .digest("hex")
    .slice(0, 24);

  const creds = mintTurnCredentials(uid);
  res.json({
    sessionId,
    iceServers: buildIceServers(creds),
    role: "student", // front-end ignores this; role is determined by socket join order
  });
});

export default router;
