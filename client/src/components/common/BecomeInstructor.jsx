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
  Zap,
  BookOpen,
  Briefcase,
  Target,
  Compass,
  Lightbulb,
  HeartHandshake,
  ShieldCheck,
  TrendingUp,
  Globe,
  UserCheck,
} from "lucide-react";

const guidanceTopics = [
  { title: "Career Guidance & Planning", icon: Compass, color: "#818cf8" },
  { title: "Academic & Subject Guidance", icon: BookOpen, color: "#38bdf8" },
  { title: "Competitive & Entrance Exams", icon: Target, color: "#c084fc" },
  { title: "Government Exams & Careers", icon: ShieldCheck, color: "#fb7185" },
  { title: "Upcoming Exams & Jobs", icon: TrendingUp, color: "#4ade80" },
  { title: "Emerging & New-Age Fields", icon: Sparkles, color: "#facc15" },
  { title: "Skill Development Programs", icon: Zap, color: "#fb923c" },
  { title: "Study Strategies & Prep", icon: Lightbulb, color: "#2dd4bf" },
  { title: "Higher Education & Admissions", icon: GraduationCap, color: "#a855f7" },
  { title: "Industry Trends & Opportunities", icon: Briefcase, color: "#38bdf8" },
];

const targetAudience = [
  "Teachers",
  "Professors",
  "Subject Experts",
  "Career Counsellors",
  "Competitive Exam Experts",
  "Industry Professionals",
  "Entrepreneurs",
  "Skilled Professionals",
  "Mentors",
];

