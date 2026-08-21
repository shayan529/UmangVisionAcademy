import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../../config/api.js";
import { addToCart } from "../../redux/slices/cartSlice";
import { loadCurrentUser } from "../../redux/slices/authSlice";
import { fetchEnrolledCourses } from "../../redux/slices/courseSlice";
import { hasBaseRole } from "../../utils/permissions.js";
import { useTranslation } from "react-i18next";
import { normalizeVideoUrl, isImageFile, isEmbedVideo, getEmbedUrl } from "../../utils/media.js";
import NoteViewerModal from "../common/NoteViewerModal.jsx";
import PlanSelectionModal from "./PlanSelectionModal.jsx";
import { useAiTranslation } from "../../utils/aiTranslate.js";
import { generateCourseAiDetails } from "../../utils/courseAiDetails.js";
import { SMART_PLANS, TICK_COMPARISON_MATRIX } from "../../data/plansData.js";
import toast from "react-hot-toast";
import {
  Star,
  Check,
  Play,
  Lock,
  FileText,
  ChevronDown,
  ChevronUp,
  Globe,
  Calendar,
  Award,
  Clock,
  Sparkles,
  Share2,
  Gift,
  Tag,
  GraduationCap,
  Users,
  MessageSquare,
  ShieldCheck,
  Tv,
  CheckCircle2,
  ArrowRight,
  Crown,
} from "lucide-react";

// ── Hook: fetch course demo ───────────────────────────────────────────────────
const useCourseDemo = (id) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || id === "undefined") return;
    setLoading(true);
    api
      .get(`/courses/public/${id}`)
      .then(({ data }) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Course not found.");
        setLoading(false);
      });
  }, [id]);

  return { course, loading, error };
};

// ── Hook: access check ────────────────────────────────────────────────────────
const useCourseAccess = (user, course) => {
  const isAdminOrStaff =
    user && (hasBaseRole(user, "admin") || hasBaseRole(user, "staff"));

  const isEnrolled =
    user &&
    course &&
    (user.enrolledCourses?.some(
      (id) => (id._id || id).toString() === course._id?.toString(),
    ) ||
      course.students?.some(
        (id) => (id._id || id).toString() === user._id?.toString(),
      ));

  return isAdminOrStaff || isEnrolled;
};

