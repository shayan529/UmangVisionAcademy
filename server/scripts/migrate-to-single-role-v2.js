/**
 * migrate-to-single-role-v2.js
 *
 * Migrates users from the assignedRoles[] + role:string shape to the new
 * single role field that stores either:
 *   • a base-role string  ("student" | "instructor" | "admin" | "staff")
 *   • a custom Role ObjectId
 *
 * Run once against the live database:
 *   node server/scripts/migrate-to-single-role-v2.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not set. Aborting.");
  process.exit(1);
}

const BASE_ROLES = new Set(["student", "instructor", "admin", "staff"]);
const isBaseRole = (v) => typeof v === "string" && BASE_ROLES.has(v.toLowerCase());

const RawUser = mongoose.model("RawUser", new mongoose.Schema({}, { strict: false }), "users");

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");

  let migrated = 0, skipped = 0, errors = 0;

  const cursor = RawUser.find({
    $or: [
      { assignedRoles: { $exists: true, $ne: [] } },
      // Also catch users whose role is still the old string but have an
      // assignedRoles array that should be promoted.
    ],
  }).cursor();

  for await (const doc of cursor) {
    try {
      const assigned = Array.isArray(doc.assignedRoles) ? doc.assignedRoles : [];

      if (assigned.length === 0) {
        skipped++;
        continue;
      }

      // Take the first assignedRole as the canonical role
      const firstAssigned = assigned[0];
      const isObjId =
        firstAssigned instanceof mongoose.Types.ObjectId ||
        (typeof firstAssigned === "string" &&
          mongoose.Types.ObjectId.isValid(firstAssigned) &&
          !isBaseRole(firstAssigned));

      const newRole = isObjId
        ? new mongoose.Types.ObjectId(firstAssigned.toString())
        : isBaseRole(firstAssigned)
          ? firstAssigned.toLowerCase()
          : doc.role || "student"; // fallback

      await RawUser.collection.updateOne(
        { _id: doc._id },
        {
          $set: { role: newRole },
          $unset: { assignedRoles: "" },
        },
      );

      migrated++;
      if (migrated % 200 === 0) console.log(`  Migrated ${migrated}...`);
    } catch (err) {
      console.error(`  Error on ${doc._id}:`, err.message);
      errors++;
    }
  }

  console.log("\n── Done ───────────────────────────────────────");
  console.log(`  Migrated : ${migrated}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Errors   : ${errors}`);

  await mongoose.disconnect();
  process.exit(errors > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
