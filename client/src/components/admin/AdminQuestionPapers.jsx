// components/admin/AdminQuestionPapers.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  UploadCloud,
  Trash2,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  X,
  ExternalLink,
} from "lucide-react";
import axios from "axios";

const BOARDS = ["CBSE", "MP Board", "ICSE"];
const CLASSES = ["Class 9", "Class 10", "Class 11", "Class 12"];
const YEARS = [2025, 2024, 2023, 2022, 2021];

const SUBJECTS = {
  "CBSE-Class 9": [
    "Mathematics",
    "Science",
    "Social Science",
    "English",
    "Hindi A",
    "Hindi B",
    "Sanskrit",
    "Information Technology",
  ],
  "CBSE-Class 10": [
    "Mathematics",
    "Science",
    "Social Science",
    "English",
    "Hindi A",
    "Hindi B",
    "Sanskrit",
    "Information Technology",
    "Computer Applications",
  ],
  "CBSE-Class 11": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "English Core",
    "Accountancy",
    "Economics",
    "Business Studies",
    "History",
    "Political Science",
    "Geography",
    "Computer Science",
  ],
  "CBSE-Class 12": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "English Core",
    "Accountancy",
    "Economics",
    "Business Studies",
    "History",
    "Political Science",
    "Geography",
    "Computer Science",
  ],
  "MP Board-Class 9": [
    "Mathematics",
    "Science",
    "Social Science",
    "Hindi",
    "English",
    "Sanskrit",
  ],
  "MP Board-Class 10": [
    "Mathematics",
    "Science",
    "Social Science",
    "Hindi",
    "English",
    "Sanskrit",
    "Computer Science",
  ],
  "MP Board-Class 11": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "Hindi",
    "English",
    "Accountancy",
    "Economics",
    "History",
    "Political Science",
    "Geography",
    "Business Studies",
    "Computer Science",
  ],
  "MP Board-Class 12": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "Hindi",
    "English",
    "Accountancy",
    "Economics",
    "History",
    "Political Science",
    "Geography",
    "Business Studies",
    "Computer Science",
    "Sociology",
  ],
  "ICSE-Class 9": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History & Civics",
    "Geography",
    "Computer Applications",
    "Economics",
  ],
  "ICSE-Class 10": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History & Civics",
    "Geography",
    "Computer Applications",
    "Economics",
    "Hindi",
    "Commercial Studies",
  ],
  "ICSE-Class 11": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "English",
    "Computer Science",
    "Economics",
    "Accounts",
    "Geography",
    "History",
  ],
  "ICSE-Class 12": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "English",
    "Computer Science",
    "Economics",
    "Accounts",
    "Geography",
    "History",
    "Business Studies",
  ],
};

const BOARD_COLOR = {
  CBSE: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  "MP Board": "bg-orange-500/10 text-orange-300 border-orange-500/20",
  ICSE: "bg-purple-500/10 text-purple-300 border-purple-500/20",
};

