import { useEffect, useState, useMemo } from "react";
import api from "../../config/api.js";

// ── Type metadata ─────────────────────────────────────────────────────────────
const TYPE_META = {
  purchase: {
    label: "Course Purchase",
    icon: "🛒",
    color: "#f87171",
    bg: "#1c0a00",
    border: "#431407",
    sign: "-",
  },
  subscription: {
    label: "Subscription",
    icon: "⭐",
    color: "#fbbf24",
    bg: "#1c1005",
    border: "#854d0e",
    sign: "-",
  },
  deposit: {
    label: "Wallet Top-up",
    icon: "💰",
    color: "#4ade80",
    bg: "#052e16",
    border: "#166534",
    sign: "+",
  },
  coin_redeem: {
    label: "Coin Redemption",
    icon: "🪙",
    color: "#22d3ee",
    bg: "#04212b",
    border: "#0e7490",
    sign: "+",
  },
  refund: {
    label: "Refund",
    icon: "↩️",
    color: "#34d399",
    bg: "#052e16",
    border: "#166534",
    sign: "+",
  },
  default: {
    label: "Transaction",
    icon: "💳",
    color: "#94a3b8",
    bg: "#111827",
    border: "#1e293b",
    sign: "",
  },
};

const PAYMENT_METHOD_LABEL = {
  razorpay: "Razorpay",
  wallet: "Wallet",
  internal: "Coins",
};

const getMeta = (type = "") => TYPE_META[type] ?? TYPE_META.default;

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRupees = (n) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "purchase", label: "Course Purchases" },
  { key: "subscription", label: "Subscriptions" },
  { key: "deposit", label: "Top-ups" },
  { key: "coin_redeem", label: "Coin Redemptions" },
];

// ── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ w = "100%", h = 18, radius = 8, style = {} }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: radius,
      background: "linear-gradient(90deg,#1e293b 25%,#263348 50%,#1e293b 75%)",
      backgroundSize: "200% 100%",
      animation: "phShimmer 1.4s infinite",
      ...style,
    }}
  />
);

