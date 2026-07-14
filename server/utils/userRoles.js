import mongoose from "mongoose";
import Role from "../models/role.model.js";
import User from "../models/user.model.js";
import { getJson, setJson } from "./redisClient.js";

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
  user.roles.some((role) => {
    if (typeof role === "string") {
      return role.toLowerCase() === roleName.toLowerCase();
    }
    if (role && typeof role === "object" && role.name) {
      return role.name.toLowerCase() === roleName.toLowerCase();
    }
    return false;
  });

export const customRoleIdsFromRoles = (roles = []) =>
  roles.map(roleIdString).filter((id) => Types.ObjectId.isValid(id));

export const mergeBaseAndCustomRoles = (baseRoles = [], customRoleIds = []) => {
  const cleanBaseRoles = [...new Set(baseRoles.filter(isBaseRole))];
  const cleanCustomRoleIds = [
    ...new Set(
      customRoleIds
        .map(roleIdString)
        .filter((id) => Types.ObjectId.isValid(id)),
    ),
  ].map((id) => new Types.ObjectId(id));

  return [...cleanBaseRoles, ...cleanCustomRoleIds];
};

const toPlainUser = (user) => {
  if (!user) return null;
  return typeof user.toObject === "function" ? user.toObject() : { ...user };
};

export const hydrateUserRoles = async (user) => {
  const plainUser = toPlainUser(user);
  if (!plainUser) return null;

  try {
    const roles = plainUser.roles || [];

    const baseRoles = roles.filter(isBaseRole);
    const customRoleIds = customRoleIdsFromRoles(roles);

    const customRoles = [];
    if (customRoleIds.length > 0) {
      const rolesToFetchFromDb = [];
      for (const id of customRoleIds) {
        const cached = await getJson(`role:${id}`);
        if (cached) {
          customRoles.push(cached);
        } else {
          rolesToFetchFromDb.push(id);
        }
      }

      if (rolesToFetchFromDb.length > 0) {
        const fetchedRoles = await Role.find({
          _id: { $in: rolesToFetchFromDb },
        }).lean();
        for (const role of fetchedRoles) {
          await setJson(`role:${role._id.toString()}`, role, 3600 * 24); // Cache for 24 hours
          customRoles.push(role);
        }
      }
    }
    const customRoleById = new Map(
      customRoles.map((role) => [role._id.toString(), role]),
    );

    // System roles whose name matches a base role (e.g. the "Student" or
    // "Instructor" system role documents) should be treated as base role
    // strings, not kept as custom role objects. This prevents the mismatch
    // where a user has a system role ObjectId for "Student" but no base
    // role string "student" — which breaks every `.includes("student")`
    // and `{ roles: { $in: ["student"] } }` filter.
    const trueCustomRoles = [];
    for (const id of customRoleIds) {
      const roleDoc = customRoleById.get(id);
      if (!roleDoc) continue;
      const normalizedName = roleDoc.name?.toLowerCase();
      if (roleDoc.isSystem && BASE_ROLE_SET.has(normalizedName)) {
        // Promote to base role string if not already present
        if (!baseRoles.includes(normalizedName)) {
          baseRoles.push(normalizedName);
        }
      } else {
        trueCustomRoles.push(roleDoc);
      }
    }

    plainUser.roles = [
      ...baseRoles,
      ...trueCustomRoles,
    ];
  } catch (error) {
    console.error("[Roles] hydrateUserRoles failed:", error);
    plainUser.roles = (plainUser.roles || []).filter(isBaseRole);
  }

  delete plainUser.assignedRoles;
  delete plainUser.password;
  return plainUser;
};

export const hydrateUsersRoles = async (users = []) =>
  Promise.all(users.map((user) => hydrateUserRoles(user)));

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
