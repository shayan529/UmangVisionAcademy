import Course from "./../models/courses.model.js";
import User from "./../models/user.model.js";
import Cart from "./../models/cart.model.js";

const QUIZ_PASS_SCORE = 60;

const getQuizAnalyticsByCourse = async (courses) => {
  const courseIds = courses.map((course) => course._id);
  const studentIds = [
    ...new Set(
      courses.flatMap((course) =>
        (course.students ?? []).map((studentId) => studentId.toString()),
      ),
    ),
  ];
  const analytics = new Map(
    courseIds.map((courseId) => [
      courseId.toString(),
      {
        quizSubmissionCount: 0,
        quizPassCount: 0,
        quizPassRate: null,
      },
    ]),
  );

  if (courseIds.length === 0 || studentIds.length === 0) return analytics;

  const students = await User.find({
    _id: { $in: studentIds },
    "quizSubmissions.courseId": { $in: courseIds },
  })
    .select("quizSubmissions")
    .lean();

  students.forEach((student) => {
    (student.quizSubmissions ?? []).forEach((submission) => {
      const courseId = submission.courseId?.toString();
      const stat = analytics.get(courseId);
      if (!stat) return;

      stat.quizSubmissionCount += 1;
      if ((submission.score ?? 0) >= QUIZ_PASS_SCORE) {
        stat.quizPassCount += 1;
      }
    });
  });

  analytics.forEach((stat) => {
    stat.quizPassRate =
      stat.quizSubmissionCount > 0
        ? Math.round((stat.quizPassCount / stat.quizSubmissionCount) * 100)
        : null;
  });

  return analytics;
};

// ── shared shape helper ───────────────────────────────────────────────────────
const shapeCourse = (c, quizAnalytics = {}) => ({
  _id: c._id,
  title: c.title,
  summary: c.summary,
  category: c.category,
  level: c.level,
  price: c.price,
  thumbnailUrl: c.thumbnailUrl,
  demoVideoUrl: c.demoVideoUrl,
  published: c.published,
  ratingAverage: c.ratingAverage,
  rating: c.ratingAverage,
  reviewCount: c.reviewCount,
  durationHours: c.durationHours,
  tags: c.tags,
  lessons: c.lessons ?? [],
  quiz: c.quiz ?? { title: "Final Course Quiz", questions: [] },
  ratings: c.ratings ?? [], // include so the frontend can read user's own rating
  lessonCount: c.lessons?.length ?? 0,
  enrolledCount: c.students?.length ?? 0,
  status: c.published ? "published" : "draft",
  revenue: (c.price ?? 0) * (c.students?.length ?? 0),
  quizSubmissionCount: quizAnalytics.quizSubmissionCount ?? 0,
  quizPassCount: quizAnalytics.quizPassCount ?? 0,
  quizPassRate: quizAnalytics.quizPassRate ?? null,
});

