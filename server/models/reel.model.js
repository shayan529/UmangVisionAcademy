import mongoose from "mongoose";

const ReelSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    videoUrl: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    instructorName: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    views: { type: Number, default: 0 },
    rejectedReason: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("Reel", ReelSchema);
