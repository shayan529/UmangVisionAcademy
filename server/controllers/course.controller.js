import mongoose from "mongoose";
import Course from "./../models/courses.model.js";
import User from "./../models/user.model.js";
import Cart from "./../models/cart.model.js";
import {
  cacheResponse,
  deleteKey,
  deleteKeys,
  getJson,
  setJson,
} from "../utils/redisClient.js";
import { hasBaseRole, hasPermissionGrant } from "../utils/userRoles.js";
import { sendCourseEnrollmentEmail, sendNewCourseAlertEmail } from "../utils/Mailer.js";
import { computeInstructorRating } from "../utils/instructorRating.js";

// ── notes sanitizer ────────────────────────────────────────────────────────────
// Notes are moderated (pending → approved/rejected by an admin) before they're
// shown to students. This strips any status/rejectedReason the client tries to
// send (an instructor must never be able to self-approve a note), keeps the
// existing status for notes that already existed on the course, and forces
// every genuinely new note to "pending". It also drops any client-generated
// placeholder _id (the course editor uses a temporary Date.now() string id for
// unsaved notes) so Mongoose assigns a real ObjectId instead of failing to
// cast it.
const sanitizeNotesForSave = (incomingNotes, existingNotes = []) => {
  if (!Array.isArray(incomingNotes)) return undefined;

  const existingById = new Map(
    (existingNotes || []).map((n) => [String(n._id), n]),
  );

  return incomingNotes
    .filter((n) => n && n.title && n.fileUrl)
    .map((n) => {
      const existing =
        n._id && mongoose.Types.ObjectId.isValid(n._id)
          ? existingById.get(String(n._id))
          : null;

      return {
        ...(existing ? { _id: existing._id } : {}),
        title: n.title,
        description: n.description || "",
        fileUrl: n.fileUrl,
        subject: n.subject || "",
        status: existing ? existing.status : "pending",
        rejectedReason: existing ? existing.rejectedReason || "" : "",
        createdAt: existing ? existing.createdAt : new Date(),
      };
    });
};

// ── shared shape helper ───────────────────────────────────────────────────────
const shapeCourse = (c) => ({
  _id: c._id,
  title: c.title,
  summary: c.summary,
  description: c.description ?? "",
  category: c.category,
  board: c.board ?? "",
  language: c.language ?? "",
  level: c.level,
  price: c.price,
  thumbnailUrl: c.thumbnailUrl,
  demoVideoUrl: c.demoVideoUrl,
  published: c.published,
  approvalStatus: c.approvalStatus,
  rejectionReason: c.rejectionReason,
  ratingAverage: c.ratingAverage,
  reviewCount: c.reviewCount,
  durationHours: c.durationHours,
  tags: c.tags,
  lessons: c.lessons ?? [],
  quiz: c.quiz ?? { title: "Final Course Quiz", questions: [] },
  subjectQuizzes: c.subjectQuizzes ?? [],
  subjectDetails: c.subjectDetails ?? [],
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
  notes: c.notes ?? [],
});

