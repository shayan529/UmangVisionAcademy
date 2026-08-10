import React, { useEffect, useState, lazy, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchSubscription } from "../../redux/slices/billingSlice";
import { SMART_PLANS, SMART_PLAN_FEATURES } from "../../data/plansData";
import {
  Check,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Zap,
  Globe,
  Compass,
  Award,
} from "lucide-react";

const BillingPage = lazy(() => import("../../pages/BillingPage"));

// Feature key map for multilingual support
const FEATURE_KEY_MAP = {
  "All Class Subjects Covered": "plans.features.allSubjectsCovered",
  "Live Lessons & Study Resources": "plans.features.liveLessonsResources",
  "AI Tutor & Quizzes": "plans.features.aiTutorQuizzes",
  "3-Page Smart Progress Report Card": "plans.features.progressReport3",
  "3 Practice Tests & 3-Year Question Bank": "plans.features.practiceTests3",
  "2 Expert Career Counselling Sessions/Year": "plans.features.careerSessions2",
  "Everything in Basic Plan": "plans.features.everythingInBasic",
  "8-Page Detailed Performance Report Card ⬆️": "plans.features.progressReport8",
  "5 Advanced Tests & 10-Year Question Bank ⬆️": "plans.features.advancedTests5",
  "Subject, Class & Competitive Exam SMS Alerts": "plans.features.smsAlerts",
  "5 Expert Career Counselling Sessions/Year ⬆️": "plans.features.careerSessions5",
  "Live Support & Personalized Learning Paths": "plans.features.liveSupportPaths",
  "Priority Instructor & Mentor Collaboration": "plans.features.priorityInstructorMentor",
  "Everything in Premium Plan": "plans.features.everythingInPremium",
  "12-Page Comprehensive Report Card ⬆️": "plans.features.progressReport12",
  "10 Tests per Wing / Domain": "plans.features.testsPerWing10",
  "10-Year Complete Question Bank Archive": "plans.features.questionBank10Years",
  "International Study Counselling & Support (EXCLUSIVE)": "plans.features.intlStudyCounselling",
  "Higher-Study Scholarship Eligibility* (EXCLUSIVE)": "plans.features.scholarshipEligibility",
  "VIP Priority Mentor & Fast-Track Doubt Resolution": "plans.features.vipMentorFastTrack",
};




