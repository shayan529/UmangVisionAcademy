import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchUsers } from "../../redux/slices/usersSlice";
import { fetchAllCoursesAdmin, fetchCourses } from "../../redux/slices/courseSlice";
import api from "../../config/api";
import { Toast } from "./InstructorUi";
import { uploadFile } from "../../utils/uploadFile";
import {
  FileText,
  Plus,
  X,
  Upload,
  Search,
  Check,
  XCircle,
  FolderPlus,
  Trash2,
  Layers,
  Loader2,
  ArrowUpDown,
  Edit2,
  BookOpen,
  ExternalLink,
} from "lucide-react";

const STATUS_STYLE = {
  approved: { bg: "bg-green-950", text: "text-green-400", border: "border-green-800", label: "Approved" },
  rejected: { bg: "bg-red-950", text: "text-red-400", border: "border-red-900", label: "Rejected" },
  pending: { bg: "bg-yellow-950", text: "text-amber-400", border: "border-yellow-900", label: "Pending" },
};

export default function InstructorNotes({ showToast }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);
  const { courses } = useSelector((state) => state.courses);

  const isAdmin = user?.role === "admin";
  const instructors = users.filter((u) => u.role === "instructor");

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [sortBy, setSortBy] = useState("title"); // Title A-Z default!
  const [isDragging, setIsDragging] = useState(false);

  // Helper to extract clean subject from title, courseTitle, or fallback
  const extractSubject = (note) => {
    if (note.courseTitle) return note.courseTitle;
    const title = note.title || "";
    const match = title.match(
      /(Chemistry|Physics|Maths|Mathematics|Biology|English|Hindi|Science|Computer|Social|Accounts|Economics|GST|History|Geography|Civics|Botany|Zoology)/i
    );
    if (match) {
      const found = match[1];
      if (/math/i.test(found)) return "Mathematics";
      return found.charAt(0).toUpperCase() + found.slice(1).toLowerCase();
    }
    return "General Study";
  };

  // Compute subject tabs with counts
  const subjectTabs = useMemo(() => {
    const counts = { All: notes.length };
    notes.forEach((note) => {
      const subj = extractSubject(note);
      counts[subj] = (counts[subj] || 0) + 1;
    });
    return Object.keys(counts).map((subj) => ({
      name: subj,
      count: counts[subj],
    }));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = notes.filter((n) => {
      const matchesStatus = statusFilter === "all" || n.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        n.title?.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.courseTitle?.toLowerCase().includes(q);

      const subj = extractSubject(n);
      const matchesSubject =
        selectedSubject === "All" || subj.toLowerCase() === selectedSubject.toLowerCase();

      return matchesStatus && matchesSearch && matchesSubject;
    });

    const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

    result.sort((a, b) => {
      if (sortBy === "sequential") {
        const subjA = extractSubject(a);
        const subjB = extractSubject(b);
        const subjCompare = naturalCollator.compare(subjA, subjB);
        if (subjCompare !== 0) return subjCompare;
        return naturalCollator.compare(a.title || "", b.title || "");
      }
      if (sortBy === "title") {
        return naturalCollator.compare(a.title || "", b.title || "");
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      // 'newest'
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }, [notes, statusFilter, searchQuery, selectedSubject, sortBy]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    fileUrl: "",
    instructorId: "",
    courseId: "",
    subject: "",
    chapterTitle: "Chapter 1: Study Notes",
    addToCurriculum: true,
  });

  const [courseSearch, setCourseSearch] = useState("");
  const [courseInstructor, setCourseInstructor] = useState("");
  const [courseSubject, setCourseSubject] = useState("");
  const [courseClass, setCourseClass] = useState("");

  // Derived filter options for courses
  const uniqueCourseSubjects = [...new Set(courses.map((c) => c.category).filter(Boolean))];
  const uniqueCourseClasses = [...new Set(courses.map((c) => c.board).filter(Boolean))];
  const uniqueCourseInstructors = [...new Set(courses.map((c) => c.instructor?.name || c.instructor?.email).filter(Boolean))];

  const filteredCourses = courses.filter((c) => {
    const q = courseSearch.toLowerCase();
    const matchesSearch = c.title?.toLowerCase().includes(q);
    const matchesInstructor = courseInstructor ? (c.instructor?.name === courseInstructor || c.instructor?.email === courseInstructor) : true;
    const matchesSubject = courseSubject ? c.category === courseSubject : true;
    const matchesClass = courseClass ? c.board === courseClass : true;
    return matchesSearch && matchesInstructor && matchesSubject && matchesClass;
  });

  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");

  // ── Bulk Upload State ──
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkCourseId, setBulkCourseId] = useState("");
  const [bulkInstructorId, setBulkInstructorId] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);
  const [isBulkDragging, setIsBulkDragging] = useState(false);
  const bulkFileInputRef = useRef(null);

  const cleanTitleFromFileName = (name) => {
    if (!name) return "Study Note";
    let base = name.replace(/\.[^/.]+$/, "");
    base = base.replace(/[-_]+/g, " ").trim();
    return base.charAt(0).toUpperCase() + base.slice(1);
  };

  const handleBulkFilesSelect = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const fileList = Array.from(selectedFiles);
    const validPdfFiles = fileList.filter(
      (f) => f.name?.toLowerCase().endsWith(".pdf") || f.type === "application/pdf"
    );

    if (validPdfFiles.length === 0) {
      showToast?.("Only PDF files are allowed for study notes.");
      return;
    }

    if (validPdfFiles.length < fileList.length) {
      showToast?.(`Selected ${validPdfFiles.length} valid PDF files (non-PDF files were skipped).`);
    }

    const newItems = validPdfFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      title: cleanTitleFromFileName(file.name),
      description: "",
      fileUrl: "",
      status: "idle",
      progress: 0,
      errorMsg: "",
    }));

    setBulkFiles((prev) => [...prev, ...newItems]);
  };

  const removeBulkFile = (id) => {
    setBulkFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const updateBulkFileField = (id, field, value) => {
    setBulkFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const closeBulkModal = () => {
    if (bulkUploading) return;
    setShowBulkModal(false);
    setBulkFiles([]);
    setBulkCourseId("");
    setBulkInstructorId("");
  };

  const handleBulkSubmit = async () => {
    if (bulkFiles.length === 0) {
      showToast?.("Please add at least one PDF file to upload.");
      return;
    }

    const missingTitle = bulkFiles.some((f) => !f.title.trim());
    if (missingTitle) {
      showToast?.("All notes must have a title.");
      return;
    }

    try {
      setBulkUploading(true);
      const batchPayload = [];

      for (let i = 0; i < bulkFiles.length; i++) {
        const item = bulkFiles[i];
        let url = item.fileUrl;

        if (!url && item.file) {
          setBulkFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: "uploading", progress: 0 } : f))
          );
          try {
            const uploadRes = await uploadFile({
              file: item.file,
              folder: "/notes",
              onUploadProgress: (pe) => {
                const percent = Math.round((pe.loaded * 100) / pe.total);
                setBulkFiles((prev) =>
                  prev.map((f, idx) => (idx === i ? { ...f, progress: percent } : f))
                );
              },
            });
            url = uploadRes.url;
            setBulkFiles((prev) =>
              prev.map((f, idx) =>
                idx === i ? { ...f, status: "ready", fileUrl: url, progress: 100 } : f
              )
            );
          } catch (err) {
            setBulkFiles((prev) =>
              prev.map((f, idx) =>
                idx === i ? { ...f, status: "error", errorMsg: "Upload failed" } : f
              )
            );
            continue;
          }
        }

        if (url) {
          batchPayload.push({
            title: item.title.trim(),
            description: item.description.trim(),
            fileUrl: url,
            courseId: bulkCourseId || undefined,
            instructorId: bulkInstructorId || undefined,
          });
        }
      }

      if (batchPayload.length === 0) {
        showToast?.("No files were successfully uploaded.");
        setBulkUploading(false);
        return;
      }

      const { data } = await api.post("/notes/bulk", { notes: batchPayload });
      if (data.success && data.notes) {
        setNotes((prev) => [...data.notes, ...prev]);
        showToast?.(`Successfully bulk uploaded ${data.notes.length} study notes!`);
        closeBulkModal();
      } else {
        showToast?.("Failed to save bulk notes");
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      showToast?.(err.response?.data?.message || "Failed to bulk upload notes");
    } finally {
      setBulkUploading(false);
    }
  };

  // ── Batch Selection & Actions ──
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [bulkActioning, setBulkActioning] = useState(false);

  const isAllSelected =
    filteredNotes.length > 0 &&
    filteredNotes.every((n) => selectedNoteIds.includes(n._id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(filteredNotes.map((n) => n._id));
    }
  };

  const toggleNoteSelection = (id) => {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchAction = async (action) => {
    if (selectedNoteIds.length === 0) return;

    let reason = "";
    if (action === "reject") {
      reason = window.prompt("Reason for rejecting selected notes:");
      if (reason === null) return;
    }

    if (
      action === "delete" &&
      !window.confirm(`Are you sure you want to delete ${selectedNoteIds.length} selected note(s)?`)
    ) {
      return;
    }

    try {
      setBulkActioning(true);
      const targetNotes = notes
        .filter((n) => selectedNoteIds.includes(n._id))
        .map((n) => ({
          _id: n._id,
          source: n.source || "standalone",
          courseId: n.courseId || undefined,
        }));

      const { data } = await api.post("/notes/bulk-action", {
        action,
        notes: targetNotes,
        reason,
      });

      showToast?.(data.message || `Bulk ${action} successful`);

      if (action === "delete") {
        setNotes((prev) => prev.filter((n) => !selectedNoteIds.includes(n._id)));
      } else if (action === "approve") {
        setNotes((prev) =>
          prev.map((n) =>
            selectedNoteIds.includes(n._id)
              ? { ...n, status: "approved", rejectedReason: "" }
              : n
          )
        );
      } else if (action === "reject") {
        setNotes((prev) =>
          prev.map((n) =>
            selectedNoteIds.includes(n._id)
              ? { ...n, status: "rejected", rejectedReason: reason || "" }
              : n
          )
        );
      }

      setSelectedNoteIds([]);
    } catch (err) {
      console.error("Bulk action failed", err);
      showToast?.(err.response?.data?.message || `Failed to perform bulk ${action}`);
    } finally {
      setBulkActioning(false);
    }
  };

  // ── Edit Note State ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    fileUrl: "",
    courseId: "",
    instructorId: "",
    subject: "",
    chapterTitle: "Chapter 1: Study Notes",
    addToCurriculum: true,
  });
  const [editCourseSearch, setEditCourseSearch] = useState("");
  const [editCourseSubject, setEditCourseSubject] = useState("");
  const [editCourseClass, setEditCourseClass] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editUploadingFile, setEditUploadingFile] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(0);
  const [editUploadedFileName, setEditUploadedFileName] = useState("");
  const editFileInputRef = useRef(null);

  // ── Batch Assign Course State ──
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [batchTargetCourseId, setBatchTargetCourseId] = useState("");
  const [batchSubject, setBatchSubject] = useState("");
  const [batchChapterTitle, setBatchChapterTitle] = useState("Chapter 1: Study Notes");
  const [batchAddToCurriculum, setBatchAddToCurriculum] = useState(true);
  const [batchAssigning, setBatchAssigning] = useState(false);

  const handleEditClick = (note) => {
    setEditingNote(note);
    const targetCourse = courses.find((c) => c._id === note.courseId);
    setEditForm({
      title: note.title || "",
      description: note.description || "",
      fileUrl: note.fileUrl || "",
      courseId: note.courseId || "",
      instructorId:
        (typeof note.instructor === "object" ? note.instructor?._id : note.instructor) || "",
      subject: note.subject || targetCourse?.category || "",
      chapterTitle: note.chapterTitle || "Chapter 1: Study Notes",
      addToCurriculum: true,
    });
    setEditCourseSearch("");
    setEditCourseSubject("");
    setEditCourseClass("");
    setEditUploadedFileName("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (editSaving || editUploadingFile) return;
    setShowEditModal(false);
    setEditingNote(null);
    setEditUploadedFileName("");
  };

  const doEditUpload = useCallback(
    async (file) => {
      if (!file) return;
      const isPdf = file.name?.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
      if (!isPdf) {
        showToast?.("Only PDF files are allowed for study notes.");
        return;
      }
      try {
        setEditUploadingFile(true);
        setEditUploadProgress(0);
        const data = await uploadFile({
          file,
          folder: "/notes",
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setEditUploadProgress(percentCompleted);
          },
        });
        setEditForm((prev) => ({
          ...prev,
          fileUrl: data.url,
          title: prev.title.trim() || cleanTitleFromFileName(file.name),
        }));
        setEditUploadedFileName(file.name);
        showToast?.("PDF file replaced successfully!");
      } catch (error) {
        showToast?.("File upload failed");
      } finally {
        setEditUploadingFile(false);
      }
    },
    [showToast],
  );

  const handleSaveEdit = async () => {
    if (!editingNote) return;
    if (!editForm.fileUrl) {
      showToast?.("A PDF file is required.");
      return;
    }
    if (!editForm.title.trim()) {
      showToast?.("Please enter a note title.");
      return;
    }

    try {
      setEditSaving(true);
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        fileUrl: editForm.fileUrl,
        courseId: editForm.courseId || "",
        instructorId: editForm.instructorId || undefined,
        subject: editForm.subject?.trim() || "",
        chapterTitle: editForm.chapterTitle?.trim() || "Chapter 1: Study Notes",
        addToCurriculum: editForm.addToCurriculum !== false,
        source: editingNote.source || (editingNote.courseId ? "course" : "standalone"),
      };

      const { data } = await api.put(`/notes/${editingNote._id}`, payload);
      if (data.note) {
        setNotes((prev) =>
          prev.map((n) => (n._id === editingNote._id ? data.note : n)),
        );
        showToast?.(data.message || "Note updated successfully!");
        closeEditModal();
        if (isAdmin) {
          dispatch(fetchAllCoursesAdmin());
        } else {
          dispatch(fetchCourses());
        }
      } else {
        showToast?.(data.message || "Note updated");
        fetchNotes();
        closeEditModal();
      }
    } catch (err) {
      console.error("Save edit note error:", err);
      showToast?.(err.response?.data?.message || "Failed to update note");
    } finally {
      setEditSaving(false);
    }
  };

  const handleBulkAssignCourseSubmit = async () => {
    if (selectedNoteIds.length === 0) return;
    try {
      setBatchAssigning(true);
      const { data } = await api.post("/notes/bulk-assign-course", {
        noteIds: selectedNoteIds,
        targetCourseId: batchTargetCourseId || "standalone",
        subject: batchSubject?.trim() || "",
        chapterTitle: batchChapterTitle?.trim() || "Chapter 1: Study Notes",
        addToCurriculum: batchAddToCurriculum !== false,
      });

      showToast?.(data.message || "Notes assigned successfully!");
      setSelectedNoteIds([]);
      setShowBatchAssignModal(false);
      fetchNotes();
      if (isAdmin) {
        dispatch(fetchAllCoursesAdmin());
      } else {
        dispatch(fetchCourses());
      }
    } catch (err) {
      console.error("Bulk assign course error:", err);
      showToast?.(err.response?.data?.message || "Failed to assign notes to course");
    } finally {
      setBatchAssigning(false);
    }
  };

  // Target course currently selected in Edit Modal
  const editTargetCourse = useMemo(() => {
    return courses.find((c) => c._id === editForm.courseId);
  }, [courses, editForm.courseId]);

  const editCourseAvailableSubjects = useMemo(() => {
    if (!editTargetCourse) return [];
    const set = new Set();
    if (editTargetCourse.category) set.add(editTargetCourse.category);
    if (Array.isArray(editTargetCourse.subjectDetails)) {
      editTargetCourse.subjectDetails.forEach((s) => s.subject && set.add(s.subject));
    }
    if (Array.isArray(editTargetCourse.lessons)) {
      editTargetCourse.lessons.forEach((l) => l.subject && set.add(l.subject));
    }
    if (Array.isArray(editTargetCourse.tags)) {
      editTargetCourse.tags.forEach((t) => t && set.add(t));
    }
    return Array.from(set).filter(Boolean);
  }, [editTargetCourse]);

  const editCourseAvailableChapters = useMemo(() => {
    if (!editTargetCourse || !Array.isArray(editTargetCourse.lessons)) return [];
    const set = new Set();
    editTargetCourse.lessons.forEach((l) => {
      if (l.chapterTitle) {
        if (!editForm.subject || !l.subject || l.subject.toLowerCase() === editForm.subject.toLowerCase()) {
          set.add(l.chapterTitle);
        }
      }
    });
    return Array.from(set).filter(Boolean);
  }, [editTargetCourse, editForm.subject]);

  const uploadTargetCourse = useMemo(() => {
    return courses.find((c) => c._id === form.courseId);
  }, [courses, form.courseId]);

  const uploadAvailableSubjects = useMemo(() => {
    if (!uploadTargetCourse) return [];
    const set = new Set();
    if (uploadTargetCourse.category) set.add(uploadTargetCourse.category);
    if (Array.isArray(uploadTargetCourse.subjectDetails)) {
      uploadTargetCourse.subjectDetails.forEach((s) => s.subject && set.add(s.subject));
    }
    if (Array.isArray(uploadTargetCourse.lessons)) {
      uploadTargetCourse.lessons.forEach((l) => l.subject && set.add(l.subject));
    }
    return Array.from(set).filter(Boolean);
  }, [uploadTargetCourse]);

  const uploadAvailableChapters = useMemo(() => {
    if (!uploadTargetCourse || !Array.isArray(uploadTargetCourse.lessons)) return [];
    const set = new Set();
    uploadTargetCourse.lessons.forEach((l) => {
      if (l.chapterTitle) {
        if (!form.subject || !l.subject || l.subject.toLowerCase() === form.subject.toLowerCase()) {
          set.add(l.chapterTitle);
        }
      }
    });
    return Array.from(set).filter(Boolean);
  }, [uploadTargetCourse, form.subject]);

  const batchTargetCourse = useMemo(() => {
    return courses.find((c) => c._id === batchTargetCourseId);
  }, [courses, batchTargetCourseId]);

  const batchAvailableSubjects = useMemo(() => {
    if (!batchTargetCourse) return [];
    const set = new Set();
    if (batchTargetCourse.category) set.add(batchTargetCourse.category);
    if (Array.isArray(batchTargetCourse.lessons)) {
      batchTargetCourse.lessons.forEach((l) => l.subject && set.add(l.subject));
    }
    return Array.from(set).filter(Boolean);
  }, [batchTargetCourse]);

  const batchAvailableChapters = useMemo(() => {
    if (!batchTargetCourse || !Array.isArray(batchTargetCourse.lessons)) return [];
    const set = new Set();
    batchTargetCourse.lessons.forEach((l) => {
      if (l.chapterTitle) {
        if (!batchSubject || !l.subject || l.subject.toLowerCase() === batchSubject.toLowerCase()) {
          set.add(l.chapterTitle);
        }
      }
    });
    return Array.from(set).filter(Boolean);
  }, [batchTargetCourse, batchSubject]);

  const filteredEditCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = editCourseSearch.toLowerCase();
      const matchesSearch =
        !q ||
        c.title?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.board?.toLowerCase().includes(q) ||
        c.instructor?.name?.toLowerCase().includes(q) ||
        c.instructor?.email?.toLowerCase().includes(q);
      const matchesSubject = editCourseSubject ? c.category === editCourseSubject : true;
      const matchesClass = editCourseClass ? c.board === editCourseClass : true;
      return matchesSearch && matchesSubject && matchesClass;
    });
  }, [courses, editCourseSearch, editCourseSubject, editCourseClass]);

  useEffect(() => {
    fetchNotes();
    if (isAdmin && users.length === 0) {
      dispatch(fetchUsers());
    }
    if (courses.length === 0) {
      if (isAdmin) {
        dispatch(fetchAllCoursesAdmin());
      } else {
        dispatch(fetchCourses());
      }
    }
  }, [isAdmin, dispatch, users.length, courses.length]);

  // Focus the title field and allow Escape-to-close whenever the modal opens
  useEffect(() => {
    if (!showModal) return;
    titleInputRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showModal]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? "/notes?all=1" : "/notes?mine=1";
      const { data } = await api.get(endpoint);
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast?.(error.response?.data?.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const doUpload = useCallback(async (file) => {
    if (!file) return;
    const isPdf = file.name?.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      showToast?.("Only PDF files are allowed for study notes.");
      return;
    }
    try {
      setUploadingFile(true);
      setUploadProgress(0);
      const data = await uploadFile({
        file,
        folder: "/notes",
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      setForm((prev) => ({
        ...prev,
        fileUrl: data.url,
        title: prev.title.trim() || cleanTitleFromFileName(file.name),
      }));
      setUploadedFileName(file.name);
    } catch (error) {
      showToast?.("File upload failed");
    } finally {
      setUploadingFile(false);
    }
  }, [showToast]);

  const handleFileChange = (e) => doUpload(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploadingFile) return;
    doUpload(e.dataTransfer.files?.[0]);
  };

  const handleCreate = async () => {
    if (!form.fileUrl) {
      showToast?.("A file is required");
      return;
    }

    const payload = {
      ...form,
      title: form.title.trim() || cleanTitleFromFileName(uploadedFileName || form.fileUrl),
    };

    try {
      setSaving(true);
      const { data } = await api.post("/notes", payload);
      setNotes([data, ...notes]);
      closeModal();
      showToast?.("Note uploaded successfully and is pending approval.");
    } catch (error) {
      showToast?.(error.response?.data?.message || "Failed to upload note");
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ title: "", description: "", fileUrl: "", instructorId: "", courseId: "" });
    setUploadedFileName("");
  };

  const handleDelete = async (note) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await api.delete(`/notes/${note._id}`, {
        data: { source: note.source || "standalone", courseId: note.courseId || undefined },
      });
      setNotes(notes.filter((n) => n._id !== note._id));
      showToast?.("Note deleted");
    } catch (error) {
      showToast?.(error.response?.data?.message || "Failed to delete note");
    }
  };

  const handleApprove = async (note) => {
    try {
      await api.put(`/notes/${note._id}/approve`, {
        source: note.source || "standalone",
        courseId: note.courseId || undefined,
      });
      setNotes(notes.map((n) => (n._id === note._id ? { ...n, status: "approved", rejectedReason: "" } : n)));
      showToast?.("Note approved");
    } catch (error) {
      showToast?.(error.response?.data?.message || "Failed to approve note");
    }
  };

  const handleReject = async (note) => {
    const reason = window.prompt("Reason for rejection:");
    if (reason === null) return;
    try {
      await api.put(`/notes/${note._id}/reject`, {
        source: note.source || "standalone",
        courseId: note.courseId || undefined,
        reason,
      });
      setNotes(notes.map((n) => (n._id === note._id ? { ...n, status: "rejected", rejectedReason: reason } : n)));
      showToast?.("Note rejected");
    } catch (error) {
      showToast?.(error.response?.data?.message || "Failed to reject note");
    }
  };

  return (
    <div className="flex flex-col gap-6 py-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100">Study Notes</h2>
          <p className="mt-1 text-sm text-slate-400">Study notes and documents uploaded for your courses.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-[180px] rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-8 pr-8 text-sm text-slate-100 outline-none transition-colors focus:border-violet-600 sm:w-[200px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-1">
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${statusFilter === tab.id ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300">
            <ArrowUpDown size={14} className="text-emerald-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value="title" className="bg-slate-900 text-white">
                Title (A - Z)
              </option>
              <option value="sequential" className="bg-slate-900 text-white">
                Subject & Chapter (Sequential 1→2→3)
              </option>
              <option value="newest" className="bg-slate-900 text-white">
                Latest First
              </option>
              <option value="oldest" className="bg-slate-900 text-white">
                Oldest First
              </option>
            </select>
          </div>

          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700 cursor-pointer shadow-md"
          >
            <FolderPlus size={18} /> Bulk Upload
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500 active:bg-violet-700 cursor-pointer shadow-md"
          >
            <Plus size={18} /> Upload Note
          </button>
        </div>
      </div>

      {/* Subject Filter Pills */}
      {notes.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {subjectTabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setSelectedSubject(tab.name)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                selectedSubject === tab.name
                  ? "bg-violet-600/20 text-violet-300 border-violet-500/40 shadow-sm"
                  : "bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <span>{tab.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                  selectedSubject === tab.name
                    ? "bg-violet-500/30 text-violet-200"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Selection Control & Bulk Action Bar */}
      {!loading && filteredNotes.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 shadow-sm">
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Select All Visible ({filteredNotes.length})</span>
            </label>

            {selectedNoteIds.length > 0 && (
              <span className="text-xs font-semibold text-emerald-400">
                {selectedNoteIds.length} of {filteredNotes.length} selected
              </span>
            )}
          </div>

          {selectedNoteIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/80 via-slate-900 to-emerald-950/60 p-4 shadow-xl backdrop-blur-xl animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-extrabold text-white">
                  {selectedNoteIds.length}
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">
                    {selectedNoteIds.length} Note{selectedNoteIds.length !== 1 ? "s" : ""} Selected
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Apply bulk actions across all selected items
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleBatchAction("approve")}
                      disabled={bulkActioning}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      <Check size={14} /> Approve All ({selectedNoteIds.length})
                    </button>
                    <button
                      onClick={() => handleBatchAction("reject")}
                      disabled={bulkActioning}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-500 disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      <XCircle size={14} /> Reject All ({selectedNoteIds.length})
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowBatchAssignModal(true)}
                  disabled={bulkActioning}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <BookOpen size={14} /> Assign Course ({selectedNoteIds.length})
                </button>
                <button
                  onClick={() => handleBatchAction("delete")}
                  disabled={bulkActioning}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <Trash2 size={14} /> Delete All ({selectedNoteIds.length})
                </button>
                <button
                  onClick={() => setSelectedNoteIds([])}
                  className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-slate-800" />
                  <div className="h-2 w-1/2 rounded bg-slate-800" />
                </div>
              </div>
              <div className="h-2 w-full rounded bg-slate-800" />
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 px-5 py-16 text-center">
          <FileText size={44} className="mx-auto mb-4 text-slate-700" />
          <h3 className="text-base font-bold text-slate-100">
            {notes.length === 0 ? "No notes yet" : "No notes match your filters"}
          </h3>
          <p className="mt-2 text-[13px] text-slate-500">
            {notes.length === 0
              ? "Add study notes inside your courses via the Course Creator / Editor, or upload one directly."
              : "Try a different search term or status filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => {
            const st = STATUS_STYLE[note.status] || STATUS_STYLE.pending;
            return (
              <div
                key={note._id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-5 transition-colors hover:border-slate-700"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/10 text-violet-400">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-[15px] font-bold text-slate-100">{note.title}</h4>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {new Date(note.createdAt).toLocaleDateString()}
                      {note.courseTitle ? ` · ${note.courseTitle}` : " · General upload"}
                    </span>
                    {(note.subject || note.chapterTitle) && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {note.subject && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 truncate max-w-[150px]">
                            {note.subject}
                          </span>
                        )}
                        {note.chapterTitle && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[180px]">
                            {note.chapterTitle}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {note.description && (
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-slate-400">{note.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
                  <div
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${st.bg} ${st.text} ${st.border}`}
                  >
                    {st.label}
                  </div>

                  <div className="flex flex-wrap justify-end gap-1.5">
                    {isAdmin && note.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(note)}
                          className="flex items-center gap-1 rounded-lg bg-green-400/10 px-2.5 py-1.5 text-xs font-semibold text-green-400 transition-colors hover:bg-green-400/20"
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(note)}
                          className="flex items-center gap-1 rounded-lg bg-red-400/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-400/20"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEditClick(note)}
                      className="flex items-center gap-1 rounded-lg bg-amber-400/10 px-2.5 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-400/20 cursor-pointer"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-sky-400/10 px-2.5 py-1.5 text-xs font-semibold text-sky-400 no-underline transition-colors hover:bg-sky-400/20"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(note)}
                      className="rounded-lg bg-red-400/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-400/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {note.status === "rejected" && note.rejectedReason && (
                  <div className="rounded-lg bg-red-400/10 px-2.5 py-2 text-[11px] text-red-300">
                    Reason: {note.rejectedReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="w-full max-w-[650px] rounded-2xl border border-slate-800 bg-slate-950 p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-100">Upload Note</h3>
              <button onClick={closeModal} aria-label="Close" className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {isAdmin && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-400">Assign Instructor (Optional)</label>
                    <select
                      value={form.instructorId}
                      onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
                      disabled={!!form.courseId}
                      className={`w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-slate-100 outline-none focus:border-violet-600 ${form.courseId ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">-- Assign to yourself --</option>
                      {instructors.map((inst) => (
                        <option key={inst._id} value={inst._id}>
                          {inst.name || inst.email}
                        </option>
                      ))}
                    </select>
                    {form.courseId && <p className="mt-1 text-xs text-slate-500">Instructor is inherited from the selected course.</p>}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <label className="mb-2 block text-xs font-semibold text-slate-300">Assign to Course (Optional)</label>
                    
                    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-600"
                      />
                      <select
                        value={courseInstructor}
                        onChange={(e) => setCourseInstructor(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-600"
                      >
                        <option value="">Instructors (All)</option>
                        {uniqueCourseInstructors.map((inst, idx) => (
                          <option key={idx} value={inst}>{inst}</option>
                        ))}
                      </select>
                      <select
                        value={courseSubject}
                        onChange={(e) => setCourseSubject(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-600"
                      >
                        <option value="">Subjects (All)</option>
                        {uniqueCourseSubjects.map((sub, idx) => (
                          <option key={idx} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <select
                        value={courseClass}
                        onChange={(e) => setCourseClass(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-600"
                      >
                        <option value="">Classes (All)</option>
                        {uniqueCourseClasses.map((cls, idx) => (
                          <option key={idx} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    <select
                      value={form.courseId}
                      onChange={(e) => {
                        const newCourseId = e.target.value;
                        const c = courses.find((crs) => crs._id === newCourseId);
                        setForm({
                          ...form,
                          courseId: newCourseId,
                          subject: form.subject || c?.category || "",
                        });
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-violet-600"
                    >
                      <option value="">-- No Course (Standalone Note) --</option>
                      {filteredCourses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title} {c.instructor ? `(${c.instructor.name || c.instructor.email})` : ""}
                        </option>
                      ))}
                    </select>

                    {form.courseId && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-700/60">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Subject / Category in Course
                          </label>
                          <input
                            type="text"
                            list="upload-subjects-list"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            placeholder="e.g. Accounts, Physics..."
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-violet-600"
                          />
                          <datalist id="upload-subjects-list">
                            {uploadAvailableSubjects.map((s, idx) => (
                              <option key={idx} value={s} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Chapter / Unit in Course
                          </label>
                          <input
                            type="text"
                            list="upload-chapters-list"
                            value={form.chapterTitle}
                            onChange={(e) => setForm({ ...form, chapterTitle: e.target.value })}
                            placeholder="e.g. Chapter 1: Introduction..."
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-violet-600"
                          />
                          <datalist id="upload-chapters-list">
                            {uploadAvailableChapters.map((ch, idx) => (
                              <option key={idx} value={ch} />
                            ))}
                          </datalist>
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-2 mt-1">
                          <input
                            type="checkbox"
                            id="upload-add-curriculum"
                            checked={form.addToCurriculum}
                            onChange={(e) => setForm({ ...form, addToCurriculum: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-violet-500 cursor-pointer"
                          />
                          <label htmlFor="upload-add-curriculum" className="text-xs text-slate-300 cursor-pointer select-none">
                            Also insert note into course curriculum / lessons under this chapter
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Title (Optional)</label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Chapter 1: Introduction"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-slate-100 outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the notes..."
                  rows={3}
                  className="w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-slate-100 outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">File (PDF Only) *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,application/pdf"
                />

                {form.fileUrl ? (
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-3">
                    <div className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-green-400">
                      <FileText size={16} className="shrink-0" />
                      <span className="truncate">{uploadedFileName || "File uploaded"}</span>
                    </div>
                    <button
                      onClick={() => {
                        setForm({ ...form, fileUrl: "" });
                        setUploadedFileName("");
                      }}
                      className="shrink-0 text-xs font-semibold text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploadingFile && fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!uploadingFile) setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${uploadingFile ? "cursor-default" : "cursor-pointer"
                      } ${isDragging ? "border-violet-500 bg-violet-500/5" : "border-slate-800 bg-slate-900/60"}`}
                  >
                    {uploadingFile ? (
                      <div>
                        <div className="mb-2 text-[13px] font-semibold text-indigo-400">
                          Uploading {uploadProgress}%
                        </div>
                        <div className="h-1 w-full rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-indigo-400 transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={22} className="mx-auto mb-2 text-slate-500" />
                        <div className="text-[13px] font-medium text-slate-400">
                          Click to upload, or drag a file here
                        </div>
                        <div className="mt-1 text-[11px] text-slate-600">PDF, DOC, DOCX up to 10MB</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-2 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-slate-800 bg-transparent py-3 font-bold text-slate-300 transition-colors hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || uploadingFile}
                  className="flex-1 rounded-lg bg-violet-600 py-3 font-bold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Upload Modal ── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeBulkModal} />

          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden z-10">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FolderPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Bulk Upload Study Notes</h3>
                  <p className="text-xs text-slate-400">Select multiple PDF files, edit note details, and upload in batch.</p>
                </div>
              </div>
              <button
                onClick={closeBulkModal}
                disabled={bulkUploading}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Optional Global Course / Instructor Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Assign All to Course (Optional)
                  </label>
                  <select
                    value={bulkCourseId}
                    onChange={(e) => setBulkCourseId(e.target.value)}
                    disabled={bulkUploading}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-200 outline-none focus:border-emerald-500"
                  >
                    <option value="">Standalone Notes (No specific course)</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} ({c.category || "Class"})
                      </option>
                    ))}
                  </select>
                </div>

                {isAdmin && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                      Assigned Instructor (Admin)
                    </label>
                    <select
                      value={bulkInstructorId}
                      onChange={(e) => setBulkInstructorId(e.target.value)}
                      disabled={bulkUploading}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-200 outline-none focus:border-emerald-500"
                    >
                      <option value="">Default (Me)</option>
                      {instructors.map((inst) => (
                        <option key={inst._id} value={inst._id}>
                          {inst.name || inst.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Multi-File Upload Dropzone */}
              <input
                ref={bulkFileInputRef}
                type="file"
                multiple
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  handleBulkFilesSelect(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />

              <div
                onClick={() => !bulkUploading && bulkFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!bulkUploading) setIsBulkDragging(true);
                }}
                onDragLeave={() => setIsBulkDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsBulkDragging(false);
                  if (!bulkUploading) handleBulkFilesSelect(e.dataTransfer.files);
                }}
                className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                  bulkUploading ? "cursor-default" : "cursor-pointer"
                } ${
                  isBulkDragging
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                <FolderPlus size={32} className="mx-auto mb-3 text-emerald-400/80" />
                <h4 className="text-sm font-bold text-slate-200">
                  Select or Drag & Drop Multiple PDF Files
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Upload batch lecture notes, chapter summaries, formula sheets at once
                </p>
              </div>

              {/* Staged File List */}
              {bulkFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Files Queue ({bulkFiles.length})
                    </span>
                    {!bulkUploading && (
                      <button
                        onClick={() => setBulkFiles([])}
                        className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {bulkFiles.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <FileText size={18} className="text-emerald-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => updateBulkFileField(item.id, "title", e.target.value)}
                                disabled={bulkUploading}
                                placeholder="Note Title (Required)"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-emerald-500"
                              />
                              <span className="text-[10px] text-slate-500 block truncate mt-1">
                                File: {item.file?.name} ({(item.file?.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            </div>
                          </div>

                          {!bulkUploading && (
                            <button
                              onClick={() => removeBulkFile(item.id)}
                              className="text-slate-500 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Remove file"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        {/* Optional Description */}
                        <div>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateBulkFileField(item.id, "description", e.target.value)}
                            disabled={bulkUploading}
                            placeholder="Optional description (e.g. Chapter 1 revision summary)"
                            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Upload Progress Bar */}
                        {item.status === "uploading" && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-emerald-400">
                              <span>Uploading file…</span>
                              <span>{item.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-emerald-400 transition-all duration-200"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {item.status === "ready" && (
                          <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check size={12} /> Ready for batch save
                          </div>
                        )}

                        {item.status === "error" && (
                          <div className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                            <XCircle size={12} /> {item.errorMsg || "Upload error"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 p-4 bg-slate-950">
              <span className="text-xs text-slate-400">
                {bulkFiles.length} file{bulkFiles.length !== 1 ? "s" : ""} selected
              </span>

              <div className="flex gap-3">
                <button
                  onClick={closeBulkModal}
                  disabled={bulkUploading}
                  className="rounded-xl border border-slate-800 bg-transparent px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkSubmit}
                  disabled={bulkUploading || bulkFiles.length === 0}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {bulkUploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Batch Uploading…</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      <span>Upload All ({bulkFiles.length} Notes)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Note & Course Assignment Modal ── */}
      {showEditModal && editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeEditModal} />

          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden z-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Edit Study Note & Course</h3>
                  <p className="text-xs text-slate-400">Update note title, description, assign to a course chapter/subject, or replace the attached PDF.</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                disabled={editSaving || editUploadingFile}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Current Assignment Status Pill */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block font-medium">Current Assignment:</span>
                  <span className="text-amber-400 font-bold">
                    {editingNote.courseTitle ? `📚 ${editingNote.courseTitle}` : "📄 Standalone Note (General Upload)"}
                  </span>
                </div>
                <span className="text-slate-500 text-[11px]">
                  Created: {new Date(editingNote.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Course Assignment Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  Assign / Move to Course
                </label>
                <p className="text-[11px] text-slate-400">
                  Choose which course this study note belongs to so students enrolled in that class can access it.
                </p>

                {/* Quick Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={editCourseSearch}
                      onChange={(e) => setEditCourseSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <select
                    value={editCourseSubject}
                    onChange={(e) => setEditCourseSubject(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-amber-500"
                  >
                    <option value="">All Categories</option>
                    {uniqueCourseSubjects.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={editCourseClass}
                    onChange={(e) => setEditCourseClass(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-amber-500"
                  >
                    <option value="">All Classes/Boards</option>
                    {uniqueCourseClasses.map((cls, idx) => (
                      <option key={idx} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                {/* Course Dropdown */}
                <select
                  value={editForm.courseId}
                  onChange={(e) => {
                    const newCourseId = e.target.value;
                    const c = courses.find((crs) => crs._id === newCourseId);
                    setEditForm({
                      ...editForm,
                      courseId: newCourseId,
                      subject: editForm.subject || c?.category || "",
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                >
                  <option value="">-- No Course (Standalone General Study Note) --</option>
                  {filteredEditCourses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} • {c.category || c.board || "Course"} {c.instructor ? `(${c.instructor.name || c.instructor.email})` : ""}
                    </option>
                  ))}
                </select>

                {/* Subject & Chapter Selection inside selected Course */}
                {editForm.courseId && (
                  <div className="mt-3 p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <BookOpen size={15} />
                      <span>Course Subject & Chapter Placement</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Subject / Stream in Course *
                        </label>
                        <input
                          type="text"
                          list="edit-subjects-list"
                          value={editForm.subject}
                          onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                          placeholder="e.g. Accounts, Physics, Chemistry..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                        />
                        <datalist id="edit-subjects-list">
                          {editCourseAvailableSubjects.map((s, idx) => (
                            <option key={idx} value={s} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Chapter / Unit in Course *
                        </label>
                        <input
                          type="text"
                          list="edit-chapters-list"
                          value={editForm.chapterTitle}
                          onChange={(e) => setEditForm({ ...editForm, chapterTitle: e.target.value })}
                          placeholder="e.g. Chapter 1: Introduction..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                        />
                        <datalist id="edit-chapters-list">
                          {editCourseAvailableChapters.map((ch, idx) => (
                            <option key={idx} value={ch} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="edit-add-curriculum"
                        checked={editForm.addToCurriculum}
                        onChange={(e) => setEditForm({ ...editForm, addToCurriculum: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                      <label htmlFor="edit-add-curriculum" className="text-xs text-slate-300 cursor-pointer select-none">
                        Also add note into course curriculum / lessons under this chapter
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Note Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="e.g. Chapter 1: Introduction & Notes"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none focus:border-amber-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Brief summary or topic notes..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Attached PDF Document */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Attached PDF Document *
                </label>

                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={(e) => doEditUpload(e.target.files?.[0])}
                  className="hidden"
                  accept=".pdf,application/pdf"
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={18} className="text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">
                        {editUploadedFileName || "Current Attached Document"}
                      </p>
                      {editForm.fileUrl && (
                        <a
                          href={editForm.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>View PDF document</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => !editUploadingFile && editFileInputRef.current?.click()}
                    disabled={editUploadingFile}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {editUploadingFile ? `Uploading ${editUploadProgress}%...` : "Replace PDF"}
                  </button>
                </div>

                {editUploadingFile && (
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-200"
                      style={{ width: `${editUploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 p-4 bg-slate-950">
              <button
                onClick={closeEditModal}
                disabled={editSaving || editUploadingFile}
                className="rounded-xl border border-slate-800 bg-transparent px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving || editUploadingFile}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {editSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Save & Reassign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Batch Assign Course Modal ── */}
      {showBatchAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !batchAssigning && setShowBatchAssignModal(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Batch Assign to Course</h3>
                  <p className="text-xs text-slate-400">
                    Assign {selectedNoteIds.length} selected note(s) to a course, subject, and chapter at once.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchAssignModal(false)}
                disabled={batchAssigning}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Target Course *
                </label>
                <select
                  value={batchTargetCourseId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    const c = courses.find((crs) => crs._id === newId);
                    setBatchTargetCourseId(newId);
                    setBatchSubject(batchSubject || c?.category || "");
                  }}
                  disabled={batchAssigning}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-500"
                >
                  <option value="">-- No Course (Convert to Standalone General Notes) --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} ({c.category || c.board || "Course"})
                    </option>
                  ))}
                </select>
              </div>

              {batchTargetCourseId && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Subject / Stream
                      </label>
                      <input
                        type="text"
                        list="batch-subjects-list"
                        value={batchSubject}
                        onChange={(e) => setBatchSubject(e.target.value)}
                        placeholder="e.g. Accounts, Physics..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
                      />
                      <datalist id="batch-subjects-list">
                        {batchAvailableSubjects.map((s, idx) => (
                          <option key={idx} value={s} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Chapter / Unit
                      </label>
                      <input
                        type="text"
                        list="batch-chapters-list"
                        value={batchChapterTitle}
                        onChange={(e) => setBatchChapterTitle(e.target.value)}
                        placeholder="e.g. Chapter 1: Introduction..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
                      />
                      <datalist id="batch-chapters-list">
                        {batchAvailableChapters.map((ch, idx) => (
                          <option key={idx} value={ch} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="batch-add-curriculum"
                      checked={batchAddToCurriculum}
                      onChange={(e) => setBatchAddToCurriculum(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                    <label htmlFor="batch-add-curriculum" className="text-xs text-slate-300 cursor-pointer select-none">
                      Also insert notes into course curriculum / lessons under this chapter
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBatchAssignModal(false)}
                disabled={batchAssigning}
                className="rounded-xl border border-slate-800 bg-transparent px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssignCourseSubmit}
                disabled={batchAssigning}
                className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold px-5 py-2 text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-600/20"
              >
                {batchAssigning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Assign {selectedNoteIds.length} Notes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}