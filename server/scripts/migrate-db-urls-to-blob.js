import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const BLOB_BASE_URL = (
  process.env.VERCEL_BLOB_BASE_URL ||
  "https://rfo7jqxbmriqdgqo.public.blob.vercel-storage.com"
).replace(/\/$/, "");

function convertToBlobUrl(originalUrl) {
  if (!originalUrl || typeof originalUrl !== "string") return originalUrl;
  if (originalUrl.includes("vercel-storage.com")) return originalUrl;

  let relativePath = "";
  if (originalUrl.includes("/uploads/")) {
    relativePath = originalUrl.split("/uploads/")[1];
  } else if (originalUrl.startsWith("uploads/")) {
    relativePath = originalUrl.replace(/^uploads\//, "");
  }

  if (relativePath) {
    return `${BLOB_BASE_URL}/${relativePath.replace(/^\/+/, "")}`;
  }
  return originalUrl;
}

async function migrateDbUrls() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is missing from environment variables.");
    process.exit(1);
  }

  console.log("🔗 Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB.");

  const db = mongoose.connection.db;

  // 1. Courses
  console.log("🔄 Migrating Courses collection...");
  const coursesCollection = db.collection("courses");
  const courses = await coursesCollection.find({}).toArray();
  let updatedCourses = 0;

  for (const course of courses) {
    let modified = false;

    if (course.thumbnailUrl) {
      const newUrl = convertToBlobUrl(course.thumbnailUrl);
      if (newUrl !== course.thumbnailUrl) {
        course.thumbnailUrl = newUrl;
        modified = true;
      }
    }

    if (course.demoVideo) {
      const newUrl = convertToBlobUrl(course.demoVideo);
      if (newUrl !== course.demoVideo) {
        course.demoVideo = newUrl;
        modified = true;
      }
    }

    if (Array.isArray(course.curriculum)) {
      for (const moduleObj of course.curriculum) {
        if (Array.isArray(moduleObj.lessons)) {
          for (const lesson of moduleObj.lessons) {
            if (lesson.videoUrl) {
              const newUrl = convertToBlobUrl(lesson.videoUrl);
              if (newUrl !== lesson.videoUrl) {
                lesson.videoUrl = newUrl;
                modified = true;
              }
            }
            if (lesson.pdfUrl) {
              const newUrl = convertToBlobUrl(lesson.pdfUrl);
              if (newUrl !== lesson.pdfUrl) {
                lesson.pdfUrl = newUrl;
                modified = true;
              }
            }
            if (Array.isArray(lesson.attachments)) {
              for (const att of lesson.attachments) {
                if (att.fileUrl) {
                  const newUrl = convertToBlobUrl(att.fileUrl);
                  if (newUrl !== att.fileUrl) {
                    att.fileUrl = newUrl;
                    modified = true;
                  }
                }
              }
            }
          }
        }
      }
    }

    if (modified) {
      await coursesCollection.updateOne({ _id: course._id }, { $set: course });
      updatedCourses++;
    }
  }
  console.log(`   ✅ Updated ${updatedCourses} course(s).`);

  // 2. Users (avatar)
  console.log("🔄 Migrating Users collection...");
  const usersCollection = db.collection("users");
  const users = await usersCollection.find({ avatar: { $regex: "uploads" } }).toArray();
  let updatedUsers = 0;
  for (const user of users) {
    const newAvatar = convertToBlobUrl(user.avatar);
    if (newAvatar !== user.avatar) {
      await usersCollection.updateOne({ _id: user._id }, { $set: { avatar: newAvatar } });
      updatedUsers++;
    }
  }
  console.log(`   ✅ Updated ${updatedUsers} user(s).`);

  // 3. Reels
  console.log("🔄 Migrating Reels collection...");
  const reelsCollection = db.collection("reels");
  const reels = await reelsCollection.find({}).toArray();
  let updatedReels = 0;
  for (const reel of reels) {
    let modified = false;
    const newVideoUrl = convertToBlobUrl(reel.videoUrl);
    const newThumbnail = convertToBlobUrl(reel.thumbnail);
    const updateObj = {};
    if (newVideoUrl !== reel.videoUrl) {
      updateObj.videoUrl = newVideoUrl;
      modified = true;
    }
    if (newThumbnail !== reel.thumbnail) {
      updateObj.thumbnail = newThumbnail;
      modified = true;
    }
    if (modified) {
      await reelsCollection.updateOne({ _id: reel._id }, { $set: updateObj });
      updatedReels++;
    }
  }
  console.log(`   ✅ Updated ${updatedReels} reel(s).`);

  // 4. Question Papers
  console.log("🔄 Migrating Question Papers collection...");
  const qpCollection = db.collection("questionpapers");
  const qps = await qpCollection.find({ fileUrl: { $regex: "uploads" } }).toArray();
  let updatedQps = 0;
  for (const qp of qps) {
    const newUrl = convertToBlobUrl(qp.fileUrl);
    if (newUrl !== qp.fileUrl) {
      await qpCollection.updateOne({ _id: qp._id }, { $set: { fileUrl: newUrl } });
      updatedQps++;
    }
  }
  console.log(`   ✅ Updated ${updatedQps} question paper(s).`);

  // 5. Notes
  console.log("🔄 Migrating Notes collection...");
  const notesCollection = db.collection("notes");
  const notes = await notesCollection.find({ fileUrl: { $regex: "uploads" } }).toArray();
  let updatedNotes = 0;
  for (const note of notes) {
    const newUrl = convertToBlobUrl(note.fileUrl);
    if (newUrl !== note.fileUrl) {
      await notesCollection.updateOne({ _id: note._id }, { $set: { fileUrl: newUrl } });
      updatedNotes++;
    }
  }
  console.log(`   ✅ Updated ${updatedNotes} note(s).`);

  console.log("\n🎉 DB URL Migration Complete!");
  await mongoose.disconnect();
}

migrateDbUrls().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
