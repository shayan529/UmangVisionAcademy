import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, LogOut } from "lucide-react";
import AdminReels from "./AdminReels";
import {
  fetchUsers,
  deleteUser as deleteUserThunk,
  replaceUser,
} from "../../redux/slices/usersSlice";
import { fetchAllCoursesAdmin } from "../../redux/slices/courseSlice";
import {
  loadCurrentUser,
  logoutUser,
  replaceCurrentUser,
} from "../../redux/slices/authSlice";
import {
  getCustomRoles,
  hasAnyPermission,
  hasBaseRole,
  hasPermission,
} from "../../utils/permissions";
import { useTranslation } from "react-i18next";

import AdminOverview from "./AdminOverview";
import AdminStudents from "./AdminStudents";
import AdminInstructors from "./AdminInstructors";
import AdminCourses from "./AdminCourses";
import AdminApplications from "./AdminApplications";
import StaffPayments from "./StaffPayments";
import RoleManager from "./RoleManager";

const StaffSidebar = ({
  user,
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

  const [rolesDropdownOpen, setRolesDropdownOpen] = useState(false);

  const hasInstructorRole = hasBaseRole(user, "instructor");
  const hasStudentRole = hasBaseRole(user, "student");
  const hasAdminRole = hasBaseRole(user, "admin");
  const hasCustomRole = getCustomRoles(user).length > 0;
  const isMultiRole =
    hasInstructorRole && hasStudentRole && !hasAdminRole && !hasCustomRole;

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
  getCustomRoles(user).forEach((role) => {
    dashboardOptions.push({ name: role.name, path: "/staff-dashboard" });
  });

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
    { id: "overview", label: "Overview", icon: "📊" },
    ...(hasPermission(user, "courses", "view")
      ? [{ id: "courses", label: "Courses", icon: "📚" }]
      : []),
    ...(hasPermission(user, "users", "view")
      ? [
          { id: "students", label: "Students", icon: "👥" },
          { id: "instructors", label: "Instructors", icon: "🎓" },
        ]
      : []),
    ...(hasPermission(user, "payments", "view") ||
    hasPermission(user, "payments", "refund") ||
    hasPermission(user, "payments", "export")
      ? [{ id: "payments", label: "Payments", icon: "💳" }]
      : []),
    ...(hasPermission(user, "moderation", "view")
      ? [
          {
            id: "applications",
            label: "Applications",
            icon: "📝",
            badge: applicationsCount,
          },
        ]
      : []),
    ...(hasPermission(user, "reels", "view")
      ? [{ id: "reels", label: "Reels Moderation", icon: "🎥" }]
      : []),
    ...(hasBaseRole(user, "admin")
      ? [{ id: "roles", label: "Roles & Permissions", icon: "🔒" }]
      : []),
  ];

  const handleLogout = async () => {
    await dispatch(logoutUser())
      .unwrap()
      .catch(() => {});
    navigate("/login");
  };

  const username = user?.name || user?.email?.split("@")[0] || "Staff Member";
  const customRoleNames =
    getCustomRoles(user)
      .map((r) => r.name)
      .join(", ") || "Staff";

  const sidebarClass = `
    relative flex flex-col bg-slate-950 border-r border-slate-800
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-[76px] min-w-[76px]" : "w-[260px] min-w-[260px]"}
    ${
      mobileOpen
        ? "fixed inset-y-0 left-0 h-dvh w-[260px] shadow-[4px_0_24px_rgba(0,0,0,0.6)] z-50"
        : "hidden md:flex z-40 md:relative md:h-auto md:min-h-screen"
    }
  `;

  return (
    <>
      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

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
                alt={username}
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
                  {username}
                </p>
                {dashboardOptions.length > 1 ? (
                  <div className="relative">
                    {activeRoleName && (
                      <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider truncate mt-0.5">
                        {activeRoleName}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRolesDropdownOpen(!rolesDropdownOpen);
                      }}
                      className="flex items-center gap-1 text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:text-indigo-300 transition-colors bg-indigo-950/40 border border-indigo-900/30 rounded-full px-2.5 py-0.5 mt-1 cursor-pointer"
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
                  <p
                    className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider truncate mt-0.5"
                    title={customRoleNames}
                  >
                    {customRoleNames}
                  </p>
                )}
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => {
                  setCollapsed((c) => !c);
                  if (mobileOpen) setMobileOpen(false);
                }}
                title="Collapse sidebar"
                className="hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-800/60 bg-slate-900/80 text-slate-400 hover:border-indigo-500 hover:bg-indigo-950/60 hover:text-white transition"
              >
                <ChevronLeft
                  size={14}
                  className="transition-transform duration-300"
                />
              </button>
            )}
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                title="Expand sidebar"
                className="hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-800/60 bg-slate-900/80 text-slate-400 hover:border-indigo-500 hover:bg-indigo-950/60 hover:text-white transition mt-2 mx-auto"
              >
                <ChevronLeft size={14} className="rotate-180" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3 pb-4 overflow-y-auto">
          {navItems.map((item) => {
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
                <span className="shrink-0 text-lg leading-none">
                  {item.icon}
                </span>
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
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl py-2.5 px-3 transition-all duration-200 w-full text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 cursor-pointer"
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut size={16} className="text-rose-400 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-semibold">Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default function StaffDashboard() {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const {
    users = [],
    loading: usersLoading,
    error: usersError,
  } = useSelector((state) => state.users);

  const {
    courses = [],
    loading: coursesLoading,
    error: coursesError,
  } = useSelector((state) => state.courses);

  const students = users.filter((u) => hasBaseRole(u, "student"));
  const instructors = users.filter((u) => hasBaseRole(u, "instructor"));

  const [tab, setTab] = useState("overview");
  const [q, setQ] = useState("");
  const sortBy = "revenue";
  const sortDir = "desc";
  const [sideOpen, setSideOpen] = useState(false);
  const [sideCollapsed, setSideCollapsed] = useState(false);

  useEffect(() => {
    if (hasPermission(user, "users", "view")) {
      dispatch(fetchUsers());
    }
    if (hasPermission(user, "courses", "view")) {
      dispatch(fetchAllCoursesAdmin());
    }
  }, [dispatch, user]);

  useEffect(() => {
    const handleNavbarMenuOpen = () => {
      setSideOpen(false);
    };

    window.addEventListener("navbar-mobile-menu-open", handleNavbarMenuOpen);

    return () => {
      window.removeEventListener(
        "navbar-mobile-menu-open",
        handleNavbarMenuOpen,
      );
    };
  }, []);

  const refreshUsersAndCourses = () => {
    dispatch(fetchUsers());
    dispatch(fetchAllCoursesAdmin());
  };

  const deleteUser = (id, role) => {
    dispatch(deleteUserThunk({ id, role })).then(() => {
      dispatch(fetchAllCoursesAdmin());
    });
  };

  useEffect(() => {
    refreshUsersAndCourses();
  }, [tab]);

  const totalRevenue = courses.reduce(
    (s, c) => s + (c.price || 0) * (c.students?.length || 0),
    0,
  );
  const totalEnrollments = courses.reduce(
    (s, c) => s + (c.students?.length || 0),
    0,
  );

  const enriched = instructors.map((inst) => {
    const mc = courses.filter(
      (c) => c.instructor?._id === inst._id || c.instructor === inst._id,
    );
    const rev = mc.reduce(
      (s, c) => s + (c.price || 0) * (c.students?.length || 0),
      0,
    );
    const stu = mc.reduce((s, c) => s + (c.students?.length || 0), 0);
    const avg = mc.length
      ? (mc.reduce((s, c) => s + (c.rating || 4.2), 0) / mc.length).toFixed(1)
      : "—";
    return { ...inst, mc, rev, stu, avg };
  });

  const sortedInstructors = [...enriched].sort((a, b) => {
    const v = sortDir === "desc" ? -1 : 1;
    if (sortBy === "revenue") return v * (a.rev - b.rev);
    if (sortBy === "students") return v * (a.stu - b.stu);
    if (sortBy === "courses") return v * (a.mc.length - b.mc.length);
    if (sortBy === "rating") return v * (parseFloat(a.avg) - parseFloat(b.avg));
    return 0;
  });

  const isInitialLoad =
    (usersLoading &&
      users.length === 0 &&
      hasPermission(user, "users", "view")) ||
    (coursesLoading &&
      courses.length === 0 &&
      hasPermission(user, "courses", "view"));

  const globalError =
    (hasPermission(user, "users", "view") ? usersError : null) ||
    (hasPermission(user, "courses", "view") ? coursesError : null);

  const renderTabContent = () => {
    if (isInitialLoad) return <DashboardSkeleton />;

    if (globalError)
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-red-400 font-semibold text-sm">{globalError}</p>
          <button
            onClick={() => {
              if (hasPermission(user, "users", "view")) dispatch(fetchUsers());
              if (hasPermission(user, "courses", "view"))
                dispatch(fetchAllCoursesAdmin());
            }}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm text-red-300 hover:bg-red-500/20 transition"
          >
            Retry
          </button>
        </div>
      );

    switch (tab) {
      case "overview":
        return (
          <AdminOverview
            user={user}
            students={students}
            instructors={instructors}
            courses={courses}
            totalRevenue={totalRevenue}
            totalEnrollments={totalEnrollments}
            sortedInstructors={sortedInstructors}
            loading={coursesLoading || usersLoading}
          />
        );
      case "courses":
        return hasPermission(user, "courses", "view") ? (
          <AdminCourses
            courses={courses}
            q={q}
            setQ={setQ}
            loading={coursesLoading}
            error={coursesError}
            onRetry={() => dispatch(fetchAllCoursesAdmin())}
            canApprove={hasPermission(user, "courses", "approve")}
          />
        ) : null;
      case "students":
        return hasPermission(user, "users", "view") ? (
          <AdminStudents
            students={students}
            courses={courses}
            q={q}
            setQ={setQ}
            deleteUser={deleteUser}
            loading={usersLoading}
            refreshUsers={refreshUsersAndCourses}
            canCreate={hasPermission(user, "users", "create")}
            canEdit={hasPermission(user, "users", "edit")}
            canDelete={hasPermission(user, "users", "delete")}
          />
        ) : null;
      case "instructors":
        return hasPermission(user, "users", "view") ? (
          <AdminInstructors
            enrichedInstructors={sortedInstructors}
            q={q}
            setQ={setQ}
            deleteUser={deleteUser}
            loading={usersLoading || coursesLoading}
            refreshUsers={refreshUsersAndCourses}
            canCreate={hasPermission(user, "users", "create")}
            canEdit={hasPermission(user, "users", "edit")}
            canDelete={hasPermission(user, "users", "delete")}
          />
        ) : null;
      case "applications":
        return hasPermission(user, "moderation", "view") ? (
          <AdminApplications
            canModerate={hasPermission(user, "moderation", "remove")}
          />
        ) : null;
      case "reels":
        return hasPermission(user, "reels", "view") ? <AdminReels /> : null;
      case "payments":
        return hasAnyPermission(user, [
          ["payments", "view"],
          ["payments", "refund"],
          ["payments", "export"],
        ]) ? (
          <StaffPayments user={user} />
        ) : null;
      case "roles":
        return hasBaseRole(user, "admin") ? (
          <RoleManager
            currentUser={user}
            showToast={(msg) => console.log(msg)}
            onUserRolesUpdated={(updatedUser) => {
              dispatch(replaceUser(updatedUser));
              dispatch(replaceCurrentUser(updatedUser));
              refreshUsersAndCourses();
            }}
            onRoleChanged={() => {
              refreshUsersAndCourses();
              dispatch(loadCurrentUser());
            }}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-[#f1f5f9] md:flex">
      <StaffSidebar
        user={user}
        tab={tab}
        setTab={(nextTab) => {
          setTab(nextTab);
          setQ("");
        }}
        collapsed={sideCollapsed}
        setCollapsed={setSideCollapsed}
        mobileOpen={sideOpen}
        setMobileOpen={setSideOpen}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <main
          className="flex-1 px-4 py-4 md:px-7 md:py-6"
          onClick={() => {
            if (sideOpen) setSideOpen(false);
          }}
        >
          {/* Mobile top bar */}
          <div className="flex items-center justify-between gap-4 pb-4 md:hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("dashboard-sidebar-open"));
                setSideOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20"
            >
              Menu
            </button>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1">
              Staff: {tab}
            </h2>
            {(coursesLoading || usersLoading) && !isInitialLoad && (
              <span className="text-[10px] text-indigo-400 font-semibold animate-pulse">
                Syncing…
              </span>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-white/5 p-5 md:p-7 min-h-full">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-800/60" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-slate-800/40" />
        ))}
      </div>
    </div>
  );
}
