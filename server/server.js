import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import ConnectDb from "./utils/ConnectDb.js";
import "dotenv/config";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";
import instructorApplicationRoutes from "./routes/instructorApplication.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import studentRoutes from "./routes/student.routes.js";
import cors from "cors";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL =
  process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";
const CLIENT_BUILD_PATH = path.resolve(__dirname, "../client/dist");

// 1. Create HTTP server from Express app
const httpServer = createServer(app);

// 2. Attach Socket.IO to the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

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
app.use("/api", cartRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/auth", emailRoutes);
app.use("/api/auth", PhoneRoutes);
app.use("/api/mock-tests", mockTestRoutes);
app.use("/api/auth", passwordResetRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/achievements", achievementRoutes);

// Serve frontend build in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(CLIENT_BUILD_PATH));
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API route not found" });
    }
    res.sendFile(path.join(CLIENT_BUILD_PATH, "index.html"));
  });
}

// 3. Register session chat handlers
registerSessionChat(io);

// ── Start ─────────────────────────────────────────────────────────────────────
ConnectDb()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });
