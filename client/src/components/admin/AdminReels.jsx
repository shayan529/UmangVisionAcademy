import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Film,
  Play,
  Check,
  X,
  Clapperboard,
  Inbox,
  Clock,
  Search,
  Eye,
  RotateCcw,
  Plus,
  Upload,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useSelector } from "react-redux";
import { hasPermission, hasBaseRole } from "../../utils/permissions";
import { useTranslation } from "react-i18next";
import { uploadFile } from "../../utils/uploadFile";

// ─── constants ────────────────────────────────────────────────────────────────
const STATUS_FILTERS = ["all", "pending", "approved", "rejected"];

const STATUS_STYLES = {
  pending:  { color: "#FCD34D", bg: "rgba(252,211,77,0.14)",  border: "rgba(252,211,77,0.3)"  },
  approved: { color: "#86EFAC", bg: "rgba(134,239,172,0.14)", border: "rgba(134,239,172,0.3)" },
  rejected: { color: "#FCA5A5", bg: "rgba(252,165,165,0.14)", border: "rgba(252,165,165,0.3)" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border"
      style={{ color: s.color, background: s.bg, borderColor: s.border }}
    >
      {status === "approved" && <Check size={10} />}
      {status === "rejected" && <X size={10} />}
      {status === "pending"  && <Clock size={10} />}
      {status}
    </span>
  );
};

// ─── upload modal ─────────────────────────────────────────────────────────────
const UploadModal = ({ onClose, onUploaded }) => {
  const [file, setFile]           = useState(null);
  const [title, setTitle]         = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState("");

  const applyFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) { setError("Please choose a video file."); return; }
    setError("");
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) { setError("Select a video first."); return; }
    setUploading(true);
    setError("");
    try {
      const data = await uploadFile({
        file,
        folder: "admin-reels",
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      const res = await fetch("/api/reels", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || file.name, videoUrl: data.url }),
      });
      if (!res.ok) throw new Error("Failed to create reel");
      const reel = await res.json();
      onUploaded(reel);
      onClose();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] overflow-hidden shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-indigo-400">Reels</p>
            <h3 className="text-base font-bold text-white">Upload a Reel</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition"><X size={18} /></button>
        </div>

        {/* body */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-xs text-slate-500">Reels uploaded by admin go directly to the moderation queue as pending.</p>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reel title (optional)"
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-[#0b1120] border border-slate-700 text-white outline-none focus:border-indigo-500 transition"
          />

          {/* drop zone */}
          <label
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); applyFile(e.dataTransfer.files?.[0]); }}
            className="flex flex-col items-center justify-center rounded-xl cursor-pointer transition-colors"
            style={{
              border: `1.5px dashed ${isDragging ? "#6366F1" : "#334155"}`,
              background: isDragging ? "rgba(99,102,241,0.07)" : "#0b1120",
              padding: previewUrl ? "10px" : "28px 16px",
            }}
          >
            <input type="file" accept="video/*" onChange={(e) => applyFile(e.target.files[0])} className="hidden" />
            {previewUrl ? (
              <div className="w-full flex items-center gap-3">
                <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-black">
                  <video src={previewUrl} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play size={14} className="text-white" fill="currentColor" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{file?.name}</p>
                  <p className="text-[11px] text-slate-500">Tap to replace</p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={24} className="text-indigo-400 mb-2" />
                <p className="text-xs font-medium text-white">Drop a video or click to browse</p>
                <p className="text-[11px] text-slate-500 mt-1">MP4, MOV or WebM</p>
              </>
            )}
          </label>

          {uploading && (
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* footer */}
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 transition"
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !file}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading… {progress}%</> : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── reject reason inline form ────────────────────────────────────────────────
const RejectForm = ({ onCancel, onConfirm }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="flex flex-col gap-2 mt-2">
      <textarea
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for rejection (optional)"
        rows={2}
        className="w-full rounded-lg px-3 py-2 text-[11px] bg-slate-900 border border-slate-700 text-white outline-none focus:border-rose-500 resize-none transition"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
        >Cancel</button>
        <button
          onClick={() => onConfirm(reason)}
          className="flex-1 py-1.5 rounded-lg text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 transition"
        >Confirm Reject</button>
      </div>
    </div>
  );
};

