import express from "express";
import multer from "multer";
import path from "path";
import { uploadFile } from "../controllers/upload.controller.js";
import { protect } from "../middleware/auth.middleware.js";

// Store temp files in /tmp, max 200MB (for video)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "tmp/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only images and videos are allowed."), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
});

const router = express.Router();

// POST /upload  — single file, field name "file"
router.post("/", protect, upload.single("file"), uploadFile);

export default router;
