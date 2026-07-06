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
  // Custom-role staff (HR Manager, etc.) and base "admin" only ever get
  // View Demo — they're not meant to be purchasing or enrolling in courses.
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
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-row md:flex-col h-[150px] md:h-auto p-2.5 md:p-0 gap-3 md:gap-0">
      {/* Image */}
      <img
        src={getOptimizedImageUrl(course.image)}
        alt={course.title}
        loading="lazy"
        className="w-32 h-full md:w-full md:h-48 object-cover rounded-md md:rounded-none shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between p-1 md:p-5">
        <div>
          {/* Title */}
          <h3 className="text-sm md:text-lg font-semibold text-gray-800 line-clamp-1 md:line-clamp-2 md:min-h-[48px]">
            {course.title}
          </h3>

          {/* Instructor */}
          <div className="mt-0.5 md:mt-1 flex items-center justify-between">
            {course.instructorId ? (
              <Link
                to={`/instructors/${course.instructorId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] md:text-sm text-gray-500 hover:text-indigo-600 hover:underline truncate"
                title={course.instructor}
              >
                {course.instructor}
              </Link>
            ) : (
              <p className="text-[11px] md:text-sm text-gray-500 truncate">
                {course.instructor}
              </p>
            )}
            {course.instructorId && (
              <Link
                to={`/instructors/${course.instructorId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] md:text-[11px] text-indigo-500 hover:text-indigo-600 hover:underline shrink-0 ml-2"
              >
                {t("courseCard.viewInstructor")}
              </Link>
            )}
          </div>

          {/* Class & Board */}
          <div className="flex flex-wrap gap-1.5 md:gap-2 mt-1.5 md:mt-3">
            {course.category && (
              <span className="px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                {course.category}
              </span>
            )}

            {course.board && (
              <span className="px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                {course.board}
              </span>
            )}
          </div>
        </div>

        {/* Bottom row: Rating, Price, and CTA */}
        <div className="flex flex-col mt-2 md:mt-4">
          <div className="flex items-center justify-between">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-xs md:text-sm font-medium">
                ★ {course.rating}
              </span>
              <span className="text-gray-400 text-[10px] md:text-xs">
                ({course.reviews})
              </span>
            </div>

            {/* Price */}
            <h2 className="text-sm md:text-xl font-bold text-gray-800">
              {course.price}
            </h2>
          </div>

          <div className="mt-2">
            {course.enrolled ? (
              <Link to={`/courses/${course._id}`} className="block">
                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition text-white py-1 md:py-2 rounded-lg text-xs md:text-sm font-medium text-center">
                  {t("courseCard.continueLearning")}
                </button>
              </Link>
            ) : canEnroll || !user ? (
              <div className="flex gap-2">
                <Link to={`/courses/${course._id}/demo`} className="flex-1">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition py-1 md:py-2 rounded-lg text-xs md:text-sm font-medium text-center"
                  >
                    {t("courseCard.viewDemo")}
                  </button>
                </Link>

                <button
                  onClick={handleBuy}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 transition text-white py-1 md:py-2 rounded-lg text-xs md:text-sm font-medium text-center"
                >
                  {course.price > 0 ? t("courseCard.buyNow") : t("courseCard.enrollNow")}
                </button>
              </div>
            ) : (
              <div>
                <Link to={`/courses/${course._id}/demo`} className="block">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition py-1 md:py-2 rounded-lg text-xs md:text-sm font-medium text-center"
                  >
                    {t("courseCard.viewDemo")}
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
