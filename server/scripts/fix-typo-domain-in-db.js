import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function fixTypoDomainInDb() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ Missing MONGO_URI");
    process.exit(1);
  }

  console.log("🔗 Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("✅ Connected.");

  const db = mongoose.connection.db;
  const collections = ["courses", "reels", "users", "notes", "questionpapers"];
  const badDomain = "rfo7jqbmriqdgqo.public.blob.vercel-storage.com";
  const goodDomain = "rfo7jqxbmriqdgqo.public.blob.vercel-storage.com";

  for (const colName of collections) {
    const col = db.collection(colName);
    const docs = await col.find({}).toArray();
    let count = 0;

    for (const doc of docs) {
      const jsonStr = JSON.stringify(doc);
      if (jsonStr.includes(badDomain)) {
        const fixedJsonStr = jsonStr.replaceAll(badDomain, goodDomain);
        const fixedDoc = JSON.parse(fixedJsonStr);
        delete fixedDoc._id; // preserve ObjectId
        await col.replaceOne({ _id: doc._id }, fixedDoc);
        count++;
      }
    }
    console.log(`✅ Collection "${colName}": fixed ${count} document(s).`);
  }

  console.log("\n🎉 Database domain typo migration complete!");
  await mongoose.disconnect();
}

fixTypoDomainInDb().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
