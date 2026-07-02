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
    instructor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    instructorName: {
      type: String,
      default: "Instructor",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectedReason: {
      type: String,
    },
  },
  { timestamps: true }
);

export default model("Note", NoteSchema);
