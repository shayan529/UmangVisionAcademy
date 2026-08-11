import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  GraduationCap,
  Bot,
  Users,
  Plus,
  ArrowRight,
  Search,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Award,
  BookOpen,
  Mail,
  HelpCircle,
  X,
  MessageSquare,
} from "lucide-react";
import SEO from "../components/common/SEO";

const faqs = [
  {
    id: "enroll",
    questionKey: "helpCenter.faqs.enroll.question",
    answerKey: "helpCenter.faqs.enroll.answer",
    defaultQ: "How do I enroll in a course or Smart Plan?",
    defaultA: "Browse our courses or plans page, select your preferred option, and click 'Enroll Now' or 'Choose Plan' to complete checkout.",
  },
  {
    id: "resetPassword",
    questionKey: "helpCenter.faqs.resetPassword.question",
    answerKey: "helpCenter.faqs.resetPassword.answer",
    defaultQ: "How do I reset my account password?",
    defaultA: "Click on 'Forgot Password' on the login page, enter your registered email address, and follow the password reset link sent to your inbox.",
  },
  {
    id: "certificates",
    questionKey: "helpCenter.faqs.certificates.question",
    answerKey: "helpCenter.faqs.certificates.answer",
    defaultQ: "Where can I view and download my certificates?",
    defaultA: "Log into your Student Dashboard and navigate to the 'Certificates' tab to view, print, or download your PDF certificate with digital verification.",
  },
  {
    id: "aiTutor",
    questionKey: "helpCenter.faqs.aiTutor.question",
    answerKey: "helpCenter.faqs.aiTutor.answer",
    defaultQ: "How can I use the AI Learning Assistant?",
    defaultA: "Open any course or visit the Ask Instructor / AI Tutor tab in your dashboard. You can ask subject questions, request study plans, and generate practice quizzes 24/7.",
  },
  {
    id: "communities",
    questionKey: "helpCenter.faqs.communities.question",
    answerKey: "helpCenter.faqs.communities.answer",
    defaultQ: "Can I connect with peer students and mentors?",
    defaultA: "Yes! Our platform provides live peer discussions, mentor collaboration, and 1-on-1 career counselling sessions for enrolled students.",
  },
  {
    id: "business",
    questionKey: "helpCenter.faqs.business.question",
    answerKey: "helpCenter.faqs.business.answer",
    defaultQ: "How do institutional and enterprise plans work?",
    defaultA: "Schools and coaching centers can set up bulk student seats with teacher analytics and admin management. Contact us via the Contact Us page for custom setups.",
  },
];

const quickHelp = [
  {
    icon: GraduationCap,
    accent: "#818cf8",
    titleKey: "helpCenter.cards.courseSupport.title",
    descKey: "helpCenter.cards.courseSupport.desc",
    defaultTitle: "Course & Curriculum Support",
    defaultDesc: "Get help with video lessons, written study notes, live streams, and syllabus coverage across grades.",
  },
  {
    icon: Bot,
    accent: "#22d3ee",
    titleKey: "helpCenter.cards.aiLearning.title",
    descKey: "helpCenter.cards.aiLearning.desc",
    defaultTitle: "AI Learning Assistant",
    defaultDesc: "Ask instant doubts, generate topic quizzes, and receive personalized progress report recommendations 24/7.",
  },
  {
    icon: Users,
    accent: "#f472b6",
    titleKey: "helpCenter.cards.instructorSupport.title",
    descKey: "helpCenter.cards.instructorSupport.desc",
    defaultTitle: "Instructor & Mentor Support",
    defaultDesc: "Schedule 1-on-1 career counselling sessions, ask instructor doubts, and receive expert academic guidance.",
  },
];

