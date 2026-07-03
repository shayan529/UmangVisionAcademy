import React, { useEffect } from "react";
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
import { X } from "lucide-react";
import { setSelectedClass } from "../../redux/slices/authSlice";

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
  quiz: { icon: "📝", color: "#818cf8", label: "Quiz" },
  lesson: { icon: "📖", color: "#22d3ee", label: "Lesson" },
  course: { icon: "🎓", color: "#f472b6", label: "Course" },
  login: { icon: "🔑", color: "#34d399", label: "Login" },
  default: { icon: "⚡", color: "#fb923c", label: "Activity" },
};

const getActivityMeta = (type = "") =>
  activityMeta[type.toLowerCase()] ?? activityMeta.default;

const Skeleton = ({ w = "100%", h = 18, radius = 8, style = {} }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: radius,
      background: "linear-gradient(90deg,#1e293b 25%,#263348 50%,#1e293b 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...style,
    }}
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

// ── Student Details Modal (cream theme) ───────────────────────────────────────
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
  if (!open) return null;

  const fields = [
    {
      key: "fatherName",
      label: t("studentSettings.fatherName", "Father's Name"),
      placeholder: t("studentSettings.fatherNamePlaceholder", "Enter father's name"),
    },
    {
      key: "motherName",
      label: t("studentSettings.motherName", "Mother's Name"),
      placeholder: t("studentSettings.motherNamePlaceholder", "Enter mother's name"),
    },
    {
      key: "fatherMobileNumber",
      label: t("studentSettings.fatherMobile", "Father's Mobile"),
      placeholder: t("studentSettings.fatherMobilePlaceholder", "e.g. 9876543210"),
    },
    {
      key: "socialMediaAccount",
      label: t("studentSettings.socialMedia", "Social Media"),
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(10,14,26,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{
          background: "#fdf8f0",
          borderRadius: 20,
          border: "1px solid #e8d9c0",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "24px 24px 16px",
            borderBottom: "1px solid #e8d9c0",
            background: "#faf3e8",
            borderRadius: "20px 20px 0 0",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 22 }}>📋</span>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#3b2a14",
                  margin: 0,
                }}
              >
                {t("studentDetailsModal.title", "Student Details")}
              </h3>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#8a6a3a",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {isAutoPrompt
                ? t("studentDetailsModal.completeProfile", "Complete your profile to help us serve you better.")
                : t("studentDetailsModal.fieldsOptional", "All fields are optional. You can update them anytime.")}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#ede3d4",
              border: "none",
              borderRadius: 10,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#8a6a3a",
              flexShrink: 0,
              marginLeft: 12,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e0d0bb";
              e.currentTarget.style.color = "#3b2a14";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ede3d4";
              e.currentTarget.style.color = "#8a6a3a";
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {fields.map(({ key, label, placeholder }) => (
              <div
                key={key}
                style={{ display: "flex", flexDirection: "column", gap: 5 }}
              >
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#8a6a3a",
                  }}
                >
                  {label}
                </label>
                <input
                  value={form[key] ?? ""}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={placeholder}
                  style={{
                    background: "#fff8ed",
                    border: "1px solid #d9c4a0",
                    borderRadius: 10,
                    padding: "9px 12px",
                    fontSize: 13,
                    color: "#3b2a14",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid #c49a4a";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(196,154,74,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid #d9c4a0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#8a6a3a",
              }}
            >
              {t("studentSettings.reference", "Reference")}
            </label>
            <select
              value={form.reference ?? ""}
              onChange={(e) => onChange("reference", e.target.value)}
              style={{
                background: "#fff8ed",
                border: "1px solid #d9c4a0",
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 13,
                color: "#3b2a14",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid #c49a4a";
                e.target.style.boxShadow = "0 0 0 3px rgba(196,154,74,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid #d9c4a0";
                e.target.style.boxShadow = "none";
              }}
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

          {/* Address full-width */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#8a6a3a",
              }}
            >
              {t("studentSettings.fullAddress", "Full Address")}
            </label>
            <textarea
              rows={3}
              value={form.fullAddress ?? ""}
              onChange={(e) => onChange("fullAddress", e.target.value)}
              placeholder={t("studentSettings.fullAddressPlaceholder", "House no., street, city, state, pincode")}
              style={{
                background: "#fff8ed",
                border: "1px solid #d9c4a0",
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 13,
                color: "#3b2a14",
                outline: "none",
                resize: "none",
                width: "100%",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid #c49a4a";
                e.target.style.boxShadow = "0 0 0 3px rgba(196,154,74,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid #d9c4a0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "14px 24px 22px",
            borderTop: "1px solid #e8d9c0",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              background: "transparent",
              border: "1px solid #d9c4a0",
              borderRadius: 10,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 600,
              color: "#8a6a3a",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {isAutoPrompt
              ? t("studentDetailsModal.skipForNow", "Skip for now")
              : t("studentSettings.cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, #c49a4a, #a67c35)",
              border: "none",
              borderRadius: 10,
              padding: "9px 22px",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(196,154,74,0.35)",
            }}
          >
            {saving && (
              <span
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  animation: "spin 0.7s linear infinite",
                  display: "inline-block",
                }}
              />
            )}
            {saving ? t("studentDetailsModal.saving", "Saving...") : t("studentDetailsModal.saveDetails", "Save Details")}
          </button>
        </div>
      </div>
    </div>
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
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-section { animation: fadeUp 0.35s ease both; }
        .dash-section:nth-child(2) { animation-delay: 0.05s; }
        .dash-section:nth-child(3) { animation-delay: 0.1s; }
        .dash-section:nth-child(4) { animation-delay: 0.15s; }
        .activity-row:hover { background: #1e293b !important; }
        .progress-bar-fill { transition: width 0.9s cubic-bezier(.4,0,.2,1); }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* ── Hero ── */}
        <section
          className="dash-section"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                color: "#818cf8",
                fontWeight: 500,
                fontSize: 14,
                marginBottom: 6,
              }}
            >
              {t("studentDashboard.welcomeBack", { name: username })}
            </p>
            <h1
              style={{
                fontSize: "clamp(28px,4vw,42px)",
                fontWeight: 800,
                color: "#f1f5f9",
                lineHeight: 1.2,
              }}
            >
              {t("studentDashboard.studentDashboardTitle")}
            </h1>
            <p
              style={{
                color: "#64748b",
                marginTop: 10,
                maxWidth: 500,
                lineHeight: 1.7,
                fontSize: 14,
              }}
            >
              {t("studentDashboard.heroDescription")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                setIsAutoPrompt(false);
                setShowStudentDetailsModal(true);
              }}
              style={{
                background: "#1e293b",
                color: "#e2e8f0",
                border: "1px solid #334155",
                borderRadius: 14,
                padding: "12px 16px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t("studentDashboard.addCompleteDetails")}
            </button>
            <Link
              to="my-courses"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              <button
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 14,
                  padding: "12px 24px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(124,58,237,.35)",
                  whiteSpace: "nowrap",
                }}
              >
                {t("studentDashboard.continueLearning")}
              </button>
            </Link>
          </div>
        </section>

        {/* ── Stat cards ── */}
        <div
          className="dash-section"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 14,
          }}
        >
          <StatCard
            loading={coursesLoading}
            value={enrolledCourses.length || "—"}
            label={t("studentDashboard.enrolledCourses")}
            color="#818cf8"
          />
          <StatCard
            loading={coursesLoading}
            value={enrolledCourses.length ? `${overallProgress}%` : "—"}
            label={t("studentDashboard.overallProgress")}
            color="#22d3ee"
            extra={
              enrolledCourses.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    height: 4,
                    borderRadius: 4,
                    background: "#1e293b",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="progress-bar-fill"
                    style={{
                      height: "100%",
                      width: `${overallProgress}%`,
                      background: "linear-gradient(90deg,#22d3ee,#818cf8)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              )
            }
          />
          <StatCard
            loading={studentsLoading}
            value={rank ? `#${rank}` : "—"}
            label={t("studentDashboard.leaderboardRank")}
            color="#f472b6"
          />
        </div>

        {/* ── Activity ── */}
        <div
          className="dash-section"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 14,
          }}
        >
          <div
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 18,
              padding: "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
                {t("studentDashboard.recentActivity")}
              </h3>
              <Link
                to="my-courses"
                style={{
                  fontSize: 12,
                  color: "#818cf8",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {t("studentDashboard.viewAll")}
              </Link>
            </div>

            {activityLoading ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <Skeleton w={36} h={36} radius={10} />
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <Skeleton w="70%" h={13} />
                      <Skeleton w="40%" h={11} />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div
                style={{
                  color: "#475569",
                  fontSize: 13,
                  textAlign: "center",
                  paddingTop: 24,
                }}
              >
                No recent activity yet.
                <br />
                Start a course to see your progress here.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {recentActivity.map((item, i) => {
                  const meta = getActivityMeta(item.type);
                  return (
                    <div
                      key={item._id ?? item.id ?? i}
                      className="activity-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "8px 10px",
                        borderRadius: 10,
                        transition: "background .15s",
                        cursor: "default",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: `${meta.color}18`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        {meta.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#e2e8f0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title ??
                            item.description ??
                            item.action ??
                            meta.label}
                        </p>
                        {item.courseName && (
                          <p
                            style={{
                              fontSize: 11,
                              color: "#64748b",
                              marginTop: 2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.courseName}
                          </p>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#475569",
                          flexShrink: 0,
                        }}
                      >
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
                {t("studentDashboard.courseProgress")}
              </h3>
              <Link
                to="my-courses"
                style={{
                  fontSize: 12,
                  color: "#818cf8",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {t("studentDashboard.seeAll")}
              </Link>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                gap: 12,
              }}
            >
              {coursesLoading
                ? [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: 14,
                      padding: "16px 18px",
                    }}
                  >
                    <Skeleton w="65%" h={13} style={{ marginBottom: 10 }} />
                    <Skeleton w="100%" h={6} radius={4} />
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
const StatCard = ({ loading, value, label, color, extra }) => (
  <div
    style={{
      background: "#111827",
      border: "1px solid #1e293b",
      borderRadius: 18,
      padding: "22px 24px",
    }}
  >
    {loading ? (
      <>
        <Skeleton w="50%" h={34} radius={8} />
        <Skeleton w="70%" h={12} radius={6} style={{ marginTop: 10 }} />
      </>
    ) : (
      <>
        <div style={{ fontSize: 34, fontWeight: 800, color }}>{value}</div>
        <div style={{ color: "#64748b", marginTop: 6, fontSize: 13 }}>
          {label}
        </div>
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
    <div
      style={{
        background: "#111827",
        border: "1px solid #1e293b",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#e2e8f0",
          marginBottom: 10,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 4,
            background: "#1e293b",
            overflow: "hidden",
          }}
        >
          <div
            className="progress-bar-fill"
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg,${accent},${accent}99)`,
              borderRadius: 4,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: accent,
            flexShrink: 0,
          }}
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
      document.body.style.touchAction = "none"; // extra safety for iOS momentum scroll
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
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
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 min-w-0  flex flex-col">
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
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20"
            >
              {t("studentDashboard.menu")}
            </button>
            <h2 className="text-lg font-semibold text-white flex-1 text-center truncate">
              {pageTitle}
            </h2>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#7c3aed",
                  color: "#fff",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  flexShrink: 0,
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden min-w-0 flex flex-col min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
      {user?.subscription?.status === "active" && !user?.selectedClass && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl mx-auto mb-5">
              🎓
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Choose Your Class
            </h3>
            <p className="text-slate-400 text-sm mt-2 mb-6">
              Your Academy Access Plan is active! Select a class below to unlock all courses of that class.
            </p>
            <div className="flex flex-col gap-3">
              {["Class 9", "Class 10", "Class 11", "Class 12"].map((cls) => (
                <button
                  key={cls}
                  onClick={() => handleSelectClass(cls)}
                  disabled={selectingClass}
                  className="w-full bg-slate-800/50 hover:bg-indigo-600 hover:text-white transition-all duration-200 border border-slate-700/60 rounded-2xl py-3.5 text-slate-200 text-sm font-bold cursor-pointer disabled:opacity-50"
                >
                  {cls}
                </button>
              ))}
            </div>
            {selectingClass && (
              <p className="text-xs text-indigo-400 mt-4 animate-pulse">
                Unlocking your courses...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
