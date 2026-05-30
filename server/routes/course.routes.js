// routes/courses.routes.js
import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js";

const router = express.Router();

router.get("/", getCourses); // LIST:   GET    /courses
router.get("/:id", getCourseById); // GET:    GET    /courses/:id
router.post("/", createCourse); // CREATE: POST   /courses
router.put("/:id", updateCourse); // UPDATE: PUT    /courses/:id
router.delete("/:id", deleteCourse); // DELETE: DELETE /courses/:id

export default router;
