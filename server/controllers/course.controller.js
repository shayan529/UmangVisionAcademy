import Course from "./../models/courses.model.js";

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
      tags,
      published,
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ message: "Title is required" });
    if (!summary?.trim())
      return res.status(400).json({ message: "Summary is required" });

    const course = await Course.create({
      title,
      summary,
      description: description || "",
      category: category || "General",
      level: level || "Beginner",
      price: Number(price) || 0,
      thumbnailUrl: thumbnailUrl || "",
      tags: Array.isArray(tags) ? tags : [],
      published: published ?? false,
      instructor: req.user._id, // ← set from JWT, never trust the client
      students: [], // ← always start empty
    });

    res.status(201).json({
      _id: course._id,
      title: course.title,
      summary: course.summary,
      category: course.category,
      level: course.level,
      price: course.price,
      thumbnailUrl: course.thumbnailUrl,
      published: course.published,
      ratingAverage: course.ratingAverage,
      reviewCount: course.reviewCount,
      durationHours: course.durationHours,
      tags: course.tags,
      enrolledCount: 0,
      status: course.published ? "published" : "draft",
      revenue: 0,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    });

    // Shape the response to match what InstructorCourses expects
    const shaped = courses.map((c) => ({
      _id: c._id,
      title: c.title,
      summary: c.summary,
      category: c.category,
      level: c.level,
      price: c.price,
      thumbnailUrl: c.thumbnailUrl,
      published: c.published,
      ratingAverage: c.ratingAverage,
      reviewCount: c.reviewCount,
      durationHours: c.durationHours,
      tags: c.tags,
      // Flatten array → count for the dashboard cards
      enrolledCount: c.students.length,
      // Normalise status string for the status badge in InstructorCourses
      status: c.published ? "published" : "draft",
      // Revenue placeholder — add a real field to the schema later if needed
      revenue: c.price * c.students.length,
    }));

    res.json(shaped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email")
      .populate("students", "name email");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      tags,
      published,
    } = req.body;

    // Only allow safe fields — never let client touch instructor/students/_id
    const allowedUpdates = {
      ...(title !== undefined && { title }),
      ...(summary !== undefined && { summary }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(level !== undefined && { level }),
      ...(price !== undefined && { price: Number(price) }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      ...(published !== undefined && { published }),
    };

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, instructor: req.user._id }, // ← scoped to owner
      allowedUpdates,
      { new: true, runValidators: true },
    );

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Return the same shaped object as getCourses/createCourse
    res.json({
      _id: course._id,
      title: course.title,
      summary: course.summary,
      category: course.category,
      level: course.level,
      price: course.price,
      thumbnailUrl: course.thumbnailUrl,
      published: course.published,
      ratingAverage: course.ratingAverage,
      reviewCount: course.reviewCount,
      durationHours: course.durationHours,
      tags: course.tags,
      enrolledCount: course.students.length,
      status: course.published ? "published" : "draft",
      revenue: course.price * course.students.length,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({
      _id: req.params.id,
      instructor: req.user._id, // ← only the owner can delete
    });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
