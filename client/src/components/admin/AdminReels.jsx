import React, { useEffect, useState, useMemo } from "react";
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
  Heart,
  RotateCcw,
} from "lucide-react";
import { useSelector } from "react-redux";
import { hasPermission, hasBaseRole } from "../../utils/permissions";
import { useTranslation } from "react-i18next";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * INTEGRATION NOTE
 * This file is wired to local mock state so it renders as a live preview
 * (no video files are fetched). To drop it into your app:
 *
 * 1. Restore the real data fetching in fetchAll/doApprove/doReject — the
 *    blocks are marked "REAL API" below and match your original fetch()
 *    calls exactly (same endpoints, same credentials: "include").
 * 2. Re-add `const { user } = useSelector((s) => s.auth);` if you use it
 *    elsewhere in this component (kept out here since this preview has no
 *    redux store).
 * 3. Fix the backend route first — see reel.routes.js: GET /api/reels had
 *    no auth middleware, so req.user was always undefined and the admin
 *    ?all=1 branch never triggered. That's why nothing showed up here.
 * ─────────────────────────────────────────────────────────────────────────
 */

const FILTERS = ["all", "pending", "approved", "rejected"];

const AdminReels = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [stamping, setStamping] = useState(null); // { id }

  const [playingId, setPlayingId] = useState(null);

  const isFullAdmin = user && hasBaseRole(user, "admin");
  const canApprove = isFullAdmin || hasPermission(user, "reels", "approve");
  const canReject = isFullAdmin || hasPermission(user, "reels", "reject");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reels?all=1`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load reels");
      const data = await res.json();
      setReels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to load reels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const doApprove = async (id) => {
    setStamping({ id });
    try {
      const res = await fetch(`/api/reels/${id}/approve`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Approval failed");
      setReels((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, status: "approved", rejectedReason: undefined }
            : r
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setStamping(null);
    }
  };

  const doUnapprove = async (id) => {
    setStamping({ id });
    try {
      const res = await fetch(`/api/reels/${id}/unapprove`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Transition failed");
      setReels((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, status: "pending", rejectedReason: undefined }
            : r
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setStamping(null);
    }
  };

  const openReject = (id) => {
    setRejectingId(id);
    setRejectReason("");
  };

  const confirmReject = async (id) => {
    setStamping({ id });
    setRejectingId(null);
    const reason = rejectReason;
    try {
      const res = await fetch(`/api/reels/${id}/reject`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Rejection failed");
      setReels((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, status: "rejected", rejectedReason: reason } : r
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setStamping(null);
    }
  };

  const counts = useMemo(
    () => ({
      all: reels.length,
      pending: reels.filter((r) => r.status === "pending").length,
      approved: reels.filter((r) => r.status === "approved").length,
      rejected: reels.filter((r) => r.status === "rejected").length,
    }),
    [reels]
  );

  const visible = reels.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesQuery =
      !query ||
      (r.title || "").toLowerCase().includes(query.toLowerCase()) ||
      (r.instructorName || "").toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="amr-root min-h-screen">
      <style>{`
        .amr-root {
          background: radial-gradient(1200px 600px at 15% -10%, rgba(99,102,241,0.20), transparent 60%),
                      radial-gradient(1000px 700px at 100% 10%, rgba(59,130,246,0.14), transparent 55%),
                      #0A0E1A;
          font-family: 'Inter', system-ui, sans-serif;
          color: #E4E7F5;
        }

        .amr-glass {
          background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.09);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .amr-hero {
          background: linear-gradient(135deg, rgba(99,102,241,0.16), rgba(59,130,246,0.08) 60%, rgba(255,255,255,0.02));
          border: 1px solid rgba(129,140,248,0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .amr-eyebrow {
          background: linear-gradient(90deg, #A5B4FC, #93C5FD);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .amr-badge {
          background: linear-gradient(135deg, #6366F1, #3B82F6);
          box-shadow: 0 8px 24px -8px rgba(79,70,229,0.7);
        }

        .amr-tab {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #9CA3D4;
          transition: all 0.2s ease;
        }
        .amr-tab.active {
          background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(59,130,246,0.25));
          border-color: rgba(147,197,253,0.5);
          color: #fff;
          box-shadow: 0 4px 18px -6px rgba(59,130,246,0.5);
        }
        .amr-tab:hover:not(.active) {
          border-color: rgba(147,197,253,0.35);
          color: #E4E7F5;
        }

        .amr-card {
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015));
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          overflow: hidden;
          height: 440px;
        }
        .amr-card:hover {
          transform: translateY(-3px);
          border-color: rgba(129,140,248,0.35);
          box-shadow: 0 20px 40px -20px rgba(59,90,246,0.45);
        }

        .amr-thumb-wrap {
          position: relative;
          flex-grow: 1;
          background: #0D1220;
          overflow: hidden;
        }
        .amr-thumb-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .amr-card:hover .amr-thumb-wrap img {
          transform: scale(1.05);
        }
        .amr-thumb-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(10,14,26,0) 40%, rgba(10,14,26,0.92) 100%);
        }
        .amr-play {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 46px; height: 46px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.35);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          opacity: 0.85;
        }

        .amr-icon-tile {
          background: linear-gradient(135deg, rgba(99,102,241,0.28), rgba(59,130,246,0.18));
          border: 1px solid rgba(147,197,253,0.25);
          color: #C7D2FE;
        }

        .amr-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 9999px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: 1px solid transparent;
        }
        .amr-status.pending {
          color: #FCD34D;
          background: rgba(252,211,77,0.14);
          border-color: rgba(252,211,77,0.3);
        }
        .amr-status.approved {
          color: #86EFAC;
          background: rgba(134,239,172,0.14);
          border-color: rgba(134,239,172,0.3);
        }
        .amr-status.rejected {
          color: #FCA5A5;
          background: rgba(252,165,165,0.14);
          border-color: rgba(252,165,165,0.3);
        }
        .amr-status.pop { animation: amr-pop 0.4s ease; }
        @keyframes amr-pop {
          0% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .amr-btn-approve {
          background: linear-gradient(135deg, rgba(34,197,94,0.16), rgba(34,197,94,0.08));
          color: #86EFAC;
          border: 1px solid rgba(34,197,94,0.3);
        }
        .amr-btn-approve:hover {
          background: linear-gradient(135deg, #22C55E, #16A34A);
          color: #06210F;
          border-color: transparent;
        }

        .amr-btn-reject {
          background: linear-gradient(135deg, rgba(248,113,113,0.14), rgba(248,113,113,0.06));
          color: #FCA5A5;
          border: 1px solid rgba(248,113,113,0.3);
        }
        .amr-btn-reject:hover {
          background: linear-gradient(135deg, #F87171, #EF4444);
          color: #2A0A0A;
          border-color: transparent;
        }

        .amr-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          color: #E4E7F5;
        }
        .amr-input::placeholder { color: #6B7398; }
        .amr-input:focus { outline: none; border-color: rgba(147,197,253,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }

        .amr-skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 37%, rgba(255,255,255,0.03) 63%);
          background-size: 400% 100%;
          animation: amr-shimmer 1.4s ease infinite;
        }
        @keyframes amr-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="amr-hero rounded-2xl p-8 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="amr-eyebrow text-xs font-bold tracking-widest uppercase mb-3">
              Umang Vision Academy &middot; Staff Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-3">
              {t('adminReels.title')} <Clapperboard className="text-indigo-300" size={30} />
            </h1>
            <p className="mt-2 text-sm max-w-xl" style={{ color: "#9CA3D4" }}>
              {t('adminReels.subtitle')}
            </p>
          </div>
          <div className="amr-badge rounded-xl px-5 py-3 text-white text-sm font-semibold whitespace-nowrap self-start md:self-center">
            {counts.pending} {t('adminReels.awaitingReview')}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-8">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`amr-tab px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${filter === f ? "active" : ""}`}
              >
                {t(`adminReels.filters.${f}`)} <span style={{ opacity: 0.65 }}>&middot; {counts[f]}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6B7398" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('adminReels.searchPlaceholder')}
              className="amr-input w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="amr-skeleton rounded-2xl border border-white/5" style={{ aspectRatio: "9 / 15" }} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="amr-glass flex flex-col items-center justify-center py-24 rounded-2xl">
            <div className="amr-icon-tile w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <Inbox size={26} />
            </div>
            <h3 className="text-lg font-semibold text-white">{t('adminReels.emptyQueueTitle')}</h3>
            <p className="text-sm mt-1" style={{ color: "#6B7398" }}>
              {t('adminReels.emptyQueueSubtitle')}
            </p>
          </div>
        ) : (
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {visible.map((r) => (
              <div key={r._id} className="amr-card rounded-2xl flex flex-col">
                <div className="amr-thumb-wrap">
                  {playingId === r._id ? (
                    <>
                      <video
                        src={r.videoUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-cover absolute inset-0 z-10"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlayingId(null);
                        }}
                        className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs border border-white/20"
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
                          <Film size={32} />
                        </div>
                      )}
                      <div className="amr-thumb-fade" />
                      <button
                        onClick={() => setPlayingId(r._id)}
                        className="amr-play cursor-pointer"
                      >
                        <Play size={18} fill="currentColor" />
                      </button>
                    </>
                  )}

                  <div className="absolute top-2.5 left-2.5">
                    <span className={`amr-status ${r.status} ${stamping?.id === r._id ? "pop" : ""}`}>
                      {r.status === "approved" && <Check size={11} />}
                      {r.status === "rejected" && <X size={11} />}
                      {r.status === "pending" && <Clock size={11} />}
                      {t(`adminReels.filters.${r.status}`)}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <h3 className="text-white text-sm font-bold leading-snug line-clamp-2" title={r.title}>
                      {r.title || "Untitled"}
                    </h3>
                    <p className="text-[11px] mt-1 truncate" style={{ color: "#B4B9E0" }}>
                      {r.instructorName || t('adminReels.unknownInstructor')}
                    </p>
                    {r.status === "approved" && (
                      <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: "#9CA3D4" }}>
                        <span className="flex items-center gap-1"><Eye size={11} /> {r.views ?? 0}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 flex flex-col gap-2.5">
                  {r.rejectedReason && r.status === "rejected" && (
                    <div
                      className="text-[11px] p-2.5 rounded-lg leading-relaxed"
                      style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", color: "#B4B9E0" }}
                    >
                      <span className="font-semibold" style={{ color: "#FCA5A5" }}>
                        {t('adminReels.reason')}{" "}
                      </span>
                      {r.rejectedReason}
                    </div>
                  )}

                  {r.status === "pending" && rejectingId !== r._id && (canApprove || canReject) && (
                    <div className="flex gap-2">
                      {canReject && (
                        <button
                          onClick={() => openReject(r._id)}
                          disabled={stamping?.id === r._id}
                          className="amr-btn-reject flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors"
                        >
                          <X size={12} /> {t('adminReels.actions.reject')}
                        </button>
                      )}
                      {canApprove && (
                        <button
                          onClick={() => doApprove(r._id)}
                          disabled={stamping?.id === r._id}
                          className="amr-btn-approve flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors"
                        >
                          <Check size={12} /> {t('adminReels.actions.approve')}
                        </button>
                      )}
                    </div>
                  )}

                  {r.status === "approved" && canReject && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => doUnapprove(r._id)}
                        disabled={stamping?.id === r._id}
                        className="amr-btn-reject flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors"
                      >
                        <RotateCcw size={12} /> {t('adminReels.actions.unapprove')}
                      </button>
                    </div>
                  )}

                  {r.status === "rejected" && canApprove && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => doUnapprove(r._id)}
                        disabled={stamping?.id === r._id}
                        className="amr-btn-approve flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors"
                      >
                        <RotateCcw size={12} /> {t('adminReels.actions.unreject')}
                      </button>
                    </div>
                  )}

                  {rejectingId === r._id && (
                    <div>
                      <textarea
                        autoFocus
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={t('adminReels.rejectReasonPlaceholder')}
                        rows={2}
                        className="amr-input w-full rounded-lg p-2 text-[11px] resize-none"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setRejectingId(null)}
                          className="amr-tab flex-1 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide"
                        >
                          {t('adminReels.actions.cancel')}
                        </button>
                        <button
                          onClick={() => confirmReject(r._id)}
                          className="amr-btn-reject flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide"
                        >
                          {t('adminReels.actions.confirm')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReels;