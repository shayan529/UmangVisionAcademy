// pages/student/MockTests/MockTestPlayer.jsx
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaClock, FaExclamationTriangle } from "react-icons/fa";
import {
  startMockTest,
  submitMockTest,
} from "../../redux/slices/mockTestSlice";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function MockTestPlayer() {
  const { testId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeTest, loading } = useSelector((s) => s.mockTest);

  const [answers, setAnswers] = useState({}); // { questionIndex: selectedOption }
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Load or resume test
  useEffect(() => {
    if (!activeTest || activeTest.test?._id !== testId) {
      dispatch(startMockTest(testId))
        .unwrap()
        .catch((err) => {
          toast.error(err || "Could not load test");
          navigate("/student-dashboard/mock-tests");
        });
    }
  }, [testId]);

  // Pre-fill existing answers if resuming
  useEffect(() => {
    if (activeTest) {
      const totalSeconds = activeTest.test.duration * 60;
      const elapsed = Math.floor(
        (Date.now() - new Date(activeTest.startedAt).getTime()) / 1000,
      );
      const remaining = Math.max(0, totalSeconds - elapsed);
      setTimeLeft(remaining);
      startTimeRef.current = Date.now() - elapsed * 1000;

      // Pre-fill answers from server if resuming
      if (activeTest.existingAnswers?.length > 0) {
        const prefilled = {};
        activeTest.existingAnswers.forEach((a) => {
          if (a.selectedOption !== null)
            prefilled[a.questionIndex] = a.selectedOption;
        });
        setAnswers(prefilled);
      }
    }
  }, [activeTest]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const handleSelect = (qIndex, optIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    clearTimeout(timerRef.current);
    setSubmitting(true);

    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

    const answersArray = activeTest.test.questions.map((_, i) => ({
      questionIndex: i,
      selectedOption: answers[i] !== undefined ? answers[i] : null,
    }));

    try {
      await dispatch(
        submitMockTest({
          attemptId: activeTest.attemptId,
          answers: answersArray,
          timeTaken,
        }),
      ).unwrap();
      toast.success(
        autoSubmit ? "Time's up! Test submitted." : "Test submitted!",
      );
      navigate(`/student-dashboard/mock-tests/result/${activeTest.attemptId}`);
    } catch (err) {
      toast.error(err || "Submission failed");
      setSubmitting(false);
    }
  };

  if (loading && !activeTest) {
    return (
      <div className="min-h-screen bg-[#060d1a] flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading test…</div>
      </div>
    );
  }

  if (!activeTest) return null;

  const questions = activeTest.test.questions;
  const q = questions[current];
  const answered = Object.keys(answers).length;
  const isWarning = timeLeft !== null && timeLeft <= 120; // last 2 min

  return (
    <div className="min-h-screen bg-[#060d1a] flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#0b1628]/95 backdrop-blur border-b border-[#1a2e48] px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-slate-100 font-semibold text-sm md:text-base truncate">
            {activeTest.test.title}
          </h1>
          <p className="text-slate-500 text-xs">
            {answered}/{questions.length} answered
          </p>
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg transition-colors ${
            isWarning
              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              : "bg-[#1a2e48] text-slate-200"
          }`}
        >
          {isWarning && <FaClock className="text-sm animate-pulse" />}
          {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
          className="bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-60"
        >
          Submit
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-4 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Question panel */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Question */}
          <div className="bg-[#0b1628] border border-[#1a2e48] rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-6">
              <span className="bg-violet-600/20 text-violet-400 text-xs font-bold px-2.5 py-1 rounded-lg shrink-0">
                Q{current + 1}
              </span>
              <p className="text-slate-100 leading-relaxed">{q.questionText}</p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3">
              {q.options.map((opt, idx) => {
                const selected = answers[current] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(current, idx)}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                      selected
                        ? "border-violet-500 bg-violet-600/10 text-violet-300"
                        : "border-[#1e3a5f] bg-[#0d1f35] text-slate-300 hover:border-violet-700/50 hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        selected
                          ? "border-violet-500 bg-violet-600 text-white"
                          : "border-[#2a4a6e] text-slate-500"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prev / Next */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrent((c) => c - 1)}
              disabled={current === 0}
              className="px-5 py-2 rounded-xl text-sm font-medium text-slate-400 border border-[#1a2e48] hover:border-slate-500 hover:text-white disabled:opacity-30 transition-all"
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrent((c) => c + 1)}
              disabled={current === questions.length - 1}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-[#1a2e48] text-slate-300 hover:bg-[#1e3a5f] hover:text-white disabled:opacity-30 transition-all"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Question palette */}
        <div className="md:w-56 shrink-0">
          <div className="bg-[#0b1628] border border-[#1a2e48] rounded-2xl p-4 sticky top-24">
            <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
              Questions
            </p>
            <div className="grid grid-cols-5 md:grid-cols-4 gap-1.5">
              {questions.map((_, i) => {
                const ans = answers[i] !== undefined;
                const isCurrent = i === current;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
                      isCurrent
                        ? "bg-violet-600 text-white scale-110 shadow-md shadow-violet-900/30"
                        : ans
                          ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                          : "bg-[#1a2e48] text-slate-500 hover:bg-[#1e3a5f] hover:text-slate-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-3 h-3 rounded bg-emerald-600/20 border border-emerald-600/30" />
                Answered
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-3 h-3 rounded bg-[#1a2e48]" />
                Not answered
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm submit modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1c30] border border-[#1a2e48] rounded-2xl p-6 max-w-sm w-full">
            <FaExclamationTriangle className="text-amber-400 text-2xl mb-3" />
            <h3 className="text-slate-100 font-bold text-lg mb-2">
              Submit Test?
            </h3>
            <p className="text-slate-400 text-sm mb-1">
              You have answered {answered} out of {questions.length} questions.
            </p>
            {answered < questions.length && (
              <p className="text-amber-400/80 text-sm mb-4">
                {questions.length - answered} question(s) will be marked
                unanswered.
              </p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium text-slate-400 border border-[#1a2e48] hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit();
                }}
                disabled={submitting}
                className="flex-1 py-2 rounded-xl text-sm font-bold bg-violet-700 hover:bg-violet-600 text-white transition-all disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
