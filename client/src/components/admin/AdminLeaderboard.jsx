import React from "react";
import { Star, Trophy, Medal, Award, ChevronUp, ChevronDown } from "lucide-react";

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
  if (r === 1) return <Trophy size={16} className="text-amber-500 fill-amber-500" />;
  if (r === 2) return <Medal size={16} className="text-slate-400 fill-slate-400" />;
  if (r === 3) return <Award size={16} className="text-amber-700 fill-amber-700" />;
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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-150 border ${
          active
            ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/10"
            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
        }`}
      >
        {label}
        {active && (
          sortDir === "desc" ? <ChevronDown size={11} /> : <ChevronUp size={11} />
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl animate-fadeIn">
      {/* Tab Header */}
      <div>
        <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase mb-1">
          Rankings Catalog
        </p>
        <h2 className="text-2xl font-extrabold text-white">
          Instructor Leaderboard
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          View and rank all active teaching staff by platform metrics.
        </p>
      </div>

      {/* Sorting filters */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/20 border border-slate-900 p-2.5 rounded-xl">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
          Rank By:
        </span>
        <SortButton field="revenue" label="Revenue" />
        <SortButton field="students" label="Students" />
        <SortButton field="courses" label="Courses" />
        <SortButton field="rating" label="Rating" />
      </div>

      {/* Responsive Leaderboard Table */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {/* Table Head */}
        <div className="grid grid-cols-[50px_1fr_80px_90px_80px_100px] gap-4 px-5 py-4 border-b border-slate-800 bg-slate-950/20">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
            #
          </span>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Instructor Name
          </span>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
            Courses
          </span>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
            Students
          </span>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
            Avg Rating
          </span>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">
            Revenue
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
                className={`grid grid-cols-[50px_1fr_80px_90px_80px_100px] gap-4 items-center px-5 py-3.5 transition duration-150 ${bgClass} ${borderClass}`}
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
                  <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                  <span className="text-xs font-extrabold text-amber-500">
                    {inst.avg || "—"}
                  </span>
                </div>

                {/* Revenue */}
                <p className="text-xs font-extrabold text-emerald-400 text-right">
                  {fmt(inst.rev)}
                </p>
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
  );
};

export default AdminLeaderboard;
