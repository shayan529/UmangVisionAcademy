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
  adminGetAllTests,
  adminCreateMockTest,
  adminUpdateMockTest,
  adminDeleteMockTest,
  adminAssignMockTest,
  adminTogglePublish,
} from "../controllers/mockTest.controller.js";
import { protect, authorizeRoles, adminOnly, requirePermission } from "../middleware/auth.middleware.js";

// Grants access to admins OR staff with the given mock_tests permission.
const mockTestPermission = (action) => (req, res, next) => {
  // Full admins always pass via requirePermission
  return requirePermission("mock_tests", action)(req, res, next);
};

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

// ── Admin routes ────────────────────────────────────────────
// Admin base role OR staff with the corresponding mock_tests permission grant.
router.get("/admin/all", requirePermission("mock_tests", "view"), adminGetAllTests);           // GET    /api/mock-tests/admin/all
router.post("/admin", requirePermission("mock_tests", "create"), adminCreateMockTest);         // POST   /api/mock-tests/admin
router.put("/admin/:id", requirePermission("mock_tests", "edit"), adminUpdateMockTest);        // PUT    /api/mock-tests/admin/:id
router.delete("/admin/:id", requirePermission("mock_tests", "delete"), adminDeleteMockTest);   // DELETE /api/mock-tests/admin/:id
router.patch("/admin/:id/assign", requirePermission("mock_tests", "assign"), adminAssignMockTest);   // PATCH  /api/mock-tests/admin/:id/assign
router.patch("/admin/:id/publish", requirePermission("mock_tests", "publish"), adminTogglePublish);  // PATCH  /api/mock-tests/admin/:id/publish

export default router;
