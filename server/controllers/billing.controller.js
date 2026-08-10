import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/user.model.js";
import Course from "../models/courses.model.js";
import Cart from "../models/cart.model.js";
import Wallet from "../models/wallet.model.js";
import { invalidateCourseCache } from "./course.controller.js";
import {
  sendPlanPurchaseEmail,
  sendCourseEnrollmentEmail,
  sendSubscriptionCancellationEmail,
} from "../utils/Mailer.js";

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

const getRazorpayInstance = () => {
  if (isPlaceholderRazorpayConfig()) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const PLANS = {
  basic: {
    id: "basic",
    label: "Basic Plan",
    amount: 10000, // ₹100 in paise
    durationDays: 365,
  },
  base: {
    id: "basic",
    label: "Basic Plan",
    amount: 10000, // backward-compatibility alias
    durationDays: 365,
  },
  premium: {
    id: "premium",
    label: "Premium Plan",
    amount: 50000, // ₹500 in paise
    durationDays: 365,
  },
  elite: {
    id: "elite",
    label: "Elite Plan",
    amount: 100000, // ₹1,000 in paise
    durationDays: 365,
  },
};

// ── Helper: get or create wallet for a user ──────────────────────────────────
// Used purely as a transaction ledger here — balance is left untouched since
// these payments go directly through Razorpay, never through wallet funds.
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet)
    wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
  return wallet;
};

// ── GET /billing/subscription ─────────────────────────────────────────────────
export const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("subscription")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const sub = user.subscription;
    if (!sub?.plan) return res.json(null);

    const now = new Date();
    if (sub.endDate && new Date(sub.endDate) < now) {
      await User.findByIdAndUpdate(req.user._id, {
        "subscription.status": "expired",
      });
      return res.json({ ...sub, status: "expired" });
    }

    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /billing/create-order ────────────────────────────────────────────────
