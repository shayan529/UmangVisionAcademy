import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["deposit", "purchase", "refund"],
            required: true,
        },
        amount: { type: Number, required: true }, // always positive
        description: { type: String, default: "" },
        // For Razorpay deposits
        razorpayOrderId: { type: String, default: null },
        razorpayPaymentId: { type: String, default: null },
        // For course purchases
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
        status: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "success",
        },
    },
    { timestamps: true }
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
    { timestamps: true }
);

const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
export default Wallet;