import nodemailer from 'nodemailer';

/* ──────────────────────────────────────────────
   Required .env variables:
   GMAIL_USER        your Gmail address          e.g. yourname@gmail.com
   GMAIL_APP_PASSWORD  16-char Google App Password (NOT your Gmail password)
   CLIENT_URL        your frontend URL            e.g. http://localhost:5173
────────────────────────────────────────────── */

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify connection once on startup (logs to console, won't crash server)
transporter.verify((err) => {
  if (err) {
    console.error('❌ Mailer connection failed:', err.message);
  } else {
    console.log('✅ Mailer ready — connected to Gmail');
  }
});

/* ── HTML email template ── */
const buildOtpEmail = (otp, recipientEmail) => ({
  from: `"Umang Vision Academy" <${process.env.GMAIL_USER}>`,
  to: recipientEmail,
  subject: 'Your Verification Code — Umang Vision Academy',
  text: `Your OTP is ${otp}. It expires in 10 minutes. Do not share it with anyone.`,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#0B1120;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1120;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:480px;background:linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));
                 border:1px solid rgba(99,179,237,0.12);border-radius:24px;overflow:hidden;">

          <!-- Top gradient bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,transparent,#38bdf8,#6366f1,transparent);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding:36px 40px 24px;">
              <!-- Lock icon -->
              <div style="width:64px;height:64px;background:rgba(14,165,233,0.12);
                          border:1px solid rgba(14,165,233,0.25);border-radius:16px;
                          display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
                <img src="https://cdn-icons-png.flaticon.com/512/3064/3064155.png"
                     width="32" height="32" alt="lock"
                     style="filter:invert(72%) sepia(78%) saturate(500%) hue-rotate(165deg);" />
              </div>
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
                Verify Your Email
              </h1>
              <p style="margin:10px 0 0;font-size:14px;color:#94a3b8;line-height:1.5;">
                Use the code below to complete your registration on<br/>
                <strong style="color:#e2e8f0;">Umang Vision Academy</strong>
              </p>
            </td>
          </tr>

          <!-- OTP box -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <div style="background:rgba(14,165,233,0.08);border:1px solid rgba(56,189,248,0.25);
                          border-radius:16px;padding:28px 40px;display:inline-block;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;
                           color:#64748b;letter-spacing:0.15em;text-transform:uppercase;">
                  Your verification code
                </p>
                <p style="margin:0;font-size:44px;font-weight:900;letter-spacing:10px;
                           color:#38bdf8;font-family:'Courier New',monospace;">
                  ${otp}
                </p>
                <p style="margin:12px 0 0;font-size:12px;color:#64748b;">
                  ⏱ Expires in <strong style="color:#94a3b8;">10 minutes</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            <td style="padding:0 40px 28px;">
              <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);
                          border-radius:12px;padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                  🔒 <strong style="color:#e2e8f0;">Never share this code</strong> with anyone —
                  Umang Vision Academy will never ask for it. If you didn't request this,
                  you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 40px 32px;">
              <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                © ${new Date().getFullYear()} Umang Vision Academy. All rights reserved.<br/>
                <a href="${process.env.CLIENT_URL}"
                   style="color:#38bdf8;text-decoration:none;">${process.env.CLIENT_URL}</a>
              </p>
            </td>
          </tr>

          <!-- Bottom gradient bar -->
          <tr>
            <td style="height:2px;background:linear-gradient(90deg,transparent,#6366f1,#38bdf8,transparent);"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `,
});

/* ── Exported send function ── */
export const sendOtpEmail = async (recipientEmail, otp) => {
  const mailOptions = buildOtpEmail(otp, recipientEmail);
  const info = await transporter.sendMail(mailOptions);
  console.log(
    `📧 OTP email sent to ${recipientEmail} — MessageId: ${info.messageId}`
  );
  return info;
};
