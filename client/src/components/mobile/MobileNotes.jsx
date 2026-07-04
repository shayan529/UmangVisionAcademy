import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, Download, Plus } from "lucide-react";
import api from "../../config/api";

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
        w-full mx-auto flex flex-col bg-slate-950/30 border border-slate-900
        rounded-2xl overflow-hidden shadow-2xl
        max-w-md h-[calc(100vh-140px)]
        md:max-w-5xl md:h-[calc(100vh-180px)]
      "
    >
      {/* Header */}
      <div className="flex flex-col border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="flex items-center justify-between p-4 md:px-6 md:py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/30">
              <BookOpen size={20} className="md:hidden" />
              <BookOpen size={24} className="hidden md:block" />
            </div>
            <div>
              <h3 className="text-sm md:text-lg font-extrabold text-white">
                Class Notes
              </h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">
                Study materials from instructors
              </p>
            </div>
          </div>
          {!requireLogin && !loadingClassNotes && classNotes.length > 0 && (
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
              {classNotes.length} note{classNotes.length === 1 ? "" : "s"}
            </span>
          )}
          {/* Commented out the Add button to add new notes from student side
          <button
            onClick={() => {}}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/10"
          >
            <Plus size={14} />
            Add
          </button>
          */}
        </div>
      </div>

      {/* Editor or List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {requireLogin ? (
          <div className="flex h-full items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center shadow-2xl">
              <div className="mb-3 text-4xl">🔐</div>
              <h3 className="text-sm font-extrabold text-white">
                Please login to view notes
              </h3>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                Sign in to access your class notes and study materials.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-[11px] font-bold text-white transition hover:bg-indigo-500"
              >
                Login
              </button>
            </div>
          </div>
        ) : loadingClassNotes ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400">
              Loading class notes...
            </p>
          </div>
        ) : classNotes.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-950/10">
            <BookOpen size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400">
              No class notes available
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Notes uploaded by your instructors will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {classNotes.map((note) => (
              <div
                key={note._id}
                className="p-3.5 md:p-4 bg-slate-900/35 border border-slate-800/80 rounded-2xl hover:border-slate-700/60 transition flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-200">
                      {note.title}
                    </h4>
                    <p className="text-[11px] text-indigo-300 font-medium mt-0.5">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}