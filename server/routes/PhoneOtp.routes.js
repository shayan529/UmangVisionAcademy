import express from 'express';
import axios from 'axios';
import User from '../models/user.model.js';

const router = express.Router();

// ── In-memory session store (swap for Redis in production) ────────────────────
// Stores 2Factor session IDs keyed by phoneNumber
const sessionStore = new Map();

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizePhoneForTwoFactor = (phoneNumber) =>
  encodeURIComponent(
    phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`
  );

// ── POST /api/auth/send-phone-otp ─────────────────────────────────────────────
router.post('/send-phone-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }

    if (!/^\+91\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        message: 'Phone number must be in E.164 format (e.g. +919876543210).',
      });
    }

    const existing = await User.findOne({ phoneNumber });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Phone number is already in use.' });
    }

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const existingSession = sessionStore.get(phoneNumber);
    if (existingSession?.attempts >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - existingSession.createdAt;
      if (elapsed < SESSION_TTL_MS) {
        return res.status(429).json({
          message: 'Too many attempts. Please wait 10 minutes before retrying.',
        });
      }
    }

    // ── Send OTP via 2Factor as an SMS only request ─────────────────────────
    const phone = normalizePhoneForTwoFactor(phoneNumber);
    const response = await axios.get(
      `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN`
    );

    if (response.data?.Status !== 'Success') {
      throw new Error(response.data?.Details || '2Factor failed to send OTP.');
    }

    // ── Store session ID returned by 2Factor ──────────────────────────────────
    sessionStore.set(phoneNumber, {
      sessionId: response.data.Details, // 2Factor returns session ID in Details
      createdAt: Date.now(),
      attempts: 0,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully.',
    });
  } catch (err) {
    console.error('send-phone-otp error:', err?.response?.data || err.message);
    return res
      .status(500)
      .json({ message: err.message || 'Failed to send OTP.' });
  }
});

// ── POST /api/auth/verify-phone-otp ──────────────────────────────────────────
router.post('/verify-phone-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res
        .status(400)
        .json({ message: 'Phone number and OTP are required.' });
    }

    const record = sessionStore.get(phoneNumber);

    if (!record) {
      return res
        .status(400)
        .json({ message: 'No OTP found. Please request a new one.' });
    }

    // ── Expired ───────────────────────────────────────────────────────────────
    if (Date.now() - record.createdAt > SESSION_TTL_MS) {
      sessionStore.delete(phoneNumber);
      return res
        .status(400)
        .json({ message: 'OTP has expired. Please request a new one.' });
    }

    // ── Too many wrong attempts ───────────────────────────────────────────────
    if (record.attempts >= MAX_ATTEMPTS) {
      sessionStore.delete(phoneNumber);
      return res.status(429).json({
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    // ── Verify with 2Factor using session ID ──────────────────────────────────
    const verifyResponse = await axios.get(
      `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/VERIFY/${record.sessionId}/${otp}`
    );

    if (verifyResponse.data?.Status !== 'Success') {
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
      message: 'Phone number verified successfully.',
    });
  } catch (err) {
    console.error(
      'verify-phone-otp error:',
      err?.response?.data || err.message
    );
    return res
      .status(500)
      .json({ message: err.message || 'Verification failed.' });
  }
});

export default router;
