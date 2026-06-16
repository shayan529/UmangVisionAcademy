import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchAchievements,
  checkAndAwardAchievements,
  clearNewAchievements,
  markAchievementsViewed,
} from "../../redux/slices/achievementSlice";

const ALL_BADGES = [
  {
    id: "first_login",
    name: "Newbie Soldier",
    desc: "First time logging in",
    emoji: "🪖",
    color: "purple",
    rare: false,
    triggerKey: "firstLogin",
  },
  {
    id: "first_lesson",
    name: "First Lesson",
    desc: "Completed your first lesson",
    emoji: "📖",
    color: "teal",
    rare: false,
    triggerKey: "lessonsCompleted",
    threshold: 1,
  },
  {
    id: "quiz_champ",
    name: "Quiz Champ",
    desc: "Scored 100% on a quiz",
    emoji: "🏆",
    color: "amber",
    rare: false,
    triggerKey: "perfectQuiz",
  },
  {
    id: "early_bird",
    name: "Early Bird",
    desc: "Logged in before 7 AM",
    emoji: "🌅",
    color: "coral",
    rare: true,
    triggerKey: "earlyBird",
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    desc: "7-day login streak",
    emoji: "🔥",
    color: "coral",
    rare: false,
    triggerKey: "loginStreak",
    threshold: 7,
  },
  {
    id: "speed_reader",
    name: "Speed Reader",
    desc: "Finish a lesson in under 5 min",
    emoji: "⚡",
    color: "amber",
    rare: false,
    triggerKey: "speedLesson",
  },
  {
    id: "top_of_class",
    name: "Top of Class",
    desc: "Rank #1 on a mock test",
    emoji: "👑",
    color: "amber",
    rare: false,
    triggerKey: "leaderboardFirst",
  },
  {
    id: "bookworm",
    name: "Bookworm",
    desc: "Complete 10 text lessons",
    emoji: "🐛",
    color: "green",
    rare: false,
    triggerKey: "textLessons",
    threshold: 10,
  },
  {
    id: "test_titan",
    name: "Test Titan",
    desc: "Finish 5 mock tests",
    emoji: "📝",
    color: "blue",
    rare: false,
    triggerKey: "mockTestsCompleted",
    threshold: 5,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    desc: "Study session after 10 PM",
    emoji: "🦉",
    color: "blue",
    rare: false,
    triggerKey: "nightStudy",
  },
  {
    id: "full_marks",
    name: "Full Marks",
    desc: "Perfect score in any subject",
    emoji: "💯",
    color: "pink",
    rare: true,
    triggerKey: "fullMarks",
  },
  {
    id: "legend",
    name: "Legend",
    desc: "Earn all other badges",
    emoji: "🌟",
    color: "amber",
    rare: true,
    triggerKey: "allBadges",
  },
];

const COLOR_MAP = {
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-800",
    ring: "ring-purple-200",
  },
  teal: { bg: "bg-teal-50", text: "text-teal-800", ring: "ring-teal-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-800", ring: "ring-amber-200" },
  coral: {
    bg: "bg-orange-50",
    text: "text-orange-800",
    ring: "ring-orange-200",
  },
  green: { bg: "bg-green-50", text: "text-green-800", ring: "ring-green-200" },
  blue: { bg: "bg-blue-50", text: "text-blue-800", ring: "ring-blue-200" },
  pink: { bg: "bg-pink-50", text: "text-pink-800", ring: "ring-pink-200" },
};

/* ─── Badge card ─── */
function BadgeCard({ badge, earned, earnedDate }) {
  const colors = COLOR_MAP[badge.color] ?? COLOR_MAP.purple;

  return (
    <div
      className={`relative flex flex-col items-center text-center rounded-xl border px-4 py-5 transition-all duration-200
        ${
          earned
            ? "border-gray-200 bg-white shadow-sm hover:shadow-md"
            : "border-gray-100 bg-gray-50 opacity-50"
        }`}
    >
      {/* Icon circle */}
      <div
        className={`relative flex items-center justify-center w-16 h-16 rounded-full text-3xl mb-3 ring-2
          ${colors.bg} ${colors.ring}`}
      >
        {badge.emoji}
        {earned && (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white text-white text-[10px]">
            ✓
          </span>
        )}
      </div>

      {/* Name + desc */}
      <p className="text-sm font-medium text-gray-800 mb-0.5 leading-tight">
        {badge.name}
      </p>
      <p className="text-xs text-gray-500 mb-2 leading-snug">{badge.desc}</p>

      {/* Status pill */}
      {earned ? (
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
          ✓ Earned{earnedDate ? ` · ${earnedDate}` : ""}
        </span>
      ) : badge.rare ? (
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
          ⭐ Rare
        </span>
      ) : (
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
          Locked
        </span>
      )}
    </div>
  );
}

