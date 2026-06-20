import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchMyApplication } from "../../redux/slices/applicationsSlice";

/* ── Status config ── */
const STATUS_CONFIG = {
  pending: {
    badgeKey: "instructorApplicationStatus.status.pending.badge",
    badgeCls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 7v5l3 3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
    iconCls: "text-amber-300 bg-amber-500/10",
    headlineKey: "instructorApplicationStatus.status.pending.headline",
    subKey: "instructorApplicationStatus.status.pending.sub",
  },
  under_review: {
    badgeKey: "instructorApplicationStatus.status.under_review.badge",
    badgeCls: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path
          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    iconCls: "text-indigo-300 bg-indigo-500/10",
    headlineKey: "instructorApplicationStatus.status.under_review.headline",
    subKey: "instructorApplicationStatus.status.under_review.sub",
  },
  approved: {
    badgeKey: "instructorApplicationStatus.status.approved.badge",
    badgeCls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    iconCls: "text-emerald-300 bg-emerald-500/10",
    headlineKey: "instructorApplicationStatus.status.approved.headline",
    subKey: "instructorApplicationStatus.status.approved.sub",
  },
  rejected: {
    badgeKey: "instructorApplicationStatus.status.rejected.badge",
    badgeCls: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M15 9l-6 6M9 9l6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
    iconCls: "text-rose-300 bg-rose-500/10",
    headlineKey: "instructorApplicationStatus.status.rejected.headline",
    subKey: "instructorApplicationStatus.status.rejected.sub",
  },
};

