import Role, { PERMISSION_MODULES } from "../models/role.model.js";
import User from "../models/user.model.js";
import { hydrateUserRoles } from "../utils/userRoles.js";
import { deleteKey, deleteKeys } from "../utils/redisClient.js";

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

// ── Create role ───────────────────────────────────────────────────────────────
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

    // Invalidate per-role cache so hydrateUserRoles picks up the new permissions
    await deleteKeys([`role:${role._id.toString()}`]);

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

    // Remove this custom role from every user's assignedRoles array.
    // (user.role — the base role string — is unaffected.)
    await User.updateMany(
      { assignedRoles: role._id },
      { $pull: { assignedRoles: role._id } },
    );

    await role.deleteOne();

    // Invalidate the role cache entry
    await deleteKeys([`role:${role._id.toString()}`]);

    res.json({ message: "Role deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Set role + assigned permission-roles for a user ───────────────────────────
// Body: { role: "student"|"instructor"|"admin"|"staff",
//         assignedRoleIds: ["<ObjectId>", ...] }
//
// `role` sets the user's single base role.
// `assignedRoleIds` replaces the user's custom permission roles (staff panel).
// Admins cannot be demoted through this endpoint — only a super-admin can
// change an admin's base role directly.
export const setUserRoles = async (req, res) => {
  try {
    const { role, assignedRoleIds = [] } = req.body;

    const ALLOWED_BASE_ROLES = ["student", "instructor", "staff"];

    if (role !== undefined && !ALLOWED_BASE_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed values: ${ALLOWED_BASE_ROLES.join(", ")}`,
      });
    }

    if (!Array.isArray(assignedRoleIds)) {
      return res.status(400).json({ message: "assignedRoleIds must be an array" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate all provided custom role IDs exist
    if (assignedRoleIds.length > 0) {
      const validRoles = await Role.find({ _id: { $in: assignedRoleIds } });
      if (validRoles.length !== assignedRoleIds.length) {
        return res
          .status(400)
          .json({ message: "One or more assignedRoleIds are invalid" });
      }
    }

    // Update base role if provided
    if (role !== undefined) {
      user.role = role;
    }

    // Replace custom permission roles
    user.assignedRoles = assignedRoleIds;

    await user.save();

    // Bust the user's Redis cache so the next protect() call re-hydrates fresh
    await deleteKey(`user:${user._id.toString()}`);

    res.json(await hydrateUserRoles(user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
