import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js"; // adjust path/name if different
import {
  createReel,
  listReels,
  getReel,
  approveReel,
  rejectReel,
  unapproveReel,
} from "../controllers/reel.controller.js";
import {
  protect,
  instructorOnly,
  requirePermission,
} from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Populates req.user if a valid token is present, but never blocks the
 * request — unlike `protect`, which presumably 401s when there's no token.
 * This route needs to serve both anonymous visitors (approved reels only)
 * and admins (?all=1), so it can't use `protect` directly.
 *
 * IMPORTANT: match this to however `protect` actually reads/verifies the
 * token in your codebase (cookie name, header format, secret, user lookup).
 * This is a best-guess based on common patterns — swap in the real logic
 * from auth.middleware.js if it differs.
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch (err) {
    // invalid/expired token -> treat as anonymous, don't block
  }
  next();
};

// Public: list approved reels (admins get everything via ?all=1)
router.get("/", optionalAuth, listReels);
router.get("/:id", getReel);

// Instructor or admin upload (protected)
// instructorOnly already passes admin users through, so no change needed
// to the middleware — but the comment is updated for clarity.
router.post("/", protect, instructorOnly, createReel);

// Admin / Moderator review
router.put("/:id/approve", protect, requirePermission("reels", "approve"), approveReel);
router.put("/:id/reject", protect, requirePermission("reels", "reject"), rejectReel);
router.put("/:id/unapprove", protect, requirePermission("reels", "reject"), unapproveReel);

export default router;