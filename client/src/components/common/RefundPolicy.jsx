import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Lock,
  RefreshCw,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import SEO from "./SEO";

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Refund Policy | Umang Vision Academy";
  }, []);

  const sections = [
    {
      num: 1,
      title: "Course Enrollment",
      content:
        "Once the student completes the enrollment and payment, the admission is considered confirmed.",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      num: 2,
      title: "Refund",
      content: "Umang Vision Academy does not provide refunds.",
      icon: XCircle,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
    {
      num: 3,
      title: "Non-Refundable Fees",
      content:
        "Registration fees, admission fees, processing charges, and applicable administrative charges are non-refundable.",
      icon: AlertCircle,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      num: 4,
      title: "Refund Request",
      content:
        "Students or parents must submit a refund request through the academy’s official contact channel along with the required enrollment and payment details.",
      icon: Send,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      num: 5,
      title: "Course Access",
      content:
        "Once the student has accessed classes, recorded lectures, study material, tests, or other digital resources, the fee may become non-refundable.",
      icon: Lock,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
    },
    {
      num: 6,
      title: "Refund Processing",
      content:
        "If a refund is approved, it will be processed through the original payment method or another authorized digital payment mode. Processing time may depend on the bank or payment provider.",
      icon: RefreshCw,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      num: 7,
      title: "Contact for Refund Queries",
      content:
        "For any refund-related query, students or parents may contact Umang Vision Academy through the official contact details provided by the academy.",
      icon: Mail,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 py-6 sm:py-10 px-3.5 sm:px-6 md:px-8 font-sans">
      <SEO
        title="Refund Policy | Umang Vision Academy"
        description="Official Refund & Admission Policy for Umang Vision Academy."
      />

      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
        
        {/* ── Header Hero Banner ── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-900/60 via-[#0d1627] to-[#070c18] border border-indigo-500/20 p-4 sm:p-8 md:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 sm:w-64 h-48 sm:h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <ShieldAlert size={14} className="text-amber-400 shrink-0" /> Official Terms
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Refund Policy – Umang Vision Academy
            </h1>

            <div className="text-xs sm:text-sm font-semibold text-slate-400 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Sparkles size={14} className="text-indigo-400 shrink-0" />
                Umang Vision Academy
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-amber-400 font-bold text-[11px] sm:text-sm">Effective</span>
            </div>

            <p className="text-slate-300 text-xs sm:text-base leading-relaxed pt-2 border-t border-slate-800/80">
              This policy outlines the official terms regarding course enrollment, fee structures, and refund requests at <strong>Umang Vision Academy</strong>.
            </p>
          </div>
        </div>

        {/* ── 7 Section Cards ── */}
        <div className="space-y-3 sm:space-y-4">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.num}
                className="bg-[#0b1324] border border-slate-800/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:border-slate-700/80 transition flex items-start gap-3 sm:gap-4"
              >
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl ${sec.bg} border flex items-center justify-center shrink-0 mt-0.5`}
                >
                  <Icon size={20} className={`${sec.color} sm:w-[22px] sm:h-[22px]`} />
                </div>

                <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      #{sec.num}
                    </span>
                    <h2 className="text-sm sm:text-lg font-bold text-white">
                      {sec.title}
                    </h2>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    {sec.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Contact Details Box ── */}
        <div className="bg-[#0b1324] border border-slate-800/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Mail size={18} className="text-indigo-400 shrink-0" /> Contact for Refund Queries
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            For any refund-related queries or official requests, students or parents may reach out directly to <strong>Umang Vision Academy</strong> via email or phone:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href="mailto:umangvisionacademy@gmail.com"
              className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[#0d172c] border border-indigo-500/20 hover:border-indigo-500/50 transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 group-hover:scale-105 transition-transform">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Official Email</p>
                <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                  umangvisionacademy@gmail.com
                </p>
              </div>
            </a>

            <a
              href="tel:+919153000000"
              className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[#0d172c] border border-emerald-500/20 hover:border-emerald-500/50 transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-105 transition-transform">
                <Phone size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Contact Support Line</p>
                <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                  +91 91530 00000
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-slate-500 text-[11px] sm:text-xs py-4 border-t border-slate-800">
          © {new Date().getFullYear()} Umang Vision Academy. All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default RefundPolicy;
