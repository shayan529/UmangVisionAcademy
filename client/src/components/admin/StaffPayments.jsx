import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  WalletCards,
} from "lucide-react";
import api from "../../config/api";
import { hasPermission } from "../../utils/permissions";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

const statusClass = {
  success: "border-emerald-900/50 bg-emerald-950/30 text-emerald-300",
  pending: "border-amber-900/50 bg-amber-950/30 text-amber-300",
  failed: "border-red-900/50 bg-red-950/30 text-red-300",
  refunded: "border-cyan-900/50 bg-cyan-950/30 text-cyan-300",
  none: "border-slate-700 bg-slate-900 text-slate-400",
};

const StaffPayments = ({ user }) => {
  const canView = hasPermission(user, "payments", "view");
  const canRefund = hasPermission(user, "payments", "refund");
  const canExport = hasPermission(user, "payments", "export");
  const availableTabs = useMemo(
    () => [
      ...(canView
        ? [{ id: "payments", label: "Payment Records", icon: CreditCard }]
        : []),
      ...(canRefund
        ? [{ id: "refunds", label: "Refund Queue", icon: RotateCcw }]
        : []),
    ],
    [canRefund, canView],
  );

  const [tab, setTab] = useState(availableTabs[0]?.id || "payments");
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTransactions = useCallback(
    async (page = 1) => {
      if (availableTabs.length === 0) return;
      setLoading(true);
      setError("");
      try {
        const endpoint =
          tab === "refunds"
            ? "/wallet/admin/refunds"
            : "/wallet/admin/transactions";
        const { data } = await api.get(endpoint, {
          params: {
            page,
            limit: 20,
            search: search.trim() || undefined,
            type: tab === "payments" ? type : undefined,
          },
        });
        setTransactions(data.transactions || []);
        setSummary(data.summary || {});
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load payment records.",
        );
      } finally {
        setLoading(false);
      }
    },
    [availableTabs.length, search, tab, type],
  );

  useEffect(() => {
    const timer = setTimeout(() => loadTransactions(1), 250);
    return () => clearTimeout(timer);
  }, [loadTransactions]);

  const processRefund = async (transaction) => {
    const confirmed = window.confirm(
      `Credit ${formatMoney(transaction.amount)} to ${transaction.user?.name || "this user"}'s wallet and revoke the related access?`,
    );
    if (!confirmed) return;

    setProcessingId(transaction._id);
    setError("");
    setNotice("");
    try {
      const { data } = await api.post(
        `/wallet/admin/refunds/${transaction._id}/process`,
      );
      setNotice(data.message || "Refund processed.");
      await loadTransactions(pagination.page);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not process the refund.",
      );
    } finally {
      setProcessingId("");
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    setError("");
    try {
      const response = await api.get("/wallet/admin/export", {
        params: {
          search: search.trim() || undefined,
          type: tab === "payments" ? type : undefined,
          refundStatus: tab === "refunds" ? "pending" : undefined,
        },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not export payments.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            Finance Operations
          </p>
          <h2 className="text-2xl font-extrabold text-white">Payments</h2>
          <p className="mt-1 text-sm text-slate-400">
            Review transactions and handle approved wallet refunds.
          </p>
        </div>
        {canExport && (
          <button
            onClick={exportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            Export CSV
          </button>
        )}
      </div>

      {availableTabs.length > 0 && (
        <div className="inline-flex w-fit rounded-lg border border-slate-800 bg-slate-950 p-1">
          {availableTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold ${
                tab === id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Matched Volume",
            value: formatMoney(summary.totalVolume),
            icon: WalletCards,
          },
          {
            label: "Successful",
            value: summary.successful || 0,
            icon: CheckCircle2,
          },
          {
            label: "Pending Refunds",
            value: summary.pendingRefunds || 0,
            icon: RotateCcw,
          },
          {
            label: "Records",
            value: pagination.total || 0,
            icon: CreditCard,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
          >
            <Icon size={16} className="mb-3 text-indigo-400" />
            <div className="text-lg font-extrabold text-white">{value}</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-500">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, payment ID, or description"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>
        {tab === "payments" && (
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
          >
            <option value="all">All transaction types</option>
            <option value="purchase">Course purchases</option>
            <option value="subscription">Subscriptions</option>
            <option value="deposit">Deposits</option>
            <option value="refund">Refunds</option>
            <option value="coin_redeem">Coin redemptions</option>
            <option value="debit">Debits</option>
            <option value="credit">Credits</option>
          </select>
        )}
        <button
          onClick={() => loadTransactions(pagination.page)}
          title="Refresh payments"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-white"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-left">
          <thead className="bg-slate-950/80">
            <tr className="text-[10px] font-bold uppercase text-slate-500">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              {tab === "refunds" && <th className="px-4 py-3">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/30">
            {!loading &&
              transactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-slate-900/70">
                  <td className="px-4 py-3">
                    <div className="text-xs font-bold text-white">
                      {transaction.user?.name || "Unknown user"}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {transaction.user?.email ||
                        transaction.user?.phoneNumber ||
                        "-"}
                    </div>
                  </td>
                  <td className="max-w-[280px] px-4 py-3">
                    <div className="text-xs font-semibold capitalize text-slate-200">
                      {(transaction.type || "").replace("_", " ")} ·{" "}
                      {transaction.paymentMethod || "wallet"}
                    </div>
                    <div
                      className="mt-1 truncate text-[11px] text-slate-500"
                      title={transaction.description}
                    >
                      {transaction.description || "No description"}
                    </div>
                    {transaction.refundReason && (
                      <div className="mt-1 text-[11px] text-amber-300">
                        Reason: {transaction.refundReason}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-extrabold text-white">
                    {formatMoney(transaction.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <span
                        className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${statusClass[transaction.status] || statusClass.none}`}
                      >
                        {transaction.status}
                      </span>
                      {transaction.refundStatus !== "none" && (
                        <span
                          className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${statusClass[transaction.refundStatus] || statusClass.none}`}
                        >
                          {transaction.refundStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                    {formatDate(
                      transaction.refundRequestedAt || transaction.createdAt,
                    )}
                  </td>
                  {tab === "refunds" && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => processRefund(transaction)}
                        disabled={processingId === transaction._id}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
                      >
                        {processingId === transaction._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RotateCcw size={14} />
                        )}
                        Refund to Wallet
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            {loading && (
              <tr>
                <td
                  colSpan={tab === "refunds" ? 6 : 5}
                  className="px-4 py-14 text-center text-sm text-slate-400"
                >
                  <Loader2
                    size={22}
                    className="mx-auto mb-2 animate-spin text-indigo-400"
                  />
                  Loading finance records...
                </td>
              </tr>
            )}
            {!loading && transactions.length === 0 && (
              <tr>
                <td
                  colSpan={tab === "refunds" ? 6 : 5}
                  className="px-4 py-14 text-center text-sm text-slate-500"
                >
                  {tab === "refunds"
                    ? "No pending refund requests."
                    : "No payment records match these filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          Page {pagination.page} of {pagination.pages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => loadTransactions(pagination.page - 1)}
            disabled={loading || pagination.page <= 1}
            title="Previous page"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 disabled:opacity-40"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => loadTransactions(pagination.page + 1)}
            disabled={loading || pagination.page >= pagination.pages}
            title="Next page"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 disabled:opacity-40"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffPayments;
