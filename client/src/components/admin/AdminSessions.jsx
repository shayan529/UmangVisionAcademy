import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Calendar, Trash2, Link as LinkIcon, Plus, X, AlertCircle, Play, Square } from "lucide-react";
import {
  fetchSessions,
  createSession,
  updateSession,
  deleteSession,
  clearSessionSuccess,
  clearSessionError,
} from "../../redux/slices/sessionSlice";
import { toast } from "react-hot-toast";

const AdminSessions = ({
  instructors = [],
  canCreate = true,
  canEdit = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { sessions, loading, success, error } = useSelector((s) => s.sessions);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    instructorId: "",
    subject: "",
    classVal: "",
    date: "",
    time: "",
    url: "",
    status: "upcoming",
  });

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  // Toast feedback
  useEffect(() => {
    if (success) {
      toast.success(success || "Session processed successfully!");
      dispatch(clearSessionSuccess());
      setShowModal(false);
      setForm({
        title: "",
        instructorId: "",
        subject: "",
        classVal: "",
        date: "",
        time: "",
        url: "",
        status: "upcoming",
      });
    }
    if (error) {
      toast.error(error || "An error occurred");
      dispatch(clearSessionError());
    }
  }, [success, error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      return toast.error("Session title is required");
    }
    if (!form.instructorId) {
      return toast.error("Please select an instructor");
    }
    if (!form.classVal) {
      return toast.error("Please select a class");
    }
    if (!form.subject.trim()) {
      return toast.error("Subject is required");
    }
    if (!form.date) {
      return toast.error("Please select a date");
    }
    if (!form.time) {
      return toast.error("Please select a time");
    }
    if (!form.url.trim()) {
      return toast.error("Session meeting link is required");
    }
    if (!/^https?:\/\/.+/i.test(form.url)) {
      return toast.error("Please enter a valid meeting URL (http:// or https://)");
    }

    dispatch(
      createSession({
        title: form.title.trim(),
        instructor: form.instructorId,
        subject: form.subject.trim(),
        class: form.classVal,
        date: form.date,
        time: form.time,
        url: form.url.trim(),
        status: form.status,
      })
    );
  };

  const handleStartSession = (id) => {
    dispatch(updateSession({ id, sessionData: { status: "live" } }));
  };

  const handleEndSession = (id) => {
    if (window.confirm("Are you sure you want to end this live session?")) {
      dispatch(updateSession({ id, sessionData: { status: "ended" } }));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      dispatch(deleteSession(id));
    }
  };

  const classesOptions = [
    { value: "Class 9", label: "Class 9" },
    { value: "Class 10", label: "Class 10" },
    { value: "Class 11", label: "Class 11" },
    { value: "Class 12", label: "Class 12" },
    { value: "Competitive Exams", label: "Competitive Exams" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Live Sessions</h2>
          <p className="text-slate-400 text-sm mt-1">
            Schedule and manage live classes across courses and batches.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition duration-200 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-sm"
          >
            <Plus size={16} />
            Schedule Session
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="bg-[#111827] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Session Title</th>
                <th className="py-4 px-6">Instructor</th>
                <th className="py-4 px-6">Class / Subject</th>
                <th className="py-4 px-6">Date & Time</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading sessions...
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <AlertCircle className="mx-auto text-slate-600 mb-3" size={32} />
                    <p className="font-semibold text-slate-400">No scheduled sessions</p>
                    <p className="text-xs text-slate-600 mt-1">Schedule a session to get started.</p>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-slate-900/30 transition duration-150">
                    <td className="py-4 px-6 font-semibold text-white">
                      {session.title}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-300">{session.instructor?.name || "N/A"}</span>
                    </td>
                    <td className="py-4 px-6 space-y-1">
                      {session.class ? (
                        <div className="inline-block bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                          🏷️ {session.class}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">General / Any Class</span>
                      )}
                      {session.subject ? (
                        <div className="text-indigo-400 font-medium text-xs font-semibold">
                          📚 {session.subject}
                        </div>
                      ) : session.course ? (
                        <div className="text-indigo-400 font-medium text-xs">
                          📚 {session.course.title}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      <div className="font-medium text-white">{session.date}</div>
                      <div className="mt-0.5">{session.time}</div>
                    </td>
                    <td className="py-4 px-6">
                      {session.status === "live" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      ) : session.status === "ended" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-700/50">
                          Ended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Scheduled
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {canEdit && session.status === "upcoming" && (
                          <button
                            onClick={() => handleStartSession(session._id)}
                            className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition duration-200"
                            title="Start Session (Go Live)"
                          >
                            <Play size={14} />
                          </button>
                        )}
                        {canEdit && session.status === "live" && (
                          <button
                            onClick={() => handleEndSession(session._id)}
                            className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg transition duration-200"
                            title="End Session"
                          >
                            <Square size={14} />
                          </button>
                        )}
                        <a
                          href={session.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition duration-200"
                          title="Join / Go to URL"
                        >
                          <LinkIcon size={14} />
                        </a>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(session._id)}
                            className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition duration-200"
                            title="Delete Session"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50 shrink-0 rounded-t-2xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar size={17} className="text-indigo-400" />
                Schedule Live Session
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition duration-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Session Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Session Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Intro to Organic Chemistry"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-indigo-500 outline-none transition"
                  required
                />
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Assign Instructor
                </label>
                <select
                  value={form.instructorId}
                  onChange={(e) =>
                    setForm({ ...form, instructorId: e.target.value })
                  }
                  className="w-full bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-indigo-500 outline-none transition"
                  required
                >
                  <option value="">Select Instructor</option>
                  {instructors.map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name} ({inst.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Class & Subject side by side on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Class
                  </label>
                  <select
                    value={form.classVal}
                    onChange={(e) => setForm({ ...form, classVal: e.target.value })}
                    className="w-full bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-indigo-500 outline-none transition"
                    required
                  >
                    <option value="">Select Class</option>
                    {classesOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-indigo-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-indigo-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-indigo-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Meeting Link URL (Google Meet / Zoom)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-indigo-500 outline-none transition"
                  required
                />
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Initial Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-indigo-500 outline-none transition"
                >
                  <option value="upcoming">Upcoming (Scheduled)</option>
                  <option value="live">Live</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              {/* Action Buttons — pinned inside scroll area at bottom */}
              <div className="flex justify-end gap-3 pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 transition px-5 py-2.5 rounded-xl text-slate-300 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg shadow-indigo-600/20"
                >
                  {loading ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSessions;
