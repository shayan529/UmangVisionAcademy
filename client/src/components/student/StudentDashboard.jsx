import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchLeaderboard,
  fetchStudentActivity,
} from "../../redux/slices/studentSlice";
import { fetchSessions } from "../../redux/slices/sessionSlice";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { fetchSubscription } from "../../redux/slices/billingSlice";
import { fetchProfile, updateProfile } from "../../redux/slices/settingsSlice";
import api from "../../config/api";
import { useState } from "react";
import {
  X,
  Menu,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  TrendingUp,
  Trophy,
  FileText,
  BookMarked,
  GraduationCap,
  KeyRound,
  Zap,
  UserRound,
  Loader2,
} from "lucide-react";
import { setSelectedClass } from "../../redux/slices/authSlice";
import CourseFloatingAI from "../course/CourseFloatingAI.jsx";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getOverallProgress = (courses = []) => {
  if (!courses.length) return 0;
  const total = courses.reduce((sum, c) => sum + (c.progress ?? 0), 0);
  return Math.round(total / courses.length);
};

const getLeaderboardRank = (students = [], currentUserId) => {
  if (!students.length || !currentUserId) return null;
  const sorted = [...students].sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0));
  const rank = sorted.findIndex(
    (s) => s._id === currentUserId || s.id === currentUserId,
  );
  return rank === -1 ? null : rank + 1;
};

const formatActivityTime = (dateStr, t) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t("studentDashboard.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("studentDashboard.hoursAgo", { count: hrs });
  return t("studentDashboard.daysAgo", { count: Math.floor(hrs / 24) });
};

const activityMeta = {
  quiz: { icon: FileText, color: "#818cf8", label: "Quiz" },
  lesson: { icon: BookOpen, color: "#22d3ee", label: "Lesson" },
  course: { icon: GraduationCap, color: "#f472b6", label: "Course" },
  login: { icon: KeyRound, color: "#34d399", label: "Login" },
  default: { icon: Zap, color: "#fb923c", label: "Activity" },
};

const getActivityMeta = (type = "") =>
  activityMeta[type.toLowerCase()] ?? activityMeta.default;

const Skeleton = ({ className = "" }) => (
  <div
    className={`rounded-lg bg-gradient-to-r from-slate-800 via-slate-700/60 to-slate-800 bg-[length:200%_100%] animate-shimmer ${className}`}
  />
);

const studentDetailsDefaults = {
  fatherName: "",
  motherName: "",
  fullAddress: "",
  socialMediaAccount: "",
  fatherMobileNumber: "",
  reference: "",
  vidhansabha: "",
};

// ── Check if student details are empty (to auto-show on login) ────────────────
const isStudentDetailsEmpty = (profile) => {
  if (!profile) return false;
  const fields = [
    "fatherName",
    "motherName",
    "fullAddress",
    "fatherMobileNumber",
  ];
  return fields.every((f) => !profile[f]);
};

const SESSION_KEY = "student_details_prompted";

// ── Student Details Modal ──────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/15";
const labelCls =
  "text-[11px] font-semibold uppercase tracking-wider text-slate-400";

