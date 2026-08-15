import express from "express";
import {
  getStudentHubData,
  getStudentHubSection,
  saveStudentHubSection,
} from "../controllers/studentHub.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getStudentHubData);
router.get("/:section", protect, getStudentHubSection);
router.put("/:section", protect, saveStudentHubSection);

export default router;
