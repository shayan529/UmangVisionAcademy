import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../redux/slices/courseSlice";
import { uploadToImageKit } from "../../utils/imagekitUpload.js";
import ChapterManager from "../course/ChapterManager.jsx";

const EMPTY_FORM = {
  subject: "",
  className: "",
  board: "",
  description: "",
  content: "",
  lessons: [],
  notes: [],
  price: "",
  thumbnailUrl: "",
  demoVideoUrl: "",
  quiz: { title: "Final Quiz", questions: [] },
  certificate: {
    enabled: false,
    title: "Certificate of Completion",
    signatoryName: "",
    signatoryTitle: "",
    theme: "purple",
  },
};

const EMPTY_BULK_ITEM = () => ({
  subject: "",
  price: "",
  description: "",
  content: "",
  lessons: [],
  notes: [],
  quiz: { title: "Final Quiz", questions: [] },
  certificate: {
    enabled: false,
    title: "Certificate of Completion",
    signatoryName: "",
    signatoryTitle: "",
    theme: "purple",
  },
});

const CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
const BOARDS = ["CBSE", "ICSE", "MP Board"];
const DRAFT_STORAGE_KEY = "instructorCourseDraft";

// ── Bulk-upload specific constants ────────────────────────────────────────────
const BULK_CLASSES = ["Class 9", "Class 10", "Class 11", "Class 12"];

const CLASS_SUBJECTS = {
  "Class 9": [
    "Mathematics",
    "Science",
    "Social Science",
    "English",
    "Hindi",
    "Sanskrit",
    "Computer Science",
  ],
  "Class 10": [
    "Mathematics",
    "Science",
    "Social Science",
    "English",
    "Hindi",
    "Sanskrit",
    "Computer Science",
  ],
  "Class 11": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "Computer Science",
    "Physical Education",
    "Accountancy",
    "Business Studies",
    "Economics",
    "Statistics",
    "History",
    "Geography",
    "Political Science",
    "Psychology",
    "Sociology",
    "English",
    "Hindi",
  ],
  "Class 12": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "Computer Science",
    "Physical Education",
    "Accountancy",
    "Business Studies",
    "Economics",
    "Statistics",
    "History",
    "Geography",
    "Political Science",
    "Psychology",
    "Sociology",
    "English",
    "Hindi",
  ],
};

const isDraftForm = (form) =>
  Boolean(
    form.subject?.trim() ||
    form.className?.trim() ||
    form.board?.trim() ||
    form.description?.trim() ||
    form.content?.trim() ||
    form.thumbnailUrl?.trim() ||
    form.demoVideoUrl?.trim() ||
    (Array.isArray(form.lessons) && form.lessons.length > 0) ||
    Number(form.price) > 0,
  );

const statusStyle = (course) => {
  const s = course.approvalStatus ?? (course.published ? "approved" : "draft");
  switch (s) {
    case "pending":
      return {
        bg: "#1c1a00",
        text: "#fbbf24",
        border: "#854d0e",
        label: "Pending Review",
      };
    case "approved":
      return {
        bg: "#052e16",
        text: "#4ade80",
        border: "#166534",
        label: "Published",
      };
    case "rejected":
      return {
        bg: "#2d0a0a",
        text: "#f87171",
        border: "#7f1d1d",
        label: "Rejected",
      };
    default:
      return {
        bg: "#111827",
        text: "#64748b",
        border: "#1e293b",
        label: "Draft",
      };
  }
};

