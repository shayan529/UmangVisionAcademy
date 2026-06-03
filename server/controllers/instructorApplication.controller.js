import InstructorApplication from "../models/InstructorApplication.model.js";
import User from "../models/user.model.js";

// POST /instructor-applications
export const submitApplication = async (req, res) => {
  try {
    const existing = await InstructorApplication.findOne({
      user: req.user._id,
    });
    if (existing)
      return res.status(400).json({ message: "Application already submitted" });

    const application = await InstructorApplication.create({
      user: req.user._id,
      ...req.body,
      resumeUrl: req.file?.path ?? null, // ← cloudinary url
      resumePublicId: req.file?.filename ?? null, // ← cloudinary public_id
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

// GET /instructor-applications  (admin)
export const getAllApplications = async (req, res) => {
  try {
    const applications = await InstructorApplication.find().populate(
      "user",
      "name email avatar",
    );
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /instructor-applications/:id/approve  (admin)
export const approveApplication = async (req, res) => {
  try {
    const application = await InstructorApplication.findByIdAndUpdate(
      req.params.id,
      { status: "approved", reviewNote: req.body?.reviewNote ?? null },
      { new: true },
    );
    if (!application)
      return res.status(404).json({ message: "Application not found" });

    // Promote the user's role to instructor
    await User.findByIdAndUpdate(application.user, {
      $addToSet: { roles: "instructor" },
    });

    res.json(application);
  } catch (err) {
    console.error("approveApplication error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /instructor-applications/:id  (admin)
export const rejectApplication = async (req, res) => {
  try {
    const application = await InstructorApplication.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", reviewNote: req.body?.reviewNote ?? null },
      { new: true },
    );
    if (!application)
      return res.status(404).json({ message: "Application not found" });
    res.json(application);
  } catch (err) {
    console.error("rejectApplication error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
