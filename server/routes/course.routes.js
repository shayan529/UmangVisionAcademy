import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  getCourseByIdPublic,
  updateCourse,
  deleteCourse,
  enrolledCourses,
  saveCourseProgress,
  getCourseProgress,
  enrollCourses,
  getAllCoursesAdmin,
  getPublishedCourses,
  submitQuiz,
  rateCourse,
  approveCourse,
  rejectCourse,
  unrejectCourse,
  assignCoursesToInstructor,
  unassignCoursesFromStudent,
  toggleStudentInstructorAssistance,
} from "../controllers/course.controller.js";
import {
  protect,
  adminOnly,
  requirePermission,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Public (no auth) ──────────────────────────────────────────────────────────
router.get("/public", getPublishedCourses);
router.get("/public/:id", getCourseByIdPublic);

// ── Protected: specific paths BEFORE /:id ────────────────────────────────────
router.get(
  "/admin/all",
  protect,
  requirePermission("courses", "view"),
  getAllCoursesAdmin,
);
router.put(
  "/assign-instructor",
  protect,
  requirePermission("courses", "edit"),
  assignCoursesToInstructor,
);
router.get("/enrolled", protect, enrolledCourses);
router.post("/:id/progress", protect, saveCourseProgress);
router.get("/:id/progress", protect, getCourseProgress);
router.post("/enroll", protect, enrollCourses);
router.post("/unassign", protect, unassignCoursesFromStudent);
router.post("/toggle-assistance", protect, toggleStudentInstructorAssistance);

// ── Protected: CRUD + actions ─────────────────────────────────────────────────
router.get("/", protect, getCourses);
router.post(
  "/",
  protect,
  requirePermission("courses", "create"),
  createCourse,
);
router.post("/:id/quiz/submit", protect, submitQuiz);
router.post("/:id/rate", protect, rateCourse);

// ── Admin approval actions ────────────────────────────────────────────────────
router.post(
  "/:id/approve",
  protect,
  requirePermission("courses", "approve"),
  approveCourse,
);
router.post(
  "/:id/reject",
  protect,
  requirePermission("courses", "approve"),
  rejectCourse,
);
router.post(
  "/:id/unreject",
  protect,
  requirePermission("courses", "approve"),
  unrejectCourse,
);

router.get("/:id", protect, getCourseById);
router.put(
  "/:id",
  protect,
  requirePermission("courses", "edit"),
  updateCourse,
);
router.delete(
  "/:id",
  protect,
  requirePermission("courses", "delete"),
  deleteCourse,
);

export default router;
