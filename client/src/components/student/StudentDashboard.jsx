import React, { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchLeaderboard,
  fetchStudentActivity,
} from "../../redux/slices/studentSlice";
import { fetchSessions } from "../../redux/slices/sessionSlice";
import { toast } from "react-hot-toast";

import { useTranslation } from "react-i18next";
import { fetchSubscription } from "../../redux/slices/billingSlice";
import { useState } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getOverallProgress = (courses = []) => {
  if (!courses.length) return 0;
  const total = courses.reduce((sum, c) => sum + (c.progress ?? 0), 0);
  return Math.round(total / courses.length);
};

const getLeaderboardRank = (students = [], currentUserId) => {
  if (!students.length || !currentUserId) return null;
  const sorted = [...students].sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0));
  const rank = sorted.findIndex(
    (s) => s._id === currentUserId || s.id === currentUserId,
  );
  return rank === -1 ? null : rank + 1;
};

const formatActivityTime = (dateStr, t) => {
  if (!dateStr) return "";

  const diff = Date.now() - new Date(dateStr).getTime();

  const mins = Math.floor(diff / 60000);

  if (mins < 60) return t("studentDashboard.minutesAgo", { count: mins });

  const hrs = Math.floor(mins / 60);

  if (hrs < 24) return t("studentDashboard.hoursAgo", { count: hrs });

  return t("studentDashboard.daysAgo", {
    count: Math.floor(hrs / 24),
  });
};

// ── Activity type → icon/color map ───────────────────────────────────────────
const activityMeta = {
  quiz: { icon: "📝", color: "#818cf8", label: "Quiz" },
  lesson: { icon: "📖", color: "#22d3ee", label: "Lesson" },
  course: { icon: "🎓", color: "#f472b6", label: "Course" },
  login: { icon: "🔑", color: "#34d399", label: "Login" },
  default: { icon: "⚡", color: "#fb923c", label: "Activity" },
};

const getActivityMeta = (type = "") =>
  activityMeta[type.toLowerCase()] ?? activityMeta.default;

