import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  FileImage,
  File,
  Layers,
  Lock,
  Sparkles,
  Eye,
  Search,
  User,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import api from "../../config/api";
import { useTranslation } from "react-i18next";
import NoteViewerModal from "../common/NoteViewerModal";

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

// File type → icon/label/accent, actually read from the URL extension.
const getFileMeta = (url = "") => {
  const ext = (url.split(".").pop() || "").toLowerCase().split("?")[0];
  if (["doc", "docx"].includes(ext)) return { icon: FileText, label: "DOC", color: "#5B8DEF" };
  if (["ppt", "pptx"].includes(ext)) return { icon: Layers, label: "PPT", color: "#F2994A" };
  if (["xls", "xlsx"].includes(ext)) return { icon: FileText, label: "XLS", color: "#4CAF7D" };
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext))
    return { icon: FileImage, label: "IMG", color: "#9B6BFF" };
  if (ext === "pdf") return { icon: FileText, label: "PDF", color: "#2dd4bf" };
  return { icon: File, label: ext ? ext.toUpperCase() : "FILE", color: "#8B93A7" };
};

// Every subject gets its own colour + short call-number code, the way a
// library catalog colour-codes its shelves. This is the page's signature.
const SUBJECT_STYLES = {
  physics: { accent: "#5B8DEF", code: "PHY" },
  chemistry: { accent: "#F2994A", code: "CHE" },
  mathematics: { accent: "#9B6BFF", code: "MAT" },
  biology: { accent: "#4CAF7D", code: "BIO" },
  botany: { accent: "#4CAF7D", code: "BOT" },
  zoology: { accent: "#4CAF7D", code: "ZOO" },
  english: { accent: "#E85D75", code: "ENG" },
  hindi: { accent: "#F5A623", code: "HIN" },
  computer: { accent: "#29C5F6", code: "CS" },
  social: { accent: "#D48166", code: "SST" },
  history: { accent: "#D48166", code: "HIS" },
  geography: { accent: "#D48166", code: "GEO" },
  civics: { accent: "#D48166", code: "CIV" },
  accounts: { accent: "#C9A227", code: "ACC" },
  economics: { accent: "#3FB6A8", code: "ECO" },
  gst: { accent: "#C9A227", code: "GST" },
  science: { accent: "#4CAF7D", code: "SCI" },
  general: { accent: "#8B93A7", code: "GEN" },
};

const getSubjectStyle = (subjectName = "") => {
  const key = subjectName.toLowerCase().replace(/\s+/g, "");
  const foundKey = Object.keys(SUBJECT_STYLES).find((k) => key.includes(k));
  if (foundKey) return SUBJECT_STYLES[foundKey];
  return { accent: "#8B93A7", code: (subjectName.slice(0, 3) || "GEN").toUpperCase() };
};

const Skeleton = ({ w = "100%", h = 14, radius = 8, style = {} }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: radius,
      background: "linear-gradient(90deg,#1a2129 25%,#232c37 50%,#1a2129 75%)",
      backgroundSize: "200% 100%",
      animation: "notesShimmer 1.4s infinite",
      ...style,
    }}
  />
);

