import React, { useState } from "react";
import { Link } from "react-router-dom";

const faqData = [
  {
    category: "Courses",
    questions: [
      {
        question: "How do I enroll in a course?",
        answer:
          "Open the course page and click the enroll button to start learning instantly.",
      },
      {
        question: "Can I access courses on mobile?",
        answer:
          "Yes, all courses are fully responsive and accessible on mobile devices.",
      },
    ],
  },

  {
    category: "AI Features",
    questions: [
      {
        question: "How does the AI Tutor work?",
        answer:
          "The AI Tutor helps students through AI chat, voice assistance, doubt solving, and smart recommendations.",
      },
      {
        question: "Can AI generate quizzes automatically?",
        answer:
          "Yes, instructors and students can generate quizzes using AI-powered tools.",
      },
    ],
  },

  {
    category: "Certificates",
    questions: [
      {
        question: "Do I receive certificates after completion?",
        answer:
          "Yes, certificates are awarded for eligible courses after successful completion.",
      },
      {
        question: "Can certificates be downloaded?",
        answer:
          "Yes, certificates can be downloaded directly from the dashboard.",
      },
    ],
  },

  {
    category: "Instructor",
    questions: [
      {
        question: "How can I become an instructor?",
        answer: "Go to the Become Instructor page and submit your application.",
      },
    ],
  },

  {
    category: "Business",
    questions: [
      {
        question: "Can companies train employees on the platform?",
        answer:
          "Yes, businesses can manage employee learning through team dashboards and analytics.",
      },
      {
        question: "Does the business plan include analytics?",
        answer:
          "Yes, advanced analytics and progress tracking are included in the business plan.",
      },
    ],
  },
];

const Faq = () => {
  const [active, setActive] = useState(null);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {/* Hero Section */}

      <section className="px-6 md:px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-indigo-400 font-semibold mb-4">
              FREQUENTLY ASKED QUESTIONS
            </p>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Answers To Your <span className="text-indigo-400">Questions</span>
            </h1>

            <p className="text-slate-400 mt-6 text-lg leading-relaxed">
              Find answers about courses, AI features, certifications,
              instructor tools, business plans, and platform support.
            </p>
          </div>

          {/* FAQ Categories */}

          <div className="mt-20 space-y-14">
            {faqData.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-400 to-indigo-600 flex items-center justify-center text-black font-bold">
                    {section.category[0]}
                  </div>

                  <h2 className="text-3xl font-bold">{section.category}</h2>
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
                            {faq.question}
                          </h3>

                          <span className="text-2xl text-indigo-400">
                            {active === key ? "−" : "+"}
                          </span>
                        </button>

                        {active === key && (
                          <div className="px-8 pb-6 text-slate-400 leading-relaxed">
                            {faq.answer}
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
            <h2 className="text-4xl font-bold">Still Have Questions?</h2>

            <p className="text-slate-300 mt-5 text-lg max-w-2xl mx-auto">
              Contact our support team for technical help, subscription
              assistance, instructor onboarding, and business inquiries.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-5 mt-10">
              <Link to="/contact">
                <button className="bg-gradient-to-r from-indigo-400 to-indigo-600 px-8 py-4 rounded-2xl text-black font-semibold shadow-lg shadow-indigo-500/20">
                  Contact Support
                </button>
              </Link>

              <Link to="/help-center">
                <button className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-semibold">
                  Help Center
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