/* ── Timeline dot ── */
const Dot = ({ done, active }) => (
  <div
    className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-500
    ${done ? "border-indigo-400 bg-indigo-500/20" : ""}
    ${active ? "border-cyan-400 bg-cyan-500/10 ring-4 ring-cyan-500/10" : ""}
    ${!done && !active ? "border-white/10 bg-white/5" : ""}
  `}
  >
    {done ? (
      <svg viewBox="0 0 16 16" className="w-4 h-4 text-indigo-300" fill="none">
        <path
          d="M3 8l3.5 3.5L13 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : active ? (
      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
    ) : (
      <span className="w-2 h-2 rounded-full bg-white/20" />
    )}
  </div>
);

/* ── Build timeline steps from live status ── */
const buildSteps = (status, t) => [
  {
    key: "submitted",
    label: t("instructorApplicationStatus.steps.submitted"),
    done: true,
    active: false,
  },
  {
    key: "under_review",
    label: t("instructorApplicationStatus.steps.underReview"),
    done: ["approved", "rejected"].includes(status),
    active: status === "under_review",
  },
  {
    key: "decision",
    label: t("instructorApplicationStatus.steps.decision"),
    done: ["approved", "rejected"].includes(status),
    active: false,
  },
  {
    key: "onboarding",
    label: t("instructorApplicationStatus.steps.onboarding"),
    done: status === "approved",
    active: false,
  },
];

/* ── Main page ── */
const InstructorApplicationStatus = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { myApplication, loading, error } = useSelector(
    (state) => state.applications,
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    dispatch(fetchMyApplication());
  }, [isAuthenticated, dispatch, navigate]);

  const fmtDate = (iso) => {
    const locale = i18n.language?.startsWith("hi") ? "hi-IN" : "en-IN";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  };

  /* ── Loading ── */
  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <svg
          className="w-8 h-8 animate-spin text-indigo-400"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="rgba(255,255,255,.2)"
            strokeWidth="3"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );

  /* ── No application / error ── */
  if (!myApplication || error)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <p>{error ?? t("instructorApplicationStatus.errors.noApplication")}</p>
        <button
          onClick={() => navigate("/become-instructor/apply")}
          className="rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950"
        >
          {t("instructorApplicationStatus.errors.applyNow")}
        </button>
      </div>
    );

  const status = myApplication.status ?? "pending";
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const steps = buildSteps(status, t);

  const details = [
    {
      label: t("instructorApplicationStatus.details.applicant"),
      value: user?.name ?? myApplication.name ?? "—",
    },
    {
      label: t("instructorApplicationStatus.details.expertise"),
      value: myApplication.expertise ?? "—",
    },
    {
      label: t("instructorApplicationStatus.details.submitted"),
      value: myApplication.createdAt ? fmtDate(myApplication.createdAt) : "—",
    },
    {
      label: t("instructorApplicationStatus.details.response"),
      value: t("instructorApplicationStatus.details.responseValue"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        .df { font-family: 'Outfit', sans-serif; }
        * { font-family: 'DM Sans', sans-serif; }
        @keyframes slide-up { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fade-in  { from { opacity:0 } to { opacity:1 } }
        .su  { animation: slide-up .55s cubic-bezier(.22,1,.36,1) both; }
        .fi  { animation: fade-in .4s ease both; }
      `}</style>

      <main className="max-w-4xl mx-auto px-6 py-16 lg:py-24 space-y-8">
        {/* ── Header ── */}
        <div className="su space-y-1" style={{ animationDelay: ".05s" }}>
          <p className="text-xs uppercase tracking-[.25em] text-indigo-300 font-semibold">
            {t("instructorApplicationStatus.portal")}
          </p>
          <h1 className="df text-4xl font-extrabold text-white">
            {t("instructorApplicationStatus.title")}
          </h1>
        </div>

        {/* ── Status hero card ── */}
        <div
          className="su rounded-[28px] border border-white/10 bg-white/5 p-8 flex flex-col sm:flex-row sm:items-center gap-6"
          style={{
            animationDelay: ".12s",
            boxShadow:
              "0 25px 60px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06)",
          }}
        >
          <div
            className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${cfg.iconCls}`}
          >
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="df text-xl font-bold text-white">
                {t(cfg.headlineKey)}
              </h2>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${cfg.badgeCls}`}
              >
                {t(cfg.badgeKey)}
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-6">{t(cfg.subKey)}</p>
          </div>
        </div>

        {/* ── Two-column: timeline + details ── */}
        <div
          className="su grid gap-6 lg:grid-cols-[1fr_1.1fr]"
          style={{ animationDelay: ".2s" }}
        >
          {/* Timeline */}
          <div
            className="rounded-[28px] border border-white/10 bg-white/5 p-8"
            style={{
              boxShadow:
                "0 4px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.04)",
            }}
          >
            <p className="text-xs uppercase tracking-[.25em] text-indigo-300 font-semibold mb-6">
              {t("instructorApplicationStatus.progress")}
            </p>
            <ol className="space-y-0">
              {steps.map((step, i) => (
                <li key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <Dot done={step.done} active={step.active} />
                    {i < steps.length - 1 && (
                      <div
                        className={`w-px flex-1 my-1 ${step.done ? "bg-indigo-500/40" : "bg-white/8"}`}
                        style={{ minHeight: 32 }}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={`text-sm font-semibold leading-9 ${step.done ? "text-indigo-300" : step.active ? "text-cyan-300" : "text-slate-500"}`}
                    >
                      {step.label}
                    </p>
                    {step.active && (
                      <p className="text-xs text-slate-500 -mt-3">
                        {t("instructorApplicationStatus.steps.inProgress")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Details */}
          <div
            className="rounded-[28px] border border-white/10 bg-white/5 p-8 flex flex-col gap-6"
            style={{
              boxShadow:
                "0 4px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.04)",
            }}
          >
            <div>
              <p className="text-xs uppercase tracking-[.25em] text-indigo-300 font-semibold mb-4">
                {t("instructorApplicationStatus.details.title")}
              </p>
              <dl className="space-y-4">
                {details.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      {label}
                    </dt>
                    <dd className="text-sm text-slate-200 text-right">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {myApplication.reviewNote && (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                <p className="text-xs uppercase tracking-widest text-indigo-300 font-semibold mb-2">
                  {t("instructorApplicationStatus.details.note")}
                </p>
                <p className="text-sm text-slate-300 leading-6">
                  {myApplication.reviewNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── CTA row ── */}
        <div
          className="su flex flex-wrap items-center gap-4"
          style={{ animationDelay: ".28s" }}
        >
          {status === "approved" && (
            <button
              onClick={() => navigate("/instructor-dashboard")}
              className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02] active:scale-[.98]"
            >
              {t("instructorApplicationStatus.cta.dashboard")}
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                <path
                  d="M4 10h12M10 4l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {status === "rejected" && (
            <button
              onClick={() => navigate("/become-instructor/apply")}
              className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02] active:scale-[.98]"
            >
              {t("instructorApplicationStatus.cta.reapply")}
            </button>
          )}
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:border-white/20"
          >
            {t("instructorApplicationStatus.cta.backHome")}
          </button>
          {(status === "pending" || status === "under_review") && (
            <p className="text-xs text-slate-600 ml-auto">
              {t("instructorApplicationStatus.cta.questions")}{" "}
              <Link
                to="/contact"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {t("instructorApplicationStatus.cta.contactSupport")}
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default InstructorApplicationStatus;
