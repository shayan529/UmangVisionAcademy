export const hasPermission = (user, moduleName, actionName = "view") => {
  if (user?.roles?.includes("admin")) return true;

  return Boolean(
    user?.assignedRoles?.some((role) =>
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
    user?.roles?.includes("admin") ||
      user?.assignedRoles?.some((role) =>
        role.permissions?.some((permission) => permission.actions?.length > 0),
      ),
  );
