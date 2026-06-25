import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

const User = model("User", userSchema);

export default User;
