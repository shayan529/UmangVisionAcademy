import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEnrolledCourses } from "../../redux/slices/courseSlice";
import { Link } from "react-router-dom";

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

// Add this helper above the component
const getLocalProgress = (courseId, totalLessons) => {
  if (!courseId || !totalLessons) return { progress: 0, completedLessons: 0 };
  try {
    const saved = JSON.parse(
      localStorage.getItem(`course-progress-${courseId}`) || "null",
    );
    if (!saved) return { progress: 0, completedLessons: 0 };
    const completedLessons = (saved.completed ?? []).length;
    const progress = Math.round((completedLessons / totalLessons) * 100);
    return { progress, completedLessons };
  } catch {
    return { progress: 0, completedLessons: 0 };
  }
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

  const {
    enrolled: rawEnrolled,
    enrolledLoading,
    error,
  } = useSelector((s) => s.courses);

  useEffect(() => {
    dispatch(fetchEnrolledCourses());
  }, [dispatch]);

  // Normalise + attach derived fields
  const enrolled = (rawEnrolled ?? []).map((c) => {
    const totalLessons = c.lessons?.length ?? c.totalLessons ?? 0;
    const { progress, completedLessons } = getLocalProgress(
      c._id,
      totalLessons,
    );
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
            My Courses
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
            />
          ))
        )}
      </div>
    </>
  );
}

// ── CourseCard ────────────────────────────────────────────────────────────────
function CourseCard({ course, animDelay = 0 }) {
  const st = statusConfig[course.status] ?? statusConfig["not-started"];
  const accent = categoryAccent(course.category);
  const emoji = categoryEmoji(course.category);
  const isComplete = course.status === "completed";

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
                  {/* <button
                    style={{
                      padding: '7px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#052e16',
                      color: '#4ade80',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    View Certificate 🏅
                  </button> */}
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
