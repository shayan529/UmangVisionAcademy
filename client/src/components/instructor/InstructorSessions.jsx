import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSessions,
  createSession,
  deleteSession,
  clearSessionSuccess,
  clearSessionError,
} from "../../redux/slices/sessionSlice";
import { Card, SectionHeader, Btn } from "./InstructorUi";

const InstructorSessions = ({ showToast }) => {
  const dispatch = useDispatch();
  const { sessions, loading, success, error } = useSelector((s) => s.sessions);
  const [form, setForm] = useState({ title: "", date: "", time: "", url: "" });

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
                  background: s.status === "live" ? "#10b981" : "#7c3aed",
                  flexShrink: 0,
                }}
              />
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
              </div>
              <div style={{ display: "flex", gap: 8 }}>
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
                  Join
                </Btn>

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
              </div>
            </div>
          ))}
      </Card>
    </>
  );
};

export default InstructorSessions;
