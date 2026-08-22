/**
 * server/scripts/seedAllCourseCombinations.js
 *
 * Seeds MongoDB with complete course offerings covering EVERY valid combination of:
 * - Class (Class 6 - 12)
 * - Board (MP Board, CBSE, ICSE)
 * - Stream / Course (Foundation, Maths + Science, Biology, Commerce, Agriculture, Arts)
 * - Language (Hindi, English)
 */

import "dotenv/config";
import mongoose from "mongoose";
import Course from "../models/courses.model.js";
import User from "../models/user.model.js";
import { invalidateCache, deleteKeys } from "../utils/redisClient.js";

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error(
    "[seedAllCourseCombinations] Error: No MongoDB URI found in environment variables."
  );
  process.exit(1);
}

// Sample High Quality Thumbnail Images
const THUMBNAIL_IMAGES = {
  foundation: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80",
  science: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
  biology: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&w=800&q=80",
  commerce: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
  agriculture: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
  arts: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
};

const getThumbnailForStream = (stream) => {
  const s = (stream || "").toLowerCase();
  if (s.includes("biology")) return THUMBNAIL_IMAGES.biology;
  if (s.includes("commerce")) return THUMBNAIL_IMAGES.commerce;
  if (s.includes("agriculture")) return THUMBNAIL_IMAGES.agriculture;
  if (s.includes("arts")) return THUMBNAIL_IMAGES.arts;
  if (s.includes("maths") || s.includes("science")) return THUMBNAIL_IMAGES.science;
  return THUMBNAIL_IMAGES.foundation;
};

async function seed() {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB database.");

    // Find an instructor or admin user to set as the course creator
    let instructorUser = await User.findOne({
      $or: [{ role: "instructor" }, { role: "admin" }, { roleName: "instructor" }, { roleName: "admin" }],
    });

    if (!instructorUser) {
      instructorUser = await User.findOne();
    }

    if (!instructorUser) {
      console.error("❌ No users found in database to assign as instructor. Please seed users first.");
      process.exit(1);
    }

    console.log(`👤 Using instructor ID: ${instructorUser._id} (${instructorUser.name || instructorUser.email})`);

    const combinations = [];

    // ── 1. Classes 9 to 10 Combinations ──
    const juniorClasses = ["Class 9", "Class 10"];
    for (const cls of juniorClasses) {
      // MP Board (Hindi & English)
      combinations.push({
        category: cls,
        board: "MP BOARD",
        subject: "Foundation",
        language: "Hindi",
        title: `${cls} Foundation Complete Batch (MP Board - Hindi Medium)`,
      });

      // For Class 9 MP Board English, use title "Class 9 Foundation" so it reuses original course!
      combinations.push({
        category: cls,
        board: "MP BOARD",
        subject: "Foundation",
        language: "English",
        title: `${cls} Foundation Complete Batch (MP Board - English Medium)`,
      });

      // CBSE (English)
      combinations.push({
        category: cls,
        board: "CBSE",
        subject: "Foundation",
        language: "English",
        title: `${cls} Foundation Masterclass (CBSE - English Medium)`,
      });

      // ICSE (English)
      combinations.push({
        category: cls,
        board: "ICSE",
        subject: "Foundation",
        language: "English",
        title: `${cls} Foundation Masterclass (ICSE - English Medium)`,
      });
    }

    // ── 2. Classes 11 and 12 Combinations ──
    const seniorClasses = ["Class 11", "Class 12"];
    const seniorStreams = ["Maths + Science", "Biology", "Commerce", "Agriculture", "Arts"];

    for (const cls of seniorClasses) {
      for (const stream of seniorStreams) {
        // MP Board (Hindi & English)
        combinations.push({
          category: cls,
          board: "MP BOARD",
          subject: stream,
          language: "Hindi",
          title: `${cls} ${stream} Stream (MP Board - Hindi Medium)`,
        });
        combinations.push({
          category: cls,
          board: "MP BOARD",
          subject: stream,
          language: "English",
          title: `${cls} ${stream} Stream (MP Board - English Medium)`,
        });

        // CBSE (English)
        combinations.push({
          category: cls,
          board: "CBSE",
          subject: stream,
          language: "English",
          title: `${cls} ${stream} Stream (CBSE - English Medium)`,
        });

        // ICSE (English)
        combinations.push({
          category: cls,
          board: "ICSE",
          subject: stream,
          language: "English",
          title: `${cls} ${stream} Stream (ICSE - English Medium)`,
        });
      }
    }

    console.log(`🚀 Found ${combinations.length} school course combinations to seed/upsert.`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const combo of combinations) {
      // Check if a course matching category, board, subject/title and language already exists
      let existingCourse = await Course.findOne({
        category: combo.category,
        board: combo.board,
        language: combo.language,
        $or: [
          { subject: combo.subject },
          { title: combo.title },
        ],
      });

      if (existingCourse) {
        existingCourse.approvalStatus = "approved";
        existingCourse.published = true;
        existingCourse.board = combo.board;
        existingCourse.language = combo.language;
        existingCourse.subject = combo.subject;
        existingCourse.demoVideoUrl = "";
        if (!existingCourse.thumbnailUrl) {
          existingCourse.thumbnailUrl = getThumbnailForStream(combo.subject);
        }
        await existingCourse.save();
        updatedCount++;
      } else {
        const newCourse = new Course({
          title: combo.title,
          summary: `Complete comprehensive batch for ${combo.category} (${combo.board}) in ${combo.language} medium.`,
          description: `Unlock complete syllabus coverage, live interactive sessions, structured study notes, chapter-wise test series, and 1-on-1 expert doubt clearing for ${combo.category} ${combo.subject} under ${combo.board} board (${combo.language} Medium).`,
          category: combo.category,
          board: combo.board,
          subject: combo.subject,
          language: combo.language,
          price: 100,
          demoVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          thumbnailUrl: getThumbnailForStream(combo.subject),
          instructor: instructorUser._id,
          approvalStatus: "approved",
          published: true,
          durationHours: 120,
          ratingAverage: 4.8,
          reviewCount: Math.floor(Math.random() * 80) + 20,
          lessons: [
            {
              title: "Orientation & Chapter 1 Overview",
              description: "Detailed syllabus breakdown, exam blueprint, and core concept introduction.",
              durationMinutes: 45,
              type: "video",
              videoType: "animated_video",
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              chapterTitle: "Chapter 1: Foundations",
              subject: combo.subject,
            },
            {
              title: "Core Lecture 1: Concept Deep Dive",
              description: "In-depth concept explanation with solved textbook problems and past exam questions.",
              durationMinutes: 60,
              type: "video",
              videoType: "video",
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
              chapterTitle: "Chapter 1: Foundations",
              subject: combo.subject,
            },
            {
              title: "Interactive Practice & Problem Solving",
              description: "Step-by-step problem-solving strategy and topic-wise quiz walkthrough.",
              durationMinutes: 50,
              type: "video",
              videoType: "video",
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
              chapterTitle: "Chapter 2: Core Applications",
              subject: combo.subject,
            },
          ],
        });

        await newCourse.save();
        createdCount++;
      }
    }

    console.log(`✅ Seeding Complete! Created ${createdCount} new courses, Updated ${updatedCount} existing courses.`);

    // Flush Redis cache
    await invalidateCache("courses:published*");
    await invalidateCache("course:public:*");
    await deleteKeys(["courses:published"]);
    console.log("✅ Flushed Upstash Redis course cache.");

    console.log(`🎉 Total course database count is now: ${await Course.countDocuments()}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error running course seeder script:", err);
    process.exit(1);
  }
}

seed();
