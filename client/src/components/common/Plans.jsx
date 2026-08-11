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

        {/* ── 2. Tick Mark Comparison Table Matrix (Exact Reference Styling) ── */}
        <div className="space-y-6 pt-10">
          {/* Outer Table Container */}
          <div className="overflow-hidden rounded-2xl border-2 border-[#555] shadow-2xl bg-black">
            {/* Top Main Dark Burgundy Title Bar */}
            <div className="bg-[#4e1b20] py-3 px-6 text-center border-b-2 border-[#555]">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wider uppercase drop-shadow-md">
                {t("plans.heading", "SMART LEARNING PLANS")}
              </h2>
            </div>

            {/* Scrollable Table Viewport */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs sm:text-sm font-sans min-w-[680px]">
                <thead>
                  {/* Table Column Headers */}
                  <tr className="text-center font-black">
                    {/* Feature Column Header (Dark Khaki) */}
                    <th className="bg-[#3d4224] text-[#e8eccb] py-3 px-4 border border-[#555] w-[28%] text-left italic font-bold">
                      {t("plans.featureCol", "Feature")}
                    </th>

                    {/* Basic Plan Header */}
                    <th className="bg-[#787c80] text-black py-3 px-3 border border-[#555] w-[24%]">
                      <div className="flex items-center justify-center gap-1 font-black text-xs sm:text-sm">
                        <span>🗹 BASIC</span>
                      </div>
                      <div className="font-extrabold text-xs sm:text-sm mt-0.5">
                        ₹ 100
                      </div>
                    </th>

                    {/* Premium Plan Header */}
                    <th className="bg-[#943b3d] text-black py-3 px-3 border border-[#555] w-[24%]">
                      <div className="flex items-center justify-center gap-1 font-black text-xs sm:text-sm">
                        <span>🗹 PREMIUM ⭐️</span>
                      </div>
                      <div className="font-extrabold text-xs sm:text-sm mt-0.5">
                        ₹ 500
                      </div>
                    </th>

                    {/* Elite Plan Header */}
                    <th className="bg-[#b35c1e] text-black py-3 px-3 border border-[#555] w-[24%]">
                      <div className="flex items-center justify-center gap-1 font-black text-xs sm:text-sm">
                        <span>🗹 ELITE 👑</span>
                      </div>
                      <div className="font-extrabold text-xs sm:text-sm mt-0.5">
                        ₹ 1,000
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {TICK_COMPARISON_MATRIX.map((row, idx) => (
                    <tr key={idx} className="border-b border-[#555]">
                      {/* 1. Feature Name (Soft Sage/Khaki Cell) */}
                      <td className="bg-[#d2d9b6] text-[#242b12] font-bold py-2.5 px-3.5 text-left border border-[#555] leading-snug">
                        {row.link ? (
                          <Link
                            to={row.link}
                            className="hover:underline text-[#1e240f] flex items-center justify-between"
                          >
                            <span>{row.nameKey ? t(row.nameKey, row.feature) : row.feature}</span>
                            <span className="text-[10px] text-emerald-800">↗</span>
                          </Link>
                        ) : (
                          <span>{row.nameKey ? t(row.nameKey, row.feature) : row.feature}</span>
                        )}
                      </td>

                      {/* 2. Basic Cell (Soft Light Green) */}
                      <td className="bg-[#dce8d5] text-[#1e2b18] font-black py-2.5 px-3 border border-[#555]">
                        {row.basic === "✓" ? (
                          <span className="text-base text-[#193b12]">✓</span>
                        ) : row.basic === "—" ? (
                          <span className="text-slate-600 font-bold">—</span>
                        ) : (
                          <span className="text-xs">{row.basic}</span>
                        )}
                      </td>

                      {/* 3. Premium Cell (Soft Light Coral/Pink) */}
                      <td className="bg-[#f5c2c4] text-[#3d1114] font-black py-2.5 px-3 border border-[#555]">
                        {row.premium === "✓" ? (
                          <span className="text-base text-[#611016]">✓</span>
                        ) : row.premium === "—" ? (
                          <span className="text-slate-600 font-bold">—</span>
                        ) : (
                          <span className="text-xs">{row.premium}</span>
                        )}
                      </td>

                      {/* 4. Elite Cell (Soft Light Orange/Amber) */}
                      <td className="bg-[#f7c899] text-[#381c06] font-black py-2.5 px-3 border border-[#555]">
                        {row.elite === "✓" ? (
                          <span className="text-base text-[#692d04]">✓</span>
                        ) : row.elite === "—" ? (
                          <span className="text-slate-600 font-bold">—</span>
                        ) : row.elite.includes("EXCLUSIVE") ? (
                          <span className="text-xs font-black text-[#5c2400]">
                            ✓ EXCLUSIVE
                          </span>
                        ) : (
                          <span className="text-xs">{row.elite}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Plan Action Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 bg-[#1a1a1a] border-t-2 border-[#555] gap-3 items-center">
              <button
                onClick={() => handlePlanClick(SMART_PLANS[0])}
                className="py-3 rounded-xl bg-lime-700 hover:bg-lime-600 text-white font-bold text-xs cursor-pointer transition shadow-md"
              >
                {t("plans.chooseBasicWithPrice", "Choose Basic (₹100)")}
              </button>
              <button
                onClick={() => handlePlanClick(SMART_PLANS[1])}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer transition shadow-md"
              >
                {t("plans.choosePremiumWithPrice", "Choose Premium (₹500)")}
              </button>
              <button
                onClick={() => handlePlanClick(SMART_PLANS[2])}
                className="py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition shadow-md"
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