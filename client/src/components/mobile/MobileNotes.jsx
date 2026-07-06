import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, Download, Lock, FileImage, File } from "lucide-react";
import api from "../../config/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getFileMeta = (url = "") => {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0] ?? "";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return { icon: FileImage, label: ext.toUpperCase(), color: "#22d3ee" };
  }
  if (ext === "pdf") {
    return { icon: FileText, label: "PDF", color: "#f472b6" };
  }
  if (["doc", "docx"].includes(ext)) {
    return { icon: FileText, label: "DOC", color: "#818cf8" };
  }
  if (["ppt", "pptx"].includes(ext)) {
    return { icon: FileText, label: "PPT", color: "#fb923c" };
  }
  return { icon: File, label: "FILE", color: "#a78bfa" };
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
  <div className="p-3.5 md:p-4 bg-slate-900/40 border border-slate-800/70 rounded-2xl flex flex-col gap-3">
    <div className="flex items-start gap-3">
      <Skeleton w={40} h={40} radius={12} />
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
  const requireLogin = !user;
  const [classNotes, setClassNotes] = useState([]);
  const [loadingClassNotes, setLoadingClassNotes] = useState(false);

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

  return (
    <div
      className="
        w-full flex flex-col bg-slate-950/30 border border-slate-900
        rounded-2xl overflow-hidden shadow-2xl
        h-[calc(100vh-140px)]
        md:h-[calc(100vh-180px)]
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
          background: rgba(15, 23, 42, 0.55);
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="flex items-center justify-between p-4 md:px-6 md:py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-500/25 to-purple-500/10 flex items-center justify-center text-indigo-300 border border-indigo-500/30">
              <BookOpen size={20} className="md:hidden" />
              <BookOpen size={24} className="hidden md:block" />
            </div>
            <div>
              <h3 className="text-sm md:text-lg font-extrabold text-white tracking-tight">
                Class Notes
              </h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">
                Study materials from your instructors
              </p>
            </div>
          </div>
          {!requireLogin && !loadingClassNotes && classNotes.length > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 whitespace-nowrap">
              {classNotes.length} note{classNotes.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {/* Editor or List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {requireLogin ? (
          <div className="flex h-full items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/80 p-7 text-center shadow-2xl">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300">
                <Lock size={22} />
              </div>
              <h3 className="text-sm font-extrabold text-white">
                Please login to view notes
              </h3>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                Sign in to access your class notes and study materials.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-[11px] font-bold text-white transition hover:brightness-110 shadow-lg shadow-indigo-500/20"
              >
                Login
              </button>
            </div>
          </div>
        ) : loadingClassNotes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {[...Array(8)].map((_, i) => (
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
                No class notes yet
              </p>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Notes uploaded by your instructors will show up here as soon as they're posted.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {classNotes.map((note, i) => {
              const meta = getFileMeta(note.fileUrl);
              const FileIcon = meta.icon;
              return (
                <div
                  key={note._id}
                  className="note-card p-3.5 md:p-4 bg-slate-900/35 border border-slate-800/80 rounded-2xl hover:border-slate-700/60 flex flex-col gap-3"
                  style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${meta.color}18`,
                        color: meta.color,
                      }}
                    >
                      <FileIcon size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-200 truncate">
                          {note.title}
                        </h4>
                        <span
                          className="text-[9px] font-extrabold px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{
                            background: `${meta.color}18`,
                            color: meta.color,
                          }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-300 font-medium mt-0.5 truncate">
                        By {note.instructorName || "Instructor"}
                      </p>
                      {note.description && (
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                          {note.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 border-t border-slate-800/50 pt-3">
                    <span className="text-[10px] font-bold text-slate-500">
                      {new Date(note.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition text-[11px] font-bold"
                    >
                      <Download size={14} />
                      View File
                    </a>
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