import express from "express";
import {
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getStudentSessions,
  getInstructorSessions,
} from "../controllers/session.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { hasBaseRole } from "../utils/userRoles.js";

const router = express.Router();

router.use(protect);

router.get("/", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (hasBaseRole(req.user, "instructor") || req.user.role === "instructor")
    return getInstructorSessions(req, res);
  return getStudentSessions(req, res);
});
router.get("/:id", getSessionById);
router.post("/", createSession);
router.put("/:id", updateSession);
router.delete("/:id", deleteSession);

export default router;
