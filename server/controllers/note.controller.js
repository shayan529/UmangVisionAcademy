import mongoose from "mongoose";
import Note from "../models/note.model.js";
import Course from "../models/courses.model.js";
import { hasBaseRole, hasPermissionGrant } from "../utils/userRoles.js";
import { deleteKeys } from "../utils/redisClient.js";

// ── Notes exist in two places today ─────────────────────────────────────────
// 1. The standalone `Note` collection — created via POST /notes (the
//    "Study Notes" upload modal on the instructor dashboard). Not tied to a
//    specific course.
// 2. `Course.notes[]` — embedded documents added from the Course
//    Creator/Editor's "Subject Study Notes" manager. Tied to one course.
//
// Both need the same pending → approved/rejected moderation workflow before
// they reach students. Every note returned to an admin/instructor is tagged
// with `source` ("standalone" | "course") so the approve/reject/unapprove/
// delete actions below know which collection to update.

const invalidateNoteCaches = async (courseId) => {
  const keys = ["courses:published"];
  if (courseId) keys.push(`course:public:${courseId}`);
  await deleteKeys(keys);
};

const shapeStandaloneNote = (note) => ({
  _id: note._id,
  title: note.title,
  description: note.description,
  fileUrl: note.fileUrl,
  createdAt: note.createdAt,
  status: note.status,
  rejectedReason: note.rejectedReason || "",
  instructor: note.instructor,
  instructorName: note.instructorName,
  courseId: null,
  courseTitle: null,
  source: "standalone",
});

const shapeCourseNote = (note, course) => ({
  _id: note._id,
  title: note.title,
  description: note.description,
  fileUrl: note.fileUrl,
  createdAt: note.createdAt,
  status: note.status || "pending",
  rejectedReason: note.rejectedReason || "",
  instructor: course.instructor,
  instructorName:
    course.instructor?.name || course.instructor?.email || "Instructor",
  courseId: course._id,
  courseTitle: course.title,
  source: "course",
});

export const createNote = async (req, res) => {
  try {
    const { title, description, fileUrl, instructorId } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ message: "fileUrl required" });
    }
    if (!title) {
      return res.status(400).json({ message: "title required" });
    }

    let noteInstructorId = req.user._id;
    let noteInstructorName = req.user.name || req.user.email || "Instructor";

    if (instructorId) {
      if (!hasBaseRole(req.user, "admin")) {
        return res.status(403).json({ message: "Only admins can assign notes to other instructors" });
      }
      const User = mongoose.model("User");
      const assignedInstructor = await User.findById(instructorId);
      if (!assignedInstructor) {
        return res.status(404).json({ message: "Assigned instructor not found" });
      }
      noteInstructorId = assignedInstructor._id;
      noteInstructorName = assignedInstructor.name || assignedInstructor.email || "Instructor";
    }

    const note = await Note.create({
      title,
      description,
      fileUrl,
      instructor: noteInstructorId,
      instructorName: noteInstructorName,
      status: "pending",
    });

    res.json(shapeStandaloneNote(note));
  } catch (err) {
    console.error("createNote", err);
    res.status(500).json({ message: err.message || "Failed to create note" });
  }
};

export const listNotes = async (req, res) => {
  try {
    // ── Admin / moderator: full moderation queue across both note sources ──
    if (req.query.all === "1") {
      const hasAccess =
        req.user &&
        (hasBaseRole(req.user, "admin") ||
          hasPermissionGrant(req.user, "notes", "view") ||
          hasPermissionGrant(req.user, "notes", "approve") ||
          hasPermissionGrant(req.user, "notes", "reject"));
      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied — notes moderation permission required" });
      }

      const [standaloneNotes, courses] = await Promise.all([
        Note.find()
          .populate("instructor", "name email phoneNumber city state")
          .lean(),
        Course.find()
          .populate("instructor", "name email phoneNumber city state")
          .lean(),
      ]);

      const courseNotes = [];
      courses.forEach((course) => {
        (course.notes || []).forEach((note) => {
          courseNotes.push(shapeCourseNote(note, course));
        });
      });

      const allNotes = [
        ...standaloneNotes.map(shapeStandaloneNote),
        ...courseNotes,
      ];
      allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(allNotes);
    }

    const isInstructor = req.user && hasBaseRole(req.user, "instructor");
    const isAdmin = req.user && hasBaseRole(req.user, "admin");

    // ── Instructor/Admin: everything *they* uploaded, across both sources ────────
    if ((isInstructor || isAdmin) && req.query.mine === "1") {
      const [standaloneNotes, courses] = await Promise.all([
        Note.find({ instructor: req.user._id }).lean(),
        Course.find({ instructor: req.user._id }).lean(),
      ]);

      const courseNotes = [];
      courses.forEach((course) => {
        (course.notes || []).forEach((note) => {
          courseNotes.push(
            shapeCourseNote(note, { ...course, instructor: req.user._id }),
          );
        });
      });

      const mineNotes = [
        ...standaloneNotes.map(shapeStandaloneNote),
        ...courseNotes,
      ];
      mineNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(mineNotes);
    }

    // ── Student / public listing — ONLY ever return approved notes ─────────
    if (req.user) {
      const query = { $or: [{ students: req.user._id }] };
      if (req.user.subscription?.status === "active" && req.user.selectedClass) {
        const escapedClass = req.user.selectedClass.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        query.$or.push({ category: new RegExp(`^${escapedClass}$`, "i") });
      }

      const [enrolledCoursesList, approvedStandaloneNotes] = await Promise.all([
        Course.find(query).populate("instructor", "name email").lean(),
        Note.find({ status: "approved" }).lean(),
      ]);

      let studentNotes = [];
      enrolledCoursesList.forEach((course) => {
        (course.notes || [])
          .filter((note) => note.status === "approved")
          .forEach((note) => {
            studentNotes.push({
              _id: note._id,
              title: note.title,
              description: note.description,
              fileUrl: note.fileUrl,
              createdAt: note.createdAt,
              instructorName: course.instructor?.name || "Instructor",
              courseTitle: course.title,
            });
          });
      });

      approvedStandaloneNotes.forEach((note) => {
        studentNotes.push({
          _id: note._id,
          title: note.title,
          description: note.description,
          fileUrl: note.fileUrl,
          createdAt: note.createdAt,
          instructorName: note.instructorName,
          courseTitle: null,
        });
      });

      studentNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(studentNotes);
    }

    return res.json([]);
  } catch (err) {
    console.error("listNotes", err);
    res.status(500).json({ message: err.message || "Failed to list notes" });
  }
};

