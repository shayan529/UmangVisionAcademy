import { useEffect, useState, useCallback, useRef, useMemo } from "react";

import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  Users as UsersIcon,
  Lock,
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  Mail,
  Phone,
  LayoutGrid,
} from "lucide-react";
import apiClient from "../../config/api";
import {
  getCustomRole,
  hasBaseRole,
  isBaseRole,
} from "../../utils/permissions";
import { INDIA_CITIES_BY_STATE, INDIA_STATES } from "../../data/indiaLocations";

const API_BASE = "/admin/roles";
const USERS_API = "/users/admin-create";

// ── Helpers ───────────────────────────────────────────────────────────────────

const isSystemRoleName = (roleName) =>
  typeof roleName === "string" &&
  ["student", "instructor", "admin", "staff"].includes(roleName.toLowerCase());

// Returns the effective role ID string for a user regardless of whether
// their role is a custom Role object or a raw ObjectId string.
const getUserRoleId = (user) => {
  const role = user?.role;
  if (!role) return null;
  if (typeof role === "object" && role._id) return role._id.toString();
  if (typeof role === "string" && role.length === 24 && !isSystemRoleName(role))
    return role;
  return null;
};

const getUserRoleName = (user) => {
  const role = user?.role;
  if (!role) return null;
  if (typeof role === "string") return role.toLowerCase();
  if (typeof role === "object" && role.name) return role.name.toLowerCase();
  return null;
};

const MODULE_LABELS = {
  courses: "Courses",
  users: "Users",
  payments: "Payments",
  notes: "Notes Moderation",
  reels: "Reels Moderation",
  mock_tests: "Mock Tests",
  question_bank: "Question Bank",
  sessions: "Sessions",
  ai_tutor: "AI Tutor",
  references: "References",
  applications: "Applications",
  bulk_import: "Bulk Import",
  devices: "Logged In Devices",
};

const ACTION_LABELS = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  approve: "Approve",
  reject: "Reject",
  refund: "Refund",
  export: "Export",
  remove: "Remove",
  // mock_tests
  assign: "Assign",
  publish: "Publish",
  // question_bank
  import: "Import",
  // ai_tutor
  access: "Access",
  // devices
  revoke: "Revoke",
};

const EMPTY_ROLE = { name: "", description: "", permissions: [] };

const INDIAN_CITIES_BY_STATE = INDIA_CITIES_BY_STATE;
const INDIAN_STATES = INDIA_STATES;

const normalizeIndianPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, "");
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  if (/^91\d{10}$/.test(digits)) return `+${digits}`;
  return value.trim();
};

const api = async (url, options = {}) => {
  const { method = "GET", body, ...config } = options;
  const { data } = await apiClient.request({
    url,
    method,
    data: body ? JSON.parse(body) : undefined,
    ...config,
  });
  return data;
};

