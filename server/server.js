import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});
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
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisConnection } from "./utils/queue.js";
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
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to prevent blocking dynamic third-party CDN assets and APIs
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: false,
}));

// CORS middleware MUST be registered before rate limiters or routes so that
// preflight requests and error/rate-limited responses include appropriate CORS headers.
app.use(cors(corsOptions));

// Rate limiting to protect endpoints against API abuse/DDoS
const isVercel = !!process.env.VERCEL;
const rateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === "development" ? 10000 : 200,
  max: process.env.NODE_ENV === "development" ? 10000 : 200, // Fallback alias for older versions of express-rate-limit
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP. Please try again in 15 minutes."
  }
};

if (!isVercel) {
  rateLimitOptions.store = new RedisStore({
    sendCommand: async (...args) => {
      const command = args[0]?.toUpperCase();
      
      // Let script loading commands pass through directly to avoid breaking initialization
      if (command === "SCRIPT") {
        if (!redisConnection) throw new Error("redisConnection not initialized");
        return redisConnection.call(args[0], ...args.slice(1));
      }

      // If Redis connection is completely offline/closed, fail-open immediately
      const status = redisConnection?.status;
      const isOnline = status === "ready" || status === "connecting" || status === "connect" || status === "reconnecting";
      if (!redisConnection || !isOnline) {
        console.warn("[RateLimit Redis] Redis connection offline. Status:", status || "missing", "- Bypassing rate limit check");
        return [1, 900]; // Return dummy response: 1 hit, 900s TTL (fail open)
      }

      let timeoutId;
      const timeoutPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn("[RateLimit Redis] Command timed out - Bypassing rate limit check");
          resolve([1, 900]); // Return dummy response: 1 hit, 900s TTL (fail open)
        }, 1000); // 1 second timeout
      });

      try {
        const result = await Promise.race([
          redisConnection.call(args[0], ...args.slice(1)),
          timeoutPromise
        ]);
        return result;
      } catch (err) {
        console.error("[RateLimit Redis] Command failed:", err.message);
        return [1, 900]; // Return dummy response: 1 hit, 900s TTL (fail open)
      } finally {
        clearTimeout(timeoutId);
      }
    },
    prefix: "rl:gen:",
  });
} else {
  console.log("[Server] Running in Vercel Serverless environment - using memory store for rate limiting");
}

const apiLimiter = rateLimit(rateLimitOptions);
app.use("/api", apiLimiter);

app.use(compression());
app.use(express.json());
app.use(cookieParser());
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

// ── Ensure DB is connected before handling any API request (critical for Vercel) ──
// On Vercel Serverless, the module is imported and the first request arrives
// immediately — before the async ConnectDb().then() at the bottom has resolved.
// Without this middleware, Mongoose buffers operations for up to 30 seconds.
let dbReady = false;
let dbConnectPromise = null;

const ensureDbConnected = async (req, res, next) => {
  if (dbReady) return next();

  try {
    if (!dbConnectPromise) {
      dbConnectPromise = (async () => {
        await ConnectDb();
        await connectRedis().catch(() => undefined);
        dbReady = true;
      })();
    }
    await dbConnectPromise;
    next();
  } catch (err) {
    console.error("[ensureDbConnected] Failed:", err);
    res.status(503).json({ success: false, message: "Service temporarily unavailable" });
  }
};

app.use("/api", ensureDbConnected);

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
      const redisOptions = { url: process.env.REDIS_URL };
      if (process.env.REDIS_URL.startsWith("rediss://")) {
        redisOptions.socket = {
          tls: true,
          rejectUnauthorized: false,
        };
      }
      const pubClient = createClient(redisOptions);
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
// On Vercel, @vercel/node imports this file and uses the default export (the
// Express app) as the serverless handler. DB connection is handled lazily by
// the ensureDbConnected middleware above, so we only need to start an HTTP
// server in non-Vercel environments (local dev, Render, etc.).
if (!isVercel) {
  ConnectDb()
    .then(async () => {
      dbReady = true;
      await connectRedis().catch(() => undefined);
      await setupRedisAdapter();
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
}

// Export for Vercel Serverless (@vercel/node uses the default export)
export default app;