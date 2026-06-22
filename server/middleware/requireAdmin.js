// middleware/requireAdmin.js
//
// Hardcoded check for the base "admin" role only. Deliberately NOT
// permission-based — used to protect endpoints that must never be
// reachable via a custom assignedRole (e.g. managing roles themselves,
// impersonation, anything that could be used for privilege escalation).
import { hasBaseRole } from "../utils/userRoles.js";

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated — please log in",
    });
  }
  if (!hasBaseRole(req.user, "admin")) {
    return res.status(403).json({
      success: false,
      message: "Access denied — admin only",
    });
  }
  next();
};
