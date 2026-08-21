import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

// ── Hero Photo Image Slider Carousel (Mobile View — 100% Full-Screen Edge-to-Edge) ───
const HERO_PHOTO_SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop",
    badge: "MP BOARD 2026",
    title: "Class 9th – 12th Admissions Open",
    subtitle: "Complete syllabus coverage for Science, Maths, Biology & Chemistry.",
    cta: "Start Learning",
  },
  {
    url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1200&auto=format&fit=crop",
    badge: "CBSE & ICSE EXCELLENCE",
    title: "NCERT & Concept Mastery Batches",
    subtitle: "Interactive live classes, PDF notes & 24/7 AI doubt support.",
    cta: "Explore Courses",
  },
  {
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    badge: "SMART LEARNING",
    title: "Unlimited Practice & Mock Tests",
    subtitle: "Chapter-wise quizzes, solved PYQs, and performance analytics.",
    cta: "Start Practice",
  },
  {
    url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
    badge: "COMPETITIVE EXAMS",
    title: "JEE & NEET Foundation Prep",
    subtitle: "Concept building & speed acceleration for top ranks.",
    cta: "View Batches",
  },
  {
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
    badge: "FREE AI COACHING",
    title: "Empowering Every Student",
    subtitle: "AI tutors and interactive guidance for learners across India.",
    cta: "Join Now",
  },
];

const HeroPhotoSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_PHOTO_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_PHOTO_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_PHOTO_SLIDES.length) % HERO_PHOTO_SLIDES.length);
  };

  return (
    <div
      className="relative w-full h-[calc(100vh-64px)] min-h-[480px] max-h-[640px] overflow-hidden rounded-none bg-slate-950 shadow-2xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {HERO_PHOTO_SLIDES.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Full-Bleed Background Image */}
          <img
            src={slide.url}
            alt={slide.title}
            className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-1000"
          />

          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/65 to-black/30" />

          {/* Text Overlay */}
          <div className="absolute bottom-7 left-5 right-5 z-20 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 text-[10.5px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span>{slide.badge}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              {slide.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {slide.subtitle}
            </p>

            <div className="pt-1 flex items-center gap-3">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-500/30 transition-transform active:scale-95 cursor-pointer uppercase tracking-wider"
              >
                <span>{slide.cta}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Chevron Buttons */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous Slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-slate-950/80 border border-white/20 text-white flex items-center justify-center hover:bg-emerald-600 transition-all backdrop-blur-md cursor-pointer text-2xl font-bold"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={handleNext}
        aria-label="Next Slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-slate-950/80 border border-white/20 text-white flex items-center justify-center hover:bg-emerald-600 transition-all backdrop-blur-md cursor-pointer text-2xl font-bold"
      >
        ›
      </button>

      {/* Indicator Dots */}
      <div className="absolute bottom-4 right-5 z-30 flex items-center gap-1.5">
        {HERO_PHOTO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentSlide ? "w-6 bg-emerald-400" : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

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

      {/* ══════════════════════ MOBILE LAYOUT (< md) — 100% Full-Screen Edge-to-Edge ══════════════════════ */}
      <div className="relative md:hidden w-full p-0 overflow-hidden">
        <HeroPhotoSlider />
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