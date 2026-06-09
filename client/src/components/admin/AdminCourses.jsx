import { useState } from "react";
import { useDispatch } from "react-redux";
import api from "../../config/api.js";
import { fetchAllCoursesAdmin } from "../../redux/slices/courseSlice";

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    bg: "#1c1a00",
    text: "#fbbf24",
    border: "#854d0e",
    label: "Pending Review",
    icon: "⏳",
  },
  approved: {
    bg: "#052e16",
    text: "#4ade80",
    border: "#166534",
    label: "Approved",
    icon: "✅",
  },
  rejected: {
    bg: "#2d0a0a",
    text: "#f87171",
    border: "#7f1d1d",
    label: "Rejected",
    icon: "❌",
  },
  draft: {
    bg: "#0f172a",
    text: "#64748b",
    border: "#1e293b",
    label: "Draft",
    icon: "📝",
  },
};

const fmt = (n) => (n > 0 ? `₹${n.toLocaleString("en-IN")}` : "Free");

// ── Reject reason modal ───────────────────────────────────────────────────────
function RejectModal({ course, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111827",
          border: "1px solid #334155",
          borderRadius: 18,
          padding: 28,
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        <h3
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "#f1f5f9",
            marginBottom: 6,
          }}
        >
          Reject Course
        </h3>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 18 }}>
          <span style={{ color: "#a78bfa", fontWeight: 600 }}>
            {course.title}
          </span>{" "}
          — provide a reason so the instructor can improve and resubmit.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Needs more detailed lesson descriptions, missing demo video…"
          rows={4}
          style={{
            width: "100%",
            background: "#0b1120",
            border: "1px solid #1e293b",
            borderRadius: 10,
            padding: "10px 12px",
            color: "#e2e8f0",
            fontSize: 13,
            resize: "vertical",
            fontFamily: "inherit",
            boxSizing: "border-box",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#f87171")}
          onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
        />
        <p
          style={{
            fontSize: 11,
            color: "#334155",
            marginTop: 4,
            textAlign: "right",
          }}
        >
          {reason.length}/500
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 11,
              borderRadius: 10,
              border: "1px solid #334155",
              background: "transparent",
              color: "#94a3b8",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            style={{
              flex: 2,
              padding: 11,
              borderRadius: 10,
              border: "none",
              background: loading ? "#334155" : "#7f1d1d",
              color: loading ? "#475569" : "#fca5a5",
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Rejecting…" : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Course detail drawer ──────────────────────────────────────────────────────
function CourseDrawer({ course, onClose, onApprove, onReject, actioning }) {
  const st = STATUS_CONFIG[course.approvalStatus ?? "draft"];
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 150,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 100vw)",
          height: "100%",
          background: "#0d1526",
          borderLeft: "1px solid #1e293b",
          overflowY: "auto",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: st.bg,
                  color: st.text,
                  border: `1px solid ${st.border}`,
                }}
              >
                {st.icon} {st.label}
              </span>
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#f1f5f9",
                lineHeight: 1.3,
              }}
            >
              {course.title}
            </h2>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              by {course.instructor?.name ?? "Unknown"} ·{" "}
              {course.instructor?.email}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#1e293b",
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              color: "#94a3b8",
              fontSize: 14,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Thumbnail */}
        {course.thumbnailUrl && (
          <img
            src={course.thumbnailUrl}
            alt=""
            style={{
              width: "100%",
              borderRadius: 12,
              objectFit: "cover",
              maxHeight: 180,
            }}
          />
        )}

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {[
            { label: "Price", value: fmt(course.price ?? 0) },
            { label: "Lessons", value: course.lessons?.length ?? 0 },
            { label: "Students", value: course.students?.length ?? 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 10,
                padding: "12px 14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>
                {value}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 6,
            }}
          >
            Summary
          </p>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
            {course.summary || "—"}
          </p>
        </div>

        {/* Description */}
        {course.description && (
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              Full Description
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
              {course.description}
            </p>
          </div>
        )}

        {/* Meta tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[course.category, course.board, course.level]
            .filter(Boolean)
            .map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: "#1e293b",
                  color: "#94a3b8",
                }}
              >
                {t}
              </span>
            ))}
        </div>

        {/* Lessons preview */}
        {course.lessons?.length > 0 && (
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Lessons ({course.lessons.length})
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              {course.lessons.map((l, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: "#111827",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#e2e8f0",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.title}
                  </span>
                  <span
                    style={{ fontSize: 10, color: "#475569", flexShrink: 0 }}
                  >
                    {l.type === "text" ? "📝" : "🎬"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection reason if present */}
        {course.rejectionReason && (
          <div
            style={{
              background: "#2d0a0a",
              border: "1px solid #7f1d1d",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#f87171",
                marginBottom: 4,
              }}
            >
              Rejection reason
            </p>
            <p style={{ fontSize: 13, color: "#fca5a5" }}>
              {course.rejectionReason}
            </p>
          </div>
        )}

        {/* Demo video link */}
        {course.demoVideoUrl && (
          <a
            href={course.demoVideoUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 13,
              color: "#818cf8",
              textDecoration: "underline",
            }}
          >
            🎬 Preview demo video
          </a>
        )}

        {/* Action buttons — only for pending courses */}
        {course.approvalStatus === "pending" && (
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: "auto",
              paddingTop: 16,
              borderTop: "1px solid #1e293b",
            }}
          >
            <button
              onClick={() => onReject(course)}
              disabled={actioning}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #7f1d1d",
                background: "#2d0a0a",
                color: "#f87171",
                fontWeight: 700,
                fontSize: 13,
                cursor: actioning ? "not-allowed" : "pointer",
                opacity: actioning ? 0.6 : 1,
              }}
            >
              ✕ Reject
            </button>
            <button
              onClick={() => onApprove(course._id)}
              disabled={actioning}
              style={{
                flex: 2,
                padding: 12,
                borderRadius: 12,
                border: "none",
                background: actioning
                  ? "#334155"
                  : "linear-gradient(135deg,#16a34a,#15803d)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: actioning ? "not-allowed" : "pointer",
              }}
            >
              {actioning ? "Processing…" : "✓ Approve & Publish"}
            </button>
          </div>
        )}

        {/* Re-review already approved/rejected */}
        {course.approvalStatus === "approved" && (
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: "auto",
              paddingTop: 16,
              borderTop: "1px solid #1e293b",
            }}
          >
            <button
              onClick={() => onReject(course)}
              disabled={actioning}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #7f1d1d",
                background: "#2d0a0a",
                color: "#f87171",
                fontWeight: 700,
                fontSize: 13,
                cursor: actioning ? "not-allowed" : "pointer",
                opacity: actioning ? 0.6 : 1,
              }}
            >
              Revoke approval
            </button>
          </div>
        )}
        {course.approvalStatus === "rejected" && (
          <div
            style={{
              marginTop: "auto",
              paddingTop: 16,
              borderTop: "1px solid #1e293b",
            }}
          >
            <p style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>
              Instructor will be able to edit and resubmit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main AdminCourses ─────────────────────────────────────────────────────────
export default function AdminCourses({
  courses,
  q,
  setQ,
  loading,
  error,
  onRetry,
}) {
  const dispatch = useDispatch();
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actioning, setActioning] = useState(false);

  const filtered = courses.filter((c) => {
    const matchQ =
      !q ||
      c.title?.toLowerCase().includes(q.toLowerCase()) ||
      c.instructor?.name?.toLowerCase().includes(q.toLowerCase());
    const matchStatus =
      filterStatus === "all" || (c.approvalStatus ?? "draft") === filterStatus;
    return matchQ && matchStatus;
  });

  const counts = {
    all: courses.length,
    pending: courses.filter((c) => c.approvalStatus === "pending").length,
    approved: courses.filter((c) => c.approvalStatus === "approved").length,
    rejected: courses.filter((c) => c.approvalStatus === "rejected").length,
    draft: courses.filter(
      (c) => !c.approvalStatus || c.approvalStatus === "draft",
    ).length,
  };

  const handleApprove = async (courseId) => {
    setActioning(true);
    try {
      await api.post(`/courses/${courseId}/approve`);
      dispatch(fetchAllCoursesAdmin());
      setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setActioning(false);
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setActioning(true);
    try {
      await api.post(`/courses/${rejectTarget._id}/reject`, { reason });
      dispatch(fetchAllCoursesAdmin());
      setRejectTarget(null);
      setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setActioning(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .ac-row:hover { border-color: #334155 !important; background: #131f35 !important; }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#818cf8",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Course Management
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>
            Review Courses
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Approve or reject instructor submissions before they go live.
          </p>
        </div>

        {/* Pending badge */}
        {counts.pending > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#1c1a00",
              border: "1px solid #854d0e",
              borderRadius: 12,
              padding: "10px 16px",
            }}
          >
            <span style={{ fontSize: 20 }}>⏳</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fbbf24" }}>
                {counts.pending}
              </div>
              <div style={{ fontSize: 11, color: "#92400e" }}>
                awaiting review
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status filter tabs */}
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        {[
          { key: "pending", label: `Pending (${counts.pending})` },
          { key: "approved", label: `Approved (${counts.approved})` },
          { key: "rejected", label: `Rejected (${counts.rejected})` },
          { key: "draft", label: `Draft (${counts.draft})` },
          { key: "all", label: `All (${counts.all})` },
        ].map(({ key, label }) => {
          const st = STATUS_CONFIG[key] ?? STATUS_CONFIG.draft;
          const active = filterStatus === key;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: active ? `1px solid ${st.border}` : "1px solid #1e293b",
                background: active ? st.bg : "transparent",
                color: active ? st.text : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by course title or instructor name…"
        style={{
          width: "100%",
          padding: "9px 14px",
          background: "#111827",
          border: "1px solid #1e293b",
          borderRadius: 10,
          color: "#f1f5f9",
          fontSize: 13,
          outline: "none",
          marginBottom: 14,
          boxSizing: "border-box",
        }}
      />

      {error && (
        <div
          style={{
            background: "#2d0a0a",
            border: "1px solid #7f1d1d",
            borderRadius: 12,
            padding: "12px 16px",
            color: "#f87171",
            fontSize: 13,
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          ⚠️ {error}
          <button
            onClick={onRetry}
            style={{
              background: "none",
              border: "1px solid #7f1d1d",
              borderRadius: 8,
              padding: "4px 12px",
              color: "#f87171",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Course list */}
      {loading && courses.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                height: 72,
                background: "#111827",
                borderRadius: 14,
                animation: "pulse 1.4s infinite",
              }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <p style={{ color: "#64748b", fontWeight: 600 }}>
            {counts.pending === 0 && filterStatus === "pending"
              ? "No courses pending review 🎉"
              : "No courses match this filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((course) => {
            const st = STATUS_CONFIG[course.approvalStatus ?? "draft"];
            return (
              <div
                key={course._id}
                className="ac-row"
                onClick={() => setSelected(course)}
                style={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: 14,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  animation: "fadeIn 0.2s ease",
                }}
              >
                {/* Thumb */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: "#1e293b",
                    flexShrink: 0,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    "📚"
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#f1f5f9",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "28ch",
                      }}
                    >
                      {course.title}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: st.bg,
                        color: st.text,
                        border: `1px solid ${st.border}`,
                        flexShrink: 0,
                      }}
                    >
                      {st.icon} {st.label}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 3,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      👤 {course.instructor?.name ?? "Unknown"}
                    </span>
                    {course.category && (
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {course.category}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      📚 {course.lessons?.length ?? 0} lessons
                    </span>
                    {course.price > 0 && (
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        ₹{course.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick actions for pending — without opening drawer */}
                {course.approvalStatus === "pending" && (
                  <div
                    style={{ display: "flex", gap: 8, flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRejectTarget(course);
                      }}
                      disabled={actioning}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid #7f1d1d",
                        background: "#2d0a0a",
                        color: "#f87171",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(course._id);
                      }}
                      disabled={actioning}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: "linear-gradient(135deg,#16a34a,#15803d)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                  </div>
                )}

                <span style={{ color: "#334155", fontSize: 14, flexShrink: 0 }}>
                  ›
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <CourseDrawer
          course={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={(c) => setRejectTarget(c)}
          actioning={actioning}
        />
      )}

      {/* Reject reason modal */}
      {rejectTarget && (
        <RejectModal
          course={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
          loading={actioning}
        />
      )}
    </>
  );
}
