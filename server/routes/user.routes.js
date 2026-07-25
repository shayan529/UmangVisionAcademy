import express from "express";
import {
  RegisterUser,
  LoginUser,
  SendLoginOtp,
  LoginUserWithOtp,
  LogoutUser,
  getCurrentUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  bulkImportStudents,
  getBulkImportStatus,
  createStudentByAdmin,
  selectClass,
  getInstructorPublicProfile,
} from "./../controllers/user.controller.js";
import {
  protect,
  requirePermission,
  selfOrPermission,
} from "../middleware/auth.middleware.js";
import { hasPermissionGrant } from "../utils/userRoles.js";
import { uploadStudentsImport } from "../middleware/upload.middleware.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/register", RegisterUser);
router.post("/login", LoginUser);
router.post("/send-login-otp", SendLoginOtp);
router.post("/login-otp", LoginUserWithOtp);
router.post("/logout", LogoutUser);
router.get("/instructors/:id/public", getInstructorPublicProfile);

// ── Authenticated self ────────────────────────────────────────────────────────
router.get("/me", protect, getCurrentUser);
router.put("/me/select-class", protect, selectClass);

// ── User listing / bulk import ────────────────────────────────────────────────
// Staff with users:view (or full admin) can list users. Instructors who have
// a courses permission can also list instructors (for the assign-instructor
// dropdown in mock tests / courses, etc.).
router.get("/", protect, (req, res, next) => {
  const isRequestingInstructors = req.query.role === "instructor";
  const hasUsersView = hasPermissionGrant(req.user, "users", "view");
  const hasCoursesPermission =
    hasPermissionGrant(req.user, "courses", "create") ||
    hasPermissionGrant(req.user, "courses", "edit") ||
    hasPermissionGrant(req.user, "courses", "view");

  if (hasUsersView || (isRequestingInstructors && hasCoursesPermission)) {
    return next();
  }

  return requirePermission("users", "view")(req, res, next);
}, getUsers);

router.post(
  "/bulk-import",
  protect,
  requirePermission("users", "create"),
  uploadStudentsImport,
  bulkImportStudents,
);
router.get(
  "/bulk-import/status/:jobId",
  protect,
  requirePermission("users", "create"),
  getBulkImportStatus,
);

// ── Admin create ──────────────────────────────────────────────────────────────
router.post(
  "/admin-create",
  protect,
  requirePermission("users", "create"),
  createStudentByAdmin,
);

// ── User CRUD ─────────────────────────────────────────────────────────────────
router.get("/:id",    protect, selfOrPermission("users", "view"),   getUserById);
router.put("/:id",    protect, selfOrPermission("users", "edit"),   updateUser);
router.delete("/:id", protect, selfOrPermission("users", "delete"), deleteUser);

export default router;
