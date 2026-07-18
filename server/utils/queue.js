import Redis from "ioredis";
import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL;
const isVercel = !!process.env.VERCEL;

const connectionOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export let redisConnection;

// On Vercel Serverless, BullMQ queues are never consumed (the worker runs
// separately). Creating ioredis TCP/TLS connections at import time adds
// cold-start latency for connections that are never used. We still create
// the connection eagerly in non-Vercel environments (local dev, Render)
// where the queues ARE used.
if (!isVercel) {
  if (redisUrl) {
    const isTls = redisUrl.startsWith("rediss://");
    redisConnection = new Redis(redisUrl, {
      ...connectionOptions,
      ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    });
    console.log(`[BullMQ Redis] Initialized ioredis connection with URL (TLS: ${isTls})`);
  } else {
    redisConnection = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      ...connectionOptions,
    });
    console.log("[BullMQ Redis] Initialized local ioredis connection");
  }

  redisConnection.on("error", (err) => {
    console.error("[BullMQ Redis] Connection error:", err.message || err);
  });
} else {
  console.log("[BullMQ Redis] Skipping ioredis connection on Vercel Serverless");
}

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: true, // Clean up completed jobs to conserve Redis memory
  removeOnFail: false,    // Keep failed jobs for debugging via the dashboard
};

// Lazy-initialize queues only when not on Vercel
let _gradingQueue, _rankingQueue, _importQueue, _notificationsQueue;

const ensureQueues = () => {
  if (!redisConnection) {
    throw new Error("BullMQ queues are not available in Vercel Serverless environment");
  }
  if (!_gradingQueue) {
    _gradingQueue = new Queue("mock-test-grading", { connection: redisConnection, defaultJobOptions });
    _rankingQueue = new Queue("ranking-update", { connection: redisConnection, defaultJobOptions });
    _importQueue = new Queue("bulk-import", { connection: redisConnection, defaultJobOptions });
    _notificationsQueue = new Queue("notifications", { connection: redisConnection, defaultJobOptions });

    // Attach error listeners to prevent unhandled exception crashes
    [_gradingQueue, _rankingQueue, _importQueue, _notificationsQueue].forEach((q) => {
      q.on("error", (err) => {
        console.error(`[BullMQ Queue ${q.name}] Connection error:`, err.message || err);
      });
    });
  }
};

export const getGradingQueue = () => { ensureQueues(); return _gradingQueue; };
export const getRankingQueue = () => { ensureQueues(); return _rankingQueue; };
export const getImportQueue = () => { ensureQueues(); return _importQueue; };
export const getNotificationsQueue = () => { ensureQueues(); return _notificationsQueue; };

export const scheduleSessionReminder = async (session) => {
  if (!session || session.status !== "upcoming" || !session.date || session.date === "TBD" || !session.time || session.time === "TBD") {
    if (session?._id) {
      await cancelSessionReminder(session._id);
    }
    return;
  }
  
  const isoStr = `${session.date}T${session.time}:00+05:30`;
  const sessionTime = new Date(isoStr);
  if (Number.isNaN(sessionTime.getTime())) return;
  
  // Calculate delay to send reminder 10 minutes before start time
  const reminderTime = new Date(sessionTime.getTime() - 10 * 60 * 1000);
  const delay = reminderTime.getTime() - Date.now();
  const jobId = `session-reminder-${session._id}`;

  try {
    const queue = getNotificationsQueue();
    const existingJob = await queue.getJob(jobId);
    if (existingJob) {
      await existingJob.remove();
      console.log(`[BullMQ] Removed existing reminder job for session: ${session._id}`);
    }
  } catch (err) {
    console.warn(`[BullMQ] Error checking/removing existing job:`, err.message);
  }

  // Only schedule if reminder time is in the future
  if (delay > 0) {
    await getNotificationsQueue().add(
      "session-reminder",
      {
        type: "session-reminder",
        sessionId: session._id,
      },
      {
        jobId,
        delay,
      }
    );
    console.log(`[BullMQ] Scheduled reminder for session: ${session._id} (delay: ${Math.round(delay / 1000 / 60)} minutes)`);
  } else {
    console.log(`[BullMQ] Reminder time for session ${session._id} is in the past, skipping queue schedule.`);
  }
};

export const cancelSessionReminder = async (sessionId) => {
  const jobId = `session-reminder-${sessionId}`;
  try {
    const queue = getNotificationsQueue();
    const existingJob = await queue.getJob(jobId);
    if (existingJob) {
      await existingJob.remove();
      console.log(`[BullMQ] Cancelled reminder job for session: ${sessionId}`);
    }
  } catch (err) {
    console.warn(`[BullMQ] Error cancelling job ${jobId}:`, err.message);
  }
};

export default {
  getGradingQueue,
  getRankingQueue,
  getImportQueue,
  getNotificationsQueue,
  scheduleSessionReminder,
  cancelSessionReminder,
};
