import express from "express";
import crypto from "crypto";
import { sendOtpEmail } from "../utils/Mailer.js"; // adjust path as needed
import User from "../models/user.model.js"; // adjust path as needed
import {
  deleteOtpRecord,
  getOtpRecord,
  setOtpRecord,
  updateOtpRecord,
} from "../utils/otpStore.js";

const router = express.Router();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5; // lock out after 5 wrong guesses

// ── POST /api/auth/send-otp ──────────────────────────────────────────────────
router.post("/send-email-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Block if email is already registered
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email is already in use." });
    }

    // Rate-limit: don't allow a new OTP within 60 seconds of the last one
    const current = await getOtpRecord(email);
    if (current) {
      const secondsLeft = Math.ceil((current.expiresAt - Date.now()) / 1000);
      const cooldownLeft = OTP_TTL_MS / 1000 - secondsLeft;
      if (cooldownLeft < 60) {
        return res.status(429).json({
          message: `Please wait ${60 - Math.floor(cooldownLeft)}s before requesting a new OTP.`,
        });
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    await setOtpRecord(
      email,
      {
        otp,
        attempts: 0,
        lastSentAt: Date.now(),
      },
      OTP_TTL_MS,
    );

    await sendOtpEmail(email, otp);

    return res.json({ message: "OTP sent successfully." });
  } catch (err) {
    console.error("send-otp error:", err);
    return res
      .status(500)
      .json({ message: "Failed to send OTP. Please try again." });
  }
});

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────
router.post("/verify-email-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const record = await getOtpRecord(email);

    if (!record) {
      return res.status(400).json({
        message: "OTP not found or already used. Please request a new one.",
      });
    }

    if (Date.now() > record.expiresAt) {
      await deleteOtpRecord(email);
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // Brute-force guard
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await deleteOtpRecord(email);
      return res.status(429).json({
        message: "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    if (record.otp !== otp) {
      await updateOtpRecord(email, { attempts: record.attempts + 1 });
      const remaining = MAX_OTP_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({
        message: `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      });
    }

    // ✅ Correct — delete immediately (one-time use)
    await deleteOtpRecord(email);
    return res.json({ success: true });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res
      .status(500)
      .json({ message: "Verification failed. Please try again." });
  }
});

export default router;
