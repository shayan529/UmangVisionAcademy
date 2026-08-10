import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { SOCKET_URL, API_ENDPOINTS } from "../../config/api.js";
import api from "../../config/api.js";
import { uploadFile } from "../../utils/uploadFile.js";
import {
  fetchAvailableInstructors,
  getOrCreateConversation,
  fetchConversations,
  deleteMessage,
  socketMessageReceived,
  socketTypingReceived,
  socketReadReceived,
  setMessages,
  setActiveConversation,
  clearTyping,
  resetChat,
} from "../../redux/slices/instructorChatSlice.js";
import {
  Paperclip,
  Send,
  X,
  ChevronLeft,
  Trash2,
  Video,
  Search,
  BookOpen,
  MessageSquare,
  Sparkles,
  Check,
  CheckCheck,
  Plus,
  Copy,
  ExternalLink,
  Info,
  Maximize2,
  FileText,
  Clock,
  ShieldCheck,
  HelpCircle,
  MessageCircle,
  ChevronRight,
  Smile,
  ArrowDown,
  Download,
} from "lucide-react";

const TYPING_DEBOUNCE = 1500;
const GROUP_WINDOW_MS = 5 * 60 * 1000;

// ── Time & Date Helpers ───────────────────────────────────────────────────────
const fmtTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const today = new Date();
  if (dt.toDateString() === today.toDateString()) return "Today";
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (dt.toDateString() === y.toDateString()) return "Yesterday";
  return dt.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: dt.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

const initialOf = (name) => name?.trim()?.charAt(0)?.toUpperCase() || "?";

const isSameSender = (a, b) => {
  if (!a || !b) return false;
  const idA = a.sender?._id?.toString?.() ?? a.sender?.toString?.();
  const idB = b.sender?._id?.toString?.() ?? b.sender?.toString?.();
  return idA && idB && idA === idB;
};

const getLastMessageText = (lastMsg) => {
  if (!lastMsg) return "";
  if (typeof lastMsg === "string") return lastMsg;
  if (typeof lastMsg === "object") return lastMsg.text || "";
  return String(lastMsg);
};

const getLastMessageTime = (conv) => {
  if (conv?.lastMessageAt) return conv.lastMessageAt;
  if (conv?.lastMessage?.at) return conv.lastMessage.at;
  if (conv?.updatedAt) return conv.updatedAt;
  return null;
};

// Modern Glass & Pulse CSS
const CustomStyles = () => (
  <style>{`
    .pro-chat-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .pro-chat-scroll::-webkit-scrollbar-track { background: transparent; }
    .pro-chat-scroll::-webkit-scrollbar-thumb { background: rgba(113, 113, 122, 0.35); border-radius: 999px; }
    .pro-chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(113, 113, 122, 0.55); }

    @keyframes pro-pop-in {
      from { opacity: 0; transform: translate3d(0, 8px, 0) scale(0.98); }
      to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
    }
    .pro-msg-in { animation: pro-pop-in 180ms cubic-bezier(0.16, 1, 0.3, 1); will-change: transform, opacity; }

    @keyframes pro-pulse-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.15); }
      50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.30); }
    }
    .pro-glow-active { animation: pro-pulse-glow 3s infinite ease-in-out; }
  `}</style>
);

