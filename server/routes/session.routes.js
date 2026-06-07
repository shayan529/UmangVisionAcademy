import express from 'express';
import {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/session.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All session routes require authentication
router.use(protect);

router.get('/', protect, getSessions);
router.get('/:id', getSessionById);
router.post('/', createSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;
