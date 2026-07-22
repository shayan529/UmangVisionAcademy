import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchCourses } from "../../redux/slices/courseSlice";
import { StatCard, Card, SectionHeader, ProgressBar } from "./InstructorUi";

// ─── helpers ──────────────────────────────────────────────────────────────────

const avg = (arr, key) =>
  arr.length
    ? Math.round(arr.reduce((s, c) => s + (c[key] ?? 0), 0) / arr.length)
    : 0;

const studentCount = (c) => c.enrolledCount ?? c.students ?? 0;
const completion = (c) => c.avgCompletion ?? c.prog ?? 0;
const courseRating = (c) => c.ratingAverage ?? c.rating ?? 0;
const quizPassRate = (c) => c.quizPassRate ?? c.quizPassPercentage ?? null;

// ─── sub-components ───────────────────────────────────────────────────────────

const styles = {
  // stat grid
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    background: "#1e293b",
    borderRadius: 10,
    padding: "14px 16px",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 6,
    display: "flex",
    alignItems: "center",
    gap: 5,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#f1f5f9",
  },
  statSub: {
    fontSize: 12,
    color: "#475569",
    marginTop: 3,
  },
  // two-column grid
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 14,
    marginBottom: 14,
  },
  // enrollment bars
  barWrap: {
    display: "flex",
    alignItems: "flex-end",
    gap: 5,
    height: 90,
    marginBottom: 14,
  },
  // top-course highlight
  topCourseBox: {
    background: "#0f172a",
    borderRadius: 10,
    padding: "12px 14px",
  },
  // performance table
  tableOuter: {
    overflowX: "auto",
    maxHeight: 380,
    overflowY: "auto",
    borderRadius: 10,
    border: "1px solid #1e293b",
  },
  table: {
    width: "100%",
    minWidth: 560,
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    position: "sticky",
    top: 0,
    background: "#0f172a",
    zIndex: 2,
    textAlign: "left",
    color: "#64748b",
    fontWeight: 600,
    padding: "10px 14px",
    borderBottom: "1px solid #1e293b",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  thRight: {
    position: "sticky",
    top: 0,
    background: "#0f172a",
    zIndex: 2,
    textAlign: "right",
    color: "#64748b",
    fontWeight: 600,
    padding: "10px 14px",
    borderBottom: "1px solid #1e293b",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #1e293b",
    color: "#e2e8f0",
    verticalAlign: "middle",
  },
  tdRight: {
    padding: "12px 14px",
    borderBottom: "1px solid #1e293b",
    color: "#cbd5e1",
    textAlign: "right",
    verticalAlign: "middle",
  },
  // status badge
  badgeHigh: {
    display: "inline-block",
    fontSize: 11,
    padding: "2px 9px",
    borderRadius: 20,
    fontWeight: 600,
    background: "#064e3b",
    color: "#34d399",
  },
  badgeMid: {
    display: "inline-block",
    fontSize: 11,
    padding: "2px 9px",
    borderRadius: 20,
    fontWeight: 600,
    background: "#451a03",
    color: "#fbbf24",
  },
  badgeLow: {
    display: "inline-block",
    fontSize: 11,
    padding: "2px 9px",
    borderRadius: 20,
    fontWeight: 600,
    background: "#450a0a",
    color: "#f87171",
  },
  empty: {
    textAlign: "center",
    color: "#475569",
    padding: "32px 0",
    fontSize: 14,
  },
  sectionFull: {
    marginTop: 14,
  },
};

