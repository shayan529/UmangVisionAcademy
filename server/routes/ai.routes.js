import express from "express";
import {
  chatWithAI,
  generateQuizAI,
  getChatHistory,
  deleteChatHistory,
  getNewsAI,
  generateMockTestQuestionsAI,
} from "../controllers/ai.controller.js";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /ai/chat — authenticated students only
router.post("/chat", protect, chatWithAI);
router.get("/history/:conversationId", getChatHistory);
router.delete("/history/:conversationId", deleteChatHistory);
router.post("/generate-quiz", protect, generateQuizAI);
router.post("/generate-mock-test", protect, authorizeRoles("instructor", "admin"), generateMockTestQuestionsAI);
router.get("/news", getNewsAI);

export default router;
