import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import api from "../../config/api.js";
import { updateUserScoreAndSubmissions } from "../../redux/slices/authSlice.js";
import { checkAndAwardAchievements } from "../../redux/slices/achievementSlice.js";
import TextLessonViewer from "./TextLessonViewer.jsx";
import WatermarkOverlay from "./WaterMarkOverlay.jsx";

const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed", error);
    window.open(url, "_blank");
  }
};

const getDocViewUrl = (url) => {
  if (!url) return "";
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0] ?? "";
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1") || url.includes("192.168.");
  if (!isLocal && ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
  }
  return url;
};

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
  const subjectMap = [];
  const subjectIndex = {};

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
    purple: { from: "#3b0764", to: "#6d28d9", accent: "#c4b5fd" },
    blue: { from: "#1e3a8a", to: "#1d4ed8", accent: "#bfdbfe" },
    green: { from: "#052e16", to: "#166534", accent: "#bbf7d0" },
    gold: { from: "#451a03", to: "#b45309", accent: "#fef08a" },
    dark: { from: "#0f172a", to: "#1e293b", accent: "#e2e8f0" },
  };
  const cert = course?.certificate;
  const t = themes[cert?.theme] || themes.purple;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] overflow-hidden rounded-3xl border border-[#1e293b] bg-[#0d1526] shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        style={{ animation: "certPop 0.45s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Gradient banner */}
        <div
          className="relative overflow-hidden px-6 pb-6 pt-7 text-center"
          style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
        >
          <div className="absolute -right-8 -top-8 h-[120px] w-[120px] rounded-full bg-white/[0.07]" />
          <div className="absolute -bottom-5 -left-5 h-[90px] w-[90px] rounded-full bg-white/5" />

          <div className="relative z-10 mb-3 text-[52px]">🏅</div>
          <div
            className="relative z-10 mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em]"
            style={{ color: t.accent }}
          >
            Certificate Earned
          </div>
          <div className="relative z-10 text-xl font-extrabold leading-tight text-white">
            {cert?.title || "Certificate of Completion"}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-6 pb-6 pt-[22px]">
          <div className="text-center text-xl tracking-[4px]">🌟 🎉 🌟</div>

          <div className="text-center">
            <p className="mb-1.5 text-sm font-semibold text-slate-200">
              You've completed
            </p>
            <p className="mb-2.5 text-base font-extrabold leading-snug text-violet-400">
              {course?.title}
            </p>
            <p className="text-[13px] leading-relaxed text-slate-500">
              Your certificate is ready. Head to your Certificates page to view,
              download, or share it with the world.
            </p>
          </div>

          {/* Certificate mini-preview strip */}
          <div
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{
              background: `linear-gradient(135deg, ${t.from}cc, ${t.to}cc)`,
              borderColor: `${t.accent}33`,
            }}
          >
            <span className="text-2xl">📜</span>
            <div className="flex-1">
              <div className="mb-0.5 text-[11px] font-bold" style={{ color: t.accent }}>
                {cert?.title || "Certificate of Completion"}
              </div>
              <div className="text-[10px] text-white/50">
                Umang Vision Academy · Issued today
              </div>
            </div>
            <div className="rounded-full border border-[#166534] bg-[#052e16] px-2 py-[3px] text-[10px] font-extrabold text-green-400">
              EARNED
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#334155] bg-transparent py-[11px] text-[13px] font-semibold text-slate-400 transition-colors hover:bg-[#1e293b]"
            >
              Stay here
            </button>
            <button
              onClick={onViewCertificates}
              className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl border-none bg-gradient-to-br from-violet-600 to-cyan-500 py-[11px] text-[13px] font-bold text-white transition-opacity hover:opacity-90"
            >
              🎓 View My Certificate
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
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

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] overflow-hidden rounded-[20px] border border-[#1e293b] bg-[#0d1526] shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#1e293b] px-5 py-[18px] pb-3.5">
          <div>
            <h2 className="mb-[3px] text-base font-extrabold text-slate-100">
              {existingRating ? "Update your rating" : "Rate this course"}
            </h2>
            <p className="max-w-[300px] truncate text-xs text-slate-500">
              {course?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border-none bg-[#1e293b] text-sm text-slate-400 hover:bg-[#334155]"
          >
            ✕
          </button>
        </div>
        {success ? (
          <div className="flex flex-col items-center gap-3.5 px-6 py-10 text-center">
            <div className="text-5xl">🎉</div>
            <div>
              <p className="text-base font-extrabold text-green-400">
                Thanks for your feedback!
              </p>
              <p className="mt-1 text-[13px] text-slate-500">
                Your rating helps other students.
              </p>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5 pt-[22px]">
            <div className="mb-2 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setSelected(star)}
                  aria-label={`Rate ${star} stars`}
                  className="border-none bg-transparent px-0.5 py-1 text-[36px] leading-none transition-all duration-150"
                  style={{
                    color: star <= active ? "#fbbf24" : "#1e293b",
                    transform: star <= active ? "scale(1.15)" : "scale(1)",
                    filter: star <= active ? "drop-shadow(0 0 6px rgba(251,191,36,0.5))" : "none",
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <p
              className="mb-[18px] min-h-[20px] text-center text-[13px] font-bold transition-colors duration-150"
              style={{ color: active ? "#fbbf24" : "#475569" }}
            >
              {active ? labels[active] : "Tap a star to rate"}
            </p>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Review (optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share what you liked or what could be improved…"
                rows={3}
                maxLength={500}
                className="box-border w-full resize-y rounded-[10px] border border-[#1e293b] bg-[#111827] px-3 py-2.5 font-sans text-[13px] leading-relaxed text-slate-200 outline-none focus:border-violet-600"
              />
              <p className="mt-1 text-right text-[11px] text-slate-700">
                {review.length}/500
              </p>
            </div>
            {error && (
              <p className="mb-3 rounded-lg bg-[#450a0a] px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#334155] bg-transparent py-[11px] text-[13px] font-semibold text-slate-400 hover:bg-[#1e293b]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selected}
                className="flex-[2] rounded-xl border-none py-[11px] text-[13px] font-bold text-white transition-colors disabled:cursor-not-allowed"
                style={{
                  background:
                    loading || !selected
                      ? "#1e293b"
                      : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  color: loading || !selected ? "#475569" : "#fff",
                  cursor: loading || !selected ? "not-allowed" : "pointer",
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
    </div>,
    document.body
  );
}

// ── Video Player ──────────────────────────────────────────────────────────────
const VideoPlayer = ({ url, poster, onEnded, onProgress, initialTime = 0, user }) => {
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
    onProgress?.(pct, v.currentTime, v.duration);
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
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-[#0f172a]">
        <span className="text-5xl">🎬</span>
        <p className="text-sm text-slate-600">No video for this lesson</p>
      </div>
    );

  return (
    <div
      onMouseMove={resetHide}
      className="relative aspect-video select-none overflow-hidden rounded-xl bg-black"
      style={{ cursor: "pointer" }}
    >
      <video
        ref={ref}
        src={url}
        poster={poster}
        playsInline
        muted={muted}
        controlsList="nodownload"
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
        className="block h-full w-full object-contain"
      />
      {!playing && (
        <div
          onClick={toggle}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40"
        >
          <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-violet-600/95 shadow-[0_0_50px_rgba(124,58,237,0.6)] transition-transform hover:scale-105">
            <span className="ml-1 text-2xl text-white">▶</span>
          </div>
        </div>
      )}
      {playing && (
        <div onClick={toggle} className="absolute inset-0 cursor-pointer" />
      )}
      <WatermarkOverlay user={user} dense />
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 px-3.5 pb-3 pt-2 transition-opacity duration-[250ms]"
        style={{
          background: "linear-gradient(transparent,rgba(0,0,0,0.85))",
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        <div
          onClick={seek}
          className="mb-2.5 h-1 cursor-pointer rounded-full bg-white/20"
        >
          <div
            className="h-full rounded-full bg-violet-600 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="border-none bg-transparent p-0 text-lg text-white"
          >
            {playing ? "⏸" : "▶"}
          </button>
          <span className="min-w-[90px] text-xs text-white/70">
            {fmt(current)} / {fmt(duration)}
          </span>
          <button
            onClick={() => setMuted((m) => !m)}
            className="border-none bg-transparent p-0 text-sm text-white"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={cycleSpeed}
            className="border-none bg-transparent p-0 text-[11px] font-bold text-white/70"
          >
            {playbackRate}x
          </button>
          <span className="ml-auto text-[11px] font-semibold text-white/40">
            Umang Vision Academy
          </span>
          <button
            onClick={toggleFS}
            className="border-none bg-transparent p-0 text-base text-white"
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
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-[18px] px-6 py-8 text-center">
          <span className="text-5xl">🔒</span>
          <div>
            <h2 className="mb-1.5 text-[22px] font-extrabold text-slate-100">
              {quiz?.title || "Quiz"} Locked
            </h2>
            <p className="max-w-[360px] text-[13px] text-slate-500">
              Complete the required lessons before starting this quiz.
            </p>
          </div>
          <div className="w-full max-w-[320px] rounded-2xl border border-[#1e293b] bg-[#111827] px-[18px] py-3.5">
            <div className="mb-2 flex justify-between text-xs font-bold text-slate-400">
              <span>Lessons completed</span>
              <span>
                {completedCount}/{totalLessons}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#1e293b]">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-cyan-500"
                style={{ width: `${lockedProgress}%` }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#334155] bg-transparent px-[22px] py-2.5 text-[13px] font-bold text-slate-400 hover:bg-[#1e293b]"
          >
            Back to Lessons
          </button>
        </div>
      );
    }
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 px-6 py-8 text-center">
        <span className="text-5xl">🎯</span>
        <div>
          <h2 className="mb-1.5 text-[22px] font-extrabold text-slate-100">
            {quiz.title || "Final Quiz"}
          </h2>
          <p className="max-w-[340px] text-[13px] text-slate-500">
            Test your knowledge. Each correct answer earns 10 points.
          </p>
        </div>
        <div className="flex w-full max-w-[360px] gap-3">
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
              className="flex-1 rounded-2xl border border-[#1e293b] bg-[#111827] px-2 py-3 text-center"
            >
              <div className="mb-1 text-xl">{icon}</div>
              <div className="text-[13px] font-bold text-slate-100">{val}</div>
              <div className="mt-0.5 text-[10px] text-slate-600">{label}</div>
            </div>
          ))}
        </div>
        <div className="w-full max-w-[360px] rounded-2xl border border-[#1e293b] bg-[#111827] px-[18px] py-3.5 text-left">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
            Instructions
          </p>
          {[
            "Each question has one correct answer",
            "Navigate freely between questions",
            "Results shown after submission",
          ].map((t) => (
            <p key={t} className="mb-1 text-xs text-slate-400">
              • {t}
            </p>
          ))}
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#334155] bg-transparent px-[22px] py-2.5 text-[13px] font-semibold text-slate-400 hover:bg-[#1e293b]"
          >
            Cancel
          </button>
          <button
            onClick={() => setQuizStep("quiz")}
            className="rounded-xl border-none bg-gradient-to-br from-violet-600 to-cyan-500 px-7 py-2.5 text-[13px] font-bold text-white hover:opacity-90"
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
      <div className="flex min-h-[480px] flex-col">
        <div className="border-b border-[#1e293b] px-5 pb-3 pt-3.5">
          <div className="mb-2 flex justify-between text-[11px] text-slate-500">
            <span>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span>
              {answered}/{questions.length} answered
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#1e293b]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-[width] duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-3 pt-5">
          <p className="mb-[18px] text-[15px] font-bold leading-relaxed text-slate-100">
            {q.question}
          </p>
          <div className="flex flex-col gap-2.5">
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
                  className="flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-[13px] transition-all duration-150"
                  style={{
                    borderColor: sel ? "#7c3aed" : "#1e293b",
                    background: sel ? "#1e1b4b" : "#111827",
                    color: sel ? "#a78bfa" : "#e2e8f0",
                    fontWeight: sel ? 700 : 500,
                  }}
                >
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-extrabold"
                    style={{
                      borderColor: sel ? "#7c3aed" : "#334155",
                      background: sel ? "#7c3aed" : "transparent",
                      color: sel ? "#fff" : "#64748b",
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
        <div className="flex items-center gap-2.5 border-t border-[#1e293b] px-5 py-3">
          <button
            onClick={() => setCurrentQuestion((c) => Math.max(0, c - 1))}
            disabled={currentQuestion === 0}
            className="rounded-[10px] border border-[#334155] bg-transparent px-[18px] py-2.5 text-xs font-semibold"
            style={{
              color: currentQuestion === 0 ? "#334155" : "#e2e8f0",
              cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Back
          </button>
          <div className="flex flex-1 flex-wrap justify-center gap-1.5">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className="h-[26px] w-[26px] rounded-full border-none text-[10px] font-bold transition-all duration-150"
                style={{
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
                  transform: idx === currentQuestion ? "scale(1.15)" : "scale(1)",
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
              className="rounded-[10px] border-none bg-violet-600 px-[18px] py-2.5 text-xs font-semibold text-white hover:bg-violet-500"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={quizLoading}
              className="rounded-[10px] border-none px-[18px] py-2.5 text-xs font-bold text-white"
              style={{
                background: quizLoading
                  ? "#334155"
                  : "linear-gradient(135deg,#7c3aed,#06b6d4)",
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
    const { percentage, correctCount, totalQuestions, pointsEarned, breakdown } = quizResult;
    const passed = percentage >= 60;
    return (
      <div className="flex flex-col items-center gap-5 overflow-y-auto px-6 py-7">
        <span className="text-5xl">{passed ? "🎉" : "📚"}</span>
        <div className="text-center">
          <h2 className="mb-1 text-xl font-extrabold text-slate-100">
            {passed ? "Quiz Completed!" : "Keep Practicing!"}
          </h2>
          <p className="text-xs text-slate-500">
            {passed
              ? "Great job! Your score has been recorded."
              : "You need 60% to pass. Give it another shot!"}
          </p>
        </div>
        <div className="relative h-[110px] w-[110px]">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="10" />
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
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[22px] font-black text-slate-100">{percentage}%</span>
          </div>
        </div>
        <div className="flex w-full max-w-[360px] gap-2.5">
          {[
            { icon: "✅", label: "Correct", val: `${correctCount}/${totalQuestions}` },
            { icon: "⭐", label: "Points Earned", val: `+${pointsEarned}` },
            { icon: passed ? "🏆" : "❌", label: "Status", val: passed ? "PASSED" : "FAILED" },
          ].map(({ icon, label, val }) => (
            <div
              key={label}
              className="flex-1 rounded-2xl border px-2 py-2.5 text-center"
              style={{
                background: passed ? "#052e16" : "#1c0a00",
                borderColor: passed ? "#166534" : "#431407",
              }}
            >
              <div className="mb-1 text-lg">{icon}</div>
              <div className="text-xs font-bold" style={{ color: passed ? "#4ade80" : "#fb923c" }}>
                {val}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-600">{label}</div>
            </div>
          ))}
        </div>
        {breakdown && breakdown.length > 0 && (
          <div className="flex max-h-[180px] w-full max-w-[400px] flex-col gap-1.5 overflow-y-auto">
            {breakdown.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-[10px] border px-3 py-2 text-xs"
                style={{
                  background: b.correct ? "#052e16" : "#1c0a00",
                  borderColor: b.correct ? "#166534" : "#431407",
                  color: b.correct ? "#4ade80" : "#fb923c",
                }}
              >
                <span>{b.correct ? "✓" : "✗"}</span>
                <span className="flex-1">
                  Q{i + 1}: {b.correct ? "Correct" : `Correct answer: ${b.correctOption}`}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2.5">
          <button
            onClick={() => {
              setQuizStep("intro");
              setSelectedAnswers({});
              setCurrentQuestion(0);
            }}
            className="rounded-xl border border-[#334155] bg-transparent px-[22px] py-2.5 text-[13px] font-semibold text-slate-400 hover:bg-[#1e293b]"
          >
            Retake
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border-none bg-gradient-to-br from-violet-600 to-cyan-500 px-[22px] py-2.5 text-[13px] font-bold text-white hover:opacity-90"
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

  const [isFocused, setIsFocused] = useState(true);
  const mainContentRef = useRef(null);

  // Direct DOM blur — bypasses React re-render latency for instant effect
  const applyBlurNow = useCallback(() => {
    if (mainContentRef.current) {
      mainContentRef.current.style.filter = "blur(20px)";
      mainContentRef.current.style.transition = "none";
    }
    setIsFocused(false);
  }, []);

  const removeBlurNow = useCallback(() => {
    if (mainContentRef.current) {
      mainContentRef.current.style.filter = "none";
      mainContentRef.current.style.transition = "filter 0.3s ease";
    }
    setIsFocused(true);
  }, []);

  // Security and focus monitoring listeners
  useEffect(() => {
    const handleCopy = (e) => e.preventDefault();
    const handleSelectStart = (e) => e.preventDefault();

    const handleKeyDown = (e) => {
      // PrintScreen / Meta / OS: blur IMMEDIATELY via direct DOM (bypasses React async re-render)
      if (e.key === "PrintScreen" || e.key === "Meta" || e.key === "OS") {
        applyBlurNow();
        try {
          navigator.clipboard.writeText("");
        } catch (err) { }
        return; // handled
      }

      // Win+Shift+S (Snipping Tool): Shift+S while Meta is held
      if (e.shiftKey && (e.key === "s" || e.key === "S") && !e.ctrlKey) {
        applyBlurNow();
        try { navigator.clipboard.writeText(""); } catch (err) { }
      }

      // Disable Ctrl+P (Print)
      if (e.ctrlKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        alert("Printing is disabled for security reasons.");
      }
      // Disable Ctrl+S (Save)
      if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
      }
      // Disable Ctrl+C (Copy)
      if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        try { navigator.clipboard.writeText(""); } catch (err) { }
      }
      // Disable Ctrl+X (Cut)
      if (e.ctrlKey && (e.key === "x" || e.key === "X")) {
        e.preventDefault();
        try { navigator.clipboard.writeText(""); } catch (err) { }
      }
      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
      }
      // Disable F12, Ctrl+Shift+I / J / C (DevTools)
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key))
      ) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "PrintScreen" || e.key === "Meta" || e.key === "OS") {
        // Keep blurred for 1s after keyup so delayed screenshot tools also get the blur
        setTimeout(() => removeBlurNow(), 1000);
      }
    };

    const handleFocus = () => {
      if (window.innerWidth < 768) return;
      removeBlurNow();
    };
    const handleBlur = () => {
      if (window.innerWidth < 768) return;
      setTimeout(() => {
        if (!document.hasFocus()) {
          applyBlurNow();
        }
      }, 150);
    };
    const handleVisibility = () => {
      if (document.hidden) applyBlurNow();
      else removeBlurNow();
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCopy);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);

      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);



  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState(() => new Set());
  const [currentVideoPct, setCurrentVideoPct] = useState(0);

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizStep, setQuizStep] = useState("intro");
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

  const [showCertModal, setShowCertModal] = useState(false);

  const [showRating, setShowRating] = useState(false);
  const [localRatingAvg, setLocalRatingAvg] = useState(null);
  const [localRated, setLocalRated] = useState(null);

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsedSubj, setCollapsedSubj] = useState(new Set());
  const [collapsedCh, setCollapsedCh] = useState(new Set());

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

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

  const allLessons = course?.lessons ?? [];
  const activeLesson = allLessons[activeIdx];
  const isTextLesson = activeLesson?.type === "text";

  const firstUncompletedIdx = useMemo(() => {
    return allLessons.findIndex((_, idx) => !completed.has(idx));
  }, [allLessons, completed]);

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

  const isReplay = searchParams.get("replay") === "true";

  function checkAndShowCert(extraJustSubmittedTitle) {
    if (isReplay) return;
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
        checkAndShowCert(activeQuiz?.title || "Final Quiz");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const lessonProgressRef = useRef({});
  const [lessonProgressState, setLessonProgressState] = useState({});
  const lastStateUpdateRef = useRef({ time: 0, pct: -1 });
  const [initialTime, setInitialTime] = useState(0);

  useEffect(() => {
    const savedVal = lessonProgressRef.current[activeIdx];
    const initTime = typeof savedVal === 'object' ? savedVal?.currentTime : savedVal;
    setInitialTime(initTime || 0);
    setCurrentVideoPct(typeof savedVal === 'object' ? savedVal?.pct : 0);
    lastStateUpdateRef.current = { time: 0, pct: -1 };
  }, [activeIdx]);

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
              console.warn("Failed to sync progress immediately:", err?.message || err);
            });
        }
        return;
      }
      if (saveTimer.current) return;
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        if (user && id) {
          api
            .post(`/courses/${id}/progress`, pendingSave.current)
            .catch((err) => {
              console.warn("Failed to sync progress to server:", err?.message || err);
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
        try {
          const { data: progressResp } = await api.get(`/courses/${id}/progress`);
          const prog = progressResp?.progress;
          if (prog) {
            lessonProgressRef.current = prog.lessonProgress || {};
            setLessonProgressState(prog.lessonProgress || {});
            setCompleted(new Set(prog.completed || []));
            setActiveIdx(prog.lastLesson ?? 0);
            const savedVal = (prog.lessonProgress || {})[prog.lastLesson ?? 0];
            const initTime = typeof savedVal === 'object' ? savedVal?.currentTime : savedVal;
            setInitialTime(initTime || 0);
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
      if (user && id && Object.keys(pendingSave.current).length) {
        api
          .post(`/courses/${id}/progress`, pendingSave.current)
          .catch((err) => {
            console.warn("Failed to flush progress on unload:", err?.message || err);
          });
      }
    },
    [user, id],
  );

  const handleLessonEnd = useCallback(() => {
    setCompleted((prev) => {
      const next = new Set([...prev, activeIdx]);
      scheduleSave(
        {
          lastLesson: activeIdx,
          completed: Array.from(next),
          lessonProgress: lessonProgressRef.current,
        },
        true,
      );
      return next;
    });
    if (activeIdx < allLessons.length - 1) setActiveIdx((i) => i + 1);
  }, [activeIdx, allLessons.length, scheduleSave]);

  const getLessonProgressPct = useCallback((lessonIdx, durationMins) => {
    const prog = lessonProgressState[lessonIdx];
    if (!prog) return 0;

    if (typeof prog === 'object') {
      return prog.pct || 0;
    }

    if (typeof prog === 'number' && durationMins > 0) {
      const durationSeconds = durationMins * 60;
      return Math.min(100, Math.round((prog / durationSeconds) * 100));
    }

    return 0;
  }, [lessonProgressState]);

  const handleVideoProgress = useCallback(
    (pct, currentTime, duration) => {
      const roundedPct = Math.round(pct);
      const currentSec = Math.floor(currentTime);

      if (roundedPct !== lastStateUpdateRef.current.pct || currentSec !== lastStateUpdateRef.current.time) {
        lastStateUpdateRef.current = { time: currentSec, pct: roundedPct };

        setCurrentVideoPct(roundedPct);

        const newProgress = {
          currentTime,
          duration: duration || 0,
          pct: roundedPct,
        };

        lessonProgressRef.current[activeIdx] = newProgress;
        setLessonProgressState((prev) => ({
          ...prev,
          [activeIdx]: newProgress,
        }));
      }

      setCompleted((prev) => {
        if (roundedPct >= 90 && !prev.has(activeIdx)) {
          const next = new Set([...prev, activeIdx]);
          scheduleSave(
            {
              lastLesson: activeIdx,
              completed: Array.from(next),
              lessonProgress: lessonProgressRef.current,
            },
            true,
          );
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
    return course.ratings.find((r) => r.user?.toString() === user._id?.toString());
  }, [course, user]);

  const displayRating =
    localRatingAvg ??
    course?.ratingAverage ??
    (course?.rating ? Number(course.rating).toFixed(1) : null);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1120]">
        <div className="text-center text-slate-500">
          <div className="mb-3 text-4xl">⏳</div>
          <p>Loading course…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b1120]">
        <span className="text-5xl">😔</span>
        <p className="font-semibold text-red-400">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-[10px] border-none bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-500"
        >
          ← Go Back
        </button>
      </div>
    );

  const sidebarContent = (
    <>
      <div className="flex flex-shrink-0 items-start justify-between gap-2.5 border-b border-[#1e293b] px-[18px] py-3.5">
        <div>
          <h2 className="text-[13px] font-bold text-slate-100">Course Content</h2>
          <p className="mt-[3px] text-[11px] text-slate-500">
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} · {allLessons.length} lessons
          </p>
        </div>
        {!isDesktop && (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
            className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-lg border border-[#334155] bg-[#1e293b] text-[13px] leading-none text-slate-400"
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {subjects.map((subj, si) => {
          const subjCollapsed = collapsedSubj.has(si);
          const subjLessons = subj.chapters.flatMap((ch) => ch.lessons);
          const subjDoneCount = subjLessons.filter((l) => completed.has(l.globalIdx)).length;
          const subjAllDone = subjDoneCount === subjLessons.length;
          const sq = subj.subjectQuiz;
          const subjFirstUncompletedGlobalIdx = (() => {
            const first = subjLessons.find((l) => !completed.has(l.globalIdx));
            return first ? first.globalIdx : -1;
          })();

          return (
            <div key={si} className="border-b border-[#1e293b]">
              {/* ── Subject Header ── */}
              <button
                onClick={() => toggleSubject(si)}
                className="flex w-full items-center justify-between gap-3 border-none bg-[#101b30] px-5 py-4 text-left transition-colors hover:bg-[#15233d]"
                style={{ borderLeft: "4px solid #8b5cf6" }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex-shrink-0 text-base">📚</span>
                  <span className="truncate text-[14px] font-extrabold text-white tracking-wide">
                    {subj.subject}
                  </span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-900/50 px-2 py-0.5 rounded-full">
                    {subjDoneCount}/{subjLessons.length}
                  </span>
                  <svg
                    className="h-4 w-4 text-slate-400 transition-transform duration-[280ms]"
                    style={{ transform: subjCollapsed ? "rotate(0deg)" : "rotate(-180deg)" }}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              <div
                className="grid overflow-hidden transition-[grid-template-rows] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ gridTemplateRows: subjCollapsed ? "0fr" : "1fr" }}
              >
                <div className="min-h-0">
                  {subj.chapters.map((chapter, ci) => {
                    const chKey = `${si}-${ci}`;
                    const chCollapsed = collapsedCh.has(chKey);
                    return (
                      <div key={chKey} className="border-b border-[#1e293b]/40">
                        {/* ── Chapter Sub-Header ── */}
                        <button
                          onClick={() => toggleChapter(chKey)}
                          className="flex w-full items-center justify-between gap-3 border-none bg-[#162238] py-3 pl-[30px] pr-5 text-left transition-colors hover:bg-[#1d2d4a]"
                          style={{ borderLeft: "4px solid #475569" }}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex-shrink-0 text-[13px]">📖</span>
                            <span className="truncate text-[13px] font-bold text-slate-200">
                              {chapter.title}
                            </span>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-900/30 px-1.5 py-0.5 rounded">
                              {chapter.lessons.length}
                            </span>
                            <svg
                              className="h-3.5 w-3.5 text-slate-500 transition-transform duration-[220ms]"
                              style={{ transform: chCollapsed ? "rotate(0deg)" : "rotate(-180deg)" }}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </button>

                        {/* ── Lessons ── */}
                        <div
                          className="grid overflow-hidden transition-[grid-template-rows] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                          style={{ gridTemplateRows: chCollapsed ? "0fr" : "1fr" }}
                        >
                          <div className="min-h-0 bg-[#0d1526]/50">
                            {chapter.lessons.map((lesson) => {
                              const isActive = lesson.globalIdx === activeIdx && !activeQuiz;
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
                                  className={`flex w-full items-start gap-3 border-none py-3.5 pl-[42px] pr-5 text-left transition-all duration-150 ${isActive
                                      ? "bg-violet-950/40 text-violet-300 font-bold border-l-[3px] border-violet-500"
                                      : "text-slate-400 hover:bg-[#1a2b47]/30 hover:text-slate-200"
                                    }`}
                                  style={{
                                    borderBottom: "1px solid rgba(30, 41, 59, 0.2)",
                                    cursor: isLocked ? "not-allowed" : "pointer",
                                    opacity: isLocked ? 0.45 : 1,
                                  }}
                                >
                                  {/* Multi-state Status Badge */}
                                  <div
                                    className="mt-0.5 flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150"
                                    style={{
                                      borderColor: isDone
                                        ? "#22c55e"
                                        : isActive
                                          ? "#a78bfa"
                                          : isLocked
                                            ? "#2a374a"
                                            : "#475569",
                                      background: isDone
                                        ? "#22c55e"
                                        : isActive
                                          ? "rgba(167, 139, 250, 0.12)"
                                          : "transparent",
                                    }}
                                  >
                                    {isDone ? (
                                      <span className="text-[11px] font-black text-white">✓</span>
                                    ) : isLocked ? (
                                      <span className="text-[9px]">🔒</span>
                                    ) : (
                                      <span className="text-[8px] text-slate-500">○</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className="truncate text-[13px] leading-snug"
                                      style={{
                                        fontWeight: isActive ? 800 : 500,
                                        color: isActive ? "#c084fc" : isLocked ? "#64748b" : "#cbd5e1",
                                      }}
                                    >
                                      {lesson.title}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        {lessonIsText ? "📄 Notes" : "🎬 Video Class"}
                                      </span>
                                      {!lessonIsText && lesson.durationMinutes > 0 && (
                                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-900/30 px-1 rounded">
                                          {fmtMins(lesson.durationMinutes)}
                                        </span>
                                      )}
                                    </div>
                                    {!lessonIsText && (() => {
                                      const pct = getLessonProgressPct(lesson.globalIdx, lesson.durationMinutes);
                                      if (pct <= 0) return null;
                                      return (
                                        <div className="mt-2 flex items-center gap-2 max-w-[150px]">
                                          <div className="h-1 flex-1 rounded-full bg-slate-800 overflow-hidden">
                                            <div
                                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                          <span className="text-[9px] font-bold text-violet-400/90 whitespace-nowrap">
                                            {pct}%
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  {isActive && (
                                    <span className="flex-shrink-0 text-xs text-violet-400 animate-pulse">▶</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* ── Subject Quiz ── */}
                  {sq &&
                    (() => {
                      const isActiveQuiz = activeQuiz === sq;
                      const quizLocked = !subjAllDone;
                      return (
                        <button
                          className={`flex w-full items-center gap-3 border-none py-4 pl-[30px] pr-5 text-left transition-colors duration-150 ${isActiveQuiz
                              ? "bg-violet-950/40 text-violet-300 font-bold border-l-[3px] border-violet-500"
                              : "text-slate-400 hover:bg-[#1a2b47]/30 hover:text-slate-200"
                            }`}
                          disabled={quizLocked}
                          onClick={() => {
                            if (quizLocked) return;
                            setActiveQuiz(sq);
                            setQuizStep("intro");
                            setSelectedAnswers({});
                            if (!isDesktop) setMobileSidebarOpen(false);
                          }}
                          style={{
                            borderBottom: "1px solid rgba(30, 41, 59, 0.2)",
                            cursor: quizLocked ? "not-allowed" : "pointer",
                            opacity: quizLocked ? 0.45 : 1,
                          }}
                        >
                          <div
                            className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px]"
                            style={{
                              borderColor: quizLocked ? "#2a374a" : "#a78bfa",
                              background: isActiveQuiz ? "#7c3aed" : "transparent",
                            }}
                          >
                            📝
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="mb-0.5 text-[13px] font-bold"
                              style={{
                                color: quizLocked ? "#64748b" : isActiveQuiz ? "#c084fc" : "#cbd5e1",
                              }}
                            >
                              {sq.title || "Subject Quiz"}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {quizLocked
                                ? "🔒 Locked · Complete lessons to unlock"
                                : `🎯 Test · ${sq.questions.length} Qs`}
                            </p>
                          </div>
                          {!quizLocked &&
                            user?.quizSubmissions?.some(
                              (s) => s.courseId?.toString() === course._id?.toString() && s.title === sq.title,
                            ) && <span className="text-sm text-green-400 font-bold">✓ Done</span>}
                          {quizLocked && <span className="text-sm text-slate-600">🔒</span>}
                          {!quizLocked && isActiveQuiz && (
                            <span className="text-xs text-violet-400 animate-pulse">▶</span>
                          )}
                        </button>
                      );
                    })()}
                </div>
              </div>
            </div>
          );
        })}

        {course?.quiz?.questions?.length > 0 && (
          <button
            className={`flex w-full items-center gap-3 border-none border-t border-[#1e293b] px-5 py-4.5 text-left transition-colors duration-150 ${activeQuiz === course.quiz
                ? "bg-violet-950/40 text-violet-300 font-bold border-l-[3px] border-violet-500"
                : "text-slate-400 hover:bg-[#1a2b47]/30 hover:text-slate-200"
              }`}
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
              cursor: !courseComplete ? "not-allowed" : "pointer",
              opacity: courseComplete ? 1 : 0.45,
            }}
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[15px]"
              style={{
                background: !courseComplete
                  ? "#2a374a"
                  : activeQuiz === course.quiz
                    ? "#7c3aed"
                    : "linear-gradient(135deg,#4f46e5,#7c3aed)",
              }}
            >
              🏆
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="mb-0.5 text-[13px] font-bold"
                style={{
                  color: !courseComplete
                    ? "#64748b"
                    : activeQuiz === course.quiz
                      ? "#c084fc"
                      : "#cbd5e1",
                }}
              >
                {course.quiz.title || "Final Course Quiz"}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {courseComplete
                  ? `🏁 Course Completed · ${course.quiz.questions.length} Questions`
                  : `🔒 Locked · Complete ${completed.size}/${totalLessonCount} lessons`}
              </p>
            </div>
            {courseComplete &&
              user?.quizSubmissions?.some((s) => s.courseId?.toString() === course._id?.toString()) && (
                <span className="text-sm text-green-400">✓</span>
              )}
            {!courseComplete && <span className="text-sm text-slate-500">🔒</span>}
            {courseComplete && activeQuiz === course.quiz && (
              <span className="text-xs text-violet-500">▶</span>
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#0b1120] font-sans text-slate-100">
      <style>{`
        @keyframes certPop {
          from { opacity:0; transform:scale(0.85) translateY(20px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        .cp-layout { display:flex; flex:1; overflow:hidden; }
        .cp-main   { flex:1; min-width:0; overflow-y:auto; padding:16px 14px 40px; }
        .cp-sidebar { width:320px; border-left:1px solid #1e293b; background:#0d1526; display:flex; flex-direction:column; flex-shrink:0; overflow-y:auto; height:100%; }
        @media (min-width:768px) { .cp-main { padding:24px 24px 40px; } .cp-sidebar { width:360px; } }
        @media (min-width:1024px) {
          .cp-sidebar {
            height: 90vh;
            border-bottom: 1px solid #1e293b;
            border-bottom-left-radius: 12px;
          }
        }
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
        .cp-topbar-title { font-size:14px; font-weight:700; color:#f1f5f9; flex:1; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; line-height:1.25; }
        @media (min-width:768px) { .cp-topbar-title { font-size:15px; } }
        @media print {
          body { display: none !important; }
        }
        .quiz-btn-hover:hover { background:#111827 !important; }
        .rate-btn:hover { background:#1e293b !important; }
      `}</style>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-[#1e293b] bg-[#0d1526] px-3.5 py-2.5">
        <button
          onClick={() => navigate("/student-dashboard/my-courses")}
          className="flex-shrink-0 whitespace-nowrap border-none bg-transparent text-[13px] font-semibold text-slate-400 hover:text-slate-200"
        >
          ← Courses
        </button>
        <p className="cp-topbar-title">{course?.title}</p>
        {!isDesktop && (
          <button
            onClick={() => setMobileSidebarOpen((o) => !o)}
            className="flex-shrink-0 whitespace-nowrap rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 py-[5px] text-[11px] font-semibold text-slate-400"
          >
            {mobileSidebarOpen ? "Hide" : "Content"}
          </button>
        )}
      </div>

      {/* ── Main layout ── */}
      <div className="cp-layout">
        <div
          className="cp-main"
          style={{
            position: "relative",
          }}
        >
          <div
            ref={mainContentRef}
            style={{
              filter: isFocused ? "none" : "blur(20px)",
              transition: "filter 0.3s ease",
            }}
          >
          {activeQuiz ? (
            <div className="rounded-[18px] border border-[#1e293b] bg-[#111827] p-4 sm:p-8">
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
                    : allLessons.filter((l, idx) => l.subject === activeQuiz?.subject && completed.has(idx)).length
                }
                totalLessons={
                  activeQuiz === course.quiz
                    ? totalLessonCount
                    : allLessons.filter((l) => l.subject === activeQuiz?.subject).length
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
          ) : (
            <div onContextMenu={(e) => e.preventDefault()}>
              {isTextLesson ? (
                <TextLessonViewer lesson={activeLesson} user={user} />
              ) : (
                <VideoPlayer
                  url={activeLesson?.videoUrl}
                  poster={course?.thumbnailUrl}
                  initialTime={initialTime}
                  onEnded={handleLessonEnd}
                  onProgress={handleVideoProgress}
                  user={user}
                />
              )}
            </div>
          )}

          {!activeQuiz && (
            <div className="mt-[18px]">
              <div className="flex flex-wrap items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="mb-[5px] flex flex-wrap items-center gap-2">
                    <p className="text-[11px] text-slate-500">
                      Lesson {activeIdx + 1} of {allLessons.length}
                    </p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: isTextLesson ? "#0c2a1a" : "#2e1065",
                        color: isTextLesson ? "#4ade80" : "#a78bfa",
                      }}
                    >
                      {isTextLesson ? "📝 TEXT" : "🎬 VIDEO"}
                    </span>
                  </div>
                  <h1 className="text-[clamp(17px,3vw,24px)] font-extrabold leading-tight text-slate-100">
                    {activeLesson?.title || "Untitled Lesson"}
                  </h1>
                  {activeLesson?.chapterTitle && (
                    <p className="mt-[5px] text-xs font-semibold text-indigo-400">
                      📂 {activeLesson.chapterTitle}
                    </p>
                  )}
                  <p className="mt-[5px] text-xs text-slate-400">
                    {isTextLesson
                      ? "Read through the lesson and mark it complete when done"
                      : currentVideoPct > 0
                        ? `Progress: ${currentVideoPct}%`
                        : "Start watching to track progress"}
                  </p>
                </div>

                <div className="flex flex-shrink-0 items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#1e293b]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-[width] duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">{progressPct}%</span>
                  </div>

                  <button
                    onClick={() =>
                      setCompleted((prev) => {
                        const n = new Set(prev);
                        n.has(activeIdx) ? n.delete(activeIdx) : n.add(activeIdx);
                        scheduleSave(
                          {
                            lastLesson: activeIdx,
                            completed: Array.from(n),
                            lessonProgress: lessonProgressRef.current,
                          },
                          true,
                        );
                        return n;
                      })
                    }
                    className="flex-shrink-0 whitespace-nowrap rounded-[10px] border px-3.5 py-2 text-xs font-bold"
                    style={{
                      borderColor: completed.has(activeIdx) ? "#16a34a" : "#334155",
                      background: completed.has(activeIdx) ? "#052e16" : "transparent",
                      color: completed.has(activeIdx) ? "#4ade80" : "#94a3b8",
                    }}
                  >
                    {completed.has(activeIdx) ? "✓ Done" : "Mark Complete"}
                  </button>
                </div>
              </div>
              {activeLesson?.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                  {activeLesson.description}
                </p>
              )}
            </div>
          )}

          {!activeQuiz && (
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
                disabled={activeIdx === 0}
                className="flex-1 rounded-xl border border-[#334155] bg-transparent py-[11px] text-[13px] font-semibold"
                style={{
                  color: activeIdx === 0 ? "#334155" : "#e2e8f0",
                  cursor: activeIdx === 0 ? "not-allowed" : "pointer",
                }}
              >
                ← Previous
              </button>
              {(() => {
                const currentSubj = subjects.find((s) =>
                  s.chapters.some((ch) => ch.lessons.some((l) => l.globalIdx === activeIdx)),
                );
                const subjLessonsFlat = currentSubj
                  ? currentSubj.chapters.flatMap((ch) => ch.lessons)
                  : [];
                const isLastInSubject =
                  subjLessonsFlat.length > 0 &&
                  subjLessonsFlat[subjLessonsFlat.length - 1].globalIdx === activeIdx;
                const subjectQuiz = currentSubj?.subjectQuiz ?? null;
                const isSubjectQuizSubmitted =
                  subjectQuiz &&
                  (user?.quizSubmissions || []).some(
                    (s) =>
                      s.courseId?.toString() === course?._id?.toString() &&
                      s.title === (subjectQuiz.title || "Subject Quiz"),
                  );
                const goToSubjectQuiz = isLastInSubject && !!subjectQuiz && !isSubjectQuizSubmitted;

                const isLastLesson = activeIdx === allLessons.length - 1;
                const hasFinalQuiz = course?.quiz?.questions?.length > 0;
                const isFinalQuizSubmitted =
                  hasFinalQuiz &&
                  (user?.quizSubmissions || []).some(
                    (s) =>
                      s.courseId?.toString() === course?._id?.toString() &&
                      s.title === (course.quiz.title || "Final Quiz"),
                  );
                const goToFinalQuiz = !goToSubjectQuiz && isLastLesson && hasFinalQuiz && !isFinalQuizSubmitted;

                const isCurrentCompleted = completed.has(activeIdx);
                const isCourseFinished = isLastLesson && !goToSubjectQuiz && !goToFinalQuiz && !hasFinalQuiz;
                const disabledNext = !isCurrentCompleted || isCourseFinished;

                let btnLabel = "Next →";
                if (goToSubjectQuiz) btnLabel = "Finish → Take Subject Quiz";
                else if (goToFinalQuiz) btnLabel = "Finish → Take Final Quiz";
                else if (isCourseFinished) btnLabel = "Course Completed";

                return (
                  <button
                    onClick={() => {
                      if (!isCurrentCompleted) return;
                      setCompleted((p) => {
                        const next = new Set([...p, activeIdx]);
                        scheduleSave(
                          {
                            lastLesson: activeIdx,
                            completed: Array.from(next),
                            lessonProgress: lessonProgressRef.current,
                          },
                          true,
                        );
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
                        setActiveIdx(Math.min(allLessons.length - 1, activeIdx + 1));
                      }
                    }}
                    disabled={disabledNext}
                    className="flex-1 rounded-xl border-none py-[11px] text-[13px] font-bold"
                    style={{
                      background: disabledNext ? "#1e293b" : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                      color: disabledNext ? "#475569" : "#fff",
                      cursor: disabledNext ? "not-allowed" : "pointer",
                    }}
                  >
                    {btnLabel}
                  </button>
                );
              })()}
            </div>
          )}

          <div className="mt-7 rounded-[18px] border border-[#1e293b] bg-[#111827] px-[18px] py-[18px]">
            <div className="mb-2.5 flex items-start justify-between gap-3">
              <h3 className="text-[15px] font-bold text-slate-100">About this course</h3>
              {userExistingRating || localRated ? (
                <div
                  className="flex flex-shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3.5 py-[7px] text-xs font-bold"
                  style={{ borderColor: "#854d0e", background: "#1c1005", color: "#fbbf24" }}
                >
                  <span className="text-sm">
                    {(() => {
                      const stars = localRated ?? userExistingRating?.rating ?? 0;
                      return "★".repeat(stars) + "☆".repeat(5 - stars);
                    })()}
                  </span>
                  Rated
                </div>
              ) : (
                <button
                  className="rate-btn flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[#334155] bg-transparent px-3.5 py-[7px] text-xs font-bold text-slate-400 transition-colors duration-150"
                  onClick={() => setShowRating(true)}
                >
                  <span className="text-sm">☆☆☆☆☆</span>
                  Rate this course
                </button>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
              {course?.description || course?.summary}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-3">
              {[
                { icon: "📚", label: `${allLessons.length} lessons` },
                { icon: "👥", label: `${course?.students?.length ?? 0} students` },
                {
                  icon: "⭐",
                  label: displayRating ? `${Number(displayRating).toFixed(1)} rating` : "No ratings yet",
                },
                { icon: "📋", label: course?.board ?? "" },
              ]
                .filter((s) => s.label)
                .map((s) => (
                  <span key={s.label} className="text-xs text-slate-500">
                    {s.icon} {s.label}
                  </span>
                ))}
            </div>
            {course?.notes && course.notes.length > 0 && (
              <div className="mt-[18px] border-t border-[#1e293b] pt-4">
                <h4 className="mb-2.5 text-[13px] font-bold text-slate-100">
                  📄 Study Notes &amp; Materials
                </h4>
                <div className="flex flex-col gap-2">
                  {course.notes.map((note) => (
                    <div
                      key={note._id}
                      className="flex items-center justify-between rounded-[10px] border border-[#1e293b] bg-[#0d1526] px-3 py-2.5"
                    >
                      <div className="mr-2.5 min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-200">{note.title}</p>
                        {note.description && (
                          <p className="mt-0.5 text-[10px] text-slate-500">{note.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <a
                          href={getDocViewUrl(note.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="whitespace-nowrap rounded-lg bg-[#334155] px-3 py-1.5 text-[10px] font-bold text-slate-200 no-underline hover:bg-[#475569]"
                        >
                          View
                        </a>
                      <button
                        onClick={() => {
                          const ext = note.fileUrl.split(".").pop() || "pdf";
                          downloadFile(note.fileUrl, `${note.title}.${ext}`);
                        }}
                        className="whitespace-nowrap rounded-lg border-none bg-gradient-to-br from-violet-600 to-cyan-500 px-3 py-1.5 text-[10px] font-bold text-white hover:opacity-90"
                      >
                        Download
                      </button>
                    </div>
                    </div>
                  ))}
              </div>
              </div>
            )}
        </div>
        </div>

        {!isFocused && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm text-center p-4">
            <span className="text-4xl mb-2">🔒</span>
            <h3 className="text-lg font-bold text-white">Security Mode Active</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              Content is blurred because the page lost focus. Click back inside the window to resume.
            </p>
          </div>
        )}
      </div>

      {/* ── Sidebar (desktop) ── */}
      {isDesktop && <div className="cp-sidebar">{sidebarContent}</div>}
    </div>

      {/* ── Sidebar (mobile) ── */ }
  {
    !isDesktop &&
    createPortal(
      <>
        {mobileSidebarOpen && (
          <div
            className="cp-mobile-sidebar-overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <div className={`cp-mobile-sidebar${mobileSidebarOpen ? " open" : ""}`}>
          {sidebarContent}
        </div>
      </>,
      document.body,
    )
  }

  {
    showCertModal && (
      <CertificateEarnedModal
        course={course}
        onClose={() => setShowCertModal(false)}
        onViewCertificates={() => navigate("/student-dashboard/certificates")}
      />
    )
  }

  {
    showRating && (
      <RatingModal
        course={course}
        user={user}
        onClose={() => setShowRating(false)}
        onSubmitted={(stars) => {
          setLocalRated(stars);
          setShowRating(false);
          const existing = course?.ratings ?? [];
          const alreadyRated = existing.some((r) => r.user?.toString() === user._id?.toString());
          const total = existing.reduce((s, r) => s + (r.rating ?? 0), 0);
          const newTotal = alreadyRated
            ? total - (userExistingRating?.rating ?? 0) + stars
            : total + stars;
          const newCount = alreadyRated ? existing.length : existing.length + 1;
          setLocalRatingAvg((newTotal / newCount).toFixed(1));
        }}
      />
    )
  }
    </div >
  );
}