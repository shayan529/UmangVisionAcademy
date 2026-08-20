import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import SEO from "./SEO";

const RefundPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 py-16 px-6">
      <SEO
        title={`${t("refundPolicy.title", "Refund & Cancellation Policy")} | Umang Vision Academy`}
        description="Learn about our 7-day money-back guarantee, wallet refund credit policy, eligibility, and cancellation policy at Umang Vision Academy."
      />

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={16} /> {t("refundPolicy.badge", "100% Satisfaction Guarantee")}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {t("refundPolicy.title", "Refund & Cancellation Policy")}
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            {t(
              "refundPolicy.description",
              "At Umang Vision Academy, we strive to deliver the highest quality education and student satisfaction. All approved refunds are credited directly to your platform Wallet."
            )}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            {t("refundPolicy.lastUpdated", "Last Updated: July 2026")}
          </p>
        </div>

        {/* Highlight Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] space-y-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
              <Clock size={24} />
            </div>
            <h3 className="font-bold text-white text-lg">
              {t("refundPolicy.highlights.windowTitle", "7-Day Refund Window")}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t(
                "refundPolicy.highlights.windowDesc",
                "Request a refund within 7 calendar days of course purchase if you are unsatisfied."
              )}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-violet-500/30 bg-violet-500/10 space-y-3">
            <div className="p-3 rounded-xl bg-violet-500/20 text-violet-300 w-fit">
              <Wallet size={24} />
            </div>
            <h3 className="font-bold text-violet-200 text-lg">
              {t("refundPolicy.highlights.walletTitle", "Instant Wallet Credit")}
            </h3>
            <p className="text-sm text-violet-300/80 leading-relaxed">
              {t(
                "refundPolicy.highlights.walletDesc",
                "Approved refunds are credited directly & instantly to your Umang Vision Academy Wallet balance."
              )}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 w-fit">
              <HelpCircle size={24} />
            </div>
            <h3 className="font-bold text-white text-lg">
              {t("refundPolicy.highlights.supportTitle", "Dedicated Support")}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t(
                "refundPolicy.highlights.supportDesc",
                "Submit your request via our Help Center or email support@umangvisionacademy.com."
              )}
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-slate-300 leading-relaxed border-t border-slate-800 pt-10">

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-cyan-400">Refund Policy — Umang Vision Academy</h2>
            <p className="text-sm text-slate-400 font-medium">Effective</p>

            <div className="mt-4 grid gap-4">
              <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-4">
                <h3 className="font-semibold">1. Course Enrollment</h3>
                <p className="text-sm text-slate-300 mt-1">Once the student completes the enrollment and payment, the admission is considered confirmed.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-4">
                <h3 className="font-semibold">2. Refund</h3>
                <p className="text-sm text-slate-300 mt-1">Umang Vision Academy does not provide refunds.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-4">
                <h3 className="font-semibold">3. Non-Refundable Fees</h3>
                <p className="text-sm text-slate-300 mt-1">Registration fees, admission fees, processing charges, and applicable administrative charges are non-refundable.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-4">
                <h3 className="font-semibold">4. Refund Request</h3>
                <p className="text-sm text-slate-300 mt-1">Students or parents must submit a refund request through the academy's official contact channel along with the required enrollment and payment details.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-4">
                <h3 className="font-semibold">5. Course Access</h3>
                <p className="text-sm text-slate-300 mt-1">Once the student has accessed classes, recorded lectures, study material, tests, or other digital resources, the fee may become non-refundable.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-4">
                <h3 className="font-semibold">6. Refund Processing</h3>
                <p className="text-sm text-slate-300 mt-1">If a refund is approved, it will be processed through the original payment method or another authorized digital payment mode. Processing time may depend on the bank or payment provider.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-4">
                <h3 className="font-semibold">7. Contact for Refund Queries</h3>
                <p className="text-sm text-slate-300 mt-1">For any refund-related query, students or parents may contact Umang Vision Academy through the official contact details provided by the academy.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-800">
            <h2 className="text-xl font-bold text-white">Have questions?</h2>
            <p className="text-slate-400">
              For assistance, contact us at <span className="font-semibold">support@umangvisionacademy.com</span> or visit our
              <Link to="/contact" className="text-cyan-400 hover:underline font-semibold ml-1"> Contact Page →</Link>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
