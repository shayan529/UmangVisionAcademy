import React, { useState } from "react";
import { Trash2, ShoppingCart, ArrowRight, Plus, Search, X, Star, BookOpen, Clock, Users } from "lucide-react";

// All available courses that can be added
const ALL_COURSES = [
  {
    id: 1,
    title: "Full Stack Web Development",
    instructor: "John Doe",
    price: 89,
    rating: 4.8,
    students: "12.4k",
    duration: "42h",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "AI & Machine Learning Bootcamp",
    instructor: "Sarah Wilson",
    price: 129,
    rating: 4.9,
    students: "8.7k",
    duration: "56h",
    image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "UI/UX Design Masterclass",
    instructor: "Emily Chen",
    price: 79,
    rating: 4.7,
    students: "6.2k",
    duration: "28h",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Cloud Architecture with AWS",
    instructor: "Mark Stevens",
    price: 149,
    rating: 4.8,
    students: "4.9k",
    duration: "38h",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "React & TypeScript Advanced",
    instructor: "Alex Kumar",
    price: 99,
    rating: 4.9,
    students: "9.1k",
    duration: "34h",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Cybersecurity Fundamentals",
    instructor: "Nadia Park",
    price: 109,
    rating: 4.6,
    students: "5.5k",
    duration: "30h",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
  },
];

const DISCOUNT = 40;

const CartPage = () => {
  const [cartIds, setCartIds] = useState([1, 2]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const cartItems = ALL_COURSES.filter((c) => cartIds.includes(c.id));
  const browseCourses = ALL_COURSES.filter((c) => !cartIds.includes(c.id));
  const filtered = browseCourses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase())
  );

  const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
  const total = Math.max(0, subtotal - DISCOUNT);

  const handleRemove = (id) => {
    setRemovingId(id);
    setTimeout(() => {
      setCartIds((prev) => prev.filter((cid) => cid !== id));
      setRemovingId(null);
    }, 300);
  };

  const handleAdd = (id) => {
    setCartIds((prev) => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white px-6 py-10">
      <style>{`
        @keyframes slideOut {
          to { opacity: 0; transform: translateX(30px) scale(0.97); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .removing { animation: slideOut 0.3s ease forwards; }
        .cart-item { animation: slideIn 0.35s ease both; }
        .modal-bg { animation: fadeIn 0.2s ease; }
        .modal-card { animation: slideIn 0.25s ease; }
      `}</style>

      <div className="max-w-7xl mx-auto">

        {/* Heading */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-400/10 border border-emerald-400/20">
              <ShoppingCart className="text-emerald-300" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black">Your Cart</h1>
              <p className="text-slate-400 mt-1">
                {cartItems.length === 0
                  ? "Your cart is empty"
                  : `${cartItems.length} course${cartItems.length > 1 ? "s" : ""} selected`}
              </p>
            </div>
          </div>

          {/* Add Course Button */}
          <button
            onClick={() => setShowBrowser(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.06] border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/[0.1] transition"
          >
            <Plus size={17} />
            Add Course
          </button>
        </div>

        {cartItems.length === 0 ? (
          /* EMPTY STATE */
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

            {/* LEFT */}
            <div className="space-y-6">
              {cartItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`cart-item rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden backdrop-blur-sm ${removingId === item.id ? "removing" : ""}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex flex-col md:flex-row">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-52 md:h-auto md:w-64 object-cover"
                    />
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-emerald-300 font-semibold uppercase tracking-widest mb-2">
                          Premium Course
                        </p>
                        <h2 className="text-xl font-bold leading-snug">{item.title}</h2>
                        <p className="text-slate-400 mt-1 text-sm">by {item.instructor}</p>

                        {/* Meta */}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Star size={12} className="text-amber-400 fill-amber-400" />
                            {item.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {item.students} students
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {item.duration}
                          </span>
                        </div>

                        <div className="mt-4 flex items-baseline gap-3">
                          <span className="text-3xl font-black text-emerald-300">${item.price}</span>
                          <span className="text-sm text-slate-500 line-through">${item.price + 60}</span>
                          <span className="text-xs bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 rounded-full px-2 py-0.5">
                            Save ${60}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-3">
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm text-red-300 transition hover:bg-red-500/20"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                        <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-slate-300 hover:bg-white/[0.08] transition">
                          <BookOpen size={16} />
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add more */}
              {browseCourses.length > 0 && (
                <button
                  onClick={() => setShowBrowser(true)}
                  className="w-full rounded-3xl border border-dashed border-white/10 py-6 text-slate-500 hover:border-emerald-400/30 hover:text-emerald-300 transition flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus size={18} /> Add another course
                </button>
              )}
            </div>

            {/* RIGHT */}
            <div className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              {/* Course list mini */}
              <div className="space-y-2 mb-5">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-slate-400 gap-2">
                    <span className="truncate max-w-[180px]">{item.title}</span>
                    <span className="shrink-0">${item.price}</span>
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
                  <span className="text-3xl font-black text-emerald-300">${total}</span>
                </div>
              </div>

              <button className="mt-8 w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-300 px-6 py-4 text-lg font-bold text-slate-950 shadow-2xl shadow-emerald-300/20 transition hover:scale-[1.01]">
                Proceed to Checkout
                <ArrowRight size={20} />
              </button>

              <p className="mt-5 text-center text-sm text-slate-500">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        )}
      </div>

      {/* BROWSE COURSES MODAL */}
      {showBrowser && (
        <div
          className="modal-bg fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={(e) => e.target === e.currentTarget && setShowBrowser(false)}
        >
          <div className="modal-card w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-white/10 bg-[#0b1326] shadow-2xl overflow-hidden">

            {/* Modal Header */}
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
                  placeholder="Search courses or instructors..."
                  className="bg-transparent flex-1 outline-none text-sm text-white placeholder-slate-500"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-slate-500 hover:text-white transition">
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Course list */}
            <div className="overflow-y-auto px-6 pb-6 space-y-4 flex-1">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen size={36} className="mx-auto mb-3 opacity-40" />
                  <p>No courses found</p>
                </div>
              ) : (
                filtered.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 hover:bg-white/[0.06] transition"
                  >
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-20 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-snug truncate">{course.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">by {course.instructor}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Star size={11} className="text-amber-400 fill-amber-400" />
                          {course.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {course.duration}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-emerald-300 font-bold text-sm">${course.price}</p>
                      <button
                        onClick={() => {
                          handleAdd(course.id);
                          if (filtered.length === 1) setShowBrowser(false);
                        }}
                        className="mt-2 inline-flex items-center gap-1 rounded-xl bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                ))
              )}

              {browseCourses.length === 0 && !search && (
                <div className="text-center py-12 text-slate-500">
                  <ShoppingCart size={36} className="mx-auto mb-3 opacity-40" />
                  <p>All courses are already in your cart!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;