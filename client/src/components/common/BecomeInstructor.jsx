import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { fetchMyApplication } from "../../redux/slices/applicationsSlice";
import { clearAuth } from "../../redux/slices/authSlice";
import { hasBaseRole } from "../../utils/permissions";
import {
  GraduationCap,
  Sparkles,
  Rocket,
  CheckCircle2,
  Users,
  Video,
  Award,
  ArrowRight,
  FileText,
  UploadCloud,
  BookOpen,
  Zap,
} from "lucide-react";

const steps = [
  {
    icon: FileText,
    stepNum: "01",
    titleKey: "becomeInstructor.steps.apply.title",
    defaultTitle: "Apply & Submit Demo",
    descriptionKey: "becomeInstructor.steps.apply.description",
    defaultDesc: "Submit your bio, expertise, and sample lesson content so our academic review team can evaluate your teaching style.",
    badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: UploadCloud,
    stepNum: "02",
    titleKey: "becomeInstructor.steps.upload.title",
    defaultTitle: "Start Creating Content",
    descriptionKey: "becomeInstructor.steps.upload.description",
    defaultDesc: "Use our AI-assisted course builder to record videos, generate practice quizzes, and organize subject modules.",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Rocket,
    stepNum: "03",
    titleKey: "becomeInstructor.steps.teach.title",
    defaultTitle: "Launch & Earn",
    descriptionKey: "becomeInstructor.steps.teach.description",
    defaultDesc: "Publish your course to thousands of enrolled students, host live doubt clearing sessions, and earn competitive payouts.",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
];

const instructorPerks = [
  {
    icon: Users,
    titleKey: "becomeInstructor.perks.reachStudents.title",
    descKey: "becomeInstructor.perks.reachStudents.desc",
    defaultTitle: "Reach Thousands of Students",
    defaultDesc: "Teach motivated learners across Class 9-12, competitive exams, and specialized skill tracks.",
    color: "#818cf8",
  },
  {
    icon: Sparkles,
    titleKey: "becomeInstructor.perks.aiBuilder.title",
    descKey: "becomeInstructor.perks.aiBuilder.desc",
    defaultTitle: "AI-Powered Course Builder",
    defaultDesc: "Auto-generate practice quizzes, lesson notes, and student progress reports effortlessly.",
    color: "#c084fc",
  },
  {
    icon: Award,
    titleKey: "becomeInstructor.perks.earnings.title",
    descKey: "becomeInstructor.perks.earnings.desc",
    defaultTitle: "Transparent & Timely Earnings",
    defaultDesc: "Earn competitive revenues per enrollment with direct payouts and clear performance analytics.",
    color: "#4ade80",
  },
  {
    icon: Video,
    titleKey: "becomeInstructor.perks.streamingTools.title",
    descKey: "becomeInstructor.perks.streamingTools.desc",
    defaultTitle: "High-Quality Streaming Tools",
    defaultDesc: "Host live video classes or publish self-paced HD video courses with automatic PDF material attachments.",
    color: "#38bdf8",
  },
];

const BecomeInstructor = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { myApplication, loading } = useSelector((state) => state.applications);

  const isStudent = hasBaseRole(user, "student");

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchMyApplication());
  }, [isAuthenticated, dispatch]);

  // Already an instructor — navigate to instructor dashboard
  useEffect(() => {
    if (user?.role === "instructor")
      navigate("/instructor-dashboard", { replace: true });
  }, [user, navigate]);

  const handleBecomeInstructor = () => {
    if (isStudent) {
      toast.error(
        t(
          "becomeInstructor.studentCannotBecomeError",
          "Students cannot become an instructor. Please create a fresh account."
        )
      );
      return;
    }
    if (myApplication) return navigate("/instructor-application/status");
    navigate("/become-instructor/apply");
  };

  const buttonLabel = loading
    ? t("becomeInstructor.buttonChecking", "Checking status…")
    : myApplication
    ? t("becomeInstructor.buttonStatus", "View Application Status →")
    : t("becomeInstructor.buttonBecome", "Become an Instructor");

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 relative overflow-x-clip py-16 lg:py-24 px-6 md:px-10">
      {/* Background Glow Accents (GPU Optimized) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 blur-[90px] rounded-full transform-gpu" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-600/15 blur-[90px] rounded-full transform-gpu" />
      </div>

      <main className="max-w-7xl mx-auto space-y-20 relative z-10">

        {/* ── HERO & APPLICATION CARD GRID ── */}
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
          
          {/* Left Hero Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <GraduationCap size={16} />
              {t("becomeInstructor.tag", "Teach on Umang Vision Academy")}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              {t("becomeInstructor.headlinePart1", "Share Your")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                {t("becomeInstructor.headlinePart2", "Knowledge.")}
              </span>
            </h1>

            <p className="max-w-2xl text-slate-400 text-base md:text-lg leading-relaxed">
              {t(
                "becomeInstructor.subtitle",
                "Join 300+ instructors building courses that reach thousands of learners. Submit your application, get verified fast, and start teaching with AI-supported tools."
              )}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg border-t border-slate-800">
              <div>
                <div className="text-2xl font-black text-white">300+</div>
                <div className="text-xs text-slate-400 font-medium">Expert Educators</div>
              </div>
              <div>
                <div className="text-2xl font-black text-indigo-400">10k+</div>
                <div className="text-xs text-slate-400 font-medium">Enrolled Students</div>
              </div>
              <div>
                <div className="text-2xl font-black text-cyan-400">24h</div>
                <div className="text-xs text-slate-400 font-medium">Fast Approval</div>
              </div>
            </div>
          </div>

          {/* Right Application CTA Card */}
          <div className="relative group transform-gpu">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[36px] blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" />

            <div className="relative rounded-[32px] border border-slate-800/90 bg-[#111827]/95 p-8 sm:p-10 shadow-2xl flex flex-col justify-between space-y-8 overflow-hidden transform-gpu">
              <Rocket size={100} className="absolute -bottom-8 -right-8 text-indigo-500/10 pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  <Zap size={13} className="text-amber-400 fill-amber-400" />
                  {t("becomeInstructor.applyNow", "APPLY NOW")}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                  {t("becomeInstructor.startJourney", "Start your instructor journey")}
                </h2>

                <p className="text-slate-400 text-sm leading-relaxed">
                  {t(
                    "becomeInstructor.cardBody",
                    "Fill in your expertise and sample content to get started. Our team will reach out within 24 hours with next steps."
                  )}
                </p>
              </div>

              <div className="space-y-3 relative z-10 pt-2">
                {isStudent && (
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-300 font-medium space-y-2">
                    <p className="leading-relaxed font-semibold">
                      ⚠️ {t(
                        "becomeInstructor.studentCannotBecomeError",
                        "Students cannot become an instructor. Please create a fresh account."
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(clearAuth());
                        navigate("/become-instructor/apply");
                      }}
                      className="inline-block px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Log Out & Register Fresh Account
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBecomeInstructor}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 px-6 py-4 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
                >
                  <span>{buttonLabel}</span>
                  <ArrowRight size={16} />
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>No upfront fees • Free onboarding</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── WHY TEACH WITH US (PERKS GRID) ── */}
        <div className="space-y-8 pt-6 border-t border-slate-800/80">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t("becomeInstructor.whyChooseTitle", "Why Instructors Choose Umang Vision Academy")}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              {t("becomeInstructor.whyChooseSubtitle", "Everything you need to build, market, and monetize high-impact online courses.")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {instructorPerks.map((perk, i) => {
              const Icon = perk.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-slate-800/80 bg-[#111827]/90 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-lg transition-transform transition-colors duration-200 space-y-4 group transform-gpu"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Icon size={24} style={{ color: perk.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                      {t(perk.titleKey, perk.defaultTitle)}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      {t(perk.descKey, perk.defaultDesc)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── HOW IT WORKS STEPS & READY BANNER ── */}
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
          
          {/* Steps Container */}
          <div className="rounded-[32px] border border-slate-800/90 bg-[#111827]/90 p-8 sm:p-10 shadow-xl space-y-8 transform-gpu">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={14} />
                {t("becomeInstructor.howItWorks", "How it works")}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {t("becomeInstructor.howItWorksHeading", "A simple process to launch your first course")}
              </h2>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                {t(
                  "becomeInstructor.howItWorksBody",
                  "Apply with your expertise, get verified quickly, and publish your first course to start earning from day one."
                )}
              </p>
            </div>

            <div className="space-y-4">
              {steps.map((step) => {
                const Icon = step.icon;
                const title = t(step.titleKey, step.defaultTitle);
                const desc = t(step.descriptionKey, step.defaultDesc);

                return (
                  <div
                    key={step.stepNum}
                    className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-slate-700 transition-colors duration-200"
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${step.badgeColor} font-black text-sm shadow-md`}>
                      {step.stepNum}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Icon size={16} className="text-indigo-400" />
                        {title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Final Ready Banner */}
          <div className="rounded-[32px] border border-slate-800/90 bg-gradient-to-br from-slate-900 via-[#111827] to-indigo-950/40 p-8 sm:p-10 shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden transform-gpu">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none" />

            <div className="space-y-6 max-w-md my-auto relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-xl">
                <Rocket size={32} />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400">
                  {t("becomeInstructor.readyToJoin", "Ready to join?")}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {t("becomeInstructor.applyToTeach", "Apply to teach today")}
                </h2>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed">
                {t(
                  "becomeInstructor.readyBody",
                  "Are you ready to share your expertise and shape the future of learning? Submit your application and become part of our world-class coaching community."
                )}
              </p>

              <button
                type="button"
                onClick={handleBecomeInstructor}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 px-6 py-4 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
              >
                <span>{buttonLabel}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
};

export default BecomeInstructor;
