import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchPublishedCourses,
  fetchEnrolledCourses,
} from "../../redux/slices/courseSlice";
import CourseCard from "./CourseCard";
import { FaStar } from "react-icons/fa";
import api from "../../config/api";
import { toast } from "react-hot-toast";
import { hasBaseRole } from "../../utils/permissions";

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-[#1e293b] border border-slate-600/70 rounded-2xl overflow-hidden flex flex-col h-full">
    {/* Image area — matches real card */}
    <div className="relative w-full h-44 sm:h-48 shrink-0 bg-slate-700/60 overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
    </div>
    {/* Content */}
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-slate-700/70 rounded-md w-full" />
        <div className="h-4 bg-slate-700/70 rounded-md w-5/6" />
        <div className="h-3 bg-slate-700/50 rounded-md w-2/5 mt-1" />
        <div className="flex gap-1.5 mt-2">
          <div className="h-5 w-16 bg-slate-700/50 rounded-md" />
          <div className="h-5 w-12 bg-slate-700/50 rounded-md" />
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-14 bg-slate-700/50 rounded-md" />
          <div className="h-5 w-16 bg-slate-700/60 rounded-md" />
        </div>
        <div className="h-9 bg-slate-700/60 rounded-lg w-full" />
      </div>
    </div>
  </div>
);

