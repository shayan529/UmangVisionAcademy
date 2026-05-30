import jwt from "jsonwebtoken"
import User from "./../models/user.model.js"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

const createToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  })
}

export const RegisterUser = async (req, res) => {
  const { name, email, password, role } = req.body
  try {
    if (!name || !email || !password|| !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" })
    }
    if(!["student", "instructor"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" })
    }

    const user = await User.create({ name, email, password ,role})
    const token = createToken(user._id)
    setTokenCookie(res, token)

    const userData = user.toObject()
    delete userData.password

    res.status(201).json(userData)
  } catch (error) {
    const message = error?.errors?.password?.message || error.message || "Registration failed"
    res.status(400).json({ message })
    console.error("Error registering user:", error)
  }
}

export const LoginUser = async (req, res) => {
  const { email, password } = req.body
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const compare = await bcrypt.compare(password, user.password)
    if (!compare) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const token = createToken(user._id)
    setTokenCookie(res, token)

    const userData = user.toObject()
    delete userData.password

    res.json(userData)
  } catch (error) {
    res.status(500).json({ error: error.message })
    console.error("Error logging in user:", error)
  }
}

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").populate("enrolledCourses", "title summary").populate("teachingCourses", "title summary")
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password")
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json(user)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json({ message: "User deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const LogoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  })
  res.json({ message: "Logged out successfully" })
}
