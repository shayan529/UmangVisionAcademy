import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

const HelpCenter = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {/* Hero */}

      <section className="px-6 md:px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-indigo-400 font-semibold mb-4">
              {t("helpCenter.tag")}
            </p>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              {t("helpCenter.headline")}{" "}
              <span className="text-indigo-400">
                {t("helpCenter.highlight")}
              </span>
            </h1>

            <p className="text-slate-400 mt-6 text-lg leading-relaxed">
              {t("helpCenter.description")}
            </p>
          </div>

          {/* Quick Help Cards */}

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="text-4xl">🎓</div>

              <h3 className="text-2xl font-bold mt-5">
                {t("helpCenter.cards.courseSupport.title")}
              </h3>

              <p className="text-slate-400 mt-4 leading-relaxed">
                {t("helpCenter.cards.courseSupport.desc")}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="text-4xl">🤖</div>

              <h3 className="text-2xl font-bold mt-5">
                {t("helpCenter.cards.aiLearning.title")}
              </h3>

              <p className="text-slate-400 mt-4 leading-relaxed">
                {t("helpCenter.cards.aiLearning.desc")}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="text-4xl">👨‍🏫</div>

              <h3 className="text-2xl font-bold mt-5">
                {t("helpCenter.cards.instructorSupport.title")}
              </h3>

              <p className="text-slate-400 mt-4 leading-relaxed">
                {t("helpCenter.cards.instructorSupport.desc")}
              </p>
            </div>
          </div>

          {/* FAQ Section */}

          <div className="mt-24">
            <div className="text-center">
              <p className="text-indigo-400 font-semibold">
                {t("helpCenter.faq.tag")}
              </p>

              <h2 className="text-4xl md:text-5xl font-bold mt-4">
                {t("helpCenter.faq.heading")}
              </h2>
            </div>

            <div className="max-w-4xl mx-auto mt-14 space-y-5">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpen(open === index ? null : index)}
                    className="w-full flex items-center justify-between px-8 py-6 text-left"
                  >
                    <h3 className="text-lg font-semibold">
                      {t(faq.questionKey)}
                    </h3>

                    <span className="text-2xl text-indigo-400">
                      {open === index ? "−" : "+"}
                    </span>
                  </button>

                  {open === index && (
                    <div className="px-8 pb-6 text-slate-400 leading-relaxed">
                      {t(faq.answerKey)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support */}

          <div className="mt-24 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-white/10 rounded-[40px] p-10 md:p-14 text-center">
            <h2 className="text-4xl font-bold">{t("helpCenter.cta.title")}</h2>

            <p className="text-slate-300 mt-5 text-lg max-w-2xl mx-auto">
              {t("helpCenter.cta.body")}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-5 mt-10">
              <Link to="/contact">
                <button className="bg-gradient-to-r cursor-pointer from-indigo-400 to-indigo-600 px-8 py-4 rounded-2xl text-black font-semibold shadow-lg shadow-indigo-500/20">
                  {t("helpCenter.cta.contactButton")}
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