/* ─── Main Achievements component ─── */
export default function Achievements() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { earnedBadges, totalEarned, newAchievements, loading } = useSelector(
    (state) => state.achievements,
  );

  const [filter, setFilter] = useState("all");
  const [showBanner, setShowBanner] = useState(true);
  const [dismissedToasts, setDismissedToasts] = useState(new Set());

  // Fetch achievements on mount
  useEffect(() => {
    dispatch(fetchAchievements());
  }, [dispatch]);

  // Show toast notifications for newly earned achievements
  useEffect(() => {
    if (newAchievements && newAchievements.length > 0) {
      newAchievements.forEach((badgeId) => {
        if (!dismissedToasts.has(badgeId)) {
          const badge = ALL_BADGES.find((b) => b.id === badgeId);
          if (badge) {
            toast.custom(
              (t) => (
                <div
                  className={`bg-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 transform transition-all duration-300 max-w-sm
                    ${
                      t.visible
                        ? "translate-x-0 opacity-100"
                        : "translate-x-full opacity-0"
                    }
                    `}
                  style={{
                    position: "relative",
                  }}
                >
                  <span className="text-2xl">{badge.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      🎉 New Badge Unlocked!
                    </p>
                    <p className="text-sm text-gray-600">{badge.name}</p>
                  </div>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              ),
              {
                position: "bottom-right",
                duration: 5000,
              },
            );

            // Mark as dismissed
            setDismissedToasts((prev) => new Set(prev).add(badgeId));
          }
        }
      });

      // Mark achievements as viewed
      if (newAchievements.length > 0) {
        dispatch(markAchievementsViewed(newAchievements));
      }

      // Clear new achievements from Redux after showing toasts
      setTimeout(() => {
        dispatch(clearNewAchievements());
      }, 1000);
    }
  }, [newAchievements, dispatch, dismissedToasts]);

  // Build earned set from Redux state
  const earnedSet = new Set(Object.keys(earnedBadges));
  const earnedCount = earnedSet.size;
  const totalCount = ALL_BADGES.length;
  const rareEarned = ALL_BADGES.filter(
    (b) => b.rare && earnedSet.has(b.id),
  ).length;
  const progressPct = Math.round((earnedCount / totalCount) * 100);

  /* Most recently unlocked (for banner) */
  const latestBadge = Array.from(earnedSet)
    .map((badgeId) => ({
      ...ALL_BADGES.find((b) => b.id === badgeId),
      earnedAt: earnedBadges[badgeId]?.earnedAt,
    }))
    .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))[0];

  const tabs = [
    { key: "all", label: "All" },
    { key: "earned", label: "Earned" },
    { key: "locked", label: "Locked" },
  ];

  const visible = ALL_BADGES.filter((b) =>
    filter === "all"
      ? true
      : filter === "earned"
        ? earnedSet.has(b.id)
        : !earnedSet.has(b.id),
  );

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading achievements...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* ── New badge banner ── */}
      {showBanner && latestBadge && (
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mb-5">
          <span className="text-2xl">{latestBadge.emoji}</span>
          <p className="text-sm text-purple-800 flex-1">
            <span className="font-medium">New badge unlocked!</span> You just
            earned <em>{latestBadge.name}</em> — keep it up!
          </p>
          <button
            onClick={() => setShowBanner(false)}
            className="text-purple-400 hover:text-purple-700 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-medium text-gray-900">My achievements</h2>
        <span className="text-sm text-gray-500">
          {earnedCount} of {totalCount} earned
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-purple-600 rounded-full transition-all duration-700"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { val: earnedCount, lbl: "Badges earned" },
          { val: totalCount - earnedCount, lbl: "To unlock" },
          { val: rareEarned, lbl: "Rare earned" },
        ].map(({ val, lbl }) => (
          <div key={lbl} className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-2xl font-medium text-gray-900">{val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{lbl}</p>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors
              ${
                filter === t.key
                  ? "bg-purple-50 border-purple-500 text-purple-800 font-medium"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Badge grid ── */}
      {visible.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          No badges here yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visible.map((badge) => {
            const earnedData = earnedBadges[badge.id];
            const earnedDate = earnedData
              ? new Date(earnedData.earnedAt).toLocaleDateString()
              : null;
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                earned={earnedSet.has(badge.id)}
                earnedDate={earnedDate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
