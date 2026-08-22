import { memo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice.js";
import { hasBaseRole } from "../../utils/permissions";
import { useTranslation } from "react-i18next";
import { Star, Sparkles, CheckCircle2 } from "lucide-react";
import PlanSelectionModal from "../course/PlanSelectionModal.jsx";
import { SMART_PLANS } from "../../data/plansData.js";

const getOptimizedImageUrl = (url) => {
  if (!url) return "";
  if (url.includes("imagekit.io") || url.includes("imagekit")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}tr=w-480,h-300,fo-auto,q-75`;
  }
  return url;
};

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const [imgLoaded, setImgLoaded] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);

  const canEnroll =
    hasBaseRole(user, "student") || hasBaseRole(user, "instructor");

  const rawRating = course.rating ?? course.ratingAverage ?? 0;
  const ratingVal = Number(rawRating || 0).toFixed(1);

  const reviewsCount = course.reviews ?? course.reviewCount ?? 0;
  const isEnrolled = Boolean(course.enrolled);
  const courseId = course?._id ?? course?.id;
  const courseImage = course.thumbnailUrl || course.image || "";

  const handleCardClick = () => {
    if (isEnrolled) {
      navigate(`/courses/${courseId}`);
    } else {
      navigate(`/courses/${courseId}/demo`);
    }
  };

  const handleBuy = (e) => {
    e.stopPropagation();
    setShowPlansModal(true);
  };

  const handleSelectPlan = (plan) => {
    setShowPlansModal(false);
    navigate(`/courses/${courseId}/demo`, {
      state: { selectedPlanId: plan.id },
    });
  };

  const rawPriceNum =
    typeof course.rawPrice === "number"
      ? course.rawPrice
      : parseFloat(String(course.price || "0").replace(/[^\d.]/g, ""));
  const originalPrice =
    rawPriceNum > 0 ? Math.round(rawPriceNum * 2.5) : null;

  return (
    <div
      onClick={handleCardClick}
      className="group bg-[#0f172a] hover:bg-[#131d36] border border-slate-700/60 hover:border-indigo-500/70 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full cursor-pointer select-none"
    >
      {/* ── 1. Thumbnail with Floating Badges (Compact 16:9 Aspect Ratio) ── */}
      <div className="relative w-full aspect-[16/9] shrink-0 bg-slate-800/80 overflow-hidden">
        {!imgError && getOptimizedImageUrl(courseImage) ? (
          <>
            <img
              src={getOptimizedImageUrl(courseImage)}
              alt={course.title}
              loading="eager"
              decoding="sync"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-100"
            />
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-indigo-950/40 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full border-2 border-indigo-500/20 border-t-indigo-500/60 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950/50 flex flex-col items-center justify-center p-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl shadow-inner">
              🎓
            </div>
            <span className="text-[11px] font-semibold text-slate-400 mt-1.5 line-clamp-1">
              {course.category || course.board || "Umang Vision Academy"}
            </span>
          </div>
        )}

        {/* Floating Top-Left Badge (Only show Enrolled if enrolled) */}
        {isEnrolled && (
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none max-w-[45%]">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-600/90 text-white text-[10px] sm:text-[11px] font-bold shadow-md backdrop-blur-md border border-indigo-400/30 truncate">
              <CheckCircle2 size={11} className="text-emerald-300 shrink-0" />
              <span className="truncate">{t("exploreCourses.enrolled", "Enrolled")}</span>
            </span>
          </div>
        )}

        {/* Floating Top-Right Class / Board Badge */}
        {(course.category || course.board) && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none max-w-[45%]">
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-950/85 text-slate-200 text-[10px] sm:text-[11px] font-bold backdrop-blur-md border border-white/10 shadow-sm block truncate">
              {course.category || course.board}
            </span>
          </div>
        )}
      </div>

      {/* ── 2. Card Content (Compact Layout) ── */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div className="flex flex-col">
          {/* Title - Ample height to prevent clipping */}
          <div className="min-h-[36px] sm:min-h-[40px] mb-2 flex items-start">
            <h3
              className="text-sm sm:text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors"
              title={course.title}
            >
              {course.title}
            </h3>
          </div>

          {/* Instructor & View Instructor */}
          <div className="flex items-center justify-between text-xs h-4.5 mb-1.5">
            <span
              className="text-slate-300 truncate max-w-[140px] sm:max-w-[150px] font-medium text-[11px]"
              title={course.instructor}
            >
              {course.instructor || "Lead Instructor"}
            </span>
            {course.instructorId ? (
              <Link
                to={`/instructors/${course.instructorId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[10.5px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline shrink-0 ml-1 cursor-pointer"
              >
                {t("courseCard.viewInstructor", "View Instructor")}
              </Link>
            ) : null}
          </div>

          {/* Board, Language & Rating Row */}
          <div className="flex items-center gap-1.5 mb-2 h-5.5 overflow-hidden flex-wrap">
            {/* Rating pill */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10.5px] font-bold shrink-0">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              <span>{ratingVal}</span>
            </div>

            {/* Category / Board Badge */}
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0 uppercase tracking-wider truncate max-w-[110px]">
              {course.board || course.category || "Top Rated"}
            </span>

            {course.language && (
              <span className="text-[9.5px] font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60 shrink-0">
                {course.language}
              </span>
            )}
          </div>
        </div>

        {/* ── 3. Footer (Mobile: Segmented Price Pills | Desktop: 3-Tier Plans) + Action Buttons ── */}
        <div className="mt-2 pt-2.5 border-t border-slate-800/80 flex flex-col gap-2.5">
          {!isEnrolled && (
            <div className="w-full">
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#090e1a] rounded-xl border border-slate-800/90 shadow-inner">
                {SMART_PLANS.map((plan) => {
                  const isPopular = plan.id === "standard";
                  const isPremium = plan.id === "premium";
                  return (
                    <div
                      key={plan.id}
                      onClick={handleBuy}
                      title={`${plan.label}: ${plan.price}/yr`}
                      className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-center cursor-pointer transition-all duration-200 border hover:scale-[1.02] ${
                        isPopular
                          ? "bg-purple-950/70 border-purple-500/60 text-purple-100 shadow-sm hover:border-purple-400"
                          : isPremium
                            ? "bg-amber-950/60 border-amber-500/50 text-amber-100 shadow-sm hover:border-amber-400"
                            : "bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <span className={`text-[9.5px] font-black uppercase tracking-wider leading-none ${
                        isPopular ? "text-purple-300" : isPremium ? "text-amber-300" : "text-slate-400"
                      }`}>
                        {plan.id.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-black tracking-tight leading-tight mt-1 text-white">
                        {plan.price}<span className="text-[9px] font-normal text-slate-400">/yr</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEnrolled ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/courses/${courseId}`);
              }}
              className="w-full h-9 sm:h-8 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer border-none"
            >
              <span>{t("courseCard.continueLearning", "Continue Learning →")}</span>
            </button>
          ) : (
            <div className="flex gap-2">
              {(canEnroll || !user) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/courses/${courseId}/demo`);
                  }}
                  className="flex-1 min-w-0 h-9 sm:h-8 px-2 rounded-xl border border-slate-700/80 hover:border-slate-500 bg-slate-800/70 hover:bg-slate-700/70 text-slate-200 hover:text-white text-xs font-bold transition cursor-pointer text-center truncate flex items-center justify-center"
                >
                  {t("courseCard.viewDetails", "View Details")}
                </button>
              )}

              <button
                onClick={handleBuy}
                disabled={!canEnroll && user}
                className={`flex-1 min-w-0 h-9 sm:h-8 px-2 rounded-xl text-xs font-extrabold text-center transition shadow-md active:scale-98 cursor-pointer border-none truncate flex items-center justify-center ${!canEnroll && user
                    ? "bg-slate-700 text-slate-400 border border-slate-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-indigo-600/20"
                  }`}
              >
                {!canEnroll && user
                  ? "Locked"
                  : rawPriceNum > 0
                    ? t("courseCard.buyNow", "Buy Now")
                    : t("courseCard.enrollNow", "Enroll")}
              </button>
            </div>
          )}
        </div>
      </div>

      <PlanSelectionModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        course={course}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
};

export default memo(CourseCard);