const Plans = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { subscription } = useSelector((s) => s.billing);

  useEffect(() => {
    if (user) {
      dispatch(fetchSubscription());
    }
  }, [user, dispatch]);

  if (
    location.pathname === "/plans" &&
    (subscription?.status === "active" || subscription?.status === "cancelled")
  ) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
            Loading Billing Info...
          </div>
        }
      >
        <BillingPage />
      </Suspense>
    );
  }

  const handlePlanClick = (plan) => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    navigate("/student-dashboard/billing", { state: { plan } });
  };

  return (
    <section className="px-4 sm:px-6 md:px-10 py-16 md:py-24 bg-[#0B1120] text-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* ── Top Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 border border-white/10 text-amber-300 text-xs font-black uppercase tracking-widest">
            <Sparkles size={14} className="text-amber-400" />
            {t("plans.heroTag", "Transparent & Empowering Pricing")}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
            {t("plans.heading", "Smart Learning Plans")}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed">
            {t(
              "plans.subtitle",
              "All-inclusive academic subscriptions designed for school curriculum mastery, competitive entrance readiness, 1-on-1 career counselling, and global higher-study pathways."
            )}
          </p>
        </div>

        {/* ── 1. Plan Overview Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {SMART_PLANS.map((plan) => {
            const isSelectedPlan = subscription?.plan === plan.id;
            const translatedPlanTitle = t(`plans.${plan.id}Plan`, `${plan.title} Plan`);
            const translatedTagline = t(`plans.tagline${plan.title}`, plan.tagline);
            const translatedCta = t(`plans.choose${plan.title}`, plan.buttonText);

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all duration-300 hover:-translate-y-2 shadow-2xl ${
                  plan.popular
                    ? "bg-gradient-to-b from-rose-950/60 via-slate-900 to-purple-950/40 border-rose-500/50 shadow-rose-500/10 md:scale-105"
                    : plan.vip
                    ? "bg-gradient-to-b from-amber-950/50 via-slate-900 to-slate-900 border-amber-500/50 shadow-amber-500/10"
                    : "bg-slate-900/60 via-slate-900 to-slate-950 border-lime-500/30"
                }`}
                style={{
                  borderTop: `4px solid ${plan.color}`,
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg">
                    ⭐ {t("plans.mostPopular", "MOST POPULAR")}
                  </div>
                )}
                {plan.vip && (
                  <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-3.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg">
                    👑 {t("plans.vipExclusive", "VIP EXCLUSIVE")}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider"
                      style={{
                        background: `${plan.color}20`,
                        color: plan.color,
                        border: `1px solid ${plan.color}40`,
                      }}
                    >
                      {plan.badge}
                    </span>
                    <span className="text-2xl">{plan.icon}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {translatedPlanTitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 min-h-[36px] leading-relaxed">
                    {translatedTagline}
                  </p>

                  {/* Price */}
                  <div className="mt-6 mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="text-4xl sm:text-5xl font-black tracking-tight"
                        style={{ color: plan.popular ? "#fff" : plan.color }}
                      >
                        {plan.price}
                      </span>
                      <span className="text-sm font-bold text-slate-400">
                        /{t("plans.perYear", plan.period)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold block mt-1">
                      {t("plans.billedAnnually", "Billed annually • Full 365-day access")}
                    </span>
                  </div>

                  {/* Feature Bullets */}
                  <div className="space-y-3.5 mb-8">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {t("plans.includedIn", { plan: translatedPlanTitle, defaultValue: `Included in ${translatedPlanTitle}:` })}
                    </p>
                    {plan.keyFeatures.map((feat, idx) => {
                      const transKey = FEATURE_KEY_MAP[feat];
                      const translatedFeature = transKey ? t(transKey, feat) : feat;

                      return (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]"
                            style={{
                              background: `${plan.color}25`,
                              color: plan.color,
                            }}
                          >
                            ✓
                          </div>
                          <span className="leading-snug">{translatedFeature}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action CTA */}
                <div>
                  <button
                    onClick={() => handlePlanClick(plan)}
                    className="w-full py-4 rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xl"
                    style={{
                      background: plan.popular
                        ? "linear-gradient(135deg, #f43f5e, #e11d48)"
                        : plan.vip
                        ? "linear-gradient(135deg, #f59e0b, #d97706)"
                        : "linear-gradient(135deg, #65a30d, #4d7c0f)",
                      color: plan.vip ? "#0f172a" : "#ffffff",
                    }}
                  >
                    {user ? translatedCta : t("nav.login", "Log in to Subscribe")}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 2. Complete 17-Feature Comparison Matrix Section ── */}
        <div className="space-y-8 pt-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {t("plans.matrixTitle", "SMART LEARNING PLANS — Complete Comparison")}
            </h2>
            <p className="text-xs sm:text-base text-slate-400 max-w-3xl mx-auto">
              {t(
                "plans.matrixSubtitle",
                "Side-by-side breakdown of all 17 features, quotas, report card depth, and exclusive mentorship services."
              )}
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/90 shadow-2xl">
            {/* Top Table Title Banner (Deep Burgundy Header) */}
            <div className="bg-[#5b1419] py-4 px-6 text-center border-b border-red-900/60 shadow-inner">
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">
                {t("plans.heading", "SMART LEARNING PLANS")}
              </h3>
            </div>

            <div className="overflow-x-auto rounded-none">
              <table className="w-full text-left border-collapse text-xs sm:text-sm border border-[#888]">
                {/* Top burgundy banner row */}
                <thead>
                  <tr>
                    <th
                      colSpan={4}
                      className="bg-[#8B1A1A] text-white text-center font-black text-sm sm:text-base py-3 px-4 border border-[#666] tracking-wide uppercase"
                    >
                      {t("plans.heading", "SMART LEARNING PLANS")} Feature
                    </th>
                  </tr>
                  {/* Plan header row */}
                  <tr className="text-center bg-[#5a5a5a] text-white">
                    <th className="border border-[#888] px-3 py-2 w-12 text-center font-black text-xs">
                      S.N o.
                    </th>
                    <th className="border border-[#888] px-4 py-2 font-black text-xs sm:text-sm">
                      <div className="text-white">🗒 BASIC</div>
                      <div className="text-yellow-300 font-extrabold text-sm mt-0.5">₹ 100</div>
                    </th>
                    <th className="border border-[#888] px-4 py-2 font-black text-xs sm:text-sm">
                      <div className="text-white">🗒 PREMIUM ⭐</div>
                      <div className="text-yellow-300 font-extrabold text-sm mt-0.5">₹ 500</div>
                    </th>
                    <th className="border border-[#888] px-4 py-2 font-black text-xs sm:text-sm">
                      <div className="text-white">🗒 ELITE 👑</div>
                      <div className="text-yellow-300 font-extrabold text-sm mt-0.5">₹ 1,000</div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {SMART_PLAN_FEATURES.map((item, idx) => {
                    // Build readable cell text for each plan
                    const getCellText = (val, featureName) => {
                      if (val === true) return featureName;
                      if (val === false) return "—";
                      return val; // string quota/value
                    };

                    const basicText = getCellText(item.basic, item.feature);
                    const premiumText = getCellText(item.premium, item.feature);
                    const eliteText = getCellText(item.elite, item.feature);

                    return (
                      <tr key={idx} className="text-center bg-white text-[#1a1a1a] border-b border-[#ccc]">
                        {/* S.No */}
                        <td className="border border-[#888] px-2 py-2.5 font-black text-xs text-center w-10">
                          {idx + 1}
                        </td>

                        {/* Basic */}
                        <td className="border border-[#888] px-3 py-2.5 font-bold text-xs sm:text-sm text-center">
                          {item.basic === false ? (
                            <span className="text-[#555] font-bold">—</span>
                          ) : (
                            <span>{basicText}</span>
                          )}
                        </td>

                        {/* Premium */}
                        <td className="border border-[#888] px-3 py-2.5 font-bold text-xs sm:text-sm text-center">
                          {item.premium === false ? (
                            <span className="text-[#555] font-bold">—</span>
                          ) : (
                            <span>{premiumText}</span>
                          )}
                        </td>

                        {/* Elite */}
                        <td className="border border-[#888] px-3 py-2.5 font-bold text-xs sm:text-sm text-center">
                          {item.elite === false ? (
                            <span className="text-[#555] font-bold">—</span>
                          ) : (
                            <span>{eliteText}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-6 bg-slate-950/80 border-t border-slate-800 gap-3 items-center">
              <button
                onClick={() => handlePlanClick(SMART_PLANS[0])}
                className="py-3 rounded-xl bg-lime-700 hover:bg-lime-600 text-white font-bold text-xs cursor-pointer"
              >
                {t("plans.chooseBasicWithPrice", "Choose Basic (₹100)")}
              </button>
              <button
                onClick={() => handlePlanClick(SMART_PLANS[1])}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {t("plans.choosePremiumWithPrice", "Choose Premium (₹500)")}
              </button>
              <button
                onClick={() => handlePlanClick(SMART_PLANS[2])}
                className="py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {t("plans.chooseEliteWithPrice", "Unlock Elite (₹1,000)")}
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Quick Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-10">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <HelpCircle className="text-indigo-400" size={22} />
            {t("plans.faqTitle", "Frequently Asked Questions about Smart Learning Plans")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-300">
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <h4 className="font-bold text-white mb-1">
                {t("plans.faq1Q", "How does Class selection work?")}
              </h4>
              <p className="text-slate-400">
                {t(
                  "plans.faq1A",
                  "When you activate your plan, you select your grade (e.g. Class 9, 10, 11, or 12). All syllabus subjects, live lessons, notes, and recorded classes for that grade are automatically unlocked for you."
                )}
              </p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <h4 className="font-bold text-white mb-1">
                {t("plans.faq2Q", "What is included in Elite Exclusive features?")}
              </h4>
              <p className="text-slate-400">
                {t(
                  "plans.faq2A",
                  "Elite members get direct Higher-Study Scholarship Eligibility nomination (up to 100% college grant) and dedicated International Study Counselling with country guides, test prep, SOP review studio, and 1-on-1 global education advisors."
                )}
              </p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <h4 className="font-bold text-white mb-1">
                {t("plans.faq3Q", "Can I upgrade my plan mid-year?")}
              </h4>
              <p className="text-slate-400">
                {t(
                  "plans.faq3A",
                  "Yes! You can easily upgrade from Basic to Premium or Elite anytime from your Student Dashboard Billing page."
                )}
              </p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <h4 className="font-bold text-white mb-1">
                {t("plans.faq4Q", "How do Career Counselling sessions work?")}
              </h4>
              <p className="text-slate-400">
                {t(
                  "plans.faq4A",
                  "Basic plans include 2 sessions per year, while Premium & Elite plans include 5 sessions per year. You can book 1-on-1 video consultations with certified counsellors directly in your dashboard."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Plans;