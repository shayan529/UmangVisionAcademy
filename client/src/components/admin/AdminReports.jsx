import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import api, { API_ENDPOINTS } from "../../config/api.js";
import toast from "react-hot-toast";
import {
  Flag,
  ShieldAlert,
  Search,
  MessageSquare,
  User,
  Ban,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  X,
  FileText,
  Clock,
  ShieldCheck,
  GraduationCap,
  Users,
  BookOpen,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Send,
  Download,
  ExternalLink,
  MessageCircle,
  Sparkles,
} from "lucide-react";

// ── Time & Date Helper ────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const initialOf = (name) => name?.trim()?.charAt(0)?.toUpperCase() || "?";

// ── Avatar Component with Fallback ───────────────────────────────────────────
const UserAvatar = ({ user, role, size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-14 h-14 text-base",
  }[size] || "w-11 h-11 text-sm";

  const isInstructor = role === "instructor" || user?.role === "instructor";
  const bgGradient = isInstructor
    ? "from-emerald-600 via-teal-600 to-indigo-700"
    : "from-indigo-600 via-purple-600 to-pink-600";

  return (
    <div
      className={`relative shrink-0 rounded-2xl bg-gradient-to-tr ${bgGradient} p-0.5 shadow-md flex items-center justify-center`}
    >
      <div
        className={`${sizeClasses} rounded-[14px] bg-slate-950 flex items-center justify-center font-black text-white overflow-hidden`}
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name || "User"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <span>{initialOf(user?.name)}</span>
        )}
      </div>
    </div>
  );
};

