// ── Reading mode themes ───────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: "#0b1826",
    headerBg: "#0d1f35",
    border: "#1e3a5f",
    text: "#cbd5e1",
    heading: "#e2e8f0",
    strong: "#f1f5f9",
    em: "#a78bfa",
    codeColor: "#7dd3fc",
    codeBg: "#1e293b",
    quoteBorder: "#7c3aed",
    quoteColor: "#94a3b8",
    li: "#cbd5e1",
    activeBg: "#0d1b2a",
    activeBorder: "#1e3a5f",
    activeColor: "#93c5fd",
    idleBorder: "#1e293b",
    idleColor: "#475569",
  },
  light: {
    bg: "#ffffff",
    headerBg: "#f8fafc",
    border: "#e2e8f0",
    text: "#374151",
    heading: "#111827",
    strong: "#111827",
    em: "#7c3aed",
    codeColor: "#0369a1",
    codeBg: "#f0f9ff",
    quoteBorder: "#7c3aed",
    quoteColor: "#6b7280",
    li: "#374151",
    activeBg: "#ede9fe",
    activeBorder: "#a78bfa",
    activeColor: "#5b21b6",
    idleBorder: "#e2e8f0",
    idleColor: "#94a3b8",
  },
};

const renderMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hublp])(.+)$/gm, "<p>$1</p>");
};

import { useMemo, useState } from "react";

export default function TextLessonViewer({ lesson }) {
  const html = useMemo(
    () => renderMarkdown(lesson.content || ""),
    [lesson.content],
  );
  const [mode, setMode] = useState("dark");
  const t = THEMES[mode];

  if (!lesson.content?.trim()) {
    return (
      <div
        style={{
          aspectRatio: "16/9",
          background: "#0f172a",
          borderRadius: 12,
          border: "1px solid #1e293b",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 48 }}>📝</span>
        <p style={{ color: "#475569", fontSize: 14 }}>
          No content for this lesson yet
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      {/* ── Toolbar ── */}
      <div
        style={{
          padding: "10px 14px",
          background: t.headerBg,
          borderBottom: `1px solid ${t.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          transition: "background 0.2s",
        }}
      >
        {/* Left: icon + label */}
        <span style={{ fontSize: 15, flexShrink: 0 }}>📝</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: t.text,
            flex: 1,
            minWidth: 80,
            transition: "color 0.2s",
          }}
        >
          Written Lesson
        </span>

        {/* Toggle pill */}
        <div
          style={{
            display: "flex",
            background: mode === "dark" ? "#0b1120" : "#f1f5f9",
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            padding: 3,
            gap: 2,
            flexShrink: 0,
            transition: "background 0.2s",
          }}
        >
          {[
            { key: "dark", icon: "🌙", label: "Dark" },
            { key: "light", icon: "☀️", label: "Light" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 7,
                border: "none",
                background: mode === key ? t.activeBg : "transparent",
                color: mode === key ? t.activeColor : t.idleColor,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <span>{icon}</span>
              <span style={{ display: "inline" }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 20,
            background: "#0c2a1a",
            color: "#4ade80",
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}
        >
          TEXT
        </span>
      </div>

      {/* ── Scoped CSS ── */}
      <style>{`
        .tlv-body { padding: 24px 20px; overflow-y: auto; max-height: 70vh; transition: background 0.2s, color 0.2s; }
        @media (min-width: 640px) { .tlv-body { padding: 28px 32px; } }
        .tlv-body h1 { font-size: clamp(18px,4vw,22px); font-weight: 700; color: ${t.heading}; margin: 0 0 14px; line-height: 1.3; }
        .tlv-body h2 { font-size: clamp(15px,3vw,18px); font-weight: 700; color: ${t.heading}; margin: 20px 0 10px; }
        .tlv-body h3 { font-size: clamp(13px,2.5vw,15px); font-weight: 700; color: ${t.heading}; margin: 16px 0 8px; }
        .tlv-body p  { margin: 0 0 12px; }
        .tlv-body strong { color: ${t.strong}; font-weight: 700; }
        .tlv-body em { color: ${t.em}; font-style: italic; }
        .tlv-body code { background: ${t.codeBg}; color: ${t.codeColor}; padding: 2px 6px; border-radius: 5px; font-size: 12px; font-family: monospace; word-break: break-word; }
        .tlv-body blockquote { border-left: 3px solid ${t.quoteBorder}; border-radius: 0; padding: 4px 0 4px 14px; color: ${t.quoteColor}; margin: 14px 0; font-style: italic; }
        .tlv-body ul { padding-left: 18px; margin: 10px 0; }
        .tlv-body li { margin: 5px 0; color: ${t.li}; }
      `}</style>

      {/* ── Content ── */}
      <div
        className="tlv-body"
        style={{
          background: t.bg,
          color: t.text,
          fontSize: "clamp(13px, 2vw, 15px)",
          lineHeight: 1.85,
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
