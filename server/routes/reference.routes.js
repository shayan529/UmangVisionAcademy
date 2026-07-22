import express from "express";
import { protect, requirePermission } from "../middleware/auth.middleware.js";
import {
  listReferences,
  getReferenceById,
  createReference,
  updateReference,
  deleteReference,
} from "../controllers/reference.controller.js";

const router = express.Router();

// All reference routes require authentication AND a reference permission grant.
// Admins always pass; staff need the corresponding references:* grant.
router.get("/", protect, requirePermission("references", "view"), listReferences);
router.get("/:id", protect, requirePermission("references", "view"), getReferenceById);
router.post("/", protect, requirePermission("references", "create"), createReference);
router.put("/:id", protect, requirePermission("references", "edit"), updateReference);
router.delete("/:id", protect, requirePermission("references", "delete"), deleteReference);

export default router;
