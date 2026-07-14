import Role, { PERMISSION_MODULES } from "../models/role.model.js";
import User from "../models/user.model.js";
import {
  hydrateUserRoles,
  isBaseRole,
  mergeBaseAndCustomRoles,
} from "../utils/userRoles.js";
import { deleteKeys } from "../utils/redisClient.js";

// ── List available modules/actions (for building the UI matrix) ─────────────
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

// ── Create role ────────────────────────────────────────────────────────────────
export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res
        .status(400)
        .json({ message: "A role with this name already exists" });
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

// ── Update role ────────────────────────────────────────────────────────────────
export const updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const { name, description, permissions } = req.body;

    if (role.isSystem && name && name.trim() !== role.name) {
      return res.status(400).json({
        message: "Can't rename a system role",
      });
    }

    if (name?.trim()) role.name = name.trim();
    if (description !== undefined) role.description = description.trim();
    if (permissions) role.permissions = permissions;

    await role.save();

    // Invalidate cache
    await deleteKeys([`role:${role._id.toString()}`]);

    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── Delete role ────────────────────────────────────────────────────────────────
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (role.isSystem) {
      return res.status(400).json({ message: "System roles can't be deleted" });
    }

    // Unassign from all users first. Pulling assignedRoles also cleans up old
    // documents that haven't been touched since the storage unification.
    await User.updateMany(
      { $or: [{ roles: role._id }, { assignedRoles: role._id }] },
      { $pull: { roles: role._id, assignedRoles: role._id } },
    );

    // Autodelete users who have no roles left after the unassignment
    await User.deleteMany({
      $or: [
        { roles: [] },
        { roles: { $exists: false } },
        { roles: null }
      ]
    });

    await role.deleteOne();

    // Invalidate cache
    await deleteKeys([`role:${role._id.toString()}`]);

    res.json({ message: "Role deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Assign / unassign roles to a user ────────────────────────────────────────
export const setUserRoles = async (req, res) => {
  try {
    const { roleIds } = req.body; // array of Role ObjectIds, full replacement
    if (!Array.isArray(roleIds)) {
      return res.status(400).json({ message: "roleIds must be an array" });
    }

    const validRoles = await Role.find({ _id: { $in: roleIds } });
    if (validRoles.length !== roleIds.length) {
      return res
        .status(400)
        .json({ message: "One or more role IDs are invalid" });
    }

    const user = await User.findById(req.params.id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch all system roles representing base roles so we know what options were presented to the user
    const systemRoles = await Role.find({
      isSystem: true,
      name: { $in: ["Student", "Instructor", "Admin", "student", "instructor", "admin"] },
    });

    const systemRoleMap = {};
    for (const r of systemRoles) {
      systemRoleMap[r.name.toLowerCase()] = r._id.toString();
    }

    let baseRoles = (user.roles || []).filter(isBaseRole);

    // Update baseRoles according to selection/deselection of corresponding system roles
    for (const roleName of ["student", "instructor", "admin"]) {
      const roleIdStr = systemRoleMap[roleName];
      if (roleIdStr) {
        const isSelected = roleIds.includes(roleIdStr);
        if (isSelected) {
          if (!baseRoles.includes(roleName)) {
            baseRoles.push(roleName);
          }
        } else {
          baseRoles = baseRoles.filter((r) => r !== roleName);
        }
      }
    }

    const trueCustomRoleIds = [];
    for (const role of validRoles) {
      const normalizedName = role.name?.toLowerCase();
      const isSystemBase = role.isSystem && ["student", "instructor", "admin"].includes(normalizedName);
      if (!isSystemBase) {
        trueCustomRoleIds.push(role._id.toString());
      }
    }

    user.roles = mergeBaseAndCustomRoles(baseRoles, trueCustomRoleIds);

    if (user.roles.length === 0) {
      await User.findByIdAndDelete(user._id);
      return res.json({
        success: true,
        message: "User autodeleted because no roles were assigned",
        deleted: true,
      });
    }

    await user.save();
    await User.collection.updateOne(
      { _id: user._id },
      { $unset: { assignedRoles: "" } },
    );

    res.json(await hydrateUserRoles(user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
