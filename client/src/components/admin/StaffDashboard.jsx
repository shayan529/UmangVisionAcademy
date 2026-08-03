import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, LogOut, Shield } from "lucide-react";
import AdminReels from "./AdminReels";
import AdminBulkImport from "./AdminBulkImport";
import AdminDevices from "./AdminDevices";
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
  getCustomRole,
  hasCustomRole as checkHasCustomRole,
  hasAnyPermission,
  hasBaseRole,
  hasPermission,
  hasDashboardModule,
} from "../../utils/permissions";
import { useTranslation } from "react-i18next";

import AdminOverview from "./AdminOverview";
import AdminStudents from "./AdminStudents";
import AdminInstructors from "./AdminInstructors";
import AdminCourses from "./AdminCourses";
import AdminApplications from "./AdminApplications";
import AdminReferences from "./AdminReferences";
import StaffPayments from "./StaffPayments";
import RoleManager from "./RoleManager";
import AdminSessions from "./AdminSessions";
import AdminMockTests from "./AdminMockTests";
import AdminQuestionPapers from "./AdminQuestionPapers";
import { Toast } from "../instructor/InstructorUi";
import InstructorAI from "../instructor/InstructorAI";

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
  const hasCustomRole = checkHasCustomRole(user);
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

  const rawNavItems = [
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
    ...(hasAnyPermission(user, [
      ["payments", "view"],
      ["payments", "refund"],
      ["payments", "export"],
    ])
      ? [{ id: "payments", label: "Payments", icon: "💳" }]
      : []),
    ...(hasPermission(user, "applications", "view")
      ? [
          {
            id: "applications",
            label: "Applications",
            icon: "📝",
            badge: applicationsCount,
          },
        ]
      : []),
    ...(hasPermission(user, "notes", "view") ||
    hasPermission(user, "notes", "approve") ||
    hasPermission(user, "notes", "reject")
      ? [{ id: "notes", label: "Notes Moderation", icon: "📄" }]
      : []),
    ...(hasPermission(user, "reels", "view")
      ? [{ id: "reels", label: "Reels Moderation", icon: "🎥" }]
      : []),
    ...(hasPermission(user, "mock_tests", "view")
      ? [{ id: "mock_tests", label: "Mock Tests", icon: "📋" }]
      : []),
    ...(hasPermission(user, "question_bank", "view")
      ? [{ id: "question_bank", label: "Question Bank", icon: "🗂️" }]
      : []),
    ...(hasPermission(user, "sessions", "view")
      ? [{ id: "sessions", label: "Sessions", icon: "📅" }]
      : []),
    ...(hasPermission(user, "ai_tutor", "access")
      ? [{ id: "ai_tutor", label: "AI Tutor", icon: "🤖" }]
      : []),
    ...(hasPermission(user, "references", "view")
      ? [{ id: "references", label: "References", icon: "🔗" }]
      : []),
    ...(hasBaseRole(user, "admin") ||
    hasPermission(user, "users", "view") ||
    hasPermission(user, "users", "create") ||
    hasPermission(user, "users", "edit")
      ? [{ id: "roles", label: "Roles & Permissions", icon: "🔒" }]
      : []),
    ...(hasBaseRole(user, "admin") ||
    hasPermission(user, "bulk_import", "view") ||
    hasPermission(user, "bulk_import", "import")
      ? [{ id: "bulk_import", label: "Bulk Import", icon: "📥" }]
      : []),
    ...(hasBaseRole(user, "admin") ||
    hasPermission(user, "devices", "view") ||
    hasPermission(user, "devices", "revoke")
      ? [{ id: "devices", label: "Logged In Devices", icon: "🖥️" }]
      : []),
  ];

  const navItems = rawNavItems.filter((item) =>
    hasDashboardModule(user, item.id),
  );

  const handleLogout = async () => {
    await dispatch(logoutUser())
      .unwrap()
      .catch(() => {});
    navigate("/login");
  };

  const authLoading = useSelector((s) => s.auth.loading);
  const username = user?.name || user?.email?.split("@")[0] || "Staff Member";
  const rawCustomRoleName = getCustomRole(user)?.name;
  const isObjectId = rawCustomRoleName && /^[a-f0-9]{24}$/i.test(rawCustomRoleName);
  const customRoleNames = isObjectId ? "Staff" : (rawCustomRoleName || "Staff");

  const isHydrating =
    authLoading ||
    !user ||
    (typeof user?.role === "string" && /^[a-f0-9]{24}$/i.test(user.role));

  const sidebarClass = `
    bg-slate-950 border-r border-slate-800 flex flex-col overflow-hidden
    transition-transform duration-300 ease-in-out
    fixed top-[64px] bottom-0 h-[calc(100vh-64px)] left-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.6)]
    md:relative md:top-auto md:bottom-auto md:h-auto md:shadow-none md:translate-x-0
    ${collapsed ? "w-[76px] min-w-[76px]" : "w-[260px] min-w-[260px]"}
    ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `;

  return (
    <>
      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed top-[64px] inset-x-0 bottom-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={sidebarClass}>
        {/* Mobile close header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 md:hidden shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Menu
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* User Card */}
        <div className="px-3 mt-3 mb-4 shrink-0">
          <div
            className={`flex items-start gap-2.5 p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-xl ${
              collapsed ? "justify-center p-2" : ""
            }`}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={username}
                className="h-10 w-10 rounded-full object-cover shrink-0 border border-indigo-500/30 mt-0.5"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 text-lg font-bold text-white shadow-sm shadow-indigo-500/20 shrink-0 mt-0.5">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-extrabold truncate">
                  {username}
                </p>
                {dashboardOptions.length > 1 ? (
                  <div className="relative mt-1">
                    {activeRoleName && (
                      <span
                        className="inline-flex items-start gap-1.5 max-w-full px-2 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/35 text-indigo-200 text-[10px] font-bold tracking-wide leading-tight break-words whitespace-normal"
                        title={activeRoleName}
                      >
                        <Shield size={10} className="shrink-0 text-indigo-400 mt-0.5" />
                        <span className="break-words leading-tight">{activeRoleName}</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRolesDropdownOpen(!rolesDropdownOpen);
                      }}
                      className="flex items-center gap-1 text-indigo-300 text-[10px] font-bold uppercase tracking-wider hover:text-white transition-colors bg-indigo-950/60 border border-indigo-800/40 rounded-full px-2.5 py-0.5 mt-1 cursor-pointer"
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
                  <div className="mt-1 flex items-center">
                    <span
                      className="inline-flex items-start gap-1.5 max-w-full px-2 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/35 text-indigo-200 text-[10px] font-bold tracking-wide break-words whitespace-normal leading-tight shadow-xs"
                      title={customRoleNames}
                    >
                      <Shield size={10} className="shrink-0 text-indigo-400 mt-0.5" />
                      <span className="break-words leading-tight">{customRoleNames}</span>
                    </span>
                  </div>
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
        <nav className="flex-1 flex flex-col gap-1.5 px-3 pb-8 overflow-y-auto">
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
                    ? "bg-indigo-950/50 text-indigo-200 font-bold border-l-2 border-indigo-500 pl-2.5 shadow-xs"
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

          {isHydrating && navItems.length <= 1 && (
            <div className="flex flex-col gap-2 mt-2 px-1 animate-pulse">
              <div className="h-9 w-full bg-slate-900/60 rounded-xl" />
              <div className="h-9 w-full bg-slate-900/40 rounded-xl" />
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-slate-800 shrink-0 md:hidden">
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
        </nav>
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
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  // If the user's role is still a raw ObjectId (not yet hydrated by the
  // server), force a fresh /users/me call. The protect middleware will
  // re-hydrate and return the populated Role document.
  useEffect(() => {
    const role = user?.role;
    const isUnpopulatedObjectId =
      role &&
      typeof role === "string" &&
      /^[a-f0-9]{24}$/i.test(role);
    if (isUnpopulatedObjectId) {
      dispatch(loadCurrentUser());
    }
  }, [user?.role, dispatch]);

  const refreshUsersAndCourses = useCallback(() => {
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

  const deleteUser = (id, role) => {
    dispatch(deleteUserThunk({ id, role })).then(() => {
      dispatch(fetchAllCoursesAdmin());
    });
  };

  useEffect(() => {
    refreshUsersAndCourses();
  }, [tab, refreshUsersAndCourses]);

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

  const currentTabError =
    (tab === "students" || tab === "instructors") && hasPermission(user, "users", "view")
      ? usersError
      : tab === "courses" && hasPermission(user, "courses", "view")
        ? coursesError
        : null;

  const renderTabContent = () => {
    if (isInitialLoad) return <DashboardSkeleton />;

    if (currentTabError)
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-red-400 font-semibold text-sm">{currentTabError}</p>
          <button
            onClick={() => {
              if (tab === "courses") dispatch(fetchAllCoursesAdmin());
              else dispatch(fetchUsers());
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
            canCreate={hasPermission(user, "courses", "create")}
            canEdit={hasPermission(user, "courses", "edit")}
            canDelete={hasPermission(user, "courses", "delete")}
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
            courses={courses}
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
        return hasPermission(user, "applications", "view") ? (
          <AdminApplications
            canModerate={hasPermission(user, "applications", "approve")}
          />
        ) : null;
      case "payments":
        return hasAnyPermission(user, [
          ["payments", "view"],
          ["payments", "refund"],
          ["payments", "export"],
        ]) ? (
          <StaffPayments user={user} />
        ) : null;
      case "notes":
        return hasAnyPermission(user, [
          ["notes", "view"],
          ["notes", "approve"],
          ["notes", "reject"],
        ]) ? (
          <div className="p-4 text-slate-300 text-sm">
            <p className="text-base font-bold text-white mb-2">Notes Moderation</p>
            <p className="text-slate-500">
              Use the instructor panel or navigate to the notes moderation queue.
            </p>
          </div>
        ) : null;
      case "mock_tests":
        return hasPermission(user, "mock_tests", "view") ? (
          <AdminMockTests showToast={showToast} />
        ) : null;
      case "question_bank":
        return hasPermission(user, "question_bank", "view") ? (
          <AdminQuestionPapers />
        ) : null;
      case "ai_tutor":
        return hasPermission(user, "ai_tutor", "access") ? (
          <InstructorAI showToast={showToast} />
        ) : null;
      case "reels":
        return hasPermission(user, "reels", "view") ? <AdminReels /> : null;
      case "sessions":
        return hasPermission(user, "sessions", "view") ? (
          <AdminSessions
            instructors={instructors}
            canCreate={hasPermission(user, "sessions", "create")}
            canEdit={hasPermission(user, "sessions", "edit")}
            canDelete={hasPermission(user, "sessions", "delete")}
            canApprove={hasPermission(user, "sessions", "approve")}
          />
        ) : null;
      case "references":
        return hasPermission(user, "references", "view") ? (
          <AdminReferences showToast={showToast} />
        ) : null;
      case "roles":
        return hasBaseRole(user, "admin") ||
          hasPermission(user, "users", "view") ||
          hasPermission(user, "users", "create") ||
          hasPermission(user, "users", "edit") ? (
          <RoleManager
            currentUser={user}
            showToast={showToast}
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
      case "bulk_import":
        return hasBaseRole(user, "admin") ||
          hasPermission(user, "bulk_import", "view") ||
          hasPermission(user, "bulk_import", "import") ? (
          <AdminBulkImport showToast={showToast} />
        ) : null;
      case "devices":
        return hasBaseRole(user, "admin") ||
          hasPermission(user, "devices", "view") ||
          hasPermission(user, "devices", "revoke") ? (
          <AdminDevices showToast={showToast} />
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
      <Toast msg={toastMsg} />
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
