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
    <section className="relative px-6 sm:px-10 py-20 bg-[#0B1120] overflow-hidden text-slate-100">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-amber-500/[0.06] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-14">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-indigo-400" />
            {t("testimonials.eyebrow", "Student Success Stories")}
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {t("testimonials.heading", "What Our Students Say")}
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            {t(
              "testimonials.subheading",
              "Real stories and inspiring feedback from learners who achieved academic excellence with Umang Vision Academy."
            )}
          </p>
        </div>

        {/* Bento layout: one featured result card + two supporting cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Featured card */}
          <div className="lg:col-span-3 group relative flex flex-col justify-between rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#151F35] to-[#0F1729] p-8 sm:p-10 overflow-hidden transition-all duration-300 hover:border-amber-500/40 hover:shadow-[0_20px_50px_rgba(242,169,59,0.08)]">
            <Quote
              size={80}
              className="absolute -top-3 -left-2 text-amber-500/[0.07] pointer-events-none"
            />

            {/* Admit-card style verified seal */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 -rotate-6 flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-dashed border-amber-400/40 text-amber-400">
              <ShieldCheck size={18} strokeWidth={2.5} />
              <span className="font-mono text-[8px] font-bold tracking-widest mt-0.5">
                VERIFIED
              </span>
            </div>

            <div className="relative z-10 space-y-5 pr-14">
              <StarRow count={featured.rating} />
              <p className="font-serif text-xl sm:text-2xl text-slate-100 leading-snug">
                “{t(featured.quoteKey, featured.defaultQuote)}”
              </p>
            </div>

            <div className="relative z-10 pt-8 mt-8 border-t border-slate-800/80 flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${featured.gradient} flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md`}
              >
                {featured.initials}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-white text-sm truncate">
                  {t(featured.nameKey, featured.defaultName)}
                </h4>
                <p className="font-mono text-[11px] text-amber-400/80 truncate mt-0.5 tracking-wide">
                  {featured.role} &middot; {featured.metric}
                </p>
              </div>
            </div>
          </div>

          {/* Supporting cards */}
          <div className="lg:col-span-2 grid grid-rows-2 gap-6">
            {rest.map((item, i) => (
              <div
                key={i}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-[#111827]/80 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-[0_12px_30px_rgba(99,102,241,0.12)]"
              >
                <div className="space-y-3 relative z-10">
                  <StarRow count={item.rating} />
                  <p className="text-slate-300 text-sm leading-relaxed">
                    “{t(item.quoteKey, item.defaultQuote)}”
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center gap-3 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                  >
                    {item.initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-xs truncate group-hover:text-indigo-300 transition-colors">
                      {t(item.nameKey, item.defaultName)}
                    </h4>
                    <p className="font-mono text-[10px] text-slate-400 truncate mt-0.5 tracking-wide">
                      {item.role} &middot; {item.metric}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust metric strip — editorial, exam-ticket style */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center font-mono">
          <div className="flex items-center gap-2.5">
            <Star size={16} className="text-amber-400 fill-amber-400" />
            <span className="text-white font-bold text-sm">4.9 / 5</span>
            <span className="text-slate-500 text-xs">
              {t("testimonials.metrics.ratingSubtitle", "10,000+ learners")}
            </span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2.5">
            <GraduationCap size={16} className="text-indigo-400" />
            <span className="text-white font-bold text-sm">95%+</span>
            <span className="text-slate-500 text-xs">
              {t("testimonials.metrics.passRateSubtitle", "board pass rate")}
            </span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2.5">
            <Award size={16} className="text-emerald-400" />
            <span className="text-white font-bold text-sm">100%</span>
            <span className="text-slate-500 text-xs">
              {t("testimonials.metrics.verifiedSubtitle", "verified feedback")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;