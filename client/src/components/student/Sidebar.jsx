import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Icon } from "lucide-react";
import {
  FaHome,
  FaBookOpen,
  FaRobot,
  FaUsers,
  FaTrophy,
  FaCog,
} from "react-icons/fa";
import { GrCertificate } from "react-icons/gr";

const Sidebar = ({
  user,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const navItems = [
    {
      label: "Overview",
      to: "/student-dashboard",
      end: true,
      icon: FaHome,
    },
    {
      label: "My Courses",
      to: "/student-dashboard/my-courses",
      icon: FaBookOpen,
    },
    {
      label: "AI Tutor",
      to: "/student-dashboard/ai-tutor",
      icon: FaRobot,
    },
    {
      label: "Sessions",
      to: "/student-dashboard/sessions",
      icon: FaUsers,
    },
    {
      label: "Certificates",
      to: "/student-dashboard/certificates",
      icon: GrCertificate,
    },
    {
      label: "Leaderboard",
      to: "/student-dashboard/leaderboard",
      icon: FaTrophy,
    },
    {
      label: "Settings",
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

  const roleLabel = activeUser?.roles?.length
    ? `${activeUser.roles[0].charAt(0).toUpperCase()}${activeUser.roles[0].slice(1)}`
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
  return (
    <aside className={sidebarClass}>
      {/* <div
        className={`font-extrabold text-[20px] text-white mb-7 ${
          collapsed ? "text-center" : "px-2"
        }`}
      >
        {!collapsed && (
          <>
            Skill<span className="text-[#a78bfa]">Sphere</span>
          </>
        )}
      </div> */}

      <div
        className={`flex items-center gap-3 p-3 mb-6 rounded-xl bg-[#1e293b] ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>

        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-slate-100">{username}</div>
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
            <item.icon />
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