// Handles both subscription plans AND cart course purchases
export const createOrder = async (req, res) => {
  try {
    const { planId, courseIds, selectedClass } = req.body;
    let orderAmount;
    let notes = { userId: req.user._id.toString() };

    if (planId === "cart" && Array.isArray(courseIds)) {
      const courses = await Course.find({ _id: { $in: courseIds } })
        .select("price")
        .lean();
      const subtotal = courses.reduce((s, c) => s + (c.price ?? 0), 0);
      orderAmount = Math.max(0, subtotal) * 100; // paise
      notes.type = "cart";
      notes.courseIds = courseIds.join(",");
    } else {
      const plan = PLANS[planId];
      if (!plan) return res.status(400).json({ message: "Invalid plan." });
      orderAmount = plan.amount;
      notes.type = "subscription";
      notes.planId = planId;
      if (selectedClass) notes.selectedClass = selectedClass;
    }

    if (orderAmount === 0)
      return res
        .status(400)
        .json({ message: "Nothing to pay — use free enrol instead." });

    const mockOrderId = `mock_order_${Date.now()}`;
    return res.json({
      orderId: mockOrderId,
      amount: orderAmount,
      currency: "INR",
      keyId: "dummy",
      planId: planId ?? "cart",
      mockMode: true,
      selectedClass: selectedClass || null,
    });

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res
        .status(500)
        .json({ message: "Razorpay client is not initialized properly." });
    }

    const order = await razorpay.orders.create({
      amount: orderAmount,
      currency: "INR",
      receipt: `rcpt_${req.user._id}_${Date.now()}`,
      notes,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planId: planId ?? "cart",
    });
  } catch (err) {
    console.error("create-order error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── POST /billing/verify-payment ──────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      courseIds,
      selectedClass,
    } = req.body;

    const isMock = razorpay_order_id?.startsWith("mock_");
    const testSuffix = isMock ? " (Test Payment)" : "";

    if (!isMock) {
      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      if (expected !== razorpay_signature)
        return res
          .status(400)
          .json({ message: "Payment verification failed." });
    }

    // ── Subscription plan payment ───────────────────────────────────────────
    if (planId && planId !== "cart" && PLANS[planId]) {
      const plan = PLANS[planId];
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);
      const subscription = {
        plan: plan.id,
        label: plan.label,
        status: "active",
        startDate,
        endDate,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      };

      const updateData = { subscription };
      if (selectedClass) {
        updateData.selectedClass = selectedClass;
      }

      await User.findByIdAndUpdate(req.user._id, updateData);

      // ── Log it so Purchase History can show it ─────────────────────────────
      const wallet = await getOrCreateWallet(req.user._id);
      wallet.transactions.push({
        type: "subscription",
        amount: plan.amount / 100,
        description: `${plan.label} Subscription${testSuffix}`,
        paymentMethod: "razorpay",
        planId: plan.id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: "success",
      });
      await wallet.save();

      const user = await User.findById(req.user._id);
      if (
        user &&
        user.email &&
        user.notificationSettings?.emailNotifications !== false
      ) {
        sendPlanPurchaseEmail(
          user.email,
          user.name,
          plan.label,
          user._id,
        ).catch(console.error);
      }

      return res.json({ message: "Plan activated.", subscription });
    }

    // ── Cart course payment — enrol student ─────────────────────────────────
    if (Array.isArray(courseIds) && courseIds.length > 0) {
      const courses = await Course.find({ _id: { $in: courseIds } })
        .select("price title")
        .lean();

      await Promise.all(
        courseIds.map((id) =>
          Course.findByIdAndUpdate(id, {
            $addToSet: { students: req.user._id },
          }),
        ),
      );
      await Promise.all(
        courseIds.map((id) =>
          invalidateCourseCache(id).catch((err) =>
            console.error(
              "[Cache] Failed to invalidate course cache:",
              err.message,
            ),
          ),
        ),
      );
      const { withInstructorAssistance, assistanceCourseIds } = req.body;
      const targetAssistanceIds =
        Array.isArray(assistanceCourseIds) && assistanceCourseIds.length > 0
          ? assistanceCourseIds
          : withInstructorAssistance
          ? courseIds
          : [];

      const userUpdate = {
        $addToSet: { enrolledCourses: { $each: courseIds } },
      };
      if (targetAssistanceIds.length > 0) {
        userUpdate.$addToSet.instructorAssistanceCourses = {
          $each: targetAssistanceIds,
        };
      }

      await User.findByIdAndUpdate(req.user._id, userUpdate);
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { $pull: { courses: { $in: courseIds } } },
      );

      // ── Log it so Purchase History can show it ─────────────────────────────
      const subtotal = courses.reduce((s, c) => s + (c.price ?? 0), 0);
      const amountPaid = Math.max(0, subtotal);

      const wallet = await getOrCreateWallet(req.user._id);
      wallet.transactions.push({
        type: "purchase",
        amount: amountPaid,
        description:
          (courses.length === 1
            ? `Course: ${courses[0].title}`
            : `${courses.length} courses: ${courses.map((c) => c.title).join(", ")}`) +
          testSuffix,
        paymentMethod: "razorpay",
        courseIds,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: "success",
      });
      await wallet.save();

      const user = await User.findById(req.user._id);
      if (
        user &&
        user.email &&
        user.notificationSettings?.emailNotifications !== false
      ) {
        const courseTitles = courses.map((c) => c.title);
        sendCourseEnrollmentEmail(
          user.email,
          user.name,
          courseTitles,
          user._id,
        ).catch(console.error);
      }

      return res.json({
        message: "Enrolled successfully.",
        enrolled: courseIds,
      });
    }

    res.json({ message: "Payment verified." });
  } catch (err) {
    console.error("verify-payment error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── POST /billing/cancel ──────────────────────────────────────────────────────
export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "subscription email name notificationSettings",
    );
    if (!user?.subscription?.plan) {
      return res.status(400).json({ message: "No active subscription found." });
    }

    const planLabel = user.subscription.label || user.subscription.plan;

    await User.findByIdAndUpdate(req.user._id, {
      "subscription.status": "cancelled",
    });

    if (user.email && user.notificationSettings?.emailNotifications !== false) {
      sendSubscriptionCancellationEmail(
        user.email,
        user.name,
        planLabel,
        user._id,
      ).catch(console.error);
    }

    res.json({
      message:
        "Subscription cancelled successfully. It will stay active until the current billing period ends.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
