import Role, { PERMISSION_MODULES } from "../models/role.model.js";
import User from "../models/user.model.js";

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

    // Unassign from all users first
    await User.updateMany(
      { assignedRoles: role._id },
      { $pull: { assignedRoles: role._id } },
    );

    await role.deleteOne();
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

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { assignedRoles: roleIds },
      { new: true },
    )
      .select("-password")
      .populate("assignedRoles");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
