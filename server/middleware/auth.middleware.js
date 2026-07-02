import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import {
  hasBaseRole,
  hasPermissionGrant,
  hydrateUserRoles,
} from "../utils/userRoles.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

// ── protect ───────────────────────────────────────────────────────────────────
// Verifies the JWT and attaches req.user
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    console.log(
      "[protect] Checking auth - token exists:",
      !!token,
      "path:",
      req.path,
    );

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

    console.log(
      "[protect] User found:",
      user._id,
      "username:",
      user.username,
      "path:",
      req.path,
    );

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    req.user = await hydrateUserRoles(user);
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
    const hasRole = roles.some((r) => hasBaseRole(req.user, r));

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

// ── requirePermission ─────────────────────────────────────────────────────────
// Grants access if the user is a full admin, OR if any of their assignedRoles
// grants the given action on the given module. This mirrors the frontend's
// hasPermission() helper (used in StaffDashboard.jsx / StaffSidebar.jsx)
// exactly, so a Staff member who can see a tab in the sidebar will actually
// be allowed to hit the API routes that tab depends on.
//
// Must run after `protect`, since it reads req.user.assignedRoles — protect
// already calls .populate("assignedRoles") so role.permissions is available
// here rather than just a bare ObjectId.
export const requirePermission = (moduleName, actionName = "view") => {
  return (req, res, next) => {
    const hasGrant = hasPermissionGrant(req.user, moduleName, actionName);

    if (!hasGrant) {
      return res.status(403).json({
        success: false,
        message: `Access denied — requires admin or '${actionName}' permission on '${moduleName}'`,
      });
    }

    next();
  };
};

// ── instructorOnly ────────────────────────────────────────────────────────────
export const instructorOnly = (req, res, next) => {
  const isAdmin = hasBaseRole(req.user, "admin");
  const isInstructor = hasBaseRole(req.user, "instructor");

  if (isAdmin) return next();

  if (!isInstructor) {
    return res.status(403).json({
      success: false,
      message: "Access denied — instructors only",
    });
  }

  next();
};

// ── selfOrAdmin ───────────────────────────────────────────────────────────────
export const selfOrAdmin = (req, res, next) => {
  const isSelf = req.user._id.toString() === req.params.id;
  const isAdmin = hasBaseRole(req.user, "admin");

  if (!isSelf && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied — you can only modify your own account",
    });
  }
  next();
};

export const selfOrPermission = (moduleName, actionName) => {
  return (req, res, next) => {
    const isSelf = req.user?._id?.toString() === req.params.id;
    const isAdmin = hasBaseRole(req.user, "admin");
    const hasGrant = hasPermissionGrant(req.user, moduleName, actionName);

    if (isSelf || isAdmin || hasGrant) return next();

    return res.status(403).json({
      success: false,
      message: `Access denied - requires '${actionName}' permission on '${moduleName}'`,
    });
  };
};