function StatusBadge({ value, t }) {
  if (value >= 70)
    return (
      <span style={styles.badgeHigh}>{t("instructorAnalytics.onTrack")}</span>
    );
  if (value >= 45)
    return (
      <span style={styles.badgeMid}>{t("instructorAnalytics.average")}</span>
    );
  return (
    <span style={styles.badgeLow}>
      {t("instructorAnalytics.needsAttention")}
    </span>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

const InstructorAnalytics = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { courses, loading } = useSelector((s) => s.courses);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  // ── aggregates ──────────────────────────────────────────────────────────────
  const totalStudents = courses.reduce((s, c) => s + studentCount(c), 0);

  const avgRating =
    courses.length > 0
      ? (
        courses.reduce((s, c) => s + courseRating(c), 0) / courses.length
      ).toFixed(1)
      : "–";

  const avgCompletion = avg(courses, "avgCompletion") || avg(courses, "prog");
  const quizPassRates = courses
    .map(quizPassRate)
    .filter((rate) => rate != null);
  const avgQuizPass = quizPassRates.length
    ? Math.round(
      quizPassRates.reduce((sum, rate) => sum + rate, 0) /
      quizPassRates.length,
    )
    : 0;
  const avgAttendance = avg(courses, "liveAttendance");

  // ── enrollment trend (last 7 courses by array order) ────────────────────────
  const enrollmentTrend = courses.length
    ? courses.slice(-7).map(studentCount)
    : Array(7).fill(0);
  const trendMax = Math.max(...enrollmentTrend, 1);

  // ── top course by completion ─────────────────────────────────────────────────
  const topCourse =
    courses.length > 0
      ? [...courses].sort((a, b) => completion(b) - completion(a))[0]
      : null;

  // ── table rows sorted by students desc ────────────────────────────────────────
  const sortedCourses = [...courses].sort(
    (a, b) => studentCount(b) - studentCount(a),
  );

  // ── loading skeleton ─────────────────────────────────────────────────────────
  const dash = loading ? "…" : null;

  return (
    <>
      {/* ── stat strip ────────────────────────────────────────────────────── */}
      <div style={styles.statGrid}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>
            👥 {t("instructorAnalytics.students")}
          </div>
          <div style={styles.statValue}>
            {dash ?? totalStudents.toLocaleString("en-IN")}
          </div>
          <div style={styles.statSub}>
            {t("instructorAnalytics.totalEnrolled")}
          </div>
        </div>

        <div style={styles.statBox}>
          <div style={styles.statLabel}>
            ⭐ {t("instructorAnalytics.avgRating")}
          </div>
          <div style={styles.statValue}>{dash ?? `${avgRating} ★`}</div>
          <div style={styles.statSub}>{t("instructorAnalytics.outOfFive")}</div>
        </div>

        <div style={styles.statBox}>
          <div style={styles.statLabel}>
            📈 {t("instructorAnalytics.avgCompletion")}
          </div>
          <div style={styles.statValue}>{dash ?? `${avgCompletion}%`}</div>
          <div style={styles.statSub}>
            {t("instructorAnalytics.quizPass")}: {dash ?? `${avgQuizPass}%`}
          </div>
        </div>

        <div style={styles.statBox}>
          <div style={styles.statLabel}>
            🎙 {t("instructorAnalytics.liveAttendance")}
          </div>
          <div style={styles.statValue}>{dash ?? `${avgAttendance}%`}</div>
          <div style={styles.statSub}>
            {t("instructorAnalytics.avgAcrossSessions")}
          </div>
        </div>
      </div>

      {/* ── enrollment trend ───────────────────────────── */}
      <div style={styles.grid2}>
        {/* Enrollment trend */}
        <Card>
          <SectionHeader title={t("instructorAnalytics.enrollmentTrend")} />

          <div style={styles.barWrap}>
            {enrollmentTrend.map((v, i) => (
              <div
                key={i}
                title={`${v} students`}
                style={{
                  flex: 1,
                  height: `${Math.max(4, Math.round((v / trendMax) * 100))}%`,
                  background: "linear-gradient(to top,#7c3aed,#a78bfa)",
                  borderRadius: "3px 3px 0 0",
                  transition: "opacity 0.15s",
                  cursor: "default",
                }}
              />
            ))}
          </div>

          {topCourse ? (
            <div style={styles.topCourseBox}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>
                {t("instructorAnalytics.topPerformingCourse")}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                {topCourse.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  margin: "3px 0 8px",
                }}
              >
                {completion(topCourse)}% completion ·{" "}
                {courseRating(topCourse) > 0
                  ? `${courseRating(topCourse)}★`
                  : t("instructorAnalytics.noRatingYet")}
              </div>
              <ProgressBar value={completion(topCourse)} color="#10b981" />
            </div>
          ) : (
            !loading && (
              <div style={styles.empty}>
                {t("instructorAnalytics.noCourseData")}
              </div>
            )
          )}
        </Card>
      </div>

      {/* ── course performance table ──────────────────────────────────────── */}
      <Card style={styles.sectionFull}>
        <SectionHeader title={t("instructorAnalytics.coursePerformance")} />

        {sortedCourses.length > 0 ? (
          <div style={styles.tableOuter}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t("instructorAnalytics.course")}</th>
                  <th style={styles.thRight}>
                    {t("instructorAnalytics.students")}
                  </th>
                  <th style={styles.thRight}>
                    {t("instructorAnalytics.completion")}
                  </th>
                  <th style={styles.thRight}>
                    {t("instructorAnalytics.quizPass")}
                  </th>
                  <th style={styles.thRight}>
                    {t("instructorAnalytics.rating")}
                  </th>
                  {/* <th style={styles.thRight}>Status</th> */}
                </tr>
              </thead>
              <tbody>
                {sortedCourses.map((course) => {
                  const comp = completion(course);
                  const passRate = quizPassRate(course);
                  const id = course._id ?? course.id ?? course.title;
                  return (
                    <tr key={id}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>
                        {course.title}
                      </td>
                      <td style={styles.tdRight}>
                        {studentCount(course).toLocaleString("en-IN")}
                      </td>
                      <td style={styles.tdRight}>{comp}%</td>
                      <td style={styles.tdRight}>
                        {passRate != null ? `${passRate}%` : "–"}
                      </td>
                      <td style={styles.tdRight}>
                        {courseRating(course) > 0
                          ? `${courseRating(course)} ★`
                          : "–"}
                      </td>
                      {/* <td style={styles.tdRight}>
                        <StatusBadge value={comp} />
                      </td> */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.empty}>
            {loading
              ? t("instructorAnalytics.loadingCourses")
              : t("instructorAnalytics.noCoursesFound")}
          </div>
        )}
      </Card>
    </>
  );
};

export default InstructorAnalytics;