const StudentDetailsFormModal = ({
  open,
  form,
  onChange,
  onClose,
  onSubmit,
  saving,
  references = [],
  referencesLoading = false,
  isAutoPrompt = false,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  const fields = [
    {
      key: "fatherName",
      label: t("studentSettings.fatherName", "Father's name"),
      placeholder: t("studentSettings.fatherNamePlaceholder", "Enter father's name"),
    },
    {
      key: "motherName",
      label: t("studentSettings.motherName", "Mother's name"),
      placeholder: t("studentSettings.motherNamePlaceholder", "Enter mother's name"),
    },
    {
      key: "fatherMobileNumber",
      label: t("studentSettings.parentMobile", "Parent's mobile"),
      placeholder: t("studentSettings.parentMobilePlaceholder", "e.g. 9876543210"),
    },
    {
      key: "socialMediaAccount",
      label: t("studentSettings.socialMediaAccount", "Social media account"),
      placeholder: t("studentSettings.socialMediaPlaceholder", "Instagram / Facebook URL"),
    },
    {
      key: "vidhansabha",
      label: t("studentSettings.vidhansabha", "Vidhansabha"),
      placeholder: t("studentSettings.vidhansabhaPlaceholder", "Enter vidhansabha"),
    },
  ];

  const hasCurrentReference =
    !!form.reference &&
    !references.some((item) => item.name === form.reference);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-details-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1424] shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 bg-slate-900/60 px-6 py-5">
          <div>
            <div className="mb-1.5 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                <UserRound size={16} strokeWidth={2.25} />
              </span>
              <h3
                id="student-details-title"
                className="text-[17px] font-bold text-slate-50"
              >
                {t("studentDetailsModal.title", "Student details")}
              </h3>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-400">
              {isAutoPrompt
                ? t(
                  "studentDetailsModal.completeProfile",
                  "Complete your profile to help us serve you better.",
                )
                : t(
                  "studentDetailsModal.fieldsOptional",
                  "All fields are optional. You can update them anytime.",
                )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("studentSettings.cancel", "Cancel")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className={labelCls} htmlFor={`sdf-${key}`}>
                  {label}
                </label>
                <input
                  id={`sdf-${key}`}
                  value={form[key] ?? ""}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={placeholder}
                  className={inputCls}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="sdf-reference">
              {t("studentSettings.reference", "Reference")}
            </label>
            <select
              id="sdf-reference"
              value={form.reference ?? ""}
              onChange={(e) => onChange("reference", e.target.value)}
              className={inputCls}
            >
              <option value="">
                {referencesLoading
                  ? t("studentSettings.loadingReferences", "Loading references...")
                  : t("studentSettings.selectReference", "Select reference")}
              </option>
              {hasCurrentReference && (
                <option value={form.reference}>{form.reference}</option>
              )}
              {references.map((item) => (
                <option key={item._id ?? item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="sdf-address">
              {t("studentSettings.fullAddress", "Full address")}
            </label>
            <textarea
              id="sdf-address"
              rows={3}
              value={form.fullAddress ?? ""}
              onChange={(e) => onChange("fullAddress", e.target.value)}
              placeholder={t(
                "studentSettings.fullAddressPlaceholder",
                "House no., street, city, state, pincode",
              )}
              className={`${inputCls} resize-none font-sans`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-800 bg-[#0d1424] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-[13px] font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAutoPrompt
              ? t("studentDetailsModal.skipForNow", "Skip for now")
              : t("studentSettings.cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving
              ? t("studentDetailsModal.saving", "Saving...")
              : t("studentDetailsModal.saveDetails", "Save details")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ── DashboardHome ─────────────────────────────────────────────────────────────
export const DashboardHome = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { profile: settingsProfile } = useSelector((s) => s.settings);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [isAutoPrompt, setIsAutoPrompt] = useState(false);
  const [savingStudentDetails, setSavingStudentDetails] = useState(false);
  const [references, setReferences] = useState([]);
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [studentDetailsForm, setStudentDetailsForm] = useState(
    studentDetailsDefaults,
  );

  const {
    leaderboard: students,
    activity,
    leaderboardLoading: studentsLoading,
    activityLoading,
  } = useSelector((s) => s.students);
  const { t } = useTranslation();

  useEffect(() => {
    dispatch(fetchSubscription());
    dispatch(fetchSessions());
    dispatch(fetchLeaderboard());
    dispatch(fetchStudentActivity());
    dispatch(fetchProfile());
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

  // ── Auto-prompt once per login session ──
  useEffect(() => {
    if (!settingsProfile) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (isStudentDetailsEmpty(settingsProfile)) {
      setIsAutoPrompt(true);
      setShowStudentDetailsModal(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  }, [settingsProfile]);

  // ── Sync form with loaded profile ──
  useEffect(() => {
    if (!settingsProfile) return;
    setStudentDetailsForm({
      fatherName: settingsProfile.fatherName ?? "",
      motherName: settingsProfile.motherName ?? "",
      fullAddress: settingsProfile.fullAddress ?? "",
      socialMediaAccount: settingsProfile.socialMediaAccount ?? "",
      fatherMobileNumber: settingsProfile.fatherMobileNumber ?? "",
      reference: settingsProfile.reference ?? "",
      vidhansabha: settingsProfile.vidhansabha ?? "",
    });
  }, [settingsProfile]);

  // ── Lock body scroll while the student details modal is open ──
  useEffect(() => {
    if (showStudentDetailsModal) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [showStudentDetailsModal]);

  const enrolledCourses = useSelector(
    (s) => s.courses?.enrolled ?? s.myCourses?.courses ?? [],
  );
  const coursesLoading = useSelector(
    (s) => s.courses?.enrolledLoading ?? s.myCourses?.loading ?? false,
  );

  const username = user?.email ? user.email.split("@")[0] : "User";
  const userId = user?._id ?? user?.id;

  const overallProgress = getOverallProgress(enrolledCourses);
  const rank = getLeaderboardRank(students, userId);
  const recentActivity = [...(activity ?? [])].slice(0, 5);

  const handleStudentDetailChange = (key, value) => {
    setStudentDetailsForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleStudentDetailsSave = async () => {
    if (!settingsProfile) {
      toast.error("Profile not loaded yet. Please try again.");
      return;
    }
    setSavingStudentDetails(true);
    try {
      await dispatch(
        updateProfile({
          name: settingsProfile.name ?? user?.name ?? "",
          email: settingsProfile.email ?? user?.email ?? "",
          phoneNumber: settingsProfile.phoneNumber ?? user?.phoneNumber ?? "",
          city: settingsProfile.city ?? "",
          state: settingsProfile.state ?? "",
          avatarUrl: settingsProfile.avatarUrl ?? "",
          notificationSettings: settingsProfile.notificationSettings,
          ...studentDetailsForm,
        }),
      ).unwrap();
      toast.success("Student details saved");
      setShowStudentDetailsModal(false);
      setIsAutoPrompt(false);
    } catch (error) {
      toast.error(error?.message || "Failed to save student details");
    } finally {
      setSavingStudentDetails(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .animate-shimmer { animation: shimmer 1.4s infinite; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .dash-section { animation: fadeUp .4s cubic-bezier(.22,.61,.36,1) both; }
        .dash-section:nth-child(2) { animation-delay: .05s; }
        .dash-section:nth-child(3) { animation-delay: .1s; }
        .dash-section:nth-child(4) { animation-delay: .15s; }
        .progress-fill { transition: width .8s cubic-bezier(.4,0,.2,1); }
        @media (prefers-reduced-motion: reduce) {
          .dash-section, .progress-fill, .animate-shimmer { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="flex flex-col gap-7">
        {/* ── Hero ── */}
        <section className="dash-section relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1424] px-6 py-7 sm:px-8 sm:py-9">
          <div
            className="pointer-events-none absolute -top-24 right-[-10%] h-64 w-64 rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 left-[10%] h-56 w-56 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl">
              <p className="mb-2 text-sm font-semibold tracking-wide text-indigo-400">
                {t("studentDashboard.welcomeBack", { name: username })}
              </p>
              <h1 className="text-[clamp(26px,4vw,40px)] font-extrabold leading-tight text-slate-50">
                {t("studentDashboard.studentDashboardTitle")}
              </h1>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-slate-400">
                {t("studentDashboard.heroDescription")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsAutoPrompt(false);
                  setShowStudentDetailsModal(true);
                }}
                className="whitespace-nowrap rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-[13px] font-bold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800"
              >
                {t("studentDashboard.addCompleteDetails")}
              </button>
              <Link to="my-courses" className="no-underline">
                <button className="group flex items-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:-translate-y-0.5">
                  {t("studentDashboard.continueLearning")}
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stat cards ── */}
        <div className="dash-section grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <StatCard
            loading={coursesLoading}
            icon={BookMarked}
            iconColor="#818cf8"
            value={enrolledCourses.length || "—"}
            label={t("studentDashboard.enrolledCourses")}
          />
          <StatCard
            loading={coursesLoading}
            icon={TrendingUp}
            iconColor="#22d3ee"
            value={enrolledCourses.length ? `${overallProgress}%` : "—"}
            label={t("studentDashboard.overallProgress")}
            extra={
              enrolledCourses.length > 0 && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="progress-fill h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              )
            }
          />
          <StatCard
            loading={studentsLoading}
            icon={Trophy}
            iconColor="#f472b6"
            value={rank ? `#${rank}` : "—"}
            label={t("studentDashboard.leaderboardRank")}
          />
        </div>

        {/* ── Activity ── */}
        <div className="dash-section grid grid-cols-1 gap-3.5">
          <div className="rounded-2xl border border-slate-800 bg-[#0d1424] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-slate-100">
                {t("studentDashboard.recentActivity")}
              </h3>
              <Link
                to="my-courses"
                className="flex items-center gap-1 text-xs font-semibold text-indigo-400 no-underline transition-colors hover:text-indigo-300"
              >
                {t("studentDashboard.viewAll")}
                <ArrowUpRight size={13} />
              </Link>
            </div>

            {activityLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 shrink-0 !rounded-xl" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Zap size={20} className="text-slate-700" />
                <p className="text-[13px] text-slate-500">
                  No recent activity yet.
                  <br />
                  Start a course to see your progress here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-800/70">
                {recentActivity.map((item, i) => {
                  const meta = getActivityMeta(item.type);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={item._id ?? item.id ?? i}
                      className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-800/40"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `${meta.color}18`, color: meta.color }}
                      >
                        <Icon size={16} strokeWidth={2.25} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-200">
                          {item.title ??
                            item.description ??
                            item.action ??
                            meta.label}
                        </p>
                        {item.courseName && (
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {item.courseName}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-500">
                        {formatActivityTime(
                          item.createdAt ?? item.timestamp ?? item.date,
                          t,
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Course progress strip ── */}
        {(coursesLoading || enrolledCourses.length > 0) && (
          <section className="dash-section">
            <div className="mb-3.5 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-slate-100">
                {t("studentDashboard.courseProgress")}
              </h3>
              <Link
                to="my-courses"
                className="flex items-center gap-1 text-xs font-semibold text-indigo-400 no-underline transition-colors hover:text-indigo-300"
              >
                {t("studentDashboard.seeAll")}
                <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {coursesLoading
                ? [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-800 bg-[#0d1424] p-4"
                  >
                    <Skeleton className="mb-3 h-3.5 w-2/3" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                ))
                : enrolledCourses
                  .slice(0, 6)
                  .map((course, i) => (
                    <CourseProgressCard
                      key={course._id ?? course.id ?? i}
                      course={course}
                    />
                  ))}
            </div>
          </section>
        )}
      </div>

      <StudentDetailsFormModal
        open={showStudentDetailsModal}
        form={studentDetailsForm}
        onChange={handleStudentDetailChange}
        onClose={() => {
          setShowStudentDetailsModal(false);
          setIsAutoPrompt(false);
        }}
        onSubmit={handleStudentDetailsSave}
        saving={savingStudentDetails}
        references={references}
        referencesLoading={referencesLoading}
        isAutoPrompt={isAutoPrompt}
      />
    </>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const StatCard = ({ loading, icon: Icon, iconColor, value, label, extra }) => (
  <div className="rounded-2xl border border-slate-800 bg-[#0d1424] p-5 transition-colors hover:border-slate-700">
    {loading ? (
      <>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-2.5 h-3 w-2/3" />
      </>
    ) : (
      <>
        <div
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${iconColor}18`, color: iconColor }}
        >
          <Icon size={17} strokeWidth={2.25} />
        </div>
        <div className="text-[30px] font-extrabold leading-none text-slate-50">
          {value}
        </div>
        <div className="mt-2 text-[13px] text-slate-500">{label}</div>
        {extra}
      </>
    )}
  </div>
);

const CourseProgressCard = ({ course }) => {
  const progress = course.progress ?? 0;
  const title = course.title ?? course.name ?? "Untitled Course";
  const accent =
    progress === 100 ? "#34d399" : progress > 50 ? "#22d3ee" : "#818cf8";

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1424] p-4 transition-colors hover:border-slate-700">
      <p className="mb-3 truncate text-[13px] font-semibold text-slate-200">
        {title}
      </p>
      <div className="flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className="progress-fill h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg,${accent},${accent}99)`,
            }}
          />
        </div>
        <span
          className="shrink-0 text-xs font-bold"
          style={{ color: accent }}
        >
          {progress}%
        </span>
      </div>
    </div>
  );
};

// ── Main layout ───────────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const [selectingClass, setSelectingClass] = useState(false);

  const handleSelectClass = async (cls) => {
    setSelectingClass(true);
    try {
      const res = await fetch("/api/users/select-class", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ selectedClass: cls }),
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(setSelectedClass(cls));
        toast.success(`Successfully selected ${cls}! All courses unlocked.`);
      } else {
        toast.error(data.message || "Failed to select class.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSelectingClass(false);
    }
  };

  useEffect(() => {
    dispatch(fetchSubscription());
    dispatch(fetchSessions());
  }, [dispatch]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleNavbarMenuOpen = () => {
      setMobileOpen(false);
    };

    window.addEventListener("navbar-mobile-menu-open", handleNavbarMenuOpen);

    return () => {
      window.removeEventListener(
        "navbar-mobile-menu-open",
        handleNavbarMenuOpen,
      );
    };
  }, []);

  const sectionTitles = {
    "/student-dashboard": t("studentDashboard.dashboard"),
    "/student-dashboard/my-courses": t("studentDashboard.myCourses"),
    "/student-dashboard/ai-tutor": t("studentDashboard.aiTutor"),
    "/student-dashboard/community": t("studentDashboard.community"),
    "/student-dashboard/certificates": t("studentDashboard.certificates"),
    "/student-dashboard/achievements": t("studentSidebar.achievements"),
    "/student-dashboard/settings": t("studentDashboard.settings"),
    "/student-dashboard/leaderboard": t("studentDashboard.leaderboard"),
    "/student-dashboard/references": "References",
    "/student-dashboard/progress": t("studentDashboard.progress"),
    "/student-dashboard/wallet": t("studentDashboard.wallet"),
    "/student-dashboard/purchase-history": t(
      "studentDashboard.purchaseHistory",
    ),
  };

  const unreadCount = useSelector(
    (s) => s.notifications?.unread ?? s.notifications?.unreadCount ?? 0,
  );

  const pageTitle =
    sectionTitles[pathname] ??
    Object.entries(sectionTitles)
      .filter(
        ([path]) => pathname.startsWith(path) && path !== "/student-dashboard",
      )
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    "Dashboard";

  return (
    <div className="min-h-screen bg-[#0b1120] text-[#f1f5f9] md:flex">
      <Sidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <main
          className="flex-1 px-4 py-4 md:px-7 md:py-6"
          onClick={() => {
            if (mobileOpen) setMobileOpen(false);
          }}
        >
          {/* Mobile top bar */}
          <div className="flex items-center justify-between gap-4 pb-4 md:hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("dashboard-sidebar-open"));
                setMobileOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-slate-700"
            >
              <Menu size={15} />
              {t("studentDashboard.menu")}
            </button>
            <h2 className="flex-1 truncate text-center text-[15px] font-bold text-white">
              {pageTitle}
            </h2>
            {unreadCount > 0 && (
              <span className="shrink-0 rounded-full bg-indigo-500 px-2 py-0.5 text-[11px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip">
            <Outlet />
          </div>
        </main>
      </div>

      {user?.subscription?.status === "active" && !user?.selectedClass && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070b13]/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl sm:p-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
              <GraduationCap size={28} strokeWidth={2} />
            </div>
            <h3 className="text-xl font-extrabold text-white sm:text-2xl">
              Choose your class
            </h3>
            <p className="mt-2 mb-6 text-sm text-slate-400">
              Your Academy Access Plan is active! Select a class below to
              unlock all courses of that class.
            </p>
            <div className="flex flex-col gap-3">
              {["Class 9", "Class 10", "Class 11", "Class 12"].map((cls) => (
                <button
                  key={cls}
                  onClick={() => handleSelectClass(cls)}
                  disabled={selectingClass}
                  className="w-full cursor-pointer rounded-2xl border border-slate-700/60 bg-slate-800/50 py-3.5 text-sm font-bold text-slate-200 transition-all duration-200 hover:bg-indigo-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cls}
                </button>
              ))}
            </div>
            {selectingClass && (
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-indigo-400">
                <Loader2 size={13} className="animate-spin" />
                Unlocking your courses...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Floating AI Robot Assistant visible across Student Dashboard */}
      <CourseFloatingAI />
    </div>
  );
};

export default StudentDashboard;