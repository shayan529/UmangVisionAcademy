import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  bulkDeleteCourses,
  fetchAllCoursesAdmin,
} from "../../redux/slices/courseSlice";
import { updateSession } from "../../redux/slices/sessionSlice";
import { uploadFile } from "../../utils/uploadFile.js";
import ChapterManager from "../course/ChapterManager.jsx";
import api, { API_ENDPOINTS } from "../../config/api";
import {
  GraduationCap,
  Trophy,
  ImageIcon,
  Video,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  Loader2,
  FolderOpen,
  Link2,
  Trash2,
  Pencil,
  X,
  Package,
  FileQuestion,
  Users,
  User,
  ClipboardList,
  Clock,
  AlertTriangle,
  Inbox,
  ListChecks,
  Info,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Plus,
} from "lucide-react";

const EMPTY_FORM = {
  subject: "",
  courseType: "classes", // "classes" | "competitive"
  className: "",
  examName: "",
  board: "",
  language: "",
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
  instructor: "",
};

const EMPTY_BULK_ITEM = () => ({
  subject: "",
  description: "",
  content: "",
  lessons: [],
  notes: [],
  quiz: { title: "Subject Quiz", questions: [] },
});

// ── Class dropdown now Class 9–12 only ────────────────────────────────────────
const CLASSES = ["Class 9", "Class 10", "Class 11", "Class 12"];
const BOARDS = ["CBSE", "ICSE", "MP Board"];
const LANGUAGES = ["English", "Hindi"];
const DRAFT_STORAGE_KEY = "instructorCourseDraft";

// ── Bulk-upload specific constants ────────────────────────────────────────────
const BULK_CLASSES = ["Class 9", "Class 10", "Class 11", "Class 12"];

// Subject lists are board-specific — CBSE, ICSE (ICSE for Class 9-10 / ISC for
// Class 11-12), and MP Board (MPBSE) each prescribe a different subject set.
// Kept broad/superset per board+class since actual availability varies by school.
//
// Each board+class maps to an array of GROUPS (stream/category, e.g. "Science
// (PCM)", "Humanities", "Languages"). These render as <optgroup> submenus in
// the dropdown. Each subject inside a group can carry `optional: true`, which
// appends " (optional)" to its label — used for elective/additional subjects
// that aren't part of a stream's compulsory core.
const SUBJECTS_BY_BOARD = {
  CBSE: {
    "Class 9": [
      {
        group: "Core",
        subjects: [
          { name: "Mathematics" },
          { name: "Science" },
          { name: "Social Science" },
          { name: "English" },
          { name: "Hindi" },
        ],
      },
      {
        group: "Additional / Skill Subjects",
        subjects: [
          { name: "Sanskrit", optional: true },
          { name: "Computer Science", optional: true },
          { name: "Information Technology", optional: true },
          { name: "Artificial Intelligence", optional: true },
          { name: "Home Science", optional: true },
        ],
      },
    ],
    "Class 10": [
      {
        group: "Core",
        subjects: [
          { name: "Mathematics" },
          { name: "Science" },
          { name: "Social Science" },
          { name: "English" },
          { name: "Hindi" },
        ],
      },
      {
        group: "Additional / Skill Subjects",
        subjects: [
          { name: "Sanskrit", optional: true },
          { name: "Computer Science", optional: true },
          { name: "Information Technology", optional: true },
          { name: "Artificial Intelligence", optional: true },
          { name: "Home Science", optional: true },
        ],
      },
    ],
    "Class 11": [
      {
        group: "Science (PCM)",
        subjects: [
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Mathematics" },
          { name: "Computer Science", optional: true },
          { name: "Informatics Practices", optional: true },
          { name: "Physical Education", optional: true },
        ],
      },
      {
        group: "Science (PCB)",
        subjects: [
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Biology" },
          { name: "Computer Science", optional: true },
          { name: "Informatics Practices", optional: true },
          { name: "Physical Education", optional: true },
        ],
      },
      {
        group: "Commerce",
        subjects: [
          { name: "Accountancy" },
          { name: "Business Studies" },
          { name: "Economics" },
          { name: "Mathematics", optional: true },
          { name: "Informatics Practices", optional: true },
          { name: "Entrepreneurship", optional: true },
        ],
      },
      {
        group: "Humanities",
        subjects: [
          { name: "History" },
          { name: "Geography" },
          { name: "Political Science" },
          { name: "Psychology", optional: true },
          { name: "Sociology", optional: true },
          { name: "Legal Studies", optional: true },
          { name: "Entrepreneurship", optional: true },
          { name: "Fine Arts", optional: true },
          { name: "Home Science", optional: true },
        ],
      },
      {
        group: "Languages",
        subjects: [
          { name: "English" },
          { name: "Hindi" },
          { name: "Sanskrit", optional: true },
        ],
      },
    ],
    "Class 12": [
      {
        group: "Science (PCM)",
        subjects: [
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Mathematics" },
          { name: "Computer Science", optional: true },
          { name: "Informatics Practices", optional: true },
          { name: "Physical Education", optional: true },
        ],
      },
      {
        group: "Science (PCB)",
        subjects: [
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Biology" },
          { name: "Computer Science", optional: true },
          { name: "Informatics Practices", optional: true },
          { name: "Physical Education", optional: true },
        ],
      },
      {
        group: "Commerce",
        subjects: [
          { name: "Accountancy" },
          { name: "Business Studies" },
          { name: "Economics" },
          { name: "Mathematics", optional: true },
          { name: "Informatics Practices", optional: true },
          { name: "Entrepreneurship", optional: true },
        ],
      },
      {
        group: "Humanities",
        subjects: [
          { name: "History" },
          { name: "Geography" },
          { name: "Political Science" },
          { name: "Psychology", optional: true },
          { name: "Sociology", optional: true },
          { name: "Legal Studies", optional: true },
          { name: "Entrepreneurship", optional: true },
          { name: "Fine Arts", optional: true },
          { name: "Home Science", optional: true },
        ],
      },
      {
        group: "Languages",
        subjects: [
          { name: "English" },
          { name: "Hindi" },
          { name: "Sanskrit", optional: true },
        ],
      },
    ],
  },
  ICSE: {
    "Class 9": [
      {
        group: "Group I (Compulsory)",
        subjects: [
          { name: "English" },
          { name: "Second Language (Hindi/Regional)" },
          { name: "History & Civics" },
          { name: "Geography" },
          { name: "Mathematics" },
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Biology" },
        ],
      },
      {
        group: "Group II (choose 2)",
        subjects: [
          { name: "Economics", optional: true },
          { name: "Commercial Studies", optional: true },
          { name: "Computer Applications", optional: true },
          { name: "Environmental Science", optional: true },
        ],
      },
      {
        group: "Group III (choose 1)",
        subjects: [
          { name: "Physical Education", optional: true },
          { name: "Home Science", optional: true },
          { name: "Art", optional: true },
        ],
      },
    ],
    "Class 10": [
      {
        group: "Group I (Compulsory)",
        subjects: [
          { name: "English" },
          { name: "Second Language (Hindi/Regional)" },
          { name: "History & Civics" },
          { name: "Geography" },
          { name: "Mathematics" },
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Biology" },
        ],
      },
      {
        group: "Group II (choose 2)",
        subjects: [
          { name: "Economics", optional: true },
          { name: "Commercial Studies", optional: true },
          { name: "Computer Applications", optional: true },
          { name: "Environmental Science", optional: true },
        ],
      },
      {
        group: "Group III (choose 1)",
        subjects: [
          { name: "Physical Education", optional: true },
          { name: "Home Science", optional: true },
          { name: "Art", optional: true },
        ],
      },
    ],
    // ISC (Class 11-12)
    "Class 11": [
      {
        group: "Science",
        subjects: [
          { name: "English" },
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Biology" },
          { name: "Mathematics" },
          { name: "Computer Science", optional: true },
        ],
      },
      {
        group: "Commerce",
        subjects: [
          { name: "English" },
          { name: "Accounts" },
          { name: "Commerce" },
          { name: "Economics" },
          { name: "Business Studies", optional: true },
        ],
      },
      {
        group: "Humanities",
        subjects: [
          { name: "English" },
          { name: "History" },
          { name: "Political Science" },
          { name: "Geography" },
          { name: "Psychology", optional: true },
          { name: "Sociology", optional: true },
          { name: "Legal Studies", optional: true },
        ],
      },
      {
        group: "Optional / Additional",
        subjects: [
          { name: "Home Science", optional: true },
          { name: "Physical Education", optional: true },
          { name: "Environmental Science", optional: true },
          { name: "Art", optional: true },
          { name: "Hindi", optional: true },
        ],
      },
    ],
    "Class 12": [
      {
        group: "Science",
        subjects: [
          { name: "English" },
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Biology" },
          { name: "Mathematics" },
          { name: "Computer Science", optional: true },
        ],
      },
      {
        group: "Commerce",
        subjects: [
          { name: "English" },
          { name: "Accounts" },
          { name: "Commerce" },
          { name: "Economics" },
          { name: "Business Studies", optional: true },
        ],
      },
      {
        group: "Humanities",
        subjects: [
          { name: "English" },
          { name: "History" },
          { name: "Political Science" },
          { name: "Geography" },
          { name: "Psychology", optional: true },
          { name: "Sociology", optional: true },
          { name: "Legal Studies", optional: true },
        ],
      },
      {
        group: "Optional / Additional",
        subjects: [
          { name: "Home Science", optional: true },
          { name: "Physical Education", optional: true },
          { name: "Environmental Science", optional: true },
          { name: "Art", optional: true },
          { name: "Hindi", optional: true },
        ],
      },
    ],
  },
  "MP Board": {
    "Class 9": [
      {
        group: "Core",
        subjects: [
          { name: "Mathematics" },
          { name: "Science" },
          { name: "Social Science" },
          { name: "English" },
          { name: "Hindi" },
        ],
      },
      {
        group: "Additional / Skill Subjects",
        subjects: [
          { name: "Sanskrit", optional: true },
          { name: "Home Science", optional: true },
          { name: "Information Technology", optional: true },
        ],
      },
    ],
    "Class 10": [
      {
        group: "Core",
        subjects: [
          { name: "Mathematics" },
          { name: "Science" },
          { name: "Social Science" },
          { name: "English" },
          { name: "Hindi" },
        ],
      },
      {
        group: "Additional / Skill Subjects",
        subjects: [
          { name: "Sanskrit", optional: true },
          { name: "Home Science", optional: true },
          { name: "Information Technology", optional: true },
        ],
      },
    ],
    "Class 11": [
      {
        group: "Science (PCM)",
        subjects: [
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Mathematics" },
        ],
      },
      {
        group: "Science (PCB)",
        subjects: [
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Biology" },
        ],
      },
      {
        group: "Commerce",
        subjects: [
          { name: "Accountancy" },
          { name: "Business Studies" },
          { name: "Economics" },
        ],
      },
      {
        group: "Humanities",
        subjects: [
          { name: "History" },
          { name: "Political Science" },
          { name: "Geography" },
          { name: "Sociology", optional: true },
          { name: "Psychology", optional: true },
        ],
      },
      {
        group: "Languages",
        subjects: [
          { name: "English" },
          { name: "Hindi" },
          { name: "Sanskrit", optional: true },
        ],
      },
      {
        group: "Optional / Vocational",
        subjects: [
          { name: "Home Science", optional: true },
          { name: "Drawing and Designing", optional: true },
          { name: "Agriculture", optional: true },
          { name: "Physical Education", optional: true },
        ],
      },
    ],
    "Class 12": [
      {
        group: "Science (PCM)",
        subjects: [
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Mathematics" },
        ],
      },
      {
        group: "Science (PCB)",
        subjects: [
          { name: "Physics" },
          { name: "Chemistry" },
          { name: "Biology" },
        ],
      },
      {
        group: "Commerce",
        subjects: [
          { name: "Accountancy" },
          { name: "Business Studies" },
          { name: "Economics" },
        ],
      },
      {
        group: "Humanities",
        subjects: [
          { name: "History" },
          { name: "Political Science" },
          { name: "Geography" },
          { name: "Sociology", optional: true },
          { name: "Psychology", optional: true },
        ],
      },
      {
        group: "Languages",
        subjects: [
          { name: "English" },
          { name: "Hindi" },
          { name: "Sanskrit", optional: true },
        ],
      },
      {
        group: "Optional / Vocational",
        subjects: [
          { name: "Home Science", optional: true },
          { name: "Drawing and Designing", optional: true },
          { name: "Agriculture", optional: true },
          { name: "Physical Education", optional: true },
        ],
      },
    ],
  },
};

