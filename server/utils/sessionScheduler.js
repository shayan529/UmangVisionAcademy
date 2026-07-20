import Session from "../models/session.model.js";
import Course from "../models/courses.model.js";
import User from "../models/user.model.js";
import { sendLiveClassReminderEmail } from "./Mailer.js";
import { scheduleSessionReminder } from "./queue.js";

const parseSessionDateTimeIST = (dateStr, timeStr) => {
  if (!dateStr || dateStr === "TBD" || !timeStr || timeStr === "TBD") {
    return null;
  }
  const isoStr = `${dateStr}T${timeStr}:00+05:30`;
  const d = new Date(isoStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getStudentsForSession = async (session) => {
  if (session.course) {
    const course = await Course.findById(session.course).select("students");
    if (course) {
      return course.students.map(id => id.toString());
    }
    return [];
  }

  const courses = await Course.find({ instructor: session.instructor }).select("students");
  const studentIds = [...new Set(courses.flatMap(c => c.students.map(id => id.toString())))];

  if (session.class) {
    const students = await User.find({
      _id: { $in: studentIds },
      selectedClass: session.class
    }).select("_id");
    return students.map(s => s._id.toString());
  }

  return studentIds;
};

export const sendSessionReminder = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId).populate("instructor", "name");
    if (!session || session.status !== "upcoming" || session.reminderSent) {
      return;
    }

    session.reminderSent = true;
    await session.save();

    console.log(`⏰ Sending reminders for session: "${session.title}"`);

    const studentIds = await getStudentsForSession(session);
    if (studentIds.length === 0) return;

    const students = await User.find({
      _id: { $in: studentIds },
      "notificationSettings.liveClass": { $ne: false },
      email: { $exists: true, $ne: "" },
    }).select("email name");

    for (const student of students) {
      sendLiveClassReminderEmail(
        student.email,
        student.name,
        session.instructor?.name || "Instructor",
        session.title,
        session.date,
        session.time,
        session.url
      ).catch(err => console.error(`Failed to send session reminder to ${student.email}:`, err));
    }
  } catch (error) {
    console.error(`Error sending session reminder for ${sessionId}:`, error);
  }
};

export const syncScheduledSessionReminders = async () => {
  try {
    console.log("⏰ Syncing upcoming live class reminders...");
    const now = new Date();

    const upcomingSessions = await Session.find({
      status: "upcoming",
      reminderSent: { $ne: true },
      date: { $ne: "TBD" },
      time: { $ne: "TBD" },
    });

    let scheduledCount = 0;
    for (const session of upcomingSessions) {
      const isoStr = `${session.date}T${session.time}:00+05:30`;
      const sessionTime = new Date(isoStr);
      if (Number.isNaN(sessionTime.getTime())) continue;

      const reminderTime = new Date(sessionTime.getTime() - 10 * 60 * 1000);
      if (reminderTime.getTime() > now.getTime()) {
        await scheduleSessionReminder(session);
        scheduledCount++;
      }
    }
    console.log(`⏰ Reminder sync complete. Scheduled ${scheduledCount} session reminder(s).`);
  } catch (error) {
    console.error("Error in syncScheduledSessionReminders:", error);
  }
};

export const startSessionReminderScheduler = () => {
  console.log("⏰ Starting session reminder scheduler (in-process timers)...");
  syncScheduledSessionReminders().catch(console.error);
};
