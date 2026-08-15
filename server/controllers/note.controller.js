import mongoose from "mongoose";
import Note from "../models/note.model.js";
import Course from "../models/courses.model.js";
import { hasBaseRole, hasPermissionGrant } from "../utils/userRoles.js";
import { cacheResponse, deleteKeys, invalidateCache } from "../utils/redisClient.js";

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
  await invalidateCache("notes:user:*");
};

const shapeStandaloneNote = (note) => ({
  _id: note._id,
  title: note.title,
  description: note.description,
  fileUrl: note.fileUrl,
  subject: note.subject || "",
  chapterTitle: note.chapterTitle || "",
  createdAt: note.createdAt,
  status: note.status,
  rejectedReason: note.rejectedReason || "",
  instructor: note.instructor,
  instructorName:
    (typeof note.instructor === "object" && note.instructor?.name) ||
    note.instructorName ||
    (typeof note.instructor === "object" && note.instructor?.email) ||
    "Instructor",
  courseId: null,
  courseTitle: null,
  source: "standalone",
});

const shapeCourseNote = (note, course) => ({
  _id: note._id,
  title: note.title,
  description: note.description,
  fileUrl: note.fileUrl,
  subject: note.subject || "",
  chapterTitle: note.chapterTitle || "",
  createdAt: note.createdAt,
  status: note.status || "pending",
  rejectedReason: note.rejectedReason || "",
  instructor: course.instructor,
  instructorName:
    (typeof course.instructor === "object" && course.instructor?.name) ||
    course.instructorName ||
    course.instructor?.email ||
    "Instructor",
  courseId: course._id,
  courseTitle: course.title,
  source: "course",
});

export const createNote = async (req, res) => {
  try {
    const {
      title,
      description,
      fileUrl,
      instructorId,
      courseId,
      subject,
      chapterTitle,
      addToCurriculum = true,
    } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ message: "fileUrl required" });
    }

    let finalTitle = title?.trim();
    if (!finalTitle) {
      const rawName = fileUrl.split("/").pop()?.split("?")[0] || "Untitled Note";
      const cleanName = decodeURIComponent(rawName)
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();
      finalTitle = cleanName
        ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
        : "Untitled Study Note";
    }

    if (courseId) {
      const course = await Course.findById(courseId).populate("instructor");
      if (!course) {
        return res.status(404).json({ message: "Assigned course not found" });
      }
      if (!hasBaseRole(req.user, "admin") && course.instructor._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You don't have permission to add notes to this course" });
      }

      const finalSubject = (subject && String(subject).trim()) || course.category || "General";
      const finalChapter = (chapterTitle && String(chapterTitle).trim()) || "Chapter 1: Study Notes";

      const newNote = {
        title: finalTitle,
        description: description || "",
        fileUrl,
        subject: finalSubject,
        chapterTitle: finalChapter,
        status: "pending",
        createdAt: new Date(),
      };

      course.notes = course.notes || [];
      course.notes.push(newNote);

      if (addToCurriculum) {
        course.lessons = course.lessons || [];
        const existingLessonIdx = course.lessons.findIndex(
          (l) => (l.pdfUrl && l.pdfUrl === fileUrl) || (l.title === finalTitle && l.chapterTitle === finalChapter)
        );
        const lessonData = {
          title: finalTitle,
          description: description || "",
          chapterTitle: finalChapter,
          subject: finalSubject,
          type: "text",
          videoType: "video",
          content: description || "",
          pdfUrl: fileUrl,
        };
        if (existingLessonIdx >= 0) {
          course.lessons[existingLessonIdx] = {
            ...(course.lessons[existingLessonIdx].toObject?.() || course.lessons[existingLessonIdx]),
            ...lessonData,
          };
        } else {
          course.lessons.push(lessonData);
        }
      }

      await course.save();

      const pushedNote = course.notes[course.notes.length - 1];
      await invalidateNoteCaches(course._id);

      return res.json(shapeCourseNote(pushedNote, course));
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
      title: finalTitle,
      description: description || "",
      fileUrl,
      subject: subject?.trim() || "",
      chapterTitle: chapterTitle?.trim() || "",
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

export const bulkCreateNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ message: "An array of notes is required" });
    }

    const createdNotes = [];
    let defaultInstructorId = req.user._id;
    let defaultInstructorName = req.user.name || req.user.email || "Instructor";

    for (const item of notes) {
      const { title, description, fileUrl, instructorId, courseId } = item;
      if (!fileUrl || !title) continue;

      if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
        const course = await Course.findById(courseId).populate("instructor");
        if (course) {
          const newNote = {
            title,
            description: description || "",
            fileUrl,
            status: "pending",
            createdAt: new Date(),
          };
          course.notes = course.notes || [];
          course.notes.push(newNote);
          await course.save();
          const pushedNote = course.notes[course.notes.length - 1];
          createdNotes.push(shapeCourseNote(pushedNote, course));
          await invalidateNoteCaches(course._id);
          continue;
        }
      }

      let finalInstId = defaultInstructorId;
      let finalInstName = defaultInstructorName;

      if (instructorId && hasBaseRole(req.user, "admin")) {
        const User = mongoose.model("User");
        const assignedInstructor = await User.findById(instructorId);
        if (assignedInstructor) {
          finalInstId = assignedInstructor._id;
          finalInstName = assignedInstructor.name || assignedInstructor.email || "Instructor";
        }
      }

      const note = await Note.create({
        title,
        description: description || "",
        fileUrl,
        instructor: finalInstId,
        instructorName: finalInstName,
        status: "pending",
      });
      createdNotes.push(shapeStandaloneNote(note));
    }

    await invalidateNoteCaches();
    return res.json({
      success: true,
      message: `Successfully uploaded ${createdNotes.length} notes`,
      notes: createdNotes,
    });
  } catch (err) {
    console.error("bulkCreateNotes", err);
    res.status(500).json({ message: err.message || "Failed to bulk upload notes" });
  }
};

