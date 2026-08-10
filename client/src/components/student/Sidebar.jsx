// components/student/Sidebar.jsx
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { logoutUser, clearAuth } from "../../redux/slices/authSlice";
import toast from "react-hot-toast";
import { useNavigate, Link, NavLink } from "react-router-dom";
import {
  getCustomRole,
  hasCustomRole as checkHasCustomRole,
  hasBaseRole,
  hasDashboardModule,
} from "../../utils/permissions";

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
  const hasCustomRole = checkHasCustomRole(user);
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
  const customRole = getCustomRole(user);
  if (customRole)
    dashboardOptions.push({ name: customRole.name, path: "/staff-dashboard" });

  const activeOption = dashboardOptions.find((opt) =>
    window.location.pathname.startsWith(opt.path)
  );
  const activeRoleName = activeOption ? activeOption.name : "";

  useEffect(() => {
    if (!rolesDropdownOpen) return;
    const handleClose = () => setRolesDropdownOpen(false);
    const id = setTimeout(() => document.addEventListener("click", handleClose), 0);
    return () => { clearTimeout(id); document.removeEventListener("click", handleClose); };
  }, [rolesDropdownOpen]);

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

  // Each item now carries a `moduleKey` matching DASHBOARD_MODULES.student
  // on the backend. `overview` has no key check — always visible.
  const sidebarGroups = [
    {
      key: "core",
      title: t("studentSidebar.coreLearning", "Core Learning"),
      items: [
        { label: t("studentSidebar.overview", "Overview"), to: "/student-dashboard", icon: "📊", end: true, moduleKey: "overview" },
        { label: t("studentSidebar.myCourses", "My Courses"), to: "/student-dashboard/my-courses", icon: "📚", moduleKey: "my_courses" },
        { label: t("studentSidebar.notes", "Study Notes"), to: "/student-dashboard/notes", icon: "📝", moduleKey: "study_notes" },
        { label: t("nav.questionBank", "Question Bank"), to: "/student-dashboard/question-bank", icon: "❓", moduleKey: "question_bank" },
        { label: t("nav.blogs", "Blogs"), to: "/student-dashboard/blogs", icon: "📰", moduleKey: "blogs" },
        { label: t("studentSidebar.aiTutor", "AI Tutor"), to: "/student-dashboard/ai-tutor", icon: "🤖", moduleKey: "ai_tutor" },
        { label: t("studentSidebar.sessions", "Sessions"), to: "/student-dashboard/sessions", icon: "🎥", moduleKey: "sessions" },
        { label: t("studentSidebar.askInstructor", "Ask Instructor"), to: "/student-dashboard/ask-instructor", icon: "💬", moduleKey: "ask_instructor" },
      ],
    },
    {
      key: "performance",
      title: t("studentSidebar.performanceTools", "Performance & Tools"),
      items: [
        { label: t("studentSidebar.progress", "Progress"), to: "/student-dashboard/progress", icon: "📈", moduleKey: "progress" },
        { label: t("studentSidebar.mockTests", "Mock Tests"), to: "/student-dashboard/mock-tests", icon: "🧪", moduleKey: "mock_tests" },
        { label: t("studentSidebar.leaderboard", "Leaderboard"), to: "/student-dashboard/leaderboard", icon: "🏆", moduleKey: "leaderboard" },
        { label: t("studentSidebar.achievements", "Achievements"), to: "/student-dashboard/achievements", icon: "🎖️", moduleKey: "achievements" },
        { label: t("studentSidebar.certificates", "Certificates"), to: "/student-dashboard/certificates", icon: "📜", moduleKey: "certificates" },
      ],
    },
    {
      key: "advisory",
      title: t("studentSidebar.counsellingAndAdvisory", "Advisory & Global Hub"),
      items: [
        { label: t("studentSidebar.careerCounselling", "Career Counselling"), to: "/student-dashboard/career-counselling", icon: "🧭", moduleKey: "career_counselling" },
        { label: t("studentSidebar.internationalStudy", "International Study"), to: "/student-dashboard/international-study", icon: "🌍", moduleKey: "international_study" },
        { label: t("studentSidebar.scholarships", "Scholarships"), to: "/student-dashboard/scholarships", icon: "🎗️", moduleKey: "scholarships" },
      ],
    },
    {
      key: "extras",
      title: t("studentSidebar.subscriptionsExtras", "Subscriptions & Extras"),
      items: [
        { label: t("nav.plans", "Plans"), to: "/student-dashboard/plans", icon: "💳", moduleKey: "plans" },
        { label: t("nav.becomeInstructor", "Become Instructor"), to: "/student-dashboard/become-instructor", icon: "🎓", moduleKey: "become_instructor" },
        { label: t("studentSidebar.referral", "Referral"), to: "/student-dashboard/referral", icon: "🎁", moduleKey: "referral" },
        { label: t("studentSidebar.wallet", "Wallet"), to: "/student-dashboard/wallet", icon: "👛", moduleKey: "wallet" },
        { label: t("studentSidebar.purchaseHistory", "Purchases"), to: "/student-dashboard/purchase-history", icon: "📦", moduleKey: "purchase_history" },
        { label: t("studentSidebar.references", "References"), to: "/student-dashboard/references", icon: "🗂️", moduleKey: "references" },
      ],
    },
    {
      key: "account",
      title: t("studentSidebar.account", "Account"),
      items: [
        { label: t("studentSidebar.settings", "Settings"), to: "/student-dashboard/settings", icon: "⚙️", moduleKey: "settings" },
      ],
    },
  ];

  // Filter each group down to modules the admin has enabled for Student,
  // then drop any group left with zero items.
  const visibleGroups = sidebarGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasDashboardModule(user, item.moduleKey)),
    }))
    .filter((group) => group.items.length > 0);

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
        return `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 w-full text-left ${active
            ? "bg-indigo-950/40 text-indigo-300 border-l-2 border-indigo-500 pl-2.5"
            : "text-slate-400 hover:bg-slate-900 hover:text-white border-l-2 border-transparent"
          }`;
      }}
    >
      <span className="shrink-0 text-lg leading-none">{item.icon}</span>
      <span className="text-xs font-semibold flex-1">{item.label}</span>
    </NavLink>
  );

  const SidebarBody = () => (
    <div className="flex flex-col h-full overflow-hidden">
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

      <nav className="flex-1 overflow-y-auto px-3 pb-2 flex flex-col gap-1 custom-scrollbar">
        {visibleGroups.map((group) => (
          <div key={group.key}>
            <button
              onClick={() => toggleGroup(group.key)}
              className="flex items-center justify-between w-full px-2 py-1.5 mb-0.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
            >
              <span>{group.title}</span>
              {openGroups[group.key]
                ? <ChevronDown size={11} />
                : <ChevronRight size={11} />}
            </button>

            {openGroups[group.key] && (
              <div className="flex flex-col gap-0.5 mb-1">
                {group.items.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
            )}
          </div>
        ))}

        {mobileOpen && (
          <button
            onClick={() => {
              setMobileOpen(false);
              dispatch(clearAuth());
              toast.success("Logged out successfully");
              navigate("/", { replace: true });
              dispatch(logoutUser()).catch(() => { });
            }}
            className="flex items-center gap-3 rounded-xl py-2.5 px-3 mt-2 transition-all duration-200 w-full text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 border-l-2 border-transparent cursor-pointer"
          >
            <LogOut size={16} className="shrink-0" />
            <span className="text-xs font-semibold">{t("nav.logout", "Logout")}</span>
          </button>
        )}
      </nav>

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
      <aside className="hidden md:flex flex-col bg-slate-950 border-r border-slate-800 w-[260px] min-w-[260px] shrink-0 sticky top-0 h-screen z-40">
        <SidebarBody />
      </aside>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed top-[64px] inset-x-0 bottom-0 bg-slate-950/75 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed top-[64px] bottom-0 left-0 h-[calc(100vh-64px)] w-[260px] bg-slate-950 border-r border-slate-800 flex-col shadow-[4px_0_24px_rgba(0,0,0,0.6)] z-40 transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? "translate-x-0 flex" : "-translate-x-full hidden"
        }`}
      >
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