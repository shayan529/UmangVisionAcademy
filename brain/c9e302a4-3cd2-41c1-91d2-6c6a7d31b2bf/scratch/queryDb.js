import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import User from "./../../../server/models/user.model.js";
import Role from "./../../../server/models/role.model.js";

dotenv.config({ path: "../../../server/.env" });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find().populate("assignedRoles");
    console.log("USERS IN DATABASE:");
    for (const u of users) {
      console.log(`User: ${u.name}, Roles: ${JSON.stringify(u.roles)}, AssignedRoles: ${JSON.stringify(u.assignedRoles.map(r => ({ name: r.name, permissions: r.permissions })))}`);
    }

    const roles = await Role.find();
    console.log("ROLES IN DATABASE:");
    for (const r of roles) {
      console.log(`Role: ${r.name}, Permissions: ${JSON.stringify(r.permissions)}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
