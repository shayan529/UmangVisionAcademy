import { useState } from "react";
import React from "react";
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

// ── Video URL helpers ─────────────────────────────────────────────────────────

/**
 * Strip query-string parameters from a video URL — some CDN/storage URLs append
 * ?updatedAt=... or cache-busting params that confuse browser MIME detection.
 */
const toIkMp4 = (url) => {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.search = ""; // strip query params
    return u.toString();
  } catch {
    return url;
  }
};

// ── HLS-aware video player ────────────────────────────────────────────────────
function IKVideoPlayer({ src }) {
  const videoRef = React.useRef(null);
  const [status, setStatus] = React.useState("loading"); // loading | playing | error
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    if (!src || !videoRef.current) return;
    const video = videoRef.current;

    // Strip query params and try plain MP4 first
    const mp4Src = toIkMp4(src);

    // Try native MP4 — works for most direct video URLs
    video.src = mp4Src;
    video.load();

    const onCanPlay = () => setStatus("playing");
    const onError = async () => {
      // Native MP4 failed → try HLS.js with the original URL
      try {
        const HlsModule =
          await import("https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js");
        const Hls = HlsModule.default ?? HlsModule;

        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: false });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setStatus("playing");
            video.play().catch(() => { });
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              setStatus("error");
              setErrorMsg("Could not load video stream.");
            }
          });
          video._hls = hls; // keep ref for cleanup
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari native HLS
          video.src = src;
          video.load();
          video.addEventListener("canplay", () => setStatus("playing"), {
            once: true,
          });
        } else {
          setStatus("error");
          setErrorMsg("HLS is not supported in this browser.");
        }
      } catch {
        setStatus("error");
        setErrorMsg("Failed to load video player library.");
      }
    };

    video.addEventListener("canplay", onCanPlay, { once: true });
    video.addEventListener("error", onError, { once: true });

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      if (video._hls) {
        video._hls.destroy();
        delete video._hls;
      }
    };
  }, [src]);

  return (
    <div
      style={{
        position: "relative",
        background: "#000",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Loading shimmer */}
      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            background: "linear-gradient(135deg,#060d1f,#0d1526)",
          }}
        >
          <svg
            className="ik-spin"
            viewBox="0 0 24 24"
            fill="none"
            style={{ width: 32, height: 32 }}
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="rgba(56,189,248,0.2)"
              strokeWidth="3"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="#38bdf8"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span style={{ fontSize: 12, color: "#475569" }}>Loading video…</span>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div
          style={{
            height: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "#060d1f",
          }}
        >
          <span style={{ fontSize: 32 }}>⚠️</span>
          <p style={{ fontSize: 13, color: "#f87171", fontWeight: 600 }}>
            Video failed to load
          </p>
          <p
            style={{
              fontSize: 11,
              color: "#475569",
              maxWidth: 280,
              textAlign: "center",
            }}
          >
            {errorMsg}
          </p>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 12,
              color: "#38bdf8",
              textDecoration: "underline",
              marginTop: 4,
            }}
          >
            Open in new tab ↗
          </a>
        </div>
      )}

      <video
        ref={videoRef}
        controls
        controlsList="nodownload"
        playsInline
        style={{
          width: "100%",
          display: "block",
          maxHeight: 420,
          opacity: status === "playing" ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
    </div>
  );
}

