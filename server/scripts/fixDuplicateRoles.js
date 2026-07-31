/**
 * One-time script: remove duplicate lowercase system Role docs.
 *
 * The seeder previously created case-sensitive duplicates
 * (e.g. "student" alongside "Student"). This script:
 *  1. For each base role name (student, instructor), finds ALL docs
 *     matching that name case-insensitively.
 *  2. If there are >1 docs, keeps the one with the most data (permissions,
 *     users assigned, dashboardModules) and deletes the empty duplicate.
 *
 * Safe to run multiple times — it's a no-op if there are no dupes.
 *
 * Usage:  node scripts/fixDuplicateRoles.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("No MONGO_URI found in .env");
  process.exit(1);
}

const BASE_NAMES = ["student", "instructor"];

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const Role = mongoose.connection.collection("roles");
  const User = mongoose.connection.collection("users");

  for (const baseName of BASE_NAMES) {
    // Find all role docs matching this name (case-insensitive)
    const docs = await Role.find({
      name: { $regex: new RegExp(`^${baseName}$`, "i") },
      isSystem: true,
    }).toArray();

    console.log(`\n[${baseName}] Found ${docs.length} system role doc(s):`);
    for (const d of docs) {
      const userCount = await User.countDocuments({ role: d._id });
      console.log(
        `  _id=${d._id}  name="${d.name}"  permissions=${d.permissions?.length ?? 0}  users=${userCount}  dashboardModules=${d.dashboardModules?.length ?? "undefined"}`
      );
    }

    if (docs.length <= 1) {
      console.log(`  → No duplicates. Skipping.`);
      continue;
    }

    // Score each doc: higher = more data → keep it
    const scored = await Promise.all(
      docs.map(async (d) => {
        const userCount = await User.countDocuments({ role: d._id });
        const permCount = d.permissions?.length ?? 0;
        return { doc: d, score: userCount * 100 + permCount };
      })
    );
    scored.sort((a, b) => b.score - a.score);

    const keep = scored[0].doc;
    const toDelete = scored.slice(1).map((s) => s.doc);

    console.log(`  → Keeping _id=${keep._id} (name="${keep.name}")`);

    for (const dup of toDelete) {
      // Before deleting, migrate any users that point to the duplicate
      const migratedCount = await User.updateMany(
        { role: dup._id },
        { $set: { role: keep._id } }
      );
      if (migratedCount.modifiedCount > 0) {
        console.log(
          `  → Migrated ${migratedCount.modifiedCount} user(s) from dup _id=${dup._id} to keeper`
        );
      }

      await Role.deleteOne({ _id: dup._id });
      console.log(`  → Deleted duplicate _id=${dup._id} (name="${dup.name}")`);
    }
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
