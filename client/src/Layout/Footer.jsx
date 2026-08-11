import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="hidden md:block border-t border-slate-800/80 bg-[#070c18] text-slate-300 py-12 px-6 lg:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-12">
        {/* ── Prominent Logo Section ── */}
        <div className="flex flex-col items-center md:items-start shrink-0">
          <Link
            to="/"
            className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl hover:border-indigo-500/40 hover:scale-[1.02] transition-all duration-300 group"
          >
            <img
              src="/Logo.png"
              alt="Umang Vision Academy Logo"
              className="w-full h-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>

        {/* ── Navigation Link Columns ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-16 lg:gap-24 w-full md:w-auto pt-2">
          {/* Platform Column */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 mb-4">
              {t("footer.platform", "Platform")}
            </h3>
            <ul className="space-y-3 text-sm font-medium text-slate-400">
              <li>
                <Link
                  to="/courses"
                  className="hover:text-indigo-300 hover:translate-x-0.5 inline-block transition-all duration-200"
                >
                  {t("footer.courses", "Courses")}
                </Link>
              </li>
              <li>
                <Link
                  to="/about-us"
                  className="hover:text-indigo-300 hover:translate-x-0.5 inline-block transition-all duration-200"
                >
                  {t("footer.aboutUs", "About Us")}
                </Link>
              </li>
              <li>
                <Link
                  to="/plans"
                  className="hover:text-indigo-300 hover:translate-x-0.5 inline-block transition-all duration-200"
                >
                  {t("footer.plans", "Subscription Plans")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 mb-4">
              {t("footer.support", "Support")}
            </h3>
            <ul className="space-y-3 text-sm font-medium text-slate-400">
              <li>
                <Link
                  to="/contact"
                  className="hover:text-indigo-300 hover:translate-x-0.5 inline-block transition-all duration-200"
                >
                  {t("footer.contact", "Contact Us")}
                </Link>
              </li>
              <li>
                <Link
                  to="/help-center"
                  className="hover:text-indigo-300 hover:translate-x-0.5 inline-block transition-all duration-200"
                >
                  {t("footer.helpCenter", "Help Center")}
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="hover:text-indigo-300 hover:translate-x-0.5 inline-block transition-all duration-200"
                >
                  {t("footer.faq", "FAQ")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 mb-4">
              {t("footer.legal", "Legal")}
            </h3>
            <ul className="space-y-3 text-sm font-medium text-slate-400">
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-indigo-300 hover:translate-x-0.5 inline-block transition-all duration-200"
                >
                  {t("footer.privacyPolicy", "Privacy Policy")}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-indigo-300 hover:translate-x-0.5 inline-block transition-all duration-200"
                >
                  {t("footer.termsOfService", "Terms of Service")}
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="hover:text-indigo-300 hover:translate-x-0.5 inline-block transition-all duration-200"
                >
                  {t("footer.refundPolicy", "Refund Policy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom Copyright Bar ── */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© {new Date().getFullYear()} Umang Vision Academy. All rights reserved.</p>
        <p className="text-slate-600">Empowering education through AI & Innovation.</p>
      </div>
    </footer>
  );
};

export default Footer;
