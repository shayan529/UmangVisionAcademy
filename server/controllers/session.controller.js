import Session from '../models/session.model.js';
import Course from '../models/courses.model.js';

// GET /sessions — for INSTRUCTOR (their own sessions)
export const getInstructorSessions = async (req, res) => {
  console.log('req.user._id:', req.user._id);
  try {
    // In getInstructorSessions controller
    const sessions = await Session.find({ instructor: req.user._id })
      .lean()
      .populate('course', 'title')
      .sort({ date: 1 });
    console.log('Sessions found:', sessions.length);

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /sessions — for STUDENT (enrolled courses only)
export const getStudentSessions = async (req, res) => {
  try {
    const enrolledCourses = await Course.find({ students: req.user._id })
      .select('_id instructor')
      .lean();

    const enrolledCourseIds = enrolledCourses.map((c) => c._id);
    const instructorIds = enrolledCourses.map((c) => c.instructor).filter(Boolean);

    if (enrolledCourseIds.length === 0) return res.json([]);

    const sessions = await Session.find({
      $or: [
        { course: { $in: enrolledCourseIds } },
        { instructor: { $in: instructorIds } },
      ],
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
