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
  const [form, setForm] = useState({ title: "", date: "", time: "" });

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

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

  // ── Handlers ──────────────────────────────────────────────────────────
  const schedule = () => {
    if (!form.title.trim()) {
      showToast("Enter a session title");
      return;
    }
    dispatch(
      createSession({
        title: form.title,
        date: form.date || "TBD",
        time: form.time || "TBD",
        status: "upcoming",
      }),
    );
    setForm({ title: "", date: "", time: "" });
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
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 14,
          }}
        >
          {[
            {
              label: "Title",
              field: "title",
              type: "text",
              placeholder: "Session title",
            },
            { label: "Date", field: "date", type: "date", placeholder: "" },
            { label: "Time", field: "time", type: "time", placeholder: "" },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>
                {label}
              </div>
              <input
                type={type}
                placeholder={placeholder}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 10,
                  color: "#f1f5f9",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>
        <Btn variant="primary" onClick={schedule} disabled={loading}>
          {loading ? "Scheduling…" : "📅 Schedule Session"}
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
                  style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {s.date}
                  {s.time ? ` — ${s.time}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {s.status === "live" ? (
                  <Btn
                    variant="success"
                    style={{ fontSize: 12 }}
                    onClick={() => showToast("Joining session…")}
                  >
                    Join Live
                  </Btn>
                ) : (
                  <Btn
                    variant="ghost"
                    style={{ fontSize: 12 }}
                    onClick={() => showToast("Session link copied")}
                  >
                    Copy Link
                  </Btn>
                )}
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
