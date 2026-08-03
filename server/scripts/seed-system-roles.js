/**
 * server/scripts/seed-system-roles.js
 *
 * Upserts the four system roles (student, instructor, staff, admin) so they
 * always exist in the database with isSystem: true and the correct dashboard-
 * module list and permissions for their workspace.
 *
 * Run from the project root:
 *   npm run seed:roles
 */

import "dotenv/config";
import mongoose from "mongoose";
import Role, {
  PERMISSION_MODULES,
  DASHBOARD_MODULES,
} from "../models/role.model.js";

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error(
    "[seed-system-roles] No MongoDB URI found. " +
      "Set MONGO_URI (or MONGODB_URI / DATABASE_URL) in your server/.env file.",
  );
  process.exit(1);
}

const SYSTEM_ROLES = [
  {
    name: "student",
    description: "Default role for learners on the platform.",
    permissions: [],
    dashboardModules: DASHBOARD_MODULES.student,
  },
  {
    name: "instructor",
    description: "Course creators and session hosts.",
    permissions: [],
    dashboardModules: DASHBOARD_MODULES.instructor,
  },
  {
    name: "staff",
    description:
      "Support staff with configurable permissions and sidebar access.",
    // Staff start with no permissions — admin assigns them via the UI.
    permissions: [],
    dashboardModules: DASHBOARD_MODULES.staff,
  },
  {
    name: "admin",
    description:
      "Platform administrator — full access to all modules and permissions.",
    // Admins are implicitly granted every permission in hasPermission() /
    // hasPermissionGrant(), but we enumerate them here for the UI display.
    permissions: Object.entries(PERMISSION_MODULES).map(([module, actions]) => ({
      module,
      actions,
    })),
    dashboardModules: DASHBOARD_MODULES.staff,
  },
];

async function seedSystemRoles() {
  await mongoose.connect(MONGO_URI);
  console.log("[seed-system-roles] Connected to MongoDB.");

  for (const def of SYSTEM_ROLES) {
    const existing = await Role.findOne({
      name: new RegExp(`^${def.name}$`, "i"),
    });

    if (existing) {
      existing.description = def.description;
      existing.permissions = def.permissions;
      existing.dashboardModules = def.dashboardModules;
      existing.isSystem = true;
      await existing.save();
      console.log(`[seed-system-roles] Updated  → ${def.name}`);
    } else {
      await Role.create({ ...def, isSystem: true });
      console.log(`[seed-system-roles] Created  → ${def.name}`);
    }
  }

  await mongoose.disconnect();
  console.log("[seed-system-roles] Done.");
}

seedSystemRoles().catch((err) => {
  console.error("[seed-system-roles] Fatal error:", err);
  process.exit(1);
});
