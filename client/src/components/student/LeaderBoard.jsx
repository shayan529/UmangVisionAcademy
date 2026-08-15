import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeaderboard } from "../../redux/slices/studentSlice";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { getCitiesForState, INDIA_STATES } from "../../data/indiaLocations";

// ── LeaderBoard row — memoised so unchanged rows never re-render ──────────────
const LeaderRow = memo(({ student, rank, isCurrentUser, coinsToRupees, t }) => {
  const studentCoins = student.coins ?? 0;
  return (
    <div
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
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
        </div>
        <div>
          <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>
            {student.name}
          </p>
          <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>
            {[student.city, student.state].filter(Boolean).join(", ") ||
              t("studentLeaderboard.student")}
          </p>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "#fde68a", fontWeight: 700, fontSize: 15 }}>
          ⭐ {studentCoins} stars
        </div>
        <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
          ≈ ₹{coinsToRupees(studentCoins)}
        </div>
      </div>
    </div>
  );
});
LeaderRow.displayName = "LeaderRow";

// ── Constants ─────────────────────────────────────────────────────────────────
const COINS_PER_RUPEE = 25;
const coinsToRupees = (c) => (c / COINS_PER_RUPEE).toFixed(2);

// How many rows to render initially — the rest load on scroll
const INITIAL_VISIBLE = 50;

