import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../redux/slices/authSlice";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);

  const isInstructorDashboard = pathname.startsWith("/instructor-dashboard");

  const role = user?.roles;
  const hasInstructorRole = role?.includes("instructor");
  const hasStudentRole = role?.includes("student");
  const hasAdminRole = role?.includes("admin");
  const isMultiRole = hasInstructorRole && hasStudentRole && !hasAdminRole;

  const dashboardPath = hasAdminRole
    ? "/admin-dashboard"
    : hasInstructorRole
      ? "/instructor-dashboard"
      : "/student-dashboard";

  const dropdownRef = useRef(null);
  const languageRef = useRef(null);
  const { t, i18n } = useTranslation();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setBoardOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMobile = () => setMobileMenuOpen(false);
  const currentLanguage = i18n.language?.startsWith("hi") ? "hi" : "en";
  const isHindi = currentLanguage === "hi";
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangDropdownOpen(false);
  };

  // ── Switch-role button: golden when going TO instructor, indigo when going TO student
  const switchTarget = isInstructorDashboard
    ? "/student-dashboard"
    : "/instructor-dashboard";
  const switchLabel = isInstructorDashboard
    ? t("nav.goToStudentDashboard")
    : t("nav.goToInstructorDashboard");
  const goingToInstructor = !isInstructorDashboard; // about to switch TO instructor

  return (
    <nav className="w-full sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-lg border-b border-white/10">
      {/* Keyframes for shimmer effect */}
      <style>{`
        @keyframes shimmer-gold {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes shimmer-indigo {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes shimmer-red {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .btn-gold {
          background: linear-gradient(
            105deg,
            #92400e 0%,
            #b45309 15%,
            #fbbf24 30%,
            #fef08a 45%,
            #fbbf24 55%,
            #d97706 70%,
            #92400e 85%,
            #fbbf24 100%
          );
          background-size: 200% auto;
          animation: shimmer-gold 5s linear infinite;
          color: #1c0a00;
          font-weight: 700;
          border: 1px solid #fde68a60;
          box-shadow:
            0 0 12px rgba(251,191,36,.55),
            0 0 28px rgba(251,191,36,.25),
            inset 0 1px 0 rgba(255,255,255,.35);
          text-shadow: 0 1px 2px rgba(255,255,255,.3);
        }
        .btn-gold:hover {
          box-shadow:
            0 0 18px rgba(251,191,36,.75),
            0 0 40px rgba(251,191,36,.35),
            inset 0 1px 0 rgba(255,255,255,.4);
          transform: scale(1.045);
        }
        .btn-indigo-shine {
          background: linear-gradient(
            105deg,
            #3730a3 0%,
            #4f46e5 20%,
            #818cf8 40%,
            #c7d2fe 50%,
            #818cf8 60%,
            #4f46e5 80%,
            #3730a3 100%
          );
          background-size: 200% auto;
          animation: shimmer-indigo 5s linear infinite;
          color: #fff;
          font-weight: 700;
          border: 1px solid #818cf840;
          box-shadow:
            0 0 10px rgba(99,102,241,.5),
            0 0 24px rgba(99,102,241,.2),
            inset 0 1px 0 rgba(255,255,255,.2);
        }
        .btn-indigo-shine:hover {
          box-shadow:
            0 0 16px rgba(99,102,241,.7),
            0 0 36px rgba(99,102,241,.3),
            inset 0 1px 0 rgba(255,255,255,.25);
          transform: scale(1.045);
        }
        .btn-red {
          background: linear-gradient(
            105deg,
            #7f1d1d 0%,
            #b91c1c 15%,
            #ef4444 30%,
            #fca5a5 45%,
            #ef4444 55%,
            #dc2626 70%,
            #7f1d1d 85%,
            #ef4444 100%
          );
          background-size: 200% auto;
          animation: shimmer-red 5s linear infinite;
          color: #fff;
          font-weight: 700;
          border: 1px solid #fca5a540;
          box-shadow:
            0 0 12px rgba(239,68,68,.55),
            0 0 28px rgba(239,68,68,.25),
            inset 0 1px 0 rgba(255,255,255,.2);
        }
        .btn-red:hover {
          box-shadow:
            0 0 18px rgba(239,68,68,.75),
            0 0 40px rgba(239,68,68,.35),
            inset 0 1px 0 rgba(255,255,255,.25);
          transform: scale(1.045);
        }
        .btn-gold, .btn-indigo-shine, .btn-red {
          transition: transform .2s ease, box-shadow .2s ease;
          white-space: nowrap;
          border-radius: 0.75rem;
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>

      <div className="w-full px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-black font-bold text-lg md:text-xl shadow-lg shadow-indigo-500/30">
            <img src="/Logo.png" alt="Logo" className="" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-wide">
              Umang Vision
              <span className="shimmer-txt"> Academy</span>
            </h1>
          </div>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="hidden md:flex justify-center flex-1 items-center gap-8 text-[15px] font-medium text-gray-300 mx-8">
          <Link to="/courses" className="hover:text-indigo-300 transition duration-300">
            {t("nav.courses")}
          </Link>
          <Link to="/plans" className="hover:text-indigo-300 transition duration-300">
            {t("nav.plans")}
          </Link>
          <Link to="/question-bank" className="hover:text-indigo-300 transition duration-300">
            {t("nav.questionBank")}
          </Link>
          <Link to="/blogs" className="hover:text-indigo-300 transition duration-300">
            {t("nav.blogs")}
          </Link>

          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setBoardOpen((prev) => !prev)}
              className="flex items-center gap-1 hover:text-indigo-300 transition"
            >
              {t("nav.board")}
              <ChevronDown size={16} className={`transition-transform ${boardOpen ? "rotate-180" : ""}`} />
            </button>
            {boardOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                <Link to="/boards/cbse" onClick={() => setBoardOpen(false)} className="block px-4 py-3 hover:bg-slate-800">CBSE</Link>
                <Link to="/boards/mp-board" onClick={() => setBoardOpen(false)} className="block px-4 py-3 hover:bg-slate-800">MP Board</Link>
                <Link to="/boards/icse" onClick={() => setBoardOpen(false)} className="block px-4 py-3 hover:bg-slate-800">ICSE</Link>
              </div>
            )}
          </div>

          {!hasInstructorRole && !hasAdminRole && (
            <Link to="/become-instructor" className="hover:text-indigo-300 transition duration-300">
              {t("nav.becomeInstructor")}
            </Link>
          )}

          <div ref={languageRef} className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              {isHindi ? "हिन्दी" : "EN"}
              <ChevronDown size={16} className={`transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {langDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
                <button type="button" onClick={() => changeLanguage("en")} className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800">English</button>
                <button type="button" onClick={() => changeLanguage("hi")} className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800">हिंदी</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop right section ── */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          {loading ? (
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400 font-medium">{t("nav.verifyingSession")}</span>
            </div>
          ) : !user ? (
            <>
              <Link to="/login" className="text-white hover:text-indigo-300 transition">
                {t("nav.login")}
              </Link>
              <Link
                to="/become-instructor"
                className="btn-gold bg-gradient-to-r from-indigo-400 to-indigo-500 hover:scale-105 transition duration-300 text-black font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20"
              >
                {t("nav.getStarted")}
              </Link>
            </>
          ) : (
            <>
              <div className="text-right">
                <p className="text-white text-sm font-semibold">{t("nav.welcome")}</p>
                <p className="text-slate-400 text-xs">{user?.name}</p>
              </div>

              {isMultiRole ? (
                <Link to={switchTarget} className={goingToInstructor ? "btn-gold" : "btn-indigo-shine"}>
                  {goingToInstructor ? "✦" : "⟵"} {switchLabel}
                </Link>
              ) : (
                <Link
                  to={dashboardPath}
                  className="btn-indigo-shine whitespace-nowrap bg-gradient-to-r from-indigo-400 to-indigo-500 hover:scale-105 transition duration-300 text-black font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20"
                >
                  {t("nav.dashboard")}
                </Link>
              )}

              <button
                onClick={() => { dispatch(logoutUser()); navigate("/"); }}
                className="btn-red"
              >
                {t("nav.logout")}
              </button>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden ml-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white hover:bg-white/5 transition text-lg"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      <div className={`md:hidden border-t border-white/10 overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-screen" : "max-h-0"}`}>
        <div className="px-4 pt-3 pb-4 space-y-1">
          {[
            { to: "/courses", label: t("nav.courses") },
            { to: "/plans", label: t("nav.plans") },
            ...(!hasInstructorRole && !hasAdminRole ? [{ to: "/become-instructor", label: t("nav.becomeInstructor") }] : []),
            { to: "/question-bank", label: t("nav.questionBank") },
            { to: "/blogs", label: t("nav.blogs") },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMobile}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              {label}
            </Link>
          ))}

          {/* Language selector */}
          <div className="px-3 py-2">
            <label htmlFor="mobile-language" className="sr-only">{t("nav.language")}</label>
            <select
              id="mobile-language"
              value={currentLanguage}
              onChange={(e) => changeLanguage(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          <div className="border-t border-white/10 my-2" />

          {/* Auth section */}
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-slate-400 text-sm">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              {t("nav.verifyingSession")}
            </div>
          ) : !user ? (
            <div className="flex gap-2 pt-1">
              <Link
                to="/login"
                onClick={closeMobile}
                className="flex-1 text-center text-sm font-semibold py-2 px-3 rounded-lg border border-indigo-400/40 text-indigo-300 hover:bg-indigo-400/10 transition"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/become-instructor"
                onClick={closeMobile}
                className="btn-gold flex-1 text-center text-sm font-semibold py-2 px-3 rounded-lg bg-gradient-to-r from-indigo-400 to-indigo-500 text-black shadow-md transition"
              >
                {t("nav.getStarted")}
              </Link>
            </div>
          ) : (
            <>
              {/* User info row */}
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-black font-bold text-xs shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold leading-tight">{user.name}</p>
                  <p className="text-slate-500 text-[10px] leading-tight">{user.email}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                {isMultiRole ? (
                  <Link
                    to={switchTarget}
                    onClick={closeMobile}
                    className={`flex-1 text-center text-xs py-2 px-2 ${goingToInstructor ? "btn-gold" : "btn-indigo-shine"}`}
                    style={{ borderRadius: "0.5rem", padding: "0.5rem 0.5rem" }}
                  >
                    {goingToInstructor ? "✦" : "⟵"} {switchLabel}
                  </Link>
                ) : (
                  <Link
                    to={dashboardPath}
                    onClick={closeMobile}
                    className="flex-1 text-center text-xs font-semibold py-2 px-2 rounded-lg bg-gradient-to-r from-indigo-400 to-indigo-500 text-black shadow-md transition"
                  >
                    {t("nav.dashboard")}
                  </Link>
                )}
                <button
                  onClick={() => { closeMobile(); dispatch(logoutUser()); navigate("/"); }}
                  className="btn-red flex-1 text-xs"
                  style={{ borderRadius: "0.5rem", padding: "0.5rem 0.5rem" }}
                >
                  {t("nav.logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;