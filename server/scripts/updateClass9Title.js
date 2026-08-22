import "dotenv/config";
import mongoose from "mongoose";
import Course from "../models/courses.model.js";

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

async function updateTitle() {
  await mongoose.connect(MONGO_URI);
  const res = await Course.updateOne(
    { title: "Class 9 Foundation" },
    { $set: { title: "Class 9 Foundation Complete Batch (MP Board - English Medium)" } }
  );
  console.log("Updated course title successfully:", res);
  process.exit(0);
}

updateTitle().catch((err) => {
  console.error("Error updating title:", err);
  process.exit(1);
});
