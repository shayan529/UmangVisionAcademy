import express from "express";
import {
  getStudents,
  getStudentActivity,
  getStudentById,
} from "../controllers/student.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// /students/activity must come before /students/:id
// otherwise Express matches "activity" as the :id param
router.get("/", getStudents);
router.get("/activity", getStudentActivity);
router.get("/:id", getStudentById);

export default router;
