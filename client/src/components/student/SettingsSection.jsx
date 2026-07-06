import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchProfile, updateProfile } from "../../redux/slices/settingsSlice";
import {
  fetchSubscription,
  cancelSubscription,
} from "../../redux/slices/billingSlice";
import { logoutUser } from "../../redux/slices/authSlice";
import api from "../../config/api";
import { uploadToImageKit } from "../../utils/imagekitUpload";
import { useTranslation } from "react-i18next";

// ── Indian states & cities ────────────────────────────────────────────────────
const indianCitiesByState = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Naharlagun"],
  Assam: ["Guwahati", "Dibrugarh", "Jorhat", "Silchar"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  Chhattisgarh: ["Raipur", "Bhilai", "Korba", "Durg"],
  Goa: ["Panaji", "Margao", "Vasco da Gama"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Manali"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangalore", "Hubli"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Manipur: ["Imphal", "Churachandpur"],
  Meghalaya: ["Shillong", "Tura"],
  Mizoram: ["Aizawl", "Lunglei"],
  Nagaland: ["Kohima", "Dimapur"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela"],
  Punjab: ["Chandigarh", "Amritsar", "Ludhiana", "Jalandhar"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  Sikkim: ["Gangtok", "Namchi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad"],
  Tripura: ["Agartala", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra"],
  Uttarakhand: ["Dehradun", "Haridwar", "Nainital"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
  "Jammu & Kashmir": ["Srinagar", "Jammu"],
  Ladakh: ["Leh", "Kargil"],
  Puducherry: ["Puducherry", "Karaikal"],
};
const ALL_STATES = Object.keys(indianCitiesByState).sort();

// ── Shared OTP Modal ──────────────────────────────────────────────────────────
function OtpModal({ title, subtitle, onVerify, onResend, onClose }) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [resending, setResending] = useState(false);
  const refs = React.useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...digits];
    updated[i] = val.slice(-1);
    setDigits(updated);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const updated = [...digits];
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setDigits(updated);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const submit = async () => {
    const code = digits.join("");
    if (code.length < 6) return;
    setVerifying(true);
    try {
      await onVerify(code);
    } catch {
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend?.();
      setCooldown(30);
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  const isBusy = verifying || resending;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d1526",
          border: "1px solid #1e3a5f",
          borderRadius: 20,
          padding: 32,
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <rect
                x="2"
                y="7"
                width="20"
                height="14"
                rx="2"
                stroke="#a78bfa"
                strokeWidth="1.5"
              />
              <path
                d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2Z"
                stroke="#a78bfa"
                strokeWidth="1.5"
              />
              <circle
                cx="12"
                cy="14"
                r="2"
                stroke="#a78bfa"
                strokeWidth="1.5"
              />
              <path
                d="M12 16v2"
                stroke="#a78bfa"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <h3
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "#f1f5f9",
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 12,
            color: "#64748b",
            textAlign: "center",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              style={{
                width: 44,
                height: 48,
                textAlign: "center",
                fontSize: 20,
                fontWeight: 700,
                color: "#f1f5f9",
                borderRadius: 10,
                outline: "none",
                transition: "all 0.15s",
                background: d
                  ? "rgba(124,58,237,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: d
                  ? "1px solid rgba(167,139,250,0.6)"
                  : "1px solid rgba(255,255,255,0.1)",
                boxShadow: d ? "0 0 0 3px rgba(124,58,237,0.1)" : "none",
              }}
            />
          ))}
        </div>

        <button
          onClick={submit}
          disabled={isBusy || digits.join("").length < 6}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "none",
            fontWeight: 700,
            fontSize: 14,
            cursor:
              isBusy || digits.join("").length < 6 ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
            color: "#fff",
            opacity: isBusy || digits.join("").length < 6 ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {verifying ? (
            <>
              <svg
                style={{ animation: "spin 0.8s linear infinite" }}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              {t("studentSettings.verifying")}
            </>
          ) : (
            t("studentSettings.verifyCode")
          )}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: 12,
            color: "#475569",
          }}
        >
          {cooldown > 0 ? (
            <>
              {t("studentSettings.resendIn")}{" "}
              <span style={{ color: "#a78bfa", fontWeight: 600 }}>
                {cooldown}s
              </span>
            </>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                background: "none",
                border: "none",
                color: "#a78bfa",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {resending
                ? t("studentSettings.sending")
                : t("studentSettings.resendOtp")}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            display: "block",
            margin: "12px auto 0",
            background: "none",
            border: "none",
            color: "#475569",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {t("studentSettings.cancel")}
        </button>
      </div>
    </div>
  );
}

const SectionCard = ({ title, children }) => (
  <div
    style={{
      background: "#111827",
      border: "1px solid #1e293b",
      borderRadius: 18,
      padding: "22px 24px",
      marginBottom: 16,
    }}
  >
    <h3
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: "#f1f5f9",
        marginBottom: 18,
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    style={{
      width: 44,
      height: 24,
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      background: checked ? "#7c3aed" : "#334155",
      position: "relative",
      transition: "background 0.2s",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 3,
        left: checked ? "calc(100% - 19px)" : 3,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s",
      }}
    />
  </button>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function Settings() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { profile: userProfile } = useSelector((state) => state.settings);
  const { user } = useSelector((state) => state.auth);
  const { subscription } = useSelector((state) => state.billing);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    city: "",
    state: "",
    avatarUrl: "",
    fatherName: "",
    motherName: "",
    fullAddress: "",
    socialMediaAccount: "",
    fatherMobileNumber: "",
    reference: "",
    vidhansabha: "",
  });
  const [notifications, setNotifications] = useState({
    liveClass: true,
    newCourse: true,
    community: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [references, setReferences] = useState([]);
  const [referencesLoading, setReferencesLoading] = useState(false);

  // ── Email change state ──
  const [emailForm, setEmailForm] = useState({ newEmail: "" });
  const [emailStep, setEmailStep] = useState("idle"); // idle | sending | otp
  const [emailMsg, setEmailMsg] = useState({ text: "", ok: false });
  const [showEmailOtp, setShowEmailOtp] = useState(false);

  // ── Phone change state ──
  const [phoneForm, setPhoneForm] = useState({ newPhone: "" });
  const [phoneStep, setPhoneStep] = useState("idle"); // idle | sending | otp
  const [phoneMsg, setPhoneMsg] = useState({ text: "", ok: false });
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);

  // ── Password state ──
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState({ text: "", ok: false });
  const [showPwOtp, setShowPwOtp] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchSubscription());
  }, [dispatch]);

  useEffect(() => {
    const loadReferences = async () => {
      setReferencesLoading(true);
      try {
        const { data } = await api.get("/references");
        setReferences(Array.isArray(data) ? data : []);
      } catch {
        setReferences([]);
      } finally {
        setReferencesLoading(false);
      }
    };

    loadReferences();
  }, []);

  useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || "",
        email: userProfile.email || "",
        phoneNumber: userProfile.phoneNumber || "",
        city: userProfile.city || "",
        state: userProfile.state || "",
        avatarUrl: userProfile.avatarUrl || "",
        fatherName: userProfile.fatherName || "",
        motherName: userProfile.motherName || "",
        fullAddress: userProfile.fullAddress || "",
        socialMediaAccount: userProfile.socialMediaAccount || "",
        fatherMobileNumber: userProfile.fatherMobileNumber || "",
        reference: userProfile.reference || "",
        vidhansabha: userProfile.vidhansabha || "",
      });
      if (userProfile.notificationSettings) {
        setNotifications({
          liveClass: userProfile.notificationSettings.liveClass ?? true,
          newCourse: userProfile.notificationSettings.newCourse ?? true,
          community: userProfile.notificationSettings.community ?? false,
        });
      }
    }
  }, [userProfile]);

  const cityOptions = indianCitiesByState[profile.state] || [];
  const hasCurrentReference =
    !!profile.reference &&
    !references.some((item) => item.name === profile.reference);

  // ── Profile save ──
  const saveProfile = async () => {
    try {
      await dispatch(
        updateProfile({ ...profile, notificationSettings: notifications }),
      ).unwrap();
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || "",
        email: userProfile.email || "",
        phoneNumber: userProfile.phoneNumber || "",
        city: userProfile.city || "",
        state: userProfile.state || "",
        avatarUrl: userProfile.avatarUrl || "",
        fatherName: userProfile.fatherName || "",
        motherName: userProfile.motherName || "",
        fullAddress: userProfile.fullAddress || "",
        socialMediaAccount: userProfile.socialMediaAccount || "",
        fatherMobileNumber: userProfile.fatherMobileNumber || "",
        reference: userProfile.reference || "",
        vidhansabha: userProfile.vidhansabha || "",
      });
    }
    setIsEditing(false);
  };

  // ── Avatar ──
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "user-avatars");
    setUploading(true);
    try {
      const data = await uploadToImageKit({
        file,
        folder: "user-avatars"
      });
      const newAvatarUrl = data.url;
      setProfile((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
      await dispatch(
        updateProfile({
          ...profile,
          avatarUrl: newAvatarUrl,
          notificationSettings: notifications,
        }),
      ).unwrap();
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setProfile((prev) => ({ ...prev, avatarUrl: "" }));
    try {
      await dispatch(
        updateProfile({
          ...profile,
          avatarUrl: "",
          notificationSettings: notifications,
        }),
      ).unwrap();
    } catch (err) {
      console.error("Failed to remove avatar:", err);
    }
  };

  // ── Email change ──
  const sendEmailOtp = async () => {
    if (!emailForm.newEmail) {
      setEmailMsg({
        text: t("studentSettings.enterNewEmailAddress"),
        ok: false,
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail)) {
      setEmailMsg({
        text: t("studentSettings.enterValidEmailAddress"),
        ok: false,
      });
      return;
    }
    if (emailForm.newEmail === profile.email) {
      setEmailMsg({
        text: t("studentSettings.sameCurrentEmail"),
        ok: false,
      });
      return;
    }
    setEmailStep("sending");
    try {
      await api.post("/settings/send-email-otp", {
        newEmail: emailForm.newEmail,
      });
      setEmailStep("otp");
      setShowEmailOtp(true);
      setEmailMsg({ text: "", ok: false });
    } catch (err) {
      setEmailMsg({
        text:
          err.response?.data?.message || t("studentSettings.failedToSendOtp"),
        ok: false,
      });

      setEmailStep("idle");
    }
  };

  const verifyEmailOtp = async (code) => {
    try {
      await api.post("/settings/verify-email-otp", {
        newEmail: emailForm.newEmail,
        otp: code,
      });
      await dispatch(
        updateProfile({
          ...profile,
          email: emailForm.newEmail,
          notificationSettings: notifications,
        }),
      ).unwrap();
      setProfile((prev) => ({ ...prev, email: emailForm.newEmail }));
      setEmailForm({ newEmail: "" });
      setEmailStep("idle");
      setShowEmailOtp(false);
      setEmailMsg({ text: t("studentSettings.emailUpdated"), ok: true });
      setTimeout(() => setEmailMsg({ text: "", ok: false }), 5000);
    } catch (err) {
      throw new Error(
        err.response?.data?.message || t("studentSettings.invalidOtp"),
      );
    }
  };

  // ── Phone change ──
  const normalizeIndianPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "");
    if (/^\d{10}$/.test(digits)) return `+91${digits}`;
    if (/^91\d{10}$/.test(digits)) return `+${digits}`;
    return null;
  };

  const sendPhoneOtp = async () => {
    const e164 = normalizeIndianPhoneNumber(phoneForm.newPhone);
    if (!e164) {
      setPhoneMsg({
        text: t("studentSettings.indianMobileOnly"),
        ok: false,
      });
      return;
    }
    if (e164 === profile.phoneNumber) {
      setPhoneMsg({
        text: t("studentSettings.sameCurrentNumber"),
        ok: false,
      });
      return;
    }
    setPhoneStep("sending");
    try {
      await api.post("/auth/send-phone-otp", { phoneNumber: e164 });
      setPhoneStep("otp");
      setShowPhoneOtp(true);
      setPhoneMsg({ text: "", ok: false });
    } catch (err) {
      setPhoneMsg({
        text:
          err.response?.data?.message || t("studentSettings.failedToSendOtp"),
        ok: false,
      });
      setPhoneStep("idle");
    }
  };

  const verifyPhoneOtp = async (code) => {
    const e164 = normalizeIndianPhoneNumber(phoneForm.newPhone);
    if (!e164) {
      throw new Error(t("studentSettings.indianMobileOnly"));
    }
    try {
      await api.post("/auth/verify-phone-otp", {
        phoneNumber: e164,
        otp: code,
      });
      await dispatch(
        updateProfile({
          ...profile,
          phoneNumber: e164,
          notificationSettings: notifications,
        }),
      ).unwrap();
      setProfile((prev) => ({ ...prev, phoneNumber: e164 }));
      setPhoneForm({ newPhone: "" });
      setPhoneStep("idle");
      setShowPhoneOtp(false);
      setPhoneMsg({ text: t("studentSettings.phoneUpdated"), ok: true });
      setTimeout(() => setPhoneMsg({ text: "", ok: false }), 5000);
    } catch (err) {
      throw new Error(
        err.response?.data?.message || t("studentSettings.invalidOtp"),
      );
    }
  };

  // ── Password change ──
  const sendPasswordOtp = async () => {
    if (!pwForm.current) {
      setPwMsg({ text: t("studentSettings.enterCurrentPassword"), ok: false });
      return;
    }
    if (pwForm.next.length < 6) {
      setPwMsg({
        text: t("studentSettings.passwordMin6"),
        ok: false,
      });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ text: t("studentSettings.passwordsDoNotMatch"), ok: false });
      return;
    }
    try {
      await api.post("/settings/send-password-otp");
      setShowPwOtp(true);
      setPwMsg({ text: "", ok: false });
    } catch (err) {
      setPwMsg({
        text:
          err.response?.data?.message || t("studentSettings.failedToSendOtp"),
        ok: false,
      });
    }
  };

  const verifyPasswordOtp = async (code) => {
    try {
      await api.post("/settings/verify-password-otp", { otp: code });
      await api.put("/settings/change-password", {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      setPwMsg({ text: t("studentSettings.passwordChanged"), ok: true });
      setPwForm({ current: "", next: "", confirm: "" });
      setShowPwOtp(false);
      setTimeout(() => setPwMsg({ text: "", ok: false }), 4000);
    } catch (err) {
      throw new Error(
        err.response?.data?.message || t("studentSettings.invalidOtp"),
      );
    }
  };

  // ── Notifications ──
  const toggleNotif = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      await dispatch(
        updateProfile({ ...profile, notificationSettings: updated }),
      ).unwrap();
    } catch (err) {
      console.error(t("studentSettings.failedToUpdateNotifications"), err);
    }
  };

  // ── Delete account ──
  const deleteAccount = async () => {
    if (window.confirm(t("studentSettings.deleteAccountWarning"))) {
      try {
        await api.delete(`/users/${user?._id ?? user?.id}`);
        await dispatch(logoutUser()).unwrap();
        window.location.href = "/";
      } catch (err) {
        alert(
          err.response?.data?.message ||
            t("studentSettings.failedToDeleteAccount"),
        );
      }
    }
  };

  // ── Styles ──
  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#f1f5f9",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };
  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
  };
  const labelStyle = {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 600,
    marginBottom: 5,
    display: "block",
  };
  const sendOtpBtnStyle = (disabled) => ({
    padding: "10px 18px",
    borderRadius: 10,
    border: "none",
    fontWeight: 700,
    fontSize: 13,
    whiteSpace: "nowrap",
    cursor: disabled ? "not-allowed" : "pointer",
    background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
    color: "#fff",
    opacity: disabled ? 0.6 : 1,
  });

  return (
    <>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      <div>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>
            {t("studentSettings.title")}
          </h2>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            {t("studentSettings.subtitle")}
          </p>
        </div>

        {/* ── Profile ── */}
        <SectionCard title={t("studentSettings.profile")}>
          {/* Avatar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <img
              src={
                profile.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "User")}&background=7c3aed&color=fff&size=128`
              }
              alt={profile.name}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #334155",
              }}
            />
            {isEditing && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label
                  style={{
                    padding: "6px 14px",
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    color: "#f1f5f9",
                    fontSize: 12,
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                >
                  {uploading
                    ? t("studentSettings.uploading")
                    : t("studentSettings.uploadPhoto")}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: "none" }}
                    disabled={uploading}
                  />
                </label>
                {profile.avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    style={{
                      padding: "6px 14px",
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {t("studentSettings.remove")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Name + Phone (read-only hint) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>{t("studentSettings.fullName")}</label>
              <input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                style={inputStyle}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label style={labelStyle}>
                {t("studentSettings.phoneNumber")}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  value={profile.phoneNumber}
                  readOnly
                  style={{
                    ...inputStyle,
                    paddingRight: 90,
                    color: "#94a3b8",
                    cursor: "default",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 10,
                    color: "#64748b",
                    background: "#0f172a",
                    padding: "2px 6px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("studentSettings.changeBelow")}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t("studentSettings.emailAddress")}</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
              style={inputStyle}
              disabled={!isEditing}
              placeholder={t("studentSettings.enterEmailPlaceholder")}
            />
          </div>

          {/* State + City */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div>
              <label style={labelStyle}>{t("studentSettings.state")}</label>
              <select
                value={profile.state}
                onChange={(e) =>
                  setProfile({ ...profile, state: e.target.value, city: "" })
                }
                disabled={!isEditing}
                style={{ ...selectStyle, opacity: !isEditing ? 0.6 : 1 }}
              >
                <option value="">{t("studentSettings.selectState")}</option>
                {ALL_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t("studentSettings.city")}</label>
              <select
                value={profile.city}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
                disabled={!isEditing || !profile.state}
                style={{
                  ...selectStyle,
                  opacity: !isEditing || !profile.state ? 0.5 : 1,
                  cursor:
                    !isEditing || !profile.state ? "not-allowed" : "pointer",
                }}
              >
                <option value="">
                  {profile.state
                    ? t("studentSettings.selectCity")
                    : t("studentSettings.chooseStateFirst")}
                </option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>
                {t("studentSettings.fatherName")}
              </label>
              <input
                value={profile.fatherName}
                onChange={(e) =>
                  setProfile({ ...profile, fatherName: e.target.value })
                }
                style={inputStyle}
                disabled={!isEditing}
                placeholder={t("studentSettings.fatherNamePlaceholder")}
              />
            </div>
            <div>
              <label style={labelStyle}>
                {t("studentSettings.motherName")}
              </label>
              <input
                value={profile.motherName}
                onChange={(e) =>
                  setProfile({ ...profile, motherName: e.target.value })
                }
                style={inputStyle}
                disabled={!isEditing}
                placeholder={t("studentSettings.motherNamePlaceholder")}
              />
            </div>
            <div>
              <label style={labelStyle}>
                {t("studentSettings.fatherMobile")}
              </label>
              <input
                value={profile.fatherMobileNumber}
                onChange={(e) =>
                  setProfile({ ...profile, fatherMobileNumber: e.target.value })
                }
                style={inputStyle}
                disabled={!isEditing}
                placeholder={t("studentSettings.fatherMobilePlaceholder")}
              />
            </div>
            <div>
              <label style={labelStyle}>
                {t("studentSettings.socialMedia")}
              </label>
              <input
                value={profile.socialMediaAccount}
                onChange={(e) =>
                  setProfile({ ...profile, socialMediaAccount: e.target.value })
                }
                style={inputStyle}
                disabled={!isEditing}
                placeholder={t("studentSettings.socialMediaPlaceholder")}
              />
            </div>
            <div>
              <label style={labelStyle}>{t("studentSettings.reference")}</label>
              <select
                value={profile.reference}
                onChange={(e) =>
                  setProfile({ ...profile, reference: e.target.value })
                }
                style={{
                  ...selectStyle,
                  opacity: !isEditing ? 0.6 : 1,
                  cursor: !isEditing ? "not-allowed" : "pointer",
                }}
                disabled={!isEditing}
              >
                <option value="">
                  {referencesLoading
                    ? t("studentSettings.loadingReferences")
                    : t("studentSettings.selectReference")}
                </option>
                {hasCurrentReference && (
                  <option value={profile.reference}>{profile.reference}</option>
                )}
                {references.map((item) => (
                  <option key={item._id ?? item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                {t("studentSettings.vidhansabha")}
              </label>
              <input
                value={profile.vidhansabha}
                onChange={(e) =>
                  setProfile({ ...profile, vidhansabha: e.target.value })
                }
                style={inputStyle}
                disabled={!isEditing}
                placeholder={t("studentSettings.vidhansabhaPlaceholder")}
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>{t("studentSettings.fullAddress")}</label>
            <textarea
              value={profile.fullAddress}
              onChange={(e) =>
                setProfile({ ...profile, fullAddress: e.target.value })
              }
              style={{ ...inputStyle, resize: "vertical", minHeight: 86 }}
              disabled={!isEditing}
              placeholder={t("studentSettings.fullAddressPlaceholder")}
            />
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: "9px 20px",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 10,
                color: "#f1f5f9",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("studentSettings.editProfile")}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={saveProfile}
                style={{
                  padding: "9px 20px",
                  background: saved
                    ? "#052e16"
                    : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  border: "none",
                  borderRadius: 10,
                  color: saved ? "#4ade80" : "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {saved
                  ? t("studentSettings.saved")
                  : t("studentSettings.saveChanges")}
              </button>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: "9px 20px",
                  background: "transparent",
                  border: "1px solid #334155",
                  borderRadius: 10,
                  color: "#94a3b8",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("studentSettings.cancel")}
              </button>
            </div>
          )}
        </SectionCard>


        {/* ── Change Phone ── */}
        <SectionCard title={t("studentSettings.changePhoneNumber")}>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
            {t("studentSettings.currentNumber")}:{" "}
            <span style={{ color: "#a78bfa", fontWeight: 600 }}>
              {profile.phoneNumber || "—"}
            </span>
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 10,
              alignItems: "flex-end",
              marginBottom: 10,
            }}
          >
            <div>
              <label style={labelStyle}>
                {t("studentSettings.newPhoneNumber")}
              </label>
              <input
                type="tel"
                value={phoneForm.newPhone}
                onChange={(e) => {
                  setPhoneForm({ newPhone: e.target.value });
                  if (phoneMsg.text) setPhoneMsg({ text: "", ok: false });
                }}
                placeholder={t("studentSettings.newPhonePlaceholder")}
                style={inputStyle}
                disabled={phoneStep === "sending"}
              />
            </div>
            <button
              onClick={sendPhoneOtp}
              disabled={phoneStep === "sending" || !phoneForm.newPhone}
              style={sendOtpBtnStyle(
                phoneStep === "sending" || !phoneForm.newPhone,
              )}
            >
              {phoneStep === "sending"
                ? t("studentSettings.sending")
                : t("studentSettings.sendOtp")}
            </button>
          </div>
          {phoneMsg.text && (
            <p
              style={{
                fontSize: 12,
                color: phoneMsg.ok ? "#4ade80" : "#f87171",
              }}
            >
              {phoneMsg.text}
            </p>
          )}
        </SectionCard>

        {/* ── Subscription ── */}
        <SectionCard title={t("studentSettings.subscriptionAndBilling")}>
          {subscription?.status === "active" ||
          subscription?.status === "cancelled" ? (
            <div
              style={{
                background:
                  "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.1))",
                border: "1px solid rgba(124,58,237,0.2)",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    color: "#fff",
                    marginBottom: 8,
                  }}
                >
                  {(() => {
                    const label = subscription.label || subscription.plan || "";
                    if (label.toLowerCase().endsWith("plan") || label.toLowerCase().endsWith("प्लान")) {
                      return label;
                    }
                    return t("studentSettings.planLabel", { plan: label });
                  })()}
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>
                  {t("studentSettings.status")}:{" "}
                  <span
                    style={{
                      color:
                        subscription.status === "cancelled"
                          ? "#fbbf24"
                          : "#10b981",
                    }}
                  >
                    {subscription.status === "cancelled"
                      ? t("studentSettings.cancelled")
                      : t("studentSettings.active")}
                  </span>
                </h4>
                <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>
                  {t("studentSettings.activeSince")}{" "}
                  {new Date(subscription.startDate).toLocaleDateString()}
                </p>
                <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                  {t("studentSettings.renewsOn")}{" "}
                  {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              </div>
              {subscription.status !== "cancelled" && (
                <button
                  onClick={async () => {
                    if (
                      window.confirm(
                        t("studentSettings.confirmCancelSubscription"),
                      )
                    ) {
                      try {
                        await dispatch(cancelSubscription()).unwrap();
                        alert(t("studentSettings.subscriptionCancelled"));
                        dispatch(fetchSubscription());
                      } catch (err) {
                        alert(
                          err || t("studentSettings.failedCancelSubscription"),
                        );
                      }
                    }
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#450a0a",
                    border: "1px solid #7f1d1d",
                    borderRadius: 10,
                    color: "#f87171",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {t("studentSettings.cancelSubscription")}
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                  {t("studentSettings.freeTier")}
                </h4>
                <p style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                  {t("studentSettings.freeTierDesc")}
                </p>
              </div>
              <Link
                to="/billing"
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                {t("studentSettings.upgradePlan")}
              </Link>
            </div>
          )}
        </SectionCard>

        {/* ── Change Password ── */}
        <SectionCard title={t("studentSettings.changePassword")}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>
                {t("studentSettings.currentPassword")}
              </label>
              <input
                type="password"
                value={pwForm.current}
                onChange={(e) =>
                  setPwForm({ ...pwForm, current: e.target.value })
                }
                style={inputStyle}
                placeholder="••••••"
              />
            </div>
            <div>
              <label style={labelStyle}>
                {t("studentSettings.newPassword")}
              </label>
              <input
                type="password"
                value={pwForm.next}
                onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                style={inputStyle}
                placeholder={t("studentSettings.min6Characters")}
              />
            </div>
            <div>
              <label style={labelStyle}>
                {t("studentSettings.confirmNewPassword")}
              </label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) =>
                  setPwForm({ ...pwForm, confirm: e.target.value })
                }
                style={inputStyle}
                placeholder={t("studentSettings.repeatPassword")}
              />
            </div>
          </div>
          {pwMsg.text && (
            <p
              style={{
                fontSize: 12,
                color: pwMsg.ok ? "#4ade80" : "#f87171",
                marginBottom: 10,
              }}
            >
              {pwMsg.text}
            </p>
          )}
          <button
            onClick={sendPasswordOtp}
            style={{
              padding: "9px 20px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 10,
              color: "#f1f5f9",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("studentSettings.updatePassword")}
          </button>
        </SectionCard>

        {/* ── Notifications ── */}
        <SectionCard title={t("studentSettings.notificationPreferences")}>
          {[
            {
              key: "liveClass",
              label: t("studentSettings.liveClassReminders"),
              desc: t("studentSettings.liveClassRemindersDesc"),
            },
            {
              key: "newCourse",
              label: t("studentSettings.newCourseAlerts"),
              desc: t("studentSettings.newCourseAlertsDesc"),
            },
            {
              key: "community",
              label: t("studentSettings.communityReplies"),
              desc: t("studentSettings.communityRepliesDesc"),
            },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  {item.desc}
                </div>
              </div>
              <Toggle
                checked={notifications[item.key]}
                onChange={() => toggleNotif(item.key)}
              />
            </div>
          ))}
        </SectionCard>

        {/* ── Danger Zone ── */}
        <SectionCard title={t("studentSettings.dangerZone")}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f87171" }}>
                {t("studentSettings.deleteAccount")}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {t("studentSettings.deleteAccountDesc")}
              </div>
            </div>
            <button
              onClick={deleteAccount}
              style={{
                padding: "8px 16px",
                background: "#450a0a",
                border: "1px solid #7f1d1d",
                borderRadius: 10,
                color: "#f87171",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("studentSettings.deleteAccountCta")}
            </button>
          </div>
        </SectionCard>
      </div>


      {/* ── Phone OTP Modal ── */}
      {showPhoneOtp && (
        <OtpModal
          title={t("studentSettings.verifyNewPhoneNumber")}
          subtitle={t("studentSettings.verifyNewPhoneSubtitle", {
            phone: phoneForm.newPhone,
          })}
          onVerify={verifyPhoneOtp}
          onResend={sendPhoneOtp}
          onClose={() => {
            setShowPhoneOtp(false);
            setPhoneStep("idle");
          }}
        />
      )}

      {/* ── Password OTP Modal ── */}
      {showPwOtp && (
        <OtpModal
          title={t("studentSettings.verifyPasswordChange")}
          subtitle={t("studentSettings.verifyPasswordChangeSubtitle", {
            email: profile.email,
          })}
          onVerify={verifyPasswordOtp}
          onResend={() => api.post("/settings/send-password-otp")}
          onClose={() => setShowPwOtp(false)}
        />
      )}
    </>
  );
}
