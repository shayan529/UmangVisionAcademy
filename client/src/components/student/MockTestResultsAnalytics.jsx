// pages/student/MockTests/MockTestResultsAnalytics.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaChartBar,
  FaClock,
  FaListAlt,
  FaLightbulb,
  FaArrowLeft,
  FaTrophy,
} from "react-icons/fa";
import {
  fetchAttemptResult,
  fetchMyResults,
  fetchAnalytics,
} from "../../redux/slices/mockTestSlice";

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ["Review", "My History", "Analytics"];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreCard({ result }) {
  const pct = result.percentage;
  const passed = result.passed;
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div
      className={`bg-[#0b1628] border rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 ${passed ? "border-emerald-600/30" : "border-rose-600/30"}`}
    >
      {/* Circular gauge */}
      <div className="relative w-32 h-32 shrink-0">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#1a2e48"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={passed ? "#10b981" : "#f43f5e"}
            strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-2xl font-black ${passed ? "text-emerald-400" : "text-rose-400"}`}
          >
            {pct}%
          </span>
          <span className="text-xs text-slate-500">score</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 text-center w-full">
        <Stat label="Score" value={`${result.score}/${result.totalMarks}`} />
        <Stat label="Passing" value={`${result.passingMarks} marks`} />
        <Stat label="Time Taken" value={formatTime(result.timeTaken)} />
        <Stat
          label="Status"
          value={passed ? "Passed ✓" : "Failed ✗"}
          color={passed ? "text-emerald-400" : "text-rose-400"}
        />
        <Stat label="Subject" value={result.subject} />
        <Stat label="Class" value={result.class} />
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

function QuestionReview({ questions }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="flex flex-col gap-3">
      {questions.map((q, i) => (
        <div
          key={i}
          className={`bg-[#0b1628] border rounded-xl overflow-hidden transition-all ${q.isCorrect ? "border-emerald-700/30" : "border-rose-700/30"}`}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            {q.isCorrect ? (
              <FaCheckCircle className="text-emerald-400 shrink-0" />
            ) : (
              <FaTimesCircle className="text-rose-400 shrink-0" />
            )}
            <span className="text-slate-200 text-sm flex-1 line-clamp-1">
              Q{i + 1}. {q.questionText}
            </span>
            <span
              className={`text-xs font-bold shrink-0 ${q.isCorrect ? "text-emerald-400" : "text-rose-400"}`}
            >
              +{q.marksEarned}/{q.marks}
            </span>
          </button>

          {open === i && (
            <div className="px-4 pb-4 space-y-2">
              {q.options.map((opt, idx) => {
                const isCorrect = idx === q.correctOption;
                const isSelected = idx === q.studentSelectedOption;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      isCorrect
                        ? "bg-emerald-600/10 text-emerald-300 border border-emerald-600/30"
                        : isSelected && !isCorrect
                          ? "bg-rose-600/10 text-rose-300 border border-rose-600/30"
                          : "text-slate-500"
                    }`}
                  >
                    <span className="font-bold text-xs w-5 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                    {isCorrect && (
                      <span className="ml-auto text-xs text-emerald-400">
                        ✓ Correct
                      </span>
                    )}
                    {isSelected && !isCorrect && (
                      <span className="ml-auto text-xs text-rose-400">
                        ✗ Your answer
                      </span>
                    )}
                  </div>
                );
              })}
              {q.explanation && (
                <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 mt-2">
                  <FaLightbulb className="text-amber-400 mt-0.5 shrink-0 text-xs" />
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ myResults, onView }) {
  return (
    <div className="flex flex-col gap-3">
      {myResults.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-12">
          No test history yet.
        </p>
      ) : (
        myResults.map((attempt) => (
          <div
            key={attempt._id}
            className="bg-[#0b1628] border border-[#1a2e48] rounded-xl px-4 py-3 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-sm font-medium truncate">
                {attempt.mockTest?.title || "Test"}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                {attempt.mockTest?.subject} ·{" "}
                {new Date(
                  attempt.submittedAt || attempt.updatedAt,
                ).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`text-sm font-bold ${attempt.passed ? "text-emerald-400" : "text-rose-400"}`}
              >
                {attempt.percentage}%
              </span>
              <button
                onClick={() => onView(attempt._id)}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Review →
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

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
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Tests Taken" value={analytics.totalTests} />
        <Stat label="Avg Score" value={`${analytics.avgPercentage}%`} />
        <Stat
          label="Tests Passed"
          value={analytics.passCount}
          color="text-emerald-400"
        />
        <Stat
          label="Pass Rate"
          value={`${analytics.passRate}%`}
          color={
            analytics.passRate >= 60 ? "text-emerald-400" : "text-amber-400"
          }
        />
      </div>

      {/* Subject breakdown */}
      <div className="bg-[#0b1628] border border-[#1a2e48] rounded-2xl p-5">
        <h3 className="text-slate-300 font-semibold text-sm mb-4">
          Subject Performance
        </h3>
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
                    s.avgPercentage >= 70
                      ? "bg-emerald-500"
                      : s.avgPercentage >= 40
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                  style={{ width: `${s.avgPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent trend */}
      <div className="bg-[#0b1628] border border-[#1a2e48] rounded-2xl p-5">
        <h3 className="text-slate-300 font-semibold text-sm mb-4">
          Recent Performance
        </h3>
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
            <div
              key={i}
              className="flex-1 text-center text-xs text-slate-600 truncate"
              title={a.testTitle}
            >
              {new Date(a.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MockTestResultsAnalytics() {
  const { attemptId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentResult, myResults, analytics, loading } = useSelector(
    (s) => s.mockTest,
  );
  const [activeTab, setActiveTab] = useState(
    attemptId ? "Review" : "My History",
  );

  useEffect(() => {
    if (attemptId) {
      dispatch(fetchAttemptResult(attemptId))
        .unwrap()
        .catch(() => {
          toast.error("Could not load result");
        });
    }
    dispatch(fetchMyResults());
    dispatch(fetchAnalytics());
  }, [attemptId, dispatch]);

  const handleViewAttempt = (id) => {
    navigate(`/student-dashboard/mock-tests/result/${id}`);
    setActiveTab("Review");
  };

  return (
    <div className="min-h-screen bg-[#060d1a] p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/student-dashboard/mock-tests")}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <FaArrowLeft />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            Results & Analytics
          </h1>
          {currentResult && attemptId && (
            <p className="text-slate-400 text-sm">{currentResult.testTitle}</p>
          )}
        </div>

        {currentResult && (
          <button
            onClick={() =>
              navigate(
                `/student-dashboard/mock-tests/leaderboard/${currentResult.mockTestId || ""}`,
              )
            }
            className="ml-auto flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <FaTrophy className="text-xs" /> Leaderboard
          </button>
        )}
      </div>

      {/* Score card */}
      {currentResult && activeTab === "Review" && (
        <div className="mb-5">
          <ScoreCard result={currentResult} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0b1628] border border-[#1a2e48] rounded-xl p-1 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab
                ? "bg-violet-700 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-14 bg-[#0b1628] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {activeTab === "Review" && currentResult?.questions && (
            <QuestionReview questions={currentResult.questions} />
          )}
          {activeTab === "Review" && !currentResult?.questions && (
            <p className="text-slate-500 text-sm text-center py-12">
              Select a test from My History to review.
            </p>
          )}
          {activeTab === "My History" && (
            <HistoryTab myResults={myResults} onView={handleViewAttempt} />
          )}
          {activeTab === "Analytics" && <AnalyticsTab analytics={analytics} />}
        </>
      )}
    </div>
  );
}
