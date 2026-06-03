import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";
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
router.get("/", protect, authorizeRoles("admin"), getAllApplications);
router.put(
  "/:id/approve",
  protect,
  authorizeRoles("admin"),
  approveApplication,
);
router.delete("/:id", protect, authorizeRoles("admin"), rejectApplication);

export default router;
