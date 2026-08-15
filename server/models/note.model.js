import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const NoteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    fileUrl: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    chapterTitle: {
      type: String,
      trim: true,
      default: "",
    },
    instructor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    instructorName: {
      type: String,
      default: "Instructor",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectedReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// These replace the single-field indexes and match the two list endpoints.
NoteSchema.index({ instructor: 1, createdAt: -1 });
NoteSchema.index({ status: 1, createdAt: -1 });

export default model("Note", NoteSchema);
