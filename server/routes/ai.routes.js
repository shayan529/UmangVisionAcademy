import express from "express";
import {
  chatWithAI,
  generateQuizAI,
  getChatHistory,
  deleteChatHistory,
  getNewsAI,
} from "../controllers/ai.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /ai/chat — authenticated students only
router.post("/chat", protect, chatWithAI);
router.get("/history/:conversationId", getChatHistory);
router.delete("/history/:conversationId", deleteChatHistory);
router.post("/generate-quiz", protect, generateQuizAI);
router.get("/news", getNewsAI);

export default router;
