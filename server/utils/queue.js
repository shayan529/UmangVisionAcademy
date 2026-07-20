// ── queue.js (BullMQ-free) ────────────────────────────────────────────────────
// BullMQ and ioredis have been removed because Hostinger shared hosting does
// not support persistent Redis TCP connections required by BullMQ workers.
//
// Replacement strategy per queue:
//   notifications  → emails are sent directly/synchronously by Mailer.js
//   bulk-import    → runs synchronously inside the HTTP request handler
//   mock-test-grading / ranking-update → grading stays synchronous in the
//                    mock test controller; ranking is recomputed on-demand
//
// Session reminders are scheduled with plain node:timers (setTimeout).
// These timers live in-process and are cleared on restart — on server start,
// sessionScheduler.js re-registers all upcoming sessions so nothing is lost.
//
// All exported function signatures are preserved so callers need no changes.

import { sendSessionReminder } from "./sessionScheduler.js";

// In-process timer store: sessionId → TimeoutId
const _reminderTimers = new Map();

// ── Stub queue getters (no-ops — kept for API compatibility) ──────────────────
// Nothing calls these for real work any more, but passwordReset.controller.js
// and the old Mailer queue paths have been updated to send directly.
export const getGradingQueue = () => null;
export const getRankingQueue = () => null;
export const getImportQueue = () => null;
export const getNotificationsQueue = () => null;

// ── scheduleSessionReminder ───────────────────────────────────────────────────
// Schedules (or re-schedules) a setTimeout that fires sendSessionReminder
// 10 minutes before the session starts. Safe to call multiple times for the
// same session — the old timer is cancelled first.
export const scheduleSessionReminder = async (session) => {
  if (
    !session ||
    session.status !== "upcoming" ||
    !session.date ||
    session.date === "TBD" ||
    !session.time ||
    session.time === "TBD"
  ) {
    if (session?._id) {
      await cancelSessionReminder(session._id);
    }
    return;
  }

  const isoStr = `${session.date}T${session.time}:00+05:30`;
  const sessionTime = new Date(isoStr);
  if (Number.isNaN(sessionTime.getTime())) return;

  const reminderTime = new Date(sessionTime.getTime() - 10 * 60 * 1000);
  const delay = reminderTime.getTime() - Date.now();

  const sessionId = session._id.toString();

  // Cancel any existing timer for this session
  await cancelSessionReminder(sessionId);

  if (delay <= 0) {
    console.log(`[Scheduler] Reminder time for session ${sessionId} is in the past — skipping.`);
    return;
  }

  const timerId = setTimeout(async () => {
    _reminderTimers.delete(sessionId);
    try {
      await sendSessionReminder(sessionId);
    } catch (err) {
      console.error(`[Scheduler] Error sending reminder for session ${sessionId}:`, err.message);
    }
  }, delay);

  // Prevent the timer from keeping the process alive if it's the only thing left
  if (timerId.unref) timerId.unref();

  _reminderTimers.set(sessionId, timerId);
  console.log(
    `[Scheduler] Reminder scheduled for session ${sessionId} in ${Math.round(delay / 1000 / 60)} minute(s).`
  );
};

// ── cancelSessionReminder ─────────────────────────────────────────────────────
export const cancelSessionReminder = async (sessionId) => {
  const id = sessionId?.toString();
  const timerId = _reminderTimers.get(id);
  if (timerId) {
    clearTimeout(timerId);
    _reminderTimers.delete(id);
    console.log(`[Scheduler] Cancelled reminder for session ${id}.`);
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
