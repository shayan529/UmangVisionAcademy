import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice.js";
import { hasBaseRole } from "../../utils/permissions";

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Only base "student" or "instructor" accounts can enroll / add to cart.
  // Custom-role staff (HR Manager, etc.) and base "admin" only ever get
  // View Demo — they're not meant to be purchasing or enrolling in courses.
  const canEnroll =
    hasBaseRole(user, "student") || hasBaseRole(user, "instructor");

  const handleEnroll = () => {
    const courseId = course?._id ?? course?.id;

    if (!user) {
      navigate("/login", {
        state: { from: `/courses/${courseId ?? ""}/demo` },
      });
      return;
    }

    if (!courseId) return;

    dispatch(addToCart(courseId));
    navigate("/cart");
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      <img
        src={course.image}
        alt={course.title}
        className="h-48 w-full object-cover"
      />

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 min-h-[48px]">
          {course.title}
        </h3>

        {/* Instructor */}
        <p className="text-sm text-gray-500 mt-1">{course.instructor}</p>

        {/* Class & Board */}
        <div className="flex flex-wrap gap-2 mt-3">
          {course.category && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
              {course.category}
            </span>
          )}

          {course.board && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
              {course.board}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-4">
          <span className="text-yellow-500 text-sm font-medium">
            ★ {course.rating}
          </span>
          <span className="text-gray-400 text-xs">
            ({course.reviews} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="mt-5">
          <h2 className="text-xl font-bold text-gray-800">{course.price}</h2>

          {course.enrolled ? (
            <Link to={`/courses/${course._id}`} className="block mt-4">
              <button className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition text-white py-2 rounded-lg font-medium">
                Continue Learning →
              </button>
            </Link>
          ) : canEnroll ? (
            <div className="flex gap-3 mt-4">
              <Link to={`/courses/${course._id}/demo`} className="flex-1">
                <button className="w-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition py-2 rounded-lg font-medium">
                  View Demo
                </button>
              </Link>

              <button
                onClick={handleEnroll}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 transition text-white py-2 rounded-lg font-medium"
              >
                Enroll Now
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <Link to={`/courses/${course._id}/demo`} className="block">
                <button className="w-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition py-2 rounded-lg font-medium">
                  View Demo
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
