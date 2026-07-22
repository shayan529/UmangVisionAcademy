import React from "react";
import { useTranslation } from "react-i18next";
import { Star, Quote, Sparkles, CheckCircle2, GraduationCap, Award, Users } from "lucide-react";

const testimonials = [
  {
    nameKey: "testimonials.items.priya.name",
    defaultName: "Priya Sharma",
    quoteKey: "testimonials.items.priya.quote",
    defaultQuote: "Transformed my learning experience in 6 months — the interactive video lectures and doubt-solving sessions are top notch!",
    role: "Class 10 CBSE • 98.4% Scored",
    initials: "PS",
    gradient: "from-indigo-600 to-purple-600",
    rating: 5,
  },
  {
    nameKey: "testimonials.items.mark.name",
    defaultName: "Mark D'Souza",
    quoteKey: "testimonials.items.mark.quote",
    defaultQuote: "Practical, hands-on lessons, and the active student community helped me clear all my doubts before board exams.",
    role: "Class 12 PCM • JEE Qualified",
    initials: "MD",
    gradient: "from-cyan-600 to-blue-600",
    rating: 5,
  },
  {
    nameKey: "testimonials.items.lina.name",
    defaultName: "Lina Verma",
    quoteKey: "testimonials.items.lina.quote",
    defaultQuote: "Crystal clear course structures and exceptional instructors. Highly recommended for any student preparing for board exams!",
    role: "Class 9 State Board • Rank 1",
    initials: "LV",
    gradient: "from-emerald-600 to-teal-600",
    rating: 5,
  },
  {
    nameKey: "testimonials.items.rohan.name",
    defaultName: "Rohan Gupta",
    quoteKey: "testimonials.items.rohan.quote",
    defaultQuote: "The AI quiz generator and mock test analytics allowed me to pinpoint my weaknesses and boost my scores significantly.",
    role: "Class 11 NEET Aspirant",
    initials: "RG",
    gradient: "from-amber-600 to-orange-600",
    rating: 5,
  },
  {
    nameKey: "testimonials.items.ananya.name",
    defaultName: "Ananya Roy",
    quoteKey: "testimonials.items.ananya.quote",
    defaultQuote: "Learning in both Hindi and English made complex physics and math concepts so much easier to understand.",
    role: "Class 10 ICSE • 96.8% Scored",
    initials: "AR",
    gradient: "from-pink-600 to-rose-600",
    rating: 5,
  },
  {
    nameKey: "testimonials.items.aditya.name",
    defaultName: "Aditya Kumar",
    quoteKey: "testimonials.items.aditya.quote",
    defaultQuote: "The live doubt sessions and structured notes gave me complete confidence to top my school examinations.",
    role: "Class 12 Commerce",
    initials: "AK",
    gradient: "from-violet-600 to-indigo-600",
    rating: 5,
  },
];

const Testimonials = () => {
  const { t } = useTranslation();

  return (
    <section className="relative px-6 sm:px-10 py-20 bg-[#0B1120] overflow-hidden text-slate-100">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">

        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
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

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => {
            const name = t(item.nameKey, item.defaultName);
            const quote = t(item.quoteKey, item.defaultQuote);

            return (
              <div
                key={i}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#111827]/80 p-6 sm:p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-500/40 hover:shadow-[0_12px_36px_rgba(99,102,241,0.15)]"
              >
                {/* Decorative Quote Icon */}
                <Quote
                  size={42}
                  className="absolute top-6 right-6 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors pointer-events-none"
                />

                <div className="space-y-4 relative z-10">
                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[...Array(item.rating)].map((_, idx) => (
                      <Star
                        key={idx}
                        size={16}
                        className="text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>

                  {/* Quote Body */}
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed italic">
                    “{quote}”
                  </p>
                </div>

                {/* Card Footer: Student Info */}
                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                    >
                      {item.initials}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate group-hover:text-indigo-300 transition-colors">
                        {name}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.role}
                      </p>
                    </div>
                  </div>

                  {/* Verified Badge */}
                  <div
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0"
                    title="Verified Student"
                  >
                    <CheckCircle2 size={13} />
                    <span className="hidden sm:inline">
                      {t("testimonials.metrics.verifiedBadge", "Verified")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Trust Metric Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <Star size={20} className="text-amber-400 fill-amber-400" />
            <div className="text-left">
              <div className="font-extrabold text-white text-base">
                {t("testimonials.metrics.ratingTitle", "4.9 / 5 Rating")}
              </div>
              <div className="text-xs text-slate-400">
                {t("testimonials.metrics.ratingSubtitle", "From 10,000+ happy learners")}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <GraduationCap size={20} className="text-indigo-400" />
            <div className="text-left">
              <div className="font-extrabold text-white text-base">
                {t("testimonials.metrics.passRateTitle", "95%+ Pass Rate")}
              </div>
              <div className="text-xs text-slate-400">
                {t("testimonials.metrics.passRateSubtitle", "Across all board examinations")}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <Award size={20} className="text-emerald-400" />
            <div className="text-left">
              <div className="font-extrabold text-white text-base">
                {t("testimonials.metrics.verifiedTitle", "100% Verified")}
              </div>
              <div className="text-xs text-slate-400">
                {t("testimonials.metrics.verifiedSubtitle", "Authentic student feedback")}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
