// pages/student/MockTests/MockTestLeaderboard.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaTrophy,
  FaMedal,
  FaClock,
  FaArrowLeft,
  FaSearch,
} from "react-icons/fa";
import {
  fetchAvailableTests,
  fetchLeaderboard,
} from "../../redux/slices/mockTestSlice";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

const RANK_STYLES = {
  1: {
    medal: <FaTrophy className="text-amber-400 text-base" />,
    row: "bg-amber-400/5 border-amber-400/20",
    rank: "text-amber-400",
  },
  2: {
    medal: <FaMedal className="text-slate-300 text-base" />,
    row: "bg-slate-400/5 border-slate-400/20",
    rank: "text-slate-300",
  },
  3: {
    medal: <FaMedal className="text-amber-600 text-base" />,
    row: "bg-amber-700/5 border-amber-700/20",
    rank: "text-amber-600",
  },
};

export default function MockTestLeaderboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { availableTests, leaderboard, loading } = useSelector(
    (s) => s.mockTest,
  );
  const [selectedTestId, setSelectedTestId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAvailableTests({}));
  }, [dispatch]);

  // Auto-select first test
  useEffect(() => {
    if (availableTests.length > 0 && !selectedTestId) {
      setSelectedTestId(availableTests[0]._id);
    }
  }, [availableTests]);

  useEffect(() => {
    if (selectedTestId) {
      dispatch(fetchLeaderboard(selectedTestId))
        .unwrap()
        .catch((err) => {
          toast.error(err || "Could not load leaderboard");
        });
    }
  }, [selectedTestId, dispatch]);

  const currentTest = availableTests.find((t) => t._id === selectedTestId);

  const filtered = leaderboard.filter((entry) =>
    entry.studentName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#060d1a] p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/student-dashboard/mock-tests")}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <FaArrowLeft />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FaTrophy className="text-amber-400" /> Leaderboard
          </h1>
          <p className="text-slate-400 text-sm">Top performers per test</p>
        </div>
      </div>

      {/* Test selector */}
      <div className="bg-[#0b1628] border border-[#1a2e48] rounded-2xl p-4 mb-5">
        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">
          Select Test
        </p>
        <div className="flex flex-wrap gap-2">
          {availableTests.map((t) => (
            <button
              key={t._id}
              onClick={() => setSelectedTestId(t._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedTestId === t._id
                  ? "bg-violet-700 text-white"
                  : "bg-[#1a2e48] text-slate-400 hover:text-white"
              }`}
            >
              {t.title.length > 28 ? t.title.slice(0, 28) + "…" : t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Current test info */}
      {currentTest && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-slate-200 font-semibold text-sm">
              {currentTest.title}
            </h2>
            <p className="text-slate-500 text-xs">
              {currentTest.subject} · {leaderboard.length} participants
            </p>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-[#0b1628] border border-[#1a2e48] rounded-xl px-3 py-2">
            <FaSearch className="text-slate-500 text-xs" />
            <input
              type="text"
              placeholder="Search name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-slate-300 text-xs outline-none w-28 placeholder-slate-600"
            />
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {!loading && filtered.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6 px-4">
          {/* 2nd */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-slate-300 font-bold text-lg border-2 border-slate-400/30">
              {filtered[1]?.studentName?.[0]?.toUpperCase() || "?"}
            </div>
            <p className="text-xs text-slate-300 font-medium text-center truncate w-full text-center">
              {filtered[1]?.studentName}
            </p>
            <p className="text-xs text-slate-400">{filtered[1]?.percentage}%</p>
            <div className="w-full h-16 bg-[#0b1628] border border-[#1a2e48] rounded-t-xl flex items-center justify-center">
              <FaMedal className="text-slate-300 text-xl" />
            </div>
          </div>

          {/* 1st */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl border-2 border-amber-400/40 shadow-lg shadow-amber-500/20">
              {filtered[0]?.studentName?.[0]?.toUpperCase() || "?"}
            </div>
            <p className="text-xs text-amber-300 font-semibold text-center truncate w-full text-center">
              {filtered[0]?.studentName}
            </p>
            <p className="text-xs text-amber-400 font-bold">
              {filtered[0]?.percentage}%
            </p>
            <div className="w-full h-24 bg-amber-400/5 border border-amber-400/20 rounded-t-xl flex items-center justify-center">
              <FaTrophy className="text-amber-400 text-2xl" />
            </div>
          </div>

          {/* 3rd */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-amber-200 font-bold text-lg border-2 border-amber-700/30">
              {filtered[2]?.studentName?.[0]?.toUpperCase() || "?"}
            </div>
            <p className="text-xs text-slate-300 font-medium text-center truncate w-full text-center">
              {filtered[2]?.studentName}
            </p>
            <p className="text-xs text-slate-400">{filtered[2]?.percentage}%</p>
            <div className="w-full h-10 bg-[#0b1628] border border-[#1a2e48] rounded-t-xl flex items-center justify-center">
              <FaMedal className="text-amber-600 text-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Full leaderboard table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 bg-[#0b1628] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FaTrophy className="text-4xl text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {search
              ? "No matching participants"
              : "No attempts yet for this test"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Header */}
          <div className="grid grid-cols-12 px-4 py-2 text-xs text-slate-600 font-semibold uppercase tracking-wider">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Name</span>
            <span className="col-span-2 text-right">Score</span>
            <span className="col-span-2 text-right">%</span>
            <span className="col-span-2 text-right">Time</span>
          </div>

          {filtered.map((entry) => {
            const style = RANK_STYLES[entry.rank] || {};
            return (
              <div
                key={entry.rank}
                className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl border transition-all ${
                  style.row || "bg-[#0b1628] border-[#1a2e48]"
                }`}
              >
                <span
                  className={`col-span-1 font-bold text-sm ${style.rank || "text-slate-500"}`}
                >
                  {style.medal || entry.rank}
                </span>
                <span className="col-span-5 text-sm text-slate-200 font-medium truncate pr-2">
                  {entry.studentName}
                </span>
                <span className="col-span-2 text-right text-sm font-bold text-slate-300">
                  {entry.score}/{entry.totalMarks}
                </span>
                <span
                  className={`col-span-2 text-right text-sm font-bold ${entry.passed ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {entry.percentage}%
                </span>
                <span className="col-span-2 text-right text-xs text-slate-500 flex items-center justify-end gap-1">
                  <FaClock className="text-[10px]" />
                  {formatTime(entry.timeTaken)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
