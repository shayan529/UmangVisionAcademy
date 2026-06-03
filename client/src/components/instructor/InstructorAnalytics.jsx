import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCourses } from "../../redux/slices/courseSlice"; // adjust path
import { StatCard, Card, SectionHeader, ProgressBar } from "./InstructorUi";

const InstructorAnalytics = () => {
  const dispatch = useDispatch();
  const { courses, loading } = useSelector((s) => s.courses);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  // ── Derived stats ────────────────────────────────────────────────────────
  const avg = (key) =>
    courses.length
      ? Math.round(
          courses.reduce((sum, c) => sum + (c[key] ?? 0), 0) / courses.length,
        )
      : 0;

  const avgCompletion = avg("avgCompletion") || avg("prog");
  const avgQuizPass = avg("quizPassRate");
  const avgAttendance = avg("liveAttendance");
  const avgRating = courses.length
    ? (
        courses.reduce((sum, c) => sum + (c.rating ?? 0), 0) / courses.length
      ).toFixed(1)
    : "—";

  // Last 7 days enrollment — use real data if available, else zeros
  const enrollmentTrend = courses.length
    ? courses.slice(-7).map((c) => c.enrolledCount ?? c.students ?? 0)
    : [0, 0, 0, 0, 0, 0, 0];

  const trendMax = Math.max(...enrollmentTrend, 1);

  // Top performing course by completion
  const topCourse = [...courses].sort(
    (a, b) =>
      (b.avgCompletion ?? b.prog ?? 0) - (a.avgCompletion ?? a.prog ?? 0),
  )[0];

  const metrics = [
    { label: "Course completion", val: avgCompletion, color: "#7c3aed" },
    { label: "Quiz performance", val: avgQuizPass, color: "#10b981" },
    {
      label: "Video completion",
      val: avg("videoCompletion"),
      color: "#f59e0b",
    },
    { label: "Community posts", val: avg("communityPosts"), color: "#ef4444" },
    { label: "Live attendance", val: avgAttendance, color: "#db2777" },
  ];

  return (
    <>
      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="Avg Completion"
          value={loading ? "…" : `${avgCompletion}%`}
          color="#a78bfa"
        />
        <StatCard
          label="Quiz Pass Rate"
          value={loading ? "…" : `${avgQuizPass}%`}
          color="#34d399"
        />
        <StatCard
          label="Live Attendance"
          value={loading ? "…" : `${avgAttendance}%`}
          color="#fbbf24"
        />
        <StatCard
          label="Review Score"
          value={loading ? "…" : `${avgRating} ★`}
          color="#4ade80"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Engagement metrics */}
        <Card>
          <SectionHeader title="Engagement Metrics" />
          {loading ? (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Loading…
            </div>
          ) : (
            metrics.map((m) => (
              <div
                key={m.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    width: 130,
                    flexShrink: 0,
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: "#1e293b",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${m.val}%`,
                      background: m.color,
                      borderRadius: 3,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: m.color,
                    width: 36,
                    textAlign: "right",
                  }}
                >
                  {m.val}%
                </div>
              </div>
            ))
          )}
        </Card>

        {/* Enrollment trend */}
        <Card>
          <SectionHeader title="Enrollment Trend (last 7 courses)" />
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
              height: 80,
              marginBottom: 16,
            }}
          >
            {enrollmentTrend.map((v, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${(v / trendMax) * 100}%`,
                  minHeight: 4,
                  background: "linear-gradient(to top,#7c3aed,#a78bfa)",
                  borderRadius: "3px 3px 0 0",
                  transition: "height 0.4s",
                }}
              />
            ))}
          </div>

          {topCourse ? (
            <div
              style={{ background: "#1e293b", borderRadius: 12, padding: 14 }}
            >
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                Top performing course
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                {topCourse.title}
              </div>
              <div
                style={{ fontSize: 12, color: "#64748b", margin: "3px 0 8px" }}
              >
                {topCourse.avgCompletion ?? topCourse.prog ?? 0}% completion ·{" "}
                {topCourse.rating
                  ? `${topCourse.rating}★ rating`
                  : "No rating yet"}
              </div>
              <ProgressBar
                value={topCourse.avgCompletion ?? topCourse.prog ?? 0}
                color="#10b981"
              />
            </div>
          ) : (
            !loading && (
              <div
                style={{
                  padding: "12px 0",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                No course data yet.
              </div>
            )
          )}
        </Card>
      </div>
    </>
  );
};

export default InstructorAnalytics;
