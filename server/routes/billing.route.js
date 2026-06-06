import express from "express";
import {
  getSubscription,
  createOrder,
  verifyPayment,
  cancelSubscription,
} from "../controllers/billing.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/subscription", protect, getSubscription); // GET  current plan
router.post("/create-order", protect, createOrder); // POST create Razorpay order
router.post("/verify-payment", protect, verifyPayment); // POST verify + activate
router.post("/cancel", protect, cancelSubscription); // POST cancel plan

export default router;
