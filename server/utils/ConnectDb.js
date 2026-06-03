import mongoose from "mongoose";
import User from "../models/user.model.js";

const adminEmail = "admin@gmail.com";
const adminPassword = "admin@123";

const seedAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      existingAdmin.role = "admin";
      existingAdmin.password = adminPassword;
      await existingAdmin.save();
      console.log("Admin account ensured:", adminEmail);
      return;
    }

    await User.create({
      name: "Admin User",
      email: adminEmail,
      password: adminPassword,
      roles: "admin",
    });
    console.log("Admin account created:", adminEmail);
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
