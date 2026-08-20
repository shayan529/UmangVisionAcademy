import React from "react";
import { useTranslation } from "react-i18next";
import { Star, Quote, Sparkles, ShieldCheck, GraduationCap, Award } from "lucide-react";

const testimonials = [
  {
    nameKey: "testimonials.items.priya.name",
    defaultName: "Priya Sharma",
    quoteKey: "testimonials.items.priya.quote",
    defaultQuote:
      "Transformed my learning experience in 6 months — the interactive video lectures and doubt-solving sessions are top notch!",
    role: "Class 10 CBSE",
    metric: "98.4% Scored",
    initials: "PS",
    gradient: "from-indigo-600 to-purple-600",
    rating: 5,
    featured: true,
  },
  {
    nameKey: "testimonials.items.rohan.name",
    defaultName: "Rohan Gupta",
    quoteKey: "testimonials.items.rohan.quote",
    defaultQuote:
      "The AI quiz generator and mock test analytics allowed me to pinpoint my weaknesses and boost my scores significantly.",
    role: "Class 11",
    metric: "NEET Aspirant",
    initials: "RG",
    gradient: "from-amber-600 to-orange-600",
    rating: 5,
  },
  {
    nameKey: "testimonials.items.ananya.name",
    defaultName: "Ananya Roy",
    quoteKey: "testimonials.items.ananya.quote",
    defaultQuote:
      "Learning in both Hindi and English made complex physics and math concepts so much easier to understand.",
    role: "Class 10 ICSE",
    metric: "96.8% Scored",
    initials: "AR",
    gradient: "from-pink-600 to-rose-600",
    rating: 5,
  },
];

const StarRow = ({ count }) => (
  <div className="flex items-center gap-1">
    {[...Array(count)].map((_, idx) => (
      <Star key={idx} size={15} className="text-amber-400 fill-amber-400" />
    ))}
  </div>
);

const Testimonials = () => {
  const { t } = useTranslation();
  const [featured, ...rest] = testimonials;

  return (
    <section className="relative px-4 sm:px-10 py-8 sm:py-12 bg-[#0B1120] overflow-hidden text-slate-100">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[200px] bg-amber-500/[0.06] rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles size={13} className="text-indigo-400" />
            {t("testimonials.eyebrow", "Student Success Stories")}
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            {t("testimonials.heading", "What Our Students Say")}
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            {t(
              "testimonials.subheading",
              "Real stories and inspiring feedback from learners who achieved academic excellence with Umang Vision Academy."
            )}
          </p>
        </div>

        {/* Bento layout: one featured result card + two supporting cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Featured card */}
          <div className="lg:col-span-3 group relative flex flex-col justify-between rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#151F35] to-[#0F1729] p-4 sm:p-6 overflow-hidden transition-all duration-300 hover:border-amber-500/40 hover:shadow-[0_12px_30px_rgba(242,169,59,0.08)]">
            <Quote
              size={50}
              className="absolute -top-2 -left-2 text-amber-500/[0.07] pointer-events-none sm:w-[60px] sm:h-[60px]"
            />

            {/* Admit-card style verified seal */}
            <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 -rotate-6 flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-amber-400/40 text-amber-400 p-1">
              <ShieldCheck size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
              <span className="font-mono text-[6.5px] sm:text-[7px] font-bold tracking-widest mt-0.5">
                VERIFIED
              </span>
            </div>

            <div className="relative z-10 space-y-2.5 sm:space-y-3 pr-10 sm:pr-12">
              <StarRow count={featured.rating} />
              <p className="font-serif text-sm sm:text-base lg:text-lg text-slate-100 leading-snug">
                “{t(featured.quoteKey, featured.defaultQuote)}”
              </p>
            </div>

            <div className="relative z-10 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-800/80 flex items-center gap-3">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${featured.gradient} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md`}
              >
                {featured.initials}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-white text-xs truncate">
                  {t(featured.nameKey, featured.defaultName)}
                </h4>
                <p className="font-mono text-[9.5px] sm:text-[10px] text-amber-400/80 truncate mt-0.5 tracking-wide">
                  {featured.role} &middot; {featured.metric}
                </p>
              </div>
            </div>
          </div>

          {/* Supporting cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            {rest.map((item, i) => (
              <div
                key={i}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#111827]/80 p-3.5 sm:p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-[0_8px_20px_rgba(99,102,241,0.1)]"
              >
                <div className="space-y-2 relative z-10">
                  <StarRow count={item.rating} />
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    “{t(item.quoteKey, item.defaultQuote)}”
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center gap-3 relative z-10">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center font-bold text-white text-[10px] sm:text-[11px] shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                  >
                    {item.initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-xs truncate group-hover:text-indigo-300 transition-colors">
                      {t(item.nameKey, item.defaultName)}
                    </h4>
                    <p className="font-mono text-[9.5px] sm:text-[10px] text-slate-400 truncate mt-0.5 tracking-wide">
                      {item.role} &middot; {item.metric}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust metric strip */}
        <div className="pt-4 sm:pt-5 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-10 text-center font-mono">
          <div className="flex items-center gap-2">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-white font-bold text-xs">4.9 / 5</span>
            <span className="text-slate-500 text-[11px]">
              {t("testimonials.metrics.ratingSubtitle", "10,000+ learners")}
            </span>
          </div>
          <div className="hidden sm:block w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-2">
            <GraduationCap size={14} className="text-indigo-400" />
            <span className="text-white font-bold text-xs">95%+</span>
            <span className="text-slate-500 text-[11px]">
              {t("testimonials.metrics.passRateSubtitle", "board pass rate")}
            </span>
          </div>
          <div className="hidden sm:block w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-2">
            <Award size={14} className="text-emerald-400" />
            <span className="text-white font-bold text-xs">100%</span>
            <span className="text-slate-500 text-[11px]">
              {t("testimonials.metrics.verifiedSubtitle", "verified feedback")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;