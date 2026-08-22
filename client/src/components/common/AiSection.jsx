import React from "react";
import { useTranslation } from "react-i18next";
import {
  Bot,
  FileText,
  Mic,
  BookOpen,
  FileCheck,
  BarChart3,
  Sparkles,
  Zap,
  CheckCircle2,
  Brain,
  MessageSquare,
  ArrowRight,
  Flame,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";

const AISection = () => {
  const { t } = useTranslation();

  const aiFeatures = [
    {
      title: t("aiSection.feature1.title", "24/7 AI Tutor"),
      desc: t(
        "aiSection.feature1.desc",
        "Ask any question in physics, math, chemistry, or biology and get instant step-by-step answers."
      ),
      icon: Bot,
      color: "#818cf8",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      title: t("aiSection.feature2.title", "Smart Quiz Generator"),
      desc: t(
        "aiSection.feature2.desc",
        "Generate custom practice quizzes tailored to your specific class, board, and subject."
      ),
      icon: FileText,
      color: "#c084fc",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      title: t("aiSection.feature3.title", "Voice Doubt Clearing"),
      desc: t(
        "aiSection.feature3.desc",
        "Speak your questions naturally and listen to clear, interactive audio explanations."
      ),
      icon: Mic,
      color: "#38bdf8",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    },
    {
      title: t("aiSection.feature4.title", "Concept Breakdown"),
      desc: t(
        "aiSection.feature4.desc",
        "Simplifies complex scientific formulas and theorems into bite-sized visual summaries."
      ),
      icon: BookOpen,
      color: "#4ade80",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: t("aiSection.feature5.title", "Question Paper Scanner"),
      desc: t(
        "aiSection.feature5.desc",
        "Upload past question papers or handwritten doubts for instant AI solutions."
      ),
      icon: FileCheck,
      color: "#facc15",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: t("aiSection.feature6.title", "Real-time AI Analytics"),
      desc: t(
        "aiSection.feature6.desc",
        "Track your learning velocity, weak topics, and mastery level in real time."
      ),
      icon: BarChart3,
      color: "#f472b6",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
    },
  ];

  return (
    <section className="relative px-4 sm:px-6 md:px-10 py-12 sm:py-16 md:py-24 bg-[#0B1120] overflow-hidden text-slate-100">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start relative z-10">

        {/* ── LEFT: Interactive AI Assistant Console Mockup & Upcoming Exams Card ── */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* Card 1: AI Assistant Console Mockup */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl sm:rounded-[36px] blur-xl opacity-30 group-hover:opacity-50 transition duration-1000" />

            <div className="relative rounded-2xl sm:rounded-[32px] border border-slate-800/90 bg-[#0f172a]/90 backdrop-blur-2xl p-4 sm:p-6 lg:p-8 shadow-2xl space-y-4 sm:space-y-6">
              
              {/* Top Console Bar */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800 gap-2 flex-wrap">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-400 flex items-center gap-1.5 truncate">
                    <Brain size={14} className="text-indigo-400 shrink-0" />
                    {t("aiSection.panelTitle", "AI Learning Assistant")}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10.5px] sm:text-xs font-bold">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {t("aiSection.statusOnline", "AI Engine Online")}
                </div>
              </div>

              {/* Simulated AI Chat Box */}
              <div className="space-y-3">
                {/* User Question Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl rounded-tr-none bg-indigo-600 p-3 sm:p-3.5 text-xs sm:text-sm text-white shadow-md">
                    <p className="font-medium">
                      Can you explain Newton's 3rd Law with a simple real-world example?
                    </p>
                  </div>
                </div>

                {/* AI Response Bubble */}
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg mt-1">
                    <Bot size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl rounded-tl-none bg-slate-800/90 border border-slate-700/60 p-3 sm:p-4 text-xs sm:text-sm text-slate-200 shadow-md space-y-2">
                    <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] text-indigo-400 font-bold">
                      <span>AI Tutor Response</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Zap size={12} className="text-amber-400 fill-amber-400" /> 0.8s
                      </span>
                    </div>
                    <p className="leading-relaxed">
                      <strong>For every action force, there is an equal and opposite reaction force.</strong> 🚀
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Example: When a swimmer pushes water backward with their hands (Action), the water pushes the swimmer forward with equal force (Reaction).
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Stats Cards */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-xl sm:text-2xl font-black text-indigo-400 flex items-center gap-1.5">
                    &lt;1.2s
                  </div>
                  <div className="text-[10.5px] sm:text-xs text-slate-400 font-medium leading-tight">
                    {t("aiSection.supportStatTitle", "Instant Doubt Resolution")}
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-xl sm:text-2xl font-black text-cyan-400 flex items-center gap-1.5">
                    99.4%
                  </div>
                  <div className="text-[10.5px] sm:text-xs text-slate-400 font-medium leading-tight">
                    {t("aiSection.tutorProgress", "Concept Accuracy Rate")}
                  </div>
                </div>
              </div>

              {/* Smart Recommendation Banner */}
              <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 p-3.5 sm:p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-lg">
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm md:text-base">
                    {t("aiSection.recommendationsTitle", "Smart AI Recommendations")}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-white/80 mt-0.5 leading-relaxed">
                    {t("aiSection.recommendationsDesc", "AI analyzes your test scores to auto-generate targeted revision modules.")}
                  </p>
                </div>

                <Link
                  to="/student-dashboard/ai-tutor"
                  className="px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition shrink-0 flex items-center gap-1 self-stretch sm:self-auto justify-center"
                >
                  Try AI <ArrowRight size={14} />
                </Link>
              </div>

            </div>
          </div>

          {/* Card 2: NEW Standalone Card for Upcoming Competitive Exams */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl sm:rounded-3xl blur-md opacity-25 group-hover:opacity-45 transition duration-500" />
            
            <div className="relative rounded-2xl sm:rounded-3xl border border-indigo-500/30 bg-[#0d1627]/95 backdrop-blur-2xl p-4 sm:p-5 space-y-3.5 shadow-2xl">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Flame size={16} className="text-amber-400 animate-pulse" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                    Upcoming Competitive Exams 2026-2027
                  </h4>
                </div>
                <span className="text-[10px] font-extrabold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full shrink-0">
                  Target 2027
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {[
                  {
                    name: "JEE Main & Adv 2027",
                    date: "Jan & Apr 2027",
                    badge: "Engineering",
                    status: "Open Soon",
                    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
                  },
                  {
                    name: "NEET UG 2027",
                    date: "May 2027",
                    badge: "Medical",
                    status: "App Live",
                    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
                  },
                  {
                    name: "CUET (UG) 2027",
                    date: "May - June 2027",
                    badge: "University",
                    status: "Syllabus Out",
                    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
                  },
                  {
                    name: "CBSE Boards 2027",
                    date: "Feb - Mar 2027",
                    badge: "Class 10/12",
                    status: "Timetable Out",
                    color: "text-sky-400 border-sky-500/30 bg-sky-500/10",
                  },
                ].map((exam, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition flex flex-col justify-between space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-slate-100 truncate text-[11.5px]">
                        {exam.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${exam.color}`}>
                        {exam.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-500 shrink-0" />
                        {exam.date}
                      </span>
                      <span className="text-slate-500 text-[10px]">{exam.badge}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-1 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-medium truncate hidden sm:inline">
                  Structured batches & test series available
                </span>
                <Link
                  to="/courses"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md whitespace-nowrap shrink-0"
                >
                  <span>Explore Exam Batches</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Header & Feature Cards Grid ── */}
        <div className="space-y-6 sm:space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={14} />
              {t("aiSection.tag", "AI-POWERED LEARNING ENGINE")}
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {t("aiSection.heading", "Next-Gen AI Tutor Built for Academic Success")}
            </h2>

            <p className="text-slate-400 text-sm sm:text-base lg:text-lg mt-3 sm:mt-4 leading-relaxed">
              {t(
                "aiSection.description",
                "Unlock personalized, instant study assistance 24/7. From step-by-step doubt resolution to automated practice quizzes and voice-guided explanations."
              )}
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {aiFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800/80 bg-[#111827]/80 backdrop-blur-md hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-lg transition-all duration-300 space-y-2.5 sm:space-y-3"
                >
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${feature.bg} ${feature.border} border flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className="sm:w-[22px] sm:h-[22px]" style={{ color: feature.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default AISection;
