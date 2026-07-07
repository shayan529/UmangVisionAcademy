const BASE_ROLES = new Set(["student", "instructor", "admin"]);

export const isBaseRole = (role) =>
  typeof role === "string" && BASE_ROLES.has(role);

export const hasBaseRole = (user, roleName) =>
  Array.isArray(user?.roles) &&
  user.roles.some((role) => {
    if (typeof role === "string") {
      return role.toLowerCase() === roleName.toLowerCase();
    }
    if (role && typeof role === "object" && role.name) {
      return role.name.toLowerCase() === roleName.toLowerCase();
    }
    return false;
  });

export const getCustomRoles = (user) =>
  (user?.roles || []).filter(
    (role) =>
      role &&
      typeof role === "object" &&
      (!role.name || !BASE_ROLES.has(role.name.toLowerCase()))
  );

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
