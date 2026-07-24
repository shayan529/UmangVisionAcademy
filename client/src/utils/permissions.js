// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_ROLES = new Set(["student", "instructor", "admin", "staff"]);

export const isBaseRole = (value) =>
  typeof value === "string" && BASE_ROLES.has(value.toLowerCase());

/**
 * user.role is either:
 *   • a string  ("student" | "instructor" | "admin" | "staff")
 *   • a populated Role object  { _id, name, permissions, ... }
 *
 * Returns true if the user's effective role name matches roleName.
 */
export const hasBaseRole = (user, roleName) => {
  if (!user || !roleName) return false;
  const name = roleName.toLowerCase();

  const role = user.role;

  // New shape — string base role
  if (typeof role === "string") return role.toLowerCase() === name;

  // New shape — populated custom Role object
  if (role && typeof role === "object" && role.name) {
    return role.name.toLowerCase() === name;
  }

  // Legacy fallback — old roles[] array still in localStorage cache
  if (Array.isArray(user.roles)) {
    return user.roles.some((r) => {
      if (typeof r === "string") return r.toLowerCase() === name;
      if (r && typeof r === "object" && r.name) return r.name.toLowerCase() === name;
      return false;
    });
  }

  return false;
};

/**
 * Returns the custom Role object if the user's role is a populated Role doc,
 * otherwise null.
 */
export const getCustomRole = (user, availableRoles = []) => {
  const role = user?.role;
  if (role && typeof role === "object") {
    const name = role.name?.toLowerCase();
    if (name && ["student", "instructor", "admin"].includes(name)) {
      return null;
    }
    return role;
  }
  if (typeof role === "string") {
    const lower = role.toLowerCase();
    if (["student", "instructor", "admin"].includes(lower)) {
      return null;
    }
    if (Array.isArray(availableRoles) && availableRoles.length > 0) {
      const found = availableRoles.find(
        (r) => r._id?.toString() === role || r.name?.toLowerCase() === role.toLowerCase()
      );
      if (found) return found;
    }
    return { name: lower === "staff" ? "Staff" : role, permissions: [] };
  }
  return null;
};

/**
 * True if the user holds any custom (non-base) role or staff role.
 */
export const hasCustomRole = (user) => {
  if (!user) return false;

  const role = user.role;

  if (role && typeof role === "object") {
    const name = role.name?.toLowerCase();
    if (name && ["student", "instructor", "admin"].includes(name)) {
      return false;
    }
    return true;
  }

  if (typeof role === "string") {
    const lower = role.toLowerCase();
    if (lower === "staff") return true;
    if (!["student", "instructor", "admin"].includes(lower)) {
      return true;
    }
  }

  if (Array.isArray(user.roles)) {
    return user.roles.some((r) => {
      const name = typeof r === "string" ? r.toLowerCase() : r?.name?.toLowerCase();
      if (!name) return typeof r === "object";
      return name === "staff" || !["student", "instructor", "admin"].includes(name);
    });
  }

  return false;
};

/**
 * Check if the user has a specific permission on a module.
 * Admins implicitly have every permission.
 * Custom-role users are checked against their role's permissions array.
 */
export const hasPermission = (user, moduleName, actionName = "view") => {
  if (!user) return false;
  if (hasBaseRole(user, "admin")) return true;

  if (hasBaseRole(user, "instructor")) {
    const instructorModules = new Set([
      "courses",
      "sessions",
      "notes",
      "mock_tests",
      "mockTests",
      "reels",
      "question_bank",
      "questionPapers",
    ]);
    const allowedActions = new Set(["create", "edit", "view", "delete"]);
    if (instructorModules.has(moduleName) && allowedActions.has(actionName)) {
      return true;
    }
  }

  const customRole = getCustomRole(user);
  if (customRole && Array.isArray(customRole.permissions)) {
    return Boolean(
      customRole.permissions.some(
        (p) => p.module === moduleName && p.actions?.includes(actionName),
      ),
    );
  }

  if (user.role === "staff" || hasBaseRole(user, "staff")) {
    return true;
  }

  return false;
};

export const hasAnyPermission = (user, checks = []) =>
  checks.some(([mod, action]) => hasPermission(user, mod, action));

export const hasAllPermissions = (user, checks = []) =>
  checks.every(([mod, action]) => hasPermission(user, mod, action));

export const hasAssignedPermissions = (user) =>
  hasBaseRole(user, "admin") ||
  Boolean(
    getCustomRole(user)?.permissions?.some((p) => p.actions?.length > 0),
  );
