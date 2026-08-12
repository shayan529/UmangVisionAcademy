import React, { useEffect, useState, lazy, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchSubscription } from "../../redux/slices/billingSlice";
import { SMART_PLANS, TICK_COMPARISON_MATRIX } from "../../data/plansData";
import {
  Check,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const BillingPage = lazy(() => import("../../pages/BillingPage"));

const Plans = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { subscription } = useSelector((s) => s.billing);

  // State to track expanded features per card
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpandCard = (planId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

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
    <section className="px-4 sm:px-6 md:px-10 py-16 md:py-24 bg-[#0B1120] text-slate-100 min-h-screen font-sans">
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
              "All-inclusive academic subscriptions designed for school curriculum mastery, competitive entrance readiness, 1-on-1 career counselling, and global higher-study pathways.",
            )}
          </p>
        </div>

        {/* ── 1. Plan Overview Cards (With Full Points & View More) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {SMART_PLANS.map((plan) => {
            const isExpanded = Boolean(expandedCards[plan.id]);
            const features = plan.allFeatures || [];
            const visibleFeatures = isExpanded ? features : features.slice(0, 6);
            const remainingCount = features.length - 6;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all duration-300 shadow-2xl ${
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
                  {/* Badge & Icon */}
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

                  {/* Title & Tagline */}
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {t(plan.labelKey, plan.label)}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 min-h-[36px] leading-relaxed">
                    {t(plan.taglineKey, plan.tagline)}
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
                        /{t(plan.periodKey, plan.period)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold block mt-1">
                      {t("plans.billedAnnually", "Billed annually • Full 365-day access")}
                    </span>
                  </div>

                  {/* Feature Bullets List with View More */}
                  <div className="space-y-3 mb-6">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {t("plans.includedIn", "Included in {{plan}}:", { plan: t(plan.labelKey, plan.label) })} ({features.length} {t("plans.featuresCount", "FEATURES")}):
                    </p>

                    <div className="space-y-2.5">
                      {visibleFeatures.map((feat, idx) => {
                        const featureKey = plan.featureKeys?.[idx];
                        const featureText = featureKey ? t(featureKey, feat) : feat;
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-slate-300 leading-snug"
                          >
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]"
                              style={{
                                background: `${plan.color}25`,
                                color: plan.color,
                              }}
                            >
                              ✓
                            </div>
                            <span>{featureText}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* View More / View Less Button */}
                    {features.length > 6 && (
                      <button
                        type="button"
                        onClick={() => toggleExpandCard(plan.id)}
                        className="mt-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition hover:underline"
                        style={{ color: plan.color }}
                      >
                        {isExpanded ? (
                          <>
                            <span>{t("plans.viewLessFeatures", "View less features")}</span>
                            <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            <span>{t("plans.viewMoreFeatures", "View {{count}} more features", { count: remainingCount })}</span>
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-4">
                  <button
                    onClick={() => handlePlanClick(plan)}
                    className="w-full py-4 rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: plan.popular
                        ? "linear-gradient(135deg, #f43f5e, #e11d48)"
                        : plan.vip
                          ? "linear-gradient(135deg, #f59e0b, #d97706)"
                          : "linear-gradient(135deg, #65a30d, #4d7c0f)",
                      color: plan.vip ? "#0f172a" : "#ffffff",
                    }}
                  >
                    {user ? t(plan.buttonKey, plan.buttonText) : t("plans.signIn", "Sign In →")}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 2. Tick Mark Comparison Table Matrix ── */}
        <div className="space-y-4 pt-4 max-w-4xl mx-auto w-full">
          {/* Outer Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-800/90 shadow-xl bg-slate-900/80 backdrop-blur-xl">
            {/* Top Main Title Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 py-2 px-4 text-center border-b border-slate-800">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-widest uppercase drop-shadow-sm flex items-center justify-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                {t("plans.heading", "SMART LEARNING PLANS COMPARISON")}
              </h2>
            </div>

            {/* Scrollable Table Viewport */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-[11px] font-sans min-w-[500px]">
                <thead>
                  {/* Table Column Headers */}
                  <tr className="border-b border-slate-800 text-[11px]">
                    {/* Feature Column Header */}
                    <th className="bg-slate-900/90 text-slate-400 py-2 px-3 w-[34%] text-left font-bold uppercase tracking-wider">
                      {t("plans.featureCol", "Feature")}
                    </th>

                    {/* Basic Plan Header */}
                    <th className="bg-lime-950/20 text-lime-400 py-2 px-2 border-l border-slate-800/80 w-[22%]">
                      <div className="flex items-center justify-center gap-1 font-black text-xs">
                        <span>📋 BASIC</span>
                      </div>
                      <div className="font-extrabold text-[10px] text-lime-300/80 mt-0.5">
                        ₹100 / year
                      </div>
                    </th>

                    {/* Premium Plan Header */}
                    <th className="bg-rose-950/30 text-rose-300 py-2 px-2 border-l border-slate-800/80 w-[22%] relative">
                      <div className="flex items-center justify-center gap-1 font-black text-xs text-rose-400">
                        <span>⭐ PREMIUM</span>
                      </div>
                      <div className="font-extrabold text-[10px] text-rose-300/80 mt-0.5">
                        ₹500 / year
                      </div>
                    </th>

                    {/* Elite Plan Header */}
                    <th className="bg-amber-950/30 text-amber-300 py-2 px-2 border-l border-slate-800/80 w-[22%]">
                      <div className="flex items-center justify-center gap-1 font-black text-xs text-amber-400">
                        <span>👑 ELITE</span>
                      </div>
                      <div className="font-extrabold text-[10px] text-amber-300/80 mt-0.5">
                        ₹1,000 / year
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {TICK_COMPARISON_MATRIX.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-800/30 transition-colors text-[11px]"
                    >
                      {/* 1. Feature Name */}
                      <td className="bg-slate-900/60 text-slate-200 font-medium py-1.5 px-3 text-left leading-tight">
                        {row.link ? (
                          <Link
                            to={row.link}
                            className="hover:text-indigo-300 hover:underline flex items-center justify-between group"
                          >
                            <span>{row.nameKey ? t(row.nameKey, row.feature) : row.feature}</span>
                            <span className="text-[9px] text-indigo-400 opacity-60 group-hover:opacity-100">↗</span>
                          </Link>
                        ) : (
                          <span>{row.nameKey ? t(row.nameKey, row.feature) : row.feature}</span>
                        )}
                      </td>

                      {/* 2. Basic Cell */}
                      <td className="bg-lime-950/10 text-slate-300 py-1.5 px-2 border-l border-slate-800/60 font-semibold">
                        {row.basic === "✓" ? (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-lime-500/15 text-lime-400 font-bold text-[10px]">
                            ✓
                          </span>
                        ) : row.basic === "—" ? (
                          <span className="text-slate-600 text-xs">—</span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">{row.basic}</span>
                        )}
                      </td>

                      {/* 3. Premium Cell */}
                      <td className="bg-rose-950/15 text-slate-300 py-1.5 px-2 border-l border-slate-800/60 font-semibold">
                        {row.premium === "✓" ? (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500/15 text-rose-400 font-bold text-[10px]">
                            ✓
                          </span>
                        ) : row.premium === "—" ? (
                          <span className="text-slate-600 text-xs">—</span>
                        ) : (
                          <span className="text-rose-200 text-[11px]">{row.premium}</span>
                        )}
                      </td>

                      {/* 4. Elite Cell */}
                      <td className="bg-amber-950/15 text-slate-300 py-1.5 px-2 border-l border-slate-800/60 font-semibold">
                        {row.elite === "✓" ? (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/15 text-amber-400 font-bold text-[10px]">
                            ✓
                          </span>
                        ) : row.elite === "—" ? (
                          <span className="text-slate-600 text-xs">—</span>
                        ) : row.elite.includes("EXCLUSIVE") ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black">
                            ✓ EXCLUSIVE
                          </span>
                        ) : (
                          <span className="text-amber-200 text-[11px]">{row.elite}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Plan Action Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 p-2.5 bg-slate-950/90 border-t border-slate-800 gap-2.5 items-center">
              <button
                onClick={() => handlePlanClick(SMART_PLANS[0])}
                className="py-1.5 px-3 rounded-lg bg-lime-600 hover:bg-lime-500 text-white font-bold text-[11px] cursor-pointer transition shadow-sm shadow-lime-900/20 active:scale-[0.98]"
              >
                {t("plans.chooseBasicWithPrice", "Choose Basic (₹100)")}
              </button>
              <button
                onClick={() => handlePlanClick(SMART_PLANS[1])}
                className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] cursor-pointer transition shadow-sm shadow-rose-900/20 active:scale-[0.98]"
              >
                {t("plans.choosePremiumWithPrice", "Choose Premium (₹500)")}
              </button>
              <button
                onClick={() => handlePlanClick(SMART_PLANS[2])}
                className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer transition shadow-sm shadow-amber-900/20 active:scale-[0.98]"
              >
                {t("plans.chooseEliteWithPrice", "Unlock Elite (₹1,000)")}
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. FAQ Quick Section ── */}
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
                {t("plans.faq1A", "When you activate your plan, you select your grade (e.g. Class 9, 10, 11, or 12). All syllabus subjects, live lessons, notes, and recorded classes for that grade are automatically unlocked for you.")}
              </p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <h4 className="font-bold text-white mb-1">
                {t("plans.faq2Q", "What is included in Elite Exclusive features?")}
              </h4>
              <p className="text-slate-400">
                {t("plans.faq2A", "Elite members get direct Higher-Study Scholarship Eligibility nomination (up to 100% college grant) and dedicated International Study Counselling with country guides, test prep, SOP review studio, and 1-on-1 global education advisors.")}
              </p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <h4 className="font-bold text-white mb-1">
                {t("plans.faq3Q", "Can I upgrade my plan mid-year?")}
              </h4>
              <p className="text-slate-400">
                {t("plans.faq3A", "Yes! You can easily upgrade from Basic to Premium or Elite anytime from your Student Dashboard Billing page.")}
              </p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <h4 className="font-bold text-white mb-1">
                {t("plans.faq4Q", "How do Career Counselling sessions work?")}
              </h4>
              <p className="text-slate-400">
                {t("plans.faq4A", "Basic plans include 2 sessions per year, while Premium & Elite plans include 5 sessions per year. You can book 1-on-1 video consultations with certified counsellors directly in your dashboard.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Plans;