import React, { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import apiClient from "../../config/api";
import {
  getCustomRoles,
  hasBaseRole,
  isBaseRole,
} from "../../utils/permissions";
import { INDIA_CITIES_BY_STATE, INDIA_STATES } from "../../data/indiaLocations";

const API_BASE = "/admin/roles";
const USERS_API = "/users/admin-create";

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
};

const EMPTY_ROLE = { name: "", description: "", permissions: [] };

const getCustomRoleIds = (user) =>
  getCustomRoles(user)
    .map((role) => role._id || role)
    .filter(Boolean);

const BASE_ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "instructor", label: "Instructor" },
];

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
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold border transition-colors ${
                      checked
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

// ── Reusable role checklist ───────────────────────────────────────────────────
const RoleChecklist = ({ roles, selected, onToggle, emptyHint }) => {
  if (roles.length === 0) {
    return <p className="text-xs text-slate-500">{emptyHint}</p>;
  }
  return (
    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
      {roles.map((role) => {
        const checked = selected.includes(role._id);
        return (
          <button
            key={role._id}
            type="button"
            onClick={() => onToggle(role._id)}
            className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-colors ${
              checked
                ? "border-indigo-500 bg-indigo-950/30"
                : "border-slate-800 bg-[#0b1120] hover:border-slate-600"
            }`}
          >
            <div>
              <div className="text-sm font-semibold text-white">
                {role.name}
              </div>
              {role.description && (
                <div className="text-[11px] text-slate-500">
                  {role.description}
                </div>
              )}
            </div>
            <div
              className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                checked ? "bg-indigo-600 border-indigo-500" : "border-slate-600"
              }`}
            >
              {checked && <Check size={12} className="text-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ── Role create/edit modal ────────────────────────────────────────────────────
const RoleModal = ({ modules, initial, onClose, onSaved, showToast }) => {
  const [form, setForm] = useState(initial || EMPTY_ROLE);
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
            {/* ── Plain text input instead of dropdown ── */}
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

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2 block">
              Permissions
            </label>
            <PermissionMatrix
              modules={modules}
              value={form.permissions}
              onChange={(permissions) =>
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
const AssignRolesModal = ({ user, roles, onClose, onSaved, showToast }) => {
  const [selected, setSelected] = useState(() => {
    const customIds = getCustomRoleIds(user);
    const systemRoleIds = (roles || [])
      .filter((r) => r.isSystem && hasBaseRole(user, r.name))
      .map((r) => r._id);
    return [...customIds, ...systemRoleIds];
  });
  const [saving, setSaving] = useState(false);

  const toggleRole = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api(`${API_BASE}/assign/${user._id}`, {
        method: "PUT",
        body: JSON.stringify({ roleIds: selected }),
      });
      showToast?.(`Roles updated for ${user.name}.`);
      onSaved();
    } catch (err) {
      showToast?.(err.message || "Failed to assign roles.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-white">Assign Roles</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          {user.name} · {user.phoneNumber}
        </p>

        <div className="mb-6">
          <RoleChecklist
            roles={roles}
            selected={selected}
            onToggle={toggleRole}
            emptyHint="No custom roles yet — create one first."
          />
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
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Add user modal ────────────────────────────────────────────────────────────
const AddUserModal = ({ roles, onClose, onSaved, showToast }) => {
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
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleRole = (id) =>
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );

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
          roles: [form.baseRole],
          customRoleIds: selectedRoles,
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Add User</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Full Name
            </label>
            <input
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Jane Doe"
              className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="jane@example.com"
                className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Phone Number
              </label>
              <input
                value={form.phoneNumber}
                onChange={handlePhoneChange}
                maxLength={16}
                placeholder="9876543210 or +91..."
                className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange("password")}
                placeholder="Enter password"
                className="w-full rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 pr-10 text-sm text-white outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                State
              </label>
              <select
                value={form.state}
                onChange={handleStateChange}
                className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="" disabled>
                  Select a state…
                </option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                City
              </label>
              <select
                value={form.city}
                onChange={handleChange("city")}
                disabled={!form.state}
                className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="" disabled>
                  {form.state ? "Select a city…" : "Select a state first"}
                </option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Pincode
            </label>
            <input
              value={form.pincode}
              onChange={handleChange("pincode")}
              required
              className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Account Type
            </label>
            <select
              value={form.baseRole}
              onChange={handleChange("baseRole")}
              className="rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            >
              {BASE_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Custom Role (optional)
            </label>
            <RoleChecklist
              roles={roles}
              selected={selectedRoles}
              onToggle={toggleRole}
              emptyHint="No custom roles yet — you can assign one later from Roles & Permissions."
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-xs font-semibold text-red-200">
            {error}
          </div>
        )}

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
            Add User
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────
const RoleManager = ({ showToast, currentUser }) => {
  const [tab, setTab] = useState("roles");
  const [modules, setModules] = useState({});
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

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [modulesRes, rolesRes, usersRes] = await Promise.all([
        api(`${API_BASE}/modules`),
        api(API_BASE),
        api("/users"),
      ]);
      setModules(modulesRes.modules || {});
      setRoles(rolesRes || []);
      setUsers(usersRes || []);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load role data.";
      setLoadError(message);
      showToast?.(message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
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
    const assignedIds = getCustomRoleIds(u);
    if (roleFilter === "__none__") return assignedIds.length === 0;
    return assignedIds.includes(roleFilter);
  });

  const usersForRole = (roleId) =>
    users.filter((u) => {
      const isAssigned = getCustomRoleIds(u).includes(roleId);
      if (!isAssigned) return false;
      const currentIsAdmin = hasBaseRole(currentUser, "admin");
      if (!currentIsAdmin && hasBaseRole(u, "admin")) return false;
      return true;
    });

  const permissionCount = (role) =>
    role.permissions?.reduce((sum, p) => sum + (p.actions?.length || 0), 0) ??
    0;

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
        {tab === "roles" && (
          <button
            onClick={() => setRoleModal(EMPTY_ROLE)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20"
          >
            <Plus size={16} />
            New Role
          </button>
        )}
        {tab === "users" && (
          <button
            onClick={() => setAddUserOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20"
          >
            <UserPlus size={16} />
            Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="inline-flex w-fit rounded-xl border border-slate-800 bg-[#0b1120] p-1">
        {[
          { key: "roles", label: "Roles", icon: Lock },
          { key: "users", label: "Assign to Users", icon: UsersIcon },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                tab === t.key
                  ? "bg-indigo-600 text-white"
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
      ) : tab === "roles" ? (
        roles.length === 0 ? (
          <div className="text-center py-16">
            <Shield size={36} className="mx-auto mb-3 text-slate-700" />
            <p className="text-slate-500 font-semibold">
              No roles yet. Create your first custom role.
            </p>
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
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-300"
                    >
                      <Pencil size={13} />
                    </button>
                    {!role.isSystem && (
                      <button
                        onClick={() => setDeleteTarget(role)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-900/40 text-red-400 hover:bg-red-950/30"
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
                      {MODULE_LABELS[p.module] || p.module} · {p.actions.length}
                    </span>
                  ))}
                </div>

                <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-800">
                  {permissionCount(role)} permission
                  {permissionCount(role) !== 1 ? "s" : ""} granted
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Assigned Users · {usersForRole(role._id).length}
                  </p>
                  {usersForRole(role._id).length === 0 ? (
                    <p className="text-[11px] text-slate-600">
                      No one holds this role yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                      {usersForRole(role._id).map((u) => (
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
        )
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
                    {(u.roles || []).filter(isBaseRole).map((r) => {
                      const label =
                        typeof r === "string" ? r : r?.name || "role";
                      const k = typeof r === "string" ? r : r?._id || label;
                      return (
                        <span
                          key={k}
                          className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-xs text-slate-500">
                    {u.phoneNumber}
                    {u.email ? ` · ${u.email}` : ""}
                  </div>
                  {getCustomRoles(u).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {getCustomRoles(u).map((r) => (
                        <span
                          key={r._id || r}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-950/40 text-indigo-300 border border-indigo-900/40"
                        >
                          {r.name || "Role"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setAssignTarget(u)}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
                >
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

export default RoleManager;
