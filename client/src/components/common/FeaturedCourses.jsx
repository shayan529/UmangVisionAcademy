import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPublishedCourses } from "../../redux/slices/courseSlice";
import CourseCard from "./CourseCard";

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#111827] animate-pulse">
    <div className="h-44 bg-slate-700/50" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-slate-700/50 rounded w-3/4" />
      <div className="h-3 bg-slate-700/40 rounded w-1/2" />
      <div className="h-3 bg-slate-700/40 rounded w-1/3" />
    </div>
  </div>
);

const Courses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  // ── Redux state ──────────────────────────────────────────────────────────
  const {
    courses: allCourses = [],
    loading,
    error,
  } = useSelector((s) => s.courses);

  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedBoard, setSelectedBoard] = useState("All Boards");

  useEffect(() => {
    dispatch(fetchPublishedCourses());
  }, [dispatch]);

  // ── Derived filter options — recomputed only when courses change ──────────
  const dynamicClasses = useMemo(
    () => [
      "All",
      ...new Set(allCourses.map((c) => c.category).filter(Boolean)),
    ],
    [allCourses],
  );

  const dynamicSubjects = useMemo(
    () => [
      "All Subjects",
      ...new Set(
        allCourses
          .map((c) => c.title?.split(" - ")[0] ?? c.title)
          .filter(Boolean),
      ),
    ],
    [allCourses],
  );

  const dynamicBoards = useMemo(
    () => [
      "All Boards",
      ...new Set(allCourses.map((c) => c.board).filter(Boolean)),
    ],
    [allCourses],
  );

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredCourses = useMemo(
    () =>
      allCourses.filter((course) => {
        const classMatch =
          selectedClass === "All" || course.category === selectedClass;
        const subjectMatch =
          selectedSubject === "All Subjects" ||
          course.title?.toLowerCase().includes(selectedSubject.toLowerCase()) ||
          course.summary?.toLowerCase().includes(selectedSubject.toLowerCase());
        const boardMatch =
          selectedBoard === "All Boards" || course.board === selectedBoard;
        return classMatch && subjectMatch && boardMatch;
      }),
    [allCourses, selectedClass, selectedSubject, selectedBoard],
  );

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleCourseClick = (courseId) => {
    if (!user) {
      navigate("/login", { state: { from: "/courses" } });
      return;
    }
    navigate(`/courses/${courseId}/demo`);
  };

  const instructorName = (instructor) =>
    instructor?.name ??
    instructor?.email?.split("@")[0] ??
    (typeof instructor === "string" ? instructor : "Instructor");

  return (
    <section className="px-6 md:px-10 py-20 bg-[#0B1120]">
      <style>{`
        select option { background: #111827; color: #f1f5f9; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <p className="text-indigo-400 font-medium mb-2">
              Explore Learning By Class
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Courses
            </h2>
            {!loading && allCourses.length > 0 && (
              <p className="text-slate-400 text-sm mt-2">
                {filteredCourses.length} course
                {filteredCourses.length !== 1 ? "s" : ""} available
              </p>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && !loading && (
          <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            <span>⚠️ {error}</span>
            <button
              onClick={() => dispatch(fetchPublishedCourses())}
              className="font-bold hover:text-red-200 transition"
            >
              Retry →
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div>
            <label className="block text-white font-semibold mb-3">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
            >
              {dynamicClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-3">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
            >
              {dynamicSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-3">
              Select Board
            </label>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            >
              {dynamicBoards.map((board) => (
                <option key={board} value={board}>
                  {board}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredCourses.map((course) => (
              <div
                key={course._id}
                onClick={() => handleCourseClick(course._id)}
                className="cursor-pointer"
              >
                <CourseCard
                  course={{
                    title: course.title,
                    instructor: instructorName(course.instructor),
                    rating: course.ratingAverage ?? 0,
                    reviews: course.reviewCount ?? 0,
                    price: course.price > 0 ? `₹${course.price}` : "Free",
                    image: course.thumbnailUrl ?? null,
                    board: course.board ?? null,
                    category: course.category ?? null,
                    students:
                      course.students?.length ?? course.enrolledCount ?? 0,
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-3xl font-bold text-white">No Courses Found</h3>
            <p className="text-slate-400 mt-4">
              {allCourses.length === 0
                ? "No published courses yet. Check back soon!"
                : "Try selecting a different class, subject, or board."}
            </p>
            {(selectedClass !== "All" ||
              selectedSubject !== "All Subjects" ||
              selectedBoard !== "All Boards") && (
              <button
                onClick={() => {
                  setSelectedClass("All");
                  setSelectedSubject("All Subjects");
                  setSelectedBoard("All Boards");
                }}
                className="mt-6 px-6 py-2 rounded-xl border border-indigo-500/30 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/10 transition"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Courses;
