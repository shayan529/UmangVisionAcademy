import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchWallet,
    createDepositOrder,
    verifyDeposit,
    mockDeposit,
    clearWalletError,
} from "../../redux/slices/walletSlice";
import { useTranslation } from "react-i18next";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

const fmtDate = (d) =>
    new Date(d).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

const TYPE_META = {
    deposit: { label: "Deposit", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: "↓" },
    purchase: { label: "Purchase", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: "↑" },
    refund: { label: "Refund", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "↩" },
};

const isDev = import.meta.env.DEV;

// ── Load Razorpay script once ─────────────────────────────────────────────────
const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });

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

        const loaded = await loadRazorpay();
        if (!loaded) { alert("Razorpay failed to load. Check your internet."); return; }

        let orderData;
        try {
            orderData = await dispatch(createDepositOrder(amt)).unwrap();
        } catch { return; }

        const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Umang Vision Academy",
            description: "Wallet Top-up",
            order_id: orderData.orderId,
            prefill: {
                name: currentUser?.name || "",
                email: currentUser?.email || "",
            },
            theme: { color: "#7c3aed" },
            handler: async (response) => {
                try {
                    await dispatch(verifyDeposit({
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                        amount: orderData.amount,
                    })).unwrap();
                    setSuccessMsg(`${fmt(amt)} added to your wallet!`);
                    dispatch(fetchWallet());
                    setAmount("");
                } catch (e) {
                    console.error(e);
                }
            },
            modal: { ondismiss: () => { } },
        };

        new window.Razorpay(options).open();
    }, [amount, currentUser, dispatch]);

    const { t } = useTranslation()

    const handleMock = useCallback(async () => {
        const amt = Number(mockAmount);
        if (!amt || amt < 1) return;
        try {
            await dispatch(mockDeposit(amt)).unwrap();
            setSuccessMsg(`₹${amt} added (mock).`);
            dispatch(fetchWallet());
            setMockAmount("500");
        } catch { }
    }, [mockAmount, dispatch]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        >
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h2 className="text-white font-bold text-lg">{t("wallet.addMoneyTitle")}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl transition">✕</button>
                </div>

                <div className="p-6 space-y-5">
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
                            <button onClick={() => dispatch(clearWalletError())} className="ml-auto text-red-400 hover:text-red-300">✕</button>
                        </div>
                    )}

                    {/* ── Razorpay section ── */}
                    <div className="space-y-3">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{t("wallet.payViaRazorpay")}</p>

                        {/* Quick amounts */}
                        <div className="grid grid-cols-3 gap-2">
                            {QUICK_AMOUNTS.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => setAmount(String(q))}
                                    className={`py-2 rounded-xl text-sm font-semibold border transition ${amount === String(q)
                                        ? "bg-purple-600 border-purple-500 text-white"
                                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-500/50 hover:text-white"
                                        }`}
                                >
                                    ₹{q}
                                </button>
                            ))}
                        </div>

                        {/* Custom amount */}
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                            <input
                                type="number"
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
                            {depositLoading ? "Processing…" : `${amount ? fmt(Number(amount)) : ""} ${t("wallet.payViaRazorpay")}`}
                        </button>
                    </div>

                    {/* ── Mock section (dev only) ── */}
                    {isDev && (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-slate-800" />
                                <span className="text-slate-600 text-xs">DEV ONLY</span>
                                <div className="flex-1 h-px bg-slate-800" />
                            </div>

                            <div className="space-y-3 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-800/40">
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Mock Deposit (no payment)</p>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                        <input
                                            type="number"
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
    const isCredit = tx.type === "deposit" || tx.type === "refund";

    return (
        <div className={`flex items-center gap-4 p-4 rounded-xl border ${meta.bg} ${meta.border} transition hover:brightness-110`}>
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${meta.bg} border ${meta.border} ${meta.color} shrink-0`}>
                {meta.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{tx.description || meta.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{fmtDate(tx.createdAt)}</p>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
                <p className={`font-bold text-sm ${meta.color}`}>
                    {isCredit ? "+" : "−"}{fmt(tx.amount)}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.bg} ${meta.border} ${meta.color}`}>
                    {meta.label}
                </span>
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const StudentWallet = ({ currentUser, showToast }) => {
    const dispatch = useDispatch();
    const { balance, transactions, loading } = useSelector((s) => s.wallet);
    const [depositOpen, setDepositOpen] = useState(false);
    const [filter, setFilter] = useState("all"); // all | deposit | purchase | refund
    const { t } = useTranslation()

    useEffect(() => {
        dispatch(fetchWallet());
    }, [dispatch]);

    const filtered = filter === "all"
        ? transactions
        : transactions.filter((t) => t.type === filter);

    const totalDeposited = transactions.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
    const totalSpent = transactions.filter((t) => t.type === "purchase").reduce((s, t) => s + t.amount, 0);

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {depositOpen && (
                <DepositModal
                    onClose={() => { setDepositOpen(false); dispatch(fetchWallet()); }}
                    currentUser={currentUser}
                />
            )}

            {/* ── Page title ── */}
            <div>
                <h1 className="text-3xl font-bold text-white">{t("wallet.title")}</h1>
                <p className="text-slate-400 mt-1 text-sm">{t("wallet.subtitle")}</p>
            </div>

            {/* ── Balance card ── */}
            <div
                className="relative rounded-2xl p-6 overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    boxShadow: "0 0 40px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
            >
                {/* Decorative glow orb */}
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />

                <p className="text-slate-400 text-sm font-medium mb-1">{t("wallet.availableBalance")}</p>
                {loading ? (
                    <div className="h-12 w-40 bg-slate-700/50 rounded-xl animate-pulse" />
                ) : (
                    <p className="text-5xl font-extrabold text-white tracking-tight">{fmt(balance)}</p>
                )}

                {/* Stats row */}
                <div className="flex gap-6 mt-5 pt-5 border-t border-white/10">
                    <div>
                        <p className="text-slate-400 text-xs">{t("wallet.totalDeposited")}</p>
                        <p className="text-green-400 font-bold text-sm mt-0.5">{fmt(totalDeposited)}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">{t("wallet.totalSpent")}</p>
                        <p className="text-red-400 font-bold text-sm mt-0.5">{fmt(totalSpent)}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">{t("wallet.transactions")}</p>
                        <p className="text-slate-200 font-bold text-sm mt-0.5">{transactions.length}</p>
                    </div>
                </div>

                {/* Add money button */}
                <button
                    onClick={() => setDepositOpen(true)}
                    className="mt-5 px-6 py-2.5 rounded-xl font-bold text-sm transition hover:scale-105 active:scale-95"
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {/* Header + filter tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-800">
                    <h2 className="text-white font-bold"> {t("wallet.transactionHistory")}</h2>
                    <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
                        {["all", "deposit", "purchase", "refund"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${filter === f
                                    ? "bg-purple-600 text-white"
                                    : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
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
                            <div key={i} className="h-16 rounded-xl bg-slate-800 animate-pulse" />
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-4xl mb-3">🪙</p>
                            <p className="text-slate-400 text-sm">
                                {filter === "all" ? t("wallet.noTransactions") : `${t("wallet.no")} ${filter} ${t("wallet.transactions")}.`}
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