import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
    },
    date: {
      type: String,
      default: "TBD",
    },
    time: {
      type: String,
      default: "TBD",
    },
    status: {
      type: String,
      enum: ["upcoming", "live", "ended"],
      default: "upcoming",
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    class: {
      type: String,
      default: null,
    },
    subject: {
      type: String,
      default: null,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    // Subject *within* the assigned course this session belongs to (optional).
    // Matches lesson.subject so the recorded lesson is filed under the right subject.
    courseSubject: {
      type: String,
      default: null,
      trim: true,
    },
    // Populated automatically when the session ends (if a course is assigned).
    // Instructors/admins can also set/override this manually.
    recordedUrl: {
      type: String,
      default: null,
      trim: true,
    },
    // True once the recorded lesson has been pushed into the course lessons array,
    // so re-ending or re-saving does not create duplicate lessons.
    recordedLessonAdded: {
      type: Boolean,
      default: false,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Match the instructor and course session feeds, both ordered by date.
sessionSchema.index({ instructor: 1, date: 1 });
sessionSchema.index({ course: 1, date: 1 });

const Session = mongoose.model("Session", sessionSchema);
export default Session;
