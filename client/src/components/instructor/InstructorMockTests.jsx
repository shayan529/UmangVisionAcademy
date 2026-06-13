// pages/instructor/InstructorMockTests.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  FaPlus,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaEdit,
  FaClipboardList,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import {
  fetchInstructorTests,
  createMockTest,
  deleteMockTest,
  togglePublishTest,
} from "../../redux/slices/mockTestSlice";

const BOARDS = ["CBSE", "ICSE", "MP Board", "All"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const SUBJECTS = [
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
  const dispatch = useDispatch();
  const { instructorTests, loading } = useSelector((s) => s.mockTest);

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

  useEffect(() => {
    dispatch(fetchInstructorTests());
  }, [dispatch]);

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

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (form.questions.some((q) => !q.questionText.trim()))
      return toast.error("All questions must have text");
    if (form.questions.some((q) => q.options.some((o) => !o.trim())))
      return toast.error("All options must be filled");

    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      await dispatch(createMockTest(payload)).unwrap();
      toast.success("Mock test created!");
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
      toast.error(err || "Failed to create test");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this mock test?")) return;
    try {
      await dispatch(deleteMockTest(id)).unwrap();
      toast.success("Test deleted");
    } catch (err) {
      toast.error(err || "Failed to delete");
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await dispatch(togglePublishTest(id)).unwrap();
      toast.success(res.isPublished ? "Test published" : "Test unpublished");
    } catch (err) {
      toast.error(err || "Failed to update");
    }
  };

  return (
    <div className="min-h-screen bg-[#060d1a] p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mock Tests</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {instructorTests.length} tests created
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          <FaPlus className="text-xs" />
          New Test
        </button>
      </div>

      {/* ── Create Form ───────────────────────────────── */}
      {showForm && (
        <div className="bg-[#0b1628] border border-[#1a2e48] rounded-2xl p-6 mb-6 space-y-5">
          <h2 className="text-slate-200 font-semibold text-base mb-1">
            Create Mock Test
          </h2>

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title *">
              <input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="e.g. CBSE Class 10 Maths — Chapter 1"
                className="input-dark"
              />
            </Field>
            <Field label="Subject">
              <select
                value={form.subject}
                onChange={(e) => updateForm("subject", e.target.value)}
                className="input-dark"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s} className="bg-[#0b1120]">
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Class">
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
            <Field label="Board">
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
            <Field label="Duration (minutes)">
              <input
                type="number"
                min={5}
                value={form.duration}
                onChange={(e) => updateForm("duration", +e.target.value)}
                className="input-dark"
              />
            </Field>
            <Field label="Difficulty">
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
            <Field label="Total Marks">
              <input
                type="number"
                min={1}
                value={form.totalMarks}
                onChange={(e) => updateForm("totalMarks", +e.target.value)}
                className="input-dark"
              />
            </Field>
            <Field label="Passing Marks">
              <input
                type="number"
                min={1}
                value={form.passingMarks}
                onChange={(e) => updateForm("passingMarks", +e.target.value)}
                className="input-dark"
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={2}
              placeholder="Optional brief description"
              className="input-dark resize-none"
            />
          </Field>
          <Field label="Tags (comma separated)">
            <input
              value={form.tags}
              onChange={(e) => updateForm("tags", e.target.value)}
              placeholder="e.g. algebra, cbse, chapter1"
              className="input-dark"
            />
          </Field>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-300 font-semibold text-sm">
                Questions ({form.questions.length})
              </p>
              <button
                onClick={addQuestion}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
              >
                <FaPlus className="text-[10px]" /> Add Question
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
                    placeholder="Enter question text…"
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
                          title="Mark as correct answer"
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
                    ● Select the radio button next to the correct answer
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Marks">
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
                    <Field label="Explanation (optional)">
                      <input
                        value={q.explanation}
                        onChange={(e) =>
                          updateQuestion(qIdx, "explanation", e.target.value)
                        }
                        placeholder="Why is this correct?"
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
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-violet-700 hover:bg-violet-600 text-white transition-all disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create Test"}
            </button>
          </div>
        </div>
      )}

      {/* ── Test List ───────────────────────────── */}
      {instructorTests.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FaClipboardList className="text-5xl text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">No mock tests yet</p>
          <p className="text-slate-600 text-sm mt-1">
            Click "New Test" to create your first mock test
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
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-slate-100 font-semibold text-sm truncate">
                      {test.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-lg font-semibold shrink-0 ${
                        test.isPublished
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-slate-700/40 text-slate-400"
                      }`}
                    >
                      {test.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    {test.subject} · {test.class} · {test.questions.length}{" "}
                    questions · {test.duration} min · {test.attempts} attempts
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(test._id)}
                    className={`text-xl transition-colors ${test.isPublished ? "text-emerald-400 hover:text-emerald-300" : "text-slate-600 hover:text-slate-400"}`}
                    title={test.isPublished ? "Unpublish" : "Publish"}
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
                    Questions Preview
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

      {/* Shared input style via a style tag */}
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
