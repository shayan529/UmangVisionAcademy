import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubscription,
  createOrder,
  verifyPayment,
  cancelSubscription,
  clearBillingError,
  resetPaymentSuccess,
} from "../redux/slices/billingSlice";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const daysLeft = (endDate) => {
  if (!endDate) return 0;
  const diff = new Date(endDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const statusColors = {
  active: { bg: "#052e16", text: "#4ade80", label: "Active" },
  expired: { bg: "#2d0a0a", text: "#f87171", label: "Expired" },
  cancelled: { bg: "#1e293b", text: "#94a3b8", label: "Cancelled" },
};

const planColors = { base: "#6366f1", premium: "#a78bfa" };

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ w = "100%", h = 16, r = 8, style = {} }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: r,
      background: "linear-gradient(90deg,#1e293b 25%,#263348 50%,#1e293b 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...style,
    }}
  />
);

// ── Load Razorpay script ──────────────────────────────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Plan passed from Plans page via navigate state
  const selectedPlan = location.state?.plan ?? null;

  const { user } = useSelector((s) => s.auth);
  const {
    subscription,
    order,
    loading,
    orderLoading,
    paymentLoading,
    paymentSuccess,
    error,
  } = useSelector((s) => s.billing);

  const [showCancel, setShowCancel] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user)
      navigate("/login", { state: { from: "/billing" }, replace: true });
  }, [user, navigate]);

  // Fetch current subscription on mount
  useEffect(() => {
    dispatch(fetchSubscription());
  }, [dispatch]);

  // Redirect to dashboard after successful payment
  useEffect(() => {
    if (paymentSuccess) {
      const t = setTimeout(() => {
        dispatch(resetPaymentSuccess());
        navigate("/student-dashboard");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [paymentSuccess, dispatch, navigate]);

  // ── Razorpay checkout flow ────────────────────────────────────────────────
  const handlePay = async (plan) => {
    const ok = await loadRazorpay();
    if (!ok) {
      alert("Failed to load Razorpay. Check your internet connection.");
      return;
    }

    // 1. Create order on backend
    const result = await dispatch(
      createOrder({
        planId: plan.id,
      }),
    );
    if (createOrder.rejected.match(result)) return;

    const { orderId, amount, currency, keyId, mockMode } = result.payload;

    if (mockMode) {
      await dispatch(
        verifyPayment({
          razorpay_order_id: orderId,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
          planId: plan.id,
        }),
      );
      dispatch(fetchSubscription());
      return;
    }

    // 2. Open Razorpay checkout
    const options = {
      key: keyId,
      amount,
      currency,
      name: "Umang Vision Academy",
      description: `${plan.title} — Monthly Subscription`,
      order_id: orderId,
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
      },
      theme: { color: planColors[plan.id] ?? "#7c3aed" },
      handler: async (response) => {
        // 3. Verify on backend
        await dispatch(
          verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planId: plan.id,
          }),
        );
        // Re-fetch subscription to update UI
        dispatch(fetchSubscription());
      },
    };

    new window.Razorpay(options).open();
  };

  const handleCancel = async () => {
    await dispatch(cancelSubscription());
    setShowCancel(false);
    dispatch(fetchSubscription());
  };

  if (!user) return null;

  const activeSub =
    subscription?.status === "active" || subscription?.status === "cancelled"
      ? subscription
      : null;
  const subColor = statusColors[subscription?.status] ?? statusColors.active;
  const accentColor =
    planColors[subscription?.plan ?? selectedPlan?.id] ?? "#7c3aed";
  const days = daysLeft(subscription?.endDate);

  const handleMockPay = async (plan) => {
    await dispatch(
      verifyPayment({
        razorpay_order_id: `mock_order_${Date.now()}`,
        razorpay_payment_id: `mock_pay_${Date.now()}`,
        razorpay_signature: "mock_signature",
        planId: plan.id,
      }),
    );
    dispatch(fetchSubscription());
  };

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1;} 50%{opacity:.5;} }
        .billing-fade { animation: fadeUp 0.4s ease both; }
        .billing-fade:nth-child(2) { animation-delay:0.07s; }
        .billing-fade:nth-child(3) { animation-delay:0.13s; }
        .plan-card:hover { border-color:#334155 !important; transform:translateY(-2px); }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#0b1120",
          color: "#f1f5f9",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
      >
        {/* ── Nav ── */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 28px",
            borderBottom: "1px solid #1e293b",
            background: "#0b1120",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>
            Umang Vision<span style={{ color: "#a78bfa" }}> Academy</span>
          </span>
          <span style={{ fontSize: 13, color: "#64748b" }}>{user?.email}</span>
        </nav>

        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "40px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          {/* ── Success banner ── */}
          {paymentSuccess && (
            <div
              style={{
                background: "#052e16",
                border: "1px solid #16a34a",
                borderRadius: 16,
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 24 }}>🎉</span>
              <div>
                <p style={{ fontWeight: 700, color: "#4ade80", fontSize: 15 }}>
                  Payment successful! Plan activated.
                </p>
                <p style={{ fontSize: 13, color: "#86efac", marginTop: 3 }}>
                  Redirecting to your dashboard…
                </p>
              </div>
            </div>
          )}

          {/* ── Error banner ── */}
          {error && (
            <div
              style={{
                background: "#2d0a0a",
                border: "1px solid #7f1d1d",
                borderRadius: 16,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span style={{ color: "#f87171", fontSize: 13 }}>⚠️ {error}</span>
              <button
                onClick={() => dispatch(clearBillingError())}
                style={{
                  background: "none",
                  border: "none",
                  color: "#f87171",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ── Page title ── */}
          <div className="billing-fade">
            <h1
              style={{
                fontSize: "clamp(26px,4vw,38px)",
                fontWeight: 800,
                color: "#f1f5f9",
              }}
            >
              Billing & Subscription
            </h1>
            <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
              Manage your plan, payment history and subscription.
            </p>
          </div>

          {/* ── Current plan card ── */}
          <div
            className="billing-fade"
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 22,
              padding: "26px 28px",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 14,
              }}
            >
              Current Plan
            </p>

            {loading ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <Sk w="40%" h={28} />
                <Sk w="25%" h={20} />
                <Sk w="60%" h={6} r={4} style={{ marginTop: 8 }} />
              </div>
            ) : subscription ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: 26,
                        fontWeight: 800,
                        color: "#f1f5f9",
                      }}
                    >
                      {subscription.label ?? subscription.plan}
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginTop: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: subColor.bg,
                          color: subColor.text,
                        }}
                      >
                        {subColor.label}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        {subscription.status === "active" ||
                        subscription.status === "cancelled"
                          ? `${days} day${days !== 1 ? "s" : ""} remaining`
                          : ""}
                      </span>
                    </div>
                  </div>
                  {activeSub && (
                    <button
                      onClick={() => setShowCancel(true)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: "1px solid #334155",
                        background: "transparent",
                        color: "#94a3b8",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel Plan
                    </button>
                  )}
                </div>

                {/* Progress bar for days remaining */}
                {activeSub &&
                  subscription.startDate &&
                  subscription.endDate && (
                    <div style={{ marginTop: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          Started {fmt(subscription.startDate)}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          Renews {fmt(subscription.endDate)}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: "#1e293b",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.max(5, (days / 30) * 100)}%`,
                            background: `linear-gradient(90deg,${accentColor},${accentColor}88)`,
                            borderRadius: 4,
                            transition: "width 0.8s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 32 }}>📦</span>
                <div>
                  <p style={{ color: "#94a3b8", fontWeight: 600 }}>
                    No active plan
                  </p>
                  <p style={{ color: "#64748b", fontSize: 13, marginTop: 3 }}>
                    Choose a plan below to get started.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Plan selection (only if no active plan OR plan passed from Plans page) ── */}
          {!activeSub && (
            <div className="billing-fade">
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 14,
                }}
              >
                Choose a Plan
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                  gap: 16,
                }}
              >
                {[
                  {
                    id: "base",
                    title: "Base Plan",
                    price: "₹499",
                    period: "month",
                    amount: 49900,
                    features: [
                      "Classes 1–12 Courses",
                      "Recorded Classes",
                      "AI Tutor",
                      "Practice Quizzes",
                      "Assignment Grading",
                      "Progress Tracking",
                    ],
                    color: "#6366f1",
                  },
                  {
                    id: "premium",
                    title: "Premium",
                    price: "₹999",
                    period: "month",
                    amount: 99900,
                    features: [
                      "Everything in Base plan",
                      "Personalized Learning",
                      "More AI Limits",
                      "Live Interactive Classes",
                      "24x7 Support",
                      "Priority Support",
                    ],
                    color: "#a78bfa",
                    popular: true,
                  },
                ].map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className="plan-card"
                      style={{
                        background: isSelected ? `${plan.color}12` : "#111827",
                        border: `1px solid ${isSelected ? plan.color : "#1e293b"}`,
                        borderRadius: 18,
                        padding: "22px",
                        transition: "all 0.2s",
                        position: "relative",
                        cursor: "default",
                      }}
                    >
                      {plan.popular && (
                        <span
                          style={{
                            position: "absolute",
                            top: 14,
                            right: 14,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: `${plan.color}20`,
                            color: plan.color,
                            border: `1px solid ${plan.color}40`,
                          }}
                        >
                          POPULAR
                        </span>
                      )}
                      <h3
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#f1f5f9",
                        }}
                      >
                        {plan.title}
                      </h3>
                      <div style={{ marginTop: 8, marginBottom: 16 }}>
                        <span
                          style={{
                            fontSize: 30,
                            fontWeight: 800,
                            color: plan.color,
                          }}
                        >
                          {plan.price}
                        </span>
                        <span style={{ fontSize: 13, color: "#64748b" }}>
                          /{plan.period}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          marginBottom: 20,
                        }}
                      >
                        {plan.features.map((f) => (
                          <div
                            key={f}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontSize: 13,
                              color: "#94a3b8",
                            }}
                          >
                            <span style={{ color: "#34d399", flexShrink: 0 }}>
                              ✓
                            </span>
                            {f}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handlePay(plan)}
                        disabled={orderLoading || paymentLoading}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: 12,
                          border: "none",
                          background: `linear-gradient(135deg,${plan.color},${plan.color}99)`,
                          color: "#fff",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                          opacity: orderLoading || paymentLoading ? 0.6 : 1,
                          transition: "opacity 0.2s",
                          boxShadow: `0 6px 20px ${plan.color}30`,
                        }}
                      >
                        {orderLoading || paymentLoading
                          ? "Processing…"
                          : `Pay ${plan.price}`}
                      </button>
                      {process.env.NODE_ENV !== "production" && (
                        <button
                          onClick={() => handleMockPay(plan)}
                          disabled={orderLoading || paymentLoading}
                          style={{
                            width: "100%",
                            marginTop: 8,
                            padding: "10px",
                            borderRadius: 12,
                            border: "1px dashed #334155",
                            background: "transparent",
                            color: "#64748b",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          🧪 Mock Pay (Test Only)
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Upgrade option if on base plan ── */}
          {activeSub && subscription?.plan === "base" && (
            <div
              className="billing-fade"
              style={{
                background: "linear-gradient(135deg,#2e1065,#0f172a)",
                border: "1px solid #7c3aed30",
                borderRadius: 18,
                padding: "22px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <p style={{ fontWeight: 700, color: "#a78bfa", fontSize: 15 }}>
                  Upgrade to Premium
                </p>
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                  Get live classes, personalized paths and priority support.
                </p>
              </div>
              <button
                onClick={() =>
                  handlePay({ id: "premium", title: "Premium", price: "₹999" })
                }
                disabled={orderLoading || paymentLoading}
                style={{
                  padding: "10px 22px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Upgrade — ₹999/mo
              </button>
            </div>
          )}

          {/* ── Payment details ── */}
          {subscription?.razorpayPaymentId && (
            <div
              className="billing-fade"
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 18,
                padding: "22px 24px",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 14,
                }}
              >
                Payment Details
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  ["Payment ID", subscription.razorpayPaymentId],
                  ["Order ID", subscription.razorpayOrderId],
                  ["Plan", subscription.label ?? subscription.plan],
                  ["Activated", fmt(subscription.startDate)],
                  ["Expires", fmt(subscription.endDate)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#64748b" }}>
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#e2e8f0",
                        fontWeight: 600,
                        fontFamily: "monospace",
                        textAlign: "right",
                        wordBreak: "break-all",
                        maxWidth: "60%",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Cancel confirmation modal ── */}
      {showCancel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#111827",
              border: "1px solid #334155",
              borderRadius: 22,
              padding: "28px 28px 24px",
              maxWidth: 400,
              width: "100%",
              animation: "fadeUp 0.25s ease",
            }}
          >
            <h3
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#f1f5f9",
                marginBottom: 10,
              }}
            >
              Cancel Subscription?
            </h3>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 14,
                lineHeight: 1.7,
                marginBottom: 22,
              }}
            >
              Your plan will remain active until{" "}
              <strong style={{ color: "#f1f5f9" }}>
                {fmt(subscription?.endDate)}
              </strong>
              . After that, you'll lose access to premium features.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowCancel(false)}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  background: "transparent",
                  color: "#94a3b8",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 12,
                  border: "none",
                  background: "#7f1d1d",
                  color: "#fca5a5",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
