import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  FileText,
  FileImage,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  Check,
  Quote,
  MessageCircleQuestion,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { useTranslation } from "react-i18next";

const getFileMeta = (url = "") => {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0]?.split("#")[0] ?? "";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return { type: "image", label: ext.toUpperCase(), color: "#2dd4bf" };
  }
  if (ext === "pdf") {
    return { type: "pdf", label: "PDF", color: "#fb7185" };
  }
  if (["doc", "docx"].includes(ext)) {
    return { type: "doc", label: "DOC", color: "#818cf8" };
  }
  return { type: "file", label: ext.toUpperCase() || "FILE", color: "#38bdf8" };
};

// Fallback embed for non-PDF, non-image files (e.g. .doc/.docx) where we
// can't render our own text layer, so we lean on Google's viewer.
const getFallbackEmbedUrl = (url = "") => {
  if (!url) return "";
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1") || url.includes("192.168.");
  if (isLocal) return url;
  return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
};

// ── Minimal, dependency-free markdown → JSX for AI responses ──
// Escapes HTML first, then re-introduces a small safe subset:
// **bold**, *italic*, `code`, and "- " bullet lines.
const escapeHtml = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const inlineFormat = (line) =>
  escapeHtml(line)
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-black/30 text-teal-300 text-[0.85em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic text-slate-300">$1</em>');

function FormattedMessage({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const blocks = [];
  let bulletBuf = [];

  const flushBullets = (key) => {
    if (bulletBuf.length) {
      blocks.push(
        <ul key={`ul-${key}`} className="list-disc list-outside pl-4 space-y-1 my-1">
          {bulletBuf.map((li, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(li) }} />
          ))}
        </ul>
      );
      bulletBuf = [];
    }
  };

  lines.forEach((line, idx) => {
    const bulletMatch = line.match(/^\s*[-•]\s+(.*)/);
    if (bulletMatch) {
      bulletBuf.push(bulletMatch[1]);
      return;
    }
    flushBullets(idx);
    if (line.trim() === "") {
      blocks.push(<div key={idx} className="h-1.5" />);
    } else {
      blocks.push(<p key={idx} dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />);
    }
  });
  flushBullets("end");

  return <div className="space-y-1">{blocks}</div>;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 h-4" aria-label="AI is responding">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-teal-400 motion-safe:animate-bounce"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable — no-op */
        }
      }}
      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 rounded-md text-slate-500 hover:text-teal-300 hover:bg-white/10"
      title="Copy response"
      aria-label="Copy response"
    >
      {copied ? <Check size={12} className="text-teal-400" /> : <Copy size={12} />}
    </button>
  );
}

