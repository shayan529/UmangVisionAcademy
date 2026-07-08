// controllers/questionPaper.controller.js
import QuestionPaper from "../models/questionPaper.model.js";
import { cacheResponse, invalidateCache } from "../utils/redisClient.js";
import User from "../models/user.model.js";
import Wallet from "../models/wallet.model.js";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

export const uploadQuestionPaper = async (req, res) => {
  try {
    const { board, class: cls, subject, year } = req.body;

    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });
    if (!board || !cls || !subject || !year)
      return res.status(400).json({ message: "All fields are required." });

    const fileName = `${board}-${cls}-${subject}-${year}-${Date.now()}.pdf`.replace(
      /\s+/g,
      "_",
    );

    const folder = "question-papers";
    const targetDir = path.join(UPLOADS_DIR, folder);
    await fsPromises.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, fileName);
    await fsPromises.writeFile(filePath, req.file.buffer);

    const baseUrl = process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/uploads/${folder}/${fileName}`;
    const fileId = `${folder}/${fileName}`;

    const paper = await QuestionPaper.findOneAndUpdate(
      { board, class: cls, subject, year: Number(year) },
      {
        board,
        class: cls,
        subject,
        year: Number(year),
        fileUrl,
        fileId, // store for deletion
        fileName,
        uploadedBy: req.user._id,
      },
      { upsert: true, new: true },
    );

    await invalidateCache("questionPapers:public*");
    res.status(200).json({ message: "Uploaded successfully.", paper });
  } catch (err) {
    console.error("[uploadQuestionPaper]", err);
    res.status(500).json({ message: err.message });
  }
};

export const getAllQuestionPapers = async (req, res) => {
  try {
    const papers = await QuestionPaper.find().sort({ createdAt: -1 });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteQuestionPaper = async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found." });

    // Delete from local storage
    if (paper.fileId) {
      try {
        const filePath = path.join(UPLOADS_DIR, paper.fileId);
        await fsPromises.unlink(filePath);
      } catch (err) {
        console.error("Failed to delete local file:", err);
      }
    }

    await paper.deleteOne();
    await invalidateCache("questionPapers:public*");
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getQuestionPapers = async (req, res) => {
  try {
    const { board, class: cls } = req.query;
    const filter = {};
    if (board && board !== "All") filter.board = board;
    if (cls && cls !== "All") filter.class = cls;
    const keyBoard =
      board && board !== "All" ? board.replace(/\s+/g, "_") : "All";
    const keyClass =
      cls && cls !== "All" ? String(cls).replace(/\s+/g, "_") : "All";
    const cacheKey = `questionPapers:public:${keyBoard}:${keyClass}`;
    const papers = await cacheResponse(cacheKey, 30, async () => {
      return await QuestionPaper.find(filter).lean();
    });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkPYQAccess = async (req, res) => {
  try {
    const { board, className, subject, year } = req.body;
    // The latest year (2025) is free
    if (year === 2025 || year === "2025") {
      return res.json({ access: true, reason: "free_year" });
    }

    const pyqId = `${board}_${className}_${subject}_${year}`;
    const user = await User.findById(req.user._id).populate("enrolledCourses");

    if (user.purchasedPYQs?.includes(pyqId)) {
      return res.json({ access: true, reason: "purchased" });
    }

    // Check if enrolled in matching course (case-insensitive)
    const hasCourse = user.enrolledCourses?.some((c) => {
      const matchCat = c.category?.toLowerCase() === className?.toLowerCase();
      const matchTitle = c.title?.toLowerCase() === subject?.toLowerCase();
      return matchCat && matchTitle;
    });

    if (hasCourse) {
      return res.json({ access: true, reason: "course_enrolled" });
    }

    // Otherwise, require purchase
    res.json({ access: false, price: 20 });
  } catch (error) {
    console.error("[checkPYQAccess]", error);
    res.status(500).json({ message: error.message });
  }
};

export const purchasePYQ = async (req, res) => {
  try {
    const { board, className, subject, year } = req.body;
    const pyqId = `${board}_${className}_${subject}_${year}`;
    const price = 20;

    const user = await User.findById(req.user._id);
    if (user.purchasedPYQs?.includes(pyqId)) {
      return res.status(400).json({ message: "Already purchased." });
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balance: 0, transactions: [] });
    }

    if (wallet.balance < price) {
      return res.status(400).json({ message: "Insufficient wallet balance.", code: "INSUFFICIENT_FUNDS" });
    }

    // Deduct and create transaction
    wallet.balance -= price;
    wallet.transactions.push({
      type: "purchase",
      amount: price,
      description: `Purchased PYQ: ${board} ${className} ${subject} ${year}`,
      paymentMethod: "wallet",
      status: "success"
    });

    await wallet.save();

    // Add to user
    user.purchasedPYQs = user.purchasedPYQs || [];
    user.purchasedPYQs.push(pyqId);
    await user.save();

    res.json({ success: true, message: "Purchase successful" });
  } catch (error) {
    console.error("[purchasePYQ]", error);
    res.status(500).json({ message: error.message });
  }
};
 
