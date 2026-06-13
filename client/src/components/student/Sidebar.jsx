// components/student/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaHome,
  FaBookOpen,
  FaRobot,
  FaUsers,
  FaTrophy,
  FaCog,
  FaClipboardList,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { GrCertificate } from "react-icons/gr";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

const mockTestSubNav = [
  { label: "Available Tests", to: "/student-dashboard/mock-tests", end: true },
  { label: "Results & Analytics", to: "/student-dashboard/mock-tests/results" },
  { label: "Leaderboard", to: "/student-dashboard/mock-tests/leaderboard" },
];

const Sidebar = ({
  user,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { t } = useTranslation();
  const subscription = useSelector((state) => state.billing.subscription);
  const isPremium = subscription?.plan === "premium";

  const [mockTestsOpen, setMockTestsOpen] = useState(false);

  // Items ABOVE mock tests
  const navItemsTop = [
    {
      label: t("studentSidebar.overview"),
      to: "/student-dashboard",
      end: true,
      icon: FaHome,
    },
    {
      label: t("studentSidebar.myCourses"),
      to: "/student-dashboard/my-courses",
      icon: FaBookOpen,
    },
    {
      label: t("studentSidebar.aiTutor"),
      to: "/student-dashboard/ai-tutor",
      icon: FaRobot,
    },
    ...(isPremium
      ? [
          {
            label: t("studentSidebar.sessions"),
            to: "/student-dashboard/sessions",
            icon: FaUsers,
          },
        ]
      : []),
    {
      label: t("studentSidebar.certificates"),
      to: "/student-dashboard/certificates",
      icon: GrCertificate,
    },
    {
      label: t("studentSidebar.leaderboard"),
      to: "/student-dashboard/leaderboard",
      icon: FaTrophy,
    },
  ];

  // Items BELOW mock tests
  const navItemsBottom = [
    {
      label: t("studentSidebar.settings"),
      to: "/student-dashboard/settings",
      icon: FaCog,
    },
  ];

  const activeUser = user;
  const initials = activeUser?.email ? activeUser.email[0].toUpperCase() : "S";
  const username = activeUser?.name
    ? activeUser.name
    : activeUser?.email
      ? activeUser.email.split("@")[0]
      : "Student";

  const sidebarClass = `
    bg-[#0b1120]
    border-r border-[#1e293b]
    flex flex-col
    p-3
    z-40
    ${collapsed ? "w-[68px] min-w-[68px]" : "w-[230px] min-w-[230px]"}
    ${mobileOpen ? "fixed top-0 left-0 h-screen shadow-2xl" : "hidden md:flex"}
  `;

  const NavItem = ({ item }) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
          collapsed ? "justify-center" : ""
        } ${
          isActive
            ? "bg-[#2e1065] text-[#a78bfa]"
            : "text-[#64748b] hover:text-white hover:bg-[#1e293b]"
        }`
      }
      onClick={() => mobileOpen && setMobileOpen(false)}
    >
      <item.icon className="shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
    </NavLink>
  );

  const MockTestsSection = () =>
    collapsed ? (
      <NavLink
        to="/student-dashboard/mock-tests"
        title="Mock Tests"
        className={({ isActive }) =>
          `flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-150 ${
            isActive
              ? "bg-[#2e1065] text-[#a78bfa]"
              : "text-[#64748b] hover:text-white hover:bg-[#1e293b]"
          }`
        }
        onClick={() => mobileOpen && setMobileOpen(false)}
      >
        <FaClipboardList className="shrink-0" />
      </NavLink>
    ) : (
      <div>
        <button
          onClick={() => setMockTestsOpen((v) => !v)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
            mockTestsOpen
              ? "bg-[#1e293b] text-slate-200"
              : "text-[#64748b] hover:text-white hover:bg-[#1e293b]"
          }`}
        >
          <FaClipboardList className="shrink-0" />
          <span className="text-sm font-medium flex-1 text-left">
            Mock Tests
          </span>
          {mockTestsOpen ? (
            <FaChevronUp className="text-[10px] text-slate-500" />
          ) : (
            <FaChevronDown className="text-[10px] text-slate-500" />
          )}
        </button>
        {mockTestsOpen && (
          <div className="mt-1 ml-3 pl-3 border-l border-[#2a3a54] flex flex-col gap-0.5">
            {mockTestSubNav.map((sub) => (
              <NavLink
                key={sub.to}
                to={sub.to}
                end={sub.end}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#2e1065] text-[#a78bfa]"
                      : "text-[#64748b] hover:text-white hover:bg-[#1e293b]"
                  }`
                }
                onClick={() => mobileOpen && setMobileOpen(false)}
              >
                {sub.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );

  return (
    <aside className={sidebarClass}>
      {/* User card */}
      <div
        className={`flex items-center gap-3 p-3 mb-6 rounded-xl bg-[#1e293b] ${collapsed ? "justify-center" : ""}`}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initials}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-100 truncate">
              {username}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto px-1 pb-4">
        {/* Top nav items */}
        {navItemsTop.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}

        {/* Mock Tests (above Settings) */}
        <MockTestsSection />

        {/* Bottom nav items (Settings) */}
        {navItemsBottom.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
