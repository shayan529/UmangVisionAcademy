import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

// ── protect ───────────────────────────────────────────────────────────────────
// Verifies the JWT and attaches req.user
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated — please log in",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired — please log in again",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// ── authorizeRoles ────────────────────────────────────────────────────────────
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const hasRole = roles.some((r) => req.user.roles?.includes(r)); // ✅ array check

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied — requires one of: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

// ── adminOnly ─────────────────────────────────────────────────────────────────
export const adminOnly = authorizeRoles("admin");

// ── instructorOnly ────────────────────────────────────────────────────────────
export const instructorOnly = (req, res, next) => {
  const isAdmin = req.user.roles?.includes("admin"); // ✅
  const isInstructor = req.user.roles?.includes("instructor"); // ✅

  if (isAdmin) return next();

  if (!isInstructor) {
    return res.status(403).json({
      success: false,
      message: "Access denied — instructors only",
    });
  }

  if (!req.user.instructorProfile?.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Your instructor application is still pending approval",
    });
  }

  next();
};

// ── selfOrAdmin ───────────────────────────────────────────────────────────────
export const selfOrAdmin = (req, res, next) => {
  const isSelf = req.user._id.toString() === req.params.id;
  const isAdmin = req.user.roles?.includes("admin"); // ✅

  if (!isSelf && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied — you can only modify your own account",
    });
  }
  next();
};
