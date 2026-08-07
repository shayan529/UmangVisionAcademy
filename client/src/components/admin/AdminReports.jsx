import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  RefreshCw,
  X,
  FileText,
  Clock,
  ShieldCheck,
  GraduationCap,
  Users,
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

// ── Main AdminReports Component ───────────────────────────────────────────────
export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("pending"); // "pending" | "all" | "blocked" | "resolved"
  const [search, setSearch] = useState("");

  // Inspect Transcript Modal State
  const [activeReport, setActiveReport] = useState(null);
  const [transcriptMessages, setTranscriptMessages] = useState([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);

  // Take Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null); // student or instructor user object
  const [actionType, setActionType] = useState(""); // "suspend_user" | "block_student" | "unblock_student" | "resolve" | "dismiss" | "delete_chat"
  const [actionReason, setActionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // ── Fetch Reports ───────────────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        API_ENDPOINTS.INSTRUCTOR_CHAT.ADMIN_REPORTS,
      );
      setReports(data.reports ?? []);
    } catch (err) {
      console.error("Failed to fetch admin reports:", err);
      toast.error(err.response?.data?.message || "Failed to load chat reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Open Transcript Modal ───────────────────────────────────────────────────
  const openTranscript = async (report) => {
    setActiveReport(report);
    setTranscriptModalOpen(true);
    setLoadingTranscript(true);
    try {
      const { data } = await api.get(
        API_ENDPOINTS.INSTRUCTOR_CHAT.ADMIN_REPORT_MESSAGES(report._id),
      );
      setTranscriptMessages(data.messages ?? []);
    } catch (err) {
      console.error("Failed to fetch report transcript:", err);
      toast.error("Failed to load chat transcript");
    } finally {
      setLoadingTranscript(false);
    }
  };

  // ── Open Action Modal ───────────────────────────────────────────────────────
  const openActionModal = (report, type, userToTarget = null) => {
    setActiveReport(report);
    setActionType(type);
    setTargetUser(userToTarget);
    setActionReason("");
    setActionModalOpen(true);
  };

  // ── Submit Admin Action ─────────────────────────────────────────────────────
  const submitAdminAction = async () => {
    if (!activeReport || submittingAction) return;
    setSubmittingAction(true);

    try {
      const { data } = await api.post(
        API_ENDPOINTS.INSTRUCTOR_CHAT.ADMIN_REPORT_ACTION(activeReport._id),
        {
          action: actionType,
          targetUserId: targetUser?._id,
          notes: actionReason,
        },
      );

      toast.success(data.message || "Action processed successfully");
      setActionModalOpen(false);
      fetchReports();
      if (actionType === "delete_chat") {
        setTranscriptModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to execute admin action:", err);
      toast.error(err.response?.data?.message || "Failed to process action");
    } finally {
      setSubmittingAction(false);
    }
  };

  // ── Derived Stats ───────────────────────────────────────────────────────────
  const pendingCount = useMemo(
    () => reports.filter((r) => r.isReported).length,
    [reports],
  );
  const blockedCount = useMemo(
    () => reports.filter((r) => r.isBlocked).length,
    [reports],
  );
  const suspendedCount = useMemo(
    () =>
      reports.filter(
        (r) => r.student?.isSuspended || r.instructor?.isSuspended,
      ).length,
    [reports],
  );

  // ── Filtered Reports List ──────────────────────────────────────────────────
  const visibleReports = useMemo(() => {
    return reports.filter((r) => {
      if (filterTab === "pending" && !r.isReported) return false;
      if (filterTab === "blocked" && !r.isBlocked) return false;
      if (filterTab === "resolved" && r.isReported) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const studentName = r.student?.name?.toLowerCase() ?? "";
        const instructorName = r.instructor?.name?.toLowerCase() ?? "";
        const courseTitle = r.course?.title?.toLowerCase() ?? "";
        const reason = r.reportReason?.toLowerCase() ?? "";
        return (
          studentName.includes(q) ||
          instructorName.includes(q) ||
          courseTitle.includes(q) ||
          reason.includes(q)
        );
      }
      return true;
    });
  }, [reports, filterTab, search]);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header & Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Chat Reports & Moderation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage reported student queries, block chats, and suspend offending accounts.
            </p>
          </div>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition border border-slate-700 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Flag size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pending Reports
            </span>
            <h3 className="text-2xl font-black text-white mt-0.5">
              {pendingCount}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Ban size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Blocked Chats
            </span>
            <h3 className="text-2xl font-black text-white mt-0.5">
              {blockedCount}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Suspended Accounts
            </span>
            <h3 className="text-2xl font-black text-white mt-0.5">
              {suspendedCount}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <MessageSquare size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Moderated
            </span>
            <h3 className="text-2xl font-black text-white mt-0.5">
              {reports.length}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-3xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: "pending", label: `Pending Review (${pendingCount})` },
            { id: "blocked", label: `Blocked Chats (${blockedCount})` },
            { id: "resolved", label: "Resolved / Dismissed" },
            { id: "all", label: `All Moderated (${reports.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterTab === tab.id
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report, student, course…"
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-rose-500 transition-all placeholder:text-slate-500"
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
      </div>

      {/* Reports List Table / Grid */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading moderation reports…</p>
          </div>
        ) : visibleReports.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-14 h-14 rounded-full bg-slate-800/60 flex items-center justify-center text-rose-400 mx-auto mb-3 border border-slate-700/60">
              <ShieldCheck size={28} />
            </div>
            <h4 className="text-base font-bold text-white">No reports found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              There are currently no reported or flagged student chats matching your criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {visibleReports.map((report) => (
              <div
                key={report._id}
                className="p-5 hover:bg-slate-800/30 transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Student & Instructor info */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Student Card */}
                    <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                      {report.student?.avatarUrl ? (
                        <img
                          src={report.student.avatarUrl}
                          alt={report.student.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-900/60 text-indigo-300 font-bold text-xs flex items-center justify-center">
                          {initialOf(report.student?.name)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {report.student?.name || "Student"}
                          </span>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                            Student
                          </span>
                          {report.student?.isSuspended && (
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-bold">
                              Suspended
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {report.student?.email || "No email"}
                        </span>
                      </div>
                    </div>

                    <span className="text-slate-600 font-bold hidden md:inline">
                      ↔
                    </span>

                    {/* Instructor Card */}
                    <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                      {report.instructor?.avatarUrl ? (
                        <img
                          src={report.instructor.avatarUrl}
                          alt={report.instructor.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-500/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-violet-900/60 text-violet-300 font-bold text-xs flex items-center justify-center">
                          {initialOf(report.instructor?.name)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {report.instructor?.name || "Instructor"}
                          </span>
                          <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.2 rounded font-semibold">
                            Instructor
                          </span>
                          {report.instructor?.isSuspended && (
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-bold">
                              Suspended
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {report.instructor?.email || "No email"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges & Date */}
                  <div className="flex flex-wrap items-center gap-2">
                    {report.isReported && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/60 border border-rose-500/40 px-3 py-1 rounded-full">
                        <Flag size={12} /> Pending Review
                      </span>
                    )}
                    {report.isBlocked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-full">
                        <Ban size={12} /> Chat Blocked
                      </span>
                    )}
                    {!report.isReported && !report.isBlocked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Resolved
                      </span>
                    )}
                  </div>
                </div>

                {/* Report Reason & Content Summary */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Reason: {report.reportReason || "Not specified"}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> Reported: {fmtDate(report.reportedAt || report.updatedAt)}
                    </span>
                  </div>

                  {report.reportDetails && (
                    <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      "{report.reportDetails}"
                    </p>
                  )}

                  {report.course?.title && (
                    <div className="text-[11px] text-slate-400">
                      Course Context: <span className="text-indigo-300 font-semibold">{report.course.title}</span>
                      {report.subject ? ` · Subject: ${report.subject}` : ""}
                    </div>
                  )}
                </div>

                {/* Action Buttons Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => openTranscript(report)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl transition border border-slate-700"
                  >
                    <Eye size={14} className="text-indigo-400" />
                    <span>Inspect Chat Transcript</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Block/Unblock Chat */}
                    <button
                      onClick={() =>
                        openActionModal(
                          report,
                          report.isBlocked ? "unblock_student" : "block_student",
                        )
                      }
                      className={`text-xs font-bold px-3 py-2 rounded-xl transition border flex items-center gap-1.5 ${
                        report.isBlocked
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60"
                          : "bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/60"
                      }`}
                    >
                      <Ban size={13} />
                      <span>{report.isBlocked ? "Unblock Chat" : "Block Chat"}</span>
                    </button>

                    {/* Suspend/Unsuspend Student */}
                    <button
                      onClick={() =>
                        openActionModal(report, "suspend_user", report.student)
                      }
                      className={`text-xs font-bold px-3 py-2 rounded-xl transition border flex items-center gap-1.5 ${
                        report.student?.isSuspended
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60"
                          : "bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/60"
                      }`}
                    >
                      <User size={13} />
                      <span>
                        {report.student?.isSuspended
                          ? "Unsuspend Student"
                          : "Suspend Student"}
                      </span>
                    </button>

                    {/* Suspend/Unsuspend Instructor */}
                    <button
                      onClick={() =>
                        openActionModal(
                          report,
                          "suspend_user",
                          report.instructor,
                        )
                      }
                      className={`text-xs font-bold px-3 py-2 rounded-xl transition border flex items-center gap-1.5 ${
                        report.instructor?.isSuspended
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60"
                          : "bg-purple-950/40 text-purple-300 border-purple-500/40 hover:bg-purple-900/60"
                      }`}
                    >
                      <GraduationCap size={13} />
                      <span>
                        {report.instructor?.isSuspended
                          ? "Unsuspend Instructor"
                          : "Suspend Instructor"}
                      </span>
                    </button>

                    {/* Resolve */}
                    {report.isReported && (
                      <button
                        onClick={() => openActionModal(report, "resolve")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={13} />
                        <span>Resolve Report</span>
                      </button>
                    )}

                    {/* Dismiss */}
                    {report.isReported && (
                      <button
                        onClick={() => openActionModal(report, "dismiss")}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition border border-slate-700"
                      >
                        Dismiss
                      </button>
                    )}

                    {/* Delete Chat */}
                    <button
                      onClick={() => openActionModal(report, "delete_chat")}
                      className="p-2 text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 rounded-xl transition"
                      title="Delete Chat Permanently"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal 1: Inspect Chat Transcript ── */}
      {transcriptModalOpen && activeReport && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 uva-msg-in">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-slate-800 bg-[#090e1a] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#070b14]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Chat Transcript Log
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activeReport.student?.name} ↔ {activeReport.instructor?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTranscriptModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Transcript Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 uva-chat-scroll bg-[#070b14]">
              {loadingTranscript ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transcriptMessages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-12">
                  No messages found in this conversation thread.
                </p>
              ) : (
                transcriptMessages.map((msg) => {
                  const isStudentMsg = msg.senderRole === "student";
                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${
                        isStudentMsg ? "items-start" : "items-end"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-bold text-slate-200">
                          {msg.sender?.name || (isStudentMsg ? "Student" : "Instructor")}
                        </span>
                        <span>({msg.senderRole})</span>
                        <span>·</span>
                        <span>{fmtDate(msg.createdAt)}</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                          isStudentMsg
                            ? "bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tl-xs"
                            : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-xs shadow-sm"
                        }`}
                      >
                        {msg.text}
                        {(msg.media ?? []).map((m, i) => (
                          <div key={i} className="mt-2">
                            {m.mimeType?.startsWith("image/") ? (
                              <img
                                src={m.url}
                                alt="attachment"
                                className="max-w-[200px] max-h-[160px] rounded-xl object-cover border border-slate-700"
                              />
                            ) : (
                              <a
                                href={m.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] underline text-indigo-300"
                              >
                                📎 {m.filename || "Attachment"}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#070b14] flex justify-end gap-2">
              <button
                onClick={() => setTranscriptModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Admin Action Confirmation ── */}
      {actionModalOpen && activeReport && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 uva-msg-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white capitalize">
                    {actionType.replace("_", " ")}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {targetUser
                      ? `Target User: ${targetUser.name} (${targetUser.role || "User"})`
                      : `Chat ID: ${activeReport._id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-4 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              {actionType === "suspend_user"
                ? `Are you sure you want to ${
                    targetUser?.isSuspended ? "unsuspend" : "suspend"
                  } ${targetUser?.name}? ${
                    !targetUser?.isSuspended
                      ? "The user will be locked out of platform access."
                      : "The user will regain account access."
                  }`
                : actionType === "block_student"
                ? "Block student from sending messages in this specific chat thread?"
                : actionType === "unblock_student"
                ? "Unblock student to allow normal chat messaging?"
                : actionType === "delete_chat"
                ? "Permanently delete this entire conversation thread and history?"
                : actionType === "resolve"
                ? "Mark this report as resolved?"
                : "Dismiss this report?"}
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Admin Reason / Notes (Optional)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter admin justification notes…"
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 outline-none focus:border-rose-500"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitAdminAction}
                disabled={submittingAction}
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-3 text-xs font-bold text-white transition disabled:opacity-60 shadow-md flex items-center justify-center gap-2"
              >
                {submittingAction ? "Executing Action…" : "Confirm Action"}
              </button>
              <button
                onClick={() => setActionModalOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
