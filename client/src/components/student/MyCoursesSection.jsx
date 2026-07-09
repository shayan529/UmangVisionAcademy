import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEnrolledCourses } from "../../redux/slices/courseSlice";
import { Link } from "react-router-dom";
import api from "../../config/api.js";
import { useTranslation } from "react-i18next";

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig = {
  "in-progress": { bg: "#1c1003", text: "#fbbf24", label: "In Progress" },
  completed: { bg: "#052e16", text: "#4ade80", label: "Completed" },
  "not-started": { bg: "#0f172a", text: "#94a3b8", label: "Not Started" },
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

// Progress is derived from server-side `user.courseProgress` on the client.

const getRatingUserId = (rating) =>
  rating?.user?._id ?? rating?.user?.id ?? rating?.user;

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
      background: "#111827",
      border: "1px solid #1e293b",
      borderRadius: 18,
      padding: "20px 22px",
    }}
  >
    <div style={{ display: "flex", gap: 16 }}>
      <Skeleton w={56} h={56} radius={14} style={{ flexShrink: 0 }} />
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

  const {
    enrolled: rawEnrolled,
    enrolledLoading,
    error,
  } = useSelector((s) => s.courses);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchEnrolledCourses());
  }, [dispatch]);

  // Normalise + attach derived fields
  const enrolled = (rawEnrolled ?? []).map((c) => {
    const totalLessons = c.lessons?.length ?? c.totalLessons ?? 0;
    const progObj = user?.courseProgress?.[c._id] || null;
    const completedLessons = progObj ? (progObj.completed || []).length : 0;
    const progress = progObj
      ? Math.round((completedLessons / Math.max(1, totalLessons)) * 100)
      : 0;
    return {
      ...c,
      totalLessons,
      progress,
      completedLessons,
      status: deriveStatus(progress),
    };
  });

  const filtered = enrolled.filter((c) =>
    activeTab === "all" ? true : c.status === activeTab,
  );

  const counts = {
    total: enrolled.length,
    completed: enrolled.filter((c) => c.status === "completed").length,
    inProgress: enrolled.filter((c) => c.status === "in-progress").length,
  };

  const { t } = useTranslation();

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
        .course-card { animation: fadeUp 0.3s ease both; }
        .course-card:hover { border-color: #334155 !important; }
        .continue-btn:hover { opacity: 0.88; }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>
            {t("studentDashboard.myCourses")}
          </h2>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            {enrolledLoading
              ? "Loading…"
              : `${counts.total} course${counts.total !== 1 ? "s" : ""} enrolled`}
          </p>
        </div>

        {/* Summary chips */}
        <div style={{ display: "flex", gap: 10 }}>
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
              style={{
                background: "#1e293b",
                borderRadius: 10,
                padding: "6px 14px",
                textAlign: "center",
                border: "1px solid #334155",
                minWidth: 60,
              }}
            >
              {enrolledLoading ? (
                <Skeleton w={28} h={18} style={{ margin: "0 auto 4px" }} />
              ) : (
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>
                  {s.value}
                </div>
              )}
              <div style={{ fontSize: 10, color: "#64748b" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#1e293b",
          padding: 4,
          borderRadius: 10,
          marginBottom: 20,
          width: "fit-content",
        }}
      >
        {[
          { key: "all", label: "All" },
          { key: "in-progress", label: "In Progress" },
          { key: "completed", label: "Completed" },
          { key: "not-started", label: "Not Started" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === tab.key ? "#7c3aed" : "transparent",
              color: activeTab === tab.key ? "#fff" : "#64748b",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Error state ── */}
      {error && !enrolledLoading && (
        <div
          style={{
            background: "#2d0a0a",
            border: "1px solid #7f1d1d",
            borderRadius: 14,
            padding: "14px 18px",
            marginBottom: 16,
            color: "#f87171",
            fontSize: 13,
          }}
        >
          ⚠️ {error} —{" "}
          <button
            onClick={() => dispatch(fetchEnrolledCourses())}
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

      {/* ── Course list ── */}
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
        background: "rgba(2,8,23,0.72)",
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
          background: "#0d1526",
          border: "1px solid #1e293b",
          borderRadius: 18,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
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
              borderRadius: 8,
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
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 10,
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
                borderRadius: 10,
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
                borderRadius: 10,
                border: "none",
                background: loading ? "#334155" : "#052e16",
                color: "#4ade80",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
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

  return (
    <div
      className="course-card"
      style={{
        background: "#111827",
        border: "1px solid #1e293b",
        borderRadius: 18,
        padding: "20px 22px",
        animationDelay: `${animDelay}s`,
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Thumbnail */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            flexShrink: 0,
            background: `${accent}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
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
                borderRadius: 14,
              }}
            />
          ) : (
            <span style={{ fontSize: 26 }}>{emoji}</span>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#f1f5f9",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "36ch",
                }}
              >
                {course.title}
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {instructorName}
                {course.level && (
                  <span
                    style={{ marginLeft: 8, color: accent, fontWeight: 600 }}
                  >
                    · {course.level}
                  </span>
                )}
              </p>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 20,
                background: st.bg,
                color: st.text,
                flexShrink: 0,
              }}
            >
              {st.label}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                {course.completedLessons}/{course.totalLessons} lesson
                {course.totalLessons !== 1 ? "s" : ""}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isComplete ? "#4ade80" : accent,
                }}
              >
                {course.progress}%
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
                  width: `${course.progress}%`,
                  background: isComplete
                    ? "linear-gradient(90deg,#10b981,#4ade80)"
                    : `linear-gradient(90deg,${accent},${accent}88)`,
                  borderRadius: 3,
                  transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                }}
              />
            </div>
          </div>

          {/* Last / Next lesson */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              {course.lastWatched && (
                <p style={{ fontSize: 11, color: "#64748b" }}>
                  Last:{" "}
                  <span style={{ color: "#94a3b8" }}>{course.lastWatched}</span>
                </p>
              )}
              {course.nextLesson && (
                <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  Next:{" "}
                  <span style={{ color: accent }}>{course.nextLesson}</span>
                </p>
              )}
              {/* Show category tag */}
              {course.category && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: `${accent}18`,
                    color: accent,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {course.category}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              {!isComplete && (
                <Link to={`/courses/${course._id}`}>
                  <button
                    className="continue-btn"
                    style={{
                      padding: "7px 16px",
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                  >
                    Continue →
                  </button>
                </Link>
              )}
              {isComplete && (
                <>
                  {course.userRating ? (
                    // Already rated — show stars and allow update
                    <button
                      onClick={onRate}
                      title="Update your rating"
                      style={{
                        padding: "7px 14px",
                        borderRadius: 10,
                        border: "1px solid #854d0e",
                        background: "#1c1005",
                        color: "#fbbf24",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {"★".repeat(course.userRating.rating)}
                      {"☆".repeat(5 - course.userRating.rating)} Rated
                    </button>
                  ) : (
                    <button
                      onClick={onRate}
                      style={{
                        padding: "7px 16px",
                        borderRadius: 10,
                        border: "none",
                        background: "#052e16",
                        color: "#4ade80",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Rate This Course 🌟
                    </button>
                  )}
                  {hasFinalQuiz && (
                    <Link to={`/courses/${course._id}?quiz=1`}>
                      <button
                        style={{
                          padding: "7px 16px",
                          borderRadius: 10,
                          border: "none",
                          background: "#1e1b4b",
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
                  <Link to={`/courses/${course._id}`}>
                    <button
                      style={{
                        padding: "7px 16px",
                        borderRadius: 10,
                        border: "none",
                        background: "#052e16",
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
