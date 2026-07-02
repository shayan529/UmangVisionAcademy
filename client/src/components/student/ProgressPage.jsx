// pages/student/ProgressPage.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEnrolledCourses } from "../../redux/slices/courseSlice";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ProgressPage = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector((s) => s.auth.user);
  const { enrolled, enrolledLoading } = useSelector((s) => s.courses);

  useEffect(() => {
    dispatch(fetchEnrolledCourses());
  }, [dispatch]);

  const totalEnrolled = enrolled.length;
  const completedCourses = enrolled.filter((c) => {
    if (c.progress === 100) return true;
    if (c.completedLessons && c.totalLessons)
      return c.completedLessons >= c.totalLessons;
    if (c.status === "completed") return true;
    return false;
  }).length;

  const inProgress = enrolled.filter((c) => {
    const isComplete =
      c.progress === 100 ||
      c.status === "completed" ||
      (c.completedLessons &&
        c.totalLessons &&
        c.completedLessons >= c.totalLessons);
    const hasStarted = c.progress > 0 || c.completedLessons > 0;
    return hasStarted && !isComplete;
  }).length;

  const notStarted = enrolled.filter((c) => {
    const hasStarted =
      c.progress > 0 || c.completedLessons > 0 || c.status === "completed";
    return !hasStarted;
  }).length;
  const quizzesTaken = user?.quizSubmissions?.length ?? 0;
  const totalScore = user?.score ?? 0;
  const certificates = completedCourses;

  const overallProgress =
    totalEnrolled > 0
      ? Math.round(
          enrolled.reduce((sum, c) => {
            if (c.progress) return sum + c.progress;
            if (c.completedLessons && c.totalLessons) {
              return (
                sum + Math.round((c.completedLessons / c.totalLessons) * 100)
              );
            }
            return sum;
          }, 0) / totalEnrolled,
        )
      : 0;

  const summaryCards = [
    {
      label: t("studentProgress.enrolledCourses"),
      value: totalEnrolled,
      color: "#22d3ee",
      icon: "📚",
      bg: "rgba(34,211,238,0.08)",
      border: "#164e63",
    },
    {
      label: t("studentProgress.completed"),
      value: completedCourses,
      color: "#4ade80",
      icon: "✅",
      bg: "rgba(74,222,128,0.08)",
      border: "#14532d",
    },
    {
      label: t("studentProgress.inProgress"),
      value: inProgress,
      color: "#a78bfa",
      icon: "▶️",
      bg: "rgba(167,139,250,0.08)",
      border: "#3b1f6e",
    },
    {
      label: t("studentProgress.notStarted"),
      value: notStarted,
      color: "#94a3b8",
      icon: "⏸️",
      bg: "rgba(148,163,184,0.08)",
      border: "#1e293b",
    },
    {
      label: t("studentProgress.certificates"),
      value: certificates,
      color: "#facc15",
      icon: "🏅",
      bg: "rgba(250,204,21,0.08)",
      border: "#713f12",
    },
    {
      label: t("studentProgress.quizzesTaken"),
      value: quizzesTaken,
      color: "#f472b6",
      icon: "📝",
      bg: "rgba(244,114,182,0.08)",
      border: "#831843",
    },
    {
      label: t("studentProgress.totalPoints"),
      value: totalScore,
      color: "#fb923c",
      icon: "⭐",
      bg: "rgba(251,146,60,0.08)",
      border: "#7c2d12",
    },
  ];

  if (enrolledLoading) {
    return (
      <div style={{ padding: 40, color: "#94a3b8", fontSize: 14 }}>
        {t("studentProgress.loading")}
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", width: "100%" }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{ fontSize: 26, fontWeight: 800, color: "#f8fafc", margin: 0 }}
        >
          📈 {t("studentProgress.title")}
        </h1>
        <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
          {t("studentProgress.subtitle")}
        </p>
      </div>

      {/* Overall progress ring + bar */}
      <div
        style={{
          background: "#111827",
          border: "1px solid #1e293b",
          borderRadius: 18,
          padding: "24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        {/* Ring */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: `conic-gradient(#7c3aed ${overallProgress * 3.6}deg, #1e293b 0deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "#111827",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#a78bfa",
                  lineHeight: 1,
                }}
              >
                {overallProgress}%
              </span>
              <span style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>
                {t("studentProgress.overall")}
              </span>
            </div>
          </div>
        </div>

        {/* Bar + label */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>
              {t("studentProgress.overallCourseProgress")}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa" }}>
              {overallProgress}%
            </span>
          </div>
          <div
            style={{
              height: 10,
              background: "#1e293b",
              borderRadius: 99,
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${overallProgress}%`,
                background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                borderRadius: 99,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            {t("studentProgress.completedOutOf", {
              completed: completedCourses,
              total: totalEnrolled,
            })}
          </p>
        </div>
      </div>

      {/* Summary cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {summaryCards.map(({ label, value, color, icon, bg, border }) => (
          <div
            key={label}
            style={{
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: "18px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ fontSize: 26 }}>{icon}</span>
            <div>
              <div
                style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}
              >
                {value}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-course breakdown */}
      <div
        style={{
          background: "#111827",
          border: "1px solid #1e293b",
          borderRadius: 18,
          padding: "24px",
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#f8fafc",
            margin: "0 0 18px",
          }}
        >
          {t("studentProgress.courseBreakdown")}
        </h2>

        {enrolled.length === 0 ? (
          <div style={{ color: "#475569", fontSize: 14 }}>
            {t("studentProgress.noCoursesYet")}{" "}
            <NavLink
              to="/student-dashboard/my-courses"
              style={{ color: "#a78bfa" }}
            >
              {t("studentProgress.browseCourses")}
            </NavLink>
          </div>
        ) : (
          enrolled.map((course) => {
            const derivedProgress = (() => {
              if (course.progress) return course.progress;
              if (course.completedLessons && course.totalLessons) {
                return Math.round(
                  (course.completedLessons / course.totalLessons) * 100,
                );
              }
              if (course.status === "completed") return 100;
              return 0;
            })();
            const prog = derivedProgress;

            const statusColor =
              prog === 100 ? "#4ade80" : prog > 0 ? "#a78bfa" : "#64748b";
            const statusLabel =
              prog === 100
                ? t("studentProgress.completed")
                : prog > 0
                  ? t("studentProgress.inProgress")
                  : t("studentProgress.notStarted");

            return (
              <div
                key={course._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 0",
                  borderBottom: "1px solid #1e293b",
                }}
              >
                {/* Thumbnail or fallback */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "📚"
                  )}
                </div>

                {/* Title + bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#f8fafc",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "70%",
                      }}
                    >
                      {course.title ?? t("studentProgress.untitledCourse")}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: statusColor,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 5,
                      background: "#1e293b",
                      borderRadius: 99,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${prog}%`,
                        background:
                          prog === 100
                            ? "#4ade80"
                            : "linear-gradient(90deg, #7c3aed, #a78bfa)",
                        borderRadius: 99,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: "#475569" }}>
                    {course.completedLessons ?? 0} lessons completed · {prog}%
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
