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
  GripHorizontal,
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

// A page whose canvas/text-layer hasn't rendered yet — sized so the scroll
// area doesn't jump around once the real content lands in the same spot.
function renderPlaceholder(pageWrap) {
  pageWrap.innerHTML = "";
  const spinner = document.createElement("div");
  spinner.className = "absolute inset-0 flex items-center justify-center text-slate-400";
  spinner.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="motion-safe:animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
  pageWrap.appendChild(spinner);
}

// ── PDF renderer ──
// Renders each page to its own <canvas> and overlays a real, selectable
// text layer built from pdf.js's text content — no native browser PDF
// plugin involved, so there's no "pop-out" chrome, and highlighting works
// because the selected text is genuine DOM content in this page.
//
// Pages render lazily: only page 1 renders up front (that's what flips
// status to "ready"), everything past it is a lightweight placeholder that
// renders for real once it scrolls near the viewport.
//
// Pages are pre-warmed well ahead of the viewport (PRELOAD_MARGIN) and the
// render queue runs several pages concurrently (RENDER_CONCURRENCY), with
// the queue kept sorted by distance from the page currently in view. A
// single-page-at-a-time queue with only a ~250px lookahead is what made
// scrolling feel like it was "buffering" — the visible edge would outrun
// the queue and land on unrendered placeholders.
const PRELOAD_MARGIN = "300px 0px";
const RENDER_CONCURRENCY = 1;
const MAX_RENDER_SCALE = 1.5;

