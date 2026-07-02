import Note from "../models/note.model.js";
import { hasBaseRole, hasPermissionGrant } from "../utils/userRoles.js";
import { cacheResponse, invalidateCache } from "../utils/redisClient.js";

export const createNote = async (req, res) => {
  try {
    const { title, description, fileUrl } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ message: "fileUrl required" });
    }
    if (!title) {
      return res.status(400).json({ message: "title required" });
    }

    const note = await Note.create({
      title,
      description,
      fileUrl,
      instructor: req.user._id,
      instructorName: req.user.name || req.user.email || "Instructor",
      status: "pending",
    });

    res.json(note);
  } catch (err) {
    console.error("createNote", err);
    res.status(500).json({ message: err.message || "Failed to create note" });
  }
};

export const listNotes = async (req, res) => {
  try {
    const isAdmin = req.user && hasBaseRole(req.user, "admin");
    const isInstructor = req.user && hasBaseRole(req.user, "instructor");

    // If admin/moderator requests all notes
    if (req.query.all === "1") {
      const hasAccess = req.user && (
        hasBaseRole(req.user, "admin") ||
        hasPermissionGrant(req.user, "notes", "view") ||
        hasPermissionGrant(req.user, "notes", "approve") ||
        hasPermissionGrant(req.user, "notes", "reject")
      );
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied — notes moderation permission required" });
      }

      const all = await Note.find()
        .populate("instructor", "phoneNumber city state")
        .sort({ createdAt: -1 })
        .lean();
      return res.json(all);
    }

    // If instructor and ?mine=1, return their uploaded notes
    if (isInstructor && req.query.mine === "1") {
      const mine = await Note.find({ instructor: req.user._id }).sort({
        createdAt: -1,
      });
      return res.json(mine);
    }

    // Public / Student listing — only approved notes
    const notes = await cacheResponse("notes:public", 30, async () => {
      return await Note.find({ status: "approved" })
        .sort({ createdAt: -1 })
        .lean();
    });
    res.json(notes);
  } catch (err) {
    console.error("listNotes", err);
    res.status(500).json({ message: err.message || "Failed to list notes" });
  }
};

export const approveNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    note.status = "approved";
    note.rejectedReason = undefined;
    await note.save();
    await invalidateCache("notes:public*");
    res.json(note);
  } catch (err) {
    console.error("approveNote", err);
    res.status(500).json({ message: err.message || "Failed to approve note" });
  }
};

export const rejectNote = async (req, res) => {
  try {
    const { reason } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    note.status = "rejected";
    note.rejectedReason = reason || "";
    await note.save();
    await invalidateCache("notes:public*");
    res.json(note);
  } catch (err) {
    console.error("rejectNote", err);
    res.status(500).json({ message: err.message || "Failed to reject note" });
  }
};

export const unapproveNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    note.status = "pending";
    note.rejectedReason = undefined;
    await note.save();
    await invalidateCache("notes:public*");
    res.json(note);
  } catch (err) {
    console.error("unapproveNote", err);
    res.status(500).json({ message: err.message || "Failed to unapprove note" });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    // Allow deleting if user is admin, is the instructor who created it, or has notes:delete permission
    const isAdmin = hasBaseRole(req.user, "admin");
    const isOwner = note.instructor.toString() === req.user._id.toString();
    const canDelete = isAdmin || isOwner || hasPermissionGrant(req.user, "notes", "delete");
    if (!canDelete) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this note" });
    }

    await Note.findByIdAndDelete(req.params.id);
    await invalidateCache("notes:public*");
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("deleteNote", err);
    res.status(500).json({ message: err.message || "Failed to delete note" });
  }
};
