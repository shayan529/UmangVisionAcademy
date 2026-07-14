import mongoose from "mongoose";

const instructorApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    expertise: { type: String, required: true },
    bio: { type: String, required: true },
    contentLink: { type: String },
    resumeUrl: { type: String }, // ← added
    resumeFileId: { type: String }, // ← for cloudinary deletion later
    reviewNote: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Supports the moderation queue filtered by status and newest-first ordering.
instructorApplicationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model(
  "InstructorApplication",
  instructorApplicationSchema,
);