// ─── reel card (shared between both tabs) ────────────────────────────────────
const ReelCard = ({ reel, canApprove, canReject, stamping, onApprove, onUnapprove, onReject, isMyReel }) => {
  const [playing, setPlaying]     = useState(false);
  const [rejecting, setRejecting] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col border border-white/8 transition-all duration-250"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
        height: 420,
      }}
    >
      {/* thumbnail / video */}
      <div className="relative flex-1 bg-[#0D1220] overflow-hidden">
        {playing ? (
          <>
            <video src={reel.videoUrl} controls autoPlay className="absolute inset-0 w-full h-full object-cover z-10" />
            <button
              onClick={() => setPlaying(false)}
              className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs border border-white/20"
            >✕</button>
          </>
        ) : (
          <>
            {reel.thumbnail
              ? <img src={reel.thumbnail} alt={reel.title} className="w-full h-full object-cover transition-transform duration-400 hover:scale-105" />
              : <div className="w-full h-full flex items-center justify-center text-slate-700"><Film size={32} /></div>
            }
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(10,14,26,0.92) 100%)" }} />
            <button
              onClick={() => setPlaying(true)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.35)", backdropFilter: "blur(6px)" }}
            >
              <Play size={16} fill="white" className="text-white" />
            </button>
          </>
        )}

        {/* status badge top-left */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <StatusBadge status={reel.status} />
        </div>

        {/* title + meta bottom */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
          <p className="text-white text-sm font-bold leading-snug line-clamp-2">{reel.title || "Untitled"}</p>
          {!isMyReel && (
            <p className="text-[11px] mt-0.5 truncate" style={{ color: "#B4B9E0" }}>
              {reel.instructorName || "Unknown"}
            </p>
          )}
          {reel.status === "approved" && (
            <p className="flex items-center gap-1 text-[11px] mt-1" style={{ color: "#9CA3D4" }}>
              <Eye size={11} /> {reel.views ?? 0} views
            </p>
          )}
        </div>
      </div>

      {/* action area */}
      <div className="p-3 flex flex-col gap-2">
        {reel.rejectedReason && reel.status === "rejected" && (
          <p className="text-[10px] px-2.5 py-2 rounded-lg leading-relaxed"
            style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", color: "#FCA5A5" }}>
            <span className="font-semibold">Reason: </span>{reel.rejectedReason}
          </p>
        )}

        {rejecting ? (
          <RejectForm onCancel={() => setRejecting(false)} onConfirm={(reason) => { setRejecting(false); onReject(reel._id, reason); }} />
        ) : (
          <div className="flex gap-2">
            {reel.status === "pending" && canApprove && (
              <button
                onClick={() => onApprove(reel._id)}
                disabled={stamping === reel._id}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
                style={{ background: "rgba(34,197,94,0.12)", color: "#86EFAC", border: "1px solid rgba(34,197,94,0.3)" }}
              >
                <Check size={11} /> Approve
              </button>
            )}
            {reel.status === "pending" && canReject && (
              <button
                onClick={() => setRejecting(true)}
                disabled={stamping === reel._id}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
                style={{ background: "rgba(248,113,113,0.1)", color: "#FCA5A5", border: "1px solid rgba(248,113,113,0.3)" }}
              >
                <X size={11} /> Reject
              </button>
            )}
            {(reel.status === "approved" || reel.status === "rejected") && canReject && (
              <button
                onClick={() => onUnapprove(reel._id)}
                disabled={stamping === reel._id}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
                style={{ background: "rgba(148,163,184,0.08)", color: "#94A3B8", border: "1px solid rgba(148,163,184,0.2)" }}
              >
                <RotateCcw size={11} /> Revert to Pending
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
const AdminReels = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);

  const isFullAdmin = user && hasBaseRole(user, "admin");
  const canApprove  = isFullAdmin || hasPermission(user, "reels", "approve");
  const canReject   = isFullAdmin || hasPermission(user, "reels", "reject");

  // ── data ──────────────────────────────────────────────────────────────────
  const [allReels,  setAllReels]  = useState([]);
  const [myReels,   setMyReels]   = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingMy,  setLoadingMy]  = useState(true);

  // ── ui ────────────────────────────────────────────────────────────────────
  const [tab,          setTab]          = useState("moderation"); // "moderation" | "mine"
  const [filter,       setFilter]       = useState("all");
  const [query,        setQuery]        = useState("");
  const [stamping,     setStamping]     = useState(null);        // reel._id being mutated
  const [showUpload,   setShowUpload]   = useState(false);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoadingAll(true);
    try {
      const res = await fetch("/api/reels?all=1", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load reels");
      setAllReels(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoadingAll(false); }
  };

  const fetchMine = async () => {
    setLoadingMy(true);
    try {
      const res = await fetch("/api/reels?mine=1", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load your reels");
      setMyReels(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoadingMy(false); }
  };

  useEffect(() => { fetchAll(); fetchMine(); }, []);

  // ── mutations ─────────────────────────────────────────────────────────────
  const mutateReel = (id, patch) => {
    const apply = (prev) => prev.map((r) => r._id === id ? { ...r, ...patch } : r);
    setAllReels(apply);
    setMyReels(apply);
  };

  const doApprove = async (id) => {
    setStamping(id);
    try {
      const res = await fetch(`/api/reels/${id}/approve`, { method: "PUT", credentials: "include" });
      if (!res.ok) throw new Error("Approval failed");
      mutateReel(id, { status: "approved", rejectedReason: undefined });
    } catch (err) { alert(err.message); }
    finally { setStamping(null); }
  };

  const doUnapprove = async (id) => {
    setStamping(id);
    try {
      const res = await fetch(`/api/reels/${id}/unapprove`, { method: "PUT", credentials: "include" });
      if (!res.ok) throw new Error("Transition failed");
      mutateReel(id, { status: "pending", rejectedReason: undefined });
    } catch (err) { alert(err.message); }
    finally { setStamping(null); }
  };

  const doReject = async (id, reason) => {
    setStamping(id);
    try {
      const res = await fetch(`/api/reels/${id}/reject`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Rejection failed");
      mutateReel(id, { status: "rejected", rejectedReason: reason });
    } catch (err) { alert(err.message); }
    finally { setStamping(null); }
  };

  const handleUploaded = (reel) => {
    setMyReels((prev) => [reel, ...prev]);
    setAllReels((prev) => [reel, ...prev]);
    setTab("mine"); // jump to My Reels so admin sees their upload
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:      allReels.length,
    pending:  allReels.filter((r) => r.status === "pending").length,
    approved: allReels.filter((r) => r.status === "approved").length,
    rejected: allReels.filter((r) => r.status === "rejected").length,
  }), [allReels]);

  const myCounts = useMemo(() => ({
    total:    myReels.length,
    approved: myReels.filter((r) => r.status === "approved").length,
    views:    myReels.reduce((s, r) => s + (r.views || 0), 0),
  }), [myReels]);

  const visibleAll = useMemo(() => allReels.filter((r) => {
    const matchStatus = filter === "all" || r.status === filter;
    const matchQuery  = !query
      || (r.title || "").toLowerCase().includes(query.toLowerCase())
      || (r.instructorName || "").toLowerCase().includes(query.toLowerCase());
    return matchStatus && matchQuery;
  }), [allReels, filter, query]);

  const visibleMine = useMemo(() => myReels.filter((r) => {
    const matchStatus = filter === "all" || r.status === filter;
    const matchQuery  = !query || (r.title || "").toLowerCase().includes(query.toLowerCase());
    return matchStatus && matchQuery;
  }), [myReels, filter, query]);

  const loading    = tab === "moderation" ? loadingAll : loadingMy;
  const visible    = tab === "moderation" ? visibleAll : visibleMine;

  return (
    <div className="space-y-6">
      {/* ── page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-400 uppercase mb-1">
            Staff Workspace
          </p>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Reels <Clapperboard size={22} className="text-indigo-300" />
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload your own reels and moderate submissions from instructors — all in one place.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-sm"
        >
          <Plus size={16} /> Upload Reel
        </button>
      </div>

      {/* ── sub-tabs ────────────────────────────────────────────────────── */}
      <div className="inline-flex rounded-xl border border-slate-800 bg-[#0b1120] p-1">
        {[
          { key: "moderation", label: "All Reels", sub: `${counts.pending} pending` },
          { key: "mine",       label: "My Reels",  sub: `${myCounts.total} uploaded` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setFilter("all"); setQuery(""); }}
            className={`flex flex-col items-start px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === t.key ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
            <span className={`text-[10px] font-normal mt-0.5 ${tab === t.key ? "text-indigo-200" : "text-slate-600"}`}>
              {t.sub}
            </span>
          </button>
        ))}
      </div>

      {/* ── stat strip (My Reels tab) ────────────────────────────────────── */}
      {tab === "mine" && !loadingMy && myReels.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",    value: myCounts.total    },
            { label: "Live",     value: myCounts.approved },
            { label: "Views",    value: myCounts.views    },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-[#111827] px-4 py-3 text-center">
              <div className="text-xl font-extrabold text-white">{value}</div>
              <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── filter + search bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => {
            const count = tab === "moderation" ? counts[f] : myReels.filter((r) => f === "all" || r.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border transition-all ${
                  filter === f
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                }`}
              >
                {f} <span className="opacity-60">· {count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "moderation" ? "Search title or instructor…" : "Search title…"}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-[#0b1120] border border-slate-700 text-white outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* ── content ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 animate-pulse"
              style={{ aspectRatio: "9/15", background: "linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%)", backgroundSize: "400% 100%" }}
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-slate-800 bg-[#111827]">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.28),rgba(59,130,246,0.18))", border: "1px solid rgba(147,197,253,0.25)" }}>
            <Inbox size={24} className="text-indigo-300" />
          </div>
          <p className="text-base font-semibold text-white">
            {tab === "moderation" ? "No reels in the queue" : "You haven't uploaded any reels yet"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {tab === "moderation"
              ? filter !== "all" ? `No ${filter} reels.` : "Waiting for instructor submissions."
              : "Click 'Upload Reel' to get started."}
          </p>
          {tab === "mine" && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition"
            >
              <Plus size={14} /> Upload Reel
            </button>
          )}
        </div>
      ) : (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
        >
          {visible.map((reel) => (
            <ReelCard
              key={reel._id}
              reel={reel}
              canApprove={canApprove}
              canReject={canReject}
              stamping={stamping}
              onApprove={doApprove}
              onUnapprove={doUnapprove}
              onReject={doReject}
              isMyReel={tab === "mine"}
            />
          ))}
        </div>
      )}

      {/* ── upload modal ────────────────────────────────────────────────── */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
        />
      )}
    </div>
  );
};

export default AdminReels;
