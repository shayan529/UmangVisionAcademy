import "dotenv/config";
import mongoose from "mongoose";
import Course from "../models/courses.model.js";
import { invalidateCache, deleteKeys } from "../utils/redisClient.js";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

async function cleanup() {
  await mongoose.connect(MONGO_URI);
  console.log("🧹 Running cleanup script...");

  // 1. Remove duplicate English MP Board Class 9 course created by Admin User (ID 6a87f3cec7ac811658bd259e)
  const duplicateEngCourse = await Course.findById("6a87f3cec7ac811658bd259e");
  if (duplicateEngCourse) {
    await Course.findByIdAndDelete("6a87f3cec7ac811658bd259e");
    console.log("✅ Deleted duplicate English course: 'Class 9 Foundation Complete Batch (MP Board - English Medium)'");
  } else {
    // Fallback: Delete any Course titled "Class 9 Foundation Complete Batch (MP Board - English Medium)"
    const delRes = await Course.deleteMany({
      title: "Class 9 Foundation Complete Batch (MP Board - English Medium)"
    });
    console.log(`✅ Deleted ${delRes.deletedCount} duplicate English MP Board Class 9 course(s).`);
  }

  // 2. Remove all Competitive Exam courses from DB
  const compExamsCategories = [
    "JEE Main & Advanced",
    "NEET UG",
    "CUET UG",
    "NDA & Defence Exams",
    "JEE",
    "NEET",
    "CUET",
    "NDA",
  ];

  const compDelRes = await Course.deleteMany({
    $or: [
      { category: { $in: compExamsCategories } },
      { subject: { $in: ["JEE", "NEET", "CUET", "NDA"] } },
      { title: { $regex: /JEE|NEET|CUET|NDA/i } }
    ]
  });
  console.log(`✅ Deleted ${compDelRes.deletedCount} competitive exam course(s) from database.`);

  // 3. Flush Redis course cache
  await invalidateCache("courses:published*");
  await invalidateCache("course:public:*");
  await deleteKeys(["courses:published"]);
  console.log("✅ Flushed Upstash Redis course cache.");

  const totalRemaining = await Course.countDocuments();
  console.log(`🎉 Total courses remaining in database: ${totalRemaining}`);

  await mongoose.disconnect();
  process.exit(0);
}

cleanup();
