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

  const rawLabels = t("courses.ratingLabels", { returnObjects: true });
  const labels = Array.isArray(rawLabels) ? rawLabels : ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">{t("courses.ratingModalTitle")}</h3>
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
                  className={`text-3xl transition-colors ${star <= (hovered || selected)
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
          placeholder={t("courses.ratingCommentPlaceholder")}
          rows={3}
          className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm placeholder-slate-600 outline-none focus:border-indigo-500 resize-none transition-colors"
        />

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500 transition-all"
          >
            {t("courses.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t("courses.submitting") : t("courses.submitRating")}
          </button>
        </div>
      </div>
    </div>
  );
};

const ALL = "All";
const ALL_SUBJECTS = "All Subjects";
const ALL_BOARDS = "All Boards";

// ── Course type (Classes vs Competitive Exam) ─────────────────────────────────
// Courses don't store an explicit "courseType" field — we infer it from
// `category`, mirroring the same logic used in InstructorCourses.jsx: if the
// category matches one of the known class names, it's a "Classes" course;
// otherwise it's treated as a Competitive Exam course (category holds the
// exam name, e.g. "NEET", "JEE Main").
const CLASSES = ["Class 9", "Class 10", "Class 11", "Class 12"];
const TYPE_ALL = "All";
const TYPE_CLASSES = "Classes";
const TYPE_COMPETITIVE = "Competitive Exam";
const ALL_EXAMS = "All Exams";
const isClassCategory = (category) => CLASSES.includes(category);
const isCompetitiveCourse = (course) =>
  Boolean(course.category) && !isClassCategory(course.category);

// ── Language filter ───────────────────────────────────────────────────────────
// Defaults to "Multilanguage" (no filtering applied). A course with no
// `language` field set is treated as available in every language, since it
// hasn't been tagged to one specific language.
const ALL_LANGUAGES = "Multilanguage";
const LANGUAGE_OPTIONS = ["English", "Hindi"];

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

  const [selectedCourseType, setSelectedCourseType] = useState(TYPE_ALL);
  const [selectedClass, setSelectedClass] = useState(ALL);
  const [selectedExam, setSelectedExam] = useState(ALL_EXAMS);
  const [selectedSubject, setSelectedSubject] = useState(ALL_SUBJECTS);
  const [selectedBoard, setSelectedBoard] = useState(ALL_BOARDS);
  const [selectedLanguage, setSelectedLanguage] = useState(ALL_LANGUAGES);
  const [ratingCourse, setRatingCourse] = useState(null); // course being rated
  const [submittedRatings, setSubmittedRatings] = useState({}); // { courseId: rating }

  useEffect(() => {
    dispatch(fetchPublishedCourses());
    if (user) dispatch(fetchEnrolledCourses());
  }, [dispatch, user]);

  // When switching course type, reset the filters that no longer apply so
  // stale selections don't silently zero-out results.
  const handleCourseTypeChange = (type) => {
    setSelectedCourseType(type);
    setSelectedClass(ALL);
    setSelectedExam(ALL_EXAMS);
    setSelectedBoard(ALL_BOARDS);
  };

  // ── Derived filter options ─────────────────────────────────────────────────
  const dynamicClasses = useMemo(
    () => [
      ...new Set(
        allCourses.map((c) => c.category).filter(isClassCategory),
      ),
    ],
    [allCourses],
  );

  const sortedClasses = [...dynamicClasses].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""));
    const numB = parseInt(b.replace(/\D/g, ""));
    return numA - numB;
  });

  const dynamicExams = useMemo(
    () => [
      ...new Set(
        allCourses
          .filter(isCompetitiveCourse)
          .map((c) => c.category)
          .filter(Boolean),
      ),
    ],
    [allCourses],
  );

  const dynamicSubjects = useMemo(
    () => {
      const subjects = new Set();
      allCourses.forEach((course) => {
        const isBulk = (course.lessons ?? []).some((l) => l.subject) ||
                       (course.notes ?? []).some((n) => n.subject) ||
                       (course.subjectQuizzes ?? []).length > 0 ||
                       (course.subjectDetails ?? []).length > 0;
        if (isBulk) {
          const courseSubjects = [
            ...(course.lessons ?? []).map((l) => l.subject),
            ...(course.notes ?? []).map((n) => n.subject),
            ...(course.subjectQuizzes ?? []).map((q) => q.subject),
            ...(course.subjectDetails ?? []).map((d) => d.subject),
          ];
          courseSubjects.forEach((sub) => {
            if (sub) {
              subjects.add(sub.trim());
            }
          });
        } else {
          if (course.title) {
            subjects.add(course.title.trim());
          }
        }
      });
      return Array.from(subjects).sort();
    },
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
        const typeMatch =
          selectedCourseType === TYPE_ALL
            ? true
            : selectedCourseType === TYPE_CLASSES
              ? isClassCategory(course.category)
              : isCompetitiveCourse(course);

        const classMatch =
          selectedCourseType === TYPE_COMPETITIVE
            ? selectedExam === ALL_EXAMS || course.category === selectedExam
            : selectedClass === ALL || course.category === selectedClass;

        const isBulk = (course.lessons ?? []).some((l) => l.subject) ||
                       (course.notes ?? []).some((n) => n.subject) ||
                       (course.subjectQuizzes ?? []).length > 0 ||
                       (course.subjectDetails ?? []).length > 0;

        let courseSubjects = [];
        if (isBulk) {
          courseSubjects = [
            ...(course.lessons ?? []).map((l) => l.subject),
            ...(course.notes ?? []).map((n) => n.subject),
            ...(course.subjectQuizzes ?? []).map((q) => q.subject),
            ...(course.subjectDetails ?? []).map((d) => d.subject),
          ].filter(Boolean).map(s => s.trim().toLowerCase());
        } else {
          if (course.title) {
            courseSubjects = [course.title.trim().toLowerCase()];
          }
        }

        const subjectMatch =
          selectedSubject === "All Subjects" ||
          courseSubjects.includes(selectedSubject.trim().toLowerCase()) ||
          course.title?.toLowerCase().includes(selectedSubject.toLowerCase()) ||
          course.summary?.toLowerCase().includes(selectedSubject.toLowerCase());

        // Board doesn't apply to competitive-exam courses.
        const boardMatch =
          selectedCourseType === TYPE_COMPETITIVE
            ? true
            : selectedBoard === "All Boards" || course.board === selectedBoard;

        // A course with no language tag is treated as available in every
        // language, so it still shows up under English or Hindi filters.
        const languageMatch =
          selectedLanguage === ALL_LANGUAGES ||
          !course.language ||
          course.language.toLowerCase() === selectedLanguage.toLowerCase();

        return typeMatch && classMatch && subjectMatch && boardMatch && languageMatch;
      }),
    [
      allCourses,
      selectedCourseType,
      selectedClass,
      selectedExam,
      selectedSubject,
      selectedBoard,
      selectedLanguage,
    ],
  );

  const isEnrolled = (course) => {
    if (!user) return false;
    if (!canEnroll) return false;

    const courseIdStr = course._id?.toString();
    const userIdStr = user._id?.toString();

    // Primary check: use the enrolled courses list from Redux (authoritative)
    if (enrolledIdSet.has(courseIdStr)) return true;

    // Fallback check 1: check user object's enrolledCourses array
    if (user.enrolledCourses?.some((id) => (id._id || id).toString() === courseIdStr)) return true;

    // Fallback check 2: check course object's students array
    if (Array.isArray(course.students) && course.students.some((id) => (id._id || id).toString() === userIdStr)) return true;

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
    // Custom-role staff / admins are not allowed to view demos or full course pages.
    if (!canEnroll) {
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

  const filtersActive =
    selectedCourseType !== TYPE_ALL ||
    selectedClass !== ALL ||
    selectedExam !== ALL_EXAMS ||
    selectedSubject !== ALL_SUBJECTS ||
    selectedBoard !== ALL_BOARDS ||
    selectedLanguage !== ALL_LANGUAGES;

  const clearFilters = () => {
    setSelectedCourseType(TYPE_ALL);
    setSelectedClass(ALL);
    setSelectedExam(ALL_EXAMS);
    setSelectedSubject(ALL_SUBJECTS);
    setSelectedBoard(ALL_BOARDS);
    setSelectedLanguage(ALL_LANGUAGES);
  };

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
                {`${filteredCourses.length} ${filteredCourses.length === 1 ? 'course' : 'courses'} available`}
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

        {/* Course type toggle */}
        {/* Course type toggle */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t("courses.select_course_type", "Course Type")}
          </label>
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur-md shadow-inner max-w-full overflow-x-auto no-scrollbar">
            {[
              { key: TYPE_ALL, label: t("courses.courseTypeAll", "All") },
              { key: TYPE_CLASSES, label: t("courses.courseTypeClasses", "Classes") },
              { key: TYPE_COMPETITIVE, label: t("courses.courseTypeCompetitive", "Competitive Exam") },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleCourseTypeChange(opt.key)}
                className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap shrink-0 ${
                  selectedCourseType === opt.key
                    ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 border border-cyan-400/30 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {selectedCourseType === TYPE_COMPETITIVE ? (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-300/90 mb-1.5 truncate">
                {t("courses.select_exam", "Select Exam")}
              </label>
              <div className="relative">
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full bg-[#111827]/90 border border-slate-700/80 hover:border-indigo-500/50 text-white rounded-xl pl-3 pr-8 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm appearance-none outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer truncate"
                >
                  <option key={ALL_EXAMS} value={ALL_EXAMS}>
                    {t("courses.allExams", "All Exams")}
                  </option>
                  {dynamicExams.map((exam) => (
                    <option key={exam} value={exam}>
                      {exam}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4 fill-current opacity-70" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-300/90 mb-1.5 truncate">
                {t("courses.select_class")}
              </label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-[#111827]/90 border border-slate-700/80 hover:border-indigo-500/50 text-white rounded-xl pl-3 pr-8 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm appearance-none outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer truncate"
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
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4 fill-current opacity-70" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300/90 mb-1.5 truncate">
              {t("courses.select_subject")}
            </label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-[#111827]/90 border border-slate-700/80 hover:border-cyan-500/50 text-white rounded-xl pl-3 pr-8 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm appearance-none outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer truncate"
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
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4 fill-current opacity-70" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {selectedCourseType !== TYPE_COMPETITIVE && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-300/90 mb-1.5 truncate">
                {t("courses.select_board")}
              </label>
              <div className="relative">
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full bg-[#111827]/90 border border-slate-700/80 hover:border-purple-500/50 text-white rounded-xl pl-3 pr-8 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm appearance-none outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer truncate"
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
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4 fill-current opacity-70" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300/90 mb-1.5 truncate">
              {t("courses.select_language", "Select Language")}
            </label>
            <div className="relative">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-[#111827]/90 border border-slate-700/80 hover:border-emerald-500/50 text-white rounded-xl pl-3 pr-8 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm appearance-none outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer truncate"
              >
                <option key={ALL_LANGUAGES} value={ALL_LANGUAGES}>
                  {t("courses.multilanguage", "Multilanguage")}
                </option>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang} value={lang}>
                    {t(`courses.language${lang}`, lang)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4 fill-current opacity-70" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {(selectedCourseType !== TYPE_ALL || selectedClass !== ALL || selectedExam !== ALL_EXAMS || selectedSubject !== ALL_SUBJECTS || selectedBoard !== ALL_BOARDS || selectedLanguage !== ALL_LANGUAGES) && (
          <div className="flex flex-wrap items-center gap-2 mb-8 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Active:</span>
            {selectedCourseType !== TYPE_ALL && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium">
                {selectedCourseType}
                <button onClick={() => handleCourseTypeChange(TYPE_ALL)} className="hover:text-white font-bold">✕</button>
              </span>
            )}
            {selectedClass !== ALL && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium">
                Class: {selectedClass}
                <button onClick={() => setSelectedClass(ALL)} className="hover:text-white font-bold">✕</button>
              </span>
            )}
            {selectedExam !== ALL_EXAMS && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium">
                Exam: {selectedExam}
                <button onClick={() => setSelectedExam(ALL_EXAMS)} className="hover:text-white font-bold">✕</button>
              </span>
            )}
            {selectedSubject !== ALL_SUBJECTS && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium">
                Subject: {selectedSubject}
                <button onClick={() => setSelectedSubject(ALL_SUBJECTS)} className="hover:text-white font-bold">✕</button>
              </span>
            )}
            {selectedBoard !== ALL_BOARDS && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium">
                Board: {selectedBoard}
                <button onClick={() => setSelectedBoard(ALL_BOARDS)} className="hover:text-white font-bold">✕</button>
              </span>
            )}
            {selectedLanguage !== ALL_LANGUAGES && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium">
                Lang: {selectedLanguage}
                <button onClick={() => setSelectedLanguage(ALL_LANGUAGES)} className="hover:text-white font-bold">✕</button>
              </span>
            )}
            <button
              onClick={() => {
                handleCourseTypeChange(TYPE_ALL);
                setSelectedClass(ALL);
                setSelectedExam(ALL_EXAMS);
                setSelectedSubject(ALL_SUBJECTS);
                setSelectedBoard(ALL_BOARDS);
                setSelectedLanguage(ALL_LANGUAGES);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline ml-auto text-xs"
            >
              Reset All
            </button>
          </div>
        )}

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
                        instructorId: typeof course.instructor === 'object' ? course.instructor?._id : null,
                        rating: course.ratingAverage ?? 0,
                        reviews: course.reviewCount ?? 0,
                        price:
                          course.price > 0
                            ? `₹${course.price}`
                            : t("courses.free"),
                        rawPrice: course.price,
                        image: course.thumbnailUrl ?? null,
                        board: course.board ?? null,
                        category: course.category ?? null,
                        language: course.language ?? null,
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
                          <span className="text-slate-400 ml-1">{t("courses.rated")}</span>
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
                          {t("courses.rateCourse")}
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
            {filtersActive && (
              <button
                onClick={clearFilters}
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