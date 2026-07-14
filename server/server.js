import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import "dotenv/config";
import ConnectDb from "./utils/ConnectDb.js";
import { connectRedis } from "./utils/redisClient.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";
import instructorApplicationRoutes from "./routes/instructorApplication.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import studentRoutes from "./routes/student.routes.js";
import cors from "cors";
import compression from "compression";
import billingRoutes from "./routes/billing.route.js";
import uploadRoutes from "./routes/upload.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import emailRoutes from "./routes/emailAuth.route.js";
import PhoneRoutes from "./routes/PhoneOtp.routes.js";
import { registerSessionChat } from "./utils/SessionChatSocket.js";
import mockTestRoutes from "./routes/mockTest.routes.js";
import passwordResetRoutes from "./routes/passwordReset.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import achievementRoutes from "./routes/achievement.routes.js";
import roleRoutes from "./routes/role.routes.js";
import questionPaperRoutes from "./routes/questionPaper.routes.js";
import referenceRoutes from "./routes/reference.routes.js";
import reelRoutes from "./routes/reel.routes.js";
import noteRoutes from "./routes/note.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import { startSessionReminderScheduler } from "./utils/sessionScheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_BUILD_PATH = path.resolve(__dirname, "../client/dist");

// ── Allowed origins: always include localhost for dev, production URL when set ──
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174", // Vite sometimes uses 5174 as fallback
  // Capacitor's Android WebView sends one of these as its Origin header
  // depending on androidScheme config — without these, every request from
  // the installed APK gets silently CORS-blocked even though the server
  // itself responds fine (shows up client-side as a generic network error,
  // and repeated failed/retried requests are also what makes the app feel slow).
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
];

if (process.env.CLIENT_URL) ALLOWED_ORIGINS.push(process.env.CLIENT_URL);
if (process.env.FRONTEND_URL) ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    // Automatically allow requests from the deployment domain on Render or local development/private network IPs
    try {
      const originUrl = new URL(origin);
      const hostname = originUrl.hostname;
      if (
        hostname === "umangvisionacademy.onrender.com" ||
        hostname === "umang-vision-academy.vercel.app" ||
        hostname.endsWith(".vercel.app") ||
        hostname.endsWith(".onrender.com") ||
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "10.0.2.2" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.")
      ) {
        return callback(null, true);
      }
    } catch (e) {
      // Ignore invalid URL
    }

    // Instead of throwing an Error (which causes Express to return a 500 error),
    // return callback(null, false) to deny CORS headers gracefully.
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// 1. Create HTTP server from Express app
const httpServer = createServer(app);

// 2. Attach Socket.IO to the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Debug logger for APK requests
app.use((req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";
  if (userAgent.includes("Capacitor") || userAgent.includes("Native")) {
    console.log(`[APK Request] ${req.method} ${req.url}`);
    console.log(`  Origin: ${req.headers["origin"]}`);
    console.log(`  Mongoose State: ${mongoose.connection.readyState}`);
  }
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/api", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/instructor-applications", instructorApplicationRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api", cartRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/auth", emailRoutes);
app.use("/api/auth", PhoneRoutes);
app.use("/api/mock-tests", mockTestRoutes);
app.use("/api/auth", passwordResetRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/admin/roles", roleRoutes);
app.use("/api/question-papers", questionPaperRoutes);
app.use("/api/references", referenceRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/notes", noteRoutes);

// Serve frontend build in production
if (process.env.NODE_ENV === "production") {
  app.use(
    express.static(CLIENT_BUILD_PATH, {
      maxAge: "1y",
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          );
        } else {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API route not found" });
    }
    // If the request is for an asset (e.g. starts with /assets/ or has a file extension)
    // but wasn't served by express.static, return a proper 404 instead of serving index.html.
    if (req.path.startsWith("/assets/") || /\.[a-zA-Z0-9]+$/.test(req.path)) {
      return res.status(404).send("Not Found");
    }
    // Set headers to prevent caching of index.html so users always get the latest asset references
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.sendFile(path.join(CLIENT_BUILD_PATH, "index.html"));
  });
}

io.engine.on("connection_error", (err) => {
  console.error("[Socket.IO connection_error]");
  console.error("  req:", err.req?.url);
  console.error("  code:", err.code);
  console.error("  message:", err.message);
  console.error("  context:", err.context);
});

// 3. Register session chat handlers
registerSessionChat(io);

const setupRedisAdapter = async () => {
  if (process.env.REDIS_URL) {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();

      pubClient.on("error", (err) => console.error("[Socket.IO Redis Pub] error:", err.message));
      subClient.on("error", (err) => console.error("[Socket.IO Redis Sub] error:", err.message));

      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log("[Socket.IO] Redis adapter enabled for multiple Vercel instances");
    } catch (err) {
      console.error("[Socket.IO] Failed to setup Redis adapter:", err.message);
    }
  } else {
    console.warn("[Socket.IO] REDIS_URL not set, running without Redis adapter");
  }
};

// ── Start ─────────────────────────────────────────────────────────────────────
ConnectDb()
  .then(async () => {
    await connectRedis().catch(() => undefined);
    await setupRedisAdapter();
    
    // Start live session reminders scheduler
    startSessionReminderScheduler();

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Allowed CORS origins: ${ALLOWED_ORIGINS.join(", ")}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });