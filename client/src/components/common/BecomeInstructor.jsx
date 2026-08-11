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
  Award,
  ArrowRight,
  CheckCircle2,
  Users,
  Video,
  BookOpen,
  Briefcase,
  Compass,
  FileCheck2,
  Network,
  Globe2,
  Target,
  HeartHandshake,
  Lightbulb,
  Zap,
} from "lucide-react";

const guidanceTopics = [
  {
    title: "Career Guidance & Career Planning",
    desc: "Help students navigate stream selection, long-term career roadmaps, and industry paths.",
    icon: Compass,
    color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
  },
  {
    title: "Academic & Subject-Specific Guidance",
    desc: "In-depth subject mentorship, key concept mastery, and academic excellence strategies.",
    icon: BookOpen,
    color: "from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30",
  },
  {
    title: "Competitive & Entrance Examination Guidance",
    desc: "Preparation roadmaps for JEE, NEET, CLAT, CAT, CUET, and other national entrance exams.",
    icon: Target,
    color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
  },
  {
    title: "Government Exams & Career Opportunities",
    desc: "Insights into UPSC, SSC, Banking, Railways, State PSCs, and public sector opportunities.",
    icon: Award,
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
  },
  {
    title: "Upcoming Exams, Jobs & Career Opportunities",
    desc: "Real-time updates on emerging vacancies, admission deadlines, and industry hiring trends.",
    icon: Zap,
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Emerging & New-Age Career Fields",
    desc: "Guidance on AI, Data Science, Cyber Security, Design, Fintech, and modern digital careers.",
    icon: Sparkles,
    color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    title: "Skill Development & Career-Oriented Programs",
    desc: "Practical soft skills, communication, coding, problem solving, and workplace readiness.",
    icon: Briefcase,
    color: "from-violet-500/20 to-indigo-500/20 text-violet-400 border-violet-500/30",
  },
  {
    title: "Study Strategies & Examination Preparation",
    desc: "Time management, memory retention, note-taking techniques, and stress management.",
    icon: Lightbulb,
    color: "from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30",
  },
  {
    title: "Higher Education & Admission Guidance",
    desc: "College selection, university entrance, SOP writing, and scholarship application tips.",
    icon: GraduationCap,
    color: "from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30",
  },
  {
    title: "Industry Trends & Professional Opportunities",
    desc: "Direct insights from industry veterans on modern corporate expectations and job markets.",
    icon: Globe2,
    color: "from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30",
  },
];