const PdfViewer = React.memo(function PdfViewer({ url }) {
  const scrollRef = useRef(null);
  const pagesRef = useRef([]); // wrapper <div> elements, indexed by page - 1
  const renderedRef = useRef(new Set());
  const pendingRef = useRef(new Set()); // pages currently queued or in-flight
  const pageObjCacheRef = useRef(new Map());
  const pdfDocRef = useRef(null);
  const pdfjsLibRef = useRef(null);
  const renderQueueRef = useRef([]);
  const activeWorkersRef = useRef(0);
  const currentPageRef = useRef(1);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [retryToken, setRetryToken] = useState(0);

  const renderPage = useCallback(async (pageNum) => {
    if (renderedRef.current.has(pageNum)) return;
    const pdfjsLib = pdfjsLibRef.current;
    const pdfDoc = pdfDocRef.current;
    const pageWrap = pagesRef.current[pageNum - 1];
    if (!pdfjsLib || !pdfDoc || !pageWrap) return;
    renderedRef.current.add(pageNum); // claim it before awaiting, so it isn't double-queued

    try {
      let page = pageObjCacheRef.current.get(pageNum);
      if (!page) {
        page = await pdfDoc.getPage(pageNum);
        pageObjCacheRef.current.set(pageNum, page);
      }
      const containerWidth = scrollRef.current?.clientWidth || 800;
      const unscaled = page.getViewport({ scale: 1 });
      const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
      const isMobileScreen = typeof window !== "undefined" && window.innerWidth < 640;
      const padding = isMobileScreen ? 12 : 32;
      const scale = Math.min((containerWidth - padding) / unscaled.width, MAX_RENDER_SCALE);
      const viewport = page.getViewport({ scale });

      pageWrap.style.width = `${viewport.width}px`;
      pageWrap.style.height = `${viewport.height}px`;
      pageWrap.innerHTML = "";

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.className = "block";
      pageWrap.appendChild(canvas);

      const textLayer = document.createElement("div");
      textLayer.className = "pdf-text-layer";
      textLayer.style.width = `${viewport.width}px`;
      textLayer.style.height = `${viewport.height}px`;
      pageWrap.appendChild(textLayer);

      const ctx = canvas.getContext("2d");
      const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;
      await page.render({ canvasContext: ctx, viewport, transform }).promise;

      // Defer text-layer DOM creation and width-correction pass to animation frames
      // so canvas rendering finishes immediately and scrolling remains 60fps smooth.
      requestAnimationFrame(() => {
        page.getTextContent().then((textContent) => {
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
            spans.push({ span, angle, expectedWidth: Math.abs(item.width * viewport.scale) });
          });
          textLayer.appendChild(fragment);

          requestAnimationFrame(() => {
            const measuredWidths = spans.map(({ span }) => span.offsetWidth);
            spans.forEach(({ span, angle, expectedWidth }, i) => {
              const actualWidth = measuredWidths[i];
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
          });
        }).catch(() => { });
      });
    } catch (err) {
      renderedRef.current.delete(pageNum); // allow a retry (e.g. scroll away and back)
      console.error(`PDF page ${pageNum} render error:`, err);
    }
  }, []);

  // Runs up to RENDER_CONCURRENCY pages in parallel instead of one at a
  // time. Before each pull, the queue is re-sorted by distance from the
  // page currently in view, so a fast scroll re-prioritizes toward where
  // the user actually is instead of grinding through stale FIFO order.
  const pumpQueue = useCallback(() => {
    while (activeWorkersRef.current < RENDER_CONCURRENCY && renderQueueRef.current.length) {
      renderQueueRef.current.sort(
        (a, b) => Math.abs(a - currentPageRef.current) - Math.abs(b - currentPageRef.current)
      );
      const nextPage = renderQueueRef.current.shift();
      pendingRef.current.delete(nextPage);
      activeWorkersRef.current += 1;
      renderPage(nextPage).finally(() => {
        activeWorkersRef.current -= 1;
        pumpQueue();
      });
    }
  }, [renderPage]);

  const enqueueRender = useCallback(
    (pageNum) => {
      if (renderedRef.current.has(pageNum) || pendingRef.current.has(pageNum)) return;
      pendingRef.current.add(pageNum);
      renderQueueRef.current.push(pageNum);
      pumpQueue();
    },
    [pumpQueue]
  );

  useEffect(() => {
    let cancelled = false;
    let timedOut = false;
    const scrollEl = scrollRef.current;

    setStatus("loading");
    setNumPages(0);
    setCurrentPage(1);
    currentPageRef.current = 1;
    pagesRef.current = [];
    renderedRef.current = new Set();
    pendingRef.current = new Set();
    pageObjCacheRef.current = new Map();
    renderQueueRef.current = [];
    activeWorkersRef.current = 0;
    if (scrollEl) scrollEl.innerHTML = "";

    // A stalled worker fetch (blocked CDN, dead network) previously left the
    // spinner running forever with no feedback. Cap the wait so it always
    // resolves to either the first page or a visible error.
    const timeoutId = setTimeout(() => {
      timedOut = true;
      if (!cancelled) setStatus("error");
    }, 20000);

    async function load() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        pdfjsLibRef.current = pdfjsLib;

        const pdfDoc = await pdfjsLib.getDocument(url).promise;
        if (cancelled || timedOut) return;
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);

        // Build lightweight placeholders for every page up front so the
        // scrollbar/height and page counter are correct immediately —
        // only page 1 actually renders right now.
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const pageWrap = document.createElement("div");
          pageWrap.className =
            "relative mx-auto mb-4 rounded-lg overflow-hidden border border-white/10 shadow-xl shadow-black/40 bg-white [contain:content]";
          pageWrap.style.minHeight = "300px";
          pageWrap.dataset.pageNumber = String(pageNum);
          renderPlaceholder(pageWrap);
          scrollEl.appendChild(pageWrap);
          pagesRef.current.push(pageWrap);
        }

        await renderPage(1);
        if (cancelled || timedOut) return;
        clearTimeout(timeoutId);
        setStatus("ready");

        // Warm several pages ahead in the background so scrolling forward
        // feels instant without blocking the "ready" state on it.
        for (let p = 2; p <= Math.min(pdfDoc.numPages, 1 + RENDER_CONCURRENCY); p++) {
          enqueueRender(p);
        }
      } catch (err) {
        console.error("PDF load error:", err);
        clearTimeout(timeoutId);
        if (!cancelled && !timedOut) setStatus("error");
      }
    }

    if (url) load();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      pdfDocRef.current?.destroy?.();
      pdfDocRef.current = null;
    };
  }, [url, retryToken, renderPage, enqueueRender]);

  // Lazily render pages as they scroll near the viewport, and track which
  // page is currently in view for the page counter and queue prioritization.
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || numPages === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = Number(entry.target.dataset.pageNumber);
          if (entry.isIntersecting) {
            enqueueRender(pageNum);
            if (entry.intersectionRatio >= 0.3) {
              setCurrentPage(pageNum);
              currentPageRef.current = pageNum;
            }
          }
        });
      },
      { root: scrollEl, rootMargin: PRELOAD_MARGIN, threshold: [0, 0.3] }
    );
    pagesRef.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, enqueueRender]);

  return (
    <div className="relative w-full h-full">
      <div ref={scrollRef} className="w-full h-full overflow-y-auto py-4 px-2" />

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b0f19]/90">
          <div className="flex flex-col items-center gap-2.5 text-slate-400">
            <RefreshCw size={18} className="motion-safe:animate-spin" />
            <span className="text-xs font-medium">Loading document…</span>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b0f19]/90">
          <div className="flex flex-col items-center gap-2 text-slate-400 px-6 text-center">
            <FileText size={20} />
            <span className="text-xs font-medium">Couldn't preview this file. It may be taking too long to load.</span>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => setRetryToken((t) => t + 1)}
                className="text-xs text-teal-400 hover:underline"
              >
                Try again
              </button>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-400 hover:underline">
                Open the original file
              </a>
            </div>
          </div>
        </div>
      )}

      {status === "ready" && numPages > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-[#131d33]/95 text-[11px] font-semibold text-slate-100 border border-teal-500/30 shadow-lg shadow-black/50 pointer-events-none">
          Page {currentPage} / {numPages}
        </div>
      )}
    </div>
  );
});

