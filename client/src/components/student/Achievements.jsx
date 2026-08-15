import { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchAchievements,
  clearNewAchievements,
  markAchievementsViewed,
} from "../../redux/slices/achievementSlice";

/* ─── Badge roster ───
   `tone` drives the accent color, `code` is the service-record serial
   shown on each card, `threshold` (when present) is the count needed. */
const ALL_BADGES = [
  {
    id: "first_login",
    code: "B-01",
    name: "Newbie Soldier",
    desc: "First time logging in",
    emoji: "🪖",
    tone: "steel",
    rare: false,
    triggerKey: "firstLogin",
  },
  {
    id: "first_lesson",
    code: "B-02",
    name: "First Lesson",
    desc: "Completed your first lesson",
    emoji: "📖",
    tone: "olive",
    rare: false,
    triggerKey: "lessonsCompleted",
    threshold: 1,
  },
  {
    id: "quiz_champ",
    code: "B-03",
    name: "Quiz Champ",
    desc: "Scored 100% on a quiz",
    emoji: "🏆",
    tone: "brass",
    rare: false,
    triggerKey: "perfectQuiz",
  },
  {
    id: "early_bird",
    code: "B-04",
    name: "Early Bird",
    desc: "Logged in before 7 AM",
    emoji: "🌅",
    tone: "rust",
    rare: true,
    triggerKey: "earlyBird",
  },
  {
    id: "week_warrior",
    code: "B-05",
    name: "Week Warrior",
    desc: "7-day login streak",
    emoji: "🔥",
    tone: "rust",
    rare: false,
    triggerKey: "loginStreak",
    threshold: 7,
  },
  {
    id: "speed_reader",
    code: "B-06",
    name: "Speed Reader",
    desc: "Finish a lesson in under 5 min",
    emoji: "⚡",
    tone: "brass",
    rare: false,
    triggerKey: "speedLesson",
  },
  {
    id: "top_of_class",
    code: "B-07",
    name: "Top of Class",
    desc: "Rank #1 on a mock test",
    emoji: "👑",
    tone: "brass",
    rare: false,
    triggerKey: "leaderboardFirst",
  },
  {
    id: "bookworm",
    code: "B-08",
    name: "Bookworm",
    desc: "Complete 10 text lessons",
    emoji: "🐛",
    tone: "olive",
    rare: false,
    triggerKey: "textLessons",
    threshold: 10,
  },
  {
    id: "test_titan",
    code: "B-09",
    name: "Test Titan",
    desc: "Finish 5 mock tests",
    emoji: "📝",
    tone: "steel",
    rare: false,
    triggerKey: "mockTestsCompleted",
    threshold: 5,
  },
  {
    id: "night_owl",
    code: "B-10",
    name: "Night Owl",
    desc: "Study session after 10 PM",
    emoji: "🦉",
    tone: "steel",
    rare: false,
    triggerKey: "nightStudy",
  },
  {
    id: "full_marks",
    code: "B-11",
    name: "Full Marks",
    desc: "Perfect score in any subject",
    emoji: "💯",
    tone: "rust",
    rare: true,
    triggerKey: "fullMarks",
  },
  {
    id: "legend",
    code: "B-12",
    name: "Legend",
    desc: "Earn all other badges",
    emoji: "🌟",
    tone: "brass",
    rare: true,
    triggerKey: "allBadges",
  },
];

const TONES = {
  brass: { bar: "bg-[var(--brass)]", ring: "ring-[var(--brass)]/35", chip: "bg-[var(--brass)]/12 text-[var(--brass-deep)]" },
  olive: { bar: "bg-[var(--olive)]", ring: "ring-[var(--olive)]/35", chip: "bg-[var(--olive)]/12 text-[var(--olive)]" },
  rust: { bar: "bg-[var(--rust)]", ring: "ring-[var(--rust)]/35", chip: "bg-[var(--rust)]/12 text-[var(--rust)]" },
  steel: { bar: "bg-[var(--steel)]", ring: "ring-[var(--steel)]/35", chip: "bg-[var(--steel)]/12 text-[var(--steel)]" },
};

