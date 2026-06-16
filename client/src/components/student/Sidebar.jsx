// components/student/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useState } from "react";

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

  const navItemsTop = [
    {
      label: t("studentSidebar.overview"),
      to: "/student-dashboard",
      end: true,
      icon: "📊",
    },
    {
      label: t("studentSidebar.myCourses"),
      to: "/student-dashboard/my-courses",
      icon: "📚",
    },
    {
      label: t("studentSidebar.aiTutor"),
      to: "/student-dashboard/ai-tutor",
      icon: "🤖",
    },
    ...(isPremium
      ? [
          {
            label: t("studentSidebar.sessions"),
            to: "/student-dashboard/sessions",
            icon: "🎥",
          },
        ]
      : []),
    {
      label: t("studentSidebar.certificates"),
      to: "/student-dashboard/certificates",
      icon: "🏅",
    },
    {
      label: t("studentSidebar.leaderboard"),
      to: "/student-dashboard/leaderboard",
      icon: "🏆",
    },
    {
      label: t("studentSidebar.referral"),
      to: "/student-dashboard/referral",
      icon: "🎁",
    },
    {
      label: t("studentSidebar.progress"),
      to: "/student-dashboard/progress",
      icon: "📈",
    },
    { label: "Wallet", to: "/student-dashboard/wallet", icon: "👛" },
  ];

  const navItemsBottom = [
    {
      label: t("studentSidebar.settings"),
      to: "/student-dashboard/settings",
      icon: "⚙️",
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
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
        ${collapsed ? "justify-center" : ""}
        ${isActive ? "bg-[#2e1065] text-[#a78bfa]" : "text-[#64748b] hover:text-white hover:bg-[#1e293b]"}`
      }
      onClick={() => mobileOpen && setMobileOpen(false)}
    >
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
        {item.icon}
      </span>
      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
    </NavLink>
  );

  const MockTestsSection = () =>
    collapsed ? (
      <NavLink
        to="/student-dashboard/mock-tests"
        title="Mock Tests"
        className={({ isActive }) =>
          `flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-150
          ${isActive ? "bg-[#2e1065] text-[#a78bfa]" : "text-[#64748b] hover:text-white hover:bg-[#1e293b]"}`
        }
        onClick={() => mobileOpen && setMobileOpen(false)}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>📝</span>
      </NavLink>
    ) : (
      <div>
        <button
          onClick={() => setMockTestsOpen((v) => !v)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
            ${mockTestsOpen ? "bg-[#1e293b] text-slate-200" : "text-[#64748b] hover:text-white hover:bg-[#1e293b]"}`}
        >
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>📝</span>
          <span className="text-sm font-medium flex-1 text-left">
            {t("studentSidebar.mockTests")}
          </span>
          <span style={{ fontSize: 10, color: "#64748b" }}>
            {mockTestsOpen ? "▲" : "▼"}
          </span>
        </button>

        {mockTestsOpen && (
          <div className="mt-1 ml-3 pl-3 border-l border-[#2a3a54] flex flex-col gap-0.5">
            {mockTestSubNav.map((sub) => (
              <NavLink
                key={sub.to}
                to={sub.to}
                end={sub.end}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150
                  ${isActive ? "bg-[#2e1065] text-[#a78bfa]" : "text-[#64748b] hover:text-white hover:bg-[#1e293b]"}`
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
        className={`flex items-center gap-3 p-3 mb-4 rounded-xl bg-[#1e293b] ${collapsed ? "justify-center" : ""}`}
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

      {/* Nav items — scrollable middle */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto px-1">
        {navItemsTop.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
        <MockTestsSection />
        {navItemsBottom.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
