import mongoose from "mongoose";
import { deleteKeys } from "../utils/redisClient.js";

const { Schema, model, Types } = mongoose;

const lessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    durationMinutes: { type: Number, default: 0, min: 0 },
    videoUrl: { type: String, trim: true, default: "" },
    chapterTitle: { type: String, trim: true, default: "" },
    subject: { type: String, trim: true, default: "" },
    type: { type: String, enum: ["video", "text"], default: "video" },
    content: { type: String, trim: true, default: "" },
    pdfUrl: { type: String, trim: true, default: "" }, // URL of the original uploaded PDF file
  },
  { _id: false },
);

const ratingSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "General" },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    price: { type: Number, default: 0, min: 0 },
    thumbnailUrl: { type: String, trim: true, default: "" },
    demoVideoUrl: { type: String, trim: true, default: "" },
    instructor: { type: Types.ObjectId, ref: "User", required: true },
    lessons: [lessonSchema],
    students: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: String, trim: true }],

    // ── Approval workflow ─────────────────────────────────────────────────────
    // Instructors submit courses; admin approves before they go live.
    // "draft"   — instructor hasn't submitted yet (save without publish)
    // "pending" — instructor clicked "Publish" → waiting for admin approval
    // "approved"— admin approved → course is publicly visible
    // "rejected"— admin rejected → instructor can edit and resubmit
    approvalStatus: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
    },
    rejectionReason: { type: String, trim: true, default: "" },
    published: { type: Boolean, default: false }, // true only when approvalStatus === 'approved'

    durationHours: { type: Number, default: 0, min: 0 },
    ratings: [ratingSchema],
    reviewCount: { type: Number, default: 0, min: 0 },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    board: { type: String, trim: true, default: "" },
    language: { type: String, trim: true, default: "" },
    quiz: {
      title: { type: String, default: "Final Course Quiz" },
      questions: [
        {
          question: { type: String, required: true },
          options: [{ type: String, required: true }],
          correctOptionIndex: { type: Number, required: true },
        },
      ],
    },
    subjectQuizzes: [
      {
        subject: { type: String, required: true, trim: true },
        title: { type: String, default: "Subject Quiz" },
        questions: [
          {
            question: { type: String, required: true },
            options: [{ type: String, required: true }],
            correctOptionIndex: { type: Number, required: true },
          },
        ],
      },
    ],
    subjectDetails: [
      {
        subject: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        content: { type: String, trim: true, default: "" },
      },
    ],
    certificate: {
      enabled: { type: Boolean, default: false },
      title: { type: String, default: "Certificate of Completion" },
      signatoryName: { type: String, default: "" },
      signatoryTitle: { type: String, default: "" },
      theme: { type: String, default: "purple" },
    },
    notes: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        fileUrl: { type: String, required: true },
        subject: { type: String, trim: true, default: "" },
        // Every note starts "pending" and only becomes visible to students
        // once an admin/moderator approves it (see note.controller.js).
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        rejectedReason: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true },
);

courseSchema.methods.recalcRatings = function () {
  const ratings = this.ratings ?? [];
  this.reviewCount = ratings.length;
  this.ratingAverage =
    ratings.length > 0
      ? Math.round(
        (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10,
      ) / 10
      : 0;
};

courseSchema.index({ approvalStatus: 1, published: 1, createdAt: -1 });
// Powers instructor dashboards and the membership lookups used by student
// course, session, and notes feeds.
courseSchema.index({ instructor: 1, createdAt: -1 });
courseSchema.index({ students: 1 });

// ── Cache invalidation hooks ──────────────────────────────────────────────────
// Automatically invalidates the Redis public courses list ("courses:published")
// and the specific public course detail cache when a course is created, updated,
// or deleted.
const clearCourseCache = async (doc) => {
  try {
    const keys = ["courses:published"];
    const id = doc?._id || doc?.id;
    if (id) {
      keys.push(`course:public:${id.toString()}`);
      keys.push(`course:detail:${id.toString()}`);
    }
    await deleteKeys(keys);
  } catch (err) {
    console.error("[Mongoose Middleware] Failed to clear course cache:", err);
  }
};

courseSchema.post("save", clearCourseCache);
courseSchema.post("remove", clearCourseCache);
courseSchema.post("deleteOne", { document: true, query: true }, clearCourseCache);
courseSchema.post("deleteMany", clearCourseCache);
courseSchema.post("findOneAndDelete", clearCourseCache);
courseSchema.post("findOneAndRemove", clearCourseCache);
courseSchema.post("updateOne", clearCourseCache);
courseSchema.post("updateMany", clearCourseCache);

export default model("Course", courseSchema);
