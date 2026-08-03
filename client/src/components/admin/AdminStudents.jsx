import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Trash2,
  User,
  Upload,
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
  EyeOff,
  Pencil,
  UserPlus,
  Save,
  Loader2,
  BookPlus,
  GraduationCap,
  Tag,
} from "lucide-react";
import api from "../../config/api.js";
import { INDIA_CITIES_BY_STATE } from "../../data/indiaLocations";

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

// Course titles follow a "Subject - Extra" convention elsewhere in the app
// (see the student Courses page filters) — the part before " - " is the
// subject. Falls back to the full title when there's no separator.
const subjectOf = (title) => title?.split(" - ")[0]?.trim() ?? title;

const indianCitiesByState = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Naharlagun"],
  Assam: ["Guwahati", "Dibrugarh", "Jorhat", "Silchar"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  Chhattisgarh: ["Raipur", "Bhilai", "Korba", "Durg"],
  Goa: ["Panaji", "Margao", "Vasco da Gama"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Manali"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangalore", "Hubli"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Manipur: ["Imphal", "Churachandpur"],
  Meghalaya: ["Shillong", "Tura"],
  Mizoram: ["Aizawl", "Lunglei"],
  Nagaland: ["Kohima", "Dimapur"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela"],
  Punjab: ["Chandigarh", "Amritsar", "Ludhiana", "Jalandhar"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  Sikkim: ["Gangtok", "Namchi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad"],
  Tripura: ["Agartala", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra"],
  Uttarakhand: ["Dehradun", "Haridwar", "Nainital"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
  "Jammu & Kashmir": ["Srinagar", "Jammu"],
  Ladakh: ["Leh", "Kargil"],
  Puducherry: ["Puducherry", "Karaikal"],
  ...INDIA_CITIES_BY_STATE,
};

const ROLE_OPTIONS = ["student", "instructor", "admin", "staff"];

/* ─── Avatar ──────────────────────────────────────────── */
const Av = ({ name = "?", size = 36, src }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
        className="flex-shrink-0 shadow-lg"
      />
    );
  }
  return (
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
      className="shadow-lg"
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
};

/* ─── small presentational bits for the modal (larger fonts) ── */
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5">
    <Icon size={16} className="text-slate-500 mt-0.5 flex-none" />
    <div className="min-w-0 flex-1">
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
  maxLength,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div>
      <FieldLabel>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </FieldLabel>
      <div className="relative">
        <input
          type={inputType}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 transition duration-150 pr-10"
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 focus:outline-none transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Add Student Modal ───────────────────────────────── */
const AddStudentModal = ({ courses = [], onClose, onCreated }) => {
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
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleCourse = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const courseSearchLower = courseSearch.trim().toLowerCase();
  const filteredCourses = courseSearchLower
    ? courses.filter((c) => {
      const haystack = [
        c.title,
        subjectOf(c.title),
        c.category,
        c.board,
        c.instructor?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(courseSearchLower);
    })
    : courses;

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
        courseIds: selectedCourses,
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
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
            onChange={(val) => set("phoneNumber")(val.replace(/\D/g, ""))}
            placeholder="10-digit mobile number"
            maxLength={10}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>State <span className="text-red-400 ml-1">*</span></FieldLabel>
              <select
                value={form.state}
                onChange={(e) => {
                  setForm((f) => ({ ...f, state: e.target.value, city: "" }));
                }}
                className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white transition duration-150"
                required
              >
                <option value="">Select State</option>
                {Object.keys(indianCitiesByState).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>City <span className="text-red-400 ml-1">*</span></FieldLabel>
              <select
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white transition duration-150 disabled:opacity-50"
                disabled={!form.state}
                required
              >
                <option value="">{form.state ? "Select City" : "Choose State First"}</option>
                {(indianCitiesByState[form.state] || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <TextField
            label="Pincode"
            value={form.pincode}
            onChange={set("pincode")}
            placeholder="6-digit pincode"
            required
          />

          <FieldLabel>Assign Courses (Optional)</FieldLabel>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Search courses by title, subject, class, or board…"
              className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 transition duration-150"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {courses.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No courses available.</p>
            ) : filteredCourses.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No courses match "{courseSearch}".
              </p>
            ) : (
              filteredCourses.map((c) => {
                const active = selectedCourses.includes(c._id);
                const subject = subjectOf(c.title);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => toggleCourse(c._id)}
                    className={`w-full text-left rounded-xl border p-3.5 transition ${active
                      ? "bg-emerald-500/10 border-emerald-500/40"
                      : "bg-slate-900/40 border-slate-700 hover:border-slate-600"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold text-sm truncate ${active ? "text-emerald-300" : "text-white"}`}>
                          {c.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {subject && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-[10px] font-bold text-sky-300 uppercase tracking-wide">
                              <Tag size={10} className="flex-none" />
                              {subject}
                            </span>
                          )}
                          {c.category && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-semibold text-slate-300 uppercase tracking-wide">
                              {c.category}
                            </span>
                          )}
                          {c.board && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-semibold text-purple-300 uppercase tracking-wide">
                              {c.board}
                            </span>
                          )}
                        </div>

                        {(c.instructor?.name || c.instructor?.email) ? (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 pt-2.5 border-t border-slate-800/70">
                            {c.instructor?.name && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                                <GraduationCap size={12} className="flex-none text-slate-500" />
                                <span className="truncate">{c.instructor.name}</span>
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex-none pt-0.5">
                        {active ? (
                          <CheckCircle2 size={19} className="text-emerald-400" />
                        ) : (
                          <div className="w-[19px] h-[19px] rounded-full border-2 border-slate-700" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
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
    </div>,
    document.body
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
    // Single role field — editable here as a simple select
    role: student.role || "student",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

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
        role: form.role,
      };
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <Av name={student.name} src={student.avatarUrl} size={40} />
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
            onChange={(val) => set("phoneNumber")(val.replace(/\D/g, ""))}
            maxLength={10}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>State</FieldLabel>
              <select
                value={form.state}
                onChange={(e) => {
                  setForm((f) => ({ ...f, state: e.target.value, city: "" }));
                }}
                className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white transition duration-150"
              >
                <option value="">Select State</option>
                {Object.keys(indianCitiesByState).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>City</FieldLabel>
              <select
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white transition duration-150 disabled:opacity-50"
                disabled={!form.state}
              >
                <option value="">{form.state ? "Select City" : "Choose State First"}</option>
                {(indianCitiesByState[form.state] || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
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
            <FieldLabel>Role</FieldLabel>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
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
    </div>,
    document.body
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
  const rupeeValue = (coins / 25).toFixed(2);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <Av name={student.name} src={student.avatarUrl} size={46} />
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
              label="Parent's Mobile"
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
              label="Role"
              value={student.role || "student"}
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
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${val
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
    </div>,
    document.body
  );
};

/* ─── Assign Course Modal ────────────────────────────── */
const AssignCourseModal = ({ student, courses = [], onClose, onAssigned }) => {
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const enrolledCourseIds = new Set(
    courses
      .filter((c) => c.students?.some((sid) => (sid._id || sid) === student._id))
      .map((c) => c._id)
  );

  const availableCourses = courses.filter((c) => !enrolledCourseIds.has(c._id));

  const uniqueClasses = Array.from(
    new Set(availableCourses.map((c) => c.category).filter(Boolean))
  ).sort();

  const uniqueSubjects = Array.from(
    new Set(availableCourses.map((c) => subjectOf(c.title)).filter(Boolean))
  ).sort();

  const filteredCourses = availableCourses.filter((c) => {
    const subject = subjectOf(c.title);
    const matchesSearch =
      !searchQuery ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (subject && subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.instructor?.name && c.instructor.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.instructor?.email && c.instructor.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass = !classFilter || c.category === classFilter;
    const matchesSubject = !subjectFilter || subject === subjectFilter;

    return matchesSearch && matchesClass && matchesSubject;
  });

  const toggleCourse = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      setError("Please select at least one course.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/courses/enroll", {
        courseIds: selectedCourses,
        studentId: student._id,
      });
      if (onAssigned) await onAssigned();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to assign courses."
      );
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <Av name={student.name} src={student.avatarUrl} size={40} />
            <div className="min-w-0">
              <p className="text-base font-extrabold text-white truncate">
                Assign Courses
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
          <div className="flex items-center justify-between">
            <FieldLabel>Select courses to assign</FieldLabel>
            {availableCourses.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-900/60 border border-slate-800 rounded-md px-2 py-0.5">
                Showing {filteredCourses.length} of {availableCourses.length}
              </span>
            )}
          </div>

          {availableCourses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/20 p-3 rounded-xl border border-slate-800/80">
              <div className="sm:col-span-2 relative">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/40 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition duration-150"
                />
              </div>

              <div>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full bg-slate-900/40 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2 px-3 text-xs text-white transition duration-150"
                >
                  <option value="">All Classes</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full bg-slate-900/40 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2 px-3 text-xs text-white transition duration-150"
                >
                  <option value="">All Subjects</option>
                  {uniqueSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {availableCourses.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              This student is already enrolled in all available courses.
            </p>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500 italic text-sm border border-dashed border-slate-800 rounded-xl">
              No courses match your filter criteria.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[26rem] overflow-y-auto pr-1">
              {filteredCourses.map((c) => {
                const active = selectedCourses.includes(c._id);
                const subject = subjectOf(c.title);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => toggleCourse(c._id)}
                    className={`w-full text-left rounded-xl border p-3.5 transition ${active
                      ? "bg-emerald-500/10 border-emerald-500/40"
                      : "bg-slate-900/40 border-slate-700 hover:border-slate-600"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {/* Course title */}
                        <p
                          className={`font-semibold text-sm truncate ${active ? "text-emerald-300" : "text-white"
                            }`}
                        >
                          {c.title}
                        </p>

                        {/* Subject / class / board badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {subject && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-[10px] font-bold text-sky-300 uppercase tracking-wide">
                              <Tag size={10} className="flex-none" />
                              {subject}
                            </span>
                          )}
                          {c.category && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-semibold text-slate-300 uppercase tracking-wide">
                              {c.category}
                            </span>
                          )}
                          {c.board && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-semibold text-purple-300 uppercase tracking-wide">
                              {c.board}
                            </span>
                          )}
                        </div>

                        {/* Instructor name + email, or a flag when missing */}
                        {c.instructor?.name || c.instructor?.email ? (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 pt-2.5 border-t border-slate-800/70">
                            {c.instructor?.name && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                                <GraduationCap
                                  size={12}
                                  className="flex-none text-slate-500"
                                />
                                <span className="truncate">
                                  {c.instructor.name}
                                </span>
                              </span>
                            )}
                            {c.instructor?.email && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                                <Mail
                                  size={11}
                                  className="flex-none text-slate-600"
                                />
                                <span className="truncate">
                                  {c.instructor.email}
                                </span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-800/70 text-[11px] font-medium text-amber-400/80 italic">
                            <AlertCircle size={11} className="flex-none" />
                            Instructor account deleted
                          </div>
                        )}
                      </div>

                      {/* Selection indicator */}
                      <div className="flex-none pt-0.5">
                        {active ? (
                          <CheckCircle2
                            size={19}
                            className="text-emerald-400"
                          />
                        ) : (
                          <div className="w-[19px] h-[19px] rounded-full border-2 border-slate-700" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-300 mt-2">
              <AlertCircle size={15} className="mt-0.5 flex-none" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || availableCourses.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <BookPlus size={15} />
                  Assign Selected
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
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
  const approvedCourses = courses.filter((c) => c.approvalStatus === "approved");
  const ql = q.toLowerCase();
  const filtS = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(ql) ||
      s.email?.toLowerCase().includes(ql) ||
      s.phoneNumber?.toLowerCase().includes(ql),
  );
  const bulkFileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [importStats, setImportStats] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(null);
  const [addingStudent, setAddingStudent] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImportCourses, setBulkImportCourses] = useState([]);
  const [bulkCourseSearch, setBulkCourseSearch] = useState("");

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

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full md:w-auto">
          <div className="relative w-full sm:flex-1 md:flex-none md:w-72 shrink-0">
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
              onClick={() => {
                setBulkImportFile(null);
                setBulkImportCourses([]);
                setBulkCourseSearch("");
                setImportError("");
                setShowBulkImportModal(true);
              }}
              disabled={importing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition disabled:opacity-60"
            >
              <Upload size={14} />
              {importing ? "Importing..." : "Bulk Import"}
            </button>
          )}
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
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-slate-900/35 border border-slate-800/80 rounded-2xl transition duration-150 hover:border-slate-700/60"
            >
              <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                <Av name={s.name} src={s.avatarUrl} size={36} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {s.name}
                  </p>
                  {s.phoneNumber && (
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                      {s.phoneNumber}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {s.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0 justify-start sm:justify-end w-full sm:w-auto">
                {/* Role tag */}
                {(() => {
                  const role = s.role || "student";
                  return (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                      {role}
                    </span>
                  );
                })()}
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

                {/* Assign button */}
                {canEdit && (
                  <button
                    onClick={() => setAssigningStudent(s)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition duration-150"
                  >
                    <BookPlus size={12} />
                    Assign
                  </button>
                )}

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
                        deleteUser(s._id, "student");
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
          courses={approvedCourses}
          onClose={() => setAddingStudent(false)}
          onCreated={handleMutationSuccess}
        />
      )}

      {assigningStudent && (
        <AssignCourseModal
          student={assigningStudent}
          courses={approvedCourses}
          onClose={() => setAssigningStudent(null)}
          onAssigned={handleMutationSuccess}
        />
      )}

      {showBulkImportModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowBulkImportModal(false)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <Upload size={20} className="text-indigo-400" />
                <p className="text-base font-extrabold text-white">Bulk Import Students</p>
              </div>
              <button
                onClick={() => setShowBulkImportModal(false)}
                className="flex-none p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* File upload area */}
              <div>
                <FieldLabel>Student File <span className="text-red-400 ml-1">*</span></FieldLabel>
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const accepted = /\.(csv|xlsx|xls|docx|txt)$/i.test(file.name);
                    if (!accepted) {
                      setImportError("Supported formats: CSV, Excel (.xlsx/.xls), DOCX, or TXT");
                      e.target.value = "";
                      return;
                    }
                    setImportError("");
                    setBulkImportFile(file);
                    e.target.value = "";
                  }}
                />
                {bulkImportFile ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-200 truncate">{bulkImportFile.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{(bulkImportFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBulkImportFile(null)}
                      className="flex-none p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => bulkFileInputRef.current?.click()}
                    className="w-full rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-900/30 hover:bg-indigo-500/5 p-6 transition duration-150 group"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-slate-500 group-hover:text-indigo-400 transition" />
                      <p className="text-sm font-semibold text-slate-300 group-hover:text-white transition">Click to select file</p>
                      <p className="text-[11px] text-slate-500">CSV, Excel (.xlsx/.xls), DOCX, or TXT</p>
                    </div>
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-300">
                <p className="font-semibold text-slate-200 mb-1">Expected columns</p>
                <p className="text-slate-400">
                  <span className="font-medium">name</span>,{" "}
                  <span className="font-medium">email</span>,{" "}
                  <span className="font-medium">phoneNumber</span>,{" "}
                  <span className="font-medium">password</span>,{" "}
                  <span className="font-medium">city</span>,{" "}
                  <span className="font-medium">state</span>,{" "}
                  <span className="font-medium">pincode</span>
                </p>
              </div>

              {/* Course selection */}
              <div>
                <FieldLabel>Assign Courses (Optional)</FieldLabel>
                <div className="relative mb-2">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="text"
                    value={bulkCourseSearch}
                    onChange={(e) => setBulkCourseSearch(e.target.value)}
                    placeholder="Search courses…"
                    className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 transition duration-150"
                  />
                </div>
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {(() => {
                    const searchLower = bulkCourseSearch.trim().toLowerCase();
                    const filtered = searchLower
                      ? approvedCourses.filter((c) => {
                        const haystack = [c.title, subjectOf(c.title), c.category, c.board, c.instructor?.name]
                          .filter(Boolean).join(" ").toLowerCase();
                        return haystack.includes(searchLower);
                      })
                      : approvedCourses;

                    if (approvedCourses.length === 0) {
                      return <p className="text-sm text-slate-500 italic">No courses available.</p>;
                    }
                    if (filtered.length === 0) {
                      return <p className="text-sm text-slate-500 italic">No courses match "{bulkCourseSearch}".</p>;
                    }
                    return filtered.map((c) => {
                      const active = bulkImportCourses.includes(c._id);
                      const subject = subjectOf(c.title);
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            setBulkImportCourses((prev) =>
                              prev.includes(c._id) ? prev.filter((id) => id !== c._id) : [...prev, c._id]
                            );
                          }}
                          className={`w-full text-left rounded-xl border p-3.5 transition ${active
                            ? "bg-emerald-500/10 border-emerald-500/40"
                            : "bg-slate-900/40 border-slate-700 hover:border-slate-600"
                            }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold text-sm truncate ${active ? "text-emerald-300" : "text-white"}`}>
                                {c.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                {subject && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-[10px] font-bold text-sky-300 uppercase tracking-wide">
                                    <Tag size={10} className="flex-none" />
                                    {subject}
                                  </span>
                                )}
                                {c.category && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-semibold text-slate-300 uppercase tracking-wide">
                                    {c.category}
                                  </span>
                                )}
                                {c.board && (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-semibold text-purple-300 uppercase tracking-wide">
                                    {c.board}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-none pt-0.5">
                              {active ? (
                                <CheckCircle2 size={19} className="text-emerald-400" />
                              ) : (
                                <div className="w-[19px] h-[19px] rounded-full border-2 border-slate-700" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {importError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
                  <AlertCircle size={15} className="mt-0.5 flex-none" />
                  <p className="text-xs">{importError}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => setShowBulkImportModal(false)}
                  disabled={importing}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!bulkImportFile) {
                      setImportError("Please select a file to import.");
                      return;
                    }
                    setImporting(true);
                    setImportError("");
                    setImportSuccess("");
                    setImportStats(null);

                    const formData = new FormData();
                    formData.append("file", bulkImportFile);
                    if (bulkImportCourses.length > 0) {
                      formData.append("courseIds", JSON.stringify(bulkImportCourses));
                    }

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
                      setShowBulkImportModal(false);
                    } catch (err) {
                      setImportError(err.response?.data?.message || err.message || "Import failed.");
                    } finally {
                      setImporting(false);
                    }
                  }}
                  disabled={importing || !bulkImportFile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-60"
                >
                  {importing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      Import Students
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminStudents;
