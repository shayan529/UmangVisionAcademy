// routes/unsubscribe.routes.js
// Public, no-auth endpoint — the token in the URL IS the credential.
import express from "express";
import User from "../models/user.model.js";
import { deleteKey } from "../utils/redisClient.js";

const router = express.Router();

/**
 * GET /api/unsubscribe?token=<unsubscribeToken>
 *
 * One-click unsubscribe link included in email footers.
 * Displays a confirmation page asking the user to confirm before changing settings.
 */
router.get("/", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return res.status(400).send(buildPage(
        "Invalid Link",
        "This unsubscribe link is missing or malformed. Please use the link directly from your email.",
        false,
      ));
    }

    const cleanToken = token.trim();
    const user = await User.findOne({ unsubscribeToken: cleanToken }).select("name email notificationSettings _id");

    if (!user) {
      return res.status(404).send(buildPage(
        "Link Not Recognised",
        "We could not find an account linked to this unsubscribe token. You may have already been unsubscribed.",
        false,
      ));
    }

    // If user is ALREADY unsubscribed, show the status page with an option to re-enable
    if (user.notificationSettings?.emailNotifications === false) {
      return res.status(200).send(buildAlreadyUnsubscribedPage(user, cleanToken));
    }

    // User IS currently subscribed — ask for explicit confirmation first!
    return res.status(200).send(buildConfirmationPage(user, cleanToken));
  } catch (err) {
    console.error("[Unsubscribe GET]", err.message);
    return res.status(500).send(buildPage(
      "Something Went Wrong",
      "We were unable to process your request right now. Please try again later.",
      false,
    ));
  }
});

/**
 * POST /api/unsubscribe/confirm & POST /api/unsubscribe
 *
 * Performs the actual unsubscribe action after user confirms or via mail-client 1-click POST.
 */
const handleUnsubscribePost = async (req, res) => {
  try {
    const token = (req.body?.token || req.query?.token || "").trim();

    if (!token) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(400).json({ message: "Token is required." });
      }
      return res.status(400).send(buildPage(
        "Invalid Link",
        "Missing unsubscribe token.",
        false,
      ));
    }

    const user = await User.findOneAndUpdate(
      { unsubscribeToken: token },
      { "notificationSettings.emailNotifications": false },
      { new: true },
    ).select("name email _id");

    if (!user) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(404).json({ message: "Token not recognised." });
      }
      return res.status(404).send(buildPage(
        "Link Not Recognised",
        "We could not find an account linked to this unsubscribe token.",
        false,
      ));
    }

    await deleteKey(`user:${user._id.toString()}`).catch(() => {});

    if (req.headers.accept?.includes("application/json")) {
      return res.json({ success: true, message: "Unsubscribed successfully." });
    }

    return res.status(200).send(buildSuccessUnsubscribedPage(user, token));
  } catch (err) {
    console.error("[Unsubscribe POST]", err.message);
    if (req.headers.accept?.includes("application/json")) {
      return res.status(500).json({ message: "Failed to unsubscribe." });
    }
    return res.status(500).send(buildPage(
      "Something Went Wrong",
      "Failed to process your unsubscribe request.",
      false,
    ));
  }
};

router.post("/confirm", handleUnsubscribePost);
router.post("/", handleUnsubscribePost);

/**
 * POST /api/unsubscribe/resubscribe
 * Body: { token, redirectHtml? }
 *
 * Lets a user re-enable emails after accidentally unsubscribing.
 */
router.post("/resubscribe", async (req, res) => {
  try {
    const token = (req.body?.token || req.query?.token || "").trim();
    const redirectHtml = Boolean(req.body?.redirectHtml || req.query?.redirectHtml);

    if (!token) {
      if (redirectHtml || req.headers.accept?.includes("text/html")) {
        return res.status(400).send(buildPage("Invalid Request", "Token is required.", false));
      }
      return res.status(400).json({ message: "Token is required." });
    }

    const user = await User.findOneAndUpdate(
      { unsubscribeToken: token },
      { "notificationSettings.emailNotifications": true },
      { new: true },
    ).select("_id name email");

    if (!user) {
      if (redirectHtml || req.headers.accept?.includes("text/html")) {
        return res.status(404).send(buildPage("Token Not Recognised", "We could not find an account linked to this token.", false));
      }
      return res.status(404).json({ message: "Token not recognised." });
    }

    await deleteKey(`user:${user._id.toString()}`).catch(() => {});

    if (redirectHtml || req.headers.accept?.includes("text/html")) {
      return res.status(200).send(buildResubscribedPage(user));
    }

    return res.json({ success: true, message: "Email notifications re-enabled." });
  } catch (err) {
    console.error("[Resubscribe]", err.message);
    if (req.body?.redirectHtml || req.headers.accept?.includes("text/html")) {
      return res.status(500).send(buildPage("Something Went Wrong", "Failed to re-enable notifications.", false));
    }
    res.status(500).json({ message: "Failed to re-enable notifications." });
  }
});

