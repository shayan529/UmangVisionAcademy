import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const achievementSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    badgeId: {
      type: String,
      required: true,
      enum: [
        "first_login",
        "first_lesson",
        "quiz_champ",
        "early_bird",
        "week_warrior",
        "speed_reader",
        "top_of_class",
        "bookworm",
        "test_titan",
        "night_owl",
        "full_marks",
        "legend",
      ],
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
    viewed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Compound index to prevent duplicates
achievementSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
achievementSchema.index({ userId: 1, earnedAt: -1 });

export default model("Achievement", achievementSchema);
