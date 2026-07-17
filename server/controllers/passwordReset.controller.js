// controllers/passwordResetController.js
import crypto from "crypto";
import bcrypt from "bcryptjs";
import twilio from "twilio";
import User from "../models/user.model.js";
import {
  deleteOtpRecord,
  getOtpRecord,
  setOtpRecord,
  updateOtpRecord,
} from "../utils/otpStore.js";
import { notificationsQueue } from "../utils/queue.js";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioClient =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5; // wrong guesses before lockout

const sendOtpEmail = async (email, otp, name = "") => {
  const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0B1120;font-family:'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:40px 20px;">
            <table width="500" cellpadding="0" cellspacing="0"
              style="background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(99,179,237,.15);border-radius:20px;overflow:hidden;">
              <!-- Header bar -->
              <tr><td style="height:3px;background:linear-gradient(90deg,#38bdf8,#6366f1);"></td></tr>
              <tr><td style="padding:36px 40px 28px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#38bdf8;">
                  Password Reset
                </p>
                <h1 style="margin:0 0 20px;font-size:26px;font-weight:900;color:#f1f5f9;">
                  Your OTP Code
                </h1>
                <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.6;">
                  Hi${name ? " " + name : ""},<br/>
                  Use the OTP below to reset your password. It expires in <strong style="color:#e2e8f0;">10 minutes</strong>.
                </p>

                <!-- OTP box -->
                <div style="text-align:center;margin:0 0 28px;">
                  <div style="display:inline-block;background:rgba(14,165,233,.1);border:1.5px solid rgba(56,189,248,.35);border-radius:16px;padding:18px 40px;">
                    <span style="font-size:38px;font-weight:900;letter-spacing:12px;color:#38bdf8;font-family:monospace;">
                      ${otp}
                    </span>
                  </div>
                </div>

                <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-align:center;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </td></tr>
              <tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,.06);">
                <p style="margin:0;font-size:11px;color:#475569;text-align:center;">
                  © ${new Date().getFullYear()} Umang Vision Academy. All rights reserved.
                </p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

  await notificationsQueue.add(`email-reset-${email}-${Date.now()}`, {
    type: "email-raw",
    to: email,
    subject: "Password Reset OTP",
    html,
  });
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
// Body: { email }
export const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!email) return res.status(400).json({ message: "Email is required" });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email. Please sign up first.",
      });
    }

    // Resend cooldown
    const existing = await getOtpRecord(email);
    if (existing) {
      const sinceLastSent = Date.now() - existing.lastSentAt;
      if (sinceLastSent < RESEND_COOLDOWN) {
        const wait = Math.ceil((RESEND_COOLDOWN - sinceLastSent) / 1000);
        return res
          .status(429)
          .json({ message: `Please wait ${wait}s before resending.` });
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

    await sendOtpEmail(email, otp, user.name);

    res.json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error("sendResetOtp error:", err);
    res.status(500).json({ message: "Failed to send OTP. Try again." });
  }
};

