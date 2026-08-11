import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";
import { SOCKET_URL, SOCKET_OPTIONS } from "../../config/api";
import { fetchCourses } from "../../redux/slices/courseSlice";
import { fetchSessions } from "../../redux/slices/sessionSlice";
import {
  fetchConversations,
  setActiveConversation,
  markConversationRead,
  socketMessageReceived,
} from "../../redux/slices/instructorChatSlice";
import {
  playNotificationSound,
  isNotificationSoundEnabled,
  toggleNotificationSound,
  testNotificationSound,
} from "../../utils/notificationSound";
import {
  StatCard,
  Card,
  SectionHeader,
  Btn,
} from "./InstructorUi";
import {
  MessageSquare,
  Volume2,
  VolumeX,
  BookOpen,
  ChevronRight,
  Send,
  Sparkles,
} from "lucide-react";

// ── Time Helpers ─────────────────────────────────────────────────────────────
const fmtTimeAgo = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const now = new Date();
  const diffMs = now - dt;
  if (isNaN(diffMs)) return "";
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return dt.toLocaleDateString([], { month: "short", day: "numeric" });
};

const initialOf = (name) => name?.trim()?.charAt(0)?.toUpperCase() || "S";

const InstructorHome = ({ showToast, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { courses, loading: coursesLoading } = useSelector((s) => s.courses);
  const { sessions, loading: sessionsLoading } = useSelector((s) => s.sessions);
  const { conversations = [], conversationsLoading } = useSelector(
    (s) => s.instructorChat || {},
  );

  const [soundEnabled, setSoundEnabled] = useState(isNotificationSoundEnabled());
  const socketRef = useRef(null);
  const isHindi = i18n.language?.startsWith("hi");

  // ── Initial Data Fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchSessions());
    dispatch(fetchConversations());
  }, [dispatch]);

  // ── Real-time Socket for Dashboard Live Notifications ───────────────────────
  useEffect(() => {
    if (!user?._id) return;
    const token = localStorage.getItem("authToken");
    const socket = io(`${SOCKET_URL}/ichat`, {
      auth: { token },
      ...SOCKET_OPTIONS,
    });
    socketRef.current = socket;

    socket.on("ic:message", (msg) => {
      dispatch(socketMessageReceived(msg));
      // Trigger notification chime if query/message is from a student
      if (
        msg.message?.senderRole === "student" ||
        msg.message?.sender?._id?.toString() !== user?._id?.toString()
      ) {
        playNotificationSound("query");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, dispatch]);

  // ── Listen for custom sound preference change ──────────────────────────────
  useEffect(() => {
    const handleSoundChange = (e) => {
      if (e.detail?.enabled !== undefined) {
        setSoundEnabled(e.detail.enabled);
      }
    };
    window.addEventListener("notification-sound-change", handleSoundChange);
    return () =>
      window.removeEventListener("notification-sound-change", handleSoundChange);
  }, []);

  const handleToggleSound = (e) => {
    e.stopPropagation();
    const next = toggleNotificationSound();
    setSoundEnabled(next);
    if (next) {
      testNotificationSound();
      if (showToast) showToast(t("instructorHome.soundEnabledToast", "Notification sound enabled 🔔"));
    } else {
      if (showToast) showToast(t("instructorHome.soundMutedToast", "Notification sound muted 🔕"));
    }
  };

  const handleOpenQuery = (conv) => {
    dispatch(setActiveConversation(conv));
    dispatch(markConversationRead(conv._id));
    if (onNavigate) {
      onNavigate("student_queries");
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
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

  const totalUnreadQueries = conversations.reduce(
    (sum, c) => sum + (c.instructorUnread ?? 0),
    0,
  );

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

  // Show up to 3 most recent student queries
  const recentQueries = [...conversations].slice(0, 3);

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
        @keyframes ihGlowUnread {
          0%, 100% { border-color: rgba(16, 185, 129, 0.4); }
          50%      { border-color: rgba(16, 185, 129, 0.9); }
        }

        .ih-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 22px;
        }

        .ih-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
        }

        .ih-row {
          animation: ihFadeUp 0.35s ease both;
          transition: background 0.18s ease, transform 0.18s ease;
        }
        .ih-row:hover {
          background: rgba(255,255,255,0.025);
        }
        .ih-row:active {
          background: rgba(255,255,255,0.04);
        }

        .ih-query-item {
          cursor: pointer;
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid #1e293b;
          background: rgba(15, 23, 42, 0.45);
          margin-bottom: 10px;
          transition: all 0.2s ease;
        }
        .ih-query-item:hover {
          background: rgba(30, 41, 59, 0.6);
          border-color: #334155;
          transform: translateY(-1px);
        }
        .ih-query-item.ih-unread {
          border-color: rgba(16, 185, 129, 0.4);
          background: rgba(16, 185, 129, 0.04);
        }
        .ih-query-item.ih-unread:hover {
          border-color: rgba(16, 185, 129, 0.7);
          background: rgba(16, 185, 129, 0.08);
        }

        .ih-live-dot {
          animation: ihPulse 1.8s ease-in-out infinite;
        }

        .ih-sound-btn {
          background: #1e293b;
          border: 1px solid #334155;
          color: #94a3b8;
          border-radius: 8px;
          padding: 5px 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ih-sound-btn:hover {
          color: #f8fafc;
          border-color: #475569;
          background: #273549;
        }
        .ih-sound-btn.active {
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.4);
          background: rgba(16, 185, 129, 0.1);
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
          {t("instructorHome.dashboardTitle", "Instructor Dashboard")}
        </h1>
      </div>

      {/* ── Stats row ── */}
      <div className="ih-stats">
        <StatCard
          label={t("instructorHome.totalCourses", "Total Courses")}
          value={coursesLoading ? "…" : String(courses.length)}
          color="#a78bfa"
        />
        <StatCard
          label={t("instructorHome.totalStudents", "Total Students")}
          value={coursesLoading ? "…" : totalStudents.toLocaleString()}
          color="#34d399"
        />
        <StatCard
          label={t("instructorHome.instructorRating", "Instructor Rating")}
          value={coursesLoading ? "…" : `${avgRating} ★`}
          color="#4ade80"
        />
      </div>

      {/* ── Student Queries Notifications + Upcoming sessions ── */}
      <div className="ih-main-grid">
        {/* Student Queries Notifications Card (Replaces Active Courses) */}
        <Card>
          <SectionHeader
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{t("instructorHome.studentQueries", "Student Queries")}</span>
                {totalUnreadQueries > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#34d399",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {t("instructorHome.unreadQueriesCount", { count: totalUnreadQueries, defaultValue: `${totalUnreadQueries} Unread` })}
                  </span>
                )}
              </div>
            }
            action={
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={handleToggleSound}
                  className={`ih-sound-btn ${soundEnabled ? "active" : ""}`}
                  title={
                    soundEnabled
                      ? t("instructorHome.soundOnTooltip", "Notification Sound Alert Active (Click to mute)")
                      : t("instructorHome.soundOffTooltip", "Notification Sound Muted (Click to enable)")
                  }
                >
                  {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  <span style={{ fontSize: 10 }}>
                    {soundEnabled
                      ? t("instructorHome.soundEnabled", "Sound On")
                      : t("instructorHome.soundMuted", "Muted")}
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    testNotificationSound();
                  }}
                  className="ih-sound-btn"
                  title={t("instructorHome.testSoundTooltip", "Test Notification Sound")}
                >
                  <Sparkles size={13} />
                  <span style={{ fontSize: 10 }}>
                    {t("instructorHome.testSound", "Test Sound")}
                  </span>
                </button>

                <Btn
                  variant="ghost"
                  style={{ fontSize: 12, padding: "5px 10px" }}
                  onClick={() => onNavigate && onNavigate("student_queries")}
                >
                  {t("instructorHome.viewAll", "View All")}
                </Btn>
              </div>
            }
          />

          {/* Loading Skeleton */}
          {conversationsLoading && (
            <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "rgba(30, 41, 59, 0.4)",
                    border: "1px solid #1e293b",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#1e293b",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        height: 12,
                        width: "50%",
                        background: "#1e293b",
                        borderRadius: 4,
                        marginBottom: 6,
                      }}
                    />
                    <div
                      style={{
                        height: 10,
                        width: "75%",
                        background: "rgba(30, 41, 59, 0.6)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!conversationsLoading && recentQueries.length === 0 && (
            <div
              style={{
                padding: "36px 16px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#34d399",
                }}
              >
                <MessageSquare size={22} />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f1f5f9" }}>
                {t("instructorHome.noStudentQueries", "No student queries right now")}
              </div>
              <p
                style={{
                  fontSize: 11.5,
                  color: "#64748b",
                  maxWidth: 280,
                  lineHeight: 1.45,
                  margin: 0,
                }}
              >
                {t(
                  "instructorHome.noQueriesDesc",
                  "When enrolled students submit questions or ask for assistance, they'll appear here with live notifications.",
                )}
              </p>
              <Btn
                variant="ghost"
                style={{ fontSize: 11, marginTop: 4, padding: "5px 12px" }}
                onClick={() => onNavigate && onNavigate("student_queries")}
              >
                {t("instructorHome.openQueriesDesk", "Open Queries Desk")}
              </Btn>
            </div>
          )}

          {/* Query Feed Items */}
          {!conversationsLoading &&
            recentQueries.map((c, i) => {
              const student = c.student;
              const hasUnread = (c.instructorUnread ?? 0) > 0;
              const lastMsgText =
                typeof c.lastMessage === "object"
                  ? c.lastMessage?.text || ""
                  : c.lastMessage || "";
              const timeDisplay = fmtTimeAgo(
                c.lastMessage?.at || c.updatedAt || c.createdAt,
              );

              return (
                <div
                  key={c._id}
                  className={`ih-row ih-query-item ${hasUnread ? "ih-unread" : ""}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => handleOpenQuery(c)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    {/* Student Avatar */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {student?.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.name || "Student"}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            objectFit: "cover",
                            border: hasUnread
                              ? "1.5px solid #10b981"
                              : "1px solid #334155",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background:
                              "linear-gradient(135deg,#059669,#0d9488)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: 14,
                            border: hasUnread
                              ? "1.5px solid #10b981"
                              : "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {initialOf(student?.name)}
                        </div>
                      )}
                      {hasUnread && (
                        <span
                          style={{
                            position: "absolute",
                            top: -2,
                            right: -2,
                            width: 9,
                            height: 9,
                            borderRadius: "50%",
                            background: "#10b981",
                            border: "1.5px solid #0b1028",
                          }}
                        />
                      )}
                    </div>

                    {/* Query Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#f8fafc",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {student?.name || "Student"}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: hasUnread ? "#34d399" : "#64748b",
                            fontWeight: hasUnread ? 700 : 500,
                            flexShrink: 0,
                          }}
                        >
                          {timeDisplay}
                        </span>
                      </div>

                      {/* Course / Subject tag */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 10.5,
                          color: "#38bdf8",
                          marginTop: 1,
                          marginBottom: 3,
                          fontWeight: 500,
                        }}
                      >
                        <BookOpen size={11} style={{ flexShrink: 0 }} />
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {c.course?.title || "Class Query"}
                          {c.subject ? ` · ${c.subject}` : ""}
                        </span>
                      </div>

                      {/* Last Message Snippet */}
                      <div
                        style={{
                          fontSize: 11.5,
                          color: hasUnread ? "#cbd5e1" : "#94a3b8",
                          fontWeight: hasUnread ? 600 : 400,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {lastMsgText || t("instructorHome.noMessagesYet", "New doubt thread started")}
                      </div>
                    </div>

                    {/* Quick Action Button */}
                    <div style={{ flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenQuery(c);
                        }}
                        style={{
                          background: hasUnread ? "#059669" : "transparent",
                          border: hasUnread ? "none" : "1px solid #334155",
                          color: hasUnread ? "#ffffff" : "#94a3b8",
                          borderRadius: 8,
                          padding: "5px 9px",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!hasUnread) {
                            e.currentTarget.style.borderColor = "#4ade80";
                            e.currentTarget.style.color = "#4ade80";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!hasUnread) {
                            e.currentTarget.style.borderColor = "#334155";
                            e.currentTarget.style.color = "#94a3b8";
                          }
                        }}
                      >
                        {hasUnread ? (
                          <>
                            <Send size={10} />
                            <span>{t("instructorHome.reply", "Reply")}</span>
                          </>
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </Card>

        {/* Upcoming sessions — sits beside / below Student Queries on mobile/APK */}
        <Card>
          <SectionHeader
            title={t("instructorHome.upcomingSessions", "Upcoming Sessions")}
            action={
              <Btn
                variant="ghost"
                style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={() => onNavigate && onNavigate("sessions")}
              >
                {t("instructorHome.manage", "Manage")}
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
              {t("instructorHome.loadingSessions", "Loading sessions...")}
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
              {t("instructorHome.noUpcomingSessions", "No upcoming sessions.")}
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
                    {s.date !== "TBD" ? s.date : t("instructorHome.dateTbd", "Date TBD")}
                    {s.time && s.time !== "TBD" ? ` — ${s.time}` : ""}
                  </div>
                </div>
                <Btn
                  variant={s.status === "live" ? "success" : "ghost"}
                  style={{ fontSize: 11, padding: "6px 12px", flexShrink: 0 }}
                  onClick={() =>
                    showToast &&
                    showToast(
                      s.status === "live"
                        ? t("instructorHome.joiningSession", "Joining session...")
                        : t("instructorHome.sessionLinkCopied", "Session link copied"),
                    )
                  }
                >
                  {s.status === "live"
                    ? t("instructorHome.join", "Join")
                    : t("instructorHome.link", "Link")}
                </Btn>
              </div>
            ))}
        </Card>
      </div>
    </>
  );
};

export default InstructorHome;
