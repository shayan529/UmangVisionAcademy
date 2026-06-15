import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, SectionHeader, Btn } from './InstructorUi';
import { fetchProfile, updateProfile } from '../../redux/slices/settingsSlice';
import { logoutUser } from '../../redux/slices/authSlice';
import api from '../../config/api';

// ── Indian states & cities ────────────────────────────────────────────────────
const indianCitiesByState = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
  'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Naharlagun'],
  Assam: ['Guwahati', 'Dibrugarh', 'Jorhat', 'Silchar'],
  Bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
  Chhattisgarh: ['Raipur', 'Bhilai', 'Korba', 'Durg'],
  Goa: ['Panaji', 'Margao', 'Vasco da Gama'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Karnal'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Manali'],
  Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Mangalore', 'Hubli'],
  Kerala: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  Manipur: ['Imphal', 'Churachandpur'],
  Meghalaya: ['Shillong', 'Tura'],
  Mizoram: ['Aizawl', 'Lunglei'],
  Nagaland: ['Kohima', 'Dimapur'],
  Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela'],
  Punjab: ['Chandigarh', 'Amritsar', 'Ludhiana', 'Jalandhar'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
  Sikkim: ['Gangtok', 'Namchi'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
  Telangana: ['Hyderabad', 'Warangal', 'Nizamabad'],
  Tripura: ['Agartala', 'Udaipur'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Nainital'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
  Delhi: ['New Delhi', 'Dwarka', 'Rohini'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu'],
  Ladakh: ['Leh', 'Kargil'],
  Puducherry: ['Puducherry', 'Karaikal'],
};
const ALL_STATES = Object.keys(indianCitiesByState).sort();

// ── Shared OTP Modal ──────────────────────────────────────────────────────────
function OtpModal({ title, subtitle, onVerify, onResend, onClose }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
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
    if (e.key === 'Backspace' && !digits[i] && i > 0)
      refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    const updated = [...digits];
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setDigits(updated);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const submit = async () => {
    const code = digits.join('');
    if (code.length < 6) return;
    setVerifying(true);
    try {
      await onVerify(code);
    } catch {
      setDigits(['', '', '', '', '', '']);
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
      setDigits(['', '', '', '', '', '']);
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
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0d1526',
          border: '1px solid #1e3a5f',
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
            color: '#f1f5f9',
            textAlign: 'center',
            marginBottom: 6,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 12,
            color: '#64748b',
            textAlign: 'center',
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>

        {/* OTP boxes */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
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
                textAlign: 'center',
                fontSize: 20,
                fontWeight: 700,
                color: '#f1f5f9',
                borderRadius: 10,
                outline: 'none',
                transition: 'all 0.15s',
                background: d
                  ? 'rgba(124,58,237,0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: d
                  ? '1px solid rgba(167,139,250,0.6)'
                  : '1px solid rgba(255,255,255,0.1)',
                boxShadow: d ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
              }}
            />
          ))}
        </div>

        <button
          onClick={submit}
          disabled={isBusy || digits.join('').length < 6}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 12,
            border: 'none',
            fontWeight: 700,
            fontSize: 14,
            cursor:
              isBusy || digits.join('').length < 6 ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            color: '#fff',
            opacity: isBusy || digits.join('').length < 6 ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {verifying ? (
            <>
              <svg
                style={{ animation: 'spin 0.8s linear infinite' }}
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
              Verifying…
            </>
          ) : (
            'Verify Code'
          )}
        </button>

        <div
          style={{
            textAlign: 'center',
            marginTop: 14,
            fontSize: 12,
            color: '#475569',
          }}
        >
          {cooldown > 0 ? (
            <>
              Resend in{' '}
              <span style={{ color: '#a78bfa', fontWeight: 600 }}>
                {cooldown}s
              </span>
            </>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                background: 'none',
                border: 'none',
                color: '#a78bfa',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {resending ? 'Sending…' : 'Resend OTP'}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            display: 'block',
            margin: '12px auto 0',
            background: 'none',
            border: 'none',
            color: '#475569',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
const InstructorSettings = ({ showToast }) => {
  const dispatch = useDispatch();
  const { profile: userProfile } = useSelector((state) => state.settings);
  const { user } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    city: '',
    state: '',
    avatarUrl: '',
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    liveSessionAlerts: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Email change state ──
  const [emailForm, setEmailForm] = useState({ newEmail: '' });
  const [emailStep, setEmailStep] = useState('idle'); // idle | sending | otp | done
  const [emailMsg, setEmailMsg] = useState({ text: '', ok: false });
  const [showEmailOtp, setShowEmailOtp] = useState(false);

  // ── Phone change state ──
  const [phoneForm, setPhoneForm] = useState({ newPhone: '' });
  const [phoneStep, setPhoneStep] = useState('idle'); // idle | sending | otp | done
  const [phoneMsg, setPhoneMsg] = useState({ text: '', ok: false });
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);

  // ── Password change state ──
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwMsg, setPwMsg] = useState({ text: '', ok: false });
  const [showPwOtp, setShowPwOtp] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        avatarUrl: userProfile.avatarUrl || '',
      });
      if (userProfile.notificationSettings) {
        setNotifications({
          emailNotifications:
            userProfile.notificationSettings.emailNotifications ?? true,
          liveSessionAlerts:
            userProfile.notificationSettings.liveSessionAlerts ?? true,
        });
      }
    }
  }, [userProfile]);

  const cityOptions = indianCitiesByState[profile.state] || [];

  // ── Profile save (name, city, state only — email & phone have own flows) ──
  const saveProfile = async () => {
    try {
      await dispatch(
        updateProfile({ ...profile, notificationSettings: notifications })
      ).unwrap();
      setSaved(true);
      showToast('Profile saved ✓');
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      showToast('Failed to save profile');
    }
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        avatarUrl: userProfile.avatarUrl || '',
      });
    }
    setIsEditing(false);
  };

  // ── Avatar ──
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'instructor-avatars');
    setUploading(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newAvatarUrl = data.url;
      setProfile((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
      await dispatch(
        updateProfile({
          ...profile,
          avatarUrl: newAvatarUrl,
          notificationSettings: notifications,
        })
      ).unwrap();
      showToast('Avatar updated ✓');
    } catch {
      showToast('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setProfile((prev) => ({ ...prev, avatarUrl: '' }));
    try {
      await dispatch(
        updateProfile({
          ...profile,
          avatarUrl: '',
          notificationSettings: notifications,
        })
      ).unwrap();
      showToast('Avatar removed ✓');
    } catch {
      showToast('Failed to remove avatar');
    }
  };

  // ── Email change ──
  const sendEmailOtp = async () => {
    if (!emailForm.newEmail) {
      setEmailMsg({ text: 'Enter a new email address', ok: false });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail)) {
      setEmailMsg({ text: 'Enter a valid email address', ok: false });
      return;
    }
    if (emailForm.newEmail === profile.email) {
      setEmailMsg({
        text: 'New email is the same as current email',
        ok: false,
      });
      return;
    }
    setEmailStep('sending');
    try {
      await api.post('/settings/send-email-otp', {
        newEmail: emailForm.newEmail,
      });
      setEmailStep('otp');
      setShowEmailOtp(true);
      setEmailMsg({ text: '', ok: false });
    } catch (err) {
      setEmailMsg({
        text: err.response?.data?.message || 'Failed to send OTP',
        ok: false,
      });
      setEmailStep('idle');
    }
  };

  const verifyEmailOtp = async (code) => {
    try {
      await api.post('/settings/verify-email-otp', {
        newEmail: emailForm.newEmail,
        otp: code,
      });
      await dispatch(
        updateProfile({
          ...profile,
          email: emailForm.newEmail,
          notificationSettings: notifications,
        })
      ).unwrap();
      setProfile((prev) => ({ ...prev, email: emailForm.newEmail }));
      setEmailForm({ newEmail: '' });
      setEmailStep('done');
      setShowEmailOtp(false);
      setEmailMsg({ text: 'Email updated successfully ✓', ok: true });
      showToast('Email updated ✓');
      setTimeout(() => setEmailMsg({ text: '', ok: false }), 5000);
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Invalid OTP', {
        cause: err,
      });
    }
  };

  // ── Phone change ──
  const normalizeIndianPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (/^\d{10}$/.test(digits)) return `+91${digits}`;
    if (/^91\d{10}$/.test(digits)) return `+${digits}`;
    return null;
  };

  const sendPhoneOtp = async () => {
    const e164 = normalizeIndianPhoneNumber(phoneForm.newPhone);
    if (!e164) {
      setPhoneMsg({
        text: 'Only Indian mobile numbers are supported for OTP',
        ok: false,
      });
      return;
    }
    if (e164 === profile.phoneNumber) {
      setPhoneMsg({
        text: 'New number is the same as current number',
        ok: false,
      });
      return;
    }
    setPhoneStep('sending');
    try {
      await api.post('/auth/send-phone-otp', { phoneNumber: e164 });
      setPhoneStep('otp');
      setShowPhoneOtp(true);
      setPhoneMsg({ text: '', ok: false });
    } catch (err) {
      setPhoneMsg({
        text: err.response?.data?.message || 'Failed to send OTP',
        ok: false,
      });
      setPhoneStep('idle');
    }
  };

  const verifyPhoneOtp = async (code) => {
    const e164 = normalizeIndianPhoneNumber(phoneForm.newPhone);
    if (!e164) {
      throw new Error('Only Indian mobile numbers are supported for OTP');
    }
    try {
      await api.post('/auth/verify-phone-otp', {
        phoneNumber: e164,
        otp: code,
      });
      await dispatch(
        updateProfile({
          ...profile,
          phoneNumber: e164,
          notificationSettings: notifications,
        })
      ).unwrap();
      setProfile((prev) => ({ ...prev, phoneNumber: e164 }));
      setPhoneForm({ newPhone: '' });
      setPhoneStep('done');
      setShowPhoneOtp(false);
      setPhoneMsg({ text: 'Phone number updated successfully ✓', ok: true });
      showToast('Phone number updated ✓');
      setTimeout(() => setPhoneMsg({ text: '', ok: false }), 5000);
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Invalid OTP');
    }
  };

  // ── Password change ──
  const validatePw = () => {
    const errs = {};
    if (!pwForm.current) errs.current = 'Enter your current password';
    if (!pwForm.next) errs.next = 'Enter a new password';
    else if (pwForm.next.length < 8)
      errs.next = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(pwForm.next))
      errs.next = 'Must contain at least one uppercase letter';
    else if (!/[0-9]/.test(pwForm.next))
      errs.next = 'Must contain at least one number';
    if (!pwForm.confirm) errs.confirm = 'Confirm your new password';
    else if (pwForm.next !== pwForm.confirm)
      errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const sendPasswordOtp = async () => {
    if (!validatePw()) return;
    try {
      await api.post('/settings/send-password-otp');
      setShowPwOtp(true);
      setPwMsg({ text: '', ok: false });
    } catch (err) {
      setPwMsg({
        text: err.response?.data?.message || 'Failed to send OTP',
        ok: false,
      });
    }
  };

  const verifyPasswordOtp = async (code) => {
    try {
      await api.post('/settings/verify-password-otp', { otp: code });
      await api.put('/settings/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      setPwMsg({ text: 'Password changed successfully ✓', ok: true });
      setPwForm({ current: '', next: '', confirm: '' });
      setPwErrors({});
      setShowPwOtp(false);
      showToast('Password changed ✓');
      setTimeout(() => setPwMsg({ text: '', ok: false }), 5000);
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Invalid OTP');
    }
  };

  // ── Notifications ──
  const toggleNotif = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      await dispatch(
        updateProfile({ ...profile, notificationSettings: updated })
      ).unwrap();
      showToast('Preferences updated ✓');
    } catch {
      console.error('Failed to update notification settings');
    }
  };

  // ── Delete account ──
  const deleteAccount = async () => {
    if (
      window.confirm(
        'WARNING: Are you sure you want to delete your account? This will permanently delete all your data, courses, and records. This action cannot be undone.'
      )
    ) {
      try {
        await api.delete(`/users/${user?._id ?? user?.id}`);
        await dispatch(logoutUser()).unwrap();
        window.location.href = '/';
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete account');
      }
    }
  };

  // ── Styles ──
  const labelStyle = {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 600,
    marginBottom: 5,
    display: 'block',
  };
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 10,
    color: '#f1f5f9',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  };
  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  };
  const errStyle = { fontSize: 11, color: '#f87171', marginTop: 4 };

  const sendOtpBtnStyle = (disabled) => ({
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    fontWeight: 700,
    fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
    color: '#fff',
    opacity: disabled ? 0.6 : 1,
    whiteSpace: 'nowrap',
  });

  const pwStrength = () => {
    const p = pwForm.next;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const levels = [
      { label: 'Weak', color: '#ef4444' },
      { label: 'Fair', color: '#f97316' },
      { label: 'Good', color: '#eab308' },
      { label: 'Strong', color: '#22c55e' },
    ];
    return { score, ...levels[score - 1] };
  };
  const strength = pwStrength();

  return (
    <>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ── Profile Card ── */}
        <Card>
          <SectionHeader title="Profile Settings" />

          {/* Avatar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 20,
            }}
          >
            <img
              src={
                profile.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Instructor')}&background=7c3aed&color=fff&size=128`
              }
              alt={profile.name}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #334155',
              }}
            />
            {isEditing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label
                  style={{
                    padding: '6px 14px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {uploading ? 'Uploading…' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                </label>
                {profile.avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    style={{
                      padding: '6px 14px',
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Name (editable) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Display name</label>
              <input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                style={inputStyle}
                disabled={!isEditing}
              />
            </div>
            {/* Phone — read-only here; changed via the dedicated card below */}
            <div>
              <label style={labelStyle}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={profile.phoneNumber}
                  readOnly
                  style={{
                    ...inputStyle,
                    paddingRight: 90,
                    color: '#94a3b8',
                    cursor: 'default',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 10,
                    color: '#64748b',
                    background: '#0f172a',
                    padding: '2px 6px',
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Change below
                </span>
              </div>
            </div>
          </div>

          {/* State + City */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={labelStyle}>State</label>
              <select
                value={profile.state}
                onChange={(e) =>
                  setProfile({ ...profile, state: e.target.value, city: '' })
                }
                disabled={!isEditing}
                style={{ ...selectStyle, opacity: !isEditing ? 0.6 : 1 }}
              >
                <option value="">Select state</option>
                {ALL_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>City</label>
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
                    !isEditing || !profile.state ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="">
                  {profile.state ? 'Select city' : 'Choose a state first'}
                </option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isEditing ? (
            <Btn variant="ghost" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Btn>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="primary" onClick={saveProfile}>
                {saved ? '✓ Saved!' : 'Save Changes'}
              </Btn>
              <Btn variant="ghost" onClick={handleCancelEdit}>
                Cancel
              </Btn>
            </div>
          )}
        </Card>

        {/* ── Change Email Card ── */}
        <Card>
          <SectionHeader title="Change Email" />
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
            Current email:{' '}
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>
              {profile.email}
            </span>
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 10,
              alignItems: 'flex-end',
              marginBottom: 10,
            }}
          >
            <div>
              <label style={labelStyle}>New email address</label>
              <input
                type="email"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm({ newEmail: e.target.value })}
                placeholder="Enter new email"
                style={inputStyle}
                disabled={emailStep === 'sending'}
              />
            </div>
            <button
              onClick={sendEmailOtp}
              disabled={emailStep === 'sending' || !emailForm.newEmail}
              style={sendOtpBtnStyle(
                emailStep === 'sending' || !emailForm.newEmail
              )}
            >
              {emailStep === 'sending' ? 'Sending…' : 'Send OTP'}
            </button>
          </div>

          {emailMsg.text && (
            <p
              style={{
                fontSize: 12,
                color: emailMsg.ok ? '#4ade80' : '#f87171',
                marginTop: 4,
              }}
            >
              {emailMsg.text}
            </p>
          )}
        </Card>

        {/* ── Change Phone Card ── */}
        <Card>
          <SectionHeader title="Change Phone Number" />
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
            Current number:{' '}
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>
              {profile.phoneNumber || '—'}
            </span>
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 10,
              alignItems: 'flex-end',
              marginBottom: 10,
            }}
          >
            <div>
              <label style={labelStyle}>New phone number</label>
              <input
                type="tel"
                value={phoneForm.newPhone}
                onChange={(e) => {
                  setPhoneForm({ newPhone: e.target.value });
                  if (phoneMsg.text) setPhoneMsg({ text: '', ok: false });
                }}
                placeholder="+91 98765 43210"
                style={inputStyle}
                disabled={phoneStep === 'sending'}
              />
            </div>
            <button
              onClick={sendPhoneOtp}
              disabled={phoneStep === 'sending' || !phoneForm.newPhone}
              style={sendOtpBtnStyle(
                phoneStep === 'sending' || !phoneForm.newPhone
              )}
            >
              {phoneStep === 'sending' ? 'Sending…' : 'Send OTP'}
            </button>
          </div>

          {phoneMsg.text && (
            <p
              style={{
                fontSize: 12,
                color: phoneMsg.ok ? '#4ade80' : '#f87171',
                marginTop: 4,
              }}
            >
              {phoneMsg.text}
            </p>
          )}
        </Card>

        {/* ── Change Password Card ── */}
        <Card>
          <SectionHeader title="Change Password" />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 14,
              marginBottom: 6,
            }}
          >
            <div>
              <label style={labelStyle}>Current password</label>
              <input
                type="password"
                value={pwForm.current}
                onChange={(e) => {
                  setPwForm({ ...pwForm, current: e.target.value });
                  setPwErrors({ ...pwErrors, current: '' });
                }}
                style={{
                  ...inputStyle,
                  borderColor: pwErrors.current ? '#f87171' : '#334155',
                }}
                placeholder="••••••••"
              />
              {pwErrors.current && <p style={errStyle}>{pwErrors.current}</p>}
            </div>
            <div>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                value={pwForm.next}
                onChange={(e) => {
                  setPwForm({ ...pwForm, next: e.target.value });
                  setPwErrors({ ...pwErrors, next: '' });
                }}
                style={{
                  ...inputStyle,
                  borderColor: pwErrors.next ? '#f87171' : '#334155',
                }}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
              />
              {pwErrors.next && <p style={errStyle}>{pwErrors.next}</p>}
              {strength && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 4,
                          background:
                            i <= strength.score ? strength.color : '#1e293b',
                          transition: 'background 0.2s',
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: strength.color,
                      fontWeight: 600,
                    }}
                  >
                    {strength.label}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Confirm new password</label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => {
                  setPwForm({ ...pwForm, confirm: e.target.value });
                  setPwErrors({ ...pwErrors, confirm: '' });
                }}
                style={{
                  ...inputStyle,
                  borderColor: pwErrors.confirm ? '#f87171' : '#334155',
                }}
                placeholder="Repeat password"
              />
              {pwErrors.confirm && <p style={errStyle}>{pwErrors.confirm}</p>}
              {pwForm.confirm &&
                !pwErrors.confirm &&
                pwForm.next === pwForm.confirm && (
                  <p style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>
                    ✓ Passwords match
                  </p>
                )}
            </div>
          </div>

          {pwMsg.text && (
            <p
              style={{
                fontSize: 12,
                color: pwMsg.ok ? '#4ade80' : '#f87171',
                marginBottom: 10,
              }}
            >
              {pwMsg.text}
            </p>
          )}

          <button
            onClick={sendPasswordOtp}
            style={{
              padding: '9px 20px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 10,
              color: '#f1f5f9',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Update Password
          </button>
        </Card>

        {/* ── Notification Preferences ── */}
        <Card>
          <SectionHeader title="Notification Preferences" />
          {[
            {
              key: 'emailNotifications',
              label: 'Email notifications',
              desc: 'Get notified of enrollments, student queries and course reviews',
            },
            {
              key: 'liveSessionAlerts',
              label: 'Live session alerts',
              desc: 'Reminder 1 hour before each scheduled live session',
            },
          ].map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}
                >
                  {s.label}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {s.desc}
                </div>
              </div>
              <button
                onClick={() => toggleNotif(s.key)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: notifications[s.key] ? '#7c3aed' : '#334155',
                  position: 'relative',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: notifications[s.key] ? 'calc(100% - 19px)' : 3,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>
          ))}
        </Card>

        {/* ── Danger Zone ── */}
        <Card>
          <SectionHeader title="Danger Zone" />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f87171' }}>
                Delete account
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Permanently deletes all your data and published courses. Cannot
                be undone.
              </div>
            </div>
            <button
              onClick={deleteAccount}
              style={{
                padding: '8px 16px',
                background: '#450a0a',
                border: '1px solid #7f1d1d',
                borderRadius: 10,
                color: '#f87171',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Delete Account
            </button>
          </div>
        </Card>
      </div>

      {/* ── Email OTP Modal ── */}
      {showEmailOtp && (
        <OtpModal
          title="Verify New Email"
          subtitle={`Enter the 6-digit code sent to ${emailForm.newEmail}`}
          onVerify={verifyEmailOtp}
          onResend={sendEmailOtp}
          onClose={() => {
            setShowEmailOtp(false);
            setEmailStep('idle');
          }}
        />
      )}

      {/* ── Phone OTP Modal ── */}
      {showPhoneOtp && (
        <OtpModal
          title="Verify New Phone Number"
          subtitle={`Enter the 6-digit code sent via SMS to ${phoneForm.newPhone}`}
          onVerify={verifyPhoneOtp}
          onResend={sendPhoneOtp}
          onClose={() => {
            setShowPhoneOtp(false);
            setPhoneStep('idle');
          }}
        />
      )}

      {/* ── Password OTP Modal ── */}
      {showPwOtp && (
        <OtpModal
          title="Verify Password Change"
          subtitle={`Enter the 6-digit code sent to ${profile.email} to confirm this change`}
          onVerify={verifyPasswordOtp}
          onResend={() => api.post('/settings/send-password-otp')}
          onClose={() => setShowPwOtp(false)}
        />
      )}
    </>
  );
};

export default InstructorSettings;