// ── Skeleton loader ───────────────────────────────────────────────────────────
const Skeleton = ({ w = "100%", h = 18, radius = 8, style = {} }) => (
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

// ── DashboardHome ─────────────────────────────────────────────────────────────
export const DashboardHome = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchSubscription());
  }, [dispatch]);
  // ── Redux state ──
  const {
    leaderboard: students,
    activity,
    leaderboardLoading: studentsLoading,
    activityLoading,
  } = useSelector((s) => s.students);
  const { t } = useTranslation();

  useEffect(() => {
    // Ensure subscription and sessions are loaded so Sidebar shows premium items
    dispatch(fetchSubscription());
    dispatch(fetchSessions());
  }, [dispatch]);

  useEffect(() => {
    // Preload live sessions so they're available across student routes
    dispatch(fetchSessions());
  }, [dispatch]);

  // Enrolled courses: try common slice names
  const enrolledCourses = useSelector(
    (s) => s.courses?.enrolled ?? s.myCourses?.courses ?? [],
  );
  const coursesLoading = useSelector(
    (s) => s.courses?.enrolledLoading ?? s.myCourses?.loading ?? false,
  );

  const username = user?.email ? user.email.split("@")[0] : "there";
  const userId = user?._id ?? user?.id;

  const overallProgress = getOverallProgress(enrolledCourses);
  const rank = getLeaderboardRank(students, userId);
  const recentActivity = [...(activity ?? [])].slice(0, 5);

  // ── Next incomplete course ──
  const nextCourse = enrolledCourses.find((c) => (c.progress ?? 0) < 100);

  return (
    <>
      {/* Shimmer keyframe injected once */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-section { animation: fadeUp 0.35s ease both; }
        .dash-section:nth-child(2) { animation-delay: 0.05s; }
        .dash-section:nth-child(3) { animation-delay: 0.1s; }
        .dash-section:nth-child(4) { animation-delay: 0.15s; }
        .activity-row:hover { background: #1e293b !important; }
        .progress-bar-fill { transition: width 0.9s cubic-bezier(.4,0,.2,1); }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* ── Hero ── */}
        <section
          className="dash-section"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                color: "#818cf8",
                fontWeight: 500,
                fontSize: 14,
                marginBottom: 6,
              }}
            >
              {t("studentDashboard.welcomeBack", { name: username })}
            </p>
            <h1
              style={{
                fontSize: "clamp(28px,4vw,42px)",
                fontWeight: 800,
                color: "#f1f5f9",
                lineHeight: 1.2,
              }}
            >
              {t("studentDashboard.studentDashboardTitle")}
            </h1>
            <p
              style={{
                color: "#64748b",
                marginTop: 10,
                maxWidth: 500,
                lineHeight: 1.7,
                fontSize: 14,
              }}
            >
              {t("studentDashboard.heroDescription")}
            </p>
          </div>
          <Link
            to="my-courses"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <button
              style={{
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "12px 24px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(124,58,237,.35)",
                whiteSpace: "nowrap",
              }}
            >
              {t("studentDashboard.continueLearning")}
            </button>
          </Link>
        </section>

        {/* ── Stat cards ── */}
        <div
          className="dash-section"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 14,
          }}
        >
          {/* Enrolled */}
          <StatCard
            loading={coursesLoading}
            value={enrolledCourses.length || "—"}
            label={t("studentDashboard.enrolledCourses")}
            color="#818cf8"
          />
          {/* Progress */}
          <StatCard
            loading={coursesLoading}
            value={enrolledCourses.length ? `${overallProgress}%` : "—"}
            label={t("studentDashboard.overallProgress")}
            color="#22d3ee"
            extra={
              enrolledCourses.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    height: 4,
                    borderRadius: 4,
                    background: "#1e293b",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="progress-bar-fill"
                    style={{
                      height: "100%",
                      width: `${overallProgress}%`,
                      background: "linear-gradient(90deg,#22d3ee,#818cf8)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              )
            }
          />
          {/* Rank */}
          <StatCard
            loading={studentsLoading}
            value={rank ? `#${rank}` : "—"}
            label={t("studentDashboard.leaderboardRank")}
            color="#f472b6"
          />
        </div>

        {/* ── Goal cards + Activity ── */}
        <div
          className="dash-section"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 14,
          }}
        >
          {/* Goal cards */}

          {/* Recent Activity feed */}
          <div
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 18,
              padding: "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
                {t("studentDashboard.recentActivity")}
              </h3>
              <Link
                to="my-courses"
                style={{
                  fontSize: 12,
                  color: "#818cf8",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {t("studentDashboard.viewAll")}
              </Link>
            </div>

            {activityLoading ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <Skeleton w={36} h={36} radius={10} />
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <Skeleton w="70%" h={13} />
                      <Skeleton w="40%" h={11} />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div
                style={{
                  color: "#475569",
                  fontSize: 13,
                  textAlign: "center",
                  paddingTop: 24,
                }}
              >
                No recent activity yet.
                <br />
                Start a course to see your progress here.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {recentActivity.map((item, i) => {
                  const meta = getActivityMeta(item.type);
                  return (
                    <div
                      key={item._id ?? item.id ?? i}
                      className="activity-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "8px 10px",
                        borderRadius: 10,
                        transition: "background .15s",
                        cursor: "default",
                      }}
                    >
                      {/* Icon bubble */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: `${meta.color}18`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        {meta.icon}
                      </div>
                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
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
                          {item.title ??
                            item.description ??
                            item.action ??
                            meta.label}
                        </p>
                        {item.courseName && (
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
                            {item.courseName}
                          </p>
                        )}
                      </div>
                      {/* Time */}
                      <span
                        style={{
                          fontSize: 11,
                          color: "#475569",
                          flexShrink: 0,
                        }}
                      >
                        {formatActivityTime(
                          item.createdAt ?? item.timestamp ?? item.date,
                          t,
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Course progress strip ── */}
        {(coursesLoading || enrolledCourses.length > 0) && (
          <section className="dash-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
                {t("studentDashboard.courseProgress")}
              </h3>
              <Link
                to="my-courses"
                style={{
                  fontSize: 12,
                  color: "#818cf8",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {t("studentDashboard.seeAll")}
              </Link>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                gap: 12,
              }}
            >
              {coursesLoading
                ? [...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#111827",
                        border: "1px solid #1e293b",
                        borderRadius: 14,
                        padding: "16px 18px",
                      }}
                    >
                      <Skeleton w="65%" h={13} style={{ marginBottom: 10 }} />
                      <Skeleton w="100%" h={6} radius={4} />
                    </div>
                  ))
                : enrolledCourses
                    .slice(0, 6)
                    .map((course, i) => (
                      <CourseProgressCard
                        key={course._id ?? course.id ?? i}
                        course={course}
                      />
                    ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const StatCard = ({ loading, value, label, color, extra }) => (
  <div
    style={{
      background: "#111827",
      border: "1px solid #1e293b",
      borderRadius: 18,
      padding: "22px 24px",
    }}
  >
    {loading ? (
      <>
        <Skeleton w="50%" h={34} radius={8} />
        <Skeleton w="70%" h={12} radius={6} style={{ marginTop: 10 }} />
      </>
    ) : (
      <>
        <div style={{ fontSize: 34, fontWeight: 800, color }}>{value}</div>
        <div style={{ color: "#64748b", marginTop: 6, fontSize: 13 }}>
          {label}
        </div>
        {extra}
      </>
    )}
  </div>
);

const GoalCard = ({ tag, tagColor, title, desc, loading }) => (
  <div
    style={{
      background: "#111827",
      border: "1px solid #1e293b",
      borderRadius: 18,
      padding: "20px 22px",
    }}
  >
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: tagColor,
        marginBottom: 8,
        textTransform: "uppercase",
      }}
    >
      {tag}
    </p>
    {loading ? (
      <>
        <Skeleton w="80%" h={18} style={{ marginBottom: 10 }} />
        <Skeleton w="100%" h={12} />
        <Skeleton w="60%" h={12} style={{ marginTop: 4 }} />
      </>
    ) : (
      <>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "#f1f5f9",
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>
        <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.7 }}>
          {desc}
        </p>
      </>
    )}
  </div>
);

const CourseProgressCard = ({ course }) => {
  const progress = course.progress ?? 0;
  const title = course.title ?? course.name ?? "Untitled Course";
  const accent =
    progress === 100 ? "#34d399" : progress > 50 ? "#22d3ee" : "#818cf8";

  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1e293b",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#e2e8f0",
          marginBottom: 10,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 4,
            background: "#1e293b",
            overflow: "hidden",
          }}
        >
          <div
            className="progress-bar-fill"
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg,${accent},${accent}99)`,
              borderRadius: 4,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: accent,
            flexShrink: 0,
          }}
        >
          {progress}%
        </span>
      </div>
    </div>
  );
};

// ── Main layout ───────────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  useEffect(() => {
    dispatch(fetchSubscription());
    dispatch(fetchSessions());
  }, [dispatch]);

  const sectionTitles = {
    "/student-dashboard": t("studentDashboard.dashboard"),
    "/student-dashboard/my-courses": t("studentDashboard.myCourses"),
    "/student-dashboard/ai-tutor": t("studentDashboard.aiTutor"),
    "/student-dashboard/community": t("studentDashboard.community"),
    "/student-dashboard/certificates": t("studentDashboard.certificates"),
    "/student-dashboard/achievements": t("studentSidebar.achievements"),
    "/student-dashboard/settings": t("studentDashboard.settings"),
    "/student-dashboard/leaderboard": t("studentDashboard.leaderboard"),
    "/student-dashboard/progress": t("studentDashboard.progress"),
    "/student-dashboard/wallet": t("studentDashboard.wallet"),
    "/student-dashboard/purchase-history": t(
      "studentDashboard.purchaseHistory",
    ),
  };

  const unreadCount = useSelector(
    (s) => s.notifications?.unread ?? s.notifications?.unreadCount ?? 0,
  );

  const pageTitle =
    sectionTitles[pathname] ??
    Object.entries(sectionTitles)
      .filter(
        ([path]) => pathname.startsWith(path) && path !== "/student-dashboard",
      )
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    "Dashboard";

  return (
    <div className="min-h-screen bg-[#0b1120] text-[#f1f5f9] md:flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <main
          className="flex-1 px-4 py-4 md:px-7 md:py-6"
          onClick={() => {
            if (mobileOpen) setMobileOpen(false);
          }}
        >
          {/* Mobile top bar */}
          <div className="flex items-center justify-between gap-4 pb-4 md:hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20"
            >
              {t("studentDashboard.menu")}
            </button>
            <h2 className="text-lg font-semibold text-white flex-1 text-center truncate">
              {pageTitle}
            </h2>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#7c3aed",
                  color: "#fff",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  flexShrink: 0,
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
