import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchPublishedCourses, fetchEnrolledCourses } from "../../redux/slices/courseSlice";
import CourseCard from "./CourseCard";
import { FaStar } from "react-icons/fa";
import api from "../../config/api";
import { toast } from "react-hot-toast";
import { hasBaseRole } from "../../utils/permissions";

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

// ── Star Rating Modal ─────────────────────────────────────────────────────────
const RatingModal = ({ course, onClose, onSubmit }) => {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  const handleSubmit = async () => {
    if (!selected) return toast.error("Please select a rating");
    setSubmitting(true);
    try {
      await onSubmit(course._id, selected, comment);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">Rate this Course</h3>
            <p className="text-slate-400 text-sm mt-0.5 line-clamp-1">
              {course.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-xl leading-none ml-4"
          >
            ×
          </button>
        </div>

        {/* Stars */}
        <div className="flex flex-col items-center gap-2 my-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setSelected(star)}
                className="transition-transform hover:scale-110"
              >
                <FaStar
                  className={`text-3xl transition-colors ${
                    star <= (hovered || selected)
                      ? "text-amber-400"
                      : "text-slate-600"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-medium text-amber-400 h-5">
            {labels[hovered || selected] || ""}
          </span>
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience (optional)…"
          rows={3}
          className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm placeholder-slate-600 outline-none focus:border-indigo-500 resize-none transition-colors"
        />

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting…" : "Submit Rating"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ALL = "All";
const ALL_SUBJECTS = "All Subjects";
const ALL_BOARDS = "All Boards";

const Courses = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  // Only base "student" or "instructor" accounts can enroll / add to cart.
  // Custom-role staff (e.g. HR Manager) and base "admin" can only ever View
  // Demo — this mirrors the gate inside CourseCard so the card's own buttons
  // and the card-click navigation here stay consistent with each other.
  const canEnroll =
    hasBaseRole(user, "student") || hasBaseRole(user, "instructor");

  // ── Redux state ──────────────────────────────────────────────────────────
  const {
    courses: allCourses = [],
    enrolled: enrolledCourses = [],
    loading,
    error,
  } = useSelector((s) => s.courses);

  // Build a Set of enrolled course IDs for O(1) lookup
  const enrolledIdSet = useMemo(
    () => new Set(enrolledCourses.map((c) => c._id?.toString())),
    [enrolledCourses]
  );

  const [selectedClass, setSelectedClass] = useState(ALL);
  const [selectedSubject, setSelectedSubject] = useState(ALL_SUBJECTS);
  const [selectedBoard, setSelectedBoard] = useState(ALL_BOARDS);
  const [ratingCourse, setRatingCourse] = useState(null); // course being rated
  const [submittedRatings, setSubmittedRatings] = useState({}); // { courseId: rating }

  useEffect(() => {
    dispatch(fetchPublishedCourses());
    if (user) dispatch(fetchEnrolledCourses());
  }, [dispatch, user]);

  // ── Derived filter options ─────────────────────────────────────────────────
  const dynamicClasses = useMemo(
    () => [...new Set(allCourses.map((c) => c.category).filter(Boolean))],
    [allCourses],
  );

  const sortedClasses = [...dynamicClasses].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""));
    const numB = parseInt(b.replace(/\D/g, ""));
    return numA - numB;
  });

  const dynamicSubjects = useMemo(
    () => [
      ...new Set(
        allCourses
          .map((c) => c.title?.split(" - ")[0] ?? c.title)
          .filter(Boolean),
      ),
    ],
    [allCourses],
  );

  const dynamicBoards = useMemo(
    () => [...new Set(allCourses.map((c) => c.board).filter(Boolean))],
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

  const isEnrolled = (course) => {
    if (!user) return false;
    if (!canEnroll) return false;

    // Primary check: use the enrolled courses list from Redux (authoritative)
    if (enrolledIdSet.has(course._id?.toString())) return true;

    // Secondary check: subscription-based access
    const hasActiveSubscription = user.subscription?.status === "active";
    const matchesClass = user.selectedClass && course.category &&
      user.selectedClass.toLowerCase().trim() === course.category.toLowerCase().trim();

    return !!(hasActiveSubscription && matchesClass);
  };

  // A course is "completed" when the student's progress hits 100%.
  // We check the completedBy array on the course model (add this field if not present),
  // falling back to a progressMap if your course model tracks it differently.
  const isCompleted = (course) => {
    if (!user) return false;
    // Option A: course has a completedBy array of user IDs
    if (Array.isArray(course.completedBy)) {
      return course.completedBy.some((id) => (id._id ?? id) === user._id);
    }
    // Option B: course has a progressMap { userId: percentage }
    if (course.progressMap) {
      return (course.progressMap[user._id] ?? 0) >= 100;
    }
    return false;
  };

  const hasRated = (course) => {
    if (!user) return false;
    // Check submitted in this session (survives until refresh)
    if (submittedRatings[course._id]) return true;
    // Check the ratings array from the DB (field is `ratings`, not `reviews`)
    if (Array.isArray(course.ratings)) {
      return course.ratings.some(
        (r) => (r.user?._id ?? r.user)?.toString() === user._id?.toString()
      );
    }
    return false;
  };

  // ── Submit rating ─────────────────────────────────────────────────────────
  const handleRatingSubmit = async (courseId, rating, comment) => {
    try {
      await api.post(`/courses/${courseId}/rate`, { rating, comment });
      setSubmittedRatings((prev) => ({ ...prev, [courseId]: rating }));
      toast.success("Thanks for your rating!");
      dispatch(fetchPublishedCourses()); // refresh to update ratingAverage
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit rating");
      throw err; // let modal handle submitting state
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleCourseClick = (course) => {
    // Non-logged-in users go straight to the demo page
    if (!user) {
      navigate(`/courses/${course._id}/demo`);
      return;
    }
    // Custom-role staff / admins always go to the demo page, regardless of
    // enrollment status — they're not meant to land on the full course view.
    if (!canEnroll) {
      navigate(`/courses/${course._id}/demo`);
      return;
    }
    if (isEnrolled(course)) {
      navigate(`/courses/${course._id}`);
    } else {
      navigate(`/courses/${course._id}/demo`);
    }
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
              {t("courses.headerTag")}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              {t("courses.title")}
            </h2>
            {!loading && allCourses.length > 0 && (
              <p className="text-slate-400 text-sm mt-2">
                {t("courses.availableCourses", {
                  count: filteredCourses.length,
                })}
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
              {t("courses.retry")}
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div>
            <label className="block text-white font-semibold mb-3">
              {t("courses.select_class")}
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
            >
              <option key={ALL} value={ALL}>
                {t("courses.all")}
              </option>
              {sortedClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-3">
              {t("courses.select_subject")}
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
            >
              <option key={ALL_SUBJECTS} value={ALL_SUBJECTS}>
                {t("courses.allSubjects")}
              </option>
              {dynamicSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-3">
              {t("courses.select_board")}
            </label>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            >
              <option key={ALL_BOARDS} value={ALL_BOARDS}>
                {t("courses.allBoards")}
              </option>
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
            {filteredCourses.map((course) => {
              const completed = isCompleted(course);
              const enrolled = isEnrolled(course);
              const rated = hasRated(course);
              const sessionRating = submittedRatings[course._id];
              // Find user's own rating from DB (for display after refresh)
              const ownRating = sessionRating ??
                course.ratings?.find(
                  (r) => (r.user?._id ?? r.user)?.toString() === user?._id?.toString()
                )?.rating ?? Math.round(course.ratingAverage ?? 0);

              return (
                <div key={course._id} className="flex flex-col gap-2">
                  {/* Course card */}
                  <div
                    onClick={() => handleCourseClick(course)}
                    className="cursor-pointer"
                  >
                    <CourseCard
                      course={{
                        _id: course._id,
                        title: course.title,
                        instructor: instructorName(course.instructor),
                        rating: course.ratingAverage ?? 0,
                        reviews: course.reviewCount ?? 0,
                        price:
                          course.price > 0
                            ? `₹${course.price}`
                            : t("courses.free"),
                        image: course.thumbnailUrl ?? null,
                        board: course.board ?? null,
                        category: course.category ?? null,
                        students:
                          course.students?.length ?? course.enrolledCount ?? 0,
                        enrolled,
                      }}
                    />
                  </div>

                  {/* Rating row — visible for all enrolled courses */}
                  {enrolled && (
                    <div className="flex items-center px-1">
                      {rated ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <FaStar
                              key={s}
                              className={
                                s <= ownRating
                                  ? "text-amber-400"
                                  : "text-slate-600"
                              }
                            />
                          ))}
                          <span className="text-slate-400 ml-1">Rated</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRatingCourse(course);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 hover:border-amber-500/40 transition-all"
                        >
                          <FaStar className="text-[11px]" />
                          Rate Course
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-3xl font-bold text-white">
              {t("courses.no_courses")}
            </h3>
            <p className="text-slate-400 mt-4">
              {allCourses.length === 0
                ? t("courses.noPublished")
                : t("courses.tryDifferent")}
            </p>
            {(selectedClass !== ALL ||
              selectedSubject !== ALL_SUBJECTS ||
              selectedBoard !== ALL_BOARDS) && (
              <button
                onClick={() => {
                  setSelectedClass(ALL);
                  setSelectedSubject(ALL_SUBJECTS);
                  setSelectedBoard(ALL_BOARDS);
                }}
                className="mt-6 px-6 py-2 rounded-xl border border-indigo-500/30 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/10 transition"
              >
                {t("courses.clearFilters")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rating modal */}
      {ratingCourse && (
        <RatingModal
          course={ratingCourse}
          onClose={() => setRatingCourse(null)}
          onSubmit={handleRatingSubmit}
        />
      )}
    </section>
  );
};

export default Courses;
