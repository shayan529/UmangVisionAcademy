import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminTransactions } from "../../redux/slices/walletSlice";
import { useTranslation } from "react-i18next";
import {
  Search,
  RefreshCw,
  IndianRupee,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  User,
  AlertCircle,
  SlidersHorizontal,
  Check,
} from "lucide-react";

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  switch (status) {
    case "success":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-emerald-300 border border-emerald-400/25">
          <CheckCircle size={12} /> {t("adminPayments.statusSuccess")}
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-400/10 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-rose-300 border border-rose-400/25">
          <XCircle size={12} /> {t("adminPayments.statusFailed")}
        </span>
      );
    case "pending":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-amber-300 border border-amber-400/25">
          <Clock size={12} /> {t("adminPayments.statusPending")}
        </span>
      );
  }
};

const TYPE_META = {
  deposit: { icon: ArrowDownCircle, color: "text-emerald-300" },
  purchase: { icon: ArrowUpCircle, color: "text-indigo-300" },
  subscription: { icon: ArrowUpCircle, color: "text-indigo-300" },
  refund: { icon: RefreshCw, color: "text-amber-300" },
  coin_redeem: { icon: CreditCard, color: "text-purple-300" },
};

const TypeIcon = ({ type }) => {
  const meta = TYPE_META[type];
  const Icon = meta?.icon ?? IndianRupee;
  return <Icon size={16} className={meta?.color ?? "text-slate-400"} />;
};

