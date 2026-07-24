import User from "../models/user.model.js";
import Course from "../models/courses.model.js";
import { cacheResponse } from "../utils/redisClient.js";

// ── Helper: get all course IDs taught by this instructor ─────────────────────
const getInstructorCourseIds = async (instructorId) => {
  const courses = await Course.find({ instructor: instructorId })
    .select("_id")
    .lean();
  return courses.map((c) => c._id);
};

// GET /students — students enrolled in any of the instructor's courses
export const getStudents = async (req, res) => {
  try {
    const courseIds = await getInstructorCourseIds(req.user._id);

    // Pull courses WITH student arrays so we can compute per-student progress.
    // .lean() skips Mongoose document hydration — ~30 % faster for read-only
    // operations on large collections.
    const courses = await Course.find({ _id: { $in: courseIds } })
      .select("_id title students ratingAverage")
      .lean();

    // Collect unique student IDs
    const studentIds = [
      ...new Set(courses.flatMap((c) => c.students.map((s) => s.toString()))),
    ];

    if (studentIds.length === 0) return res.json([]);

    // Build a map of studentId → enrolled course titles in a single pass
    // (avoids the previous O(n*m) nested .filter() inside .map()).
    const studentCourseMap = new Map(); // studentId → Course[]
    for (const course of courses) {
      for (const sid of course.students) {
        const key = sid.toString();
        if (!studentCourseMap.has(key)) studentCourseMap.set(key, []);
        studentCourseMap.get(key).push(course);
      }
    }

    const users = await User.find({
      _id: { $in: studentIds },
      role: "student",
    })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const shaped = users.map((u) => {
      const uid = u._id.toString();
      const enrolledIn = studentCourseMap.get(uid) || [];

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        init: u.name.slice(0, 2).toUpperCase(),
        enrolledCourse: enrolledIn[0]?.title ?? "—",
        enrolledCount: enrolledIn.length,
        progress: u.progress ?? 0,
        activeThisWeek: u.updatedAt >= sevenDaysAgo,
        completedCourse: false,
      };
    });

    res.json(shaped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /students/leaderboard
// Cache TTL raised to 60 s (was 15 s). The leaderboard scans the entire User
// collection sorted by coins — at 500k users that is expensive. 60 s is still
// fresh enough for a public ranking while cutting DB hits by 4×.
export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await cacheResponse(
      "students:leaderboard",
      60, // seconds — was 15
      async () => {
        return await User.find({ role: "student" })
          .select("name email avatarUrl coins referralsCount state city")
          .sort({ coins: -1, updatedAt: -1 })
          // Cap at 500 entries — sending the full 500k user list to the
          // browser would crash it and is meaningless for a leaderboard UI.
          .limit(500)
          .lean();
      },
    );

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /students/activity — recent activity feed (MUST be registered before /:id)
export const getStudentActivity = async (req, res) => {
  try {
    const courseIds = await getInstructorCourseIds(req.user._id);

    const courses = await Course.find({ _id: { $in: courseIds } })
      .select("_id title students")
      .lean();

    const studentIds = [
      ...new Set(courses.flatMap((c) => c.students.map((s) => s.toString()))),
    ];

    if (studentIds.length === 0) return res.json([]);

    // Build a studentId → first-course-title lookup in O(n) instead of the
    // previous O(n*m) nested .filter() in the response mapping step.
    const studentFirstCourse = new Map();
    for (const course of courses) {
      for (const sid of course.students) {
        const key = sid.toString();
        if (!studentFirstCourse.has(key)) {
          studentFirstCourse.set(key, course.title);
        }
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentUsers = await User.find({
      _id: { $in: studentIds },
      role: "student",
      updatedAt: { $gte: sevenDaysAgo },
    })
      .select("name updatedAt")
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const activity = recentUsers.map((u) => ({
      _id: u._id,
      name: u.name,
      init: u.name.slice(0, 2).toUpperCase(),
      action: `Active in ${studentFirstCourse.get(u._id.toString()) ?? "a course"}`,
      tag: "active",
    }));

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /students/:id
export const getStudentById = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("enrolledCourses", "title summary");

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