// ── Lesson Preview Modal ──────────────────────────────────────────────────────
function LessonPreviewModal({ lesson, lessonIndex, onClose }) {
  if (!lesson) return null;

  const isVideo = lesson.type !== "text";
  const hasVideo = !!lesson.videoUrl;
  const hasText = !!lesson.content;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fadeInModal 0.18s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: isVideo ? 760 : 600,
          maxHeight: "90vh",
          background: "#0d1526",
          border: "1px solid #1e3a5f",
          borderRadius: 20,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(56,189,248,0.08)",
          animation: "slideUpModal 0.22s cubic-bezier(.22,1,.36,1)",
        }}
      >
        {/* ── Modal header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 20px",
            background:
              "linear-gradient(135deg,rgba(14,165,233,0.1),rgba(99,102,241,0.07))",
            borderBottom: "1px solid #1e3a5f",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            {/* Lesson number badge */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                flexShrink: 0,
                background: "rgba(14,165,233,0.15)",
                border: "1px solid rgba(56,189,248,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                color: "#38bdf8",
              }}
            >
              {lessonIndex + 1}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#f1f5f9",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {lesson.title}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 20,
                    background: isVideo
                      ? "rgba(99,102,241,0.15)"
                      : "rgba(16,185,129,0.12)",
                    color: isVideo ? "#818cf8" : "#34d399",
                    border: `1px solid ${isVideo ? "rgba(99,102,241,0.3)" : "rgba(16,185,129,0.25)"}`,
                  }}
                >
                  {isVideo ? "🎬 Video Lesson" : "📝 Text Lesson"}
                </span>
                {lesson.duration && (
                  <span style={{ fontSize: 11, color: "#475569" }}>
                    ⏱ {lesson.duration}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#94a3b8",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#334155";
              e.currentTarget.style.color = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1e293b";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Video content ── */}
        {isVideo && (
          <div style={{ padding: "20px 20px 8px", flexShrink: 0 }}>
            {hasVideo ? (
              <IKVideoPlayer src={lesson.videoUrl} />
            ) : (
              <div
                style={{
                  height: 200,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  background: "#060d1f",
                  borderRadius: 12,
                  border: "1px dashed #1e3a5f",
                }}
              >
                <span style={{ fontSize: 36 }}>🎬</span>
                <p style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                  No video URL attached
                </p>
                <p style={{ fontSize: 11, color: "#334155" }}>
                  The instructor hasn't uploaded a video for this lesson yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Text content ── */}
        {!isVideo && (
          <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
            {hasText ? (
              <div
                style={{
                  fontSize: 14,
                  color: "#94a3b8",
                  lineHeight: 1.9,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: "#060d1f",
                  borderRadius: 12,
                  padding: "18px 20px",
                  border: "1px solid #1e293b",
                }}
              >
                {lesson.content}
              </div>
            ) : (
              <div
                style={{
                  height: 160,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  background: "#060d1f",
                  borderRadius: 12,
                  border: "1px dashed #1e3a5f",
                }}
              >
                <span style={{ fontSize: 36 }}>📄</span>
                <p style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                  No text content attached
                </p>
                <p style={{ fontSize: 11, color: "#334155" }}>
                  The instructor hasn't added written content for this lesson
                  yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Footer with video URL ── */}
        {isVideo && hasVideo && (
          <div
            style={{
              padding: "10px 20px 16px",
              borderTop: "1px solid #0f1e35",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11, color: "#334155", flexShrink: 0 }}>
              🔗
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#334155",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {lesson.videoUrl}
            </span>
          </div>
        )}

        {/* ── Dismiss hint ── */}
        <div
          style={{ padding: "8px 0 12px", textAlign: "center", flexShrink: 0 }}
        >
          <span style={{ fontSize: 11, color: "#1e3a5f" }}>
            Click outside to close
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Course detail drawer ──────────────────────────────────────────────────────
function CourseDrawer({ course, onClose, onApprove, onReject, onUnreject, actioning }) {
  const st = STATUS_CONFIG[course.approvalStatus ?? "draft"];
  const [previewLesson, setPreviewLesson] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);

  const openPreview = (lesson, index) => {
    setPreviewLesson(lesson);
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewLesson(null);
    setPreviewIndex(null);
  };

  const isBulkCourse =
    (course.lessons ?? []).some((l) => l.subject) ||
    (course.notes ?? []).some((n) => n.subject) ||
    (course.subjectQuizzes ?? []).length > 0;

  const subjects = isBulkCourse
    ? Array.from(
        new Set([
          ...(course.lessons ?? []).map((l) => l.subject).filter(Boolean),
          ...(course.notes ?? []).map((n) => n.subject).filter(Boolean),
        ])
      ).map((subj) => ({
        name: subj,
        lessons: (course.lessons ?? []).map((l, i) => ({ ...l, _globalIndex: i })).filter((l) => l.subject === subj),
        notes: (course.notes ?? []).map((n, i) => ({ ...n, _globalIndex: i })).filter((n) => n.subject === subj),
      }))
    : [
        {
          name: "",
          lessons: (course.lessons ?? []).map((l, i) => ({ ...l, _globalIndex: i })),
          notes: (course.notes ?? []).map((n, i) => ({ ...n, _globalIndex: i })),
        },
      ];

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
          width: "min(520px, 100vw)",
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
            gridTemplateColumns: "repeat(3,1fr)",
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

        {/* ── Curriculum ── */}
        {(course.lessons?.length > 0 || course.notes?.length > 0) && (
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
              Curriculum ({course.lessons?.length ?? 0} lessons, {course.notes?.length ?? 0} notes)
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {subjects.map((subj, sIdx) => (
                <div key={sIdx} style={{ display: "flex", flexDirection: "column" }}>
                  {subj.name && (
                    <div style={{
                      padding: "8px 14px",
                      background: "#1e293b",
                      borderRadius: (subj.lessons.length > 0 || subj.notes.length > 0) ? "10px 10px 0 0" : "10px",
                      color: "#f1f5f9",
                      fontWeight: 700,
                      fontSize: 13,
                      border: "1px solid #334155",
                      borderBottom: "none"
                    }}>
                      {subj.name}
                    </div>
                  )}
                  
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    padding: subj.name ? "10px" : "0",
                    background: subj.name ? "#111827" : "transparent",
                    border: subj.name ? "1px solid #1e293b" : "none",
                    borderTop: "none",
                    borderRadius: subj.name ? "0 0 10px 10px" : "0"
                  }}>
                    {/* Lessons */}
                    {subj.lessons.map((l) => {
                      const isVideo = l.type !== "text";
                      const hasContent = isVideo ? !!l.videoUrl : !!l.content;
                      return (
                        <div
                          key={"l"+l._globalIndex}
                          onClick={() => openPreview(l, l._globalIndex)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 14px",
                            background: "#111827",
                            border: "1px solid #1e293b",
                            borderRadius: 10,
                            fontSize: 12,
                            color: "#e2e8f0",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(14,165,233,0.07)";
                            e.currentTarget.style.borderColor = "rgba(56,189,248,0.25)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#111827";
                            e.currentTarget.style.borderColor = "#1e293b";
                          }}
                        >
                          <span style={{ color: "#64748b", fontSize: 10, fontWeight: 700, flexShrink: 0, width: 16, textAlign: "center" }}>
                            {l._globalIndex + 1}
                          </span>
                          <span style={{ fontSize: 14, flexShrink: 0 }}>
                            {isVideo ? "🎬" : "📝"}
                          </span>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                            {l.title}
                          </span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 20,
                            flexShrink: 0,
                            background: hasContent ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                            color: hasContent ? "#4ade80" : "#f87171",
                            border: `1px solid ${hasContent ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                          }}>
                            {hasContent ? (isVideo ? "Has video" : "Has text") : "No content"}
                          </span>
                          <div style={{
                            flexShrink: 0,
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: "rgba(14,165,233,0.12)",
                            border: "1px solid rgba(56,189,248,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            color: "#38bdf8",
                          }}>
                            {isVideo ? "▶" : "👁"}
                          </div>
                        </div>
                      );
                    })}

                    {/* Notes */}
                    {subj.notes.map((n) => (
                      <div
                        key={"n"+n._globalIndex}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "10px 14px",
                          background: "#111827",
                          border: "1px solid #1e293b",
                          borderRadius: 10,
                          fontSize: 12,
                          color: "#e2e8f0",
                        }}
                      >
                        <span style={{ color: "#64748b", fontSize: 10, fontWeight: 700, flexShrink: 0, width: 16, textAlign: "center", marginTop: 2 }}>
                          {n._globalIndex + 1}
                        </span>
                        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                          📄
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.title || "Untitled note"}
                          </p>
                          {n.description && (
                            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, lineHeight: 1.5 }}>
                              {n.description}
                            </p>
                          )}
                        </div>
                        {n.fileUrl ? (
                          <a href={n.fileUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 20,
                            flexShrink: 0,
                            background: "rgba(56,189,248,0.1)",
                            color: "#38bdf8",
                            border: "1px solid rgba(56,189,248,0.25)",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                          }}>
                            View file ↗
                          </a>
                        ) : (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: 20,
                            flexShrink: 0,
                            background: "rgba(239,68,68,0.1)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.2)",
                            whiteSpace: "nowrap",
                          }}>
                            No file
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lesson preview modal — rendered inside drawer, portalled above everything */}
        {previewLesson && (
          <LessonPreviewModal
            lesson={previewLesson}
            lessonIndex={previewIndex}
            onClose={closePreview}
          />
        )}

        {/* Rejection reason */}
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

        {/* Action buttons — pending */}
        {onApprove && onReject && course.approvalStatus === "pending" && (
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

        {/* Revoke approved */}
        {onReject && course.approvalStatus === "approved" && (
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
            <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginBottom: 12 }}>
              Instructor will be able to edit and resubmit.
            </p>
            {onUnreject && (
              <button
                onClick={() => onUnreject(course._id)}
                disabled={actioning}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #eab308",
                  background: "#422006",
                  color: "#fde047",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: actioning ? "not-allowed" : "pointer",
                  opacity: actioning ? 0.6 : 1,
                }}
              >
                Mark as Pending
              </button>
            )}
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
  canApprove = true,
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

  const handleUnreject = async (courseId) => {
    if (!courseId) return;
    setActioning(true);
    try {
      await api.post(`/courses/${courseId}/unreject`);
      dispatch(fetchAllCoursesAdmin());
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
        @keyframes fadeIn       { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInModal  { from{opacity:0} to{opacity:1} }
        @keyframes slideUpModal { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes ik-spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .ac-row:hover { border-color:#334155 !important; background:#131f35 !important; }
        .ik-spin { animation: ik-spin 0.8s linear infinite; }
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
                {canApprove && course.approvalStatus === "pending" && (
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

      {selected && (
        <CourseDrawer
          course={courses.find((c) => c._id === selected._id) ?? selected}
          onClose={() => setSelected(null)}
          onApprove={canApprove ? handleApprove : undefined}
          onReject={canApprove ? (c) => setRejectTarget(c) : undefined}
          onUnreject={canApprove ? handleUnreject : undefined}
          actioning={actioning}
        />
      )}

      {canApprove && rejectTarget && (
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