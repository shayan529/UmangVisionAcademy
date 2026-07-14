import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchSessions,
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

const InstructorSessions = ({ showToast }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { sessions, loading, success, error } = useSelector((s) => s.sessions);
  const [form, setForm] = useState({ title: "", date: "", time: "", url: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    date: "",
    time: "",
    url: "",
  });
  const [startingSessionId, setStartingSessionId] = useState(null);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const sessionsState = useSelector((s) => s.sessions);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#f8fafc",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  // ── Toast on success / error ──────────────────────────────────────────
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
    if (!url) {
      showToast(t("instructorSessions.noSessionUrl"));
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast(t("instructorSessions.sessionLinkCopied"));
    } catch (error) {
      showToast(t("instructorSessions.failedToCopy"));
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────
  const schedule = () => {
    if (
      !form.title.trim() ||
      !form.url.trim() ||
      !form.date.trim() ||
      !form.time.trim()
    ) {
      showToast(t("instructorSessions.enterAllDetails"));
      return;
    }

    if (form.url && !/^https?:\/\/.+/i.test(form.url)) {
      showToast(t("instructorSessions.invalidUrl"));
      return;
    }

    dispatch(
      createSession({
        title: form.title,
        date: form.date,
        time: form.time,
        status: "upcoming",
        url: form.url,
      }),
    );

    setForm({
      title: "",
      date: "",
      time: "",
      url: "",
    });
  };

  const remove = (id) => dispatch(deleteSession(id));

  const startEditing = (session) => {
    setEditingId(session._id);
    setEditForm({
      title: session.title || "",
      date: session.date || "",
      time: session.time || "",
      url: session.url || "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ title: "", date: "", time: "", url: "" });
  };

  const saveEdit = (id) => {
    if (
      !editForm.title.trim() ||
      !editForm.url.trim() ||
      !editForm.date.trim() ||
      !editForm.time.trim()
    ) {
      showToast(t("instructorSessions.enterAllDetails"));
      return;
    }

    if (editForm.url && !/^https?:\/\/.+/i.test(editForm.url)) {
      showToast(t("instructorSessions.invalidUrl"));
      return;
    }

    dispatch(
      updateSession({
        id,
        sessionData: {
          title: editForm.title.trim(),
          date: editForm.date,
          time: editForm.time,
          url: editForm.url.trim(),
        },
      }),
    );
    cancelEditing();
  };

  const startSession = async (session) => {
    if (!session.url) {
      showToast(t("instructorSessions.noSessionUrl"));
      return;
    }

    setStartingSessionId(session._id);
    try {
      await dispatch(
        updateSession({ id: session._id, sessionData: { status: "live" } }),
      ).unwrap();
    } catch (error) {
      console.error("Failed to start session:", error);
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

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .is-row { flex-wrap: wrap; }
          .is-row-actions { width: 100%; justify-content: flex-start; }
        }
        .is-scroll::-webkit-scrollbar { width: 8px; }
        .is-scroll::-webkit-scrollbar-track { background: transparent; }
        .is-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 8px; }
        .is-scroll::-webkit-scrollbar-thumb:hover { background: #475569; }
        .is-session-card { transition: background 0.15s ease, border-color 0.15s ease; }
        .is-session-card:hover { background: #16213a; border-color: #2d3f5f; }
      `}</style>

      {/* Schedule form */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title={t("instructorSessions.scheduleNewSession")} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {/* Title */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#94a3b8" }}>
              {t("instructorSessions.sessionTitle")}
            </label>
            <input
              type="text"
              placeholder={t("instructorSessions.enterSessionTitle")}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          {/* Date */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#94a3b8" }}>
              {t("instructorSessions.date")}
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Time */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#94a3b8" }}>
              {t("instructorSessions.time")}
            </label>
            <input
              required
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* URL */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#94a3b8" }}>
              {t("instructorSessions.meetingUrl")}
            </label>
            <input
              required
              type="url"
              placeholder={t("instructorSessions.meetingUrlPlaceholder")}
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        <Btn variant="primary" onClick={schedule} disabled={loading}>
          {loading ? t("instructorSessions.scheduling") : t("instructorSessions.scheduleSession")}
        </Btn>
      </Card>

      {/* Session list */}
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
          <div
            className="is-scroll"
            style={{
              maxHeight: 520,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {sessions.map((s) => {
              const meta = statusMeta(s.status);
              return (
                <div
                  key={s._id}
                  className="is-row is-session-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 12px",
                    marginBottom: 10,
                    borderRadius: 12,
                    background: "#111a2e",
                    border: "1px solid #1e293b",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: meta.color,
                      flexShrink: 0,
                      boxShadow: s.status === "live" ? `0 0 0 4px ${meta.bg}` : "none",
                    }}
                  />
                  {editingId === s._id ? (
                    <div style={{ flex: 1, minWidth: 200, display: "grid", gap: 8 }}>
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        style={inputStyle}
                        placeholder={t("instructorSessions.sessionTitlePlaceholder")}
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                          gap: 8,
                        }}
                      >
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          style={inputStyle}
                        />
                        <input
                          type="time"
                          value={editForm.time}
                          onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                      <input
                        type="url"
                        value={editForm.url}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                        style={inputStyle}
                        placeholder={t("instructorSessions.meetingUrl")}
                      />
                    </div>
                  ) : (
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>
                        {s.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12.5,
                            color: "#cbd5e1",
                            background: "#1e293b",
                            padding: "3px 8px",
                            borderRadius: 6,
                          }}
                        >
                          📅 {formatDateReadable(s.date)}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12.5,
                            color: "#cbd5e1",
                            background: "#1e293b",
                            padding: "3px 8px",
                            borderRadius: 6,
                          }}
                        >
                          🕒 {formatTime12h(s.time)}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: meta.color,
                            background: meta.bg,
                            padding: "3px 9px",
                            borderRadius: 999,
                            textTransform: "uppercase",
                            letterSpacing: 0.3,
                          }}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="is-row-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                            if (!s.url) {
                              showToast(t("instructorSessions.noSessionUrl"));
                              return;
                            }
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
