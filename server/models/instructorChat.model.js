import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

// ── Message ───────────────────────────────────────────────────────────────────
// A single message inside a conversation thread.
const messageSchema = new Schema(
  {
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["student", "instructor"],
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    // Media attachments — images, PDFs, videos uploaded via the chat
    media: [
      {
        url:      { type: String, required: true, trim: true },
        filename: { type: String, trim: true, default: "" },
        mimeType: { type: String, trim: true, default: "application/octet-stream" },
        size:     { type: Number, default: 0 },          // bytes
      },
    ],
    // Soft-delete: message removed by sender, shown as "[deleted]"
    deleted: { type: Boolean, default: false },
    // Per-reader read receipts (only track instructor + student, so max 2)
    readBy: [{ type: Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

// ── Conversation ──────────────────────────────────────────────────────────────
// One thread between one student and one instructor, optionally scoped to a
// course and/or a subject within that course.
const conversationSchema = new Schema(
  {
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
    // Subject within the course the student is asking about
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    messages: [messageSchema],
    // Denormalised counters for fast badge rendering
    studentUnread:    { type: Number, default: 0, min: 0 },
    instructorUnread: { type: Number, default: 0, min: 0 },
    lastMessage: {
      text:      { type: String, default: "" },
      at:        { type: Date,   default: null },
      senderRole: { type: String, default: "" },
    },
    // Soft-close: instructor or admin can archive a resolved thread
    archived: { type: Boolean, default: false },
    // Block status: instructor can block student from sending messages
    isBlocked: { type: Boolean, default: false },
    blockedBy: { type: Types.ObjectId, ref: "User", default: null },
    blockedReason: { type: String, trim: true, default: "" },
    // Report status: instructor can report student behavior
    isReported: { type: Boolean, default: false },
    reportReason: { type: String, trim: true, default: "" },
    reportDetails: { type: String, trim: true, default: "" },
    reportedAt: { type: Date, default: null },
    reportedBy: { type: Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// One student can have at most one open thread per instructor+course combo
conversationSchema.index(
  { student: 1, instructor: 1, course: 1 },
  { unique: false },          // allow multiple (different subjects) but index for speed
);
conversationSchema.index({ instructor: 1, updatedAt: -1 }); // instructor thread list
conversationSchema.index({ student: 1,    updatedAt: -1 }); // student thread list

const Conversation = model("InstructorConversation", conversationSchema);

export default Conversation;
