// components/student/Sidebar.jsx
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { logoutUser } from "../../redux/slices/authSlice";
import { useNavigate, Link, NavLink } from "react-router-dom";
import { getCustomRoles, hasBaseRole } from "../../utils/permissions";

const Sidebar = ({
  user,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const hasInstructorRole = hasBaseRole(user, "instructor");
  const hasStudentRole = hasBaseRole(user, "student");
  const hasAdminRole = hasBaseRole(user, "admin");
  const hasCustomRole = getCustomRoles(user).length > 0;
  const isMultiRole =
    hasInstructorRole && hasStudentRole && !hasAdminRole && !hasCustomRole;

  const isInstructorDashboard = window.location.pathname.startsWith("/instructor-dashboard");
  const switchTarget = isInstructorDashboard ? "/student-dashboard" : "/instructor-dashboard";
  const switchLabel = isInstructorDashboard
    ? t("nav.goToStudent", "Student Dashboard")
    : t("nav.goToInstructor", "Instructor Dashboard");

  const [rolesDropdownOpen, setRolesDropdownOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    core: true,
    performance: true,
    extras: false,
    account: false,
  });

  const dashboardOptions = [];
  if (hasBaseRole(user, "student"))
    dashboardOptions.push({ name: t("nav.roleStudent", "Student"), path: "/student-dashboard" });
  if (hasBaseRole(user, "instructor"))
    dashboardOptions.push({ name: t("nav.roleInstructor", "Instructor"), path: "/instructor-dashboard" });
  if (hasBaseRole(user, "admin"))
    dashboardOptions.push({ name: t("nav.roleAdmin", "Admin"), path: "/admin-dashboard" });
  getCustomRoles(user).forEach((role) =>
    dashboardOptions.push({ name: role.name, path: "/staff-dashboard" })
  );

  const activeOption = dashboardOptions.find((opt) =>
    window.location.pathname.startsWith(opt.path)
  );
  const activeRoleName = activeOption ? activeOption.name : "";

  // Close roles dropdown on outside click
  useEffect(() => {
    if (!rolesDropdownOpen) return;
    const handleClose = () => setRolesDropdownOpen(false);
    const id = setTimeout(() => document.addEventListener("click", handleClose), 0);
    return () => { clearTimeout(id); document.removeEventListener("click", handleClose); };
  }, [rolesDropdownOpen]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [mobileOpen]);

  const toggleGroup = (key) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const sidebarGroups = [
    {
      key: "core",
      title: t("studentSidebar.coreLearning", "Core Learning"),
      items: [
        { label: t("studentSidebar.overview", "Overview"),       to: "/student-dashboard",                   icon: "📊", end: true },
        { label: t("studentSidebar.myCourses", "My Courses"),    to: "/student-dashboard/my-courses",        icon: "📚" },
        { label: t("studentSidebar.notes", "Study Notes"),       to: "/student-dashboard/notes",             icon: "📝" },
        { label: t("nav.questionBank", "Question Bank"),         to: "/student-dashboard/question-bank",     icon: "❓" },
        { label: t("nav.blogs", "Blogs"),                        to: "/student-dashboard/blogs",             icon: "📰" },
        { label: t("studentSidebar.aiTutor", "AI Tutor"),        to: "/student-dashboard/ai-tutor",          icon: "🤖" },
        { label: t("studentSidebar.sessions", "Sessions"),       to: "/student-dashboard/sessions",          icon: "🎥" },
      ],
    },
    {
      key: "performance",
      title: t("studentSidebar.performanceTools", "Performance & Tools"),
      items: [
        { label: t("studentSidebar.progress", "Progress"),          to: "/student-dashboard/progress",       icon: "📈" },
        { label: t("studentSidebar.mockTests", "Mock Tests"),        to: "/student-dashboard/mock-tests",     icon: "🧪" },
        { label: t("studentSidebar.leaderboard", "Leaderboard"),     to: "/student-dashboard/leaderboard",   icon: "🏆" },
        { label: t("studentSidebar.achievements", "Achievements"),   to: "/student-dashboard/achievements",  icon: "🎖️" },
        { label: t("studentSidebar.certificates", "Certificates"),   to: "/student-dashboard/certificates",  icon: "📜" },
      ],
    },
    {
      key: "extras",
      title: t("studentSidebar.subscriptionsExtras", "Subscriptions & Extras"),
      items: [
        { label: t("nav.plans", "Plans"),                            to: "/student-dashboard/plans",                  icon: "💳" },
        { label: t("nav.becomeInstructor", "Become Instructor"),     to: "/student-dashboard/become-instructor",      icon: "🎓" },
        { label: t("studentSidebar.referral", "Referral"),           to: "/student-dashboard/referral",               icon: "🎁" },
        { label: t("studentSidebar.wallet", "Wallet"),               to: "/student-dashboard/wallet",                 icon: "👛" },
        { label: t("studentSidebar.purchaseHistory", "Purchases"),   to: "/student-dashboard/purchase-history",       icon: "📦" },
        { label: t("studentSidebar.references", "References"),       to: "/student-dashboard/references",             icon: "🗂️" },
      ],
    },
    {
      key: "account",
      title: t("studentSidebar.account", "Account"),
      items: [
        { label: t("studentSidebar.settings", "Settings"),           to: "/student-dashboard/settings",               icon: "⚙️" },
      ],
    },
  ];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={() => mobileOpen && setMobileOpen(false)}
      className={({ isActive }) => {
        const isPlansBilling =
          item.to === "/student-dashboard/plans" &&
          window.location.pathname === "/student-dashboard/billing";
        const active = isActive || isPlansBilling;
        return `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 w-full text-left ${
          active
            ? "bg-indigo-950/40 text-indigo-300 border-l-2 border-indigo-500 pl-2.5"
            : "text-slate-400 hover:bg-slate-900 hover:text-white border-l-2 border-transparent"
        }`;
      }}
    >
      <span className="shrink-0 text-lg leading-none">{item.icon}</span>
      <span className="text-xs font-semibold flex-1">{item.label}</span>
    </NavLink>
  );

  // ── Shared sidebar body (used by both desktop and mobile) ─────────────────
  const SidebarBody = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* User Card */}
      <div className="px-3 pt-3 pb-3 shrink-0">
        <div className="flex items-center gap-3 p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-lg font-bold text-white shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{user?.name}</p>
            {dashboardOptions.length > 1 ? (
              <div className="relative">
                {activeRoleName && (
                  <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider truncate mt-0.5">
                    {activeRoleName}
                  </p>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setRolesDropdownOpen(!rolesDropdownOpen); }}
                  className="flex items-center gap-1 text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:text-indigo-300 transition-colors bg-indigo-950/40 border border-indigo-900/30 rounded-full px-2.5 py-0.5 mt-1 cursor-pointer"
                >
                  {dashboardOptions.length} Roles
                  <ChevronDown size={10} className={`transition-transform duration-200 ${rolesDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {rolesDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-slate-800 bg-[#0f172a] p-2 shadow-2xl z-[120] flex flex-col gap-1.5">
                    {dashboardOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => { setRolesDropdownOpen(false); navigate(opt.path); }}
                        className="w-full text-center text-[10px] font-bold uppercase tracking-wider text-indigo-300 hover:text-white hover:bg-slate-900 border border-indigo-900/20 rounded-lg px-2 py-1.5 transition-all cursor-pointer"
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider truncate mt-0.5">
                {hasAdminRole
                  ? t("nav.roleAdmin", "Admin")
                  : hasInstructorRole
                    ? t("nav.roleInstructor", "Instructor")
                    : t("nav.roleStudent", "Student")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grouped nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2 flex flex-col gap-1 custom-scrollbar">
        {sidebarGroups.map((group) => (
          <div key={group.key}>
            {/* Group header — clickable to collapse */}
            <button
              onClick={() => toggleGroup(group.key)}
              className="flex items-center justify-between w-full px-2 py-1.5 mb-0.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
            >
              <span>{group.title}</span>
              {openGroups[group.key]
                ? <ChevronDown size={11} />
                : <ChevronRight size={11} />}
            </button>

            {/* Group items */}
            {openGroups[group.key] && (
              <div className="flex flex-col gap-0.5 mb-1">
                {group.items.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Logout — mobile only */}
        {mobileOpen && (
          <button
            onClick={async () => {
              setMobileOpen(false);
              await dispatch(logoutUser()).unwrap().catch(() => {});
              navigate("/", { replace: true });
            }}
            className="flex items-center gap-3 rounded-xl py-2.5 px-3 mt-2 transition-all duration-200 w-full text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 border-l-2 border-transparent cursor-pointer"
          >
            <LogOut size={16} className="shrink-0" />
            <span className="text-xs font-semibold">{t("nav.logout", "Logout")}</span>
          </button>
        )}
      </nav>

      {/* Switch dashboard — pinned at bottom, mobile only */}
      {isMultiRole && mobileOpen && (
        <div className="px-3 py-3 shrink-0 border-t border-slate-800/60">
          <Link
            to={switchTarget}
            onClick={() => setMobileOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
          >
            ⇄ {switchLabel}
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col bg-slate-950 border-r border-slate-800 w-[260px] min-w-[260px] shrink-0 sticky top-0 h-screen z-40">
        <SidebarBody />
      </aside>

      {/* ── Mobile backdrop ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] md:hidden"
        />
      )}

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-dvh w-[260px] bg-slate-950 border-r border-slate-800 flex-col shadow-[4px_0_24px_rgba(0,0,0,0.6)] z-[10000] md:hidden ${
          mobileOpen ? "flex" : "hidden"
        }`}
      >
        {/* X close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="self-end bg-transparent border-none text-slate-500 hover:text-white text-2xl cursor-pointer mr-4 mt-3 mb-1 leading-none p-0 transition-colors"
        >
          ✕
        </button>
        <SidebarBody />
      </aside>
    </>
  );
};

export default Sidebar;
