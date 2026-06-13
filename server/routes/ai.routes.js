import express from 'express';
import { chatWithAI, generateQuizAI, getNewsAI } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /ai/chat — authenticated students only
router.post('/chat', protect, chatWithAI);
router.post('/generate-quiz', protect, generateQuizAI);
router.get('/news', getNewsAI);

export default router;
