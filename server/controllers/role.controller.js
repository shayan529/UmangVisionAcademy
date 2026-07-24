import mongoose from "mongoose";
import Role, { PERMISSION_MODULES } from "../models/role.model.js";
import User from "../models/user.model.js";
import { hydrateUserRoles, isBaseRole, isRoleObjectId } from "../utils/userRoles.js";
import { deleteKey, deleteKeys } from "../utils/redisClient.js";

const { Types } = mongoose;

// ── List permission modules ───────────────────────────────────────────────────
export const getPermissionModules = async (req, res) => {
  res.json({ modules: PERMISSION_MODULES });
};

// ── List all roles ────────────────────────────────────────────────────────────
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ isSystem: -1, name: 1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Create role ───────────────────────────────────────────────────────────────
export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
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
    });

    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── Update role ───────────────────────────────────────────────────────────────
export const updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const { name, description, permissions } = req.body;

    if (role.isSystem && name && name.trim() !== role.name) {
      return res.status(400).json({ message: "Can't rename a system role" });
    }

    if (name?.trim()) role.name = name.trim();
    if (description !== undefined) role.description = description.trim();
    if (permissions) role.permissions = permissions;

    await role.save();

    // Invalidate the role cache so hydrateUserRoles picks up new permissions
    await deleteKeys([`role:${role._id.toString()}`]);

    // Also bust cache for every user holding this role so their next
    // request re-hydrates with the updated permissions.
    const affectedUsers = await User.find({
      role: role._id,
    }).select("_id").lean();

    if (affectedUsers.length > 0) {
      await deleteKeys(affectedUsers.map((u) => `user:${u._id.toString()}`));
    }

    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── Delete role ───────────────────────────────────────────────────────────────
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (role.isSystem) {
      return res.status(400).json({ message: "System roles can't be deleted" });
    }

    // Demote every user holding this custom role back to "student"
    await User.updateMany({ role: role._id }, { $set: { role: "student" } });

    await role.deleteOne();

    await deleteKeys([`role:${role._id.toString()}`]);

    res.json({ message: "Role deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Assign a role to a user ───────────────────────────────────────────────────
// Body: { roleId: "<ObjectId or base-role-string>" }
//
// If roleId is a base-role string ("student" | "instructor" | "staff") the
// user's role field is set to that string.
// If roleId is a valid ObjectId it must reference an existing Role document;
// the user's role field is set to that ObjectId.
export const setUserRoles = async (req, res) => {
  try {
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ message: "roleId is required" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const BASE_ROLES_ALLOWED = ["student", "instructor", "staff"];

    if (isBaseRole(roleId)) {
      // Base-role string sent directly
      if (!BASE_ROLES_ALLOWED.includes(roleId.toLowerCase())) {
        return res.status(403).json({
          message: `Cannot assign the '${roleId}' role through this endpoint`,
        });
      }
      user.role = roleId.toLowerCase();
    } else if (Types.ObjectId.isValid(roleId)) {
      // Could be a system role ObjectId or a custom role ObjectId
      const roleDoc = await Role.findById(roleId);
      if (!roleDoc) {
        return res.status(400).json({ message: "Role not found" });
      }

      const normalizedName = roleDoc.name?.toLowerCase();

      if (roleDoc.isSystem && BASE_ROLES_ALLOWED.includes(normalizedName)) {
        // System role document selected → store as base-role string
        user.role = normalizedName;
      } else if (roleDoc.isSystem && normalizedName === "admin") {
        return res.status(403).json({
          message: "Cannot assign the admin role through this endpoint",
        });
      } else {
        // Custom role → store ObjectId
        user.role = new Types.ObjectId(roleId);
      }
    } else {
      return res.status(400).json({
        message: "roleId must be a base role string or a valid Role ObjectId",
      });
    }

    // Clear legacy assignedRoles if present
    if (user.assignedRoles !== undefined) {
      user.assignedRoles = undefined;
    }

    await user.save();

    // Bust Redis cache so protect() re-hydrates on next request
    await deleteKey(`user:${user._id.toString()}`);

    res.json(await hydrateUserRoles(user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
