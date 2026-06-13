import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import api from "../../config/api.js";
import { updateUserScoreAndSubmissions } from "../../redux/slices/authSlice.js";
import TextLessonViewer from "./TextLessonViewer.jsx";

const fmt = (secs) => {
  if (!secs) return "";
  const m = Math.floor(secs / 60),
    s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};
const fmtMins = (mins) => {
  if (!mins) return "";
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

const groupIntoChapters = (lessons = []) => {
  const chapters = [];
  let current = null;
  lessons.forEach((lesson, idx) => {
    if (
      lesson.chapterTitle &&
      (!current || current.title !== lesson.chapterTitle)
    ) {
      current = { title: lesson.chapterTitle, lessons: [] };
      chapters.push(current);
    }
    if (!current) {
      current = { title: "Chapter 1", lessons: [] };
      chapters.push(current);
    }
    current.lessons.push({ ...lesson, globalIdx: idx });
  });
  return chapters;
};

// ── Certificate Earned Modal ──────────────────────────────────────────────────
function CertificateEarnedModal({ course, onClose, onViewCertificates }) {
  const themes = {
    purple: { colors: ["#3b0764", "#6d28d9"], accent: "#c4b5fd" },
    blue: { colors: ["#1e3a8a", "#1d4ed8"], accent: "#bfdbfe" },
    green: { colors: ["#052e16", "#166534"], accent: "#bbf7d0" },
    gold: { colors: ["#451a03", "#b45309"], accent: "#fef08a" },
    dark: { colors: ["#0f172a", "#1e293b"], accent: "#e2e8f0" },
  };
  const cert = course?.certificate;
  const t = themes[cert?.theme] || themes.purple;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d1526",
          border: "1px solid #1e293b",
          borderRadius: 24,
          width: "100%",
          maxWidth: 440,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          animation: "certPop 0.45s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Gradient banner */}
        <div
          style={{
            background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`,
            padding: "28px 24px 24px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -30,
              top: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -20,
              bottom: -20,
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }}
          />

          <div
            style={{
              fontSize: 52,
              marginBottom: 12,
              position: "relative",
              zIndex: 1,
            }}
          >
            🏅
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: t.accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              marginBottom: 6,
              position: "relative",
              zIndex: 1,
            }}
          >
            Certificate Earned
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              position: "relative",
              zIndex: 1,
            }}
          >
            {cert?.title || "Certificate of Completion"}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "22px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Confetti-style stars row */}
          <div style={{ textAlign: "center", fontSize: 20, letterSpacing: 4 }}>
            🌟 🎉 🌟
          </div>

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: 14,
                color: "#e2e8f0",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              You've completed
            </p>
            <p
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#a78bfa",
                lineHeight: 1.3,
                marginBottom: 10,
              }}
            >
              {course?.title}
            </p>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
              Your certificate is ready. Head to your Certificates page to view,
              download, or share it with the world.
            </p>
          </div>

          {/* Certificate mini-preview strip */}
          <div
            style={{
              background: `linear-gradient(135deg, ${t.colors[0]}cc, ${t.colors[1]}cc)`,
              borderRadius: 12,
              padding: "12px 16px",
              border: `1px solid ${t.accent}33`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 24 }}>📜</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: t.accent,
                  marginBottom: 2,
                }}
              >
                {cert?.title || "Certificate of Completion"}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                AICoaching Platform · Issued today
              </div>
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#4ade80",
                background: "#052e16",
                border: "1px solid #166534",
                padding: "3px 8px",
                borderRadius: 20,
              }}
            >
              EARNED
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: 12,
                border: "1px solid #334155",
                background: "transparent",
                color: "#94a3b8",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Stay here
            </button>
            <button
              onClick={onViewCertificates}
              style={{
                flex: 2,
                padding: "11px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              🎓 View My Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Rating Modal ──────────────────────────────────────────────────────────────
function RatingModal({ course, user, onClose, onSubmitted }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const existingRating = useMemo(() => {
    if (!user || !course?.ratings) return null;
    return course.ratings.find(
      (r) => r.user?.toString() === user._id?.toString(),
    );
  }, [course, user]);

  useEffect(() => {
    if (existingRating) {
      setSelected(existingRating.rating ?? 0);
      setReview(existingRating.review ?? "");
    }
  }, [existingRating]);

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  const active = hovered || selected;

  const handleSubmit = async () => {
    if (!selected) {
      setError("Please select a star rating.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post(`/courses/${course._id}/rate`, {
        rating: selected,
        review: review.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        onSubmitted?.(selected);
        onClose();
      }, 1400);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d1526",
          border: "1px solid #1e293b",
          borderRadius: 20,
          width: "100%",
          maxWidth: 420,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid #1e293b",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#f1f5f9",
                marginBottom: 3,
              }}
            >
              {existingRating ? "Update your rating" : "Rate this course"}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#64748b",
                maxWidth: 300,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {course?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#1e293b",
              border: "none",
              borderRadius: 8,
              width: 28,
              height: 28,
              color: "#94a3b8",
              fontSize: 14,
              cursor: "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
        {success ? (
          <div
            style={{
              padding: "40px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ fontSize: 48 }}>🎉</div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>
                Thanks for your feedback!
              </p>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                Your rating helps other students.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ padding: "22px 20px 20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setSelected(star)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 2px",
                    fontSize: 36,
                    lineHeight: 1,
                    color: star <= active ? "#fbbf24" : "#1e293b",
                    transform: star <= active ? "scale(1.15)" : "scale(1)",
                    transition: "all 0.12s",
                    filter:
                      star <= active
                        ? "drop-shadow(0 0 6px rgba(251,191,36,0.5))"
                        : "none",
                  }}
                  aria-label={`Rate ${star} stars`}
                >
                  ★
                </button>
              ))}
            </div>
            <p
              style={{
                textAlign: "center",
                fontSize: 13,
                fontWeight: 700,
                color: active ? "#fbbf24" : "#475569",
                marginBottom: 18,
                minHeight: 20,
                transition: "color 0.15s",
              }}
            >
              {active ? labels[active] : "Tap a star to rate"}
            </p>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Review (optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share what you liked or what could be improved…"
                rows={3}
                maxLength={500}
                style={{
                  width: "100%",
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: 10,
                  padding: "10px 12px",
                  color: "#e2e8f0",
                  fontSize: 13,
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
              />
              <p
                style={{
                  textAlign: "right",
                  fontSize: 11,
                  color: "#334155",
                  marginTop: 4,
                }}
              >
                {review.length}/500
              </p>
            </div>
            {error && (
              <p
                style={{
                  fontSize: 12,
                  color: "#f87171",
                  marginBottom: 12,
                  background: "#450a0a",
                  padding: "8px 12px",
                  borderRadius: 8,
                }}
              >
                {error}
              </p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 12,
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
                onClick={handleSubmit}
                disabled={loading || !selected}
                style={{
                  flex: 2,
                  padding: "11px",
                  borderRadius: 12,
                  border: "none",
                  background:
                    loading || !selected
                      ? "#1e293b"
                      : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  color: loading || !selected ? "#475569" : "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: loading || !selected ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {loading
                  ? "Submitting…"
                  : existingRating
                    ? "Update Rating"
                    : "Submit Rating"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Video Player ──────────────────────────────────────────────────────────────
const VideoPlayer = ({ url, poster, onEnded, onProgress, initialTime = 0 }) => {
  const ref = useRef(null);
  const playingRef = useRef(false);
  const hideTimer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    setPlaying(false);
    playingRef.current = false;
    setProgress(0);
    setCurrent(0);
    setDuration(0);
    setShowControls(true);
  }, [url]);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const resetHide = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playingRef.current) setShowControls(false);
    }, 3000);
  }, []);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (playingRef.current) v.pause();
    else v.play().catch((e) => console.warn("play() failed:", e));
  }, []);

  const onTimeUpdate = useCallback(() => {
    const v = ref.current;
    if (!v || !v.duration) return;
    const pct = (v.currentTime / v.duration) * 100;
    setProgress(pct);
    setCurrent(v.currentTime);
    onProgress?.(pct, v.currentTime);
  }, [onProgress]);

  const seek = useCallback((e) => {
    const v = ref.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  }, []);

  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) {
      ref.current?.parentElement?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  const cycleSpeed = useCallback(() => {
    const next = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    if (ref.current) ref.current.playbackRate = next;
    setPlaybackRate(next);
  }, [playbackRate]);

  if (!url)
    return (
      <div
        style={{
          aspectRatio: "16/9",
          background: "#0f172a",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 48 }}>🎬</span>
        <p style={{ color: "#475569", fontSize: 14 }}>
          No video for this lesson
        </p>
      </div>
    );

  return (
    <div
      onMouseMove={resetHide}
      style={{
        position: "relative",
        aspectRatio: "16/9",
        background: "#000",
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <video
        ref={ref}
        src={url}
        poster={poster}
        playsInline
        muted={muted}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={() => {
          const v = ref.current;
          if (!v) return;
          setDuration(v.duration);
          if (initialTime > 0 && initialTime < v.duration - 1)
            v.currentTime = initialTime;
        }}
        onPlay={() => {
          playingRef.current = true;
          setPlaying(true);
          resetHide();
        }}
        onPause={() => {
          playingRef.current = false;
          setPlaying(false);
          setShowControls(true);
          clearTimeout(hideTimer.current);
        }}
        onEnded={() => {
          playingRef.current = false;
          setPlaying(false);
          setShowControls(true);
          onEnded?.();
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
      {!playing && (
        <div
          onClick={toggle}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "rgba(124,58,237,0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 50px rgba(124,58,237,0.6)",
            }}
          >
            <span style={{ fontSize: 26, marginLeft: 5, color: "#fff" }}>
              ▶
            </span>
          </div>
        </div>
      )}
      {playing && (
        <div
          onClick={toggle}
          style={{ position: "absolute", inset: 0, cursor: "pointer" }}
        />
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "8px 14px 12px",
          background: "linear-gradient(transparent,rgba(0,0,0,0.85))",
          transition: "opacity 0.25s",
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        <div
          onClick={seek}
          style={{
            height: 4,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 2,
            cursor: "pointer",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#7c3aed",
              borderRadius: 2,
              transition: "width 0.1s",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={toggle}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 18,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.7)",
              minWidth: 90,
            }}
          >
            {fmt(current)} / {fmt(duration)}
          </span>
          <button
            onClick={() => setMuted((m) => !m)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={cycleSpeed}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {playbackRate}x
          </button>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              fontWeight: 600,
            }}
          >
            Umang Vision Academy
          </span>
          <button
            onClick={toggleFS}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 16,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Quiz Viewer ───────────────────────────────────────────────────────────────
function QuizViewer({
  course,
  user,
  quizStep,
  setQuizStep,
  selectedAnswers,
  setSelectedAnswers,
  currentQuestion,
  setCurrentQuestion,
  quizResult,
  quizLoading,
  quizLocked,
  completedCount,
  totalLessons,
  onSubmit,
  onClose,
}) {
  const quiz = course?.quiz;
  const questions = quiz?.questions || [];
  const LABELS = ["A", "B", "C", "D"];
  const totalPts = questions.length * 10;
  const prevSub = user?.quizSubmissions?.find(
    (s) => s.courseId?.toString() === course._id?.toString(),
  );

  if (quizStep === "intro") {
    if (quizLocked) {
      const lockedProgress = totalLessons
        ? Math.round((completedCount / totalLessons) * 100)
        : 0;
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 420,
            padding: "32px 24px",
            textAlign: "center",
            gap: 18,
          }}
        >
          <span style={{ fontSize: 52 }}>🔒</span>
          <div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#f1f5f9",
                marginBottom: 6,
              }}
            >
              Final Quiz Locked
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", maxWidth: 360 }}>
              Complete every lesson before starting the final course quiz.
            </p>
          </div>
          <div
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 14,
              padding: "14px 18px",
              width: "100%",
              maxWidth: 320,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              <span>Lessons completed</span>
              <span>
                {completedCount}/{totalLessons}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "#1e293b",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${lockedProgress}%`,
                  background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "10px 22px",
              borderRadius: 12,
              border: "1px solid #334155",
              background: "transparent",
              color: "#94a3b8",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Back to Lessons
          </button>
        </div>
      );
    }
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 420,
          padding: "32px 24px",
          textAlign: "center",
          gap: 20,
        }}
      >
        <span style={{ fontSize: 52 }}>🎯</span>
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#f1f5f9",
              marginBottom: 6,
            }}
          >
            {quiz.title || "Final Quiz"}
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", maxWidth: 340 }}>
            Test your knowledge. Each correct answer earns 10 points.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 360 }}>
          {[
            { icon: "📝", label: "Questions", val: questions.length },
            { icon: "🏆", label: "Max Points", val: `${totalPts} pts` },
            {
              icon: "⭐",
              label: "Best Score",
              val: prevSub ? `${prevSub.score}%` : "—",
            },
          ].map(({ icon, label, val }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 14,
                padding: "12px 8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
                {val}
              </div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            background: "#111827",
            border: "1px solid #1e293b",
            borderRadius: 14,
            padding: "14px 18px",
            width: "100%",
            maxWidth: 360,
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Instructions
          </p>
          {[
            "Each question has one correct answer",
            "Navigate freely between questions",
            "Results shown after submission",
          ].map((t) => (
            <p
              key={t}
              style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}
            >
              • {t}
            </p>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 22px",
              borderRadius: 12,
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
            onClick={() => setQuizStep("quiz")}
            style={{
              padding: "10px 28px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {prevSub ? "Retake Quiz" : "Start Quiz"} →
          </button>
        </div>
      </div>
    );
  }

  if (quizStep === "quiz") {
    const q = questions[currentQuestion];
    const answered = Object.keys(selectedAnswers).length;
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: 480 }}>
        <div
          style={{
            padding: "14px 20px 12px",
            borderBottom: "1px solid #1e293b",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            <span>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span>
              {answered}/{questions.length} answered
            </span>
          </div>
          <div
            style={{
              height: 4,
              background: "#1e293b",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                borderRadius: 2,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1, padding: "20px 20px 12px", overflowY: "auto" }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#f1f5f9",
              lineHeight: 1.6,
              marginBottom: 18,
            }}
          >
            {q.question}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.options.map((opt, oIdx) => {
              const sel = selectedAnswers[currentQuestion] === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() =>
                    setSelectedAnswers((prev) => ({
                      ...prev,
                      [currentQuestion]: oIdx,
                    }))
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `2px solid ${sel ? "#7c3aed" : "#1e293b"}`,
                    background: sel ? "#1e1b4b" : "#111827",
                    color: sel ? "#a78bfa" : "#e2e8f0",
                    fontWeight: sel ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: `2px solid ${sel ? "#7c3aed" : "#334155"}`,
                      background: sel ? "#7c3aed" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      color: sel ? "#fff" : "#64748b",
                      flexShrink: 0,
                    }}
                  >
                    {LABELS[oIdx]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #1e293b",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={() => setCurrentQuestion((c) => Math.max(0, c - 1))}
            disabled={currentQuestion === 0}
            style={{
              padding: "9px 18px",
              borderRadius: 10,
              border: "1px solid #334155",
              background: "transparent",
              color: currentQuestion === 0 ? "#334155" : "#e2e8f0",
              fontWeight: 600,
              fontSize: 12,
              cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Back
          </button>
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  border: "none",
                  background:
                    idx === currentQuestion
                      ? "#7c3aed"
                      : selectedAnswers[idx] !== undefined
                        ? "#052e16"
                        : "#1e293b",
                  color:
                    idx === currentQuestion
                      ? "#fff"
                      : selectedAnswers[idx] !== undefined
                        ? "#4ade80"
                        : "#64748b",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  transform:
                    idx === currentQuestion ? "scale(1.15)" : "scale(1)",
                  transition: "all 0.15s",
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={() =>
                setCurrentQuestion((c) => Math.min(questions.length - 1, c + 1))
              }
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                border: "none",
                background: "#7c3aed",
                color: "#fff",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={quizLoading}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                border: "none",
                background: quizLoading
                  ? "#334155"
                  : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                cursor: quizLoading ? "not-allowed" : "pointer",
              }}
            >
              {quizLoading ? "Submitting…" : "Submit Quiz"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (quizStep === "result" && quizResult) {
    const {
      percentage,
      correctCount,
      totalQuestions,
      pointsEarned,
      breakdown,
    } = quizResult;
    const passed = percentage >= 60;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "28px 24px",
          gap: 20,
          overflowY: "auto",
        }}
      >
        <span style={{ fontSize: 48 }}>{passed ? "🎉" : "📚"}</span>
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#f1f5f9",
              marginBottom: 4,
            }}
          >
            {passed ? "Quiz Completed!" : "Keep Practicing!"}
          </h2>
          <p style={{ fontSize: 12, color: "#64748b" }}>
            {passed
              ? "Great job! Your score has been recorded."
              : "You need 60% to pass. Give it another shot!"}
          </p>
        </div>
        <div style={{ position: "relative", width: 110, height: 110 }}>
          <svg
            viewBox="0 0 100 100"
            style={{
              width: "100%",
              height: "100%",
              transform: "rotate(-90deg)",
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#1e293b"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={passed ? "#4ade80" : "#f97316"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * 263.9} 263.9`}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9" }}>
              {percentage}%
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 360 }}>
          {[
            {
              icon: "✅",
              label: "Correct",
              val: `${correctCount}/${totalQuestions}`,
            },
            { icon: "⭐", label: "Points Earned", val: `+${pointsEarned}` },
            {
              icon: passed ? "🏆" : "❌",
              label: "Status",
              val: passed ? "PASSED" : "FAILED",
            },
          ].map(({ icon, label, val }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: passed ? "#052e16" : "#1c0a00",
                border: `1px solid ${passed ? "#166534" : "#431407"}`,
                borderRadius: 14,
                padding: "10px 8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: passed ? "#4ade80" : "#fb923c",
                }}
              >
                {val}
              </div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        {breakdown && breakdown.length > 0 && (
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              maxHeight: 180,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {breakdown.map((b, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: b.correct ? "#052e16" : "#1c0a00",
                  border: `1px solid ${b.correct ? "#166534" : "#431407"}`,
                  fontSize: 12,
                  color: b.correct ? "#4ade80" : "#fb923c",
                }}
              >
                <span>{b.correct ? "✓" : "✗"}</span>
                <span style={{ flex: 1 }}>
                  Q{i + 1}:{" "}
                  {b.correct ? "Correct" : `Correct answer: ${b.correctOption}`}
                </span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              setQuizStep("intro");
              setSelectedAnswers({});
              setCurrentQuestion(0);
            }}
            style={{
              padding: "10px 22px",
              borderRadius: 12,
              border: "1px solid #334155",
              background: "transparent",
              color: "#94a3b8",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Retake
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px 22px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ── CoursePage ────────────────────────────────────────────────────────────────
export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useSelector((s) => s.auth);

  const storageKey = `course-progress-${id}`;
  const savedState = useMemo(() => {
    if (typeof window === "undefined" || !id) return null;
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "null");
    } catch {
      return null;
    }
  }, [storageKey, id]);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIdx, setActiveIdx] = useState(savedState?.lastLesson ?? 0);
  const [completed, setCompleted] = useState(
    () => new Set(savedState?.completed ?? []),
  );
  const [currentVideoPct, setCurrentVideoPct] = useState(0);

  // ── Quiz state ──────────────────────────────────────────────────────────────
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState("intro");
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // ── Certificate earned modal ────────────────────────────────────────────────
  const [showCertModal, setShowCertModal] = useState(false);

  // ── Rating state ────────────────────────────────────────────────────────────
  const [showRating, setShowRating] = useState(false);
  const [localRatingAvg, setLocalRatingAvg] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCh, setExpandedCh] = useState(new Set([0]));
  const openQuizFromUrl = searchParams.get("quiz") === "1";
  const totalLessonCount = course?.lessons?.length ?? 0;
  const courseComplete =
    totalLessonCount > 0 && completed.size >= totalLessonCount;

  const handleQuizSubmit = async () => {
    setQuizLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/courses/${course._id}/quiz/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: selectedAnswers }),
      });
      const data = await res.json();
      if (data.success) {
        setQuizResult(data);
        dispatch(
          updateUserScoreAndSubmissions({
            score: data.newTotalScore,
            submission: { courseId: course._id, score: data.percentage },
          }),
        );
        setQuizStep("result");

        // ── Show certificate popup if course has a certificate enabled ──
        if (course?.certificate?.enabled) {
          // Small delay so result screen renders first
          setTimeout(() => setShowCertModal(true), 1200);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const lessonProgressRef = useRef(savedState?.lessonProgress ?? {});
  const [initialTime, setInitialTime] = useState(
    lessonProgressRef.current[savedState?.lastLesson ?? 0] || 0,
  );

  useEffect(() => {
    setInitialTime(lessonProgressRef.current[activeIdx] || 0);
    setCurrentVideoPct(0);
  }, [activeIdx]);

  const saveTimer = useRef(null);
  const pendingSave = useRef({});
  const scheduleSave = useCallback(
    (patch) => {
      Object.assign(pendingSave.current, patch);
      if (saveTimer.current) return;
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        localStorage.setItem(storageKey, JSON.stringify(pendingSave.current));
      }, 5000);
    },
    [storageKey],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { state: { from: `/courses/${id}` } });
      return;
    }
    api
      .get(`/courses/${id}`)
      .then(({ data }) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Course not found.");
        setLoading(false);
      });
  }, [id, user, authLoading, navigate]);

  useEffect(() => {
    if (!openQuizFromUrl || !course?.quiz?.questions?.length) return;
    setShowQuiz(true);
    setQuizStep("intro");
    setSelectedAnswers({});
    setCurrentQuestion(0);
    setQuizResult(null);
  }, [openQuizFromUrl, course]);

  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      localStorage.setItem(storageKey, JSON.stringify(pendingSave.current));
    },
    [storageKey],
  );

  const chapters = groupIntoChapters(course?.lessons ?? []);
  const allLessons = course?.lessons ?? [];
  const activeLesson = allLessons[activeIdx];
  const isTextLesson = activeLesson?.type === "text";

  const handleLessonEnd = useCallback(() => {
    setCompleted((prev) => {
      const next = new Set([...prev, activeIdx]);
      scheduleSave({
        lastLesson: activeIdx,
        completed: Array.from(next),
        lessonProgress: lessonProgressRef.current,
      });
      return next;
    });
    if (activeIdx < allLessons.length - 1) setActiveIdx((i) => i + 1);
  }, [activeIdx, allLessons.length, scheduleSave]);

  const handleVideoProgress = useCallback(
    (pct, currentTime) => {
      setCurrentVideoPct(Math.round(pct));
      lessonProgressRef.current[activeIdx] = currentTime;
      setCompleted((prev) => {
        if (pct >= 90 && !prev.has(activeIdx)) {
          const next = new Set([...prev, activeIdx]);
          scheduleSave({
            lastLesson: activeIdx,
            completed: Array.from(next),
            lessonProgress: lessonProgressRef.current,
          });
          return next;
        }
        return prev;
      });
      scheduleSave({
        lastLesson: activeIdx,
        lessonProgress: lessonProgressRef.current,
      });
    },
    [activeIdx, scheduleSave],
  );

  const toggleChapter = (i) =>
    setExpandedCh((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  const progressPct = allLessons.length
    ? Math.round((completed.size / allLessons.length) * 100)
    : 0;

  const userExistingRating = useMemo(() => {
    if (!user || !course?.ratings) return null;
    return course.ratings.find(
      (r) => r.user?.toString() === user._id?.toString(),
    );
  }, [course, user]);

  const displayRating =
    localRatingAvg ??
    course?.ratingAverage ??
    (course?.rating ? Number(course.rating).toFixed(1) : null);

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0b1120",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <p>Loading course…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0b1120",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 48 }}>😔</span>
        <p style={{ color: "#f87171", fontWeight: 600 }}>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "#7c3aed",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Go Back
        </button>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1120",
        color: "#f1f5f9",
        fontFamily: "'Inter','Segoe UI',sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes certPop {
          from { opacity:0; transform:scale(0.85) translateY(20px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        .cp-layout { display:flex; flex:1; overflow:hidden; }
        .cp-main   { flex:1; min-width:0; overflow-y:auto; padding:16px 14px 40px; }
        .cp-sidebar { width:320px; border-left:1px solid #1e293b; background:#0d1526; display:flex; flex-direction:column; flex-shrink:0; position:sticky; top:57px; height:calc(100vh - 57px); overflow-y:auto; }
        @media (min-width:768px) { .cp-main { padding:24px 24px 40px; } .cp-sidebar { width:360px; } }
        @media (max-width:767px) {
          .cp-layout { position:relative; }
          .cp-sidebar { position:fixed; top:57px; right:0; height:calc(100vh - 57px); z-index:40; width:min(340px,90vw); box-shadow:-4px 0 24px rgba(0,0,0,0.5); transform:translateX(100%); transition:transform 0.25s ease; }
          .cp-sidebar.open { transform:translateX(0); }
          .cp-sidebar-overlay { display:none; position:fixed; inset:0; top:57px; background:rgba(0,0,0,0.5); z-index:39; }
          .cp-sidebar.open ~ .cp-sidebar-overlay, .cp-sidebar-overlay.show { display:block; }
        }
        .cp-topbar-title { font-size:14px; font-weight:700; color:#f1f5f9; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        @media (min-width:768px) { .cp-topbar-title { font-size:15px; } }
        .quiz-btn-hover:hover { background:#111827 !important; }
        .rate-btn:hover { background:#1e293b !important; }
      `}</style>

      {/* ── Top bar ── */}
      <div
        style={{
          background: "#0d1526",
          borderBottom: "1px solid #1e293b",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <button
          onClick={() => navigate("/student-dashboard/my-courses")}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          ← Courses
        </button>
        <p className="cp-topbar-title">{course?.title}</p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 80,
              height: 5,
              background: "#1e293b",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                borderRadius: 3,
                transition: "width 0.5s",
              }}
            />
          </div>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
            {progressPct}%
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "5px 10px",
            color: "#94a3b8",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {sidebarOpen ? "Hide" : "Show"}
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className="cp-layout">
        <div className="cp-main">
          {showQuiz ? (
            <div
              style={{
                background: "#0d1526",
                border: "1px solid #1e293b",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <QuizViewer
                course={course}
                user={user}
                quizStep={quizStep}
                setQuizStep={setQuizStep}
                selectedAnswers={selectedAnswers}
                setSelectedAnswers={setSelectedAnswers}
                currentQuestion={currentQuestion}
                setCurrentQuestion={setCurrentQuestion}
                quizResult={quizResult}
                quizLoading={quizLoading}
                quizLocked={!courseComplete}
                completedCount={completed.size}
                totalLessons={totalLessonCount}
                onSubmit={handleQuizSubmit}
                onClose={() => {
                  setShowQuiz(false);
                  setQuizStep("intro");
                  setSelectedAnswers({});
                  setCurrentQuestion(0);
                }}
              />
            </div>
          ) : isTextLesson ? (
            <TextLessonViewer lesson={activeLesson} />
          ) : (
            <VideoPlayer
              url={activeLesson?.videoUrl}
              poster={course?.thumbnailUrl}
              initialTime={initialTime}
              onEnded={handleLessonEnd}
              onProgress={handleVideoProgress}
            />
          )}

          {!showQuiz && (
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 5,
                      flexWrap: "wrap",
                    }}
                  >
                    <p style={{ fontSize: 11, color: "#64748b" }}>
                      Lesson {activeIdx + 1} of {allLessons.length}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: isTextLesson ? "#0c2a1a" : "#2e1065",
                        color: isTextLesson ? "#4ade80" : "#a78bfa",
                      }}
                    >
                      {isTextLesson ? "📝 TEXT" : "🎬 VIDEO"}
                    </span>
                  </div>
                  <h1
                    style={{
                      fontSize: "clamp(17px,3vw,24px)",
                      fontWeight: 800,
                      color: "#f1f5f9",
                      lineHeight: 1.3,
                    }}
                  >
                    {activeLesson?.title || "Untitled Lesson"}
                  </h1>
                  {activeLesson?.chapterTitle && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#818cf8",
                        marginTop: 5,
                        fontWeight: 600,
                      }}
                    >
                      📂 {activeLesson.chapterTitle}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 5 }}>
                    {isTextLesson
                      ? "Read through the lesson and mark it complete when done"
                      : currentVideoPct > 0
                        ? `Progress: ${currentVideoPct}%`
                        : "Start watching to track progress"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setCompleted((prev) => {
                      const n = new Set(prev);
                      n.has(activeIdx) ? n.delete(activeIdx) : n.add(activeIdx);
                      scheduleSave({
                        lastLesson: activeIdx,
                        completed: Array.from(n),
                        lessonProgress: lessonProgressRef.current,
                      });
                      return n;
                    })
                  }
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: `1px solid ${completed.has(activeIdx) ? "#16a34a" : "#334155"}`,
                    background: completed.has(activeIdx)
                      ? "#052e16"
                      : "transparent",
                    color: completed.has(activeIdx) ? "#4ade80" : "#94a3b8",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {completed.has(activeIdx) ? "✓ Done" : "Mark Complete"}
                </button>
              </div>
              {activeLesson?.description && (
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: 14,
                    lineHeight: 1.8,
                    marginTop: 12,
                  }}
                >
                  {activeLesson.description}
                </p>
              )}
            </div>
          )}

          {!showQuiz && (
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
                disabled={activeIdx === 0}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  background: "transparent",
                  color: activeIdx === 0 ? "#334155" : "#e2e8f0",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: activeIdx === 0 ? "not-allowed" : "pointer",
                }}
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  setCompleted((p) => {
                    const next = new Set([...p, activeIdx]);
                    scheduleSave({
                      lastLesson: activeIdx + 1,
                      completed: Array.from(next),
                      lessonProgress: lessonProgressRef.current,
                    });
                    return next;
                  });
                  setActiveIdx(Math.min(allLessons.length - 1, activeIdx + 1));
                }}
                disabled={activeIdx === allLessons.length - 1}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 12,
                  border: "none",
                  background:
                    activeIdx === allLessons.length - 1
                      ? "#1e293b"
                      : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  color:
                    activeIdx === allLessons.length - 1 ? "#334155" : "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor:
                    activeIdx === allLessons.length - 1
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Next →
              </button>
            </div>
          )}

          <div
            style={{
              marginTop: 28,
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 18,
              padding: "18px 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
                About this course
              </h3>
              <button
                className="rate-btn"
                onClick={() => setShowRating(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 13px",
                  borderRadius: 10,
                  border: userExistingRating
                    ? "1px solid #854d0e"
                    : "1px solid #334155",
                  background: userExistingRating ? "#1c1005" : "transparent",
                  color: userExistingRating ? "#fbbf24" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.15s",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 14 }}>
                  {userExistingRating
                    ? "★".repeat(userExistingRating.rating) +
                      "☆".repeat(5 - userExistingRating.rating)
                    : "☆☆☆☆☆"}
                </span>
                {userExistingRating ? "Edit rating" : "Rate this course"}
              </button>
            </div>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 14,
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
              }}
            >
              {course?.description || course?.summary}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 14,
              }}
            >
              {[
                { icon: "📚", label: `${allLessons.length} lessons` },
                {
                  icon: "👥",
                  label: `${course?.students?.length ?? 0} students`,
                },
                {
                  icon: "⭐",
                  label: displayRating
                    ? `${Number(displayRating).toFixed(1)} rating`
                    : "No ratings yet",
                },
                { icon: "📋", label: course?.board ?? "" },
              ]
                .filter((s) => s.label)
                .map((s) => (
                  <span
                    key={s.label}
                    style={{ fontSize: 12, color: "#64748b" }}
                  >
                    {s.icon} {s.label}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className={`cp-sidebar${sidebarOpen ? " open" : ""}`}>
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #1e293b",
              flexShrink: 0,
            }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
              Course Content
            </h2>
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
              {chapters.length} chapters · {allLessons.length} lessons
            </p>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {chapters.map((chapter, ci) => (
              <div key={ci}>
                <button
                  onClick={() => toggleChapter(ci)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 18px",
                    background: "#111827",
                    border: "none",
                    borderBottom: "1px solid #1e293b",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#f1f5f9",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chapter.title}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {chapter.lessons.length}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 11 }}>
                      {expandedCh.has(ci) ? "▲" : "▼"}
                    </span>
                  </div>
                </button>
                {expandedCh.has(ci) &&
                  chapter.lessons.map((lesson) => {
                    const isActive =
                      lesson.globalIdx === activeIdx && !showQuiz;
                    const isDone = completed.has(lesson.globalIdx);
                    const lessonIsText = lesson.type === "text";
                    return (
                      <button
                        key={lesson.globalIdx}
                        onClick={() => {
                          setShowQuiz(false);
                          setActiveIdx(lesson.globalIdx);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "11px 18px 11px 24px",
                          background: isActive ? "#1e1b4b" : "transparent",
                          border: "none",
                          borderBottom: "1px solid #1e293b1a",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: `2px solid ${isDone ? "#4ade80" : isActive ? "#7c3aed" : "#334155"}`,
                            background: isDone ? "#052e16" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          {isDone && (
                            <span style={{ color: "#4ade80", fontSize: 9 }}>
                              ✓
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: isActive ? 700 : 500,
                              color: isActive ? "#a78bfa" : "#e2e8f0",
                              lineHeight: 1.4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {lesson.title}
                          </p>
                          <div
                            style={{ display: "flex", gap: 6, marginTop: 2 }}
                          >
                            <span style={{ fontSize: 10, color: "#475569" }}>
                              {lessonIsText ? "📝 Text" : "🎬 Video"}
                            </span>
                            {!lessonIsText && lesson.durationMinutes > 0 && (
                              <span style={{ fontSize: 10, color: "#475569" }}>
                                {fmtMins(lesson.durationMinutes)}
                              </span>
                            )}
                          </div>
                        </div>
                        {isActive && (
                          <span
                            style={{
                              color: "#7c3aed",
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            ▶
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))}

            {course?.quiz?.questions?.length > 0 && (
              <button
                className="quiz-btn-hover"
                onClick={() => {
                  setShowQuiz(true);
                  setQuizStep("intro");
                  setSelectedAnswers({});
                  setCurrentQuestion(0);
                  setQuizResult(null);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  background: showQuiz
                    ? courseComplete
                      ? "#1e1b4b"
                      : "#111827"
                    : "transparent",
                  border: "none",
                  borderTop: "1px solid #1e293b",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                  opacity: courseComplete ? 1 : 0.72,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: !courseComplete
                      ? "#1e293b"
                      : showQuiz
                        ? "#7c3aed"
                        : "linear-gradient(135deg,#4f46e5,#7c3aed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  📝
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: !courseComplete
                        ? "#64748b"
                        : showQuiz
                          ? "#a78bfa"
                          : "#e2e8f0",
                      marginBottom: 2,
                    }}
                  >
                    {course.quiz.title || "Final Quiz"}
                  </p>
                  <p style={{ fontSize: 10, color: "#475569" }}>
                    {courseComplete
                      ? `${course.quiz.questions.length} questions · ${course.quiz.questions.length * 10} pts`
                      : `Locked · ${completed.size}/${totalLessonCount} lessons`}
                  </p>
                </div>
                {courseComplete &&
                  user?.quizSubmissions?.some(
                    (s) => s.courseId?.toString() === course._id?.toString(),
                  ) && (
                    <span style={{ color: "#4ade80", fontSize: 14 }}>✓</span>
                  )}
                {!courseComplete && (
                  <span style={{ color: "#64748b", fontSize: 14 }}>🔒</span>
                )}
                {courseComplete && showQuiz && (
                  <span style={{ color: "#7c3aed", fontSize: 12 }}>▶</span>
                )}
              </button>
            )}
          </div>
        </div>

        {sidebarOpen && (
          <div
            className="cp-sidebar-overlay show"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* ── Certificate Earned Modal ── */}
      {showCertModal && (
        <CertificateEarnedModal
          course={course}
          onClose={() => setShowCertModal(false)}
          onViewCertificates={() => navigate("/student-dashboard/certificates")}
        />
      )}

      {/* ── Rating Modal ── */}
      {showRating && (
        <RatingModal
          course={course}
          user={user}
          onClose={() => setShowRating(false)}
          onSubmitted={(stars) => {
            const existing = course?.ratings ?? [];
            const alreadyRated = existing.some(
              (r) => r.user?.toString() === user._id?.toString(),
            );
            const total = existing.reduce((s, r) => s + (r.rating ?? 0), 0);
            const newTotal = alreadyRated
              ? total - (userExistingRating?.rating ?? 0) + stars
              : total + stars;
            const newCount = alreadyRated
              ? existing.length
              : existing.length + 1;
            setLocalRatingAvg((newTotal / newCount).toFixed(1));
          }}
        />
      )}
    </div>
  );
}
