import React, { useState } from "react";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "How do I enroll in a course?",
    answer:
      "You can enroll in any course by opening the course page and clicking the Enroll button.",
  },

  {
    question: "How do I reset my password?",
    answer:
      "Go to the login page and click on Forgot Password to receive a reset email.",
  },

  {
    question: "Can I get certificates after completing courses?",
    answer:
      "Yes, certificates are available for eligible courses after successful completion.",
  },

  {
    question: "How does the AI Tutor work?",
    answer:
      "The AI Tutor helps students through AI chat, voice assistance, doubt solving, and quiz generation.",
  },

  {
    question: "How do instructor communities work?",
    answer:
      "Subscribed students can access private instructor communities for mentorship and discussions.",
  },

  {
    question: "Can businesses train employees on the platform?",
    answer:
      "Yes, the Business Plan allows organizations to manage employee training and analytics.",
  },
];

const HelpCenter = () => {
  const [open, setOpen] = useState(null);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {/* Hero */}

      <section className="px-6 md:px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-indigo-400 font-semibold mb-4">HELP CENTER</p>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              How Can We <span className="text-indigo-400">Help You?</span>
            </h1>

            <p className="text-slate-400 mt-6 text-lg leading-relaxed">
              Find answers to common questions, learn how the platform works,
              and get support for courses, subscriptions, AI tools, instructors,
              and more.
            </p>
          </div>

          {/* Search Box */}

          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-3 flex items-center">
              <input
                type="text"
                placeholder="Search help articles..."
                className="w-full bg-transparent outline-none px-4 py-3 text-white placeholder:text-slate-500"
              />

              <button className="bg-gradient-to-r from-indigo-400 to-indigo-600 px-6 py-3 rounded-2xl text-black font-semibold">
                Search
              </button>
            </div>
          </div>

          {/* Quick Help Cards */}

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="text-4xl">🎓</div>

              <h3 className="text-2xl font-bold mt-5">Course Support</h3>

              <p className="text-slate-400 mt-4 leading-relaxed">
                Get help with enrolling in courses, tracking progress,
                certificates, and subscriptions.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="text-4xl">🤖</div>

              <h3 className="text-2xl font-bold mt-5">AI Learning Help</h3>

              <p className="text-slate-400 mt-4 leading-relaxed">
                Learn how to use AI tutor, AI quizzes, voice AI, and
                personalized recommendations.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="text-4xl">👨‍🏫</div>

              <h3 className="text-2xl font-bold mt-5">Instructor Support</h3>

              <p className="text-slate-400 mt-4 leading-relaxed">
                Find information about publishing courses, instructor
                dashboards, and monetization.
              </p>
            </div>
          </div>

          {/* FAQ Section */}

          <div className="mt-24">
            <div className="text-center">
              <p className="text-indigo-400 font-semibold">
                FREQUENTLY ASKED QUESTIONS
              </p>

              <h2 className="text-4xl md:text-5xl font-bold mt-4">
                Common Questions
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
                    <h3 className="text-lg font-semibold">{faq.question}</h3>

                    <span className="text-2xl text-indigo-400">
                      {open === index ? "−" : "+"}
                    </span>
                  </button>

                  {open === index && (
                    <div className="px-8 pb-6 text-slate-400 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support */}

          <div className="mt-24 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-white/10 rounded-[40px] p-10 md:p-14 text-center">
            <h2 className="text-4xl font-bold">Still Need Help?</h2>

            <p className="text-slate-300 mt-5 text-lg max-w-2xl mx-auto">
              Our support team is available to help with technical issues,
              subscriptions, business onboarding, and instructor support.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-5 mt-10">
              <button className="bg-gradient-to-r from-indigo-400 to-indigo-600 px-8 py-4 rounded-2xl text-black font-semibold shadow-lg shadow-indigo-500/20">
                <Link to="/contact">Contact Us</Link>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;
