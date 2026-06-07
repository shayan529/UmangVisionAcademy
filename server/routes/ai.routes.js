import express from 'express';
import { chatWithAI } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /ai/chat — authenticated students only
router.post('/chat', protect, chatWithAI);

export default router;
