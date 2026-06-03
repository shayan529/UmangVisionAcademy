import React from "react";
import { Search, Trash2, BookOpen, Star, GraduationCap } from "lucide-react";

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

            {/* Right section: revenue totals and delete */}
            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-800/60 pt-4 md:pt-0">
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
    </div>
  );
};

export default AdminInstructors;
