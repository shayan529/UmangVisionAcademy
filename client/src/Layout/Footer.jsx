import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next"; // add this

const Footer = () => {
  const { t } = useTranslation(); // add this

  return (
    <footer className="hidden md:block px-6 md:px-5 py-5 border-t border-slate-800 bg-slate-950">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-10 w-full">
        {/* Logo Section */}
        <div className="flex flex-col items-start gap-4 m-10">
          <div className="w-36 h-36 md:w-48 md:h-48 p-3 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-2xl">
            <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <div className="flex flex-col justify-center leading-tight text-left">
            <span className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-wider uppercase">
              Umang Vision
            </span>
            <span className="shimmer-txt text-xl md:text-2xl lg:text-3xl font-black tracking-wider uppercase mt-1">
              Academy
            </span>
          </div>
        </div>

        {/* Right Side Links */}
        <div className="flex flex-col sm:flex-row gap-12 md:gap-20">
          <div className="m-10">
            <h3 className="font-bold mb-5">{t("footer.platform")}</h3>
            <div className="space-y-3 text-white">
              <Link to="/courses" className="block hover:text-white transition">
                {t("footer.courses")}
              </Link>
              <Link
                to="/about-us"
                className="block hover:text-white transition"
              >
                {t("footer.aboutUs")}
              </Link>
            </div>
          </div>

          <div className="m-10">
            <h3 className="font-bold mb-5">{t("footer.support")}</h3>
            <div className="space-y-3 text-white">
              <Link to="/contact" className="block hover:text-white transition">
                {t("footer.contact")}
              </Link>
              <Link
                to="/help-center"
                className="block hover:text-white transition"
              >
                {t("footer.helpCenter")}
              </Link>
              <Link to="/faq" className="block hover:text-white transition">
                {t("footer.faq")}
              </Link>
            </div>
          </div>

          <div className="m-10">
            <h3 className="font-bold mb-5">{t("footer.legal", "Legal")}</h3>
            <div className="space-y-3 text-white">
              <Link to="/privacy" className="block hover:text-white transition">
                {t("footer.privacyPolicy", "Privacy Policy")}
              </Link>
              <Link to="/terms" className="block hover:text-white transition">
                {t("footer.termsOfService", "Terms of Service")}
              </Link>
              <Link to="/refund-policy" className="block hover:text-white transition">
                {t("footer.refundPolicy", "Refund Policy")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
