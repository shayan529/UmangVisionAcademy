import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const lessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    durationMinutes: { type: Number, default: 0, min: 0 },
    videoUrl: { type: String, trim: true, default: "" },
    chapterTitle: { type: String, trim: true, default: "" },
    type: { type: String, enum: ["video", "text"], default: "video" },
    content: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

// ── Rating sub-document ───────────────────────────────────────────────────────
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
    summary: { type: String, required: true, trim: true },
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
    published: { type: Boolean, default: false },
    durationHours: { type: Number, default: 0, min: 0 },

    // ── Ratings ───────────────────────────────────────────────────────────────
    ratings: [ratingSchema], // individual ratings from students
    reviewCount: { type: Number, default: 0, min: 0 }, // auto-maintained
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 }, // auto-maintained

    board: { type: String, trim: true, default: "" },
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
  },
  { timestamps: true },
);

// ── Auto-recalculate ratingAverage and reviewCount on save ────────────────────
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

export default model("Course", courseSchema);
