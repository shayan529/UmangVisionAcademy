// routes/unsubscribe.routes.js
// Public, no-auth endpoint — the token in the URL IS the credential.
import express from "express";
import User from "../models/user.model.js";
import { deleteKey } from "../utils/redisClient.js";

const router = express.Router();

/**
 * GET /api/unsubscribe?token=<unsubscribeToken>
 *
 * One-click unsubscribe link included in every notification email footer.
 * Sets notificationSettings.emailNotifications = false on the matching user
 * and renders a simple HTML confirmation page — no login required.
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

    const user = await User.findOneAndUpdate(
      { unsubscribeToken: token.trim() },
      { "notificationSettings.emailNotifications": false },
      { new: true },
    ).select("name email _id");

    if (!user) {
      // Token not found — either already unsubscribed via this path or link is stale
      return res.status(404).send(buildPage(
        "Link Not Recognised",
        "We could not find an account linked to this unsubscribe token. You may have already been unsubscribed.",
        false,
      ));
    }

    // Bust the user cache so the next request through protect sees the change
    await deleteKey(`user:${user._id.toString()}`).catch(() => {});

    return res.status(200).send(buildPage(
      "You've Been Unsubscribed",
      `You will no longer receive marketing and notification emails at <strong>${user.email || "your registered address"}</strong>.<br/><br/>You can re-enable emails at any time from your account notification settings.`,
      true,
    ));
  } catch (err) {
    console.error("[Unsubscribe]", err.message);
    return res.status(500).send(buildPage(
      "Something Went Wrong",
      "We were unable to process your request right now. Please try again later.",
      false,
    ));
  }
});

/**
 * POST /api/unsubscribe/resubscribe
 * Body: { token }
 *
 * Lets a user re-enable emails after accidentally unsubscribing.
 * Still token-based so no login is required.
 */
router.post("/resubscribe", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required." });

    const user = await User.findOneAndUpdate(
      { unsubscribeToken: token.trim() },
      { "notificationSettings.emailNotifications": true },
      { new: true },
    ).select("_id name email");

    if (!user) return res.status(404).json({ message: "Token not recognised." });

    await deleteKey(`user:${user._id.toString()}`).catch(() => {});

    return res.json({ success: true, message: "Email notifications re-enabled." });
  } catch (err) {
    console.error("[Resubscribe]", err.message);
    res.status(500).json({ message: "Failed to re-enable notifications." });
  }
});

// ── Minimal HTML page builder ─────────────────────────────────────────────────
function buildPage(heading, bodyHtml, success) {
  const accent = success ? "#22c55e" : "#ef4444";
  const icon   = success ? "✅" : "⚠️";
  const clientUrl = process.env.CLIENT_URL || "https://umangvisionacademy.onrender.com";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${heading} — Umang Vision Academy</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0B1120;font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;
         display:flex;align-items:center;justify-content:center;padding:24px}
    .card{max-width:480px;width:100%;background:linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));
          border:1px solid rgba(99,179,237,0.12);border-radius:24px;overflow:hidden;text-align:center}
    .bar-top{height:3px;background:linear-gradient(90deg,transparent,#38bdf8,#6366f1,transparent)}
    .body{padding:40px 36px 32px}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:22px;font-weight:800;color:#f1f5f9;margin-bottom:12px}
    p{font-size:14px;color:#94a3b8;line-height:1.7}
    p strong{color:#e2e8f0}
    .btn{display:inline-block;margin-top:24px;padding:11px 28px;
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
