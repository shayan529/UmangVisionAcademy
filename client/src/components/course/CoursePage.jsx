import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import api from "../../config/api.js";
import { updateUserScoreAndSubmissions } from "../../redux/slices/authSlice.js";
import { checkAndAwardAchievements } from "../../redux/slices/achievementSlice.js";
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

// Groups lessons into: Subject → [{ chapterTitle, lessons }]
// Each lesson gets a globalIdx = its flat array position.
const groupIntoSubjects = (lessons = []) => {
  const subjectMap = []; // ordered array of subjects
  const subjectIndex = {}; // subjectName → index in subjectMap

  lessons.forEach((lesson, idx) => {
    const subjectName = lesson.subject || "General";
    const chapterTitle = lesson.chapterTitle || "Chapter 1";

    if (subjectIndex[subjectName] === undefined) {
      subjectIndex[subjectName] = subjectMap.length;
      subjectMap.push({
        subject: subjectName,
        chapters: [],
        subjectQuiz: null,
        allLessonCount: 0,
      });
    }
    const subj = subjectMap[subjectIndex[subjectName]];

    let chapter = subj.chapters.find((c) => c.title === chapterTitle);
    if (!chapter) {
      chapter = { title: chapterTitle, lessons: [] };
      subj.chapters.push(chapter);
    }
    chapter.lessons.push({ ...lesson, globalIdx: idx });
    subj.allLessonCount++;
  });

  return subjectMap;
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
  activeQuiz,
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
  const quiz = activeQuiz || course?.quiz;
  const questions = quiz?.questions || [];
  const LABELS = ["A", "B", "C", "D"];
  const totalPts = questions.length * 10;
  const prevSub = user?.quizSubmissions?.find(
    (s) =>
      s.courseId?.toString() === course._id?.toString() &&
      s.title === quiz?.title,
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
              {quiz?.title || "Quiz"} Locked
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", maxWidth: 360 }}>
              Complete the required lessons before starting this quiz.
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

  // Progress persisted server-side; hydrate from API below for authenticated users.

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState(() => new Set());
  const [currentVideoPct, setCurrentVideoPct] = useState(0);

  // ── Quiz state ──────────────────────────────────────────────────────────────
  const [activeQuiz, setActiveQuiz] = useState(null);
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
  // localRated: star count submitted in this session (locks the button immediately)
  const [localRated, setLocalRated] = useState(null);

  // isDesktop tracks the actual breakpoint live (not just at mount), so
  // resizing the window/devtools no longer leaves the layout in a stale
  // state. On desktop the sidebar renders inline; on mobile it renders in a
  // separate portal-based drawer.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsedSubj, setCollapsedSubj] = useState(new Set()); // subject-level collapse
  const [collapsedCh, setCollapsedCh] = useState(new Set()); // chapter-level collapse

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // If the viewport crosses into desktop while the mobile drawer happens to
  // be open, close it so it doesn't linger in a weird state.
  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  // Lock body scroll only while the mobile drawer is open (prevents page
  // scrolling behind the overlay). Automatically unlocked on desktop or
  // when closed.
  //
  // `overflow:hidden` alone does NOT stop touch-drag scrolling on mobile
  // browsers — it only blocks wheel/keyboard scrolling. iOS/Android will
  // still let a finger-drag scroll the body underneath a fixed overlay.
  // The reliable fix is to also take the body out of the layout with
  // `position:fixed`, pinned at its current scroll offset, then restore
  // the scroll position when unlocking.
  const scrollLockY = useRef(0);
  useEffect(() => {
    if (!isDesktop && mobileSidebarOpen) {
      scrollLockY.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollLockY.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const y = scrollLockY.current;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, y);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isDesktop, mobileSidebarOpen]);
  const openQuizFromUrl = searchParams.get("quiz") === "1";
  const totalLessonCount = course?.lessons?.length ?? 0;
  const courseComplete =
    totalLessonCount === 0 ? true : completed.size >= totalLessonCount;

  // ── Derived lesson data — must be declared BEFORE any hook that reads it
  // (e.g. in a dependency array) to avoid a "cannot access before
  // initialization" TDZ error on render. ──
  const allLessons = course?.lessons ?? [];
  const activeLesson = allLessons[activeIdx];
  const isTextLesson = activeLesson?.type === "text";

  const firstUncompletedIdx = useMemo(() => {
    // completed stores plain 0-based indices (same as activeIdx / array position)
    // allLessons are raw course lessons without globalIdx, so we use the index
    return allLessons.findIndex((_, idx) => !completed.has(idx));
  }, [allLessons, completed]);

  // subjects: Subject → [{title (chapter), lessons}], quiz at subject level
  const subjects = useMemo(() => {
    const list = groupIntoSubjects(course?.lessons ?? []);
    if (course?.subjectQuizzes) {
      course.subjectQuizzes.forEach((sq) => {
        if (!sq.questions?.length) return;
        const subj = list.find((s) => s.subject === sq.subject);
        if (subj) subj.subjectQuiz = sq;
      });
    }
    return list;
  }, [course?.lessons, course?.subjectQuizzes]);

  // ── Certificate eligibility check ────────────────────────────────────────────
  // Defined as a regular function (hoisted) so handleQuizSubmit can call it.
  // Shows the cert modal when:
  //   • certificate is enabled by the instructor
  //   • all lessons are complete
  //   • all quizzes submitted (pass/fail irrelevant) OR no quizzes exist
  function checkAndShowCert(extraJustSubmittedTitle) {
    if (!course?.certificate?.enabled) return;
    if (!courseComplete) return;
    if (showCertModal) return;

    const requiredTitles = new Set();
    subjects.forEach((s) => {
      if (s.subjectQuiz?.questions?.length) {
        requiredTitles.add(s.subjectQuiz.title || "Subject Quiz");
      }
    });
    if (course?.quiz?.questions?.length) {
      requiredTitles.add(course.quiz.title || "Final Quiz");
    }

    // No quizzes → cert on lesson completion alone
    if (requiredTitles.size === 0) {
      setTimeout(() => setShowCertModal(true), 800);
      return;
    }

    const submittedTitles = new Set(
      (user?.quizSubmissions ?? [])
        .filter((s) => s.courseId?.toString() === course._id?.toString())
        .map((s) => s.title),
    );
    if (extraJustSubmittedTitle) submittedTitles.add(extraJustSubmittedTitle);

    if ([...requiredTitles].every((t) => submittedTitles.has(t))) {
      setTimeout(() => setShowCertModal(true), 1200);
    }
  }

  const handleQuizSubmit = async () => {
    setQuizLoading(true);
    try {
      // Use the api instance (not raw fetch) so the auth interceptor
      // automatically attaches the correct "authToken" Bearer header.
      const { data } = await api.post(`/courses/${course._id}/quiz/submit`, {
        answers: selectedAnswers,
        title: activeQuiz?.title || "Final Quiz",
      });
      if (data.success) {
        setQuizResult(data);
        const isPerfectScore = data.percentage === 100;
        dispatch(
          updateUserScoreAndSubmissions({
            score: data.newTotalScore,
            coins: data.coinBalance,
            quizSubmissionUpdate: {
              courseId: course._id,
              score: data.percentage,
            },
            earnedCertificates: data.earnedCertificates,
          }),
        );
        dispatch(
          checkAndAwardAchievements({
            perfectQuiz: isPerfectScore,
            fullMarks: isPerfectScore,
            lessonsCompleted: completed.size,
            textLessons: allLessons.filter(
              (lesson, idx) => completed.has(idx) && lesson?.type === "text",
            ).length,
          }),
        );
        setQuizStep("result");

        // ── Certificate check after quiz submit ──
        // Pass the just-submitted quiz title so we don't depend on the
        // async redux update to have landed yet.
        checkAndShowCert(activeQuiz?.title || "Final Quiz");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const lessonProgressRef = useRef({});
  const [initialTime, setInitialTime] = useState(0);

  useEffect(() => {
    setInitialTime(lessonProgressRef.current[activeIdx] || 0);
    setCurrentVideoPct(0);
  }, [activeIdx]);

  // ── Cert check on lesson completion (no-quiz courses) ──────────────────────
  // Also re-runs when quiz submissions arrive so the cert fires immediately
  // after the last quiz even if the component didn't re-mount.
  useEffect(() => {
    if (!courseComplete) return;
    checkAndShowCert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseComplete, user?.quizSubmissions]);

  const saveTimer = useRef(null);
  const pendingSave = useRef({});
  const scheduleSave = useCallback(
    (patch, immediate = false) => {
      Object.assign(pendingSave.current, patch);
      if (immediate) {
        if (saveTimer.current) {
          clearTimeout(saveTimer.current);
          saveTimer.current = null;
        }
        if (user && id) {
          api
            .post(`/courses/${id}/progress`, pendingSave.current)
            .catch((err) => {
              console.warn(
                "Failed to sync progress immediately:",
                err?.message || err,
              );
            });
        }
        return;
      }
      if (saveTimer.current) return;
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        // Persist progress server-side for authenticated users so progress
        // and quiz unlocking survives across devices.
        if (user && id) {
          api
            .post(`/courses/${id}/progress`, pendingSave.current)
            .catch((err) => {
              // Non-fatal — keep working locally even if server fails
              console.warn(
                "Failed to sync progress to server:",
                err?.message || err,
              );
            });
        }
      }, 5000);
    },
    [user, id],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { state: { from: `/courses/${id}` } });
      return;
    }
    api
      .get(`/courses/${id}`)
      .then(async ({ data }) => {
        setCourse(data);
        // hydrate server progress (if any)
        try {
          const { data: progressResp } = await api.get(
            `/courses/${id}/progress`,
          );
          const prog = progressResp?.progress;
          if (prog) {
            lessonProgressRef.current = prog.lessonProgress || {};
            setCompleted(new Set(prog.completed || []));
            setActiveIdx(prog.lastLesson ?? 0);
            setInitialTime(
              lessonProgressRef.current[prog.lastLesson ?? 0] || 0,
            );
          }
        } catch (e) {
          console.warn("Failed to fetch course progress:", e?.message || e);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Course not found.");
        setLoading(false);
      });
  }, [id, user, authLoading, navigate]);

  useEffect(() => {
    if (!openQuizFromUrl || !course?.quiz?.questions?.length) return;
    setActiveQuiz(course.quiz);
    setQuizStep("intro");
    setSelectedAnswers({});
    setCurrentQuestion(0);
    setQuizResult(null);
  }, [openQuizFromUrl, course]);

  useEffect(() => {
    if (!course || !user) return;

    const completedLessonCount = completed.size;
    const textLessonCount = allLessons.filter(
      (lesson, idx) => completed.has(idx) && lesson?.type === "text",
    ).length;

    dispatch(
      checkAndAwardAchievements({
        lessonsCompleted: completedLessonCount,
        textLessons: textLessonCount,
      }),
    );
  }, [allLessons, completed, course, dispatch, user]);

  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      // Flush pending progress to server on unmount if any
      if (user && id && Object.keys(pendingSave.current).length) {
        api
          .post(`/courses/${id}/progress`, pendingSave.current)
          .catch((err) => {
            console.warn(
              "Failed to flush progress on unload:",
              err?.message || err,
            );
          });
      }
    },
    [user, id],
  );

  const handleLessonEnd = useCallback(() => {
    setCompleted((prev) => {
      const next = new Set([...prev, activeIdx]);
      scheduleSave({
        lastLesson: activeIdx,
        completed: Array.from(next),
        lessonProgress: lessonProgressRef.current,
      }, true);
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
          }, true);
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

  const toggleSubject = (si) =>
    setCollapsedSubj((prev) => {
      const next = new Set(prev);
      next.has(si) ? next.delete(si) : next.add(si);
      return next;
    });
  const toggleChapter = (key) =>
    setCollapsedCh((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
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

  const sidebarContent = (
    <>
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
            Course Content
          </h2>
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} ·{" "}
            {allLessons.length} lessons
          </p>
        </div>
        {!isDesktop && (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
              width: 26,
              height: 26,
              color: "#94a3b8",
              fontSize: 13,
              lineHeight: 1,
              cursor: "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {subjects.map((subj, si) => {
          const subjCollapsed = collapsedSubj.has(si);
          // All lessons inside this subject (flat)
          const subjLessons = subj.chapters.flatMap((ch) => ch.lessons);
          const subjDoneCount = subjLessons.filter((l) =>
            completed.has(l.globalIdx),
          ).length;
          const subjAllDone = subjDoneCount === subjLessons.length;
          const sq = subj.subjectQuiz;
          // Locking is PER-SUBJECT: find the first uncompleted lesson within this subject only
          const subjFirstUncompletedGlobalIdx = (() => {
            const first = subjLessons.find((l) => !completed.has(l.globalIdx));
            return first ? first.globalIdx : -1;
          })();

          return (
            <div key={si} style={{ borderBottom: "1px solid #1e293b" }}>
              {/* ── Subject Header ── */}
              <button
                onClick={() => toggleSubject(si)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 18px",
                  background: "#0f172a",
                  border: "none",
                  borderLeft: "3px solid #7c3aed",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 15, flexShrink: 0 }}>📚</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#ffffff",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {subj.subject}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 10, color: "#64748b" }}>
                    {subjDoneCount}/{subjLessons.length}
                  </span>
                  <span style={{ color: "#64748b", fontSize: 11 }}>
                    {subjCollapsed ? "▼" : "▲"}
                  </span>
                </div>
              </button>

              {!subjCollapsed && (
                <>
                  {subj.chapters.map((chapter, ci) => {
                    const chKey = `${si}-${ci}`;
                    const chCollapsed = collapsedCh.has(chKey);
                    return (
                      <div key={chKey}>
                        {/* ── Chapter Sub-Header ── */}
                        <button
                          onClick={() => toggleChapter(chKey)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 18px 10px 30px",
                            background: "#111827",
                            border: "none",
                            borderBottom: "1px solid #1e293b",
                            borderLeft: "3px solid #334155",
                            cursor: "pointer",
                            textAlign: "left",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              minWidth: 0,
                            }}
                          >
                            <span style={{ fontSize: 12, flexShrink: 0 }}>
                              📖
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#cbd5e1",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {chapter.title}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              flexShrink: 0,
                            }}
                          >
                            <span style={{ fontSize: 10, color: "#475569" }}>
                              {chapter.lessons.length}
                            </span>
                            <span style={{ color: "#475569", fontSize: 10 }}>
                              {chCollapsed ? "▼" : "▲"}
                            </span>
                          </div>
                        </button>

                        {/* ── Lessons ── */}
                        {!chCollapsed &&
                          chapter.lessons.map((lesson) => {
                            const isActive =
                              lesson.globalIdx === activeIdx && !activeQuiz;
                            const isDone = completed.has(lesson.globalIdx);
                            const lessonIsText = lesson.type === "text";
                            const isLocked =
                              !isDone &&
                              subjFirstUncompletedGlobalIdx !== -1 &&
                              lesson.globalIdx > subjFirstUncompletedGlobalIdx;
                            return (
                              <button
                                key={lesson.globalIdx}
                                disabled={isLocked}
                                onClick={() => {
                                  if (isLocked) return;
                                  setActiveQuiz(null);
                                  setActiveIdx(lesson.globalIdx);
                                  if (!isDesktop) setMobileSidebarOpen(false);
                                }}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 10,
                                  padding: "11px 18px 11px 40px",
                                  background: isActive
                                    ? "#1e1b4b"
                                    : "transparent",
                                  border: "none",
                                  borderBottom: "1px solid #1e293b1a",
                                  cursor: isLocked ? "not-allowed" : "pointer",
                                  textAlign: "left",
                                  transition: "background 0.15s",
                                  opacity: isLocked ? 0.4 : 1,
                                }}
                              >
                                <div
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    border: `2px solid ${isDone ? "#4ade80" : isActive ? "#7c3aed" : isLocked ? "#1e293b" : "#334155"}`,
                                    background: isDone
                                      ? "#052e16"
                                      : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    marginTop: 2,
                                  }}
                                >
                                  {isDone ? (
                                    <span
                                      style={{ color: "#4ade80", fontSize: 9 }}
                                    >
                                      ✓
                                    </span>
                                  ) : isLocked ? (
                                    <span
                                      style={{ color: "#64748b", fontSize: 9 }}
                                    >
                                      🔒
                                    </span>
                                  ) : null}
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
                                    style={{
                                      display: "flex",
                                      gap: 6,
                                      marginTop: 2,
                                    }}
                                  >
                                    <span
                                      style={{ fontSize: 10, color: "#475569" }}
                                    >
                                      {lessonIsText ? "📝 Text" : "🎬 Video"}
                                    </span>
                                    {!lessonIsText &&
                                      lesson.durationMinutes > 0 && (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: "#475569",
                                          }}
                                        >
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
                    );
                  })}

                  {/* ── Subject Quiz (at the bottom of the subject) ── */}
                  {sq &&
                    (() => {
                      const isActiveQuiz = activeQuiz === sq;
                      const quizLocked = !subjAllDone;
                      return (
                        <button
                          className="quiz-btn-hover"
                          disabled={quizLocked}
                          onClick={() => {
                            if (quizLocked) return;
                            setActiveQuiz(sq);
                            setQuizStep("intro");
                            setSelectedAnswers({});
                            if (!isDesktop) setMobileSidebarOpen(false);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "14px 18px 14px 30px",
                            background: isActiveQuiz
                              ? "#1e1b4b"
                              : "transparent",
                            border: "none",
                            borderBottom: "1px solid #1e293b1a",
                            borderLeft: "3px solid #334155",
                            cursor: quizLocked ? "not-allowed" : "pointer",
                            textAlign: "left",
                            transition: "background 0.15s",
                            opacity: quizLocked ? 0.4 : 1,
                          }}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              border: `2px solid ${quizLocked ? "#334155" : "#a78bfa"}`,
                              background: isActiveQuiz
                                ? "#7c3aed"
                                : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
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
                                color: quizLocked
                                  ? "#64748b"
                                  : isActiveQuiz
                                    ? "#a78bfa"
                                    : "#e2e8f0",
                                marginBottom: 2,
                              }}
                            >
                              {sq.title || "Subject Quiz"}
                            </p>
                            <p style={{ fontSize: 10, color: "#475569" }}>
                              {quizLocked
                                ? "Locked · Complete all lessons first"
                                : `${sq.questions.length} questions · ${sq.questions.length * 10} pts`}
                            </p>
                          </div>
                          {!quizLocked &&
                            user?.quizSubmissions?.some(
                              (s) =>
                                s.courseId?.toString() ===
                                  course._id?.toString() &&
                                s.title === sq.title,
                            ) && (
                              <span style={{ color: "#4ade80", fontSize: 14 }}>
                                ✓
                              </span>
                            )}
                          {quizLocked && (
                            <span style={{ color: "#64748b", fontSize: 14 }}>
                              🔒
                            </span>
                          )}
                          {!quizLocked && isActiveQuiz && (
                            <span style={{ color: "#7c3aed", fontSize: 12 }}>
                              ▶
                            </span>
                          )}
                        </button>
                      );
                    })()}
                </>
              )}
            </div>
          );
        })}

        {course?.quiz?.questions?.length > 0 && (
          <button
            className="quiz-btn-hover"
            disabled={!courseComplete}
            onClick={() => {
              if (!courseComplete) return;
              setActiveQuiz(course.quiz);
              setQuizStep("intro");
              setSelectedAnswers({});
              setCurrentQuestion(0);
              setQuizResult(null);
              if (!isDesktop) setMobileSidebarOpen(false);
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 18px",
              background:
                activeQuiz === course.quiz
                  ? courseComplete
                    ? "#1e1b4b"
                    : "#111827"
                  : "transparent",
              border: "none",
              borderTop: "1px solid #1e293b",
              cursor: !courseComplete ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "background 0.15s",
              opacity: courseComplete ? 1 : 0.4,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: !courseComplete
                  ? "#1e293b"
                  : activeQuiz === course.quiz
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
                    : activeQuiz === course.quiz
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
              ) && <span style={{ color: "#4ade80", fontSize: 14 }}>✓</span>}
            {!courseComplete && (
              <span style={{ color: "#64748b", fontSize: 14 }}>🔒</span>
            )}
            {courseComplete && activeQuiz === course.quiz && (
              <span style={{ color: "#7c3aed", fontSize: 12 }}>▶</span>
            )}
          </button>
        )}
      </div>
    </>
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
        /* Desktop sidebar — always visible, in normal flow. Anchored with
           top+bottom instead of a vh-based height so it can never detach
           from the bottom edge. */
        .cp-sidebar { width:320px; border-left:1px solid #1e293b; background:#0d1526; display:flex; flex-direction:column; flex-shrink:0; position:sticky; top:57px; bottom:0; max-height:calc(100dvh - 57px); overflow-y:auto; }
        @media (min-width:768px) { .cp-main { padding:24px 24px 40px; } .cp-sidebar { width:360px; } }

        /* Mobile sidebar — rendered through a React Portal straight into
           document.body, so it's genuinely fixed to the viewport no matter
           what ancestors (transforms, overflow, etc.) wrap the page. */
        .cp-mobile-sidebar {
          position:fixed; top:57px; right:0; bottom:0; height:auto;
          z-index:1001; width:min(340px,90vw); background:#0d1526;
          display:flex; flex-direction:column; overflow-y:auto;
          overscroll-behavior:contain;
          box-shadow:-4px 0 24px rgba(0,0,0,0.5);
          transform:translateX(100%); transition:transform 0.25s ease;
        }
        .cp-mobile-sidebar.open { transform:translateX(0); }
        .cp-mobile-sidebar-overlay {
          position:fixed; inset:0; top:57px; background:rgba(0,0,0,0.5); z-index:1000;
          touch-action:none;
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
        {/* Toggle only makes sense on mobile — on desktop the sidebar is
            always visible in the normal flow, so the button is omitted
            there entirely instead of doing nothing. */}
        {!isDesktop && (
          <button
            onClick={() => setMobileSidebarOpen((o) => !o)}
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
            {mobileSidebarOpen ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {/* ── Main layout ── */}
      <div className="cp-layout">
        <div className="cp-main">
          {activeQuiz ? (
            <div
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 18,
                padding: "clamp(16px,3vw,32px)",
              }}
            >
              <QuizViewer
                course={course}
                activeQuiz={activeQuiz}
                user={user}
                quizStep={quizStep}
                setQuizStep={setQuizStep}
                selectedAnswers={selectedAnswers}
                setSelectedAnswers={setSelectedAnswers}
                currentQuestion={currentQuestion}
                setCurrentQuestion={setCurrentQuestion}
                quizResult={quizResult}
                quizLoading={quizLoading}
                quizLocked={
                  activeQuiz === course.quiz
                    ? !courseComplete
                    : allLessons.some((l, idx) => l.subject === activeQuiz?.subject && !completed.has(idx))
                }
                completedCount={
                  activeQuiz === course.quiz
                    ? completed.size
                    : allLessons.filter(
                        (l, idx) =>
                          l.subject === activeQuiz?.subject &&
                          completed.has(idx),
                      ).length
                }
                totalLessons={
                  activeQuiz === course.quiz
                    ? totalLessonCount
                    : allLessons.filter(
                        (l) => l.subject === activeQuiz?.subject,
                      ).length
                }
                onSubmit={handleQuizSubmit}
                onClose={() => {
                  setActiveQuiz(null);
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

          {!activeQuiz && (
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
                      }, true);
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

          {!activeQuiz && (
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
              {(() => {
                // Find which subject+chapter this lesson belongs to
                const currentSubj = subjects.find((s) =>
                  s.chapters.some((ch) =>
                    ch.lessons.some((l) => l.globalIdx === activeIdx),
                  ),
                );
                const subjLessonsFlat = currentSubj
                  ? currentSubj.chapters.flatMap((ch) => ch.lessons)
                  : [];
                const isLastInSubject =
                  subjLessonsFlat.length > 0 &&
                  subjLessonsFlat[subjLessonsFlat.length - 1].globalIdx ===
                    activeIdx;
                const subjectQuiz = currentSubj?.subjectQuiz ?? null;
                const isSubjectQuizSubmitted = subjectQuiz && (user?.quizSubmissions || []).some(
                  (s) => s.courseId?.toString() === course?._id?.toString() && s.title === (subjectQuiz.title || "Subject Quiz")
                );
                // "go to subject quiz" takes priority when last lesson in subject and quiz exists and not yet submitted
                const goToSubjectQuiz = isLastInSubject && !!subjectQuiz && !isSubjectQuizSubmitted;

                const isLastLesson = activeIdx === allLessons.length - 1;
                const hasFinalQuiz = course?.quiz?.questions?.length > 0;
                const isFinalQuizSubmitted = hasFinalQuiz && (user?.quizSubmissions || []).some(
                  (s) => s.courseId?.toString() === course?._id?.toString() && s.title === (course.quiz.title || "Final Quiz")
                );
                // Only go to final quiz if NOT going to a subject quiz first and not yet submitted
                const goToFinalQuiz =
                  !goToSubjectQuiz && isLastLesson && hasFinalQuiz && !isFinalQuizSubmitted;

                const isCurrentCompleted = completed.has(activeIdx);
                // Disable if: current not done OR (last lesson globally with no quiz at all)
                const disabledNext =
                  !isCurrentCompleted ||
                  (isLastLesson && !goToSubjectQuiz && !goToFinalQuiz && !hasFinalQuiz);

                const btnLabel = goToSubjectQuiz
                  ? "Finish → Take Subject Quiz"
                  : goToFinalQuiz
                    ? "Finish → Take Final Quiz"
                    : "Next →";

                return (
                  <button
                    onClick={() => {
                      if (!isCurrentCompleted) return;
                      setCompleted((p) => {
                        const next = new Set([...p, activeIdx]);
                        scheduleSave({
                          lastLesson: activeIdx,
                          completed: Array.from(next),
                          lessonProgress: lessonProgressRef.current,
                        }, true);
                        return next;
                      });
                      if (goToSubjectQuiz) {
                        setActiveQuiz(subjectQuiz);
                        setQuizStep("intro");
                        setSelectedAnswers({});
                        setCurrentQuestion(0);
                        setQuizResult(null);
                      } else if (goToFinalQuiz) {
                        setActiveQuiz(course.quiz);
                        setQuizStep("intro");
                        setSelectedAnswers({});
                        setCurrentQuestion(0);
                        setQuizResult(null);
                      } else {
                        setActiveIdx(
                          Math.min(allLessons.length - 1, activeIdx + 1),
                        );
                      }
                    }}
                    disabled={disabledNext}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: 12,
                      border: "none",
                      background: disabledNext
                        ? "#1e293b"
                        : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                      color: disabledNext ? "#475569" : "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: disabledNext ? "not-allowed" : "pointer",
                    }}
                  >
                    {btnLabel}
                  </button>
                );
              })()}
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
              {/* Show locked "Rated" badge if already rated (DB or this session) */}
              {userExistingRating || localRated ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 13px",
                    borderRadius: 10,
                    border: "1px solid #854d0e",
                    background: "#1c1005",
                    color: "#fbbf24",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  <span style={{ fontSize: 14 }}>
                    {(() => {
                      const stars =
                        localRated ?? userExistingRating?.rating ?? 0;
                      return "★".repeat(stars) + "☆".repeat(5 - stars);
                    })()}
                  </span>
                  Rated
                </div>
              ) : (
                <button
                  className="rate-btn"
                  onClick={() => setShowRating(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 13px",
                    borderRadius: 10,
                    border: "1px solid #334155",
                    background: "transparent",
                    color: "#94a3b8",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "background 0.15s",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: 14 }}>☆☆☆☆☆</span>
                  Rate this course
                </button>
              )}
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
            {course?.notes && course.notes.length > 0 && (
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid #1e293b",
                }}
              >
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#f1f5f9",
                    marginBottom: 10,
                  }}
                >
                  📄 Study Notes & Materials
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {course.notes.map((note) => (
                    <div
                      key={note._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        background: "#0d1526",
                        borderRadius: 10,
                        border: "1px solid #1e293b",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#e2e8f0",
                          }}
                        >
                          {note.title}
                        </p>
                        {note.description && (
                          <p
                            style={{
                              fontSize: 10,
                              color: "#64748b",
                              marginTop: 2,
                            }}
                          >
                            {note.description}
                          </p>
                        )}
                      </div>
                      <a
                        href={note.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "6px 12px",
                          background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                          color: "#fff",
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 700,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar (desktop) — always visible, in normal flow ── */}
        {isDesktop && <div className="cp-sidebar">{sidebarContent}</div>}
      </div>

      {/* ── Sidebar (mobile) — rendered through a portal to document.body so
          it is truly fixed to the viewport regardless of any transformed
          or scrolling ancestors, and can no longer scroll with the page. ── */}
      {!isDesktop &&
        createPortal(
          <>
            {mobileSidebarOpen && (
              <div
                className="cp-mobile-sidebar-overlay"
                onClick={() => setMobileSidebarOpen(false)}
              />
            )}
            <div
              className={`cp-mobile-sidebar${mobileSidebarOpen ? " open" : ""}`}
            >
              {sidebarContent}
            </div>
          </>,
          document.body,
        )}

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
            // Lock the button immediately in this session
            setLocalRated(stars);
            setShowRating(false);
            // Optimistically update the displayed average
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
