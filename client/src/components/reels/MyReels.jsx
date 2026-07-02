import React, { useEffect, useState, useMemo } from "react";
import {
  Film,
  Play,
  Plus,
  Clock,
  Check,
  X,
  Eye,
  Heart,
  CalendarDays,
  Inbox,
} from "lucide-react";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * INTEGRATION NOTE
 * This file runs on local mock state so it renders as a live preview.
 * To drop it into your app:
 *
 * 1. Restore real data fetching in fetchMine — marked "REAL API" below,
 *    matches your original fetch() call exactly (same endpoint, same
 *    credentials: "include").
 * 2. Re-add `const { user } = useSelector((s) => s.auth);` if you use it
 *    elsewhere (kept out here since this preview has no redux store).
 * 3. Swap the inline <UploadModal> below for your real
 *    `import InstructorUploadReel from "../instructor/InstructorUploadReel"`
 *    — it's stubbed here only because that file isn't available in this
 *    preview sandbox. Same onClose(...) contract, so it's a drop-in swap.
 * ─────────────────────────────────────────────────────────────────────────
 */

const MOCK_REELS = [
  {
    _id: "r5e944",
    title: "SN1 vs SN2 in Under a Minute",
    status: "approved",
    thumbnail: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=400&q=60",
    videoUrl: "",
    views: 860,
    likes: 51,
    createdAt: "2026-06-29T10:15:00Z",
  },
  {
    _id: "r2b710",
    title: "Quick Derivative Trick for Exams",
    status: "approved",
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=60",
    videoUrl: "",
    views: 1240,
    likes: 88,
    createdAt: "2026-06-24T08:40:00Z",
  },
  {
    _id: "r1a9f3",
    title: "5-Minute Warm-up Before Every Lecture",
    status: "pending",
    thumbnail: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&q=60",
    videoUrl: "",
    views: 0,
    likes: 0,
    createdAt: "2026-07-01T18:05:00Z",
  },
  {
    _id: "r4d833",
    title: "Fiscal Policy Explained with Coffee",
    status: "rejected",
    rejectedReason: "Audio is out of sync for the first 10 seconds — please re-upload.",
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=60",
    videoUrl: "",
    views: 0,
    likes: 0,
    createdAt: "2026-06-18T14:22:00Z",
  },
];

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const UploadModal = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) return alert("Select a video file first");
    setUploading(true);
    await new Promise((r) => setTimeout(r, 600));
    setUploading(false);
    onClose();
  };

  return (
    <div className="myr-modal-overlay">
      <div className="myr-glass myr-modal rounded-2xl p-5 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-lg">Upload Reel</h3>
          <button onClick={onClose} className="myr-close">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="myr-input w-full p-2.5 rounded-lg text-sm"
          />
          <label className="myr-file-drop flex flex-col items-center justify-center gap-2 rounded-lg p-5 text-xs cursor-pointer">
            <Film size={20} style={{ color: "#93C5FD" }} />
            <span style={{ color: "#9CA3D4" }}>{file ? file.name : "Choose a video file"}</span>
            <input type="file" accept="video/*" onChange={handleFile} className="hidden" />
          </label>
          {previewUrl && (
            <video src={previewUrl} controls className="w-full rounded-lg" />
          )}
          <div className="flex gap-2.5 justify-end pt-1">
            <button onClick={onClose} className="myr-tab px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="myr-badge-btn px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide text-white"
            >
              {uploading ? "Uploading…" : "Submit for review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyReels = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  const fetchMine = async () => {
    setLoading(true);
    // REAL API:
    // const res = await fetch(`/api/reels?mine=1`, { credentials: "include" });
    // if (!res.ok) throw new Error("Failed");
    // const data = await res.json();
    // setReels(data);
    await new Promise((r) => setTimeout(r, 500));
    setReels(MOCK_REELS);
    setLoading(false);
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const stats = useMemo(
    () => ({
      total: reels.length,
      approved: reels.filter((r) => r.status === "approved").length,
      views: reels.reduce((sum, r) => sum + (r.views || 0), 0),
      likes: reels.reduce((sum, r) => sum + (Array.isArray(r.likes) ? r.likes.length : (r.likes || 0)), 0),
    }),
    [reels]
  );

  return (
    <div className="myr-root min-h-screen">
      <style>{`
        .myr-root {
          background: radial-gradient(1200px 600px at 15% -10%, rgba(99,102,241,0.20), transparent 60%),
                      radial-gradient(1000px 700px at 100% 10%, rgba(59,130,246,0.14), transparent 55%),
                      #0A0E1A;
          font-family: 'Inter', system-ui, sans-serif;
          color: #E4E7F5;
        }
        .myr-glass {
          background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.09);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .myr-hero {
          background: linear-gradient(135deg, rgba(99,102,241,0.16), rgba(59,130,246,0.08) 60%, rgba(255,255,255,0.02));
          border: 1px solid rgba(129,140,248,0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .myr-eyebrow {
          background: linear-gradient(90deg, #A5B4FC, #93C5FD);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .myr-stat-num { font-weight: 800; font-size: 22px; color: #fff; }
        .myr-stat-label { font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: #9CA3D4; }

        .myr-badge-btn {
          background: linear-gradient(135deg, #6366F1, #3B82F6);
          box-shadow: 0 8px 24px -8px rgba(79,70,229,0.7);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .myr-badge-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 28px -8px rgba(79,70,229,0.85); }

        .myr-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015));
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          overflow: hidden;
        }
        @media (hover: hover) {
          .myr-card:hover {
            transform: translateY(-3px);
            border-color: rgba(129,140,248,0.35);
            box-shadow: 0 20px 40px -20px rgba(59,90,246,0.45);
          }
        }

        .myr-index {
          position: absolute;
          top: 8px; left: 8px;
          width: 24px; height: 24px;
          border-radius: 9999px;
          background: rgba(10,14,26,0.65);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(4px);
          color: #C7D2FE;
          font-size: 11px;
          font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          z-index: 5;
        }

        .myr-thumb-wrap {
          position: relative;
          aspect-ratio: 9 / 12;
          background: #0D1220;
          overflow: hidden;
        }
        .myr-thumb-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        @media (hover: hover) {
          .myr-card:hover .myr-thumb-wrap img { transform: scale(1.05); }
        }
        .myr-thumb-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(10,14,26,0) 40%, rgba(10,14,26,0.92) 100%);
        }
        .myr-play {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 42px; height: 42px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.35);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }

        .myr-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 9999px;
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: 1px solid transparent;
        }
        .myr-status.pending { color: #FCD34D; background: rgba(252,211,77,0.14); border-color: rgba(252,211,77,0.3); }
        .myr-status.approved { color: #86EFAC; background: rgba(134,239,172,0.14); border-color: rgba(134,239,172,0.3); }
        .myr-status.rejected { color: #FCA5A5; background: rgba(252,165,165,0.14); border-color: rgba(252,165,165,0.3); }

        .myr-meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          color: #9CA3D4;
        }

        .myr-glow-line { border-top: 1px solid rgba(255,255,255,0.08); }

        .myr-modal-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          background: rgba(6,9,16,0.7);
          backdrop-filter: blur(4px);
        }
        .myr-modal { max-height: 90vh; overflow-y: auto; }
        .myr-close {
          width: 28px; height: 28px; border-radius: 9999px;
          display: flex; align-items: center; justify-content: center;
          color: #9CA3D4;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .myr-tab {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #9CA3D4;
        }
        .myr-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          color: #E4E7F5;
        }
        .myr-input::placeholder { color: #6B7398; }
        .myr-input:focus { outline: none; border-color: rgba(147,197,253,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .myr-file-drop {
          border: 1px dashed rgba(147,197,253,0.35);
          background: rgba(99,102,241,0.05);
        }

        .myr-skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 37%, rgba(255,255,255,0.03) 63%);
          background-size: 400% 100%;
          animation: myr-shimmer 1.4s ease infinite;
        }
        @keyframes myr-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .myr-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(2, 1fr);
        }
        @media (min-width: 480px) { .myr-grid { grid-template-columns: repeat(3, 1fr); gap: 18px; } }
        @media (min-width: 1024px) { .myr-grid { grid-template-columns: repeat(4, 1fr); } }
      `}</style>

      <div className="px-3 py-5 sm:p-6 md:p-10 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="myr-hero rounded-2xl p-4 sm:p-6 md:p-8 mb-5 sm:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <div className="myr-eyebrow text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3">
              Instructor Workspace
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white flex items-center gap-2 sm:gap-3">
              My Reels <Film className="text-indigo-300 flex-shrink-0" size={22} />
            </h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm max-w-xl" style={{ color: "#9CA3D4" }}>
              Track the status of every reel you've submitted, and how they're performing.
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="myr-badge-btn rounded-xl px-5 py-3 text-white text-sm font-bold whitespace-nowrap self-start flex items-center gap-2"
          >
            <Plus size={16} /> Upload Reel
          </button>
        </div>

        {/* Stat strip */}
        {!loading && reels.length > 0 && (
          <div className="myr-glass rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 grid grid-cols-4 gap-2 sm:gap-4 text-center">
            <div>
              <div className="myr-stat-num">{stats.total}</div>
              <div className="myr-stat-label">Reels</div>
            </div>
            <div>
              <div className="myr-stat-num">{stats.approved}</div>
              <div className="myr-stat-label">Live</div>
            </div>
            <div>
              <div className="myr-stat-num">{stats.views}</div>
              <div className="myr-stat-label">Views</div>
            </div>
            <div>
              <div className="myr-stat-num">{stats.likes}</div>
              <div className="myr-stat-label">Likes</div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="myr-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="myr-skeleton rounded-xl sm:rounded-2xl border border-white/5" style={{ aspectRatio: "9 / 15" }} />
            ))}
          </div>
        ) : reels.length === 0 ? (
          <div className="myr-glass flex flex-col items-center justify-center py-16 sm:py-24 px-4 rounded-2xl text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 sm:mb-4"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.28), rgba(59,130,246,0.18))", border: "1px solid rgba(147,197,253,0.25)", color: "#C7D2FE" }}>
              <Inbox size={22} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">No reels yet</h3>
            <p className="text-xs sm:text-sm mt-1 mb-4" style={{ color: "#6B7398" }}>
              Upload your first reel to get started.
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="myr-badge-btn rounded-lg px-4 py-2 text-white text-xs font-bold uppercase tracking-wide flex items-center gap-2"
            >
              <Plus size={14} /> Upload Reel
            </button>
          </div>
        ) : (
          <div className="myr-grid">
            {reels.map((r, i) => (
              <div key={r._id} className="myr-card rounded-xl sm:rounded-2xl flex flex-col">
                <div className="myr-thumb-wrap">
                  <div className="myr-index">{i + 1}</div>

                  {playingId === r._id ? (
                    <>
                      <video src={r.videoUrl} controls autoPlay className="w-full h-full object-cover absolute inset-0 z-10" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setPlayingId(null); }}
                        className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs border border-white/20"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      {r.thumbnail ? (
                        <img src={r.thumbnail} alt={r.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ color: "#3B4266" }}>
                          <Film size={26} />
                        </div>
                      )}
                      <div className="myr-thumb-fade" />
                      <button onClick={() => setPlayingId(r._id)} className="myr-play cursor-pointer">
                        <Play size={15} fill="currentColor" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-white text-xs sm:text-sm font-bold leading-snug line-clamp-2" title={r.title}>
                      {r.title || "Untitled"}
                    </h3>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={`myr-status ${r.status}`}>
                      {r.status === "approved" && <Check size={10} />}
                      {r.status === "rejected" && <X size={10} />}
                      {r.status === "pending" && <Clock size={10} />}
                      {r.status}
                    </span>
                    <span className="myr-meta-row">
                      <CalendarDays size={11} /> {formatDate(r.createdAt)}
                    </span>
                  </div>

                  {r.status === "approved" && (
                    <div className="myr-meta-row myr-glow-line pt-2">
                      <span className="flex items-center gap-1"><Eye size={12} /> {r.views ?? 0} views</span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} /> {Array.isArray(r.likes) ? r.likes.length : (r.likes ?? 0)} likes
                      </span>
                    </div>
                  )}

                  {r.status === "rejected" && r.rejectedReason && (
                    <div
                      className="text-[10px] sm:text-[11px] p-2 rounded-lg leading-relaxed"
                      style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", color: "#B4B9E0" }}
                    >
                      <span className="font-semibold" style={{ color: "#FCA5A5" }}>Reason: </span>
                      {r.rejectedReason}
                    </div>
                  )}

                  {r.status === "pending" && (
                    <p className="text-[10px] sm:text-[11px]" style={{ color: "#6B7398" }}>
                      Awaiting moderator review.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => {
            setShowUpload(false);
            fetchMine();
          }}
        />
      )}
    </div>
  );
};

export default MyReels;