const getBranches = (board, className) => {
  if (className !== "Class 11" && className !== "Class 12") return [];
  if (board === "CBSE" || board === "MP Board") {
    return ["Science (PCM)", "Science (PCB)", "Commerce", "Humanities"];
  }
  if (board === "ICSE") {
    return ["Science", "Commerce", "Humanities"];
  }
  return [];
};

const inferBranchFromSubjects = (board, className, subjects = []) => {
  const branches = getBranches(board, className);
  if (branches.length === 0 || !subjects.length) return "";

  const branchCounts = {};
  for (const b of branches) {
    branchCounts[b] = 0;
    const branchGroup = (SUBJECTS_BY_BOARD[board]?.[className] ?? []).find((g) => g.group === b);
    const branchSubjects = new Set((branchGroup?.subjects ?? []).map((s) => s.name));
    for (const s of subjects) {
      if (branchSubjects.has(s)) {
        branchCounts[b]++;
      }
    }
  }

  let bestBranch = "";
  let maxCount = 0;
  for (const b of branches) {
    if (branchCounts[b] > maxCount) {
      maxCount = branchCounts[b];
      bestBranch = b;
    }
  }
  return bestBranch;
};

// Flattens SUBJECTS_BY_BOARD[board][className] into <optgroup>-ready option
// groups for the Sel component. `excludeSet` removes subjects already taken
// by another bulk item (except `currentValue`, which stays visible so the
// current selection doesn't disappear from its own dropdown).
const buildSubjectGroups = (board, className, excludeSet = new Set(), currentValue = "", branch = "") => {
  const allGroups = SUBJECTS_BY_BOARD[board]?.[className] ?? [];
  const branches = getBranches(board, className);

  let groups = allGroups;
  if (branches.length > 0 && branch) {
    groups = allGroups.filter((g) => g.group === branch || !branches.includes(g.group));
  }

  return groups
    .map((g) => ({
      group: g.group,
      options: g.subjects
        .filter((s) => !excludeSet.has(s.name) || s.name === currentValue)
        .map((s) => ({
          value: s.name,
          label: s.optional ? `${s.name} (optional)` : s.name,
        })),
    }))
    .filter((g) => g.options.length > 0);
};

// Flat list of every subject name for a board+class (used where a plain
// array is still needed, e.g. quick existence checks).
const flattenSubjects = (board, className) =>
  (SUBJECTS_BY_BOARD[board]?.[className] ?? []).flatMap((g) =>
    g.subjects.map((s) => s.name),
  );

const isDraftForm = (form) =>
  Boolean(
    form.subject?.trim() ||
    form.className?.trim() ||
    form.examName?.trim() ||
    form.board?.trim() ||
    form.description?.trim() ||
    form.content?.trim() ||
    form.thumbnailUrl?.trim() ||
    form.demoVideoUrl?.trim() ||
    (Array.isArray(form.lessons) && form.lessons.length > 0) ||
    Number(form.price) > 0,
  );

// Returns the index of the first lesson missing a non-empty title, or null if all lessons are OK.
const findMissingLessonTitle = (lessons = []) => {
  const idx = lessons.findIndex((l) => !l?.title?.trim());
  return idx === -1 ? null : idx;
};

// A course was created via bulk upload if any lesson/note carries a
// per-subject tag, or it has subject-level quizzes, subjectDetails, or bundle summary/title.
const isBulkCourse = (course) =>
  Boolean(
    (course.lessons ?? []).some((l) => l.subject) ||
    (course.notes ?? []).some((n) => n.subject) ||
    (course.subjectQuizzes ?? []).length > 0 ||
    (course.subjectDetails ?? []).length > 0 ||
    (course.title && /bundle/i.test(course.title)) ||
    (course.summary && /bundle/i.test(course.summary))
  );

// Reconstructs BulkCourseForm's `items` shape from a saved bulk course.
const norm = (s) => (s ?? "").trim().toLowerCase();

