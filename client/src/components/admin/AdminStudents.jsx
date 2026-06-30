import { useRef, useState } from "react";
import {
  Search,
  Trash2,
  User,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone,
  MapPin,
  Coins,
  BookOpen,
  Award,
  CalendarClock,
  Shield,
  Monitor,
  Gift,
  Eye,
  Pencil,
  UserPlus,
  Save,
  Loader2,
} from "lucide-react";
import api from "../../config/api.js";

/* ─── helpers ─────────────────────────────────────────── */
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

// user.roles is a MIXED array post-migration: base role strings
// ("student", "admin") alongside embedded custom-role objects
// ({ _id, name, permissions, ... }). Anywhere we need a human-readable
// label for a role entry — display text, .join(), etc. — use this so a
// custom-role object never gets coerced into "[object Object]" by
// Array.prototype.join() or rendered directly.
const roleLabel = (role) =>
  role && typeof role === "object" ? role.name || "Custom Role" : role;

/* ─── Avatar ──────────────────────────────────────────── */
const Av = ({ name = "?", size = 36 }) => (
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

/* ─── small presentational bits for the modal (larger fonts) ── */
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

/* ─── Form field primitives for Add/Edit modals ──────── */
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
}) => (
  <div>
    <FieldLabel>
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </FieldLabel>
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 transition duration-150"
    />
  </div>
);

