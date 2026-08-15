import mongoose from "mongoose";

const { Schema, model } = mongoose;

const studentHubSchema = new Schema(
  {
    section: {
      type: String,
      required: true,
      enum: ["counselling", "internationalStudy", "scholarships"],
      unique: true,
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

const StudentHub = model("StudentHub", studentHubSchema);

export default StudentHub;
