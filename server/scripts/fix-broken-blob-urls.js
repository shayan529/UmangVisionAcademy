import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { list } from "@vercel/blob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function fixBrokenBlobUrls() {
  const mongoUri = process.env.MONGO_URI;
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

  if (!mongoUri || !token) {
    console.error("❌ Missing MONGO_URI or VERCEL_BLOB_READ_WRITE_TOKEN");
    process.exit(1);
  }

  console.log("🔗 Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("✅ Connected.");

  console.log("📦 Fetching all Blobs from Vercel Blob Storage...");
  const { blobs } = await list({ token });
  const blobUrlMap = new Map();

  for (const b of blobs) {
    // Map timestamp prefix if present
    const match = b.pathname.match(/(\d{13})/);
    if (match) {
      blobUrlMap.set(match[1], b.url);
    }
  }

  console.log(`Found ${blobs.length} blobs in storage.`);

  const db = mongoose.connection.db;
  const coursesCollection = db.collection("courses");
  const courses = await coursesCollection.find({}).toArray();
  let updatedCount = 0;

  for (const course of courses) {
    let modified = false;

    // Check demoVideo / demoVideoUrl
    const demo = course.demoVideoUrl || course.demoVideo;
    if (demo && typeof demo === "string" && demo.includes("vercel-storage.com")) {
      const match = demo.match(/(\d{13})/);
      if (match && blobUrlMap.has(match[1])) {
        const correctUrl = blobUrlMap.get(match[1]);
        if (correctUrl !== demo) {
          console.log(`Fixing demo video for course "${course.title}":\n  Old: ${demo}\n  New: ${correctUrl}`);
          course.demoVideoUrl = correctUrl;
          course.demoVideo = correctUrl;
          modified = true;
        }
      }
    }

    // Check lessons
    if (Array.isArray(course.lessons)) {
      for (const lesson of course.lessons) {
        if (lesson.videoUrl && typeof lesson.videoUrl === "string" && lesson.videoUrl.includes("vercel-storage.com")) {
          const match = lesson.videoUrl.match(/(\d{13})/);
          if (match && blobUrlMap.has(match[1])) {
            const correctUrl = blobUrlMap.get(match[1]);
            if (correctUrl !== lesson.videoUrl) {
              console.log(`Fixing lesson video "${lesson.title}":\n  Old: ${lesson.videoUrl}\n  New: ${correctUrl}`);
              lesson.videoUrl = correctUrl;
              modified = true;
            }
          }
        }
      }
    }

    if (modified) {
      await coursesCollection.updateOne(
        { _id: course._id },
        {
          $set: {
            demoVideoUrl: course.demoVideoUrl,
            demoVideo: course.demoVideo,
            lessons: course.lessons,
          },
        }
      );
      updatedCount++;
    }
  }

  console.log(`\n🎉 Successfully fixed ${updatedCount} course(s) in MongoDB!`);
  await mongoose.disconnect();
}

fixBrokenBlobUrls().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
