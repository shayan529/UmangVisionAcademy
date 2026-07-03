// controllers/settings.controller.js

import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendOtpEmail } from "../utils/Mailer.js"; // adjust path if needed
import {
  deleteOtpRecord,
  getOtpRecord,
  setOtpRecord,
  updateOtpRecord,
} from "../utils/otpStore.js";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN = 60 * 1000; // 60 seconds between resends

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const verifyStoredOtp = async (key, otp) => {
  const record = await getOtpRecord(key);

  if (!record) {
    return {
      ok: false,
      message: "OTP not found or already used. Please request a new one.",
    };
  }
  if (Date.now() > record.expiresAt) {
    await deleteOtpRecord(key);
    return { ok: false, message: "OTP has expired. Please request a new one." };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await deleteOtpRecord(key);
    return {
      ok: false,
      message: "Too many incorrect attempts. Please request a new OTP.",
    };
  }
  if (record.otp !== otp) {
    await updateOtpRecord(key, { attempts: record.attempts + 1 });
    const remaining = MAX_ATTEMPTS - (record.attempts + 1);
    return {
      ok: false,
      message: `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  await deleteOtpRecord(key); // one-time use
  return { ok: true };
};

// ── Existing controllers ──────────────────────────────────────────────────────

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -resetPasswordToken -resetPasswordExpires",
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      bio,
      phoneNumber,
      city,
      state,
      avatarUrl,
      specialization,
      notificationSettings,
      fatherName,
      motherName,
      fullAddress,
      socialMediaAccount,
      fatherMobileNumber,
      reference,
      vidhansabha,
      vidhansaba,
    } = req.body;

    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ message: "Email is already in use by another account." });
      }
    }

    const updates = {
      name,
      email,
      bio,
      phoneNumber,
      city,
      state,
      avatarUrl,
      specialization,
      notificationSettings,
      fatherName,
      motherName,
      fullAddress,
      socialMediaAccount,
      fatherMobileNumber,
      reference,
      vidhansabha: vidhansabha ?? vidhansaba,
    };

    const definedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    );

    const user = await User.findByIdAndUpdate(req.user._id, definedUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Email change OTP ──────────────────────────────────────────────────────────

/**
 * POST /api/settings/send-email-otp
 * Body: { newEmail }
 * Sends an OTP to the NEW email address to confirm ownership.
 */
export const sendEmailOtp = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ message: "New email is required." });
    }

    // Basic format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    // Prevent changing to the same email
    const currentUser = await User.findById(req.user._id);
    if (currentUser.email === newEmail) {
      return res
        .status(400)
        .json({ message: "New email is the same as your current email." });
    }

    // Check if the new email is already taken by another account
    const existing = await User.findOne({ email: newEmail });
    if (existing) {
      return res
        .status(409)
        .json({ message: "This email is already in use by another account." });
    }

    // Resend cooldown — key is userId:email-change:newEmail
    const storeKey = `${req.user._id}:email-change:${newEmail}`;
    const current = await getOtpRecord(storeKey);
    if (current) {
      const elapsed = Date.now() - (current.expiresAt - OTP_TTL_MS);
      if (elapsed < RESEND_COOLDOWN) {
        const wait = Math.ceil((RESEND_COOLDOWN - elapsed) / 1000);
        return res.status(429).json({
          message: `Please wait ${wait}s before requesting a new OTP.`,
        });
      }
    }

    const otp = generateOtp();
    await setOtpRecord(
      storeKey,
      {
        otp,
        attempts: 0,
        lastSentAt: Date.now(),
      },
      OTP_TTL_MS,
    );

    await sendOtpEmail(newEmail, otp); // sends branded email via nodemailer

    console.log(
      `📧 Email-change OTP sent to ${newEmail} for user ${req.user._id}`,
    );
    res.json({ message: "OTP sent to your new email address." });
  } catch (error) {
    console.error("sendEmailOtp error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

/**
 * POST /api/settings/verify-email-otp
 * Body: { newEmail, otp }
 * Verifies the OTP and updates the user's email.
 */
export const verifyEmailOtp = async (req, res) => {
  try {
    const { newEmail, otp } = req.body;

    if (!newEmail || !otp) {
      return res
        .status(400)
        .json({ message: "New email and OTP are required." });
    }

    const storeKey = `${req.user._id}:email-change:${newEmail}`;
    const result = await verifyStoredOtp(storeKey, otp);

    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    // OTP valid — update email
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { email: newEmail },
      { new: true, runValidators: true },
    ).select("-password");

    console.log(`✅ Email updated for user ${req.user._id}: ${newEmail}`);
    res.json({ message: "Email updated successfully.", user });
  } catch (error) {
    console.error("verifyEmailOtp error:", error);
    res
      .status(500)
      .json({ message: "Failed to verify OTP. Please try again." });
  }
};

// ── Password change OTP ───────────────────────────────────────────────────────

/**
 * POST /api/settings/send-password-otp
 * No body needed — sends OTP to the user's CURRENT email as a 2FA step
 * before allowing the password to be changed.
 */
export const sendPasswordOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Resend cooldown — key is userId:password-change
    const storeKey = `${req.user._id}:password-change`;
    const current = await getOtpRecord(storeKey);
    if (current) {
      const elapsed = Date.now() - (current.expiresAt - OTP_TTL_MS);
      if (elapsed < RESEND_COOLDOWN) {
        const wait = Math.ceil((RESEND_COOLDOWN - elapsed) / 1000);
        return res.status(429).json({
          message: `Please wait ${wait}s before requesting a new OTP.`,
        });
      }
    }

    const otp = generateOtp();
    await setOtpRecord(
      storeKey,
      {
        otp,
        attempts: 0,
        lastSentAt: Date.now(),
      },
      OTP_TTL_MS,
    );

    await sendOtpEmail(user.email, otp);

    console.log(
      `📧 Password-change OTP sent to ${user.email} for user ${req.user._id}`,
    );
    res.json({ message: "OTP sent to your email address." });
  } catch (error) {
    console.error("sendPasswordOtp error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

/**
 * POST /api/settings/verify-password-otp
 * Body: { otp }
 * Verifies the OTP only — the actual password change is done by
 * the existing changePassword controller immediately after on the frontend.
 */
export const verifyPasswordOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required." });
    }

    const storeKey = `${req.user._id}:password-change`;
    const result = await verifyStoredOtp(storeKey, otp);

    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    console.log(`✅ Password-change OTP verified for user ${req.user._id}`);
    res.json({
      success: true,
      message: "OTP verified. Proceed to change password.",
    });
  } catch (error) {
    console.error("verifyPasswordOtp error:", error);
    res
      .status(500)
      .json({ message: "Failed to verify OTP. Please try again." });
  }
};
