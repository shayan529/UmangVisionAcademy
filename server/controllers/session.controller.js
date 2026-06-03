import Session from "../models/session.model.js";

// GET /sessions — all sessions for the logged-in instructor
export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /sessions/:id
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      instructor: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /sessions
export const createSession = async (req, res) => {
  try {
    const { title, date, time, status, course } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "Session title is required" });
    }
    const session = await Session.create({
      title,
      date: date || "TBD",
      time: time || "TBD",
      status: status || "upcoming",
      course: course || null,
      instructor: req.user._id,
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /sessions/:id
export const updateSession = async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, instructor: req.user._id },
      req.body,
      { new: true, runValidators: true },
    );
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /sessions/:id
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      instructor: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json({ message: "Session deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
