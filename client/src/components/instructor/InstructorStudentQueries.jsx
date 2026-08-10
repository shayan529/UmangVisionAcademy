import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { SOCKET_URL } from "../../config/api.js";
import api, { API_ENDPOINTS } from "../../config/api.js";
import { uploadFile } from "../../utils/uploadFile.js";
import {
  fetchConversations,
  archiveConversation,
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
  BookOpen,
  User,
  Archive,
  Search,
  Video,
  MessageSquare,
  CheckCheck,
  Sparkles,
  Copy,
  ExternalLink,
  Maximize2,
  FileText,
  Clock,
  ShieldCheck,
  Check,
  AlertCircle,
  Flag,
  Ban,
  ShieldAlert,
  MoreVertical,
  CheckCircle2,
  ChevronRight,
  Smile,
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

const initialOf = (name) => name?.trim()?.charAt(0)?.toUpperCase() || "S";

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

// Modern Glass & Pulse Styles
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
const Bubble = ({ msg, isMe, groupStart, groupEnd, onDelete, onPreviewImage }) => {
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
        className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"
          }`}
      >
        {/* Message Actions Menu on Hover */}
        {hover && (
          <div
            className={`absolute top-0 -translate-y-1/2 z-20 flex items-center gap-1 bg-[#101738] border border-[#2e418b] rounded-xl p-1 shadow-xl backdrop-blur-md transition-all ${isMe ? "right-0 translate-x-2" : "left-0 -translate-x-2"
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
              className={`px-4 py-3 text-[13.5px] leading-relaxed break-words shadow-md transition-all ${isMe
                  ? `bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white rounded-[22px] ${groupEnd ? "rounded-br-xs" : ""
                  }`
                  : `bg-[#101738] border border-[#223068] text-zinc-100 rounded-[22px] ${groupEnd ? "rounded-bl-xs" : ""
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
                    <p className="text-[10px] text-zinc-400">Click to open document</p>
                  </div>
                  <ExternalLink size={14} className="text-zinc-400 group-hover/file:text-emerald-400" />
                </a>
              )}
            </div>
          ))}

          {/* Footer Metadata */}
          {groupEnd && (
            <div
              className={`text-[10.5px] font-medium mt-1 flex items-center gap-1.5 ${isMe ? "justify-end text-zinc-400" : "justify-start text-zinc-400"
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
  const student = conv.student;
  const unread = conv.instructorUnread ?? 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3.5 p-3.5 rounded-2xl text-left transition-all duration-200 relative overflow-hidden group cursor-pointer ${isActive
          ? "bg-[#0e1736] border-2 border-emerald-500 shadow-xl shadow-emerald-500/15 ring-1 ring-emerald-500/40"
          : "bg-[#131b3e] border border-[#223062] hover:bg-[#182352] hover:border-[#2f438a]"
        }`}
    >
      {/* Active Left Indicator Bar */}
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 via-teal-400 to-emerald-500 rounded-r" />
      )}

      {/* Student Avatar */}
      <div className="relative shrink-0 mt-0.5">
        {student?.avatarUrl ? (
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="w-11 h-11 rounded-2xl object-cover ring-1 ring-[#223062]"
          />
        ) : (
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 border border-emerald-500/40 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {initialOf(student?.name)}
          </div>
        )}
        {conv.assistanceActive && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#131b3e] rounded-full" title="Assistance Active" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-[13px] text-white truncate transition-colors">
              {student?.name || "Student"}
            </span>
            {conv.isBlocked && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded-md shrink-0">
                Blocked
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 font-medium shrink-0">
            {fmtTime(getLastMessageTime(conv))}
          </span>
        </div>

        {/* Course / Subject badge */}
        <p className="text-[11px] font-medium text-emerald-400 truncate mb-1 flex items-center gap-1">
          <BookOpen size={11} className="shrink-0 text-emerald-400" />
          <span>{conv.course?.title || "Class Query"}</span>
          {conv.subject ? <span className="text-zinc-400">· {conv.subject}</span> : null}
        </p>

        {/* Last Message Preview */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-400 truncate group-hover:text-zinc-300 transition-colors">
            {getLastMessageText(conv.lastMessage) || "No messages yet"}
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

const REPORT_REASONS = [
  "Inappropriate Language or Harassment",
  "Academic Dishonesty / Spam",
  "Off-topic or Commercial Solicitation",
  "Violation of UVA Community Guidelines",
];

// ── MAIN INSTRUCTOR COMPONENT ─────────────────────────────────────────────────
export default function InstructorStudentQueries({ showToast }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const {
    conversations = [],
    conversationsLoading,
    activeConversation,
    messages = [],
    messagesLoading,
    typing,
  } = useSelector((s) => s.instructorChat ?? {});

  // Local UI State
  const [mobileView, setMobileView] = useState("list"); // 'list' | 'chat'
  const [filter, setFilter] = useState("all"); // 'all' | 'unread' | 'archived'
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Modals
  const [meetModalOpen, setMeetModalOpen] = useState(false);
  const [meetingLinkInput, setMeetingLinkInput] = useState("");
  const [submittingMeetLink, setSubmittingMeetLink] = useState(false);
  const [activeMeetRequest, setActiveMeetRequest] = useState(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // 1. Socket Setup
  useEffect(() => {
    if (!user?._id) return;
    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Instructor Queries socket connected:", socket.id);
    });

    socket.on("message:received", (msg) => {
      dispatch(socketMessageReceived(msg));
      if (activeConversation?._id === msg.conversationId) {
        socket.emit("message:read", { conversationId: msg.conversationId });
      }
    });

    socket.on("typing:update", (data) => {
      dispatch(socketTypingReceived(data));
    });

    socket.on("message:readReceipt", (data) => {
      dispatch(socketReadReceived(data));
    });

    socket.on("callRequest:new", (data) => {
      setActiveMeetRequest(data);
      setMeetModalOpen(true);
      toast((t) => (
        <div className="flex items-center gap-3">
          <Video size={18} className="text-emerald-500" />
          <span>Student requested a Google Meet video session!</span>
        </div>
      ), { duration: 6000 });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, activeConversation?._id, dispatch]);

  // 2. Fetch Conversations on Mount
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // 3. Auto Scroll on Message updates
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // 4. Select / Open Conversation
  const openConversation = (conv) => {
    dispatch(setActiveConversation(conv));
    setMobileView("chat");
    setActionMenuOpen(false);

    if (socketRef.current) {
      socketRef.current.emit("conversation:join", {
        conversationId: conv._id,
      });
      socketRef.current.emit("message:read", {
        conversationId: conv._id,
      });
    }
  };

  // 5. Send Message / Reply
  const handleSendMessage = async (overrideText = null) => {
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
      const res = await api.post(
        API_ENDPOINTS.INSTRUCTOR_CHAT.SEND_MESSAGE(activeConversation._id),
        {
          text: textToSend.trim(),
          media: uploadedMedia,
        }
      );

      dispatch(socketMessageReceived(res.data.data));
      setText("");
      setPendingMedia([]);

      if (socketRef.current) {
        socketRef.current.emit("message:send", {
          conversationId: activeConversation._id,
          message: res.data.data,
        });
        socketRef.current.emit("typing:stop", {
          conversationId: activeConversation._id,
          userId: user?._id,
        });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  // 6. Handle Typing
  const handleTyping = (val) => {
    setText(val);
    if (!socketRef.current || !activeConversation?._id) return;

    socketRef.current.emit("typing:start", {
      conversationId: activeConversation._id,
      userId: user?._id,
      name: user?.name,
    });

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (socketRef.current && activeConversation?._id) {
        socketRef.current.emit("typing:stop", {
          conversationId: activeConversation._id,
          userId: user?._id,
        });
      }
    }, TYPING_DEBOUNCE);
  };

  // 7. File Handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    const newPending = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));
    setPendingMedia((prev) => [...prev, ...newPending].slice(0, 5));
    e.target.value = "";
  };

  const removePreview = (id) => {
    setPendingMedia((prev) => prev.filter((p) => p.id !== id));
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

  // 9. Approve Video Call & Share Google Meet link
  const submitMeetApproval = async () => {
    if (!meetingLinkInput.trim() || !meetingLinkInput.startsWith("http")) {
      toast.error("Please enter a valid Google Meet or Zoom URL (https://...)");
      return;
    }
    setSubmittingMeetLink(true);
    try {
      await api.post(
        API_ENDPOINTS.INSTRUCTOR_CHAT.APPROVE_CALL(activeConversation._id),
        {
          meetingLink: meetingLinkInput.trim(),
          response: "Here is the Google Meet link for our interactive doubt resolution session.",
        }
      );
      toast.success("Meeting link sent to student!");
      setMeetModalOpen(false);
      setMeetingLinkInput("");
      setActiveMeetRequest(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to share meeting link");
    } finally {
      setSubmittingMeetLink(false);
    }
  };

  // 10. Report & Block student
  const submitReport = async () => {
    setSubmittingReport(true);
    try {
      await api.post(
        API_ENDPOINTS.INSTRUCTOR_CHAT.REPORT_STUDENT(activeConversation._id),
        { reason: selectedReportReason, details: reportDetails }
      );
      toast.success("Student query reported to academy moderators");
      setReportModalOpen(false);
      setReportDetails("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmittingReport(false);
    }
  };

  const toggleBlockStudent = async () => {
    try {
      const res = await api.post(
        API_ENDPOINTS.INSTRUCTOR_CHAT.TOGGLE_BLOCK(activeConversation._id)
      );
      toast.success(res.data.message || "Student status updated");
      dispatch(fetchConversations());
      setActionMenuOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  // Filtered List
  const visibleConvs = useMemo(() => {
    return conversations.filter((c) => {
      const studentName = c.student?.name?.toLowerCase() || "";
      const courseTitle = c.course?.title?.toLowerCase() || "";
      const subject = c.subject?.toLowerCase() || "";
      const query = search.toLowerCase();

      const matchesSearch =
        studentName.includes(query) ||
        courseTitle.includes(query) ||
        subject.includes(query);

      if (filter === "unread") {
        return matchesSearch && (c.instructorUnread ?? 0) > 0;
      }
      return matchesSearch;
    });
  }, [conversations, filter, search]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((n, c) => n + (c.instructorUnread ?? 0), 0);
  }, [conversations]);

  const student = activeConversation?.student;

  // Grouped messages rendering
  const renderItems = useMemo(() => {
    const items = [];
    let lastDateStr = null;

    messages.forEach((msg, idx) => {
      const dateStr = fmtDate(msg.createdAt);
      if (dateStr && dateStr !== lastDateStr) {
        items.push({ type: "divider", label: dateStr, key: `date-${msg._id || idx}` });
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

  return (
    <div className="flex h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5.5rem)] w-full bg-[#080b18] rounded-2xl md:rounded-3xl overflow-hidden border border-[#1a244d] shadow-2xl relative text-zinc-100 font-sans">
      <CustomStyles />

      {/* Lightbox Modal */}
      <ImageModal
        src={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* Share Meet Link Modal */}
      {meetModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050712]/85 backdrop-blur-md p-4 pro-msg-in">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/50 bg-[#0e1432] p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Video size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Share Google Meet Link
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    For {student?.name || "Student"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMeetModalOpen(false);
                  setMeetingLinkInput("");
                }}
                className="rounded-xl p-1.5 text-zinc-400 transition hover:bg-[#101738] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-300 mt-4 leading-relaxed bg-[#101738] p-3.5 rounded-xl border border-[#223068]">
              Paste your Google Meet or Zoom link below. It will be sent directly to the student's active chat.
            </p>

            <input
              value={meetingLinkInput}
              onChange={(e) => setMeetingLinkInput(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="mt-4 w-full rounded-xl border border-[#223068] bg-[#080b18] px-4 py-3 text-xs text-emerald-300 outline-none focus:border-emerald-500 font-mono"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitMeetApproval}
                disabled={submittingMeetLink}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-3 text-xs font-bold text-white transition disabled:opacity-60 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                {submittingMeetLink ? "Sharing Link…" : "Share Meeting Link"}
              </button>
              <button
                onClick={() => {
                  setMeetModalOpen(false);
                  setMeetingLinkInput("");
                }}
                className="rounded-xl border border-[#223068] px-4 py-3 text-xs font-bold text-zinc-300 transition hover:border-zinc-500 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Student Modal */}
      {reportModalOpen && activeConversation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050712]/85 backdrop-blur-md p-4 pro-msg-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/50 bg-[#0e1432] p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <Flag size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Report Student Query
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Flag {student?.name || "Student"} for administrative review
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="rounded-xl p-1.5 text-zinc-400 transition hover:bg-[#101738] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Select Reason
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition text-xs ${selectedReportReason === reason
                        ? "bg-rose-950/40 border-rose-500/60 text-white font-semibold"
                        : "bg-[#101738] border-[#223068] text-zinc-300 hover:border-zinc-700"
                      }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      checked={selectedReportReason === reason}
                      onChange={() => setSelectedReportReason(reason)}
                      className="accent-rose-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-3 mb-1">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context or explanation for admin review…"
                  rows={3}
                  className="w-full rounded-xl border border-[#223068] bg-[#080b18] p-3 text-xs text-zinc-200 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitReport}
                disabled={submittingReport}
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-3 text-xs font-bold text-white transition disabled:opacity-60 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Flag size={15} />
                {submittingReport ? "Submitting Report…" : "Submit Report"}
              </button>
              <button
                onClick={() => setReportModalOpen(false)}
                className="rounded-xl border border-[#223068] px-4 py-3 text-xs font-bold text-zinc-300 transition hover:border-zinc-500 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Left Sidebar Pane ── */}
      <div
        className={`flex flex-col w-full md:w-[360px] lg:w-[400px] border-r border-[#1a244d] bg-[#080b18] shrink-0 ${mobileView === "chat" ? "hidden md:flex" : "flex"
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
                  Student Queries
                </h2>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Faculty Advisory Inbox
                </span>
              </div>
            </div>
            {totalUnread > 0 && (
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black px-2.5 py-1 rounded-full animate-pulse">
                {totalUnread} Pending
              </span>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or course…"
              className="w-full bg-[#101738] border border-[#223068] text-zinc-100 text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-emerald-500/80 transition-all placeholder:text-zinc-500 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-[#0e1432] border border-[#1a244d] rounded-xl">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${filter === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
                }`}
            >
              All Queries
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${filter === "unread"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
                }`}
            >
              Unanswered {totalUnread > 0 && `(${totalUnread})`}
            </button>
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto pro-chat-scroll p-3.5 space-y-2.5">
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

          {!conversationsLoading && visibleConvs.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-2xl bg-[#101738] border border-[#223068] flex items-center justify-center text-zinc-500 mx-auto mb-2">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-xs text-zinc-300 font-bold">All caught up!</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {filter === "unread" ? "No unanswered student queries." : "No student conversations found."}
              </p>
            </div>
          )}

          {visibleConvs.map((c) => (
            <ThreadItem
              key={c._id}
              conv={c}
              isActive={activeConversation?._id === c._id}
              onClick={() => openConversation(c)}
            />
          ))}
        </div>
      </div>

      {/* ── Right Panel: Main Chat Canvas ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-[#080b18] relative ${mobileView !== "chat" ? "hidden md:flex" : "flex"
          }`}
      >
        {!activeConversation ? (
          /* Empty Chat Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-5 bg-gradient-to-b from-[#0e1432] via-[#0b1028] to-[#080b18]">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xl">
              <MessageSquare size={38} />
            </div>
            <div className="max-w-md">
              <h3 className="text-xl font-black text-white tracking-tight">
                Faculty Response Desk
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                Select a student query from the list to review questions, send step-by-step solutions, or schedule a Google Meet consultation.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a244d] bg-[#0b1028] shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={() => setMobileView("list")}
                  className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#101738] transition cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="relative shrink-0">
                  {student?.avatarUrl ? (
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-10 h-10 rounded-2xl object-cover ring-2 ring-emerald-500/60"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 border border-emerald-500/40 flex items-center justify-center text-white font-bold text-sm ring-2 ring-emerald-500/60 shadow-sm">
                      {initialOf(student?.name)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
                    {student?.name || "Student"}
                    {activeConversation.isBlocked && (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.2 rounded-md">
                        Blocked
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                    <span className="text-emerald-400 font-medium">{activeConversation.course?.title || "Class Query"}</span>
                    {activeConversation.subject && (
                      <span className="text-zinc-400">· {activeConversation.subject}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMeetModalOpen(true)}
                  title="Share Google Meet or Zoom link"
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Video size={15} />
                  <span>Share Meet Link</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setActionMenuOpen((prev) => !prev)}
                    className="p-2 rounded-xl border border-[#223068] bg-[#101738] hover:bg-[#182352] text-zinc-300 transition cursor-pointer"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {actionMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0e1432] border border-[#223068] shadow-2xl p-1.5 z-50 pro-msg-in">
                      <button
                        onClick={() => {
                          setReportModalOpen(true);
                          setActionMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#101738] rounded-xl transition cursor-pointer"
                      >
                        <Flag size={14} className="text-rose-400" />
                        Report Student
                      </button>
                      <button
                        onClick={toggleBlockStudent}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#101738] rounded-xl transition cursor-pointer"
                      >
                        <Ban size={14} className="text-amber-400" />
                        {activeConversation.isBlocked ? "Unblock Student" : "Block Student"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Canvas */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto pro-chat-scroll px-4 sm:px-6 py-5 bg-[#080b18]"
            >
              {messagesLoading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
                      {typing.name || "Student"} is typing…
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

            {/* Input Dock */}
            <div className="p-3.5 sm:p-4 border-t border-[#1a244d] bg-[#0b1028] shrink-0">
              <div className="flex items-end gap-2 bg-[#101738] border border-[#223068] focus-within:border-emerald-500/80 rounded-2xl px-3 py-2 transition-all shadow-inner">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  disabled={activeConversation?.isBlocked}
                  accept="image/*,application/pdf,video/mp4"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={activeConversation?.isBlocked}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-[#182352] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0 cursor-pointer"
                  title="Attach solution document or image"
                >
                  <Paperclip size={18} />
                </button>
                <textarea
                  value={text}
                  onChange={(e) => handleTyping(e.target.value)}
                  disabled={activeConversation?.isBlocked}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your response to the student… (Press Enter to send, Shift+Enter for new line)"
                  rows={1}
                  className="flex-1 bg-transparent text-zinc-100 text-sm py-2 outline-none resize-none max-h-32 overflow-y-auto pro-chat-scroll placeholder:text-zinc-500 leading-relaxed disabled:opacity-50"
                  style={{ minHeight: 40 }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={
                    (!text.trim() && pendingMedia.length === 0) ||
                    sending ||
                    uploading ||
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
}