/* ─── Add Student Modal ───────────────────────────────── */
const AddStudentModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    city: "",
    state: "",
    pincode: "",
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
        role: "student",
      };
      if (form.email.trim()) payload.email = form.email.trim();

      const { data } = await api.post("/users/admin-create", payload);
      if (onCreated) await onCreated(data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to add student.",
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
            <UserPlus size={20} className="text-indigo-400" />
            <p className="text-base font-extrabold text-white">Add Student</p>
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
            placeholder="e.g. Aarav Sharma"
            required
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={set("email")}
            type="email"
            placeholder="student@example.com"
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
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  Add Student
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Edit Student Modal ──────────────────────────────── */
const EditStudentModal = ({ student, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: student.name || "",
    email: student.email || "",
    phoneNumber: student.phoneNumber || "",
    city: student.city || "",
    state: student.state || "",
    pincode: student.pincode || "",
    coins: typeof student.coins === "number" ? student.coins : 0,
    // Only base roles are editable here — custom roles (objects) are
    // managed from Roles & Permissions, not this dropdown, so they're
    // filtered out of the editable set rather than passed through.
    roles: student.roles?.filter((r) => typeof r === "string").length
      ? student.roles.filter((r) => typeof r === "string")
      : ["student"],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleRole = (role) => {
    setForm((f) => {
      const has = f.roles.includes(role);
      const next = has ? f.roles.filter((r) => r !== role) : [...f.roles, role];
      return { ...f, roles: next.length ? next : ["student"] };
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
        coins: Number(form.coins) || 0,
        roles: form.roles,
      };
      // email and phoneNumber are unique+sparse on the schema. Sending an
      // empty string (rather than omitting the field) would not be treated
      // as "no value" by the unique index, and could collide with another
      // user who also has an empty string there. Only include them if the
      // admin actually typed something.
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.phoneNumber.trim())
        payload.phoneNumber = form.phoneNumber.trim();

      const { data } = await api.put(`/users/${student._id}`, payload);
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
            <Av name={student.name} size={40} />
            <div className="min-w-0">
              <p className="text-base font-extrabold text-white truncate">
                Edit Student
              </p>
              <p className="text-xs text-slate-500 truncate">{student.email}</p>
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
            label="Coin Balance"
            value={form.coins}
            onChange={(v) => set("coins")(v.replace(/[^0-9]/g, ""))}
            type="text"
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

/* ─── Student Details Modal ──────────────────────────── */
const StudentDetailsModal = ({ student, courses = [], onClose, onEdit }) => {
  if (!student) return null;

  const enrolled = courses.filter((c) =>
    c.students?.some((sid) => (sid._id || sid) === student._id),
  );

  const enrolledFromProfile = (student.enrolledCourses || [])
    .map((ec) => {
      const id = ec._id || ec;
      const title =
        ec.title || courses.find((c) => c._id === id)?.title || null;
      return { id, title };
    })
    .filter((ec) => ec.title);

  const subscription = student.subscription || {};
  const coins = typeof student.coins === "number" ? student.coins : 0;
  const rupeeValue = (coins / 10).toFixed(2);

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
            <Av name={student.name} size={46} />
            <div className="min-w-0">
              <p className="text-base font-extrabold text-white truncate">
                {student.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {student.email || "No email on file"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-none">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition"
              >
                <Pencil size={14} />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-none p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Contact & Location */}
          <SectionTitle icon={Mail}>Contact & Location</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 divide-y divide-slate-800/60 sm:divide-y-0">
            <InfoRow icon={Mail} label="Email" value={student.email} />
            <InfoRow icon={Phone} label="Phone" value={student.phoneNumber} />
            <InfoRow
              icon={MapPin}
              label="City / State"
              value={
                [student.city, student.state].filter(Boolean).join(", ") || null
              }
            />
            <InfoRow icon={MapPin} label="Pincode" value={student.pincode} />
          </div>

          {/* Student extra details */}
          <SectionTitle icon={Shield}>Student Details</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 divide-y divide-slate-800/60 sm:divide-y-0">
            <InfoRow
              icon={Shield}
              label="Father's Name"
              value={student.fatherName}
            />
            <InfoRow
              icon={Shield}
              label="Mother's Name"
              value={student.motherName}
            />
            <InfoRow
              icon={Phone}
              label="Father's Mobile"
              value={student.fatherMobileNumber}
            />
            <InfoRow
              icon={Shield}
              label="Social Media Account"
              value={student.socialMediaAccount}
            />
            <InfoRow
              icon={Shield}
              label="Reference"
              value={student.reference}
            />
            <InfoRow
              icon={Shield}
              label="Vidhansabha"
              value={student.vidhansabha}
            />
          </div>
          <InfoRow
            icon={MapPin}
            label="Full Address"
            value={student.fullAddress}
          />

          {/* Account */}
          <SectionTitle icon={Shield}>Account</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 divide-y divide-slate-800/60 sm:divide-y-0">
            <InfoRow
              icon={Shield}
              label="Roles"
              value={(student.roles || ["student"])
                .map(roleLabel)
                .filter(Boolean)
                .join(", ")}
            />
            <InfoRow
              icon={CalendarClock}
              label="Joined"
              value={fmtDate(student.createdAt)}
            />
            <InfoRow
              icon={Gift}
              label="Referral Code"
              value={student.referralCode}
            />
            <InfoRow
              icon={Gift}
              label="Referrals Made"
              value={student.referralsCount ?? 0}
            />
          </div>

          {/* Wallet */}
          <SectionTitle icon={Coins}>Wallet & Rewards</SectionTitle>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px] rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5">
              <p className="text-xs uppercase tracking-wider text-amber-300/80 font-bold">
                Coin Balance
              </p>
              <p className="text-xl font-extrabold text-amber-300 mt-1">
                {coins} <span className="text-sm font-semibold">coins</span>
              </p>
              <p className="text-xs text-amber-200/70 mt-1">
                ≈ ₹{rupeeValue} redeemable
              </p>
            </div>
            <div className="flex-1 min-w-[140px] rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                Last Login Reward
              </p>
              <p className="text-sm font-semibold text-slate-200 mt-2">
                {fmtDate(student.lastLoginReward)}
              </p>
            </div>
            <div className="flex-1 min-w-[140px] rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                Quiz Score
              </p>
              <p className="text-sm font-semibold text-slate-200 mt-2">
                {student.score ?? 0}
              </p>
            </div>
          </div>

          {/* Subscription */}
          <SectionTitle icon={Award}>Subscription</SectionTitle>
          {subscription.plan ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 divide-y divide-slate-800/60 sm:divide-y-0">
              <InfoRow
                icon={Award}
                label="Plan"
                value={subscription.label || subscription.plan}
              />
              <InfoRow
                icon={Shield}
                label="Status"
                value={subscription.status}
              />
              <InfoRow
                icon={CalendarClock}
                label="Start Date"
                value={fmtDate(subscription.startDate)}
              />
              <InfoRow
                icon={CalendarClock}
                label="End Date"
                value={fmtDate(subscription.endDate)}
              />
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              No active subscription.
            </p>
          )}

          {/* Courses */}
          <SectionTitle icon={BookOpen}>
            Enrolled Courses ({enrolled.length || enrolledFromProfile.length})
          </SectionTitle>
          {enrolled.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {enrolled.map((c) => (
                <li
                  key={c._id}
                  className="flex items-center gap-2.5 text-sm text-slate-300 bg-slate-900/40 border border-slate-800/70 rounded-lg px-4 py-3"
                >
                  <BookOpen size={14} className="text-indigo-400 flex-none" />
                  <span className="truncate font-medium">{c.title}</span>
                </li>
              ))}
            </ul>
          ) : enrolledFromProfile.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {enrolledFromProfile.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2.5 text-sm text-slate-300 bg-slate-900/40 border border-slate-800/70 rounded-lg px-4 py-3"
                >
                  <BookOpen size={14} className="text-indigo-400 flex-none" />
                  <span className="truncate font-medium">{c.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">
              Not enrolled in any course yet.
            </p>
          )}

          {/* Certificates */}
          <SectionTitle icon={Award}>
            Certificates ({student.earnedCertificates?.length || 0})
          </SectionTitle>
          {student.earnedCertificates?.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {student.earnedCertificates.map((cert, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 text-sm text-slate-300 bg-slate-900/40 border border-slate-800/70 rounded-lg px-4 py-3"
                >
                  <span className="flex items-center gap-2.5 truncate min-w-0">
                    <Award size={14} className="text-emerald-400 flex-none" />
                    <span className="truncate font-medium">
                      {cert.courseTitle || "Certificate"}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500 flex-none">
                    {fmtDate(cert.issuedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">
              No certificates earned yet.
            </p>
          )}

          {/* Quiz Submissions */}
          <SectionTitle icon={CheckCircle2}>
            Quiz Submissions ({student.quizSubmissions?.length || 0})
          </SectionTitle>
          {student.quizSubmissions?.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {student.quizSubmissions.map((qs, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 text-sm text-slate-300 bg-slate-900/40 border border-slate-800/70 rounded-lg px-4 py-3"
                >
                  <span className="truncate font-medium">
                    {courses.find(
                      (c) => c._id === (qs.courseId?._id || qs.courseId),
                    )?.title || "Course"}
                  </span>
                  <span className="text-xs text-slate-400 flex-none">
                    Score: {qs.score} · {fmtDate(qs.completedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">
              No quiz submissions yet.
            </p>
          )}

          {/* Devices */}
          <SectionTitle icon={Monitor}>
            Recent Devices ({student.devices?.length || 0})
          </SectionTitle>
          {student.devices?.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {student.devices
                .slice()
                .reverse()
                .slice(0, 5)
                .map((d, i) => (
                  <li
                    key={i}
                    className="flex flex-col gap-1 text-sm text-slate-300 bg-slate-900/40 border border-slate-800/70 rounded-lg px-4 py-3"
                  >
                    <span className="truncate text-sm font-medium">
                      {d.userAgent || "Unknown device"}
                    </span>
                    <span className="text-xs text-slate-500">
                      IP: {d.ip || "—"} · {fmtDate(d.lastLogin)}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">
              No device history recorded.
            </p>
          )}

          {/* Notification Settings */}
          {student.notificationSettings && (
            <>
              <SectionTitle icon={Shield}>
                Notification Preferences
              </SectionTitle>
              <div className="flex flex-wrap gap-2">
                {Object.entries(student.notificationSettings).map(
                  ([key, val]) => (
                    <span
                      key={key}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                        val
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                          : "bg-slate-800/60 border-slate-700 text-slate-500"
                      }`}
                    >
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                  ),
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminStudents = ({
  students = [],
  courses = [],
  q,
  setQ,
  deleteUser,
  refreshUsers,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}) => {
  const ql = q.toLowerCase();
  const filtS = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(ql) || s.email?.toLowerCase().includes(ql),
  );
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [importStats, setImportStats] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [addingStudent, setAddingStudent] = useState(false);

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

    try {
      const { data } = await api.post("/users/bulk-import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImportSuccess(data.message || "Students imported successfully.");
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

  // Called after a successful add/edit. Prefers a full refresh from the
  // server (so course counts etc. stay in sync) but falls back gracefully
  // if no refreshUsers prop was passed in.
  const handleMutationSuccess = async () => {
    if (refreshUsers) await refreshUsers();
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
            Platform Students
            <span className="text-sm font-semibold text-slate-500 bg-slate-900/60 border border-slate-800 rounded-md px-2 py-0.5 mt-0.5">
              {filtS.length} Total
            </span>
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72 shrink-0">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              className="w-full bg-slate-900/40 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition duration-150"
              placeholder="Search students database..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => setAddingStudent(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <UserPlus size={14} />
              Add Student
            </button>
          )}

          {canCreate && (
            <button
              type="button"
              onClick={handleImportClick}
              disabled={importing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition disabled:opacity-60"
            >
              <Upload size={14} />
              {importing ? "Importing..." : "Bulk Import"}
            </button>
          )}
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
      <div className="flex flex-col gap-3">
        {filtS.map((s) => {
          const studentCoursesCount = courses.filter((c) =>
            c.students?.some((sid) => (sid._id || sid) === s._id),
          ).length;

          return (
            <div
              key={s._id}
              className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 p-3.5 bg-slate-900/35 border border-slate-800/80 rounded-2xl transition duration-150 hover:border-slate-700/60"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Av name={s.name} size={36} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {s.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {s.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0 justify-start sm:justify-end w-full sm:w-auto">
                {/* Custom tags */}
                <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                  Student
                </span>

                <span className="text-xs font-semibold text-slate-400 min-w-[4.375rem] text-right">
                  {studentCoursesCount} course
                  {studentCoursesCount !== 1 ? "s" : ""}
                </span>

                {/* Details button */}
                <button
                  onClick={() => setSelectedStudent(s)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition duration-150"
                >
                  <Eye size={12} />
                  Details
                </button>

                {/* Edit button */}
                {canEdit && (
                  <button
                    onClick={() => setEditingStudent(s)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-sky-300 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/30 transition duration-150"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                )}

                {/* Delete button */}
                {canDelete && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to remove student "${s.name}"?`,
                        )
                      ) {
                        deleteUser(s._id);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition duration-150"
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtS.length === 0 && (
          <div className="py-16 text-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/20">
            <User size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">
              No students found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Refine your search input or register students.
            </p>
          </div>
        )}
      </div>

      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          courses={courses}
          onClose={() => setSelectedStudent(null)}
          onEdit={
            canEdit
              ? () => {
                  setEditingStudent(selectedStudent);
                  setSelectedStudent(null);
                }
              : null
          }
        />
      )}

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSaved={handleMutationSuccess}
        />
      )}

      {addingStudent && (
        <AddStudentModal
          onClose={() => setAddingStudent(false)}
          onCreated={handleMutationSuccess}
        />
      )}
    </div>
  );
};

export default AdminStudents;
