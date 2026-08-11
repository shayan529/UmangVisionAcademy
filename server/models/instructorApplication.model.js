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
    designation: { type: String },
    organization: { type: String },
    qualification: { type: String },
    expertise: { type: String, required: true },
    experienceYears: { type: String },
    professionalField: { type: String },
    bio: { type: String, required: true },
    linkedinUrl: { type: String },
    topic: { type: String },
    sessionDescription: { type: String },
    targetGroup: { type: String },
    learningOutcome: { type: String },
    sessionDuration: { type: String },
    sessionFormat: { type: String },
    whatsappNumber: { type: String },
    email: { type: String },
    availability: { type: String },
    additionalInfo: { type: String },
    confirmed: { type: Boolean, default: false },
    contentLink: { type: String },
    resumeUrl: { type: String },
    resumeFileId: { type: String },
    reviewNote: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true, strict: false },
);

// Supports the moderation queue filtered by status and newest-first ordering.
instructorApplicationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model(
  "InstructorApplication",
  instructorApplicationSchema,
);
