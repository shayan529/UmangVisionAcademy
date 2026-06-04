import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  removeFromCart,
  checkoutAndEnroll,
  fetchAvailableCourses,
  resetCheckout,
} from "../redux/slices/cartSlice";
import {
  Trash2,
  ShoppingCart,
  ArrowRight,
  Plus,
  Search,
  X,
  Star,
  BookOpen,
  Clock,
  Users,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DISCOUNT = 40;

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />
);

// ── Success overlay ───────────────────────────────────────────────────────────
const SuccessOverlay = ({ count, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-emerald-400/20 bg-[#0b1326] p-10 shadow-2xl text-center max-w-sm w-full mx-4">
      <div className="p-4 rounded-full bg-emerald-400/10 border border-emerald-400/20">
        <CheckCircle size={40} className="text-emerald-300" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">You're enrolled!</h2>
        <p className="text-slate-400 mt-2 text-sm">
          Successfully enrolled in {count} course{count !== 1 ? "s" : ""}. Head
          to My Courses to start learning.
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-full rounded-2xl bg-emerald-300 px-6 py-3 font-bold text-slate-950 hover:scale-[1.02] transition"
      >
        Go to My Courses
      </button>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function CartPage() {
  const dispatch = useDispatch();
  const {
    cartIds,
    availableCourses,
    availableLoading,
    checkoutLoading,
    checkoutSuccess,
    enrolledIds,
    error,
  } = useSelector((s) => s.cart);

  const [showBrowser, setShowBrowser] = useState(false);
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const { user } = useSelector((s) => s.auth);

  const navigate = useNavigate();

  // Fetch all available courses on mount
  useEffect(() => {
    dispatch(fetchAvailableCourses());
  }, [dispatch]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  // Derive cart items from the full courses list
  const cartItems = availableCourses.filter((c) =>
    cartIds.includes(c._id ?? c.id),
  );
  const notInCart = availableCourses.filter(
    (c) => !cartIds.includes(c._id ?? c.id),
  );
  const filtered = notInCart.filter(
    (c) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      (c.instructor?.name ?? c.instructor ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const subtotal = cartItems.reduce((acc, c) => acc + (c.price ?? 0), 0);
  const total = Math.max(0, subtotal - DISCOUNT);

  const handleRemove = (id) => {
    setRemovingId(id);
    setTimeout(() => {
      dispatch(removeFromCart(id));
      setRemovingId(null);
    }, 300);
  };

  const handleAdd = (id) => {
    dispatch(addToCart(id));
    if (filtered.length === 1) setShowBrowser(false);
  };

  const handleCheckout = () => {
    const ids = cartItems.map((c) => c._id ?? c.id);
    dispatch(checkoutAndEnroll(ids));
  };

  const handleSuccessClose = () => {
    dispatch(resetCheckout());
    // Navigate to my-courses — adjust to your router setup
    window.location.href = "/student-dashboard/my-courses";
  };

  // Resolve instructor display name — populated object or plain string
  const instructorName = (instructor) =>
    instructor?.name ??
    instructor?.email?.split("@")[0] ??
    (typeof instructor === "string" ? instructor : "Instructor");

  return (
    <div className="min-h-screen bg-[#020817] text-white px-6 py-10">
      <style>{`
        @keyframes slideOut {
          to { opacity: 0; transform: translateX(30px) scale(0.97); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .removing    { animation: slideOut 0.3s ease forwards; }
        .cart-item   { animation: slideIn 0.35s ease both; }
        .modal-bg    { animation: fadeIn 0.2s ease; }
        .modal-card  { animation: slideIn 0.25s ease; }
      `}</style>

      {/* Success overlay */}
      {checkoutSuccess && (
        <SuccessOverlay
          count={enrolledIds.length}
          onClose={handleSuccessClose}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* ── Heading ── */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-400/10 border border-emerald-400/20">
              <ShoppingCart className="text-emerald-300" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black">Your Cart</h1>
              <p className="text-slate-400 mt-1">
                {availableLoading
                  ? "Loading…"
                  : cartItems.length === 0
                    ? "Your cart is empty"
                    : `${cartItems.length} course${cartItems.length > 1 ? "s" : ""} selected`}
              </p>
            </div>
          </div>

          {/* Add course button */}
          {!availableLoading && notInCart.length > 0 && (
            <button
              onClick={() => setShowBrowser(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-300 hover:border-emerald-400/30 hover:text-emerald-300 transition"
            >
              <Plus size={16} /> Add Course
            </button>
          )}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            <span>⚠️ {error}</span>
            <button
              onClick={() => dispatch(resetCheckout())}
              className="text-red-300 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {availableLoading ? (
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    <Skeleton className="h-52 md:h-auto md:w-64 rounded-none" />
                    <div className="flex-1 p-6 space-y-3">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-8 w-28 mt-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-7 space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-full mt-4" />
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-28 gap-6">
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10">
              <ShoppingCart size={48} className="text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-400">No courses yet</p>
            <button
              onClick={() => setShowBrowser(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-300 px-6 py-3 text-slate-950 font-bold hover:scale-[1.02] transition"
            >
              <Plus size={18} /> Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            {/* ── LEFT: cart items ── */}
            <div className="space-y-6">
              {cartItems.map((item, idx) => (
                <div
                  key={item._id ?? item.id}
                  className={`cart-item rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden backdrop-blur-sm ${removingId === (item._id ?? item.id) ? "removing" : ""}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Thumbnail */}
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="h-52 md:h-auto md:w-64 object-cover"
                      />
                    ) : (
                      <div className="h-52 md:h-auto md:w-64 flex items-center justify-center bg-slate-800 text-5xl">
                        📚
                      </div>
                    )}

                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-emerald-300 font-semibold uppercase tracking-widest mb-2">
                          {item.category ?? "Course"} ·{" "}
                          {item.level ?? "All Levels"}
                        </p>
                        <h2 className="text-xl font-bold leading-snug">
                          {item.title}
                        </h2>
                        <p className="text-slate-400 mt-1 text-sm">
                          by {instructorName(item.instructor)}
                        </p>

                        {/* Meta */}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Star
                              size={12}
                              className="text-amber-400 fill-amber-400"
                            />
                            {item.ratingAverage?.toFixed(1) ?? "New"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {item.students?.length ?? 0} students
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {item.durationHours
                              ? `${item.durationHours}h`
                              : `${item.lessons?.length ?? 0} lessons`}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="mt-4 flex items-baseline gap-3">
                          <span className="text-3xl font-black text-emerald-300">
                            ${item.price ?? 0}
                          </span>
                          {item.price > 0 && (
                            <>
                              <span className="text-sm text-slate-500 line-through">
                                ${item.price + 60}
                              </span>
                              <span className="text-xs bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 rounded-full px-2 py-0.5">
                                Save $60
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemove(item._id ?? item.id)}
                        className="mt-5 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm text-red-300 transition hover:bg-red-500/20 w-fit"
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add more */}
              {notInCart.length > 0 && (
                <button
                  onClick={() => setShowBrowser(true)}
                  className="w-full rounded-3xl border border-dashed border-white/10 py-6 text-slate-500 hover:border-emerald-400/30 hover:text-emerald-300 transition flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus size={18} /> Add another course
                </button>
              )}
            </div>

            {/* ── RIGHT: order summary ── */}
            <div className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              {/* Mini list */}
              <div className="space-y-2 mb-5">
                {cartItems.map((item) => (
                  <div
                    key={item._id ?? item.id}
                    className="flex items-center justify-between text-sm text-slate-400 gap-2"
                  >
                    <span className="truncate max-w-[180px]">{item.title}</span>
                    <span className="shrink-0">${item.price ?? 0}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span>${subtotal}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Discount</span>
                  <span className="text-emerald-300">-${DISCOUNT}</span>
                </div>
                <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-3xl font-black text-emerald-300">
                    ${total}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="mt-8 w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-300 px-6 py-4 text-lg font-bold text-slate-950 shadow-2xl shadow-emerald-300/20 transition hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Enrolling…
                  </>
                ) : (
                  <>
                    Proceed to Checkout
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <p className="mt-5 text-center text-sm text-slate-500">
                Secure checkout powered by Razorpay.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Browse courses modal ── */}
      {showBrowser && (
        <div
          className="modal-bg fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={(e) => e.target === e.currentTarget && setShowBrowser(false)}
        >
          <div className="modal-card w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-white/10 bg-[#0b1326] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h3 className="text-xl font-bold">Browse Courses</h3>
              <button
                onClick={() => setShowBrowser(false)}
                className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 pb-4 shrink-0">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <Search size={17} className="text-slate-500 shrink-0" />
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
                    className="text-slate-500 hover:text-white transition"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto px-6 pb-6 space-y-4 flex-1">
              {availableLoading ? (
                [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
                  >
                    <Skeleton className="w-20 h-14 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen size={36} className="mx-auto mb-3 opacity-40" />
                  <p>
                    {search
                      ? "No courses match your search."
                      : "All courses are already in your cart!"}
                  </p>
                </div>
              ) : (
                filtered.map((course) => (
                  <div
                    key={course._id ?? course.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 hover:bg-white/[0.06] transition"
                  >
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-20 h-14 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                        📚
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-snug truncate">
                        {course.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        by {instructorName(course.instructor)}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Star
                            size={11}
                            className="text-amber-400 fill-amber-400"
                          />
                          {course.ratingAverage?.toFixed(1) ?? "New"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {course.durationHours
                            ? `${course.durationHours}h`
                            : `${course.lessons?.length ?? 0} lessons`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-emerald-300 font-bold text-sm">
                        ${course.price ?? 0}
                      </p>
                      <button
                        onClick={() => handleAdd(course._id ?? course.id)}
                        className="mt-2 inline-flex items-center gap-1 rounded-xl bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
                      >
                        <Plus size={13} /> Add
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
