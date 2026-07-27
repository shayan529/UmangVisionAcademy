import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWallet,
  createDepositOrder,
  verifyDeposit,
  mockDeposit,
  clearWalletError,
} from "../../redux/slices/walletSlice";
import { loadCurrentUser } from "../../redux/slices/authSlice";
import { useTranslation } from "react-i18next";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

const TYPE_META = {
  deposit: {
    label: "Deposit",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    icon: "↓",
  },
  purchase: {
    label: "Purchase",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: "↑",
  },
  refund: {
    label: "Refund",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: "↩",
  },
  coin_redeem: {
    label: "Coin Redeem",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    icon: "🪙",
  },
};

// Conversion rate: 25 coins = ₹1
const COINS_PER_RUPEE = 25;
const coinsToRupees = (c) => parseFloat((c / COINS_PER_RUPEE).toFixed(2));
const rupeesToCoins = (r) => Math.ceil(r * COINS_PER_RUPEE);

const isDev = import.meta.env.DEV;

// ── Coin Redeem Modal ─────────────────────────────────────────────────────────
const CoinRedeemModal = ({ onClose, currentUser, onRedeem }) => {
  const availableCoins = currentUser?.coins ?? 0;
  const [coinsToRedeem, setCoinsToRedeem] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const numCoins = Number(coinsToRedeem) || 0;
  const rupeesEarned = coinsToRupees(numCoins);
  const isValid = numCoins >= COINS_PER_RUPEE && numCoins <= availableCoins;

  const QUICK_COINS = [10, 50, 100, 250].filter((c) => c <= availableCoins);

  const handleRedeem = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      await onRedeem(numCoins);
      setSuccessMsg(
        `🪙 ${numCoins} coins redeemed → ${fmt(rupeesEarned)} added to your wallet!`,
      );
      setCoinsToRedeem("");
    } catch (e) {
      setError(e?.message || "Redemption failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isValid, numCoins, rupeesEarned, onRedeem]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0"
          style={{ background: "rgba(234,179,8,0.08)" }}
        >
          <div>
            <h2 className="text-white font-bold text-lg">🪙 Redeem Coins</h2>
            <p className="text-yellow-600 text-xs mt-0.5">
              25 coins = ₹1 wallet balance
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl transition"
          >
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          {/* Available coins banner */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{
              background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(202,138,4,0.4)",
            }}
          >
            <span className="text-yellow-300 text-sm font-semibold">
              Your coin balance
            </span>
            <span className="text-yellow-400 font-bold text-lg">
              🪙 {availableCoins.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Success */}
          {successMsg && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <span className="text-lg">✓</span> {successMsg}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span>⚠️</span> {error}
              <button onClick={() => setError("")} className="ml-auto">
                ✕
              </button>
            </div>
          )}

          {/* Quick coin amounts */}
          {QUICK_COINS.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Quick redeem
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK_COINS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCoinsToRedeem(String(c))}
                    className={`py-2 rounded-xl text-sm font-semibold border transition ${
                      coinsToRedeem === String(c)
                        ? "border-yellow-500 text-yellow-300"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-yellow-500/50 hover:text-yellow-300"
                    }`}
                    style={
                      coinsToRedeem === String(c)
                        ? { background: "rgba(234,179,8,0.15)" }
                        : {}
                    }
                  >
                    🪙{c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom input */}
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Enter coins to redeem
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500">
                🪙
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={coinsToRedeem}
                onChange={(e) => setCoinsToRedeem(e.target.value)}
                placeholder={`Min ${COINS_PER_RUPEE} coins`}
                min={COINS_PER_RUPEE}
                max={availableCoins}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
              />
            </div>
          </div>

          {/* Live preview */}
          {numCoins > 0 && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl flex-wrap gap-2"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.4)",
              }}
            >
              <div className="text-slate-300 text-sm">
                🪙 <span className="font-bold text-white">{numCoins}</span>{" "}
                coins
                <span className="text-slate-500 mx-2">→</span>
                💰{" "}
                <span className="font-bold text-purple-300">
                  {fmt(rupeesEarned)}
                </span>
              </div>
              {numCoins > availableCoins && (
                <span className="text-red-400 text-xs">Exceeds balance</span>
              )}
            </div>
          )}

          {/* Redeem button */}
          <button
            onClick={handleRedeem}
            disabled={!isValid || loading || !!successMsg}
            className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #ca8a04, #eab308)",
              color: "#1c1917",
              boxShadow: isValid ? "0 0 20px rgba(234,179,8,0.2)" : "none",
            }}
          >
            {loading
              ? "Redeeming…"
              : successMsg
                ? "Redeemed ✓"
                : numCoins > 0 && isValid
                  ? `Redeem ${numCoins} coins → ${fmt(rupeesEarned)}`
                  : "Redeem Coins"}
          </button>

          <p className="text-slate-600 text-xs text-center">
            Minimum redemption: {COINS_PER_RUPEE} coins (₹1) · Coins are
            non-transferable
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Deposit Modal ─────────────────────────────────────────────────────────────
const DepositModal = ({ onClose, currentUser }) => {
  const dispatch = useDispatch();
  const { depositLoading, error } = useSelector((s) => s.wallet);
  const [amount, setAmount] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [mockAmount, setMockAmount] = useState("500");

  const handleRazorpay = useCallback(async () => {
    const amt = Number(amount);
    if (!amt || amt < 10) return;

    try {
      await dispatch(mockDeposit(amt)).unwrap();
      setSuccessMsg(`${fmt(amt)} added to your wallet!`);
      dispatch(fetchWallet());
      setAmount("");
    } catch (e) {
      console.error(e);
    }
  }, [amount, dispatch]);

  const { t } = useTranslation();

  const handleMock = useCallback(async () => {
    const amt = Number(mockAmount);
    if (!amt || amt < 1) return;
    try {
      await dispatch(mockDeposit(amt)).unwrap();
      setSuccessMsg(`₹${amt} added (mock).`);
      dispatch(fetchWallet());
      setMockAmount("500");
    } catch {}
  }, [mockAmount, dispatch]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <h2 className="text-white font-bold text-lg">
            {t("wallet.addMoneyTitle")}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl transition"
          >
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          {successMsg && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <span className="text-lg">✓</span> {successMsg}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span>⚠️</span> {error}
              <button
                onClick={() => dispatch(clearWalletError())}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              {t("wallet.payViaRazorpay")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className={`py-2 rounded-xl text-sm font-semibold border transition ${
                    amount === String(q)
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-500/50 hover:text-white"
                  }`}
                >
                  ₹{q}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                ₹
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("wallet.enterCustomAmount")}
                min={10}
                max={50000}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition"
              />
            </div>
            <button
              onClick={handleRazorpay}
              disabled={!amount || Number(amount) < 10 || depositLoading}
              className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(124,58,237,.3)",
              }}
            >
              {depositLoading
                ? "Processing…"
                : `${amount ? fmt(Number(amount)) : ""} ${t("wallet.payViaRazorpay")}`}
            </button>
          </div>

          {isDev && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-slate-600 text-xs">DEV ONLY</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
              <div className="space-y-3 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-800/40">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  Mock Deposit (no payment)
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={mockAmount}
                      onChange={(e) => setMockAmount(e.target.value)}
                      min={1}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition"
                    />
                  </div>
                  <button
                    onClick={handleMock}
                    disabled={depositLoading}
                    className="px-4 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/30 transition disabled:opacity-40"
                  >
                    {depositLoading ? "…" : "Add Mock"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Transaction Row ───────────────────────────────────────────────────────────
const TxRow = ({ tx }) => {
  const meta = TYPE_META[tx.type] || TYPE_META.deposit;
  const isCredit =
    tx.type === "deposit" || tx.type === "refund" || tx.type === "coin_redeem";

  return (
    <div
      className={`w-full flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border ${meta.bg} ${meta.border} transition hover:brightness-110`}
    >
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold ${meta.bg} border ${meta.border} ${meta.color} shrink-0`}
      >
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs sm:text-sm font-semibold truncate break-words">
          {tx.description || meta.label}
        </p>
        <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5 break-words">
          {fmtDate(tx.createdAt)}
        </p>
      </div>
      <div className="w-full sm:w-auto text-right self-stretch sm:self-auto flex flex-col items-start sm:items-end gap-1 min-w-0">
        <p className={`font-bold text-xs sm:text-sm ${meta.color} break-words`}>
          {isCredit ? "+" : "−"}
          {fmt(tx.amount)}
        </p>
        <span
          className={`text-[9px] sm:text-xs px-2 py-0.5 rounded-full border ${meta.bg} ${meta.border} ${meta.color}`}
        >
          {meta.label}
        </span>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const StudentWallet = ({ showToast }) => {
  const dispatch = useDispatch();
  const { balance, transactions, loading } = useSelector((s) => s.wallet);
  const { user: currentUser } = useSelector((s) => s.auth);
  const [depositOpen, setDepositOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const { t } = useTranslation();

  const availableCoins = currentUser?.coins ?? 0;

  useEffect(() => {
    dispatch(fetchWallet());
  }, [dispatch]);

  // Lock body scroll while a modal is open (mobile bottom-sheet feel)
  useEffect(() => {
    if (depositOpen || redeemOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [depositOpen, redeemOpen]);

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((tx) => tx.type === filter);

  const totalDeposited = transactions
    .filter((tx) => tx.type === "deposit")
    .reduce((s, tx) => s + tx.amount, 0);
  const totalSpent = transactions
    .filter((tx) => tx.type === "purchase")
    .reduce((s, tx) => s + tx.amount, 0);

  // Call your backend to redeem coins — adjust the API call to match your actual route
  const handleCoinRedeem = useCallback(
    async (coins) => {
      const response = await fetch("/api/wallet/redeem-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ coins }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Redemption failed");
      dispatch(fetchWallet());
      dispatch(loadCurrentUser());
      return data;
    },
    [dispatch],
  );

  return (
    <div className="w-full max-w-full min-w-0 p-4 sm:p-6 sm:max-w-3xl mx-auto space-y-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] overflow-x-hidden overflow-hidden">
      {depositOpen && (
        <DepositModal
          onClose={() => {
            setDepositOpen(false);
            dispatch(fetchWallet());
          }}
          currentUser={currentUser}
        />
      )}
      {redeemOpen && (
        <CoinRedeemModal
          onClose={() => {
            setRedeemOpen(false);
            dispatch(fetchWallet());
          }}
          currentUser={currentUser}
          onRedeem={handleCoinRedeem}
        />
      )}

      {/* Page title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {t("wallet.title")}
        </h1>
        <p className="text-slate-400 mt-1 text-xs sm:text-sm">
          {t("wallet.subtitle")}
        </p>
      </div>

      {/* ── Coin Balance Card ── */}
      <div
        className="relative rounded-2xl p-4 sm:p-5 overflow-hidden min-w-0 w-full"
        style={{
          background:
            "linear-gradient(135deg, #1c1a0e 0%, #292205 40%, #0f172a 100%)",
          border: "1px solid rgba(202,138,4,0.35)",
          boxShadow:
            "0 0 30px rgba(234,179,8,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #eab308, transparent 70%)",
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <p className="text-yellow-700 text-xs font-semibold uppercase tracking-wider mb-1">
              Your Coins
            </p>
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-extrabold text-yellow-400">
                🪙 {availableCoins.toLocaleString("en-IN")}
              </span>
              <span className="text-yellow-700 text-xs sm:text-sm shrink-0">
                ≈ {fmt(coinsToRupees(availableCoins))}
              </span>
            </div>
            <p className="text-yellow-800 text-[10px] sm:text-xs mt-1">
              25 coins = ₹1 wallet balance
            </p>
          </div>
          <button
            onClick={() => setRedeemOpen(true)}
            disabled={availableCoins < COINS_PER_RUPEE}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-center"
            style={{
              background: "linear-gradient(135deg, #ca8a04, #eab308)",
              color: "#1c1917",
            }}
          >
            Redeem Coins →
          </button>
        </div>

        {/* How to earn */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 pt-4 border-t border-yellow-900/40">
          {[
            { icon: "📅", label: "Daily login", val: "+1 coin" },
            { icon: "📚", label: "Course done", val: "+25 coins" },
            { icon: "🏆", label: "Certificate", val: "+25 coins" },
          ].map(({ icon, label, val }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xl sm:text-base shrink-0">{icon}</span>
              <div>
                <p className="text-yellow-800 text-xs">{label}</p>
                <p className="text-yellow-500 text-xs font-bold">{val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Wallet Balance Card ── */}
      <div
        className="relative rounded-2xl p-5 sm:p-6 overflow-hidden min-w-0 w-full"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%)",
          border: "1px solid rgba(124,58,237,0.3)",
          boxShadow:
            "0 0 40px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #7c3aed, transparent 70%)",
          }}
        />

        <p className="text-slate-400 text-xs sm:text-sm font-medium mb-1">
          {t("wallet.availableBalance")}
        </p>
        {loading ? (
          <div className="h-10 sm:h-12 w-32 sm:w-40 bg-slate-700/50 rounded-xl animate-pulse" />
        ) : (
          <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            {fmt(balance)}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10">
          <div className="min-w-0">
            <p className="text-slate-400 text-[10px] sm:text-xs">
              {t("wallet.totalDeposited")}
            </p>
            <p className="text-green-400 font-bold text-xs sm:text-sm mt-0.5">
              {fmt(totalDeposited)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] sm:text-xs">
              {t("wallet.totalSpent")}
            </p>
            <p className="text-red-400 font-bold text-xs sm:text-sm mt-0.5">
              {fmt(totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] sm:text-xs">
              {t("wallet.transactions")}
            </p>
            <p className="text-slate-200 font-bold text-xs sm:text-sm mt-0.5">
              {transactions.length}
            </p>
          </div>
        </div>

        <button
          onClick={() => setDepositOpen(true)}
          className="mt-5 w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition hover:scale-105 active:scale-95 text-center"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
            color: "#fff",
            boxShadow: "0 0 20px rgba(124,58,237,0.4)",
          }}
        >
          {t("wallet.addMoney")}
        </button>
      </div>

      {/* ── Transaction history ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <h2 className="text-white font-bold">
            {t("wallet.transactionHistory")}
          </h2>
          <div className="relative -mx-1 sm:mx-0 w-full sm:w-auto">
            <div
              className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-xl overflow-x-auto max-w-full scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {["all", "deposit", "purchase", "refund", "coin_redeem"].map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                      filter === f
                        ? "bg-purple-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {f === "coin_redeem" ? "Coins" : f}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        <div
          className="p-4 space-y-3"
          style={{
            maxHeight: 380,
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#334155 transparent",
          }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-slate-800 animate-pulse"
              />
            ))
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">🪙</p>
              <p className="text-slate-400 text-sm">
                {filter === "all"
                  ? t("wallet.noTransactions")
                  : `No ${filter === "coin_redeem" ? "coin redemption" : filter} transactions.`}
              </p>
            </div>
          ) : (
            filtered.map((tx) => <TxRow key={tx._id || tx.createdAt} tx={tx} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentWallet;
