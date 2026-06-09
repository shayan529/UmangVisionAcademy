import express from "express";
import {
  getStudents,
  getStudentActivity,
  getStudentById,
  getLeaderboard,
} from "../controllers/student.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// /students/activity and /students/leaderboard must come before /students/:id
router.get("/leaderboard", getLeaderboard);
router.get("/", getStudents);
router.get("/activity", getStudentActivity);
router.get("/:id", getStudentById);

export default router;
