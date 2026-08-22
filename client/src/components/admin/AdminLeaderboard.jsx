import React, { useState } from "react";
import {
  Star,
  Trophy,
  Medal,
  Award,
  ChevronUp,
  ChevronDown,
  X,
  Phone,
  MapPin,
  BookOpen,
  Users,
  TrendingUp,
  Calendar,
  Link as LinkIcon,
} from "lucide-react";

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

/* ─── Avatar ──────────────────────────────────────────── */
const Av = ({ name = "?", size = 30 }) => (
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

/* ─── Rank badge ──────────────────────────────────────── */
const Rank = ({ r }) => {
  if (r === 1)
    return <Trophy size={16} className="text-amber-500 fill-amber-500" />;
  if (r === 2)
    return <Medal size={16} className="text-slate-400 fill-slate-400" />;
  if (r === 3)
    return <Award size={16} className="text-amber-700 fill-amber-700" />;
  return (
    <span className="text-sm font-bold text-slate-500 min-w-[16px] text-center">
      #{r}
    </span>
  );
};

const AdminLeaderboard = ({
  sortedInstructors = [],
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
}) => {
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const SortButton = ({ field, label }) => {
    const active = sortBy === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-[10.5px] sm:text-xs font-bold tracking-wider uppercase transition-all duration-150 border w-full sm:w-auto ${
          active
            ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
            : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
        }`}
      >
        {label}
        {active &&
          (sortDir === "desc" ? (
            <ChevronDown size={12} />
          ) : (
            <ChevronUp size={12} />
          ))}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-5xl animate-fadeIn py-1 sm:py-2">
      {/* Tab Header */}
      <div className="pt-2 sm:pt-4 px-1 sm:px-2 space-y-1">
        <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase">
          Rankings Catalog
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Instructor Leaderboard
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          View and rank all active teaching staff by platform metrics.
        </p>
      </div>

      {/* Sorting filters */}
      <div className="space-y-2.5 bg-slate-900/40 border border-slate-800/80 p-3.5 sm:p-4 rounded-2xl">
        <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest block px-0.5">
          Rank By:
        </span>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <SortButton field="revenue" label="Revenue" />
          <SortButton field="students" label="Students" />
          <SortButton field="courses" label="Courses" />
          <SortButton field="rating" label="Rating" />
        </div>
      </div>

      {/* Responsive Leaderboard Table */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm p-0.5">
        <div className="overflow-x-auto scrollbar-none no-scrollbar">
          <div className="min-w-[580px] md:min-w-full">
            {/* Table Head */}
            <div className="grid grid-cols-[40px_minmax(160px,1fr)_75px_85px_80px_90px_90px] gap-2 md:gap-3 px-3.5 md:px-5 py-3.5 border-b border-slate-800 bg-slate-950/40 items-center">
              <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
                #
              </span>
              <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                Instructor Name
              </span>
              <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
                Courses
              </span>
              <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
                Students
              </span>
              <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
                Rating
              </span>
              <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider text-right">
                Revenue
              </span>
              <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
                Details
              </span>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-800/60">
              {sortedInstructors.map((inst, i) => {
                // Apply special golden, silver, bronze rows
                const bgClass =
                  i === 0
                    ? "bg-amber-500/[0.02]"
                    : i === 1
                      ? "bg-slate-400/[0.01]"
                      : i === 2
                        ? "bg-amber-700/[0.01]"
                        : "hover:bg-slate-950/20";
                const borderClass =
                  i === 0
                    ? "border-l-2 border-l-amber-500"
                    : i === 1
                      ? "border-l-2 border-l-slate-400"
                      : i === 2
                        ? "border-l-2 border-l-amber-700"
                        : "border-l-2 border-l-transparent";

                return (
                  <div
                    key={inst._id}
                    className={`grid grid-cols-[40px_minmax(160px,1fr)_75px_85px_80px_90px_90px] gap-2 md:gap-3 items-center px-3.5 md:px-5 py-3 transition duration-150 ${bgClass} ${borderClass} hover:bg-slate-900/50 cursor-pointer group`}
                  >
                    {/* Ranking Badge */}
                    <div className="flex justify-center">
                      <Rank r={i + 1} />
                    </div>

                    {/* Profile detail */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Av name={inst.name} size={30} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {inst.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {inst.email}
                        </p>
                      </div>
                    </div>

                    {/* Courses count */}
                    <p className="text-xs font-bold text-slate-300 text-center">
                      {inst.mc?.length || 0}
                    </p>

                    {/* Students count */}
                    <p className="text-xs font-bold text-slate-300 text-center">
                      {inst.stu || 0}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-1">
                      <Star
                        size={11}
                        className="text-amber-500 fill-amber-500 shrink-0"
                      />
                      <span className="text-xs font-extrabold text-amber-500">
                        {inst.avg || "—"}
                      </span>
                    </div>

                    {/* Revenue */}
                    <p className="text-xs font-extrabold text-emerald-400 text-right">
                      {fmt(inst.rev)}
                    </p>

                    {/* View Details Column */}
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInstructor(inst);
                        }}
                        className="px-2.5 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border border-indigo-500/20 transition-all shadow-sm whitespace-nowrap"
                        title="View Full Details"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}

              {sortedInstructors.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500">
                    No rankings database available.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructor Details Modal */}
      {selectedInstructor && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setSelectedInstructor(null)}
        >
          <div
            className="bg-[#0f172a] border border-slate-700/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 shrink-0">
              <h3 className="text-base font-bold text-white">
                Instructor Details
              </h3>
              <button
                onClick={() => setSelectedInstructor(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto p-6 flex flex-col gap-6">
              {/* Profile row */}
              <div className="flex items-center gap-4">
                <Av name={selectedInstructor.name} size={56} />
                <div className="min-w-0">
                  <h4 className="text-xl font-extrabold text-white leading-tight">
                    {selectedInstructor.name}
                  </h4>
                  {selectedInstructor.specialization && (
                    <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                      {selectedInstructor.specialization}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5 break-all leading-snug">
                    {selectedInstructor.email}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {selectedInstructor.bio && (
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                    Bio
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedInstructor.bio}
                  </p>
                </div>
              )}

              {/* Key metrics */}
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
                  Performance
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/30 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <TrendingUp size={13} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Revenue
                      </span>
                    </div>
                    <p className="text-lg font-extrabold text-emerald-400">
                      {fmt(selectedInstructor.rev)}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/30 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-sky-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Students
                      </span>
                    </div>
                    <p className="text-lg font-bold text-slate-200">
                      {selectedInstructor.stu || 0}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/30 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={13} className="text-violet-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Courses
                      </span>
                    </div>
                    <p className="text-lg font-bold text-slate-200">
                      {selectedInstructor.mc?.length || 0}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/30 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Star
                        size={13}
                        className="text-amber-500 fill-amber-500"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Avg Rating
                      </span>
                    </div>
                    <p className="text-lg font-extrabold text-amber-400">
                      {selectedInstructor.avg || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact & Location */}
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
                  Contact & Location
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedInstructor.phoneNumber && (
                    <div className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-3">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          Phone
                        </p>
                        <p className="text-sm text-slate-200 font-medium">
                          {selectedInstructor.phoneNumber}
                        </p>
                      </div>
                    </div>
                  )}
                  {(selectedInstructor.city || selectedInstructor.state) && (
                    <div className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-3">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          Location
                        </p>
                        <p className="text-sm text-slate-200 font-medium">
                          {[selectedInstructor.city, selectedInstructor.state]
                            .filter(Boolean)
                            .join(", ")}
                          {selectedInstructor.pincode
                            ? ` — ${selectedInstructor.pincode}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedInstructor.fullAddress && (
                    <div className="flex items-start gap-3 bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-3 sm:col-span-2">
                      <MapPin
                        size={14}
                        className="text-slate-400 shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          Full Address
                        </p>
                        <p className="text-sm text-slate-200 font-medium">
                          {selectedInstructor.fullAddress}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedInstructor.socialMediaAccount && (
                    <div className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-3">
                      <LinkIcon size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          Social
                        </p>
                        <a
                          href={selectedInstructor.socialMediaAccount}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-400 hover:text-indigo-300 font-medium truncate block max-w-[180px]"
                        >
                          {selectedInstructor.socialMediaAccount}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-3">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        Joined
                      </p>
                      <p className="text-sm text-slate-200 font-medium">
                        {selectedInstructor.createdAt
                          ? new Date(
                              selectedInstructor.createdAt,
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teaching courses list */}
              {selectedInstructor.mc?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
                    Teaching Courses ({selectedInstructor.mc.length})
                  </p>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {selectedInstructor.mc.map((course, idx) => (
                      <div
                        key={course._id || idx}
                        className="flex items-center justify-between gap-3 bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BookOpen
                            size={12}
                            className="text-violet-400 shrink-0"
                          />
                          <p className="text-sm text-slate-200 truncate">
                            {course.title || "Untitled"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Users size={10} />
                            {course.studentsCount ??
                              course.students?.length ??
                              0}
                          </span>
                          {course.price > 0 && (
                            <span className="text-[11px] text-emerald-400 font-semibold">
                              ₹{course.price}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaderboard;
