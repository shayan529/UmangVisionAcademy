import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSessions } from "../../redux/slices/sessionSlice";

const StudentSessions = ({ showToast }) => {
  const dispatch = useDispatch();

  const { sessions, loading } = useSelector((state) => state.sessions);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const copyLink = async (url) => {
    if (!url) {
      showToast?.("No session URL available");
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast?.("Session link copied");
    } catch (error) {
      showToast?.("Failed to copy link");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Live Sessions</h1>
        <p className="text-slate-400 mt-1">
          Join upcoming and live instructor sessions.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
          Loading sessions...
        </div>
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            No Sessions Available
          </h3>
          <p className="text-slate-400">
            Your instructors haven't scheduled any sessions yet.
          </p>
        </div>
      )}

      {/* Sessions */}
      {!loading && sessions.length > 0 && (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      session.status === "live"
                        ? "bg-green-500"
                        : "bg-purple-500"
                    }`}
                  />

                  <h3 className="text-lg font-semibold text-white">
                    {session.title}
                  </h3>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      session.status === "live"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-purple-500/20 text-purple-400"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                <p className="text-slate-400 text-sm">📅 {session.date}</p>

                <p className="text-slate-400 text-sm">🕒 {session.time}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!session.url) {
                      showToast?.("No session URL available");
                      return;
                    }

                    window.open(session.url, "_blank", "noopener,noreferrer");
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium hover:opacity-90 transition"
                >
                  Join Session
                </button>

                <button
                  onClick={() => copyLink(session.url)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                >
                  Copy Link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentSessions;
