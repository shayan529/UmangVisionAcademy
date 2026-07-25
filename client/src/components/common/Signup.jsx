import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, clearError } from "../../redux/slices/authSlice";
import { toast } from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import api from "../../config/api";

import { getCustomRole, hasCustomRole as checkHasCustomRole, hasBaseRole } from "../../utils/permissions";
import { getCitiesForState, INDIA_STATES } from "../../data/indiaLocations";
import { isFirebaseConfigured } from "../../config/firebase";
import {
  setupRecaptchaVerifier,
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
  clearRecaptcha,
} from "../../services/firebasePhoneAuth";



/* ── Animated particle canvas ── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const NODES = Array.from({ length: 55 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 900,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 0.8,
      alpha: Math.random() * 0.45 + 0.1,
    }));

    const draw = () => {
      const W = canvas.width,
        H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < NODES.length; i++) {
        for (let j = i + 1; j < NODES.length; j++) {
          const dx = NODES[i].x - NODES[j].x;
          const dy = NODES[i].y - NODES[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 145) {
            ctx.beginPath();
            ctx.moveTo(NODES[i].x, NODES[i].y);
            ctx.lineTo(NODES[j].x, NODES[j].y);
            ctx.strokeStyle = `rgba(99,179,237,${(1 - dist / 145) * 0.16})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      NODES.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147,210,255,${n.alpha})`;
        ctx.fill();
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.65 }}
    />
  );
};

/* ── Helper for sessionStorage persistence ── */
const getSessionValue = (key, defaultValue) => {
  try {
    const saved = sessionStorage.getItem(key);
    if (saved !== null) return JSON.parse(saved);
  } catch (e) {
    console.error("Error reading sessionStorage", e);
  }
  return defaultValue;
};