// ── cache invalidation ────────────────────────────────────────────────────────
// NOTE: previously this used invalidateCache("courses:published*"), which
// relies on Upstash's KEYS/SCAN command. Upstash's REST client frequently
// blocks or errors on KEYS in production, and that error was being silently
// swallowed inside scanKeys(), so the wildcard delete was a no-op — the
// "courses:published" cache entry never actually got busted on enroll/
// approve/reject/update/delete, and stayed stale for the full 7200s TTL.
//
// There's only ever one exact key for the published list, so we delete it
// directly instead of pattern-matching for it.
export const invalidateCourseCache = async (courseId) => {
  await Promise.all([
    deleteKeys(["courses:published"]),
    deleteKeys([`course:public:${courseId}`]),
  ]);
};

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
      language,
      published,
      quiz,
      certificate,
      notes,
      subjectQuizzes,
      subjectDetails,
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ message: "Title is required" });
    if (published === true && !summary?.trim())
      return res.status(400).json({ message: "Summary is required" });

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
      notes: sanitizeNotesForSave(notes, []) ?? [],
      tags: Array.isArray(tags) ? tags : [],
      quiz: quiz && typeof quiz === "object" ? quiz : undefined,
      published: false,
      approvalStatus: wantsPublish ? "pending" : "draft",
      instructor: req.user._id,
      board,
      language,
      students: [],
      certificate:
        certificate && typeof certificate === "object"
          ? certificate
          : undefined,
      subjectQuizzes: Array.isArray(subjectQuizzes) ? subjectQuizzes : [],
      subjectDetails: Array.isArray(subjectDetails) ? subjectDetails : [],
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
    const cacheKey = "courses:published";
    const courses = await cacheResponse(cacheKey, 7200, async () => {
      return await Course.find({
        approvalStatus: "approved",
        published: true,
      })
        .populate("instructor", "name email")
        .sort({ createdAt: -1 })
        .lean();
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── getCourseByIdPublic ───────────────────────────────────────────────────────
export const getCourseByIdPublic = async (req, res) => {
  try {
    const cacheKey = `course:public:${req.params.id}`;
    const cached = await getJson(cacheKey);
    if (cached !== null) {
      if (cached.notes !== undefined && (!cached.instructor || cached.instructor.avgRating !== undefined)) {
        return res.json(cached);
      }
    }

    const course = await Course.findOne({
      _id: req.params.id,
      approvalStatus: "approved",
      published: true,
    })
      .populate("instructor", "name email")
      .lean();

    if (!course) return res.status(404).json({ message: "Course not found" });

    const ratingData = await computeInstructorRating(course.instructor?._id);

    const shaped = {
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
      instructor: course.instructor
        ? {
          _id: course.instructor._id,
          name: course.instructor.name,
          email: course.instructor.email,
          avgRating: ratingData.avgRating,
          ratingCount: ratingData.ratingCount,
        }
        : null,
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
      notes: (course.notes ?? [])
        .filter((note) => note.status === "approved")
        .map((note) => ({
          _id: note._id,
          title: note.title,
          description: note.description,
          fileUrl: note.fileUrl,
          createdAt: note.createdAt,
        })),
    };

    await setJson(cacheKey, shaped, 7200);
    res.json(shaped);
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

export const approveCourse = async (req, res) => {
  try {
    const existingCourse = await Course.findById(req.params.id);
    if (!existingCourse) return res.status(404).json({ message: "Course not found" });

    const wasAlreadyApproved = existingCourse.approvalStatus === "approved";

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "approved",
        published: true,
        rejectionReason: "",
        // Notes are reviewed as part of their parent course. Publishing the
        // reviewed course makes all of its attached notes available too.
        "notes.$[note].status": "approved",
        "notes.$[note].rejectedReason": "",
      },
      {
        new: true,
        arrayFilters: [{ "note.status": { $ne: "approved" } }],
      },
    ).populate("instructor", "name email");

    if (!course) return res.status(404).json({ message: "Course not found" });
    await invalidateCourseCache(course._id);

    // If newly approved, send email notifications to students enrolled in this instructor's other courses
    if (!wasAlreadyApproved) {
      // Find other courses taught by this instructor
      const instructorCourses = await Course.find({
        instructor: course.instructor?._id,
        _id: { $ne: course._id },
      }).select("students");

      // Extract unique student IDs
      const studentIds = [...new Set(instructorCourses.flatMap(c => c.students.map(id => id.toString())))];

      if (studentIds.length > 0) {
        // Find these students, check if they have newCourse notifications enabled
        const students = await User.find({
          _id: { $in: studentIds },
          "notificationSettings.newCourse": { $ne: false },
          email: { $exists: true, $ne: "" },
        }).select("email name");

        const instructorName = course.instructor?.name || "Instructor";

        // Send email to each student
        for (const student of students) {
          sendNewCourseAlertEmail(
            student.email,
            student.name,
            instructorName,
            course.title,
            course.summary,
            course._id
          ).catch(err => console.error(`Failed to send new course alert to ${student.email}:`, err));
        }
      }
    }

    res.json({
      success: true,
      message: "Course and its notes approved and published.",
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
    await invalidateCourseCache(course._id);
    res.json({
      success: true,
      message: "Course rejected.",
      course: shapeCourse(course),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── unrejectCourse (admin only) ───────────────────────────────────────────────
// POST /courses/:id/unreject
export const unrejectCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "pending",
        rejectionReason: "",
      },
      { new: true },
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    await invalidateCourseCache(course._id);
    res.json({
      success: true,
      message: "Course unrejected and marked as pending.",
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

    const student = await User.findById(studentId)
      .select("quizSubmissions subscription selectedClass")
      .lean();

    const query = { $or: [{ students: studentId }] };

    if (student?.subscription?.status === "active" && student?.selectedClass) {
      const escapedClass = student.selectedClass.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.$or.push({ category: new RegExp(`^${escapedClass}$`, "i") });
    }

    const courses = await Course.find(query)
      .populate("instructor", "name email")
      .lean();

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
        // Student's own rating for this course (null if not yet rated)
        userRating:
          course.ratings?.find(
            (r) => r.user?.toString() === studentId.toString(),
          ) ?? null,
        notes: (course.notes ?? []).filter((n) => n.status === "approved"),
      };
    });

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /courses/:id/progress
export const saveCourseProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const courseId = req.params.id;
    const {
      completed = [],
      lastLesson = null,
      lessonProgress = {},
    } = req.body || {};

    // Merge into user's courseProgress map
    const update = {};
    update[`courseProgress.${courseId}`] = {
      completed: Array.isArray(completed) ? completed : [],
      lastLesson: lastLesson ?? null,
      lessonProgress: lessonProgress || {},
      updatedAt: new Date(),
    };

    await User.findByIdAndUpdate(studentId, { $set: update });

    return res.json({ success: true, message: "Progress saved" });
  } catch (err) {
    console.error("saveCourseProgress", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /courses/:id/progress
export const getCourseProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const courseId = req.params.id;
    const student = await User.findById(studentId).select("courseProgress");
    if (!student) return res.status(404).json({ message: "User not found" });
    const progress = (student.courseProgress || {})[courseId] || null;
    return res.json({ progress });
  } catch (err) {
    console.error("getCourseProgress", err);
    res.status(500).json({ message: err.message });
  }
};

const issueCertificateIfEarned = async (studentId, course) => {
  if (!course.certificate?.enabled) return;
  const student = await User.findById(studentId);
  if (!student) return;

  const alreadyIssued = student.earnedCertificates?.some(
    (c) => c.courseId.toString() === course._id.toString(),
  );
  if (alreadyIssued) return;

  await User.findByIdAndUpdate(studentId, {
    $addToSet: {
      earnedCertificates: {
        courseId: course._id,
        courseTitle: course.title,
        issuedAt: new Date(),
        theme: course.certificate?.theme || "purple",
        certificateTitle:
          course.certificate?.title || "Certificate of Completion",
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
    const { courseIds, studentId: requestedStudentId } = req.body;
    if (!Array.isArray(courseIds) || courseIds.length === 0)
      return res
        .status(400)
        .json({ message: "courseIds must be a non-empty array." });

    let studentId = req.user._id;

    if (
      requestedStudentId &&
      requestedStudentId.toString() !== req.user._id.toString()
    ) {
      const canEdit =
        hasBaseRole(req.user, "admin") ||
        hasPermissionGrant(req.user, "users", "edit");
      if (!canEdit) {
        return res
          .status(403)
          .json({ message: "Access denied — cannot enroll other students." });
      }
      studentId = requestedStudentId;
    }

    const enrolled = [],
      alreadyEnrolled = [],
      notFound = [],
      forbidden = [];

    // Pre-fetch user to check subscription and selected class
    const userDoc = await User.findById(studentId).select("subscription selectedClass enrolledCourses");
    const hasActiveSubscription = userDoc?.subscription?.status === "active";
    const userClass = userDoc?.selectedClass?.toLowerCase().trim();

    // Check if the user is an admin or staff (they can bypass payment checks)
    const isAdminOrStaff = hasBaseRole(req.user, "admin") || hasBaseRole(req.user, "staff");

    await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await Course.findById(courseId);
        if (!course) {
          notFound.push(courseId);
          return;
        }

        const alreadyInUser = userDoc.enrolledCourses?.some(id => id.toString() === courseId);
        const alreadyInCourse = course.students.some(id => id.toString() === studentId.toString());

        if (alreadyInUser && alreadyInCourse) {
          alreadyEnrolled.push(courseId);
          return;
        }

        // Price check logic
        if (!alreadyInUser && course.price > 0 && !isAdminOrStaff) {
          const matchesClass = userClass && course.category && userClass === course.category.toLowerCase().trim();
          if (!hasActiveSubscription || !matchesClass) {
            forbidden.push(courseId);
            return; // Skip enrolling this paid course without matching plan
          }
        }

        if (!alreadyInCourse) {
          await Course.findByIdAndUpdate(courseId, {
            $addToSet: { students: studentId },
          });
        }
        if (!alreadyInUser) {
          await User.findByIdAndUpdate(studentId, {
            $addToSet: { enrolledCourses: courseId },
          });
        }
        enrolled.push(courseId);
      }),
    );

    if (forbidden.length > 0 && enrolled.length === 0) {
      return res.status(403).json({ message: "Payment required for selected courses." });
    }

    await Promise.all(
      enrolled.map((id) =>
        invalidateCourseCache(id).catch((err) =>
          console.error(
            "[Cache] Failed to invalidate course cache:",
            err.message,
          ),
        ),
      ),
    );

    await Cart.findOneAndUpdate(
      { user: studentId },
      { $pull: { courses: { $in: courseIds } } },
    );

    if (enrolled.length > 0) {
      const user = await User.findById(studentId);
      if (user && user.email && user.notificationSettings?.emailNotifications !== false) {
        const enrolledCourses = await Course.find({ _id: { $in: enrolled } }).select("title").lean();
        const courseTitles = enrolledCourses.map(c => c.title);
        sendCourseEnrollmentEmail(user.email, user.name, courseTitles).catch(console.error);
      }
    }

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

    const ratingData = await computeInstructorRating(course.instructor?._id);
    const courseObj = course.toObject();
    if (courseObj.instructor) {
      courseObj.instructor.avgRating = ratingData.avgRating;
      courseObj.instructor.ratingCount = ratingData.ratingCount;
    }

    // Students (and anyone who isn't the owning instructor/an admin) should
    // only ever see notes an admin has approved — pending/rejected notes are
    // only visible to the instructor who owns the course or to admins.
    const isOwner =
      course.instructor?._id?.toString() === req.user._id.toString();
    const isAdmin = hasBaseRole(req.user, "admin");
    if (!isOwner && !isAdmin) {
      courseObj.notes = (courseObj.notes ?? []).filter(
        (n) => n.status === "approved",
      );
    }

    res.json(courseObj);
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
      language,
      quiz,
      certificate,
      notes,
      subjectQuizzes,
      subjectDetails,
    } = req.body;

    const existing = await Course.findOne({
      _id: req.params.id,
      instructor: req.user._id,
    });
    if (!existing) return res.status(404).json({ message: "Course not found" });

    if (published === true && !summary?.trim())
      return res.status(400).json({ message: "Summary is required" });

    const wantsPublish = published === true;

    let newApprovalStatus = existing.approvalStatus;
    let newPublished = existing.published;

    if (wantsPublish) {
      newApprovalStatus = "pending";
      newPublished = false;
    } else {
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
      ...(language !== undefined && { language }),
      ...(lessons !== undefined && { lessons }),
      ...(quiz !== undefined && { quiz }),
      ...(certificate !== undefined && { certificate }),
      ...(notes !== undefined && {
        notes: sanitizeNotesForSave(notes, existing.notes || []),
      }),
      ...(subjectQuizzes !== undefined && { subjectQuizzes }),
      ...(subjectDetails !== undefined && { subjectDetails }),
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

    await invalidateCourseCache(course._id);
    res.json(shapeCourse(course));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── rateCourse ────────────────────────────────────────────────────────────────
export const rateCourse = async (req, res) => {
  try {
    const { rating, review, comment } = req.body;
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

    const finalReview = (review ?? comment ?? "").trim();

    if (existingIdx !== -1) {
      course.ratings[existingIdx].rating = stars;
      course.ratings[existingIdx].review = finalReview;
    } else {
      course.ratings.push({
        user: req.user._id,
        rating: stars,
        review: finalReview,
      });
    }

    course.recalcRatings();
    await course.save();

    // Rating changes ratingAverage/reviewCount which are part of the cached
    // published list — invalidate so students see fresh numbers immediately.
    await invalidateCourseCache(course._id);

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
    await invalidateCourseCache(req.params.id);
    res.json({ message: "Course deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── submitQuiz ────────────────────────────────────────────────────────────────
export const submitQuiz = async (req, res) => {
  try {
    const { answers, title = "Final Quiz" } = req.body;
    const course = await Course.findById(req.params.id).populate(
      "instructor",
      "name",
    );

    let targetQuiz = null;
    if (title === "Final Quiz") {
      targetQuiz = course?.quiz;
    } else {
      targetQuiz = course?.subjectQuizzes?.find((q) => q.title === title);
    }

    if (!targetQuiz?.questions?.length)
      return res.status(404).json({ success: false, message: "No quiz found" });

    const questions = targetQuiz.questions;
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
      (s) =>
        s.courseId.toString() === course._id.toString() && s.title === title,
    );
    const prevBestPts = prevSub ? prevSub.score * questions.length * 0.1 : 0;
    const pointsEarned = Math.max(0, pointsThisAttempt - prevBestPts);

    if (!prevSub) {
      student.quizSubmissions.push({
        courseId: course._id,
        title,
        score: percentage,
      });
    } else if (percentage > prevSub.score) {
      prevSub.score = percentage;
      prevSub.completedAt = new Date();
    }
    student.score = (student.score || 0) + pointsEarned;

    const requiresFinalQuiz = course.quiz?.questions?.length > 0;
    const allPassed = requiresFinalQuiz
      ? student.quizSubmissions.some(
          (submission) =>
            submission.courseId.toString() === course._id.toString() &&
            submission.title === "Final Quiz",
        )
      : (course.subjectQuizzes || []).every((requiredQuiz) =>
          student.quizSubmissions.some(
            (submission) =>
              submission.courseId.toString() === course._id.toString() &&
              submission.title === requiredQuiz.title,
          ),
        );

    if (allPassed) {
      const courseRewardKey = "course:" + course._id;
      const reward = await User.updateOne(
        { _id: student._id, coinRewardKeys: { $ne: courseRewardKey } },
        {
          $addToSet: { coinRewardKeys: courseRewardKey },
          $inc: { coins: 25 },
        },
      );
      if (reward.modifiedCount) await deleteKey("students:leaderboard");
    }

    // ── Issue certificate if not already earned ──────────────────────────
    if (course.certificate?.enabled) {
      const alreadyIssued = (student.earnedCertificates ?? []).some(
        (c) => c.courseId.toString() === course._id.toString(),
      );
      if (!alreadyIssued && allPassed) {
        if (!student.earnedCertificates) student.earnedCertificates = [];
        student.earnedCertificates.push({
          courseId: course._id,
          courseTitle: course.title,
          issuedAt: new Date(),
          theme: course.certificate?.theme || "purple",
          certificateTitle:
            course.certificate?.title || "Certificate of Completion",
          signatoryName: course.certificate?.signatoryName || "",
          signatoryTitle: course.certificate?.signatoryTitle || "",
          instructorName: course.instructor?.name || "",
        });

        const certificateRewardKey = "certificate:" + course._id;
        const certificateReward = await User.updateOne(
          { _id: student._id, coinRewardKeys: { $ne: certificateRewardKey } },
          {
            $addToSet: { coinRewardKeys: certificateRewardKey },
            $inc: { coins: 25 },
          },
        );
        if (certificateReward.modifiedCount) {
          await deleteKey("students:leaderboard");
        }
      }
    }

    await student.save();
    const updatedCoinBalance = (await User.findById(student._id).select("coins"))
      ?.coins;

    return res.json({
      success: true,
      percentage,
      correctCount: correct,
      totalQuestions: questions.length,
      pointsEarned,
      newTotalScore: student.score,
      coinBalance: updatedCoinBalance,
      breakdown,
      earnedCertificates: student.earnedCertificates,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