// ── Filter dropdown — icon trigger + glass panel of type options ──────────────
const FilterDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = value !== "all";
  const activeLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Filter transactions"
        aria-expanded={open}
        className={`relative flex items-center gap-2 rounded-xl border py-2.5 px-3.5 text-sm font-semibold backdrop-blur-xl transition
          ${active
            ? "border-indigo-400/40 bg-indigo-400/10 text-indigo-200"
            : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.07]"
          }`}
      >
        <SlidersHorizontal size={16} />
        <span className="hidden sm:inline">
          {active ? activeLabel : "Filter"}
        </span>
        {active && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-indigo-400 ring-2 ring-[#0a0a18]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#12122a]/80 backdrop-blur-2xl shadow-2xl shadow-black/50">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-white/10">
            Filter by type
          </div>
          <div className="py-1">
            {options.map((opt) => {
              const isActive = value === opt.value;
              const Icon = TYPE_META[opt.value]?.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition
                    ${isActive
                      ? "bg-indigo-400/10 text-indigo-200"
                      : "text-slate-300 hover:bg-white/[0.06]"
                    }`}
                >
                  {Icon ? (
                    <Icon size={15} className={TYPE_META[opt.value]?.color} />
                  ) : (
                    <span className="w-[15px]" />
                  )}
                  <span className="flex-1 text-left">{opt.label}</span>
                  {isActive && <Check size={14} className="text-indigo-300" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminPayments() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { adminTransactions, adminSummary, adminPagination, adminLoading, error } = useSelector((state) => state.wallet);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const limit = 20;

  const filterOptions = [
    { value: "all", label: t("adminPayments.allTypes") },
    { value: "deposit", label: t("adminPayments.deposits") },
    { value: "purchase", label: t("adminPayments.purchases") },
    { value: "subscription", label: t("adminPayments.subscriptions") },
    { value: "refund", label: t("adminPayments.refunds") },
    { value: "coin_redeem", label: t("adminPayments.coinRedeems") },
  ];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 500);
    return () => clearTimeout(timer);
  }, [q]);

  const loadData = () => {
    dispatch(fetchAdminTransactions({ page, limit, search: debouncedQ, type: typeFilter }));
  };

  useEffect(() => {
    loadData();
  }, [page, limit, debouncedQ, typeFilter, dispatch]);

  const handleRefresh = () => {
    setPage(1);
    loadData();
  };

  const summaryCards = adminSummary
    ? [
      {
        label: t("adminPayments.totalVolume"),
        value: `₹${adminSummary.totalVolume?.toLocaleString("en-IN") || 0}`,
        accent: "text-emerald-300",
        icon: IndianRupee,
        iconBg: "bg-emerald-400/10",
        iconColor: "text-emerald-300",
        glow: "from-emerald-400/20",
      },
      {
        label: t("adminPayments.successfulTxns"),
        value: adminSummary.successful || 0,
        accent: "text-slate-100",
        icon: CheckCircle,
        iconBg: "bg-indigo-400/10",
        iconColor: "text-indigo-300",
        glow: "from-indigo-400/20",
      },
      {
        label: t("adminPayments.pendingRefunds"),
        value: adminSummary.pendingRefunds || 0,
        accent: "text-amber-300",
        icon: Clock,
        iconBg: "bg-amber-400/10",
        iconColor: "text-amber-300",
        glow: "from-amber-400/20",
      },
      {
        label: t("adminPayments.processedRefunds"),
        value: adminSummary.refunded || 0,
        accent: "text-slate-100",
        icon: RefreshCw,
        iconBg: "bg-purple-400/10",
        iconColor: "text-purple-300",
        glow: "from-purple-400/20",
      },
    ]
    : [];

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <style>{`
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(4%, 6%) scale(1.08); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-5%, -4%) scale(1.05); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, -5%) scale(1.1); }
        }
        .ap-blob-1 { animation: drift1 22s ease-in-out infinite; }
        .ap-blob-2 { animation: drift2 26s ease-in-out infinite; }
        .ap-blob-3 { animation: drift3 30s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ap-blob-1, .ap-blob-2, .ap-blob-3 { animation: none; }
        }
      `}</style>

      {/* ── Ambient background: deep navy-violet field + drifting aurora blobs ── */}
      <div className="absolute inset-0 -z-10 bg-[#07060f]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#181234_0%,_#0a0818_55%,_#07060f_100%)]" />
        <div className="ap-blob-1 absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-indigo-500/25 blur-[110px]" />
        <div className="ap-blob-2 absolute top-1/3 -right-24 h-[380px] w-[380px] rounded-full bg-emerald-500/15 blur-[110px]" />
        <div className="ap-blob-3 absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full bg-purple-500/20 blur-[110px]" />
      </div>

      <div className="relative flex h-full flex-col gap-6 p-5 md:p-7">
        {/* Header */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 text-indigo-300">
                <CreditCard size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">
                  {t("adminPayments.platformPayments")}
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  {t("adminPayments.monitorDescription")}
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={adminLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-xl px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.1] transition disabled:opacity-50"
            >
              <RefreshCw size={16} className={adminLoading ? "animate-spin" : ""} />
              {t("adminPayments.refresh")}
            </button>
          </div>

          {/* Summary cards */}
          {summaryCards.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 transition hover:bg-white/[0.06] hover:border-white/20"
                  >
                    <div className={`pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br ${card.glow} to-transparent blur-2xl`} />
                    <div className="relative flex items-start justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {card.label}
                      </p>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}>
                        <Icon size={15} />
                      </div>
                    </div>
                    <p className={`relative mt-3 text-2xl font-black font-mono ${card.accent}`}>
                      {card.value}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder={t("adminPayments.searchPlaceholder")}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-400/50 focus:outline-none focus:ring-1 focus:ring-indigo-400/50"
            />
          </div>

          <FilterDropdown
            value={typeFilter}
            onChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
            options={filterOptions}
          />
        </div>

        {/* Active filter chip row */}
        {typeFilter !== "all" && (
          <div className="-mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-500">Showing:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-400/10 backdrop-blur-sm border border-indigo-400/25 px-2.5 py-1 text-xs font-semibold text-indigo-200">
              <TypeIcon type={typeFilter} />
              {filterOptions.find((o) => o.value === typeFilter)?.label}
              <button
                onClick={() => setTypeFilter("all")}
                className="ml-1 text-indigo-300/70 hover:text-indigo-200"
                aria-label="Clear filter"
              >
                <XCircle size={13} />
              </button>
            </span>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.04] text-xs uppercase text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-semibold tracking-wider">{t("adminPayments.tableHeaders.date")}</th>
                <th className="px-4 py-3 font-semibold tracking-wider">{t("adminPayments.tableHeaders.user")}</th>
                <th className="px-4 py-3 font-semibold tracking-wider">{t("adminPayments.tableHeaders.type")}</th>
                <th className="px-4 py-3 font-semibold tracking-wider">{t("adminPayments.tableHeaders.description")}</th>
                <th className="px-4 py-3 font-semibold tracking-wider">{t("adminPayments.tableHeaders.amount")}</th>
                <th className="px-4 py-3 font-semibold tracking-wider">{t("adminPayments.tableHeaders.methodId")}</th>
                <th className="px-4 py-3 font-semibold tracking-wider text-right">{t("adminPayments.tableHeaders.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {adminLoading && adminTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-14 text-center text-slate-500">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2" />
                    {t("adminPayments.loading")}
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-4 py-14 text-center text-rose-300">
                    <AlertCircle className="mx-auto h-6 w-6 mb-2" />
                    {error}
                  </td>
                </tr>
              ) : adminTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-14 text-center">
                    <CreditCard className="mx-auto h-8 w-8 mb-3 text-slate-600" />
                    <p className="text-slate-500 font-medium">{t("adminPayments.noTransactions")}</p>
                    {typeFilter !== "all" && (
                      <button
                        onClick={() => setTypeFilter("all")}
                        className="mt-2 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                      >
                        Clear filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                adminTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-white/[0.04] transition">
                    <td className="px-4 py-3">
                      <div className="text-slate-300">{fmtDate(tx.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {tx.user ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-xs font-bold text-slate-300">
                            {tx.user.name?.slice(0, 2).toUpperCase() || <User size={14} />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{tx.user.name}</div>
                            <div className="text-xs text-slate-500">{tx.user.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">{t("adminPayments.deletedUser")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 capitalize font-medium">
                        <TypeIcon type={tx.type} />
                        {tx.type === "deposit" ? t("adminPayments.deposits") :
                          tx.type === "purchase" ? t("adminPayments.purchases") :
                            tx.type === "subscription" ? t("adminPayments.subscriptions") :
                              tx.type === "refund" ? t("adminPayments.refunds") :
                                tx.type === "coin_redeem" ? t("adminPayments.coinRedeems") :
                                  tx.type.replace("_", " ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-normal">
                      <div className="max-w-[280px] break-words leading-snug">
                        {tx.description || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-slate-100">
                        ₹{tx.amount?.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="text-slate-300 uppercase tracking-wider">{tx.paymentMethod}</div>
                      {tx.razorpayPaymentId && (
                        <div className="text-slate-500 mt-0.5">{tx.razorpayPaymentId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={tx.status} />
                      {tx.refundStatus && tx.refundStatus !== "none" && (
                        <div className="text-[10px] uppercase font-bold text-amber-400 mt-1">
                          {t("adminPayments.refundLabel")}: {tx.refundStatus}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {adminPagination && adminPagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 py-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-xl px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.08] transition disabled:opacity-40 disabled:hover:bg-white/[0.04]"
            >
              {t("adminPayments.pagination.prev")}
            </button>
            <span className="text-sm text-slate-400">
              {t("adminPayments.pagination.page")} <strong className="text-slate-200">{page}</strong> {t("adminPayments.pagination.of")} {adminPagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(adminPagination.pages, p + 1))}
              disabled={page === adminPagination.pages}
              className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-xl px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.08] transition disabled:opacity-40 disabled:hover:bg-white/[0.04]"
            >
              {t("adminPayments.pagination.next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}