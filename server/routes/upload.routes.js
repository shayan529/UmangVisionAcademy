import express from 'express';
import multer from 'multer';
import { uploadFile } from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.NODE_ENV === 'production' || __dirname.includes('/var/task');
const TMP_DIR = isVercel 
  ? path.join(os.tmpdir(), 'uploads') 
  : path.join(__dirname, '..', '.tmp', 'uploads');

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TMP_DIR);
  },
  filename: function (req, file, cb) {
    const sanitizedOriginalName = file.originalname
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .replace(/_+/g, "_");
    cb(null, `${Date.now()}_${sanitizedOriginalName}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Reject executables and dangerous files
  const invalidMimeTypes = ['application/x-msdownload', 'application/x-sh', 'application/x-bat'];
  const ext = path.extname(file.originalname).toLowerCase();
  const invalidExts = ['.exe', '.bat', '.sh', '.msi'];

  if (invalidMimeTypes.includes(file.mimetype) || invalidExts.includes(ext)) {
    return cb(new Error('Invalid file type.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter,
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
