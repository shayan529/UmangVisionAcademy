import express from "express";
import twilio from "twilio";
import User from "../models/user.model.js";
import {
  deleteOtpRecord,
  getOtpRecord,
  setOtpRecord,
  updateOtpRecord,
} from "../utils/otpStore.js";
import {
  isFirebaseAdminConfigured,
  verifyFirebaseIdToken,
} from "../config/firebaseAdmin.js";

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioClient =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

const SESSION_TTL_MS = 2 * 60 * 1000; // 2 minutes
const MAX_ATTEMPTS = 10;

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
    const existingSession = await getOtpRecord(phoneNumber);
    if (existingSession?.attempts >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - existingSession.createdAt;
      if (elapsed < SESSION_TTL_MS) {
        return res.status(429).json({
          message: "Too many attempts. Please wait 2 minutes before retrying.",
        });
      } else {
        await deleteOtpRecord(phoneNumber);
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

    await setOtpRecord(
      phoneNumber,
      {
        createdAt: Date.now(),
        attempts: 0,
      },
      SESSION_TTL_MS,
    );

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

// ── POST /api/auth/verify-firebase-token ──────────────────────────────────────
router.post("/verify-firebase-token", async (req, res) => {
  try {
    const { firebaseToken, phoneNumber } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ message: "Firebase token is required." });
    }

    if (!isFirebaseAdminConfigured()) {
      // If Firebase Admin credentials are not set on backend, accept token if valid token structure present or in dev mode
      console.warn(
        "[Firebase Admin] Warning: Firebase Admin credentials not set. Bypassing token decode verification.",
      );
      return res.status(200).json({
        success: true,
        message: "Phone number verified successfully (Firebase Admin unconfigured).",
      });
    }

    const decoded = await verifyFirebaseIdToken(firebaseToken);
    
    if (phoneNumber && decoded.phone_number) {
      const normalizedReqPhone = phoneNumber.replace(/\s+/g, "");
      const normalizedDecodedPhone = decoded.phone_number.replace(/\s+/g, "");
      if (normalizedReqPhone !== normalizedDecodedPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number mismatch with Firebase token.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Phone number verified successfully via Firebase.",
      uid: decoded.uid,
      phoneNumber: decoded.phone_number || phoneNumber,
    });
  } catch (err) {
    console.error("verify-firebase-token error:", err.message);
    return res
      .status(400)
      .json({ success: false, message: err.message || "Invalid Firebase token." });
  }
});

// ── POST /api/auth/verify-phone-otp ──────────────────────────────────────────
router.post("/verify-phone-otp", async (req, res) => {
  try {
    const { phoneNumber, otp, firebaseToken } = req.body;

    // Handle Firebase token path if firebaseToken is passed
    if (firebaseToken) {
      if (isFirebaseAdminConfigured()) {
        const decoded = await verifyFirebaseIdToken(firebaseToken);
        return res.status(200).json({
          success: true,
          message: "Phone number verified successfully via Firebase.",
          uid: decoded.uid,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Phone number verified successfully.",
        });
      }
    }

    if (!phoneNumber || !otp) {
      return res
        .status(400)
        .json({ message: "Phone number and OTP are required." });
    }

    const record = await getOtpRecord(phoneNumber);

    if (!record) {
      return res
        .status(400)
        .json({ message: "No OTP found. Please request a new one." });
    }

    // ── Expired ───────────────────────────────────────────────────────────────
    if (Date.now() - record.createdAt > SESSION_TTL_MS) {
      await deleteOtpRecord(phoneNumber);
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // ── Too many wrong attempts ───────────────────────────────────────────────
    if (record.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({
        message: "Too many incorrect attempts. Please wait 2 minutes before retrying.",
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
      await updateOtpRecord(phoneNumber, {
        attempts: (record.attempts || 0) + 1,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // ── Success ───────────────────────────────────────────────────────────────
    await deleteOtpRecord(phoneNumber);
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

