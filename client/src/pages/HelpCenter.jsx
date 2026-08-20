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
  ChevronDown,
} from "lucide-react";
import SEO from "../components/common/SEO";

const faqs = [
  {
    id: "enroll",
    category: "course",
    questionKey: "helpCenter.faqs.enroll.question",
    answerKey: "helpCenter.faqs.enroll.answer",
    defaultQ: "How do I enroll in a course or Smart Plan?",
    defaultA: "Browse our courses or plans page, select your preferred option, and click 'Enroll Now' or 'Choose Plan' to complete checkout with Razorpay or Platform Wallet.",
    keywords: ["enroll", "buy", "course", "smart plan", "purchase", "subscribe", "checkout", "price", "cost"],
  },
  {
    id: "resetPassword",
    category: "account",
    questionKey: "helpCenter.faqs.resetPassword.question",
    answerKey: "helpCenter.faqs.resetPassword.answer",
    defaultQ: "How do I reset my account password?",
    defaultA: "Click on 'Forgot Password' on the login page, enter your registered email address, and follow the password reset link sent to your inbox.",
    keywords: ["password", "reset", "forgot", "login", "account", "email", "change password", "sign in"],
  },
  {
    id: "certificates",
    category: "course",
    questionKey: "helpCenter.faqs.certificates.question",
    answerKey: "helpCenter.faqs.certificates.answer",
    defaultQ: "Where can I view and download my certificates?",
    defaultA: "Log into your Student Dashboard and navigate to the 'Certificates' tab to view, print, or download your PDF certificate with digital verification code.",
    keywords: ["certificate", "download", "pdf", "completion", "verify", "degree", "diploma", "award"],
  },
  {
    id: "aiTutor",
    category: "ai",
    questionKey: "helpCenter.faqs.aiTutor.question",
    answerKey: "helpCenter.faqs.aiTutor.answer",
    defaultQ: "How can I use the AI Learning Assistant?",
    defaultA: "Open any course or visit the Ask Instructor / AI Tutor tab in your student dashboard. You can ask subject questions, request study roadmaps, and generate practice quizzes 24/7.",
    keywords: ["ai", "tutor", "assistant", "doubt", "quiz", "ask", "bot", "question", "smart"],
  },
  {
    id: "communities",
    category: "instructor",
    questionKey: "helpCenter.faqs.communities.question",
    answerKey: "helpCenter.faqs.communities.answer",
    defaultQ: "Can I connect with peer students and mentors?",
    defaultA: "Yes! Our platform provides live peer discussions, mentor collaboration, instructor doubt solving, and 1-on-1 career counselling sessions.",
    keywords: ["community", "peer", "mentor", "counselling", "career", "instructor", "discussion", "help", "doubt"],
  },
  {
    id: "business",
    category: "business",
    questionKey: "helpCenter.faqs.business.question",
    answerKey: "helpCenter.faqs.business.answer",
    defaultQ: "How do institutional and enterprise plans work?",
    defaultA: "Schools, coaching centers, and businesses can set up bulk student seats with teacher analytics dashboards and admin management. Contact us via the Contact page for custom enterprise pricing.",
    keywords: ["business", "enterprise", "school", "coaching", "bulk", "institution", "teacher", "organization"],
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
    query: "course",
  },
  {
    icon: Bot,
    accent: "#22d3ee",
    titleKey: "helpCenter.cards.aiLearning.title",
    descKey: "helpCenter.cards.aiLearning.desc",
    defaultTitle: "AI Learning Assistant",
    defaultDesc: "Ask instant doubts, generate topic quizzes, and receive personalized progress report recommendations 24/7.",
    query: "ai",
  },
  {
    icon: Users,
    accent: "#f472b6",
    titleKey: "helpCenter.cards.instructorSupport.title",
    descKey: "helpCenter.cards.instructorSupport.desc",
    defaultTitle: "Instructor & Mentor Support",
    defaultDesc: "Schedule 1-on-1 career counselling sessions, ask instructor doubts, and receive expert academic guidance.",
    query: "instructor",
  },
];

const quickSuggestions = [
  { label: "🔐 Reset Password", query: "password" },
  { label: "📜 Certificates", query: "certificate" },
  { label: "🤖 AI Tutor", query: "ai" },
  { label: "💳 Enroll & Plans", query: "enroll" },
  { label: "💬 Career Counselling", query: "counselling" },
];