const whoCanJoinList = [
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

const benefitsList = [
  {
    icon: Award,
    title: "Professional Recognition",
    desc: "Be recognized as a verified subject, career, examination, or industry expert in our national educational network.",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: Users,
    title: "Expert Profile",
    desc: "Showcase your professional expertise, experience, credentials, and areas of guidance on our official platform.",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: FileCheck2,
    title: "Certificate of Appreciation",
    desc: "Receive an official Certificate of Appreciation in recognition of your valuable voluntary contribution to student guidance.",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Video,
    title: "Expert Session Opportunities",
    desc: "Get scheduled opportunities to conduct live interactive sessions, webinars, keynote talks, and live Q&A with students.",
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Network,
    title: "Professional Networking",
    desc: "Connect and collaborate with leading educators, certified mentors, industry leaders, and like-minded experts.",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: HeartHandshake,
    title: "Future Collaboration Opportunities",
    desc: "Explore potential partnerships for paid courses, specialized workshops, 1-on-1 mentorship initiatives, and academic programs.",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
];

export default function BecomeInstructor() {
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

  const handleRegister = () => {
    if (isStudent) {
      toast.error(
        "Students cannot register as an expert guide. Please log out and register with an expert/instructor account.",
      );
      return;
    }
    if (myApplication) return navigate("/instructor-application/status");
    navigate("/become-instructor/apply");
  };

  const buttonLabel = loading
    ? "Checking status…"
    : myApplication
      ? "View Application Status →"
      : "Register as an Expert Guide →";

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 relative overflow-x-clip py-14 lg:py-20 px-4 sm:px-6 lg:px-12 font-sans">
      {/* Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 blur-[100px] rounded-full transform-gpu" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/15 blur-[100px] rounded-full transform-gpu" />
      </div>

      <div className="max-w-7xl mx-auto space-y-20 relative z-10">
        {/* ── 1. HERO SECTION ── */}
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-wider">
              <Sparkles size={14} className="text-amber-400" />
              <span>Free Student Guidance Initiative</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              BECOME A STUDENT GUIDE &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                EXPERT MENTOR
              </span>
            </h1>

            <p className="text-lg sm:text-xl font-bold text-slate-200">
              Share Your Knowledge. Guide Students. Shape Futures.
            </p>

            <div className="space-y-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              <p>
                Are you an educator, subject expert, career mentor, industry
                professional, competitive-exam specialist, or skilled professional
                with valuable knowledge and experience to share?
              </p>
              <p>
                <strong className="text-white">AI Online Coaching</strong> invites
                experts to become part of our{" "}
                <span className="text-indigo-300 font-semibold">
                  Free Student Guidance Initiative
                </span>{" "}
                and voluntarily conduct informative and interactive sessions for
                students.
              </p>
              <p className="text-slate-400 text-xs sm:text-sm">
                Your knowledge, experience, and practical guidance can help
                students discover opportunities, make informed career decisions,
                understand examinations, develop relevant skills, and plan their
                academic and professional journey.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-sm tracking-wide shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {buttonLabel}
              </button>
            </div>
          </div>

          {/* Hero Quick Card */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-[32px] blur-xl opacity-30 group-hover:opacity-50 transition duration-500" />
            <div className="relative rounded-3xl bg-[#111827] border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    REGISTER AS AN EXPERT GUIDE
                  </h3>
                  <p className="text-xs text-slate-400">
                    Join our volunteer mentoring network
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 text-xs text-slate-300">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span>Give Back • Share Experience</span>
                </div>
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span>Inspire Students • Create Awareness</span>
                </div>
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span>Make a Real Difference</span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 leading-snug">
                  These guidance sessions are 100% FREE for students. Experts
                  volunteer their knowledge to help students explore brighter
                  futures.
                </p>
              </div>

              {isStudent && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                  <p className="font-semibold">
                    ⚠️ Logged in as a Student. Please log out to register as an
                    Expert Guide.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(clearAuth());
                      navigate("/become-instructor/apply");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-bold text-xs cursor-pointer"
                  >
                    Log Out & Register
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{buttonLabel}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. WHAT CAN YOU GUIDE STUDENTS ON? ── */}
        <div className="space-y-8 pt-8 border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              WHAT CAN YOU GUIDE STUDENTS ON?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Experts can conduct a FREE guidance session on diverse topics such
              as:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {guidanceTopics.map((topic, idx) => {
              const Icon = topic.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition flex flex-col gap-2.5 group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${topic.color} border flex items-center justify-center shrink-0`}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {topic.desc}
                  </p>
                </div>
              );
            })}

            {/* Any other topic box */}
            <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                <Sparkles size={18} />
                <span>Any Other Topic</span>
              </div>
              <p className="text-xs text-indigo-200/80 leading-relaxed">
                Have a specialized topic in mind? You can propose any topic that
                meaningfully benefits student learning and career clarity.
              </p>
            </div>
          </div>
        </div>

        {/* ── 3. WHO CAN JOIN? ── */}
        <div className="space-y-8 pt-8 border-t border-slate-800/80">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              WHO CAN JOIN?
            </h2>
            <p className="text-slate-400 text-sm">
              We welcome dedicated professionals and mentors from all domains:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
            {whoCanJoinList.map((item, idx) => (
              <div
                key={idx}
                className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition shadow-sm flex items-center gap-2"
              >
                <span className="text-indigo-400 font-black">✦</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. WHY JOIN US? ── */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            WHY JOIN US?
          </h2>
          <p className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300">
            Give Back • Share Experience • Inspire Students • Create Awareness • Make a Difference
          </p>
          <p className="max-w-3xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            These guidance sessions are FREE for students. Experts can contribute
            their knowledge and experience to help students explore better
            academic, career, examination, and skill-development opportunities.
          </p>
        </div>

        {/* ── 5. BENEFITS OF JOINING OUR EXPERT GUIDE NETWORK ── */}
        <div className="space-y-8 pt-8 border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              BECOME AN EXPERT GUIDE
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Benefits of Joining Our Expert Guide Network
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefitsList.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col gap-3.5 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${benefit.color}`}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    {benefit.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 6. FINAL BOTTOM CTA BANNER ── */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#111827] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-black text-white">
              Ready to guide students & shape futures?
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Register in just 3 minutes with your area of expertise.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
