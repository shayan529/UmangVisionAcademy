import nodemailer from 'nodemailer';
import { getNotificationsQueue } from './queue.js';

/* ──────────────────────────────────────────────
   Required .env variables:
   GMAIL_USER        your Gmail address          e.g. yourname@gmail.com
   GMAIL_APP_PASSWORD  16-char Google App Password (NOT your Gmail password)
   CLIENT_URL        your frontend URL            e.g. http://localhost:5173
────────────────────────────────────────────── */

export const transporter = nodemailer.createTransport({
  pool: true,
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify connection once on startup only in the background worker
if (process.env.IS_WORKER === 'true') {
  transporter.verify((err) => {
    if (err) {
      console.error('❌ Mailer connection failed:', err.message);
    } else {
      console.log('✅ Mailer ready — connected to Gmail');
    }
  });
}

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
  if (process.env.IS_WORKER !== "true" && process.env.NODE_ENV !== "development" && !process.env.VERCEL) {
    const job = await getNotificationsQueue().add(`email-otp-${recipientEmail}-${Date.now()}`, {
      type: "email-otp",
      recipientEmail,
      otp,
    });
    return { success: true, queued: true, jobId: job.id };
  }
  const mailOptions = buildOtpEmail(otp, recipientEmail);
  const info = await transporter.sendMail(mailOptions);
  console.log(
    `📧 OTP email sent to ${recipientEmail} — MessageId: ${info.messageId}`
  );
  return info;
};

/* ── Generic Email Sender for Notifications ── */
export const sendThemedEmail = async (to, subject, title, bodyHtml) => {
  if (!to) return null;
  if (process.env.IS_WORKER !== "true" && process.env.NODE_ENV !== "development" && !process.env.VERCEL) {
    const job = await getNotificationsQueue().add(`email-themed-${to}-${Date.now()}`, {
      type: "email-themed",
      to,
      subject,
      title,
      bodyHtml,
    });
    return { success: true, queued: true, jobId: job.id };
  }
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0B1120;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1120;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:480px;background:linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));
                 border:1px solid rgba(99,179,237,0.12);border-radius:24px;overflow:hidden;">
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,transparent,#38bdf8,#6366f1,transparent);"></td>
          </tr>
          <tr>
            <td align="center" style="padding:36px 40px 24px;">
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
                ${title}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px;">
              <div style="font-size:14px;color:#94a3b8;line-height:1.6;">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:0;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 40px 32px;">
              <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                © ${new Date().getFullYear()} Umang Vision Academy. All rights reserved.<br/>
                <a href="${process.env.CLIENT_URL || 'https://umang-vision-academy.vercel.app'}"
                   style="color:#38bdf8;text-decoration:none;">${process.env.CLIENT_URL || 'Umang Vision Academy'}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="height:2px;background:linear-gradient(90deg,transparent,#6366f1,#38bdf8,transparent);"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  try {
    const info = await transporter.sendMail({
      from: `"Umang Vision Academy" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to} — Subject: ${subject}`);
    return info;
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
    return null;
  }
};

export const sendRegistrationEmail = (email, name) => {
  return sendThemedEmail(
    email,
    'Welcome to Umang Vision Academy!',
    'Welcome Aboard!',
    `<p>Hi ${name},</p><p>Thank you for registering with Umang Vision Academy. We are thrilled to have you with us!</p><p>You can now log in to explore our courses and start learning.</p>`
  );
};

export const sendReferralSuccessEmail = (email, referrerName, friendName, coinsEarned) => {
  return sendThemedEmail(
    email,
    'You earned coins from a referral!',
    'Referral Success',
    `<p>Hi ${referrerName},</p><p>Great news! Your friend <strong style="color:#e2e8f0;">${friendName || 'someone'}</strong> just registered using your referral code.</p><p>We've added <strong style="color:#38bdf8;">${coinsEarned} coins</strong> to your account as a thank you. Keep referring to earn more!</p>`
  );
};

export const sendPlanPurchaseEmail = (email, name, planName) => {
  return sendThemedEmail(
    email,
    'Plan Purchase Successful',
    'Subscription Activated',
    `<p>Hi ${name},</p><p>Your purchase of the <strong style="color:#38bdf8;">${planName}</strong> plan was successful.</p><p>Thank you for subscribing! You now have access to all the features included in your plan.</p>`
  );
};

