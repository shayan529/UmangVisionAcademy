import { existsSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { mergeBaseAndCustomRoles } from "../utils/userRoles.js";

const envPath = resolve(".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI must be set in server/.env or the environment.");
}

try {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Fetch users that have assignedRoles in the database
  const users = await User.find({
    $or: [
      { assignedRoles: { $exists: true } },
      { "assignedRoles.0": { $exists: true } }
    ]
  });

  console.log(`Found ${users.length} users requiring role migration.`);

  let migratedCount = 0;
  for (const user of users) {
    // Get the raw document to access assignedRoles (which is not in the Mongoose schema)
    const rawUser = await User.collection.findOne({ _id: user._id });
    const legacyAssignedRoles = rawUser.assignedRoles || [];
    
    // Filter base roles (strings like 'student', 'instructor', 'admin')
    const baseRoles = (rawUser.roles || []).filter(r => typeof r === "string");
    
    // Extract custom role IDs
    const customRoleIds = [
      ...(rawUser.roles || []).filter(r => typeof r !== "string").map(id => id.toString()),
      ...legacyAssignedRoles.map(id => id.toString())
    ];

    const mergedRoles = mergeBaseAndCustomRoles(baseRoles, customRoleIds);

    await User.collection.updateOne(
      { _id: user._id },
      { 
        $set: { roles: mergedRoles }, 
        $unset: { assignedRoles: "" } 
      }
    );
    migratedCount++;
    console.log(`Migrated user: ${user.name} (${user.email || "no-email"})`);
  }

  console.log(`Successfully migrated ${migratedCount} users.`);
} catch (error) {
  console.error("Migration failed:", error);
} finally {
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}
