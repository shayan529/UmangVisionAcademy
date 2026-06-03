import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  const dispatch = useDispatch();
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
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return da - db;
    })
    .slice(0, 4);

  return (
    <>
      {/* Stats row — no delta props */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="Total Courses"
          value={coursesLoading ? "…" : String(courses.length)}
          color="#a78bfa"
        />
        <StatCard
          label="Total Students"
          value={coursesLoading ? "…" : totalStudents.toLocaleString()}
          color="#34d399"
        />
        <StatCard
          label="Instructor Rating"
          value={coursesLoading ? "…" : `${avgRating} ★`}
          color="#4ade80"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Active courses */}
        <Card>
          <SectionHeader
            title="Active Courses"
            action={
              <Btn
                variant="ghost"
                style={{ fontSize: 12, padding: "5px 10px" }}
                onClick={() => onNavigate("courses")}
              >
                View all
              </Btn>
            }
          />

          {coursesLoading && (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Loading courses…
            </div>
          )}

          {!coursesLoading && courses.length === 0 && (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              No courses yet.
            </div>
          )}

          {!coursesLoading &&
            courses.slice(0, 3).map((c) => (
              <div
                key={c._id ?? c.title}
                style={{
                  paddingBottom: 14,
                  marginBottom: 14,
                  borderBottom: "1px solid #1e293b",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: c.bg ?? "#1e293b",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {c.thumbnailUrl ? (
                      <img
                        src={c.thumbnailUrl}
                        alt=""
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
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
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#f1f5f9",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {c.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {c.enrolledCount ?? 0} students · ${c.revenue ?? 0}
                    </div>
                    <ProgressBar value={c.avgCompletion ?? 0} />
                    <div
                      style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}
                    >
                      {c.avgCompletion ?? 0}% avg completion
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </Card>

        {/* Upcoming sessions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <SectionHeader
              title="Upcoming Sessions"
              action={
                <Btn
                  variant="ghost"
                  style={{ fontSize: 12, padding: "5px 10px" }}
                  onClick={() => onNavigate("sessions")}
                >
                  Manage
                </Btn>
              }
            />

            {sessionsLoading && (
              <div
                style={{
                  padding: "16px 0",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                Loading sessions…
              </div>
            )}

            {!sessionsLoading && upcomingSessions.length === 0 && (
              <div
                style={{
                  padding: "16px 0",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                No upcoming sessions.
              </div>
            )}

            {!sessionsLoading &&
              upcomingSessions.map((s) => (
                <div
                  key={s._id ?? s.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid #1e293b",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: s.status === "live" ? "#10b981" : "#7c3aed",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#f1f5f9",
                      }}
                    >
                      {s.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {s.date !== "TBD" ? s.date : "Date TBD"}
                      {s.time && s.time !== "TBD" ? ` — ${s.time}` : ""}
                    </div>
                  </div>
                  <Btn
                    variant={s.status === "live" ? "success" : "ghost"}
                    style={{ fontSize: 11, padding: "4px 10px" }}
                    onClick={() =>
                      showToast(
                        s.status === "live"
                          ? "Joining session..."
                          : "Session link copied",
                      )
                    }
                  >
                    {s.status === "live" ? "Join" : "Link"}
                  </Btn>
                </div>
              ))}
          </Card>
        </div>
      </div>
    </>
  );
};

export default InstructorHome;
