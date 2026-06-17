import express from "express";
import twilio from "twilio";
import User from "../models/user.model.js";

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioClient =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

// ── In-memory attempt store (swap for Redis in production) ───────────────────
const sessionStore = new Map();
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

// ── POST /api/auth/send-phone-otp ─────────────────────────────────────────────
router.post("/send-phone-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    if (!/^\+91\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        message: "Phone number must be in E.164 format (e.g. +919876543210).",
      });
    }

    const existing = await User.findOne({ phoneNumber });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Phone number is already in use." });
    }

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const existingSession = sessionStore.get(phoneNumber);
    if (existingSession?.attempts >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - existingSession.createdAt;
      if (elapsed < SESSION_TTL_MS) {
        return res.status(429).json({
          message: "Too many attempts. Please wait 10 minutes before retrying.",
        });
      }
    }

    if (!twilioClient || !verifyServiceSid) {
      return res.status(500).json({
        message: "Twilio Verify is not configured on the server.",
      });
    }

    // ── Send OTP via Twilio Verify API ───────────────────────────────────────
    await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    sessionStore.set(phoneNumber, {
      createdAt: Date.now(),
      attempts: 0,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (err) {
    console.error("send-phone-otp error:", err?.response?.data || err.message);
    return res
      .status(500)
      .json({ message: err.message || "Failed to send OTP." });
  }
});

// ── POST /api/auth/verify-phone-otp ──────────────────────────────────────────
router.post("/verify-phone-otp", async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res
        .status(400)
        .json({ message: "Phone number and OTP are required." });
    }

    const record = sessionStore.get(phoneNumber);

    if (!record) {
      return res
        .status(400)
        .json({ message: "No OTP found. Please request a new one." });
    }

    // ── Expired ───────────────────────────────────────────────────────────────
    if (Date.now() - record.createdAt > SESSION_TTL_MS) {
      sessionStore.delete(phoneNumber);
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // ── Too many wrong attempts ───────────────────────────────────────────────
    if (record.attempts >= MAX_ATTEMPTS) {
      sessionStore.delete(phoneNumber);
      return res.status(429).json({
        message: "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    if (!twilioClient || !verifyServiceSid) {
      return res.status(500).json({
        message: "Twilio Verify is not configured on the server.",
      });
    }

    // ── Verify the OTP using Twilio Verify API ───────────────────────────────
    const verification = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });

    if (verification.status !== "approved") {
      record.attempts += 1;
      sessionStore.set(phoneNumber, record);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${MAX_ATTEMPTS - record.attempts} attempts remaining.`,
      });
    }

    // ── Success ───────────────────────────────────────────────────────────────
    sessionStore.delete(phoneNumber);
    return res.status(200).json({
      success: true,
      message: "Phone number verified successfully.",
    });
  } catch (err) {
    console.error(
      "verify-phone-otp error:",
      err?.response?.data || err.message,
    );
    return res
      .status(500)
      .json({ message: err.message || "Verification failed." });
  }
});

export default router;
