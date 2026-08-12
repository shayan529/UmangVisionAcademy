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
import { sendCourseEnrollmentEmail } from "../utils/Mailer.js";
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

const shapePublishedCourse = (c) => ({
  _id: c._id,
  title: c.title,
  summary: c.summary,
  category: c.category,
  board: c.board ?? "",
  language: c.language ?? "",
  price: c.price,
  thumbnailUrl: c.thumbnailUrl,
  demoVideoUrl: c.demoVideoUrl,
  ratingAverage: c.ratingAverage,
  reviewCount: c.reviewCount,
  durationHours: c.durationHours,
  tags: c.tags ?? [],
  createdAt: c.createdAt,
  instructor: c.instructor,
  studentsCount: c.studentsCount ?? 0,
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
      instructor,
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
      instructor:
        (hasBaseRole(req.user, "admin") ||
          hasPermissionGrant(req.user, "courses", "create")) &&
        instructor
          ? instructor
          : req.user._id,
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

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildExactMatcher = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

// ── getPublishedCourses (public — only admin-approved) ────────────────────────
export const getPublishedCourses = async (req, res) => {
  try {
    const {
      board,
      category,
      language,
      subject,
      limit: limitQuery,
      page: pageQuery,
    } = req.query;

    const limit =
      Number(limitQuery) > 0 ? Math.min(100, Number(limitQuery)) : 0;
    const page = Number(pageQuery) >= 1 ? Number(pageQuery) : 1;
    const skip = limit > 0 ? (page - 1) * limit : 0;

    const cacheKey = [
      "courses:published",
      board ? `board=${board}` : null,
      category ? `category=${category}` : null,
      language ? `language=${language}` : null,
      subject ? `subject=${subject}` : null,
      limit ? `limit=${limit}` : null,
      page > 1 ? `page=${page}` : null,
    ]
      .filter(Boolean)
      .join("|");

    const cacheTtl = 7200; // Cache for 2 hours in Redis (invalidated on course updates)
    const courses = await cacheResponse(cacheKey, cacheTtl, async () => {
      const match = {
        approvalStatus: "approved",
        published: true,
      };

      if (board) match.board = buildExactMatcher(board);
      if (category) match.category = buildExactMatcher(category);
      if (language) match.language = buildExactMatcher(language);
      if (subject) {
        match.$or = [
          { tags: subject },
          { category: buildExactMatcher(subject) },
          { title: { $regex: escapeRegex(subject), $options: "i" } },
          { summary: { $regex: escapeRegex(subject), $options: "i" } },
        ];
      }

      const pipeline = [{ $match: match }, { $sort: { createdAt: -1 } }];

      if (skip > 0) pipeline.push({ $skip: skip });
      if (limit > 0) pipeline.push({ $limit: limit });

      pipeline.push(
        {
          $lookup: {
            from: "users",
            localField: "instructor",
            foreignField: "_id",
            as: "instructor",
          },
        },
        {
          $unwind: {
            path: "$instructor",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            summary: 1,
            category: 1,
            board: 1,
            language: 1,
            price: 1,
            thumbnailUrl: 1,
            demoVideoUrl: 1,
            ratingAverage: 1,
            reviewCount: 1,
            durationHours: 1,
            tags: 1,
            createdAt: 1,
            studentsCount: { $size: { $ifNull: ["$students", []] } },
            instructor: {
              _id: "$instructor._id",
              name: "$instructor.name",
              email: "$instructor.email",
            },
          },
        },
      );

      return await Course.aggregate(pipeline).exec();
    });

    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Cache-Control",
        "public, max-age=60, s-maxage=600, stale-while-revalidate=1200",
      );
    }

    res.json(courses.map(shapePublishedCourse));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── getCourseByIdPublic ───────────────────────────────────────────────────────
export const getCourseByIdPublic = async (req, res) => {
  try {
    const cacheKey = `course:public:${req.params.id}`;
    if (process.env.NODE_ENV !== "development") {
      const cached = await getJson(cacheKey);
      if (cached !== null) {
        if (
          cached.notes !== undefined &&
          (!cached.instructor || cached.instructor.avgRating !== undefined)
        ) {
          if (process.env.NODE_ENV === "production") {
            res.setHeader(
              "Cache-Control",
              "public, max-age=60, s-maxage=600, stale-while-revalidate=1200",
            );
          }
          return res.json(cached);
        }
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
        subject: l.subject,
        chapterTitle: l.chapterTitle ?? "",
        videoUrl: l.videoUrl ?? "",
        content: l.content ?? "",
        pdfUrl: l.pdfUrl ?? "",
      })),
      notes: (course.notes ?? [])
        .filter((note) => note.status === "approved")
        .map((note) => ({
          _id: note._id,
          title: note.title,
          description: note.description,
          fileUrl: note.fileUrl,
          createdAt: note.createdAt,
          subject: note.subject,
        })),
      subjectQuizzes: (course.subjectQuizzes ?? []).map((q) => ({
        subject: q.subject,
        title: q.title,
      })),
      subjectDetails: (course.subjectDetails ?? []).map((d) => ({
        subject: d.subject,
        description: d.description,
        content: d.content,
      })),
    };

    const cacheTtl = 7200; // Cache for 2 hours in Redis (invalidated on course updates)
    await setJson(cacheKey, shaped, cacheTtl);

    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Cache-Control",
        "public, max-age=60, s-maxage=600, stale-while-revalidate=1200",
      );
    }

    res.json(shaped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── getAllCoursesAdmin — returns ALL courses for admin review ─────────────────
export const getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "instructor",
          foreignField: "_id",
          as: "instructor",
        },
      },
      {
        $unwind: {
          path: "$instructor",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          title: 1,
          summary: 1,
          category: 1,
          board: 1,
          language: 1,
          level: 1,
          price: 1,
          approvalStatus: 1,
          published: 1,
          createdAt: 1,
          tags: 1,
          durationHours: 1,
          ratingAverage: 1,
          reviewCount: 1,
          thumbnailUrl: 1,
          demoVideoUrl: 1,
          instructor: {
            _id: "$instructor._id",
            name: "$instructor.name",
            email: "$instructor.email",
          },
          studentsCount: { $size: { $ifNull: ["$students", []] } },
          lessonCount: { $size: { $ifNull: ["$lessons", []] } },
          noteCount: { $size: { $ifNull: ["$notes", []] } },
        },
      },
    ]);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveCourse = async (req, res) => {
  try {
    const existingCourse = await Course.findById(req.params.id);
    if (!existingCourse)
      return res.status(404).json({ message: "Course not found" });

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
      .select(
        "quizSubmissions subscription selectedClass courseProgress planExcludedCourses",
      )
      .lean();

    const query = { $or: [{ students: studentId }] };

    if (student?.subscription?.status === "active" && student?.selectedClass) {
      const escapedClass = student.selectedClass.replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&",
      );
      query.$or.push({ category: new RegExp(`^${escapedClass}$`, "i") });
    }

    // Exclude courses an admin has explicitly removed from this student's plan access
    const excludedIds = (student?.planExcludedCourses ?? []).map((id) =>
      id.toString(),
    );
    if (excludedIds.length > 0) {
      query._id = { $nin: student.planExcludedCourses };
    }

    const courses = await Course.find(query)
      .select(
        "title summary category level price thumbnailUrl board language instructor tags lessons.title lessons.type ratings reviewCount ratingAverage",
      )
      .populate("instructor", "name email")
      .lean();

    const quizMap = {};
    (student?.quizSubmissions ?? []).forEach((s) => {
      quizMap[s.courseId.toString()] = s.score;
    });

    const shaped = courses.map((course) => {
      const totalLessons = course.lessons?.length ?? 0;
      const quizScore = quizMap[course._id.toString()];
      const hasCompletedQuiz = quizScore !== undefined;

      const progObj = student?.courseProgress?.[course._id.toString()] || null;
      const completedLessons = progObj ? (progObj.completed || []).length : 0;

      const progress = hasCompletedQuiz
        ? 100
        : totalLessons > 0
          ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
          : 0;

      return {
        _id: course._id,
        title: course.title,
        summary: course.summary,
        category: course.category,
        level: course.level,
        price: course.price,
        thumbnailUrl: course.thumbnailUrl,
        board: course.board,
        language: course.language ?? "",
        instructor: course.instructor,
        tags: course.tags,
        lessons: course.lessons ?? [],
        totalLessons,
        completedLessons: hasCompletedQuiz ? totalLessons : completedLessons,
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

    const course = await Course.findById(courseId).populate(
      "instructor",
      "name",
    );
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Merge into user's courseProgress map
    const update = {};
    update[`courseProgress.${courseId}`] = {
      completed: Array.isArray(completed) ? completed : [],
      lastLesson: lastLesson ?? null,
      lessonProgress: lessonProgress || {},
      updatedAt: new Date(),
    };

    const student = await User.findByIdAndUpdate(
      studentId,
      { $set: update },
      { new: true },
    );

    if (course.certificate?.enabled) {
      const totalLessons = course.lessons?.length || course.totalLessons || 0;
      const completedCount = Array.isArray(completed) ? completed.length : 0;
      const isProgressComplete =
        completedCount >= totalLessons && totalLessons > 0;

      if (isProgressComplete) {
        const requiresFinalQuiz = course.quiz?.questions?.length > 0;
        const hasSubjectQuizzes = course.subjectQuizzes?.length > 0;

        let allPassed = true;
        if (requiresFinalQuiz || hasSubjectQuizzes) {
          allPassed = requiresFinalQuiz
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
        }

        if (allPassed) {
          await issueCertificateIfEarned(studentId, course);
        }
      }
    }

    // Bust the user cache so courseProgress changes are visible on next /users/me
    await deleteKey(`user:${studentId}`).catch(() => {});

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
        instructorName: course.instructor?.name || "",
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
    const userDoc = await User.findById(studentId).select(
      "subscription selectedClass enrolledCourses",
    );
    const hasActiveSubscription = userDoc?.subscription?.status === "active";
    const userClass = userDoc?.selectedClass?.toLowerCase().trim();

    // Check if the user is an admin or staff (they can bypass payment checks)
    const isAdminOrStaff =
      hasBaseRole(req.user, "admin") || hasBaseRole(req.user, "staff");

    await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await Course.findById(courseId);
        if (!course) {
          notFound.push(courseId);
          return;
        }

        const alreadyInUser = userDoc.enrolledCourses?.some(
          (id) => id.toString() === courseId,
        );
        const alreadyInCourse = course.students.some(
          (id) => id.toString() === studentId.toString(),
        );

        if (alreadyInUser && alreadyInCourse) {
          alreadyEnrolled.push(courseId);
          return;
        }

        // Price check logic
        if (!alreadyInUser && course.price > 0 && !isAdminOrStaff) {
          const matchesClass =
            userClass &&
            course.category &&
            userClass === course.category.toLowerCase().trim();
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
          const userUpdate = { $addToSet: { enrolledCourses: courseId } };
          if (req.body.withInstructorAssistance) {
            userUpdate.$addToSet.instructorAssistanceCourses = courseId;
          }
          await User.findByIdAndUpdate(studentId, userUpdate);
        } else if (req.body.withInstructorAssistance) {
          await User.findByIdAndUpdate(studentId, {
            $addToSet: { instructorAssistanceCourses: courseId },
          });
        }
        enrolled.push(courseId);
      }),
    );

    if (forbidden.length > 0 && enrolled.length === 0) {
      return res
        .status(403)
        .json({ message: "Payment required for selected courses." });
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

    // Bust the user cache so the next /users/me reflects the new enrolledCourses
    await deleteKey(`user:${studentId}`).catch(() => {});

    await Cart.findOneAndUpdate(
      { user: studentId },
      { $pull: { courses: { $in: courseIds } } },
    );

    if (enrolled.length > 0) {
      const user = await User.findById(studentId);
      if (
        user &&
        user.email &&
        user.notificationSettings?.emailNotifications !== false
      ) {
        const enrolledCourses = await Course.find({ _id: { $in: enrolled } })
          .select("title")
          .lean();
        const courseTitles = enrolledCourses.map((c) => c.title);
        sendCourseEnrollmentEmail(
          user.email,
          user.name,
          courseTitles,
          studentId,
        ).catch(console.error);
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

export const getCourseById = async (req, res) => {
  try {
    const includeStudents = req.query.includeStudents === "true";
    const cacheKey = `course:detail:${req.params.id}${
      includeStudents ? ":students" : ""
    }`;
    const cached = await getJson(cacheKey);
    if (cached) {
      // Apply note status filtering dynamically for non-owners/non-admins
      const isOwner =
        cached.instructor?._id?.toString() === req.user?._id?.toString();
      const isAdmin = hasBaseRole(req.user, "admin");
      if (!isOwner && !isAdmin && Array.isArray(cached.notes)) {
        return res.json({
          ...cached,
          notes: cached.notes.filter((n) => n.status === "approved"),
        });
      }
      return res.json(cached);
    }

    let courseQuery = Course.findById(req.params.id)
      .populate("instructor", "name email")
      .populate("ratings.user", "name");

    if (includeStudents) {
      courseQuery = courseQuery.populate(
        "students",
        "name email avatarUrl phoneNumber subscription selectedClass",
      );
    }

    const course = await courseQuery.lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const ratingData = await computeInstructorRating(course.instructor?._id);
    if (course.instructor) {
      course.instructor.avgRating = ratingData.avgRating;
      course.instructor.ratingCount = ratingData.ratingCount;
    }

    course.studentCount = Array.isArray(course.students)
      ? course.students.length
      : 0;
    course.studentsCount = course.studentCount;

    await setJson(cacheKey, course, 60);

    const isOwner =
      course.instructor?._id?.toString() === req.user._id.toString();
    const isAdmin = hasBaseRole(req.user, "admin");
    if (!isOwner && !isAdmin) {
      course.notes = (course.notes ?? []).filter(
        (n) => n.status === "approved",
      );
    }

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
      language,
      quiz,
      certificate,
      notes,
      subjectQuizzes,
      subjectDetails,
      instructor,
    } = req.body;

    const hasAdminOrEdit =
      hasBaseRole(req.user, "admin") ||
      hasPermissionGrant(req.user, "courses", "edit") ||
      hasPermissionGrant(req.user, "courses", "create");
    const query = hasAdminOrEdit
      ? { _id: req.params.id }
      : { _id: req.params.id, instructor: req.user._id };

    const existing = await Course.findOne(query);
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
      ...(hasAdminOrEdit && instructor !== undefined && { instructor }),
      published: newPublished,
      approvalStatus: newApprovalStatus,
      rejectionReason:
        newApprovalStatus === "pending" ? "" : existing.rejectionReason,
    };

    const course = await Course.findOneAndUpdate(query, allowedUpdates, {
      new: true,
      runValidators: true,
    });

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
    const isAdmin = hasBaseRole(req.user, "admin");
    const query = isAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, instructor: req.user._id };

    const course = await Course.findOneAndDelete(query);
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

    // Bust the user cache so the next /users/me request (e.g. Certificates
    // page load) returns the freshly saved earnedCertificates instead of the
    // stale cached copy that predates this quiz submission.
    await deleteKey(`user:${student._id}`);

    const updatedCoinBalance = (
      await User.findById(student._id).select("coins")
    )?.coins;

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

// ── assignCoursesToInstructor ────────────────────────────────────────────────
export const assignCoursesToInstructor = async (req, res) => {
  try {
    const { instructorId, courseIds = [], unassignedCourseIds = [] } = req.body;
    if (!instructorId || !mongoose.Types.ObjectId.isValid(instructorId)) {
      return res
        .status(400)
        .json({ message: "Valid instructorId is required." });
    }

    const instructorUser = await User.findById(instructorId);
    if (!instructorUser) {
      return res.status(404).json({ message: "Instructor not found." });
    }

    const validCourseIds = (Array.isArray(courseIds) ? courseIds : []).filter(
      (id) => mongoose.Types.ObjectId.isValid(id),
    );

    let updatedCount = 0;
    if (validCourseIds.length > 0) {
      const result = await Course.updateMany(
        { _id: { $in: validCourseIds } },
        { $set: { instructor: instructorId } },
      );
      updatedCount += result.modifiedCount || 0;
    }

    if (Array.isArray(unassignedCourseIds) && unassignedCourseIds.length > 0) {
      const validUnassigned = unassignedCourseIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id),
      );
      if (validUnassigned.length > 0) {
        await Course.updateMany(
          { _id: { $in: validUnassigned }, instructor: instructorId },
          { $set: { instructor: req.user._id } },
        );
      }
    }

    await deleteKeys("courses:*");

    res.json({
      success: true,
      message: `Courses assigned to ${instructorUser.name} successfully.`,
      updatedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── unassignCoursesFromStudent ────────────────────────────────────────────────
export const unassignCoursesFromStudent = async (req, res) => {
  try {
    const { studentId, courseIds = [] } = req.body;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Valid studentId is required." });
    }
    const validCourseIds = (Array.isArray(courseIds) ? courseIds : []).filter(
      (id) => mongoose.Types.ObjectId.isValid(id),
    );

    if (validCourseIds.length === 0) {
      return res.status(400).json({ message: "No valid courseIds provided." });
    }

    const canEdit =
      hasBaseRole(req.user, "admin") ||
      hasPermissionGrant(req.user, "users", "edit") ||
      hasBaseRole(req.user, "staff");

    if (!canEdit) {
      return res
        .status(403)
        .json({ message: "Access denied — admin or staff only." });
    }

    // Remove studentId from Course.students
    await Course.updateMany(
      { _id: { $in: validCourseIds } },
      { $pull: { students: studentId } },
    );

    // Remove courseIds from User.enrolledCourses & User.instructorAssistanceCourses
    await User.findByIdAndUpdate(studentId, {
      $pull: {
        enrolledCourses: { $in: validCourseIds },
        instructorAssistanceCourses: { $in: validCourseIds },
      },
    });

    // Invalidate course cache
    await Promise.all(
      validCourseIds.map((id) =>
        invalidateCourseCache(id).catch((err) =>
          console.error(
            "[Cache] Failed to invalidate course cache:",
            err.message,
          ),
        ),
      ),
    );

    await deleteKey(`user:${studentId}`);

    res.json({
      success: true,
      message: "Courses unassigned from student successfully.",
      unassignedCount: validCourseIds.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── toggleStudentInstructorAssistance ───────────────────────────────────────
export const toggleStudentInstructorAssistance = async (req, res) => {
  try {
    const { studentId, courseId, enabled } = req.body;
    if (!studentId || !courseId) {
      return res
        .status(400)
        .json({ message: "studentId and courseId are required." });
    }

    const canEdit =
      hasBaseRole(req.user, "admin") ||
      hasPermissionGrant(req.user, "users", "edit") ||
      hasBaseRole(req.user, "staff");

    if (!canEdit) {
      return res.status(403).json({ message: "Access denied." });
    }

    const update = enabled
      ? { $addToSet: { instructorAssistanceCourses: courseId } }
      : { $pull: { instructorAssistanceCourses: courseId } };

    await User.findByIdAndUpdate(studentId, update);
    await deleteKey(`user:${studentId}`);

    res.json({ success: true, enabled: Boolean(enabled) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── togglePlanCourseExclusion ─────────────────────────────────────────────────
// POST /courses/plan-exclude
// Adds or removes a course from a student's planExcludedCourses array.
// excluded: true  → student can no longer access this course via their plan
// excluded: false → restore plan access (remove from exclusion list)
// Also handles instructorAssistanceCourses in the same call so the admin can
// set assistance state at the same time as toggling exclusion.
export const togglePlanCourseExclusion = async (req, res) => {
  try {
    const { studentId, courseId, excluded, assistanceEnabled } = req.body;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Valid studentId is required." });
    }
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Valid courseId is required." });
    }

    const canEdit =
      hasBaseRole(req.user, "admin") ||
      hasPermissionGrant(req.user, "users", "edit") ||
      hasBaseRole(req.user, "staff");

    if (!canEdit) {
      return res
        .status(403)
        .json({ message: "Access denied — admin or staff only." });
    }

    // Build the update atomically — exclusion toggle + optional assistance toggle
    const update = {};

    if (excluded === true) {
      // Remove from plan: add to excluded list, strip any assistance
      update.$addToSet = { planExcludedCourses: courseId };
      update.$pull = { instructorAssistanceCourses: courseId };
    } else {
      // Restore plan access: remove from excluded list
      update.$pull = { planExcludedCourses: courseId };
    }

    // If assistanceEnabled is explicitly passed (not undefined), honour it.
    // Can't combine $addToSet and $pull on the same path in one op, so run
    // the assistance update separately when needed.
    await User.findByIdAndUpdate(studentId, update);

    if (typeof assistanceEnabled === "boolean" && excluded !== true) {
      const assistanceUpdate = assistanceEnabled
        ? { $addToSet: { instructorAssistanceCourses: courseId } }
        : { $pull: { instructorAssistanceCourses: courseId } };
      await User.findByIdAndUpdate(studentId, assistanceUpdate);
    }

    await deleteKey(`user:${studentId}`);

    res.json({ success: true, excluded: Boolean(excluded) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
