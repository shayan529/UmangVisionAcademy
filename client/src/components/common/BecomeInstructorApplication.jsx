import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  fetchMyApplication,
  submitApplication,
} from '../../redux/slices/applicationsSlice';
import { register, clearAuth } from '../../redux/slices/authSlice';
import { uploadFile } from '../../utils/uploadFile.js';
import { hasBaseRole } from '../../utils/permissions';
import { INDIA_STATES, getCitiesForState } from '../../data/indiaLocations';
import { isFirebaseConfigured } from '../../config/firebase';
import {
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
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

  // Teaching application state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    expertise: '',
    bio: '',
    contentLink: '',
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploadProgress, setResumeUploadProgress] = useState(0);
  const [resumeError, setResumeError] = useState('');

  // Keep name synced if user logs in
  useEffect(() => {
    if (user?.name) {
      setFormData((prev) => ({ ...prev, name: user.name }));
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
      return next;
    });
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
    const normalizedPhoneNumber = normalizeIndianPhoneNumber(accountData.phoneNumber);

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
          console.error('Firebase Phone Auth Error in Application Form:', fbErr);
        }
      } else {
        setOtpFallbackMode(true);
      }

      toast.success(`OTP sent to ${normalizedPhoneNumber}!`);
      setPhoneOtpSent(true);
      setPhoneResendCooldown(30);
      setTimeout(() => phoneOtpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to send OTP');
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
    if (e.key === 'Backspace' && !phoneOtpInputs[index] && index > 0)
      phoneOtpRefs.current[index - 1]?.focus();
  };

  const handlePhoneOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    const updated = [...phoneOtpInputs];
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setPhoneOtpInputs(updated);
    phoneOtpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyPhoneOtp = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }
    const code = phoneOtpInputs.join('');
    const normalizedPhoneNumber = normalizeIndianPhoneNumber(accountData.phoneNumber);

    if (code.length < 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }

    if (!normalizedPhoneNumber) {
      toast.error('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setVerifyingPhone(true);
    try {
      if (isFirebaseConfigured() && firebaseConfirmationResult) {
        const { idToken } = await verifyFirebasePhoneOtp(
          firebaseConfirmationResult,
          code
        );
        await api.post('/auth/verify-firebase-token', {
          firebaseToken: idToken,
          phoneNumber: normalizedPhoneNumber,
        });
        setPhoneVerified(true);
        setPhoneOtpSent(false);
        toast.success('Phone verified ✓');
        return;
      }

      await api.post('/auth/verify-phone-otp', {
        phoneNumber: normalizedPhoneNumber,
        otp: code,
      });
      setPhoneVerified(true);
      setPhoneOtpSent(false);
      toast.success('Phone verified ✓');
    } catch (err) {
      console.error('Verification error:', err);
      toast.error(
        err?.response?.data?.message || err?.message || 'Invalid OTP code'
      );
      setPhoneOtpInputs(['', '', '', '', '', '']);
      phoneOtpRefs.current[0]?.focus();
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleFormChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setResumeError(t('becomeInstructorApplication.onlyPdfJpgPng'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeError(t('becomeInstructorApplication.max5mb'));
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
        onUploadProgress: (event) =>
          setResumeUploadProgress(
            Math.round((event.loaded / event.total) * 100)
          ),
      });
      setResumeUrl(data.url);
    } catch (uploadError) {
      setResumeError(
        uploadError.response?.data?.message ||
        uploadError.message ||
        'Upload failed. Please try again.'
      );
      setResumeFile(null);
      setResumeUrl('');
    } finally {
      setResumeUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isStudent) {
      toast.error(
        t(
          'becomeInstructor.studentCannotBecomeError',
          'Students cannot become an instructor. Please create a fresh account.'
        )
      );
      return;
    }

    const { expertise, bio, contentLink } = formData;

    // Unauthenticated user: register account first, then submit application
    if (!isAuthenticated) {
      const { name, email, password, phoneNumber, state, city, pincode } = accountData;

      if (!name || !email || !password || !phoneNumber || !state || !city || !pincode) {
        toast.error('Please fill in all account registration fields.');
        return;
      }
      if (!phoneVerified) {
        toast.error('Please verify your phone number via OTP before submitting.');
        return;
      }
      if (!expertise || !bio || !contentLink) {
        toast.error(t('becomeInstructorApplication.allFieldsRequired'));
        return;
      }
      if (!resumeUrl) {
        toast.error('Please upload your resume before submitting');
        return;
      }

      try {
        setSubmitting(true);
        // Step 1: Register new user with role "instructor"
        await dispatch(
          register({
            name,
            email,
            password,
            phoneNumber,
            state,
            city,
            pincode,
            role: 'instructor',
          })
        ).unwrap();

        // Step 2: Submit application
        const payload = new FormData();
        payload.append('name', name);
        payload.append('expertise', expertise);
        payload.append('bio', bio);
        payload.append('contentLink', contentLink);
        payload.append('resumeUrl', resumeUrl);

        await dispatch(submitApplication(payload)).unwrap();
        toast.success(t('becomeInstructorApplication.submitted'));
        navigate('/instructor-application/status');
      } catch (err) {
        toast.error(
          typeof err === 'string'
            ? err
            : err?.message || t('becomeInstructorApplication.failedSubmit')
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Authenticated non-student user: submit application directly
    const nameToSubmit = formData.name || user?.name || accountData.name;
    if (!nameToSubmit || !expertise || !bio || !contentLink) {
      toast.error(t('becomeInstructorApplication.allFieldsRequired'));
      return;
    }
    if (!resumeUrl) {
      toast.error('Please upload your resume before submitting');
      return;
    }

    const payload = new FormData();
    payload.append('name', nameToSubmit);
    payload.append('expertise', expertise);
    payload.append('bio', bio);
    payload.append('contentLink', contentLink);
    payload.append('resumeUrl', resumeUrl);

    try {
      setSubmitting(true);
      await dispatch(submitApplication(payload)).unwrap();
      toast.success(t('becomeInstructorApplication.submitted'));
      navigate('/instructor-application/status');
    } catch (err) {
      toast.error(
        typeof err === 'string'
          ? err
          : err?.message || t('becomeInstructorApplication.failedSubmit')
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchMyApplication());
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (myApplication)
      navigate('/instructor-application/status', { replace: true });
  }, [myApplication, navigate]);

  const availableCities = accountData.state
    ? getCitiesForState(accountData.state)
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        <Link
          to="/become-instructor"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition mb-8 text-sm font-medium"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t('becomeInstructorApplication.backToOverview')}
        </Link>

        <span className="inline-flex rounded-full bg-indigo-500/10 text-indigo-300 px-4 py-2 text-sm font-semibold tracking-wide mb-4 border border-indigo-500/20">
          {t('becomeInstructorApplication.formBadge')}
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          {t('becomeInstructorApplication.titleStart')}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 ml-2">
            {t('becomeInstructorApplication.titleHighlight')}
          </span>
        </h2>
        <p className="text-slate-400 text-lg leading-7 max-w-xl">
          {t('becomeInstructorApplication.description')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-indigo-500/10">
          
          {/* Warning block if user is logged in with a Student account */}
          {isStudent ? (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-6 text-center space-y-4">
              <div className="text-3xl">⚠️</div>
              <h3 className="text-lg font-bold text-amber-200">
                {t('becomeInstructorApplication.studentCannotApplyTitle', 'Student Accounts Cannot Apply')}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                {t(
                  'becomeInstructor.studentCannotBecomeError',
                  'Students cannot become an instructor. Please create a fresh account.'
                )}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => dispatch(clearAuth())}
                  className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:scale-105 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {t('becomeInstructorApplication.logoutAndRegisterFresh', 'Log Out & Register Fresh Account')}
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Account Registration Section (shown when NOT authenticated) */}
              {!isAuthenticated && (
                <div className="space-y-5 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
                    <span>{t('becomeInstructorApplication.section1Title', '1. Create Your Account Credentials')}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t('becomeInstructorApplication.fullNameLabel', 'Full Name')} <span className="text-red-400">*</span>
                      </span>
                      <input
                        type="text"
                        name="name"
                        required
                        value={accountData.name}
                        onChange={handleAccountChange}
                        placeholder={t('becomeInstructorApplication.namePlaceholder', 'Dr. Rajesh Kumar')}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t('becomeInstructorApplication.emailLabel', 'Email Address')} <span className="text-red-400">*</span>
                      </span>
                      <input
                        type="email"
                        name="email"
                        required
                        value={accountData.email}
                        onChange={handleAccountChange}
                        placeholder={t('becomeInstructorApplication.emailPlaceholder', 'instructor@example.com')}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block relative">
                      <span className="text-sm font-semibold text-slate-300">
                        {t('becomeInstructorApplication.passwordLabel', 'Password')} <span className="text-red-400">*</span>
                      </span>
                      <div className="relative mt-2">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          minLength={6}
                          value={accountData.password}
                          onChange={handleAccountChange}
                          placeholder={t('becomeInstructorApplication.passwordPlaceholder', 'Min 6 characters')}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3.5 pr-10 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
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
                          {t('becomeInstructorApplication.phoneLabel', 'Phone Number')} <span className="text-red-400">*</span>
                        </span>
                        {phoneVerified && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                            <FiCheckCircle size={13} /> {t('becomeInstructorApplication.verified', 'Verified')}
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
                          placeholder={t('becomeInstructorApplication.phonePlaceholder', '10-digit mobile number')}
                          className={`w-full rounded-2xl border bg-slate-950/80 px-4 py-3.5 pr-28 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition ${
                            phoneVerified
                              ? 'border-emerald-500/50 focus:border-emerald-400 focus:ring-emerald-500/20'
                              : 'border-white/10 focus:border-indigo-400 focus:ring-indigo-500/20'
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
                          >
                            {sendingPhoneOtp
                              ? t('becomeInstructorApplication.sendingOtp', 'Sending...')
                              : phoneOtpSent
                              ? t('becomeInstructorApplication.resendOtp', 'Resend OTP')
                              : t('becomeInstructorApplication.sendOtp', 'Send OTP')}
                          </button>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* OTP Input Card */}
                  {phoneOtpSent && !phoneVerified && (
                    <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300">
                          {t('becomeInstructorApplication.enterOtpPrompt', 'Enter 6-digit OTP sent to +91 {{phone}}', { phone: accountData.phoneNumber })}
                        </span>
                        {phoneResendCooldown > 0 ? (
                          <span className="text-xs text-slate-400 font-medium">
                            {t('becomeInstructorApplication.resendIn', 'Resend in {{sec}}s', { sec: phoneResendCooldown })}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendPhoneOtp}
                            className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer"
                          >
                            {t('becomeInstructorApplication.resendOtp', 'Resend OTP')}
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
                            className="w-10 h-12 text-center text-lg font-bold rounded-xl border border-white/20 bg-slate-950 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyPhoneOtp}
                        disabled={verifyingPhone || phoneOtpInputs.join('').length < 6}
                        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-2.5 text-xs font-bold text-slate-950 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                      >
                        {verifyingPhone
                          ? t('becomeInstructorApplication.verifyingOtp', 'Verifying OTP...')
                          : t('becomeInstructorApplication.verifyOtpButton', 'Verify OTP Code')}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t('becomeInstructorApplication.stateLabel', 'State')} <span className="text-red-400">*</span>
                      </span>
                      <select
                        name="state"
                        required
                        value={accountData.state}
                        onChange={handleAccountChange}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3.5 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                      >
                        <option value="">{t('becomeInstructorApplication.selectState', 'Select State')}</option>
                        {INDIA_STATES.map((s) => (
                          <option key={s} value={s} className="bg-slate-900">
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t('becomeInstructorApplication.cityLabel', 'City')} <span className="text-red-400">*</span>
                      </span>
                      <select
                        name="city"
                        required
                        value={accountData.city}
                        onChange={handleAccountChange}
                        disabled={!accountData.state}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3.5 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-50"
                      >
                        <option value="">{t('becomeInstructorApplication.selectCity', 'Select City')}</option>
                        {availableCities.map((c) => (
                          <option key={c} value={c} className="bg-slate-900">
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300">
                        {t('becomeInstructorApplication.pincodeLabel', 'Pincode')} <span className="text-red-400">*</span>
                      </span>
                      <input
                        type="text"
                        name="pincode"
                        required
                        value={accountData.pincode}
                        onChange={handleAccountChange}
                        placeholder={t('becomeInstructorApplication.pincodePlaceholder', '6-digit PIN')}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Application Details Section */}
              <div className="space-y-5">
                {!isAuthenticated && (
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
                    <span>{t('becomeInstructorApplication.section2Title', '2. Teaching Application & Experience')}</span>
                  </div>
                )}

                {isAuthenticated && (
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-300">
                      {t('becomeInstructorApplication.fullNameLabel')}
                    </span>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder={t('becomeInstructorApplication.namePlaceholder')}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="text-sm font-semibold text-slate-300">
                    {t('becomeInstructorApplication.expertiseLabel')} <span className="text-red-400">*</span>
                  </span>
                  <input
                    type="text"
                    name="expertise"
                    value={formData.expertise}
                    required
                    onChange={handleFormChange}
                    placeholder={t(
                      'becomeInstructorApplication.expertisePlaceholder'
                    )}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-300">
                    {t('becomeInstructorApplication.bioLabel')} <span className="text-red-400">*</span>
                  </span>
                  <textarea
                    rows="4"
                    name="bio"
                    value={formData.bio}
                    required
                    onChange={handleFormChange}
                    placeholder={t('becomeInstructorApplication.bioPlaceholder')}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                  <span className="text-xs text-slate-500 mt-1.5 block">
                    *This will show on your instructor public profile
                  </span>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-300">
                    {t('becomeInstructorApplication.contentLinkLabel')} <span className="text-red-400">*</span>
                  </span>
                  <input
                    type="url"
                    name="contentLink"
                    value={formData.contentLink}
                    required
                    onChange={handleFormChange}
                    placeholder={t('becomeInstructorApplication.urlPlaceholder')}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-300">
                    {t('becomeInstructorApplication.resumeLabel')}
                    <span className="text-red-400 ml-0.5">*</span>
                    <span className="text-slate-500 font-normal">
                      {` ${t('becomeInstructorApplication.resumeHint')}`}
                    </span>
                  </span>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full rounded-2xl border border-dashed border-white/20 bg-slate-950/80 px-4 py-6 cursor-pointer hover:border-indigo-400/50 transition duration-200">
                      <svg
                        className="w-8 h-8 text-slate-500 mb-2"
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
                        <span className="text-sm text-indigo-300 font-medium">
                          {resumeFile.name}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">
                          {t('becomeInstructorApplication.uploadPrompt')}
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
                          <span>Uploading resume</span>
                          <span>{resumeUploadProgress}%</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                            style={{ width: `${resumeUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {resumeUrl && !resumeUploading && (
                      <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-950/90 px-4 py-3 text-sm text-slate-200">
                        <span>Resume uploaded</span>
                        <button
                          type="button"
                          className="text-indigo-300 hover:text-indigo-200"
                          onClick={() => {
                            setResumeFile(null);
                            setResumeUrl('');
                            setResumeUploadProgress(0);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {resumeError && (
                      <p className="mt-2 text-xs text-red-400">{resumeError}</p>
                    )}
                  </div>
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || appLoading || authLoading || resumeUploading}
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 px-6 py-4 text-sm font-bold text-slate-950 transition hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {submitting || appLoading || authLoading || resumeUploading
                    ? t('becomeInstructorApplication.submitting')
                    : !isAuthenticated
                    ? t('becomeInstructorApplication.createAccountAndSubmit', 'Create Account & Submit Application')
                    : t('becomeInstructorApplication.submitButton')}
                </button>
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
