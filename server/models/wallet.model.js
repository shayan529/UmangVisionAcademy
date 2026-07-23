import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["deposit", "purchase", "refund", "coin_redeem", "subscription", "debit", "credit"],
      required: true,
    },
    amount: { type: Number, required: true }, // always positive, in ₹
    description: { type: String, default: "" },
    // How the payment was actually made
    paymentMethod: {
      type: String,
      enum: ["wallet", "razorpay", "internal"],
      default: "wallet",
    },
    // For Razorpay deposits / direct course or subscription payments
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    // For single-course purchases (wallet flow)
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    // For multi-course cart purchases (Razorpay flow)
    courseIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Course",
      default: undefined,
    },
    // For subscription purchases
    planId: { type: String, default: null },
    // For coin redemptions
    coinsRedeemed: { type: Number, default: null },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "refunded", "rejected"],
      default: "none",
    },
    refundReason: { type: String, default: "" },
    refundRequestedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    refundedTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true },
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    transactions: [transactionSchema],
  },
  { timestamps: true },
);

const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
export default Wallet;
