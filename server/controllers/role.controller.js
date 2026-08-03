import mongoose from "mongoose";
import Role, { PERMISSION_MODULES, DASHBOARD_MODULES } from "../models/role.model.js";
import User from "../models/user.model.js";
import { hydrateUserRoles, isBaseRole, isRoleObjectId } from "../utils/userRoles.js";
import { deleteKey, deleteKeys } from "../utils/redisClient.js";
import { userLRU } from "../utils/lruCache.js";

const { Types } = mongoose;

export const getPermissionModules = async (req, res) => {
  res.json({ modules: PERMISSION_MODULES });
};

// NEW — mirrors getPermissionModules, feeds the "Dashboard Modules" tab
export const getDashboardModules = async (req, res) => {
  res.json({ modules: DASHBOARD_MODULES });
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ isSystem: -1, name: 1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description, permissions, dashboardModules } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "A role with this name already exists" });
    }

    const role = await Role.create({
      name: name.trim(),
      description: description?.trim() || "",
      permissions: permissions || [],
      ...(Array.isArray(dashboardModules) && dashboardModules.length > 0
        ? { dashboardModules }
        : {}),
    });

    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const { name, description, permissions, dashboardModules } = req.body;

    if (role.isSystem && name && name.trim() !== role.name) {
      return res.status(400).json({ message: "Can't rename a system role" });
    }

    if (name?.trim()) role.name = name.trim();
    if (description !== undefined) role.description = description.trim();
    if (permissions) role.permissions = permissions;
    if (dashboardModules !== undefined) {
      role.dashboardModules =
        Array.isArray(dashboardModules) && dashboardModules.length > 0
          ? dashboardModules
          : undefined;
    }

    await role.save();

    // Bust this role's own cache — both the generic key and, for a base
    // system role, the key hydrateUserRoles uses for base-role lookups.
    // getBaseRoleDoc caches with the lowercase name, so we must bust that.
    await deleteKeys([
      `role:${role._id.toString()}`,
      ...(role.isSystem ? [`role:base:${role.name.toLowerCase()}`] : []),
    ]);

    // Bust cache for every user affected. Custom roles are referenced by
    // ObjectId; base system roles (student/instructor) are referenced by
    // the plain role-name string on the user document (case-insensitive).
    const userQuery = role.isSystem
      ? { role: { $regex: new RegExp(`^${role.name}$`, "i") } }
      : { role: role._id };
    const affectedUsers = await User.find(userQuery).select("_id").lean();

    if (affectedUsers.length > 0) {
      const userCacheKeys = affectedUsers.map((u) => `user:${u._id.toString()}`);
      await deleteKeys(userCacheKeys);
      // Also bust the in-process LRU so the change takes effect on the
      // very next request without waiting for LRU TTL to expire.
      userCacheKeys.forEach((k) => userLRU.delete(k));
    }

    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (role.isSystem) {
      return res.status(400).json({ message: "System roles can't be deleted" });
    }

    await User.updateMany({ role: role._id }, { $set: { role: "student" } });
    await role.deleteOne();
    await deleteKeys([`role:${role._id.toString()}`]);

    res.json({ message: "Role deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setUserRoles = async (req, res) => {
  try {
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ message: "roleId is required" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const BASE_ROLES_ALLOWED = ["student", "instructor", "staff", "admin"];

    if (isBaseRole(roleId)) {
      if (!BASE_ROLES_ALLOWED.includes(roleId.toLowerCase())) {
        return res.status(403).json({
          message: `Cannot assign the '${roleId}' role through this endpoint`,
        });
      }
      user.role = roleId.toLowerCase();
    } else if (Types.ObjectId.isValid(roleId)) {
      const roleDoc = await Role.findById(roleId);
      if (!roleDoc) {
        return res.status(400).json({ message: "Role not found" });
      }

      const normalizedName = roleDoc.name?.toLowerCase();

      if (roleDoc.isSystem && BASE_ROLES_ALLOWED.includes(normalizedName)) {
        user.role = normalizedName;
      } else {
        user.role = new Types.ObjectId(roleId);
      }
    } else {
      return res.status(400).json({
        message: "roleId must be a base role string or a valid Role ObjectId",
      });
    }

    if (user.assignedRoles !== undefined) {
      user.assignedRoles = undefined;
    }

    await user.save();
    // Bust both Redis and the in-process LRU so the very next request from
    // this user gets a freshly hydrated role/permissions object.
    const userCacheKey = `user:${user._id.toString()}`;
    await deleteKey(userCacheKey);
    userLRU.delete(userCacheKey);

    res.json(await hydrateUserRoles(user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};