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
  ChevronLeft,
  ChevronRight,
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
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-400/25">
          <CheckCircle size={12} /> {t("adminPayments.statusSuccess", "Success")}
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-400/10 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-rose-300 border border-rose-400/25">
          <XCircle size={12} /> {t("adminPayments.statusFailed", "Failed")}
        </span>
      );
    case "pending":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-400/25">
          <Clock size={12} /> {t("adminPayments.statusPending", "Pending")}
        </span>
      );
  }
};

const TYPE_META = {
  deposit: { icon: ArrowDownCircle, color: "text-emerald-300", bg: "bg-emerald-400/10" },
  purchase: { icon: ArrowUpCircle, color: "text-indigo-300", bg: "bg-indigo-400/10" },
  subscription: { icon: ArrowUpCircle, color: "text-indigo-300", bg: "bg-indigo-400/10" },
  refund: { icon: RefreshCw, color: "text-amber-300", bg: "bg-amber-400/10" },
  coin_redeem: { icon: CreditCard, color: "text-purple-300", bg: "bg-purple-400/10" },
};

const TypeIcon = ({ type }) => {
  const meta = TYPE_META[type];
  const Icon = meta?.icon ?? IndianRupee;
  return <Icon size={15} className={meta?.color ?? "text-slate-400"} />;
};

