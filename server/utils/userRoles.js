import mongoose from "mongoose";
import Role from "../models/role.model.js";
import { getJson, setJson } from "./redisClient.js";

const { Types } = mongoose;

// ── Constants ─────────────────────────────────────────────────────────────────
export const BASE_ROLES = ["student", "instructor", "admin", "staff"];
const BASE_ROLE_SET = new Set(BASE_ROLES);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** True if the value is one of the fixed base-role strings. */
export const isBaseRole = (value) =>
  typeof value === "string" && BASE_ROLE_SET.has(value.toLowerCase());

/** True if the value looks like a Mongo ObjectId (custom role reference). */
export const isRoleObjectId = (value) =>
  value instanceof Types.ObjectId ||
  (typeof value === "string" && Types.ObjectId.isValid(value) && !isBaseRole(value));

// ── hasBaseRole ───────────────────────────────────────────────────────────────
// Works with both the new single-field shape and the legacy array shape that
// may still live in Redis cache from before the migration.
export const hasBaseRole = (user, roleName) => {
  if (!user || !roleName) return false;
  const name = roleName.toLowerCase();

  const role = user.role;

  // New shape: role is a string
  if (typeof role === "string") {
    return role.toLowerCase() === name;
  }

  // New shape: role is a populated custom Role object — check its name
  if (role && typeof role === "object" && role.name) {
    return role.name.toLowerCase() === name;
  }

  // Legacy shape: user.roles is an array (pre-migration cache)
  if (Array.isArray(user.roles)) {
    return user.roles.some((r) => {
      if (typeof r === "string") return r.toLowerCase() === name;
      if (r && typeof r === "object" && r.name) return r.name.toLowerCase() === name;
      return false;
    });
  }

  return false;
};

// ── hydrateUserRoles ──────────────────────────────────────────────────────────
// Converts a raw Mongoose user document into a plain object with:
//   • role: string  — if a base role
//   • role: { _id, name, permissions, ... }  — if a custom Role document
// The caller (protect middleware) caches the result in Redis.
const toPlainUser = (user) => {
  if (!user) return null;
  return typeof user.toObject === "function" ? user.toObject() : { ...user };
};

export const hydrateUserRoles = async (user) => {
  const plain = toPlainUser(user);
  if (!plain) return null;

  // ── Legacy migration fallback ────────────────────────────────────────────
  // Old shape had roles[] array + assignedRoles[]. Promote to new single field.
  if (!plain.role && Array.isArray(plain.roles)) {
    const firstBase = plain.roles.find(isBaseRole);
    plain.role = firstBase || "student";
  }

  const roleValue = plain.role;

  // Base-role string — nothing to populate
  if (isBaseRole(roleValue) || roleValue == null) {
    if (roleValue == null) plain.role = "student";
    delete plain.roles;
    delete plain.assignedRoles;
    delete plain.password;
    return plain;
  }

  // Already a populated object (e.g. came from a .populate() call)
  if (roleValue && typeof roleValue === "object" && roleValue._id) {
    delete plain.roles;
    delete plain.assignedRoles;
    delete plain.password;
    return plain;
  }

  // ObjectId reference — fetch the Role document
  const idStr = roleValue instanceof Types.ObjectId
    ? roleValue.toString()
    : typeof roleValue === "string"
      ? roleValue
      : null;

  if (!idStr || !Types.ObjectId.isValid(idStr)) {
    // Unrecognised value — fall back to student
    plain.role = "student";
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

    plain.role = roleDoc || "student"; // fallback if role was deleted
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

  // Extract all unique candidate role ObjectId strings that need resolution
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

  // Pre-fetch candidate role documents (Redis cache or single batch DB query)
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
        if (roleValue == null) plain.role = "student";
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

      if (idStr && roleMap.has(idStr)) {
        plain.role = roleMap.get(idStr);
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

// ── hasPermissionGrant ────────────────────────────────────────────────────────
// Admins have all permissions.
// Instructors have default permissions for courses, sessions, notes, mock tests, reels, and question bank.
// Custom-role users get permissions from their hydrated role object.
export const hasPermissionGrant = (user, moduleName, actionName = "view") => {
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

  const role = user?.role;
  if (!role || typeof role === "string") return false;

  // role is a populated custom Role document
  return Boolean(
    role.permissions?.some(
      (p) =>
        p.module === moduleName &&
        p.actions?.includes(actionName),
    ),
  );
};
