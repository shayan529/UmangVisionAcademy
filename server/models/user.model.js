import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { deleteKey, deleteKeys } from "../utils/redisClient.js";

const { Schema, model, Types } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    roles: {
      type: [Schema.Types.Mixed],
      default: ["student"],
    },
    // Independent of `roles` above — a user can be `roles: ["instructor"]`
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: null,
    },
    coins: { type: Number, default: 0, min: 0 },
    // Idempotency keys prevent retries from earning a course reward twice.
    coinRewardKeys: { type: [String], default: [] },
    referralCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      sparse: true,
      default: null,
    },
    referredBy: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },
    referralsCount: { type: Number, default: 0, min: 0 },

    // Tracks the calendar date (IST midnight) of the last coin awarded for login.
    // Used to ensure only 1 coin is given per calendar day regardless of how
    // many times the user logs in.
    lastLoginReward: { type: Date, default: null },

    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    fatherName: {
      type: String,
      trim: true,
      default: "",
    },
    motherName: {
      type: String,
      trim: true,
      default: "",
    },
    fullAddress: {
      type: String,
      trim: true,
      default: "",
    },
    socialMediaAccount: {
      type: String,
      trim: true,
      default: "",
    },
    fatherMobileNumber: {
      type: String,
      trim: true,
      default: "",
    },
    reference: {
      type: String,
      trim: true,
      default: "",
    },
    vidhansabha: {
      type: String,
      trim: true,
      default: "",
    },
    enrolledCourses: [
      {
        type: Types.ObjectId,
        ref: "Course",
      },
    ],
    // Per-course lesson progress stored as: { [courseId]: { completed: [idx], lastLesson, lessonProgress: { [lessonIdx]: seconds } } }
    courseProgress: {
      type: Schema.Types.Mixed,
      default: {},
    },
    score: {
      type: Number,
      default: 0,
    },
    quizSubmissions: [
      {
        courseId: {
          type: Types.ObjectId,
          ref: "Course",
          required: true,
        },
        title: {
          type: String,
          default: "Final Quiz",
        },
        score: {
          type: Number,
          required: true,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    earnedCertificates: [
      {
        courseId: { type: Types.ObjectId, ref: "Course" },
        courseTitle: { type: String, default: "" },
        issuedAt: { type: Date, default: Date.now },
        theme: { type: String, default: "purple" },
        certificateTitle: {
          type: String,
          default: "Certificate of Completion",
        },
        signatoryName: { type: String, default: "" },
        signatoryTitle: { type: String, default: "" },
        instructorName: { type: String, default: "" },
      },
    ],
    teachingCourses: [
      {
        type: Types.ObjectId,
        ref: "Course",
      },
    ],
    subscription: {
      plan: { type: String, enum: ["base", "premium"], default: null },
      label: { type: String, default: "" },
      status: {
        type: String,
        enum: ["active", "expired", "cancelled"],
        default: null,
      },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      razorpayOrderId: { type: String, default: "" },
      razorpayPaymentId: { type: String, default: "" },
    },
    selectedClass: { type: String, default: null },
    specialization: {
      type: String,
      trim: true,
      default: "",
    },
    notificationSettings: {
      liveClass: { type: Boolean, default: true },
      newCourse: { type: Boolean, default: true },
      community: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      liveSessionAlerts: { type: Boolean, default: true },
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    devices: [
      {
        userAgent: { type: String, default: "" },
        ip: { type: String, default: "" },
        lastLogin: { type: Date, default: Date.now },
      },
    ],
    purchasedPYQs: [{ type: String }],
    // ── Moderation fields ────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
    banReason: { type: String, default: "" },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, default: "" },
    // ── Email unsubscribe ─────────────────────────────────────────────────────
    // A stable, random token used in one-click unsubscribe links. Generated
    // once and never rotated so old links in sent emails keep working.
    unsubscribeToken: { type: String, default: null, index: true },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ roles: 1, coins: -1, updatedAt: -1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Cache Invalidation Middleware for Redis
const invalidateUserCache = async (userId) => {
  if (!userId) return;
  try {
    await deleteKey(`user:${userId.toString()}`);
    console.log(`[Redis Cache] Invalidated cache for user:${userId.toString()}`);
  } catch (err) {
    console.error(`[Redis Cache] Failed to invalidate cache for user:${userId.toString()}:`, err);
  }
};

userSchema.post("save", async function (doc) {
  if (doc && doc._id) {
    await invalidateUserCache(doc._id);
  }
});

userSchema.post("findOneAndUpdate", async function (doc) {
  if (doc && doc._id) {
    await invalidateUserCache(doc._id);
  }
  const filter = this.getFilter();
  if (filter && filter._id) {
    await invalidateUserCache(filter._id);
  }
});

userSchema.post("findOneAndDelete", async function (doc) {
  if (doc && doc._id) {
    await invalidateUserCache(doc._id);
  }
  const filter = this.getFilter();
  if (filter && filter._id) {
    await invalidateUserCache(filter._id);
  }
});

userSchema.post("updateOne", async function () {
  const filter = this.getFilter();
  if (filter && filter._id) {
    await invalidateUserCache(filter._id);
  }
});

userSchema.post("updateMany", async function () {
  try {
    const filter = this.getFilter();
    if (filter && filter._id) {
      if (filter._id.$in && Array.isArray(filter._id.$in)) {
        const keys = filter._id.$in.map((id) => `user:${id.toString()}`);
        await deleteKeys(keys);
        console.log(`[Redis Cache] Invalidated batch user caches:`, keys);
      } else {
        await invalidateUserCache(filter._id);
      }
    }
  } catch (err) {
    console.error("[Redis Cache] updateMany cache invalidation failed:", err);
  }
});

const User = model("User", userSchema);

export default User;