const HelpCenter = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const qStr = searchQuery.toLowerCase();
    return faqs.filter((f) => {
      const question = t(f.questionKey, f.defaultQ).toLowerCase();
      const answer = t(f.answerKey, f.defaultA).toLowerCase();
      return question.includes(qStr) || answer.includes(qStr);
    });
  }, [searchQuery, t]);

  return (
    <div className="min-h-screen bg-[#020817] text-white relative overflow-hidden font-sans">
      <SEO title="Help Center" description="Get help and support for Umang Vision Academy courses, AI features, and plans." />

      {/* ── Ambient Glows ── */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px]" />

      <main className="relative max-w-7xl mx-auto px-5 md:px-10 py-12 lg:py-20">
        {/* ── Hero & Search ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-xs font-semibold text-indigo-300 shadow-xl">
            <Sparkles size={14} className="text-amber-400" />
            <span>{t("helpCenter.tag", "HELP & SUPPORT CENTER")}</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-bold">24/7 Active</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
            {t("helpCenter.headline", "How can we")}{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              {t("helpCenter.highlight", "help you today?")}
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {t(
              "helpCenter.description",
              "Search our knowledge base, explore quick support channels, or reach out directly to our dedicated support team.",
            )}
          </p>

          {/* Search Box */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="relative flex items-center rounded-2xl border border-white/15 bg-slate-900/90 p-3 backdrop-blur-xl shadow-2xl focus-within:border-indigo-500 transition-all">
              <Search size={20} className="text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles (e.g. password, certificate, refund, career counselling)..."
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
        </div>

        {/* ── Quick Help Cards ── */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {quickHelp.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="group rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-2xl shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-md"
                    style={{ background: `${card.accent}1f`, color: card.accent, border: `1px solid ${card.accent}40` }}
                  >
                    <Icon size={26} strokeWidth={2} />
                  </div>

                  <h3 className="text-xl font-bold text-white mt-6">
                    {t(card.titleKey, card.defaultTitle)}
                  </h3>

                  <p className="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
                    {t(card.descKey, card.defaultDesc)}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: card.accent }}>
                    Explore Category
                  </span>
                  <ArrowRight size={15} style={{ color: card.accent }} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── FAQ Section ── */}
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              {t("helpCenter.faq.tag", "KNOWLEDGE BASE")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {t("helpCenter.faq.heading", "Frequently Asked Help Topics")}
            </h2>
          </div>

          <div className="space-y-3 pt-2">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-3">
                <HelpCircle size={36} className="mx-auto text-slate-500 opacity-60" />
                <h3 className="text-base font-bold text-white">No articles found matching "{searchQuery}"</h3>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const isOpen = open === index;
                const qText = t(faq.questionKey, faq.defaultQ);
                const aText = t(faq.answerKey, faq.defaultA);

                return (
                  <div
                    key={faq.id || index}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? "bg-slate-900/90 border-indigo-500/40 shadow-lg shadow-indigo-500/10"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <button
                      onClick={() => setOpen(isOpen ? null : index)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left"
                    >
                      <h3 className="text-sm font-bold text-slate-100 leading-snug">
                        {qText}
                      </h3>

                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                          isOpen
                            ? "rotate-45 border-indigo-400/50 bg-indigo-500/20 text-indigo-300"
                            : "border-white/15 text-slate-400"
                        }`}
                      >
                        <Plus size={14} />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06]">
                        {aText}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Contact Support Bottom Banner ── */}
        <div className="relative mt-24 overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-r from-indigo-500/20 via-slate-900/80 to-cyan-500/20 p-8 sm:p-14 text-center backdrop-blur-2xl shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Need Personal Assistance?
          </h2>

          <p className="text-slate-300 mt-3 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Our support team is standing by to help you with courses, account settings, subscriptions, or technical issues.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link to="/contact">
              <button className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-600 hover:from-indigo-400 hover:to-cyan-500 text-white font-black text-xs shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] flex items-center gap-2">
                <Mail size={16} />
                <span>Contact Support</span>
              </button>
            </Link>

            <Link to="/faq">
              <button className="px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-colors flex items-center gap-2">
                <span>View Full FAQ</span>
                <ArrowRight size={15} />
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpCenter;