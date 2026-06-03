import React, { useState } from "react";

// UI primitives & modal
import { Toast, AddCourseModal, Btn } from "./InstructorUi";

// Section components
import InstructorHome from "./InstructorHome";
import InstructorCourses from "./InstructorCourses";
import InstructorStudents from "./InstructorStudents";
import InstructorSessions from "./InstructorSessions";
import InstructorAnalytics from "./InstructorAnalytics";
import InstructorAI from "./InstructorAI";
import InstructorNotifications from "./InstructorNotifications";
import InstructorSettings from "./InstructorSettings";
import { createCourse } from "../../redux/slices/courseSlice";

// Data
import {
  courseData,
  initialSessions,
  initialNotifs,
  initialSettings,
  navItems,
  sectionTitles,
} from "./InstructorData";
import { useDispatch, useSelector } from "react-redux";

// ─── Main shell ───────────────────────────────────────────────────────────────
export default function InstructorDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sessions, setSessions] = useState(initialSessions);
  const [notifs, setNotifs] = useState(initialNotifs);
  const [settings, setSettings] = useState(initialSettings);
  const [toastMsg, setToastMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "",
    summary: "",
    category: "General",
    level: "Beginner",
    price: "",
    status: "published",
  });

  const dispatch = useDispatch();

  const unread = notifs.filter((n) => !n.read).length;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };
  const { courses } = useSelector((s) => s.courses);

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setCourseForm({
      title: "",
      summary: "",
      category: "General",
      level: "Beginner",
      price: "",
      status: "published",
    });
  };

  const addCourse = () => {
    if (!courseForm.title.trim()) {
      showToast("Enter a course title");
      return;
    }
    if (!courseForm.summary?.trim()) {
      showToast("Enter a course summary");
      return;
    }
    dispatch(
      createCourse({
        title: courseForm.title,
        summary: courseForm.summary,
        category: courseForm.category || "General",
        level: courseForm.level || "Beginner",
        price: Number(courseForm.price) || 0,
        published: courseForm.status === "published",
      }),
    );
    closeModal();
  };

  const handleNavClick = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };

  // ── Section router ─────────────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      // ── Change 1: pass onNavigate to InstructorHome ──
      case "dashboard":
        return (
          <InstructorHome showToast={showToast} onNavigate={handleNavClick} />
        );

        // ── Change 2: replace the Export button with a real download ──
        const handleExport = () => {
          // Build a simple CSV from courses in Redux state
          const { courses } = store.getState().courses; // or pass via props
          const rows = [
            ["Title", "Status", "Students", "Revenue", "Rating"],
            ...courses.map((c) => [
              c.title,
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
          a.download = `courses-report-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          showToast("Report downloaded");
        };
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
      case "ai":
        return <InstructorAI showToast={showToast} />;

      case "settings":
        return (
          <InstructorSettings
            settings={settings}
            setSettings={setSettings}
            showToast={showToast}
          />
        );
      default:
        return null;
    }
  };

  // ── Sidebar content (shared between desktop & mobile drawer) ──────────────
  const SidebarContent = () => {
    const { user } = useSelector((state) => state.auth);
    return (
      <>
        {/* Logo */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#f1f5f9",
            padding: "0 10px",
            marginBottom: 28,
          }}
        >
          Skill<span style={{ color: "#a78bfa" }}>Sphere</span>
        </div>

        {/* User pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px",
            background: "#1e293b",
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#7c3aed,#db2777)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0) || "SC"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
              {user?.name}
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: "auto" }}>
          {navItems.map(({ id, label }) => (
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
              {label}
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
        .instr-sidebar   { display: flex; }
        .instr-mob-bar   { display: none; }
        .instr-desk-bar  { display: flex; }
        .instr-drawer    { display: flex; }

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
        {/* ── Desktop sidebar ── */}
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

        {/* ── Mobile: backdrop ── */}
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

        {/* ── Mobile: slide-in drawer ── */}
        <aside
          className="instr-drawer"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: 240,
            background: "#0b1120",
            borderRight: "1px solid #1e293b",
            flexDirection: "column",
            padding: "20px 12px 24px",
            zIndex: 50,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.28s cubic-bezier(.4,0,.2,1)",
          }}
        >
          {/* Close button */}
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

        {/* ── Main content ── */}
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
              onClick={() => setSidebarOpen(true)}
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
              ☰ Menu
            </button>

            <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>
              {sectionTitles[activeSection]}
            </div>

            {/* Notification badge or spacer */}
            {/* <div
              style={{
                minWidth: 48,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              {unread > 0 ? (
                <button
                  onClick={() => handleNavClick("notifications")}
                  style={{
                    background: "#7c3aed",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "5px 9px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  🔔 {unread}
                </button>
              ) : (
                <span style={{ width: 48 }} />
              )}
            </div> */}
          </div>

          {/* Desktop top bar */}
          <div
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
              {sectionTitles[activeSection]}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn
                variant="ghost"
                style={{ fontSize: 12 }}
                onClick={() => {
                  if (!courses.length) {
                    showToast("No courses to export");
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
                  showToast("Report downloaded");
                }}
              >
                📥 Export
              </Btn>
              {["dashboard", "courses"].includes(activeSection) && (
                <Btn
                  variant="primary"
                  style={{ fontSize: 12 }}
                  onClick={openModal}
                >
                  + New Course
                </Btn>
              )}
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
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {renderSection()}
          </div>
        </div>

        {/* Add course modal */}
        <AddCourseModal
          visible={showModal}
          onClose={closeModal}
          courseForm={courseForm}
          setCourseForm={setCourseForm}
          onAdd={addCourse}
        />

        <Toast msg={toastMsg} />
      </div>
    </>
  );
}
