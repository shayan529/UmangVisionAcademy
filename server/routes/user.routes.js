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
  selfOrAdmin,
  adminOnly,
} from "../middleware/auth.middleware.js";
import { uploadStudentsImport } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getUsers);
router.post(
  "/bulk-import",
  protect,
  adminOnly,
  uploadStudentsImport,
  bulkImportStudents,
);

router.post("/register", RegisterUser);
router.post("/login", LoginUser);
router.post("/logout", LogoutUser);

router.get("/me", protect, getCurrentUser);

router.get("/:id", protect, selfOrAdmin, getUserById);
router.put("/:id", protect, selfOrAdmin, updateUser);
router.delete("/:id", protect, selfOrAdmin, deleteUser);
router.post("/admin-create", protect, adminOnly, createStudentByAdmin);

export default router;
