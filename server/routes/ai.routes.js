import express from "express";
import {
  chatWithAI,
  generateQuizAI,
  getChatHistory,
  deleteChatHistory,
  getConversations,
  getNewsAI,
  generateMockTestQuestionsAI,
} from "../controllers/ai.controller.js";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /ai/conversations — authenticated users
router.get("/conversations", protect, getConversations);

// POST /ai/chat — authenticated students only
router.post("/chat", protect, chatWithAI);
router.get("/history/:conversationId", protect, getChatHistory);
router.delete("/history/:conversationId", protect, deleteChatHistory);
router.post("/generate-quiz", protect, generateQuizAI);
router.post("/generate-mock-test", protect, authorizeRoles("instructor", "admin"), generateMockTestQuestionsAI);
router.get("/news", getNewsAI);

export default router;