// ── Mobile Filter Dropdown ──
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
    <div className="relative w-full sm:w-auto" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Filter transactions"
        aria-expanded={open}
        className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 rounded-2xl border py-3 px-4 text-xs md:text-sm font-semibold backdrop-blur-xl transition active:scale-95
          ${active
            ? "border-indigo-400/40 bg-indigo-400/10 text-indigo-200"
            : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.07]"
          }`}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} />
          <span>{active ? activeLabel : "Filter"}</span>
        </div>
        {active && (
          <span className="h-2 w-2 rounded-full bg-indigo-400" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-full sm:w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#12122a] backdrop-blur-2xl shadow-2xl">
          <div className="px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
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
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs sm:text-sm transition
                    ${isActive
                      ? "bg-indigo-400/15 text-indigo-200 font-bold"
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
    { value: "all", label: t("adminPayments.allTypes", "All Types") },
    { value: "deposit", label: t("adminPayments.deposits", "Deposits") },
    { value: "purchase", label: t("adminPayments.purchases", "Purchases") },
    { value: "subscription", label: t("adminPayments.subscriptions", "Subscriptions") },
    { value: "refund", label: t("adminPayments.refunds", "Refunds") },
    { value: "coin_redeem", label: t("adminPayments.coinRedeems", "Coin Redeems") },
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
        label: t("adminPayments.totalVolume", "TOTAL VOLUME (SUCCESS)"),
        value: `₹${adminSummary.totalVolume?.toLocaleString("en-IN") || 0}`,
        accent: "text-emerald-300",
        icon: IndianRupee,
        iconBg: "bg-emerald-400/10",
        iconColor: "text-emerald-300",
        glow: "from-emerald-400/20",
      },
      {
        label: t("adminPayments.successfulTxns", "SUCCESSFUL TXNS"),
        value: adminSummary.successful || 0,
        accent: "text-slate-100",
        icon: CheckCircle,
        iconBg: "bg-indigo-400/10",
        iconColor: "text-indigo-300",
        glow: "from-indigo-400/20",
      },
      {
        label: t("adminPayments.pendingRefunds", "PENDING REFUNDS"),
        value: adminSummary.pendingRefunds || 0,
        accent: "text-amber-300",
        icon: Clock,
        iconBg: "bg-amber-400/10",
        iconColor: "text-amber-300",
        glow: "from-amber-400/20",
      },
      {
        label: t("adminPayments.processedRefunds", "PROCESSED REFUNDS"),
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
    <div className="relative rounded-3xl min-h-screen">
      <style>{`
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(4%, 6%) scale(1.08); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-5%, -4%) scale(1.05); }
        }
        .ap-blob-1 { animation: drift1 22s ease-in-out infinite; }
        .ap-blob-2 { animation: drift2 26s ease-in-out infinite; }
      `}</style>

      {/* ── Ambient background ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl bg-[#07060f]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#181234_0%,_#0a0818_55%,_#07060f_100%)]" />
        <div className="ap-blob-1 absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-indigo-500/25 blur-[110px]" />
        <div className="ap-blob-2 absolute top-1/3 -right-24 h-[380px] w-[380px] rounded-full bg-emerald-500/15 blur-[110px]" />
      </div>

      <div className="relative flex h-full flex-col gap-5 p-4 sm:p-6 md:p-8">
        {/* ── HEADER ── */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 text-indigo-300 shadow-md">
                <CreditCard size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  {t("adminPayments.platformPayments", "Platform Payments")}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                  {t("adminPayments.monitorDescription", "Monitor all Razorpay deposits, course purchases, and refunds.")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={adminLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-200 hover:bg-white/[0.1] active:scale-95 transition disabled:opacity-50"
            >
              <RefreshCw size={15} className={adminLoading ? "animate-spin" : ""} />
              {t("adminPayments.refresh", "Refresh")}
            </button>
          </div>

          {/* ── SUMMARY CARDS GRID ── */}
          {summaryCards.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-3.5 sm:p-4 transition hover:bg-white/[0.06]"
                  >
                    <div className={`pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-gradient-to-br ${card.glow} to-transparent blur-xl`} />
                    <div className="relative flex items-start justify-between gap-2">
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
                        {card.label}
                      </p>
                      <div className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
                        <Icon size={14} />
                      </div>
                    </div>
                    <p className={`relative mt-2 text-lg sm:text-2xl font-black font-mono tracking-tight ${card.accent}`}>
                      {card.value}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CONTROLS & FILTERS ── */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder={t("adminPayments.searchPlaceholder", "Search by user, email, or Razorpay ID…")}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition shadow-inner"
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

        {/* Active filter chip */}
        {typeFilter !== "all" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Showing:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-400/15 border border-indigo-400/30 px-3 py-1 text-xs font-bold text-indigo-200">
              <TypeIcon type={typeFilter} />
              {filterOptions.find((o) => o.value === typeFilter)?.label}
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className="ml-1 text-indigo-300 hover:text-white"
                aria-label="Clear filter"
              >
                <XCircle size={14} />
              </button>
            </span>
          </div>
        )}

        {/* ── MOBILE LIST VIEW (Under 768px) ── */}
        <div className="block md:hidden space-y-3">
          {adminLoading && adminTransactions.length === 0 ? (
            <div className="p-10 text-center text-slate-400 bg-white/[0.03] border border-white/10 rounded-2xl">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2 text-indigo-400" />
              <p className="text-xs font-semibold">{t("adminPayments.loading", "Loading transactions…")}</p>
            </div>
          ) : error ? (
            <div className="p-10 text-center text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <AlertCircle className="mx-auto h-6 w-6 mb-2" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
          ) : adminTransactions.length === 0 ? (
            <div className="p-10 text-center text-slate-400 bg-white/[0.03] border border-white/10 rounded-2xl space-y-2">
              <CreditCard className="mx-auto h-8 w-8 text-slate-500" />
              <p className="text-xs font-bold text-slate-300">{t("adminPayments.noTransactions", "No transactions found")}</p>
              {typeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setTypeFilter("all")}
                  className="text-xs font-bold text-indigo-400 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            adminTransactions.map((tx) => (
              <div
                key={tx._id}
                className="p-4 bg-white/[0.04] border border-white/10 rounded-2xl space-y-3 shadow-lg"
              >
                {/* Header: User Info & Amount */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
                      {tx.user?.name?.slice(0, 2).toUpperCase() || <User size={14} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {tx.user?.name || t("adminPayments.deletedUser", "Deleted User")}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {tx.user?.email || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-sm text-emerald-400">
                      ₹{tx.amount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Description & Type row */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 capitalize">
                      <TypeIcon type={tx.type} />
                      {tx.type === "deposit"
                        ? t("adminPayments.deposits", "Deposit")
                        : tx.type === "purchase"
                        ? t("adminPayments.purchases", "Purchase")
                        : tx.type === "subscription"
                        ? t("adminPayments.subscriptions", "Subscription")
                        : tx.type === "refund"
                        ? t("adminPayments.refunds", "Refund")
                        : tx.type.replace("_", " ")}
                    </span>
                    <StatusBadge status={tx.status} />
                  </div>

                  {tx.description && (
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                      {tx.description}
                    </p>
                  )}
                </div>

                {/* Footer: Date & Method ID */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                  <span>{fmtDate(tx.createdAt)}</span>
                  <span className="font-mono uppercase text-slate-400 truncate max-w-[150px]">
                    {tx.paymentMethod} {tx.razorpayPaymentId ? `· ${tx.razorpayPaymentId}` : ""}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── DESKTOP TABLE VIEW (768px and above) ── */}
        <div className="hidden md:block flex-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.04] text-xs uppercase text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3.5 font-bold tracking-wider">{t("adminPayments.tableHeaders.date", "DATE")}</th>
                <th className="px-4 py-3.5 font-bold tracking-wider">{t("adminPayments.tableHeaders.user", "USER")}</th>
                <th className="px-4 py-3.5 font-bold tracking-wider">{t("adminPayments.tableHeaders.type", "TYPE")}</th>
                <th className="px-4 py-3.5 font-bold tracking-wider">{t("adminPayments.tableHeaders.description", "DESCRIPTION")}</th>
                <th className="px-4 py-3.5 font-bold tracking-wider">{t("adminPayments.tableHeaders.amount", "AMOUNT")}</th>
                <th className="px-4 py-3.5 font-bold tracking-wider">{t("adminPayments.tableHeaders.methodId", "METHOD/ID")}</th>
                <th className="px-4 py-3.5 font-bold tracking-wider text-right">{t("adminPayments.tableHeaders.status", "STATUS")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {adminLoading && adminTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-14 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2 text-indigo-400" />
                    {t("adminPayments.loading", "Loading transactions…")}
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
                    <p className="text-slate-400 font-medium">{t("adminPayments.noTransactions", "No transactions found")}</p>
                    {typeFilter !== "all" && (
                      <button
                        type="button"
                        onClick={() => setTypeFilter("all")}
                        className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                      >
                        Clear filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                adminTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-white/[0.04] transition">
                    <td className="px-4 py-3.5 text-xs text-slate-300">
                      {fmtDate(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      {tx.user ? (
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-300 shrink-0">
                            {tx.user.name?.slice(0, 2).toUpperCase() || <User size={14} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 text-xs">{tx.user.name}</div>
                            <div className="text-[11px] text-slate-400">{tx.user.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-xs">{t("adminPayments.deletedUser", "Deleted User")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 capitalize font-semibold text-xs text-indigo-200">
                        <TypeIcon type={tx.type} />
                        {tx.type === "deposit" ? t("adminPayments.deposits", "Deposit") :
                          tx.type === "purchase" ? t("adminPayments.purchases", "Purchase") :
                            tx.type === "subscription" ? t("adminPayments.subscriptions", "Subscription") :
                              tx.type === "refund" ? t("adminPayments.refunds", "Refund") :
                                tx.type === "coin_redeem" ? t("adminPayments.coinRedeems", "Coin Redeem") :
                                  tx.type.replace("_", " ")}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-normal">
                      <div className="max-w-[280px] break-words text-xs leading-relaxed text-slate-300 font-medium">
                        {tx.description || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ₹{tx.amount?.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs">
                      <div className="text-slate-300 uppercase font-bold tracking-wider">{tx.paymentMethod}</div>
                      {tx.razorpayPaymentId && (
                        <div className="text-slate-500 text-[11px] mt-0.5">{tx.razorpayPaymentId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <StatusBadge status={tx.status} />
                      {tx.refundStatus && tx.refundStatus !== "none" && (
                        <div className="text-[10px] uppercase font-bold text-amber-400 mt-1">
                          {t("adminPayments.refundLabel", "Refund")}: {tx.refundStatus}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        {adminPagination && adminPagination.pages > 1 && (
          <div className="flex items-center justify-between sm:justify-center gap-4 py-2 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.08] active:scale-95 transition disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              {t("adminPayments.pagination.prev", "Previous")}
            </button>
            <span className="text-xs font-semibold text-slate-400">
              {t("adminPayments.pagination.page", "Page")} <strong className="text-white">{page}</strong> {t("adminPayments.pagination.of", "of")} {adminPagination.pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(adminPagination.pages, p + 1))}
              disabled={page === adminPagination.pages}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.08] active:scale-95 transition disabled:opacity-40"
            >
              {t("adminPayments.pagination.next", "Next")}
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}