import express from "express";
import {
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getStudentSessions,
  getInstructorSessions,
  getAllSessions,
} from "../controllers/session.controller.js";
import { protect, requirePermission } from "../middleware/auth.middleware.js";
import { hasBaseRole, hasPermissionGrant } from "../utils/userRoles.js";

const router = express.Router();

router.use(protect);

// Grants access to admins, instructors (own sessions), OR staff with the
// given sessions permission grant.
const canModifySessions = (action) => (req, res, next) => {
  if (
    hasBaseRole(req.user, "admin") ||
    hasBaseRole(req.user, "instructor") ||
    hasPermissionGrant(req.user, "sessions", action)
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: `Access denied — missing permission "sessions:${action}"`,
  });
};

router.get("/", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  const isAdminOrStaff =
    hasBaseRole(req.user, "admin") ||
    hasPermissionGrant(req.user, "sessions", "view");

  if (isAdminOrStaff) {
    return getAllSessions(req, res);
  }
  if (hasBaseRole(req.user, "instructor")) {
    return getInstructorSessions(req, res);
  }
  return getStudentSessions(req, res);
});

router.get("/:id", getSessionById);
router.post("/", canModifySessions("create"), createSession);
// sessions:approve — used to mark a session as approved/confirmed before it goes live
router.patch("/:id/approve", requirePermission("sessions", "approve"), updateSession);
router.put("/:id", canModifySessions("edit"), updateSession);
router.delete("/:id", canModifySessions("delete"), deleteSession);

export default router;
