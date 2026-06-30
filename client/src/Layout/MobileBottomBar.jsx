import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Home, MessageSquare, FileText, Play, User } from "lucide-react";

export default function MobileBottomBar() {
  const { pathname } = useLocation();
  const { user } = useSelector((state) => state.auth);

  // Determine dashboard link based on role
  const getProfileLink = () => {
    if (!user) return "/login";
    const hasAdminRole = user.roles?.includes("admin");
    const hasCustomRole = user.roles?.some((r) => typeof r === "object");
    const hasInstructorRole = user.roles?.includes("instructor");

    return hasAdminRole
      ? "/admin-dashboard"
      : hasCustomRole
        ? "/staff-dashboard"
        : hasInstructorRole
          ? "/instructor-dashboard"
          : "/student-dashboard/settings";
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/mobile/chat", label: "Chat", icon: MessageSquare },
    { path: "/mobile/notes", label: "Notes", icon: FileText },
    { path: "/mobile/reels", label: "Reels", icon: Play },
    { path: getProfileLink(), label: "Profile", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="w-full rounded-t-2xl border-t border-white/10 bg-slate-950/85 p-2 pb-safe-offset shadow-2xl backdrop-blur-xl flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition duration-200"
            >
              <div
                className={`flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-500/20 text-indigo-400 scale-110 shadow-lg shadow-indigo-500/10"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon size={20} className={isActive ? "animate-pulse" : ""} />
              </div>
              <span
                className={`text-[10px] mt-1 font-bold tracking-wide transition-all duration-300 ${
                  isActive ? "text-indigo-300 opacity-100 scale-105" : "text-slate-500 opacity-80"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
