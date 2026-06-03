// routes/courses.routes.js
import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getCourses); // LIST:   GET    /courses
router.get("/:id", protect, getCourseById); // GET:    GET    /courses/:id
router.post("/", protect, createCourse); // CREATE: POST   /courses
router.put("/:id", protect, updateCourse); // UPDATE: PUT    /courses/:id
router.delete("/:id", protect, deleteCourse); // DELETE: DELETE /courses/:id

export default router;
