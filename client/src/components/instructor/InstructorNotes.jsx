import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchUsers } from "../../redux/slices/usersSlice";
import { fetchAllCoursesAdmin, fetchCourses } from "../../redux/slices/courseSlice";
import api from "../../config/api";
import { Toast } from "./InstructorUi";
import { uploadFile } from "../../utils/uploadFile";
import { FileText, Plus, X, Upload, Search, Check, XCircle } from "lucide-react";

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
  const [isDragging, setIsDragging] = useState(false);

  const filteredNotes = notes.filter((n) => {
    const matchesStatus = statusFilter === "all" || n.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      n.title?.toLowerCase().includes(q) ||
      n.description?.toLowerCase().includes(q) ||
      n.courseTitle?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const [form, setForm] = useState({ title: "", description: "", fileUrl: "", instructorId: "", courseId: "" });

  const [courseSearch, setCourseSearch] = useState("");
  const [courseInstructor, setCourseInstructor] = useState("");
  const [courseSubject, setCourseSubject] = useState("");
  const [courseClass, setCourseClass] = useState("");

  // Derived filter options for courses
  const uniqueCourseSubjects = [...new Set(courses.map(c => c.category).filter(Boolean))];
  const uniqueCourseClasses = [...new Set(courses.map(c => c.board).filter(Boolean))]; // assuming 'board' or 'category' might be used for classes, or we just map everything to category
  const uniqueCourseInstructors = [...new Set(courses.map(c => c.instructor?.name || c.instructor?.email).filter(Boolean))];

  const filteredCourses = courses.filter((c) => {
    const q = courseSearch.toLowerCase();
    const matchesSearch = c.title?.toLowerCase().includes(q);
    const matchesInstructor = courseInstructor ? (c.instructor?.name === courseInstructor || c.instructor?.email === courseInstructor) : true;
    const matchesSubject = courseSubject ? c.category === courseSubject : true;
    const matchesClass = courseClass ? c.board === courseClass : true; // Assuming class maps to board, wait let's adjust this later if needed
    return matchesSearch && matchesInstructor && matchesSubject && matchesClass;
  });

  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");

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
      setForm((prev) => ({ ...prev, fileUrl: data.url }));
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
    if (!form.title.trim()) {
      showToast?.("Title is required");
      return;
    }
    if (!form.fileUrl) {
      showToast?.("A file is required");
      return;
    }

    try {
      setSaving(true);
      const { data } = await api.post("/notes", form);
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

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500 active:bg-violet-700"
          >
            <Plus size={18} /> Upload Note
          </button>
        </div>
      </div>

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
                  <div className="min-w-0">
                    <h4 className="truncate text-[15px] font-bold text-slate-100">{note.title}</h4>
                    <span className="text-[11px] text-slate-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                      {note.courseTitle ? ` · ${note.courseTitle}` : " · General upload"}
                    </span>
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
                      onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-violet-600"
                    >
                      <option value="">-- No Course (Standalone Note) --</option>
                      {filteredCourses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title} {c.instructor ? `(${c.instructor.name || c.instructor.email})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Title *</label>
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
    </div>
  );
}