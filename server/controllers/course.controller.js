import Course from "./../models/courses.model.js";
import User from "./../models/user.model.js";
import Cart from "./../models/cart.model.js";

// ── shared shape helper ───────────────────────────────────────────────────────
const shapeCourse = (c) => ({
  _id: c._id,
  title: c.title,
  summary: c.summary,
  category: c.category,
  level: c.level,
  price: c.price,
  thumbnailUrl: c.thumbnailUrl,
  demoVideoUrl: c.demoVideoUrl,
  published: c.published,
  approvalStatus: c.approvalStatus, // "draft" | "pending" | "approved" | "rejected"
  rejectionReason: c.rejectionReason,
  ratingAverage: c.ratingAverage,
  reviewCount: c.reviewCount,
  durationHours: c.durationHours,
  tags: c.tags,
  lessons: c.lessons ?? [],
  quiz: c.quiz ?? { title: "Final Course Quiz", questions: [] },
  ratings: c.ratings ?? [],
  lessonCount: c.lessons?.length ?? 0,
  enrolledCount: c.students?.length ?? 0,
  status: c.published ? "published" : "draft",
  revenue: (c.price ?? 0) * (c.students?.length ?? 0),
  certificate: c.certificate ?? {
    enabled: false,
    title: "Certificate of Completion",
    signatoryName: "",
    signatoryTitle: "",
    theme: "purple",
  },
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
      certificate,
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ message: "Title is required" });
    if (!summary?.trim())
      return res.status(400).json({ message: "Summary is required" });

    // If instructor clicked "Publish" → set approvalStatus to "pending"
    // If saved as draft → approvalStatus stays "draft", published stays false
    const wantsPublish = published === true;

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
      published: false, // never auto-published
      approvalStatus: wantsPublish ? "pending" : "draft", // pending = awaiting admin
      instructor: req.user._id,
      board,
      students: [],
      certificate: certificate && typeof certificate === "object" ? certificate : undefined,
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
    res.json(courses.map(shapeCourse));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── getPublishedCourses (public — only admin-approved) ────────────────────────
export const getPublishedCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      approvalStatus: "approved",
      published: true,
    })
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
    const course = await Course.findOne({
      _id: req.params.id,
      approvalStatus: "approved",
      published: true,
    })
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
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── getAllCoursesAdmin — returns ALL courses for admin review ─────────────────
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

