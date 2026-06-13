import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import {
  Trash2,
  ShoppingCart,
  ArrowRight,
  Plus,
  Search,
  X,
  Star,
  Clock,
  Users,
  CheckCircle,
  Loader2,
  BookOpen,
  Tag,
} from "lucide-react";

const DISCOUNT = 40;

// ── Load Razorpay script ──────────────────────────────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

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

const SuccessOverlay = ({ count, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div
      style={{ animation: "fadeUp 0.35s ease" }}
      className="flex flex-col items-center gap-6 rounded-3xl border border-emerald-400/20 bg-[#0b1326] p-10 shadow-2xl text-center max-w-sm w-full"
    >
      <div className="p-5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
        <CheckCircle size={44} className="text-emerald-300" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">You're enrolled! 🎉</h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          Successfully enrolled in {count} course{count !== 1 ? "s" : ""}.<br />
          Head to My Courses to start learning.
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-full rounded-2xl bg-emerald-300 px-6 py-3 font-bold text-slate-950 hover:scale-[1.02] transition"
      >
        Go to My Courses →
      </button>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const [showBrowser, setShowBrowser] = useState(false);
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [razorError, setRazorError] = useState("");
  const [mockLoading, setMockLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!user) navigate("/login", { replace: true, state: { from: "/cart" } });
  }, [user, navigate]);

  useEffect(() => {
    dispatch(fetchAvailableCourses());
    dispatch(fetchCart());
  }, [dispatch]);

  if (!user) return null;

  // ── Derived ──────────────────────────────────────────────────────────────
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

  const subtotal = cartItems.reduce((s, c) => s + (c.price ?? 0), 0);
  const discount = subtotal > 0 ? DISCOUNT : 0;
  const total = Math.max(0, subtotal - discount);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRemove = (id) => {
    setRemovingId(id);
    setTimeout(() => {
      dispatch(removeFromCart(id));
      setRemovingId(null);
    }, 280);
  };

  const handleAdd = (id) => {
    dispatch(addToCart(id));
    if (filtered.length === 1) setShowBrowser(false);
  };

  // Real Razorpay checkout
  const handleRazorpayCheckout = async () => {
    setRazorError("");
    const ok = await loadRazorpay();
    if (!ok) {
      setRazorError("Failed to load Razorpay. Check your connection.");
      return;
    }

    // Create a single order for the total cart amount
    const result = await dispatch(
      createOrder({
        planId: "cart",
        amount: total * 100,
        courseIds: cartItems.map((c) => c._id ?? c.id),
      }),
    );
    if (createOrder.rejected.match(result)) return;

    const { orderId, keyId, amount, currency } = result.payload;

    new window.Razorpay({
      key: keyId,
      amount,
      currency: currency ?? "INR",
      name: "Umang Vision Academy",
      description: `Enrolling in ${cartItems.length} course${cartItems.length !== 1 ? "s" : ""}`,
      order_id: orderId,
      prefill: { name: user?.name || "", email: user?.email || "" },
      theme: { color: "#7c3aed" },
      handler: async (response) => {
        await dispatch(
          verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            courseIds: cartItems.map((c) => c._id ?? c.id),
          }),
        );
        dispatch(fetchSubscription());
        // Enroll courses after payment
        dispatch(checkoutAndEnroll(cartItems.map((c) => c._id ?? c.id)));
      },
    }).open();
  };

  // Mock enroll (dev only)
  const handleMockEnroll = async () => {
    setMockLoading(true);
    await dispatch(checkoutAndEnroll(cartItems.map((c) => c._id ?? c.id)));
    setMockLoading(false);
  };

  const handleSuccessClose = () => {
    dispatch(resetCheckout());
    navigate("/student-dashboard/my-courses");
  };

  const anyLoading =
    checkoutLoading || orderLoading || paymentLoading || mockLoading;
  const anyError = cartError || billingError || razorError;

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <style>{`
        @keyframes slideOut { to { opacity:0; transform:translateX(28px) scale(0.97); } }
        @keyframes slideIn  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .removing   { animation: slideOut 0.28s ease forwards; }
        .cart-item  { animation: slideIn 0.32s ease both; }
        .modal-bg   { animation: fadeIn 0.2s ease; }
        .modal-card { animation: slideIn 0.22s ease; }
      `}</style>

      {checkoutSuccess && (
        <SuccessOverlay
          count={enrolledIds.length}
          onClose={handleSuccessClose}
        />
      )}

      {/* ── Top nav strip ── */}
      <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#020817]/90 backdrop-blur-md px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white text-sm font-semibold transition"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20">
            <ShoppingCart size={18} className="text-emerald-300" />
          </div>
          <span className="font-bold text-white text-lg">Your Cart</span>
          {cartItems.length > 0 && (
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
              {cartItems.length}
            </span>
          )}
        </div>
        {!availableLoading && notInCart.length > 0 && (
          <button
            onClick={() => setShowBrowser(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 hover:border-emerald-400/30 hover:text-emerald-300 transition"
          >
            <Plus size={15} /> Add Course
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Error banner */}
        {anyError && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-5 py-4 text-sm text-red-300">
            <span>⚠️ {anyError}</span>
            <button
              onClick={() => {
                dispatch(resetCheckout());
                setRazorError("");
              }}
              className="shrink-0 text-red-300 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {availableLoading ? (
          /* Skeleton */
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
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-28 gap-6 text-center">
            <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
              <ShoppingCart size={52} className="text-slate-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                Your cart is empty
              </h2>
              <p className="text-slate-500 mt-2 text-sm">
                Browse courses and add them here to enrol.
              </p>
            </div>
            <button
              onClick={() => setShowBrowser(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-300 px-6 py-3 text-slate-950 font-bold hover:scale-[1.02] transition"
            >
              <Plus size={18} /> Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
            {/* ── LEFT ── */}
            <div className="space-y-4">
              <p className="text-slate-400 text-sm font-medium">
                {cartItems.length} course{cartItems.length !== 1 ? "s" : ""} in
                cart
              </p>

              {cartItems.map((item, idx) => (
                <div
                  key={item._id ?? item.id}
                  className={`cart-item group rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden transition hover:border-white/[0.14] ${removingId === (item._id ?? item.id) ? "removing" : ""}`}
                  style={{ animationDelay: `${idx * 55}ms` }}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="sm:w-48 h-40 sm:h-auto shrink-0 overflow-hidden bg-slate-800">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          📚
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                      <div>
                        {/* Category + board */}
                        <div className="flex gap-2 flex-wrap mb-2">
                          {item.category && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {item.category}
                            </span>
                          )}
                          {item.board && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              {item.board}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-lg text-white leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                          by {instructorName(item.instructor)}
                        </p>

                        {/* Meta row */}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Star
                              size={11}
                              className="text-amber-400 fill-amber-400"
                            />
                            {item.ratingAverage?.toFixed(1) ?? "New"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={11} /> {item.students?.length ?? 0}{" "}
                            students
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {item.durationHours
                              ? `${item.durationHours}h`
                              : `${item.lessons?.length ?? 0} lessons`}
                          </span>
                        </div>
                      </div>

                      {/* Price + remove */}
                      <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-white/[0.06]">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-emerald-300">
                            {fmt(item.price)}
                          </span>
                          {item.price > 0 && (
                            <span className="text-xs text-slate-500 line-through">
                              {fmt(item.price + 200)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(item._id ?? item.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/[0.12]"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add another */}
              {notInCart.length > 0 && (
                <button
                  onClick={() => setShowBrowser(true)}
                  className="w-full rounded-2xl border border-dashed border-white/[0.08] py-5 text-slate-500 hover:border-emerald-400/30 hover:text-emerald-400 transition flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus size={16} /> Add another course
                </button>
              )}
            </div>

            {/* ── RIGHT: Order summary ── */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 flex flex-col gap-5 sticky top-24">
              <h2 className="text-xl font-black text-white">Order Summary</h2>

              {/* Course list */}
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div
                    key={item._id ?? item.id}
                    className="flex items-center justify-between text-sm gap-2"
                  >
                    <span className="text-slate-400 truncate max-w-[160px]">
                      {item.title}
                    </span>
                    <span className="text-slate-300 font-semibold shrink-0">
                      {fmt(item.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-white/[0.07] pt-4">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Tag size={12} /> Discount
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      -{fmt(discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-white/[0.07]">
                  <span className="font-bold text-white text-base">Total</span>
                  <span className="text-2xl font-black text-emerald-300">
                    {fmt(total)}
                  </span>
                </div>
              </div>

              {/* ── Razorpay CTA ── */}
              <button
                onClick={handleRazorpayCheckout}
                disabled={anyLoading || total === 0}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-bold transition disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01]"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  color: "#fff",
                  boxShadow: "0 8px 24px rgba(124,58,237,.3)",
                }}
              >
                {orderLoading || paymentLoading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <ArrowRight size={17} /> Pay {fmt(total)} with Razorpay
                  </>
                )}
              </button>

              {/* ── Free courses / mock enroll ── */}
              {(total === 0 || process.env.NODE_ENV !== "production") && (
                <button
                  onClick={handleMockEnroll}
                  disabled={anyLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold border border-dashed transition disabled:opacity-60"
                  style={{
                    borderColor: "#334155",
                    color: "#94a3b8",
                    background: "transparent",
                  }}
                >
                  {mockLoading || checkoutLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Enrolling…
                    </>
                  ) : (
                    <>🧪 {total === 0 ? "Enrol Free" : "Mock Enrol (Test)"}</>
                  )}
                </button>
              )}

              <p className="text-center text-xs text-slate-600">
                {total > 0
                  ? "Secure checkout · Powered by Razorpay"
                  : "No payment required for free courses"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Browse modal ── */}
      {showBrowser && (
        <div
          className="modal-bg fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={(e) => e.target === e.currentTarget && setShowBrowser(false)}
        >
          <div className="modal-card w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl border border-white/[0.09] bg-[#0b1120] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-white/[0.06]">
              <h3 className="text-lg font-bold">Browse Courses</h3>
              <button
                onClick={() => setShowBrowser(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 shrink-0">
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5">
                <Search size={15} className="text-slate-500 shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses or instructors…"
                  className="bg-transparent flex-1 outline-none text-sm text-white placeholder-slate-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-slate-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto px-6 pb-6 space-y-3 flex-1">
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
                      ? "No courses match."
                      : "All courses are in your cart!"}
                  </p>
                </div>
              ) : (
                filtered.map((course) => (
                  <div
                    key={course._id ?? course.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.05] transition"
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
                        by {instructorName(course.instructor)}
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
                        className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-400/20 transition"
                      >
                        <Plus size={11} /> Add
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
