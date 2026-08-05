import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchSessions,
  fetchCoursesForSession,
  createSession,
  updateSession,
  deleteSession,
  clearSessionSuccess,
  clearSessionError,
} from "../../redux/slices/sessionSlice";
import { Card, SectionHeader, Btn } from "./InstructorUi";

// Converts "16:32" (24h, from <input type="time">) → "4:32 PM"
const formatTime12h = (timeStr) => {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
};

// Formats "2026-07-11" → "Sat, Jul 11, 2026"
const formatDateReadable = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const EMPTY_FORM = {
  title: "",
  courseId: "",
  courseSubject: "",
  recordedUrl: "",
  date: "",
  time: "",
  url: "",
};

// ── Input style ───────────────────────────────────────────────────────────────
const inputSt = {
  width: "100%",
  padding: "10px 14px",
  background: "#0d1424",
  border: "1px solid rgba(51,65,85,0.8)",
  borderRadius: 12,
  color: "#f1f5f9",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};

// ── Subject quick-select chips ────────────────────────────────────────────────
const SubjectChips = ({ subjects, selected, onSelect }) => {
  if (!subjects?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
      {subjects.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(selected === s ? "" : s)}
          style={{
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            border: "1px solid",
            cursor: "pointer",
            transition: "all 0.15s ease",
            background: selected === s ? "#6366f1" : "transparent",
            borderColor: selected === s ? "#6366f1" : "#334155",
            color: selected === s ? "#fff" : "#94a3b8",
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
};

// ── Label ─────────────────────────────────────────────────────────────────────
const FieldLabel = ({ children, optional }) => (
  <label style={{ display: "block", marginBottom: 7, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
    {children}{optional && <span style={{ marginLeft: 6, fontWeight: 400, color: "#334155", textTransform: "none" }}>(optional)</span>}
  </label>
);

const InstructorSessions = ({ showToast }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { sessions, coursesForSession: courses = [], loading, success, error } =
    useSelector((s) => s.sessions);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [startingSessionId, setStartingSessionId] = useState(null);

  useEffect(() => {
    dispatch(fetchSessions());
    dispatch(fetchCoursesForSession());
  }, [dispatch]);

  // ── Toast on success / error ──────────────────────────────────────────────
  useEffect(() => {
    if (success) {
      showToast(success);
      dispatch(clearSessionSuccess());
    }
  }, [success, dispatch, showToast]);

  useEffect(() => {
    if (error) {
      showToast(`${t("instructorSessions.error")}: ${error}`);
      dispatch(clearSessionError());
    }
  }, [error, dispatch, showToast, t]);

  const copySessionLink = async (url) => {
    if (!url) { showToast(t("instructorSessions.noSessionUrl")); return; }
    try {
      await navigator.clipboard.writeText(url);
      showToast(t("instructorSessions.sessionLinkCopied"));
    } catch {
      showToast(t("instructorSessions.failedToCopy"));
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const selectedCourse = useMemo(() => courses.find((c) => c._id === form.courseId), [courses, form.courseId]);
  const selectedEditCourse = useMemo(() => courses.find((c) => c._id === editForm.courseId), [courses, editForm.courseId]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const schedule = () => {
    if (!form.title.trim() || !form.url.trim() || !form.date.trim() || !form.time.trim()) {
      showToast(t("instructorSessions.enterAllDetails"));
      return;
    }
    if (!/^https?:\/\/.+/i.test(form.url)) {
      showToast(t("instructorSessions.invalidUrl"));
      return;
    }
    if (form.recordedUrl && !/^https?:\/\/.+/i.test(form.recordedUrl)) {
      showToast("Recorded URL must be a valid https:// link");
      return;
    }

    dispatch(createSession({
      title: form.title,
      subject: selectedCourse ? "" : "",
      course: form.courseId || null,
      courseSubject: form.courseSubject.trim() || null,
      recordedUrl: form.recordedUrl.trim() || null,
      date: form.date,
      time: form.time,
      status: "upcoming",
      url: form.url,
    }));

    setForm(EMPTY_FORM);
  };

  const remove = (id) => dispatch(deleteSession(id));

  const startEditing = (s) => {
    setEditingId(s._id);
    setEditForm({
      title: s.title || "",
      courseId: s.course?._id || s.course || "",
      courseSubject: s.courseSubject || "",
      recordedUrl: s.recordedUrl || "",
      date: s.date || "",
      time: s.time || "",
      url: s.url || "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  const saveEdit = (id) => {
    if (!editForm.title.trim() || !editForm.url.trim() || !editForm.date.trim() || !editForm.time.trim()) {
      showToast(t("instructorSessions.enterAllDetails"));
      return;
    }
    if (!/^https?:\/\/.+/i.test(editForm.url)) {
      showToast(t("instructorSessions.invalidUrl"));
      return;
    }
    if (editForm.recordedUrl && !/^https?:\/\/.+/i.test(editForm.recordedUrl)) {
      showToast("Recorded URL must be a valid https:// link");
      return;
    }

    dispatch(updateSession({
      id,
      sessionData: {
        title: editForm.title.trim(),
        course: editForm.courseId || null,
        courseSubject: editForm.courseSubject.trim() || null,
        recordedUrl: editForm.recordedUrl.trim() || null,
        date: editForm.date,
        time: editForm.time,
        url: editForm.url.trim(),
      },
    }));
    cancelEditing();
  };

  const startSession = async (s) => {
    if (!s.url) { showToast(t("instructorSessions.noSessionUrl")); return; }
    setStartingSessionId(s._id);
    try {
      await dispatch(updateSession({ id: s._id, sessionData: { status: "live" } })).unwrap();
    } catch (e) {
      console.error("Failed to start session:", e);
    } finally {
      setStartingSessionId(null);
    }
  };

  const endSession = (id) => {
    dispatch(updateSession({ id, sessionData: { status: "ended" } }));
  };

  const statusMeta = (status) => {
    if (status === "live")
      return { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: t("instructorSessions.live") };
    if (status === "ended")
      return { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", label: t("instructorSessions.ended") };
    return { color: "#a78bfa", bg: "rgba(124,58,237,0.14)", label: t("instructorSessions.upcoming") };
  };

  // ── Compact edit-form fields ──────────────────────────────────────────────
  const renderEditFields = () => (
    <div style={{ flex: 1, minWidth: 200, display: "grid", gap: 10 }}>
      {/* Title */}
      <input
        value={editForm.title}
        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
        style={inputSt}
        placeholder={t("instructorSessions.sessionTitlePlaceholder")}
      />

      {/* Course */}
      <select
        value={editForm.courseId}
        onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value, courseSubject: "" })}
        style={inputSt}
      >
        <option value="">— No course —</option>
        {courses.map((c) => (
          <option key={c._id} value={c._id}>{c.title}</option>
        ))}
      </select>

      {/* Subject chips */}
      {editForm.courseId && selectedEditCourse?.subjects?.length > 0 && (
        <SubjectChips
          subjects={selectedEditCourse.subjects}
          selected={editForm.courseSubject}
          onSelect={(v) => setEditForm({ ...editForm, courseSubject: v })}
        />
      )}

      {/* Date + Time */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input
          type="date"
          value={editForm.date}
          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
          style={inputSt}
        />
        <input
          type="time"
          value={editForm.time}
          onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
          style={inputSt}
        />
      </div>

      {/* Meeting URL */}
      <input
        type="url"
        value={editForm.url}
        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
        style={inputSt}
        placeholder={t("instructorSessions.meetingUrl")}
      />

      {/* Recording URL */}
      <input
        type="url"
        value={editForm.recordedUrl}
        onChange={(e) => setEditForm({ ...editForm, recordedUrl: e.target.value })}
        style={{ ...inputSt }}
        placeholder="Recording URL (optional)"
      />
    </div>
  );

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .is-row { flex-wrap: wrap; }
          .is-row-actions { width: 100%; justify-content: flex-start; }
        }
        .is-scroll::-webkit-scrollbar { width: 6px; }
        .is-scroll::-webkit-scrollbar-track { background: transparent; }
        .is-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 8px; }
        .is-scroll::-webkit-scrollbar-thumb:hover { background: #334155; }
        .is-session-card { transition: background 0.15s ease, border-color 0.15s ease; }
        .is-session-card:hover { background: rgba(15,23,42,0.8); border-color: #1e3a5f; }
        .is-input-focus:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
      `}</style>

      {/* ── Schedule form ── */}
      <Card style={{ marginBottom: 16, padding: "0", overflow: "hidden" }}>
        {/* Card Header with gradient accent */}
        <div style={{
          padding: "16px 20px 14px",
          borderBottom: "1px solid rgba(30,41,59,0.8)",
          background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "rgba(99,102,241,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>
              📅
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
                {t("instructorSessions.scheduleNewSession")}
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>
                Select a course and set date/time for your live class
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 20px 16px" }}>
          {/* Session Title */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Session Title</FieldLabel>
            <input
              type="text"
              placeholder={t("instructorSessions.enterSessionTitle")}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={inputSt}
              className="is-input-focus"
              required
            />
          </div>

          {/* Course selection */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Course</FieldLabel>
            <select
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value, courseSubject: "" })}
              style={inputSt}
              className="is-input-focus"
            >
              <option value="">— Select a course —</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>

            {/* Subject chips from selected course */}
            {form.courseId && selectedCourse && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Subject <span style={{ fontWeight: 400, textTransform: "none", color: "#334155" }}>(optional)</span>
                </div>
                {selectedCourse.subjects?.length > 0 ? (
                  <SubjectChips
                    subjects={selectedCourse.subjects}
                    selected={form.courseSubject}
                    onSelect={(v) => setForm({ ...form, courseSubject: v })}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Enter subject name (optional)"
                    value={form.courseSubject}
                    onChange={(e) => setForm({ ...form, courseSubject: e.target.value })}
                    style={{ ...inputSt, marginTop: 4 }}
                    className="is-input-focus"
                  />
                )}
              </div>
            )}
          </div>

          {/* Date + Time row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <FieldLabel>Date</FieldLabel>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={inputSt}
                className="is-input-focus"
              />
            </div>
            <div>
              <FieldLabel>Time</FieldLabel>
              <input
                required
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                style={inputSt}
                className="is-input-focus"
              />
            </div>
          </div>

          {/* Meeting URL */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Meeting Link</FieldLabel>
            <input
              required
              type="url"
              placeholder={t("instructorSessions.meetingUrlPlaceholder")}
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              style={inputSt}
              className="is-input-focus"
            />
          </div>

          {/* Recording URL */}
          <div style={{ marginBottom: 20 }}>
            <FieldLabel optional>Recording URL</FieldLabel>
            <input
              type="url"
              placeholder="https://youtube.com/... or drive link"
              value={form.recordedUrl}
              onChange={(e) => setForm({ ...form, recordedUrl: e.target.value })}
              style={inputSt}
              className="is-input-focus"
            />
            <div style={{ fontSize: 11, color: "#334155", marginTop: 5 }}>
              Will be auto-added as a lesson when session ends.
            </div>
          </div>

          <Btn variant="primary" onClick={schedule} disabled={loading}>
            {loading ? t("instructorSessions.scheduling") : t("instructorSessions.scheduleSession")}
          </Btn>
        </div>
      </Card>

      {/* ── Session list ── */}
      <Card>
        <SectionHeader title={t("instructorSessions.allSessions")} />

        {loading && (
          <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            {t("instructorSessions.loadingSessions")}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            {t("instructorSessions.noSessions")}
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="is-scroll" style={{ maxHeight: 560, overflowY: "auto", paddingRight: 4 }}>
            {sessions.map((s) => {
              const meta = statusMeta(s.status);
              const courseName = s.course?.title || courses.find((c) => c._id === (s.course?._id || s.course))?.title;
              return (
                <div
                  key={s._id}
                  className="is-row is-session-card"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "14px 12px",
                    marginBottom: 10,
                    borderRadius: 14,
                    background: "#0d1424",
                    border: "1px solid rgba(30,41,59,0.8)",
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", background: meta.color,
                    flexShrink: 0, marginTop: 6,
                    boxShadow: s.status === "live" ? `0 0 0 4px ${meta.bg}` : "none",
                  }} />

                  {/* ── Edit mode ── */}
                  {editingId === s._id ? (
                    renderEditFields()
                  ) : (
                    /* ── View mode ── */
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 6 }}>
                        {s.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#cbd5e1", background: "rgba(30,41,59,0.8)", padding: "3px 8px", borderRadius: 6 }}>
                          📅 {formatDateReadable(s.date)}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#cbd5e1", background: "rgba(30,41,59,0.8)", padding: "3px 8px", borderRadius: 6 }}>
                          🕒 {formatTime12h(s.time)}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, background: meta.bg, padding: "3px 9px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.3 }}>
                          {meta.label}
                        </span>
                      </div>

                      {/* Course + subject */}
                      {(courseName || s.courseSubject) && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
                          {courseName && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#a78bfa", background: "rgba(167,139,250,0.1)", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
                              🎓 {courseName}
                            </span>
                          )}
                          {s.courseSubject && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#34d399", background: "rgba(52,211,153,0.1)", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
                              📂 {s.courseSubject}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Recording badge */}
                      {s.status === "ended" && (s.recordedUrl || s.url) && (
                        <div style={{ marginTop: 5 }}>
                          {s.recordedLessonAdded ? (
                            <span style={{ fontSize: 11, color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                              ✓ Recording added to course
                            </span>
                          ) : s.course?._id || s.course ? (
                            <span style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                              ⏳ Recording will be added on save
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#475569", padding: "2px 0" }}>
                              No course assigned — recording not auto-saved
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Action buttons ── */}
                  <div className="is-row-actions" style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
                    {editingId === s._id ? (
                      <>
                        <Btn variant="success" style={{ fontSize: 12 }} onClick={() => saveEdit(s._id)}>
                          {t("instructorSessions.save")}
                        </Btn>
                        <Btn variant="ghost" style={{ fontSize: 12 }} onClick={cancelEditing}>
                          {t("instructorSessions.cancel")}
                        </Btn>
                      </>
                    ) : (
                      <>
                        {s.status === "upcoming" && (
                          <Btn
                            variant="primary"
                            style={{ fontSize: 12 }}
                            disabled={startingSessionId === s._id}
                            onClick={() => startSession(s)}
                          >
                            {startingSessionId === s._id
                              ? t("instructorSessions.starting", "Starting…")
                              : t("instructorSessions.startSession")}
                          </Btn>
                        )}

                        <Btn
                          variant="success"
                          style={{ fontSize: 12 }}
                          onClick={() => {
                            if (!s.url) { showToast(t("instructorSessions.noSessionUrl")); return; }
                            window.open(s.url, "_blank");
                          }}
                        >
                          {t("instructorSessions.preview")}
                        </Btn>

                        <Btn variant="ghost" style={{ fontSize: 12 }} onClick={() => startEditing(s)}>
                          {t("instructorSessions.edit")}
                        </Btn>

                        {s.status !== "ended" && (
                          <Btn variant="ghost" style={{ fontSize: 12 }} onClick={() => endSession(s._id)}>
                            {t("instructorSessions.end")}
                          </Btn>
                        )}

                        <Btn variant="ghost" style={{ fontSize: 12 }} onClick={() => copySessionLink(s.url)}>
                          {t("instructorSessions.copy")}
                        </Btn>

                        <Btn
                          variant="danger"
                          style={{ fontSize: 12, padding: "8px 10px" }}
                          onClick={() => remove(s._id)}
                        >
                          🗑
                        </Btn>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
};

export default InstructorSessions;
