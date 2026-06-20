import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSessions,
  createSession,
  updateSession,
  deleteSession,
  clearSessionSuccess,
  clearSessionError,
} from "../../redux/slices/sessionSlice";
import { Card, SectionHeader, Btn } from "./InstructorUi";

const InstructorSessions = ({ showToast }) => {
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

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const sessionsState = useSelector((s) => s.sessions);
  console.log("sessions state:", sessionsState);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#f8fafc",
    fontSize: 14,
    outline: "none",
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
      showToast(`Error: ${error}`);
      dispatch(clearSessionError());
    }
  }, [error, dispatch, showToast]);

  const copySessionLink = async (url) => {
    if (!url) {
      showToast("No session URL available");
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast("Session link copied");
    } catch (error) {
      showToast("Failed to copy link");
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
      showToast("Enter all session details");
      return;
    }

    if (form.url && !/^https?:\/\/.+/i.test(form.url)) {
      showToast("Enter a valid URL starting with http:// or https://");
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
      showToast("Enter all session details");
      return;
    }

    if (editForm.url && !/^https?:\/\/.+/i.test(editForm.url)) {
      showToast("Enter a valid URL starting with http:// or https://");
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

  // Flips a scheduled session live. Students will immediately see the
  // "🔴 LIVE" badge and their Join button unlock — this is the one piece of
  // control that's actually ours to give (session status in our own DB),
  // as opposed to the YouTube broadcast itself, which instructors control
  // from YouTube Studio separately.
  const startSession = (id) => {
    dispatch(updateSession({ id, sessionData: { status: "live" } }));
  };

  const endSession = (id) => {
    dispatch(updateSession({ id, sessionData: { status: "ended" } }));
  };

  return (
    <>
      {/* Schedule form */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Schedule New Session" />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {/* Title */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                color: "#94a3b8",
              }}
            >
              Session Title
            </label>
            <input
              type="text"
              placeholder="Enter session title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          {/* Date */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                color: "#94a3b8",
              }}
            >
              Date
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
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                color: "#94a3b8",
              }}
            >
              Time
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
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                color: "#94a3b8",
              }}
            >
              Meeting URL
            </label>
            <input
              required
              type="url"
              placeholder="https://meet.google.com/..."
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        <Btn variant="primary" onClick={schedule} disabled={loading}>
          {loading ? "Scheduling..." : "📅 Schedule Session"}
        </Btn>
      </Card>
      {/* Session list */}
      <Card>
        <SectionHeader title="All Sessions" />

        {loading && (
          <div
            style={{
              color: "#64748b",
              fontSize: 13,
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            Loading sessions…
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div
            style={{
              color: "#64748b",
              fontSize: 13,
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            No sessions scheduled yet.
          </div>
        )}

        {!loading &&
          sessions.map((s) => (
            <div
              key={s._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background:
                    s.status === "ended"
                      ? "#64748b"
                      : s.status === "live"
                        ? "#10b981"
                        : "#7c3aed",
                  flexShrink: 0,
                }}
              />
              {editingId === s._id ? (
                <div style={{ flex: 1, display: "grid", gap: 8 }}>
                  <input
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="Session title"
                  />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, date: e.target.value })
                      }
                      style={inputStyle}
                    />
                    <input
                      type="time"
                      value={editForm.time}
                      onChange={(e) =>
                        setEditForm({ ...editForm, time: e.target.value })
                      }
                      style={inputStyle}
                    />
                  </div>
                  <input
                    type="url"
                    value={editForm.url}
                    onChange={(e) =>
                      setEditForm({ ...editForm, url: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="Meeting URL"
                  />
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#f1f5f9",
                    }}
                  >
                    {s.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {s.date}
                    {s.time ? ` — ${s.time}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {s.status === "ended" ? "Ended" : s.status}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {editingId === s._id ? (
                  <>
                    <Btn
                      variant="success"
                      style={{ fontSize: 12 }}
                      onClick={() => saveEdit(s._id)}
                    >
                      Save
                    </Btn>
                    <Btn
                      variant="ghost"
                      style={{ fontSize: 12 }}
                      onClick={cancelEditing}
                    >
                      Cancel
                    </Btn>
                  </>
                ) : (
                  <>
                    {/* Start Session — only offered while the session is
                        still "upcoming". This is the action that actually
                        flips student-facing status, unlike the YouTube
                        broadcast itself which instructors start separately
                        in YouTube Studio. */}
                    {s.status === "upcoming" && (
                      <Btn
                        variant="primary"
                        style={{ fontSize: 12 }}
                        onClick={() => startSession(s._id)}
                      >
                        ▶ Start Session
                      </Btn>
                    )}

                    {/* Preview — opens the same broadcast a student would
                        see. Renamed from "Join" since instructors aren't
                        joining an in-app classroom, they're viewing their
                        own YouTube Live broadcast as embedded for students. */}
                    <Btn
                      variant="success"
                      style={{ fontSize: 12 }}
                      onClick={() => {
                        if (!s.url) {
                          showToast("No session URL available");
                          return;
                        }

                        window.open(s.url, "_blank");
                      }}
                    >
                      Preview
                    </Btn>

                    <Btn
                      variant="ghost"
                      style={{ fontSize: 12 }}
                      onClick={() => startEditing(s)}
                    >
                      Edit
                    </Btn>

                    {/* End Session — only relevant once a session is live
                        (or still upcoming, e.g. cancelling before it
                        starts). Hidden once already ended. */}
                    {s.status !== "ended" && (
                      <Btn
                        variant="ghost"
                        style={{ fontSize: 12 }}
                        onClick={() => endSession(s._id)}
                      >
                        End
                      </Btn>
                    )}

                    <Btn
                      variant="ghost"
                      style={{ fontSize: 12 }}
                      onClick={() => copySessionLink(s.url)}
                    >
                      Copy
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
          ))}
      </Card>
    </>
  );
};

export default InstructorSessions;