// ── createCourse ──────────────────────────────────────────────────────────────
export const createCourse = async (req, res) => {
  try {
    const {
      title,
      summary,
      description,
      category,
      level,
      price,
      thumbnailUrl,
      demoVideoUrl,
      lessons,
      tags,
      board,
      published,
      quiz,
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ message: "Title is required" });
    if (!summary?.trim())
      return res.status(400).json({ message: "Summary is required" });

    const course = await Course.create({
      title: title.trim(),
      summary: summary.trim(),
      description: description || "",
      category: category || "General",
      level: level || "Beginner",
      price: Number(price) || 0,
      thumbnailUrl: thumbnailUrl || "",
      demoVideoUrl: demoVideoUrl || "",
      lessons: Array.isArray(lessons) ? lessons : [],
      tags: Array.isArray(tags) ? tags : [],
      quiz: quiz && typeof quiz === "object" ? quiz : undefined,
      published: published ?? false,
      instructor: req.user._id,
      board: board,
      students: [],
    });

    res.status(201).json(shapeCourse(course));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── getCourses (instructor — own courses only) ────────────────────────────────
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    });
    const quizAnalytics = await getQuizAnalyticsByCourse(courses);
    res.json(
      courses.map((course) =>
        shapeCourse(course, quizAnalytics.get(course._id.toString())),
      ),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── getPublishedCourses (public — no auth) ────────────────────────────────────
export const getPublishedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ published: true })
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── getCourseByIdPublic ───────────────────────────────────────────────────────
export const getCourseByIdPublic = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, published: true })
      .populate("instructor", "name email")
      .lean();

    if (!course) return res.status(404).json({ message: "Course not found" });

    res.json({
      _id: course._id,
      title: course.title,
      summary: course.summary,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
      thumbnailUrl: course.thumbnailUrl,
      demoVideoUrl: course.demoVideoUrl,
      board: course.board,
      instructor: course.instructor,
      tags: course.tags,
      durationHours: course.durationHours,
      ratingAverage: course.ratingAverage,
      reviewCount: course.reviewCount,
      lessonCount: course.lessons?.length ?? 0,
      enrolledCount: course.students?.length ?? 0,
      lessons: (course.lessons ?? []).map((l) => ({
        title: l.title,
        description: l.description,
        durationMinutes: l.durationMinutes,
        type: l.type ?? "video",
        // videoUrl and content intentionally withheld from public
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── getAllCoursesAdmin ────────────────────────────────────────────────────────
export const getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.find({})
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── enrolledCourses ───────────────────────────────────────────────────────────
export const enrolledCourses = async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user._id })
      .populate("instructor", "name email")
      .lean();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── enrollCourses ─────────────────────────────────────────────────────────────
export const enrollCourses = async (req, res) => {
  try {
    const { courseIds } = req.body;
    if (!Array.isArray(courseIds) || courseIds.length === 0)
      return res
        .status(400)
        .json({ message: "courseIds must be a non-empty array." });

    const studentId = req.user._id;
    const enrolled = [],
      alreadyEnrolled = [],
      notFound = [];

    await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await Course.findById(courseId);
        if (!course) {
          notFound.push(courseId);
          return;
        }
        const already = course.students.some(
          (id) => id.toString() === studentId.toString(),
        );
        if (already) {
          alreadyEnrolled.push(courseId);
          return;
        }
        await Course.findByIdAndUpdate(courseId, {
          $addToSet: { students: studentId },
        });
        await User.findByIdAndUpdate(studentId, {
          $addToSet: { enrolledCourses: courseId },
        });
        enrolled.push(courseId);
      }),
    );

    await Cart.findOneAndUpdate(
      { user: studentId },
      { $pull: { courses: { $in: courseIds } } },
    );

    return res.status(200).json({
      enrolled,
      alreadyEnrolled,
      notFound,
      message: enrolled.length
        ? `Successfully enrolled in ${enrolled.length} course(s).`
        : "Already enrolled in all selected courses.",
    });
  } catch (err) {
    console.error("enrollCourses error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ── getCourseById (protected — enrolled students / instructor) ────────────────
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email")
      .populate("students", "name email")
      .populate("ratings.user", "name"); // so frontend can show reviewer names if needed
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── updateCourse ──────────────────────────────────────────────────────────────
export const updateCourse = async (req, res) => {
  try {
    const {
      title,
      summary,
      description,
      category,
      level,
      price,
      thumbnailUrl,
      demoVideoUrl,
      lessons,
      tags,
      published,
      board,
      quiz,
    } = req.body;

    const allowedUpdates = {
      ...(title !== undefined && { title }),
      ...(summary !== undefined && { summary }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(level !== undefined && { level }),
      ...(price !== undefined && { price: Number(price) }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      ...(demoVideoUrl !== undefined && { demoVideoUrl }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      ...(published !== undefined && { published }),
      ...(board !== undefined && { board }),
      ...(lessons !== undefined && { lessons }),
      ...(quiz !== undefined && { quiz }),
    };

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, instructor: req.user._id },
      allowedUpdates,
      { new: true, runValidators: true },
    );

    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(shapeCourse(course));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── rateCourse ────────────────────────────────────────────────────────────────
// POST /courses/:id/rate
// Body: { rating: 1-5, review?: string }
// Only enrolled students can rate. One rating per student (upsert).
export const rateCourse = async (req, res) => {
  try {
    const { rating, review = "" } = req.body;

    // Validate rating value
    const stars = Number(rating);
    if (!stars || stars < 1 || stars > 5)
      return res
        .status(400)
        .json({ message: "Rating must be a number between 1 and 5." });

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found." });

    // Only enrolled students can rate
    const isEnrolled = course.students.some(
      (s) => s.toString() === req.user._id.toString(),
    );
    if (!isEnrolled)
      return res
        .status(403)
        .json({ message: "You must be enrolled to rate this course." });

    // Upsert: update existing rating or push a new one
    const existingIdx = course.ratings.findIndex(
      (r) => r.user.toString() === req.user._id.toString(),
    );

    if (existingIdx !== -1) {
      course.ratings[existingIdx].rating = stars;
      course.ratings[existingIdx].review = review.trim();
    } else {
      course.ratings.push({
        user: req.user._id,
        rating: stars,
        review: review.trim(),
      });
    }

    // Recalculate average and count
    course.recalcRatings();

    await course.save();

    res.json({
      success: true,
      ratingAverage: course.ratingAverage,
      reviewCount: course.reviewCount,
      message: existingIdx !== -1 ? "Rating updated." : "Rating submitted.",
    });
  } catch (err) {
    console.error("rateCourse error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── deleteCourse ──────────────────────────────────────────────────────────────
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({
      _id: req.params.id,
      instructor: req.user._id,
    });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── submitQuiz ────────────────────────────────────────────────────────────────
export const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // { [qIdx]: optionIndex }
    const course = await Course.findById(req.params.id);
    if (!course?.quiz?.questions?.length)
      return res.status(404).json({ success: false, message: "No quiz found" });

    const questions = course.quiz.questions;
    let correct = 0;
    const breakdown = questions.map((q, idx) => {
      const isCorrect = answers[idx] === q.correctOptionIndex;
      if (isCorrect) correct++;
      return {
        correct: isCorrect,
        correctOption: q.options[q.correctOptionIndex],
      };
    });

    const percentage = Math.round((correct / questions.length) * 100);
    const pointsThisAttempt = correct * 10;

    const student = await User.findById(req.user._id);
    const prevSub = student.quizSubmissions.find(
      (s) => s.courseId.toString() === course._id.toString(),
    );
    const prevBestPts = prevSub ? prevSub.score * questions.length * 0.1 : 0;
    const pointsEarned = Math.max(0, pointsThisAttempt - prevBestPts);

    if (!prevSub) {
      student.quizSubmissions.push({ courseId: course._id, score: percentage });
    } else if (percentage > prevSub.score) {
      prevSub.score = percentage;
      prevSub.completedAt = new Date();
    }
    student.score = (student.score || 0) + pointsEarned;
    await student.save();

    return res.json({
      success: true,
      percentage,
      correctCount: correct,
      totalQuestions: questions.length,
      pointsEarned,
      newTotalScore: student.score,
      breakdown,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
