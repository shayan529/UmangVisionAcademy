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

// add anywhere near the other exports:

/**
 * True if the module should be visible in the current dashboard's sidebar.
 * Admins always see everything. `user.dashboardModules` comes from the
 * server-hydrated user (see hydrateUserRoles); null/undefined means
 * "unrestricted" so nothing breaks for users hydrated before this shipped.
 *
 * For base-role users (role is a plain string like "student") we also allow
 * the module if `user.dashboardModules` is null — it means the role doc
 * hasn't been re-seeded yet and we should not accidentally hide new modules.
 */
export const hasDashboardModule = (user, moduleKey) => {
  if (!user) return false;
  if (hasBaseRole(user, "admin")) return true;

  // No moduleKey means "always visible" (e.g. overview)
  if (!moduleKey) return true;

  const mods = user.dashboardModules ?? user.role?.dashboardModules;

  // null / undefined = unrestricted:
  //   - base-role users whose role doc hasn't been re-seeded yet
  //   - any user where hydrateUserRoles didn't run
  if (mods == null) return true;

  // empty array = fully restricted (admin explicitly removed all modules)
  if (!Array.isArray(mods) || mods.length === 0) return false;

  return mods.includes(moduleKey);
};
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
 *
 * FIX: "staff" is a BASE role, not a custom role — it must be excluded here
 * the same way student/instructor/admin are. Previously a plain string
 * role === "staff" fell through to the string branch below and got wrapped
 * into a fake custom-role object `{ name: "Staff", permissions: [] }`. That
 * fake object (with an empty-but-defined permissions array) then made
 * hasPermission() short-circuit to `false` for every staff user, before it
 * ever reached the intended staff fallback.
 */
export const getCustomRole = (user, availableRoles = []) => {
  const role = user?.role;
  if (role && typeof role === "object") {
    const name = role.name?.toLowerCase();
    if (name && ["student", "instructor", "admin", "staff"].includes(name)) {
      return null;
    }
    return role;
  }
  if (typeof role === "string") {
    const lower = role.toLowerCase();
    if (["student", "instructor", "admin", "staff"].includes(lower)) {
      return null;
    }
    if (Array.isArray(availableRoles) && availableRoles.length > 0) {
      const found = availableRoles.find(
        (r) => r._id?.toString() === role || r.name?.toLowerCase() === role.toLowerCase()
      );
      if (found) return found;
    }
    return { name: role, permissions: [] };
  }
  return null;
};

/**
 * True if the user holds any custom (non-base) role.
 *
 * NOTE: this intentionally still reports `true` for the base "staff" role —
 * it's used purely for UI branching (e.g. "does this user have some
 * non-default role assignment", see StaffSidebar's isMultiRole calc), not
 * for permission checks. Permission checks go through hasPermission(),
 * which now handles "staff" via its own explicit branch below.
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
 * Base-role "staff" users are checked against the permissions configured
 * on the system "Staff" Role document (hydrated onto the user server-side
 * as `basePermissions` — see hydrateUserRoles in userRoles.js).
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

  // 1. Check explicit permissions on role object or user doc
  const rolePermissions =
    (user.role && typeof user.role === "object" && Array.isArray(user.role.permissions)
      ? user.role.permissions
      : null) ||
    (Array.isArray(user.permissions) ? user.permissions : null) ||
    (Array.isArray(user.basePermissions) ? user.basePermissions : null) ||
    (getCustomRole(user)?.permissions);

  if (Array.isArray(rolePermissions) && rolePermissions.length > 0) {
    const match = rolePermissions.some(
      (p) =>
        p.module === moduleName &&
        Array.isArray(p.actions) &&
        p.actions.includes(actionName),
    );
    if (match) return true;
  }

  // 2. Staff / custom role fallback: Allow view/access for modules present in dashboardModules
  if (hasBaseRole(user, "staff") || hasCustomRole(user)) {
    if (actionName === "view" || actionName === "access") {
      const mods = user.dashboardModules ?? user.role?.dashboardModules;
      if (
        mods == null ||
        (Array.isArray(mods) &&
          (mods.includes(moduleName) || mods.includes("all")))
      ) {
        return true;
      }
    }
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
  ) ||
  Boolean(user.basePermissions?.some((p) => p.actions?.length > 0));