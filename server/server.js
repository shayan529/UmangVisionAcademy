import express from "express";
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
import twilioRoutes from "./routes/twilio.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: CLIENT_URL,
  credentials: true, // required for fetch with credentials
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
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
app.use("/api/auth", twilioRoutes);

ConnectDb();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
