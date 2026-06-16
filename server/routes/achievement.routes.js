import express from "express";
import {
  getUserAchievements,
  checkAndAwardAchievements,
  markAchievementsViewed,
} from "../controllers/achievement.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET user's achievements
router.get("/", protect, getUserAchievements);

// POST check and award new achievements
router.post("/check", protect, checkAndAwardAchievements);

// PUT mark achievements as viewed
router.put("/viewed", protect, markAchievementsViewed);

export default router;
