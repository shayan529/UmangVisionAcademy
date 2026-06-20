import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Single source of truth for what can be granted. Keep this in sync with
// PERMISSION_MODULES on the frontend (RoleManager.jsx).
export const PERMISSION_MODULES = {
  courses: ["view", "create", "edit", "delete", "approve"],
  users: ["view", "create", "edit", "delete", "impersonate"],
  payments: ["view", "refund", "export"],
  moderation: ["view", "flag", "remove", "ban"],
};

const permissionSchema = new Schema(
  {
    module: {
      type: String,
      required: true,
      enum: Object.keys(PERMISSION_MODULES),
    },
    actions: {
      type: [String],
      default: [],
      validate: {
        validator: function (actions) {
          const allowed = PERMISSION_MODULES[this.module] || [];
          return actions.every((a) => allowed.includes(a));
        },
        message: "Invalid action for this module",
      },
    },
  },
  { _id: false },
);

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    permissions: {
      type: [permissionSchema],
      default: [],
    },
    // System roles (Admin / Instructor / Student baseline) can't be deleted,
    // and their name can't be changed, to avoid breaking authorizeRoles() checks.
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Role = model("Role", roleSchema);

export default Role;
