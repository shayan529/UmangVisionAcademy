import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

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

const AdminApplications = ({
  applications = [],
  approveInstructor,
  rejectInstructor,
}) => {
  return (
    <div className="flex flex-col gap-6 max-w-3xl animate-fadeIn">
      {/* Header section */}
      <div>
        <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase mb-1">
          Instructor Onboarding Queue
        </p>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          Pending Applications
          <span className="text-sm font-semibold text-slate-500 bg-slate-900/60 border border-slate-800 rounded-md px-2 py-0.5 mt-0.5">
            {applications.length} Pending
          </span>
        </h2>
      </div>

      {/* Grid listing */}
      <div className="flex flex-col gap-3">
        {applications.map((app) => (
          <div
            key={app._id}
            className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 p-4 bg-slate-900/35 border border-slate-800/80 rounded-2xl transition duration-150 hover:border-slate-700/60"
          >
            {/* Applicant detail */}
            <div className="flex items-center gap-3.5 min-w-0">
              <Av name={app.name} size={40} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {app.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  {app.email}
                </p>
                {app.expertise && (
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    Expertise: <span className="text-slate-300 font-semibold">{app.expertise}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0 justify-end w-full sm:w-auto">
              <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                Pending
              </span>

              {/* Approve / Reject Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to approve instructor application from "${app.name}"?`
                      )
                    ) {
                      approveInstructor(app._id);
                    }
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition duration-150"
                >
                  <CheckCircle size={12} />
                  Approve
                </button>
                
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to reject instructor application from "${app.name}"?`
                      )
                    ) {
                      rejectInstructor(app._id);
                    }
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition duration-150"
                >
                  <XCircle size={12} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}

        {applications.length === 0 && (
          <div className="text-center py-12 px-6 border border-slate-800 bg-slate-900/20 rounded-2xl max-w-xl mx-auto w-full">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-950/20">
              <CheckCircle size={20} className="text-emerald-400" />
            </div>
            <p className="text-sm font-extrabold text-white">All Caught Up!</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              There are no pending instructor applications to review at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApplications;
