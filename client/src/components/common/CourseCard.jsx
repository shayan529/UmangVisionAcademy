import { memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice.js";
import { hasBaseRole } from "../../utils/permissions";
import { useTranslation } from "react-i18next";

const getOptimizedImageUrl = (url) => {
  if (!url) return "";
  if (url.includes("imagekit.io") || url.includes("imagekit")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}tr=w-480,h-320,fo-auto,q-70`;
  }
  return url;
};

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  // Only base "student" or "instructor" accounts can enroll / add to cart.
  // Custom-role staff (HR Manager, etc.) and base "admin" are not meant 
  // to be purchasing or enrolling in courses, and they don't see the View Demo button.
  const canEnroll =
    hasBaseRole(user, "student") || hasBaseRole(user, "instructor");

  const handleBuy = (e) => {
    e.stopPropagation();
    const courseId = course?._id ?? course?.id;

    if (!user) {
      // Send unauthenticated users to demo page; they can sign up from there
      navigate(`/courses/${courseId ?? ""}/demo`);
      return;
    }

    if (!courseId) return;

    dispatch(addToCart(courseId));
    navigate("/cart");
  };

  return (
    <div className="bg-[#1e293b] border border-slate-600/70 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.25)] hover:border-indigo-500/70 transition-all duration-300 flex flex-col h-full p-0">
      {/* Image */}
      <img
        src={getOptimizedImageUrl(course.image)}
        alt={course.title}
        loading="lazy"
        className="w-full h-44 sm:h-48 object-cover shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between p-4 sm:p-5 bg-[#1e293b]">
        <div>
          {/* Title */}
          <h3
            className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-3 sm:line-clamp-2 min-h-[48px]"
            title={course.title}
          >
            {course.title}
          </h3>

          {/* Instructor */}
          <div className="mt-1 md:mt-1.5 flex items-center justify-between">
            {course.instructorId ? (
              <Link
                to={`/instructors/${course.instructorId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] md:text-sm text-slate-300 hover:text-indigo-400 hover:underline truncate"
                title={course.instructor}
              >
                {course.instructor}
              </Link>
            ) : (
              <p className="text-[11px] md:text-sm text-slate-300 truncate">
                {course.instructor}
              </p>
            )}
            {course.instructorId && (
              <Link
                to={`/instructors/${course.instructorId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] md:text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline shrink-0 ml-2"
              >
                {t("courseCard.viewInstructor")}
              </Link>
            )}
          </div>

          {/* Class, board & language */}
          <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2 md:mt-3.5">
            {course.category && (
              <span className="px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-xs font-semibold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {course.category}
              </span>
            )}

            {course.board && (
              <span className="px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-xs font-semibold rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40">
                {course.board}
              </span>
            )}

            {course.language && (
              <span className="px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-xs font-semibold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {course.language}
              </span>
            )}
          </div>
        </div>

        {/* Bottom row: Rating, Price, and CTA */}
        <div className="flex flex-col mt-2 md:mt-4">
          <div className="flex items-center justify-between">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <span className="text-amber-400 text-xs md:text-sm font-bold">
                ★ {course.rating}
              </span>
              <span className="text-slate-400 text-[10px] md:text-xs">
                ({course.reviews})
              </span>
            </div>

            {/* Price */}
            <h2 className="text-sm md:text-xl font-extrabold text-white">
              {course.price}
            </h2>
          </div>

          <div className="mt-2.5">
            {course.enrolled ? (
              <Link to={`/courses/${course._id}`} className="block">
                <button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition duration-200 text-white py-1.5 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-center cursor-pointer border-none">
                  {t("courseCard.continueLearning")}
                </button>
              </Link>
            ) : (
              <div className="flex gap-2">
                {(canEnroll || !user) && (
                  <Link to={`/courses/${course._id}/demo`} className="flex-1">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="w-full border border-slate-500 hover:border-slate-300 text-slate-200 hover:text-white hover:bg-slate-600/40 transition py-1.5 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-center cursor-pointer"
                    >
                      {t("courseCard.viewDemo")}
                    </button>
                  </Link>
                )}

                <button
                  onClick={handleBuy}
                  disabled={!canEnroll && user}
                  className={`flex-1 transition py-1.5 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-center cursor-pointer border-none ${(!canEnroll && user)
                      ? "bg-slate-700 text-slate-400 border border-slate-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                    }`}
                  title={(!canEnroll && user) ? "Not available for admins or staff" : ""}
                >
                  {(!canEnroll && user)
                    ? "Locked"
                    : course.rawPrice > 0
                      ? t("courseCard.buyNow")
                      : t("courseCard.enrollNow")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(CourseCard);
