import mongoose from "mongoose";

const newsCacheSchema = new mongoose.Schema(
  {
    lang: {
      type: String,
      required: true,
      unique: true,
    },
    articles: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("NewsCache", newsCacheSchema);
