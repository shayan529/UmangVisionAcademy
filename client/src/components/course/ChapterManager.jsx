import { useState, useRef } from "react";
import { uploadToImageKit } from "../../utils/imagekitUpload.js";

// ── shared primitives (duplicated from parent for standalone use) ──────────────
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

const EMPTY_LESSON = {
  title: "",
  type: "video",
  videoUrl: "",
  content: "",
  description: "",
};

// ── TypeToggle ────────────────────────────────────────────────────────────────
const TypeToggle = ({ value, onChange }) => (
  <div
    style={{
      display: "flex",
      gap: 0,
      background: "#1e293b",
      borderRadius: 8,
      padding: 3,
      flexShrink: 0,
    }}
  >
    {[
      { key: "video", icon: "🎬", label: "Video" },
      { key: "text", icon: "📄", label: "Text" },
    ].map((t) => (
      <button
        key={t.key}
        type="button"
        onClick={() => onChange(t.key)}
        style={{
          padding: "4px 10px",
          borderRadius: 6,
          border: "none",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          background:
            value === t.key
              ? t.key === "text"
                ? "#166534"
                : "#2e1065"
              : "transparent",
          color:
            value === t.key
              ? t.key === "text"
                ? "#4ade80"
                : "#a78bfa"
              : "#64748b",
          transition: "all 0.15s",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

// ── VideoUploadCell ───────────────────────────────────────────────────────────
const VideoUploadCell = ({ value, onUploaded }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const uploadFile = async (file) => {
    setUploading(true);
    setProgress(0);
    setErrorMsg("");
    try {
      const data = await uploadToImageKit({
        file,
        folder: "/skillsphere-videos",
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      onUploaded(data.url);
    } catch (err) {
      console.error("Video upload failed:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  // Uploaded state — show filename/url with a remove button
  if (value && !uploading) {
    const displayName = value.split("/").pop() || value;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: "#0b1120",
          border: "1px solid #1e293b",
          borderRadius: 10,
        }}
      >
        <span style={{ fontSize: 16 }}>🎬</span>
        <span
          style={{
            fontSize: 12,
            color: "#a78bfa",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName}
        </span>
        <button
          type="button"
          onClick={() => onUploaded("")}
          style={{
            background: "none",
            border: "none",
            color: "#f87171",
            cursor: "pointer",
            fontSize: 13,
            padding: 0,
            flexShrink: 0,
          }}
        >
          ✕ Remove
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) uploadFile(file);
        }}
        style={{
          border: `1.5px dashed ${dragOver ? "#7c3aed" : "#1e293b"}`,
          borderRadius: 12,
          padding: "28px 20px",
          background: dragOver ? "#0f0a1e" : "#0b1120",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: uploading ? "default" : "pointer",
          transition: "border-color 0.15s, background 0.15s",
          userSelect: "none",
        }}
      >
        {uploading ? (
          <>
            <svg
              style={{
                animation: "spin 1s linear infinite",
                width: 28,
                height: 28,
                color: "#7c3aed",
              }}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity=".3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
              Uploading… {progress}%
            </span>
            <div
              style={{
                width: "60%",
                height: 3,
                background: "#1e293b",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
                  borderRadius: 99,
                  transition: "width 0.2s",
                }}
              />
            </div>
          </>
        ) : (
          <>
            <span style={{ fontSize: 28 }}>🎬</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
              Click or drag &amp; drop
            </span>
            <span style={{ fontSize: 11, color: "#475569" }}>
              MP4, WEBM — max 200 MB
            </span>
          </>
        )}
      </div>

      {errorMsg && (
        <span style={{ fontSize: 10, color: "#f87171", paddingLeft: 4 }}>
          ⚠️ {errorMsg}
        </span>
      )}
    </div>
  );
};

// ── TextLessonEditor ──────────────────────────────────────────────────────────
const TextLessonEditor = ({
  value,
  onChange,
  lessonTitle,
  courseSubject,
  courseDescription,
}) => {
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const canGenerate = !!lessonTitle?.trim();

  const generateWithAI = async () => {
    setAiGenerating(true);
    setAiError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Write a comprehensive, well-structured educational lesson on: "${lessonTitle}".
${courseSubject ? `Course subject: ${courseSubject}.` : ""}
${courseDescription ? `Course description: ${courseDescription}` : ""}

Format in Markdown:
- Brief introduction paragraph
- Key concepts with ## headings
- Concrete examples where helpful
- Short summary at the end

Write clearly for school/college students. Be educational and engaging. Use Markdown formatting throughout.`,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error("AI service unavailable");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const { text } = JSON.parse(payload);
            if (text) fullText += text;
          } catch { }
        }
      }

      onChange(fullText.trim());
    } catch (err) {
      console.error("AI lesson generation failed:", err);
      setAiError("AI generation failed. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #1e293b",
        borderRadius: 12,
        overflow: "hidden",
        background: "#070e1a",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "#0b1120",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13 }}>📄</span>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
            Written Lesson Content
          </span>
          <span style={{ fontSize: 10, color: "#334155" }}>
            Markdown supported
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {aiError && (
            <span style={{ fontSize: 10, color: "#f87171" }}>{aiError}</span>
          )}
          <button
            type="button"
            onClick={generateWithAI}
            disabled={aiGenerating || !canGenerate}
            title={
              !canGenerate
                ? "Enter a lesson title first"
                : "Generate lesson content with AI"
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 8,
              border: "none",
              background: aiGenerating
                ? "#334155"
                : !canGenerate
                  ? "#1e293b"
                  : "linear-gradient(135deg,#7c3aed,#06b6d4)",
              color: !canGenerate ? "#475569" : "#fff",
              fontSize: 11,
              fontWeight: 700,
              cursor: aiGenerating || !canGenerate ? "not-allowed" : "pointer",
              opacity: aiGenerating ? 0.75 : 1,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {aiGenerating ? (
              <>
                <svg
                  style={{
                    animation: "spin 1s linear infinite",
                    width: 11,
                    height: 11,
                    flexShrink: 0,
                  }}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity=".3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Generating…
              </>
            ) : (
              "✨ Generate with AI"
            )}
          </button>
        </div>
      </div>

      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        placeholder={
          aiGenerating
            ? "AI is writing your lesson…"
            : !canGenerate
              ? "Enter a lesson title above, then click ✨ Generate with AI…\n\nOr write your content here using Markdown:\n# Heading\n**bold**, *italic*\n- bullet points\n> blockquotes"
              : "Write your lesson content here…\n\nOr click ✨ Generate with AI above.\n\nMarkdown:\n# Heading\n**bold**, *italic*\n- bullet points\n> blockquotes"
        }
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "#070e1a",
          border: "none",
          color: aiGenerating ? "#334155" : "#f1f5f9",
          fontSize: 13,
          fontFamily: "monospace",
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
          lineHeight: 1.7,
          transition: "color 0.2s",
          minHeight: 180,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "5px 12px",
          background: "#0b1120",
          borderTop: "1px solid #1e293b",
        }}
      >
        <span style={{ fontSize: 10, color: "#334155" }}>
          {(value || "").length} characters
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            style={{
              fontSize: 10,
              color: "#475569",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

// ── ChapterManager ────────────────────────────────────────────────────────────
export default function ChapterManager({
  lessons = [],
  onChange,
  courseSubject = "",
  courseDescription = "",
}) {
  const buildGroups = (ls) => {
    const groups = [];
    ls.forEach((l) => {
      const title = l.chapterTitle || "Chapter 1";
      let g = groups.find((g) => g.title === title);
      if (!g) {
        g = { title, lessons: [] };
        groups.push(g);
      }
      g.lessons.push(l);
    });
    return groups.length ? groups : [{ title: "Chapter 1", lessons: [] }];
  };

  const flattenGroups = (groups) =>
    groups.flatMap((g) =>
      g.lessons.map((l) => ({ ...l, chapterTitle: g.title })),
    );

  const [groups, setGroups] = useState(() => buildGroups(lessons));
  const [expandedCh, setExpandedCh] = useState(new Set([0]));

  const sync = (newGroups) => {
    setGroups(newGroups);
    onChange(flattenGroups(newGroups));
  };

  const addChapter = () => {
    const n = groups.length + 1;
    const newGroups = [...groups, { title: `Chapter ${n}`, lessons: [] }];
    setExpandedCh((prev) => new Set([...prev, newGroups.length - 1]));
    sync(newGroups);
  };

  const renameChapter = (ci, title) =>
    sync(groups.map((gr, i) => (i === ci ? { ...gr, title } : gr)));

  const deleteChapter = (ci) => {
    if (groups.length === 1) return;
    sync(groups.filter((_, i) => i !== ci));
  };

  const addLesson = (ci) => {
    const g = groups.map((gr, i) =>
      i === ci
        ? {
          ...gr,
          lessons: [
            ...gr.lessons,
            { ...EMPTY_LESSON, chapterTitle: gr.title },
          ],
        }
        : gr,
    );
    sync(g);
  };

  const updateLesson = (ci, li, key, value) => {
    const g = groups.map((gr, i) =>
      i === ci
        ? {
          ...gr,
          lessons: gr.lessons.map((l, j) =>
            j === li ? { ...l, [key]: value } : l,
          ),
        }
        : gr,
    );
    sync(g);
  };

  const deleteLesson = (ci, li) => {
    const g = groups.map((gr, i) =>
      i === ci ? { ...gr, lessons: gr.lessons.filter((_, j) => j !== li) } : gr,
    );
    sync(g);
  };

  const toggleCh = (i) => {
    setExpandedCh((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  const totalLessons = groups.reduce((s, g) => s + g.lessons.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Chapters & Lessons
          </label>
          <p style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
            {groups.length} chapters · {totalLessons} lessons
          </p>
        </div>
        <button
          type="button"
          onClick={addChapter}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#a78bfa",
            background: "#2e1065",
            border: "1px solid #7c3aed40",
            borderRadius: 8,
            padding: "6px 14px",
            cursor: "pointer",
          }}
        >
          + Add Chapter
        </button>
      </div>

      {/* Chapters */}
      {groups.map((group, ci) => (
        <div
          key={ci}
          style={{
            border: "1px solid #1e293b",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Chapter header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "#111827",
              borderBottom: expandedCh.has(ci) ? "1px solid #1e293b" : "none",
            }}
          >
            <button
              type="button"
              onClick={() => toggleCh(ci)}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: 13,
                padding: 0,
                flexShrink: 0,
              }}
            >
              {expandedCh.has(ci) ? "▼" : "▶"}
            </button>
            <input
              value={group.title}
              onChange={(e) => renameChapter(ci, e.target.value)}
              style={{
                ...iStyle,
                fontWeight: 700,
                fontSize: 13,
                color: "#f1f5f9",
                background: "transparent",
                border: "none",
                padding: "0",
                flex: 1,
              }}
              onFocus={focus}
              onBlur={blur}
              placeholder="Chapter title…"
            />
            <span style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>
              {group.lessons.length} lessons
            </span>
            {groups.length > 1 && (
              <button
                type="button"
                onClick={() => deleteChapter(ci)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#f87171",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                🗑
              </button>
            )}
          </div>

          {/* Lessons */}
          {expandedCh.has(ci) && (
            <div style={{ background: "#0f172a" }}>
              {group.lessons.length === 0 ? (
                <p
                  style={{
                    fontSize: 12,
                    color: "#475569",
                    padding: "12px 16px",
                  }}
                >
                  No lessons yet. Add one below.
                </p>
              ) : (
                group.lessons.map((lesson, li) => {
                  const isText = lesson.type === "text";
                  return (
                    <div
                      key={li}
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid #1e293b1a",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        background: isText ? "#0a1628" : "transparent",
                        transition: "background 0.2s",
                      }}
                    >
                      {/* Row: number + title + type toggle + delete */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "#475569",
                            flexShrink: 0,
                            minWidth: 20,
                          }}
                        >
                          {li + 1}.
                        </span>
                        <input
                          value={lesson.title}
                          onChange={(e) =>
                            updateLesson(ci, li, "title", e.target.value)
                          }
                          style={{ ...iStyle, flex: 1 }}
                          onFocus={focus}
                          onBlur={blur}
                          placeholder="Lesson title *"
                        />
                        <TypeToggle
                          value={lesson.type || "video"}
                          onChange={(t) => updateLesson(ci, li, "type", t)}
                        />
                        <button
                          type="button"
                          onClick={() => deleteLesson(ci, li)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#f87171",
                            cursor: "pointer",
                            fontSize: 14,
                            flexShrink: 0,
                            padding: 0,
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Content area */}
                      <div style={{ paddingLeft: 28 }}>
                        {isText ? (
                          <TextLessonEditor
                            value={lesson.content || ""}
                            onChange={(val) =>
                              updateLesson(ci, li, "content", val)
                            }
                            lessonTitle={lesson.title}
                            courseSubject={courseSubject}
                            courseDescription={courseDescription}
                          />
                        ) : (
                          <VideoUploadCell
                            value={lesson.videoUrl}
                            onUploaded={(url) =>
                              updateLesson(ci, li, "videoUrl", url)
                            }
                          />
                        )}
                      </div>

                      {/* Description */}
                      <textarea
                        value={lesson.description}
                        onChange={(e) =>
                          updateLesson(ci, li, "description", e.target.value)
                        }
                        rows={2}
                        style={{
                          ...iStyle,
                          resize: "vertical",
                          fontFamily: "inherit",
                          marginLeft: 28,
                          fontSize: 12,
                        }}
                        onFocus={focus}
                        onBlur={blur}
                        placeholder="Lesson description (optional)"
                      />
                    </div>
                  );
                })
              )}

              <div style={{ padding: "10px 16px" }}>
                <button
                  type="button"
                  onClick={() => addLesson(ci)}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#22d3ee",
                    background: "none",
                    border: "1px dashed #22d3ee40",
                    borderRadius: 8,
                    padding: "6px 14px",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  + Add Lesson to {group.title}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}