import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  ChevronDown,
  Sparkles,
  HelpCircle,
  BookOpen,
  Bot,
  Award,
  Users,
  Building2,
  MessageSquare,
  ArrowRight,
  X,
  Mail,
} from "lucide-react";
import SEO from "../components/common/SEO";

const faqData = [
  {
    id: "courses",
    categoryKey: "faq.categories.courses",
    defaultName: "Courses & Curriculum",
    icon: BookOpen,
    color: "#6366f1",
    questions: [
      {
        questionKey: "faq.questions.enroll.course",
        answerKey: "faq.questions.enroll.courseAnswer",
        defaultQ: "How do I enroll in a course?",
        defaultA: "Click on any course from the Courses page, then click 'Add to Cart' or 'Enroll Now' to proceed with your plan or instant checkout.",
      },
      {
        questionKey: "faq.questions.mobile.access",
        answerKey: "faq.questions.mobile.accessAnswer",
        defaultQ: "Can I access courses on mobile devices?",
        defaultA: "Yes! Umang Vision Academy is fully mobile responsive. You can watch lessons, read notes, and take quizzes seamlessly on phone or tablet.",
      },
    ],
  },
  {
    id: "aiFeatures",
    categoryKey: "faq.categories.aiFeatures",
    defaultName: "AI Tutor & Smart Features",
    icon: Bot,
    color: "#22d3ee",
    questions: [
      {
        questionKey: "faq.questions.aiTutor.question",
        answerKey: "faq.questions.aiTutor.answer",
        defaultQ: "How does the 24/7 AI Tutor work?",
        defaultA: "Our AI Tutor answers your subject doubts instantly, generates practice quizzes, and explains complex concepts step-by-step.",
      },
      {
        questionKey: "faq.questions.quizGeneration.question",
        answerKey: "faq.questions.quizGeneration.answer",
        defaultQ: "Can AI generate custom practice tests for me?",
        defaultA: "Yes, you can generate topic-wise and phase-wise mock tests tailored to your grade level and board curriculum.",
      },
    ],
  },
  {
    id: "certificates",
    categoryKey: "faq.categories.certificates",
    defaultName: "Certificates & Progress",
    icon: Award,
    color: "#f59e0b",
    questions: [
      {
        questionKey: "faq.questions.certificates.receive",
        answerKey: "faq.questions.certificates.receiveAnswer",
        defaultQ: "When do I receive my course completion certificate?",
        defaultA: "You receive a verified digital certificate instantly upon completing 100% of course lessons and passing the final assessment.",
      },
      {
        questionKey: "faq.questions.certificates.download",
        answerKey: "faq.questions.certificates.downloadAnswer",
        defaultQ: "How can I download and share my certificate?",
        defaultA: "Go to your Student Dashboard -> Certificates section to view, print, or download your PDF certificate with a unique verification code.",
      },
    ],
  },
  {
    id: "instructor",
    categoryKey: "faq.categories.instructor",
    defaultName: "Instructor Guidance & Doubts",
    icon: Users,
    color: "#ec4899",
    questions: [
      {
        questionKey: "faq.questions.instructor.become",
        answerKey: "faq.questions.instructor.becomeAnswer",
        defaultQ: "How do I ask doubts to expert instructors?",
        defaultA: "Use the 'Ask Instructor' tab in your dashboard to send text or attachment queries directly to assigned subject mentors.",
      },
    ],
  },
  {
    id: "business",
    categoryKey: "faq.categories.business",
    defaultName: "Plans & Business Inquiries",
    icon: Building2,
    color: "#10b981",
    questions: [
      {
        questionKey: "faq.questions.business.train",
        answerKey: "faq.questions.business.trainAnswer",
        defaultQ: "How do Smart Learning Plans work?",
        defaultA: "Smart Plans (Basic, Premium, Elite) unlock full grade curriculum, AI Tutor access, report cards, and 1-on-1 career counselling sessions.",
      },
      {
        questionKey: "faq.questions.business.analytics",
        answerKey: "faq.questions.business.analyticsAnswer",
        defaultQ: "Can schools and coaching centers get bulk enterprise access?",
        defaultA: "Yes, we offer custom institutional onboarding with student analytics dashboards and bulk license discounts. Contact our business team for details.",
      },
    ],
  },
];