export const bulkActionNotes = async (req, res) => {
  try {
    const { action, notes, reason } = req.body || {};
    if (!action || !Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ message: "Action and array of target notes required" });
    }

    let processedCount = 0;

    for (const item of notes) {
      const noteId = typeof item === "string" ? item : item._id || item.id;
      const source = typeof item === "object" ? item.source : "standalone";
      const courseId = typeof item === "object" ? item.courseId : undefined;

      if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) continue;

      if (action === "approve") {
        if (source === "course" && courseId) {
          await updateCourseNoteStatus(courseId, noteId, { status: "approved", rejectedReason: "" });
          await invalidateNoteCaches(courseId);
        } else {
          await Note.findByIdAndUpdate(noteId, { status: "approved", rejectedReason: "" });
        }
        processedCount++;
      } else if (action === "reject") {
        if (source === "course" && courseId) {
          await updateCourseNoteStatus(courseId, noteId, { status: "rejected", rejectedReason: reason || "" });
          await invalidateNoteCaches(courseId);
        } else {
          await Note.findByIdAndUpdate(noteId, { status: "rejected", rejectedReason: reason || "" });
        }
        processedCount++;
      } else if (action === "delete") {
        if (source === "course" && courseId) {
          const course = await Course.findById(courseId);
          if (course) {
            const noteSub = course.notes.id(noteId);
            if (noteSub) {
              noteSub.deleteOne();
              await course.save();
              await invalidateNoteCaches(courseId);
            }
          }
        } else {
          await Note.findByIdAndDelete(noteId);
        }
        processedCount++;
      }
    }

    await invalidateNoteCaches();
    return res.json({
      success: true,
      message: `Bulk ${action} completed for ${processedCount} note(s)`,
      processedCount,
    });
  } catch (err) {
    console.error("bulkActionNotes", err);
    res.status(500).json({ message: err.message || "Failed to perform bulk action" });
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
      const cacheKey = `notes:user:${req.user._id}`;
      const studentNotes = await cacheResponse(cacheKey, 1800, async () => {
        const query = { $or: [{ students: req.user._id }] };
        if (req.user.subscription?.status === "active" && req.user.selectedClass) {
          const escapedClass = req.user.selectedClass.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
          query.$or.push({ category: new RegExp(`^${escapedClass}$`, "i") });
        }

        const [enrolledCoursesList, approvedStandaloneNotes] = await Promise.all([
          Course.find(query).populate("instructor", "name email").lean(),
          Note.find({ status: "approved" }).lean(),
        ]);

        let notes = [];
        enrolledCoursesList.forEach((course) => {
          (course.notes || [])
            .filter((note) => note.status === "approved")
            .forEach((note) => {
              notes.push({
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
          notes.push({
            _id: note._id,
            title: note.title,
            description: note.description,
            fileUrl: note.fileUrl,
            createdAt: note.createdAt,
            instructorName: note.instructorName,
            courseTitle: null,
          });
        });

        notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return notes;
      });

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
    await invalidateNoteCaches();
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
    await invalidateNoteCaches();
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
    await invalidateNoteCaches();
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
    await invalidateNoteCaches();
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("deleteNote", err);
    res.status(500).json({ message: err.message || "Failed to delete note" });
  }
};

// ── updateNote (edit title, description, file, or reassign course) ─────────────
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      fileUrl,
      courseId,
      instructorId,
      source,
      subject,
      chapterTitle,
      addToCurriculum = true,
    } = req.body || {};

    const isAdmin = hasBaseRole(req.user, "admin");
    const isInstructor = hasBaseRole(req.user, "instructor");
    const canEdit =
      isAdmin ||
      isInstructor ||
      hasPermissionGrant(req.user, "notes", "edit") ||
      hasPermissionGrant(req.user, "notes", "approve");

    if (!canEdit) {
      return res.status(403).json({ message: "Unauthorized to edit this note" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    let finalTitle = title !== undefined ? String(title).trim() : undefined;

    // 1. Locate if note is currently embedded inside a Course
    let originCourse = null;
    let existingCourseNote = null;

    if (source === "course" || (courseId && courseId !== "standalone")) {
      if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
        originCourse = await Course.findById(courseId).populate("instructor");
        if (originCourse && Array.isArray(originCourse.notes)) {
          existingCourseNote = originCourse.notes.id(id);
        }
      }
    }

    if (!existingCourseNote) {
      originCourse = await Course.findOne({ "notes._id": id }).populate("instructor");
      if (originCourse && Array.isArray(originCourse.notes)) {
        existingCourseNote = originCourse.notes.id(id);
      }
    }

    // 2. If not embedded in any Course, check Standalone Note collection
    let standaloneNote = null;
    if (!existingCourseNote) {
      standaloneNote = await Note.findById(id).populate("instructor");
    }

    if (!existingCourseNote && !standaloneNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    const targetCourseId =
      courseId && courseId !== "standalone" && courseId !== "" && courseId !== "none"
        ? courseId
        : null;

    // ── CASE 1: Note is currently embedded in originCourse ───────────────────
    if (originCourse && existingCourseNote) {
      const isSameCourse =
        targetCourseId &&
        originCourse._id.toString() === targetCourseId.toString();

      const finalSubject =
        subject !== undefined
          ? String(subject).trim()
          : (existingCourseNote.subject || originCourse.category || "General");
      const finalChapter =
        chapterTitle !== undefined
          ? String(chapterTitle).trim()
          : (existingCourseNote.chapterTitle || "Chapter 1: Study Notes");

      // Case 1A: Stays in the SAME course
      if (isSameCourse || (!targetCourseId && source === "course" && !courseId)) {
        if (finalTitle) existingCourseNote.title = finalTitle;
        if (description !== undefined) existingCourseNote.description = description;
        if (fileUrl) existingCourseNote.fileUrl = fileUrl;
        existingCourseNote.subject = finalSubject;
        existingCourseNote.chapterTitle = finalChapter;

        if (addToCurriculum) {
          originCourse.lessons = originCourse.lessons || [];
          const noteFile = fileUrl || existingCourseNote.fileUrl;
          const noteHead = finalTitle || existingCourseNote.title;
          const existingLessonIdx = originCourse.lessons.findIndex(
            (l) => (l.pdfUrl && l.pdfUrl === noteFile) || (l.title === noteHead && l.chapterTitle === finalChapter)
          );
          const lessonData = {
            title: noteHead,
            description: (description !== undefined ? description : existingCourseNote.description) || "",
            chapterTitle: finalChapter,
            subject: finalSubject,
            type: "text",
            videoType: "video",
            content: (description !== undefined ? description : existingCourseNote.description) || "",
            pdfUrl: noteFile,
          };
          if (existingLessonIdx >= 0) {
            originCourse.lessons[existingLessonIdx] = {
              ...(originCourse.lessons[existingLessonIdx].toObject?.() || originCourse.lessons[existingLessonIdx]),
              ...lessonData,
            };
          } else {
            originCourse.lessons.push(lessonData);
          }
        }

        await originCourse.save();
        await invalidateNoteCaches(originCourse._id);

        const updatedNote = originCourse.notes.id(id) || existingCourseNote;
        return res.json({
          success: true,
          note: shapeCourseNote(updatedNote, originCourse),
          message: "Note updated successfully",
        });
      }

      // Case 1B: Moving from originCourse to a DIFFERENT target course OR converting to standalone
      const notePayload = {
        title: finalTitle || existingCourseNote.title,
        description: description !== undefined ? description : (existingCourseNote.description || ""),
        fileUrl: fileUrl || existingCourseNote.fileUrl,
        subject: finalSubject,
        chapterTitle: finalChapter,
        status: existingCourseNote.status || "approved",
        rejectedReason: existingCourseNote.rejectedReason || "",
        createdAt: existingCourseNote.createdAt || new Date(),
      };

      // Remove from origin course notes & lessons
      originCourse.notes.pull({ _id: id });
      if (originCourse.lessons) {
        originCourse.lessons = originCourse.lessons.filter(
          (l) => l.pdfUrl !== existingCourseNote.fileUrl && l.title !== existingCourseNote.title
        );
      }
      await originCourse.save();
      await invalidateNoteCaches(originCourse._id);

      if (targetCourseId) {
        // Move to target course
        const destCourse = await Course.findById(targetCourseId).populate("instructor");
        if (!destCourse) {
          return res.status(404).json({ message: "Target course not found" });
        }
        destCourse.notes = destCourse.notes || [];
        destCourse.notes.push(notePayload);

        if (addToCurriculum) {
          destCourse.lessons = destCourse.lessons || [];
          const existingLessonIdx = destCourse.lessons.findIndex(
            (l) => (l.pdfUrl && l.pdfUrl === notePayload.fileUrl) || (l.title === notePayload.title && l.chapterTitle === finalChapter)
          );
          const lessonData = {
            title: notePayload.title,
            description: notePayload.description || "",
            chapterTitle: finalChapter,
            subject: finalSubject || destCourse.category || "General",
            type: "text",
            videoType: "video",
            content: notePayload.description || "",
            pdfUrl: notePayload.fileUrl,
          };
          if (existingLessonIdx >= 0) {
            destCourse.lessons[existingLessonIdx] = {
              ...(destCourse.lessons[existingLessonIdx].toObject?.() || destCourse.lessons[existingLessonIdx]),
              ...lessonData,
            };
          } else {
            destCourse.lessons.push(lessonData);
          }
        }

        await destCourse.save();
        await invalidateNoteCaches(destCourse._id);

        const pushedNote = destCourse.notes[destCourse.notes.length - 1];
        return res.json({
          success: true,
          note: shapeCourseNote(pushedNote, destCourse),
          message: `Note reassigned to ${destCourse.title}`,
        });
      } else {
        // Convert to standalone Note
        const newStandalone = await Note.create({
          ...notePayload,
          instructor: originCourse.instructor?._id || req.user._id,
          instructorName:
            originCourse.instructor?.name ||
            originCourse.instructor?.email ||
            "Instructor",
        });
        await invalidateNoteCaches();
        return res.json({
          success: true,
          note: shapeStandaloneNote(newStandalone),
          message: "Note converted to standalone study note",
        });
      }
    }

    // ── CASE 2: Note is currently a Standalone Note ─────────────────────────
    if (standaloneNote) {
      const finalSubject =
        subject !== undefined
          ? String(subject).trim()
          : (standaloneNote.subject || "");
      const finalChapter =
        chapterTitle !== undefined
          ? String(chapterTitle).trim()
          : (standaloneNote.chapterTitle || "Chapter 1: Study Notes");

      if (targetCourseId) {
        // Move from Standalone TO target course
        const destCourse = await Course.findById(targetCourseId).populate("instructor");
        if (!destCourse) {
          return res.status(404).json({ message: "Target course not found" });
        }

        const notePayload = {
          title: finalTitle || standaloneNote.title,
          description: description !== undefined ? description : (standaloneNote.description || ""),
          fileUrl: fileUrl || standaloneNote.fileUrl,
          subject: finalSubject || destCourse.category || "General",
          chapterTitle: finalChapter,
          status: standaloneNote.status || "approved",
          rejectedReason: standaloneNote.rejectedReason || "",
          createdAt: standaloneNote.createdAt || new Date(),
        };

        destCourse.notes = destCourse.notes || [];
        destCourse.notes.push(notePayload);

        if (addToCurriculum) {
          destCourse.lessons = destCourse.lessons || [];
          const existingLessonIdx = destCourse.lessons.findIndex(
            (l) => (l.pdfUrl && l.pdfUrl === notePayload.fileUrl) || (l.title === notePayload.title && l.chapterTitle === finalChapter)
          );
          const lessonData = {
            title: notePayload.title,
            description: notePayload.description || "",
            chapterTitle: finalChapter,
            subject: finalSubject || destCourse.category || "General",
            type: "text",
            videoType: "video",
            content: notePayload.description || "",
            pdfUrl: notePayload.fileUrl,
          };
          if (existingLessonIdx >= 0) {
            destCourse.lessons[existingLessonIdx] = {
              ...(destCourse.lessons[existingLessonIdx].toObject?.() || destCourse.lessons[existingLessonIdx]),
              ...lessonData,
            };
          } else {
            destCourse.lessons.push(lessonData);
          }
        }

        await destCourse.save();

        // Delete standalone record
        await Note.findByIdAndDelete(id);
        await invalidateNoteCaches(destCourse._id);

        const pushedNote = destCourse.notes[destCourse.notes.length - 1];
        return res.json({
          success: true,
          note: shapeCourseNote(pushedNote, destCourse),
          message: `Note assigned to ${destCourse.title}`,
        });
      }

      // Remains Standalone: update in place
      if (finalTitle) standaloneNote.title = finalTitle;
      if (description !== undefined) standaloneNote.description = description;
      if (fileUrl) standaloneNote.fileUrl = fileUrl;
      standaloneNote.subject = finalSubject;
      standaloneNote.chapterTitle = finalChapter;

      if (instructorId && isAdmin) {
        const User = mongoose.model("User");
        const assignedInstructor = await User.findById(instructorId);
        if (assignedInstructor) {
          standaloneNote.instructor = assignedInstructor._id;
          standaloneNote.instructorName =
            assignedInstructor.name || assignedInstructor.email || "Instructor";
        }
      }

      await standaloneNote.save();
      await invalidateNoteCaches();

      return res.json({
        success: true,
        note: shapeStandaloneNote(standaloneNote),
        message: "Note updated successfully",
      });
    }
  } catch (err) {
    console.error("updateNote", err);
    res.status(500).json({ message: err.message || "Failed to update note" });
  }
};

// ── bulkAssignCourseNotes (assign multiple notes to a course) ─────────────────
export const bulkAssignCourseNotes = async (req, res) => {
  try {
    const {
      noteIds,
      targetCourseId,
      subject,
      chapterTitle,
      addToCurriculum = true,
    } = req.body || {};

    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({ message: "noteIds array required" });
    }

    const isAdmin = hasBaseRole(req.user, "admin");
    const isInstructor = hasBaseRole(req.user, "instructor");
    if (!isAdmin && !isInstructor) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let destCourse = null;
    if (targetCourseId && targetCourseId !== "standalone" && targetCourseId !== "" && targetCourseId !== "none") {
      destCourse = await Course.findById(targetCourseId).populate("instructor");
      if (!destCourse) {
        return res.status(404).json({ message: "Target course not found" });
      }
    }

    const finalSubject = (subject && String(subject).trim()) || (destCourse ? destCourse.category : "") || "General";
    const finalChapter = (chapterTitle && String(chapterTitle).trim()) || "Chapter 1: Study Notes";

    for (const noteId of noteIds) {
      if (!mongoose.Types.ObjectId.isValid(noteId)) continue;

      const originCourse = await Course.findOne({ "notes._id": noteId }).populate("instructor");
      if (originCourse) {
        const existingNote = originCourse.notes.id(noteId);
        if (existingNote) {
          const notePayload = {
            title: existingNote.title,
            description: existingNote.description || "",
            fileUrl: existingNote.fileUrl,
            subject: finalSubject,
            chapterTitle: finalChapter,
            status: existingNote.status || "approved",
            rejectedReason: existingNote.rejectedReason || "",
            createdAt: existingNote.createdAt || new Date(),
          };

          if (destCourse && originCourse._id.toString() === destCourse._id.toString()) {
            existingNote.subject = finalSubject;
            existingNote.chapterTitle = finalChapter;
            if (addToCurriculum) {
              destCourse.lessons = destCourse.lessons || [];
              const exists = destCourse.lessons.some((l) => l.pdfUrl === existingNote.fileUrl);
              if (!exists) {
                destCourse.lessons.push({
                  title: existingNote.title,
                  description: existingNote.description || "",
                  chapterTitle: finalChapter,
                  subject: finalSubject,
                  type: "text",
                  videoType: "video",
                  content: existingNote.description || "",
                  pdfUrl: existingNote.fileUrl,
                });
              }
            }
            continue;
          }

          originCourse.notes.pull({ _id: noteId });
          if (originCourse.lessons) {
            originCourse.lessons = originCourse.lessons.filter((l) => l.pdfUrl !== existingNote.fileUrl);
          }
          await originCourse.save();

          if (destCourse) {
            destCourse.notes = destCourse.notes || [];
            destCourse.notes.push(notePayload);
            if (addToCurriculum) {
              destCourse.lessons = destCourse.lessons || [];
              const exists = destCourse.lessons.some((l) => l.pdfUrl === notePayload.fileUrl);
              if (!exists) {
                destCourse.lessons.push({
                  title: notePayload.title,
                  description: notePayload.description || "",
                  chapterTitle: finalChapter,
                  subject: finalSubject,
                  type: "text",
                  videoType: "video",
                  content: notePayload.description || "",
                  pdfUrl: notePayload.fileUrl,
                });
              }
            }
          } else {
            await Note.create({
              ...notePayload,
              instructor: originCourse.instructor?._id || req.user._id,
              instructorName:
                originCourse.instructor?.name ||
                originCourse.instructor?.email ||
                "Instructor",
            });
          }
        }
      } else {
        const standalone = await Note.findById(noteId);
        if (standalone) {
          if (destCourse) {
            const notePayload = {
              title: standalone.title,
              description: standalone.description || "",
              fileUrl: standalone.fileUrl,
              subject: finalSubject,
              chapterTitle: finalChapter,
              status: standalone.status || "approved",
              rejectedReason: standalone.rejectedReason || "",
              createdAt: standalone.createdAt || new Date(),
            };
            destCourse.notes = destCourse.notes || [];
            destCourse.notes.push(notePayload);

            if (addToCurriculum) {
              destCourse.lessons = destCourse.lessons || [];
              const exists = destCourse.lessons.some((l) => l.pdfUrl === notePayload.fileUrl);
              if (!exists) {
                destCourse.lessons.push({
                  title: notePayload.title,
                  description: notePayload.description || "",
                  chapterTitle: finalChapter,
                  subject: finalSubject,
                  type: "text",
                  videoType: "video",
                  content: notePayload.description || "",
                  pdfUrl: notePayload.fileUrl,
                });
              }
            }
            await Note.findByIdAndDelete(noteId);
          }
        }
      }
    }

    if (destCourse) {
      await destCourse.save();
    }

    await invalidateNoteCaches();
    return res.json({
      success: true,
      message: destCourse
        ? `Successfully assigned ${noteIds.length} notes to ${destCourse.title}`
        : `Successfully set ${noteIds.length} notes to standalone general study`,
    });
  } catch (err) {
    console.error("bulkAssignCourseNotes", err);
    res.status(500).json({ message: err.message || "Failed to bulk assign notes" });
  }
};