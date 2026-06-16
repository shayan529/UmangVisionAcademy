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
  const [showPointsInfo, setShowPointsInfo] = useState(false);

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
    (a, b) => (b.coins ?? 0) - (a.coins ?? 0),
  );

  const currentRank =
    sorted.findIndex(
      (student) =>
        student._id === currentUserId || student.id === currentUserId,
    ) + 1;

  const currentUser = sorted.find(
    (s) => s._id === currentUserId || s.id === currentUserId,
  );
  const myCoins = currentUser?.coins ?? 0;

  const COINS_PER_RUPEE = 25;
  const coinsToRupees = (c) => (c / COINS_PER_RUPEE).toFixed(2);

  const COIN_ACTIVITIES = [
    {
      icon: "📅",
      label: "Daily Login",
      coins: 1,
      desc: "Log in every day to keep your streak",
    },
    {
      icon: "📚",
      label: "Complete a Course",
      coins: 25,
      desc: "Finish all lessons in a course",
    },
    {
      icon: "🏆",
      label: "Earn a Certificate",
      coins: 25,
      desc: "Receive your course completion certificate",
    },
  ];

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
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#f8fafc",
              margin: 0,
            }}
          >
            🏆 Student Leaderboard
          </h2>
          <p
            style={{
              color: "#64748b",
              marginTop: 6,
              fontSize: 14,
              margin: "6px 0 0",
            }}
          >
            Earn coins by learning and climb the rankings.
          </p>
        </div>

        {/* Rank + coin badge */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* My coins */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(234,179,8,0.12)",
              border: "1px solid #ca8a04",
              color: "#fde68a",
              padding: "10px 14px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            🪙 {myCoins} coins
            <span style={{ color: "#fef9c3", fontWeight: 500, fontSize: 12 }}>
              (₹{coinsToRupees(myCoins)})
            </span>
            <button
              onClick={() => setShowPointsInfo((prev) => !prev)}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "1px solid #7c3aed",
                background: "transparent",
                color: "#c4b5fd",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
              aria-label="How are coins earned?"
            >
              ?
            </button>
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
                aria-label="How are coins earned?"
              >
                ?
              </button>
              Your Rank: {currentRank > 0 ? currentRank : "—"}
            </div>

            {/* Info modal */}
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
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 800,
                            color: "#f8fafc",
                          }}
                        >
                          🪙 How Coins Are Earned
                        </h3>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: 13,
                            color: "#64748b",
                          }}
                        >
                          Complete activities to earn coins and climb the
                          rankings
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

                    {/* Coin activities */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {COIN_ACTIVITIES.map(({ icon, label, coins, desc }) => (
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
                          <span style={{ fontSize: 24, flexShrink: 0 }}>
                            {icon}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 14,
                                color: "#f8fafc",
                                fontWeight: 700,
                              }}
                            >
                              {label}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#64748b",
                                marginTop: 2,
                              }}
                            >
                              {desc}
                            </div>
                          </div>
                          <div
                            style={{
                              background: "rgba(234,179,8,0.15)",
                              border: "1px solid #ca8a04",
                              color: "#fde68a",
                              borderRadius: 8,
                              padding: "4px 10px",
                              fontSize: 13,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            🪙 +{coins}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Conversion note */}
                    <div
                      style={{
                        marginTop: 16,
                        padding: "12px 16px",
                        background: "rgba(124,58,237,0.1)",
                        border: "1px solid #7c3aed",
                        borderRadius: 12,
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: "#c4b5fd",
                          fontWeight: 700,
                        }}
                      >
                        💡 25 coins = ₹1 wallet balance
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 12,
                          color: "#7c3aed",
                        }}
                      >
                        Coins can be redeemed in your Wallet tab
                      </p>
                    </div>
                  </div>
                </div>,
                document.body,
              )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}
      >
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setSelectedCity("");
          }}
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
            <option key={state} value={state}>
              {state}
            </option>
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
            <option key={city} value={city}>
              {city}
            </option>
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
          const isCurrentUser =
            student._id === currentUserId || student.id === currentUserId;
          const studentCoins = student.coins ?? 0;

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
                border: isCurrentUser
                  ? "1px solid #7c3aed"
                  : "1px solid #1e293b",
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
                    fontSize: rank <= 3 ? 20 : 15,
                    color: "#fff",
                    background:
                      rank === 1
                        ? "#eab308"
                        : rank === 2
                          ? "#94a3b8"
                          : rank === 3
                            ? "#d97706"
                            : "#334155",
                  }}
                >
                  {rank === 1
                    ? "🥇"
                    : rank === 2
                      ? "🥈"
                      : rank === 3
                        ? "🥉"
                        : rank}
                </div>
                <div>
                  <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>
                    {student.name}
                  </p>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>
                    {[student.city, student.state].filter(Boolean).join(", ") ||
                      "Student"}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{ color: "#fde68a", fontWeight: 700, fontSize: 15 }}
                >
                  🪙 {studentCoins} coins
                </div>
                <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                  ≈ ₹{coinsToRupees(studentCoins)}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default LeaderBoard;
