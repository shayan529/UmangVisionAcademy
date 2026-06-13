// routes/mockTestRoutes.js
import express from "express";
import {
  createMockTest,
  togglePublish,
  getInstructorTests,
  updateMockTest,
  deleteMockTest,
  getAvailableTests,
  startTest,
  submitTest,
  getAttemptResult,
  getMyResults,
  getLeaderboard,
  getStudentAnalytics,
} from "../controllers/mockTest.controller.js";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Student routes ──────────────────────────────────────────
router.get("/", getAvailableTests); // GET  /api/mock-tests
router.get("/my-results", getMyResults); // GET  /api/mock-tests/my-results
router.get("/analytics", getStudentAnalytics); // GET  /api/mock-tests/analytics
router.get("/:id/start", startTest); // GET  /api/mock-tests/:id/start
router.post("/attempts/:attemptId/submit", submitTest); // POST /api/mock-tests/attempts/:attemptId/submit
router.get("/attempts/:attemptId/result", getAttemptResult); // GET  /api/mock-tests/attempts/:attemptId/result
router.get("/:testId/leaderboard", getLeaderboard); // GET  /api/mock-tests/:testId/leaderboard

// ── Instructor routes ───────────────────────────────────────
router.post(
  "/instructor",
  authorizeRoles("instructor", "admin"),
  createMockTest,
); // POST /api/mock-tests/instructor
router.get(
  "/instructor/list",
  authorizeRoles("instructor", "admin"),
  getInstructorTests,
); // GET  /api/mock-tests/instructor/list
router.put("/:id", authorizeRoles("instructor", "admin"), updateMockTest); // PUT  /api/mock-tests/:id
router.delete("/:id", authorizeRoles("instructor", "admin"), deleteMockTest); // DELETE /api/mock-tests/:id
router.patch(
  "/:id/publish",
  authorizeRoles("instructor", "admin"),
  togglePublish,
); // PATCH /api/mock-tests/:id/publish

export default router;
