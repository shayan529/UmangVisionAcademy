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
  approved: { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30", label: "Approved" },
  rejected: { bg: "bg-rose-500/15", text: "text-rose-300", border: "border-rose-500/30", label: "Rejected" },
  pending: { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30", label: "Pending" },
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
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Study Notes</h2>
          <p className="mt-1 text-sm text-slate-300">Study notes, lecture slides, and PDF documents uploaded for your courses.</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-[220px]">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-8 text-sm text-white placeholder:text-slate-400 outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="grid grid-cols-4 sm:flex items-center rounded-xl border border-slate-700 bg-slate-900 p-1 w-full sm:w-auto">
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-2 sm:px-3.5 py-2 text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center truncate ${
                  statusFilter === tab.id
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-200 w-full sm:w-auto">
            <ArrowUpDown size={14} className="text-emerald-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer w-full"
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

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowBulkModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:from-emerald-400 hover:to-teal-500 active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            >
              <FolderPlus size={16} /> Bulk Upload
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-95 cursor-pointer shadow-lg shadow-violet-600/20 whitespace-nowrap"
            >
              <Plus size={16} /> Upload Note
            </button>
          </div>
        </div>
      </div>

      {/* Subject Filter Pills */}
      {notes.length > 0 && (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full pt-1 pb-1">
          {subjectTabs.map((tab) => {
            const isActive = selectedSubject === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setSelectedSubject(tab.name)}
                className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border shadow-sm ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white border-cyan-400/60 shadow-md shadow-cyan-500/30 scale-[1.01]"
                    : "bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700 hover:bg-slate-800/80"
                }`}
              >
                <span className="truncate">{tab.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 ml-1.5 ${
                    isActive
                      ? "bg-white/20 text-white backdrop-blur-md"
                      : "bg-slate-950 text-slate-400 border border-slate-800"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selection Control & Bulk Action Bar */}
      {!loading && filteredNotes.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 shadow-sm">
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Select All Visible ({filteredNotes.length})</span>
            </label>

            {selectedNoteIds.length > 0 && (
              <span className="text-xs font-bold text-emerald-400">
                {selectedNoteIds.length} of {filteredNotes.length} selected
              </span>
            )}
          </div>

          {selectedNoteIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/40 bg-gradient-to-r from-slate-900 via-violet-950/70 to-slate-900 p-4 shadow-xl backdrop-blur-xl animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-xs font-black text-white shadow-md">
                  {selectedNoteIds.length}
                </span>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {selectedNoteIds.length} Note{selectedNoteIds.length !== 1 ? "s" : ""} Selected
                  </span>
                  <span className="text-[11px] text-slate-300 font-medium">
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
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      <Check size={14} /> Approve All ({selectedNoteIds.length})
                    </button>
                    <button
                      onClick={() => handleBatchAction("reject")}
                      disabled={bulkActioning}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-3.5 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      <XCircle size={14} /> Reject All ({selectedNoteIds.length})
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowBatchAssignModal(true)}
                  disabled={bulkActioning}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <BookOpen size={14} /> Assign Course ({selectedNoteIds.length})
                </button>
                <button
                  onClick={() => handleBatchAction("delete")}
                  disabled={bulkActioning}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <Trash2 size={14} /> Delete All ({selectedNoteIds.length})
                </button>
                <button
                  onClick={() => setSelectedNoteIds([])}
                  className="rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white cursor-pointer transition-colors"
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
            <div key={i} className="animate-pulse rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-slate-800" />
                  <div className="h-2.5 w-1/2 rounded bg-slate-800" />
                </div>
              </div>
              <div className="h-2 w-full rounded bg-slate-800" />
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-5 py-16 text-center">
          <FileText size={44} className="mx-auto mb-4 text-slate-500" />
          <h3 className="text-base font-bold text-white">
            {notes.length === 0 ? "No notes yet" : "No notes match your filters"}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            {notes.length === 0
              ? "Add study notes inside your courses via the Course Creator / Editor, or upload one directly."
              : "Try a different search term or status filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => {
            const st = STATUS_STYLE[note.status] || STATUS_STYLE.pending;
            const isSelected = selectedNoteIds.includes(note._id);
            return (
              <div
                key={note._id}
                className={`flex flex-col gap-3.5 rounded-2xl border transition-all p-5 shadow-lg ${
                  isSelected
                    ? "border-violet-500 bg-slate-900/95 ring-2 ring-violet-500/30"
                    : "border-slate-700/80 bg-slate-900/90 hover:border-slate-500 hover:shadow-xl hover:shadow-black/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleNoteSelection(note._id)}
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-violet-600 focus:ring-violet-500 cursor-pointer shrink-0"
                  />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-bold text-white">{note.title}</h4>
                    <span className="text-xs text-slate-300 block truncate mt-0.5">
                      {new Date(note.createdAt).toLocaleDateString()}
                      {note.courseTitle ? ` · ${note.courseTitle}` : " · Standalone note"}
                    </span>
                    {(note.subject || note.chapterTitle) && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {note.subject && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 truncate max-w-[150px]">
                            {note.subject}
                          </span>
                        )}
                        {note.chapterTitle && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-600 truncate max-w-[180px]">
                            {note.chapterTitle}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {note.description && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-300">{note.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-700/80 pt-3">
                  <div
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${st.bg} ${st.text} ${st.border}`}
                  >
                    {st.label}
                  </div>

                  <div className="flex flex-wrap justify-end gap-1.5">
                    {isAdmin && note.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(note)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/30 cursor-pointer"
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(note)}
                          className="flex items-center gap-1 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1.5 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-500/30 cursor-pointer"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEditClick(note)}
                      className="flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1.5 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500/30 cursor-pointer"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-sky-500/15 border border-sky-500/30 px-2.5 py-1.5 text-xs font-bold text-sky-300 no-underline transition-colors hover:bg-sky-500/30"
                    >
                      <span>View</span>
                      <ExternalLink size={11} />
                    </a>
                    <button
                      onClick={() => handleDelete(note)}
                      className="rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1.5 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-500/30 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {note.status === "rejected" && note.rejectedReason && (
                  <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-300 font-medium">
                    Reason: {note.rejectedReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Upload Note Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-2xl my-auto flex flex-col rounded-2xl sm:rounded-3xl border border-slate-700 bg-slate-900 shadow-[0_25px_70px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4.5 bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 border border-violet-500/30 shadow-inner">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Upload Study Note</h3>
                  <p className="text-xs text-slate-300">Add a new PDF note to your course or standalone library.</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4.5 bg-[#0b1120]/60 custom-scrollbar">
              {isAdmin && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-200 uppercase tracking-wide">
                      Assign Instructor (Optional)
                    </label>
                    <select
                      value={form.instructorId}
                      onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
                      disabled={!!form.courseId}
                      className={`w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-2.5 text-sm text-white font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all ${
                        form.courseId ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="">-- Assign to yourself --</option>
                      {instructors.map((inst) => (
                        <option key={inst._id} value={inst._id}>
                          {inst.name || inst.email}
                        </option>
                      ))}
                    </select>
                    {form.courseId && <p className="mt-1 text-xs text-slate-400">Instructor is inherited from the selected course.</p>}
                  </div>

                  <div className="rounded-2xl border border-slate-700/80 bg-slate-950/70 p-4.5 space-y-3">
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wide">
                      Assign to Course (Optional)
                    </label>
                    
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:border-violet-400"
                      />
                      <select
                        value={courseInstructor}
                        onChange={(e) => setCourseInstructor(e.target.value)}
                        className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-400"
                      >
                        <option value="">Instructors (All)</option>
                        {uniqueCourseInstructors.map((inst, idx) => (
                          <option key={idx} value={inst}>{inst}</option>
                        ))}
                      </select>
                      <select
                        value={courseSubject}
                        onChange={(e) => setCourseSubject(e.target.value)}
                        className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-400"
                      >
                        <option value="">Subjects (All)</option>
                        {uniqueCourseSubjects.map((sub, idx) => (
                          <option key={idx} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <select
                        value={courseClass}
                        onChange={(e) => setCourseClass(e.target.value)}
                        className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-400"
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
                      className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-xs text-white font-medium outline-none focus:border-violet-400"
                    >
                      <option value="">-- No Course (Standalone Note) --</option>
                      {filteredCourses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title} {c.instructor ? `(${c.instructor.name || c.instructor.email})` : ""}
                        </option>
                      ))}
                    </select>

                    {form.courseId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-700/60">
                        <div>
                          <label className="block text-xs font-semibold text-slate-200 mb-1">
                            Subject / Category in Course
                          </label>
                          <input
                            type="text"
                            list="upload-subjects-list"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            placeholder="e.g. Accounts, Physics..."
                            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:border-violet-400"
                          />
                          <datalist id="upload-subjects-list">
                            {uploadAvailableSubjects.map((s, idx) => (
                              <option key={idx} value={s} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-200 mb-1">
                            Chapter / Unit in Course
                          </label>
                          <input
                            type="text"
                            list="upload-chapters-list"
                            value={form.chapterTitle}
                            onChange={(e) => setForm({ ...form, chapterTitle: e.target.value })}
                            placeholder="e.g. Chapter 1: Introduction..."
                            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:border-violet-400"
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
                            className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-violet-600 focus:ring-violet-500 cursor-pointer"
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
                <label className="mb-1.5 block text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Title (Optional - defaults to file name)
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Chapter 1: Introduction"
                  className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-2.5 text-sm text-white font-medium placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the notes..."
                  rows={3}
                  className="w-full resize-y rounded-xl border border-slate-600 bg-slate-950 px-4 py-2.5 text-sm text-white font-medium placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-200 uppercase tracking-wide">
                  File (PDF Only) *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,application/pdf"
                />

                {form.fileUrl ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-slate-800/90 p-4 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3 text-sm font-bold text-emerald-400">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                        <FileText size={18} className="shrink-0" />
                      </div>
                      <span className="truncate text-white">{uploadedFileName || "File uploaded"}</span>
                    </div>
                    <button
                      onClick={() => {
                        setForm({ ...form, fileUrl: "" });
                        setUploadedFileName("");
                      }}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
                    className={`rounded-2xl border-2 border-dashed p-7 text-center transition-all ${
                      uploadingFile ? "cursor-default" : "cursor-pointer"
                    } ${isDragging ? "border-violet-400 bg-violet-500/10" : "border-slate-600 bg-slate-950/60 hover:border-violet-400 hover:bg-slate-950/90"}`}
                  >
                    {uploadingFile ? (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-violet-300">
                          Uploading PDF… {uploadProgress}%
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={26} className="mx-auto mb-2 text-violet-400" />
                        <div className="text-sm font-bold text-slate-200">
                          Click to upload, or drag PDF file here
                        </div>
                        <div className="mt-1 text-xs text-slate-400">PDF documents up to 50MB</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-6 py-4 bg-slate-900 shrink-0">
              <button
                onClick={closeModal}
                className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || uploadingFile}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-600/25"
              >
                {saving ? "Saving..." : "Upload Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Upload Modal ── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={closeBulkModal} />

          <div className="relative z-10 w-full max-w-3xl my-auto flex flex-col rounded-2xl sm:rounded-3xl border border-slate-700 bg-slate-900 shadow-[0_25px_70px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4.5 bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-inner">
                  <FolderPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Bulk Upload Study Notes</h3>
                  <p className="text-xs text-slate-300">Select multiple PDF files, edit note details, and upload in batch.</p>
                </div>
              </div>
              <button
                onClick={closeBulkModal}
                disabled={bulkUploading}
                className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0b1120]/60 custom-scrollbar">
              {/* Optional Global Course / Instructor Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-200 uppercase tracking-wide">
                    Assign All to Course (Optional)
                  </label>
                  <select
                    value={bulkCourseId}
                    onChange={(e) => setBulkCourseId(e.target.value)}
                    disabled={bulkUploading}
                    className="w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-xs text-white font-medium outline-none focus:border-emerald-400"
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
                    <label className="mb-1.5 block text-xs font-bold text-slate-200 uppercase tracking-wide">
                      Assigned Instructor (Admin)
                    </label>
                    <select
                      value={bulkInstructorId}
                      onChange={(e) => setBulkInstructorId(e.target.value)}
                      disabled={bulkUploading}
                      className="w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-xs text-white font-medium outline-none focus:border-emerald-400"
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
                className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                  bulkUploading ? "cursor-default" : "cursor-pointer"
                } ${
                  isBulkDragging
                    ? "border-emerald-400 bg-emerald-500/10"
                    : "border-slate-600 bg-slate-950/60 hover:border-emerald-400 hover:bg-slate-950/90"
                }`}
              >
                <FolderPlus size={34} className="mx-auto mb-3 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  Select or Drag & Drop Multiple PDF Files
                </h4>
                <p className="text-xs text-slate-300 mt-1 font-medium">
                  Upload batch lecture notes, chapter summaries, and revision sheets all at once
                </p>
              </div>

              {/* Staged File List */}
              {bulkFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Files Queue ({bulkFiles.length})
                    </span>
                    {!bulkUploading && (
                      <button
                        onClick={() => setBulkFiles([])}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {bulkFiles.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-slate-700/80 bg-slate-950/80 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                              <FileText size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => updateBulkFileField(item.id, "title", e.target.value)}
                                disabled={bulkUploading}
                                placeholder="Note Title (Required)"
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-emerald-400"
                              />
                              <span className="text-[11px] text-slate-400 font-medium block truncate mt-1">
                                File: {item.file?.name} ({(item.file?.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            </div>
                          </div>

                          {!bulkUploading && (
                            <button
                              onClick={() => removeBulkFile(item.id)}
                              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
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
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 outline-none focus:border-emerald-400"
                          />
                        </div>

                        {/* Upload Progress Bar */}
                        {item.status === "uploading" && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-emerald-400">
                              <span>Uploading file…</span>
                              <span>{item.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-400 transition-all duration-200"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {item.status === "ready" && (
                          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <Check size={14} /> Ready for batch save
                          </div>
                        )}

                        {item.status === "error" && (
                          <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                            <XCircle size={14} /> {item.errorMsg || "Upload error"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-6 py-4 bg-slate-900 shrink-0">
              <span className="text-xs font-bold text-slate-300 mr-auto">
                {bulkFiles.length} file{bulkFiles.length !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={closeBulkModal}
                disabled={bulkUploading}
                className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={bulkUploading || bulkFiles.length === 0}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-xs font-bold text-white hover:from-emerald-400 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
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
      )}

      {/* ── Edit Note & Course Assignment Modal ── */}
      {showEditModal && editingNote && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={closeEditModal} />

          <div className="relative z-10 w-full max-w-2xl my-auto flex flex-col rounded-2xl sm:rounded-3xl border border-slate-700 bg-slate-900 shadow-[0_25px_70px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4.5 bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-inner">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Edit Study Note & Course</h3>
                  <p className="text-xs text-slate-300">Update note title, description, assign to a course chapter/subject, or replace the attached PDF.</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                disabled={editSaving || editUploadingFile}
                className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0b1120]/60 custom-scrollbar">
              {/* Current Assignment Status Pill */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-800/90 border border-amber-500/40 p-4 rounded-2xl text-xs shadow-inner">
                <div className="space-y-1">
                  <span className="text-slate-300 block font-bold text-[11px] uppercase tracking-wider">Current Assignment:</span>
                  <span className="text-amber-300 font-extrabold text-sm block">
                    {editingNote.courseTitle ? `📚 ${editingNote.courseTitle}` : "📄 Standalone Note (General Upload)"}
                  </span>
                </div>
                <span className="text-slate-300 text-xs font-semibold bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  Created: {new Date(editingNote.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Course Assignment Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Assign / Move to Course
                </label>
                <p className="text-xs text-slate-300">
                  Choose which course this study note belongs to so students enrolled in that class can access it.
                </p>

                {/* Quick Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={editCourseSearch}
                      onChange={(e) => setEditCourseSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-600 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:border-amber-400"
                    />
                  </div>
                  <select
                    value={editCourseSubject}
                    onChange={(e) => setEditCourseSubject(e.target.value)}
                    className="bg-slate-950 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
                  >
                    <option value="">All Categories</option>
                    {uniqueCourseSubjects.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={editCourseClass}
                    onChange={(e) => setEditCourseClass(e.target.value)}
                    className="bg-slate-950 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400"
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
                  className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-2.5 text-xs text-white font-medium outline-none focus:border-amber-400"
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
                  <div className="mt-3 p-4.5 rounded-2xl border border-slate-700/80 bg-slate-950/70 space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <BookOpen size={16} />
                      <span>Course Subject & Chapter Placement</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-200 mb-1">
                          Subject / Stream in Course *
                        </label>
                        <input
                          type="text"
                          list="edit-subjects-list"
                          value={editForm.subject}
                          onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                          placeholder="e.g. Accounts, Physics, Chemistry..."
                          className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:border-amber-400"
                        />
                        <datalist id="edit-subjects-list">
                          {editCourseAvailableSubjects.map((s, idx) => (
                            <option key={idx} value={s} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-200 mb-1">
                          Chapter / Unit in Course *
                        </label>
                        <input
                          type="text"
                          list="edit-chapters-list"
                          value={editForm.chapterTitle}
                          onChange={(e) => setEditForm({ ...editForm, chapterTitle: e.target.value })}
                          placeholder="e.g. Chapter 1: Introduction..."
                          className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:border-amber-400"
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
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                      <label htmlFor="edit-add-curriculum" className="text-xs font-medium text-slate-200 cursor-pointer select-none">
                        Also add note into course curriculum / lessons under this chapter
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Note Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="e.g. Chapter 1: Introduction & Notes"
                  className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white font-medium placeholder:text-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Brief summary or topic notes..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all resize-none"
                />
              </div>

              {/* Attached PDF Document */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Attached PDF Document *
                </label>

                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={(e) => doEditUpload(e.target.files?.[0])}
                  className="hidden"
                  accept=".pdf,application/pdf"
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/90 border border-emerald-500/30 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {editUploadedFileName || "Current Attached Document"}
                      </p>
                      {editForm.fileUrl && (
                        <a
                          href={editForm.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-sky-300 hover:text-sky-200 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>View PDF document</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => !editUploadingFile && editFileInputRef.current?.click()}
                    disabled={editUploadingFile}
                    className="px-4 py-2 rounded-xl border border-slate-600 bg-slate-900 text-xs font-bold text-slate-100 hover:bg-slate-700 hover:text-white transition-colors shrink-0 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {editUploadingFile ? `Uploading ${editUploadProgress}%...` : "Replace PDF"}
                  </button>
                </div>

                {editUploadingFile && (
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-200"
                      style={{ width: `${editUploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-6 py-4 bg-slate-900 shrink-0">
              <button
                onClick={closeEditModal}
                disabled={editSaving || editUploadingFile}
                className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving || editUploadingFile}
                className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black px-6 py-2.5 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98]"
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => !batchAssigning && setShowBatchAssignModal(false)}
          />

          <div className="relative z-10 w-full max-w-lg my-auto flex flex-col rounded-2xl sm:rounded-3xl border border-slate-700 bg-slate-900 shadow-[0_25px_70px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4.5 bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Batch Assign to Course</h3>
                  <p className="text-xs text-slate-300">
                    Assign {selectedNoteIds.length} selected note(s) to a course, subject, and chapter.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchAssignModal(false)}
                disabled={batchAssigning}
                className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0b1120]/60 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wide mb-1.5">
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
                  className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-2.5 text-xs text-white font-medium outline-none focus:border-violet-400"
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
                <div className="space-y-3.5 p-4.5 rounded-2xl border border-slate-700/80 bg-slate-950/70">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">
                        Subject / Stream
                      </label>
                      <input
                        type="text"
                        list="batch-subjects-list"
                        value={batchSubject}
                        onChange={(e) => setBatchSubject(e.target.value)}
                        placeholder="e.g. Accounts, Physics..."
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:border-violet-400"
                      />
                      <datalist id="batch-subjects-list">
                        {batchAvailableSubjects.map((s, idx) => (
                          <option key={idx} value={s} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">
                        Chapter / Unit
                      </label>
                      <input
                        type="text"
                        list="batch-chapters-list"
                        value={batchChapterTitle}
                        onChange={(e) => setBatchChapterTitle(e.target.value)}
                        placeholder="e.g. Chapter 1: Introduction..."
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:border-violet-400"
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
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500 cursor-pointer"
                    />
                    <label htmlFor="batch-add-curriculum" className="text-xs font-medium text-slate-200 cursor-pointer select-none">
                      Also insert notes into course curriculum / lessons under this chapter
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-6 py-4 bg-slate-900 shrink-0">
              <button
                onClick={() => setShowBatchAssignModal(false)}
                disabled={batchAssigning}
                className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssignCourseSubmit}
                disabled={batchAssigning}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-600/25"
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