// ── POST /api/auth/verify-reset-otp ──────────────────────────────────────────
// Body: { email, otp }
// Returns a short-lived reset token on success
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required" });

    const record = await getOtpRecord(email);
    if (!record)
      return res
        .status(400)
        .json({ message: "No OTP requested. Please request one first." });

    if (Date.now() > record.expiresAt) {
      await deleteOtpRecord(email);
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await deleteOtpRecord(email);
      return res.status(429).json({
        message: "Too many wrong attempts. Please request a new OTP.",
      });
    }

    if (record.otp !== otp.trim()) {
      await updateOtpRecord(email, { attempts: record.attempts + 1 });
      const left = MAX_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({
        message: `Incorrect OTP. ${left} attempt${left !== 1 ? "s" : ""} remaining.`,
      });
    }

    // OTP correct — issue a one-time reset token (valid 15 min)
    const resetToken = crypto.randomBytes(32).toString("hex");
    record.resetToken = resetToken;
    record.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    record.verified = true;

    const remainingMs = record.expiresAt
      ? record.expiresAt - Date.now()
      : OTP_TTL_MS;
    await setOtpRecord(email, record, Math.max(0, remainingMs));

    res.json({ message: "OTP verified.", resetToken });
  } catch (err) {
    console.error("verifyResetOtp error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── POST /api/auth/forgot-password-phone ──────────────────────────────────────
// Body: { phoneNumber }
export const sendResetOtpPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (!/^\+91\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        message: "Phone number must be in E.164 format (e.g. +919876543210).",
      });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({
        message: "No account found with this phone number. Please sign up first.",
      });
    }

    // Resend cooldown check
    const existing = await getOtpRecord(phoneNumber);
    if (existing) {
      const sinceLastSent = Date.now() - existing.lastSentAt;
      if (sinceLastSent < RESEND_COOLDOWN) {
        const wait = Math.ceil((RESEND_COOLDOWN - sinceLastSent) / 1000);
        return res
          .status(429)
          .json({ message: `Please wait ${wait}s before resending.` });
      }
    }

    if (!twilioClient || !verifyServiceSid) {
      return res.status(500).json({
        message: "Twilio Verify is not configured on the server.",
      });
    }

    // Send OTP via Twilio Verify
    await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    await setOtpRecord(
      phoneNumber,
      {
        attempts: 0,
        lastSentAt: Date.now(),
      },
      OTP_TTL_MS,
    );

    res.json({ message: "OTP sent to your phone." });
  } catch (err) {
    console.error("sendResetOtpPhone error:", err);
    res.status(500).json({ message: "Failed to send OTP. Try again." });
  }
};

// ── POST /api/auth/verify-reset-phone-otp ────────────────────────────────────
// Body: { phoneNumber, otp }
// Returns a short-lived reset token on success
export const verifyResetOtpPhone = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: "Phone number and OTP required" });
    }

    const record = await getOtpRecord(phoneNumber);
    if (!record) {
      return res
        .status(400)
        .json({ message: "No OTP requested. Please request one first." });
    }

    if (Date.now() > record.expiresAt) {
      await deleteOtpRecord(phoneNumber);
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await deleteOtpRecord(phoneNumber);
      return res.status(429).json({
        message: "Too many wrong attempts. Please request a new OTP.",
      });
    }

    if (!twilioClient || !verifyServiceSid) {
      return res.status(500).json({
        message: "Twilio Verify is not configured on the server.",
      });
    }

    // Verify the OTP via Twilio Verify
    const verification = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });

    if (verification.status !== "approved") {
      await updateOtpRecord(phoneNumber, { attempts: record.attempts + 1 });
      const left = MAX_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({
        message: `Incorrect OTP. ${left} attempt${left !== 1 ? "s" : ""} remaining.`,
      });
    }

    // OTP correct — issue a one-time reset token (valid 15 min)
    const resetToken = crypto.randomBytes(32).toString("hex");
    record.resetToken = resetToken;
    record.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    record.verified = true;

    const remainingMs = record.expiresAt ? record.expiresAt - Date.now() : OTP_TTL_MS;
    await setOtpRecord(phoneNumber, record, Math.max(0, remainingMs));

    res.json({ message: "OTP verified.", resetToken });
  } catch (err) {
    console.error("verifyResetOtpPhone error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
// Body: { email, phoneNumber, resetToken, newPassword }
export const resetPassword = async (req, res) => {
  try {
    const { email, phoneNumber, resetToken, newPassword } = req.body;
    const identifier = email ? email.toLowerCase() : phoneNumber;
    if (!identifier || !resetToken || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const record = await getOtpRecord(identifier);
    if (!record?.verified || record.resetToken !== resetToken) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset session. Start over." });
    }
    if (Date.now() > record.resetTokenExpiry) {
      await deleteOtpRecord(identifier);
      return res
        .status(400)
        .json({ message: "Reset session expired. Start over." });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    const query = email ? { email: email.toLowerCase() } : { phoneNumber };
    await User.findOneAndUpdate(query, { password: hashed });

    await deleteOtpRecord(identifier);

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
