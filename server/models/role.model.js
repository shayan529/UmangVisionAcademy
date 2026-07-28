import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const PERMISSION_MODULES = {
  courses: ["view", "create", "edit", "delete", "approve"],
  users: ["view", "create", "edit", "delete"],
  payments: ["view", "refund", "export"],
  notes: ["view", "approve", "reject", "delete"],
  reels: ["view", "approve", "reject", "delete"],
  mock_tests: ["view", "create", "edit", "delete", "assign", "publish"],
  question_bank: ["view", "create", "edit", "delete", "import", "export"],
  sessions: ["view", "create", "edit", "delete", "approve"],
  ai_tutor: ["access"],
  references: ["view", "create", "edit", "delete", "approve"],
  applications: ["view", "approve", "reject"],
};

// Sidebar-visibility modules per base-role dashboard. Keys match each
// dashboard's nav item `id`/`moduleKey` so filtering is a plain `.includes()`.
export const DASHBOARD_MODULES = {
  student: [
    "overview", "my_courses", "study_notes", "question_bank", "blogs",
    "ai_tutor", "sessions", "progress", "mock_tests", "leaderboard",
    "achievements", "certificates", "plans", "become_instructor",
    "referral", "wallet", "purchase_history", "references", "settings",
  ],
  instructor: [
    "dashboard", "courses", "students", "sessions", "notes", "reels",
    "analytics", "ai", "settings", "mock-tests",
  ],
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
    // undefined = unrestricted (every module visible). Only meaningful for
    // roles whose lowercase name is a key in DASHBOARD_MODULES.
    dashboardModules: {
      type: [String],
      default: undefined,
      validate: {
        validator: function (mods) {
          const allowed = DASHBOARD_MODULES[this.name?.toLowerCase()];
          if (!allowed) return true;
          return mods.every((m) => allowed.includes(m));
        },
        message: "Invalid dashboard module for this role",
      },
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Role = model("Role", roleSchema);

export default Role;