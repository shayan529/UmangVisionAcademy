import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

const ReferralPage = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);

  const referralCode = user?.referralCode || "—";
  const referralLink = referralCode
    ? `${window.location.origin}/signup?ref=${encodeURIComponent(referralCode)}`
    : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success(t("studentReferral.linkCopied"));
    } catch (err) {
      toast.error(t("studentReferral.copyFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#1e293b] bg-[#111827] p-8">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t("studentReferral.title")}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white">
            {t("studentReferral.header")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400 max-w-2xl">
            {t("studentReferral.description")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#243145] bg-[#0f172a] p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {t("studentReferral.summaryTitle")}
            </p>
            <p className="mt-4 text-4xl font-bold text-white">
              {(user?.referralsCount ?? 0) * 50}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {t("studentReferral.summaryCoins")}
            </p>
            <div className="mt-5 rounded-2xl border border-[#2a3e5c] bg-[#111827] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {t("studentReferral.referralCode")}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {referralCode}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#243145] bg-[#0f172a] p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {t("studentReferral.referralCode")}
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {referralCode}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {t("studentReferral.referralsCount", {
                count: user?.referralsCount ?? 0,
              })}
            </p>
          </div>

          <div className="rounded-2xl border border-[#243145] bg-[#0f172a] p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {t("studentReferral.share")}
            </p>
            <div className="mt-3 rounded-2xl border border-[#2a3e5c] bg-[#111827] p-4 text-sm text-slate-200 break-words">
              {referralLink || t("studentReferral.noReferralCode")}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!referralLink}
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("studentReferral.copyLink")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;
