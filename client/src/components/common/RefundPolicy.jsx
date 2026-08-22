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
    <div className="min-h-screen bg-[#070c18] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <SEO
        title="Refund Policy | Umang Vision Academy"
        description="Official Refund & Admission Policy for Umang Vision Academy."
      />

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ── Header Hero Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/60 via-[#0d1627] to-[#070c18] border border-indigo-500/20 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert size={14} className="text-amber-400" /> Official Terms
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Refund Policy – Umang Vision Academy
            </h1>

            <div className="text-sm font-semibold text-slate-400 flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Umang Vision Academy</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-bold">Effective</span>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed pt-2 border-t border-slate-800/80">
              This policy outlines the official terms regarding course enrollment, fee structures, and refund requests at <strong>Umang Vision Academy</strong>.
            </p>
          </div>
        </div>

        {/* ── 7 Section Cards ── */}
        <div className="space-y-4">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.num}
                className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-lg hover:border-slate-700/80 transition flex items-start gap-4"
              >
                <div
                  className={`w-11 h-11 rounded-xl ${sec.bg} border flex items-center justify-center shrink-0 mt-0.5`}
                >
                  <Icon size={22} className={sec.color} />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                      #{sec.num}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {sec.title}
                    </h2>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {sec.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Contact Footer Box ── */}
        <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail size={18} className="text-indigo-400" /> Have Questions Regarding Refund Queries?
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            For any refund-related queries or official requests, students or parents may reach out to us through our official support channels.
          </p>
          <div className="pt-2">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold transition shadow-md"
            >
              <span>Contact Support</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-slate-500 text-xs py-4 border-t border-slate-800">
          © {new Date().getFullYear()} Umang Vision Academy. All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default RefundPolicy;