// ── Transaction row ────────────────────────────────────────────────────────────
const TransactionRow = ({ txn, onRequestRefund, requesting }) => {
  const meta = getMeta(txn.type);
  const isSuccess = (txn.status ?? "success") === "success";
  const methodLabel = PAYMENT_METHOD_LABEL[txn.paymentMethod] ?? null;
  const refundStatus = txn.refundStatus || "none";
  const canRequestRefund =
    isSuccess &&
    ["purchase", "subscription"].includes(txn.type) &&
    refundStatus === "none";

  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1e293b",
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        animation: "phFadeIn 0.25s ease",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: meta.bg,
          border: `1px solid ${meta.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {meta.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#e2e8f0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 3,
          }}
        >
          {txn.description || meta.label}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: meta.color,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
              padding: "2px 8px",
              borderRadius: 20,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {meta.label}
          </span>
          {methodLabel && (
            <span style={{ fontSize: 11, color: "#475569" }}>
              via {methodLabel}
            </span>
          )}
          <span style={{ fontSize: 11, color: "#64748b" }}>
            {formatDate(txn.createdAt)}
          </span>
          {!isSuccess && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fb923c" }}>
              {txn.status}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: meta.color,
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {meta.sign}
        {formatRupees(txn.amount)}
        {refundStatus !== "none" && (
          <div
            style={{
              marginTop: 6,
              color: refundStatus === "refunded" ? "#34d399" : "#fbbf24",
              fontSize: 10,
              fontWeight: 700,
              textAlign: "right",
              textTransform: "uppercase",
            }}
          >
            Refund {refundStatus}
          </div>
        )}
        {canRequestRefund && (
          <button
            onClick={() => onRequestRefund(txn)}
            disabled={requesting}
            style={{
              display: "block",
              marginTop: 7,
              marginLeft: "auto",
              padding: "5px 9px",
              borderRadius: 7,
              border: "1px solid #7c3aed",
              background: "#1e1b4b",
              color: "#c4b5fd",
              fontSize: 10,
              fontWeight: 700,
              cursor: requesting ? "not-allowed" : "pointer",
              opacity: requesting ? 0.6 : 1,
            }}
          >
            {requesting ? "Requesting..." : "Request refund"}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function PurchaseHistory() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [requestingId, setRequestingId] = useState("");

  const loadHistory = () => {
    setLoading(true);
    setError("");
    api
      .get("/wallet")
      .then(({ data }) => {
        setTransactions(data.transactions ?? []);
        setBalance(data.balance ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || "Failed to load purchase history.",
        );
        setLoading(false);
      });
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const counts = useMemo(() => {
    const c = {
      all: transactions.length,
      purchase: 0,
      subscription: 0,
      deposit: 0,
      coin_redeem: 0,
    };
    transactions.forEach((t) => {
      if (c[t.type] !== undefined) c[t.type] += 1;
    });
    return c;
  }, [transactions]);

  const totals = useMemo(() => {
    const successful = transactions.filter(
      (t) => (t.status ?? "success") === "success",
    );
    return {
      spentOnCourses: successful
        .filter((t) => t.type === "purchase")
        .reduce((s, t) => s + (t.amount ?? 0), 0),
      spentOnSubscriptions: successful
        .filter((t) => t.type === "subscription")
        .reduce((s, t) => s + (t.amount ?? 0), 0),
      added: successful
        .filter((t) => t.type === "deposit")
        .reduce((s, t) => s + (t.amount ?? 0), 0),
      redeemed: successful
        .filter((t) => t.type === "coin_redeem")
        .reduce((s, t) => s + (t.amount ?? 0), 0),
    };
  }, [transactions]);

  const filtered =
    activeFilter === "all"
      ? transactions
      : transactions.filter((t) => t.type === activeFilter);

  const requestRefund = async (transaction) => {
    const reason = window.prompt(
      "Why are you requesting a refund? This will be reviewed by staff.",
      "",
    );
    if (reason === null) return;

    setRequestingId(transaction._id);
    setError("");
    try {
      await api.post(`/wallet/refunds/${transaction._id}/request`, {
        reason: reason.trim(),
      });
      loadHistory();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit refund request.",
      );
    } finally {
      setRequestingId("");
    }
  };

  return (
    <div>
      <style>{`
        @keyframes phShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes phFadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        .ph-tab:hover { background:#1e293b !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>
          Purchase History
        </h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          {loading
            ? "Loading…"
            : balance !== null
              ? `Current wallet balance: ${formatRupees(balance)}`
              : "Every amount you've paid on the platform, in one place"}
        </p>
      </div>

      {/* Summary stats */}
      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 12,
            marginBottom: 22,
          }}
        >
          {[
            {
              label: "Spent on Courses",
              value: totals.spentOnCourses,
              color: "#f87171",
            },
            {
              label: "Spent on Subscriptions",
              value: totals.spentOnSubscriptions,
              color: "#fbbf24",
            },
            { label: "Added to Wallet", value: totals.added, color: "#4ade80" },
            {
              label: "From Coin Redemptions",
              value: totals.redeemed,
              color: "#22d3ee",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 16,
                padding: "16px 18px",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>
                {formatRupees(s.value)}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              className="ph-tab"
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: active ? "1px solid #7c3aed" : "1px solid #1e293b",
                background: active ? "#1e1b4b" : "#111827",
                color: active ? "#a78bfa" : "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
            >
              {f.label}
              {!loading && (
                <span style={{ marginLeft: 6, opacity: 0.6 }}>
                  {counts[f.key] ?? 0}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                gap: 14,
                alignItems: "center",
              }}
            >
              <Skeleton w={40} h={40} radius={10} />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <Skeleton w="50%" h={13} />
                <Skeleton w="30%" h={11} />
              </div>
              <Skeleton w={70} h={16} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          style={{
            background: "#111827",
            border: "1px dashed #431407",
            borderRadius: 20,
            padding: "32px 20px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#f87171", fontWeight: 600, marginBottom: 12 }}>
            {error}
          </p>
          <button
            onClick={loadHistory}
            style={{
              padding: "9px 18px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: "#111827",
            border: "1px dashed #334155",
            borderRadius: 20,
            padding: "40px 20px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>🧾</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#e2e8f0",
              marginBottom: 4,
            }}
          >
            No transactions yet
          </div>
          <div style={{ fontSize: 12, maxWidth: 360, margin: "0 auto" }}>
            {activeFilter === "all"
              ? "Your purchases, subscriptions, top-ups, and redemptions will show up here."
              : "Nothing matches this filter yet."}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((txn) => (
              <TransactionRow
                key={txn._id ?? `${txn.type}-${txn.createdAt}`}
                txn={txn}
                onRequestRefund={requestRefund}
                requesting={requestingId === txn._id}
              />
            ))}
          </div>
          <p
            style={{
              fontSize: 11,
              color: "#475569",
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Showing your most recent {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}.
          </p>
        </>
      )}
    </div>
  );
}
