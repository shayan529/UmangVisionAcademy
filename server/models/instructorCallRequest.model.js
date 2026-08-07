import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const instructorCallRequestSchema = new Schema(
  {
    conversation: {
      type: Types.ObjectId,
      ref: "InstructorConversation",
      required: true,
      index: true,
    },
    student: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    instructor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: Types.ObjectId,
      ref: "Course",
      default: null,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    message: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    response: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    meetingLink: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

instructorCallRequestSchema.index({ instructor: 1, status: 1, createdAt: -1 });
instructorCallRequestSchema.index({ student: 1, status: 1, createdAt: -1 });

export default model("InstructorCallRequest", instructorCallRequestSchema);