export default function AdminQuestionPapers() {
  const [form, setForm] = useState({
    board: "",
    class: "",
    subject: "",
    year: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBoard, setFilterBoard] = useState("All");
  const [deleting, setDeleting] = useState(null);

  const [courses, setCourses] = useState([]);

  const subjects = useMemo(() => {
    const set = new Set();
    courses.forEach((course) => {
      if (course.board === form.board && course.category === form.class) {
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
            if (sub) set.add(sub.trim());
          });
        } else {
          if (course.title) {
            set.add(course.title.trim());
          }
        }
      }
    });
    const list = Array.from(set).sort();
    return list.length > 0 ? list : (SUBJECTS[`${form.board}-${form.class}`] || []);
  }, [courses, form.board, form.class]);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/question-papers/all");
      setPapers(data);
    } catch {
      showToast("error", "Failed to load papers.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await axios.get("/courses/public");
      const raw = Array.isArray(data) ? data : (data.courses ?? data.data ?? []);
      setCourses(raw.filter(Boolean));
    } catch (err) {
      console.error("Failed to load courses:", err);
    }
  };

  useEffect(() => {
    fetchPapers();
    fetchCourses();
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpload = async () => {
    if (!form.board || !form.class || !form.subject || !form.year || !file)
      return showToast("error", "Please fill all fields and select a PDF.");
    if (file.type !== "application/pdf")
      return showToast("error", "Only PDF files are allowed.");
    if (file.size > 20 * 1024 * 1024)
      return showToast("error", "File size must be under 20 MB.");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("board", form.board);
    fd.append("class", form.class);
    fd.append("subject", form.subject);
    fd.append("year", form.year);

    try {
      setUploading(true);
      setProgress(0);
      await axios.post("/question-papers/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) =>
          setProgress(Math.round((e.loaded * 100) / e.total)),
      });
      showToast("success", `${form.subject} ${form.year} uploaded!`);
      setForm({ board: "", class: "", subject: "", year: "" });
      setFile(null);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
      fetchPapers();
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question paper?")) return;
    try {
      setDeleting(id);
      await axios.delete(`/question-papers/${id}`);
      setPapers((prev) => prev.filter((p) => p._id !== id));
      showToast("success", "Paper deleted.");
    } catch {
      showToast("error", "Delete failed.");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = papers.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.subject.toLowerCase().includes(q) ||
      p.board.toLowerCase().includes(q) ||
      p.class.toLowerCase().includes(q) ||
      String(p.year).includes(q);
    return matchSearch && (filterBoard === "All" || p.board === filterBoard);
  });

  const sel = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: val,
      ...(field === "board" ? { class: "", subject: "" } : {}),
      ...(field === "class" ? { subject: "" } : {}),
    }));
  };

  const inputCls =
    "w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="space-y-8 p-1">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold animate-in fade-in slide-in-from-top-3 ${
            toast.type === "success"
              ? "bg-green-950 border-green-500/30 text-green-300"
              : "bg-red-950 border-red-500/30 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.msg}
        </div>
      )}

      {/* Upload Card */}
      <div className="bg-[#0f1a2e] border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <UploadCloud size={18} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Upload Question Paper
            </h2>
            <p className="text-xs text-slate-500">
              PDF only · Max 20 MB
            </p>
          </div>
        </div>

        {/* Form selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1.5 block">
              Board
            </label>
            <select
              value={form.board}
              onChange={sel("board")}
              className={inputCls}
            >
              <option value="">Select Board</option>
              {BOARDS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1.5 block">
              Class
            </label>
            <select
              value={form.class}
              onChange={sel("class")}
              disabled={!form.board}
              className={inputCls}
            >
              <option value="">Select Class</option>
              {CLASSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1.5 block">
              Subject
            </label>
            <select
              value={form.subject}
              onChange={sel("subject")}
              disabled={!form.class}
              className={inputCls}
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-1.5 block">
              Year
            </label>
            <select
              value={form.year}
              onChange={sel("year")}
              className={inputCls}
            >
              <option value="">Select Year</option>
              {YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-8 transition-all ${
            uploading
              ? "cursor-not-allowed opacity-60"
              : file
                ? "border-indigo-500/60 bg-indigo-500/5 cursor-pointer"
                : "border-slate-700 hover:border-slate-600 bg-slate-900/30 cursor-pointer"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
          {file ? (
            <>
              <FileText size={28} className="text-indigo-400" />
              <p className="text-sm font-semibold text-indigo-300">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {!uploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition"
                >
                  <X size={16} />
                </button>
              )}
            </>
          ) : (
            <>
              <UploadCloud size={28} className="text-slate-500" />
              <p className="text-sm text-slate-400">
                <span className="text-indigo-400 font-semibold">
                  Click to browse
                </span>{" "}
                or drag & drop
              </p>
              <p className="text-xs text-slate-600">
                PDF files only · Max 20 MB
              </p>
            </>
          )}
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Uploading{" "}
              {progress}%
            </>
          ) : (
            <>
              <UploadCloud size={16} /> Upload Paper
            </>
          )}
        </button>
      </div>

      {/* Papers Table */}
      <div className="bg-[#0f1a2e] border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-white">Uploaded Papers</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {papers.length} total · {filtered.length} shown
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-44 transition"
              />
            </div>
            <select
              value={filterBoard}
              onChange={(e) => setFilterBoard(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Boards</option>
              {BOARDS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400 text-sm">
            <Loader2 size={20} className="animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-500 text-sm gap-2">
            <FileText size={32} className="text-slate-700" />
            <p>
              {papers.length === 0
                ? "No papers uploaded yet."
                : "No papers match your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                  {[
                    "Board",
                    "Class",
                    "Subject",
                    "Year",
                    "File",
                    "Uploaded",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${BOARD_COLOR[p.board]}`}
                      >
                        {p.board}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-medium">
                      {p.class}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{p.subject}</td>
                    <td className="px-4 py-3 text-slate-300">{p.year}</td>
                    <td className="px-4 py-3">
                      <a
                        href={p.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold transition"
                      >
                        <ExternalLink size={12} /> View PDF
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(p._id)}
                        disabled={deleting === p._id}
                        className="text-slate-500 hover:text-red-400 transition disabled:opacity-40"
                      >
                        {deleting === p._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
