import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  deleteUser as deleteUserThunk,
} from "../../redux/slices/usersSlice";
import { fetchAllCoursesAdmin } from "../../redux/slices/courseSlice";

import AdminSidebar from "./AdminSidebar";
import AdminOverview from "./AdminOverview";
import AdminLeaderboard from "./AdminLeaderboard";
import AdminStudents from "./AdminStudents";
import AdminInstructors from "./AdminInstructors";
import AdminCourses from "./AdminCourses";
import AdminApplications from "./AdminApplications";
import AdminDevices from "./AdminDevices";
import AdminBulkImport from "./AdminBulkImport";
import RoleManager from "./RoleManager";

export default function AdminDashboard() {
  const dispatch = useDispatch();

  // ── Selectors ──────────────────────────────────────────────────────────────
  // usersSlice
  const {
    users = [],
    loading: usersLoading,
    error: usersError,
  } = useSelector((state) => state.users);

  // courseSlice stores the array under state.courses.courses (not state.courses)
  const {
    courses = [],
    loading: coursesLoading,
    error: coursesError,
  } = useSelector((state) => state.courses);

  const students = users.filter((u) => u.roles?.includes("student"));
  const instructors = users.filter((u) => u.roles?.includes("instructor"));

  // ── UI state ───────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("overview");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("revenue");
  const [sortDir, setSortDir] = useState("desc");
  const [sideOpen, setSideOpen] = useState(false);
  const [sideCollapsed, setSideCollapsed] = useState(false);

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchAllCoursesAdmin());
  }, [dispatch]);

  // Reset search when switching tabs
  useEffect(() => {
    setQ("");
  }, [tab]);

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

  // Global loading — show spinner on first load when both slices are empty
  const isInitialLoad =
    (usersLoading && users.length === 0) ||
    (coursesLoading && courses.length === 0);

  const globalError = usersError || coursesError;

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
              dispatch(fetchUsers());
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
            students={students}
            instructors={instructors}
            courses={courses}
            totalRevenue={totalRevenue}
            totalEnrollments={totalEnrollments}
            sortedInstructors={sortedInstructors}
            loading={coursesLoading || usersLoading}
          />
        );
      case "leaderboard":
        return (
          <AdminLeaderboard
            sortedInstructors={sortedInstructors}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDir={sortDir}
            setSortDir={setSortDir}
            loading={usersLoading || coursesLoading}
          />
        );
      case "students":
        return (
          <AdminStudents
            students={students}
            courses={courses}
            q={q}
            setQ={setQ}
            deleteUser={deleteUser}
            loading={usersLoading}
            refreshUsers={() => dispatch(fetchUsers())}
          />
        );
      case "instructors":
        return (
          <AdminInstructors
            enrichedInstructors={sortedInstructors}
            q={q}
            setQ={setQ}
            deleteUser={deleteUser}
            loading={usersLoading || coursesLoading}
          />
        );
      case "courses":
        return (
          <AdminCourses
            courses={courses}
            q={q}
            setQ={setQ}
            loading={coursesLoading}
            error={coursesError}
            onRetry={() => dispatch(fetchAllCoursesAdmin())}
          />
        );
      case "bulk-import":
        return <AdminBulkImport refreshUsers={() => dispatch(fetchUsers())} />;
      case "applications":
        return <AdminApplications />;
      case "roles":
        return <RoleManager />;
      case "devices":
        return <AdminDevices users={users} loading={usersLoading} />;
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

      <AdminSidebar
        tab={tab}
        setTab={setTab}
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
              Admin: {tab}
            </h2>

            {/* Live refetch indicator */}
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

// ── Full-page skeleton shown on initial load ──────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-800/60" />
        ))}
      </div>
      {/* Table rows */}
      <div className="flex flex-col gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-slate-800/40" />
        ))}
      </div>
    </div>
  );
}
