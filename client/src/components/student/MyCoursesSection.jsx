import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEnrolledCourses } from "../../redux/slices/courseSlice";
import { Link } from "react-router-dom";
import api from "../../config/api.js";
import { useTranslation } from "react-i18next";

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig = {
  "in-progress": { bg: "rgba(251,191,36,0.12)", text: "#fbbf24", dot: "#fbbf24", label: "In Progress" },
  completed: { bg: "rgba(74,222,128,0.12)", text: "#4ade80", dot: "#4ade80", label: "Completed" },
  "not-started": { bg: "rgba(148,163,184,0.1)", text: "#94a3b8", dot: "#64748b", label: "Not Started" },
};

// Derive status from progress value since the model doesn't store it
const deriveStatus = (progress = 0) => {
  if (progress >= 100) return "completed";
  if (progress > 0) return "in-progress";
  return "not-started";
};

// Pick a colour accent based on category string
const categoryAccent = (category = "") => {
  const map = {
    ai: "#a78bfa",
    ml: "#a78bfa",
    design: "#f472b6",
    web: "#22d3ee",
    data: "#34d399",
    business: "#fbbf24",
    marketing: "#fb923c",
  };
  return map[category.toLowerCase()] ?? "#818cf8";
};

// Fallback emoji thumbnail when no thumbnailUrl
const categoryEmoji = (category = "") => {
  const map = {
    ai: "🤖",
    ml: "🧠",
    design: "🎨",
    web: "💻",
    data: "📊",
    business: "📈",
    marketing: "📣",
  };
  return map[category.toLowerCase()] ?? "📚";
};

const getRatingUserId = (rating) =>
  rating?.user?._id ?? rating?.user?.id ?? rating?.user;

// Compute progress for a course. Prefers fields the enrolled-courses API
// itself returns (course.progress / course.completedLessons), since those
// come fresh with every fetchEnrolledCourses() call. Falls back to the
// auth slice's user.courseProgress only when the course object doesn't
// carry its own progress — this avoids showing stale progress when
// `user` hasn't been refetched after a lesson completion elsewhere in
// the app.
const computeProgress = (c, user) => {
  const totalLessons = c.lessons?.length ?? c.totalLessons ?? 0;

  if (typeof c.progress === "number") {
    const completedLessons =
      c.completedLessons ??
      Math.round((c.progress / 100) * Math.max(1, totalLessons));
    return { totalLessons, progress: c.progress, completedLessons };
  }

  const progObj = user?.courseProgress?.[c._id] || null;
  const completedLessons = progObj ? (progObj.completed || []).length : 0;
  const progress = progObj
    ? Math.round((completedLessons / Math.max(1, totalLessons)) * 100)
    : 0;
  return { totalLessons, progress, completedLessons };
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ w = "100%", h = 16, radius = 8, style = {} }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: radius,
      background: "linear-gradient(90deg,#1e293b 25%,#263348 50%,#1e293b 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...style,
    }}
  />
);