// Chat UI shared between the desktop column and the mobile floating widget.
const ChatPanelContent = React.memo(function ChatPanelContent({
  note,
  chatMessages,
  setChatMessages,
  isEmptyChat,
  selectedText,
  setSelectedText,
  inputQuery,
  setInputQuery,
  isAiLoading,
  onComposerSubmit,
  onComposerKeyDown,
  onRequestClose,
  onHeaderPointerDown,
  isDragging,
}) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === "hi";
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const userScrolledUpRef = useRef(false);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    userScrolledUpRef.current = !isAtBottom;
  };

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    if (!userScrolledUpRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chatMessages, isAiLoading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputQuery]);

  return (
    <>
      {/* Chat header */}
      <div
        onPointerDown={onHeaderPointerDown}
        className={`p-3.5 bg-gradient-to-r from-[#131f38]/90 via-[#18294a]/90 to-[#1f1e42]/90 border-b border-teal-500/25 flex items-center justify-between shrink-0 shadow-sm ${
          onHeaderPointerDown ? "cursor-grab active:cursor-grabbing select-none" : ""
        }`}
        title={onHeaderPointerDown ? (isHindi ? "ड्रैग करने के लिए पकड़ें" : "Drag to move across note") : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-teal-500/30 shrink-0">
            <Bot size={17} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-teal-400 ring-2 ring-[#141d30] motion-safe:animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {onHeaderPointerDown && <GripHorizontal size={14} className="text-teal-400/60 shrink-0" />}
              <h3 className="text-xs sm:text-sm font-extrabold text-white">
                {isHindi ? "AI नोट्स असिस्टेंट" : "AI Note Assistant"}
              </h3>
            </div>
            <p className="text-[10px] sm:text-[11px] text-teal-300/80 truncate">
              {isHindi ? "सवाल पूछें या टेक्स्ट हाइलाइट करें" : "Ask questions or highlight text to analyze"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() =>
              setChatMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  content: isHindi
                    ? `**${note.title}** के बारे में मुझसे कुछ भी पूछें!`
                    : `Ask me anything about **${note.title}**!`,
                },
              ])
            }
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-teal-500/20 border border-transparent hover:border-teal-400/30 transition-colors"
            title={isHindi ? "चैट साफ़ करें" : "Clear chat"}
            aria-label={isHindi ? "चैट साफ़ करें" : "Clear chat"}
          >
            <RefreshCw size={14} />
          </button>
          {onRequestClose && (
            <button
              type="button"
              onClick={onRequestClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors"
              title={isHindi ? "चैट बंद करें" : "Close chat"}
              aria-label={isHindi ? "चैट बंद करें" : "Close chat"}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages / empty state */}
      {isEmptyChat ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/40">
            <Bot size={26} className="text-white" />
            <span className="absolute inset-0 rounded-2xl ring-2 ring-white/30" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-extrabold text-white">
              {isHindi ? "इस नोट के बारे में पूछें" : "Ask about this note"}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-[220px]">
              {isHindi ? (
                <>
                  बाईं ओर किसी भी टेक्स्ट को हाइलाइट करें, या नीचे सवाल पूछें — मैंने{" "}
                  <span className="text-teal-300 font-semibold">{note.title}</span> पढ़ा है।
                </>
              ) : (
                <>
                  Highlight any text on the left, or type a question below — I've read{" "}
                  <span className="text-teal-300 font-semibold">{note.title}</span>.
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-teal-400/90 font-medium mt-1">
            <MessageCircleQuestion size={12} />
            <span>{isHindi ? 'प्रयास करें: "इस नोट का सारांश दें"' : 'Try "summarize this note" to start'}</span>
          </div>
        </div>
      ) : (
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-5 scroll-smooth overscroll-contain"
        >
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`group flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-400 via-emerald-400 to-indigo-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-teal-500/30">
                  <Bot size={14} />
                </div>
              )}

              <div
                className={
                  msg.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed bg-gradient-to-r from-[#0e172a] to-[#151f38] border border-cyan-500/30 text-slate-100 shadow-md shadow-black/50"
                    : "max-w-[88%] text-xs sm:text-sm leading-relaxed text-slate-100 border-l-2 border-teal-400/60 pl-3.5 py-0.5"
                }
              >
                {msg.highlightedContext && (
                  <div className="flex items-start gap-1.5 p-2 rounded-lg bg-[#090e1a]/80 border border-cyan-500/25 text-[11px] italic text-cyan-200/90 mb-1.5 shadow-inner">
                    <Quote size={11} className="mt-0.5 shrink-0 text-cyan-400" />
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
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-cyan-500/20">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected-text banner */}
      {selectedText && (
        <div className="px-3 py-2 bg-gradient-to-r from-teal-950/90 via-emerald-950/80 to-indigo-950/90 border-t border-b border-teal-400/40 flex items-center justify-between gap-2 shrink-0 shadow-inner">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-teal-300 truncate">
            <Quote size={11} className="shrink-0 text-teal-400" />
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
      <form onSubmit={onComposerSubmit} className="p-3 bg-[#121c33]/95 border-t border-teal-500/20 shrink-0">
        <div className="flex items-end gap-2 bg-[#182645]/90 border border-teal-500/35 rounded-2xl px-3.5 py-2 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/40 shadow-[0_0_15px_rgba(45,212,191,0.15)] transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              selectedText
                ? isHindi
                  ? "चयनित टेक्स्ट के बारे में पूछें..."
                  : "Ask about the selected text..."
                : isHindi
                  ? "इस नोट के बारे में AI से पूछें..."
                  : "Ask AI about this note..."
            }
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={onComposerKeyDown}
            disabled={isAiLoading}
            className="flex-1 resize-none bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none max-h-[120px] leading-relaxed py-1.5"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isAiLoading}
            className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 hover:from-teal-300 hover:to-indigo-400 text-white flex items-center justify-center transition-all shadow-md shadow-teal-500/30 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-0.5 hover:scale-105 active:scale-95"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </>
  );
});

export default function NoteViewerModal({ note, isOpen, onClose }) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === "hi";
  const [selectedText, setSelectedText] = useState("");
  const [popoverPos, setPopoverPos] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 640
  );

  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const chatCardRef = useRef(null);
  const avatarBtnRef = useRef(null);

  const [chatPos, setChatPos] = useState(null);
  const [avatarPos, setAvatarPos] = useState(null);
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);

  useEffect(() => {
    if (isOpen && note) {
      setChatMessages([
        {
          id: "welcome",
          role: "assistant",
          content: isHindi
            ? `नमस्ते! मैं **${note.title || "इस नोट"}** के लिए आपका AI स्टडी असिस्टेंट हूँ।\n\nनोट्स में किसी भी टेक्स्ट को हाइलाइट करें या नीचे सवाल पूछें!`
            : `Hi! I'm your AI study assistant for **${note.title || "this note"}**.\n\nHighlight any text in the note or ask a question below to get started.`,
        },
      ]);
      setSelectedText("");
      setPopoverPos(null);
      setInputQuery("");
      const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
      setIsChatVisible(!isMobile);
      setChatPos(null);
      setAvatarPos(null);
    }
  }, [isOpen, note, isHindi]);

  // Keep chat/avatar within bounds on window resize or fullscreen toggle
  useEffect(() => {
    const clampPositions = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();

      if (chatPos && chatCardRef.current) {
        const cardRect = chatCardRef.current.getBoundingClientRect();
        const maxX = Math.max(0, containerRect.width - cardRect.width);
        const maxY = Math.max(0, containerRect.height - cardRect.height);
        setChatPos((prev) =>
          prev
            ? {
                x: Math.max(0, Math.min(maxX, prev.x)),
                y: Math.max(0, Math.min(maxY, prev.y)),
              }
            : null
        );
      }

      if (avatarPos && avatarBtnRef.current) {
        const avatarRect = avatarBtnRef.current.getBoundingClientRect();
        const maxX = Math.max(0, containerRect.width - avatarRect.width);
        const maxY = Math.max(0, containerRect.height - avatarRect.height);
        setAvatarPos((prev) =>
          prev
            ? {
                x: Math.max(0, Math.min(maxX, prev.x)),
                y: Math.max(0, Math.min(maxY, prev.y)),
              }
            : null
        );
      }
    };

    window.addEventListener("resize", clampPositions);
    return () => window.removeEventListener("resize", clampPositions);
  }, [chatPos, avatarPos, isFullscreen]);

  const handleChatHeaderPointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      const container = containerRef.current;
      const card = chatCardRef.current;
      if (!container || !card) return;

      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      const currentX = chatPos ? chatPos.x : cardRect.left - containerRect.left;
      const currentY = chatPos ? chatPos.y : cardRect.top - containerRect.top;

      const startX = e.clientX;
      const startY = e.clientY;
      const target = e.currentTarget;

      try {
        target.setPointerCapture(e.pointerId);
      } catch (err) {}

      setIsDraggingChat(true);

      const handlePointerMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const maxX = containerRect.width - cardRect.width;
        const maxY = containerRect.height - cardRect.height;

        const newX = Math.max(0, Math.min(maxX, currentX + dx));
        const newY = Math.max(0, Math.min(maxY, currentY + dy));

        setChatPos({ x: newX, y: newY });
      };

      const handlePointerUp = (upEvent) => {
        try {
          target.releasePointerCapture(upEvent.pointerId);
        } catch (err) {}
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);
        target.removeEventListener("pointercancel", handlePointerUp);
        setIsDraggingChat(false);
      };

      target.addEventListener("pointermove", handlePointerMove);
      target.addEventListener("pointerup", handlePointerUp);
      target.addEventListener("pointercancel", handlePointerUp);
    },
    [chatPos]
  );

  const handleAvatarPointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      const container = containerRef.current;
      const avatar = avatarBtnRef.current;
      if (!container || !avatar) return;

      const containerRect = container.getBoundingClientRect();
      const avatarRect = avatar.getBoundingClientRect();

      const currentX = avatarPos ? avatarPos.x : avatarRect.left - containerRect.left;
      const currentY = avatarPos ? avatarPos.y : avatarRect.top - containerRect.top;

      const startX = e.clientX;
      const startY = e.clientY;
      let hasDragged = false;
      const target = e.currentTarget;

      try {
        target.setPointerCapture(e.pointerId);
      } catch (err) {}

      setIsDraggingAvatar(true);

      const handlePointerMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        if (Math.hypot(dx, dy) > 4) {
          hasDragged = true;
        }

        const maxX = containerRect.width - avatarRect.width;
        const maxY = containerRect.height - avatarRect.height;

        const newX = Math.max(0, Math.min(maxX, currentX + dx));
        const newY = Math.max(0, Math.min(maxY, currentY + dy));

        setAvatarPos({ x: newX, y: newY });
      };

      const handlePointerUp = (upEvent) => {
        try {
          target.releasePointerCapture(upEvent.pointerId);
        } catch (err) {}
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);
        target.removeEventListener("pointercancel", handlePointerUp);
        setIsDraggingAvatar(false);

        if (!hasDragged) {
          setIsChatVisible(true);
        }
      };

      target.addEventListener("pointermove", handlePointerMove);
      target.addEventListener("pointerup", handlePointerUp);
      target.addEventListener("pointercancel", handlePointerUp);
    },
    [avatarPos]
  );

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

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
            const popoverWidth = 200; // approx rendered width of the pill button
            setPopoverPos({
              top: Math.max(10, rect.top - 48),
              left: Math.min(
                Math.max(10, rect.left + rect.width / 2 - 68),
                window.innerWidth - popoverWidth - 10
              ),
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
        const systemContext = isHindi
          ? `नोट का शीर्षक: "${note.title}". ${note.description ? `विवरण: "${note.description}".` : ""} शिक्षक: "${note.instructorName || "शिक्षक"}". कृपया उत्तर केवल सरल और शुद्ध हिंदी में दें। यदि उपयोगकर्ता हिंग्लिश में पूछे, तो उत्तर हिंग्लिश में दें।`
          : `Note Title: "${note.title}". ${note.description ? `Description: "${note.description}".` : ""} Instructor: "${note.instructorName || "Instructor"}". Rule: Always match the user's language and script style! If the user asks in Hinglish (Hindi written in Roman letters, e.g. "iska mtlab kya hai"), respond naturally in Hinglish! Never default to formal English or state "I will explain in English".`;

        const apiHistory = [
          { role: "system", content: systemContext },
          ...updatedMessages.slice(-10).map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.highlightedContext
              ? `[Selected text from note: "${m.highlightedContext}"]\n\n${m.content}`
              : m.content,
          })),
        ];

        const res = await fetch(`${API_BASE_URL}/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            messages: apiHistory,
            language: isHindi ? "Hindi" : "English",
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
              ? {
                ...msg,
                content: isHindi
                  ? "क्षमा करें, उत्तर उत्पन्न करने में त्रुटि हुई। कृपया पुन: प्रयास करें।"
                  : "Sorry, I ran into an error generating an answer. Please try asking again.",
              }
              : msg
          )
        );
      } finally {
        setIsAiLoading(false);
      }
    },
    [chatMessages, isAiLoading, note, isHindi]
  );

  const handleAskAiAboutText = (overrideText = null) => {
    const textToAsk = overrideText || selectedText;
    if (!textToAsk) return;
    sendAiMessage(
      isHindi
        ? `नोट के इस भाग को हिंदी में विस्तार से समझाएं: "${textToAsk}"`
        : `Explain this text from the note: "${textToAsk}"`,
      textToAsk
    );
    setSelectedText("");
    setPopoverPos(null);
    setIsChatVisible(true);
  };

  const handleComposerSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || isAiLoading) return;
    sendAiMessage(inputQuery.trim(), selectedText || null);
    setSelectedText("");
    setPopoverPos(null);
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 p-2 sm:p-4 md:p-6 motion-safe:animate-fadeIn"
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
            className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f172a] border-2 border-teal-400 text-white text-xs font-black shadow-[0_10px_30px_rgba(0,0,0,0.9)] hover:bg-[#1e293b] hover:border-teal-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-400 fill-amber-400 shrink-0" />
            <span className="text-white font-extrabold tracking-wide drop-shadow">
              {isHindi ? "इसके बारे में AI से पूछें" : "Ask AI about this"}
            </span>
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#0f172a] border-r-2 border-b-2 border-teal-400" />
          </button>
        </div>
      )}

      {/* Main modal */}
      <div
        className={`relative w-full bg-gradient-to-b from-[#121c33] via-[#0d1425] to-[#0a0f1d] border border-teal-500/30 rounded-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden transition-[border-radius] duration-300 ${isFullscreen ? "fixed inset-0 rounded-none h-full max-h-full" : "max-w-7xl h-[94vh] max-h-[900px]"
          }`}
      >
        {/* Ambient glow orbs rendered with hardware-accelerated CSS radial gradients (0ms GPU blur overhead) */}
        <div className="pointer-events-none absolute -top-28 -left-20 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.22)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22)_0%,transparent_70%)]" />

        {/* Header */}
        <div className="relative px-4 py-3 sm:px-6 bg-[#162138] border-b border-teal-500/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex items-center justify-between gap-4 shrink-0">
          <div
            className={`absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-teal-400/70 to-transparent transition-opacity duration-500 ${isAiLoading ? "opacity-100 motion-safe:animate-pulse" : "opacity-0"
              }`}
          />

          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-slate-800/80"
              style={{ background: `${fileMeta.color}18`, boxShadow: `inset 0 0 0 1px ${fileMeta.color}30` }}
            >
              {fileMeta.type === "image" ? (
                <FileImage size={18} style={{ color: fileMeta.color }} />
              ) : (
                <FileText size={18} style={{ color: fileMeta.color }} />
              )}
            </div>

            <div className="min-w-0">
              {note.instructorName && (
                <p className="text-[11px] text-slate-400 truncate">
                  by <span className="text-slate-200 font-semibold">{note.instructorName}</span>
                </p>
              )}
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate leading-snug tracking-tight">
                {note.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsChatVisible((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors ${isChatVisible
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
              onClick={() => setIsFullscreen((v) => !v)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-400/20 rounded-xl transition-colors"
              title="Close"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div ref={containerRef} className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Document panel — full screen preview */}
          <div
            ref={viewerRef}
            className="relative flex-1 flex flex-col bg-[#0b0f19] h-full overflow-hidden select-text"
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
              <div className="relative w-full h-full bg-slate-950/40 overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#0b0f19] z-20 pointer-events-auto" />
                <iframe src={fallbackUrl} title={note.title} className="w-full h-full border-0" allowFullScreen />
              </div>
            )}
          </div>

          {/* AI Chat Popup Card — sleek, draggable floating widget */}
          {isChatVisible && (
            <div
              ref={chatCardRef}
              style={chatPos ? { left: `${chatPos.x}px`, top: `${chatPos.y}px`, right: "auto", bottom: "auto" } : {}}
              className={`absolute z-50 w-[calc(100%-1.5rem)] sm:w-[380px] lg:w-[410px] h-[500px] max-h-[72vh] flex flex-col bg-[#101726] border border-teal-500/35 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden transition-shadow ${
                !chatPos ? "bottom-3 right-3 sm:bottom-5 sm:right-5" : ""
              } ${isDraggingChat ? "ring-2 ring-teal-400 shadow-[0_30px_90px_rgba(45,212,191,0.3)]" : "motion-safe:animate-popIn"}`}
            >
              <ChatPanelContent
                note={note}
                chatMessages={chatMessages}
                setChatMessages={setChatMessages}
                isEmptyChat={isEmptyChat}
                selectedText={selectedText}
                setSelectedText={setSelectedText}
                inputQuery={inputQuery}
                setInputQuery={setInputQuery}
                isAiLoading={isAiLoading}
                onComposerSubmit={handleComposerSubmit}
                onComposerKeyDown={handleComposerKeyDown}
                onRequestClose={() => setIsChatVisible(false)}
                onHeaderPointerDown={handleChatHeaderPointerDown}
                isDragging={isDraggingChat}
              />
            </div>
          )}

          {/* Floating avatar launcher — draggable button */}
          {!isChatVisible && (
            <button
              ref={avatarBtnRef}
              type="button"
              onPointerDown={handleAvatarPointerDown}
              style={avatarPos ? { left: `${avatarPos.x}px`, top: `${avatarPos.y}px`, right: "auto", bottom: "auto" } : {}}
              className={`absolute z-30 w-14 h-14 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-black/50 border border-white/20 hover:scale-105 active:scale-95 transition-transform cursor-grab active:cursor-grabbing select-none ${
                !avatarPos ? "bottom-5 right-5" : ""
              } ${isDraggingAvatar ? "ring-4 ring-teal-400/50 scale-110" : ""}`}
              aria-label="Open AI chat"
              title="Click to open AI chat, or drag to reposition"
            >
              <GripHorizontal size={14} className="absolute top-1 text-teal-200/60" />
              <Bot size={22} className="mt-1" />
              <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-teal-400 ring-2 ring-[#0d1322] motion-safe:animate-pulse" />
            </button>
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