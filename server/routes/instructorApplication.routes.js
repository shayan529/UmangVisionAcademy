import express from "express";
import { protect, requirePermission } from "../middleware/auth.middleware.js";
import {
  submitApplication,
  getMyApplication,
  getAllApplications,
  approveApplication,
  rejectApplication,
} from "../controllers/instructorApplication.controller.js";
import { uploadResume } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/", protect, uploadResume, submitApplication);
router.get("/me", protect, getMyApplication); // ← key route for status page
router.get("/", protect, requirePermission("moderation", "view"), getAllApplications);
router.put(
  "/:id/approve",
  protect,
  requirePermission("moderation", "remove"),
  approveApplication,
);
router.delete("/:id", protect, requirePermission("moderation", "remove"), rejectApplication);

export default router;
