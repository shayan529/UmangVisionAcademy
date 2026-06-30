import { useState, useEffect } from "react";
import { Plus, Trash2, BookOpen, Save, FileText } from "lucide-react";

export default function MobileNotes() {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("student_study_notes");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeNote, setActiveNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    localStorage.setItem("student_study_notes", JSON.stringify(notes));
  }, [notes]);

  const handleCreateNote = () => {
    const newNote = {
      id: Date.now(),
      title: "New Note",
      content: "",
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setTitle(newNote.title);
    setContent(newNote.content);
  };

  const handleSaveNote = () => {
    if (!activeNote) return;
    const updated = notes.map((note) => {
      if (note.id === activeNote.id) {
        return { ...note, title: title || "Untitled Note", content };
      }
      return note;
    });
    setNotes(updated);
    setActiveNote(null);
    setTitle("");
    setContent("");
  };

  const handleDeleteNote = (id, e) => {
    e.stopPropagation();
    setNotes(notes.filter((note) => note.id !== id));
    if (activeNote?.id === id) {
      setActiveNote(null);
      setTitle("");
      setContent("");
    }
  };

  const handleSelectNote = (note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  return (
    <div className="max-w-md mx-auto h-[calc(100vh-140px)] flex flex-col bg-slate-950/30 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/30">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Study Notes</h3>
            <p className="text-[10px] text-slate-500 font-medium">Jot down key points while studying</p>
          </div>
        </div>
        {!activeNote && (
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/10"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>

      {/* Editor or List */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeNote ? (
          <div className="flex flex-col h-full gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title..."
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2.5 px-3.5 text-sm text-white font-bold placeholder-slate-500 transition duration-150"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your study notes here..."
              className="w-full flex-1 min-h-[200px] bg-slate-900/40 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-3 px-4 text-xs text-slate-200 placeholder-slate-500 resize-none transition duration-150"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setActiveNote(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10"
              >
                <Save size={14} />
                Save Note
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className="p-3.5 bg-slate-900/35 border border-slate-800/80 rounded-2xl hover:border-slate-700/60 transition cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{note.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {note.content || "Empty note"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[9px] font-bold text-slate-600">{note.date}</span>
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {notes.length === 0 && (
              <div className="py-16 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-950/10">
                <FileText size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No study notes yet</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Click the "Add" button to write your first note.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
