import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import SEO from "../components/common/SEO";
import { hasBaseRole } from "../utils/permissions";
import {
  addToCart,
  removeFromCart,
  fetchAvailableCourses,
  fetchCart,
  resetCheckout,
  checkoutAndEnroll,
} from "../redux/slices/cartSlice";
import {
  verifyPayment,
  createOrder,
  fetchSubscription,
} from "../redux/slices/billingSlice";
import { fetchWallet, payWithWallet } from "../redux/slices/walletSlice";
import {
  Trash2,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  X,
  Star,
  Clock,
  Users,
  CheckCircle,
  Loader2,
  BookOpen,
  Wallet,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const instructorName = (i) =>
  i?.name ??
  i?.email?.split("@")[0] ??
  (typeof i === "string" ? i : "Instructor");

const fmt = (n) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

// ── Sub-components ────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />
);

const SuccessOverlay = ({ count, purchasedCourses = [], onClose, onGoToDashboard, t }) => {
  const displayCount = Math.max(count, purchasedCourses.length, 1);
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-4 modal-bg">
      <div
        style={{ animation: "fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
        className="relative flex flex-col items-center gap-6 rounded-[28px] border border-emerald-500/25 bg-gradient-to-b from-[#0c1830] via-[#08101f] to-[#030712] p-8 md:p-10 shadow-[0_0_60px_rgba(16,185,129,0.18)] text-center max-w-md w-full overflow-hidden"
      >
        {/* Ambient top glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-violet-400" />

        {/* Animated check icon */}
        <div className="relative flex items-center justify-center mt-1">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-30 motion-reduce:animate-none" />
          <div className="relative p-5 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-400/30 shadow-[0_0_30px_rgba(52,211,153,0.25)]">
            <CheckCircle size={48} className="text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
          </div>
        </div>

        {/* Header text */}
        <div className="space-y-2.5 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.14em] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {t("cart.purchaseSuccessful", "Purchase Successful")}
          </span>
          <h2 className="text-2xl md:text-[28px] font-black text-white tracking-tight">
            {t("cart.youreEnrolled", "You're enrolled")}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            {t(count !== 1 ? "cart.enrolledDesc_plural" : "cart.enrolledDesc", count !== 1 ? `You now have access to ${count} courses. Jump in whenever you're ready.` : `You now have access to ${count} course. Jump in whenever you're ready.`, { count })}
          </p>
        </div>

        {/* Purchased course list */}
        {purchasedCourses.length > 0 && (
          <div className="w-full max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-left relative z-10">
            {purchasedCourses.map((c, idx) => (
              <div
                key={c._id ?? c.id ?? idx}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/30 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-lg">
                  {c.thumbnailUrl ? (
                    <img src={c.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    "📚"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {c.title || c.subject || "Course"}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {c.instructor?.name || "Umang Vision Academy"}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                  {t("cart.enrolled", "Enrolled")}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="w-full space-y-2.5 pt-1 relative z-10">
          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>{t("cart.goToCourses", "Go to My Courses")}</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onGoToDashboard}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            {t("cart.goToDashboard", "Go to Student Dashboard")}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Wallet payment confirmation modal ─────────────────────────────────────────
const WalletConfirmModal = ({
  total,
  balance,
  onConfirm,
  onCancel,
  loading,
  t,
}) => {
  const insufficient = balance < total;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#0b1120] p-6 shadow-2xl space-y-5"
        style={{ animation: "fadeUp 0.25s ease" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Wallet size={20} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base leading-tight">{t("cart.payWithWallet", "Pay with Wallet")}</h3>
            <p className="text-slate-500 text-xs mt-0.5">{t("cart.instantNoRedirect", "Instant, no redirect")}</p>
          </div>
        </div>

        {/* Balance vs total */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{t("cart.orderTotal", "Order total")}</span>
            <span className="text-white font-bold">{fmt(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{t("cart.walletBalance", "Wallet balance")}</span>
            <span
              className={`font-bold ${insufficient ? "text-red-400" : "text-emerald-400"}`}
            >
              {fmt(balance)}
            </span>
          </div>
          {!insufficient && (
            <div className="flex justify-between text-sm border-t border-white/[0.07] pt-3">
              <span className="text-slate-400">{t("cart.balanceAfter", "Balance after")}</span>
              <span className="text-slate-300 font-bold">
                {fmt(balance - total)}
              </span>
            </div>
          )}
        </div>

        {/* Insufficient warning */}
        {insufficient && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              {t("cart.insufficientBalance", "You need {{amount}} more. Add money to your wallet first.", { amount: fmt(total - balance) })}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm font-semibold transition-colors"
          >
            {t("cart.cancel", "Cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={insufficient || loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: insufficient
                ? "#1e293b"
                : "linear-gradient(135deg,#7c3aed,#a855f7)",
              color: "#fff",
              boxShadow: insufficient
                ? "none"
                : "0 0 20px rgba(124,58,237,0.35)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={15} className="animate-spin" /> {t("cart.paying", "Paying…")}
              </span>
            ) : (
              t("cart.confirm", "Confirm {{amount}}", { amount: fmt(total) })
            )}
          </button>
        </div>

        {insufficient && (
          <p className="text-center text-xs text-slate-600">
            {t("cart.goToWallet", "Go to Wallet → Add Money to top up your balance.")}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useSelector((s) => s.auth);

  const {
    cartIds,
    availableCourses,
    availableLoading,
    checkoutLoading,
    checkoutSuccess,
    enrolledIds,
    error: cartError,
  } = useSelector((s) => s.cart);

  const {
    order,
    orderLoading,
    paymentLoading,
    error: billingError,
  } = useSelector((s) => s.billing);

  const {
    balance: walletBalance,
    loading: walletLoading,
    payLoading: walletPayLoading,
    error: walletError,
  } = useSelector((s) => s.wallet);

  const [showBrowser, setShowBrowser] = useState(false);
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [razorError, setRazorError] = useState("");
  const [mockLoading, setMockLoading] = useState(false);
  const [showWalletConfirm, setShowWalletConfirm] = useState(false);
  const [walletSuccessMsg, setWalletSuccessMsg] = useState("");
  const [lastPurchasedCourses, setLastPurchasedCourses] = useState([]);

  // Auth guard
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { from: "/cart" } });
    } else if (!hasBaseRole(user, "student")) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    dispatch(fetchAvailableCourses());
    dispatch(fetchCart());
    dispatch(fetchWallet()); // load wallet balance on mount
  }, [dispatch]);

  if (!user || !hasBaseRole(user, "student")) return null;

  // ── Derived ───────────────────────────────────────────────────────────────
  const cartItems = availableCourses.filter((c) =>
    cartIds.includes(c._id ?? c.id),
  );
  const notInCart = availableCourses.filter(
    (c) => !cartIds.includes(c._id ?? c.id),
  );
  const filtered = notInCart.filter(
    (c) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      instructorName(c.instructor).toLowerCase().includes(search.toLowerCase()),
  );

  const total = cartItems.reduce((s, c) => s + (c.price ?? 0), 0);
  const hasEnoughBalance = walletBalance >= total;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRemove = (id) => {
    setRemovingId(id);
    setTimeout(() => {
      dispatch(removeFromCart(id));
      setRemovingId(null);
      toast.success(t("cart.removedFromCart", "Removed from cart"));
    }, 280);
  };

  const handleAdd = (id) => {
    dispatch(addToCart(id));
    if (filtered.length === 1) setShowBrowser(false);
  };

  // Dummy Razorpay checkout
  const handleRazorpayCheckout = async () => {
    setRazorError("");
    setLastPurchasedCourses(cartItems);

    try {
      const result = await dispatch(
        createOrder({
          planId: "cart",
          amount: total * 100,
          courseIds: cartItems.map((c) => c._id ?? c.id),
        }),
      );
      if (createOrder.rejected.match(result)) return;

      const { orderId } = result.payload;
      await dispatch(
        verifyPayment({
          razorpay_order_id: orderId,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
          courseIds: cartItems.map((c) => c._id ?? c.id),
        }),
      );
      dispatch(fetchSubscription());
      dispatch(checkoutAndEnroll(cartItems.map((c) => c._id ?? c.id)));
    } catch (err) {
      setRazorError(err?.message || "Dummy Razorpay payment failed.");
    }
  };

  // Wallet checkout — pays for each course one by one
  const handleWalletCheckout = async () => {
    setShowWalletConfirm(false);
    setWalletSuccessMsg("");
    setLastPurchasedCourses(cartItems);

    // Cart may have multiple courses — pay for each sequentially
    const courseIds = cartItems.map((c) => c._id ?? c.id);
    let allOk = true;
    for (const courseId of courseIds) {
      try {
        await dispatch(payWithWallet(courseId)).unwrap();
      } catch (err) {
        allOk = false;
        setRazorError(err || "Wallet payment failed for one or more courses.");
        break;
      }
    }

    if (allOk) {
      dispatch(fetchWallet()); // refresh balance
      dispatch(checkoutAndEnroll(courseIds)); // mark enrolled in cart slice
    }
  };

  // Mock enroll (dev only)
  const handleSuccessClose = () => {
    dispatch(resetCheckout());
    navigate("/student-dashboard/my-courses");
  };

  const anyLoading =
    checkoutLoading ||
    orderLoading ||
    paymentLoading ||
    mockLoading ||
    walletPayLoading;
  const anyError = cartError || billingError || razorError || walletError;

  return (
    <div className="min-h-screen bg-[#020817] text-white relative">
      <SEO title="Cart" description="Review items in your cart." />
      <style>{`
        @keyframes slideOut { to { opacity:0; transform:translateX(28px) scale(0.97); } }
        @keyframes slideIn  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes floatSlow { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        .removing   { animation: slideOut 0.28s ease forwards; }
        .cart-item  { animation: slideIn 0.32s ease both; }
        .modal-bg   { animation: fadeIn 0.2s ease; }
        .modal-card { animation: slideIn 0.22s ease; }
        @media (prefers-reduced-motion: no-preference) {
          .float-slow { animation: floatSlow 4.5s ease-in-out infinite; }
        }
      `}</style>

      {/* Ambient top-of-page wash */}
      <div className="pointer-events-none fixed top-0 inset-x-0 h-[420px] bg-gradient-to-b from-emerald-500/[0.06] via-transparent to-transparent" />

      {checkoutSuccess && (
        <SuccessOverlay
          count={enrolledIds.length > 0 ? enrolledIds.length : (lastPurchasedCourses.length || 1)}
          purchasedCourses={lastPurchasedCourses}
          onClose={handleSuccessClose}
          t={t}
          onGoToDashboard={() => {
            dispatch(resetCheckout());
            navigate("/student-dashboard");
          }}
        />
      )}

      {showWalletConfirm && (
        <WalletConfirmModal
          total={total}
          balance={walletBalance}
          loading={walletPayLoading}
          t={t}
          onConfirm={handleWalletCheckout}
          onCancel={() => setShowWalletConfirm(false)}
        />
      )}

      {/* ── Top nav strip ── */}
      <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#020817]/85 backdrop-blur-md px-5 md:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold transition-colors shrink-0"
        >
          <ArrowLeft size={15} />
          <span>{t("cart.back", "Back")}</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingCart size={15} className="text-emerald-300 shrink-0" />
          <span className="font-bold text-white text-sm truncate">{t("cart.title", "Your Cart")}</span>
          {cartItems.length > 0 && (
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 shrink-0">
              {cartItems.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 md:px-6 py-6 md:py-8 relative">
        {/* Error banner */}
        {anyError && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-5 py-4 text-sm text-red-300">
            <span className="flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {anyError}
            </span>
            <button
              onClick={() => {
                dispatch(resetCheckout());
                setRazorError("");
              }}
              className="shrink-0 text-red-300 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {availableLoading ? (
          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            <div className="space-y-5">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden flex"
                >
                  <Skeleton className="w-48 h-36 rounded-none shrink-0" />
                  <div className="flex-1 p-5 space-y-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-7 w-24 mt-2" />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-4 h-fit">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
              <Skeleton className="h-12 w-full mt-2" />
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center max-w-4xl mx-auto space-y-12">
            {/* Main Empty Hero Card */}
            <div className="relative w-full max-w-md p-8 md:p-10 rounded-[32px] border border-white/10 bg-gradient-to-b from-[#0b1628]/95 via-[#08101f]/85 to-[#020817]/95 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.08)] flex flex-col items-center gap-6 overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

              {/* Glowing Icon Holder */}
              <div className="relative mt-2">
                <div className="absolute inset-0 rounded-3xl bg-emerald-500/15 blur-xl animate-pulse" />
                <div className="relative p-6 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-400/30 shadow-[0_0_25px_rgba(52,211,153,0.15)] text-emerald-400">
                  <ShoppingCart size={48} className="drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
                  <span className="absolute -top-1 -right-1 p-1.5 rounded-full bg-emerald-400 text-slate-950 shadow-md">
                    <Sparkles size={12} />
                  </span>
                </div>
              </div>

              {/* Hero Copy */}
              <div className="space-y-2 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.14em] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {t("cart.emptyTag", "Ready for your next step?")}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {t("cart.emptyTitle", "Your cart is empty")}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                  {t("cart.emptyDesc", "Explore top courses and competitive exam prep to start building your skills today.")}
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-300 pt-1">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                  ⚡ {t("cart.instantAccess", "Instant Access")}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                  📜 {t("cart.certified", "Certified")}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                  💬 {t("cart.aiTutor", "AI Tutor")}
                </span>
              </div>

              {/* Primary CTA */}
              <button
                onClick={() => navigate("/courses")}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Plus size={18} />
                <span>{t("cart.exploreCourses", "Explore All Courses")}</span>
              </button>
            </div>

            {/* Recommended Courses Grid */}
            {availableCourses.length > 0 && (
              <div className="w-full text-left space-y-5 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <BookOpen size={18} className="text-emerald-400" />
                      <span>{t("cart.popularCourses", "Popular Courses You Might Like")}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t("cart.popularDesc", "Handpicked recommendations to get you started quickly")}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/courses")}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    {t("cart.viewAll", "View all")} <ArrowRight size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {availableCourses.slice(0, 3).map((course) => (
                    <div
                      key={course._id ?? course.id}
                      className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:border-emerald-500/30 p-4 flex flex-col justify-between gap-4 transition-all hover:bg-white/[0.05]"
                    >
                      <div className="space-y-3">
                        <div className="h-32 rounded-xl bg-slate-800 border border-white/10 overflow-hidden relative">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                              📚
                            </div>
                          )}
                          {course.category && (
                            <span className="absolute top-2 left-2 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur text-indigo-300 border border-indigo-500/30">
                              {course.category}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                            {course.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {t("cart.by", "by")} {instructorName(course.instructor)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                        <span className="text-base font-black text-emerald-300">
                          {fmt(course.price)}
                        </span>
                        <button
                          onClick={() => handleAdd(course._id ?? course.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-400/20 transition-colors"
                        >
                          <Plus size={13} /> {t("cart.addToCart", "Add to Cart")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* ── LEFT: cart items ── */}
            <div className="space-y-4">
              <p className="text-slate-500 text-sm font-medium">
                {t(cartItems.length !== 1 ? "cart.coursesInCart_plural" : "cart.coursesInCart", `${cartItems.length} course${cartItems.length !== 1 ? 's' : ''} in your cart`, { count: cartItems.length })}
              </p>

              {cartItems.map((item, idx) => (
                <div
                  key={item._id ?? item.id}
                  className={`cart-item group rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden transition-colors hover:border-white/[0.14] ${removingId === (item._id ?? item.id) ? "removing" : ""}`}
                  style={{ animationDelay: `${idx * 55}ms` }}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative sm:w-48 h-40 sm:h-auto shrink-0 overflow-hidden bg-slate-800">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          📚
                        </div>
                      )}
                      {/* Category / board badges float on the thumbnail */}
                      {(item.category || item.board) && (
                        <div className="absolute left-2.5 bottom-2.5 flex gap-1.5 flex-wrap">
                          {item.category && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur text-indigo-300 border border-indigo-500/30">
                              {item.category}
                            </span>
                          )}
                          {item.board && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur text-purple-300 border border-purple-500/30">
                              {item.board}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between gap-3 min-w-0">
                      <div>
                        <h3 className="font-bold text-lg text-white leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            {t("cart.by", "by")} {instructorName(item.instructor)}
                          </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Star
                              size={11}
                              className="text-amber-400 fill-amber-400"
                            />
                            {item.ratingAverage?.toFixed(1) ?? "New"}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="flex items-center gap-1">
                            <Users size={11} /> {item.students?.length ?? 0}{" "}
                            {t("cart.students", "students")}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {item.durationHours
                              ? `${item.durationHours}h`
                              : `${item.lessons?.length ?? 0} lessons`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-white/[0.06]">
                        <span className="text-2xl font-black text-emerald-300">
                          {fmt(item.price)}
                        </span>
                        <button
                          onClick={() => handleRemove(item._id ?? item.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/[0.12]"
                        >
                          <Trash2 size={13} /> {t("cart.remove", "Remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {notInCart.length > 0 && (
                <button
                  onClick={() => setShowBrowser(true)}
                  className="w-full rounded-2xl border border-dashed border-white/[0.1] py-5 text-slate-500 hover:border-emerald-400/30 hover:text-emerald-400 hover:bg-emerald-400/[0.02] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus size={16} /> {t("cart.addAnother", "Add another course")}
                </button>
              )}
            </div>

            {/* ── RIGHT: Order summary ── */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden sticky top-16">
              {/* Signature stripe — echoes the two payment paths below */}
              <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-violet-400" />

              <div className="p-6 flex flex-col gap-5">
                <h2 className="text-xl font-black text-white">{t("cart.orderSummary", "Order Summary")}</h2>

                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div
                      key={item._id ?? item.id}
                      className="flex items-center justify-between text-sm gap-2"
                    >
                      <span className="text-slate-400 truncate max-w-[180px]">
                        {item.title}
                      </span>
                      <span className="text-slate-300 font-semibold shrink-0">
                        {fmt(item.price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t border-white/[0.07] pt-4">
                  <span className="font-bold text-white text-base">{t("cart.total", "Total")}</span>
                  <span className="text-2xl font-black text-emerald-300">
                    {fmt(total)}
                  </span>
                </div>

                {/* ── Wallet balance display ── */}
                <div
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${hasEnoughBalance
                      ? "bg-violet-500/10 border-violet-500/20"
                      : "bg-red-500/10 border-red-500/20"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Wallet
                      size={15}
                      className={
                        hasEnoughBalance ? "text-violet-400" : "text-red-400"
                      }
                    />
                    <span
                      className={
                        hasEnoughBalance ? "text-violet-300" : "text-red-300"
                      }
                    >
                      {t("cart.walletBalance", "Wallet Balance")}
                    </span>
                  </div>
                  <span
                    className={`font-bold ${hasEnoughBalance ? "text-violet-300" : "text-red-400"}`}
                  >
                    {walletLoading ? "…" : fmt(walletBalance)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {t("cart.choosePayment", "Choose a payment method")}
                  </p>

                  {/* ── Pay with Wallet CTA ── */}
                  <button
                    onClick={() => setShowWalletConfirm(true)}
                    disabled={anyLoading || total === 0}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
                    style={{
                      background: hasEnoughBalance
                        ? "linear-gradient(135deg,#7c3aed,#a855f7)"
                        : "#1e1b4b",
                      color: "#fff",
                      border: hasEnoughBalance
                        ? "none"
                        : "1px dashed rgba(124,58,237,0.4)",
                      boxShadow: hasEnoughBalance
                        ? "0 8px 24px rgba(124,58,237,0.3)"
                        : "none",
                    }}
                  >
                    <Wallet size={16} />
                    {hasEnoughBalance
                      ? t("cart.payFromWallet", "Pay {{amount}} from Wallet", { amount: fmt(total) })
                      : t("cart.addToWallet", "Add {{amount}} more to Wallet", { amount: fmt(total - walletBalance) })}
                  </button>

                  {/* Low balance nudge */}
                  {!hasEnoughBalance && total > 0 && (
                    <button
                      onClick={() => navigate("/student-dashboard/wallet")}
                      className="w-full text-xs text-violet-400 hover:text-violet-300 transition-colors text-center underline underline-offset-2"
                    >
                      {t("cart.topUpWallet", "+ Top up wallet →")}
                    </button>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-slate-600 text-xs">{t("cart.or", "or")}</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  {/* ── Razorpay CTA ── */}
                  <button
                    onClick={handleRazorpayCheckout}
                    disabled={anyLoading || total === 0}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: "linear-gradient(135deg,#0f766e,#06b6d4)",
                      color: "#fff",
                      boxShadow: "0 8px 24px rgba(6,182,212,.25)",
                    }}
                  >
                    {orderLoading || paymentLoading ? (
                      <>
                        <Loader2 size={17} className="animate-spin" /> {t("cart.processing", "Processing…")}
                      </>
                    ) : (
                      <>
                        <ArrowRight size={17} /> {t("cart.payWithRazorpay", "Pay {{amount}} with Razorpay", { amount: fmt(total) })}
                      </>
                    )}
                  </button>
                </div>

                {/* ── Refund policy notice ── */}
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-slate-300">
                  <ShieldCheck
                    size={18}
                    className="text-emerald-400 shrink-0 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-emerald-300">
                      {t("cart.moneyBack", "7-Day Money Back Guarantee")}
                    </span>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">
                      {t("cart.moneyBackDesc", "Not satisfied? Request a refund within 7 days (credited directly to your platform Wallet). Read our")}{" "}
                      <Link
                        to="/refund-policy"
                        className="text-emerald-400 underline hover:text-emerald-300 font-medium"
                      >
                        {t("cart.refundPolicy", "Refund Policy")}
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                <p className="text-center text-xs text-slate-600">
                  {total > 0
                    ? t("cart.sslSecure", "Secure 256-Bit SSL Encrypted Checkout")
                    : t("cart.freeCourses", "No payment required for free courses")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Browse modal ── */}
      {showBrowser && (
        <div
          className="modal-bg fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={(e) => e.target === e.currentTarget && setShowBrowser(false)}
        >
          <div className="modal-card w-full max-w-xl max-h-[85vh] flex flex-col rounded-[28px] border border-white/[0.09] bg-[#0b1120] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-white/[0.06]">
              <h3 className="text-lg font-bold">{t("cart.browseCourses", "Browse Courses")}</h3>
              <button
                onClick={() => setShowBrowser(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-4 shrink-0">
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 focus-within:border-emerald-400/40 transition-colors">
                <Search size={15} className="text-slate-500 shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("cart.searchPlaceholder", "Search courses or instructors…")}
                  className="bg-transparent flex-1 outline-none text-sm text-white placeholder-slate-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto px-6 pb-6 space-y-2.5 flex-1">
              {availableLoading ? (
                [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <Skeleton className="w-16 h-12 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    {search
                      ? t("cart.noCoursesMatch", "No courses match.")
                      : t("cart.allInCart", "All courses are in your cart!")}
                  </p>
                </div>
              ) : (
                filtered.map((course) => (
                  <div
                    key={course._id ?? course.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.05] hover:border-white/[0.1] transition-colors"
                  >
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-16 h-11 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-11 rounded-lg bg-slate-800 flex items-center justify-center text-xl shrink-0">
                        📚
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-snug truncate text-white">
                        {course.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t("cart.by", "by")} {instructorName(course.instructor)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Star
                            size={10}
                            className="text-amber-400 fill-amber-400"
                          />
                          {course.ratingAverage?.toFixed(1) ?? "New"}
                        </span>
                        {course.board && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                            {course.board}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-emerald-300 font-bold text-sm">
                        {fmt(course.price)}
                      </p>
                      <button
                        onClick={() => handleAdd(course._id ?? course.id)}
                        className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-400/20 transition-colors"
                      >
                        <Plus size={11} /> {t("cart.add", "Add")}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}