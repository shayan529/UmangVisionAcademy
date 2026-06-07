import Course from './../models/courses.model.js';
import User from './../models/user.model.js';

// ── shared shape helper ───────────────────────────────────────────────────────
const shapeCourse = (c) => ({
  _id: c._id,
  title: c.title,
  summary: c.summary,
  category: c.category,
  level: c.level,
  price: c.price,
  thumbnailUrl: c.thumbnailUrl,
  demoVideoUrl: c.demoVideoUrl,
  published: c.published,
  ratingAverage: c.ratingAverage,
  reviewCount: c.reviewCount,
  durationHours: c.durationHours,
  tags: c.tags,
  lessons: c.lessons ?? [],
  lessonCount: c.lessons?.length ?? 0,
  enrolledCount: c.students?.length ?? 0,
  status: c.published ? 'published' : 'draft',
  revenue: (c.price ?? 0) * (c.students?.length ?? 0),
});

// ── createCourse ──────────────────────────────────────────────────────────────
export const createCourse = async (req, res) => {
  try {
    const {
      title,
      summary,
      description,
      category,
      level,
      price,
      thumbnailUrl,
      demoVideoUrl,
      lessons,
      tags,
      board,
      published,
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ message: 'Title is required' });
    if (!summary?.trim())
      return res.status(400).json({ message: 'Summary is required' });

    const course = await Course.create({
      title: title.trim(),
      summary: summary.trim(),
      description: description || '',
      category: category || 'General',
      level: level || 'Beginner',
      price: Number(price) || 0,
      thumbnailUrl: thumbnailUrl || '',
      demoVideoUrl: demoVideoUrl || '',
      lessons: Array.isArray(lessons) ? lessons : [],
      tags: Array.isArray(tags) ? tags : [],
      published: published ?? false,
      instructor: req.user._id,
      board: board,
      students: [],
    });

    res.status(201).json(shapeCourse(course));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── getCourses (instructor — own courses only) ────────────────────────────────
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(courses.map(shapeCourse));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── getPublishedCourses (public — no auth) ────────────────────────────────────
export const getPublishedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ published: true })
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── getCourseByIdPublic (public — single course for CourseDemo page) ──────────
export const getCourseByIdPublic = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, published: true })
      .populate('instructor', 'name email')
      .lean();

    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.json({
      _id: course._id,
      title: course.title,
      summary: course.summary,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
      thumbnailUrl: course.thumbnailUrl,
      demoVideoUrl: course.demoVideoUrl,
      board: course.board,
      instructor: course.instructor,
      tags: course.tags,
      durationHours: course.durationHours,
      ratingAverage: course.ratingAverage,
      reviewCount: course.reviewCount,
      lessonCount: course.lessons?.length ?? 0,
      enrolledCount: course.students?.length ?? 0,
      lessons: (course.lessons ?? []).map((l) => ({
        title: l.title,
        description: l.description,
        durationMinutes: l.durationMinutes,
        // videoUrl intentionally withheld from public
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── getAllCoursesAdmin ────────────────────────────────────────────────────────
export const getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.find({})
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── enrolledCourses ───────────────────────────────────────────────────────────
export const enrolledCourses = async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user._id })
      .populate('instructor', 'name email')
      .lean();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── enrollCourses ─────────────────────────────────────────────────────────────
export const enrollCourses = async (req, res) => {
  try {
    const { courseIds } = req.body;
    if (!Array.isArray(courseIds) || courseIds.length === 0)
      return res
        .status(400)
        .json({ message: 'courseIds must be a non-empty array.' });

    const studentId = req.user._id;
    const enrolled = [],
      alreadyEnrolled = [],
      notFound = [];

    await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await Course.findById(courseId);
        if (!course) {
          notFound.push(courseId);
          return;
        }
        const already = course.students.some(
          (id) => id.toString() === studentId.toString()
        );
        if (already) {
          alreadyEnrolled.push(courseId);
          return;
        }
        await Course.findByIdAndUpdate(courseId, {
          $addToSet: { students: studentId },
        });
        await User.findByIdAndUpdate(studentId, {
          $addToSet: { enrolledCourses: courseId },
        });
        enrolled.push(courseId);
      })
    );

    return res.status(200).json({
      enrolled,
      alreadyEnrolled,
      notFound,
      message: enrolled.length
        ? `Successfully enrolled in ${enrolled.length} course(s).`
        : 'Already enrolled in all selected courses.',
    });
  } catch (err) {
    console.error('enrollCourses error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ── getCourseById (protected) ────────────────────────────────────────────────
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('students', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── updateCourse ──────────────────────────────────────────────────────────────
export const updateCourse = async (req, res) => {
  try {
    const {
      title,
      summary,
      description,
      category,
      level,
      price,
      thumbnailUrl,
      demoVideoUrl,
      lessons,
      tags,
      published,
      board,
    } = req.body;

    const allowedUpdates = {
      ...(title !== undefined && { title }),
      ...(summary !== undefined && { summary }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(level !== undefined && { level }),
      ...(price !== undefined && { price: Number(price) }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      ...(demoVideoUrl !== undefined && { demoVideoUrl }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      ...(published !== undefined && { published }),
      ...(board !== undefined && { board }),
      ...(lessons !== undefined && { lessons }),
    };

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, instructor: req.user._id },
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(shapeCourse(course));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── deleteCourse ──────────────────────────────────────────────────────────────
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({
      _id: req.params.id,
      instructor: req.user._id,
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
