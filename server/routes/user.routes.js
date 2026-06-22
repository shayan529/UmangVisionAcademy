import express from "express";
import {
  RegisterUser,
  LoginUser,
  LogoutUser,
  getCurrentUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  bulkImportStudents,
  createStudentByAdmin,
} from "./../controllers/user.controller.js";
import {
  protect,
  requirePermission,
  selfOrPermission,
} from "../middleware/auth.middleware.js";
import { uploadStudentsImport } from "../middleware/upload.middleware.js";

const router = express.Router();

// Staff with a "users" / "view" permission grant (or full admin) can list
// users and run bulk imports — this is what the Students / Instructors /
// Bulk Import tabs in the Staff dashboard depend on. Previously these were
// adminOnly, which silently 403'd any non-admin Staff member even when the
// sidebar correctly showed them the tab.
router.get("/", protect, requirePermission("users", "view"), getUsers);
router.post(
  "/bulk-import",
  protect,
  requirePermission("users", "create"),
  uploadStudentsImport,
  bulkImportStudents,
);

router.post("/register", RegisterUser);
router.post("/login", LoginUser);
router.post("/logout", LogoutUser);

router.get("/me", protect, getCurrentUser);

router.get("/:id", protect, selfOrPermission("users", "view"), getUserById);
router.put("/:id", protect, selfOrPermission("users", "edit"), updateUser);
router.delete("/:id", protect, selfOrPermission("users", "delete"), deleteUser);

// NOTE: left as adminOnly intentionally — creating new accounts on someone
// else's behalf is a higher-stakes action than just viewing the list. If you
// want Staff with a "users":"create" permission to be able to do this too,
// swap this the same way: requirePermission("users", "create").
router.post(
  "/admin-create",
  protect,
  requirePermission("users", "create"),
  createStudentByAdmin,
);

export default router;
