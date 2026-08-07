/**
 * instructorChat.controller.js
 *
 * REST endpoints for the Ask-Instructor chat feature.
 *
 * Routes (all under /api/instructor-chat):
 *   POST   /conversations                    — student opens / resumes a thread
 *   GET    /conversations                    — list threads (student or instructor)
 *   GET    /conversations/:id                — thread detail + messages (paginated)
 *   PATCH  /conversations/:id/archive        — instructor / admin soft-archive
 *   DELETE /conversations/:id/messages/:mid  — soft-delete a single message
 *   GET    /available-instructors            — enrolled-course instructors for selector
 */

import Conversation from "../models/instructorChat.model.js";
import Course from "../models/courses.model.js";
import User from "../models/user.model.js";
import CallRequest from "../models/instructorCallRequest.model.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { hasBaseRole, hasPermissionGrant } from "../utils/userRoles.js";

const { Types } = mongoose;

const buildCallSessionId = (conversationId) =>
  crypto
    .createHash("sha256")
    .update(`${conversationId}`)
    .digest("hex")
    .slice(0, 24);

const emitIChatEvent = (req, conversationId, event, payload) => {
  const io = req.app.get("io");
  if (!io) return;
  io.of("/ichat").to(`ichat:${conversationId}`).emit(event, payload);
};

// ── Guards ────────────────────────────────────────────────────────────────────

const isAdminOrStaff = (user) =>
  hasBaseRole(user, "admin") ||
  hasPermissionGrant(user, "ask_instructor", "view");

/**
 * Checks whether a user is (or acts as) an instructor.
 * Handles all storage variants:
 *   - role === "instructor"               (base-role string)
 *   - role is an ObjectId / custom Role   (fetched from courses below)
 *   - user has at least one published course (fallback ownership check)
 */
const isInstructorUser = async (user) => {
  if (!user) return false;

  // Fast path — base role string
  if (hasBaseRole(user, "instructor")) return true;

  // If role is stored as an ObjectId the user may be admin/staff who also
  // teaches. Allow instructors who own courses regardless of exact role string.
  // We check this by seeing if they have teachingCourses or published courses.
  const hasCourses = await Course.exists({ instructor: user._id });
  if (hasCourses) return true;

  return false;
};

// ── Deduplication Helpers ──────────────────────────────────────────────────────
/**
 * Merges duplicate conversations between the same student and instructor.
 * Keeps the most recently updated conversation as primary, merges messages
 * from older duplicates into it, and deletes the duplicate documents.
 */
const deduplicateStudentInstructorConversations = async (studentId, instructorId) => {
  try {
    const convs = await Conversation.find({
      student: studentId,
      instructor: instructorId,
      archived: false,
    }).sort({ updatedAt: -1 });

    if (convs.length <= 1) return;

    const primary = convs[0];
    const duplicates = convs.slice(1);

    let newMessages = [];
    for (const dup of duplicates) {
      if (dup.messages && dup.messages.length > 0) {
        newMessages.push(...dup.messages);
      }
    }

    if (newMessages.length > 0) {
      const combinedMessages = [...(primary.messages || []), ...newMessages].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );

      const lastMsg = combinedMessages[combinedMessages.length - 1];

      await Conversation.updateOne(
        { _id: primary._id },
        {
          $set: {
            messages: combinedMessages,
            lastMessage: lastMsg
              ? {
                  text: lastMsg.text || (lastMsg.media?.length ? "[Attachment]" : ""),
                  at: lastMsg.createdAt || new Date(),
                  senderRole: lastMsg.senderRole || "",
                }
              : primary.lastMessage,
          },
        }
      );
    }

    const dupIds = duplicates.map((d) => d._id);
    await Conversation.deleteMany({ _id: { $in: dupIds } });
  } catch (err) {
    console.error("[instructorChat] deduplicateStudentInstructorConversations error:", err);
  }
};

