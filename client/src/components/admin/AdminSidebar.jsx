import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Users,
  GraduationCap,
  CheckCircle,
  BookOpen,
  BarChart2,
  Trophy,
  ChevronLeft,
  ChevronDown,
  Shield,
  UploadCloud,
  FileQuestion,
  Film,
  Calendar,
  ClipboardList,
  Bookmark,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, clearAuth } from "../../redux/slices/authSlice";
import { Lock, CreditCard, LogOut, FileText } from "lucide-react";
import { getCustomRole, hasCustomRole as checkHasCustomRole, hasBaseRole } from "../../utils/permissions";

const AdminSidebar = ({
  tab,
  setTab,
  applicationsCount = 0,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [rolesDropdownOpen, setRolesDropdownOpen] = useState(false);

  const hasInstructorRole = hasBaseRole(user, "instructor");
  const hasStudentRole = hasBaseRole(user, "student");
  const hasAdminRole = hasBaseRole(user, "admin");
  const hasCustomRole = checkHasCustomRole(user);

  const dashboardOptions = [];
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
    dashboardOptions.push({ name: customRole.name, path: "/staff-dashboard" });
  }

  const activeOption = dashboardOptions.find((opt) =>
    window.location.pathname.startsWith(opt.path),
  );
  const activeRoleName = activeOption ? activeOption.name : "";

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

  const navItems = [
    { id: "overview", label: t("adminSidebar.overview"), icon: BarChart2 },
    { id: "leaderboard", label: t("adminSidebar.leaderboard"), icon: Trophy },
    { id: "students", label: t("adminSidebar.students"), icon: Users },
    {
      id: "instructors",
      label: t("adminSidebar.instructors"),
      icon: GraduationCap,
    },
    { id: "courses", label: t("adminSidebar.courses"), icon: BookOpen },
    { id: "notes", label: t("adminSidebar.notes", "Notes"), icon: FileText },
    { id: "sessions", label: t("adminSidebar.sessions"), icon: Calendar },
    {
      id: "mock-tests",
      label: t("adminSidebar.mockTests", "Mock Tests"),
      icon: ClipboardList,
    },
    {
      id: "question-papers",
      label: t("adminSidebar.questionPapers"),
      icon: FileQuestion,
    },
    {
      id: "bulk-import",
      label: t("adminSidebar.bulkImport"),
      icon: UploadCloud,
    },
    {
      id: "payments",
      label: t("adminSidebar.payments", "Payments"),
      icon: CreditCard,
    },
    { id: "reels", label: t("adminSidebar.reels"), icon: Film },
    {
      id: "applications",
      label: t("adminSidebar.applications"),
      icon: CheckCircle,
      badge: applicationsCount,
    },
    {
      id: "references",
      label: t("adminSidebar.references", "References"),
      icon: Bookmark,
    },
    { id: "roles", label: t("adminSidebar.roles"), icon: Lock },
    { id: "devices", label: t("adminSidebar.devices"), icon: Shield },
  ];

  return (
    <>
      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed top-[64px] inset-x-0 bottom-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`bg-slate-950 border-r border-slate-800 flex flex-col overflow-hidden
    transition-transform duration-300 ease-in-out
    fixed top-[64px] bottom-0 h-[calc(100vh-64px)] left-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.6)]
    md:relative md:top-auto md:bottom-auto md:h-auto md:shadow-none md:translate-x-0
    ${collapsed ? "w-[68px] min-w-[68px]" : "w-[220px] min-w-[220px]"}
    ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}
      >
        {/* User Card */}
        <div className="px-3 mt-3 mb-4">
          <div
            className={`flex items-center rounded-xl ${
              collapsed ? "justify-center gap-1 p-2" : "gap-3 p-3"
            } bg-indigo-950/20 border border-indigo-900/30`}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-violet-600 text-xs font-bold text-white shadow-sm shadow-indigo-500/10 shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="truncate text-xs font-bold text-white">
                  {user?.name || "Admin User"}
                </div>
                {dashboardOptions.length > 1 ? (
                  <div className="relative">
                    {activeRoleName && (
                      <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider truncate mt-0.5">
                        {activeRoleName}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRolesDropdownOpen(!rolesDropdownOpen);
                      }}
                      className="flex items-center gap-1 text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:text-indigo-300 transition-colors bg-indigo-950/40 border border-indigo-900/30 rounded-full px-2.5 py-0.5 mt-1 cursor-pointer w-fit"
                    >
                      {dashboardOptions.length} Roles{" "}
                      <ChevronDown
                        size={10}
                        className={`transition-transform duration-200 ${rolesDropdownOpen ? "rotate-180" : ""}`}
                      />
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
                  <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider truncate mt-0.5">
                    {t("nav.roleAdmin", "Admin")}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => {
                setCollapsed((value) => !value);
                if (mobileOpen) setMobileOpen(false);
              }}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-800/60 bg-slate-900/80 text-slate-400 hover:border-indigo-500 hover:bg-indigo-950/60 hover:text-white transition"
            >
              <ChevronLeft
                size={14}
                className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3 pb-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  if (mobileOpen) setMobileOpen(false);
                }}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 w-full text-left ${
                  collapsed ? "justify-center" : "justify-start"
                } ${
                  isActive
                    ? "bg-indigo-950/40 text-indigo-300 border-l-2 border-indigo-500 pl-2.5"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white border-l-2 border-transparent"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && (
                  <span className="text-xs font-semibold flex-1">
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge > 0 && (
                  <span className="bg-red-500 text-white rounded-full text-[9px] font-bold px-2 py-0.5 min-w-4.5 text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="md:hidden p-3 border-t border-slate-800 shrink-0">
            <button
              onClick={() => {
                if (mobileOpen) setMobileOpen(false);
                dispatch(clearAuth());
                toast.success("Logged out successfully");
                navigate("/", { replace: true });
                dispatch(logoutUser()).catch(() => {});
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
    </>
  );
};

export default AdminSidebar;
