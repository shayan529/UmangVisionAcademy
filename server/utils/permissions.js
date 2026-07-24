// server/utils/permissions.js
//
// Server-side permission check helpers.
// Mirrors the logic in middleware/permission.middleware.js and
// server/utils/userRoles.js so any code that imports this file
// stays in sync with the single-role refactor.

import { hasBaseRole, hasPermissionGrant } from "./userRoles.js";

/**
 * Returns true if the user has the given permission on the given module.
 * Admins implicitly have every permission.
 *
 * @param {object} user - hydrated user object (user.role + user.assignedRoles[])
 * @param {string} moduleName - e.g. "courses", "users", "payments"
 * @param {string} actionName - e.g. "view", "create", "edit", "delete"
 */
export const hasPermission = (user, moduleName, actionName = "view") => {
  if (!user) return false;
  return hasPermissionGrant(user, moduleName, actionName);
};

/** True if the user has ANY of the given [module, action] pairs. */
export const hasAnyPermission = (user, checks = []) =>
  checks.some(([mod, action]) => hasPermission(user, mod, action));

/** True if the user has ALL of the given [module, action] pairs. */
export const hasAllPermissions = (user, checks = []) =>
  checks.every(([mod, action]) => hasPermission(user, mod, action));
