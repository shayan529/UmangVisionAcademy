import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useState } from "react";
import { Icon } from "lucide-react";

const Sidebar = ({
  user,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const navItems = [
    { label: "Overview", to: "/student-dashboard", end: true, icon: "overview" },

    { label: "My Courses", to: "/student-dashboard/my-courses", icon: "myCourses" },
    { label: "AI Tutor", to: "/student-dashboard/ai-tutor", icon: "ai" },
    { label: "Community", to: "/student-dashboard/community", icon: "community" },
    {
      label: "Certificates",
      to: "/student-dashboard/certificates",
      icon: "certificates",
    },
    { label: "Leaderboard", to: "/student-dashboard/leaderboard", icon: "leaderboard" },
    { label: "Settings", to: "/student-dashboard/settings", icon: "settings" },
  ];

  const Icon = ({ d, size = 18 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );

  const Icons = {
    overview: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
    courses: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    myCourses:
      "M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z",
    ai: "M12 2a4 4 0 014 4M8 6a4 4 0 014-4M9 22H7a2 2 0 01-2-2v-1a6 6 0 0112 0v1a2 2 0 01-2 2h-2m-2 0v-8",
    community:
      "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    certificates:
      "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
    settings:
      "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
    leaderboard: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  };

  const storedUser =
    typeof window !== "undefined" && localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null;
  const activeUser = user || storedUser;
  const initials = activeUser?.email ? activeUser.email[0].toUpperCase() : "S";
  const username = activeUser?.name
    ? activeUser.name
    : activeUser?.email
      ? activeUser.email.split("@")[0]
      : "Student";
  const roleLabel = activeUser?.role
    ? `${activeUser.role.charAt(0).toUpperCase()}${activeUser.role.slice(1)}`
    : "Student";

  const sidebarClass = `bg-[#0b1120] border-r border-slate-800 flex flex-col transition-all duration-300 z-40 ${
  collapsed ? "w-[68px] min-w-[68px]" : "w-[220px] min-w-[220px]"
} ${
  mobileOpen
    ? "fixed top-[72px] left-0 h-[calc(100vh-72px)] shadow-2xl md:relative md:top-0 md:h-auto md:shadow-none"
    : "hidden md:flex"
}`;
  return (
    <aside className={sidebarClass}>
      <div className="flex items-center justify-between mb-5 px-1">
        {!collapsed && (
          <span className="text-base font-bold text-[#a78bfa] whitespace-nowrap">
            Learn<span className="text-white">Sphere</span>
          </span>
        )}
        <button
          onClick={() => {
            setCollapsed((c) => !c);
            if (mobileOpen) setMobileOpen(false);
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-9 w-9 hidden md:flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            {collapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      <div
        className={`flex items-center gap-3 rounded-2xl p-3 mb-5 ${
          collapsed ? "justify-center" : "justify-start"
        } bg-slate-900`}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-pink-500 text-sm font-bold text-white">
          {initials}
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="truncate text-sm font-semibold text-white">
              {username}
            </div>
            <div className="text-[11px] text-slate-400">{roleLabel}</div>
          </div>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto px-1 pb-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200 ${
                collapsed ? "justify-center" : "justify-start"
              } ${
                isActive
                  ? "bg-slate-800 text-indigo-300"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
            onClick={() => mobileOpen && setMobileOpen(false)}
          >
            <Icon d={Icons[item.icon]} size={18} />
            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
