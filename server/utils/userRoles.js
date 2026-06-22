import mongoose from "mongoose";
import Role from "../models/role.model.js";
import User from "../models/user.model.js";

const { Types } = mongoose;

export const BASE_ROLES = ["student", "instructor", "admin"];
const BASE_ROLE_SET = new Set(BASE_ROLES);

export const isBaseRole = (role) =>
  typeof role === "string" && BASE_ROLE_SET.has(role);

export const roleIdString = (role) => {
  if (!role) return "";
  if (typeof role === "string") return isBaseRole(role) ? "" : role;
  if (role instanceof Types.ObjectId) return role.toString();
  if (role._id) return role._id.toString();
  return "";
};

export const hasBaseRole = (user, roleName) =>
  Array.isArray(user?.roles) &&
  user.roles.some((role) => role === roleName);

export const customRoleIdsFromRoles = (roles = []) =>
  roles.map(roleIdString).filter((id) => Types.ObjectId.isValid(id));

export const mergeBaseAndCustomRoles = (baseRoles = [], customRoleIds = []) => {
  const cleanBaseRoles = [...new Set(baseRoles.filter(isBaseRole))];
  const cleanCustomRoleIds = [
    ...new Set(customRoleIds.map(roleIdString).filter((id) => Types.ObjectId.isValid(id))),
  ].map((id) => new Types.ObjectId(id));

  return [...cleanBaseRoles, ...cleanCustomRoleIds];
};

const toPlainUser = (user) => {
  if (!user) return null;
  return typeof user.toObject === "function" ? user.toObject() : { ...user };
};

export const migrateLegacyAssignedRoles = async (user) => {
  if (!user?._id) return null;

  const rawUser = await User.collection.findOne(
    { _id: user._id },
    { projection: { roles: 1, assignedRoles: 1 } },
  );

  const legacyAssignedRoles = rawUser?.assignedRoles || [];
  if (!legacyAssignedRoles.length) return rawUser?.roles || user.roles || [];

  const baseRoles = (rawUser.roles || user.roles || []).filter(isBaseRole);
  const customRoleIds = [
    ...customRoleIdsFromRoles(rawUser.roles || user.roles || []),
    ...legacyAssignedRoles.map((id) => id.toString()),
  ];
  const mergedRoles = mergeBaseAndCustomRoles(baseRoles, customRoleIds);

  await User.collection.updateOne(
    { _id: user._id },
    { $set: { roles: mergedRoles }, $unset: { assignedRoles: "" } },
  );

  return mergedRoles;
};

export const hydrateUserRoles = async (user, { migrate = true } = {}) => {
  const plainUser = toPlainUser(user);
  if (!plainUser) return null;

  const roles = migrate
    ? await migrateLegacyAssignedRoles(plainUser)
    : plainUser.roles || [];

  const baseRoles = roles.filter(isBaseRole);
  const customRoleIds = customRoleIdsFromRoles(roles);
  const customRoles = customRoleIds.length
    ? await Role.find({ _id: { $in: customRoleIds } }).lean()
    : [];
  const customRoleById = new Map(
    customRoles.map((role) => [role._id.toString(), role]),
  );

  plainUser.roles = [
    ...baseRoles,
    ...customRoleIds
      .map((id) => customRoleById.get(id))
      .filter(Boolean),
  ];

  delete plainUser.assignedRoles;
  delete plainUser.password;
  return plainUser;
};

export const hydrateUsersRoles = async (users = [], options) =>
  Promise.all(users.map((user) => hydrateUserRoles(user, options)));

export const hasPermissionGrant = (user, moduleName, actionName = "view") => {
  if (hasBaseRole(user, "admin")) return true;

  return Boolean(
    user?.roles?.some(
      (role) =>
        typeof role === "object" &&
        role.permissions?.some(
          (permission) =>
            permission.module === moduleName &&
            permission.actions?.includes(actionName),
        ),
    ),
  );
};
