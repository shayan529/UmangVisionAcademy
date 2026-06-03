import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  deleteUser as deleteUserThunk,
} from "../../redux/slices/usersSlice";
import { fetchCourses } from "../../redux/slices/courseSlice";

import AdminSidebar from "./AdminSidebar";
import AdminOverview from "./AdminOverview";
import AdminLeaderboard from "./AdminLeaderboard";
import AdminStudents from "./AdminStudents";
import AdminInstructors from "./AdminInstructors";
import AdminCourses from "./AdminCourses";
import AdminApplications from "./AdminApplications";

export default function AdminDashboard() {
  const dispatch = useDispatch();

  const { users = [] } = useSelector((state) => state.users);
  const { courses = [] } = useSelector((state) => state.courses);

  const students = users.filter((u) => u.roles?.includes("student"));
  const instructors = users.filter((u) => u.roles?.includes("instructor"));

  const [tab, setTab] = useState("overview");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("revenue");
  const [sortDir, setSortDir] = useState("desc");
  const [sideOpen, setSideOpen] = useState(false);
  const [sideCollapsed, setSideCollapsed] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchCourses());
  }, [dispatch]);

  useEffect(() => {
    setQ("");
  }, [tab]);

  const deleteUser = (id) => dispatch(deleteUserThunk(id));

  /* ── Derived calculations ── */
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

  /* ── Tab content ── */
  const renderTabContent = () => {
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
          />
        );
      case "instructors":
        return (
          <AdminInstructors
            enrichedInstructors={sortedInstructors}
            q={q}
            setQ={setQ}
            deleteUser={deleteUser}
          />
        );
      case "courses":
        return <AdminCourses courses={courses} q={q} setQ={setQ} />;
      case "applications":
        return <AdminApplications />;
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
          </div>

          <div className="rounded-3xl border border-slate-800 bg-white/5 p-5 md:p-7 min-h-full">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
