import React from "react";
import { Search, Trash2, User } from "lucide-react";

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

const AdminStudents = ({ students = [], courses = [], q, setQ, deleteUser }) => {
  const ql = q.toLowerCase();
  const filtS = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(ql) || s.email?.toLowerCase().includes(ql)
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
            Platform Students
            <span className="text-sm font-semibold text-slate-500 bg-slate-900/60 border border-slate-800 rounded-md px-2 py-0.5 mt-0.5">
              {filtS.length} Total
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
            placeholder="Search students database..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Grid listing */}
      <div className="flex flex-col gap-3">
        {filtS.map((s) => {
          const studentCoursesCount = courses.filter((c) =>
            c.students?.some((sid) => (sid._id || sid) === s._id)
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

              <div className="flex items-center gap-4 shrink-0 justify-end w-full sm:w-auto">
                {/* Custom tags */}
                <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                  Student
                </span>

                <span className="text-xs font-semibold text-slate-400 min-w-[70px] text-right">
                  {studentCoursesCount} course{studentCoursesCount !== 1 ? "s" : ""}
                </span>

                {/* Delete button */}
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to remove student "${s.name}"?`
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
    </div>
  );
};

export default AdminStudents;
