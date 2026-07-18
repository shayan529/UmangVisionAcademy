// components/student/AvailableMockTests.jsx
// Unified mock-tests page: Available Tests · Review · My History · Analytics
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaClipboardList, FaClock, FaStar, FaChevronRight,
  FaCheckCircle, FaFilter, FaChartBar,
  FaCheckCircle as FaCheck, FaTimesCircle, FaLightbulb,
} from "react-icons/fa";
import {
  fetchAvailableTests,
  startMockTest,
  fetchAttemptResult,
  fetchMyResults,
  fetchAnalytics,
  clearCurrentResult,
} from "../../redux/slices/mockTestSlice";
import { checkAndAwardAchievements } from "../../redux/slices/achievementSlice";
import { useTranslation } from "react-i18next";

// ── Constants ─────────────────────────────────────────────────────────────────
const DIFFICULTIES = [
  { value: "All",    key: "studentMockTests.difficultyAll" },
  { value: "Easy",   key: "studentMockTests.difficultyEasy" },
  { value: "Medium", key: "studentMockTests.difficultyMedium" },
  { value: "Hard",   key: "studentMockTests.difficultyHard" },
];
const difficultyColor = {
  Easy:   "text-emerald-400 bg-emerald-400/10",
  Medium: "text-amber-400 bg-amber-400/10",
  Hard:   "text-rose-400 bg-rose-400/10",
};
const TABS = ["Available Tests", "Review", "My History", "Analytics"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── Score card ────────────────────────────────────────────────────────────────
function ScoreCard({ result }) {
  const pct    = result.percentage;
  const passed = result.passed;
  const radius = 52;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className={`bg-[#0b1628] border rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 ${passed ? "border-emerald-600/30" : "border-rose-600/30"}`}>
      <div className="relative w-32 h-32 shrink-0">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1a2e48" strokeWidth="10" />
          <circle cx="60" cy="60" r={radius} fill="none"
            stroke={passed ? "#10b981" : "#f43f5e"} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-black ${passed ? "text-emerald-400" : "text-rose-400"}`}>{pct}%</span>
          <span className="text-xs text-slate-500">score</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 text-center w-full">
        <Stat label="Score"    value={`${result.score}/${result.totalMarks}`} />
        <Stat label="Passing"  value={`${result.passingMarks} marks`} />
        <Stat label="Time"     value={formatTime(result.timeTaken)} />
        <Stat label="Status"   value={passed ? "Passed ✓" : "Failed ✗"}
              color={passed ? "text-emerald-400" : "text-rose-400"} />
        <Stat label="Subject"  value={result.subject} />
        <Stat label="Class"    value={result.class} />
      </div>
    </div>
  );
}

function Stat({ label, value, color = "text-slate-200" }) {
  return (
    <div className="bg-[#0d1f35] rounded-xl px-3 py-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`font-bold text-sm ${color}`}>{value}</p>
    </div>
  );
}

// ── Question review ───────────────────────────────────────────────────────────
function QuestionReview({ questions }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="flex flex-col gap-3">
      {questions.map((q, i) => (
        <div key={i}
          className={`bg-[#0b1628] border rounded-xl overflow-hidden ${q.isCorrect ? "border-emerald-700/30" : "border-rose-700/30"}`}>
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left">
            {q.isCorrect
              ? <FaCheck    className="text-emerald-400 shrink-0" />
              : <FaTimesCircle className="text-rose-400 shrink-0" />}
            <span className="text-slate-200 text-sm flex-1 line-clamp-1">
              Q{i + 1}. {q.questionText}
            </span>
            <span className={`text-xs font-bold shrink-0 ${q.isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
              +{q.marksEarned}/{q.marks}
            </span>
          </button>

          {open === i && (
            <div className="px-4 pb-4 space-y-2">
              {q.options.map((opt, idx) => {
                const isCorrect  = idx === q.correctOption;
                const isSelected = idx === q.studentSelectedOption;
                return (
                  <div key={idx}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      isCorrect
                        ? "bg-emerald-600/10 text-emerald-300 border border-emerald-600/30"
                        : isSelected && !isCorrect
                          ? "bg-rose-600/10 text-rose-300 border border-rose-600/30"
                          : "text-slate-500"
                    }`}>
                    <span className="font-bold text-xs w-5 shrink-0">{String.fromCharCode(65 + idx)}</span>
                    {opt}
                    {isCorrect  && <span className="ml-auto text-xs text-emerald-400">✓ Correct</span>}
                    {isSelected && !isCorrect && <span className="ml-auto text-xs text-rose-400">✗ Your answer</span>}
                  </div>
                );
              })}
              {q.explanation && (
                <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 mt-2">
                  <FaLightbulb className="text-amber-400 mt-0.5 shrink-0 text-xs" />
                  <p className="text-slate-400 text-xs leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── History tab ───────────────────────────────────────────────────────────────
function HistoryTab({ myResults, onView }) {
  if (myResults.length === 0) {
    return (
      <div className="text-center py-16">
        <FaClipboardList className="text-4xl text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500">No test history yet.</p>
        <p className="text-slate-600 text-sm mt-1">Complete a test to see your results here.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {myResults.map((attempt) => (
        <div key={attempt._id}
          className="bg-[#0b1628] border border-[#1a2e48] rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-sm font-medium truncate">
              {attempt.mockTest?.title || "Test"}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              {attempt.mockTest?.subject} ·{" "}
              {new Date(attempt.submittedAt || attempt.updatedAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-sm font-bold ${attempt.passed ? "text-emerald-400" : "text-rose-400"}`}>
              {attempt.percentage}%
            </span>
            <button onClick={() => onView(attempt._id)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Review →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Analytics tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ analytics }) {
  if (!analytics) {
    return (
      <div className="text-center py-16">
        <FaChartBar className="text-4xl text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500">Complete a test to see your analytics.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Tests Taken"  value={analytics.totalTests} />
        <Stat label="Avg Score"    value={`${analytics.avgPercentage}%`} />
        <Stat label="Tests Passed" value={analytics.passCount}    color="text-emerald-400" />
        <Stat label="Pass Rate"    value={`${analytics.passRate}%`}
              color={analytics.passRate >= 60 ? "text-emerald-400" : "text-amber-400"} />
      </div>

      <div className="bg-[#0b1628] border border-[#1a2e48] rounded-2xl p-5">
        <h3 className="text-slate-300 font-semibold text-sm mb-4">Subject Performance</h3>
        <div className="space-y-3">
          {analytics.subjectBreakdown.map((s) => (
            <div key={s.subject}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">{s.subject}</span>
                <span className="text-slate-400">{s.avgPercentage}%</span>
              </div>
              <div className="h-2 bg-[#1a2e48] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    s.avgPercentage >= 70 ? "bg-emerald-500"
                      : s.avgPercentage >= 40 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${s.avgPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0b1628] border border-[#1a2e48] rounded-2xl p-5">
        <h3 className="text-slate-300 font-semibold text-sm mb-4">Recent Performance</h3>
        <div className="flex items-end gap-2 h-24">
          {analytics.recentAttempts.map((a, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-slate-500">{a.percentage}%</span>
              <div
                className="w-full rounded-t-md bg-violet-600/70 hover:bg-violet-500 transition-all"
                style={{ height: `${a.percentage}%`, minHeight: "4px" }}
                title={a.testTitle}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          {analytics.recentAttempts.map((a, i) => (
            <div key={i} className="flex-1 text-center text-xs text-slate-600 truncate" title={a.testTitle}>
              {new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AvailableMockTests() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { attemptId } = useParams();          // set when navigating to /result/:attemptId
  const { t } = useTranslation();

  const { availableTests = [], currentResult, myResults = [], analytics, loading } =
    useSelector((s) => s.mockTest);

  // Tab — default to Review if we arrived with an attemptId
  const [activeTab, setActiveTab] = useState(attemptId ? "Review" : "Available Tests");
  const [diffFilter,    setDiffFilter]    = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [starting,      setStarting]      = useState(null);
  const pollRef = useRef(null); // kept for cleanup safety

  const uniqueSubjects = [
    "All",
    ...[...new Set((availableTests).map((t) => t.subject).filter(Boolean))].sort(),
  ];

  // ── Fetch available tests once ────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchAvailableTests({}));
    dispatch(fetchMyResults());
    dispatch(fetchAnalytics());
  }, [dispatch]);

  // ── When arriving via /result/:attemptId, fetch result once (grading is instant) ──
  useEffect(() => {
    if (!attemptId) return;
    setActiveTab("Review");
    dispatch(clearCurrentResult());

    dispatch(fetchAttemptResult(attemptId))
      .unwrap()
      .then((result) => {
        // Refresh history and analytics now that a new result exists
        dispatch(fetchMyResults());
        dispatch(fetchAnalytics());
        if (result?.percentage === 100) {
          dispatch(checkAndAwardAchievements?.({
            leaderboardFirst: true, perfectQuiz: true, fullMarks: true,
          }));
        }
      })
      .catch(() => {
        toast.error("Could not load result");
      });

    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [attemptId, dispatch]);

  // ── Available tests actions ───────────────────────────────────────────────
  const handleStart = async (testId) => {
    setStarting(testId);
    try {
      await dispatch(startMockTest(testId)).unwrap();
      navigate(`/student-dashboard/mock-tests/take/${testId}`);
    } catch (err) {
      toast.error(typeof err === "string" ? err : t("studentMockTests.failedStart"));
    } finally {
      setStarting(null);
    }
  };

  const handleViewAttempt = (id) => {
    navigate(`/student-dashboard/mock-tests/result/${id}`);
  };

  const filtered = availableTests.filter((t) => {
    if (diffFilter    !== "All" && t.difficulty !== diffFilter)    return false;
    if (subjectFilter !== "All" && t.subject    !== subjectFilter) return false;
    return true;
  });

  const isGrading = loading && !currentResult;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060d1a] p-4 md:p-8">

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#0b1628] border border-[#1a2e48] rounded-xl p-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === tab
                ? "bg-violet-700 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Available Tests ── */}
      {activeTab === "Available Tests" && (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 bg-[#0f1c30] border border-[#1e3a5f] rounded-xl px-3 py-2">
              <FaFilter className="text-slate-500 text-xs" />
              <span className="text-slate-400 text-xs font-medium">{t("studentMockTests.difficultyLabel")}</span>
              <div className="flex gap-1">
                {DIFFICULTIES.map((d) => (
                  <button key={d.value} onClick={() => setDiffFilter(d.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      diffFilter === d.value ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                    }`}>
                    {t(d.key)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#0f1c30] border border-[#1e3a5f] rounded-xl px-3 py-2">
              <span className="text-slate-400 text-xs font-medium">{t("studentMockTests.subjectLabel")}</span>
              <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}
                className="bg-transparent text-slate-300 text-xs outline-none cursor-pointer">
                {uniqueSubjects.map((s) => (
                  <option key={s} value={s} className="bg-[#0b1120]">{s}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#0f1c30] rounded-2xl h-52 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FaClipboardList className="text-5xl text-slate-700 mb-4" />
              <p className="text-slate-400 font-medium">{t("studentMockTests.noTestsAvailable")}</p>
              <p className="text-slate-600 text-sm mt-1">{t("studentMockTests.noTestsHint")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((test) => {
                const attempted = !!test.attemptInfo;
                return (
                  <div key={test._id}
                    className="group bg-[#0b1628] border border-[#1a2e48] hover:border-violet-700/50 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-xl hover:shadow-violet-900/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${difficultyColor[test.difficulty] || "text-slate-400 bg-slate-400/10"}`}>
                            {test.difficulty}
                          </span>
                          {attempted && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg">
                              <FaCheckCircle className="text-[10px]" />
                              {t("studentMockTests.attempted")}
                            </span>
                          )}
                        </div>
                        <h3 className="text-slate-100 font-semibold text-base leading-snug line-clamp-2">{test.title}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center shrink-0">
                        <FaClipboardList className="text-violet-400" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><FaClock className="text-slate-600" />{test.duration} min</span>
                      <span className="flex items-center gap-1.5"><FaStar  className="text-slate-600" />{test.totalMarks} marks</span>
                      <span className="text-violet-400/80 font-medium">{test.subject}</span>
                      <span>{test.class}</span>
                    </div>

                    {attempted && (
                      <div className="bg-[#0d1f35] rounded-xl px-3 py-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Your score</span>
                        <span className={`text-sm font-bold ${test.attemptInfo.passed ? "text-emerald-400" : "text-rose-400"}`}>
                          {test.attemptInfo.score}/{test.totalMarks}
                          <span className="text-slate-500 font-normal ml-1">({test.attemptInfo.percentage}%)</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className="text-xs text-slate-600">
                        {t("studentMockTests.by")} {test.instructor?.name || t("studentMockTests.instructor")}
                      </span>
                      <button onClick={() => handleStart(test._id)} disabled={starting === test._id}
                        className="flex items-center gap-1.5 bg-violet-700 hover:bg-violet-600 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all">
                        {starting === test._id ? t("studentMockTests.starting")
                          : attempted ? t("studentMockTests.retake")
                          : t("studentMockTests.startTest")}
                        <FaChevronRight className="text-[10px]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Review ── */}
      {activeTab === "Review" && (
        <>
          {isGrading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Loading result…</p>
            </div>
          ) : currentResult && currentResult.score !== undefined ? (
            <>
              <div className="mb-5"><ScoreCard result={currentResult} /></div>
              <QuestionReview questions={currentResult.questions || []} />
            </>
          ) : (
            <div className="text-center py-16">
              <FaClipboardList className="text-4xl text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">Select a test from My History to review.</p>
            </div>
          )}
        </>
      )}

      {/* ── My History ── */}
      {activeTab === "My History" && (
        <HistoryTab myResults={myResults} onView={handleViewAttempt} />
      )}

      {/* ── Analytics ── */}
      {activeTab === "Analytics" && (
        <AnalyticsTab analytics={analytics} />
      )}
    </div>
  );
}
