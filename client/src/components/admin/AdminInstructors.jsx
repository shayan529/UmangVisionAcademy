import { useRef, useState } from "react";
import {
  Search,
  Trash2,
  BookOpen,
  Star,
  GraduationCap,
  Upload,
  CheckCircle2,
  X,
  Mail,
  Phone,
  MapPin,
  Users,
  Award,
  CalendarClock,
  Shield,
  Eye,
  DollarSign,
  Pencil,
  UserPlus,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import api from "../../config/api.js";

/* ─── helpers ─────────────────────────────────────────── */
const fmt = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`);
const hue = (name = "?") => {
  const palette = [
    "#7c3aed",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
  ];
  return palette[name.charCodeAt(0) % palette.length];
};

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const ROLE_OPTIONS = ["student", "instructor", "admin"];

/* ─── Avatar ──────────────────────────────────────────── */
const Av = ({ name = "?", size = 44 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: hue(name),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.38,
      fontWeight: 800,
      color: "#fff",
      flexShrink: 0,
      letterSpacing: "-0.02em",
    }}
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
);

/* ─── Modal info row ──────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5">
    <Icon size={16} className="text-slate-500 mt-0.5 flex-none" />
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
        {label}
      </p>
      <p className="text-sm text-slate-200 font-medium break-words">
        {value || value === 0 ? value : "—"}
      </p>
    </div>
  </div>
);

const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
    <Icon size={15} className="text-indigo-400" />
    <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300">
      {children}
    </h4>
  </div>
);

/* ─── Form field primitives ───────────────────────────── */
const FieldLabel = ({ children }) => (
  <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1.5">
    {children}
  </label>
);

const TextField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  multiline,
}) => (
  <div>
    <FieldLabel>
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </FieldLabel>
    {multiline ? (
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 transition duration-150 resize-none"
      />
    ) : (
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 transition duration-150"
      />
    )}
  </div>
);

/* ─── Add Instructor Modal ────────────────────────────── */
const AddInstructorModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    city: "",
    state: "",
    pincode: "",
    specialization: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    const required = [
      "name",
      "password",
      "phoneNumber",
      "city",
      "state",
      "pincode",
    ];
    const missing = required.filter((key) => !form[key]?.trim());
    if (missing.length) {
      setError(
        "Name, phone number, password, city, state, and pincode are all required.",
      );
      return;
    }
    if (form.password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        role: "instructor",
        roles: ["instructor"],
      };
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.specialization.trim())
        payload.specialization = form.specialization.trim();
      if (form.bio.trim()) payload.bio = form.bio.trim();

      const { data } = await api.post("/users/admin-create", payload);
      if (onCreated) await onCreated(data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to add instructor.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <UserPlus size={20} className="text-emerald-400" />
            <p className="text-base font-extrabold text-white">
              Add Instructor
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-none p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <TextField
            label="Full Name"
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Priya Mehta"
            required
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={set("email")}
            type="email"
            placeholder="instructor@example.com"
          />
          <TextField
            label="Phone Number"
            value={form.phoneNumber}
            onChange={set("phoneNumber")}
            placeholder="10-digit mobile number"
            required
          />
          <TextField
            label="Password"
            value={form.password}
            onChange={set("password")}
            type="password"
            placeholder="Minimum 6 characters"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="City"
              value={form.city}
              onChange={set("city")}
              placeholder="City"
              required
            />
            <TextField
              label="State"
              value={form.state}
              onChange={set("state")}
              placeholder="State"
              required
            />
          </div>
          <TextField
            label="Pincode"
            value={form.pincode}
            onChange={set("pincode")}
            placeholder="6-digit pincode"
            required
          />
          <TextField
            label="Specialization"
            value={form.specialization}
            onChange={set("specialization")}
            placeholder="e.g. Web Development, Data Science"
          />
          <TextField
            label="Bio"
            value={form.bio}
            onChange={set("bio")}
            placeholder="Short instructor bio..."
            multiline
          />

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
              <AlertCircle size={15} className="mt-0.5 flex-none" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  Add Instructor
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Edit Instructor Modal ───────────────────────────── */
const EditInstructorModal = ({ instructor, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: instructor.name || "",
    email: instructor.email || "",
    phoneNumber: instructor.phoneNumber || "",
    city: instructor.city || "",
    state: instructor.state || "",
    pincode: instructor.pincode || "",
    specialization: instructor.specialization || "",
    bio: instructor.bio || "",
    roles: instructor.roles?.length ? instructor.roles : ["instructor"],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleRole = (role) => {
    setForm((f) => {
      const has = f.roles.includes(role);
      const next = has ? f.roles.filter((r) => r !== role) : [...f.roles, role];
      return { ...f, roles: next.length ? next : ["instructor"] };
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        roles: form.roles,
        specialization: form.specialization.trim(),
        bio: form.bio.trim(),
      };
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.phoneNumber.trim())
        payload.phoneNumber = form.phoneNumber.trim();

      const { data } = await api.put(`/users/${instructor._id}`, payload);
      if (onSaved) await onSaved(data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to save changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <Av name={instructor.name} size={40} />
            <div className="min-w-0">
              <p className="text-base font-extrabold text-white truncate">
                Edit Instructor
              </p>
              <p className="text-xs text-slate-500 truncate">
                {instructor.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-none p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <TextField
            label="Full Name"
            value={form.name}
            onChange={set("name")}
            required
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={set("email")}
            type="email"
          />
          <TextField
            label="Phone Number"
            value={form.phoneNumber}
            onChange={set("phoneNumber")}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="City" value={form.city} onChange={set("city")} />
            <TextField
              label="State"
              value={form.state}
              onChange={set("state")}
            />
          </div>
          <TextField
            label="Pincode"
            value={form.pincode}
            onChange={set("pincode")}
          />
          <TextField
            label="Specialization"
            value={form.specialization}
            onChange={set("specialization")}
            placeholder="e.g. Web Development, Data Science"
          />
          <TextField
            label="Bio"
            value={form.bio}
            onChange={set("bio")}
            placeholder="Short instructor bio..."
            multiline
          />

          <div>
            <FieldLabel>Roles</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => {
                const active = form.roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                      active
                        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                        : "bg-slate-900/40 border-slate-700 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
              <AlertCircle size={15} className="mt-0.5 flex-none" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Instructor Details Modal ───────────────────────── */
const InstructorDetailsModal = ({ instructor, onClose, onEdit }) => {
  if (!instructor) return null;

  const courses = instructor.mc || [];
  const totalRevenue = courses.reduce(
    (sum, c) => sum + (c.price || 0) * (c.students?.length || 0),
    0,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <Av name={instructor.name} size={46} />
            <div className="min-w-0">
              <p className="text-base font-extrabold text-white truncate">
                {instructor.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {instructor.email || "No email on file"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-none">
            {onEdit && <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition"
            >
              <Pencil size={14} />
              Edit
            </button>}
            <button
              onClick={onClose}
              className="flex-none p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Contact */}
          <SectionTitle icon={Mail}>Contact & Profile</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 divide-y divide-slate-800/60 sm:divide-y-0">
            <InfoRow icon={Mail} label="Email" value={instructor.email} />
            <InfoRow
              icon={Phone}
              label="Phone"
              value={instructor.phoneNumber}
            />
            <InfoRow
              icon={Shield}
              label="Specialization"
              value={instructor.specialization}
            />
            <InfoRow
              icon={CalendarClock}
              label="Joined"
              value={fmtDate(instructor.createdAt)}
            />
            <InfoRow
              icon={MapPin}
              label="City / State"
              value={
                [instructor.city, instructor.state]
                  .filter(Boolean)
                  .join(", ") || null
              }
            />
            <InfoRow icon={MapPin} label="Pincode" value={instructor.pincode} />
          </div>
          {instructor.bio && (
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                Bio
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {instructor.bio}
              </p>
            </div>
          )}

          {/* Performance overview */}
          <SectionTitle icon={Award}>Performance Overview</SectionTitle>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px] rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5">
              <p className="text-xs uppercase tracking-wider text-emerald-300/80 font-bold">
                Courses
              </p>
              <p className="text-xl font-extrabold text-emerald-300 mt-1">
                {courses.length}
              </p>
            </div>
            <div className="flex-1 min-w-[140px] rounded-xl border border-sky-500/20 bg-sky-500/10 p-3.5">
              <p className="text-xs uppercase tracking-wider text-sky-300/80 font-bold">
                Students
              </p>
              <p className="text-xl font-extrabold text-sky-300 mt-1">
                {instructor.stu || 0}
              </p>
            </div>
            <div className="flex-1 min-w-[140px] rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5">
              <p className="text-xs uppercase tracking-wider text-amber-300/80 font-bold">
                Avg Rating
              </p>
              <p className="text-xl font-extrabold text-amber-300 mt-1 flex items-center gap-1">
                <Star size={16} className="fill-amber-300" />
                {instructor.avg || "—"}
              </p>
            </div>
            <div className="flex-1 min-w-[140px] rounded-xl border border-violet-500/20 bg-violet-500/10 p-3.5">
              <p className="text-xs uppercase tracking-wider text-violet-300/80 font-bold">
                Est. Revenue
              </p>
              <p className="text-xl font-extrabold text-violet-300 mt-1">
                {fmt(totalRevenue)}
              </p>
            </div>
          </div>

          {/* Courses list */}
          <SectionTitle icon={BookOpen}>
            Courses Taught ({courses.length})
          </SectionTitle>
          {courses.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {courses.map((c) => (
                <li
                  key={c._id}
                  className="flex items-center justify-between gap-3 text-sm text-slate-300 bg-slate-900/40 border border-slate-800/70 rounded-lg px-4 py-3"
                >
                  <span className="flex items-center gap-2.5 truncate min-w-0">
                    <BookOpen size={15} className="text-indigo-400 flex-none" />
                    <span className="truncate font-medium">
                      {c.title || "Untitled Course"}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 flex-none text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {c.students?.length || 0}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <DollarSign size={12} />
                      {fmt((c.price || 0) * (c.students?.length || 0))}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">
              Not teaching any courses yet.
            </p>
          )}

          {/* Roles */}
          <SectionTitle icon={Shield}>Account Roles</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {(instructor.roles || ["instructor"]).map((r) => (
              <span
                key={r}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────── */
const AdminInstructors = ({
  enrichedInstructors = [],
  q,
  setQ,
  deleteUser,
  refreshUsers,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}) => {
  const ql = q.toLowerCase();
  const filtI = enrichedInstructors.filter(
    (i) =>
      i.name?.toLowerCase().includes(ql) || i.email?.toLowerCase().includes(ql),
  );
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [addingInstructor, setAddingInstructor] = useState(false);

  // ── Bulk import state ──────────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [importStats, setImportStats] = useState(null);

  const handleMutationSuccess = async () => {
    if (refreshUsers) await refreshUsers();
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const accepted = /\.(csv|xlsx|xls|docx|txt)$/i.test(file.name);
    if (!accepted) {
      setImportError(
        "Supported formats: CSV, Excel (.xlsx/.xls), DOCX, or TXT",
      );
      event.target.value = "";
      return;
    }

    setImporting(true);
    setImportError("");
    setImportSuccess("");
    setImportStats(null);

    const formData = new FormData();
    formData.append("file", file);
    // The backend's bulkImportStudents reads req.body.role and falls back
    // to "student" for anything else — sending "instructor" here is what
    // makes every row in this file get created with roles: ["instructor"]
    // instead of the default.
    formData.append("role", "instructor");

    try {
      const { data } = await api.post("/users/bulk-import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImportSuccess(data.message || "Instructors imported successfully.");
      setImportStats({
        inserted: data.inserted || 0,
        skipped: data.skipped || 0,
        skippedRows: data.skippedRows || [],
      });
      if (refreshUsers) await refreshUsers();
    } catch (err) {
      setImportError(
        err.response?.data?.message || err.message || "Import failed.",
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase mb-1">
            Accounts Management
          </p>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Platform Instructors
            <span className="text-sm font-semibold text-slate-500 bg-slate-900/60 border border-slate-800 rounded-md px-2 py-0.5 mt-0.5">
              {filtI.length} Active
            </span>
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              className="w-full bg-slate-900/40 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition duration-150"
              placeholder="Search instructors database..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {canCreate && <button
            type="button"
            onClick={() => setAddingInstructor(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
          >
            <UserPlus size={14} />
            Add Instructor
          </button>}

          {canCreate && <button
            type="button"
            onClick={handleImportClick}
            disabled={importing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition disabled:opacity-60"
          >
            <Upload size={14} />
            {importing ? "Importing..." : "Bulk Import"}
          </button>}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.docx,.txt"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-xs text-slate-300">
        <p className="font-semibold text-slate-200 mb-1">Expected columns</p>
        <p className="text-slate-400">
          Use any of: <span className="font-medium">name</span>,{" "}
          <span className="font-medium">email</span>,{" "}
          <span className="font-medium">phoneNumber</span>,{" "}
          <span className="font-medium">password</span>,{" "}
          <span className="font-medium">city</span>,{" "}
          <span className="font-medium">state</span>,{" "}
          <span className="font-medium">pincode</span>
        </p>
        <p className="text-slate-500 mt-1.5">
          Specialization and bio aren't part of bulk import — add those
          afterward via Edit if needed.
        </p>
      </div>

      {importError && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-none" />
          <p className="text-xs">{importError}</p>
        </div>
      )}

      {importSuccess && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
          <CheckCircle2 size={16} className="mt-0.5 flex-none" />
          <div>
            <p className="text-xs font-semibold">{importSuccess}</p>
            {importStats && (
              <p className="text-[11px] text-emerald-200/90 mt-1">
                Inserted: {importStats.inserted} · Skipped:{" "}
                {importStats.skipped}
              </p>
            )}
          </div>
        </div>
      )}

      {importStats?.skippedRows?.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
          <p className="font-semibold mb-2">Skipped rows</p>
          <ul className="space-y-1">
            {importStats.skippedRows.map((item, index) => (
              <li key={`${item.row}-${index}`}>
                Row {item.row}: {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid listing */}
      <div className="flex flex-col gap-4">
        {filtI.map((inst) => (
          <div
            key={inst._id}
            className="flex flex-col md:flex-row justify-between items-start gap-4 p-4 md:p-5 bg-slate-900/35 border border-slate-800/80 rounded-2xl transition duration-150 hover:border-slate-700/60"
          >
            {/* Left section: profile and courses preview */}
            <div className="flex gap-4 items-start min-w-0 flex-1 w-full">
              <Av name={inst.name} size={42} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {inst.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5 mb-3">
                  {inst.email}
                </p>

                {/* Badges row */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    {inst.mc?.length || 0} course
                    {inst.mc?.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full">
                    {inst.stu || 0} student{inst.stu !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    ★ {inst.avg || "—"}
                  </span>
                </div>

                {/* Mini course list */}
                {inst.mc && inst.mc.length > 0 && (
                  <div className="border-t border-slate-800/60 pt-3 flex flex-col gap-1.5">
                    {inst.mc.slice(0, 2).map((c) => (
                      <div
                        key={c._id}
                        className="flex items-center justify-between gap-4 text-[10px] text-slate-400"
                      >
                        <span className="truncate flex items-center gap-1.5 font-medium">
                          <BookOpen
                            size={10}
                            className="text-slate-600 shrink-0"
                          />
                          {c.title || "Untitled Course"}
                        </span>
                        <span className="shrink-0 font-semibold text-emerald-500">
                          {fmt((c.price || 0) * (c.students?.length || 0))}
                        </span>
                      </div>
                    ))}
                    {inst.mc.length > 2 && (
                      <span className="text-[9px] text-slate-600 font-medium pl-4 mt-0.5">
                        +{inst.mc.length - 2} more learning programs
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right section: actions */}
            <div className="flex  items-center md:items-end justify-between md:justify-start gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-800/60 pt-4 md:pt-0">
              {/* Details button */}
              <button
                onClick={() => setSelectedInstructor(inst)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition duration-150"
              >
                <Eye size={12} />
                Details
              </button>

              {/* Edit button */}
              {canEdit && <button
                onClick={() => setEditingInstructor(inst)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-sky-300 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/30 transition duration-150"
              >
                <Pencil size={12} />
                Edit
              </button>}

              {/* Remove button */}
              {canDelete && <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to remove instructor "${inst.name}"?`,
                    )
                  ) {
                    deleteUser(inst._id);
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition duration-150"
              >
                <Trash2 size={12} />
                Remove
              </button>}
            </div>
          </div>
        ))}

        {filtI.length === 0 && (
          <div className="py-16 text-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/20">
            <GraduationCap size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">
              No instructors found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Refine your search input or wait for credentials validation.
            </p>
          </div>
        )}
      </div>

      {selectedInstructor && (
        <InstructorDetailsModal
          instructor={selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
          onEdit={
            canEdit
              ? () => {
                  setEditingInstructor(selectedInstructor);
                  setSelectedInstructor(null);
                }
              : null
          }
        />
      )}

      {editingInstructor && (
        <EditInstructorModal
          instructor={editingInstructor}
          onClose={() => setEditingInstructor(null)}
          onSaved={handleMutationSuccess}
        />
      )}

      {addingInstructor && (
        <AddInstructorModal
          onClose={() => setAddingInstructor(false)}
          onCreated={handleMutationSuccess}
        />
      )}
    </div>
  );
};

export default AdminInstructors;