export const sendWalletDepositEmail = (email, name, amount) => {
  return sendThemedEmail(
    email,
    'Funds Added to Your Wallet',
    'Wallet Top-up',
    `<p>Hi ${name},</p><p>We have successfully added <strong style="color:#38bdf8;">₹${amount}</strong> to your Umang Vision Academy wallet.</p><p>You can use your balance to purchase courses and more.</p>`
  );
};

export const sendCourseEnrollmentEmail = (email, name, courseTitles) => {
  const listItems = courseTitles.map(t => `<li><strong style="color:#e2e8f0;">${t}</strong></li>`).join('');
  return sendThemedEmail(
    email,
    'Course Enrollment Confirmation',
    'Happy Learning!',
    `<p>Hi ${name},</p><p>You have successfully enrolled in the following course(s):</p><ul>${listItems}</ul><p>Head over to your dashboard to start learning right away.</p>`
  );
};

export const sendSubscriptionCancellationEmail = (email, name, planName) => {
  return sendThemedEmail(
    email,
    'Subscription Cancelled',
    'Subscription Cancelled',
    `<p>Hi ${name},</p><p>Your <strong style="color:#38bdf8;">${planName}</strong> subscription has been successfully cancelled.</p><p>You will continue to have access to your plan's features until the end of your current billing period.</p><p>We're sorry to see you go!</p>`
  );
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendContactEmailDirect = async (name, email, subject, message) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Email service is not configured");
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  const info = await transporter.sendMail({
    from: `"Umang Vision Academy Contact" <${process.env.GMAIL_USER}>`,
    to: process.env.CONTACT_INBOX || "umangvisionacademy@gmail.com",
    replyTo: email,
    subject: `Contact Form: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #6366f1;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${safeMessage}</p>
      </div>
    `,
  });
  console.log(`📧 Contact email sent from ${name}`);
  return info;
};

export const sendContactEmail = async (name, email, subject, message) => {
  if (process.env.IS_WORKER === "true") {
    return sendContactEmailDirect(name, email, subject, message);
  }

  // BullMQ is unavailable on Vercel serverless or dev — send synchronously instead.
  if (process.env.VERCEL || process.env.NODE_ENV === "development") {
    return sendContactEmailDirect(name, email, subject, message);
  }

  try {
    const job = await getNotificationsQueue().add(`email-contact-${Date.now()}`, {
      type: "email-contact",
      name,
      email,
      subject,
      message,
    });
    return { success: true, queued: true, jobId: job.id };
  } catch (err) {
    console.warn(
      "Contact email queue unavailable, sending directly:",
      err.message,
    );
    return sendContactEmailDirect(name, email, subject, message);
  }
};

export const sendNewCourseAlertEmail = (email, studentName, instructorName, courseTitle, courseSummary, courseId) => {
  const clientUrl = process.env.CLIENT_URL || 'https://umang-vision-academy.vercel.app';
  return sendThemedEmail(
    email,
    `New Course Alert: ${courseTitle}`,
    'New Course Published!',
    `<p>Hi ${studentName},</p>
     <p>Good news! Instructor <strong style="color:#e2e8f0;">${instructorName}</strong> has just published a new course: <strong style="color:#38bdf8;">${courseTitle}</strong>.</p>
     ${courseSummary ? `<p>${courseSummary}</p>` : ''}
     <p>Since you are enrolled in one of their courses, we wanted to let you know. Click the button below to check it out!</p>
     <div style="text-align: center; margin: 20px 0;">
       <a href="${clientUrl}/courses/${courseId}" 
          style="background: linear-gradient(135deg,#7c3aed,#06b6d4); color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
         View Course
       </a>
     </div>`
  );
};

export const sendLiveClassReminderEmail = (email, studentName, instructorName, sessionTitle, date, time, url) => {
  return sendThemedEmail(
    email,
    `Live Class Reminder: ${sessionTitle}`,
    'Live Session Starting Soon!',
    `<p>Hi ${studentName},</p>
     <p>This is a reminder that the live class <strong style="color:#e2e8f0;">${sessionTitle}</strong> by <strong style="color:#e2e8f0;">${instructorName}</strong> is scheduled to start in about 1 hour.</p>
     <p><strong>Date:</strong> ${date}</p>
     <p><strong>Time:</strong> ${time} (IST)</p>
     <p>Click the button below to join the live session:</p>
     <div style="text-align: center; margin: 20px 0;">
       <a href="${url}" 
          style="background: linear-gradient(135deg,#7c3aed,#06b6d4); color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
         Join Live Class
       </a>
     </div>`
  );
};


