import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GraduationCap, Bot, Users, Plus, ArrowRight } from "lucide-react";
import SEO from "../components/common/SEO";

const faqs = [
  {
    questionKey: "helpCenter.faqs.enroll.question",
    answerKey: "helpCenter.faqs.enroll.answer",
  },

  {
    questionKey: "helpCenter.faqs.resetPassword.question",
    answerKey: "helpCenter.faqs.resetPassword.answer",
  },

  {
    questionKey: "helpCenter.faqs.certificates.question",
    answerKey: "helpCenter.faqs.certificates.answer",
  },

  {
    questionKey: "helpCenter.faqs.aiTutor.question",
    answerKey: "helpCenter.faqs.aiTutor.answer",
  },

  {
    questionKey: "helpCenter.faqs.communities.question",
    answerKey: "helpCenter.faqs.communities.answer",
  },

  {
    questionKey: "helpCenter.faqs.business.question",
    answerKey: "helpCenter.faqs.business.answer",
  },
];

const quickHelp = [
  {
    icon: GraduationCap,
    accent: "#818cf8",
    titleKey: "helpCenter.cards.courseSupport.title",
    descKey: "helpCenter.cards.courseSupport.desc",
  },
  {
    icon: Bot,
    accent: "#22d3ee",
    titleKey: "helpCenter.cards.aiLearning.title",
    descKey: "helpCenter.cards.aiLearning.desc",
  },
  {
    icon: Users,
    accent: "#f472b6",
    titleKey: "helpCenter.cards.instructorSupport.title",
    descKey: "helpCenter.cards.instructorSupport.desc",
  },
];

const HelpCenter = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <SEO title="Help Center" description="Get help and support for Umang Vision Academy." />

      <style>{`
        @keyframes hcFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hc-fade { animation: hcFadeUp .6s cubic-bezier(.22,.61,.36,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .hc-fade { animation: none; }
        }
      `}</style>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 md:px-10 py-20">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[560px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="hc-fade text-indigo-400 font-semibold mb-4 tracking-wide">
              {t("helpCenter.tag")}
            </p>

            <h1
              className="hc-fade text-5xl md:text-6xl font-bold leading-tight"
              style={{ animationDelay: "80ms" }}
            >
              {t("helpCenter.headline")}{" "}
              <span className="text-indigo-400">
                {t("helpCenter.highlight")}
              </span>
            </h1>

            <p
              className="hc-fade text-slate-400 mt-6 text-lg leading-relaxed"
              style={{ animationDelay: "160ms" }}
            >
              {t("helpCenter.description")}
            </p>
          </div>

          {/* Quick Help Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {quickHelp.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="hc-fade group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-xl hover:shadow-black/20"
                  style={{ animationDelay: `${240 + idx * 100}ms` }}
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                    style={{ background: `${card.accent}1f`, color: card.accent }}
                  >
                    <Icon size={26} strokeWidth={2} />
                  </div>

                  <h3 className="text-2xl font-bold mt-5">
                    {t(card.titleKey)}
                  </h3>

                  <p className="text-slate-400 mt-4 leading-relaxed">
                    {t(card.descKey)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-24">
            <div className="text-center">
              <p className="text-indigo-400 font-semibold tracking-wide">
                {t("helpCenter.faq.tag")}
              </p>

              <h2 className="text-4xl md:text-5xl font-bold mt-4">
                {t("helpCenter.faq.heading")}
              </h2>
            </div>

            <div className="max-w-4xl mx-auto mt-14 space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = open === index;
                return (
                  <div
                    key={index}
                    className={`rounded-2xl border bg-white/5 backdrop-blur-sm transition-colors duration-300 ${isOpen
                        ? "border-indigo-400/40 bg-white/[0.06]"
                        : "border-white/10 hover:border-white/20"
                      }`}
                  >
                    <button
                      onClick={() => setOpen(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 px-7 py-5 text-left"
                    >
                      <h3 className="text-[15px] font-semibold text-slate-100">
                        {t(faq.questionKey)}
                      </h3>

                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${isOpen
                            ? "rotate-45 border-indigo-400/50 bg-indigo-500/20 text-indigo-300"
                            : "border-white/15 text-slate-400"
                          }`}
                      >
                        <Plus size={15} />
                      </span>
                    </button>

                    <div
                      className="grid transition-all duration-300 ease-in-out"
                      style={{
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                      }}
                    >
                      <div className="overflow-hidden">
                        <div className="px-7 pb-6 text-[14px] leading-relaxed text-slate-400">
                          {t(faq.answerKey)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Support */}
          <div className="relative mt-24 overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 p-10 text-center md:p-14">
            <div
              className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full opacity-30 blur-3xl"
              style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)" }}
            />
            <h2 className="relative text-4xl font-bold">{t("helpCenter.cta.title")}</h2>

            <p className="relative text-slate-300 mt-5 text-lg max-w-2xl mx-auto">
              {t("helpCenter.cta.body")}
            </p>

            <div className="relative flex flex-wrap items-center justify-center gap-5 mt-10">
              <Link to="/contact">
                <button className="group inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-400 to-indigo-600 px-8 py-4 font-semibold text-black shadow-lg shadow-indigo-500/20 transition-transform duration-300 hover:scale-[1.02]">
                  {t("helpCenter.cta.contactButton")}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;