import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, Download, Lock, FileImage, File, Sparkles, Eye, Search } from "lucide-react";
import api from "../../config/api";
import { useTranslation } from "react-i18next";

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
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1") || url.includes("192.168.");
  if (!isLocal && ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
  }
  return url;
};

const getFileMeta = (url = "") => {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0] ?? "";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return { icon: FileImage, label: ext.toUpperCase(), color: "#2dd4bf" };
  }
  if (ext === "pdf") {
    return { icon: FileText, label: "PDF", color: "#fb7185" };
  }
  if (["doc", "docx"].includes(ext)) {
    return { icon: FileText, label: "DOC", color: "#a78bfa" };
  }
  if (["ppt", "pptx"].includes(ext)) {
    return { icon: FileText, label: "PPT", color: "#fbbf24" };
  }
  return { icon: File, label: "FILE", color: "#38bdf8" };
};

const Skeleton = ({ w = "100%", h = 14, radius = 6, style = {} }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: radius,
      background: "linear-gradient(90deg,#1e293b 25%,#263348 50%,#1e293b 75%)",
      backgroundSize: "200% 100%",
      animation: "notesShimmer 1.4s infinite",
      ...style,
    }}
  />
);

const NoteCardSkeleton = () => (
  <div className="p-4 bg-slate-900/40 border border-slate-800/70 rounded-xl flex flex-col gap-3">
    <div className="flex items-start gap-3">
      <Skeleton w={4} h={40} radius={4} />
      <div className="flex-1 flex flex-col gap-2 pt-0.5">
        <Skeleton w="70%" h={13} />
        <Skeleton w="45%" h={11} />
      </div>
    </div>
    <div className="flex items-center justify-between border-t border-slate-800/50 pt-3">
      <Skeleton w={70} h={10} />
      <Skeleton w={84} h={26} radius={8} />
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
    <div
      className="
        w-full flex flex-col bg-slate-950/30 border border-slate-900
        rounded-2xl overflow-hidden shadow-2xl
        h-[calc(100vh-140px)]
        md:h-screen md:rounded-none md:border-0 md:shadow-none
      "
    >
      <style>{`
        @keyframes notesShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes notesFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .note-card {
          animation: notesFadeUp 0.3s ease both;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }
        .note-card:hover {
          transform: translateY(-2px);
          background: rgba(15, 23, 42, 0.6);
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-950 to-teal-950/30 backdrop-blur">
        {/* Title row */}
        <div className="flex items-center justify-between p-4 md:px-10 md:pt-6 md:pb-3">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-teal-500/25 to-violet-500/10 flex items-center justify-center text-teal-300 border border-teal-500/30">
              <BookOpen size={20} className="md:hidden" />
              <BookOpen size={26} className="hidden md:block" />
            </div>
            <div>
              <h3 className="text-sm md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {t("studyNotes.title", "Class Notes")}
                <Sparkles size={14} className="hidden md:inline text-teal-400" />
              </h3>
              <p className="text-[10px] md:text-sm text-slate-500 font-medium">
                {t("studyNotes.subtitle", "Study materials from your instructors")}
              </p>
            </div>
          </div>
          {!requireLogin && !loadingClassNotes && classNotes.length > 0 && (
            <span className="inline-flex items-center px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[11px] md:text-xs font-bold text-teal-300 bg-teal-500/10 border border-teal-500/20 whitespace-nowrap">
              {classNotes.length} {classNotes.length === 1 ? t("studyNotes.note", "note") : t("studyNotes.notes", "notes")}
            </span>
          )}
        </div>

        {/* Search bar row — full width on all screen sizes */}
        {!requireLogin && (
          <div className="px-4 pb-4 md:px-10 md:pb-5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder={t("studyNotes.searchPlaceholder", "Search by title, description or instructor…")}
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-sm bg-slate-900/60 text-white placeholder-slate-500 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/50 transition"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10">
        {requireLogin ? (
          <div className="flex h-full items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/80 p-7 text-center shadow-2xl">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-300">
                <Lock size={22} />
              </div>
              <h3 className="text-sm font-extrabold text-white">
                {t("studyNotes.loginRequired", "Please login to view notes")}
              </h3>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                {t("studyNotes.loginRequiredSubtitle", "Sign in to access your class notes and study materials.")}
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-violet-600 px-5 py-2.5 text-[11px] font-bold text-white transition hover:brightness-110 shadow-lg shadow-teal-500/20"
              >
                {t("studyNotes.login", "Login")}
              </button>
            </div>
          </div>
        ) : loadingClassNotes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-5">
            {[...Array(10)].map((_, i) => (
              <NoteCardSkeleton key={i} />
            ))}
          </div>
        ) : classNotes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="py-16 px-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20 max-w-md w-full">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <BookOpen size={24} />
              </div>
              <p className="text-xs font-bold text-slate-300">
                {t("studyNotes.emptyTitle", "No class notes yet")}
              </p>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                {t("studyNotes.emptySubtitle", "Notes uploaded by your instructors will show up here as soon as they're posted.")}
              </p>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="py-16 px-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20 max-w-md w-full">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <Search size={24} />
              </div>
              <p className="text-xs font-bold text-slate-300">No notes match your search</p>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Try a different keyword or clear the search.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-5">
            {filteredNotes.map((note, i) => {
              const meta = getFileMeta(note.fileUrl);
              const FileIcon = meta.icon;
              return (
                <div
                  key={note._id}
                  className="note-card relative p-4 pl-5 bg-slate-900/35 border border-slate-800/80 rounded-xl hover:border-slate-700/60 flex flex-col gap-3 overflow-hidden"
                  style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}
                >
                  {/* Left accent bar */}
                  <span
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ background: meta.color }}
                  />

                  <div className="flex items-start gap-3">
                    <FileIcon size={20} style={{ color: meta.color }} className="flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-200 break-words" title={note.title}>
                          {note.title}
                        </h4>
                        <span
                          className="text-[9px] font-extrabold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                          style={{
                            background: `${meta.color}18`,
                            color: meta.color,
                          }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-medium text-slate-400">
                        <span className="text-teal-300 font-semibold truncate">
                          {note.instructorName || t("studyNotes.instructor", "Instructor")}
                        </span>
                        <span className="text-slate-600 flex-shrink-0">•</span>
                        <span className="flex-shrink-0">
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
                      {note.description && (
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed line-clamp-2">
                          {note.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800/50">
                    <a
                      href={getDocViewUrl(note.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition text-xs font-bold border border-slate-700/40"
                    >
                      <Eye size={13} />
                      {t("studyNotes.view", "View")}
                    </a>
                    <button
                      onClick={() => {
                        const ext = note.fileUrl.split(".").pop() || "pdf";
                        downloadFile(note.fileUrl, `${note.title}.${ext}`);
                      }}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300 transition text-xs font-bold border border-teal-500/10"
                    >
                      <Download size={13} />
                      {t("studyNotes.download", "Download")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}