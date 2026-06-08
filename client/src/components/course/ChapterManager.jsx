import { useRef, useState } from "react";
import { uploadToImageKit } from "../../utils/imagekitUpload.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const iStyle = {
  padding: "9px 12px",
  background: "#0b1120",
  border: "1px solid #1e293b",
  borderRadius: 8,
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
  description: "",
  videoUrl: "",
  content: "", // written lesson body
  type: "video", // 'video' | 'text'
  chapterTitle: "",
};

// ── Video upload cell ─────────────────────────────────────────────────────────
const VideoUploadCell = ({ value, onUploaded }) => {
  const ref = useRef(null);
  const [status, setStatus] = useState(value ? "done" : "idle");
  const [progress, setProgress] = useState(0);
  const [errMsg, setErrMsg] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    setErrMsg("");
    try {
      const data = await uploadToImageKit({
        file,
        folder: "/skillsphere/lessons",
        onUploadProgress: (e) =>
          setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      setStatus("done");
      onUploaded(data.url);
    } catch (err) {
      setStatus("error");
      setErrMsg(err.response?.data?.message || err.message || "Upload failed.");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  if (status === "uploading")
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            Uploading video…
          </span>
          <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700 }}>
            {progress}%
          </span>
        </div>
        <div
          style={{
            height: 5,
            background: "#1e293b",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
              borderRadius: 3,
              transition: "width 0.2s",
            }}
          />
        </div>
      </div>
    );

  if (status === "done" || value)
    return (
      <div
        style={{
          width: "100%",
          border: "1px solid #16a34a40",
          borderRadius: 10,
          background: "#052e1680",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎬</span>
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#4ade80",
                margin: 0,
              }}
            >
              Video uploaded
            </p>
            <p style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
              MP4, WEBM — max 500 MB
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#94a3b8",
            background: "none",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "4px 12px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Replace
        </button>
        <input
          ref={ref}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
    );

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        width: "100%",
        border: `2px dashed ${dragging ? "#7c3aed" : status === "error" ? "#f87171" : "#334155"}`,
        borderRadius: 10,
        background: dragging ? "#2e106520" : "#0b112080",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <span style={{ fontSize: 28 }}>🎬</span>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>
        Click or drag & drop
      </p>
      <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>
        MP4, WEBM — max 500 MB
      </p>
      {status === "error" && (
        <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>
          ❌ {errMsg}
        </p>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          ref.current?.click();
        }}
        style={{
          marginTop: 6,
          fontSize: 12,
          fontWeight: 600,
          color: "#f1f5f9",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 8,
          padding: "6px 16px",
          cursor: "pointer",
        }}
      >
        Choose file
      </button>
      <input
        ref={ref}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
};

// ── Text lesson editor ────────────────────────────────────────────────────────
const TextLessonEditor = ({ value, onChange }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{
        border: `2px solid ${focused ? "#7c3aed" : "#334155"}`,
        borderRadius: 10,
        background: "#0b112080",
        overflow: "hidden",
        transition: "border-color 0.15s",
        width: "100%",
      }}
    >
      {/* Toolbar hint */}
      <div
        style={{
          padding: "8px 14px",
          background: "#111827",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>📝</span>
        <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>
          Written Lesson Content
        </span>
        <span style={{ fontSize: 10, color: "#334155", marginLeft: "auto" }}>
          Markdown supported
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={8}
        placeholder={`Write your lesson content here…\n\nYou can use Markdown:\n# Heading\n**bold**, *italic*\n- bullet points\n\n> blockquotes`}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          color: "#e2e8f0",
          fontSize: 13,
          lineHeight: 1.7,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          outline: "none",
          resize: "vertical",
          minHeight: 160,
        }}
      />
      <div
        style={{
          padding: "6px 14px",
          background: "#111827",
          borderTop: "1px solid #1e293b",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <span style={{ fontSize: 10, color: "#334155" }}>
          {value?.length ?? 0} characters
        </span>
      </div>
    </div>
  );
};

// ── Lesson Type Toggle ────────────────────────────────────────────────────────
const TypeToggle = ({ value, onChange }) => (
  <div
    style={{
      display: "flex",
      gap: 4,
      background: "#0b1120",
      border: "1px solid #1e293b",
      borderRadius: 8,
      padding: 3,
      flexShrink: 0,
    }}
  >
    {[
      { key: "video", icon: "🎬", label: "Video" },
      { key: "text", icon: "📝", label: "Text" },
    ].map(({ key, icon, label }) => (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        style={{
          padding: "4px 10px",
          borderRadius: 6,
          border: "none",
          background:
            value === key
              ? key === "video"
                ? "#2e1065"
                : "#0c2a1a"
              : "transparent",
          color:
            value === key
              ? key === "video"
                ? "#a78bfa"
                : "#4ade80"
              : "#475569",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </button>
    ))}
  </div>
);

// ── Main ChapterManager ───────────────────────────────────────────────────────
export default function ChapterManager({ lessons = [], onChange }) {
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

                      {/* Content area — video or text */}
                      <div style={{ paddingLeft: 28 }}>
                        {isText ? (
                          <TextLessonEditor
                            value={lesson.content || ""}
                            onChange={(val) =>
                              updateLesson(ci, li, "content", val)
                            }
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

                      {/* Description (optional, both types) */}
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
