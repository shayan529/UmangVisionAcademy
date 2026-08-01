import mongoose from "mongoose";
import Role from "../models/role.model.js";
import { getJson, setJson } from "./redisClient.js";

const { Types } = mongoose;

export const BASE_ROLES = ["student", "instructor", "admin", "staff"];
const BASE_ROLE_SET = new Set(BASE_ROLES);

export const isBaseRole = (value) =>
  typeof value === "string" && BASE_ROLE_SET.has(value.toLowerCase());

export const isRoleObjectId = (value) =>
  value instanceof Types.ObjectId ||
  (typeof value === "string" && Types.ObjectId.isValid(value) && !isBaseRole(value));

export const hasBaseRole = (user, roleName) => {
  if (!user || !roleName) return false;
  const name = roleName.toLowerCase();

  const role = user.role;

  if (typeof role === "string") {
    return role.toLowerCase() === name;
  }

  if (role && typeof role === "object" && role.name) {
    return role.name.toLowerCase() === name;
  }

  if (Array.isArray(user.roles)) {
    return user.roles.some((r) => {
      if (typeof r === "string") return r.toLowerCase() === name;
      if (r && typeof r === "object" && r.name) return r.name.toLowerCase() === name;
      return false;
    });
  }

  return false;
};

// Cached lookup of a base role's system Role doc (for dashboardModules AND
// permissions — see FIX note in hydrateUserRoles below).
const getBaseRoleDoc = async (name) => {
  const cacheKey = `role:base:${name}`;
  try {
    let doc = await getJson(cacheKey);
    if (!doc) {
      // Case-insensitive lookup so "student" matches "Student" etc.
      doc = await Role.findOne({ name: new RegExp(`^${name}$`, "i"), isSystem: true }).lean();
      if (doc) await setJson(cacheKey, doc, 3600 * 24);
    }
    return doc;
  } catch (err) {
    console.error(`[Roles] getBaseRoleDoc(${name}) failed:`, err);
    return null;
  }
};

const toPlainUser = (user) => {
  if (!user) return null;
  return typeof user.toObject === "function" ? user.toObject() : { ...user };
};

export const hydrateUserRoles = async (user) => {
  const plain = toPlainUser(user);
  if (!plain) return null;

  if (!plain.role && Array.isArray(plain.roles)) {
    const firstBase = plain.roles.find(isBaseRole);
    plain.role = firstBase || "student";
  }

  const roleValue = plain.role;

  // Base-role string — resolve the system Role doc for dashboardModules,
  // but keep `role` itself a plain string so isBaseRole/hasBaseRole are untouched.
  if (isBaseRole(roleValue) || roleValue == null) {
    const name = (roleValue || "student").toLowerCase();
    plain.role = name;
    const baseDoc = await getBaseRoleDoc(name);
    plain.dashboardModules = baseDoc?.dashboardModules ?? null; // null = unrestricted
    // FIX: previously only dashboardModules was pulled from the base Role
    // doc, so any Permissions configured for the system "Staff" role in the
    // Roles & Permissions UI had zero effect on actual access checks — only
    // on sidebar visibility. basePermissions is now hydrated too, and
    // hasPermissionGrant() (below) and the client's hasPermission() both
    // check it for plain base-role "staff" users.
    plain.basePermissions = baseDoc?.permissions ?? [];
    delete plain.roles;
    delete plain.assignedRoles;
    delete plain.password;
    return plain;
  }

  if (roleValue && typeof roleValue === "object" && roleValue._id) {
    delete plain.roles;
    delete plain.assignedRoles;
    delete plain.password;
    return plain;
  }

  const idStr = roleValue instanceof Types.ObjectId
    ? roleValue.toString()
    : typeof roleValue === "string"
      ? roleValue
      : null;

  if (!idStr || !Types.ObjectId.isValid(idStr)) {
    plain.role = "student";
    plain.dashboardModules = null;
    delete plain.roles;
    delete plain.assignedRoles;
    delete plain.password;
    return plain;
  }

  try {
    const cacheKey = `role:${idStr}`;
    let roleDoc = await getJson(cacheKey);

    if (!roleDoc) {
      roleDoc = await Role.findById(idStr).lean();
      if (roleDoc) {
        await setJson(cacheKey, roleDoc, 3600 * 24);
      }
    }

    plain.role = roleDoc || "student";
    plain.dashboardModules = roleDoc?.dashboardModules ?? null;
  } catch (err) {
    console.error("[Roles] hydrateUserRoles failed to fetch role doc:", err);
    plain.role = "student";
  }

  delete plain.roles;
  delete plain.assignedRoles;
  delete plain.password;
  return plain;
};