const Faq = () => {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    return faqData
      .map((section) => {
        if (selectedCategory !== "all" && section.id !== selectedCategory) {
          return null;
        }

        const filteredQuestions = section.questions.filter((q) => {
          const questionText = t(q.questionKey, q.defaultQ).toLowerCase();
          const answerText = t(q.answerKey, q.defaultA).toLowerCase();
          const qStr = searchQuery.toLowerCase();
          return questionText.includes(qStr) || answerText.includes(qStr);
        });

        if (filteredQuestions.length === 0) return null;

        return {
          ...section,
          questions: filteredQuestions,
        };
      })
      .filter(Boolean);
  }, [selectedCategory, searchQuery, t]);

  const totalResults = filteredData.reduce((acc, cat) => acc + cat.questions.length, 0);

  return (
    <div className="min-h-screen bg-[#020817] text-white relative overflow-hidden font-sans">
      <SEO title="FAQ" description="Frequently asked questions about Umang Vision Academy courses, AI Tutor, and plans." />

      {/* ── Ambient Glows ── */}
      <div className="pointer-events-none absolute top-0 left-1/3 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 right-10 w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[120px]" />

      <main className="relative max-w-7xl mx-auto px-5 md:px-10 py-12 lg:py-20">
        {/* ── Top Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-xs font-semibold text-indigo-300 shadow-xl">
            <Sparkles size={14} className="text-amber-400" />
            <span>{t("faq.tag", "FREQUENTLY ASKED QUESTIONS")}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
            {t("faq.headline", "Answers to your")}{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              {t("faq.highlight", "Questions")}
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {t(
              "faq.description",
              "Find answers about courses, AI features, certifications, instructor tools, business plans, and platform support.",
            )}
          </p>
        </div>

        {/* ── Search Bar ── */}
        <div className="max-w-2xl mx-auto mb-10 relative">
          <div className="relative flex items-center rounded-2xl border border-white/15 bg-slate-900/80 p-2.5 backdrop-blur-xl shadow-2xl focus-within:border-indigo-500 transition-all">
            <Search size={20} className="text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions by keyword (e.g. certificate, AI tutor, refund)..."
              className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors mr-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ── Category Filter Tabs ── */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              selectedCategory === "all"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25"
                : "bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20 hover:text-white"
            }`}
          >
            All Questions
          </button>
          {faqData.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25"
                    : "bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon size={14} style={{ color: isSelected ? "#fff" : cat.color }} />
                <span>{t(cat.categoryKey, cat.defaultName)}</span>
              </button>
            );
          })}
        </div>

        {/* ── FAQ Content Section ── */}
        <div className="max-w-4xl mx-auto space-y-12">
          {filteredData.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-3">
              <HelpCircle size={40} className="mx-auto text-slate-500 opacity-60" />
              <h3 className="text-lg font-bold text-white">No matching questions found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try adjusting your search term or switch to another category tab.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
              >
                Reset Search
              </button>
            </div>
          ) : (
            filteredData.map((section, sIdx) => {
              const Icon = section.icon;
              return (
                <div key={section.id} className="space-y-4">
                  {/* Category Title Header */}
                  <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                      style={{ background: `${section.color}20`, color: section.color, border: `1px solid ${section.color}40` }}
                    >
                      <Icon size={18} />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {t(section.categoryKey, section.defaultName)}
                    </h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 ml-auto">
                      {section.questions.length} Qs
                    </span>
                  </div>

                  {/* Accordions */}
                  <div className="space-y-3">
                    {section.questions.map((faq, qIdx) => {
                      const itemKey = `${section.id}-${qIdx}`;
                      const isOpen = activeKey === itemKey;
                      const qText = t(faq.questionKey, faq.defaultQ);
                      const aText = t(faq.answerKey, faq.defaultA);

                      return (
                        <div
                          key={itemKey}
                          className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                            isOpen
                              ? "bg-slate-900/90 border-indigo-500/40 shadow-lg shadow-indigo-500/10"
                              : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                          }`}
                        >
                          <button
                            onClick={() => setActiveKey(isOpen ? null : itemKey)}
                            className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer"
                          >
                            <h3 className="text-sm font-bold text-slate-100 leading-snug">
                              {qText}
                            </h3>
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-300 ${
                                isOpen
                                  ? "rotate-180 bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                                  : "border-white/15 text-slate-400"
                              }`}
                            >
                              <ChevronDown size={15} />
                            </div>
                          </button>

                          {isOpen && (
                            <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06]">
                              {aText}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Bottom CTA Banner ── */}
        <div className="mt-20 relative overflow-hidden rounded-[36px] border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/60 p-8 sm:p-12 text-center backdrop-blur-2xl shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
            {t("faq.cta.title", "Still have questions?")}
          </h2>

          <p className="text-slate-300 mt-3 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            {t(
              "faq.cta.body",
              "Can't find the answer you're looking for? Reach out to our support team or visit our dedicated Help Center.",
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link to="/contact">
              <button className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] flex items-center gap-2">
                <Mail size={16} />
                <span>{t("faq.cta.contactSupport", "Contact Support")}</span>
              </button>
            </Link>

            <Link to="/help-center">
              <button className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-colors flex items-center gap-2">
                <span>{t("faq.cta.helpCenter", "Visit Help Center")}</span>
                <ArrowRight size={15} />
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Faq;