/* ── Signup ── */
const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (isAuthenticated && user) {
      const isAdmin = hasBaseRole(user, "admin");
      const isStaff = !isAdmin && checkHasCustomRole(user);
      const isInstructor =
        !isAdmin && !isStaff && hasBaseRole(user, "instructor");

      let from = location.state?.from;
      if (from) {
        let path = typeof from === "string" ? from : from.pathname;
        if (path && typeof path === "string") {
          const lowerPath = path.toLowerCase();
          if (user?.subscription?.status === "active" && (lowerPath.includes("billing") || lowerPath.includes("plans"))) {
            from = "/student-dashboard";
          }
        }
        navigate(from, { replace: true });
        return;
      }

      if (isAdmin) navigate("/admin-dashboard", { replace: true });
      else if (isStaff) navigate("/staff-dashboard", { replace: true });
      else if (isInstructor)
        navigate("/instructor-dashboard", { replace: true });
      else navigate("/student-dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  useEffect(() => {
    return () => {
      clearRecaptcha("recaptcha-container");
    };
  }, []);



  const [phoneOtpSent, setPhoneOtpSent] = useState(() =>
    getSessionValue("signup_phoneOtpSent", false),
  );
  const [phoneVerified, setPhoneVerified] = useState(() =>
    getSessionValue("signup_phoneVerified", false),
  );
  const [phoneOtpInputs, setPhoneOtpInputs] = useState(() =>
    getSessionValue("signup_phoneOtpInputs", ["", "", "", "", "", ""]),
  );
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const [firebaseConfirmationResult, setFirebaseConfirmationResult] = useState(null);
  const phoneOtpRefs = useRef([]);


  const [formData, setFormData] = useState(() =>
    getSessionValue("signup_formData", {
      name: "",
      email: "",
      countryCode: "+91",
      phoneNumber: "",
      city: "",
      state: "",
      pincode: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
    }),
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(() =>
    getSessionValue("signup_agreedToTerms", false),
  );
  const [submitting, setSubmitting] = useState(false);
  const [referralAutoFilled, setReferralAutoFilled] = useState(false);

  // Sync state changes with sessionStorage
  useEffect(() => {
    sessionStorage.setItem("signup_phoneOtpSent", JSON.stringify(phoneOtpSent));
  }, [phoneOtpSent]);

  useEffect(() => {
    sessionStorage.setItem(
      "signup_phoneVerified",
      JSON.stringify(phoneVerified),
    );
  }, [phoneVerified]);

  useEffect(() => {
    sessionStorage.setItem(
      "signup_phoneOtpInputs",
      JSON.stringify(phoneOtpInputs),
    );
  }, [phoneOtpInputs]);

  useEffect(() => {
    sessionStorage.setItem(
      "signup_agreedToTerms",
      JSON.stringify(agreedToTerms),
    );
  }, [agreedToTerms]);

  useEffect(() => {
    sessionStorage.setItem("signup_formData", JSON.stringify(formData));
  }, [formData]);

  // ── Password validation ──
  const passwordRules = [
    {
      id: "len",
      label: t("auth.passwordRuleLen"),
      test: (p) => (p || "").length >= 6,
    },
    {
      id: "upper",
      label: t("auth.passwordRuleUpper"),
      test: (p) => /[A-Z]/.test(p || ""),
    },
    {
      id: "lower",
      label: t("auth.passwordRuleLower"),
      test: (p) => /[a-z]/.test(p || ""),
    },
    {
      id: "num",
      label: t("auth.passwordRuleNum"),
      test: (p) => /\d/.test(p || ""),
    },
    {
      id: "spec",
      label: t("auth.passwordRuleSpec"),
      test: (p) => /[^A-Za-z0-9]/.test(p || ""),
    },
  ];


  const getStrength = (p) => {
    const n = passwordRules.filter((r) => r.test(p)).length;
    if (!p) return null;
    if (n <= 2)
      return { label: t("auth.strengthWeak"), color: "#ef4444", width: "25%" };
    if (n === 3)
      return { label: t("auth.strengthFair"), color: "#f59e0b", width: "50%" };
    if (n === 4)
      return { label: t("auth.strengthGood"), color: "#0ea5e9", width: "75%" };
    return { label: t("auth.strengthStrong"), color: "#22c55e", width: "100%" };
  };

  const strength = getStrength(formData.password);
  const passwordsMatch =
    formData.confirmPassword && formData.password === formData.confirmPassword;

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    const refCode = new URLSearchParams(location.search).get("ref");
    if (refCode) {
      setFormData((prev) => ({
        ...prev,
        referralCode: refCode.trim().toUpperCase(),
      }));
      setReferralAutoFilled(true);
    } else {
      setReferralAutoFilled(false);
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "state" && { city: "" }),
    }));
  };

  const states = INDIA_STATES;
  const cityOptions = getCitiesForState(formData.state);
  const countryCodes = [{ code: "+91", country: "India" }];

  useEffect(() => {
    if (phoneResendCooldown <= 0) return;
    const timer = setTimeout(() => setPhoneResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phoneResendCooldown]);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, phoneNumber: value }));
    if (phoneVerified || phoneOtpSent) {
      setPhoneVerified(false);
      setPhoneOtpSent(false);
      setPhoneOtpInputs(["", "", "", "", "", ""]);
    }
  };

  // FIX: Single declaration. Accepts a raw 10-digit number (without country code)
  // and returns a normalized E.164 string, or null if invalid.
  const normalizeIndianPhoneNumber = (phoneNumber) => {
    const digits = phoneNumber.replace(/\D/g, "");
    if (/^\d{10}$/.test(digits)) return `+91${digits}`;
    if (/^91\d{10}$/.test(digits)) return `+${digits}`;
    return null;
  };

  const handleSendPhoneOtp = async () => {
    const normalizedPhoneNumber = normalizeIndianPhoneNumber(
      formData.phoneNumber,
    );

    if (!normalizedPhoneNumber) {
      toast.error(
        t("auth.invalidPhone") ||
          "Enter a valid 10-digit Indian mobile number.",
      );
      return;
    }

    setSendingPhoneOtp(true);
    try {
      if (isFirebaseConfigured()) {
        try {
          const verifier = setupRecaptchaVerifier("recaptcha-container");
          const confirmation = await sendFirebasePhoneOtp(
            normalizedPhoneNumber,
            verifier,
          );
          setFirebaseConfirmationResult(confirmation);
          toast.success(t("auth.otpSentPhone"));
          setPhoneOtpSent(true);
          setPhoneResendCooldown(30);
          setTimeout(() => phoneOtpRefs.current[0]?.focus(), 100);
          return;
        } catch (fbErr) {
          console.error("Firebase Phone Auth error:", fbErr);
          clearRecaptcha("recaptcha-container");
          const fbMsg =
            fbErr?.code === "auth/unauthorized-domain"
              ? "This domain is not authorized in your Firebase Console (Authentication -> Settings -> Authorized domains)."
              : fbErr?.message || "Failed to send Firebase OTP.";
          toast.error(fbMsg);
          return;
        }

      }

      await api.post("/auth/send-phone-otp", {
        phoneNumber: normalizedPhoneNumber,
      });
      toast.success(t("auth.otpSentPhone"));
      setPhoneOtpSent(true);
      setPhoneResendCooldown(30);
      setTimeout(() => phoneOtpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || t("auth.failedOtp"));
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handlePhoneOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...phoneOtpInputs];
    updated[index] = value.slice(-1);
    setPhoneOtpInputs(updated);
    if (value && index < 5) phoneOtpRefs.current[index + 1]?.focus();
  };

  const handlePhoneOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !phoneOtpInputs[index] && index > 0)
      phoneOtpRefs.current[index - 1]?.focus();
  };

  const handlePhoneOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const updated = [...phoneOtpInputs];
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setPhoneOtpInputs(updated);
    phoneOtpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyPhoneOtp = async () => {
    const code = phoneOtpInputs.join("");
    const normalizedPhoneNumber = normalizeIndianPhoneNumber(
      formData.phoneNumber,
    );

    if (code.length < 6) {
      toast.error(t("auth.enterFullOtp"));
      return;
    }

    if (!normalizedPhoneNumber) {
      toast.error(
        t("auth.invalidPhone") ||
          "Enter a valid 10-digit Indian mobile number.",
      );
      return;
    }

    setVerifyingPhone(true);
    try {
      if (isFirebaseConfigured() && firebaseConfirmationResult) {
        const { idToken } = await verifyFirebasePhoneOtp(
          firebaseConfirmationResult,
          code,
        );
        await api.post("/auth/verify-firebase-token", {
          firebaseToken: idToken,
          phoneNumber: normalizedPhoneNumber,
        });
        setPhoneVerified(true);
        setPhoneOtpSent(false);
        toast.success(t("auth.phoneVerified") + " ✓");
        return;
      }

      await api.post("/auth/verify-phone-otp", {
        phoneNumber: normalizedPhoneNumber,
        otp: code,
      });
      setPhoneVerified(true);
      setPhoneOtpSent(false);
      toast.success(t("auth.phoneVerified") + " ✓");
    } catch (err) {
      console.error("Verification error:", err);
      const msg =
        err?.code === "auth/code-expired"
          ? "The verification code has expired. Please click Resend to get a new code."
          : err?.code === "auth/invalid-verification-code"
          ? "Invalid verification code. Please check your SMS and try again."
          : err?.response?.data?.message || err?.message || t("auth.invalidOtp");
      toast.error(msg);
      setPhoneOtpInputs(["", "", "", "", "", ""]);
      phoneOtpRefs.current[0]?.focus();
    } finally {
      setVerifyingPhone(false);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    const failedRules = passwordRules.filter((r) => !r.test(formData.password));
    if (failedRules.length > 0) {
      toast.error(`${t("auth.password")}: ${failedRules[0].label}`);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error(t("auth.passwordsMismatch"));
      return;
    }
    if (!agreedToTerms) {
      toast.error(t("auth.agreeTerms"));
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      toast.error(t("auth.invalidPhone"));
      return;
    }
    if (!phoneVerified) {
      toast.error(t("auth.verifyPhoneFirst"));
      return;
    }
    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      toast.error(t("auth.invalidPincode"));
      return;
    }

    const { confirmPassword, countryCode, phoneNumber, ...rest } = formData;
    const payload = {
      ...rest,
      phoneNumber: `${countryCode}${phoneNumber}`,
      referralCode: rest.referralCode?.trim().toUpperCase() || undefined,
    };

    setSubmitting(true);
    try {
      const result = await dispatch(register(payload));
      if (register.fulfilled.match(result)) {
        toast(t("auth.accountCreated"), { icon: "👋" });
        sessionStorage.removeItem("signup_phoneOtpSent");
        sessionStorage.removeItem("signup_phoneVerified");
        sessionStorage.removeItem("signup_phoneOtpInputs");
        sessionStorage.removeItem("signup_agreedToTerms");
        sessionStorage.removeItem("signup_formData");
        navigate("/student-dashboard");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (name) =>
    `w-full border rounded-2xl px-5 py-3.5 text-white text-sm outline-none transition-all duration-300 placeholder-slate-500 bg-[#1e293b] ${
      focused === name
        ? "border-cyan-400/70 shadow-[0_0_0_3px_rgba(34,211,238,0.1)]"
        : "border-white/10 hover:border-white/20"
    }`;

  const selectCls = (name) =>
    `w-full border rounded-2xl pl-3.5 pr-8 py-3.5 text-white text-sm outline-none transition-all duration-300 bg-[#1e293b] ${
      focused === name
        ? "border-cyan-400/70 shadow-[0_0_0_3px_rgba(34,211,238,0.1)]"
        : "border-white/10 hover:border-white/20"
    }`;

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col overflow-hidden relative signup-page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=DM+Sans:wght@400;500&display=swap');
        .df { font-family:'Outfit',sans-serif; }
        .signup-page-wrapper, .signup-page-wrapper * { font-family:'DM Sans',sans-serif; }
        @keyframes pulse-orb { 0%,100%{transform:scale(1);opacity:.2} 50%{transform:scale(1.1);opacity:.32} }
        @keyframes pulse-orb2 { 0%,100%{transform:scale(1);opacity:.14} 50%{transform:scale(1.08);opacity:.22} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes spin-rev  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes twinkle { 0%,100%{opacity:.15;transform:scale(.7)} 50%{opacity:1;transform:scale(1.3)} }

        .orb1 { animation:pulse-orb 9s ease-in-out infinite; }
        .orb2 { animation:pulse-orb2 13s ease-in-out infinite 3s; }
        .orb3 { animation:pulse-orb 16s ease-in-out infinite 6s; }
        .ring1 { animation:spin-slow 24s linear infinite; transform-origin:center; }
        .ring2 { animation:spin-rev 34s linear infinite; transform-origin:center; }
        .floaty { animation:float 6s ease-in-out infinite; }
        .star  { animation:twinkle var(--d,3s) ease-in-out infinite var(--del,0s); }
        .su  { animation:slide-up .65s cubic-bezier(.22,1,.36,1) both; }
        .fi  { animation:fade-in .5s ease both; }

        .shimmer-txt {
          background:linear-gradient(90deg,#e2e8f0 0%,#67e8f9 40%,#818cf8 60%,#e2e8f0 100%);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:shimmer 4s linear infinite;
        }
        .card-glow {
          box-shadow:0 0 0 1px rgba(99,179,237,.12),0 25px 60px rgba(0,0,0,.55),0 0 80px rgba(56,189,248,.05),inset 0 1px 0 rgba(255,255,255,.06);
        }
        .btn-grad {
          background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);
          box-shadow:0 4px 24px rgba(14,165,233,.35),inset 0 1px 0 rgba(255,255,255,.12);
          transition:all .25s ease;
        }
        .btn-grad:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(14,165,233,.45),inset 0 1px 0 rgba(255,255,255,.18); }
        .btn-grad:active { transform:translateY(0); }
      `}</style>

      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#060d1f] via-[#0B1120] to-[#0d1635]" />
        <ParticleCanvas />

        <div
          className="orb1 absolute -top-32 -left-20 w-[520px] h-[520px] rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(56,189,248,.22) 0%,transparent 70%)",
          }}
        />
        <div
          className="orb2 absolute -bottom-36 -right-24 w-[620px] h-[620px] rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%)",
          }}
        />
        <div
          className="orb3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(14,165,233,.06) 0%,transparent 70%)",
          }}
        />

        <div
          className="ring1 absolute top-[8%] right-[4%] w-[350px] h-[350px] rounded-full opacity-[0.07]"
          style={{ border: "1px solid rgba(147,210,255,.9)" }}
        />
        <div
          className="ring2 absolute top-[5%] right-[2%] w-[420px] h-[420px] rounded-full opacity-[0.04]"
          style={{ border: "1px dashed rgba(147,210,255,.9)" }}
        />

        <svg
          className="absolute inset-0 w-full h-full opacity-[0.025]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="g"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M60 0L0 0 0 60"
                fill="none"
                stroke="rgba(147,210,255,1)"
                strokeWidth=".5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>

        {[
          { t: "7%", l: "10%", d: "2.8s", del: "0s" },
          { t: "14%", l: "73%", d: "3.5s", del: ".7s" },
          { t: "32%", l: "4%", d: "4s", del: "1.2s" },
          { t: "54%", l: "90%", d: "3.1s", del: ".3s" },
          { t: "72%", l: "18%", d: "2.5s", del: "1.8s" },
          { t: "83%", l: "58%", d: "3.8s", del: ".9s" },
          { t: "46%", l: "48%", d: "5s", del: "2.1s" },
          { t: "22%", l: "38%", d: "2.2s", del: ".4s" },
        ].map((s, i) => (
          <div
            key={i}
            className="star absolute w-1 h-1 rounded-full bg-white"
            style={{ top: s.t, left: s.l, "--d": s.d, "--del": s.del }}
          />
        ))}

        <div
          className="floaty absolute top-[20%] left-[7%] w-14 h-14 opacity-[.15]"
          style={{ animationDelay: "1s" }}
        >
          <svg viewBox="0 0 56 56">
            <polygon
              points="28,4 52,48 4,48"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div
          className="floaty absolute bottom-[20%] right-[9%] w-10 h-10 opacity-[.12]"
          style={{ animationDelay: "3s" }}
        >
          <svg viewBox="0 0 40 40">
            <rect
              x="6"
              y="6"
              width="28"
              height="28"
              fill="none"
              stroke="#818cf8"
              strokeWidth="1.5"
              transform="rotate(20 20 20)"
            />
          </svg>
        </div>
        <div
          className="floaty absolute top-[62%] left-[2%] w-8 h-8 opacity-[.18]"
          style={{ animationDelay: "2s" }}
        >
          <svg viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="12"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-5xl flex items-center gap-14">
          {/* Left hero */}
          <div
            className="hidden lg:flex flex-col flex-1 gap-8 su"
            style={{ animationDelay: ".2s" }}
          >
            <div className="floaty relative">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-20"
                style={{
                  background: "radial-gradient(circle,#38bdf8,transparent 70%)",
                }}
              />
              <svg viewBox="0 0 300 320" className="w-72 h-72 drop-shadow-2xl">
                {[
                  { x: 30, y: 20, f: "#38bdf8", r: 20 },
                  { x: 200, y: 10, f: "#6366f1", r: 45 },
                  { x: 250, y: 50, f: "#0ea5e9", r: -15 },
                  { x: 10, y: 150, f: "#818cf8", r: 30 },
                ].map((c, i) => (
                  <rect
                    key={i}
                    x={c.x}
                    y={c.y}
                    width="9"
                    height="9"
                    fill={c.f}
                    transform={`rotate(${c.r} ${c.x + 4.5} ${c.y + 4.5})`}
                    rx="1"
                    opacity=".8"
                  />
                ))}
                <path d="M270 130L278 115 286 130Z" fill="#38bdf8" />
                <path d="M15 80L22 67 29 80Z" fill="#6366f1" />
                <path
                  d="M240 70l3 9h9l-7 5 3 9-8-5-8 5 3-9-7-5h9z"
                  fill="#38bdf8"
                  opacity=".9"
                />
                <circle cx="150" cy="180" r="90" fill="rgba(14,165,233,.05)" />
                <circle cx="150" cy="100" r="35" fill="#0d1f3c" />
                <circle cx="150" cy="100" r="28" fill="#f5c5a3" />
                <circle cx="141" cy="96" r="3" fill="#1a1a2e" />
                <circle cx="159" cy="96" r="3" fill="#1a1a2e" />
                <path
                  d="M141 108Q150 116 159 108"
                  stroke="#1a1a2e"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <rect
                  x="128"
                  y="72"
                  width="44"
                  height="8"
                  fill="#0d1f3c"
                  rx="1"
                />
                <polygon points="150,58 128,72 172,72" fill="#0d1f3c" />
                <rect x="172" y="74" width="3" height="14" fill="#0d1f3c" />
                <circle cx="173.5" cy="90" r="5" fill="#38bdf8" />
                <path
                  d="M110 135Q120 128 150 130Q180 128 190 135L200 240 100 240Z"
                  fill="#0d1f3c"
                />
                <path
                  d="M135 130L150 155 165 130"
                  fill="#0ea5e9"
                  opacity=".9"
                />
                <path
                  d="M188 145Q210 130 225 110"
                  stroke="#f5c5a3"
                  strokeWidth="14"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx="225" cy="110" r="10" fill="#f5c5a3" />
                <rect
                  x="195"
                  y="95"
                  width="32"
                  height="22"
                  fill="#e8f4ff"
                  rx="3"
                />
                <path
                  d="M200 102h22M200 108h16M200 114h20"
                  stroke="#aac"
                  strokeWidth="1.5"
                />
                <path
                  d="M112 145Q95 175 90 200"
                  stroke="#0d1f3c"
                  strokeWidth="14"
                  fill="none"
                  strokeLinecap="round"
                />
                <rect
                  x="125"
                  y="235"
                  width="20"
                  height="55"
                  fill="#0d1f3c"
                  rx="4"
                />
                <rect
                  x="155"
                  y="235"
                  width="20"
                  height="55"
                  fill="#0d1f3c"
                  rx="4"
                />
                <ellipse cx="135" cy="292" rx="18" ry="8" fill="#060d1f" />
                <ellipse cx="165" cy="292" rx="18" ry="8" fill="#060d1f" />
              </svg>
            </div>
            <div>
              <p className="text-cyan-400/70 text-xs font-semibold tracking-[.2em] uppercase mb-3">
                {t("authHero.tag")}
              </p>
              <h1 className="df text-5xl font-black leading-[1.1] text-white">
                {t("authHero.headingLine1")}
                <br />
                {t("authHero.headingLine2")}{" "}
                <span className="shimmer-txt">
                  {t("authHero.headingHighlight")}
                </span>
              </h1>
              <p className="text-slate-400 mt-4 text-sm leading-relaxed max-w-xs">
                {t("authHero.description")}
              </p>
            </div>
          </div>

          {/* Right card */}
          <div
            className="w-full max-w-md su"
            style={{ animationDelay: ".35s" }}
          >
            <div
              className="h-[2px] w-full rounded-t-full mb-[-2px] relative z-10"
              style={{
                background:
                  "linear-gradient(90deg,transparent,#38bdf8,#6366f1,transparent)",
              }}
            />

            <div
              className="card-glow rounded-3xl p-9 w-full"
              style={{
                background:
                  "linear-gradient(160deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.02) 100%)",
                backdropFilter: "blur(24px)",
              }}
            >
              {/* Mobile Logo & Title */}
              <div className="flex lg:hidden items-center justify-start mb-6">
                <img
                  src="/Logo.png"
                  alt="Logo"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain mr-3"
                />
                <div className="flex flex-wrap items-center">
                  <span className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
                    Umang Vision
                  </span>
                  <span className="ml-1 shimmer-txt text-lg sm:text-xl font-extrabold tracking-wide">
                    Academy
                  </span>
                </div>
              </div>

              <div className="text-center mb-7">
                <h2 className="df text-3xl font-black text-white">
                  {t("auth.signup")}
                </h2>
                <p className="text-slate-400 mt-1.5 text-sm">
                  {t("auth.joinLearners")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div id="recaptcha-container"></div>
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">
                    {t("auth.name")}
                    <span className="normal-case text-xl font-normal text-red-500 tracking-normal">
                      *
                    </span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused("")}
                    placeholder={t("auth.namePlaceholder")}
                    required
                    className={inputCls("name")}
                  />
                </div>

                {/* Email — optional */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">
                    {t("auth.email")}{" "}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                    placeholder={t("auth.emailPlaceholder")}
                    className={inputCls("email")}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">
                    {t("auth.phoneNumber")}
                    <span className="normal-case text-xl font-normal text-red-500 tracking-normal">
                      *
                    </span>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                    <div className="flex gap-2 flex-1 min-w-0">
                      <div
                        className="w-16 sm:w-20 shrink-0 border border-white/10 rounded-2xl px-2.5 sm:px-3 py-3.5 bg-[#1e293b] text-white text-sm font-bold flex items-center justify-center transition-all duration-300"
                        style={
                          focused === "countryCode"
                            ? {
                                borderColor: "rgba(34,211,238,0.7)",
                                boxShadow: "0 0 0 3px rgba(34,211,238,0.1)",
                              }
                            : {}
                        }
                      >
                        +91
                      </div>

                      <div className="relative flex-1 min-w-0">
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handlePhoneChange}
                          onFocus={() => setFocused("phoneNumber")}
                          onBlur={() => setFocused("")}
                          placeholder={t("auth.phonePlaceholder")}
                          required
                          maxLength={10}
                          disabled={phoneVerified}
                          className={
                            inputCls("phoneNumber") +
                            " px-3.5 sm:px-5 pr-10 disabled:opacity-50 flex-1 min-w-0"
                          }
                        />
                        {phoneVerified && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg
                              viewBox="0 0 20 20"
                              className="w-5 h-5"
                              fill="none"
                            >
                              <circle
                                cx="10"
                                cy="10"
                                r="9"
                                fill="rgba(34,197,94,0.15)"
                                stroke="#22c55e"
                                strokeWidth="1.5"
                              />
                              <path
                                d="M6 10l3 3 5-5"
                                stroke="#22c55e"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>

                    {!phoneVerified && (
                      <button
                        type="button"
                        onClick={handleSendPhoneOtp}
                        disabled={
                          sendingPhoneOtp ||
                          formData.phoneNumber.length < 10 ||
                          phoneResendCooldown > 0
                        }
                        className="w-full sm:w-auto shrink-0 px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
                        style={{
                          background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
                          boxShadow: "0 4px 14px rgba(14,165,233,.3)",
                        }}
                      >
                        {sendingPhoneOtp ? (
                          <svg
                            className="w-4 h-4 animate-spin mx-auto"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="rgba(255,255,255,.3)"
                              strokeWidth="3"
                            />
                            <path
                              d="M12 2a10 10 0 0 1 10 10"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : phoneResendCooldown > 0 ? (
                          `${phoneResendCooldown}s`
                        ) : phoneOtpSent ? (
                          t("auth.resend")
                        ) : (
                          t("auth.sendOtp")
                        )}
                      </button>
                    )}

                    {phoneVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneVerified(false);
                          setPhoneOtpSent(false);
                          setPhoneOtpInputs(["", "", "", "", "", ""]);
                        }}
                        className="w-full sm:w-auto shrink-0 px-6 py-3.5 rounded-2xl text-sm font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                      >
                        {t("auth.edit")}
                      </button>
                    )}
                  </div>

                  {/* Phone OTP box */}
                  {phoneOtpSent && !phoneVerified && (
                    <div
                      className="mt-3 p-4 rounded-2xl"
                      style={{
                        background: "rgba(14,165,233,0.05)",
                        border: "1px solid rgba(56,189,248,0.15)",
                      }}
                    >
                      <p className="text-xs text-slate-400 mb-3 text-center">
                        {t("auth.otpSentTo")}{" "}
                        <span className="text-cyan-400 font-semibold">
                          {formData.countryCode} {formData.phoneNumber}
                        </span>
                      </p>
                      <div className="flex gap-2 justify-center mb-3">
                        {phoneOtpInputs.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => (phoneOtpRefs.current[i] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              handlePhoneOtpChange(i, e.target.value)
                            }
                            onKeyDown={(e) => handlePhoneOtpKeyDown(i, e)}
                            onPaste={i === 0 ? handlePhoneOtpPaste : undefined}
                            className="w-10 text-center text-lg font-bold text-white rounded-xl outline-none transition-all duration-200"
                            style={{
                              height: "44px",
                              background: digit
                                ? "rgba(14,165,233,0.12)"
                                : "rgba(255,255,255,0.05)",
                              border: digit
                                ? "1px solid rgba(56,189,248,0.6)"
                                : "1px solid rgba(255,255,255,0.12)",
                              boxShadow: digit
                                ? "0 0 0 3px rgba(34,211,238,0.08)"
                                : "none",
                            }}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyPhoneOtp}
                        disabled={
                          verifyingPhone || phoneOtpInputs.join("").length < 6
                        }
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
                        style={{
                          background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
                          boxShadow: "0 4px 14px rgba(14,165,233,.25)",
                        }}
                      >
                        {verifyingPhone ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="w-4 h-4 animate-spin"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="rgba(255,255,255,.3)"
                                strokeWidth="3"
                              />
                              <path
                                d="M12 2a10 10 0 0 1 10 10"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            </svg>
                            {t("auth.verifying")}
                          </span>
                        ) : (
                          t("auth.verifyPhone")
                        )}
                      </button>
                    </div>
                  )}

                  {phoneVerified && (
                    <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5">
                      <svg
                        viewBox="0 0 16 16"
                        className="w-3.5 h-3.5"
                        fill="none"
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="7"
                          fill="rgba(34,197,94,0.15)"
                          stroke="#22c55e"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M5 8l2.5 2.5L11 6"
                          stroke="#22c55e"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {t("auth.phoneVerified")}
                    </p>
                  )}
                </div>

                {/* Referral Code (optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">
                    Referral Code
                  </label>
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    onFocus={() => setFocused("referralCode")}
                    onBlur={() => setFocused("")}
                    placeholder="Enter referral code"
                    readOnly={referralAutoFilled}
                    className={
                      inputCls("referralCode") +
                      (referralAutoFilled
                        ? " cursor-not-allowed bg-slate-800/70"
                        : "")
                    }
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    If you have a referral code, add it here to earn bonus
                    coins.
                  </p>
                </div>

                {/* State / City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">
                      {t("auth.state")}
                      <span className="normal-case text-xl font-normal text-red-500 tracking-normal">
                        *
                      </span>
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      onFocus={() => setFocused("state")}
                      onBlur={() => setFocused("")}
                      required
                      className={selectCls("state")}
                    >
                      <option value="" disabled>
                        {t("auth.selectState")}
                      </option>
                      {states.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">
                      {t("auth.city")}
                      <span className="normal-case text-xl font-normal text-red-500 tracking-normal">
                        *
                      </span>
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      onFocus={() => setFocused("city")}
                      onBlur={() => setFocused("")}
                      required
                      className={
                        selectCls("city") +
                        (!formData.state
                          ? " cursor-not-allowed opacity-50"
                          : "")
                      }
                      disabled={!formData.state}
                    >
                      <option value="" disabled>
                        {formData.state
                          ? t("auth.selectCity") || "Select City"
                          : t("auth.selectState") || "Select State first"}
                      </option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">
                      {t("auth.pincode")}
                      <span className="normal-case text-xl font-normal text-red-500 tracking-normal">
                        *
                      </span>
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setFormData((p) => ({ ...p, pincode: v }));
                      }}
                      onFocus={() => setFocused("pincode")}
                      onBlur={() => setFocused("")}
                      placeholder={t("auth.pincodePlaceholder")}
                      required
                      maxLength={6}
                      className={inputCls("pincode")}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">
                    {t("auth.password")}
                    <span className="normal-case text-xl font-normal text-red-500 tracking-normal">
                      *
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused("")}
                      placeholder={t("auth.passwordPlaceholder")}
                      required
                      className={inputCls("password") + " pr-12"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-300 transition-colors"
                    >
                      {showPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>

                  {formData.password && strength && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">
                          {t("auth.passwordStrength")}
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: strength.color }}
                        >
                          {strength.label}
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: strength.width,
                            background: strength.color,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {(focused === "password" || formData.password) && (
                    <div
                      className="mt-2.5 p-3 rounded-xl space-y-1.5"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {passwordRules.map((rule) => {
                        const ok = rule.test(formData.password);
                        return (
                          <div
                            key={rule.id}
                            className="flex items-center gap-2"
                          >
                            <span className="flex-shrink-0">
                              {ok ? (
                                <svg
                                  viewBox="0 0 16 16"
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                >
                                  <circle
                                    cx="8"
                                    cy="8"
                                    r="7"
                                    fill="rgba(34,197,94,0.15)"
                                    stroke="#22c55e"
                                    strokeWidth="1.5"
                                  />
                                  <path
                                    d="M5 8l2.5 2.5L11 5.5"
                                    stroke="#22c55e"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  viewBox="0 0 16 16"
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                >
                                  <circle
                                    cx="8"
                                    cy="8"
                                    r="7"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="1.5"
                                  />
                                </svg>
                              )}
                            </span>
                            <span
                              className={`text-xs transition-colors ${ok ? "text-emerald-400" : "text-slate-500"}`}
                            >
                              {rule.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">
                    {t("auth.confirmPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocused("confirmPassword")}
                      onBlur={() => setFocused("")}
                      placeholder={t("auth.passwordPlaceholder")}
                      required
                      className={
                        inputCls("confirmPassword") +
                        " pr-12" +
                        (formData.confirmPassword && !passwordsMatch
                          ? " !border-red-500/60"
                          : "") +
                        (passwordsMatch ? " !border-emerald-500/60" : "")
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-300 transition-colors"
                    >
                      {showConfirm ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <p
                      className={`mt-1.5 text-xs flex items-center gap-1.5 ${passwordsMatch ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {passwordsMatch ? (
                        <>
                          <svg
                            viewBox="0 0 16 16"
                            className="w-3.5 h-3.5"
                            fill="none"
                          >
                            <circle
                              cx="8"
                              cy="8"
                              r="7"
                              fill="rgba(34,197,94,0.15)"
                              stroke="#22c55e"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M5 8l2.5 2.5L11 5.5"
                              stroke="#22c55e"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {t("auth.passwordsMatch")}
                        </>
                      ) : (
                        <>
                          <svg
                            viewBox="0 0 16 16"
                            className="w-3.5 h-3.5"
                            fill="none"
                          >
                            <circle
                              cx="8"
                              cy="8"
                              r="7"
                              fill="rgba(239,68,68,0.1)"
                              stroke="#ef4444"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M5.5 5.5l5 5M10.5 5.5l-5 5"
                              stroke="#ef4444"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                          {t("auth.passwordsNoMatch")}
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded accent-cyan-400 flex-shrink-0"
                  />
                  <label
                    htmlFor="terms"
                    className="text-slate-400 text-sm cursor-pointer leading-relaxed"
                  >
                    {t("auth.termsAgree")}{" "}
                    <span className="text-cyan-400 hover:text-cyan-300 transition-colors">
                      <Link to="/terms">{t("auth.termsOf")}</Link>
                    </span>{" "}
                    {t("auth.and")}{" "}
                    <span className="text-cyan-400 hover:text-cyan-300 transition-colors">
                      <Link to="/privacy">{t("auth.privacyPolicy")}</Link>
                    </span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || submitting}
                  className="btn-grad w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 mt-1 disabled:opacity-60"
                >
                  {loading || submitting ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="rgba(255,255,255,.3)"
                          strokeWidth="3"
                        />
                        <path
                          d="M12 2a10 10 0 0 1 10 10"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      {t("auth.creatingAccount")}
                    </>
                  ) : (
                    <>
                      {t("auth.createAccount")}
                      <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none">
                        <path
                          d="M4 10h12M10 4l6 6-6 6"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-slate-500 text-sm mt-6">
                {t("auth.alreadyHaveAccount")}{" "}
                <Link
                  to="/login"
                  state={{ from: location.state?.from }}
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                >
                  {t("auth.signIn")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
