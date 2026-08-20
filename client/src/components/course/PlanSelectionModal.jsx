import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Crown,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SMART_PLANS } from "../../data/plansData.js";

export default function PlanSelectionModal({
  isOpen,
  onClose,
  course,
  selectedPlanId = "basic",
  onSelectPlan,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State to track expanded features per card (matching /plans)
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpandCard = (planId, e) => {
    e?.stopPropagation?.();
    setExpandedCards((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const courseClass = course?.category || "Your Class";

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-y-auto">
      {/* Dark blur backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Card Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-[#0f172a] border border-purple-500/30 rounded-3xl shadow-2xl z-10 flex flex-col p-4 sm:p-6 md:p-8 text-slate-100 animate-slideDown">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700/60 z-20"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-inner">
            <Sparkles size={13} className="text-purple-400" />
            <span>{t("plans.heading", "Smart Learning Plans")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Choose Your Smart Learning Plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl mx-auto leading-relaxed">
            Unlock all subjects of <strong className="text-slate-200">{courseClass}</strong> (including <strong className="text-purple-300">{course?.title || "this course"}</strong>) with an affordable Annual Smart Learning Plan.
          </p>
        </div>

        {/* 3 Smart Plan Cards Grid (Matching /plans style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 items-start">
          {SMART_PLANS.map((plan) => {
            const isPopular = plan.id === "standard";
            const isPremium = plan.id === "premium";
            const isSelected = selectedPlanId === plan.id;
            const isExpanded = Boolean(expandedCards[plan.id]);
            const features = plan.allFeatures || [];
            const visibleFeatures = isExpanded ? features : features.slice(0, 5);
            const remainingCount = features.length - 5;

            return (
              <div
                key={plan.id}
                onClick={() => {
                  onClose();
                  onSelectPlan(plan);
                }}
                className={`relative p-5 sm:p-6 rounded-2xl flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? isPopular
                      ? "bg-gradient-to-b from-purple-950/95 via-slate-900 to-slate-900 border-2 border-purple-400 shadow-2xl shadow-purple-950/80 ring-2 ring-purple-400/60"
                      : isPremium
                      ? "bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-900 border-2 border-amber-400 shadow-2xl shadow-amber-950/70 ring-2 ring-amber-400/50"
                      : "bg-slate-900 border-2 border-indigo-400 shadow-xl ring-2 ring-indigo-400/40"
                    : isPopular
                    ? "bg-gradient-to-b from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/50 hover:border-purple-400 shadow-xl"
                    : isPremium
                    ? "bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/50 hover:border-amber-400 shadow-xl"
                    : "bg-slate-900/90 border border-slate-700/90 hover:border-slate-600 shadow-lg"
                }`}
                style={{
                  borderTop: `4px solid ${plan.color}`,
                }}
              >
                {/* Badges */}
                {isPopular && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px] font-black text-white uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Star size={10} className="fill-white" />
                    <span>⭐ {t("plans.mostPopular", "MOST POPULAR")}</span>
                  </div>
                )}
                {isPremium && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-black text-slate-950 uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Crown size={10} />
                    <span>👑 VIP SUITE</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{plan.icon}</span>
                      <h3 className="text-base font-bold text-white">
                        {t(plan.labelKey, plan.label)}
                      </h3>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] bg-purple-500 text-white font-extrabold px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">
                        {plan.price}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        /{t(plan.periodKey, "year")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-snug">
                      {t(plan.taglineKey, plan.tagline)}
                    </p>
                  </div>

                  {/* Highlights List matching /plans */}
                  <div className="space-y-2.5 mb-5">
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

                  {/* View More / View Less Button (matching /plans) */}
                  {features.length > 5 && (
                    <button
                      type="button"
                      onClick={(e) => toggleExpandCard(plan.id, e)}
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

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onSelectPlan(plan);
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-98 ${
                    isSelected
                      ? isPopular
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg ring-2 ring-purple-300 font-black"
                        : isPremium
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg ring-2 ring-amber-300"
                        : "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 font-black"
                      : isPopular
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40"
                      : isPremium
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-amber-950/30"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
                  }`}
                >
                  <span>{isSelected ? `✓ Selected: ${plan.title}` : t(plan.buttonKey, `Choose ${plan.title}`)}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-800 text-xs text-slate-400">
          <ShieldCheck size={15} className="text-emerald-400" />
          <span>Secure 256-bit encrypted checkout · Instant plan activation</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