// ── Date divider ──────────────────────────────────────────────────────────────
const DateDivider = ({ label }) => (
  <div className="flex items-center gap-3 my-6 select-none px-4">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#223068] to-transparent" />
    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 bg-[#101738] border border-[#223068] px-4 py-1 rounded-full shadow-sm">
      {label}
    </span>
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#223068] to-transparent" />
  </div>
);

// ── Image Lightbox Modal ──────────────────────────────────────────────────────
const ImageModal = ({ src, alt, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[99999] bg-[#050712]/95 backdrop-blur-md flex items-center justify-center p-4 pro-msg-in"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-zinc-300 hover:text-white bg-[#101738] border border-[#223068] rounded-full transition cursor-pointer"
        >
          <X size={20} />
        </button>
        <img
          src={src}
          alt={alt || "Full preview"}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-[#223068] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
        >
          <ExternalLink size={14} /> Open original image
        </a>
      </div>
    </div>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────────
const Bubble = ({
  msg,
  isMe,
  groupStart,
  groupEnd,
  onDelete,
  onPreviewImage,
}) => {
  const [hover, setHover] = useState(false);

  const copyText = () => {
    if (msg.text) {
      navigator.clipboard.writeText(msg.text);
      toast.success("Text copied to clipboard", { duration: 1500 });
    }
  };

  if (msg.deleted) {
    return (
      <div
        className={`flex ${isMe ? "justify-end" : "justify-start"} ${groupStart ? "mt-3" : "mt-1"} px-2`}
      >
        <span className="text-[11px] text-zinc-400 italic px-3.5 py-1.5 rounded-2xl border border-[#223068] bg-[#101738]/60 flex items-center gap-1.5">
          <Trash2 size={11} className="opacity-60" /> Message deleted
        </span>
      </div>
    );
  }

  return (
    <div
      className={`pro-msg-in flex ${isMe ? "justify-end" : "justify-start"} ${groupStart ? "mt-3.5" : "mt-1"} px-1 group relative`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex items-end gap-2.5 ${
          isMe ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Message Actions Menu on Hover */}
        {hover && (
          <div
            className={`absolute top-0 -translate-y-1/2 z-20 flex items-center gap-1 bg-[#101738] border border-[#2e418b] rounded-xl p-1 shadow-xl backdrop-blur-md transition-all ${
              isMe ? "right-0 translate-x-2" : "left-0 -translate-x-2"
            }`}
          >
            {msg.text && (
              <button
                onClick={copyText}
                className="p-1.5 rounded-lg hover:bg-[#182352] text-zinc-300 hover:text-emerald-400 transition cursor-pointer"
                title="Copy text"
              >
                <Copy size={12} />
              </button>
            )}
            {isMe && onDelete && (
              <button
                onClick={() => onDelete(msg._id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 transition cursor-pointer"
                title="Delete message"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col">
          {/* Main Text Content */}
          {msg.text && (
            <div
              className={`px-4 py-3 text-[13.5px] leading-relaxed break-words shadow-md transition-all ${
                isMe
                  ? `bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white rounded-[22px] ${
                      groupEnd ? "rounded-br-xs" : ""
                    }`
                  : `bg-[#101738] border border-[#223068] text-zinc-100 rounded-[22px] ${
                      groupEnd ? "rounded-bl-xs" : ""
                    }`
              }`}
            >
              {msg.text}
            </div>
          )}

          {/* Media Attachments */}
          {(msg.media ?? []).map((m, i) => (
            <div key={i} className={msg.text || i > 0 ? "mt-2" : ""}>
              {m.mimeType?.startsWith("image/") ? (
                <div className="relative group/img overflow-hidden rounded-2xl border border-[#223068] shadow-md bg-[#090e24]">
                  <img
                    src={m.url}
                    alt={m.filename || "image"}
                    className="max-w-[280px] sm:max-w-[340px] max-h-[320px] object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => onPreviewImage(m.url)}
                    loading="lazy"
                  />
                  <button
                    onClick={() => onPreviewImage(m.url)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
                  >
                    <Maximize2 size={22} className="drop-shadow" />
                  </button>
                </div>
              ) : (
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-[#101738] hover:bg-[#182352] border border-[#223068] text-zinc-200 text-xs px-4 py-3 rounded-2xl transition-all shadow-md group/file"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover/file:scale-110 transition-transform">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate max-w-[200px] font-semibold text-zinc-100">
                      {m.filename || "Attachment"}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Click to open document
                    </p>
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-zinc-400 group-hover/file:text-emerald-400"
                  />
                </a>
              )}
            </div>
          ))}

          {/* Footer Metadata */}
          {groupEnd && (
            <div
              className={`text-[10.5px] font-medium mt-1 flex items-center gap-1.5 ${
                isMe
                  ? "justify-end text-zinc-400"
                  : "justify-start text-zinc-400"
              }`}
            >
              <span>{fmtTime(msg.createdAt)}</span>
              {isMe && (
                <CheckCheck
                  size={14}
                  className="text-emerald-400 inline shrink-0 stroke-[2.5]"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Thread item in left list ──────────────────────────────────────────────────
const ThreadItem = ({ conv, isActive, onClick }) => {
  const instructor = conv.instructor;
  const unread = conv.studentUnread ?? 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3.5 p-3.5 rounded-2xl text-left transition-all duration-200 relative overflow-hidden group cursor-pointer ${
        isActive
          ? "bg-[#0e1736] border-2 border-emerald-500 shadow-xl shadow-emerald-500/15 ring-1 ring-emerald-500/40"
          : "bg-[#131b3e] border border-[#223062] hover:bg-[#182352] hover:border-[#2f438a]"
      }`}
    >
      {/* Active Left Indicator Bar */}
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 via-teal-400 to-emerald-500 rounded-r" />
      )}

      {/* Instructor Avatar with Online Indicator */}
      <div className="relative shrink-0 mt-0.5">
        {instructor?.avatarUrl ? (
          <img
            src={instructor.avatarUrl}
            alt={instructor.name}
            className="w-11 h-11 rounded-2xl object-cover ring-1 ring-[#223062]"
          />
        ) : (
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {initialOf(instructor?.name)}
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#131b3e] rounded-full shadow-xs" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-[13px] text-white truncate transition-colors">
              {instructor?.name || "Instructor"}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-md shrink-0">
              FACULTY
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-medium shrink-0">
            {fmtTime(getLastMessageTime(conv))}
          </span>
        </div>

        {/* Course / Subject badge */}
        <p className="text-[11px] font-medium text-emerald-400 truncate mb-1 flex items-center gap-1">
          <BookOpen size={11} className="shrink-0 text-emerald-400" />
          <span>{conv.course?.title || "Class Query"}</span>
          {conv.subject ? (
            <span className="text-zinc-400">· {conv.subject}</span>
          ) : null}
        </p>

        {/* Last Message Snippet */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-400 truncate group-hover:text-zinc-300 transition-colors">
            {getLastMessageText(conv.lastMessage) ||
              "Click to open conversation"}
          </p>
          {unread > 0 && (
            <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shadow-md shadow-emerald-500/30 animate-pulse">
              {unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const QUICK_PROMPTS = [
  "Can you explain the formula derivation from today's lesson?",
  "I have a doubt regarding question #4 on the practice sheet.",
  "Could we schedule a Google Meet video session to review this?",
  "Can you recommend the best revision strategy for this chapter?",
];

// ── MAIN STUDENT COMPONENT ────────────────────────────────────────────────────
const AskInstructor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const {
    availableInstructors,
    availableLoading,
    conversations,
    conversationsLoading,
    activeConversation,
    messages,
    messagesLoading,
    typing,
  } = useSelector((s) => s.instructorChat);

  const { t } = useTranslation();

  // Local state
  const [view, setView] = useState("threads"); // 'threads' | 'chat' | 'selector'
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'unread'
  const [threadSearch, setThreadSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");

  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [activeCallRequest, setActiveCallRequest] = useState(null);
  const [approvedMeeting, setApprovedMeeting] = useState(null);
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // 1. Initialize Socket Connection
  useEffect(() => {
    if (!user?._id) return;
    const token = localStorage.getItem("authToken");
    const socket = io(`${SOCKET_URL}/ichat`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Student AskInstructor socket connected:", socket.id);
    });

    socket.on(
      "ic:history",
      ({ messages: historyMessages = [], conversation }) => {
        if (conversation) {
          dispatch(setActiveConversation(conversation));
        }
        dispatch(setMessages(historyMessages));
      },
    );

    socket.on("ic:message", (msg) => {
      dispatch(socketMessageReceived(msg));
      if (activeConversation?._id === msg.conversationId) {
        socket.emit("ic:read", { conversationId: msg.conversationId });
      }
    });

    socket.on("ic:typing", (data) => {
      dispatch(socketTypingReceived(data));
    });

    socket.on("ic:read", (data) => {
      dispatch(socketReadReceived(data));
    });

    socket.on("ic:error", (error) => {
      if (error?.message) {
        toast.error(error.message);
      }
    });

    socket.on("webrtc:call-request", (data) => {
      if (data.status === "approved" && data.meetingLink) {
        setApprovedMeeting(data);
        setActiveCallRequest(null);
        toast.success("Instructor approved your Google Meet request!", {
          duration: 5000,
        });
      } else if (data.status === "rejected") {
        setActiveCallRequest(null);
        toast.error("Instructor declined the video call request.");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, dispatch]);

  // 2. Fetch initial data
  useEffect(() => {
    dispatch(fetchAvailableInstructors());
    dispatch(fetchConversations());
  }, [dispatch]);

  // 3. Auto-scroll on new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // 4. Handle Conversation Selection
  const openThread = (conv) => {
    dispatch(setActiveConversation(conv));
    setView("chat");
    if (socketRef.current) {
      socketRef.current.emit("ic:join", {
        conversationId: conv._id,
      });
      socketRef.current.emit("ic:read", {
        conversationId: conv._id,
      });
    }
  };

  // 5. Create / Start New Chat
  const handleStartChat = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course first");
      return;
    }
    try {
      const res = await dispatch(
        getOrCreateConversation({
          courseId: selectedCourse.courseId,
          subject: selectedSubject || selectedCourse.subjects?.[0] || "General",
        }),
      ).unwrap();

      setView("chat");
      if (socketRef.current) {
        socketRef.current.emit("ic:join", {
          conversationId: res._id,
        });
      }
    } catch (err) {
      toast.error(err?.message || "Failed to start conversation");
    }
  };

  // 6. Typing events
  const handleTyping = (val) => {
    setText(val);
    if (!socketRef.current || !activeConversation?._id) return;

    socketRef.current.emit("ic:typing", {
      conversationId: activeConversation._id,
      isTyping: true,
      userId: user?._id,
      name: user?.name,
    });

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (socketRef.current && activeConversation?._id) {
        socketRef.current.emit("ic:typing", {
          conversationId: activeConversation._id,
          isTyping: false,
          userId: user?._id,
        });
      }
    }, TYPING_DEBOUNCE);
  };

  // 7. Send Message
  const sendMessage = async (overrideText = null) => {
    const textToSend = overrideText !== null ? overrideText : text;
    if (!textToSend.trim() && pendingMedia.length === 0) return;
    if (!activeConversation?._id) return;

    setSending(true);
    let uploadedMedia = [];

    if (pendingMedia.length > 0) {
      setUploading(true);
      try {
        const uploadPromises = pendingMedia.map(async (pm) => {
          const res = await uploadFile(pm.file, "chat_attachments");
          return {
            url: res.url,
            filename: pm.file.name,
            mimeType: pm.file.type,
            size: pm.file.size,
          };
        });
        uploadedMedia = await Promise.all(uploadPromises);
      } catch (err) {
        toast.error("Failed to upload attachment");
        setUploading(false);
        setSending(false);
        return;
      }
      setUploading(false);
    }

    try {
      if (!socketRef.current) {
        throw new Error("Chat socket is not connected");
      }

      socketRef.current.emit("ic:message", {
        conversationId: activeConversation._id,
        text: textToSend.trim(),
        media: uploadedMedia,
      });

      setText("");
      setPendingMedia([]);
      socketRef.current.emit("ic:typing", {
        conversationId: activeConversation._id,
        isTyping: false,
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // 8. Delete Message
  const handleDeleteMsg = async (messageId) => {
    try {
      await dispatch(deleteMessage(messageId)).unwrap();
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  // 9. File Attachments
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newPending = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));
    setPendingMedia((prev) => [...prev, ...newPending]);
    e.target.value = "";
  };

  const removePreview = (id) => {
    setPendingMedia((prev) => prev.filter((p) => p.id !== id));
  };

  // 10. Request Video Call
  const requestVideoCall = async () => {
    if (!activeConversation?._id) return;
    setIsSubmittingCall(true);
    try {
      const res = await api.post(
        API_ENDPOINTS.INSTRUCTOR_CHAT.REQUEST_CALL(activeConversation._id),
        {
          topic: `Doubt resolution for ${activeConversation.course?.title || "class lesson"}`,
        },
      );
      setActiveCallRequest(res.data.data);
      toast.success(
        "Google Meet video session requested! Awaiting instructor approval.",
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to request call");
    } finally {
      setIsSubmittingCall(false);
    }
  };

  const cancelCallRequest = () => {
    setActiveCallRequest(null);
    toast("Call request cancelled", { icon: "ℹ️" });
  };

  // Filtered threads
  const visibleThreads = useMemo(() => {
    return conversations.filter((c) => {
      const instructorName = c.instructor?.name?.toLowerCase() || "";
      const courseTitle = c.course?.title?.toLowerCase() || "";
      const subject = c.subject?.toLowerCase() || "";
      const query = threadSearch.toLowerCase();

      const matchesSearch =
        instructorName.includes(query) ||
        courseTitle.includes(query) ||
        subject.includes(query);

      if (filterTab === "unread") {
        return matchesSearch && (c.studentUnread ?? 0) > 0;
      }
      return matchesSearch;
    });
  }, [conversations, threadSearch, filterTab]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.studentUnread ?? 0), 0);
  }, [conversations]);

  const instructor = activeConversation?.instructor;

  // Grouped messages rendering
  const renderItems = useMemo(() => {
    const items = [];
    let lastDateStr = null;

    messages.forEach((msg, idx) => {
      const dateStr = fmtDate(msg.createdAt);
      if (dateStr && dateStr !== lastDateStr) {
        items.push({
          type: "divider",
          label: dateStr,
          key: `date-${msg._id || idx}`,
        });
        lastDateStr = dateStr;
      }

      const isMe =
        (msg.sender?._id?.toString?.() ?? msg.sender?.toString?.()) ===
        user?._id?.toString();

      const prev = messages[idx - 1];
      const next = messages[idx + 1];

      const sameDayAsPrev = prev && fmtDate(prev.createdAt) === dateStr;
      const closeToPrev =
        sameDayAsPrev &&
        isSameSender(prev, msg) &&
        Math.abs(new Date(msg.createdAt) - new Date(prev.createdAt)) <
          GROUP_WINDOW_MS &&
        !prev.deleted &&
        !msg.deleted;
      const closeToNext =
        next &&
        fmtDate(next.createdAt) === fmtDate(msg.createdAt) &&
        isSameSender(next, msg) &&
        Math.abs(new Date(next.createdAt) - new Date(msg.createdAt)) <
          GROUP_WINDOW_MS &&
        !next.deleted &&
        !msg.deleted;

      items.push({
        type: "message",
        key: msg._id,
        msg,
        isMe,
        groupStart: !closeToPrev,
        groupEnd: !closeToNext,
      });
    });
    return items;
  }, [messages, user]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5.5rem)] w-full bg-[#0d0e12] rounded-2xl md:rounded-3xl overflow-hidden border border-zinc-800/80 shadow-2xl relative text-zinc-100 font-sans">
      <CustomStyles />

      {/* Lightbox Modal */}
      <ImageModal
        src={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* Approved Meet link Modal */}
      {approvedMeeting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050712]/85 backdrop-blur-md p-4 pro-msg-in">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/50 bg-[#0e1432] p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center gap-3.5 text-emerald-400 font-bold">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                <Video size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Google Meet Link Ready
                </h3>
                <span className="text-xs text-zinc-400 font-normal">
                  Approved by instructor
                </span>
              </div>
            </div>
            {approvedMeeting.response && (
              <p className="mt-4 text-xs text-zinc-300 bg-[#101738] p-3.5 rounded-xl border border-[#223068] leading-relaxed">
                "{approvedMeeting.response}"
              </p>
            )}
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-[#080b18] p-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Meeting URL
              </span>
              <p className="text-xs font-mono text-emerald-300 break-all select-all font-semibold">
                {approvedMeeting.meetingLink}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <a
                href={approvedMeeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-3 text-center text-xs font-bold text-white transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Video size={16} /> Join Google Meet Now
              </a>
              <button
                onClick={() => setApprovedMeeting(null)}
                className="rounded-xl border border-[#223068] px-4 py-3 text-xs font-bold text-zinc-300 transition hover:border-zinc-500 hover:text-white cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Left Sidebar Pane ── */}
      <div
        className={`flex flex-col w-full md:w-[360px] lg:w-[400px] border-r border-[#1a244d] bg-[#080b18] shrink-0 ${
          view === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#1a244d] shrink-0 space-y-3.5 bg-[#0b1028]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight leading-tight">
                  {t("chat.askInstructor", "Ask Instructor")}
                </h2>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  {t("chat.directWorkspace", "Direct Q&A Workspace")}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setView("selector");
                setSelectedCourse(null);
                setSelectedSubject("");
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus size={15} /> {t("chat.newChat", "New Chat")}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder={t("chat.searchPlaceholder", "Search conversations or subjects…")}
              className="w-full bg-[#101738] border border-[#223068] text-zinc-100 text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-emerald-500/80 transition-all placeholder:text-zinc-500 font-medium"
            />
            {threadSearch && (
              <button
                onClick={() => setThreadSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-[#0e1432] border border-[#1a244d] rounded-xl">
            <button
              onClick={() => {
                setView("threads");
                setFilterTab("all");
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                view === "threads" && filterTab === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t("chat.allChats", "All Chats")}
            </button>
            <button
              onClick={() => {
                setView("threads");
                setFilterTab("unread");
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                view === "threads" && filterTab === "unread"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t("chat.unread", "Unread")} {totalUnreadCount > 0 && `(${totalUnreadCount})`}
            </button>
          </div>
        </div>

        {/* ── View 1: New Chat Selector Drawer ── */}
        {view === "selector" && (
          <div className="flex-1 overflow-y-auto pro-chat-scroll p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                {t("chat.selectCourse", "Select Enrolled Course")}
              </span>
              {conversations.length > 0 && (
                <button
                  onClick={() => setView("threads")}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer"
                >
                  {t("chat.activeChats", "Active Chats")} ({conversations.length})
                </button>
              )}
            </div>

            {availableLoading && (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#101738]/60 animate-pulse border border-[#223068]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#182352] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 bg-[#182352] rounded" />
                      <div className="h-2.5 w-1/2 bg-[#182352]/60 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!availableLoading && availableInstructors.length === 0 && (
              <div className="text-center py-12 px-4 bg-[#101738]/50 rounded-3xl border border-[#223068] my-4 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-1">
                  <Sparkles size={26} />
                </div>
                <h4 className="text-zinc-100 text-sm font-black">
                  Instructor Assistance Not Unlocked
                </h4>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-xs mx-auto">
                  Ask Instructor chat is available for courses purchased with
                  the{" "}
                  <span className="text-emerald-300 font-bold">
                    ✨ Buy with Instructor Assistance
                  </span>{" "}
                  option (₹500).
                </p>
                <button
                  onClick={() => navigate("/courses")}
                  className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Browse Courses (₹500)
                </button>
              </div>
            )}

            {!availableLoading &&
              availableInstructors.map((item) => {
                const isSelected = selectedCourse?.courseId === item.courseId;
                return (
                  <div
                    key={item.courseId}
                    onClick={() => setSelectedCourse(item)}
                    className={`w-full flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-[#141e48] shadow-md shadow-emerald-950/40"
                        : "border-[#223068] hover:border-[#2e418b] bg-[#101738] hover:bg-[#151f48]"
                    }`}
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.courseTitle}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#223068] mt-0.5"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0 mt-0.5">
                        <BookOpen size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                        {item.courseTitle}
                      </h4>
                      <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5">
                        <span>By {item.instructorName || "Faculty"}</span>
                      </p>
                    </div>
                  </div>
                );
              })}

            {selectedCourse && (
              <div className="mt-4 pt-4 border-t border-[#1a244d] space-y-3">
                <span className="text-xs font-bold text-zinc-300 block">
                  Select Topic / Subject
                </span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-[#101738] border border-[#223068] text-zinc-100 text-xs rounded-xl p-3 outline-none focus:border-emerald-500"
                >
                  <option value="">General Doubts & Strategy</option>
                  {(selectedCourse.subjects || []).map((s, idx) => (
                    <option key={idx} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleStartChat}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold py-3 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle size={16} /> Open Chat Window
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── View 2: Threads List ── */}
        {(view === "threads" || view === "chat") && (
          <div
            className={`flex-1 overflow-y-auto pro-chat-scroll p-3.5 space-y-2.5 ${
              view === "chat" ? "hidden md:block" : ""
            }`}
          >
            {conversationsLoading && (
              <div className="space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#101738]/60 animate-pulse border border-[#223068]"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-[#182352] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-2/3 bg-[#182352] rounded" />
                      <div className="h-2.5 w-1/2 bg-[#182352]/60 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!conversationsLoading && visibleThreads.length === 0 && (
              <div className="text-center py-14 px-4">
                <p className="text-xs text-zinc-400 font-medium">
                  {threadSearch
                    ? "No matching conversations found."
                    : filterTab === "unread"
                      ? "No unread messages."
                      : "No conversations started yet."}
                </p>
                {!threadSearch && (
                  <button
                    onClick={() => setView("selector")}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                  >
                    <Plus size={14} /> Start your first chat
                  </button>
                )}
              </div>
            )}

            {visibleThreads.map((c) => (
              <ThreadItem
                key={c._id}
                conv={c}
                isActive={activeConversation?._id === c._id}
                onClick={() => openThread(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right Panel: Main Chat Canvas ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-[#080b18] relative ${
          view !== "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {!activeConversation ? (
          /* Empty Chat Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-5 bg-gradient-to-b from-[#0e1432] via-[#0b1028] to-[#080b18]">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xl pro-glow-active">
              <MessageSquare size={38} />
            </div>
            <div className="max-w-md">
              <h3 className="text-xl font-black text-white tracking-tight">
                Direct Faculty Doubt Clearing
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                Select an ongoing chat from the list or click{" "}
                <span className="text-emerald-400 font-bold">+ New Chat</span>{" "}
                to connect 1-on-1 with your course instructors.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3.5 max-w-md mt-2">
              <div className="p-3.5 bg-[#101738] border border-[#223068] rounded-2xl text-left shadow-sm">
                <span className="text-xs font-bold text-emerald-400 block mb-1">
                  ⚡ Fast Clarifications
                </span>
                <span className="text-[11px] text-zinc-400 leading-snug block">
                  Direct step-by-step guidance on homework & formulas.
                </span>
              </div>
              <div className="p-3.5 bg-[#101738] border border-[#223068] rounded-2xl text-left shadow-sm">
                <span className="text-xs font-bold text-teal-400 block mb-1">
                  📹 1-on-1 Video Meets
                </span>
                <span className="text-[11px] text-zinc-400 leading-snug block">
                  Request Google Meet link for face-to-face problem solving.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Main Chat Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a244d] bg-[#0b1028] shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={() => setView("threads")}
                  className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#101738] transition cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="relative shrink-0">
                  {instructor?.avatarUrl ? (
                    <img
                      src={instructor.avatarUrl}
                      alt={instructor.name}
                      className="w-10 h-10 rounded-2xl object-cover ring-2 ring-emerald-500/60"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white font-bold text-sm ring-2 ring-emerald-500/60 shadow-sm">
                      {initialOf(instructor?.name)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#101738] rounded-full shadow-xs" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
                    {instructor?.name}
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 rounded-md uppercase tracking-wider">
                      FACULTY
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                    <span className="text-emerald-400 font-medium">
                      {activeConversation.course?.title || "General Query"}
                    </span>
                    {activeConversation.subject && (
                      <span className="text-zinc-400">
                        · {activeConversation.subject}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={requestVideoCall}
                  disabled={
                    Boolean(activeCallRequest) ||
                    isSubmittingCall ||
                    activeConversation?.assistanceDisabled
                  }
                  title="Request a 1-on-1 Google Meet link"
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Video size={15} />
                  <span>
                    {isSubmittingCall
                      ? "Sending Request…"
                      : activeCallRequest
                        ? "Meet Requested"
                        : "Meet Link"}
                  </span>
                </button>

                {activeCallRequest && (
                  <button
                    onClick={cancelCallRequest}
                    className="text-xs text-zinc-400 hover:text-rose-400 px-3 py-2 rounded-xl border border-[#223068] hover:border-rose-500/40 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Locked Assistance Overlay */}
            {activeConversation?.assistanceDisabled && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#050712]/85 backdrop-blur-md p-4 animate-fadeIn">
                <div className="w-full max-w-md rounded-3xl border border-emerald-500/40 bg-[#0e1432]/95 p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-600/30 mb-4">
                    <Sparkles size={30} />
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider mb-2">
                    ✨ Access Instructor Assistance
                  </span>

                  <h3 className="text-xl font-black text-white leading-tight">
                    Unlock Direct Instructor Support
                  </h3>

                  <p className="text-zinc-300 text-xs mt-2 leading-relaxed">
                    Instructor Assistance is currently turned OFF for{" "}
                    <span className="text-white font-bold">
                      {activeConversation.course?.title || "this course"}
                    </span>
                    .
                  </p>

                  <div className="mt-5 space-y-2.5 text-left bg-[#101738] rounded-2xl border border-[#223068] p-4">
                    <p className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider mb-1">
                      Instructor Assistance Benefits:
                    </p>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-200">
                      <ShieldCheck
                        size={16}
                        className="text-emerald-400 shrink-0"
                      />
                      <span>1-on-1 Direct Q&A with course instructors</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-200">
                      <Video size={16} className="text-teal-400 shrink-0" />
                      <span>Priority 1-on-1 Google Meet video sessions</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-200">
                      <BookOpen size={16} className="text-sky-400 shrink-0" />
                      <span>Detailed doubt explanations & study support</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/courses")}
                    className="w-full mt-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 text-xs transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={16} /> Unlock Instructor Assistance
                  </button>
                </div>
              </div>
            )}

            {/* Messages Body Canvas */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto pro-chat-scroll px-4 sm:px-6 py-5 bg-[#080b18]"
            >
              {messagesLoading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!messagesLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4 gap-3.5">
                  <div className="w-16 h-16 rounded-3xl bg-[#101738] border border-[#223068] flex items-center justify-center text-3xl mb-1 shadow-inner">
                    👋
                  </div>
                  <h4 className="text-zinc-100 text-base font-bold">
                    Start conversation with {instructor?.name}
                  </h4>
                  <p className="text-zinc-400 text-xs max-w-xs leading-relaxed">
                    Ask any question regarding lessons, study materials,
                    formulas, or homework doubts.
                  </p>

                  {/* Quick Suggestions */}
                  {!activeConversation?.assistanceDisabled && (
                    <div className="flex flex-wrap justify-center gap-2 max-w-md mt-3">
                      {QUICK_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(prompt)}
                          className="text-[11.5px] text-zinc-300 hover:text-white bg-[#101738] hover:bg-[#182352] border border-[#223068] hover:border-emerald-500/40 px-3.5 py-2 rounded-full transition-all cursor-pointer shadow-sm"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {renderItems.map((item) =>
                item.type === "divider" ? (
                  <DateDivider key={item.key} label={item.label} />
                ) : (
                  <Bubble
                    key={item.key}
                    msg={item.msg}
                    isMe={item.isMe}
                    groupStart={item.groupStart}
                    groupEnd={item.groupEnd}
                    onDelete={handleDeleteMsg}
                    onPreviewImage={(url) => setPreviewImageUrl(url)}
                  />
                ),
              )}

              {/* Typing indicator */}
              {typing?.isTyping && typing.userId !== user?._id?.toString() && (
                <div className="flex justify-start mt-3 px-2 pro-msg-in">
                  <div className="bg-[#101738] rounded-2xl rounded-bl-xs px-4 py-2.5 flex gap-2 items-center border border-[#223068] shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-400 font-medium">
                      {typing.name || "Instructor"} is typing…
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Media Attachment Previews */}
            {pendingMedia.length > 0 && (
              <div className="flex gap-3 px-4 py-3 border-t border-[#1a244d] bg-[#0b1028] overflow-x-auto shrink-0 pro-chat-scroll">
                {pendingMedia.map((pm) => (
                  <div key={pm.id} className="relative shrink-0 group">
                    {pm.preview ? (
                      <img
                        src={pm.preview}
                        alt="preview"
                        className="w-16 h-16 rounded-xl object-cover border border-[#223068] shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#101738] border border-[#223068] flex flex-col items-center justify-center p-1 text-center">
                        <FileText size={18} className="text-emerald-400 mb-1" />
                        <span className="text-[9px] text-zinc-300 truncate w-full px-1">
                          {pm.file.name}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removePreview(pm.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center text-white shadow-md transition cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Modern Input Dock */}
            <div className="p-3.5 sm:p-4 border-t border-[#1a244d] bg-[#0b1028] shrink-0">
              <div className="flex items-end gap-2 bg-[#101738] border border-[#223068] focus-within:border-emerald-500/80 rounded-2xl px-3 py-2 transition-all shadow-inner">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  disabled={
                    activeConversation?.assistanceDisabled ||
                    activeConversation?.isBlocked
                  }
                  accept="image/*,application/pdf,video/mp4"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    activeConversation?.assistanceDisabled ||
                    activeConversation?.isBlocked
                  }
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-[#182352] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0 cursor-pointer"
                  title="Attach media or document"
                >
                  <Paperclip size={18} />
                </button>
                <textarea
                  value={text}
                  onChange={(e) => handleTyping(e.target.value)}
                  disabled={
                    activeConversation?.assistanceDisabled ||
                    activeConversation?.isBlocked
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    activeConversation?.assistanceDisabled
                      ? "Instructor assistance is turned OFF for this course."
                      : "Type your question… (Press Enter to send, Shift+Enter for new line)"
                  }
                  rows={1}
                  className="flex-1 bg-transparent text-zinc-100 text-sm py-2 outline-none resize-none max-h-32 overflow-y-auto pro-chat-scroll placeholder:text-zinc-500 leading-relaxed disabled:opacity-50"
                  style={{ minHeight: 40 }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={
                    (!text.trim() && pendingMedia.length === 0) ||
                    sending ||
                    uploading ||
                    activeConversation?.assistanceDisabled ||
                    activeConversation?.isBlocked
                  }
                  className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shrink-0 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                  {uploading || sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AskInstructor;
