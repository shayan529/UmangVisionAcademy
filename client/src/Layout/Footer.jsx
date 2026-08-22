import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="hidden sm:block w-full bg-slate-950 border-t border-slate-800/80 text-slate-300 py-8 sm:py-12 px-4 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 lg:gap-14 items-start">
        
        {/* Column 1: Logo Section */}
        <div className="col-span-2 sm:col-span-1 flex flex-col items-start gap-4">
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 p-2 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-2xl transition-transform hover:scale-105">
            <img
              src="/Logo.png"
              alt="Umang Vision Academy Logo"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Column 2: Platform Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-white tracking-wider uppercase border-b border-indigo-500/30 pb-2 inline-block">
            {t("footer.platform", "Platform")}
          </h3>
          <div className="flex flex-col space-y-2.5 text-sm font-medium text-slate-400">
            <Link
              to="/courses"
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              {t("footer.courses", "Courses")}
            </Link>
            <Link
              to="/plans"
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              {t("nav.plans", "Plans")}
            </Link>
            <Link
              to="/question-bank"
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              {t("nav.questionBank", "Question Bank")}
            </Link>
            <Link
              to="/about-us"
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              {t("footer.aboutUs", "About Us")}
            </Link>
            <Link
              to="/become-instructor"
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              {t("nav.becomeInstructor", "Become an Expert Guide")}
            </Link>
            <Link
              to="/donate"
              className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors duration-200 flex items-center gap-1"
            >
              <span>{t("nav.donateCharity", "Donate & Charity")}</span>
              <span>💖</span>
            </Link>
          </div>
        </div>

        {/* Column 3: Support Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-white tracking-wider uppercase border-b border-indigo-500/30 pb-2 inline-block">
            {t("footer.support", "Support")}
          </h3>
          <div className="flex flex-col space-y-2.5 text-sm font-medium text-slate-400">
            <Link
              to="/contact"
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              {t("footer.contact", "Contact Us")}
            </Link>
            <Link
              to="/help-center"
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              {t("footer.helpCenter", "Help Center")}
            </Link>
            <Link
              to="/faq"
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              {t("footer.faq", "FAQ")}
            </Link>
          </div>
        </div>

        {/* Column 4: Legal Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-white tracking-wider uppercase border-b border-indigo-500/30 pb-2 inline-block">
            {t("footer.legal", "Legal")}
          </h3>
          <div className="flex flex-col space-y-2.5 text-sm font-medium text-slate-400">
            <Link
              to="/privacy"
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              {t("footer.privacyPolicy", "Privacy Policy")}
            </Link>
            <Link
              to="/terms"
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              {t("footer.termsOfService", "Terms of Service")}
            </Link>
            <Link
              to="/refund-policy"
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              {t("footer.refundPolicy", "Refund Policy")}
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom Copyright Divider */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© {new Date().getFullYear()} Umang Vision Academy. {t("footer.allRightsReserved", "All rights reserved.")}</p>
        <p className="text-slate-500">{t("becomeInstructor.heroBadge", "Free Student Guidance Initiative")}</p>
      </div>
    </footer>
  );
};

export default Footer;
