import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const Hero = () => {
  const { t, i18n } = useTranslation();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const fullText = t("hero.text");
  const langKey = i18n.language?.split("-")[0] || "en";
  const markers = {
    en: "Classes 9 to 12",
    hi: "कक्षा 9 से 12 तक",
  };
  const marker = markers[langKey] || markers.en;
  const shortText =
    fullText && fullText.includes(marker)
      ? fullText.substring(0, fullText.indexOf(marker) + marker.length) + "."
      : fullText;

  // ── Stat carousel (mobile) ────────────────────────────────────────────────
  const stats = [
    { value: "200K+", label: t("hero.studentsWorldwide"), icon: "🎓" },
    { value: "10K+", label: t("hero.onlineCourses"), icon: "📚" },
    { value: "500+", label: t("hero.expertInstructors"), icon: "👨‍🏫" },
  ];
  const statsScrollRef = useRef(null);
  const [activeStat, setActiveStat] = useState(0);

  const handleStatsScroll = () => {
    const el = statsScrollRef.current;
    if (!el || !el.firstChild) return;
    const cardWidth = el.firstChild.offsetWidth + 12; // gap-3 = 12px
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveStat(Math.min(Math.max(idx, 0), stats.length - 1));
  };

  return (
    <section className="relative overflow-hidden text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.25),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.22),_transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.18),_transparent_25%),linear-gradient(135deg,#0f172a_0%,#1e1b4b_40%,#6d28d9_100%)]" />

      {/* ══════════════════════ MOBILE LAYOUT (< md) — app-screen style ══════════════════════ */}
      <div className="relative md:hidden px-5 pt-[calc(env(safe-area-inset-top,0px)+18px)] pb-9">
        <div className="flex flex-col gap-6">
          {/* TAG */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/85 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              {t("hero.tag")}
            </div>
          </div>

          {/* DECORATIVE VISUAL */}
          <div className="relative mx-auto mt-1 h-36 w-full max-w-[260px]">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-emerald-300/25 via-sky-300/15 to-purple-400/25 blur-2xl" />
            <div className="relative h-full w-full rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden flex items-center justify-center">
              <div className="absolute -left-2 top-3 h-12 w-12 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center text-xl -rotate-[10deg] shadow-lg">
                📘
              </div>
              <div className="absolute right-1 top-1 h-12 w-12 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center text-xl rotate-[12deg] shadow-lg">
                🔬
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-12 w-12 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center text-xl rotate-[6deg] shadow-lg">
                ➗
              </div>
              <div className="relative h-16 w-16 flex items-center justify-center">
                <style>{`
                  @keyframes uvGhostFloat {
                    0%, 100% { transform: translateY(0) rotate(-3deg); }
                    50% { transform: translateY(-5px) rotate(3deg); }
                  }
                `}</style>
                <svg
                  width="52"
                  height="58"
                  viewBox="0 0 56 64"
                  style={{ animation: "uvGhostFloat 3.2s ease-in-out infinite" }}
                  className="drop-shadow-[0_8px_16px_rgba(110,231,183,0.35)]"
                >
                  <defs>
                    <linearGradient id="ghostFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6ee7b7" />
                      <stop offset="100%" stopColor="#5eead4" />
                    </linearGradient>
                  </defs>
                  {/* jelly body */}
                  <path
                    d="M4,30 A24,24 0 0 1 52,30 L52,52 Q46,60 40,52 Q34,60 28,52 Q22,60 16,52 Q10,60 4,52 Z"
                    fill="url(#ghostFill)"
                  />
                  {/* glossy shine */}
                  <ellipse cx="18" cy="20" rx="8" ry="5" fill="#ffffff" opacity="0.35" />
                  {/* blush */}
                  <ellipse cx="12" cy="34" rx="3.5" ry="2.2" fill="#a78bfa" opacity="0.45" />
                  <ellipse cx="44" cy="34" rx="3.5" ry="2.2" fill="#a78bfa" opacity="0.45" />
                  {/* eyes */}
                  <circle cx="20" cy="30" r="3.2" fill="#1e1b4b" />
                  <circle cx="36" cy="30" r="3.2" fill="#1e1b4b" />
                  <circle cx="21.2" cy="28.8" r="1" fill="#fff" />
                  <circle cx="37.2" cy="28.8" r="1" fill="#fff" />
                  {/* smile */}
                  <path
                    d="M22,38 Q28,43 34,38"
                    stroke="#1e1b4b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                {/* sparkle accents */}
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-violet-300/80" />
                <span className="absolute top-2 -left-2 h-1.5 w-1.5 rounded-full bg-sky-300/80" />
              </div>
            </div>
            {/* Floating stat pill overlapping the card edge */}
            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-950/90 border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              200K+ {t("hero.studentsWorldwide")}
            </div>
          </div>

          {/* HEADING */}
          <div className="text-center mt-2">
            <h1 className="text-[34px] font-black tracking-tight leading-[1.08]">
              {t("hero.headingLine1")}
              <span className="block text-emerald-300 mt-1">
                {t("hero.headingLine2")}
              </span>
            </h1>
            <p className="mt-3 text-slate-200 text-[15px] leading-7 max-w-sm mx-auto">
              {isMobile ? shortText : fullText}
            </p>
          </div>

          {/* CTAs — one solid action, one quiet text link (app-pattern, not two competing buttons) */}
          <div className="flex flex-col items-center gap-3.5 mt-1">
            <Link to="/my-courses" className="w-full">
              <button className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-8 py-4 text-slate-950 font-bold text-[15px] shadow-lg shadow-emerald-300/25 active:scale-[0.97] transition">
                {t("hero.startLearning")}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </Link>
            <Link to="/courses">
              <span className="text-[13px] font-semibold text-white/75 underline underline-offset-4 decoration-white/30 active:text-white transition">
                {t("hero.exploreCourses")}
              </span>
            </Link>
          </div>

          {/* STAT CAROUSEL */}
          <div className="mt-2">
            <div
              ref={statsScrollRef}
              onScroll={handleStatsScroll}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="snap-center flex-shrink-0 w-[168px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-4"
                >
                  <div className="text-xl mb-1.5">{s.icon}</div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-slate-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {stats.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === activeStat
                      ? "w-4 bg-emerald-300"
                      : "w-1.5 bg-white/20"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════ DESKTOP LAYOUT (>= md) ══════════════════════ */}
      <div className="relative hidden md:block max-w-7xl mx-auto px-6 md:px-12 py-20 min-h-screen">
        <div className="flex flex-col xl:flex-row items-start justify-between gap-14">
          {/* LEFT SIDE */}
          <div className="flex-1 space-y-8 max-w-4xl">
            {/* TAG */}
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm shadow-lg shadow-slate-950/20">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              {t("hero.tag")}
            </div>

            {/* HEADING */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-tight">
                {t("hero.headingLine1")}
                <span className="block text-emerald-300">
                  {t("hero.headingLine2")}
                </span>
              </h1>

              <p className="max-w-2xl text-slate-200 text-lg md:text-md leading-8">
                {t("hero.text")}
              </p>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/my-courses" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex cursor-pointer items-center justify-center rounded-full bg-emerald-300 px-8 py-4 text-slate-950 font-semibold shadow-2xl shadow-emerald-300/25 transition duration-300 hover:scale-[1.02] hover:bg-emerald-200">
                  {t("hero.startLearning")}
                </button>
              </Link>

              <Link to="/courses" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-white font-semibold backdrop-blur-sm transition duration-300 hover:border-emerald-300 hover:text-emerald-300">
                  {t("hero.exploreCourses")}
                </button>
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE STATS */}
          <div className="grid w-full xl:w-[300px] gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-3xl font-bold">200K+</p>
              <p className="mt-1 text-sm text-slate-400">
                {t("hero.studentsWorldwide")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-3xl font-bold">10K+</p>
              <p className="mt-1 text-sm text-slate-400">
                {t("hero.onlineCourses")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-3xl font-bold">500+</p>
              <p className="mt-1 text-sm text-slate-400">
                {t("hero.expertInstructors")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;