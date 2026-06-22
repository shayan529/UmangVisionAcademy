import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  CheckCircle,
  BookOpen,
  BarChart2,
  ChevronLeft,
  CreditCard,
  Lock,
} from "lucide-react";
import {
  fetchUsers,
  deleteUser as deleteUserThunk,
} from "../../redux/slices/usersSlice";
import { fetchAllCoursesAdmin } from "../../redux/slices/courseSlice";
import { logoutUser } from "../../redux/slices/authSlice";
import {
  getCustomRoles,
  hasAnyPermission,
  hasBaseRole,
  hasPermission,
} from "../../utils/permissions";

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
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    ...(hasPermission(user, "courses", "view")
      ? [{ id: "courses", label: "Courses", icon: BookOpen }]
      : []),
    ...(hasPermission(user, "users", "view")
      ? [
          { id: "students", label: "Students", icon: Users },
          { id: "instructors", label: "Instructors", icon: GraduationCap },
        ]
      : []),
    ...(hasPermission(user, "payments", "view") ||
    hasPermission(user, "payments", "refund") ||
    hasPermission(user, "payments", "export")
      ? [{ id: "payments", label: "Payments", icon: CreditCard }]
      : []),
    ...(hasPermission(user, "moderation", "view")
      ? [
          {
            id: "applications",
            label: "Applications",
            icon: CheckCircle,
            badge: applicationsCount,
          },
        ]
      : []),
    // Roles & Permissions is intentionally gated on the BASE "admin" role
    // only — never on a custom permission. Granting "manage roles" through
    // the permission matrix itself would let a custom role escalate its
    // own access (e.g. assign itself more permissions).
    ...(hasBaseRole(user, "admin")
      ? [{ id: "roles", label: "Roles & Permissions", icon: Lock }]
      : []),
  ];

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate("/login");
    });
  };

  const sidebarClass = `bg-[#0b1120] border-r border-slate-800 flex flex-col transition-all duration-300 z-40 ${
    collapsed ? "w-[68px] min-w-[68px]" : "w-[220px] min-w-[220px]"
  } ${
    mobileOpen
      ? "fixed top-[72px] left-0 h-[calc(100vh-72px)] shadow-2xl md:relative md:top-0 md:h-auto md:shadow-none"
      : "hidden md:flex"
  }`;

  const username = user?.name || user?.email?.split("@")[0] || "Staff Member";
  const customRoleNames =
    getCustomRoles(user).map((r) => r.name).join(", ") || "Staff";

  return (
    <aside className={sidebarClass}>
      <div className="flex items-center justify-between mb-5 px-3 py-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-black font-extrabold text-sm shadow-md shadow-indigo-500/20">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                Staff Panel
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-black font-extrabold text-sm">
            S
          </div>
        )}
        <button
          onClick={() => {
            setCollapsed((c) => !c);
            if (mobileOpen) setMobileOpen(false);
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-white transition"
        >
          <ChevronLeft
            size={14}
            className={`transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <div className="px-3 mb-4">
        <div
          className={`flex flex-col gap-2 rounded-xl p-3 ${
            collapsed ? "items-center" : "items-start"
          } bg-indigo-950/20 border border-indigo-900/30`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-violet-600 text-xs font-bold text-white shadow-sm shadow-indigo-500/10">
              ST
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="truncate text-xs font-bold text-white">
                  {username}
                </div>
                <div
                  className="text-[9px] text-indigo-400 font-semibold truncate max-w-[130px]"
                  title={customRoleNames}
                >
                  {customRoleNames}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
      </nav>

      <div className="px-3 pb-4 pt-2 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-red-400 hover:bg-red-950/20 hover:text-red-300 transition w-full text-left ${
            collapsed ? "justify-center" : "justify-start"
          }`}
          title={collapsed ? "Logout" : undefined}
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!collapsed && <span className="text-xs font-semibold">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default function StaffDashboard() {
  const dispatch = useDispatch();

  // ── Selectors ──────────────────────────────────────────────────────────────
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

  // ── UI state ───────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("overview");
  const [q, setQ] = useState("");
  const sortBy = "revenue";
  const sortDir = "desc";
  const [sideOpen, setSideOpen] = useState(false);
  const [sideCollapsed, setSideCollapsed] = useState(false);

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasPermission(user, "users", "view")) {
      dispatch(fetchUsers());
    }
    if (hasPermission(user, "courses", "view")) {
      dispatch(fetchAllCoursesAdmin());
    }
  }, [dispatch, user]);

  const deleteUser = (id) => dispatch(deleteUserThunk(id));

  // ── Derived stats ──────────────────────────────────────────────────────────
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

  // ── Tab renderer ───────────────────────────────────────────────────────────
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
            refreshUsers={() => dispatch(fetchUsers())}
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
            refreshUsers={() => dispatch(fetchUsers())}
            canCreate={hasPermission(user, "users", "create")}
            canEdit={hasPermission(user, "users", "edit")}
            canDelete={hasPermission(user, "users", "delete")}
          />
        ) : null;
      case "applications":
        // Gated solely on the "moderation" module — kept independent of
        // courses.approve so that course-approval rights don't implicitly
        // grant visibility into the (unrelated) instructor-application queue.
        return hasPermission(user, "moderation", "view") ? (
          <AdminApplications
            canModerate={hasPermission(user, "moderation", "remove")}
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
      case "roles":
        // Hard admin-only gate, matching the sidebar — never reachable by
        // typing the tab id manually if you're not a base admin.
        return hasBaseRole(user, "admin") ? (
          <RoleManager
            currentUser={user}
            showToast={(msg) => console.log(msg)}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-[#f1f5f9] md:flex">
      {sideOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

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
