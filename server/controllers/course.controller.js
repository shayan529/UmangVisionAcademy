import Course from "./../models/courses.model.js"

export const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body)
    res.status(201).json(course)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name email").populate("students", "name email")
    res.json(courses)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("instructor", "name email").populate("students", "name email")
    if (!course) return res.status(404).json({ message: "Course not found" })
    res.json(course)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!course) return res.status(404).json({ message: "Course not found" })
    res.json(course)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id)
    if (!course) return res.status(404).json({ message: "Course not found" })
    res.json({ message: "Course deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
