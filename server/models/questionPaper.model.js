// models/questionPaper.model.js
import mongoose from "mongoose";

const questionPaperSchema = new mongoose.Schema(
  {
    board: { type: String, required: true, enum: ["CBSE", "MP Board", "ICSE"] },
    class: { type: String, required: true },
    subject: { type: String, required: true },
    year: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    fileId: { type: String }, // Relative path used for file deletion (e.g. "question-papers/filename.pdf")
    fileName: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

questionPaperSchema.index(
  { board: 1, class: 1, subject: 1, year: 1 },
  { unique: true },
);

export default mongoose.model("QuestionPaper", questionPaperSchema);