const NoteCardSkeleton = () => (
  <div className="p-5 bg-[#10151c] border border-white/[0.06] rounded-2xl flex flex-col gap-4 shadow-md">
    <div className="flex items-start justify-between gap-3">
      <Skeleton w={38} h={38} radius={10} />
      <Skeleton w={54} h={18} radius={999} />
    </div>
    <Skeleton w="85%" h={16} />
    <Skeleton w="55%" h={12} />
    <div className="border-t border-dashed border-white/10 pt-3 flex flex-col gap-2">
      <Skeleton w="100%" h={12} />
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
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [sortBy, setSortBy] = useState("title");
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

  const extractSubject = (note) => {
    if (note.courseTitle) return note.courseTitle;
    const title = note.title || "";
    const match = title.match(
      /(Chemistry|Physics|Maths|Mathematics|Biology|English|Hindi|Science|Computer|Social|Accounts|Economics|GST|History|Geography|Civics|Botany|Zoology)/i
    );
    if (match) {
      const found = match[1];
      if (/math/i.test(found)) return "Mathematics";
      return found.charAt(0).toUpperCase() + found.slice(1).toLowerCase();
    }
    return "General Study";
  };

  const subjectTabs = useMemo(() => {
    const counts = { All: classNotes.length };
    classNotes.forEach((note) => {
      const subj = extractSubject(note);
      counts[subj] = (counts[subj] || 0) + 1;
    });
    return Object.keys(counts).map((subj) => ({
      name: subj,
      count: counts[subj],
    }));
  }, [classNotes]);

  const processedNotes = useMemo(() => {
    let result = classNotes.filter((note) => {
      const term = filterTerm.toLowerCase();
      const matchesTerm =
        note.title?.toLowerCase().includes(term) ||
        note.description?.toLowerCase().includes(term) ||
        note.instructorName?.toLowerCase().includes(term);

      const subj = extractSubject(note);
      const matchesSubject =
        selectedSubject === "All" || subj.toLowerCase() === selectedSubject.toLowerCase();

      return matchesTerm && matchesSubject;
    });

    const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

    result.sort((a, b) => {
      if (sortBy === "sequential") {
        const subjA = extractSubject(a);
        const subjB = extractSubject(b);
        const subjCompare = naturalCollator.compare(subjA, subjB);
        if (subjCompare !== 0) return subjCompare;
        return naturalCollator.compare(a.title || "", b.title || "");
      }
      if (sortBy === "title") {
        return naturalCollator.compare(a.title || "", b.title || "");
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }, [classNotes, filterTerm, selectedSubject, sortBy]);

  const SORT_OPTIONS = [
    { value: "title", label: "A–Z" },
    { value: "sequential", label: "By subject" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
  ];

  return (
    <div
      className="w-full text-slate-100 p-4 md:p-6 lg:p-8 space-y-6"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

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
        .note-card:hover {
          transform: translateY(-3px) rotate(-0.25deg);
        }
        .stamp {
          transform: rotate(-3deg);
        }
        .font-display {
          font-family: 'Fraunces', ui-serif, Georgia, serif;
        }
        .font-mono-catalog {
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
        }
        @media (prefers-reduced-motion: reduce) {
          .note-card, .note-card:hover, [style*="notesShimmer"] {
            animation: none !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* ── HEADER & SEARCH ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 flex items-center justify-center text-teal-400 border border-teal-500/30 shadow-lg shadow-teal-500/10 shrink-0">
              <BookOpen size={22} className="md:hidden" />
              <BookOpen size={28} className="hidden md:block" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-mono-catalog font-semibold uppercase tracking-[0.15em] mb-1.5">
                <Sparkles size={11} />
                {t("studyNotes.eyebrow", "NOTES ARCHIVE")}
              </div>
              <h1 className="font-display text-2xl md:text-4xl font-semibold text-white tracking-tight leading-tight">
                {t("studyNotes.title", "Class Notes & Resources")}
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                {t("studyNotes.subtitle", "Study materials uploaded by your course instructors.")}
              </p>
            </div>
          </div>

          {!requireLogin && !loadingClassNotes && classNotes.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono-catalog font-semibold text-teal-300 bg-teal-500/10 border border-teal-500/20 shadow-sm shrink-0">
              {String(classNotes.length).padStart(2, "0")}{" "}
              {classNotes.length === 1
                ? t("studyNotes.note", "note")
                : t("studyNotes.notes", "notes")}
            </span>
          )}
        </div>

        {!requireLogin && (
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                placeholder={t(
                  "studyNotes.searchPlaceholder",
                  "Search the archive — title, topic, or instructor…"
                )}
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 text-xs md:text-sm bg-[#10151c] text-slate-100 placeholder-slate-500 border border-white/[0.08] rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50 focus:border-teal-500/60 transition shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2 bg-[#10151c] border border-white/[0.08] rounded-2xl p-1.5 shrink-0 overflow-x-auto scrollbar-none">
              <ArrowUpDown size={14} className="text-teal-400 shrink-0 ml-1.5" />
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50 ${sortBy === opt.value
                      ? "bg-teal-500/15 text-teal-300"
                      : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!requireLogin && classNotes.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {subjectTabs.map((tab) => {
              const style = getSubjectStyle(tab.name === "All" ? "" : tab.name);
              const isActive = selectedSubject === tab.name;
              return (
                <button
                  key={tab.name}
                  onClick={() => setSelectedSubject(tab.name)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border-t-2 rounded-b-lg rounded-t-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
                  style={{
                    borderTopColor: tab.name === "All" ? "#2dd4bf" : style.accent,
                    backgroundColor: isActive
                      ? `${tab.name === "All" ? "#2dd4bf" : style.accent}1a`
                      : "rgba(255,255,255,0.03)",
                    color: isActive
                      ? tab.name === "All"
                        ? "#5eead4"
                        : style.accent
                      : "#94a3b8",
                  }}
                >
                  <span>{tab.name}</span>
                  <span
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-mono-catalog font-semibold"
                    style={{
                      backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div>
        {requireLogin ? (
          <div className="flex min-h-[360px] items-center justify-center py-8">
            <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#10151c] backdrop-blur-2xl p-8 text-center shadow-2xl space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-lg">
                <Lock size={26} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-semibold text-white">
                  {t("studyNotes.loginRequired", "Sign in to open the archive")}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t(
                    "studyNotes.loginRequiredSubtitle",
                    "Log in with your student account to view study materials."
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 px-6 py-3.5 text-xs font-bold text-white transition transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-teal-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10151c]"
              >
                {t("studyNotes.login", "Log in")}
              </button>
            </div>
          </div>
        ) : loadingClassNotes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <NoteCardSkeleton key={i} />
            ))}
          </div>
        ) : classNotes.length === 0 ? (
          <div className="flex min-h-[360px] items-center justify-center py-8">
            <div className="py-12 px-6 text-center border border-dashed border-white/10 rounded-3xl bg-[#10151c]/60 max-w-md w-full space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-500 shadow-md">
                <BookOpen size={24} />
              </div>
              <h3 className="font-display text-sm font-semibold text-white">
                {t("studyNotes.emptyTitle", "The archive is empty for now")}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t(
                  "studyNotes.emptySubtitle",
                  "Notes your instructors upload will appear here automatically."
                )}
              </p>
            </div>
          </div>
        ) : processedNotes.length === 0 ? (
          <div className="flex min-h-[360px] items-center justify-center py-8">
            <div className="py-12 px-6 text-center border border-dashed border-white/10 rounded-3xl bg-[#10151c]/60 max-w-md w-full space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-500 shadow-md">
                <Search size={24} />
              </div>
              <h3 className="font-display text-sm font-semibold text-white">
                Nothing matches that search
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Try another subject tab, or clear the search box to see everything.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {processedNotes.map((note, i) => {
              const meta = getFileMeta(note.fileUrl);
              const FileIcon = meta.icon;
              const subjectName = extractSubject(note);
              const subjectStyle = getSubjectStyle(subjectName);
              const callNumber = `${subjectStyle.code}–${String(i + 1).padStart(3, "0")}`;
              const dateLabel = new Date(note.createdAt).toLocaleDateString(
                i18n.language === "hi" ? "hi-IN" : "en-IN",
                { day: "numeric", month: "short", year: "numeric" }
              );

              return (
                <div
                  key={note._id}
                  className="note-card group relative bg-[#10151c] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl shadow-xl transition-all duration-300 flex flex-col overflow-hidden min-h-[260px] h-full"
                  style={{
                    animationDelay: `${Math.min(i, 10) * 0.04}s`,
                    borderTop: `3px solid ${subjectStyle.accent}`,
                  }}
                >
                  <div className="flex-1 flex flex-col gap-3 p-5 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform"
                      >
                        <FileIcon size={19} style={{ color: meta.color }} />
                      </div>
                      <span
                        className="font-mono-catalog px-2 py-1 rounded-md text-[10px] font-semibold tracking-wide border shrink-0"
                        style={{
                          color: subjectStyle.accent,
                          borderColor: `${subjectStyle.accent}40`,
                          backgroundColor: `${subjectStyle.accent}14`,
                        }}
                        title={subjectName}
                      >
                        {callNumber}
                      </span>
                    </div>

                    <h3
                      className="text-sm md:text-base font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-2 leading-snug"
                      title={note.title}
                    >
                      {note.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 min-h-[2rem]">
                      {note.description || ""}
                    </p>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-dashed border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span
                        className="flex items-center gap-1 font-semibold text-slate-300 flex-1 min-w-0"
                        title={note.instructorName || t("studyNotes.instructor", "Instructor")}
                      >
                        <User size={12} className="text-slate-500 shrink-0" />
                        <span className="truncate">
                          {note.instructorName || t("studyNotes.instructor", "Instructor")}
                        </span>
                      </span>
                      <span className="stamp font-mono-catalog flex items-center gap-1 shrink-0 text-slate-500 border border-white/10 rounded px-1.5 py-0.5">
                        <Calendar size={11} />
                        {dateLabel}
                      </span>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setActiveModalNote(note)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white transition text-xs font-bold shadow-md shadow-teal-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10151c]"
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