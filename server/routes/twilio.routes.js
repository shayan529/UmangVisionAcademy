import express from 'express';
import crypto from 'crypto';
import twilio from 'twilio';
import User from '../models/user.model.js';

const router = express.Router();

// ── Lazy Twilio client ────────────────────────────────────────────────────────
// Initialized on first use so the server doesn't crash at startup if env vars
// aren't loaded yet. Also gives a clear error message if they're missing.
let _twilioClient = null;
const getTwilioClient = () => {
  if (_twilioClient) return _twilioClient;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  _twilioClient = twilio(sid, token);
  return _twilioClient;
};

// ── In-memory OTP store (swap for Redis in production) ────────────────────────
const otpStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
router.post('/send-phone-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        message: 'Phone number is required.',
      });
    }

    if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
      return res.status(400).json({
        message: 'Phone number must be in E.164 format (e.g. +919876543210).',
      });
    }

    const existing = await User.findOne({ phoneNumber });

    if (existing) {
      return res.status(409).json({
        message: 'Phone number is already in use.',
      });
    }

    const verification = await getTwilioClient()
      .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms',
      });

    return res.status(200).json({
      success: true,
      status: verification.status,
      message: 'OTP sent successfully.',
    });
  } catch (err) {
    console.error('send-phone-otp error:', err);

    return res.status(500).json({
      message: err.message || 'Failed to send OTP.',
    });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
router.post('/verify-phone-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        message: 'Phone number and OTP are required.',
      });
    }

    const verificationCheck = await getTwilioClient()
      .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });

    if (verificationCheck.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Phone number verified successfully.',
    });
  } catch (err) {
    console.error('verify-phone-otp error:', err);

    return res.status(500).json({
      message: err.message || 'Verification failed.',
    });
  }
});

export default router;
