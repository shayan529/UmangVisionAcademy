import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Download,
  Lock,
  FileImage,
  File,
  Sparkles,
  Eye,
  Search,
  User,
  Calendar,
  Zap,
} from "lucide-react";
import api from "../../config/api";
import { useTranslation } from "react-i18next";
import NoteViewerModal from "../common/NoteViewerModal";

const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed", error);
    window.open(url, "_blank");
  }
};

const getDocViewUrl = (url) => {
  if (!url) return "";
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0] ?? "";
  const isLocal =
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("192.168.");
  if (!isLocal && ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
      url
    )}`;
  }
  return url;
};

const getFileMeta = (url = "") => {
  return {
    icon: FileText,
    label: "PDF",
    color: "#fb7185",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
};

const Skeleton = ({ w = "100%", h = 14, radius = 8, style = {} }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: radius,
      background: "linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%)",
      backgroundSize: "200% 100%",
      animation: "notesShimmer 1.4s infinite",
      ...style,
    }}
  />
);

const NoteCardSkeleton = () => (
  <div className="p-5 bg-[#111827]/80 border border-slate-800/80 rounded-2xl flex flex-col gap-4 shadow-md">
    <div className="flex items-start gap-3">
      <Skeleton w={40} h={40} radius={12} />
      <div className="flex-1 flex flex-col gap-2 pt-0.5">
        <Skeleton w="80%" h={15} />
        <Skeleton w="50%" h={12} />
      </div>
    </div>
    <Skeleton w="100%" h={24} radius={6} />
    <div className="grid grid-cols-2 gap-2 border-t border-slate-800/60 pt-3">
      <Skeleton w="100%" h={36} radius={10} />
      <Skeleton w="100%" h={36} radius={10} />
    </div>
  </div>
);

export default function MobileNotes() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { t, i18n } = useTranslation();
  const requireLogin = !user;
  const [classNotes, setClassNotes] = useState([]);
  const [loadingClassNotes, setLoadingClassNotes] = useState(false);
  const [filterTerm, setFilterTerm] = useState("");
  const [activeModalNote, setActiveModalNote] = useState(null);

  useEffect(() => {
    if (requireLogin) return;
    fetchClassNotes();
  }, [requireLogin]);

  const fetchClassNotes = async () => {
    try {
      setLoadingClassNotes(true);
      const { data } = await api.get("/notes");
      setClassNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch class notes", error);
    } finally {
      setLoadingClassNotes(false);
    }
  };

  const filteredNotes = classNotes.filter((note) => {
    const term = filterTerm.toLowerCase();
    return (
      note.title?.toLowerCase().includes(term) ||
      note.description?.toLowerCase().includes(term) ||
      note.instructorName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="w-full text-slate-100 p-4 md:p-6 lg:p-8 space-y-6">
      <style>{`
        @keyframes notesShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes notesFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .note-card {
          animation: notesFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* ── HEADER & SEARCH (Seamless flow with zero outer gap) ── */}
      <div className="space-y-4">
        {/* Title row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 flex items-center justify-center text-teal-400 border border-teal-500/30 shadow-lg shadow-teal-500/10 shrink-0">
              <BookOpen size={22} className="md:hidden" />
              <BookOpen size={28} className="hidden md:block" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles size={12} />
                {t("studyNotes.eyebrow", "STUDY MATERIALS")}
              </div>
              <h1 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight">
                {t("studyNotes.title", "Class Notes & Resources")}
              </h1>
              <p className="text-xs md:text-sm text-slate-400 font-medium">
                {t("studyNotes.subtitle", "Study materials uploaded by your course instructors.")}
              </p>
            </div>
          </div>

          {!requireLogin && !loadingClassNotes && classNotes.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-teal-300 bg-teal-500/10 border border-teal-500/20 shadow-sm shrink-0">
              <Zap size={14} className="text-amber-400 fill-amber-400" />
              {classNotes.length}{" "}
              {classNotes.length === 1
                ? t("studyNotes.note", "note")
                : t("studyNotes.notes", "notes")}
            </span>
          )}
        </div>

        {/* Search Input */}
        {!requireLogin && (
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder={t(
                "studyNotes.searchPlaceholder",
                "Search notes by title, topic, or instructor name…"
              )}
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 text-xs md:text-sm bg-[#111827]/80 text-slate-100 placeholder-slate-500 border border-slate-800 rounded-2xl focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition shadow-inner"
            />
          </div>
        )}
      </div>

      {/* ── CONTENT GRID ── */}
      <div>
        {requireLogin ? (
          /* LOGIN REQUIRED STATE */
          <div className="flex min-h-[360px] items-center justify-center py-8">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#111827]/90 backdrop-blur-2xl p-8 text-center shadow-2xl space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-lg">
                <Lock size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">
                  {t("studyNotes.loginRequired", "Please Login to Access Class Notes")}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t(
                    "studyNotes.loginRequiredSubtitle",
                    "Sign in with your student account to view and download study materials."
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 px-6 py-3.5 text-xs font-bold text-white transition transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-teal-600/20"
              >
                {t("studyNotes.login", "Login to Account")}
              </button>
            </div>
          </div>
        ) : loadingClassNotes ? (
          /* SKELETON LOADING GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <NoteCardSkeleton key={i} />
            ))}
          </div>
        ) : classNotes.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex min-h-[360px] items-center justify-center py-8">
            <div className="py-12 px-6 text-center border border-dashed border-slate-800 rounded-3xl bg-[#111827]/60 max-w-md w-full space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-md">
                <BookOpen size={26} />
              </div>
              <h3 className="text-sm font-bold text-white">
                {t("studyNotes.emptyTitle", "No Class Notes Available Yet")}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t(
                  "studyNotes.emptySubtitle",
                  "Notes uploaded by your instructors will appear here automatically."
                )}
              </p>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          /* NO SEARCH MATCH */
          <div className="flex min-h-[360px] items-center justify-center py-8">
            <div className="py-12 px-6 text-center border border-dashed border-slate-800 rounded-3xl bg-[#111827]/60 max-w-md w-full space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-md">
                <Search size={26} />
              </div>
              <h3 className="text-sm font-bold text-white">No Notes Match Your Search</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Try searching with a different keyword or clear the search field.
              </p>
            </div>
          </div>
        ) : (
          /* NOTES CARDS GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {filteredNotes.map((note, i) => {
              const meta = getFileMeta(note.fileUrl);
              const FileIcon = meta.icon;

              return (
                <div
                  key={note._id}
                  className="note-card group relative p-5 bg-[#111827]/90 border border-slate-800/90 hover:border-teal-500/40 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between gap-4 overflow-hidden min-h-[250px] h-full"
                  style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}
                >
                  {/* Top Accent Strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                    style={{ background: meta.color }}
                  />

                  <div className="flex-1 flex flex-col space-y-3 pt-1">
                    {/* Header Row: Icon */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <FileIcon size={20} style={{ color: meta.color }} />
                      </div>
                    </div>

                    {/* Note Title */}
                    <h3
                      className="text-sm md:text-base font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-2 leading-snug"
                      title={note.title}
                    >
                      {note.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 min-h-[2rem]">
                      {note.description || ""}
                    </p>
                  </div>

                  {/* Footer Info & Actions */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-teal-400 truncate max-w-[55%]">
                        <User size={12} />
                        {note.instructorName || t("studyNotes.instructor", "Instructor")}
                      </span>

                      <span className="flex items-center gap-1 shrink-0 text-slate-500">
                        <Calendar size={12} />
                        {new Date(note.createdAt).toLocaleDateString(
                          i18n.language === "hi" ? "hi-IN" : "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setActiveModalNote(note)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white transition text-xs font-bold shadow-md shadow-teal-600/20"
                      >
                        <Eye size={14} />
                        {t("studyNotes.view", "View")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NoteViewerModal
        note={activeModalNote}
        isOpen={Boolean(activeModalNote)}
        onClose={() => setActiveModalNote(null)}
      />
    </div>
  );
}