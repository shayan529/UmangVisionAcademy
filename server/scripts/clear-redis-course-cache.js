import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function clearCourseCache() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is missing");
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const course = await db.collection("courses").findOne({ _id: new mongoose.Types.ObjectId("6a6c787d94a935348ded8848") });
  console.log("Course 6a6c787d94a935348ded8848 demoVideoUrl in DB:", course?.demoVideoUrl);
  console.log("Course 6a6c787d94a935348ded8848 demoVideo in DB:", course?.demoVideo);

  // Revert course demoVideoUrl in DB if it contains vercel-storage
  if (course) {
    let demoUrl = course.demoVideoUrl || course.demoVideo || "";
    if (demoUrl.includes("vercel-storage.com")) {
      const match = demoUrl.match(/\/uploads\/(.+)$/);
      if (match && match[1]) {
        const localUrl = `http://localhost:5000/uploads/${match[1]}`;
        await db.collection("courses").updateOne(
          { _id: course._id },
          { $set: { demoVideoUrl: localUrl, demoVideo: localUrl } }
        );
        console.log("✅ Updated course demoVideoUrl in DB to:", localUrl);
      }
    }
  }

  // Clear Redis Cache
  const { deleteKeys, invalidateCache } = await import("../utils/redisClient.js");
  await deleteKeys(["courses:published", "course:public:6a6c787d94a935348ded8848"]);
  await invalidateCache("course:public:*");
  console.log("✅ Cleared Redis course cache!");

  await mongoose.disconnect();
  process.exit(0);
}

clearCourseCache();