// Reconstructs BulkCourseForm's `items` shape from a saved bulk course.
const groupBulkCourseIntoItems = (course) => {
  const subjectSet = new Set([
    ...(course.lessons ?? []).map((l) => l.subject).filter(Boolean),
    ...(course.notes ?? []).map((n) => n.subject).filter(Boolean),
    ...(course.subjectQuizzes ?? []).map((q) => q.subject).filter(Boolean),
    ...(course.subjectDetails ?? []).map((d) => d.subject).filter(Boolean),
  ]);

  if (subjectSet.size === 0 && course.summary && /bundle/i.test(course.summary)) {
    const cleanSummary = course.summary.replace(/complete bundle/i, "").trim();
    cleanSummary.split(",").map((s) => s.trim()).filter(Boolean).forEach((s) => subjectSet.add(s));
  }

  const detailsMap = new Map(
    (course.subjectDetails ?? []).map((d) => [norm(d.subject), d]),
  );

  return Array.from(subjectSet).map((subject) => {
    const quiz = (course.subjectQuizzes ?? []).find(
      (q) => norm(q.subject) === norm(subject),
    );
    const details = detailsMap.get(norm(subject));
    return {
      subject,
      description: details?.description ?? "",
      content: details?.content ?? "",
      lessons: (course.lessons ?? []).filter(
        (l) => norm(l.subject) === norm(subject),
      ),
      notes: (course.notes ?? []).filter(
        (n) => norm(n.subject) === norm(subject),
      ),
      quiz: quiz
        ? { title: quiz.title || "Subject Quiz", questions: quiz.questions || [] }
        : { title: "Subject Quiz", questions: [] },
    };
  });
};

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
      const data = await uploadFile({
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
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, color: "#64748b" }}>{icon}</div>
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
            <p style={{ fontSize: 13, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Uploading… {progress}%
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
            <CheckCircle2 size={17} color="#4ade80" />
            <p style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>
              {isImage ? "Image" : "Video"} uploaded
            </p>
          </div>
        )}
        {status === "error" && (
          <p style={{ fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 6 }}>
            <XCircle size={14} /> {errMsg}
          </p>
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
        color: "#ffffff",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      {label}
      {hint && (
        <span
          style={{
            color: "#e2e8f0",
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
// Sel supports two option shapes:
//  - flat:    [{ value, label }, ...]              -> plain <option> list
//  - grouped: [{ group, options: [{value,label}] }] -> rendered as <optgroup>
// The two can be mixed in one array (e.g. a leading "Select…" placeholder
// item alongside grouped subject options).
const Sel = ({ value, onChange, options }) => {
  const isGrouped = options.some((o) => Array.isArray(o.options));
  return (
    <select
      value={value}
      onChange={onChange}
      style={iStyle}
      onFocus={focus}
      onBlur={blur}
    >
      {isGrouped
        ? options.map((o, i) =>
          Array.isArray(o.options) ? (
            <optgroup
              key={o.group ?? i}
              label={o.group}
              style={{ background: "#0b1120", color: "#94a3b8" }}
            >
              {o.options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  style={{ background: "#0b1120" }}
                >
                  {opt.label ?? opt.value}
                </option>
              ))}
            </optgroup>
          ) : (
            <option
              key={o.value ?? o}
              value={o.value ?? o}
              style={{ background: "#0b1120" }}
            >
              {o.label ?? o}
            </option>
          ),
        )
        : options.map((o) => (
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
};

// ── AI Course Text Generator Hook & UI Components ───────────────────────────
const useCourseTextGenerator = ({ showToast } = {}) => {
  const [loading, setLoading] = useState(false);

  const generateCourseText = async ({
    subject,
    className,
    board,
    examName,
    language,
    type,
  }) => {
    if (!subject?.trim()) {
      showToast?.("Please enter a subject name first to generate details with AI.");
      return null;
    }
    setLoading(true);
    try {
      const { data } = await api.post(API_ENDPOINTS.AI.GENERATE_COURSE_TEXT, {
        subject,
        className,
        board,
        examName,
        language,
        type,
      });
      return data;
    } catch (err) {
      console.error("AI course text generation failed:", err);
      showToast?.(
        err.response?.data?.message ||
        err.message ||
        "Failed to generate course text with AI."
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, generateCourseText };
};

const AIGenerateButton = ({
  loading,
  onClick,
  children = "Generate with AI",
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background:
        "linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(219, 39, 119, 0.25))",
      border: "1px solid rgba(192, 132, 252, 0.4)",
      color: "#f3e8ff",
      borderRadius: 8,
      padding: "6px 12px",
      fontSize: 12,
      fontWeight: 600,
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.7 : 1,
      transition: "all 0.2s ease",
    }}
  >
    {loading ? (
      <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
    ) : (
      <Sparkles size={13} style={{ color: "#c084fc" }} />
    )}
    {loading ? "Generating…" : children}
  </button>
);

const AITextGeneratorPanel = ({ loading, onGenerate, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <AIGenerateButton loading={loading} onClick={onGenerate}>
        Generate with AI
      </AIGenerateButton>
    </div>
    {children}
  </div>
);

// ── CourseTypeSelector (circular toggle: Classes vs Competitive Exam) ────────
const CourseTypeSelector = ({ value, onChange }) => {
  const options = [
    { key: "classes", label: "Classes", icon: <GraduationCap size={22} /> },
    { key: "competitive", label: "Competitive Exam", icon: <Trophy size={22} /> },
  ];
  return (
    <div style={{ display: "flex", gap: 28 }}>
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: `2px solid ${selected ? "#7c3aed" : "#334155"}`,
                background: selected
                  ? "linear-gradient(135deg,#7c3aed,#06b6d4)"
                  : "#0b1120",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: selected ? "#fff" : "#64748b",
                transition: "all 0.2s ease",
                boxShadow: selected
                  ? "0 4px 14px rgba(124,58,237,.35)"
                  : "none",
              }}
            >
              {opt.icon}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: selected ? "#e2e8f0" : "#64748b",
                whiteSpace: "nowrap",
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ── NotesManager ─────────────────────────────────────────────────────────────
// instanceId makes the file-input id unique so multiple NotesManagers on the
// same page (e.g. BulkCourseForm) don't share the same label→input binding.
let _notesManagerCounter = 0;

function NotesManager({ notes = [], onChange, showToast }) {
  const [instanceId] = useState(() => ++_notesManagerCounter);
  const fileInputId = `note-file-input-${instanceId}`;
  const fileInputRef = useRef(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", description: "", fileUrl: "", fileName: "" });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.name?.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setUploadError("Only PDF files are allowed for notes.");
      showToast?.("Only PDF files are allowed for notes.");
      return;
    }

    // Reset the input so the same file can be re-selected after a remove
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(true);
    setProgress(0);
    setUploadError("");
    try {
      const data = await uploadFile({
        file,
        folder: "Umang Vision Academy/notes",
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || progressEvent.event?.total;
          if (total) {
            setProgress(Math.round((progressEvent.loaded * 100) / total));
          }
        },
      });
      setNewNote((prev) => ({ ...prev, fileUrl: data.url, fileName: file.name }));
      showToast?.("File uploaded successfully.");
    } catch (err) {
      console.error("Note file upload error:", err);
      const msg = err.response?.data?.message || err.message || "Upload failed.";
      setUploadError(msg);
      showToast?.(`File upload failed: ${msg}`);
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
    const { fileName, ...noteData } = newNote;
    const updated = [...notes, { ...noteData, status: "pending", _id: new Date().getTime().toString() }];
    onChange(updated);
    setNewNote({ title: "", description: "", fileUrl: "", fileName: "" });
    setUploadError("");
    setShowAddForm(false);
  };

  const handleRemoveNote = (idx) => {
    const updated = notes.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "clamp(12px, 3vw, 16px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Subject Study Notes</h4>
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Upload documents & PDFs for this course.</p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <FileText size={13} /> Add Note
          </button>
        )}
      </div>

      {showAddForm && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, border: "1px dashed #334155", borderRadius: 8, padding: 12, background: "#0b1120" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#ffffff", display: "block", marginBottom: 4 }}>Note Title *</label>
            <input
              type="text"
              value={newNote.title}
              onChange={(e) => setNewNote((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Chapter 1 Formula Sheet"
              style={{ padding: "8px 12px", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", fontSize: 12, width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#ffffff", display: "block", marginBottom: 4 }}>Description (optional)</label>
            <textarea
              value={newNote.description}
              onChange={(e) => setNewNote((p) => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Contains all core equations for Algebra chapter."
              rows={2}
              style={{ padding: "8px 12px", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", fontSize: 12, width: "100%", boxSizing: "border-box", resize: "none" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#ffffff", display: "block", marginBottom: 4 }}>File Upload * (PDF Only)</label>
            {newNote.fileUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#111827", padding: "8px 12px", borderRadius: 8, border: "1px solid #16a34a" }}>
                <FileText size={15} color="#4ade80" />
                <span style={{ fontSize: 12, color: "#4ade80", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {newNote.fileName || newNote.fileUrl}
                </span>
                <button
                  type="button"
                  onClick={() => setNewNote((p) => ({ ...p, fileUrl: "", fileName: "" }))}
                  style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  id={fileInputId}
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor={fileInputId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px",
                    background: "#111827",
                    border: `1px dashed ${uploadError ? "#ef4444" : "#334155"}`,
                    borderRadius: 8,
                    color: uploadError ? "#f87171" : "#94a3b8",
                    fontSize: 12,
                    cursor: uploading ? "not-allowed" : "pointer",
                    pointerEvents: uploading ? "none" : "auto",
                    textAlign: "center",
                    userSelect: "none",
                  }}
                >
                  {uploading ? (
                    <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Uploading… {progress}%</>
                  ) : uploadError ? (
                    <><XCircle size={13} /> {uploadError} — click to retry</>
                  ) : (
                    <><FolderOpen size={13} /> Choose File to Upload</>
                  )}
                </label>
                {uploading && (
                  <div style={{ marginTop: 6, height: 4, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#7c3aed,#06b6d4)", borderRadius: 4, transition: "width 0.2s" }} />
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewNote({ title: "", description: "", fileUrl: "", fileName: "" });
                setUploadError("");
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{note.title}</p>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: 20,
                      ...(note.status === "approved"
                        ? { background: "#052e16", color: "#4ade80", border: "1px solid #166534" }
                        : note.status === "rejected"
                          ? { background: "#2d0a0a", color: "#f87171", border: "1px solid #7f1d1d" }
                          : { background: "#1c1a00", color: "#fbbf24", border: "1px solid #854d0e" }),
                    }}
                  >
                    {note.status === "approved" ? "Approved" : note.status === "rejected" ? "Rejected" : "Pending approval"}
                  </span>
                </div>
                {note.status === "rejected" && note.rejectedReason && (
                  <p style={{ fontSize: 10, color: "#fca5a5", marginTop: 4 }}>Reason: {note.rejectedReason}</p>
                )}
                {note.description && (
                  <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{note.description}</p>
                )}

                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 10, color: "#818cf8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}
                >
                  <Link2 size={11} /> {note.fileName || note.fileUrl.split("/").pop() || note.fileUrl}
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
  courseClass,
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

  const handleGenerateWithAI = async () => {
    if (!courseTitle?.trim() || !courseDescription?.trim()) {
      showToast?.("Add a Subject and Description before generating with AI.");
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await api.post("/ai/generate-quiz", {
        title: courseTitle,
        summary: courseDescription,
        className: courseClass,
      });

      const aiQuestions = Array.isArray(data.quiz?.questions)
        ? data.quiz.questions
        : Array.isArray(data.quiz)
          ? data.quiz
          : Array.isArray(data.questions)
            ? data.questions
            : [];
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
      showToast?.(
        err.response?.data?.message || err.message || "AI quiz generation failed.",
      );
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
        className="qm-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "#111827",
          borderBottom: "1px solid #1e293b",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <FileQuestion size={16} color="#818cf8" style={{ flexShrink: 0 }} />
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
              whiteSpace: "nowrap",
            }}
          >
            {questions.length} question{questions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={handleGenerateWithAI}
          disabled={aiLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
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
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {aiLoading ? (
            <>
              <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={12} /> Generate with AI
            </>
          )}
        </button>
      </div>
      <div className="qm-body" style={{ display: "flex", minHeight: questions.length ? 320 : 120 }}>
        {questions.length > 0 && (
          <div
            className="qm-sidebar"
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
        <div style={{ flex: 1, padding: "clamp(10px, 2.5vw, 16px)", overflowY: "auto", minWidth: 0 }}>
          {questions.length === 0 ? (
            <div
              style={{
                height: "100%",
                minHeight: 120,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "#475569",
                padding: "16px 8px",
                textAlign: "center",
              }}
            >
              <ListChecks size={26} />
              <p style={{ fontSize: 13 }}>No questions yet</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
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
                    whiteSpace: "nowrap",
                  }}
                >
                  + Add Question
                </button>
                <button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={aiLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: aiLoading ? 0.5 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Sparkles size={13} /> Generate with AI
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
                          width: "100%",
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
                            width: 18,
                            height: 18,
                            accentColor: "#4ade80",
                            flexShrink: 0,
                            cursor: "pointer",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#64748b",
                            width: 14,
                            flexShrink: 0,
                            textAlign: "center",
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
                            flex: 1,
                            minWidth: 0,
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
                minHeight: 120,
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
  const [isCollapsed, setIsCollapsed] = useState(false);


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
        onClick={() => setIsCollapsed((c) => !c)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              color: "#64748b",
              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ▼
          </span>
          <Award size={17} color="#c4b5fd" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
              Course Certificate
            </div>
            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.3 }}>
              Award a customized certificate to students who complete this
              course
            </div>
          </div>
        </div>
        <label
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            display: "inline-block",
            width: 44,
            height: 22,
            cursor: "pointer",
            flexShrink: 0,
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

      {!isCollapsed && enabled && (
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
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}
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
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}
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
                  <Award size={22} color={at.accent} style={{ opacity: 0.9 }} />
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
                      }}
                    >
                      <GraduationCap size={14} color={at.accent} />
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
// ── RecordedSessionsManager ───────────────────────────────────────────────────
// Shows all ended sessions assigned to this course and lets the instructor/admin
// edit the recording URL for each one. The URL is saved both on the Session
// document AND propagated to the matching lesson inside this course.
const RecordedSessionsManager = ({ courseId, showToast }) => {
  const dispatch = useDispatch();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editUrl, setEditUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    setLoading(true);
    api.get(`/sessions?courseId=${courseId}`)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setSessions(list.filter((s) => s.status === "ended"));
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (!courseId) return null;

  const handleSave = async (session) => {
    if (editUrl && !/^https?:\/\/.+/i.test(editUrl)) {
      showToast("Recording URL must start with http:// or https://");
      return;
    }
    setSaving(true);
    try {
      await dispatch(updateSession({
        id: session._id,
        sessionData: { recordedUrl: editUrl.trim() || null },
      })).unwrap();
      setSessions((prev) =>
        prev.map((s) => s._id === session._id ? { ...s, recordedUrl: editUrl.trim() || null } : s)
      );
      setEditingId(null);
      setEditUrl("");
      showToast("Recording URL updated");
    } catch (e) {
      showToast("Failed to update: " + (e?.message || "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    flex: 1,
    padding: "8px 12px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#f8fafc",
    fontSize: 13,
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Video size={16} color="#a78bfa" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
          Recorded Live Sessions
        </span>
        <span style={{ fontSize: 11, color: "#64748b", marginLeft: 4 }}>
          (ended sessions assigned to this course)
        </span>
      </div>

      {loading && (
        <p style={{ fontSize: 12, color: "#64748b" }}>Loading sessions…</p>
      )}

      {!loading && sessions.length === 0 && (
        <div style={{
          padding: "14px 16px",
          borderRadius: 10,
          background: "#0f172a",
          border: "1px dashed #1e293b",
          fontSize: 12,
          color: "#475569",
          textAlign: "center",
        }}>
          No ended sessions are linked to this course yet. Assign a session to this course
          and end it to auto-add a recording here.
        </div>
      )}

      {!loading && sessions.map((s) => (
        <div
          key={s._id}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: "#111a2e",
            border: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {/* Session title + date row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#94a3b8", display: "inline-block", flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{s.title}</span>
              {s.courseSubject && (
                <span style={{
                  fontSize: 11, color: "#34d399", background: "rgba(52,211,153,0.1)",
                  padding: "2px 7px", borderRadius: 5, fontWeight: 600,
                }}>
                  {s.courseSubject}
                </span>
              )}
            </div>
            <span style={{ fontSize: 11, color: "#475569" }}>{s.date}</span>
          </div>

          {/* Recording status / URL */}
          {editingId === s._id ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="url"
                placeholder="https://youtube.com/... or drive link"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                style={inputStyle}
                autoFocus
              />
              <button
                onClick={() => handleSave(s)}
                disabled={saving}
                style={{
                  padding: "8px 14px", borderRadius: 8, border: "none",
                  background: "#7c3aed", color: "#fff", fontWeight: 700,
                  fontSize: 12, cursor: "pointer", opacity: saving ? 0.6 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setEditingId(null); setEditUrl(""); }}
                style={{
                  padding: "8px 12px", borderRadius: 8,
                  border: "1px solid #334155", background: "transparent",
                  color: "#94a3b8", fontWeight: 600, fontSize: 12, cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {s.recordedUrl ? (
                <>
                  <a
                    href={s.recordedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 12, color: "#38bdf8", display: "flex",
                      alignItems: "center", gap: 4, textDecoration: "none",
                      flex: 1, minWidth: 0, overflow: "hidden",
                    }}
                  >
                    <Link2 size={12} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.recordedUrl}
                    </span>
                  </a>
                  {s.recordedLessonAdded && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: "#4ade80",
                      background: "rgba(74,222,128,0.1)", padding: "2px 7px",
                      borderRadius: 5, whiteSpace: "nowrap",
                    }}>
                      ✓ In course
                    </span>
                  )}
                </>
              ) : (
                <span style={{ fontSize: 12, color: "#475569", fontStyle: "italic" }}>
                  No recording URL yet
                </span>
              )}
              <button
                onClick={() => { setEditingId(s._id); setEditUrl(s.recordedUrl || ""); }}
                style={{
                  padding: "5px 10px", borderRadius: 7,
                  border: "1px solid #334155", background: "transparent",
                  color: "#94a3b8", fontWeight: 600, fontSize: 11,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  whiteSpace: "nowrap",
                }}
              >
                <Pencil size={11} />
                {s.recordedUrl ? "Edit" : "Add URL"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── FormStepper ───────────────────────────────────────────────────────────────
// A compact horizontal progress stepper used to break long course forms into
// digestible stages. `steps` is [{ key, label, icon, complete }]. Clicking a
// step (or the header progress bar) jumps directly to it — nothing is ever
// locked, so an instructor can always jump ahead or back to fix something.
const FormStepper = ({ steps, activeKey, onSelect }) => {
  const activeIdx = steps.findIndex((s) => s.key === activeKey);
  const doneCount = steps.filter((s) => s.complete).length;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 16px",
        background: "#0b1120",
        border: "1px solid #1e293b",
        borderRadius: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Step {activeIdx + 1} of {steps.length}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
          {doneCount}/{steps.length} sections ready
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
          gap: 6,
        }}
      >
        {steps.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onSelect(s.key)}
            title={s.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 2px 0",
            }}
          >
            <div
              style={{
                width: "100%",
                height: 5,
                borderRadius: 3,
                background:
                  i <= activeIdx
                    ? "linear-gradient(90deg,#7c3aed,#06b6d4)"
                    : "#1e293b",
                transition: "background 0.2s",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {s.complete ? (
                <CheckCircle2 size={12} color="#4ade80" style={{ flexShrink: 0 }} />
              ) : (
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: `1.5px solid ${s.key === activeKey ? "#a78bfa" : "#334155"}`,
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: s.key === activeKey ? 700 : 600,
                  color: s.key === activeKey ? "#e2e8f0" : "#64748b",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {s.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// A sticky action bar so Save/Submit controls stay reachable without
// scrolling through the entire (often long) course form.
const StickyFormFooter = ({ children }) => (
  <div
    style={{
      position: "sticky",
      bottom: 0,
      marginLeft: -18,
      marginRight: -18,
      marginBottom: -18,
      padding: "14px 18px",
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      flexWrap: "wrap",
      background: "linear-gradient(180deg, rgba(15,23,42,0) 0%, #0f172a 28%)",
      backdropFilter: "blur(6px)",
      borderTop: "1px solid #1e293b",
      zIndex: 5,
    }}
  >
    {children}
  </div>
);

const ghostBtn = {
  padding: "10px 20px",
  borderRadius: 10,
  border: "1px solid #334155",
  background: "transparent",
  color: "#94a3b8",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  minHeight: 40,
};
const draftBtn = {
  padding: "10px 20px",
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#111827",
  color: "#e2e8f0",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  minHeight: 40,
};
const submitBtn = {
  padding: "10px 22px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  boxShadow: "0 4px 16px rgba(124,58,237,.3)",
  minHeight: 40,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

// ── CourseForm ────────────────────────────────────────────────────────────────
// Broken into wizard-style steps so instructors aren't confronted with one
// giant scrolling form. Every step stays reachable via the stepper at any
// time — nothing is gated — so people can jump around freely.
const CourseForm = ({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  mode,
  showToast,
  isAdmin = false,
  instructors = [],
}) => {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const courseType = form.courseType || "classes";
  const { loading: aiLoading, generateCourseText } = useCourseTextGenerator({ showToast });
  const [step, setStep] = useState("basics");

  const handleGenerate = async () => {
    const data = await generateCourseText({
      subject: form.subject,
      className: courseType === "classes" ? form.className : "",
      board: courseType === "classes" ? form.board : "",
      examName: courseType === "competitive" ? form.examName : "",
      language: form.language,
      type: courseType,
    });
    if (!data) return;
    setForm((f) => ({
      ...f,
      description: data.description || f.description,
      content: data.content || f.content,
    }));
  };

  const basicsComplete = Boolean(
    form.subject?.trim() &&
    (courseType === "classes" ? form.className && form.board : form.examName?.trim()),
  );
  const curriculumComplete = Boolean(
    form.description?.trim() && (form.lessons ?? []).length > 0,
  );
  const mediaComplete = Boolean(form.thumbnailUrl);
  const extrasComplete = Boolean(form.quiz?.questions?.length || form.certificate?.enabled);

  const steps = [
    { key: "basics", label: "Basics", complete: basicsComplete },
    { key: "curriculum", label: "Curriculum", complete: curriculumComplete },
    { key: "media", label: "Media & Notes", complete: mediaComplete },
    { key: "extras", label: "Quiz & Certificate", complete: extrasComplete },
    ...(mode === "edit" && form._id ? [{ key: "recordings", label: "Recordings", complete: true }] : []),
  ];
  const stepIdx = steps.findIndex((s) => s.key === step);
  const goNext = () => stepIdx < steps.length - 1 && setStep(steps[stepIdx + 1].key);
  const goBack = () => stepIdx > 0 && setStep(steps[stepIdx - 1].key);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <FormStepper steps={steps} activeKey={step} onSelect={setStep} />

      {step === "basics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.2s ease" }}>
          {isAdmin && instructors.length > 0 && (
            <Field label="Assign Instructor" hint="*">
              <Sel
                value={form.instructor || ""}
                onChange={set("instructor")}
                options={[
                  { value: "", label: "Select instructor" },
                  ...instructors.map((inst) => ({
                    value: inst._id,
                    label: inst.name || inst.email,
                  })),
                ]}
              />
            </Field>
          )}
          <Field label="Course Type" hint="* (choose one)">
            <CourseTypeSelector
              value={courseType}
              onChange={(type) =>
                setForm((f) => ({
                  ...f,
                  courseType: type,
                  // clear the field that no longer applies
                  className: type === "competitive" ? "" : f.className,
                  examName: type === "classes" ? "" : f.examName,
                  board: type === "competitive" ? "" : f.board,
                }))
              }
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            <Field label="Subject" hint="*">
              <Input
                value={form.subject}
                onChange={set("subject")}
                placeholder="e.g. Mathematics"
              />
            </Field>
            {courseType === "classes" ? (
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
            ) : (
              <Field label="Exam Name" hint="*">
                <Input
                  value={form.examName}
                  onChange={set("examName")}
                  placeholder="e.g. JEE Main, NEET, CUET"
                />
              </Field>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {courseType === "classes" ? (
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
            ) : null}
            <Field label="Price" hint="(₹ — 0 for free)">
              <Input
                value={form.price}
                onChange={set("price")}
                placeholder="0"
                type="number"
              />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            <Field label="Language" hint="">
              <Sel
                value={form.language || ""}
                onChange={set("language")}
                options={[
                  { value: "", label: "Multilanguage (Default)" },
                  ...LANGUAGES.map((l) => ({ value: l, label: l })),
                ]}
              />
            </Field>
          </div>
        </div>
      )}

      {step === "curriculum" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.2s ease" }}>
          <ChapterManager
            key={form._id || form.subject || "course-chapter-mgr"}
            lessons={form.lessons ?? []}
            onChange={(lessons) => setForm((f) => ({ ...f, lessons }))}
            courseSubject={form.subject}
            courseDescription={form.description}
          />
          <Field label="Description" hint="* (course summary)">
            <AITextGeneratorPanel loading={aiLoading} onGenerate={handleGenerate}>
              <Textarea
                value={form.description}
                onChange={set("description")}
                placeholder="Brief description"
                rows={3}
              />
            </AITextGeneratorPanel>
          </Field>
          <Field label="Subject Content" hint="(chapters, topics)">
            <Textarea
              value={form.content}
              onChange={set("content")}
              placeholder={"Chapter 1: Algebra\nChapter 2: Geometry"}
              rows={5}
            />
          </Field>
        </div>
      )}

      {step === "media" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.2s ease" }}>
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
              icon={<ImageIcon size={22} />}
              currentUrl={form.thumbnailUrl}
              onUploaded={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))}
            />
            <FileUploader
              label="Demo Video"
              hint="MP4, WEBM — max 200 MB"
              accept="video/mp4,video/webm,video/quicktime"
              folder="Umang Vision Academy/demos"
              icon={<Video size={22} />}
              currentUrl={form.demoVideoUrl}
              onUploaded={(url) => setForm((f) => ({ ...f, demoVideoUrl: url }))}
            />
          </div>
          <NotesManager
            notes={form.notes ?? []}
            onChange={(notes) => setForm((f) => ({ ...f, notes }))}
            showToast={showToast}
          />
        </div>
      )}

      {step === "extras" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.2s ease" }}>
          <CertificateManager
            certificate={form.certificate}
            onChange={(certificate) => setForm((f) => ({ ...f, certificate }))}
            courseTitle={form.subject}
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
              courseClass={courseType === "classes" ? form.className : form.examName}
              showToast={showToast}
            />
          </Field>
        </div>
      )}

      {step === "recordings" && mode === "edit" && form._id && (
        <div
          style={{
            padding: "16px 18px",
            borderRadius: 12,
            background: "#0f172a",
            border: "1px solid #1e293b",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <RecordedSessionsManager courseId={form._id} showToast={showToast} />
        </div>
      )}

      <StickyFormFooter>
        <button onClick={onCancel} style={ghostBtn}>
          Cancel
        </button>
        {stepIdx > 0 && (
          <button onClick={goBack} style={{ ...draftBtn, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ChevronLeft size={14} /> Back
          </button>
        )}
        {stepIdx < steps.length - 1 ? (
          <button onClick={goNext} style={{ ...submitBtn }}>
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <>
            <button onClick={() => onSave(false)} disabled={saving} style={{ ...draftBtn, opacity: saving ? 0.6 : 1 }}>
              Save as Draft
            </button>
            <button onClick={() => onSave(true)} disabled={saving} style={{ ...submitBtn, opacity: saving ? 0.6 : 1 }}>
              {saving && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
              {saving
                ? "Saving…"
                : mode === "create"
                  ? "Submit for Review"
                  : "Save & Submit for Review"}
            </button>
          </>
        )}
      </StickyFormFooter>
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
  isAdmin = false,
  instructors = [],
}) => {
  const setMeta = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [collapsedItems, setCollapsedItems] = useState({});
  const { loading: aiLoading, generateCourseText } = useCourseTextGenerator({ showToast });
  const toggleCollapse = (idx) =>
    setCollapsedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));

  // When class or board changes, reset all item subjects so stale subjects
  // (from a different board's/class's subject list) don't linger.
  const handleClassChange = (e) => {
    const newClass = e.target.value;
    setForm((f) => ({
      ...f,
      className: newClass,
      branch: "",
      items: f.items.map((it) => ({ ...it, subject: "" })),
    }));
  };

  const handleBoardChange = (e) => {
    const newBoard = e.target.value;
    setForm((f) => ({
      ...f,
      board: newBoard,
      branch: "",
      items: f.items.map((it) => ({ ...it, subject: "" })),
    }));
  };

  const handleBranchChange = (e) => {
    const newBranch = e.target.value;
    setForm((f) => ({
      ...f,
      branch: newBranch,
      items: f.items.map((it) => ({ ...it, subject: "" })),
    }));
  };

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

  const branches = getBranches(form.board, form.className);
  const hasBranches = branches.length > 0;

  const readyItems = form.items.filter(
    (it) => it.subject.trim() && it.description.trim() && it.content.trim(),
  ).length;
  const filledItems = form.items.filter((it) => it.subject.trim()).length;
  const metaComplete = Boolean(
    form.title?.trim() && form.className && form.board && (!hasBranches || form.branch),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Bundle progress summary ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 16px",
          background: "#0b1120",
          border: "1px solid #1e293b",
          borderRadius: 14,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 700,
            color: metaComplete ? "#4ade80" : "#94a3b8",
          }}
        >
          {metaComplete ? <CheckCircle2 size={14} /> : <Info size={14} />}
          Bundle details {metaComplete ? "complete" : "incomplete"}
        </div>
        <div style={{ width: 1, height: 16, background: "#1e293b" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
          <LayoutList size={14} color="#818cf8" />
          {filledItems} subject{filledItems !== 1 ? "s" : ""} added
        </div>
        <div style={{ width: 1, height: 16, background: "#1e293b" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: readyItems === form.items.length && readyItems > 0 ? "#4ade80" : "#94a3b8" }}>
          <ClipboardList size={14} />
          {readyItems}/{form.items.length} ready for review
        </div>
      </div>

      {isAdmin && instructors.length > 0 && (
        <Field label="Assign Instructor" hint="*">
          <Sel
            value={form.instructor || ""}
            onChange={setMeta("instructor")}
            options={[
              { value: "", label: "Select instructor" },
              ...instructors.map((inst) => ({
                value: inst._id,
                label: inst.name || inst.email,
              })),
            ]}
          />
        </Field>
      )}
      <Field label="Bundle Title" hint="* (e.g. Class 9 CBSE Complete Bundle)">
        <Input
          value={form.title}
          onChange={setMeta("title")}
          placeholder="Class 9 CBSE Complete Bundle"
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        <Field label="Class" hint="* (applies to all subjects below)">
          <Sel
            value={form.className}
            onChange={handleClassChange}
            options={[
              { value: "", label: "Select class" },
              ...BULK_CLASSES.map((c) => ({ value: c, label: c })),
            ]}
          />
        </Field>
        <Field label="Board" hint="* (applies to all subjects below)">
          <Sel
            value={form.board}
            onChange={handleBoardChange}
            options={[
              { value: "", label: "Select board" },
              ...BOARDS.map((b) => ({ value: b, label: b })),
            ]}
          />
        </Field>
        {hasBranches && (
          <Field label="Branch" hint="* (applies to all subjects below)">
            <Sel
              value={form.branch}
              onChange={handleBranchChange}
              options={[
                { value: "", label: "Select branch" },
                ...branches.map((b) => ({ value: b, label: b })),
              ]}
            />
          </Field>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        <Field label="Language" hint="(Optional)">
          <Sel
            value={form.language || ""}
            onChange={setMeta("language")}
            options={[
              { value: "", label: "Multilanguage (Default)" },
              ...LANGUAGES.map((l) => ({ value: l, label: l })),
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
          icon={<ImageIcon size={22} />}
          currentUrl={form.thumbnailUrl}
          onUploaded={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))}
        />
        <FileUploader
          label="Demo Video"
          hint="MP4, WEBM — shared by all courses in this batch"
          accept="video/mp4,video/webm,video/quicktime"
          folder="Umang Vision Academy/demos"
          icon={<Video size={22} />}
          currentUrl={form.demoVideoUrl}
          onUploaded={(url) => setForm((f) => ({ ...f, demoVideoUrl: url }))}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <Field label="Price" hint="(₹ — 0 for free)">
          <Input
            value={form.price}
            onChange={setMeta("price")}
            placeholder="0"
            type="number"
          />
        </Field>
        <CertificateManager
          certificate={form.certificate}
          onChange={(certificate) => setForm(f => ({ ...f, certificate }))}
          courseTitle={form.title || "Complete Bundle"}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
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
            Subjects ({form.items.length})
          </label>
          <button
            type="button"
            onClick={addItem}
            disabled={!form.className || !form.board || (hasBranches && !form.branch)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px dashed #334155",
              background: "transparent",
              color: form.className && form.board && (!hasBranches || form.branch) ? "#818cf8" : "#334155",
              fontSize: 12,
              fontWeight: 600,
              cursor: form.className && form.board && (!hasBranches || form.branch) ? "pointer" : "not-allowed",
            }}
          >
            + Add Subject
          </button>
        </div>

        {(!form.className || !form.board || (hasBranches && !form.branch)) && (
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
            <Info size={18} style={{ flexShrink: 0 }} />
            {!form.className || !form.board
              ? "Select a class and board above to see available subjects."
              : "Select a branch above to see available subjects."}
          </div>
        )}

        {form.items.map((item, idx) => {
          const taken = takenSubjects(idx);
          const subjectGroups = buildSubjectGroups(
            form.board,
            form.className,
            taken,
            item.subject,
            form.branch,
          );

          const isCollapsed = !!collapsedItems[idx];
          const itemReady = Boolean(item.subject.trim() && item.description.trim() && item.content.trim());

          return (
            <div
              key={idx}
              style={{
                border: `1px solid ${itemReady ? "#166534" : "#1e293b"}`,
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
                  flexWrap: "wrap",
                  gap: 8,
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
                  {itemReady ? (
                    <CheckCircle2 size={15} color="#4ade80" style={{ flexShrink: 0 }} />
                  ) : (
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: "50%",
                        border: "1.5px solid #334155",
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                  )}
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}
                  >
                    Subject {idx + 1}
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
                      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                      gap: 12,
                    }}
                  >
                    <Field label="Subject" hint="*">
                      {form.className && form.board && (!hasBranches || form.branch) ? (
                        <Sel
                          value={item.subject}
                          onChange={(e) =>
                            updateItem(idx, "subject", e.target.value)
                          }
                          options={[
                            { value: "", label: "Select subject" },
                            ...subjectGroups,
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
                          {!form.className || !form.board
                            ? "Select a class and board first"
                            : "Select a branch first"}
                        </div>
                      )}
                    </Field>
                  </div>

                  <ChapterManager
                    key={`bulk-subj-${item.subject || idx}`}
                    lessons={item.lessons ?? []}
                    onChange={(lessons) => updateItem(idx, "lessons", lessons)}
                    courseSubject={item.subject}
                    courseDescription={item.description}
                  />

                  <Field label="Description" hint="* (course summary)">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <AIGenerateButton
                          loading={aiLoading}
                          onClick={async () => {
                            const data = await generateCourseText({
                              subject: item.subject,
                              className: form.className,
                              board: form.board,
                              language: form.language,
                              type: "classes",
                            });
                            if (!data) return;
                            updateItem(idx, "description", data.description || item.description);
                            updateItem(idx, "content", data.content || item.content);
                          }}
                        >
                          Generate with AI
                        </AIGenerateButton>
                      </div>
                      <Textarea
                        value={item.description}
                        onChange={(e) =>
                          updateItem(idx, "description", e.target.value)
                        }
                        placeholder="Brief description"
                        rows={3}
                      />
                    </div>
                  </Field>
                  <Field label="Subject Content" hint="(chapters, topics)">
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
                    label="Subject Quiz"
                    hint="(optional — students take after completing all lessons in this subject)"
                  >
                    <QuizManager
                      quiz={item.quiz}
                      onChange={(quiz) => updateItem(idx, "quiz", quiz)}
                      courseTitle={item.subject}
                      courseDescription={item.description}
                      courseClass={form.className}
                      showToast={showToast}
                    />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <StickyFormFooter>
        <button onClick={onCancel} style={ghostBtn}>
          Cancel
        </button>
        <button onClick={() => onSave(false)} disabled={saving} style={{ ...draftBtn, opacity: saving ? 0.6 : 1 }}>
          Save All as Draft
        </button>
        <button onClick={() => onSave(true)} disabled={saving} style={{ ...submitBtn, opacity: saving ? 0.6 : 1 }}>
          {saving && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
          {saving
            ? "Submitting…"
            : `Submit All ${form.items.length} for Review`}
        </button>
      </StickyFormFooter>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function InstructorCourses({
  showToast,
  isAdmin = false,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  initialEditCourse = null,
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { courses = [], loading, error } = useSelector((s) => s.courses);

  const [view, setView] = useState("list");
  const [expandedId, setExpandedId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editBulkForm, setEditBulkForm] = useState(null);
  const [editMode, setEditMode] = useState("single"); // "single" | "bulk"
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
    title: "",
    className: "",
    board: "",
    branch: "",
    language: "",
    thumbnailUrl: "",
    demoVideoUrl: "",
    price: "",
    certificate: {
      enabled: false,
      title: "Certificate of Completion",
      signatoryName: "",
      signatoryTitle: "",
      theme: "purple",
    },
    items: [EMPTY_BULK_ITEM()],
    instructor: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState("");

  useEffect(() => {
    if (isAdmin) {
      api.get("/users?role=instructor")
        .then(({ data }) => {
          const raw = Array.isArray(data) ? data : (data.users ?? []);
          const instList = raw.filter((u) => u.role === "instructor");
          setInstructors(instList);
        })
        .catch((err) => console.error("Failed to load instructors", err));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchAllCoursesAdmin());
    } else {
      dispatch(fetchCourses());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    if (initialEditCourse && courses.length > 0) {
      const match = courses.find((c) => c._id === initialEditCourse._id) ?? initialEditCourse;
      openEdit(match);
    }
  }, [initialEditCourse, courses]);

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
      c.category?.toLowerCase().includes(q) ||
      (isAdmin && c.instructor?.name?.toLowerCase().includes(q));
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
    const matchInstructor =
      !selectedInstructorFilter ||
      c.instructor?._id === selectedInstructorFilter ||
      c.instructor === selectedInstructorFilter;
    return matchSearch && matchStatus && matchInstructor;
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

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const allFilteredIds = filtered.map((c) => c._id);
  const isAllSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedIds.includes(id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id)),
      );
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...allFilteredIds])),
      );
    }
  };

  const handleToggleSelect = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const result = await dispatch(bulkDeleteCourses(selectedIds));
      if (bulkDeleteCourses.fulfilled.match(result)) {
        if (isAdmin) {
          dispatch(fetchAllCoursesAdmin());
        } else {
          dispatch(fetchCourses());
        }
        if (selectedIds.includes(expandedId)) {
          closeEdit();
        }
        showToast?.(`Successfully deleted ${selectedIds.length} course(s).`);
        setSelectedIds([]);
        setShowBulkDeleteModal(false);
      } else {
        showToast?.(result.payload || "Failed to delete selected courses.");
      }
    } catch (err) {
      showToast?.(err.message || "Failed to delete selected courses.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const openEdit = (course) => {
    setExpandedId(course._id);

    if (isBulkCourse(course)) {
      setEditMode("bulk");
      const items = groupBulkCourseIntoItems(course);
      const subjectsList = items.map((it) => it.subject);
      const inferredBranch = inferBranchFromSubjects(course.board ?? "", course.category ?? "", subjectsList);

      setEditBulkForm({
        title: course.title ?? "",
        className: course.category ?? "",
        board: course.board ?? "",
        branch: inferredBranch,
        language: course.language ?? "",
        thumbnailUrl: course.thumbnailUrl ?? "",
        demoVideoUrl: course.demoVideoUrl ?? "",
        price: course.price ?? 0,
        certificate: course.certificate ?? {
          enabled: false,
          title: "Certificate of Completion",
          signatoryName: "",
          signatoryTitle: "",
          theme: "purple",
        },
        items: items.length ? items : [EMPTY_BULK_ITEM()],
        instructor: course.instructor?._id ?? course.instructor ?? "",
      });
    } else {
      setEditMode("single");
      // Infer courseType from the stored category:
      // if it matches one of our known classes -> "classes", otherwise "competitive"
      const category = course.category ?? "";
      const isKnownClass = CLASSES.includes(category);
      setEditForm({
        _id: course._id ?? "",
        subject: course.title ?? "",
        courseType: isKnownClass || !category ? "classes" : "competitive",
        className: isKnownClass ? category : "",
        examName: isKnownClass || !category ? "" : category,
        board: course.board ?? "",
        description: course.summary || course.description || "",
        lessons: course.lessons ?? [],
        notes: course.notes ?? [],
        content: course.description || course.summary || "",
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
        instructor: course.instructor?._id ?? course.instructor ?? "",
        language: course.language ?? "",
      });
    }

    setView("list");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };
  const closeEdit = () => {
    setExpandedId(null);
    setEditBulkForm(null);
    setEditMode("single");
  };

  const cleanNotes = (notes) =>
    (notes ?? []).map((note) => {
      const { _id, ...rest } = note;
      if (_id && /^[0-9a-fA-F]{24}$/.test(_id)) {
        return { _id, ...rest };
      }
      return rest;
    });

  const buildPayload = (form, published) => ({
    title: form.subject.trim(),
    summary: form.description.trim(),
    description: form.content?.trim() || "",
    category:
      (form.courseType || "classes") === "classes"
        ? form.className
        : form.examName,
    board: form.board,
    lessons: form.lessons ?? [],
    notes: cleanNotes(form.notes),
    price: Number(form.price) || 0,
    thumbnailUrl: form.thumbnailUrl || "",
    demoVideoUrl: form.demoVideoUrl || "",
    published,
    language: form.language || "",
    quiz: form.quiz ?? { title: "Final Quiz", questions: [] },
    certificate: form.certificate ?? {
      enabled: false,
      title: "Certificate of Completion",
      signatoryName: "",
      signatoryTitle: "",
      theme: "purple",
    },
    ...(isAdmin && form.instructor && { instructor: form.instructor }),
  });

  const validateForPublish = (form) => {
    const courseType = form.courseType || "classes";
    const required = [
      { key: "subject", label: "Subject" },
      courseType === "classes"
        ? { key: "className", label: "Class" }
        : { key: "examName", label: "Exam Name" },
      ...(courseType === "classes" ? [{ key: "board", label: "Board" }] : []),
      { key: "description", label: "Description" },
      { key: "content", label: "Subject Content" },
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

    const missingIdx = findMissingLessonTitle(createForm.lessons);
    if (missingIdx !== null) {
      showToast?.(`Lesson ${missingIdx + 1} is missing a title. Please add one before saving.`);
      return;
    }

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
    if (!bulkForm.title?.trim()) {
      showToast?.("Course title is required.");
      return;
    }
    const branches = getBranches(bulkForm.board, bulkForm.className);
    const hasBranches = branches.length > 0;
    if (!bulkForm.className || !bulkForm.board || (hasBranches && !bulkForm.branch)) {
      showToast?.(
        !bulkForm.className || !bulkForm.board
          ? "Select a Class and Board before submitting."
          : "Select a Branch before submitting."
      );
      return;
    }
    const items = bulkForm.items.filter((it) => it.subject.trim());
    if (items.length === 0) {
      showToast?.("Add at least one subject.");
      return;
    }

    for (const item of items) {
      const missingIdx = findMissingLessonTitle(item.lessons);
      if (missingIdx !== null) {
        showToast?.(
          `"${item.subject}" — Lesson ${missingIdx + 1} is missing a title. Please add one before submitting.`
        );
        return;
      }
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
          "Every subject needs a Description and Subject Content before submitting for review.",
        );
        return;
      }
    }

    setSaving(true);
    let lessons = [];
    let notes = [];
    let subjectQuizzes = [];
    let subjectDetails = [];

    for (const item of items) {
      const subjLessons = (item.lessons ?? []).map(l => ({ ...l, subject: item.subject.trim() }));
      const subjNotes = (item.notes ?? []).map(n => ({ ...n, subject: item.subject.trim() }));
      lessons = [...lessons, ...subjLessons];
      notes = [...notes, ...cleanNotes(subjNotes)];
      if (item.quiz && item.quiz.questions.length > 0) {
        subjectQuizzes.push({
          subject: item.subject.trim(),
          title: item.quiz.title || "Subject Quiz",
          questions: item.quiz.questions
        });
      }
      subjectDetails.push({
        subject: item.subject.trim(),
        description: item.description.trim(),
        content: item.content.trim(),
      });
    }

    const payload = {
      title: bulkForm.title.trim(),
      summary: items.map(i => i.subject).join(", ") + " Complete Bundle",
      description: "A complete bundle course including multiple subjects.",
      category: bulkForm.className,
      board: bulkForm.board,
      language: bulkForm.language,
      lessons,
      notes,
      subjectQuizzes,
      subjectDetails,
      price: Number(bulkForm.price) || 0,
      thumbnailUrl: bulkForm.thumbnailUrl || "",
      demoVideoUrl: bulkForm.demoVideoUrl || "",
      published: publish,
      certificate: bulkForm.certificate,
      ...(isAdmin && bulkForm.instructor && { instructor: bulkForm.instructor }),
    };

    const result = await dispatch(createCourse(payload));
    setSaving(false);

    if (createCourse.fulfilled.match(result)) {
      setBulkForm({
        title: "",
        className: "",
        board: "",
        branch: "",
        language: "",
        thumbnailUrl: "",
        demoVideoUrl: "",
        price: "",
        certificate: {
          enabled: false,
          title: "Certificate of Completion",
          signatoryName: "",
          signatoryTitle: "",
          theme: "purple",
        },
        items: [EMPTY_BULK_ITEM()],
      });
      setView("list");
      showToast?.(`Course bundle ${publish ? "submitted for review" : "saved as draft"}.`);
    } else {
      showToast?.(result.payload || "Failed to save course.");
    }
  };

  const handleEdit = async (publish) => {
    if (publish && !validateForPublish(editForm)) return;

    const missingIdx = findMissingLessonTitle(editForm.lessons);
    if (missingIdx !== null) {
      showToast?.(`Lesson ${missingIdx + 1} is missing a title. Please add one before saving.`);
      return;
    }

    setSaving(true);
    const result = await dispatch(
      updateCourse({
        id: expandedId,
        courseData: buildPayload(editForm, publish),
      }),
    );
    setSaving(false);

    if (updateCourse.fulfilled.match(result)) {
      closeEdit();
      showToast?.(publish ? "Course resubmitted for review!" : "Saved as draft.");
    } else {
      showToast?.(result.payload || "Failed to update course.");
    }
  };

  const handleEditBulk = async (publish) => {
    if (!editBulkForm.title?.trim()) {
      showToast?.("Course title is required.");
      return;
    }
    const branches = getBranches(editBulkForm.board, editBulkForm.className);
    const hasBranches = branches.length > 0;
    if (!editBulkForm.className || !editBulkForm.board || (hasBranches && !editBulkForm.branch)) {
      showToast?.(
        !editBulkForm.className || !editBulkForm.board
          ? "Select a Class and Board before submitting."
          : "Select a Branch before submitting."
      );
      return;
    }
    const items = editBulkForm.items.filter((it) => it.subject.trim());
    if (items.length === 0) {
      showToast?.("Add at least one subject.");
      return;
    }

    for (const item of items) {
      const missingIdx = findMissingLessonTitle(item.lessons);
      if (missingIdx !== null) {
        showToast?.(
          `"${item.subject}" — Lesson ${missingIdx + 1} is missing a title. Please add one before saving.`,
        );
        return;
      }
    }

    if (publish) {
      if (!editBulkForm.thumbnailUrl) {
        showToast?.("Thumbnail is required before submitting for review.");
        return;
      }
      const missing = items.find(
        (it) => !it.description.trim() || !it.content.trim(),
      );
      if (missing) {
        showToast?.(
          "Every subject needs a Description and Subject Content before submitting for review.",
        );
        return;
      }
    }

    setSaving(true);

    let lessons = [];
    let notes = [];
    let subjectQuizzes = [];
    let subjectDetails = [];

    for (const item of items) {
      const subjLessons = (item.lessons ?? []).map((l) => ({
        ...l,
        subject: item.subject.trim(),
      }));
      const subjNotes = (item.notes ?? []).map((n) => ({
        ...n,
        subject: item.subject.trim(),
      }));
      lessons = [...lessons, ...subjLessons];
      notes = [...notes, ...cleanNotes(subjNotes)];
      if (item.quiz && item.quiz.questions.length > 0) {
        subjectQuizzes.push({
          subject: item.subject.trim(),
          title: item.quiz.title || "Subject Quiz",
          questions: item.quiz.questions,
        });
      }
      subjectDetails.push({
        subject: item.subject.trim(),
        description: item.description.trim(),
        content: item.content.trim(),
      });
    }

    const payload = {
      title: editBulkForm.title.trim(),
      summary: items.map((i) => i.subject).join(", ") + " Complete Bundle",
      description: "A complete bundle course including multiple subjects.",
      category: editBulkForm.className,
      board: editBulkForm.board,
      language: editBulkForm.language,
      lessons,
      notes,
      subjectQuizzes,
      subjectDetails,
      price: Number(editBulkForm.price) || 0,
      thumbnailUrl: editBulkForm.thumbnailUrl || "",
      demoVideoUrl: editBulkForm.demoVideoUrl || "",
      published: publish,
      certificate: editBulkForm.certificate,
      ...(isAdmin && editBulkForm.instructor && { instructor: editBulkForm.instructor }),
    };

    const result = await dispatch(
      updateCourse({ id: expandedId, courseData: payload }),
    );
    setSaving(false);

    if (updateCourse.fulfilled.match(result)) {
      closeEdit();
      showToast?.(
        publish ? "Course bundle resubmitted for review!" : "Saved as draft.",
      );
    } else {
      showToast?.(result.payload || "Failed to update course bundle.");
    }
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
        .ic-row:hover { border-color:#334155 !important; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,0.25); }
        .ic-row { transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s, background 0.15s; }
        .ic-btn:hover { opacity:.8; }
        .ic-stat:hover { border-color:#334155 !important; transform: translateY(-2px); }
        .ic-stat { transition: border-color 0.15s, transform 0.15s; }
        .ic-mode-toggle { transition: background 0.15s, color 0.15s; }
        select option { background:#0b1120; color:#f1f5f9; }
        select optgroup { background:#0b1120; color:#94a3b8; font-style:normal; font-weight:700; }
        @media (max-width: 640px) {
          .qm-header {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .qm-header > button {
            width: 100% !important;
            justify-content: center !important;
          }
          .qm-body { flex-direction: column !important; min-height: auto !important; }
          .qm-sidebar {
            width: 100% !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            border-right: none !important;
            border-bottom: 1px solid #1e293b !important;
            padding: 6px !important;
            gap: 6px !important;
          }
          .qm-sidebar button {
            flex-shrink: 0 !important;
            width: auto !important;
            min-width: 80px !important;
            max-width: 130px !important;
            padding: 6px 8px !important;
            font-size: 10.5px !important;
          }
          .ic-form-card {
            padding: 12px 14px !important;
            border-radius: 14px !important;
          }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 60 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            padding: "18px 22px",
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(6,182,212,0.08))",
            border: "1px solid #1e293b",
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
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <GraduationCap size={13} /> Course Management
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9" }}>
              {view === "create"
                ? t("instructorCourses.createNewCourse")
                : t("instructorCourses.yourCourses")}
            </h2>
            {view === "list" && (
              <p style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>
                {counts.total === 0
                  ? "Create your first course to get started."
                  : `${counts.total} course${counts.total !== 1 ? "s" : ""} total · ${counts.approved} live`}
              </p>
            )}
          </div>
          {view === "list" ? (
            canCreate && (
              <button
                onClick={() => {
                  loadSavedDraft();
                  setView("create");
                  closeEdit();
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
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
                <Plus size={15} /> New Course
              </button>
            )
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
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ChevronLeft size={14} /> Back to Courses
            </button>
          )}
        </div>

        {/* Create view */}
        {view === "create" && (
          <div
            className="ic-form-card"
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 18,
              padding: "clamp(14px, 3vw, 28px)",
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
                { key: "single", label: "Single Course", icon: <FileText size={13} /> },
                { key: "bulk", label: "Bulk Upload (Whole Class)", icon: <Package size={13} /> },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setCreateMode(opt.key)}
                  className="ic-mode-toggle"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
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
                  {opt.icon} {opt.label}
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
                isAdmin={isAdmin}
                instructors={instructors}
              />
            ) : (
              <BulkCourseForm
                form={bulkForm}
                setForm={setBulkForm}
                onSave={handleBulkCreate}
                onCancel={() => setView("list")}
                saving={saving}
                showToast={showToast}
                isAdmin={isAdmin}
                instructors={instructors}
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
                { label: "Total", value: counts.total, color: "#818cf8", Icon: BookOpen },
                { label: "Pending", value: counts.pending, color: "#fbbf24", Icon: Clock },
                { label: "Live", value: counts.approved, color: "#4ade80", Icon: CheckCircle2 },
                { label: "Rejected", value: counts.rejected, color: "#f87171", Icon: XCircle },
                { label: "Drafts", value: counts.draft, color: "#64748b", Icon: FileText },
              ].map((s) => (
                <div
                  key={s.label}
                  className="ic-stat"
                  style={{
                    background: "#111827",
                    border: "1px solid #1e293b",
                    borderRadius: 14,
                    padding: "16px 18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>
                      {s.value}
                    </div>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 9,
                        background: `${s.color}1a`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <s.Icon size={14} color={s.color} />
                    </div>
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
              {isAdmin && instructors.length > 0 && (
                <div style={{ minWidth: 180 }}>
                  <Sel
                    value={selectedInstructorFilter}
                    onChange={(e) => setSelectedInstructorFilter(e.target.value)}
                    options={[
                      { value: "", label: "All Instructors" },
                      ...instructors.map((inst) => ({
                        value: inst._id,
                        label: inst.name || inst.email,
                      })),
                    ]}
                  />
                </div>
              )}
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
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={15} /> {error}
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
              <div
                style={{
                  textAlign: "center",
                  padding: "56px 24px",
                  border: "1px dashed #1e293b",
                  borderRadius: 18,
                  background: "#0f172a",
                }}
              >
                <Inbox size={38} color="#334155" style={{ marginBottom: 12 }} />
                <p style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 4 }}>
                  {courses.length === 0 ? "No courses yet" : "No courses match your filter"}
                </p>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: courses.length === 0 && canCreate ? 18 : 0 }}>
                  {courses.length === 0
                    ? "Create a single course or bulk-upload a whole class in a few guided steps."
                    : "Try a different search term or status filter."}
                </p>
                {courses.length === 0 && canCreate && (
                  <button
                    onClick={() => {
                      loadSavedDraft();
                      setView("create");
                      closeEdit();
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 20px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(124,58,237,.3)",
                    }}
                  >
                    <Plus size={15} /> Create your first course
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {/* ── Bulk Actions Toolbar ── */}
                {canDelete && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 16px",
                      background:
                        selectedIds.length > 0
                          ? "rgba(124, 58, 237, 0.1)"
                          : "#0b1120",
                      border: `1px solid ${selectedIds.length > 0 ? "rgba(124, 58, 237, 0.35)" : "#1e293b"}`,
                      borderRadius: 12,
                      flexWrap: "wrap",
                      gap: 10,
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          color: isAllSelected ? "#a78bfa" : "#94a3b8",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleToggleSelectAll}
                          style={{
                            width: 17,
                            height: 17,
                            accentColor: "#7c3aed",
                            cursor: "pointer",
                          }}
                        />
                        Select All ({filtered.length})
                      </label>

                      {selectedIds.length > 0 && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#c4b5fd",
                            background: "rgba(124, 58, 237, 0.2)",
                            padding: "2px 10px",
                            borderRadius: 20,
                            border: "1px solid rgba(124, 58, 237, 0.3)",
                          }}
                        >
                          {selectedIds.length} selected
                        </span>
                      )}
                    </div>

                    {selectedIds.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid #334155",
                            background: "transparent",
                            color: "#94a3b8",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBulkDeleteModal(true)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "1px solid #7f1d1d",
                            background: "#2d0a0a",
                            color: "#f87171",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 2px 10px rgba(239, 68, 68, 0.2)",
                            transition: "all 0.15s",
                          }}
                        >
                          <Trash2 size={13} /> Delete Selected ({selectedIds.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {[...filtered]
                  .sort((a, b) => {
                    if (expandedId) {
                      if (a._id === expandedId) return -1;
                      if (b._id === expandedId) return 1;
                    }
                    return 0;
                  })
                  .map((course) => {
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
                            background: selectedIds.includes(course._id)
                              ? "rgba(124, 58, 237, 0.07)"
                              : "#111827",
                            border: `1px solid ${selectedIds.includes(course._id) ? "rgba(124, 58, 237, 0.55)" : isOpen ? "#7c3aed40" : "#1e293b"}`,
                            borderRadius: isOpen ? "18px 18px 0 0" : 18,
                            padding: "16px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            flexWrap: "wrap",
                          }}
                        >
                          {canDelete && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                flexShrink: 0,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(course._id)}
                                onChange={(e) =>
                                  handleToggleSelect(course._id, e)
                                }
                                style={{
                                  width: 18,
                                  height: 18,
                                  accentColor: "#7c3aed",
                                  cursor: "pointer",
                                }}
                                title="Select course for bulk action"
                              />
                            </div>
                          )}
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
                              <BookOpen size={22} color="#64748b" />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 180 }}>
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
                              {isBulkCourse(course) && (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: 20,
                                    background: "#052e2b",
                                    color: "#2dd4bf",
                                    flexShrink: 0,
                                  }}
                                >
                                  <Package size={11} /> Bundle
                                </span>
                              )}
                              {course.quiz?.questions?.length > 0 && (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: 20,
                                    background: "#1e1b4b",
                                    color: "#818cf8",
                                    flexShrink: 0,
                                  }}
                                >
                                  <FileQuestion size={11} /> {course.quiz.questions.length}Q Quiz
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
                                <span style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <ClipboardList size={11} /> {course.board}
                                </span>
                              )}
                              <span style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <Users size={11} /> {course.enrolledCount ?? 0}
                              </span>
                              {isAdmin && course.instructor && (
                                <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <User size={11} /> {course.instructor.name || course.instructor.email}
                                </span>
                              )}
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
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <Clock size={12} /> In review
                              </span>
                            )}
                            {canEdit && (isAdmin || course.approvalStatus !== "pending") && (
                              <button
                                className="ic-btn"
                                onClick={() =>
                                  isOpen ? closeEdit() : openEdit(course)
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "8px 14px",
                                  borderRadius: 8,
                                  border: `1px solid ${isOpen ? "#7c3aed" : "#334155"}`,
                                  background: isOpen ? "#2e1065" : "transparent",
                                  color: isOpen ? "#a78bfa" : "#e2e8f0",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  minHeight: 36,
                                }}
                              >
                                {isOpen ? (
                                  <><X size={13} /> Close</>
                                ) : (
                                  <><Pencil size={13} /> Edit / Manage</>
                                )}
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="ic-btn"
                                onClick={() => setDeleteId(course._id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  border: "1px solid #7f1d1d30",
                                  background: "#2d0a0a",
                                  color: "#f87171",
                                  fontSize: 11,
                                  cursor: "pointer",
                                  transition: "opacity 0.15s",
                                  minHeight: 36,
                                }}
                                title="Delete Course"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {isOpen && (
                          <div
                            className="ic-form-card"
                            style={{
                              background: "#0f172a",
                              border: "1px solid #7c3aed40",
                              borderTop: "none",
                              borderRadius: "0 0 18px 18px",
                              padding: "clamp(12px, 3vw, 24px)",
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
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Pencil size={12} /> Editing: {course.title}
                              {editMode === "bulk" ? " (Bundle)" : ""}
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
                                  <XCircle size={20} color="#f87171" style={{ flexShrink: 0 }} />
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

                            {editMode === "bulk" && editBulkForm ? (
                              <BulkCourseForm
                                form={editBulkForm}
                                setForm={setEditBulkForm}
                                onSave={handleEditBulk}
                                onCancel={closeEdit}
                                saving={saving}
                                showToast={showToast}
                                isAdmin={isAdmin}
                                instructors={instructors}
                              />
                            ) : (
                              <CourseForm
                                form={editForm}
                                setForm={setEditForm}
                                onSave={handleEdit}
                                onCancel={closeEdit}
                                saving={saving}
                                mode="edit"
                                showToast={showToast}
                                isAdmin={isAdmin}
                                instructors={instructors}
                              />
                            )}

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
          onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}
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
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#2d0a0a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Trash2 size={20} color="#f87171" />
            </div>
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
      {/* ── Bulk Delete Modal ── */}
      {showBulkDeleteModal && selectedIds.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={(e) =>
            e.target === e.currentTarget &&
            !bulkDeleting &&
            setShowBulkDeleteModal(false)
          }
        >
          <div
            style={{
              background: "#111827",
              border: "1px solid #7f1d1d",
              borderRadius: 20,
              padding: 28,
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
              animation: "slideDown 0.25s ease",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "#2d0a0a",
                border: "1px solid #7f1d1d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Trash2 size={24} color="#f87171" />
            </div>
            <h3
              style={{
                fontSize: 19,
                fontWeight: 800,
                color: "#f1f5f9",
                marginBottom: 10,
              }}
            >
              Delete {selectedIds.length} Selected Course{selectedIds.length !== 1 ? "s" : ""}?
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "#94a3b8",
                lineHeight: 1.7,
                marginBottom: 16,
              }}
            >
              This will permanently delete the selected{" "}
              <strong style={{ color: "#f87171" }}>
                {selectedIds.length}
              </strong>{" "}
              course{selectedIds.length !== 1 ? "s" : ""}, including all
              curriculum lessons, notes, and unenroll all enrolled students.{" "}
              <strong style={{ color: "#f1f5f9" }}>
                This action cannot be undone.
              </strong>
            </p>

            <div
              style={{
                maxHeight: 150,
                overflowY: "auto",
                background: "#080e1a",
                border: "1px solid #1e293b",
                borderRadius: 10,
                padding: "8px 12px",
                marginBottom: 22,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {(courses.length > 0 ? courses : filtered)
                .filter((c) =>
                  selectedIds.map(String).includes(String(c._id || c.id)),
                )
                .map((c) => (
                  <div
                    key={c._id || c.id}
                    style={{
                      fontSize: 12,
                      color: "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 6px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span
                      style={{
                        color: "#f87171",
                        fontSize: 14,
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                    >
                      •
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {c.title || c.subject || "Untitled Course"}
                    </span>
                    {c.category && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          background: "#1e293b",
                          padding: "1px 6px",
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        {c.category}
                      </span>
                    )}
                  </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #334155",
                  background: "transparent",
                  color: "#94a3b8",
                  fontWeight: 600,
                  cursor: bulkDeleting ? "not-allowed" : "pointer",
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={handleBulkDeleteConfirm}
                style={{
                  flex: 1.2,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: bulkDeleting
                    ? "#450a0a"
                    : "linear-gradient(135deg, #dc2626, #991b1b)",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: bulkDeleting ? "not-allowed" : "pointer",
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 2px 10px rgba(220, 38, 38, 0.4)",
                }}
              >
                {bulkDeleting ? (
                  <>
                    <Loader2
                      size={15}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Deleting…
                  </>
                ) : (
                  `Yes, Delete (${selectedIds.length})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}