const LeaderBoard = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { leaderboard, leaderboardLoading } = useSelector((s) => s.students);
  const { user } = useSelector((s) => s.auth);

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  const currentUserId = user?._id ?? user?.id;

  const cities = useMemo(
    () => (selectedState ? getCitiesForState(selectedState) : []),
    [selectedState],
  );

  // Sort once — useMemo prevents a re-sort on every render caused by parent
  // state changes that have nothing to do with the leaderboard data.
  const rankedLeaderboard = useMemo(
    () =>
      [...(leaderboard ?? [])].sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0)),
    [leaderboard],
  );

  const filteredLeaderboard = useMemo(() => {
    if (!selectedState && !selectedCity) return rankedLeaderboard;
    return rankedLeaderboard.filter((s) => {
      const stateMatch = !selectedState || s.state === selectedState;
      const cityMatch = !selectedCity || s.city === selectedCity;
      return stateMatch && cityMatch;
    });
  }, [rankedLeaderboard, selectedState, selectedCity]);

  // Reset visible count when the filter changes
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [filteredLeaderboard]);

  const currentRank = useMemo(
    () =>
      rankedLeaderboard.findIndex(
        (s) => s._id === currentUserId || s.id === currentUserId,
      ) + 1,
    [rankedLeaderboard, currentUserId],
  );

  const myCoins = useMemo(() => {
    const me = rankedLeaderboard.find(
      (s) => s._id === currentUserId || s.id === currentUserId,
    );
    return me?.coins ?? 0;
  }, [rankedLeaderboard, currentUserId]);

  const COIN_ACTIVITIES = useMemo(
    () => [
      {
        icon: "📅",
        label: t("studentLeaderboard.dailyLogin"),
        coins: 1,
        desc: t("studentLeaderboard.dailyLoginDesc"),
      },
      {
        icon: "📚",
        label: t("studentLeaderboard.completeCourse"),
        coins: 25,
        desc: t("studentLeaderboard.completeCourseDesc"),
      },
      {
        icon: "🏆",
        label: t("studentLeaderboard.earnCertificate"),
        coins: 25,
        desc: t("studentLeaderboard.earnCertificateDesc"),
      },
      {
        icon: "🏅",
        label: t("studentLeaderboard.earnAchievements"),
        coins: "10-50",
        desc: t("studentLeaderboard.earnAchievementsDesc"),
      },
      {
        icon: "✉️",
        label: t("studentLeaderboard.inviteFriends"),
        coins: 50,
        desc: t("studentLeaderboard.inviteFriendsDesc"),
      },
    ],
    [t],
  );

  const handleStateChange = useCallback((e) => {
    setSelectedState(e.target.value);
    setSelectedCity("");
  }, []);

  const handleCityChange = useCallback((e) => {
    setSelectedCity(e.target.value);
  }, []);

  const togglePointsInfo = useCallback(
    () => setShowPointsInfo((prev) => !prev),
    [],
  );

  const closePointsInfo = useCallback(() => setShowPointsInfo(false), []);

  // Visible slice — render only what fits on screen initially; "load more"
  // on scroll prevents the DOM from having 500 nodes at once.
  const visibleRows = filteredLeaderboard.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLeaderboard.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((c) => c + 50);
  }, []);

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
            style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", margin: 0 }}
          >
            🏆 {t("studentLeaderboard.title")}
          </h2>
          <p style={{ color: "#64748b", marginTop: 6, fontSize: 14, margin: "6px 0 0" }}>
            {t("studentLeaderboard.subtitle")}
          </p>
        </div>

        {/* Rank + coin badge */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
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
            ⭐ {myCoins} stars
            <span style={{ color: "#fef9c3", fontWeight: 500, fontSize: 12 }}>
              (₹{coinsToRupees(myCoins)})
            </span>
            <button
              onClick={togglePointsInfo}
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

          {/* Rank badge */}
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
                onClick={togglePointsInfo}
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
              {t("studentLeaderboard.yourRank", {
                rank: currentRank > 0 ? currentRank : "—",
              })}
            </div>

            {/* Info modal — rendered via portal so it escapes any overflow:hidden parent */}
            {showPointsInfo &&
              createPortal(
                <div
                  onClick={closePointsInfo}
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
                          ⭐ {t("studentLeaderboard.howCoinsEarned")}
                        </h3>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                          {t("studentLeaderboard.completeActivities")}
                        </p>
                      </div>
                      <button
                        onClick={closePointsInfo}
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

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                          <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 700 }}>
                              {label}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
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
                            ⭐ +{coins}
                          </div>
                        </div>
                      ))}
                    </div>

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
                      <p style={{ margin: 0, fontSize: 13, color: "#c4b5fd", fontWeight: 700 }}>
                        ⭐ {t("studentLeaderboard.coinsConversion")}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#7c3aed" }}>
                        {t("studentLeaderboard.coinsRedeemHint")}
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
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select
          value={selectedState}
          onChange={handleStateChange}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "#0f172a",
            border: "1px solid #334155",
            color: "#fff",
            minWidth: 140,
            flex: "1 1 140px",
          }}
        >
          <option value="">{t("studentLeaderboard.allStates")}</option>
          {INDIA_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        <select
          value={selectedCity}
          onChange={handleCityChange}
          disabled={!selectedState}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "#0f172a",
            border: "1px solid #334155",
            color: "#fff",
            minWidth: 140,
            flex: "1 1 140px",
            opacity: selectedState ? 1 : 0.55,
            cursor: selectedState ? "pointer" : "not-allowed",
          }}
        >
          <option value="">
            {selectedState
              ? t("studentLeaderboard.allCities")
              : t("studentLeaderboard.selectStateFirst")}
          </option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Leaderboard list */}
      {leaderboardLoading ? (
        <div style={{ color: "#94a3b8" }}>{t("studentLeaderboard.loading")}</div>
      ) : visibleRows.length === 0 ? (
        <div style={{ color: "#94a3b8" }}>{t("studentLeaderboard.empty")}</div>
      ) : (
        <>
          {visibleRows.map((student) => {
            const rank =
              rankedLeaderboard.findIndex(
                (s) => s._id === student._id || s.id === student.id,
              ) + 1;
            const isCurrentUser =
              student._id === currentUserId || student.id === currentUserId;

            return (
              <LeaderRow
                key={student._id ?? student.id ?? rank}
                student={student}
                rank={rank}
                isCurrentUser={isCurrentUser}
                coinsToRupees={coinsToRupees}
                t={t}
              />
            );
          })}

          {/* Progressive load — avoids rendering 500 DOM nodes at once */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "12px",
                borderRadius: 12,
                background: "#0f172a",
                border: "1px solid #334155",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Show more ({filteredLeaderboard.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default LeaderBoard;
