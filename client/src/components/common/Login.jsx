import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import {
  clearError,
  login,
  loginWithOtp,
  loadCurrentUser,
} from "../../redux/slices/authSlice";
import { useTranslation } from "react-i18next";
import axios from "axios";
import api from "../../config/api";
import {
  checkAndAwardAchievements,
  fetchAchievements,
} from "../../redux/slices/achievementSlice";
import {
  getCustomRole,
  hasCustomRole as checkHasCustomRole,
  hasBaseRole,
} from "../../utils/permissions";
import { isFirebaseConfigured } from "../../config/firebase";
import {
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

const getPostLoginPath = (user, from) => {
  const isAdmin = hasBaseRole(user, "admin");
  const isStaff = !isAdmin && checkHasCustomRole(user);
  const isInstructor = !isAdmin && !isStaff && hasBaseRole(user, "instructor");

  if (from) {
    let path = typeof from === "string" ? from : from.pathname;
    if (path && typeof path === "string") {
      const lowerPath = path.toLowerCase();
      if (
        user?.subscription?.status === "active" &&
        (lowerPath.includes("billing") || lowerPath.includes("plans"))
      ) {
        return "/student-dashboard";
      }
      return path;
    }
  }

  if (isAdmin) return "/admin-dashboard";
  if (isStaff) return "/staff-dashboard";
  if (isInstructor) return "/instructor-dashboard";
  return "/student-dashboard";
};

// ── Password Reset Modal ──────────────────────────────────────────────────────
// step: 'phone' | 'otp' | 'password' | 'done'
const PasswordResetModal = ({ onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [firebaseConfirmationResult, setFirebaseConfirmationResult] =
    useState(null);
  const otpRefs = useRef([]);

  useEffect(() => {
    return () => {
      clearRecaptcha("recaptcha-container-reset");
    };
  }, []);

  const countryCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+61", country: "Australia" },
    { code: "+971", country: "UAE" },
    { code: "+65", country: "Singapore" },
    { code: "+81", country: "Japan" },
    { code: "+49", country: "Germany" },
  ];

  useEffect(() => {
    if (cooldown <= 0) return;
    const tm = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(tm);
  }, [cooldown]);

  const fullPhone = `${countryCode}${phoneNumber}`;
  const displayPhone = `${countryCode} ${phoneNumber}`;

  const handleSendOtp = async () => {
    if (loading) return;
    if (!/^[0-9]{10}$/.test(phoneNumber))
      return toast.error(t("passwordReset.toast.invalidPhone"), {
        id: "invalid-phone",
      });
    setLoading(true);
    const fullPhone = "+91" + phoneNumber;
    try {
      await axios.post("/auth/forgot-password-phone", {
        phoneNumber: fullPhone,
      });

      if (isFirebaseConfigured()) {
        try {
          const confirmation = await sendFirebasePhoneOtp(
            fullPhone,
            "recaptcha-container-reset",
          );
          setFirebaseConfirmationResult(confirmation);
        } catch (fbErr) {
          console.warn(
            "Firebase Reset Phone OTP warning, using dev OTP fallback:",
            fbErr.code,
            fbErr.message,
          );
        }
      }

      toast.success(
        t("passwordReset.toast.otpSentPhone") ||
          "OTP sent to your phone number!",
        { id: "otp-sent" },
      );
      setStep("otp");
      setCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          t("passwordReset.toast.failedSendOtp"),
        { id: "otp-error" },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading || cooldown > 0) return;
    setLoading(true);
    try {
      await axios.post("/auth/forgot-password-phone", {
        phoneNumber: fullPhone,
      });

      if (isFirebaseConfigured()) {
        try {
          const confirmation = await sendFirebasePhoneOtp(
            fullPhone,
            "recaptcha-container-reset",
          );
          setFirebaseConfirmationResult(confirmation);
        } catch (fbErr) {
          console.warn("Firebase Resend error:", fbErr.message);
        }
      }

      toast.success(t("passwordReset.toast.otpResent"), { id: "otp-resent" });
      setCooldown(60);
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("passwordReset.toast.failedResend"),
        { id: "otp-resend-error" },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (loading) return;
    const otpStr = otp.join("");
    if (otpStr.length < 6)
      return toast.error(t("passwordReset.toast.enterFullOtp"), {
        id: "enter-full-otp",
      });
    setLoading(true);
    try {
      let firebaseToken = null;
      const confirmationSession =
        firebaseConfirmationResult || window.confirmationResult;

      if (isFirebaseConfigured()) {
        if (!confirmationSession) {
          toast.error(
            t("passwordReset.toast.sessionExpired") ||
              "OTP session expired or missing. Please click 'Resend OTP' to receive a new code.",
            { id: "reset-session-expired" },
          );
          setLoading(false);
          return;
        }

        try {
          const res = await verifyFirebasePhoneOtp(confirmationSession, otpStr);
          firebaseToken = res.idToken;
        } catch (fbVerifyErr) {
          console.error("Firebase verify token failed:", fbVerifyErr);
          const userMsg =
            fbVerifyErr.code === "auth/invalid-verification-code"
              ? t("passwordReset.toast.invalidOtp") ||
                "Invalid OTP code entered."
              : fbVerifyErr.code === "auth/code-expired"
                ? "The OTP code has expired. Please resend a new OTP."
                : fbVerifyErr.message || t("passwordReset.toast.invalidOtp");
          toast.error(userMsg, { id: "otp-verify-error" });
          setLoading(false);
          return;
        }
      }

      const { data } = await axios.post("/auth/verify-reset-phone-otp", {
        phoneNumber: fullPhone,
        otp: otpStr,
        firebaseToken,
      });
      setResetToken(data.resetToken);
      toast.success(t("passwordReset.toast.otpVerified"), {
        id: "otp-verified",
      });
      setStep("password");
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("passwordReset.toast.invalidOtp"),
        { id: "otp-verify-error" },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (loading) return;
    if (newPassword.length < 6)
      return toast.error(t("passwordReset.toast.passwordMin6"), {
        id: "pass-min-6",
      });
    if (newPassword !== confirmPassword)
      return toast.error(t("passwordReset.toast.passwordsDoNotMatch"), {
        id: "pass-mismatch",
      });
    setLoading(true);
    try {
      await axios.post("/auth/reset-password", {
        phoneNumber: fullPhone,
        resetToken,
        newPassword,
      });
      setStep("done");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          t("passwordReset.toast.failedResetPassword"),
        { id: "reset-error" },
      );
    } finally {
      setLoading(false);
    }
  };

  const strengthScore = (pwd) => {
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 10) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };
  const strengthLabel = [
    "",
    t("passwordReset.strength.veryWeak"),
    t("passwordReset.strength.weak"),
    t("passwordReset.strength.fair"),
    t("passwordReset.strength.strong"),
    t("passwordReset.strength.veryStrong"),
  ];
  const strengthColor = [
    "",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#10b981",
  ];
  const s = strengthScore(newPassword);

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: "12px 18px",
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
      style={{
        background: "rgba(2,8,23,0.75)",
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background:
            "linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02))",
          border: "1px solid rgba(99,179,237,.15)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow:
            "0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(56,189,248,.05)",
        }}
      >
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg,#38bdf8,#6366f1)",
          }}
        />

        <div style={{ padding: "32px 32px 28px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: "#38bdf8",
                }}
              >
                {step === "phone" && t("passwordReset.step1of3")}
                {step === "otp" && t("passwordReset.step2of3")}
                {step === "password" && t("passwordReset.step3of3")}
                {step === "done" && t("passwordReset.complete")}
              </p>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#f1f5f9",
                  fontFamily: "Outfit,sans-serif",
                }}
              >
                {step === "phone" && t("passwordReset.titlePhone")}
                {step === "otp" && t("passwordReset.titleOtp")}
                {step === "password" && t("passwordReset.titlePassword")}
                {step === "done" && t("passwordReset.titleDone")}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: 22,
                cursor: "pointer",
                lineHeight: 1,
                padding: 0,
                marginTop: 2,
              }}
            >
              ×
            </button>
          </div>

          {/* ── Step 1: Phone ── */}
          {step === "phone" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#94a3b8",
                  lineHeight: 1.6,
                }}
              >
                {t("passwordReset.phoneStepDesc")}
              </p>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#cbd5e1",
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("passwordReset.phoneNumberLabel")}
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div
                    style={{
                      ...inputStyle,
                      width: 70,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#1e293b",
                      color: "#ffffff",
                      fontWeight: 700,
                      userSelect: "none",
                    }}
                  >
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendOtp();
                      }
                    }}
                    placeholder={t("passwordReset.mobilePlaceholder")}
                    maxLength={10}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      minWidth: 0,
                      paddingLeft: 14,
                      paddingRight: 14,
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "rgba(56,189,248,0.6)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                    }
                    autoFocus
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.65 : 1,
                  boxShadow: "0 4px 20px rgba(14,165,233,.3)",
                  transition: "opacity 0.2s",
                }}
              >
                {loading
                  ? t("passwordReset.sending")
                  : t("passwordReset.sendOtp")}
              </button>
            </div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#94a3b8",
                  lineHeight: 1.6,
                }}
              >
                {t("passwordReset.otpStepDesc", {
                  phone: displayPhone,
                })}
              </p>

              <div
                style={{ display: "flex", gap: 8, justifyContent: "center" }}
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      width: 46,
                      height: 54,
                      textAlign: "center",
                      fontSize: 22,
                      fontWeight: 800,
                      background: "rgba(14,165,233,0.07)",
                      border: `2px solid ${digit ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 12,
                      color: "#38bdf8",
                      outline: "none",
                      transition: "border-color 0.15s",
                      fontFamily: "monospace",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "rgba(56,189,248,0.7)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = digit
                        ? "rgba(56,189,248,0.5)"
                        : "rgba(255,255,255,0.1)")
                    }
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length < 6}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor:
                    loading || otp.join("").length < 6
                      ? "not-allowed"
                      : "pointer",
                  opacity: loading || otp.join("").length < 6 ? 0.55 : 1,
                  boxShadow: "0 4px 20px rgba(14,165,233,.3)",
                  transition: "opacity 0.2s",
                }}
              >
                {loading
                  ? t("passwordReset.verifying")
                  : t("passwordReset.verifyOtp")}
              </button>

              <p
                style={{
                  margin: 0,
                  textAlign: "center",
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                {t("passwordReset.didntReceive")}{" "}
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: cooldown > 0 ? "#475569" : "#38bdf8",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: cooldown > 0 ? "default" : "pointer",
                    transition: "color 0.15s",
                  }}
                >
                  {cooldown > 0
                    ? t("passwordReset.resendIn", { sec: cooldown })
                    : t("passwordReset.resendOtp")}
                </button>
              </p>

              <button
                onClick={() => {
                  setStep("phone");
                  setOtp(["", "", "", "", "", ""]);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#475569",
                  fontSize: 12,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                {t("passwordReset.changePhoneNumber")}
              </button>
            </div>
          )}

          {/* ── Step 3: New Password ── */}
          {step === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#94a3b8",
                  lineHeight: 1.6,
                }}
              >
                {t("passwordReset.passwordStepDesc", {
                  phone: displayPhone,
                })}
              </p>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#cbd5e1",
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("passwordReset.newPasswordLabel")}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("passwordReset.newPasswordPlaceholder")}
                    style={{ ...inputStyle, paddingRight: 46 }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "rgba(56,189,248,0.6)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                    }
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showNew ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
                {newPassword && (
                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 4,
                        background: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${(s / 5) * 100}%`,
                          borderRadius: 4,
                          background: strengthColor[s],
                          transition: "width 0.3s, background 0.3s",
                        }}
                      />
                    </div>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 11,
                        color: strengthColor[s],
                        fontWeight: 600,
                      }}
                    >
                      {strengthLabel[s]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#cbd5e1",
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("passwordReset.confirmPasswordLabel")}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleResetPassword()
                    }
                    placeholder={t("passwordReset.confirmPasswordPlaceholder")}
                    style={{
                      ...inputStyle,
                      paddingRight: 46,
                      borderColor: confirmPassword
                        ? confirmPassword === newPassword
                          ? "rgba(34,197,94,0.5)"
                          : "rgba(239,68,68,0.5)"
                        : "rgba(255,255,255,0.1)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "rgba(56,189,248,0.6)")
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showConfirm ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 11,
                      color: "#ef4444",
                      fontWeight: 600,
                    }}
                  >
                    {t("passwordReset.passwordsDontMatch")}
                  </p>
                )}
              </div>

              <button
                onClick={handleResetPassword}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 14,
                  border: "none",
                  marginTop: 4,
                  background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.65 : 1,
                  boxShadow: "0 4px 20px rgba(14,165,233,.3)",
                  transition: "opacity 0.2s",
                }}
              >
                {loading
                  ? t("passwordReset.resetting")
                  : t("passwordReset.resetPassword")}
              </button>
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === "done" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(16,185,129,0.15)",
                  border: "2px solid rgba(16,185,129,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#10b981"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M7 12.5l3.5 3.5 6.5-7"
                    stroke="#10b981"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#f1f5f9",
                  }}
                >
                  {t("passwordReset.doneTitle")}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#94a3b8",
                    lineHeight: 1.6,
                  }}
                >
                  {t("passwordReset.doneDesc")}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(14,165,233,.3)",
                }}
              >
                {t("passwordReset.backToLogin")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

/* ── Login ── */
const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { t } = useTranslation();

  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostLoginPath(user, location.state?.from), { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state?.from]);

  const [countryCode] = useState("+91");
  const [formData, setFormData] = useState({ phoneNumber: "", password: "" });
  const [loginMode, setLoginMode] = useState("password"); // "password" | "otp"
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [firebaseConfirmationResult, setFirebaseConfirmationResult] =
    useState(null);
  const [otpFallbackMode, setOtpFallbackMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    return () => {
      clearRecaptcha("recaptcha-container");
    };
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendLoginOtp = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      toast.error(
        t("auth.invalidPhone") || "Please enter a valid 10-digit phone number.",
      );
      return;
    }
    clearRecaptcha("recaptcha-container");
    setFirebaseConfirmationResult(null);
    setOtpFallbackMode(false);
    setSendingOtp(true);

    const fullPhone = `${countryCode}${formData.phoneNumber}`;
    try {
      await api.post("/users/send-login-otp", {
        phoneNumber: fullPhone,
      });

      let usedFallback = false;
      if (isFirebaseConfigured()) {
        try {
          const confirmation = await sendFirebasePhoneOtp(
            fullPhone,
            "recaptcha-container",
          );
          setFirebaseConfirmationResult(confirmation);
        } catch (fbErr) {
          if (import.meta.env.PROD) {
            console.error("Firebase Phone Auth failed:", fbErr);
            throw fbErr;
          }
          usedFallback = true;
          setOtpFallbackMode(true);
          setFirebaseConfirmationResult(null);
          console.warn(
            "Firebase sendPhoneOtp warning, using dev OTP fallback:",
            fbErr?.code,
            fbErr?.message,
          );
        }
      } else {
        usedFallback = true;
        setOtpFallbackMode(true);
      }

      toast.success(
        usedFallback
          ? t("auth.otpSentPhone") ||
              "OTP ready. Use 123456 if SMS delivery is delayed."
          : t("auth.otpSentPhone") || "OTP sent to your phone number!",
      );
      setOtpSent(true);
      setOtpCooldown(30);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to send OTP.";
      toast.error(message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      toast.error(t("auth.invalidPhone"));
      return;
    }

    if (loginMode === "otp") {
      if (!otpCode || otpCode.trim().length < 6) {
        toast.error("Please enter the full 6-digit OTP.");
        return;
      }
      setLoading(true);
      try {
        let firebaseToken = null;
        const confirmationSession =
          firebaseConfirmationResult || window.confirmationResult;

        if (isFirebaseConfigured() && !otpFallbackMode) {
          if (!confirmationSession) {
            toast.error(
              "OTP session expired or missing. Please click 'Resend OTP' to receive a new code.",
            );
            setLoading(false);
            return;
          }

          try {
            const res = await verifyFirebasePhoneOtp(
              confirmationSession,
              otpCode.trim(),
            );
            firebaseToken = res.idToken;
          } catch (fbVerifyErr) {
            console.error("Firebase token verification failed:", fbVerifyErr);
            const userMsg =
              fbVerifyErr.code === "auth/invalid-verification-code"
                ? "Invalid OTP code entered. Please double-check the code sent to your phone."
                : fbVerifyErr.code === "auth/code-expired"
                  ? "The OTP code has expired. Please click 'Resend OTP' for a new code."
                  : fbVerifyErr.message ||
                    "Failed to verify OTP code with Firebase.";
            toast.error(userMsg);
            setLoading(false);
            return;
          }
        }

        const loggedUser = await dispatch(
          loginWithOtp({
            phoneNumber: `${countryCode}${formData.phoneNumber}`,
            otp: otpCode.trim(),
            firebaseToken,
          }),
        ).unwrap();

        const refreshed = await dispatch(loadCurrentUser())
          .unwrap()
          .catch(() => loggedUser);
        const user = refreshed || loggedUser;

        navigate(getPostLoginPath(user, location.state?.from), {
          replace: true,
        });
        toast(t("auth.welcomeToast"), { icon: "👋", duration: 3000 });

        const now = new Date();
        const hour = now.getHours();
        dispatch(
          checkAndAwardAchievements({
            firstLogin: true,
            earlyBird: hour < 7,
            nightStudy: hour >= 22,
          }),
        ).then(() => dispatch(fetchAchievements()));
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          (typeof error === "string" ? error : t("auth.loginFailed"));
        toast.error(message);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await dispatch(
        login({
          phoneNumber: `${countryCode}${formData.phoneNumber}`,
          password: formData.password,
        }),
      ).unwrap();

      const refreshed = await dispatch(loadCurrentUser())
        .unwrap()
        .catch(() => loggedUser);
      const user = refreshed || loggedUser;

      navigate(getPostLoginPath(user, location.state?.from), { replace: true });

      toast(t("auth.welcomeToast"), { icon: "👋", duration: 3000 });

      const now = new Date();
      const hour = now.getHours();
      const isEarlyBird = hour < 7;
      const isNightOwl = hour >= 22;

      dispatch(
        checkAndAwardAchievements({
          firstLogin: true,
          earlyBird: isEarlyBird,
          nightStudy: isNightOwl,
        }),
      ).then(() => dispatch(fetchAchievements()));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (typeof error === "string" ? error : t("auth.loginFailed"));
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (name) =>
    `w-full bg-[#1e293b] border rounded-2xl px-5 py-3.5 text-white text-sm outline-none transition-all duration-300 placeholder-slate-500 ${
      focused === name
        ? "border-cyan-400/70 shadow-[0_0_0_3px_rgba(34,211,238,0.1)]"
        : "border-white/10 hover:border-white/20"
    }`;

  return (
    <div
      className="min-h-screen bg-[#0B1120] flex flex-col overflow-x-hidden relative login-page-wrapper"
      style={{ pointerEvents: "none" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=DM+Sans:wght@400;500&display=swap');
        .df { font-family:'Outfit',sans-serif; }
        .login-page-wrapper, .login-page-wrapper * { font-family:'DM Sans',sans-serif; }
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
      <div className="relative z-10 flex flex-1 items-center justify-center px-3 sm:px-6 py-4 sm:py-10 pb-28 sm:pb-12">
        <div
          className="w-full max-w-5xl flex items-center gap-14"
          style={{ pointerEvents: "auto" }}
        >
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
              className="card-glow rounded-3xl p-4 xs:p-6 sm:p-9 w-full"
              style={{
                pointerEvents: "auto",
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

              <div className="text-center mb-8">
                <h2 className="df text-3xl font-black text-white">
                  {t("auth.welcomeBack")}
                </h2>
                <p className="text-slate-400 mt-1.5 text-sm">
                  {t("auth.continueJourney")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">
                    {t("auth.phoneNumber")}
                  </label>
                  <div className="flex gap-2">
                    <div
                      className="w-16 sm:w-20 shrink-0 rounded-2xl px-2.5 sm:px-3 py-3.5 bg-[#1e293b] text-white text-sm font-bold flex items-center justify-center border border-white/10"
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
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10),
                        })
                      }
                      onFocus={() => setFocused("phoneNumber")}
                      onBlur={() => setFocused("")}
                      placeholder={t("auth.mobilePlaceholder")}
                      required
                      maxLength={10}
                      className={
                        inputCls("phoneNumber") +
                        " flex-1 min-w-0 px-3.5 sm:px-5"
                      }
                    />
                  </div>
                </div>

                {/* Login With (OTP | Password) */}
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <label className="text-xs font-semibold text-slate-300 tracking-widest uppercase shrink-0">
                      {t("auth.loginWith") || "LOGIN WITH"}
                    </label>
                    <div className="flex items-center bg-[#1e293b] border border-white/10 rounded-xl p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMode("otp");
                          setFocused("");
                        }}
                        className={`px-3 py-1 rounded-lg font-bold transition-all duration-200 cursor-pointer ${
                          loginMode === "otp"
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {t("auth.otp") || "OTP"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMode("password");
                          setFocused("");
                        }}
                        className={`px-3 py-1 rounded-lg font-bold transition-all duration-200 cursor-pointer ${
                          loginMode === "password"
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {t("auth.password") || "Password"}
                      </button>
                    </div>
                  </div>

                  {loginMode === "password" ? (
                    <>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onFocus={() => setFocused("password")}
                          onBlur={() => setFocused("")}
                          placeholder={t("auth.passwordPlaceholder")}
                          required={loginMode === "password"}
                          className={inputCls("password") + " pr-12"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          {showPassword ? (
                            <FiEyeOff size={18} />
                          ) : (
                            <FiEye size={18} />
                          )}
                        </button>
                      </div>

                      {/* Forgot password */}
                      <div className="flex justify-end mt-2 h-5 items-center">
                        <button
                          type="button"
                          onClick={() => setShowReset(true)}
                          className="text-xs cursor-pointer text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                        >
                          {t("auth.forgotPassword")}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          name="otpCode"
                          value={otpCode}
                          onChange={(e) =>
                            setOtpCode(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                          onFocus={() => setFocused("otp")}
                          onBlur={() => setFocused("")}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          required={loginMode === "otp"}
                          className={
                            inputCls("otp") +
                            " pr-32 font-mono tracking-widest text-base"
                          }
                        />
                        <button
                          type="button"
                          onClick={handleSendLoginOtp}
                          disabled={sendingOtp || otpCooldown > 0}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {sendingOtp
                            ? "Sending..."
                            : otpCooldown > 0
                              ? `${otpCooldown}s`
                              : otpSent
                                ? "Resend OTP"
                                : "Send OTP"}
                        </button>
                      </div>
                      <div className="mt-2 h-5 flex items-center justify-start">
                        {otpSent ? (
                          <p className="text-[11px] text-cyan-400/90 font-medium flex items-center gap-1">
                            <span>✓</span> OTP sent to {countryCode}{" "}
                            {formData.phoneNumber}
                          </p>
                        ) : (
                          <span className="text-[11px] text-slate-500/80 font-medium">
                            Click "Send OTP" to receive a 6-digit code
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-grad w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 mt-1 disabled:opacity-60"
                >
                  {loading ? (
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
                      {t("auth.signingIn")}
                    </>
                  ) : (
                    <>
                      {t("auth.login")}
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

              {/* Invisible reCAPTCHA Containers for Firebase Phone Auth */}
              <div id="recaptcha-container" />
              <div id="recaptcha-container-reset" />

              <p className="text-center text-slate-500 text-sm mt-6">
                {t("auth.newHere")}{" "}
                <Link
                  to="/signup"
                  state={{ from: location.state?.from }}
                  onClick={() => dispatch(clearError())}
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                >
                  {t("auth.createAccount")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Password Reset Modal ── */}
      {showReset && <PasswordResetModal onClose={() => setShowReset(false)} />}
    </div>
  );
};

export default Login;
