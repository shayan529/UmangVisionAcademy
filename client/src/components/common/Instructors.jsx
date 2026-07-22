import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  GraduationCap,
  Sparkles,
  Bot,
  Video,
  BarChart3,
  Users,
  Star,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

const Instructor = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      title: t("instructor.benefit1.title", "AI Teaching Tools"),
      desc: t(
        "instructor.benefit1.desc",
        "Use AI tools for quizzes, summaries, captions, and instant student doubt resolution."
      ),
      icon: Bot,
      color: "#818cf8",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      title: t("instructor.benefit2.title", "Live Classes & Webinars"),
      desc: t(
        "instructor.benefit2.desc",
        "Host live mentorship sessions, interactive webinars, and real-time Q&A workshops."
      ),
      icon: Video,
      color: "#38bdf8",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    },
    {
      title: t("instructor.benefit3.title", "Advanced Analytics Dashboard"),
      desc: t(
        "instructor.benefit3.desc",
        "Track course enrollments, student completion velocity, and revenue analytics."
      ),
      icon: BarChart3,
      color: "#4ade80",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="bg-[#0B1120] text-slate-100 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* ── HERO SECTION ── */}
      <section className="px-6 md:px-10 py-20 lg:py-24 relative z-10">
        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
          
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <GraduationCap size={16} />
              {t("instructor.tag", "Teach & Inspire Millions")}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              {t("instructor.headingLine1", "Become An")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                {t("instructor.headingGradient", "Instructor")}
              </span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl">
              {t(
                "instructor.description",
                "Share your expertise, build your community, host live sessions and use AI tools to create engaging courses. Join us and inspire millions of students worldwide."
              )}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/become-instructor"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t("instructor.startTeaching", "Start Teaching")}</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/become-instructor"
                className="inline-flex items-center justify-center px-7 py-4 rounded-2xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-bold text-sm transition"
              >
                {t("instructor.learnMore", "Learn More")}
              </Link>
            </div>
          </div>

          {/* Right Dashboard Console Mockup */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[36px] blur-xl opacity-25 group-hover:opacity-45 transition duration-1000" />

            <div className="relative rounded-[32px] border border-slate-800/90 bg-[#111827]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-400" />
                    {t("instructor.dashboardTitle", "Instructor Dashboard")}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t("instructor.dashboardSubtitle", "Course Analytics & Management")}
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {t("instructor.statusActive", "Active")}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-indigo-400">
                    <Users size={20} />
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      +14% mo
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">12K+</div>
                  <div className="text-xs text-slate-400 font-medium">
                    {t("instructor.studentsTitle", "Students Enrolled")}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-amber-400">
                    <Star size={20} className="fill-amber-400" />
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Top Rated
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">4.9 / 5</div>
                  <div className="text-xs text-slate-400 font-medium">
                    {t("instructor.ratingTitle", "Instructor Rating")}
                  </div>
                </div>
              </div>

              {/* AI Teaching Assistant Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 p-5 text-white shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-base flex items-center gap-2">
                    <Bot size={18} />
                    {t("instructor.assistantTitle", "AI Teaching Assistant")}
                  </h4>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/20">
                    Included
                  </span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  {t(
                    "instructor.assistantDesc",
                    "AI-generated quizzes, automatic subtitles, and interactive course summaries."
                  )}
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── BENEFITS SECTION ── */}
      <section className="px-6 md:px-10 pb-20 lg:pb-24 relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} />
              {t("instructor.benefitsTag", "Why Teach With Us?")}
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {t("instructor.benefitsHeading", "Instructor Benefits")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="group p-6 sm:p-8 rounded-3xl border border-slate-800/80 bg-[#111827]/80 backdrop-blur-md hover:-translate-y-1.5 hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300 space-y-4"
                >
                  <div className={`w-14 h-14 rounded-2xl ${benefit.bg} ${benefit.border} border flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={26} style={{ color: benefit.color }} />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

    </div>
  );
};

export default Instructor;