const deduplicateAllConversations = async (userFilter) => {
  try {
    const convs = await Conversation.find(userFilter).select("student instructor updatedAt").lean();
    const seen = new Set();
    const pairsToDedupe = [];

    for (const c of convs) {
      if (!c.student || !c.instructor) continue;
      const key = `${c.student.toString()}_${c.instructor.toString()}`;
      if (seen.has(key)) {
        pairsToDedupe.push({ studentId: c.student, instructorId: c.instructor });
      } else {
        seen.add(key);
      }
    }

    for (const pair of pairsToDedupe) {
      await deduplicateStudentInstructorConversations(pair.studentId, pair.instructorId);
    }
  } catch (err) {
    console.error("[instructorChat] deduplicateAllConversations error:", err);
  }
};

// ── POST /conversations ───────────────────────────────────────────────────────
export const getOrCreateConversation = async (req, res) => {
  try {
    const { instructorId, courseId, subject } = req.body;

    // Safe subject — never undefined
    const safeSubject =
      typeof subject === "string" ? subject.trim().slice(0, 120) : "";

    if (!instructorId || !Types.ObjectId.isValid(instructorId))
      return res
        .status(400)
        .json({ message: "A valid instructorId is required" });

    const studentId = req.user._id;

    // Verify the target user exists and acts as an instructor
    const instructor = await User.findById(instructorId)
      .select("_id name avatarUrl role")
      .lean();

    if (!instructor)
      return res.status(404).json({ message: "Instructor not found" });

    const isInstr = await isInstructorUser(instructor);
    if (!isInstr)
      return res.status(404).json({ message: "User is not an instructor" });

    // Validate courseId format if provided and verify instructor assistance entitlement
    if (courseId) {
      if (!Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "Invalid courseId" });
      }
      if (!isAdminOrStaff(req.user)) {
        const studentDoc = await User.findById(studentId).select("instructorAssistanceCourses subscription").lean();
        const hasAssistance = (studentDoc?.instructorAssistanceCourses || []).some(
          (id) => id.toString() === courseId.toString(),
        );
        const hasActiveSub = studentDoc?.subscription?.status === "active";
        if (!hasAssistance && !hasActiveSub) {
          return res.status(403).json({
            message: "Instructor Assistance is not enabled for this course.",
          });
        }
      }
    }

    // Strict 1 chat per (student, instructor) pair:
    // Deduplicate any legacy threads first
    await deduplicateStudentInstructorConversations(studentId, instructorId);

    const filter = {
      student: studentId,
      instructor: instructorId,
      archived: false,
    };

    let conv = await Conversation.findOne(filter);

    if (conv) {
      // Update course and subject on existing conversation if provided
      let modified = false;
      if (courseId && (!conv.course || conv.course.toString() !== courseId.toString())) {
        conv.course = courseId;
        modified = true;
      }
      if (safeSubject && conv.subject !== safeSubject) {
        conv.subject = safeSubject;
        modified = true;
      }
      if (modified) {
        await conv.save();
      }
      conv = await Conversation.findById(conv._id)
        .populate("student", "_id name avatarUrl")
        .populate("instructor", "_id name avatarUrl")
        .populate("course", "_id title")
        .lean();
    } else {
      const created = await Conversation.create({
        student: studentId,
        instructor: instructorId,
        course: courseId || null,
        subject: safeSubject,
      });
      conv = await Conversation.findById(created._id)
        .populate("student", "_id name avatarUrl")
        .populate("instructor", "_id name avatarUrl")
        .populate("course", "_id title")
        .lean();
    }

    // Strip embedded messages — socket sends them on ic:join
    const { messages: _m, ...rest } = conv;
    res.json({ ...rest, messageCount: _m?.length ?? 0 });
  } catch (err) {
    console.error("[instructorChat] getOrCreateConversation:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /conversations ────────────────────────────────────────────────────────
export const listConversations = async (req, res) => {
  try {
    const { archived = "false", page = 1, limit = 30 } = req.query;
    const showArchived = archived === "true";

    let filter = { archived: showArchived };

    if (isAdminOrStaff(req.user)) {
      // admin/staff see everything
    } else if (hasBaseRole(req.user, "instructor")) {
      filter.instructor = req.user._id;
    } else if (await isInstructorUser(req.user)) {
      // instructor whose role is stored as ObjectId
      filter.instructor = req.user._id;
    } else {
      filter.student = req.user._id;
    }

    // Deduplicate any legacy multiple threads between the same (student, instructor)
    if (!showArchived) {
      await deduplicateAllConversations(filter);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [convs, total] = await Promise.all([
      Conversation.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-messages")
        .populate("student", "_id name avatarUrl email")
        .populate("instructor", "_id name avatarUrl")
        .populate("course", "_id title")
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    const isStudentUser = !isAdminOrStaff(req.user) && !hasBaseRole(req.user, "instructor");
    let assistanceSet = new Set();
    let hasActiveSub = false;

    if (isStudentUser) {
      const studentDoc = await User.findById(req.user._id).select("instructorAssistanceCourses subscription").lean();
      assistanceSet = new Set((studentDoc?.instructorAssistanceCourses || []).map((id) => id.toString()));
      hasActiveSub = studentDoc?.subscription?.status === "active";
    }

    const enhancedConvs = convs.map((c) => {
      const courseIdStr = c.course?._id?.toString() || c.course?.toString();
      const assistanceDisabled = isStudentUser && Boolean(courseIdStr) && !assistanceSet.has(courseIdStr) && !hasActiveSub;
      return { ...c, assistanceDisabled };
    });

    res.json({ conversations: enhancedConvs, total, page: Number(page) });
  } catch (err) {
    console.error("[instructorChat] listConversations:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── POST /call-requests ───────────────────────────────────────────────────────
export const submitCallRequest = async (req, res) => {
  try {
    const { conversationId, message = "" } = req.body;
    if (!conversationId || !Types.ObjectId.isValid(conversationId))
      return res
        .status(400)
        .json({ message: "Valid conversationId is required" });

    const conv = await Conversation.findById(conversationId)
      .populate("student", "_id name avatarUrl")
      .populate("instructor", "_id name avatarUrl")
      .populate("course", "_id title")
      .lean();

    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });
    if (conv.student?._id?.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({ message: "Only the student can request a call" });

    if (conv.course) {
      const studentDoc = await User.findById(req.user._id).select("instructorAssistanceCourses subscription").lean();
      const assistanceSet = new Set((studentDoc?.instructorAssistanceCourses || []).map((id) => id.toString()));
      const hasActiveSub = studentDoc?.subscription?.status === "active";
      if (!assistanceSet.has(conv.course._id.toString()) && !hasActiveSub) {
        return res.status(403).json({ message: "Instructor assistance is disabled for this course." });
      }
    }

    const existing = await CallRequest.findOne({
      conversation: conversationId,
      status: "pending",
    });

    if (existing)
      return res.status(409).json({
        message: "A call request is already pending for this conversation",
      });

    const created = await CallRequest.create({
      conversation: conversationId,
      student: conv.student._id,
      instructor: conv.instructor._id,
      course: conv.course?._id || null,
      subject: conv.subject || "",
      message: String(message).trim().slice(0, 1000),
      status: "pending",
    });

    const request = await CallRequest.findById(created._id)
      .populate("student", "_id name avatarUrl")
      .populate("instructor", "_id name avatarUrl")
      .populate("course", "_id title")
      .lean();

    emitIChatEvent(req, conversationId, "webrtc:call-request", {
      request,
    });

    res.status(201).json(request);
  } catch (err) {
    console.error("[instructorChat] submitCallRequest:", err);
    res.status(500).json({ message: err.message });
  }
};

export const listCallRequests = async (req, res) => {
  try {
    const { status, conversationId } = req.query;
    const filter = {};

    if (hasBaseRole(req.user, "student")) {
      filter.student = req.user._id;
    } else if (hasBaseRole(req.user, "instructor")) {
      filter.instructor = req.user._id;
    } else if (isAdminOrStaff(req.user)) {
      // admin/staff can view all
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    if (status) filter.status = status;
    if (conversationId && Types.ObjectId.isValid(conversationId)) {
      filter.conversation = conversationId;
    }

    const requests = await CallRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("conversation", "_id subject")
      .populate("student", "_id name avatarUrl")
      .populate("course", "_id title")
      .lean();

    res.json({ requests });
  } catch (err) {
    console.error("[instructorChat] listCallRequests:", err);
    res.status(500).json({ message: err.message });
  }
};

export const approveCallRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid request id" });

    const request = await CallRequest.findById(id)
      .populate("conversation")
      .populate("student", "_id name avatarUrl")
      .populate("instructor", "_id name avatarUrl")
      .populate("course", "_id title");

    if (!request)
      return res.status(404).json({ message: "Call request not found" });
    if (request.status !== "pending")
      return res
        .status(400)
        .json({ message: "Call request is already processed" });
    if (
      request.instructor._id.toString() !== req.user._id.toString() &&
      !isAdminOrStaff(req.user)
    ) {
      return res.status(403).json({
        message: "Only the assigned instructor can approve this request",
      });
    }

    request.status = "approved";
    request.response = String(req.body.response || "")
      .trim()
      .slice(0, 1000);
    request.meetingLink = String(req.body.meetingLink || "")
      .trim()
      .slice(0, 2000);
    request.decidedAt = new Date();
    await request.save();

    // Persist the invitation in the direct-message thread. This reaches a
    // student who is offline just as reliably as one currently in the chat.
    const conversation = await Conversation.findByIdAndUpdate(
      request.conversation._id,
      {
        $push: {
          messages: {
            sender: request.instructor._id,
            senderRole: "instructor",
            text: `Please join the meet ASAP\n${request.meetingLink}`,
            media: [],
            readBy: [request.instructor._id],
          },
        },
        $inc: { studentUnread: 1 },
        $set: {
          "lastMessage.text": "Please join the meet ASAP",
          "lastMessage.at": new Date(),
          "lastMessage.senderRole": "instructor",
          updatedAt: new Date(),
        },
      },
      { new: true, select: "messages" },
    );
    const savedMessage = conversation.messages[conversation.messages.length - 1];
    emitIChatEvent(req, request.conversation._id.toString(), "ic:message", {
      conversationId: request.conversation._id.toString(),
      message: { ...savedMessage.toObject(), sender: request.instructor },
    });

    emitIChatEvent(
      req,
      request.conversation._id.toString(),
      "meet:request-approved",
      {
        requestId: request._id.toString(),
        meetingLink: request.meetingLink,
        response: request.response,
      },
    );

    res.json({ request, meetingLink: request.meetingLink });
  } catch (err) {
    console.error("[instructorChat] approveCallRequest:", err);
    res.status(500).json({ message: err.message });
  }
};

export const rejectCallRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid request id" });

    const request = await CallRequest.findById(id)
      .populate("conversation")
      .populate("student", "_id name avatarUrl")
      .populate("instructor", "_id name avatarUrl");

    if (!request)
      return res.status(404).json({ message: "Call request not found" });
    if (request.status !== "pending")
      return res
        .status(400)
        .json({ message: "Call request is already processed" });
    const isStudentRequester =
      request.student._id.toString() === req.user._id.toString();
    if (
      !isStudentRequester &&
      request.instructor._id.toString() !== req.user._id.toString() &&
      !isAdminOrStaff(req.user)
    ) {
      return res.status(403).json({
        message:
          "Only the requester student or assigned instructor can reject this request",
      });
    }

    request.status = "rejected";
    request.response = String(req.body.response || "")
      .trim()
      .slice(0, 1000);
    request.decidedAt = new Date();
    await request.save();

    emitIChatEvent(
      req,
      request.conversation._id.toString(),
      "meet:request-rejected",
      {
        conversationId: request.conversation._id.toString(),
        requestId: request._id.toString(),
      },
    );

    res.json({ request });
  } catch (err) {
    console.error("[instructorChat] rejectCallRequest:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /conversations/:id ────────────────────────────────────────────────────
export const getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 60 } = req.query;

    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid conversation id" });

    const conv = await Conversation.findById(id)
      .populate("student", "_id name avatarUrl email")
      .populate("instructor", "_id name avatarUrl")
      .populate("course", "_id title")
      .lean();

    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    const uid = req.user._id.toString();
    const isStudent = conv.student?._id?.toString() === uid;
    const isInstr = conv.instructor?._id?.toString() === uid;
    const isParticipant = isStudent || isInstr;

    if (!isParticipant && !isAdminOrStaff(req.user))
      return res.status(403).json({ message: "Access denied" });

    // Paginate embedded messages
    const allMsgs = (conv.messages ?? []).filter((m) => !m.deleted);
    const total = allMsgs.length;
    const lim = Number(limit);
    const pg = Number(page);
    const start = Math.max(0, total - pg * lim);
    const end = total - (pg - 1) * lim;
    const messages = allMsgs.slice(start, end);

    // Mark as read
    if (isParticipant) {
      const unreadField = isStudent ? "studentUnread" : "instructorUnread";
      const senderRole = isStudent ? "instructor" : "student";
      await Conversation.updateOne(
        { _id: id },
        {
          $set: { [unreadField]: 0 },
          $addToSet: { "messages.$[msg].readBy": req.user._id },
        },
        {
          arrayFilters: [
            {
              "msg.senderRole": senderRole,
              "msg.readBy": { $ne: req.user._id },
              "msg.deleted": false,
            },
          ],
        },
      );
    }

    const { messages: _discard, ...meta } = conv;
    res.json({ conversation: meta, messages, total, page: pg });
  } catch (err) {
    console.error("[instructorChat] getConversation:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /conversations/:id/archive ─────────────────────────────────────────
export const archiveConversation = async (req, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid conversation id" });

    const conv = await Conversation.findById(req.params.id).select(
      "instructor",
    );
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    const uid = req.user._id.toString();
    const isInstructor = conv.instructor.toString() === uid;

    if (!isInstructor && !isAdminOrStaff(req.user))
      return res
        .status(403)
        .json({ message: "Only the instructor or admin can archive" });

    conv.archived = req.body.archived !== false;
    await conv.save();
    res.json({ archived: conv.archived });
  } catch (err) {
    console.error("[instructorChat] archiveConversation:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /conversations/:id/messages/:mid ───────────────────────────────────
export const deleteMessage = async (req, res) => {
  try {
    const { id, mid } = req.params;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(mid))
      return res.status(400).json({ message: "Invalid id" });

    const uid = req.user._id.toString();
    const conv = await Conversation.findById(id).select(
      "messages student instructor",
    );
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    const msg = conv.messages.id(mid);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    const isSender = msg.sender.toString() === uid;
    if (!isSender && !isAdminOrStaff(req.user))
      return res
        .status(403)
        .json({ message: "Cannot delete another user's message" });

    msg.deleted = true;
    msg.text = "";
    msg.media = [];
    await conv.save();

    res.json({ deleted: true, messageId: mid });
  } catch (err) {
    console.error("[instructorChat] deleteMessage:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /available-instructors ────────────────────────────────────────────────
// Returns enrolled courses with instructor details for the selector UI.
// Intentionally broad — no published/approvalStatus filter so courses
// the student paid for but are still pending admin approval still appear.
export const getAvailableInstructors = async (req, res) => {
  try {
    const studentId = req.user._id;
    const dbUser = await User.findById(studentId)
      .select("instructorAssistanceCourses enrolledCourses subscription selectedClass")
      .lean();

    const assistanceCourseIds = (dbUser?.instructorAssistanceCourses ?? []).map((id) =>
      id.toString(),
    );
    const enrolledCourseIds = (dbUser?.enrolledCourses ?? []).map((id) =>
      id.toString(),
    );
    const hasActiveSub = req.user.subscription?.status === "active";

    // ONLY allow courses where instructor assistance has explicitly been purchased or assigned to the student.
    const allowedCourseIds = assistanceCourseIds;

    const orClauses = [];
    if (allowedCourseIds.length > 0) {
      orClauses.push({ _id: { $in: allowedCourseIds } });
    }

    if (hasActiveSub && req.user.selectedClass) {
      orClauses.push({
        category: new RegExp(
          `^${req.user.selectedClass.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`,
          "i",
        ),
      });
    }

    if (!orClauses.length) return res.json([]);

    const courses = await Course.find({ $or: orClauses })
      .select(
        "_id title instructor category board language thumbnailUrl lessons subjectDetails subjectQuizzes",
      )
      .populate("instructor", "_id name avatarUrl bio")
      .lean();

    if (!courses.length) return res.json([]);

    const result = courses
      .filter((c) => c.instructor?._id)
      .map((c) => {
        const subjectSet = new Set([
          ...(c.lessons ?? []).map((l) => l.subject).filter(Boolean),
          ...(c.subjectDetails ?? []).map((d) => d.subject).filter(Boolean),
          ...(c.subjectQuizzes ?? []).map((q) => q.subject).filter(Boolean),
        ]);
        return {
          courseId: c._id,
          courseTitle: c.title,
          category: c.category,
          thumbnail: c.thumbnailUrl,
          instructor: {
            _id: c.instructor._id,
            name: c.instructor.name,
            avatarUrl: c.instructor.avatarUrl,
            bio: c.instructor.bio,
          },
          subjects: Array.from(subjectSet).sort(),
        };
      });

    res.json(result);
  } catch (err) {
    console.error("[instructorChat] getAvailableInstructors:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /conversations/:id ──────────────────────────────────────────────────
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid conversation id" });

    const conv = await Conversation.findById(id).select("instructor student");
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    const uid = req.user._id.toString();
    const isInstructor = conv.instructor?.toString() === uid;
    const isStudent = conv.student?.toString() === uid;

    if (!isInstructor && !isStudent && !isAdminOrStaff(req.user))
      return res
        .status(403)
        .json({ message: "Only thread participants or admin can delete chat" });

    await Conversation.findByIdAndDelete(id);
    await CallRequest.deleteMany({ conversation: id });

    emitIChatEvent(req, id, "ic:conversation-deleted", { conversationId: id });

    res.json({ success: true, conversationId: id });
  } catch (err) {
    console.error("[instructorChat] deleteConversation:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /conversations/:id/block ───────────────────────────────────────────
export const toggleBlockConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked = true, reason = "" } = req.body;

    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid conversation id" });

    const conv = await Conversation.findById(id);
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    const uid = req.user._id.toString();
    const isInstructor = conv.instructor.toString() === uid;

    if (!isInstructor && !isAdminOrStaff(req.user))
      return res
        .status(403)
        .json({ message: "Only the instructor or admin can block/unblock student" });

    conv.isBlocked = Boolean(isBlocked);
    conv.blockedBy = isBlocked ? req.user._id : null;
    conv.blockedReason = isBlocked ? String(reason || "").trim().slice(0, 500) : "";
    await conv.save();

    emitIChatEvent(req, id, "ic:blocked-status", {
      conversationId: id,
      isBlocked: conv.isBlocked,
      blockedReason: conv.blockedReason,
    });

    res.json({
      success: true,
      isBlocked: conv.isBlocked,
      blockedReason: conv.blockedReason,
    });
  } catch (err) {
    console.error("[instructorChat] toggleBlockConversation:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── POST /conversations/:id/report ────────────────────────────────────────────
export const reportConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "", details = "" } = req.body;

    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid conversation id" });

    if (!reason || !reason.trim())
      return res.status(400).json({ message: "Report reason is required" });

    const conv = await Conversation.findById(id);
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    const uid = req.user._id.toString();
    const isInstructor = conv.instructor.toString() === uid;

    if (!isInstructor && !isAdminOrStaff(req.user))
      return res
        .status(403)
        .json({ message: "Only the instructor or admin can report student" });

    conv.isReported = true;
    conv.reportReason = String(reason).trim().slice(0, 200);
    conv.reportDetails = String(details || "").trim().slice(0, 1000);
    conv.reportedAt = new Date();
    conv.reportedBy = req.user._id;
    await conv.save();

    res.json({
      success: true,
      isReported: true,
      reportReason: conv.reportReason,
    });
  } catch (err) {
    console.error("[instructorChat] reportConversation:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /admin/reports ────────────────────────────────────────────────────────
export const listAdminReports = async (req, res) => {
  try {
    if (!isAdminOrStaff(req.user))
      return res.status(403).json({ message: "Admin access required" });

    const filter = {
      $or: [{ isReported: true }, { isBlocked: true }],
    };

    const conversations = await Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .select("-messages")
      .populate("student", "_id name avatarUrl email isSuspended suspendReason")
      .populate("instructor", "_id name avatarUrl email isSuspended suspendReason")
      .populate("course", "_id title")
      .populate("reportedBy", "_id name role")
      .populate("blockedBy", "_id name role")
      .lean();

    res.json({ reports: conversations, total: conversations.length });
  } catch (err) {
    console.error("[instructorChat] listAdminReports:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /admin/reports/:id/messages ──────────────────────────────────────────
export const getAdminReportMessages = async (req, res) => {
  try {
    if (!isAdminOrStaff(req.user))
      return res.status(403).json({ message: "Admin access required" });

    const { id } = req.params;
    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid conversation id" });

    const conv = await Conversation.findById(id)
      .populate("student", "_id name avatarUrl email isSuspended")
      .populate("instructor", "_id name avatarUrl email isSuspended")
      .populate("course", "_id title")
      .populate("messages.sender", "_id name avatarUrl role")
      .lean();

    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    res.json({ conversation: conv, messages: conv.messages ?? [] });
  } catch (err) {
    console.error("[instructorChat] getAdminReportMessages:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── POST /admin/reports/:id/action ───────────────────────────────────────────
export const takeAdminReportAction = async (req, res) => {
  try {
    if (!isAdminOrStaff(req.user))
      return res.status(403).json({ message: "Admin access required" });

    const { id } = req.params;
    const { action, targetUserId, notes = "" } = req.body;

    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid conversation id" });

    const conv = await Conversation.findById(id);
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });

    let message = "Action performed successfully";

    if (action === "resolve") {
      conv.isReported = false;
      await conv.save();
      message = "Report marked as resolved";
    } else if (action === "dismiss") {
      conv.isReported = false;
      conv.reportReason = "";
      conv.reportDetails = "";
      await conv.save();
      message = "Report dismissed";
    } else if (action === "block_student") {
      conv.isBlocked = true;
      conv.blockedBy = req.user._id;
      conv.blockedReason = notes || "Blocked by Administrator";
      await conv.save();
      message = "Student blocked from sending messages in this chat";
    } else if (action === "unblock_student") {
      conv.isBlocked = false;
      conv.blockedReason = "";
      await conv.save();
      message = "Student unblocked in this chat";
    } else if (action === "suspend_user") {
      if (!targetUserId || !Types.ObjectId.isValid(targetUserId))
        return res.status(400).json({ message: "Valid targetUserId required" });

      const targetUser = await User.findById(targetUserId);
      if (!targetUser)
        return res.status(404).json({ message: "User not found" });

      targetUser.isSuspended = !targetUser.isSuspended;
      targetUser.suspendReason = targetUser.isSuspended
        ? notes || "Account suspended by Administrator due to chat report"
        : "";
      await targetUser.save();

      message = targetUser.isSuspended
        ? `Account for ${targetUser.name} suspended`
        : `Account for ${targetUser.name} unsuspended`;
    } else if (action === "delete_chat") {
      await Conversation.findByIdAndDelete(id);
      await CallRequest.deleteMany({ conversation: id });
      return res.json({ success: true, message: "Chat deleted permanently" });
    }

    res.json({ success: true, message, conversation: conv });
  } catch (err) {
    console.error("[instructorChat] takeAdminReportAction:", err);
    res.status(500).json({ message: err.message });
  }
};