const HelpCenter = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Search logic across default, localized text, and keywords
  const filteredFaqs = useMemo(() => {
    const qRaw = searchQuery.trim().toLowerCase();
    if (!qRaw) return faqs;

    return faqs.filter((f) => {
      const qLoc = t(f.questionKey, f.defaultQ).toLowerCase();
      const aLoc = t(f.answerKey, f.defaultA).toLowerCase();
      const qDef = (f.defaultQ || "").toLowerCase();
      const aDef = (f.defaultA || "").toLowerCase();
      const kw = (f.keywords || []).join(" ").toLowerCase();

      return (
        qLoc.includes(qRaw) ||
        aLoc.includes(qRaw) ||
        qDef.includes(qRaw) ||
        aDef.includes(qRaw) ||
        kw.includes(qRaw)
      );
    });
  }, [searchQuery, t]);

  const handleCardClick = (query) => {
    setSearchQuery(query);
    setOpen(null);
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white relative overflow-hidden font-sans">
      <SEO title="Help Center" description="Get help and support for Umang Vision Academy courses, AI features, and plans." />

      {/* ── Ambient Glows ── */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px]" />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-12 lg:py-20">
        {/* ── Hero & Search ── */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-[11px] sm:text-xs font-semibold text-indigo-300 shadow-xl">
            <Sparkles size={13} className="text-amber-400" />
            <span>{t("helpCenter.tag", "HELP & SUPPORT CENTER")}</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-bold">24/7 Active</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2]">
            {t("helpCenter.headline", "How can we")}{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              {t("helpCenter.highlight", "help you today?")}
            </span>
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            {t(
              "helpCenter.description",
              "Search our knowledge base, explore quick support topics, or reach out directly to our support team.",
            )}
          </p>

          {/* Search Input Box */}
          <div className="pt-3 sm:pt-4 max-w-2xl mx-auto">
            <div className="relative flex items-center rounded-2xl border border-white/15 bg-slate-900/90 p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Search size={18} className="text-indigo-400 ml-2 sm:ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles (e.g. password, certificate, refund, AI tutor)..."
                className="w-full bg-transparent px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors mr-1 cursor-pointer"
                  title="Clear Search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Quick Suggestion Pills */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mt-3 sm:mt-4 text-xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-medium">Quick search:</span>
              {quickSuggestions.map((sug) => (
                <button
                  key={sug.label}
                  onClick={() => handleCardClick(sug.query)}
                  className={`px-2.5 sm:px-3 py-1 rounded-full border text-[10.5px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                    searchQuery === sug.query
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
                      : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Help Cards (No Explore Category Footer) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {quickHelp.map((card, idx) => {
            const Icon = card.icon;
            const isCardActive = searchQuery === card.query;
            return (
              <div
                key={idx}
                onClick={() => handleCardClick(card.query)}
                className={`group rounded-3xl border p-8 backdrop-blur-xl transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between ${
                  isCardActive
                    ? "bg-indigo-950/40 border-indigo-500/50 ring-2 ring-indigo-500/20"
                    : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-1"
                }`}
              >
                <div>
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-md"
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
              </div>
            );
          })}
        </div>

        {/* ── Knowledge Base FAQ Section ── */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {t("helpCenter.faq.tag", "KNOWLEDGE BASE")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                {t("helpCenter.faq.heading", "Frequently Asked Help Topics")}
              </h2>
            </div>

            {searchQuery && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full font-semibold">
                  {filteredFaqs.length} match{filteredFaqs.length !== 1 ? "es" : ""} for "{searchQuery}"
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-3">
                <HelpCircle size={36} className="mx-auto text-slate-500 opacity-60" />
                <h3 className="text-base font-bold text-white">No articles found matching "{searchQuery}"</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try searching for keywords like "password", "certificate", "AI", or "enroll".
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  Show All Articles
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                // Auto-open items if user is actively searching
                const isAutoOpen = Boolean(searchQuery.trim());
                const isOpen = isAutoOpen || open === index;
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
                      onClick={() => setOpen(open === index ? null : index)}
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
              <button className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-600 hover:from-indigo-400 hover:to-cyan-500 text-white font-black text-xs shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer">
                <Mail size={16} />
                <span>Contact Support</span>
              </button>
            </Link>

            <Link to="/faq">
              <button className="px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer">
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