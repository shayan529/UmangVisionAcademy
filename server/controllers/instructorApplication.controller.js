import InstructorApplication from "../models/instructorApplication.model.js";
import User from "../models/user.model.js";
import { uploadFileToStorage } from "../utils/vercelBlob.js";

// POST /instructor-applications
export const submitApplication = async (req, res) => {
  try {
    const existing = await InstructorApplication.findOne({
      user: req.user._id,
    });

    if (existing) {
      return res.status(400).json({
        message: "Application already submitted",
      });
    }

    let resumeUrl = null;
    let resumeFileId = null;

    if (req.body?.resumeUrl) {
      resumeUrl = req.body.resumeUrl;
    } else if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`;
      const uploadResult = await uploadFileToStorage({
        folder: "instructor-resumes",
        fileName,
        buffer: req.file.buffer,
        filePath: req.file.path,
        contentType: req.file.mimetype,
      });

      resumeUrl = uploadResult.url;
      resumeFileId = uploadResult.fileId;
    }

    const application = await InstructorApplication.create({
      user: req.user._id,
      ...req.body,
      resumeUrl,
      resumeFileId,
    });

    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

// GET /instructor-applications/me
export const getMyApplication = async (req, res) => {
  try {
    const application = await InstructorApplication.findOne({
      user: req.user._id,
    });
    if (!application)
      return res.status(404).json({ message: "No application found" });
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /instructor-applications
export const getAllApplications = async (req, res) => {
  try {
    const statusFilter = req.query.status
      ? { status: req.query.status }
      : {};
    const applications = await InstructorApplication.find(statusFilter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /instructor-applications/:id/approve
export const approveApplication = async (req, res) => {
  try {
    const application = await InstructorApplication.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true },
    ).populate("user", "name email phone");

    if (!application)
      return res.status(404).json({ message: "Application not found" });

    const user = await User.findById(application.user._id);
    if (user && !user.roles.includes("instructor")) {
      user.roles.push("instructor");
      await user.save();
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /instructor-applications/:id (reject)
export const rejectApplication = async (req, res) => {
  try {
    const application = await InstructorApplication.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true },
    ).populate("user", "name email phone");

    if (!application)
      return res.status(404).json({ message: "Application not found" });

    const user = await User.findById(application.user._id);
    if (user && user.roles.includes("instructor")) {
      user.roles = user.roles.filter((role) => role !== "instructor");
      await user.save();
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /instructor-applications/:id/status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await InstructorApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    ).populate("user", "name email phone");

    if (!application)
      return res.status(404).json({ message: "Application not found" });

    // If approved, update user role
    if (status === "approved") {
      const user = await User.findById(application.user._id);
      if (user && !user.roles.includes("instructor")) {
        user.roles.push("instructor");
        await user.save();
      }
    } else if (status === "rejected") {
      // Optional: remove role if rejected and previously approved,
      // but usually rejected means they just don't get it.
      const user = await User.findById(application.user._id);
      if (user && user.roles.includes("instructor")) {
        user.roles = user.roles.filter((role) => role !== "instructor");
        await user.save();
      }
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
