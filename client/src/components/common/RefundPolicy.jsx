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

          {/* Section 1: Eligibility */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
              <CheckCircle2 size={22} className="text-cyan-400" />
              {t("refundPolicy.sections.eligibility.title", "1. Refund Eligibility")}
            </h2>
            <p>
              {t(
                "refundPolicy.sections.eligibility.intro",
                "To be eligible for a refund on any course or batch purchased on Umang Vision Academy:"
              )}
            </p>
            <ul className="list-disc ml-6 space-y-2 text-slate-300">
              <li>{t("refundPolicy.sections.eligibility.item1", "The request must be submitted within 7 calendar days from the date of purchase.")}</li>
              <li>{t("refundPolicy.sections.eligibility.item2", "You must have completed less than 25% of the total course video/lesson content.")}</li>
              <li>{t("refundPolicy.sections.eligibility.item3", "Course certificates or downloadable bonus materials must not have been claimed.")}</li>
            </ul>
          </section>

          {/* Section 2: Wallet Refund Policy */}
          <section className="p-6 rounded-2xl border border-violet-500/30 bg-violet-950/30 space-y-3">
            <h2 className="text-2xl font-bold text-violet-300 flex items-center gap-2">
              <Wallet size={24} className="text-violet-400" />
              {t("refundPolicy.sections.walletCredit.title", "2. Wallet Refund Policy (Wallet Credit Only)")}
            </h2>
            <p className="text-violet-200/90 leading-relaxed">
              {t(
                "refundPolicy.sections.walletCredit.body",
                "All approved refunds will be credited exclusively to your Umang Vision Academy Wallet balance. Wallet funds can be used immediately to purchase any other course, mock test series, or batch on our platform. Wallet credits are non-transferable and non-refundable to external bank accounts."
              )}
            </p>
          </section>

          {/* Section 3: Non-Refundable Items */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
              <AlertCircle size={22} className="text-cyan-400" />
              {t("refundPolicy.sections.nonRefundable.title", "3. Non-Refundable Items")}
            </h2>
            <p>
              {t(
                "refundPolicy.sections.nonRefundable.intro",
                "The following items and services are strictly non-refundable:"
              )}
            </p>
            <ul className="list-disc ml-6 space-y-2 text-slate-300">
              <li>{t("refundPolicy.sections.nonRefundable.item1", "One-on-one live tutoring or doubt-clearing sessions already conducted.")}</li>
              <li>{t("refundPolicy.sections.nonRefundable.item2", "Attempted mock test paper submissions or evaluated test series.")}</li>
              <li>{t("refundPolicy.sections.nonRefundable.item3", "Printed study materials or physical books shipped to your address.")}</li>
              <li>{t("refundPolicy.sections.nonRefundable.item4", "Refund requests submitted after the 7-day refund window.")}</li>
            </ul>
          </section>

          {/* Section 4: Refund Request Process */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
              <ArrowRight size={22} className="text-cyan-400" />
              {t("refundPolicy.sections.process.title", "4. Refund Request Process")}
            </h2>
            <p>
              {t(
                "refundPolicy.sections.process.intro",
                "To request a refund to your wallet, follow these simple steps:"
              )}
            </p>
            <ol className="list-decimal ml-6 space-y-2 text-slate-300">
              <li>
                {t("refundPolicy.sections.process.step1", "Visit the Contact Page or email support@umangvisionacademy.com.")}
              </li>
              <li>
                {t("refundPolicy.sections.process.step2", "Provide your Order ID, registered email address, and reason for the request.")}
              </li>
              <li>
                {t("refundPolicy.sections.process.step3", "Our team will review your eligibility within 24-48 hours.")}
              </li>
              <li>
                {t("refundPolicy.sections.process.step4", "Once approved, the refund amount will be credited directly into your Wallet balance.")}
              </li>
            </ol>
          </section>

          {/* Section 5: Course Exchanges & Upgrades */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-cyan-400">
              {t("refundPolicy.sections.exchanges.title", "5. Course Exchanges & Upgrades")}
            </h2>
            <p>
              {t(
                "refundPolicy.sections.exchanges.body",
                "If you accidentally purchased the wrong subject or class batch, you can request an instant course transfer or upgrade within 7 days without needing a cancellation. Contact our support team for immediate assistance."
              )}
            </p>
          </section>

          {/* Section 6: Contact */}
          <section className="space-y-3 pt-6 border-t border-slate-800">
            <h2 className="text-xl font-bold text-white">
              {t("refundPolicy.sections.contact.title", "Have questions?")}
            </h2>
            <p className="text-slate-400">
              {t(
                "refundPolicy.sections.contact.body",
                "If you have any questions regarding our Refund Policy or Wallet balance, please contact us at support@umangvisionacademy.com or visit our Contact Page."
              )}{" "}
              <Link to="/contact" className="text-cyan-400 hover:underline font-semibold ml-1">
                Contact Page →
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
