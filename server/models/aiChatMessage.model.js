import mongoose from "mongoose";

const aiChatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    conversationId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

// Loads and deletes a conversation in chronological order. This replaces the
// two single-field indexes above with one index that serves the read path.
aiChatMessageSchema.index({ conversationId: 1, createdAt: 1 });

const AiChatMessage =
  mongoose.models.AiChatMessage ||
  mongoose.model("AiChatMessage", aiChatMessageSchema);

export default AiChatMessage;
