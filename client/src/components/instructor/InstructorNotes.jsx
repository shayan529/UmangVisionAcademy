import { useState, useEffect, useRef } from "react";
import api from "../../config/api";
import { Toast } from "./InstructorUi";
import { uploadFile } from "../../utils/uploadFile";
import { FileText, Plus, X, Upload } from "lucide-react";

export default function InstructorNotes({ showToast }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    fileUrl: "",
  });

  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/notes?mine=1");
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast?.(error.response?.data?.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setUploadProgress(0);
      const data = await uploadFile({
        file,
        folder: "/notes",
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      setForm((prev) => ({ ...prev, fileUrl: data.url }));
    } catch (error) {
      showToast?.("File upload failed");
    } finally {
      setUploadingFile(false);
    }
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
      setShowModal(false);
      setForm({ title: "", description: "", fileUrl: "" });
      showToast?.("Note uploaded successfully and is pending approval.");
    } catch (error) {
      showToast?.(error.response?.data?.message || "Failed to upload note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter((n) => n._id !== id));
      showToast?.("Note deleted");
    } catch (error) {
      showToast?.("Failed to delete note");
    }
  };

  const statusStyle = (status) => {
    switch (status) {
      case "approved":
        return { bg: "#052e16", text: "#4ade80", border: "#166534", label: "Approved" };
      case "rejected":
        return { bg: "#2d0a0a", text: "#f87171", border: "#7f1d1d", label: "Rejected" };
      default:
        return { bg: "#1c1a00", text: "#fbbf24", border: "#854d0e", label: "Pending" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9" }}>Study Notes</h2>
          <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>
            Study notes and documents uploaded for your courses.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "#94a3b8", padding: 20 }}>Loading...</div>
      ) : notes.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "#0b1120", border: "1px dashed #1e293b", borderRadius: 16
        }}>
          <FileText size={48} color="#334155" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, color: "#f1f5f9", fontWeight: 700 }}>No notes found</h3>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
            Add study notes inside your courses via the Course Creator / Editor.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {notes.map((note) => {
            const st = statusStyle(note.status);
            return (
              <div key={note._id} style={{
                background: "#0b1120", border: "1px solid #1e293b",
                borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: "rgba(124, 58, 237, 0.1)", color: "#7c3aed",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                        {note.title}
                      </h4>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {note.description && (
                  <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
                    {note.description}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 12, borderTop: "1px solid #1e293b" }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, padding: "4px 10px",
                    borderRadius: 20, background: st.bg, color: st.text, border: `1px solid ${st.border}`
                  }}>
                    {st.label}
                  </div>
                  
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={note.fileUrl} target="_blank" rel="noreferrer" style={{
                      fontSize: 12, fontWeight: 600, color: "#38bdf8", textDecoration: "none",
                      padding: "6px 12px", borderRadius: 8, background: "rgba(56,189,248,0.1)"
                    }}>
                      View
                    </a>
                    <button onClick={() => handleDelete(note._id)} style={{
                      fontSize: 12, fontWeight: 600, color: "#f87171", border: "none",
                      padding: "6px 12px", borderRadius: 8, background: "rgba(248,113,113,0.1)", cursor: "pointer"
                    }}>
                      Delete
                    </button>
                  </div>
                </div>
                {note.status === "rejected" && note.rejectedReason && (
                   <div style={{ marginTop: 8, padding: 8, background: "rgba(248,113,113,0.1)", borderRadius: 8, fontSize: 11, color: "#fca5a5" }}>
                     Reason: {note.rejectedReason}
                   </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(2,8,23,0.8)", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#0b1120", border: "1px solid #1e293b", borderRadius: 20,
            width: "100%", maxWidth: 500, padding: 24
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Upload Note</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>Title *</label>
                <input
                  type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Chapter 1: Introduction"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10, background: "#111827",
                    border: "1px solid #1e293b", color: "#f1f5f9", outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>Description</label>
                <textarea
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the notes..."
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10, background: "#111827",
                    border: "1px solid #1e293b", color: "#f1f5f9", outline: "none", boxSizing: "border-box", resize: "vertical"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>File (PDF/Document) *</label>
                <input
                  type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }}
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                />
                
                {form.fileUrl ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "#111827", border: "1px solid #1e293b", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#4ade80", fontSize: 13, fontWeight: 600 }}>
                      <FileText size={16} /> File Uploaded
                    </div>
                    <button onClick={() => setForm({...form, fileUrl: ""})} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => !uploadingFile && fileInputRef.current?.click()}
                    style={{
                      border: "2px dashed #1e293b", borderRadius: 12, padding: 24, textAlign: "center",
                      cursor: uploadingFile ? "default" : "pointer", background: "#0d1526"
                    }}
                  >
                    {uploadingFile ? (
                      <div>
                        <div style={{ color: "#818cf8", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Uploading {uploadProgress}%</div>
                        <div style={{ width: "100%", height: 4, background: "#1e293b", borderRadius: 2 }}>
                           <div style={{ width: `${uploadProgress}%`, height: "100%", background: "#818cf8", borderRadius: 2 }} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} color="#64748b" style={{ margin: "0 auto 8px" }} />
                        <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Click to upload file</div>
                        <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>PDF, DOC, DOCX up to 10MB</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: 10, background: "transparent", border: "1px solid #1e293b", color: "#cbd5e1", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || uploadingFile}
                  style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#7c3aed", border: "none", color: "#fff", fontWeight: 700, cursor: saving || uploadingFile ? "not-allowed" : "pointer", opacity: saving || uploadingFile ? 0.7 : 1 }}
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
