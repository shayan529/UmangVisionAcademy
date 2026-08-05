import { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";

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
                ? "bg-violet-600 text-white rounded-br-sm"
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
          className={`text-[10px] mt-0.5 ${isMe ? "text-right text-violet-300" : "text-slate-500"}`}
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
  const student = conv.student;
  const unread = conv.instructorUnread ?? 0;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
        isActive
          ? "bg-violet-950/50 border border-violet-800/40"
          : "hover:bg-slate-800/60"
      }`}
    >
      <div className="relative shrink-0">
        {student?.avatarUrl ? (
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            {student?.name?.charAt(0)?.toUpperCase() || "S"}
          </div>
        )}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
            {unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white truncate">
            {student?.name}
          </span>
          <span className="text-[10px] text-slate-500 shrink-0">
            {conv.lastMessage?.at ? fmtDate(conv.lastMessage.at) : ""}
          </span>
        </div>
        {conv.course?.title && (
          <span className="text-[10px] text-violet-400 font-medium truncate block">
            {conv.course.title}
          </span>
        )}
        {conv.subject && (
          <span className="text-[10px] text-slate-500 truncate block">
            📂 {conv.subject}
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

// ── Student info panel ────────────────────────────────────────────────────────
const StudentInfo = ({ conv }) => {
  const student = conv?.student;
  if (!student) return null;
  return (
    <div className="border-l border-slate-800 w-[200px] shrink-0 hidden xl:flex flex-col bg-[#080f1e] p-4 gap-4 overflow-y-auto">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Student
      </h4>
      {student.avatarUrl ? (
        <img
          src={student.avatarUrl}
          alt={student.name}
          className="w-14 h-14 rounded-full object-cover mx-auto"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xl mx-auto">
          {student.name?.charAt(0)?.toUpperCase() || "S"}
        </div>
      )}
      <div className="text-center">
        <p className="text-sm font-bold text-white">{student.name}</p>
        {student.email && (
          <p className="text-[11px] text-slate-500 mt-0.5 break-all">
            {student.email}
          </p>
        )}
      </div>
      {conv.course && (
        <div className="bg-slate-800/60 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <BookOpen size={11} />
            <span className="font-semibold uppercase tracking-wide">
              Course
            </span>
          </div>
          <p className="text-xs text-white font-medium leading-snug">
            {conv.course.title}
          </p>
          {conv.subject && (
            <p className="text-[10px] text-violet-400 font-semibold">
              📂 {conv.subject}
            </p>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-auto">
        <User size={11} />
        <span>Student</span>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
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
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const [mobileView, setMobileView] = useState("list"); // "list" | "chat"
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [callStarting, setCallStarting] = useState(false);

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

  // ── Scroll ────────────────────────────────────────────────────────────────
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

      // ── Incoming video call request from student ──────────────────────────
      s.on("webrtc:call-request", ({ request }) => {
        if (!request) return;
        setPendingRequests((prev) => [
          request,
          ...prev.filter((r) => r._id !== request._id),
        ]);
      });
      // If student cancelled before instructor responded
      s.on("webrtc:call-decline", ({ requestId }) => {
        setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      });

      socketRef.current = s;
    },
    [token, dispatch],
  );

  // ── Start / decline video call ───────────────────────────────────────────
  // Instructor approves the student's request and initiates the call.
  // The instructor fetches a session ID, then emits webrtc:call-initiated
  // to the student (who sees a ringing screen), then opens the call page.
  const acceptCall = async (request) => {
    if (!request) return;
    setCallStarting(true);
    try {
      const { data } = await api.put(
        API_ENDPOINTS.INSTRUCTOR_CHAT.CALL_REQUEST_APPROVE(request._id),
        {},
      );
      setPendingRequests((prev) => prev.filter((r) => r._id !== request._id));
      const sessionId = data.sessionId;
      window.open(`/video-call/${sessionId}`, "_blank", "noopener,noreferrer");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Could not approve video call";
      if (showToast) {
        showToast(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setCallStarting(false);
    }
  };

  const declineCall = async (request) => {
    if (!request) return;
    try {
      await api.put(
        API_ENDPOINTS.INSTRUCTOR_CHAT.CALL_REQUEST_REJECT(request._id),
        {
          response: "Instructor declined the request",
        },
      );
      setPendingRequests((prev) => prev.filter((r) => r._id !== request._id));
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Could not decline call request";
      if (showToast) {
        showToast(msg);
      } else {
        toast.error(msg);
      }
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
  const visibleConvs = conversations.filter((c) => {
    if (filter === "unread") return (c.instructorUnread ?? 0) > 0;
    return true;
  });

  const totalUnread = conversations.reduce(
    (n, c) => n + (c.instructorUnread ?? 0),
    0,
  );
  const student = activeConversation?.student;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-80px)] max-h-[820px] bg-[#0b1120] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
      {/* ── Left: thread list ── */}
      <div
        className={`flex flex-col w-full md:w-[300px] md:min-w-[260px] border-r border-slate-800 bg-[#080f1e] shrink-0 ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">Student Queries</h2>
            {totalUnread > 0 && (
              <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {totalUnread} new
              </span>
            )}
          </div>
          {/* Filter tabs */}
          <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl">
            {["all", "unread"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition capitalize ${
                  filter === f
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f === "unread"
                  ? `Unread${totalUnread > 0 ? ` (${totalUnread})` : ""}`
                  : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {requestsLoading && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-200">
              Loading pending call requests…
            </div>
          )}
          {pendingRequests.length > 0 && (
            <div className="space-y-2 mb-2 rounded-2xl border border-emerald-500/20 bg-emerald-950/25 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                    Pending call requests
                  </p>
                  <p className="text-sm text-white font-semibold">
                    {pendingRequests.length} waiting
                  </p>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-600/20 text-emerald-200">
                  Review
                </span>
              </div>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request._id}
                    className="w-full text-left rounded-2xl border border-slate-800 bg-slate-900/80 p-3 hover:border-emerald-500/40 transition"
                  >
                    <p className="text-sm font-semibold text-white">
                      {request.student?.name || "Student"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {request.conversation?.subject ||
                        request.message ||
                        "Video call request"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {request.course?.title
                        ? `${request.course.title} • `
                        : ""}
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => acceptCall(request)}
                        disabled={callStarting}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                      >
                        {callStarting ? "Starting…" : "Approve"}
                      </button>
                      <button
                        onClick={() => declineCall(request)}
                        disabled={callStarting}
                        className="flex-1 border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 disabled:opacity-60 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {conversationsLoading && (
            <p className="text-xs text-slate-500 p-3">Loading…</p>
          )}
          {!conversationsLoading && visibleConvs.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-400 text-sm font-semibold">
                {filter === "unread"
                  ? "No unread queries"
                  : "No student queries yet"}
              </p>
              <p className="text-slate-600 text-xs mt-1">
                Queries from your students will appear here.
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

      {/* ── Right: chat ── */}
      <div
        className={`flex-1 flex min-w-0 ${mobileView !== "chat" ? "hidden md:flex" : "flex"}`}
      >
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
            <div className="text-5xl">💬</div>
            <h3 className="text-lg font-bold text-white">Student Queries</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Select a conversation on the left to view and reply to your
              student's questions.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 min-w-0">
            {/* Chat column */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-[#080f1e] shrink-0">
                <button
                  onClick={() => setMobileView("list")}
                  className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                {student?.avatarUrl ? (
                  <img
                    src={student.avatarUrl}
                    alt={student.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {student?.name?.charAt(0)?.toUpperCase() || "S"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {student?.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {activeConversation.course?.title || "General"}
                    {activeConversation.subject
                      ? ` · ${activeConversation.subject}`
                      : ""}
                  </p>
                </div>
                <button
                  onClick={handleArchive}
                  title="Archive conversation"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition"
                >
                  <Archive size={15} />
                </button>
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
                {typing?.isTyping &&
                  typing.userId !== user?._id?.toString() && (
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
                    className="p-2.5 rounded-xl text-slate-400 hover:text-violet-400 hover:bg-slate-800 transition shrink-0"
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
                        sendReply();
                      }
                    }}
                    placeholder="Type your reply… (Enter to send)"
                    rows={1}
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 resize-none max-h-32 overflow-y-auto transition"
                    style={{ minHeight: 42 }}
                  />
                  <button
                    onClick={sendReply}
                    disabled={
                      (!text.trim() && pendingMedia.length === 0) ||
                      sending ||
                      uploading
                    }
                    className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shrink-0"
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Student info sidebar */}
            <StudentInfo conv={activeConversation} />
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorStudentQueries;