// ── HTML Page Builders ────────────────────────────────────────────────────────

const getClientUrl = () => (process.env.CLIENT_URL || "https://umang-vision-academy.vercel.app").replace(/\/$/, "");

/** Step 1: Confirmation Page */
function buildConfirmationPage(user, token) {
  const clientUrl = getClientUrl();
  const userEmail = user.email || "your registered address";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirm Unsubscribe — Umang Vision Academy</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0B1120;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;min-height:100vh;
         display:flex;align-items:center;justify-content:center;padding:24px;color:#f1f5f9}
    .card{max-width:500px;width:100%;background:linear-gradient(160deg,rgba(30,41,59,0.85),rgba(15,23,42,0.95));
          border:1px solid rgba(99,102,241,0.25);border-radius:24px;overflow:hidden;text-align:center;
          box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);backdrop-filter:blur(10px)}
    .bar-top{height:4px;background:linear-gradient(90deg,#f59e0b,#ef4444,#6366f1)}
    .body{padding:40px 36px 36px}
    .icon-box{width:64px;height:64px;margin:0 auto 20px;background:rgba(239,68,68,0.12);
              border:1px solid rgba(239,68,68,0.3);border-radius:20px;display:flex;
              align-items:center;justify-content:center;font-size:32px;}
    h1{font-size:22px;font-weight:800;color:#ffffff;margin-bottom:12px;letter-spacing:-0.02em}
    p{font-size:14px;color:#94a3b8;line-height:1.6;margin-bottom:16px}
    p strong{color:#f8fafc;word-break:break-all}
    .warning-note{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);
                  border-radius:14px;padding:12px 16px;font-size:13px;color:#fca5a5;
                  margin-bottom:24px;text-align:left;line-height:1.5;}
    .btn-group{display:flex;flex-direction:column;gap:12px;margin-top:8px}
    .btn-danger{width:100%;padding:14px 24px;background:linear-gradient(135deg,#dc2626,#e11d48);
                color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;
                cursor:pointer;transition:all 0.2s;box-shadow:0 4px 14px rgba(225,29,72,0.35);}
    .btn-danger:hover{opacity:0.92;transform:translateY(-1px);}
    .btn-secondary{display:block;width:100%;padding:13px 24px;background:rgba(255,255,255,0.06);
                   color:#cbd5e1;text-decoration:none;border:1px solid rgba(255,255,255,0.12);
                   border-radius:12px;font-size:14px;font-weight:600;transition:all 0.2s}
    .btn-secondary:hover{background:rgba(255,255,255,0.12);color:#fff}
    .bar-bottom{height:2px;background:linear-gradient(90deg,transparent,#6366f1,transparent)}
  </style>
</head>
<body>
  <div class="card">
    <div class="bar-top"></div>
    <div class="body">
      <div class="icon-box">🔕</div>
      <h1>Confirm Unsubscribe</h1>
      <p>Are you sure you want to stop receiving notification emails at <strong>${userEmail}</strong>?</p>
      
      <div class="warning-note">
        ⚠️ You will no longer receive course updates, announcements, certificate alerts, or progress summaries.
      </div>

      <div class="btn-group">
        <form action="/api/unsubscribe/confirm" method="POST" style="margin:0;">
          <input type="hidden" name="token" value="${token}" />
          <button type="submit" class="btn-danger">Yes, Unsubscribe Me</button>
        </form>
        <a href="${clientUrl}" class="btn-secondary">Keep Me Subscribed</a>
      </div>
    </div>
    <div class="bar-bottom"></div>
  </div>
</body>
</html>`;
}

/** Step 2: Unsubscribed Success Page */
function buildSuccessUnsubscribedPage(user, token) {
  const clientUrl = getClientUrl();
  const userEmail = user.email || "your registered address";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You've Been Unsubscribed — Umang Vision Academy</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0B1120;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;min-height:100vh;
         display:flex;align-items:center;justify-content:center;padding:24px;color:#f1f5f9}
    .card{max-width:500px;width:100%;background:linear-gradient(160deg,rgba(30,41,59,0.85),rgba(15,23,42,0.95));
          border:1px solid rgba(34,197,94,0.3);border-radius:24px;overflow:hidden;text-align:center;
          box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);backdrop-filter:blur(10px)}
    .bar-top{height:4px;background:linear-gradient(90deg,#22c55e,#06b6d4,#6366f1)}
    .body{padding:40px 36px 36px}
    .icon-box{width:64px;height:64px;margin:0 auto 20px;background:rgba(34,197,94,0.12);
              border:1px solid rgba(34,197,94,0.3);border-radius:20px;display:flex;
              align-items:center;justify-content:center;font-size:32px;}
    h1{font-size:22px;font-weight:800;color:#ffffff;margin-bottom:12px;letter-spacing:-0.02em}
    p{font-size:14px;color:#94a3b8;line-height:1.6;margin-bottom:24px}
    p strong{color:#f8fafc;word-break:break-all}
    .btn-group{display:flex;flex-direction:column;gap:12px}
    .btn-primary{display:block;width:100%;padding:14px 24px;background:linear-gradient(135deg,#7c3aed,#06b6d4);
                 color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;
                 box-shadow:0 4px 14px rgba(124,58,237,0.35);transition:all 0.2s}
    .btn-primary:hover{opacity:0.92;transform:translateY(-1px)}
    .btn-undo{width:100%;padding:12px 24px;background:rgba(255,255,255,0.05);
              color:#a7f3d0;border:1px solid rgba(52,211,153,0.25);border-radius:12px;
              font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s}
    .btn-undo:hover{background:rgba(52,211,153,0.12);color:#6ee7b7}
    .bar-bottom{height:2px;background:linear-gradient(90deg,transparent,#38bdf8,transparent)}
  </style>
</head>
<body>
  <div class="card">
    <div class="bar-top"></div>
    <div class="body">
      <div class="icon-box">✅</div>
      <h1>You've Been Unsubscribed</h1>
      <p>You will no longer receive marketing and notification emails at <strong>${userEmail}</strong>.<br/><br/>You can re-enable emails at any time from your account settings.</p>
      
      <div class="btn-group">
        <a href="${clientUrl}" class="btn-primary">Go to Umang Vision Academy</a>
        <form action="/api/unsubscribe/resubscribe" method="POST" style="margin:0;">
          <input type="hidden" name="token" value="${token}" />
          <input type="hidden" name="redirectHtml" value="true" />
          <button type="submit" class="btn-undo">↩ Undo & Re-Enable Emails</button>
        </form>
      </div>
    </div>
    <div class="bar-bottom"></div>
  </div>
</body>
</html>`;
}

/** Status Page: User is already unsubscribed */
function buildAlreadyUnsubscribedPage(user, token) {
  const clientUrl = getClientUrl();
  const userEmail = user.email || "your account";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Already Unsubscribed — Umang Vision Academy</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0B1120;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;min-height:100vh;
         display:flex;align-items:center;justify-content:center;padding:24px;color:#f1f5f9}
    .card{max-width:500px;width:100%;background:linear-gradient(160deg,rgba(30,41,59,0.85),rgba(15,23,42,0.95));
          border:1px solid rgba(56,189,248,0.3);border-radius:24px;overflow:hidden;text-align:center;
          box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);backdrop-filter:blur(10px)}
    .bar-top{height:4px;background:linear-gradient(90deg,#38bdf8,#6366f1,#a855f7)}
    .body{padding:40px 36px 36px}
    .icon-box{width:64px;height:64px;margin:0 auto 20px;background:rgba(56,189,248,0.12);
              border:1px solid rgba(56,189,248,0.3);border-radius:20px;display:flex;
              align-items:center;justify-content:center;font-size:32px;}
    h1{font-size:22px;font-weight:800;color:#ffffff;margin-bottom:12px;letter-spacing:-0.02em}
    p{font-size:14px;color:#94a3b8;line-height:1.6;margin-bottom:24px}
    p strong{color:#f8fafc;word-break:break-all}
    .btn-group{display:flex;flex-direction:column;gap:12px}
    .btn-primary{display:block;width:100%;padding:14px 24px;background:linear-gradient(135deg,#7c3aed,#06b6d4);
                 color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;
                 box-shadow:0 4px 14px rgba(124,58,237,0.35);transition:all 0.2s}
    .btn-primary:hover{opacity:0.92;transform:translateY(-1px)}
    .btn-resubscribe{width:100%;padding:12px 24px;background:rgba(56,189,248,0.1);
                    color:#38bdf8;border:1px solid rgba(56,189,248,0.3);border-radius:12px;
                    font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s}
    .btn-resubscribe:hover{background:rgba(56,189,248,0.2);color:#7dd3fc}
    .bar-bottom{height:2px;background:linear-gradient(90deg,transparent,#38bdf8,transparent)}
  </style>
</head>
<body>
  <div class="card">
    <div class="bar-top"></div>
    <div class="body">
      <div class="icon-box">🔔</div>
      <h1>Already Unsubscribed</h1>
      <p>Notification emails for <strong>${userEmail}</strong> are currently turned off.</p>
      
      <div class="btn-group">
        <a href="${clientUrl}" class="btn-primary">Go to Umang Vision Academy</a>
        <form action="/api/unsubscribe/resubscribe" method="POST" style="margin:0;">
          <input type="hidden" name="token" value="${token}" />
          <input type="hidden" name="redirectHtml" value="true" />
          <button type="submit" class="btn-resubscribe">Re-Enable Email Notifications</button>
        </form>
      </div>
    </div>
    <div class="bar-bottom"></div>
  </div>
</body>
</html>`;
}

/** Success Page: User re-enabled notifications */
function buildResubscribedPage(user) {
  const clientUrl = getClientUrl();
  const userEmail = user.email || "your registered address";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Notifications Re-Enabled — Umang Vision Academy</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0B1120;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;min-height:100vh;
         display:flex;align-items:center;justify-content:center;padding:24px;color:#f1f5f9}
    .card{max-width:500px;width:100%;background:linear-gradient(160deg,rgba(30,41,59,0.85),rgba(15,23,42,0.95));
          border:1px solid rgba(34,197,94,0.3);border-radius:24px;overflow:hidden;text-align:center;
          box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);backdrop-filter:blur(10px)}
    .bar-top{height:4px;background:linear-gradient(90deg,#22c55e,#10b981,#38bdf8)}
    .body{padding:40px 36px 36px}
    .icon-box{width:64px;height:64px;margin:0 auto 20px;background:rgba(34,197,94,0.12);
              border:1px solid rgba(34,197,94,0.3);border-radius:20px;display:flex;
              align-items:center;justify-content:center;font-size:32px;}
    h1{font-size:22px;font-weight:800;color:#ffffff;margin-bottom:12px;letter-spacing:-0.02em}
    p{font-size:14px;color:#94a3b8;line-height:1.6;margin-bottom:24px}
    p strong{color:#f8fafc;word-break:break-all}
    .btn-primary{display:block;width:100%;padding:14px 24px;background:linear-gradient(135deg,#10b981,#06b6d4);
                 color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;
                 box-shadow:0 4px 14px rgba(16,185,129,0.35);transition:all 0.2s}
    .btn-primary:hover{opacity:0.92;transform:translateY(-1px)}
    .bar-bottom{height:2px;background:linear-gradient(90deg,transparent,#10b981,transparent)}
  </style>
</head>
<body>
  <div class="card">
    <div class="bar-top"></div>
    <div class="body">
      <div class="icon-box">🎉</div>
      <h1>Notifications Re-Enabled</h1>
      <p>You will once again receive notification emails at <strong>${userEmail}</strong>.</p>
      <a href="${clientUrl}" class="btn-primary">Return to Umang Vision Academy</a>
    </div>
    <div class="bar-bottom"></div>
  </div>
</body>
</html>`;
}

/** Generic Error/Info Page */
function buildPage(heading, bodyHtml, success) {
  const icon = success ? "✅" : "⚠️";
  const clientUrl = getClientUrl();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${heading} — Umang Vision Academy</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0B1120;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;min-height:100vh;
         display:flex;align-items:center;justify-content:center;padding:24px;color:#f1f5f9}
    .card{max-width:500px;width:100%;background:linear-gradient(160deg,rgba(30,41,59,0.85),rgba(15,23,42,0.95));
          border:1px solid rgba(99,179,237,0.2);border-radius:24px;overflow:hidden;text-align:center;
          box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);backdrop-filter:blur(10px)}
    .bar-top{height:4px;background:linear-gradient(90deg,transparent,#38bdf8,#6366f1,transparent)}
    .body{padding:40px 36px 36px}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:22px;font-weight:800;color:#ffffff;margin-bottom:12px}
    p{font-size:14px;color:#94a3b8;line-height:1.6}
    p strong{color:#e2e8f0}
    .btn{display:inline-block;margin-top:24px;padding:12px 28px;
         background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;
         text-decoration:none;border-radius:12px;font-size:13px;font-weight:700}
    .bar-bottom{height:2px;background:linear-gradient(90deg,transparent,#6366f1,#38bdf8,transparent)}
  </style>
</head>
<body>
  <div class="card">
    <div class="bar-top"></div>
    <div class="body">
      <div class="icon">${icon}</div>
      <h1>${heading}</h1>
      <p>${bodyHtml}</p>
      <a href="${clientUrl}" class="btn">Go to Umang Vision Academy</a>
    </div>
    <div class="bar-bottom"></div>
  </div>
</body>
</html>`;
}

export default router;
