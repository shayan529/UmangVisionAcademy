import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeaderboard } from "../../redux/slices/studentSlice";
import { createPortal } from "react-dom";

const LeaderBoard = () => {
  const dispatch = useDispatch();
  const { leaderboard, leaderboardLoading } = useSelector((s) => s.students);
  const { user } = useSelector((s) => s.auth);

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showPointsInfo, setShowPointsInfo] = useState(false)

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  const currentUserId = user?._id ?? user?.id;

  const states = [
    ...new Set(
      (leaderboard ?? []).map((student) => student.state).filter(Boolean),
    ),
  ];

  const cities = [
    ...new Set(
      (leaderboard ?? [])
        .filter((student) => !selectedState || student.state === selectedState)
        .map((student) => student.city)
        .filter(Boolean),
    ),
  ];

  const filteredLeaderboard = (leaderboard ?? []).filter((student) => {
    const stateMatch = !selectedState || student.state === selectedState;

    const cityMatch = !selectedCity || student.city === selectedCity;

    return stateMatch && cityMatch;
  });

  const sorted = [...filteredLeaderboard].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0),
  );

  const currentRank =
    sorted.findIndex(
      (student) =>
        student._id === currentUserId || student.id === currentUserId,
    ) + 1;

  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1e293b",
        borderRadius: 18,
        padding: "24px",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
            🏆 Student Leaderboard
          </h2>
          <p style={{ color: "#64748b", marginTop: 6, fontSize: 14, margin: "6px 0 0" }}>
            Compete with students and climb the rankings.
          </p>
        </div>

        {/* Rank badge with ? tooltip */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(124,58,237,0.15)",
              border: "1px solid #7c3aed",
              color: "#c4b5fd",
              padding: "10px 16px",
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            <button
              onClick={() => setShowPointsInfo((prev) => !prev)}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "1.5px solid #7c3aed",
                background: "transparent",
                color: "#c4b5fd",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                padding: 0,
                lineHeight: 1,
              }}
              aria-label="How are points earned?"
            >
              ?
            </button>
            Your Rank: {currentRank > 0 ? currentRank : "—"}
          </div>

          {/* Tooltip dropdown */}
          {showPointsInfo &&
            createPortal(
              <div
                onClick={() => setShowPointsInfo(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  zIndex: 1000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: 18,
                    padding: "28px",
                    width: "100%",
                    maxWidth: 420,
                    margin: "0 16px",
                  }}
                >
                  {/* Modal header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#f8fafc" }}>
                        💡 How Points Are Earned
                      </h3>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                        Complete activities to climb the rankings
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPointsInfo(false)}
                      style={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        color: "#94a3b8",
                        borderRadius: 8,
                        width: 32,
                        height: 32,
                        cursor: "pointer",
                        fontSize: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Points list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { icon: "📅", label: "Daily Login", pts: "+10 pts", desc: "Log in every day to keep your streak" },
                      { icon: "📚", label: "Complete a Course", pts: "+100 pts", desc: "Finish all lessons in a course" },
                      { icon: "✅", label: "Finish a Lesson", pts: "+20 pts", desc: "Complete any individual lesson" },
                      { icon: "👥", label: "Refer a Friend", pts: "+50 pts", desc: "Invite someone who signs up" },
                      { icon: "🏆", label: "Pass a Quiz", pts: "+30 pts", desc: "Score above the passing threshold" },
                    ].map(({ icon, label, pts, desc }) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          background: "#0f172a",
                          border: "1px solid #1e293b",
                          borderRadius: 12,
                          padding: "14px 16px",
                        }}
                      >
                        <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 700 }}>{label}</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{desc}</div>
                        </div>
                        <div
                          style={{
                            background: "rgba(124,58,237,0.15)",
                            border: "1px solid #7c3aed",
                            color: "#c4b5fd",
                            borderRadius: 8,
                            padding: "4px 10px",
                            fontSize: 13,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {pts}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <p style={{ margin: "16px 0 0", fontSize: 12, color: "#475569", textAlign: "center" }}>
                    Points update in real time · Keep learning to rank higher 🚀
                  </p>
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select
          value={selectedState}
          onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(""); }}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "#0f172a",
            border: "1px solid #334155",
            color: "#fff",
            minWidth: 180,
          }}
        >
          <option value="">All States</option>
          {states.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "#0f172a",
            border: "1px solid #334155",
            color: "#fff",
            minWidth: 180,
          }}
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Leaderboard list */}
      {leaderboardLoading ? (
        <div style={{ color: "#94a3b8" }}>Loading leaderboard...</div>
      ) : sorted.length === 0 ? (
        <div style={{ color: "#94a3b8" }}>No leaderboard data found.</div>
      ) : (
        sorted.map((student, index) => {
          const rank = index + 1;
          const isCurrentUser = student._id === currentUserId || student.id === currentUserId;

          return (
            <div
              key={student._id ?? student.id ?? rank}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                borderRadius: 14,
                marginBottom: 10,
                background: isCurrentUser ? "rgba(124,58,237,0.12)" : "#0f172a",
                border: isCurrentUser ? "1px solid #7c3aed" : "1px solid #1e293b",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: "#fff",
                    background:
                      rank === 1 ? "#eab308" :
                        rank === 2 ? "#94a3b8" :
                          rank === 3 ? "#d97706" : "#334155",
                  }}
                >
                  {rank}
                </div>
                <div>
                  <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>{student.name}</p>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>
                    {[student.city, student.state].filter(Boolean).join(", ") || "Student"}
                  </p>
                </div>
              </div>
              <div style={{ color: "#22d3ee", fontWeight: 700, fontSize: 15 }}>
                {student.score ?? 0} pts
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default LeaderBoard;
