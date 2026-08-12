import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, clearAuth } from "../redux/slices/authSlice";
import toast from "react-hot-toast";
import { ChevronDown, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getCustomRole,
  hasCustomRole as checkHasCustomRole,
  hasBaseRole,
} from "../utils/permissions";

const Navbar = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const { cartIds = [] } = useSelector((state) => state.cart || {});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);

  const isInstructorDashboard = pathname.startsWith("/instructor-dashboard");
  const isDashboardRoute =
    pathname.startsWith("/student-dashboard") ||
    pathname.startsWith("/instructor-dashboard") ||
    pathname.startsWith("/admin-dashboard") ||
    pathname.startsWith("/staff-dashboard");

  const hasInstructorRole = hasBaseRole(user, "instructor");
  const hasStudentRole = hasBaseRole(user, "student");
  const hasAdminRole = hasBaseRole(user, "admin");
  const hasCustomRole = checkHasCustomRole(user);
  const isMultiRole =
    hasInstructorRole && hasStudentRole && !hasAdminRole && !hasCustomRole;
  const cartCount = cartIds.length;

  const isStaffOrAdmin = hasAdminRole || hasCustomRole;

  const dashboardPath = hasAdminRole
    ? "/admin-dashboard"
    : hasCustomRole
      ? "/staff-dashboard"
      : hasInstructorRole
        ? "/instructor-dashboard"
        : "/student-dashboard";

  const dropdownRef = useRef(null);
  const languageRef = useRef(null);
  const mobileLangRef = useRef(null);
  const topBarRef = useRef(null);
  const { t, i18n } = useTranslation();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileLangDropdownOpen, setMobileLangDropdownOpen] = useState(false);
  const [rolesDropdownOpen, setRolesDropdownOpen] = useState(false);
  const rolesDropdownRef = useRef(null);
  const [topBarHeight, setTopBarHeight] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setBoardOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
      if (
        mobileLangRef.current &&
        !mobileLangRef.current.contains(event.target)
      ) {
        setMobileLangDropdownOpen(false);
      }
      if (
        rolesDropdownRef.current &&
        !rolesDropdownRef.current.contains(event.target)
      ) {
        setRolesDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleDashboardSidebarOpen = () => {
      setMobileMenuOpen(false);
    };

    window.addEventListener(
      "dashboard-sidebar-open",
      handleDashboardSidebarOpen,
    );

    return () => {
      window.removeEventListener(
        "dashboard-sidebar-open",
        handleDashboardSidebarOpen,
      );
    };
  }, []);

  // Measure the sticky top bar's rendered height so the full-screen mobile
  // menu can start exactly below it instead of overlapping it.
  useEffect(() => {
    const el = topBarRef.current;
    if (!el) return;
    const updateHeight = () => setTopBarHeight(el.offsetHeight);
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(el);
    window.addEventListener("resize", updateHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  // Lock body scroll while the mobile menu is open, using the mobile-safe
  // technique (position:fixed + saved offset) instead of overflow:hidden
  // alone, since touch-drag scrolling ignores overflow:hidden on iOS/Android.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [mobileMenuOpen]);

  // Close the mobile menu on route changes so it never lingers open after a
  // link navigation.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const closeMobile = () => setMobileMenuOpen(false);
  const languages = [
    { code: "en", name: "English", label: "EN" },
    { code: "hi", name: "हिंदी", label: "HI" },
    { code: "mr", name: "मराठी", label: "MR" },
    { code: "gu", name: "ગુજરાતી", label: "GU" },
    { code: "bn", name: "বাংলা", label: "BN" },
    { code: "ta", name: "தமிழ்", label: "TA" },
    { code: "te", name: "తెలుగు", label: "TE" },
  ];
  const currentLangObj =
    languages.find((l) => i18n.language?.startsWith(l.code)) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangDropdownOpen(false);
    setMobileLangDropdownOpen(false);
  };

  const switchTarget = isInstructorDashboard
    ? "/student-dashboard"
    : "/instructor-dashboard";
  const switchLabel = isInstructorDashboard
    ? t("nav.goToStudentDashboard")
    : t("nav.goToInstructorDashboard");
  const goingToInstructor = !isInstructorDashboard;

  const dashboardOptions = [];
  if (user) {
    if (hasBaseRole(user, "student")) {
      dashboardOptions.push({
        name: t("nav.roleStudent", "Student"),
        path: "/student-dashboard",
      });
    }
    if (hasBaseRole(user, "instructor")) {
      dashboardOptions.push({
        name: t("nav.roleInstructor", "Instructor"),
        path: "/instructor-dashboard",
      });
    }
    if (hasBaseRole(user, "admin")) {
      dashboardOptions.push({
        name: t("nav.roleAdmin", "Admin"),
        path: "/admin-dashboard",
      });
    }
    const customRole = getCustomRole(user);
    if (customRole) {
      dashboardOptions.push({
        name: customRole.name,
        path: "/staff-dashboard",
      });
    }
  }

  return (
    <>
      <nav
        className="w-full sticky top-0 z-[300] bg-[#0f172a]/90 backdrop-blur-lg border-b border-white/10"
        style={{ pointerEvents: "auto" }}
      >
        <style>{`
.btn-navy,
.btn-indigo-shine,
.btn-red {
  cursor: pointer;
  transition: box-shadow .2s ease, transform .2s ease;
  white-space: nowrap;
  border-radius: 0.75rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.8125rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
}

@media (min-width: 1280px) {
  .btn-navy,
  .btn-indigo-shine,
  .btn-red {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }
}

.btn-navy {
  background: linear-gradient(120deg, #7c3aed 0%, #6366f1 45%, #1e3a8a 100%);
  color: #fff;
  font-weight: 700;
  border: 1px solid #6366f140;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.35);
}
.btn-navy:hover {
  box-shadow: 0 0 22px rgba(99, 102, 241, 0.5);
}

.btn-indigo-shine {
  background: linear-gradient(120deg, #7c3aed 0%, #6366f1 45%, #1e3a8a 100%);
  color: #fff;
  font-weight: 700;
  border: 1px solid #6366f140;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.35);
}
.btn-indigo-shine:hover {
  box-shadow: 0 0 22px rgba(99, 102, 241, 0.5);
}

.btn-red {
  background: linear-gradient(120deg, #fb7185 0%, #be123c 45%, #4c0519 100%);
  color: #fff;
  font-weight: 700;
  border: 1px solid #be123c40;
  box-shadow: 0 0 16px rgba(190, 18, 60, 0.35);
}
button.btn-red:hover,
.btn-red:hover {
  box-shadow:
    0 0 10px rgba(190, 18, 60, 0.7),
    0 0 25px rgba(190, 18, 60, 0.5),
    0 0 40px rgba(190, 18, 60, 0.3);
}

.btn-navy:active,
.btn-indigo-shine:active,
.btn-red:active {
  transform: scale(0.97);
}
`}</style>

        <div
          ref={topBarRef}
          className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 flex items-center justify-between gap-2 lg:gap-4"
        >
          {/* ── Logo ── */}
          <Link
            to="/"
            className="flex items-center shrink-0"
            aria-label="Go to home"
            onClick={() => console.debug("Navbar: logo click -> /")}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center shrink-0">
              <img
                src="/Logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center ml-2 xl:ml-2.5 shrink-0 whitespace-nowrap">
              <span className="text-sm lg:text-base xl:text-lg font-extrabold text-white tracking-wide">
                Umang Vision
              </span>
              <span className="ml-1 shimmer-txt text-sm lg:text-base xl:text-lg font-extrabold tracking-wide">
                Academy
              </span>
            </div>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden xl:flex items-center justify-center gap-2 xl:gap-3 2xl:gap-5 text-xs xl:text-[13px] 2xl:text-[14px] font-medium text-gray-300 shrink-0">
            {!isStaffOrAdmin && !user && (
              <Link
                to="/courses"
                className="hover:text-indigo-300 transition duration-300 whitespace-nowrap shrink-0"
              >
                {t("nav.courses")}
              </Link>
            )}
            {!isStaffOrAdmin && !user && (
              <Link
                to="/plans"
                className="hover:text-indigo-300 transition duration-300 whitespace-nowrap shrink-0"
                onClick={() => console.debug("Navbar: plans click -> /plans")}
              >
                {t("nav.plans")}
              </Link>
            )}
            {!user && (
              <>
                <Link
                  to="/question-bank"
                  className="hover:text-indigo-300 transition duration-300 whitespace-nowrap shrink-0"
                >
                  {t("nav.questionBank")}
                </Link>
                <Link
                  to="/blogs"
                  className="hover:text-indigo-300 transition duration-300 whitespace-nowrap shrink-0"
                >
                  {t("nav.blogs")}
                </Link>
              </>
            )}

            {!hasInstructorRole && !isStaffOrAdmin && !user && (
              <Link
                to="/become-instructor"
                className="hover:text-indigo-300 transition duration-300 whitespace-nowrap shrink-0"
              >
                {t("nav.becomeInstructor")}
              </Link>
            )}

            <Link
              to="/donate"
              className="inline-flex items-center gap-1 px-2.5 py-1 2xl:px-3 2xl:py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-amber-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] 2xl:text-xs font-bold hover:bg-emerald-500/30 hover:scale-105 transition-all shadow-md whitespace-nowrap shrink-0"
            >
              <span>{t("nav.donate", "Donate")}</span>
              <span>💖</span>
            </Link>
          </div>

          {/* ── Desktop right section ── */}
          <div className="hidden xl:flex items-center gap-1.5 2xl:gap-3 shrink-0">
            {(!user || hasStudentRole) && (
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setBoardOpen((prev) => !prev);
                    setLangDropdownOpen(false);
                    setRolesDropdownOpen(false);
                  }}
                  className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-3 xl:px-4 py-1.5 xl:py-2 text-xs xl:text-sm font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t("nav.board")}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${boardOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {boardOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                    <Link
                      to="/boards/cbse"
                      onClick={() => setBoardOpen(false)}
                      className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      CBSE
                    </Link>
                    <Link
                      to="/boards/mp-board"
                      onClick={() => setBoardOpen(false)}
                      className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      MP Board
                    </Link>
                    <Link
                      to="/boards/icse"
                      onClick={() => setBoardOpen(false)}
                      className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      ICSE
                    </Link>
                  </div>
                )}
              </div>
            )}
            <div ref={languageRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangDropdownOpen((prev) => !prev);
                  setBoardOpen(false);
                  setRolesDropdownOpen(false);
                }}
                className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2.5 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm font-semibold text-slate-200 hover:bg-slate-800 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                {currentLangObj.label}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${langDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 rounded-2xl border border-slate-700 bg-slate-900 shadow-xl z-50 overflow-hidden py-1">
                  {languages.map((lng) => (
                    <button
                      key={lng.code}
                      type="button"
                      onClick={() => changeLanguage(lng.code)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        currentLangObj.code === lng.code
                          ? "bg-indigo-600/30 text-indigo-300 font-bold"
                          : "text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {lng.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {(!user || hasStudentRole) && (
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="relative cursor-pointer inline-flex h-9 w-9 xl:h-10 xl:w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 shrink-0"
                aria-label="Cart"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {loading ? (
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                <span className="text-xs text-slate-400 font-medium">
                  {t("nav.verifyingSession")}
                </span>
              </div>
            ) : !user ? (
              <Link to="/login" className="btn-navy">
                {t("nav.loginRegister", "Login / Register")}
              </Link>
            ) : (
              <>
                <div className="text-right">
                  <p className="text-white text-sm font-semibold">
                    {t("nav.welcome")}
                  </p>
                  <p className="text-slate-400 text-xs">{user?.name}</p>
                </div>

                {dashboardOptions.length > 1 ? (
                  <div className="relative" ref={rolesDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setRolesDropdownOpen(!rolesDropdownOpen);
                        setBoardOpen(false);
                        setLangDropdownOpen(false);
                      }}
                      className="btn-indigo-shine flex items-center gap-1.5"
                    >
                      {t("nav.dashboard", "Dashboard")}{" "}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${rolesDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {rolesDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-800 bg-[#0f172a] p-2 shadow-2xl z-[120] flex flex-col gap-1.5">
                        {dashboardOptions.map((opt, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => {
                              setRolesDropdownOpen(false);
                              navigate(opt.path);
                            }}
                            className="w-full text-center text-[10px] font-bold uppercase tracking-wider text-indigo-300 hover:text-white hover:bg-slate-900 border border-indigo-900/20 rounded-lg px-2 py-2 transition-all"
                          >
                            {opt.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to={dashboardPath} className="btn-indigo-shine">
                    {t("nav.dashboard")}
                  </Link>
                )}

                <button
                  onClick={() => {
                    dispatch(clearAuth());
                    toast.success(
                      t("nav.logoutSuccess", "Logged out successfully"),
                    );
                    navigate("/", { replace: true });
                    dispatch(logoutUser()).catch(() => {});
                  }}
                  className="btn-red"
                >
                  {t("nav.logout")}
                </button>
              </>
            )}
          </div>

          {/* ── Mobile actions ── */}
          <div className="xl:hidden ml-auto flex items-center gap-2">
            {/* Language selector in mobile navbar */}
            <div ref={mobileLangRef} className="relative">
              <button
                type="button"
                onClick={() => setMobileLangDropdownOpen((prev) => !prev)}
                className="inline-flex h-9 items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 px-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
              >
                {currentLangObj.label}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${mobileLangDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileLangDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-slate-700 bg-slate-900 shadow-xl z-[110] overflow-hidden py-1 max-h-60 overflow-y-auto">
                  {languages.map((lng) => (
                    <button
                      key={lng.code}
                      type="button"
                      onClick={() => changeLanguage(lng.code)}
                      className={`w-full px-4 py-2 text-left text-xs transition-colors ${
                        currentLangObj.code === lng.code
                          ? "bg-indigo-600/30 text-indigo-300 font-bold"
                          : "text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {lng.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {(!user || hasStudentRole) && (
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="relative cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                aria-label="Cart"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            {!isDashboardRoute && (
              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen((prev) => {
                    const next = !prev;
                    if (next && isDashboardRoute) {
                      window.dispatchEvent(
                        new CustomEvent("navbar-mobile-menu-open"),
                      );
                    }
                    return next;
                  })
                }
                className="relative z-50 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white hover:bg-white/5 transition text-lg"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile menu: full-screen fixed overlay, starts below the top bar ──
         Rendered outside <nav> on purpose: <nav> has backdrop-blur-lg, and a
         backdrop-filter on an ancestor creates its own containing block for
         position:fixed descendants, which was collapsing this overlay down
         to the height of the top bar instead of the full viewport. ── */}
      <div
        className={`xl:hidden fixed inset-x-0 bottom-0 z-[100] bg-black/60 transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ top: topBarHeight }}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <div
        className="xl:hidden fixed right-0 w-[280px] max-w-[80vw] bottom-0 z-[100] bg-[#0f172a] overflow-y-auto transition-transform duration-300 ease-out border-l border-white/10"
        style={{
          top: topBarHeight,
          overscrollBehavior: "contain",
          transform: mobileMenuOpen ? "translateX(0)" : "translateX(100%)",
          pointerEvents: mobileMenuOpen ? "auto" : "none",
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-4 pt-3 pb-6 space-y-1">
          {[
            ...(!isStaffOrAdmin && !user
              ? [{ to: "/courses", label: t("nav.courses") }]
              : []),
            ...(!isStaffOrAdmin && !user
              ? [{ to: "/plans", label: t("nav.plans") }]
              : []),
            ...(!hasInstructorRole && !isStaffOrAdmin && !user
              ? [{ to: "/become-instructor", label: t("nav.becomeInstructor") }]
              : []),
            ...(!user
              ? [
                  { to: "/question-bank", label: t("nav.questionBank") },
                  { to: "/blogs", label: t("nav.blogs") },
                ]
              : []),
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

          <div className="border-t border-white/10 my-2" />

          {/* Auth section */}
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-slate-400 text-sm">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              {t("nav.verifyingSession")}
            </div>
          ) : !user ? (
            <div className="pt-1">
              <Link
                to="/login"
                onClick={closeMobile}
                className="btn-navy w-full text-center"
                style={{
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  display: "flex",
                }}
              >
                {t("nav.loginRegister", "Login / Register")}
              </Link>
            </div>
          ) : (
            <>
              {/* User info row */}
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-black font-bold text-xs shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold leading-tight">
                    {user.name}
                  </p>
                  <p className="text-slate-500 text-[10px] leading-tight">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-1 w-full">
                {dashboardOptions.length > 1 ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">
                      Dashboards:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {dashboardOptions.map((opt, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => {
                            closeMobile();
                            navigate(opt.path);
                          }}
                          className="text-center text-[9px] font-bold uppercase tracking-wider text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-900/30 rounded-lg py-2 px-1 transition-all"
                        >
                          {opt.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    to={dashboardPath}
                    onClick={closeMobile}
                    className="w-full text-center text-xs py-2 px-2 btn-indigo-shine"
                    style={{
                      borderRadius: "0.5rem",
                      padding: "0.5rem 0.5rem",
                      display: "flex",
                    }}
                  >
                    {t("nav.dashboard")}
                  </Link>
                )}
                <button
                  onClick={() => {
                    closeMobile();
                    dispatch(clearAuth());
                    toast.success(
                      t("nav.logoutSuccess", "Logged out successfully"),
                    );
                    navigate("/", { replace: true });
                    dispatch(logoutUser()).catch(() => {});
                  }}
                  className="btn-red flex-1 text-xs text-center"
                  style={{
                    borderRadius: "0.5rem",
                    padding: "0.5rem 0.5rem",
                    display: "flex",
                  }}
                >
                  {t("nav.logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
