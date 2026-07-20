import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchPublishedCourses, fetchEnrolledCourses } from "../../redux/slices/courseSlice";
import CourseCard from "./CourseCard";
import { hasBaseRole } from "../../utils/permissions";

const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#111827] animate-pulse flex flex-row md:flex-col h-[150px] md:h-auto p-2.5 md:p-0 gap-3 md:gap-0">
    <div className="w-32 h-full md:w-full md:h-44 bg-slate-700/50 rounded-md md:rounded-none shrink-0" />
    <div className="flex-1 p-2 md:p-4 space-y-3 flex flex-col justify-between">
      <div>
        <div className="h-4 bg-slate-700/50 rounded w-3/4" />
        <div className="h-3 bg-slate-700/40 rounded w-1/2 mt-2" />
      </div>
      <div className="h-3 bg-slate-700/40 rounded w-1/3 mt-auto" />
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
    [enrolledCourses]
  );

  const [selectedCourseType, setSelectedCourseType] = useState(TYPE_ALL);
  const [selectedClass, setSelectedClass] = useState(ALL);
  const [selectedExam, setSelectedExam] = useState(ALL_EXAMS);
  const [selectedSubject, setSelectedSubject] = useState(ALL_SUBJECTS);
  const [selectedBoard, setSelectedBoard] = useState(ALL_BOARDS);
  const [selectedLanguage, setSelectedLanguage] = useState(ALL_LANGUAGES);

  useEffect(() => {
    dispatch(fetchPublishedCourses());
    if (user) dispatch(fetchEnrolledCourses());
  }, [dispatch, user]);

  const handleCourseTypeChange = (type) => {
    setSelectedCourseType(type);
    setSelectedClass(ALL);
    setSelectedExam(ALL_EXAMS);
    setSelectedBoard(ALL_BOARDS);
  };

  // ── Derived filter options — recomputed only when courses change ──────────
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
    const matchesClass = user.selectedClass && course.category &&
      user.selectedClass.toLowerCase().trim() === course.category.toLowerCase().trim();

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
    const canEnroll = hasBaseRole(user, "student") || hasBaseRole(user, "instructor");
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
                {`${featuredList.length} ${featuredList.length === 1 ? 'course' : 'courses'} available`}
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
        <div className="mb-8">
          <label className="block text-white font-semibold mb-3">
            {t("courses.select_course_type", "Course Type")}
          </label>
          <div className="inline-flex flex-wrap gap-2 p-1 rounded-xl border border-slate-700 bg-[#111827]">
            {[
              { key: TYPE_ALL, label: t("courses.courseTypeAll", "All") },
              { key: TYPE_CLASSES, label: t("courses.courseTypeClasses", "Classes") },
              { key: TYPE_COMPETITIVE, label: t("courses.courseTypeCompetitive", "Competitive Exam") },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleCourseTypeChange(opt.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedCourseType === opt.key
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {selectedCourseType === TYPE_COMPETITIVE ? (
            <div>
              <label className="block text-white font-semibold mb-3">
                {t("courses.select_exam", "Select Exam")}
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
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
            </div>
          ) : (
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
          )}

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

          {selectedCourseType !== TYPE_COMPETITIVE && (
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
          )}

          <div>
            <label className="block text-white font-semibold mb-3">
              {t("courses.select_language", "Select Language")}
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
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
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : featuredList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {featuredList.map((course) => (
              <div
                key={course._id}
                onClick={() => handleCourseClick(course)} // pass full course
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
