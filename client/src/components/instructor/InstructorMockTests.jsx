// pages/instructor/InstructorMockTests.jsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  FaPlus,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaClipboardList,
  FaChevronDown,
  FaChevronUp,
  FaRobot,
  FaSpinner,
} from "react-icons/fa";
import api from "../../config/api";
import {
  fetchInstructorTests,
  createMockTest,
  deleteMockTest,
  togglePublishTest,
} from "../../redux/slices/mockTestSlice";
import { fetchCourses } from "../../redux/slices/courseSlice";

const BOARDS = ["CBSE", "ICSE", "MP Board", "All"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DEFAULT_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Social Science",
  "Hindi",
  "Physics",
  "Chemistry",
  "Biology",
];
const CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

const emptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctOption: 0,
  explanation: "",
  marks: 1,
});

export default function InstructorMockTests() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { instructorTests, loading } = useSelector((s) => s.mockTest);
  const { courses = [] } = useSelector((s) => s.courses);

  const dynamicSubjects = useMemo(() => {
    const subjects = new Set();
    courses.forEach((course) => {
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
    const list = Array.from(subjects).sort();
    return list.length > 0 ? list : DEFAULT_SUBJECTS;
  }, [courses]);

  const [showForm, setShowForm] = useState(false);
  const [expandedTest, setExpandedTest] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "Mathematics",
    class: "Class 10",
    board: "CBSE",
    duration: 60,
    totalMarks: 100,
    passingMarks: 33,
    difficulty: "Medium",
    tags: "",
    questions: [emptyQuestion()],
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);

  useEffect(() => {
    dispatch(fetchInstructorTests());
    dispatch(fetchCourses());
  }, [dispatch]);

  useEffect(() => {
    if (dynamicSubjects.length > 0 && !dynamicSubjects.includes(form.subject)) {
      setForm((prev) => ({ ...prev, subject: dynamicSubjects[0] }));
    }
  }, [dynamicSubjects]);

  const updateForm = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateQuestion = (qIdx, field, value) => {
    const qs = [...form.questions];
    qs[qIdx] = { ...qs[qIdx], [field]: value };
    setForm((prev) => ({ ...prev, questions: qs }));
  };

  const updateOption = (qIdx, optIdx, value) => {
    const qs = [...form.questions];
    const opts = [...qs[qIdx].options];
    opts[optIdx] = value;
    qs[qIdx] = { ...qs[qIdx], options: opts };
    setForm((prev) => ({ ...prev, questions: qs }));
  };

  const addQuestion = () =>
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, emptyQuestion()],
    }));

  const removeQuestion = (idx) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));

  const handleGenerateAI = async () => {
    if (!form.subject || !form.class) {
      return toast.error(t("instructorMockTests.subjectClassRequired", "Subject and Class are required for AI generation."));
    }
    try {
      setIsGeneratingAI(true);
      const res = await api.post("/ai/generate-mock-test", {
        subject: form.subject,
        className: form.class,
        board: form.board,
        difficulty: form.difficulty,
        topic: aiTopic,
        count: aiCount
      });
      const generated = res.data.questions;
      
      setForm((prev) => {
        let newQuestions = [...prev.questions];
        if (newQuestions.length === 1 && !newQuestions[0].questionText.trim()) {
          newQuestions = generated;
        } else {
          newQuestions = [...newQuestions, ...generated];
        }
        return { ...prev, questions: newQuestions };
      });
      toast.success(t("instructorMockTests.aiGeneratedSuccess", "Successfully generated questions with AI!"));
      setAiTopic("");
    } catch (err) {
      toast.error(err?.response?.data?.message || t("instructorMockTests.aiGenerateFailed", "Failed to generate questions."));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim())
      return toast.error(t("instructorMockTests.titleRequired"));
    if (form.questions.some((q) => !q.questionText.trim()))
      return toast.error(t("instructorMockTests.questionsTextRequired"));
    if (form.questions.some((q) => q.options.some((o) => !o.trim())))
      return toast.error(t("instructorMockTests.optionsRequired"));

    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      await dispatch(createMockTest(payload)).unwrap();
      toast.success(t("instructorMockTests.created"));
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        subject: "Mathematics",
        class: "Class 10",
        board: "CBSE",
        duration: 60,
        totalMarks: 100,
        passingMarks: 33,
        difficulty: "Medium",
        tags: "",
        questions: [emptyQuestion()],
      });
    } catch (err) {
      toast.error(err || t("instructorMockTests.failedCreate"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("instructorMockTests.confirmDelete"))) return;
    try {
      await dispatch(deleteMockTest(id)).unwrap();
      toast.success(t("instructorMockTests.deleted"));
    } catch (err) {
      toast.error(err || t("instructorMockTests.failedDelete"));
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await dispatch(togglePublishTest(id)).unwrap();
      toast.success(
        res.isPublished
          ? t("instructorMockTests.published")
          : t("instructorMockTests.unpublished"),
      );
    } catch (err) {
      toast.error(err || t("instructorMockTests.failedUpdate"));
    }
  };

  return (
    <div className="min-h-screen bg-[#060d1a] p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {t("instructorMockTests.title")}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {t("instructorMockTests.testsCreated", {
              count: instructorTests.length,
            })}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          <FaPlus className="text-xs" />
          {t("instructorMockTests.newTest")}
        </button>
      </div>

      {/* ── Create Form ───────────────────────────────── */}
      {showForm && (
        <div className="bg-[#0b1628] border border-[#1a2e48] rounded-2xl p-6 mb-6 space-y-5">
          <h2 className="text-slate-200 font-semibold text-base mb-1">
            {t("instructorMockTests.createMockTest")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t("instructorMockTests.titleLabel")}>
              <input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder={t("instructorMockTests.titlePlaceholder")}
                className="input-dark"
              />
            </Field>
            <Field label={t("instructorMockTests.subject")}>
              <select
                value={form.subject}
                onChange={(e) => updateForm("subject", e.target.value)}
                className="input-dark"
              >
                {dynamicSubjects.map((s) => (
                  <option key={s} value={s} className="bg-[#0b1120]">
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("instructorMockTests.class")}>
              <select
                value={form.class}
                onChange={(e) => updateForm("class", e.target.value)}
                className="input-dark"
              >
                {CLASSES.map((c) => (
                  <option key={c} value={c} className="bg-[#0b1120]">
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("instructorMockTests.board")}>
              <select
                value={form.board}
                onChange={(e) => updateForm("board", e.target.value)}
                className="input-dark"
              >
                {BOARDS.map((b) => (
                  <option key={b} value={b} className="bg-[#0b1120]">
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("instructorMockTests.duration")}>
              <input
                type="number"
                min={5}
                value={form.duration}
                onChange={(e) => updateForm("duration", +e.target.value)}
                className="input-dark"
              />
            </Field>
            <Field label={t("instructorMockTests.difficulty")}>
              <select
                value={form.difficulty}
                onChange={(e) => updateForm("difficulty", e.target.value)}
                className="input-dark"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d} className="bg-[#0b1120]">
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("instructorMockTests.totalMarks")}>
              <input
                type="number"
                min={1}
                value={form.totalMarks}
                onChange={(e) => updateForm("totalMarks", +e.target.value)}
                className="input-dark"
              />
            </Field>
            <Field label={t("instructorMockTests.passingMarks")}>
              <input
                type="number"
                min={1}
                value={form.passingMarks}
                onChange={(e) => updateForm("passingMarks", +e.target.value)}
                className="input-dark"
              />
            </Field>
          </div>
          <Field label={t("instructorMockTests.description")}>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={2}
              placeholder={t("instructorMockTests.descriptionPlaceholder")}
              className="input-dark resize-none"
            />
          </Field>
          <Field label={t("instructorMockTests.tags")}>
            <input
              value={form.tags}
              onChange={(e) => updateForm("tags", e.target.value)}
              placeholder={t("instructorMockTests.tagsPlaceholder")}
              className="input-dark"
            />
          </Field>

          {/* AI Generation Section */}
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <FaRobot className="text-indigo-400" />
              <h3 className="text-indigo-200 font-semibold text-sm">✨ Auto-generate with AI</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Topic Focus (Optional)</label>
                <input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., Algebra, Thermodynamics..."
                  className="input-dark w-full text-sm"
                  disabled={isGeneratingAI}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">No. of Questions</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={aiCount}
                  onChange={(e) => setAiCount(+e.target.value)}
                  className="input-dark w-full text-sm"
                  disabled={isGeneratingAI}
                />
              </div>
            </div>
            <button
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors w-full justify-center md:w-auto mt-2"
            >
              {isGeneratingAI ? <FaSpinner className="animate-spin" /> : <FaRobot />}
              {isGeneratingAI ? "Generating..." : "Generate Questions"}
            </button>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-300 font-semibold text-sm">
                {t("instructorMockTests.questions", {
                  count: form.questions.length,
                })}
              </p>
              <button
                onClick={addQuestion}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
              >
                <FaPlus className="text-[10px]" />{" "}
                {t("instructorMockTests.addQuestion")}
              </button>
            </div>

            <div className="space-y-4">
              {form.questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="bg-[#0d1f35] border border-[#1e3a5f] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-lg">
                      Q{qIdx + 1}
                    </span>
                    {form.questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qIdx)}
                        className="text-rose-400 hover:text-rose-300 text-xs transition-colors"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>

                  <textarea
                    value={q.questionText}
                    onChange={(e) =>
                      updateQuestion(qIdx, "questionText", e.target.value)
                    }
                    placeholder={t("instructorMockTests.enterQuestionText")}
                    rows={2}
                    className="input-dark resize-none w-full"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correctOption === optIdx}
                          onChange={() =>
                            updateQuestion(qIdx, "correctOption", optIdx)
                          }
                          className="accent-violet-500 shrink-0"
                          title={t("instructorMockTests.markCorrect")}
                        />
                        <input
                          value={opt}
                          onChange={(e) =>
                            updateOption(qIdx, optIdx, e.target.value)
                          }
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          className="input-dark flex-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {t("instructorMockTests.selectCorrectAnswer")}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t("instructorMockTests.marks")}>
                      <input
                        type="number"
                        min={1}
                        value={q.marks}
                        onChange={(e) =>
                          updateQuestion(qIdx, "marks", +e.target.value)
                        }
                        className="input-dark"
                      />
                    </Field>
                    <Field label={t("instructorMockTests.explanationOptional")}>
                      <input
                        value={q.explanation}
                        onChange={(e) =>
                          updateQuestion(qIdx, "explanation", e.target.value)
                        }
                        placeholder={t(
                          "instructorMockTests.explanationPlaceholder",
                        )}
                        className="input-dark"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-[#1a2e48] hover:text-white transition-all"
            >
              {t("instructorMockTests.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-violet-700 hover:bg-violet-600 text-white transition-all disabled:opacity-60"
            >
              {loading
                ? t("instructorMockTests.creating")
                : t("instructorMockTests.createTest")}
            </button>
          </div>
        </div>
      )}

      {/* ── Test List ───────────────────────────── */}
      {instructorTests.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FaClipboardList className="text-5xl text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">
            {t("instructorMockTests.noMockTests")}
          </p>
          <p className="text-slate-600 text-sm mt-1">
            {t("instructorMockTests.noMockTestsHint")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {instructorTests.map((test) => (
            <div
              key={test._id}
              className="bg-[#0b1628] border border-[#1a2e48] rounded-2xl overflow-hidden"
            >
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Title + pill on same row, wraps on small screens */}
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h3 className="text-slate-100 font-semibold text-sm">
                      {test.title}
                    </h3>

                    {/* ── Status pill ── */}
                    {test.isPublished ? (
                      <span
                        className="inline-flex items-center gap-2 rounded-full font-bold whitespace-nowrap shrink-0"
                        style={{
                          fontSize: "0.8rem",
                          padding: "6px 20px",
                          minWidth: "110px",
                          justifyContent: "center",
                          background: "rgba(16,185,129,0.15)",
                          color: "#6ee7b7",
                          border: "1.5px solid rgba(16,185,129,0.4)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#34d399",
                            flexShrink: 0,
                            boxShadow: "0 0 8px #34d399",
                          }}
                        />
                        {t("instructorMockTests.publishedState")}
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-2 rounded-full font-bold whitespace-nowrap shrink-0"
                        style={{
                          fontSize: "0.8rem",
                          padding: "6px 20px",
                          minWidth: "110px",
                          justifyContent: "center",
                          background: "rgba(245,158,11,0.15)", // Amber
                          color: "#fbbf24",
                          border: "1.5px solid rgba(245,158,11,0.4)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#fbbf24",
                            flexShrink: 0,
                            boxShadow: "0 0 8px #fbbf24",
                          }}
                        />
                        {t("instructorMockTests.draftState")}
                      </span>
                    )}

                    {/* ── Publish / Unpublish text button ── */}
                    <button
                      onClick={() => handleToggle(test._id)}
                      className="inline-flex items-center gap-2 rounded-full font-bold whitespace-nowrap shrink-0"
                      style={{
                        fontSize: "0.8rem",
                        padding: "6px 20px",
                        minWidth: "110px",
                        justifyContent: "center",
                        background: "rgba(139,92,246,0.15)",
                        color: "#ffffff",
                        border: "1px solid rgba(139,92,246,0.4)",
                        letterSpacing: "0.02em",
                        cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(139,92,246,0.28)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(139,92,246,0.15)")
                      }
                    >
                      {test.isPublished
                        ? t("instructorMockTests.unpublish")
                        : t("instructorMockTests.publish")}
                    </button>
                  </div>

                  <p className="text-slate-500 text-xs">
                    {test.subject} · {test.class} · {test.questions.length}{" "}
                    {t("instructorMockTests.meta", {
                      count: test.questions.length,
                      duration: test.duration,
                      attempts: test.attempts,
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleToggle(test._id)}
                    title={
                      test.isPublished
                        ? t("instructorMockTests.unpublish")
                        : t("instructorMockTests.publish")
                    }
                    className={`text-2xl transition-colors ${
                      test.isPublished
                        ? "text-emerald-400 hover:text-emerald-300"
                        : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    {test.isPublished ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                  <button
                    onClick={() => handleDelete(test._id)}
                    className="text-slate-600 hover:text-rose-400 transition-colors text-sm"
                  >
                    <FaTrash />
                  </button>
                  <button
                    onClick={() =>
                      setExpandedTest(
                        expandedTest === test._id ? null : test._id,
                      )
                    }
                    className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
                  >
                    {expandedTest === test._id ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded questions preview */}
              {expandedTest === test._id && (
                <div className="border-t border-[#1a2e48] px-5 py-4 space-y-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    {t("instructorMockTests.questionsPreview")}
                  </p>
                  {test.questions.map((q, i) => (
                    <div
                      key={i}
                      className="text-sm text-slate-400 bg-[#0d1f35] rounded-xl px-4 py-2.5"
                    >
                      <span className="text-violet-400 font-medium mr-2">
                        Q{i + 1}.
                      </span>
                      {q.questionText}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Shared input style */}
      <style>{`
        .input-dark {
          width: 100%;
          background: #060d1a;
          border: 1px solid #1e3a5f;
          border-radius: 10px;
          padding: 8px 12px;
          color: #cbd5e1;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-dark:focus { border-color: #6d28d9; }
        .input-dark::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      {children}
    </div>
  );
}