const fmt = (mins) => {
  if (!mins) return null;
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

// ── Video player component ────────────────────────────────────────────────────
const SAMPLE_DEMO_VIDEO = "https://www.youtube.com/watch?v=g3jQyD-7-2g";

const VideoPlayer = ({ url, poster }) => {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const activeUrl = !url || isImageFile(url) ? SAMPLE_DEMO_VIDEO : url;
  const normalizedUrl = normalizeVideoUrl(activeUrl);
  const [videoSrc, setVideoSrc] = useState(normalizedUrl);

  useEffect(() => {
    setVideoSrc(normalizedUrl);
    setError("");
    setPlaying(false);
  }, [normalizedUrl]);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
      setPlaying(false);
    } else {
      ref.current
        .play()
        .then(() => setPlaying(true))
        .catch((e) => {
          if (e.name === "NotAllowedError") {
            ref.current.muted = true;
            setMuted(true);
            ref.current
              .play()
              .then(() => setPlaying(true))
              .catch(() => { });
          }
        });
    }
  };

  const onTimeUpdate = () => {
    if (!ref.current) return;
    setProgress((ref.current.currentTime / ref.current.duration) * 100 || 0);
  };

  const seek = (e) => {
    if (!ref.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    ref.current.currentTime =
      ((e.clientX - rect.left) / rect.width) * ref.current.duration;
  };

  if (isImageFile(videoSrc)) {
    return (
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
        <img src={videoSrc} alt="Course preview" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (isEmbedVideo(videoSrc)) {
    return (
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
        <iframe
          src={getEmbedUrl(videoSrc)}
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Demo Video"
        />
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden aspect-video bg-black cursor-pointer group shadow-2xl"
      onClick={toggle}
    >
      <video
        ref={ref}
        src={videoSrc}
        poster={poster}
        controls
        controlsList="nodownload"
        playsInline
        preload="metadata"
        muted={muted}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => setPlaying(false)}
        onError={() => setError("Video preview could not be loaded.")}
        className="w-full h-full object-contain bg-black block"
      />
      {!playing && !error && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[2px] transition-all group-hover:bg-black/35 pointer-events-auto cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <Play size={28} className="fill-slate-900 ml-1" />
          </div>
          <span className="mt-3 text-sm font-bold text-white tracking-wide drop-shadow-md">
            Preview this course
          </span>
        </div>
      )}

      {/* Controls bar */}
      <div
        className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          onClick={seek}
          className="h-1 bg-white/30 rounded-full cursor-pointer mb-2 overflow-hidden"
        >
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-white">
          <button onClick={toggle} className="font-bold cursor-pointer hover:text-indigo-400">
            {playing ? "Pause" : "Play"}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
            FREE PREVIEW
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Purchase Sidebar (Udemy Style) ────────────────────────────────────────────
const UdemyPurchaseCard = ({
  course,
  loading,
  user,
  isInCart,
  addedToCart,
  canAccess,
  isFreeWithPlan,
  enrollingFree,
  onEnroll,
  onOpenPlansModal,
  onProceedToBuy,
  navigate,
  selectedPlanId,
  setSelectedPlanId,
  withInstructorAssistance,
  setWithInstructorAssistance,
}) => {
  const { t } = useTranslation();

  const isAssistantChecked =
    withInstructorAssistance ||
    selectedPlanId === "standard" ||
    selectedPlanId === "premium";

  const rawPrice =
    selectedPlanId === "premium"
      ? 1000
      : isAssistantChecked
        ? 500
        : typeof course?.price === "number"
          ? course.price
          : parseFloat(String(course?.price || "100").replace(/[^\d.]/g, "")) || 100;

  const originalPrice = Math.round(rawPrice * 2.5);
  const discountPct = 60;

  const handleToggleAssistant = () => {
    if (isAssistantChecked) {
      setWithInstructorAssistance?.(false);
      setSelectedPlanId?.("basic");
    } else {
      setWithInstructorAssistance?.(true);
      setSelectedPlanId?.("standard");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: course?.title || "Umang Vision Academy Course",
          url: window.location.href,
        })
        .catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t("courseDetails.linkCopied", "Course link copied to clipboard!"));
    }
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Preview Image */}
      {course?.thumbnailUrl ? (
        <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-indigo-950 to-slate-900 flex items-center justify-center text-4xl">
          🎓
        </div>
      )}

      {/* Card Body */}
      <div className="p-3.5 sm:p-5 flex flex-col gap-3.5">
        {canAccess ? (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>
                {t(
                  "courseDetails.fullAccess",
                  "You have full access to this course!",
                )}
              </span>
            </div>
            <button
              onClick={() => navigate(`/courses/${course?._id}`)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {t(
                "courseDetails.goToCurriculum",
                "Go to Course Curriculum →",
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Price Row with Discount */}
            <div className="flex items-baseline justify-between gap-2 flex-wrap pt-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ₹{rawPrice}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  /{t("plans.perYear", "year")}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 line-through font-medium">
                  ₹{originalPrice.toLocaleString()}
                </span>
                <span className="text-xs font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded">
                  {discountPct}% off
                </span>
              </div>
            </div>

            {/* 1-on-1 Faculty Assistance Option */}
            <div
              onClick={handleToggleAssistant}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${isAssistantChecked
                  ? "bg-purple-950/40 border-purple-500/60 shadow-md ring-1 ring-purple-500/40"
                  : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${isAssistantChecked
                      ? "bg-purple-600 text-white"
                      : "border border-slate-600"
                    }`}
                >
                  {isAssistantChecked && "✓"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white leading-tight truncate">
                    ✨ {t("courseDetails.facultySupport", "1-on-1 Faculty Chat Support")}
                  </p>
                  <p className="text-[9.5px] text-slate-400 leading-tight truncate mt-0.5">
                    {t(
                      "courseDetails.facultySupportDesc",
                      "Direct doubt clearance & meet link requests",
                    )}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-purple-300 shrink-0 ml-1">
                ₹500
              </span>
            </div>

            {/* Smart Plan Tagline */}
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400 shrink-0" />
              <p className="text-[11px] text-purple-200 font-medium leading-tight">
                {selectedPlanId === "premium"
                  ? "👑 Premium VIP Suite includes Higher-Study Scholarships & 1-on-1 Faculty Support"
                  : isAssistantChecked
                    ? "⭐ Standard Plan includes 1-on-1 Faculty Chat Support & all class subjects"
                    : `Includes all subjects of ${course?.category || "this class"} with Smart Learning Plans`}
              </p>
            </div>

            {/* Buy / Enroll Button */}
            <button
              onClick={() => {
                if (canAccess) {
                  navigate(`/courses/${course?._id}`);
                } else if (isFreeWithPlan) {
                  onEnroll();
                } else {
                  onProceedToBuy();
                }
              }}
              disabled={enrollingFree}
              className="w-full py-3.5 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:via-indigo-500 hover:to-purple-500 text-white font-black text-base sm:text-lg shadow-xl shadow-purple-600/40 hover:scale-[1.02] active:scale-98 transition-all duration-200 cursor-pointer border-none flex items-center justify-center text-center tracking-tight"
            >
              {enrollingFree
                ? t("courseDetails.enrolling", "Enrolling...")
                : isFreeWithPlan
                  ? t(
                    "courseDetails.enrollFreePlan",
                    "Enroll for Free (Academy Plan)",
                  )
                  : selectedPlanId === "premium"
                    ? "Buy Premium Plan (₹1,000/yr)"
                    : isAssistantChecked
                      ? "Buy Standard Plan (₹500/yr)"
                      : t("courseDetails.buyNow", "Buy Course / Choose Plan")}
            </button>

            {(isInCart || addedToCart) && (
              <button
                onClick={() => navigate("/cart")}
                className="w-full py-2 px-4 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800/80 text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                {t("courseDetails.goToCart", "Go to Cart →")}
              </button>
            )}

            {/* Features list */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5 text-xs text-slate-400">
              <div className="flex flex-col gap-1.5 mt-0.5">
                <div className="flex items-center gap-2">
                  <Tv size={13} className="text-slate-500 shrink-0" />
                  <span>
                    {t(
                      "courseDetails.accessMobile",
                      "Access on mobile, tablet & PC",
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={13} className="text-slate-500 shrink-0" />
                  <span>
                    {t(
                      "courseDetails.certificateIncluded",
                      "Certificate of completion included",
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-slate-500 shrink-0" />
                  <span>
                    {t(
                      "courseDetails.lifetimeAccess",
                      "Full lifetime access to all future updates",
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Share & Gift actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-indigo-400 font-bold">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 hover:text-indigo-300 transition cursor-pointer"
              >
                <Share2 size={13} />
                <span>{t("courseDetails.share", "Share")}</span>
              </button>
              <button
                onClick={() =>
                  toast(
                    t("courseDetails.giftSoon", "Gift course feature coming soon!"),
                  )
                }
                className="flex items-center gap-1.5 hover:text-indigo-300 transition cursor-pointer"
              >
                <Gift size={13} />
                <span>{t("courseDetails.giftCourse", "Gift this course")}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main CourseDemo Page ──────────────────────────────────────────────────────
export default function CourseDemo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { t, i18n } = useTranslation();

  const { course, loading, error } = useCourseDemo(id);

  // AI-synthesized details (What you'll learn, Requirements, Rich Description)
  const aiDetails = useMemo(() => {
    return generateCourseAiDetails(course, i18n?.language || "en");
  }, [course, i18n?.language]);

  const translatableTexts = useMemo(() => {
    if (!course) return [];
    const set = new Set();
    if (course.title) set.add(course.title);
    if (course.category) set.add(course.category);
    if (course.subject) set.add(course.subject);
    (course.chapters || []).forEach((ch) => {
      if (ch.title) set.add(ch.title);
      (ch.lessons || []).forEach((l) => {
        if (l.title) set.add(l.title);
      });
    });
    return Array.from(set);
  }, [course]);

  const { tText } = useAiTranslation(translatableTexts);

  const [addedToCart, setAddedToCart] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [activeModalNote, setActiveModalNote] = useState(null);

  const initialPlanId = location.state?.selectedPlanId || "basic";
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [withInstructorAssistance, setWithInstructorAssistance] = useState(
    initialPlanId === "standard" || initialPlanId === "premium"
  );

  useEffect(() => {
    if (location.state?.selectedPlanId) {
      const planId = location.state.selectedPlanId;
      setSelectedPlanId(planId);
      if (planId === "standard" || planId === "premium") {
        setWithInstructorAssistance(true);
      } else {
        setWithInstructorAssistance(false);
      }
    }
  }, [location.state]);

  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedPlanCards, setExpandedPlanCards] = useState({});

  const toggleExpandPlanCard = (planId, e) => {
    e?.stopPropagation?.();
    setExpandedPlanCards((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const cartIds = useSelector((s) => s.cart?.cartIds ?? []);
  const isInCart = cartIds.includes(id);
  const canAccess = useCourseAccess(user, course);

  const isFreeWithPlan =
    user?.subscription?.status === "active" &&
    user?.selectedClass &&
    course?.category &&
    user.selectedClass.toLowerCase().trim() === course.category.toLowerCase().trim();
  const [enrollingFree, setEnrollingFree] = useState(false);

  const handleSelectPlan = (plan) => {
    setSelectedPlanId(plan.id);
    if (plan.id === "standard" || plan.id === "premium") {
      setWithInstructorAssistance(true);
    } else {
      setWithInstructorAssistance(false);
    }
    setShowPlansModal(false);
  };

  const handleProceedToBuy = () => {
    if (!user) {
      navigate("/login", {
        state: { from: `/courses/${id}/demo`, replace: true },
      });
      return;
    }
    const currentPlan =
      SMART_PLANS.find((p) => p.id === selectedPlanId) || SMART_PLANS[0];
    navigate("/student-dashboard/billing", {
      state: {
        plan: currentPlan,
        courseId: id,
        withInstructorAssistance,
      },
    });
  };

  // Organize curriculum into sections
  const curriculumSections = useMemo(() => {
    if (!course) return [];
    const rawLessons = course.lessons || [];

    const isBulkCourse =
      rawLessons.some((l) => l.subject) ||
      (course.notes ?? []).some((n) => n.subject) ||
      (course.subjectQuizzes ?? []).length > 0;

    if (isBulkCourse) {
      const subjectNames = Array.from(
        new Set(rawLessons.map((l) => l.subject).filter(Boolean)),
      );
      return subjectNames.map((subj, idx) => {
        const subLessons = rawLessons
          .map((l, gIdx) => ({ ...l, _globalIndex: gIdx }))
          .filter((l) => l.subject === subj);
        return {
          id: `sec-${idx}`,
          title: subj,
          lessons: subLessons,
        };
      });
    }

    return [
      {
        id: "sec-0",
        title: "Course Curriculum & Complete Syllabus",
        lessons: rawLessons.map((l, gIdx) => ({ ...l, _globalIndex: gIdx })),
      },
    ];
  }, [course]);

  // Initial expansion of the first section
  useEffect(() => {
    if (curriculumSections.length > 0) {
      setExpandedSections({ [curriculumSections[0].id]: true });
    }
  }, [curriculumSections]);

  const toggleAllSections = () => {
    const allOpen = curriculumSections.every((s) => expandedSections[s.id]);
    const newState = {};
    curriculumSections.forEach((s) => {
      newState[s.id] = !allOpen;
    });
    setExpandedSections(newState);
  };

  const handleEnrollClick = async () => {
    if (!user) {
      navigate("/login", {
        state: { from: `/courses/${id}/demo`, replace: true },
      });
      return;
    }

    if (!id || id === "undefined") return;

    if (isFreeWithPlan && !canAccess) {
      try {
        setEnrollingFree(true);
        await api.post("/courses/enroll", {
          courseIds: [id],
          withInstructorAssistance,
        });
        await dispatch(loadCurrentUser());
        await dispatch(fetchEnrolledCourses());
        navigate(`/courses/${id}`);
      } catch (err) {
        toast.error(err.response?.data?.message || "Error enrolling for free.");
        setEnrollingFree(false);
      }
      return;
    }

    dispatch(addToCart(id));
    if (withInstructorAssistance) {
      try {
        const stored = JSON.parse(
          localStorage.getItem("instructorAssistanceCourses") || "[]",
        );
        if (!stored.includes(id)) {
          stored.push(id);
          localStorage.setItem(
            "instructorAssistanceCourses",
            JSON.stringify(stored),
          );
        }
      } catch (e) {
        console.error("LocalStorage save error:", e);
      }
    }
    setAddedToCart(true);
    toast.success("Course added to cart!");
  };

  const purchaseCardProps = {
    course,
    loading,
    user,
    isInCart,
    addedToCart,
    canAccess,
    isFreeWithPlan,
    enrollingFree,
    onEnroll: handleEnrollClick,
    onOpenPlansModal: () => setShowPlansModal(true),
    onProceedToBuy: handleProceedToBuy,
    onSelectPlan: handleSelectPlan,
    navigate,
    selectedPlanId,
    setSelectedPlanId,
    withInstructorAssistance,
    setWithInstructorAssistance,
  };

  if (loading && !course) {
    return (
      <div className="min-h-screen bg-[#0b1120] text-slate-100 font-sans p-6 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-3 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">
          {t("courseDetails.loading", "Loading course details...")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col items-center justify-center p-6 gap-4">
        <div className="text-5xl">😔</div>
        <p className="text-rose-400 font-bold text-lg">{error}</p>
        <button
          onClick={() => navigate("/courses")}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm cursor-pointer"
        >
          {t("courses.all", "Browse All Courses")}
        </button>
      </div>
    );
  }

  const rawRating = course?.ratingAverage ?? course?.rating ?? 0;
  const ratingVal = Number(rawRating || 0).toFixed(1);
  const reviewsCount = course?.reviewCount ?? course?.reviews ?? 0;
  const studentsCount = course?.enrolledCount ?? course?.students?.length ?? 0;
  const totalLessons = course?.lessons?.length ?? course?.lessonCount ?? 0;
  const totalDuration = course?.durationHours ? `${course.durationHours} hours` : "Self-paced";

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 font-sans pb-16">
      {/* ── 1. Compact Top Navigation & Hero Banner ── */}
      <div className="bg-[#0f172a] border-b border-slate-800/80 py-2.5 sm:py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          {/* Left Title & Breadcrumbs */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 mb-0.5 flex-wrap">
              <Link to="/courses" className="hover:underline">
                {t("courseDetails.courses", "Courses")}
              </Link>
              <span className="text-slate-600">›</span>
              <span>{tText(course?.category || "Class")}</span>
              {course?.board && (
                <>
                  <span className="text-slate-600">›</span>
                  <span className="text-slate-400">{tText(course.board)}</span>
                </>
              )}
              {course?.subject && (
                <>
                  <span className="text-slate-600">›</span>
                  <span className="text-slate-400">{tText(course.subject)}</span>
                </>
              )}
            </div>
            <h1 className="text-base sm:text-lg md:text-xl font-black text-white leading-tight tracking-tight truncate">
              {tText(course?.title || "Comprehensive Course Masterclass")}
            </h1>
          </div>


        </div>
      </div>

      {/* ── 2. Top Hero Section: Smart Learning Plans (Left) & Buy Now Card (Right) ── */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Smart Learning Plans (Expanded to 8 Cols) */}
          <div className="lg:col-span-8 xl:col-span-8 h-full flex flex-col">
            {/* Mobile-only Purchase Card */}
            <div className="lg:hidden mb-4">
              <UdemyPurchaseCard {...purchaseCardProps} />
            </div>

            {/* ── Smart Learning Plans Section (Stretched to match Buy Now Card) ── */}
            <div className="h-full flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/95 via-purple-950/40 to-slate-900/95 border border-purple-500/30 shadow-xl backdrop-blur-md">
              {/* Header Row */}
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-purple-500/20 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/40 shrink-0">
                    <Sparkles size={13} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-black text-white tracking-tight">
                    {t("plans.heading", "Smart Learning Plans")}
                  </h2>
                </div>
                <div className="text-[11px] text-slate-300 font-bold bg-purple-900/40 border border-purple-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <span>Selected:</span>
                  <span className="text-purple-200 capitalize font-extrabold">
                    {selectedPlanId} ({selectedPlanId === "premium" ? "₹1,000/yr" : selectedPlanId === "standard" ? "₹500/yr" : "₹100/yr"})
                  </span>
                </div>
              </div>

              {/* 3 Plan Cards - Stretched to fill height */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 items-stretch my-auto">
                {SMART_PLANS.map((plan) => {
                  const isPopular = plan.id === "standard";
                  const isPremium = plan.id === "premium";
                  const isSelected = selectedPlanId === plan.id;
                  const features = plan.allFeatures || [];

                  return (
                    <div
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      className={`relative p-3.5 sm:p-4 rounded-xl h-full flex flex-col justify-between transition-all duration-200 cursor-pointer ${isSelected
                          ? isPopular
                            ? "bg-gradient-to-b from-purple-950/90 to-slate-900/95 border-2 border-purple-400 shadow-xl shadow-purple-950/60 ring-2 ring-purple-400/50"
                            : isPremium
                              ? "bg-gradient-to-b from-amber-950/60 to-slate-900/95 border-2 border-amber-400 shadow-xl shadow-amber-950/50 ring-2 ring-amber-400/40"
                              : "bg-slate-900 border-2 border-indigo-400 shadow-lg ring-2 ring-indigo-400/30"
                          : isPopular
                            ? "bg-gradient-to-b from-purple-950/80 to-slate-900/95 border border-purple-500/40 hover:border-purple-400 shadow-lg"
                            : isPremium
                              ? "bg-gradient-to-b from-amber-950/40 to-slate-900/95 border border-amber-500/40 hover:border-amber-400 shadow-md"
                              : "bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 shadow-sm"
                        }`}
                      style={{
                        borderTop: `3px solid ${plan.color}`,
                      }}
                    >
                      {/* Badges */}
                      {isPopular && (
                        <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[9px] font-black text-white uppercase tracking-wider shadow-md">
                          ⭐ {t("plans.mostPopular", "MOST POPULAR")}
                        </div>
                      )}
                      {isPremium && (
                        <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] font-black text-slate-950 uppercase tracking-wider shadow-md">
                          👑 VIP SUITE
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5 pb-1.5 border-b border-slate-800/80">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{plan.icon}</span>
                            <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                              {t(plan.labelKey, plan.label)}
                            </span>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <span className="text-sm sm:text-base font-black text-white">
                              {plan.price}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              /{t(plan.periodKey, "year")}
                            </span>
                          </div>
                        </div>

                        {/* Bullet Highlights */}
                        <div className="space-y-1.5 my-2.5 text-xs text-slate-200 leading-snug">
                          {features.map((feat, idx) => {
                            const featureKey = plan.featureKeys?.[idx];
                            const featureText = featureKey ? t(featureKey, feat) : feat;
                            return (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-300 leading-snug"
                              >
                                <div
                                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]"
                                  style={{
                                    background: `${plan.color}25`,
                                    color: plan.color,
                                  }}
                                >
                                  ✓
                                </div>
                                <span>{featureText}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlan(plan);
                        }}
                        className={`w-full mt-2 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${isSelected
                            ? isPopular
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg ring-2 ring-purple-300"
                              : isPremium
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg ring-2 ring-amber-300"
                                : "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300"
                            : isPopular
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-900/40"
                              : isPremium
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-md shadow-amber-950/30"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 shadow-sm"
                          }`}
                      >
                        <span>{isSelected ? `✓ Selected: ${plan.title}` : t(plan.buttonKey, `Choose ${plan.title}`)}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Buy Now Card (UdemyPurchaseCard) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-4 h-full">
            <UdemyPurchaseCard {...purchaseCardProps} />
          </div>
        </div>
      </div>

      {/* ── 3. Main Content Details Below Top Cards Row ── */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-8">
            {/* ── 3.1 "What you'll learn" Box (Udemy Exact Style) ── */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                {t("courseDetails.whatYouWillLearn", "What you'll learn")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-300">
                {(aiDetails.whatYouWillLearn || []).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 leading-snug">
                    <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 3.2 Course Content / Curriculum Accordion ── */}
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {t("courseDetails.courseContent", "Course content")}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {curriculumSections.length}{" "}
                    {t("courseDetails.sections", "sections")} • {totalLessons}{" "}
                    {t("courseDetails.lectures", "lectures")} • {totalDuration}{" "}
                    {t("courseDetails.totalLength", "total length")}
                  </p>
                </div>
                <button
                  onClick={toggleAllSections}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  {curriculumSections.every((s) => expandedSections[s.id])
                    ? t("courseDetails.collapseAll", "Collapse all sections")
                    : t("courseDetails.expandAll", "Expand all sections")}
                </button>
              </div>

              {/* Sections Accordion */}
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-slate-900/40">
                {curriculumSections.map((section) => {
                  const isOpen = Boolean(expandedSections[section.id]);
                  return (
                    <div key={section.id} className="transition">
                      <button
                        onClick={() =>
                          setExpandedSections((prev) => ({
                            ...prev,
                            [section.id]: !isOpen,
                          }))
                        }
                        className="w-full px-4 py-3.5 bg-slate-900/80 hover:bg-slate-800/60 flex items-center justify-between gap-3 text-left transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isOpen ? (
                            <ChevronUp size={16} className="text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-400 shrink-0" />
                          )}
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {tText(section.title)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium shrink-0">
                          {section.lessons.length}{" "}
                          {t("courseDetails.lectures", "lectures")}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-4 py-2 divide-y divide-slate-800/60 bg-slate-950/40">
                          {section.lessons.map((lesson) => (
                            <div
                              key={lesson._globalIndex}
                              className="py-2.5 flex items-center justify-between gap-3 text-xs text-slate-300"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Play size={13} className="text-slate-500 shrink-0" />
                                <span className="truncate font-medium text-slate-200">
                                  {tText(lesson.title)}
                                </span>
                                {lesson.videoType === "animated_video" && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/30 shrink-0">
                                    ✨ Animated
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {canAccess ? (
                                  <span className="text-emerald-400 font-semibold text-[11px]">
                                    {t("courseDetails.unlocked", "Unlocked")}
                                  </span>
                                ) : (
                                  <Lock size={12} className="text-slate-500" />
                                )}
                                {lesson.durationMinutes > 0 && (
                                  <span className="text-slate-500 text-[11px]">
                                    {fmt(lesson.durationMinutes)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 3.3 Study Notes & Materials ── */}
            {course?.notes?.length > 0 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <FileText size={18} className="text-indigo-400" />
                    <span>
                      {t(
                        "courseDetails.studyNotesTitle",
                        "Study Notes & Revision Materials",
                      )}{" "}
                      ({course.notes.length})
                    </span>
                  </h2>
                </div>
                <div className="flex flex-col gap-2 mt-3">
                  {course.notes.map((note) => (
                    <div
                      key={note._id || note.title}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                          {tText(note.title)}
                        </p>
                        {note.description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {tText(note.description)}
                          </p>
                        )}
                      </div>
                      {canAccess ? (
                        <button
                          type="button"
                          onClick={() => setActiveModalNote(note)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition cursor-pointer"
                        >
                          {t("courseDetails.viewNote", "View Note")}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                          <Lock size={12} />
                          <span>{t("courseDetails.locked", "Locked")}</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 3.4 Requirements (Udemy Exact Style) ── */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
                {t("courseDetails.requirements", "Requirements")}
              </h2>
              <ul className="list-disc list-inside flex flex-col gap-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {(aiDetails.requirements || []).map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>

            {/* ── 3.5 Description (With Show More Toggle) ── */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
                {t("courseDetails.description", "Description")}
              </h2>
              <div
                className={`text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line relative ${!showFullDesc ? "max-h-48 overflow-hidden" : ""
                  }`}
              >
                {aiDetails.description}
                {!showFullDesc && (
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0b1120] to-transparent pointer-events-none" />
                )}
              </div>
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {showFullDesc
                    ? t("courseDetails.showLess", "Show less")
                    : t("courseDetails.showMore", "Show more")}
                </span>
                {showFullDesc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* ── 3.6 Instructor Section (Udemy Exact Style) ── */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                {t("courseDetails.instructor", "Instructor")}
              </h2>

              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-base font-bold text-indigo-400">
                    {aiDetails.instructorName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lead Faculty & Subject Expert • Umang Vision Academy
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-wrap text-xs text-slate-300">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold ring-2 ring-indigo-500/40">
                    {course?.instructor?.avatarUrl ? (
                      <img
                        src={course.instructor.avatarUrl}
                        alt={aiDetails.instructorName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      aiDetails.instructorName.charAt(0)
                    )}
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    {course?.instructor?.avgRating ? (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>
                          {Number(course.instructor.avgRating).toFixed(1)}{" "}
                          {t("courseDetails.instructorRating", "Instructor Rating")}
                        </span>
                      </div>
                    ) : null}
                    {course?.instructor?.ratingCount ? (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MessageSquare size={13} className="text-slate-400" />
                        <span>
                          {course.instructor.ratingCount.toLocaleString()}{" "}
                          {t("courseDetails.reviews", "Reviews")}
                        </span>
                      </div>
                    ) : null}
                    {studentsCount > 0 ? (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Users size={13} className="text-slate-400" />
                        <span>
                          {studentsCount.toLocaleString()}{" "}
                          {t("courseDetails.students", "Students")}
                        </span>
                      </div>
                    ) : null}
                    {course?.instructor?.coursesCount ||
                      course?.instructor?.courses?.length ? (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <GraduationCap size={13} className="text-slate-400" />
                        <span>
                          {course.instructor.coursesCount ||
                            course.instructor.courses.length}{" "}
                          {t("courseDetails.coursesCount", "Courses")}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div
                  className={`text-xs sm:text-sm text-slate-300 leading-relaxed mt-2 whitespace-pre-line relative ${!showFullBio ? "max-h-24 overflow-hidden" : ""
                    }`}
                >
                  {aiDetails.instructorBio}
                  {!showFullBio && (
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
                  )}
                </div>

                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 self-start cursor-pointer"
                >
                  <span>
                    {showFullBio
                      ? t("courseDetails.showLess", "Show less")
                      : t("courseDetails.showMore", "Show more")}
                  </span>
                  {showFullBio ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* ── 3.7 Student Feedback & Reviews (Only shown if real reviews exist) ── */}
            {(() => {
              const realReviews = (course?.ratings || []).filter(
                (r) => r && (r.review || r.comment || r.rating > 0),
              );

              if (realReviews.length === 0) return null;

              return (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                    ★ {ratingVal}{" "}
                    {t("courseDetails.courseRating", "course rating")} •{" "}
                    {reviewsCount.toLocaleString()}{" "}
                    {reviewsCount === 1
                      ? t("courseDetails.rating", "rating")
                      : t("courseDetails.ratings", "ratings")}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {realReviews.map((rev, idx) => {
                      const studentName =
                        rev.user?.name || rev.userName || "Student";
                      const reviewText = rev.review || rev.comment || "";
                      const revRating = Number(rev.rating || 5);
                      const reviewDate = rev.createdAt
                        ? new Date(rev.createdAt).toLocaleDateString()
                        : "";

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2"
                        >
                          <div className="flex items-center gap-2.5">
                            {rev.user?.avatarUrl ? (
                              <img
                                src={rev.user.avatarUrl}
                                alt={studentName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center">
                                {studentName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-white">
                                {studentName}
                              </p>
                              <div className="flex items-center gap-1 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={10}
                                    className={
                                      i < Math.round(revRating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-slate-600"
                                    }
                                  />
                                ))}
                                {reviewDate && (
                                  <span className="text-[10px] text-slate-500 ml-1">
                                    {reviewDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {reviewText && (
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {tText(reviewText)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <NoteViewerModal
        note={activeModalNote}
        isOpen={Boolean(activeModalNote)}
        onClose={() => setActiveModalNote(null)}
      />

      <PlanSelectionModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        course={course}
        selectedPlanId={selectedPlanId}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}
