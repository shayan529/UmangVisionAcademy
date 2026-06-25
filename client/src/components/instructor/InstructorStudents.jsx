import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchStudents,
  fetchStudentActivity,
} from "../../redux/slices/studentSlice";
import { StatCard, Card, SectionHeader, ProgressBar } from "./InstructorUi";

// Tag styling helper
const tagStyle = (tag) => {
  const map = {
    done: { tc: "#4ade80", tb: "#052e16" },
    graded: { tc: "#a78bfa", tb: "#2e1065" },
    reply: { tc: "#fbbf24", tb: "#1c1003" },
    new: { tc: "#34d399", tb: "#022c22" },
    active: { tc: "#38bdf8", tb: "#0c1a2e" }, // ← add this
  };
  return map[tag] ?? { tc: "#94a3b8", tb: "#1e293b" };
};

const InstructorStudents = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { students, activity, loading, activityLoading } = useSelector(
    (s) => s.students,
  );

  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchStudentActivity());
  }, [dispatch]);

  // ── Derived stats ──────────────────────────────────────────────────────
  const totalEnrolled = students.length;
  const activeThisWeek = students.filter((s) => s.activeThisWeek).length;
  const completed = students.filter((s) => s.completedCourse).length;
  const avgCompletion = students.length
    ? Math.round(
        students.reduce((sum, s) => sum + (s.progress ?? s.prog ?? 0), 0) /
          students.length,
      )
    : 0;

  // Top learners: sorted by progress descending
  const topLearners = [...students]
    .sort((a, b) => (b.progress ?? b.prog ?? 0) - (a.progress ?? a.prog ?? 0))
    .slice(0, 5);

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
          label={t("instructorStudents.totalEnrolled")}
          value={loading ? "…" : totalEnrolled.toLocaleString()}
          color="#a78bfa"
        />
        <StatCard
          label={t("instructorStudents.activeThisWeek")}
          value={loading ? "…" : activeThisWeek.toLocaleString()}
          color="#34d399"
        />
        <StatCard
          label={t("instructorStudents.completedCourse")}
          value={loading ? "…" : completed.toLocaleString()}
          color="#4ade80"
        />
        <StatCard
          label={t("instructorStudents.avgCompletion")}
          value={loading ? "…" : `${avgCompletion}%`}
          color="#fbbf24"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Top learners */}
        <Card>
          <SectionHeader title={t("instructorStudents.topLearners")} />

          {loading && (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              {t("instructorStudents.loadingStudents")}
            </div>
          )}

          {!loading && topLearners.length === 0 && (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              {t("instructorStudents.noStudentData")}
            </div>
          )}

          {!loading &&
            topLearners.map((s) => {
              const prog = s.progress ?? s.prog ?? 0;
              return (
                <div
                  key={s._id ?? s.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid #1e293b",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: s.bg ?? "#1e293b",
                      color: s.ic ?? "#a78bfa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {s.init ?? s.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#f1f5f9",
                      }}
                    >
                      {s.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {s.course ?? s.enrolledCourse}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 60 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#a78bfa",
                      }}
                    >
                      {prog}%
                    </div>
                    <ProgressBar value={prog} />
                  </div>
                </div>
              );
            })}
        </Card>

        {/* Recent activity */}
        <Card>
          <SectionHeader title={t("instructorStudents.recentActivity")} />

          {activityLoading && (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              {t("instructorStudents.loadingActivity")}
            </div>
          )}

          {!activityLoading && activity.length === 0 && (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              {t("instructorStudents.noRecentActivity")}
            </div>
          )}

          {!activityLoading &&
            activity.map((s) => {
              const { tc, tb } = tagStyle(s.tag);
              return (
                <div
                  key={s._id ?? s.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid #1e293b",
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: s.bg ?? "#1e293b",
                      color: s.ic ?? "#a78bfa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {s.init ?? s.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#f1f5f9",
                      }}
                    >
                      {s.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {s.action}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 20,
                      background: tb,
                      color: tc,
                    }}
                  >
                    {s.tag}
                  </span>
                </div>
              );
            })}
        </Card>
      </div>
    </>
  );
};

export default InstructorStudents;
