// src/utils/permissions.js
//
// Single source of truth for permission checks on the frontend.
// Mirrors the backend's requirePermission logic exactly (see
// middleware/requirePermission.js) so the UI and API never disagree about
// who can do what.

/**
 * @param {object} user - the logged-in user (from redux state.auth.user)
 * @param {string} moduleName - e.g. "courses", "users", "payments", "moderation"
 * @param {string} actionName - e.g. "view", "create", "edit", "delete", "refund"...
 */
export const hasPermission = (user, moduleName, actionName = "view") => {
  if (!user) return false;
  if (user.roles?.includes("admin")) return true; // admin always passes
  return (
    user.assignedRoles?.some((role) =>
      role.permissions?.some(
        (p) => p.module === moduleName && p.actions?.includes(actionName),
      ),
    ) || false
  );
};

/** True if the user has ANY of the given [module, action] pairs. */
export const hasAnyPermission = (user, checks = []) =>
  checks.some(([mod, action]) => hasPermission(user, mod, action));

/** True if the user has ALL of the given [module, action] pairs. */
export const hasAllPermissions = (user, checks = []) =>
  checks.every(([mod, action]) => hasPermission(user, mod, action));
