import crypt from "crypto";

// In-memory store (use Redis in production)
const otpStore = new Map(); // email → { otp, expiresAt }

// POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  // Check if email already registered
  const existing = await User.findOne({ email });
  if (existing)
    return res.status(409).json({ message: "Email already in use." });

  const otp = crypto.randomInt(100000, 999999).toString();
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min TTL

  // Send email — plug in your mail provider (nodemailer / Resend / SendGrid)
  await sendOtpEmail(email, otp); // implement this with your mailer

  res.json({ message: "OTP sent." });
});

// POST /api/auth/verify-otp
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);

  if (!record)
    return res.status(400).json({ message: "OTP not found or expired." });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res
      .status(400)
      .json({ message: "OTP has expired. Please request a new one." });
  }
  if (record.otp !== otp)
    return res.status(400).json({ message: "Invalid OTP." });

  otpStore.delete(email); // one-time use
  res.json({ success: true });
});
