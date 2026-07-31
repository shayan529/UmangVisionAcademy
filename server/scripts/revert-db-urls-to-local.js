import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const LOCAL_SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

function convertToLocalUrl(originalUrl) {
  if (!originalUrl || typeof originalUrl !== "string") return originalUrl;

  let relativePath = "";
  if (originalUrl.includes("vercel-storage.com/")) {
    relativePath = originalUrl.split("vercel-storage.com/")[1];
  } else if (originalUrl.includes("/uploads/")) {
    relativePath = originalUrl.split("/uploads/")[1];
  } else if (originalUrl.startsWith("uploads/")) {
    relativePath = originalUrl.replace(/^uploads\//, "");
  }

  if (relativePath) {
    // If relativePath does not start with a folder prefix, keep as is
    const cleanPath = relativePath.replace(/^\/+/, "");
    return `${LOCAL_SERVER_URL}/uploads/${cleanPath}`;
  }
  return originalUrl;
}

async function revertDbUrlsToLocal() {
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
  console.log("🔄 Reverting Courses collection URLs to local server...");
  const coursesCollection = db.collection("courses");
  const courses = await coursesCollection.find({}).toArray();
  let updatedCourses = 0;

  for (const course of courses) {
    let modified = false;

    if (course.thumbnailUrl) {
      const newUrl = convertToLocalUrl(course.thumbnailUrl);
      if (newUrl !== course.thumbnailUrl) {
        course.thumbnailUrl = newUrl;
        modified = true;
      }
    }

    if (course.demoVideo) {
      const newUrl = convertToLocalUrl(course.demoVideo);
      if (newUrl !== course.demoVideo) {
        course.demoVideo = newUrl;
        modified = true;
      }
    }

    if (course.demoVideoUrl) {
      const newUrl = convertToLocalUrl(course.demoVideoUrl);
      if (newUrl !== course.demoVideoUrl) {
        course.demoVideoUrl = newUrl;
        modified = true;
      }
    }

    if (Array.isArray(course.lessons)) {
      for (const lesson of course.lessons) {
        if (lesson.videoUrl) {
          const newUrl = convertToLocalUrl(lesson.videoUrl);
          if (newUrl !== lesson.videoUrl) {
            lesson.videoUrl = newUrl;
            modified = true;
          }
        }
        if (lesson.pdfUrl) {
          const newUrl = convertToLocalUrl(lesson.pdfUrl);
          if (newUrl !== lesson.pdfUrl) {
            lesson.pdfUrl = newUrl;
            modified = true;
          }
        }
        if (Array.isArray(lesson.attachments)) {
          for (const att of lesson.attachments) {
            if (att.fileUrl) {
              const newUrl = convertToLocalUrl(att.fileUrl);
              if (newUrl !== att.fileUrl) {
                att.fileUrl = newUrl;
                modified = true;
              }
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
            thumbnailUrl: course.thumbnailUrl,
            demoVideo: course.demoVideo,
            demoVideoUrl: course.demoVideoUrl,
            lessons: course.lessons,
          },
        }
      );
      updatedCourses++;
    }
  }
  console.log(`   ✅ Reverted ${updatedCourses} course(s).`);

  // 2. Users (avatar)
  console.log("🔄 Reverting Users collection avatar URLs to local...");
  const usersCollection = db.collection("users");
  const users = await usersCollection
    .find({
      $or: [
        { avatar: { $regex: "vercel-storage.com" } },
        { avatar: { $regex: "vercel.app" } },
      ],
    })
    .toArray();
  let updatedUsers = 0;
  for (const user of users) {
    const newAvatar = convertToLocalUrl(user.avatar);
    if (newAvatar !== user.avatar) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { avatar: newAvatar } }
      );
      updatedUsers++;
    }
  }
  console.log(`   ✅ Reverted ${updatedUsers} user(s).`);

  // 3. Reels
  console.log("🔄 Reverting Reels collection URLs...");
  const reelsCollection = db.collection("reels");
  const reels = await reelsCollection.find({}).toArray();
  let updatedReels = 0;
  for (const reel of reels) {
    let modified = false;
    const newVideoUrl = convertToLocalUrl(reel.videoUrl);
    const newThumbnail = convertToLocalUrl(reel.thumbnail);
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
  console.log(`   ✅ Reverted ${updatedReels} reel(s).`);

  // 4. Notes
  console.log("🔄 Reverting Notes collection URLs...");
  const notesCollection = db.collection("notes");
  const notes = await notesCollection.find({}).toArray();
  let updatedNotes = 0;
  for (const note of notes) {
    if (note.fileUrl) {
      const newUrl = convertToLocalUrl(note.fileUrl);
      if (newUrl !== note.fileUrl) {
        await notesCollection.updateOne(
          { _id: note._id },
          { $set: { fileUrl: newUrl } }
        );
        updatedNotes++;
      }
    }
  }
  console.log(`   ✅ Reverted ${updatedNotes} note(s).`);

  console.log("\n🎉 Reversion to Local PC Server URLs Complete!");
  await mongoose.disconnect();
}

revertDbUrlsToLocal().catch((err) => {
  console.error("Reversion error:", err);
  process.exit(1);
});
