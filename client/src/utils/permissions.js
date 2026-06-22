const BASE_ROLES = new Set(["student", "instructor", "admin"]);

export const isBaseRole = (role) =>
  typeof role === "string" && BASE_ROLES.has(role);

export const hasBaseRole = (user, roleName) =>
  Boolean(user?.roles?.some((role) => role === roleName));

export const getCustomRoles = (user) =>
  (user?.roles || []).filter((role) => role && typeof role === "object");

export const hasPermission = (user, moduleName, actionName = "view") => {
  if (hasBaseRole(user, "admin")) return true;

  return Boolean(
    getCustomRoles(user).some((role) =>
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
      getCustomRoles(user).some((role) =>
        role.permissions?.some((permission) => permission.actions?.length > 0),
      ),
  );
