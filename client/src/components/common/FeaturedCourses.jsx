import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchPublishedCourses,
  fetchEnrolledCourses,
} from "../../redux/slices/courseSlice";
import CourseCard from "./CourseCard";
import { hasBaseRole } from "../../utils/permissions";

const SkeletonCard = () => (
  <div className="bg-[#1e293b] border border-slate-600/70 rounded-2xl overflow-hidden flex flex-col h-full">
    {/* Image area — exact same height as real card */}
    <div className="relative w-full h-44 sm:h-48 shrink-0 bg-slate-700/60 overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
    </div>
    {/* Content area */}
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 animate-pulse">
      <div className="space-y-2">
        {/* Title lines */}
        <div className="h-4 bg-slate-700/70 rounded-md w-full" />
        <div className="h-4 bg-slate-700/70 rounded-md w-5/6" />
        {/* Instructor */}
        <div className="h-3 bg-slate-700/50 rounded-md w-2/5 mt-1" />
        {/* Tags */}
        <div className="flex gap-1.5 mt-2">
          <div className="h-5 w-16 bg-slate-700/50 rounded-md" />
          <div className="h-5 w-12 bg-slate-700/50 rounded-md" />
        </div>
      </div>
      {/* Bottom row: rating + price */}
      <div className="mt-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-14 bg-slate-700/50 rounded-md" />
          <div className="h-5 w-16 bg-slate-700/60 rounded-md" />
        </div>
        {/* Button */}
        <div className="h-9 bg-slate-700/60 rounded-lg w-full" />
      </div>
    </div>
  </div>
);

const ALL = "All";
const ALL_SUBJECTS = "All Subjects";
const ALL_BOARDS = "All Boards";

const CLASSES = ["Class 9", "Class 10", "Class 11", "Class 12"];
const TYPE_ALL = "All";
const TYPE_CLASSES = "Classes";
const TYPE_COMPETITIVE = "Competitive Exam";
const ALL_EXAMS = "All Exams";
const isClassCategory = (category) => CLASSES.includes(category);
const isCompetitiveCourse = (course) =>
  Boolean(course.category) && !isClassCategory(course.category);

const ALL_LANGUAGES = "Multilanguage";
const LANGUAGE_OPTIONS = ["English", "Hindi"];

