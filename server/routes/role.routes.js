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
router.post(
  "/admin-create",
  protect,
  adminOnly,
  createStudentByAdmin,
);
// IMPORTANT: /assign/:id must be registered BEFORE /:id, otherwise Express
// matches "assign" as the :id param and routes to updateRole instead.
router.put("/assign/:id", protect, adminOnly, setUserRoles); // :id = user ID
router.put("/:id", protect, adminOnly, updateRole);
router.delete("/:id", protect, adminOnly, deleteRole);

export default router;
