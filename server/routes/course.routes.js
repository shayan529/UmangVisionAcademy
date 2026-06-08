import express from 'express';
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
} from '../controllers/course.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── Public (no auth) ──────────────────────────────────────────────────────────
router.get('/public', getPublishedCourses); // GET  /courses/public        — all published
router.get('/public/:id', getCourseByIdPublic); // GET  /courses/public/:id    — single course for demo page

// ── Protected: specific paths BEFORE /:id ────────────────────────────────────
router.get('/admin/all', protect, getAllCoursesAdmin); // GET  /courses/admin/all    — admin: all courses
router.get('/enrolled', protect, enrolledCourses); // GET  /courses/enrolled     — student: own enrolled
router.post('/enroll', protect, enrollCourses); // POST /courses/enroll       — student: enroll

// ── Protected: CRUD ───────────────────────────────────────────────────────────
router.get('/', protect, getCourses); // GET  /courses              — instructor: own courses
router.post('/', protect, createCourse); // POST /courses              — instructor: create
router.post('/:id/quiz/submit', protect, submitQuiz); // POST /courses/:id/quiz/submit — student quiz submission
router.get('/:id', protect, getCourseById); // GET  /courses/:id          — full detail (auth)
router.put('/:id', protect, updateCourse); // PUT  /courses/:id          — instructor: update
router.delete('/:id', protect, deleteCourse); // DELETE /courses/:id        — instructor: delete

export default router;
