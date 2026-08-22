// components/admin/AdminMockTests.jsx
import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Search,
  Loader2,
  X,
  Check,
  BookOpen,
} from "lucide-react";
import apiClient from "../../config/api";

const BOARDS = ["CBSE", "ICSE", "MP Board", "All"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const SUBJECTS = [
  "Mathematics", "Science", "English", "Social Science", "Hindi",
  "Physics", "Chemistry", "Biology", "History", "Geography",
];
const CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

const emptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctOption: 0,
  explanation: "",
  marks: 1,
});

const EMPTY_FORM = {
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
  isPublished: true,
  instructorId: "",
  questions: [emptyQuestion()],
};

// ── Small reusable primitives ─────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function InputDark({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-[#060d1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500 placeholder:text-slate-600 ${className}`}
    />
  );
}

function SelectDark({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full bg-[#060d1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500 ${className}`}
    >
      {children}
    </select>
  );
}

function DifficultyBadge({ level }) {
  const colours = {
    Easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Hard: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };
  return (
    <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${colours[level] || ""}`}>
      {level}
    </span>
  );
}

// ── Assign-instructor modal ───────────────────────────────────────────────────
function AssignInstructorModal({ test, instructors, onClose, onAssigned, showToast }) {
  const [selectedId, setSelectedId] = useState(
    test.instructor?._id || test.instructor || "",
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedId) return showToast("Please select an instructor.");
    setSaving(true);
    try {
      await apiClient.patch(`/mock-tests/admin/${test._id}/assign`, {
        instructorId: selectedId,
      });
      showToast("Instructor assigned.");
      onAssigned();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to assign instructor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Assign Instructor</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4 truncate">
          Test: <span className="text-white font-medium">{test.title}</span>
        </p>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-5">
          {instructors.map((inst) => {
            const active = selectedId === inst._id;
            return (
              <button
                key={inst._id}
                type="button"
                onClick={() => setSelectedId(inst._id)}
                className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-colors ${
                  active
                    ? "border-violet-500 bg-violet-950/30"
                    : "border-slate-800 bg-[#0b1120] hover:border-slate-600"
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-white">{inst.name}</div>
                  <div className="text-[11px] text-slate-500">{inst.email}</div>
                </div>
                {active && <Check size={14} className="text-violet-400 shrink-0" />}
              </button>
            );
          })}
          {instructors.length === 0 && (
            <p className="text-xs text-slate-500">No instructors found.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Question editor ───────────────────────────────────────────────────────────
function QuestionEditor({ questions, onChange }) {
  const update = (idx, field, value) => {
    const next = [...questions];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const next = [...questions];
    const opts = [...next[qIdx].options];
    opts[optIdx] = value;
    next[qIdx] = { ...next[qIdx], options: opts };
    onChange(next);
  };

  const add = () => onChange([...questions, emptyQuestion()]);
  const remove = (idx) => onChange(questions.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Questions ({questions.length})
        </span>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-semibold"
        >
          <Plus size={12} /> Add Question
        </button>
      </div>
      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div
            key={qIdx}
            className="bg-[#0d1f35] border border-[#1e3a5f] rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-lg">
                Q{qIdx + 1}
              </span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(qIdx)}
                  className="text-rose-500 hover:text-rose-400 text-xs"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <textarea
              value={q.questionText}
              onChange={(e) => update(qIdx, "questionText", e.target.value)}
              placeholder="Enter question text…"
              rows={2}
              className="w-full bg-[#060d1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500 resize-none placeholder:text-slate-600"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={q.correctOption === optIdx}
                    onChange={() => update(qIdx, "correctOption", optIdx)}
                    className="accent-violet-500 shrink-0"
                    title="Mark as correct answer"
                  />
                  <InputDark
                    value={opt}
                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-600">
              Select the radio button next to the correct answer.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Marks">
                <InputDark
                  type="number"
                  min={1}
                  value={q.marks}
                  onChange={(e) => update(qIdx, "marks", +e.target.value)}
                />
              </Field>
              <Field label="Explanation (optional)">
                <InputDark
                  value={q.explanation}
                  onChange={(e) => update(qIdx, "explanation", e.target.value)}
                  placeholder="Why this is the answer…"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Create / Edit modal ───────────────────────────────────────────────────────
function MockTestModal({ initial, instructors, onClose, onSaved, showToast }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(() => {
    if (!initial) return { ...EMPTY_FORM };
    return {
      title: initial.title || "",
      description: initial.description || "",
      subject: initial.subject || "Mathematics",
      class: initial.class || "Class 10",
      board: initial.board || "CBSE",
      duration: initial.duration || 60,
      totalMarks: initial.totalMarks || 100,
      passingMarks: initial.passingMarks || 33,
      difficulty: initial.difficulty || "Medium",
      tags: (initial.tags || []).join(", "),
      isPublished: initial.isPublished !== false,
      instructorId: initial.instructor?._id || initial.instructor || "",
      questions: initial.questions?.length
        ? initial.questions.map((q) => ({
            questionText: q.questionText || "",
            options: q.options || ["", "", "", ""],
            correctOption: q.correctOption ?? 0,
            explanation: q.explanation || "",
            marks: q.marks || 1,
          }))
        : [emptyQuestion()],
    };
  });
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) return showToast("Title is required.");
    if (!form.instructorId) return showToast("Please assign an instructor.");
    if (form.questions.some((q) => !q.questionText.trim()))
      return showToast("All questions must have text.");
    if (form.questions.some((q) => q.options.some((o) => !o.trim())))
      return showToast("All options must be filled in.");

    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (isEdit) {
        await apiClient.put(`/mock-tests/admin/${initial._id}`, payload);
        showToast("Test updated.");
      } else {
        await apiClient.post("/mock-tests/admin", payload);
        showToast("Test created.");
      }
      onSaved();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save test.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">
            {isEdit ? "Edit Mock Test" : "Create Mock Test"}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          {/* Instructor assignment — first and most prominent */}
          <Field label="Assign to Instructor *">
            <SelectDark
              value={form.instructorId}
              onChange={(e) => set("instructorId", e.target.value)}
            >
              <option value="">— select instructor —</option>
              {instructors.map((inst) => (
                <option key={inst._id} value={inst._id} className="bg-[#0b1120]">
                  {inst.name} ({inst.email})
                </option>
              ))}
            </SelectDark>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title *">
              <InputDark
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Class 10 Maths Final"
                autoFocus
              />
            </Field>
            <Field label="Subject">
              <SelectDark value={form.subject} onChange={(e) => set("subject", e.target.value)}>
                {SUBJECTS.map((s) => <option key={s} value={s} className="bg-[#0b1120]">{s}</option>)}
              </SelectDark>
            </Field>
            <Field label="Class">
              <SelectDark value={form.class} onChange={(e) => set("class", e.target.value)}>
                {CLASSES.map((c) => <option key={c} value={c} className="bg-[#0b1120]">{c}</option>)}
              </SelectDark>
            </Field>
            <Field label="Board">
              <SelectDark value={form.board} onChange={(e) => set("board", e.target.value)}>
                {BOARDS.map((b) => <option key={b} value={b} className="bg-[#0b1120]">{b}</option>)}
              </SelectDark>
            </Field>
            <Field label="Duration (minutes)">
              <InputDark type="number" min={5} value={form.duration} onChange={(e) => set("duration", +e.target.value)} />
            </Field>
            <Field label="Difficulty">
              <SelectDark value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
                {DIFFICULTIES.map((d) => <option key={d} value={d} className="bg-[#0b1120]">{d}</option>)}
              </SelectDark>
            </Field>
            <Field label="Total Marks">
              <InputDark type="number" min={1} value={form.totalMarks} onChange={(e) => set("totalMarks", +e.target.value)} />
            </Field>
            <Field label="Passing Marks">
              <InputDark type="number" min={1} value={form.passingMarks} onChange={(e) => set("passingMarks", +e.target.value)} />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Optional description…"
              className="w-full bg-[#060d1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500 resize-none placeholder:text-slate-600"
            />
          </Field>

          <Field label="Tags (comma-separated)">
            <InputDark
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="e.g. algebra, finals, 2024"
            />
          </Field>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${form.isPublished ? "bg-emerald-600" : "bg-slate-700"}`}
              onClick={() => set("isPublished", !form.isPublished)}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isPublished ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-slate-300">
              {form.isPublished ? "Published" : "Draft (not visible to students)"}
            </span>
          </label>

          <QuestionEditor
            questions={form.questions}
            onChange={(questions) => set("questions", questions)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Create Test"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminMockTests({ showToast }) {
  const [tests, setTests] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const toast = (msg) => showToast?.(msg);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/mock-tests/admin/all");
      setTests(res.data.tests || []);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to load tests.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInstructors = useCallback(async () => {
    try {
      const res = await apiClient.get("/users?role=instructor");
      // The users endpoint may return all users — filter for instructors
      const all = res.data.users || res.data || [];
      setInstructors(
        all.filter((u) => u.role === "instructor"),
      );
    } catch {
      // Non-fatal — instructor list just won't populate
    }
  }, []);

  useEffect(() => {
    fetchTests();
    fetchInstructors();
  }, [fetchTests, fetchInstructors]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDelete = async (test) => {
    if (!window.confirm(`Delete "${test.title}"? This will also remove all student attempts.`)) return;
    try {
      await apiClient.delete(`/mock-tests/admin/${test._id}`);
      toast("Test deleted.");
      setTests((prev) => prev.filter((t) => t._id !== test._id));
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to delete.");
    }
  };

  const handleTogglePublish = async (test) => {
    try {
      const res = await apiClient.patch(`/mock-tests/admin/${test._id}/publish`);
      setTests((prev) =>
        prev.map((t) => (t._id === test._id ? { ...t, isPublished: res.data.isPublished } : t)),
      );
      toast(res.data.isPublished ? "Test published." : "Test set to draft.");
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to toggle publish.");
    }
  };

  const afterSave = () => {
    setCreateOpen(false);
    setEditTarget(null);
    fetchTests();
  };

  const afterAssign = () => {
    setAssignTarget(null);
    fetchTests();
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = tests.filter((t) => {
    if (!q.trim()) return true;
    const lower = q.toLowerCase();
    return (
      t.title?.toLowerCase().includes(lower) ||
      t.subject?.toLowerCase().includes(lower) ||
      t.instructor?.name?.toLowerCase().includes(lower)
    );
  });

  // ── Stats bar ──────────────────────────────────────────────────────────────
  const totalPublished = tests.filter((t) => t.isPublished).length;
  const totalDraft = tests.length - totalPublished;

  return (
    <div className="min-h-screen bg-[#060d1a] p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-950/80 via-slate-900 to-slate-950 border border-violet-900/40 p-5 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 w-fit text-xs font-extrabold uppercase tracking-wider mb-2">
              <ClipboardList size={14} />
              <span>Test Management</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Mock Tests
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              {tests.length} total · {totalPublished} published · {totalDraft} draft
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-violet-600/25 whitespace-nowrap cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Plus size={16} />
            New Test
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, subject, instructor…"
          className="w-full bg-[#0b1120] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 outline-none focus:border-violet-500 placeholder:text-slate-600"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen size={48} className="text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">
            {q ? "No tests match your search." : "No mock tests yet."}
          </p>
          {!q && (
            <p className="text-slate-600 text-sm mt-1">
              Click "New Test" to create the first one.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((test) => {
            const expanded = expandedId === test._id;
            const instrName = test.instructor?.name || "Unassigned";
            return (
              <div
                key={test._id}
                className="bg-[#0b1628] border border-[#1a2e48] rounded-2xl overflow-hidden shadow-md"
              >
                {/* Row */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 px-4 sm:px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-extrabold text-white leading-snug">{test.title}</h3>
                      <DifficultyBadge level={test.difficulty} />
                      {test.isPublished ? (
                        <span className="text-[10px] font-bold border rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold border rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-400 border-amber-500/30">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {test.subject} · {test.class} · {test.board} · {test.questions?.length ?? 0} questions · {test.duration} min · {test.attempts ?? 0} attempts
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Instructor:{" "}
                      <span className="text-slate-300 font-semibold">{instrName}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 mt-2 sm:mt-0">
                    <button
                      title={test.isPublished ? "Set to Draft" : "Publish"}
                      onClick={() => handleTogglePublish(test)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                        test.isPublished
                          ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20"
                          : "text-amber-300 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20"
                      }`}
                    >
                      {test.isPublished ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      {test.isPublished ? "Published" : "Draft"}
                    </button>

                    <button
                      title="Assign / Reassign Instructor"
                      onClick={() => setAssignTarget(test)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold border border-slate-700 bg-slate-900 text-slate-300 hover:text-violet-400 hover:border-violet-500/40 hover:bg-violet-500/10 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      <UserCheck size={14} />
                      Assign
                    </button>

                    <button
                      title="Edit"
                      onClick={() => setEditTarget(test)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold border border-slate-700 bg-slate-900 text-slate-300 hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      title="Delete"
                      onClick={() => handleDelete(test)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold border border-slate-700 bg-slate-900 text-slate-300 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>

                    <button
                      title={expanded ? "Collapse" : "Preview questions"}
                      onClick={() => setExpandedId(expanded ? null : test._id)}
                      className="col-span-2 sm:col-span-1 w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold border border-slate-700 bg-slate-900 text-slate-300 hover:text-slate-200 hover:border-slate-500 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {expanded ? "Hide Questions" : "Preview Questions"}
                    </button>
                  </div>
                </div>

                {/* Expanded question preview */}
                {expanded && (
                  <div className="border-t border-[#1a2e48] px-5 py-4 space-y-2">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-2">
                      Questions preview
                    </p>
                    {(test.questions || []).map((ques, i) => (
                      <div
                        key={i}
                        className="text-sm text-slate-400 bg-[#0d1f35] rounded-xl px-4 py-2.5"
                      >
                        <span className="text-violet-400 font-medium mr-2">Q{i + 1}.</span>
                        {ques.questionText}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <MockTestModal
          instructors={instructors}
          onClose={() => setCreateOpen(false)}
          onSaved={afterSave}
          showToast={toast}
        />
      )}
      {editTarget && (
        <MockTestModal
          initial={editTarget}
          instructors={instructors}
          onClose={() => setEditTarget(null)}
          onSaved={afterSave}
          showToast={toast}
        />
      )}
      {assignTarget && (
        <AssignInstructorModal
          test={assignTarget}
          instructors={instructors}
          onClose={() => setAssignTarget(null)}
          onAssigned={afterAssign}
          showToast={toast}
        />
      )}
    </div>
  );
}
