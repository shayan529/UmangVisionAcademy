import React from "react";
import { Search, BookOpen, Star } from "lucide-react";

/* ─── helpers ─────────────────────────────────────────── */
const fmt = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`);

const AdminCourses = ({ courses = [], q, setQ }) => {
  const ql = q.toLowerCase();
  const filtC = courses.filter(
    (c) =>
      c.title?.toLowerCase().includes(ql) ||
      c.instructor?.name?.toLowerCase().includes(ql)
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase mb-1">
            Catalogue Management
          </p>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Active Catalog Courses
            <span className="text-sm font-semibold text-slate-500 bg-slate-900/60 border border-slate-800 rounded-md px-2 py-0.5 mt-0.5">
              {filtC.length} Total
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
            placeholder="Search by course or tutor..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Grid listing */}
      <div className="flex flex-col gap-3">
        {filtC.map((c) => {
          const rev = (c.price || 0) * (c.students?.length || 0);

          return (
            <div
              key={c._id}
              className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 p-3.5 bg-slate-900/35 border border-slate-800/80 rounded-2xl transition duration-150 hover:border-slate-700/60"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {c.title || "Untitled Course"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap sm:flex-nowrap">
                    {c.instructor?.name && (
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        By {c.instructor.name}
                      </p>
                    )}
                    <span className="hidden sm:inline text-slate-700 text-[10px]">•</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Star size={9} className="text-amber-500 fill-amber-500" />
                      <span className="text-[10px] font-bold text-slate-400">
                        {c.rating || "4.2"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 justify-end w-full sm:w-auto">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                  {c.students?.length || 0} Enrolled
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">
                  {c.price ? `$${c.price}` : "Free"}
                </span>
                <span className="text-xs font-extrabold text-emerald-400 min-w-[65px] text-right">
                  {fmt(rev)}
                </span>
              </div>
            </div>
          );
        })}

        {filtC.length === 0 && (
          <div className="py-16 text-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/20">
            <BookOpen size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">
              No courses found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Refine your search input or create courses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;
