import User from "../models/user.model.js";
import Course from "../models/courses.model.js";

// ── Helper: get all course IDs taught by this instructor ─────────────────────
const getInstructorCourseIds = async (instructorId) => {
  const courses = await Course.find({ instructor: instructorId }).select("_id");
  return courses.map((c) => c._id);
};

// GET /students — students enrolled in any of the instructor's courses
export const getStudents = async (req, res) => {
  try {
    const courseIds = await getInstructorCourseIds(req.user._id);

    // Pull courses WITH student arrays so we can compute per-student progress
    const courses = await Course.find({ _id: { $in: courseIds } }).select(
      "_id title students ratingAverage",
    );

    // Collect unique student IDs
    const studentIds = [
      ...new Set(courses.flatMap((c) => c.students.map((s) => s.toString()))),
    ];

    if (studentIds.length === 0) return res.json([]);

    const users = await User.find({
      _id: { $in: studentIds },
      roles: { $in: ["student"] }, // roles is an array field
    }).select("-password -resetPasswordToken -resetPasswordExpires");

    // Compute per-student stats from course enrollment data
    const shaped = users.map((u) => {
      const uid = u._id.toString();

      // Courses this student is enrolled in (within THIS instructor's courses)
      const enrolledIn = courses.filter((c) =>
        c.students.some((s) => s.toString() === uid),
      );

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        init: u.name.slice(0, 2).toUpperCase(),
        // Use first enrolled course title as display label
        enrolledCourse: enrolledIn[0]?.title ?? "—",
        enrolledCount: enrolledIn.length,
        // No progress field in schema yet — default 0 until you add it
        progress: u.progress ?? 0,
        // Active if updatedAt within last 7 days
        activeThisWeek:
          u.updatedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        // No completedCourse field yet — default false
        completedCourse: false,
      };
    });

    res.json(shaped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /students/activity — recent activity feed (MUST be registered before /:id)
export const getStudentActivity = async (req, res) => {
  try {
    const courseIds = await getInstructorCourseIds(req.user._id);

    const courses = await Course.find({ _id: { $in: courseIds } }).select(
      "_id title students",
    );

    const studentIds = [
      ...new Set(courses.flatMap((c) => c.students.map((s) => s.toString()))),
    ];

    if (studentIds.length === 0) return res.json([]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentUsers = await User.find({
      _id: { $in: studentIds },
      roles: { $in: ["student"] },
      updatedAt: { $gte: sevenDaysAgo },
    })
      .select("name updatedAt")
      .sort({ updatedAt: -1 })
      .limit(10);

    const activity = recentUsers.map((u) => {
      // Find which course they were last active in
      const enrolledIn = courses.filter((c) =>
        c.students.some((s) => s.toString() === u._id.toString()),
      );
      const courseName = enrolledIn[0]?.title ?? "a course";

      return {
        _id: u._id,
        name: u.name,
        init: u.name.slice(0, 2).toUpperCase(),
        action: `Active in ${courseName}`,
        tag: "active",
      };
    });

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
      roles: { $in: ["student"] },
    })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("enrolledCourses", "title summary");

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
