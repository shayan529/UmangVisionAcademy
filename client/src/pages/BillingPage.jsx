import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import SEO from "../components/common/SEO";
import {
  fetchSubscription,
  createOrder,
  verifyPayment,
  cancelSubscription,
  clearBillingError,
  resetPaymentSuccess,
} from "../redux/slices/billingSlice";
import { loadCurrentUser } from "../redux/slices/authSlice";
import { SMART_PLANS } from "../data/plansData";
import {
  Check,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  CreditCard,
  AlertCircle,
  X,
  Star,
  GraduationCap,
} from "lucide-react";

const fmt = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const daysLeft = (endDate) => {
  if (!endDate) return 0;
  const diff = new Date(endDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const PLAN_TIERS = {
  base: 1,
  basic: 1,
  standard: 2,
  premium: 3,
  vip: 3,
  elite: 3,
};

const statusColors = {
  active: { bg: "#064e3b", text: "#34d399", border: "#059669", label: "Active" },
  expired: { bg: "#450a0a", text: "#f87171", border: "#dc2626", label: "Expired" },
  cancelled: { bg: "#1e293b", text: "#94a3b8", border: "#475569", label: "Cancelled" },
};

const planColors = {
  base: "#84cc16",
  basic: "#84cc16",
  standard: "#f43f5e",
  premium: "#f59e0b",
  elite: "#f59e0b",
};

export default function BillingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const selectedPlanFromNav = location.state?.plan ?? null;

  const { user } = useSelector((s) => s.auth);
  const {
    subscription,
    loading,
    orderLoading,
    paymentLoading,
    paymentSuccess,
    error,
  } = useSelector((s) => s.billing);

  const [showCancel, setShowCancel] = useState(false);
  const [selectedClass, setSelectedClass] = useState(
    user?.selectedClass || "Class 9"
  );
  const [expandedCards, setExpandedCards] = useState({});
  const [processingPlanId, setProcessingPlanId] = useState(null);

  const toggleExpandCard = (planId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { from: "/student-dashboard/billing" },
        replace: true,
      });
    }
  }, [user, navigate]);

  useEffect(() => {
    dispatch(fetchSubscription());
  }, [dispatch]);

  useEffect(() => {
    if (user?.selectedClass && !selectedClass) {
      setSelectedClass(user.selectedClass);
    }
  }, [user?.selectedClass]);

  useEffect(() => {
    if (paymentSuccess) {
      const timer = setTimeout(() => {
        dispatch(resetPaymentSuccess());
        dispatch(fetchSubscription());
        dispatch(loadCurrentUser());
        setProcessingPlanId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, dispatch]);

  const handlePay = async (plan) => {
    if (!selectedClass) {
      alert("Please select your class before proceeding.");
      return;
    }

    setProcessingPlanId(plan.id);

    const result = await dispatch(
      createOrder({
        planId: plan.id,
        selectedClass,
      })
    );

    if (createOrder.rejected.match(result)) {
      setProcessingPlanId(null);
      return;
    }

    const { orderId } = result.payload;

    await dispatch(
      verifyPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: `mock_pay_${Date.now()}`,
        razorpay_signature: "mock_signature",
        planId: plan.id,
        selectedClass,
      })
    );

    dispatch(fetchSubscription());
    dispatch(loadCurrentUser());
  };

  const handleCancel = async () => {
    await dispatch(cancelSubscription());
    setShowCancel(false);
    dispatch(fetchSubscription());
  };

  if (!user) return null;

  const activeSub =
    subscription?.status === "active" || subscription?.status === "cancelled"
      ? subscription
      : null;

  const subscribedClasses = Array.isArray(user?.subscribedClasses)
    ? user.subscribedClasses
    : Array.isArray(user?.subscriptions)
    ? [...new Set(user.subscriptions.map((s) => s.selectedClass).filter(Boolean))]
    : [];

  const hasMultipleSubscriptions = subscribedClasses.length > 1;

  const currentPlanKey = (subscription?.plan || "").toLowerCase();
  const currentTier = PLAN_TIERS[currentPlanKey] || (activeSub ? 1 : 0);
  const subStatus = subscription?.status || "active";
  const subColor = statusColors[subStatus] ?? statusColors.active;
  const accentColor = planColors[currentPlanKey] ?? "#7c3aed";
  const days = daysLeft(subscription?.endDate);
  const totalDays = 365;
  const progressPercent = Math.min(100, Math.max(5, (days / totalDays) * 100));

  return (
    <>
      <SEO
        title="Billing & Subscription Plans"
        description="Manage your active Smart Learning Plan and upgrade tiers at Umang Vision Academy."
      />

      <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
          {/* ── Payment Success Notification ── */}
          {paymentSuccess && (
            <div className="bg-emerald-950/80 border border-emerald-500/60 rounded-2xl p-5 flex items-center gap-4 shadow-xl animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xl font-bold">
                ✓
              </div>
              <div>
                <p className="font-extrabold text-emerald-300 text-base sm:text-lg">
                  Subscription successfully activated!
                </p>
                <p className="text-xs sm:text-sm text-emerald-400/80 mt-0.5">
                  Your academic plan has been updated and all benefits are unlocked.
                </p>
              </div>
            </div>
          )}

          {/* ── Error Notification ── */}
          {error && (
            <div className="bg-rose-950/80 border border-rose-500/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2 text-rose-300 text-sm">
                <AlertCircle size={18} className="text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => dispatch(clearBillingError())}
                className="text-rose-400 hover:text-white transition p-1"
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ── Page Header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                <CreditCard size={13} className="text-purple-400" />
                <span>Billing & Subscription Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {activeSub ? "My Subscription & Upgrades" : "Smart Learning Plans"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                {activeSub
                  ? "View your active plan details, track validity, and upgrade your tier for higher academic mastery."
                  : "Choose an all-inclusive annual subscription to unlock curriculum mastery, mock test series, and mentorship."}
              </p>
            </div>

            {/* Target Class Selector - Only shown if user has taken multiple subscriptions for different classes */}
            {hasMultipleSubscriptions && (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 shrink-0">
                <GraduationCap size={16} className="text-indigo-400" />
                <span className="text-xs text-slate-400 font-medium">Class:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-100 outline-none cursor-pointer"
                >
                  {subscribedClasses.map((cls) => (
                    <option key={cls} value={cls} className="bg-slate-900">
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ── 1. ACTIVE SUBSCRIPTION OVERVIEW BANNER (If Subscribed) ── */}
          {activeSub ? (
            <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-2xl overflow-hidden">
              {/* Background Glow */}
              <div
                className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: accentColor }}
              />

              <div className="relative z-10 space-y-6">
                {/* Top status bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      CURRENT ACTIVE PLAN
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                      style={{
                        background: subColor.bg,
                        color: subColor.text,
                        border: `1px solid ${subColor.border}`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {subColor.label}
                    </span>
                  </div>

                  {subscription.status === "active" && (
                    <button
                      onClick={() => setShowCancel(true)}
                      className="text-xs font-semibold text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>

                {/* Main Plan Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {currentPlanKey === "premium" ? "👑" : currentPlanKey === "standard" ? "⭐" : "📋"}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-white capitalize">
                        {subscription.label || `${subscription.plan} Plan`}
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Enrolled Grade: <strong className="text-indigo-300">{user.selectedClass || subscription.selectedClass || selectedClass}</strong> • Full 365-day academic access unlocked.
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Days Remaining
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">{days}</span>
                      <span className="text-xs text-slate-400">days left</span>
                    </div>
                  </div>
                </div>

                {/* Validity Progress Bar & Dates */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-indigo-400" />
                      Started: {fmt(subscription.startDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-amber-400" />
                      Renews / Expires: {fmt(subscription.endDate)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-700 shadow-sm"
                      style={{
                        width: `${progressPercent}%`,
                        background: `linear-gradient(90deg, ${accentColor}, #818cf8)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* ── 2. PLAN SELECTION & UPGRADE MATRIX ── */}
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {activeSub ? "Upgrade Your Learning Plan" : "Choose Your Smart Learning Plan"}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                {activeSub
                  ? "Upgrade to a higher tier anytime. The new benefits, question bank archives, and 1-on-1 faculty support will activate instantly."
                  : "All plans include 365-day access to class subjects, question banks, and smart AI tools."}
              </p>
            </div>

            {/* 3 Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {SMART_PLANS.map((plan) => {
                const planTier = PLAN_TIERS[plan.id.toLowerCase()] || 1;
                const isCurrent = activeSub && planTier === currentTier;
                const isLower = activeSub && planTier < currentTier;
                const isUpgrade = activeSub && planTier > currentTier;
                const isSelected = selectedPlanFromNav?.id === plan.id;
                const isPopular = plan.id === "standard";
                const isPremium = plan.id === "premium";

                const isExpanded = Boolean(expandedCards[plan.id]);
                const features = plan.allFeatures || [];
                const visibleFeatures = isExpanded ? features : features.slice(0, 5);
                const remainingCount = features.length - 5;
                const isProcessing = processingPlanId === plan.id && (orderLoading || paymentLoading);

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-3xl p-5 sm:p-7 flex flex-col justify-between border transition-all duration-300 shadow-2xl ${
                      isCurrent
                        ? "bg-slate-900/90 border-2 border-emerald-400/80 shadow-emerald-950/40 ring-2 ring-emerald-400/30"
                        : isUpgrade
                        ? isPremium
                          ? "bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-900 border-2 border-amber-500/60 shadow-amber-950/40 hover:border-amber-400"
                          : "bg-gradient-to-b from-purple-950/70 via-slate-900 to-slate-900 border-2 border-purple-500/60 shadow-purple-950/40 hover:border-purple-400"
                        : isPopular
                        ? "bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/40"
                        : isPremium
                        ? "bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/40"
                        : "bg-slate-900/60 border border-slate-800"
                    }`}
                    style={{
                      borderTop: `4px solid ${plan.color}`,
                    }}
                  >
                    {/* Top Badges */}
                    {isCurrent && (
                      <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                        <span>✓ ACTIVE PLAN</span>
                      </div>
                    )}
                    {!isCurrent && isPopular && (
                      <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                        ⭐ {t("plans.mostPopular", "MOST POPULAR")}
                      </div>
                    )}
                    {!isCurrent && isPremium && (
                      <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                        👑 {t("plans.vipExclusive", "VIP EXCLUSIVE")}
                      </div>
                    )}

                    <div>
                      {/* Header row */}
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
                      <h3 className="text-2xl font-black text-white">
                        {t(plan.labelKey, plan.label)}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 min-h-[32px] leading-relaxed">
                        {t(plan.taglineKey, plan.tagline)}
                      </p>

                      {/* Pricing */}
                      <div className="mt-4 mb-5 pb-5 border-b border-white/10">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className="text-3xl sm:text-4xl font-black tracking-tight"
                            style={{ color: plan.color }}
                          >
                            {plan.price}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            /{t(plan.periodKey, plan.period)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                          {t("plans.billedAnnually", "Billed annually • Full 365-day access")}
                        </span>
                      </div>

                      {/* Feature Points */}
                      <div className="space-y-2.5 mb-5">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Included features ({features.length}):
                        </p>
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

                      {/* View More / View Less Toggle */}
                      {features.length > 5 && (
                        <button
                          type="button"
                          onClick={() => toggleExpandCard(plan.id)}
                          className="mb-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition hover:underline"
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

                    {/* Action CTA Button */}
                    <div className="pt-2">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-3.5 rounded-xl font-black text-xs sm:text-sm bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 flex items-center justify-center gap-2 cursor-default"
                        >
                          <Check size={16} />
                          <span>Current Active Plan</span>
                        </button>
                      ) : isLower ? (
                        <button
                          disabled
                          className="w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-800/40 border border-slate-700/50 text-slate-500 flex items-center justify-center gap-2 cursor-default"
                        >
                          <span>Included in Your Plan</span>
                        </button>
                      ) : isUpgrade ? (
                        <button
                          onClick={() => handlePay(plan)}
                          disabled={isProcessing}
                          className="w-full py-3.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            background: isPremium
                              ? "linear-gradient(135deg, #f59e0b, #d97706)"
                              : "linear-gradient(135deg, #a855f7, #7c3aed)",
                            color: isPremium ? "#0f172a" : "#ffffff",
                          }}
                        >
                          {isProcessing ? (
                            <span>Upgrading…</span>
                          ) : (
                            <>
                              <Zap size={15} className={isPremium ? "fill-slate-900" : "fill-white"} />
                              <span>Upgrade to {plan.title} ({plan.price})</span>
                              <ArrowRight size={15} />
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePay(plan)}
                          disabled={isProcessing}
                          className="w-full py-3.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            background: isPopular
                              ? "linear-gradient(135deg, #f43f5e, #e11d48)"
                              : isPremium
                              ? "linear-gradient(135deg, #f59e0b, #d97706)"
                              : "linear-gradient(135deg, #65a30d, #4d7c0f)",
                            color: isPremium ? "#0f172a" : "#ffffff",
                          }}
                        >
                          {isProcessing ? (
                            <span>Processing…</span>
                          ) : (
                            <>
                              <span>Choose {plan.title} ({plan.price})</span>
                              <ArrowRight size={15} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 3. TRANSACTION / RECEIPT DETAILS ── */}
          {subscription?.razorpayPaymentId && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Verified Payment Transaction</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Payment ID</span>
                  <span className="font-mono text-slate-200 font-semibold break-all">
                    {subscription.razorpayPaymentId}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Order ID</span>
                  <span className="font-mono text-slate-200 font-semibold break-all">
                    {subscription.razorpayOrderId || "—"}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Plan Tier</span>
                  <span className="text-slate-200 font-bold capitalize">
                    {subscription.label || subscription.plan}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Status</span>
                  <span className="text-emerald-400 font-bold uppercase">
                    Active & Verified
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Cancel Subscription Modal ── */}
      {showCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="text-xl font-black text-white">
              Cancel Subscription?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your benefits will remain active until{" "}
              <strong className="text-white">{fmt(subscription?.endDate)}</strong>. After that, faculty doubt support and scholarship eligibility will end.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
              >
                {loading ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
