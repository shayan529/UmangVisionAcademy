import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchPublishedCourses } from "../../redux/slices/courseSlice";
import CourseCard from "../common/CourseCard";

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

// ── Helpers ───────────────────────────────────────────────────────────────────
const instructorName = (i) =>
  i?.name ??
  i?.email?.split("@")[0] ??
  (typeof i === "string" ? i : "Instructor");

const BOARD_LABELS = {
  cbse: "CBSE",
  icse: "ICSE",
  mpboard: "MP Board",
  "mp-board": "MP Board",
  "mp board": "MP Board",
};

const boardLabel = (slug) =>
  BOARD_LABELS[slug?.toLowerCase()] ?? slug?.toUpperCase() ?? "Board";

const normaliseBoard = (b = "") => b.toLowerCase().replace(/[\s-]/g, "");

// ── Main component ────────────────────────────────────────────────────────────
const BoardCourses = () => {
  const { board } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { t } = useTranslation();

  const {
    courses: allCourses = [],
    loading,
    error,
  } = useSelector((s) => s.courses);

  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");

  // Fetch published courses once; if already in store this is a no-op
  useEffect(() => {
    dispatch(fetchPublishedCourses());
  }, [dispatch]);

  // Reset filters when board param changes
  useEffect(() => {
    setSelectedClass("All");
    setSelectedSubject("All");
  }, [board]);

  // ── Filter to this board ──────────────────────────────────────────────────
  const boardCourses = useMemo(
    () =>
      allCourses.filter(
        (c) => normaliseBoard(c.board) === normaliseBoard(board),
      ),
    [allCourses, board],
  );

  // ── Derived filter options ────────────────────────────────────────────────
  const classes = useMemo(
    () => [
      "All",
      ...new Set(boardCourses.map((c) => c.category).filter(Boolean)),
    ],
    [boardCourses],
  );

  const subjects = useMemo(
    () => [
      "All",
      ...new Set(
        boardCourses
          .map((c) => c.title?.split(" - ")[0] ?? c.title)
          .filter(Boolean),
      ),
    ],
    [boardCourses],
  );

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredCourses = useMemo(
    () =>
      boardCourses.filter((course) => {
        const classMatch =
          selectedClass === "All" || course.category === selectedClass;
        const subjectMatch =
          selectedSubject === "All" ||
          (course.title?.split(" - ")[0] ?? course.title) === selectedSubject;
        return classMatch && subjectMatch;
      }),
    [boardCourses, selectedClass, selectedSubject],
  );

  const handleCourseClick = (courseId) => {
    if (!user) {
      navigate("/login", { state: { from: `/board/${board}` } });
      return;
    }
    navigate(`/courses/${courseId}/demo`);
  };

  const clearFilters = () => {
    setSelectedClass("All");
    setSelectedSubject("All");
  };
  const filtersActive = selectedClass !== "All" || selectedSubject !== "All";
  const label = boardLabel(board);

  return (
    <section className="min-h-screen bg-[#0B1120] text-white">
      <style>{`select option { background:#111827; color:#f1f5f9; }`}</style>

      {/* ── Hero header ── */}
      <div className="border-b border-slate-800 bg-[#0d1526]">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-indigo-400 font-semibold text-sm mb-2 tracking-wide uppercase">
                {t("boardCourses.title")}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {t("boardCourses.heroTitle", { label })}
              </h1>
              <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-lg">
                {t("boardCourses.heroSubtitle", { label })}
              </p>
            </div>

            {/* Stats chips */}
            {!loading && (
              <div className="flex gap-4 flex-wrap">
                {[
                  { label: t("boardCourses.statCourses"), value: boardCourses.length },
                  { label: t("boardCourses.statClasses"), value: classes.length - 1 },
                  { label: t("boardCourses.statSubjects"), value: subjects.length - 1 },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="text-center bg-slate-800/60 border border-slate-700/50 rounded-2xl px-5 py-3 min-w-[72px]"
                  >
                    <div className="text-2xl font-black text-indigo-400">
                      {s.value}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* ── Error ── */}
        {error && !loading && (
          <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            <span>⚠️ {error}</span>
            <button
              onClick={() => dispatch(fetchPublishedCourses())}
              className="font-bold hover:text-red-200 transition"
            >
              {t("boardCourses.retry")}
            </button>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10 items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Class filter */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t("boardCourses.filterClass")}
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls === "All" ? t("boardCourses.all") : cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject filter */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t("boardCourses.filterSubject")}
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition"
              >
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj === "All" ? t("boardCourses.all") : subj}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result count + clear */}
          <div className="flex items-center gap-3 pt-6 sm:pt-0 self-end sm:self-auto">
            {!loading && (
              <span className="text-sm text-slate-500 whitespace-nowrap">
                {filteredCourses.length}{" "}
                {filteredCourses.length !== 1
                  ? t("boardCourses.results")
                  : t("boardCourses.result")}
              </span>
            )}
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-lg px-3 py-1.5 transition hover:bg-indigo-500/10 whitespace-nowrap"
              >
                {t("boardCourses.clearFilters")}
              </button>
            )}
          </div>
        </div>

        {/* ── Course grid ── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : boardCourses.length === 0 ? (
          /* No courses for this board at all */
          <div className="text-center py-24">
            <div className="text-5xl mb-5">📭</div>
            <h3 className="text-2xl font-bold text-white">
              {t("boardCourses.noCoursesYet", { label })}
            </h3>
            <p className="text-slate-400 mt-3 text-sm">
              {t("boardCourses.noCoursesDesc")}
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
            >
              {t("boardCourses.browseAll")}
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          /* Filters returned nothing */
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white">
              {t("boardCourses.noMatch")}
            </h3>
            <p className="text-slate-400 mt-2 text-sm">
              {t("boardCourses.tryDifferent")}
            </p>
            <button
              onClick={clearFilters}
              className="mt-5 px-5 py-2 rounded-xl border border-indigo-500/30 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/10 transition"
            >
              {t("boardCourses.clearFilters")}
            </button>
          </div>
        ) : (
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
                    instructorId: typeof course.instructor === 'object' ? course.instructor?._id : null,
                    rating: course.ratingAverage ?? 0,
                    reviews: course.reviewCount ?? 0,
                    price: course.price > 0 ? `₹${course.price}` : "Free",
                    image: course.thumbnailUrl ?? null,
                    board: course.board ?? null,
                    category: course.category ?? null,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BoardCourses;
