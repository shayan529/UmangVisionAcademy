// routes/settings.routes.js

import express from "express";
import { protect } from "../middleware/auth.middleware.js"; // adjust path if needed
import {
  getProfile,
  updateProfile,
  changePassword,
  sendEmailOtp,
  verifyEmailOtp,
  sendPasswordOtp,
  verifyPasswordOtp,
} from "../controllers/settings.controller.js";

const router = express.Router();

// Profile
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Password (existing + new OTP guards)
router.put("/change-password", protect, changePassword);
router.post("/send-password-otp", protect, sendPasswordOtp);
router.post("/verify-password-otp", protect, verifyPasswordOtp);

// Email change
router.post("/send-email-otp", protect, sendEmailOtp);
router.post("/verify-email-otp", protect, verifyEmailOtp);

export default router;
