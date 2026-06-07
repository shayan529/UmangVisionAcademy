import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-xl hover:-translate-y-2 transition duration-300">
      {/* Image */}

      <img
        src={course.image}
        alt={course.title}
        className="h-52 w-full object-cover"
      />

      {/* Content */}

      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 line-clamp-2">
          {course.title}
        </h3>

        <p className="text-slate-500 mt-3">{course.instructor}</p>

        {/* Rating */}

        <div className="flex items-center gap-2 mt-4">
          <span className="text-amber-500 font-semibold">
            ★ {course.rating}
          </span>

          <span className="text-slate-400 text-sm">({course.reviews})</span>
        </div>

        {/* Price */}

        <div className="flex items-center justify-between mt-6">
          <h2 className="text-2xl font-bold text-slate-900">{course.price}</h2>

          {course.enrolled ? (
            <Link to={`/courses/${course._id}`}>
              <button className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 transition text-white px-4 py-2 text-sm rounded-xl cursor-pointer font-bold">
                Continue →
              </button>
            </Link>
          ) : (
            <>
              <Link to={`/courses/${course._id}/demo`} className="flex-1">
                <button className="w-full bg-cyan-800 hover:bg-cyan-600 transition text-white px-4 py-2 text-sm rounded-xl cursor-pointer">
                  View Demo
                </button>
              </Link>
              <Link to={'/cart'} className="flex-1">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 transition text-white px-4 py-2 rounded-xl cursor-pointer">
                  Enroll
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
