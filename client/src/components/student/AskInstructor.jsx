import { useEffect, useRef, useState, useCallback } from "react";
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
import { Paperclip, Send, X, ChevronLeft, Video, Trash2 } from "lucide-react";

const TYPING_DEBOUNCE = 1500;

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  return dt.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ── Message bubble ────────────────────────────────────────────────────────────
const Bubble = ({ msg, isMe, onDelete }) => {
  const [hover, setHover] = useState(false);
  if (msg.deleted) {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
        <span className="text-xs text-slate-600 italic px-3 py-1.5">
          [message deleted]
        </span>
      </div>
    );
  }
  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2 group`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative max-w-[75%]">
        {msg.text && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
              isMe
                ? "bg-indigo-600 text-white rounded-br-sm"
                : "bg-slate-800 text-slate-100 rounded-bl-sm"
            }`}
          >
            {msg.text}
          </div>
        )}
        {(msg.media ?? []).map((m, i) => (
          <div key={i} className="mt-1">
            {m.mimeType?.startsWith("image/") ? (
              <img
                src={m.url}
                alt={m.filename || "image"}
                className="max-w-[220px] rounded-xl cursor-pointer"
                onClick={() => window.open(m.url, "_blank")}
              />
            ) : (
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-2 rounded-xl transition"
              >
                <Paperclip size={12} />
                {m.filename || "attachment"}
              </a>
            )}
          </div>
        ))}
        <div
          className={`text-[10px] mt-0.5 ${isMe ? "text-right text-indigo-300" : "text-slate-500"}`}
        >
          {fmtTime(msg.createdAt)}
        </div>
        {isMe && hover && onDelete && (
          <button
            onClick={() => onDelete(msg._id)}
            className="absolute -top-2 -left-6 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-rose-400 transition"
            title="Delete"
          >
            <Trash2 size={10} />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Thread list item ──────────────────────────────────────────────────────────
const ThreadItem = ({ conv, isActive, onClick }) => {
  const other = conv.instructor;
  const unread = conv.studentUnread ?? 0;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
        isActive
          ? "bg-indigo-950/50 border border-indigo-800/40"
          : "hover:bg-slate-800/60"
      }`}
    >
      <div className="relative shrink-0">
        {other?.avatarUrl ? (
          <img
            src={other.avatarUrl}
            alt={other.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
            {other?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
            {unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white truncate">
            {other?.name}
          </span>
          <span className="text-[10px] text-slate-500 shrink-0">
            {conv.lastMessage?.at ? fmtDate(conv.lastMessage.at) : ""}
          </span>
        </div>
        {conv.course?.title && (
          <span className="text-[10px] text-indigo-400 font-medium truncate block">
            {conv.course.title}
          </span>
        )}
        {conv.lastMessage?.text && (
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {conv.lastMessage.text}
          </p>
        )}
      </div>
    </button>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
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
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const [view, setView] = useState("selector"); // "selector"|"threads"|"chat"
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  // Video call request state
  // Key requests by conversation so one instructor's request never affects
  // the call button for another instructor.
  const [pendingCallRequests, setPendingCallRequests] = useState({});
  const [submittingCallFor, setSubmittingCallFor] = useState(null);
  // When instructor starts the call after approving, show ringing screen
  const [ringingCall, setRingingCall] = useState(null); // { sessionId }

  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("authToken")
      : null;

  // ── On mount ─────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchAvailableInstructors());
    dispatch(fetchConversations()).then((res) => {
      // If student already has conversations, default to threads view
      const convs = res?.payload?.conversations ?? [];
      if (convs.length > 0) setView("threads");
    });
    api
      .get(API_ENDPOINTS.INSTRUCTOR_CHAT.CALL_REQUESTS, {
        params: { status: "pending" },
      })
      .then(({ data }) => {
        setPendingCallRequests(
          (data.requests ?? []).reduce((requests, request) => {
            const conversationId = request.conversation?._id || request.conversation;
            if (conversationId) requests[conversationId.toString()] = request;
            return requests;
          }, {}),
        );
      })
      .catch((err) => console.warn("Failed to load pending call requests", err));
    return () => {
      dispatch(resetChat());
      socketRef.current?.disconnect();
      clearTimeout(typingTimerRef.current);
    };
  }, [dispatch]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

      // Instructor approved the request and started the call
      s.on("webrtc:call-initiated", ({ sessionId }) => {
        setPendingCallRequests((requests) => {
          const next = { ...requests };
          delete next[conversationId.toString()];
          return next;
        });
        setSubmittingCallFor(null);
        setRingingCall({ sessionId });
      });

      // Instructor declined the call request
      s.on("webrtc:call-decline", () => {
        setPendingCallRequests((requests) => {
          const next = { ...requests };
          delete next[conversationId.toString()];
          return next;
        });
        setSubmittingCallFor(null);
        setRingingCall(null);
        toast("Instructor declined the call request", { icon: "📵" });
      });
      socketRef.current = s;
    },
    [token, dispatch],
  );

  // ── Request video call ────────────────────────────────────────────────────
  // Student sends a call request notification to the instructor.
  // The instructor then approves and starts the call, which triggers
  // webrtc:call-initiated back to the student.
  const requestVideoCall = async () => {
    const conversationId = activeConversation?._id?.toString();
    if (!conversationId || pendingCallRequests[conversationId] || submittingCallFor)
      return;
    setSubmittingCallFor(conversationId);
    try {
      const { data } = await api.post(
        API_ENDPOINTS.INSTRUCTOR_CHAT.CALL_REQUESTS,
        {
          conversationId: activeConversation._id,
          message: "Student requested a video call",
        },
      );
      setPendingCallRequests((requests) => ({
        ...requests,
        [conversationId]: data,
      }));
      setSubmittingCallFor(null);
      toast.success("Video call request sent.");
    } catch (err) {
      setSubmittingCallFor(null);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Unable to request video call";
      toast.error(msg);
    }
  };

  // ── Cancel pending call request ───────────────────────────────────────────────────
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
      setView("chat");
    },
    [connectSocket, dispatch],
  );

  // ── Start new chat ────────────────────────────────────────────────────────
  const startChat = async () => {
    if (!selectedCourse) return;
    const instructorId =
      selectedCourse.instructor?._id?.toString?.() ||
      String(selectedCourse.instructor?._id || "");
    if (!instructorId) {
      toast.error("Could not find instructor. Please try again.");
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
  const sendMessage = async () => {
    if (!activeConversation || sending) return;
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
      console.error("Send failed:", e);
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

  const other = activeConversation
    ? (activeConversation.instructor ?? activeConversation.student)
    : null;
  const activeConversationId = activeConversation?._id?.toString();
  const activeCallRequest = activeConversationId
    ? pendingCallRequests[activeConversationId]
    : null;
  const isSubmittingCall = submittingCallFor === activeConversationId;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-80px)] max-h-[820px] bg-[#0b1120] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
      {/* ── Ringing screen: shown when instructor starts the call ── */}
      {ringingCall && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm rounded-2xl gap-6">
          {/* Animated ring */}
          <div className="relative flex items-center justify-center">
            <span className="absolute w-28 h-28 rounded-full bg-indigo-500/20 animate-ping" />
            <span
              className="absolute w-20 h-20 rounded-full bg-indigo-500/30 animate-ping"
              style={{ animationDelay: "0.3s" }}
            />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Video size={28} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">Incoming Video Call</p>
            <p className="text-slate-400 text-sm mt-1">
              Your instructor is calling…
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                const { sessionId } = ringingCall;
                setRingingCall(null);
                navigate(`/video-call/${sessionId}`);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl text-sm transition shadow-lg shadow-emerald-600/30"
            >
              <Video size={16} /> Answer
            </button>
            <button
              onClick={() => {
                setRingingCall(null);
              }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-2xl text-sm transition shadow-lg shadow-rose-600/30"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* ── Left panel ── */}
      <div
        className={`flex flex-col w-full md:w-[300px] md:min-w-[260px] border-r border-slate-800 bg-[#080f1e] shrink-0 ${view === "chat" ? "hidden md:flex" : "flex"}`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800 shrink-0">
          <h2 className="text-base font-bold text-white">Ask Instructor</h2>
          <button
            onClick={() => {
              setView("selector");
              setSelectedCourse(null);
              setSelectedSubject("");
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
          >
            + New
          </button>
        </div>

        {/* Selector */}
        {view === "selector" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-xs text-slate-400 font-medium">
              Select a course to start a conversation.
            </p>
            {availableLoading && (
              <p className="text-xs text-slate-500">Loading your courses…</p>
            )}
            {!availableLoading && availableInstructors.length === 0 && (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm">
                  No enrolled courses found.
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  Enrol in a course to chat with an instructor.
                </p>
              </div>
            )}
            {availableInstructors.map((item) => (
              <button
                key={item.courseId}
                onClick={() => setSelectedCourse(item)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                  selectedCourse?.courseId === item.courseId
                    ? "border-indigo-600 bg-indigo-950/40"
                    : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
                }`}
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.courseTitle}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center text-xl shrink-0">
                    📚
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {item.courseTitle}
                  </p>
                  <p className="text-xs text-indigo-400 truncate">
                    {item.instructor?.name}
                  </p>
                  {item.category && (
                    <p className="text-[10px] text-slate-500">
                      {item.category}
                    </p>
                  )}
                </div>
              </button>
            ))}
            {selectedCourse && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                {selectedCourse.subjects.length > 0 && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">
                      Subject (optional)
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                    >
                      <option value="">— General question —</option>
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition text-sm"
                >
                  Chat with {selectedCourse.instructor?.name}
                </button>
              </div>
            )}
            {conversations.length > 0 && (
              <button
                onClick={() => setView("threads")}
                className="w-full text-xs text-slate-400 hover:text-white border border-slate-800 rounded-xl py-2 transition mt-2"
              >
                View existing conversations ({conversations.length})
              </button>
            )}
          </div>
        )}

        {/* Thread list */}
        {view === "threads" && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversationsLoading && (
              <p className="text-xs text-slate-500 p-3">Loading…</p>
            )}
            {!conversationsLoading && conversations.length === 0 && (
              <p className="text-xs text-slate-500 p-3 text-center">
                No conversations yet.
              </p>
            )}
            {conversations.map((c) => (
              <ThreadItem
                key={c._id}
                conv={c}
                isActive={activeConversation?._id === c._id}
                currentUserId={user?._id}
                onClick={() => openThread(c)}
              />
            ))}
          </div>
        )}

        {/* Chat: keep showing threads panel on desktop */}
        {view === "chat" && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 hidden md:block">
            {conversations.map((c) => (
              <ThreadItem
                key={c._id}
                conv={c}
                isActive={activeConversation?._id === c._id}
                currentUserId={user?._id}
                onClick={() => openThread(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right panel: chat ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${view !== "chat" ? "hidden md:flex" : "flex"}`}
      >
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
            <div className="text-5xl">💬</div>
            <h3 className="text-lg font-bold text-white">
              Ask your instructor
            </h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Select a course on the left and start a private conversation with
              your instructor.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-[#080f1e] shrink-0">
              <button
                onClick={() => setView("threads")}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ChevronLeft size={18} />
              </button>
              {other?.avatarUrl ? (
                <img
                  src={other.avatarUrl}
                  alt={other.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {other?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {other?.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {activeConversation.course?.title || "General"}
                  {activeConversation.subject
                    ? ` · ${activeConversation.subject}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={requestVideoCall}
                  disabled={Boolean(activeCallRequest) || isSubmittingCall}
                  title="Request video call"
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                >
                  <Video size={13} />
                   {isSubmittingCall
                     ? "Sending…"
                     : activeCallRequest
                       ? "Call request sent"
                       : "Video Call"}
                </button>
                {activeCallRequest && (
                  <button
                    onClick={cancelCallRequest}
                    className="text-xs text-slate-300 hover:text-white px-2 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messagesLoading && (
                <p className="text-center text-xs text-slate-500 py-4">
                  Loading messages…
                </p>
              )}
              {messages.map((msg) => (
                <Bubble
                  key={msg._id}
                  msg={msg}
                  isMe={
                    msg.sender?._id?.toString() === user?._id?.toString() ||
                    msg.sender?.toString() === user?._id?.toString()
                  }
                  onDelete={handleDeleteMsg}
                />
              ))}
              {typing?.isTyping && typing.userId !== user?._id?.toString() && (
                <div className="flex justify-start mb-2">
                  <div className="bg-slate-800 rounded-2xl px-4 py-2.5 flex gap-1.5 items-center">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                    <span className="text-xs text-slate-500 ml-1">
                      {typing.name} is typing
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Media previews */}
            {pendingMedia.length > 0 && (
              <div className="flex gap-2 px-4 py-2 border-t border-slate-800 overflow-x-auto shrink-0">
                {pendingMedia.map((pm) => (
                  <div key={pm.id} className="relative shrink-0">
                    {pm.preview ? (
                      <img
                        src={pm.preview}
                        alt="preview"
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Paperclip size={18} className="text-slate-400" />
                      </div>
                    )}
                    <button
                      onClick={() => removePreview(pm.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className="px-4 py-3 border-t border-slate-800 bg-[#080f1e] shrink-0">
              <div className="flex items-end gap-2">
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
                  className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition shrink-0"
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                <textarea
                  value={text}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your question… (Enter to send, Shift+Enter for newline)"
                  rows={1}
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 resize-none max-h-32 overflow-y-auto transition"
                  style={{ minHeight: 42 }}
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    (!text.trim() && pendingMedia.length === 0) ||
                    sending ||
                    uploading
                  }
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shrink-0"
                >
                  {uploading ? (
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
