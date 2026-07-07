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
    // Increase buffer timeout globally for Mongoose to handle slow cold starts
    mongoose.set('bufferTimeoutMS', 30000);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
    });

    if (conn) {
      console.log("Connected to MongoDB", conn.connection.host);
      // We keep buffering enabled but with a longer timeout
    }

    await seedAdminUser();
  } catch (error) {
    console.error("Critical: Error connecting to MongoDB:", error);
    throw error;
  }
};

export default ConnectDb;