import express from 'express';
import multer from 'multer';
import { uploadFile } from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

const router = express.Router();

// POST /upload/local  — single file, field name "file"
router.post('/local', protect, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, uploadFile);

export default router;
