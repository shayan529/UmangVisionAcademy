// ── Base role constants ────────────────────────────────────────────────────────
const BASE_ROLES = new Set(["student", "instructor", "admin", "staff"]);

export const isBaseRole = (role) =>
  typeof role === "string" && BASE_ROLES.has(role);

// ── Single-role check ─────────────────────────────────────────────────────────
// user.role is now a plain string. The legacy fallback handles any cached
// objects that were stored before the migration runs.
export const hasBaseRole = (user, roleName) => {
  if (!user || !roleName) return false;
  const name = roleName.toLowerCase();

  // New shape: user.role is a string
  if (typeof user.role === "string") {
    return user.role.toLowerCase() === name;
  }

  // Legacy shape: user.roles is an array (pre-migration cache hit)
  if (Array.isArray(user.roles)) {
    return user.roles.some((r) => {
      if (typeof r === "string") return r.toLowerCase() === name;
      if (r && typeof r === "object" && r.name) return r.name.toLowerCase() === name;
      return false;
    });
  }

  return false;
};

// ── Custom / permission-role helpers ─────────────────────────────────────────
// assignedRoles is an array of populated Role documents attached by
// hydrateUserRoles on the server.
export const getAssignedRoles = (user) =>
  Array.isArray(user?.assignedRoles)
    ? user.assignedRoles.filter(
        (r) => r && typeof r === "object" && r.permissions,
      )
    : [];

export const hasPermission = (user, moduleName, actionName = "view") => {
  if (hasBaseRole(user, "admin")) return true;

  return Boolean(
    getAssignedRoles(user).some((role) =>
      role.permissions?.some(
        (permission) =>
          permission.module === moduleName &&
          permission.actions?.includes(actionName),
      ),
    ),
  );
};

export const hasAnyPermission = (user, checks = []) =>
  checks.some(([moduleName, actionName]) =>
    hasPermission(user, moduleName, actionName),
  );

export const hasAllPermissions = (user, checks = []) =>
  checks.every(([moduleName, actionName]) =>
    hasPermission(user, moduleName, actionName),
  );

export const hasAssignedPermissions = (user) =>
  Boolean(
    hasBaseRole(user, "admin") ||
      getAssignedRoles(user).some((role) =>
        role.permissions?.some((permission) => permission.actions?.length > 0),
      ),
  );
