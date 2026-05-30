import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret"

// ── protect ───────────────────────────────────────────────────────────────────
// Verifies the JWT and attaches req.user
export const protect = async (req, res, next) => {
  try {
    let token

    // Accept token from Authorization header OR cookie
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    } else if (req.cookies?.token) {
      token = req.cookies.token
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated — please log in" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    // Fetch fresh user (so role changes take effect immediately)
    const user = await User.findById(decoded.id).select("-password")
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" })
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: "Account has been deactivated" })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired — please log in again" })
    }
    return res.status(401).json({ success: false, message: "Invalid token" })
  }
}

// ── authorizeRoles ────────────────────────────────────────────────────────────
// Usage: authorizeRoles("admin")  |  authorizeRoles("admin", "instructor")
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — requires one of: ${roles.join(", ")}`,
      })
    }
    next()
  }
}

// ── adminOnly ─────────────────────────────────────────────────────────────────
export const adminOnly = authorizeRoles("admin")

// ── instructorOnly ────────────────────────────────────────────────────────────
// Allows both verified instructors AND admins
export const instructorOnly = (req, res, next) => {
  if (req.user.role === "admin") return next()

  if (req.user.role !== "instructor") {
    return res.status(403).json({ success: false, message: "Access denied — instructors only" })
  }

  if (!req.user.instructorProfile?.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Your instructor application is still pending approval",
    })
  }

  next()
}

// ── selfOrAdmin ───────────────────────────────────────────────────────────────
// Allows the user themselves OR an admin to access a route
// Expects the route to have :id param matching the user's own ID
export const selfOrAdmin = (req, res, next) => {
  const isSelf  = req.user._id.toString() === req.params.id
  const isAdmin = req.user.role === "admin"

  if (!isSelf && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied — you can only modify your own account",
    })
  }
  next()
}
    