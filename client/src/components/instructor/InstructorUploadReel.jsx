import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createReel } from "../../redux/slices/reelsSlice";
import { uploadFile } from "../../utils/uploadFile";

// ── Brand tokens (matches the AI Tutor's purple → cyan identity) ────────────
const ACCENT_GRADIENT = "linear-gradient(135deg,#7c3aed,#06b6d4)";
const BG = "#0a0a0a";
const CARD = "#111111";
const BORDER = "#1f1f1f";
const BORDER_HOVER = "#2a2a2a";
const TEXT = "#ffffff";
const MUTED = "#8a8a8a";
const SUBTLE = "#4a4a4a";

// ── Icons (inline, no extra dependency) ──────────────────────────────────────
const IconPlay = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M8 5v14l11-7z" />
  </svg>
);
const IconUpload = (props) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3v12" />
    <path d="M7 8l5-5 5 5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);
const IconClose = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const InstructorUploadReel = ({ onClose }) => {
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const applyFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setUploadError("Please choose a video file.");
      return;
    }
    setUploadError("");
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleFileInput = (e) => applyFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      setUploadError("Select a video file first.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const data = await uploadFile({
        file,
        folder: "instructor-reels"
      });

      // create reel
      await dispatch(createReel({ title, videoUrl: data.url })).unwrap();
      onClose();
    } catch (err) {
      setUploadError(err.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: BG,
          border: `1px solid ${BORDER}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div>
            <div
              className="text-[10px] font-bold tracking-[0.14em] uppercase mb-0.5"
              style={{ color: "#a78bfa" }}
            >
              Reels
            </div>
            <h3 className="text-base font-bold" style={{ color: TEXT }}>
              Upload a reel
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: MUTED }}
            onMouseEnter={(e) => (e.currentTarget.style.background = CARD)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <IconClose />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-4">
          <p className="text-xs mb-4" style={{ color: MUTED }}>
            Reels are currently only visible in the mobile application.
          </p>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this reel a title"
            className="w-full px-3 py-2.5 rounded-lg text-sm mb-3 outline-none transition-colors"
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              color: TEXT,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
            onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
          />

          {/* Drag-and-drop zone */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-colors"
            style={{
              border: `1.5px dashed ${isDragging ? "#7c3aed" : BORDER_HOVER}`,
              background: isDragging ? "rgba(124,58,237,0.06)" : CARD,
              padding: previewUrl ? "10px" : "28px 16px",
            }}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileInput}
              className="hidden"
            />
            {previewUrl ? (
              <div className="w-full flex items-center gap-3">
                <div
                  className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                  style={{ background: "#000" }}
                >
                  <video
                    src={previewUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.35)" }}
                  >
                    <IconPlay style={{ color: "#fff" }} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-xs font-medium truncate"
                    style={{ color: TEXT }}
                  >
                    {file?.name}
                  </div>
                  <div className="text-[11px]" style={{ color: SUBTLE }}>
                    Tap to replace
                  </div>
                </div>
              </div>
            ) : (
              <>
                <IconUpload style={{ color: "#a78bfa" }} />
                <div className="text-xs font-medium" style={{ color: TEXT }}>
                  Drop a video, or click to browse
                </div>
                <div className="text-[11px]" style={{ color: SUBTLE }}>
                  MP4, MOV, or WebM
                </div>
              </>
            )}
          </label>

          {uploadError && (
            <div className="text-xs mt-2" style={{ color: "#f87171" }}>
              {uploadError}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div
          className="flex gap-2 justify-end px-5 py-4"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: MUTED, border: `1px solid ${BORDER}`, background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = BORDER_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !file}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-opacity"
            style={{
              background: ACCENT_GRADIENT,
              color: "#fff",
              opacity: uploading || !file ? 0.5 : 1,
              cursor: uploading || !file ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Uploading…" : "Submit for review"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorUploadReel;