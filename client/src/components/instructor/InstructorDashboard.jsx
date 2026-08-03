import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser, clearAuth } from "../../redux/slices/authSlice";
import toast from "react-hot-toast";
import { ChevronDown, LogOut } from "lucide-react";

// UI primitives & modal
import { Toast, Btn } from "./InstructorUi";

// Section components
import InstructorHome from "./InstructorHome";
import InstructorCourses from "./InstructorCourses";
import InstructorStudents from "./InstructorStudents";
import InstructorSessions from "./InstructorSessions";
import InstructorAnalytics from "./InstructorAnalytics";
import InstructorAI from "./InstructorAI";
import InstructorNotifications from "./InstructorNotifications";
import InstructorSettings from "./InstructorSettings";
import InstructorMockTests from "./InstructorMockTests";
import InstructorNotes from "./InstructorNotes";
import MyReels from "../reels/MyReels";
import { createCourse } from "../../redux/slices/courseSlice";
import { useTranslation } from "react-i18next";
import {
  getCustomRole,
  hasCustomRole as checkHasCustomRole,
  hasBaseRole,
  hasDashboardModule, // ← add
} from "../../utils/permissions";
import {
  initialSessions,
  initialNotifs,
  initialSettings,
  navItems,
  sectionTitles,
} from "./InstructorData";
import { useDispatch, useSelector } from "react-redux";

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  subject: "",
  className: "",
  description: "",
  content: "",
  thumbnailUrl: "",
  demoVideoUrl: "",
};

