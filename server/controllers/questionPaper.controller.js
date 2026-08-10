// controllers/questionPaper.controller.js
import QuestionPaper from "../models/questionPaper.model.js";
import { cacheResponse, invalidateCache } from "../utils/redisClient.js";
import User from "../models/user.model.js";
import Wallet from "../models/wallet.model.js";
import crypto from "crypto";
import Razorpay from "razorpay";
import { getPYQAccessResult, PYQ_PRICE } from "../utils/pyqAccess.js";
import {
  uploadFileToStorage,
  deleteFileFromStorage,
} from "../utils/vercelBlob.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const isPlaceholderRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

  return (
    !keyId ||
    !keySecret ||
    /xxxx|your_secret|your_razorpay_secret_here/i.test(keyId) ||
    /xxxx|your_secret|your_razorpay_secret_here/i.test(keySecret)
  );
};

export const uploadQuestionPaper = async (req, res) => {
  try {
    const { board, class: cls, subject, year } = req.body;

    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });
    if (!board || !cls || !subject || !year)
      return res.status(400).json({ message: "All fields are required." });

    const fileName =
      `${board}-${cls}-${subject}-${year}-${Date.now()}.pdf`.replace(
        /\s+/g,
        "_",
      );

    const uploadResult = await uploadFileToStorage({
      folder: "question-papers",
      fileName,
      buffer: req.file.buffer,
      filePath: req.file.path,
      contentType: req.file.mimetype || "application/pdf",
    });

    const paper = await QuestionPaper.findOneAndUpdate(
      { board, class: cls, subject, year: Number(year) },
      {
        board,
        class: cls,
        subject,
        year: Number(year),
        fileUrl: uploadResult.url,
        fileId: uploadResult.fileId, // store for deletion
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

    // Delete file using storage utility (Vercel Blob or local)
    if (paper.fileId || paper.fileUrl) {
      await deleteFileFromStorage(paper.fileId || paper.fileUrl);
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
    const papers = await cacheResponse(cacheKey, 600, async () => {
      return await QuestionPaper.find(filter).lean();
    });

    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Cache-Control",
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=7200",
      );
    }

    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkPYQAccess = async (req, res) => {
  try {
    const { board, className, subject, year } = req.body;
    const user = await User.findById(req.user._id).populate("enrolledCourses");

    const accessResult = getPYQAccessResult({
      year,
      purchasedPYQs: user.purchasedPYQs || [],
      enrolledCourses: user.enrolledCourses || [],
      className,
      subject,
      board,
      subscription: user.subscription,
      selectedClass: user.selectedClass,
    });

    res.json({ ...accessResult, price: accessResult.price ?? PYQ_PRICE });
  } catch (error) {
    console.error("[checkPYQAccess]", error);
    res.status(500).json({ message: error.message });
  }
};

const grantPYQAccess = async ({
  userId,
  board,
  className,
  subject,
  year,
  paymentMethod,
  paymentDetails = {},
}) => {
  const pyqId = `${board}_${className}_${subject}_${year}`;
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.purchasedPYQs?.includes(pyqId)) {
    return { success: true, message: "Already purchased." };
  }

  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
  }

  if (paymentMethod === "wallet") {
    if (wallet.balance < PYQ_PRICE) {
      const error = new Error("Insufficient wallet balance.");
      error.code = "INSUFFICIENT_FUNDS";
      throw error;
    }

    wallet.balance -= PYQ_PRICE;
    wallet.transactions.push({
      type: "purchase",
      amount: PYQ_PRICE,
      description: `Purchased PYQ: ${board} ${className} ${subject} ${year}`,
      paymentMethod: "wallet",
      status: "success",
    });
    await wallet.save();
  } else {
    wallet.transactions.push({
      type: "purchase",
      amount: PYQ_PRICE,
      description: `Purchased PYQ via Razorpay: ${board} ${className} ${subject} ${year}`,
      paymentMethod: "razorpay",
      status: "success",
      razorpayOrderId: paymentDetails.razorpayOrderId,
      razorpayPaymentId: paymentDetails.razorpayPaymentId,
    });
    await wallet.save();
  }

  user.purchasedPYQs = user.purchasedPYQs || [];
  user.purchasedPYQs.push(pyqId);
  await user.save();

  return { success: true, message: "Purchase successful" };
};

export const createPYQOrder = async (req, res) => {
  try {
    const { board, className, subject, year } = req.body;
    const amount = PYQ_PRICE * 100;

    return res.json({
      orderId: `mock_order_${Date.now()}`,
      amount,
      currency: "INR",
      keyId: "dummy",
      mockMode: true,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `pyq_${req.user._id}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        type: "question_paper",
        board,
        className,
        subject,
        year: String(year),
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      mockMode: false,
    });
  } catch (error) {
    console.error("[createPYQOrder]", error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyPYQPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      board,
      className,
      subject,
      year,
    } = req.body;

    const isMock = razorpay_order_id?.startsWith("mock_");
    if (!isMock) {
      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expected !== razorpay_signature) {
        return res
          .status(400)
          .json({ message: "Payment verification failed." });
      }
    }

    const result = await grantPYQAccess({
      userId: req.user._id,
      board,
      className,
      subject,
      year,
      paymentMethod: "razorpay",
      paymentDetails: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    res.json(result);
  } catch (error) {
    console.error("[verifyPYQPayment]", error);
    if (error.code === "INSUFFICIENT_FUNDS") {
      return res.status(400).json({ message: error.message, code: error.code });
    }
    res.status(500).json({ message: error.message });
  }
};

export const purchasePYQ = async (req, res) => {
  try {
    const { board, className, subject, year } = req.body;
    const result = await grantPYQAccess({
      userId: req.user._id,
      board,
      className,
      subject,
      year,
      paymentMethod: "wallet",
    });

    res.json(result);
  } catch (error) {
    console.error("[purchasePYQ]", error);
    if (error.code === "INSUFFICIENT_FUNDS") {
      return res.status(400).json({ message: error.message, code: error.code });
    }
    res.status(500).json({ message: error.message });
  }
};