export default function AdminReports() {
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({
    totalConversations: 0,
    pendingReports: 0,
    blockedChats: 0,
    archivedChats: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // "all" | "reported" | "blocked" | "archived"

  // ── Multi-Level Navigation State ────────────────────────────────────────────
  // Level 1: selectedInstructor = null && selectedConversation = null (Instructors List)
  // Level 2: selectedInstructor !== null && selectedConversation = null (Students List for selected instructor)
  // Level 3: selectedConversation !== null (Full Chat Transcript & Details)
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Level 3 Chat State
  const [activeMessages, setActiveMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Take Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionTargetConv, setActionTargetConv] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [actionType, setActionType] = useState(""); // "suspend_user" | "block_student" | "unblock_student" | "resolve" | "dismiss" | "delete_chat"
  const [actionReason, setActionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // ── Fetch Conversations & Stats ─────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(API_ENDPOINTS.INSTRUCTOR_CHAT.ADMIN_REPORTS);
      setConversations(data.reports ?? []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch admin conversations:", err);
      toast.error(err.response?.data?.message || "Failed to load chat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Load Messages for Level 3 ───────────────────────────────────────────────
  const loadConversationMessages = useCallback(async (convId) => {
    setLoadingMessages(true);
    try {
      const { data } = await api.get(
        API_ENDPOINTS.INSTRUCTOR_CHAT.ADMIN_REPORT_MESSAGES(convId),
      );
      setSelectedConversation(data.conversation);
      setActiveMessages(data.messages ?? []);
    } catch (err) {
      console.error("Failed to load chat messages:", err);
      toast.error("Failed to load full chat transcript");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    loadConversationMessages(conv._id);
  };

  useEffect(() => {
    if (selectedConversation && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages, selectedConversation]);

  // ── Open Action Modal ───────────────────────────────────────────────────────
  const openActionModal = (conv, type, userToTarget = null) => {
    setActionTargetConv(conv);
    setActionType(type);
    setTargetUser(userToTarget);
    setActionReason("");
    setActionModalOpen(true);
  };

  // ── Submit Action ───────────────────────────────────────────────────────────
  const submitAdminAction = async () => {
    if (!actionTargetConv || submittingAction) return;
    setSubmittingAction(true);

    try {
      const { data } = await api.post(
        API_ENDPOINTS.INSTRUCTOR_CHAT.ADMIN_REPORT_ACTION(actionTargetConv._id),
        {
          action: actionType,
          targetUserId: targetUser?._id,
          notes: actionReason,
        },
      );

      toast.success(data.message || "Action processed successfully");
      setActionModalOpen(false);
      fetchConversations();

      if (selectedConversation?._id === actionTargetConv._id) {
        if (actionType === "delete_chat") {
          setSelectedConversation(null);
        } else {
          loadConversationMessages(actionTargetConv._id);
        }
      }
    } catch (err) {
      console.error("Failed to execute admin action:", err);
      toast.error(err.response?.data?.message || "Failed to process action");
    } finally {
      setSubmittingAction(false);
    }
  };

  // ── Group Conversations by Instructor (Level 1) ─────────────────────────────
  const instructorsList = useMemo(() => {
    const map = new Map();

    conversations.forEach((conv) => {
      const inst = conv.instructor;
      const instId = inst?._id?.toString() || "unknown";

      if (!map.has(instId)) {
        map.set(instId, {
          instructor: inst || { name: "Unknown Instructor", email: "—" },
          conversations: [],
          studentIds: new Set(),
          courses: new Set(),
          subjects: new Set(),
          totalMessages: 0,
          reportedCount: 0,
          blockedCount: 0,
          lastActivity: conv.updatedAt || conv.createdAt,
        });
      }

      const entry = map.get(instId);
      entry.conversations.push(conv);
      if (conv.student?._id) entry.studentIds.add(conv.student._id.toString());
      if (conv.course?.title) entry.courses.add(conv.course.title);
      if (conv.subject) entry.subjects.add(conv.subject);
      entry.totalMessages += conv.messagesCount || 0;
      if (conv.isReported) entry.reportedCount++;
      if (conv.isBlocked) entry.blockedCount++;

      const convDate = new Date(conv.updatedAt || conv.createdAt);
      if (convDate > new Date(entry.lastActivity)) {
        entry.lastActivity = conv.updatedAt || conv.createdAt;
      }
    });

    let list = Array.from(map.values()).map((item) => ({
      ...item,
      studentsCount: item.studentIds.size,
      coursesList: Array.from(item.courses),
      subjectsList: Array.from(item.subjects),
    }));

    if (filterTab === "reported") {
      list = list.filter((item) => item.reportedCount > 0);
    } else if (filterTab === "blocked") {
      list = list.filter((item) => item.blockedCount > 0);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((item) => {
        const name = item.instructor?.name?.toLowerCase() || "";
        const email = item.instructor?.email?.toLowerCase() || "";
        const subjects = item.subjectsList.join(" ").toLowerCase();
        const courses = item.coursesList.join(" ").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          subjects.includes(q) ||
          courses.includes(q)
        );
      });
    }

    return list.sort(
      (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity),
    );
  }, [conversations, filterTab, search]);

  // ── Conversations for Selected Instructor (Level 2) ─────────────────────────
  const instructorStudentChats = useMemo(() => {
    if (!selectedInstructor) return [];

    const instId = selectedInstructor._id?.toString();
    let chats = conversations.filter(
      (c) => c.instructor?._id?.toString() === instId,
    );

    if (filterTab === "reported") {
      chats = chats.filter((c) => c.isReported);
    } else if (filterTab === "blocked") {
      chats = chats.filter((c) => c.isBlocked);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      chats = chats.filter((c) => {
        const studentName = c.student?.name?.toLowerCase() || "";
        const studentEmail = c.student?.email?.toLowerCase() || "";
        const courseTitle = c.course?.title?.toLowerCase() || "";
        const subject = c.subject?.toLowerCase() || "";
        const lastMsg = c.lastMessage?.text?.toLowerCase() || "";
        return (
          studentName.includes(q) ||
          studentEmail.includes(q) ||
          courseTitle.includes(q) ||
          subject.includes(q) ||
          lastMsg.includes(q)
        );
      });
    }

    return chats.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt),
    );
  }, [conversations, selectedInstructor, filterTab, search]);

  // ── Global Stats Counts ─────────────────────────────────────────────────────
  const totalInstructorsCount = useMemo(() => {
    const set = new Set(
      conversations.map((c) => c.instructor?._id?.toString()).filter(Boolean),
    );
    return set.size;
  }, [conversations]);

  const totalStudentsCount = useMemo(() => {
    const set = new Set(
      conversations.map((c) => c.student?._id?.toString()).filter(Boolean),
    );
    return set.size;
  }, [conversations]);

  return (
    <div className="space-y-6 text-slate-100 pb-16">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <MessageSquare size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Student-Instructor Chat Monitor & Moderation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect all real-time conversations, course subjects, message logs, and moderation status.
            </p>
          </div>
        </div>
        <button
          onClick={fetchConversations}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition border border-slate-700 shadow-sm cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Chats</span>
        </button>
      </div>

      {/* ── Top Stats Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Instructors
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {totalInstructorsCount}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Students Active
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {totalStudentsCount}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <MessageCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Threads
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {conversations.length}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Flag size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Flagged Reports
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {stats.pendingReports}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5 col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Ban size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Blocked Chats
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {stats.blockedChats}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb & Interactive Navigation Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900/70 px-5 py-3.5 rounded-2xl border border-slate-800">
        <nav className="flex items-center gap-2 text-xs font-semibold overflow-x-auto py-1">
          <button
            onClick={() => {
              setSelectedInstructor(null);
              setSelectedConversation(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              !selectedInstructor
                ? "bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <GraduationCap size={15} />
            <span>All Instructors</span>
          </button>

          {selectedInstructor && (
            <>
              <ChevronRight size={14} className="text-slate-600 shrink-0" />
              <button
                onClick={() => setSelectedConversation(null)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                  selectedInstructor && !selectedConversation
                    ? "bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <User size={14} />
                <span className="max-w-[150px] sm:max-w-none truncate">
                  {selectedInstructor.name}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                  {instructorStudentChats.length}
                </span>
              </button>
            </>
          )}

          {selectedConversation && (
            <>
              <ChevronRight size={14} className="text-slate-600 shrink-0" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600/30 text-teal-300 font-bold border border-teal-500/40">
                <MessageSquare size={14} />
                <span className="max-w-[150px] sm:max-w-none truncate">
                  Chat with {selectedConversation.student?.name || "Student"}
                </span>
              </div>
            </>
          )}
        </nav>

        {/* Back Button */}
        {(selectedInstructor || selectedConversation) && (
          <button
            onClick={() => {
              if (selectedConversation) {
                setSelectedConversation(null);
              } else if (selectedInstructor) {
                setSelectedInstructor(null);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
          >
            <ArrowLeft size={14} />
            <span>
              Back to {selectedConversation ? "Students" : "Instructors"}
            </span>
          </button>
        )}
      </div>

      {/* ── Controls (Search + Filter Tabs) ── */}
      {!selectedConversation && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterTab === "all"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All {selectedInstructor ? "Chats" : "Instructors"} (
              {selectedInstructor
                ? conversations.filter(
                    (c) =>
                      c.instructor?._id?.toString() ===
                      selectedInstructor._id?.toString(),
                  ).length
                : totalInstructorsCount}
              )
            </button>
            <button
              onClick={() => setFilterTab("reported")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === "reported"
                  ? "bg-rose-600 text-white shadow-md"
                  : "text-rose-400 hover:bg-rose-500/10"
              }`}
            >
              <Flag size={12} />
              <span>Flagged Reports</span>
            </button>
            <button
              onClick={() => setFilterTab("blocked")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === "blocked"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-amber-400 hover:bg-amber-500/10"
              }`}
            >
              <Ban size={12} />
              <span>Blocked</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] sm:w-80">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder={
                selectedInstructor
                  ? "Search student, subject, course..."
                  : "Search instructor, subject, course..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          LEVEL 1: INSTRUCTORS DIRECTORY VIEW
         ─────────────────────────────────────────────────────────────────────────── */}
      {!selectedInstructor && !selectedConversation && (
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
              <RefreshCw
                size={32}
                className="animate-spin text-indigo-500 mb-3"
              />
              <p className="text-sm text-slate-400 font-semibold">
                Loading instructor chat records...
              </p>
            </div>
          ) : instructorsList.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800/80 p-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">
                No Chat Records Found
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {search
                  ? "No instructors match your current search query. Try clearing your search."
                  : "No conversations have been initiated yet between students and instructors."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {instructorsList.map((item) => (
                <div
                  key={item.instructor?._id || Math.random()}
                  onClick={() => setSelectedInstructor(item.instructor)}
                  className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-5 shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-indigo-500/10 hover:-translate-y-0.5"
                >
                  {/* Instructor Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={item.instructor} role="instructor" size="md" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors truncate">
                          {item.instructor?.name || "Unknown Instructor"}
                        </h4>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <Mail size={12} className="text-slate-500" />
                          <span>{item.instructor?.email || "—"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Report / Block Badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {item.reportedCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          <Flag size={10} />
                          <span>{item.reportedCount} Reported</span>
                        </span>
                      )}
                      {item.blockedCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                          <Ban size={10} />
                          <span>{item.blockedCount} Blocked</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Courses & Subjects Tags */}
                  <div className="space-y-2 text-xs bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                    {item.coursesList.length > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <BookOpen size={13} className="text-indigo-400 shrink-0" />
                        <span className="truncate font-medium">
                          {item.coursesList.slice(0, 2).join(", ")}
                          {item.coursesList.length > 2 &&
                            ` +${item.coursesList.length - 2} more`}
                        </span>
                      </div>
                    )}
                    {item.subjectsList.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.subjectsList.slice(0, 3).map((sub, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Stats & Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-3 text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-300">
                        <Users size={13} className="text-teal-400" />
                        <span>{item.studentsCount} Students</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={13} className="text-indigo-400" />
                        <span>{item.totalMessages} msgs</span>
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-transform group-hover:translate-x-1">
                      <span>View Chats</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          LEVEL 2: STUDENTS / CHATS FOR SELECTED INSTRUCTOR
         ─────────────────────────────────────────────────────────────────────────── */}
      {selectedInstructor && !selectedConversation && (
        <div className="space-y-4">
          {/* Selected Instructor Profile Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 rounded-3xl border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <UserAvatar user={selectedInstructor} role="instructor" size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">
                    {selectedInstructor.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                    Instructor
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-slate-500" />
                    <span>{selectedInstructor.email || "—"}</span>
                  </span>
                  {selectedInstructor.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-slate-500" />
                      <span>{selectedInstructor.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 text-xs text-slate-300 font-semibold self-start sm:self-auto">
              <MessageSquare size={14} className="text-indigo-400" />
              <span>{instructorStudentChats.length} Total Conversations</span>
            </div>
          </div>

          {/* Students Conversations List */}
          {instructorStudentChats.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800 p-8 space-y-2">
              <p className="text-sm text-slate-400 font-medium">
                No student chat threads match the search criteria for this instructor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {instructorStudentChats.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-5 shadow-lg transition-all duration-300 cursor-pointer space-y-3.5 hover:shadow-teal-500/10 hover:-translate-y-0.5"
                >
                  {/* Student & Status Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={conv.student} role="student" size="md" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm group-hover:text-teal-300 transition-colors truncate">
                          {conv.student?.name || "Student"}
                        </h4>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <Mail size={12} className="text-slate-500" />
                          <span>{conv.student?.email || "—"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {conv.isReported && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Flag size={10} />
                          <span>Reported</span>
                        </span>
                      )}
                      {conv.isBlocked ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Ban size={10} />
                          <span>Blocked</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Course & Subject Selected Context */}
                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <BookOpen size={13} className="text-indigo-400 shrink-0" />
                      <span className="font-bold text-white truncate">
                        {conv.course?.title || "Direct Student Inquiry"}
                      </span>
                    </div>

                    {conv.subject && (
                      <div className="flex items-center gap-1.5 text-xs text-teal-300">
                        <span className="font-semibold text-slate-400 text-[11px]">
                          Topic / Subject:
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 font-bold text-[11px]">
                          {conv.subject}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Last Message Snippet */}
                  {conv.lastMessage?.text && (
                    <div className="text-xs text-slate-400 bg-slate-800/40 px-3 py-2 rounded-xl flex items-start gap-2">
                      <MessageSquare size={13} className="text-slate-500 mt-0.5 shrink-0" />
                      <p className="line-clamp-1 italic">
                        "{conv.lastMessage.text}"
                      </p>
                    </div>
                  )}

                  {/* Footer Details */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock size={12} className="text-slate-500" />
                      <span>{fmtDate(conv.updatedAt || conv.createdAt)}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 group-hover:text-teal-300">
                      <span>Open Chat</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          LEVEL 3: FULL CHAT VIEW & CONVERSATION INSPECTOR
         ─────────────────────────────────────────────────────────────────────────── */}
      {selectedConversation && (
        <div className="space-y-4">
          {/* Top Conversation Overview Banner */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 shadow-2xl space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Back to student list"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-white">
                      {selectedConversation.course?.title || "Direct Student Inquiry"}
                    </h3>
                    {selectedConversation.subject && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold">
                        Subject: {selectedConversation.subject}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Started: {fmtDate(selectedConversation.createdAt)}</span>
                    <span>•</span>
                    <span>Last Activity: {fmtDate(selectedConversation.updatedAt)}</span>
                  </p>
                </div>
              </div>

              {/* Moderation Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedConversation.isReported ? (
                  <>
                    <button
                      onClick={() =>
                        openActionModal(selectedConversation, "resolve")
                      }
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 size={14} />
                      <span>Resolve Report</span>
                    </button>
                    <button
                      onClick={() =>
                        openActionModal(selectedConversation, "dismiss")
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                    >
                      <XCircle size={14} />
                      <span>Dismiss</span>
                    </button>
                  </>
                ) : null}

                {selectedConversation.isBlocked ? (
                  <button
                    onClick={() =>
                      openActionModal(selectedConversation, "unblock_student")
                    }
                    className="px-3 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <CheckCircle2 size={14} />
                    <span>Unblock Chat</span>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      openActionModal(selectedConversation, "block_student")
                    }
                    className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Ban size={14} />
                    <span>Block Student</span>
                  </button>
                )}

                <button
                  onClick={() =>
                    openActionModal(selectedConversation, "delete_chat")
                  }
                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Trash2 size={14} />
                  <span>Delete Thread</span>
                </button>

                <button
                  onClick={() =>
                    loadConversationMessages(selectedConversation._id)
                  }
                  disabled={loadingMessages}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  title="Refresh messages"
                >
                  <RefreshCw
                    size={15}
                    className={loadingMessages ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            {/* Participants Summary Info Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Student Card */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={selectedConversation.student} role="student" size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {selectedConversation.student?.name}
                      </span>
                      <span className="px-2 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        Student
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {selectedConversation.student?.email || "—"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    openActionModal(
                      selectedConversation,
                      "suspend_user",
                      selectedConversation.student,
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-bold transition shrink-0"
                >
                  {selectedConversation.student?.isSuspended
                    ? "Unsuspend"
                    : "Suspend Student"}
                </button>
              </div>

              {/* Instructor Card */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={selectedConversation.instructor} role="instructor" size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {selectedConversation.instructor?.name}
                      </span>
                      <span className="px-2 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        Instructor
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {selectedConversation.instructor?.email || "—"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    openActionModal(
                      selectedConversation,
                      "suspend_user",
                      selectedConversation.instructor,
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-bold transition shrink-0"
                >
                  {selectedConversation.instructor?.isSuspended
                    ? "Unsuspend"
                    : "Suspend Instructor"}
                </button>
              </div>
            </div>
          </div>

          {/* Report Alert Banner if Flagged */}
          {selectedConversation.isReported && (
            <div className="bg-rose-950/40 border border-rose-500/40 p-4 rounded-2xl flex items-start gap-3 text-xs text-rose-200">
              <ShieldAlert size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-300">
                  Report Reason: {selectedConversation.reportReason || "Policy Violation"}
                </span>
                {selectedConversation.reportDetails && (
                  <p className="text-rose-300/80 mt-1">
                    "{selectedConversation.reportDetails}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages Transcript Box */}
          <div className="bg-[#0b101b] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
            <div className="text-center py-2 text-[11px] text-slate-500 border-b border-white/5 font-semibold">
              ── Message History Begins ──
            </div>

            {loadingMessages ? (
              <div className="text-center py-16 text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                <p className="text-xs">Loading message transcript...</p>
              </div>
            ) : activeMessages.length === 0 ? (
              <div className="text-center py-16 text-slate-500 space-y-1">
                <MessageSquare size={28} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">No messages in this chat</p>
                <p className="text-xs">The conversation was initialized without message exchanges.</p>
              </div>
            ) : (
              activeMessages.map((msg, idx) => {
                const isStudent = msg.senderRole === "student";
                const senderName =
                  msg.sender?.name || (isStudent ? "Student" : "Instructor");

                return (
                  <div
                    key={msg._id || idx}
                    className={`flex gap-3 ${
                      isStudent ? "justify-start" : "justify-end"
                    }`}
                  >
                    {isStudent && (
                      <UserAvatar user={msg.sender || selectedConversation.student} role="student" size="sm" />
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm space-y-1.5 shadow-md ${
                        isStudent
                          ? "bg-slate-900 border border-indigo-500/30 text-slate-100 rounded-tl-none"
                          : "bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border border-emerald-500/40 text-slate-100 rounded-tr-none"
                      }`}
                    >
                      {/* Message Header */}
                      <div className="flex items-center justify-between gap-3 text-[11px] pb-1 border-b border-white/5">
                        <span className="font-bold flex items-center gap-1">
                          <span
                            className={
                              isStudent ? "text-indigo-400" : "text-emerald-400"
                            }
                          >
                            {senderName}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">
                            ({msg.senderRole})
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {fmtDate(msg.createdAt)}
                        </span>
                      </div>

                      {/* Message Content */}
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {msg.deleted ? (
                          <span className="italic text-slate-500">
                            [This message was deleted by user]
                          </span>
                        ) : (
                          msg.text
                        )}
                      </p>

                      {/* Media Attachments */}
                      {msg.media && msg.media.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          {msg.media.map((med, mIdx) => (
                            <a
                              key={mIdx}
                              href={med.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-slate-200 text-xs font-semibold transition"
                            >
                              <FileText size={13} className="text-indigo-400" />
                              <span className="max-w-[140px] truncate">
                                {med.filename || "Attachment"}
                              </span>
                              <ExternalLink size={11} className="text-slate-400" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {!isStudent && (
                      <UserAvatar
                        user={msg.sender || selectedConversation.instructor}
                        role="instructor"
                        size="sm"
                      />
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          TAKE ACTION CONFIRMATION MODAL
         ─────────────────────────────────────────────────────────────────────────── */}
      {actionModalOpen && actionTargetConv && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold">
                <AlertTriangle size={20} />
                <h3 className="text-base text-white">Confirm Admin Action</h3>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {actionType === "delete_chat" &&
                "Are you sure you want to permanently delete this chat conversation? All message records will be purged."}
              {actionType === "block_student" &&
                `Are you sure you want to block ${actionTargetConv.student?.name || "this student"} from sending messages in this chat thread?`}
              {actionType === "unblock_student" &&
                `Unblock ${actionTargetConv.student?.name || "this student"} so they can resume messaging the instructor?`}
              {actionType === "suspend_user" &&
                `Are you sure you want to ${targetUser?.isSuspended ? "unsuspend" : "suspend"} the account for ${targetUser?.name || "this user"}?`}
              {actionType === "resolve" &&
                "Mark this report as resolved and keep the chat active?"}
              {actionType === "dismiss" &&
                "Dismiss this report? The flag will be cleared."}
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Moderation Notes / Reason (Optional):
              </label>
              <textarea
                rows={2}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter details for the audit log..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAdminAction}
                disabled={submittingAction}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition shadow-lg shadow-rose-600/30"
              >
                {submittingAction ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