const Courses = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

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

  useEffect(() => {
    dispatch(fetchPublishedCourses());
    if (user?._id) dispatch(fetchEnrolledCourses());
  }, [dispatch, user?._id]);

  const handleCourseTypeChange = (type) => {
    setSelectedCourseType(type);
    setSelectedClass(ALL);
    setSelectedExam(ALL_EXAMS);
    setSelectedBoard(ALL_BOARDS);
  };

  // ── Derived filter options — recomputed only when courses change ──────────
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
      if (course.tags?.length) {
        course.tags.forEach((tag) => {
          if (tag) subjects.add(tag.trim());
        });
      }
      if (course.category) {
        subjects.add(course.category.trim());
      }
      if (course.title) {
        subjects.add(course.title.trim());
      }
    });
    return Array.from(subjects).sort();
  }, [allCourses]);

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

        const courseSubjects = [
          ...(course.tags ?? []).filter(Boolean),
          course.category,
          course.title,
        ]
          .filter(Boolean)
          .map((value) => value.trim().toLowerCase());

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

        return (
          typeMatch && classMatch && subjectMatch && boardMatch && languageMatch
        );
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

  const featuredList = useMemo(() => {
    const selected = [];
    const classesSeen = new Set();

    // First, try to find one course for each class (Class 9, 10, 11, 12)
    for (const cls of CLASSES) {
      const courseForClass = filteredCourses.find((c) => c.category === cls);
      if (courseForClass) {
        selected.push(courseForClass);
        classesSeen.add(cls);
      }
    }

    // If we have fewer than 4 courses, fill the rest with any remaining courses from filteredCourses (avoiding duplicates)
    if (selected.length < 4) {
      const selectedIds = new Set(selected.map((c) => c._id?.toString()));
      for (const course of filteredCourses) {
        if (selected.length >= 4) break;
        if (!selectedIds.has(course._id?.toString())) {
          selected.push(course);
          selectedIds.add(course._id?.toString());
        }
      }
    }

    return selected.slice(0, 4);
  }, [filteredCourses]);
  const isEnrolled = (course) => {
    if (!user) return false;

    // Primary check: use the enrolled courses list from Redux (authoritative)
    if (enrolledIdSet.has(course._id?.toString())) return true;

    // Secondary check: subscription-based access
    const hasActiveSubscription = user.subscription?.status === "active";
    const matchesClass =
      user.selectedClass &&
      course.category &&
      user.selectedClass.toLowerCase().trim() ===
        course.category.toLowerCase().trim();

    return !!(hasActiveSubscription && matchesClass);
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleCourseClick = (course) => {
    // Non-logged-in users go straight to the demo page
    if (!user) {
      navigate(`/courses/${course._id}/demo`);
      return;
    }

    // Custom-role staff / admins are not allowed to view demos or full course pages.
    const canEnroll =
      hasBaseRole(user, "student") || hasBaseRole(user, "instructor");
    if (!canEnroll) {
      return;
    }

    if (isEnrolled(course)) {
      navigate(`/courses/${course._id}`); // → CoursePage
    } else {
      navigate(`/courses/${course._id}/demo`); // → Demo page
    }
  };

  const instructorName = (instructor) =>
    instructor?.name ??
    instructor?.email?.split("@")[0] ??
    (typeof instructor === "string" ? instructor : "Instructor");

  return (
    <section className="px-3.5 sm:px-6 md:px-10 py-8 md:py-12 bg-[#0B1120]">
      <div className="max-w-7xl mx-auto">
        {/* Header + Course Type Toggle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              {t("courses.headerTag")}
            </p>
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {t("courses.title")}
              </h2>
              {!loading && allCourses.length > 0 && (
                <span className="text-[11px] sm:text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800/80 px-2.5 py-0.5 rounded-full">
                  {t("courses.availableCourses", {
                    count: featuredList.length,
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
              className="font-bold hover:text-red-200 transition cursor-pointer"
            >
              {t("courses.retry")}
            </button>
          </div>
        )}

        {/* Top-level course type filters */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-slate-800 bg-[#0f172a]/80 max-w-full overflow-x-auto no-scrollbar">
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
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCourseType === opt.key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/50 border border-slate-800/80">
          {selectedCourseType === TYPE_COMPETITIVE ? (
            <div className="min-w-0">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300/90 mb-1 truncate">
                {t("courses.select_exam", "Select Exam")}
              </label>
              <div className="relative min-w-0">
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full bg-[#090e1a] border border-slate-700/70 hover:border-indigo-500/50 text-white rounded-xl pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-2 text-xs appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer truncate"
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300/90 mb-1 truncate">
                {t("courses.select_class")}
              </label>
              <div className="relative min-w-0">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-[#090e1a] border border-slate-700/70 hover:border-indigo-500/50 text-white rounded-xl pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-2 text-xs appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer truncate"
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
            <label className="block text-[10px] font-bold uppercase tracking-wider text-cyan-300/90 mb-1 truncate">
              {t("courses.select_subject")}
            </label>
            <div className="relative min-w-0">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-[#090e1a] border border-slate-700/70 hover:border-cyan-500/50 text-white rounded-xl pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-2 text-xs appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer truncate"
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

          {selectedCourseType !== TYPE_COMPETITIVE && (
            <div className="min-w-0">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-300/90 mb-1 truncate">
                {t("courses.select_board")}
              </label>
              <div className="relative min-w-0">
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full bg-[#090e1a] border border-slate-700/70 hover:border-purple-500/50 text-white rounded-xl pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-2 text-xs appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer truncate"
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
            <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/90 mb-1 truncate">
              {t("courses.select_language", "Select Language")}
            </label>
            <div className="relative min-w-0">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-[#090e1a] border border-slate-700/70 hover:border-emerald-500/50 text-white rounded-xl pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-2 text-xs appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer truncate"
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
          selectedSubject !== ALL_SUBJECTS ||
          selectedBoard !== ALL_BOARDS ||
          selectedLanguage !== ALL_LANGUAGES) && (
          <div className="flex flex-wrap items-center gap-2 mb-8 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
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
                  onClick={() => setSelectedClass(ALL)}
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
                  onClick={() => setSelectedExam(ALL_EXAMS)}
                  className="hover:text-white font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedSubject !== ALL_SUBJECTS && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium">
                Subject: {selectedSubject}
                <button
                  onClick={() => setSelectedSubject(ALL_SUBJECTS)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : featuredList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {featuredList.map((course, i) => (
              <div
                key={course._id}
                onClick={() => handleCourseClick(course)}
                className="cursor-pointer animate-[fadeUp_0.4s_ease_both]"
                style={{ animationDelay: `${i * 60}ms` }}
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
                      course.price > 0 ? `₹${course.price}` : t("courses.free"),
                    rawPrice: course.price,
                    image: course.thumbnailUrl ?? null,
                    board: course.board ?? null,
                    category: course.category ?? null,
                    language: course.language ?? null,
                    students:
                      course.students?.length ?? course.enrolledCount ?? 0,
                    enrolled: isEnrolled(course),
                  }}
                />
              </div>
            ))}
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
            {(selectedCourseType !== TYPE_ALL ||
              selectedClass !== ALL ||
              selectedExam !== ALL_EXAMS ||
              selectedSubject !== ALL_SUBJECTS ||
              selectedBoard !== ALL_BOARDS ||
              selectedLanguage !== ALL_LANGUAGES) && (
              <button
                onClick={() => {
                  setSelectedCourseType(TYPE_ALL);
                  setSelectedClass(ALL);
                  setSelectedExam(ALL_EXAMS);
                  setSelectedSubject(ALL_SUBJECTS);
                  setSelectedBoard(ALL_BOARDS);
                  setSelectedLanguage(ALL_LANGUAGES);
                }}
                className="mt-6 px-6 py-2 rounded-xl border border-indigo-500/30 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/10 transition"
              >
                {t("courses.clearFilters")}
              </button>
            )}
          </div>
        )}

        {filteredCourses.length > featuredList.length && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => navigate("/courses")}
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm border border-slate-200 shadow-md hover:shadow-emerald-500/20 hover:shadow-xl hover:border-emerald-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <span className="relative z-10">{t("courses.viewAll")}</span>
              <svg
                className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              <span className="absolute inset-0 bg-emerald-50 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Courses;