export const hydrateUsersRoles = async (users = []) => {
  if (!Array.isArray(users) || users.length === 0) return [];

  const candidateIdStrs = new Set();

  for (const u of users) {
    const roleValue = u?.role ?? (Array.isArray(u?.roles) ? u.roles.find(isBaseRole) : null);
    if (
      roleValue &&
      typeof roleValue !== "object" &&
      !isBaseRole(roleValue)
    ) {
      const idStr = roleValue instanceof Types.ObjectId
        ? roleValue.toString()
        : typeof roleValue === "string"
          ? roleValue
          : null;
      if (idStr && Types.ObjectId.isValid(idStr)) {
        candidateIdStrs.add(idStr);
      }
    }
  }

  if (candidateIdStrs.size === 0) {
    return Promise.all(users.map(hydrateUserRoles));
  }

  const roleMap = new Map();
  const missingIds = [];

  for (const idStr of candidateIdStrs) {
    const cacheKey = `role:${idStr}`;
    const cached = await getJson(cacheKey);
    if (cached) {
      roleMap.set(idStr, cached);
    } else {
      missingIds.push(idStr);
    }
  }

  if (missingIds.length > 0) {
    try {
      const fetched = await Role.find({ _id: { $in: missingIds } }).lean();
      for (const roleDoc of fetched) {
        const idStr = roleDoc._id.toString();
        roleMap.set(idStr, roleDoc);
        setJson(`role:${idStr}`, roleDoc, 3600 * 24).catch(() => undefined);
      }
    } catch (err) {
      console.error("[Roles] hydrateUsersRoles batch fetch failed:", err);
    }
  }

  return Promise.all(
    users.map(async (u) => {
      const plain = toPlainUser(u);
      if (!plain) return null;

      if (!plain.role && Array.isArray(plain.roles)) {
        const firstBase = plain.roles.find(isBaseRole);
        plain.role = firstBase || "student";
      }

      const roleValue = plain.role;
      if (isBaseRole(roleValue) || roleValue == null) {
        return hydrateUserRoles(u); // reuse the single-user path so dashboardModules/basePermissions get attached
      }

      if (roleValue && typeof roleValue === "object" && roleValue._id) {
        plain.dashboardModules = roleValue.dashboardModules ?? null;
        delete plain.roles;
        delete plain.assignedRoles;
        delete plain.password;
        return plain;
      }

      const idStr = roleValue instanceof Types.ObjectId
        ? roleValue.toString()
        : typeof roleValue === "string"
          ? roleValue
          : null;

      if (idStr && roleMap.has(idStr)) {
        const roleDoc = roleMap.get(idStr);
        plain.role = roleDoc;
        plain.dashboardModules = roleDoc?.dashboardModules ?? null;
      } else {
        return hydrateUserRoles(u);
      }

      delete plain.roles;
      delete plain.assignedRoles;
      delete plain.password;
      return plain;
    })
  );
};

/**
 * Check if the user has a specific permission on a module.
 * Admins implicitly have every permission.
 * Instructors get a hardcoded default module set.
 * Base-role "staff" users are checked against `basePermissions`, hydrated
 * from the system "Staff" Role doc by hydrateUserRoles (FIX — previously
 * this function returned `false` unconditionally for any string role,
 * meaning plain "staff" users could never pass a permission check on the
 * backend regardless of what was configured for them in the admin UI).
 * Populated custom Role objects are checked against their own permissions.
 */
export const hasPermissionGrant = (user, moduleName, actionName = "view") => {
  if (hasBaseRole(user, "admin")) return true;

  if (hasBaseRole(user, "instructor")) {
    const instructorModules = new Set([
      "courses", "sessions", "notes", "mock_tests", "mockTests",
      "reels", "question_bank", "questionPapers",
    ]);
    const allowedActions = new Set(["create", "edit", "view", "delete"]);
    if (instructorModules.has(moduleName) && allowedActions.has(actionName)) {
      return true;
    }
  }

  if (hasBaseRole(user, "staff")) {
    if (Array.isArray(user?.basePermissions) && user.basePermissions.length > 0) {
      return Boolean(
        user.basePermissions.some(
          (p) => p.module === moduleName && p.actions?.includes(actionName),
        ),
      );
    }
    return true;
  }

  const role = user?.role;
  if (!role || typeof role === "string") return false;

  return Boolean(
    role.permissions?.some(
      (p) => p.module === moduleName && p.actions?.includes(actionName),
    ),
  );
};