// ── PDF renderer ──
// Renders every page to its own <canvas> and overlays a real, selectable
// text layer built from pdf.js's text content — no native browser PDF
// plugin involved, so there's no "pop-out" chrome, and highlighting works
// because the selected text is genuine DOM content in this page.
function PdfViewer({ url }) {
  const scrollRef = useRef(null);
  const pagesRef = useRef([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    let pdfDoc = null;

    async function render() {
      setStatus("loading");
      setNumPages(0);
      pagesRef.current = [];
      const scrollEl = scrollRef.current;
      if (scrollEl) scrollEl.innerHTML = "";

      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        pdfDoc = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;
        setNumPages(pdfDoc.numPages);

        const containerWidth = scrollEl?.clientWidth || 800;

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const unscaled = page.getViewport({ scale: 1 });
          const scale = Math.min((containerWidth - 32) / unscaled.width, 2.2);
          const viewport = page.getViewport({ scale });

          const pageWrap = document.createElement("div");
          pageWrap.className =
            "relative mx-auto mb-4 rounded-lg overflow-hidden border border-white/10 shadow-xl shadow-black/40 bg-white";
          pageWrap.style.width = `${viewport.width}px`;
          pageWrap.style.height = `${viewport.height}px`;
          pageWrap.dataset.pageNumber = String(pageNum);

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "block";
          pageWrap.appendChild(canvas);

          const textLayer = document.createElement("div");
          textLayer.className = "pdf-text-layer";
          textLayer.style.width = `${viewport.width}px`;
          textLayer.style.height = `${viewport.height}px`;
          pageWrap.appendChild(textLayer);

          scrollEl.appendChild(pageWrap);
          pagesRef.current.push(pageWrap);

          const ctx = canvas.getContext("2d");
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;

          const textContent = await page.getTextContent();
          const fragment = document.createDocumentFragment();
          const spans = [];
          textContent.items.forEach((item) => {
            if (!item.str) return;
            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
            const angle = Math.atan2(tx[1], tx[0]);
            const fontHeight = Math.hypot(tx[2], tx[3]);
            const span = document.createElement("span");
            span.textContent = item.str;
            span.style.left = `${tx[4]}px`;
            span.style.top = `${tx[5] - fontHeight}px`;
            span.style.fontSize = `${fontHeight}px`;
            fragment.appendChild(span);
            // expected on-page width (in CSS px) vs. the width our fallback
            // font renders at — corrected below once the span is in the DOM.
            spans.push({ span, angle, expectedWidth: Math.abs(item.width * viewport.scale) });
          });
          textLayer.appendChild(fragment);

          // Width-correction pass: our text layer uses a generic font, which
          // rarely has the exact same glyph widths as the PDF's real,
          // embedded font. Without this, selection boxes drift out of step
          // with the visible text within a line or two. Scale each span
          // horizontally so its measured width matches its true width on
          // the page, keeping the invisible text layer pixel-aligned with
          // what's actually painted on the canvas.
          spans.forEach(({ span, angle, expectedWidth }) => {
            const actualWidth = span.offsetWidth;
            const rotate = angle ? `rotate(${angle}rad) ` : "";
            if (actualWidth > 0 && expectedWidth > 0) {
              const scaleX = expectedWidth / actualWidth;
              if (isFinite(scaleX) && scaleX > 0.05 && scaleX < 20) {
                span.style.transform = `${rotate}scaleX(${scaleX})`;
              }
            } else if (rotate) {
              span.style.transform = rotate;
            }
          });
        }

        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("PDF render error:", err);
        if (!cancelled) setStatus("error");
      }
    }

    if (url) render();
    return () => {
      cancelled = true;
      pdfDoc?.destroy?.();
    };
  }, [url]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || numPages === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setCurrentPage(Number(entry.target.dataset.pageNumber));
        });
      },
      { root: scrollEl, threshold: 0.5 }
    );
    pagesRef.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages]);

  return (
    <div className="relative w-full h-full">
      <div ref={scrollRef} className="w-full h-full overflow-y-auto py-4 px-2" />

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b0f19]/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2.5 text-slate-400">
            <RefreshCw size={18} className="motion-safe:animate-spin" />
            <span className="text-xs font-medium">Loading document…</span>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b0f19]/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-slate-400 px-6 text-center">
            <FileText size={20} />
            <span className="text-xs font-medium">Couldn't preview this file.</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-400 hover:underline">
              Open the original file
            </a>
          </div>
        </div>
      )}

      {status === "ready" && numPages > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-lg text-[11px] font-semibold text-slate-100 border border-white/15 shadow-lg shadow-black/30 pointer-events-none">
          Page {currentPage} / {numPages}
        </div>
      )}
    </div>
  );
}

