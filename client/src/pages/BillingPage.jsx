import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import SEO from "../components/common/SEO";
import {
  fetchSubscription,
  createOrder,
  verifyPayment,
  cancelSubscription,
  clearBillingError,
  resetPaymentSuccess,
} from "../redux/slices/billingSlice";
import { loadCurrentUser } from "../redux/slices/authSlice";

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

export default function BillingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    if (!user)
      navigate("/login", { state: { from: "/student-dashboard/billing" }, replace: true });
  }, [user, navigate]);

  useEffect(() => {
    dispatch(fetchSubscription());
  }, [dispatch]);

  useEffect(() => {
    if (paymentSuccess) {
      const timer = setTimeout(() => {
        dispatch(resetPaymentSuccess());
        navigate("/student-dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, dispatch, navigate]);

  const handlePay = async (plan) => {
    if (!selectedClass) {
      alert("Please select a class before purchasing the plan.");
      return;
    }

    const ok = await loadRazorpay();
    if (!ok) {
      alert("Failed to load Razorpay. Check your internet connection.");
      return;
    }

    const result = await dispatch(
      createOrder({
        planId: plan.id,
        selectedClass,
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
          selectedClass,
        }),
      );
      dispatch(fetchSubscription());
      dispatch(loadCurrentUser());
      return;
    }

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
        await dispatch(
          verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planId: plan.id,
            selectedClass,
          }),
        );
        dispatch(fetchSubscription());
        dispatch(loadCurrentUser());
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
    if (!selectedClass) {
      alert("Please select a class before purchasing the plan.");
      return;
    }

    await dispatch(
      verifyPayment({
        razorpay_order_id: `mock_order_${Date.now()}`,
        razorpay_payment_id: `mock_pay_${Date.now()}`,
        razorpay_signature: "mock_signature",
        planId: plan.id,
        selectedClass,
      }),
    );
    dispatch(fetchSubscription());
    dispatch(loadCurrentUser());
  };

  return (
    <>
      <SEO title="Billing" description="Manage your billing and subscriptions at Umang Vision Academy." />
      <style>{`
        @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1;} 50%{opacity:.5;} }
        .billing-fade { animation: fadeUp 0.4s ease both; }
        .billing-fade:nth-child(2) { animation-delay:0.07s; }
        .billing-fade:nth-child(3) { animation-delay:0.13s; }
        .plan-card:hover { border-color:#334155 !important; transform:translateY(-2px); }
        .plan-card.plan-card-premium:hover { transform:translateY(-4px); }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#0b1120",
          color: "#f1f5f9",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
      >

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
                  {activeSub && subscription.status === "active" && (
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

          {(!activeSub || (activeSub && subscription?.plan === "base")) && (
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
                {activeSub ? "Upgrade Plan" : "Choose a Plan"}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                  gap: 16,
                }}
              >
                {[
                  {
                    id: "base",
                    title: t("plans.base.title"),
                    price: t("plans.base.price"),
                    period: t("plans.base.period"),
                    amount: 10000,
                    features: Array.isArray(t("plans.base.features", { returnObjects: true }))
                      ? t("plans.base.features", { returnObjects: true })
                      : [
                          "Select one Class (Class 9 to 12)",
                          "Access all subjects of that class",
                          "Live Lessons and Resources",
                          "AI Tutor & Quizzes",
                          "Progress Tracking",
                        ],
                    color: "#6366f1",
                    popular: false,
                  },
                  {
                    id: "premium",
                    title: t("plans.premium.title", { defaultValue: "Premium" }),
                    price: t("plans.premium.price", { defaultValue: "₹500" }),
                    period: t("plans.premium.period", { defaultValue: "year" }),
                    amount: 50000,
                    features: Array.isArray(
                      t("plans.premium.features", {
                        returnObjects: true,
                        defaultValue: [
                          "Everything in Base plan",
                          "Live doubt-clearing sessions with instructors",
                          "Personalized AI-powered study plan",
                          "Priority instructor support",
                        ],
                      }),
                    )
                      ? t("plans.premium.features", {
                          returnObjects: true,
                          defaultValue: [
                            "Everything in Base plan",
                            "Live doubt-clearing sessions with instructors",
                            "Personalized AI-powered study plan",
                            "Priority instructor support",
                          ],
                        })
                      : [
                          "Everything in Base plan",
                          "Live doubt-clearing sessions with instructors",
                          "Personalized AI-powered study plan",
                          "Priority instructor support",
                        ],
                    color: "#a78bfa",
                    popular: true,
                  },
                ]
                .filter((p) => !activeSub || (activeSub && subscription?.plan === "base" && p.id === "premium"))
                .map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`plan-card${plan.popular ? " plan-card-premium" : ""}`}
                      style={
                        plan.popular
                          ? {
                            background: isSelected
                              ? "linear-gradient(135deg,#4f22a8,#2e1065)"
                              : "linear-gradient(135deg,#4c1d95,#1e1b4b)",
                            border: `1px solid ${isSelected ? plan.color : "#7c3aed50"}`,
                            borderRadius: 20,
                            padding: "24px",
                            transition: "all 0.2s",
                            position: "relative",
                            cursor: "default",
                            boxShadow: "0 10px 30px rgba(124,58,237,0.25)",
                          }
                          : {
                            background: isSelected ? `${plan.color}12` : "#111827",
                            border: `1px solid ${isSelected ? plan.color : "#1e293b"}`,
                            borderRadius: 18,
                            padding: "22px",
                            transition: "all 0.2s",
                            position: "relative",
                            cursor: "default",
                          }
                      }
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
                            background: "#fff",
                            color: "#6d28d9",
                          }}
                        >
                          MOST POPULAR
                        </span>
                      )}
                      <h3
                        style={{
                          fontSize: plan.popular ? 20 : 18,
                          fontWeight: 700,
                          color: "#f1f5f9",
                        }}
                      >
                        {plan.title}
                      </h3>
                      <div style={{ marginTop: 8, marginBottom: 16 }}>
                        <span
                          style={{
                            fontSize: plan.popular ? 34 : 30,
                            fontWeight: 800,
                            color: plan.popular ? "#fff" : plan.color,
                          }}
                        >
                          {plan.price}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: plan.popular ? "#c4b5fd" : "#64748b",
                          }}
                        >
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
                        {(Array.isArray(plan.features) ? plan.features : []).map((f) => (
                          <div
                            key={f}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontSize: 13,
                              color: plan.popular ? "#e9d5ff" : "#94a3b8",
                            }}
                          >
                            <span
                              style={{
                                color: plan.popular ? "#4ade80" : "#34d399",
                                flexShrink: 0,
                              }}
                            >
                              ✓
                            </span>
                            {f}
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: 10,
                            background: plan.popular ? "#fff" : "#1e293b",
                            border: `1px solid ${plan.popular ? "#e2e8f0" : "#334155"}`,
                            color: plan.popular ? "#1e293b" : "#f1f5f9",
                            fontSize: 14,
                            outline: "none",
                            cursor: "pointer",
                          }}
                        >
                          <option value="" disabled>Select your Class</option>
                          <option value="Class 9">Class 9</option>
                          <option value="Class 10">Class 10</option>
                          <option value="Class 11">Class 11</option>
                          <option value="Class 12">Class 12</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handlePay(plan)}
                        disabled={orderLoading || paymentLoading}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: 12,
                          border: "none",
                          background: plan.popular
                            ? "#fff"
                            : `linear-gradient(135deg,${plan.color},${plan.color}99)`,
                          color: plan.popular ? "#6d28d9" : "#fff",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                          opacity: orderLoading || paymentLoading ? 0.6 : 1,
                          transition: "opacity 0.2s",
                          boxShadow: plan.popular
                            ? "0 6px 20px rgba(255,255,255,0.15)"
                            : `0 6px 20px ${plan.color}30`,
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
                            border: `1px dashed ${plan.popular ? "#a78bfa60" : "#334155"}`,
                            background: "transparent",
                            color: plan.popular ? "#c4b5fd" : "#64748b",
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