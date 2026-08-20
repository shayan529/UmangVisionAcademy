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

  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);

  const handleCarouselScroll = (e) => {
    const el = e.target;
    const cardWidth = 200 + 12; // card width + gap-3 (12px)
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveSlide(Math.min(index, benefits.length - 1));
  };

  const fullText = t("hero.text");
  const langKey = i18n.language?.split("-")[0] || "en";
  const markers = {
    en: "Classes 9 to 12, Graduation, and Competitive Exams",
    hi: "कक्षा 9 से 12 तक, स्नातक, और प्रतियोगी परीक्षाओं",
  };
  const marker = markers[langKey] || markers.en;
  const shortText =
    fullText && fullText.includes(marker)
      ? fullText.substring(0, fullText.indexOf(marker) + marker.length) + "."
      : fullText;

  const benefits = [
    { title: t("hero.benefit1Title"), desc: t("hero.benefit1Desc"), icon: "🤖" },
    { title: t("hero.benefit2Title"), desc: t("hero.benefit2Desc"), icon: "🤝" },
    { title: t("hero.benefit3Title"), desc: t("hero.benefit3Desc"), icon: "⚡" },
  ];

  return (
    <section className="relative overflow-hidden text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.25),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.22),_transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.18),_transparent_25%),linear-gradient(135deg,#0f172a_0%,#1e1b4b_40%,#6d28d9_100%)]" />

      {/* ══════════════════════ MOBILE LAYOUT (< md) — app-screen style ══════════════════════ */}
      <div className="relative md:hidden px-4 sm:px-5 pt-[calc(env(safe-area-inset-top,0px)+14px)] pb-8 max-w-md mx-auto">
        <div className="flex flex-col gap-5">
          {/* TAG */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10.5px] sm:text-[11px] font-medium text-white/85 backdrop-blur-sm shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              {t("hero.tag")}
            </div>
          </div>

          {/* DECORATIVE VISUAL */}
          <div className="relative mx-auto mt-0.5 h-32 sm:h-36 w-full max-w-[240px] sm:max-w-[260px]">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-emerald-300/25 via-sky-300/15 to-purple-400/25 blur-2xl" />
            <div className="relative h-full w-full rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden flex items-center justify-center">
              <div className="absolute -left-1.5 top-2.5 h-11 w-11 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center text-lg -rotate-[10deg] shadow-lg">
                📘
              </div>
              <div className="absolute right-1 top-1 h-11 w-11 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center text-lg rotate-[12deg] shadow-lg">
                🔬
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-11 w-11 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center text-lg rotate-[6deg] shadow-lg">
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
                  width="48"
                  height="54"
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
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-violet-300/80" />
                <span className="absolute top-2 -left-2 h-1.5 w-1.5 rounded-full bg-sky-300/80" />
              </div>
            </div>
            {/* Floating stat pill overlapping the card edge */}
            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-950/90 border border-white/10 px-3 py-1 text-[10.5px] sm:text-[11px] font-semibold text-white shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              {t("hero.floatingBadge")}
            </div>
          </div>

          {/* HEADING */}
          <div className="text-center mt-1">
            <h1 className="font-black tracking-tight">
              <span className="block text-2xl sm:text-3xl leading-[1.2] text-white">
                {t("hero.headingLine1")}
              </span>
              <span className="block text-base sm:text-lg leading-[1.3] text-emerald-300 mt-1.5 tracking-normal">
                {t("hero.headingLine2")}
              </span>
            </h1>
            <p className="mt-2.5 text-slate-200 text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-sm mx-auto">
              {isMobile ? shortText : fullText}
            </p>
          </div>

          {/* CTAs — one solid action, one quiet text link (app-pattern, not two competing buttons) */}
          <div className="flex flex-col items-center gap-3 mt-0.5">
            <Link to="/my-courses" className="w-full">
              <button className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-6 py-3.5 text-slate-950 font-bold text-sm sm:text-[15px] shadow-lg shadow-emerald-300/25 active:scale-[0.97] transition cursor-pointer">
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
              <span className="text-xs sm:text-[13px] font-semibold text-white/75 underline underline-offset-4 decoration-white/30 active:text-white transition">
                {t("hero.exploreCourses")}
              </span>
            </Link>
          </div>

          {/* BENEFITS CAROUSEL */}
          <div className="mt-1 w-full overflow-hidden">
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {benefits.map((b, idx) => (
                <div
                  key={idx}
                  className="snap-center flex-shrink-0 w-[190px] sm:w-[200px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-3.5 py-3.5"
                >
                  <div className="text-lg sm:text-xl mb-1.5">{b.icon}</div>
                  <p className="text-xs font-bold text-emerald-300">{b.title}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-300">
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* DOTS */}
            <div className="mt-3 flex justify-center items-center gap-2">
              {benefits.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => {
                    const cardWidth = 200 + 12;
                    carouselRef.current?.scrollTo({
                      left: idx * cardWidth,
                      behavior: "smooth",
                    });
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ease-out cursor-pointer ${activeSlide === idx
                    ? "w-6 bg-gradient-to-r from-emerald-300 to-sky-300 shadow-[0_0_8px_rgba(110,231,183,0.6)]"
                    : "w-2 bg-white/25 hover:bg-white/40"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════ DESKTOP LAYOUT (>= md) ══════════════════════ */}
      <div className="relative hidden md:block max-w-[1400px] mx-auto px-6 md:px-12 xl:px-16 py-24 min-h-screen">
        <style>{`
          @keyframes heroFadeUp {
            from { opacity: 0; transform: translateY(22px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .hero-fade { animation: heroFadeUp .7s cubic-bezier(.22,.61,.36,1) both; }
          @media (prefers-reduced-motion: reduce) {
            .hero-fade { animation: none; }
          }
        `}</style>
        <div className="flex flex-col xl:flex-row items-start justify-between gap-16 xl:gap-20">
          {/* LEFT SIDE */}
          <div className="flex-1 space-y-10 max-w-4xl">
            {/* TAG */}
            <div
              className="hero-fade inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm shadow-lg shadow-slate-950/20"
              style={{ animationDelay: "0ms" }}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              {t("hero.tag")}
            </div>

            {/* HEADING */}
            <div className="space-y-6">
              <h1 className="font-black tracking-tight">
                <span
                  className="hero-fade block text-5xl md:text-6xl xl:text-7xl leading-tight text-white"
                  style={{ animationDelay: "90ms" }}
                >
                  {t("hero.headingLine1")}
                </span>
                <span
                  className="hero-fade block text-2xl md:text-3xl xl:text-4xl leading-snug text-emerald-300 mt-3 tracking-normal"
                  style={{ animationDelay: "180ms" }}
                >
                  {t("hero.headingLine2")}
                </span>
              </h1>

              <p
                className="hero-fade max-w-2xl text-slate-200 text-lg md:text-md leading-8"
                style={{ animationDelay: "270ms" }}
              >
                {t("hero.text")}
              </p>
            </div>

            {/* BUTTONS */}
            <div
              className="hero-fade flex flex-col sm:flex-row gap-4"
              style={{ animationDelay: "360ms" }}
            >
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

          {/* RIGHT SIDE BENEFITS */}
          <div className="grid w-full shrink-0 gap-5 xl:w-[360px]">
            {benefits.map((b, idx) => {
              const accent = ["#6ee7b7", "#a5b4fc", "#fcd34d"][idx % 3];
              return (
                <div
                  key={idx}
                  className="hero-fade group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl hover:shadow-black/20"
                  style={{ animationDelay: `${420 + idx * 130}ms` }}
                >
                  <div
                    className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{ background: `${accent}22` }}
                  >
                    {b.icon}
                  </div>
                  <p className="text-sm font-bold" style={{ color: accent }}>
                    {b.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;