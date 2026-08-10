import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { hasBaseRole, hasPermissionGrant } from "../utils/userRoles.js";
import {
  getOrCreateConversation,
  listConversations,
  getConversation,
  archiveConversation,
  deleteMessage,
  getAvailableInstructors,
  submitCallRequest,
  listCallRequests,
  approveCallRequest,
  rejectCallRequest,
  deleteConversation,
  toggleBlockConversation,
  reportConversation,
  listAdminReports,
  getAdminReportMessages,
  takeAdminReportAction,
  isInstructorUser,
} from "../controllers/instructorChat.controller.js";

const router = express.Router();
router.use(protect);

// ── Permission middleware ─────────────────────────────────────────────────────
// Students, instructors, admins, and staff with the ask_instructor grant
// can all access these endpoints.
const canAccessChat = async (req, res, next) => {
  const u = req.user;
  if (
    hasBaseRole(u, "student") ||
    hasBaseRole(u, "instructor") ||
    hasBaseRole(u, "admin") ||
    hasPermissionGrant(u, "ask_instructor", "view")
  ) {
    return next();
  }

  if (await isInstructorUser(u)) {
    return next();
  }

  return res.status(403).json({ message: "Access denied" });
};

const studentOnly = (req, res, next) => {
  if (hasBaseRole(req.user, "student")) return next();
  return res.status(403).json({ message: "Students only" });
};

// ── Routes ────────────────────────────────────────────────────────────────────
// Selector data — student fetches enrolled courses + instructors
router.get("/available-instructors", studentOnly, getAvailableInstructors);

// Admin Moderation & Reports
router.get("/admin/reports", canAccessChat, listAdminReports);
router.get(
  "/admin/reports/:id/messages",
  canAccessChat,
  getAdminReportMessages,
);
router.post("/admin/reports/:id/action", canAccessChat, takeAdminReportAction);

// Conversation CRUD
router.post("/conversations", studentOnly, getOrCreateConversation);
router.get("/conversations", canAccessChat, listConversations);
router.get("/conversations/:id", canAccessChat, getConversation);
router.patch("/conversations/:id/archive", canAccessChat, archiveConversation);
router.delete("/conversations/:id", canAccessChat, deleteConversation);
router.patch(
  "/conversations/:id/block",
  canAccessChat,
  toggleBlockConversation,
);
router.post("/conversations/:id/report", canAccessChat, reportConversation);
router.delete("/conversations/:id/messages/:mid", canAccessChat, deleteMessage);

// Call request workflow
router.post("/call-requests", studentOnly, submitCallRequest);
router.get("/call-requests", canAccessChat, listCallRequests);
router.put("/call-requests/:id/approve", canAccessChat, approveCallRequest);
router.put("/call-requests/:id/reject", canAccessChat, rejectCallRequest);

export default router;
