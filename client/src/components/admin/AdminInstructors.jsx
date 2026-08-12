import { useRef, useState, useMemo } from "react";
import {
  Search,
  Trash2,
  BookOpen,
  BookPlus,
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
  EyeOff,
  DollarSign,
  Pencil,
  UserPlus,
  Save,
  Loader2,
  AlertCircle,
  Key,
} from "lucide-react";
import api from "../../config/api.js";
import { INDIA_CITIES_BY_STATE } from "../../data/indiaLocations";

/* ─── helpers ─────────────────────────────────────────── */
const fmt = (n) => (n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`);
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

const roleLabel = (role) =>
  role && typeof role === "object" ? role.name || "Custom Role" : role;

const ROLE_OPTIONS = ["student", "instructor"];

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

/* ─── Avatar ──────────────────────────────────────────── */
const Av = ({ name = "?", size = 44, src }) => {
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
      {multiline ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={maxLength}
          className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 transition duration-150 resize-none"
        />
      ) : (
        <div className="relative">
          <input
            type={inputType}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 transition duration-150 ${type === "password" ? "pr-10" : ""}`}
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
      )}
    </div>
  );
};

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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
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
    role: instructor.role || "instructor",
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
        role: form.role,
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <Av name={instructor.name} src={instructor.avatarUrl} size={40} />
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
    </div>
  );
};

