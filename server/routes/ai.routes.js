import express from "express";
import {
  chatWithAI,
  generateQuizAI,
  generateCourseTextAI,
  getChatHistory,
  deleteChatHistory,
  getConversations,
  getNewsAI,
  generateMockTestQuestionsAI,
  translateTextAI,
} from "../controllers/ai.controller.js";
import { protect, authorizeRoles, requirePermission } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /ai/conversations — any authenticated user (student, instructor, staff)
router.get("/conversations", protect, getConversations);

// POST /ai/chat — any authenticated user; ai_tutor:access gates staff-dashboard
// access in the UI but the chat endpoint itself is open to all logged-in users
// (students, instructors) since it is a core product feature, not a moderation tool.
router.post("/chat", protect, chatWithAI);
router.get("/history/:conversationId", protect, getChatHistory);
router.delete("/history/:conversationId", protect, deleteChatHistory);
router.post("/generate-quiz", protect, generateQuizAI);
router.post("/generate-course-text", protect, generateCourseTextAI);
// Mock-test question generation is instructor/admin only (content creation tool)
router.post("/generate-mock-test", protect, authorizeRoles("instructor", "admin"), generateMockTestQuestionsAI);
router.get("/news", getNewsAI);
router.post("/translate", translateTextAI);

export default router;
