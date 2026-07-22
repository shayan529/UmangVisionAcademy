// routes/questionPaper.routes.js
import express from "express";
import multer from "multer";
import { protect, adminOnly, requirePermission } from "../middleware/auth.middleware.js";
import {
  uploadQuestionPaper,
  getAllQuestionPapers,
  deleteQuestionPaper,
  getQuestionPapers,
  checkPYQAccess,
  createPYQOrder,
  verifyPYQPayment,
  purchasePYQ,
} from "../controllers/questionPaper.controller.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
}); // 20MB

router.get("/", getQuestionPapers); // public
router.post("/access", protect, checkPYQAccess);
router.post("/purchase/order", protect, createPYQOrder);
router.post("/purchase/verify", protect, verifyPYQPayment);
router.post("/purchase", protect, purchasePYQ);
router.get("/all", protect, requirePermission("question_bank", "view"), getAllQuestionPapers);
router.post(
  "/upload",
  protect,
  requirePermission("question_bank", "create"),
  upload.single("file"),
  uploadQuestionPaper,
);
router.delete("/:id", protect, requirePermission("question_bank", "delete"), deleteQuestionPaper);

export default router;
