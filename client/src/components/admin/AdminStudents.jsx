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
  Sparkles,
  CheckCircle2,
  Users,
  FileSpreadsheet,
  Key,
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
    role: student.role || "student",
    fatherName: student.fatherName || "",
    motherName: student.motherName || "",
    fatherMobileNumber: student.fatherMobileNumber || "",
    socialMediaAccount: student.socialMediaAccount || "",
    vidhansabha: student.vidhansabha || "",
    reference: student.reference || "",
    fullAddress: student.fullAddress || "",
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
        fatherName: form.fatherName.trim(),
        motherName: form.motherName.trim(),
        fatherMobileNumber: form.fatherMobileNumber.trim(),
        socialMediaAccount: form.socialMediaAccount.trim(),
        vidhansabha: form.vidhansabha.trim(),
        reference: form.reference.trim(),
        fullAddress: form.fullAddress.trim(),
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
            label="Father's Name"
            value={form.fatherName}
            onChange={set("fatherName")}
          />
          <TextField
            label="Mother's Name"
            value={form.motherName}
            onChange={set("motherName")}
          />
          <TextField
            label="Parent's Mobile"
            value={form.fatherMobileNumber}
            onChange={set("fatherMobileNumber")}
          />
          <TextField
            label="Social Media Account"
            value={form.socialMediaAccount}
            onChange={set("socialMediaAccount")}
            placeholder="Instagram / Facebook URL"
          />
          <TextField
            label="Vidhansabha"
            value={form.vidhansabha}
            onChange={set("vidhansabha")}
          />
          <TextField
            label="Reference"
            value={form.reference}
            onChange={set("reference")}
          />
          <div>
            <FieldLabel>Full Address</FieldLabel>
            <textarea
              value={form.fullAddress}
              onChange={(e) => set("fullAddress")(e.target.value)}
              placeholder="House no., street, city, state, pincode"
              className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white transition duration-150"
              rows={2}
            />
          </div>
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
const StudentDetailsModal = ({ student, courses = [], onClose, onEdit, onChangePassword, refreshUsers }) => {
  const [showCourseManager, setShowCourseManager] = useState(false);
  if (!student) return null;

  const subscription = student.subscription || {};
  const hasActivePlan =
    subscription.status === "active" &&
    subscription.plan &&
    student.selectedClass;

  // ── Build enrolled course map ─────────────────────────────────────────────
  // Sources (in priority order):
  //   1. student.enrolledCourses (direct purchase / admin-assigned) — now
  //      populated with full objects from the server after Task 1 fix
  //   2. courses[].students cross-reference (catches legacy records)
  //   3. Plan subscription: all approved courses whose category matches the
  //      student's selectedClass (students on a plan never get courseIds
  //      written to enrolledCourses — their access is subscription-based)
  const enrolledMap = new Map();
  const studentEnrolledIds = new Set(
    (student.enrolledCourses || [])
      .map((ec) => {
        if (typeof ec === "string") return ec;
        if (ec && ec._id) return ec._id.toString();
        return ec?.toString() || "";
      })
      .filter(Boolean),
  );

  courses.forEach((c) => {
    if (
      studentEnrolledIds.has(c._id.toString()) ||
      c.students?.some((sid) => (sid._id || sid).toString() === student._id?.toString())
    ) {
      enrolledMap.set(c._id.toString(), { ...c, _viaPlan: false });
    }
  });

  // Hydrate from populated enrolledCourses objects (server now returns these)
  (student.enrolledCourses || []).forEach((ec) => {
    if (ec && typeof ec === "object" && ec._id) {
      const idStr = ec._id.toString();
      if (!enrolledMap.has(idStr)) {
        enrolledMap.set(idStr, {
          _id: ec._id,
          title: ec.title || "Enrolled Course",
          category: ec.category || "",
          thumbnailUrl: ec.thumbnailUrl || null,
          instructor: ec.instructor || null,
          _viaPlan: false,
        });
      }
    }
  });

  // Add plan-based courses: match approved courses by selectedClass category
  if (hasActivePlan) {
    const classLower = student.selectedClass.toLowerCase();
    courses.forEach((c) => {
      const idStr = c._id.toString();
      if (
        !enrolledMap.has(idStr) &&
        c.category?.toLowerCase() === classLower &&
        (c.approvalStatus === "approved" || c.published)
      ) {
        enrolledMap.set(idStr, { ...c, _viaPlan: true });
      }
    });
  }

  const enrolled = Array.from(enrolledMap.values());
  const enrolledFromProfile = [];

  const coins = typeof student.coins === "number" ? student.coins : 0;
  const rupeeValue = (coins / 25).toFixed(2);

  const assistanceSet = new Set(
    (student.instructorAssistanceCourses || []).map((c) =>
      (c._id || c).toString(),
    ),
  );

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
            {onChangePassword && (
              <button
                onClick={onChangePassword}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition"
              >
                <Key size={14} />
                Password
              </button>
            )}
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

          {/* Courses Section with Manage Button */}
          <div className="flex items-center justify-between gap-3 mt-6 mb-2">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-400" />
              <h3 className="text-sm font-extrabold text-white">
                Enrolled Courses ({enrolled.length || enrolledFromProfile.length})
                {hasActivePlan && enrolled.some((c) => c._viaPlan) && (
                  <span className="ml-2 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5 align-middle">
                    includes plan courses
                  </span>
                )}
              </h3>
            </div>
            <button
              onClick={() => setShowCourseManager(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 transition shadow-sm hover:scale-105 active:scale-95"
            >
              <BookPlus size={14} />
              Manage & Assign / Unassign Courses
            </button>
          </div>

          {enrolled.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {enrolled.map((c) => {
                const hasAssistance = assistanceSet.has(c._id.toString());
                return (
                  <li
                    key={c._id}
                    className="flex items-center justify-between gap-3 text-sm text-slate-300 bg-slate-900/50 border border-slate-800/80 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {c.thumbnailUrl ? (
                        <img src={c.thumbnailUrl} alt={c.title} className="w-10 h-10 rounded-lg object-cover border border-slate-700 flex-none" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 flex-none">
                          <BookOpen size={16} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-bold text-xs text-white">{c.title}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.instructor?.name ? `Instructor: ${c.instructor.name}` : c.category || "Course"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-none">
                      {c._viaPlan && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          📋 Via Plan
                        </span>
                      )}
                      {hasAssistance && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                          ✨ Assistance
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
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
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
              <p className="text-xs text-slate-400">Not enrolled in any course yet.</p>
              <button
                onClick={() => setShowCourseManager(true)}
                className="mt-2 text-xs text-indigo-400 font-bold hover:underline"
              >
                + Assign First Course
              </button>
            </div>
          )}

          {/* Modal Overlay for Course Manager */}
          {showCourseManager && (
            <StudentCourseManagerModal
              student={student}
              courses={courses}
              onClose={() => setShowCourseManager(false)}
              onUpdated={refreshUsers}
            />
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

/* ─── Student Course Manager Modal (View, Assign, Unassign, Assistance) ─────── */
const StudentCourseManagerModal = ({ student, courses = [], onClose, onUpdated }) => {
  const [activeTab, setActiveTab] = useState("assigned"); // "assigned" | "available"
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedToAssign, setSelectedToAssign] = useState([]);
  const [withAssistanceNew, setWithAssistanceNew] = useState(false);

  // ── Plan subscription check ───────────────────────────────────────────────
  const subscription = student.subscription || {};
  const hasActivePlan =
    subscription.status === "active" &&
    subscription.plan &&
    student.selectedClass;

  // Standard & Premium plans include instructor assistance by default for all plan courses.
  // Basic plan does NOT include assistance.
  const isPremiumOrStandardPlan =
    subscription.plan === "standard" ||
    subscription.plan === "premium" ||
    subscription.plan === "elite";

  // ── Build assistance set ─────────────────────────────────────────────────
  // Start with the student's existing instructorAssistanceCourses, then seed
  // plan courses with assistance if they're on standard/premium plan.
  const [assistanceCourses, setAssistanceCourses] = useState(() => {
    const set = new Set(
      (student.instructorAssistanceCourses || []).map((c) =>
        (c._id || c).toString(),
      ),
    );

    // Auto-seed assistance for plan courses when standard or premium plan is active
    if (hasActivePlan && isPremiumOrStandardPlan && student.selectedClass) {
      const classLower = student.selectedClass.toLowerCase();
      courses.forEach((c) => {
        if (
          c.category?.toLowerCase() === classLower &&
          (c.approvalStatus === "approved" || c.published)
        ) {
          set.add(c._id.toString());
        }
      });
    }

    return set;
  });

  const studentEnrolledIds = new Set(
    (student.enrolledCourses || [])
      .map((ec) => {
        if (typeof ec === "string") return ec;
        if (ec && ec._id) return ec._id.toString();
        return ec?.toString() || "";
      })
      .filter(Boolean),
  );

  courses.forEach((c) => {
    if (c.students?.some((sid) => (sid._id || sid).toString() === student._id?.toString())) {
      studentEnrolledIds.add(c._id.toString());
    }
  });

  const assignedCoursesMap = new Map();

  // Source 1: Direct enrollments (cart purchase or admin assign)
  courses.forEach((c) => {
    if (studentEnrolledIds.has(c._id.toString())) {
      assignedCoursesMap.set(c._id.toString(), { ...c, _viaPlan: false });
    }
  });

  // Source 2: Populated enrolledCourses objects from server
  (student.enrolledCourses || []).forEach((ec) => {
    if (ec && typeof ec === "object" && ec._id) {
      const idStr = ec._id.toString();
      if (!assignedCoursesMap.has(idStr)) {
        assignedCoursesMap.set(idStr, {
          _id: ec._id,
          title: ec.title || "Enrolled Course",
          category: ec.category || "",
          board: ec.board || "",
          price: ec.price ?? 0,
          thumbnailUrl: ec.thumbnailUrl || null,
          instructor: ec.instructor || null,
          _viaPlan: false,
        });
      }
    }
  });

  // Source 3: Plan-based courses (subscription + selectedClass category match)
  if (hasActivePlan) {
    const classLower = student.selectedClass.toLowerCase();
    const excludedIds = new Set(
      (student.planExcludedCourses || []).map((id) => (id._id || id).toString()),
    );

    courses.forEach((c) => {
      const idStr = c._id.toString();
      if (
        !assignedCoursesMap.has(idStr) &&
        !excludedIds.has(idStr) &&
        c.category?.toLowerCase() === classLower &&
        (c.approvalStatus === "approved" || c.published)
      ) {
        assignedCoursesMap.set(idStr, { ...c, _viaPlan: true });
      }
    });
  }

  const assignedCourses = Array.from(assignedCoursesMap.values());
  const assignedIds = new Set(assignedCourses.map((c) => c._id.toString()));
  const availableCourses = courses.filter((c) => !assignedIds.has(c._id.toString()));

  const uniqueClasses = Array.from(
    new Set(courses.map((c) => c.category).filter(Boolean)),
  ).sort();

  const uniqueSubjects = Array.from(
    new Set(courses.map((c) => subjectOf(c.title)).filter(Boolean)),
  ).sort();

  const filterCourseList = (list) => {
    return list.filter((c) => {
      const subject = subjectOf(c.title);
      const qLower = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !qLower ||
        c.title?.toLowerCase().includes(qLower) ||
        (c.category && c.category.toLowerCase().includes(qLower)) ||
        (subject && subject.toLowerCase().includes(qLower)) ||
        (c.instructor?.name && c.instructor.name.toLowerCase().includes(qLower));

      const matchesClass = !classFilter || c.category === classFilter;
      const matchesSubject = !subjectFilter || subject === subjectFilter;

      return matchesSearch && matchesClass && matchesSubject;
    });
  };

  const filteredAssigned = filterCourseList(assignedCourses);
  const filteredAvailable = filterCourseList(availableCourses);

  const toggleSelectAssign = (id) => {
    setSelectedToAssign((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleUnassignCourse = async (courseId) => {
    setActionLoadingId(courseId);
    setError("");
    setSuccessMsg("");
    try {
      await api.post("/courses/unassign", {
        studentId: student._id,
        courseIds: [courseId],
      });
      setSuccessMsg("Course unassigned successfully.");
      if (onUpdated) await onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to unassign course.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleAssistance = async (courseId, enable, isViaPlan = false) => {
    setActionLoadingId(courseId);
    setError("");
    setSuccessMsg("");
    try {
      if (isViaPlan) {
        // For plan courses use the plan-exclude endpoint which handles assistance
        // as part of the same call — no need to hit toggle-assistance separately.
        await api.post("/courses/plan-exclude", {
          studentId: student._id,
          courseId,
          excluded: false,
          assistanceEnabled: enable,
        });
      } else {
        await api.post("/courses/toggle-assistance", {
          studentId: student._id,
          courseId,
          enabled: enable,
        });
      }
      setAssistanceCourses((prev) => {
        const next = new Set(prev);
        if (enable) next.add(courseId.toString());
        else next.delete(courseId.toString());
        return next;
      });
      setSuccessMsg(`Instructor assistance ${enable ? "enabled" : "disabled"}.`);
      if (onUpdated) await onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update assistance status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove a plan course from this student's access by adding it to
  // planExcludedCourses. This hides it from the student's enrolled list
  // without affecting other plan students.
  const handleRemovePlanAccess = async (courseId) => {
    setActionLoadingId(courseId);
    setError("");
    setSuccessMsg("");
    try {
      await api.post("/courses/plan-exclude", {
        studentId: student._id,
        courseId,
        excluded: true,
      });
      setSuccessMsg("Plan access removed for this course.");
      if (onUpdated) await onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to remove plan access.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Restore a plan course that was previously excluded
  const handleRestorePlanAccess = async (courseId) => {
    setActionLoadingId(courseId);
    setError("");
    setSuccessMsg("");
    try {
      await api.post("/courses/plan-exclude", {
        studentId: student._id,
        courseId,
        excluded: false,
        assistanceEnabled: isPremiumPlan,
      });
      setSuccessMsg("Plan access restored.");
      if (onUpdated) await onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to restore plan access.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBatchAssign = async () => {
    if (selectedToAssign.length === 0) {
      setError("Please select at least one course to assign.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      await api.post("/courses/enroll", {
        studentId: student._id,
        courseIds: selectedToAssign,
        withInstructorAssistance: withAssistanceNew,
      });
      setSuccessMsg(`Assigned ${selectedToAssign.length} course(s) to ${student.name}.`);
      setSelectedToAssign([]);
      if (onUpdated) await onUpdated();
      setActiveTab("assigned");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to assign courses.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-[#090e1a] shadow-2xl overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-slate-800/80 bg-[#0f172a]/90 backdrop-blur shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <Av name={student.name} src={student.avatarUrl} size={48} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white truncate">{student.name}</h3>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  {assignedCourses.length} Assigned
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {student.email || student.phoneNumber || "Student Account"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 bg-[#070b14] space-y-4 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab("assigned")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${activeTab === "assigned"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                <BookOpen size={14} />
                Assigned Courses ({assignedCourses.length})
              </button>
              <button
                onClick={() => setActiveTab("available")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${activeTab === "available"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                <BookPlus size={14} />
                Assign New Courses ({availableCourses.length})
              </button>
            </div>

            {/* Quick status feedback */}
            {successMsg && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 animate-fadeIn">
                ✓ {successMsg}
              </span>
            )}
          </div>

          {/* Search & Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by course title, category, or instructor…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111726] border border-slate-800 hover:border-slate-700 focus:border-indigo-500 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 transition"
              />
            </div>

            <div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full bg-[#111726] border border-slate-800 hover:border-slate-700 focus:border-indigo-500 outline-none rounded-xl py-2 px-3 text-xs text-white transition"
              >
                <option value="">All Categories / Classes</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full bg-[#111726] border border-slate-800 hover:border-slate-700 focus:border-indigo-500 outline-none rounded-xl py-2 px-3 text-xs text-white transition"
              >
                <option value="">All Subjects</option>
                {uniqueSubjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-red-300 text-xs">
              <AlertCircle size={16} className="mt-0.5 flex-none" />
              <p>{error}</p>
            </div>
          )}

          {/* TAB 1: ASSIGNED COURSES */}
          {activeTab === "assigned" && (
            <>
              {assignedCourses.length === 0 ? (
                <div className="text-center py-14 px-4 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                  <BookOpen size={36} className="text-slate-600 mx-auto mb-3" />
                  <h4 className="text-slate-200 font-bold text-sm">No courses assigned yet</h4>
                  <p className="text-slate-500 text-xs mt-1">Switch to the "Assign New Courses" tab to enroll this student in courses.</p>
                </div>
              ) : filteredAssigned.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                  No assigned courses match "{searchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredAssigned.map((c) => {
                    const cid = c._id.toString();
                    const hasAssistance = assistanceCourses.has(cid);
                    const isLoadingThis = actionLoadingId === c._id;
                    const subject = subjectOf(c.title);
                    const isViaPlan = Boolean(c._viaPlan);

                    return (
                      <div
                        key={c._id}
                        className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all shadow-md ${isViaPlan
                            ? "border-emerald-800/50 bg-emerald-950/20 hover:bg-emerald-950/30 hover:border-emerald-700/60"
                            : "border-slate-800/90 bg-[#111827]/80 hover:bg-[#131b2e] hover:border-slate-700/80"
                          }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          {c.thumbnailUrl ? (
                            <img
                              src={c.thumbnailUrl}
                              alt={c.title}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-700/80 shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-900 to-violet-950 border border-indigo-800/60 flex items-center justify-center text-indigo-300 font-bold shrink-0 mt-0.5">
                              <BookOpen size={22} />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-white leading-snug line-clamp-2">
                                {c.title}
                              </h4>
                              {isViaPlan && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 shrink-0">
                                  📋 {isPremiumPlan ? "Premium Plan" : "Basic Plan"}
                                </span>
                              )}
                            </div>
                            {c.instructor?.name && (
                              <p className="text-[11px] text-indigo-400 font-medium mt-1 flex items-center gap-1">
                                <GraduationCap size={12} className="text-indigo-400" />
                                {c.instructor.name}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {subject && (
                                <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-[10px] font-bold text-sky-300 uppercase tracking-wide">
                                  {subject}
                                </span>
                              )}
                              {c.category && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-semibold text-purple-300 uppercase tracking-wide">
                                  {c.category}
                                </span>
                              )}
                              {c.board && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-300 uppercase tracking-wide">
                                  {c.board}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-extrabold text-slate-300">
                                ₹{c.price ?? 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right side controls */}
                        <div className="flex items-center gap-2.5 justify-end shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                          {/* Toggle Instructor Assistance — admin can always toggle regardless of plan type */}
                          <button
                            onClick={() => handleToggleAssistance(c._id, !hasAssistance, isViaPlan)}
                            disabled={isLoadingThis}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${hasAssistance
                                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                              }`}
                            title={
                              isViaPlan && !isPremiumPlan
                                ? "Basic plan doesn't include assistance by default, but admin can enable it manually"
                                : "Toggle whether student can ask instructor doubts for this course"
                            }
                          >
                            <Sparkles size={13} className={hasAssistance ? "text-indigo-400" : "text-slate-500"} />
                            {hasAssistance ? "Assistance ON" : "Assistance OFF"}
                          </button>

                          {/* Remove / Unassign button — context-aware */}
                          {isViaPlan ? (
                            <button
                              onClick={() => handleRemovePlanAccess(c._id)}
                              disabled={isLoadingThis}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition disabled:opacity-50"
                              title="Remove this course from the student's plan access"
                            >
                              {isLoadingThis ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                              Remove Plan Access
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnassignCourse(c._id)}
                              disabled={isLoadingThis}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50"
                            >
                              {isLoadingThis ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                              Unassign
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 2: ASSIGN NEW COURSES */}
          {activeTab === "available" && (
            <>
              {availableCourses.length === 0 ? (
                <div className="text-center py-14 px-4 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                  <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-slate-200 font-bold text-sm">All courses already assigned</h4>
                  <p className="text-slate-500 text-xs mt-1">This student is already enrolled in all available courses in the academy.</p>
                </div>
              ) : filteredAvailable.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                  No courses match "{searchQuery}".
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top options bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={withAssistanceNew}
                        onChange={(e) => setWithAssistanceNew(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <Sparkles size={14} className="text-indigo-400" />
                        Include Instructor Assistance (₹500 feature)
                      </span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {selectedToAssign.length} course(s) selected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 max-h-[22rem] overflow-y-auto pr-1">
                    {filteredAvailable.map((c) => {
                      const isSelected = selectedToAssign.includes(c._id);
                      const subject = subjectOf(c.title);

                      return (
                        <div
                          key={c._id}
                          onClick={() => toggleSelectAssign(c._id)}
                          className={`w-full flex items-start justify-between gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${isSelected
                              ? "bg-emerald-500/10 border-emerald-500/40 shadow-md"
                              : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700"
                            }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {c.thumbnailUrl ? (
                              <img
                                src={c.thumbnailUrl}
                                alt={c.title}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0 mt-0.5"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold shrink-0 mt-0.5">
                                <BookOpen size={18} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className={`font-bold text-xs line-clamp-1 ${isSelected ? "text-emerald-300" : "text-white"}`}>
                                {c.title}
                              </p>
                              {c.instructor?.name && (
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                  {c.instructor.name}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {subject && (
                                  <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-[9px] font-bold text-sky-300">
                                    {subject}
                                  </span>
                                )}
                                {c.category && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[9px] font-semibold text-slate-300">
                                    {c.category}
                                  </span>
                                )}
                                {c.board && (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-[9px] font-semibold text-purple-300">
                                    {c.board}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex-none pt-1">
                            {isSelected ? (
                              <CheckCircle2 size={20} className="text-emerald-400" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-slate-700 hover:border-slate-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={handleBatchAssign}
                      disabled={saving || selectedToAssign.length === 0}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <BookPlus size={15} />
                          Assign {selectedToAssign.length > 0 ? `${selectedToAssign.length} Selected Course(s)` : "Courses"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

/* ─── Change Password Modal ──────────────────────────── */
const ChangePasswordModal = ({ user, onClose, onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleGeneratePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.put(`/users/${user._id}`, { password: newPassword.trim() });
      setSuccess(true);
      if (onPasswordChanged) await onPasswordChanged();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to update password.",
      );
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl p-6 space-y-4 font-sans text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Key size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Change Password
              </h3>
              <p className="text-xs text-slate-400">
                {user.name} ({user.email || user.phoneNumber || "User"})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-sm font-bold text-white">Password Updated Successfully</h4>
            <p className="text-xs text-slate-400">The new credentials are active immediately.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition"
                >
                  ⚡ Generate Random
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 chars)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !newPassword}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition shadow-lg shadow-amber-600/30"
              >
                {saving ? "Updating..." : "Set New Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
};

/* ─── Action button used in each student row ──────────── */
const RowAction = ({ icon: Icon, label, onClick, tone = "slate" }) => {
  const tones = {
    slate: "text-slate-300 bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600",
    indigo: "text-indigo-300 bg-indigo-500/10 border-indigo-500/25 hover:bg-indigo-500/20 hover:border-indigo-500/40",
    emerald: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/40",
    amber: "text-amber-300 bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/20 hover:border-amber-500/40",
    sky: "text-sky-300 bg-sky-500/10 border-sky-500/25 hover:bg-sky-500/20 hover:border-sky-500/40",
    red: "text-red-300 bg-red-500/10 border-red-500/25 hover:bg-red-500/20 hover:border-red-500/40",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition duration-150 ${tones[tone]}`}
    >
      <Icon size={12} />
      {label}
    </button>
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
  const enrolledCount = students.filter((s) => {
    const countedIds = new Set();
    courses.forEach((c) => {
      if (c.students?.some((sid) => (sid._id || sid).toString() === s._id?.toString())) {
        countedIds.add(c._id.toString());
      }
    });
    (s.enrolledCourses || []).forEach((ec) => {
      const id = ec?._id ? ec._id.toString() : ec?.toString();
      if (id) countedIds.add(id);
    });
    return countedIds.size > 0 || s.subscription?.status === "active";
  }).length;

  const bulkFileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [importStats, setImportStats] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(null);
  const [passwordStudent, setPasswordStudent] = useState(null);
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

  const EXPECTED_COLUMNS = ["name", "email", "phoneNumber", "password", "city", "state", "pincode"];

  return (
    <div className="flex flex-col gap-6 max-w-5xl animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
              <Users size={12} />
              Accounts Management
            </p>
            <h2 className="text-2xl font-extrabold text-white">Platform Students</h2>
            <p className="text-xs text-slate-500 mt-1">
              View profiles, assign courses, edit records, or add new students.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-start px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 min-w-[92px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</span>
              <span className="text-lg font-extrabold text-white leading-tight">{students.length}</span>
            </div>
            <div className="flex flex-col items-start px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 min-w-[92px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">Enrolled</span>
              <span className="text-lg font-extrabold text-emerald-300 leading-tight">{enrolledCount}</span>
            </div>
            {q && (
              <div className="flex flex-col items-start px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 min-w-[92px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/80">Matching</span>
                <span className="text-lg font-extrabold text-indigo-300 leading-tight">{filtS.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Search + primary actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              className="w-full bg-slate-900/40 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 transition duration-150"
              placeholder="Search by name, email, or phone number…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => setAddingStudent(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition shrink-0"
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
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition disabled:opacity-60 shrink-0"
            >
              <Upload size={14} />
              {importing ? "Importing..." : "Bulk Import"}
            </button>
          )}
        </div>
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
      <div className="flex flex-col gap-2.5">
        {filtS.length > 0 && (
          <div className="flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            <span className="flex-1">Student</span>
            <span className="hidden sm:block w-16 text-right">Role</span>
            <span className="hidden sm:block w-20 text-right">Courses</span>
            <span className="w-auto text-right">Actions</span>
          </div>
        )}

        {filtS.map((s) => {
          // Count all enrolled courses across all three sources:
          //   1. Courses where s._id is in Course.students array
          //   2. s.enrolledCourses (direct purchase / admin-assigned, now populated)
          //   3. Plan-based courses (subscription + selectedClass category match,
          //      minus any planExcludedCourses)
          const countedIds = new Set();

          // Source 1: Course.students cross-reference
          courses.forEach((c) => {
            if (c.students?.some((sid) => (sid._id || sid).toString() === s._id?.toString())) {
              countedIds.add(c._id.toString());
            }
          });

          // Source 2: populated enrolledCourses on the user object
          (s.enrolledCourses || []).forEach((ec) => {
            const id = ec?._id ? ec._id.toString() : ec?.toString();
            if (id) countedIds.add(id);
          });

          // Source 3: plan-based courses
          const sub = s.subscription || {};
          const hasActivePlan =
            sub.status === "active" && sub.plan && s.selectedClass;
          if (hasActivePlan) {
            const classLower = s.selectedClass.toLowerCase();
            const excludedIds = new Set(
              (s.planExcludedCourses || []).map((id) =>
                (id?._id || id).toString(),
              ),
            );
            courses.forEach((c) => {
              const idStr = c._id.toString();
              if (
                !countedIds.has(idStr) &&
                !excludedIds.has(idStr) &&
                c.category?.toLowerCase() === classLower &&
                (c.approvalStatus === "approved" || c.published)
              ) {
                countedIds.add(idStr);
              }
            });
          }

          const studentCoursesCount = countedIds.size;
          const role = s.role || "student";

          return (
            <div
              key={s._id}
              className="flex flex-col lg:flex-row lg:items-center gap-3.5 lg:gap-4 p-4 bg-slate-900/35 border border-slate-800/80 rounded-2xl transition duration-150 hover:border-slate-700/60 hover:bg-slate-900/55"
            >
              {/* Identity */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <Av name={s.name} src={s.avatarUrl} size={40} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-100 truncate">
                    {s.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    {s.phoneNumber && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Phone size={10} className="text-slate-500" />
                        {s.phoneNumber}
                      </span>
                    )}
                    {s.email && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 truncate">
                        <Mail size={10} className="text-slate-600 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-2 shrink-0 lg:w-auto">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full">
                  {role}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${studentCoursesCount > 0
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                      : "bg-slate-800/60 border-slate-700 text-slate-500"
                    }`}
                >
                  <BookOpen size={11} />
                  {studentCoursesCount} course{studentCoursesCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Actions — every capability visible and labeled, no overflow menus */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/60 lg:pl-3 lg:border-l">
                <RowAction icon={Eye} label="Details" tone="indigo" onClick={() => setSelectedStudent(s)} />
                {canEdit && (
                  <RowAction icon={BookPlus} label="Courses" tone="emerald" onClick={() => setAssigningStudent(s)} />
                )}
                {canEdit && (
                  <RowAction icon={Key} label="Password" tone="amber" onClick={() => setPasswordStudent(s)} />
                )}
                {canEdit && (
                  <RowAction icon={Pencil} label="Edit" tone="sky" onClick={() => setEditingStudent(s)} />
                )}
                {canDelete && (
                  <RowAction
                    icon={Trash2}
                    label="Remove"
                    tone="red"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to remove student "${s.name}"?`,
                        )
                      ) {
                        deleteUser(s._id, "student");
                      }
                    }}
                  />
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
          refreshUsers={refreshUsers}
          onChangePassword={
            canEdit
              ? () => {
                  setPasswordStudent(selectedStudent);
                  setSelectedStudent(null);
                }
              : null
          }
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

      {passwordStudent && (
        <ChangePasswordModal
          user={passwordStudent}
          onClose={() => setPasswordStudent(null)}
          onPasswordChanged={handleMutationSuccess}
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
        <StudentCourseManagerModal
          student={assigningStudent}
          courses={courses}
          onClose={() => setAssigningStudent(null)}
          onUpdated={handleMutationSuccess}
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
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <FileSpreadsheet size={18} className="text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{bulkImportFile.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{(bulkImportFile.size / 1024).toFixed(1)} KB</p>
                      </div>
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

              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3.5">
                <p className="font-semibold text-slate-200 text-xs mb-2">Expected columns</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXPECTED_COLUMNS.map((col) => (
                    <span
                      key={col}
                      className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-mono font-semibold text-slate-300"
                    >
                      {col}
                    </span>
                  ))}
                </div>
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