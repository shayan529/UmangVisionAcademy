import express from "express";
import {
  createNote,
  listNotes,
  approveNote,
  rejectNote,
  unapproveNote,
  deleteNote,
} from "../controllers/note.controller.js";
import {
  protect,
  instructorOnly,
  requirePermission,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Use protect optionally: public (no token) falls through with req.user = undefined;
// authenticated instructors/admins get their user attached for mine=1 / all=1 filters.
router.get("/", (req, res, next) => {
  if (req.cookies?.token) {
    return protect(req, res, next);
  }
  next();
}, listNotes);
router.post("/", protect, instructorOnly, createNote);
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
router.delete("/:id", protect, deleteNote);

export default router;