// Locates the course containing a note subdocument and atomically updates
// that one note's status fields in place.
const updateCourseNoteStatus = async (courseId, noteId, updates) => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) return null;
  const setPayload = {};
  Object.entries(updates).forEach(([key, value]) => {
    setPayload[`notes.$.${key}`] = value;
  });
  const course = await Course.findOneAndUpdate(
    { _id: courseId, "notes._id": noteId },
    { $set: setPayload },
    { new: true },
  ).populate("instructor", "name email");
  return course;
};

export const approveNote = async (req, res) => {
  try {
    const { source, courseId } = req.body || {};

    if (source === "course") {
      const course = await updateCourseNoteStatus(courseId, req.params.id, {
        status: "approved",
        rejectedReason: "",
      });
      if (!course) return res.status(404).json({ message: "Note not found" });
      await invalidateNoteCaches(courseId);
      return res.json(shapeCourseNote(course.notes.id(req.params.id), course));
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    note.status = "approved";
    note.rejectedReason = undefined;
    await note.save();
    res.json(shapeStandaloneNote(note));
  } catch (err) {
    console.error("approveNote", err);
    res.status(500).json({ message: err.message || "Failed to approve note" });
  }
};

export const rejectNote = async (req, res) => {
  try {
    const { reason, source, courseId } = req.body || {};

    if (source === "course") {
      const course = await updateCourseNoteStatus(courseId, req.params.id, {
        status: "rejected",
        rejectedReason: reason || "",
      });
      if (!course) return res.status(404).json({ message: "Note not found" });
      await invalidateNoteCaches(courseId);
      return res.json(shapeCourseNote(course.notes.id(req.params.id), course));
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    note.status = "rejected";
    note.rejectedReason = reason || "";
    await note.save();
    res.json(shapeStandaloneNote(note));
  } catch (err) {
    console.error("rejectNote", err);
    res.status(500).json({ message: err.message || "Failed to reject note" });
  }
};

export const unapproveNote = async (req, res) => {
  try {
    const { source, courseId } = req.body || {};

    if (source === "course") {
      const course = await updateCourseNoteStatus(courseId, req.params.id, {
        status: "pending",
        rejectedReason: "",
      });
      if (!course) return res.status(404).json({ message: "Note not found" });
      await invalidateNoteCaches(courseId);
      return res.json(shapeCourseNote(course.notes.id(req.params.id), course));
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    note.status = "pending";
    note.rejectedReason = undefined;
    await note.save();
    res.json(shapeStandaloneNote(note));
  } catch (err) {
    console.error("unapproveNote", err);
    res.status(500).json({ message: err.message || "Failed to unapprove note" });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { source, courseId } = req.body || {};

    if (source === "course") {
      if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "courseId required" });
      }
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });
      const note = course.notes.id(req.params.id);
      if (!note) return res.status(404).json({ message: "Note not found" });

      const isAdmin = hasBaseRole(req.user, "admin");
      const isOwner = course.instructor.toString() === req.user._id.toString();
      const canDelete =
        isAdmin || isOwner || hasPermissionGrant(req.user, "notes", "delete");
      if (!canDelete) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this note" });
      }

      note.deleteOne();
      await course.save();
      await invalidateNoteCaches(courseId);
      return res.json({ message: "Note deleted successfully" });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const isAdmin = hasBaseRole(req.user, "admin");
    const isOwner = note.instructor.toString() === req.user._id.toString();
    const canDelete = isAdmin || isOwner || hasPermissionGrant(req.user, "notes", "delete");
    if (!canDelete) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this note" });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("deleteNote", err);
    res.status(500).json({ message: err.message || "Failed to delete note" });
  }
};