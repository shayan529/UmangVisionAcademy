import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchMyApplication,
  submitApplication,
} from "../../redux/slices/applicationsSlice";
import { register } from "../../redux/slices/authSlice";
import { hasBaseRole } from "../../utils/permissions";
import { isFirebaseConfigured } from "../../config/firebase";
import {
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
  clearRecaptcha,
} from "../../services/firebasePhoneAuth";
import api from "../../config/api";
import { FiEye, FiEyeOff } from "react-icons/fi";
import {
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Briefcase,
  Building,
  Clock,
  BookOpen,
  FileText,
  Calendar,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";

const TARGET_GROUPS = [
  "Classes 9–10",
  "Classes 11–12",
  "College / University Students",
  "Competitive Exam Aspirants",
  "Job / Career Aspirants",
  "Other",
];

const SESSION_DURATIONS = ["45 Minutes", "60 Minutes", "90 Minutes", "Other"];

const SESSION_FORMATS = [
  "Live Online Session",
  "Webinar",
  "Interactive Q&A",
  "Expert Talk",
];

export default function BecomeInstructorApplication() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading: appLoading, myApplication } = useSelector(
    (state) => state.applications,
  );
  const { isAuthenticated, user, loading: authLoading } = useSelector(
    (state) => state.auth,
  );
  const isStudent = hasBaseRole(user, "student");

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Phone OTP Verification States (For unauthenticated users)
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const [phoneOtpInputs, setPhoneOtpInputs] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [firebaseConfirmationResult, setFirebaseConfirmationResult] =
    useState(null);
  const phoneOtpRefs = useRef([]);

  // Account creation state (for unauthenticated users)
  const [accountData, setAccountData] = useState({
    password: "",
    phoneNumber: "",
    email: "",
  });

  // Expert Registration Form (19 Fields)
  const [formData, setFormData] = useState({
    // 1. Personal & Professional Details
    name: user?.name || "",
    designation: "",
    organization: "",
    highestQualification: "",
    expertise: "",
    yearsOfExperience: "",
    professionalField: "",
    bio: "", // Short Self-Introduction
    linkedinProfile: "",

    // 2. Proposed Guidance Session Details
    guidanceTopic: "",
    sessionDescription: "",
    targetGroup: "Classes 9–10",
    learningOutcome: "",
    preferredDuration: "45 Minutes",
    preferredFormat: "Live Online Session",
    phoneNumber: user?.phone || "",
    email: user?.email || "",
    availabilityDays: "",
    additionalInfo: "",

    // 3. Confirmation
    confirmedContribution: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyApplication());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (myApplication) {
      navigate("/instructor-application/status");
    }
  }, [myApplication, navigate]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phoneNumber: prev.phoneNumber || user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (phoneResendCooldown <= 0) return;
    const timer = setTimeout(() => setPhoneResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phoneResendCooldown]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const normalizeIndianPhoneNumber = (phoneNumber) => {
    const digits = (phoneNumber || "").replace(/\D/g, "");
    if (/^\d{10}$/.test(digits)) return `+91${digits}`;
    if (/^91\d{10}$/.test(digits)) return `+${digits}`;
    return null;
  };

  const handleSendPhoneOtp = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const phoneToVerify = formData.phoneNumber || accountData.phoneNumber;
    const normalized = normalizeIndianPhoneNumber(phoneToVerify);

    if (!normalized) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    clearRecaptcha("recaptcha-container");
    setFirebaseConfirmationResult(null);
    setSendingPhoneOtp(true);

    try {
      await api.post("/auth/send-phone-otp", { phoneNumber: normalized });
      if (isFirebaseConfigured()) {
        try {
          const confirmation = await sendFirebasePhoneOtp(normalized);
          setFirebaseConfirmationResult(confirmation);
        } catch (fbErr) {
          console.error("Firebase Phone Auth Error:", fbErr);
        }
      }
      toast.success(`OTP sent to ${normalized}!`);
      setPhoneOtpSent(true);
      setPhoneResendCooldown(30);
      setTimeout(() => phoneOtpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to send OTP",
      );
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

  const handleVerifyPhoneOtp = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const code = phoneOtpInputs.join("");
    const phoneToVerify = formData.phoneNumber || accountData.phoneNumber;
    const normalized = normalizeIndianPhoneNumber(phoneToVerify);

    if (code.length < 6) {
      toast.error("Please enter complete 6-digit OTP");
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
          phoneNumber: normalized,
        });
      } else {
        await api.post("/auth/verify-phone-otp", {
          phoneNumber: normalized,
          otp: code,
        });
      }
      setPhoneVerified(true);
      setPhoneOtpSent(false);
      toast.success("Phone verified ✓");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Invalid OTP code",
      );
      setPhoneOtpInputs(["", "", "", "", "", ""]);
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) return toast.error("Full Name is required.");
    if (!formData.designation.trim())
      return toast.error("Designation / Professional Role is required.");
    if (!formData.highestQualification.trim())
      return toast.error("Highest Qualification is required.");
    if (!formData.expertise.trim())
      return toast.error("Area of Expertise is required.");
    if (!formData.yearsOfExperience.trim())
      return toast.error("Years of Experience is required.");
    if (!formData.bio.trim())
      return toast.error("Short Self-Introduction is required.");
    if (!formData.guidanceTopic.trim())
      return toast.error("Topic You Would Like to Guide Students On is required.");
    if (!formData.sessionDescription.trim())
      return toast.error("Brief Description of Your Proposed Session is required.");
    if (!formData.learningOutcome.trim())
      return toast.error("Expected Learning Outcome is required.");
    if (!formData.phoneNumber.trim())
      return toast.error("Mobile / WhatsApp Number is required.");
    if (!formData.email.trim())
      return toast.error("Email Address is required.");
    if (!formData.confirmedContribution) {
      return toast.error(
        "Please confirm your willingness to contribute a FREE student guidance session.",
      );
    }

    if (isStudent) {
      toast.error(
        "Students cannot register as an expert guide. Please log out and register with an expert/instructor account.",
      );
      return;
    }

    setSubmitting(true);

    try {
      // 1. If not authenticated, register account first
      if (!isAuthenticated) {
        if (!phoneVerified) {
          toast.error("Please verify your phone number via OTP first.");
          setSubmitting(false);
          return;
        }
        if (!accountData.password || accountData.password.length < 6) {
          toast.error("Please choose a password with at least 6 characters.");
          setSubmitting(false);
          return;
        }

        await dispatch(
          register({
            name: formData.name,
            email: formData.email,
            password: accountData.password,
            phoneNumber: normalizeIndianPhoneNumber(formData.phoneNumber),
            role: "instructor",
          }),
        ).unwrap();
      }

      // 2. Submit application details
      await dispatch(
        submitApplication({
          name: formData.name,
          designation: formData.designation,
          organization: formData.organization,
          highestQualification: formData.highestQualification,
          expertise: formData.expertise,
          yearsOfExperience: formData.yearsOfExperience,
          professionalField: formData.professionalField,
          bio: formData.bio,
          linkedinProfile: formData.linkedinProfile,
          guidanceTopic: formData.guidanceTopic,
          sessionDescription: formData.sessionDescription,
          targetGroup: formData.targetGroup,
          learningOutcome: formData.learningOutcome,
          preferredDuration: formData.preferredDuration,
          preferredFormat: formData.preferredFormat,
          availabilityDays: formData.availabilityDays,
          additionalInfo: formData.additionalInfo,
          confirmedContribution: formData.confirmedContribution,
        }),
      ).unwrap();

      toast.success("Expert Profile submitted successfully!");
      navigate("/instructor-application/status");
    } catch (err) {
      toast.error(
        err?.message ||
          err?.response?.data?.message ||
          "Failed to submit application",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div id="recaptcha-container" />
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-wider">
            <Sparkles size={14} className="text-amber-400" />
            <span>Free Student Guidance Initiative</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            REGISTER AS AN EXPERT GUIDE
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Interested in guiding students? Register with us and share your area
            of expertise.
          </p>
        </div>

        {/* Main Registration Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-[#111827] border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-8"
        >
          {/* ── SECTION 1: PERSONAL & PROFESSIONAL DETAILS ── */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <User size={20} className="text-indigo-400" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                1. Personal & Professional Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* 2. Designation / Professional Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Designation / Professional Role <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g. Senior Faculty / Career Mentor / Software Architect"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* 3. Organization / Institution */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Organization / Institution
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="e.g. Delhi University / Tech Mahindra / Independent"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 4. Highest Qualification */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Highest Qualification <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="highestQualification"
                  value={formData.highestQualification}
                  onChange={handleChange}
                  placeholder="e.g. Ph.D / M.Tech / MBA / M.Sc / B.Ed"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* 5. Area of Expertise */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Area of Expertise <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleChange}
                  placeholder="e.g. Physics & Mathematics, UPSC Prep, AI & Data Science"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* 6. Years of Experience */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Years of Experience <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  placeholder="e.g. 8+ Years"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* 7. Current Professional Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Current Professional Field
                </label>
                <input
                  type="text"
                  name="professionalField"
                  value={formData.professionalField}
                  onChange={handleChange}
                  placeholder="e.g. Higher Education, Corporate Leadership, Medical, Civil Services"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 9. Professional Profile / LinkedIn Profile (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Professional Profile / LinkedIn Profile (Optional)
                </label>
                <input
                  type="url"
                  name="linkedinProfile"
                  value={formData.linkedinProfile}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 8. Short Self-Introduction */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Short Self-Introduction <span className="text-rose-400">*</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Briefly tell us about your professional background, expertise, and
                experience.
              </p>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Share a concise overview of your teaching or mentoring background..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 leading-relaxed"
                required
              />
            </div>
          </div>

          {/* ── SECTION 2: PROPOSED GUIDANCE SESSION DETAILS ── */}
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <BookOpen size={20} className="text-purple-400" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                2. Proposed Guidance Session Details
              </h2>
            </div>

            {/* 10. Topic You Would Like to Guide Students On */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Topic You Would Like to Guide Students On{" "}
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="guidanceTopic"
                value={formData.guidanceTopic}
                onChange={handleChange}
                placeholder="e.g. Cracking NEET 2026: Physics Problem-Solving & High-Yield Strategy"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* 11. Brief Description of Your Proposed Session */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Brief Description of Your Proposed Session{" "}
                <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="sessionDescription"
                value={formData.sessionDescription}
                onChange={handleChange}
                rows={3}
                placeholder="What core concepts, exam tactics, or career pathways will this session cover?"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 12. Target Student Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Target Student Group <span className="text-rose-400">*</span>
                </label>
                <select
                  name="targetGroup"
                  value={formData.targetGroup}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {TARGET_GROUPS.map((g, idx) => (
                    <option key={idx} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* 14. Preferred Session Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Preferred Session Duration <span className="text-rose-400">*</span>
                </label>
                <select
                  name="preferredDuration"
                  value={formData.preferredDuration}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {SESSION_DURATIONS.map((d, idx) => (
                    <option key={idx} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* 15. Preferred Session Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Preferred Session Format
                </label>
                <select
                  name="preferredFormat"
                  value={formData.preferredFormat}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {SESSION_FORMATS.map((f, idx) => (
                    <option key={idx} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 13. Expected Learning Outcome for Students */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Expected Learning Outcome for Students{" "}
                <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="learningOutcome"
                value={formData.learningOutcome}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Students will be able to solve complex mechanics problems with 3 shortcut methods and master time allocation."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 leading-relaxed"
                required
              />
            </div>
          </div>

          {/* ── SECTION 3: CONTACT & AVAILABILITY ── */}
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Mail size={20} className="text-cyan-400" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                3. Contact & Availability
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 16. Mobile / WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Mobile / WhatsApp Number <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="10-digit Indian Mobile"
                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                  {!isAuthenticated && !phoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={sendingPhoneOtp || phoneResendCooldown > 0}
                      className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {sendingPhoneOtp
                        ? "Sending…"
                        : phoneResendCooldown > 0
                          ? `Resend (${phoneResendCooldown}s)`
                          : "Send OTP"}
                    </button>
                  )}
                  {phoneVerified && (
                    <span className="px-3 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-1 shrink-0">
                      <CheckCircle2 size={15} /> Verified
                    </span>
                  )}
                </div>

                {/* OTP input row if unauthenticated */}
                {!isAuthenticated && phoneOtpSent && !phoneVerified && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-2 mt-2">
                    <p className="text-[11px] text-slate-400">
                      Enter the 6-digit OTP sent to your phone:
                    </p>
                    <div className="flex gap-1.5 justify-between max-w-xs">
                      {phoneOtpInputs.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (phoneOtpRefs.current[idx] = el)}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handlePhoneOtpChange(idx, e.target.value)
                          }
                          className="w-9 h-10 text-center bg-slate-950 border border-slate-700 rounded-lg text-white font-black text-base focus:border-indigo-500 focus:outline-none"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyPhoneOtp}
                      disabled={verifyingPhone}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white cursor-pointer"
                    >
                      {verifyingPhone ? "Verifying…" : "Confirm OTP"}
                    </button>
                  </div>
                )}
              </div>

              {/* 17. Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@domain.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Account Password (if unauthenticated) */}
              {!isAuthenticated && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-300">
                    Create Password for Your Expert Account{" "}
                    <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={accountData.password}
                      onChange={(e) =>
                        setAccountData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* 18. Preferred Availability / Suitable Days */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Preferred Availability / Suitable Days
                </label>
                <input
                  type="text"
                  name="availabilityDays"
                  value={formData.availabilityDays}
                  onChange={handleChange}
                  placeholder="e.g. Weekends (Saturday/Sunday evenings)"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 19. Any Additional Information */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Any Additional Information
                </label>
                <input
                  type="text"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  placeholder="e.g. Previous guest talks, publications, or special equipment"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 4: CONFIRMATION & SUBMIT ── */}
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 cursor-pointer">
              <input
                type="checkbox"
                name="confirmedContribution"
                checked={formData.confirmedContribution}
                onChange={handleChange}
                className="mt-1 text-indigo-600 accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                required
              />
              <span className="text-xs text-slate-200 leading-relaxed">
                I confirm that the information provided above is correct and
                that I am willing to contribute a{" "}
                <strong className="text-white">FREE student guidance session</strong>{" "}
                on the selected topic.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || appLoading || authLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              <span>
                {submitting ? "Submitting Profile…" : "SUBMIT YOUR EXPERT PROFILE"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
