// routes/settings.routes.js

import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/settings.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

export default router;