// ─── Main shell ───────────────────────────────────────────────────────────────
export default function InstructorDashboard() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sessions, setSessions] = useState(initialSessions);
  const [notifs, setNotifs] = useState(initialNotifs);
  const [settings, setSettings] = useState(initialSettings);
  const [toastMsg, setToastMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    if (!sidebarOpen) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollTop(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    setScrollTop(window.scrollY);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sidebarOpen]);


  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [sidebarOpen]);

  const dynamicTop = sidebarOpen ? Math.max(0, 73 - scrollTop) : 0;
  const [courseForm, setCourseForm] = useState(EMPTY_FORM);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courses } = useSelector((s) => s.courses);
  const { user } = useSelector((s) => s.auth);
  const [rolesDropdownOpen, setRolesDropdownOpen] = useState(false);

  const hasInstructorRole = hasBaseRole(user, "instructor");
  const hasStudentRole = hasBaseRole(user, "student");
  const hasAdminRole = hasBaseRole(user, "admin");
  const hasCustomRole = checkHasCustomRole(user);
  const isMultiRole =
    hasInstructorRole && hasStudentRole && !hasAdminRole && !hasCustomRole;

  const dashboardOptions = [];
  if (hasStudentRole) {
    dashboardOptions.push({
      name: t("nav.roleStudent", "Student"),
      path: "/student-dashboard",
    });
  }
  if (hasInstructorRole) {
    dashboardOptions.push({
      name: t("nav.roleInstructor", "Instructor"),
      path: "/instructor-dashboard",
    });
  }
  if (hasAdminRole) {
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

  const dashboardPath = hasAdminRole
    ? "/admin-dashboard"
    : hasCustomRole
      ? "/staff-dashboard"
      : hasInstructorRole
        ? "/instructor-dashboard"
        : "/student-dashboard";

  const isInstructorDashboard = window.location.pathname.startsWith(
    "/instructor-dashboard",
  );
  const goingToInstructor = !isInstructorDashboard;
  const switchTarget = goingToInstructor
    ? "/instructor-dashboard"
    : "/student-dashboard";
  const switchLabel = goingToInstructor
    ? t("nav.goToInstructor")
    : t("nav.goToStudent");

  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const handleNavbarMenuOpen = () => {
      setSidebarOpen(false);
    };

    window.addEventListener("navbar-mobile-menu-open", handleNavbarMenuOpen);

    return () => {
      window.removeEventListener(
        "navbar-mobile-menu-open",
        handleNavbarMenuOpen,
      );
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setCourseForm(EMPTY_FORM);
  };

  const addCourse = () => {
    if (!courseForm.subject.trim()) {
      showToast(t("instructorDashboard.enterSubject"));
      return;
    }
    if (!courseForm.className) {
      showToast(t("instructorDashboard.selectClass"));
      return;
    }
    if (!courseForm.description?.trim()) {
      showToast(t("instructorDashboard.enterDescription"));
      return;
    }

    dispatch(
      createCourse({
        title: courseForm.subject.trim(),
        summary: courseForm.description.trim(),
        description: courseForm.content?.trim() || "",
        category: courseForm.className,
        level: "Beginner",
        price: 0,
        thumbnailUrl: courseForm.thumbnailUrl?.trim() || "",
        demoVideoUrl: courseForm.demoVideoUrl?.trim() || "",
        published: false,
      }),
    );

    showToast(t("instructorDashboard.courseCreated"));
    closeModal();
  };

  const handleNavClick = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!courses.length) {
      showToast(t("instructorDashboard.noCoursesToExport"));
      return;
    }
    const rows = [
      ["Title", "Status", "Students", "Revenue ($)", "Rating"],
      ...courses.map((c) => [
        `"${c.title}"`,
        c.status,
        c.enrolledCount ?? 0,
        c.revenue ?? 0,
        c.ratingAverage ?? 0,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `courses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("instructorDashboard.reportDownloaded"));
  };

  // ── Section router ─────────────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <InstructorHome showToast={showToast} onNavigate={handleNavClick} />
        );
      case "courses":
        return (
          <InstructorCourses showToast={showToast} onNewCourse={openModal} />
        );
      case "students":
        return <InstructorStudents />;
      case "sessions":
        return <InstructorSessions showToast={showToast} />;
      case "analytics":
        return <InstructorAnalytics />;
      case "notes":
        return <InstructorNotes showToast={showToast} />;
      case "reels":
        return <MyReels />;
      case "mock-tests":
        return <InstructorMockTests />;
      case "ai":
        return <InstructorAI showToast={showToast} />;
      case "notifications":
        return (
          <InstructorNotifications notifs={notifs} setNotifs={setNotifs} />
        );
      case "settings":
        return <InstructorSettings showToast={showToast} />;
      default:
        return null;
    }
  };

  // ── Sidebar content ────────────────────────────────────────────────────────
  const SidebarContent = () => {
    const { user } = useSelector((state) => state.auth);
    const { t } = useTranslation();

    // Merge mock-tests into navItems if not already present in InstructorData
    const allNavItemsRaw = navItems.some((n) => n.id === "mock-tests")
      ? navItems
      : (() => {
        const idx = navItems.findIndex((n) => n.id === "sessions");
        const copy = [...navItems];
        copy.splice(idx + 1, 0, { id: "mock-tests", icon: "📝" });
        return copy;
      })();

    const allNavItems = allNavItemsRaw.filter((item) =>
      hasDashboardModule(user, item.id),
    );

    return (
      <>
        {/* User Card */}
        <div className="px-3 mt-3 mb-4">
          <div className="flex items-center rounded-xl gap-3 p-3 bg-indigo-950/20 border border-indigo-900/30">
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
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-white">
                {user?.name}
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
                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider truncate mt-0.5">
                  {hasAdminRole
                    ? t("nav.roleAdmin")
                    : isMultiRole
                      ? t("nav.roleMultiple")
                      : hasInstructorRole
                        ? t("nav.roleInstructor")
                        : t("nav.roleStudent")}
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 px-3 pb-4 overflow-y-auto">
          {allNavItems.map(({ id, icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 w-full text-left justify-start ${isActive
                  ? "bg-indigo-950/40 text-indigo-300 border-l-2 border-indigo-500 pl-2.5"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white border-l-2 border-transparent"
                  }`}
              >
                <span className="shrink-0 text-lg leading-none">{icon}</span>
                <span className="text-xs font-semibold flex-1">
                  {id === "mock-tests"
                    ? t("instructorSidebar.mockTests")
                    : t(`instructorSidebar.${id}`)}
                </span>

                {id === "notifications" && unread > 0 && (
                  <span className="bg-red-500 text-white rounded-full text-[9px] font-bold px-2 py-0.5 min-w-4.5 text-center">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
          {/* Profile & Logout Section (Mobile View Only) */}
          <div className="md:hidden p-3 border-t border-slate-800 shrink-0">
            {isMultiRole && (
              <Link
                to={switchTarget}
                onClick={() => setSidebarOpen(false)}
                className="btn-indigo-shine mb-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
              >
                ⇄ {switchLabel}
              </Link>
            )}
            <button
              onClick={() => {
                setSidebarOpen(false);
                dispatch(clearAuth());
                toast.success("Logged out successfully");
                navigate("/", { replace: true });
                dispatch(logoutUser()).catch(() => {});
              }}
              className="flex items-center gap-3 rounded-xl py-2.5 px-3 transition-all duration-200 w-full text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 cursor-pointer"
            >
              <LogOut size={16} className="text-rose-400 shrink-0" />
              <span className="text-sm font-semibold">{t("nav.logout")}</span>
            </button>
          </div>
        </nav>
      </>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .instr-sidebar  { display: flex; }
        .instr-mob-bar  { display: none; }
        .instr-desk-bar { display: flex; }
        .instr-drawer   { display: flex; }
        @media (max-width: 767px) {
          .instr-sidebar  { display: none !important; }
          .instr-mob-bar  { display: flex !important; }
          .instr-desk-bar { display: none !important; }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#020817",
          color: "#f1f5f9",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
      >
        {/* Desktop sidebar */}
        <aside
          className="instr-sidebar bg-slate-950 border-r border-slate-800"
          style={{
            width: 230,
            flexDirection: "column",
            position: "sticky",
            top: 0,
            height: "100vh",
            flexShrink: 0,
          }}
        >
          <SidebarContent />
        </aside>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-[150] bg-slate-950/75 backdrop-blur-xs md:hidden"
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={`bg-slate-950 border-r border-slate-800 flex-col transition-all duration-300 z-[200] md:hidden
            ${sidebarOpen
              ? "fixed inset-y-0 left-0 h-screen w-[220px] shadow-[4px_0_24px_rgba(0,0,0,0.6)] flex"
              : "hidden"
            }
          `}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              alignSelf: "flex-end",
              background: "transparent",
              border: "none",
              color: "#64748b",
              fontSize: 22,
              cursor: "pointer",
              marginRight: 16,
              marginTop: 12,
              marginBottom: 4,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ✕
          </button>
          <SidebarContent />
        </aside>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* Mobile top bar */}
          <div
            className="instr-mob-bar"
            style={{
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: "#0b1120",
              borderBottom: "1px solid #1e293b",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("dashboard-sidebar-open"));
                setSidebarOpen(true);
              }}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "#f1f5f9",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t("instructorDashboard.menu")}
            </button>
            {/* <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>
              {activeSection === "mock-tests"
                ? "Mock Tests"
                : sectionTitles[activeSection]}
            </div> */}
            <span style={{ width: 48 }} />
          </div>

          {/* Desktop top bar */}
          {/* <div
            className="instr-desk-bar"
            style={{
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 28px",
              background: "#0b1120",
              borderBottom: "1px solid #1e293b",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>
              {activeSection === "mock-tests"
                ? "Mock Tests"
                : sectionTitles[activeSection]}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn
                variant="ghost"
                style={{ fontSize: 12 }}
                onClick={handleExport}
              >
                📥 Export
              </Btn>

              {activeSection === "sessions" && (
                <Btn
                  variant="primary"
                  style={{ fontSize: 12 }}
                  onClick={() => setActiveSection("sessions")}
                >
                  📅 Schedule
                </Btn>
              )}
            </div>
          </div> */}

          {/* Page content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {renderSection()}
          </div>
        </div>

        <Toast msg={toastMsg} />
      </div>
    </>
  );
}