/* ─── Manage Courses (Assign & Unassign) Modal ─────────── */
const AssignCoursesModal = ({
  instructor,
  courses = [],
  instructors = [],
  onClose,
  onAssigned,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("assigned"); // "assigned" | "available"
  const [selectedCourseIds, setSelectedCourseIds] = useState(() => {
    return (courses || [])
      .filter((c) => {
        const instId =
          typeof c.instructor === "object" ? c.instructor?._id : c.instructor;
        return String(instId) === String(instructor._id);
      })
      .map((c) => c._id);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const initialAssignedIds = useMemo(() => {
    return (courses || [])
      .filter((c) => {
        const instId =
          typeof c.instructor === "object" ? c.instructor?._id : c.instructor;
        return String(instId) === String(instructor._id);
      })
      .map((c) => c._id);
  }, [courses, instructor._id]);

  // Currently assigned to this instructor
  const assignedCoursesList = useMemo(() => {
    return (courses || []).filter((c) => selectedCourseIds.includes(c._id));
  }, [courses, selectedCourseIds]);

  // Available to be assigned
  const availableCoursesList = useMemo(() => {
    return (courses || []).filter((c) => !selectedCourseIds.includes(c._id));
  }, [courses, selectedCourseIds]);

  const filteredAssigned = useMemo(() => {
    if (!searchQuery.trim()) return assignedCoursesList;
    const q = searchQuery.toLowerCase();
    return assignedCoursesList.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q),
    );
  }, [assignedCoursesList, searchQuery]);

  const filteredAvailable = useMemo(() => {
    if (!searchQuery.trim()) return availableCoursesList;
    const q = searchQuery.toLowerCase();
    return availableCoursesList.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q),
    );
  }, [availableCoursesList, searchQuery]);

  const handleUnassignCourse = (courseId) => {
    setSelectedCourseIds((prev) => prev.filter((id) => id !== courseId));
  };

  const handleAssignCourse = (courseId) => {
    setSelectedCourseIds((prev) => [...prev, courseId]);
  };

  const handleUnassignAll = () => {
    setSelectedCourseIds([]);
  };

  const handleAssignAllFiltered = () => {
    const toAdd = filteredAvailable.map((c) => c._id);
    setSelectedCourseIds((prev) => Array.from(new Set([...prev, ...toAdd])));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    const unassignedCourseIds = initialAssignedIds.filter(
      (id) => !selectedCourseIds.includes(id),
    );

    try {
      await api.put("/courses/assign-instructor", {
        instructorId: instructor._id,
        courseIds: selectedCourseIds,
        unassignedCourseIds,
      });

      if (onAssigned) await onAssigned();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to update course assignments.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden font-sans text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur flex-none">
          <div className="flex items-center gap-3 min-w-0">
            <Av name={instructor.name} src={instructor.avatarUrl} size={42} />
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-white truncate">
                Manage Instructor Courses
              </h3>
              <p className="text-xs text-indigo-400 font-semibold truncate">
                {instructor.name} ({selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? "s" : ""} currently assigned)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-none p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab & Search Strip */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex flex-col gap-3 flex-none">
          {/* Main Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("assigned")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === "assigned"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen size={13} />
                <span>Assigned Courses ({selectedCourseIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("available")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === "available"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookPlus size={13} />
                <span>Available to Assign ({availableCoursesList.length})</span>
              </button>
            </div>

            {activeTab === "assigned" && selectedCourseIds.length > 0 && (
              <button
                type="button"
                onClick={handleUnassignAll}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition"
              >
                ✕ Unassign All Courses
              </button>
            )}

            {activeTab === "available" && filteredAvailable.length > 0 && (
              <button
                type="button"
                onClick={handleAssignAllFiltered}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
              >
                + Assign All Filtered ({filteredAvailable.length})
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              className="w-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition duration-150"
              placeholder={
                activeTab === "assigned"
                  ? "Search assigned courses to unassign..."
                  : "Search available courses to assign..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 flex items-center gap-2 text-xs flex-none">
            <AlertCircle size={15} className="flex-none" />
            <p>{error}</p>
          </div>
        )}

        {/* Course List */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-2.5">
          {activeTab === "assigned" ? (
            filteredAssigned.length > 0 ? (
              filteredAssigned.map((c) => (
                <div
                  key={c._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 text-white transition hover:bg-indigo-950/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <BookOpen size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{c.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        {c.category && (
                          <span className="bg-slate-800 px-2 py-0.2 rounded text-slate-300 font-medium">
                            {c.category}
                          </span>
                        )}
                        <span>{c.level || "Beginner"}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-400">
                          {c.price ? `₹${c.price}` : "Free"}
                        </span>
                        <span>•</span>
                        <span>{c.students?.length || 0} students</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnassignCourse(c._id)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Trash2 size={13} />
                    <span>Unassign</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <BookOpen size={28} className="mx-auto text-slate-600 mb-1" />
                <p className="font-semibold text-slate-400">No courses assigned to this instructor</p>
                <p>Switch to "Available to Assign" tab to assign learning programs.</p>
              </div>
            )
          ) : filteredAvailable.length > 0 ? (
            filteredAvailable.map((c) => {
              const rawInstId =
                typeof c.instructor === "object"
                  ? c.instructor?._id
                  : c.instructor;
              let currentInstName = "";
              if (typeof c.instructor === "object" && c.instructor?.name) {
                currentInstName = c.instructor.name;
              } else if (rawInstId) {
                const found = (instructors || []).find(
                  (i) => String(i._id) === String(rawInstId),
                );
                if (found) currentInstName = found.name;
              }

              return (
                <div
                  key={c._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-300 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <BookOpen size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {c.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        {c.category && (
                          <span className="bg-slate-800 px-2 py-0.2 rounded text-slate-300 font-medium">
                            {c.category}
                          </span>
                        )}
                        <span>{c.level || "Beginner"}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-400">
                          {c.price ? `₹${c.price}` : "Free"}
                        </span>
                        {currentInstName && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400/90 text-[10px]">
                              Assigned to: {currentInstName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAssignCourse(c._id)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <BookPlus size={13} />
                    <span>Assign</span>
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No available courses found matching your search.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-3 flex-none">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            <span className="font-bold text-white">{selectedCourseIds.length}</span> course{selectedCourseIds.length !== 1 ? "s" : ""} will be assigned to {instructor.name}
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-60 shadow-lg shadow-indigo-600/30"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Assignments
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
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

  return (
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
    </div>
  );
};

const InstructorDetailsModal = ({ instructor, onClose, onEdit, onAssignCourses, onChangePassword }) => {
  if (!instructor) return null;

  const courses = instructor.mc || [];
  const totalRevenue = courses.reduce(
    (sum, c) => sum + (c.price || 0) * (c.students?.length || 0),
    0,
  );

  return (
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
            <Av name={instructor.name} src={instructor.avatarUrl} size={46} />
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
            {onChangePassword && (
              <button
                onClick={onChangePassword}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition"
              >
                <Key size={14} />
                Password
              </button>
            )}
            {onAssignCourses && (
              <button
                onClick={onAssignCourses}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
              >
                <BookPlus size={14} />
                Manage Courses
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

          {/* Role */}
          <SectionTitle icon={Shield}>Account Role</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-indigo-500/10 border-indigo-500/20 text-indigo-300">
              {instructor.role || "instructor"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────── */
const AdminInstructors = ({
  enrichedInstructors = [],
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
  const [activeStatFilter, setActiveStatFilter] = useState(null); // null | "with_courses" | "with_students"

  const filtI = enrichedInstructors.filter((i) => {
    const matchesSearch =
      i.name?.toLowerCase().includes(ql) || i.email?.toLowerCase().includes(ql);
    if (!matchesSearch) return false;
    if (activeStatFilter === "with_courses") return (i.mc?.length || 0) > 0;
    if (activeStatFilter === "with_students") return (i.stu || 0) > 0;
    return true;
  });
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [addingInstructor, setAddingInstructor] = useState(false);
  const [assigningCoursesInstructor, setAssigningCoursesInstructor] = useState(null);
  const [passwordInstructor, setPasswordInstructor] = useState(null);

  // ── Header stat pills ──────────────────────────────────────────────────
  const totalCoursesTaught = useMemo(
    () => enrichedInstructors.reduce((sum, i) => sum + (i.mc?.length || 0), 0),
    [enrichedInstructors],
  );
  const totalStudentsTaught = useMemo(
    () => enrichedInstructors.reduce((sum, i) => sum + (i.stu || 0), 0),
    [enrichedInstructors],
  );

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
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase mb-1">
            Accounts Management
          </p>
          <h2 className="text-2xl font-extrabold text-white">
            Platform Instructors
          </h2>
        </div>

        {/* Quick-glance stat pills — click to filter */}
        <div className="flex flex-wrap gap-2">
          {/* Total Instructors — resets filter */}
          <button
            type="button"
            onClick={() => setActiveStatFilter(null)}
            title="Show all instructors"
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 transition-all duration-150 ${
              activeStatFilter === null
                ? "border-indigo-500/60 bg-indigo-600/20 ring-1 ring-indigo-500/40 shadow-md shadow-indigo-950/30"
                : "border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/40"
            }`}
          >
            <GraduationCap size={14} className="text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300">{enrichedInstructors.length}</span>
            <span className="text-[11px] text-indigo-300/70 font-medium">Total Instructors</span>
            {activeStatFilter === null && (
              <span className="ml-0.5 text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded-md">
                Active
              </span>
            )}
          </button>

          {/* Courses Taught — filter to instructors with ≥1 course */}
          <button
            type="button"
            onClick={() => setActiveStatFilter(activeStatFilter === "with_courses" ? null : "with_courses")}
            title="Show only instructors who have courses assigned"
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 transition-all duration-150 ${
              activeStatFilter === "with_courses"
                ? "border-emerald-500/60 bg-emerald-600/20 ring-1 ring-emerald-500/40 shadow-md shadow-emerald-950/30"
                : "border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 cursor-pointer"
            }`}
          >
            <BookOpen size={14} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">{totalCoursesTaught}</span>
            <span className="text-[11px] text-emerald-300/70 font-medium">Courses Taught</span>
            {activeStatFilter === "with_courses" && (
              <span className="ml-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                Filtered
              </span>
            )}
          </button>

          {/* Students Taught — filter to instructors with ≥1 student */}
          <button
            type="button"
            onClick={() => setActiveStatFilter(activeStatFilter === "with_students" ? null : "with_students")}
            title="Show only instructors who have taught students"
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 transition-all duration-150 ${
              activeStatFilter === "with_students"
                ? "border-sky-500/60 bg-sky-600/20 ring-1 ring-sky-500/40 shadow-md shadow-sky-950/30"
                : "border-sky-500/20 bg-sky-500/10 hover:bg-sky-500/20 hover:border-sky-500/40 cursor-pointer"
            }`}
          >
            <Users size={14} className="text-sky-400" />
            <span className="text-xs font-bold text-sky-300">{totalStudentsTaught}</span>
            <span className="text-[11px] text-sky-300/70 font-medium">Students Taught</span>
            {activeStatFilter === "with_students" && (
              <span className="ml-0.5 text-[9px] font-extrabold uppercase tracking-wider text-sky-400 bg-sky-500/20 border border-sky-500/30 px-1.5 py-0.5 rounded-md">
                Filtered
              </span>
            )}
          </button>

          {/* Matching — visible when search is active */}
          {q.trim() && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2">
              <Search size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-300">{filtI.length}</span>
              <span className="text-[11px] text-amber-300/70 font-medium">Matching</span>
            </div>
          )}

          {/* Active filter indicator badge */}
          {activeStatFilter && (
            <button
              type="button"
              onClick={() => setActiveStatFilter(null)}
              title="Clear filter"
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/40 transition"
            >
              <X size={12} />
              Clear Filter
            </button>
          )}
        </div>

        {/* Search + primary actions, full-width and clearly labeled */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
          <div className="relative flex-1 min-w-0">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              className="w-full bg-slate-900/40 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition duration-150"
              placeholder="Search instructors by name or email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canCreate && (
              <button
                type="button"
                onClick={() => setAddingInstructor(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <UserPlus size={14} />
                Add Instructor
              </button>
            )}

            {canCreate && (
              <button
                type="button"
                onClick={handleImportClick}
                disabled={importing}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition disabled:opacity-60"
              >
                {importing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {importing ? "Importing..." : "Bulk Import"}
              </button>
            )}
          </div>
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
        <p className="font-semibold text-slate-200 mb-2">Expected columns</p>
        <div className="flex flex-wrap gap-1.5">
          {["name", "email", "phoneNumber", "password", "city", "state", "pincode"].map(
            (col) => (
              <span
                key={col}
                className="font-mono text-[11px] bg-slate-900 border border-slate-800 text-slate-300 rounded-md px-2 py-1"
              >
                {col}
              </span>
            ),
          )}
        </div>
        <p className="text-slate-500 mt-2.5">
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
                Inserted: {importStats.inserted || importStats.insertedCount || 0} · Skipped:{" "}
                {importStats.skipped || importStats.skippedCount || 0}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Instructor Cards List */}
      <div className="grid grid-cols-1 gap-3">
        {filtI.map((inst) => (
          <div
            key={inst._id}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 bg-slate-900/30 border border-slate-800/80 rounded-2xl transition duration-150 hover:border-slate-700/60 hover:bg-slate-900/50"
          >
            <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
              <Av name={inst.name} src={inst.avatarUrl} size={48} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate">
                    {inst.name}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                    {inst.role || "instructor"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  {inst.email && (
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail size={12} className="text-slate-500 shrink-0" />
                      <span className="truncate">{inst.email}</span>
                    </span>
                  )}
                  {inst.phoneNumber && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-500 shrink-0" />
                      <span>{inst.phoneNumber}</span>
                    </span>
                  )}
                  {inst.specialization && (
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <Award size={12} className="text-indigo-400 shrink-0" />
                      <span>{inst.specialization}</span>
                    </span>
                  )}
                </div>

                {/* Metrics Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    {inst.mc?.length || 0} course{inst.mc?.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full">
                    {inst.stu || 0} student{inst.stu !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    ★ {inst.avg || "—"}
                  </span>
                </div>

                {/* Mini course list with direct unassign option */}
                {inst.mc && inst.mc.length > 0 && (
                  <div className="border-t border-slate-800/60 pt-2.5 mt-2 flex flex-col gap-1.5">
                    {inst.mc.slice(0, 3).map((c) => (
                      <div
                        key={c._id}
                        className="flex items-center justify-between gap-3 text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/60 px-2.5 py-1 rounded-xl"
                      >
                        <span className="truncate flex items-center gap-1.5 font-medium text-slate-300">
                          <BookOpen
                            size={12}
                            className="text-slate-500 shrink-0"
                          />
                          <span className="truncate">{c.title || "Untitled Course"}</span>
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-emerald-400 text-[10px]">
                            {fmt((c.price || 0) * (c.students?.length || 0))}
                          </span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`Unassign "${c.title}" from ${inst.name}?`)) {
                                  try {
                                    await api.put("/courses/assign-instructor", {
                                      instructorId: inst._id,
                                      courseIds: (inst.mc || []).filter((item) => item._id !== c._id).map((item) => item._id),
                                      unassignedCourseIds: [c._id],
                                    });
                                    if (refreshUsers) await refreshUsers();
                                  } catch (err) {
                                    alert(err.response?.data?.message || "Failed to unassign course.");
                                  }
                                }
                              }}
                              title="Unassign course from instructor"
                              className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {inst.mc.length > 3 && (
                      <span className="text-[10px] text-slate-500 font-semibold pl-2">
                        +{inst.mc.length - 3} more assigned courses
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 sm:flex sm:items-center md:items-end justify-between md:justify-start gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-800/60 pt-3 md:pt-0 md:pl-5">
              {/* Details button */}
              <button
                onClick={() => setSelectedInstructor(inst)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition duration-150"
              >
                <Eye size={12} />
                Details
              </button>

              {/* Assign / Unassign Courses button */}
              {canEdit && (
                <button
                  onClick={() => setAssigningCoursesInstructor(inst)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition duration-150"
                >
                  <BookPlus size={12} />
                  Courses
                </button>
              )}

              {/* Password button */}
              {canEdit && (
                <button
                  onClick={() => setPasswordInstructor(inst)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/30 transition duration-150"
                >
                  <Key size={12} />
                  Password
                </button>
              )}

              {/* Edit button */}
              {canEdit && (
                <button
                  onClick={() => setEditingInstructor(inst)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-[10px] font-bold text-sky-300 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/30 transition duration-150"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              )}

              {/* Remove button */}
              {canDelete && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to remove instructor "${inst.name}"?`,
                      )
                    ) {
                      deleteUser(inst._id, "instructor");
                    }
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition duration-150"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              )}
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
          onChangePassword={
            canEdit
              ? () => {
                  setPasswordInstructor(selectedInstructor);
                  setSelectedInstructor(null);
                }
              : null
          }
          onAssignCourses={
            canEdit
              ? () => {
                  setAssigningCoursesInstructor(selectedInstructor);
                  setSelectedInstructor(null);
                }
              : null
          }
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

      {assigningCoursesInstructor && (
        <AssignCoursesModal
          instructor={assigningCoursesInstructor}
          courses={courses}
          instructors={enrichedInstructors}
          onClose={() => setAssigningCoursesInstructor(null)}
          onAssigned={handleMutationSuccess}
        />
      )}

      {passwordInstructor && (
        <ChangePasswordModal
          user={passwordInstructor}
          onClose={() => setPasswordInstructor(null)}
          onPasswordChanged={handleMutationSuccess}
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