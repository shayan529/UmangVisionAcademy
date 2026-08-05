import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Trash2,
  Link as LinkIcon,
  Plus,
  X,
  AlertCircle,
  Play,
  Square,
  User,
  BookOpen,
  ChevronRight,
  Clock,
  Video,
} from "lucide-react";
import {
  fetchSessions,
  fetchCoursesForSession,
  createSession,
  updateSession,
  deleteSession,
  clearSessionSuccess,
  clearSessionError,
} from "../../redux/slices/sessionSlice";
import { toast } from "react-hot-toast";

// ── Shared input class ────────────────────────────────────────────────────────
const inp =
  "w-full bg-[#0d1424] border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none transition placeholder-slate-600";

const EMPTY_FORM = {
  title: "",
  instructorId: "",
  courseId: "",
  courseSubject: "",
  recordedUrl: "",
  date: "",
  time: "",
  url: "",
  status: "upcoming",
};

// ── Subject dropdown scoped to a course ──────────────────────────────────────
const CourseSubjectSelect = ({ courseId, courses, value, onChange }) => {
  const course = courses.find((c) => c._id === courseId);
  const subjects = course?.subjects ?? [];
  if (!courseId) return null;
  if (subjects.length === 0) {
    return (
      <input
        type="text"
        placeholder="Enter subject (optional)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inp}
      />
    );
  }
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inp}>
      <option value="">— Select Subject —</option>
      {subjects.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
};