// ── Permission matrix ─────────────────────────────────────────────────────────
const PermissionMatrix = ({ modules, value, onChange }) => {
  const getActions = (mod) =>
    value.find((p) => p.module === mod)?.actions || [];

  const toggleAction = (mod, action) => {
    const current = getActions(mod);
    const has = current.includes(action);
    const nextActions = has
      ? current.filter((a) => a !== action)
      : [...current, action];

    const others = value.filter((p) => p.module !== mod);
    onChange(
      nextActions.length > 0
        ? [...others, { module: mod, actions: nextActions }]
        : others,
    );
  };

  const toggleAll = (mod, allActions) => {
    const current = getActions(mod);
    const isAllOn = allActions.every((a) => current.includes(a));
    const others = value.filter((p) => p.module !== mod);
    onChange(
      isAllOn ? others : [...others, { module: mod, actions: allActions }],
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(modules).map(([mod, actions]) => {
        const current = getActions(mod);
        const allOn = actions.every((a) => current.includes(a));
        return (
          <div
            key={mod}
            className="rounded-xl border border-slate-800 bg-[#0b1120] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                {MODULE_LABELS[mod] || mod}
              </span>
              <button
                type="button"
                onClick={() => toggleAll(mod, actions)}
                className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
              >
                {allOn ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => {
                const checked = current.includes(action);
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => toggleAction(mod, action)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold border transition-colors ${checked
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}
                  >
                    {checked && <Check size={11} />}
                    {ACTION_LABELS[action] || action}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Helper to format permission summary for role cards
const formatPermissionSummary = (role) => {
  if (role.isSystem) return "System Default Role";
  if (!role.permissions || role.permissions.length === 0)
    return "No custom permissions assigned";
  const moduleNames = role.permissions
    .map((p) => MODULE_LABELS[p.module] || p.module)
    .filter(Boolean);
  if (moduleNames.length === 0) return "No permissions assigned";
  if (moduleNames.length <= 2) return moduleNames.join(", ");
  return `${moduleNames.slice(0, 2).join(", ")} +${moduleNames.length - 2} more`;
};

const DASHBOARD_MODULE_LABELS = {
  // Staff & Admin Dashboard
  overview: "Overview",
  courses: "Courses",
  students: "Students",
  instructors: "Instructors",
  payments: "Payments",
  applications: "Applications",
  notes: "Notes Moderation",
  reels: "Reels Moderation",
  mock_tests: "Mock Tests",
  question_bank: "Question Bank",
  sessions: "Sessions",
  ai_tutor: "AI Tutor",
  references: "References",
  roles: "Roles & Permissions",
  "bulk_import": "Bulk Import",
  devices: "Logged In Devices",

  // Student Dashboard
  my_courses: "My Courses",
  study_notes: "Study Notes",
  blogs: "Blogs",
  progress: "Progress",
  leaderboard: "Leaderboard",
  achievements: "Achievements",
  certificates: "Certificates",
  plans: "Plans",
  become_instructor: "Become Instructor",
  referral: "Referral",
  wallet: "Wallet",
  purchase_history: "Purchase History",
  settings: "Settings",

  // Instructor Dashboard
  dashboard: "Dashboard",
  analytics: "Analytics",
  ai: "AI Assistant",
  "mock-tests": "Mock Tests (Instructor)",
};

// ── SIDEBAR_TO_PERMISSION maps a dashboard module key → permission module key.
// Keys not listed here have no backend permission model (view-only toggle).
const SIDEBAR_TO_PERMISSION = {
  courses: "courses",
  students: "users",
  instructors: "users",
  payments: "payments",
  applications: "applications",
  notes: "notes",
  reels: "reels",
  mock_tests: "mock_tests",
  question_bank: "question_bank",
  sessions: "sessions",
  ai_tutor: "ai_tutor",
  references: "references",
  roles: "users",       // Roles & Permissions page is gated on users permission
  bulk_import: "bulk_import",
  devices: "devices",
  // Student workspace
  my_courses: "courses",
  study_notes: "notes",
  // Instructor workspace
  "mock-tests": "mock_tests",
};

/**
 * ModulePermissionEditor — unified sidebar-module + permissions editor.
 *
 * Props:
 *   dashboardModuleRegistry  – { staff: [...], student: [...], instructor: [...] }
 *   permissionModules        – { notes: ["view","approve",...], ... }
 *   roleName                 – string, used to pick the right workspace tab
 *   dashboardModules         – string[]  (currently enabled module keys)
 *   permissions              – [{ module, actions }]  (current permissions)
 *   onDashboardModulesChange – (string[]) => void
 *   onPermissionsChange      – ([{ module, actions }]) => void
 */
const ModulePermissionEditor = ({
  dashboardModuleRegistry = {},
  permissionModules = {},
  roleName = "",
  dashboardModules = [],
  permissions = [],
  onDashboardModulesChange,
  onPermissionsChange,
}) => {
  const [activeTab, setActiveTab] = useState("staff");

  const lowerName = roleName.toLowerCase();
  const isSystemStudent = lowerName === "student";
  const isSystemInstructor = lowerName === "instructor";

  // ── helpers ──────────────────────────────────────────────────────────────

  const isModuleEnabled = (key) => dashboardModules.includes(key);

  const getActions = (permModule) =>
    permissions.find((p) => p.module === permModule)?.actions ?? [];

  const setActions = (permModule, actions) => {
    const others = permissions.filter((p) => p.module !== permModule);
    onPermissionsChange(
      actions.length > 0 ? [...others, { module: permModule, actions }] : others,
    );
  };

  // Toggle a sidebar module on/off.
  // Enabling also grants "view" (if that perm exists). Disabling clears perms.
  const toggleModule = (key) => {
    const enabled = isModuleEnabled(key);
    const permKey = SIDEBAR_TO_PERMISSION[key];

    if (enabled) {
      // Disable: remove from dashboardModules AND clear its permissions
      onDashboardModulesChange(dashboardModules.filter((k) => k !== key));
      if (permKey) setActions(permKey, []);
    } else {
      // Enable: add to dashboardModules AND auto-grant "view" if available
      onDashboardModulesChange([...dashboardModules, key]);
      if (permKey && permissionModules[permKey]?.includes("view")) {
        const current = getActions(permKey);
        if (!current.includes("view")) setActions(permKey, [...current, "view"]);
      }
    }
  };

  const toggleAction = (permKey, action) => {
    const current = getActions(permKey);
    setActions(
      permKey,
      current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action],
    );
  };

  const toggleAllActions = (permKey, allActions) => {
    const current = getActions(permKey);
    const allOn = allActions.every((a) => current.includes(a));
    setActions(permKey, allOn ? [] : allActions);
  };

  // ── build workspace categories ────────────────────────────────────────────

  let categories = [];
  if (isSystemStudent && dashboardModuleRegistry.student) {
    categories = [{ id: "student", title: "Student Dashboard", keys: dashboardModuleRegistry.student }];
  } else if (isSystemInstructor && dashboardModuleRegistry.instructor) {
    categories = [{ id: "instructor", title: "Instructor Dashboard", keys: dashboardModuleRegistry.instructor }];
  } else {
    const allCats = [
      dashboardModuleRegistry.staff && { id: "staff", title: "Staff & Admin Dashboard", keys: dashboardModuleRegistry.staff },
      dashboardModuleRegistry.student && { id: "student", title: "Student Dashboard", keys: dashboardModuleRegistry.student },
      dashboardModuleRegistry.instructor && { id: "instructor", title: "Instructor Dashboard", keys: dashboardModuleRegistry.instructor },
    ].filter(Boolean);

    categories = activeTab === "all" ? allCats : (allCats.filter((c) => c.id === activeTab) || allCats);
    if (categories.length === 0) categories = allCats;
  }

  const showTabs = !isSystemStudent && !isSystemInstructor;
  const allKeys = Array.from(new Set(categories.flatMap((c) => c.keys)));
  const allEnabled = allKeys.length > 0 && allKeys.every((k) => isModuleEnabled(k));

  const toggleAllModules = () => {
    if (allEnabled) {
      // Disable all: remove keys + clear their permissions
      onDashboardModulesChange(dashboardModules.filter((k) => !allKeys.includes(k)));
      const permKeysToRemove = new Set(allKeys.map((k) => SIDEBAR_TO_PERMISSION[k]).filter(Boolean));
      onPermissionsChange(permissions.filter((p) => !permKeysToRemove.has(p.module)));
    } else {
      // Enable all: add keys + auto-grant view on each
      const next = Array.from(new Set([...dashboardModules, ...allKeys]));
      onDashboardModulesChange(next);
      const updated = [...permissions];
      for (const key of allKeys) {
        const permKey = SIDEBAR_TO_PERMISSION[key];
        if (!permKey || !permissionModules[permKey]?.includes("view")) continue;
        const existing = updated.find((p) => p.module === permKey);
        if (existing) {
          if (!existing.actions.includes("view")) existing.actions = [...existing.actions, "view"];
        } else {
          updated.push({ module: permKey, actions: ["view"] });
        }
      }
      onPermissionsChange(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Workspace tabs */}
      {showTabs && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1 gap-1 flex-wrap">
            {[
              { id: "staff", label: "Staff & Admin" },
              { id: "student", label: "Student" },
              { id: "instructor", label: "Instructor" },
              { id: "all", label: "All" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${
                  activeTab === t.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleAllModules}
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
          >
            {allEnabled ? "Disable All" : "Enable All"}
          </button>
        </div>
      )}

      {/* Module cards */}
      {categories.map((cat) => (
        <div key={cat.id} className="space-y-2">
          {showTabs && categories.length > 1 && (
            <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider pt-1">
              {cat.title}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {cat.keys.map((key) => {
              const enabled = isModuleEnabled(key);
              const permKey = SIDEBAR_TO_PERMISSION[key];
              const availableActions = permKey ? (permissionModules[permKey] ?? []) : [];
              const currentActions = permKey ? getActions(permKey) : [];

              return (
                <div
                  key={`${cat.id}-${key}`}
                  className={`rounded-xl border transition-colors ${
                    enabled
                      ? "border-indigo-500/40 bg-indigo-950/20"
                      : "border-slate-800 bg-[#0b1120]"
                  }`}
                >
                  {/* Module header row */}
                  <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Toggle switch */}
                      <button
                        type="button"
                        onClick={() => toggleModule(key)}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors ${
                          enabled
                            ? "border-indigo-500 bg-indigo-600"
                            : "border-slate-600 bg-slate-800"
                        }`}
                        aria-checked={enabled}
                        role="switch"
                      >
                        <span
                          className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                            enabled ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-bold truncate ${enabled ? "text-white" : "text-slate-400"}`}>
                        {DASHBOARD_MODULE_LABELS[key] ?? key.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </div>
                    {/* Action count badge */}
                    {enabled && availableActions.length > 0 && (
                      <span className="shrink-0 text-[10px] font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded-full">
                        {currentActions.length}/{availableActions.length} actions
                      </span>
                    )}
                  </div>

                  {/* Permission actions — only shown when module is enabled and has permissions */}
                  {enabled && availableActions.length > 0 && (
                    <div className="px-4 pb-3 pt-0 border-t border-slate-800/60">
                      <div className="flex items-center justify-between mb-2 mt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Permissions
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleAllActions(permKey, availableActions)}
                          className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          {availableActions.every((a) => currentActions.includes(a)) ? "Clear all" : "Select all"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableActions.map((action) => {
                          const active = currentActions.includes(action);
                          const isViewAction = action === "view";
                          return (
                            <button
                              key={action}
                              type="button"
                              onClick={() => toggleAction(permKey, action)}
                              title={isViewAction ? "View is required for sidebar access" : undefined}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                                active
                                  ? "bg-indigo-600 border-indigo-500 text-white"
                                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                              } ${isViewAction ? "opacity-80" : ""}`}
                            >
                              {active && <Check size={10} />}
                              {ACTION_LABELS[action] ?? action}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {categories.length === 0 && (
        <p className="text-[11px] text-slate-500">No sidebar modules available.</p>
      )}
    </div>
  );
};

// ── Role create/edit modal (used for EDITING existing roles) ─────────────────
// dashboardModuleKeys: string[] of all module keys for this role (e.g. student/instructor)
// When present, a Dashboard Modules section is shown inside this same modal.
const RoleModal = ({
  modules,
  dashboardModuleRegistry = {},
  dashboardModuleKeys = [],
  initial,
  onClose,
  onSaved,
  showToast,
}) => {
  const [form, setForm] = useState({
    ...(initial || EMPTY_ROLE),
    dashboardModules: initial?.dashboardModules ?? [],
  });
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?._id);
  const isSystem = Boolean(initial?.isSystem);

  const handleSave = async () => {
    if (!form.name.trim() && !form.description.trim()) {
      showToast?.("Role name and description are required.");
      return;
    }
    if (!form.name.trim()) {
      showToast?.("Role name is required.");
      return;
    }
    if (!form.description.trim()) {
      showToast?.("Role description is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        permissions: form.permissions,
        dashboardModules: form.dashboardModules,
      };
      if (isEdit) {
        await api(`${API_BASE}/${initial._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast?.("Role updated.");
      } else {
        await api(API_BASE, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast?.("Role created.");
      }
      onSaved();
    } catch (err) {
      showToast?.(err.message || "Failed to save role.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">
            {isEdit ? "Edit Role" : "Create Role"}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Role Name {isSystem && "(locked)"}
              </label>
              <input
                value={form.name}
                disabled={isSystem}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Content Reviewer"
                className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                autoFocus={!isEdit}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Description
              </label>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="What this role is for"
                className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* ── Unified Module + Permissions editor ── */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2 block">
              Sidebar Modules &amp; Permissions
            </label>
            <ModulePermissionEditor
              dashboardModuleRegistry={dashboardModuleRegistry}
              permissionModules={modules}
              roleName={form.name}
              dashboardModules={form.dashboardModules}
              permissions={form.permissions}
              onDashboardModulesChange={(dashboardModules) =>
                setForm((f) => ({ ...f, dashboardModules }))
              }
              onPermissionsChange={(permissions) =>
                setForm((f) => ({ ...f, permissions }))
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Assign roles modal ────────────────────────────────────────────────────────
const AssignRolesModal = ({
  user,
  roles = [],
  onClose,
  onSaved,
  showToast,
}) => {
  const BASE_ROLE_VALUES = ["student", "instructor", "staff", "admin"];

  const systemRoles = roles.filter(
    (r) => r.isSystem && BASE_ROLE_VALUES.includes(r.name?.toLowerCase()),
  );
  const customRoles = roles.filter(
    (r) => !(r.isSystem && BASE_ROLE_VALUES.includes(r.name?.toLowerCase())),
  );
  const allRoles = [...systemRoles, ...customRoles];

  // Pre-select the user's current role:
  // – If role is a populated object  → match by _id
  // – If role is an ObjectId string  → match by that string
  // – If role is a base-role string  → find the matching system Role document
  const getDefaultSelected = () => {
    const existingId = getUserRoleId(user); // ObjectId string or null
    if (existingId) {
      const match = allRoles.find((r) => r._id?.toString() === existingId);
      if (match) return match._id?.toString();
    }

    // Base-role string — find the system role document
    const userRoleName = getUserRoleName(user) || "student";
    const sysMatch = allRoles.find(
      (r) =>
        r.isSystem &&
        BASE_ROLE_VALUES.includes(r.name?.toLowerCase()) &&
        r.name?.toLowerCase() === userRoleName,
    );
    if (sysMatch) return sysMatch._id?.toString();

    // Final fallback — Student system role
    return (
      allRoles
        .find((r) => r.isSystem && r.name?.toLowerCase() === "student")
        ?._id?.toString() ?? null
    );
  };

  const [selectedRoleId, setSelectedRoleId] = useState(getDefaultSelected);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedRoleId) {
      showToast?.("Please select a role.");
      return;
    }
    setSaving(true);
    try {
      await api(`${API_BASE}/assign/${user._id}`, {
        method: "PUT",
        // Single field: roleId is either a base-role string (from system role
        // name) or a custom Role ObjectId string.
        body: JSON.stringify({ roleId: selectedRoleId }),
      });
      showToast?.(`Role updated for ${user.name}.`);
      onSaved();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || err.message || "Failed to assign role.",
      );
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Assign Role
              </h3>
              <p className="text-xs text-slate-400">
                Set the user's role — select exactly one
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Details Banner */}
        <div className="mb-5 rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3.5 flex items-center gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-sm font-extrabold text-white shadow-md">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-bold text-white truncate block">
              {user.name}
            </span>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              {user.email && (
                <span className="flex items-center gap-1">
                  <Mail size={12} />
                  {user.email}
                </span>
              )}
              {user.phoneNumber && (
                <span className="flex items-center gap-1">
                  <Phone size={12} />
                  {user.phoneNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Unified role list (radio) ── */}
        <div className="flex flex-col gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {allRoles.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6">
              No roles available.
            </p>
          )}
          {allRoles.map((role) => {
            const active = selectedRoleId?.toString() === role._id?.toString();
            const permSummary = formatPermissionSummary(role);
            return (
              <button
                key={role._id}
                type="button"
                onClick={() => setSelectedRoleId(role._id)}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all ${active
                  ? "border-indigo-500/80 bg-indigo-950/40 shadow-md shadow-indigo-950/50"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/80"
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-bold tracking-wide ${active ? "text-white" : "text-slate-300"
                        }`}
                    >
                      {role.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${role.isSystem
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                        }`}
                    >
                      {role.isSystem ? "System" : "Custom"}
                    </span>
                  </div>
                  {role.description && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {role.description}
                    </p>
                  )}
                  {permSummary && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <Shield size={12} className="text-indigo-400 flex-none" />
                      <span className="truncate">{permSummary}</span>
                    </div>
                  )}
                </div>
                {/* Radio circle */}
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${active
                    ? "border-indigo-400 bg-indigo-500"
                    : "border-slate-600 bg-slate-950"
                    }`}
                >
                  {active && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Add user modal ────────────────────────────────────────────────────────────
const AddUserModal = ({ onClose, onSaved, showToast }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    city: "",
    state: "",
    pincode: "",
    baseRole: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d+\s-]/g, "");
    setForm((f) => ({ ...f, phoneNumber: value }));
  };

  const handleStateChange = (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, state: value, city: "" }));
  };

  const cityOptions = INDIAN_CITIES_BY_STATE[form.state] || [];

  const handleSave = async () => {
    setError("");
    const normalizedPhoneNumber = normalizeIndianPhoneNumber(form.phoneNumber);
    if (
      !form.name.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim() ||
      !normalizedPhoneNumber ||
      !form.password.trim()
    ) {
      const message =
        "Name, city, state, pincode, phone, and password are required.";
      setError(message);
      showToast?.(message);
      return;
    }
    setSaving(true);
    try {
      await api(USERS_API, {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phoneNumber: normalizedPhoneNumber,
          password: form.password,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          role: form.baseRole,
        }),
      });
      showToast?.(`${form.name} added.`);
      onSaved();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to add user.";
      setError(message);
      showToast?.(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-950/90 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Add New User
              </h3>
              <p className="text-xs text-slate-400">
                Create a user profile & assign roles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-3.5 text-xs font-semibold text-red-200">
              {error}
            </div>
          )}

          {/* Section: Personal Info */}
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">
              Personal Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-300">
                  Full Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="e.g. Jane Doe"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="jane@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Phone Number <span className="text-indigo-400">*</span>
                </label>
                <input
                  value={form.phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={16}
                  placeholder="9876543210 or +91..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-300">
                  Password <span className="text-indigo-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange("password")}
                    placeholder="Enter account password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Location */}
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">
              Location Details
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">
                  State <span className="text-indigo-400">*</span>
                </label>
                <select
                  value={form.state}
                  onChange={handleStateChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  <option value="" disabled>
                    Select state…
                  </option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">
                  City <span className="text-indigo-400">*</span>
                </label>
                <select
                  value={form.city}
                  onChange={handleChange("city")}
                  disabled={!form.state}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
                >
                  <option value="" disabled>
                    {form.state ? "Select city…" : "Select state first"}
                  </option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Pincode <span className="text-indigo-400">*</span>
                </label>
                <input
                  value={form.pincode}
                  onChange={handleChange("pincode")}
                  placeholder="e.g. 110001"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: Role (single radio select) */}
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">
              Role
            </span>
            <div className="flex flex-col gap-2">
              {["student", "instructor", "staff"].map((roleValue) => {
                const active = form.baseRole === roleValue;
                return (
                  <button
                    key={roleValue}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, baseRole: roleValue }))
                    }
                    className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left transition-all ${active
                      ? "border-indigo-500/80 bg-indigo-950/40 text-white shadow-md shadow-indigo-950/50"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-white"
                      }`}
                  >
                    <span className="text-sm font-bold capitalize">
                      {roleValue}
                    </span>
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${active
                        ? "border-indigo-400 bg-indigo-500"
                        : "border-slate-600 bg-slate-950"
                        }`}
                    >
                      {active && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 px-6 py-4 bg-slate-950/90 backdrop-blur shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <UserPlus size={15} />
            )}
            Add User
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────
const RoleManager = ({ showToast, currentUser }) => {
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const [tab, setTab] = useState("roles");
  const [modules, setModules] = useState({});
  const [dashboardModuleRegistry, setDashboardModuleRegistry] = useState({});
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roleModal, setRoleModal] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    name: "",
    description: "",
    permissions: [],
    dashboardModules: [],
  });

  const allDashboardModuleKeys = useMemo(() => {
    const keys = new Set();
    Object.values(dashboardModuleRegistry).forEach((arr) => {
      if (Array.isArray(arr)) arr.forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  }, [dashboardModuleRegistry]);

  const getModuleKeysForRole = useCallback(
    (roleName) => {
      if (!roleName) return dashboardModuleRegistry.staff || [];
      const lower = roleName.toLowerCase();
      return (
        dashboardModuleRegistry[lower] ||
        dashboardModuleRegistry.staff ||
        []
      );
    },
    [dashboardModuleRegistry],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [modulesRes, dashModulesRes, rolesRes, usersRes] =
        await Promise.all([
          api(`${API_BASE}/modules`),
          api(`${API_BASE}/dashboard-modules`),
          api(API_BASE),
          api("/users"),
        ]);
      setModules(modulesRes.modules || {});
      setDashboardModuleRegistry(dashModulesRes.modules || {});
      setRoles(rolesRes || []);
      setUsers(usersRes || []);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load role data.";
      setLoadError(message);
      showToastRef.current?.(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadAll();
    };
    load();
  }, [loadAll]);

  const handleDeleteRole = async () => {
    try {
      await api(`${API_BASE}/${deleteTarget._id}`, { method: "DELETE" });
      showToast?.("Role deleted.");
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      showToast?.(err.message || "Failed to delete role.");
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleForm.name.trim()) {
      showToast?.("Role name is required.");
      return;
    }
    if (!newRoleForm.description.trim()) {
      showToast?.("Role description is required.");
      return;
    }
    try {
      await api(API_BASE, {
        method: "POST",
        body: JSON.stringify({
          name: newRoleForm.name,
          description: newRoleForm.description,
          permissions: newRoleForm.permissions,
          dashboardModules: newRoleForm.dashboardModules,
        }),
      });
      showToast?.("Role created.");
      setNewRoleForm({
        name: "",
        description: "",
        permissions: [],
        dashboardModules: [],
      });
      setTab("roles");
      loadAll();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || err.message || "Failed to create role.",
      );
    }
  };

  const filteredUsers = users.filter((u) => {
    const currentIsAdmin = hasBaseRole(currentUser, "admin");
    if (!currentIsAdmin && hasBaseRole(u, "admin")) return false;

    const q = search.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(q) ||
      u.phoneNumber?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (!roleFilter) return true;

    if (roleFilter === "__none__") {
      // No custom role: role is a plain base-role string
      return typeof u.role === "string" && isBaseRole(u.role);
    }

    // Match by role ObjectId or system role name
    const userRoleId = getUserRoleId(u);
    if (userRoleId) return userRoleId === roleFilter;

    // Fallback: system role filter matched by name
    const filterRole = roles.find((r) => r._id?.toString() === roleFilter);
    if (filterRole?.isSystem) {
      return (
        typeof u.role === "string" &&
        u.role.toLowerCase() === filterRole.name?.toLowerCase()
      );
    }
    return false;
  });

  const usersForRole = (role) =>
    users.filter((u) => {
      const currentIsAdmin = hasBaseRole(currentUser, "admin");
      if (!currentIsAdmin && hasBaseRole(u, "admin")) return false;

      if (role?.isSystem) {
        const roleName = role.name?.toLowerCase();
        const userRoleName = getUserRoleName(u);
        const userRoleId = getUserRoleId(u);
        return userRoleName === roleName || userRoleId === role._id?.toString();
      }

      const userRoleId = getUserRoleId(u);
      return userRoleId === role._id?.toString();
    });

  const permissionCount = (role) =>
    role.permissions?.reduce((sum, p) => sum + (p.actions?.length || 0), 0) ??
    0;

  const TABS = [
    { key: "roles", label: "Roles", icon: Lock },
    { key: "create", label: "Create Role", icon: Plus },
    { key: "users", label: "Assign to Users", icon: UsersIcon },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-400 uppercase mb-1">
            Access Control
          </p>
          <h2 className="text-2xl font-extrabold text-white">
            Roles & Permissions
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {tab !== "create" && (
            <button
              onClick={() => setTab("create")}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Create Role
            </button>
          )}
          {tab === "users" && (
            <button
              onClick={() => setAddUserOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-sm font-bold text-white border border-slate-700 transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex w-fit rounded-xl border border-slate-800 bg-[#0b1120] p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${tab === t.key
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
                }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-5">
          <p className="text-sm font-semibold text-red-200">
            Could not load roles and users.
          </p>
          <p className="mt-1 text-xs text-red-300/80">{loadError}</p>
          <button
            onClick={loadAll}
            className="mt-4 rounded-lg border border-red-500/30 px-4 py-2 text-xs font-bold text-red-100 hover:bg-red-500/10"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-[#111827] border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : tab === "create" ? (
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-400 uppercase mb-1">
                Create Role
              </p>
              <h3 className="text-lg font-extrabold text-white">
                New custom role
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Add a role and assign both permissions and sidebar modules in
                one place.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setNewRoleForm({
                  name: "",
                  description: "",
                  permissions: [],
                  dashboardModules: [],
                })
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-indigo-500 hover:text-white transition"
            >
              Reset form
            </button>
          </div>

          <div className="space-y-5 mt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Role Name
                  </label>
                  <input
                    value={newRoleForm.name}
                    onChange={(e) =>
                      setNewRoleForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. Content Reviewer"
                    className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Description
                  </label>
                  <input
                    value={newRoleForm.description}
                    onChange={(e) =>
                      setNewRoleForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="What this role is for"
                    className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                  Sidebar Modules &amp; Permissions
                </p>
                <ModulePermissionEditor
                  dashboardModuleRegistry={dashboardModuleRegistry}
                  permissionModules={modules}
                  roleName={newRoleForm.name}
                  dashboardModules={newRoleForm.dashboardModules}
                  permissions={newRoleForm.permissions}
                  onDashboardModulesChange={(dashboardModules) =>
                    setNewRoleForm((f) => ({ ...f, dashboardModules }))
                  }
                  onPermissionsChange={(permissions) =>
                    setNewRoleForm((f) => ({ ...f, permissions }))
                  }
                />
              </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCreateRole}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition"
            >
              Create Role
            </button>
          </div>
        </div>
      ) : tab === "roles" ? (
        <div className="space-y-6">
          {roles.length === 0 ? (
            <div className="text-center py-16">
              <Shield size={36} className="mx-auto mb-3 text-slate-700" />
              <p className="text-slate-500 font-semibold">
                No roles yet. Create your first custom role.
              </p>
              <button
                type="button"
                onClick={() => setTab("create")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white"
              >
                <Plus size={16} />
                Create Role
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <div
                  key={role._id}
                  className="rounded-2xl border border-slate-800 bg-[#111827] p-5 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">
                          {role.name}
                        </h3>
                        {role.isSystem && (
                          <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {role.description || "No description"}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setRoleModal(role)}
                        title="Edit Role"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-300"
                      >
                        <Pencil size={13} />
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={() => setDeleteTarget(role)}
                          title="Delete Role"
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-900/40 text-red-400 hover:bg-red-950/30 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions?.length === 0 && (
                      <span className="text-[11px] text-slate-600">
                        No permissions granted
                      </span>
                    )}
                    {role.permissions?.map((p) => (
                      <span
                        key={p.module}
                        className="text-[10px] font-semibold px-2 py-1 rounded-md bg-indigo-950/40 text-indigo-300 border border-indigo-900/40"
                      >
                        {MODULE_LABELS[p.module] || p.module} ·{" "}
                        {p.actions.length}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-800">
                    {permissionCount(role)} permission
                    {permissionCount(role) !== 1 ? "s" : ""} granted
                  </div>

                  {/* Dashboard modules summary */}
                  {(() => {
                    const allKeys = getModuleKeysForRole(role.name);
                    if (!allKeys || allKeys.length === 0) return null;
                    const enabledKeys = Array.isArray(role.dashboardModules)
                      ? role.dashboardModules
                      : allKeys;
                    return (
                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-purple-400 flex items-center gap-1">
                            <LayoutGrid size={11} />
                            Dashboard Modules · {enabledKeys.length}/
                            {allKeys.length} visible
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {allKeys.map((key) => {
                            const on = enabledKeys.includes(key);
                            return (
                              <span
                                key={key}
                                className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${on
                                  ? "bg-purple-950/40 text-purple-300 border-purple-900/40"
                                  : "bg-slate-900/60 text-slate-600 border-slate-800 line-through"
                                  }`}
                              >
                                {DASHBOARD_MODULE_LABELS[key] || key}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                      Assigned Users · {usersForRole(role).length}
                    </p>
                    {usersForRole(role).length === 0 ? (
                      <p className="text-[11px] text-slate-600">
                        No one holds this role yet.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                        {usersForRole(role).map((u) => (
                          <div
                            key={u._id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-[#0b1120] border border-slate-800 px-3 py-1.5"
                          >
                            <span className="text-xs font-semibold text-white truncate">
                              {u.name}
                            </span>
                            <span className="text-[11px] text-slate-500 shrink-0">
                              {u.phoneNumber}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative max-w-sm flex-1 min-w-[220px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name, phone, or email…"
                className="w-full rounded-lg bg-[#0b1120] border border-slate-700 pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="">All roles</option>
              <option value="__none__">No custom role assigned</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            {filteredUsers.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#111827] px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">
                      {u.name}
                    </span>
                    {(() => {
                      const userRoleId = getUserRoleId(u);
                      const customRole =
                        getCustomRole(u, roles) ||
                        (userRoleId
                          ? roles.find((r) => r._id?.toString() === userRoleId)
                          : null);
                      if (customRole) {
                        return (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                            {customRole.name}
                          </span>
                        );
                      }
                      if (u.role && isBaseRole(u.role)) {
                        return (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {u.role}
                          </span>
                        );
                      }
                      if (userRoleId) {
                        return (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                            Custom Role
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="text-xs text-slate-500">
                    {u.phoneNumber}
                    {u.email ? ` · ${u.email}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => setAssignTarget(u)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all"
                >
                  <Shield size={13} />
                  Assign Roles
                </button>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-10">
                No users match your search.
              </p>
            )}
          </div>
        </div>
      )}

      {roleModal && (
        <RoleModal
          modules={modules}
          dashboardModuleRegistry={dashboardModuleRegistry}
          dashboardModuleKeys={getModuleKeysForRole(roleModal?.name)}
          initial={roleModal._id ? roleModal : null}
          onClose={() => setRoleModal(null)}
          onSaved={() => {
            setRoleModal(null);
            loadAll();
          }}
          showToast={showToast}
        />
      )}

      {assignTarget && (
        <AssignRolesModal
          user={assignTarget}
          roles={roles.filter(
            (r) => !(r.isSystem && r.name?.toLowerCase() === "admin"),
          )}
          onClose={() => setAssignTarget(null)}
          onSaved={() => {
            setAssignTarget(null);
            loadAll();
          }}
          showToast={showToast}
        />
      )}

      {addUserOpen && (
        <AddUserModal
          roles={roles.filter(
            (r) => !(r.isSystem && r.name?.toLowerCase() === "admin"),
          )}
          onClose={() => setAddUserOpen(false)}
          onSaved={() => {
            setAddUserOpen(false);
            loadAll();
          }}
          showToast={showToast}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <h3 className="text-lg font-bold text-white mb-2">Delete Role?</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              "{deleteTarget.name}" will be removed and unassigned from all
              users. This can't be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRole}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-900 hover:bg-red-800 text-red-200 text-sm font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManager