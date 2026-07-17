import mongoose from "mongoose";
import User from "../models/user.model.js";

const adminPhone = "+910000000000";
const adminPassword = "000000";

const seedAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ phoneNumber: adminPhone });
    if (existingAdmin) {
      existingAdmin.roles = ["admin"];
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

// Global is used here to maintain a cached connection across hot reloads
// in development and serverless functions (e.g. Vercel cold starts).
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const ConnectDb = async () => {
  try {
    if (cached.conn) {
      console.log("Reusing existing MongoDB connection");
      return cached.conn;
    }

    if (!cached.promise) {
      // Increase buffer timeout globally for Mongoose to handle slow cold starts
      mongoose.set('bufferTimeoutMS', 30000);

      const opts = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 10000,
        maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || (process.env.NODE_ENV === "production" ? 10 : 100),
      };

      console.log("Creating new MongoDB connection...");
      cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
        console.log("Connected to MongoDB", mongooseInstance.connection.host);
        return mongooseInstance;
      });
    }

    try {
      cached.conn = await cached.promise;
    } catch (e) {
      cached.promise = null;
      throw e;
    }

    await seedAdminUser();
    return cached.conn;
  } catch (error) {
    console.error("Critical: Error connecting to MongoDB:", error);
    throw error;
  }
};

export default ConnectDb;