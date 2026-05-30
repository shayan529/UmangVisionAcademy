import React, { useEffect, useState } from "react";
import axios from "axios";

// Modular Admin sub-components
import AdminSidebar from "./AdminSidebar";
import AdminOverview from "./AdminOverview";
import AdminLeaderboard from "./AdminLeaderboard";
import AdminStudents from "./AdminStudents";
import AdminInstructors from "./AdminInstructors";
import AdminCourses from "./AdminCourses";
import AdminApplications from "./AdminApplications";

const API = "http://localhost:3000/api";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState("overview");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("revenue");
  const [sortDir, setSortDir] = useState("desc");
  const [sideOpen, setSideOpen] = useState(false); // mobile drawer
  const [sideCollapsed, setSideCollapsed] = useState(false); // desktop collapse

  useEffect(() => {
    init();
  }, []);

  // Clear search query whenever tab changes for a better UX
  useEffect(() => {
    setQ("");
  }, [tab]);

  const init = async () => {
    await Promise.all([fetchUsers(), fetchApplications(), fetchCourses()]);
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API}/users`);
      setStudents(data.filter((u) => u.role === "student"));
      setInstructors(data.filter((u) => u.role === "instructor"));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data } = await axios.get(`${API}/instructor-applications`);
      setApplications(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await axios.get(`${API}/courses`);
      setCourses(data);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API}/users/${id}`);
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const approveInstructor = async (id) => {
    try {
      await axios.put(`${API}/instructor-applications/${id}/approve`);
      fetchApplications();
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const rejectInstructor = async (id) => {
    try {
      await axios.delete(`${API}/instructor-applications/${id}`);
      fetchApplications();
    } catch (e) {
      console.error(e);
    }
  };

  /* ── Derived calculations ────────────────────────────── */
  const totalRevenue = courses.reduce(
    (s, c) => s + (c.price || 0) * (c.students?.length || 0),
    0
  );
  const totalEnrollments = courses.reduce(
    (s, c) => s + (c.students?.length || 0),
    0
  );

  const enriched = instructors.map((inst) => {
    const mc = courses.filter(
      (c) => c.instructor?._id === inst._id || c.instructor === inst._id
    );
    const rev = mc.reduce(
      (s, c) => s + (c.price || 0) * (c.students?.length || 0),
      0
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

  /* ── Tab Router Content switcher ─────────────────────── */
  const renderTabContent = () => {
    switch (tab) {
      case "overview":
        return (
          <AdminOverview
            students={students}
            instructors={instructors}
            courses={courses}
            applicationsCount={applications.length}
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

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-[#f1f5f9] md:flex">
      {/* Mobile backdrop */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <AdminSidebar
        tab={tab}
        setTab={setTab}
        applicationsCount={applications.length}
        collapsed={sideCollapsed}
        setCollapsed={setSideCollapsed}
        mobileOpen={sideOpen}
        setMobileOpen={setSideOpen}
      />

      {/* Right Content Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <main
          className="flex-1 px-4 py-4 md:px-7 md:py-6"
          onClick={() => {
            if (sideOpen) setSideOpen(false);
          }}
        >
          {/* Mobile Top Bar */}
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

          {/* Content Card Container */}
          <div className="rounded-3xl border border-slate-800 bg-white/5 p-5 md:p-7 min-h-full">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}