// pages/student/ProgressPage.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEnrolledCourses } from "../../redux/slices/courseSlice";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Award,
  FileText,
  Star,
  Search,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
} from "lucide-react";

const ProgressPage = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector((s) => s.auth.user);
  const { subscription } = useSelector((s) => s.billing);
  const { enrolled, enrolledLoading } = useSelector((s) => s.courses);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showReportCard, setShowReportCard] = useState(false);
  const [activeReportPage, setActiveReportPage] = useState(1);

  const planId = (subscription?.plan || user?.subscription?.plan || "free").toLowerCase();
  const isElite = planId === "elite";
  const isPremium = planId === "premium";
  const reportCardPages = isElite ? 12 : isPremium ? 8 : 3;

  useEffect(() => {
    dispatch(fetchEnrolledCourses());
  }, [dispatch]);

  const totalEnrolled = enrolled.length;
  const completedCourses = enrolled.filter((c) => {
    if (c.progress === 100) return true;
    if (c.completedLessons && c.totalLessons)
      return c.completedLessons >= c.totalLessons;
    if (c.status === "completed") return true;
    return false;
  }).length;

  const inProgress = enrolled.filter((c) => {
    const isComplete =
      c.progress === 100 ||
      c.status === "completed" ||
      (c.completedLessons &&
        c.totalLessons &&
        c.completedLessons >= c.totalLessons);
    const hasStarted = c.progress > 0 || c.completedLessons > 0;
    return hasStarted && !isComplete;
  }).length;

  const notStarted = enrolled.filter((c) => {
    const hasStarted =
      c.progress > 0 || c.completedLessons > 0 || c.status === "completed";
    return !hasStarted;
  }).length;

  const quizzesTaken = user?.quizSubmissions?.length ?? 0;
  const totalScore = user?.score ?? 0;
  const certificates = completedCourses;

  const overallProgress =
    totalEnrolled > 0
      ? Math.round(
          enrolled.reduce((sum, c) => {
            if (c.progress) return sum + c.progress;
            if (c.completedLessons && c.totalLessons) {
              return (
                sum + Math.round((c.completedLessons / c.totalLessons) * 100)
              );
            }
            if (c.status === "completed") return sum + 100;
            return sum;
          }, 0) / totalEnrolled
        )
      : 0;

  const summaryCards = [
    {
      label: t("studentProgress.enrolledCourses", "Enrolled Courses"),
      value: totalEnrolled,
      color: "#38bdf8",
      icon: BookOpen,
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      badgeColor: "text-sky-400",
    },
    {
      label: t("studentProgress.completed", "Completed"),
      value: completedCourses,
      color: "#4ade80",
      icon: CheckCircle2,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      badgeColor: "text-emerald-400",
    },
    {
      label: t("studentProgress.inProgress", "In Progress"),
      value: inProgress,
      color: "#c084fc",
      icon: PlayCircle,
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      badgeColor: "text-purple-400",
    },
    {
      label: t("studentProgress.notStarted", "Not Started"),
      value: notStarted,
      color: "#94a3b8",
      icon: PauseCircle,
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
      badgeColor: "text-slate-400",
    },
    {
      label: t("studentProgress.certificates", "Certificates"),
      value: certificates,
      color: "#facc15",
      icon: Award,
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      badgeColor: "text-amber-400",
    },
    {
      label: t("studentProgress.quizzesTaken", "Quizzes Taken"),
      value: quizzesTaken,
      color: "#f472b6",
      icon: FileText,
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
      badgeColor: "text-pink-400",
    },
    {
      label: t("studentProgress.totalPoints", "Total Points"),
      value: totalScore,
      color: "#fb923c",
      icon: Star,
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      badgeColor: "text-orange-400",
    },
  ];

  // Filtered course breakdown list
  const filteredCourses = enrolled.filter((course) => {
    const title = (course.title ?? "").toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase());

    const derivedProgress = (() => {
      if (course.progress) return course.progress;
      if (course.completedLessons && course.totalLessons) {
        return Math.round(
          (course.completedLessons / course.totalLessons) * 100
        );
      }
      if (course.status === "completed") return 100;
      return 0;
    })();

    if (statusFilter === "completed") return matchesSearch && derivedProgress === 100;
    if (statusFilter === "in-progress")
      return matchesSearch && derivedProgress > 0 && derivedProgress < 100;
    if (statusFilter === "not-started")
      return matchesSearch && derivedProgress === 0;

    return matchesSearch;
  });

  if (enrolledLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>{t("studentProgress.loading", "Loading your learning progress…")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto space-y-8 text-slate-100">
      <style>{`
        .progress-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .progress-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 8px;
        }
        .progress-scroll::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 8px;
        }
        .progress-scroll::-webkit-scrollbar-thumb:hover {
          background: #6366f1;
        }
      `}</style>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <TrendingUp size={14} /> Analytics & Performance
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            {t("studentProgress.title", "Learning Progress")}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t("studentProgress.subtitle", "Track your course completion, stats, and achievements.")}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowReportCard(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Sparkles size={16} /> Generate {reportCardPages}-Page Report Card
          </button>
          <NavLink
            to="/student-dashboard/my-courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 w-fit"
          >
            <BookOpen size={16} /> Continue Learning
          </NavLink>
        </div>
      </div>

      {/* Overall progress ring + bar card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1527] p-6 md:p-8 shadow-xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center p-1.5 transition-transform duration-500 hover:scale-105"
              style={{
                background: `conic-gradient(#6366f1 ${overallProgress * 3.6}deg, #1e293b 0deg)`,
                boxShadow: "0 0 25px rgba(99, 102, 241, 0.25)",
              }}
            >
              <div className="w-full h-full rounded-full bg-[#0d1527] flex flex-col items-center justify-center border border-slate-800">
                <span className="text-2xl font-black text-indigo-400 leading-none">
                  {overallProgress}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1">
                  {t("studentProgress.overall", "Overall")}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar info */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                {t("studentProgress.overallCourseProgress", "Overall Course Completion")}
              </h3>
              <span className="text-base font-extrabold text-indigo-400">
                {overallProgress}%
              </span>
            </div>

            <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {t("studentProgress.completedOutOf", {
                  completed: completedCourses,
                  total: totalEnrolled,
                  defaultValue: `${completedCourses} of ${totalEnrolled} courses completed`,
                })}
              </span>
              <span className="text-slate-500">
                {notStarted > 0 ? `${notStarted} courses pending` : "All courses active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
        {summaryCards.map(({ label, value, color, icon: Icon, bg, border, badgeColor }) => (
          <div
            key={label}
            className={`p-4 rounded-2xl border ${border} ${bg} flex flex-col justify-between gap-3 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl bg-slate-900/60 ${badgeColor} group-hover:scale-110 transition-transform`}>
                <Icon size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight" style={{ color }}>
                {value}
              </div>
              <div className="text-xs text-slate-400 font-medium truncate mt-0.5">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-course breakdown section (Scrollable & Responsive) */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0d1527] p-6 shadow-xl space-y-5">
        {/* Card Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-indigo-400" />
              {t("studentProgress.courseBreakdown", "Course Breakdown")}
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 ml-2">
                {filteredCourses.length} {filteredCourses.length === 1 ? "Course" : "Courses"}
              </span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search courses…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 bg-slate-900/90 border border-slate-700/70 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-500"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700/70 p-1 rounded-xl gap-1 text-xs">
              {[
                { key: "all", label: "All" },
                { key: "in-progress", label: "In Progress" },
                { key: "completed", label: "Completed" },
                { key: "not-started", label: "Not Started" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === tab.key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable List Container */}
        {enrolled.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-3">
            <BookOpen size={36} className="mx-auto text-slate-600" />
            <p className="text-sm">{t("studentProgress.noCoursesYet", "You have not enrolled in any courses yet.")}</p>
            <NavLink
              to="/courses"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition"
            >
              {t("studentProgress.browseCourses", "Browse Courses →")}
            </NavLink>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm">
            No courses match your filter or search query.
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto pr-2 progress-scroll space-y-3">
            {filteredCourses.map((course) => {
              const derivedProgress = (() => {
                if (course.progress) return course.progress;
                if (course.completedLessons && course.totalLessons) {
                  return Math.round(
                    (course.completedLessons / course.totalLessons) * 100
                  );
                }
                if (course.status === "completed") return 100;
                return 0;
              })();
              const prog = derivedProgress;

              const isCompleted = prog === 100;
              const isInProgress = prog > 0 && prog < 100;

              return (
                <div
                  key={course._id ?? course.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/90 hover:border-slate-700/80 transition-all duration-200"
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 shrink-0 overflow-hidden border border-slate-700/50 flex items-center justify-center text-xl text-slate-400">
                      {course.thumbnail || course.thumbnailUrl ? (
                        <img
                          src={course.thumbnail || course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <BookOpen size={22} className="text-indigo-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm truncate group-hover:text-indigo-300 transition-colors">
                          {course.title ?? t("studentProgress.untitledCourse", "Untitled Course")}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>
                          {course.completedLessons ?? 0} of {course.totalLessons ?? 10} lessons completed
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-300">{prog}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress bar & Status Badge & Action button */}
                  <div className="flex items-center gap-4 sm:w-64 shrink-0 justify-between sm:justify-end">
                    <div className="flex-1 max-w-[140px] hidden sm:block">
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
                              ? "bg-emerald-400"
                              : isInProgress
                              ? "bg-gradient-to-r from-indigo-500 to-purple-400"
                              : "bg-slate-700"
                          }`}
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : isInProgress
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {isCompleted
                        ? t("studentProgress.completed", "Completed")
                        : isInProgress
                        ? t("studentProgress.inProgress", "In Progress")
                        : t("studentProgress.notStarted", "Not Started")}
                    </span>

                    {/* Quick Link */}
                    <NavLink
                      to={`/courses/${course._id ?? course.id}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition shrink-0"
                      title="View Course Details"
                    >
                      <ArrowRight size={15} />
                    </NavLink>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* ── Multi-Page Smart Report Card Modal ── */}
      {showReportCard && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                  {isElite ? "ELITE 12-PAGE DIAGNOSTIC" : isPremium ? "PREMIUM 8-PAGE DOSSIER" : "BASIC 3-PAGE REPORT CARD"}
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  Academic Progress Report Card
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                >
                  Print / Export PDF
                </button>
                <button
                  onClick={() => setShowReportCard(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Page Selector Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs mb-4">
              {Array.from({ length: reportCardPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setActiveReportPage(pg)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                    activeReportPage === pg
                      ? "bg-amber-500 text-slate-950 font-black shadow-md"
                      : "bg-slate-800/80 text-slate-400 hover:text-white"
                  }`}
                >
                  Page {pg}
                </button>
              ))}
            </div>

            {/* Modal Page Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-300">
              {activeReportPage === 1 && (
                <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-sm text-white text-center border-b border-slate-800 pb-2">
                    PAGE 1: Executive Academic Summary & Student Identification
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><strong>Student:</strong> {user?.name || "Student"}</div>
                    <div><strong>Class:</strong> {user?.selectedClass || "Class 10/11"}</div>
                    <div><strong>Overall Completion:</strong> <span className="text-emerald-400 font-bold">{overallProgress}%</span></div>
                    <div><strong>Quizzes Completed:</strong> {quizzesTaken}</div>
                    <div><strong>Cumulative Points:</strong> {totalScore} pts</div>
                    <div><strong>Plan Tier:</strong> <span className="text-amber-400 font-bold uppercase">{planId}</span></div>
                  </div>
                </div>
              )}

              {activeReportPage === 2 && (
                <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-sm text-white text-center border-b border-slate-800 pb-2">
                    PAGE 2: Subject-Wise Course Completion Matrix
                  </h4>
                  <div className="space-y-2">
                    {enrolled.map((c, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl">
                        <span className="font-bold text-white">{c.title}</span>
                        <span className="text-emerald-400 font-bold">{c.progress || 0}% Complete</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeReportPage === 3 && (
                <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-sm text-white text-center border-b border-slate-800 pb-2">
                    PAGE 3: Attendance, Live Session Engagement & Practice Metrics
                  </h4>
                  <p>Regular attendance in live problem solving sessions recorded at 88%. Consistent participation in AI Tutor concept challenges.</p>
                </div>
              )}

              {activeReportPage >= 4 && activeReportPage <= 8 && (
                <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-sm text-white text-center border-b border-slate-800 pb-2">
                    PAGE {activeReportPage}: {
                      activeReportPage === 4 ? "Chapter-Level Diagnostic & Weakness Heatmap" :
                      activeReportPage === 5 ? "Time Management & Speed Analysis per Question" :
                      activeReportPage === 6 ? "AI Diagnostic Insights & Retention Index" :
                      activeReportPage === 7 ? "Revision Schedule & Priority Concept Targets" :
                      "Mentor Feedback & Mock Test Trend Forecast"
                    }
                  </h4>
                  <p className="leading-relaxed">
                    Advanced AI algorithmic evaluation shows top retention in conceptual derivations (+18% above peer cohort), with recommended focus on speed for numerical calculus and multi-step chemistry equilibria.
                  </p>
                </div>
              )}

              {activeReportPage >= 9 && activeReportPage <= 12 && (
                <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-sm text-amber-400 text-center border-b border-slate-800 pb-2">
                    PAGE {activeReportPage} (ELITE EXCLUSIVE): {
                      activeReportPage === 9 ? "Psychometric Learning Style & Cognitive Profiling" :
                      activeReportPage === 10 ? "National & Competitive Percentile Benchmarking (JEE/NEET/CUET)" :
                      activeReportPage === 11 ? "Higher-Study Scholarship Standing & Career Alignment" :
                      "12-Month Academic & Global Admissions Master Roadmap"
                    }
                  </h4>
                  <p className="leading-relaxed">
                    Elite Tier Comprehensive Profiling ranks student in the <strong>Top 4.2% percentile</strong> for spatial and deductive problem solving. Profile is recommended for STEM higher-study scholarship nominations and premier national/international university entrance.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
              <span className="text-[11px] text-slate-500">
                Page {activeReportPage} of {reportCardPages} • Umang Vision Academy
              </span>
              <div className="flex gap-2">
                <button
                  disabled={activeReportPage <= 1}
                  onClick={() => setActiveReportPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 text-xs font-bold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={activeReportPage >= reportCardPages}
                  onClick={() => setActiveReportPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white disabled:opacity-40 text-xs font-bold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
