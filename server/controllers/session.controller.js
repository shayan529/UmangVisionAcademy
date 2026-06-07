import Session from '../models/session.model.js';
import Course from '../models/courses.model.js';

// GET /sessions — all sessions for the logged-in instructor
// GET /sessions — returns only sessions for courses the student is enrolled in
export const getSessions = async (req, res) => {
  try {
    // Get the courses this student is enrolled in
    const enrolledCourses = await Course.find({ students: req.user._id })
      .select('_id')
      .lean();

    const enrolledCourseIds = enrolledCourses.map((c) => c._id);

    if (enrolledCourseIds.length === 0) return res.json([]);

    // Only return sessions that belong to one of the enrolled courses
    const sessions = await Session.find({
      course: { $in: enrolledCourseIds },
    })
      .populate('course', 'title')
      .populate('instructor', 'name')
      .sort({ date: 1 })
      .lean();

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /sessions/:id
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      instructor: req.user._id,
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /sessions
export const createSession = async (req, res) => {
  try {
    const { title, date, time, status, course, url } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: 'Session title is required' });
    }
    const session = await Session.create({
      title,
      date: date || 'TBD',
      time: time || 'TBD',
      status: status || 'upcoming',
      course: course || null,
      instructor: req.user._id,
      url: url || null,
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
      { new: true, runValidators: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
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
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