/* Rank titles derived from total badge count (12 badges total). */
const RANK_TIERS = [
  { min: 0, title: "Recruit" },
  { min: 2, title: "Cadet" },
  { min: 5, title: "Officer" },
  { min: 8, title: "Veteran" },
  { min: 11, title: "Legend" },
];

function getRank(count) {
  let idx = 0;
  RANK_TIERS.forEach((tier, i) => {
    if (count >= tier.min) idx = i;
  });
  return { ...RANK_TIERS[idx], index: idx };
}

/* ─── Badge card ─── */
function BadgeCard({ badge, earned, earnedDate, progressValue, onOpen }) {
  const tone = TONES[badge.tone] ?? TONES.steel;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${badge.name} — ${earned ? "earned" : "locked"}. ${badge.desc}`}
      onClick={() => onOpen(badge)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(badge);
        }
      }}
      className={`group relative flex flex-col items-center text-center rounded-lg border px-4 pt-6 pb-4 cursor-pointer
        transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2
        ${earned
          ? "border-[var(--ink)]/10 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5"
          : "border-[var(--ink)]/5 bg-[var(--paper)]/60 opacity-70 hover:opacity-90"
        }`}
    >
      {/* Top accent bar reads as a ribbon */}
      <span className={`absolute top-0 left-3 right-3 h-1 rounded-b-sm ${tone.bar} ${earned ? "opacity-100" : "opacity-30"}`} />

      {/* Serial code */}
      <span className="absolute top-2 right-2 font-mono text-[9px] tracking-wider text-[var(--ink)]/35">
        {badge.code}
      </span>

      {/* Icon circle */}
      <div className={`relative flex items-center justify-center w-14 h-14 rounded-full text-2xl mb-3 ring-2 bg-white ${tone.ring} ${!earned && "grayscale"}`}>
        {badge.emoji}
        {earned && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 w-[18px] h-[18px] bg-[var(--olive)] rounded-full flex items-center justify-center border-2 border-white text-white text-[9px]">
            ✓
          </span>
        )}
        {!earned && badge.rare && (
          <span className="absolute -top-1 -right-1 text-xs" aria-hidden="true">🔒</span>
        )}
      </div>

      <p className="text-sm font-semibold text-[var(--ink)] mb-0.5 leading-tight">
        {badge.name}
      </p>
      <p className="text-xs text-[var(--ink)]/55 mb-2 leading-snug">{badge.desc}</p>

      {/* Progress hint for locked, thresholded badges — only renders if the app supplies live progress data */}
      {!earned && badge.threshold && typeof progressValue === "number" && (
        <div className="w-full mb-2">
          <div className="h-1 w-full rounded-full bg-[var(--ink)]/10 overflow-hidden">
            <div
              className={`h-full rounded-full ${tone.bar}`}
              style={{ width: `${Math.min(100, Math.round((progressValue / badge.threshold) * 100))}%` }}
            />
          </div>
          <p className="mt-1 font-mono text-[9px] text-[var(--ink)]/45">
            {Math.min(progressValue, badge.threshold)}/{badge.threshold}
          </p>
        </div>
      )}

      {earned ? (
        <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--olive)]/10 text-[var(--olive)] font-medium">
          EARNED{earnedDate ? ` · ${earnedDate}` : ""}
        </span>
      ) : badge.rare ? (
        <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--rust)]/10 text-[var(--rust)] font-medium">
          RARE
        </span>
      ) : (
        <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--ink)]/8 text-[var(--ink)]/45 font-medium">
          LOCKED
        </span>
      )}
    </div>
  );
}

/* ─── Badge detail modal ─── */
function BadgeModal({ badge, earned, earnedDate, progressValue, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!badge) return null;
  const tone = TONES[badge.tone] ?? TONES.steel;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--ink)]/60 backdrop-blur-sm px-4 uva-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={badge.name}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <span className={`absolute top-0 left-6 right-6 h-1.5 rounded-b-sm ${tone.bar}`} />
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-3 right-3 text-[var(--ink)]/40 hover:text-[var(--ink)] text-lg leading-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] rounded outline-none"
          aria-label="Close"
        >
          ×
        </button>

        <div className="flex flex-col items-center text-center pt-3">
          <div className={`flex items-center justify-center w-20 h-20 rounded-full text-4xl mb-4 ring-2 bg-white ${tone.ring} ${!earned && "grayscale"}`}>
            {badge.emoji}
          </div>
          <p className="font-mono text-[10px] tracking-wider text-[var(--ink)]/35 mb-1">{badge.code}</p>
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">{badge.name}</h3>
          <p className="text-sm text-[var(--ink)]/60 mb-4">{badge.desc}</p>

          {earned ? (
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-[var(--olive)]/10 text-[var(--olive)] font-medium">
              EARNED{earnedDate ? ` · ${earnedDate}` : ""}
            </span>
          ) : (
            <div className="w-full">
              {badge.threshold && typeof progressValue === "number" ? (
                <>
                  <div className="h-1.5 w-full rounded-full bg-[var(--ink)]/10 overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${Math.min(100, Math.round((progressValue / badge.threshold) * 100))}%` }}
                    />
                  </div>
                  <p className="font-mono text-xs text-[var(--ink)]/45">
                    {Math.min(progressValue, badge.threshold)} of {badge.threshold}
                  </p>
                </>
              ) : (
                <span className={`font-mono text-xs px-3 py-1 rounded-full font-medium ${badge.rare ? "bg-[var(--rust)]/10 text-[var(--rust)]" : "bg-[var(--ink)]/8 text-[var(--ink)]/45"}`}>
                  {badge.rare ? "RARE · NOT YET EARNED" : "NOT YET EARNED"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Achievements component ─── */
export default function Achievements() {
  const dispatch = useDispatch();
  const { earnedBadges, newAchievements, loading } = useSelector(
    (state) => state.achievements,
  );
  // Optional: only renders progress bars if the slice supplies this shape.
  const progressMap = useSelector((state) => state.achievements?.progress) || {};

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [dismissedBannerFor, setDismissedBannerFor] = useState(null);
  const [activeBadge, setActiveBadge] = useState(null);
  const toastedRef = useRef(new Set());

  useEffect(() => {
    dispatch(fetchAchievements());
  }, [dispatch]);

  // Toast newly-earned badges. Uses a ref (not state) to track which ids
  // have already toasted, so this effect never re-triggers itself.
  useEffect(() => {
    if (!newAchievements || newAchievements.length === 0) return;

    newAchievements
      .filter((badgeId) => !toastedRef.current.has(badgeId))
      .forEach((badgeId) => {
        toastedRef.current.add(badgeId);
        const badge = ALL_BADGES.find((b) => b.id === badgeId);
        if (!badge) return;
        toast.custom(
          (t) => (
            <div
              className={`flex items-center gap-3 rounded-lg border border-[var(--brass)]/40 bg-[var(--ink)] px-4 py-3 shadow-lg max-w-sm transition-all duration-300
                ${t.visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
            >
              <span className="text-2xl">{badge.emoji}</span>
              <div className="flex-1">
                <p className="font-mono text-[10px] tracking-wider text-[var(--brass)]">
                  COMMENDATION EARNED
                </p>
                <p className="text-sm font-medium text-white">{badge.name}</p>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-white/40 hover:text-white"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ),
          { position: "bottom-right", duration: 5000 },
        );
      });

    dispatch(markAchievementsViewed(newAchievements));
    const timer = setTimeout(() => dispatch(clearNewAchievements()), 1000);
    return () => clearTimeout(timer);
  }, [newAchievements, dispatch]);

  const earnedSet = useMemo(() => new Set(Object.keys(earnedBadges || {})), [earnedBadges]);
  const earnedCount = earnedSet.size;
  const totalCount = ALL_BADGES.length;
  const rareEarned = ALL_BADGES.filter((b) => b.rare && earnedSet.has(b.id)).length;
  const progressPct = totalCount ? Math.round((earnedCount / totalCount) * 100) : 0;

  const rank = getRank(earnedCount);
  const nextTier = RANK_TIERS[rank.index + 1];
  const rankPct = nextTier
    ? Math.min(100, Math.round(((earnedCount - rank.min) / (nextTier.min - rank.min)) * 100))
    : 100;

  const latestBadge = useMemo(() => {
    return Array.from(earnedSet)
      .map((badgeId) => ({
        ...ALL_BADGES.find((b) => b.id === badgeId),
        earnedAt: earnedBadges[badgeId]?.earnedAt,
      }))
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))[0];
  }, [earnedSet, earnedBadges]);

  const showBanner = latestBadge && dismissedBannerFor !== latestBadge.id;

  // Ribbon rack: most recent earned badges, small and dense, like a service record.
  const ribbonRack = useMemo(() => {
    return Array.from(earnedSet)
      .map((badgeId) => ({
        ...ALL_BADGES.find((b) => b.id === badgeId),
        earnedAt: earnedBadges[badgeId]?.earnedAt,
      }))
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
  }, [earnedSet, earnedBadges]);

  const tabs = [
    { key: "all", label: "All" },
    { key: "earned", label: "Earned" },
    { key: "locked", label: "Locked" },
    { key: "rare", label: "Rare" },
  ];

  const visible = useMemo(() => {
    let list = ALL_BADGES.filter((b) => {
      if (filter === "earned" && !earnedSet.has(b.id)) return false;
      if (filter === "locked" && earnedSet.has(b.id)) return false;
      if (filter === "rare" && !b.rare) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!b.name.toLowerCase().includes(q) && !b.desc.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "rarity") {
      list = [...list].sort((a, b) => Number(b.rare) - Number(a.rare));
    } else {
      list = [...list].sort((a, b) => {
        const aE = earnedBadges[a.id]?.earnedAt;
        const bE = earnedBadges[b.id]?.earnedAt;
        if (aE && bE) return new Date(bE) - new Date(aE);
        if (aE) return -1;
        if (bE) return 1;
        return 0;
      });
    }
    return list;
  }, [filter, search, sortBy, earnedSet, earnedBadges]);

  const rootStyle = {
    "--ink": "#17233A",
    "--paper": "#EDE9DA",
    "--brass": "#A98249",
    "--brass-deep": "#7E5F32",
    "--olive": "#55603F",
    "--rust": "#A23E2C",
    "--steel": "#5C6B7A",
  };

  return (
    <div className="p-3 sm:p-6" style={rootStyle}>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .uva-glow { animation: uva-glow 2.4s ease-in-out infinite; }
          .uva-fade-in { animation: uva-fade-in 0.15s ease-out; }
        }
        @keyframes uva-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(169,130,73,0.35); }
          50% { box-shadow: 0 0 0 8px rgba(169,130,73,0); }
        }
        @keyframes uva-fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }
      `}</style>

      {/* Screen-reader status */}
      <p className="sr-only" role="status">
        {earnedCount} of {totalCount} badges earned, rank {rank.title}.
      </p>

      {/* ── New commendation banner ── */}
      {showBanner && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--brass)]/30 bg-[var(--brass)]/8 px-4 py-3 mb-5">
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-xl uva-glow">
            {latestBadge.emoji}
          </span>
          <p className="text-sm text-[var(--brass-deep)] flex-1">
            <span className="font-semibold">New commendation.</span> You earned{" "}
            <em className="not-italic font-medium">{latestBadge.name}</em> — keep it up.
          </p>
          <button
            onClick={() => setDismissedBannerFor(latestBadge.id)}
            className="text-[var(--brass-deep)]/50 hover:text-[var(--brass-deep)] text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Service record header ── */}
      <div className="rounded-xl bg-[var(--ink)] text-white px-5 py-4 mb-5">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <p className="font-mono text-[10px] tracking-wider text-[var(--brass)] mb-0.5">RANK</p>
            <h2 className="text-lg font-semibold">{rank.title}</h2>
          </div>
          <span className="font-mono text-xs text-white/60">
            {earnedCount} / {totalCount} badges
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--brass)] transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="font-mono text-[10px] text-white/40 mt-1.5">
          {nextTier ? `${rankPct}% to ${nextTier.title}` : "Top rank reached"}
        </p>
      </div>

      {/* ── Ribbon rack (recent earns, most recent first) ── */}
      <div className="mb-5">
        <p className="font-mono text-[10px] tracking-wider text-[var(--ink)]/40 mb-2">SERVICE RECORD</p>
        {ribbonRack.length === 0 ? (
          <p className="text-xs text-[var(--ink)]/40">No ribbons on record yet — complete a lesson to earn your first.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {ribbonRack.map((b) => (
              <span
                key={b.id}
                title={`${b.name} — earned ${b.earnedAt ? new Date(b.earnedAt).toLocaleDateString() : ""}`}
                className={`inline-block w-6 h-2.5 rounded-[2px] ${(TONES[b.tone] ?? TONES.steel).bar}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { val: earnedCount, lbl: "Badges earned" },
          { val: totalCount - earnedCount, lbl: "To unlock" },
          { val: rareEarned, lbl: "Rare earned" },
        ].map(({ val, lbl }) => (
          <div key={lbl} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3">
            <p className="text-2xl font-semibold text-white">{val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{lbl}</p>
          </div>
        ))}
      </div>

      {/* ── Controls: search, filter tabs, sort ── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors
                ${filter === t.key
                  ? "bg-[var(--brass)]/20 border-[var(--brass)] text-[var(--brass)] font-medium"
                  : "border-white/15 text-slate-400 hover:border-white/30 hover:text-slate-300"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search badges…"
          aria-label="Search badges"
          className="ml-auto text-sm px-3 py-1.5 rounded-full border border-white/15 bg-transparent text-slate-200 placeholder:text-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] w-40 sm:w-48"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort badges"
          className="text-sm px-3 py-1.5 rounded-full border border-white/15 bg-slate-950 text-slate-300 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]"
        >
          <option value="recent">Recently earned</option>
          <option value="name">Name A–Z</option>
          <option value="rarity">Rarity</option>
        </select>
      </div>

      {/* ── Badge grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-[var(--ink)]/5 bg-[var(--paper)]/40 px-4 pt-6 pb-4 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-[var(--ink)]/10 mx-auto mb-3" />
              <div className="h-3 w-2/3 bg-[var(--ink)]/10 rounded mx-auto mb-2" />
              <div className="h-2.5 w-4/5 bg-[var(--ink)]/10 rounded mx-auto" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-14">
          <p className="text-sm text-[var(--ink)]/45 mb-2">No entries match this filter.</p>
          <button
            onClick={() => { setFilter("all"); setSearch(""); }}
            className="font-mono text-xs px-3 py-1.5 rounded-full border border-[var(--ink)]/15 text-[var(--ink)]/60 hover:border-[var(--ink)]/30"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visible.map((badge) => {
            const earnedData = earnedBadges[badge.id];
            const earnedDate = earnedData ? new Date(earnedData.earnedAt).toLocaleDateString() : null;
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                earned={earnedSet.has(badge.id)}
                earnedDate={earnedDate}
                progressValue={progressMap[badge.triggerKey]}
                onOpen={setActiveBadge}
              />
            );
          })}
        </div>
      )}

      {activeBadge && (
        <BadgeModal
          badge={activeBadge}
          earned={earnedSet.has(activeBadge.id)}
          earnedDate={
            earnedBadges[activeBadge.id]
              ? new Date(earnedBadges[activeBadge.id].earnedAt).toLocaleDateString()
              : null
          }
          progressValue={progressMap[activeBadge.triggerKey]}
          onClose={() => setActiveBadge(null)}
        />
      )}
    </div>
  );
}