// ── approveCourse (admin only) ────────────────────────────────────────────────
// POST /courses/:id/approve
export const approveCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "approved",
        published: true,
        rejectionReason: "",
      },
      { new: true },
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({
      success: true,
      message: "Course approved and published.",
      course: shapeCourse(course),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── rejectCourse (admin only) ─────────────────────────────────────────────────
// POST /courses/:id/reject
// Body: { reason?: string }
export const rejectCourse = async (req, res) => {
  try {
    const { reason = "" } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "rejected",
        published: false,
        rejectionReason: reason.trim(),
      },
      { new: true },
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({
      success: true,
      message: "Course rejected.",
      course: shapeCourse(course),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── enrolledCourses ───────────────────────────────────────────────────────────
export const enrolledCourses = async (req, res) => {
  try {
    const studentId = req.user._id;

    const courses = await Course.find({ students: studentId })
      .populate("instructor", "name email")
      .lean();

    const student = await User.findById(studentId).select("quizSubmissions").lean();
    const quizMap = {};
    (student?.quizSubmissions ?? []).forEach((s) => {
      quizMap[s.courseId.toString()] = s.score;
    });

    const shaped = courses.map((course) => {
      const totalLessons = course.lessons?.length ?? 0;
      // No lesson-level completion yet — derive from quiz submission
      // A course is "completed" if the student has submitted the final quiz
      const quizScore = quizMap[course._id.toString()];
      const hasCompletedQuiz = quizScore !== undefined;
      const progress = hasCompletedQuiz ? 100 : 0;

      return {
        _id: course._id,
        title: course.title,
        summary: course.summary,
        category: course.category,
        level: course.level,
        price: course.price,
        thumbnailUrl: course.thumbnailUrl,
        board: course.board,
        instructor: course.instructor,
        tags: course.tags,
        lessons: course.lessons ?? [],
        totalLessons,
        completedLessons: hasCompletedQuiz ? totalLessons : 0,
        progress,
        quizScore: quizScore ?? null,
        certificate: course.certificate ?? null,
        ratingAverage: course.ratingAverage,
        reviewCount: course.reviewCount,
      };
    });

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const issueCertificateIfEarned = async (studentId, course) => {
  if (!course.certificate?.enabled) return;
  const student = await User.findById(studentId);
  if (!student) return;

  const alreadyIssued = student.earnedCertificates?.some(
    (c) => c.courseId.toString() === course._id.toString()
  );
  if (alreadyIssued) return;

  await User.findByIdAndUpdate(studentId, {
    $addToSet: {
      earnedCertificates: {
        courseId: course._id,
        courseTitle: course.title,
        issuedAt: new Date(),
        theme: course.certificate?.theme || "purple",
        certificateTitle: course.certificate?.title || "Certificate of Completion",
        signatoryName: course.certificate?.signatoryName || "",
        signatoryTitle: course.certificate?.signatoryTitle || "",
        instructorName: "", // filled below
      },
    },
  });
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
    res.status(500).json({ message: err.message });
  }
};

// ── getCourseById (protected — enrolled students / instructor) ────────────────
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email")
      .populate("students", "name email")
      .populate("ratings.user", "name");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── updateCourse ──────────────────────────────────────────────────────────────
// When instructor edits a rejected/approved course and re-submits,
// it goes back to "pending" if they clicked publish, otherwise stays "draft".
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
      certificate,
    } = req.body;

    const existing = await Course.findOne({
      _id: req.params.id,
      instructor: req.user._id,
    });
    if (!existing) return res.status(404).json({ message: "Course not found" });

    const wantsPublish = published === true;

    // Re-submission logic:
    // - If currently rejected/draft and instructor clicks publish → reset to pending
    // - If saving as draft → keep or revert to draft
    // - If already approved and instructor saves → keep approved (edits to live course)
    let newApprovalStatus = existing.approvalStatus;
    let newPublished = existing.published;

    if (wantsPublish) {
      if (existing.approvalStatus === "approved") {
        // Already approved — keep published (instructor editing a live course)
        newApprovalStatus = "approved";
        newPublished = true;
      } else {
        // Draft or rejected — send back for review
        newApprovalStatus = "pending";
        newPublished = false;
      }
    } else {
      // Saving as draft — pull back from pending/approved
      newApprovalStatus = "draft";
      newPublished = false;
    }

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
      ...(board !== undefined && { board }),
      ...(lessons !== undefined && { lessons }),
      ...(quiz !== undefined && { quiz }),
      ...(certificate !== undefined && { certificate }),
      published: newPublished,
      approvalStatus: newApprovalStatus,
      rejectionReason:
        newApprovalStatus === "pending" ? "" : existing.rejectionReason,
    };

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, instructor: req.user._id },
      allowedUpdates,
      { new: true, runValidators: true },
    );

    res.json(shapeCourse(course));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── rateCourse ────────────────────────────────────────────────────────────────
export const rateCourse = async (req, res) => {
  try {
    const { rating, review = "" } = req.body;
    const stars = Number(rating);
    if (!stars || stars < 1 || stars > 5)
      return res
        .status(400)
        .json({ message: "Rating must be a number between 1 and 5." });

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found." });

    const isEnrolled = course.students.some(
      (s) => s.toString() === req.user._id.toString(),
    );
    if (!isEnrolled)
      return res
        .status(403)
        .json({ message: "You must be enrolled to rate this course." });

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

    course.recalcRatings();
    await course.save();

    res.json({
      success: true,
      ratingAverage: course.ratingAverage,
      reviewCount: course.reviewCount,
      message: existingIdx !== -1 ? "Rating updated." : "Rating submitted.",
    });
  } catch (err) {
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
    const { answers } = req.body;
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name"); // add populate
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

    // ── Issue certificate if not already earned ──────────────────────────
    if (course.certificate?.enabled) {
      const alreadyIssued = (student.earnedCertificates ?? []).some(
        (c) => c.courseId.toString() === course._id.toString()
      );
      if (!alreadyIssued) {
        if (!student.earnedCertificates) student.earnedCertificates = [];
        student.earnedCertificates.push({
          courseId: course._id,
          courseTitle: course.title,
          issuedAt: new Date(),
          theme: course.certificate?.theme || "purple",
          certificateTitle: course.certificate?.title || "Certificate of Completion",
          signatoryName: course.certificate?.signatoryName || "",
          signatoryTitle: course.certificate?.signatoryTitle || "",
          instructorName: course.instructor?.name || "",
        });
      }
    }

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
