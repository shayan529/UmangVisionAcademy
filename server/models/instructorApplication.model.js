import mongoose from "mongoose";

const instructorApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Core details
    name: { type: String, required: true },
    designation: { type: String },
    organization: { type: String },
    highestQualification: { type: String },
    expertise: { type: String, required: true }, // Area of Expertise
    yearsOfExperience: { type: String },
    professionalField: { type: String },
    bio: { type: String, required: true }, // Short Self-Introduction
    linkedinProfile: { type: String },
    contentLink: { type: String },
    resumeUrl: { type: String },
    resumeFileId: { type: String },

    // Proposed Guidance Session Details
    guidanceTopic: { type: String },
    sessionDescription: { type: String },
    targetGroup: { type: String },
    learningOutcome: { type: String },
    preferredDuration: { type: String, default: "45 Minutes" },
    preferredFormat: { type: String, default: "Live Online Session" },
    availabilityDays: { type: String },
    additionalInfo: { type: String },
    confirmedContribution: { type: Boolean, default: false },

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
