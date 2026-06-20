import express from "express";
import {
  getPermissionModules,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  setUserRoles,
} from "../controllers/role.controller.js";
import {
  protect,
  adminOnly,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { createStudentByAdmin } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/modules", protect, adminOnly, getPermissionModules);
router.get("/", protect, adminOnly, getRoles);
router.post("/", protect, adminOnly, createRole);
router.put("/:id", protect, adminOnly, updateRole);
router.delete("/:id", protect, adminOnly, deleteRole);
router.post(
  "/admin-create",
  protect,
  adminOnly,
  createStudentByAdmin, // new controller, see below
);

router.put("/assign/:id", protect, adminOnly, setUserRoles); // :id = user ID

export default router;