// ── FileUploader ──────────────────────────────────────────────────────────────
const FileUploader = ({
  accept,
  label,
  hint,
  folder,
  onUploaded,
  currentUrl,
  icon,
}) => {
  const inputRef = useRef(null);
  const [status, setStatus] = useState(currentUrl ? "done" : "idle");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentUrl || null);
  const [errMsg, setErrMsg] = useState("");
  const isImage = accept.includes("image");

  const handleFile = async (file) => {
    if (!file) return;
    if (isImage) setPreview(URL.createObjectURL(file));
    setStatus("uploading");
    setProgress(0);
    setErrMsg("");
    try {
      const data = await uploadToImageKit({
        file,
        folder,
        onUploadProgress: (e) =>
          setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      setStatus("done");
      onUploaded(data.url);
      if (!isImage) setPreview(null);
    } catch (err) {
      setStatus("error");
      setErrMsg(err.response?.data?.message || err.message || "Upload failed.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };
  const clear = () => {
    setStatus("idle");
    setPreview(null);
    setProgress(0);
    onUploaded("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          display: "block",
          marginBottom: 8,
        }}
      >
        {label}
        {hint && (
          <span
            style={{
              color: "#475569",
              fontWeight: 400,
              textTransform: "none",
              letterSpacing: 0,
              marginLeft: 6,
            }}
          >
            {hint}
          </span>
        )}
      </label>
      <div
        onClick={() => status !== "uploading" && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: `2px dashed ${status === "done" ? "#16a34a" : status === "error" ? "#dc2626" : "#334155"}`,
          borderRadius: 12,
          padding: 16,
          cursor: status === "uploading" ? "not-allowed" : "pointer",
          background: "#0b1120",
          minHeight: 90,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          overflow: "hidden",
          transition: "border-color 0.2s",
        }}
      >
        {isImage && preview && (
          <img
            src={preview}
            alt="preview"
            style={{
              width: "100%",
              maxHeight: 120,
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
        )}
        {status === "idle" && !preview && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
            <p style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
              Click or drag & drop
            </p>
            <p style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
              {hint}
            </p>
          </div>
        )}
        {status === "uploading" && (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "center",
            }}
          >
            <p style={{ fontSize: 13, color: "#94a3b8" }}>
              Uploading… {progress}%
            </p>
            <div
              style={{
                width: "100%",
                height: 6,
                background: "#1e293b",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                  borderRadius: 4,
                  transition: "width 0.2s",
                }}
              />
            </div>
          </div>
        )}
        {status === "done" && !preview && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <p style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>
              {isImage ? "Image" : "Video"} uploaded
            </p>
          </div>
        )}
        {status === "error" && (
          <p style={{ fontSize: 13, color: "#f87171" }}>❌ {errMsg}</p>
        )}
      </div>
      <div
        style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}
      >
        {status !== "uploading" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#818cf8",
              background: "none",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            {status === "done" ? "Replace" : "Choose file"}
          </button>
        )}
        {(status === "done" || preview) && (
          <button
            type="button"
            onClick={clear}
            style={{
              fontSize: 11,
              color: "#64748b",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
};

// ── shared field/input primitives ─────────────────────────────────────────────
const iStyle = {
  padding: "10px 14px",
  background: "#0b1120",
  border: "1px solid #1e293b",
  borderRadius: 10,
  color: "#f1f5f9",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
const focus = (e) => (e.target.style.borderColor = "#7c3aed");
const blur = (e) => (e.target.style.borderColor = "#1e293b");

const Field = ({ label, hint, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      {label}
      {hint && (
        <span
          style={{
            color: "#475569",
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: 0,
            marginLeft: 6,
          }}
        >
          {hint}
        </span>
      )}
    </label>
    {children}
  </div>
);
const Input = ({ value, onChange, placeholder, type = "text" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    style={iStyle}
    onFocus={focus}
    onBlur={blur}
  />
);
const Textarea = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    style={{ ...iStyle, resize: "vertical", fontFamily: "inherit" }}
    onFocus={focus}
    onBlur={blur}
  />
);
const Sel = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={onChange}
    style={iStyle}
    onFocus={focus}
    onBlur={blur}
  >
    {options.map((o) => (
      <option
        key={o.value ?? o}
        value={o.value ?? o}
        style={{ background: "#0b1120" }}
      >
        {o.label ?? o}
      </option>
    ))}
  </select>
);

// ── NotesManager ─────────────────────────────────────────────────────────────
function NotesManager({ notes = [], onChange, showToast }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", description: "", fileUrl: "" });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const data = await uploadToImageKit({
        file,
        folder: "Umang Vision Academy/notes",
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });
      setNewNote((prev) => ({ ...prev, fileUrl: data.url }));
      showToast?.("File uploaded successfully.");
    } catch (err) {
      showToast?.("File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.title.trim()) {
      showToast?.("Note title is required.");
      return;
    }
    if (!newNote.fileUrl) {
      showToast?.("Please upload a file for the note.");
      return;
    }
    const updated = [...notes, { ...newNote, _id: new Date().getTime().toString() }];
    onChange(updated);
    setNewNote({ title: "", description: "", fileUrl: "" });
    setShowAddForm(false);
  };

  const handleRemoveNote = (idx) => {
    const updated = notes.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Course Study Notes</h4>
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Upload documents & PDFs for this course.</p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Add Note
          </button>
        )}
      </div>

      {showAddForm && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, border: "1px dashed #334155", borderRadius: 8, padding: 12, background: "#0b1120" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>Note Title *</label>
            <input
              type="text"
              value={newNote.title}
              onChange={(e) => setNewNote((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Chapter 1 Formula Sheet"
              style={{ padding: "8px 12px", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", fontSize: 12, width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>Description (optional)</label>
            <textarea
              value={newNote.description}
              onChange={(e) => setNewNote((p) => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Contains all core equations for Algebra chapter."
              rows={2}
              style={{ padding: "8px 12px", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", fontSize: 12, width: "100%", boxSizing: "border-box", resize: "none" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>File Upload * (PDF, DOCX, etc.)</label>
            {newNote.fileUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#111827", padding: "8px 12px", borderRadius: 8, border: "1px solid #16a34a" }}>
                <span style={{ fontSize: 14 }}>📄</span>
                <span style={{ fontSize: 12, color: "#4ade80", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{newNote.fileUrl}</span>
                <button
                  type="button"
                  onClick={() => setNewNote((p) => ({ ...p, fileUrl: "" }))}
                  style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: "none" }}
                  id="note-file-input"
                />
                <label
                  htmlFor="note-file-input"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px",
                    background: "#111827",
                    border: "1px dashed #334155",
                    borderRadius: 8,
                    color: "#94a3b8",
                    fontSize: 12,
                    cursor: uploading ? "not-allowed" : "pointer",
                    textAlign: "center"
                  }}
                >
                  {uploading ? `Uploading... (${progress}%)` : "📁 Choose File to Upload"}
                </label>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewNote({ title: "", description: "", fileUrl: "" });
              }}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddNote}
              style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#166534", color: "#4ade80", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {notes.map((note, idx) => (
            <div
              key={note._id || idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: "#0b1120",
                border: "1px solid #1e293b",
                borderRadius: 8,
              }}
            >
              <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{note.title}</p>
                {note.description && (
                  <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{note.description}</p>
                )}
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 10, color: "#818cf8", textDecoration: "none", display: "inline-block", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}
                >
                  🔗 {note.fileUrl}
                </a>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveNote(idx)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── QuizManager ───────────────────────────────────────────────────────────────
function QuizManager({
  quiz,
  onChange,
  courseTitle,
  courseDescription,
  showToast,
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null);
  const questions = quiz?.questions || [];

  const updateQuestions = (newQs) =>
    onChange({ ...(quiz || { title: "Final Quiz" }), questions: newQs });
  const addQuestion = () => {
    const blank = {
      question: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
    };
    const updated = [...questions, blank];
    updateQuestions(updated);
    setActiveIdx(updated.length - 1);
  };
  const removeQuestion = (idx) => {
    updateQuestions(questions.filter((_, i) => i !== idx));
    setActiveIdx(null);
  };
  const updateQuestion = (idx, field, value) =>
    updateQuestions(
      questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q)),
    );
  const updateOption = (qIdx, oIdx, value) =>
    updateQuestions(
      questions.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[oIdx] = value;
        return { ...q, options: opts };
      }),
    );

  const generateWithAI = async () => {
    if (!courseTitle?.trim() || !courseDescription?.trim()) {
      showToast?.("Add a Subject and Description before generating with AI.");
      return;
    }
    setAiLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: courseTitle,
          summary: courseDescription,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const aiQuestions = data.quiz?.questions;
      if (aiQuestions?.length) {
        updateQuestions(aiQuestions);
        setActiveIdx(0);
      } else {
        showToast?.(
          "AI didn't return any questions. Try a more detailed description.",
        );
      }
    } catch (err) {
      console.error("AI quiz generation failed:", err);
      showToast?.(err.message || "AI quiz generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #1e293b",
        borderRadius: 14,
        overflow: "hidden",
        background: "#0b1120",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "#111827",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📝</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
            Final Quiz
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
              background: "#1e1b4b",
              color: "#818cf8",
            }}
          >
            {questions.length} question{questions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={generateWithAI}
          disabled={aiLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 10,
            border: "none",
            background: aiLoading
              ? "#334155"
              : "linear-gradient(135deg,#7c3aed,#06b6d4)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            cursor: aiLoading ? "not-allowed" : "pointer",
            opacity: aiLoading ? 0.7 : 1,
          }}
        >
          {aiLoading ? (
            <>
              <svg
                style={{
                  animation: "spin 1s linear infinite",
                  width: 12,
                  height: 12,
                }}
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="3"
                  opacity=".3"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              Generating…
            </>
          ) : (
            "✨ Generate with AI"
          )}
        </button>
      </div>
      <div style={{ display: "flex", minHeight: questions.length ? 320 : 120 }}>
        {questions.length > 0 && (
          <div
            style={{
              width: 176,
              borderRight: "1px solid #1e293b",
              background: "#0d1526",
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              overflowY: "auto",
              flexShrink: 0,
            }}
          >
            {questions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "none",
                  background: activeIdx === idx ? "#7c3aed" : "transparent",
                  color: activeIdx === idx ? "#fff" : "#94a3b8",
                  fontSize: 11,
                  fontWeight: activeIdx === idx ? 700 : 500,
                  cursor: "pointer",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontWeight: 800 }}>Q{idx + 1}.</span>{" "}
                {q.question || "Untitled"}
              </button>
            ))}
            <button
              type="button"
              onClick={addQuestion}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px dashed #334155",
                background: "transparent",
                color: "#818cf8",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                marginTop: 4,
              }}
            >
              + Add Question
            </button>
          </div>
        )}
        <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
          {questions.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "#475569",
              }}
            >
              <span style={{ fontSize: 28 }}>🗒️</span>
              <p style={{ fontSize: 13 }}>No questions yet</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={addQuestion}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: "#7c3aed",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add Question
                </button>
                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={aiLoading}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: aiLoading ? 0.5 : 1,
                  }}
                >
                  ✨ Generate with AI
                </button>
              </div>
            </div>
          ) : activeIdx !== null && questions[activeIdx] ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}
                >
                  Question {activeIdx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(activeIdx)}
                  style={{
                    fontSize: 11,
                    color: "#f87171",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 8px",
                  }}
                >
                  Remove
                </button>
              </div>
              <textarea
                value={questions[activeIdx].question}
                onChange={(e) =>
                  updateQuestion(activeIdx, "question", e.target.value)
                }
                rows={2}
                placeholder="Enter question text…"
                style={{
                  ...iStyle,
                  resize: "vertical",
                  fontFamily: "inherit",
                  borderRadius: 10,
                }}
                onFocus={focus}
                onBlur={blur}
              />
              <div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}
                >
                  Options — select correct answer
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {questions[activeIdx].options.map((opt, oIdx) => {
                    const isCorrect =
                      questions[activeIdx].correctOptionIndex === oIdx;
                    return (
                      <div
                        key={oIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <input
                          type="radio"
                          name={`correct-${activeIdx}`}
                          checked={isCorrect}
                          onChange={() =>
                            updateQuestion(
                              activeIdx,
                              "correctOptionIndex",
                              oIdx,
                            )
                          }
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: "#4ade80",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#64748b",
                            width: 16,
                            flexShrink: 0,
                          }}
                        >
                          {"ABCD"[oIdx]}
                        </span>
                        <input
                          value={opt}
                          onChange={(e) =>
                            updateOption(activeIdx, oIdx, e.target.value)
                          }
                          placeholder={`Option ${"ABCD"[oIdx]}`}
                          style={{
                            ...iStyle,
                            borderColor: isCorrect ? "#16a34a" : "#1e293b",
                            background: isCorrect ? "#052e16" : "#0b1120",
                            color: isCorrect ? "#4ade80" : "#f1f5f9",
                          }}
                          onFocus={focus}
                          onBlur={(e) => {
                            e.target.style.borderColor = isCorrect
                              ? "#16a34a"
                              : "#1e293b";
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
                fontSize: 13,
              }}
            >
              Select a question to edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CertificateManager ────────────────────────────────────────────────────────
function CertificateManager({ certificate, onChange, courseTitle }) {
  const enabled = certificate?.enabled ?? false;
  const title = certificate?.title ?? "Certificate of Completion";
  const signatoryName = certificate?.signatoryName ?? "";
  const signatoryTitle = certificate?.signatoryTitle ?? "";
  const theme = certificate?.theme ?? "purple";

  const updateCert = (field, value) =>
    onChange({
      ...(certificate || {
        enabled: false,
        title: "Certificate of Completion",
        signatoryName: "",
        signatoryTitle: "",
        theme: "purple",
      }),
      [field]: value,
    });

  const themes = {
    purple: {
      name: "Purple Luxury",
      colors: ["#3b0764", "#6d28d9"],
      accent: "#c4b5fd",
      border: "#7c3aed",
    },
    blue: {
      name: "Classic Navy",
      colors: ["#1e3a8a", "#1d4ed8"],
      accent: "#bfdbfe",
      border: "#3b82f6",
    },
    green: {
      name: "Emerald Professional",
      colors: ["#052e16", "#166534"],
      accent: "#bbf7d0",
      border: "#16a34a",
    },
    gold: {
      name: "Royal Gold",
      colors: ["#451a03", "#b45309"],
      accent: "#fef08a",
      border: "#d97706",
    },
    dark: {
      name: "Minimalist Slate",
      colors: ["#0f172a", "#1e293b"],
      accent: "#e2e8f0",
      border: "#475569",
    },
  };
  const at = themes[theme] || themes.purple;

  return (
    <div
      style={{
        border: "1px solid #1e293b",
        borderRadius: 14,
        overflow: "hidden",
        background: "#0b1120",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎓</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
              Course Certificate
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Award a customized certificate to students who complete this
              course
            </div>
          </div>
        </div>
        <label
          style={{
            position: "relative",
            display: "inline-block",
            width: 44,
            height: 22,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => updateCert("enabled", e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: enabled ? "#7c3aed" : "#334155",
              transition: ".3s",
              borderRadius: 34,
              boxShadow: enabled ? "0 0 8px rgba(124,58,237,.4)" : "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              height: 16,
              width: 16,
              left: enabled ? 24 : 4,
              bottom: 3,
              backgroundColor: "white",
              transition: ".3s",
              borderRadius: "50%",
            }}
          />
        </label>
      </div>

      {enabled && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            animation: "slideDown 0.3s ease",
            paddingTop: 12,
            borderTop: "1px solid #1e293b",
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Field label="Certificate Title" hint="*">
              <Input
                value={title}
                onChange={(e) => updateCert("title", e.target.value)}
                placeholder="Certificate of Completion"
              />
            </Field>
            <Field label="Certificate Theme" hint="*">
              <Sel
                value={theme}
                onChange={(e) => updateCert("theme", e.target.value)}
                options={Object.keys(themes).map((k) => ({
                  value: k,
                  label: themes[k].name,
                }))}
              />
            </Field>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Field label="Signatory Name" hint="(authorized person signing)">
              <Input
                value={signatoryName}
                onChange={(e) => updateCert("signatoryName", e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </Field>
            <Field
              label="Signatory Title"
              hint="(e.g. Lead Instructor / Founder)"
            >
              <Input
                value={signatoryTitle}
                onChange={(e) => updateCert("signatoryTitle", e.target.value)}
                placeholder="e.g. Lead Instructor"
              />
            </Field>
          </div>

          {/* ── A4 Live Preview ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Live Certificate Preview (A4 Landscape)
            </div>

            <div
              style={{
                width: "100%",
                aspectRatio: "297 / 210",
                background: `linear-gradient(135deg, ${at.colors[0]}, ${at.colors[1]})`,
                borderRadius: 12,
                position: "relative",
                overflow: "hidden",
                fontFamily: "Georgia, serif",
                border: `1.5px solid ${at.border}44`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: -60,
                  top: -60,
                  width: 240,
                  height: 240,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: -50,
                  bottom: -50,
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "10px",
                  border: `1px solid ${at.accent}33`,
                  borderRadius: 8,
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "18px 22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "clamp(6px,1vw,9px)",
                        fontWeight: 800,
                        color: at.accent,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        fontFamily: "sans-serif",
                        marginBottom: 1,
                      }}
                    >
                      AICoaching Platform
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(5px,0.8vw,7px)",
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "sans-serif",
                      }}
                    >
                      Verify ID: CERT-XXXXXX
                    </div>
                  </div>
                  <div style={{ fontSize: "clamp(18px,2.8vw,32px)" }}>🏅</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 4%" }}>
                  <div
                    style={{
                      fontSize: "clamp(6px,0.9vw,8px)",
                      fontWeight: 700,
                      color: at.accent,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      fontFamily: "sans-serif",
                      marginBottom: "1%",
                    }}
                  >
                    {title || "Certificate of Completion"}
                  </div>
                  <div
                    style={{
                      width: "25%",
                      height: 1,
                      background: `linear-gradient(90deg,transparent,${at.accent}88,transparent)`,
                      margin: "0 auto 1.5%",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "clamp(5px,0.75vw,7px)",
                      color: "rgba(255,255,255,0.55)",
                      fontStyle: "italic",
                      marginBottom: "0.5%",
                    }}
                  >
                    This is to certify that
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(13px,2.2vw,26px)",
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.1,
                      marginBottom: "0.5%",
                      textShadow: `0 2px 10px ${at.accent}44`,
                    }}
                  >
                    Student Name
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(5px,0.75vw,7px)",
                      color: "rgba(255,255,255,0.55)",
                      fontStyle: "italic",
                      marginBottom: "1%",
                    }}
                  >
                    has successfully completed the course
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(8px,1.4vw,14px)",
                      fontWeight: 800,
                      color: at.accent,
                      fontFamily: "sans-serif",
                      lineHeight: 1.2,
                      marginBottom: "0.5%",
                    }}
                  >
                    {courseTitle || "Course Subject / Title"}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(5px,0.7vw,6px)",
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "sans-serif",
                    }}
                  >
                    on{" "}
                    {new Date().toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    borderTop: `1px solid rgba(255,255,255,0.1)`,
                    paddingTop: "1%",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "clamp(5px,0.7vw,6px)",
                        color: "rgba(255,255,255,0.35)",
                        fontFamily: "sans-serif",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: 1,
                      }}
                    >
                      Credential ID
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(5px,0.75vw,7px)",
                        color: at.accent,
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      CERT-XXXXXX
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: "clamp(20px,3vw,32px)",
                        height: "clamp(20px,3vw,32px)",
                        borderRadius: "50%",
                        border: `1.5px solid ${at.accent}66`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 2px",
                        fontSize: "clamp(9px,1.5vw,16px)",
                      }}
                    >
                      🎓
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(4px,0.55vw,5px)",
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "sans-serif",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Official Seal
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "clamp(7px,1.1vw,11px)",
                        fontFamily: "Georgia,serif",
                        fontStyle: "italic",
                        color: at.accent,
                        marginBottom: 2,
                        opacity: 0.9,
                      }}
                    >
                      {signatoryName || "Authorized Signatory"}
                    </div>
                    <div
                      style={{
                        width: "clamp(30px,5vw,55px)",
                        height: 1,
                        background: `${at.accent}55`,
                        marginLeft: "auto",
                        marginBottom: 2,
                      }}
                    />
                    <div
                      style={{
                        fontSize: "clamp(4px,0.65vw,6px)",
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "sans-serif",
                      }}
                    >
                      {signatoryTitle || "Instructor / Platform Admin"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CourseForm ────────────────────────────────────────────────────────────────
const CourseForm = ({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  mode,
  showToast,
}) => {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Subject" hint="*">
          <Input
            value={form.subject}
            onChange={set("subject")}
            placeholder="e.g. Mathematics"
          />
        </Field>
        <Field label="Class" hint="*">
          <Sel
            value={form.className}
            onChange={set("className")}
            options={[
              { value: "", label: "Select class" },
              ...CLASSES.map((c) => ({ value: c, label: c })),
            ]}
          />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Board" hint="*">
          <Sel
            value={form.board}
            onChange={set("board")}
            options={[
              { value: "", label: "Select board" },
              ...BOARDS.map((b) => ({ value: b, label: b })),
            ]}
          />
        </Field>
        <Field label="Price" hint="(₹ — 0 for free)">
          <Input
            value={form.price}
            onChange={set("price")}
            placeholder="0"
            type="number"
          />
        </Field>
      </div>

      <ChapterManager
        lessons={form.lessons ?? []}
        onChange={(lessons) => setForm((f) => ({ ...f, lessons }))}
        courseSubject={form.subject}
        courseDescription={form.description}
      />

      <CertificateManager
        certificate={form.certificate}
        onChange={(certificate) => setForm((f) => ({ ...f, certificate }))}
        courseTitle={form.subject}
      />

      <Field label="Description" hint="* (course summary)">
        <Textarea
          value={form.description}
          onChange={set("description")}
          placeholder="Brief description"
          rows={3}
        />
      </Field>
      <Field label="Course Content" hint="(chapters, topics)">
        <Textarea
          value={form.content}
          onChange={set("content")}
          placeholder={"Chapter 1: Algebra\nChapter 2: Geometry"}
          rows={5}
        />
      </Field>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        <FileUploader
          label="Thumbnail"
          hint="JPG, PNG, WEBP"
          accept="image/jpeg,image/png,image/webp,image/gif"
          folder="Umang Vision Academy/thumbnails"
          icon="🖼️"
          currentUrl={form.thumbnailUrl}
          onUploaded={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))}
        />
        <FileUploader
          label="Demo Video"
          hint="MP4, WEBM — max 200 MB"
          accept="video/mp4,video/webm,video/quicktime"
          folder="Umang Vision Academy/demos"
          icon="🎬"
          currentUrl={form.demoVideoUrl}
          onUploaded={(url) => setForm((f) => ({ ...f, demoVideoUrl: url }))}
        />
      </div>
      <NotesManager
        notes={form.notes ?? []}
        onChange={(notes) => setForm((f) => ({ ...f, notes }))}
        showToast={showToast}
      />
      <Field
        label="Final Quiz"
        hint="(optional — students take after completing all lessons)"
      >
        <QuizManager
          quiz={form.quiz}
          onChange={(quiz) => setForm((f) => ({ ...f, quiz }))}
          courseTitle={form.subject}
          courseDescription={form.description}
          showToast={showToast}
        />
      </Field>
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          paddingTop: 8,
          borderTop: "1px solid #1e293b",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid #334155",
            background: "transparent",
            color: "#94a3b8",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(false)}
          disabled={saving}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid #334155",
            background: "transparent",
            color: "#e2e8f0",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          Save as Draft
        </button>
        <button
          onClick={() => onSave(true)}
          disabled={saving}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            opacity: saving ? 0.6 : 1,
            boxShadow: "0 4px 16px rgba(124,58,237,.25)",
          }}
        >
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Submit for Review"
              : "Save & Submit for Review"}
        </button>
      </div>
    </div>
  );
};

// ── BulkCourseForm ────────────────────────────────────────────────────────────
const BulkCourseForm = ({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  showToast,
}) => {
  const setMeta = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [collapsedItems, setCollapsedItems] = useState({});
  const toggleCollapse = (idx) =>
    setCollapsedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));

  // When class changes, reset all item subjects so stale subjects don't linger
  const handleClassChange = (e) => {
    const newClass = e.target.value;
    setForm((f) => ({
      ...f,
      className: newClass,
      items: f.items.map((it) => ({ ...it, subject: "" })),
    }));
  };

  const availableSubjects = CLASS_SUBJECTS[form.className] ?? [];

  const updateItem = (idx, field, value) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) =>
        i === idx ? { ...it, [field]: value } : it,
      ),
    }));

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, EMPTY_BULK_ITEM()] }));

  const removeItem = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  // Subjects already picked by other items (to avoid duplicates)
  const takenSubjects = (currentIdx) =>
    new Set(
      form.items
        .filter((_, i) => i !== currentIdx)
        .map((it) => it.subject)
        .filter(Boolean),
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Class" hint="* (applies to all courses below)">
          <Sel
            value={form.className}
            onChange={handleClassChange}
            options={[
              { value: "", label: "Select class" },
              ...BULK_CLASSES.map((c) => ({ value: c, label: c })),
            ]}
          />
        </Field>
        <Field label="Board" hint="* (applies to all courses below)">
          <Sel
            value={form.board}
            onChange={setMeta("board")}
            options={[
              { value: "", label: "Select board" },
              ...BOARDS.map((b) => ({ value: b, label: b })),
            ]}
          />
        </Field>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        <FileUploader
          label="Thumbnail"
          hint="JPG, PNG, WEBP — shared by all courses in this batch"
          accept="image/jpeg,image/png,image/webp,image/gif"
          folder="Umang Vision Academy/thumbnails"
          icon="🖼️"
          currentUrl={form.thumbnailUrl}
          onUploaded={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))}
        />
        <FileUploader
          label="Demo Video"
          hint="MP4, WEBM — shared by all courses in this batch"
          accept="video/mp4,video/webm,video/quicktime"
          folder="Umang Vision Academy/demos"
          icon="🎬"
          currentUrl={form.demoVideoUrl}
          onUploaded={(url) => setForm((f) => ({ ...f, demoVideoUrl: url }))}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Courses ({form.items.length})
          </label>
          <button
            type="button"
            onClick={addItem}
            disabled={!form.className}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px dashed #334155",
              background: "transparent",
              color: form.className ? "#818cf8" : "#334155",
              fontSize: 12,
              fontWeight: 600,
              cursor: form.className ? "pointer" : "not-allowed",
            }}
          >
            + Add Subject
          </button>
        </div>

        {!form.className && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              border: "1px dashed #334155",
              background: "#0b1120",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#475569",
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 18 }}>☝️</span>
            Select a class above to see available subjects.
          </div>
        )}

        {form.items.map((item, idx) => {
          const taken = takenSubjects(idx);
          const subjectOptions = availableSubjects.filter(
            (s) => !taken.has(s) || s === item.subject,
          );

          const isCollapsed = !!collapsedItems[idx];

          return (
            <div
              key={idx}
              style={{
                border: "1px solid #1e293b",
                borderRadius: 14,
                background: "#0b1120",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* ── Card header (always visible) ── */}
              <div
                onClick={() => toggleCollapse(idx)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  cursor: "pointer",
                  borderBottom: isCollapsed ? "none" : "1px solid #1e293b",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Triangle toggle */}
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 10,
                      color: "#64748b",
                      transform: isCollapsed
                        ? "rotate(-90deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      lineHeight: 1,
                    }}
                  >
                    ▼
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}
                  >
                    Course {idx + 1}
                    {item.subject ? ` — ${item.subject}` : ""}
                  </span>
                  {isCollapsed && item.subject && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: "#1e1b4b",
                        color: "#818cf8",
                      }}
                    >
                      {form.className}
                    </span>
                  )}
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      style={{
                        fontSize: 11,
                        color: "#f87171",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* ── Collapsible body ── */}
              {!isCollapsed && (
                <div
                  style={{
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr",
                      gap: 12,
                    }}
                  >
                    <Field label="Subject" hint="*">
                      {form.className ? (
                        <Sel
                          value={item.subject}
                          onChange={(e) =>
                            updateItem(idx, "subject", e.target.value)
                          }
                          options={[
                            { value: "", label: "Select subject" },
                            ...subjectOptions.map((s) => ({
                              value: s,
                              label: s,
                            })),
                          ]}
                        />
                      ) : (
                        <div
                          style={{
                            ...iStyle,
                            color: "#475569",
                            cursor: "not-allowed",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          Select a class first
                        </div>
                      )}
                    </Field>
                    <Field label="Price" hint="(₹ — 0 for free)">
                      <Input
                        value={item.price}
                        onChange={(e) =>
                          updateItem(idx, "price", e.target.value)
                        }
                        placeholder="0"
                        type="number"
                      />
                    </Field>
                  </div>

                  <ChapterManager
                    lessons={item.lessons ?? []}
                    onChange={(lessons) => updateItem(idx, "lessons", lessons)}
                    courseSubject={item.subject}
                    courseDescription={item.description}
                  />

                  <CertificateManager
                    certificate={item.certificate}
                    onChange={(certificate) =>
                      updateItem(idx, "certificate", certificate)
                    }
                    courseTitle={item.subject}
                  />

                  <Field label="Description" hint="* (course summary)">
                    <Textarea
                      value={item.description}
                      onChange={(e) =>
                        updateItem(idx, "description", e.target.value)
                      }
                      placeholder="Brief description"
                      rows={3}
                    />
                  </Field>
                  <Field label="Course Content" hint="(chapters, topics)">
                    <Textarea
                      value={item.content}
                      onChange={(e) =>
                        updateItem(idx, "content", e.target.value)
                      }
                      placeholder={"Chapter 1: Algebra\nChapter 2: Geometry"}
                      rows={4}
                    />
                  </Field>
                  <NotesManager
                    notes={item.notes ?? []}
                    onChange={(notes) => updateItem(idx, "notes", notes)}
                    showToast={showToast}
                  />
                  <Field
                    label="Final Quiz"
                    hint="(optional — students take after completing all lessons)"
                  >
                    <QuizManager
                      quiz={item.quiz}
                      onChange={(quiz) => updateItem(idx, "quiz", quiz)}
                      courseTitle={item.subject}
                      courseDescription={item.description}
                      showToast={showToast}
                    />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          paddingTop: 8,
          borderTop: "1px solid #1e293b",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid #334155",
            background: "transparent",
            color: "#94a3b8",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(false)}
          disabled={saving}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid #334155",
            background: "transparent",
            color: "#e2e8f0",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          Save All as Draft
        </button>
        <button
          onClick={() => onSave(true)}
          disabled={saving}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            opacity: saving ? 0.6 : 1,
            boxShadow: "0 4px 16px rgba(124,58,237,.25)",
          }}
        >
          {saving
            ? "Submitting…"
            : `Submit All ${form.items.length} for Review`}
        </button>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function InstructorCourses({ showToast }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { courses = [], loading, error } = useSelector((s) => s.courses);

  const [view, setView] = useState("list");
  const [expandedId, setExpandedId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [createForm, setCreateForm] = useState(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) return EMPTY_FORM;
    try {
      return { ...EMPTY_FORM, ...JSON.parse(saved) };
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return EMPTY_FORM;
    }
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createMode, setCreateMode] = useState("single");
  const [bulkForm, setBulkForm] = useState({
    className: "",
    board: "",
    thumbnailUrl: "",
    demoVideoUrl: "",
    items: [EMPTY_BULK_ITEM()],
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const loadSavedDraft = () => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (isDraftForm(parsed)) setCreateForm({ ...EMPTY_FORM, ...parsed });
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  };

  useEffect(() => {
    const saveDraft = () => {
      if (isDraftForm(createForm))
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(createForm));
      else localStorage.removeItem(DRAFT_STORAGE_KEY);
    };
    saveDraft();
    const handleBeforeUnload = (e) => {
      if (view === "create" && isDraftForm(createForm)) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(createForm));
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      saveDraft();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [createForm, view]);

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.title?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q);
    const approvalS = c.approvalStatus ?? "draft";
    const matchStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "published"
          ? approvalS === "approved"
          : filterStatus === "pending"
            ? approvalS === "pending"
            : filterStatus === "rejected"
              ? approvalS === "rejected"
              : approvalS === "draft";
    return matchSearch && matchStatus;
  });

  const counts = {
    total: courses.length,
    pending: courses.filter((c) => c.approvalStatus === "pending").length,
    approved: courses.filter((c) => c.approvalStatus === "approved").length,
    rejected: courses.filter((c) => c.approvalStatus === "rejected").length,
    draft: courses.filter(
      (c) => !c.approvalStatus || c.approvalStatus === "draft",
    ).length,
  };

  const openEdit = (course) => {
    setExpandedId(course._id);
    setEditForm({
      subject: course.title ?? "",
      className: course.category ?? "",
      board: course.board ?? "",
      description: course.summary ?? "",
      lessons: course.lessons ?? [],
      notes: course.notes ?? [],
      content: course.description ?? "",
      thumbnailUrl: course.thumbnailUrl ?? "",
      demoVideoUrl: course.demoVideoUrl ?? "",
      price: course.price ?? 0,
      quiz: course.quiz ?? { title: "Final Quiz", questions: [] },
      certificate: course.certificate ?? {
        enabled: false,
        title: "Certificate of Completion",
        signatoryName: "",
        signatoryTitle: "",
        theme: "purple",
      },
    });
    setView("list");
  };
  const closeEdit = () => setExpandedId(null);

  const buildPayload = (form, published) => ({
    title: form.subject.trim(),
    summary: form.description.trim(),
    description: form.content?.trim() || "",
    category: form.className,
    board: form.board,
    lessons: form.lessons ?? [],
    notes: form.notes ?? [],
    price: Number(form.price) || 0,
    thumbnailUrl: form.thumbnailUrl || "",
    demoVideoUrl: form.demoVideoUrl || "",
    published,
    quiz: form.quiz ?? { title: "Final Quiz", questions: [] },
    certificate: form.certificate ?? {
      enabled: false,
      title: "Certificate of Completion",
      signatoryName: "",
      signatoryTitle: "",
      theme: "purple",
    },
  });

  const validateForPublish = (form) => {
    const required = [
      { key: "subject", label: "Subject" },
      { key: "className", label: "Class" },
      { key: "board", label: "Board" },
      { key: "description", label: "Description" },
      { key: "content", label: "Course Content" },
      { key: "thumbnailUrl", label: "Thumbnail" },
    ];
    for (const f of required) {
      if (!form[f.key]) {
        showToast?.(`${f.label} is required before submitting for review`);
        return false;
      }
    }
    return true;
  };

  const handleCreate = async (publish) => {
    if (publish && !validateForPublish(createForm)) return;
    setSaving(true);
    const result = await dispatch(
      createCourse(buildPayload(createForm, publish)),
    );
    setSaving(false);
    if (createCourse.fulfilled.match(result)) {
      setCreateForm(EMPTY_FORM);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setView("list");
      showToast?.(
        publish ? "Course submitted for admin review!" : "Saved as draft.",
      );
    } else {
      showToast?.(
        result.payload || "Failed to save course. Your draft is preserved.",
      );
    }
  };

  const handleBulkCreate = async (publish) => {
    if (!bulkForm.className || !bulkForm.board) {
      showToast?.("Select a Class and Board before submitting.");
      return;
    }
    const items = bulkForm.items.filter((it) => it.subject.trim());
    if (items.length === 0) {
      showToast?.("Add at least one subject.");
      return;
    }
    if (publish) {
      if (!bulkForm.thumbnailUrl) {
        showToast?.("Thumbnail is required before submitting for review.");
        return;
      }
      const missing = items.find(
        (it) => !it.description.trim() || !it.content.trim(),
      );
      if (missing) {
        showToast?.(
          "Every course needs a Description and Course Content before submitting for review.",
        );
        return;
      }
    }

    setSaving(true);
    let successCount = 0;
    for (const item of items) {
      const payload = {
        title: item.subject.trim(),
        summary: item.description.trim(),
        description: item.content?.trim() || "",
        category: bulkForm.className,
        board: bulkForm.board,
        lessons: item.lessons ?? [],
        notes: item.notes ?? [],
        price: Number(item.price) || 0,
        thumbnailUrl: bulkForm.thumbnailUrl || "",
        demoVideoUrl: bulkForm.demoVideoUrl || "",
        published: publish,
        quiz: item.quiz ?? { title: "Final Quiz", questions: [] },
        certificate: item.certificate ?? {
          enabled: false,
          title: "Certificate of Completion",
          signatoryName: "",
          signatoryTitle: "",
          theme: "purple",
        },
      };
      const result = await dispatch(createCourse(payload));
      if (createCourse.fulfilled.match(result)) successCount++;
    }
    setSaving(false);

    if (successCount > 0) {
      setBulkForm({
        className: "",
        board: "",
        thumbnailUrl: "",
        demoVideoUrl: "",
        items: [EMPTY_BULK_ITEM()],
      });
      setView("list");
    }
    showToast?.(
      `${successCount}/${items.length} courses ${publish ? "submitted for review" : "saved as draft"}.`,
    );
  };

  const handleEdit = async (publish) => {
    if (publish && !validateForPublish(editForm)) return;
    setSaving(true);
    await dispatch(
      updateCourse({
        id: expandedId,
        courseData: buildPayload(editForm, publish),
      }),
    );
    setSaving(false);
    closeEdit();
    showToast?.(publish ? "Course resubmitted for review!" : "Saved as draft.");
  };

  const handleDelete = async (id) => {
    await dispatch(deleteCourse(id));
    setDeleteId(null);
    if (expandedId === id) closeEdit();
    showToast?.("Course deleted.");
  };

  return (
    <>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .ic-row:hover { border-color:#334155 !important; }
        .ic-btn:hover { opacity:.8; }
        select option { background:#0b1120; color:#f1f5f9; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#818cf8",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Course Management
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9" }}>
              {view === "create"
                ? t("instructorCourses.createNewCourse")
                : t("instructorCourses.yourCourses")}
            </h2>
          </div>
          {view === "list" ? (
            <button
              onClick={() => {
                loadSavedDraft();
                setView("create");
                closeEdit();
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(124,58,237,.3)",
                whiteSpace: "nowrap",
              }}
            >
              + New Course
            </button>
          ) : (
            <button
              onClick={() => setView("list")}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "1px solid #334155",
                background: "transparent",
                color: "#94a3b8",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ← Back to Courses
            </button>
          )}
        </div>

        {/* Create view */}
        {view === "create" && (
          <div
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 18,
              padding: 28,
              animation: "slideDown 0.3s ease",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: 4,
                background: "#0b1120",
                border: "1px solid #1e293b",
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              {[
                { key: "single", label: "Single Course" },
                { key: "bulk", label: "Bulk Upload (Whole Class)" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setCreateMode(opt.key)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 9,
                    border: "none",
                    background:
                      createMode === opt.key
                        ? "linear-gradient(135deg,#7c3aed,#06b6d4)"
                        : "transparent",
                    color: createMode === opt.key ? "#fff" : "#94a3b8",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {createMode === "single" ? (
              <CourseForm
                form={createForm}
                setForm={setCreateForm}
                onSave={handleCreate}
                onCancel={() => setView("list")}
                saving={saving}
                mode="create"
                showToast={showToast}
              />
            ) : (
              <BulkCourseForm
                form={bulkForm}
                setForm={setBulkForm}
                onSave={handleBulkCreate}
                onCancel={() => setView("list")}
                saving={saving}
                showToast={showToast}
              />
            )}
          </div>
        )}

        {/* List view */}
        {view === "list" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
                gap: 12,
              }}
            >
              {[
                { label: "Total", value: counts.total, color: "#818cf8" },
                { label: "Pending", value: counts.pending, color: "#fbbf24" },
                { label: "Live", value: counts.approved, color: "#4ade80" },
                { label: "Rejected", value: counts.rejected, color: "#f87171" },
                { label: "Drafts", value: counts.draft, color: "#64748b" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "#111827",
                    border: "1px solid #1e293b",
                    borderRadius: 14,
                    padding: "16px 18px",
                  }}
                >
                  <div
                    style={{ fontSize: 26, fontWeight: 800, color: s.color }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses…"
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: "9px 14px",
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: 10,
                  color: "#f1f5f9",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              {[
                { key: "all", label: "All" },
                { key: "draft", label: "Draft" },
                { key: "pending", label: "In Review" },
                { key: "published", label: "Live" },
                { key: "rejected", label: "Rejected" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 20,
                    border: `1px solid ${filterStatus === key ? "#7c3aed" : "#1e293b"}`,
                    background:
                      filterStatus === key ? "#7c3aed" : "transparent",
                    color: filterStatus === key ? "#fff" : "#64748b",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <div
                style={{
                  background: "#2d0a0a",
                  border: "1px solid #7f1d1d",
                  borderRadius: 12,
                  padding: "12px 16px",
                  color: "#f87171",
                  fontSize: 13,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {loading && courses.length === 0 ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 80,
                    background: "#111827",
                    borderRadius: 16,
                    animation: "pulse 1.4s infinite",
                  }}
                />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ color: "#64748b", fontWeight: 600 }}>
                  {courses.length === 0
                    ? "No courses yet. Create your first one!"
                    : "No courses match your filter."}
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {filtered.map((course) => {
                  const st = statusStyle(course);
                  const isOpen = expandedId === course._id;
                  return (
                    <div
                      key={course._id}
                      style={{ animation: "fadeIn 0.25s ease" }}
                    >
                      <div
                        className="ic-row"
                        style={{
                          background: "#111827",
                          border: `1px solid ${isOpen ? "#7c3aed40" : "#1e293b"}`,
                          borderRadius: isOpen ? "18px 18px 0 0" : 18,
                          padding: "16px 20px",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          transition: "border-color 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 12,
                            background: "#1e293b",
                            flexShrink: 0,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                          }}
                        >
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            "📚"
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <p
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#f1f5f9",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "30ch",
                              }}
                            >
                              {course.title || "Untitled"}
                            </p>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 20,
                                background: st.bg,
                                color: st.text,
                                border: `1px solid ${st.border}`,
                                flexShrink: 0,
                              }}
                            >
                              {st.label}
                            </span>
                            {course.quiz?.questions?.length > 0 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 20,
                                  background: "#1e1b4b",
                                  color: "#818cf8",
                                  flexShrink: 0,
                                }}
                              >
                                📝 {course.quiz.questions.length}Q Quiz
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              marginTop: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            {course.category && (
                              <span style={{ fontSize: 11, color: "#64748b" }}>
                                {course.category}
                              </span>
                            )}
                            {course.board && (
                              <span style={{ fontSize: 11, color: "#64748b" }}>
                                📋 {course.board}
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              👥 {course.enrolledCount ?? 0}
                            </span>
                            {course.price > 0 && (
                              <span style={{ fontSize: 11, color: "#64748b" }}>
                                ₹{course.price}
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexShrink: 0,
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                          }}
                        >
                          {course.approvalStatus === "pending" && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#fbbf24",
                                padding: "6px 12px",
                                background: "#1c1a00",
                                borderRadius: 8,
                                border: "1px solid #854d0e",
                                fontWeight: 600,
                              }}
                            >
                              ⏳ In review
                            </span>
                          )}
                          {course.approvalStatus !== "pending" && (
                            <button
                              className="ic-btn"
                              onClick={() =>
                                isOpen ? closeEdit() : openEdit(course)
                              }
                              style={{
                                padding: "6px 14px",
                                borderRadius: 8,
                                border: `1px solid ${isOpen ? "#7c3aed" : "#334155"}`,
                                background: isOpen ? "#2e1065" : "transparent",
                                color: isOpen ? "#a78bfa" : "#e2e8f0",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                            >
                              {isOpen ? "✕ Close" : "Edit / Manage"}
                            </button>
                          )}
                          <button
                            className="ic-btn"
                            onClick={() => setDeleteId(course._id)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "1px solid #7f1d1d30",
                              background: "#2d0a0a",
                              color: "#f87171",
                              fontSize: 11,
                              cursor: "pointer",
                              transition: "opacity 0.15s",
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div
                          style={{
                            background: "#0f172a",
                            border: "1px solid #7c3aed40",
                            borderTop: "none",
                            borderRadius: "0 0 18px 18px",
                            padding: "24px 24px 28px",
                            animation: "slideDown 0.25s ease",
                          }}
                        >
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#a78bfa",
                              textTransform: "uppercase",
                              letterSpacing: "0.12em",
                              marginBottom: 16,
                            }}
                          >
                            ✏️ Editing: {course.title}
                          </p>

                          {course.approvalStatus === "rejected" &&
                            course.rejectionReason && (
                              <div
                                style={{
                                  background: "#2d0a0a",
                                  border: "1px solid #7f1d1d",
                                  borderRadius: 10,
                                  padding: "12px 16px",
                                  marginBottom: 16,
                                  display: "flex",
                                  gap: 12,
                                  alignItems: "flex-start",
                                }}
                              >
                                <span style={{ fontSize: 20, flexShrink: 0 }}>
                                  ❌
                                </span>
                                <div>
                                  <p
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "#f87171",
                                      marginBottom: 4,
                                    }}
                                  >
                                    Rejected by admin
                                  </p>
                                  <p
                                    style={{
                                      fontSize: 13,
                                      color: "#fca5a5",
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    {course.rejectionReason}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: 11,
                                      color: "#64748b",
                                      marginTop: 6,
                                    }}
                                  >
                                    Edit your course and click "Save & Submit
                                    for Review" to resubmit.
                                  </p>
                                </div>
                              </div>
                            )}

                          <CourseForm
                            form={editForm}
                            setForm={setEditForm}
                            onSave={handleEdit}
                            onCancel={closeEdit}
                            saving={saving}
                            mode="edit"
                            showToast={showToast}
                          />

                          <div
                            style={{
                              marginTop: 20,
                              paddingTop: 16,
                              borderTop: "1px solid #1e293b",
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit,minmax(110px,1fr))",
                              gap: 10,
                            }}
                          >
                            {[
                              {
                                label: "Enrolled",
                                value: course.enrolledCount ?? 0,
                              },
                              {
                                label: "Revenue",
                                value: `₹${course.revenue ?? 0}`,
                              },
                              {
                                label: "Rating",
                                value:
                                  course.ratingAverage > 0
                                    ? `${course.ratingAverage} ★`
                                    : "No ratings",
                              },
                              {
                                label: "Lessons",
                                value: course.lessons?.length ?? 0,
                              },
                            ].map((s) => (
                              <div
                                key={s.label}
                                style={{
                                  background: "#111827",
                                  borderRadius: 10,
                                  padding: "12px 14px",
                                  border: "1px solid #1e293b",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: "#f1f5f9",
                                  }}
                                >
                                  {s.value}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#64748b",
                                    marginTop: 2,
                                  }}
                                >
                                  {s.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#111827",
              border: "1px solid #334155",
              borderRadius: 20,
              padding: 28,
              maxWidth: 380,
              width: "100%",
              animation: "slideDown 0.25s ease",
            }}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#f1f5f9",
                marginBottom: 10,
              }}
            >
              Delete Course?
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "#94a3b8",
                lineHeight: 1.7,
                marginBottom: 22,
              }}
            >
              This will permanently remove the course and unenroll all students.
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: 11,
                  borderRadius: 10,
                  border: "1px solid #334155",
                  background: "transparent",
                  color: "#94a3b8",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                style={{
                  flex: 1,
                  padding: 11,
                  borderRadius: 10,
                  border: "none",
                  background: "#7f1d1d",
                  color: "#fca5a5",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
