// models/MockTest.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }], // array of 4 options
  correctOption: { type: Number, required: true }, // 0-indexed
  explanation: { type: String, default: "" },
  marks: { type: Number, default: 1 },
});

const mockTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subject: { type: String, required: true }, // e.g. "Mathematics", "Science"
    class: { type: String, required: true }, // e.g. "Class 10"
    board: {
      type: String,
      enum: ["CBSE", "ICSE", "MP Board", "All"],
      default: "All",
    },
    duration: { type: Number, required: true }, // in minutes
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    questions: [questionSchema],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: { type: Boolean, default: true },
    attempts: { type: Number, default: 0 }, // total attempts count
    tags: [{ type: String }],
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  },
  { timestamps: true },
);

// Serves an instructor's newest-first dashboard without scanning all tests.
mockTestSchema.index({ instructor: 1, createdAt: -1 });
// Covers the common public catalogue request before optional filters are
// applied, while avoiding an index for every combination of filters.
mockTestSchema.index({ isPublished: 1, createdAt: -1 });

export default mongoose.model("MockTest", mockTestSchema);
