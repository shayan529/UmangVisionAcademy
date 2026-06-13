// pages/student/MockTests/index.jsx
// This is the route index — renders Outlet with a sub-nav for mock tests
import { NavLink, Outlet } from "react-router-dom";
import { FaClipboardList, FaChartBar, FaTrophy } from "react-icons/fa";

const subNav = [
  {
    label: "Available Tests",
    to: "/student-dashboard/mock-tests",
    icon: FaClipboardList,
    end: true,
  },
  {
    label: "Results & Analytics",
    to: "/student-dashboard/mock-tests/results",
    icon: FaChartBar,
  },
  {
    label: "Leaderboard",
    to: "/student-dashboard/mock-tests/leaderboard",
    icon: FaTrophy,
  },
];

export default function MockTestsLayout() {
  return (
    <div className="min-h-screen bg-[#060d1a]">
      {/* Sub-nav strip */}
      <div className="bg-[#0b1628] border-b border-[#1a2e48] px-4 md:px-8">
        <div className="flex gap-1 overflow-x-auto">
          {subNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`
              }
            >
              <item.icon className="text-xs" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Page content */}
      <Outlet />
    </div>
  );
}