// ── Star Rating Modal ─────────────────────────────────────────────────────────
const RatingModal = ({ course, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const rawLabels = t("courses.ratingLabels", { returnObjects: true });
  const labels = Array.isArray(rawLabels)
    ? rawLabels
    : ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

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
            <h3 className="text-white font-bold text-lg">
              {t("courses.ratingModalTitle")}
            </h3>
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
const ALL_BOARDS = "All Boards";

// ── Course type (Classes vs Competitive Exam) ─────────────────────────────────
// Courses don't store an explicit "courseType" field — we infer it from
// `category`, mirroring the same logic used in InstructorCourses.jsx: if the
// category matches one of the known class names, it's a "Classes" course;
// otherwise it's treated as a Competitive Exam course (category holds the
// exam name, e.g. "NEET", "JEE Main").
const CLASSES = ["Class 9", "Class 10", "Class 11", "Class 12"];
const BOARDS = ["MP Board", "CBSE", "ICSE"];
const ALL_SUBJECTS = "All Subjects";
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
    [enrolledCourses],
  );

  const [selectedCourseType, setSelectedCourseType] = useState(TYPE_ALL);
  const [selectedClass, setSelectedClass] = useState(ALL);
  const [selectedExam, setSelectedExam] = useState(ALL_EXAMS);
  const [selectedSubject, setSelectedSubject] = useState(ALL_SUBJECTS);
  const [selectedBoard, setSelectedBoard] = useState(ALL_BOARDS);
  const [selectedLanguage, setSelectedLanguage] = useState(ALL_LANGUAGES);
  const [ratingCourse, setRatingCourse] = useState(null); // course being rated
  const [submittedRatings, setSubmittedRatings] = useState({}); // { courseId: rating }
  const [visibleCourseCount, setVisibleCourseCount] = useState(20);

  useEffect(() => {
    dispatch(fetchPublishedCourses());
    if (user?._id) dispatch(fetchEnrolledCourses());
  }, [dispatch, user?._id]);

  // When switching course type, reset the filters that no longer apply so
  // stale selections don't silently zero-out results.
  const handleCourseTypeChange = (type) => {
    setSelectedCourseType(type);
    setSelectedClass(ALL);
    setSelectedExam(ALL_EXAMS);
    setSelectedSubject(ALL_SUBJECTS);
    setSelectedBoard(ALL_BOARDS);
  };

  const handleClassChange = (cls) => {
    setSelectedClass(cls);
  };

  const handleExamChange = (exam) => {
    setSelectedExam(exam);
  };

  // ── Derived filter options ─────────────────────────────────────────────────
  const dynamicClasses = useMemo(
    () => [
      ...new Set(allCourses.map((c) => c.category).filter(isClassCategory)),
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

  const dynamicSubjects = useMemo(() => {
    const subjects = new Set();
    allCourses.forEach((course) => {
      if (course.subject) subjects.add(course.subject.trim());
      (course.lessons ?? []).forEach((l) => l.subject && subjects.add(l.subject.trim()));
      (course.notes ?? []).forEach((n) => n.subject && subjects.add(n.subject.trim()));
      (course.subjectQuizzes ?? []).forEach((q) => q.subject && subjects.add(q.subject.trim()));
      (course.subjectDetails ?? []).forEach((d) => d.subject && subjects.add(d.subject.trim()));
    });
    return Array.from(subjects).filter(Boolean).sort();
  }, [allCourses]);

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

        // Subject matching
        const isBulk =
          (course.lessons ?? []).some((l) => l.subject) ||
          (course.notes ?? []).some((n) => n.subject) ||
          (course.subjectQuizzes ?? []).length > 0 ||
          (course.subjectDetails ?? []).length > 0;

        let courseSubjects = [];
        if (course.subject) courseSubjects.push(course.subject.trim().toLowerCase());
        if (isBulk) {
          [
            ...(course.lessons ?? []).map((l) => l.subject),
            ...(course.notes ?? []).map((n) => n.subject),
            ...(course.subjectQuizzes ?? []).map((q) => q.subject),
            ...(course.subjectDetails ?? []).map((d) => d.subject),
          ]
            .filter(Boolean)
            .forEach((s) => courseSubjects.push(s.trim().toLowerCase()));
        } else if (course.title) {
          courseSubjects.push(course.title.trim().toLowerCase());
        }

        const subjectMatch =
          selectedSubject === ALL_SUBJECTS ||
          courseSubjects.includes(selectedSubject.trim().toLowerCase()) ||
          course.title?.toLowerCase().includes(selectedSubject.toLowerCase()) ||
          course.description?.toLowerCase().includes(selectedSubject.toLowerCase());

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
    if (
      user.enrolledCourses?.some(
        (id) => (id._id || id).toString() === courseIdStr,
      )
    )
      return true;

    // Fallback check 2: check course object's students array
    if (
      Array.isArray(course.students) &&
      course.students.some((id) => (id._id || id).toString() === userIdStr)
    )
      return true;

    // Secondary check: subscription-based access
    const hasActiveSubscription = user.subscription?.status === "active";
    const matchesClass =
      user.selectedClass &&
      course.category &&
      user.selectedClass.toLowerCase().trim() ===
        course.category.toLowerCase().trim();

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
        (r) => (r.user?._id ?? r.user)?.toString() === user._id?.toString(),
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
    selectedBoard !== ALL_BOARDS ||
    selectedLanguage !== ALL_LANGUAGES;

  const clearFilters = () => {
    setSelectedCourseType(TYPE_ALL);
    setSelectedClass(ALL);
    setSelectedExam(ALL_EXAMS);
    setSelectedBoard(ALL_BOARDS);
    setSelectedLanguage(ALL_LANGUAGES);
  };

  return (
    <section className="px-4 sm:px-6 md:px-10 py-8 md:py-12 bg-[#0B1120]">
      <style>{`
        select option { background: #111827; color: #f1f5f9; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header + Course Type Toggle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              {t("courses.headerTag")}
            </p>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {t("courses.title")}
              </h2>
              {!loading && allCourses.length > 0 && (
                <span className="text-xs font-semibold text-slate-300 bg-slate-900/90 border border-slate-700/60 px-3 py-1 rounded-full shadow-inner">
                  {t("courses.availableCourses", {
                    count: filteredCourses.length,
                    defaultValue: `${filteredCourses.length} ${filteredCourses.length === 1 ? "course" : "courses"} available`,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && !loading && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            <span>⚠️ {error}</span>
            <button
              onClick={() => dispatch(fetchPublishedCourses())}
              className="font-bold hover:text-red-200 transition"
            >
              {t("courses.retry")}
            </button>
          </div>
        )}

        {/* Top-level course type filters */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur-md max-w-full overflow-x-auto no-scrollbar shadow-lg">
            {[
              { key: TYPE_ALL, label: t("courses.courseTypeAll", "All") },
              {
                key: TYPE_CLASSES,
                label: t("courses.courseTypeClasses", "Classes"),
              },
              {
                key: TYPE_COMPETITIVE,
                label: t("courses.courseTypeCompetitive", "Competitive Exam"),
              },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleCourseTypeChange(opt.key)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCourseType === opt.key
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-inner">
          {selectedCourseType === TYPE_COMPETITIVE ? (
            <div className="min-w-0">
              <label className="block text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-indigo-300/90 mb-1 sm:mb-1.5 truncate">
                {t("courses.select_exam", "Select Exam")}
              </label>
              <div className="relative min-w-0">
                <select
                  value={selectedExam}
                  onChange={(e) => handleExamChange(e.target.value)}
                  className="w-full min-h-[36px] sm:min-h-[38px] bg-[#090e1a] border border-slate-700/70 hover:border-indigo-500/50 text-white rounded-xl pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-[13px] leading-normal appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer truncate"
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
                <div className="pointer-events-none absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="w-3.5 h-3.5 fill-current opacity-70"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <label className="block text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-indigo-300/90 mb-1 sm:mb-1.5 truncate">
                {t("courses.select_class")}
              </label>
              <div className="relative min-w-0">
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full min-h-[36px] sm:min-h-[38px] bg-[#090e1a] border border-slate-700/70 hover:border-indigo-500/50 text-white rounded-xl pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-[13px] leading-normal appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer truncate"
                >
                  <option key={ALL} value={ALL}>
                    {t("courses.all", "All")}
                  </option>
                  {CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="w-3.5 h-3.5 fill-current opacity-70"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {selectedCourseType !== TYPE_COMPETITIVE && (
            <div className="min-w-0">
              <label className="block text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-pink-300/90 mb-1 sm:mb-1.5 truncate">
                {t("courses.select_subject", "Select Subject")}
              </label>
              <div className="relative min-w-0">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full min-h-[36px] sm:min-h-[38px] bg-[#090e1a] border border-slate-700/70 hover:border-pink-500/50 text-white rounded-xl pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-[13px] leading-normal appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer truncate"
                >
                  <option key={ALL_SUBJECTS} value={ALL_SUBJECTS}>
                    {t("courses.allSubjects", "All Subjects")}
                  </option>
                  {dynamicSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="w-3.5 h-3.5 fill-current opacity-70"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {selectedCourseType !== TYPE_COMPETITIVE && (
            <div className="min-w-0">
              <label className="block text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-purple-300/90 mb-1 sm:mb-1.5 truncate">
                {t("courses.select_board")}
              </label>
              <div className="relative min-w-0">
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full min-h-[36px] sm:min-h-[38px] bg-[#090e1a] border border-slate-700/70 hover:border-purple-500/50 text-white rounded-xl pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-[13px] leading-normal appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer truncate"
                >
                  <option key={ALL_BOARDS} value={ALL_BOARDS}>
                    {t("courses.allBoards", "All Boards")}
                  </option>
                  {BOARDS.map((board) => (
                    <option key={board} value={board}>
                      {board}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="w-3.5 h-3.5 fill-current opacity-70"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          <div className="min-w-0">
            <label className="block text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-emerald-300/90 mb-1 sm:mb-1.5 truncate">
              {t("courses.select_language", "Select Language")}
            </label>
            <div className="relative min-w-0">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full min-h-[36px] sm:min-h-[38px] bg-[#090e1a] border border-slate-700/70 hover:border-emerald-500/50 text-white rounded-xl pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-[13px] leading-normal appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer truncate"
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
              <div className="pointer-events-none absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg
                  className="w-3.5 h-3.5 fill-current opacity-70"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {(selectedCourseType !== TYPE_ALL ||
          selectedClass !== ALL ||
          selectedExam !== ALL_EXAMS ||
          selectedBoard !== ALL_BOARDS ||
          selectedLanguage !== ALL_LANGUAGES) && (
          <div className="flex flex-wrap items-center gap-2 mb-8 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Active:</span>
            {selectedCourseType !== TYPE_ALL && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium">
                {selectedCourseType}
                <button
                  onClick={() => handleCourseTypeChange(TYPE_ALL)}
                  className="hover:text-white font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedClass !== ALL && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium">
                Class: {selectedClass}
                <button
                  onClick={() => handleClassChange(ALL)}
                  className="hover:text-white font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedExam !== ALL_EXAMS && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium">
                Exam: {selectedExam}
                <button
                  onClick={() => handleExamChange(ALL_EXAMS)}
                  className="hover:text-white font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedBoard !== ALL_BOARDS && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium">
                Board: {selectedBoard}
                <button
                  onClick={() => setSelectedBoard(ALL_BOARDS)}
                  className="hover:text-white font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedLanguage !== ALL_LANGUAGES && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium">
                Lang: {selectedLanguage}
                <button
                  onClick={() => setSelectedLanguage(ALL_LANGUAGES)}
                  className="hover:text-white font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline ml-auto text-xs cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredCourses.slice(0, visibleCourseCount).map((course, i) => {
                const completed = isCompleted(course);
                const enrolled = isEnrolled(course);
                const rated = hasRated(course);
                const sessionRating = submittedRatings[course._id];
                // Find user's own rating from DB (for display after refresh)
                const ownRating =
                  sessionRating ??
                  course.ratings?.find(
                    (r) =>
                      (r.user?._id ?? r.user)?.toString() ===
                      user?._id?.toString(),
                  )?.rating ??
                  Math.round(course.ratingAverage ?? 0);

                return (
                  <div
                    key={course._id}
                    className="flex flex-col gap-2 animate-[fadeUp_0.4s_ease_both] h-full"
                    style={{ animationDelay: `${Math.min(i, 7) * 50}ms` }}
                  >
                    {/* Course card */}
                    <div
                      onClick={() => handleCourseClick(course)}
                      className="cursor-pointer flex-1 flex flex-col h-full"
                    >
                      <CourseCard
                        course={{
                          _id: course._id,
                          title: course.title,
                          instructor: instructorName(course.instructor),
                          instructorId:
                            typeof course.instructor === "object"
                              ? course.instructor?._id
                              : null,
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
                            course.students?.length ??
                            course.enrolledCount ??
                            0,
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
                            <span className="text-slate-400 ml-1">
                              {t("courses.rated")}
                            </span>
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
            {filteredCourses.length > visibleCourseCount && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() =>
                    setVisibleCourseCount((prev) =>
                      Math.min(prev + 20, filteredCourses.length),
                    )
                  }
                  className="px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
                >
                  {t("courses.loadMore", "Load more courses")}
                </button>
              </div>
            )}
          </>
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
