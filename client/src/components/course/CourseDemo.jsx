import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../../config/api.js";
import { addToCart } from "../../redux/slices/cartSlice";
import { loadCurrentUser } from "../../redux/slices/authSlice";
import { fetchEnrolledCourses } from "../../redux/slices/courseSlice";
import { hasBaseRole } from "../../utils/permissions.js";
import { useTranslation } from "react-i18next";
import { normalizeVideoUrl, isImageFile, isEmbedVideo, getEmbedUrl } from "../../utils/media.js";
import NoteViewerModal from "../common/NoteViewerModal.jsx";

import { useAiTranslation } from "../../utils/aiTranslate.js";

// ── Local state ───────────────────────────────────────────────────────────────
const useCourseDemo = (id) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const backPath = location.state?.from ?? "/";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/courses/public/${id}`)
      .then(({ data }) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Course not found.");
        setLoading(false);
      });
  }, [id]);

  return { course, loading, error };
};

// ── Access helper (shared by EnrollCard + the Notes section) ──────────────────
const useCourseAccess = (user, course) => {
  const isAdminOrStaff =
    user && (hasBaseRole(user, "admin") || hasBaseRole(user, "staff"));

  const isEnrolled =
    user &&
    course &&
    (user.enrolledCourses?.some(
      (id) => (id._id || id).toString() === course._id?.toString(),
    ) ||
      course.students?.some(
        (id) => (id._id || id).toString() === user._id?.toString(),
      ));

  return isAdminOrStaff || isEnrolled;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const levelColor = {
  Beginner: "#34d399",
  Intermediate: "#fbbf24",
  Advanced: "#f87171",
};

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

const fmt = (mins) => {
  if (!mins) return null;
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

const stars = (avg = 0) =>
  Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      style={{
        color: i < Math.round(avg) ? "#fbbf24" : "#334155",
        fontSize: 14,
      }}
    >
      ★
    </span>
  ));

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ w = "100%", h = 16, r = 8 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: r,
      background: "linear-gradient(90deg,#1e293b 25%,#263348 50%,#1e293b 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }}
  />
);

// ── Video player ──────────────────────────────────────────────────────────────
const VideoPlayer = ({ url, poster }) => {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const normalizedUrl = normalizeVideoUrl(url);
  const [videoSrc, setVideoSrc] = useState(normalizedUrl);

  useEffect(() => {
    setVideoSrc(normalizedUrl);
    setError("");
  }, [normalizedUrl]);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
      setPlaying(false);
    } else {
      ref.current.play().then(() => {
        setPlaying(true);
      }).catch((e) => {
        // Autoplay blocked — try muted first
        if (e.name === "NotAllowedError") {
          ref.current.muted = true;
          setMuted(true);
          ref.current.play().then(() => setPlaying(true)).catch(() => {});
        }
        console.warn("Demo video play() failed:", e.message);
      });
    }
  };

  const onTimeUpdate = () => {
    if (!ref.current) return;
    setProgress((ref.current.currentTime / ref.current.duration) * 100 || 0);
  };

  const seek = (e) => {
    if (!ref.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    ref.current.currentTime =
      ((e.clientX - rect.left) / rect.width) * ref.current.duration;
  };

  if (isImageFile(videoSrc)) {
    return (
      <div
        style={{
          position: "relative",
          borderRadius: 20,
          overflow: "hidden",
          background: "#0b1120",
          aspectRatio: "16/9",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <img
          src={videoSrc}
          alt="Course Demo Asset"
          style={{ maxHeight: "80%", maxWidth: "90%", objectFit: "contain", borderRadius: 12 }}
        />
        <p style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
          🖼️ Image asset loaded for demo (Upload an MP4 / WebM video file for video playback)
        </p>
      </div>
    );
  }

  if (isEmbedVideo(videoSrc)) {
    return (
      <div
        style={{
          position: "relative",
          borderRadius: 20,
          overflow: "hidden",
          background: "#000",
          aspectRatio: "16/9",
        }}
      >
        <iframe
          src={getEmbedUrl(videoSrc)}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Demo Video"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        background: "#000",
        aspectRatio: "16/9",
        cursor: "pointer",
      }}
      onClick={toggle}
    >
      <video
        ref={ref}
        src={videoSrc}
        poster={poster}
        playsInline
        preload="metadata"
        muted={muted}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => setPlaying(false)}
        onError={(e) => {
          const v = e.currentTarget;
          const code = v.error?.code;
          const msg = v.error?.message || "Unknown error";

          // If Vercel Blob URL failed on localhost, fallback to local Express server URL
          if (videoSrc.includes("vercel-storage.com")) {
            const match = videoSrc.match(/\/uploads\/(.+)$/);
            if (match && match[1]) {
              const localFallback = `http://localhost:5000/uploads/${match[1]}`;
              console.log("🔄 Vercel Blob video failed, falling back to local server:", localFallback);
              setVideoSrc(localFallback);
              return;
            }
          }

          setError(`Video failed to load (code ${code}): ${msg}`);
          console.error("Demo video error:", code, msg, videoSrc);
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.85)",
            padding: 20,
            gap: 8,
          }}
        >
          <span style={{ fontSize: 32 }}>⚠️</span>
          <p style={{ color: "#f87171", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
            {error}
          </p>
          <p style={{ color: "#94a3b8", fontSize: 11, textAlign: "center", wordBreak: "break-all" }}>
            {normalizedUrl}
          </p>
        </div>
      )}
      {!playing && !error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "rgba(124,58,237,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(124,58,237,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span style={{ fontSize: 26, marginLeft: 4, color: "#fff" }}>
              ▶
            </span>
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "8px 12px 10px",
          background: "linear-gradient(transparent,rgba(0,0,0,0.7))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          onClick={seek}
          style={{
            height: 4,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 2,
            cursor: "pointer",
            marginBottom: 8,
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
              fontSize: 16,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button
            onClick={() => setMuted(!muted)}
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
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 600,
            }}
          >
            DEMO PREVIEW
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Enroll Card (shared between mobile inline + desktop sticky) ───────────────
const EnrollCard = ({
  course,
  loading,
  user,
  isInCart,
  addedToCart,
  canAccess,
  isFreeWithPlan,
  enrollingFree,
  onEnroll,
  onViewDemo,
  navigate,
}) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1e293b",
        borderRadius: 22,
        overflow: "hidden",
      }}
    >
      {loading ? (
        <Sk h={200} r={0} />
      ) : course?.thumbnailUrl ? (
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          style={{
            width: "100%",
            height: 200,
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            height: 200,
            background: "linear-gradient(135deg,#1e1b4b,#0f172a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
          }}
        >
          🎓
        </div>
      )}

      <div style={{ padding: "22px 22px 26px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Sk w="50%" h={36} r={8} />
            <Sk h={48} r={14} />
            <Sk h={40} r={14} />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9" }}>
                {course.price ? (
                  `₹${course.price}`
                ) : (
                  <span style={{ color: "#34d399" }}>{t("courses.free")}</span>
                )}
              </div>
              {course.price > 0 && (
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  {t("demo.lifetime")}
                </p>
              )}
            </div>

            <button
              className="enroll-btn"
              onClick={
                canAccess ? () => navigate(`/courses/${course?._id}`) : onEnroll
              }
              disabled={enrollingFree}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background: canAccess
                  ? "linear-gradient(135deg,#7c3aed,#06b6d4)"
                  : enrollingFree
                    ? "#334155"
                    : isInCart || addedToCart
                      ? "linear-gradient(135deg,#059669,#34d399)"
                      : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: enrollingFree ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
                marginBottom: 12,
              }}
            >
              {canAccess
                ? "Go to Course"
                : enrollingFree
                  ? "Enrolling..."
                  : isFreeWithPlan
                    ? "Enroll for Free (Academy Plan)"
                    : isInCart || addedToCart
                      ? t("demo.added")
                      : course?.price > 0
                        ? t("demo.buy_now")
                        : t("demo.enroll_now")}
            </button>

            {(isInCart || addedToCart) && !canAccess && (
              <button
                onClick={() => navigate("/cart")}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 14,
                  border: "1px solid #334155",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("demo.go_to_cart")}
              </button>
            )}

            {!user && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "#475569",
                  marginTop: 10,
                }}
              >
                {t("demo.loginPrompt")}{" "}
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#818cf8",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {t("demo.login")}
                </button>
              </p>
            )}

            <div
              style={{
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {[
                course.lessonCount > 0 &&
                  t("demo.lessonsCount", { count: course.lessonCount }),
                course.durationHours > 0 &&
                  t("demo.hoursCount", { count: course.durationHours }),
                course.notes?.length > 0 &&
                  `${course.notes.length} study note${course.notes.length === 1 ? "" : "s"} included`,
                !canAccess && course?.price > 0 && t("demo.pyqBenefit"),
                t("demo.lifetime_access"),
                t("demo.certificate"),
              ]
                .filter(Boolean)
                .map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#94a3b8",
                    }}
                  >
                    <span style={{ color: "#34d399" }}>✓</span> {item}
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CourseDemo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { t } = useTranslation();

  const { course, loading, error } = useCourseDemo(id);

  const translatableTexts = React.useMemo(() => {
    if (!course) return [];
    const set = new Set();
    if (course.title) set.add(course.title);
    if (course.category) set.add(course.category);
    if (course.subject) set.add(course.subject);
    (course.chapters || []).forEach((ch) => {
      if (ch.title) set.add(ch.title);
      (ch.lessons || []).forEach((l) => {
        if (l.title) set.add(l.title);
      });
    });
    (course.notes || []).forEach((n) => {
      if (n.title) set.add(n.title);
    });
    return Array.from(set);
  }, [course]);

  const { tText } = useAiTranslation(translatableTexts);

  const [addedToCart, setAddedToCart] = useState(false);
  const [activeModalNote, setActiveModalNote] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const videoSectionRef = useRef(null);

  const cartIds = useSelector((s) => s.cart?.cartIds ?? []);
  const isInCart = cartIds.includes(id);
  const canAccess = useCourseAccess(user, course);

  const isFreeWithPlan =
    user?.subscription?.status === "active" &&
    user?.selectedClass &&
    course?.category &&
    user.selectedClass.toLowerCase().trim() === course.category.toLowerCase().trim();
  const [enrollingFree, setEnrollingFree] = useState(false);

  useEffect(() => {
    if (!id || id === "undefined") navigate("/courses", { replace: true });
  }, [id, navigate]);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const handleEnrollClick = async () => {
    if (!user) {
      navigate("/login", {
        state: { from: `/courses/${id}/demo`, replace: true },
      });
      return;
    }

    if (!id || id === "undefined") return;

    if (isFreeWithPlan && !canAccess) {
      try {
        setEnrollingFree(true);
        await api.post("/courses/enroll", { courseIds: [id] });
        // Update user state so UI knows they are enrolled
        await dispatch(loadCurrentUser());
        await dispatch(fetchEnrolledCourses());
        // After successful enrollment, simply reload or navigate to the course
        navigate(`/courses/${id}`);
      } catch (err) {
        alert(err.response?.data?.message || "Error enrolling for free.");
        setEnrollingFree(false);
      }
      return;
    }

    dispatch(addToCart(id));
    setAddedToCart(true);
  };

  const handleViewDemoClick = () => {
    if (videoSectionRef.current) {
      videoSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const enrollCardProps = {
    course,
    loading,
    user,
    isInCart,
    addedToCart,
    canAccess,
    isFreeWithPlan,
    enrollingFree,
    onEnroll: handleEnrollClick,
    onViewDemo: handleViewDemoClick,
    navigate,
  };

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .demo-fade { animation: fadeUp 0.4s ease both; }
        .lesson-row:hover { background: #1e293b !important; }
        .enroll-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#0b1120",
          color: "#f1f5f9",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
      >
        {/* ── Error state ── */}
        {error && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 48 }}>😔</div>
            <p style={{ color: "#f87171", fontWeight: 600 }}>{error}</p>
            <button
              onClick={() => navigate("/courses")}
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
              {t("demo.browseCourses")}
            </button>
          </div>
        )}

        {/* ── Back button ── */}
        <div style={{ padding: isMobile ? "14px 16px" : "16px 24px" }}>
          <button
            onClick={() => navigate("/courses")}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t("demo.backToCourses")}
          </button>
        </div>

        {/* ── Main content ── */}
        {!error && (
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: isMobile ? "16px 16px 40px" : "32px 20px",
            }}
          >
            <div
              className="demo-fade"
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr minmax(0, 360px)",
                gap: isMobile ? 24 : 32,
                alignItems: "start",
              }}
            >
              {/* ── LEFT column ── */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? 20 : 28,
                }}
              >
                {/* Title block */}
                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <Sk w="60%" h={12} />
                    <Sk w="90%" h={36} r={10} />
                    <Sk w="70%" h={16} />
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: `${levelColor[course.level] ?? "#818cf8"}18`,
                          color: levelColor[course.level] ?? "#818cf8",
                          border: `1px solid ${levelColor[course.level] ?? "#818cf8"}30`,
                        }}
                      >
                        {course.level}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: "#1e293b",
                          color: "#94a3b8",
                        }}
                      >
                        {tText(course.category)}
                      </span>
                    </div>

                    <h1
                      style={{
                        fontSize: isMobile ? 24 : "clamp(24px,4vw,38px)",
                        fontWeight: 800,
                        color: "#f1f5f9",
                        lineHeight: 1.25,
                        marginBottom: 12,
                      }}
                    >
                      {tText(course.title)}
                    </h1>
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: isMobile ? 14 : 15,
                        lineHeight: 1.7,
                      }}
                    >
                      {course.summary}
                    </p>

                    {/* Stats row — wraps naturally on mobile */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: isMobile ? 12 : 20,
                        marginTop: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex" }}>
                          {stars(course.ratingAverage)}
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#fbbf24",
                          }}
                        >
                          {course.ratingAverage?.toFixed(1) || "New"}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          {t("demo.reviewsCount", {
                            count: course.reviewCount ?? 0,
                          })}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, color: "#64748b" }}>
                        {t("demo.studentsCount", {
                          count: course.enrolledCount ?? 0,
                        })}
                      </span>
                      {course.lessonCount > 0 && (
                        <span style={{ fontSize: 13, color: "#64748b" }}>
                          📚{" "}
                          {t("demo.lessonsCount", {
                            count: course.lessonCount,
                          })}
                        </span>
                      )}
                      {course.durationHours > 0 && (
                        <span style={{ fontSize: 13, color: "#64748b" }}>
                          {t("demo.hoursTotal", {
                            count: course.durationHours,
                          })}
                        </span>
                      )}
                      {course.notes?.length > 0 && (
                        <span style={{ fontSize: 13, color: "#64748b" }}>
                          📄 {course.notes.length} note
                          {course.notes.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>

                    {/* Instructor */}
                    {course.instructor && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginTop: 16,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg,#7c3aed,#06b6d4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {course.instructor.name?.charAt(0) ?? "I"}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, color: "#64748b" }}>
                            {t("demo.instructor")}
                          </p>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#e2e8f0",
                            }}
                          >
                            {course.instructor.name}
                          </p>
                          {course.instructor.avgRating !== undefined && (
                            <p style={{ fontSize: 12, color: course.instructor.avgRating ? "#fbbf24" : "#64748b", marginTop: 2 }}>
                              {course.instructor.avgRating
                                ? `★ ${course.instructor.avgRating} (${course.instructor.ratingCount} ${course.instructor.ratingCount === 1 ? 'review' : 'reviews'})`
                                : "No ratings yet"}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Enroll card — MOBILE ONLY (sits between title and video) ── */}
                {isMobile && <EnrollCard {...enrollCardProps} />}

                {/* Video player */}
                {loading ? (
                  <div
                    style={{
                      aspectRatio: "16/9",
                      background: "#1e293b",
                      borderRadius: 20,
                    }}
                  />
                ) : course.demoVideoUrl ? (
                  <div ref={videoSectionRef}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#818cf8",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: 10,
                      }}
                    >
                      {t("demo.preview")}
                    </p>
                    <VideoPlayer
                      url={course.demoVideoUrl}
                      poster={course.thumbnailUrl}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      borderRadius: 20,
                      overflow: "hidden",
                      aspectRatio: "16/9",
                      background: "#111827",
                      border: "1px dashed #334155",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <>
                        <span style={{ fontSize: 40 }}>🎓</span>
                        <p style={{ color: "#475569", fontSize: 13 }}>
                          {t("demo.noDemoVideo")}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Description */}
                {!loading && course.description && (
                  <div
                    style={{
                      background: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: 18,
                      padding: isMobile ? "18px 16px" : "22px 24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#f1f5f9",
                        marginBottom: 12,
                      }}
                    >
                      {t("demo.about")}
                    </h3>
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: 14,
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {course.description}
                    </p>
                  </div>
                )}

                {/* Notes — count/titles always visible as a selling point;
                    actual files only download-able once the user has access
                    (enrolled or admin/staff), same pattern as the locked
                    curriculum list below. */}
                {!loading && course.notes?.length > 0 && (
                  <div
                    style={{
                      background: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: 18,
                      padding: isMobile ? "18px 16px" : "22px 24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#f1f5f9",
                        marginBottom: 4,
                      }}
                    >
                      📄 Study Notes & Materials{" "}
                      <span
                        style={{
                          color: "#64748b",
                          fontWeight: 400,
                          fontSize: 13,
                        }}
                      >
                        ({course.notes.length})
                      </span>
                    </h3>
                    {!canAccess && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          marginBottom: 14,
                        }}
                      >
                        Included with enrollment — unlock by joining the course.
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        marginTop: canAccess ? 14 : 0,
                      }}
                    >
                      {course.notes.map((note) => (
                        <div
                          key={note._id || note.title}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                            background: "#0d1526",
                            borderRadius: 12,
                            border: "1px solid #1e293b",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#e2e8f0",
                              }}
                            >
                              {tText(note.title)}
                            </p>
                            {note.description && (
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#64748b",
                                  marginTop: 2,
                                }}
                              >
                                {note.description}
                              </p>
                            )}
                          </div>
                          {canAccess ? (
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => setActiveModalNote(note)}
                                style={{
                                  padding: "7px 14px",
                                  background: "linear-gradient(135deg,#0d9488,#059669)",
                                  color: "#fff",
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  border: "none",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                View
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: 13,
                                color: "#475569",
                                flexShrink: 0,
                              }}
                              title="Enroll to unlock"
                            >
                              🔒
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lesson list */}
                {!loading && course.lessons?.length > 0 && (
                  <div
                    style={{
                      background: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: 18,
                      padding: isMobile ? "18px 16px" : "22px 24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#f1f5f9",
                        marginBottom: 16,
                      }}
                    >
                      {t("demo.curriculum")}{" "}
                      <span
                        style={{
                          color: "#64748b",
                          fontWeight: 400,
                          fontSize: 13,
                        }}
                      >
                        (
                        {t("demo.lessonsCount", {
                          count: course.lessons.length,
                        })}
                        )
                      </span>
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {(() => {
                        const isBulkCourse =
                          (course.lessons ?? []).some((l) => l.subject) ||
                          (course.notes ?? []).some((n) => n.subject) ||
                          (course.subjectQuizzes ?? []).length > 0;

                        const subjects = isBulkCourse
                          ? Array.from(new Set((course.lessons ?? []).map((l) => l.subject).filter(Boolean))).map((subj) => ({
                              name: subj,
                              lessons: (course.lessons ?? []).map((l, i) => ({ ...l, _globalIndex: i })).filter((l) => l.subject === subj)
                            }))
                          : [
                              {
                                name: "",
                                lessons: (course.lessons ?? []).map((l, i) => ({ ...l, _globalIndex: i }))
                              }
                            ];

                        return subjects.map((subj, sIdx) => (
                          <div key={sIdx} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {subj.name && (
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", padding: "8px 12px", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                                {tText(subj.name)}
                              </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: subj.name ? "4px 0 0 0" : "0" }}>
                              {subj.lessons.map((lesson) => (
                                <div
                                  key={lesson._globalIndex}
                                  className="lesson-row"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px 10px",
                                    borderRadius: 10,
                                    transition: "background 0.15s",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: 8,
                                      background: "#1e293b",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: "#64748b",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {lesson._globalIndex + 1}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <p
                                        style={{
                                          fontSize: 13,
                                          fontWeight: 600,
                                          color: "#e2e8f0",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {tText(lesson.title)}
                                      </p>
                                      {lesson.videoType === "animated_video" && (
                                        <span
                                          style={{
                                            fontSize: 9,
                                            fontWeight: 800,
                                            padding: "2px 6px",
                                            borderRadius: 4,
                                            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                                            color: "#ffffff",
                                            whiteSpace: "nowrap",
                                            flexShrink: 0,
                                          }}
                                        >
                                          ✨ Animated Video
                                        </span>
                                      )}
                                    </div>
                                    {lesson.description && (
                                      <p
                                        style={{
                                          fontSize: 11,
                                          color: "#64748b",
                                          marginTop: 2,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                  {lesson.durationMinutes > 0 && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "#64748b",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {fmt(lesson.durationMinutes)}
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: "#475569",
                                      flexShrink: 0,
                                    }}
                                  >
                                    🔒
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {!loading && course.tags?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "4px 12px",
                          borderRadius: 20,
                          background: "#1e293b",
                          color: "#64748b",
                          border: "1px solid #334155",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── RIGHT: sticky enroll card — DESKTOP ONLY ── */}
              {!isMobile && (
                <div style={{ position: "sticky", top: 80 }}>
                  <EnrollCard {...enrollCardProps} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <NoteViewerModal
        note={activeModalNote}
        isOpen={Boolean(activeModalNote)}
        onClose={() => setActiveModalNote(null)}
      />
    </>
  );
}
