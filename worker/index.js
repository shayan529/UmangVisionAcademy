import Redis from "ioredis";
import mongoose from "mongoose";
import express from "express";
import { Worker, Queue } from "bullmq";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import "dotenv/config";

// Set flag so Mailer.js operates in worker mode (actually dispatching SMTP)
process.env.IS_WORKER = "true";

import ConnectDb from "../server/utils/ConnectDb.js";
import MockTestAttempt from "../server/models/mockTestAttempt.model.js";
import MockTest from "../server/models/mockTest.model.js";
import User from "../server/models/user.model.js";
import Course from "../server/models/courses.model.js";
import { sendSessionReminder } from "../server/utils/sessionScheduler.js";
import { sendOtpEmail, sendThemedEmail, sendContactEmail, transporter } from "../server/utils/Mailer.js";
import {
  buildStudentPayload,
  normalizeIndianPhoneNumber,
  getPhoneLookupValues,
  ensureUserReferralCode,
  generateStudentPassword,
} from "../server/controllers/user.controller.js";
import { invalidateCourseCache } from "../server/controllers/course.controller.js";

import { redisConnection } from "../server/utils/queue.js";

// Initialize database
await ConnectDb().then(() => {
  console.log("[Worker MongoDB] Connected to database successfully.");
}).catch((err) => {
  console.error("[Worker MongoDB] Connection failed:", err);
  process.exit(1);
});

// Queue instances (for dashboard adaptation)
const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
};
const gradingQueue = new Queue("mock-test-grading", { connection: redisConnection, defaultJobOptions });
const rankingQueue = new Queue("ranking-update", { connection: redisConnection, defaultJobOptions });
const importQueue = new Queue("bulk-import", { connection: redisConnection, defaultJobOptions });
const notificationsQueue = new Queue("notifications", { connection: redisConnection, defaultJobOptions });

// Attach error listeners to prevent unhandled exception crashes
const queues = [gradingQueue, rankingQueue, importQueue, notificationsQueue];
queues.forEach((q) => {
  q.on("error", (err) => {
    console.error(`[BullMQ Queue ${q.name}] Connection error:`, err.message || err);
  });
});

// ── WORKER 1: mock-test-grading ──────────────────────────────────────────────
const gradingWorker = new Worker(
  "mock-test-grading",
  async (job) => {
    const { attemptId, answers, timeTaken } = job.data;
    console.log(`[Grading Worker] Processing attempt: ${attemptId}`);

    const attempt = await MockTestAttempt.findById(attemptId);
    if (!attempt) throw new Error("Mock test attempt not found");

    const test = await MockTest.findById(attempt.mockTest);
    if (!test) throw new Error("Mock test details not found");

    attempt.status = "grading";
    await attempt.save();

    let score = 0;
    const gradedAnswers = answers.map((a) => {
      const question = test.questions[a.questionIndex];
      const isCorrect = question && a.selectedOption === question.correctOption;
      const marksEarned = isCorrect ? question.marks : 0;
      score += marksEarned;
      return {
        questionIndex: a.questionIndex,
        selectedOption: a.selectedOption,
        isCorrect,
        marksEarned,
      };
    });

    const percentage = Math.round((score / test.totalMarks) * 100);
    const passed = score >= test.passingMarks;

    attempt.answers = gradedAnswers;
    attempt.score = score;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.timeTaken = timeTaken;
    attempt.submittedAt = new Date();
    attempt.status = "completed";
    await attempt.save();

    // Increment attempt counter on parent test
    await MockTest.findByIdAndUpdate(test._id, { $inc: { attempts: 1 } });

    console.log(`[Grading Worker] Graded attempt: ${attemptId}. Score: ${score}/${test.totalMarks}`);

    // Enqueue debounced ranking update
    const rankingJobId = `ranking-update-${test._id}`;
    await rankingQueue.add(
      "ranking-update",
      { testId: test._id },
      {
        jobId: rankingJobId,
        delay: 10000, // 10s debounce window
      }
    );
    console.log(`[Grading Worker] Enqueued debounced ranking update for test: ${test._id}`);
  },
  { connection: redisConnection, concurrency: 5 }
);

// ── WORKER 2: ranking-update ─────────────────────────────────────────────────
const rankingWorker = new Worker(
  "ranking-update",
  async (job) => {
    const { testId } = job.data;
    console.log(`[Ranking Worker] Recomputing leaderboard for test: ${testId}`);

    const attempts = await MockTestAttempt.find({
      mockTest: testId,
      status: "completed",
    })
      .populate("student", "name email")
      .sort({ score: -1, timeTaken: 1 })
      .limit(50);

    const leaderboard = attempts.map((a, i) => ({
      rank: i + 1,
      studentName: a.student?.name || a.student?.email?.split("@")[0] || "Student",
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.percentage,
      timeTaken: a.timeTaken,
      passed: a.passed,
    }));

    // Cache the leaderboard directly to Redis (matches API structure)
    const cacheKey = `mocktests:leaderboard:${testId}`;
    await redisConnection.set(cacheKey, JSON.stringify(leaderboard), "EX", 86400); // 24h cache TTL
    console.log(`[Ranking Worker] Leaderboard updated in Redis for ${testId}`);
  },
  { connection: redisConnection, concurrency: 2 }
);

