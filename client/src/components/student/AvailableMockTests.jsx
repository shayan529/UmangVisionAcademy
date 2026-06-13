// pages/student/MockTests/AvailableMockTests.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaClipboardList,
  FaClock,
  FaStar,
  FaChevronRight,
  FaCheckCircle,
  FaFilter,
} from "react-icons/fa";
import {
  fetchAvailableTests,
  startMockTest,
} from "../../redux/slices/mockTestSlice";

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];
const SUBJECTS = [
  "All",
  "Mathematics",
  "Science",
  "English",
  "Social Science",
  "Hindi",
];

const difficultyColor = {
  Easy: "text-emerald-400 bg-emerald-400/10",
  Medium: "text-amber-400 bg-amber-400/10",
  Hard: "text-rose-400 bg-rose-400/10",
};

export default function AvailableMockTests() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { availableTests, loading } = useSelector((s) => s.mockTest);

  const [diffFilter, setDiffFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    dispatch(fetchAvailableTests({}));
  }, [dispatch]);

  const filtered = availableTests.filter((t) => {
    if (diffFilter !== "All" && t.difficulty !== diffFilter) return false;
    if (subjectFilter !== "All" && t.subject !== subjectFilter) return false;
    return true;
  });

  const handleStart = async (testId) => {
    setStarting(testId);
    try {
      await dispatch(startMockTest(testId)).unwrap();
      navigate(`/student-dashboard/mock-tests/take/${testId}`);
    } catch (err) {
      toast.error(err || "Failed to start test");
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#060d1a] p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Available Mock Tests
        </h1>
        <p className="text-slate-400 text-sm">
          {filtered.length} test{filtered.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-[#0f1c30] border border-[#1e3a5f] rounded-xl px-3 py-2">
          <FaFilter className="text-slate-500 text-xs" />
          <span className="text-slate-400 text-xs font-medium">
            Difficulty:
          </span>
          <div className="flex gap-1">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDiffFilter(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  diffFilter === d
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#0f1c30] border border-[#1e3a5f] rounded-xl px-3 py-2">
          <span className="text-slate-400 text-xs font-medium">Subject:</span>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-transparent text-slate-300 text-xs outline-none cursor-pointer"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s} className="bg-[#0b1120]">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tests grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-[#0f1c30] rounded-2xl h-52 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FaClipboardList className="text-5xl text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">No tests available</p>
          <p className="text-slate-600 text-sm mt-1">
            Check back later or adjust your filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((test) => {
            const attempted = !!test.attemptInfo;
            return (
              <div
                key={test._id}
                className="group bg-[#0b1628] border border-[#1a2e48] hover:border-violet-700/50 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-xl hover:shadow-violet-900/10"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${difficultyColor[test.difficulty] || "text-slate-400 bg-slate-400/10"}`}
                      >
                        {test.difficulty}
                      </span>
                      {attempted && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg">
                          <FaCheckCircle className="text-[10px]" /> Attempted
                        </span>
                      )}
                    </div>
                    <h3 className="text-slate-100 font-semibold text-base leading-snug line-clamp-2">
                      {test.title}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center shrink-0">
                    <FaClipboardList className="text-violet-400" />
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <FaClock className="text-slate-600" />
                    {test.duration} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FaStar className="text-slate-600" />
                    {test.totalMarks} marks
                  </span>
                  <span className="text-violet-400/80 font-medium">
                    {test.subject}
                  </span>
                  <span>{test.class}</span>
                </div>

                {/* Attempt score if attempted */}
                {attempted && (
                  <div className="bg-[#0d1f35] rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Your score</span>
                    <span
                      className={`text-sm font-bold ${test.attemptInfo.passed ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {test.attemptInfo.score}/{test.totalMarks}
                      <span className="text-slate-500 font-normal ml-1">
                        ({test.attemptInfo.percentage}%)
                      </span>
                    </span>
                  </div>
                )}

                {/* Instructor */}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-xs text-slate-600">
                    by {test.instructor?.name || "Instructor"}
                  </span>
                  <button
                    onClick={() => handleStart(test._id)}
                    disabled={starting === test._id}
                    className="flex items-center gap-1.5 bg-violet-700 hover:bg-violet-600 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                  >
                    {starting === test._id
                      ? "Starting…"
                      : attempted
                        ? "Retake"
                        : "Start Test"}
                    <FaChevronRight className="text-[10px]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
