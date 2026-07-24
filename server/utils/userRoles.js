import mongoose from "mongoose";
import Role from "../models/role.model.js";
import { getJson, setJson } from "./redisClient.js";

const { Types } = mongoose;

// ── Base role constants ───────────────────────────────────────────────────────
export const BASE_ROLES = ["student", "instructor", "admin", "staff"];
const BASE_ROLE_SET = new Set(BASE_ROLES);

export const isBaseRole = (role) =>
  typeof role === "string" && BASE_ROLE_SET.has(role);

// ── Single-role helpers ───────────────────────────────────────────────────────
// user.role is now a plain string. All helpers accept either shape so the
// transition is safe during the migration window.

export const hasBaseRole = (user, roleName) => {
  if (!user || !roleName) return false;
  const name = roleName.toLowerCase();

  // New shape: user.role is a string
  if (typeof user.role === "string") {
    return user.role.toLowerCase() === name;
  }

  // Legacy shape (pre-migration documents still in cache): user.roles array
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
// assignedRoles is an array of Role ObjectIds (or populated Role documents).
// These carry a permissions matrix and are separate from the base role.

const toPlainUser = (user) => {
  if (!user) return null;
  return typeof user.toObject === "function" ? user.toObject() : { ...user };
};

/**
 * Populate assignedRoles ObjectIds into full Role documents and attach them
 * back onto the plain user object as `assignedRoles`. Returns the plain user.
 *
 * The returned object shape is:
 *   { ...userFields, role: "student"|"instructor"|"admin"|"staff",
 *     assignedRoles: [ { _id, name, permissions, ... }, ... ] }
 */
export const hydrateUserRoles = async (user) => {
  const plainUser = toPlainUser(user);
  if (!plainUser) return null;

  // Support legacy documents that still have the old roles[] array in cache.
  // Promote the first base-role string found into user.role so the rest of
  // the app sees a consistent shape after hydration.
  if (!plainUser.role && Array.isArray(plainUser.roles)) {
    const firstBase = plainUser.roles.find(isBaseRole);
    plainUser.role = firstBase || "student";
  }

  try {
    const rawAssigned = plainUser.assignedRoles || [];

    // Extract ObjectId strings — skip anything already a populated object
    const idsToFetch = [];
    const alreadyPopulated = [];

    for (const entry of rawAssigned) {
      if (entry && typeof entry === "object" && entry._id) {
        alreadyPopulated.push(entry);
      } else {
        const idStr = entry instanceof Types.ObjectId
          ? entry.toString()
          : typeof entry === "string" && Types.ObjectId.isValid(entry)
            ? entry
            : null;
        if (idStr) idsToFetch.push(idStr);
      }
    }

    const fetchedRoles = [...alreadyPopulated];

    if (idsToFetch.length > 0) {
      const toQuery = [];
      for (const id of idsToFetch) {
        const cached = await getJson(`role:${id}`);
        if (cached) {
          fetchedRoles.push(cached);
        } else {
          toQuery.push(id);
        }
      }

      if (toQuery.length > 0) {
        const docs = await Role.find({ _id: { $in: toQuery } }).lean();
        for (const doc of docs) {
          await setJson(`role:${doc._id.toString()}`, doc, 3600 * 24);
          fetchedRoles.push(doc);
        }
      }
    }

    plainUser.assignedRoles = fetchedRoles;
  } catch (error) {
    console.error("[Roles] hydrateUserRoles failed:", error);
    plainUser.assignedRoles = [];
  }

  // Never expose the password or the legacy roles array downstream
  delete plainUser.roles;
  delete plainUser.password;
  return plainUser;
};

export const hydrateUsersRoles = async (users = []) =>
  Promise.all(users.map((user) => hydrateUserRoles(user)));

// ── Permission grant check ────────────────────────────────────────────────────
// Admins have every permission implicitly.
// All other users need an explicit permission entry in one of their
// assignedRoles documents.
export const hasPermissionGrant = (user, moduleName, actionName = "view") => {
  if (hasBaseRole(user, "admin")) return true;

  const assigned = user?.assignedRoles || [];
  return Boolean(
    assigned.some(
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