const CourseCardSkeleton = () => (
  <div
    style={{
      background: "#12192b",
      border: "1px solid #1e293b",
      borderRadius: 20,
      padding: "20px 22px",
    }}
  >
    <div style={{ display: "flex", gap: 16 }}>
      <Skeleton w={60} h={60} radius={16} style={{ flexShrink: 0 }} />
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}
      >
        <Skeleton w="55%" h={16} />
        <Skeleton w="35%" h={12} />
        <Skeleton w="100%" h={6} radius={4} style={{ marginTop: 6 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <Skeleton w={90} h={30} radius={10} />
          <Skeleton w={70} h={30} radius={10} />
        </div>
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function MyCourses() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("all");
  const [ratingCourse, setRatingCourse] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");

  const {
    enrolled: rawEnrolled,
    enrolledLoading,
    error,
  } = useSelector((s) => s.courses);
  const { user } = useSelector((s) => s.auth);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchEnrolledCourses());
    setRefreshing(false);
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchEnrolledCourses());
  }, [dispatch]);

  // Refetch whenever the tab regains focus/visibility — covers the common
  // case where a student finishes a lesson on the course page, then
  // navigates or switches back to My Courses without a full page reload.
  useEffect(() => {
    const onFocus = () => dispatch(fetchEnrolledCourses());
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        dispatch(fetchEnrolledCourses());
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [dispatch]);

  // Normalise + attach derived fields
  const enrolled = (rawEnrolled ?? []).map((c) => {
    const { totalLessons, progress, completedLessons } = computeProgress(
      c,
      user,
    );
    return {
      ...c,
      totalLessons,
      progress,
      completedLessons,
      status: deriveStatus(progress),
    };
  });

  const filtered = enrolled.filter((c) => {
    const matchesTab = activeTab === "all" ? true : c.status === activeTab;
    const matchesSearch = searchQuery.trim() === "" ? true : (
      (c.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.instructor?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    let matchesLanguage = true;
    if (selectedLanguage !== "all") {
      const courseLang = (c.language || "").trim().toLowerCase();
      if (selectedLanguage === "english") {
        matchesLanguage = courseLang === "english";
      } else if (selectedLanguage === "hindi") {
        matchesLanguage = courseLang === "hindi";
      } else if (selectedLanguage === "multilanguage" || selectedLanguage === "language") {
        matchesLanguage = courseLang === "" || courseLang === "multilanguage" || courseLang === "language";
      }
    }
    return matchesTab && matchesSearch && matchesLanguage;
  });

  const counts = {
    total: enrolled.length,
    completed: enrolled.filter((c) => c.status === "completed").length,
    inProgress: enrolled.filter((c) => c.status === "in-progress").length,
  };

  const { t, i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith("hi");

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .course-card {
          animation: fadeUp 0.35s ease both;
          position: relative;
        }
        .course-card:hover {
          border-color: #334155 !important;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px -12px rgba(0,0,0,0.55);
        }
        .continue-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
        .action-btn { transition: transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease; }
        .action-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .tab-btn { transition: color 0.2s ease; }
        .stat-card { transition: transform 0.2s ease, border-color 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); }
        .refresh-btn { transition: transform 0.2s ease, background 0.2s ease; }
        .refresh-btn:hover { background: #1e293b; }
        .refresh-btn:active { transform: scale(0.94); }

        /* Scrollable courses container — dark themed scrollbar */
        .courses-scroll {
          scrollbar-width: thin;
          scrollbar-color: #334155 transparent;
        }
        .courses-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .courses-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .courses-scroll::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 8px;
        }
        .courses-scroll::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 26,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: isHindi ? "normal" : "-0.02em",
              backgroundImage: "linear-gradient(135deg,#f1f5f9,#94a3b8)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: isHindi ? 1.4 : 1.2,
              paddingTop: isHindi ? "4px" : "0px",
              paddingBottom: isHindi ? "4px" : "0px",
            }}
          >
            {t("studentDashboard.myCourses")}
          </h2>
          <p
            style={{
              color: "#64748b",
              fontSize: 13,
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {enrolledLoading
              ? "Loading…"
              : `${counts.total} course${counts.total !== 1 ? "s" : ""} enrolled`}
            <button
              onClick={refresh}
              className="refresh-btn"
              title="Refresh progress"
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                border: "1px solid #334155",
                background: "transparent",
                color: "#94a3b8",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  animation: refreshing ? "spin 0.7s linear infinite" : "none",
                }}
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </p>
        </div>

        {/* Summary chips & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center flex-wrap w-full sm:w-auto">
          <Link
            to="/courses"
            className="action-btn justify-center"
            style={{
              padding: "8px 16px",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "10px",
              color: "#c7d2fe",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
            }}
          >
            {t("studentDashboard.exploreCourses")} <span style={{ fontSize: "14px", marginLeft: "2px" }}>→</span>
          </Link>
          <div className="grid grid-cols-3 sm:flex gap-2.5 sm:gap-3 w-full sm:w-auto">
            {[
              { label: "Enrolled", value: counts.total, color: "#a78bfa" },
              { label: "Completed", value: counts.completed, color: "#4ade80" },
              {
                label: "In Progress",
                value: counts.inProgress,
                color: "#fbbf24",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="stat-card"
                style={{
                  background:
                    "linear-gradient(160deg,#141b2e 0%,#0f1524 100%)",
                  borderRadius: 14,
                  padding: "10px 12px",
                  textAlign: "center",
                  border: "1px solid #1e293b",
                  minWidth: 0,
                }}
              >
                {enrolledLoading ? (
                  <Skeleton w={28} h={20} style={{ margin: "0 auto 4px" }} />
                ) : (
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: s.color,
                      textShadow: `0 0 20px ${s.color}40`,
                    }}
                  >
                    {s.value}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 10,
                    color: "#64748b",
                    marginTop: 2,
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs (One Single Line, No Scrollbar) ── */}
      <div className="w-full mb-5">
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#0f1524] rounded-xl border border-slate-800 w-full">
          {[
            { key: "all", label: "All" },
            { key: "in-progress", label: "In Progress" },
            { key: "completed", label: "Completed" },
            { key: "not-started", label: "Not Started" },
          ].map((tab) => (
            <button
              key={tab.key}
              className="tab-btn px-1 sm:px-3 py-2 sm:py-2 rounded-lg border-0 text-[10.5px] sm:text-xs font-bold cursor-pointer transition-all duration-200 text-center leading-tight truncate"
              onClick={() => setActiveTab(tab.key)}
              style={{
                background:
                  activeTab === tab.key
                    ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                    : "transparent",
                color: activeTab === tab.key ? "#fff" : "#64748b",
                boxShadow:
                  activeTab === tab.key
                    ? "0 4px 14px -2px rgba(124,58,237,0.5)"
                    : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center w-full">
        {/* Search Field */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder={t("courses.searchPlaceholder", "Search your courses...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px 10px 38px",
              background: "#0f1524",
              border: "1px solid #1e293b",
              borderRadius: 12,
              color: "#f1f5f9",
              fontSize: 13.5,
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => e.target.style.borderColor = "#6366f1"}
            onBlur={(e) => e.target.style.borderColor = "#1e293b"}
          />
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#475569",
              fontSize: 15,
            }}
          >
            🔍
          </span>
        </div>

        {/* Language Dropdown */}
        <div className="w-full sm:w-[180px] shrink-0">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "#0f1524",
              border: "1px solid #1e293b",
              borderRadius: 12,
              color: "#c7d2fe",
              fontSize: 13.5,
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23818cf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px",
              paddingRight: 36,
            }}
          >
            <option value="all">{t("courses.allLanguages", "All Languages")}</option>
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="multilanguage">{t("courses.multilanguage", "Language")}</option>
          </select>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && !enrolledLoading && (
        <div
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: 16,
            padding: "14px 18px",
            marginBottom: 16,
            color: "#f87171",
            fontSize: 13,
          }}
        >
          ⚠️ {error} —{" "}
          <button
            onClick={refresh}
            style={{
              background: "none",
              border: "none",
              color: "#fb923c",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Course list — darker container, scrollable when it overflows ── */}
      <div
        className="courses-scroll"
        style={{
          background:
            "radial-gradient(ellipse at top,#0b101c 0%,#05070d 100%)",
          border: "1px solid #1e293b",
          borderRadius: 22,
          padding: 18,
          maxHeight: 640,
          overflowY: "auto",
          boxShadow: "inset 0 2px 20px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {enrolledLoading ? (
            // Skeleton placeholders
            [...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            // Empty state
            <div
              style={{ textAlign: "center", padding: "48px 0", color: "#475569" }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>
                {activeTab === "all"
                  ? "You haven't enrolled in any courses yet."
                  : `No ${activeTab.replace("-", " ")} courses.`}
              </p>
              {activeTab !== "all" && (
                <button
                  onClick={() => setActiveTab("all")}
                  style={{
                    marginTop: 12,
                    background: "none",
                    border: "none",
                    color: "#818cf8",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  View all courses →
                </button>
              )}
            </div>
          ) : (
            filtered.map((course, i) => (
              <CourseCard
                key={course._id ?? course.id ?? i}
                course={course}
                animDelay={i * 0.04}
                onRate={() => setRatingCourse(course)}
              />
            ))
          )}
        </div>
      </div>

      {ratingCourse && (
        <RatingDialog
          course={ratingCourse}
          user={user}
          onClose={() => setRatingCourse(null)}
          onSubmitted={() => {
            setRatingCourse(null);
            dispatch(fetchEnrolledCourses());
          }}
        />
      )}
    </>
  );
}

function RatingDialog({ course, user, onClose, onSubmitted }) {
  const userId = user?._id ?? user?.id;
  // course.userRating is set by the enrolled courses API (this student's rating).
  // Fall back to searching course.ratings for other contexts.
  const existingRating =
    course?.userRating ??
    course?.ratings?.find(
      (r) => getRatingUserId(r)?.toString() === userId?.toString(),
    );
  const [selected, setSelected] = useState(existingRating?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState(existingRating?.review ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      onSubmitted?.();
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
        background: "rgba(2,8,23,0.75)",
        backdropFilter: "blur(4px)",
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
          width: "100%",
          maxWidth: 420,
          background: "linear-gradient(160deg,#101728,#0a0f1c)",
          border: "1px solid #1e293b",
          borderRadius: 20,
          boxShadow: "0 30px 70px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #1e293b",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>
              {existingRating ? "Update your rating" : "Rate this course"}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "#64748b",
                marginTop: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {course.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              border: "none",
              background: "#1e293b",
              color: "#94a3b8",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            X
          </button>
        </div>

        <div style={{ padding: "22px 20px 20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setSelected(star)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: star <= active ? "#fbbf24" : "#334155",
                  cursor: "pointer",
                  fontSize: 34,
                  lineHeight: 1,
                  padding: "2px 0",
                  transition: "transform 0.1s ease",
                  transform: star <= active ? "scale(1.08)" : "scale(1)",
                }}
                aria-label={`Rate ${star} stars`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share a short review (optional)"
            rows={3}
            maxLength={500}
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              background: "#0d1424",
              border: "1px solid #1e293b",
              borderRadius: 12,
              color: "#e2e8f0",
              padding: "10px 12px",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
          />

          {error && (
            <p style={{ color: "#f87171", fontSize: 12, marginTop: 10 }}>
              {error}
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 16,
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "9px 16px",
                borderRadius: 11,
                border: "1px solid #334155",
                background: "transparent",
                color: "#94a3b8",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: "9px 18px",
                borderRadius: 11,
                border: "none",
                background: loading
                  ? "#334155"
                  : "linear-gradient(135deg,#10b981,#059669)",
                color: loading ? "#94a3b8" : "#fff",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading
                  ? "none"
                  : "0 6px 18px -4px rgba(16,185,129,0.5)",
              }}
            >
              {loading ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CourseCard ────────────────────────────────────────────────────────────────
function CourseCard({ course, animDelay = 0, onRate }) {
  const st = statusConfig[course.status] ?? statusConfig["not-started"];
  const accent = categoryAccent(course.category);
  const emoji = categoryEmoji(course.category);
  const isComplete = course.status === "completed";
  const hasFinalQuiz = (course.quiz?.questions?.length ?? 0) > 0;

  // Instructor name: may be a populated object or a plain string
  const instructorName =
    course.instructor?.name ??
    course.instructor?.email?.split("@")[0] ??
    (typeof course.instructor === "string" ? course.instructor : "Instructor");

  const instructorId =
    course.instructor?._id ??
    (typeof course.instructor === "string" ? course.instructor : null);

  return (
    <div
      className="course-card relative rounded-2xl p-4 sm:p-5 border border-slate-800 transition-all duration-200"
      style={{
        background: "linear-gradient(160deg,#131b2e 0%,#0e1424 100%)",
        animationDelay: `${animDelay}s`,
      }}
    >
      <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-start">
        {/* Thumbnail Header on Mobile, Side-by-Side Icon on Desktop */}
        <div
          className="w-full sm:w-[60px] h-36 sm:h-[60px] rounded-xl sm:rounded-2xl shrink-0 border flex items-center justify-center overflow-hidden relative shadow-md"
          style={{
            background: `linear-gradient(160deg,${accent}2a,${accent}10)`,
            borderColor: `${accent}30`,
          }}
        >
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
            />
          ) : (
            <span className="text-3xl sm:text-2xl">{emoji}</span>
          )}

          {/* Status Badge Over Image Header (Mobile Only) */}
          <span
            className="sm:hidden absolute top-3 right-3 text-[10.5px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1.5"
            style={{
              background: st.bg,
              color: st.text,
              border: `1px solid ${st.text}40`,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: st.dot,
              }}
            />
            {st.label}
          </span>
        </div>

        {/* Body */}
        <div className="w-full sm:flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-[16px] font-bold text-slate-100 leading-snug line-clamp-2 sm:line-clamp-none">
                {course.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {instructorId ? (
                  <Link
                    to={`/instructors/${instructorId}`}
                    className="text-slate-300 hover:text-indigo-400 font-semibold transition-colors"
                  >
                    {instructorName}
                  </Link>
                ) : (
                  instructorName
                )}
                {course.level && (
                  <span className="ml-2 font-semibold" style={{ color: accent }}>
                    · {course.level}
                  </span>
                )}
              </p>
            </div>

            {/* Status Badge (Desktop Only) */}
            <span
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full shrink-0"
              style={{
                background: st.bg,
                color: st.text,
                border: `1px solid ${st.text}30`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: st.dot,
                }}
              />
              {st.label}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 sm:mt-3.5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-slate-400">
                {course.completedLessons}/{course.totalLessons} lesson
                {course.totalLessons !== 1 ? "s" : ""}
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: isComplete ? "#4ade80" : accent }}
              >
                {course.progress}%
              </span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${course.progress}%`,
                  background: isComplete
                    ? "linear-gradient(90deg,#10b981,#4ade80)"
                    : `linear-gradient(90deg,${accent},${accent}cc)`,
                  boxShadow: `0 0 10px ${isComplete ? "#4ade80" : accent}60`,
                }}
              />
            </div>
          </div>

          {/* Footer Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3.5 pt-1">
            <div>
              {course.lastWatched && (
                <p className="text-[11px] text-slate-500">
                  Last: <span className="text-slate-400">{course.lastWatched}</span>
                </p>
              )}
              {course.nextLesson && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Next: <span style={{ color: accent }}>{course.nextLesson}</span>
                </p>
              )}
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {course.category && (
                  <span
                    className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                    style={{
                      background: `${accent}18`,
                      color: accent,
                      border: `1px solid ${accent}30`,
                    }}
                  >
                    {course.category}
                  </span>
                )}
                {course.language && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {course.language}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full sm:w-auto flex items-center gap-2">
              {!isComplete && (
                <Link to={`/courses/${course._id}`} className="w-full sm:w-auto">
                  <button
                    className="continue-btn action-btn w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl border-0 text-white font-bold text-xs cursor-pointer shadow-md"
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                    }}
                  >
                    Continue →
                  </button>
                </Link>
              )}
              {isComplete && (
                <>
                  {course.userRating ? (
                    <button
                      onClick={onRate}
                      title="Update your rating"
                      className="action-btn w-full sm:w-auto px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {"★".repeat(course.userRating.rating)}
                      {"☆".repeat(5 - course.userRating.rating)} Rated
                    </button>
                  ) : (
                    <button
                      onClick={onRate}
                      className="action-btn w-full sm:w-auto px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold cursor-pointer"
                    >
                      Rate This Course 🌟
                    </button>
                  )}
                  {hasFinalQuiz && (
                    <Link to={`/courses/${course._id}?quiz=1`}>
                      <button
                        className="action-btn"
                        style={{
                          padding: "8px 18px",
                          borderRadius: 11,
                          border: "1px solid rgba(167,139,250,0.25)",
                          background: "rgba(167,139,250,0.08)",
                          color: "#a78bfa",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Final Quiz
                      </button>
                    </Link>
                  )}
                  <Link to={`/courses/${course._id}?replay=true`}>
                    <button
                      className="action-btn"
                      style={{
                        padding: "8px 18px",
                        borderRadius: 11,
                        border: "1px solid rgba(74,222,128,0.25)",
                        background: "rgba(74,222,128,0.08)",
                        color: "#4ade80",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Replay Course 🔁
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}