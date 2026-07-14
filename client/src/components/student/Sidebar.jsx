// components/student/Sidebar.jsx
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, LogOut } from "lucide-react";
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
  const isMultiRole = hasInstructorRole && hasStudentRole && !hasAdminRole && !hasCustomRole;

  const dashboardPath = hasAdminRole
    ? "/admin-dashboard"
    : hasCustomRole
      ? "/staff-dashboard"
      : hasInstructorRole
        ? "/instructor-dashboard"
        : "/student-dashboard";

  const isInstructorDashboard = window.location.pathname.startsWith("/instructor-dashboard");
  const goingToInstructor = !isInstructorDashboard;
  const switchTarget = goingToInstructor ? "/instructor-dashboard" : "/student-dashboard";
  const switchLabel = goingToInstructor ? t("nav.goToInstructor") : t("nav.goToStudent");

  const [scrollTop, setScrollTop] = useState(0);
  const [rolesDropdownOpen, setRolesDropdownOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    core: true,
    performance: true,
    extras: false,
    account: false,
  });

  const dashboardOptions = [];
  if (hasBaseRole(user, "student")) {
    dashboardOptions.push({ name: t("nav.roleStudent", "Student"), path: "/student-dashboard" });
  }
  if (hasBaseRole(user, "instructor")) {
    dashboardOptions.push({ name: t("nav.roleInstructor", "Instructor"), path: "/instructor-dashboard" });
  }
  if (hasBaseRole(user, "admin")) {
    dashboardOptions.push({ name: t("nav.roleAdmin", "Admin"), path: "/admin-dashboard" });
  }
  getCustomRoles(user).forEach((role) => {
    dashboardOptions.push({ name: role.name, path: "/staff-dashboard" });
  });

  useEffect(() => {
    if (!rolesDropdownOpen) return;
    const handleClose = () => setRolesDropdownOpen(false);
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClose);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClose);
    };
  }, [rolesDropdownOpen]);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const handleScroll = () => {
      setScrollTop(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    setScrollTop(window.scrollY);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileOpen]);

  const dynamicTop = mobileOpen ? Math.max(0, 73 - scrollTop) : 0;

  const sidebarGroups = [
    {
      key: "core",
      title: t("studentSidebar.coreLearning", "Core Learning"),
      items: [
        { label: t("studentSidebar.overview"), to: "/student-dashboard", end: true, icon: "📊" },
        { label: t("studentSidebar.myCourses"), to: "/student-dashboard/my-courses", icon: "📚" },
        { label: t("studentSidebar.notes", "Study Notes"), to: "/student-dashboard/notes", icon: "📝" },
        { label: t("nav.questionBank", "Question Bank"), to: "/student-dashboard/question-bank", icon: "❓" },
        { label: t("nav.blogs", "Blogs"), to: "/student-dashboard/blogs", icon: "📰" },
        { label: t("studentSidebar.aiTutor"), to: "/student-dashboard/ai-tutor", icon: "🤖" },
        { label: t("studentSidebar.sessions"), to: "/student-dashboard/sessions", icon: "🎥" },
      ],
    },
    {
      key: "performance",
      title: t("studentSidebar.performanceTools", "Performance & Tools"),
      items: [
        { label: t("studentSidebar.progress"), to: "/student-dashboard/progress", icon: "📈" },
        { label: t("studentSidebar.mockTests"), to: "/student-dashboard/mock-tests", icon: "📝" },
        { label: t("studentSidebar.leaderboard"), to: "/student-dashboard/leaderboard", icon: "🏆" },
        { label: t("studentSidebar.achievements"), to: "/student-dashboard/achievements", icon: "🎖️" },
        { label: t("studentSidebar.certificates"), to: "/student-dashboard/certificates", icon: "📜" },
      ],
    },
    {
      key: "extras",
      title: t("studentSidebar.subscriptionsExtras", "Subscriptions & Extras"),
      items: [
        { label: t("nav.plans", "Plans"), to: "/student-dashboard/plans", icon: "💳" },
        { label: t("nav.becomeInstructor", "Become Instructor"), to: "/student-dashboard/become-instructor", icon: "🎓" },
        { label: t("studentSidebar.referral"), to: "/student-dashboard/referral", icon: "🎁" },
        { label: t("studentSidebar.wallet"), to: "/student-dashboard/wallet", icon: "👛" },
        { label: t("studentSidebar.purchaseHistory"), to: "/student-dashboard/purchase-history", icon: "📦" },
        { label: t("studentSidebar.references"), to: "/student-dashboard/references", icon: "🗂️" },
      ],
    },
    {
      key: "account",
      title: t("studentSidebar.account", "Account"),
      items: [
        { label: t("studentSidebar.settings"), to: "/student-dashboard/settings", icon: "⚙️" },
      ],
    },
  ];

  const sidebarClass = `
    relative flex flex-col overflow-x-hidden bg-slate-950 border-r border-slate-800
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-[76px] min-w-[76px]" : "w-[260px] min-w-[260px]"}
    ${mobileOpen ? "fixed inset-y-0 left-0 h-dvh w-[260px] shadow-[4px_0_24px_rgba(0,0,0,0.6)] z-50" : "hidden md:flex z-40 md:relative md:h-auto md:min-h-screen"}
  `;

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 w-full text-left
        ${collapsed ? "justify-center" : "justify-start"}
        ${isActive
          ? "bg-indigo-950/40 text-indigo-300 border-l-2 border-indigo-500 pl-2.5"
          : "text-slate-400 hover:bg-slate-900 hover:text-white border-l-2 border-transparent"
        }`
      }
      onClick={() => mobileOpen && setMobileOpen(false)}
    >
      <span className="shrink-0 text-lg leading-none">{item.icon}</span>
      {!collapsed && (
        <span className="text-xs font-semibold flex-1">
          {item.label}
        </span>
      )}
    </NavLink>
  );

  return (
    <aside className={sidebarClass}>
      {/* Mobile close button */}
      <button
        onClick={() => setMobileOpen(false)}
        className="md:hidden self-end bg-transparent border-none text-[#64748b] hover:text-slate-300 text-[22px] cursor-pointer mr-4 mt-3 mb-1 leading-none p-0 transition-colors"
      >
        ✕
      </button>

      {/* User Card */}
      <div className="px-3 mt-3 mb-4">
        <div
          className={`flex items-center gap-3 p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl ${
            collapsed ? "justify-center p-2" : ""
          }`}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-violet-600 text-lg font-bold text-white shadow-sm shadow-indigo-500/10 shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">
                {user?.name}
              </p>
              {dashboardOptions.length > 1 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRolesDropdownOpen(!rolesDropdownOpen);
                    }}
                    className="flex items-center gap-1 text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:text-indigo-300 transition-colors bg-indigo-950/40 border border-indigo-900/30 rounded-full px-2.5 py-0.5 mt-1 cursor-pointer"
                  >
                    {dashboardOptions.length} Roles <ChevronDown size={10} className={`transition-transform duration-200 ${rolesDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {rolesDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-slate-800 bg-[#0f172a] p-2 shadow-2xl z-[120] flex flex-col gap-1.5">
                      {dashboardOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setRolesDropdownOpen(false);
                            navigate(opt.path);
                          }}
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
                  {hasAdminRole ? t("nav.roleAdmin") : isMultiRole ? t("nav.roleMultiple") : hasInstructorRole ? t("nav.roleInstructor") : t("nav.roleStudent")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-4 overflow-y-auto md:overflow-y-visible overflow-x-hidden px-3 pb-24 md:pb-4 custom-scrollbar">
        {sidebarGroups.map((group) => {
          const isOpen = openGroups[group.key];
          return (
            <div key={group.key} className="flex flex-col gap-1">
              {!collapsed ? (
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold text-white/60 uppercase tracking-[0.08em] hover:text-white transition-colors w-full text-left"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    size={13}
                    className={`text-white/60 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                  />
                </button>
              ) : (
                <div className="flex flex-col items-center gap-1 py-2 mb-1">
                  <span className="text-[9px] font-semibold text-white/60 uppercase tracking-wider text-center leading-tight">
                    {group.title.split(" ")[0]}
                  </span>
                  <span className="h-px w-6 bg-white/15 mt-1" />
                </div>
              )}

              {/* Render items if expanded or if sidebar is collapsed */}
              {(isOpen || collapsed) && (
                <div className={`flex flex-col gap-0.5 ${!collapsed ? "pl-2 border-l border-white/10" : ""}`}>
                  {group.items.map((item) => (
                    <NavItem key={item.to} item={item} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      {/* Profile & Logout Section (Mobile View Only) */}
      <div className="md:hidden p-3 border-t border-slate-800 shrink-0">
        {isMultiRole && (
          <Link
            to={switchTarget}
            onClick={() => setMobileOpen(false)}
            className="btn-indigo-shine mb-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
          >
            ⇄ {switchLabel}
          </Link>
        )}
        <button
            onClick={() => {
              mobileOpen && setMobileOpen(false);
              dispatch(logoutUser());
              navigate("/");
            }}
            className="flex items-center gap-3 rounded-xl py-2.5 px-3 transition-all duration-200 w-full text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 cursor-pointer"
            title={t("nav.logout")}
          >
            <LogOut size={16} className="text-rose-400 shrink-0" />
            <span className="text-sm font-semibold">{t("nav.logout")}</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
