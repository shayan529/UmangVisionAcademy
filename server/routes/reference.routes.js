import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listReferences,
  getReferenceById,
  createReference,
  updateReference,
  deleteReference,
} from "../controllers/reference.controller.js";

const router = express.Router();

// User-owned reference routes: accessible by any authenticated user for their own records.
router.get("/", protect, listReferences);
router.get("/:id", protect, getReferenceById);
router.post("/", protect, createReference);
router.put("/:id", protect, updateReference);
router.delete("/:id", protect, deleteReference);

export default router;
