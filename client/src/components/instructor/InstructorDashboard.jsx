import React, { useEffect, useState } from "react";

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
    const handleScroll = () => {
      setScrollTop(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    setScrollTop(window.scrollY);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sidebarOpen]);

  const dynamicTop = sidebarOpen ? Math.max(0, 73 - scrollTop) : 0;
  const [courseForm, setCourseForm] = useState(EMPTY_FORM);

  const dispatch = useDispatch();
  const { courses } = useSelector((s) => s.courses);

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
    const allNavItems = navItems.some((n) => n.id === "mock-tests")
      ? navItems
      : (() => {
          // Insert mock-tests after "sessions"
          const idx = navItems.findIndex((n) => n.id === "sessions");
          const copy = [...navItems];
          copy.splice(idx + 1, 0, { id: "mock-tests", icon: "📝" });
          return copy;
        })();

    return (
      <>


        <nav style={{ flex: 1, overflowY: "auto" }}>
          {allNavItems.map(({ id, icon }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                textAlign: "left",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                background: activeSection === id ? "#2e1065" : "transparent",
                color: activeSection === id ? "#a78bfa" : "#64748b",
                marginBottom: 2,
                transition: "all 0.15s",
              }}
            >
              <span>
                {icon}{" "}
                {id === "mock-tests"
                  ? t("instructorSidebar.mockTests")
                  : t(`instructorSidebar.${id}`)}
              </span>

              {id === "notifications" && unread > 0 && (
                <span
                  style={{
                    background: "#7c3aed",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 10,
                  }}
                >
                  {unread}
                </span>
              )}
            </button>
          ))}
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
          className="instr-sidebar"
          style={{
            width: 230,
            background: "#0b1120",
            borderRight: "1px solid #1e293b",
            flexDirection: "column",
            padding: "24px 12px",
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
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(2,8,23,0.75)",
              zIndex: 40,
              backdropFilter: "blur(2px)",
            }}
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={`bg-[#0b1120] border-r border-slate-800 flex-col transition-all duration-300 z-50 p-5 md:hidden
            ${
              sidebarOpen
                ? "fixed bottom-[82px] left-0 w-[220px] shadow-2xl flex"
                : "hidden"
            }
          `}
          style={sidebarOpen ? { top: `${dynamicTop}px` } : undefined}
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
              marginBottom: 12,
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
