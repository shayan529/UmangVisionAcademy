import Razorpay from "razorpay";
import crypto from "crypto";
import Wallet from "../models/wallet.model.js";
import Course from "../models/courses.model.js";
import User from "../models/user.model.js"; // adjust path if different

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Conversion rate: 25 coins = ₹1
const COINS_PER_RUPEE = 25;

// ── Helper: get or create wallet for a user ──────────────────────────────────
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet)
    wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
  return wallet;
};

// ── GET /api/wallet ──────────────────────────────────────────────────────────
export const getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    const transactions = [...wallet.transactions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    res.json({ balance: wallet.balance, transactions });
  } catch (err) {
    console.error("[Wallet] getWallet:", err.message);
    res.status(500).json({ message: "Failed to fetch wallet." });
  }
};

// ── POST /api/wallet/deposit/order ──────────────────────────────────────────
export const createDepositOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10)
      return res.status(400).json({ message: "Minimum deposit is ₹10." });
    if (amount > 50000)
      return res.status(400).json({ message: "Maximum deposit is ₹50,000." });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `wallet_${req.user._id}_${Date.now()}`,
      notes: { userId: req.user._id.toString(), purpose: "wallet_deposit" },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[Wallet] createDepositOrder:", err.message);
    res.status(500).json({ message: "Failed to create payment order." });
  }
};

// ── POST /api/wallet/deposit/verify ─────────────────────────────────────────
export const verifyDeposit = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } =
      req.body;

    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSig !== razorpaySignature)
      return res.status(400).json({ message: "Payment verification failed." });

    const wallet = await getOrCreateWallet(req.user._id);
    const alreadyCredited = wallet.transactions.some(
      (t) => t.razorpayPaymentId === razorpayPaymentId,
    );
    if (alreadyCredited)
      return res.status(409).json({ message: "Payment already credited." });

    const amountInRupees = amount / 100;
    wallet.balance += amountInRupees;
    wallet.transactions.push({
      type: "deposit",
      amount: amountInRupees,
      description: "Wallet top-up via Razorpay",
      razorpayOrderId,
      razorpayPaymentId,
      status: "success",
    });
    await wallet.save();

    res.json({
      message: "Wallet credited successfully.",
      balance: wallet.balance,
    });
  } catch (err) {
    console.error("[Wallet] verifyDeposit:", err.message);
    res.status(500).json({ message: "Failed to verify payment." });
  }
};

// ── POST /api/wallet/deposit/mock ────────────────────────────────────────────
export const mockDeposit = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production")
      return res
        .status(403)
        .json({ message: "Mock payments disabled in production." });

    const { amount } = req.body;
    if (!amount || amount < 1)
      return res.status(400).json({ message: "Amount must be at least ₹1." });

    const wallet = await getOrCreateWallet(req.user._id);
    wallet.balance += Number(amount);
    wallet.transactions.push({
      type: "deposit",
      amount: Number(amount),
      description: "Mock deposit (test mode)",
      status: "success",
    });
    await wallet.save();

    res.json({ message: `₹${amount} added (mock).`, balance: wallet.balance });
  } catch (err) {
    console.error("[Wallet] mockDeposit:", err.message);
    res.status(500).json({ message: "Mock deposit failed." });
  }
};

// ── POST /api/wallet/redeem-coins ────────────────────────────────────────────
// Converts the user's earned coins into wallet balance (25 coins = ₹1)
export const redeemCoins = async (req, res) => {
  try {
    const { coins } = req.body;
    const numCoins = Number(coins);

    if (!numCoins || numCoins < COINS_PER_RUPEE) {
      return res.status(400).json({
        message: `Minimum redemption is ${COINS_PER_RUPEE} coins (₹1).`,
      });
    }
    if (!Number.isInteger(numCoins)) {
      return res.status(400).json({ message: "Coins must be a whole number." });
    }

    // Fetch user and check coin balance
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const availableCoins = user.coins ?? 0;
    if (availableCoins < numCoins) {
      return res.status(402).json({
        message: `Not enough coins. You have ${availableCoins} but tried to redeem ${numCoins}.`,
        available: availableCoins,
      });
    }

    const rupeesEarned = parseFloat((numCoins / COINS_PER_RUPEE).toFixed(2));

    // Deduct coins from user atomically
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { coins: -numCoins },
    });

    // Credit wallet
    const wallet = await getOrCreateWallet(req.user._id);
    wallet.balance += rupeesEarned;
    wallet.transactions.push({
      type: "coin_redeem",
      amount: rupeesEarned,
      description: `Redeemed ${numCoins} coins`,
      coinsRedeemed: numCoins,
      status: "success",
    });
    await wallet.save();

    res.json({
      message: `${numCoins} coins redeemed for ${rupeesEarned.toFixed(2)}.`,
      balance: wallet.balance,
      coinsRemaining: availableCoins - numCoins,
    });
  } catch (err) {
    console.error("[Wallet] redeemCoins:", err.message);
    res.status(500).json({ message: "Coin redemption failed." });
  }
};

// ── POST /api/wallet/pay ─────────────────────────────────────────────────────
export const payWithWallet = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId)
      return res.status(400).json({ message: "courseId is required." });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found." });

    const price = course.price || 0;
    if (price <= 0)
      return res.status(400).json({ message: "This course is free." });

    const wallet = await getOrCreateWallet(req.user._id);
    if (wallet.balance < price) {
      return res.status(402).json({
        message: `Insufficient balance. You need ₹${price} but have ₹${wallet.balance.toFixed(2)}.`,
        required: price,
        available: wallet.balance,
      });
    }

    const alreadyPurchased = course.students?.some(
      (id) => id.toString() === req.user._id.toString(),
    );
    if (alreadyPurchased)
      return res.status(409).json({ message: "You already own this course." });

    wallet.balance -= price;
    wallet.transactions.push({
      type: "purchase",
      amount: price,
      description: `Course: ${course.title}`,
      courseId: course._id,
      status: "success",
    });
    await wallet.save();

    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { students: req.user._id },
    });

    res.json({
      message: `Enrolled in "${course.title}" successfully.`,
      balance: wallet.balance,
    });
  } catch (err) {
    console.error("[Wallet] payWithWallet:", err.message);
    res.status(500).json({ message: "Payment failed." });
  }
};
