// models/MockTestAttempt.js
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedOption: { type: Number, default: null }, // null = unanswered, 0-3
  isCorrect: { type: Boolean, default: false },
  marksEarned: { type: Number, default: 0 },
});

const mockTestAttemptSchema = new mongoose.Schema(
  {
    mockTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockTest",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    timeTaken: { type: Number, default: 0 }, // in seconds
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: ["in-progress", "completed", "timed-out"],
      default: "in-progress",
    },
  },
  { timestamps: true },
);

// Prevent duplicate in-progress attempts
mockTestAttemptSchema.index(
  { mockTest: 1, student: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "in-progress" },
  },
);

// Student results and analytics are always scoped to a completed status.
mockTestAttemptSchema.index({ student: 1, status: 1, submittedAt: -1 });
// The leaderboard filters completed attempts and sorts by score, then speed.
mockTestAttemptSchema.index({ mockTest: 1, status: 1, score: -1, timeTaken: 1 });

export default mongoose.model("MockTestAttempt", mockTestAttemptSchema);
