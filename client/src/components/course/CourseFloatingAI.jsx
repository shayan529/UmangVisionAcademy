import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Bot,
  X,
  Send,
  RefreshCw,
  Copy,
  Check,
  GripHorizontal,
  Video,
  FileText,
  Sparkles,
  Cloud,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { useTranslation } from "react-i18next";
import { getAiLanguageName } from "../../utils/aiLanguage";

// ── Minimal markdown → JSX formatter for AI responses ──
const escapeHtml = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const inlineFormat = (line) =>
  escapeHtml(line)
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-black/30 text-cyan-300 text-[0.85em]">$1</code>')
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
        <ul key={`ul-${key}`} className="list-disc list-outside pl-4 space-y-1 my-1 text-slate-200">
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

  return <div className="space-y-1 leading-relaxed text-xs sm:text-sm text-slate-200">{blocks}</div>;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 h-4" aria-label="AI is responding">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-cyan-400 motion-safe:animate-bounce"
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
        } catch { }
      }}
      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-white/10"
      title="Copy response"
      aria-label="Copy response"
    >
      {copied ? <Check size={12} className="text-cyan-400" /> : <Copy size={12} />}
    </button>
  );
}

const getClientCoords = (e) => {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if (e.changedTouches && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
};

// ── RobotAvatar Helper ────────────────────────────────────────────────────────
function RobotAvatar({ size = "md", className = "" }) {
  if (size === "lg") {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/40 via-indigo-500/40 to-purple-500/40 blur-xl animate-pulse" />

        {/* 3D Holographic Futuristic Robot SVG */}
        <div className="relative z-10 w-16 h-16 sm:w-36 sm:h-36 flex items-center justify-center">
          <svg viewBox="0 0 120 120" className="w-full h-full filter drop-shadow-[0_0_20px_rgba(6,182,212,0.7)] drop-shadow-[0_8px_25px_rgba(168,85,247,0.5)]">
            <defs>
              <linearGradient id="botGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0b1324" />
              </linearGradient>
              <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
              </radialGradient>
            </defs>

            {/* Antenna & Signal Beacon */}
            <line x1="60" y1="20" x2="60" y2="35" stroke="url(#botGrad)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="16" r="5" fill="#22d3ee" className="animate-ping" style={{ transformOrigin: "60px 16px" }} />
            <circle cx="60" cy="16" r="4" fill="#67e8f9" />

            {/* Robot Head Outer Shell */}
            <rect x="30" y="32" width="60" height="46" rx="16" fill="url(#bodyGrad)" stroke="url(#botGrad)" strokeWidth="2.5" />

            {/* Ear Caps */}
            <rect x="22" y="46" width="8" height="18" rx="4" fill="#334155" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="90" y="46" width="8" height="18" rx="4" fill="#334155" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Visor Screen */}
            <rect x="38" y="42" width="44" height="22" rx="10" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
            <rect x="40" y="44" width="40" height="18" rx="8" fill="url(#visorGrad)" opacity="0.18" />

            {/* Glowing Eyes */}
            <circle cx="50" cy="53" r="4.5" fill="#22d3ee" className="animate-pulse" />
            <circle cx="50" cy="53" r="2" fill="#ffffff" />
            <circle cx="70" cy="53" r="4.5" fill="#22d3ee" className="animate-pulse" />
            <circle cx="70" cy="53" r="2" fill="#ffffff" />

            {/* Mouth / Speaker Grill */}
            <line x1="52" y1="67" x2="68" y2="67" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

            {/* Robot Neck */}
            <rect x="52" y="78" width="16" height="8" rx="2" fill="#334155" />

            {/* Robot Chest & Core Power Orb */}
            <path d="M 32 86 Q 60 82 88 86 L 82 108 Q 60 112 38 108 Z" fill="url(#bodyGrad)" stroke="url(#botGrad)" strokeWidth="2" />
            <circle cx="60" cy="96" r="7" fill="url(#coreGlow)" className="animate-pulse" />
            <circle cx="60" cy="96" r="3" fill="#ffffff" />
          </svg>
        </div>

        {/* Online Status Dot */}
        <span className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-cyan-300 ring-2 ring-[#0a1222] motion-safe:animate-ping pointer-events-none z-20" />
        <span className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-cyan-400 ring-2 ring-[#0a1222] pointer-events-none z-20" />
      </div>
    );
  }

  // Small/Medium icon for header & message bubbles
  return (
    <div className={`relative flex items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 p-0.5 shadow-sm border border-cyan-300/80 ${className}`}>
      <div className="w-full h-full rounded-full bg-[#0d172a] flex items-center justify-center">
        <Bot className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} text-cyan-300`} />
      </div>
    </div>
  );
}

export default function CourseFloatingAI({
  course,
  activeLesson,
  allLessons = [],
  currentVideoPct = 0,
  initialTime = 0,
}) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === "hi";

  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [selectedText, setSelectedText] = useState("");
  const [popoverPos, setPopoverPos] = useState(null);

  const [chatPos, setChatPos] = useState(null);
  const [avatarPos, setAvatarPos] = useState(null);
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);

  const chatCardRef = useRef(null);
  const avatarBtnRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize welcome message when opened
  useEffect(() => {
    if (chatMessages.length === 0) {
      if (course) {
        setChatMessages([
          {
            id: "welcome",
            role: "assistant",
            content: isHindi
              ? `✨ नमस्ते! मैं आपका **AI गाइड** हूँ — आपके **${course.title || "इस कोर्स"}** के लिए।\n\nमैं इस कोर्स के सभी वीडियो, लेसन्स और नोट्स को समझता हूँ। मुझसे कोई भी सवाल पूछें!`
              : `✨ Hi! I'm your **AI Course Guide** for **${course.title || "this course"}**.\n\nI have full context of all videos, lessons, and notes in this course. Ask me anything!`,
          },
        ]);
      } else {
        setChatMessages([
          {
            id: "welcome",
            role: "assistant",
            content: isHindi
              ? `✨ नमस्ते! मैं आपका **AI एकेडमी गाइड** हूँ!\n\nआप मुझसे स्टूडेंट डैशबोर्ड के किसी भी फीचर (माई कोर्सेस, लाइव सेशंस, नोट्स, मॉक टेस्ट, वॉलेट, सर्टिफिकेट्स आदि) या पढ़ाई से जुड़ा कोई भी सवाल पूछ सकते हैं!`
              : `✨ Hi! I'm your **AI Academy Guide**!\n\nYou can ask me about any feature on the Student Dashboard (My Courses, Live Sessions, Study Notes, Mock Tests, Wallet, Certificates, etc.) or any study question!`,
          },
        ]);
      }
    }
  }, [course, isHindi, chatMessages.length]);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  useEffect(() => {
    const updateModalState = () => {
      const active = Boolean(
        window.__isNoteViewerModalOpen ||
        document.body.classList.contains("note-viewer-open") ||
        document.querySelector('[data-note-modal]')
      );
      setIsNoteModalOpen(active);
    };

    updateModalState();
    window.addEventListener("note-viewer-modal-toggle", updateModalState);
    const observer = new MutationObserver(updateModalState);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    return () => {
      window.removeEventListener("note-viewer-modal-toggle", updateModalState);
      observer.disconnect();
    };
  }, []);

  // Text selection listener for highlight-to-ask
  useEffect(() => {
    const handleSelectionChange = () => {
      // If note viewer modal is open or selection is inside note viewer, let the note viewer handle it
      if (
        window.__isNoteViewerModalOpen ||
        document.body.classList.contains("note-viewer-open") ||
        document.querySelector('[data-note-modal]')
      ) {
        setPopoverPos(null);
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPopoverPos(null);
        return;
      }

      try {
        const anchorEl =
          selection.anchorNode?.nodeType === 1
            ? selection.anchorNode
            : selection.anchorNode?.parentElement;
        if (
          anchorEl?.closest?.(
            '[data-note-modal], .note-viewer-modal, [role="dialog"]',
          )
        ) {
          setPopoverPos(null);
          return;
        }
      } catch {
        /* ignore */
      }

      const text = selection.toString().trim();
      if (text.length > 1) {
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setSelectedText(text);
            const popoverWidth = 190;
            const showBelow = rect.top < 65;
            const topPos = showBelow
              ? Math.min(window.innerHeight - 60, rect.bottom + 10)
              : Math.max(10, rect.top - 52);

            setPopoverPos({
              top: topPos,
              left: Math.min(
                Math.max(10, rect.left + rect.width / 2 - 80),
                window.innerWidth - popoverWidth - 10
              ),
              showBelow,
            });
          }
        } catch {
          /* range error ignored */
        }
      } else {
        setPopoverPos(null);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("touchend", handleSelectionChange);
    document.addEventListener("keyup", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("touchend", handleSelectionChange);
      document.removeEventListener("keyup", handleSelectionChange);
    };
  }, []);

  // Auto scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isAiLoading, isOpen]);

  // Auto resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputQuery]);

  // Build full course / dashboard context for system prompt
  const buildSystemContext = useCallback(() => {
    if (!course) {
      let context = `You are the friendly and expert AI Academy Guide for Umang Vision Academy.
You are embedded across the Student Dashboard and are here to help the student with ANY feature, page, or study concept.

STUDENT DASHBOARD FEATURES YOU CAN HELP WITH & EXPLAIN:
1. Dashboard Overview: Quick stats, enrolled courses progress, upcoming live sessions, daily study streak.
2. My Courses: Access enrolled courses, watch video lessons, view chapter content, and track completion progress.
3. Live Sessions: Join scheduled live interactive classes with instructors, view meeting links, and watch recorded past classes.
4. Study Notes: Chapter-wise PDF notes, interactive reader, text selection search, and AI note explanations.
5. Question Bank: Subject & class practice questions with step-by-step solutions.
6. AI Tutor: Dedicated 1-on-1 AI chat tutor for deep concept explanations, problem-solving, and homework help.
7. Mock Tests: Online timed practice tests, instant score breakdown, subject tests, and detailed answer keys.
8. Progress & Analytics: Charts of total study time, completed lessons, subject strengths, and growth tracking.
9. Leaderboard & Achievements: Class rankings, top scoring students, badges, and learning milestones.
10. Certificates: Downloadable verified completion certificates for completed courses.
11. Wallet & Referral: Wallet balance for buying courses/plans, transaction log, and referral links to earn cash bonuses.
12. Settings & Class Switch: Profile updates, class selection (Class 9, Class 10, Class 11, Class 12, Competitive Exams), and account settings.

` + (isHindi
        ? `RULE: Answer the student clearly in Hindi or Hinglish based on their language. Be encouraging, educational, concise, and helpful.`
        : `RULE: Always match the user's language (English, Hindi, Hinglish, etc.). Be encouraging, educational, clear, and guide them on platform features.`);
      return context;
    }

    const courseTitle = course.title || "Course";
    const courseDesc = course.description || "";
    const instructor = course.instructorName || course.instructor?.name || "Instructor";

    let context = `You are the friendly and expert AI Learning Guide for the course "${courseTitle}".\n`;
    if (courseDesc) context += `Course Overview: "${courseDesc}".\n`;
    if (instructor) context += `Instructor: "${instructor}".\n`;

    // Active lesson context
    if (activeLesson) {
      context += `\nCURRENTLY WATCHING / ACTIVE LESSON:\n`;
      context += `- Title: "${activeLesson.title || "Untitled Lesson"}"\n`;
      if (activeLesson.subject) context += `- Subject: "${activeLesson.subject}"\n`;
      if (activeLesson.chapterTitle) context += `- Chapter: "${activeLesson.chapterTitle}"\n`;
      context += `- Type: ${activeLesson.type || "video"}\n`;
      if (currentVideoPct > 0) context += `- Progress: ${Math.round(currentVideoPct)}% watched\n`;
      if (initialTime > 0) context += `- Current Time: ${Math.floor(initialTime / 60)}m ${Math.floor(initialTime % 60)}s\n`;
      if (activeLesson.description) context += `- Lesson Details: "${activeLesson.description}"\n`;
    }

    // Lessons list
    if (allLessons.length > 0) {
      context += `\nALL LESSONS & VIDEOS IN THIS COURSE (${allLessons.length} total):\n`;
      allLessons.slice(0, 30).forEach((l, i) => {
        context += `${i + 1}. [${l.subject || "General"}] ${l.chapterTitle ? l.chapterTitle + " - " : ""}${l.title} (${l.type || "video"})\n`;
      });
    }

    // Notes list
    if (course.notes && course.notes.length > 0) {
      context += `\nALL NOTES IN THIS COURSE (${course.notes.length} total):\n`;
      course.notes.slice(0, 20).forEach((n, i) => {
        context += `${i + 1}. [${n.subject || "Notes"}] ${n.chapterTitle ? n.chapterTitle + " - " : ""}${n.title}\n`;
      });
    }

    if (isHindi) {
      context += `\nRULE: Answer the student clearly in Hindi or Hinglish based on their language. Keep answers concise, educational, and accurate to the course context.`;
    } else {
      context += `\nRULE: Always match the user's language and style (English, Hindi, or Hinglish). Be encouraging, educational, and reference the course videos and notes accurately.`;
    }

    return context;
  }, [course, activeLesson, allLessons, currentVideoPct, initialTime, isHindi]);

  // Send message handler
  const handleSendMessage = useCallback(async (promptText) => {
    const textToSend = promptText || inputQuery;
    if (!textToSend || !textToSend.trim() || isAiLoading) return;

    const userPrompt = textToSend.trim();
    const newMsgId = Date.now().toString();
    const userMsg = { id: newMsgId, role: "user", content: userPrompt };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setInputQuery("");
    setIsAiLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    setChatMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", content: "" }]);

    try {
      const systemContext = buildSystemContext();

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
          language: getAiLanguageName(i18n.language),
          userRole: "student",
        }),
      });

      if (!res.ok) throw new Error("Failed to connect to AI service.");

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
      console.error("Course AI Error:", err);
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
              ...msg,
              content: isHindi
                ? "क्षमा करें, AI उत्तर उत्पन्न करने में त्रुटि हुई। कृपया पुनः प्रयास करें।"
                : "Sorry, I ran into an error generating the response. Please try again.",
            }
            : msg
        )
      );
    } finally {
      setIsAiLoading(false);
    }
  }, [inputQuery, isAiLoading, chatMessages, buildSystemContext, isHindi]);

  const onComposerKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Dragging logic for chat panel header
  const handleChatHeaderPointerDown = useCallback(
    (e) => {
      if (e.button !== undefined && e.button > 0) return;
      const chatCard = chatCardRef.current;
      if (!chatCard) return;

      const cardRect = chatCard.getBoundingClientRect();
      const currentX = chatPos ? chatPos.x : cardRect.left;
      const currentY = chatPos ? chatPos.y : cardRect.top;

      const startCoords = getClientCoords(e);
      const startX = startCoords.x;
      const startY = startCoords.y;
      const target = e.currentTarget;

      try {
        if (e.pointerId !== undefined && target.setPointerCapture) {
          target.setPointerCapture(e.pointerId);
        }
      } catch (err) { }

      setIsDraggingChat(true);

      const handleMove = (moveEvent) => {
        const moveCoords = getClientCoords(moveEvent);
        const dx = moveCoords.x - startX;
        const dy = moveCoords.y - startY;

        const maxX = window.innerWidth - cardRect.width - 10;
        const maxY = window.innerHeight - cardRect.height - 10;

        const newX = Math.max(10, Math.min(maxX, currentX + dx));
        const newY = Math.max(10, Math.min(maxY, currentY + dy));

        setChatPos({ x: newX, y: newY });
      };

      const handleUp = (upEvent) => {
        try {
          if (upEvent.pointerId !== undefined && target.releasePointerCapture) {
            target.releasePointerCapture(upEvent.pointerId);
          }
        } catch (err) { }
        target.removeEventListener("pointermove", handleMove);
        target.removeEventListener("pointerup", handleUp);
        target.removeEventListener("pointercancel", handleUp);
        target.removeEventListener("touchmove", handleMove);
        target.removeEventListener("touchend", handleUp);
        target.removeEventListener("touchcancel", handleUp);
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleUp);
        setIsDraggingChat(false);
      };

      target.addEventListener("pointermove", handleMove);
      target.addEventListener("pointerup", handleUp);
      target.addEventListener("pointercancel", handleUp);
      target.addEventListener("touchmove", handleMove, { passive: false });
      target.addEventListener("touchend", handleUp);
      target.addEventListener("touchcancel", handleUp);
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleUp);
    },
    [chatPos]
  );

  // Dragging logic for avatar launcher container
  const handleAvatarPointerDown = useCallback(
    (e) => {
      if (e.button !== undefined && e.button > 0) return;
      const avatar = avatarBtnRef.current;
      if (!avatar) return;

      const avatarRect = avatar.getBoundingClientRect();
      const currentX = avatarPos ? avatarPos.x : avatarRect.left;
      const currentY = avatarPos ? avatarPos.y : avatarRect.top;

      const startCoords = getClientCoords(e);
      const startX = startCoords.x;
      const startY = startCoords.y;
      let hasDragged = false;
      const target = e.currentTarget;

      try {
        if (e.pointerId !== undefined && target.setPointerCapture) {
          target.setPointerCapture(e.pointerId);
        }
      } catch (err) { }

      setIsDraggingAvatar(true);

      const handleMove = (moveEvent) => {
        const moveCoords = getClientCoords(moveEvent);
        const dx = moveCoords.x - startX;
        const dy = moveCoords.y - startY;

        if (Math.hypot(dx, dy) > 4) {
          hasDragged = true;
        }

        const maxX = window.innerWidth - avatarRect.width - 10;
        const maxY = window.innerHeight - avatarRect.height - 10;

        const newX = Math.max(10, Math.min(maxX, currentX + dx));
        const newY = Math.max(10, Math.min(maxY, currentY + dy));

        setAvatarPos({ x: newX, y: newY });
      };

      const handleUp = (upEvent) => {
        try {
          if (upEvent.pointerId !== undefined && target.releasePointerCapture) {
            target.releasePointerCapture(upEvent.pointerId);
          }
        } catch (err) { }
        target.removeEventListener("pointermove", handleMove);
        target.removeEventListener("pointerup", handleUp);
        target.removeEventListener("pointercancel", handleUp);
        target.removeEventListener("touchmove", handleMove);
        target.removeEventListener("touchend", handleUp);
        target.removeEventListener("touchcancel", handleUp);
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleUp);
        setIsDraggingAvatar(false);

        if (!hasDragged) {
          setIsOpen((prev) => !prev);
        }
      };

      target.addEventListener("pointermove", handleMove);
      target.addEventListener("pointerup", handleUp);
      target.addEventListener("pointercancel", handleUp);
      target.addEventListener("touchmove", handleMove, { passive: false });
      target.addEventListener("touchend", handleUp);
      target.addEventListener("touchcancel", handleUp);
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleUp);
    },
    [avatarPos]
  );

  const quickPrompts = useMemo(() => {
    if (isHindi) {
      return [
        `वर्तमान वीडियो "${activeLesson?.title || "पाठ"}" का सारांश दें`,
        `इस कोर्स में कौन-कौन से नोट्स उपलब्ध हैं?`,
        `इस पाठ के मुख्य बिंदु समझाइए`,
      ];
    }
    return [
      `Summarize current video "${activeLesson?.title || "lesson"}"`,
      `What notes are available in this course?`,
      `Explain the key concepts of this lesson`,
    ];
  }, [activeLesson, isHindi]);

  if (isNoteModalOpen) return null;

  return (
    <>
      {/* Floating Highlight-to-Ask Popover — shows on selection whether chat is open or not */}
      {popoverPos && selectedText && (
        <div
          style={{
            position: "fixed",
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            zIndex: 99999,
          }}
          className="motion-safe:animate-popIn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-500/30 border border-cyan-200/40 cursor-pointer hover:scale-105 transition-all select-none"
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => {
            const prompt = isHindi
              ? `चयनित टेक्स्ट के बारे में समझाइए: "${selectedText}"`
              : `Explain this highlighted text: "${selectedText}"`;
            if (isOpen) {
              // Chat already open — prefill the textarea
              setInputQuery(prompt);
              setTimeout(() => textareaRef.current?.focus(), 50);
            } else {
              setIsOpen(true);
              handleSendMessage(prompt);
            }
            setPopoverPos(null);
            window.getSelection()?.removeAllRanges();
          }}
        >
          <Sparkles size={14} className="text-sky-100" />
          <span>{isHindi ? "AI से पूछें" : "Ask AI"}</span>
        </div>
      )}

      {/* Floating Robot AI Figure + Cloud Speech Bubble Comment ("Ask AI") */}
      {!isOpen && (
        <div
          ref={avatarBtnRef}
          onPointerDown={handleAvatarPointerDown}
          onTouchStart={handleAvatarPointerDown}
          style={avatarPos ? { left: `${avatarPos.x}px`, top: `${avatarPos.y}px`, right: "auto", bottom: "auto" } : {}}
          className={`fixed z-50 flex items-center gap-2 sm:gap-3 select-none touch-none cursor-grab active:cursor-grabbing group motion-safe:animate-cloudFloat ${!avatarPos ? "bottom-28 right-3 sm:bottom-6 sm:right-6" : ""
            }`}
        >
          {/* Cloud Speech Bubble Comment ("Ask AI") */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex relative flex-col items-start px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl sm:rounded-br-none bg-gradient-to-r from-[#0d1e38]/95 via-[#132d54]/95 to-[#1c1440]/95 border-2 border-cyan-400/70 shadow-[0_10px_35px_rgba(6,182,212,0.45)] backdrop-blur-md hover:scale-105 transition-all text-left group-hover:border-cyan-300 cursor-pointer"
            title="Click to open AI chat"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles size={13} className="text-yellow-300 animate-pulse" />
              <span className="text-xs font-black text-cyan-200 uppercase tracking-wider">
                {isHindi ? "AI से पूछें" : "Ask AI"}
              </span>
            </div>
            <span className="text-[10px] text-slate-300 font-semibold max-w-[145px] truncate leading-tight">
              {activeLesson?.title
                ? `Ask about "${activeLesson.title}"`
                : course?.title
                  ? isHindi ? "वीडियो और नोट्स से सवाल पूछें" : "Ask about videos & notes"
                  : isHindi ? "डैशबोर्ड व स्टडी से सवाल पूछें" : "Ask about dashboard & study"}
            </span>

            {/* Pointer tail pointing right to avatar (desktop only) */}
            <div className="hidden sm:block absolute -right-2 bottom-3 w-0 h-0 border-t-[7px] border-t-transparent border-l-[10px] border-l-cyan-400/80 border-b-[7px] border-b-transparent" />
          </button>

          {/* Holographic 3D Robot Avatar — visible on both mobile & desktop */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Assistant"
            className={`flex relative items-center justify-center cursor-pointer border-none bg-transparent p-0 transition-transform duration-300 hover:scale-110 active:scale-95 ${isDraggingAvatar ? "scale-110" : ""
              }`}
          >
            <RobotAvatar size="lg" />
          </button>
        </div>
      )}

      {/* Floating AI Chat Panel Card Widget */}
      {isOpen && (
        <div
          ref={chatCardRef}
          style={chatPos ? { left: `${chatPos.x}px`, top: `${chatPos.y}px`, right: "auto", bottom: "auto" } : {}}
          className={`fixed z-50 w-[calc(100vw-2rem)] sm:w-[390px] lg:w-[420px] h-[540px] max-h-[80vh] flex flex-col bg-[#0b1424] border border-cyan-500/40 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden transition-shadow ${!chatPos ? "bottom-20 right-4 sm:bottom-6 sm:right-6" : ""
            } ${isDraggingChat ? "ring-2 ring-cyan-400 shadow-[0_30px_90px_rgba(6,182,212,0.4)]" : "motion-safe:animate-popIn"}`}
        >
          {/* Header */}
          <div
            onPointerDown={handleChatHeaderPointerDown}
            onTouchStart={handleChatHeaderPointerDown}
            className="p-3.5 bg-gradient-to-r from-sky-950 via-indigo-950 to-purple-950 border-b border-cyan-400/30 flex items-center justify-between shrink-0 shadow-sm touch-none cursor-grab active:cursor-grabbing select-none"
            title="Drag to move across page"
          >
            <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
              <RobotAvatar size="md" className="w-9 h-9 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <GripHorizontal size={14} className="text-cyan-400/70 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-black text-white truncate tracking-wide">
                    {course
                      ? (isHindi ? "Ask AI · AI कोर्स गाइड" : "Ask AI · Course AI Guide")
                      : (isHindi ? "Ask AI · AI एकेडमी गाइड" : "Ask AI · Academy AI Guide")}
                  </h3>
                </div>
                <p className="text-[10px] sm:text-[11px] text-cyan-300/90 truncate font-medium">
                  {activeLesson?.title
                    ? `${activeLesson.title}`
                    : course?.title
                      ? (isHindi ? "वीडियो और नोट्स से मदद पाएं" : "Context from course videos & notes")
                      : (isHindi ? "डैशबोर्ड फीचर्स व स्टडी से मदद पाएं" : "Dashboard features, courses & study guide")}
                </p>
              </div>
            </div>

            {/* Header controls — stopPropagation prevents pointer capture from header drag */}
            <div
              className="flex items-center gap-1 shrink-0 relative z-20 pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setChatMessages([
                    {
                      id: "welcome",
                      role: "assistant",
                      content: isHindi
                        ? `☁️ **${course?.title || "इस कोर्स"}** के बारे में मुझसे कुछ भी पूछें!`
                        : `☁️ Ask me anything about **${course?.title || "this course"}**!`,
                    },
                  ]);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  setChatMessages([
                    {
                      id: "welcome",
                      role: "assistant",
                      content: isHindi
                        ? `☁️ **${course?.title || "इस कोर्स"}** के बारे में मुझसे कुछ भी पूछें!`
                        : `☁️ Ask me anything about **${course?.title || "this course"}**!`,
                    },
                  ]);
                }}
                className="p-1.5 text-slate-300 hover:text-white active:bg-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors cursor-pointer"
                title={isHindi ? "चैट साफ़ करें" : "Clear chat"}
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-1.5 text-slate-300 hover:text-white active:bg-rose-500/30 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title={isHindi ? "बंद करें" : "Close chat"}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Active video / note badge banner */}
          {activeLesson && (
            <div className="px-3.5 py-1.5 bg-[#0e1b33] border-b border-cyan-500/20 flex items-center justify-between text-[11px] text-slate-300 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                {activeLesson.type === "video" ? (
                  <Video size={13} className="text-cyan-400 shrink-0" />
                ) : (
                  <FileText size={13} className="text-sky-400 shrink-0" />
                )}
                <span className="truncate font-medium">{activeLesson.title}</span>
              </div>
              {currentVideoPct > 0 && (
                <span className="text-[10px] text-cyan-300 font-mono shrink-0 ml-2">
                  {Math.round(currentVideoPct)}%
                </span>
              )}
            </div>
          )}

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar bg-[#09101d]">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"} group`}
              >
                {msg.role === "assistant" && (
                  <RobotAvatar size="sm" className="w-7 h-7 shrink-0 mt-0.5" />
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-sm relative ${msg.role === "user"
                    ? "bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white rounded-br-none"
                    : "bg-[#13213a] text-slate-200 border border-cyan-500/25 rounded-bl-none"
                    }`}
                >
                  {msg.role === "assistant" && !msg.content ? (
                    <div className="flex items-center gap-2">
                      <TypingDots />
                      <span className="text-[11px] text-cyan-300/80 font-medium">
                        {isHindi ? "विश्लेषण कर रहा है..." : "Thinking..."}
                      </span>
                    </div>
                  ) : (
                    <FormattedMessage text={msg.content} />
                  )}
                  {msg.role === "assistant" && msg.content && (
                    <div className="flex justify-end mt-1 pt-1 border-t border-white/5">
                      <CopyButton value={msg.content} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts suggestions (if few messages) */}
          {chatMessages.length <= 2 && !isAiLoading && (
            <div className="px-3 py-2 bg-[#0e192e] border-t border-cyan-500/20 flex flex-wrap gap-1.5 shrink-0">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(qp)}
                  className="text-[11px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300 px-2.5 py-1 rounded-full text-left transition-colors truncate max-w-full font-medium"
                >
                  ✨ {qp}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#0d182b]/95 border-t border-cyan-500/25 shrink-0"
          >
            <div className="flex items-end gap-2 bg-[#122340]/90 border border-cyan-500/40 rounded-2xl px-3.5 py-2 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  isHindi
                    ? "AI से सवाल पूछें (वीडियो, नोट्स)..."
                    : "Ask AI about videos, notes..."
                }
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={onComposerKeyDown}
                disabled={isAiLoading}
                className="flex-1 resize-none bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none max-h-[120px] leading-relaxed py-1.5"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isAiLoading}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-600 hover:from-cyan-300 hover:to-fuchsia-500 text-white flex items-center justify-center transition-all shadow-md shadow-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-0.5 hover:scale-105 active:scale-95"
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes cloudFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        .motion-safe\\:animate-cloudFloat {
          animation: cloudFloat 4s ease-in-out infinite;
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .motion-safe\\:animate-popIn { animation: popIn 0.15s ease-out; }

        /* Light blue text selection styling across notes & course lessons */
        ::selection {
          background-color: rgba(56, 189, 248, 0.45) !important;
          color: inherit !important;
        }
        ::-moz-selection {
          background-color: rgba(56, 189, 248, 0.45) !important;
          color: inherit !important;
        }
        .pdf-text-layer span::selection {
          background-color: rgba(56, 189, 248, 0.45) !important;
          color: transparent !important;
        }
      `}</style>
    </>
  );
}