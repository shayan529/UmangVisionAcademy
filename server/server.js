import "./config/env.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Do NOT exit here — unhandled rejections in async route handlers are
  // recoverable; logging is sufficient. Only uncaughtException (synchronous
  // throw outside any async boundary) requires a hard exit.
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // After an uncaughtException the process is in an undefined state.
  // Node.js docs explicitly recommend exiting. Nodemon will restart.
  process.exit(1);
});
import mongoose from "mongoose";
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
import unsubscribeRoutes from "./routes/unsubscribe.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import { startSessionReminderScheduler } from "./utils/sessionScheduler.js";
import { ensureBaseRoleDocs } from "./utils/seedBaseRoles.js";

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
  "https://umangvisionacademy.com",
  "https://www.umangvisionacademy.com",
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
        hostname === "umangvisionacademy.com" ||
        hostname === "www.umangvisionacademy.com" ||
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
// Production limit is set to 1000 req / 15 min per IP. This is generous
// enough for legitimate users (a heavy session is ~200–300 API calls/hour)
// while still blocking automated scrapers and brute-force attacks.
// The old limit of 200/15 min was too restrictive for 500k concurrent users
// and caused false positives for active students on dashboard-heavy pages.
// Sensitive auth routes (login, OTP) should have their own tighter limiters.
const isVercel = !!process.env.VERCEL;
const rateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === "development" ? 50000 : 1000,
  max: process.env.NODE_ENV === "development" ? 50000 : 1000, // Fallback alias for older versions of express-rate-limit
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP. Please try again in 15 minutes.",
  },
};

// Rate limiting uses the default in-memory store — sufficient for a single
// Hostinger process. Swap back to RedisStore if you move to multi-instance.
const apiLimiter = rateLimit(rateLimitOptions);
app.use("/api", apiLimiter);

app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
// Serve user-uploaded files with a long cache TTL and security headers.
// Content-Disposition: inline lets browsers preview PDFs/images without a
// forced download.
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "30d",
    etag: true,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Vary", "Accept-Encoding");
    },
  }),
);

// Fallback: Redirect /uploads/* requests to Vercel Blob storage if file is not found on local disk
app.use("/uploads", (req, res, next) => {
  const blobBaseUrl = (
    process.env.VERCEL_BLOB_BASE_URL ||
    "https://rfo7jqxbmriqdgqo.public.blob.vercel-storage.com"
  ).replace(/\/$/, "");

  const relativePath = req.url.split("?")[0].replace(/^\/+/, "");
  if (relativePath) {
    return res.redirect(302, `${blobBaseUrl}/${relativePath}`);
  }
  next();
});

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

// inside ensureDbConnected — add the ensureBaseRoleDocs() call:
const ensureDbConnected = async (req, res, next) => {
  if (dbReady) return next();

  try {
    if (!dbConnectPromise) {
      dbConnectPromise = (async () => {
        await ConnectDb();
        await connectRedis().catch(() => undefined);
        await ensureBaseRoleDocs();
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
app.use("/api/unsubscribe", unsubscribeRoutes);

// ── Global error-handling middleware ──────────────────────────────────────────
// Must be registered AFTER all routes. Express routes that call next(err) or
// throw inside an async handler (when wrapped with express-async-handler or
// similar) will land here instead of crashing the process.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[Global Error Handler]", err);
  if (res.headersSent) return next(err);
  res.status(err.status || err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Serve frontend build in production
if (process.env.NODE_ENV === "production") {
  app.use(
    express.static(CLIENT_BUILD_PATH, {
      maxAge: "1y",
      etag: true,
      setHeaders: (res, filePath) => {
        // HTML must never be cached — it contains hashed asset references
        // that change on every deploy.
        if (filePath.endsWith(".html")) {
          res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          );
        } else {
          // Hashed JS/CSS/image assets are immutable — safe to cache for 1 year.
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
        // Tell CDNs and proxies to cache separate copies per encoding
        // (gzip vs br vs identity), otherwise a brotli-compressed asset can
        // be served to a client that only accepts gzip.
        res.setHeader("Vary", "Accept-Encoding");
        // Prevent MIME-type sniffing attacks
        res.setHeader("X-Content-Type-Options", "nosniff");
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

// ── Graceful shutdown (nodemon restarts, Ctrl+C) ─────────────────────────────
// Without closing the HTTP server first, nodemon can restart while port ${PORT}
// is still bound by the old process → EADDRINUSE → "[nodemon] app crashed".
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown || isVercel) return;
  isShuttingDown = true;
  console.log(`\n[Server] ${signal} received — shutting down gracefully...`);

  httpServer.close((err) => {
    if (err) {
      console.error("[Server] Error while closing HTTP server:", err.message);
    }
    mongoose.connection
      .close(false)
      .catch(() => undefined)
      .finally(() => process.exit(0));
  });

  setTimeout(() => {
    console.error("[Server] Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGUSR2", () => gracefulShutdown("SIGUSR2"));

httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Stop the other server instance or change PORT in server/.env`,
    );
  } else {
    console.error("❌ HTTP server error:", err);
  }
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────────────────────────────
// On Vercel, @vercel/node imports this file and uses the default export (the
// Express app) as the serverless handler. DB connection is handled lazily by
// the ensureDbConnected middleware above, so we only need to start an HTTP
// server in non-Vercel environments (local dev, Render, etc.).
// in the !isVercel branch at the bottom:
if (!isVercel) {
  ConnectDb()
    .then(async () => {
      dbReady = true;
      await connectRedis().catch(() => undefined);
      await ensureBaseRoleDocs();
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
