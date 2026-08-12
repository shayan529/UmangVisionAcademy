import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  fetchMyApplication,
  submitApplication,
} from '../../redux/slices/applicationsSlice';
import { clearAuth } from '../../redux/slices/authSlice';
import { uploadFile } from '../../utils/uploadFile.js';
import { hasBaseRole } from '../../utils/permissions';
import { INDIA_STATES, getCitiesForState } from '../../data/indiaLocations';
import { isFirebaseConfigured } from '../../config/firebase';
import {
  sendFirebasePhoneOtp,
  clearRecaptcha,
} from '../../services/firebasePhoneAuth';
import api from '../../config/api';
import { FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BecomeInstructorApplication = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading: appLoading, myApplication } = useSelector(
    (state) => state.applications
  );
  const { isAuthenticated, user, loading: authLoading } = useSelector(
    (state) => state.auth
  );
  const isStudent = hasBaseRole(user, "student");

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Phone OTP Verification States
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const [phoneOtpInputs, setPhoneOtpInputs] = useState(['', '', '', '', '', '']);
  const [firebaseConfirmationResult, setFirebaseConfirmationResult] = useState(null);
  const [otpFallbackMode, setOtpFallbackMode] = useState(false);
  const phoneOtpRefs = useRef([]);

  // Account creation state (for unauthenticated users)
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    state: '',
    city: '',
    pincode: '',
  });

  // Expert Registration Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    designation: '',
    organization: '',
    qualification: '',
    expertise: '',
    experienceYears: '',
    professionalField: '',
    bio: '',
    linkedinUrl: '',
    topic: '',
    sessionDescription: '',
    targetGroup: 'Classes 11–12',
    learningOutcome: '',
    sessionDuration: '45 Minutes',
    sessionFormat: 'Live Online Session',
    whatsappNumber: user?.phoneNumber || '',
    email: user?.email || '',
    availability: '',
    additionalInfo: '',
    confirmed: false,
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploadProgress, setResumeUploadProgress] = useState(0);
  const [resumeError, setResumeError] = useState('');

  // Keep name synced if user logs in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        whatsappNumber: prev.whatsappNumber || user.phoneNumber || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // Phone OTP resend timer
  useEffect(() => {
    if (phoneResendCooldown <= 0) return;
    const timer = setTimeout(() => setPhoneResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phoneResendCooldown]);

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const cleanVal = value.replace(/\D/g, '').slice(0, 10);
      setAccountData((prev) => ({ ...prev, phoneNumber: cleanVal }));
      setFormData((prev) => ({ ...prev, whatsappNumber: cleanVal }));
      if (phoneVerified || phoneOtpSent) {
        setPhoneVerified(false);
        setPhoneOtpSent(false);
        setPhoneOtpInputs(['', '', '', '', '', '']);
      }
      return;
    }

    setAccountData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'state') {
        next.city = '';
      }
      if (name === 'name') {
        setFormData((f) => ({ ...f, name: value }));
      }
      if (name === 'email') {
        setFormData((f) => ({ ...f, email: value }));
      }
      return next;
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const normalizeIndianPhoneNumber = (phoneNumber) => {
    const digits = (phoneNumber || '').replace(/\D/g, '');
    if (/^\d{10}$/.test(digits)) return `+91${digits}`;
    if (/^91\d{10}$/.test(digits)) return `+${digits}`;
    return null;
  };

  const handleSendPhoneOtp = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }
    const targetPhone = accountData.phoneNumber || formData.whatsappNumber;
    const normalizedPhoneNumber = normalizeIndianPhoneNumber(targetPhone);

    if (!normalizedPhoneNumber) {
      toast.error('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    clearRecaptcha('recaptcha-container');
    setFirebaseConfirmationResult(null);
    setOtpFallbackMode(false);
    setSendingPhoneOtp(true);

    try {
      await api.post('/auth/send-phone-otp', {
        phoneNumber: normalizedPhoneNumber,
      });

      if (isFirebaseConfigured()) {
        try {
          const confirmation = await sendFirebasePhoneOtp(normalizedPhoneNumber);
          setFirebaseConfirmationResult(confirmation);
        } catch (fbErr) {
          setOtpFallbackMode(true);
          setFirebaseConfirmationResult(null);
          console.error('Firebase Phone Auth Error:', fbErr);
        }
      } else {
        setOtpFallbackMode(true);
      }

      setPhoneOtpSent(true);
      setPhoneResendCooldown(30);
      toast.success(`OTP sent to ${normalizedPhoneNumber}`);
      setTimeout(() => phoneOtpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to send OTP.');
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handlePhoneOtpChange = (index, value) => {
    const char = value.slice(-1).replace(/\D/g, '');
    const newInputs = [...phoneOtpInputs];
    newInputs[index] = char;
    setPhoneOtpInputs(newInputs);

    if (char && index < 5) {
      phoneOtpRefs.current[index + 1]?.focus();
    }
  };

  const handlePhoneOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !phoneOtpInputs[index] && index > 0) {
      phoneOtpRefs.current[index - 1]?.focus();
    }
  };

  const handlePhoneOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newInputs = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newInputs[i] = pasted[i];
    }
    setPhoneOtpInputs(newInputs);
    const focusIdx = Math.min(pasted.length, 5);
    phoneOtpRefs.current[focusIdx]?.focus();
  };

  const handleVerifyPhoneOtp = async () => {
    const code = phoneOtpInputs.join('');
    if (code.length !== 6) {
      toast.error('Enter the 6-digit OTP code.');
      return;
    }

    const targetPhone = accountData.phoneNumber || formData.whatsappNumber;
    const normalizedPhoneNumber = normalizeIndianPhoneNumber(targetPhone);

    setVerifyingPhone(true);
    try {
      if (firebaseConfirmationResult && !otpFallbackMode) {
        await firebaseConfirmationResult.confirm(code);
      }
      await api.post('/auth/verify-phone-otp', {
        phoneNumber: normalizedPhoneNumber,
        code,
      });

      setPhoneVerified(true);
      toast.success('Mobile number verified successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Invalid OTP code.');
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = ['pdf', 'jpg', 'jpeg', 'png'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!validExts.includes(ext)) {
      setResumeError('Only PDF, JPG, or PNG files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File size must be under 5MB.');
      return;
    }

    setResumeError('');
    setResumeFile(file);
    setResumeUploading(true);
    setResumeUploadProgress(0);

    try {
      const data = await uploadFile({
        file,
        folder: '/instructor-resumes',
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setResumeUploadProgress(percent);
        },
      });

      setResumeUrl(data.url);
      toast.success('Resume uploaded successfully');
    } catch (err) {
      console.error(err);
      setResumeError('Failed to upload file. Please try again.');
      setResumeFile(null);
    } finally {
      setResumeUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isStudent) {
      toast.error('Students cannot register as an expert guide. Please create a new account.');
      return;
    }

    if (!formData.confirmed) {
      toast.error('Please confirm that the information provided is correct.');
      return;
    }

    // Required fields check
    const requiredFields = [
      { name: 'name', label: 'Full Name' },
      { name: 'designation', label: 'Designation / Professional Role' },
      { name: 'qualification', label: 'Highest Qualification' },
      { name: 'expertise', label: 'Area of Expertise' },
      { name: 'experienceYears', label: 'Years of Experience' },
      { name: 'bio', label: 'Short Self-Introduction' },
      { name: 'topic', label: 'Topic You Would Like to Guide Students On' },
      { name: 'sessionDescription', label: 'Brief Description of Proposed Session' },
      { name: 'expectedLearningOutcome', label: 'Expected Learning Outcome' },
      { name: 'whatsappNumber', label: 'Mobile / WhatsApp Number' },
      { name: 'email', label: 'Email Address' },
    ];

    for (const req of requiredFields) {
      if (!formData[req.name]?.trim() && req.name !== 'expectedLearningOutcome') {
        if (req.name === 'learningOutcome' && !formData.learningOutcome?.trim()) {
          toast.error(`Please fill in "${req.label}".`);
          return;
        }
        if (req.name !== 'learningOutcome' && !formData[req.name]?.trim()) {
          toast.error(`Please fill in "${req.label}".`);
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      // 1. Unauthenticated: Create user account first
      if (!isAuthenticated) {
        if (!phoneVerified) {
          toast.error('Please verify your phone number with OTP first.');
          setSubmitting(false);
          return;
        }

        const regRes = await api.post('/auth/register', {
          name: accountData.name,
          email: accountData.email,
          password: accountData.password,
          phoneNumber: accountData.phoneNumber,
          state: accountData.state,
          city: accountData.city,
          pincode: accountData.pincode,
          role: 'instructor',
        });

        // Set token
        if (regRes.data?.token) {
          localStorage.setItem('authToken', regRes.data.token);
        }
      }

      // 2. Submit Expert Application
      const payload = {
        name: formData.name,
        designation: formData.designation,
        organization: formData.organization,
        qualification: formData.qualification,
        expertise: formData.expertise,
        experienceYears: formData.experienceYears,
        professionalField: formData.professionalField,
        bio: formData.bio,
        linkedinUrl: formData.linkedinUrl,
        topic: formData.topic,
        sessionDescription: formData.sessionDescription,
        targetGroup: formData.targetGroup,
        learningOutcome: formData.learningOutcome,
        sessionDuration: formData.sessionDuration,
        sessionFormat: formData.sessionFormat,
        whatsappNumber: formData.whatsappNumber,
        email: formData.email,
        availability: formData.availability,
        additionalInfo: formData.additionalInfo,
        confirmed: formData.confirmed,
        contentLink: formData.linkedinUrl || '',
        resumeUrl,
      };

      await dispatch(submitApplication(payload)).unwrap();
      toast.success('Expert profile submitted successfully!');
      navigate('/instructor-application/status');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to submit expert profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableCities = accountData.state
    ? getCitiesForState(accountData.state)
    : [];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <Link
          to="/become-instructor"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 transition mb-2"
        >
          {t("becomeInstructorApp.backToOverview", "← Back to Overview")}
        </Link>
        <span className="block w-fit mx-auto rounded-full bg-teal-500/10 text-teal-300 px-4 py-1.5 text-xs font-bold uppercase tracking-wider border border-teal-500/20">
          {t("becomeInstructor.heroBadge", "FREE STUDENT GUIDANCE INITIATIVE")}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          {t("becomeInstructorApp.heroTitlePart1", "REGISTER AS AN")}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400">
            {t("becomeInstructorApp.heroTitlePart2", "EXPERT GUIDE")}
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          {t("becomeInstructorApp.heroSubtitle", "Share your professional experience, guide students in making informed career decisions, and conduct voluntary guidance sessions.")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl px-2 sm:px-4">
        <div className="rounded-[32px] border border-slate-800 bg-[#111827]/95 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* Warning block if user is logged in with a Student account */}
          {isStudent ? (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-6 text-center space-y-4">
              <div className="text-3xl">⚠️</div>
              <h3 className="text-lg font-bold text-amber-200">
                {t("becomeInstructorApp.studentWarningTitle", "Student Accounts Cannot Register as Expert Guides")}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                {t("becomeInstructorApp.studentWarningText", "Student accounts cannot register as an expert guide. Please log out to register a new expert profile.")}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => dispatch(clearAuth())}
                  className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:scale-105 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {t("becomeInstructor.studentLogoutBtn", "Log Out & Register Fresh Profile")}
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-8" onSubmit={handleSubmit}>
              
              {/* Account Registration Section (shown when NOT authenticated) */}
              {!isAuthenticated && (
                <div className="space-y-5 pb-8 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-base">
                    <span>{t("becomeInstructorApp.section1Title", "1. Create Your Guide Account Credentials")}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.fullName", "Full Name")} <span className="text-red-400">*</span>
                      </span>
                      <input
                        type="text"
                        name="name"
                        required
                        value={accountData.name}
                        onChange={handleAccountChange}
                        placeholder={t("becomeInstructorApp.fullNamePlaceholder", "Dr. Rajesh Kumar")}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.emailAddress", "Email Address")} <span className="text-red-400">*</span>
                      </span>
                      <input
                        type="email"
                        name="email"
                        required
                        value={accountData.email}
                        onChange={handleAccountChange}
                        placeholder={t("becomeInstructorApp.emailPlaceholder", "expert@example.com")}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block relative">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.password", "Password")} <span className="text-red-400">*</span>
                      </span>
                      <div className="relative mt-2">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          minLength={6}
                          value={accountData.password}
                          onChange={handleAccountChange}
                          placeholder={t("becomeInstructorApp.passwordPlaceholder", "Min 6 characters")}
                          className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 pr-10 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                      </div>
                    </label>

                    {/* Phone Number Field with OTP Verification */}
                    <label className="block">
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-300">
                        <span>
                          {t("becomeInstructorApp.mobileNumber", "Mobile / WhatsApp Number")} <span className="text-red-400">*</span>
                        </span>
                        {phoneVerified && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                            <FiCheckCircle size={13} /> {t("becomeInstructorApp.verified", "Verified")}
                          </span>
                        )}
                      </div>
                      <div className="relative mt-2">
                        <input
                          type="tel"
                          name="phoneNumber"
                          required
                          value={accountData.phoneNumber}
                          onChange={handleAccountChange}
                          placeholder={t("becomeInstructorApp.mobilePlaceholder", "10-digit mobile number")}
                          className={`w-full rounded-2xl border bg-slate-950/80 px-4 py-3.5 pr-28 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition ${
                            phoneVerified
                              ? 'border-emerald-500/50 focus:border-emerald-400 focus:ring-emerald-500/20'
                              : 'border-slate-800 focus:border-teal-400 focus:ring-teal-500/20'
                          }`}
                        />
                        {!phoneVerified && (
                          <button
                            type="button"
                            onClick={handleSendPhoneOtp}
                            disabled={
                              sendingPhoneOtp ||
                              accountData.phoneNumber.replace(/\D/g, '').length !== 10
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-teal-600 hover:bg-teal-500 px-3.5 py-1.5 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
                          >
                            {sendingPhoneOtp
                              ? t("becomeInstructorApp.sendingOtp", "Sending...")
                              : phoneOtpSent
                              ? t("becomeInstructorApp.resendOtp", "Resend OTP")
                              : t("becomeInstructorApp.sendOtp", "Send OTP")}
                          </button>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* OTP Input Card */}
                  {phoneOtpSent && !phoneVerified && (
                    <div className="rounded-2xl bg-teal-500/10 border border-teal-500/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-300">
                          {t("becomeInstructorApp.enterOtpNotice", "Enter 6-digit OTP sent to +91 {{phone}}", { phone: accountData.phoneNumber })}
                        </span>
                        {phoneResendCooldown > 0 ? (
                          <span className="text-xs text-slate-400 font-medium">
                            {t("becomeInstructorApp.resendIn", "Resend in {{seconds}}s", { seconds: phoneResendCooldown })}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendPhoneOtp}
                            className="text-xs font-bold text-teal-400 hover:underline cursor-pointer"
                          >
                            {t("becomeInstructorApp.resendOtp", "Resend OTP")}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 justify-center py-1">
                        {phoneOtpInputs.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (phoneOtpRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handlePhoneOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handlePhoneOtpKeyDown(idx, e)}
                            onPaste={handlePhoneOtpPaste}
                            className="w-10 h-12 text-center text-lg font-bold rounded-xl border border-white/20 bg-slate-950 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyPhoneOtp}
                        disabled={verifyingPhone || phoneOtpInputs.join('').length < 6}
                        className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-2.5 text-xs font-bold text-slate-950 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                      >
                        {verifyingPhone ? t("becomeInstructorApp.verifyingOtp", "Verifying OTP...") : t("becomeInstructorApp.verifyOtpCode", "Verify OTP Code")}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.state", "State")} <span className="text-red-400">*</span>
                      </span>
                      <select
                        name="state"
                        required
                        value={accountData.state}
                        onChange={handleAccountChange}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                      >
                        <option value="">{t("becomeInstructorApp.selectState", "Select State")}</option>
                        {INDIA_STATES.map((s) => (
                          <option key={s} value={s} className="bg-slate-900">
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.city", "City")} <span className="text-red-400">*</span>
                      </span>
                      <select
                        name="city"
                        required
                        value={accountData.city}
                        onChange={handleAccountChange}
                        disabled={!accountData.state}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition disabled:opacity-50"
                      >
                        <option value="">{t("becomeInstructorApp.selectCity", "Select City")}</option>
                        {availableCities.map((c) => (
                          <option key={c} value={c} className="bg-slate-900">
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.pincode", "Pincode")} <span className="text-red-400">*</span>
                      </span>
                      <input
                        type="text"
                        name="pincode"
                        required
                        value={accountData.pincode}
                        onChange={handleAccountChange}
                        placeholder={t("becomeInstructorApp.pincodePlaceholder", "6-digit PIN")}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* EXPERT REGISTRATION FORM - PERSONAL & PROFESSIONAL DETAILS */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span className="text-teal-400 font-mono">2.</span> {t("becomeInstructorApp.section2Title", "Personal & Professional Details")}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300">
                      {t("becomeInstructorApp.f1_fullName", "1. Full Name")} <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder={t("becomeInstructorApp.f1_placeholder", "e.g. Dr. Rajesh Kumar")}
                      className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300">
                      {t("becomeInstructorApp.f2_designation", "2. Designation / Professional Role")} <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="text"
                      name="designation"
                      required
                      value={formData.designation}
                      onChange={handleFormChange}
                      placeholder={t("becomeInstructorApp.f2_placeholder", "e.g. Senior Lecturer / Career Counselor")}
                      className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300">
                      {t("becomeInstructorApp.f3_organization", "3. Organization / Institution")}
                    </span>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleFormChange}
                      placeholder={t("becomeInstructorApp.f3_placeholder", "e.g. National Institute of Technology")}
                      className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300">
                      {t("becomeInstructorApp.f4_qualification", "4. Highest Qualification")} <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="text"
                      name="qualification"
                      required
                      value={formData.qualification}
                      onChange={handleFormChange}
                      placeholder={t("becomeInstructorApp.f4_placeholder", "e.g. Ph.D. / M.Tech / M.Sc")}
                      className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300">
                      {t("becomeInstructorApp.f5_expertise", "5. Area of Expertise")} <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="text"
                      name="expertise"
                      required
                      value={formData.expertise}
                      onChange={handleFormChange}
                      placeholder={t("becomeInstructorApp.f5_placeholder", "e.g. Physics / Career Mentorship")}
                      className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300">
                      {t("becomeInstructorApp.f6_experience", "6. Years of Experience")} <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="text"
                      name="experienceYears"
                      required
                      value={formData.experienceYears}
                      onChange={handleFormChange}
                      placeholder={t("becomeInstructorApp.f6_placeholder", "e.g. 8+ Years")}
                      className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300">
                      {t("becomeInstructorApp.f7_field", "7. Current Professional Field")}
                    </span>
                    <input
                      type="text"
                      name="professionalField"
                      value={formData.professionalField}
                      onChange={handleFormChange}
                      placeholder={t("becomeInstructorApp.f7_placeholder", "e.g. Education / Engineering")}
                      className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-300">
                    {t("becomeInstructorApp.f8_bio", "8. Short Self-Introduction")} <span className="text-red-400">*</span>
                  </span>
                  <textarea
                    rows="3"
                    name="bio"
                    required
                    value={formData.bio}
                    onChange={handleFormChange}
                    placeholder={t("becomeInstructorApp.f8_placeholder", "Briefly tell us about your professional background, expertise, and experience.")}
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition leading-relaxed"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-300">
                    {t("becomeInstructorApp.f9_linkedin", "9. Professional Profile / LinkedIn Profile")} <span className="text-slate-500 font-normal">({t("becomeInstructorApp.optional", "Optional")})</span>
                  </span>
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleFormChange}
                    placeholder="https://linkedin.com/in/username"
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </label>

                {/* SESSION DETAILS */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span className="text-teal-400 font-mono">3.</span> {t("becomeInstructorApp.section3Title", "Proposed Student Guidance Session")}
                  </h3>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300">
                      {t("becomeInstructorApp.f10_topic", "10. Topic You Would Like to Guide Students On")} <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="text"
                      name="topic"
                      required
                      value={formData.topic}
                      onChange={handleFormChange}
                      placeholder={t("becomeInstructorApp.f10_placeholder", "e.g. How to Prepare for JEE/NEET & Career Paths in Technology")}
                      className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300">
                      {t("becomeInstructorApp.f11_desc", "11. Brief Description of Your Proposed Session")} <span className="text-red-400">*</span>
                    </span>
                    <textarea
                      rows="3"
                      name="sessionDescription"
                      required
                      value={formData.sessionDescription}
                      onChange={handleFormChange}
                      placeholder={t("becomeInstructorApp.f11_placeholder", "Describe the key topics, outline, and focus of your guidance session.")}
                      className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition leading-relaxed"
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.f12_targetGroup", "12. Target Student Group")} <span className="text-red-400">*</span>
                      </span>
                      <select
                        name="targetGroup"
                        required
                        value={formData.targetGroup}
                        onChange={handleFormChange}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                      >
                        <option value="Classes 9–10">{t("becomeInstructorApp.targetGroup_9_10", "Classes 9–10")}</option>
                        <option value="Classes 11–12">{t("becomeInstructorApp.targetGroup_11_12", "Classes 11–12")}</option>
                        <option value="College / University Students">{t("becomeInstructorApp.targetGroup_college", "College / University Students")}</option>
                        <option value="Competitive Exam Aspirants">{t("becomeInstructorApp.targetGroup_competitive", "Competitive Exam Aspirants")}</option>
                        <option value="Job / Career Aspirants">{t("becomeInstructorApp.targetGroup_career", "Job / Career Aspirants")}</option>
                        <option value="Other">{t("becomeInstructorApp.other", "Other")}</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.f14_duration", "14. Preferred Session Duration")} <span className="text-red-400">*</span>
                      </span>
                      <select
                        name="sessionDuration"
                        required
                        value={formData.sessionDuration}
                        onChange={handleFormChange}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                      >
                        <option value="45 Minutes">{t("becomeInstructorApp.duration_45", "45 Minutes")}</option>
                        <option value="30 Minutes">{t("becomeInstructorApp.duration_30", "30 Minutes")}</option>
                        <option value="60 Minutes">{t("becomeInstructorApp.duration_60", "60 Minutes")}</option>
                        <option value="Other">{t("becomeInstructorApp.other", "Other")}</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.f15_format", "15. Preferred Session Format")}
                      </span>
                      <select
                        name="sessionFormat"
                        value={formData.sessionFormat}
                        onChange={handleFormChange}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                      >
                        <option value="Live Online Session">{t("becomeInstructorApp.format_live", "Live Online Session")}</option>
                        <option value="Webinar">{t("becomeInstructorApp.format_webinar", "Webinar")}</option>
                        <option value="Interactive Q&A">{t("becomeInstructorApp.format_qa", "Interactive Q&A")}</option>
                        <option value="Expert Talk">{t("becomeInstructorApp.format_talk", "Expert Talk")}</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300">
                      {t("becomeInstructorApp.f13_outcome", "13. Expected Learning Outcome for Students")} <span className="text-red-400">*</span>
                    </span>
                    <textarea
                      rows="2"
                      name="learningOutcome"
                      required
                      value={formData.learningOutcome}
                      onChange={handleFormChange}
                      placeholder={t("becomeInstructorApp.f13_placeholder", "What key takeaways or skills will students gain after attending your session?")}
                      className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                    />
                  </label>
                </div>

                {/* CONTACT & AVAILABILITY */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span className="text-teal-400 font-mono">4.</span> {t("becomeInstructorApp.section4Title", "Contact & Availability")}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.f16_whatsapp", "16. Mobile / WhatsApp Number")} <span className="text-red-400">*</span>
                      </span>
                      <input
                        type="tel"
                        name="whatsappNumber"
                        required
                        value={formData.whatsappNumber}
                        onChange={handleFormChange}
                        placeholder={t("becomeInstructorApp.f16_placeholder", "10-digit WhatsApp number")}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.f17_email", "17. Email Address")} <span className="text-red-400">*</span>
                      </span>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder={t("becomeInstructorApp.f17_placeholder", "expert@example.com")}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.f18_availability", "18. Preferred Availability / Suitable Days")}
                      </span>
                      <input
                        type="text"
                        name="availability"
                        value={formData.availability}
                        onChange={handleFormChange}
                        placeholder={t("becomeInstructorApp.f18_placeholder", "e.g. Weekends / Saturdays 4 PM – 6 PM")}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t("becomeInstructorApp.f19_additional", "19. Any Additional Information")}
                      </span>
                      <input
                        type="text"
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleFormChange}
                        placeholder={t("becomeInstructorApp.f19_placeholder", "Any additional notes or requirements")}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                      />
                    </label>
                  </div>

                  {/* RESUME UPLOAD (OPTIONAL) */}
                  <label className="block pt-2">
                    <span className="text-sm font-semibold text-slate-300">
                      {t("becomeInstructorApp.resumeTitle", "Upload Resume / Curriculum Vitae")} <span className="text-slate-500 font-normal">({t("becomeInstructorApp.resumeFormat", "PDF / Image, Max 5MB")})</span>
                    </span>
                    <div className="mt-2">
                      <label className="flex flex-col items-center justify-center w-full rounded-2xl border border-dashed border-slate-800 bg-slate-950/80 px-4 py-5 cursor-pointer hover:border-teal-400/50 transition duration-200">
                        <svg
                          className="w-7 h-7 text-slate-500 mb-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
                          />
                        </svg>
                        {resumeFile ? (
                          <span className="text-sm text-teal-300 font-medium">
                            {resumeFile.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">
                            {t("becomeInstructorApp.resumeClick", "Click to upload resume file")}
                          </span>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleResumeChange}
                          className="hidden"
                        />
                      </label>
                      {resumeUploading && (
                        <div className="mt-3 rounded-2xl bg-slate-950/90 px-4 py-3">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{t("becomeInstructorApp.uploadingResume", "Uploading resume...")}</span>
                            <span>{resumeUploadProgress}%</span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                              style={{ width: `${resumeUploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {resumeUrl && !resumeUploading && (
                        <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-950/90 px-4 py-3 text-xs text-slate-200">
                          <span>{t("becomeInstructorApp.resumeSuccess", "✓ Resume uploaded successfully")}</span>
                          <button
                            type="button"
                            className="text-teal-300 hover:text-teal-200 font-bold cursor-pointer"
                            onClick={() => {
                              setResumeFile(null);
                              setResumeUrl('');
                              setResumeUploadProgress(0);
                            }}
                          >
                            {t("becomeInstructorApp.remove", "Remove")}
                          </button>
                        </div>
                      )}
                      {resumeError && (
                        <p className="mt-2 text-xs text-red-400">{resumeError}</p>
                      )}
                    </div>
                  </label>
                </div>

                {/* CONFIRMATION CHECKBOX */}
                <div className="pt-4 border-t border-slate-800">
                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="confirmed"
                      required
                      checked={formData.confirmed}
                      onChange={handleFormChange}
                      className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-teal-400 focus:ring-teal-400 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed">
                      {t("becomeInstructorApp.confirmText", "I confirm that the information provided above is correct and that I am willing to contribute a FREE student guidance session on the selected topic.")}
                    </span>
                  </label>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting || appLoading || authLoading || resumeUploading || !formData.confirmed}
                    className="w-full rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 px-6 py-4 text-sm sm:text-base font-extrabold text-slate-950 transition hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                  >
                    {submitting || appLoading || authLoading || resumeUploading
                      ? t("becomeInstructorApp.submittingBtn", "SUBMITTING PROFILE...")
                      : t("becomeInstructorApp.submitBtn", "[ SUBMIT YOUR EXPERT PROFILE ]")}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default BecomeInstructorApplication;
