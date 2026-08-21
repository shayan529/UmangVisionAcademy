import "dotenv/config";
import mongoose from "mongoose";
import Course from "../models/courses.model.js";
import { invalidateCache, deleteKeys } from "../utils/redisClient.js";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

const IMAGE_MAP = {
  foundation: {
    "Class 6": {
      Hindi: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
      English: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80",
    },
    "Class 7": {
      Hindi: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80",
      English: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    },
    "Class 8": {
      Hindi: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
      English: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    },
    "Class 9": {
      Hindi: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
      English: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    },
    "Class 10": {
      Hindi: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
      English: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
    },
  },
  mathsScience: {
    Hindi: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
    English: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
  },
  biology: {
    Hindi: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&w=800&q=80",
    English: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80",
  },
  commerce: {
    Hindi: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    English: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
  },
  agriculture: {
    Hindi: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    English: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80",
  },
  arts: {
    Hindi: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    English: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=800&q=80",
  },
};

const getThumbnail = (category, subject, language) => {
  const langKey = language?.toLowerCase().includes("hindi") ? "Hindi" : "English";
  const s = (subject || "").toLowerCase();
  const c = category || "";

  if (s.includes("biology")) return IMAGE_MAP.biology[langKey];
  if (s.includes("commerce")) return IMAGE_MAP.commerce[langKey];
  if (s.includes("agriculture")) return IMAGE_MAP.agriculture[langKey];
  if (s.includes("arts")) return IMAGE_MAP.arts[langKey];
  if (s.includes("maths") || s.includes("science")) return IMAGE_MAP.mathsScience[langKey];

  // Foundation classes
  if (IMAGE_MAP.foundation[c]) {
    return IMAGE_MAP.foundation[c][langKey];
  }

  return IMAGE_MAP.foundation["Class 10"][langKey];
};

async function updateImages() {
  await mongoose.connect(MONGO_URI);
  console.log("🎨 Updating course thumbnail images by Subject, Class & Language...");

  const courses = await Course.find({});
  let updatedCount = 0;

  for (const c of courses) {
    const newImage = getThumbnail(c.category, c.subject, c.language);
    c.thumbnailUrl = newImage;
    await c.save();
    updatedCount++;
  }

  console.log(`✅ Updated thumbnail images for ${updatedCount} courses!`);

  // Flush Redis cache
  await invalidateCache("courses:published*");
  await invalidateCache("course:public:*");
  await deleteKeys(["courses:published"]);
  console.log("✅ Flushed Upstash Redis course cache.");

  await mongoose.disconnect();
  process.exit(0);
}

updateImages();
