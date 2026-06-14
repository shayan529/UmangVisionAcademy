// controllers/passwordResetController.js
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';

// ── In-memory OTP store ───────────────────────────────────────────────────────
// { email: { otp, expiresAt, attempts, lastSentAt } }
const otpStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5; // wrong guesses before lockout

// ── Mailer ────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password
  },
});

const sendOtpEmail = async (email, otp, name = '') => {
  await transporter.sendMail({
    from: `"Umang Vision Academy" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Password Reset OTP',
    html: `
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
                  Hi${name ? ' ' + name : ''},<br/>
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
    `,
  });
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
// Body: { email }
export const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!email) return res.status(400).json({ message: 'Email is required' });

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email. Please sign up first.',
      });
    }

    // Resend cooldown
    const existing = otpStore.get(email);
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

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
      lastSentAt: Date.now(),
    });

    await sendOtpEmail(email, otp, user.name);

    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('sendResetOtp error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Try again.' });
  }
};

// ── POST /api/auth/verify-reset-otp ──────────────────────────────────────────
// Body: { email, otp }
// Returns a short-lived reset token on success
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP required' });

    const record = otpStore.get(email);
    if (!record)
      return res
        .status(400)
        .json({ message: 'No OTP requested. Please request one first.' });

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res
        .status(400)
        .json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(email);
      return res.status(429).json({
        message: 'Too many wrong attempts. Please request a new OTP.',
      });
    }

    if (record.otp !== otp.trim()) {
      record.attempts += 1;
      const left = MAX_ATTEMPTS - record.attempts;
      return res.status(400).json({
        message: `Incorrect OTP. ${left} attempt${left !== 1 ? 's' : ''} remaining.`,
      });
    }

    // OTP correct — issue a one-time reset token (valid 15 min)
    const resetToken = crypto.randomBytes(32).toString('hex');
    record.resetToken = resetToken;
    record.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    record.verified = true;

    res.json({ message: 'OTP verified.', resetToken });
  } catch (err) {
    console.error('verifyResetOtp error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
// Body: { email, resetToken, newPassword }
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const record = otpStore.get(email);
    if (!record?.verified || record.resetToken !== resetToken) {
      return res
        .status(400)
        .json({ message: 'Invalid or expired reset session. Start over.' });
    }
    if (Date.now() > record.resetTokenExpiry) {
      otpStore.delete(email);
      return res
        .status(400)
        .json({ message: 'Reset session expired. Start over.' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { password: hashed }
    );

    otpStore.delete(email);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
