/**
 * migrate-to-single-role.js
 *
 * One-off migration: converts every user document from the old
 * `roles: [Schema.Types.Mixed]` array shape to the new
 * `role: String` + `assignedRoles: [ObjectId]` shape.
 *
 * Safe to re-run — documents that already have `role` set (and no legacy
 * `roles` array) are skipped.
 *
 * Run:
 *   node server/scripts/migrate-to-single-role.js
 *
 * Or via npm script:
 *   cd server && node scripts/migrate-to-single-role.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load .env from server root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is not set. Aborting.");
  process.exit(1);
}

// ── Schema helpers ─────────────────────────────────────────────────────────────
const BASE_ROLE_SET = new Set(["student", "instructor", "admin", "staff"]);
const isBaseRole = (r) => typeof r === "string" && BASE_ROLE_SET.has(r);

/**
 * Given a legacy roles array, pick the best single base role.
 * Priority: admin > instructor > staff > student.
 * Falls back to "student" if nothing recognisable is found.
 */
const pickPrimaryRole = (rolesArray = []) => {
  const baseRoles = rolesArray.filter(isBaseRole);
  for (const priority of ["admin", "instructor", "staff", "student"]) {
    if (baseRoles.includes(priority)) return priority;
  }
  return "student";
};

/**
 * From a legacy roles array, extract the ObjectId entries (custom roles).
 * These become the new `assignedRoles` array.
 */
const extractCustomRoleIds = (rolesArray = []) => {
  const ids = [];
  for (const entry of rolesArray) {
    if (mongoose.Types.ObjectId.isValid(entry) && !isBaseRole(entry)) {
      ids.push(new mongoose.Types.ObjectId(entry.toString()));
    } else if (entry instanceof mongoose.Types.ObjectId) {
      ids.push(entry);
    } else if (entry && typeof entry === "object" && entry._id) {
      ids.push(new mongoose.Types.ObjectId(entry._id.toString()));
    }
  }
  return ids;
};

// ── Raw schema (bypass Mongoose validation so we can read legacy shape) ────────
const rawUserSchema = new mongoose.Schema({}, { strict: false });
const RawUser = mongoose.model("RawUser", rawUserSchema, "users");

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  // Find users that still have a `roles` array and haven't been migrated yet
  const cursor = RawUser.find({
    roles: { $exists: true },
  }).cursor();

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for await (const doc of cursor) {
    try {
      // Already migrated — has the new shape
      if (doc.role && !doc.roles) {
        skipped++;
        continue;
      }

      const legacyRoles = Array.isArray(doc.roles) ? doc.roles : [];
      const primaryRole = pickPrimaryRole(legacyRoles);
      const customRoleIds = extractCustomRoleIds(legacyRoles);

      // Also merge in any legacy top-level `assignedRoles` field
      const legacyAssigned = Array.isArray(doc.assignedRoles)
        ? doc.assignedRoles.filter(
            (id) =>
              mongoose.Types.ObjectId.isValid(id) ||
              id instanceof mongoose.Types.ObjectId,
          )
        : [];

      const allAssigned = [
        ...new Set([
          ...customRoleIds.map((id) => id.toString()),
          ...legacyAssigned.map((id) => id.toString()),
        ]),
      ].map((id) => new mongoose.Types.ObjectId(id));

      await RawUser.collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            role: primaryRole,
            assignedRoles: allAssigned,
          },
          $unset: { roles: "" },
        },
      );

      migrated++;

      if (migrated % 500 === 0) {
        console.log(`  Migrated ${migrated} documents so far...`);
      }
    } catch (err) {
      console.error(`  Error migrating user ${doc._id}:`, err.message);
      errors++;
    }
  }

  console.log("\n── Migration complete ──────────────────────────────────────");
  console.log(`  Migrated : ${migrated}`);
  console.log(`  Skipped  : ${skipped} (already on new shape)`);
  console.log(`  Errors   : ${errors}`);

  await mongoose.disconnect();
  console.log("Disconnected.");
  process.exit(errors > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