export default function NoteViewerModal({ note, isOpen, onClose }) {
  const { i18n } = useTranslation();
  const [selectedText, setSelectedText] = useState("");
  const [popoverPos, setPopoverPos] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("document");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);

  const viewerRef = useRef(null);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && note) {
      setChatMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hi! I'm your AI study assistant for **${note.title || "this note"}**.\n\nHighlight any text in the note or ask a question below to get started.`,
        },
      ]);
      setSelectedText("");
      setPopoverPos(null);
      setInputQuery("");
      setActiveTab("document");
      setIsChatVisible(true);
    }
  }, [isOpen, note]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, isAiLoading]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Auto-grow the composer textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputQuery]);

  // Highlight-to-ask: works because the PDF text layer (and any plain DOM
  // text) is real, selectable content in this document — not content
  // trapped inside a native plugin or a cross-origin iframe.
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPopoverPos(null);
        return;
      }
      const text = selection.toString().trim();
      if (text.length > 2) {
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setSelectedText(text);
            setPopoverPos({
              top: Math.max(10, rect.top - 48),
              left: Math.max(10, rect.left + rect.width / 2 - 68),
            });
          }
        } catch {
          /* selection range unavailable — ignore */
        }
      } else {
        setPopoverPos(null);
      }
    };
    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("keyup", handleSelectionChange);
    return () => {
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("keyup", handleSelectionChange);
    };
  }, []);

  const sendAiMessage = useCallback(
    async (userPrompt, highlightedContext = null) => {
      if (!userPrompt || isAiLoading) return;

      const newMsgId = Date.now().toString();
      const userMsg = { id: newMsgId, role: "user", content: userPrompt, highlightedContext };
      const updatedMessages = [...chatMessages, userMsg];
      setChatMessages(updatedMessages);
      setInputQuery("");
      setIsAiLoading(true);

      const aiMsgId = (Date.now() + 1).toString();
      setChatMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", content: "" }]);

      try {
        const systemContext = `Note Title: "${note.title}". ${note.description ? `Description: "${note.description}".` : ""
          } Instructor: "${note.instructorName || "Instructor"}".`;

        const apiHistory = [
          { role: "system", content: systemContext },
          ...updatedMessages.slice(-10).map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        ];

        const res = await fetch(`${API_BASE_URL}/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            messages: apiHistory,
            language: i18n.language === "hi" ? "Hindi" : "English",
            userRole: "student",
          }),
        });

        if (!res.ok) throw new Error("Failed to communicate with AI service.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;
            try {
              const { text: chunk, error: err } = JSON.parse(payload);
              if (err) throw new Error(err);
              if (chunk) {
                fullText += chunk;
                setChatMessages((prev) =>
                  prev.map((msg) => (msg.id === aiMsgId ? { ...msg, content: fullText } : msg))
                );
              }
            } catch (e) {
              if (e.name !== "SyntaxError") throw e;
            }
          }
        }
      } catch (err) {
        console.error("AI Error:", err);
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? { ...msg, content: "Sorry, I ran into an error generating an answer. Please try asking again." }
              : msg
          )
        );
      } finally {
        setIsAiLoading(false);
      }
    },
    [chatMessages, isAiLoading, note, i18n.language]
  );

  const handleAskAiAboutText = (overrideText = null) => {
    const textToAsk = overrideText || selectedText;
    if (!textToAsk) return;
    sendAiMessage(`Explain this text from the note: "${textToAsk}"`, textToAsk);
    setSelectedText("");
    setPopoverPos(null);
    // Fix: previously this only switched the mobile tab, so on desktop with
    // the panel collapsed (isChatVisible=false) clicking the popover did
    // nothing visible — the chat panel wasn't in the DOM to switch a tab
    // inside of. Re-open the panel itself, then land on the chat tab.
    setIsChatVisible(true);
    setActiveTab("chat");
  };

  const handleComposerSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || isAiLoading) return;
    sendAiMessage(inputQuery.trim(), selectedText || null);
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleComposerSubmit(e);
    }
  };

  if (!isOpen || !note) return null;

  const fileMeta = getFileMeta(note.fileUrl);
  const fallbackUrl = getFallbackEmbedUrl(note.fileUrl);
  const isEmptyChat = chatMessages.length <= 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 motion-safe:animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={note.title}
    >
      {/* Floating "Ask AI" popover for highlighted text */}
      {popoverPos && selectedText && (
        <div
          style={{ position: "fixed", top: popoverPos.top, left: popoverPos.left, zIndex: 10000 }}
          className="motion-safe:animate-popIn"
        >
          <button
            type="button"
            onClick={() => handleAskAiAboutText()}
            className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs font-bold shadow-xl shadow-black/40 hover:bg-white/15 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500/40 to-indigo-600/40 -z-10" />
            <Sparkles size={13} className="text-teal-300" />
            <span>Ask AI about this</span>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white/10 backdrop-blur-xl border-r border-b border-white/20" />
          </button>
        </div>
      )}

      {/* Main modal */}
      <div
        className={`relative w-full bg-[#0d1322]/70 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden transition-[border-radius] duration-300 ${isFullscreen ? "fixed inset-0 rounded-none h-full max-h-full" : "max-w-7xl h-[94vh] max-h-[900px]"
          }`}
      >
        {/* Ambient glow — gives the glass panels something colorful to blur */}
        <div className="pointer-events-none absolute -top-24 -left-16 w-96 h-96 rounded-full bg-teal-500/25 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-indigo-600/25 blur-[100px]" />

        {/* Header */}
        <div className="relative px-4 py-3 sm:px-6 bg-white/[0.04] backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div
            className={`absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-teal-400/70 to-transparent transition-opacity duration-500 ${isAiLoading ? "opacity-100 motion-safe:animate-pulse" : "opacity-0"
              }`}
          />

          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-md"
              style={{ background: `${fileMeta.color}18`, boxShadow: `inset 0 0 0 1px ${fileMeta.color}30` }}
            >
              {fileMeta.type === "image" ? (
                <FileImage size={18} style={{ color: fileMeta.color }} />
              ) : (
                <FileText size={18} style={{ color: fileMeta.color }} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-teal-300 bg-teal-500/10 border border-teal-400/20 backdrop-blur-sm">
                  {fileMeta.label}
                </span>
                {note.instructorName && (
                  <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                    by <span className="text-slate-200 font-semibold">{note.instructorName}</span>
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate leading-snug tracking-tight">
                {note.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isChatVisible && (
              <div className="flex sm:hidden bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1 gap-1">
                {["document", "chat"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${activeTab === tab ? "bg-teal-500/20 text-teal-300" : "text-slate-400"
                      }`}
                  >
                    {tab === "document" ? "Note" : "AI Chat"}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setIsChatVisible((v) => !v);
                setActiveTab("document");
              }}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold backdrop-blur-md border transition-colors ${isChatVisible
                ? "text-teal-300 bg-teal-500/10 border-teal-400/20 hover:bg-teal-500/15"
                : "text-slate-400 border-white/10 hover:text-white hover:bg-white/5"
                }`}
              title={isChatVisible ? "Hide AI chat" : "Show AI chat"}
              aria-label={isChatVisible ? "Hide AI chat" : "Show AI chat"}
              aria-pressed={isChatVisible}
            >
              {isChatVisible ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              AI Chat
            </button>

            <button
              type="button"
              onClick={() => setIsChatVisible((v) => !v)}
              className="sm:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl backdrop-blur-md transition-colors"
              title={isChatVisible ? "Hide AI chat" : "Show AI chat"}
              aria-label={isChatVisible ? "Hide AI chat" : "Show AI chat"}
              aria-pressed={isChatVisible}
            >
              {isChatVisible ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl backdrop-blur-md transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-400/20 rounded-xl backdrop-blur-md transition-colors"
              title="Close"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10 overflow-hidden">
          {/* Document panel */}
          <div
            ref={viewerRef}
            className={`relative flex-col bg-[#0b0f19]/50 backdrop-blur-md h-full overflow-hidden select-text ${isChatVisible ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"
              } ${activeTab === "document" || !isChatVisible ? "flex" : "hidden lg:flex"}`}
          >
            {fileMeta.type === "image" ? (
              <div className="flex items-center justify-center h-full p-4">
                <img
                  src={note.fileUrl}
                  alt={note.title}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
                />
              </div>
            ) : fileMeta.type === "pdf" ? (
              <PdfViewer url={note.fileUrl} />
            ) : (
              <div className="w-full h-full bg-slate-950/40 overflow-hidden">
                <iframe src={fallbackUrl} title={note.title} className="w-full h-full border-0" allowFullScreen />
              </div>
            )}
          </div>

          {/* Chat panel */}
          {isChatVisible && (
            <div
              className={`lg:col-span-5 xl:col-span-4 flex-col bg-white/[0.03] backdrop-blur-2xl h-full overflow-hidden ${activeTab === "chat" ? "flex" : "hidden lg:flex"
                }`}
            >
              {/* Chat header */}
              <div className="p-3.5 bg-white/[0.03] backdrop-blur-xl border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                    <Bot size={17} />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-teal-400 ring-2 ring-[#141d30] motion-safe:animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white">AI Note Assistant</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                      Ask questions or highlight text to analyze
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setChatMessages([
                      { id: "welcome", role: "assistant", content: `Ask me anything about **${note.title}**!` },
                    ])
                  }
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors shrink-0"
                  title="Clear chat"
                  aria-label="Clear chat"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Messages / empty state */}
              {isEmptyChat ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-950/40">
                    <Bot size={26} className="text-white" />
                    <span className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-extrabold text-white">Ask about this note</h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">
                      Highlight any text on the left, or type a question below — I've read{" "}
                      <span className="text-slate-300 font-semibold">{note.title}</span>.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                    <MessageCircleQuestion size={12} />
                    <span>Try "summarize this note" to start</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-5">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`group flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                          <Bot size={14} />
                        </div>
                      )}

                      <div
                        className={
                          msg.role === "user"
                            ? "max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed bg-white/10 backdrop-blur-xl border border-white/15 text-white shadow-md"
                            : "max-w-[88%] text-xs sm:text-sm leading-relaxed text-slate-200 pt-1"
                        }
                      >
                        {msg.highlightedContext && (
                          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10 text-[11px] italic opacity-90 mb-1.5">
                            <Quote size={11} className="mt-0.5 shrink-0 opacity-70" />
                            <span className="line-clamp-3">{msg.highlightedContext}</span>
                          </div>
                        )}

                        {msg.content ? (
                          msg.role === "assistant" ? (
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 font-normal">
                                <FormattedMessage text={msg.content} />
                              </div>
                              <CopyButton value={msg.content} />
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap font-normal">{msg.content}</p>
                          )
                        ) : (
                          <TypingDots />
                        )}
                      </div>

                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Selected-text banner */}
              {selectedText && (
                <div className="px-3 py-2 bg-teal-500/10 backdrop-blur-md border-t border-teal-400/20 flex items-center justify-between gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-300 truncate">
                    <Quote size={11} className="shrink-0" />
                    <span className="truncate">{selectedText}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedText("")}
                    className="text-teal-400 hover:text-white p-0.5 shrink-0"
                    aria-label="Clear selection"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Composer */}
              <form
                onSubmit={handleComposerSubmit}
                className="p-3 bg-white/[0.02] backdrop-blur-xl border-t border-white/10 shrink-0"
              >
                <div className="flex items-end gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-3.5 py-2 focus-within:border-teal-400/50 focus-within:ring-1 focus-within:ring-teal-400/30 transition-colors">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder={selectedText ? "Ask about the selected text..." : "Ask AI about this note..."}
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    disabled={isAiLoading}
                    className="flex-1 resize-none bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none max-h-[120px] leading-relaxed py-1.5"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isAiLoading}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-0.5 hover:scale-105 active:scale-95"
                    aria-label="Send message"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .motion-safe\\:animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .motion-safe\\:animate-popIn { animation: popIn 0.15s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-fadeIn,
          .motion-safe\\:animate-popIn,
          .motion-safe\\:animate-pulse,
          .motion-safe\\:animate-bounce,
          .motion-safe\\:animate-spin { animation: none !important; }
        }

        /* pdf.js text layer: real, selectable, invisible text stacked over the canvas */
        .pdf-text-layer {
          position: absolute;
          top: 0;
          left: 0;
          overflow: hidden;
          line-height: 1;
          pointer-events: auto;
          -webkit-user-select: text;
          user-select: text;
        }
        .pdf-text-layer span {
          position: absolute;
          white-space: pre;
          color: transparent;
          transform-origin: 0% 0%;
          cursor: text;
          font-family: sans-serif;
          -webkit-user-select: text;
          user-select: text;
        }
        /* !important guards against a page-wide ::selection rule elsewhere
           in the app winning the cascade tie — this highlight needs to hold
           regardless of load order. */
        .pdf-text-layer span::selection {
          background-color: rgba(52, 211, 153, 0.45) !important;
          color: transparent !important;
        }
        .pdf-text-layer span::-moz-selection {
          background-color: rgba(52, 211, 153, 0.45) !important;
          color: transparent !important;
        }
      `}</style>
    </div>
  );
}