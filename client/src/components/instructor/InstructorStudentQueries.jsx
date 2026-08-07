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

// Hardware-accelerated lightweight styles
const CustomStyles = () => (
  <style>{`
    .uva-chat-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
    .uva-chat-scroll::-webkit-scrollbar-track { background: transparent; }
    .uva-chat-scroll::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 999px; }
    .uva-chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }

    @keyframes uva-pop-in {
      from { opacity: 0; transform: translate3d(0, 6px, 0) scale(0.97); }
      to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
    }
    .uva-msg-in { animation: uva-pop-in 160ms cubic-bezier(0.16, 1, 0.3, 1); will-change: transform, opacity; }
  `}</style>
);

// ── Date divider ──────────────────────────────────────────────────────────────
const DateDivider = ({ label }) => (
  <div className="flex items-center gap-3 my-6 select-none px-4">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/90 border border-slate-800/80 px-3.5 py-1 rounded-full shadow-inner backdrop-blur-md">
      {label}
    </span>
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
  </div>
);

// ── Image Lightbox Modal ──────────────────────────────────────────────────────
const ImageModal = ({ src, alt, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 uva-msg-in"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-full transition"
        >
          <X size={20} />
        </button>
        <img
          src={src}
          alt={alt || "Full preview"}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium"
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
        <span className="text-[11px] text-slate-500 italic px-3.5 py-1.5 rounded-2xl border border-slate-800/40 bg-slate-900/40 flex items-center gap-1.5">
          <Trash2 size={11} className="opacity-60" /> Message deleted
        </span>
      </div>
    );
  }

  return (
    <div
      className={`uva-msg-in flex ${isMe ? "justify-end" : "justify-start"} ${groupStart ? "mt-3" : "mt-1"} px-1 group relative`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[68%] flex items-end gap-2 ${
          isMe ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Message Actions Menu on Hover */}
        {hover && (
          <div
            className={`absolute top-0 -translate-y-1/2 z-20 flex items-center gap-1 bg-slate-900/95 border border-slate-700/80 rounded-xl p-1 shadow-lg backdrop-blur-md transition-all ${
              isMe ? "right-0 translate-x-2" : "left-0 -translate-x-2"
            }`}
          >
            {msg.text && (
              <button
                onClick={copyText}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-violet-400 transition"
                title="Copy text"
              >
                <Copy size={12} />
              </button>
            )}
            {isMe && onDelete && (
              <button
                onClick={() => onDelete(msg._id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
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
              className={`px-4 py-3 text-sm leading-relaxed break-words shadow-sm transition-all ${
                isMe
                  ? `bg-gradient-to-r from-violet-600 via-violet-600 to-purple-600 text-white rounded-[20px] ${
                      groupEnd ? "rounded-br-sm" : ""
                    }`
                  : `bg-[#131b2e] border border-slate-700/60 text-slate-100 rounded-[20px] ${
                      groupEnd ? "rounded-bl-sm" : ""
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
                <div className="relative group/img overflow-hidden rounded-2xl border border-slate-700/80 shadow-md">
                  <img
                    src={m.url}
                    alt={m.filename || "image"}
                    className="max-w-[260px] sm:max-w-[320px] max-h-[300px] object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => onPreviewImage(m.url)}
                    loading="lazy"
                  />
                  <button
                    onClick={() => onPreviewImage(m.url)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                  >
                    <Maximize2 size={20} className="drop-shadow" />
                  </button>
                </div>
              ) : (
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-[#131b2e] hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs px-4 py-3 rounded-2xl transition-all shadow-xs group/file"
                >
                  <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover/file:scale-110 transition-transform">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate max-w-[180px] font-semibold text-slate-100">
                      {m.filename || "Attachment"}
                    </p>
                    <p className="text-[10px] text-slate-400">Click to view document</p>
                  </div>
                  <ExternalLink size={13} className="text-slate-400 group-hover/file:text-violet-400" />
                </a>
              )}
            </div>
          ))}

          {/* Footer Metadata */}
          {groupEnd && (
            <div
              className={`text-[10px] font-medium mt-1 flex items-center gap-1.5 ${
                isMe ? "justify-end text-slate-400" : "justify-start text-slate-400"
              }`}
            >
              <span>{fmtTime(msg.createdAt)}</span>
              {isMe && (
                <CheckCheck
                  size={13}
                  className="text-violet-400 inline shrink-0 stroke-[2.5]"
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
      className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all duration-200 border relative overflow-hidden group ${
        isActive
          ? "bg-violet-950/40 border-violet-500/50 shadow-md shadow-violet-950/20"
          : "border-slate-800/50 hover:bg-slate-800/40 hover:border-slate-700/60"
      }`}
    >
      {/* Active Left Accent Pill */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-violet-500 to-purple-600 rounded-r-full" />
      )}

      {/* Avatar */}
      <div className="relative shrink-0 mt-0.5">
        {student?.avatarUrl ? (
          <img
            src={student.avatarUrl}
            alt={student.name}
            className={`w-11 h-11 rounded-full object-cover ring-2 ${
              isActive ? "ring-violet-500" : "ring-slate-700/80 group-hover:ring-slate-600"
            }`}
          />
        ) : (
          <div
            className={`w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 flex items-center justify-center text-white font-bold text-sm ring-2 ${
              isActive ? "ring-violet-500" : "ring-slate-700/80 group-hover:ring-slate-600"
            }`}
          >
            {initialOf(student?.name)}
          </div>
        )}
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#070b14] rounded-full shadow-xs" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-sm truncate flex items-center gap-1.5 ${
              unread > 0 ? "font-bold text-white" : "font-semibold text-slate-200"
            }`}
          >
            {student?.name || "Student"}
            {conv.isBlocked && (
              <Ban size={12} className="text-rose-400 inline shrink-0" title="Blocked" />
            )}
            {conv.isReported && (
              <Flag size={12} className="text-amber-400 inline shrink-0" title="Reported" />
            )}
          </span>
          <span className="text-[10px] font-medium text-slate-400 shrink-0">
            {conv.lastMessage?.at ? fmtDate(conv.lastMessage.at) : ""}
          </span>
        </div>

        {(conv.course?.title || conv.subject) && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {conv.course?.title && (
              <span className="inline-block text-[10px] text-violet-400 font-semibold truncate px-2 py-0.5 bg-violet-500/10 rounded-md border border-violet-500/20">
                {conv.course.title}
              </span>
            )}
            {conv.subject && (
              <span className="text-[10px] text-slate-400 font-medium truncate">
                · {conv.subject}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-1.5">
          <p
            className={`text-xs truncate ${
              unread > 0 ? "text-slate-100 font-semibold" : "text-slate-400"
            }`}
          >
            {conv.lastMessage?.text || "No messages yet"}
          </p>
          {unread > 0 && (
            <span className="min-w-[20px] h-[20px] bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1.5 shadow-xs shrink-0 animate-pulse">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// ── Student Info Sidebar ──────────────────────────────────────────────────────
const StudentInfo = ({ conv, onToggleBlock, onReport, onDelete }) => {
  const student = conv?.student;
  if (!student) return null;

  return (
    <div className="border-l border-slate-800/80 w-[260px] shrink-0 hidden xl:flex flex-col bg-[#070b14] p-5 gap-5 overflow-y-auto uva-chat-scroll">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Student Information
        </h4>
        <ShieldCheck size={14} className="text-emerald-400" />
      </div>

      <div className="flex flex-col items-center gap-3 text-center bg-[#090e1a] p-4 rounded-2xl border border-slate-800/80 shadow-xs">
        {student.avatarUrl ? (
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-violet-950/60 shadow-md"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xl ring-4 ring-violet-950/60 shadow-md">
            {initialOf(student.name)}
          </div>
        )}
        <div>
          <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
            {student.name}
          </h4>
          {student.email && (
            <p className="text-[11px] text-slate-400 mt-0.5 break-all font-mono">
              {student.email}
            </p>
          )}
        </div>
      </div>

      {conv.course && (
        <div className="bg-[#090e1a] border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[10px] text-violet-400 font-bold uppercase tracking-wider">
            <BookOpen size={12} />
            <span>Enrolled Course</span>
          </div>
          <p className="text-xs text-white font-semibold leading-snug">
            {conv.course.title}
          </p>
          {conv.subject && (
            <div className="pt-2 border-t border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">Query Topic</span>
              <p className="text-xs text-violet-300 font-semibold mt-0.5">{conv.subject}</p>
            </div>
          )}
        </div>
      )}

      {/* Moderation Actions Panel */}
      <div className="bg-[#090e1a] border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Moderation Tools
        </h5>

        <button
          onClick={onToggleBlock}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition border ${
            conv.isBlocked
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/50"
              : "bg-slate-900/80 text-amber-300 border-amber-500/30 hover:bg-amber-950/40"
          }`}
        >
          <Ban size={14} />
          <span>{conv.isBlocked ? "Unblock Student" : "Block Student"}</span>
        </button>

        <button
          onClick={onReport}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition border bg-slate-900/80 text-rose-300 border-rose-500/30 hover:bg-rose-950/40"
        >
          <Flag size={14} />
          <span>{conv.isReported ? "Reported" : "Report Student"}</span>
        </button>

        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition border bg-rose-950/30 text-rose-400 border-rose-500/40 hover:bg-rose-900/50"
        >
          <Trash2 size={14} />
          <span>Delete Entire Chat</span>
        </button>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
        <User size={14} className="text-violet-400 shrink-0" />
        <span>Verified Academy Student</span>
      </div>
    </div>
  );
};

const REPORT_REASONS = [
  "Abusive / Inappropriate Language",
  "Spamming or Excessive Messages",
  "Off-topic / Non-educational Content",
  "Harassment or Disrespectful Behavior",
  "Other Reason",
];

// ── Main InstructorStudentQueries Component ───────────────────────────────────
const InstructorStudentQueries = ({ showToast }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const {
    conversations,
    conversationsLoading,
    activeConversation,
    messages,
    messagesLoading,
    typing,
  } = useSelector((s) => s.instructorChat);

  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [mobileView, setMobileView] = useState("list"); // "list" | "chat"
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const [search, setSearch] = useState("");

  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [meetModalOpen, setMeetModalOpen] = useState(false);
  const [activeMeetRequest, setActiveMeetRequest] = useState(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState("");
  const [submittingMeetLink, setSubmittingMeetLink] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Moderation state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [blockingChat, setBlockingChat] = useState(false);

  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("authToken")
      : null;

  // ── Mount ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchConversations());
    const loadRequests = async () => {
      setRequestsLoading(true);
      try {
        const { data } = await api.get(
          API_ENDPOINTS.INSTRUCTOR_CHAT.CALL_REQUESTS,
          {
            params: { status: "pending" },
          },
        );
        setPendingRequests(data.requests ?? []);
      } catch (e) {
        console.warn("Failed to load pending call requests", e);
      } finally {
        setRequestsLoading(false);
      }
    };
    loadRequests();
    return () => {
      dispatch(resetChat());
      socketRef.current?.disconnect();
      clearTimeout(typingTimerRef.current);
    };
  }, [dispatch]);

  // ── Scroll to bottom inside chat container only ────────────────────────────
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // ── Socket ────────────────────────────────────────────────────────────────
  const connectSocket = useCallback(
    (conversationId) => {
      socketRef.current?.disconnect();
      const s = io(`${SOCKET_URL}/ichat`, {
        auth: { token },
        transports: ["websocket"],
        reconnectionAttempts: 5,
      });
      s.on("connect", () => s.emit("ic:join", { conversationId }));
      s.on("ic:history", ({ messages: hist, conversation: conv }) => {
        dispatch(setMessages(hist ?? []));
        if (conv) dispatch(setActiveConversation(conv));
      });
      s.on("ic:message", (payload) => dispatch(socketMessageReceived(payload)));
      s.on("ic:typing", (payload) => {
        dispatch(socketTypingReceived(payload));
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(
          () => dispatch(clearTyping()),
          3000,
        );
      });
      s.on("ic:read", (payload) => dispatch(socketReadReceived(payload)));

      s.on("webrtc:call-request", ({ request }) => {
        if (!request) return;
        setPendingRequests((prev) => [
          request,
          ...prev.filter((r) => r._id !== request._id),
        ]);
      });
      s.on("meet:request-rejected", ({ requestId }) => {
        setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      });

      s.on("ic:blocked-status", ({ conversationId, isBlocked }) => {
        if (activeConversation?._id === conversationId) {
          dispatch(
            setActiveConversation({
              ...activeConversation,
              isBlocked,
            }),
          );
        }
      });

      socketRef.current = s;
    },
    [token, dispatch, activeConversation],
  );

  const openMeetModal = (request) => {
    if (!request) return;
    setActiveMeetRequest(request);
    setMeetingLinkInput("");
    setMeetModalOpen(true);
  };

  const submitMeetApproval = async () => {
    if (!activeMeetRequest) return;
    const meetingLink = String(meetingLinkInput).trim();
    if (!meetingLink) {
      const msg = "Please paste a Google Meet or video conference link.";
      if (showToast) showToast(msg);
      else toast.error(msg);
      return;
    }

    setSubmittingMeetLink(true);
    try {
      await api.put(
        API_ENDPOINTS.INSTRUCTOR_CHAT.CALL_REQUEST_APPROVE(
          activeMeetRequest._id,
        ),
        {
          meetingLink,
          response: "Google Meet link shared with student.",
        },
      );
      setPendingRequests((prev) =>
        prev.filter((r) => r._id !== activeMeetRequest._id),
      );
      setMeetModalOpen(false);
      setActiveMeetRequest(null);
      setMeetingLinkInput("");
      const msg = "Google Meet link shared with student!";
      if (showToast) showToast(msg);
      else toast.success(msg);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Could not approve meet request";
      if (showToast) showToast(msg);
      else toast.error(msg);
    } finally {
      setSubmittingMeetLink(false);
    }
  };

  // ── Block / Unblock ────────────────────────────────────────────────────────
  const handleToggleBlock = async () => {
    if (!activeConversation) return;
    const targetBlockedState = !activeConversation.isBlocked;
    setBlockingChat(true);
    try {
      const { data } = await api.patch(
        API_ENDPOINTS.INSTRUCTOR_CHAT.BLOCK_CONVERSATION(activeConversation._id),
        { isBlocked: targetBlockedState },
      );
      dispatch(
        setActiveConversation({
          ...activeConversation,
          isBlocked: data.isBlocked,
        }),
      );
      dispatch(fetchConversations());
      toast.success(
        data.isBlocked ? "Student blocked successfully." : "Student unblocked.",
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to change block status";
      toast.error(msg);
    } finally {
      setBlockingChat(false);
    }
  };

  // ── Report Student ─────────────────────────────────────────────────────────
  const submitReport = async () => {
    if (!activeConversation || submittingReport) return;
    setSubmittingReport(true);
    try {
      await api.post(
        API_ENDPOINTS.INSTRUCTOR_CHAT.REPORT_CONVERSATION(activeConversation._id),
        { reason: selectedReportReason, details: reportDetails },
      );
      dispatch(
        setActiveConversation({
          ...activeConversation,
          isReported: true,
          reportReason: selectedReportReason,
        }),
      );
      dispatch(fetchConversations());
      setReportModalOpen(false);
      setReportDetails("");
      toast.success("Student reported to platform administration.");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit report";
      toast.error(msg);
    } finally {
      setSubmittingReport(false);
    }
  };

  // ── Delete Entire Conversation ─────────────────────────────────────────────
  const executeDeleteChat = async () => {
    if (!activeConversation || deletingChat) return;
    setDeletingChat(true);
    try {
      await api.delete(
        API_ENDPOINTS.INSTRUCTOR_CHAT.DELETE_CONVERSATION(activeConversation._id),
      );
      setDeleteConfirmOpen(false);
      dispatch(resetChat());
      dispatch(fetchConversations());
      setMobileView("list");
      toast.success("Conversation deleted permanently.");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete conversation";
      toast.error(msg);
    } finally {
      setDeletingChat(false);
    }
  };

  // ── Open thread ───────────────────────────────────────────────────────────
  const openThread = useCallback(
    (conv) => {
      dispatch(setMessages([]));
      dispatch(setActiveConversation(conv));
      connectSocket(conv._id);
      setMobileView("chat");
    },
    [connectSocket, dispatch],
  );

  // ── Send reply ────────────────────────────────────────────────────────────
  const sendReply = async () => {
    if (!activeConversation || sending) return;
    if (activeConversation.isBlocked) {
      toast.error("Unblock the student first to send messages.");
      return;
    }
    if (!text.trim() && pendingMedia.length === 0) return;
    setSending(true);
    try {
      let media = [];
      if (pendingMedia.length > 0) {
        setUploading(true);
        media = await Promise.all(
          pendingMedia.map(async (pm) => {
            const res = await uploadFile({
              file: pm.file,
              folder: "Umang Vision Academy/chat",
            });
            return {
              url: res.url,
              filename: pm.file.name,
              mimeType: pm.file.type,
              size: pm.file.size,
            };
          }),
        );
        setUploading(false);
        setPendingMedia([]);
      }
      socketRef.current?.emit("ic:message", {
        conversationId: activeConversation._id,
        text: text.trim(),
        media,
      });
      setText("");
    } catch (e) {
      console.error("Reply failed:", e);
      const msg = "Failed to send reply";
      if (showToast) showToast(msg);
      else toast.error(msg);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  // ── Typing ────────────────────────────────────────────────────────────────
  const handleTyping = (val) => {
    setText(val);
    if (!activeConversation) return;
    socketRef.current?.emit("ic:typing", {
      conversationId: activeConversation._id,
      isTyping: true,
    });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("ic:typing", {
        conversationId: activeConversation._id,
        isTyping: false,
      });
    }, TYPING_DEBOUNCE);
  };

  // ── Files ─────────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setPendingMedia((prev) =>
      [
        ...prev,
        ...files.map((f) => ({
          file: f,
          preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
          id: Math.random().toString(36).slice(2),
        })),
      ].slice(0, 5),
    );
    e.target.value = "";
  };

  const removePreview = (id) =>
    setPendingMedia((prev) => prev.filter((p) => p.id !== id));

  // ── Delete msg ────────────────────────────────────────────────────────────
  const handleDeleteMsg = (messageId) => {
    if (!activeConversation) return;
    dispatch({ type: "instructorChat/markMessageDeleted", payload: messageId });
    dispatch(
      deleteMessage({ conversationId: activeConversation._id, messageId }),
    );
  };

  // ── Handle archive ────────────────────────────────────────────────────────
  const handleArchive = () => {
    if (!activeConversation) return;
    dispatch(archiveConversation({ conversationId: activeConversation._id }));
    showToast?.("Conversation archived");
    setMobileView("list");
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const visibleConvs = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === "unread" && (c.instructorUnread ?? 0) === 0) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const name = c.student?.name?.toLowerCase() ?? "";
        const course = c.course?.title?.toLowerCase() ?? "";
        if (!name.includes(q) && !course.includes(q)) return false;
      }
      return true;
    });
  }, [conversations, filter, search]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((n, c) => n + (c.instructorUnread ?? 0), 0);
  }, [conversations]);

  const student = activeConversation?.student;

  // ── Message grouping + date dividers ──────────────────────────────────────
  const renderItems = useMemo(() => {
    const items = [];
    messages.forEach((msg, idx) => {
      const prev = messages[idx - 1];
      const next = messages[idx + 1];
      const isMe =
        msg.sender?._id?.toString() === user?._id?.toString() ||
        msg.sender?.toString() === user?._id?.toString();

      const sameDayAsPrev =
        prev && fmtDate(prev.createdAt) === fmtDate(msg.createdAt);
      if (!sameDayAsPrev) {
        items.push({
          type: "divider",
          key: `div-${msg._id}`,
          label: fmtDate(msg.createdAt),
        });
      }

      const closeToPrev =
        prev &&
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
    <div className="flex h-[calc(100vh-90px)] max-h-[860px] bg-[#070b14] rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl relative text-slate-100 font-sans">
      <CustomStyles />

      {/* Lightbox Modal */}
      <ImageModal
        src={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* Share Meet Link Modal */}
      {meetModalOpen && activeMeetRequest && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 uva-msg-in">
          <div className="w-full max-w-md rounded-3xl border border-violet-500/50 bg-[#0f172a] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                  <Video size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Share Meeting Link
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    For {activeMeetRequest.student?.name || "Student"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMeetModalOpen(false);
                  setActiveMeetRequest(null);
                  setMeetingLinkInput("");
                }}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-4 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              Paste your Google Meet or Zoom link below. It will be sent directly to the student's active chat.
            </p>

            <input
              value={meetingLinkInput}
              onChange={(e) => setMeetingLinkInput(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-xs text-violet-200 outline-none focus:border-violet-500 font-mono"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitMeetApproval}
                disabled={submittingMeetLink}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-4 py-3 text-xs font-bold text-white transition hover:shadow-lg disabled:opacity-60 shadow-md"
              >
                {submittingMeetLink ? "Sending Link…" : "Approve & Share Link"}
              </button>
              <button
                onClick={() => {
                  setMeetModalOpen(false);
                  setActiveMeetRequest(null);
                  setMeetingLinkInput("");
                }}
                className="rounded-xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Student Modal */}
      {reportModalOpen && activeConversation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 uva-msg-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/50 bg-[#0f172a] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <Flag size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Report Student
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Flag {student?.name || "Student"} for administrative review
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Reason
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition text-xs ${
                      selectedReportReason === reason
                        ? "bg-rose-950/40 border-rose-500/60 text-white font-semibold"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
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
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context or explanation for admin review…"
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitReport}
                disabled={submittingReport}
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-3 text-xs font-bold text-white transition disabled:opacity-60 shadow-md flex items-center justify-center gap-2"
              >
                <Flag size={15} />
                {submittingReport ? "Submitting Report…" : "Submit Report"}
              </button>
              <button
                onClick={() => setReportModalOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal */}
      {deleteConfirmOpen && activeConversation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 uva-msg-in">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/40 bg-[#0f172a] p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-white">
              Delete Chat Permanently?
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to delete all messages and history with{" "}
              <span className="text-white font-semibold">{student?.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={executeDeleteChat}
                disabled={deletingChat}
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-3 text-xs font-bold text-white transition disabled:opacity-60 shadow-md"
              >
                {deletingChat ? "Deleting…" : "Yes, Delete Chat"}
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Left Sidebar Pane ── */}
      <div
        className={`flex flex-col w-full md:w-[340px] md:min-w-[300px] border-r border-slate-800/80 bg-[#090e1a] shrink-0 ${
          mobileView === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-800/80 shrink-0 space-y-3 bg-[#070b14]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
                <MessageSquare size={18} />
              </div>
              <h2 className="text-sm font-bold text-white">Student Queries</h2>
            </div>
            {totalUnread > 0 && (
              <span className="bg-violet-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                {totalUnread} new
              </span>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students or courses…"
              className="w-full bg-[#111726] border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-violet-500/70 transition-all placeholder:text-slate-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-[#111726] border border-slate-800/80 rounded-xl">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === "all"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Queries
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === "unread"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Unread {totalUnread > 0 && `(${totalUnread})`}
            </button>
          </div>
        </div>

        {/* Call Requests Pill Banner if pending */}
        {pendingRequests.length > 0 && (
          <div className="p-3 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
              <Video size={15} className="text-emerald-400 animate-pulse" />
              <span>{pendingRequests.length} Meet request(s)</span>
            </div>
            <button
              onClick={() => openMeetModal(pendingRequests[0])}
              className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg transition"
            >
              Review
            </button>
          </div>
        )}

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto uva-chat-scroll p-3 space-y-2">
          {conversationsLoading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800/40"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 bg-slate-800 rounded" />
                    <div className="h-2 w-1/2 bg-slate-800/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!conversationsLoading && visibleConvs.length === 0 && (
            <div className="text-center py-14 px-4">
              <p className="text-xs text-slate-400 font-medium">
                {search
                  ? "No matching student queries found."
                  : filter === "unread"
                  ? "No unread student queries."
                  : "No student queries yet."}
              </p>
            </div>
          )}

          {visibleConvs.map((c) => (
            <ThreadItem
              key={c._id}
              conv={c}
              isActive={activeConversation?._id === c._id}
              onClick={() => openThread(c)}
            />
          ))}
        </div>
      </div>

      {/* ── Center Panel: Chat Body ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-[#070b14] ${
          mobileView !== "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {!activeConversation ? (
          /* Empty Chat Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-5 bg-gradient-to-b from-[#090e1a] to-[#070b14]">
            <div className="w-20 h-20 rounded-3xl bg-violet-950/40 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-xl">
              <MessageSquare size={36} />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-white">
                Student Doubts & Queries
              </h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Select a student query from the list on the left to review their question, share meeting links, block, report, or delete chats.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#090e1a] shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={() => setMobileView("list")}
                  className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="relative shrink-0">
                  {student?.avatarUrl ? (
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-500/60"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm ring-2 ring-violet-500/60">
                      {initialOf(student?.name)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#090e1a] rounded-full" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    {student?.name}
                    <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/15 border border-violet-500/30 px-2 py-0.2 rounded-md">
                      Student
                    </span>
                    {activeConversation.isBlocked && (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.2 rounded-md flex items-center gap-1">
                        <Ban size={10} /> Blocked
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {activeConversation.course?.title || "General Query"}
                    {activeConversation.subject
                      ? ` · ${activeConversation.subject}`
                      : ""}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    openMeetModal({
                      _id: Math.random().toString(),
                      student: activeConversation.student,
                    })
                  }
                  title="Share Google Meet link"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md shadow-violet-600/20"
                >
                  <Video size={14} />
                  <span className="hidden sm:inline">Meet Link</span>
                </button>

                <button
                  onClick={handleToggleBlock}
                  disabled={blockingChat}
                  title={activeConversation.isBlocked ? "Unblock Student" : "Block Student"}
                  className={`p-2 rounded-xl border transition ${
                    activeConversation.isBlocked
                      ? "text-emerald-400 bg-emerald-950/40 border-emerald-500/40 hover:bg-emerald-900/50"
                      : "text-amber-400 bg-slate-900/80 border-slate-700/80 hover:border-amber-500/50 hover:text-amber-300"
                  }`}
                >
                  <Ban size={16} />
                </button>

                <button
                  onClick={() => setReportModalOpen(true)}
                  title="Report Student"
                  className={`p-2 rounded-xl border transition ${
                    activeConversation.isReported
                      ? "text-rose-400 bg-rose-950/40 border-rose-500/40"
                      : "text-slate-400 bg-slate-900/80 border-slate-700/80 hover:border-rose-500/40 hover:text-rose-400"
                  }`}
                >
                  <Flag size={16} />
                </button>

                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  title="Delete Entire Chat"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-slate-900/80 border border-slate-700/80 hover:border-rose-500/40 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Block Banner Warning */}
            {activeConversation.isBlocked && (
              <div className="bg-rose-950/40 border-b border-rose-500/30 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-rose-300">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-400 shrink-0" />
                  <span>
                    You have blocked this student. They cannot send new messages in this chat.
                  </span>
                </div>
                <button
                  onClick={handleToggleBlock}
                  className="text-xs font-bold underline hover:text-white shrink-0"
                >
                  Unblock
                </button>
              </div>
            )}

            {/* Messages Body */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto uva-chat-scroll px-4 py-4 bg-gradient-to-b from-[#070b14] via-[#080d19] to-[#070b14]"
            >
              {messagesLoading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!messagesLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-14 px-4 gap-3">
                  <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mb-1 shadow-inner">
                    💬
                  </div>
                  <h4 className="text-slate-200 text-sm font-bold">
                    No messages in this query yet
                  </h4>
                  <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                    Type a message below to reach out to {student?.name}.
                  </p>
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
                <div className="flex justify-start mt-3 px-2 uva-msg-in">
                  <div className="bg-[#131b2e] rounded-2xl rounded-bl-xs px-4 py-2.5 flex gap-2 items-center border border-slate-700/50 shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {typing.name || "Student"} is typing…
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Media Attachment Previews */}
            {pendingMedia.length > 0 && (
              <div className="flex gap-3 px-4 py-3 border-t border-slate-800/80 bg-[#090e1a] overflow-x-auto shrink-0 uva-chat-scroll">
                {pendingMedia.map((pm) => (
                  <div key={pm.id} className="relative shrink-0 group">
                    {pm.preview ? (
                      <img
                        src={pm.preview}
                        alt="preview"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center p-1 text-center">
                        <FileText size={18} className="text-violet-400 mb-1" />
                        <span className="text-[9px] text-slate-300 truncate w-full px-1">
                          {pm.file.name}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removePreview(pm.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center text-white shadow-md transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Toolbar */}
            <div className="p-3.5 border-t border-slate-800/80 bg-[#090e1a] shrink-0">
              <div className="flex items-end gap-2 bg-[#111726] border border-slate-700/70 focus-within:border-violet-500/80 rounded-2xl px-3 py-2 transition-all shadow-inner">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,application/pdf,video/mp4"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-slate-400 hover:text-violet-400 hover:bg-slate-800/60 transition shrink-0"
                  title="Attach media or document"
                >
                  <Paperclip size={18} />
                </button>
                <textarea
                  value={text}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder={
                    activeConversation.isBlocked
                      ? "Chat blocked. Unblock to reply…"
                      : "Type your reply… (Press Enter to send, Shift+Enter for new line)"
                  }
                  disabled={activeConversation.isBlocked}
                  rows={1}
                  className="flex-1 bg-transparent text-slate-100 text-sm py-2 outline-none resize-none max-h-32 overflow-y-auto uva-chat-scroll placeholder:text-slate-500 leading-relaxed disabled:opacity-50"
                  style={{ minHeight: 40 }}
                />
                <button
                  onClick={sendReply}
                  disabled={
                    (!text.trim() && pendingMedia.length === 0) ||
                    sending ||
                    uploading ||
                    activeConversation.isBlocked
                  }
                  className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shrink-0 shadow-md shadow-violet-600/20 active:scale-95"
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

      {/* Right Student Details Panel */}
      {activeConversation && (
        <StudentInfo
          conv={activeConversation}
          onToggleBlock={handleToggleBlock}
          onReport={() => setReportModalOpen(true)}
          onDelete={() => setDeleteConfirmOpen(true)}
        />
      )}
    </div>
  );
};

export default InstructorStudentQueries;