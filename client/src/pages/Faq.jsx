import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const faqData = [
  {
    categoryKey: 'faq.categories.courses',
    questions: [
      {
        questionKey: 'faq.questions.enroll.course',
        answerKey: 'faq.questions.enroll.courseAnswer',
      },
      {
        questionKey: 'faq.questions.mobile.access',
        answerKey: 'faq.questions.mobile.accessAnswer',
      },
    ],
  },

  {
    categoryKey: 'faq.categories.aiFeatures',
    questions: [
      {
        questionKey: 'faq.questions.aiTutor.question',
        answerKey: 'faq.questions.aiTutor.answer',
      },
      {
        questionKey: 'faq.questions.quizGeneration.question',
        answerKey: 'faq.questions.quizGeneration.answer',
      },
    ],
  },

  {
    categoryKey: 'faq.categories.certificates',
    questions: [
      {
        questionKey: 'faq.questions.certificates.receive',
        answerKey: 'faq.questions.certificates.receiveAnswer',
      },
      {
        questionKey: 'faq.questions.certificates.download',
        answerKey: 'faq.questions.certificates.downloadAnswer',
      },
    ],
  },

  {
    categoryKey: 'faq.categories.instructor',
    questions: [
      {
        questionKey: 'faq.questions.instructor.become',
        answerKey: 'faq.questions.instructor.becomeAnswer',
      },
    ],
  },

  {
    categoryKey: 'faq.categories.business',
    questions: [
      {
        questionKey: 'faq.questions.business.train',
        answerKey: 'faq.questions.business.trainAnswer',
      },
      {
        questionKey: 'faq.questions.business.analytics',
        answerKey: 'faq.questions.business.analyticsAnswer',
      },
    ],
  },
];

const Faq = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState(null);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {/* Hero Section */}

      <section className="px-6 md:px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-indigo-400 font-semibold mb-4">{t('faq.tag')}</p>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              {t('faq.headline')}{' '}
              <span className="text-indigo-400">{t('faq.highlight')}</span>
            </h1>

            <p className="text-slate-400 mt-6 text-lg leading-relaxed">
              {t('faq.description')}
            </p>
          </div>

          {/* FAQ Categories */}

          <div className="mt-20 space-y-14">
            {faqData.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-400 to-indigo-600 flex items-center justify-center text-black font-bold">
                    {t(section.categoryKey)?.[0] || '?'}
                  </div>

                  <h2 className="text-3xl font-bold">
                    {t(section.categoryKey)}
                  </h2>
                </div>

                <div className="space-y-5">
                  {section.questions.map((faq, index) => {
                    const key = `${sectionIndex}-${index}`;

                    return (
                      <div
                        key={key}
                        className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
                      >
                        <button
                          onClick={() => setActive(active === key ? null : key)}
                          className="w-full flex items-center justify-between px-8 py-6 text-left"
                        >
                          <h3 className="text-lg font-semibold">
                            {t(faq.questionKey)}
                          </h3>

                          <span className="text-2xl text-indigo-400">
                            {active === key ? '−' : '+'}
                          </span>
                        </button>

                        {active === key && (
                          <div className="px-8 pb-6 text-slate-400 leading-relaxed">
                            {t(faq.answerKey)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}

          <div className="mt-24 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-white/10 rounded-[40px] p-10 md:p-14 text-center">
            <h2 className="text-4xl font-bold">{t('faq.cta.title')}</h2>

            <p className="text-slate-300 mt-5 text-lg max-w-2xl mx-auto">
              {t('faq.cta.body')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-5 mt-10">
              <Link to="/contact">
                <button className="bg-gradient-to-r from-indigo-400 to-indigo-600 px-8 py-4 rounded-2xl text-black font-semibold shadow-lg shadow-indigo-500/20">
                  {t('faq.cta.contactSupport')}
                </button>
              </Link>

              <Link to="/help-center">
                <button className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-semibold">
                  {t('faq.cta.helpCenter')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Faq;
