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
import { protect } from "../middleware/auth.middleware.js";
import { hasBaseRole } from "../utils/userRoles.js";

const router = express.Router();

router.use(protect);

router.get("/", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  const isAdminOrStaff = req.user.role === "admin" || req.user.role === "staff" || 
    (req.user.roles && (req.user.roles.includes("admin") || req.user.roles.includes("staff")));

  if (isAdminOrStaff) {
    return getAllSessions(req, res);
  }
  if (hasBaseRole(req.user, "instructor") || req.user.role === "instructor") {
    return getInstructorSessions(req, res);
  }
  return getStudentSessions(req, res);
});

router.get("/:id", getSessionById);
router.post("/", createSession);
router.put("/:id", updateSession);
router.delete("/:id", deleteSession);

export default router;
