import mongoose from "mongoose";

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      default: "New conversation",
    },
    userRole: {
      type: String,
      enum: ["student", "instructor"],
      required: true,
      default: "student",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Compound index for fetching a user's conversations by role in order of recency
aiConversationSchema.index({ userId: 1, userRole: 1, lastMessageAt: -1 });

const AiConversation =
  mongoose.models.AiConversation ||
  mongoose.model("AiConversation", aiConversationSchema);

export default AiConversation;
