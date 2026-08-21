import "dotenv/config";
import { invalidateCache, deleteKeys } from "../utils/redisClient.js";

async function flush() {
  console.log("🧹 Flushing all course cache keys from Upstash Redis...");
  try {
    await invalidateCache("courses:published*");
    await invalidateCache("course:public:*");
    await deleteKeys(["courses:published"]);
    console.log("✅ All stale course Redis caches flushed successfully!");
  } catch (err) {
    console.error("❌ Error flushing cache:", err);
  }
  process.exit(0);
}

flush();
