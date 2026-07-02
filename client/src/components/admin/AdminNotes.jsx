import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Paperclip,
  Check,
  X,
  ShieldCheck,
  Inbox,
  Clock,
  Search,
  Phone,
  MapPin,
  RotateCcw,
} from "lucide-react";
import api from "../../config/api";
import { hasPermission, hasBaseRole } from "../../utils/permissions";

const FILTERS = ["all", "pending", "approved", "rejected"];

const AdminNotes = ({ user }) => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [stamping, setStamping] = useState(null); // { id, kind }

  const isFullAdmin = user && hasBaseRole(user, "admin");
  const canApprove = isFullAdmin || hasPermission(user, "notes", "approve");
  const canReject = isFullAdmin || hasPermission(user, "notes", "reject");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notes?all=1");
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load notes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const doApprove = async (id) => {
    setStamping({ id, kind: "approved" });
    try {
      await api.put(`/notes/${id}/approve`);
      setNotes((prev) =>
        prev.map((n) => (n._id === id ? { ...n, status: "approved", rejectedReason: undefined } : n))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Approve failed");
    } finally {
      setStamping(null);
    }
  };

  const openReject = (id) => {
    setRejectingId(id);
    setRejectReason("");
  };

  const confirmReject = async (id) => {
    setStamping({ id, kind: "rejected" });
    setRejectingId(null);
    const reason = rejectReason;
    try {
      await api.put(`/notes/${id}/reject`, { reason });
      setNotes((prev) =>
        prev.map((n) => (n._id === id ? { ...n, status: "rejected", rejectedReason: reason } : n))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Reject failed");
    } finally {
      setStamping(null);
    }
  };

  const doUnapprove = async (id) => {
    setStamping({ id, kind: "pending" });
    try {
      await api.put(`/notes/${id}/unapprove`);
      setNotes((prev) =>
        prev.map((n) => (n._id === id ? { ...n, status: "pending" } : n))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Unapprove failed");
    } finally {
      setStamping(null);
    }
  };

  const counts = useMemo(
    () => ({
      all: notes.length,
      pending: notes.filter((n) => n.status === "pending").length,
      approved: notes.filter((n) => n.status === "approved").length,
      rejected: notes.filter((n) => n.status === "rejected").length,
    }),
    [notes]
  );

  const visible = notes.filter((n) => {
    const matchesFilter = filter === "all" || n.status === filter;
    const matchesQuery =
      !query ||
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      (n.instructorName || "").toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="amn-root min-h-screen">
      <style>{`
        .amn-root {
          background: radial-gradient(1200px 600px at 15% -10%, rgba(99,102,241,0.20), transparent 60%),
                      radial-gradient(1000px 700px at 100% 10%, rgba(59,130,246,0.14), transparent 55%),
                      #0A0E1A;
          font-family: 'Inter', system-ui, sans-serif;
          color: #E4E7F5;
        }

        .amn-glass {
          background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.09);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .amn-hero {
          background: linear-gradient(135deg, rgba(99,102,241,0.16), rgba(59,130,246,0.08) 60%, rgba(255,255,255,0.02));
          border: 1px solid rgba(129,140,248,0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .amn-eyebrow {
          background: linear-gradient(90deg, #A5B4FC, #93C5FD);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .amn-badge {
          background: linear-gradient(135deg, #6366F1, #3B82F6);
          box-shadow: 0 8px 24px -8px rgba(79,70,229,0.7);
        }

        .amn-tab {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #9CA3D4;
          transition: all 0.2s ease;
        }
        .amn-tab.active {
          background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(59,130,246,0.25));
          border-color: rgba(147,197,253,0.5);
          color: #fff;
          box-shadow: 0 4px 18px -6px rgba(59,130,246,0.5);
        }
        .amn-tab:hover:not(.active) {
          border-color: rgba(147,197,253,0.35);
          color: #E4E7F5;
        }

        .amn-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015));
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .amn-card:hover {
          transform: translateY(-3px);
          border-color: rgba(129,140,248,0.35);
          box-shadow: 0 20px 40px -20px rgba(59,90,246,0.45);
        }

        .amn-icon-tile {
          background: linear-gradient(135deg, rgba(99,102,241,0.28), rgba(59,130,246,0.18));
          border: 1px solid rgba(147,197,253,0.25);
          color: #C7D2FE;
        }

        .amn-status {
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
        .amn-status.pending {
          color: #FCD34D;
          background: rgba(252,211,77,0.1);
          border-color: rgba(252,211,77,0.25);
        }
        .amn-status.approved {
          color: #86EFAC;
          background: rgba(134,239,172,0.1);
          border-color: rgba(134,239,172,0.25);
        }
        .amn-status.rejected {
          color: #FCA5A5;
          background: rgba(252,165,165,0.1);
          border-color: rgba(252,165,165,0.25);
        }
        .amn-status.pop { animation: amn-pop 0.4s ease; }
        @keyframes amn-pop {
          0% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .amn-btn-approve {
          background: linear-gradient(135deg, rgba(34,197,94,0.16), rgba(34,197,94,0.08));
          color: #86EFAC;
          border: 1px solid rgba(34,197,94,0.3);
        }
        .amn-btn-approve:hover {
          background: linear-gradient(135deg, #22C55E, #16A34A);
          color: #06210F;
          border-color: transparent;
        }

        .amn-btn-reject {
          background: linear-gradient(135deg, rgba(248,113,113,0.14), rgba(248,113,113,0.06));
          color: #FCA5A5;
          border: 1px solid rgba(248,113,113,0.3);
        }
        .amn-btn-reject:hover {
          background: linear-gradient(135deg, #F87171, #EF4444);
          color: #2A0A0A;
          border-color: transparent;
        }

        .amn-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          color: #E4E7F5;
        }
        .amn-input::placeholder { color: #6B7398; }
        .amn-input:focus { outline: none; border-color: rgba(147,197,253,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }

        .amn-skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 37%, rgba(255,255,255,0.03) 63%);
          background-size: 400% 100%;
          animation: amn-shimmer 1.4s ease infinite;
        }
      `}</style>

      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="amn-hero rounded-2xl p-8 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="amn-eyebrow text-xs font-bold tracking-widest uppercase mb-3">
              {t("adminNotes.breadcrumb")}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-3">
              {t("adminNotes.title")} <ShieldCheck className="text-indigo-300" size={30} />
            </h1>
            <p className="mt-2 text-sm max-w-xl" style={{ color: "#9CA3D4" }}>
              {t("adminNotes.subtitle")}
            </p>
          </div>
          <div className="amn-badge rounded-xl px-5 py-3 text-white text-sm font-semibold whitespace-nowrap self-start md:self-center">
            {counts.pending} {t("adminNotes.awaitingReview")}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-8">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`amn-tab px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${filter === f ? "active" : ""}`}
              >
                {t(`adminNotes.${f}`)} <span style={{ opacity: 0.65 }}>&middot; {counts[f]}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6B7398" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("adminNotes.searchPlaceholder")}
              className="amn-input w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="amn-skeleton h-56 rounded-2xl border border-white/5" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="amn-glass flex flex-col items-center justify-center py-24 rounded-2xl">
            <div className="amn-icon-tile w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <Inbox size={26} />
            </div>
            <h3 className="text-lg font-semibold text-white">{t("adminNotes.emptyTitle")}</h3>
            <p className="text-sm mt-1" style={{ color: "#6B7398" }}>
              {t("adminNotes.emptySubtitle")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visible.map((note) => (
              <div key={note._id} className="amn-card rounded-2xl p-5 flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="amn-icon-tile w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-base leading-snug truncate" title={note.title}>
                      {note.title}
                    </h3>
                    <p className="text-xs mt-1 truncate" style={{ color: "#9CA3D4" }}>
                      {note.instructorName || t("adminNotes.unknownInstructor")}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                      {note.instructor?.phoneNumber && (
                        <span className="amn-mono text-[10px] flex items-center gap-1" style={{ color: "#9CA3D4" }}>
                          <Phone size={9} /> {note.instructor.phoneNumber}
                        </span>
                      )}
                      {(note.instructor?.city || note.instructor?.state) && (
                        <span className="amn-mono text-[10px] flex items-center gap-1" style={{ color: "#9CA3D4" }}>
                          <MapPin size={9} /> {[note.instructor.city, note.instructor.state].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p
                  className="text-sm mt-4 flex-1 leading-relaxed"
                  style={{ color: note.description ? "#B4B9E0" : "#565C85", fontStyle: note.description ? "normal" : "italic" }}
                >
                  {note.description || t("adminNotes.noDescription")}
                </p>

                <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className={`amn-status ${note.status} ${stamping?.id === note._id ? "pop" : ""}`}>
                    {note.status === "approved" && <Check size={12} />}
                    {note.status === "rejected" && <X size={12} />}
                    {note.status === "pending" && <Clock size={12} />}
                    {t(`adminNotes.${note.status}`)}
                  </span>

                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ color: "#93C5FD", background: "rgba(59,130,246,0.1)" }}
                  >
                    <Paperclip size={13} /> {t("adminNotes.file")}
                  </a>
                </div>

                {note.rejectedReason && note.status === "rejected" && (
                  <div
                    className="mt-3 text-xs p-3 rounded-lg leading-relaxed"
                    style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", color: "#B4B9E0" }}
                  >
                    <span className="font-semibold" style={{ color: "#FCA5A5" }}>
                      {t("adminNotes.marginNote")}{" "}
                    </span>
                    {note.rejectedReason}
                  </div>
                )}

                {note.status === "pending" && rejectingId !== note._id && (canApprove || canReject) && (
                  <div className="mt-5 flex gap-2.5">
                    {canReject && (
                      <button
                        onClick={() => openReject(note._id)}
                        disabled={stamping?.id === note._id}
                        className="amn-btn-reject flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                      >
                        <X size={14} /> {t("adminNotes.reject")}
                      </button>
                    )}
                    {canApprove && (
                      <button
                        onClick={() => doApprove(note._id)}
                        disabled={stamping?.id === note._id}
                        className="amn-btn-approve flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                      >
                        <Check size={14} /> {t("adminNotes.approve")}
                      </button>
                    )}
                  </div>
                )}

                {rejectingId === note._id && (
                  <div className="mt-5">
                    <textarea
                      autoFocus
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={t("adminNotes.rejectPlaceholder")}
                      rows={2}
                      className="amn-input w-full rounded-lg p-2.5 text-xs resize-none"
                    />
                    <div className="mt-2.5 flex gap-2.5">
                      <button
                        onClick={() => setRejectingId(null)}
                        className="amn-tab flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide"
                      >
                        {t("adminNotes.cancel")}
                      </button>
                      <button
                        onClick={() => confirmReject(note._id)}
                        className="amn-btn-reject flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide"
                      >
                        {t("adminNotes.confirmReject")}
                      </button>
                    </div>
                  </div>
                )}

                {note.status === "approved" && canReject && (
                  <div className="mt-5 flex gap-2.5">
                    <button
                      onClick={() => doUnapprove(note._id)}
                      disabled={stamping?.id === note._id}
                      className="amn-btn-reject flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                    >
                      <RotateCcw size={14} /> {t("adminNotes.unapprove")}
                    </button>
                  </div>
                )}

                {note.status === "rejected" && (canApprove || canReject) && (
                  <div className="mt-5 flex gap-2.5">
                    <button
                      onClick={() => doUnapprove(note._id)}
                      disabled={stamping?.id === note._id}
                      className="amn-btn-approve flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                    >
                      <RotateCcw size={14} /> {t("adminNotes.unreject")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotes;