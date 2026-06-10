import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import {
  fetchApplications,
  approveApplication,
  rejectApplication,
  clearError,
} from "../../redux/slices/applicationsSlice";

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

const AdminApplications = () => {
  const dispatch = useDispatch();
  const { applications, loading, error } = useSelector(
    (state) => state.applications,
  );

  // Only show pending applications in the admin queue
  const pending = applications.filter(
    (app) => app.status === "pending" || app.status === "under_review",
  );

  useEffect(() => {
    dispatch(fetchApplications());
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleApprove = (app) => {
    if (window.confirm(`Approve application from "${app.user?.name}"?`)) {
      dispatch(approveApplication(app._id));
    }
  };
  const handleReject = (app) => {
    if (window.confirm(`Reject application from "${app.user?.name}"?`)) {
      dispatch(rejectApplication(app._id));
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl animate-fadeIn">
      {/* Header */}
      <div>
        <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase mb-1">
          Instructor Onboarding Queue
        </p>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          Pending Applications
          <span className="text-sm font-semibold text-slate-500 bg-slate-900/60 border border-slate-800 rounded-md px-2 py-0.5 mt-0.5">
            {pending.length} Pending
          </span>
        </h2>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <button
            onClick={() => dispatch(clearError())}
            className="text-red-400 hover:text-red-300 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12 px-6 border border-slate-800 bg-slate-900/20 rounded-2xl">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-4">Loading applications...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((app) => (
            <div
              key={app._id}
              className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 p-4 bg-slate-900/35 border border-slate-800/80 rounded-2xl transition duration-150 hover:border-slate-700/60"
            >
              {/* Applicant detail */}
              <div className="flex gap-4">
                <Av name={app.user?.name} size={42} />

                <div className="flex-1 min-w-0 space-y-3">
                  {/* User Info */}
                  <div>
                    <p className="text-sm font-bold text-white">
                      {app.user?.name}
                    </p>
                    <p className="text-xs text-slate-400">{app.user?.email}</p>
                  </div>

                  {/* Expertise */}
                  {app.expertise && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                      <p className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold mb-1">
                        Expertise
                      </p>
                      <p className="text-sm text-slate-200 break-words">
                        {app.expertise}
                      </p>
                    </div>
                  )}

                  {/* Bio */}
                  {app.bio && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                      <p className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">
                        Bio
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                        {app.bio}
                      </p>
                    </div>
                  )}

                  {/* Content Link */}
                  {app.contentLink && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                      <p className="text-[11px] uppercase tracking-wider text-violet-400 font-semibold mb-2">
                        Content Link
                      </p>

                      <a
                        href={app.contentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 break-all underline"
                      >
                        {app.contentLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0 justify-end w-full sm:w-auto">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  {app.status === "under_review" ? "Under Review" : "Pending"}
                </span>

                <div className="flex gap-2 shrink-0">
                  {app.resumeUrl && (
                    <a
                      href={app.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition duration-150"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 16v-8m0 8l-3-3m3 3l3-3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
                        />
                      </svg>
                      Resume
                    </a>
                  )}
                  <button
                    onClick={() => handleApprove(app)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition duration-150"
                  >
                    <CheckCircle size={12} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(app)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition duration-150"
                  >
                    <XCircle size={12} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pending.length === 0 && (
            <div className="text-center py-12 px-6 border border-slate-800 bg-slate-900/20 rounded-2xl max-w-xl mx-auto w-full">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-950/20">
                <CheckCircle size={20} className="text-emerald-400" />
              </div>
              <p className="text-sm font-extrabold text-white">
                All Caught Up!
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                There are no pending instructor applications to review at this
                time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
