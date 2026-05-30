import mongoose from "mongoose"

const { Schema, model, Types } = mongoose

const lessonSchema = new Schema(
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
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
)

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: "",
    },
    instructor: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    lessons: [lessonSchema],
    students: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    published: {
      type: Boolean,
      default: false,
    },
    durationHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
)

const Course = model("Course", courseSchema)

export default Course
