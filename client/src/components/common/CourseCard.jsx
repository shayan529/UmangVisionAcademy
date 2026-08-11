import { memo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice.js";
import { hasBaseRole } from "../../utils/permissions";
import { useTranslation } from "react-i18next";
import { Star, Sparkles, CheckCircle2 } from "lucide-react";

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
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const canEnroll =
    hasBaseRole(user, "student") || hasBaseRole(user, "instructor");

  const ratingVal = course.rating
    ? Number(course.rating).toFixed(1)
    : course.ratingAverage
      ? Number(course.ratingAverage).toFixed(1)
      : "4.8";

  const reviewsCount = course.reviews ?? course.reviewCount ?? 0;
  const isEnrolled = Boolean(course.enrolled);
  const courseId = course?._id ?? course?.id;

  const handleCardClick = () => {
    if (isEnrolled) {
      navigate(`/courses/${courseId}`);
    } else {
      navigate(`/courses/${courseId}/demo`);
    }
  };

  const handleBuy = (e) => {
    e.stopPropagation();
    if (!user) {
      navigate(`/courses/${courseId ?? ""}/demo`);
      return;
    }
    if (!courseId) return;
    dispatch(addToCart(courseId));
    navigate("/cart");
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
      {/* ── 1. Thumbnail with Floating Badges (Udemy Aspect Ratio) ── */}
      <div className="relative w-full aspect-[16/10] shrink-0 bg-slate-800/80 overflow-hidden">
        {!imgError && getOptimizedImageUrl(course.image) ? (
          <img
            src={getOptimizedImageUrl(course.image)}
            alt={course.title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : null}

        {/* Shimmer Placeholder */}
        {(!imgLoaded || imgError) && (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            {imgError ? (
              <div className="w-10 h-10 text-slate-600 flex items-center justify-center font-bold text-lg">
                📚
              </div>
            ) : (
              <div className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-slate-600/25 to-transparent" />
            )}
          </div>
        )}

        {/* Floating Top-Left Badge (Udemy Style: Premium / Enrolled / Free) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
          {isEnrolled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-600/90 text-white text-[10px] sm:text-[11px] font-bold shadow-md backdrop-blur-md border border-indigo-400/30">
              <CheckCircle2 size={11} className="text-emerald-300" />
              <span>{t("exploreCourses.enrolled", "Enrolled")}</span>
            </span>
          ) : rawPriceNum > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white text-[10px] sm:text-[11px] font-extrabold shadow-md backdrop-blur-md border border-purple-400/30">
              <Sparkles size={11} className="text-yellow-300 animate-pulse" />
              <span>Premium</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600/90 text-white text-[10px] sm:text-[11px] font-extrabold shadow-md backdrop-blur-md border border-emerald-400/30">
              <span>Free</span>
            </span>
          )}
        </div>

        {/* Floating Top-Right Class / Board Badge */}
        {(course.category || course.board) && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-slate-950/80 text-slate-200 text-[10px] font-bold backdrop-blur-md border border-white/10 shadow-sm">
              {course.category || course.board}
            </span>
          </div>
        )}
      </div>

      {/* ── 2. Card Content (Udemy Layout) ── */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3
            className="text-[13.5px] sm:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors"
            title={course.title}
          >
            {course.title}
          </h3>

          {/* Instructor & View Instructor */}
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            {course.instructorId ? (
              <Link
                to={`/instructors/${course.instructorId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-slate-400 hover:text-indigo-400 hover:underline truncate max-w-[170px]"
                title={course.instructor}
              >
                {course.instructor || "Lead Instructor"}
              </Link>
            ) : (
              <span className="truncate max-w-[170px]">
                {course.instructor || "Lead Instructor"}
              </span>
            )}
            {course.board && course.category && (
              <span className="text-[10px] font-semibold text-slate-500 shrink-0 ml-1">
                {course.board}
              </span>
            )}
          </div>

          {/* Ratings & Badge Row (Udemy style) */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {/* Rating pill */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold shrink-0">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span>{ratingVal}</span>
            </div>

            {/* Ratings count */}
            <span className="text-[10.5px] text-slate-400 font-medium shrink-0">
              ({reviewsCount.toLocaleString()})
            </span>

            {/* Category / Bestseller Badge */}
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0 uppercase tracking-wider">
              {course.board || course.category || "Top Rated"}
            </span>
          </div>
        </div>

        {/* ── 3. Price & Action Footer ── */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
          <div className="flex items-baseline justify-between mb-2">
            {/* Price & Strikethrough */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-white tracking-tight">
                {course.price}
              </span>
              {originalPrice && (
                <span className="text-[11px] sm:text-xs text-slate-500 line-through font-medium">
                  ₹{originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {course.language && (
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
                {course.language}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {isEnrolled ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/courses/${courseId}`);
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer border-none"
            >
              <span>{t("courseCard.continueLearning", "Continue Learning →")}</span>
            </button>
          ) : (
            <div className="flex gap-1.5">
              {(canEnroll || !user) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/courses/${courseId}/demo`);
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800/70 hover:bg-slate-700/70 text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  {t("courseCard.viewDetails", "Details")}
                </button>
              )}

              <button
                onClick={handleBuy}
                disabled={!canEnroll && user}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold text-center transition shadow-md shadow-indigo-600/20 active:scale-98 cursor-pointer border-none ${
                  !canEnroll && user
                    ? "bg-slate-700 text-slate-400 border border-slate-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
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
    </div>
  );
};

export default memo(CourseCard);
