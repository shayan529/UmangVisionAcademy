// routes/questionPaper.routes.js
import express from "express";
import multer from "multer";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import {
  uploadQuestionPaper,
  getAllQuestionPapers,
  deleteQuestionPaper,
  getQuestionPapers,
} from "../controllers/questionPaper.controller.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
}); // 20MB

router.get("/", getQuestionPapers); // public
router.get("/all", protect, adminOnly, getAllQuestionPapers); // admin
router.post(
  "/upload",
  protect,
  adminOnly,
  upload.single("file"),
  uploadQuestionPaper,
); // admin
router.delete("/:id", protect, adminOnly, deleteQuestionPaper); // admin

export default router;