const expertBenefits = [
  {
    icon: Award,
    title: "Professional Recognition",
    desc: "Be recognized as a subject, career, examination, or industry expert across our network.",
    color: "#818cf8",
  },
  {
    icon: UserCheck,
    title: "Expert Profile",
    desc: "Showcase your professional expertise, experience, and areas of guidance on our platform.",
    color: "#c084fc",
  },
  {
    icon: FileText,
    title: "Certificate of Appreciation",
    desc: "Receive an official certificate in recognition of your valuable contribution to student guidance.",
    color: "#4ade80",
  },
  {
    icon: Video,
    title: "Expert Session Opportunities",
    desc: "Get opportunities to conduct live sessions, expert talks, webinars, and interactive Q&A sessions.",
    color: "#38bdf8",
  },
  {
    icon: Users,
    title: "Professional Networking",
    desc: "Connect and network with fellow educators, mentors, industry professionals, and experts.",
    color: "#fb923c",
  },
  {
    icon: Globe,
    title: "Future Collaborations",
    desc: "Explore opportunities for webinars, workshops, mentoring programs, and academic initiatives.",
    color: "#2dd4bf",
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

  useEffect(() => {
    if (user?.role === "instructor")
      navigate("/instructor-dashboard", { replace: true });
  }, [user, navigate]);

  const handleBecomeInstructor = () => {
    if (isStudent) {
      toast.error(
        t(
          "becomeInstructor.studentCannotBecomeError",
          "Students cannot register as an expert. Please log out and register a new guide account."
        )
      );
      return;
    }
    if (myApplication) return navigate("/instructor-application/status");
    navigate("/become-instructor/apply");
  };

  const buttonLabel = loading
    ? "Checking Status…"
    : myApplication
    ? "View Registration Status →"
    : "Register as an Expert Guide";

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 relative overflow-x-clip py-12 lg:py-20 px-4 sm:px-6 lg:px-10">
      {/* Background Glow Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 blur-[100px] rounded-full transform-gpu" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-600/15 blur-[100px] rounded-full transform-gpu" />
      </div>

      <main className="max-w-7xl mx-auto space-y-16 lg:space-y-24 relative z-10">
        {/* ── HERO & APPLICATION CTA ── */}
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
          {/* Left Hero Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={15} className="text-amber-400" />
              <span>Free Student Guidance Initiative</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              BECOME A STUDENT GUIDE &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400">
                EXPERT MENTOR
              </span>
            </h1>

            <p className="text-base sm:text-lg font-bold text-teal-300 tracking-wide">
              Share Your Knowledge • Guide Students • Shape Futures
            </p>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Are you an educator, subject expert, career mentor, industry professional, competitive-exam specialist, or skilled professional with valuable knowledge and experience to share?
            </p>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
              AI Online Coaching invites experts to become part of our <strong className="text-slate-200">Free Student Guidance Initiative</strong> and voluntarily conduct informative and interactive sessions for students. Your knowledge, experience, and practical guidance can help students discover opportunities, make informed career decisions, understand examinations, develop relevant skills, and plan their academic and professional journey.
            </p>

            {/* Why Join Us Quick Badge Strip */}
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                WHY JOIN US?
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-teal-300">
                {["Give Back", "Share Experience", "Inspire Students", "Create Awareness", "Make a Difference"].map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20"
                  >
                    ✦ {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Application CTA Card */}
          <div className="relative group transform-gpu">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 rounded-[36px] blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" />

            <div className="relative rounded-[32px] border border-slate-800/90 bg-[#111827]/95 p-8 sm:p-10 shadow-2xl flex flex-col justify-between space-y-8 overflow-hidden transform-gpu">
              <Rocket size={100} className="absolute -bottom-8 -right-8 text-teal-500/10 pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                  <HeartHandshake size={14} className="text-teal-400" />
                  <span>REGISTER AS AN EXPERT</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                  Join Our Expert Guide Network
                </h2>

                <p className="text-slate-400 text-sm leading-relaxed">
                  Register as an expert guide, share your proposed guidance topic, and contribute to voluntary free student mentorship sessions.
                </p>
              </div>

              <div className="space-y-3 relative z-10 pt-2">
                {isStudent && (
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-300 font-medium space-y-2">
                    <p className="leading-relaxed font-semibold">
                      ⚠️ Students cannot register as an expert guide. Please log out to register a new expert profile.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(clearAuth());
                        navigate("/become-instructor/apply");
                      }}
                      className="inline-block px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Log Out & Register Fresh Profile
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBecomeInstructor}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 px-6 py-4 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-teal-600/25 disabled:opacity-50 cursor-pointer"
                >
                  <span>{buttonLabel}</span>
                  <ArrowRight size={16} />
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 size={13} className="text-teal-400" />
                  <span>Free Sessions for Students • Voluntary Initiative</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── WHAT CAN YOU GUIDE STUDENTS ON? ── */}
        <div className="space-y-8 pt-6 border-t border-slate-800/80">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3.5 py-1 rounded-full border border-teal-500/20">
              Guidance Areas
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              WHAT CAN YOU GUIDE STUDENTS ON?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Experts can conduct FREE guidance sessions on topics such as:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {guidanceTopics.map((topic, i) => {
              const Icon = topic.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-2xl border border-slate-800/80 bg-[#111827]/90 hover:-translate-y-1 hover:border-teal-500/40 transition-all duration-200 flex items-center gap-4 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                    <Icon size={20} style={{ color: topic.color }} />
                  </div>
                  <h3 className="font-bold text-white text-sm group-hover:text-teal-300 transition-colors">
                    {topic.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── WHO CAN JOIN? ── */}
        <div className="rounded-[32px] border border-slate-800 bg-gradient-to-r from-slate-900 via-[#111827] to-indigo-950/40 p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              WHO CAN JOIN?
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              We welcome passionate professionals from all backgrounds to empower the next generation:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
            {targetAudience.map((role, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 text-xs sm:text-sm font-bold shadow-md hover:border-indigo-500/40 hover:text-indigo-300 transition-all"
              >
                🎓 {role}
              </span>
            ))}
          </div>
        </div>

        {/* ── BENEFITS OF JOINING OUR EXPERT GUIDE NETWORK ── */}
        <div className="space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Benefits of Joining Our Expert Guide Network
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Why experts choose to guide and mentor students on our platform:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {expertBenefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-slate-800/80 bg-[#111827]/90 hover:-translate-y-1 hover:border-teal-500/40 transition-all duration-200 space-y-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                    <Icon size={24} style={{ color: benefit.color }} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-white text-base group-hover:text-teal-300 transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FINAL READY CTA ── */}
        <div className="rounded-[32px] border border-slate-800/90 bg-gradient-to-br from-slate-900 via-[#111827] to-teal-950/40 p-8 sm:p-12 shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="space-y-6 max-w-xl my-auto relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto text-teal-400 shadow-xl">
              <Rocket size={32} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-400">
                BECOME AN EXPERT GUIDE
              </p>
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                Register Your Expert Profile
              </h2>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Ready to share your experience, inspire students, and create awareness? Register now to conduct your guidance session.
            </p>

            <button
              type="button"
              onClick={handleBecomeInstructor}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 px-8 py-4 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-teal-600/25 disabled:opacity-50 cursor-pointer"
            >
              <span>{buttonLabel}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BecomeInstructor;
