import { PERMISSION_MODULES } from "../models/role.model.js";
import {
  hasBaseRole,
  hasPermissionGrant,
} from "../utils/userRoles.js";

// ── requirePermission ────────────────────────────────────────────────────────
// Usage: requirePermission("courses", "delete")
// Admins (roles includes "admin") always pass.
// Everyone else needs at least one assignedRole granting module:action.
export const requirePermission = (module, action) => {
  if (!PERMISSION_MODULES[module]?.includes(action)) {
    throw new Error(
      `requirePermission: unknown permission "${module}:${action}"`,
    );
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated — please log in",
      });
    }

    const isAdmin = hasBaseRole(req.user, "admin");
    if (isAdmin) return next();

    const hasPermission = hasPermissionGrant(req.user, module, action);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied — missing permission "${module}:${action}"`,
      });
    }

    next();
  };
};

// Convenience: checks if user has ANY of the given module:action permissions.
export const requireAnyPermission = (checks) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated — please log in",
      });
    }

    const isAdmin = hasBaseRole(req.user, "admin");
    if (isAdmin) return next();

    const hasAny = checks.some(([module, action]) =>
      hasPermissionGrant(req.user, module, action),
    );

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: "Access denied — insufficient permissions",
      });
    }
    next();
  };
};
