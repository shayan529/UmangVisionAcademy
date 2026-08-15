import express from "express";
import {
  createNote,
  bulkCreateNotes,
  bulkActionNotes,
  bulkAssignCourseNotes,
  listNotes,
  approveNote,
  rejectNote,
  unapproveNote,
  deleteNote,
  updateNote,
} from "../controllers/note.controller.js";
import {
  protect,
  optionalAuth,
  instructorOnly,
  requirePermission,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Public + personalized listing: anonymous callers get an empty/public
// result, logged-in students get notes from courses they're enrolled in,
// instructors with ?mine=1 get their own courses' notes. optionalAuth
// detects the same cookie-or-Bearer token that `protect` does, so this
// works correctly for both the website (cookie) and the Capacitor Android
// app (Bearer header) — unlike a manual `req.cookies?.token` check, which
// only covers the cookie case.
router.get("/", optionalAuth, listNotes);
router.post("/", protect, instructorOnly, createNote);
router.post("/bulk", protect, instructorOnly, bulkCreateNotes);
router.post("/bulk-action", protect, instructorOnly, bulkActionNotes);
router.post("/bulk-assign-course", protect, instructorOnly, bulkAssignCourseNotes);
router.put(
  "/:id/approve",
  protect,
  requirePermission("notes", "approve"),
  approveNote,
);
router.put(
  "/:id/reject",
  protect,
  requirePermission("notes", "reject"),
  rejectNote,
);
router.put(
  "/:id/unapprove",
  protect,
  requirePermission("notes", "approve"),
  unapproveNote,
);
router.put("/:id", protect, updateNote);
router.delete("/:id", protect, deleteNote);

export default router;