// ── Step indicator ────────────────────────────────────────────────────────────
const StepBadge = ({ number, label, active, done }) => (
  <div className={`flex items-center gap-2 ${active ? "opacity-100" : done ? "opacity-60" : "opacity-30"}`}>
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
        done
          ? "bg-emerald-500 text-white"
          : active
          ? "bg-indigo-500 text-white ring-2 ring-indigo-500/30"
          : "bg-slate-800 text-slate-500"
      }`}
    >
      {done ? "✓" : number}
    </div>
    <span className={`text-xs font-semibold hidden sm:block ${active ? "text-slate-200" : "text-slate-500"}`}>
      {label}
    </span>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AdminSessions = ({
  instructors = [],
  canCreate = true,
  canEdit = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const {
    sessions,
    coursesForSession: allCourses = [],
    loading,
    success,
    error,
  } = useSelector((s) => s.sessions);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    dispatch(fetchSessions());
    dispatch(fetchCoursesForSession());
  }, [dispatch]);

  // ── Toast feedback + modal close on success ───────────────────────────────
  useEffect(() => {
    if (success) {
      toast.success(success || "Session scheduled successfully!");
      dispatch(clearSessionSuccess());
      setShowModal(false);
      setForm(EMPTY_FORM);
    }
    if (error) {
      toast.error(error || "An error occurred");
      dispatch(clearSessionError());
    }
  }, [success, error, dispatch]);

  // ── Filter courses by selected instructor ─────────────────────────────────
  const filteredCourses = useMemo(() => {
    if (!form.instructorId) return [];
    return allCourses.filter(
      (c) =>
        c.instructor?.toString() === form.instructorId ||
        c.instructor === form.instructorId
    );
  }, [form.instructorId, allCourses]);

  const selectedCourse = useMemo(
    () => filteredCourses.find((c) => c._id === form.courseId),
    [filteredCourses, form.courseId]
  );

  const selectedInstructor = useMemo(
    () => instructors.find((i) => i._id === form.instructorId),
    [instructors, form.instructorId]
  );

  // ── Step logic ────────────────────────────────────────────────────────────
  const step1Done = !!form.instructorId;
  const step2Done = !!form.courseId;
  const step3Active = step1Done;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim())   return toast.error("Session title is required");
    if (!form.instructorId)   return toast.error("Please select an instructor");
    if (!form.courseId)       return toast.error("Please select a course for this instructor");
    if (!form.date)           return toast.error("Please select a date");
    if (!form.time)           return toast.error("Please select a time");
    if (!form.url.trim())     return toast.error("Session meeting link is required");
    if (!/^https?:\/\/.+/i.test(form.url))
      return toast.error("Please enter a valid meeting URL (http:// or https://)");
    if (form.recordedUrl && !/^https?:\/\/.+/i.test(form.recordedUrl))
      return toast.error("Recorded URL must be a valid https:// link");

    dispatch(
      createSession({
        title:         form.title.trim(),
        instructor:    form.instructorId,
        course:        form.courseId || null,
        courseSubject: form.courseSubject.trim() || null,
        recordedUrl:   form.recordedUrl.trim() || null,
        date:          form.date,
        time:          form.time,
        url:           form.url.trim(),
        status:        form.status,
      })
    );
  };

  const handleStartSession = (id) =>
    dispatch(updateSession({ id, sessionData: { status: "live" } }));

  const handleEndSession = (id) => {
    if (window.confirm("Are you sure you want to end this live session?"))
      dispatch(updateSession({ id, sessionData: { status: "ended" } }));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this session?"))
      dispatch(deleteSession(id));
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Live Sessions</h2>
          <p className="text-slate-400 text-sm mt-1">
            Schedule and manage live classes across instructors and courses.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 text-sm"
          >
            <Plus size={16} />
            Schedule Session
          </button>
        )}
      </div>

      {/* ── Sessions table ── */}
      <div className="bg-[#0d1424] border border-slate-800/60 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Session</th>
                <th className="py-4 px-6">Instructor</th>
                <th className="py-4 px-6">Course / Subject</th>
                <th className="py-4 px-6">Date &amp; Time</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300 text-sm">
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      Loading sessions...
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <AlertCircle className="mx-auto text-slate-700 mb-3" size={32} />
                    <p className="font-semibold text-slate-400">No scheduled sessions</p>
                    <p className="text-xs text-slate-600 mt-1">Schedule a session to get started.</p>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => {
                  const courseName =
                    session.course?.title ||
                    allCourses.find(
                      (c) => c._id === (session.course?._id || session.course)
                    )?.title;
                  return (
                    <tr
                      key={session._id}
                      className="hover:bg-slate-900/30 transition duration-150"
                    >
                      <td className="py-4 px-6 font-semibold text-white max-w-[200px]">
                        <div className="truncate">{session.title}</div>
                        {session.status === "ended" && session.course && (
                          <div className="mt-1">
                            {session.recordedLessonAdded ? (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                ✓ Recording saved
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                ⏳ Recording pending
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                            <User size={13} />
                          </div>
                          <span className="text-slate-300 text-sm">
                            {session.instructor?.name || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 space-y-1 max-w-[200px]">
                        {courseName ? (
                          <div className="inline-flex items-center gap-1.5 text-violet-400 text-xs font-semibold bg-violet-500/10 px-2 py-0.5 rounded-md truncate max-w-full">
                            <BookOpen size={10} />
                            {courseName}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                        {session.courseSubject && (
                          <div className="text-emerald-400 text-xs font-semibold truncate">
                            📂 {session.courseSubject}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs">
                        <div className="font-semibold text-white">{session.date}</div>
                        <div className="mt-0.5 text-slate-400">{session.time}</div>
                      </td>
                      <td className="py-4 px-6">
                        {session.status === "live" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && session.status === "upcoming" && (
                            <button
                              onClick={() => handleStartSession(session._id)}
                              className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition duration-200"
                              title="Go Live"
                            >
                              <Play size={13} />
                            </button>
                          )}
                          {canEdit && session.status === "live" && (
                            <button
                              onClick={() => handleEndSession(session._id)}
                              className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg transition duration-200"
                              title="End Session"
                            >
                              <Square size={13} />
                            </button>
                          )}
                          <a
                            href={session.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition duration-200"
                            title="Join / Open URL"
                          >
                            <LinkIcon size={13} />
                          </a>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(session._id)}
                              className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition duration-200"
                              title="Delete Session"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Schedule Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-[#0d1424] border border-slate-700/50 rounded-2xl w-full max-w-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[94vh] overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-gradient-to-r from-indigo-600/10 to-violet-600/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Calendar size={17} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Schedule Live Session</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Assign instructor → course → set time</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-900/30 border-b border-slate-800/40 shrink-0">
              <StepBadge number={1} label="Instructor" active={!step1Done} done={step1Done} />
              <ChevronRight size={12} className="text-slate-700 shrink-0" />
              <StepBadge number={2} label="Course" active={step1Done && !step2Done} done={step2Done} />
              <ChevronRight size={12} className="text-slate-700 shrink-0" />
              <StepBadge number={3} label="Details" active={step2Done} done={false} />
            </div>

            {/* Scrollable form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* ── STEP 1: Instructor Selection ── */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <User size={11} className="text-indigo-400" />
                  Step 1 — Select Instructor <span className="text-rose-400 ml-0.5">*</span>
                </label>
                <select
                  value={form.instructorId}
                  onChange={(e) =>
                    set({ instructorId: e.target.value, courseId: "", courseSubject: "" })
                  }
                  className={inp}
                  required
                >
                  <option value="">— Choose an instructor —</option>
                  {instructors.map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name} ({inst.email})
                    </option>
                  ))}
                </select>

                {/* Selected instructor preview */}
                {selectedInstructor && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-indigo-500/8 border border-indigo-500/20 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <User size={13} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedInstructor.name}</p>
                      <p className="text-xs text-slate-500">{selectedInstructor.email}</p>
                    </div>
                    <div className="ml-auto text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md font-semibold">
                      {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>

              {/* ── STEP 2: Course Selection (unlocked after instructor) ── */}
              <div className={`space-y-1.5 transition-all duration-300 ${step1Done ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <BookOpen size={11} className="text-violet-400" />
                  Step 2 — Select Course <span className="text-rose-400 ml-0.5">*</span>
                </label>

                {step1Done && filteredCourses.length === 0 ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-xl text-amber-400 text-sm">
                    <AlertCircle size={15} />
                    This instructor has no courses yet.
                  </div>
                ) : (
                  <select
                    value={form.courseId}
                    onChange={(e) => set({ courseId: e.target.value, courseSubject: "" })}
                    className={inp}
                    required={step1Done}
                    disabled={!step1Done}
                  >
                    <option value="">— Select a course —</option>
                    {filteredCourses.map((c) => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                )}

                {/* Subject within course */}
                {form.courseId && selectedCourse && (
                  <div className="mt-3 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Subject within Course{" "}
                      <span className="normal-case font-normal text-slate-700">(optional)</span>
                    </label>
                    <CourseSubjectSelect
                      courseId={form.courseId}
                      courses={filteredCourses}
                      value={form.courseSubject}
                      onChange={(v) => set({ courseSubject: v })}
                    />
                    {selectedCourse.subjects?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedCourse.subjects.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => set({ courseSubject: form.courseSubject === s ? "" : s })}
                            className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all duration-150 ${
                              form.courseSubject === s
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── STEP 3: Session Details (unlocked after course) ── */}
              <div className={`space-y-5 transition-all duration-300 ${step3Active ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Session Details</span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>

                {/* Session Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Session Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Intro to Organic Chemistry – Chapter 3"
                    value={form.title}
                    onChange={(e) => set({ title: e.target.value })}
                    className={inp}
                    required
                  />
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Calendar size={11} className="text-indigo-400" />
                      Date <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => set({ date: e.target.value })}
                      className={inp}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Clock size={11} className="text-indigo-400" />
                      Time <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => set({ time: e.target.value })}
                      className={inp}
                      required
                    />
                  </div>
                </div>

                {/* Meeting link */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Video size={11} className="text-indigo-400" />
                    Meeting Link <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/... or Zoom link"
                    value={form.url}
                    onChange={(e) => set({ url: e.target.value })}
                    className={inp}
                    required
                  />
                </div>

                {/* Recording URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Recording URL{" "}
                    <span className="normal-case font-normal text-slate-600">(optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/... or Google Drive link"
                    value={form.recordedUrl}
                    onChange={(e) => set({ recordedUrl: e.target.value })}
                    className={inp}
                  />
                  <p className="text-[11px] text-slate-600">
                    Auto-added as a lesson to the course when the session ends.
                  </p>
                </div>

                {/* Initial status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Initial Status
                  </label>
                  <div className="flex gap-2">
                    {[
                      { v: "upcoming", label: "Scheduled", color: "indigo" },
                      { v: "live", label: "Live Now", color: "emerald" },
                      { v: "ended", label: "Ended", color: "slate" },
                    ].map(({ v, label, color }) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => set({ status: v })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-150 ${
                          form.status === v
                            ? color === "indigo"
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : color === "emerald"
                              ? "bg-emerald-600 border-emerald-500 text-white"
                              : "bg-slate-600 border-slate-500 text-white"
                            : "bg-transparent border-slate-700 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-800/60 bg-slate-900/20 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="bg-slate-800 hover:bg-slate-700 transition px-5 py-2.5 rounded-xl text-slate-300 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form=""
                disabled={loading || !form.instructorId || !form.courseId}
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-indigo-600/20"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar size={14} />
                    Schedule Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSessions;
