import Session from "../models/session.model.js";
import Course from "../models/courses.model.js";
import {
  cacheResponse,
  deleteKey,
  invalidateCache,
} from "../utils/redisClient.js";
import { scheduleSessionReminder, cancelSessionReminder } from "../utils/queue.js";
import { hasBaseRole, hasPermissionGrant } from "../utils/userRoles.js";

// Helper to check if a user has admin or staff roles or session permissions
const checkIsAdminOrStaff = (user) => {
  if (!user) return false;
  return (
    user.role === "admin" ||
    user.role === "staff" ||
    hasBaseRole(user, "admin") ||
    hasPermissionGrant(user, "sessions", "view") ||
    hasPermissionGrant(user, "sessions", "create") ||
    hasPermissionGrant(user, "sessions", "edit")
  );
};

// GET /sessions/all — for ADMIN/STAFF (all sessions)
export const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find({})
      .populate("course", "title")
      .populate("instructor", "name")
      .sort({ date: 1 })
      .lean();

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /sessions — for INSTRUCTOR (their own sessions)
export const getInstructorSessions = async (req, res) => {
  try {
    const instructorId = req.user._id.toString();
    const cacheKey = `instructor:sessions:${instructorId}`;
    const sessions = await cacheResponse(cacheKey, 300, async () => {
      return await Session.find({ instructor: req.user._id })
        .lean()
        .populate("course", "title")
        .populate("instructor", "name")
        .sort({ date: 1 });
    });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /sessions — for STUDENT (enrolled courses & class-based sessions)
export const getStudentSessions = async (req, res) => {
  try {
    const studentId = req.user._id.toString();
    const cacheKey = `student:sessions:${studentId}`;

    const sessions = await cacheResponse(cacheKey, 300, async () => {
      const query = { $or: [{ students: req.user._id }] };
      if (
        req.user.subscription?.status === "active" &&
        req.user.selectedClass
      ) {
        const escapedClass = req.user.selectedClass.replace(
          /[-/\\^$*+?.()|[\]{}]/g,
          "\\$&",
        );
        query.$or.push({ category: new RegExp(`^${escapedClass}$`, "i") });
      }

      const enrolledCourses = await Course.find(query)
        .select("_id instructor category")
        .lean();

      if (enrolledCourses.length === 0) {
        return [];
      }

      const enrolledCourseIds = enrolledCourses.map((c) => c._id);
      const instructorIds = enrolledCourses
        .map((c) => c.instructor?.toString())
        .filter(Boolean);

      const enrolledClasses = new Set();
      if (req.user.selectedClass) {
        enrolledClasses.add(req.user.selectedClass.toLowerCase().trim());
      }
      enrolledCourses.forEach((c) => {
        if (c.category) {
          enrolledClasses.add(c.category.toLowerCase().trim());
        }
      });

      const classRegexPatterns = Array.from(enrolledClasses).map(
        (cls) => new RegExp(`^${cls.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i")
      );

      const condition1 = { course: { $in: enrolledCourseIds } };
      const condition2 = {
        instructor: { $in: instructorIds },
        $or: [
          { class: null },
          { class: "" },
          ...(classRegexPatterns.length > 0 ? [{ class: { $in: classRegexPatterns } }] : []),
        ],
      };

      return await Session.find({ $or: [condition1, condition2] })
        .populate("course", "title category")
        .populate("instructor", "name")
        .sort({ date: 1 })
        .lean();
    });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /sessions/:id
export const getSessionById = async (req, res) => {
  try {
    if (checkIsAdminOrStaff(req.user)) {
      const session = await Session.findById(req.params.id)
        .populate("course", "title")
        .populate("instructor", "name");

      if (!session)
        return res.status(404).json({ message: "Session not found" });
      return res.json(session);
    }

    const isInstructor = req.user.role === "instructor";

    if (isInstructor) {
      const session = await Session.findOne({
        _id: req.params.id,
        instructor: req.user._id,
      })
        .populate("course", "title")
        .populate("instructor", "name");

      if (!session)
        return res.status(404).json({ message: "Session not found" });
      return res.json(session);
    }

    const query = { $or: [{ students: req.user._id }] };
    if (req.user.subscription?.status === "active" && req.user.selectedClass) {
      const escapedClass = req.user.selectedClass.replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&",
      );
      query.$or.push({ category: new RegExp(`^${escapedClass}$`, "i") });
    }

    const enrolledCourses = await Course.find(query)
      .select("_id instructor category")
      .lean();

    if (enrolledCourses.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    const enrolledCourseIds = enrolledCourses.map((c) => c._id);
    const instructorIds = enrolledCourses
      .map((c) => c.instructor?.toString())
      .filter(Boolean);

    const enrolledClasses = new Set();
    if (req.user.selectedClass) {
      enrolledClasses.add(req.user.selectedClass.toLowerCase().trim());
    }
    enrolledCourses.forEach((c) => {
      if (c.category) {
        enrolledClasses.add(c.category.toLowerCase().trim());
      }
    });

    const classRegexPatterns = Array.from(enrolledClasses).map(
      (cls) => new RegExp(`^${cls.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i")
    );

    const session = await Session.findOne({
      _id: req.params.id,
      $or: [
        { course: { $in: enrolledCourseIds } },
        {
          instructor: { $in: instructorIds },
          $or: [
            { class: null },
            { class: "" },
            ...(classRegexPatterns.length > 0 ? [{ class: { $in: classRegexPatterns } }] : []),
          ],
        },
      ],
    })
      .populate("course", "title")
      .populate("instructor", "name");

    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.status === "upcoming") {
      return res.status(403).json({ message: "Session has not started yet" });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /sessions
export const createSession = async (req, res) => {
  try {
    const {
      title,
      date,
      time,
      status,
      course,
      url,
      instructor,
      class: classVal,
      subject,
    } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "Session title is required" });
    }

    let targetInstructorId = req.user._id;
    if (checkIsAdminOrStaff(req.user) && instructor) {
      targetInstructorId = instructor;
    }

    let session = await Session.create({
      title,
      date: date || "TBD",
      time: time || "TBD",
      status: status || "upcoming",
      course: course || null,
      class: classVal || null,
      subject: subject || null,
      instructor: targetInstructorId,
      url: url || null,
    });

    session = await session.populate("instructor", "name");

    // Invalidate session caches
    await Promise.all([
      deleteKey(`instructor:sessions:${targetInstructorId}`),
      invalidateCache("student:sessions*"),
    ]);

    // Schedule live session reminder
    await scheduleSessionReminder(session).catch((e) =>
      console.error("[Scheduler] Failed to schedule reminder for session:", e.message)
    );

    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /sessions/:id
export const updateSession = async (req, res) => {
  try {
    const query = checkIsAdminOrStaff(req.user)
      ? { _id: req.params.id }
      : { _id: req.params.id, instructor: req.user._id };

    const allowedFields = [
      "title",
      "date",
      "time",
      "status",
      "course",
      "class",
      "subject",
      "url",
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const existingSession = await Session.findOne(query).select("instructor");
    if (!existingSession)
      return res.status(404).json({ message: "Session not found" });

    const oldInstructorId = existingSession.instructor?.toString();

    const session = await Session.findOneAndUpdate(query, updates, {
      new: true,
      runValidators: true,
    }).populate("instructor", "name");
    if (!session) return res.status(404).json({ message: "Session not found" });

    const newInstructorId =
      session.instructor?._id?.toString() || session.instructor?.toString();
    const cacheKeys = new Set();
    if (oldInstructorId)
      cacheKeys.add(`instructor:sessions:${oldInstructorId}`);
    if (newInstructorId)
      cacheKeys.add(`instructor:sessions:${newInstructorId}`);

    // Invalidate session caches
    await Promise.all([
      ...Array.from(cacheKeys).map((key) => deleteKey(key)),
      invalidateCache("student:sessions*"),
    ]);

    // Reschedule/cancel live session reminder
    await scheduleSessionReminder(session).catch((e) =>
      console.error("[Scheduler] Failed to update reminder schedule for session:", e.message)
    );

    res.json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /sessions/:id
export const deleteSession = async (req, res) => {
  try {
    const query = checkIsAdminOrStaff(req.user)
      ? { _id: req.params.id }
      : { _id: req.params.id, instructor: req.user._id };

    const session = await Session.findOneAndDelete(query);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const instructorId =
      session.instructor?._id?.toString() || session.instructor?.toString();

    // Invalidate session caches
    await Promise.all([
      instructorId
        ? deleteKey(`instructor:sessions:${instructorId}`)
        : Promise.resolve(),
      invalidateCache("student:sessions*"),
    ]);

    // Cancel live session reminder
    await cancelSessionReminder(req.params.id).catch((e) =>
      console.error("[Scheduler] Failed to cancel reminder for session:", e.message)
    );

    res.json({ message: "Session deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
