import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchCourses } from "../../redux/slices/courseSlice";
import { fetchSessions } from "../../redux/slices/sessionSlice";
import {
  StatCard,
  Card,
  SectionHeader,
  Btn,
  ProgressBar,
} from "./InstructorUi";

const InstructorHome = ({ showToast, onNavigate }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { courses, loading: coursesLoading } = useSelector((s) => s.courses);
  const { sessions, loading: sessionsLoading } = useSelector((s) => s.sessions);

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchSessions());
  }, [dispatch]);

  // ── Derived stats (no delta strings) ─────────────────────────────────────
  const totalStudents = courses.reduce(
    (sum, c) => sum + (c.enrolledCount ?? 0),
    0,
  );
  const avgRating = courses.length
    ? (
      courses.reduce((sum, c) => sum + (c.ratingAverage ?? 0), 0) /
      courses.length
    ).toFixed(1)
    : "—";

  // ── Upcoming sessions: only future ones, sorted by date+time ─────────────
  const now = new Date();
  const upcomingSessions = [...sessions]
    .filter((s) => {
      if (s.status === "live") return true;
      if (!s.date || s.date === "TBD") return true;
      const dt = new Date(`${s.date}${s.time ? " " + s.time : ""}`);
      return isNaN(dt) ? true : dt >= now;
    })
    .sort((a, b) => {
      const da = new Date(`${a.date} ${a.time ?? ""}`);
      const db = new Date(`${b.date} ${b.time ?? ""}`);
      const aIsNaN = isNaN(da);
      const bIsNaN = isNaN(db);
      if (aIsNaN && bIsNaN) return 0;
      if (aIsNaN) return 1;
      if (bIsNaN) return -1;
      return da - db;
    })
    .slice(0, 4);

  return (
    <>
      <style>{`
        @keyframes ihFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ihPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          50%      { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
        }

        .ih-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 22px;
        }

        /* Two-column layout on desktop/tablet; single column (courses
           first, sessions below) once the viewport gets too narrow to
           comfortably show both side by side — this is what puts
           Upcoming Sessions below Active Courses on mobile / the APK
           WebView, which is always a narrow viewport. */
        .ih-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
        }

        .ih-row {
          animation: ihFadeUp 0.35s ease both;
        }
        .ih-row:active {
          background: rgba(255,255,255,0.02);
        }

        .ih-live-dot {
          animation: ihPulse 1.8s ease-in-out infinite;
        }

        @media (max-width: 860px) {
          .ih-main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .ih-stats {
            gap: 8px;
          }
        }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          marginBottom: 22,
          animation: "ihFadeUp 0.3s ease both",
        }}
      >
        <p
          style={{
            color: "#a78bfa",
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 6,
            letterSpacing: "0.02em",
          }}
        >
          {t("instructorHome.welcomeBack", {
            name: user?.name?.split(" ")[0] || "Instructor",
          })}
        </p>
        <h1
          style={{
            fontSize: "clamp(22px,5vw,32px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            backgroundImage: "linear-gradient(135deg,#f1f5f9,#94a3b8)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: 1.2,
          }}
        >
          {t("instructorHome.dashboardTitle")}
        </h1>
      </div>

      {/* ── Stats row ── */}
      <div className="ih-stats">
        <StatCard
          label={t("instructorHome.totalCourses")}
          value={coursesLoading ? "…" : String(courses.length)}
          color="#a78bfa"
        />
        <StatCard
          label={t("instructorHome.totalStudents")}
          value={coursesLoading ? "…" : totalStudents.toLocaleString()}
          color="#34d399"
        />
        <StatCard
          label={t("instructorHome.instructorRating")}
          value={coursesLoading ? "…" : `${avgRating} ★`}
          color="#4ade80"
        />
      </div>

      {/* ── Active courses + Upcoming sessions ── */}
      <div className="ih-main-grid">
        {/* Active courses */}
        <Card>
          <SectionHeader
            title={t("instructorHome.activeCourses")}
            action={
              <Btn
                variant="ghost"
                style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={() => onNavigate("courses")}
              >
                {t("instructorHome.viewAll")}
              </Btn>
            }
          />

          {coursesLoading && (
            <div
              style={{
                padding: "28px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              {t("instructorHome.loadingCourses")}
            </div>
          )}

          {!coursesLoading && courses.length === 0 && (
            <div
              style={{
                padding: "28px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              {t("instructorHome.noCourses")}
            </div>
          )}

          {!coursesLoading &&
            courses.slice(0, 3).map((c, i) => (
              <div
                key={c._id ?? c.title}
                className="ih-row"
                style={{
                  paddingBottom: 14,
                  marginBottom: 14,
                  borderBottom: "1px solid #1e293b",
                  borderRadius: 10,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      background: c.bg ?? "linear-gradient(160deg,#1e293b,#141b2e)",
                      border: "1px solid #263348",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {c.thumbnailUrl ? (
                      <img
                        src={c.thumbnailUrl}
                        alt=""
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 11,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      "📚"
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#f1f5f9",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {c.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
                      {t("instructorHome.studentsRevenue", {
                        count: c.enrolledCount ?? 0,
                        revenue: c.revenue ?? 0,
                      })}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <ProgressBar value={c.avgCompletion ?? 0} />
                    </div>
                    <div
                      style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}
                    >
                      {t("instructorHome.avgCompletion", {
                        value: c.avgCompletion ?? 0,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </Card>

        {/* Upcoming sessions — sits below Active Courses on mobile/APK
            because .ih-main-grid collapses to a single column under
            860px, and this Card is the second child in DOM order. */}
        <Card>
          <SectionHeader
            title={t("instructorHome.upcomingSessions")}
            action={
              <Btn
                variant="ghost"
                style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={() => onNavigate("sessions")}
              >
                {t("instructorHome.manage")}
              </Btn>
            }
          />

          {sessionsLoading && (
            <div
              style={{
                padding: "20px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              {t("instructorHome.loadingSessions")}
            </div>
          )}

          {!sessionsLoading && upcomingSessions.length === 0 && (
            <div
              style={{
                padding: "20px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              {t("instructorHome.noUpcomingSessions")}
            </div>
          )}

          {!sessionsLoading &&
            upcomingSessions.map((s, i) => (
              <div
                key={s._id ?? s.title}
                className="ih-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 4px",
                  borderBottom: "1px solid #1e293b",
                  borderRadius: 10,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div
                  className={s.status === "live" ? "ih-live-dot" : ""}
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: s.status === "live" ? "#10b981" : "#7c3aed",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "#f1f5f9",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
                    {s.date !== "TBD" ? s.date : t("instructorHome.dateTbd")}
                    {s.time && s.time !== "TBD" ? ` — ${s.time}` : ""}
                  </div>
                </div>
                <Btn
                  variant={s.status === "live" ? "success" : "ghost"}
                  style={{ fontSize: 11, padding: "6px 12px", flexShrink: 0 }}
                  onClick={() =>
                    showToast(
                      s.status === "live"
                        ? t("instructorHome.joiningSession")
                        : t("instructorHome.sessionLinkCopied"),
                    )
                  }
                >
                  {s.status === "live"
                    ? t("instructorHome.join")
                    : t("instructorHome.link")}
                </Btn>
              </div>
            ))}
        </Card>
      </div>
    </>
  );
};

export default InstructorHome;