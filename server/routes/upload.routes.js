import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadFile,
  getUploadSignature,
} from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';

import fs from 'fs';

// Store temp files in /tmp, max 500MB (supports large video uploads)
const tempDir = 'tmp';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images and videos are allowed.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

const router = express.Router();

// GET /upload/signature — generate ImageKit upload signature for direct browser uploads
router.get('/signature', protect, getUploadSignature);

// POST /upload  — single file, field name "file"
router.post('/', protect, upload.single('file'), uploadFile);

export default router;
