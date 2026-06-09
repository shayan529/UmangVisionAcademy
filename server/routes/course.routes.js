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
  rateCourse, // ← new
} from "../controllers/course.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Public (no auth) ──────────────────────────────────────────────────────────
router.get("/public", getPublishedCourses); // GET  /courses/public
router.get("/public/:id", getCourseByIdPublic); // GET  /courses/public/:id

// ── Protected: specific paths BEFORE /:id ────────────────────────────────────
router.get("/admin/all", protect, getAllCoursesAdmin);
router.get("/enrolled", protect, enrolledCourses);
router.post("/enroll", protect, enrollCourses);

// ── Protected: CRUD + actions ─────────────────────────────────────────────────
router.get("/", protect, getCourses);
router.post("/", protect, createCourse);
router.post("/:id/quiz/submit", protect, submitQuiz);
router.post("/:id/rate", protect, rateCourse); // ← new: POST /courses/:id/rate
router.get("/:id", protect, getCourseById);
router.put("/:id", protect, updateCourse);
router.delete("/:id", protect, deleteCourse);

export default router;
