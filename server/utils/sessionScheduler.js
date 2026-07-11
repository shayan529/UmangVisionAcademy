import Session from "../models/session.model.js";
import Course from "../models/courses.model.js";
import User from "../models/user.model.js";
import { sendLiveClassReminderEmail } from "./Mailer.js";

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

export const checkAndSendLiveClassReminders = async () => {
  try {
    const now = new Date();
    const upcomingSessions = await Session.find({
      status: "upcoming",
      reminderSent: { $ne: true },
      date: { $ne: "TBD" },
      time: { $ne: "TBD" },
    }).populate("instructor", "name");

    for (const session of upcomingSessions) {
      const sessionTime = parseSessionDateTimeIST(session.date, session.time);
      if (!sessionTime) continue;

      const diffMs = sessionTime.getTime() - now.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      // Trigger if starting within the next 75 minutes, up to 5 minutes late (just in case)
      if (diffMinutes > -5 && diffMinutes <= 75) {
        session.reminderSent = true;
        await session.save();

        console.log(`⏰ Sending reminders for session: "${session.title}" starting in ${Math.round(diffMinutes)} minutes.`);

        const studentIds = await getStudentsForSession(session);
        if (studentIds.length === 0) continue;

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
      }
    }
  } catch (error) {
    console.error("Error in checkAndSendLiveClassReminders:", error);
  }
};

export const startSessionReminderScheduler = () => {
  console.log("⏰ Session reminder scheduler started (runs every 5 minutes).");
  // Run immediately on server start
  checkAndSendLiveClassReminders().catch(console.error);
  // Repeat every 5 minutes
  setInterval(() => {
    checkAndSendLiveClassReminders().catch(console.error);
  }, 5 * 60 * 1000);
};
