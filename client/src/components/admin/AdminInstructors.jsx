import React, { useState } from "react";
import {
  Search,
  Trash2,
  BookOpen,
  Star,
  GraduationCap,
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
} from "lucide-react";

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

/* ─── Instructor Details Modal ───────────────────────── */
const InstructorDetailsModal = ({ instructor, onClose }) => {
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
          <button
            onClick={onClose}
            className="flex-none p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
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

const AdminInstructors = ({
  enrichedInstructors = [],
  q,
  setQ,
  deleteUser,
}) => {
  const ql = q.toLowerCase();
  const filtI = enrichedInstructors.filter(
    (i) =>
      i.name?.toLowerCase().includes(ql) || i.email?.toLowerCase().includes(ql),
  );
  const [selectedInstructor, setSelectedInstructor] = useState(null);

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
      </div>

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
            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-800/60 pt-4 md:pt-0">
              {/* Details button */}
              <button
                onClick={() => setSelectedInstructor(inst)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition duration-150"
              >
                <Eye size={12} />
                Details
              </button>

              {/* Remove button */}
              <button
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
              </button>
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
        />
      )}
    </div>
  );
};

export default AdminInstructors;
