/**
 * Sync dashboard modules on existing system Role docs to match the
 * canonical DASHBOARD_MODULES definition. Also flushes relevant Redis caches.
 *
 * Usage:  node scripts/syncDashboardModules.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("No MONGO_URI found in .env");
  process.exit(1);
}

// Canonical definition — must match role.model.js DASHBOARD_MODULES
const DASHBOARD_MODULES = {
  student: [
    "overview", "my_courses", "study_notes", "question_bank", "blogs",
    "ai_tutor", "sessions", "progress", "mock_tests", "leaderboard",
    "achievements", "certificates", "plans", "become_instructor",
    "referral", "wallet", "purchase_history", "references", "settings",
  ],
  instructor: [
    "dashboard", "courses", "students", "sessions", "notes", "reels",
    "analytics", "ai", "settings", "mock-tests",
  ],
};

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const Role = mongoose.connection.collection("roles");

  for (const [baseName, modules] of Object.entries(DASHBOARD_MODULES)) {
    // Find the system role doc (case-insensitive)
    const doc = await Role.findOne({
      name: { $regex: new RegExp(`^${baseName}$`, "i") },
      isSystem: true,
    });

    if (!doc) {
      console.log(`[${baseName}] No system role doc found — skipping.`);
      continue;
    }

    console.log(`[${baseName}] Found: _id=${doc._id}, name="${doc.name}"`);
    console.log(`  Current dashboardModules: ${JSON.stringify(doc.dashboardModules)}`);
    console.log(`  Canonical modules (${modules.length}): ${JSON.stringify(modules)}`);

    await Role.updateOne(
      { _id: doc._id },
      { $set: { dashboardModules: modules } }
    );
    console.log(`  → Updated to ${modules.length} modules.`);
  }

  // Flush Redis caches for base roles and users
  try {
    const { createClient } = await import("redis");
    const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_URI;
    if (REDIS_URL) {
      const client = createClient({ url: REDIS_URL });
      await client.connect();

      // Delete base role caches
      for (const name of Object.keys(DASHBOARD_MODULES)) {
        const key = `role:base:${name}`;
        const deleted = await client.del(key);
        console.log(`\nRedis: DEL ${key} → ${deleted ? "cleared" : "not found"}`);
      }

      // Flush all user caches (they contain stale dashboardModules)
      const userKeys = await client.keys("user:*");
      if (userKeys.length > 0) {
        const deleted = await client.del(userKeys);
        console.log(`Redis: Cleared ${deleted} user cache entries`);
      } else {
        console.log("Redis: No user cache entries found");
      }

      await client.disconnect();
    } else {
      console.log("\nNo REDIS_URL — skipping cache flush. Restart the server to clear in-memory caches.");
    }
  } catch (err) {
    console.log("\nRedis cache flush failed (non-critical):", err.message);
    console.log("Restart the server to clear in-memory caches.");
  }

  console.log("\nDone. Restart the server so new role data takes effect.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
