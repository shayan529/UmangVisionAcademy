import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  HelpCircle,
  MessageCircle,
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

// Hardware-accelerated CSS styles for low latency & fluid animations
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

    @keyframes uva-pulse-glow {
      0%, 100% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.25); }
      50% { box-shadow: 0 0 25px rgba(99, 102, 241, 0.45); }
    }
    .uva-glow-active { animation: uva-pulse-glow 3s infinite ease-in-out; }
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
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
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
        <span className="text-[11px] text-slate-500 italic px-3.5 py-1.5 rounded-2xl border border-slate-800/40 bg-slate-900/40 backdrop-blur-xs flex items-center gap-1.5">
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
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition"
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
                  ? `bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white rounded-[20px] ${
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
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover/file:scale-110 transition-transform">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate max-w-[180px] font-semibold text-slate-100">
                      {m.filename || "Attachment"}
                    </p>
                    <p className="text-[10px] text-slate-400">Click to view document</p>
                  </div>
                  <ExternalLink size={13} className="text-slate-400 group-hover/file:text-indigo-400" />
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
                  className="text-indigo-400 inline shrink-0 stroke-[2.5]"
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
      className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all duration-200 border relative overflow-hidden group ${
        isActive
          ? "bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/20"
          : "border-slate-800/50 hover:bg-slate-800/40 hover:border-slate-700/60"
      }`}
    >
      {/* Active Left Accent Pill */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-r-full" />
      )}

      {/* Avatar */}
      <div className="relative shrink-0 mt-0.5">
        {instructor?.avatarUrl ? (
          <img
            src={instructor.avatarUrl}
            alt={instructor.name}
            className={`w-11 h-11 rounded-full object-cover ring-2 ${
              isActive ? "ring-indigo-500" : "ring-slate-700/80 group-hover:ring-slate-600"
            }`}
          />
        ) : (
          <div
            className={`w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center text-white font-bold text-sm ring-2 ${
              isActive ? "ring-indigo-500" : "ring-slate-700/80 group-hover:ring-slate-600"
            }`}
          >
            {initialOf(instructor?.name)}
          </div>
        )}
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#070b14] rounded-full shadow-xs" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-sm truncate ${
              unread > 0 ? "font-bold text-white" : "font-semibold text-slate-200"
            }`}
          >
            {instructor?.name || "Instructor"}
          </span>
          <span className="text-[10px] font-medium text-slate-400 shrink-0">
            {conv.lastMessage?.at ? fmtDate(conv.lastMessage.at) : ""}
          </span>
        </div>

        {conv.course?.title && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-block text-[10px] text-indigo-400 font-semibold truncate px-2 py-0.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
              {conv.course.title}
            </span>
            {conv.assistanceDisabled && (
              <span className="inline-block text-[9px] text-amber-300 font-bold px-2 py-0.5 bg-amber-500/15 rounded-md border border-amber-500/30">
                Assistance OFF
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
            <span className="min-w-[20px] h-[20px] bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1.5 shadow-xs shrink-0 animate-pulse">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// ── Quick Prompt Pills ────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "Can you help me understand this concept?",
  "Could you review my recent assignment?",
  "When is our next doubts session?",
  "Can we schedule a 1-on-1 Google Meet?",
];

// ── Main AskInstructor Component ──────────────────────────────────────────────
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

  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [view, setView] = useState("threads"); // "selector" | "threads" | "chat"
  const [filterTab, setFilterTab] = useState("all"); // "all" | "unread"
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [threadSearch, setThreadSearch] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Meet link request state
  const [pendingCallRequests, setPendingCallRequests] = useState({});
  const [submittingCallFor, setSubmittingCallFor] = useState(null);
  const [approvedMeeting, setApprovedMeeting] = useState(null);

  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("authToken")
      : null;

  // ── On mount ─────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchAvailableInstructors());
    dispatch(fetchConversations()).then((res) => {
      const convs = res?.payload?.conversations ?? [];
      if (convs.length > 0) setView("threads");
      else setView("selector");
    });
    api
      .get(API_ENDPOINTS.INSTRUCTOR_CHAT.CALL_REQUESTS, {
        params: { status: "pending" },
      })
      .then(({ data }) => {
        setPendingCallRequests(
          (data.requests ?? []).reduce((requests, request) => {
            const conversationId =
              request.conversation?._id || request.conversation;
            if (conversationId) requests[conversationId.toString()] = request;
            return requests;
          }, {}),
        );
      })
      .catch((err) =>
        console.warn("Failed to load pending call requests", err),
      );
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
      s.on("ic:error", (payload) => {
        console.warn("Instructor chat socket error:", payload);
      });
      s.on("connect_error", (error) => {
        console.warn(
          "Instructor chat connection error:",
          error.message || error,
        );
      });

      s.on("meet:request-approved", (payload) => {
        setPendingCallRequests((requests) => {
          const next = { ...requests };
          delete next[conversationId.toString()];
          return next;
        });
        setSubmittingCallFor(null);
        if (payload) {
          setApprovedMeeting({
            meetingLink: payload.meetingLink,
            response: payload.response,
          });
        }
      });

      s.on("meet:request-rejected", () => {
        setPendingCallRequests((requests) => {
          const next = { ...requests };
          delete next[conversationId.toString()];
          return next;
        });
        setSubmittingCallFor(null);
        toast("Instructor declined the call request", { icon: "📵" });
      });
      socketRef.current = s;
    },
    [token, dispatch],
  );

  const loadConversationCallRequests = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      const { data } = await api.get(
        API_ENDPOINTS.INSTRUCTOR_CHAT.CALL_REQUESTS,
        {
          params: { conversationId },
        },
      );

      const requests = data.requests ?? [];
      const pending = requests.find((r) => r.status === "pending");

      setPendingCallRequests((existing) => {
        const next = { ...existing };
        if (pending) {
          next[conversationId.toString()] = pending;
        } else {
          delete next[conversationId.toString()];
        }
        return next;
      });
    } catch (err) {
      console.warn("Failed to load call requests for conversation", err);
    }
  }, []);

  useEffect(() => {
    if (activeConversation?._id) {
      loadConversationCallRequests(activeConversation._id);
    }
  }, [activeConversation, loadConversationCallRequests]);

  // ── Request a meet link ───────────────────────────────────────────────────
  const requestVideoCall = async () => {
    const conversationId = activeConversation?._id?.toString();
    if (
      !conversationId ||
      pendingCallRequests[conversationId] ||
      submittingCallFor
    )
      return;
    setSubmittingCallFor(conversationId);
    try {
      const { data } = await api.post(
        API_ENDPOINTS.INSTRUCTOR_CHAT.CALL_REQUESTS,
        {
          conversationId: activeConversation._id,
          message: "Student requested a Google Meet call",
        },
      );
      setPendingCallRequests((requests) => ({
        ...requests,
        [conversationId]: data,
      }));
      setSubmittingCallFor(null);
      toast.success("Meet request sent to instructor!");
    } catch (err) {
      setSubmittingCallFor(null);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Unable to request a meet link";
      toast.error(msg);
    }
  };

  // ── Cancel pending call request ───────────────────────────────────────────
  const cancelCallRequest = async () => {
    const conversationId = activeConversation?._id?.toString();
    const request = conversationId ? pendingCallRequests[conversationId] : null;
    if (!conversationId || !request) return;
    try {
      await api.put(
        API_ENDPOINTS.INSTRUCTOR_CHAT.CALL_REQUEST_REJECT(request._id),
        {
          response: "Cancelled by student",
        },
      );
      toast("Call request cancelled", { icon: "✋" });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Unable to cancel call request";
      toast.error(msg);
    } finally {
      setPendingCallRequests((requests) => {
        const next = { ...requests };
        delete next[conversationId];
        return next;
      });
    }
  };

  // ── Open a thread ─────────────────────────────────────────────────────────
  const openThread = useCallback(
    (conv) => {
      dispatch(setMessages([]));
      dispatch(setActiveConversation(conv));
      connectSocket(conv._id);
      loadConversationCallRequests(conv._id);
      setView("chat");
    },
    [connectSocket, dispatch, loadConversationCallRequests],
  );

  // ── Start new chat ────────────────────────────────────────────────────────
  const startChat = async () => {
    if (!selectedCourse) return;
    const instructorId =
      selectedCourse.instructor?._id?.toString?.() ||
      String(selectedCourse.instructor?._id || "");
    if (!instructorId) {
      toast.error("Could not find instructor for this course.");
      return;
    }
    const result = await dispatch(
      getOrCreateConversation({
        instructorId,
        courseId: selectedCourse.courseId?.toString?.(),
        subject: selectedSubject || "",
      }),
    );
    if (result.payload?._id) {
      openThread(result.payload);
    } else {
      const msg =
        result.payload || "Could not start conversation. Please try again.";
      toast.error(typeof msg === "string" ? msg : "Failed to start chat");
    }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (overrideText = null) => {
    const textToSend = overrideText !== null ? overrideText : text;
    if (!activeConversation || sending) return;
    if (!textToSend.trim() && pendingMedia.length === 0) return;
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
        text: textToSend.trim(),
        media,
      });
      setText("");
    } catch (e) {
      console.error("Send failed:", e);
      toast.error("Failed to send message. Please try again.");
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

  // ── File picker ───────────────────────────────────────────────────────────
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

  // ── Delete message ────────────────────────────────────────────────────────
  const handleDeleteMsg = (messageId) => {
    if (!activeConversation) return;
    dispatch({ type: "instructorChat/markMessageDeleted", payload: messageId });
    dispatch(
      deleteMessage({ conversationId: activeConversation._id, messageId }),
    );
  };

  const instructor = activeConversation ? activeConversation.instructor : null;
  const activeConversationId = activeConversation?._id?.toString();
  const activeCallRequest = activeConversationId
    ? pendingCallRequests[activeConversationId]
    : null;
  const isSubmittingCall = submittingCallFor === activeConversationId;

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.studentUnread ?? 0), 0);
  }, [conversations]);

  const visibleThreads = useMemo(() => {
    return conversations.filter((c) => {
      if (filterTab === "unread" && (c.studentUnread ?? 0) === 0) return false;
      if (!threadSearch.trim()) return true;
      const q = threadSearch.trim().toLowerCase();
      const name = c.instructor?.name?.toLowerCase() ?? "";
      const course = c.course?.title?.toLowerCase() ?? "";
      return name.includes(q) || course.includes(q);
    });
  }, [conversations, filterTab, threadSearch]);

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

      {/* Approved Meet link Modal */}
      {approvedMeeting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 uva-msg-in">
          <div className="w-full max-w-md rounded-3xl border border-indigo-500/50 bg-[#0f172a] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-indigo-400 font-bold">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                <Video size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Google Meet Link Ready</h3>
                <span className="text-[11px] text-slate-400 font-normal">Approved by instructor</span>
              </div>
            </div>
            {approvedMeeting.response && (
              <p className="mt-4 text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                "{approvedMeeting.response}"
              </p>
            )}
            <div className="mt-4 rounded-2xl border border-indigo-500/30 bg-slate-950 p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Meeting URL
              </span>
              <p className="text-xs font-mono text-indigo-300 break-all select-all font-semibold">
                {approvedMeeting.meetingLink}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <a
                href={approvedMeeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-center text-xs font-bold text-white transition hover:from-indigo-500 hover:to-violet-500 shadow-md flex items-center justify-center gap-2"
              >
                <Video size={16} /> Join Google Meet Now
              </a>
              <button
                onClick={() => setApprovedMeeting(null)}
                className="rounded-xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Left Sidebar Pane ── */}
      <div
        className={`flex flex-col w-full md:w-[340px] md:min-w-[300px] border-r border-slate-800/80 bg-[#090e1a] shrink-0 ${
          view === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-800/80 shrink-0 space-y-3 bg-[#070b14]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <MessageSquare size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">
                  Ask Instructor
                </h2>
                <span className="text-[10px] text-indigo-400 font-medium">
                  Direct Q&A Support
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setView("selector");
                setSelectedCourse(null);
                setSelectedSubject("");
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95"
            >
              <Plus size={15} /> New Chat
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search chats or courses…"
              className="w-full bg-[#111726] border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-indigo-500/70 transition-all placeholder:text-slate-500"
            />
            {threadSearch && (
              <button
                onClick={() => setThreadSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-[#111726] border border-slate-800/80 rounded-xl">
            <button
              onClick={() => {
                setView("threads");
                setFilterTab("all");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                view === "threads" && filterTab === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Chats
            </button>
            <button
              onClick={() => {
                setView("threads");
                setFilterTab("unread");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                view === "threads" && filterTab === "unread"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Unread {totalUnreadCount > 0 && `(${totalUnreadCount})`}
            </button>
          </div>
        </div>

        {/* ── View 1: New Chat Selector Drawer ── */}
        {view === "selector" && (
          <div className="flex-1 overflow-y-auto uva-chat-scroll p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Enrolled Course
              </span>
              {conversations.length > 0 && (
                <button
                  onClick={() => setView("threads")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
                >
                  View Active Chats ({conversations.length})
                </button>
              )}
            </div>

            {availableLoading && (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/50 animate-pulse border border-slate-800/40"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 bg-slate-800 rounded" />
                      <div className="h-2.5 w-1/2 bg-slate-800/60 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!availableLoading && availableInstructors.length === 0 && (
              <div className="text-center py-12 px-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 my-4 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-1">
                  <Sparkles size={26} />
                </div>
                <h4 className="text-slate-100 text-sm font-extrabold">
                  Instructor Assistance Not Unlocked
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
                  Ask Instructor chat is available for courses purchased with the <span className="text-indigo-300 font-bold">✨ Buy with Instructor Assistance</span> option (₹500).
                </p>
                <button
                  onClick={() => navigate("/courses")}
                  className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95"
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
                        ? "border-indigo-500 bg-indigo-950/40 shadow-md shadow-indigo-950/30"
                        : "border-slate-800/80 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80"
                    }`}
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.courseTitle}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700/60 mt-0.5"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-900 to-violet-950 border border-indigo-800/50 flex items-center justify-center text-indigo-300 font-bold shrink-0 mt-0.5">
                        <BookOpen size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                        {item.courseTitle}
                      </h4>
                      <p className="text-[11px] text-indigo-400 font-medium mt-1 flex items-center gap-1">
                        <ShieldCheck size={12} className="inline text-emerald-400" />
                        {item.instructor?.name}
                      </p>
                      {item.category && (
                        <span className="inline-block text-[9px] text-slate-400 mt-1 font-medium">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

            {selectedCourse && (
              <div className="space-y-4 pt-4 border-t border-slate-800/80 uva-msg-in">
                {selectedCourse.subjects?.length > 0 && (
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
                      Select Topic / Subject (Optional)
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-[#111726] border border-slate-700/80 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                    >
                      <option value="">— General Doubts —</option>
                      {selectedCourse.subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={startChat}
                  className="w-full bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 rounded-xl transition-all text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} /> Start Chat with {selectedCourse.instructor?.name}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── View 2: Thread List ── */}
        {(view === "threads" || view === "chat") && (
          <div
            className={`flex-1 overflow-y-auto uva-chat-scroll p-3 space-y-2 ${
              view === "chat" ? "hidden md:block" : ""
            }`}
          >
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

            {!conversationsLoading && visibleThreads.length === 0 && (
              <div className="text-center py-12 px-4">
                <p className="text-xs text-slate-400 font-medium">
                  {threadSearch
                    ? "No matching conversations found."
                    : filterTab === "unread"
                    ? "No unread messages."
                    : "No conversations started yet."}
                </p>
                {!threadSearch && (
                  <button
                    onClick={() => setView("selector")}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold"
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

      {/* ── Right Panel: Main Chat Window ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-[#070b14] relative ${
          view !== "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {!activeConversation ? (
          /* Empty Chat Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-5 bg-gradient-to-b from-[#090e1a] to-[#070b14]">
            <div className="w-20 h-20 rounded-3xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl uva-glow-active">
              <MessageSquare size={36} />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-white">
                Direct Learning Support
              </h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Select a conversation from the sidebar or click <span className="text-indigo-400 font-semibold">+ New Chat</span> to connect directly with your instructor for doubt resolution.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-sm mt-2">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-left">
                <span className="text-[11px] font-bold text-indigo-400 block mb-1">⚡ Fast Support</span>
                <span className="text-[10px] text-slate-400">Direct one-on-one assistance from expert teachers.</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-left">
                <span className="text-[11px] font-bold text-indigo-400 block mb-1">📹 Video Call</span>
                <span className="text-[10px] text-slate-400">Request Google Meet links for interactive discussions.</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#090e1a] shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={() => setView("threads")}
                  className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="relative shrink-0">
                  {instructor?.avatarUrl ? (
                    <img
                      src={instructor.avatarUrl}
                      alt={instructor.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/60"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center text-white font-bold text-sm ring-2 ring-indigo-500/60">
                      {initialOf(instructor?.name)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#090e1a] rounded-full" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    {instructor?.name}
                    <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.2 rounded-md">
                      Instructor
                    </span>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={requestVideoCall}
                  disabled={Boolean(activeCallRequest) || isSubmittingCall || activeConversation?.assistanceDisabled}
                  title="Request a 1-on-1 Google Meet link"
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20"
                >
                  <Video size={15} />
                  <span>
                    {isSubmittingCall
                      ? "Sending Request…"
                      : activeCallRequest
                      ? "Meet Request Sent"
                      : "Meet Link"}
                  </span>
                </button>

                {activeCallRequest && (
                  <button
                    onClick={cancelCallRequest}
                    className="text-xs text-slate-400 hover:text-rose-400 px-3 py-2 rounded-xl border border-slate-800 hover:border-rose-500/40 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Backdrop Blur Lock Overlay & Upgrade Popup */}
            {activeConversation?.assistanceDisabled && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#070b14]/75 backdrop-blur-md p-4 animate-fadeIn">
                <div className="w-full max-w-md rounded-3xl border border-indigo-500/40 bg-[#0f172a]/95 p-6 sm:p-7 shadow-2xl shadow-indigo-950/80 text-center relative overflow-hidden">
                  {/* Background Glow */}
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

                  {/* Header Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30 mb-4">
                    <Sparkles size={30} />
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-extrabold uppercase tracking-wider mb-2">
                    ✨ Access Instructor Assistance
                  </span>

                  <h3 className="text-xl font-black text-white leading-tight">
                    Unlock Direct Instructor Support
                  </h3>

                  <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                    Instructor Assistance is currently turned OFF for <span className="text-white font-bold">{activeConversation.course?.title || "this course"}</span>.
                  </p>

                  {/* Benefits Box */}
                  <div className="mt-5 space-y-2.5 text-left bg-slate-900/80 rounded-2xl border border-slate-800 p-4">
                    <p className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-wider mb-1">
                      Instructor Assistance Benefits:
                    </p>
                    <div className="flex items-center gap-2.5 text-xs text-slate-200">
                      <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                      <span>1-on-1 Direct Q&A with course instructors</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-200">
                      <Video size={16} className="text-indigo-400 shrink-0" />
                      <span>Priority 1-on-1 Google Meet video sessions</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-200">
                      <BookOpen size={16} className="text-sky-400 shrink-0" />
                      <span>Detailed doubt explanations & study support</span>
                    </div>
                  </div>

                  {/* Upgrade Price Highlight */}
                  <div className="mt-5 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-violet-950/60 border border-indigo-500/30 flex items-center justify-between gap-3">
                    <div className="text-left">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Upgrade Option
                      </p>
                      <p className="text-sm font-extrabold text-white">
                        Buy with Assistance
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 line-through mr-1.5">₹500</span>
                      <span className="text-base font-black text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                        Pay ₹400 More
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => navigate("/courses")}
                    className="w-full mt-5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 text-xs transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> Unlock Instructor Assistance (Pay ₹400 More)
                  </button>
                </div>
              </div>
            )}

            {/* Messages Body */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto uva-chat-scroll px-4 py-4 bg-gradient-to-b from-[#070b14] via-[#080d19] to-[#070b14]"
            >
              {messagesLoading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!messagesLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-14 px-4 gap-3">
                  <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mb-1 shadow-inner">
                    👋
                  </div>
                  <h4 className="text-slate-200 text-sm font-bold">
                    Start conversation with {instructor?.name}
                  </h4>
                  <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                    Ask any question regarding lessons, study materials, or doubts.
                  </p>

                  {/* Quick Suggestions */}
                  {!activeConversation?.assistanceDisabled && (
                    <div className="flex flex-wrap justify-center gap-2 max-w-md mt-3">
                      {QUICK_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(prompt)}
                          className="text-[11px] text-indigo-300 hover:text-white bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 px-3 py-1.5 rounded-full transition-all"
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
                <div className="flex justify-start mt-3 px-2 uva-msg-in">
                  <div className="bg-[#131b2e] rounded-2xl rounded-bl-xs px-4 py-2.5 flex gap-2 items-center border border-slate-700/50 shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {typing.name || "Instructor"} is typing…
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
                        <FileText size={18} className="text-indigo-400 mb-1" />
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
              <div className="flex items-end gap-2 bg-[#111726] border border-slate-700/70 focus-within:border-indigo-500/80 rounded-2xl px-3 py-2 transition-all shadow-inner">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  disabled={activeConversation?.assistanceDisabled || activeConversation?.isBlocked}
                  accept="image/*,application/pdf,video/mp4"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={activeConversation?.assistanceDisabled || activeConversation?.isBlocked}
                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                  title="Attach media or document"
                >
                  <Paperclip size={18} />
                </button>
                <textarea
                  value={text}
                  onChange={(e) => handleTyping(e.target.value)}
                  disabled={activeConversation?.assistanceDisabled || activeConversation?.isBlocked}
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
                  className="flex-1 bg-transparent text-slate-100 text-sm py-2 outline-none resize-none max-h-32 overflow-y-auto uva-chat-scroll placeholder:text-slate-500 leading-relaxed disabled:opacity-50 cursor-not-allowed"
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
                  className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shrink-0 shadow-md shadow-indigo-600/20 active:scale-95"
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
