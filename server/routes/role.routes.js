import express from "express";
import {
  getPermissionModules,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  setUserRoles,
} from "../controllers/role.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { createStudentByAdmin } from "../controllers/user.controller.js";

const router = express.Router();

router.use(protect, adminOnly); // every route here is admin-only

router.get("/modules", getPermissionModules);
router.get("/", getRoles);
router.post("/", createRole);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);
router.post(
  "/admin-create",
  protect,
  adminOnly,
  createStudentByAdmin, // new controller, see below
);

router.put("/assign/:id", setUserRoles); // :id = user ID

export default router;
