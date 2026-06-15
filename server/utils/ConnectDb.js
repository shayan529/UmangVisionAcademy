import mongoose from "mongoose";
import User from "../models/user.model.js";

const adminPhone = "+910000000000";
const adminPassword = "000000";

const seedAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ phoneNumber: adminPhone });
    if (existingAdmin) {
      existingAdmin.roles = "admin";
      existingAdmin.password = adminPassword;
      await existingAdmin.save();
      console.log("Admin account ensured:", adminPhone);
      return;
    }

    await User.create({
      name: "Admin User",
      phoneNumber: adminPhone,
      password: adminPassword,
      roles: ["admin"]
    });
    console.log("Admin account created:", adminPhone);
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
};

const ConnectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    if (conn) console.log("Connected to MongoDB", conn.connection.host);
    await seedAdminUser();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export default ConnectDb;