// ── WORKER 3: bulk-import ────────────────────────────────────────────────────
const bulkImportWorker = new Worker(
  "bulk-import",
  async (job) => {
    const { rows, targetRole, courseIds, source } = job.data;
    console.log(`[Import Worker] Running bulk import of ${rows.length} rows as ${targetRole}`);

    const created = [];
    const skipped = [];
    const totalRows = rows.length;

    for (const [index, row] of rows.entries()) {
      const payload = buildStudentPayload(row);
      const rowNumber = row.__rowIndex ?? index + 2;

      if (!payload.name || !payload.phoneNumber) {
        skipped.push({
          row: rowNumber,
          reason: "Missing required name or phone number",
        });
        continue;
      }

      const cleanPhone = normalizeIndianPhoneNumber(payload.phoneNumber);
      if (!/^\+?\d{8,15}$/.test(cleanPhone)) {
        skipped.push({
          row: rowNumber,
          reason: "Invalid phone number format",
        });
        continue;
      }

      const normalizedEmail = payload.email ? payload.email.toLowerCase() : "";
      const finalPassword = payload.password || generateStudentPassword();

      const existing = await User.findOne({
        $or: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          { phoneNumber: { $in: getPhoneLookupValues(cleanPhone) } },
        ],
      });

      if (existing) {
        skipped.push({
          row: rowNumber,
          reason: "Duplicate email or phone number already exists",
        });
        continue;
      }

      try {
        const user = await User.create({
          name: payload.name,
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
          phoneNumber: cleanPhone,
          password: finalPassword,
          roles: [targetRole],
          ...(payload.city ? { city: payload.city } : {}),
          ...(payload.state ? { state: payload.state } : {}),
          ...(payload.pincode ? { pincode: payload.pincode } : {}),
        });

        const referralCode = await ensureUserReferralCode(user);

        created.push({
          _id: user._id,
          name: user.name,
          email: user.email || null,
          phoneNumber: user.phoneNumber,
          referralCode,
        });
      } catch (error) {
        skipped.push({
          row: rowNumber,
          reason: error.message || "Could not create student",
        });
      }

      // Update progress periodically
      await job.updateProgress(Math.round(((index + 1) / totalRows) * 100));
    }

    if (courseIds.length > 0 && created.length > 0) {
      try {
        const newStudentIds = created.map((c) => c._id);

        await Course.updateMany(
          { _id: { $in: courseIds } },
          { $addToSet: { students: { $each: newStudentIds } } }
        );

        await User.updateMany(
          { _id: { $in: newStudentIds } },
          { $addToSet: { enrolledCourses: { $each: courseIds } } }
        );

        await Promise.all(
          courseIds.map((id) =>
            invalidateCourseCache(id).catch((e) => console.error(e))
          )
        );
      } catch (err) {
        console.error("[Import Worker] Failed to assign courses in bulk import:", err);
      }
    }

    console.log(`[Import Worker] Bulk import finished. Imported: ${created.length}, Skipped: ${skipped.length}`);
    return {
      inserted: created.length,
      skipped: skipped.length,
      skippedRows: skipped,
    };
  },
  { connection: redisConnection, concurrency: 1 } // Process one import file at a time
);

// ── WORKER 4: notifications ──────────────────────────────────────────────────
const notificationsWorker = new Worker(
  "notifications",
  async (job) => {
    const { type } = job.data;
    console.log(`[Notifications Worker] Dispatching notification job: ${job.id} (Type: ${type})`);

    if (type === "session-reminder") {
      const { sessionId } = job.data;
      await sendSessionReminder(sessionId);
    } else if (type === "email-otp") {
      const { recipientEmail, otp } = job.data;
      await sendOtpEmail(recipientEmail, otp);
    } else if (type === "email-themed") {
      const { to, subject, title, bodyHtml } = job.data;
      await sendThemedEmail(to, subject, title, bodyHtml);
    } else if (type === "email-contact") {
      const { name, email, subject, message } = job.data;
      await sendContactEmail(name, email, subject, message);
    } else if (type === "email-raw") {
      const { to, subject, html } = job.data;
      await transporter.sendMail({
        from: `"Umang Vision Academy" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`[Notifications Worker] Raw email sent to: ${to}`);
    } else {
      console.warn(`[Notifications Worker] Unknown notification type: ${type}`);
    }
  },
  { connection: redisConnection, concurrency: 10 }
);

// Log worker errors
const workers = [gradingWorker, rankingWorker, bulkImportWorker, notificationsWorker];
workers.forEach((w) => {
  w.on("failed", (job, err) => {
    console.error(`[Worker ${w.name}] Job ${job?.id} failed:`, err.message || err);
  });
  w.on("error", (err) => {
    console.error(`[Worker ${w.name}] Fatal error:`, err.message || err);
  });
});

// ── Express Server for Queue Dashboard (Bull Board) ──────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// Simple HTTP Basic Auth middleware (Zero-dependency)
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Bull Board Dashboard"');
    return res.status(401).send("Authentication required.");
  }

  const base64Credentials = authHeader.split(" ")[1] || "";
  const [username, password] = Buffer.from(base64Credentials, "base64")
    .toString()
    .split(":");

  const adminUser = process.env.BULL_BOARD_USER || "admin";
  const adminPass = process.env.BULL_BOARD_PASSWORD || "password";

  if (username === adminUser && password === adminPass) {
    return next();
  }

  res.setHeader("WWW-Authenticate", 'Basic realm="Bull Board Dashboard"');
  return res.status(401).send("Invalid credentials.");
};

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(gradingQueue),
    new BullMQAdapter(rankingQueue),
    new BullMQAdapter(importQueue),
    new BullMQAdapter(notificationsQueue),
  ],
  serverAdapter: serverAdapter,
});

app.use("/admin/queues", basicAuth, serverAdapter.getRouter());

// Simple Healthcheck Endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED",
    redis: redisConnection.status,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Standalone background worker server is running on port ${PORT}`);
  console.log(`📊 Bull Board Dashboard available at http://localhost:${PORT}/admin/queues`);
});
