import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  getCourseByIdPublic,
  updateCourse,
  deleteCourse,
  enrolledCourses,
  enrollCourses,
  getAllCoursesAdmin,
  getPublishedCourses,
  submitQuiz,
  rateCourse,
  approveCourse,
  rejectCourse,
} from "../controllers/course.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Public (no auth) ──────────────────────────────────────────────────────────
router.get("/public", getPublishedCourses);
router.get("/public/:id", getCourseByIdPublic);

// ── Protected: specific paths BEFORE /:id ────────────────────────────────────
router.get("/admin/all", protect, adminOnly, getAllCoursesAdmin);
router.get("/enrolled", protect, enrolledCourses);
router.post("/enroll", protect, enrollCourses);

// ── Protected: CRUD + actions ─────────────────────────────────────────────────
router.get("/", protect, getCourses);
router.post("/", protect, createCourse);
router.post("/:id/quiz/submit", protect, submitQuiz);
router.post("/:id/rate", protect, rateCourse);

// ── Admin approval actions ────────────────────────────────────────────────────
router.post("/:id/approve", protect, adminOnly, approveCourse);
router.post("/:id/reject", protect, adminOnly, rejectCourse);

router.get("/:id", protect, getCourseById);
router.put("/:id", protect, updateCourse);
router.delete("/:id", protect, deleteCourse);

export default router;
